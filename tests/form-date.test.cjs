'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'google-apps-script/form-bridge.gs'), 'utf8');
function bridge() {
  const saved = []; let submits = 0;
  const dateItem = { isRequired: () => true, createResponse: date => ({ getResponse: () => date.toISOString().slice(0, 10) }) };
  const item = { getType: () => 'DATE', getId: () => 7, getTitle: () => '출시일', asDateItem: () => dateItem };
  const response = { withItemResponse: r => saved.push(r.getResponse()), submit: () => submits++ };
  const form = { isAcceptingResponses: () => true, getItems: () => [item], createResponse: () => response };
  const context = vm.createContext({ FormApp: { ItemType: { DATE: 'DATE' }, getActiveForm: () => form },
    Session: { getScriptTimeZone: () => 'Asia/Seoul' }, console: { log() {} } });
  vm.runInContext(source, context);
  context.out_ = body => body;
  return { context, saved, submits: () => submits, post: date => context.doPost({ postData: { contents: JSON.stringify({ answers: { 7: date } }) } }) };
}
test('doPost preserves a civil date and leap day at the DateItem boundary', () => {
  for (const value of ['2026-10-04', '2024-02-29', '2026-01-01', '2026-12-31']) {
    const b = bridge();
    assert.equal(b.post(value).ok, true);
    assert.deepEqual(b.saved, [value]);
    assert.equal(b.submits(), 1);
  }
});
test('doPost rejects invalid or rolled-over dates before submitting', () => {
  for (const value of ['2026-02-29', '2026-02-30', '2026-13-01', '2026-00-01', '2026-10-00', '0000-01-01', '2026-1-1', '2026-10-04T00:00:00Z', ['2026-10-04'], 123]) {
    const b = bridge();
    assert.equal(b.post(value).error, 'invalid', JSON.stringify(value));
    assert.equal(b.submits(), 0);
  }
});
test('date encoding is independent of script timezone; local midnight reproduces Korean previous-day regression', () => {
  const code = `const vm=require('node:vm');const c=vm.createContext({});vm.runInContext(${JSON.stringify(source)},c);process.stdout.write(JSON.stringify({fixed:c.formDate_('2026-10-04').toISOString(),legacy:new Date(2026,9,4).toISOString()}));`;
  for (const TZ of ['Asia/Seoul', 'UTC', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
    const result = JSON.parse(execFileSync(process.execPath, ['-e', code], { env: { ...process.env, TZ }, encoding: 'utf8' }));
    assert.equal(result.fixed, '2026-10-04T00:00:00.000Z', TZ);
    if (TZ === 'Asia/Seoul') assert.equal(result.legacy.slice(0, 10), '2026-10-03');
  }
});
test('deployment diagnostic creates only unsaved ItemResponses', () => {
  const b = bridge();
  const result = b.context.inspectDateResponse();
  assert.equal(result.dates[0].candidate, '2026-10-04');
  assert.equal(b.submits(), 0);
  assert.deepEqual(b.saved, []);
});
