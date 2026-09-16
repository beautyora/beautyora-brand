/* ============================================================
   BEAUTYORA — Interactive motion layer
   app.js 다음에 로드됩니다. app.js의 기존 동작(폼 링크, 채널 탭,
   FAQ 아코디언, 스크롤 진행바)은 그대로 두고 그 위에 얹습니다.
   ============================================================ */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // 모션 최소화 사용자에겐 아무것도 하지 않습니다.

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* ---- 공통: 화면에 들어오면 클래스 붙이기 ---------------------- */
  function onView(el, cb, opts) {
    if (!('IntersectionObserver' in window)) { cb(el); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cb(e.target);
        io.unobserve(e.target);
      });
    }, opts || { threshold: 0.2, rootMargin: '0px 0px -8%' });
    io.observe(el);
  }

  /* ---- 1. 헤드라인 단어 단위 리빌 -------------------------------
     <br>과 <span class="muted">같은 태그는 그대로 두고
     텍스트 노드만 단어로 쪼갭니다. */
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
        var w = document.createElement('span');
        w.className = 'w';
        var i = document.createElement('i');
        i.textContent = tok;
        w.appendChild(i);
        frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });

    root.classList.add('split');
    $$('.w>i', root).forEach(function (el, k) {
      el.style.setProperty('--wd', (k * (step || 75)) + 'ms');
    });
    onView(root, function (t) { t.classList.add('lit'); });
  }

  $$('h1, .section-heading h2, .statement h2, .faq-heading h2, .contact h2')
    .forEach(function (h) { splitWords(h, h.tagName === 'H1' ? 90 : 70); });

  /* ---- 2. statement 본문을 줄 단위로 밝히기 --------------------- */
  (function () {
    var box = $('.statement-bottom');
    if (!box) return;
    var p = $('p', box);
    if (!p) return;
    // <br> 기준으로 줄을 감싸 순서대로 밝아지게 합니다.
    var parts = p.innerHTML.split(/<br\s*\/?>/i);
    p.innerHTML = parts.map(function (line, i) {
      return '<span class="line-lit" style="--ld:' + (i * 160) + 'ms">' + line + '</span>';
    }).join('');
    onView(box, function (t) { t.classList.add('lit'); });
  })();

  /* ---- 3. 스태거 그리드 ----------------------------------------- */
  [['.role-grid', 110], ['.steps', 90], ['.faq-list', 60]].forEach(function (pair) {
    var grid = $(pair[0]);
    if (!grid) return;
    grid.classList.add('stagger');
    [].slice.call(grid.children).forEach(function (child, i) {
      // app.js의 .reveal 시스템과 겹치지 않도록 자식은 이쪽이 전담합니다.
      child.classList.remove('reveal', 'visible');
      child.style.setProperty('--sd', (i * pair[1]) + 'ms');
    });
    onView(grid, function (t) { t.classList.add('lit'); }, { threshold: 0.15, rootMargin: '0px 0px -6%' });
  });

  /* ---- 4. 히어로 위 플로팅 채널 카드 ---------------------------- */
  (function () {
    var hero = $('.hero');
    if (!hero) return;

    var names = ['뷰티 편집숍 · 백화점', '약국 · 체험형 공간', '로드샵 · 관광 상권', '해외 유통 · 온라인 연계'];

    var card = document.createElement('aside');
    card.className = 'hero-float';
    card.setAttribute('aria-hidden', 'true'); // 아래 채널 섹션에 동일 정보가 있습니다.
    card.innerHTML =
      '<div class="hero-float-top"><span>CHANNEL NETWORK</span><b>04</b></div>' +
      '<ul>' + names.map(function (t, i) {
        return '<li><em>0' + (i + 1) + '</em>' + t + '</li>';
      }).join('') + '</ul>' +
      '<div class="hero-float-bar"><i></i></div>';
    hero.appendChild(card);

    onView(card, function (t) { t.classList.add('lit'); }, { threshold: 0.3 });

    // 4개 채널을 순서대로 강조하며 게이지를 채웁니다.
    var items = $$('li', card);
    var bar = $('.hero-float-bar i', card);
    var idx = 0, timer = null;
    var STEP = 2600;

    function tick() {
      items.forEach(function (li, i) { li.classList.toggle('on', i === idx); });
      bar.style.transition = 'none';
      bar.style.width = '0%';
      // 리플로우를 강제해 transition을 다시 태웁니다.
      void bar.offsetWidth;
      bar.style.transition = 'width ' + STEP + 'ms linear';
      bar.style.width = '100%';
      idx = (idx + 1) % items.length;
    }

    function start() { if (!timer) { tick(); timer = setInterval(tick, STEP); } }
    function stop() { clearInterval(timer); timer = null; }

    onView(card, start, { threshold: 0.3 });
    // 히어로가 화면에서 벗어나면 타이머를 멈춥니다.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      }, { threshold: 0 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });
  })();

  /* ---- 5. 채널 탭 자동 진행 + 크로스페이드 ---------------------
     app.js가 만든 전역 select() / tabs 를 그대로 재사용합니다. */
  (function () {
    if (typeof select !== 'function' || typeof tabs === 'undefined') return;
    var panelEl = $('.channel-display');
    var list = $('.channel-list');
    var section = $('.channels');
    if (!panelEl || !list || !section) return;

    var CYCLE = 5400;
    var cur = 0, timer = null, stopped = false;

    function show(i) {
      cur = i;
      panelEl.classList.add('swap');
      setTimeout(function () {
        select(i);
        panelEl.classList.remove('swap');
      }, 340);
    }

    function advance() { show((cur + 1) % tabs.length); }
    function start() {
      if (stopped || timer) return;
      list.classList.remove('paused');
      timer = setInterval(advance, CYCLE);
    }
    function pause() { clearInterval(timer); timer = null; list.classList.add('paused'); }
    function halt() { stopped = true; pause(); }

    // 사용자가 직접 만지면 자동 진행을 영구히 멈춥니다.
    tabs.forEach(function (b, i) {
      b.addEventListener('click', function () { halt(); cur = i; });
      b.addEventListener('keydown', halt);
    });
    list.addEventListener('mouseenter', pause);
    list.addEventListener('mouseleave', start);
    list.addEventListener('focusin', halt);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting ? start() : pause(); });
      }, { threshold: 0.25 }).observe(section);
    }
    document.addEventListener('visibilitychange', function () {
      document.hidden ? pause() : start();
    });
  })();

  /* ---- 6. 역할 카드 커서 하이라이트 ----------------------------- */
  if (matchMedia('(hover:hover)').matches) {
    $$('.role-grid article').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---- 7. 푸터 리빌 --------------------------------------------- */
  (function () {
    var main = $('main');
    var foot = $('footer');
    if (!main || !foot) return;
    main.classList.add('footer-reveal');
    foot.classList.add('pinned');
  })();

  /* ---- 8. 히어로 비주얼이 스크롤에 따라 가라앉습니다 ------------ */
  (function () {
    var visual = $('.hero-visual');
    if (!visual) return;
    var ticking = false;
    function frame() {
      var y = scrollY;
      if (y < 900) {
        var t = Math.min(1, y / 700);
        visual.style.transform = 'scale(' + (1 - t * 0.055) + ') translate3d(0,' + (t * 26) + 'px,0)';
        visual.style.borderRadius = (8 + t * 20) + 'px ' + (8 + t * 20) + 'px ' + (100 - t * 40) + 'px ' + (8 + t * 20) + 'px';
      }
      ticking = false;
    }
    addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }, { passive: true });
    frame();
  })();
})();
