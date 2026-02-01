/**
 * Revenue Calculator Module
 * Dynamic calculator with data loaded from JSON
 */

const Calculator = (function() {
    'use strict';

    // Calculator data (loaded from JSON or fallback)
    let calcData = null;

    // Default data (fallback if JSON fails to load)
    const defaultData = {
        fees: {
            platformFee: 0.15,
            managementFee: 0.18
        },
        types: {
            studio: { name: 'Studio', baseRate: 280, occupancy: 0.50 },
            '1q': { name: '1 Quarto', baseRate: 350, occupancy: 0.50 },
            '2q': { name: '2 Quartos', baseRate: 450, occupancy: 0.48 },
            '3q': { name: '3+ Quartos', baseRate: 600, occupancy: 0.45 }
        },
        regions: {
            centro: { name: 'Centro / Porto Maravilha', multiplier: 1.0 },
            lapa: { name: 'Lapa / Santa Teresa', multiplier: 1.05 },
            catete: { name: 'Catete / Flamengo', multiplier: 1.1 },
            copacabana: { name: 'Copacabana', multiplier: 1.3 },
            ipanema: { name: 'Ipanema / Leblon', multiplier: 1.5 }
        }
    };

    // DOM Elements cache
    const elements = {};

    /**
     * Initialize the calculator
     */
    async function init() {
        cacheElements();
        await loadData();
        bindEvents();
    }

    /**
     * Cache DOM elements for performance
     */
    function cacheElements() {
        elements.tipo = document.getElementById('calcTipo');
        elements.regiao = document.getElementById('calcRegiao');
        elements.aluguel = document.getElementById('calcAluguel');
        elements.result = document.getElementById('calcResult');
        elements.resultReceita = document.getElementById('resultReceita');
        elements.resultDetalhe = document.getElementById('resultDetalhe');
        elements.resultTradicional = document.getElementById('resultTradicional');
        elements.resultTemporada = document.getElementById('resultTemporada');
        elements.resultGanho = document.getElementById('resultGanho');
        elements.breakdownBruto = document.getElementById('breakdownBruto');
        elements.breakdownPlataforma = document.getElementById('breakdownPlataforma');
        elements.breakdownComissao = document.getElementById('breakdownComissao');
        elements.breakdownLiquido = document.getElementById('breakdownLiquido');
        elements.calcButton = document.querySelector('[data-calc-button]');
    }

    /**
     * Load calculator data from JSON
     */
    async function loadData() {
        try {
            const response = await fetch('./assets/data/calculator-data.json');
            if (response.ok) {
                calcData = await response.json();
                console.log('Calculator data loaded successfully');
            } else {
                throw new Error('Failed to load data');
            }
        } catch (error) {
            console.warn('Using default calculator data:', error.message);
            calcData = defaultData;
        }
    }

    /**
     * Bind event listeners
     */
    function bindEvents() {
        if (elements.calcButton) {
            elements.calcButton.addEventListener('click', calculate);
        }

        // Auto-calculate on input change (optional UX enhancement)
        [elements.tipo, elements.regiao, elements.aluguel].forEach(el => {
            if (el) {
                el.addEventListener('change', () => {
                    if (elements.result && elements.result.classList.contains('active')) {
                        calculate();
                    }
                });
            }
        });
    }

    /**
     * Format currency for display
     */
    function formatCurrency(value) {
        return `R$ ${value.toLocaleString('pt-BR')}`;
    }

    /**
     * Calculate revenue
     */
    function calculate() {
        if (!calcData) {
            console.error('Calculator data not loaded');
            return;
        }

        // Get input values
        const tipo = elements.tipo?.value || 'studio';
        const regiao = elements.regiao?.value || 'centro';
        const aluguelTradicional = parseFloat(elements.aluguel?.value) || 2000;

        // Validate inputs
        if (aluguelTradicional < 500 || aluguelTradicional > 50000) {
            alert('Por favor, insira um valor de aluguel entre R$ 500 e R$ 50.000');
            return;
        }

        // Get data for calculation
        const tipoData = calcData.types[tipo] || defaultData.types.studio;
        const regiaoData = calcData.regions[regiao] || defaultData.regions.centro;
        const fees = calcData.fees || defaultData.fees;

        // Calculate values
        const diaria = Math.round(tipoData.baseRate * regiaoData.multiplier);
        const ocupacao = tipoData.occupancy;
        const diasMes = 30;

        const receitaBruta = Math.round(diaria * ocupacao * diasMes);
        const taxaPlataforma = Math.round(receitaBruta * fees.platformFee);
        const comissao = Math.round(receitaBruta * fees.managementFee);
        const receitaLiquida = receitaBruta - taxaPlataforma - comissao;

        const ganhoPercent = Math.round(((receitaLiquida / aluguelTradicional) - 1) * 100);

        // Update UI
        updateUI({
            receitaLiquida,
            diaria,
            ocupacao,
            aluguelTradicional,
            ganhoPercent,
            receitaBruta,
            taxaPlataforma,
            comissao
        });

        // Track event (if analytics enabled)
        trackCalculation({ tipo, regiao, aluguelTradicional, receitaLiquida });
    }

    /**
     * Update UI with calculated values
     */
    function updateUI(data) {
        const {
            receitaLiquida,
            diaria,
            ocupacao,
            aluguelTradicional,
            ganhoPercent,
            receitaBruta,
            taxaPlataforma,
            comissao
        } = data;

        // Main result
        if (elements.resultReceita) {
            elements.resultReceita.textContent = formatCurrency(receitaLiquida);
        }

        if (elements.resultDetalhe) {
            elements.resultDetalhe.textContent = `Ocupacao: ${Math.round(ocupacao * 100)}% | Diaria: ${formatCurrency(diaria)}`;
        }

        // Comparison
        if (elements.resultTradicional) {
            elements.resultTradicional.textContent = formatCurrency(aluguelTradicional);
        }

        if (elements.resultTemporada) {
            elements.resultTemporada.textContent = formatCurrency(receitaLiquida);
        }

        // Gain percentage
        if (elements.resultGanho) {
            elements.resultGanho.textContent = ganhoPercent >= 0
                ? `+${ganhoPercent}% de receita potencial`
                : `${ganhoPercent}% (considere aluguel tradicional)`;
            elements.resultGanho.style.color = ganhoPercent >= 0 ? 'var(--success)' : 'var(--danger)';
        }

        // Breakdown
        if (elements.breakdownBruto) {
            elements.breakdownBruto.textContent = formatCurrency(receitaBruta);
        }

        if (elements.breakdownPlataforma) {
            elements.breakdownPlataforma.textContent = `- ${formatCurrency(taxaPlataforma)}`;
        }

        if (elements.breakdownComissao) {
            elements.breakdownComissao.textContent = `- ${formatCurrency(comissao)}`;
        }

        if (elements.breakdownLiquido) {
            elements.breakdownLiquido.textContent = formatCurrency(receitaLiquida);
        }

        // Show result section
        if (elements.result) {
            elements.result.classList.add('active');
        }
    }

    /**
     * Track calculation event for analytics
     */
    function trackCalculation(data) {
        // Google Analytics 4
        if (typeof gtag === 'function') {
            gtag('event', 'calculate_revenue', {
                property_type: data.tipo,
                region: data.regiao,
                traditional_rent: data.aluguelTradicional,
                estimated_revenue: data.receitaLiquida
            });
        }

        // Facebook Pixel
        if (typeof fbq === 'function') {
            fbq('track', 'Lead', {
                content_name: 'Revenue Calculator',
                value: data.receitaLiquida,
                currency: 'BRL'
            });
        }

        console.log('Calculation tracked:', data);
    }

    /**
     * Get current data (for debugging/testing)
     */
    function getData() {
        return calcData;
    }

    // Public API
    return {
        init,
        calculate,
        getData
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Calculator.init();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Calculator;
}
