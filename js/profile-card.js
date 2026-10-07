/**
 * ============================================================================
 * 3D HOLOGRAPHIC TILT PROFILE CARD ENGINE (Vanilla Physics Port)
 * File: js/profile-card.js
 * Source: React Bits 3D Holo Profile Card (adapted for high-performance Vanilla DOM)
 * Features:
 *   - 3D Perspective Rotation with Tau Exponential Smoothing Decay
 *   - Dynamic Pointer Position & Normalized Distance Interpolation
 *   - Sunpillar Holo-Sheen Gradient Tracking & Specular Glare Overlay
 *   - Initial Entry Reveal Physics with Spring Settling
 *   - Native Mobile Gyroscope / DeviceOrientation Parallax
 * ============================================================================
 */
(function () {
  'use strict';

  const ANIMATION_CONFIG = {
    INITIAL_DURATION: 1200,
    INITIAL_X_OFFSET: 70,
    INITIAL_Y_OFFSET: 60,
    DEVICE_BETA_OFFSET: 20,
    ENTER_TRANSITION_MS: 180,
    MOBILE_TILT_SENSITIVITY: 4
  };

  const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
  const round = (v, precision = 3) => parseFloat(v.toFixed(precision));
  const adjust = (v, fMin, fMax, tMin, tMax) =>
    round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

  function initProfileCard() {
    const wrap = document.getElementById('profileCardWrap');
    const shell = document.getElementById('profileCardShell');
    const cardSection = shell ? shell.querySelector('.pc-card-inner') : null;

    if (!wrap || !shell || !cardSection) return;

    let rafId = null;
    let running = false;
    let lastTs = 0;

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const DEFAULT_TAU = 0.14;
    const INITIAL_TAU = 0.6;
    let initialUntil = 0;
    let enterTimer = null;
    let leaveRaf = null;

    function setVarsFromXY(x, y) {
      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;

      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);

      const centerX = percentX - 50;
      const centerY = percentY - 50;

      wrap.style.setProperty('--pointer-x', `${percentX}%`);
      wrap.style.setProperty('--pointer-y', `${percentY}%`);
      wrap.style.setProperty('--background-x', `${adjust(percentX, 0, 100, 35, 65)}%`);
      wrap.style.setProperty('--background-y', `${adjust(percentY, 0, 100, 35, 65)}%`);
      wrap.style.setProperty(
        '--pointer-from-center',
        `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`
      );
      wrap.style.setProperty('--pointer-from-top', `${percentY / 100}`);
      wrap.style.setProperty('--pointer-from-left', `${percentX / 100}`);
      wrap.style.setProperty('--rotate-x', `${round(-(centerX / 5))}deg`);
      wrap.style.setProperty('--rotate-y', `${round(centerY / 4)}deg`);
      wrap.style.setProperty('--card-opacity', '1');
    }

    function step(ts) {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);

      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;

      setVarsFromXY(currentX, currentY);

      const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;

      if (stillFar || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    }

    function startLoop() {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    }

    function setTarget(x, y) {
      targetX = x;
      targetY = y;
      startLoop();
    }

    function setImmediate(x, y) {
      currentX = x;
      currentY = y;
      setVarsFromXY(currentX, currentY);
    }

    function toCenter() {
      setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
    }

    function getOffsets(evt) {
      const rect = shell.getBoundingClientRect();
      return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }

    // Pointer Event Listeners
    shell.addEventListener('pointerenter', function (e) {
      shell.classList.add('active');
      shell.classList.add('entering');
      if (enterTimer) clearTimeout(enterTimer);
      enterTimer = setTimeout(() => {
        shell.classList.remove('entering');
      }, ANIMATION_CONFIG.ENTER_TRANSITION_MS);

      const offsets = getOffsets(e);
      setTarget(offsets.x, offsets.y);
    });

    shell.addEventListener('pointermove', function (e) {
      const offsets = getOffsets(e);
      setTarget(offsets.x, offsets.y);
    });

    shell.addEventListener('pointerleave', function () {
      toCenter();

      function checkSettle() {
        const settled = Math.hypot(targetX - currentX, targetY - currentY) < 0.6;
        if (settled) {
          shell.classList.remove('active');
          wrap.style.setProperty('--card-opacity', '0');
          leaveRaf = null;
        } else {
          leaveRaf = requestAnimationFrame(checkSettle);
        }
      }

      if (leaveRaf) cancelAnimationFrame(leaveRaf);
      leaveRaf = requestAnimationFrame(checkSettle);
    });

    // Mobile Device Orientation Gyroscope Support
    function handleDeviceOrientation(e) {
      const { beta, gamma } = e;
      if (beta == null || gamma == null) return;

      const centerX = shell.clientWidth / 2;
      const centerY = shell.clientHeight / 2;
      const x = clamp(
        centerX + gamma * ANIMATION_CONFIG.MOBILE_TILT_SENSITIVITY,
        0,
        shell.clientWidth
      );
      const y = clamp(
        centerY + (beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * ANIMATION_CONFIG.MOBILE_TILT_SENSITIVITY,
        0,
        shell.clientHeight
      );

      shell.classList.add('active');
      setTarget(x, y);
    }

    shell.addEventListener('click', function () {
      if (location.protocol !== 'https:') return;
      if (
        typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function'
      ) {
        DeviceMotionEvent.requestPermission()
          .then((state) => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
      }
    });

    // Initial Entry Swivel (Delightful settling entrance)
    const initialX = (shell.clientWidth || 320) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    setImmediate(initialX, initialY);
    toCenter();
    initialUntil = performance.now() + ANIMATION_CONFIG.INITIAL_DURATION;
    startLoop();
  }

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfileCard);
  } else {
    initProfileCard();
  }
})();
