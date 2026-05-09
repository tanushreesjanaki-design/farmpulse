/* ============================================================
   farmpulse-magic.js  v3.1
   Fixes: overlay panel bug, tainted-canvas cursor, leaf bg
   ============================================================ */

(function () {
  'use strict';
  const $ = (sel) => document.querySelector(sel);

  /* ── 1. FLOATING POLLEN PARTICLES ────────────────────────── */
  function initParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'fp-particles';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');
    const COLORS = ['rgba(251,191,36,','rgba(34,197,94,','rgba(245,158,11,','rgba(22,101,52,','rgba(14,165,233,'];
    const NUM = 42;
    let W, H, particles;

    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }

    function mkParticle(randomY) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      return {
        x: Math.random() * (W || window.innerWidth),
        y: randomY ? Math.random() * (H || window.innerHeight) : (H || window.innerHeight) + 10,
        r: 1.4 + Math.random() * 2.6, speed: 0.3 + Math.random() * 0.6,
        drift: (Math.random() - 0.5) * 0.4, phase: Math.random() * Math.PI * 2,
        freq: 0.006 + Math.random() * 0.01, alpha: 0.28 + Math.random() * 0.5,
        color, rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04, leaf: Math.random() > 0.5,
      };
    }

    function drawLeaf(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
      ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.9, p.r * 0.85, 0, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ')'; ctx.fill(); ctx.restore();
    }
    function drawDot(p) {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ')'; ctx.fill();
    }

    let t = 0;
    function animate() {
      t++; ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.y -= p.speed; p.x += Math.sin(t * p.freq + p.phase) * p.drift; p.rotation += p.rotSpeed;
        if (p.y < -20) Object.assign(p, mkParticle(false));
        p.leaf ? drawLeaf(p) : drawDot(p);
      });
      requestAnimationFrame(animate);
    }
    resize(); window.addEventListener('resize', resize);
    particles = Array.from({ length: NUM }, () => mkParticle(true));
    requestAnimationFrame(animate);
  }

  /* ── 2. CURSOR — programmatic leaf (avoids tainted canvas) ─ */
  function initCursor() {
    // Draw leaf cursor entirely on canvas — no external image load
    // so file:// CORS tainted-canvas error never occurs
    function drawCursor(size, color1, color2, outlineColor) {
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');

      // Leaf pointing upper-left, tip at (4, 4)
      ctx.beginPath();
      ctx.moveTo(4, 4);
      ctx.bezierCurveTo(22, 1, size - 2, 10, size - 2, 26);
      ctx.bezierCurveTo(size - 2, size - 2, 26, size - 2, 10, size - 8);
      ctx.bezierCurveTo(1, 22, 1, 8, 4, 4);
      ctx.closePath();

      const grad = ctx.createLinearGradient(4, 4, size - 2, size - 2);
      grad.addColorStop(0, color1);
      grad.addColorStop(1, color2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Center vein
      ctx.beginPath();
      ctx.moveTo(4, 4);
      ctx.bezierCurveTo(18, 18, 30, 30, size - 4, size - 4);
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.45;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Side veins
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 0.8;
      [[10,8,20,4],[16,14,28,8],[22,20,34,16]].forEach(([x1,y1,x2,y2]) => {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(y1,x1); ctx.lineTo(y2,x2); ctx.stroke();
      });
      ctx.globalAlpha = 1;

      return c.toDataURL('image/png');
    }

    const normalURL  = drawCursor(48, '#4ade80', '#166534', '#0a3d1f');
    const hoverURL   = drawCursor(56, '#f59e0b', '#d97706', '#78350f');

    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after, html, body {
        cursor: url("${normalURL}") 4 4, auto !important;
      }
      button, select, a, .lang-btn,
      #upload-box, .upload-box, #diagnose-btn, #speak-btn {
        cursor: url("${hoverURL}") 4 4, pointer !important;
      }
    `;
    document.head.appendChild(style);
  }

  /* ── 3. LEAF.PNG AS BODY BACKGROUND — no extra div ────────── */
  function initLeafBackground() {
    // Inject via style tag so body::after can overlay gradient
    // — avoids creating a div that gets caught by body > div CSS selector
    const style = document.createElement('style');
    style.textContent = `
      body {
        background-image: url('leaf.png') !important;
        background-size: cover !important;
        background-position: center !important;
        background-attachment: fixed !important;
      }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: linear-gradient(
          145deg,
          rgba(232,245,233,0.78) 0%,
          rgba(255,253,231,0.75) 38%,
          rgba(241,248,233,0.78) 68%,
          rgba(224,247,250,0.75) 100%
        );
        pointer-events: none;
        z-index: 0;
      }
    `;
    document.head.appendChild(style);
  }

  /* ── 4. 3D CARD TILT + SHINE ─────────────────────────────── */
  function initTilt() {
    const card = document.querySelector('body > div');
    if (!card) return;

    const shine = document.createElement('div');
    shine.id = 'fp-shine';
    Object.assign(shine.style, {
      position: 'absolute', width: '300px', height: '300px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 65%)',
      pointerEvents: 'none', transform: 'translate(-50%, -50%)',
      opacity: '0', zIndex: '1', transition: 'opacity 0.3s ease',
      top: '50%', left: '50%',
    });
    card.prepend(shine);

    card.style.backdropFilter = 'none';
    card.style.webkitBackdropFilter = 'none';
    card.style.background = 'rgba(255, 252, 230, 0.9)';

    const MAX = 4;
    document.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const relX = e.clientX - rect.left, relY = e.clientY - rect.top;
      const pX = relX / rect.width, pY = relY / rect.height;
      card.style.transform = `perspective(1000px) rotateX(${-(pY-0.5)*MAX*2}deg) rotateY(${(pX-0.5)*MAX*2}deg)`;
      const inside = relX >= 0 && relX <= rect.width && relY >= 0 && relY <= rect.height;
      shine.style.left = relX + 'px'; shine.style.top = relY + 'px';
      shine.style.opacity = inside ? '1' : '0';
    });
    document.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      shine.style.opacity = '0';
    });
  }

  /* ── 5. MAGNETIC DIAGNOSE BUTTON ─────────────────────────── */
  function initMagnetic() {
    const btn = $('#diagnose-btn');
    if (!btn) return;
    const STRENGTH = 0.28, RADIUS = 88;
    document.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < RADIUS) {
        const pull = (1 - dist / RADIUS) * STRENGTH;
        btn.style.transform = `translate(${dx*pull}px, ${dy*pull}px)`;
        btn.style.boxShadow = '0 18px 48px rgba(22,101,52,0.35)';
      } else { btn.style.transform = ''; btn.style.boxShadow = ''; }
    });
  }

  /* ── 6. RIPPLE ON LANGUAGE BUTTONS ───────────────────────── */
  function initRipple() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.lang-btn');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      Object.assign(ripple.style, {
        position: 'absolute', borderRadius: '50%', background: 'rgba(245,158,11,0.4)',
        width: '6px', height: '6px',
        left: (e.clientX - rect.left - 3) + 'px', top: (e.clientY - rect.top - 3) + 'px',
        transform: 'scale(0)', pointerEvents: 'none', animation: 'rippleOut 0.55s linear forwards',
      });
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  /* ── 7. TYPEWRITER ON DISEASE NAME ───────────────────────── */
  function initTypewriter() {
    const nameEl = $('#result-disease-name');
    if (!nameEl) return;
    let busy = false;
    const observer = new MutationObserver(() => {
      if (busy) return;
      const fullText = nameEl.textContent.trim();
      if (!fullText) return;
      busy = true;
      nameEl.textContent = ''; nameEl.classList.add('typing');
      let i = 0;
      const speed = Math.max(28, Math.min(65, 1400 / fullText.length));
      const tick = () => {
        if (i < fullText.length) { nameEl.textContent += fullText[i++]; setTimeout(tick, speed); }
        else { nameEl.classList.remove('typing'); busy = false; }
      };
      setTimeout(tick, 200);
    });
    observer.observe(nameEl, { childList: true, characterData: true, subtree: true });
  }

  /* ── 8. FARMER MASCOT ────────────────────────────────────── */
  function initMascot() {
    const resultCard = $('#result-card');
    const nameEl     = $('#result-disease-name');
    if (!resultCard || !nameEl) return;

    const kf = document.createElement('style');
    kf.textContent = `
      @keyframes farmerWobble {
        0%,100% { transform: rotate(-2deg) translateY(0); }
        50%      { transform: rotate(2deg) translateY(-6px); }
      }
      @keyframes farmerBounceIn {
        0%   { opacity:0; transform: translateY(32px) scale(0.65); }
        55%  { opacity:1; transform: translateY(-10px) scale(1.1); }
        75%  { transform: translateY(4px) scale(0.96); }
        100% { opacity:1; transform: translateY(0) scale(1); }
      }
      #fp-mascot img { animation: farmerWobble 3s ease-in-out infinite; }
    `;
    document.head.appendChild(kf);

    const mascot = document.createElement('div');
    mascot.id = 'fp-mascot';
    Object.assign(mascot.style, {
      display: 'flex', justifyContent: 'center',
      marginBottom: '16px', opacity: '0',
      transform: 'translateY(28px) scale(0.7)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    });

    const farmerImg = document.createElement('img');
    farmerImg.src = 'farmer-happy.png';
    Object.assign(farmerImg.style, {
      width: '110px', height: '110px', objectFit: 'contain',
      filter: 'drop-shadow(0 8px 18px rgba(22,101,52,0.28))',
    });
    mascot.appendChild(farmerImg);
    resultCard.insertBefore(mascot, resultCard.firstChild);

    const HEALTHY = ['no disease','healthy','normal','not a plant','स्वस्थ','ಆರೋಗ್ಯ','ஆரோக்கியம்'];

    const observer = new MutationObserver(() => {
      const isVisible = resultCard.classList.contains('visible');
      const text = nameEl.textContent.toLowerCase().trim();
      if (isVisible && text) {
        farmerImg.src = HEALTHY.some(t => text.includes(t)) ? 'farmer-happy.png' : 'farmer-sad.png';
        mascot.style.animation = 'farmerBounceIn 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards';
        mascot.style.opacity = '1';
        mascot.style.transform = 'translateY(0) scale(1)';
      } else if (!isVisible) {
        mascot.style.animation = '';
        mascot.style.opacity = '0';
        mascot.style.transform = 'translateY(28px) scale(0.7)';
      }
    });

    observer.observe(resultCard, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
    observer.observe(nameEl, { childList: true, characterData: true, subtree: true });
  }

  /* ── 9. CONFETTI BURST ───────────────────────────────────── */
  function initConfetti() {
    const COLORS = ['#22c55e','#f59e0b','#fbbf24','#0ea5e9','#166534','#fff176','#ff8a65'];
    const HEALTHY = ['no disease','healthy','normal','not a plant','स्वस्थ','ಆರೋಗ್ಯ','ஆரோக்கியம்'];

    function burst() {
      for (let i = 0; i < 64; i++) {
        const piece = document.createElement('div');
        const vx = (Math.random() - 0.5) * 300;
        Object.assign(piece.style, {
          position: 'fixed',
          left: (window.innerWidth / 2 + (Math.random() - 0.5) * 200) + 'px',
          top: (window.innerHeight / 3) + 'px',
          width: (7 + Math.random() * 9) + 'px', height: (7 + Math.random() * 9) + 'px',
          background: COLORS[Math.floor(Math.random() * COLORS.length)],
          borderRadius: Math.random() > 0.5 ? '50%' : '3px',
          pointerEvents: 'none', zIndex: '99998',
        });
        piece.animate([
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${vx*.6}px,${-80}px) rotate(180deg)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${vx}px,120px) rotate(720deg)`, opacity: 0 },
        ], { duration: 900 + Math.random() * 800, delay: Math.random() * 200, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards' });
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 2000);
      }
    }

    const resultCard = $('#result-card');
    if (!resultCard) return;
    const obs = new MutationObserver(() => {
      const nameEl = $('#result-disease-name');
      if (!nameEl) return;
      const text = nameEl.textContent.toLowerCase();
      if (resultCard.classList.contains('visible') && HEALTHY.some(t => text.includes(t)))
        setTimeout(burst, 700);
    });
    obs.observe(resultCard, { attributes: true, attributeFilter: ['class'], subtree: true });
  }

  /* ── Boot ────────────────────────────────────────────────── */
  function boot() {
    initParticles();
    initCursor();         // programmatic canvas leaf — no tainted canvas issue
    initLeafBackground(); // style tag only — no rogue div
    initTilt();
    initMagnetic();
    initRipple();
    initTypewriter();
    initMascot();
    initConfetti();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})();