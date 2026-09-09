/* ============================================================
   Michelle Shen — Portfolio — shared behavior
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- nav: mark current page + touch-friendly dropdown ---------- */
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === path) link.classList.add('is-current');
  });

  document.querySelectorAll('.nav-item-works').forEach((item) => {
    const trigger = item.querySelector('.nav-link');
    if (!trigger) return;

    // Hover-intent: opens instantly, but closing waits a beat so moving the
    // mouse down from the trigger into the menu never registers as "left".
    let closeTimer = null;
    const open = () => {
      clearTimeout(closeTimer);
      item.classList.add('is-open');
    };
    const scheduleClose = () => {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => item.classList.remove('is-open'), 300);
    };

    item.addEventListener('mouseenter', open);
    item.addEventListener('mouseleave', scheduleClose);
    item.addEventListener('focusin', open);
    item.addEventListener('focusout', (e) => {
      if (!item.contains(e.relatedTarget)) scheduleClose();
    });

    trigger.addEventListener('click', (e) => {
      // On touch devices there's no hover, so tapping the trigger toggles the menu
      // instead of navigating straight to the civic page.
      if (window.matchMedia('(hover: hover)').matches) return;
      e.preventDefault();
      item.classList.toggle('is-open');
    });
  });

  document.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-item-works.is-open').forEach((item) => {
      if (!item.contains(e.target)) item.classList.remove('is-open');
    });
  });

  /* ---------- home hero: cursor-tracking watercolor wash ---------- */
  const heroStage = document.querySelector('[data-hero-stage]');
  const wash = document.querySelector('[data-watercolor-wash]');
  if (heroStage) {
    let leaveTimer = null;

    const moveWash = (clientX, clientY) => {
      if (!wash) return;
      const rect = heroStage.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      heroStage.style.setProperty('--mx', `${x}%`);
      heroStage.style.setProperty('--my', `${y}%`);
    };

    const activate = () => {
      clearTimeout(leaveTimer);
      heroStage.classList.add('is-active');
    };
    const deactivate = () => {
      leaveTimer = setTimeout(() => heroStage.classList.remove('is-active'), 60);
    };

    heroStage.addEventListener('mousemove', (e) => {
      activate();
      moveWash(e.clientX, e.clientY);
    });
    heroStage.addEventListener('mouseenter', (e) => {
      activate();
      moveWash(e.clientX, e.clientY);
    });
    heroStage.addEventListener('mouseleave', deactivate);
    heroStage.addEventListener('focusin', activate);
    heroStage.addEventListener('focusout', deactivate);
  }

  /* ---------- generic carousel(s) ---------- */
  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const track = root.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const dotsWrap = root.querySelector('.carousel-dots');
    const prevBtn = root.querySelector('[data-carousel-prev]');
    const nextBtn = root.querySelector('[data-carousel-next]');
    let index = 0;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      if (i === 0) dot.classList.add('is-active');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });

    function render() {
      track.style.transform = `translateX(-${index * 100}%)`;
      dotsWrap.querySelectorAll('button').forEach((d, i) => {
        d.classList.toggle('is-active', i === index);
      });
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      render();
    }

    prevBtn && prevBtn.addEventListener('click', () => goTo(index - 1));
    nextBtn && nextBtn.addEventListener('click', () => goTo(index + 1));
  });

  /* ---------- civic play button: gentle no-op affordance ---------- */
  document.querySelectorAll('[data-play-frame]').forEach((frame) => {
    frame.setAttribute('role', 'button');
    frame.setAttribute('tabindex', '0');
    frame.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
    });
  });

  /* ---------- scroll reveal: fade + rise content into view ----------
     Covers the home page below the hero, every works page, and about.
     Gracefully degrades: without IntersectionObserver, or with reduced
     motion, everything just shows normally. */
  (() => {
    const selector = [
      '.intro-strip-text > *',
      '.intro-strip-selfie',
      '.page-head > *',
      '.page-divider',
      '.block > *',
      '.about-visuals > *',
      '.about-copy-block',
      '.about-connect'
    ].join(',');

    const els = Array.from(document.querySelectorAll(selector));
    if (!els.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    document.documentElement.classList.add('reveal-ready');

    // stagger siblings that share a parent so a row/grid ripples in
    const groupCount = new Map();
    els.forEach((el) => {
      el.classList.add('reveal');
      const parent = el.parentElement;
      const i = groupCount.get(parent) || 0;
      groupCount.set(parent, i + 1);
      el.style.transitionDelay = Math.min(i * 70, 280) + 'ms';
    });

    // Huge top margin: anything from far above down to ~12% from the
    // bottom counts as "intersecting". Elements below that line stay
    // hidden until scrolled to; anything already scrolled past still
    // gets caught on the next callback (a fast flick can't skip it).
    const reveal = (el) => {
      el.classList.add('is-visible');
      io.unobserve(el);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) reveal(entry.target); });
    }, { rootMargin: '10000px 0px -12% 0px', threshold: 0 });

    els.forEach((el) => io.observe(el));

    // Safety net: anything already within the real viewport (e.g. the last
    // block on a short page that can never scroll past the -12% line) gets
    // revealed on load and after settle, so content is never stuck hidden.
    const sweep = () => {
      els.forEach((el) => {
        if (el.classList.contains('is-visible')) return;
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) reveal(el);
      });
    };
    window.addEventListener('load', sweep);
    setTimeout(sweep, 1200);
  })();

  /* ---------- works pages: overscroll at an edge → adjacent page ----------
     When you're already at the very bottom and keep scrolling down, a
     hint ("onto next page") grows in; push far enough and it navigates
     to the next works page. Same at the top for "previous page".
     Works for wheel and touch; the hint is also a plain link you can
     click. Loops civic → design → dev → civic. */
  (() => {
    const order = {
      'works-civic.html':  { prev: 'works-dev.html',    next: 'works-design.html' },
      'works-design.html': { prev: 'works-civic.html',  next: 'works-dev.html' },
      'works-dev.html':    { prev: 'works-design.html', next: 'works-civic.html' }
    };
    const links = order[path];
    if (!links) return;

    const docEl = document.documentElement;
    if (docEl.scrollHeight <= window.innerHeight + 40) return; // page doesn't scroll

    const arrow =
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M12 5v14M5 13l7 7 7-7" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const make = (dir, label, href) => {
      const a = document.createElement('a');
      a.className = 'page-jump page-jump-' + dir;
      a.href = href;
      a.setAttribute('aria-label', label);
      a.innerHTML = arrow + '<span>' + label.toLowerCase() + '</span>';
      document.body.appendChild(a);
      return a;
    };
    const nextHint = make('next', 'Onto next page', links.next);
    const prevHint = make('prev', 'Previous page', links.prev);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none)').matches;
    // extra pull past the edge needed to auto-navigate — low on touch so a
    // gentle nudge works, and the hint is a tappable link regardless.
    const THRESHOLD = reduce ? 60 : isTouch ? 150 : 220;
    const BASE_P = 0.62;   // how "shown" the hint is just from reaching the edge

    let pull = 0;          // overscroll accumulated past the current edge
    let edge = null;       // 'next' | 'prev' | null — which edge we're resting at
    let engaged = false;   // reader has scrolled into the page at least once
    let firing = false;
    let decayTimer = null;

    const atTop = () => window.scrollY <= 4;
    const atBottom = () =>
      window.innerHeight + window.scrollY >= docEl.scrollHeight - 4;

    const paint = () => {
      [['next', nextHint], ['prev', prevHint]].forEach(([dir, h]) => {
        if (dir === edge && !firing) {
          const p = Math.min(BASE_P + Math.abs(pull) / THRESHOLD * (1 - BASE_P), 1);
          h.style.setProperty('--p', p.toFixed(3));
          h.classList.add('is-visible');
        } else if (!h.classList.contains('is-firing')) {
          h.style.setProperty('--p', '0');
          h.classList.remove('is-visible');
        }
      });
    };

    const setEdge = (e) => {
      if (firing || e === edge) return;
      edge = e;
      pull = 0;
      paint();
    };

    const fire = (dir) => {
      if (firing) return;
      firing = true;
      (dir === 'next' ? nextHint : prevHint).classList.add('is-firing');
      setTimeout(() => {
        window.location.href = dir === 'next' ? links.next : links.prev;
      }, 180);
    };

    // count only pulls that push further past the edge we're resting at
    const feed = (dy) => {
      if (firing || !dy || !edge) return;
      if ((edge === 'next' && dy > 0) || (edge === 'prev' && dy < 0)) {
        pull += Math.abs(dy);
        paint();
        clearTimeout(decayTimer);
        decayTimer = setTimeout(() => { pull = 0; paint(); }, 700);
        if (pull >= THRESHOLD) fire(edge);
      }
    };

    window.addEventListener('wheel', (e) => {
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      feed(e.deltaY * unit);
    }, { passive: true });

    let ty = null;
    window.addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (ty === null) return;
      const y = e.touches[0].clientY;
      feed(ty - y);
      ty = y;
    }, { passive: true });
    window.addEventListener('touchend', () => { ty = null; }, { passive: true });

    // The hint appears (and is tappable) the moment you reach an edge — no
    // aggressive overscroll needed. `scroll` fires during momentum too, so
    // it shows up on touch as soon as you land at the bottom / top.
    const syncEdge = () => {
      if (window.scrollY > 120) engaged = true;
      if (atBottom()) setEdge('next');
      else if (atTop() && engaged) setEdge('prev');
      else setEdge(null);
    };
    window.addEventListener('scroll', syncEdge, { passive: true });
    window.addEventListener('resize', syncEdge, { passive: true });
    syncEdge();
  })();

});
