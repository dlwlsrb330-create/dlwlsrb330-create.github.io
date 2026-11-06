// dial_beo.js — 11판: 발산 방식 시트(D2)의 다이얼을 Beosonic(뱅앤올룹슨, C:\dev\beosonic-make\src\beosonic.js 의 식 그대로)으로.
// 흰 판 · 가운데는 색 없음 · 점을 끄는 방향으로 둘레 빛 색이 바뀜 · 휠/두 손가락으로 점 크기(= 세기 z, 가까운 ↔ 먼).
// 축 이름은 와이어프레임 D2 그대로: 가로 친숙한 ↔ 창의적인, 세로 다양한 ↔ 비슷한. 상태는 window.BEODIAL.value() 로 읽는다.
const BEODIAL = (() => {
  const MIN_DOT = 1.2, MAX_DOT = 3.5;
  const clampDot = ([x, y]) => { const l = Math.hypot(x, y); if (l < .07) return [0, 0]; if (l > 1) return [x / l, y / l]; return [x, y]; };
  function hsv(h, s, v) { h /= 360; s /= 100; v /= 100; const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][((i % 6) + 6) % 6].map(c => Math.round(c * 255)); }
  function glowColor([x, y]) {   // 빛 색은 방향(각도)으로만. 가운데는 색 없음
    if (Math.hypot(x, y) < .001) return [241, 241, 241];
    let n = (Math.PI + Math.atan2(y, x)) / (2 * Math.PI); n = (((1 - n) + .5) % 1) * 360;
    const useHsv = n > 120;
    const stops = useHsv ? [[0, 57, 88], [51, 87, 87], [145, 42, 69], [198, 84, 72], [283, 29, 58], [360, 57, 88]] : [[225, 96, 96], [222, 192, 28], [103, 178, 135], [29, 136, 183], [135, 104, 147], [225, 96, 96]];
    const edges = [0, 90, 120, 240, 300, 360]; let c = stops[0];
    for (let i = 0; i < 5; i++) if (edges[i] <= n && n <= edges[i + 1]) { const f = (n - edges[i]) / (edges[i + 1] - edges[i]); c = [0, 1, 2].map(j => stops[i][j] + f * (stops[i + 1][j] - stops[i][j])); break; }
    return useHsv ? hsv(...c) : c.map(Math.trunc);
  }
  const primaryAlpha = (d, p) => Math.max(.15, Math.min(1, 1 - Math.hypot(p[0] - d[0], p[1] - d[1]) + .75));
  const secondaryAlpha = (d, p) => Math.max(0, Math.min(1, 1 - Math.hypot(p[0] * .65 - d[0], p[1] * .65 - d[1])));
  const PRIMARY = [{ label: "창의적인", p: [1, 0], anchor: "end" }, { label: "친숙한", p: [-1, 0], anchor: "start" }, { label: "다양한", p: [0, -1], anchor: "middle" }, { label: "비슷한", p: [0, 1], anchor: "middle" }];
  const SECONDARY = [{ lines: ["익숙하게", "여러 갈래"], p: [-1, -1] }, { lines: ["낯설고", "제각각"], p: [1, -1] }, { lines: ["새롭게", "한 줄기"], p: [1, 1] }, { lines: ["익숙하게", "다듬기"], p: [-1, 1] }];
  // 와이어프레임 D2 다이얼 자리: 상자 left 55 · top 346 · 280.8 × 329, 원판 중심 (140.4, 140.4) 반지름 112.32
  const BOX = { x: 55, y: 346, w: 280.8, h: 329 }, CX = 140.4, CY = 140.4, R = 112.32, GLOW_SHIFT = 65 / 3 * (R / 157);
  const INK = "#1a1626", LINE = "#e4e0ee", PAPER = "#FCFCFA", SHEET = [240, 240, 239];   // SHEET = 바텀시트 색(홈 입력창 색)
  const DOT_DIV = 12;   // 11-04: 점이 너무 컸다 → 반지름 = R × 세기 / 12 (기본 지름 약 36px, 손가락으로 잡을 만큼)
  let dot = [0, 0], size = 1.9, svg = null, els = {};
  const SVGNS = "http://www.w3.org/2000/svg", mk = (tag, attrs, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  function draw() {
    const z = (size - MIN_DOT) / (MAX_DOT - MIN_DOT), [r, g, b] = glowColor(dot);
    els.glow.setAttribute("cx", CX + dot[0] * GLOW_SHIFT); els.glow.setAttribute("cy", CY + dot[1] * GLOW_SHIFT); els.glow.setAttribute("r", R * (1 + z * .06) * 1.12); els.gs.forEach(st => st.setAttribute("stop-color", `rgb(${r},${g},${b})`));
    if (els.arcs) {   // 13판: 끈 방향 원 끝 색 호 (가운데면 안 보임, 끈 만큼 진하게)
      const len = Math.hypot(dot[0], dot[1]), k = Math.min(1, len / .55), ang = Math.atan2(dot[1], dot[0]) * 180 / Math.PI, C = 2 * Math.PI * (R + 1.5);
      const seg = els.arcSeg, dash = `${(C * seg / 360).toFixed(2)} ${C.toFixed(2)}`;
      els.arcs.forEach(({ e, off, f }) => { e.setAttribute("stroke", `rgb(${r},${g},${b})`); e.setAttribute("opacity", (f * k).toFixed(3)); e.setAttribute("stroke-dasharray", dash); e.setAttribute("transform", `rotate(${(ang + off - seg / 2).toFixed(2)} ${CX} ${CY})`); });
    }
    els.prim.forEach(({ e, p }) => e.setAttribute("opacity", primaryAlpha(dot, p)));
    els.sec.forEach(({ e, p }) => e.setAttribute("opacity", secondaryAlpha(dot, p)));
    els.dot.setAttribute("cx", CX + dot[0] * R); els.dot.setAttribute("cy", CY + dot[1] * R); els.dot.setAttribute("r", R * size / DOT_DIV);
    // 점 색: 단색(음영 없음). 가운데는 바텀시트 색, 끄는 만큼 둘레 빛과 같은 방향 색으로
    const k = Math.min(1, Math.hypot(dot[0], dot[1]) / .55), mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    els.dot.setAttribute("fill", `rgb(${mix(SHEET, [r, g, b], k)})`);
    if (typeof COMET !== "undefined") COMET.lookAt([dot[0] * .32, -.12 - dot[1] * .26]);   // 마스코트가 점 쪽을 본다 (예전 다이얼과 같은 값)
  }
  function init() {
    const scr = COMET.SCR.D2; if (!scr) return;
    const old = COMET.find("D2", "발산 다이얼")[0]; if (old) old.style.visibility = "hidden";
    // 13판: 다이얼 시트가 열려 있는 동안 위에 보이는 발산 화면 제목 '발산' 은 숨김 (comet.css body[data-screen="D2"] .d1-title)
    const d1t = COMET.SCR.D1 && [...COMET.SCR.D1.fig.querySelectorAll("p")].find(p => p.textContent.trim() === "발산"); if (d1t) d1t.classList.add("d1-title");   // 와이어프레임 다이얼 그림(어두운 원판·점)은 숨기고 이 다이얼로
    svg = mk("svg", { viewBox: `0 0 ${BOX.w} ${BOX.h}`, class: "beodial sheetpart" });
    svg.style.cssText = `position:absolute;left:${BOX.x}px;top:${BOX.y}px;width:${BOX.w}px;height:${BOX.h}px;overflow:visible;touch-action:none;user-select:none;z-index:2;font-family:'Pretendard Variable',Pretendard,-apple-system,'Apple SD Gothic Neo',sans-serif`;
    const defs = mk("defs", {}, svg);
    const gg = mk("radialGradient", { id: "beoGlowGrad" }, defs);   // 11-04: 흐림 필터 대신 그라데이션 (같은 모양, 매 프레임 계산 없음)
    els.gs = [["0", 1], [".86", 1], [".93", .4], ["1", 0]].map(([o, a]) => mk("stop", { offset: o, "stop-opacity": a }, gg));
    mk("feDropShadow", { dx: 0, dy: 1, stdDeviation: 3, "flood-color": "#000", "flood-opacity": .22 }, mk("filter", { id: "beoDot", x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs));
    els.glow = mk("circle", { fill: "url(#beoGlowGrad)", style: "display:none" }, svg);   // 13판: 뒤 큰 빛(반지름 1.12배 · 방향마다 색)은 뺌 → 아래 얇은 무지개 테두리
    mk("circle", { cx: CX, cy: CY, r: R, fill: PAPER, stroke: LINE, "stroke-width": 1 }, svg);   // 흰 판
    // 13판(11-04 시연): 번짐 대신 — 점을 끈 방향의 원 끝에만 살짝 색 테두리(호). 색은 예전 번짐과 같은 방향 색, 진하기는 끈 만큼. 펄스 없음.
    // 양 끝이 툭 끊기지 않게: 호를 36 조각(약 4.5°씩, 살짝 겹침)으로 나눠 가운데서 멀어질수록 진하기·굵기가 종 모양으로 줄어듦
    const ARC = { span: 160, n: 36, sigma: 38, w: 3 };
    els.arcs = Array.from({ length: ARC.n }, (_, i) => { const off = -ARC.span / 2 + (i + .5) * ARC.span / ARC.n, f = Math.exp(-((off / ARC.sigma) ** 2));
      return { off, f, e: mk("circle", { cx: CX, cy: CY, r: R + 1.5, fill: "none", "stroke-width": (ARC.w * (.45 + .55 * f)).toFixed(2), opacity: 0 }, svg) }; });
    els.arcSeg = ARC.span / ARC.n * 1.15;   // 조각 길이(도) — 15% 겹쳐 틈 없이
    els.sec = SECONDARY.map(({ lines, p }) => { const x = CX + p[0] * .55 * R, t = mk("text", { x, y: CY + p[1] * .55 * R, "text-anchor": "middle", "font-size": 11, fill: INK }, svg);
      mk("tspan", { x }, t).textContent = lines[0]; mk("tspan", { x, dy: 13 }, t).textContent = lines[1]; return { e: t, p }; });
    els.prim = PRIMARY.map(({ label, p, anchor }) => { const t = mk("text", { x: CX + p[0] * .9 * R, y: CY + p[1] * .9 * R + (p[1] === -1 ? 13 : p[1] === 1 ? -2 : 5), "text-anchor": anchor, "font-size": 13, "font-weight": 600, fill: INK }, svg); t.textContent = label; return { e: t, p }; });
    els.dot = mk("circle", { stroke: "#dcdcd5", "stroke-width": 1, style: "cursor:grab" }, svg);   // 11-04: 그림자·그라데이션 뺌. 흰 판 위에서 보이게 가는 테만
    // 11-04 주형 2차: 카드 장수 '선택됨' 알약이 '3장' 글자보다 뒤에 있어 3장을 고르면 글자가 덮여 까맣게 보였다 → 알약을 바탕 바로 뒤(글자들 아래)로
    const cb = COMET.find("D2", "카드 장수 · 바탕")[0], cs = COMET.find("D2", "카드 장수 · 선택됨")[0]; if (cb && cs && cb.nextElementSibling !== cs) cb.after(cs);
    scr.el.appendChild(svg);
    // 끌기: 점을 잡은 자리에서 상대적으로 (Beosonic 과 같음). 두 손가락 = 점 크기. 휠 = 점 크기
    const toUnit = (e) => { const b = svg.getBoundingClientRect(), s = BOX.w / b.width; return [((e.clientX - b.left) * s - CX) / R, ((e.clientY - b.top) * s - CY) / R]; };
    const pts = new Map(); let drag = null, pinch = null;
    svg.addEventListener("pointerdown", (e) => { e.stopPropagation(); svg.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), from: size }; drag = null; }
      else { const p = toUnit(e); drag = Math.hypot(p[0] - dot[0], p[1] - dot[1]) < size / DOT_DIV + .2 ? { start: p, from: dot } : { start: p, from: clampDot(p) }; if (drag.from !== dot) { dot = drag.from; draw(); } } }, true);
    svg.addEventListener("pointermove", (e) => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pinch && pts.size === 2) { const [a, b] = [...pts.values()]; size = Math.max(MIN_DOT, Math.min(MAX_DOT, pinch.from * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d)); draw(); return; }
      if (!drag) return; const p = toUnit(e); dot = clampDot([drag.from[0] + p[0] - drag.start[0], drag.from[1] + p[1] - drag.start[1]]); draw(); });
    const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; drag = null; };
    svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", up);
    svg.addEventListener("click", (e) => e.stopPropagation(), true);
    svg.addEventListener("wheel", (e) => { e.preventDefault(); size = Math.max(MIN_DOT, Math.min(MAX_DOT, size - e.deltaY * .002)); draw(); }, { passive: false });
    draw();
  }
  // 11-05 주형: 원판 위 점을 네모 칸 값으로 펼친다 — 대각선 끝(예: 낯설고 제각각)은 두 축을 다 끝까지(창의적인 +1 · 다양한 -1) 가진다. 그 사이도 '두 축의 중간'이 아니라 둘 다 가진 값
  // (원 둘레 → 네모 둘레로 같은 방향 그대로 늘림). rx · ry 는 원판 그대로 값
  const toSquare = ([x, y]) => { const r = Math.hypot(x, y), m = Math.max(Math.abs(x), Math.abs(y)); return m < 1e-6 ? [0, 0] : [x * r / m, y * r / m]; };
  const value = () => { const [sx, sy] = toSquare(dot); return { x: sx, y: sy, rx: dot[0], ry: dot[1], z: (size - MIN_DOT) / (MAX_DOT - MIN_DOT) }; };   // x: 친숙한 -1 ↔ 창의적인 +1 · y: 다양한 -1 ↔ 비슷한 +1 · z: 가까운 0 ↔ 먼 1
  const color = () => ({ rgb: glowColor(dot).map(Math.round), k: Math.min(1, Math.hypot(dot[0], dot[1]) / .55) });   // 11-05 주형: 발산 공이 다이얼 색을 따라가게 (diverge_slime.js)
  return { init, value, color };
})();
