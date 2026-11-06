// think_sdf.js — comet.html(11-02 저녁판)의 생각중 무늬 + 거리장 소용돌이 변신 코드를 그대로 떼어 둔 것 (진규씨: "나선보다 이게 낫다"). DATA(data.js)·NS·$·clamp·sm·D(mascot_core.js) 가 먼저 있어야 하고 SVG 에 #Think, #field 가 있어야 한다
// ---------- 생각중 무늬 (주형 v8 띠) ----------
function samplePath(d, dens) {
  const hid = document.createElementNS(NS, "svg"), p = document.createElementNS(NS, "path");
  hid.setAttribute("style", "position:absolute;width:0;height:0"); hid.appendChild(p); document.body.appendChild(hid);
  p.setAttribute("d", d); const L = p.getTotalLength(), n = Math.max(64, Math.ceil(L * dens)), pts = [];
  for (let i = 0; i < n; i++) { const q = p.getPointAtLength(L * i / n); pts.push([q.x, q.y]); }
  hid.remove(); return pts;
}
const THINK = window.THINK_PTS || DATA.body.think.map(b => samplePath(b.d, 60));   // 티즈판: 미리 뽑아 둔 점(think_pts.js)이 있으면 그걸 씀 (매번 뽑으면 시작이 1.2초 늦음)
const thinkEls = THINK.map(() => { const p = document.createElementNS(NS, "path"); $("Think").appendChild(p); return p; });
const TF = { step: [10, 2.0, 1.0, .22], wave: [.020, 3, 2.0] };
function bandStep(F, clk, i) { const [Dd, P, w, lag] = F.step, u = Math.max(0, clk - i * lag), f = clamp((u % P) / w); return Dd * .5 * (1 - Math.cos(2 * Math.PI * f)); }
function thinkPts(i, clk, amp) {
  const [A, k, W] = TF.wave, src = THINK[i], out = new Array(src.length), a = bandStep(TF, clk, i) * D, ca = Math.cos(a), sa = Math.sin(a), ph = W * clk - i * .9;
  for (let j = 0; j < src.length; j++) { let [x, y] = src[j]; const att = amp * A * Math.max(0, 1 - x * x - y * y), r = Math.hypot(x, y) || 1e-6, th = Math.atan2(y, x), rr = r + att * Math.sin(k * th - ph); x = x / r * rr; y = y / r * rr; out[j] = [x * ca - y * sa, x * sa + y * ca]; }
  return out;
}
const flowClock = (u) => { if (u <= 0) return 0; const x = u / 1.5; return x < 1 ? 1.5 * (x * x * x - x * x * x * x / 2) : u - .75; };
// ratchetAt 는 mascot_core.js 에 있음

