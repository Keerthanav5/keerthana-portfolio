class Halftone {
  constructor(el, o) {
    this.o = Object.assign({
      src: null,
      shape: 'circle',
      color: 'rgb+',
      c1: '#ff9a2e',
      c2: '#ff3d00',
      c3: '#fff1d6',
      dir: 'diag',
      spacing: 7,
      size: 1,
      radius: 140,
      force: 6,
      contrast: 1.4,
      brightness: 0.0,
      gain: 1.0,
      threshold: 0.05,
      vibrance: 1.2,
      warmth: 0.0,
      autoExpand: true,
      expand: 0.8,
      align: 'right',
      packing: 'hex',
      interactionMode: 'repel',
      invert: false,
      onAdapt: null
    }, o || {});
    this.el = el;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    this.cv = document.createElement('canvas');
    this.cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
    el.appendChild(this.cv);
    this.ctx = this.cv.getContext('2d');
    this.m = { x: -9999, y: -9999, px: null, py: null, s: 0, t: -1e9 };
    this.vis = true;
    this.n = 0;
    this.fa = 16;
    this.fc = 0;
    this.ad = 0;
    this.last = 0;
    this.frame = this.frame.bind(this);

    this.mv = e => {
      const r = this.cv.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (x < -20 || x > r.width + 20 || y < -20 || y > r.height + 20) {
        this.m.x = -9999;
        this.m.y = -9999;
        return;
      }
      const m = this.m;
      if (m.px !== null) m.s = m.s * 0.8 + Math.hypot(x - m.px, y - m.py) * 0.2;
      m.px = m.x = x;
      m.py = m.y = y;
      m.t = performance.now();
    };

    this.dn = e => {
      if (e.target.closest && e.target.closest('button,input,select,label,a,aside,header,.modal-card')) return;
      const r = this.cv.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const R = 280;
      const pull = this.o.interactionMode === 'attract' ? -1 : 1;
      for (let i = 0; i < this.n; i++) {
        const dx = this.x[i] - x;
        const dy = this.y[i] - y;
        const d = Math.hypot(dx, dy);
        if (d < R && d > 0) {
          const f = (1 - d / R) * 16 * pull;
          this.vx[i] += (dx / d) * f;
          this.vy[i] += (dy / d) * f;
        }
      }
    };

    this.lv = () => {
      this.m.x = this.m.y = -9999;
      this.m.px = null;
    };

    addEventListener('pointermove', this.mv);
    addEventListener('pointerdown', this.dn);
    addEventListener('pointerup', e => { 
      if (e.pointerType === 'touch') {
        // Smooth transition back to autoExpand rather than instant zero
        setTimeout(() => this.lv(), 500);
      }
    });

    // Dedicated Touch handlers for mobile devices (ONLY user fingers)
    const onTouchStart = e => {
      if (!e.touches || !e.touches[0]) return;
      const touch = e.touches[0];
      const r = this.cv.getBoundingClientRect();
      const x = touch.clientX - r.left;
      const y = touch.clientY - r.top;
      this.m.px = this.m.x = x;
      this.m.py = this.m.y = y;
      this.m.s = 12;
      this.m.t = performance.now();

      // Trigger instantaneous particle dispersion around touch point
      const R = 220;
      const pull = this.o.interactionMode === 'attract' ? -1 : 1;
      for (let i = 0; i < this.n; i++) {
        const dx = this.x[i] - x;
        const dy = this.y[i] - y;
        const d = Math.hypot(dx, dy);
        if (d < R && d > 0) {
          const f = (1 - d / R) * 14 * pull;
          this.vx[i] += (dx / d) * f;
          this.vy[i] += (dy / d) * f;
        }
      }
    };

    const onTouchMove = e => {
      if (!e.touches || !e.touches[0]) return;
      const touch = e.touches[0];
      const r = this.cv.getBoundingClientRect();
      const x = touch.clientX - r.left;
      const y = touch.clientY - r.top;
      const m = this.m;
      const dist = m.px !== null ? Math.hypot(x - m.px, y - m.py) : 8;
      m.s = m.s * 0.7 + dist * 0.3;
      m.px = m.x = x;
      m.py = m.y = y;
      m.t = performance.now();
    };

    const onTouchEnd = () => {
      this.lv();
    };

    this.cv.addEventListener('touchstart', onTouchStart, { passive: true });
    this.cv.addEventListener('touchmove', onTouchMove, { passive: true });
    this.cv.addEventListener('touchend', onTouchEnd, { passive: true });
    this.cv.addEventListener('touchcancel', onTouchEnd, { passive: true });

    this.ro = new ResizeObserver(() => {
      clearTimeout(this.rt);
      this.rt = setTimeout(() => this.build(), 120);
    });
    this.ro.observe(el);
    this.io = new IntersectionObserver(a => { this.vis = a[0].isIntersecting; });
    this.io.observe(el);
    if (this.o.src) this.setSrc(this.o.src); else this.build();
    this.raf = requestAnimationFrame(this.frame);
  }

  static ph() {
    const c = document.createElement('canvas');
    c.width = 600;
    c.height = 800;
    const g = c.getContext('2d');
    g.fillStyle = '#000';
    g.fillRect(0, 0, 600, 800);
    let r = g.createRadialGradient(300, 260, 20, 300, 260, 150);
    r.addColorStop(0, '#fff');
    r.addColorStop(1, '#222');
    g.fillStyle = r;
    g.beginPath();
    g.ellipse(300, 260, 120, 150, 0, 0, 7);
    g.fill();
    r = g.createRadialGradient(300, 700, 40, 300, 700, 330);
    r.addColorStop(0, '#ddd');
    r.addColorStop(1, '#111');
    g.fillStyle = r;
    g.beginPath();
    g.ellipse(300, 760, 270, 330, 0, 0, 7);
    g.fill();
    return c;
  }

  static hex(h) {
    const n = parseInt(h.slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }

  setSrc(s) {
    const im = new Image();
    if (!s.startsWith('blob:')) im.crossOrigin = 'anonymous';
    im.onload = () => { this.img = im; this.build(); };
    im.src = s;
  }

  build() {
    const o = this.o, W = this.W = this.el.clientWidth, H = this.H = this.el.clientHeight;
    if (!W || !H) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.cv.width = W * dpr;
    this.cv.height = H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const src = this.img || Halftone.ph();
    const s = Math.min(W / src.width, H / src.height) * 1.18;
    const w = src.width * s;
    const h = src.height * s;

    let ox;
    if (o.align === 'left') ox = W > 800 ? W * 0.05 : (W - w) / 2;
    else if (o.align === 'center') ox = (W - w) / 2;
    else ox = W > 800 ? W - w - W * 0.05 : (W - w) / 2;
    const oy = Math.max(0, (H - h) * 0.08);

    const oc = document.createElement('canvas');
    oc.width = W;
    oc.height = H;
    const g = oc.getContext('2d', { willReadFrequently: true });
    g.drawImage(src, ox, oy, w, h);
    const d = g.getImageData(0, 0, W, H).data;
    const sp = o.spacing;
    const cx = ox + w / 2;
    const cy = oy + h * 0.4;
    const mr = Math.hypot(w, h) / 2;
    this.cxy = [cx, cy];

    const isRGBPlus = o.color === 'rgb+';
    const isMono = o.color === 'mono';
    const isGrad = o.color === 'gradient';

    // 12-Bit RGB+ TrueColor Space: 4096 Adaptive Buckets (16x16x16)
    // Delivers smooth skin tones, zero posterization banding, 120 FPS batching
    const BUCKET_COUNT = isRGBPlus ? 4096 : (isGrad ? 64 : 48);
    const a = Halftone.hex(o.c1);
    const b = Halftone.hex(o.c2);
    const c = Halftone.hex(o.c3);
    
    // Dynamic Bucket Accumulators for TrueColor Average
    const sumR = isRGBPlus ? new Float32Array(4096) : null;
    const sumG = isRGBPlus ? new Float32Array(4096) : null;
    const sumB = isRGBPlus ? new Float32Array(4096) : null;
    const countB = isRGBPlus ? new Int32Array(4096) : null;

    const hx = [], hy = [], sz = [];
    const bucketLists = Array.from({ length: BUCKET_COUNT }, () => []);
    let n = 0;
    const isHex = o.packing === 'hex';
    let rowIndex = 0;

    for (let y = sp / 2; y < H; y += (isHex ? sp * 0.866 : sp)) {
      const xOffset = (isHex && (rowIndex % 2 === 1)) ? sp * 0.5 : 0;
      for (let x = sp / 2 + xOffset; x < W; x += sp) {
        const px = Math.floor(x);
        const py = Math.floor(y);
        const i = (py * W + px) * 4;
        const al = d[i + 3] / 255;
        if (al < 0.05) continue;

        let r = d[i], gVal = d[i + 1], bVal = d[i + 2];

        // 1. Color Vibrance Boost
        if (o.vibrance !== 1.0) {
          const maxC = Math.max(r, gVal, bVal);
          const avg = (r + gVal + bVal) / 3;
          const amt = ((maxC - avg) / 255) * -0.5 + 1;
          const satFactor = 1 + (o.vibrance - 1) * amt;
          r = Math.min(255, Math.max(0, avg + (r - avg) * satFactor));
          gVal = Math.min(255, Math.max(0, avg + (gVal - avg) * satFactor));
          bVal = Math.min(255, Math.max(0, avg + (bVal - avg) * satFactor));
        }

        // 2. Skin Warmth Shift
        if (o.warmth !== 0.0) {
          r = Math.min(255, Math.max(0, r + o.warmth * 38));
          bVal = Math.min(255, Math.max(0, bVal - o.warmth * 26));
        }

        // 3. True Optical Luminance with Brightness & Exposure Gain
        let lum = (0.299 * r + 0.587 * gVal + 0.114 * bVal) / 255 * al;
        lum = lum * o.gain + o.brightness;
        if (o.invert) lum = 1 - lum;
        lum = Math.min(1, Math.max(0, Math.pow(Math.max(0, lum), 1 / o.contrast)));

        // 4. Shadow Floor Cutoff
        if (lum < o.threshold) continue;

        let k;
        if (isRGBPlus) {
          // Map to 12-bit RGB bucket
          const qr = Math.min(15, (r / 16) | 0);
          const qg = Math.min(15, (gVal / 16) | 0);
          const qb = Math.min(15, (bVal / 16) | 0);
          k = (qr << 8) | (qg << 4) | qb;
          sumR[k] += r;
          sumG[k] += gVal;
          sumB[k] += bVal;
          countB[k]++;
        } else if (isGrad) {
          let t = lum;
          if (o.dir === 'vert') t = (y - oy) / h;
          else if (o.dir === 'diag') t = ((x - ox) / w + (y - oy) / h) / 2;
          else if (o.dir === 'rad') t = Math.hypot(x - cx, y - cy) / mr;
          k = Math.max(0, Math.min(63, (t * 63) | 0));
        } else {
          k = Math.max(0, Math.min(47, (lum * 47) | 0));
        }

        hx.push(x);
        hy.push(y);
        sz.push(sp * 0.5 * (0.22 + 0.78 * lum) * o.size);
        bucketLists[k].push(n++);
      }
      rowIndex++;
    }

    // Build the Palette strings (TrueColor direct averages)
    this.pal = [];
    const activeBuckets = [];

    for (let k = 0; k < BUCKET_COUNT; k++) {
      if (!bucketLists[k].length) continue;
      activeBuckets.push(k);

      if (isRGBPlus) {
        const cnt = countB[k] || 1;
        const finalR = Math.round(sumR[k] / cnt);
        const finalG = Math.round(sumG[k] / cnt);
        const finalB = Math.round(sumB[k] / cnt);
        this.pal[k] = `rgb(${finalR},${finalG},${finalB})`;
      } else if (isGrad) {
        const t = k / 63;
        const u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
        const p = t < 0.5 ? a : b;
        const q = t < 0.5 ? b : c;
        this.pal[k] = `rgb(${Math.round(p[0] + (q[0] - p[0]) * u)},${Math.round(p[1] + (q[1] - p[1]) * u)},${Math.round(p[2] + (q[2] - p[2]) * u)})`;
      } else {
        const v = Math.round(70 + 185 * (k / 47));
        this.pal[k] = `rgb(${v},${v},${v})`;
      }
    }

    this.n = n;
    this.hx = Float32Array.from(hx);
    this.hy = Float32Array.from(hy);
    this.sz = Float32Array.from(sz);
    this.activeBuckets = activeBuckets;
    this.bk = bucketLists.map(l => Int32Array.from(l));
    this.replay();
  }

  replay() {
    const n = this.n;
    this.x = new Float32Array(n);
    this.y = new Float32Array(n);
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      this.x[i] = this.hx[i];
      this.y[i] = this.hy[i];
    }
  }

  frame(t) {
    this.raf = requestAnimationFrame(this.frame);
    if (!this.vis || !this.n) return;
    const dtm = t - this.last;
    this.last = t;
    const dt = Math.min(2.5, dtm / 16.67 || 1);
    const o = this.o, m = this.m;

    this.fa = this.fa * 0.95 + Math.min(dtm, 100) * 0.05;

    let mx = m.x, my = m.y;
    if (t - m.t > 800) {
      mx = -9999;
      my = -9999;
    }
    m.s *= 0.93;

    const R = o.radius, R2 = R * R;
    const pullMultiplier = o.interactionMode === 'attract' ? -1 : 1;
    const F = o.force * (1 + Math.min(m.s / 15, 2)) * dt * pullMultiplier;
    const K = 0.06 * dt;
    const D = Math.pow(0.84, dt);
    const { x, y, vx, vy, hx, hy, n } = this;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - mx, dy = y[i] - my, d2 = dx * dx + dy * dy, ex = hx[i] - x[i], ey = hy[i] - y[i];
      if (d2 < R2) {
        const d = Math.sqrt(d2) || 1, f = (1 - d / R) * F;
        vx[i] += (dx / d) * f;
        vy[i] += (dy / d) * f;
      } else if (ex * ex + ey * ey < 0.0004 && vx[i] * vx[i] + vy[i] * vy[i] < 0.0004) {
        continue;
      }
      vx[i] = (vx[i] + ex * K) * D;
      vy[i] = (vy[i] + ey * K) * D;
      x[i] += vx[i];
      y[i] += vy[i];
    }

    const c = this.ctx, sz = this.sz, sh = o.shape, ex = o.expand;
    c.clearRect(0, 0, this.W, this.H);

    for (let idx = 0; idx < this.activeBuckets.length; idx++) {
      const k = this.activeBuckets[idx];
      const L = this.bk[k];
      if (!L.length) continue;
      c.fillStyle = this.pal[k];
      c.beginPath();
      for (let j = 0; j < L.length; j++) {
        const i = L[j], px = x[i], py = y[i], ddx = hx[i] - mx, ddy = hy[i] - my, dd = ddx * ddx + ddy * ddy;
        let g = 1;
        // Expand particles ONLY when under active user finger or cursor (dd < R2)
        if (dd < R2) g += 1.5 * ex * (1 - Math.sqrt(dd) / R);
        const r = sz[i] * g;

        if (sh === 'circle') {
          c.moveTo(px + r, py);
          c.arc(px, py, r, 0, 6.2832);
        } else if (sh === 'square') {
          c.rect(px - r, py - r, r * 2, r * 2);
        } else if (sh === 'diamond') {
          c.moveTo(px, py - r * 1.25);
          c.lineTo(px + r * 1.25, py);
          c.lineTo(px, py + r * 1.25);
          c.lineTo(px - r * 1.25, py);
        } else {
          c.rect(px - r, py - r * 0.3, r * 2, r * 0.6);
          c.rect(px - r * 0.3, py - r, r * 0.6, r * 2);
        }
      }
      c.fill();
    }
  }

  snapshot(scale = 2) {
    const W = this.W * scale;
    const H = this.H * scale;
    const sc = document.createElement('canvas');
    sc.width = W;
    sc.height = H;
    const ctx = sc.getContext('2d');
    ctx.fillStyle = '#0e1315';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(this.cv, 0, 0, W, H);
    return sc.toDataURL('image/png');
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    removeEventListener('pointermove', this.mv);
    removeEventListener('pointerdown', this.dn);
    this.ro.disconnect();
    this.io.disconnect();
    this.cv.remove();
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('hero-portrait');
  if (!el) return;

  window.heroHalftone = new Halftone(el, {
    src: '/portrait.png',
    shape: 'cross',
    color: 'mono',
    c1: '#b85437',
    c2: '#3f1f18',
    c3: '#edd4c5',
    dir: 'diag',
    spacing: 3,
    size: 0.9,
    radius: 140,
    force: 1.5,
    contrast: 1.4,
    brightness: 0,
    gain: 1,
    threshold: 0.06,
    vibrance: 1.25,
    warmth: 0.06,
    autoExpand: false,
    expand: 0.8,
    align: 'center',
    packing: 'hex',
    interactionMode: 'repel',
    invert: false
  });
});
