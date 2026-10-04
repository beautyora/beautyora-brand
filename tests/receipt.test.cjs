'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'dist', 'apply.js'), 'utf8');
function functionSource(name, optional = false) {
  const start = source.indexOf('  function ' + name + '(');
  if (start < 0 && optional) return '';
  assert.ok(start >= 0, name);
  const tail = source.slice(start);
  const next = tail.slice(1).search(/\n  (?:function |\/\*)/);
  return next < 0 ? tail : tail.slice(0, next + 1);
}
function render(questions, values) {
  const nodes = [];
  const receipt = { innerHTML: '', appendChild: node => nodes.push(node) };
  const context = vm.createContext({
    pad: n => String(n).padStart(2, '0'), ymd: () => '2026-10-04',
    questions, form: {}, docNo: 'BO-261004-5551', ranked: [],
    valueOf: id => values[id] ?? '',
    h: (tag, attrs) => ({ tag, text: attrs.text }),
    $: selector => {
      if (selector === '#receipt-rows') return receipt;
      const match = selector.match(/data-kind="(.*?)"/);
      if (!match) return null;
      const id = Object.keys(questions).find(id => context.kindOf(questions[id]) === match[1]);
      return id ? { getAttribute: () => id } : null;
    }
  });
  ['kindOf', 'receiptTextValue', 'collect', 'buildReceipt'].forEach(name => vm.runInContext(functionSource(name, name === 'receiptTextValue'), context));
  const before = JSON.stringify(context.collect());
  context.buildReceipt();
  assert.equal(JSON.stringify(context.collect()), before, 'receipt rendering must never alter submission answers');
  return Object.fromEntries(nodes.filter(n => n.tag === 'dt').map((n, i) => [n.text, nodes[i * 2 + 1].text]));
}

test('receipt chooses contact text input instead of consent mentioning a name, regardless of numeric ID order', () => {
  const questions = {
    100: { title: '담당자명', type: 'text' },
    90: { title: '회사명', type: 'text' },
    2: { title: '개인정보 수집 및 이용 동의 (회사명, 담당자명, 이름, 이메일)', type: 'checkbox' }
  };
  const rows = render(questions, { 100: '테스트 담당자', 90: '테스트 회사', 2: ['개인정보 수집 및 이용에 동의합니다.'] });
  assert.equal(rows['담당자'], '테스트 담당자');
  assert.equal(rows['회사명'], '테스트 회사');
  assert.equal(rows['접수번호'], 'BO-261004-5551');
});

test('receipt prioritizes explicit contact label over generic name and ignores brand/product names', () => {
  const rows = render({
    1: { title: '브랜드 이름', type: 'text' }, 2: { title: '상품 이름', type: 'text' },
    3: { title: '이름', type: 'text' }, 100: { title: '담당자 성명 (직급 포함)', type: 'text' }
  }, { 1: '브랜드', 2: '상품', 3: '기타 이름', 100: '테스트 담당자' });
  assert.equal(rows['담당자'], '테스트 담당자');
});

test('receipt supports contact label variants without matching contact phone or email', () => {
  for (const title of ['담당자명', '담당자 이름', '담당자 성함', '담당자', '성명', '성함', '이름']) {
    const rows = render({ 1: { title: '담당자 이메일', type: 'text' }, 2: { title: '담당자 연락처', type: 'text' }, 100: { title, type: 'text' } },
      { 1: 'test@example.com', 2: '000-0000-0000', 100: '테스트 담당자' });
    assert.equal(rows['담당자'], '테스트 담당자', title);
    assert.equal(rows['회신 받을 이메일'], 'test@example.com');
  }
});

test('receipt omits missing contact instead of displaying consent or descriptive text', () => {
  const rows = render({
    1: { title: '개인정보에 이름 포함 동의', type: 'radio' },
    2: { title: '이름 수집 동의', type: 'text' },
    3: { title: '담당자명', type: 'paragraph' }
  }, { 1: '동의합니다', 2: '동의합니다', 3: '설명 문구' });
  assert.equal(rows['담당자'], undefined);
});
