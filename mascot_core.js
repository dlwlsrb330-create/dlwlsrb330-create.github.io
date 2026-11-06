// mascot_core.js — comet4.html 의 도우미·띠(2판 행성 + 나선)·눈 ③·리액션 부분을 그대로 떼어 둔 것 (measure/build_comet5.py 가 다시 만든다). 페이지에 #Planet, #seatL.. #pupR 가 있어야 한다
// ---------- Comet 마스코트 4판 ----------
// 대기 = comet.html 2판 행성 그대로(값·식 복사). 바뀐 것: 생각중 = 띠가 눈 둘레 축의 나선(헬릭스)으로 3차원에서 감겨 든다(거리장 소용돌이 없음).
// 눈과 띠는 같은 회전 행렬을 받으므로 한 몸. 리액션(도리도리·놀람·기쁨·하트)은 눈과 몸만으로. 값의 출처: measure/evidence.md
const NS = "http://www.w3.org/2000/svg", $ = (id) => document.getElementById(id), D = Math.PI / 180;
{ const q = new URLSearchParams(location.search); if (q.has("embed")) document.documentElement.dataset.embed = "1"; }
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
function bez(x1, y1, x2, y2) { return (t) => { t = clamp(t); let lo = 0, hi = 1, s = .5; for (let i = 0; i < 24; i++) { s = (lo + hi) / 2; const x = 3*(1-s)**2*s*x1 + 3*(1-s)*s*s*x2 + s**3; if (x < t) lo = s; else hi = s; } return 3*(1-s)**2*s*y1 + 3*(1-s)*s*s*y2 + s**3; }; }
const EASE_OUT_QUINT = bez(.23, 1, .32, 1), RATCHET = bez(.5, 0, .3, 1), EXPRESS = bez(.33, 0, .2, 1);
function pop(t) { if (t <= 0) return 0; const z = .5, w = 22, wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t)); }
let RAMP_CUR = .30; const _sp = { t: -1, x: 0, v: 0 };
function springRamp(t) {   // M3 스프링(감쇠 .6 강성 200), 목표는 RAMP 초 S
  if (t <= 0) return 0; if (_sp.t < 0 || t < _sp.t) { _sp.t = 0; _sp.x = 0; _sp.v = 0; }
  const z = .6, w = Math.sqrt(200), dt = .001;
  while (_sp.t + dt <= t) { const tgt = sm((_sp.t + dt) / RAMP_CUR); _sp.v += (w * w * (tgt - _sp.x) - 2 * z * w * _sp.v) * dt; _sp.x += _sp.v * dt; _sp.t += dt; }
  return _sp.x;
}
// ---------- 3D ----------
const V3 = { dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; } };
const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
function axisAngle(ax, th) { if (Math.abs(th) < 1e-9) return I3; const [x, y, z] = V3.norm(ax), c = Math.cos(th), s = Math.sin(th), C = 1 - c; return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]]; }
const mm = (A, B) => A.map(r => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
const mv = (M, p) => [M[0][0] * p[0] + M[0][1] * p[1] + M[0][2] * p[2], M[1][0] * p[0] + M[1][1] * p[1] + M[1][2] * p[2], M[2][0] * p[0] + M[2][1] * p[1] + M[2][2] * p[2]];
const rz = (deg) => axisAngle([0, 0, 1], deg * D), ry = (deg) => axisAngle([0, 1, 0], deg * D), rx = (deg) => axisAngle([1, 0, 0], deg * D);
const sph = (lon, lat) => [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
function slerp(a, b, k) {
  const d = clamp(V3.dot(a, b), -1, 1);
  if (d > .9995) return V3.norm([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]);
  if (d < -.9995) { const q = V3.norm(V3.cross(a, Math.abs(a[1]) < .9 ? [0, 1, 0] : [1, 0, 0])); return k < .5 ? slerp(a, q, k * 2) : slerp(q, b, k * 2 - 1); }
  const th = Math.acos(d), s = Math.sin(th), wa = Math.sin((1 - k) * th) / s, wb = Math.sin(k * th) / s;
  return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb];
}
function clipFront(pts) {   // 앞쪽 반구만, 잘린 자리는 테두리 원호로 (2판 그대로)
  const out = [];
  for (let i = 0; i < pts.length; i++) { const A = pts[i], B = pts[(i + 1) % pts.length], inA = A[2] >= 0, inB = B[2] >= 0;
    if (inA) out.push({ p: A });
    if (inA !== inB) { const t = clamp(A[2] / (A[2] - B[2])); let x = A[0] + (B[0] - A[0]) * t, y = A[1] + (B[1] - A[1]) * t; const l = Math.max(Math.hypot(x, y), 1e-9); out.push({ p: [x / l, y / l, 0], cut: inA ? "exit" : "enter" }); } }
  if (out.length < 3) return [];
  const res = [];
  for (let i = 0; i < out.length; i++) { const a = out[i], b = out[(i + 1) % out.length]; res.push(a.p);
    if (a.cut === "exit" && b.cut === "enter") { const a0 = Math.atan2(a.p[1], a.p[0]); let d = Math.atan2(b.p[1], b.p[0]) - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      const n = Math.ceil(Math.abs(d) / .05); for (let k = 1; k < n; k++) res.push([Math.cos(a0 + d * k / n), Math.sin(a0 + d * k / n), 0]); } }
  return res;
}
const toD = (polys) => polys.filter(p => p.length > 2).map(p => "M" + p.map(q => q[0].toFixed(4) + " " + q[1].toFixed(4)).join("L") + "Z").join("");

// ---------- 눈 자리 (2판 값) ----------
const EYE_POS = [-0.28, -0.364];
const ANCHOR = (() => { const [x, y] = EYE_POS; return [x, y, Math.sqrt(1 - x * x - y * y)]; })();
function tangent(Pt) { const lon = Math.atan2(Pt[0], Pt[2]), lat = Math.asin(clamp(Pt[1], -1, 1)); return { e1: [Math.cos(lon), 0, -Math.sin(lon)], e2: [-Math.sin(lat) * Math.sin(lon), Math.cos(lat), -Math.sin(lat) * Math.cos(lon)] }; }
const TO_POLE = (() => { const ax = V3.norm(V3.cross(ANCHOR, [0, 0, 1])), ang = Math.acos(clamp(ANCHOR[2], -1, 1)) * 180 / Math.PI; return { ax, ang }; })();
const AT = tangent(ANCHOR);   // 눈 자리 접평면: e1 가로, e2 세로. 나선의 축 = ANCHOR
const local2body = (x, y, z) => [AT.e1[0] * x + AT.e2[0] * y + ANCHOR[0] * z, AT.e1[1] * x + AT.e2[1] * y + ANCHOR[1] * z, AT.e1[2] * x + AT.e2[2] * y + ANCHOR[2] * z];

// ---------- 띠: 중심선 함수 → 리본 (대기 = 2판 값 그대로, 생각중 = 눈 축 나선) ----------
const PL = { period: 14, tilt: 9, widths: [11, 16, 19, 19, 16, 11], lats: [82, 50, 14, -24, -60, -82], amp: 6 };
// 나선: 눈 축에서 본 '화면 반지름' r 이 한 바퀴마다 dr 씩 고르게 커지는 아르키메데스 나선(각도가 아니라 r 기준이라 가장자리까지 간격이 같다).
// r0 는 눈 모자(r≈.45) 밑에서 시작해 0.7바퀴쯤 붙어 돌다 떨어진다(주형 think 의 코어에 붙은 나선). r>1 은 뒤쪽 반구로 이어진다
const HX = { r0: .38, dr: .20, wr: .07, taper: .35, capLat: 76, capW: 13, tilt: 20 };
function helixTheta(st) {   // st = 누적 바퀴 수 → 축에서 잰 각(라디안) 중심과 반폭
  // 바깥 가장자리가 r=1(테두리)에 닿으면 거기 붙어 돌고, 안쪽 가장자리가 따라와 닿으면 폭이 0 → 꼬리가 테두리를 타고 가늘어진다 (몸 윤곽이 둥글게 남음)
  const r = HX.r0 + HX.dr * st, th = (rr) => Math.asin(clamp(rr, 0, 1));
  const a = th(r - HX.wr), b = th(r + HX.wr);
  return { thc: (a + b) / 2, w: (b - a) / 2 };
}
const NB = 6, N = 180;
function centerIdle(j, s) { const lon = 2 * Math.PI * s, lat = PL.lats[j] + (Math.abs(PL.lats[j]) > 70 ? 0 : PL.amp * Math.sin(2 * lon + .4 * j)); return sph(lon, lat * D); }
function halfIdle(j, s) { const lon = 2 * Math.PI * s; return PL.widths[j] * D * (Math.abs(PL.lats[j]) > 70 ? 1 : .7 + .3 * Math.sin(lon + 2.1 * j)); }
function centerHelix(j, s) {
  const lon = 2 * Math.PI * s; let lat;
  if (j === 0) lat = HX.capLat * D; else if (j === NB - 1) lat = -HX.capLat * D; else lat = Math.PI / 2 - helixTheta(j - 1 + s).thc;
  const cl = Math.cos(lat); return local2body(cl * Math.cos(lon), cl * Math.sin(lon), Math.sin(lat));
}
function halfHelix(j, s) { if (j === 0 || j === NB - 1) return HX.capW * D; const st = j - 1 + s; return helixTheta(st).w * (.85 + .15 * Math.sin(2 * Math.PI * 1.37 * st)) * sm(st / HX.taper); }
function ribbons(center, half) {   // 띠마다 181 점(0..180) 양쪽 가장자리. 대기는 180 = 0 (닫힘), 나선은 180 = 다음 띠의 0 (이어짐)
  const out = [];
  for (let j = 0; j < NB; j++) {
    const C = []; for (let i = -1; i <= N + 1; i++) C.push(center(j, i / N));
    const L = [], R = [];
    for (let i = 0; i <= N; i++) {
      const c = C[i + 1], a = C[i], b = C[i + 2], t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], nn = V3.norm(V3.cross(c, t));
      const w = half(j, i / N), cw = Math.cos(w), sw = Math.sin(w);
      L.push(V3.norm([c[0] * cw + nn[0] * sw, c[1] * cw + nn[1] * sw, c[2] * cw + nn[2] * sw]));
      R.push(V3.norm([c[0] * cw - nn[0] * sw, c[1] * cw - nn[1] * sw, c[2] * cw - nn[2] * sw]));
    }
    out.push({ L, R });
  }
  return out;
}
const RIB_IDLE = ribbons(centerIdle, halfIdle), RIB_HELIX = ribbons(centerHelix, halfHelix);
const bandEls = RIB_IDLE.map(() => { const p = document.createElementNS(NS, "path"); $("Planet").appendChild(p); return p; });
function drawRibbons(world) {   // world[j] = {L,R} 월드 좌표 → 11점 조각으로 끊어 앞 반구만
  world.forEach((rb, j) => {
    const polys = [];
    for (let a = 0; a < N; a += 10) {
      if (Math.hypot(rb.L[a][0] - rb.R[a][0], rb.L[a][1] - rb.R[a][1], rb.L[a][2] - rb.R[a][2]) < .004 && Math.hypot(rb.L[a + 10][0] - rb.R[a + 10][0], rb.L[a + 10][1] - rb.R[a + 10][1], rb.L[a + 10][2] - rb.R[a + 10][2]) < .004) continue;   // 폭 0 조각(나선 꼬리 끝)은 실선이 되므로 뺌
      const poly = []; for (let k = 0; k <= 10; k++) poly.push(rb.L[a + k]); for (let k = 10; k >= 0; k--) poly.push(rb.R[a + k]); polys.push(clipFront(poly)); }
    bandEls[j].setAttribute("d", toD(polys));
  });
}
const xf = (rib, M) => rib.map(rb => ({ L: rb.L.map(p => mv(M, p)), R: rb.R.map(p => mv(M, p)) }));
const blend = (A, B, m) => A.map((rb, j) => ({ L: rb.L.map((q, i) => slerp(q, B[j].L[i], m)), R: rb.R.map((q, i) => slerp(q, B[j].R[i], m)) }));
const AXIS = mv(rz(PL.tilt), [0, 1, 0]);
const wobM = (t) => mm(axisAngle([0, 0, 1], .03 * Math.sin(t * 1.1)), mm(axisAngle([0, 1, 0], .05 * Math.sin(t * .7 + 1)), axisAngle([1, 0, 0], .04 * Math.sin(t * .9 + 2))));
let spinT = 0, lastT = null;
const spinM = () => axisAngle(AXIS, -2 * Math.PI * spinT / PL.period);
// 생각중 몸·눈 회전: 눈 쌍을 가운데로(TO_POLE) + 살짝 위로 기울임 + 옆으로 75° 돌아 나갔다 오는 스윙 + 40° 기울임. m = 진행도
function morphR(m, W) { const sw = Math.sin(Math.PI * clamp(m)); return mm(W, mm(rz(40 * sw), mm(ry(75 * sw), mm(rx(-HX.tilt * clamp(m)), axisAngle(TO_POLE.ax, TO_POLE.ang * clamp(m) * D))))); }
const helixSpin = (phiDeg) => axisAngle(ANCHOR, phiDeg * D);   // 나선이 제 축(눈 축) 둘레로 도는 각
const UNWIND = 450;                                              // 들어올 때 반대로 감긴 채 풀린다 (변신방법.md 소용돌이 값)

