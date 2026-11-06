// mascot.js — 화면별 마스코트 자리와 반응. 한 줄 = 화면 하나. 수치는 맨 위 상수에.
// 자리: [x, y, 지름px] (폰 기준, 왼쪽 위). 와이어프레임에 이미 있는 자리(로고·아바타·빈 아이콘)만 쓴다. hide = 그 자리에 있던 정적 요소 이름(마스코트가 대신하므로 숨김).
// 상태: COMET.plan 으로 보내는 상태 이름 (행성을 거쳐야 하면 알아서 끼움). expr = idle 표정. look = 시선 [x, y].
const MASCOT_SLOT = { logo: [107.5, 142.5, 174], avatar: [24, 168, 28], empty: [148.6, 275.6, 92.8], onboard: [160.2, 115.2, 69.6], dialTop: [163, 130, 64] /* 11-06 주형: 108 → 130 — 위 제목(프로덕트디자인4, 아래 끝 87)과 발산 방식 시트 위 끝(236) 사이 가운데(161.5) */, deckCorner: [332.5, 60, 36] };   // 11-05 진규: deckCorner 세로 44 → 60 (카드 덱 좌상단 닫기 ✕ 원과 가로 줄 맞춤) · 5판: V4 · 라이트 로고(120px)·빈 아이콘(64px)·온보딩 로고(48px)에 맞춤 (원 지름 = 칸 × 2/2.9)
const MASCOT = {   // 5판: 와이어프레임 V4 · 라이트 화면 이름
  "H1":    { slot: "logo", hide: ["LOGO · Comet"], state: "idle" },
  "OB-4":  { slot: "logo", hide: ["LOGO · Comet"], state: "idle", expr: "doubt" },
  "H2":    { slot: "avatar", hide: ["ai 아바타", "LOGO · Comet"], state: "answer", typing: true },
  "H6":    { slot: "avatar", hide: ["ai 아바타", "LOGO · Comet"], state: "answer", typing: true },
  "H7":    { slot: "avatar", hide: ["ai 아바타", "LOGO · Comet"], state: "answer", typing: true },
  "H8":    { slot: "avatar", hide: ["ai 아바타", "LOGO · Comet"], state: "answer", typing: true },
  "H11":   { slot: "avatar", hide: ["ai 아바타", "LOGO · Comet"], state: "answer", typing: true },
  "T4":    { slot: null },
  "R1":    { keep: true, look: [0, -.22], hide: ["LOGO · Comet"] }, "R1-1": { keep: true, hide: ["LOGO · Comet"] },                   // 시트 뒤, 시선 아래
  "H5-1":  { keep: true, hide: ["LOGO · Comet"] }, "H5-2": { slot: "onboard", hide: ["LOGO · Comet"], state: "idle", enter: "happy" },   // 11-03: 링크로 합류 시트 · 합류 완료 환영
  "H5":    { keep: true, hide: ["LOGO · Comet"] }, "H9": { keep: true, hide: ["LOGO · Comet"] }, "H10": { keep: true, hide: ["LOGO · Comet"] }, "M1": { keep: true, look: [-.25, 0], hide: ["LOGO · Comet"] },   // 5판: 시트 레이어에 딸려 오는 홈 로고는 숨김 (아래 화면의 마스코트와 겹침)
  "R2-6a": { slot: "logo", hide: ["LOGO · Comet"], state: "listen", look: [.28, .22] },
  "R2-6c": { slot: "logo", hide: ["LOGO · Comet", "녹음 알약", "녹음 점", "파형", "text:12:48"], state: "pulse", look: [.28, .22] },   // 정지 알약은 숨기고 record_pill.js 가 산 알약을 그린다. 7판: 녹음 중엔 3D 녹음 펄스(막대가 소리에 맞춰 출렁)
  "D1":    { slot: "logo", hide: ["LOGO · Comet"], state: "dots" },
  "D2":    { slot: "dialTop", state: "dots", look: [.2, -.3], front: true },     // front: 시트 dim 에 안 가림
  "D4":    { slot: "deckCorner", state: "idle" },
  "D5":    { slot: null },
  "D6":    { slot: "empty", hide: ["빈 아이콘 바탕", "icon pin"], state: "idle", enter: "shake", expr: "sad", exprAfter: 2100, tap: "shake" },   // 5판 피드백: 핀 아이콘 없애고 결과 없음처럼 도리도리
  "T8":    { slot: "empty", hide: ["빈 아이콘 바탕", "#866:4512"],   /* 빈 화면 돋보기만 (아래 바 돋보기는 그대로) */ state: "idle", enter: "shake", expr: "doubt", exprAfter: 2100, tap: "shake" },
  ...Object.fromEntries(["M3-N", "M3-G", "M3-K", "M3-L", "M3-MD", "M3-SL", "M4-GPT", "M4-CL", "M4-GE", "M4-PX", "M4-CP", "C-B-figma", "C-B-gcal", "C-B-slack", "C-B-gemini", "C-B-px", "C-B-copilot"].map(id => [id, { slot: null }])),   // 5판 추가 화면
  ...Object.fromEntries(["C-L-figma", "C-L-gcal", "C-L-slack", "C-L-gemini", "C-L-px", "C-L-copilot", "C-I-figma", "C-I-notion", "C-I-gdrive", "C-I-kakao", "C-I-gcal", "C-I-md", "C-I-slack", "C-I-ai"].map(id => [id, { keep: true }])),
  "OB-1":  { slot: "onboard", hide: ["LOGO · Comet"], state: "idle" },
  "OB-2":  { slot: "onboard", hide: ["LOGO · Comet"], state: "idle" },
  "OB-INV": { slot: "onboard", hide: ["LOGO · Comet"], state: "idle" },   // 티즈판: 온보딩 팀원 초대
  "OB-3":  { slot: "onboard", hide: ["LOGO · Comet"], state: "idle" },
  ...Object.fromEntries(["T1", "T2", "T2-E", "T9", "T9-E", "T3", "T3-E", "T2-1", "T2-1-E", "T5", "T6", "T7", "M2", "M2-1", "M2-2", "M3-C", "M3-D", "M4-A", "M5", "M5-2", "S0", "S1", "S2", "OB-3-1"].map(id => [id, { slot: null }])),
};
// 기다리는 장면 (와이어프레임엔 없음 → 도착 화면을 띄운 채 내용만 잠깐 비우고 마스코트가 메운다). 단위 ms.
const WAIT = {
  answer:   { hideSel: ".ans, .after", seq: [["think", 0], ["bulb", 1600], ["idle", 3500], ["answer", 3900]], typeAt: 4700, thinkHold: 500, bulbHold: 1100 },   // 4판: actions.typeAnswer 는 상태 도착 기준 — 생각중 0.5초 → 전구(삥) 1.1초 → 답변
  cards:    { seq: [["think", 0], ["bulb", 2200], ["idle", 4000]], dealAt: 4500, happyAt: 4900 },                            // 카드 뽑는 중 → 전구 → 카드 펼침 + 기쁨
  search:   { seq: [["magnify", 0], ["idle", 2600]], doneAt: 3000, hold: 1500 },                                                // 돋보기로 찾는 중 (4판: 돋보기가 된 뒤 1.5초 크게)
  record:   { seq: [["cloud", 0], ["idle", 3300]], doneAt: 6000 },                                              // 정리 중(생각구름) → 기록 상세 (11판: 구름 뒤 노란 기쁨 반응은 뺌)
  connect:  { seq: [["magnify", 0], ["idle", 1900]], happyAt: 3100 },                                                           // 연결 확인 중 → 기쁨
  invite:   { seq: [["message", 0], ["idle", 2200]], happyAt: 3400 },                                                           // 초대 보냄(메시지) → 기쁨
  topic:    { seq: [["bulb", 0], ["idle", 2000]], happyAt: 3200 },                                                              // 주제 정해짐(전구)
};
// 로고 어포던스(홈에서 '눌러서 발산'): 인사 뒤 HINT.first 초에 한 번, 그 뒤 HINT.gap 초마다. 뒤집기 없음 — 살짝 눌렸다 펴지며 탭 색 글로우 + 말풍선.
const HINT = { auto: false, first: .1, gap: [8, 12], press: .06, len: .9, bubble: "눌러서 발산", bubbleLen: 1.4,
  tease: { len: 2.0, mid: 1.38 } };   // 홈 티즈: 발산(슬라임 분화 3판) 시각 0 → mid(초) → 0 을 len 초 동안. 1.38 = 여섯 공으로 다 나뉘고 색이 들기 직전 (색은 1.40 부터: SPL.gooAt .60 + settle 1.05 - .25)
