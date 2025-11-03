// ---------------- DOM Content Loaded ----------------
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const loader = document.querySelector('.loader');
        if (loader) loader.classList.add('hidden');
    }, 1500);

    initMobileMenu();
    initSmoothScrolling();
    initCounters();
    initFormValidation();
    initScrollEffects();
    initServiceCardAnimations();
    initPortfolioHoverEffects();
    initBackToTopButton();
    initTestimonialSlider();
    handleResponsiveChanges();
});

// ---------------- Mobile Menu ----------------
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;
    if (!mobileMenuBtn || !navLinks) return;

    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
        body.classList.toggle('no-scroll');

        const icon = mobileMenuBtn.querySelector('i');
        if (icon) icon.className = navLinks.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
    });

    navLinks.querySelectorAll('a').forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            body.classList.remove('no-scroll');
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) icon.className = 'fas fa-bars';
        });
    });

    document.addEventListener('click', e => {
        if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target) && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            body.classList.remove('no-scroll');
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) icon.className = 'fas fa-bars';
        }
    });
}

// ---------------- Smooth Scrolling ----------------
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                const headerHeight = document.querySelector('header').offsetHeight;
                window.scrollTo({ top: target.offsetTop - headerHeight, behavior: 'smooth' });
            }
        });
    });
}

// ---------------- Counters ----------------
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.dataset.count);
                let current = 0;
                const increment = target / (2000 / 16);

                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        counter.textContent = target + '+';
                        clearInterval(timer);
                    } else {
                        counter.textContent = Math.floor(current) + '+';
                    }
                }, 16);

                obs.unobserve(counter);
            }
        });
    }, { threshold: 0.5, rootMargin: '0px 0px -100px 0px' });

    counters.forEach(counter => observer.observe(counter));
}

// ---------------- Form Validation & Submission ----------------
function initFormValidation() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    form.addEventListener('submit', async e => {
        e.preventDefault();
        let isValid = true;

        Array.from(form.elements).forEach(el => {
            if (el.type !== 'submit' && el.hasAttribute('required')) {
                if (!el.value.trim()) {
                    isValid = false;
                    highlightError(el, 'This field is required');
                } else if (el.type === 'email' && !isValidEmail(el.value)) {
                    isValid = false;
                    highlightError(el, 'Please enter a valid email');
                }
            }
        });

        if (!isValid) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            company: formData.get('company') || '',
            message: formData.get('message')
        };

        // Auto-switch backend URL based on environment
        const BACKEND_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
            ? 'http://127.0.0.1:5000/api/contact/submit'    // Local backend
            : 'https://my-backend-5zho.onrender.com/api/contact/submit'; // Production backend

        try {
            const res = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const result = await res.json();

            if (result.success) {
                alert(result.message);
                form.reset();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Something went wrong. Try again later.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    form.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => removeErrorHighlight(input));
    });
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function highlightError(el, msg) {
    removeErrorHighlight(el);
    const div = document.createElement('div');
    div.className = 'error-message';
    div.style.color = '#ef4444';
    div.style.fontSize = '0.875rem';
    div.style.marginTop = '0.5rem';
    div.textContent = msg;
    el.parentNode.appendChild(div);
    el.style.borderColor = '#ef4444';
}

function removeErrorHighlight(el) {
    const err = el.parentNode.querySelector('.error-message');
    if (err) err.remove();
    el.style.borderColor = '';
}

// ---------------- Scroll Effects ----------------
function initScrollEffects() {
    const header = document.querySelector('header');
    if (!header) return;
    header.style.background = 'white';
    header.style.backdropFilter = 'none';

    window.addEventListener('scroll', () => {
        const y = window.pageYOffset;
        header.style.backdropFilter = y > 100 ? 'blur(10px)' : 'none';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('animate-in');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.service-card, .portfolio-item, .process-step, .testimonial-card')
        .forEach(el => observer.observe(el));
}

// ---------------- Service Cards & Portfolio ----------------
function initServiceCardAnimations() {
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-10px) scale(1.02)');
        card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0) scale(1)');
    });
}

