/**
 * Main Application Module
 * Core functionality: navigation, FAQ, mobile menu, analytics
 */

const App = (function() {
    'use strict';

    // DOM Elements
    const elements = {};

    /**
     * Initialize application
     */
    function init() {
        cacheElements();
        initMobileMenu();
        initFAQ();
        initSmoothScroll();
        initAnalytics();
        initAccessibility();

        console.log('Gestao Porto Rio - App initialized');
    }

    /**
     * Cache frequently used DOM elements
     */
    function cacheElements() {
        elements.mobileMenu = document.getElementById('mobileMenu');
        elements.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        elements.header = document.querySelector('.header');
        elements.faqItems = document.querySelectorAll('.faq-item');
    }

    /**
     * Mobile Menu functionality
     */
    function initMobileMenu() {
        // Toggle button click
        if (elements.mobileMenuBtn) {
            elements.mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        }

        // Close on link click
        document.querySelectorAll('.mobile-menu-links a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // Close on resize
        window.addEventListener('resize', debounce(() => {
            if (window.innerWidth >= 768) {
                closeMobileMenu();
            }
        }, 100));

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.mobileMenu?.classList.contains('active')) {
                closeMobileMenu();
            }
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (elements.mobileMenu?.classList.contains('active')) {
                if (!elements.mobileMenu.contains(e.target) &&
                    !elements.mobileMenuBtn?.contains(e.target)) {
                    closeMobileMenu();
                }
            }
        });
    }

    /**
     * Toggle mobile menu
     */
    function toggleMobileMenu() {
        if (elements.mobileMenu) {
            const isOpen = elements.mobileMenu.classList.toggle('active');

            // Update ARIA
            elements.mobileMenuBtn?.setAttribute('aria-expanded', isOpen);

            // Prevent body scroll when menu is open
            document.body.style.overflow = isOpen ? 'hidden' : '';
        }
    }

    /**
     * Close mobile menu
     */
    function closeMobileMenu() {
        if (elements.mobileMenu) {
            elements.mobileMenu.classList.remove('active');
            elements.mobileMenuBtn?.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    }

    /**
     * FAQ Accordion functionality
     */
    function initFAQ() {
        elements.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            if (question) {
                question.addEventListener('click', () => toggleFAQ(item));

                // Keyboard accessibility
                question.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleFAQ(item);
                    }
                });
            }
        });
    }

    /**
     * Toggle FAQ item
     */
    function toggleFAQ(item) {
        const wasActive = item.classList.contains('active');

        // Close all others (accordion behavior)
        elements.faqItems.forEach(faq => {
            faq.classList.remove('active');
            const answer = faq.querySelector('.faq-answer');
            if (answer) {
                answer.setAttribute('aria-hidden', 'true');
            }
        });

        // Toggle clicked item
        if (!wasActive) {
            item.classList.add('active');
            const answer = item.querySelector('.faq-answer');
            if (answer) {
                answer.setAttribute('aria-hidden', 'false');
            }
        }
    }

    /**
     * Smooth scroll for anchor links
     */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');

                // Skip if just "#"
                if (href === '#') return;

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();

                    // Calculate offset (header height)
                    const headerHeight = elements.header?.offsetHeight || 64;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    // Update URL without jumping
                    history.pushState(null, null, href);

                    // Focus target for accessibility
                    target.setAttribute('tabindex', '-1');
                    target.focus({ preventScroll: true });
                }
            });
        });
    }

    /**
     * Initialize Analytics
     */
    function initAnalytics() {
        // Check if analytics is enabled
        if (typeof SiteConfig !== 'undefined' && SiteConfig.analytics?.enabled) {
            // Google Analytics 4
            if (SiteConfig.analytics.googleAnalyticsId) {
                initGoogleAnalytics(SiteConfig.analytics.googleAnalyticsId);
            }

            // Facebook Pixel
            if (SiteConfig.analytics.facebookPixelId) {
                initFacebookPixel(SiteConfig.analytics.facebookPixelId);
            }
        }

        // Track scroll depth
        trackScrollDepth();

        // Track CTA clicks
        trackCTAClicks();
    }

    /**
     * Initialize Google Analytics 4
     */
    function initGoogleAnalytics(measurementId) {
        if (!measurementId) return;

        // Load gtag script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { dataLayer.push(arguments); };
        gtag('js', new Date());
        gtag('config', measurementId, {
            page_title: document.title,
            page_location: window.location.href
        });
    }

    /**
     * Initialize Facebook Pixel
     */
    function initFacebookPixel(pixelId) {
        if (!pixelId) return;

        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');

        fbq('init', pixelId);
        fbq('track', 'PageView');
    }

    /**
     * Track scroll depth
     */
    function trackScrollDepth() {
        const thresholds = [25, 50, 75, 100];
        const tracked = new Set();

        window.addEventListener('scroll', debounce(() => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );

            thresholds.forEach(threshold => {
                if (scrollPercent >= threshold && !tracked.has(threshold)) {
                    tracked.add(threshold);

                    if (typeof gtag === 'function') {
                        gtag('event', 'scroll_depth', {
                            percent: threshold
                        });
                    }
                }
            });
        }, 100));
    }

    /**
     * Track CTA button clicks
     */
    function trackCTAClicks() {
        document.querySelectorAll('[data-track-cta]').forEach(button => {
            button.addEventListener('click', () => {
                const ctaName = button.getAttribute('data-track-cta') || 'unknown';

                if (typeof gtag === 'function') {
                    gtag('event', 'cta_click', {
                        cta_name: ctaName,
                        cta_location: button.closest('section')?.id || 'unknown'
                    });
                }
            });
        });
    }

    /**
     * Initialize accessibility features
     */
    function initAccessibility() {
        // Add skip link functionality
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(skipLink.getAttribute('href'));
                if (target) {
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                }
            });
        }

        // Make FAQ questions focusable and keyboard accessible
        document.querySelectorAll('.faq-question').forEach(question => {
            question.setAttribute('tabindex', '0');
            question.setAttribute('role', 'button');
            question.setAttribute('aria-expanded', 'false');
        });
    }

    /**
     * Utility: Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Utility: Throttle function
     */
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Public API
    return {
        init,
        toggleMobileMenu,
        closeMobileMenu,
        toggleFAQ
    };
})();

// Make toggleMobileMenu and toggleFaq globally accessible (for inline onclick handlers)
window.toggleMobileMenu = App.toggleMobileMenu;
window.toggleFaq = function(element) {
    const item = element.closest('.faq-item');
    if (item) {
        App.toggleFAQ(item);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
