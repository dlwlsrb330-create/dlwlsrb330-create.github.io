// tutor.js — 발산 튜토리얼 (티즈판, 11-04). 온보딩을 끝까지 마치고(주제 → 팀원 초대 → 연결 → 시작하기) 홈(H1)에 처음 왔을 때 딱 한 번.
// 홈의 다른 UI 는 전부 가리고(홈 바탕색 한 장, 비네팅 없음) 코멧 마스코트만 남긴다.
// 마스코트가 직접 말풍선으로 "날 눌러봐!" 하고 → 말풍선이 들어가면 꿀렁(발산 티즈: 슬라임 분화를 여섯 갈래까지 갔다가 되감기) → 다시 말풍선 … 반복.
// 마스코트를 누르면 원래대로 발산(router 의 마스코트 탭)이 일어나고 튜토리얼은 사라진다. 다시 안 뜬다(이 세션 동안).
// 티즈 자체는 launch2_director.js 의 __m.tease / teaseU, 길이·지점은 mascot.js HINT.tease.
const TUTOR = (() => {
  const C = { x: 194.5, y: 229.5,                 // 마스코트 중심 (홈 로고 자리 = 발산 화면과 같은 자리라 누른 뒤 자리가 안 튐)
              bg: "#f7f6fa",                      // 홈(H1) 바탕색
              say: "날 눌러봐!", sayLen: 1.5,      // 말풍선 글 · 떠 있는 시간(초)
              gap: .35, firstDelay: .5 };         // 말풍선이 들어간 뒤 꿀렁까지 · 화면이 뜬 뒤 첫 말풍선까지
  let el = null, bubble = null, open = false, done = false, timer = null, prev = null;

  function build() {
    el = document.createElement("div"); el.id = "tutor";
    el.innerHTML = `<div class="tu-say" role="status"><span>${C.say}</span></div>`;
    $("phone").appendChild(el); bubble = el.querySelector(".tu-say");
    const st = document.createElement("style");
    st.textContent = `
#tutor { position: absolute; inset: 0; z-index: 1; background: ${C.bg}; pointer-events: auto; opacity: 0; visibility: hidden; transition: opacity .35s ease, visibility 0s .35s; }   /* 화면(.scr z1) 위 · 마스코트(#stage z2) 아래 → 홈 UI 는 가리고 마스코트는 그대로 눌림 */
#tutor.on { opacity: 1; visibility: visible; transition: opacity .35s ease; }
/* 말풍선: 마스코트 머리 위에서 마스코트 쪽으로 꼬리 */
#tutor .tu-say { position: absolute; left: ${C.x}px; top: ${C.y - 60 - 18}px; transform-origin: 50% 100%; transform: translate(-50%, -100%) scale(.6); opacity: 0;
  transition: transform .32s cubic-bezier(.34, 1.56, .64, 1), opacity .18s ease; }
#tutor .tu-say.on { transform: translate(-50%, -100%) scale(1); opacity: 1; }
#tutor .tu-say span { display: block; position: relative; padding: 10px 16px; border-radius: 18px; background: #1a1626; color: #fff; font: 600 16px/1.2 "Pretendard Variable", Pretendard, -apple-system, "Noto Sans KR", sans-serif; letter-spacing: -.01em; white-space: nowrap; }
#tutor .tu-say span::after { content: ""; position: absolute; left: 50%; bottom: -7px; width: 14px; height: 14px; margin-left: -7px; background: #1a1626; border-radius: 0 0 4px 0; transform: rotate(45deg); }`;
    document.head.appendChild(st);
  }
  function say(on) { if (bubble) bubble.classList.toggle("on", on); }
  function loop() {   // 말풍선 → 들어감 → 꿀렁(티즈) → 말풍선 … (열려 있는 동안)
    if (!open) return;
    if (COMET.isDarkOn()) { stopLoop(); celebrate(); return; }
    say(true);
    timer = setTimeout(() => {
      if (!open) return; say(false);
      timer = setTimeout(() => {
        if (!open) return; __m.tease(performance.now() / 1000);
        timer = setTimeout(loop, (HINT.tease.len + .15) * 1000);
      }, C.gap * 1000);
    }, C.sayLen * 1000);
  }
  function show() {
    if (!el) build();
    open = true; done = true; el.classList.add("on"); say(false);
    clearTimeout(timer); timer = setTimeout(loop, C.firstDelay * 1000);
  }
  function close() { open = false; clearTimeout(timer); say(false); if (el) el.classList.remove("on"); }
  // 13판(11-04 시연): 튜토리얼에서 마스코트를 눌러 처음 발산하면 '끝났다' 신호. 한 번만.
  // ① 누른 뒤에도 바탕(#tutor)을 걷지 않고(걷으면 사라지는 중인 홈 UI 가 비쳤음) 발산 화면(D1) 내용도 감춰서 슬라임 + 한마디만
  // ② 한마디가 내려가면 발산 화면 내용이 나타나고 아래 UI(담은 카드 줄 · 입력창)는 아래에서 올라옴.
  // 피그마 조각은 transform·translate 로 크기·가운데를 잡고 있어서, 감추기는 D1 화면 통째(fig) 투명도로, 올라오기는 margin-top 으로만
  const DONE = { at: 1700, hold: 2400, top: 470, rise: 200, riseMs: 450, line1: "재밌는 아이디어를 줄게", line2: "많이 만들어 봐!" };
  let celebrated = false, reveal = null;
  function stopLoop() { open = false; clearTimeout(timer); say(false); }   // 말풍선 반복만 멈춤 (바탕은 그대로)
  function celebrate() {
    const D = typeof COMET !== "undefined" && COMET.SCR && COMET.SCR.D1 && COMET.SCR.D1.fig; if (celebrated || !D) return; celebrated = true;
    if (!el) build(); el.classList.add("on");
    const OUT = "cubic-bezier(.4,0,.2,1)", IN = "cubic-bezier(.2,.8,.2,1)";
    const hold = D.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 60000 });   // 드러낼 때까지 D1 내용 감춤
    const parts = [...D.children].filter(k => (parseFloat(k.style.top) || 0) >= 540 && k.dataset.name !== "home indicator");
    const msg = document.createElement("div"); msg.id = "tuDone"; msg.setAttribute("role", "status");
    msg.innerHTML = `<b>${DONE.line1}</b><span>${DONE.line2}</span>`;
    msg.style.cssText = `position:absolute;left:0;right:0;top:${DONE.top}px;z-index:7;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;opacity:0;font-family:"Pretendard Variable",Pretendard,-apple-system,"Noto Sans KR",sans-serif;letter-spacing:-.01em`;
    msg.querySelector("b").style.cssText = "font-size:22px;font-weight:700;color:#1a1626";
    msg.querySelector("span").style.cssText = "font-size:16px;font-weight:500;color:#6b6484";
    $("phone").appendChild(msg);
    msg.animate([{ opacity: 0, translate: "0 24px" }, { opacity: 1, translate: "0 0" }], { duration: 420, delay: DONE.at, easing: IN, fill: "forwards" });
    let t = setTimeout(() => reveal(), DONE.at + 420 + DONE.hold);
    reveal = () => {   // 한마디가 내려가고 → 발산 화면 내용이 나타나며 아래 UI 가 올라옴 → 바탕 걷음
      reveal = null; clearTimeout(t);
      msg.animate([{ opacity: +getComputedStyle(msg).opacity, translate: "0 0" }, { opacity: 0, translate: "0 16px" }], { duration: 280, easing: OUT, fill: "forwards" });
      setTimeout(() => {
        hold.cancel(); D.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: IN });
        const ups = parts.map(k => k.animate([{ marginTop: DONE.rise + "px" }, { marginTop: "0px" }], { duration: DONE.riseMs, easing: IN }));
        el.classList.remove("on");
        setTimeout(() => { ups.forEach(a => a.cancel()); msg.remove(); }, DONE.riseMs + 50);
      }, 200);
    };
  }
  // 화면이 바뀌는 걸 지켜보다가: 온보딩 마지막(OB-3) → 홈(H1) 으로 넘어온 순간 연다. 다른 화면으로 가거나 발산하면 닫는다
  let jumpAdded = false;
  function addJump() {   // 검토용: 왼쪽 화면 목록에 바로 여는 단추
    const j = $("jump"); if (!j || j.children.length < 2) return;
    const b = document.createElement("button"); b.textContent = "★ TU 발산 튜토리얼";
    b.onclick = () => { if (COMET.isDarkOn()) return; COMET.show("H1", "jump"); prev = "H1"; done = false; show(); };
    j.insertBefore(b, j.children[1]); jumpAdded = true;
    const b2 = document.createElement("button"); b2.textContent = "★ TU 끝 신호";   // 13판 검토용: 튜토리얼 끝 장면(발산 → 아래 UI 밀고 한마디)만 바로
    b2.onclick = () => { if (COMET.isDarkOn()) return; COMET.show("H1", "jump"); prev = "H1"; done = true; stopLoop(); if (!el) build(); el.classList.add("on"); celebrated = false; setTimeout(() => { ACTIONS.diverge(); celebrate(); }, 400); };
    b.after(b2);
  }
  (function watch() {
    if (!jumpAdded) addJump();
    if (typeof COMET !== "undefined" && COMET.cur) {
      const cur = COMET.cur();
      if (cur !== prev) {
        if (!done && cur === "H1" && prev === "OB-3") show();   // 온보딩을 끝까지 마치고 홈에 온 순간만. 건너뛰기(→ OB-4)로 온 건 아님
        else if (open && cur !== "H1") close();
        prev = cur;
      }
      if (open && COMET.isDarkOn()) { stopLoop(); celebrate(); }   // 13판: 튜토리얼에서 눌러 발산하면 끝 신호 (바탕은 celebrate 가 걷음)
      if (reveal && !COMET.isDarkOn()) reveal();   // 끝 신호 도중 다시 눌러 수렴하면 바로 드러냄
    }
    requestAnimationFrame(watch);
  })();
  return { show, close, celebrate, reset: () => { done = false; celebrated = false; } };
})();
