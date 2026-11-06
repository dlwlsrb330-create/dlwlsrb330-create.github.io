// slime_goo_gl.js — 11-06 진규: 슬라임 분화의 끈적 필터(diverge_slime.js 의 SVG <filter id="goo">)를 같은 수식 그대로 GPU(WebGL2)에서 그린다.
//   SVG 필터는 사파리가 CPU 로 매 프레임 1100×1100 픽셀을 흐리고 합쳐서 아이폰에서 프레임이 떨어졌다. 색 · 모양 · 흐림 반경(σ .11) · 문턱(알파 × 24 − 11) · 합성(atop)은 그대로.
//   공 덩어리(타원)는 diverge_slime.js 가 SVG 에 놓은 값을 매 프레임 읽어 같은 자리에 그리고, SVG 쪽 덩어리 묶음은 숨긴다. 눈 달린 작은 공(#slSpheres)은 SVG 그대로 그 위에.
//   WebGL2 가 없으면 아무것도 하지 않는다(SVG 필터 그대로).
window.SLIME_GOO = (() => {
  const SIGMA = .11, VIEWHALF = 2.6, TH_MUL = 24, TH_ADD = -11, MAXB = 8;
  let cv = null, gl = null, ok = false, dead = false, W = 0, svgEl = null, blobsG = null, on = false;
  let texS, fbS, texA, fbA, texB, fbB, pBlob, pBlur, pComp, vao, quad, U = {};
  const VS = `#version 300 es\nin vec2 p; out vec2 v; void main(){ v = p; gl_Position = vec4(p, 0., 1.); }`;
  // ① 타원: 안티앨리어싱은 거리 / 픽셀 당 변화량(SVG 커버리지 AA 와 같은 꼴). 미리 곱한 알파로 출력
  const FS_BLOB = `#version 300 es\nprecision highp float; in vec2 v; out vec4 o;
    uniform int n; uniform vec4 B[${MAXB}]; uniform vec2 A[${MAXB}]; uniform vec3 C[${MAXB}];   // B = x y rx ry · A = cos sin · C = 색
    void main(){ vec4 acc = vec4(0.);
      for (int i = 0; i < ${MAXB}; i++) { if (i >= n) break;
        vec2 d = v * ${VIEWHALF.toFixed(3)} - B[i].xy; vec2 l = vec2(A[i].x * d.x + A[i].y * d.y, -A[i].y * d.x + A[i].x * d.y);
        float f = length(l / B[i].zw) - 1.; float cov = clamp(.5 - f / max(fwidth(f), 1e-5), 0., 1.);
        vec4 s = vec4(C[i] * cov, cov); acc = s + acc * (1. - s.a); }   // 뒤 덩어리 위에 앞 덩어리 (SVG 문서 순서)
      o = acc; }`;
  // ② 가우스 흐림(분리형). 미리 곱한 RGBA 를 흐린다 (SVG feGaussianBlur 와 같음)
  const FS_BLUR = `#version 300 es\nprecision highp float; in vec2 v; out vec4 o; uniform sampler2D t; uniform vec2 dir; uniform float sig; uniform int rad;
    void main(){ vec2 uv = v * .5 + .5; vec4 acc = vec4(0.); float ws = 0.;
      for (int i = -96; i <= 96; i++) { if (i < -rad) continue; if (i > rad) break; float w = exp(-float(i * i) / (2. * sig * sig)); acc += texture(t, uv + dir * float(i)) * w; ws += w; }
      o = acc / ws; }`;
  // ③ 문턱 + atop 합성: G = 흐린 것의 알파 × 24 − 11 (색은 그대로), 결과 = 원본 atop G
  const FS_COMP = `#version 300 es\nprecision highp float; in vec2 v; out vec4 o; uniform sampler2D S; uniform sampler2D Bt;
    void main(){ vec2 uv = v * .5 + .5; vec4 s = texture(S, uv), b = texture(Bt, uv);
      float ga = clamp(b.a * ${TH_MUL.toFixed(1)} + (${TH_ADD.toFixed(1)}), 0., 1.); vec3 gc = b.a > 1e-5 ? b.rgb / b.a : vec3(0.);
      o = vec4(s.rgb * ga + gc * ga * (1. - s.a), ga); }`;   // atop: src × dst알파 + dst × (1 − src알파), 알파 = dst알파
  function prog(fs) { const mk = (ty, src) => { const sh = gl.createShader(ty); gl.shaderSource(sh, src); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; }
  function tex() { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; }
  function fbo(t) { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return f; }
  function init(svg) {
    if (dead || ok) return ok;
    try {
      svgEl = svg; blobsG = document.getElementById("slBlobs");
      cv = document.createElement("canvas"); cv.id = "slGoo"; cv.setAttribute("aria-hidden", "true");
      cv.style.cssText = svg.style.cssText + ";display:none";   // SVG 와 같은 자리 · 크기 · 층
      gl = cv.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
      if (!gl) { dead = true; return false; }
      pBlob = prog(FS_BLOB); pBlur = prog(FS_BLUR); pComp = prog(FS_COMP);
      for (const [p, names] of [[pBlob, ["n", "B", "A", "C"]], [pBlur, ["t", "dir", "sig", "rad"]], [pComp, ["S", "Bt"]]]) for (const nm of names) U[nm] = gl.getUniformLocation(p, nm);
      quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      vao = gl.createVertexArray(); gl.bindVertexArray(vao); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      texS = tex(); fbS = fbo(texS); texA = tex(); fbA = fbo(texA); texB = tex(); fbB = fbo(texB);
      svg.before(cv);   // SVG(눈 달린 공) 아래, 같은 z-index
      ok = true; blobsG.style.display = "none";
    } catch (e) { dead = true; ok = false; if (cv) cv.remove(); console.warn("slime_goo_gl: WebGL 못 씀 — SVG 필터로", e); }
    return ok;
  }
  function size() {
    const r = svgEl.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 3), w = Math.max(16, Math.round(r.width * dpr));
    if (w === W) return; W = w; cv.width = cv.height = W;
    for (const t of [texS, texA, texB]) { gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, W, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); }
  }
  const RGB = (s) => { if (!s || s.startsWith("var(")) return window.__ink || [.0431, .0431, .0431]; const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(s); if (m) return [+m[1] / 255, +m[2] / 255, +m[3] / 255]; if (s[0] === "#") return [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16) / 255); return window.__ink || [.0431, .0431, .0431]; };
  const bufB = new Float32Array(MAXB * 4), bufA = new Float32Array(MAXB * 2), bufC = new Float32Array(MAXB * 3);
  function sync(blobEls, svg) {
    if (!on || !init(svg)) return;
    let n = 0;
    for (const e of blobEls) {   // SVG 에 놓인 값 그대로 (문서 순서 = 그리는 순서)
      if (e.style.display === "none" || n >= MAXB) continue;
      const m = /translate\(([-\d.e]+) ([-\d.e]+)\) rotate\(([-\d.e]+)\)/.exec(e.getAttribute("transform") || ""); if (!m) continue;
      const a = +m[3] * Math.PI / 180, c = RGB(e.getAttribute("fill"));
      bufB.set([+m[1], +m[2], +e.getAttribute("rx"), +e.getAttribute("ry")], n * 4); bufA.set([Math.cos(a), Math.sin(a)], n * 2); bufC.set(c, n * 3); n++;
    }
    if (!n) { cv.style.display = "none"; return; }
    cv.style.display = "block"; size();
    const sigPx = SIGMA * W / (2 * VIEWHALF), rad = Math.min(96, Math.ceil(3 * sigPx));
    gl.viewport(0, 0, W, W); gl.disable(gl.BLEND); gl.bindVertexArray(vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbS); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);   // ① 원본(타원들) → S
    gl.useProgram(pBlob); gl.uniform1i(U.n, n); gl.uniform4fv(U.B, bufB); gl.uniform2fv(U.A, bufA); gl.uniform3fv(U.C, bufC); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.useProgram(pBlur); gl.uniform1i(U.t, 0); gl.uniform1f(U.sig, sigPx); gl.uniform1i(U.rad, rad); gl.activeTexture(gl.TEXTURE0);   // ② 흐림 가로 → A, 세로 → B
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbA); gl.bindTexture(gl.TEXTURE_2D, texS); gl.uniform2f(U.dir, 1 / W, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbB); gl.bindTexture(gl.TEXTURE_2D, texA); gl.uniform2f(U.dir, 0, 1 / W); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clear(gl.COLOR_BUFFER_BIT);   // ③ 문턱 + atop → 화면
    gl.useProgram(pComp); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texS); gl.uniform1i(U.S, 0); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texB); gl.uniform1i(U.Bt, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function show(v) { on = v; if (cv && !v) cv.style.display = "none"; }
  function enable(v) { if (!ok) return; if (v) { blobsG.style.display = "none"; } else { blobsG.style.display = ""; cv.style.display = "none"; } on = v; }   // 검토용: SVG 필터와 견주기
  return { sync, show, enable, ready: () => ok };
})();