function initPortfolioHoverEffects() {
    document.querySelectorAll('.portfolio-item').forEach(item => {
        const img = item.querySelector('img');
        const content = item.querySelector('.portfolio-content');

        item.addEventListener('mouseenter', () => {
            if (img) img.style.transform = 'scale(1.05)';
            if (content) content.style.transform = 'translateY(-5px)';
        });

        item.addEventListener('mouseleave', () => {
            if (img) img.style.transform = 'scale(1)';
            if (content) content.style.transform = 'translateY(0)';
        });
    });
}

// ---------------- Back to Top ----------------
function initBackToTopButton() {
    const btn = document.createElement('button');
    btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    btn.className = 'back-to-top';
    btn.style.cssText = `
        position: fixed; bottom: 30px; right: 30px;
        width: 50px; height: 50px; background: var(--gradient);
        color: white; border: none; border-radius: 50%;
        font-size: 1.2rem; cursor: pointer; opacity: 0;
        transform: translateY(20px); transition: all 0.3s ease;
        z-index: 1000; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(btn);

    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    window.addEventListener('scroll', () => {
        btn.style.opacity = window.pageYOffset > 500 ? '1' : '0';
        btn.style.transform = window.pageYOffset > 500 ? 'translateY(0)' : 'translateY(20px)';
    });
}

// ---------------- Testimonials Slider ----------------
function initTestimonialSlider() {
    const testimonials = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.querySelector('.testimonial-prev');
    const nextBtn = document.querySelector('.testimonial-next');
    const dots = document.querySelectorAll('.testimonial-dots .dot');
    if (!testimonials.length) return;

    let index = 0;
    const show = i => {
        testimonials.forEach((t, j) => t.classList.toggle('active', i === j));
        dots.forEach((d, j) => d.classList.toggle('active', i === j));
        index = i;
    };

    prevBtn?.addEventListener('click', () => show((index - 1 + testimonials.length) % testimonials.length));
    nextBtn?.addEventListener('click', () => show((index + 1) % testimonials.length));
    dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));

    show(index);
}

// ---------------- CTA & Social Buttons ----------------
document.querySelectorAll('.cta-button').forEach(btn => {
    btn.addEventListener('mouseenter', () => btn.style.transform = 'translateY(-3px) scale(1.05)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'translateY(0) scale(1)');
    btn.addEventListener('mousedown', () => btn.style.transform = 'translateY(1px) scale(0.95)');
    btn.addEventListener('mouseup', () => btn.style.transform = 'translateY(-3px) scale(1.05)');
});

document.querySelectorAll('.social-links a').forEach(link => {
    link.addEventListener('mouseenter', () => link.style.transform = 'translateY(-3px) rotate(5deg)');
    link.addEventListener('mouseleave', () => link.style.transform = 'translateY(0) rotate(0)');
});

// ---------------- Image Fallback ----------------
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
        img.src = 'https://placehold.co/600x400/2563eb/ffffff?text=Image+Placeholder';
        img.alt = 'Placeholder image';
    });
});

// ---------------- Responsive ----------------
function handleResponsiveChanges() {
    const isMobile = window.innerWidth <= 768;
    document.querySelectorAll('.hero-stats').forEach(stats => {
        stats.style.flexDirection = isMobile ? 'column' : 'row';
        stats.style.gap = isMobile ? '1.5rem' : '3rem';
    });
}
window.addEventListener('resize', handleResponsiveChanges);

// ---------------- Keyboard Navigation ----------------
document.addEventListener('keydown', e => { if (e.key === 'Tab') document.body.classList.add('keyboard-nav'); });
document.addEventListener('mousedown', () => document.body.classList.remove('keyboard-nav'));

const style = document.createElement('style');
style.textContent = `
.keyboard-nav button:focus, .keyboard-nav a:focus, 
.keyboard-nav input:focus, .keyboard-nav textarea:focus {
    outline: 2px solid #2563eb; outline-offset: 2px;
}`;
document.head.appendChild(style);
