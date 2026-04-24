/* ============================================
   BAPIR HOLDINGS — script.js
   Shared JavaScript for all pages
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. Mobile hamburger nav ── */
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      // Prevent body scroll when nav is open
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
        document.body.style.overflow = '';
      }
    });
  }

  /* ── 2. Active nav link highlight ── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── 3. Scroll-triggered fade-in ── */
  const fadeEls = document.querySelectorAll('.fade-in');

  if (fadeEls.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            // Stagger the delay slightly for grid items
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, i * 80);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    fadeEls.forEach(el => observer.observe(el));
  }

  /* ── 4. Sticky header shadow on scroll ── */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        header.style.boxShadow = '0 4px 24px rgba(0,0,0,0.35)';
      } else {
        header.style.boxShadow = 'none';
      }
    }, { passive: true });
  }

  /* ── 5. Contact form UX enhancements ── */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    // Show a friendly success/error message using Formspree AJAX
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('.submit-btn');
      const statusEl  = document.getElementById('form-status');

      submitBtn.textContent = 'Sending…';
      submitBtn.disabled = true;

      try {
        const data = new FormData(contactForm);
        const res  = await fetch(contactForm.action, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' }
        });

        if (res.ok) {
          statusEl.textContent = 'Thank you! Your message has been received. We\'ll be in touch soon.';
          statusEl.className   = 'form-status success';
          contactForm.reset();
        } else {
          const json = await res.json();
          const msg  = json.errors
            ? json.errors.map(e => e.message).join(', ')
            : 'Something went wrong. Please try again.';
          statusEl.textContent = msg;
          statusEl.className   = 'form-status error';
        }
      } catch {
        statusEl.textContent = 'Network error — please check your connection and try again.';
        statusEl.className   = 'form-status error';
      } finally {
        submitBtn.textContent = 'Send Message';
        submitBtn.disabled    = false;
      }
    });
  }

  /* ── 6. Smooth reveal on page load ── */
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.4s ease';
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  });

  /* ── 7. Product card hover tilt (shop page) ── */
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-6px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

});
