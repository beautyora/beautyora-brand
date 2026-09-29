/* ============================================================
   BEAUTYORA — 파트너 안내(숨김 페이지) 인터랙션
   메인 페이지와 같은 연출 언어(단어가 올라오는 제목, 차례로 떠오르는 카드,
   한 획으로 그려지는 심볼)를 쓰고, 문서처럼 읽히도록 읽기 진행선과
   목차 표시, 스크롤에 따라 차오르는 절차 타임라인을 더합니다.
   모션 줄이기 설정을 켠 사용자에게는 모든 연출을 끄고 내용을 바로 보여줍니다.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var root = document.documentElement;
  if (!reduce) root.classList.add('motion');

  function onView(el, cb, opts) {
    if (typeof IntersectionObserver !== 'function') { cb(el); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cb(e.target);
        io.unobserve(e.target);
      });
    }, opts || { threshold: 0.18, rootMargin: '0px 0px -8%' });
    io.observe(el);
  }

  /* ── 제목: 단어가 마스크 아래에서 올라옵니다 (site.css .split) ── */
  if (!reduce) $$('[data-split]').forEach(function (root) {
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
    $$('.w>i', root).forEach(function (el, k) { el.style.setProperty('--wd', (k * (root.tagName === 'H1' ? 90 : 70)) + 'ms'); });
    onView(root, function (t) { t.classList.add('lit'); });
  });

  /* ── 카드 · 줄 · 항목이 차례로 떠오릅니다 (site.css .rise) ── */
  if (!reduce) [
    ['.doc-hero .eyebrow, .doc-hero .lead, .doc-stats > li', 110, 380],
    ['.toc li', 70, 700],
    ['.doc-head .doc-num, .doc-head .sub', 120, 0],
    ['.terms > .term', 70, 0],
    ['.scope > div', 140, 0],
    ['#s5 .steps > li', 90, 0],
    ['.faq-list > details', 60, 0],
    ['.doc-contact > *', 120, 0],
    ['.doc-body > .note', 0, 200]
  ].forEach(function (g) {
    $$(g[0]).forEach(function (el, i) {
      el.classList.add('rise');
      el.style.setProperty('--sd', (g[2] + i * g[1]) + 'ms');
      onView(el, function (t) { t.classList.add('lit'); }, { threshold: 0.15 });
    });
  });

  /* ── 숫자: 0부터 올라갑니다 ─────────────────────────────── */
  $$('[data-count]').forEach(function (el) {
    var to = +el.getAttribute('data-count');
    if (reduce) return;
    el.textContent = '0';
    onView(el, function () {
      var t0 = performance.now(), dur = 1500;
      (function tick(now) {
        var p = clamp((now - t0) / dur, 0, 1);
        el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 4))));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  });

  /* ── 비교표: 줄이 차례로 들어오고, 뷰티오라 칸이 연노랑으로 칠해집니다 ── */
  var cmp = $('.cmp');
  if (cmp && !reduce) {
    $$('tbody tr', cmp).forEach(function (tr, i) { tr.style.setProperty('--rd', (i * 120) + 'ms'); });
    onView(cmp, function (t) { t.classList.add('lit'); }, { threshold: 0.25 });
  }

  /* ── 포함 · 협의 목록: 체크가 차례로 그려집니다 ────────── */
  if (!reduce) $$('.ticks').forEach(function (ul) {
    $$('li', ul).forEach(function (li, i) { li.style.setProperty('--td', (250 + i * 110) + 'ms'); });
    onView(ul, function (t) { t.classList.add('lit'); });
  });

  /* ── 커서를 따라 옅은 노란 빛이 움직입니다 ───────────────── */
  if (!reduce && matchMedia('(hover: hover)').matches) {
    $$('.term, .scope > div, .toc a, #s5 .steps > li').forEach(function (el) {
      el.classList.add('glow');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    // 버튼이 커서 쪽으로 살짝 끌려옵니다
    $$('.doc-cta .pill').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18, y = (e.clientY - r.top - r.height / 2) * 0.3;
        btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
  }

  /* ── 스크롤 루프: 읽기 진행선 · 목차 표시 · 타임라인 · 심볼 ── */
  var header = $('#siteheader'), readbar = $('#readbar');
  var mark = $('#doc-mark'), ctaMark = $('.doc-cta .contact-mark'), cta = $('.doc-cta');
  var timeline = $('#timeline'), tlItems = $$('#timeline > li');
  var navLinks = $$('#siteheader nav a');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); });
  var ticking = false;

  function frame() {
    ticking = false;
    var y = scrollY, vh = innerHeight;
    var max = root.scrollHeight - vh;
    if (readbar) readbar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (header) header.classList.toggle('solid', y > 20);

    // 지금 읽고 있는 섹션을 목차에 표시
    var active = -1;
    sections.forEach(function (sec, i) { if (sec && sec.getBoundingClientRect().top < vh * 0.4) active = i; });
    navLinks.forEach(function (a, i) {
      a.classList.toggle('is-active', i === active);
      if (i === active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });

    if (reduce) return;

    // 절차 타임라인: 화면 가운데를 지난 만큼 선이 차오르고 단계가 켜집니다
    if (timeline) {
      var r = timeline.getBoundingClientRect();
      var p = clamp((vh * 0.6 - r.top) / r.height, 0, 1);
      timeline.style.setProperty('--fill', p.toFixed(4));
      tlItems.forEach(function (li) {
        li.classList.toggle('is-lit', li.getBoundingClientRect().top + 24 < vh * 0.6);
      });
    }
    // 히어로 심볼은 스크롤을 따라 천천히 돌고, CTA 심볼은 지나가는 동안 회전합니다
    if (mark) mark.style.transform = 'translate3d(0,' + (y * 0.12) + 'px,0) rotate(' + (y * 0.015) + 'deg)';
    if (ctaMark && cta) {
      var cr = cta.getBoundingClientRect();
      var cp = clamp(1 - (cr.top + cr.height) / (vh + cr.height), 0, 1);
      ctaMark.style.transform = 'translate(-50%,-50%) rotate(' + (-30 + cp * 50) + 'deg) scale(' + (0.92 + cp * 0.12) + ')';
    }
  }
  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });
  addEventListener('resize', frame);
  frame();
})();
