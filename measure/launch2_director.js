// ========== 런처(launch2.html 전용): 앱 실행 → 홈 → 발산/수렴을 검은 덩어리 하나로 묶는다 (진규씨 11-02 밤 순서) ==========
// 실행: 검은 화면 → 흰 눈이 먼저 뜸 → 검정이 눈 둘레로 빨려 들어가 검은 공 → 띠 열려 행성 → 홈 글 → 인사.
// 발산(탭): 눈 감고 띠 닫혀 검은 공 → 공의 검정이 작은 원에서 화면 가득 커짐(알약처럼 한 덩어리로, 앞머리가 지나는 글자부터 발산 화면 글로 바뀜) → 흰 눈이 다시 뜸 → 눈 뒤에서 발산 무늬가 피어남.
// 수렴(탭): 무늬가 눈 뒤로 줄어듦 → 눈 감음 → 검정이 공으로 돌아옴(앞머리가 지나는 글자부터 홈 글로) → 띠 열림 → 눈 뜸.
// 색: 상태별 눈 색 + 가장자리 글로우 (color_lab C안, 흰 배경 기준). 발산 화면은 피그마 "10-30일 최종 › D1_발산 시작" 레이아웃.
// 마스코트는 엔진(comet5_part2) 상태 idle/diverge 가 그리고, 여기서는 검은 덩어리(#mass)·색·화면 글만 같은 시각표에 맞춘다.
const PHW = 390, PHH = 844, STG = { x: 107.5, y: 142.5, w: 174 };   // 5판: V4 · 라이트 로고 자리 (원 지름 120px, 중심 194.5, 229.5)
const DISC = STG.w / 2.9 * 2;                                   // 행성 지름(px)
const MCX = STG.x + STG.w / 2, MCY = STG.y + STG.w / 2;
const RMAX = Math.hypot(Math.max(MCX, PHW - MCX), Math.max(MCY, PHH - MCY)) + 8;   // 화면 모서리까지
const easeIO = bez(.65, 0, .35, 1);
// 11판: 흰 화면. 실행 = 슬라임 분화 3판의 수렴 끝과 같은 문법 — 검은 공이 점에서 스프링으로 커짐(띠 닫힘·눈 없음) → 띠가 스프링으로 열림(.45) → 눈이 세로로 자라나며 뜸(.30) → 홈 글
// 12판(주형 실행 장면으로 교체 · 진규 11판 메모 '입장 애니메이션은 주형 것으로 교체 예정'): 검은 화면 → 흰 눈 → 끔뻑끔뻑 → Comet 로고타입 + 눈 왼→오→왼 → 검정이 공으로 → 띠 열림 → 눈알 톡 → 홈 글
const L = { lineIn: .30, lineLen: .38, eyeOpen: .78, eyeLen: .20, blinkAt: 1.08, suckAt: 1.32, suckLen: .62, land: 1.94, openAt: 2.02, openRamp: .42, ui: [2.40, 2.47, 2.54, 2.61, 2.68, 2.75, 2.82], uiLen: .5, uiDY: 14, pupilAt: 2.52, pupilRamp: .32, greet: 3.35 };   // 4판: 눈이 선으로 그어진 뒤 깜빡 뜨고, 공이 된 다음에야 줄무늬, 줄무늬가 다 열린 뒤 홈 글
// 티즈판(11-04 주형): 검은 화면 → 흰 눈 → 끔뻑끔뻑 → 'Comet' 로고가 딱 떴다 사라짐 → 검정이 동그라미로 빨려 들어 마스코트 실루엣.
// 로고 구간만큼 뒤(빨려 듦·줄무늬·홈 글·눈알)를 통째로 민다
const LOGO = { blink2: 1.36, at: 1.62, in: .20, hold: .55, out: 0, fade: .45, y: 300, dy: 8, gap: 0,   // 13판: 로고가 흐려지기 시작하면 곧바로 검정도 빨려 들기 시작(out·gap 0) — 로고가 .45초 동안 흐려지는 사이 검정이 빨려 듦
  look: { yaw: .7, go: .32, back: .32 } };   // 로고가 뜨는 동안 눈: 왼쪽(제자리) → 오른쪽 대칭 자리(yaw .7 ≈ 가운데에서 +19px) → 다시 왼쪽. 그 뒤 검정이 빨려 듦
