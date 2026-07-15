// ─── PAGE NAVIGATION ──────────────────────────
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    // Show target
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');

    // Update nav links
    document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => a.classList.remove('active'));
    document.querySelectorAll(`.nav-links a[data-page="${pageId}"], .mobile-nav a[data-page="${pageId}"]`)
        .forEach(a => a.classList.add('active'));

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile menu if open
    if (document.getElementById('mobileNav').classList.contains('active')) {
        toggleMobile();
    }
}

// ─── MOBILE MENU ──────────────────────────────
function toggleMobile() {
    document.getElementById('mobileNav').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
    document.body.style.overflow = document.getElementById('mobileNav').classList.contains('active') ? 'hidden' : '';
}

// ─── HEADER SCROLL EFFECT ─────────────────────
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ─── TIMELINE SCROLL ANIMATIONS ───────────────
const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -30px 0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.timeline-item').forEach(el => observer.observe(el));

// ─── FAQ ACCORDION ────────────────────────────
document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', function() {
        const item = this.parentElement;
        item.classList.toggle('active');
    });
});

// ─── APPOINTMENT FORM ─────────────────────────
document.getElementById('appointmentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you! Your appointment request has been submitted. We will contact you shortly to confirm.');
    this.reset();
});

// ─── NEWSLETTER FORM ──────────────────────────
document.getElementById('newsletterForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const input = this.querySelector('input[type="email"]');
    if (input.value.trim()) {
        alert('Thank you for subscribing to our newsletter!');
        input.value = '';
    }
});

// ─── SET ACTIVE PAGE ON LOAD ──────────────────
document.addEventListener('DOMContentLoaded', function() {
    // Ensure home is active by default
    showPage('home');
});