// ---------- 눈 ③ (eyes3.js) 구에 박힌 두 패치 + 얇은 검은 테 (2판) ----------
const LG_HALF = 0.36, K = 1.25, GAP = 0.40, EYE_SIZE = { idle: 1.22, think: .95 };
const PERSP = (z) => .55 + .45 * z;
const IDLE_EYE = Object.assign({}, EYES3.P.open, { pm: 1, pw: .46, ph: .41 });   // 대기 = Lilguy circle 동공 (피그마 모드 배정: 기본 = circle)
// 하트 눈: 흰자 윤곽을 하트로 섞는다 (눈 폭·높이 기준)
const HEART = (() => { const pts = []; for (let i = 0; i < 112; i++) { const t = i / 112 * 2 * Math.PI; pts.push([Math.sin(t) ** 3 * .33, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 * .36]); } return pts; })();
function alignTo(ref, poly) {   // poly 를 ref 와 같은 방향·같은 시작점으로
  const area = (P) => { let A = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; A += p[0] * q[1] - q[0] * p[1]; } return A; };
  if (Math.sign(area(ref)) !== Math.sign(area(poly))) poly = poly.slice().reverse();
  let best = 0, bd = 1e9; for (let i = 0; i < poly.length; i++) { const d = Math.hypot(poly[i][0] - ref[0][0], poly[i][1] - ref[0][1]); if (d < bd) { bd = d; best = i; } }
  return poly.slice(best).concat(poly.slice(0, best));
}
function drawEyesOn(p, R, size, gaze, heartK) {
  const h = LG_HALF * size;
  for (const [id, side] of [["eyeL", -1], ["eyeR", 1]]) {
    const c0 = V3.norm([0, 1, 2].map(i => ANCHOR[i] + h * K * side * GAP * AT.e1[i]));
    const c = mv(R, c0), Tc = tangent(c0), u = mv(R, Tc.e1), v = mv(R, Tc.e2), hh = h * PERSP(c[2]);
    const poly = (pts) => { let d = ""; for (const q of pts) { const U = q[0] * K, W = q[1] * K; d += (d ? "L" : "M") + (c[0] + hh * (U * u[0] + W * v[0])).toFixed(4) + " " + (c[1] + hh * (U * u[1] + W * v[1])).toFixed(4); } return d + "Z"; };
    const hide = c[2] < .2, e = EYES3.eye(p, side, gaze);   // 스쳐 보이는 각(가장자리)에선 조각이 되므로 숨김
    let white = e.white, pupil = e.pupil;
    if (heartK > 0) { const hp = alignTo(white, HEART.map(q => [q[0] * 1.15, q[1] * 1.15])); white = white.map((q, i) => [q[0] + (hp[i][0] - q[0]) * heartK, q[1] + (hp[i][1] - q[1]) * heartK]); if (heartK > .5) pupil = null; }
    $(id).setAttribute("d", hide ? "" : poly(white));
    const seat = heartK > 0 ? white : EYES3.eye(EYES3.P.open, side, [0, 0]).white;   // 눈 둘레 얇은 검은 테(2판). 하트 눈일 땐 하트를 따라간다(테가 눈 모양과 어긋나면 눈만 붙인 느낌)
    $(id === "eyeL" ? "seatL" : "seatR").setAttribute("d", hide ? "" : poly(seat.map(q => [q[0] * 1.28, q[1] * 1.28])));
    $(id === "eyeL" ? "pupL" : "pupR").setAttribute("d", hide || !pupil ? "" : poly(pupil));
  }
}
const withClose = (p, b) => EYES3.withClose(p, b);
const BL_CLOSE = .184, BL_OPEN = .29, easeOutL = (x) => { x = clamp(x); return 1 - (1 - x) ** 2.2; };
function blinkCurve(u, c, h, o) { if (u < 0) return 0; if (u < c) return sm(u / c); if (u < c + h) return 1; if (u < c + h + o) return 1 - easeOutL((u - c - h) / o); return 0; }
let seed = 1; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let nextBlink = 2.5, blinkT0 = -9, gazeTgt = [0, 0], gazeCur = [0, 0], nextGaze = 1.5, tau = .25;
function holdGaze(m, ht) { return m === "idle" ? gazeCur : [.10 + .03 * Math.sin(ht * 1.3), .12]; }
const ratchetAt = (ht) => 360 * RATCHET((ht / 1.6) % 1) + 360 * Math.floor(ht / 1.6);

