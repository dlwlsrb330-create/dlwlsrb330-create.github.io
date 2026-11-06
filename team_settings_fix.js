// team_settings_fix.js — 11-06 진규 (아이폰 실기기 검토에서 나온 것). router.js 가 화면 목록(SCREENS · FLOW)을 읽기 전에, 템플릿 안 조각만 고친다.
//   ① 팀(M2): 머리글 단추 아래 끝(96)과 바로 밑 칸(100)이 4px 붙어 있었음 → 머리글 아래 전부 12px 내려 16px 띄움.
//      맨 위 '이름이나 이메일 | 수정 가능 ▾' 칸은 입력칸처럼 보이는데 실제로는 누르면 팀원 초대 시트(M2-2)가 뜨고, 그 시트 안에 같은 입력칸이 또 있어 깊이가 뒤집혀 보였음
//      → 팀 화면의 그 칸은 '팀원 초대 ›' 줄로 (입력칸은 시트 안에만). 연결(flow.js '초대 입력칸' → M2-2)은 그대로.
//   ② 알림(S1) · 연결 상세(M3-D) · OB-3-1 토글: 꺼진 토글만 손잡이가 진한 색이라 다른 토글과 달라 보였음 → 손잡이는 늘 흰색(iOS 와 같게), 옅은 그림자
//   ③ 설정(S0)의 '화면 모드'와 '글자 크기'가 둘 다 같은 화면(S2 화면 · 글자)으로 갔음 → 각각 제 화면(S2-M 화면 모드 · S2-F 글자 크기)으로. S2 는 그대로 둠(검토 목록에 남음)
(() => {
  const N = (k, a) => parseFloat(k.style[a]) || 0;
  const tpl = (id) => { const t = document.getElementById("tpl-" + id); return t && t.content.querySelector(".fig"); };

  // ---------- ① 팀 ----------
  (() => {
    const f = tpl("M2"); if (!f) return;
    for (const k of f.children) { const t = N(k, "top"); if (t >= 96 && t < 820) k.style.top = (t + 12) + "px"; }   // 머리글(44~96) 아래 전부, 홈 표시줄(836)은 그대로
    const box = f.querySelector('[data-name="초대 입력칸"]'), icon = f.querySelector('[data-name="icon search"]'), line = f.querySelector('[data-name="구분선"]');
    const ps = [...f.querySelectorAll(":scope > p")], ph = ps.find(p => p.textContent.trim() === "이름이나 이메일"), perm = ps.find(p => /^수정 가능/.test(p.textContent.trim()) && N(p, "top") < 160);
    if (!box || !ph) return;
    // 11-06 진규 2차: 맨 위 '팀원 초대' 칸도 없앰 → 멤버 목록 맨 아래에 점선 '+ 팀원 초대' 줄(녹음 확인 R1 '외부 참여자 추가' 줄과 같은 모양). 링크 줄 위 '초대' 제목 글자 뺌
    //   상자(초대 입력칸)를 그 줄로 다시 씀 — 연결(flow.js '초대 입력칸' → M2-2 팀원 초대 시트)은 그대로
    if (icon) icon.style.display = "none"; if (line) line.style.display = "none"; if (perm) perm.style.display = "none";
    const kids = [...f.children], label = ps.find(p => /^멤버 \d/.test(p.textContent.trim()));
    const up = label ? N(label, "top") - 112 : 0;   // '멤버 3' 을 머리글 아래 16 자리(112)로
    const band = (k) => k !== box && k !== ph && N(k, "top") >= 160 && N(k, "top") < 380;   // 멤버 글 · 줄들(12 내린 뒤 값)
    kids.filter(band).forEach(k => { k.style.top = (N(k, "top") - up) + "px"; });
    const lines = kids.filter(k => k.dataset.name === "line" && band(k)), last = lines.sort((x, y) => N(y, "top") - N(x, "top"))[0];
    if (last) last.style.display = "none";
    // 권한 글자 셋을 같은 꼴로: '전체 권한'만 ▾ 없이 회색 · 400 이라 글자 끝이 다른 줄 ▾ 와 어긋났음 → 같은 13px · 500 · 진한 색 · ▾ (누르면 권한 시트, flow.js text:전체 권한)
    const ref0 = ps.find(p => /▾/.test(p.textContent) && N(p, "left") === 366), own = ps.find(p => p.textContent.trim() === "전체 권한" && N(p, "left") === 366);
    // 11-06 진규 3차: 내 줄(팀장)은 바꿀 수 없음 → ▾ 없이 회색, 누르지 않음(flow.js 에서 뺌). 글꼴 · 굵기 · 오른쪽 끝은 다른 권한 글자와 같게
    if (ref0 && own) { const t = own.style.top; own.style.cssText = ref0.style.cssText; own.style.top = t; own.style.color = "#6b6484"; own.textContent = "전체 권한"; }
    const T = last ? N(last, "top") + 8 : 315, H = 52;
    Object.assign(box.style, { top: T + "px", height: H + "px", backgroundColor: "transparent", border: "1px dashed rgb(207, 201, 222)", borderRadius: "12px", boxSizing: "border-box" });
    Object.assign(ph.style, { top: T + "px", left: "66px", lineHeight: H + "px", fontSize: "15px", fontWeight: "400", color: "rgb(74, 67, 97)" }); ph.textContent = "팀원 초대";
    const plus = tpl("R1") && tpl("R1").querySelector('[data-name="슬롯 외부 참여자 추가"]');
    const pic = plus && [...plus.parentElement.children].find(k => k.dataset.name === "icon" && Math.abs(N(k, "top") - N(plus, "top") - 14) < 2);
    if (pic) { const c = pic.cloneNode(true); c.removeAttribute("data-node-id"); c.style.top = (T + 14) + "px"; c.style.left = "32px"; box.after(c); }
    // 아래 칸(섹션 구분 · 링크 줄 · 설명)은 새 줄 밑 16 에서 시작. '초대' 제목은 숨김
    const head = ps.find(p => p.textContent.trim() === "초대"); if (head) head.style.display = "none";
    const sec = kids.find(k => k.dataset.name === "섹션 구분"), link = kids.find(k => k.dataset.name === "일반 접근 줄");
    if (sec && link) {
      const s0 = N(sec, "top"), s1 = T + H + 16, d1 = s1 - s0, l0 = N(link, "top"), d2 = (s1 + 8 + 16) - l0;
      sec.style.top = s1 + "px";
      const ch = kids.find(k => k.dataset.name === "icon chev" && N(k, "top") > l0 && N(k, "top") < l0 + N(link, "height")); if (ch) ch.style.display = "none";   // 한 줄에 ▾ 와 › 둘 → ▾ 만 (누르면 권한 시트)
      // 링크 줄 권한도 멤버 줄처럼 오른쪽 끝(366)에 같은 글꼴로, 제목은 줄 가운데 한 줄 (전엔 제목 아래 왼쪽이라 위 목록과 자리가 달랐음)
      const L = N(link, "top"), C = L + N(link, "height") / 2, ttl = ps.find(p => p.textContent.trim() === "링크가 있으면 누구나");
      const lp = ps.find(p => /▾/.test(p.textContent) && N(p, "top") > L && N(p, "top") < L + N(link, "height"));
      if (ttl) Object.assign(ttl.style, { top: (C - 9) + "px", fontWeight: "500", lineHeight: "18px" });
      if (lp) { const ref = ps.find(p => /▾/.test(p.textContent) && N(p, "left") === 366); if (ref) { lp.style.cssText = ref.style.cssText; } lp.style.top = (C - 9) + "px"; lp.style.lineHeight = "18px"; }
      kids.filter(k => k !== sec && k !== head && N(k, "top") >= l0 && N(k, "top") < 820).forEach(k => { k.style.top = (N(k, "top") + d2) + "px"; });
    }
  })();

  // ---------- ①-2 팀원 초대 시트(M2-2) '완료' 뺌 — 닫기만 하는 단추였음(✕ · 바깥 누르기 · 끌어 내리기로 이미 닫힘) ----------
  (() => {
    const f = tpl("M2-2"); if (!f) return; const b = f.querySelector('[data-name="btn 완료"]'); if (!b) return; const T = N(b, "top");
    b.style.display = "none"; [...f.querySelectorAll(":scope > p")].filter(p => p.textContent.trim() === "완료" && Math.abs(N(p, "top") - T) < 40).forEach(p => p.style.display = "none");
    // '보냄'(이미 초대한 사람)이 글자만 오른쪽 끝에 붙어 위 '초대' 알약과 가운데 · 높이가 안 맞았음 → 같은 자리 · 같은 크기 알약, 옅은 바탕 · 회색 글(눌리지 않는 상태)
    const pills = [...f.querySelectorAll('[data-name="btn 초대"]')].sort((x, y) => N(x, "top") - N(y, "top")), sent = [...f.querySelectorAll(":scope > p")].find(p => p.textContent.trim() === "보냄");
    if (pills.length >= 2 && sent) { const a = pills[pills.length - 1], step = N(a, "top") - N(pills[pills.length - 2], "top");
      Object.assign(sent.style, { top: (N(a, "top") + step) + "px", left: a.style.left, width: a.style.width, height: a.style.height, lineHeight: a.style.height, translate: "none", textAlign: "center", borderRadius: "9999px", backgroundColor: "#EFEDF5", color: "#6b6484", fontWeight: "500" }); }
  })();

  // ---------- ② 토글 손잡이 ----------
  for (const id of ["S1", "M3-D", "OB-3-1"]) {
    const f = tpl(id); if (!f) continue;
    f.querySelectorAll('[data-name="knob"]').forEach(k => { k.style.filter = "brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,.22))"; });
  }

  // ---------- ③ 화면 모드 · 글자 크기 ----------
  (() => {
    const src = document.getElementById("tpl-S2"); if (!src || typeof SCREENS === "undefined" || typeof FLOW === "undefined") return;
    const make = (id, title, keepMode, keepFont) => {
      const t = document.createElement("template"); t.id = "tpl-" + id; t.innerHTML = src.innerHTML; const f = t.content.querySelector(".fig");
      f.dataset.screen = id; f.dataset.name = id + "_" + title;
      const kids = [...f.children], hid = (k) => k.style.display = "none";
      for (const k of kids) {
        const top = N(k, "top");
        if (k.tagName === "P" && top === 52) { k.textContent = title; continue; }   // 머리글 제목
        if (top >= 104 && top < 188) { if (!keepMode) hid(k); continue; }           // 화면 모드 (라벨 104 · 세그먼트 128~164)
        if (top >= 188 && top < 272) { if (!keepFont) hid(k); else k.style.top = (top - 84) + "px"; continue; }   // 글자 크기 → 화면 모드 자리로
        if (top >= 272 && top < 416) { k.style.top = (top - 84) + "px"; continue; }   // 미리보기: 한 묶음 위로
        if (top >= 416 && top < 820) { if (!keepFont) hid(k); else k.style.top = (top - 84) + "px"; }   // 날짜 형식은 글자 크기 화면에만
      }
      src.after(t);
    };
    make("S2-M", "화면 모드", true, false);
    make("S2-F", "글자 크기", false, true);
    SCREENS.labels["S2-M"] = "S2-M 화면 모드"; SCREENS.labels["S2-F"] = "S2-F 글자 크기";
    for (const row of FLOW) { if (row[0] === "S0" && row[1] === "text=화면 모드") row[2] = "S2-M"; if (row[0] === "S0" && row[1] === "text=글자 크기") row[2] = "S2-F"; }
    FLOW.push(["S2-M", "btn 뒤로", "", "back"], ["S2-F", "btn 뒤로", "", "back"]);
    if (typeof MASCOT !== "undefined" && MASCOT.S2) { MASCOT["S2-M"] = MASCOT.S2; MASCOT["S2-F"] = MASCOT.S2; }
  })();
})();
