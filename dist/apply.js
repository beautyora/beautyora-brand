/* ============================================================
   BEAUTYORA — 입점 제안서
   질문은 구글 폼에서 그대로 읽어 와 화면을 그리고,
   답은 구글 Apps Script를 거쳐 구글 폼 응답으로 저장합니다.
   구글 폼을 고치면 이 페이지도 (최대 1분 뒤) 자동으로 바뀝니다.
   연결 스크립트: google-apps-script/form-bridge.gs
   ============================================================ */
(function () {
  'use strict';

  /* ── 연결 주소 ────────────────────────────────────────────
     Apps Script를 "웹 앱"으로 배포하고 받은 주소(…/exec)를 적습니다.
     비어 있으면 미리보기 모드: 예시 질문(demo.json)으로 화면만 보여주고 제출은 막습니다. */
  var ENDPOINT = '';
  var DEMO_URL = '/apply/demo.json';
  var FORM_VIEW = 'https://docs.google.com/forms/d/e/1FAIpQLScFUxfaVQmYZxskN-9nhjsCRx7HdjH-aqi5wPaeU3Z9AOwdEg/viewform';
  var MAIL = 'pickora07@gmail.com';
  var PER_STEP = 5;   // 구글 폼에 섹션이 없을 때 한 단계에 담을 질문 수

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var form = $('#apply');
  if (!form) return;
  var stepsBox = $('#steps'), reviewStep = $('[data-step="review"]'), doneStep = $('[data-step="done"]');
  var nav = $('#nav'), prev = $('#prev'), next = $('#next');
  var progress = $('#progress'), bar = $('#bar');
  var sendErr = $('#send-error'), loadNote = $('#load-note');
  var DEMO = !ENDPOINT;
  var formUrl = FORM_VIEW;
  var steps = [], cur = 0;
  var questions = {};   // id → 질문 정보

  var params = new URLSearchParams(location.search);
  var from = (params.get('from') || 'direct').replace(/[^a-z0-9_-]/gi, '').slice(0, 20) || 'direct';
  var brandParam = (params.get('b') || '').trim().slice(0, 40);

  /* ── 임시 저장 ────────────────────────────────────────── */
  var KEY = 'beautyora-apply-v3';
  var store = {
    get: function () { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } },
    set: function (v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* 저장 불가 환경은 무시 */ } },
    clear: function () { try { localStorage.removeItem(KEY); } catch (e) { /* 무시 */ } }
  };

  /* ── 작은 도우미 ─────────────────────────────────────── */
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === false || v === null || v === undefined) return;
      if (k === 'text') el.textContent = v;
      else if (k === 'class') el.className = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    [].concat(kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function digits(v) { return String(v).replace(/\D/g, ''); }
  function linkHTML(text) {
    return '<a href="' + formUrl + '" target="_blank" rel="noopener noreferrer">' + text + '</a>';
  }

  /* ── 질문 제목으로 알아보는 칸 ───────────────────────────
     구글 폼 질문 제목에 아래 말이 들어 있으면 입력을 도와줍니다. */
  function kindOf(q) {
    var t = q.title || '';
    if (/유입\s*경로/.test(t)) return 'source';
    if (q.type !== 'text') return '';
    if (/사업자/.test(t) && /번호/.test(t)) return 'bizno';
    if (/이메일|e-?mail/i.test(t)) return 'email';
    if (/연락처|전화|휴대/.test(t)) return 'phone';
    if (/URL|링크|사이트|홈페이지/i.test(t)) return 'url';
    if (/브랜드\s*명/.test(t)) return 'brand';
    return '';
  }
  function isConsent(q) {
    return (q.type === 'checkbox' || q.type === 'radio') && /개인정보/.test((q.title || '') + (q.help || '') + (q.choices || []).join(''));
  }

  /* ── 질문 하나 그리기 ─────────────────────────────────── */
  function renderQuestion(q) {
    questions[q.id] = q;
    var id = 'q-' + q.id;
    if (q.type === 'header') {
      return h('div', { class: 'q-head' }, [h('h3', { text: q.title }), q.help ? h('p', { text: q.help }) : null]);
    }
    if (q.type === 'unsupported') {
      return h('div', { class: 'f full' }, [
        h('span', { class: 'lbl', text: q.title }),
        h('p', { class: 'notice' })
      ]);
    }

    var kind = kindOf(q);
    var wide = /paragraph|radio|checkbox|scale/.test(q.type) || (q.help && q.help.length > 60);
    var f = h('div', { class: 'f' + (wide ? ' full' : ''), 'data-qid': q.id, 'data-type': q.type, 'data-kind': kind || null, 'data-required': q.required ? true : null });
    if (kind === 'source') f.hidden = true;

    var head = [q.title];
    if (q.required) head.push(h('span', { class: 'req', 'aria-hidden': 'true', text: '*' }));
    else head.push(h('span', { class: 'opt', text: '선택' }));
    var group = /radio|checkbox|scale/.test(q.type);
    f.appendChild(group ? h('span', { class: 'lbl', id: id + '-l' }, head) : h('label', { for: id }, head));
    if (q.help) f.appendChild(h('p', { class: 'hint', id: id + '-h', text: q.help }));

    var ctl;
    if (q.type === 'text') {
      var type = { email: 'email', phone: 'tel', url: 'url' }[kind] || 'text';
      ctl = h('input', {
        id: id, name: q.id, type: type,
        inputmode: { bizno: 'numeric', phone: 'tel', url: 'url', email: 'email' }[kind] || null,
        autocomplete: { email: 'email', phone: 'tel' }[kind] || null,
        maxlength: kind === 'bizno' ? 12 : null,
        placeholder: { bizno: '123-45-67890', phone: '010-1234-5678', url: 'https://' }[kind] || null,
        'aria-describedby': q.help ? id + '-h' : null
      });
    } else if (q.type === 'paragraph') {
      ctl = h('textarea', { id: id, name: q.id, 'aria-describedby': q.help ? id + '-h' : null });
    } else if (q.type === 'date') {
      ctl = h('input', { id: id, name: q.id, type: 'date' });
    } else if (q.type === 'select') {
      ctl = h('select', { id: id, name: q.id }, [h('option', { value: '', text: '골라 주세요' })].concat(
        q.choices.map(function (c) { return h('option', { value: c, text: c }); })));
    } else if (q.type === 'radio' || q.type === 'checkbox') {
      ctl = h('div', { class: 'chips', role: q.type === 'radio' ? 'radiogroup' : 'group', 'aria-labelledby': id + '-l' },
        q.choices.map(function (c) {
          return h('label', null, [h('input', { type: q.type, name: q.id, value: c }), h('span', { text: c })]);
        }));
      if (q.other) {
        ctl.appendChild(h('label', null, [h('input', { type: q.type, name: q.id, value: '__other__' }), h('span', { text: '기타' })]));
      }
    } else if (q.type === 'scale') {
      var nums = [];
      for (var n = q.min; n <= q.max; n++) nums.push(n);
      ctl = h('div', { class: 'scale' }, [
        q.minLabel ? h('small', { text: q.minLabel }) : null,
        h('div', { class: 'chips', role: 'radiogroup', 'aria-labelledby': id + '-l' }, nums.map(function (n) {
          return h('label', null, [h('input', { type: 'radio', name: q.id, value: String(n) }), h('span', { text: String(n) })]);
        })),
        q.maxLabel ? h('small', { text: q.maxLabel }) : null
      ]);
    }
    f.appendChild(ctl);
    if (q.other) {
      f.appendChild(h('input', { class: 'other-input', type: 'text', name: q.id + '__other', 'aria-label': q.title + ' 기타 내용', placeholder: '기타 내용을 적어 주세요', hidden: true }));
    }
    f.appendChild(h('p', { class: 'err', text: errText(q, kind) }));
    return f;
  }
  function errText(q, kind) {
    if (kind === 'bizno') return '10자리 번호를 확인해 주세요.';
    if (kind === 'phone') return '연락 가능한 번호를 확인해 주세요.';
    if (kind === 'email') return '이메일 주소를 확인해 주세요.';
    if (q.type === 'checkbox') return '하나 이상 골라 주세요.';
    if (q.type === 'radio' || q.type === 'select' || q.type === 'scale') return '하나를 골라 주세요.';
    if (q.type === 'date') return '날짜를 골라 주세요.';
    return '입력해 주세요.';
  }

  /* ── 단계 만들기 ──────────────────────────────────────
     구글 폼의 섹션이 그대로 단계가 됩니다. 섹션이 하나뿐이면
     질문 PER_STEP개씩 나눠 단계를 만듭니다. 개인정보 동의는 확인 단계로 옮깁니다. */
  function buildSteps(data) {
    var consent = [];
    var groups = [];
    data.sections.forEach(function (s) {
      var items = s.items.filter(function (q) {
        if (isConsent(q)) { consent.push(q); return false; }
        return true;
      });
      if (items.length) groups.push({ title: s.title, help: s.help, items: items });
    });
    if (groups.length === 1 && groups[0].items.length > PER_STEP + 1) {
      var all = groups[0].items, chunked = [];
      for (var i = 0; i < all.length; i += PER_STEP) chunked.push({ title: '', help: '', items: all.slice(i, i + PER_STEP) });
      groups = chunked;
    }

    var total = groups.length + 1;
    stepsBox.innerHTML = '';
    groups.forEach(function (g, i) {
      var title = g.title || (i === 0 ? '기본 정보' : (i + 1) + '단계');
      var fs = h('fieldset', { class: 'sheet-step', 'data-title': title, hidden: true }, [
        h('legend', { class: 'sr', text: title }),
        h('span', { class: 'step-count', text: (i + 1) + ' / ' + total }),
        h('h2', { text: g.title || '필요한 정보를 알려 주세요.' }),
        g.help ? h('p', { class: 'sub', text: g.help }) : h('p', { class: 'sub', text: '* 표시는 꼭 필요한 항목입니다.' }),
        h('div', { class: 'fields' }, g.items.map(renderQuestion))
      ]);
      stepsBox.appendChild(fs);
      steps.push(fs);
    });

    // 확인 단계: 개인정보 안내와 동의
    var extra = $('#review-extra');
    consent.forEach(function (q) {
      questions[q.id] = q;
      var f = h('div', { class: 'f full', 'data-qid': q.id, 'data-type': q.type, 'data-required': q.required ? true : null }, [
        q.help ? h('p', { class: 'agree-help', text: q.help }) : h('p', { class: 'agree-help', text: q.title })
      ]);
      q.choices.forEach(function (c) {
        f.appendChild(h('label', { class: 'agree' }, [h('input', { type: q.type, name: q.id, value: c }), h('span', null, [h('b', { text: c })])]));
      });
      f.appendChild(h('p', { class: 'err', text: '동의해 주셔야 보낼 수 있습니다.' }));
      extra.appendChild(f);
    });
    $('.step-count', reviewStep).textContent = total + ' / ' + total;
    steps.push(reviewStep);

    progress.innerHTML = '';
    steps.forEach(function (s, i) {
      progress.appendChild(h('li', null, [h('i', { text: String(i + 1) }), s.getAttribute('data-title')]));
    });
  }

  /* ── 값 읽고 쓰기 ─────────────────────────────────────── */
  function valueOf(qid) {
    var q = questions[qid];
    var els = $$('[name="' + qid + '"]', form);
    if (!els.length) return '';
    var otherBox = $('[name="' + qid + '__other"]', form);
    var otherText = otherBox ? otherBox.value.trim() : '';
    if (q.type === 'checkbox') {
      return els.filter(function (e) { return e.checked; }).map(function (e) { return e.value === '__other__' ? otherText : e.value; }).filter(Boolean);
    }
    if (q.type === 'radio' || q.type === 'scale') {
      var on = els.filter(function (e) { return e.checked; })[0];
      if (!on) return '';
      return on.value === '__other__' ? otherText : on.value;
    }
    return els[0].value.trim();
  }
  function collect() {
    var out = {};
    Object.keys(questions).forEach(function (id) {
      if (questions[id].type === 'header' || questions[id].type === 'unsupported') return;
      out[id] = valueOf(id);
    });
    return out;
  }
  function saveDraft() {
    var raw = {};
    $$('input,select,textarea', form).forEach(function (el) {
      if (!el.name || el.name === 'website') return;
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (!raw[el.name]) raw[el.name] = [];
        if (el.checked) raw[el.name].push(el.value);
      } else raw[el.name] = el.value;
    });
    store.set(raw);
  }
  function restoreDraft() {
    var raw = store.get();
    Object.keys(raw).forEach(function (name) {
      var v = raw[name];
      $$('[name="' + name + '"]', form).forEach(function (el) {
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = Array.isArray(v) && v.indexOf(el.value) > -1;
        else if (typeof v === 'string') el.value = v;
      });
    });
  }

  /* ── 입력 도우미: 하이픈 · 기타 칸 · 유입 경로 · 브랜드명 ── */
  function formatField(el) {
    var f = el.closest('.f');
    if (!f) return;
    var kind = f.getAttribute('data-kind');
    if (kind === 'bizno') {
      var d = digits(el.value).slice(0, 10);
      el.value = d.length > 5 ? d.slice(0, 3) + '-' + d.slice(3, 5) + '-' + d.slice(5) : d.length > 3 ? d.slice(0, 3) + '-' + d.slice(3) : d;
    } else if (kind === 'phone') {
      var p = digits(el.value).slice(0, 11);
      if (/^02/.test(p)) {
        el.value = p.length > 9 ? p.slice(0, 2) + '-' + p.slice(2, 6) + '-' + p.slice(6)
          : p.length > 5 ? p.slice(0, 2) + '-' + p.slice(2, 5) + '-' + p.slice(5)
          : p.length > 2 ? p.slice(0, 2) + '-' + p.slice(2) : p;
      } else {
        el.value = p.length > 10 ? p.slice(0, 3) + '-' + p.slice(3, 7) + '-' + p.slice(7)
          : p.length > 6 ? p.slice(0, 3) + '-' + p.slice(3, 6) + '-' + p.slice(6)
          : p.length > 3 ? p.slice(0, 3) + '-' + p.slice(3) : p;
      }
    }
  }
  function syncOther() {
    $$('.other-input', form).forEach(function (box) {
      var qid = box.name.replace(/__other$/, '');
      var on = $('[name="' + qid + '"][value="__other__"]', form);
      box.hidden = !(on && on.checked);
    });
  }
  function fillAuto() {
    $$('.f[data-kind="source"] input', form).forEach(function (el) { el.value = from; });
    if (brandParam) $$('.f[data-kind="brand"] input', form).forEach(function (el) { if (!el.value) el.value = brandParam; });
  }

  /* ── 순위 질문: 앞 순위에서 고른 보기는 다음 순위에서 뺍니다 ──
     제목에 "1순위", "2순위"… 가 있는 질문끼리, 그리고 "순위 무관" 질문에 적용합니다.
     "…없음" 보기는 다른 보기와 함께 고를 수 없습니다. */
  var ranked = [], unranked = [];
  function setupRanking() {
    Object.keys(questions).forEach(function (id) {
      var q = questions[id];
      if (q.type !== 'radio' && q.type !== 'checkbox') return;
      var m = /(\d+)\s*순위/.exec(q.title);
      if (/순위\s*무관/.test(q.title)) unranked.push(id);
      else if (m) ranked.push({ id: id, n: +m[1] });
    });
    ranked.sort(function (a, b) { return a.n - b.n; });
  }
  function isNone(v) { return /없음\s*$/.test(v); }
  function syncRanking() {
    if (!ranked.length) return;
    var taken = [];
    ranked.forEach(function (r) {
      $$('[name="' + r.id + '"]', form).forEach(function (i) {
        i.disabled = taken.indexOf(i.value) > -1;
        if (i.disabled) i.checked = false;
      });
      taken = taken.concat([].concat(valueOf(r.id)).filter(function (v) { return v && !isNone(v); }));
    });
    unranked.forEach(function (id) {
      $$('[name="' + id + '"]', form).forEach(function (i) {
        i.disabled = taken.indexOf(i.value) > -1;
        if (i.disabled) i.checked = false;
      });
    });
  }

  /* ── 검사 ─────────────────────────────────────────────── */
  var CHECK = {
    bizno: function (v) { return digits(v).length === 10; },
    phone: function (v) { var n = digits(v).length; return n >= 9 && n <= 11; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  };
  function fieldOk(f) {
    var qid = f.getAttribute('data-qid');
    if (!qid || f.hidden) return true;
    var v = valueOf(qid);
    var empty = Array.isArray(v) ? !v.length : !v;
    // "기타"를 골랐는데 내용이 비어 있으면 빈 답으로 봅니다
    var otherOn = $('[name="' + qid + '"][value="__other__"]:checked', form);
    var otherBox = $('[name="' + qid + '__other"]', form);
    if (otherOn && otherBox && !otherBox.value.trim()) return false;
    if (empty) return !f.hasAttribute('data-required');
    var kind = f.getAttribute('data-kind');
    if (kind && CHECK[kind]) return CHECK[kind](v);
    return true;
  }
  function validate(step) {
    var first = null;
    $$('.f[data-qid]', step).forEach(function (f) {
      var ok = fieldOk(f);
      f.classList.toggle('bad', !ok);
      if (!ok && !first) first = f;
    });
    if (first) {
      var el = $('input:not([hidden]),select,textarea', first);
      if (el) el.focus({ preventScroll: true });
      first.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      return false;
    }
    return true;
  }

  /* ── 확인 단계 요약 ───────────────────────────────────── */
  function buildReview() {
    var box = $('#review');
    box.innerHTML = '';
    steps.slice(0, -1).forEach(function (step, i) {
      var dl = h('dl');
      $$('.f[data-qid]', step).forEach(function (f) {
        if (f.hidden) return;
        var q = questions[f.getAttribute('data-qid')];
        var v = valueOf(q.id);
        if (Array.isArray(v)) v = v.join(', ');
        dl.appendChild(h('dt', { text: q.title }));
        dl.appendChild(v ? h('dd', { text: v }) : h('dd', { style: 'color:var(--muted)', text: '—' }));
      });
      var btn = h('button', { type: 'button', text: '수정' });
      btn.addEventListener('click', function () { show(i); });
      box.appendChild(h('section', null, [h('header', null, [h('h3', { text: step.getAttribute('data-title') }), btn]), dl]));
    });
  }

  /* ── 단계 이동 ────────────────────────────────────────── */
  function show(i) {
    cur = i;
    steps.forEach(function (s, k) { s.hidden = k !== i; });
    $$('li', progress).forEach(function (li, k) {
      li.classList.toggle('is-now', k === i);
      li.classList.toggle('is-done', k < i);
      if (k === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    if (bar) bar.style.width = ((i + 1) / steps.length * 100) + '%';
    prev.hidden = i === 0;
    next.textContent = i === steps.length - 1 ? '제안서 보내기' : '다음';
    if (i === steps.length - 1) buildReview();
    sendErr.hidden = true;
    var hd = $('h2', steps[i]);
    if (hd && booted) { hd.setAttribute('tabindex', '-1'); hd.focus({ preventScroll: true }); }
    var top = form.getBoundingClientRect().top + scrollY - 100;
    if (scrollY > top) scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
  }
  prev.addEventListener('click', function () { if (cur > 0) show(cur - 1); });

  form.addEventListener('input', function (e) {
    if (e.target.matches('input[type=text],input[type=tel]')) formatField(e.target);
    var f = e.target.closest('.f');
    if (f && f.classList.contains('bad') && fieldOk(f)) f.classList.remove('bad');
    saveDraft();
  });
  form.addEventListener('change', function (e) {
    var t = e.target;
    if (t.type === 'checkbox' && t.checked && isNone(t.value)) {
      $$('[name="' + t.name + '"]', form).forEach(function (i) { if (i !== t) i.checked = false; });
    } else if (t.type === 'checkbox' && t.checked) {
      $$('[name="' + t.name + '"]', form).forEach(function (i) { if (i !== t && isNone(i.value)) i.checked = false; });
    }
    syncOther();
    syncRanking();
    var f = t.closest('.f');
    if (f && f.classList.contains('bad') && fieldOk(f)) f.classList.remove('bad');
    saveDraft();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!steps.length) return;
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
    sendErr.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }
  function finish() {
    store.clear();
    steps.forEach(function (s) { s.hidden = true; });
    nav.hidden = true;
    doneStep.hidden = false;
    $$('li', progress).forEach(function (li) { li.classList.remove('is-now'); li.classList.add('is-done'); });
    if (bar) bar.style.width = '100%';
    doneStep.focus({ preventScroll: true });
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }
  var KEEP = '작성하신 내용은 이 기기에 그대로 남아 있습니다.';
  function send() {
    if (DEMO) {
      fail('미리보기 상태입니다. 아직 구글 폼과 연결되지 않아 이 화면에서는 제출되지 않습니다. 지금 제안하시려면 ' + linkHTML('구글 폼') + '을 이용해 주세요.');
      return;
    }
    next.disabled = true;
    next.textContent = '보내는 중…';
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 25000);
    // text/plain 으로 보내야 브라우저가 사전 확인 요청 없이 Apps Script로 바로 보냅니다
    fetch(ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ answers: collect(), hp: form.elements.website.value }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { return r.json(); }).then(function (res) {
      clearTimeout(timer);
      if (res && res.ok) { finish(); return; }
      if (res && res.error === 'closed') { fail('지금은 제안서 접수를 잠시 멈췄습니다. ' + MAIL + '으로 문의해 주세요. ' + KEEP); return; }
      if (res && res.error === 'invalid') {
        var names = (res.missing || []).concat(res.bad || []).join(', ');
        fail('확인이 필요한 항목이 있습니다: <b>' + names.replace(/</g, '&lt;') + '</b>. 입력폼이 방금 바뀌었을 수 있으니 새로고침 후 다시 보내 주세요. ' + KEEP);
        return;
      }
      throw new Error('server');
    }).catch(function () {
      clearTimeout(timer);
      fail('전송되지 않았습니다. 잠시 후 다시 시도하시거나, ' + linkHTML('구글 폼') + '으로 제출해 주세요. ' + KEEP);
    });
  }

  /* ── 불러오기 ─────────────────────────────────────────── */
  var booted = false;
  function loadFailed() {
    form.setAttribute('aria-busy', 'false');
    stepsBox.innerHTML = '';
    loadNote.innerHTML = '입력폼을 불러오지 못했습니다. 잠시 후 새로고침하시거나, ' + linkHTML('구글 폼') + '으로 제안해 주세요. 문의 ' + MAIL;
    loadNote.hidden = false;
  }
  function start(data) {
    if (!data || !data.ok || !data.sections) { loadFailed(); return; }
    if (data.url) formUrl = data.url;
    form.setAttribute('aria-busy', 'false');
    if (data.accepting === false) {
      stepsBox.innerHTML = '';
      loadNote.textContent = data.closedMessage || ('지금은 제안서 접수를 잠시 멈췄습니다. ' + MAIL + '으로 문의해 주세요.');
      loadNote.hidden = false;
      return;
    }
    if (data.description) {
      $('#form-desc').textContent = data.description;
      $('#form-intro').hidden = false;
    }
    buildSteps(data);
    var unsupported = [];
    data.sections.forEach(function (s) { s.items.forEach(function (q) { if (q.type === 'unsupported') unsupported.push(q.title); }); });
    setupRanking();
    restoreDraft();
    fillAuto();
    syncOther();
    syncRanking();
    nav.hidden = false;
    if (DEMO) {
      loadNote.textContent = '미리보기: 구글 폼과 연결되기 전이라 예시 질문을 보여주고 있습니다.';
      loadNote.hidden = false;
    }
    if (unsupported.length) {
      $$('.f', stepsBox).forEach(function (f) {
        var n = $('.notice', f);
        if (n) n.innerHTML = '이 질문(파일 업로드 등)은 여기서 받을 수 없습니다. 필요하면 ' + linkHTML('구글 폼') + '에서 따로 제출하거나 ' + MAIL + '으로 보내 주세요.';
      });
    }
    show(0);
    booted = true;
  }

  var ctrlLoad = typeof AbortController === 'function' ? new AbortController() : null;
  var loadTimer = setTimeout(function () { if (ctrlLoad) ctrlLoad.abort(); }, 12000);
  fetch(DEMO ? DEMO_URL : ENDPOINT, { signal: ctrlLoad ? ctrlLoad.signal : undefined })
    .then(function (r) { return r.json(); })
    .then(function (d) { clearTimeout(loadTimer); start(d); })
    .catch(function () { clearTimeout(loadTimer); loadFailed(); });
})();
