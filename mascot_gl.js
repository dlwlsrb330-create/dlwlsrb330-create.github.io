// mascot_gl.js — 아이폰 입구(iphone.html)만 읽는 파일. main 파일은 그대로 쓴다.
//   마스코트 SVG(홈 행성 줄무늬 · 발산 공 여섯 개의 줄무늬와 눈)는 main 이 매 프레임 모양을 새로 써서 사파리가 3배 해상도로 CPU 로 다시 그렸다 → 아이폰에서 끊김.
//   → main 이 SVG 에 써 넣은 모양(직선 다각형 M…L…Z) · 위치(getCTM) · 색을 그대로 읽어 같은 순서로 GPU(WebGL2)에 칠한다(스텐실 nonzero 채우기 + 4배 멀티샘플).
//   보이는 SVG 모양은 숨기고 같은 자리 · 크기의 캔버스에 그린다. 원 안으로 잘라 그리는 상태(생각중 · 발산 무늬 등)나 단색이 아닌 칠은 그 프레임만 원래 SVG 로.
//   WebGL2 가 없으면 아무것도 안 함.
(() => {
  const VS = `#version 300 es
in vec2 p; uniform mat3 M; uniform vec2 S;
void main(){ vec3 q = M * vec3(p, 1.); gl_Position = vec4(q.x / S.x * 2. - 1., 1. - q.y / S.y * 2., 0., 1.); }`;
  const FS = `#version 300 es
precision mediump float; uniform vec4 C; out vec4 o; void main(){ o = C; }`;
  const ink = () => { const s = getComputedStyle(document.getElementById("stage")).getPropertyValue("--ink").trim(); return parseColor(s) || [11, 11, 11, 1]; };
  const bgc = () => parseColor(getComputedStyle(document.documentElement).getPropertyValue("--bg").trim()) || [252, 252, 250, 1];
  function parseColor(s) {
    if (!s) return null; s = s.trim();
    let m = /^rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?\)$/.exec(s); if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
    if (/^#[0-9a-f]{6}$/i.test(s)) return [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)).concat(1);
    if (/^#[0-9a-f]{3}$/i.test(s)) return [1, 2, 3].map(i => parseInt(s[i] + s[i], 16)).concat(1);
    return null;
  }
  // 한 SVG 를 맡는 그리개. pick(svg) → 그릴 모양 목록(문서 순서), okNow() → 이번 프레임 GPU 로 그려도 되나
  function renderer(svg, hideEls, pick, okNow) {
    const cv = document.createElement("canvas"); cv.setAttribute("aria-hidden", "true");
    const gl = cv.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    if (!gl) return null;
    const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    const uM = gl.getUniformLocation(pr, "M"), uS = gl.getUniformLocation(pr, "S"), uC = gl.getUniformLocation(pr, "C");
    const buf = gl.createBuffer(), vao = gl.createVertexArray(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const fb = gl.createFramebuffer(), rbC = gl.createRenderbuffer(), rbS = gl.createRenderbuffer();
    let W = 0, H = 0, dpr = 1, on = false, verts = new Float32Array(1 << 16);
    cv.style.cssText = svg.getAttribute("style") || ""; cv.style.position = "absolute"; cv.style.pointerEvents = "none";
    svg.after(cv);
    function size() {
      const r = svg.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 3), w = Math.max(8, Math.round(svg.clientWidth * d)), h = Math.max(8, Math.round(svg.clientHeight * d));
      if (w === W && h === H) return; W = w; H = h; dpr = d; cv.width = W; cv.height = H;
      gl.bindRenderbuffer(gl.RENDERBUFFER, rbC); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, Math.min(4, gl.getParameter(gl.MAX_SAMPLES)), gl.RGBA8, W, H);
      gl.bindRenderbuffer(gl.RENDERBUFFER, rbS); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, Math.min(4, gl.getParameter(gl.MAX_SAMPLES)), gl.DEPTH24_STENCIL8, W, H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, rbC); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, rbS);
    }
    function setOn(v) { if (v === on) return; on = v; cv.style.display = v ? "block" : "none"; hideEls.forEach(e => e.style.visibility = v ? "hidden" : ""); }
    function draw() {
      if (!okNow()) { setOn(false); return; }
      // 캔버스는 SVG 와 같은 자리 · 층 · 투명도 (main 이 SVG 에 거는 opacity · transform 을 따라감)
      cv.style.opacity = svg.style.opacity; cv.style.transform = svg.style.transform; cv.style.left = svg.style.left; cv.style.top = svg.style.top; cv.style.width = svg.style.width || svg.clientWidth + "px"; cv.style.height = svg.style.height || svg.clientHeight + "px";
      if (svg.style.display === "none" || getComputedStyle(svg).display === "none") { setOn(false); return; }
      const items = pick(); if (!items) { setOn(false); return; }
      size();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clearStencil(0); gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
      gl.useProgram(pr); gl.uniform2f(uS, W, H); gl.bindVertexArray(vao); gl.enable(gl.STENCIL_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      const INK = ink(), BG = bgc();
      for (const it of items) {
        const d = it.el.getAttribute("d"); if (!d) continue;
        let col = it.fill; if (col === "ink") col = INK; else if (col === "bg") col = BG; if (!col) continue;
        const a = col[3] * it.op; if (a <= 0) continue;
        const m = it.el.getCTM(); if (!m) continue;
        // d 읽기: M x yLx y…Z 여러 개 → 다각형마다 삼각형 부채꼴
        let n = 0, minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9; const fans = [];
        const re = /([MLZ])([^MLZ]*)/g; let mm, start = -1;
        while ((mm = re.exec(d))) {
          const c = mm[1];
          if (c === "M") { if (start >= 0 && n - start >= 3) fans.push([start, n - start]); start = n; }
          if (c === "M" || c === "L") { const xy = mm[2].trim().split(/[ ,]+/); for (let i = 0; i + 1 < xy.length; i += 2) { const x = +xy[i], y = +xy[i + 1]; if (n * 2 + 2 > verts.length) { const nv = new Float32Array(verts.length * 2); nv.set(verts); verts = nv; } verts[n * 2] = x; verts[n * 2 + 1] = y; n++; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; } }
          if (c === "Z") { if (start >= 0 && n - start >= 3) fans.push([start, n - start]); start = -1; }
        }
        if (start >= 0 && n - start >= 3) fans.push([start, n - start]);
        if (!fans.length) continue;
        const bb = n; verts.set([minx, miny, maxx, miny, maxx, maxy, minx, miny, maxx, maxy, minx, maxy], n * 2); n += 6;   // 덮개(모양 둘레 상자)
        gl.bufferData(gl.ARRAY_BUFFER, verts.subarray(0, n * 2), gl.STREAM_DRAW);
        gl.uniformMatrix3fv(uM, false, [m.a * dpr, m.b * dpr, 0, m.c * dpr, m.d * dpr, 0, m.e * dpr, m.f * dpr, 1]);
        // ① 스텐실: nonzero (앞면 +1 · 뒷면 −1), 색은 안 씀
        gl.colorMask(false, false, false, false); gl.stencilFunc(gl.ALWAYS, 0, 0xff); gl.stencilOpSeparate(gl.FRONT, gl.KEEP, gl.KEEP, gl.INCR_WRAP); gl.stencilOpSeparate(gl.BACK, gl.KEEP, gl.KEEP, gl.DECR_WRAP);
        for (const [s, c] of fans) gl.drawArrays(gl.TRIANGLE_FAN, s, c);
        // ② 덮개: 스텐실 ≠ 0 인 곳만 색, 지나가며 스텐실 0 으로
        gl.colorMask(true, true, true, true); gl.stencilFunc(gl.NOTEQUAL, 0, 0xff); gl.stencilOp(gl.ZERO, gl.ZERO, gl.ZERO);
        gl.uniform4f(uC, col[0] / 255 * a, col[1] / 255 * a, col[2] / 255 * a, a);
        gl.drawArrays(gl.TRIANGLES, bb, 6);
      }
      gl.disable(gl.STENCIL_TEST);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fb); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null); gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      setOn(true);
    }
    let queued = false; const later = () => { if (queued) return; queued = true; queueMicrotask(() => { queued = false; try { draw(); } catch (e) { console.warn("mascot_gl:", e); setOn(false); } }); };
    new MutationObserver(later).observe(svg, { subtree: true, attributes: true, attributeFilter: ["d", "transform", "fill", "style", "opacity", "display"] });
    return { draw: later };
  }
  const colOf = (e, stopAt) => {   // 칠 색: 자기 · 조상 fill 속성 (var(--ink) · var(--bg) · rgb · #) — 단색이 아니면 null
    for (let n = e; n && n !== stopAt; n = n.parentElement) { const f = n.getAttribute && n.getAttribute("fill"); if (!f) continue;
      if (f === "var(--ink)") return "ink"; if (f === "var(--bg)") return "bg"; return parseColor(f); }
    return "ink";
  };
  const opOf = (e, stopAt) => { let o = 1; for (let n = e; n && n !== stopAt; n = n.parentElement) { if (n.style && n.style.display === "none") return 0; const v = n.style && n.style.opacity; if (v !== "" && v !== undefined && v !== null) o *= +v; const a = n.getAttribute && n.getAttribute("opacity"); if (a) o *= +a; } return o; };

  try {
    // ① 발산 공 여섯 개 (diverge_slime.js #slSpheres): 줄무늬 · 눈두덩 · 흰자 · 동공 — 모두 단색 직선 다각형
    const slime = document.getElementById("slime"), spheres = document.getElementById("slSpheres");
    if (slime && spheres) {
      const R = renderer(slime, [spheres], () => {
        const out = []; for (const p of spheres.querySelectorAll("path")) { const op = opOf(p, slime); if (op <= 0) continue; const c = colOf(p, slime); if (!c) return null; out.push({ el: p, fill: c, op }); } return out;
      }, () => true);
      // 끈적 필터 GPU 캔버스(slime_goo_gl.js)가 slime 바로 앞에 있으면 공 캔버스는 그 위(slime 바로 뒤)라 순서 맞음
    }
    // ② 홈 행성 (엔진 #svg #Planet): 줄무늬. 생각중 · 발산 무늬 등 원 안으로 잘라 그리는 몸이 보이면 그 프레임은 SVG 로
    const body = document.getElementById("svg"), planet = document.getElementById("Planet");
    if (body && planet) {
      const clipped = ["Think", "field", "Div", "Speak"].map(id => document.getElementById(id)).filter(Boolean);
      renderer(body, [planet], () => {
        const out = []; for (const p of planet.querySelectorAll("path")) { const op = opOf(p, body); if (op <= 0) continue; const c = colOf(p, body); if (!c) return null; out.push({ el: p, fill: c, op }); }
        if (planet.tagName === "path" || planet.getAttribute("d")) { const c = colOf(planet, body); if (c) out.unshift({ el: planet, fill: c, op: opOf(planet, body) }); }
        return out;
      }, () => body.style.visibility !== "hidden" && clipped.every(e => e.style.display === "none") && planet.style.display !== "none");
    }
  } catch (e) { console.warn("mascot_gl: WebGL 못 씀 — SVG 그대로", e); }
})();
