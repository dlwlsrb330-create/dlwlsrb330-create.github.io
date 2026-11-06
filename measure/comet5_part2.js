// ========== 마스코트 엔진 (comet5 / launch2 공용) ==========
// 대기 = 2판 행성(SVG, mascot_core.js). 생각중 = 거리장 소용돌이(think_sdf.js, comet.html 판 그대로). 발산 = 눈 둘레 물결(SVG).
// 사물 = WebGL 입체(주형 801 문법). 행성 띠가 닫혀 검은 공이 되는 순간 캔버스로 넘기고 눌렸다 늘어나며 사물이 된다. 눈은 눈 ③을 텍스처로 구워 입힌다.
// 바깥(런처)에서 쓰는 손잡이: window.__ext { closeF 띠 닫힘 0~1, shut 눈 감김 0~1, scale 크기 } — 대기 상태에서만 먹는다. window.__m.expr("sad") 로 표정 강제.
const VIEW = 2.9;
const S = (t, p, ph = 0) => Math.sin(2 * Math.PI * t / p + ph);
window.__ext = { closeF: 0, shut: 0, scale: 1, eyeS: 1, pupil: 1, yaw: 0 };   // pupil: 동공 크기 0~1 (실행 장면에서 줄무늬 뒤에 눈알이 생김)
let forceExpr = null;
const OBJS = {   // face: 눈 붙는 면의 중심(몸 좌표, 법선 z). view: 머무를 때 [기울기, 요, 롤] (도)
  bulb:    { id: 1, label: "전구",     eye: .9,  Rb: 1.0,  face: [0, .30, .6],   hold: 2.6, expr: () => EYES3.lerp(EYES3.P.open, EYES3.P.happy, .3), view: (t, ht) => [-9 + 2.5 * S(t, 4.1), -24 + 6 * S(t, 6.3), 1.5 * S(t, 5.2, 1)], gaze: (ht) => [.06 * Math.sin(ht * 2.1), .02 * Math.sin(ht * 4.2)] },
  message: { id: 2, label: "메시지",   eye: 1.0, Rb: 1.18, face: [0, .16, .3],   hold: 2.6, expr: (ht) => EYES3.lerp(EYES3.P.open, EYES3.P.listen, .25 + .35 * (.5 + .5 * Math.sin(ht * 7.1) * Math.sin(ht * 2.3 + 1))), view: (t) => [-7 + 3 * S(t, .95), -20 + 5 * S(t, 3.0), -2 + 2 * S(t, 2.5)], gaze: (ht) => [.05 * Math.sin(ht * 1.7), -.02] },
  cloud:   { id: 3, label: "생각구름", eye: .9,  Rb: 1.4,  face: [.08, .2, .27], hold: 2.6, expr: () => EYES3.P.think, view: (t, ht) => { const kk = Math.floor(ht / 1.6), f = ht / 1.6 - kk, T = j => j === 0 ? 0 : (j % 2 ? 1 : -1); return [-12 + 3 * S(t, 3.7), -20 + 14 * (T(kk) + (T(kk + 1) - T(kk)) * RATCHET(f)), 3 * S(t, 4.4)]; }, gaze: (ht) => [.10 + .03 * Math.sin(ht * 1.3), .12] },
  magnify: { id: 4, label: "돋보기",   eye: .82, Rb: 1.03, face: [.14, .16, .07], hold: 2.6, expr: () => EYES3.P.open, view: (t) => [-10 + 4 * S(t, 2.3), -14 + 16 * S(t, 3.2), 4 + 3 * S(t, 4.1, 1)], gaze: (ht, t) => [.11 * Math.sin(2 * Math.PI * t / 3.2 + .7), .03 * Math.sin(ht * 1.9)] },
  heart:   { id: 5, label: "하트",     eye: .95, Rb: 1.1,  face: [0, .02, .40],  hold: 2.6, expr: () => EYES3.P.happy, heart: 1, view: (t) => [-6 + 2 * S(t, 3.1), 8 * S(t, 2.6), 4 * S(t, 1.9, 1)], gaze: () => [0, .04] },
  // 11판: 녹음 중 = 3D 마이크 (7판 막대 3개 대신). 눈은 마이크 머리 앞면, 골똘한 생각 눈(think). 시선은 오른쪽 위. 다른 사물처럼 천천히 흔들리기만 함.
  pulse:   { id: 6, label: "마이크", eye: .82, Rb: 1.0, face: [0, .36, .37], hold: 2.6, expr: () => EYES3.P.think, view: (t) => [-16 + 1.5 * S(t, 3.3), 22 * S(t, 6.4), 0], gaze: () => [.1, .06] },   // 원통 바닥 윗면이 보이게 위에서 내려다보고, 받침대 위에서 좌우로 천천히 돎 (바닥이 기울지 않게 롤 없음)
  dots:    { id: 7, label: "발산 구슬", eye: .76, gap: 1.05, Rb: 1.4, face: [0, 0, .26], hold: 2.6, expr: () => EYES3.P.open, view: (t) => [-4 + 2 * S(t, 3.7), 8 * S(t, 6.1), 2 * S(t, 3.1, 1)], gaze: (ht) => [.05 * Math.sin(ht * .9), .02] },   // 7판: 발산 — 레퍼 = Google 음성 검색 점 4개. 가운데 두 구슬에 눈 하나씩(gap = 두 눈 간격)
};
const OBJ_GAP = Object.fromEntries(Object.values(OBJS).map(o => [o.id, o.gap || 0]));   // 사물별 두 눈 간격 (없으면 눈 ③ 기본 GAP)
function dotsAnim() {   // 발산 구슬 4개: 왼→오 물결로 통통(y) + 3.2초마다 차례로 길게 늘었다 돌아옴(h, 아이디어가 튀어나오듯). 가운데 둘은 같이(눈이 붙어 있어서)
  const now = performance.now() / 1000, d = [0, .9, .9, 1.8], hop = (x) => x > 0 && x < .42 ? Math.sin(Math.PI * x / .42) : 0, c = now % 3.2;
  return { y: d.map(k => .07 * Math.sin(now * 3.6 - k)), h: d.map(k => .3 * hop(c - k * .16)) };
}
const PULSE = { base: [.26, .42, .26], min: [.04, .14, .04], lv: 0, last: null };   // 막대 3개 곧은 부분 반높이: 소리 최대분 · 조용할 때(양옆은 거의 구슬)
function pulseBars() {   // 녹음 알약의 소리 크기 → 막대 3개 반높이 (uBars.xyz = 왼·가운데·오른)
  const now = performance.now() / 1000, dt = PULSE.last === null ? 0 : Math.min(.1, now - PULSE.last); PULSE.last = now;
  const tgt = typeof RECPILL !== "undefined" && RECPILL.on() ? RECPILL.level() : 0;
  PULSE.lv += (tgt - PULSE.lv) * (1 - Math.exp(-dt * (tgt > PULSE.lv ? 16 : 7)));
  const lv = clamp((PULSE.lv - .1) / .7), ph = [0, 1.9, .8], w = [7.1, 8.3, 6.4];
  return { bars: PULSE.base.map((b, i) => PULSE.min[i] + b * lv * (.6 + .4 * Math.sin(now * w[i] + ph[i]))), lv: PULSE.lv };
}
const isObj = (m) => m in OBJS;
const VS = "#version 300 es\nin vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }";
const FS = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes; uniform mat3 uR; uniform float uS; uniform vec2 uSq; uniform float uMix, uLine, uEK, uEyeOn, uBound;
uniform int uA, uB; uniform vec3 uC, uU, uV, uN, uInk; uniform sampler2D uEye; uniform vec4 uBX, uBY, uBH, uBR;
const float VIEW = ${VIEW.toFixed(2)};
#define INK uInk
const vec3 BG = vec3(${(0xFC / 255).toFixed(5)}, ${(0xFC / 255).toFixed(5)}, ${(0xFA / 255).toFixed(5)});
float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * .25; }
float smax(float a, float b, float k){ float h = clamp(.5 + .5 * (a - b) / k, 0., 1.); return mix(b, a, h) + k * h * (1. - h); }
float U2(float a, float b, float k, float sh){ return sh > .5 ? min(a, b) : smin(a, b, k); }
float sdSph(vec3 p, vec3 c, float r){ return length(p - c) - r; }
float sdCapsule(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * h) - r; }
float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2){
  vec3 ba = b - a; float l2 = dot(ba, ba), rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1. / l2;
  vec3 pa = p - a; float y = dot(pa, ba), z = y - l2;
  vec3 xv = pa * l2 - ba * y; float x2 = dot(xv, xv), y2 = y * y * l2, z2 = z * z * l2;
  float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1; }
float sdRBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r; }
float sdCylY(vec3 p, float r, float h, float rr){ vec2 d = vec2(length(p.xz) - r + rr, abs(p.y) - h + rr); return min(max(d.x, d.y), 0.) + length(max(d, 0.)) - rr; }
float sdCylZ(vec3 p, float r, float h, float rr){ vec2 d = vec2(length(p.xy) - r + rr, abs(p.z) - h + rr); return min(max(d.x, d.y), 0.) + length(max(d, 0.)) - rr; }
float sdTorusY(vec3 p, float R, float r){ return length(vec2(length(p.xz) - R, p.y)) - r; }
float sdTorusZ(vec3 p, float R, float r){ return length(vec2(length(p.xy) - R, p.z)) - r; }
float bulb(vec3 p, float sh){
  p.y -= .06;
  float d = U2(sdSph(p, vec3(0., .22, 0.), .6), sdRoundCone(p, vec3(0., -.22, 0.), vec3(0., -.5, 0.), .34, .27), .14, sh);
  float base = sdCylY(p - vec3(0., -.64, 0.), .28, .15, sh > .5 ? .006 : .05);
  float gr = min(sdTorusY(p - vec3(0., -.6, 0.), .3, .042), sdTorusY(p - vec3(0., -.7, 0.), .3, .042));
  base = sh > .5 ? max(base, -gr) : smax(base, -gr, .02);
  d = U2(d, base, .05, sh);
  return U2(d, sdSph(p, vec3(0., -.82, 0.), .13), .06, sh); }
float message(vec3 p, float sh){
  p.y -= .1;
  float b = sdRBox(p, vec3(.9, .58, .3), sh > .5 ? .02 : .26);
  vec3 ta = vec3(-.42, -.42, 0.), tb = vec3(-.7, -.95, 0.);
  return smin(b, sdRoundCone(p, ta, tb, .2, .06), .1); }
float cloud2(vec2 q){
  float d = length(q - vec2(0., .2)) - .55;
  d = smin(d, length(q - vec2(-.52, -.02)) - .42, .1);
  d = smin(d, length(q - vec2(.54, 0.)) - .43, .1);
  d = smin(d, length(q - vec2(-.22, -.28)) - .4, .1);
  return smin(d, length(q - vec2(.26, -.3)) - .4, .1); }
float cloud(vec3 p, float sh){
  p.y -= .04; p.x -= .08;
  const float h = .27, rr = .17;
  vec2 w = vec2(cloud2(p.xy) + rr, abs(p.z) - h + rr);
  float d = min(max(w.x, w.y), 0.) + length(max(w, 0.)) - rr;
  vec3 q = vec3(p.xy, p.z / .7);
  return min(d, min(sdSph(q, vec3(-.8, -.72, 0.), .12), sdSph(q, vec3(-1.0, -.95, 0.), .075)) * .7); }
float magnify(vec3 p, float sh){
  p -= vec3(.14, .16, 0.);
  float d = U2(sdTorusZ(p, .52, .1), sdCylZ(p, .5, .07, sh > .5 ? .005 : .03), .04, sh);
  vec2 dir = normalize(vec2(-1., -1.1));
  vec3 a = vec3(dir * .6, 0.);
  float h = U2(sdCapsule(p, a, a + vec3(dir * .14, 0.), .135), sdCapsule(p, a, vec3(dir * 1.12, 0.), .1), .03, sh);
  return U2(d, h, .05, sh); }
float heart(vec3 p, float sh){
  vec3 q = vec3(p.x, p.y, p.z / .72);
  float d = smin(sdSph(q, vec3(-.33, .22, 0.), .43), sdSph(q, vec3(.33, .22, 0.), .43), .16);
  d = smin(d, sdRoundCone(q, vec3(0., .05, 0.), vec3(0., -.74, 0.), .60, .05), .18);
  return d * .72; }
float bar(vec3 p, float x, float h, float r, float sh){   // 둥근 막대. 선 그리기용(sh)엔 위쪽 둥근 끝이 시작되는 자리에 가는 홈 하나 → 흰 고리 선 하나 (전구 홈처럼)
  p.x -= x;
  float c = sdCapsule(p, vec3(0., -h, 0.), vec3(0., h, 0.), r);
  return sh > .5 ? max(c, -sdTorusY(p - vec3(0., h + r * .62, 0.), r * .785, .016)) : c; }
float beads(vec3 p, float sh){   // 7판: 녹음 펄스(막대 3)·발산 구슬(4) 공용 — 둥근 막대 줄. 막대마다 x·y·곧은 반높이·반지름 = uBX·uBY·uBH·uBR (반지름 0 = 없음). 한 함수라 셰이더 컴파일이 가볍다
  float d = 1e9;
  for (int i = 0; i < 4; i++) { if (uBR[i] <= 0.) continue; d = min(d, bar(p - vec3(0., uBY[i], 0.), uBX[i], uBH[i], uBR[i], sh)); }
  return d; }
float sdArc0(vec2 p, vec2 sc, float ra){ p.x = abs(p.x); return (sc.y * p.x > sc.x * p.y) ? length(p - sc * ra) : abs(length(p) - ra); }   // 호 중심선까지 거리 (iq). 열림 = +y 축 기준 ±각, sc = (sin, cos)
float mic(vec3 p, float sh){   // 11판: 녹음 중 마스코트 = 3D 마이크 (머리 캡슐 + U자 받침 + 기둥 + 바닥). 눈은 머리 앞면. 효과 없음
  p.y -= .04;
  float head = sdCapsule(p, vec3(0., .14, 0.), vec3(0., .5, 0.), .37);   // 마이크 머리 (둥근 입체)
  vec2 cr = vec2(p.x, -(p.y - .3));   // U자 받침: 머리 중심 둘레 아래쪽 반원 + 위로 조금 더
  float cradle = length(vec2(sdArc0(cr, vec2(.985, -.174), .55), p.z)) - .07;
  float stem = sdCapsule(p, vec3(0., -.25, 0.), vec3(0., -.68, 0.), .07);
  float base = sdCylY(p - vec3(0., -.75, 0.), .42, .07, sh > .5 ? .008 : .04);   // 바닥 = 납작한 원통 (윗면 테두리 흰 선)
  float d = smin(smin(head, cradle, .04), stem, .05); d = smin(d, base, .05);   // 이음매를 매끈하게 → 받침·기둥이 만나는 ㅅ 자 흰 선 없음 (바닥 윗면 테두리 선만 남김)
  return d; }
