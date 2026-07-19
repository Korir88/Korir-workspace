// ============================================================
// Restaurant.js - Indulge Cucina Italian Trattoria
// Features: Mobile nav, reservation modal, menu filtering
// ============================================================

(function() {
    'use strict';

    // --------------------------------------------------------
    // Constants
    // --------------------------------------------------------
    const SELECTORS = {
        mobileToggle: '.mobile-toggle',
        navMenu: '.nav-menu',
        reserveBtn: '#reserveBtn',
        heroReserveBtn: '#heroReserveBtn',
        reservationModal: '#reservationModal',
        closeModal: '#closeModal',
        filterBtns: '.filter-btn',
        dateInput: '#date',
        menuItems: '.dish-card',
        modalForm: '.reservation-form form',
        modalOverlay: '.modal-overlay'
    };

    const CLASSES = {
        active: 'active',
        faBars: 'fa-bars',
        faTimes: 'fa-times'
    };

    // --------------------------------------------------------
    // Utility Helpers
    // --------------------------------------------------------
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    const isElementInViewport = (el) => {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    };

    // --------------------------------------------------------
    // Mobile Navigation
    // --------------------------------------------------------
    const initMobileNav = () => {
        const mobileToggle = $(SELECTORS.mobileToggle);
        const navMenu = $(SELECTORS.navMenu);

        if (!mobileToggle || !navMenu) return;

        const icon = mobileToggle.querySelector('i');

        mobileToggle.addEventListener('click', () => {
            const isActive = navMenu.classList.toggle(CLASSES.active);

            if (icon) {
                icon.classList.toggle(CLASSES.faBars, !isActive);
                icon.classList.toggle(CLASSES.faTimes, isActive);
            }

            // Accessibility
            mobileToggle.setAttribute('aria-expanded', isActive);
        });

        // Close nav when a link is clicked
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove(CLASSES.active);
                if (icon) {
                    icon.classList.add(CLASSES.faBars);
                    icon.classList.remove(CLASSES.faTimes);
                }
                mobileToggle.setAttribute('aria-expanded', 'false');
            });
        });
    };

    // --------------------------------------------------------
    // Reservation Modal
    // --------------------------------------------------------
    const lockBodyScroll = () => {
        document.body.style.overflow = 'hidden';
    };

    const unlockBodyScroll = () => {
        document.body.style.overflow = '';
    };

    const openModal = () => {
        const modal = $(SELECTORS.reservationModal);
        if (!modal) return;

        modal.classList.add(CLASSES.active);
        lockBodyScroll();

        // Focus first input for accessibility
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    };

    const closeModal = () => {
        const modal = $(SELECTORS.reservationModal);
        if (!modal) return;

        modal.classList.remove(CLASSES.active);
        unlockBodyScroll();
    };

    const initModal = () => {
        const reserveBtn = $(SELECTORS.reserveBtn);
        const heroReserveBtn = $(SELECTORS.heroReserveBtn);
        const closeBtn = $(SELECTORS.closeModal);
        const modal = $(SELECTORS.reservationModal);

        if (!reserveBtn || !heroReserveBtn || !closeBtn || !modal) return;

        reserveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });

        heroReserveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });

        closeBtn.addEventListener('click', closeModal);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains(CLASSES.active)) {
                closeModal();
            }
        });
    };

    // --------------------------------------------------------
    // Menu Filtering
    // --------------------------------------------------------
    const initMenuFilter = () => {
        const filterBtns = $$(SELECTORS.filterBtns);
        const menuItems = $$(SELECTORS.menuItems);

        if (!filterBtns.length || !menuItems.length) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterBtns.forEach(b => b.classList.remove(CLASSES.active));
                btn.classList.add(CLASSES.active);

                const filter = btn.dataset.filter || 'all';

                menuItems.forEach(item => {
                    const category = item.dataset.category || 'all';
                    const shouldShow = filter === 'all' || category === filter;

                    item.style.display = shouldShow ? '' : 'none';
                    item.style.animation = shouldShow ? 'fadeIn 0.4s ease-in' : '';
                });
            });
        });
    };

    // --------------------------------------------------------
    // Reservation Form Validation
    // --------------------------------------------------------
    const initFormValidation = () => {
        const form = $(SELECTORS.modalForm);
        if (!form) return;

        // Set minimum date to today
        const dateInput = $(SELECTORS.dateInput);
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.setAttribute('min', today);
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Basic validation
            const errors = [];
            if (!data.date) errors.push('Please select a date');
            if (!data.time) errors.push('Please select a time');
            if (!data.name || data.name.trim().length < 2) errors.push('Please enter your full name');
            if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                errors.push('Please enter a valid email');
            }
            if (!data.phone || data.phone.trim().length < 7) {
                errors.push('Please enter a valid phone number');
            }

            if (errors.length > 0) {
                alert(errors.join('\n'));
                return;
            }

            // Success - would send to server
            alert(`Reservation confirmed for ${data.name}!\nDate: ${data.date}\nTime: ${data.time}\nParty: ${data.party}`);
            form.reset();
            closeModal();
        });
    };

    // --------------------------------------------------------
    // Initialization
    // --------------------------------------------------------
    const init = () => {
        initMobileNav();
        initModal();
        initMenuFilter();
        initFormValidation();
    };

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
