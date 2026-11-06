// iphone.js — 아이폰 실기기 입구(iphone.html)에서만 읽는다. 데스크탑 index.html 은 안 읽음.
// ① 비율: 390 기준 화면을 가로에 맞춰 균일하게 키우고(scale = innerWidth / 390), 남는 세로는 아래에 붙는 것(입력 바 · 시트 · 아래 단추)이 같이 내려가게
// ② 진짜 iOS 상태 표시줄 · 홈 표시줄 (가짜는 iphone.css 가 숨김), 홈 화면 아이콘
// ③ 아이폰 손짓: 왼쪽 가장자리 쓸어 뒤로 · 시트 끌어 닫기 · 키보드 위로 입력 바 · 확대 막기
// ④ 개발자 판(오른쪽 위 모서리 1초 길게 누르기) · FPS 숫자
// COMET.build · APP5.init 바로 앞에서 읽히고, 화면이 다 만들어진 뒤(DOMContentLoaded) 일을 시작한다.
(() => {
  { const MO = window.MutationObserver;   // app5.js 1061줄 new MutationObserver(() => setTimeout(run, 60)) — 넘김 애니메이션 한가운데 글자 전부를 읽던 것을 넘김 뒤로
    window.MutationObserver = class extends MO { constructor(cb) { super(/setTimeout\(run, 60\)/.test(String(cb)) ? (...a) => setTimeout(() => cb(...a), 400) : cb); } }; }
  const W = 390, H0 = 844, SB_H = 54;   // SB_H: 디자인의 가짜 상태 표시줄 높이 (statusbar.js #sbar)
  const root = document.documentElement, $ = (id) => document.getElementById(id);
  const PH = window.PH = { s: 1, h: H0, extra: 0, safeTop: 0, safeBottom: 0 };
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  // ---------- ① 비율 ----------
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)";
  const typingNow = () => { const a = document.activeElement; return !!(a && a.matches && a.matches("input, textarea, [contenteditable='true']")); };
  function fit() {
    if (typingNow() && PH.baseVH) return;   // 키보드가 올라와 창이 줄어든 것은 배율을 다시 잡지 않는다 (keyboard 가 입력 바만 올림)
    // 상태 표시줄은 iOS 기본 방식(apple-mobile-web-app-status-bar-style=default): iOS 가 시계 · 배터리 줄을 앱 위에 따로 그리고, 앱은 그 아래만 받는다.
    //   (투명 black-translucent 는 iOS 26 홈 화면 앱에서 아래 63pt 를 앱이 못 써서 잘렸음)
    //   그래서 페이지가 상태 표시줄 밑으로 안 들어가면(safe-area-inset-top ≈ 0) 디자인 맨 위 가짜 상태 표시줄 자리(TOP 54)를 위로 밀어 숨긴다
    if (probe.isConnected) { const cs = getComputedStyle(probe); PH.safeTop = parseFloat(cs.paddingTop) || 0; PH.safeBottom = parseFloat(cs.paddingBottom) || 0; }
    const TOP = PH.safeTop < 20 ? SB_H : 0, vw = innerWidth, vh = innerHeight; PH.baseVH = vh;
    let s = vw / W, h = vh / s + TOP, x = 0;
    if (h < H0) { s = vh / (H0 - TOP); h = H0; x = (vw - W * s) / 2; }   // 디자인보다 짧은 화면: 아래를 끌어올리지 않고 높이에 맞춰 통째로 줄임, 좌우는 바탕색
    PH.s = s; PH.h = h; PH.extra = h - H0; PH.x = x; PH.top = TOP;
    root.style.setProperty("--ph-x", x.toFixed(2) + "px");
    root.style.setProperty("--ph-y", (-TOP * s).toFixed(2) + "px");
    root.style.setProperty("--ph-vh", vh + "px");
    root.style.setProperty("--ph-s", s.toFixed(5)); root.style.setProperty("--ph-h", h.toFixed(2) + "px");
    shiftAll();
  }

  // 아래에 붙는 것 찾기 — 화면 조각(.fig)의 바로 아래 자식 중
  //   시트 화면: 시트 조각(.sheetpart) 전부가 같이 내려감, 어두운 막(dim)은 높이만 늘림
  //   보통 화면: 아래 끝 근처의 넓은 상자(입력 바 · 아래 단추 줄) 윗선부터 아래 전부. 화면 꼭대기에서 바닥까지 닿는 바탕은 높이만 늘림
  const TAGGED = new Set();
  const topOf = (k) => { const t = parseFloat(k.style.top); return isNaN(t) ? k.offsetTop : t; };
  function tagFig(fig) {
    if (!fig) return;
    const overlay = !!fig.closest(".scr.overlay"), kids = [...fig.children];
    // 앱 코드가 그 사이 top 을 새로 썼으면(디자인 좌표로) 그 값을 원래 자리로 본다
    for (const k of kids) {
      if (k._phT === undefined) continue;
      const now = k._phMode === "grow" ? parseFloat(k.style.height) : topOf(k);
      if (Math.abs(now - (k._phT + k._phD)) > .5) { k._phT = now; k._phD = 0; }
    }
    let cutoff = Infinity;
    if (!overlay) {
      for (const k of kids) {
        if (k._phT !== undefined && k._phMode === "move") { cutoff = Math.min(cutoff, k._phT); continue; }
        if (k._phT !== undefined) continue;
        const t = topOf(k), h = k.offsetHeight, w = k.offsetWidth, cs = k.style;
        if (t < H0 - 300 || t >= H0 || t + h < H0 - 110 || h > 300) continue;
        const boxy = (w >= 200 && h >= 36 && (cs.backgroundColor || cs.borderStyle || cs.borderWidth)) || /^(home indicator|입력|바|btn|버튼|탭|하단|bottom)/i.test(k.dataset.name || "");
        if (boxy) cutoff = Math.min(cutoff, t);
      }
      if (cutoff === Infinity) cutoff = H0 - 60;
    }
    for (const k of kids) {
      if (k._phT !== undefined) continue;
      const t = topOf(k), h = k.offsetHeight;
      let mode = null;
      if (overlay) mode = k.classList.contains("sheetpart") ? "move" : (t <= 1 && t + h >= H0 - 2 ? "grow" : null);
      else if (t <= 1 && t + h >= H0 - 2 && h <= H0 + 2) mode = "grow";
      else if (t >= cutoff - 56 && t < H0 + 40) mode = "move";   // 입력 바 바로 위에 붙은 줄(추천 칩 등)도 같이
      // 가짜 홈 표시줄(134×4~5 막대)은 이름이 달라도 숨김
      if (t >= H0 - 24 && h <= 6 && Math.abs(k.offsetWidth - 134) <= 8) k.classList.add("ph-fake-hi");
      if (mode === "grow" && !(/px$/.test(k.style.height) && parseFloat(k.style.height) >= H0 - 2)) mode = null;   // 높이를 px 로 적어 둔 바탕만 늘린다 (inset 으로 붙은 막은 화면 높이를 저절로 따라감)
      if (!mode) continue;
      k._phT = mode === "grow" ? parseFloat(k.style.height) : t; k._phD = 0; k._phMode = mode; TAGGED.add(k);
    }
  }
  function shiftEl(k, dy) {
    if (k._phMode === "grow") { const v = k._phT + dy; if (k._phD !== dy) { k.style.height = v + "px"; k._phD = dy; } return; }
    if (k._phD === dy && Math.abs(topOf(k) - (k._phT + dy)) < .5) return;
    k.style.top = (k._phT + dy) + "px"; k._phD = dy;
  }
  function shiftAll() { const dy = +PH.extra.toFixed(2); for (const k of TAGGED) { if (!k.isConnected) { TAGGED.delete(k); continue; } shiftEl(k, dy); } }
  function tagAll() { document.querySelectorAll("#screens .scr > .fig").forEach(tagFig); shiftAll(); }

  // ---------- ② 홈 화면 아이콘: icon.svg 를 180px 그림으로 (iOS 는 SVG apple-touch-icon 을 안 읽음) ----------
  function touchIcon() {
    const link = $("touchIcon"); if (!link) return;
    const img = new Image(); img.onload = () => { try { const c = document.createElement("canvas"); c.width = c.height = 180; c.getContext("2d").drawImage(img, 0, 0, 180, 180); link.href = c.toDataURL("image/png"); } catch (e) {} };
    img.src = "/icon.svg?v=ip1106a";
  }

  // ---------- 공용: 화면 기록 ----------
  const OVER = () => (typeof SCREENS !== "undefined" && SCREENS.overlay) || [], DARK = () => (typeof SCREENS !== "undefined" && SCREENS.dark) || [];   // SCREENS 는 const 라 window 에 안 붙음
  const isOver = (id) => OVER().includes(id), isDark = (id) => DARK().includes(id);
  const ready = () => typeof COMET !== "undefined" && typeof T0 !== "undefined" && T0 !== null && $("home") && $("home").style.display === "none";
  const toPh = (px) => px / PH.s;   // 화면 px → 폰(390 기준) px

  // 스프링 곡선(시간 기준) → CSS linear() 로. 놓을 때 '제자리로' 돌아가는 움직임
  function spring(stiff = 260, damp = 28, ms = 520) {
    const pts = []; let x = 0, v = 0; const dt = 1 / 240, N = Math.round(ms / 1000 / dt);
    for (let i = 0; i <= N; i++) { if (i % 6 === 0) pts.push(Math.min(1.2, x).toFixed(4)); const a = stiff * (1 - x) - damp * v; v += a * dt; x += v * dt; }
    pts.push("1"); return `linear(${pts.join(",")})`;
  }
  const EASE_SPRING = (() => { try { return CSS.supports("transition-timing-function", "linear(0, 1)") ? spring() : "cubic-bezier(.2,.9,.3,1)"; } catch (e) { return "cubic-bezier(.2,.9,.3,1)"; } })();
  const EASE_OUT = "cubic-bezier(.2,.8,.2,1)";

  // 손가락 속도 (화면 px/ms) — 최근 80ms 만
  const track = () => { const pts = []; return { add(x, y) { const t = performance.now(); pts.push([t, x, y]); while (pts.length > 2 && t - pts[0][0] > 80) pts.shift(); },
    v() { if (pts.length < 2) return [0, 0]; const a = pts[0], b = pts[pts.length - 1], d = Math.max(1, b[0] - a[0]); return [(b[1] - a[1]) / d, (b[2] - a[2]) / d]; } }; };

  // ---------- ③-1 왼쪽 가장자리 쓸어 뒤로 ----------
  let G = null; PH.gesture = () => G;   // 지금 손짓 하나 (가장자리 · 시트 · 길게 누르기)
  function edgeStart(e) {
    if (!ready() || e.clientX - (PH.x || 0) > 20) return false;
    const id = COMET.cur(); if (!id || id === "H1" || id === "D1" || isOver(id)) return false;   // 홈 · 발산 첫 화면(뒤로 = 수렴) · 시트 위에서는 안 받음
    if (id === "OB-1") return false;                                                             // 온보딩 첫 장은 뒤가 없음
    G = { kind: "edge", cand: true, pid: e.pointerId, x0: e.clientX, y0: e.clientY, tr: track() }; G.tr.add(e.clientX, e.clientY); return true;
  }
  function edgeEngage() { blockOn();
    const st = COMET.stack(), id = COMET.cur(), top = COMET.SCR[id].el, low = [];
    if (st.length > 1) { let k = st.length - 2; while (k > 0 && isOver(st[k].id)) k--; for (let i = k; i <= st.length - 2; i++) { const s = COMET.SCR[st[i].id]; if (s && s.el !== top) low.push(s.el); } }
    const dark = isDark(id);
    for (const el of [top, ...low]) el.classList.remove("in-push", "in-back", "out-fwd", "out-push", "in-sheet");
    top.classList.add("ph-edge-top"); top.style.zIndex = dark ? "5" : "2";
    const wasOn = low.map(el => el.classList.contains("on"));
    low.forEach((el, i) => { el.classList.add("on", "ph-edge-low"); if (!isOver(el.id.slice(4))) el.style.zIndex = dark ? "4" : "1"; });
    const shade = document.createElement("div"); shade.className = "ph-edge-shade"; if (low[0]) low[0].appendChild(shade);
    const stage = $("stage"), withStage = stage && !stage.classList.contains("hid") && !stage.classList.contains("front");
    Object.assign(G, { cand: false, id, top, low, wasOn, shade, stage: withStage ? stage : null });
  }
  function edgeSet(p) {   // p: 0 ~ 390 (폰 px)
    const k = p / W;
    G.top.style.transform = `translate3d(${p.toFixed(2)}px,0,0)`;
    const lx = (-.3 * W * (1 - k)).toFixed(2); G.low.forEach(el => el.style.transform = `translate3d(${lx}px,0,0)`);
    G.shade.style.opacity = (.2 * (1 - k)).toFixed(3);
    if (G.stage) G.stage.style.translate = `${p.toFixed(2)}px 0`;
    G.p = p;
  }
  function edgeEnd(cancelled) {
    const g = G; G = null; if (g.cand) return;
    const [vx] = g.tr.v(), go = !cancelled && (g.p > W / 2 || vx > .5) && vx > -.2;
    const from = g.p, to = go ? W : 0, vPh = Math.max(.9, Math.abs(toPh(vx)));
    const dur = go ? Math.max(150, Math.min(330, (W - from) / vPh)) : 460, ease = go ? EASE_OUT : EASE_SPRING;
    const opt = { duration: dur, easing: ease, fill: "forwards" }, anims = [];
    anims.push(g.top.animate([{ transform: `translate3d(${from}px,0,0)` }, { transform: `translate3d(${to}px,0,0)` }], opt));
    const lx0 = -.3 * W * (1 - from / W), lx1 = go ? 0 : -.3 * W;
    g.low.forEach(el => anims.push(el.animate([{ transform: `translate3d(${lx0}px,0,0)` }, { transform: `translate3d(${lx1}px,0,0)` }], opt)));
    anims.push(g.shade.animate([{ opacity: .2 * (1 - from / W) }, { opacity: go ? 0 : .2 }], opt));
    if (g.stage) anims.push(g.stage.animate([{ translate: `${from}px 0`, opacity: 1 }, { translate: `${to}px 0`, opacity: go ? 0 : 1 }], opt));
    anims[0].finished.then(() => {
      const clean = () => {
        anims.forEach(a => a.cancel()); g.shade.remove();
        g.top.classList.remove("ph-edge-top"); g.top.style.transform = ""; g.top.style.zIndex = "";
        g.low.forEach(el => { el.classList.remove("ph-edge-low"); el.style.transform = ""; el.style.zIndex = ""; });
      };
      if (go) {
        COMET.back();
        g.top.classList.remove("out-push", "out-fwd"); g.low.forEach(el => el.classList.remove("in-back", "in-push"));   // 이미 손으로 넘겼으니 router 의 넘김 애니메이션은 다시 안 돌림
        clean();
        if (g.stage) { const s = g.stage; s.getAnimations().forEach(a => a.cancel()); s.style.translate = ""; if (!s.classList.contains("hid")) { const tr = s.style.transition; s.style.transition = "none"; s.style.opacity = "0"; void s.offsetWidth; s.style.transition = tr; s.style.opacity = ""; } }
      } else {
        g.low.forEach((el, i) => { if (!g.wasOn[i]) el.classList.remove("on"); }); clean();
        if (g.stage) g.stage.style.translate = "";
      }
    });
  }

  // ---------- ③-2 시트 끌어 닫기 ----------
  function sheetParts() {
    const id = COMET.cur(); if (!id || !isOver(id)) return null;
    const scr = COMET.SCR[id]; if (!scr) return null;
    const parts = [...scr.fig.querySelectorAll(":scope > .sheetpart")].filter(k => k.offsetWidth && getComputedStyle(k).display !== "none");
    if (!parts.length) return null;
    let big = parts[0], area = 0; for (const k of parts) { const a = k.offsetWidth * k.offsetHeight; if (a > area) { area = a; big = k; } }
    const r = big.getBoundingClientRect(), ph = $("phone").getBoundingClientRect();
    let axis = null;
    if (r.width >= ph.width * .75 && r.top >= ph.top + 60 && r.bottom >= ph.bottom - 4) axis = "y";        // 바닥에 붙은 넓은 시트 → 아래로 끌어 닫기
    else if (r.width >= 200 && r.right >= ph.right - 4 && r.top <= ph.top + 10 && r.bottom >= ph.bottom - 4) axis = "x";   // 오른쪽에서 나오는 사이드바(M1) → 오른쪽으로 밀어 닫기
    if (!axis) return null;
    const extra = [...scr.el.querySelectorAll(":scope > .beodial")];
    const dim = scr.fig.querySelector(':scope > [data-name="dim"]');
    return { id, scr, parts, extra, dim, rect: r, axis };
  }
  function sheetStart(e) {
    if (!ready()) return false; const sp = sheetParts(); if (!sp) return false;
    if (sp.axis === "y" && (e.clientY < sp.rect.top - 6 || e.clientY > sp.rect.top + 64 * PH.s)) return false;   // 손잡이 · 시트 위쪽 64px 만
    if (sp.axis === "x" && (e.clientX < sp.rect.left || e.clientY < sp.rect.top)) return false;                  // 사이드바는 판 어디서든
    if (e.target.closest("input, textarea, [contenteditable='true']")) return false;
    G = { kind: "sheet", cand: true, pid: e.pointerId, x0: e.clientX, y0: e.clientY, tr: track(), sp }; G.tr.add(e.clientX, e.clientY); return true;
  }
  function sheetEngage() { blockOn();
    const { scr, parts, extra } = G.sp; scr.el.classList.remove("in-sheet");
    G.els = [...parts, ...extra].map(k => ({ k, tf: k.style.transform || "", wc: k.style.willChange })); G.els.forEach(o => { o.k.style.willChange = "transform"; });
    G.st = $("stage").classList.contains("front") ? $("stage") : null;
    G.ax = G.sp.axis; G.h = toPh(G.ax === "x" ? G.sp.rect.width : G.sp.rect.height); G.cand = false;
  }
  function sheetSet(dy) {   // dy: 폰 px, 0 이상 (위로는 살짝만 버팀)
    const y = dy < 0 ? -Math.pow(-dy, .6) : dy;
    const T = (v) => G.ax === "x" ? `translate3d(${v.toFixed(2)}px,0,0)` : `translate3d(0,${v.toFixed(2)}px,0)`;
    G.els.forEach(o => o.k.style.transform = `${T(y)} ${o.tf}`);
    if (G.sp.dim) G.sp.dim.style.opacity = Math.max(0, 1 - Math.max(0, y) / G.h).toFixed(3);
    if (G.st) G.st.style.translate = G.ax === "x" ? `${y.toFixed(2)}px 0` : `0 ${y.toFixed(2)}px`;
    G.y = y;
  }
  function sheetEnd(cancelled) {
    const g = G; G = null; if (g.cand) return;
    const vv2 = g.tr.v(), vy = g.ax === "x" ? vv2[0] : vv2[1], go = !cancelled && (g.y > g.h * .35 || vy > .5) && vy > -.2;
    const from = g.y, to = go ? g.h + 40 : 0, vPh = Math.max(.9, Math.abs(toPh(vy)));
    const opt = { duration: go ? Math.max(160, Math.min(320, (to - from) / vPh)) : 460, easing: go ? EASE_OUT : EASE_SPRING, fill: "forwards" }, anims = [];
    const T = (v) => g.ax === "x" ? `translate3d(${v}px,0,0)` : `translate3d(0,${v}px,0)`;
    g.els.forEach(o => anims.push(o.k.animate([{ transform: `${T(from)} ${o.tf}` }, { transform: `${T(to)} ${o.tf}` }], opt)));
    if (g.sp.dim) anims.push(g.sp.dim.animate([{ opacity: Math.max(0, 1 - from / g.h) }, { opacity: go ? 0 : 1 }], opt));
    if (g.st) anims.push(g.st.animate(g.ax === "x" ? [{ translate: `${from}px 0` }, { translate: `${to}px 0` }] : [{ translate: `0 ${from}px` }, { translate: `0 ${to}px` }], opt));
    if (!anims.length) return;
    anims[0].finished.then(() => {
      if (go) { COMET.back(); g.sp.scr.el.classList.remove("out-sheet"); }
      anims.forEach(a => a.cancel());
      g.els.forEach(o => { o.k.style.transform = o.tf; o.k.style.willChange = o.wc || ""; });
      if (g.sp.dim) g.sp.dim.style.opacity = ""; if (g.st) g.st.style.translate = "";
    });
  }

  // ---------- ④ 개발자 판 ----------
  let dev = null, fpsOn = ls.get("comet.fps") === "1", fpsEl = null;
  function devPanel() {
    if (dev) return dev;
    dev = document.createElement("div"); dev.id = "phDev";
    const btn = (label, fn) => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.addEventListener("click", (e) => { e.stopPropagation(); fn(b); }); return b; };
    const OB = "comet.obFirst", obOn = () => ls.get(OB) === "1";
    const ob = btn("", () => { ls.set(OB, obOn() ? "0" : "1"); paint(); });
    const fps = btn("", () => { fpsOn = !fpsOn; ls.set("comet.fps", fpsOn ? "1" : "0"); fpsShow(); paint(); });
    const paint = () => { ob.textContent = obOn() ? "온보딩부터 켬" : "온보딩부터 끔"; ob.setAttribute("aria-pressed", String(obOn())); fps.textContent = fpsOn ? "FPS 숫자 켬" : "FPS 숫자 끔"; fps.setAttribute("aria-pressed", String(fpsOn)); };
    const head = document.createElement("b"); head.textContent = "개발자";
    const list = document.createElement("div"); list.className = "list";
    const fill = () => { list.textContent = ""; const j = $("jump"); if (!j) return; for (const b of j.querySelectorAll("button")) list.appendChild(btn(b.textContent, () => { close(); b.click(); })).setAttribute("aria-pressed", b.getAttribute("aria-pressed") || "false"); };
    const lh = document.createElement("b"); lh.textContent = "화면 바로가기";
    const close = () => dev.classList.remove("on");
    dev.append(head, ob, btn("처음부터 다시", () => location.reload()), fps, lh, list, btn("닫기", close));
    for (const k of ["pointerdown", "click", "touchstart"]) dev.addEventListener(k, (e) => e.stopPropagation());
    document.body.appendChild(dev); dev._open = () => { paint(); fill(); dev.classList.add("on"); }; return dev;
  }
  function fpsShow() {
    if (!fpsEl) { fpsEl = document.createElement("div"); fpsEl.id = "phFps"; document.body.appendChild(fpsEl);
      let n = 0, t0 = performance.now(), worst = 0, last = t0;
      (function f(now) { n++; worst = Math.max(worst, now - last); last = now; if (now - t0 >= 500) { fpsEl.textContent = `${Math.round(n * 1000 / (now - t0))} fps · 최장 ${worst.toFixed(1)}ms`; n = 0; t0 = now; worst = 0; } requestAnimationFrame(f); })(t0); }
    fpsEl.classList.toggle("on", fpsOn);
  }
  function eatNextClick() { const f = (e) => { e.stopPropagation(); e.preventDefault(); }; addEventListener("click", f, true); setTimeout(() => removeEventListener("click", f, true), 400); }

  // ---------- 손짓 받기 (포인터 · 캡처 단계에서 먼저) ----------
  function down(e) {
    if (G || !e.isPrimary || (dev && dev.contains(e.target))) return;
    if (e.clientX > innerWidth - 56 && e.clientY < 64) {   // 오른쪽 위 모서리 1초
      G = { kind: "long", cand: true, pid: e.pointerId, x0: e.clientX, y0: e.clientY, tr: track() };
      G.timer = setTimeout(() => { if (G && G.kind === "long") { G = null; devPanel()._open(); eatNextClick(); } }, 1000);
      return;
    }
    if (edgeStart(e)) return;
    sheetStart(e);
  }
  function move(e) {
    if (!G || e.pointerId !== G.pid) return;
    const dx = e.clientX - G.x0, dy = e.clientY - G.y0; G.tr.add(e.clientX, e.clientY);
    if (G.kind === "long") { if (Math.hypot(dx, dy) > 10) { clearTimeout(G.timer); G = null; } return; }
    if (G.cand) {
      const d = Math.hypot(dx, dy); if (d < 8) return;
      if (G.kind === "edge" && dx > Math.abs(dy)) edgeEngage();
      else if (G.kind === "sheet") { if (d < 14) return; if (G.sp.axis === "x" ? dx > 2 * Math.abs(dy) : dy > 1.5 * Math.abs(dx)) sheetEngage(); else { G = null; return; } }   // 시트는 14px 넘게 · 한쪽으로 분명히 끌 때만 (단추 탭이 끌기로 먹히지 않게)
      else { G = null; return; }
    }
    if (G.kind === "edge") edgeSet(Math.max(0, Math.min(W, toPh(dx))));
    else sheetSet(toPh(G.ax === "x" ? dx : dy));
  }
  function up(e, cancelled) {
    if (!G || e.pointerId !== G.pid) return;
    if (G.kind === "long") { clearTimeout(G.timer); G = null; return; }
    const engaged = !G.cand;
    if (G.kind === "edge") edgeEnd(cancelled); else sheetEnd(cancelled);
    blockOff(); if (engaged) eatNextClick();
  }
  addEventListener("pointerdown", down, true);
  addEventListener("pointermove", move, true);
  addEventListener("pointerup", (e) => up(e, false), true);
  addEventListener("pointercancel", (e) => up(e, true), true);
  // 손짓이 잡힌 동안엔 브라우저 스크롤 · 뒤로가기가 손가락을 가져가지 않게
  // 손짓이 잡힌 동안에만 비수동 touchmove 를 건다 — window 에 늘 걸어 두면 iOS 가 손가락이 움직일 때마다 JS 를 기다려 스크롤 · 애니메이션이 끊긴다
  const blockMove = (e) => { if (G && G.kind !== "long") e.preventDefault(); };
  let blocking = false;
  const blockOn = () => { if (!blocking) { blocking = true; addEventListener("touchmove", blockMove, { passive: false, capture: true }); } };
  const blockOff = () => { if (blocking) { blocking = false; removeEventListener("touchmove", blockMove, { capture: true }); } };
  addEventListener("touchstart", (e) => { if (e.touches.length > 1) blockOn(); }, { passive: true, capture: true });   // 두 손가락(핀치)은 CSS touch-action 이 막고, 혹시 모를 확대는 gesturestart 가 막음
  addEventListener("touchend", () => { if (!G) blockOff(); }, { passive: true, capture: true });
  // 확대 막기: 핀치 · 두 번 탭
  for (const k of ["gesturestart", "gesturechange", "gestureend"]) addEventListener(k, (e) => e.preventDefault(), { passive: false });
  // 두 번 탭 확대는 CSS touch-action: manipulation 이 막는다 — 전에 touchend 로 막던 것은 0.3초 안의 두 번째 탭 클릭을 삼켜 조작이 뻑뻑했음
  addEventListener("contextmenu", (e) => { if (!e.target.closest("input, textarea, [contenteditable='true']")) e.preventDefault(); });

  // ---------- 작은 단추 눌림 범위: 36px 동그라미 단추를 14px 안에서 비껴 눌러도 그 단추로 ----------
  function snapTap(e) {
    if (!ready() || e.target.closest("#phDev, #phFps, input, textarea")) return;
    const x = e.clientX, y = e.clientY, els = document.elementsFromPoint(x, y);
    const under = els.find(k => k.dataset && k.dataset.flow === "1"); if (under) { const r = under.getBoundingClientRect(); if (r.width * r.height < 90 * 90 * PH.s * PH.s) return; }   // 이미 작은 단추 위
    let best = null, bd = 14 * PH.s;
    for (const k of document.querySelectorAll('#screens .scr.on [data-flow="1"]')) {
      const r = k.getBoundingClientRect(); if (r.width < 6 || r.width > 60 * PH.s || r.height > 60 * PH.s) continue;
      if (getComputedStyle(k).visibility === "hidden") continue;
      const dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom), d = Math.hypot(dx, dy);
      if (d > 0 && d < bd) { bd = d; best = k; }
    }
    if (!best) return;
    e.stopPropagation(); e.preventDefault();
    const r = best.getBoundingClientRect(); best.dispatchEvent(new MouseEvent("click", { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, cancelable: true }));
  }
  // 비껴 누름 보정은 뺌 — 단추 근처 빈 곳을 눌러도 메뉴 · 시트가 튀어나왔음

  // ---------- ③-3 키보드: 입력 바(또는 입력칸이 든 시트)를 키보드 위로 ----------
  //   iOS 홈 화면 앱은 키보드가 올라오면 innerHeight 자체가 줄기도 하고(사파리는 visualViewport 만 줆) → 키보드 높이 = 원래 창 높이 - 지금 보이는 영역 아래 끝
  let lifted = null, kbPoll = 0;
  function keyboard() {
    const ae = document.activeElement, typing = typingNow();
    const fig = typing && ae.closest(".fig");
    const vv = window.visualViewport, vh = vv ? vv.height : innerHeight, kb = Math.max(0, (PH.baseVH || innerHeight) - vh);   // 화면 px — 보이는 높이만큼만 (iOS 가 민 거리는 아래 pinTop 이 되돌림)
    pinTop();
    if (typing && fig && kb > 60) {
      const els = [...TAGGED].filter(k => k._phMode === "move" && k.parentElement === fig && k.style.display !== "none" && getComputedStyle(k).display !== "none");
      const mine = els.some(k => k === ae || k.contains(ae));
      if (!mine) { unlift(); return; }
      if (!lifted || lifted.fig !== fig) {
        unlift();
        // 입력 바(그 묶음의 맨 아래 끝)를 키보드 바로 위에 붙인다 — 전엔 디자인의 홈 표시줄 여백째로 올려 키보드와 떨어져 있었음
        const tops = els.map(k => topOf(k)), bots = els.map(k => topOf(k) + k.offsetHeight);
        const top = Math.min(...tops), bot = Math.max(...bots);
        // 받침: 올라간 묶음(추천 칩 · 입력 바) 뒤에 화면 바탕색 판을 깐다 — 그 뒤 제목 · 공이 비쳐 겹치던 것. 키보드가 덮는 아래쪽과 같은 이치(앱처럼 아래가 가려짐)
        const pad = document.createElement("div"); pad.className = "ph-kb-pad";
        const r = fig.getBoundingClientRect();   // 화면 바탕색 = 머리글 아래 왼쪽 끝 한 점 (키보드로 창이 줄어도 늘 보이는 자리)
        const c = colorAt(Math.round(r.left + 3 * PH.s), Math.round(Math.max(0, r.top) + 120 * PH.s));
        const ff = getComputedStyle(fig).filter, unInv = /invert\(1\)/.test(ff) ? (/hue-rotate\(180deg\)/.test(ff) ? "hue-rotate(180deg) invert(1)" : "invert(1)") : "";   // 반전 화면(발산 · invert + hue-rotate) 안에 깔리므로 받침에만 거꾸로 걸어 화면 색 그대로
        pad.style.cssText = `position:absolute;left:0;width:390px;top:${(top - 12).toFixed(1)}px;height:${(PH.h - top + 12 + 400).toFixed(1)}px;background:rgb(${c.join(",")});pointer-events:none;z-index:1;${unInv ? "filter:" + unInv : ""}`;
        fig.appendChild(pad);
        // 받침(z 1)은 그 화면의 다른 조각 위, 올라간 묶음(z 2)은 받침 위 — 문서 순서상 받침보다 뒤에 있던 글(담은 카드 · 아카이브)이 받침 위로 올라와 겹치던 것
        lifted = { fig, gap: PH.h - bot, top, pad, els: [...els, pad].map(k => ({ k, tf: k === pad ? "" : (k.style.transform || ""), tr: k === pad ? "" : k.style.transition, z: k === pad ? null : k.style.zIndex })) };
        lifted.els.forEach(o => { if (o.z !== null) o.k.style.zIndex = "2"; });
      }
      const lift = toPh(kb) - lifted.gap + 8;   // 바 아래 끝과 키보드 사이 8px
      if (lifted.lift !== lift) { lifted.lift = lift; lifted.els.forEach(o => { o.k.style.transition = "transform .22s cubic-bezier(.2,.8,.2,1)"; o.k.style.transform = `translate3d(0,${(-lift).toFixed(1)}px,0) ${o.tf}`; }); mascotFit(lifted, lift); }
    } else unlift();
  }
  // 채팅창이 올라올 때 마스코트(발산에서는 공 무리)도 같은 시간 · 곡선으로 남는 자리(머리글 아래 ~ 올라간 칩 위)에 맞게 줄이며 올린다 — 바텀시트가 올라올 때처럼
  //   main 의 자리 잡기(transform)는 그대로 두고, 그 위에 translate · scale 만 얹는다(무대 transform-origin 0 0 기준으로 계산)
  const EASE_KB = "cubic-bezier(.2,.8,.2,1)", HEAD_B = 100;   // 머리글 아래 끝(디자인 px)
  function mascotFit(l, lift) {
    const st = $("stage"); if (!st || st.classList.contains("hid")) return;
    if (!l.st) { const ph = $("phone").getBoundingClientRect(), r = st.getBoundingClientRect(); l.st = { el: st, tr: st.style.transition, cx: (r.left - ph.left) / PH.s + r.width / PH.s / 2, cy: (r.top - ph.top) / PH.s + r.height / PH.s / 2, w: r.width / PH.s, L: [st.offsetLeft, st.offsetTop] }; }
    const S = l.st, slime = typeof SLIME !== "undefined" && SLIME.active && SLIME.active();
    const vis = S.w * (slime ? 2.05 / 1.45 : 2 / 2.9);   // 보이는 지름: 발산은 공 궤도 끝(공 반지름 1 = 무대 반 폭 1.45 칸, 궤도 끝 2.05 칸) · 홈은 행성
    const room = l.top - 12 - lift - HEAD_B - 16;   // 머리글 아래 ~ 받침 위 (위아래 8px 씩)
    const k = Math.max(.35, Math.min(1, room / vis)), cy2 = Math.min(S.cy, HEAD_B + 8 + room / 2 + 0), cx2 = S.cx;
    const tx = cx2 - S.L[0] - k * (S.cx - S.L[0]), ty = cy2 - S.L[1] - k * (S.cy - S.L[1]);
    S.el.style.transition = `${S.tr ? S.tr + ", " : ""}translate .22s ${EASE_KB}, scale .22s ${EASE_KB}`;
    S.el.style.translate = `${tx.toFixed(1)}px ${ty.toFixed(1)}px`; S.el.style.scale = k.toFixed(4);
  }
  function mascotBack(l) {
    if (!l.st) return; const S = l.st;
    S.el.style.translate = ""; S.el.style.scale = "";
    setTimeout(() => { if (!lifted) S.el.style.transition = S.tr || ""; }, 260);
  }
  function unlift() {
    if (!lifted) return; const l = lifted; lifted = null; mascotBack(l);
    l.els.forEach(o => { o.k.style.transform = o.tf; setTimeout(() => { o.k.style.transition = o.tr || ""; if (o.z !== null) o.k.style.zIndex = o.z || ""; }, 260); });
    setTimeout(() => l.pad.remove(), 240);
  }
  function kbWatch() { clearInterval(kbPoll); let n = 0; kbPoll = setInterval(() => { keyboard(); if (++n > 25) clearInterval(kbPoll); }, 60); }   // 키보드 애니메이션 1.5초 동안 따라감
  if (window.visualViewport) { visualViewport.addEventListener("resize", keyboard); visualViewport.addEventListener("scroll", keyboard); }
  addEventListener("resize", keyboard);
  addEventListener("focusin", kbWatch); addEventListener("focusout", kbWatch);
  // 키보드가 올라오면 iOS 가 입력칸을 보이게 하려고 페이지를 위로 민다. 전엔 맨 위로 되돌려(scrollTo) 화면이 한 번 튀었음 →
  //   되돌리지 않고 민 만큼 앱 화면을 반대로 내려 상단 메뉴가 제자리에 있게 (입력 바는 keyboard 가 키보드 위로)
  function pinTop() { const vv = window.visualViewport, y = vv ? vv.pageTop : (window.scrollY || 0); root.style.setProperty("--ph-ty", Math.max(0, y).toFixed(1) + "px"); }   // 문서 맨 위 ~ 보이는 영역 맨 위 = iOS 가 민 거리 하나 (전엔 scrollY + offsetTop 으로 두 번 더해 화면 전체가 내려갔음)
  addEventListener("scroll", pinTop, { passive: true }); if (window.visualViewport) visualViewport.addEventListener("scroll", pinTop);
  addEventListener("focusout", () => setTimeout(() => { if (!typingNow()) { window.scrollTo(0, 0); pinTop(); } }, 300));   // 키보드가 다 내려간 뒤에만 제자리로

  // ---------- 위아래 띠 색: 앱 맨 위에 실제로 그려지는 색 (iOS 상태 표시줄 띠 · 홈 화면 앱 위아래 여백) ----------
  //   화면 이름으로 짐작하지 않는다(발산 화면은 11판부터 흰 화면, 실행 장면은 검정, 시트 위는 어두운 막). 맨 위 한 점에 겹친 층을 아래부터 합성한다:
  //   바탕색 · 투명도 · 반전 필터(.scr.dark .fig) · 바탕화면(#home) · 커지는 검은 판(#zoom) · 실행 장면 검은 원(#mass, 흰 원 + difference)
  let lastBg = null;
  const rgba = (str) => { const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(str || ""); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
  const phoneEl = () => $("phone");
  function layerInfo(e) {   // e 와 조상(#phone 까지)의 반전 횟수 · 누적 투명도
    let inv = 0, op = 1; for (let n = e; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); if (/invert\(1\)/.test(cs.filter)) inv++; op *= parseFloat(cs.opacity); if (n.id === "phone") break; }
    return { inv, op };
  }
  function colorAt(x, y) {
    const home = $("home"), zoom = $("zoom"), mass = $("mass");
    const shown = (e) => e && e.style.display !== "none" && getComputedStyle(e).display !== "none";
    const covers = (e, round) => { const m = e.getBoundingClientRect(); if (m.width < 4) return false; if (!round) return x > m.left && x < m.right && y > m.top && y < m.bottom;
      const dx = (x - m.left - m.width / 2) / (m.width / 2), dy = (y - m.top - m.height / 2) / (m.height / 2); return dx * dx + dy * dy < 1; };
    if (!root.classList.contains("ph-launched")) return [11, 11, 11];   // 실행 전 · 실행 판이 커지는 동안: 검정 (가짜 바탕화면은 아이폰에서 안 보임)
    let c = [252, 252, 250];   // #phone var(--bg)
    const els = document.elementsFromPoint(x, y);
    for (let i = els.length - 1; i >= 0; i--) {
      const e = els[i]; if (e === root || e === document.body || e.id === "phDev" || e.id === "phFps") continue;
      let bg = rgba(getComputedStyle(e).backgroundColor); if (!bg || bg[3] === 0) continue;
      const { inv, op } = layerInfo(e); if (inv % 2) bg = [255 - bg[0], 255 - bg[1], 255 - bg[2], bg[3]];
      const a = bg[3] * op; c = [c[0] + (bg[0] - c[0]) * a, c[1] + (bg[1] - c[1]) * a, c[2] + (bg[2] - c[2]) * a];
    }
    const id = COMET.cur(); if (shown(mass) && mass.style.width && !(id && (isDark(id) || isOver(id))) && covers(mass, true)) c = [255 - c[0], 255 - c[1], 255 - c[2]];   // 검은 원(흰 원 + difference)이 덮는 동안 (검정 화면 · 시트는 원 위에 있음)
    return c.map(Math.round);
  }
  function paintBg() {
    if (typeof COMET === "undefined" || !phoneEl()) return;
    const c = colorAt(Math.round(innerWidth / 2), 1), hex = "#" + c.map(v => v.toString(16).padStart(2, "0")).join("");
    const g = $("glow"); if (g) g.classList.toggle("ph-off", +getComputedStyle(g).opacity < .01);   // 가장자리 글로우가 투명한 동안은 그 무한 회전 애니메이션(매 프레임 다시 그림)을 끈다
    if (hex === lastBg) return; lastBg = hex;
    root.style.setProperty("--ph-bg", hex);
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", hex);
  }
  PH.colorAt = colorAt;

  // ---------- 발산 화면(D1) 반전을 조각마다 ----------
  //   main 은 화면 덩어리(.fig)에 invert(1) hue-rotate(180deg) 를 건다. 발산 ↔ 홈 전환 동안 조각 수십 개의 투명도가 매 프레임 바뀌면
  //   덩어리 전체(3배 해상도 화면 한 장)를 매 프레임 다시 뒤집어 그려 끊겼다 → 덩어리 필터는 끄고 같은 필터를 조각마다 건다(조각 제 필터가 있으면 그 뒤에 이어 붙임)
  const INV = "invert(1) hue-rotate(180deg)";
  function splitInvert(fig) {
    const one = (k) => { if (k._phInv) return; const own = getComputedStyle(k).filter; k._phInv = true; k.style.setProperty("filter", (own && own !== "none" ? own + " " : "") + INV); };
    fig.classList.add("ph-split"); [...fig.children].forEach(one);
    new MutationObserver((ms) => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1 && n.parentElement === fig) one(n); }))).observe(fig, { childList: true });
  }

  // ---------- 실행 감독(main launch2_director.js) 전역 함수 갈아끼우기: 결과는 같고, 값이 바뀔 때만 쓴다 ----------
  //   bodyTint · setColor 는 매 프레임 마스코트 색 변수(--ink · --eye) · 글로우 네 색 · 눈 그라데이션을 같은 값으로 다시 써서 마스코트 SVG 전체를 매 프레임 다시 계산했다(가만히 있을 때도).
  //   geoTexts 는 발산 제목 세 줄을 top 으로 움직여 매 프레임 배치를 다시 계산했다 → 같은 자리를 translate 변수로(세 줄 모두 translate: var(--tw-translate-x) var(--tw-translate-y)).
  function swapDirector() {
    if (typeof setColor !== "function" || typeof geoTexts !== "function") return;
    const setColor0 = setColor; let colorKey = null;
    const stg = $("stage"); let eyeW = null;   // 감독이 setColor 다음에 --eye 를 덮어쓰는 때(실행 장면)가 있어, 마지막으로 쓴 값과 다르면 다시 쓴다
    window.setColor = (name, k) => { const key = name + "|" + (+k).toFixed(3) + "|" + (typeof colorVar !== "undefined" ? colorVar : "");
      if (key === colorKey && stg.style.getPropertyValue("--eye") === eyeW) return; colorKey = key; setColor0(name, k); eyeW = stg.style.getPropertyValue("--eye"); };
    let geoEls = null, geoKey = null;
    window.geoTexts = (k) => {
      if (!geoEls) { const f = COMET.SCR && COMET.SCR.D1 && COMET.SCR.D1.fig; if (!f) return; geoEls = [...f.querySelectorAll("p")].filter(p => /^(기쁨을 주는|출근길 낯선|10\.27 ·)/.test(p.textContent.trim())); }
      const key = k === null ? "n" : k.toFixed(3); if (key === geoKey) return; geoKey = key;
      for (const p of geoEls) {   // main: top = top0 + (k 없음 ? 0 : DY + (1 − k) × 8), 투명도 k
        if (p.dataset.top0 === undefined) p.dataset.top0 = parseFloat(p.style.top) || p.offsetTop;
        p.style.opacity = k === null ? "" : k.toFixed(3);
        const top = (+p.dataset.top0 + (k === null ? 0 : GEO_TEXT_DY)).toFixed(1) + "px"; if (p.style.top !== top) p.style.top = top;   // 들어올 때 · 나갈 때 한 번만
        if (k === null) p.style.removeProperty("--tw-translate-y"); else p.style.setProperty("--tw-translate-y", ((1 - k) * 8).toFixed(2) + "px");
      }
    };
  }

  // ---------- spring(t, ramp) 같은 값 그대로 표로 ----------
  //   main(comet5_part2.js)의 spring 은 부를 때마다 0초부터 t 까지를 0.001초씩 다시 적분한다(t 2초면 2,000번). 슬라임 공 여섯 개가 한 프레임에 여러 번 불러 프레임당 수만 번.
  //   같은 식 · 같은 순서로 한 번만 계산해 두고 꺼내 쓴다(값 같음). 전역 함수라 바꿔 끼우면 슬라임 · 감독 · 엔진이 다 이걸 씀
  function swapSpring() {
    if (typeof spring !== "function" || typeof sm !== "function") return;
    const T = new Map(), z = .6, w = Math.sqrt(200), dt = .001;
    function table(ramp) {   // A[k] = s_k + dt (계속 돌지 정하는 값), X[k] = k 번 돈 뒤 x — main 과 같은 덧셈 순서
      let tb = T.get(ramp); if (tb) return tb;
      const A = [], X = []; let x = 0, v = 0, s = 0;
      for (;;) { A.push(s + dt); X.push(x); if (s + dt > ramp + 2) break; const tgt = sm((s + dt) / ramp); v += (w * w * (tgt - x) - 2 * z * w * v) * dt; x += v * dt; s += dt; }
      tb = { A: Float64Array.from(A), X: Float64Array.from(X) }; T.set(ramp, tb); return tb;
    }
    window.spring = (t, ramp) => {
      if (t <= 0) return 0; if (t > ramp + 2) return 1;
      const { A, X } = table(ramp); let lo = 0, hi = A.length - 1;   // A[k] > t 인 가장 작은 k → main 루프가 멈추는 자리
      while (lo < hi) { const m = (lo + hi) >> 1; if (A[m] <= t) lo = m + 1; else hi = m; }
      return X[lo];
    };
  }

  // ---------- 시작 ----------
  addEventListener("resize", fit); addEventListener("orientationchange", () => setTimeout(fit, 60));
  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(probe); fit(); tagAll(); touchIcon(); if (fpsOn) fpsShow();
    if (COMET.SCR.D1) splitInvert(COMET.SCR.D1.fig);
    swapDirector(); swapSpring();
    // 입구를 열 때마다 서버에서 새로 받게 (sw.js) — 사이트에 올린 것이 앱을 다시 열면 바로 보임. https 에서만
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => {});
    // 앱처럼 바로 실행: main 의 실행 장면은 바탕화면 아이콘을 눌러야 시작한다 → 아이폰에서는 켜자마자 그 아이콘 누름을 넣는다 (launch_app.js 가 페이지 준비 50ms 뒤부터 받음)
    (function autoLaunch() {
      const icon = $("icon"), home = $("home"), zoom = $("zoom"); if (!icon || !home) return;
      if (home.style.display === "none") { root.classList.add("ph-launched"); return; }   // 실행 판이 다 커져 바탕화면을 치우면 끝
      if (!zoom || zoom.style.opacity !== "1") {   // 아직 안 받아짐(실행 판이 안 커지기 시작함) → 아이콘 누름을 다시 넣음. body 에 넣어 화면 쪽 누름 처리로는 안 감
        const r = icon.getBoundingClientRect(); document.body.dispatchEvent(new MouseEvent("click", { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, cancelable: true }));
      }
      setTimeout(autoLaunch, 40);
    })();
    // 화면이 바뀔 때마다(나중에 붙는 조각까지) 다시 찾는다
    // 화면이 바뀐 뒤 조각 크기 읽기 · 띠 색 재기는 넘김 애니메이션(.32초)이 끝난 뒤에 — 첫 프레임에 하면 화면 전체 배치를 강제로 계산해 넘어오는 순간이 툭 끊겼음
    let afterT = 0;
    new MutationObserver(() => { clearTimeout(afterT); afterT = setTimeout(() => { const id = COMET.cur(); if (id && COMET.SCR[id]) { tagFig(COMET.SCR[id].fig); shiftAll(); } paintBg(); if (PH.bgPoke) PH.bgPoke(); }, 380); }).observe(document.body, { attributes: true, attributeFilter: ["data-screen"] });
    paintBg();
    // 띠 색은 화면이 바뀔 때(위 MutationObserver)와 실행 장면 · 발산 · 수렴처럼 화면 이름 없이 바뀌는 동안만 다시 잰다 — 0.15초마다 늘 재던 것은 매번 레이아웃을 강제로 계산해 아이폰에서 끊김
    let bgUntil = performance.now() + 4000; PH.bgPoke = (ms = 800) => { bgUntil = Math.max(bgUntil, performance.now() + ms); };   // 화면이 바뀐 뒤 시트 막 · 전환 애니메이션이 끝날 때까지(0.8초) 따라감
    (function bgLoop() { const home = $("home"), moving = (home && home.style.display !== "none") || (typeof COMET !== "undefined" && typeof T0 !== "undefined" && T0 !== null && typeof L !== "undefined" && COMET.tl() < L.ui[L.ui.length - 1] + L.uiLen + .5);   // 실행 장면(검은 화면 → 홈 글)만. 발산 · 수렴 중엔 맨 위 색이 안 바뀌므로(홈 · 발산 둘 다 밝은 바탕) 재지 않는다 — 재면 매번 레이아웃을 강제로 계산해 발산이 끊김
      if (moving) bgUntil = performance.now() + 1500;   // 전환이 끝난 뒤에도 1.5초는 더 (마지막 상태를 놓치지 않게)
      const busy = performance.now() < bgUntil; if (busy) paintBg(); setTimeout(bgLoop, busy ? 120 : 400); })();   // 실행 장면 · 발산 연출처럼 화면 이름 없이 바뀌는 것도 따라감
  });
  fit();
})();
