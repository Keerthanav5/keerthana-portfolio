const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const body = document.body;
const loadingScreen = document.querySelector('.loading-screen');
const loadingText = document.querySelector('.loading-text');
const loadingProgress = document.querySelector('.loading-progress');
const pageTransition = document.querySelector('.page-transition');
const introLines = [...document.querySelectorAll('.home-line')];
const siteShell = document.querySelector('.site-shell');
const siteHeader = document.querySelector('.site-header');
const navLinks = document.querySelectorAll('.nav-link');
const projectLinks = document.querySelectorAll('.project-link');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const sections = document.querySelectorAll('main section[id]');
const homeLink = document.querySelector('.brand');
let activeSectionId = null;
let sectionTransitionTimer = null;

gsap.registerPlugin(ScrollTrigger);

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

function showSection(id) {
  const targetSection = document.querySelector(`#${id}`);

  if (!targetSection) return;

  const activateSection = () => {
    sections.forEach((section) => section.classList.remove('is-active'));
    targetSection.classList.add('is-active');
    activeSectionId = id;
    setNavActive(id);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  clearTimeout(sectionTransitionTimer);

  if (prefersReducedMotion.matches || activeSectionId === null || !pageTransition) {
    activateSection();
    return;
  }

  pageTransition.classList.remove('is-revealing');
  pageTransition.classList.add('is-covering');

  sectionTransitionTimer = setTimeout(() => {
    activateSection();
    pageTransition.classList.remove('is-covering');
    pageTransition.classList.add('is-revealing');

    sectionTransitionTimer = setTimeout(() => {
      pageTransition.classList.remove('is-revealing');
    }, 520);
  }, 520);
}

function handleMenuToggle() {
  const isOpen = navMenu.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
}

function typeIntroLines() {
  if (prefersReducedMotion.matches) {
    introLines.forEach((line) => line.classList.add('is-visible'));
    return;
  }

  const lineTexts = introLines.map((line) => line.textContent.trim());
  introLines.forEach((line) => {
    line.textContent = '';
  });

  let activeTypingTimer = null;

  setTimeout(() => {
    if (activeTypingTimer) clearInterval(activeTypingTimer);
    introLines.forEach((line, index) => {
      line.textContent = lineTexts[index];
      line.classList.add('is-visible');
      line.classList.remove('is-typing');
    });
  }, 4200);

  let lineIndex = 0;

  function typeNextLine() {
    if (lineIndex >= introLines.length) return;

    const line = introLines[lineIndex];
    const text = lineTexts[lineIndex];
    let characterIndex = 0;
    line.classList.add('is-visible', 'is-typing');

    activeTypingTimer = setInterval(() => {
      line.textContent += text[characterIndex];
      characterIndex += 1;

      if (characterIndex === text.length) {
        clearInterval(activeTypingTimer);
        activeTypingTimer = null;
        line.classList.remove('is-typing');
        lineIndex += 1;
        setTimeout(typeNextLine, 260);
      }
    }, 14);
  }

  setTimeout(typeNextLine, 120);
}

navToggle.addEventListener('click', handleMenuToggle);

navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const targetId = link.getAttribute('href');
    if (targetId) showSection(targetId.slice(1));

    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

projectLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const targetId = link.getAttribute('href');
    if (targetId) showSection(targetId.slice(1));
  });
});

if (homeLink) {
  homeLink.addEventListener('click', (event) => {
    event.preventDefault();
    showSection('home');
  });
}

siteShell.classList.add('is-visible');
siteHeader.classList.add('is-visible');
loadingText.classList.add('is-visible');
loadingProgress.classList.add('is-filled');
showSection('home');
body.classList.add('site-ready');

if (prefersReducedMotion.matches) {
  typeIntroLines();
} else {
  setTimeout(() => {
    loadingScreen.classList.add('is-hidden');
    typeIntroLines();
  }, 3200);
}

window.addEventListener('load', () => {
  const homeIntro = document.querySelector('.home-intro');
  if (homeIntro) homeIntro.style.pointerEvents = 'none';
});