float shape(int id, vec3 p, float sh){
  if (id == 0) return length(p) - 1.;
  if (id == 1) return bulb(p, sh);
  if (id == 2) return message(p, sh);
  if (id == 3) return cloud(p, sh);
  if (id == 4) return magnify(p, sh);
  if (id == 5) return heart(p, sh);
  if (id == 6) return mic(p, sh);   // 11판: 녹음 펄스 막대 → 마이크
  return beads(p, sh); }
float map(vec3 p){ float a = shape(uA, p, 0.), b = shape(uB, p, 0.); float m = uMix; return mix(a, b, clamp(m, 0., 1.)) - max(m - 1., 0.) * .9; }
float mapP(vec3 p){ float a = shape(uA, p, 1.), b = shape(uB, p, 1.); return mix(a, b, clamp(uMix, 0., 1.)); }
vec3 nrm(vec3 p){ const vec2 e = vec2(1., -1.) * .0012; return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx)); }
vec3 nrmP(vec3 p){ const vec2 e = vec2(1., -1.) * .0012; return normalize(e.xyy * mapP(p + e.xyy) + e.yyx * mapP(p + e.yyx) + e.yxy * mapP(p + e.yxy) + e.xxx * mapP(p + e.xxx)); }
void main(){
  vec2 sp = (gl_FragCoord.xy / uRes - .5) * VIEW;
  float pw = VIEW / uRes.y;
  mat3 Rt = transpose(uR);
  vec3 lo = Rt * vec3(sp / (uS * uSq), 3.), ld = Rt * vec3(0., 0., -1.);
  float t = 0., md = 1e9, tBest = 0.; bool hit = false;
  float bb = dot(lo, ld), cc = dot(lo, lo) - uBound * uBound, disc = bb * bb - cc;
  if (disc > 0.) {
    t = max(0., -bb - sqrt(disc));
    for (int i = 0; i < 200; i++) { float d = map(lo + ld * t); if (d < md) { md = d; tBest = t; } if (d < .0006) { hit = true; break; } t += d * .7; if (t > 6.) break; }
    if (!hit && md < .0025) { hit = true; t = tBest; }
  }
  float dn = dot(ld, uN);
  vec3 col = INK; float alpha = 0., edge = 0.; vec3 eye = vec3(0.);
  if (hit) {
    alpha = 1.;
    vec3 p = lo + ld * t, n = nrm(p);
    bool valid = dot(n, uN) > .15 && dot(p - uC, uN) > -.3 && dn < -.05;
    if (valid && uEyeOn > .5) { vec3 pp = p - uC; vec2 w = vec2(dot(pp, uU), dot(pp, uV)) / uEK; vec2 tc = vec2((w.x + 1.5) / 3., 1. - (w.y + 1.5) / 3.); if (tc.x > 0. && tc.x < 1. && tc.y > 0. && tc.y < 1.) eye = texture(uEye, tc).rgb; }
    float W = .016 * uLine;
    if (W > .0004) {
      vec3 t1 = normalize(cross(n, abs(n.y) < .9 ? vec3(0., 1., 0.) : vec3(1., 0., 0.))), t2 = cross(n, t1);
      vec3 n0 = nrmP(p); float m = 0.;
      for (int k = 0; k < 8; k++) { float a = float(k) * .7853982; m = max(m, 1. - dot(n0, nrmP(p + (cos(a) * t1 + sin(a) * t2) * W))); }
      edge = step(.05, m) * (1. - step(.5, eye.b));
    }
    col = mix(INK, BG, edge);
    col = mix(col, BG, eye.r); col = mix(col, INK, eye.g);
  } else {
    alpha = 1. - smoothstep(0., pw * 1.2, md * uS);
  }
  o = vec4(col * alpha, alpha);
}`;
const cv = $("gl"), gl = cv.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: true });
function shd(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
const prog = gl.createProgram(); gl.attachShader(prog, shd(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, shd(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
// 5판: 셰이더 링크 완료를 바로 묻지 않는다 — Windows 크롬(ANGLE·D3D11)은 이 큰 셰이더를 다 컴파일할 때까지 화면 전체를 멈춰 첫 로드가 9초 걸렸다.
// KHR_parallel_shader_compile 로 뒤에서 컴파일하고, 끝나면 GL 준비. 준비 전에는 입체(사물) 대신 SVG 몸을 그대로 보인다.
const UL = {}; let GL_READY = false; const PSC = gl.getExtension("KHR_parallel_shader_compile");
const ET = 480, ecv = document.createElement("canvas"); ecv.width = ecv.height = ET; const ectx = ecv.getContext("2d");
function glSetup() {
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aLoc = gl.getAttribLocation(prog, "a"); gl.enableVertexAttribArray(aLoc); gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
  for (const n of ["uRes", "uR", "uS", "uSq", "uMix", "uLine", "uEK", "uEyeOn", "uBound", "uA", "uB", "uC", "uU", "uV", "uN", "uEye", "uInk", "uBX", "uBY", "uBH", "uBR"]) UL[n] = gl.getUniformLocation(prog, n);
  gl.clearColor(0, 0, 0, 0);
  const eyeTex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, eyeTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.uniform1i(UL.uEye, 0);
  GL_READY = true;
}
(function waitLink() { if (!PSC || gl.getProgramParameter(prog, PSC.COMPLETION_STATUS_KHR)) glSetup(); else setTimeout(waitLink, 60); })();
function bakeEyes(p, gaze, heartK) {
  const sc = ET / 3;   // 7판: 눈 텍스처 범위 ±1.2 → ±1.5 (발산 구슬처럼 두 눈이 멀리 떨어진 사물), 해상도는 ET 384→480 으로 그대로
  ectx.setTransform(1, 0, 0, 1, 0, 0); ectx.clearRect(0, 0, ET, ET); ectx.setTransform(sc, 0, 0, -sc, ET / 2, ET / 2);
  const fill = (pts, cx, color) => { ectx.fillStyle = color; ectx.beginPath(); pts.forEach((q, i) => i ? ectx.lineTo(cx + q[0], q[1]) : ectx.moveTo(cx + q[0], q[1])); ectx.closePath(); ectx.fill(); };
  for (const side of [-1, 1]) {
    const gA = OBJ_GAP[GLST.A] || GAP, gB = OBJ_GAP[GLST.B] || GAP, gap = gA + (gB - gA) * clamp(GLST.mix);   // 7판: 발산 구슬은 두 눈이 가운데 두 구슬에 하나씩
    const cx = side * gap, e = EYES3.eye(p, side, gaze); let white = e.white, pupil = e.pupil;
    if (heartK > 0) { const hp = alignTo(white, HEART.map(q => [q[0] * 1.15, q[1] * 1.15])); white = white.map((q, i) => [q[0] + (hp[i][0] - q[0]) * heartK, q[1] + (hp[i][1] - q[1]) * heartK]); if (heartK > .5) pupil = null; }
    const seat = heartK > 0 ? white : EYES3.eye(EYES3.P.open, side, [0, 0]).white;
    fill(seat.map(q => [q[0] * 1.28, q[1] * 1.28]), cx, "rgb(0,0,255)");
    fill(white, cx, "rgb(255,0,255)");
    if (pupil) fill(pupil, cx, "rgb(0,255,255)");
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ecv);
}
const RXm = a => { const c = Math.cos(a), s = Math.sin(a); return [[1, 0, 0], [0, c, -s], [0, s, c]]; };
const RYm = a => { const c = Math.cos(a), s = Math.sin(a); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; };
const RZm = a => { const c = Math.cos(a), s = Math.sin(a); return [[c, -s, 0], [s, c, 0], [0, 0, 1]]; };
const viewM = (v, spin = 0) => mm(RXm(v[0] * D), mm(RYm((v[1] + spin) * D), RZm(v[2] * D)));
const GLST = { R: I3, S: 1, Sq: [1, 1], mix: 0, line: 1, A: 0, B: 0, C: [0, 0, 1], U: [1, 0, 0], V: [0, 1, 0], N: [0, 0, 1], EK: 1, eyeOn: 1, bound: 1.2 };
function layoutGL() { const r = $("stage").getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = cv.height = Math.max(64, Math.round(r.width * dpr)); }
addEventListener("resize", layoutGL);
function drawGL() {
  gl.viewport(0, 0, cv.width, cv.height); gl.clear(gl.COLOR_BUFFER_BIT);
  const R = GLST.R;
  gl.uniform2f(UL.uRes, cv.width, cv.height);
  gl.uniformMatrix3fv(UL.uR, false, new Float32Array([R[0][0], R[1][0], R[2][0], R[0][1], R[1][1], R[2][1], R[0][2], R[1][2], R[2][2]]));
  gl.uniform1f(UL.uS, GLST.S); gl.uniform2f(UL.uSq, GLST.Sq[0], GLST.Sq[1]); gl.uniform1f(UL.uMix, GLST.mix);
  const mk = clamp(GLST.mix); gl.uniform1f(UL.uLine, GLST.line * (1 - .45 * ((GLST.A === 7 ? 1 - mk : 0) + (GLST.B === 7 ? mk : 0))));   // 7판: 발산 구슬은 흰 선을 가늘게 (11판: 귀는 보통 굵기)
  gl.uniform1i(UL.uA, GLST.A); gl.uniform1i(UL.uB, GLST.B);
  const da = dotsAnim(), dw = (GLST.A === 7 ? 1 - mk : 0) + (GLST.B === 7 ? mk : 0);   // 발산 구슬: 눈 자리가 가운데 구슬을 따라 튄다
  gl.uniform3fv(UL.uC, [GLST.C[0], GLST.C[1] + da.y[1] * dw, GLST.C[2]]); gl.uniform3fv(UL.uU, GLST.U); gl.uniform3fv(UL.uV, GLST.V); gl.uniform3fv(UL.uN, GLST.N);
  gl.uniform3fv(UL.uInk, window.__ink || [.0431, .0431, .0431]);
  gl.uniform1f(UL.uEK, GLST.EK); gl.uniform1f(UL.uEyeOn, GLST.eyeOn); gl.uniform1f(UL.uBound, GLST.bound);
  const bz = { x: [-1.06, -.36, .36, 1.06], y: da.y, h: da.h, r: [.26, .26, .26, .26] };   // 발산 구슬 4
  gl.uniform4fv(UL.uBX, bz.x); gl.uniform4fv(UL.uBY, bz.y); gl.uniform4fv(UL.uBH, bz.h); gl.uniform4fv(UL.uBR, bz.r);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
const SPHERE_FACE = { C: ANCHOR, U: AT.e1, V: AT.e2, N: ANCHOR };
const OBJ_FACE = (o) => ({ C: o.face, U: [1, 0, 0], V: [0, 1, 0], N: [0, 0, 1] });
function faceMix(a, b, k) {
  const C = [0, 1, 2].map(i => a.C[i] + (b.C[i] - a.C[i]) * k); const U = V3.norm([0, 1, 2].map(i => a.U[i] + (b.U[i] - a.U[i]) * k)); let V = [0, 1, 2].map(i => a.V[i] + (b.V[i] - a.V[i]) * k);
  const d = V3.dot(U, V); V = V3.norm([V[0] - d * U[0], V[1] - d * U[1], V[2] - d * U[2]]); return { C, U, V, N: V3.cross(U, V) };
}
function setGLface(f, size, persp) { GLST.C = f.C; GLST.U = f.U; GLST.V = f.V; GLST.N = f.N; GLST.EK = K * LG_HALF * size * persp; }
function showLayer(glOn) { cv.style.display = glOn ? "block" : "none"; $("svg").style.visibility = glOn ? "hidden" : "visible"; const e = $("svgE"); if (e) e.style.visibility = glOn ? "hidden" : "visible"; }
function showBody(mode) { $("Planet").style.display = mode === "planet" ? "" : "none"; $("Think").style.display = mode === "think" ? "" : "none"; $("field").style.display = mode === "field" ? "" : "none"; $("Div").style.display = mode === "div" ? "" : "none"; $("Speak").style.display = mode === "speak" ? "" : "none"; }
// 행성 띠 닫기: 폭 배율 f (1 = 2판, CLOSE_F 면 흰 틈이 다 닫혀 검은 공)
const CLOSE_F = 2.1; let ribCacheF = 1, ribCache = RIB_IDLE;
function ribIdleF(f) { if (Math.abs(f - 1) < 1e-3) return RIB_IDLE; if (Math.abs(f - ribCacheF) > 1e-3) { ribCacheF = f; ribCache = ribbons(centerIdle, (j, s) => Math.min(Math.PI / 2 - .02, halfIdle(j, s) * f)); } return ribCache; }
function ribbonPolys(world) {   // drawRibbons 와 같은 조각내기, 다각형만 돌려준다 (거리장 출발 모양용)
  const out = [];
  world.forEach(rb => { for (let a = 0; a < N; a += 10) { const poly = []; for (let k = 0; k <= 10; k++) poly.push(rb.L[a + k]); for (let k = 10; k >= 0; k--) poly.push(rb.R[a + k]); const c = clipFront(poly); if (c.length > 2) out.push(c); } });
  return out;
}
function _spRamp(r) { RAMP_CUR = r; }
// 생각중 눈 회전 (comet.html morphR 그대로: 기울임 없음)
function morphRT(m, W) { const sw = Math.sin(Math.PI * clamp(m)); return mm(W, mm(rz(40 * sw), mm(ry(75 * sw), axisAngle(TO_POLE.ax, TO_POLE.ang * clamp(m) * D)))); }
// 무늬 상태 2종 (주형 v8 좌표): 발산 = DATA.body.diverge, 답변중 = DATA.body.speak. 몸은 2D 무늬, 눈은 그 무늬의 눈 자리로 구 위에서 옮겨 간다.
// 전환은 생각중과 같은 거리장 변신(행성 화면 → 무늬, 가운데서 번져 나옴). 발산은 살짝 감기고(120°), 답변은 안 감긴다
const PATS = {
  diverge: { pts: DATA.body.diverge.map(b => samplePath(b.d, 60)), eye: DATA.eyePos.diverge, expr: () => EYES3.P.acorn, size: 1.05, swirl: 120 * D, el: "Div", gaze: (ht) => [.02 * Math.sin(ht * 1.1), .04] },
  answer:  { pts: DATA.body.speak.map(b => samplePath(b.d, 60)),   eye: DATA.eyePos.speak,   expr: (ht) => EYES3.lerp(EYES3.P.dot, EYES3.P.listen, .25 + .25 * Math.sin(ht * 6.3)), size: 1.0, swirl: 0, el: "Speak", gaze: (ht) => [.04 * Math.sin(ht * 2.1), -.02] },
};
for (const k in PATS) { const P = PATS[k]; P.anchor = [P.eye[0], P.eye[1], Math.sqrt(1 - P.eye[0] * P.eye[0] - P.eye[1] * P.eye[1])]; const ax = V3.norm(V3.cross(ANCHOR, P.anchor)); P.rot = { ax, ang: Math.acos(clamp(V3.dot(ANCHOR, P.anchor), -1, 1)) * 180 / Math.PI }; P.field = maskSDF(P.pts); P.pts.forEach(pts => { const e = document.createElementNS(NS, "path"); e.setAttribute("d", toD([pts])); $(P.el).appendChild(e); }); }
const isPat = (m) => m in PATS;
const patR = (P, m, W) => mm(W, axisAngle(P.rot.ax, P.rot.ang * clamp(m) * D));
const easeInC = bez(.32, 0, .67, 0);

// ---------- 상태 머신 ----------
const ENTER = { ant: .30, closeAt: .10, closeEnd: .55, openAt: .70, openLen: .666, fieldEnd: 1.05, len: 1.60 };   // 생각중 들어감 (comet.html)
const BACK = { closeEnd: .25, bodyAt: .10, bodyLen: .40, openAt: .45, openLen: .5, len: 1.05 };                 // 생각중 돌아옴 (comet.html)
const TO_OBJ = { ant: .30, bandAt: .18, bandEnd: .48, closeAt: .10, closeEnd: .48, glAt: .48, ramp: .40, openAt: .85, openLen: .666, len: 1.9 };
const TO_IDLE = { bodyAt: .08, bodyLen: .42, svgAt: .50, bandEnd: .82, closeEnd: .25, openAt: .55, openLen: .5, len: 1.15 };
const TO_IDLE_CONV = { bodyAt: .08, bodyLen: .5, svgAt: .78, bandEnd: 1.12, closeEnd: .2, openAt: 1.16, openLen: .4, len: 1.62 };   // 7판: 발산 구슬 → 행성 (수렴): 검정이 공이 된 뒤 줄무늬, 그다음 눈 뜸
const OBJ2OBJ = { ant: .30, closeAt: .10, closeEnd: .55, openAt: .70, openLen: .666, ramp: .45, len: 1.6 };
// 무늬 상태 들어감: 예비 눌림 0.3초 → 거리장 변신(스프링 램프 .4초, 넘침) → 눈은 감은 채 무늬 눈 자리로 옮겨 가 뜸. 돌아옴: ease-out 으로 행성 화면으로
const TO_PAT = { ant: .30, closeAt: .10, closeEnd: .55, openAt: .75, openLen: .50, fieldEnd: 1.15, len: 1.5 };
const FROM_PAT = { closeEnd: .22, massAt: .08, massRamp: .46, bodyAt: .10, bodyLen: .50, bandAt: .78, bandLen: .40, openAt: 1.16, openLen: .40, len: 1.62 };   // 4판: 눈 감음 → 검정이 공으로 → 흰 줄무늬 → 눈 뜸 (진규 11-03)
const HOLD_SEC = { idle: 4.5, think: 3.2, diverge: 3.5, answer: 3.0, listen: 3.0 };
const CYCLE = ["idle", "think", "idle", "bulb", "message", "idle", "listen", "answer", "idle", "diverge", "idle", "heart"]; let cyc = 0;
let cur = "idle", next = null, tStart = 0, holdStart = 0, auto = true, snap = null, autoFrom = 0, ROT0 = 0;
let lastEyeP = IDLE_EYE, lastGaze = [0, 0], lastSize = EYE_SIZE.idle, lastView = [0, 0, 0], lastHeart = 0, lastRot = 0, lastThink = THINK, lastIdleM = I3;
function go(m, t) {
  if (next || m === cur) return;
  if (cur !== "idle" && m !== "idle" && !(isObj(cur) && isObj(m)) && !(cur === "listen" && isPat(m))) return;   // 생각중·무늬·사물 사이는 행성을 거친다 (듣기→답변은 바로)
  next = m; tStart = t; _sp.t = -1; react = null;
  snap = { eyeP: lastEyeP, gaze: lastGaze.slice(), size: lastSize, spin: spinM(), view: lastView.slice(), heart: lastHeart, rot: lastRot, think: lastThink.map(p => p.map(q => q.slice())), idleM: lastIdleM };
  if ((cur === "idle" || cur === "listen") && (m === "think" || isPat(m))) FIELD.idle = maskSDF(ribbonPolys(xf(RIB_IDLE, snap.idleM)));   // 이 순간의 행성 화면이 출발 모양
  if (isPat(cur) && m === "idle") FIELD.ball = maskSDF(ribbonPolys(xf(ribIdleF(CLOSE_F), snap.idleM)));   // 4판: 무늬는 줄무늬가 닫힌 검은 공으로 돌아간다
  render();
}
const breatheAt = (t) => 1 + .012 * Math.sin(2 * Math.PI * t / 1.7);
function objHold(key, t, ht) { const o = OBJS[key]; return { eyeP: o.expr(ht), gaze: o.gaze(ht, t), view: o.view(t, ht), size: o.eye, heart: o.heart ? 1 : 0, pulse: key === "bulb" ? 1 + .022 * S(t, .8) : 1 }; }
function frame(t) {
  let sx = 1, sy = 1, dy = 0, eyeP, eyeR = I3, eyeSize, gaze, close = 0, heartK = 0, glOn = false, body = "planet", rot = 0, extraS = 1;
  const W = wobM(t), wz = .03 * Math.sin(t * 1.1) / D;
  const dt = lastT === null || t < lastT ? 0 : Math.min(.1, t - lastT);
  if (t > nextGaze) { gazeTgt = [(rnd() - .5) * .28, (rnd() - .5) * .16]; tau = .05 + rnd() * .45; nextGaze = t + 3 + rnd() * 3; }
  { const k = 1 - Math.exp(-dt / tau); gazeCur = [gazeCur[0] + (gazeTgt[0] - gazeCur[0]) * k, gazeCur[1] + (gazeTgt[1] - gazeCur[1]) * k]; }
  const anchorZ = mv(W, ANCHOR)[2];
  if (!next) {
    const ht = t - holdStart, ra = reactAt(t), X = window.__ext;
    if (cur === "idle") {
      spinT += dt;
      lastIdleM = mm(W, mm(ra.R, spinM()));
      drawRibbons(xf(X.closeF > .001 ? ribIdleF(1 + (CLOSE_F - 1) * X.closeF) : RIB_IDLE, lastIdleM)); eyeR = X.yaw ? mm(W, mm([[Math.cos(X.yaw), 0, Math.sin(X.yaw)], [0, 1, 0], [-Math.sin(X.yaw), 0, Math.cos(X.yaw)]], ra.R)) : mm(W, ra.R);   // 티즈판: X.yaw = 눈만 공 표면을 따라 좌우로 (실행 검은 화면에서 눈이 오른쪽 갔다 옴)
      eyeP = forceExpr ? EYES3.P[forceExpr] : ra.eyeK > 0 ? EYES3.lerp(IDLE_EYE, ra.eyeP, ra.eyeK) : IDLE_EYE; eyeSize = EYE_SIZE.idle * ra.size; heartK = ra.heartK;
      sx = ra.sx; sy = ra.sy; dy = ra.dy; gaze = holdGaze("idle", ht); lastView = [0, 0, 0]; lastRot = 0; extraS = X.scale; close = X.shut; eyeSize *= X.eyeS;
      if (X.pupil !== 1) eyeP = Object.assign({}, eyeP, { pm: eyeP.pm * X.pupil });
    } else if (cur === "think") {
      body = "think"; const clk = flowClock(ht); lastThink = THINK.map((_, i) => thinkPts(i, clk, sm(ht / 1.5))); lastThink.forEach((pts, i) => thinkEls[i].setAttribute("d", toD([pts])));
      rot = lastRot = ratchetAt(ht) + ROT0 + wz; eyeR = mm(morphRT(1, W), ra.R);
      eyeP = ra.eyeK > 0 ? EYES3.lerp(EYES3.P.think, ra.eyeP, ra.eyeK) : EYES3.P.think; eyeSize = EYE_SIZE.think * ra.size; heartK = ra.heartK;
      sx = ra.sx; sy = ra.sy; dy = ra.dy; gaze = holdGaze("think", ht);
    } else if (isPat(cur)) {
      const P = PATS[cur]; body = P.el === "Div" ? "div" : "speak"; $(P.el).setAttribute("transform", `translate(${P.eye[0]} ${P.eye[1]}) rotate(${(3 * Math.sin(2 * Math.PI * ht / 5.3)).toFixed(2)}) scale(${(1 + .03 * Math.sin(2 * Math.PI * ht / 1.7)).toFixed(4)}) translate(${-P.eye[0]} ${-P.eye[1]})`);
      const Rb = mm(patR(P, 1, W), ra.R); eyeR = Rb;
      eyeP = ra.eyeK > 0 ? EYES3.lerp(P.expr(ht), ra.eyeP, ra.eyeK) : P.expr(ht); eyeSize = P.size * ra.size; heartK = ra.heartK;
      sx = ra.sx; sy = ra.sy; dy = ra.dy; gaze = P.gaze(ht);
    } else if (cur === "listen") {   // 듣기: 행성 그대로, 몸을 살짝 앞으로 기울여 귀 기울임 + LOOI listen 눈 + 느린 끄덕임
      spinT += dt * .5; const lean = mm(rx(-7 + 2 * Math.sin(ht * 2.2)), rz(4 * Math.sin(ht * 1.1)));
      lastIdleM = mm(W, mm(lean, mm(ra.R, spinM()))); drawRibbons(xf(RIB_IDLE, lastIdleM)); eyeR = mm(W, mm(lean, ra.R));
      eyeP = ra.eyeK > 0 ? EYES3.lerp(EYES3.P.listen, ra.eyeP, ra.eyeK) : EYES3.P.listen; eyeSize = EYE_SIZE.idle * 1.04 * ra.size; heartK = ra.heartK;
      sx = ra.sx; sy = ra.sy; dy = ra.dy; gaze = [gazeCur[0] * .5, .08 + gazeCur[1] * .3];
    } else {
      glOn = true; const o = OBJS[cur], h = objHold(cur, t, ht);
      eyeP = h.eyeP; gaze = h.gaze; eyeSize = h.size; heartK = h.heart; lastView = h.view;
      GLST.R = mm(W, viewM(h.view)); GLST.A = GLST.B = o.id; GLST.mix = 0; GLST.line = 1; GLST.bound = o.Rb + .15; setGLface(OBJ_FACE(o), eyeSize, 1);
      sx = sy = h.pulse;
    }
    if (t > nextBlink) { blinkT0 = t; nextBlink = t + 3 + rnd() * 3; }
    close = Math.max(close, blinkCurve(t - blinkT0, BL_CLOSE, 0, BL_OPEN));
    const hold = isObj(cur) ? OBJS[cur].hold : HOLD_SEC[cur];
    if (auto && ht > hold && t > autoFrom && !react) { cyc = (cyc + 1) % CYCLE.length; go(CYCLE[cyc], t); }
  } else {
    const u = t - tStart, b = next;
    if (b === "think") {   // 행성 → 생각중 (comet.html 그대로: 눌림 → 거리장 소용돌이 → 무늬)
      _spRamp(.30); const E = ENTER, p = springRamp(u - E.ant), ant = sm(u / E.ant);
      const sq = .10 * ant * (1 - clamp(p)), st = .09 * Math.sin(Math.PI * clamp(p));
      const jig = .05 * Math.sin(2 * Math.PI * 2.4 * Math.max(0, u - E.ant - .25)) * Math.exp(-5 * Math.max(0, u - E.ant - .25)) * sm((u - E.ant - .25) / .08);
      sx = 1 + sq - st * .6 + jig; sy = 1 - sq + st - jig;
      if (u < E.ant) { body = "planet"; drawRibbons(xf(RIB_IDLE, snap.idleM)); }
      else if (u < E.fieldEnd) { body = "field"; blendField(p); $("field").setAttribute("d", contourD()); }
      else { body = "think"; THINK.forEach((pts, i) => thinkEls[i].setAttribute("d", toD([pts]))); lastThink = THINK; }
      rot = lastRot = -10 * ant + 100 * p + wz;
      if (u < E.closeEnd) close = sm((u - E.closeAt) / (E.closeEnd - E.closeAt)); else if (u < E.openAt) close = 1; else close = 1 - easeOutL((u - E.openAt) / E.openLen);
      const m = u < E.ant ? 0 : clamp(p);
      eyeR = morphRT(m, mm(W, rz(-10 * ant * (1 - m))));
      eyeSize = snap.size + (EYE_SIZE.think - snap.size) * m;
      eyeP = u < E.openAt + .25 ? EYES3.lerp(snap.eyeP, EYES3.P.surprise, sm((u - E.closeEnd) / (E.openAt - E.closeEnd))) : EYES3.lerp(EYES3.P.surprise, EYES3.P.think, EXPRESS(clamp((u - E.openAt - .25) / .37)));
      gaze = snap.gaze.map((v, i) => v + (holdGaze("think", 0)[i] - v) * m);
      if (u >= E.len) { cur = b; next = null; holdStart = t; ROT0 = 90; render(); }
    } else if (cur === "think") {   // 생각중 → 행성 (comet.html)
      const B = BACK, p = EASE_OUT_QUINT((u - B.bodyAt) / B.bodyLen), ant = sm(u / B.bodyAt), rel = snap.rot;
      let backDelta = -(((rel % 360) + 360) % 360); if (backDelta < -270) backDelta += 360;
      const jig = .03 * Math.sin(2 * Math.PI * 2.4 * Math.max(0, u - B.bodyAt)) * Math.exp(-5 * Math.max(0, u - B.bodyAt)) * sm((u - B.bodyAt) / .08);
      const st = .09 * Math.sin(Math.PI * p); sx = 1 - st * .6 + jig; sy = 1 + st - jig;
      if (u < B.bodyAt) { body = "think"; snap.think.forEach((P, i) => thinkEls[i].setAttribute("d", toD([P.map((q, j) => [q[0] + (THINK[i][j][0] - q[0]) * ant, q[1] + (THINK[i][j][1] - q[1]) * ant])]))); }
      else if (p < .999) { body = "field"; blendField(1 - p); $("field").setAttribute("d", contourD()); }
      else { body = "planet"; drawRibbons(xf(RIB_IDLE, snap.idleM)); }
      rot = lastRot = rel + 8 * ant + (backDelta - 8) * p + wz;
      if (u < B.closeEnd) close = sm(u / B.closeEnd); else if (u < B.openAt) close = 1; else close = 1 - easeOutL((u - B.openAt) / B.openLen);
      const m = u < B.bodyAt ? 1 : 1 - p;
      eyeR = morphRT(m, mm(W, rz(8 * ant * m)));
      eyeSize = snap.size + (EYE_SIZE.idle - snap.size) * (1 - m);
      eyeP = EYES3.lerp(snap.eyeP, IDLE_EYE, sm((u - B.closeEnd) / .2));
      gaze = snap.gaze.map((v, i) => v + (gazeCur[i] - v) * (1 - m));
      if (u >= B.len) { cur = b; next = null; holdStart = t; ROT0 = 0; lastRot = 0; render(); }
    } else if (b === "listen" || (cur === "listen" && b === "idle")) {   // 행성 ↔ 듣기: 몸 그대로, 자세·눈만 0.5초
      const k = sm(u / .5), m = b === "listen" ? k : 1 - k; spinT += dt * (1 - .5 * m);
      const lean = rx(-7 * m); lastIdleM = mm(W, mm(lean, snap.spin)); drawRibbons(xf(RIB_IDLE, lastIdleM)); eyeR = mm(W, lean);
      eyeP = EYES3.lerp(IDLE_EYE, EYES3.P.listen, EXPRESS(m)); eyeSize = EYE_SIZE.idle * (1 + .04 * m); gaze = [gazeCur[0] * (1 - .5 * m), gazeCur[1] + .08 * m];
      if (u >= .5) { cur = b; next = null; holdStart = t; render(); }
    } else if (isPat(b)) {   // 행성(또는 듣기) → 무늬: 거리장 변신
      _spRamp(.40); const P = PATS[b], E = TO_PAT, p = springRamp(u - E.ant), ant = sm(u / E.ant), k = clamp(p);
      const sq = .10 * ant * (1 - k), st = .09 * Math.sin(Math.PI * k);
      sx = 1 + sq - st * .6; sy = 1 - sq + st;
      if (u < E.ant) { body = "planet"; drawRibbons(xf(RIB_IDLE, snap.idleM)); }
      else if (u < E.fieldEnd) { body = "field"; blendField2(p, FIELD.idle, P.field, P.swirl); $("field").setAttribute("d", contourD()); }
      else { body = P.el === "Div" ? "div" : "speak"; $(P.el).setAttribute("transform", ""); }
      const pre = window.__ext.preClosed, openAt = pre ? 1.05 : E.openAt;   // 11-03: 런처가 눈을 미리 감겨 놨으면 감은 채로, 무늬가 피어난 뒤에 뜬다
      if (pre) close = u < openAt ? 1 : 1 - easeOutL((u - openAt) / E.openLen);
      else if (u < E.closeEnd) close = sm((u - E.closeAt) / (E.closeEnd - E.closeAt)); else if (u < E.openAt) close = 1; else close = 1 - easeOutL((u - E.openAt) / E.openLen);
      const m = u < E.ant ? 0 : k; eyeR = patR(P, m, mm(W, rz(-6 * ant * (1 - m))));
      eyeSize = snap.size + (P.size - snap.size) * m;
      eyeP = u < openAt ? snap.eyeP : EYES3.lerp(snap.eyeP, P.expr(0), EXPRESS(clamp((u - openAt) / .4)));
      gaze = snap.gaze.map((v, i) => v + (P.gaze(0)[i] - v) * m);
      if (u >= Math.max(E.len, openAt + E.openLen)) { cur = b; next = null; holdStart = t; render(); }
    } else if (isPat(cur)) {   // 무늬 → 행성: ease-out 으로 되돌아옴
      const P = PATS[cur], E = FROM_PAT, p = EASE_OUT_QUINT((u - E.bodyAt) / E.bodyLen), m = 1 - p;
      const st = .09 * Math.sin(Math.PI * p); sx = 1 - st * .6; sy = 1 + st;
      if (u < E.bodyAt) { body = P.el === "Div" ? "div" : "speak"; }
      else if (p < .999) { body = "field"; blendField2(1 - p, FIELD.ball || FIELD.idle, P.field, P.swirl); $("field").setAttribute("d", contourD()); }
      else { body = "planet"; const band = 1 - pop((u - E.bandAt) / E.bandLen * .62); drawRibbons(xf(ribIdleF(1 + (CLOSE_F - 1) * clamp(band, 0, 1.2)), snap.idleM)); }   // 공 → 흰 줄무늬가 열림
      if (u < E.closeEnd) close = sm(u / E.closeEnd); else if (u < E.openAt) close = 1; else close = 1 - easeOutL((u - E.openAt) / E.openLen);
      eyeR = patR(P, m, W); eyeSize = snap.size + (EYE_SIZE.idle - snap.size) * p;
      eyeP = EYES3.lerp(snap.eyeP, IDLE_EYE, sm((u - E.closeEnd) / .2)); gaze = snap.gaze.map((v, i) => v + (gazeCur[i] - v) * p);
      if (u >= E.len) { cur = b; next = null; holdStart = t; render(); }
    } else if (cur === "idle") {   // 행성 → 사물
      const E = TO_OBJ, o = OBJS[b], ant = sm(u / E.ant);
      const bandK = sm((u - E.bandAt) / (E.bandEnd - E.bandAt));
      if (u < E.closeEnd) close = sm((u - E.closeAt) / (E.closeEnd - E.closeAt)); else if (u < E.openAt) close = 1; else close = 1 - easeOutL((u - E.openAt) / E.openLen);
      if (window.__ext.preClosed) close = u < 1.05 ? 1 : 1 - easeOutL((u - 1.05) / E.openLen);   // 7판: 발산(구슬) — 눈 감은 채 검정이 펼쳐지고, 구슬이 피어난 뒤 뜬다
      const h = objHold(b, t, 0);
      if (u < E.glAt) {
        const pre = rz(-9 * ant);
        drawRibbons(xf(ribIdleF(1 + (CLOSE_F - 1) * bandK), mm(W, mm(pre, snap.spin)))); eyeR = mm(W, pre);
        const sq = .16 * ant; sx = 1 + sq; sy = 1 - sq;
        eyeP = snap.eyeP; eyeSize = snap.size; gaze = snap.gaze;
      } else {
        glOn = true; _spRamp(E.ramp); const p = springRamp(u - E.glAt), k = clamp(p);
        const st = .20 * Math.sin(Math.PI * k) + .06 * (p - k);
        const sq = .16 * (1 - sm(k / .35));
        sx = 1 + sq - st * .55; sy = 1 - sq + st;
        const spin = -9 * (1 - k) + 70 * Math.sin(Math.PI * k) * (1 + .6 * (p - k));
        const vk = sm(k); GLST.R = mm(W, viewM([h.view[0] * vk, h.view[1] * vk, h.view[2] * vk], spin));
        GLST.A = 0; GLST.B = o.id; GLST.mix = p; GLST.line = sm((k - .45) / .5); GLST.bound = Math.max(1, o.Rb) + .25;
        setGLface(faceMix(SPHERE_FACE, OBJ_FACE(o), sm(k)), snap.size + (o.eye - snap.size) * k, PERSP(anchorZ) + (1 - PERSP(anchorZ)) * k);
        eyeP = u < E.openAt + .25 ? EYES3.lerp(snap.eyeP, EYES3.P.surprise, sm((u - E.closeEnd) / (E.openAt - E.closeEnd))) : EYES3.lerp(EYES3.P.surprise, h.eyeP, EXPRESS(clamp((u - E.openAt - .25) / .37)));
        eyeSize = snap.size + (o.eye - snap.size) * k; gaze = snap.gaze.map((v, i) => v + (h.gaze[i] - v) * k); heartK = h.heart * EXPRESS(clamp((u - E.openAt) / .4));
      }
      if (u >= E.len) { cur = b; next = null; holdStart = t; render(); }
    } else if (b === "idle") {   // 사물 → 행성
      const E = window.__ext.convDelay ? TO_IDLE_CONV : TO_IDLE, o = OBJS[cur], p = EASE_OUT_QUINT((u - E.bodyAt) / E.bodyLen), m = 1 - p;
      if (u < E.closeEnd) close = sm(u / E.closeEnd); else if (u < E.openAt) close = 1; else close = 1 - easeOutL((u - E.openAt) / E.openLen);
      const st = .14 * Math.sin(Math.PI * p);
      if (u < E.svgAt) {
        glOn = true; sx = 1 - st * .55; sy = 1 + st;
        GLST.R = mm(W, viewM(snap.view.map(v => v * m), 60 * Math.sin(Math.PI * p))); GLST.A = o.id; GLST.B = 0; GLST.mix = p; GLST.line = 1 - sm(p / .5); GLST.bound = Math.max(1, o.Rb) + .25;
        setGLface(faceMix(OBJ_FACE(o), SPHERE_FACE, sm(p)), snap.size + (EYE_SIZE.idle - snap.size) * p, 1 + (PERSP(anchorZ) - 1) * p);
        eyeP = snap.eyeP; eyeSize = snap.size; gaze = snap.gaze; heartK = snap.heart * (1 - sm(u / .25));
      } else {
        const q = (u - E.svgAt) / (E.bandEnd - E.svgAt), bandK = 1 - pop(q * .62);
        const jig = .04 * Math.sin(2 * Math.PI * 2.4 * (u - E.svgAt)) * Math.exp(-5 * (u - E.svgAt)); sx = 1 - jig; sy = 1 + jig;
        drawRibbons(xf(ribIdleF(1 + (CLOSE_F - 1) * Math.max(0, bandK)), mm(W, snap.spin))); eyeR = W;
        eyeP = EYES3.lerp(snap.eyeP, IDLE_EYE, sm((u - E.svgAt) / .25)); eyeSize = snap.size + (EYE_SIZE.idle - snap.size) * sm((u - E.svgAt) / .3); gaze = snap.gaze.map((v, i) => v + (gazeCur[i] - v) * sm((u - E.svgAt) / .4));
      }
      if (u >= E.len) { cur = b; next = null; holdStart = t; render(); }
    } else {   // 사물 → 사물
      const E = OBJ2OBJ, a = OBJS[cur], o = OBJS[b], ant = sm(u / E.ant); _spRamp(E.ramp);
      const p = springRamp(u - E.ant), k = clamp(p);
      const sq = .14 * ant * (1 - k), st = .16 * Math.sin(Math.PI * k) + .06 * (p - k);
      const jig = .05 * Math.sin(2 * Math.PI * 2.4 * Math.max(0, u - E.ant - .3)) * Math.exp(-5 * Math.max(0, u - E.ant - .3)) * sm((u - E.ant - .3) / .08);
      sx = 1 + sq - st * .6 + jig; sy = 1 - sq + st - jig;
      glOn = true; const h = objHold(b, t, 0), vk = sm(k);
      const view = [0, 1, 2].map(i => snap.view[i] + (h.view[i] - snap.view[i]) * vk), spin = -9 * ant * (1 - k) + 80 * Math.sin(Math.PI * k) * (1 + .6 * (p - k));
      GLST.R = mm(W, viewM(view, spin)); GLST.A = a.id; GLST.B = o.id; GLST.mix = p; GLST.line = (1 - sm(k / .5)) + sm((k - .5) / .5); GLST.bound = Math.max(a.Rb, o.Rb) + .25;
      setGLface(faceMix(OBJ_FACE(a), OBJ_FACE(o), sm(k)), snap.size + (o.eye - snap.size) * k, 1);
      if (u < E.closeEnd) close = sm((u - E.closeAt) / (E.closeEnd - E.closeAt)); else if (u < E.openAt) close = 1; else close = 1 - easeOutL((u - E.openAt) / E.openLen);
      eyeP = u < E.openAt + .25 ? EYES3.lerp(snap.eyeP, EYES3.P.surprise, sm((u - E.closeEnd) / (E.openAt - E.closeEnd))) : EYES3.lerp(EYES3.P.surprise, h.eyeP, EXPRESS(clamp((u - E.openAt - .25) / .37)));
      eyeSize = snap.size + (o.eye - snap.size) * k; gaze = snap.gaze.map((v, i) => v + (h.gaze[i] - v) * k);
      heartK = snap.heart * (1 - sm(u / .3)) + h.heart * EXPRESS(clamp((u - E.openAt) / .4));
      if (u >= E.len) { cur = b; next = null; holdStart = t; render(); }
    }
  }
  lastT = t;
  const br = breatheAt(t);
  lastEyeP = eyeP; lastGaze = gaze; lastSize = eyeSize; lastHeart = heartK;
  if (!GL_READY) glOn = false;   // 5판: 셰이더 준비 전엔 SVG 몸
  showLayer(glOn);
  if (glOn) { GLST.S = br; GLST.Sq = [sx, sy]; bakeEyes(withClose(eyeP, close), gaze, heartK); drawGL(); }
  else {
    showBody(body); $("spin").setAttribute("transform", `rotate(${rot.toFixed(3)})`);
    const tr = `translate(0 ${dy.toFixed(4)}) scale(${(sx * br * extraS).toFixed(4)} ${(sy * br * extraS).toFixed(4)})`; $("root").setAttribute("transform", tr); const rE = $("rootE"); if (rE) rE.setAttribute("transform", tr);
    drawEyesOn(withClose(eyeP, close), eyeR, eyeSize, gaze, heartK);
  }
}
function spring(t, ramp) { if (t <= 0) return 0; if (t > ramp + 2) return 1; const z = .6, w = Math.sqrt(200), dt = .001; let x = 0, v = 0, s = 0; while (s + dt <= t) { const tgt = sm((s + dt) / ramp); v += (w * w * (tgt - x) - 2 * z * w * v) * dt; x += v * dt; s += dt; } return x; }
// ---------- 시계 ----------
const QS = new URLSearchParams(location.search), FAKE = QS.get("clock") === "fake";
let T0 = null;
function tick(now) { const t = now / 1000; if (T0 === null) { T0 = t; holdStart = t; } frame(t); if (!FAKE) requestAnimationFrame(tick); }
window.__m = { step: (sec) => { if (T0 === null) { T0 = 0; holdStart = 0; } frame(sec); }, go: (m, sec) => go(m, sec), react: (ty, sec) => { if (!next && !isObj(cur)) react = { type: ty, t0: sec }; }, expr: (n) => { forceExpr = n && EYES3.P[n] ? n : null; }, setAuto: (v) => { auto = v; }, state: () => ({ cur, next, tStart, holdStart, spinT, react }) };
function render() {
  const bar = $("bar"); if (!bar) return; bar.innerHTML = "";
  for (const [m, lab] of [["idle", "행성"], ["think", "생각중"], ["listen", "듣기"], ["answer", "답변"], ["diverge", "발산"], ["bulb", "전구"], ["message", "메시지"], ["cloud", "생각구름"], ["magnify", "돋보기"], ["heart", "하트"]]) { const b = document.createElement("button"); b.textContent = lab; b.setAttribute("aria-pressed", String((next || cur) === m)); b.onclick = () => { auto = false; go(m, performance.now() / 1000); }; bar.appendChild(b); }
  for (const [ty, lab] of [["shake", "도리도리"], ["surprise", "놀람"], ["happy", "기쁨"], ["heart", "하트눈"]]) { const b = document.createElement("button"); b.textContent = lab; b.onclick = () => { if (!next && !isObj(cur)) react = { type: ty, t0: performance.now() / 1000 }; }; bar.appendChild(b); }
  const sel = document.createElement("select"); sel.innerHTML = '<option value="">표정(대기)</option>' + EYES3.NAMES.map(n => `<option value="${n}">${n}</option>`).join(""); sel.onchange = () => { forceExpr = sel.value || null; }; bar.appendChild(sel);
  const a = document.createElement("button"); a.textContent = auto ? "자동 순환 끄기" : "자동 순환"; a.onclick = () => { auto = !auto; autoFrom = performance.now() / 1000 + .5; render(); }; bar.appendChild(a);
  const meta = $("meta"); if (meta) meta.textContent = (next ? `${cur} → ${next}` : cur) + " · 행성(2판)·생각중(거리장)·발산(물결) = SVG · 사물 = 입체";
}
layoutGL(); render(); if (!FAKE) requestAnimationFrame(tick);

