// engine.js — 단어 → 교육과정 급 + 굴절어/파생어 판정 엔진 (무의존, 순수 함수)
// 브라우저: window.WLSE_ENGINE / Node: module.exports 로 노출.
//
// 핵심 개념
//  - 굴절어(inflection): 같은 단어의 문법적 변화형(복수·3인칭·시제·진행·비교/최상급).
//    품사·의미가 그대로다. → "표제어와 같은 단어"로 취급.
//  - 파생어(derivation): 접사로 품사/의미가 바뀐 새 단어(-ly, -ness, -tion, un- 등).
//
// 판정 모드
//  - 모드 A (굴절어만 포함): 표제어이거나 표제어의 굴절형이면 "포함".
//  - 모드 B (파생어까지 포함): 위 + 표제어의 파생형도 "포함".
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WLSE_ENGINE = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VOWELS = 'aeiou';

  // 표제어의 형제 변이형(variants)으로 품사를 추론한다.
  //  - -est/-iest 형이 있으면 형용사(비교급 계열)
  //  - -ing/-ed 형이 있으면 동사
  function inferPos(variants) {
    let adj = false, verb = false;
    for (const v of variants) {
      if (v.endsWith('est')) adj = true;
      if (v.endsWith('ing') || v.endsWith('ed')) verb = true;
    }
    if (adj) return 'adj';
    if (verb) return 'verb';
    return 'unknown';
  }

  // base(원형)에서 생성 가능한 모든 굴절형 집합을 만든다.
  // pos: 'adj' | 'verb' | 'noun' | 'unknown' — 비교급 생성 여부를 좌우.
  function inflectedForms(base, pos) {
    const f = new Set();
    const last = base.slice(-1);
    const endsE = base.endsWith('e');
    const cvcDouble = /[^aeiou][aeiou][^aeiouwxy]$/.test(base); // 자음 중복 대상(stop→stopped)

    // 복수 / 3인칭 단수 -s
    f.add(base + 's');
    if (/(s|x|z|ch|sh)$/.test(base)) f.add(base + 'es');
    if (/[^aeiou]y$/.test(base)) f.add(base.slice(0, -1) + 'ies');

    // 과거 / 과거분사 -ed
    if (endsE) f.add(base + 'd'); else f.add(base + 'ed');
    if (/[^aeiou]y$/.test(base)) f.add(base.slice(0, -1) + 'ied');
    if (cvcDouble) f.add(base + last + 'ed');

    // 진행형 -ing
    if (endsE && !base.endsWith('ee')) f.add(base.slice(0, -1) + 'ing');
    else f.add(base + 'ing');
    if (cvcDouble) f.add(base + last + 'ing');

    // 비교급 / 최상급 (형용사·부사, 품사 불명도 허용)
    if (pos === 'adj' || pos === 'unknown') {
      if (endsE) { f.add(base + 'r'); f.add(base + 'st'); }
      else { f.add(base + 'er'); f.add(base + 'est'); }
      if (/[^aeiou]y$/.test(base)) { f.add(base.slice(0, -1) + 'ier'); f.add(base.slice(0, -1) + 'iest'); }
      if (cvcDouble) { f.add(base + last + 'er'); f.add(base + last + 'est'); }
    }
    return f;
  }

  // query 를 굴절형으로 보고 가능한 원형 후보(strings)를 만든다(역방향).
  function reverseInflectionCandidates(q) {
    const c = new Set();
    const push = (w) => { if (w && w.length >= 2) c.add(w); };

    // 복수/3인칭
    if (q.endsWith('ies')) push(q.slice(0, -3) + 'y');
    if (q.endsWith('es')) push(q.slice(0, -2));
    if (q.endsWith('s') && !q.endsWith('ss')) push(q.slice(0, -1));

    // 과거/과거분사
    if (q.endsWith('ied')) push(q.slice(0, -3) + 'y');
    if (q.endsWith('ed')) { push(q.slice(0, -2)); push(q.slice(0, -1)); if (isDoubled(q, 2)) push(q.slice(0, -3)); }

    // 진행형
    if (q.endsWith('ing')) { push(q.slice(0, -3)); push(q.slice(0, -3) + 'e'); if (isDoubled(q, 3)) push(q.slice(0, -4)); }

    // 비교급/최상급
    if (q.endsWith('iest')) push(q.slice(0, -4) + 'y');
    if (q.endsWith('ier')) push(q.slice(0, -3) + 'y');
    if (q.endsWith('est')) { push(q.slice(0, -3)); push(q.slice(0, -2)); if (isDoubled(q, 3)) push(q.slice(0, -4)); }
    if (q.endsWith('er')) { push(q.slice(0, -2)); push(q.slice(0, -1)); if (isDoubled(q, 2)) push(q.slice(0, -3)); }

    return [...c];
  }

  // q 의 접미(suffix) 바로 앞 글자가 자음 중복인지 (stopped: pp, running: nn)
  function isDoubled(q, suffixLen) {
    const i = q.length - suffixLen; // 접미 시작 위치
    return i >= 2 && q[i - 1] === q[i - 2] && !VOWELS.includes(q[i - 1]);
  }

  // 파생 접미사(품사/의미를 바꾸는 것) 목록
  const DERIV_SUFFIXES = [
    'ation', 'ition', 'ness', 'tion', 'sion', 'ment', 'ity', 'ance', 'ence',
    'ful', 'less', 'ous', 'ive', 'able', 'ible', 'ist', 'ism', 'ship', 'hood',
    'ize', 'ise', 'ify', 'ly', 'al', 'ic', 'ish', 'en', 'age', 'er', 'or', 'ion', 'th', 'y',
  ];
  const DERIV_PREFIXES = ['un', 'in', 'im', 'il', 'ir', 'dis', 'non', 're', 'pre', 'mis', 'over', 'under', 'anti', 'de', 'en'];

  // query 를 파생어로 보고 가능한 기반 표제어 후보를 만든다.
  function reverseDerivationCandidates(q) {
    const out = [];
    // 접미사 제거
    for (const suf of DERIV_SUFFIXES) {
      if (q.length > suf.length + 1 && q.endsWith(suf)) {
        const stem = q.slice(0, -suf.length);
        for (const b of restoreStem(stem)) out.push({ base: b, affix: '-' + suf, kind: '접미사' });
      }
    }
    // 접두사 제거
    for (const pre of DERIV_PREFIXES) {
      if (q.length > pre.length + 2 && q.startsWith(pre)) {
        out.push({ base: q.slice(pre.length), affix: pre + '-', kind: '접두사' });
      }
    }
    return out;
  }

  // 접미사 제거 후 원형 철자 복원 후보(happi→happy, us→use, abor→abort 등 대략)
  function restoreStem(stem) {
    const set = new Set([stem]);
    if (stem.endsWith('i')) set.add(stem.slice(0, -1) + 'y'); // happi→happy
    set.add(stem + 'e'); // us→use, abus→abuse
    if (/[^aeiou][^aeiou]$/.test(stem)) { /* 그대로 */ }
    return [...set].filter((w) => w.length >= 2);
  }

  // (headword, variant) 쌍이 파생 관계(접사)인지 판정.
  // 접두사/접미사로 설명되면 파생, 아니면 아님(→ 불규칙 굴절로 취급).
  function isDerivationalPair(headword, variant) {
    for (const pre of DERIV_PREFIXES) {
      if (variant === pre + headword) return true; // un+happy
    }
    for (const suf of DERIV_SUFFIXES) {
      if (variant.length > suf.length && variant.endsWith(suf)) {
        const stem = variant.slice(0, -suf.length);
        if (restoreStem(stem).includes(headword)) return true; // happi+ness→happy
      }
    }
    return false;
  }

  // 표제어의 한 변이형이 굴절어인지 파생어인지 분류.
  //  1) 정방향 굴절 생성으로 재현되면 → 굴절어
  //  2) 접사로 설명되면 → 파생어
  //  3) 둘 다 아니면 → 불규칙 굴절(feet, taught, wrote 등) → 굴절어
  function classifyVariant(headword, variant, inflSet) {
    if (inflSet.has(variant)) return '굴절어';
    if (isDerivationalPair(headword, variant)) return '파생어';
    return '굴절어';
  }

  // ── 인덱스 빌드 ────────────────────────────────────────────────
  // vocab: build-vocab.mjs 가 만든 {meta, entries} 객체.
  function buildIndex(vocab) {
    const entries = vocab.entries || {};
    const headwords = new Set(Object.keys(entries));
    const pos = {}; // headword → 추론 품사
    const variantIndex = new Map(); // variantForm → [{headword, relation}]

    for (const hw of headwords) {
      const e = entries[hw];
      const p = inferPos(e.variants || []);
      pos[hw] = p;
      const infl = inflectedForms(hw, p);
      for (const vf of e.variants || []) {
        const relation = classifyVariant(hw, vf, infl);
        if (!variantIndex.has(vf)) variantIndex.set(vf, []);
        variantIndex.get(vf).push({ headword: hw, relation, source: '목록' });
      }
    }
    return { vocab, entries, headwords, pos, variantIndex };
  }

  // ── 분석 ──────────────────────────────────────────────────────
  // 반환: { query, routes:[{headword,relation,rule,source}], verdict:{2015,2022} }
  function analyze(query, index) {
    const q = String(query || '').toLowerCase().trim();
    const { entries, headwords, pos, variantIndex } = index;
    const routes = [];
    const seen = new Set();
    const add = (headword, relation, rule, source) => {
      const key = headword + '|' + relation;
      if (seen.has(key)) return;
      seen.add(key);
      routes.push({ headword, relation, rule, source });
    };

    if (!q) return { query: q, routes: [], verdict: emptyVerdict() };

    // 1) 직접 표제어
    if (headwords.has(q)) add(q, '표제어', '표제어 직접 일치', '표제어');

    // 2) 목록(variants) 권위 매칭
    if (variantIndex.has(q)) {
      for (const r of variantIndex.get(q)) add(r.headword, r.relation, '별표3 변이형 목록', '목록');
    }

    // 3) 규칙 기반 굴절어 (역생성 → 정생성으로 재검증하여 오탐 제거)
    for (const base of reverseInflectionCandidates(q)) {
      if (headwords.has(base) && inflectedForms(base, pos[base]).has(q)) {
        add(base, '굴절어', '굴절 규칙', '규칙');
      }
    }

    // 4) 규칙 기반 파생어
    for (const cand of reverseDerivationCandidates(q)) {
      if (headwords.has(cand.base)) {
        add(cand.base, '파생어', '파생 규칙(' + cand.affix + ')', '규칙');
      }
    }

    return { query: q, routes, verdict: computeVerdict(routes, entries) };
  }

  const RELATION_RANK = { '표제어': 0, '굴절어': 1, '파생어': 2 };
  const LEVEL_RANK = { '초등': 0, '중등': 1, '고등': 2 };

  function emptyVerdict() {
    const blank = () => ({ modeA: null, modeB: null });
    return { '2015': blank(), '2022': blank() };
  }

  // 모드 A/B 별 포함 여부 + 급을 버전별로 계산.
  function computeVerdict(routes, entries) {
    const verdict = { '2015': { modeA: null, modeB: null }, '2022': { modeA: null, modeB: null } };
    for (const ver of ['2015', '2022']) {
      // 이 버전에 실제로 존재하는 표제어로 가는 경로만 유효
      const valid = routes
        .filter((r) => entries[r.headword] && entries[r.headword].forms[ver])
        .map((r) => ({ ...r, form: entries[r.headword].forms[ver] }));

      const forModeA = valid.filter((r) => r.relation === '표제어' || r.relation === '굴절어');
      const forModeB = valid; // 파생어까지 포함

      verdict[ver].modeA = pickBest(forModeA);
      verdict[ver].modeB = pickBest(forModeB);
    }
    return verdict;
  }

  // 여러 경로 중 대표 하나 선택: 관계 우선(표제어>굴절>파생), 그다음 급이 낮은(기초) 것.
  function pickBest(list) {
    if (!list.length) return null;
    const sorted = [...list].sort((a, b) => {
      const rr = RELATION_RANK[a.relation] - RELATION_RANK[b.relation];
      if (rr) return rr;
      return LEVEL_RANK[a.form.level] - LEVEL_RANK[b.form.level];
    });
    const best = sorted[0];
    return {
      covered: true,
      level: best.form.level,
      marker: best.form.marker,
      headword: best.headword,
      relation: best.relation,
      rule: best.rule,
      source: best.source,
      cefr: best.form.cefr,
      meaning: best.form.meaning,
      freqGrade: best.form.freqGrade,
    };
  }

  return { buildIndex, analyze, inflectedForms, inferPos, reverseInflectionCandidates, reverseDerivationCandidates };
});
