// statusbar.js — 13판(11-04 시연): 화면마다 피그마 조각으로 들어 있는 상태 표시줄(시간 '9:41' 12px · 배터리 자리 24×10 네모)이 실제 iOS 보다 작고,
// 헤더(보관함 · 제목 · 메뉴 / 뒤로 · 건너뛰기)가 상태 표시줄에 붙어 있어서(가운데 y 62, 다이내믹 아일랜드 아래 끝 47) 답답해 보였음.
// 화면을 만들기 전(COMET.build 전)에 템플릿 안 조각만 고친다.
//   상태 표시줄 = Apple 공식 iOS and iPadOS 27 UI Kit 'Status Bar - iPhone 17 Pro'(피그마 12961:29590) 값:
//     시간 SF Pro Semibold 17.67 · 아일랜드 왼쪽 귀 가운데(오른쪽으로 10 치우침) / 신호 막대 3.33 폭 4개(6.33·8.67·11·13.67, 간격 2.33) · 와이파이 19.33×14.33 · 배터리 29.33×13.67, 사이 8, 오른쪽 귀 가운데(왼쪽으로 10)
//     와이파이·배터리 그림은 키트 SVG 그대로(figma5/_ios). 세로 가운데 = 아일랜드 가운데(y 29)
//   헤더 = 위에서 40~86px 사이에 있는 조각을 SHIFT 만큼 아래로 (상태 표시줄과 띄움). 피그마 조각의 translate·transform 은 안 건드림(top 만)
(() => {
  const C = { mid: 29, islandL: 133, islandR: 257, W: 390, pad: 10, color: "#000" };
  const SHIFT = 16, HEAD = { from: 40, to: 60 };   // 16: 헤더 가운데 62 → 78. 23(실제 앱 ≈ 85)은 헤더 단추 아래 끝(103)이 바로 밑 본문(96~102)과 125곳 겹쳐서 겹침 없는 16   // 헤더 조각은 y 44(단추)·50(아이콘)·52(제목)에서 시작. 86 까지 잡았더니 M1 프로필·M2 입력칸·T5 칩 같은 본문 상자만 내려가 속 글자와 어긋났음
  const bars = [6.333, 8.67, 11, 13.667].map((h, i) => `<span style="width:3.333px;height:${h}px;border-radius:4px;background:${C.color};margin-left:${i ? 2.333 : 0}px"></span>`).join("");
  const RIGHT = `<span style="display:flex;align-items:flex-end;padding-top:1.333px">${bars}</span><img alt="" src="/figma5/_ios/wifi.svg" style="width:19.333px;height:14.333px;display:block"><img alt="" src="/figma5/_ios/battery.svg" style="width:29.333px;height:13.667px;display:block">`;
  const rightW = 4 * 3.333 + 3 * 2.333 + 8 + 19.333 + 8 + 29.333, rightCx = (C.islandR + C.W - C.pad) / 2;
  window.STATUSBAR = { SHIFT, HEAD };
  for (const t of document.querySelectorAll("template")) {
    const f = t.content.querySelector(".fig"); if (!f) continue;
    const top = (k) => parseFloat(k.style.top) || 0;
    let sb = false;
    for (const p of f.querySelectorAll(":scope > p")) {
      if (p.textContent.trim() !== "9:41" || top(p) > 30) continue; sb = true; p.dataset.sb = "1";
      Object.assign(p.style, { top: `${C.mid - 11}px`, left: `${C.pad}px`, width: `${C.islandL - C.pad}px`, textAlign: "center", fontSize: "17.67px", lineHeight: "22px", fontWeight: "600", letterSpacing: "-.02em", color: C.color, fontFamily: `-apple-system, "SF Pro Text", ${p.style.fontFamily}` });
    }
    for (const b of f.querySelectorAll(":scope > div")) {   // 오른쪽: 이름이 화면마다 다름('배터리'·'Rectangle'·'rect') → 위쪽 오른편 24×10 조각으로 찾음
      if (top(b) > 30 || (parseFloat(b.style.left) || 0) < 300 || parseFloat(b.style.width) !== 24 || parseFloat(b.style.height) !== 10) continue;
      sb = true; b.dataset.sb = "1";
      Object.assign(b.style, { top: `${C.mid - 7}px`, left: `${rightCx - rightW / 2}px`, width: `${rightW}px`, height: "14.333px", borderRadius: "0", backgroundColor: "transparent", display: "flex", alignItems: "center", gap: "8px" });
      b.innerHTML = RIGHT;
    }
    if (!sb) continue;   // 상태 표시줄이 있는 전체 화면만 (시트 등은 그대로)
    for (const k of f.children) {
      if (k.dataset.sb) continue; const y = top(k), h = parseFloat(k.style.height) || 0;
      if (y >= HEAD.from && y < HEAD.to && h <= 48) k.style.top = `${y + SHIFT}px`;
    }
  }
})();

