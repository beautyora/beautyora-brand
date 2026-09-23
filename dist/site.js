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
    if (typeof IntersectionObserver !== 'function') { cb(el); return; }
    try {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          cb(e.target);
          io.unobserve(e.target);
        });
      }, opts || { threshold: 0.18, rootMargin: '0px 0px -6%' });
      io.observe(el);
    } catch (err) {
      cb(el);   // 관찰이 불가능하면 숨기지 않습니다
    }
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
  var pendingSplits = [];
  if (!reduce) $$('[data-split]').forEach(function (h) {
    splitWords(h, h.tagName === 'H1' ? 88 : 68);
    pendingSplits.push(h);
  });

  /* IntersectionObserver 가 어떤 이유로든(스티키·overflow·리플로우) 놓치면
     단어가 마스크 안에 갇혀 영영 안 보입니다. 화면에 들어온 제목은
     스크롤 루프에서 한 번 더 확인해 반드시 드러나게 합니다. */
  function sweepSplits() {
    for (var i = pendingSplits.length - 1; i >= 0; i--) {
      var el = pendingSplits[i];
      if (el.classList.contains('lit')) { pendingSplits.splice(i, 1); continue; }
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.95 && r.bottom > -60) {
        el.classList.add('lit');
        pendingSplits.splice(i, 1);
      }
    }
  }
  // 아래 코드가 어디서 멈추더라도 제목만은 반드시 드러나도록,
  // 전용 리스너를 지금 바로 걸어둡니다.
  if (!reduce) {
    addEventListener('scroll', sweepSplits, { passive: true });
    addEventListener('resize', sweepSplits);
    sweepSplits();
    setTimeout(sweepSplits, 400);
    setTimeout(sweepSplits, 1600);
  }

  /* ── 본문: <br> 기준으로 줄이 차례로 떠오릅니다 ───────── */
  if (!reduce) $$('[data-lines]').forEach(function (p) {
    p.innerHTML = p.innerHTML.split(/<br\s*\/?>/i).map(function (line, i) {
      return '<span class="ln" style="--ld:' + (i * 150) + 'ms">' + line + '</span>';
    }).join('');
    onView(p, function (t) { t.classList.add('lit'); });
  });

  /* ── 카드·스텝이 순서대로 올라옵니다 ─────────────────── */
  if (!reduce) [['.value-list', 130], ['.pain-grid', 90], ['.road', 140], ['.bento', 90], ['.flow', 80]].forEach(function (pair) {
    var list = $(pair[0]);
    if (!list) return;
    $$(':scope > li, :scope > article', list).forEach(function (li, i) {
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

  /* ── 포부: 스크롤한 만큼 글자가 진해집니다 ───────────── */
  var mani = $('#manifesto'), maniWords = [];
  if (mani) {
    // 문장 덩어리(.mline)와 <br> 줄바꿈은 그대로 두고, 글자만 단어 단위로 감쌉니다
    var walker = document.createTreeWalker(mani, NodeFilter.SHOW_TEXT, null, false);
    var texts = [], tn;
    while ((tn = walker.nextNode())) texts.push(tn);
    texts.forEach(function (node) {
      if (!node.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (tok) {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
        var s = document.createElement('span'); s.className = 'mw'; s.textContent = tok;
        frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    maniWords = $$('.mw', mani);
    if (reduce) maniWords.forEach(function (w) { w.classList.add('on'); });
  }
  function paintManifesto() {
    if (!mani || reduce) return;
    var r = mani.getBoundingClientRect();
    // 문단 윗변이 화면 80% 지점에 닿을 때 시작해 35% 지점에서 끝납니다
    var start = innerHeight * 0.8, end = innerHeight * 0.35 - r.height;
    var p = clamp((start - r.top) / (start - end), 0, 1);
    var n = Math.round(p * maniWords.length);
    for (var i = 0; i < maniWords.length; i++) maniWords[i].classList.toggle('on', i < n);
  }

  /* ── 숫자: 화면에 들어오면 0부터 올라갑니다 ─────────── */
  $$('[data-count]').forEach(function (el) {
    var to = +el.getAttribute('data-count');
    if (reduce) return;
    el.textContent = '0';
    onView(el, function () {
      var t0 = performance.now(), dur = 1400;
      (function tick(now) {
        var k = clamp((now - t0) / dur, 0, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.6 });
  });

  /* ── 벤토 타일: 커서를 따라 빛이 움직입니다 ─────────── */
  $$('.tile').forEach(function (t) {
    t.addEventListener('pointermove', function (e) {
      var r = t.getBoundingClientRect();
      t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      t.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ── 메일 주소 복사 ──────────────────────────────────── */
  var copyBtn = $('#copy-mail');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var text = copyBtn.getAttribute('data-copy');
    var label = copyBtn.querySelector('span') || copyBtn;   // 아이콘은 두고 글자만 바꿉니다
    var done = function () {
      label.textContent = '복사했습니다';
      setTimeout(function () { label.textContent = '주소 복사'; }, 1800);
    };
    var fallback = function () {
      var range = document.createRange();
      range.selectNodeContents($('#mail-addr'));
      var sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      label.textContent = '주소를 선택했습니다';
    };
    try {
      navigator.clipboard.writeText(text).then(done, fallback);
    } catch (err) { fallback(); }
  });

  /* ── 진행선: 프로세스 · 성장 방향 · 읽기 진행 ────────── */
  var flow = $('#flow'), flowItems = $$('#flow > li'), road = $('#road'), readbar = $('#readbar');
  function progressOf(el, startAt, endAt) {
    var r = el.getBoundingClientRect();
    return clamp((innerHeight * startAt - r.top) / (r.height + innerHeight * (startAt - endAt)), 0, 1);
  }
  function paintProgress() {
    if (readbar) {
      var max = document.documentElement.scrollHeight - innerHeight;
      readbar.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
    }
    if (reduce) return;
    if (flow) {
      var fp = progressOf(flow, 0.85, 0.45);
      flow.style.setProperty('--prog', fp);
      flowItems.forEach(function (li, i) {
        li.classList.toggle('on', fp >= i / (flowItems.length - 1) - 0.001);
      });
    }
    if (road) road.style.setProperty('--road', progressOf(road, 0.85, 0.5));
  }
  if (reduce) flowItems.forEach(function (li) { li.classList.add('on'); });

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

  /* ── 스크롤 루프 ─────────────────────────────────────── */
  var ticking = false;
  var hero = $('.hero'), heroImg = $('#heroimg'), heroCopy = $('.hero-copy');
  if (hero) requestAnimationFrame(function () { hero.classList.add('ready'); });
  var header = $('#siteheader');
  var contactMark = $('.contact-mark');

  function frame() {
    var y = window.scrollY;

    if (header) header.classList.toggle('solid', y > 40);
    if (!reduce) sweepSplits();
    paintManifesto();
    paintProgress();

    if (!reduce) {
      // 히어로 사진: 내려갈수록 살짝 커지고 흐려지며, 제목은 먼저 떠납니다
      if (heroImg && y < innerHeight * 1.2) {
        var hp = clamp(y / innerHeight, 0, 1);
        hero.style.setProperty('--hs', (1.02 + hp * 0.1).toFixed(4));
        hero.style.setProperty('--hb', (hp * 6).toFixed(2) + 'px');
        if (heroCopy) {
          heroCopy.style.transform = 'translate3d(0,' + (-hp * 60) + 'px,0)';
          heroCopy.style.opacity = (1 - hp * 1.1).toFixed(3);
        }
      }
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

  /* ── 초기화 ──────────────────────────────────────────── */
  function boot() {
    layoutPin();
    frame();
  }

  if (document.readyState === 'complete') boot();
  else addEventListener('load', boot);

  var rt;
  addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { layoutPin(); frame(); }, 160);
  });
})();
