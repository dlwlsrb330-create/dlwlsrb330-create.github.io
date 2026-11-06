// router.js — 화면 전환 + 마스코트 자리·상태 + 뒤로가기·재시작. 화면 내용은 피그마에서 받은 조각(<template id="tpl-ID">), 연결은 flow.js, 마스코트는 mascot.js.
// 엔진(comet5_part2)·런처(launch2_director) 뒤에 읽는다. 전역 손잡이: COMET.show / back / plan / react / expr / lookAt / wait / find
const COMET = (() => {
  const T = { push: 320, sheet: 280, fade: 220, stage: 550, slot: 320 };   // 13판 slot: 화면 전환 때 마스코트 자리 옮김은 화면과 같은 .32초 (550 이라 화면이 다 바뀐 뒤에도 크게 남았다 줄어들었음). stage 는 연출용 그대로           // 전환 시간(ms)
  const STAGE0 = { x: 85, y: 92, s: 1 };                                 // launch2 마스코트 자리(220px)
  const screensEl = $("screens"), stage = $("stage"), massEl = $("mass");
  const SCR = {}, ORDER = Object.keys(SCREENS.labels);
  let stack = [], timers = [], gazeHold = null, revealTarget = null, revealBoth = false;
  const now = () => performance.now() / 1000;
  const tl = () => now() - (T0 ?? now());
  const isDark = (id) => SCREENS.dark.includes(id), isOverlay = (id) => SCREENS.overlay.includes(id);
  const cur = () => stack.length ? stack[stack.length - 1].id : null;
  const base = () => { for (let i = stack.length - 1; i >= 0; i--) if (!isOverlay(stack[i].id)) return stack[i].id; return null; };
  // ---------- 요소 찾기: 피그마 레이어 이름(data-name 앞부분) 또는 글자 ----------
  function find(scr, spec) {
    const root = typeof scr === "string" ? SCR[scr].el : scr;
    if (spec === "*") return [root];
    if (spec.startsWith("#")) return [...root.querySelectorAll(`[data-node-id="${spec.slice(1)}"]`)];   // 같은 이름 레이어가 여럿일 때 피그마 노드 ID 로 하나만
    if (spec.startsWith("text:")) { const q = spec.slice(5); return [...root.querySelectorAll("p, span, div")].filter(e => (e.childElementCount === 0 || e.tagName === "P" && [...e.children].every(c => c.tagName === "SPAN")) && e.textContent.trim().startsWith(q)); }   // 5판: 일부만 굵게 한 글자(<p> 안 <span>)도 찾음
    if (spec.startsWith("text=")) { const q = spec.slice(5); return [...root.querySelectorAll("p, span, div")].filter(e => e.childElementCount === 0 && e.textContent.trim() === q); }
    return [...root.querySelectorAll("[data-name]")].filter(e => e.dataset.name.startsWith(spec));
  }
  // 5판: 칩·버튼(둥근 상자, 높이 22~60) 안의 한 줄 글자를 상자 높이의 정가운데로 — 피그마 원본도 글자가 위로 붙어 있던 것을 바로잡음
  // (읽기를 모두 먼저 하고 쓰기는 나중에 한꺼번에 — 섞으면 쓸 때마다 문서 전체를 다시 배치해 첫 로드가 9초 걸렸다)
  const LABEL_FIX = [];
  function centerLabels(fig) {
    // 11-03: 둥근 칩만이 아니라 바탕색·테두리가 있는 상자(입력칸·검색칸·드롭다운 등) 전부. 단 상자 안 글자가 두 줄 이상 쌓인 것(제목+설명)은 그대로
    const kids = [...fig.querySelectorAll("div[data-name]")].filter(b => { const h = b.offsetHeight, rr = parseFloat(b.style.borderRadius || b.style.borderTopLeftRadius) || 0; return h >= 22 && h <= 60 && (rr >= h / 2 - 1 || /^(칩|btn|상태 칩|추천 질문 칩|입력|버튼|탭|타일)/.test(b.dataset.name) || b.style.backgroundColor || b.style.borderStyle) && b.offsetWidth > h * .9; });
    for (const b of kids) {
      const L = b.offsetLeft, T = b.offsetTop, W = b.offsetWidth, H = b.offsetHeight, hit = [];
      for (const p of b.parentElement.querySelectorAll(":scope > p, :scope > div > p")) {
        if (p.offsetParent !== b.offsetParent) continue;
        const pt = p.offsetTop, ph = p.offsetHeight, pl = p.offsetLeft, fs = parseFloat(p.style.fontSize) || 14;
        if (pl < L - 2 || pl > L + W || pt < T - 2 || pt + ph > T + H + 2 || ph > fs * 1.9) continue;   // 상자 안의 한 줄 글자만
        hit.push(p);
      }
      const tops = hit.map(p => p.offsetTop); if (hit.length > 1 && Math.max(...tops) - Math.min(...tops) > 6) continue;   // 위아래로 쌓인 글자
      hit.forEach(p => LABEL_FIX.push([p, T, H]));
    }
  }
  // 11-03: 묶음 세로 가운데 — ① 구분선으로 나뉜 목록 줄(선 간격 = 한 줄 높이) ② 높이 36~72 상자(바탕·테두리) 안에 든 아이콘·글자들을
  // 한 묶음으로 보고, 묶음의 위아래 끝 가운데를 칸 가운데에 맞춘다(묶음 안 배치는 그대로). 크게 벗어난 것(14px 넘게)은 의도한 배치로 보고 둔다.
  const GROUP_FIX = [], ALIGN_SKIP = [];   // ALIGN_SKIP: 14px 넘게 어긋나 손대지 않은 열 (검수용, COMET.alignSkip)
  function centerGroups(fig) {
    const kids = [...fig.children].filter(k => k.style.display !== "none" && !/translate-y/.test(k.getAttribute("style") || "")), R = (k) => ({ t: k.offsetTop, b: k.offsetTop + k.offsetHeight, l: k.offsetLeft, r: k.offsetLeft + k.offsetWidth });
    const isLine = (k) => k.offsetHeight <= 2 && k.offsetWidth >= 120, used = new Set();
    // 칸 안을 가로로 겹치는 것끼리 세로 열(아바타 / 제목+설명 / 오른쪽 라벨·토글·화살표)로 나눠, 열마다 따로 가운데 (가로 위치는 translate 까지 반영된 화면 좌표로)
    const fix = (members, t, b, where, cap = 14) => {
      members = members.filter(k => !used.has(k)); if (!members.length) return;
      const X = new Map(members.map(k => { const r = k.getBoundingClientRect(); return [k, [r.left, r.right]]; })), cols = [];
      for (const k of members.sort((a, c) => X.get(a)[0] - X.get(c)[0])) { const [l, r] = X.get(k), c = cols.find(c => l < c.r - 1 && r > c.l + 1); if (c) { c.ks.push(k); c.l = Math.min(c.l, l); c.r = Math.max(c.r, r); } else cols.push({ l, r, ks: [k] }); }
      for (const c of cols) { const top = Math.min(...c.ks.map(k => k.offsetTop)), bot = Math.max(...c.ks.map(k => R(k).b)), dy = Math.round((t + b) / 2 - (top + bot) / 2);
        if (Math.abs(dy) > cap) { ALIGN_SKIP.push([fig.dataset.screen || fig.dataset.name, where, c.ks.map(k => k.dataset.name || k.textContent.trim().slice(0, 10)).join("+"), dy]); continue; }
        if (Math.abs(dy) < 1) continue; c.ks.forEach(k => { used.add(k); GROUP_FIX.push([k, dy]); }); }
    };
    // ① 목록 줄: 같은 자리·같은 폭의 선이 일정한 간격으로 2개 이상
    const lines = kids.filter(isLine), runs = {};
    for (const l of lines) (runs[l.offsetLeft + "/" + l.offsetWidth] = runs[l.offsetLeft + "/" + l.offsetWidth] || []).push(l);
    for (const run of Object.values(runs)) {
      if (run.length < 2) continue; run.sort((a, b) => a.offsetTop - b.offsetTop);
      const gaps = run.slice(1).map((l, i) => l.offsetTop - run[i].offsetTop), pitch = gaps[0]; if (pitch < 40 || pitch > 120 || gaps.some(g => Math.abs(g - pitch) > 2)) continue;
      for (const l of run) { const t = l.offsetTop - pitch, b = l.offsetTop; fix(kids.filter(k => !isLine(k) && k.offsetHeight < pitch && R(k).t >= t + 1 && R(k).b <= b + 1), t, b, "줄 " + t); }
    }
    // ② 상자: 안에 든 형제 요소들
    for (const box of kids.filter(k => k.dataset.name && k.offsetHeight >= 36 && k.offsetHeight <= 72 && k.offsetWidth >= 120 && (k.style.backgroundColor || k.style.borderStyle))) {
      const B = R(box); fix(kids.filter(k => k !== box && !isLine(k) && k.offsetHeight < B.b - B.t && R(k).t >= B.t - 1 && R(k).b <= B.b + 1 && R(k).l >= B.l - 1 && R(k).l < B.r), B.t, B.b, box.dataset.name);
    }
    // ③ 구분선·상자 없이 아이콘·아바타로 시작하는 줄: 그 아이콘의 세로 가운데에 오른쪽의 글 묶음·버튼·라벨을 맞춘다 (8px 넘게 어긋난 건 의도한 배치로 보고 둠)
    const anchors = kids.filter(k => k.tagName !== "P" && !used.has(k) && k.offsetWidth >= 24 && k.offsetWidth <= 56 && Math.abs(k.offsetWidth - k.offsetHeight) <= 4 && (k.style.backgroundColor || k.style.borderStyle || /아바타|아이콘|icon|logo|avatar/i.test(k.dataset.name || "")));
    for (const a of anchors) {
      if (used.has(a)) continue; const A = R(a), cy = (A.t + A.b) / 2, reach = (A.b - A.t) / 2 + 10;
      const row = kids.filter(k => k !== a && !used.has(k) && !isLine(k) && k.offsetHeight < 64 && k.offsetLeft >= A.r - 2 && Math.abs((R(k).t + R(k).b) / 2 - cy) <= reach && !anchors.some(o => o !== a && o.offsetLeft <= k.offsetLeft && Math.abs((R(o).t + R(o).b) / 2 - cy) > 4 && Math.abs((R(o).t + R(o).b) / 2 - (R(k).t + R(k).b) / 2) < Math.abs(cy - (R(k).t + R(k).b) / 2)));
      if (row.length) { used.add(a); fix(row, A.t, A.b, "아이콘 줄 " + (a.dataset.name || ""), 8); }
    }
  }
  function applyGroups() { for (const [k, dy] of GROUP_FIX.splice(0)) { const t = parseFloat(k.style.top); if (!isNaN(t)) k.style.top = (t + dy) + "px"; } }
  function applyLabels() { for (const [p, T, H] of LABEL_FIX.splice(0)) { p.style.top = T + "px"; p.style.height = H + "px"; p.style.lineHeight = H + "px"; p.style.whiteSpace = "nowrap"; p.querySelectorAll("span").forEach(s => s.style.lineHeight = "inherit"); } }
  // ---------- 화면 만들기 ----------
  function build() {
    for (const id of ORDER) {
      const tpl = document.getElementById("tpl-" + id); if (!tpl) continue;
      const el = document.createElement("div"); el.className = "scr" + (isDark(id) ? " dark" : "") + (isOverlay(id) ? " overlay" : ""); el.id = "scr-" + id;
      el.appendChild(tpl.content.cloneNode(true)); screensEl.appendChild(el); if (id !== SCREENS.start) el.querySelectorAll("img[src]").forEach(i => { i.dataset.src = i.getAttribute("src"); i.removeAttribute("src"); });   // 5판: 그림은 그 화면이 처음 보일 때 받는다 (80장 그림 492개를 한꺼번에 받아 첫 로드 9.6초 → 홈만)
      const fig = el.querySelector(".fig");
      if (isOverlay(id)) { const kids = [...fig.children]; let i = kids.findIndex(k => k.dataset.name === "dim"); if (i < 0) i = kids.findIndex(k => (k.dataset.name || "").startsWith("popover")); kids.slice(0, i < 0 ? kids.length : i).forEach(k => k.style.display = "none"); fig.style.background = "transparent"; for (let j = (i < 0 ? 0 : i + 1); j < kids.length; j++) kids[j].classList.add("sheetpart"); }
      if (isDark(id)) fig.style.background = "transparent";              // 검정은 런처의 검은 원(#mass)이 준다 → 마스코트 몸이 저절로 흰색
      const m = MASCOT[id] || {}; (m.hide || []).forEach(h => find(el, h).forEach(e => e.style.visibility = "hidden"));
      centerLabels(fig);
      SCR[id] = { el, fig };
    }
    applyLabels();
    for (const id of ORDER) if (SCR[id]) centerGroups(SCR[id].fig); applyGroups();   // 읽기를 모두 먼저, 쓰기는 한꺼번에 (첫 로드가 느려지지 않게)
    for (const [id, spec, to, how] of FLOW) { if (!SCR[id]) continue; if (how.startsWith("auto:")) continue; for (const e of find(id, spec)) { e.dataset.flow = "1"; e.style.cursor = "pointer"; FLOWS.push({ id, spec, to, how, el: e }); } }
    wireTaps();
    const jump = $("jump"); for (const id of ORDER) { if (!SCR[id]) continue; const b = document.createElement("button"); b.textContent = SCREENS.labels[id]; b.dataset.id = id; b.onclick = () => { if (id === "D1" && !isDarkOn()) { show("H1", "jump"); tapDiverge(); } else if (id === "R2-6c") { show("H1", "jump"); ACTIONS.startRecording({ to: id }); } else show(id, "jump"); }; jump.appendChild(b); }   // 5판: D1 은 실제로 발산시켜서(검은 원이 덮은 상태로), R2-6c 는 실제로 녹음을 시작해서(알약이 살아 있게) 간다
    $("btnBack").onclick = back; $("btnPhoneBack").onclick = back; addEventListener("keydown", (e) => { if (e.key === "Escape") back(); }); $("btnRestart").onclick = () => location.reload();   // 5판: 폰 밖 뒤로 버튼 · Esc
    // (마스코트 탭은 wireTaps 가 맡는다: 홈 → 발산, 발산 → 다시 홈, 그 밖의 화면 → 그 화면의 반응)
    requestAnimationFrame(function loop() { pumpQueue(); syncDiverge(); reveal(); watchBulb(); requestAnimationFrame(loop); });
  }
  // ---------- 탭: 누른 좌표 → 연결 요소 (4판) ----------
  const FLOWS = [];
  function pickFlow(x, y) {   // 맨 위에 쌓인 화면의 것 먼저, 같은 화면이면 더 작은(더 구체적인) 요소
    const ids = stack.map(s => s.id); let best = null;
    for (const f of FLOWS) {
      const si = ids.lastIndexOf(f.id); if (si < 0 || !SCR[f.id].el.classList.contains("on")) continue;
      const r = f.el.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      if (getComputedStyle(f.el).visibility === "hidden" || shownOpacity(f.el) < .05) continue;   // 숨겨 둔(투명한) 답 줄 등은 못 누름
      const area = f.spec === "*" ? 1e12 : r.width * r.height;
      if (!best || si > best.si || (si === best.si && area < best.area)) best = { ...f, si, area };
    }
    return best;
  }
  function shownOpacity(e) { let o = 1; for (let n = e; n && !n.classList.contains("scr"); n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o; }
  function mascotHit(x, y) {   // 마스코트(보이는 원) 안을 눌렀나
    if (stage.classList.contains("hid")) return false;
    const r = stage.getBoundingClientRect(); if (r.width < 24) return false;
    return Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) < r.width * .38;
  }
  function tapMascot() {
    const id = cur(), m = MASCOT[id] || {};
    if (id === "H1" || id === "OB-4") { if (!isDarkOn()) ACTIONS.diverge(); return; }
    if (id === "D1") { if (isDarkOn()) ACTIONS.converge(); return; }       // 3. 발산에서 마스코트를 다시 누르면 홈으로
    __m.tapColor(now()); if (m.tap) { expr(null); react(m.tap); if (m.expr) after(1700, () => expr(m.expr)); } else react("happy");
  }
  function wireTaps() {
    const phone = $("phone"); let pressed = null;
    const release = () => { if (pressed) { const p = pressed; pressed = null; setTimeout(() => p.classList.remove("press"), 90); } };
    phone.addEventListener("pointerdown", (ev) => { if (!T0 || ev.target.closest("#recpill, #ctl, #jump, #home, .beodial")) return; const f = !mascotHit(ev.clientX, ev.clientY) && pickFlow(ev.clientX, ev.clientY); if (f && f.spec !== "*") { pressed = f.el; pressed.classList.add("press"); } }, true);   // 10. 누르는 순간 바로 눌림 표시
    phone.addEventListener("pointerup", release, true); phone.addEventListener("pointercancel", release, true);
    phone.addEventListener("click", (ev) => {
      if (T0 === null || ev.target.closest("#recpill, #home, .beodial")) return;   // 11판: 바탕화면이 떠 있는 동안엔 아이콘 탭을 가로채지 않는다
      if (mascotHit(ev.clientX, ev.clientY) && (cur() === "H1" || cur() === "D1" || cur() === "OB-4" || !pickFlow(ev.clientX, ev.clientY) || pickFlow(ev.clientX, ev.clientY).spec === "*")) { ev.stopPropagation(); ev.preventDefault(); tapMascot(); return; }
      const f = pickFlow(ev.clientX, ev.clientY); if (!f) return;
      ev.stopPropagation(); ev.preventDefault(); act(f.id, f.to, f.how, f.el);
    }, true);
  }
  // ---------- 전환 ----------
  function act(id, to, how, el) {
    if (how === "back") return back();
    if (how.startsWith("fn:")) { const r = ACTIONS[how.slice(3)]; return r ? r({ from: id, to, el }) : console.warn("동작 없음", how); }
    if (how === "ask") return ACTIONS.ask({ from: id, to, el });
    show(to, how);
  }
  // 화면 기록(stack): push = 위에 쌓고 아래는 숨김, sheet = 위에 얹고 아래는 보임, replace = 맨 위를 바꿈, back = 맨 위를 뺌. 보이는 것 = 맨 위 비(非)시트 화면부터 그 위의 시트들.
  function render() { if (typeof RECPILL !== "undefined") RECPILL.visible(cur() === "R2-6c");   // 5판: 녹음 알약은 녹음 중 홈에서만
    render0(); }
  function wake(id) { const s = SCR[id]; if (s && !s.woke) { s.woke = true; s.el.querySelectorAll("img[data-src]").forEach(i => { i.src = i.dataset.src; i.removeAttribute("data-src"); }); } }
  // 실행 장면이 끝나면 남은 화면 그림을 조금씩 미리 받아 둔다 (화면을 넘길 때 그림이 늦게 뜨지 않게)
  function prefetch() { const ids = ORDER.filter(id => SCR[id] && !SCR[id].woke); let i = 0; const idle = window.requestIdleCallback || ((f) => setTimeout(f, 120)); (function step() { if (i < ids.length) wake(ids[i++]); if (i < ids.length) idle(step, { timeout: 1000 }); })(); }   // 11-04 렉: 한 화면씩, 브라우저가 쉴 때만
  function render0() { ORDER.forEach(id => SCR[id] && SCR[id].el.classList.remove("on")); let k = stack.length - 1; while (k > 0 && isOverlay(stack[k].id)) k--; for (let i = Math.max(0, k); i < stack.length; i++) { wake(stack[i].id); SCR[stack[i].id].el.classList.add("on"); } }
  function show(id, how = "push", opt = {}) {
    if (!SCR[id]) return;
    SCR[id].fig.querySelectorAll("[data-hid]").forEach(k => { k.style.opacity = ""; delete k.dataset.hid; });   // 5판: 전에 숨긴 채 떠났던 내용 되돌림 (뒤이은 typeAnswer·search 가 필요하면 다시 숨김)
    if (how === "jump") { stack = []; clearTimers(); expr(null); lookAt(null); if (isOverlay(id) || isDark(id) && id !== "D1") { const b = isDark(id) ? "D1" : baseFor(id); if (b !== id) { stack.push({ id: b, how: "push" }); placeMascot(b); } } how = isOverlay(id) ? "sheet" : "push"; }
    const prev = cur(); navDir = 390;
    let popped = null; if (how === "replace" && stack.length) popped = stack.pop().id;
    clearTimers(); expr(null); lookAt(null); $("hint").classList.remove("on");   // 화면이 바뀌면 말풍선은 끈다
    stack.push({ id, how }); if (stack.length > 30) stack.shift();
    const wasOn = [...document.querySelectorAll("#screens .scr.on")];   // 13판: 넘기기 전에 보이던 화면 전부 (시트 + 그 아래 화면)
    const el = SCR[id].el; el.classList.remove("in-push", "in-sheet", "in-back", "out-sheet", "out-push", "keep-dim"); void el.offsetWidth; render();
    // 11-05 주형: 시트를 시트로 바꿀 때(replace, 예: 사이드바 → 프로젝트 관리) — 전엔 새 시트가 어두운 막까지 통째로 오른쪽에서 밀려 들어오고(in-push) 앞 시트는 툭 사라졌다.
    //   → 새 시트는 시트처럼 아래서 올라오고(in-sheet), 앞 시트는 자기 닫힘 애니메이션으로 빠지고(leave), 어두운 막은 이미 깔려 있으니 다시 페이드하지 않고 그대로(keep-dim / 앞 시트 막은 no-dim)
    const toSheet = isOverlay(id), fromSheet = popped && isOverlay(popped);
    if (!opt.still) el.classList.add(how === "sheet" || (how === "replace" && toSheet) ? "in-sheet" : "in-push");   /* 13판 opt.still: 배치가 같은 화면(홈 → 녹음 중 홈)은 넘기지 않고 제자리에서 바꿔 끼움 */
    if (how === "replace" && fromSheet && popped !== id) {
      const po = SCR[popped].el;
      // keep-dim 은 그 시트가 닫히거나(leave) 다시 뜰 때(show) 뗀다 — 타이머로 떼면 막의 페이드 애니메이션이 처음부터 다시 돌아 막이 한 번 꺼졌다 켜졌다
      if (toSheet) { el.classList.add("keep-dim"); po.classList.add("no-dim"); clearTimeout(po._ndT); po._ndT = setTimeout(() => po.classList.remove("no-dim"), 360); }
      leave(popped, id);
    }
    // 13판: 앞으로 넘길 때 이전 화면이 한 프레임에 사라져(새 화면은 .32초 페이드) 빈 바탕에 마스코트만 남아 보이던 것(실루엣) → 이전 화면도 새 화면 아래서 같이 빠지게 (comet.css .out-fwd)
    if (how === "push" && !isDark(id) && !opt.still) wasOn.forEach(o => { if (o === SCR[id].el || o.classList.contains("dark")) return; o.classList.remove("out-fwd", "in-push", "in-back", "in-sheet"); void o.offsetWidth; o.classList.add("out-fwd"); clearTimeout(o._fwdT); o._fwdT = setTimeout(() => o.classList.remove("out-fwd"), 340); });   /* 이전에 보이던 화면 전부(시트에서 넘길 때 시트와 그 아래 화면까지) 같이 빠짐. 남은 in-push 를 안 떼면 out-fwd 를 뗄 때 나타나기 애니메이션이 다시 돌아 옛 화면이 0.3초 다시 보였음 */
    document.body.dataset.screen = id;
    massFor(id, prev);
    placeMascot(id, prev === null ? { ...opt, instant: true } : opt);
    [...$("jump").children].forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
    $("btnBack").disabled = stack.length <= 1 && !isDarkOn();
    const m = MASCOT[id] || {}; if (m.enter) after(450, () => react(m.enter)); if (m.expr) after(m.exprAfter || 600, () => expr(m.expr));
    if (m.typing) ACTIONS.typeAnswer({ id, q: opt.q });
    if (opt.onShow) opt.onShow();
    for (const [f, spec, to, h] of FLOW) if (f === id && h.startsWith("auto:")) after(parseInt(h.slice(5)), () => show(to, "replace"));
  }
  // 5판: 채팅에서 주제문을 누르면 홈으로 — 쌓인 화면을 한 번에 걷고 홈이 왼쪽에서 돌아온다 (마스코트는 아바타 자리에서 로고 자리로)
  function home() { const prev = cur(); if (prev === "H1") return; navDir = -117; clearTimers(); expr(null); lookAt(null); stack = [{ id: "H1", how: "push" }]; render(); leave(prev, "H1"); document.body.dataset.screen = "H1"; massFor("H1", prev); placeMascot("H1"); [...$("jump").children].forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === "H1"))); $("btnBack").disabled = true; }
  // 5판: 닫을 때도 툭 사라지지 않게 — 스택은 바로 바꾸고(순서 꼬임 없음), 나가는 화면만 잠깐 남겨 열 때의 반대 방향으로 빠지게 한다
  function leave(out, to) {
    const o = SCR[out] && SCR[out].el, t = SCR[to] && SCR[to].el; if (!o) return;
    o.classList.remove("in-push", "in-sheet", "in-back", "out-sheet", "out-push", "keep-dim"); void o.offsetWidth; o.classList.add(isOverlay(out) ? "out-sheet" : "out-push");   /* 11-05: keep-dim 도 떼야 닫힐 때 막이 페이드아웃 */
    clearTimeout(o._leaveT); o._leaveT = setTimeout(() => o.classList.remove("out-sheet", "out-push"), 340);   /* 13판: 240 → 340 (out-push .32s) */
    if (!isOverlay(out) && t) { t.classList.remove("in-push", "in-sheet", "in-back"); void t.offsetWidth; t.classList.add("in-back"); }
  }
  const PARENT = { "T1": "H1", "T4": "H1", "T2": "T1", "T9": "T1", "T3": "T1", "T2-1": "T1", "T7": "T1", "T8": "T1", "T2-E": "T2", "T9-E": "T9", "T3-E": "T3", "T2-1-E": "T2-1", "M2": "H1", "M3-C": "H1", "M3-D": "M3-C", "M4-A": "H1", "M5": "H1", "S0": "H1", "S1": "S0", "S2": "S0", "OB-2": "OB-1", "OB-3": "OB-2", "OB-3-1": "OB-3", "H2": "H1", "H6": "H1", "H7": "H1", "H8": "H1", "H11": "H1", "M3-N": "M3-C", "M3-G": "M3-C", "M3-K": "M3-C", "M3-L": "M3-C", "M3-MD": "M3-C", "M3-SL": "M3-C", "M4-GPT": "M4-A", "M4-CL": "M4-A", "M4-GE": "M4-A", "M4-PX": "M4-A", "M4-CP": "M4-A",
    "H5-2": "H1", "C-B-figma": "OB-3-1", "C-B-gcal": "M3-L", "C-B-slack": "M3-SL", "C-B-gemini": "M4-GE", "C-B-px": "M4-PX", "C-B-copilot": "M4-CP" };   // 5판: 외부 로그인 화면을 바로 열었을 때도 닫기·취소는 그 서비스 상세로
  function back() {
    navDir = -117;
    if (stack.length > 1) { const top = stack.pop(); clearTimers(); expr(null); lookAt(null); const id = cur(); render(); leave(top.id, id); document.body.dataset.screen = id; massFor(id, top.id); placeMascot(id); [...$("jump").children].forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === id))); }
    else if (isDarkOn()) ACTIONS.converge({});
    else if (PARENT[cur()]) { const up = PARENT[cur()]; stack = [{ id: up, how: "push" }]; const out = SCR[up] && up; if (out) { SCR[up].fig.querySelectorAll("[data-hid]").forEach(k => { k.style.opacity = ""; delete k.dataset.hid; }); } const was = Object.keys(SCR).find(k => SCR[k].el.classList.contains("on") && k !== up); render(); leave(was, up); document.body.dataset.screen = up; massFor(up, was); placeMascot(up); }   // 5판: 이전 기록이 없어도 뒤로는 상위 화면으로
    $("btnBack").disabled = stack.length <= 1 && !isDarkOn();
  }
  // 5판: 연결 시트는 그 서비스 상세 위에 뜬다 (화면 목록으로 바로 열 때도)
  const SHEET_BASE = { "C-L-figma": "OB-3-1", "C-L-gcal": "M3-L", "C-L-slack": "M3-SL", "C-L-gemini": "M4-GE", "C-L-px": "M4-PX", "C-L-copilot": "M4-CP", "C-I-figma": "M3-D", "C-I-notion": "M3-N", "C-I-gdrive": "M3-G", "C-I-kakao": "M3-K", "C-I-gcal": "M3-L", "C-I-md": "M3-MD", "C-I-slack": "M3-SL", "C-I-ai": "M4-GPT" };
  const baseFor = (id) => SHEET_BASE[id] || (id.startsWith("D") ? "D1" : id.startsWith("M2") ? "M2" : id.startsWith("M5") ? "M5" : id.startsWith("T") ? "T1" : "H1");   // 5판 화면 구조
  // ---------- 검은 원(런처의 발산 구간)은 검정 화면에서만 ----------
  const isDarkOn = () => T0 !== null && !!(dmode(tl()) && dmode(tl()).uo < 0);
  function massFor(id, prev) {
    const dark = isDark(id) || (isOverlay(id) && isDark(base()));
    if (dark && !isDarkOn() && id !== "D1") tapDiverge();
    if (!dark && isDarkOn() && !(id === "H1" && prev === "D1")) { __m.reset(); plan("idle"); }
  }
  function tapDiverge() { if (T0 === null) return; __m.tap(tl()); __m.tapColor(now()); }
  function syncDiverge() { const id = cur(); if (id !== "H1" && id !== "D1") return; const want = isDarkOn() ? "D1" : "H1"; if (want !== id) { stack = [{ id: want, how: "push" }]; render(); document.body.dataset.screen = want; placeMascot(want); $("btnBack").disabled = !isDarkOn(); } }
  // 홈·발산 글은 검은 원 앞머리가 지나는 자리부터 바뀐다 (런처와 같은 규칙, 반지름은 #mass 크기에서 읽는다)
  const MC = { x: MCX, y: MCY };   // 5판: 런처와 같은 중심 (V4 로고 자리)
  function reveal() {
    const ts = tl(), launchEnd = L.ui[L.ui.length - 1] + L.uiLen;
    if (T0 !== null && ts < launchEnd + .05 && cur() === "H1" && !dmode(ts)) { launchReveal(ts); return; }
    if (SCR.H1 && SCR.H1.rank && !SCR.H1.revealed) { SCR.H1.revealed = true; [...SCR.H1.fig.children].forEach(k => nudgeY(k, 0)); }   // 5판: 연출 도중 다른 화면으로 가도 홈 글이 14px 내려간 채 멈추지 않게
    const on = massEl.style.display !== "none" && massEl.style.width; const r = on ? parseFloat(massEl.style.width) / 2 : 0;
    { const md = T0 !== null && dmode(ts), both = md && (cur() === "H1" || cur() === "D1");   // 11판: 발산·수렴 도중엔 홈과 발산 화면을 둘 다 켜 두고 글자 세기로만 바꾼다
      if (both) { SCR.H1.el.classList.add("on"); SCR.D1.el.classList.add("on"); revealBoth = true; }
      else if (revealBoth) { revealBoth = false; render0(); } }
    for (const id of ["H1", "D1"]) { const s = SCR[id]; if (!s || !s.el.classList.contains("on")) continue;
      if (!s.dist) s.dist = [...s.fig.children].map(k => { const b = k.getBoundingClientRect(), p = $("phone").getBoundingClientRect(); return Math.hypot(b.left - p.left + b.width / 2 - MC.x, b.top - p.top + b.height / 2 - MC.y); });
      const q = id === "H1" ? (window.__divK || 0) : (window.__divText ?? 0), o = (id === "H1" ? 1 - q : q).toFixed(3); if (s.lastO === o) continue; s.lastO = o;   // 11-04 렉: 값이 그대로면 매 프레임 다시 쓰지 않는다
      [...s.fig.children].forEach((k) => { if (k.dataset.flowKeep) return; k.style.opacity = o; }); }   // 11판: 검은 원 대신 런처의 시간값으로 섞는다
  }
  // ---------- 9. 전구 '삥' ----------
  let wasBulb = false;
  function watchBulb() { const st = __m.state(), on = st.cur === "bulb" && !st.next; if (on && !wasBulb) ping(); wasBulb = on; }
  function ping() {
    const r = stage.getBoundingClientRect(), ph = $("phone").getBoundingClientRect(); if (r.width < 24) return;
    const b = document.createElement("div"); b.className = "ping"; b.innerHTML = '<i></i><i></i><i></i><b>!</b>';
    const s = Math.max(.55, Math.min(1.2, r.width / 160));
    b.style.left = (r.left - ph.left + r.width * .80).toFixed(0) + "px"; b.style.top = (r.top - ph.top + r.height * .10).toFixed(0) + "px"; b.style.setProperty("--s", s.toFixed(2));
    $("phone").appendChild(b); setTimeout(() => b.remove(), 1300);
    const g = $("gl"); if (g && g.animate) g.animate([{ transform: "scale(1)" }, { transform: "scale(1.14)", offset: .35 }, { transform: "scale(.97)", offset: .7 }, { transform: "scale(1)" }], { duration: 520, easing: "cubic-bezier(.3,1.5,.5,1)" });
    if (__m.flashColor) __m.flashColor("happy", now());
  }
  // 실행 장면: 홈 글은 줄무늬가 다 열린 뒤(L.ui) 위쪽 줄부터 차례로 14px 올라오며 나타난다 (런처 자체 홈 글과 같은 시각표)
  function launchReveal(ts) {
    const s = SCR.H1; if (!s) return;
    if (!s.rank) { const tops = [...s.fig.children].map(k => parseFloat(k.style.top) || 0), uniq = [...new Set(tops.map(t => Math.round(t / 40)))].sort((a, b) => a - b); s.rank = tops.map(t => Math.min(L.ui.length - 1, Math.round(uniq.indexOf(Math.round(t / 40)) * (L.ui.length - 1) / Math.max(1, uniq.length - 1)))); }
    [...s.fig.children].forEach((k, i) => { if (k.dataset.flowKeep) return; const q = EASE_OUT_QUINT((ts - L.ui[s.rank[i]]) / L.uiLen); k.style.opacity = q.toFixed(3); nudgeY(k, q < 1 ? +((1 - q) * L.uiDY).toFixed(2) : 0); });
  }
  // ---------- 마스코트 ----------
  // 5판: 아바타 자리는 고정 좌표가 아니라 그 화면의 "ai 아바타" 레이어 위치 (질문이 두 줄인 H11 은 18px 아래). 원 지름 = 칸 × 2/2.9
  function slotXYD(id, slot) { const a = slot === "avatar" && SCR[id] && find(id, "ai 아바타")[0]; if (!a) return MASCOT_SLOT[slot]; const w = a.offsetWidth, d = w * 2.9 / 2; return [a.offsetLeft + w / 2 - d / 2, a.offsetTop + a.offsetHeight / 2 - d / 2, d]; }
  function placeMascot(id, opt = {}) {
    const m = MASCOT[id] || {}; stage.classList.toggle("front", !!m.front); if (m.keep) { if (m.look) lookAt(m.look); return; }
    if (m.slot === null || m.slot === undefined && !m.state) {   // 13판: 숨길 때 — 앞으로면 이전 화면과 같이 왼쪽으로 밀리며 새 화면이 덮기 전에 사라짐, 뒤로면 위 화면 밑이라 바로
      if (!stage.classList.contains("hid") && stage.animate && navDir > 0) stage.animate([{ translate: "0 0", opacity: 1 }, { translate: "-117px 0", opacity: 0 }], { duration: 200, easing: "cubic-bezier(.2,.8,.2,1)" });
      stage.style.transition = "none"; stage.classList.add("hid"); return; }
    const [x, y, d] = slotXYD(id, m.slot || "logo"); moveStage({ x, y, s: d / 220 }, opt.instant ? 0 : m.front ? 500 : T.slot, m.front ? "cubic-bezier(.32,.72,0,1)" : "cubic-bezier(.2,.8,.2,1)");   // 11판: 시트 위 마스코트(D2)는 시트와 같은 시간·같은 곡선으로
    if (m.state && !opt.noState) plan(m.state); if (m.look) lookAt(m.look);
  }
  // 5판: 피그마 조각의 Tailwind translate(가운데·오른쪽 정렬)는 그대로 두고, 세로 이동은 따로 합쳐지는 transform 으로 (0 이면 원래대로)
  function nudgeY(k, y) { if (k.dataset.tf0 === undefined) k.dataset.tf0 = k.style.transform; k.style.transform = y ? `translateY(${y}px)` : k.dataset.tf0; }
  // 13판: 숨어 있던 마스코트가 다시 나올 때 화면(in-push/in-back .32s, 24px)과 따로 0.25초에 먼저 떠올라 '중간에 툭' 보이던 것 → 그 화면과 같은 방향·시간·곡선으로 같이 들어옴 (자리는 즉시)
  let navDir = 390;   // 13판 아이폰 넘김: show = 새 화면과 같이 오른쪽 끝(390)에서, back = 덮여 있던 화면과 같이 왼쪽 30%(-117)에서
  function moveStage(p, ms = T.stage, ease = "cubic-bezier(.65,0,.35,1)") {
    if (stage.classList.contains("hid")) { ms = 0; stage.classList.remove("hid"); stage.style.transition = "none"; stage.style.opacity = ""; if (stage.animate) stage.animate([{ translate: `${navDir}px 0` }, { translate: "0 0" }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" }); }
    stage.classList.remove("hid"); stage.style.transformOrigin = "0 0"; stage.style.transition = `transform ${ms}ms ${ease}, opacity .25s`; stage.style.transform = `translate(${p.x - STAGE0.x}px, ${p.y - STAGE0.y}px) scale(${p.s})`; clearTimeout(moveStage._t); moveStage._t = setTimeout(layoutGL, ms + 30); }
  let queue = [];
  function plan(...states) { queue = states.slice(); }
  function pumpQueue() { const st = __m.state(); if (!queue.length || st.next) return; const m = queue[0]; if (st.cur === m) { queue.shift(); return; } __m.go(m, now()); if (__m.state().next === m) queue.shift(); else if (st.cur !== "idle" && m !== "idle") queue.unshift("idle"); else queue.shift(); }
  const react = (ty) => __m.react(ty, now());
  const expr = (n) => __m.expr(n || null);
  const gaze0 = PATS.diverge.gaze; PATS.diverge.gaze = (ht) => gazeHold || gaze0(ht);
  function lookAt(xy) { gazeHold = xy; if (xy) { gazeTgt = xy; nextGaze = now() + 600; tau = .18; } else nextGaze = now() + .5; }
  function after(ms, fn) { const id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  // 기다리는 장면: WAIT[name] 대로 상태를 차례로 보내고 때맞춰 콜백
  function wait(name, cb = {}) { const w = WAIT[name]; for (const [st, at] of w.seq) after(at, () => plan(st)); if (w.happyAt) after(w.happyAt, () => react("happy")); for (const k of ["typeAt", "dealAt", "doneAt"]) if (w[k] && cb[k]) after(w[k], cb[k]); return w; }
  return { alignSkip: ALIGN_SKIP, prefetch, home, slotXYD, nudgeY, pickFlow, mascotHit, build, show, back, plan, react, expr, lookAt, after, wait, find, cur, base, stack: () => stack, tapDiverge, isDarkOn, moveStage, now, tl, SCR, STAGE0 };
})();
