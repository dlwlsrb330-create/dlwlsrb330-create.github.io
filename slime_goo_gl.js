// slime_goo_gl.js — 아이폰 입구(iphone.html)만 읽는 파일. main 의 diverge_slime.js 는 그대로 쓰고 고치지 않는다.
//   슬라임 분화의 끈적 필터(SVG <filter id="goo">: 흐림 σ .11 → 알파 × 24 − 11 → atop)는 사파리가 CPU 로 매 프레임 약 110만 픽셀을 흐려 아이폰에서 끊긴다.
//   → 슬라임이 SVG(#slBlobs)에 놓는 타원 값을 그대로 읽어 같은 수식을 GPU(WebGL2)에서 계산해 같은 자리에 그리고, SVG 쪽 덩어리 묶음은 숨긴다.
//   읽는 시점: 슬라임이 그 프레임의 타원 값을 다 쓴 직후(MutationObserver — 같은 프레임 안). WebGL2 가 없으면 아무것도 안 함(SVG 그대로).
(() => {
  const SIGMA = .11, VIEWHALF = 2.6, TH_MUL = 24, TH_ADD = -11, MAXB = 8;
  const svg = document.getElementById("slime"), blobsG = document.getElementById("slBlobs");
  if (!svg || !blobsG) return;
  let cv, gl, W = 0, texS, fbS, texA, fbA, texB, fbB, pBlob, pBlur, pComp, vao, U = {};
  const VS = `#version 300 es\nin vec2 p; out vec2 v; void main(){ v = p; gl_Position = vec4(p, 0., 1.); }`;
  const FS_BLOB = `#version 300 es\nprecision highp float; in vec2 v; out vec4 o;
    uniform int n; uniform vec4 B[${MAXB}]; uniform vec2 A[${MAXB}]; uniform vec3 C[${MAXB}];
    void main(){ vec4 acc = vec4(0.);
      for (int i = 0; i < ${MAXB}; i++) { if (i >= n) break;
        vec2 d = v * ${VIEWHALF.toFixed(3)} - B[i].xy; vec2 l = vec2(A[i].x * d.x + A[i].y * d.y, -A[i].y * d.x + A[i].x * d.y);
        float f = length(l / B[i].zw) - 1.; float cov = clamp(.5 - f / max(fwidth(f), 1e-5), 0., 1.);
        vec4 s = vec4(C[i] * cov, cov); acc = s + acc * (1. - s.a); }
      o = acc; }`;
  const FS_BLUR = `#version 300 es\nprecision highp float; in vec2 v; out vec4 o; uniform sampler2D t; uniform vec2 dir; uniform float sig; uniform int rad;
    void main(){ vec2 uv = v * .5 + .5; vec4 acc = vec4(0.); float ws = 0.;
      for (int i = -96; i <= 96; i++) { if (i < -rad) continue; if (i > rad) break; float w = exp(-float(i * i) / (2. * sig * sig)); acc += texture(t, uv + dir * float(i)) * w; ws += w; }
      o = acc / ws; }`;
  const FS_COMP = `#version 300 es\nprecision highp float; in vec2 v; out vec4 o; uniform sampler2D S; uniform sampler2D Bt;
    void main(){ vec2 uv = v * .5 + .5; vec4 s = texture(S, uv), b = texture(Bt, uv);
      float ga = clamp(b.a * ${TH_MUL.toFixed(1)} + (${TH_ADD.toFixed(1)}), 0., 1.); vec3 gc = b.a > 1e-5 ? b.rgb / b.a : vec3(0.);
      o = vec4(s.rgb * ga + gc * ga * (1. - s.a), ga); }`;
  let ready = null;   // null = 아직 안 만듦 · true = GPU 준비 · false = 못 씀(SVG 그대로)
  function init() {   // 처음 슬라임이 보일 때 만든다 (페이지 열 때 바로 만들지 않음)
  try {
    cv = document.createElement("canvas"); cv.id = "slGoo"; cv.setAttribute("aria-hidden", "true");
    gl = cv.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    if (!gl) return (ready = false);
    const prog = (fs) => { const mk = (ty, src) => { const sh = gl.createShader(ty); gl.shaderSource(sh, src); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
      const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
    pBlob = prog(FS_BLOB); pBlur = prog(FS_BLUR); pComp = prog(FS_COMP);
    for (const [p, names] of [[pBlob, ["n", "B", "A", "C"]], [pBlur, ["t", "dir", "sig", "rad"]], [pComp, ["S", "Bt"]]]) for (const nm of names) U[nm] = gl.getUniformLocation(p, nm);
    const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    vao = gl.createVertexArray(); gl.bindVertexArray(vao); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const tex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v); return t; };
    const fbo = (t) => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return f; };
    texS = tex(); fbS = fbo(texS); texA = tex(); fbA = fbo(texA); texB = tex(); fbB = fbo(texB);
  } catch (e) { console.warn("slime_goo_gl: WebGL 못 씀 — SVG 필터 그대로", e); return (ready = false); }
  cv.style.cssText = svg.style.cssText; cv.style.display = "none"; svg.before(cv);   // 슬라임 SVG 와 같은 자리 · 크기 · 층, 그 바로 아래 (눈 달린 작은 공은 SVG 그대로 위에)
  blobsG.style.display = "none";   // SVG 필터 묶음은 그리지 않음 (값은 슬라임이 계속 써 넣고 여기서 읽음)
  return (ready = true);
  }

  const RGB = (s) => { const ink = window.__ink || [.0431, .0431, .0431]; if (!s || s.startsWith("var(")) return ink; const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(s); if (m) return [+m[1] / 255, +m[2] / 255, +m[3] / 255]; if (s[0] === "#") return [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16) / 255); return ink; };
  const bufB = new Float32Array(MAXB * 4), bufA = new Float32Array(MAXB * 2), bufC = new Float32Array(MAXB * 3);
  function draw() {
    if (svg.style.display === "none") { if (cv) cv.style.display = "none"; return; }
    if (ready === null) init(); if (!ready) return;
    let n = 0;
    for (const e of blobsG.children) {   // 문서 순서 = 그리는 순서 (SVG 와 같음)
      if (e.style.display === "none" || n >= MAXB) continue;
      const m = /translate\(([-\d.e]+) ([-\d.e]+)\) rotate\(([-\d.e]+)\)/.exec(e.getAttribute("transform") || ""); if (!m) continue;
      const a = +m[3] * Math.PI / 180;
      bufB.set([+m[1], +m[2], +e.getAttribute("rx"), +e.getAttribute("ry")], n * 4); bufA.set([Math.cos(a), Math.sin(a)], n * 2); bufC.set(RGB(e.getAttribute("fill")), n * 3); n++;
    }
    if (!n) { cv.style.display = "none"; return; }
    if (cv.style.display !== "block") cv.style.display = "block";
    const r = svg.getBoundingClientRect(), w = Math.max(16, Math.round(r.width * Math.min(window.devicePixelRatio || 1, 3)));
    if (w !== W) { W = w; cv.width = cv.height = W; for (const t of [texS, texA, texB]) { gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, W, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); } }
    const sigPx = SIGMA * W / (2 * VIEWHALF), rad = Math.min(96, Math.ceil(3 * sigPx));
    gl.viewport(0, 0, W, W); gl.disable(gl.BLEND); gl.bindVertexArray(vao); gl.clearColor(0, 0, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbS); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(pBlob); gl.uniform1i(U.n, n); gl.uniform4fv(U.B, bufB); gl.uniform2fv(U.A, bufA); gl.uniform3fv(U.C, bufC); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.useProgram(pBlur); gl.uniform1i(U.t, 0); gl.uniform1f(U.sig, sigPx); gl.uniform1i(U.rad, rad); gl.activeTexture(gl.TEXTURE0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbA); gl.bindTexture(gl.TEXTURE_2D, texS); gl.uniform2f(U.dir, 1 / W, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbB); gl.bindTexture(gl.TEXTURE_2D, texA); gl.uniform2f(U.dir, 0, 1 / W); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(pComp); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texS); gl.uniform1i(U.S, 0); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texB); gl.uniform1i(U.Bt, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  let queued = false; const later = () => { if (queued) return; queued = true; queueMicrotask(() => { queued = false; draw(); }); };   // 한 프레임에 여러 값이 바뀌어도 한 번만
  new MutationObserver(later).observe(blobsG, { subtree: true, attributes: true, attributeFilter: ["transform", "rx", "ry", "fill", "style"] });
  new MutationObserver(later).observe(svg, { attributes: true, attributeFilter: ["style"] });
  window.SLIME_GOO = { draw, ready: () => ready };
})();
