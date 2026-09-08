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
      '.about-copy-block'
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
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '10000px 0px -12% 0px', threshold: 0 });

    els.forEach((el) => io.observe(el));
  })();

});
