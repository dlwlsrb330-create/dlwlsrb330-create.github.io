// actions.js — flow.js 의 "fn:이름"·"ask" 가 부르는 동작. 한 동작 = 한 함수. 상태 순서·시간은 mascot.js 의 WAIT 에 있다.
const ACTIONS = (() => {
  const P = COMET; let cards = [], cardCount = 5, cardIdx = 0, kept = 0;
  // 글 타이핑: 답 화면(H2·H6·H7·H8)의 본문(아바타 줄 아래 ~ 입력 바 위)을 숨겼다가 차례로 나오게 한다. 와이어프레임 글은 그대로.
  // 본문(아바타 줄 아래 ~ 입력 바 위)을 숨겼다가 때가 되면 차례로 나오게 한다. 와이어프레임 글은 그대로.
  const content = (id, y0 = 200, y1 = 700) => [...P.SCR[id].fig.children].filter(k => { const t = parseFloat(k.style.top) || 0; return t > y0 && t < y1 && k.style.visibility !== "hidden"; });
  const hide = (kids) => kids.forEach(k => { k.style.transition = "opacity .35s"; k.style.opacity = "0"; k.dataset.hid = "1"; });   // 5판: 숨긴 표시 — 도중에 떠나도 router 가 다음에 보일 때 되돌린다
  const revealSeq = (kids, step = 90) => { step = Math.min(step, 1500 / Math.max(1, kids.length)); kids.forEach((k, i) => P.after(i * step, () => { k.style.opacity = "1"; delete k.dataset.hid; })); };   // 5판: 줄이 많아도 1.5초 안에 다 나오게
  // 4판: 상태가 실제로 도착했을 때 다음 단계로 (고정 ms 로 걸면 '생각중 → 행성 → 전구' 이동 시간 때문에 전구가 뜨자마자 사라졌다)
  const arrived = (name) => () => { const s = __m.state(); return s.cur === name && !s.next; };
  function when(cond, fn, limit = 9000) { const t0 = performance.now(); const tick = () => (cond() || performance.now() - t0 > limit) ? fn() : P.after(60, tick); tick(); }
  const CHAT_DROP = 214;   // 생각하는 동안 채팅이 내려가는 거리(px) = 마스코트(로고 자리) 아래로
  function typeAnswer({ id }) {
    const kids = content(id, 150); hide(kids);   // 5판: "Comet · 기록 N개에서 찾음" 줄(y 173~194)도 답이 만들어질 때 같이 나오게
    const chat = [...P.SCR[id].fig.children].filter(k => { const t = parseFloat(k.style.top) || 0; return t >= 96 && t < 700 && k.style.visibility !== "hidden"; });
    const drop = (y, ms) => chat.forEach(k => { k.style.transition = `transform ${ms}ms cubic-bezier(.65,0,.35,1), opacity .35s`; P.nudgeY(k, y); });
    const [lx, ly, ld] = MASCOT_SLOT.logo, [ax, ay, ad] = P.slotXYD(id, "avatar");   // 5판: 그 화면의 아바타 자리
    drop(CHAT_DROP, 0); P.after(30, () => drop(CHAT_DROP, 0));
    P.moveStage({ x: lx, y: ly - 14, s: ld / 220 }, 0);                                   // 채팅이 비켜 준 자리에서 크게 생각중 → 전구(삥)
    P.plan("think");
    when(arrived("think"), () => P.after(WAIT.answer.thinkHold, () => { P.plan("bulb");                       // 생각중 잠깐 → 전구(삥)
      when(arrived("bulb"), () => P.after(WAIT.answer.bulbHold, () => {
        P.moveStage({ x: ax, y: ay, s: ad / 220 }); drop(0, 550); P.plan("idle");   // 5판: 작아지며 들어가는 동안 기본 모양(행성)으로 한 번만 바뀌고                   // 마스코트가 아바타 자리로 들어가고 채팅이 제자리로 올라온다
        P.after(650, () => revealSeq(kids));                                                                  // 답이 다 나온 뒤에는 더 변신하지 않는다 (예전: 답변 모양 → 공 → 행성으로 한 번 더 바뀜)
      }));
    }));
  }
  function ask({ from, to, el }) {
    const dest = to || "H2"; P.plan("idle", "think");
    P.after(420, () => P.show(dest, "push", { noState: true }));                  // 생각중인 채 답 화면으로 미끄러져 가서 거기서 전구·답변 (4판: 900 → 420ms, 터치 반응)
  }
  const like = () => P.react("heart"), dislike = () => P.react("shake");
  const readAloud = () => { P.plan("idle", "answer"); P.after(2600, () => P.plan("idle")); };
  const listen = () => { P.plan("listen"); P.after(2600, () => P.plan("idle")); };
  const diverge = () => { if (!P.isDarkOn()) P.tapDiverge(); };
  const converge = () => { if (P.isDarkOn()) P.tapDiverge(); };
  const openSaved = () => { const n = APP5.savedCount(); P.show(n ? "D5" : "D6", "push"); if (n) APP5.renderSaved(); };   // 5판: 담은 카드는 app5 가 실제 목록으로
  const throwIdea = () => { P.plan("idle", "think"); P.after(2000, () => P.plan("idle", "dots")); };
  // 11판: 카드 장수 — 누른 칸(3·5·8·12장)으로 선택 표시가 미끄러져 가고, 글자 색과 아래 버튼 「카드 N장 뽑기」가 따라 바뀐다
  const COUNTS = [3, 5, 8, 12], SEG = { x0: 20, w: 87.5, pad: 4 };
  function pickCount({ el }) {
    const fig = P.SCR.D2.fig, base = P.find("D2", "카드 장수 · 바탕")[0], sel = P.find("D2", "카드 장수 · 선택됨")[0]; if (!base || !sel) return;
    const ev = window.event, z = fig.getBoundingClientRect().width / 390, bx = base.getBoundingClientRect().left;
    const i = Math.max(0, Math.min(3, Math.floor(((ev ? ev.clientX : bx) - bx) / z / SEG.w)));
    cardCount = COUNTS[i];
    sel.style.transition = "left .22s cubic-bezier(.2,.8,.2,1)"; sel.style.left = (SEG.x0 + SEG.w * i + SEG.pad) + "px";
    const labs = [...fig.querySelectorAll("p")].filter(p => /^(3|5|8|12)장$/.test(p.textContent.trim())).sort((a, b) => parseFloat(a.style.left) - parseFloat(b.style.left));
    if (!pickCount.on) pickCount.on = { color: getComputedStyle(labs[1]).color, weight: getComputedStyle(labs[1]).fontWeight }, pickCount.off = { color: getComputedStyle(labs[0]).color, weight: getComputedStyle(labs[0]).fontWeight };
    labs.forEach((p, k) => { const s = k === i ? pickCount.on : pickCount.off; p.style.color = s.color; p.style.fontWeight = s.weight; });
    const btn = [...fig.querySelectorAll("p")].find(p => /^카드 \d+장 뽑기$/.test(p.textContent.trim())); if (btn) btn.textContent = `카드 ${cardCount}장 뽑기`;
  }
  function dial({ el }) { /* 다이얼 점 드래그 → 시선. 한 번만 연결 */ if (el.dataset.dialWired) return; el.dataset.dialWired = "1"; const dot = P.find("D2", "Dot")[0]; let drag = false; const R = el.offsetWidth / 2 - 14;
    const setK = (e) => { const r = el.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; } if (dot) { dot.style.left = (r.width / 2 + dx - dot.offsetWidth / 2) + "px"; dot.style.top = (r.height / 2 + dy - dot.offsetHeight / 2) + "px"; } P.lookAt([dx / R * .32, -.12 - dy / R * .26]); };
    el.addEventListener("pointerdown", (e) => { drag = true; el.setPointerCapture(e.pointerId); setK(e); }); el.addEventListener("pointermove", (e) => { if (drag) setK(e); }); el.addEventListener("pointerup", () => { drag = false; }); }
  // 11-04 주형: 카드 덱은 로딩이 끝난 뒤에 나온다(지난번 페이드가 남아 있으면 숨김이 늦게 먹어 카드가 먼저 보였다 → 전환 끄고 숨김).
  // 가운데서 크게·빨리 돌다가 → 궤도를 따라 한 알씩 한 줄로 오른쪽 위로(SLIME.exitTo) → 모서리에선 사선 고리 궤도
  function drawCards() { P.lookAt(null); P.back(); P.show("D4", "push", { noState: true }); const deck = P.find("D4", "div.deck")[0], btns = P.SCR.D4.el.querySelector(".deckbtns");
    if (deck && typeof BEODIAL !== "undefined") { const cl = BEODIAL.color(); deck.style.setProperty("--tc", cl.rgb.join(",")); deck.style.setProperty("--ta", (.5 * cl.k).toFixed(3));   // 11-05: 카드는 흰 바탕 + 고른 방식(마스코트) 색 아주 옅게 · 11-05 진규: .17 → .5 (배경과 구분되게 색 올림)
      const sc = P.SCR.D4.el.style; if (cl.k > .25) sc.setProperty("--kc", cl.rgb.join(",")); else sc.removeProperty("--kc"); }   // 11-05 진규: 담기 버튼 · 오른쪽으로 넘길 때 색 = 카드 색(마스코트 색). 다이얼 가운데 근처(색이 거의 없음)면 기본 주황
    [deck, btns].forEach(e => { if (e) { e.style.transition = "none"; e.style.opacity = "0"; } });   // ✕ / ✓ 버튼도 덱과 함께 나중에
    const [lx, ly, ld] = MASCOT_SLOT.logo, [cx, cy, cd] = MASCOT_SLOT.deckCorner, DRAW_D = 230;
    const c0 = [lx + ld / 2, ly + 160 + ld / 2], c1 = [cx + cd / 2, cy + cd / 2], unit = DRAW_D / 2.9;   // 무대 220px = 공 반지름 2.9 칸
    const slime = typeof SLIME !== "undefined";
    const dv = typeof BEODIAL !== "undefined" ? BEODIAL.value() : { x: 0, y: 0 };   // 고른 방식은 로딩 중 말(~하는 중…)에만
    P.moveStage({ x: c0[0] - DRAW_D / 2, y: c0[1] - DRAW_D / 2, s: DRAW_D / 220 });   // 카드 자리 가운데서 크게 (11-05: 움직임은 하나로 — 다이얼은 색만)
    // 11-05 진규: 9배로 같은 빠르기만 돌던 것 → '싹 틔우기'(diverge_slime.js SLIME.bud): 한 덩어리로 뭉쳤다 공이 하나씩 싹처럼 떨어져 나옴. 그동안 궤도는 천천히, 다 나오면 살짝 빨라졌다 exitTo 로 확
    let exitLate = null;   // 싹이 다 나오기 전에 카드 낼 때가 되면, 다 나온 뒤 .25초에 빠져나감
    if (slime) { SLIME.orbit(1, 1.6, 3); if (!SLIME.bud(() => { SLIME.orbit(1, 9, 3); if (exitLate) { const f = exitLate; exitLate = null; P.after(250, f); } })) SLIME.orbit(1, 9, 3); }
    const stopVibe = vibe(dv.x);
    const deal = () => { P.moveStage({ x: cx, y: cy, s: cd / 220 }, 0); cardIdx = 0; kept = 0; APP5.resetDeck();
      if (deck) { deck.style.transition = "none"; deck.style.opacity = "1"; } const t = APP5.dealIn();   // 카드는 한 장씩 착착 쌓이고(app5), 버튼은 다 쌓인 뒤에
      if (btns) { btns.style.transition = "opacity .3s"; P.after(Math.max(0, t - 150), () => { btns.style.opacity = "1"; }); } P.after(t + 350, () => APP5.nudgeDeck()); };
    P.wait("cards", { dealAt: () => { const go = () => { stopVibe(); slime ? SLIME.exitTo([(c1[0] - c0[0]) / unit, -(c1[1] - c0[1]) / unit], cd / DRAW_D, deal) : deal(); };
      if (slime && SLIME.budding && SLIME.budding()) exitLate = go; else go(); } }); }
  // 11-05 주형: 카드 뽑는 동안 공 궤도 위에 '~하는 중…' 이 바뀌어 뜬다 (Claude 의 Vibing… 처럼). 고른 방식(친숙한 ↔ 창의적인)에 따라 말이 달라진다
  const VIBE = { odd: ["뒤집는 중", "비트는 중", "엉뚱해지는 중", "멀리 던지는 중", "낯설게 보는 중", "규칙 깨는 중"],
    fam: ["다듬는 중", "고르는 중", "익숙한 걸 꺼내는 중", "차곡차곡 쌓는 중", "정리하는 중"], mid: ["섞는 중", "궁리하는 중", "엮어 보는 중", "굴려 보는 중", "쪼개 보는 중", "떠올리는 중"] };
  function vibe(x) { const words = x > .3 ? VIBE.odd : x < -.3 ? VIBE.fam : VIBE.mid, el = document.createElement("div"); el.className = "vibe"; P.SCR.D4.el.appendChild(el);
    let i = Math.floor(Math.random() * words.length), timer = 0;
    const next = () => { const w = document.createElement("span"); w.textContent = words[i++ % words.length] + "…"; el.querySelectorAll("span").forEach(o => { o.classList.add("out"); setTimeout(() => o.remove(), 300); }); el.appendChild(w); timer = setTimeout(next, 1150); };
    timer = setTimeout(next, 250);
    return () => { clearTimeout(timer); el.classList.add("off"); setTimeout(() => el.remove(), 320); }; }
  function cardTap({ el, ev }) { const card = el.closest("[data-name='div.card']") || el; const r = card.getBoundingClientRect(); const keep = (event.clientX - r.left) > r.width / 2;
    card.style.transition = "transform .45s cubic-bezier(.3,.7,.2,1), opacity .3s"; card.style.transform = keep ? "translateX(420px) rotate(12deg)" : "translateX(-420px) rotate(-12deg)"; card.style.opacity = "0";
    if (keep) { cards.push(card.textContent.trim().slice(0, 40)); P.react("happy"); } else { P.expr("glance"); P.after(700, () => P.expr(null)); }
    cardIdx++; P.after(500, () => { card.style.transition = "none"; card.style.transform = ""; card.style.opacity = "1"; });
    if (cardIdx >= cardCount) { P.after(600, () => P.react("surprise")); P.after(1900, () => P.back()); } }
  // 5판: 카드 덱을 끌어서 담기(오른쪽)·넘기기(왼쪽) — app5 의 드래그가 부른다
  function deckResult(keep, card) {
    if (keep) { APP5.addSaved(card); P.react("happy"); if (!kept++) watchReturn(); } else { P.expr("glance"); P.after(700, () => P.expr(null)); }
    cardIdx++; if (cardIdx >= cardCount) { P.after(600, () => P.react("surprise")); P.after(1900, () => { if (P.cur() === "D4") P.back(); }); }
  }
  const deckLeft = () => Math.max(0, cardCount - cardIdx);   // 11-04 주형: 고른 장수만큼만 — 남은 장수 (app5 덱이 뒤 카드 수·마지막 장을 맞춘다)
  // 11-04 주형: 하나라도 담고 발산 화면으로 돌아오면(다 넘겨서든 ✕ 로 닫아서든) 「담은 카드」 줄이 빛난다
  function watchReturn() { const c = P.cur(); if (c === "D1") { if (kept) setTimeout(glowSaved, 380); kept = 0; return; } if (c === "D4") setTimeout(watchReturn, 150); }   // P.after 는 화면이 바뀔 때 지워져서 setTimeout
  // 발산 화면으로 돌아오면 「담은 카드」 줄 테두리가 빛난다 (화면이 반전 필터를 거쳐서 빛 층은 화면 밖 층에 같은 자리로 얹는다)
  function glowSaved() { const s = P.SCR.D1, bar = s && s.fig.querySelector('[data-name="담은 카드"]'); if (!bar) return;
    const g = document.createElement("div"); g.className = "savedglow"; g.style.cssText = `left:${bar.offsetLeft}px;top:${bar.offsetTop}px;width:${bar.offsetWidth}px;height:${bar.offsetHeight}px`;
    s.el.appendChild(g); setTimeout(() => g.remove(), 2000); }
  const removeSaved = () => { cards.pop(); P.expr("sad"); P.after(1200, () => P.expr(null)); };
  function search({ to }) { to = to || "T7"; if (P.cur() !== to) P.show(to, "push", { noState: true });   // 11-05 주형: 이미 찾기 결과 화면이면 그 자리에서 다시 찾기
    const kids = content(to, 130, 740); hide(kids);   // 5판: 필터 칩 줄(y 96~128)은 그대로 두고 결과만 숨겼다가 · 11-05: 결과 목록 상자(top 140)가 140 < t 조건에 걸려 안 숨던 것 → 130 부터
    const at = (d, ms) => P.moveStage({ x: 195 - d / 2, y: 330 - d / 2, s: d / 220 }, ms);
    at(56, 0); P.plan("magnify");                                                                 // 작게 뜨고
    when(arrived("magnify"), () => { at(196, 620);                                               // 돋보기가 되면 커졌다가
      P.after(WAIT.search.hold, () => { at(64, 520); P.after(560, () => { at(0, 280); P.plan("idle"); revealSeq(kids, 60); }); });   // 다 찾으면 다시 작아지며 들어감
    }); }
  // 5판: 피그마에서 칩 글자·점·아이콘은 칩 바탕의 형제로 따로 온다 → 칩 영역 안에 놓인 형제들 (+ 안쪽 자식)
  const inside = (el) => [...el.querySelectorAll("p"), ...[...el.parentElement.children].filter(k => k !== el && k.offsetLeft >= el.offsetLeft - 1 && k.offsetTop >= el.offsetTop - 1 && k.offsetLeft + k.offsetWidth <= el.offsetLeft + el.offsetWidth + 1 && k.offsetTop + k.offsetHeight <= el.offsetTop + el.offsetHeight + 1 || centerIn(k, el))];
  // 가운데 정렬 글자(translate -50%)는 offsetLeft 가 실제 자리와 달라서 위 검사에서 빠진다 → 보이는 상자의 가운데가 칩 안이고 칩보다 작으면 칩 글자
  const centerIn = (k, el) => { const a = k.getBoundingClientRect(), b = el.getBoundingClientRect(); if (!a.width || !b.width || a.width * a.height > b.width * b.height) return false; const x = a.left + a.width / 2, y = a.top + a.height / 2; return x > b.left && x < b.right && y > b.top && y < b.bottom; };
  const textOf = (el) => inside(el).flatMap(k => k.tagName === "P" ? [k] : [...k.querySelectorAll("p")]);
  // 5판: 필터 칩 — 누른 칩이 선택 모양(지금 선택된 칩의 바탕·글자색)을 받고, 나머지는 선택 안 된 모양으로
  function filterChip({ from, el }) {
    const chips = P.find(from, "칩 ").filter(c => !c.dataset.name.includes("#")), dark = (c) => { const m = getComputedStyle(c).backgroundColor.match(/[\d.]+/g); return m && (m[3] === undefined || +m[3] > .5) && +m[0] + +m[1] + +m[2] < 200; };   // 반투명 바탕은 선택 아님
    const sel = chips.find(dark), un = chips.find(c => !dark(c)); if (!sel || !un || sel === el) return;
    const look = (c) => ({ bg: getComputedStyle(c).backgroundColor, fg: getComputedStyle(textOf(c)[0] || c).color, bd: getComputedStyle(c).borderColor });
    const S = look(sel), U = look(un), put = (c, L) => { c.style.backgroundColor = L.bg; c.style.borderColor = L.bd; textOf(c).forEach(p => p.style.color = L.fg); };
    chips.forEach(c => put(c, c === el ? S : U));   // 11-05 주형: 칩 누를 때 마스코트 기쁨 반응(노란 글로우) 뺌
    APP5.filter(from, el.dataset.name);   // 5판: 실제로 목록을 걸러냄 (없으면 빈 상태)
  }
  // 5판: 켜고 끄는 토글(트랙 + 바로 뒤 knob) — 누르면 색과 손잡이 자리가 바뀐다
  function toggleSwitch({ el }) {
    const knob = el.nextElementSibling && el.nextElementSibling.dataset.name === "knob" ? el.nextElementSibling : null;
    const L = parseFloat(el.style.left), W = parseFloat(el.style.width), K = knob ? parseFloat(knob.style.width) : 22;
    const wasOn = el.dataset.on ? el.dataset.on === "1" : !knob || parseFloat(knob.style.left) > L + W / 2 - K / 2;   // 처음엔 손잡이가 오른쪽이면 켜짐
    const on = !wasOn; el.dataset.on = on ? "1" : "0";
    el.style.transition = "background-color .2s"; el.style.backgroundColor = on ? "#1c1730" : "#e4e0ee";   /* 11-05 주형: 토글 켬 = 잉크(주황 뺌) */
    if (knob) { knob.style.transition = "left .2s"; knob.style.left = (on ? L + W - K - 2 : L + 2) + "px"; }
    if (on) P.react("happy");
  }
  const removeTag = ({ el }) => { const all = [el, ...inside(el)]; all.forEach(k => { k.style.transition = "opacity .2s"; k.style.opacity = "0"; }); P.after(200, () => all.forEach(k => k.style.display = "none")); };
  // 5판: ▾ 칩·더보기(…)처럼 와이어프레임에 펼친 모양이 없는 것 — 누르면 아래에 작은 목록이 열리고, 고르면 칩 글자가 바뀐다
  const MENUS = { "상태 칩": ["회의", "피드백", "형태"], "동작 칸 36 · ic_more": ["복사", "공유", "신고"] };   // 7판: 상태 칩에서 녹음 뺌 (녹음은 종류가 아님)
  function dropMenu({ el }) {
    document.querySelectorAll(".dropmenu").forEach(m => m.remove());
    const key = Object.keys(MENUS).find(k => el.dataset.name.startsWith(k)); if (!key) return;
    const ph = document.getElementById("phone").getBoundingClientRect(), r = el.getBoundingClientRect(), z = ph.width / 390;
    const m = document.createElement("div"); m.className = "dropmenu";
    m.style.left = Math.min((r.left - ph.left) / z, 390 - 150) + "px"; m.style.top = ((r.bottom - ph.top) / z + 6) + "px";
    const label = textOf(el)[0];
    for (const o of MENUS[key]) { const b = document.createElement("button"); b.textContent = o; b.onclick = (ev) => { ev.stopPropagation(); if (key === "상태 칩" && label) label.textContent = o + " ▾"; m.remove(); P.react("happy"); }; m.appendChild(b); }
    document.getElementById("phone").appendChild(m);
    P.after(0, () => document.addEventListener("pointerdown", function close(ev) { if (!m.contains(ev.target)) { m.remove(); document.removeEventListener("pointerdown", close, true); } }, true));
  }
  const trash = () => { P.show("T1", "replace"); P.moveStage({ x: 155, y: 262, s: 80 / 220 }); P.plan("idle"); P.expr("sad"); P.after(1600, () => { P.expr(null); P.moveStage({ x: 155, y: 262, s: 0 }); }); };
  const invite = () => {};   // 11-06 진규: 초대 · 공유 누를 때 마스코트 연출 뺌 (전엔 마스코트가 위로 올라가 메시지 보내는 연출)
  const connect = ({ el }) => { P.wait("connect", {}); P.after(WAIT.connect.happyAt, () => { if (el) el.style.outline = "2px solid #161616"; }); };
  const disconnect = () => { P.plan("idle"); };
  const restore = () => { P.react("happy"); P.after(900, () => P.back()); };
  const typing = () => { P.plan("listen"); P.after(2200, () => P.plan("idle")); };
  // 13판: OB-1 종류 칩 — 예전엔 기쁨 반응만 하고 고른 표시가 안 바뀌어 '안 눌린다'로 보였음. 하나만 고름(고른 것 = 진한 바탕·흰 글).
  // '+ 직접 쓰기' 는 그 자리에 입력칸이 열리고, Enter·밖 누르기로 끝내면 친 글이 칩이 되어 골라짐(비우면 원래대로)
  const TAG_ON = { bg: "#1c1730", fg: "#fff" }, TAG_OFF = { bg: "rgba(20,15,36,0.05)", fg: "#1a1626" };
  const tagLabel = (chip) => { const r = chip.getBoundingClientRect(); return [...chip.parentElement.querySelectorAll("p")].find(q => { const b = q.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2; return x > r.left && x < r.right && y > r.top && y < r.bottom; }); };
  const tagSelect = (chip) => P.find("OB-1", "태그 칩").forEach(c => { const on = c === chip, p = tagLabel(c); c.style.backgroundColor = on ? TAG_ON.bg : TAG_OFF.bg; if (p) p.style.color = on ? TAG_ON.fg : TAG_OFF.fg; });
  const pickTag = ({ el }) => {
    if (!/직접 쓰기/.test(el.dataset.name)) { tagSelect(el); P.react("happy"); return; }
    const p = tagLabel(el); if (!p || el.querySelector("input")) return;
    const w0 = el.style.width, text0 = p.textContent, cs = getComputedStyle(p), inp = document.createElement("input");
    tagSelect(null); el.style.width = "160px"; p.style.visibility = "hidden";   // 입력 중에도 다른 칩과 같은 테두리·바탕 (따로 진한 테두리를 주면 혼자 튐)
    inp.placeholder = "종류 입력"; inp.setAttribute("aria-label", "프로젝트 종류 직접 쓰기"); inp.spellcheck = false;
    inp.style.cssText = `position:absolute;inset:0 14px;width:calc(100% - 28px);height:100%;margin:0;padding:0;border:0;outline:none;background:transparent;font:${cs.font};color:#1a1626;text-align:center`;
    el.appendChild(inp);
    for (const k of ["pointerdown", "click"]) inp.addEventListener(k, (e) => e.stopPropagation());
    const done = () => {
      const v = inp.value.trim(); inp.remove(); p.style.visibility = "";
      if (!v) { el.style.width = w0; p.textContent = text0; tagSelect(null); el.style.backgroundColor = TAG_OFF.bg; return; }
      const ruler = document.createElement("span"); ruler.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${cs.font}`; ruler.textContent = v; document.body.appendChild(ruler);
      const w = Math.max(67, Math.ceil(ruler.offsetWidth) + 32); ruler.remove();
      el.style.width = w + "px"; p.style.width = w + "px"; p.style.left = (el.offsetLeft + w / 2) + "px"; p.textContent = v;   // 가운데 정렬(translate -50%)은 그대로, 기준점(left)만 옮김
      tagSelect(el); P.react("happy");
    };
    inp.addEventListener("keydown", (e) => { e.stopPropagation(); if ((e.key === "Enter" && !e.isComposing) || e.key === "Escape") inp.blur(); });
    inp.addEventListener("blur", done, { once: true });
    setTimeout(() => inp.focus(), 0);
  };
  const topicDone = ({ to }) => {   // 13판: 1.2초에 화면을 넘기면 show 가 예약(전구 → 원래 2초 · 기쁨 3.2초)을 다 지워 전구로 남았음 → 넘긴 뒤 남은 것을 다시 건다
    const GO = 1200, w = WAIT.topic, back = w.seq.find(([s]) => s !== "bulb")[1];
    P.wait("topic", {});
    P.after(GO, () => { P.show(to, "push", { noState: true }); P.after(back - GO, () => P.plan("idle")); P.after(w.happyAt - GO, () => P.react("happy")); P.after(w.happyAt + 600 - GO, () => P.plan("idle")); });
  };
  const start = ({ to }) => P.show(to, "push");
  const connectBack = ({ to }) => { P.show(to, "push"); P.after(300, () => { P.find("OB-3", "타일 피그마").forEach(e => e.style.outline = "2px solid #161616"); P.react("happy"); }); };
  // 녹음: R1 시트 닫고 R2-6c(홈 + 알약 자리)로, 빨간 마이크가 왼쪽으로 늘어나 알약이 되며(점·파형·시간) 마스코트는 듣기. 알약 누르면 정지 → 정리(생각구름) → 기쁨 → T2
  // 13판: 녹음 중 홈(R2-6c)은 홈과 배치가 같아 넘기지 않고 제자리에서 바꿔 끼움(still) — 넘기면 같은 홈이 통째로 밀려 들어오고 빨간 마이크가 밀려 사라져 보였음.
  // 알약을 누르면 바로 끝내지 않고 '녹음을 끝낼까요?' 확인
  function startRecording({ to }) {
    const id = to || "R2-6c", from = P.base(), t1 = headTitle(from),   /* cur() 는 위에 뜬 녹음 확인 시트(R1) — 그 아래 홈의 제목을 잼 */ r1 = t1 && textRect(t1);   // 바꿔 끼우기 전 홈 제목 글자 자리
    P.back(); P.show(id, "push", { still: true }); RECPILL.start(() => confirmStop());
    // 13판: 알약이 늘어나는 동안 헤더 제목이 가운데 → 왼쪽으로 같은 시간·곡선(애플 다이내믹 아일랜드처럼)으로 밀려남. 예전엔 한 프레임에 툭 바뀜
    const t2 = headTitle(id), r2 = t2 && textRect(t2);
    if (r1 && r2 && t2.animate) t2.animate([{ translate: `${r1.left - r2.left}px 0` }, { translate: "0 0" }], { duration: RECPILL.PILL.grow, easing: RECPILL.PILL.ease });
  }
  function headTitle(id) { const f = P.SCR[id] && P.SCR[id].fig; return f && [...f.querySelectorAll("p")].find(p => /프로덕트디자인4|▾/.test(p.textContent) && (parseFloat(p.style.top) || 0) < 100); }
  function textRect(p) { const r = document.createRange(); r.selectNodeContents(p); return r.getBoundingClientRect(); }
  // ---------- 폰 위에 띄우는 창(액션 시트 · 알럿) 공통 ----------
  // 앱의 누르기 처리(router, phone 캡처)가 뒤 화면 단추를 고르지 않게 창 안·밖 누르기는 먼저 받는다
  const UI_FONT = "'Pretendard Variable', Pretendard, -apple-system, 'Noto Sans KR', sans-serif", INK = "#1c1730";
  function overlay(id, html, { cardSel, inFrames, outFrames, inMs = 300, outMs = 220, onAct }) {
    if (document.getElementById(id)) return null;
    const box = document.createElement("div"); box.id = id; box.style.cssText = "position:absolute;inset:0;z-index:8";
    box.innerHTML = `<div data-dim style="position:absolute;inset:0;background:rgba(20,15,36,.28)"></div>${html}`;
    $("phone").appendChild(box);
    const dim = box.querySelector("[data-dim]"), card = box.querySelector(cardSel);
    dim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: inMs, easing: "ease-out" });
    card.animate(inFrames, { duration: inMs, easing: "cubic-bezier(.32,.72,0,1)" });
    const close = (then) => { window.removeEventListener("click", onTap, true); window.removeEventListener("pointerdown", eat, true);
      dim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: outMs, fill: "forwards" });
      card.animate(outFrames, { duration: outMs, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" }).onfinish = () => { box.remove(); if (then) then(); }; };
    const eat = (ev) => { if (box.contains(ev.target) && !ev.target.closest("textarea, input")) { ev.stopPropagation(); ev.preventDefault(); } else if (box.contains(ev.target)) ev.stopPropagation(); };
    const onTap = (ev) => { if (!box.contains(ev.target)) return; ev.stopPropagation(); if (ev.target.closest("textarea, input")) return; ev.preventDefault();
      const a = ev.target.closest("[data-act]"); onAct(a ? a.dataset.act : "dim", close, box); };
    window.addEventListener("pointerdown", eat, true); window.addEventListener("click", onTap, true);
    return box;
  }
  // 11-05 주형(녹음 끝 창): 전엔 알약 바로 아래 붙어 뜨는 카드(팝오버) — 아이패드 · 맥 문법. 애플 HIG: 좁은 화면(아이폰)에선 팝오버를 피하고,
  //   사용자가 스스로 한 동작에 딸린 선택은 알럿이 아니라 액션 시트(아이폰 아래) → 아래에서 올라오는 액션 시트: 위 칸(제목 · 설명 · 녹음 끝내기) + 따로 떨어진 '계속 녹음'(취소 자리, 맨 아래 · 굵게)
  function confirmStop() {
    const btn = (act, label, w = 400) => `<button data-act="${act}" style="all:unset;display:block;width:100%;height:57px;font:${w} 17px/57px ${UI_FONT};color:${INK};text-align:center;cursor:pointer;letter-spacing:-.01em">${label}</button>`;
    overlay("recAsk", `<div data-card style="position:absolute;left:8px;right:8px;bottom:34px;font-family:${UI_FONT}">
        <div style="border-radius:14px;background:#f9f8fb;overflow:hidden">
          <div style="padding:14px 16px 13px;text-align:center"><div style="font-size:13px;font-weight:600;color:#6b6484">녹음을 끝낼까요?</div><div style="margin-top:3px;font-size:13px;color:#6b6484">끝내면 바로 정리해 드려요</div></div>
          <div style="height:.5px;background:rgba(20,15,36,.14)"></div>${btn("stop", "녹음 끝내기")}
        </div>
        <div style="margin-top:8px;border-radius:14px;background:#fff">${btn("keep", "계속 녹음", 600)}</div></div>`, {
      cardSel: "[data-card]", inFrames: [{ transform: "translateY(110%)" }, { transform: "none" }], outFrames: [{ transform: "none" }, { transform: "translateY(110%)" }],
      onAct: (act, close) => act === "stop" ? close(() => stopRecording({ to: "T2" })) : close() });   // 밖(막)을 누르면 '계속 녹음'
  }
  // 11-05 주형: 사이드바 '의견 보내기' — 화면을 따로 두지 않고 가운데 알럿 하나(제목 · 설명 · 글 칸 · 취소 / 보내기). 글을 써야 보내기가 켜짐
  function feedback() {
    const box = overlay("fbAsk", `<div data-card style="position:absolute;left:50%;top:50%;width:270px;margin:-118px 0 0 -135px;border-radius:14px;background:#f9f8fb;overflow:hidden;font-family:${UI_FONT}">
        <div style="padding:19px 16px 15px;text-align:center"><div style="font-size:17px;font-weight:600;color:#1a1626">의견 보내기</div>
          <div style="margin-top:3px;font-size:13px;line-height:1.35;color:#6b6484">불편한 점이나 바라는 점을 적어 주세요.<br>Comet 팀에 바로 전달돼요.</div>
          <textarea data-fb rows="3" placeholder="의견을 적어 주세요" style="display:block;width:100%;margin-top:14px;padding:8px 10px;box-sizing:border-box;border:.5px solid rgba(20,15,36,.2);border-radius:8px;background:#fff;resize:none;outline:none;font:400 14px/1.4 ${UI_FONT};color:#1a1626"></textarea></div>
        <div style="height:.5px;background:rgba(20,15,36,.14)"></div>
        <div style="display:flex"><button data-act="cancel" style="all:unset;flex:1;height:44px;font:400 17px/44px ${UI_FONT};color:${INK};text-align:center;cursor:pointer">취소</button>
          <div style="width:.5px;background:rgba(20,15,36,.14)"></div>
          <button data-act="send" data-off="1" style="all:unset;flex:1;height:44px;font:600 17px/44px ${UI_FONT};color:${INK};text-align:center;cursor:pointer;opacity:.3">보내기</button></div></div>`, {
      cardSel: "[data-card]", inMs: 240, outMs: 180,
      inFrames: [{ opacity: 0, transform: "scale(1.15)" }, { opacity: 1, transform: "none" }], outFrames: [{ opacity: 1 }, { opacity: 0 }],
      onAct: (act, close, b) => { if (act === "dim") return;   // 알럿은 밖을 눌러도 안 닫힘(iOS 와 같음)
        if (act === "send") { if (b.querySelector("[data-act=send]").dataset.off) return; close(() => { toast("의견을 보냈어요. 고마워요"); P.react("happy"); }); } else close(); } });
    if (!box) return;
    const ta = box.querySelector("[data-fb]"), send = box.querySelector("[data-act=send]");
    ta.addEventListener("input", () => { const on = ta.value.trim().length > 0; send.style.opacity = on ? "1" : ".3"; if (on) delete send.dataset.off; else send.dataset.off = "1"; });
    setTimeout(() => ta.focus(), 250);
  }
  function stopRecording({ to }) { const rec = P.cur() === "R2-6c", t1 = rec && headTitle("R2-6c"), r1 = t1 && textRect(t1);   // 11-05 진규: 알약이 마이크 자리로 줄어든 뒤 녹음 중 홈 → 홈(마이크 있음)으로 제자리 바꿔 끼우고, 제목도 왼쪽 → 가운데로 같은 곡선
    if (rec) { const s = P.stack(); if (s.length > 1 && s[s.length - 2].id === "H1") s.pop(); }
    RECPILL.stop(() => { if (!rec) return; P.show("H1", "replace", { still: true }); const t2 = headTitle("H1"); if (r1 && t2 && t2.animate) requestAnimationFrame(() => { const r2 = textRect(t2); t2.animate([{ transform: `translateX(${r1.left - r2.left}px)` }, { transform: "none" }], { duration: RECPILL.PILL.grow, easing: RECPILL.PILL.ease }); }); P.lookAt(null); P.wait("record", { doneAt: () => P.show(to || "T2", "push") }); });
    if (!rec) { P.lookAt(null); P.wait("record", { doneAt: () => P.show(to || "T2", "push") }); } }   // 11판: 녹음 끝나면 녹음 중 화면(R2-6c, 마이크)을 기록에서 빼고 정리본으로 바꿈 → 정리본에서 뒤로 = 홈
  const checkTodo = () => P.react("happy");
  const saveEdit = () => { P.react("happy"); P.after(600, () => P.back()); };   // 5판: 기록 수정(-E) 완료 → 기쁨 → 상세로
  const goHome = () => P.home();
  // 5판: 짧은 안내 (복사·공유·바깥 앱 열기처럼 화면이 안 바뀌는 동작의 확인)
  function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.getElementById("phone").appendChild(t); setTimeout(() => t.classList.add("off"), 1300); setTimeout(() => t.remove(), 1600); }
  const copied = () => { toast("답을 복사했어요"); P.react("happy"); };
  const shared = () => { toast("공유 링크를 복사했어요"); P.react("happy"); };
  const openFigma = () => toast("피그마에서 원본을 열어요");
  // 5판: 서비스 연결 — 카드·목록의 「연결」→ 상세를 열고 바로 로그인(또는 가져올 곳) 시트
  function openConnect({ to }) { P.show(to, "push"); const b = window.BROWSER_FIRST && BROWSER_FIRST[to]; if (b) return P.after(380, () => P.show(b, "push"));   // 13판: 노션·드라이브는 로그인 브라우저, 카톡·md 는 파일 고르기부터
    const c = CONNECT.find(x => x[0] === to); if (c) P.after(380, () => { if (c[2] === "C-I-ai") aiRows(to); P.show(c[2], "sheet"); }); }   // 13판: Claude 등도 자기 로고로
  // 외부 로그인에서 「허용」→ 브라우저·시트를 닫고 상세를 연결됨으로 바꾼 뒤 가져올 곳 시트
  function connectDone({ from }) {
    const k = from.slice(4); while (/^C-/.test(P.cur()) && P.stack().length > 1) P.back(); const d = P.cur(), fig = P.SCR[d].fig;   // 13판: 로그인 시트 없이 바로 브라우저로 온 노션·드라이브도 상세까지
    const st = [...fig.querySelectorAll("p")].find(p => /아직 연결 안 됨/.test(p.textContent)); if (st) st.textContent = "연결됨 · 방금 연결했어요";
    fig.querySelectorAll('[data-name="상태 점"]').forEach(e => { e.querySelectorAll("img").forEach(i => i.style.visibility = "hidden"); e.style.backgroundColor = "#1c1730"; e.style.borderRadius = "50%"; });
    const cta = [...fig.querySelectorAll('[data-name^="btn "]')].find(b => /로그인하고 연결|연결$/.test(b.dataset.name) && b.offsetTop > 700);
    if (cta) [cta, ...inside(cta), ...[...fig.querySelectorAll("p")].filter(p => p.textContent.trim() === cta.dataset.name.slice(4))].forEach(e => { e.style.transition = "opacity .25s"; e.style.opacity = "0"; e.style.pointerEvents = "none"; });
    toast("연결했어요"); P.react("happy"); P.after(600, () => { aiRows(d); P.show(AFTER_LOGIN[k], "sheet"); });
  }
  // 13판: '읽을 프로젝트 고르기'(C-I-ai) 는 ChatGPT 용 한 장이라 줄 아이콘이 GPT 로 고정 → Gemini 등을 연결해도 GPT 로 보였음.
  // 시트를 열기 직전, 지금 연결하는 ai 상세 화면(d, 로고 타일 안)의 로고를 복사해 줄 아이콘 자리에 같은 크기로 얹는다. ChatGPT 면 원래대로
  function aiRows(d) {
    const fig = P.SCR["C-I-ai"] && P.SCR["C-I-ai"].fig, src = P.SCR[d] && P.SCR[d].fig; if (!fig || !src) return;
    fig.querySelectorAll("[data-ai-row]").forEach(e => e.remove());
    const dsts = [...fig.querySelectorAll('.sheetpart[data-name="logo openai"]')]; dsts.forEach(e => { e.style.visibility = ""; });
    if (d === "M4-GPT") return;
    const tile = src.querySelector('[data-name="로고 타일"]'); if (!tile) return;
    const tr = tile.getBoundingClientRect(), logo = [...src.children].find(e => { const r = e.getBoundingClientRect(); return e !== tile && r.width > 8 && r.left >= tr.left - 1 && r.right <= tr.right + 1 && r.top >= tr.top - 1 && r.bottom <= tr.bottom + 1; });
    if (!logo) return;
    const z = parseFloat(document.documentElement.style.zoom) || 1, lw = logo.getBoundingClientRect().width / z;   // 상세 화면에서 실제로 그려진 로고 폭(화면 맞춤 배율 뺌)
    dsts.forEach(dst => {
      const dw = dst.offsetWidth * .952, k = dw / lw;   // 줄 아이콘은 21px 칸을 .952 배로 그림
      const w = document.createElement("div"); w.dataset.aiRow = "1"; w.className = "sheetpart";
      w.style.cssText = `position:absolute;left:${parseFloat(dst.style.left) + (dst.offsetWidth - dw) / 2}px;top:${parseFloat(dst.style.top) + (dst.offsetHeight - dw) / 2}px;width:0;height:0;transform:scale(${k.toFixed(4)});transform-origin:0 0;pointer-events:none`;
      const c = logo.cloneNode(true); c.style.left = c.style.top = "0px"; c.removeAttribute("data-node-id"); w.appendChild(c);
      dst.style.visibility = "hidden"; dst.after(w);
    });
  }
  // 가져올 곳 시트: 줄을 누르면 고름/안 고름, 버튼 글자의 개수도 같이
  function toggleRow({ from, el }) {
    const fig = P.SCR[from].fig, marks = inside(el).filter(m => /^선택/.test(m.dataset.name || "")); if (!marks.length) return;
    const on = el.dataset.on ? el.dataset.on === "1" : marks.some(m => m.dataset.name === "선택됨" && m.style.visibility !== "hidden"); el.dataset.on = on ? "0" : "1";
    let check = marks.find(m => m.dataset.name === "선택됨"), ring = marks.find(m => m.dataset.name === "선택 안 됨");
    const ref = check || ring;
    if (!check) { const src = fig.querySelector('[data-name="선택됨"]'); if (src) { check = src.cloneNode(true); check.style.left = ref.style.left; check.style.top = ref.style.top; check.style.visibility = "hidden"; ref.after(check); } }
    if (!ring) { ring = document.createElement("div"); ring.dataset.name = "선택 안 됨"; ring.style.cssText = `position:absolute;left:${ref.style.left};top:${ref.style.top};width:20px;height:20px;border-radius:50%;border:1.5px solid #c4bdd8;visibility:hidden`; ref.after(ring); }
    if (check) check.style.visibility = on ? "hidden" : "visible"; ring.style.visibility = on ? "visible" : "hidden";
    if (check && !on && check.animate) check.animate([{ transform: "scale(.45)", opacity: .2 }, { transform: "scale(1.08)", opacity: 1, offset: .7 }, { transform: "scale(1)" }], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" });   // 13판: 고를 때 원이 채워지며 톡 (표시는 comet.css)
    const n = [...fig.querySelectorAll('[data-name="선택됨"]')].filter(c => c.style.visibility !== "hidden" && getComputedStyle(c).display !== "none").length;
    // 밑에 깔린 상세의 버튼 글자가 같은 자리에 있어서 "N개"가 든 글자만 고른다
    const btn = fig.querySelector('[data-name="btn 가져오기"]'), lab = btn && textOf(btn).find(p => /\d+개/.test(p.textContent));
    if (lab) lab.textContent = lab.textContent.replace(/\d+개/, n + "개");
  }
  // 13판: iOS 파일 고르기에서 '열기' → 파일 화면을 닫고 가져올 곳 시트
  function pickFile({ from }) { const k = from.slice(4); P.back(); P.after(320, () => P.show("C-I-" + k, "sheet")); }
  function importDone({ from }) {
    const lab = textOf(P.SCR[from].fig.querySelector('[data-name="btn 가져오기"]')).find(p => /\d+개/.test(p.textContent)), m = lab && lab.textContent.match(/\d+개/);
    if (from === "C-I-ai") {   // 13판: ai 상세의 '읽을 프로젝트' 칸이 연결 뒤에도 '로그인하면 프로젝트를 골라요' 로 남던 것 → 고른 프로젝트 이름으로
      const fig = P.SCR[from].fig, names = [...fig.querySelectorAll('[data-name^="행 "]')].filter(r => inside(r).some(k => k.dataset.name === "선택됨" && k.style.visibility !== "hidden" && getComputedStyle(k).display !== "none")).map(r => r.dataset.name.slice(2));
      const base = P.stack().length > 1 && P.SCR[P.stack()[P.stack().length - 2].id], hint = base && [...base.fig.querySelectorAll("p")].find(p => /로그인하면 프로젝트를 골라요/.test(p.textContent));
      if (hint && names.length) hint.textContent = names.join(" · ");
    }
    P.back(); toast(m ? (/올리기/.test(lab.textContent) ? `${m[0]} 올렸어요` : /연결/.test(lab.textContent) ? `${m[0]} 연결했어요` : `${m[0]} 가져왔어요`) : "가져왔어요"); P.react("happy");
    if (P.cur() === "OB-3-1") P.after(500, () => connectBack({ to: "OB-3" }));   // 온보딩에서 온 피그마 연결은 온보딩으로
  }
  // 5판: T4 공유 문서의 접힌 칸(고민 중 · 할 일 · AI 규칙) — 누르면 펼친 칸(결정한 이유)과 같은 치수로 본문이 열리고 아래 칸이 내려간다. 다시 누르면 접힘.
  // 본문 글: 와이어프레임 다른 화면에 있는 문장(H6 할 일 · T2 고민 중). (추정) 표시 줄은 와이어프레임에 없어 채운 것 — 여기만 고치면 된다.
  const EXPAND = {
    "카드 · 고민 중": ["• 손에 쥐는 형태인지, 설치형인지", "• 사용 상황을 어떤 3개로 좁힐지"],                         // 2번째 줄 (추정)
    "카드 · 할 일": ["• 사용 상황 3개로 정리 · 10.31", "• 형태 스케치 피그마에 올리기 · 11.2"],
    "카드 · ai가 지킬 것": ["• 지금 결정(정류장 우산)은 바꾸지 않고 제안만 하기", "• 출처가 없는 내용은 기록에 넣지 않기"],   // 두 줄 다 (추정)
  };
  function expand({ from, el }) {
    const s = P.SCR[from], fig = s.fig, key = Object.keys(EXPAND).find(k => el.dataset.name.startsWith(k)); if (!key) return;
    const H0 = 50, Y = (k) => k.offsetTop + (+k.dataset.dy || 0), top = Y(el), chev = (inside(el).map(k => k.querySelector('[data-name="icon chev"]')).find(Boolean) || {}).parentElement;   // 회전은 icon chev 를 감싼 칸에 있다
    let body = fig.querySelector(`.t4body[data-for="${key}"]`), open = !body;
    if (open) {
      body = document.createElement("p"); body.className = "t4body"; body.dataset.for = key; body.textContent = EXPAND[key].join("\n");
      body.style.cssText = `position:absolute;left:${el.offsetLeft + 16}px;top:${top + 46}px;width:${el.offsetWidth - 32}px;font-family:'Pretendard Variable',Pretendard,-apple-system,'Apple SD Gothic Neo',sans-serif;font-size:15px;line-height:23px;font-weight:400;color:#4a4361;white-space:pre-line;opacity:0;transition:opacity .25s`;
      fig.appendChild(body); P.after(30, () => body.style.opacity = "1");
    }
    const dh = open ? 46 + body.offsetHeight + 14 - H0 : -(el.offsetHeight - H0);
    el.style.transition = "height .25s"; el.style.height = (el.offsetHeight + dh) + "px";
    if (chev) chev.style.rotate = open ? "calc(90deg * -1)" : "90deg";
    for (const k of fig.children) {                                     // 이 칸 아래에 있는 것만 (홈 표시줄 제외) 같이 내리고 올린다
      if (k === body || k.dataset.name === "home indicator" || Y(k) < top + H0) continue;
      const y = (+k.dataset.dy || 0) + dh; k.dataset.dy = y; k.style.transition = "transform .25s"; P.nudgeY(k, y);
    }
    if (!open) body.remove();
    const bottom = Math.max(...[...fig.children].filter(k => k.dataset.name !== "home indicator").map(k => Y(k) + k.offsetHeight));
    fig.style.height = Math.max(844, bottom + 40) + "px"; s.el.style.overflowY = bottom + 40 > 844 ? "auto" : "";   // 넘치면 화면 안에서 스크롤
  }
  return { typeAnswer, ask, like, dislike, readAloud, listen, diverge, converge, openSaved, deckResult, deckLeft, throwIdea, drawCards, pickCount, dial, cardTap, removeSaved, search, filterChip, trash, invite, connect, disconnect, restore, typing, pickTag, topicDone, start, connectBack, startRecording, stopRecording, checkTodo, saveEdit, toggleSwitch, removeTag, dropMenu, expand, goHome, copied, shared, openFigma, openConnect, connectDone, toggleRow, importDone, pickFile, feedback };
})();
