/**
 * Site Configuration
 * Centralized configuration for easy maintenance
 */

const SiteConfig = {
    // Contact Information
    contact: {
        whatsapp: {
            number: '5521999999999', // UPDATE: Replace with real number
            display: '(21) 99999-9999',
            defaultMessage: 'Ola! Quero saber mais sobre gestao de Airbnb para meu imovel.'
        },
        email: 'contato@gestaoportorio.com.br'
    },

    // Business Rules
    business: {
        setupFee: 400,
        commissionRate: 0.18,
        platformFee: 0.15,
        maintenanceLimit: 300,
        minContractMonths: 3
    },

    // Validation Rules
    validation: {
        phone: {
            pattern: /^\(\d{2}\) \d{4,5}-\d{4}$/,
            message: 'Formato: (21) 99999-9999'
        },
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Email invalido'
        },
        minNameLength: 3,
        minAddressLength: 10
    },

    // API Endpoints (for future backend integration)
    api: {
        formSubmit: '/api/leads',
        enabled: false
    },

    // Analytics
    analytics: {
        googleAnalyticsId: '', // UPDATE: Add GA4 ID
        facebookPixelId: '',   // UPDATE: Add FB Pixel ID
        enabled: false
    }
};

// Freeze config to prevent modifications
Object.freeze(SiteConfig);
Object.freeze(SiteConfig.contact);
Object.freeze(SiteConfig.business);
Object.freeze(SiteConfig.validation);
Object.freeze(SiteConfig.api);
Object.freeze(SiteConfig.analytics);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SiteConfig;
}
