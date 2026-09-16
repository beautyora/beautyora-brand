/* ============================================================
   BEAUTYORA — 인터랙션
   스크롤에 반응하는 것들은 rAF 루프 하나에 모았습니다.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ── 입점 제안 폼 ─────────────────────────────────────── */
  var FORM = 'https://docs.google.com/forms/d/e/1FAIpQLScFUxfaVQmYZxskN-9nhjsCRx7HdjH-aqi5wPaeU3Z9AOwdEg/viewform';
  $$('.form-link').forEach(function (a) {
    a.href = FORM;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', a.textContent.trim() + ' (새 탭에서 구글 폼 열기)');
  });

  /* ── 화면에 들어오면 클래스 붙이기 ───────────────────── */
  function onView(el, cb, opts) {
    if (!('IntersectionObserver' in window)) { cb(el); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cb(e.target);
        io.unobserve(e.target);
      });
    }, opts || { threshold: 0.18, rootMargin: '0px 0px -6%' });
    io.observe(el);
  }

  /* ── 제목: 단어 단위로 마스크 아래에서 올라옵니다 ─────── */
  function splitWords(root, step) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);

    nodes.forEach(function (node) {
      if (!node.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (tok) {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
        var w = document.createElement('span'); w.className = 'w';
        var i = document.createElement('i'); i.textContent = tok;
        w.appendChild(i); frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });

    root.classList.add('split');
    $$('.w>i', root).forEach(function (el, k) {
      el.style.setProperty('--wd', (k * (step || 68)) + 'ms');
    });
    onView(root, function (t) { t.classList.add('lit'); });
  }
  if (!reduce) $$('[data-split]').forEach(function (h) { splitWords(h, h.tagName === 'H1' ? 88 : 68); });

  /* ── 본문: <br> 기준으로 줄이 차례로 떠오릅니다 ───────── */
  if (!reduce) $$('[data-lines]').forEach(function (p) {
    p.innerHTML = p.innerHTML.split(/<br\s*\/?>/i).map(function (line, i) {
      return '<span class="ln" style="--ld:' + (i * 150) + 'ms">' + line + '</span>';
    }).join('');
    onView(p, function (t) { t.classList.add('lit'); });
  });

  /* ── 카드·스텝이 순서대로 올라옵니다 ─────────────────── */
  if (!reduce) [['.approach-list', 130], ['.timeline', 110]].forEach(function (pair) {
    var list = $(pair[0]);
    if (!list) return;
    $$(':scope > li', list).forEach(function (li, i) {
      li.classList.add('rise');
      li.style.setProperty('--sd', (i * pair[1]) + 'ms');
      onView(li, function (t) { t.classList.add('lit'); }, { threshold: 0.2 });
    });
  });

  /* ── 히어로 심볼: 한 획으로 그려집니다 ───────────────── */
  var heroMark = $('.hero-mark');
  if (heroMark && !reduce) {
    var len = 9000;
    try {
      var src = $('#ora path');
      if (src && src.getTotalLength) len = src.getTotalLength() || len;
    } catch (e) { /* 측정 실패 시 근사값으로 그립니다 */ }
    heroMark.style.strokeDasharray = len;
    heroMark.style.strokeDashoffset = len;
    requestAnimationFrame(function () {
      heroMark.style.transition = 'stroke-dashoffset 2.6s cubic-bezier(.22,1,.36,1)';
      heroMark.style.strokeDashoffset = '0';
    });
  }

  /* ── 접근 3단계: 보고 있는 카드와 카운터 ─────────────── */
    var apItems = $$('.approach-list > li');
  if (apItems.length && 'IntersectionObserver' in window) {
    var apIo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        e.target.classList.toggle('on', e.isIntersecting);
      });
    }, { threshold: 0.55 });
    apItems.forEach(function (li) { apIo.observe(li); });
  }

  /* ── FAQ: 높이를 부드럽게 여닫고, 한 번에 하나만 ─────── */
  $$('.faq-list details').forEach(function (d) {
    var box = d.querySelector('div');
    var sum = d.querySelector('summary');
    if (!box || !sum) return;

    if (d.open) box.style.height = 'auto';
    else box.style.height = '0px';

    function setH(to, after) {
      if (reduce) { box.style.height = to === null ? 'auto' : to; if (after) after(); return; }
      box.style.transition = 'height .5s cubic-bezier(.16,1,.3,1)';
      box.style.height = to;
      if (after) setTimeout(after, 500);
    }
    function open() {
      d.open = true;
      box.style.height = '0px';
      requestAnimationFrame(function () {
        setH(box.scrollHeight + 'px', function () { if (d.open) box.style.height = 'auto'; });
      });
    }
    function close() {
      box.style.height = box.scrollHeight + 'px';
      requestAnimationFrame(function () {
        setH('0px', function () { if (!d.open) d.open = false; });
        d.open = false;
      });
    }
    sum.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (d.open) { close(); return; }
      $$('.faq-list details').forEach(function (o) {
        if (o !== d && o.open) {
          var ob = o.querySelector('div');
          ob.style.transition = 'height .5s cubic-bezier(.16,1,.3,1)';
          ob.style.height = ob.scrollHeight + 'px';
          requestAnimationFrame(function () { ob.style.height = '0px'; });
          o.open = false;
        }
      });
      open();
    });
  });

  /* ── 채널: 세로 스크롤을 가로 이동으로 ───────────────── */
  var pin = $('#hpin'), stage = $('.hpin-stage'), track = $('#htrack');
  var travel = 0, pinnable = false;

  function layoutPin() {
    if (!pin || !stage || !track) return;
    pinnable = window.innerWidth > 700 && !reduce;
    if (!pinnable) {
      pin.style.height = '';
      track.style.transform = '';
      return;
    }
    track.style.transform = 'translate3d(0,0,0)';
    var overflow = track.scrollWidth - track.clientWidth;
    travel = Math.max(0, overflow);
    pin.style.height = (stage.offsetHeight + travel) + 'px';
  }

  /* ── 마퀴: 계속 흐르다가 스크롤하면 빨라집니다 ───────── */
  var mtrack = $('#mtrack');
  var mBase = null;
  var mOffset = 0, mHalf = 0;

  function cloneSet(nodes) {
    return nodes.map(function (n) {
      var c = n.cloneNode(true);
      c.removeAttribute('alt');      // 복제본은 읽히지 않도록
      c.setAttribute('alt', '');
      c.setAttribute('aria-hidden', 'true');
      return c;
    });
  }

  // 트랙 절반이 화면폭보다 좁으면 되감을 때 빈틈이 생깁니다.
  // 컨테이너를 덮을 때까지 세트를 늘린 뒤, 전체를 한 번 복제해
  // 정확히 같은 두 덩어리로 만듭니다.
  function measureMarquee() {
    if (!mtrack) return;
    if (!mBase) mBase = [].slice.call(mtrack.children);
    mtrack.innerHTML = '';
    mBase.forEach(function (n) { mtrack.appendChild(n); });

    var box = mtrack.parentElement.clientWidth;
    var guard = 0;
    while (mtrack.scrollWidth < box && guard++ < 16) {
      cloneSet(mBase).forEach(function (n) { mtrack.appendChild(n); });
    }
    cloneSet([].slice.call(mtrack.children)).forEach(function (n) { mtrack.appendChild(n); });

    mHalf = mtrack.scrollWidth / 2;
    mOffset = 0;
  }

  /* ── 스크롤 루프 ─────────────────────────────────────── */
  var lastY = window.scrollY, vel = 0, ticking = false;
  var header = $('#siteheader');
  var contactMark = $('.contact-mark');

  function frame() {
    var y = window.scrollY;
    vel = y - lastY;
    lastY = y;

    if (header) header.classList.toggle('solid', y > 40);

    if (!reduce) {
      // 히어로 심볼이 스크롤을 따라 천천히 돕니다
      if (heroMark && y < window.innerHeight * 1.6) {
        heroMark.style.transform = 'rotate(' + (y * 0.022) + 'deg) translateY(' + (y * 0.06) + 'px)';
      }
      // CTA의 거대 심볼은 반대로 돕니다
      if (contactMark) {
        var r = contactMark.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) {
          var p = 1 - (r.top + r.height / 2) / (innerHeight + r.height);
          contactMark.style.transform = 'translate(-50%,-50%) rotate(' + (-28 + p * 46) + 'deg)';
        }
      }
      // 가로 핀
      // offsetTop은 .channels 기준이라 쓸 수 없습니다.
      // 뷰포트 기준 rect.top이 음수로 내려간 만큼이 곧 진행량입니다.
      if (pinnable && pin && travel > 0) {
        var p2 = clamp(-pin.getBoundingClientRect().top / travel, 0, 1);
        track.style.transform = 'translate3d(' + (-p2 * travel) + 'px,0,0)';
      }
    }
    ticking = false;
  }

  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });

  function marqueeLoop() {
    if (mtrack && mHalf > 0) {
      mOffset -= 0.42 + Math.min(Math.abs(vel) * 0.06, 4);
      if (mOffset <= -mHalf) mOffset += mHalf;
      mtrack.style.transform = 'translate3d(' + mOffset + 'px,0,0)';
      vel *= 0.9;
    }
    requestAnimationFrame(marqueeLoop);
  }

  /* ── 초기화 ──────────────────────────────────────────── */
  function boot() {
    layoutPin();
    measureMarquee();
    frame();
    if (!reduce) marqueeLoop();
  }

  if (document.readyState === 'complete') boot();
  else addEventListener('load', boot);

  var rt;
  addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { layoutPin(); measureMarquee(); frame(); }, 160);
  });
})();