// 13판(11-04): 아바타 원 안 머리글자(진 · A · B · 인 …)가 원 가운데보다 1~2px 위에 있었음(글자 칸 높이가 원과 달라서).
// '아바타' 원과 그 안의 한 글자 p 를 찾아, 글자 칸을 원과 같은 top · 높이 · 줄 높이로 → 세로 가운데. 가로 가운데(translate)는 그대로
(() => {
  for (const t of document.querySelectorAll("template")) {
    const f = t.content.querySelector(".fig"); if (!f) continue;
    const N = (k, a) => parseFloat(k.style[a]) || 0;
    const circles = [...f.children].filter(k => /^아바타/.test(k.dataset.name || "") && N(k, "width") >= 20 && Math.abs(N(k, "width") - N(k, "height")) < 1);
    for (const p of f.querySelectorAll(":scope > p")) {
      if (p.textContent.trim().length > 2) continue;
      const c = circles.find(k => Math.abs(N(p, "top") - N(k, "top")) < N(k, "height") && Math.abs(N(p, "left") - (N(k, "left") + N(k, "width") / 2)) < 3);
      if (!c) continue;
      // 11-05 진규 2차: 글자를 원 안(자식)으로 옮김 — 화면을 그릴 때 router 목록 줄 정렬이 원만 내려(M2 에서 4.5px) 글자가 위로 떠 있었음. 이제 원이 움직이면 글자도 같이
      Object.assign(p.style, { left: "0px", top: ".5px", width: "100%", height: `${N(c, "height")}px`, lineHeight: `${N(c, "height")}px`, translate: "none", margin: "0" });   // +.5: 글꼴 윗부분이 아래보다 길어 줄 가운데에 두면 0.5~1px 위로 보임
      c.appendChild(p);
    }
  }
})();

// 11-05 진규: 발산(D1) 위쪽 줄 복사는 뺌 — 주형 d1_topbar.js(같은 일, 누르면 발산을 끝내고 감)로 합침

