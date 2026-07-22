// grammar-engine.test.js — 무의존 테스트. 실행: node grammar-engine.test.js
const assert = require('node:assert');
const data = require('./grammar-data.js');
const E = require('./grammar-engine.js');

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + '\n      ' + e.message); }
}
const top = (q) => E.keywordSearch(q, data)[0];
const findKo = (hits, ko) => hits.find((h) => h.ko.includes(ko));

console.log('[데이터 무결성]');
test('40개 항목, 모든 band 는 초/중/고', () => {
  assert.strictEqual(data.items.length, 40);
  for (const it of data.items) assert.ok(['초', '중', '고'].includes(it.band), it.ko + ' band=' + it.band);
});
test('band 는 explicit 급과 일치', () => {
  for (const it of data.items) assert.strictEqual(it.band, data.bandOf(it.explicit));
});

console.log('[키워드 검색]');
test('"가정법" → 가정법 과거 (고)', () => {
  const t = top('가정법');
  assert.ok(t.ko.includes('가정법'));
  assert.strictEqual(t.band, '고');
});
test('"수동태" → 수동태 (중)', () => {
  const t = top('수동태');
  assert.ok(t.ko.includes('수동태'));
  assert.strictEqual(t.band, '중');
});
test('"현재진행" → 초', () => {
  assert.strictEqual(top('현재진행').band, '초');
});
test('"there" → There is/are 구문', () => {
  assert.ok(top('there').ko.includes('There'));
});

console.log('[도입급 vs 어법출제급 — Pat 핵심 지침]');
test('과거시제: intro 초5-6 / explicit 중1-3 / band 중', () => {
  const it = data.items.find((x) => x.ko.includes('과거시제'));
  assert.strictEqual(it.intro, '초5-6');
  assert.strictEqual(it.explicit, '중1-3');
  assert.strictEqual(it.band, '중');
  assert.ok(it.note && it.note.includes('중1'));
});

console.log('[영어 예문 구조 탐지]');
test('"If Joe had time, he would go" → 가정법 탐지', () => {
  const hits = E.detectFromSentence('If Joe had time, he would go to Spain.', data);
  assert.ok(findKo(hits, '가정법'), '가정법 탐지 실패');
});
test('"The novel was written by Mark Twain." → 수동태 탐지', () => {
  const hits = E.detectFromSentence('The novel was written by Mark Twain.', data);
  assert.ok(findKo(hits, '수동태'), '수동태 탐지 실패');
});
test('"He is sleeping now." → 현재진행 탐지', () => {
  const hits = E.detectFromSentence('He is sleeping now.', data);
  assert.ok(findKo(hits, '현재진행'), '현재진행 탐지 실패');
});
test('"There are two books on the desk." → There 구문 탐지', () => {
  const hits = E.detectFromSentence('There are two books on the desk.', data);
  assert.ok(findKo(hits, 'There'), 'There 탐지 실패');
});
test('한국어만 입력하면 문장 탐지는 빈 배열', () => {
  assert.strictEqual(E.detectFromSentence('가정법', data).length, 0);
});

console.log('[급별 그룹화]');
test('groupByBand 는 초/중/고 모두 채움', () => {
  const g = E.groupByBand(data);
  assert.ok(g['초'].length > 0 && g['중'].length > 0 && g['고'].length > 0);
});

console.log('\n결과: ' + pass + ' 통과 / ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
