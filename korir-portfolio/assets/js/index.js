// Header scroll state
const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
});

// Mobile nav
const mobileToggle = document.getElementById('mobileToggle');
const mobileNav = document.getElementById('mobileNav');
const closeMenu = document.getElementById('closeMenu');
const overlay = document.getElementById('overlay');

function openMobileNav() {
    mobileNav.classList.add('active');
    overlay.classList.add('active');
}

function closeMobileNav() {
    mobileNav.classList.remove('active');
    overlay.classList.remove('active');
}

mobileToggle.addEventListener('click', openMobileNav);
closeMenu.addEventListener('click', closeMobileNav);
overlay.addEventListener('click', closeMobileNav);
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));

// Reveal on scroll
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReduced) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
} else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
}

// Hero role rotator
const roles = ['Software Developer', 'Virtual Assistant', 'Graphic Designer'];
const roleEl = document.getElementById('roleRotator');
let roleIndex = 0;
if (!prefersReduced) {
    setInterval(() => {
        roleIndex = (roleIndex + 1) % roles.length;
        roleEl.style.opacity = 0;
        setTimeout(() => {
            roleEl.textContent = roles[roleIndex];
            roleEl.style.opacity = 1;
        }, 250);
    }, 2600);
    roleEl.style.transition = 'opacity 0.25s ease';
}

// Pricing tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const panes = {
    dev: document.getElementById('pane-dev'),
    va: document.getElementById('pane-va'),
    design: document.getElementById('pane-design')
};
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Object.values(panes).forEach(p => p.classList.remove('active'));
        panes[btn.dataset.tab].classList.add('active');
    });
});

// Service select from Service cards -> jump to form and preselect
const serviceSelect = document.getElementById('service');
const descriptionField = document.getElementById('description');

function goToForm(serviceValue, planLabel) {
    serviceSelect.value = serviceValue;
    if (planLabel && !descriptionField.value.trim()) {
        descriptionField.value = 'Interested in the "' + planLabel + '" plan for ' + serviceValue + '. ';
    }
    document.getElementById('request').scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
    setTimeout(() => { document.getElementById('firstName').focus(); }, prefersReduced ? 0 : 500);
}

document.querySelectorAll('.service-select').forEach(btn => {
    btn.addEventListener('click', () => goToForm(btn.dataset.service, null));
});

document.querySelectorAll('.plan-select').forEach(btn => {
    btn.addEventListener('click', () => goToForm(btn.dataset.service, btn.dataset.plan));
});

// Form submission -> build mailto + show summary
const form = document.getElementById('projectForm');
const successPanel = document.getElementById('successPanel');
const successSummary = document.getElementById('successSummary');
const resetBtn = document.getElementById('resetForm');

form.addEventListener('submit', function(e) {
    e.preventDefault();

    const data = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        company: document.getElementById('company').value.trim(),
        service: serviceSelect.value,
        budget: document.getElementById('budget').value.trim(),
        timeline: document.getElementById('timeline').value,
        description: descriptionField.value.trim()
    };

    const subject = 'Project Request: ' + data.service + ' — ' + data.firstName + ' ' + data.lastName;
    const bodyLines = [
        'First Name: ' + data.firstName,
        'Last Name: ' + data.lastName,
        'Email: ' + data.email,
        'Phone: ' + data.phone,
        'Company: ' + (data.company || '—'),
        'Service Interested In: ' + data.service,
        'Project Budget: ' + (data.budget || 'Not specified'),
        'Project Timeline: ' + data.timeline,
        '',
        'Project Description:',
        data.description
    ];
    const body = bodyLines.join('\n');

    const mailtoLink = 'mailto:iamkorir200@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

    form.style.display = 'none';
    successPanel.classList.add('active');
    successSummary.textContent = 'Subject: ' + subject + '\n\n' + body;

    window.location.href = mailtoLink;
});

resetBtn.addEventListener('click', function() {
    form.reset();
    form.style.display = 'block';
    successPanel.classList.remove('active');
});