/* Noor Dental Center — vanilla JS (language, nav, reveal, lightbox) */
(function () {
  'use strict';

  var PHONE = '966175444400';
  var STORAGE_KEY = 'noor-lang';
  // TRANSLATED: review
  var WA_MSG = {
    ar: 'السلام عليكم، أرغب في حجز موعد في مركز نور لطب الأسنان.',
    en: "Hello, I'd like to book an appointment at Noor Dental Center."
  };
  // TRANSLATED: review
  var UI = {
    ar: { review: 'تقييم من أحد المرضى' },
    en: { review: 'Patient review' }
  };

  var root = document.documentElement;
  var currentLang = 'ar';
  var ATTRS = ['aria-label', 'content'];

  /* ---------- Language ---------- */
  function storeGet() {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function storeSet(v) {
    try { window.localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* private mode etc. */ }
  }

  function waHref(lang) {
    return 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(WA_MSG[lang]);
  }

  function applyLang(lang) {
    if (lang !== 'en') lang = 'ar';
    currentLang = lang;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (el.dataset.ar === undefined) el.dataset.ar = el.textContent;
      el.textContent = lang === 'en' ? el.dataset.en : el.dataset.ar;
    });

    ATTRS.forEach(function (attr) {
      var enKey = 'data-en-' + attr, arKey = 'data-ar-' + attr;
      document.querySelectorAll('[' + enKey + ']').forEach(function (el) {
        if (!el.hasAttribute(arKey)) el.setAttribute(arKey, el.getAttribute(attr) || '');
        el.setAttribute(attr, lang === 'en' ? el.getAttribute(enKey) : el.getAttribute(arKey));
      });
    });

    document.querySelectorAll('.js-wa').forEach(function (a) { a.href = waHref(lang); });

    document.querySelectorAll('.lang-toggle button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });

    if (lb && !lb.hidden) renderLightbox();
  }

  function initLang() {
    var param = null;
    try { param = new URLSearchParams(location.search).get('lang'); } catch (e) { /* old browsers */ }
    var initial = (param === 'en' || param === 'ar') ? param : (storeGet() || 'ar');
    applyLang(initial);

    document.querySelectorAll('.lang-toggle button').forEach(function (b) {
      b.addEventListener('click', function () {
        applyLang(b.dataset.lang);
        storeSet(b.dataset.lang);
      });
    });
  }

  /* ---------- Header & mobile nav ---------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    var btn = document.querySelector('.menu-btn');
    var nav = document.getElementById('main-nav');

    function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    }
    btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); btn.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !e.target.closest('.site-header')) setOpen(false);
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Lightbox ---------- */
  var lb, lbImg, lbText, lbCount, items = [], index = 0, lastFocus = null;

  function captionFor(btn) {
    var fig = btn.closest('figure');
    var cap = fig && fig.querySelector('figcaption');
    if (cap) return cap.textContent;
    return UI[currentLang].review;
  }

  function renderLightbox() {
    var btn = items[index];
    var thumb = btn.querySelector('img');
    lbImg.classList.remove('is-small');
    lbImg.style.removeProperty('--lb-w');
    lbImg.onload = function () {
      var nw = lbImg.naturalWidth;
      if (nw && nw < 700) {
        lbImg.style.setProperty('--lb-w', Math.min(window.innerWidth * 0.92, nw * 2) + 'px');
        lbImg.classList.add('is-small');
      }
    };
    lbImg.src = btn.dataset.full;
    lbImg.alt = thumb ? thumb.alt : '';
    lbText.textContent = captionFor(btn);
    lbCount.textContent = items.length > 1 ? (index + 1) + ' / ' + items.length : '';
    lb.classList.toggle('single', items.length < 2);
  }

  function openLightbox(btn) {
    var group = btn.closest('[data-group]');
    items = Array.prototype.slice.call(group.querySelectorAll('.zoomable'));
    index = items.indexOf(btn);
    lastFocus = btn;
    lb.hidden = false;
    document.body.classList.add('lb-open');
    renderLightbox();
    lb.querySelector('.lb-close').focus();
  }

  function closeLightbox() {
    lb.hidden = true;
    document.body.classList.remove('lb-open');
    lbImg.removeAttribute('src');
    if (lastFocus) lastFocus.focus();
  }

  function step(delta) {
    if (items.length < 2) return;
    index = (index + delta + items.length) % items.length;
    renderLightbox();
  }

  function initLightbox() {
    lb = document.getElementById('lightbox');
    lbImg = lb.querySelector('.lb-img');
    lbText = lb.querySelector('.lb-text');
    lbCount = lb.querySelector('.lb-count');

    document.querySelectorAll('.zoomable').forEach(function (btn) {
      btn.addEventListener('click', function () { openLightbox(btn); });
    });

    lb.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', closeLightbox); });
    lb.querySelector('.lb-prev').addEventListener('click', function () { step(-1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { step(1); });

    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      var rtl = root.dir === 'rtl';
      if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(rtl ? -1 : 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(rtl ? 1 : -1); }
      else if (e.key === 'Tab') {
        var f = Array.prototype.filter.call(lb.querySelectorAll('button'), function (b) {
          return b.offsetParent !== null;
        });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!lb.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
    });

    // Swipe
    var sx = 0, sy = 0, tracking = false;
    var stage = lb.querySelector('.lb-stage');
    stage.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      tracking = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
      var forward = root.dir === 'rtl' ? dx > 0 : dx < 0;
      step(forward ? 1 : -1);
    }, { passive: true });
  }

  /* ---------- Swipe hint: hide once the reviews track is scrolled ---------- */
  function initHint() {
    var track = document.querySelector('.review-track');
    var hint = document.querySelector('.swipe-hint');
    if (!track || !hint) return;
    track.addEventListener('scroll', function () {
      if (Math.abs(track.scrollLeft) > 30) hint.style.visibility = 'hidden';
    }, { passive: true });
  }

  initLightbox();
  initLang();
  initHeader();
  initReveal();
  initHint();
})();
