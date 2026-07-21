// prep/build-vocab.mjs
// 교육과정 어휘 CSV 두 개를 읽어 앱이 쓰는 vocab-data.js 를 생성한다.
// - curriculum_vocab.csv : 표제어 + level_marker(*/**/없음) + derivations(굴절+파생 혼재)
// - vocab_map.csv        : CEFR, 빈도, 한국어 뜻
// 무의존(Node 내장 모듈만). 실행: node prep/build-vocab.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

// --- 간단하고 견고한 CSV 파서 (따옴표 안의 콤마/줄바꿈 처리) ---
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  // BOM 제거
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\r') { /* 무시 */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function loadCsv(name) {
  const raw = readFileSync(join(__dir, 'source', name), 'utf8');
  const rows = parseCsv(raw);
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.length > 1).map((r) => {
    const o = {};
    header.forEach((h, i) => (o[h] = (r[i] ?? '').trim()));
    return o;
  });
}

// marker(*/**/없음) → 급 라벨
function markerToLevel(marker) {
  if (marker === '*') return '초등';
  if (marker === '**') return '중등';
  return '고등'; // 마커 없음
}

const vocab = loadCsv('curriculum_vocab.csv');
const map = loadCsv('vocab_map.csv');

// vocab_map: curriculum_vocab_id 기준으로 CEFR/빈도/뜻 인덱싱
const mapById = new Map();
for (const m of map) mapById.set(m.curriculum_vocab_id, m);

// 표제어(word) 기준으로 통합. 같은 word가 2015/2022 두 버전에 있을 수 있음.
/** entries[word] = { forms: {2015:{...},2022:{...}}, variants:[...] } */
const entries = {};

for (const v of vocab) {
  const word = v.word.toLowerCase().trim();
  if (!word) continue;
  const ver = v.curriculum_version || '2022';
  const info = mapById.get(v.id) || {};
  if (!entries[word]) entries[word] = { forms: {}, variants: [] };

  entries[word].forms[ver] = {
    marker: v.level_marker || '',
    level: markerToLevel(v.level_marker || ''),
    cefr: info.cefr || '',
    freqGrade: info.freq_grade || '',
    freqRank: info.freq_rank || '',
    meaning: info.meaning_ko || '',
  };

  // derivations 컬럼: 굴절어+파생어가 콤마로 나열됨 → 원형 변이형 목록으로 보존
  if (v.derivations) {
    for (const part of v.derivations.split(',')) {
      const w = part.toLowerCase().trim();
      if (w && !entries[word].variants.includes(w)) entries[word].variants.push(w);
    }
  }
}

// 통계
let n2015 = 0, n2022 = 0, withVar = 0;
for (const w in entries) {
  if (entries[w].forms['2015']) n2015++;
  if (entries[w].forms['2022']) n2022++;
  if (entries[w].variants.length) withVar++;
}

const out = {
  meta: {
    generated: process.env.WLSE_BUILD_DATE || '(build date)',
    source: 'Korea-curri-standards-db (교육부 별표3 기본 어휘)',
    note: 'marker: * = 초등 필수, ** = 중등 필수, 없음 = 고등',
    counts: { headwords: Object.keys(entries).length, in2015: n2015, in2022: n2022, withVariants: withVar },
  },
  entries,
};

const banner = '// 자동 생성 파일 — 직접 수정 금지. `node prep/build-vocab.mjs` 로 재생성.\n';
const js = banner + 'window.WLSE_VOCAB = ' + JSON.stringify(out) + ';\n';
writeFileSync(join(__dir, '..', 'vocab-data.js'), js, 'utf8');

// Node 테스트에서도 쓰도록 JSON 사본도 남김
writeFileSync(join(__dir, '..', 'vocab-data.json'), JSON.stringify(out), 'utf8');

console.log('vocab-data.js 생성 완료');
console.log(JSON.stringify(out.meta.counts, null, 2));
