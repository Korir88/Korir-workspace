// ─── PAGE NAVIGATION ──────────────────────────
function showPage(pageId) {
    // hide all pages
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    // show target
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');
    // update nav
    document.querySelectorAll('.nav-menu a').forEach(a => a.classList.remove('active'));
    document.querySelector(`.nav-menu a[data-page="${pageId}"]`)?.classList.add('active');
    // close modals
    closeModal('signin');
    closeModal('signup');
    // scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── AUTH MODALS ──────────────────────────────
function openModal(type) {
    const modal = document.getElementById(type + 'Modal');
    if (modal) modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal(type) {
    const modal = document.getElementById(type + 'Modal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
}

// close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('open');
            document.body.style.overflow = '';
        }
    });
});

// ─── TOGGLE PASSWORD VISIBILITY ──────────────
function togglePassword(inputId, iconSpan) {
    const input = document.getElementById(inputId);
    const icon = iconSpan.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// ─── SIGN IN ──────────────────────────────────
document.getElementById('signinForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value.trim();

    if (!email || !password) {
        alert('Please fill in all fields.');
        return;
    }

    // Simple validation – in real app, call API
    const userData = JSON.parse(localStorage.getItem('travelEaseUser') || 'null');
    if (userData && userData.email === email && userData.password === password) {
        alert('Welcome back, ' + userData.name + '!');
        loginUser(userData.name);
        closeModal('signin');
    } else {
        // For demo: if no account, let them know
        if (!userData) {
            alert('No account found. Please sign up first.');
        } else {
            alert('Invalid email or password. Please try again.');
        }
    }
});

// ─── SIGN UP ──────────────────────────────────
document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const confirm = document.getElementById('signupConfirm').value.trim();

    if (!name || !email || !password || !confirm) {
        alert('Please fill in all fields.');
        return;
    }
    if (password.length < 6) {
        alert('Password must be at least 6 characters.');
        return;
    }
    if (password !== confirm) {
        alert('Passwords do not match.');
        return;
    }

    // Save user (demo)
    const user = { name, email, password };
    localStorage.setItem('travelEaseUser', JSON.stringify(user));
    alert('Account created successfully! Welcome, ' + name + '!');
    loginUser(name);
    closeModal('signup');
});

// ─── LOGIN / LOGOUT ──────────────────────────
function loginUser(name) {
    document.getElementById('authButtons').style.display = 'none';
    document.getElementById('authLoggedIn').style.display = 'flex';
    document.getElementById('userDisplayName').textContent = name;
    // update any "Book Now" buttons to show logged-in state? just a demo
}

function logoutUser() {
    localStorage.removeItem('travelEaseUser');
    document.getElementById('authButtons').style.display = 'flex';
    document.getElementById('authLoggedIn').style.display = 'none';
    alert('You have been logged out.');
}

// ─── RESTORE SESSION ─────────────────────────
(function restoreSession() {
    const userData = JSON.parse(localStorage.getItem('travelEaseUser') || 'null');
    if (userData) {
        loginUser(userData.name);
    }
})();

// ─── BOOKING FORM ────────────────────────────
document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const dest = document.getElementById('destination').value.trim() || 'your destination';
    alert('🔍 Searching packages for "' + dest + '"... (This is a demo)');
});

// ─── NEWSLETTER ──────────────────────────────
document.getElementById('newsletterForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const input = this.querySelector('.newsletter-input');
    if (input.value.trim()) {
        alert('📬 Thank you for subscribing! (Demo)');
        input.value = '';
    }
});

// ─── CONTACT FORM ────────────────────────────
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    alert('✉️ Thank you, ' + name + '! Your message has been sent. (Demo)');
    this.reset();
});

// ─── DATE PICKER DEFAULTS ────────────────────
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    const checkIn = document.getElementById('check-in');
    const checkOut = document.getElementById('check-out');
    if (checkIn) {
        checkIn.setAttribute('min', today);
        checkIn.addEventListener('change', function() {
            if (checkOut) checkOut.setAttribute('min', this.value);
        });
    }
});