// 11-05 진규: 상태 표시줄은 어떤 상황에서도 사라지지 않게 — 화면마다 그리던 것(data-sb)은 숨기고(comet.css), 폰 위에 하나만 고정.
//   화면 전환 · 시트 · 발산 연출로 화면이 흐려지거나 밀려나도 그대로. 앱 화면(z 1~4) · 실행 장면 검은 원(#mass z 3) 위, 폰 바탕화면(#home z 30) 아래(z 8).
//   색: 기본 검정. 실행 장면의 검은 원(#mass, 흰 원 + difference 로 검게 보임)이 상태 표시줄 자리를 덮는 동안만 흰색(#sbar.light)
(() => {
  const C = { mid: 29, islandL: 133, islandR: 257, W: 390, pad: 10 };
  const bars = [6.333, 8.67, 11, 13.667].map((h, i) => `<span style="width:3.333px;height:${h}px;border-radius:4px;background:#000;margin-left:${i ? 2.333 : 0}px"></span>`).join("");
  const rightW = 4 * 3.333 + 3 * 2.333 + 8 + 19.333 + 8 + 29.333, rightCx = (C.islandR + C.W - C.pad) / 2;
  const sb = document.createElement("div"); sb.id = "sbar"; sb.setAttribute("aria-hidden", "true");
  sb.innerHTML = `<p style="position:absolute;margin:0;top:${C.mid - 11}px;left:${C.pad}px;width:${C.islandL - C.pad}px;text-align:center;font:600 17.67px/22px -apple-system,'SF Pro Text','Pretendard Variable',Pretendard,sans-serif;letter-spacing:-.02em;color:#000">9:41</p>` +
    `<div style="position:absolute;top:${C.mid - 7}px;left:${rightCx - rightW / 2}px;width:${rightW}px;height:14.333px;display:flex;align-items:center;gap:8px"><span style="display:flex;align-items:flex-end;padding-top:1.333px">${bars}</span><img alt="" src="/figma5/_ios/wifi.svg" style="width:19.333px;height:14.333px;display:block"><img alt="" src="/figma5/_ios/battery.svg" style="width:29.333px;height:13.667px;display:block"></div>`;
  const phone = document.getElementById("phone"); if (!phone) return; phone.appendChild(sb);
  //   2차: 폰 바탕화면(#home z 30) · 아이콘이 커지는 판(#zoom z 31) 위(z 32)에 두고 바탕화면 것(#home .st)은 숨김 → 아이콘을 누른 직후에도 안 사라짐.
  //   흰색 = 바탕화면이 보이는 동안(커지는 흰 판이 아직 상태 표시줄 자리를 안 덮었을 때) · 실행 장면 검은 원이 덮는 동안
  const mass = document.getElementById("mass"), home = document.getElementById("home"), zoom = document.getElementById("zoom"), pts = [[(C.pad + C.islandL) / 2, C.mid], [rightCx, C.mid]];
  const shown = (e) => e && e.style.display !== "none" && getComputedStyle(e).display !== "none";
  const covers = (e, round) => { const m = e.getBoundingClientRect(), p = phone.getBoundingClientRect(), s = p.width / C.W; if (m.width < 4) return false;
    return pts.every(([x, y]) => { const X = p.left + x * s, Y = p.top + y * s; if (!round) return X > m.left && X < m.right && Y > m.top && Y < m.bottom;
      const dx = (X - m.left - m.width / 2) / (m.width / 2), dy = (Y - m.top - m.height / 2) / (m.height / 2); return dx * dx + dy * dy < 1; }); };
  let light = null;
  (function tick() {
    if (document.documentElement.hasAttribute("data-iphone")) return;   // 11-06 진규: 아이폰 입구는 진짜 상태 표시줄을 써서 #sbar 를 숨김 → 매 프레임 레이아웃 읽기(getBoundingClientRect)도 멈춤
    let on = false;
    if (shown(home) && +(getComputedStyle(home).opacity) > .5) on = !(shown(zoom) && +(getComputedStyle(zoom).opacity) > .5 && covers(zoom, false));
    else if (shown(mass)) on = covers(mass, true);
    if (on !== light) { light = on; sb.classList.toggle("light", on); }
    requestAnimationFrame(tick);
  })();
})();

// 11-05 진규: 기록 찾기 바(T1 · T7 · T8)를 홈 입력 바와 같은 문법으로 — 바 폭 302 + 바깥 48px 잉크 마이크 원 → 바 폭 358(홈 입력 바와 같은 16~374),
//   음성 버튼은 홈의 32px 원 + 막대 파형(H1 'btn 음성' 866:3429 · '음성 파형' 866:3430 그림 그대로)을 바 안 오른쪽(안쪽 8)에. 누르면 가는 곳은 이름이 같아 flow.js 그대로
(() => {
  const h = document.querySelector("#tpl-H1"), hf = h && h.content.querySelector(".fig"); if (!hf) return;
  const hb = hf.querySelector(':scope > [data-node-id="866:3429"]'), hw = hf.querySelector(':scope > [data-node-id="866:3430"]'); if (!hb || !hw) return;
  const N = (k, a) => parseFloat(k.style[a]) || 0;
  for (const id of ["T1", "T5", "T7", "T8"]) {   // T5 도 같은 옛 바(아래 48 마이크 원)가 있었음
    const f = document.querySelector(`#tpl-${id}`)?.content.querySelector(".fig"); if (!f) continue;
    const bar = [...f.children].find(k => (k.dataset.name || "") === "btn 기록 찾기" && N(k, "width") === 302);
    const btn = [...f.children].find(k => (k.dataset.name || "") === "btn 음성" && N(k, "width") === 48);
    if (!bar || !btn) continue; const mic = [...f.children].find(k => (k.dataset.name || "") === "icon mic" && N(k, "left") >= N(btn, "left") && N(k, "top") >= N(btn, "top") && N(k, "left") < N(btn, "left") + 48 && N(k, "top") < N(btn, "top") + 48);   // 버튼 안 마이크만 — 이름만 보면 T7 기록 줄의 마이크 아이콘이 먼저 잡혀 목록이 깨졌음
    const W = 358, D = 32, IN = (N(bar, "height") - D) / 2, R = N(bar, "left") + W;   // 바 높이 48 → 위아래 8
    bar.style.width = `${W}px`;
    const nb = hb.cloneNode(true), nw = hw.cloneNode(true);
    Object.assign(nb.style, { left: `${R - IN - D}px`, top: `${N(bar, "top") + IN}px` });
    Object.assign(nw.style, { left: `${R - IN - D + (D - N(hw, "width")) / 2}px`, top: `${N(bar, "top") + IN + (D - N(hw, "height")) / 2}px` });
    btn.replaceWith(nb); if (mic) mic.replaceWith(nw); else nb.after(nw);
    const x = [...f.children].find(k => (k.dataset.name || "") === "지우기"), xi = [...f.children].find(k => (k.dataset.name || "") === "icon x");   // T7 검색어 지우기(×)는 음성 원 왼쪽 8
    if (x) { const dx = (R - IN - D - 8 - N(x, "width")) - N(x, "left"); x.style.left = `${N(x, "left") + dx}px`; if (xi) xi.style.left = `${N(xi, "left") + dx}px`; }
  }
})();

