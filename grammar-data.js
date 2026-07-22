// grammar-data.js — 문법 항목 초/중/고 개략 분류 데이터 (큐레이션)
//
// ⚠️ 중요: 2015 별표4(언어 형식)는 문법 40개를 예문과 함께 "나열만" 하며,
//    2022 성취기준의 grammar_elements 컬럼은 비어 있어 문법↔급 자동 연계가 불가능하다.
//    따라서 아래 급 분류는 표준 한국 EFL 교과 순서 + 교육학 판단에 근거한 "개략 추정"이며,
//    공식 정답표가 아니다. Pat 검수·수정을 전제로 한 초안이다.
//
// 이원 분류 (Pat 지침):
//   - intro   = 도입급: 의사소통 표현으로 처음 노출되는 학년(덩어리·표현 중심)
//   - explicit= 어법 출제 적절급: 규칙을 명시적으로 가르치고 어법 문항으로 물어도 되는 학년
//   예) 과거시제: intro 초5-6(규칙+고빈도 불규칙, 표현 중심) / explicit 중1+(체계적 어법)
//
// band = 대표 급(초/중/고) — 문항 제작 기준이라 explicit 을 따른다.
(function (root, factory) {
  const d = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = d;
  else root.WLSE_GRAMMAR = d;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 급 순위(정렬·비교용): 초3-4 < 초5-6 < 중1-3 < 고
  const LEVELS = ['초3-4', '초5-6', '중1-3', '고'];

  // band(초/중/고)는 explicit 앞글자로 자동 도출
  function bandOf(explicit) {
    if (explicit.startsWith('초')) return '초';
    if (explicit.startsWith('중')) return '중';
    return '고';
  }

  // 별표4 40개 문법 구조 (예문에서 구조명 부여)
  const raw = [
    { id: 'GR-2015-001', ex: 'Kate is from London.', ko: 'be동사 현재형', en: 'be-verb (present)', intro: '초3-4', explicit: '초5-6', kw: ['be', 'is', 'am', 'are', 'be동사'] },
    { id: 'GR-2015-020', ex: 'I am not tired.', ko: 'be동사 부정문', en: 'negation of be-verb', intro: '초3-4', explicit: '초5-6', kw: ['be동사', '부정', 'not', 'am not'] },
    { id: 'GR-2015-021', ex: 'Are you ready?', ko: 'be동사 의문문', en: 'yes/no question with be', intro: '초3-4', explicit: '초5-6', kw: ['be동사', '의문문', 'are you'] },
    { id: 'GR-2015-003', ex: 'A lion is brave.', ko: 'be동사 + 형용사 보어', en: 'be + adjective complement', intro: '초3-4', explicit: '초5-6', kw: ['형용사', '보어', 'be'] },
    { id: 'GR-2015-019', ex: 'John and Mary are good friends.', ko: '등위 주어 + 수 일치', en: 'compound subject / agreement', intro: '초3-4', explicit: '초5-6', kw: ['and', '주어', '수일치', '복수'] },
    { id: 'GR-2015-006', ex: "It's cold outside.", ko: '비인칭 주어 it (날씨)', en: 'impersonal "it"', intro: '초3-4', explicit: '초5-6', kw: ['it', '비인칭', '날씨', '가주어'] },
    { id: 'GR-2015-007', ex: 'He walks to school every day.', ko: '현재시제 (습관)', en: 'simple present (habit)', intro: '초3-4', explicit: '초5-6', kw: ['현재시제', '습관', '3인칭', '-s'] },
    { id: 'GR-2015-008', ex: 'He is sleeping now.', ko: '현재진행형', en: 'present progressive', intro: '초3-4', explicit: '초5-6', kw: ['현재진행', 'ing', 'be+ing'] },
    { id: 'GR-2015-026', ex: 'Can we sit down in here?', ko: '조동사 can', en: 'modal "can"', intro: '초3-4', explicit: '초5-6', kw: ['조동사', 'can', '가능'] },
    { id: 'GR-2015-027', ex: 'Andy plays the guitar, and his sister plays the piano.', ko: '등위접속사 and', en: 'coordinating conjunction', intro: '초3-4', explicit: '초5-6', kw: ['and', '등위접속사', '접속사'] },
    { id: 'GR-2015-036', ex: 'There are two books on the desk.', ko: 'There is/are 구문', en: 'existential there', intro: '초3-4', explicit: '초5-6', kw: ['there is', 'there are', '존재'] },

    { id: 'GR-2015-010', ex: 'The baby cried.', ko: '과거시제 (규칙·불규칙)', en: 'simple past', intro: '초5-6', explicit: '중1-3', kw: ['과거시제', '-ed', 'past', '불규칙'], note: '초5-6 도입(표현 중심)이나 규칙·불규칙 전반의 어법 문항은 중1+가 적절.' },
    { id: 'GR-2015-013', ex: 'Mary is taller than I/me.', ko: '비교급 (-er than)', en: 'comparative', intro: '초5-6', explicit: '중1-3', kw: ['비교급', 'than', '-er', 'more'] },
    { id: 'GR-2015-004', ex: 'Which do you like better, this or that?', ko: '선택의문문', en: 'alternative question', intro: '초5-6', explicit: '중1-3', kw: ['선택의문문', 'which', 'or', 'better'] },
    { id: 'GR-2015-012', ex: 'She is as tall as her mother (is).', ko: '원급 비교 (as ~ as)', en: 'equative as...as', intro: '중1-3', explicit: '중1-3', kw: ['원급', 'as as', '동등비교'] },
    { id: 'GR-2015-014', ex: 'Cindy is the shortest of the three.', ko: '최상급', en: 'superlative', intro: '중1-3', explicit: '중1-3', kw: ['최상급', 'est', 'most', 'the'] },
    { id: 'GR-2015-009', ex: 'The train has arrived.', ko: '현재완료', en: 'present perfect', intro: '중1-3', explicit: '중1-3', kw: ['현재완료', 'has', 'have', 'p.p.', '완료'] },
    { id: 'GR-2015-040', ex: 'The novel was written by Mark Twain.', ko: '수동태', en: 'passive voice', intro: '중1-3', explicit: '중1-3', kw: ['수동태', 'be p.p.', 'by', 'was written'] },
    { id: 'GR-2015-002', ex: 'The store is closed.', ko: '상태 수동 (be + p.p.)', en: 'stative passive', intro: '중1-3', explicit: '중1-3', kw: ['수동', 'be p.p.', 'closed', '상태'] },
    { id: 'GR-2015-015', ex: 'I made him carry the box.', ko: '사역동사 (make/have/let)', en: 'causative verb', intro: '중1-3', explicit: '중1-3', kw: ['사역동사', 'make', 'let', 'have', '원형부정사'] },
    { id: 'GR-2015-016', ex: 'To see is to believe.', ko: 'to부정사 (주어·보어)', en: 'to-infinitive (subject/complement)', intro: '중1-3', explicit: '중1-3', kw: ['to부정사', 'to', '부정사', '명사적'] },
    { id: 'GR-2015-017', ex: 'Mike is slow to react.', ko: 'to부정사 (부사적·형용사 수식)', en: 'to-infinitive (adverbial)', intro: '중1-3', explicit: '중1-3', kw: ['to부정사', '부사적', 'to'] },
    { id: 'GR-2015-018', ex: 'Playing baseball is fun.', ko: '동명사 (주어)', en: 'gerund as subject', intro: '중1-3', explicit: '중1-3', kw: ['동명사', 'ing', '주어'] },
    { id: 'GR-2015-023', ex: "I don't know where he lives.", ko: '간접의문문', en: 'embedded question', intro: '중1-3', explicit: '중1-3', kw: ['간접의문문', 'where', '의문사', '어순'] },
    { id: 'GR-2015-024', ex: 'If oil is mixed with water, it floats.', ko: '조건절 (현재·진리)', en: 'zero/first conditional', intro: '중1-3', explicit: '중1-3', kw: ['조건절', 'if', '가정', '현재'] },
    { id: 'GR-2015-028', ex: 'When we arrived, she was talking on the phone.', ko: '과거진행 + 시간부사절', en: 'past progressive + time clause', intro: '중1-3', explicit: '중1-3', kw: ['과거진행', 'when', 'was ing', '시간부사절'] },
    { id: 'GR-2015-030', ex: 'The girl who is playing the piano is called Ann.', ko: '관계대명사 (주격)', en: 'relative pronoun (subject)', intro: '중1-3', explicit: '중1-3', kw: ['관계대명사', 'who', 'which', 'that', '관계사'] },
    { id: 'GR-2015-031', ex: 'Something strange happened last night.', ko: '-thing + 형용사 후치수식', en: 'post-modification of -thing', intro: '중1-3', explicit: '중1-3', kw: ['something', '형용사', '후치수식', '-thing'] },
    { id: 'GR-2015-034', ex: "My brother was wearing a raincoat and (he) didn't get wet.", ko: '등위절 + 주어 생략', en: 'ellipsis in coordination', intro: '중1-3', explicit: '중1-3', kw: ['생략', '등위', 'and', '과거진행'] },
    { id: 'GR-2015-037', ex: "Won't you try again? - Yes, I will try again.", ko: '부정의문문 + 응답', en: 'negative question', intro: '중1-3', explicit: '중1-3', kw: ['부정의문문', "won't", '응답'] },
    { id: 'GR-2015-005', ex: "I don't like the black coat, but I like the brown one.", ko: '부정대명사 one', en: 'indefinite pronoun "one"', intro: '중1-3', explicit: '중1-3', kw: ['one', '부정대명사', '대명사'] },
    { id: 'GR-2015-011', ex: 'Is the room warm enough?', ko: 'enough (후치 수식)', en: 'enough post-modifier', intro: '중1-3', explicit: '중1-3', kw: ['enough', '정도', '후치'] },
    { id: 'GR-2015-038', ex: 'It is important to protect our environment.', ko: '가주어 it + to부정사', en: 'anticipatory "it"', intro: '중1-3', explicit: '중1-3', kw: ['가주어', 'it', 'to부정사', '진주어'] },
    { id: 'GR-2015-022', ex: 'She said, "I will help you."', ko: '직접화법', en: 'direct speech', intro: '중1-3', explicit: '중1-3', kw: ['직접화법', 'said', '인용', '화법'] },
    { id: 'GR-2015-029', ex: 'The cell phone is thin and light. Therefore, it is very convenient to carry around.', ko: '접속부사 (therefore)', en: 'conjunctive adverb', intro: '중1-3', explicit: '고', kw: ['접속부사', 'therefore', '담화표지', 'however'], note: '문장 연결은 중등에 노출되나, 담화 응집장치로서의 명시적 어법·독해 활용은 고등이 적절.' },

    { id: 'GR-2015-025', ex: 'If Joe had time, he would go to Spain.', ko: '가정법 과거', en: 'second conditional (subjunctive)', intro: '고', explicit: '고', kw: ['가정법', 'if', 'would', 'had', '가정법과거'] },
    { id: 'GR-2015-032', ex: 'Walking along the street, I met an old friend.', ko: '분사구문', en: 'participial construction', intro: '고', explicit: '고', kw: ['분사구문', 'ing', '분사', 'walking'] },
    { id: 'GR-2015-035', ex: 'Down came the rain.', ko: '도치', en: 'inversion', intro: '고', explicit: '고', kw: ['도치', 'inversion', '어순'] },
    { id: 'GR-2015-033', ex: "Personally, I don't like his paintings.", ko: '문장부사', en: 'sentence adverb', intro: '고', explicit: '고', kw: ['문장부사', 'personally', '담화'] },
    { id: 'GR-2015-039', ex: 'Ms. Pova, a famous tennis player, will be visiting us at the gym tomorrow.', ko: '동격 + 미래진행', en: 'apposition + future progressive', intro: '고', explicit: '고', kw: ['동격', '미래진행', 'apposition', 'will be ing'] },
  ];

  const items = raw.map((it) => ({
    ...it,
    band: bandOf(it.explicit),
    note: it.note || '',
    kw: it.kw || [],
  }));

  return {
    meta: {
      source: 'Korea-curri-standards-db 별표4(언어 형식) 40개 예문 + 교육학 판단',
      caveat: '급 분류는 개략 추정이며 공식 정답표 아님. Pat 검수·수정 대상.',
      levels: LEVELS,
      generated: '2026-07-22',
    },
    items,
    LEVELS,
    bandOf,
  };
});
