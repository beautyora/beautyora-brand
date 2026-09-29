/* ============================================================
   BEAUTYORA — 입점 제안서
   단계별 입력 → 확인 → 구글 폼으로 제출합니다.
   응답은 기존 구글 폼과 응답 시트에 그대로 쌓입니다.
   ============================================================ */
(function () {
  'use strict';

  /* ── 구글 폼 연결 ─────────────────────────────────────────
     각 칸(name)을 구글 폼 질문 번호(entry.숫자)에 연결합니다.
     구글 폼 ⋮ 메뉴 → "사전 입력된 링크 가져오기"로 만든 링크에서
     entry 번호를 옮겨 적으면 됩니다.
       ''   : 아직 연결 전 (하나라도 있으면 실제 제출을 막고 안내만 보입니다)
       null : 구글 폼에 해당 질문이 없어 보내지 않음                     */
  var FORM_ID = '1FAIpQLScFUxfaVQmYZxskN-9nhjsCRx7HdjH-aqi5wPaeU3Z9AOwdEg';
  var ENTRY = {
    company: '',
    bizno: '',
    name: '',
    title: '',
    phone: '',
    email: '',
    brand: '',
    site: '',
    category: '',
    hero: '',
    sku: '',
    intro: '',
    channels_now: '',
    result: '',
    demo: '',
    channels_want: '',
    start: '',
    wish: '',
    files: '',
    mailed: '',
    memo: '',
    agree: '',
    from: ''          // 유입 경로 (main · partner) — 구글 폼에 단답형 질문 추가 필요
  };
  var FORM_VIEW = 'https://docs.google.com/forms/d/e/' + FORM_ID + '/viewform';
  var FORM_POST = 'https://docs.google.com/forms/d/e/' + FORM_ID + '/formResponse';
  var READY = Object.keys(ENTRY).every(function (k) { return ENTRY[k] !== ''; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var form = $('#apply');
  if (!form) return;
  var steps = $$('.sheet-step[data-step]', form).filter(function (s) { return s.getAttribute('data-step') !== 'done'; });
  var doneStep = $('[data-step="done"]', form);
  var prog = $$('#progress li');
  var bar = $('#bar');
  var prev = $('#prev'), next = $('#next'), nav = $('#nav');
  var sendErr = $('#send-error');
  var cur = 0;

  var KEY = 'beautyora-apply-v1';
  var store = {
    get: function () { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } },
    set: function (v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* 저장 불가 환경은 무시 */ } },
    clear: function () { try { localStorage.removeItem(KEY); } catch (e) { /* 무시 */ } }
  };

  /* ── 값 읽고 쓰기 ─────────────────────────────────────── */
  function collect() {
    var out = {};
    $$('input,select,textarea', form).forEach(function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') {
        if (!out[el.name]) out[el.name] = [];
        if (el.checked) out[el.name].push(el.value);
      } else if (el.type === 'radio') {
        if (el.checked) out[el.name] = el.value;
        else if (!(el.name in out)) out[el.name] = '';
      } else {
        out[el.name] = el.value.trim();
      }
    });
    return out;
  }
  function restore(data) {
    if (!data) return;
    Object.keys(data).forEach(function (k) {
      var v = data[k];
      $$('[name="' + k + '"]', form).forEach(function (el) {
        if (el.type === 'hidden') return;
        if (el.type === 'checkbox') el.checked = Array.isArray(v) && v.indexOf(el.value) > -1;
        else if (el.type === 'radio') el.checked = el.value === v;
        else if (typeof v === 'string') el.value = v;
      });
    });
  }

  /* ── 유입 경로 · 브랜드명 ─────────────────────────────── */
  var params = new URLSearchParams(location.search);
  var from = (params.get('from') || 'direct').replace(/[^a-z0-9_-]/gi, '').slice(0, 20) || 'direct';
  form.elements.from.value = from;
  restore(store.get());
  var b = (params.get('b') || '').trim().slice(0, 40);
  if (b && !form.elements.brand.value) form.elements.brand.value = b;

  /* ── 입력 모양 다듬기 ─────────────────────────────────── */
  function digits(v) { return v.replace(/\D/g, ''); }
  form.elements.bizno.addEventListener('input', function (e) {
    var d = digits(e.target.value).slice(0, 10);
    e.target.value = d.length > 5 ? d.slice(0, 3) + '-' + d.slice(3, 5) + '-' + d.slice(5)
      : d.length > 3 ? d.slice(0, 3) + '-' + d.slice(3) : d;
  });
  form.elements.phone.addEventListener('input', function (e) {
    var d = digits(e.target.value).slice(0, 11);
    if (/^02/.test(d)) {
      e.target.value = d.length > 9 ? d.slice(0, 2) + '-' + d.slice(2, 6) + '-' + d.slice(6)
        : d.length > 5 ? d.slice(0, 2) + '-' + d.slice(2, 5) + '-' + d.slice(5)
        : d.length > 2 ? d.slice(0, 2) + '-' + d.slice(2) : d;
    } else {
      e.target.value = d.length > 10 ? d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7)
        : d.length > 6 ? d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6)
        : d.length > 3 ? d.slice(0, 3) + '-' + d.slice(3) : d;
    }
  });

  /* ── 검사 ─────────────────────────────────────────────── */
  var CHECK = {
    bizno: function (v) { return digits(v).length === 10; },
    phone: function (v) { var n = digits(v).length; return n >= 9 && n <= 11; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  };
  function fieldOk(f) {
    if (f.hasAttribute('data-group')) {
      if (!f.hasAttribute('data-required')) return true;
      return $$('input', f).some(function (i) { return i.checked; });
    }
    var el = $('input,select,textarea', f);
    if (!el) return true;
    var v = el.value.trim();
    if (el.required && !v) return false;
    var c = el.getAttribute('data-check');
    if (v && c && CHECK[c]) return CHECK[c](v);
    return true;
  }
  function validate(step) {
    var first = null;
    $$('.f', step).forEach(function (f) {
      var ok = fieldOk(f);
      f.classList.toggle('bad', !ok);
      var el = $('input,select,textarea', f);
      if (el) el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !first) first = f;
    });
    if (first) {
      var focusEl = $('input,select,textarea', first);
      if (focusEl) focusEl.focus({ preventScroll: true });
      first.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      return false;
    }
    return true;
  }
  // 고치는 순간 빨간 표시를 거둡니다
  form.addEventListener('input', function (e) {
    var f = e.target.closest('.f');
    if (f && f.classList.contains('bad') && fieldOk(f)) f.classList.remove('bad');
    store.set(collect());
  });
  form.addEventListener('change', function () { store.set(collect()); });

  /* ── 확인 단계 요약 ───────────────────────────────────── */
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function buildReview() {
    var data = collect();
    var html = '';
    steps.slice(0, -1).forEach(function (step, i) {
      var rows = '';
      $$('.f', step).forEach(function (f) {
        var lab = $('label,.lbl', f);
        var el = $('input,select,textarea', f);
        if (!lab || !el) return;
        var name = el.name;
        var v = data[name];
        if (Array.isArray(v)) v = v.join(', ');
        var t = lab.cloneNode(true);
        $$('.req,.opt', t).forEach(function (x) { x.remove(); });
        rows += '<dt>' + esc(t.textContent.trim()) + '</dt><dd>' + (v ? esc(v) : '<span style="color:var(--muted)">—</span>') + '</dd>';
      });
      html += '<section><header><h3>' + esc(step.getAttribute('data-title')) + '</h3>' +
        '<button type="button" data-go="' + i + '">수정</button></header><dl>' + rows + '</dl></section>';
    });
    $('#review').innerHTML = html;
    $$('#review [data-go]').forEach(function (btn) {
      btn.addEventListener('click', function () { show(+btn.getAttribute('data-go')); });
    });
  }

  /* ── 단계 이동 ────────────────────────────────────────── */
  function show(i) {
    cur = i;
    steps.forEach(function (s, k) { s.hidden = k !== i; });
    prog.forEach(function (li, k) {
      li.classList.toggle('is-now', k === i);
      li.classList.toggle('is-done', k < i);
      if (k === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    if (bar) bar.style.width = ((i + 1) / steps.length * 100) + '%';
    prev.hidden = i === 0;
    next.textContent = i === steps.length - 1 ? '제안서 보내기' : '다음';
    if (i === steps.length - 1) buildReview();
    sendErr.hidden = true;
    var h = $('h2', steps[i]);
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    var top = form.getBoundingClientRect().top + scrollY - 100;
    if (scrollY > top) scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
  }
  prev.addEventListener('click', function () { if (cur > 0) show(cur - 1); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(steps[cur])) return;
    if (cur < steps.length - 1) { show(cur + 1); return; }
    send();
  });

  /* ── 제출 ─────────────────────────────────────────────── */
  function fail(msg) {
    next.disabled = false;
    next.textContent = '제안서 보내기';
    sendErr.innerHTML = msg;
    sendErr.hidden = false;
  }
  function finish() {
    store.clear();
    steps.forEach(function (s) { s.hidden = true; });
    nav.hidden = true;
    doneStep.hidden = false;
    prog.forEach(function (li) { li.classList.remove('is-now'); li.classList.add('is-done'); });
    if (bar) bar.style.width = '100%';
    doneStep.focus({ preventScroll: true });
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }
  function send() {
    if (!READY) {
      // 구글 폼 질문 번호를 연결하기 전(미리보기)에는 실제로 보내지 않습니다
      fail('미리보기 상태입니다. 아직 구글 폼과 연결되지 않아 이 화면에서는 제출되지 않습니다. ' +
        '지금 제안하시려면 <a href="' + FORM_VIEW + '" target="_blank" rel="noopener noreferrer">기존 구글 폼</a>을 이용해 주세요.');
      return;
    }
    next.disabled = true;
    next.textContent = '보내는 중…';

    // 구글 폼은 다른 사이트에서의 응답 확인을 막아 두어,
    // 숨긴 iframe으로 보내고 로드가 끝나면 완료로 봅니다.
    var data = collect();
    var name = 'bo-sink-' + Date.now();
    var sink = document.createElement('iframe');
    sink.name = name; sink.hidden = true; sink.setAttribute('aria-hidden', 'true'); sink.tabIndex = -1;
    var post = document.createElement('form');
    post.method = 'POST'; post.action = FORM_POST; post.target = name; post.hidden = true;
    Object.keys(ENTRY).forEach(function (k) {
      if (!ENTRY[k]) return;
      var vals = Array.isArray(data[k]) ? data[k] : [data[k] || ''];
      vals.forEach(function (v) {
        var inp = document.createElement('input');
        inp.type = 'hidden'; inp.name = ENTRY[k]; inp.value = v;
        post.appendChild(inp);
      });
    });
    var settled = false, armed = false;
    var timer = setTimeout(function () {
      if (settled) return;
      settled = true;
      fail('전송이 늦어지고 있습니다. 잠시 후 다시 시도하시거나, 입력하신 내용을 pickora07@gmail.com으로 보내 주세요. 작성하신 내용은 이 기기에 그대로 남아 있습니다.');
    }, 15000);
    sink.addEventListener('load', function () {
      // 빈 iframe이 붙을 때 나는 첫 로드는 건너뜁니다
      if (!armed || settled) return;
      settled = true;
      clearTimeout(timer);
      finish();
      setTimeout(function () { sink.remove(); post.remove(); }, 1000);
    });
    document.body.appendChild(sink);
    document.body.appendChild(post);
    armed = true;
    post.submit();
  }

  show(0);
  // 첫 화면에서는 제목으로 초점을 옮기지 않습니다
  if (document.activeElement && document.activeElement.tagName === 'H2') document.activeElement.blur();
  scrollTo(0, 0);
})();
