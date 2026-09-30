/* ============================================================
   BEAUTYORA — 하위 페이지 공통 인터랙션
   (파트너 안내 · 입점 제안서) 메인의 연출은 가져오지 않고,
   FAQ 여닫기 · 메일 복사 · 브랜드명 이어받기만 둡니다.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 브랜드명: ?b=브랜드명 으로 받은 이름을 인사와 링크에 이어 씁니다 ── */
  var params = new URLSearchParams(location.search);
  var brand = (params.get('b') || '').trim().slice(0, 40);
  if (brand) {
    $$('[data-brand]').forEach(function (el) { el.textContent = brand; });
    $$('[data-brand-wrap]').forEach(function (el) { el.hidden = false; });
    $$('[data-brand-default]').forEach(function (el) { el.hidden = true; });
  }
  $$('.apply-link').forEach(function (a) {
    var from = a.getAttribute('data-from') || 'partner';
    var q = '?from=' + encodeURIComponent(from) + (brand ? '&b=' + encodeURIComponent(brand) : '');
    a.href = '/apply/' + q;
  });

  /* ── FAQ: 높이를 부드럽게 여닫고, 한 번에 하나만 ─────── */
  $$('.faq-list details').forEach(function (d) {
    var box = d.querySelector('div');
    var sum = d.querySelector('summary');
    if (!box || !sum) return;
    box.style.height = d.open ? 'auto' : '0px';

    function setH(to, after) {
      if (reduce) { box.style.height = to; if (after) after(); return; }
      box.style.transition = 'height .5s cubic-bezier(.16,1,.3,1)';
      box.style.height = to;
      if (after) setTimeout(after, 500);
    }
    function shut(o) {
      var ob = o.querySelector('div');
      ob.style.height = ob.scrollHeight + 'px';
      requestAnimationFrame(function () {
        ob.style.transition = reduce ? '' : 'height .5s cubic-bezier(.16,1,.3,1)';
        ob.style.height = '0px';
        o.open = false;
      });
    }
    sum.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (d.open) { shut(d); return; }
      $$('.faq-list details').forEach(function (o) { if (o !== d && o.open) shut(o); });
      d.open = true;
      box.style.height = '0px';
      requestAnimationFrame(function () {
        setH(box.scrollHeight + 'px', function () { if (d.open) box.style.height = 'auto'; });
      });
    });
  });

  // 인쇄할 때는 모든 답을 펼쳐 둡니다
  addEventListener('beforeprint', function () {
    $$('.faq-list details').forEach(function (d) { d.open = true; d.querySelector('div').style.height = 'auto'; });
  });

  /* ── 메일 주소 복사 ──────────────────────────────────── */
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var label = btn.querySelector('span') || btn;
      var orig = label.textContent;
      var done = function () {
        label.textContent = '복사했습니다';
        setTimeout(function () { label.textContent = orig; }, 1800);
      };
      try {
        navigator.clipboard.writeText(text).then(done, function () { label.textContent = text; });
      } catch (err) { label.textContent = text; }
    });
  });
})();

/* 예전 호스팅이 남긴 서비스 워커 정리 — 이 사이트는 서비스 워커를 쓰지 않습니다 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (rs) {
    rs.forEach(function (r) { r.unregister(); });
  }).catch(function () {});
}

/* 입점 제안서 질문 목록 미리 받기 — 메인·숨김 페이지를 보는 동안 받아 두면
   "입점 제안하기"를 눌렀을 때 입력폼이 바로 열립니다 (apply.js가 같은 저장본을 씁니다) */
(function () {
  if (/^\/apply\//.test(location.pathname) || !window.fetch) return;
  var KEY = 'beautyora-form-cache', fresh = false, started = false;
  try {
    var c = JSON.parse(localStorage.getItem(KEY) || 'null');
    fresh = !!(c && c.t && Date.now() - c.t < 5 * 60 * 1000);
  } catch (e) { return; }   // 저장할 수 없는 환경이면 받지 않습니다
  function go() {
    if (started || fresh) return;
    started = true;
    fetch('/api/form').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d && d.ok && d.sections) localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), data: d }));
    }).catch(function () {});
  }
  // 버튼에 손이 가면 바로, 아니면 페이지가 한가해졌을 때
  function near(e) { if (e.target.closest && e.target.closest('a[href^="/apply/"]')) go(); }
  document.addEventListener('pointerover', near, { passive: true });
  document.addEventListener('touchstart', near, { passive: true });
  (window.requestIdleCallback || function (f) { setTimeout(f, 2500); })(go, { timeout: 4000 });
})();

/* 카카오톡 상담 버튼: 첫 화면을 지나면 나타납니다 */
(function () {
  var fab = document.getElementById('kakao-fab');
  if (!fab) return;
  var ticking = false;
  function update() {
    ticking = false;
    fab.classList.toggle('is-on', window.scrollY > Math.min(innerHeight * 0.6, 520));
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();
