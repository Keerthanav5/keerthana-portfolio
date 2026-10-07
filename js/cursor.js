/**
 * ============================================================================
 * BESPOKE CYBER-OPTICAL CURSOR ENGINE
 * File: js/cursor.js
 * Author: MJ Architecture Atelier
 * 
 * Performance & Architecture:
 * - Pure GPU compositor execution via translate3d
 * - Decoupled RAF loop with auto-sleep when stationary (0% CPU at rest)
 * - Passive pointer listeners with zero layout reflows
 * - Immediate hardware exit on touch devices (zero mobile overhead)
 * ============================================================================
 */

(function () {
  'use strict';

  function initCyberCursor() {
    // Touch screen / mobile detection bypass
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) {
      return;
    }

    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');

    if (!dot || !ring) return;

    let targetX = -100;
    let targetY = -100;
    let currentRingX = -100;
    let currentRingY = -100;
    let isMoving = false;
    let animId = null;
    let isVisible = false;

    const LERP_FACTOR = 0.18; // Fluid physical spring tracking

    function onPointerMove(e) {
      targetX = e.clientX;
      targetY = e.clientY;

      // Reveal cursor elements once initial coordinate is established
      if (!isVisible) {
        isVisible = true;
        currentRingX = targetX;
        currentRingY = targetY;
        dot.classList.add('is-visible');
        ring.classList.add('is-visible');
      }

      // Instant pinpoint dot positioning on compositor thread
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;

      // Wake up the ring's interpolation loop
      if (!isMoving) {
        isMoving = true;
        animId = requestAnimationFrame(render);
      }
    }

    function render() {
      const dx = targetX - currentRingX;
      const dy = targetY - currentRingY;

      currentRingX += dx * LERP_FACTOR;
      currentRingY += dy * LERP_FACTOR;

      ring.style.transform = `translate3d(${currentRingX}px, ${currentRingY}px, 0)`;

      // Auto-sleep when settled at rest (0% idle CPU)
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        currentRingX = targetX;
        currentRingY = targetY;
        ring.style.transform = `translate3d(${currentRingX}px, ${currentRingY}px, 0)`;
        isMoving = false;
        animId = null;
        return;
      }

      animId = requestAnimationFrame(render);
    }

    // Interactive Element Magnetic Target Lock via Event Delegation
    const interactiveSelector =
      'a, button, [role="button"], input, select, textarea, .btn-primary-action, .btn-secondary-action, .skill-bento-card, .project-bento-card, .cert-item-card, .contact-link-row, .btn-send-message';

    function onMouseOver(e) {
      const target = e.target;
      if (target && target.closest && target.closest(interactiveSelector)) {
        ring.classList.add('is-hovering');
      }
    }

    function onMouseOut(e) {
      const target = e.target;
      if (target && target.closest && target.closest(interactiveSelector)) {
        ring.classList.remove('is-hovering');
      }
    }

    function onMouseDown() {
      ring.classList.add('is-clicking');
    }

    function onMouseUp() {
      ring.classList.remove('is-clicking');
    }

    function onMouseLeaveWindow(e) {
      if (e.relatedTarget === null) {
        dot.classList.remove('is-visible');
        ring.classList.remove('is-visible');
        isVisible = false;
      }
    }

    // Attach passive, low-overhead event listeners
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mouseover', onMouseOver, { passive: true });
    window.addEventListener('mouseout', onMouseOut, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', onMouseLeaveWindow, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCyberCursor);
  } else {
    initCyberCursor();
  }
})();
