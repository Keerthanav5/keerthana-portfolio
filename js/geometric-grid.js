/**
 * ============================================================================
 * BESPOKE SWISS ARCHITECTURAL GRID ENGINE — PRECISION SECTION INDEXING
 * File: js/geometric-grid.js
 * Author: MJ Architecture Atelier
 * 
 * Performance & Architecture:
 * - 0% Idle CPU & 0% GPU overhead
 * - Clean section anchor highlight via IntersectionObserver
 * - Horizontal datum joints & dividers entrance reveals
 * ============================================================================
 */

(function () {
  'use strict';

  function initGeometricGridEngine() {
    initDatumReveals();
    initSectionIndexing();
  }

  /**
   * Horizontal section datum dividers reveal smoothly on viewport entry
   */
  function initDatumReveals() {
    const sections = document.querySelectorAll('.section');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
            }
          });
        },
        { threshold: 0.08 }
      );
      sections.forEach((sec) => observer.observe(sec));
    } else {
      sections.forEach((sec) => sec.classList.add('is-revealed'));
    }
  }

  /**
   * Section title anchor indexing & luminescence
   */
  function initSectionIndexing() {
    const sections = document.querySelectorAll('section.section[id], section#home');
    if (!sections.length) return;

    if ('IntersectionObserver' in window) {
      const indexObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              sections.forEach((s) => s.classList.remove('is-indexed'));
              entry.target.classList.add('is-indexed');
            }
          });
        },
        { rootMargin: '-20% 0px -55% 0px', threshold: 0 }
      );
      sections.forEach((sec) => indexObserver.observe(sec));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGeometricGridEngine);
  } else {
    initGeometricGridEngine();
  }
})();
