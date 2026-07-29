  /* ============ Zellige : mosaïque d'étoiles à 8 branches ============
     Porté depuis src/features/home/Zellige.tsx du repo front — deux carrés
     tournés l'un sur l'autre, tessellés et teintés à la palette de marque.
     Les tuiles s'assemblent depuis le centre ; en mouvement réduit, la
     mosaïque est dessinée finie en une frame. */
  function zellige(canvas, opts) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var css = getComputedStyle(document.documentElement);
    function read(name, fallback) {
      return (css.getPropertyValue(name) || '').trim() || fallback;
    }
    var cols = [read('--azur', '#0f5a74'), read('--terracotta', '#d3552e'), read('--safran', '#e4a02e')];
    var grout = opts.grout;

    var w = 0, h = 0, dpr = 1, tiles = [], start = null, raf = 0;

    function poly(cx, cy, r, rot) {
      ctx.beginPath();
      for (var i = 0; i < 4; i++) {
        var a = rot + i * (Math.PI / 2);
        var x = cx + Math.cos(a) * r;
        var y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }

    function build() {
      tiles = [];
      var step = Math.max(56, Math.round(w / 12));
      var r = step * 0.52;
      var cxg = w / 2, cyg = h / 2, idx = 0;
      for (var y = -step / 2; y < h + step; y += step) {
        for (var x = -step / 2; x < w + step; x += step) {
          var dist = Math.hypot(x - cxg, y - cyg);
          tiles.push({ x: x, y: y, r: r, big: true, color: cols[idx % 3], delay: dist * 1.05 });
          tiles.push({ x: x + step / 2, y: y + step / 2, r: r * 0.34, big: false, color: cols[(idx + 2) % 3], delay: dist * 1.05 + 90 });
          idx++;
        }
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      start = null;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }

    function frame(ts) {
      if (start === null) start = ts;
      var elapsed = reduce ? 1e9 : ts - start;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.strokeStyle = grout;
      ctx.lineJoin = 'round';
      var animating = false;
      for (var i = 0; i < tiles.length; i++) {
        var tl = tiles[i];
        var p = reduce ? 1 : (elapsed - tl.delay) / 520;
        if (p < 0) { animating = true; continue; }
        if (p < 1) animating = true; else p = 1;
        var e = 1 - Math.pow(1 - p, 3);
        ctx.save();
        ctx.globalAlpha = e;
        ctx.fillStyle = tl.color;
        var rr = tl.r * (0.7 + 0.3 * e);
        if (tl.big) {
          poly(tl.x, tl.y, rr, Math.PI / 8); ctx.fill(); ctx.stroke();
          poly(tl.x, tl.y, rr, Math.PI / 8 + Math.PI / 4); ctx.fill(); ctx.stroke();
        } else {
          poly(tl.x, tl.y, rr, Math.PI / 4); ctx.fill(); ctx.stroke();
        }
        ctx.restore();
      }
      if (animating) raf = requestAnimationFrame(frame);
    }

    var ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
  }

  zellige(document.getElementById('zellige-hero'), { grout: 'rgba(20,40,48,.16)' });
  zellige(document.getElementById('zellige-closer'), { grout: 'rgba(255,255,255,.14)' });

  /* ============ Révélation au défilement ============ */
  var targets = document.querySelectorAll('.reveal');
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    targets.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 4, 3) * 70) + 'ms';
      io.observe(el);
    });
  } else {
    targets.forEach(function (el) { el.classList.add('in'); });
  }
