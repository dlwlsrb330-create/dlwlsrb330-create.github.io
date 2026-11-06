// 친구 코드 레이어 644:281 의 LOOI식 눈 모델 그대로 (눈 모양은 이번에 손대지 않음)
const LOOI = (() => {
  const P = {
    open:    { rx: .30, ry: .33, n: 2.0, top: 9,    tt: 0,   bot: -9,   bt: 0,   bs: 0,   rt: 0 },
    blink:   { rx: .315, ry: .055, n: 3.2, top: 9,  tt: 0,   bot: -9,   bt: 0,   bs: 0,   rt: 0 },
    listen:  { rx: .30, ry: .33, n: 2.0, top: 9,    tt: 0,   bot: -.21, bt: 0,   bs: 0,   rt: 0 },
    focus:   { rx: .30, ry: .33, n: 2.0, top: 9,    tt: 0,   bot: -.13, bt: 0,   bs: 0,   rt: 0 },
    happy:   { rx: .30, ry: .33, n: 2.0, top: 9,    tt: 0,   bot: -.06, bt: 0,   bs: 0,   rt: 0 },
    sad:     { rx: .30, ry: .33, n: 2.0, top: .10,  tt: .50, bot: -9,   bt: 0,   bs: 0,   rt: 0 },
    doubt:   { rx: .31, ry: .115, n: 5.5, top: 9,   tt: 0,   bot: -9,   bt: 0,   bs: 0,   rt: -.30 },
  };
  const T = { express: 0.37, release: 0.40, releaseFar: 0.77, blink: [0.067, 0.10, 0.067], gazeSnap: 0.40 };
  const bez = (x1, y1, x2, y2) => t => {
    let u = t; for (let i = 0; i < 8; i++) { const x = 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u * u * x2 + u ** 3 - t; const dx = 3 * (1 - u) ** 2 * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2); if (Math.abs(dx) < 1e-6) break; u -= x / dx; u = Math.min(1, Math.max(0, u)); }
    return 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u * u * y2 + u ** 3;
  };
  const EASE = { express: bez(0.33, 0, 0.2, 1), release: bez(0.37, 0, 0.63, 1) };
  function lerpP(a, b, k) { const o = {}; for (const key in a) o[key] = a[key] + (b[key] - a[key]) * k; return o; }
  function clip(poly, nx, ny, c) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const dp = nx * p[0] + ny * p[1] - c, dq = nx * q[0] + ny * q[1] - c;
      if (dp <= 0) out.push(p);
      if ((dp <= 0) !== (dq <= 0)) { const t = dp / (dp - dq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    return out;
  }
  function resample(poly, n) {
    const L = [0]; for (let i = 1; i <= poly.length; i++) { const a = poly[i - 1], b = poly[i % poly.length]; L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
    const out = []; let j = 0; const tot = L[L.length - 1];
    for (let k = 0; k < n; k++) { const s = tot * k / n; while (L[j + 1] < s) j++; const a = poly[j], b = poly[(j + 1) % poly.length], t = (s - L[j]) / (L[j + 1] - L[j] || 1); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    return out;
  }
  function chaikin(p, it) { for (let k = 0; k < it; k++) { const o = []; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; o.push([.75 * a[0] + .25 * b[0], .75 * a[1] + .25 * b[1]], [.25 * a[0] + .75 * b[0], .25 * a[1] + .75 * b[1]]); } p = o; } return p; }
  function eye(p, side, round = 3) {
    const N = 120, pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a);
      pts.push([p.rx * Math.sign(c) * Math.abs(c) ** (2 / p.n), p.ry * Math.sign(s) * Math.abs(s) ** (2 / p.n)]);
    }
    let q = pts;
    const inward = -side;
    const tt = p.tt + (side > 0 ? p.rt : 0);
    if (p.top < 2) q = clip(q, -tt * inward, 1, p.top);
    else if (side > 0 && p.rt) q = clip(q, -p.rt * inward, 1, p.ry * 0.62);
    if (p.bot > -2) q = clip(q, p.bt * inward + p.bs, -1, -p.bot);
    if (q.length < 3) return [[0, 0], [0, 0], [0, 0]];
    return chaikin(resample(q, 96), round);
  }
  return { P, T, EASE, lerpP, eye };
})();
