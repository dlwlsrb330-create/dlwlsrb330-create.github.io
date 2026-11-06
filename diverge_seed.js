// diverge_seed.js — 발산(D1) 입력: 무엇을 바탕으로(아이디어 · 회의) + 무엇을 물을지(질문, 꼭) → 방식·장 수 시트(D2) → 카드 덱(D4)
//   11-05 진규: 흐름을 '기준 + 질문 → 방식·장 수 → 카드' 로. 질문이 없으면 시트로 안 감
//   11-06 진규: 홈(H1)과 같은 배치로 —
//     · 담은 카드 상자(입력 바 위) → 제목 아래 작은 글 '담은 카드 N · 아카이브 ›' (홈 제목 둘레 보조 글과 같은 13px)
//     · 칩 줄 = 홈 칩 자리(668) · 모양(34 높이, 13px). 내용은 '씨앗(어느 회의인지 헷갈림)' 대신 질문 추천 — 누르면 입력칸이 그 질문으로
//     · + = 담은 아이디어 · 회의 고르기 팝오버(홈 범위 팝오버 모양). 고르면 입력 바에 칩(홈 '전체 ▾' 자리 · 모양)이 붙고 칩 줄 질문이 그에 맞게 바뀜
//   COMET.build · APP5.init 뒤에 돈다(index.html). D1 은 화면 통째로 반전(invert) — 여기서 붙이는 조각은 반전을 한 번 더 걸어 제 색으로
const SEED = (() => {
  const P = COMET, FONT = "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif";
  const MEETS = [["방향 좁히기", "10.27"], ["3차 회의 녹음", "10.27"], ["대상 정하기", "10.15"]];   // 기록 목록(T1)의 가짜 회의
  const eul = (w) => { const ch = w.slice(-1).charCodeAt(0); return ch >= 0xac00 && ch <= 0xd7a3 && (ch - 0xac00) % 28 ? "을" : "를"; };
  const QS = {   // [칩 글, 입력칸에 채울 질문]
    none: (w) => [["다른 사람에게라면?", `‘${w}’${eul(w)} 다른 사람에게 해 본다면?`], ["반대로 뒤집으면?", `‘${w}’${eul(w)} 반대로 뒤집으면?`], ["다른 장소라면?", `‘${w}’${eul(w)} 다른 장소에서 한다면?`], ["더 작게 해 보면?", `‘${w}’${eul(w)} 가장 작게 해 본다면?`]],
    아이디어: (w) => [["다른 상황에 쓴다면?", `‘${w}’${eul(w)} 다른 상황에 쓴다면?`], ["반대로 만든다면?", `‘${w}’${eul(w)} 반대로 만든다면?`], ["누구에게 가장 필요할까?", `‘${w}’ 누구에게 가장 필요할까?`], ["더 작게 만든다면?", `‘${w}’${eul(w)} 더 작게 만든다면?`]],
    회의: (w) => [["못 다룬 방향은?", `‘${w}’에서 못 다룬 방향은?`], ["결정을 뒤집는다면?", `‘${w}’의 결정을 뒤집는다면?`], ["나온 의견을 섞으면?", `‘${w}’에서 나온 의견을 섞으면?`], ["다음에 물어볼 것은?", `‘${w}’ 다음에 물어볼 것은?`]],
  };
  const css = document.createElement("style");
  css.textContent = `
    .seedchip { position: absolute; height: 26px; display: none; align-items: center; gap: 4px; padding: 0 8px 0 10px; border-radius: 9999px; box-sizing: border-box; background: rgba(20,15,36,.05); border: 1px solid rgba(20,15,36,.1); font: 500 12px/1 ${FONT}; color: #1a1626; white-space: nowrap; max-width: 230px; cursor: pointer; user-select: none; }
    .seedchip.set { display: flex; }
    .seedchip .k { color: #6b6484; flex: none; } .seedchip .t { overflow: hidden; text-overflow: ellipsis; min-width: 0; }
    .seedchip .x { flex: none; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #6b6484; }
    .seedrow { position: absolute; left: 0; width: 390px; height: 34px; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; }
    .seedrow::-webkit-scrollbar { display: none; }
    .seedrow .in { position: relative; height: 34px; display: flex; gap: 8px; padding: 0 16px; width: max-content; }
    .seedq { height: 34px; display: flex; align-items: center; padding: 0 14px; border-radius: 9999px; box-sizing: border-box; background: rgba(20,15,36,.05); border: 1px solid rgba(20,15,36,.1); font: 500 13px/1 ${FONT}; color: #1a1626; white-space: nowrap; flex: none; cursor: pointer; user-select: none; }
    .seedarch { position: absolute; left: 0; height: 24px; padding: 0 10px; margin: 0; white-space: nowrap; font: 400 13px/24px ${FONT}; color: #6b6484; cursor: pointer; user-select: none; }
    .scr.on > .fig > .seedarch { pointer-events: auto !important; }   /* 11-06: 발산 화면이 숨어(투명) 있을 땐 눌림을 받지 않게 — 전엔 다른 화면(M2 등)을 눌러도 이 글이 받아 담은 카드로 갔다 */
    .seedpop { position: absolute; left: 16px; width: 280px; padding: 8px; border-radius: 14px; box-sizing: border-box; background: #fff; border: 1px solid rgb(228,224,238); box-shadow: 0 0 40px rgba(20,15,36,.10); font-family: ${FONT}; display: none; }
    .seedpop.on { display: block; }
    .seedpop .h { padding: 8px 10px 4px; font: 500 12px/16px ${FONT}; color: #6b6484; }
    .seedpop .r { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 10px; border-radius: 10px; cursor: pointer; }
    .seedpop .r:hover { background: rgba(20,15,36,.04); }
    .seedpop .r b { flex: 1; min-width: 0; font: 500 15px/20px ${FONT}; color: #1a1626; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .seedpop .r i { flex: none; font: normal 400 12px/16px ${FONT}; color: #6b6484; }
    .seedpop .more { display: block; padding: 8px 10px 6px; font: 500 13px/18px ${FONT}; color: #6b6484; cursor: pointer; }
    .seedd2 { position: absolute; top: 266px; left: 150px; width: 220px; height: 22px; text-align: right; font: 500 12px/22px ${FONT}; color: #6b6484; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .seedgo { position: absolute; top: 42px; height: 24px; padding: 0; font: 500 13px/24px ${FONT}; color: #1a1626; white-space: nowrap; cursor: pointer; user-select: none; }   /* 11-06 진규 3차: 알약(카드 세로 가운데) → 제목 줄 오른쪽 글 단추 (기록 목록 시간 자리 문법) */
    .scr.dark .fig > .seedchip, .scr.dark .fig > .seedrow, .scr.dark .fig > .seedarch, .scr.dark .fig > .seedpop, .seedgo { filter: invert(1) hue-rotate(180deg); }   /* 반전 화면(D1 · D5) 안에서 제 색으로 */`;
  document.head.appendChild(css);

  const D1 = P.SCR.D1, D2 = P.SCR.D2; if (!D1 || !D2) return {};
  const f1 = D1.fig, N = (k, a) => parseFloat(k.style[a]) || 0;
  const byName = (n) => [...f1.children].find(k => (k.dataset.name || "") === n);
  // 제목 = 보이는 글 중 가장 큰 것 ('.d1-title' 은 다이얼이 숨겨 둔 '발산' 글자라 안 됨)
  const topicP = () => [...f1.querySelectorAll(":scope > p")].filter(q => q.textContent.trim() && q.textContent.trim() !== "발산" && getComputedStyle(q).display !== "none" && getComputedStyle(q).visibility !== "hidden").sort((a, b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize))[0];
  const topic = () => (topicP() && topicP().textContent.trim()) || "";
  let base = null, prompt = "", auto = null;   // base: null = 프로젝트 주제, 아니면 { k: '아이디어' | '회의', t: 이름 } · auto = 코드로 채운 질문(손대면 null)

  // 담은 카드 상자 → 제목 아래 작은 글
  //   담고 돌아올 때 빛나는 연출(주형 actions.glowSaved — 이름 '담은 카드' 를 찾음)은 이 글이 받게: 숨긴 상자 이름을 바꾸고 이 글에 그 이름
  [...f1.children].filter(k => /^866:(101|102|103)$/.test(k.dataset.nodeId || "")).forEach(k => { k.style.setProperty("display", "none", "important"); if (k.dataset.name === "담은 카드") k.dataset.name = "담은 카드 상자(숨김)"; });
  // 11-06 진규 2차: 제목 둘레 순서를 홈과 같게 — 위 설명 글(누르지 않음, 홈 318 줄과 같은 글) · 제목 · 아래 담은 카드 글(누름). 설명 글은 템플릿에 있는데 숨겨져 있던 것(comet.css 866:98)을 다시
  const lab = [...f1.children].find(k => k.dataset.nodeId === "866:98"); if (lab) lab.style.setProperty("display", "block", "important");
  const arch = document.createElement("p"); arch.className = "seedarch"; arch.dataset.seed = "arch"; arch.dataset.name = "담은 카드"; f1.appendChild(arch);
  const placeArch = () => { const t = topicP(); arch.style.top = `${t ? N(t, "top") + (t.offsetHeight || 34) + 6 : 422}px`; if (arch.offsetWidth) arch.style.left = `${(390 - arch.offsetWidth) / 2}px`; arch.textContent = `담은 카드 ${APP5.savedCount()} · 아카이브 ›`; if (arch.offsetWidth) arch.style.left = `${(390 - arch.offsetWidth) / 2}px`; };

  // 입력 바 둘째 줄 칩(홈 '전체 ▾' 자리) — 고른 아이디어 · 회의
  const chip = document.createElement("div"); chip.className = "seedchip"; chip.dataset.seed = "base";
  chip.innerHTML = `<span class="k"></span><span class="t"></span><span class="x" data-seed="clear">✕</span>`;
  Object.assign(chip.style, { left: "62px", top: "764px" }); f1.appendChild(chip);

  // 질문 칩 줄 — 홈 칩 줄 자리
  const row = document.createElement("div"); row.className = "seedrow"; row.style.top = "668px"; row.innerHTML = `<div class="in"></div>`; f1.appendChild(row);

  // + 팝오버 — 담은 아이디어 · 회의
  const pop = document.createElement("div"); pop.className = "seedpop"; f1.appendChild(pop);
  const bar = byName("입력 바"), plus = byName("btn 첨부");
  const fillPop = () => {
    const ideas = (APP5.saved ? APP5.saved() : []).slice(0, 3);
    pop.innerHTML = (ideas.length ? `<div class="h">담은 아이디어</div>` + ideas.map(c => `<div class="r" data-seed="pick" data-k="아이디어" data-t="${c.title}"><b>${c.title}</b><i>${c.pinned ? "고정" : ""}</i></div>`).join("") : "")
      + `<div class="h">회의</div>` + MEETS.map(([t, m]) => `<div class="r" data-seed="pick" data-k="회의" data-t="${t}"><b>${t}</b><i>${m}</i></div>`).join("")
      + `<div class="more" data-seed="all">담은 카드 모두 보기 ›</div>`;
    pop.style.top = "0px"; pop.classList.add("on"); pop.style.top = `${(bar ? N(bar, "top") : 718) - 10 - pop.offsetHeight}px`; };
  const closePop = () => pop.classList.remove("on");

  // ② 시트(D2) 제목 줄 오른쪽: 질문. D2 는 조각마다 반전이 걸려 있어 이 줄만 반전 끔(제 색)
  const d2 = document.createElement("p"); d2.className = "seedd2 sheetpart"; d2.style.margin = "0"; D2.fig.appendChild(d2); d2.style.setProperty("filter", "none", "important");

  const inp = f1.querySelector(".app5-in"); if (inp) inp.placeholder = "어떤 아이디어를 생각해 볼까?";   // 홈 안내 글("저번 회의 어떻게 끝났더라?")과 같은 사용자 혼잣말 반말
  const qs = () => (base ? QS[base.k] : QS.none)(base ? base.t : topic());
  const paint = () => {
    chip.classList.toggle("set", !!base); if (base) { chip.querySelector(".k").textContent = base.k; chip.querySelector(".t").textContent = base.t; }
    row.firstChild.innerHTML = qs().map(([l, q], i) => `<div class="seedq" data-seed="q" data-i="${i}">${l}</div>`).join("");
    d2.textContent = prompt || `기준 · ${base ? base.t : topic()}`; placeArch(); };
  const fill = (q) => { if (!inp) return; inp.value = q; prompt = q; auto = q; inp.dispatchEvent(new Event("input", { bubbles: true })); auto = q; paint(); };
  const need = () => { if (prompt) return true; if (inp) inp.focus(); P.react && P.react("shake"); return false; };
  const open = () => { if (!need()) return; paint(); P.show("D2", "sheet"); };
  const set = (b) => { const mine = prompt && prompt !== auto; base = b; closePop();
    if (!mine) { if (b) fill(qs()[0][1]); else { if (inp) { inp.value = ""; inp.dispatchEvent(new Event("input", { bubbles: true })); } prompt = ""; auto = null; } }
    paint(); P.react && P.react("happy"); };

  // 입력 바 Enter(주형 11-06: 보내기 단추도 Enter 와 같음) = 시트로 — 입력칸보다 먼저 받음
  f1.addEventListener("keydown", (e) => { if (e.target !== inp || e.key !== "Enter" || e.isComposing) return; e.preventDefault(); e.stopPropagation(); prompt = inp.value.trim(); if (prompt) inp.blur(); open(); }, true);
  if (inp) inp.addEventListener("input", () => { prompt = inp.value.trim(); if (prompt !== auto) auto = null; d2.textContent = prompt || `기준 · ${base ? base.t : topic()}`; });

  // 누르기: 앱의 누르기 처리(router, phone 캡처)보다 먼저 받는다
  const inRect = (el, x, y) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
  const pick = (ev) => {
    const t = ev.target.closest && ev.target.closest("[data-seed], .seedgo");
    if (t && t.closest(".scr.on")) return t;   // 숨은 화면의 부품은 안 받음
    if (P.cur() === "D1" && inRect(plus, ev.clientX, ev.clientY)) return plus;
    if (P.cur() === "D1" && pop.classList.contains("on")) return pop;   // 팝오버 밖을 누르면 닫기만
    return null; };
  // 11-06 주형: 칩 줄을 가로로 끌어 넘기기 — 5px 넘게 끌면 칩 누르기로 치지 않음
  let drag = null;
  row.style.cursor = "grab"; row.style.touchAction = "pan-x";
  window.addEventListener("pointerdown", (ev) => { if (P.cur() === "D1" && row.contains(ev.target)) { drag = { x: ev.clientX, s: row.scrollLeft, moved: false }; row.style.cursor = "grabbing"; } }, true);
  window.addEventListener("pointermove", (ev) => { if (!drag) return; const dx = ev.clientX - drag.x; if (Math.abs(dx) > 5) drag.moved = true; if (drag.moved) { row.scrollLeft = drag.s - dx; ev.preventDefault(); } }, true);
  window.addEventListener("pointerup", () => { if (!drag) return; row.style.cursor = "grab"; const d = drag; setTimeout(() => { if (drag === d) drag = null; }, 0); }, true);
  window.addEventListener("click", (ev) => { if (drag && drag.moved && row.contains(ev.target)) { ev.stopImmediatePropagation(); ev.preventDefault(); drag = null; } }, true);
  window.addEventListener("pointerdown", (ev) => { if (pick(ev)) ev.stopPropagation(); }, true);
  window.addEventListener("click", (ev) => {
    const t = pick(ev); if (!t) return; ev.stopPropagation(); ev.preventDefault();
    if (t === plus) { pop.classList.contains("on") ? closePop() : fillPop(); return; }
    if (t === pop) { closePop(); return; }
    if (t.classList.contains("seedgo")) { set({ k: "아이디어", t: t.dataset.t }); P.back(); return; }   // 담은 카드 줄 '펼치기 ›'
    const s = t.dataset.seed;
    if (s === "q") { fill(qs()[+t.dataset.i][1]); if (inp) inp.focus(); }
    else if (s === "pick") set({ k: t.dataset.k, t: t.dataset.t });
    else if (s === "clear") set(null);
    else if (s === "all" || s === "arch") { closePop(); ACTIONS.openSaved({ from: "D1" }); }
    else if (s === "base") fillPop();
  }, true);
  // 발산 화면이 보일 때 담은 카드 수 · 자리 새로, 떠날 때 팝오버 닫기
  new MutationObserver(() => { if (D1.el.classList.contains("on")) requestAnimationFrame(placeArch); else closePop(); }).observe(D1.el, { attributes: true, attributeFilter: ["class"] });

  // 담은 카드(D5) 줄마다 '발산하기' — app5 row() 가 줄을 그릴 때 부름. 11-06 진규: '펼치기 ›' 작은 글 → 휴지통 '되살리기' 와 같은 알약 단추, 카드 세로 가운데 · 오른쪽 안쪽 12
  function rowGo(c, layer) { const g = document.createElement("div"); g.className = "seedgo"; g.dataset.t = c.title; g.textContent = "발산하기 ›"; g.style.right = "32px"; /* 카드 오른쪽(374)에서 16 안쪽 · 설명 줄(46~61)과 같은 가운데 */ layer.appendChild(g); }

  //   바둑판 보기: 카드 아래쪽에 꽉 찬 단추 (app5 renderSaved 바둑판이 부름)
  function gridGo(c, box, x, y, w) { const g = document.createElement("div"); g.className = "seedgo"; g.dataset.t = c.title; g.textContent = "발산하기 ›"; Object.assign(g.style, { left: `${x}px`, top: `${y + 8}px` }); box.appendChild(g); }   // 바둑판: 카드 왼쪽 아래(안쪽 14)

  paint(); requestAnimationFrame(paint);
  return { rowGo, gridGo, get: () => ({ base, topic: topic(), prompt }), set };
})();
