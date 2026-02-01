/**
 * Form Handler Module
 * Handles form validation, submission, and WhatsApp integration
 */

const FormHandler = (function() {
    'use strict';

    // DOM Elements
    let form = null;
    let successMessage = null;

    // Validation rules
    const validationRules = {
        nome: {
            required: true,
            minLength: 3,
            message: 'Nome deve ter pelo menos 3 caracteres'
        },
        whatsapp: {
            required: true,
            pattern: /^\(\d{2}\) \d{4,5}-\d{4}$/,
            message: 'Formato invalido. Use: (21) 99999-9999'
        },
        email: {
            required: false,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Email invalido'
        },
        endereco: {
            required: true,
            minLength: 10,
            message: 'Endereco deve ter pelo menos 10 caracteres'
        }
    };

    // Error state tracking
    const errorStates = {};

    /**
     * Initialize form handler
     */
    function init() {
        form = document.getElementById('contactForm');
        successMessage = document.getElementById('formSuccess');

        if (!form) {
            console.warn('Contact form not found');
            return;
        }

        bindEvents();
        setupPhoneMask();
        setupRealTimeValidation();
    }

    /**
     * Bind form events
     */
    function bindEvents() {
        form.addEventListener('submit', handleSubmit);
    }

    /**
     * Setup phone number mask
     */
    function setupPhoneMask() {
        const phoneInput = document.getElementById('whatsapp');
        if (!phoneInput) return;

        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');

            // Limit to 11 digits
            if (value.length > 11) {
                value = value.slice(0, 11);
            }

            // Apply mask
            if (value.length > 6) {
                value = `(${value.slice(0,2)}) ${value.slice(2,7)}-${value.slice(7)}`;
            } else if (value.length > 2) {
                value = `(${value.slice(0,2)}) ${value.slice(2)}`;
            } else if (value.length > 0) {
                value = `(${value}`;
            }

            e.target.value = value;
        });

        // Prevent non-numeric input
        phoneInput.addEventListener('keypress', function(e) {
            if (!/[\d\(\)\-\s]/.test(e.key) && e.key !== 'Backspace') {
                e.preventDefault();
            }
        });
    }

    /**
     * Setup real-time validation on blur
     */
    function setupRealTimeValidation() {
        Object.keys(validationRules).forEach(fieldName => {
            const input = document.getElementById(fieldName);
            if (input) {
                input.addEventListener('blur', () => validateField(fieldName));
                input.addEventListener('input', () => clearError(fieldName));
            }
        });
    }

    /**
     * Validate a single field
     */
    function validateField(fieldName) {
        const input = document.getElementById(fieldName);
        const rules = validationRules[fieldName];

        if (!input || !rules) return true;

        const value = input.value.trim();

        // Required check
        if (rules.required && !value) {
            showError(fieldName, 'Este campo e obrigatorio');
            return false;
        }

        // Skip further validation if empty and not required
        if (!value && !rules.required) {
            clearError(fieldName);
            return true;
        }

        // Min length check
        if (rules.minLength && value.length < rules.minLength) {
            showError(fieldName, rules.message);
            return false;
        }

        // Pattern check
        if (rules.pattern && !rules.pattern.test(value)) {
            showError(fieldName, rules.message);
            return false;
        }

        clearError(fieldName);
        return true;
    }

    /**
     * Validate entire form
     */
    function validateForm() {
        let isValid = true;

        Object.keys(validationRules).forEach(fieldName => {
            if (!validateField(fieldName)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Show error for a field
     */
    function showError(fieldName, message) {
        const input = document.getElementById(fieldName);
        if (!input) return;

        // Add error class to input
        input.classList.add('form-input--error');
        input.setAttribute('aria-invalid', 'true');

        // Find or create error message element
        let errorEl = input.parentElement.querySelector('.form-error');
        if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'form-error';
            errorEl.setAttribute('role', 'alert');
            input.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;

        errorStates[fieldName] = true;
    }

    /**
     * Clear error for a field
     */
    function clearError(fieldName) {
        const input = document.getElementById(fieldName);
        if (!input) return;

        input.classList.remove('form-input--error');
        input.removeAttribute('aria-invalid');

        const errorEl = input.parentElement.querySelector('.form-error');
        if (errorEl) {
            errorEl.remove();
        }

        delete errorStates[fieldName];
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(e) {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            // Focus first error field
            const firstError = Object.keys(errorStates)[0];
            if (firstError) {
                document.getElementById(firstError)?.focus();
            }
            return;
        }

        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        try {
            // Try to send to backend API first (if enabled)
            const apiSent = await sendToAPI(data);

            // Always open WhatsApp as primary action
            openWhatsApp(data);

            // Show success
            showSuccess();

            // Track conversion
            trackFormSubmission(data);

        } catch (error) {
            console.error('Form submission error:', error);

            // Still open WhatsApp as fallback
            openWhatsApp(data);
            showSuccess();

        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    /**
     * Send data to backend API
     */
    async function sendToAPI(data) {
        // Check if API is enabled
        if (typeof SiteConfig !== 'undefined' && SiteConfig.api?.enabled) {
            const response = await fetch(SiteConfig.api.formSubmit, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...data,
                    timestamp: new Date().toISOString(),
                    source: 'landing_page'
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            return true;
        }

        return false;
    }

    /**
     * Open WhatsApp with formatted message
     */
    function openWhatsApp(data) {
        // Get WhatsApp number from config or default
        const whatsappNumber = (typeof SiteConfig !== 'undefined' && SiteConfig.contact?.whatsapp?.number)
            || '5521999999999';

        // Build message
        let message = `*Nova Solicitacao - Gestao Porto Rio*\n\n`;
        message += `*Nome:* ${data.nome}\n`;
        message += `*WhatsApp:* ${data.whatsapp}\n`;

        if (data.email) {
            message += `*Email:* ${data.email}\n`;
        }

        message += `*Endereco:* ${data.endereco}\n`;

        if (data.tipo) {
            message += `*Tipo:* ${data.tipo}\n`;
        }

        if (data.situacao) {
            message += `*Situacao:* ${data.situacao}\n`;
        }

        if (data.aluguel) {
            message += `*Aluguel tradicional:* R$ ${data.aluguel}\n`;
        }

        if (data.mensagem) {
            message += `*Observacoes:* ${data.mensagem}\n`;
        }

        message += `\n_Enviado via landing page em ${new Date().toLocaleDateString('pt-BR')}_`;

        // Open WhatsApp
        const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    /**
     * Show success message
     */
    function showSuccess() {
        if (form && successMessage) {
            form.style.display = 'none';
            successMessage.classList.add('active');
        }
    }

    /**
     * Reset form to initial state
     */
    function reset() {
        if (form && successMessage) {
            form.reset();
            form.style.display = 'grid';
            successMessage.classList.remove('active');

            // Clear all error states
            Object.keys(errorStates).forEach(clearError);
        }
    }

    /**
     * Track form submission for analytics
     */
    function trackFormSubmission(data) {
        // Google Analytics 4
        if (typeof gtag === 'function') {
            gtag('event', 'generate_lead', {
                property_type: data.tipo || 'not_specified',
                property_status: data.situacao || 'not_specified'
            });
        }

        // Facebook Pixel
        if (typeof fbq === 'function') {
            fbq('track', 'Lead', {
                content_name: 'Contact Form',
                property_type: data.tipo
            });
        }

        console.log('Form submission tracked:', { type: data.tipo, status: data.situacao });
    }

    // Public API
    return {
        init,
        validateForm,
        reset
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    FormHandler.init();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormHandler;
}
