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
    // '김민지' 아바타 글자: 템플릿 글자는 '민' → '김' (이름 첫 글자, 다른 줄 '인' · 'C' 와 같게)
    const kimL = [...f.querySelectorAll(":scope > p")].find(p => p.textContent.trim() === "민" && N(p, "left") === 42); if (kimL) kimL.textContent = "김";
    b.style.display = "none"; [...f.querySelectorAll(":scope > p")].filter(p => p.textContent.trim() === "완료" && Math.abs(N(p, "top") - T) < 40).forEach(p => p.style.display = "none");
    // '보냄'(이미 초대한 사람)이 글자만 오른쪽 끝에 붙어 위 '초대' 알약과 가운데 · 높이가 안 맞았음 → 같은 자리 · 같은 크기 알약, 옅은 바탕 · 회색 글(눌리지 않는 상태)
    const pills = [...f.querySelectorAll('[data-name="btn 초대"]')].sort((x, y) => N(x, "top") - N(y, "top")), sent = [...f.querySelectorAll(":scope > p")].find(p => p.textContent.trim() === "보냄");
    if (pills.length >= 2 && sent) { const a = pills[pills.length - 1], step = N(a, "top") - N(pills[pills.length - 2], "top");
      Object.assign(sent.style, { top: (N(a, "top") + step) + "px", left: a.style.left, width: a.style.width, height: a.style.height, lineHeight: a.style.height, translate: "none", textAlign: "center", borderRadius: "9999px", backgroundColor: "#EFEDF5", color: "#6b6484", fontWeight: "500" }); }
  })();

  // ---------- ② 토글 손잡이 ----------
  //   11-06 진규: 세 화면만 고쳐서 자료 · ai 연결 상세 · 녹음 확인 · 연결 시트 등 26 화면은 꺼진 손잡이가 아직 진했음 → 토글 있는 모든 화면
  document.querySelectorAll("template").forEach(t => {
    t.content.querySelectorAll('[data-name="knob"]').forEach(k => { k.style.filter = "brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,.22))"; });
  });

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

  // ---------- ④ 11-06 진규: 연결 · 팀 · 휴지통 — 머리글 아래 첫 묶음 제목은 팀 화면 '멤버 3' 과 같게 (머리글 아래 끝 96 + 16 = 112, 13px · 500 · #6b6484) ----------
  const LABEL = (p) => Object.assign(p.style, { fontSize: "13px", fontWeight: "500", color: "#6b6484" });
  const shift = (f, from, to, dy) => [...f.children].forEach(k => { const t = N(k, "top"); if (t >= from && t < to) k.style.top = (t + dy) + "px"; });
  const P_ = (f, re) => [...f.querySelectorAll(":scope > p")].find(p => re.test(p.textContent.trim()));
  (() => {   // ai 연결(M4-A): 위 설명 글 뺌, '연결됨 2' 앞 점 뺌 → 제목을 112 로, 아래 전부 같이 올림
    const f = tpl("M4-A"); if (!f) return; const d = P_(f, /^쓰던 ai/), lab = P_(f, /^연결됨 \d/), dot = f.querySelector('[data-name="상태 점"]'); if (!lab) return;
    if (d) d.style.display = "none"; if (dot) dot.style.display = "none";
    const dy = 112 - N(lab, "top"); shift(f, N(lab, "top") - 6, 820, dy); lab.style.left = "24px"; LABEL(lab);
  })();
  (() => {   // 자료 연결(M3-C): '연결됨' 이 머리글에 4px 붙어 있었음 → 112, '더 연결하기' 와 같은 꼴
    const f = tpl("M3-C"); if (!f) return; const lab = P_(f, /^연결됨$/); if (!lab) return;
    shift(f, N(lab, "top"), 820, 112 - N(lab, "top")); LABEL(lab); const more = P_(f, /^더 연결하기$/); if (more) LABEL(more);
  })();
  (() => {   // 팀(M2): 오른쪽 위 … 단추 뺌 (권한은 줄마다 바꿈)
    const f = tpl("M2"); if (!f) return; f.querySelectorAll('[data-name="btn more"], [data-name="icon more"]').forEach(k => k.style.display = "none");
  })();
  (() => {   // 휴지통(M5): 위 설명 글을 목록 아래 옅은 글로, 목록은 112 부터
    const f = tpl("M5"); if (!f) return; const d = P_(f, /^30일이 지나면/), first = P_(f, /만든 기록$/); if (!d || !first) return;
    const dy = 112 - N(first, "top"); shift(f, N(d, "top") + 4, 760, dy);
    const groups = [...f.children].filter(k => /^휴지통 그룹/.test(k.dataset.name || "")), last = groups.sort((a, b) => N(b, "top") - N(a, "top"))[0];
    const ds = [...f.querySelectorAll(":scope > p")].filter(p => /^30일이 지나면/.test(p.textContent.trim()));   // 템플릿에 같은 글이 두 벌
    ds.forEach(d => Object.assign(d.style, { top: (last ? N(last, "top") + N(last, "height") + 12 : 492) + "px", fontSize: "12px", fontWeight: "400", color: "#6b6484" }));
  })();
  // 연결 상세 화면들(자료 · ai): 내용이 머리글 아래 끝 96 에 바로 붙어 있었음 → 16 띄워 112 부터. 아래 끝 단추(760)는 그대로
  for (const id of ["M3-D", "M3-N", "M3-G", "M3-K", "M3-L", "M3-MD", "M3-SL", "M4-GPT", "M4-CL", "M4-GE", "M4-PX", "M4-CP"]) { const f = tpl(id); if (f) shift(f, 90, 740, 16); }

  // ---------- ⑤ 11-06 진규: 관리 · 연결 · 휴지통 · 설정 화면 간격 · 글자 꼴 한 규칙으로 ----------
  //   묶음 제목 = 13px · 500 · #6b6484 (왼쪽 24). 제목 위 끝 → 묶음 위 끝 24, 묶음 아래 끝 → 다음 제목 위 끝 24. 첫 제목(또는 첫 내용)은 112.
  //   줄 제목 15px · 500 · #1a1626, 상태 · 단추 글자 13px · 500, '연결 끊기'는 빨강 #d42a1a. 아래 끝 단추(760~)와 홈 표시줄은 그대로
  const FLOWED = ["M2", "M3-C", "M3-D", "M3-N", "M3-G", "M3-K", "M3-L", "M3-MD", "M3-SL", "M4-A", "M4-GPT", "M4-CL", "M4-GE", "M4-PX", "M4-CP", "M5", "S0", "S1", "OB-3-1"];
  const vis = (k) => k.style.display !== "none" && !k.dataset.sb;
  const fs = (k) => parseFloat(k.style.fontSize) || 0, fw = (k) => String(k.style.fontWeight || "");
  const H = (k) => { const h = N(k, "height"); if (h) return h; const lh = parseFloat(k.style.lineHeight); return lh || Math.round((fs(k) || 14) * 1.25); };
  const isLabel = (k) => k.tagName === "P" && N(k, "left") === 24 && fs(k) === 13 && /500|700/.test(fw(k)) && vis(k) && k.textContent.trim().length < 24;
  for (const id of FLOWED) {
    const f = tpl(id); if (!f) continue;
    const body = [...f.children].filter(k => vis(k) && N(k, "top") >= 90 && N(k, "top") < 740 && !/btn 뒤로|icon back/.test(k.dataset.name || ""));
    // 글자 꼴
    for (const k of body) {
      if (k.tagName !== "P") continue; const c = (k.style.color || "").replace(/\s/g, "").toLowerCase();
      if (isLabel(k)) Object.assign(k.style, { fontWeight: "500", color: "#6b6484" });
      else if (fs(k) === 15 && /4a4361|rgb\(74,67,97\)/.test(c) && fw(k) === "400" && !/초대$/.test(k.textContent.trim())) Object.assign(k.style, { fontWeight: "500", color: "#1a1626" });
      else if (fs(k) === 12 && fw(k) === "500") k.style.fontSize = "13px";
    }
    // 지우는 · 끊는 단추 글자는 진한 색 하나로 — 주형 noAccent(포인트 주황 · 빨강 → 잉크)가 보이는 화면만 바꿔서 화면마다 빨강 / 진한 색이 섞였음
    f.querySelectorAll(":scope > p").forEach(k => { if (/^(연결 끊기|휴지통 비우기)$/.test(k.textContent.trim())) k.style.color = "#1c1730"; });
    // 와이어프레임 주석(화면 이동 설명) 뺌
    [...f.children].forEach(k => { if (k.textContent.length < 160 && /→ S\d|_알림|관리 항목\(/.test(k.textContent)) k.style.display = "none"; });
    // 간격: 묶음 제목 기준으로 다시 쌓기
    const labels = body.filter(isLabel).sort((a, b) => N(a, "top") - N(b, "top")); if (!labels.length) continue;
    const t0 = Math.min(...body.map(k => N(k, "top")));
    let cursor = t0 < N(labels[0], "top") ? null : 112;   // 첫 제목 앞에 다른 내용(로고 · 이름 등)이 있으면 그 덩어리는 그대로 두고 바로 뒤부터
    if (cursor === null) { const pre = body.filter(k => N(k, "top") < N(labels[0], "top")); const preMin = Math.min(...pre.map(k => N(k, "top"))); const d0 = 112 - preMin; pre.forEach(k => k.style.top = (N(k, "top") + d0) + "px"); cursor = Math.max(...pre.map(k => N(k, "top") + H(k))) + 24; }
    const tops = labels.map(l => N(l, "top"));
    labels.forEach((lab, i) => {
      const from = tops[i], to = i + 1 < tops.length ? tops[i + 1] : 740;
      const block = body.filter(k => k !== lab && N(k, "top") > from && N(k, "top") < to);
      const dl = cursor - from; lab.style.top = cursor + "px";
      if (block.length) { const bMin = Math.min(...block.map(k => N(k, "top"))); const db = (cursor + 24) - bMin; block.forEach(k => k.style.top = (N(k, "top") + db) + "px"); cursor = Math.max(...block.map(k => N(k, "top") + H(k))) + 24; }
      else cursor += 24 + 24;
    });
  }
  // 연필 아이콘(수정): 선이 x 4~19 · y 5~20 에 끝이 왼쪽 아래라 동그라미 안에서 왼쪽 아래로 치우쳐 보였음 → 오른쪽 1 · 위 1
  document.querySelectorAll("template").forEach(t => t.content.querySelectorAll('[data-name="icon 연필"]').forEach(k => { k.style.left = (N(k, "left") + 1) + "px"; k.style.top = (N(k, "top") - 1) + "px"; }));
  // 휴지통 '되살리기': 알약 → 담은 카드 '발산하기 ›' 와 같은 글 단추(13px · 500 · 진한 색, 설명 줄 오른쪽 끝 358). 알약 자리는 투명한 누름 칸으로 남김(flow.js btn 되살리기)
  (() => {
    const f = tpl("M5"); if (!f) return;
    [...f.children].filter(k => k.dataset.name === "btn 되살리기" && k.style.display !== "none").forEach(btn => {
      const T = N(btn, "top"), lab = [...f.querySelectorAll(":scope > p")].find(p => p.textContent.trim() === "되살리기" && Math.abs(N(p, "top") - T) < 10); const y = T + 13;
      Object.assign(btn.style, { top: y + "px", left: "238px", width: "120px", height: "24px", backgroundColor: "transparent", border: "0" });
      if (lab) { lab.textContent = "되살리기 ›"; Object.assign(lab.style, { top: y + "px", left: "238px", width: "120px", translate: "none", textAlign: "right", fontSize: "13px", fontWeight: "500", lineHeight: "24px", color: "#4a4361", pointerEvents: "none" }); }
    });
  })();
})();
