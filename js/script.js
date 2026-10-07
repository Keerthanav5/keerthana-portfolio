const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const body = document.body;
const loadingScreen = document.querySelector('.loading-screen');
const siteShell = document.querySelector('.site-shell');
const siteHeader = document.querySelector('.site-header');
const heroSection = document.querySelector('.hero-section');
const navLinks = document.querySelectorAll('.nav-link');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const sections = document.querySelectorAll('main section[id]');

function setNavActive(id) {
  navLinks.forEach((link) => {
    const matches = link.getAttribute('href') === `#${id}`;
    link.classList.toggle('active', matches);
    if (matches) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function revealHero() {
  if (heroSection) {
    heroSection.classList.add('is-visible');
  }
}

function handleMenuToggle() {
  if (!navMenu || !navToggle) return;
  const isOpen = navMenu.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
}

if (navToggle) {
  navToggle.addEventListener('click', handleMenuToggle);
}

// Smooth scroll handler for all internal anchors (#home, #about, etc.)
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    const targetElement = document.querySelector(href);

    if (targetElement) {
      event.preventDefault();
      targetElement.scrollIntoView({ behavior: 'smooth' });

      if (navMenu && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });
});

// Sticky Section HUD (01 / 05) tracking
const sectionPhaseMap = {
  home: { index: '01', progress: '20%' },
  about: { index: '02', progress: '40%' },
  education: { index: '02', progress: '40%' },
  skills: { index: '03', progress: '60%' },
  internship: { index: '04', progress: '80%' },
  projects: { index: '04', progress: '80%' },
  certifications: { index: '05', progress: '100%' },
  contact: { index: '05', progress: '100%' }
};

const phaseOrder = ['home', 'about', 'skills', 'projects', 'contact'];
const currentSectionIndexEl = document.getElementById('currentSectionIndex');
const sectionProgressBarEl = document.getElementById('sectionProgressBar');
const sectionIndicatorEl = document.querySelector('.site-section-indicator');

function updateSectionIndicator(id) {
  const phase = sectionPhaseMap[id];
  if (!phase) return;

  if (currentSectionIndexEl && currentSectionIndexEl.textContent !== phase.index) {
    currentSectionIndexEl.textContent = phase.index;
  }
  if (sectionProgressBarEl) {
    sectionProgressBarEl.style.width = phase.progress;
  }
}

// Click to advance through sections
if (sectionIndicatorEl) {
  sectionIndicatorEl.setAttribute('title', 'Click to advance to next section');
  sectionIndicatorEl.addEventListener('click', () => {
    const currentIndex = currentSectionIndexEl ? parseInt(currentSectionIndexEl.textContent, 10) : 1;
    const nextPhaseIndex = currentIndex >= 5 ? 0 : currentIndex;
    const targetId = phaseOrder[nextPhaseIndex];
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// High-performance RAF scroll spy to update active nav link and sticky 01/05 indicator
let scrollSpyTicking = false;

function handleScrollSpy() {
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const viewportCenter = scrollY + window.innerHeight * 0.4;
  let currentId = 'home';

  sections.forEach((section) => {
    const top = section.offsetTop;
    if (viewportCenter >= top) {
      currentId = section.id;
    }
  });

  if (scrollY < 120) {
    currentId = 'home';
  } else if (window.innerHeight + scrollY >= document.documentElement.scrollHeight - 60) {
    currentId = 'contact';
  }

  setNavActive(currentId);
  updateSectionIndicator(currentId);
  scrollSpyTicking = false;
}

window.addEventListener('scroll', () => {
  if (!scrollSpyTicking) {
    requestAnimationFrame(handleScrollSpy);
    scrollSpyTicking = true;
  }
}, { passive: true });

// Initial check on load
handleScrollSpy();

// Interactive Skills Category Filter
const skillFilterBtns = document.querySelectorAll('.skill-filter-btn');
const skillCards = document.querySelectorAll('.skill-bento-card');

if (skillFilterBtns.length > 0 && skillCards.length > 0) {
  skillFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      skillFilterBtns.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-selected', String(isActive));
      });

      skillCards.forEach((card) => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.classList.remove('is-hidden');
          card.style.opacity = '0';
          card.style.transform = 'translateY(6px)';
          requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.classList.add('is-hidden');
        }
      });
    });
  });
}

// ===================================================================
// CONTACT CARD INTERSECTION OBSERVER — stagger animations on scroll
// ===================================================================
const contactCard = document.querySelector('.contact-bento-card');
if (contactCard && 'IntersectionObserver' in window) {
  const contactObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        contactObserver.unobserve(entry.target); // fire once only
      }
    });
  }, { threshold: 0.25 });
  contactObserver.observe(contactCard);
}

// Initial setup
if (siteShell) siteShell.classList.add('is-visible');
body.classList.add('site-ready');

// Loading transition: 2.2 seconds (subtle 2-3s loading transition per spec)
if (prefersReducedMotion.matches) {
  if (loadingScreen) loadingScreen.classList.add('is-hidden');
  if (siteHeader) siteHeader.classList.add('is-visible');
  revealHero();
} else {
  setTimeout(() => {
    if (loadingScreen) loadingScreen.classList.add('is-hidden');
    if (siteHeader) siteHeader.classList.add('is-visible');
    revealHero();
  }, 2200);
}