// ---------- 리액션 (눈·몸만): 도리도리 / 놀람 / 기쁨 / 하트 ----------
const REACT_LEN = { shake: 1.5, surprise: 1.1, happy: 1.6, heart: 1.9 };
let react = null;   // { type, t0 }
function reactAt(t) {   // → { R: 몸·눈 회전, sx, sy, dy, eyeP, eyeK(표정 섞기), size, heartK }
  const o = { R: I3, sx: 1, sy: 1, dy: 0, eyeP: null, eyeK: 0, size: 1, heartK: 0 };
  if (!react) return o;
  const u = t - react.t0, ty = react.type;
  if (u >= REACT_LEN[ty]) { react = null; return o; }
  if (ty === "shake") {   // Mico: ±20° 두 번(0.2·0.3초) 뒤 1초에 감쇠. 눈이 몸과 같이 돈다
    const env = sm(u / .08) * Math.exp(-2.2 * Math.max(0, u - .45));
    const th = 20 * Math.sin(2 * Math.PI * u / .58) * env;
    o.R = ry(th); o.sx = 1 + .02 * Math.abs(Math.sin(2 * Math.PI * u / .58)) * env; o.sy = 2 - o.sx;
    o.eyeP = EYES3.P.open; o.eyeK = sm(u / .15) * (1 - sm((u - 1.1) / .3));
  } else if (ty === "surprise") {   // 놀람: 0.12초에 세로 1.22 늘어남 + 눈 크게·동공 작게, 0.5초 뒤 풀림
    const inK = sm(u / .12), rel = sm((u - .55) / .3);
    const st = .22 * inK * (1 - rel) + (u > .12 ? .03 * Math.sin(2 * Math.PI * (u - .12) / .22) * Math.exp(-6 * (u - .12)) : 0);
    o.sy = 1 + st; o.sx = 1 - st * .45; o.dy = .05 * inK * (1 - rel);
    o.R = rx(6 * inK * (1 - rel));
    o.eyeP = EYES3.P.surprise; o.eyeK = EXPRESS(clamp(u / .15)) * (1 - sm((u - .6) / .35)); o.size = 1 + .10 * o.eyeK;
  } else if (ty === "happy") {   // 기쁨: 눈 웃음 + 깡총 두 번 + 좌우 5° 까딱
    const hop = (t0, len, amp) => { const x = (u - t0) / len; return x > 0 && x < 1 ? amp * Math.sin(Math.PI * x) : 0; };
    const st = hop(.05, .34, .13) + hop(.42, .28, .08);
    const sq = (u < .05 ? .06 * sm(u / .05) : 0) + (u > .39 && u < .42 ? .03 : 0);
    o.sy = 1 + st - sq; o.sx = 1 - st * .5 + sq; o.dy = hop(.05, .34, .09) + hop(.42, .28, .05);
    o.R = rz(5 * Math.sin(2 * Math.PI * u / .74) * sm(u / .1) * (1 - sm((u - 1.1) / .4)));
    o.eyeP = EYES3.P.happy; o.eyeK = EXPRESS(clamp(u / .25)) * (1 - sm((u - 1.2) / .35));
  } else if (ty === "heart") {   // 하트: 눈이 하트로 튀어나오고 두근거림, 몸은 박자 맞춰 살짝 부푼다
    const k = pop(u) * (1 - sm((u - 1.45) / .35));
    const beat = u > .2 ? Math.max(0, Math.sin(2 * Math.PI * (u - .2) / .55)) ** 3 * k : 0;
    o.heartK = clamp(k); o.size = 1 + .16 * k + .10 * beat; o.sx = o.sy = 1 + .025 * beat; o.dy = .01 * beat;
    o.eyeP = EYES3.P.open; o.eyeK = clamp(k);
  }
  return o;
}

