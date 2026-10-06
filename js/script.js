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

// Scroll spy using IntersectionObserver to update active nav link as user scrolls
if ('IntersectionObserver' in window) {
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setNavActive(entry.target.id);
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));
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