// 13판 값 출처: 피그마 'Lilguy 눈 (공부용)'(BPnM6… 618:248) — LOOI 노트 639:412~416, 변신 노트 814:289 · 822:289
const blinkQ = (u) => blinkCurve(u, .067, .10, .067);   // 끔뻑 = LOOI 깜빡임 233ms (닫힘 67 · 유지 100 · 열림 67). 예전엔 감기·뜨기가 같은 사인 .22초, 감은 채 머묾 없음
const EYE_POP = { up: .10, hold: .25, settle: .40 };    // 눈 두 박자 = 변신 노트 814:285 '크게 떴다가 0.25초 뒤 좁혀짐'. 크게 뜨기는 LOOI 표정 진입 곡선(EXPRESS), 돌아오기는 LOOI 기본 복귀 곡선
const EASE_BACK = bez(.37, 0, .63, 1);                   // LOOI 기본 복귀 cubic-bezier(.37,0,.63,1) · 400~767ms
{ const SHIFT = LOGO.at + LOGO.in + LOGO.hold + LOGO.out + LOGO.gap - L.suckAt;
  for (const k of ["suckAt", "land", "openAt", "pupilAt", "greet"]) L[k] += SHIFT; L.ui = L.ui.map(x => x + SHIFT); }
const logoEl = document.createElement("div"); logoEl.id = "launchLogo"; logoEl.setAttribute("aria-hidden", "true");
logoEl.innerHTML = '<span>Comet</span>';   // 로고타입만 (혜성 아이콘 시그니처는 뺌)
logoEl.style.cssText = `position:absolute;left:0;right:0;top:${LOGO.y}px;display:flex;align-items:center;justify-content:center;gap:8px;z-index:7;pointer-events:none;opacity:0;color:#fff;font:700 30px/1 "Pretendard Variable",Pretendard,-apple-system,"Noto Sans KR",sans-serif;letter-spacing:-.02em`;
$("phone").appendChild(logoEl);
function launchEyeYaw(ts) {   // 0 → yaw → 0. 로고 들어올 때 오른쪽으로, 로고가 풀리기 직전 왼쪽으로 돌아와 빨려 들기 전에 제자리
  // 13판 완급: 예전엔 sm .32초로 고르게 갔다 옴 → 갈 땐 Lilguy 둘러보기처럼 1차 지연(τ .09초: 휙 가서 스르륵 멈춤), 돌아올 땐 LOOI 되돌림 400ms · 복귀 곡선
  const a = LOGO.at, b = LOGO.at + LOGO.in + LOGO.hold - .05, Y = LOGO.look.yaw;
  return Y * ((ts > a ? 1 - Math.exp(-(ts - a) / .09) : 0) - EASE_BACK((ts - b) / .40));
}
function launchLogo(ts) {   // 들어올 땐 살짝 커지며(.94 → 1) 톡
  // 13판: 나갈 땐 .22초 동안 8px 위로 흐려지던 것 → 제자리에서 그냥 부드럽게 흐려짐(움직임 없음, .45초). 줄어드는 검정 테두리가 글씨 자리에 닿기(약 .5초) 전에 다 사라짐
  const a = LOGO.at, b = a + LOGO.in + LOGO.hold, kIn = EASE_OUT_QUINT((ts - a) / LOGO.in), kOut = ts < b ? 0 : sm((ts - b) / LOGO.fade);
  logoEl.style.opacity = (ts < a ? 0 : kIn * (1 - kOut)).toFixed(3);
  logoEl.style.transform = `scale(${(.94 + .06 * kIn).toFixed(4)})`;
}
// 11-03: 검은 화면에서는 몸이 없고 흰 눈만 (예전엔 몸이 반전돼 흰 공으로 보였다). 검정이 공으로 모이면 그게 몸, 줄무늬가 열린 뒤 눈알이 생긴다
// 11-03 발산: 눈 감고 줄무늬 닫혀 검은 공(pre) → 공에서 검정이 화면으로 펼쳐짐(몸은 숨겨 검정과 한 덩어리) → 눈 뒤에서 무늬가 피어남 → 눈 뜸
// 11-03 수렴: 눈 감고 무늬가 눈 뒤로 줄어듦 → 검정이 공으로 빨려 들어감 → 검은 공 → 줄무늬 열림 → 눈 뜸 (줄무늬·눈 뜸은 엔진 FROM_PAT)
const MASS_ON = { pre: .22, growAt: .24, growRamp: .50, bloomAt: .82, bloomRamp: .40 };
const MASS_OFF = { shrinkPat: .22, shrinkAt: .30, shrinkRamp: .46 };
const mass = $("mass"), glow = $("glow"), ups = [...document.querySelectorAll("#app .up")], dels = [...document.querySelectorAll("#appD .el")];
// 글자마다 마스코트 중심에서의 거리: 검은 원 앞머리가 그 자리를 지날 때 바뀐다
const dOf = (el) => { const r = el.getBoundingClientRect(), ph = $("phone").getBoundingClientRect(); const cx = r.left - ph.left + r.width / 2, cy = r.top - ph.top + r.height / 2; return Math.hypot(cx - MCX, cy - MCY); };
let DU = null, DD = null; function measure() { DU = ups.map(dOf); DD = dels.map(dOf); }
const dtaps = []; let DSEG = [];
function buildD() { DSEG = []; let on = null, last = -9; for (const x of dtaps.slice().sort((a, b) => a - b)) { if (x - last < 2.0 || x < L.land + .6) continue; last = x; if (on === null) on = x; else { DSEG.push({ on, off: x }); on = null; } } if (on !== null) DSEG.push({ on, off: Infinity }); }
function dmode(t) { for (const s of DSEG) if (t >= s.on && t < s.off + SLIME.MRG.len + .05) return { u: t - s.on, uo: t >= s.off ? t - s.off : -1 }; return null; }   // 11판: 수렴 = 슬라임 수렴 길이만큼
// 8판: 발산 화면 마스코트 = '곡률 분화 2판'(diverge_geo.html, 원본 lab/diverge/geo_split). 검정이 다 펼쳐지면(bloomAt) 검은 공에서 여섯 조각으로 갈라져 돈다.
// 수렴은 조각이 먼저 검은 공으로 모이고(GEO_MERGE 초) 그다음 원래 수렴(검정이 공으로 → 줄무늬 → 눈 뜸). 마스코트 자리에 투명하게 겹쳐 발산 화면의 반전을 그대로 받는다.
// 곡률 분화 셰이더가 아직 준비 안 됐으면 예전처럼 엔진 구슬(dots)이 피어난다.
// 11판: 발산 화면 마스코트 = 슬라임 분화 3판(diverge_slime.js). 검은 원 없음 — 흰 화면 그대로, 탭하면 엔진 행성을 슬라임이 같은 자리·같은 자전 각에서 이어받아 갈라진다.
let geoOn = false;
const GEO_TEXT = { after: 1.2, len: .45, out: .55 };   // 11-05 진규: 1.6 · .5 → 1.2 · .45 — 홈 글이 사라진 뒤 발산 글까지 1초 비어 있었음(공은 1.3초쯤 자리 잡음)   // 11-04: 사라짐도 나타남만큼   // 발산 글씨: 공들이 궤도에 앉은 뒤(분화 1.6초) 0.5초에 걸쳐 나타남 · 수렴 땐 0.25초에 먼저 사라짐
const HOME_TEXT = { out: .35 };   // 11-05 진규: .6 → .35 (주석대로) — 홈 글이 검은 원과 같이 오래 남아 발산 글과 겹쳐 보였음                     // 홈 글: 탭하면 0.35초에 사라지고, 수렴이 끝날 때 다시 나타남
const GEO_TEXT_DY = 52;   // 11-06 진규: 40 → 52 — 제목 위 설명 글(홈과 같은 순서)을 다시 보이게 하니 맨 아래 공과 6px 밖에 안 떨어져서   // D1 제목 세 줄(y 318~403)을 이만큼 내려 궤도 아래쪽 공과 안 겹치게
let geoTextEls = null;
function geoTexts(k) {   // D1 화면 조각의 제목 세 줄: 글씨 세기 k (null = 원래대로)
  if (!geoTextEls) { const f = typeof COMET !== "undefined" && COMET.SCR && COMET.SCR.D1 && COMET.SCR.D1.fig; if (!f) return; geoTextEls = [...f.querySelectorAll("p")].filter(p => /^(기쁨을 주는|출근길 낯선|10\.27 ·)/.test(p.textContent.trim())); }
  for (const p of geoTextEls) {   // 가운데 정렬(translate -50%)을 건드리지 않게 top 으로 내린다
    if (p.dataset.top0 === undefined) p.dataset.top0 = parseFloat(p.style.top) || p.offsetTop;
    p.style.opacity = k === null ? "" : k.toFixed(3); p.style.top = (+p.dataset.top0 + (k === null ? 0 : GEO_TEXT_DY + (1 - k) * 8)).toFixed(1) + "px"; }
}
function showGeo(on) { for (const b of [$("svg"), $("svgE"), $("gl")]) b.style.opacity = on ? "0" : ""; }   // 슬라임이 그리는 동안 엔진 몸·눈은 숨김
let greeted = false, lastMode = null;
function setMass(r, squash) {   // 반지름 r 인 원 (마스코트 중심). squash: 가로로 눌림(+) / 세로로 늘어남(-)
  mass.style.display = "block";
  mass.style.width = mass.style.height = (2 * r).toFixed(1) + "px";
  mass.style.transform = `translate(${(MCX - r).toFixed(1)}px, ${(MCY - r).toFixed(1)}px) scale(${(1 + squash).toFixed(4)}, ${(1 - squash).toFixed(4)})`;
}
function setInvert(on) { document.documentElement.classList.toggle("inv", on); }
// ---------- 색: 상태·반응·인터랙션마다 다르게. 방식 A = 눈만 / B = 가장자리 글로우만 / C = 둘 다 (color_lab 의 A·B·C, 흰 배경 기준) ----------
// 눈은 SVG 그라데이션 id(두 색) 또는 단색. 글로우는 네 색 회전. 반응(기쁨·놀람·하트·도리도리·탭)은 짧게 켜졌다 사라진다
const COLORS = {
  idle:     { eye: null, g: null },
  listen:   { eye: "#4F9BC4", g: ["#4F9BC4", "#7FC4E0", "#5B8FD0", "#9ED0EA"] },                 // 차가운 하늘색: 받아들이는 방향
  pulse:    { eye: "#F0532C", g: ["#F0532C", "#FF9A7A", "#F26A48", "#FFC2AE"], tint: 0 },         // 7판: 녹음 중 — 눈만 녹음 알약과 같은 빨강, 몸은 순검정(물들면 갈색으로 탁해짐)
  think:    { eye: "#7A6CC8", g: ["#5A4FB8", "#7A6CC8", "#4A5EC0", "#8E7FD8"] },                 // 남보라: 안으로 모으는 방향
  answer:   { eye: "#E8A85C", g: ["#E8A85C", "#FFD9A2", "#F0B070", "#FFE6BE"] },                 // 호박색: 내보내는 방향
  diverge:  { eye: "url(#eyeGrad)", g: ["#5FA8E8", "#B77DD0", "#E87A8C", "#E8B060"] },           // 네 색 같이: 퍼지는 방향
  dots:     { eye: "url(#eyeGrad)", g: ["#5FA8E8", "#B77DD0", "#E87A8C", "#E8B060"] },           // 7판: 발산 구슬 — 발산과 같은 네 색
  happy:    { eye: "#F2B54A", g: ["#F2B54A", "#FFD98A", "#F7C66A", "#FFE6B0"], len: 1.6 },       // 따뜻한 노랑
  surprise: { eye: "#FFD166", g: null, len: .9, flash: 1 },   // 한 번 번쩍 (흰 바탕에 흰 글로우는 안 보이고 뿌옇기만 해서 뺌)
  heart:    { eye: "#F06A8C", g: ["#F06A8C", "#FFB3C6", "#F28CA6", "#FFD1DC"], len: 1.9 },       // 분홍
  shake:    { eye: "#8FA3B8", g: null, len: 1.2 },       // 식은 회청: 아니오 (글로우는 '틀렸다' 경고처럼 보여서 뺌)
  tap:      { eye: "#4F9BC4", g: null, len: .5, flash: 1 },   // 누른 순간 한 번 (매번 테두리가 번쩍이면 산만해서 눈만)
};
let colorVar = "C", reactColor = null;   // 방식 A/B/C, 반응 색 { name, t0 }
let colorCur = "idle", colorK = 1;
const BODY_TINT = .24;   // 몸이 상태·반응 색 쪽으로 물드는 정도 (0 = 검정 그대로)
const hex3 = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function bodyTint(name, k) {   // 몸 색: 검정(#0B0B0B)에서 눈 색 쪽으로 살짝. 발산은 네 색 평균
  const c = COLORS[name], base = [11, 11, 11];
  const src = name === "diverge" ? [154, 148, 171] : c && c.eye && c.eye.startsWith("#") ? hex3(c.eye) : null;
  const w = src ? (c && c.tint !== undefined ? c.tint : BODY_TINT) * k : 0, rgb = base.map((v, i) => Math.round(v + (src ? (src[i] - v) * w : 0)));
  $("stage").style.setProperty("--ink", `rgb(${rgb.join(",")})`); window.__ink = rgb.map(v => v / 255);
}
function setColor(name, k) {   // k: 0 → 1 (세기)
  const c = COLORS[name] || COLORS.idle, useEye = colorVar !== "B", useGlow = colorVar !== "A";
  bodyTint(name, k);
  $("stage").style.setProperty("--eye", useEye && c.eye ? c.eye : "var(--bg)");
  if (useGlow && c.g) { glow.style.setProperty("--g1", c.g[0]); glow.style.setProperty("--g2", c.g[1]); glow.style.setProperty("--g3", c.g[2]); glow.style.setProperty("--g4", c.g[3]); glow.style.opacity = (.9 * k).toFixed(3); }
  else glow.style.opacity = "0";
  if (useEye && c.eye) { const gr = $("eyeGrad"); const st = name === "diverge" ? ["#5FA8E8", "#B77DD0", "#E87A8C", "#E8B060"] : [c.eye, c.eye, c.g ? c.g[1] : c.eye, c.g ? c.g[1] : c.eye]; if (gr) st.forEach((col, i) => gr.children[i].setAttribute("stop-color", col)); $("stage").style.setProperty("--eye", "url(#eyeGrad)"); }
}
function director(ts, te) {
  launchLogo(ts < L.land ? ts : 99);   // 12판: 실행 중에만
  window.__ext.yaw = ts < L.land ? launchEyeYaw(ts) : 0;   // 13판: 로고가 머문 뒤 곧바로 검정이 빨려 들어서 눈이 돌아오는 .4초가 빨려 드는 동안에 걸림 → 공이 될 때까지 (suckAt 에서 끊으면 눈이 툭 튐)
  if (!DU) measure();
  const X = window.__ext, md = dmode(ts), st = __m.state();
  let textK = null, homeK = 1;   // 발산 화면 글 세기 · 홈 글 세기 (11판: 검은 원 앞머리 대신 시간으로)
  mass.style.display = "none"; setInvert(false);   // 11판: 검은 화면 없음
  const ex = $("svgE").style;
  if (ts < L.land) {   // 실행: 눈이 먼저 뜨고, 검정이 눈 둘레로 빨려 들어가 공이 된다 (닿기 직전 가로로 눌림)
    const k = easeIO((ts - L.suckAt) / L.suckLen), r = RMAX + (DISC / 2 - RMAX) * k;
    const sq = .07 * Math.sin(Math.PI * clamp((ts - L.suckAt - L.suckLen * .78) / (L.suckLen * .5)));
    setMass(r, sq); setInvert(false); planet.style.visibility = "hidden"; X.pupil = 0; ex.opacity = "";
    const back = LOGO.at + LOGO.in + LOGO.hold - .05;   // 13판: 시선이 돌아오는 순간에도 한 번 깜빡 (Taby '기울기 중 깜빡임')
    const blink = Math.max(blinkQ(ts - L.blinkAt), blinkQ(ts - LOGO.blink2), blinkQ(ts - back));   // 뜬 직후 끔뻑끔뻑 (티즈판: 두 번)
    const pop = EYE_POP.up * (EXPRESS((ts - L.eyeOpen) / L.eyeLen) - EASE_BACK((ts - L.eyeOpen - L.eyeLen - EYE_POP.hold) / EYE_POP.settle));   // 13판: 크게 떴다가 0.25초 뒤 제 크기로 (두 박자)
    X.closeF = 1; X.scale = 1 - sq * .5; X.eyeS = (ts < L.lineIn ? 0 : EASE_OUT_QUINT((ts - L.lineIn) / L.lineLen)) * (1 + pop);   // 감은 눈(선)이 가운데서 양옆으로 그어짐
    X.shut = ts < L.eyeOpen ? 1 : Math.max(1 - easeOutL((ts - L.eyeOpen) / L.eyeLen), blink);
  } else if (!md) {
    planet.style.visibility = ""; if (!geoOn) ex.opacity = "";
    X.pupil = ts < L.pupilAt ? 0 : pop(ts - L.pupilAt);   // 줄무늬가 다 열린 뒤 눈알이 톡 생김 (살짝 넘쳤다 자리)
    X.closeF = 1 - spring(ts - L.openAt, L.openRamp); X.shut = 0; X.eyeS = 1; X.scale = 1 + .04 * Math.sin(Math.PI * clamp((ts - L.land) / .35));
    if (ts >= L.greet && !greeted) { greeted = true; }   // 티즈판: 실행 직후 인사(happy = 노란 눈·글로우 + 고개 흔들기) 뺌
    if (ts < L.greet) greeted = false;
  }
  const eyeInv = !md && ts < L.land;   // 12판: 검은 원(difference)이 덮은 동안 눈이 반전되므로 검게 칠해 흰 눈으로
  // 12판 발산 튜토리얼 티즈: 슬라임 분화(diverge_slime.js)를 분화 시각 u 하나로 0 → HINT.tease.mid → 0 되감는다 (sin² 라 반환점에서 멈칫 없이 이어짐). 시작은 tutor.js
  if (md && teaseOn) { teaseOn = false; teaseT0 = null; SLIME.hold(null); }   // 티즈 도중 눌러서 진짜 발산이 시작되면 티즈는 끝
  const tu = !md && ts >= L.land ? teaseU(te) : 0;
  teaseText(tu > .6 ? sm((tu - .6) / (HINT.tease.mid - .6)) : 0);   // 공이 갈라져 나가는 만큼(gooAt .6 부터) 홈 주제문 세 줄이 아래로 비켜남
  if (tu > 0) { if (!teaseOn) { SLIME.start(st.spinT); teaseOn = true; } showGeo(true); SLIME.hold(tu); }
  else if (teaseOn) { teaseOn = false; SLIME.hold(null); SLIME.stop(); showGeo(false); }
  if (md) {
    X.eyeS = 1; X.scale = 1; X.pupil = 1; X.closeF = 0; X.shut = 0;
    if (md.uo < 0) {   // 발산: 엔진 행성을 슬라임이 이어받아 분화
      if (lastMode !== "on") { SLIME.start(st.spinT); SLIME.split(); geoOn = true; lastMode = "on"; }
      showGeo(true);
      textK = sm((md.u - GEO_TEXT.after) / GEO_TEXT.len); homeK = 1 - sm(md.u / HOME_TEXT.out);
    } else {   // 수렴: 공들이 끈적하게 한 덩어리로 → 띠 열림 → 눈 뜸. 끝나면 엔진 행성으로 돌려준다
      if (lastMode !== "merge") { SLIME.merge(); lastMode = "merge"; }
      showGeo(true);
      textK = 1 - sm(md.uo / GEO_TEXT.out); homeK = sm((md.uo - SLIME.MRG.len + .4) / .4);
    }
  } else {
    if (geoOn) { SLIME.stop(); geoOn = false; showGeo(false); }
    lastMode = null; X.preClosed = false; X.convDelay = false;
  }
  window.__divK = md ? 1 - homeK : 0;   // router.reveal 가 홈·발산 화면 글을 이 값으로 섞는다
  // --- 화면 글: 실행 중엔 홈 글이 시간대로 올라온다 ---
  const launching = ts < L.ui[L.ui.length - 1] + L.uiLen;
  ups.forEach((el, i) => {
    let q;
    if (!md && launching) { q = EASE_OUT_QUINT((ts - L.ui[i]) / L.uiLen); el.style.transform = `translateY(${((1 - q) * L.uiDY).toFixed(2)}px)`; }
    else { q = md ? homeK : 1; el.style.transform = ""; }
    el.style.opacity = q.toFixed(3);
  });
  dels.forEach((el) => { const q = !md ? 0 : textK; el.style.opacity = q.toFixed(3); el.style.transform = `translateY(${((1 - q) * 6).toFixed(2)}px)`; });
  window.__divText = md ? textK : null;
  geoTexts(md ? textK : null);   // D1 화면 조각의 제목 세 줄: 공이 자리 잡은 뒤 40px 아래에서 생김
  // --- 색: 상태색 위에 반응색이 잠깐 덮인다 ---
  const stName = st.next || st.cur, target = COLORS[stName] ? stName : "idle";
  if (target !== colorCur) { colorCur = target; colorK = 0; }
  colorK = Math.min(1, colorK + 1 / 36);
  if (st.react && (!reactColor || reactColor.name !== st.react.type || reactColor.t0 !== st.react.t0)) reactColor = { name: st.react.type, t0: st.react.t0 };
  let shown = colorCur, kk = colorK;
  if (reactColor) { const c = COLORS[reactColor.name], u = te - reactColor.t0; if (c && u >= 0 && u < c.len) { const w = c.flash ? Math.max(0, 1 - u / c.len) ** 1.5 : sm(u / .15) * (1 - sm((u - c.len + .4) / .4)); if (w > .02) { shown = reactColor.name; kk = w; } } else reactColor = null; }
  setColor(shown, kk);
  const stg = $("stage").style;
  if (eyeInv) { stg.setProperty("--eye", "#0B0B0B"); stg.setProperty("--seat", "var(--bg)"); }   // 12판: 실행 검은 화면
  else stg.removeProperty("--seat");
}
const planet = $("Planet"), bodySvg = $("svg"), bodyGl = $("gl");
function setBody(k) {   // 몸(행성·무늬) 전체 크기 0~1: 0 이면 숨김. 눈(#svgE)은 따로라 그대로
  for (const b of [bodySvg, bodyGl]) { b.style.opacity = k <= .001 ? "0" : "";   // visibility·display 는 엔진 showLayer(사물=GL 일 때 SVG 숨김) 몫이라 건드리지 않는다
    b.style.transform = Math.abs(k - 1) < .001 ? "" : `scale(${Math.max(0, k).toFixed(4)})`; }   // 7판: 발산이 구슬(GL 사물)이 되면서 GL 캔버스도 같이
}
__m.setAuto(false);
const _step = __m.step;
__m.step = (sec) => { director(sec, sec); _step(sec); };
__m.tap = (sec) => { dtaps.push(sec); buildD(); };
__m.reset = () => { dtaps.length = 0; buildD(); greeted = false; };
__m.colorVar = (v) => { colorVar = v; };
__m.tapColor = (sec) => { reactColor = { name: "tap", t0: sec }; };
// 홈 티즈 시작 (sec = performance.now()/1000). 길이·중간 지점은 mascot.js HINT.tease
let teaseT0 = null, teaseOn = false, teaseEls = null;
const TEASE_TEXT_DY = 34;   // 여섯 공 중 가장 아래 공(ANG 268°·DIST 1.45 + 반지름)이 y ~335 까지 내려옴 → 소제목(y 318)과 안 겹치게 내리는 거리
function teaseText(k) {   // 홈(H1) 주제문 세 줄을 k(0~1)만큼 아래로.
  // 피그마 조각은 translate: var(--tw-translate-x) var(--tw-translate-y) 로 가운데 정렬(-50%)하므로 translate 자체는 건드리지 않고 세로 변수만 바꾼다
  if (!teaseEls) { const f = typeof COMET !== "undefined" && COMET.SCR && COMET.SCR.H1 && COMET.SCR.H1.fig; if (!f) return; teaseEls = [...f.querySelectorAll("p")].filter(p => /^(기쁨을 주는|출근길 낯선|10\.27 ·)/.test(p.textContent.trim())); }
  for (const p of teaseEls) { if (k > .001) p.style.setProperty("--tw-translate-y", `${(TEASE_TEXT_DY * k).toFixed(2)}px`); else p.style.removeProperty("--tw-translate-y"); }
}
__m.tease = (sec) => { teaseT0 = sec; };
function teaseU(te) {
  if (teaseT0 === null || typeof HINT === "undefined" || !HINT.tease) return 0;
  const p = (te - teaseT0) / HINT.tease.len; if (p <= 0 || p >= 1) return 0;
  return HINT.tease.mid * Math.sin(Math.PI * p) ** 2;   // 출발·반환점·도착 모두 속도 0
}
__m.flashColor = (name, sec) => { reactColor = { name, t0: sec }; };   // 4판: 전구 '삥' 같은 순간 빛
if (!FAKE) {
  (function dtick(now) { const te = now / 1000; if (T0 !== null) director(te - T0, te); requestAnimationFrame(dtick); })(performance.now());
  const tapNow = () => { if (T0 !== null) { dtaps.push(performance.now() / 1000 - T0); buildD(); reactColor = { name: "tap", t0: performance.now() / 1000 }; } };
  $("toggleD").addEventListener("click", tapNow);   // 마스코트 탭은 router.wireTaps 가 맡음 (4판)
}

