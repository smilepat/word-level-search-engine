// grammar-engine.js — 문법 항목 검색 + 영어 예문 구조 탐지 (무의존, 순수 함수)
// 브라우저: window.WLSE_GRAMMAR_ENGINE / Node: module.exports
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WLSE_GRAMMAR_ENGINE = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 키워드/이름 검색: 한국어 구조명·영어명·키워드·예문에서 부분일치.
  function keywordSearch(query, data) {
    const q = String(query || '').toLowerCase().trim();
    if (!q) return [];
    const scored = [];
    for (const it of data.items) {
      let score = 0;
      const ko = it.ko.toLowerCase();
      const en = it.en.toLowerCase();
      const ex = it.ex.toLowerCase();
      const kws = (it.kw || []).map((k) => k.toLowerCase());
      if (ko === q || kws.includes(q)) score += 100;      // 정확 일치
      if (ko.includes(q)) score += 40;                     // 구조명 부분일치
      if (kws.some((k) => k.includes(q) || q.includes(k))) score += 30; // 키워드
      if (en.includes(q)) score += 20;                     // 영어명
      if (ex.includes(q)) score += 8;                      // 예문
      if (score > 0) scored.push({ item: it, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.item);
  }

  // 영어 예문에서 문법 구조를 규칙(정규식)으로 탐지. 개략적이며 오탐 가능.
  // 각 규칙: {id, test} — id 는 grammar-data 의 item.id 와 매칭.
  const RULES = [
    { id: 'GR-2015-025', re: /\bif\b[^.?!]*\b(would|could|might|were)\b/i },   // 가정법 과거
    { id: 'GR-2015-009', re: /\b(has|have)\b\s+(\w+ed|been|done|gone|seen|arrived|written|made|come|taken)\b/i }, // 현재완료
    { id: 'GR-2015-028', re: /\b(was|were)\b\s+\w+ing\b/i },                    // 과거진행
    { id: 'GR-2015-008', re: /\b(am|is|are)\b\s+\w+ing\b/i },                    // 현재진행
    { id: 'GR-2015-040', re: /\b(is|are|was|were|been|be)\b\s+\w+(ed|en)\b\s+by\b/i }, // 수동태(by)
    { id: 'GR-2015-030', re: /\b(who|which|whom|whose)\b/i },                    // 관계대명사
    { id: 'GR-2015-032', re: /^\s*\w+ing\b[^,.?!]*,/i },                         // 분사구문(문두 -ing절)
    { id: 'GR-2015-036', re: /\bthere\s+(is|are|was|were)\b/i },                 // There is/are
    { id: 'GR-2015-014', re: /\bthe\s+\w+est\b/i },                              // 최상급
    { id: 'GR-2015-013', re: /\b\w+er\s+than\b/i },                              // 비교급
    { id: 'GR-2015-012', re: /\bas\s+\w+\s+as\b/i },                             // 원급 as~as
    { id: 'GR-2015-024', re: /\bif\b(?![^.?!]*\b(would|could|might)\b)/i },       // 조건절(현재) — would 없으면
    { id: 'GR-2015-023', re: /\b(know|wonder|ask|tell|see)\b[^.?!]*\b(where|what|why|how|who|when|whether)\b/i }, // 간접의문문
    { id: 'GR-2015-035', re: /^\s*(down|up|here|there|never|seldom|rarely|only)\b[^,]*\b(came|goes|is|are|was|were|comes)\b/i }, // 도치
    { id: 'GR-2015-015', re: /\b(make|makes|made|let|lets|have|has|had)\b\s+\w+\s+(\w+)\b/i }, // 사역(약한 신호)
    { id: 'GR-2015-007', re: /\b\w+s\b\s+(to|at|in|on|every|the)\b/i },          // 현재시제(약한 신호)
  ];

  function detectFromSentence(query, data) {
    const s = String(query || '').trim();
    // 문장으로 볼 조건: 라틴 문자 + 공백(두 단어 이상)
    if (!/[a-zA-Z]/.test(s) || !/\s/.test(s)) return [];
    const byId = {};
    for (const it of data.items) byId[it.id] = it;
    const hits = [];
    const seen = new Set();
    for (const r of RULES) {
      if (r.re.test(s) && byId[r.id] && !seen.has(r.id)) {
        seen.add(r.id);
        hits.push(byId[r.id]);
      }
    }
    return hits;
  }

  // 통합 분석: 키워드 검색 + (문장이면) 예문 구조 탐지
  function analyze(query, data) {
    return {
      query: String(query || '').trim(),
      sentenceHits: detectFromSentence(query, data),
      keywordHits: keywordSearch(query, data),
    };
  }

  // 급별로 항목을 묶어 반환 (전체 표 브라우징용)
  function groupByBand(data) {
    const g = { 초: [], 중: [], 고: [] };
    for (const it of data.items) (g[it.band] || (g[it.band] = [])).push(it);
    return g;
  }

  return { analyze, keywordSearch, detectFromSentence, groupByBand };
});
