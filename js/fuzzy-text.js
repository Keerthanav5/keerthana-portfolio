/**
 * FuzzyText Canvas Engine (Vanilla JS adaptation of React Bits FuzzyText)
 * High-performance horizontal line displacement slice engine
 * 
 * Features:
 * - Offscreen text rasterization with Syne typography
 * - Sub-pixel row slicing with random jitter displacement
 * - Interactive hover & touch intensity ramping
 * - Periodic micro-glitch pulse
 * - IntersectionObserver: 0% CPU consumption when scrolled out of view
 * - Respects prefers-reduced-motion
 */
(function () {
  'use strict';

  const canvas = document.getElementById('cyberFuzzyCanvas');
  if (!canvas) return;

  const text = 'Cybersecurity';
  const color = '#A8FF3E';
  const baseIntensity = 0.18;
  const hoverIntensity = 0.52;
  const fuzzRange = 22;
  const fps = 60;
  const direction = 'horizontal';
  const transitionDuration = 120; // ms
  const clickEffect = true;
  const glitchMode = true;
  const glitchInterval = 3200; // ms
  const glitchDuration = 180; // ms
  const frameDuration = 1000 / fps;

  let offscreen = null;
  let offCtx = null;
  let ctx = null;
  let animationFrameId = null;
  let isRunning = false;
  let isCancelled = false;
  let glitchTimeoutId = null;
  let glitchEndTimeoutId = null;
  let clickTimeoutId = null;

  let offscreenWidth = 0;
  let tightHeight = 0;
  let horizontalMargin = 0;
  let verticalMargin = 0;
  let interactiveLeft = 0;
  let interactiveTop = 0;
  let interactiveRight = 0;
  let interactiveBottom = 0;

  let isHovering = false;
  let isClicking = false;
  let isGlitching = false;
  let currentIntensity = baseIntensity;
  let targetIntensity = baseIntensity;
  let lastFrameTime = 0;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  async function init() {
    ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get computed typography from parent
    const heroTitle = document.querySelector('.hero-title') || canvas.parentElement;
    const computed = window.getComputedStyle(heroTitle);
    const computedFontSize = computed.fontSize || '48px';
    const numericFontSize = parseFloat(computedFontSize) || 48;
    const computedFontFamily = computed.fontFamily || "'Syne', sans-serif";
    const fontWeight = computed.fontWeight || '700';

    const fontString = `${fontWeight} ${computedFontSize} ${computedFontFamily}`;

    try {
      if (document.fonts) {
        await document.fonts.load(fontString);
        await document.fonts.ready;
      }
    } catch (e) {
      // fallback
    }

    if (isCancelled) return;

    offscreen = document.createElement('canvas');
    offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    offCtx.font = fontString;
    offCtx.textBaseline = 'alphabetic';

    const metrics = offCtx.measureText(text);
    const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
    const actualRight = metrics.actualBoundingBoxRight ?? metrics.width;
    const actualAscent = metrics.actualBoundingBoxAscent ?? (numericFontSize * 0.8);
    const actualDescent = metrics.actualBoundingBoxDescent ?? (numericFontSize * 0.2);

    const textBoundingWidth = Math.ceil(actualLeft + actualRight);
    tightHeight = Math.ceil(actualAscent + actualDescent);

    const extraWidthBuffer = 10;
    offscreenWidth = textBoundingWidth + extraWidthBuffer;

    offscreen.width = offscreenWidth;
    offscreen.height = tightHeight;

    const xOffset = extraWidthBuffer / 2;
    offCtx.font = fontString;
    offCtx.textBaseline = 'alphabetic';
    offCtx.fillStyle = color;
    offCtx.fillText(text, xOffset - actualLeft, actualAscent);

    horizontalMargin = fuzzRange + 12;
    verticalMargin = 0;

    canvas.width = offscreenWidth + horizontalMargin * 2;
    canvas.height = tightHeight + verticalMargin * 2;

    // Reset transform & center canvas text area
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(horizontalMargin, verticalMargin);

    // Negative margin so canvas aligns seamlessly with inline text
    canvas.style.marginLeft = `-${horizontalMargin}px`;
    // Offset canvas downward by calibrated font descent ratio so its baseline and cap-height lock with "Exploring"
    canvas.style.transform = `translateY(${Math.round(numericFontSize * 0.25)}px)`;

    interactiveLeft = horizontalMargin + xOffset;
    interactiveTop = verticalMargin;
    interactiveRight = interactiveLeft + textBoundingWidth;
    interactiveBottom = interactiveTop + tightHeight;

    // Render single frame
    renderFrame(performance.now());

    if (!prefersReducedMotion && !isRunning) {
      startGlitchLoop();
      startLoop();
    }
  }

  function startGlitchLoop() {
    if (!glitchMode || isCancelled) return;
    glitchTimeoutId = setTimeout(() => {
      if (isCancelled) return;
      isGlitching = true;
      glitchEndTimeoutId = setTimeout(() => {
        isGlitching = false;
        startGlitchLoop();
      }, glitchDuration);
    }, glitchInterval);
  }

  function renderFrame(timestamp) {
    if (!ctx || !offscreen) return;

    ctx.clearRect(
      -horizontalMargin,
      -verticalMargin - 5,
      offscreenWidth + 2 * horizontalMargin,
      tightHeight + 2 * verticalMargin + 10
    );

    if (isClicking) {
      targetIntensity = 1;
    } else if (isGlitching) {
      targetIntensity = 0.85;
    } else if (isHovering) {
      targetIntensity = hoverIntensity;
    } else {
      targetIntensity = baseIntensity;
    }

    if (transitionDuration > 0) {
      const step = 1 / (transitionDuration / frameDuration);
      if (currentIntensity < targetIntensity) {
        currentIntensity = Math.min(currentIntensity + step, targetIntensity);
      } else if (currentIntensity > targetIntensity) {
        currentIntensity = Math.max(currentIntensity - step, targetIntensity);
      }
    } else {
      currentIntensity = targetIntensity;
    }

    if (direction === 'horizontal') {
      for (let j = 0; j < tightHeight; j++) {
        const dx = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange);
        ctx.drawImage(offscreen, 0, j, offscreenWidth, 1, dx, j, offscreenWidth, 1);
      }
    } else {
      for (let i = 0; i < offscreenWidth; i++) {
        const dy = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange);
        ctx.drawImage(offscreen, i, 0, 1, tightHeight, i, dy, 1, tightHeight);
      }
    }
  }

  function loop(timestamp) {
    if (!isRunning || isCancelled) return;

    if (timestamp - lastFrameTime >= frameDuration) {
      lastFrameTime = timestamp;
      renderFrame(timestamp);
    }

    animationFrameId = window.requestAnimationFrame(loop);
  }

  function startLoop() {
    if (isRunning) return;
    isRunning = true;
    lastFrameTime = performance.now();
    animationFrameId = window.requestAnimationFrame(loop);
  }

  function stopLoop() {
    isRunning = false;
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function isInsideTextArea(x, y) {
    return x >= interactiveLeft && x <= interactiveRight && y >= interactiveTop && y <= interactiveBottom;
  }

  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    isHovering = isInsideTextArea(x, y);
  }

  function handleMouseLeave() {
    isHovering = false;
  }

  function handleClick() {
    if (!clickEffect) return;
    isClicking = true;
    clearTimeout(clickTimeoutId);
    clickTimeoutId = setTimeout(() => {
      isClicking = false;
    }, 150);
  }

  function handleTouchMove(e) {
    if (!e.touches || !e.touches[0]) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    isHovering = isInsideTextArea(x, y);
  }

  function handleTouchEnd() {
    isHovering = false;
  }

  canvas.addEventListener('mousemove', handleMouseMove, { passive: true });
  canvas.addEventListener('mouseleave', handleMouseLeave, { passive: true });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
  if (clickEffect) {
    canvas.addEventListener('click', handleClick);
  }

  // IntersectionObserver: Pause RAF completely when hero is scrolled out of view!
  // Saves 100% of CPU/GPU when scrolling down the rest of the portfolio.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!prefersReducedMotion) startLoop();
        } else {
          stopLoop();
        }
      });
    }, { threshold: 0.05 });
    observer.observe(canvas);
  } else {
    if (!prefersReducedMotion) startLoop();
  }

  // Window Resize with debounce
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      init();
    }, 150);
  }, { passive: true });

  // Init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
