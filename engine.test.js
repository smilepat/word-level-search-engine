// engine.test.js — 무의존 테스트. 실행: node engine.test.js
// 굴절어/파생어 판정과 급 매핑을 실제 데이터로 검증한다.
const assert = require('node:assert');
const { buildIndex, analyze } = require('./engine.js');
const vocab = require('./vocab-data.json');
const index = buildIndex(vocab);

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + '\n      ' + e.message); }
}

// 특정 표제어로 가는 경로의 관계를 반환 (없으면 undefined)
function relationTo(res, headword) {
  const r = res.routes.find((x) => x.headword === headword);
  return r && r.relation;
}

console.log('[표제어 직접 일치]');
test('circulate = 고등 (2015·2022 양쪽)', () => {
  const v = analyze('circulate', index).verdict;
  assert.strictEqual(v['2015'].modeA.level, '고등');
  assert.strictEqual(v['2022'].modeA.level, '고등');
});
test('significant = 고등(2015), 2022 미포함', () => {
  const v = analyze('significant', index).verdict;
  assert.strictEqual(v['2015'].modeA.level, '고등');
  assert.strictEqual(v['2022'].modeA, null); // significant 는 2022 목록에 없음
});
test('circumstance = 고등(2015)/중등(2022)', () => {
  const v = analyze('circumstance', index).verdict;
  assert.strictEqual(v['2015'].modeA.level, '고등');
  assert.strictEqual(v['2022'].modeA.level, '중등');
});
test('important = 초등', () => {
  assert.strictEqual(analyze('important', index).verdict['2015'].modeA.level, '초등');
});

console.log('[굴절어 — 두 모드 모두 포함]');
test('books → book (굴절어)', () => {
  const res = analyze('books', index);
  assert.strictEqual(relationTo(res, 'book'), '굴절어');
  assert.ok(res.verdict['2022'].modeA, '모드A에서 포함이어야 함');
});
test('feet → foot (불규칙 굴절)', () => {
  assert.strictEqual(relationTo(analyze('feet', index), 'foot'), '굴절어');
});
test('taller → tall (비교급 굴절)', () => {
  assert.strictEqual(relationTo(analyze('taller', index), 'tall'), '굴절어');
});
test('studies → study (y→ies 굴절)', () => {
  const res = analyze('studies', index);
  assert.strictEqual(relationTo(res, 'study'), '굴절어');
});
test('stopped → stop (자음중복 굴절)', () => {
  assert.strictEqual(relationTo(analyze('stopped', index), 'stop'), '굴절어');
});
test('making → make (drop-e 굴절)', () => {
  assert.strictEqual(relationTo(analyze('making', index), 'make'), '굴절어');
});

console.log('[파생어 — 모드 B에서만 포함]');
test('happiness → happy (파생어, 모드A 미포함/모드B 포함)', () => {
  const res = analyze('happiness', index);
  assert.strictEqual(relationTo(res, 'happy'), '파생어');
  const v = res.verdict['2022'];
  assert.strictEqual(v.modeA, null, '굴절만 보면 미포함');
  assert.ok(v.modeB, '파생 포함하면 포함');
});
test('quickly → quick (파생 -ly)', () => {
  const res = analyze('quickly', index);
  assert.strictEqual(relationTo(res, 'quick'), '파생어');
  assert.strictEqual(res.verdict['2022'].modeA, null);
  assert.ok(res.verdict['2022'].modeB);
});
test('unhappy → happy (파생 접두사 un-)', () => {
  assert.strictEqual(relationTo(analyze('unhappy', index), 'happy'), '파생어');
});

console.log('[핵심 애매성 — -er 이 굴절(비교급)인지 파생(행위자)인지]');
test('teacher → teach 는 파생어여야 함(행위자 -er, 비교급 아님)', () => {
  const res = analyze('teacher', index);
  assert.strictEqual(relationTo(res, 'teach'), '파생어');
  // teach 는 동사 → teacher 를 굴절(비교급)로 오판하면 안 됨
  assert.strictEqual(res.verdict['2022'].modeA, null, 'teacher 는 모드A(굴절만) 미포함');
});

console.log('[미포함]');
test('존재하지 않는 단어 → 전부 미포함', () => {
  const v = analyze('zxcvbnm', index).verdict;
  assert.strictEqual(v['2015'].modeA, null);
  assert.strictEqual(v['2022'].modeB, null);
});

console.log('\n결과: ' + pass + ' 통과 / ' + fail + ' 실패');
process.exit(fail ? 1 : 0);