// 11-05 진규: 아이콘 크기 통일 — 깊이가 얕은 화면(홈에서 가까운 화면)이 기준. 같은 이름이어도 쓰임이 다르면 기준도 다름.
//   목록 썸네일 원(36) 안 = T1 기록 목록 20 · 입력/찾기 바 안 찾기 = 홈 입력 바 첨부 · T1 찾기 22 · 줄 끝 꺾쇠 = H6 18 · 닫기 × = H5-1 18.
//   그림을 그대로 키우고 줄여서 선 굵기도 기준과 같아짐(24 기준 2 → 20 은 1.67). 가운데 자리는 그대로
(() => {
  const N = (k, a) => parseFloat(k.style[a]) || 0;
  for (const t of document.querySelectorAll("template")) {
    const f = t.content.querySelector(".fig"); if (!f) continue; const kids = [...f.children];
    const bgOf = (k) => { const w = N(k, "width"), cx = N(k, "left") + w / 2, cy = N(k, "top") + N(k, "height") / 2;
      return kids.find(o => o !== k && !/^icon /.test(o.dataset.name || "") && N(o, "width") >= w + 6 && N(o, "width") <= 56 && Math.abs(N(o, "width") - N(o, "height")) < 2 && cx > N(o, "left") && cx < N(o, "left") + N(o, "width") && cy > N(o, "top") && cy < N(o, "top") + N(o, "height")); };
    for (const k of kids) {
      const n = k.dataset.name || ""; if (!/^icon /.test(n)) continue; const w = N(k, "width"), h = N(k, "height"); if (!w || Math.abs(w - h) > .5) continue;
      const bg = bgOf(k); let to = 0;
      if (bg && (bg.dataset.name || "") === "아이콘 바탕" && Math.abs(N(bg, "width") - 32) < 1) {   // M5 · M5-2 목록 썸네일 원 32 → T1 과 같은 36
        Object.assign(bg.style, { left: `${N(bg, "left") - 2}px`, top: `${N(bg, "top") - 2}px`, width: "36px", height: "36px" }); }
      if (bg && Math.abs(N(bg, "width") - 36) < 1 && w !== 20 && /^icon (mic|image|doc|link|search|spark)$/.test(n)) to = 20;
      else if (!bg && n === "icon search" && w === 18) to = 22;
      else if (!bg && n === "icon chev" && w === 16) to = 18;
      else if (!bg && n === "icon x" && w === 20) to = 18;
      if (!to) continue; const d = (w - to) / 2;
      Object.assign(k.style, { left: `${N(k, "left") + d}px`, top: `${N(k, "top") + d}px`, width: `${to}px`, height: `${to}px` });
    }
  }
})();
