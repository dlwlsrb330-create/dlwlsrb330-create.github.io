// diverge_slime.js — 11판 발산 = 「슬라임 분화 3판」(피그마 1020:249, 이진규 11-04) 을 앱에 꽂는 모듈.
// 원본 index.html 의 값·식 그대로: 띠 여섯 → 눈 달린 작은 공 여섯(색 여섯, Lilguy 눈 시계) → 다시 한 덩어리. 물건 변신 없음.
// 앱 쪽 손잡이: window.SLIME = { start(spinT), split(), merge(), mode(), active() }. 마스코트 무대(#stage) 위에 제 svg 를 겹쳐 그린다.
// 공용 도우미(clamp·sm·bez·V3·axisAngle·mm·mv·rz·sph·clipFront·toD·ANCHOR·tangent·PL·ribbons·centerIdle·halfIdle·EYES3·LG_HALF·K·GAP·PERSP·IDLE_EYE·easeOutL·blinkCurve·spring)는 mascot_core.js·엔진 것을 그대로 쓴다.
const SLIME = (() => {
  const VIEWHALF = 2.6, STAGE_UNITS = 2.9;                                   // 원본 viewBox ±2.6, 마스코트 무대는 2.9 폭
  const svg = document.createElementNS(NS, "svg"); svg.id = "slime"; svg.setAttribute("viewBox", `${-VIEWHALF} ${-VIEWHALF} ${2 * VIEWHALF} ${2 * VIEWHALF}`); svg.setAttribute("aria-hidden", "true");
  const scale = 2 * VIEWHALF / STAGE_UNITS, off = (1 - scale) / 2 * 100;   // 공 반지름 1 이 마스코트와 같은 크기가 되게
  svg.style.cssText = `position:absolute;left:${off}%;top:${off}%;width:${scale * 100}%;height:${scale * 100}%;overflow:visible;pointer-events:none;display:none;z-index:5`;
  svg.innerHTML = `<defs><filter id="goo" filterUnits="userSpaceOnUse" x="-3" y="-3" width="6" height="6" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation=".11" result="b"/><feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11" result="g"/><feComposite in="SourceGraphic" in2="g" operator="atop"/></filter></defs>
    <g transform="scale(1,-1)"><g id="slBlobs" filter="url(#goo)" fill="var(--ink)"></g><g id="slSpheres"></g></g>`;
  $("stage").appendChild(svg);

  // ---------- 띠 (2판 값) ----------
  const NBs = 6, Ns = 180;
  const RIB = RIB_IDLE, CLOSE_FS = 2.1, cache = new Map();
  function ribClosed(closeF) { const f = 1 + (CLOSE_FS - 1) * clamp(closeF); if (f < 1.001) return RIB; const key = f.toFixed(2); if (!cache.has(key)) cache.set(key, ribbons(centerIdle, (j, s) => Math.min(Math.PI / 2 - .02, halfIdle(j, s) * +key))); return cache.get(key); }
  function drawRibbonsTo(els, world) {
    world.forEach((rb, j) => { const polys = []; for (let a = 0; a < Ns; a += 10) { const poly = []; for (let k = 0; k <= 10; k++) poly.push(rb.L[a + k]); for (let k = 10; k >= 0; k--) poly.push(rb.R[a + k]); polys.push(clipFront(poly)); } els[j].setAttribute("d", toD(polys)); });
  }
  const wobS = (t, ph = 0) => mm(axisAngle([0, 0, 1], .03 * Math.sin(t * 1.1 + ph)), mm(axisAngle([0, 1, 0], .05 * Math.sin(t * .7 + 1 + ph)), axisAngle([1, 0, 0], .04 * Math.sin(t * .9 + 2 + ph))));
  const spinS = (sT) => axisAngle(AXIS, -2 * Math.PI * sT / PL.period);

  // ---------- 눈: 구에 박힌 두 패치 + 얇은 테 + 동공. open = 1판식 뜨기(흰자가 세로로 자라남) ----------
  const SEAT_OPEN = [EYES3.eye(EYES3.P.open, -1, [0, 0]).white, EYES3.eye(EYES3.P.open, 1, [0, 0]).white];
  function drawEyes(S, R, shut, gaze, size, expr, pos, open) {
    const p = EYES3.withClose(expr, shut), h = LG_HALF * size;
    if (open < .03) { for (const k of [0, 1]) { S.seat[k].setAttribute("d", ""); S.eye[k].setAttribute("d", ""); S.pup[k].setAttribute("d", ""); } return; }
    let A = ANCHOR, T = AT; if (pos) { const l = Math.hypot(pos[0], pos[1]), m = l > .86 ? .86 / l : 1; A = [pos[0] * m, pos[1] * m, Math.sqrt(Math.max(0, 1 - (pos[0] * m) ** 2 - (pos[1] * m) ** 2))]; T = tangent(A); }
    for (const [k, side] of [[0, -1], [1, 1]]) {
      const c0 = V3.norm([0, 1, 2].map(i => A[i] + h * K * side * GAP * T.e1[i]));
      const c = mv(R, c0), Tc = tangent(c0), u = mv(R, Tc.e1), v = mv(R, Tc.e2), hh = h * PERSP(c[2]);
      const poly = (pts, oy = open) => { let d = ""; for (const q of pts) { const U = q[0] * K, W = q[1] * K * oy; d += (d ? "L" : "M") + (c[0] + hh * (U * u[0] + W * v[0])).toFixed(4) + " " + (c[1] + hh * (U * u[1] + W * v[1])).toFixed(4); } return d + "Z"; };
      const hide = c[2] < .2, e = EYES3.eye(p, side, gaze);
      S.seat[k].setAttribute("d", hide ? "" : poly(SEAT_OPEN[k].map(q => [q[0] * 1.28, q[1] * 1.28]), 1));
      S.eye[k].setAttribute("d", hide ? "" : poly(e.white));
      S.pup[k].setAttribute("d", hide || !e.pupil ? "" : poly(e.pupil));
    }
  }
  const hex = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mixHex = (a, b, k) => { const A = hex(a), B = hex(b); return "rgb(" + A.map((x, i) => Math.round(x + (B[i] - x) * k)).join(",") + ")"; };

  // ---------- 여섯 공: 색 여섯 + 눈 성격 여섯 (피그마 「Prototype · Lilguy 눈 인터랙션」의 동공 4종·시계를 공마다 다르게) ----------
  const OBJ = [
    { name: "디자인", color: "#E87A8C", base: "circle",  idle: [.10, .04],   seed: 11, eye: [-.28, -.36], drift: [.10, .08, 9.0] },
    { name: "개발",   color: "#5FA8E8", base: "cat",     idle: [-.14, .02],  seed: 23, eye: [.30, -.22],  drift: [.08, .12, 7.5] },
    { name: "학습",   color: "#F08A3C", base: "acorn",   idle: [.04, .14],   seed: 37, eye: [-.06, .32],  drift: [.14, .06, 11.0] },
    { name: "제품",   color: "#B77DD0", base: "dot",     idle: [-.06, -.10], seed: 41, eye: [.34, .18],   drift: [.06, .10, 8.2] },
    { name: "글",     color: "#6CC3A0", base: "excited", idle: [.16, -.04],  seed: 53, eye: [-.38, .02],  drift: [.10, .12, 6.8] },
    { name: "음악",   color: "#F2D23C", base: "shy",     idle: [-.12, .10],  seed: 67, eye: [.04, -.40],  drift: [.12, .06, 10.0] },
  ];
  // ---------- Lilguy 눈 시계 (피그마 622:388): 3초 깜빡임(.12 감고 .15 뒤 .16에 뜸) · 둘러보기 오른쪽→위→왼쪽→아래(.45 이동·.5 머묾) · 찡긋→표정A ----------
  const LG = { blinkAt: 3.0, blinkIn: .12, blinkHold: .15, blinkOut: .16, lookMove: .45, lookHold: .5, lookTo: { right: [.30, 0], up: [0, .26], left: [-.30, 0], down: [0, -.24] }, squintIn: .16, squintHold: .35, exprIn: .3, exprHold: 1.2, exprOut: .4 };
  const LOOK_SEQ = ["right", "up", "left", "down"];
  function mkLil(spec) { let sd = spec.seed; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    const start = Math.floor(r() * 4);
    return { r, state: "idle", t0: null, nextBlink: 1.0 + r() * 3.0, nextLook: 2.5 + r() * 6, nextSquint: 7 + r() * 9, seq: LOOK_SEQ.slice(start).concat(LOOK_SEQ.slice(0, start)), step: 0, gFrom: spec.idle.slice(), gTo: spec.idle.slice(), gT0: -9, gDur: .45 }; }
  const lilGaze = (L, t) => { const k = easeIOs((t - L.gT0) / L.gDur); return [L.gFrom[0] + (L.gTo[0] - L.gFrom[0]) * k, L.gFrom[1] + (L.gTo[1] - L.gFrom[1]) * k]; };
  const easeIOs = bez(.65, 0, .35, 1);
  function lilguy(L, spec, t) {
    if (L.t0 === null) L.t0 = t;
    const tween = (to, dur) => { L.gFrom = lilGaze(L, t); L.gTo = to.slice(); L.gT0 = t; L.gDur = dur; };
    if (L.state === "idle") {
      if (t >= L.nextBlink) { L.state = "blink"; L.t0 = t; }
      else if (t >= L.nextLook) { L.state = "look"; L.step = 0; L.t0 = t; tween(LG.lookTo[L.seq[0]], LG.lookMove); }
      else if (t >= L.nextSquint) { L.state = "squint"; L.t0 = t; }
    }
    const u = t - L.t0; let shut = 0, expr = null, exprK = 0;
    if (L.state === "blink") { shut = u < LG.blinkIn ? sm(u / LG.blinkIn) : u < LG.blinkIn + LG.blinkHold ? 1 : 1 - easeOutL((u - LG.blinkIn - LG.blinkHold) / LG.blinkOut);
      if (u >= LG.blinkIn + LG.blinkHold + LG.blinkOut) { L.state = "idle"; L.nextBlink = t + LG.blinkAt + (L.r() - .5) * 1.6; } }
    else if (L.state === "look") { const k = LG.lookMove + LG.lookHold; if (u >= k * (L.step + 1)) { L.step++; if (L.step >= 4) { L.state = "idle"; tween(spec.idle, LG.lookMove); L.nextLook = t + 4 + L.r() * 7; } else tween(LG.lookTo[L.seq[L.step]], LG.lookMove); } }
    else if (L.state === "squint") { const a = LG.squintIn, b = a + LG.squintHold, c = b + LG.exprIn, d = c + LG.exprHold, e = d + LG.exprOut;
      if (u < b) { expr = "focus"; exprK = sm(u / a); } else if (u < d) { expr = "happy"; exprK = sm((u - b) / LG.exprIn); } else { expr = "happy"; exprK = 1 - sm((u - d) / LG.exprOut); }
      if (u >= e) { L.state = "idle"; L.nextSquint = t + 9 + L.r() * 10; } }
    return { gaze: lilGaze(L, t), shut, expr, exprK };
  }
  function stoneEye(spec, lg) { let p = EYES3.P[spec.base] || IDLE_EYE; if (lg.expr && lg.exprK > 0) p = EYES3.lerp(p, EYES3.P[lg.expr], lg.exprK); return p; }
  let sd = 7; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  function mkSphere() {
    const g = document.createElementNS(NS, "g"); g.style.display = "none"; $("slSpheres").appendChild(g);
    const bandsG = document.createElementNS(NS, "g"); bandsG.setAttribute("fill", "var(--ink)"); bandsG.setAttribute("stroke", "var(--ink)"); bandsG.setAttribute("stroke-width", ".006"); bandsG.setAttribute("stroke-linejoin", "round"); g.appendChild(bandsG);
    const bands = RIB.map(() => { const p = document.createElementNS(NS, "path"); bandsG.appendChild(p); return p; });
    const mk = (fill) => { const p = document.createElementNS(NS, "path"); p.setAttribute("fill", fill); g.appendChild(p); return p; };
    const seat = [mk("var(--ink)"), mk("var(--ink)")], eye = [mk("var(--bg)"), mk("var(--bg)")], pup = [mk("var(--ink)"), mk("var(--ink)")];
    return { g, bandsG, bands, seat, eye, pup, spinT: rnd() * PL.period, spinV: 1, ph: rnd() * 6.28, gazeTgt: [0, 0], gazeCur: [0, 0], nextGaze: 1 + rnd() * 2, tau: .25, nextBlink: 2 + rnd() * 3, blinkT0: -9 };
  }
  const BIG = mkSphere(), SM = Array.from({ length: NBs }, mkSphere);
  SM.forEach((S, j) => { S.spinV = .8 + .5 * rnd(); S.lil = mkLil(OBJ[j]); });
  const blobEls = Array.from({ length: NBs + 1 }, () => { const e = document.createElementNS(NS, "ellipse"); e.style.display = "none"; $("slBlobs").appendChild(e); return e; });
  function placeBlob(i, x, y, r, s = 0, ang = 0) { const e = blobEls[i]; if (r <= .09) { e.style.display = "none"; return; } e.style.display = ""; e.setAttribute("transform", `translate(${x.toFixed(4)} ${y.toFixed(4)}) rotate(${ang.toFixed(2)})`); e.setAttribute("rx", (r * (1 + s)).toFixed(4)); e.setAttribute("ry", (r / (1 + s)).toFixed(4)); }
  function liveEyes(S, t, dt) {
    if (t > S.nextGaze) { S.gazeTgt = [(rnd() - .5) * .28, (rnd() - .5) * .16]; S.tau = .05 + rnd() * .45; S.nextGaze = t + 3 + rnd() * 3; }
    const k = 1 - Math.exp(-dt / S.tau); S.gazeCur = [S.gazeCur[0] + (S.gazeTgt[0] - S.gazeCur[0]) * k, S.gazeCur[1] + (S.gazeTgt[1] - S.gazeCur[1]) * k];
    if (t > S.nextBlink) { S.blinkT0 = t; S.nextBlink = t + 3 + rnd() * 3; }
    return blinkCurve(t - S.blinkT0, .184, 0, .29);
  }
  const breathe = (t, ph = 0) => 1 + .012 * Math.sin(2 * Math.PI * t / 1.7 + ph);
  function drawSphere(S, o) {   // o: { x, y, r, closeF, shut, gaze, W, sx, sy, eyeP, eyePos, open }
    S.g.style.display = "block";
    const st = o.stretch;   // 11-05 주형: 창의적으로 빨리 돌 때 도는 방향으로 늘이기 — 방향 a(도)로 돌려 늘리고 되돌린다 (무늬는 안 돈다)
    S.g.setAttribute("transform", st ? `translate(${o.x.toFixed(4)} ${o.y.toFixed(4)}) rotate(${st.a.toFixed(1)}) scale(${(o.r * (1 + st.k)).toFixed(4)} ${(o.r / (1 + st.k)).toFixed(4)}) rotate(${(-st.a).toFixed(1)})`
      : `translate(${o.x.toFixed(4)} ${o.y.toFixed(4)}) scale(${(o.r * (o.sx || 1)).toFixed(4)} ${(o.r * (o.sy || 1)).toFixed(4)})`);
    drawRibbonsTo(S.bands, xf(ribClosed(o.closeF), mm(o.W, spinS(S.spinT))));
    drawEyes(S, o.W, o.shut, o.gaze, EYE_SIZE.idle, o.eyeP || IDLE_EYE, o.eyePos || null, o.open === undefined ? 1 : o.open);
  }
  const hideSphere = (S) => { S.g.style.display = "none"; };
  // 11-04 주형 11차: 발산 방식 다이얼 → 공 반응. tint = 다이얼 점 방향 색(tk 만큼 공 색이 그 색으로), chaos = 창의적인 쪽일수록 살짝 떨림 (궤도 모양은 유지)
  const tune = { tint: [0, 0, 0], tk: 0, tkT: 0, chaos: 0, chaosT: 0 };
  const offs = [0, 0, 0, 0, 0, 0];   // 공마다 궤도에서 어긋난 각(도) — 지금은 0 으로 풀리기만 함
  const mixA = (a, b, k) => a.map((x, i) => Math.round(x + (b[i] - x) * k));
  function setTint(S, j, k) {   // 공 색: 검정 → 제 색 (띠·눈테·동공·슬라임 덩어리)
    const key = k.toFixed(3) + (tune.tk > .004 ? "|" + tune.tk.toFixed(3) + tune.tint.join() : ""); if (S.tintKey === key) return; S.tintK = k; S.tintKey = key;
    const base = tune.tk > .004 ? mixA(hex(OBJ[j].color), tune.tint, tune.tk) : hex(OBJ[j].color);
    const c = k <= .01 ? "var(--ink)" : `rgb(${mixA([11, 11, 11], base, k).join(",")})`;
    S.bandsG.setAttribute("fill", c); S.bandsG.setAttribute("stroke", c);
    for (const e of [...S.seat, ...S.pup]) e.setAttribute("fill", c);
    blobEls[j].setAttribute("fill", c);
  }
  // ---------- 자리: 띠 j 가 있던 높이에서 나와, 띠 순서대로 둘레에 앉아 천천히 시계 방향으로 돈다 ----------
  const START = PL.lats.map(l => [0, .82 * Math.sin(l * D)]);
  const ANG = [92, 158, 212, 332, 22, 268], DIST = [1.45, 1.55, 1.5, 1.55, 1.5, 1.45], ORBIT = -7;   // 도/초 (음수 = 시계 방향)
  // 11-04 주형: 궤도 각을 시각 대신 쌓아 가는 값으로 → 도는 빠르기·궤도 크기를 도중에 바꿔도 공이 튀지 않는다 (카드 뽑기: 빨리 돌다가 모서리에선 촘촘하게)
  const orb = { deg: ORBIT * performance.now() / 1000, dist: 1, speed: 1, sv: 0, tDist: 1, tSpeed: 1, rate: 4 };
  // 11-04 주형 5차: 빨리 돌수록 궤도가 살짝 바깥으로 부푼다(원심) — 최대 14%
  const fling = () => 1 + Math.min(.14, .018 * Math.max(0, orb.speed - 1));
  const posAt = (j, t) => { const a = (ANG[j] + orb.deg + offs[j]) * D, r = DIST[j] * orb.dist * fling(); return [r * Math.cos(a), r * Math.sin(a)]; };
  const RSM = PL.widths.map(w => .27 + .013 * w);
  const bob = (j, t) => [.05 * Math.sin(t * 1.1 + j * 1.7), .06 * Math.sin(t * 1.4 + j * 2.3)];
  const angTo = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) / D;
  function renderStone(j, t, x, y, auraK, o = {}) {   // 줄무늬 공 + Lilguy 눈 (눈 자리가 구 표면을 천천히 떠다님)
    const S = SM[j], st = OBJ[j]; setTint(S, j, auraK);
    const lg = S.lilOut || { gaze: st.idle, shut: 0 }, dr = st.drift, ph = 2 * Math.PI * t / dr[2];
    const eyePos = [st.eye[0] + dr[0] * Math.sin(ph + S.ph), st.eye[1] + dr[1] * Math.sin(ph * 1.37 + S.ph * .7)];
    drawSphere(S, { x, y, r: RSM[j] * breathe(t, S.ph) * (o.rk || 1), stretch: o.stretch, closeF: o.closeF || 0, shut: lg.shut, open: o.open === undefined ? 1 : o.open, gaze: lg.gaze, eyeP: stoneEye(st, lg), eyePos, W: wobS(t, S.ph) });
    placeBlob(j, x, y, 0);
  }
  const hideStone = (j) => hideSphere(SM[j]);
  // ---------- 11-04 주형: 카드 뽑기 — 빨리 돌다가 궤도에서 한 알씩 빠져나가 한 줄로 오른쪽 위로(fly), 모서리에선 목성 고리처럼 사선 궤도로 돈다(ring). 사선은 살짝씩 흔들린다 ----------
  // 6차: 고리 면은 2시 방향 사선(x축 70° 눕힘 + 30° 기울임)을 기본으로, 한 바퀴 돌지 않고 x·y·z 축으로 조금씩 흔들려 사선이 살짝살짝 달라진다 (축마다 다른 주기라 같은 모양이 잘 반복되지 않음)
  const RING = { r: 1.5, tiltX: 70, tiltZ: 30, wob: [[12, .83], [14, .61], [10, .47]], spin: -70, depth: .22, dur: .55, land: .45 };   // wob = 축별 [흔들림 폭 도, 빠르기 rad/초] · depth = 앞뒤 크기 차 · land = 도착 뒤 출렁이는 시간
  let ring = null, ringLive = false, fly = null;
  // 7차: 모서리 모양 고르기 — 사선 고리(켬) / 평평한 원 궤도, 가운데 빈 곳만 좁힘(끔, 기본). 폰 밖 '온보딩부터' 옆 버튼, 브라우저에 저장
  const RING_KEY = "comet.cornerRing", FLAT = { dist: .62, spin: -9 };
  const ringOn = () => { try { return localStorage.getItem(RING_KEY) === "1"; } catch (e) { return false; } };
  const ringAt = (j, t) => { if (!ring.tilt) { const a = (ANG[j] + ring.deg) * D, r = DIST[j] * FLAT.dist; return { x: r * Math.cos(a), y: r * Math.sin(a), z: 0 }; }
    const a = (ANG[j] + ring.deg) * D, u = t - ring.t0, [wx, wy, wz] = RING.wob;
    const ax = (RING.tiltX + wx[0] * Math.sin(wx[1] * u)) * D, ay = wy[0] * Math.sin(wy[1] * u) * D, az = (RING.tiltZ + wz[0] * Math.sin(wz[1] * u)) * D;
    let x = RING.r * Math.cos(a), y = RING.r * Math.sin(a), z = 0, q;
    q = y * Math.cos(ax) - z * Math.sin(ax); z = y * Math.sin(ax) + z * Math.cos(ax); y = q;     // x축
    q = x * Math.cos(ay) + z * Math.sin(ay); z = -x * Math.sin(ay) + z * Math.cos(ay); x = q;    // y축
    q = x * Math.cos(az) - y * Math.sin(az); y = x * Math.sin(az) + y * Math.cos(az); x = q;     // z축
    return { x, y, z: -z / RING.r }; };   // z 1 = 앞(크게·위에)
  let zOrder = "";
  function stack(items) { const key = items.slice().sort((a, b) => a.z - b.z).map(i => i.j).join(); if (key === zOrder) return; zOrder = key; const g = $("slSpheres"); key.split(",").forEach(j => g.appendChild(SM[+j].g)); }
  function drawMany(t, dt) {
    if (ring) ring.deg += (ring.tilt ? RING.spin : FLAT.spin) * dt;
    if (fly && fly.state.every(f => f.t0 !== null && t - f.t0 >= RING.dur + RING.land)) { const done = fly.onDone; fly = null; ringLive = true; done && done(); }   // 다 도착한 프레임에 무대를 모서리로 옮기고 고리로 (같은 프레임이라 안 튄다)
    const items = [];
    for (let j = 0; j < NBs; j++) {
      let x, y, rk = 1, z = 0, stretch = null;
      const f = fly && fly.state[j];
      if (f && f.t0 === null && fly.start - orb.deg >= f.need) {   // 출구 각을 지나는 순서대로 한 알씩 출발. 궤도에서 돌던 빠르기(v0)를 그대로 이어받는다
        const T = posAt(j, t), a = (ANG[j] + orb.deg) * D, sp = DIST[j] * orb.dist * fling() * Math.abs(ORBIT) * orb.speed * D;
        f.t0 = t; f.p0 = T; f.v0 = [Math.sin(a) * sp, -Math.cos(a) * sp]; f.prev = T; }
      if (f && f.t0 !== null) {
        // 11-04 주형 3차: 쫀득하게 — 궤도 빠르기 그대로 튀어 나가(3차 베지어, 처음 기울기 = v0) 감속하며 고리 자리에 붙고, 닿으면 가던 방향으로 살짝 지나쳤다 돌아온다 (5차: 공 모양은 늘이거나 누르지 않는다)
        const D_ = RING.dur, P = 2.4, u = Math.min(1, (t - f.t0) / D_), e = 1 - Math.pow(1 - u, P), R = ringAt(j, t), T = [fly.c[0] + R.x * fly.k, fly.c[1] + R.y * fly.k];
        const P1 = [f.p0[0] + f.v0[0] * D_ / (3 * P), f.p0[1] + f.v0[1] * D_ / (3 * P)], P2 = [T[0] + (P1[0] - T[0]) * .3, T[1] + (P1[1] - T[1]) * .3], q = 1 - e;
        x = q * q * q * f.p0[0] + 3 * q * q * e * P1[0] + 3 * q * e * e * P2[0] + e * e * e * T[0]; y = q * q * q * f.p0[1] + 3 * q * q * e * P1[1] + 3 * q * e * e * P2[1] + e * e * e * T[1];
        rk = 1 + (fly.k * (1 + RING.depth * R.z) - 1) * e; z = 2 - e + R.z * e;
        const tl = t - f.t0 - D_;
        if (tl < 0) { const vx = x - f.prev[0], vy = y - f.prev[1]; if (Math.hypot(vx, vy) > 1e-4) f.la = Math.atan2(vy, vx) / D; }   // 날아가는 방향만 기억 (닿을 때 그 방향으로 살짝 지나쳤다 돌아옴)
        else { const w = Math.exp(-tl * 9), la = (f.la || 0) * D; x += Math.cos(la) * .16 * fly.k * w * Math.sin(tl * 26); y += Math.sin(la) * .16 * fly.k * w * Math.sin(tl * 26); }
        f.prev = [x, y];
      } else if (ringLive && ring) { const R = ringAt(j, t); x = R.x; y = R.y; rk = 1 + RING.depth * R.z; z = R.z; }
      else { const T = posAt(j, t), bb = bob(j, t); x = T[0] + bb[0]; y = T[1] + bb[1]; }   // 11-05 5차: 궤도 위에서만 (튐·크기 변화 없음)
      renderStone(j, t, x, y, 1, { rk, stretch }); items.push({ j, z });
    }
    stack(items);
  }
  // ---------- 시각표 (원본 그대로) ----------
  const SPL = { shut: .25, closeAt: .10, closeRamp: .45, press: .55, gooAt: .60, bigGone: .95, grow: .50, moveAt: .04, moveStep: .05, moveRamp: .62, settle: 1.05, openRamp: .42, openStep: .06, eyeAt: 1.32, eyeStep: .06, eyeLen: .30, len: 2.45 };
  const MRG = { shut: .22, shutStep: .04, closeAt: .12, closeRamp: .40, gooAt: .72, moveLen: .62, moveStep: .04, shrinkAt: .45, shrinkLen: .38, growAt: .12, growRamp: .55, settle: 1.0, openRamp: .45, eyeAt: 1.28, eyeLen: .30, len: 2.4 };
  // 11-05 진규: 카드 뽑기 로딩 '싹 틔우기' — 돌던 공이 눈 감고 끈적하게 한 덩어리로 뭉침(gather) → 덩어리가 숨 쉼 → 공이 하나씩 덩어리 가장자리에서
  //   부풀어 오르다(swell) 톡 떨어져 궤도로 튀어 나가고(fly, 스프링) 눈을 뜬다. 덩어리는 싹이 나갈수록 작아지고 마지막 싹과 함께 사라진다. 끝나면 'many' 로 (그다음 exitTo).
  //   값: 눈 감김·띠 닫힘·스프링은 수렴(MRG)·분화(SPL)와 같은 식, 예비 부풀기 = 피그마 Lilguy 공부 프레임의 '예비 동작'
  //   2차(진규 피드백): 싹은 뿅 튀어 나갔다(궤도를 지나쳤다) 돌아옴 · 싹 사이 간격이 점점 짧아짐 · 마지막은 남은 덩어리가 그대로 공이 됨 ·
  //   덩어리 색 = 고른 방식 색, 진하게 시작해 뭉치고 싹이 날수록 연해짐 · 가운데 덩어리도 싹 쪽으로 쏠렸다가 떨어질 때 반대로 밀리며 출렁(반작용)
  //   3차(진규 피드백): 덩어리 색을 몽글몽글한 그라데이션으로(밝은 빛 → 채도 높인 고른 색 → 진한 가장자리, 대비 있게) ·
  //   마지막도 다른 싹처럼 뿅 튀어나오고(조금 더 크게 출렁) 남은 가운데는 오므라들며 사라짐 (2차의 '남은 덩어리가 공이 됨'은 뺌)
  const BUD = { shut: .22, gatherAt: .18, gatherLen: .5, gatherStep: .03, growLen: .55, budAt: 1.0, AT: [0, .5, .9, 1.25, 1.55, 2.0], swell: .24, fly: [.36, 11], flyLast: [.28, 10], vanish: .34, openRamp: .42, eyeAt: .3, eyeLen: .3, shrink: .09, breathe: [.04, .62], lean: .1, recoil: [.28, 6, 14], ORDER: [3, 5, 2, 1, 0, 4], len: 4.3 };
  const boing = (t, z, w) => { if (t <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t)); };   // 덜 감쇠한 스프링 — 지나쳤다 돌아옴
  const rgb = (c) => `rgb(${c.join(",")})`;
  let budDone = null, budWait = false;   // budWait: 아직 갈라지는 중(split)이면 다 갈라진 뒤 바로 시작
  let mode = "off", tPhase = 0, lastT = null, raf = 0, holdU = null;   // 12판 holdU: 발산 튜토리얼 티즈가 분화 시각을 직접 정함 (null = 평소)
  const now = () => performance.now() / 1000;
  function frame(t) {
    const dt = lastT === null ? 0 : Math.min(.1, t - lastT); lastT = t;
    [BIG, ...SM].forEach(S => { S.spinT += dt * S.spinV; });
    const cur = typeof COMET !== "undefined" ? COMET.cur() : null;
    if (cur !== "D4") { ring = null; ringLive = false; fly = null; }   // 카드 덱을 나오면 고리·날기 끝
    if (cur === "D2" && typeof BEODIAL !== "undefined") {   // 11-05 주형: 발산 방식 시트 — 다이얼은 공 색만 바꾼다(움직임은 발산 홈 그대로 하나로)
      const cl = BEODIAL.color(); orb.tSpeed = 1.8; orb.tDist = 1;   /* 시트가 열려 있는 동안만 아주 살짝 빠르게(1.8배) */ orb.rate = 4; tune.tint = cl.rgb; tune.tkT = cl.k; tune.chaosT = 0;
    } else if (cur !== "D4") { orb.tDist = 1; orb.tSpeed = 1; orb.rate = 4; tune.tkT = 0; tune.chaosT = 0; }   // 발산 홈 등: 원래대로 (카드 덱에선 고른 느낌 그대로 이어감)
    { const kt = 1 - Math.exp(-6 * dt); tune.tk += (tune.tkT - tune.tk) * kt; tune.chaos += (tune.chaosT - tune.chaos) * kt;
      for (let j = 0; j < offs.length; j++) offs[j] *= 1 - Math.min(1, dt * 2); }   // 11-05 2차: 궤도 모양은 그대로(공마다 따로 놀기 뺌) — 남아 있던 어긋남만 풀어 준다
    const ko = 1 - Math.exp(-orb.rate * dt); orb.dist += (orb.tDist - orb.dist) * ko;
    // 11-04 주형 5차: 빨라질 땐 스프링(덜 감쇠)이라 살짝 넘쳤다 돌아온다 = 쫀득. 느려질 땐 거꾸로 돌지 않게 그냥 스르르
    if (orb.tSpeed > orb.speed || orb.sv > 0) { const w = orb.rate * 1.7; orb.sv += (w * w * (orb.tSpeed - orb.speed) - 2 * .42 * w * orb.sv) * dt; orb.speed += orb.sv * dt; if (orb.tSpeed < orb.speed && orb.sv < 0) orb.sv = 0; }
    else { orb.sv = 0; orb.speed += (orb.tSpeed - orb.speed) * ko; }
    orb.deg += ORBIT * orb.speed * dt;
    const blinkBig = liveEyes(BIG, t, dt); SM.forEach((S, j) => { S.lilOut = lilguy(S.lil, OBJ[j], t); });
    const Wb = wobS(t); placeBlob(NBs, 0, 0, 0);
    if (mode === "one") { SM.forEach((_, j) => hideStone(j)); drawSphere(BIG, { x: 0, y: 0, r: breathe(t), closeF: 0, shut: blinkBig, gaze: BIG.gazeCur, W: Wb }); }
    else if (mode === "split") {
      const u = holdU !== null ? holdU : t - tPhase;   // 12판: 티즈 중이면 되감기는 시각
      if (u < SPL.gooAt) {   // 큰 공: 눈이 감기며 사라지고(1판 방식) 띠가 닫혀 검은 공, 살짝 눌림
        SM.forEach((_, j) => hideStone(j));
        drawSphere(BIG, { x: 0, y: 0, r: 1 - .05 * Math.sin(Math.PI * clamp(u / SPL.press)), closeF: spring(u - SPL.closeAt, SPL.closeRamp), shut: blinkBig, open: 1 - sm(u / SPL.shut), gaze: BIG.gazeCur, W: Wb });
      } else {
        hideSphere(BIG); const u2 = u - SPL.gooAt;
        { const rb = 1 - sm(u2 / SPL.bigGone); placeBlob(NBs, 0, 0, rb > .2 ? rb : 0); }
        for (let j = 0; j < NBs; j++) {
          const kg = sm(u2 / SPL.grow), km = spring(u2 - SPL.moveAt - SPL.moveStep * j, SPL.moveRamp), T = posAt(j, t);
          const x = START[j][0] + (T[0] - START[j][0]) * km, y = START[j][1] + (T[1] - START[j][1]) * km;
          const bb = bob(j, t), bk = sm((u2 - SPL.settle) / .5), px = x + bb[0] * bk, py = y + bb[1] * bk;
          const uo = u2 - SPL.settle - SPL.openStep * j, auraK = sm((u2 - SPL.settle + .25 - SPL.openStep * j) / .5);
          if (uo < 0) {   // 슬라임 덩어리: 움직이는 쪽으로 늘어난다
            hideStone(j); setTint(SM[j], j, auraK);
            const stretch = .30 * Math.sin(Math.PI * clamp((u2 - SPL.moveAt - SPL.moveStep * j) / (SPL.moveRamp * 1.15)));
            placeBlob(j, px, py, RSM[j] * kg, stretch, angTo(START[j], T));
          } else renderStone(j, t, px, py, auraK, { closeF: 1 - spring(uo, SPL.openRamp), open: easeOutL((u2 - SPL.eyeAt - SPL.eyeStep * j) / SPL.eyeLen) });   // 띠가 스프링으로 열리고 → 눈이 세로로 자라나며 뜬다
        }
      }
      if (u >= SPL.len && holdU === null) { mode = "many"; tPhase = t; }
    } else if (mode === "many") {
      hideSphere(BIG); drawMany(t, dt);
    }
    if (budWait && mode === "many") { budWait = false; mode = "bud"; tPhase = t; }   // 11-05 진규: 갈라지기 끝나자마자 싹 틔우기
    if (mode === "bud") {   // 11-05 진규: 카드 뽑기 로딩 '싹 틔우기' (위 BUD 설명)
      const u = t - tPhase, B = BUD, nb = B.AT.length, kLast = nb - 1;
      const at = (k) => B.budAt + B.AT[k];
      // 색 5차(진규): 그라데이션 말고 진한 단색 — 고른 색(다이얼 가운데면 남보라)을 채도 1.7배로 올리고 35% 어둡게 (6차: 더 진하게)
      const popped = B.AT.reduce((s, _, k) => s + sm((u - at(k) - B.swell) / .3), 0);   // 떨어져 나간 싹 수 (하나당 .3초에 걸쳐 1 씩)
      //   8차(진규): 투명한 색 블록을 겹쳐 놓은 것처럼 — 공 하나 = 고른 색 한 장. 여섯 장이 겹치면 진하고(곱하기로 겹침),
      //   싹이 하나 떨어질 때마다 한 장씩 빠져 연해지고, 마지막 한 장만 남으면 원래 색 그대로. (여섯 장을 다 곱하면 거의 검정이라 겹침 세기 .5)
      const base = tune.tk > .15 ? tune.tint : [128, 108, 200], layers = 1 + Math.max(0, nb - 1 - popped) * .5;   // 마지막 한 장 = 원래 색에서 멈춤
      const blobC = base.map(c => Math.round(255 * Math.pow(c / 255, layers))), blobS = rgb(blobC);
      const stoneC = (j) => tune.tk > .004 ? mixA(hex(OBJ[j].color), tune.tint, tune.tk) : hex(OBJ[j].color);
      const fillBlob = (i, c) => { blobEls[i].setAttribute("fill", c); if (i < NBs) SM[i].tintKey = null; };   // 직접 칠함 → 다음 setTint 가 다시 칠하게
      // 가운데 덩어리: 커짐 · 숨 · 싹이 나갈수록 작아짐 · 싹 쪽으로 쏠렸다가(lean) 떨어질 때 반대로 밀리며 출렁(recoil)
      const pulse = 1 + B.breathe[0] * Math.sin(2 * Math.PI * Math.max(0, u - B.gatherAt - B.gatherLen) / B.breathe[1]) * sm((u - B.gatherAt - B.gatherLen) / .3);
      let ox = 0, oy = 0, st = 0, sa = 0;
      B.AT.forEach((_, k) => { const ub = u - at(k); if (ub < 0) return; const a = Math.atan2(posAt(B.ORDER[k], t)[1], posAt(B.ORDER[k], t)[0]);
        let m = 0, s = 0; if (ub < B.swell) { const e = sm(ub / B.swell); m = B.lean * e; s = .1 * e; }
        else { const uf = ub - B.swell, [A, z, w] = B.recoil, damp = Math.exp(-z * uf); m = B.lean * damp * Math.cos(w * uf) - A * damp * Math.sin(w * uf); s = -.14 * damp * Math.cos(w * uf * 1.1); }
        ox += Math.cos(a) * m; oy += Math.sin(a) * m; if (Math.abs(s) > Math.abs(st)) { st = s; sa = a / D; } });
      // 마지막 싹이 떨어지면 남은 가운데는 오므라들며 사라짐
      const bigR = sm((u - B.gatherAt) / B.growLen) * (1 - B.shrink * popped) * pulse * (1 - sm((u - at(kLast) - B.swell + .02) / B.vanish));
      hideSphere(BIG); fillBlob(NBs, blobS);
      placeBlob(NBs, ox, oy, bigR <= .14 ? 0 : bigR, st, sa);
      B.ORDER.forEach((j, k) => {
        const T = posAt(j, t), bb = bob(j, t), a = Math.atan2(T[1], T[0]), dir = [Math.cos(a), Math.sin(a)];
        const ub = u - at(k);
        if (ub < 0) {   // 뭉치기: 눈 감고 띠 닫히고 → 가운데로 빨려 들어 덩어리에 섞임 (수렴과 같은 식, 색은 덩어리 색으로)
          if (u < B.shut + .05) { renderStone(j, t, T[0] + bb[0], T[1] + bb[1], 1, { closeF: spring(u, B.shut), open: 1 - sm(u / B.shut) }); return; }
          hideStone(j); gatherBlob(j, T, a); return;
        }
        const edge = .62 * bigR;   // 덩어리 가장자리 (덩어리가 쏠린 만큼 따라감)
        if (ub < B.swell) {   // 싹: 가장자리에서 부풀어 오름 (덩어리에 붙어 있어 끈적한 목)
          hideStone(j); fillBlob(j, blobS); const e = ub / B.swell, d = edge + .34 * e * e;
          placeBlob(j, ox + dir[0] * d, oy + dir[1] * d, RSM[j] * (.35 + .75 * sm(e)), .12 * e, a / D); return;
        }
        const [fz, fw] = k === kLast ? B.flyLast : B.fly, uf = ub - B.swell, km = boing(uf, fz, fw), d0 = edge + .34, P0 = [dir[0] * d0, dir[1] * d0];   // 뿅 — 궤도를 지나쳤다 돌아옴
        const x = P0[0] + (T[0] + bb[0] * sm(uf / .8) - P0[0]) * km, y = P0[1] + (T[1] + bb[1] * sm(uf / .8) - P0[1]) * km;
        const uo = uf - B.eyeAt, sp = Math.abs(1 - km);
        if (uo < 0) { hideStone(j); fillBlob(j, blobS); placeBlob(j, x, y, RSM[j] * 1.08, .3 * Math.min(1, sp * 1.4), a / D); return; }   // 날아가며 진행 방향으로 늘어남
        placeBlob(j, x, y, 0);
        renderStone(j, t, x, y, 1, { closeF: 1 - spring(uo, B.openRamp), open: easeOutL((uo - .12) / B.eyeLen) });   // 띠 열리고 눈 뜸 · 제 색
      });
      function gatherBlob(j, T, a) { const km = easeIOs((u - B.gatherAt - B.gatherStep * j) / B.gatherLen), r = RSM[j] * (1 - sm((u - B.gatherAt - .2 - B.gatherStep * j) / .35));
        const kc = sm((u - .15) / .4); fillBlob(j, kc > .97 ? blobS : rgb(mixA(stoneC(j), blobC, kc)));   // 제 색 → 덩어리 색 → 덩어리 그라데이션
        placeBlob(j, T[0] * (1 - km), T[1] * (1 - km), r, .3 * Math.sin(Math.PI * clamp((u - B.gatherAt - B.gatherStep * j) / (B.gatherLen * 1.1))), a / D + 180); }
      if (u >= B.len) { mode = "many"; blobEls[NBs].removeAttribute("fill"); SM.forEach(S => { S.tintKey = null; }); const d = budDone; budDone = null; d && d(); }   // 큰 덩어리 색은 원래(잉크)로 — 수렴·분화가 그대로 쓰게
    } else if (mode === "merge") {
      const u = t - tPhase;
      if (u < MRG.gooAt) {   // 공마다 눈 감고 띠 닫힘
        hideSphere(BIG);
        for (let j = 0; j < NBs; j++) { const T = posAt(j, t), bb = bob(j, t); renderStone(j, t, T[0] + bb[0], T[1] + bb[1], 1 - sm(u / .5), { closeF: spring(u - MRG.closeAt - MRG.moveStep * j, MRG.closeRamp), open: 1 - sm((u - MRG.shutStep * j) / MRG.shut) }); }
      } else {
        const u2 = u - MRG.gooAt, bigR = spring(u2 - MRG.growAt, MRG.growRamp);
        if (u2 < MRG.settle) {   // 슬라임: 가운데로 빨려 들어가 한 덩어리
          hideSphere(BIG); placeBlob(NBs, 0, 0, bigR > .2 ? bigR : 0);
          for (let j = 0; j < NBs; j++) {
            hideStone(j);
            const T = posAt(j, t), km = easeIOs((u2 - MRG.moveStep * j) / MRG.moveLen), bb = bob(j, t), bk = 1 - sm(u2 / .3);
            const x = T[0] * (1 - km) + bb[0] * bk, y = T[1] * (1 - km) + bb[1] * bk;
            const r = RSM[j] * (1 - sm((u2 - MRG.shrinkAt - MRG.moveStep * j) / MRG.shrinkLen));
            const stretch = .30 * Math.sin(Math.PI * clamp((u2 - MRG.moveStep * j) / (MRG.moveLen * 1.1)));
            placeBlob(j, x, y, r, stretch, Math.atan2(-T[1], -T[0]) / D);
          }
        } else {   // 한 공: 띠 열리고 눈 뜨며 살짝 튕김
          SM.forEach((_, j) => hideStone(j));
          const uo = u2 - MRG.settle, bn = .06 * Math.sin(Math.PI * clamp(uo / .45));
          drawSphere(BIG, { x: 0, y: -bn * .3, r: 1, sx: 1 - bn * .5, sy: 1 + bn, closeF: 1 - spring(uo, MRG.openRamp), shut: blinkBig, open: easeOutL((u2 - MRG.eyeAt) / MRG.eyeLen), gaze: BIG.gazeCur, W: Wb });
        }
      }
      if (u >= MRG.len) { mode = "done"; SM.forEach((S, j) => setTint(S, j, 0)); }
    }
  }
  function loop() { if (mode === "off") return; frame(now()); spinT = BIG.spinT; raf = requestAnimationFrame(loop); }   // 11-04: 엔진 행성 자전각(mascot_core 의 spinT)을 슬라임 큰 공과 계속 맞춘다 → 돌아올 때 줄무늬가 바뀌지 않음
  function show(on) { svg.style.display = on ? "block" : "none"; }
  // 7차: 폰 밖 버튼 '모서리 고리 켬/끔' — '온보딩부터' 버튼 옆 (launch_app.js 가 그 버튼을 만든 뒤에 붙인다)
  document.addEventListener("DOMContentLoaded", () => { const ctl = $("ctl"); if (!ctl) return;
    const b = document.createElement("button"); b.id = "btnCornerRing"; b.type = "button";
    const paint = () => { const on = ringOn(); b.textContent = on ? "모서리 고리 켬" : "모서리 고리 끔"; b.setAttribute("aria-pressed", String(on)); b.title = on ? "카드 덱 오른쪽 위: 사선 고리로 흔들리며 돈다" : "카드 덱 오른쪽 위: 평평한 원 궤도, 가운데 좁게"; };
    b.onclick = () => { try { localStorage.setItem(RING_KEY, ringOn() ? "0" : "1"); } catch (e) {} paint(); if (ring) ring.tilt = ringOn(); };
    paint(); const ob = $("btnObFirst"); ob ? ob.after(b) : ctl.insertBefore(b, $("btnRestart")); });
  return {
    SPL, MRG,
    start(spinT) { BIG.spinT = spinT || 0; mode = "one"; lastT = null; show(true); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); },   // 엔진 행성과 같은 자전 각에서 이어받는다
    split() { if (mode === "one") { mode = "split"; tPhase = now(); } },
    merge() { if (mode === "many" || mode === "split") { mode = "merge"; tPhase = now(); } },
    hold(u) { if (u === null) { holdU = null; if (mode === "split") mode = "one"; return; } holdU = u; if (mode === "one") mode = "split"; },   // 12판: 발산 튜토리얼 티즈 (launch2_director.js teaseU)
    stop() { spinT = BIG.spinT; mode = "off"; cancelAnimationFrame(raf); show(false); SM.forEach((S, j) => setTint(S, j, 0)); },
    bud(onDone) { if (mode === "split") { budWait = true; budDone = onDone || null; return true; } if (mode !== "many") return false; mode = "bud"; tPhase = now(); budDone = onDone || null; return true; },   // 11-05 진규: 카드 뽑기 로딩 '싹 틔우기' (돌고 있거나 갈라지는 중일 때)
    budding: () => mode === "bud" || budWait,
    orbit(dist, speed, rate = 4) { orb.tDist = dist; orb.tSpeed = speed; orb.rate = rate; },   // 11-04 주형: 궤도 크기(1 = 원래)·도는 빠르기(1 = 원래)로 부드럽게 옮겨 간다
    // 11-04 주형: 한 줄로 빠져나가기. c = 무대 안 좌표(공 반지름 1 단위, y 위로)로 본 모서리 고리 가운데, k = 모서리 무대 크기 / 지금 무대 크기. 다 도착하면 onDone (그 프레임에 무대를 모서리로 옮길 것)
    exitTo(c, k, onDone) { const tilt = ringOn(); if (mode !== "many") { ring = { deg: 0, t0: now(), tilt }; ringLive = true; onDone && onDone(); return; }
      // 7차: 출구 = 궤도 위에서 '도는 방향(시계)이 모서리를 곧장 향하는' 자리 (10시 언저리). 모서리 쪽(1~2시)에서 빠지면 12시를 넘겨 한 번 꺾였다
      const r = 1.5 * (1 + .14); let aExit = 0, best = -2;
      for (let d = 0; d < 360; d += 1) { const a = d * D, px = r * Math.cos(a), py = r * Math.sin(a), dx = c[0] - px, dy = c[1] - py, l = Math.hypot(dx, dy), dot = (Math.sin(a) * dx - Math.cos(a) * dy) / l; if (dot > best) { best = dot; aExit = d; } }
      aExit += 10;   // 빠른 공은 한 프레임에 6°쯤 지나가서 늦게 빠지면 살짝 휜다 → 10° 앞에서 출발
      ring = { deg: 0, t0: now(), tilt }; ringLive = false; orb.tSpeed = 40; orb.rate = 3.5; tune.chaosT = 0;   // 빠져나갈 땐 물결을 풀어 매끈하게
      fly = { c, k, onDone, start: orb.deg, state: SM.map((_, j) => ({ need: ((((ANG[j] + orb.deg) - aExit) % 360) + 360) % 360, t0: null })) }; },
    mode: () => mode, active: () => mode !== "off",
  };
})();