// ---------- 거리장: 다각형을 캔버스에 칠해 마스크 → 유클리드 거리 변환 → 부호 거리 ----------
const G = 144, X0 = -1.25, H = 2.5 / (G - 1);
const mcv = document.createElement("canvas"); mcv.width = G; mcv.height = G; const mctx = mcv.getContext("2d", { willReadFrequently: true });
function edt1(f, n) {   // Felzenszwalb 1차원 제곱 거리 변환 (제자리)
  const v = new Int32Array(n), z = new Float64Array(n + 1), d = new Float64Array(n); let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) { let s; while (true) { const vk = v[k]; s = ((f[q] + q * q) - (f[vk] + vk * vk)) / (2 * q - 2 * vk); if (s <= z[k]) { k--; if (k < 0) { k = 0; break; } } else break; } k++; v[k] = q; z[k] = s; z[k + 1] = 1e20; }
  k = 0; for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const vk = v[k]; d[q] = (q - vk) * (q - vk) + f[vk]; }
  for (let q = 0; q < n; q++) f[q] = d[q];
}
function edt2(mask) {   // mask 1 인 곳까지의 제곱 거리
  const f = new Float64Array(G * G); for (let i = 0; i < G * G; i++) f[i] = mask[i] ? 0 : 1e12;
  const col = new Float64Array(G);
  for (let x = 0; x < G; x++) { for (let y = 0; y < G; y++) col[y] = f[y * G + x]; edt1(col, G); for (let y = 0; y < G; y++) f[y * G + x] = col[y]; }
  const row = new Float64Array(G);
  for (let y = 0; y < G; y++) { for (let x = 0; x < G; x++) row[x] = f[y * G + x]; edt1(row, G); for (let x = 0; x < G; x++) f[y * G + x] = row[x]; }
  return f;
}
function maskSDF(polys) {
  mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.clearRect(0, 0, G, G); mctx.setTransform(1 / H, 0, 0, 1 / H, -X0 / H, -X0 / H); mctx.fillStyle = "#000";
  for (const P of polys) { if (P.length < 3) continue; mctx.beginPath(); mctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) mctx.lineTo(P[i][0], P[i][1]); mctx.closePath(); mctx.fill(); }
  const img = mctx.getImageData(0, 0, G, G).data, m = new Uint8Array(G * G), nm = new Uint8Array(G * G);
  for (let i = 0; i < G * G; i++) { m[i] = img[i * 4 + 3] > 127 ? 1 : 0; nm[i] = 1 - m[i]; }
  const dIn = edt2(m), dOut = edt2(nm), f = new Float32Array(G * G);
  for (let i = 0; i < G * G; i++) f[i] = (Math.sqrt(dIn[i]) - Math.sqrt(dOut[i])) * H;
  return f;
}
const FIELD = { idle: null, think: maskSDF(THINK) };
function sample(f, x, y) { const u = clamp((x - X0) / H, 0, G - 1.001), v = clamp((y - X0) / H, 0, G - 1.001), i = u | 0, j = v | 0, fu = u - i, fv = v - j, k = j * G + i; return (f[k] * (1 - fu) + f[k + 1] * fu) * (1 - fv) + (f[k + G] * (1 - fu) + f[k + G + 1] * fu) * fv; }
const SWIRL = 450 * D, M = 160, MX0 = -1.06, MH = 2.12 / (M - 1), VAL = new Float32Array(M * M), TMP = new Float32Array(M * M);
function blendField(k) {
  const s = clamp(k), fat = .006 * Math.sin(Math.PI * s), B = -.35 + 1.7 * sm((k - .4) / .6), grow = k > 1 ? 2 - k : 1;
  for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) {
    const x = MX0 + i * MH, y = MX0 + j * MH, r2 = x * x + y * y;
    if (r2 > 1.1) { TMP[j * M + i] = 1; continue; }
    const att = Math.pow(Math.max(0, 1 - r2), 1.5), a1 = -SWIRL * s * att, a2 = SWIRL * (1 - s) * att, wb = sm((B - Math.sqrt(r2)) / .35), wa = 1 - wb;
    const c1 = Math.cos(a1), s1 = Math.sin(a1), c2 = Math.cos(a2) * grow, s2 = Math.sin(a2) * grow;
    TMP[j * M + i] = (wa ? wa * sample(FIELD.idle, x * c1 - y * s1, x * s1 + y * c1) : 0) + (wb ? wb * sample(FIELD.think, x * c2 - y * s2, x * s2 + y * c2) : 0) - fat;
  }
  for (let j = 0; j < M; j++) for (let i = 2; i < M - 2; i++) { const k2 = j * M + i; VAL[k2] = (TMP[k2 - 2] + 4 * TMP[k2 - 1] + 6 * TMP[k2] + 4 * TMP[k2 + 1] + TMP[k2 + 2]) / 16; }
  for (let i = 0; i < M; i++) for (let j = 2; j < M - 2; j++) { const k2 = j * M + i; TMP[k2] = (VAL[k2 - 2 * M] + 4 * VAL[k2 - M] + 6 * VAL[k2] + 4 * VAL[k2 + M] + VAL[k2 + 2 * M]) / 16; }
  VAL.set(TMP); for (let q = 0; q < 2; q++) for (let i = 0; i < M; i++) { VAL[q * M + i] = VAL[(M - 1 - q) * M + i] = VAL[i * M + q] = VAL[i * M + M - 1 - q] = 1; }
}
function contourD() {
  const segs = new Map(), edgeId = (e) => (e[2] ? "v" : "h") + e[0] + "," + e[1];
  const pt = (e) => { const [i, j, dir] = e, a = VAL[j * M + i], b = dir ? VAL[(j + 1) * M + i] : VAL[j * M + i + 1], t = a / (a - b || 1e-9); return dir ? [MX0 + i * MH, MX0 + (j + t) * MH] : [MX0 + (i + t) * MH, MX0 + j * MH]; };
  const add = (e0, e1) => segs.set(edgeId(e0), e1);
  for (let j = 0; j < M - 1; j++) for (let i = 0; i < M - 1; i++) {
    const va = VAL[j * M + i], vb = VAL[j * M + i + 1], vc = VAL[(j + 1) * M + i + 1], vd = VAL[(j + 1) * M + i];
    const code = (va < 0 ? 1 : 0) | (vb < 0 ? 2 : 0) | (vc < 0 ? 4 : 0) | (vd < 0 ? 8 : 0); if (code === 0 || code === 15) continue;
    const Bq = [i, j, 0], Rq = [i + 1, j, 1], Tq = [i, j + 1, 0], Lq = [i, j, 1];
    switch (code) { case 1: add(Lq, Bq); break; case 2: add(Bq, Rq); break; case 3: add(Lq, Rq); break; case 4: add(Rq, Tq); break;
      case 5: if ((va + vb + vc + vd) < 0) { add(Lq, Tq); add(Rq, Bq); } else { add(Lq, Bq); add(Rq, Tq); } break;
      case 6: add(Bq, Tq); break; case 7: add(Lq, Tq); break; case 8: add(Tq, Lq); break; case 9: add(Tq, Bq); break;
      case 10: if ((va + vb + vc + vd) < 0) { add(Tq, Rq); add(Bq, Lq); } else { add(Tq, Lq); add(Bq, Rq); } break;
      case 11: add(Tq, Rq); break; case 12: add(Rq, Lq); break; case 13: add(Rq, Bq); break; case 14: add(Bq, Lq); break; }
  }
  const loops = [], used = new Set();
  for (const k0 of segs.keys()) { if (used.has(k0)) continue; let k = k0, n = 0; const L = []; while (k && !used.has(k) && n < 200000) { used.add(k); const e = segs.get(k); if (!e) break; L.push(pt(e)); k = edgeId(e); n++; } if (L.length >= 6) loops.push(L); }
  let d = "";
  for (let L of loops) {
    let A = 0; for (let i = 0; i < L.length; i++) { const p = L[i], q = L[(i + 1) % L.length]; A += p[0] * q[1] - q[0] * p[1]; } if (Math.abs(A) < .006) continue;
    for (let q = 0; q < 2; q++) { const o = []; for (let i = 0; i < L.length; i++) { const a = L[i], b = L[(i + 1) % L.length]; o.push([.75 * a[0] + .25 * b[0], .75 * a[1] + .25 * b[1]], [.25 * a[0] + .75 * b[0], .25 * a[1] + .75 * b[1]]); } L = o; }
    if (L.length > 60) { const o = []; for (let i = 0; i < L.length; i += 2) o.push(L[i]); L = o; }
    const n = L.length; d += "M" + L[0][0].toFixed(4) + " " + L[0][1].toFixed(4);
    for (let i = 0; i < n; i++) { const p0 = L[(i - 1 + n) % n], p1 = L[i], p2 = L[(i + 1) % n], p3 = L[(i + 2) % n]; d += "C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(4) + " " + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(4) + " " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(4) + " " + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(4) + " " + p2[0].toFixed(4) + " " + p2[1].toFixed(4); }
    d += "Z";
  }
  return d;
}

// 거리장 변신 일반형: FA(출발) → FB(도착), swirl = 감기는 양(라디안, 0 이면 가운데서 번져 나오기만). 생각중은 blendField(450°), 발산·답변은 이것으로
function blendField2(k, FA, FB, swirl) {
  const s = clamp(k), fat = .006 * Math.sin(Math.PI * s), B = -.35 + 1.7 * sm((k - .25) / .75), grow = k > 1 ? 2 - k : 1;
  for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) {
    const x = MX0 + i * MH, y = MX0 + j * MH, r2 = x * x + y * y;
    if (r2 > 1.1) { TMP[j * M + i] = 1; continue; }
    const att = Math.pow(Math.max(0, 1 - r2), 1.5), a1 = -swirl * s * att, a2 = swirl * (1 - s) * att, wb = sm((B - Math.sqrt(r2)) / .35), wa = 1 - wb;
    const c1 = Math.cos(a1), s1 = Math.sin(a1), c2 = Math.cos(a2) * grow, s2 = Math.sin(a2) * grow;
    TMP[j * M + i] = (wa ? wa * sample(FA, x * c1 - y * s1, x * s1 + y * c1) : 0) + (wb ? wb * sample(FB, x * c2 - y * s2, x * s2 + y * c2) : 0) - fat;
  }
  for (let j = 0; j < M; j++) for (let i = 2; i < M - 2; i++) { const k2 = j * M + i; VAL[k2] = (TMP[k2 - 2] + 4 * TMP[k2 - 1] + 6 * TMP[k2] + 4 * TMP[k2 + 1] + TMP[k2 + 2]) / 16; }
  for (let i = 0; i < M; i++) for (let j = 2; j < M - 2; j++) { const k2 = j * M + i; TMP[k2] = (VAL[k2 - 2 * M] + 4 * VAL[k2 - M] + 6 * VAL[k2] + 4 * VAL[k2 + M] + VAL[k2 + 2 * M]) / 16; }
  VAL.set(TMP); for (let q = 0; q < 2; q++) for (let i = 0; i < M; i++) { VAL[q * M + i] = VAL[(M - 1 - q) * M + i] = VAL[i * M + q] = VAL[i * M + M - 1 - q] = 1; }
}
