// app5.js — 5판: 와이어프레임 그림은 그대로 두고, 실제 앱처럼 움직여야 하는 부분만 여기서 만든다.
// ① 기록·찾기 목록을 데이터로 다시 그림 + 필터 칩이 실제로 걸러냄(없으면 빈 상태) ② 카드 덱 드래그(담기·넘기기)
// ③ 담은 카드 목록(밀어서 고정·삭제, 삭제 확인, 목록↔카드 배열) ④ 가로로 넘치는 칩 줄 끌어 넘기기
// 요소 모양은 전부 그 화면의 와이어프레임 요소를 복제해서 쓴다(새 모양 없음). 상태는 재시작하면 처음으로.
const APP5 = (() => {
  const P = COMET, $ = (id) => document.getElementById(id);
  const byName = (fig, n) => fig.querySelector(`[data-name="${n}"]`);
  const pText = (fig, t) => [...fig.querySelectorAll("p")].find(p => p.textContent.replace(/\s+/g, " ").trim().startsWith(t));
  // 복제: 아직 안 받은 그림(data-src)도 바로 보이게, 숨겨 둔 원본의 숨김은 풀고, 화면 연결(data-flow)은 떼어 낸다
  const clone = (el) => { const c = el.cloneNode(true); [c, ...c.querySelectorAll("img[data-src]")].forEach(i => { if (i.dataset && i.dataset.src) { i.src = i.dataset.src; i.removeAttribute("data-src"); } });
    c.style.display = ""; c.style.visibility = ""; c.style.opacity = ""; c.removeAttribute("data-flow"); c.querySelectorAll("[data-flow]").forEach(x => x.removeAttribute("data-flow")); c.style.cursor = ""; return c; };
  const place = (el, x, y) => { el.style.left = x + "px"; el.style.top = y + "px"; return el; };
  // 마우스로 끌 때 글자 선택·그림 끌기(브라우저 기본 동작)가 끼어들어 드래그가 끊기던 것을 막는다
  const noSelect = (el) => { el.style.userSelect = el.style.webkitUserSelect = "none"; el.style.touchAction = "none"; el.querySelectorAll("img").forEach(i => i.draggable = false); el.addEventListener("dragstart", (e) => e.preventDefault()); };
  let suppressClick = false;   // 끌었으면 바로 뒤따르는 클릭(탭)은 먹지 않음 (클릭이 안 오면 잠시 뒤 풀어서 다음 탭을 먹지 않게)
  const suppress = () => { suppressClick = true; clearTimeout(suppress._t); suppress._t = setTimeout(() => suppressClick = false, 80); };
  addEventListener("click", (e) => { if (suppressClick) { e.stopImmediatePropagation(); e.preventDefault(); suppressClick = false; } }, true);

  // ---------- ① 기록 · 찾기 목록 ----------
  // 11-05 주형: 줄 설명은 종류마다 같은 틀로 — 「#종류」 + 결정이 있으면 「· 결정 N」. 분·전사·피그마 같은 각주는 뺌 (종류마다 있는 정보가 달라 줄이 안 맞았다)
  // sub 는 이제 화면에 안 쓰고 찾기 낱말로만 남김 (예: '우산' 으로 형태 스케치를 찾을 수 있게)
  const T1_ROWS = [
    // 11-05 주형(기록 메뉴 3): 「3차 회의 녹음」(16:40) 줄을 뺌 — 방향 좁히기(3차 회의 기록)와 같은 회의의 녹음 원본인데 다른 시각 · 같은 위계로 따로 떠 있었다.
    //   녹음은 회의 기록 안(재생 바 · 원문 전체 보기 → T2-1)에 딸린 원본이라 목록엔 회의 한 줄(녹음 시작 16:38)만. 다른 회의 · 피드백도 녹음이 따로 줄로 안 나오는 것과 같게
    { date: "10월 27일 (월)", kind: "회의", icon: "mic", title: "방향 좁히기", dec: 2, sub: "33분 · 결정 2 · 3차 회의 녹음 전사", time: "16:38", to: "T2" },
    { date: "10월 22일 (수)", kind: "피드백", icon: "mic", title: "교수님 중간 피드백", dec: 0, sub: "녹음 4분", time: "10:20", to: "T9" },
    { date: "10월 20일 (월)", kind: "이미지", icon: "image", title: "형태 스케치 v1", dec: 0, sub: "피그마 · 우산 손잡이", time: "15:02", to: "T3" },
    { date: "10월 15일 (수)", kind: "회의", icon: "mic", title: "대상 정하기", dec: 1, sub: "28분 · 결정 1", time: "15:10", to: "T2" },
    { date: "10월 6일 (월)", kind: "회의", icon: "mic", title: "주제 고르기", dec: 1, sub: "41분 · 결정 1", time: "14:02", to: "T2" },
  ];
  const T7_ROWS = [   // 찾기 '우산' — 와이어프레임 결과 줄 그대로(강조 글자 포함), 종류만 붙임
    { date: "10월 27일 (월)", kind: "회의", dec: 1, orig: "정류장", to: "T2" }, { date: "10월 27일 (월)", kind: "회의", dec: 2, orig: "방향 좁히기", to: "T2" },
    { date: "10월 20일 (월)", kind: "이미지", dec: 0, orig: "형태 스케치", to: "T3" }, { date: "10월 15일 (수)", kind: "회의", dec: 1, orig: "대상 정하기", to: "T2" },
  ];
  // 11-05 주형: 결정은 설명 줄 각주가 아니라 제목 옆 작은 주황 표시(결정 N)로 — 종류 칩과는 다른 축이라 칩으로 빼지 않고 줄에만 표시
  const subOf = (d) => `#${d.kind}`;
  const decBadge = (n) => { const b = document.createElement("span"); b.className = "decbadge"; b.textContent = `결정 ${n}`;
    b.style.cssText = "display:inline-block;margin-left:6px;padding:0 6px;height:17px;line-height:17px;border-radius:9px;font-size:11px;font-weight:600;letter-spacing:-.01em;vertical-align:1px;color:#1c1730;background:rgba(20,15,36,.08)"; return b; };   /* 11-05 2차: 주황 → 잉크(발산 밖은 포인트 색 없음) */
  const T7_SHIFT = 16;   // 11-05 진규: T7 칩 줄이 헤더(뒤로 버튼 아래 끝 96)에 바로 붙어 있었음(13판에서 헤더만 16 내림) → 칩 줄 · 목록을 16 내려 헤더 아래 16
  const T1_SHIFT = 86;   // 11-05 주형: 공유 문서 박스가 필터 칩 위로 올라가면서 칩 줄·목록이 내려간 거리
  // 필터 칩 선택 모양: 고른 칩만 진한 바탕(와이어프레임에서 선택된 칩의 바탕·글자색), 나머지는 옅은 바탕
  function chipLook(fig, pick) {
    const chips = [...fig.querySelectorAll('[data-name^="칩 "]')].filter(c => !c.dataset.name.includes("#") && c.style.display !== "none");
    const dark = (c) => { const m = getComputedStyle(c).backgroundColor.match(/[\d.]+/g); return m && (m[3] === undefined || +m[3] > .5) && +m[0] + +m[1] + +m[2] < 200; };
    const texts = (c) => [...fig.querySelectorAll("p")].filter(q => q.style.display !== "none" && centerIn(q, c));
    const sel = chips.find(dark), un = chips.find(c => !dark(c)); if (!sel || !un) return;
    const look = (c) => ({ bg: getComputedStyle(c).backgroundColor, bd: getComputedStyle(c).borderColor, fg: getComputedStyle(texts(c)[0] || c).color });
    const S = look(sel), U = look(un);
    chips.forEach(c => { const L = c.dataset.name.replace(/^칩 /, "").replace(/ \d+$/, "") === pick ? S : U; c.style.backgroundColor = L.bg; c.style.borderColor = L.bd; texts(c).forEach(q => q.style.color = L.fg); });
  }
  const LIST = {};
  function rowParts(fig, titleP) {   // 제목 글자 하나로 그 줄의 [아이콘 바탕, 아이콘, 제목, 설명, 시간] 을 찾는다 (같은 높이 띠)
    const t = titleP.offsetTop, band = [...fig.children].filter(k => k.offsetTop >= t - 4 && k.offsetTop <= t + 26 && k.offsetLeft < 400);
    const tile = band.find(k => k.dataset.name === "아이콘 바탕"), icon = band.find(k => /^icon /.test(k.dataset.name || ""));
    const ps = band.filter(k => k.tagName === "P").sort((a, b) => a.offsetTop - b.offsetTop || a.offsetLeft - b.offsetLeft);
    const sub = ps.find(p => p !== titleP && p.offsetLeft === titleP.offsetLeft), time = ps.find(p => p.offsetLeft > 300);
    return { tile, icon, title: titleP, sub, time, top: tile ? tile.offsetTop : t };
  }
  function initList(id) {
    const s = P.SCR[id], fig = s.fig, top0 = id === "T1" ? 156 : 154 + T7_SHIFT,   /* 11-05 진규: 146 · 140 → 칩 줄 아래 끝과 첫 날짜 사이 22 · 18 이 날짜 묶음 사이(23)와 같아 칩에 붙어 보였음 → 둘 다 32 */ top = top0 + (id === "T1" ? T1_SHIFT : 0), bottom = 732;
    const dateP = pText(fig, "10월 27일");
    const proto = rowParts(fig, pText(fig, "방향 좁히기"));
    const icons = { mic: proto.icon, image: (fig.querySelector('[data-name="icon image"]') || P.SCR.T7.fig.querySelector('[data-name="icon image"]')), spark: fig.querySelector('[data-name="icon spark"]') };
    const box = document.createElement("div"); box.className = "app5-list"; box.style.cssText = `position:absolute;left:0;top:${top}px;width:390px;height:${bottom - top}px;overflow-y:auto;overflow-x:hidden`;
    // 결과 줄들은 원래 요소를 상자 안으로 옮기고, 나머지 목록 요소는 숨긴다
    const rows = [];
    const pin = id === "T1" ? { parts: rowParts(fig, pText(fig, "공유 문서")), mark: byName(fig, "고정 표시"), head: pText(fig, "고정") } : null;
    // 찾기(T7)는 와이어프레임 결과 줄 + 기록(T1)의 나머지 줄까지 — 친 말로 이 전체에서 찾는다
    const data = id === "T1" ? T1_ROWS : [...T7_ROWS, ...T1_ROWS.filter(d => !T7_ROWS.some(t => d.title.startsWith(t.orig) || t.orig.startsWith(d.title)))];
    for (const d of data) {
      let parts;
      if (d.orig) parts = rowParts(fig, pText(fig, d.orig));
      else { const exist = pText(fig, d.title); parts = exist ? rowParts(fig, exist) : null;
        if (!parts) { parts = { tile: clone(proto.tile), icon: clone(icons[d.icon] || proto.icon), title: clone(proto.title), sub: clone(proto.sub), time: clone(proto.time) }; parts.title.textContent = d.title; parts.time.textContent = d.time; } }
      const keys = [d.sub, parts.sub && parts.sub.textContent].filter(Boolean).join(" ");   // 원래 설명(각주)은 찾기 낱말로만 남김
      if (parts.sub) parts.sub.textContent = subOf(d);
      // 찾기 결과 줄(강조 글자 든 줄)은 피그마에서 줄 높이 0 으로 와서 글자가 반쯤 위로 떠 겹쳤다 → 제목 18px · 설명 14px 로
      [[parts.title, "18px"], [parts.sub, "14px"]].forEach(([e, lh]) => { if (e && parseFloat(getComputedStyle(e).lineHeight) === 0) { e.style.lineHeight = lh; e.style.whiteSpace = "nowrap"; } });
      if (d.dec && !parts.title.querySelector(".decbadge")) { parts.title.style.whiteSpace = "nowrap"; parts.title.appendChild(decBadge(d.dec)); }
      rows.push({ ...d, parts, keys });
    }
    const foot = id === "T7" ? pText(fig, "못 찾으면") : null;
    [...fig.children].forEach(k => { if (k.offsetTop >= (id === "T1" ? 146 : 140) - 2 && k.offsetTop < bottom && k.dataset.name !== "아래 바" && k !== foot) k.style.display = "none"; });
    if (foot) foot.style.display = "none";
    if (pin) pinBox(fig, pin);
    if (id === "T1") [...fig.children].forEach(k => { if (k.offsetTop >= 92 && k.offsetTop + k.offsetHeight <= 136) k.style.top = (parseFloat(k.style.top) + T1_SHIFT) + "px"; });
    if (id === "T7") [...fig.children].forEach(k => { if (k.offsetTop >= 92 && k.offsetTop + k.offsetHeight <= 136) { k.style.top = (parseFloat(k.style.top) + T7_SHIFT) + "px"; k.style.left = (parseFloat(k.style.left) - 2) + "px"; } });   // 왼쪽 18 → 16(뒤로 버튼 · T1 칩과 같은 줄)   // 칩 줄을 공유 문서 박스 아래로
    chipLook(fig, "전체");
    const empty = document.createElement("div"); empty.style.cssText = "position:absolute;left:0;top:120px;width:390px;text-align:center;display:none";
    empty.innerHTML = `<p style="position:static;margin:0;font:600 16px/1.4 inherit;color:#1a1626;font-family:inherit"></p><p style="position:static;margin:6px 0 0;font:400 13px/1.4 inherit;color:#6b6484;font-family:inherit"></p>`;
    empty.style.fontFamily = getComputedStyle(proto.title).fontFamily;
    box.appendChild(empty); fig.appendChild(box);
    LIST[id] = { box, rows, dateP, foot, empty, fig, sel: "전체", q: id === "T7" ? "우산" : "" };   // 11-05 주형: 처음 들어오면 「전체」 (와이어프레임은 회의가 선택돼 있었다)
    render(id);
  }
  // 11-05 주형: 공유 문서는 '고정한 기록'이 아니라 기록들보다 한 단계 위 문서 → 필터 칩 위에 박스로 따로 (고정 머리글·주황 표시는 뺌)
  function pinBox(fig, { parts, mark, head }) {
    const { tile, icon, title, sub, time } = parts, W = 358, H = 64;
    [mark, head].forEach(e => { if (e) e.style.display = "none"; });
    const b = document.createElement("div"); b.className = "app5-pin";
    b.style.cssText = `position:absolute;left:16px;top:104px;width:${W}px;height:${H}px;box-sizing:border-box;background:#fff;border:1px solid rgba(20,15,36,.08);border-radius:16px;box-shadow:0 1px 3px rgba(20,15,36,.05);cursor:pointer`;
    // 11-05 주형: 설명 줄(출근길… · 할 일 2)은 빼고 제목 한 줄을 아이콘과 가운데 맞춤.
    // 아이콘은 기록 줄의 옅은 동그라미와 위계가 다르게 — 진한 둥근 네모(40) 안에 흰 문서 아이콘
    if (sub) sub.style.display = "none";
    const TS = 40, inH = H - 2, y = (inH - TS) / 2;   // 테두리 안쪽 높이 기준 가운데
    tile.style.width = tile.style.height = TS + "px"; tile.style.borderRadius = "12px"; tile.style.background = "#1c1730"; tile.querySelectorAll("img").forEach(i => i.style.display = "none");
    icon.style.filter = "brightness(0) invert(1)";
    title.style.fontWeight = "700"; title.style.whiteSpace = "nowrap";
    const put = (el, x, yy) => { el.style.display = ""; el.style.position = "absolute"; place(el, x, yy); b.appendChild(el); };
    const tH = title.offsetHeight || 18, iw = icon.offsetWidth || 20, ih = icon.offsetHeight || 20;
    put(tile, 12, y); put(icon, 12 + (TS - iw) / 2, y + (TS - ih) / 2); put(title, 12 + TS + 12, (inH - tH) / 2);
    if (time) put(time, W - 2 - 14, (inH - (time.offsetHeight || 14)) / 2);
    b.onclick = () => P.show("T4", "push");
    fig.appendChild(b);
  }
  function render(id) {
    const L = LIST[id]; if (!L) return; const { box, rows, dateP, empty } = L;
    [...box.children].forEach(c => { if (c !== empty) c.remove(); });
    const want = (r) => (L.sel === "전체" || r.kind === L.sel) && (!L.q || matchQ(r, L.q));
    const day = (r) => { const m = (r.date || "").match(/(\d+)월 (\d+)일/); return m ? +m[1] * 100 + +m[2] : 9999; };
    const shown = rows.filter(want).sort((a, b) => day(b) - day(a));   // 최근 날짜부터
    let y = 6, lastDate = null, prevBottom = null;
    const put = (el, x, yy) => { el.style.display = ""; el.style.position = "absolute"; place(el, x, yy); box.appendChild(el); };
    const line = (css) => { const v = document.createElement("div"); v.className = "app5-tl"; v.style.cssText = `position:absolute;pointer-events:none;${css}`; box.insertBefore(v, box.firstChild); };
    // 7판: 아이콘 원끼리 세로선으로 이어 타임라인처럼 · 11-05 주형: 같은 날 안에서만 잇고, 날짜가 바뀌면 연한 가로 구분선
    const vline = (y0, y1, x) => { if (y1 - y0 >= 2) line(`left:${x - .75}px;top:${y0}px;width:1.5px;height:${y1 - y0}px;background:rgba(20,15,36,.14);border-radius:1px`); };
    // 11-05 주형: 줄 안 정렬은 아이콘 원 기준 — 제목+설명 두 줄 묶음의 가운데 = 원의 가운데, 시간은 제목 줄에, 날짜 글자는 원의 왼쪽 끝에
    const X0 = 20;
    for (const r of shown) {
      const { tile, icon, title, sub, time } = r.parts, tw = tile.offsetWidth || 36, th = tile.offsetHeight || 36, cx = X0 + tw / 2, cy = th / 2;
      if (r.date !== lastDate) {
        if (lastDate) { y += 6; line(`left:${X0}px;top:${y}px;width:${370 - X0}px;height:1px;background:rgba(20,15,36,.07)`); y += 16; }
        const h = r._head || (r._head = clone(dateP)); h.textContent = r.date; put(h, X0, y);
        y += (h.offsetHeight || 15) + 12; lastDate = r.date; prevBottom = null;
      }
      if (prevBottom !== null) vline(prevBottom, y, cx);
      prevBottom = y + th;
      const tH = title.offsetHeight || 18, sH = sub ? sub.offsetHeight || 14 : 0, gap = sub ? 3 : 0, ty = y + cy - (tH + gap + sH) / 2;
      put(tile, X0, y); put(icon, cx - (icon.offsetWidth || 20) / 2, y + cy - (icon.offsetHeight || 20) / 2);
      put(title, X0 + tw + 12, ty); if (sub) put(sub, X0 + tw + 12, ty + tH + gap);
      if (time) put(time, 370, ty + (tH - (time.offsetHeight || 14)) / 2);   // 시간 = 오른쪽 끝(구분선 끝과 같은 370), 제목 줄 가운데
      // 줄 전체를 누르면 그 기록으로
      const hit = r._hit || (r._hit = document.createElement("div")); hit.style.cssText = `position:absolute;left:12px;top:${y - 6}px;width:366px;height:${th + 12}px;cursor:pointer`; hit.onclick = () => P.show(r.to, "push"); box.appendChild(hit);
      y += th + 20;
    }
    const real = shown.length;
    empty.style.display = real ? "none" : ""; empty.style.top = (y + 40) + "px";
    if (!real) { const q = id === "T7" && L.q ? `‘${L.q}’ ` : ""; empty.children[0].textContent = `${q}${L.sel} 기록이 없어요`; empty.children[1].textContent = id === "T7" ? "다른 필터를 고르거나 ai에게 물어보세요" : "회의를 녹음하거나 자료를 연결하면 여기 모여요"; }
    if (L.foot) { put(L.foot, parseFloat(L.foot.style.left) || 195, Math.max(y + 24, real ? y + 24 : y + 110)); }
    chipCounts(L);
  }
  // 11-05 주형: 칩 개수(회의 4)는 고른 칩에만 — 안 고른 칩은 이름만. 글자 길이가 바뀌니 칩 너비를 글자에 맞추고 왼쪽부터 다시 줄 세운다
  const measure = (() => { const c = document.createElement("canvas").getContext("2d"); return (p, t) => { c.font = getComputedStyle(p).font; return c.measureText(t).width; }; })();
  function chipCounts(L) {
    const fig = L.fig, count = (k) => L.rows.filter(r => (k === "전체" || r.kind === k) && (!L.q || matchQ(r, L.q))).length;
    const chips = [...fig.querySelectorAll('[data-name^="칩 "]')].filter(c => !c.dataset.name.includes("#") && c.style.display !== "none").sort((a, b) => parseFloat(a.style.left) - parseFloat(b.style.left));
    if (!chips.length) return;
    let x = parseFloat(chips[0].dataset.x0 ?? chips[0].style.left);
    for (const c of chips) {
      const name = c.dataset.name.replace(/^칩 /, "").replace(/ \d+$/, ""), t = c._t || (c._t = [...fig.querySelectorAll("p")].find(q => q.style.display !== "none" && centerIn(q, c))); if (!t) continue;
      const label = name === L.sel ? `${name} ${count(name)}` : name; t.textContent = label;
      const w = Math.round(measure(t, label) + 16 * 2);   // 좌우 여백 16 = 와이어프레임 칩(전체·피드백·이미지)과 같음
      for (const [el, left] of [[c, x], [t, x + w / 2]]) { el.style.left = left + "px"; if (el.dataset.x0 !== undefined) el.dataset.x0 = left; }
      c.style.width = t.style.width = w + "px"; x += w + 8;
    }
  }
  const matchQ = (r, q) => { const t = [r.parts.title, r.parts.sub].filter(Boolean).map(e => e.textContent).concat(r.keys || "").join(" ").toLowerCase(); return q.toLowerCase().split(/\s+/).filter(Boolean).every(w => t.includes(w)); };   // 친 말의 낱말이 제목·설명에 다 있으면
  function filter(id, chipName) { const L = LIST[id]; if (!L) return; L.sel = chipName.replace(/^칩 /, "").replace(/ \d+$/, ""); render(id); }
  function dropRecChip() {   // 7판: 필터 칩 「녹음」 없앰 (기록·찾기 화면 전부). 칩 바탕과 그 안의 글자를 숨긴다
    for (const s of Object.values(P.SCR)) { const c = s.fig && byName(s.fig, "칩 녹음"); if (!c) continue;
      const top = c.offsetTop; [...s.fig.querySelectorAll("p")].filter(p => /^녹음( \d+)?$/.test(p.textContent.trim()) && Math.abs(p.offsetTop - top) < 24).forEach(p => p.style.display = "none"); c.style.display = "none"; }
  }

  // ---------- ② 카드 덱 드래그 ----------
  const IDEAS = [
    ["가까운 · z 0.6", "정류장 우산을 빌릴 때 앞사람이 남긴 한 줄 메모가 보이는 우산꽂이"],
    ["중간 · z 1.1", "머그컵 바닥에 음료를 다 비워야만 보이는 열 감응 잉크 문구가 드러나는 컵"],
    ["먼 · z 1.8", "같은 버스를 매일 타는 사람끼리만 색이 맞춰지는 손잡이 링"],
    ["중간 · z 1.2", "출근길 횡단보도에서 신호를 기다리는 사람 수만큼 켜지는 바닥 불빛"],
    ["가까운 · z 0.5", "엘리베이터에서 같은 층을 누른 사람에게만 보이는 작은 인사 버튼"],
    ["먼 · z 2.0", "지하철 역마다 하루 한 번만 열리는 낯선 이의 추천 책장"],
  ];
  let deckWired = false, ideaIdx = 2, nudgeDeck = () => {}, resetDeck = () => {}, dealIn = () => 0;   // 11-04 주형: 맨 앞 카드 처음 글이 IDEAS[1] 이라 1 부터면 첫 장을 넘겨도 같은 글이 다시 나왔다
  function wireDeck() {
    const deck = P.find("D4", "div.deck")[0]; if (!deck || deckWired) return; deckWired = true;
    const front = () => [...deck.querySelectorAll(':scope > [data-name="div.card"]')].pop();
    // 아이디어 글은 와이어프레임에서 줄마다 <p> 하나 → 새 아이디어도 줄로 나눠(어절 단위, 14자 안팎) 첫 줄 <p> 를 복제해 채운다
    const setIdea = (card, [meta, idea]) => { const m = card.querySelector('[data-name="div.meta"] p'); if (m) m.textContent = meta; const box = card.querySelector('[data-name="div.idea"] > div'); if (!box) return;
      const p0 = box.querySelector("p"), lines = []; for (const w of idea.split(" ")) { const l = lines[lines.length - 1]; if (l && (l + " " + w).length <= 14) lines[lines.length - 1] = l + " " + w; else lines.push(w); }
      box.innerHTML = ""; lines.forEach((t, k) => { const q = p0.cloneNode(false); q.textContent = t; q.style.marginBottom = k < lines.length - 1 ? "0px" : ""; box.appendChild(q); }); };
    // 11-04 주형: 카드 글은 모두 가운데 정렬(뒤 카드는 왼쪽이었다). 각주·거리 막대·"가까운 · z" 줄은 comet.css 에서 숨김
    const cards = () => [...deck.querySelectorAll(':scope > [data-name="div.card"]')];
    const centerIdea = (card) => { const box = card.querySelector('[data-name="div.idea"] > div'); if (!box) return; box.style.left = parseFloat(box.parentElement.style.width) / 2 + "px"; box.style.translate = "-50% 0"; box.style.textAlign = "center"; };
    const fillBacks = () => cards().slice(0, -1).reverse().forEach((c, k) => setIdea(c, IDEAS[(ideaIdx + k) % IDEAS.length]));   // 바로 뒤 카드 = 다음에 나올 아이디어
    const ICON = { keep: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>', toss: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>' };
    cards().forEach(c => { centerIdea(c); const fx = document.createElement("div"); fx.className = "swipefx"; fx.innerHTML = `<b class="keep">${ICON.keep}</b><b class="toss">${ICON.toss}</b>`; c.insertBefore(fx, c.firstChild); const tc = document.createElement("div"); tc.className = "cardtint"; c.insertBefore(tc, fx); });   // 색 층은 글 아래 · 11-05: 그 아래 마스코트 색 옅은 그라데이션(cardtint)
    fillBacks();
    // 11-04 주형: 끄는 동안 카드 색이 바뀐다(오른쪽 담기 = 주황, 왼쪽 버리기 = 짙은 회색). 덱 아래 ✕ / ✓ 버튼 — 눌러도 넘어가고, 끄는 쪽 버튼이 차오른다
    const btns = document.createElement("div"); btns.className = "deckbtns";
    btns.innerHTML = `<button class="toss" aria-label="버리기">${ICON.toss}<span>버리기</span></button><button class="keep" aria-label="담기">${ICON.keep}<span>담기</span></button>`; P.SCR.D4.el.appendChild(btns);
    const bt = { keep: btns.querySelector(".keep"), toss: btns.querySelector(".toss") };
    const feel = (c, dx) => { const k = Math.min(1, Math.abs(dx) / 90), dir = dx > 0 ? "keep" : dx < 0 ? "toss" : ""; c.style.setProperty("--sk", k.toFixed(3)); c.dataset.swipe = dir; if (k > .55) c.dataset.strong = ""; else delete c.dataset.strong;
      bt.keep.classList.toggle("on", dir === "keep" && k > .55); bt.toss.classList.toggle("on", dir === "toss" && k > .55); };
    let st = null, busy = false; noSelect(deck);
    // 11-04 주형: 고른 장수(3·5·8·12)만큼만 넘긴다 — 남은 장수에 맞춰 뒤 카드가 줄고, 마지막 장을 넘기면 덱이 비고 버튼이 꺼진다
    const showLeft = () => { const left = ACTIONS.deckLeft(); cards().slice(0, -1).reverse().forEach((c, k) => { c.style.visibility = k < left - 1 ? "" : "hidden"; }); btns.classList.toggle("done", left <= 0); };
    const fling = (c, keep) => { busy = true; feel(c, keep ? 999 : -999); c.style.transition = "transform .4s cubic-bezier(.3,.7,.2,1), opacity .3s"; c.style.transform = `translate(${keep ? 460 : -460}px, 40px) rotate(${keep ? 22 : -22}deg)`; c.style.opacity = "0";
      ACTIONS.deckResult(keep, c); showLeft();
      setTimeout(() => { busy = false; if (ACTIONS.deckLeft() <= 0) return;   // 다 넘겼으면 맨 앞 카드는 날아간 채로 둔다
        c.style.transition = "none"; c.style.transform = ""; c.style.opacity = "1"; feel(c, 0); setIdea(c, IDEAS[ideaIdx++ % IDEAS.length]); fillBacks(); }, 420); };
    resetDeck = () => { const c = front(); if (c) { c.style.transition = "none"; c.style.transform = ""; c.style.opacity = "1"; feel(c, 0); } busy = false; st = null; showLeft(); };
    // 11-04 주형: 로딩이 끝나면 카드가 덱 자리 바로 위(20px 남짓)에서 뒤 카드부터 하나씩 착착 내려앉는다. 쌓이는 동안은 못 건드림. 다 쌓이는 시간(ms)을 돌려준다
    dealIn = () => { const vis = cards().filter(c => c.style.visibility !== "hidden"), STEP = 85, DUR = 300; busy = true;
      vis.forEach((c, i) => { const tilt = (i % 2 ? 1 : -1) * 1.6;
        c.animate([{ opacity: 0, transform: `translateY(-22px) scale(1.03) rotate(${tilt}deg)` }, { opacity: 1, transform: "translateY(2px) scale(1) rotate(0deg)", offset: .75 }, { opacity: 1, transform: "none" }],
          { duration: DUR, delay: i * STEP, easing: "cubic-bezier(.25,.8,.35,1)", fill: "backwards" }); });
      const total = (vis.length - 1) * STEP + DUR; setTimeout(() => { busy = false; }, total); return total; };
    Object.entries(bt).forEach(([dir, b]) => b.addEventListener("click", (e) => { e.stopPropagation(); const c = front(); if (c && !busy && !st && ACTIONS.deckLeft() > 0) fling(c, dir === "keep"); }));
    deck.addEventListener("pointerdown", (e) => { const c = front(); if (!c || busy || ACTIONS.deckLeft() <= 0) return; e.preventDefault(); st = { x: e.clientX, y: e.clientY, c, moved: false }; deck.setPointerCapture(e.pointerId); c.style.transition = "none"; });
    deck.addEventListener("pointermove", (e) => { if (!st) return; const dx = e.clientX - st.x, dy = e.clientY - st.y; if (Math.abs(dx) > 4) st.moved = true; st.c.style.transform = `translate(${dx}px, ${dy * .25}px) rotate(${dx / 18}deg)`; st.dx = dx; feel(st.c, dx); });
    const end = () => {
      if (!st) return; const { c, dx = 0, moved } = st; st = null; if (moved) suppress();
      if (Math.abs(dx) < 90) { c.style.transition = "transform .35s cubic-bezier(.3,1.4,.5,1)"; c.style.transform = ""; feel(c, 0); return; }
      fling(c, dx > 0);
    };
    // 덱이 쌓일 때마다(11-05: 처음 한 번만 → 매번): 맨 앞 카드가 오른쪽(주황)·왼쪽(회색)으로 살짝 밀렸다 돌아온다 → 끌면 된다는 걸 보여 줌
    nudgeDeck = () => { const c = front(); if (!c || st || busy) return; const t0 = performance.now(), D = 1700, A = 52;
      const step = (now) => { if (st || busy) { c.style.transform = ""; feel(c, 0); return; } const u = Math.min(1, (now - t0) / D), dx = A * Math.sin(2 * Math.PI * u) * Math.sin(Math.PI * u) ** .6;
        c.style.transition = "none"; c.style.transform = `translate(${dx}px, 0) rotate(${dx / 18}deg)`; feel(c, dx * 1.5); if (u < 1) requestAnimationFrame(step); else { c.style.transform = ""; feel(c, 0); } };
      requestAnimationFrame(step); };
    deck.addEventListener("pointerup", end); deck.addEventListener("pointercancel", end);
  }

  // ---------- ③ 담은 카드 ----------
  const SAVED = [
    { title: "정류장 우산", desc: "돌려주면 빌린 사람 이름이 남는다", meta: "중간 · 10.27", pinned: true },
    { title: "하루 한 번 열리는 사물함", desc: "같은 시간에 연 사람끼리만 보인다", meta: "먼 · 10.28" },
    { title: "같은 컵", desc: "같은 컵을 쓰는 사람끼리 표시가 생긴다", meta: "중간 · 10.28" },
    { title: "바닥에 숨은 문구", desc: "다 마셔야 보이는 열 감응 잉크", meta: "가까운 · 10.29" },
  ];
  let savedUI = null, gridMode = false;
  const SAVED_ICON = { grid: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5F2FC" stroke-width="1.5" stroke-linejoin="round"><rect x="5" y="5" width="5.5" height="5.5" rx="1.4"/><rect x="13.5" y="5" width="5.5" height="5.5" rx="1.4"/><rect x="5" y="13.5" width="5.5" height="5.5" rx="1.4"/><rect x="13.5" y="13.5" width="5.5" height="5.5" rx="1.4"/></svg>',   // 2차: 네모 넷이 선 2 로는 무거워 보여 선 1.5 · 네모 5.5 · 간격 3 으로 가볍게
    list: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5F2FC" stroke-width="2" stroke-linecap="round"><path d="M5 7h14M5 12h14M5 17h14"/></svg>' };   // 11-05 진규: 담은 카드 목록 ↔ 바둑판 아이콘 (뒤로 아이콘 문법: 24px · 선 2 · 둥근 끝, 반전 화면이라 #F5F2FC)
  function addSaved(card) {   // 덱에서 담은 카드: 메타(거리 · z)와 아이디어 글(줄을 이어 붙임)로 한 장
    const meta = ((card.querySelector('[data-name="div.meta"] p') || {}).textContent || "").trim(), t = [...card.querySelectorAll('[data-name="div.idea"] p')].map(q => q.textContent.trim()).join(" ") || "새 카드";
    SAVED.push({ title: t.length > 14 ? t.slice(0, 14) + "…" : t, desc: t, meta: meta.split(" · ")[0] + " · 11.03" }); updateCount(); }
  function updateCount() { const p = P.SCR.D1 && [...P.SCR.D1.fig.querySelectorAll("p")].find(x => /^담은 카드 \d+/.test(x.textContent.trim())); if (p) p.textContent = `담은 카드 ${SAVED.length}`; }
  const savedCount = () => SAVED.length;
  function initSaved() {
    const fig = P.SCR.D5.fig;
    const proto = { card: byName(fig, "카드 정류장 우산"), title: pText(fig, "정류장 우산"), desc: pText(fig, "돌려주면"), meta: pText(fig, "중간 · 10.27"), head: pText(fig, "지금 결정에서"), pin: byName(fig, "icon pin"),
      bPin: byName(fig, "스와이프 · btn 고정"), bDel: byName(fig, "스와이프 · btn 삭제"), iPin: fig.querySelectorAll('[data-name="icon pin"]')[1], iDel: byName(fig, "icon trash"), lPin: [...fig.querySelectorAll("p")].find(p => p.textContent.trim() === "고정" && p.offsetTop > 400), lDel: pText(fig, "삭제") };
    [...fig.children].forEach(k => { if (k.offsetTop >= 90 && k.offsetTop < 760) k.style.display = "none"; });
    const box = document.createElement("div"); box.style.cssText = "position:absolute;left:0;top:92px;width:390px;height:690px;overflow-y:auto;overflow-x:hidden"; fig.appendChild(box);
    // 오른쪽 위: 목록 ↔ 카드 배열
    // 11-05 진규: 44×36 알약·글자(▦ ☰)·top 44 → 왼쪽 뒤로 버튼과 같은 36px 원(#13101F)·같은 높이(뒤로 버튼 top 을 따라감)·오른쪽 여백 16, 아이콘은 뒤로 아이콘과 같은 24px 선 2(둥근 끝)
    // 2차: 원 색 #13101F 는 이 화면의 반전 필터를 거치면 연보라(239,236,251) — 앱에 없는 색. 같은 반전 화면인 카드 덱(D4) 닫기 ✕ 원과 같은 값(흰 6% 바탕 + 흰 20% 테 → 화면에선 연회색 + 회색 테)으로, 뒤로 버튼도 같이
    const CIRCLE = "background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);border-radius:50%";
    const backBtn = byName(fig, "btn 뒤로"), tgTop = backBtn ? backBtn.style.top : "60px";
    if (backBtn) { const im = backBtn.querySelector("img"); if (im) im.style.visibility = "hidden"; backBtn.style.cssText += ";" + CIRCLE; }   // 피그마 원(#13101F) 그림만 숨기고 같은 원으로
    const tg = document.createElement("div"); tg.style.cssText = `position:absolute;left:338px;top:${tgTop};width:36px;height:36px;${CIRCLE};display:grid;place-items:center;cursor:pointer`;
    tg.title = "목록 ↔ 카드 배열"; tg.onclick = () => { gridMode = !gridMode; renderSaved(); }; fig.appendChild(tg);
    // 11-06 주형: 담은 카드 화면만 누런 기 — 바탕이 투명이라 폰 틀 바탕(252,252,250)이 비쳤다. 카드도 반전된 흰 6%(237,237,235)라 다른 화면 카드와 달랐음
    //   → 다른 화면 토큰(바탕 #F7F6FA · 카드 #EBEAEF · 테두리 잉크 10% ≈ #E0DFE5)이 '반전 필터를 거친 뒤' 나오도록 필터 전 색을 계산해 칠함(qa/invcolor.mjs, 되짚기 일치)
    fig.style.background = SAVED_TONE.bg; if (P.SCR.D6) P.SCR.D6.fig.style.background = SAVED_TONE.bg;
    savedUI = { fig, box, proto, tg }; renderSaved();
  }
  function renderSaved() {
    if (!savedUI) return; const { box, proto, tg } = savedUI; box.innerHTML = ""; tg.innerHTML = gridMode ? SAVED_ICON.list : SAVED_ICON.grid;   // 지금 바둑판이면 '목록' 아이콘, 목록이면 '바둑판' 아이콘
    if (!SAVED.length) { P.show("D6", "replace"); return; }
    let y = 20; const head = (t) => { const h = clone(proto.head);   /* 11-06 진규: 10 → 20 — '고정 N' 머리가 뒤로 버튼 아래 6px 에 붙어 있었음 → 헤더 아래 16 (T7 과 같음) */ h.textContent = t; h.style.position = "absolute"; h.style.color = SAVED_TONE.sub; place(h, 24, y); box.appendChild(h); y += 26; };
    const groups = [["고정", SAVED.filter(c => c.pinned)], ["지금 결정에서", SAVED.filter(c => !c.pinned)]];
    for (const [name, list] of groups) {
      if (!list.length) continue; head(`${name} ${list.length}`);
      if (gridMode) {
        list.forEach((c, i) => { const x = 16 + (i % 2) * 183, yy = y + Math.floor(i / 2) * 182; const card = tone(clone(proto.card)); card.style.position = "absolute"; place(card, x, yy); card.style.width = "175px"; card.style.height = "170px"; box.appendChild(card);
          // 11-06 주형: 각주(거리 · 날짜) 뺌 — 지금 결정에서 발산한 카드만 모이니 날짜 의미가 없음. 고정이면 제목 왼쪽에 고정 아이콘
          const px = 0;   // 11-06 진규: 제목 앞 고정 아이콘 뺌 (목록 보기와 같게 — 묶음 머리 '고정 N' 이 말해 줌)
          const t = titleTok(clone(proto.title)); t.textContent = c.title; t.style.width = 150 - px + "px"; t.style.whiteSpace = "normal"; t.style.lineHeight = "24px"; place(t, x + 14 + px, yy + 14); box.appendChild(t);
          const d = clone(proto.desc); d.textContent = c.desc; d.style.color = SAVED_TONE.sub; d.style.width = "150px"; d.style.whiteSpace = "normal"; place(d, x + 14, yy + 70); box.appendChild(d);
          if (typeof SEED !== "undefined" && SEED.gridGo) SEED.gridGo(c, box, x + 14, yy + 124, 147); });   // 11-06 진규: 바둑판에도 '발산하기' — 카드 아래쪽, 안쪽 여백 14
        y += Math.ceil(list.length / 2) * 182 + 16;
      } else { list.forEach(c => { row(c, y); y += 92; }); y += 12; }
    }
    const pad = document.createElement("div"); pad.style.cssText = `position:absolute;left:0;top:${y}px;width:1px;height:40px`; box.appendChild(pad);
  }
  function row(c, y) {   // 한 줄: 뒤에 [고정][삭제] 버튼, 위에 카드 — 카드를 왼쪽으로 밀면 버튼이 보인다
    const { box, proto } = savedUI, wrap = document.createElement("div"); wrap.style.cssText = `position:absolute;left:0;top:${y}px;width:390px;height:80px`; box.appendChild(wrap);
    // 카드 바탕이 반투명이라 뒤 버튼이 비쳐 보였다 → 버튼 묶음은 민 만큼만 드러나게 (닫히면 투명)
    const back = document.createElement("div"); back.style.cssText = "position:absolute;inset:0;opacity:0;pointer-events:none;transition:opacity .2s"; wrap.appendChild(back);
    const btn = (b, ic, lab, x, txt, fn) => { const B = clone(b); B.style.position = "absolute"; place(B, x, 0); B.style.cursor = "pointer"; back.appendChild(B); const I = clone(ic); place(I, x + 21, 20); I.style.pointerEvents = "none"; back.appendChild(I); const L = clone(lab); L.textContent = txt; place(L, parseFloat(lab.style.left) - parseFloat(b.style.left) + x, 48); L.style.pointerEvents = "none"; back.appendChild(L); B.onclick = fn; return [B, I, L]; };
    const reveal = (x) => { back.style.opacity = Math.min(1, -x / 100).toFixed(2); back.style.pointerEvents = x < -60 ? "auto" : "none"; };
    // 11-06 주형: 고정 단추의 연보라 바탕을 빼고 색 없는 회색(다른 화면 옅은 칸 #E5E3EA 가 반전 뒤 나오는 값)
    const [pB] = btn(proto.bPin, proto.iPin, proto.lPin, 242, c.pinned ? "고정 해제" : "고정", () => { c.pinned = !c.pinned; renderSaved(); P.react("happy"); });
    pB.querySelectorAll("img").forEach(i => i.style.visibility = "hidden"); pB.style.background = SAVED_TONE.neutral;
    // 11-06 주형: 삭제 단추가 검은 바탕 + 검은 아이콘 · 글자라 밀어도 안 보였다 — 원래 빨강이 포인트 색 정리(noAccent)로 잉크가 되고 화면 반전까지 겹침
    //   → 이 화면의 반전을 단추에서만 되돌리고(seed 칩과 같은 방법) iOS 삭제 빨강 바탕 + 흰 아이콘 · 글자
    const [dB, dI, dL] = btn(proto.bDel, proto.iDel, proto.lDel, 312, "삭제", () => confirmDelete(c)), UNDO = "invert(1) hue-rotate(180deg)";
    [dB, dI, dL].forEach(e => e.style.filter = UNDO); dB.style.background = "#FF3B30"; dB.querySelectorAll("img").forEach(i => i.style.visibility = "hidden");
    dI.querySelectorAll("img").forEach(i => i.style.filter = "brightness(0) invert(1)"); dL.style.color = "#FFFFFF";
    const layer = document.createElement("div"); layer.style.cssText = "position:absolute;left:0;top:0;width:390px;height:80px;transition:transform .25s cubic-bezier(.2,.8,.2,1);touch-action:pan-y"; wrap.appendChild(layer);
    const card = tone(clone(proto.card)); card.style.position = "absolute"; place(card, 16, 0); layer.appendChild(card);
    // 11-06 주형: 각주(거리 · 날짜, 오른쪽 위) 뺌 — 지금 결정에서 발산한 카드만 모이니 날짜 의미가 없음.
    //   고정 아이콘은 오른쪽 아래 → 제목 왼쪽(제목 줄 높이 24 가운데), 제목은 아이콘 폭 + 6 만큼 오른쪽으로
    //   11-06 진규: 제목 앞 고정 아이콘은 뺌 — 묶음 머리 '고정 N' 이 이미 말해 주고, 다른 목록(기록 · 휴지통)엔 제목 앞 아이콘이 없음
    const t = titleTok(clone(proto.title)); t.textContent = c.title; t.style.lineHeight = "24px"; place(t, 32, 16); layer.appendChild(t);   // 11-06 진규: 14 → 16 · 설명 44 → 46 — 제목 · 설명 묶음(45)을 카드(80) 세로 가운데로, 오른쪽 '발산하기' 단추와 같은 가운데
    const d = clone(proto.desc); d.textContent = c.desc; d.style.color = SAVED_TONE.sub; place(d, 32, 46); layer.appendChild(d);
    if (typeof SEED !== "undefined" && SEED.rowGo) SEED.rowGo(c, layer);   // 11-05 진규: 줄마다 '펼치기 ›' — 이 카드를 기준으로 발산 (diverge_seed.js)
    let st = null, open = false;
    noSelect(layer); layer.style.touchAction = "pan-y";
    layer.addEventListener("pointerdown", (e) => { e.preventDefault(); st = { x: e.clientX, base: open ? -140 : 0, moved: false }; layer.setPointerCapture(e.pointerId); layer.style.transition = "none"; });
    layer.addEventListener("pointermove", (e) => { if (!st) return; const dx = e.clientX - st.x; if (Math.abs(dx) > 4) st.moved = true; const x = Math.max(-160, Math.min(0, st.base + dx)); layer.style.transform = `translateX(${x}px)`; back.style.transition = "none"; reveal(x); st.dx = dx; });
    const end = () => { if (!st) return; const v = st.base + (st.dx || 0); if (st.moved) suppress(); st = null; set(v < -60); };
    // 11-06 주형: 여러 줄이 동시에 열린 채 남았다 → iOS 처럼 한 줄을 열면(또는 다른 줄을 누르기 시작하면) 열려 있던 줄은 닫힘
    const set = (o) => { open = o; layer.style.transition = "transform .25s cubic-bezier(.2,.8,.2,1)"; layer.style.transform = open ? "translateX(-140px)" : ""; back.style.transition = "opacity .2s"; reveal(open ? -140 : 0);
      if (open) { if (openRow && openRow !== close) openRow(); openRow = close; } else if (openRow === close) openRow = null; };
    const close = () => { if (open) set(false); };
    layer.addEventListener("pointerdown", () => { if (openRow && openRow !== close) openRow(); });
    layer.addEventListener("pointerup", end); layer.addEventListener("pointercancel", end);
  }
  let openRow = null;   // 지금 열려 있는 담은 카드 줄을 닫는 함수
  // 담은 카드(반전 화면) 필터 전 색 — 반전 뒤: bg #F7F6FA · card #EBEAEF · border #E0DFE5 · neutral #E5E3EA · ink #1A1626 · sub #6B6484
  const SAVED_TONE = { bg: "#09080C", card: "#151419", border: "#201F25", neutral: "#1C1A21", ink: "#E9E5F5", sub: "#9A93B3" };
  // 11-06 주형: 카드 제목이 16 · 700(볼드)이라 다른 화면보다 무거웠다 → 기록 목록(T1) 줄 제목 토큰 15 · 500 · 잉크
  function titleTok(t) { Object.assign(t.style, { fontSize: "15px", fontWeight: "500", color: SAVED_TONE.ink }); return t; }
  function pinIcon(x, y) { const pn = clone(savedUI.proto.pin); place(pn, x, y); Object.assign(pn.style, { width: "18px", height: "18px", pointerEvents: "none" }); return pn; }   // 고정 아이콘 18 (제목 줄 24 가운데)
  //   11-06 진규: 카드를 휴지통 묶음 카드와 같은 흰 카드(#FFF · 테두리 #E4E0EE · 모서리 12)로 — 회색 카드 위에 줄 단추(휴지통 '되살리기'와 같은 회색 알약)가 묻혀 다른 화면과 안 맞았음. 반전 화면이라 카드만 반전을 되돌리고 제 색
  function tone(card) { card.style.filter = "invert(1) hue-rotate(180deg)"; card.style.backgroundColor = "#FFFFFF"; card.style.borderColor = "#E4E0EE"; card.style.borderRadius = "12px"; card.querySelectorAll("img").forEach(i => i.style.visibility = "hidden"); return card; }
  const josa = (t) => { const ch = t.replace(/[…\s]+$/, "").slice(-1).charCodeAt(0); return ch >= 0xac00 && ch <= 0xd7a3 && (ch - 0xac00) % 28 ? "을" : "를"; };   // 받침 있으면 '을'
  function confirmDelete(c) {   // 삭제 확인 (어두운 판 — 다른 화면의 확인 창과 같은 구성: 제목·설명·[취소][지우기])
    const fig = savedUI.fig, dim = document.createElement("div"); dim.style.cssText = "position:absolute;inset:0;background:rgba(6,5,10,.6);z-index:20;display:grid;place-items:center;animation:inFade .18s ease-out";
    const fam = getComputedStyle(savedUI.proto.title).fontFamily;
    dim.innerHTML = `<div style="width:300px;border-radius:18px;background:#1c1730;border:1px solid rgba(255,255,255,.12);padding:22px 20px 16px;font-family:${fam.replace(/"/g, "'")};text-align:center">
      <div style="font-size:17px;font-weight:700;color:#f5f2fc">‘${c.title}’${josa(c.title)} 지울까요?</div>
      <div style="margin-top:8px;font-size:13px;color:#c4bdd8;line-height:1.45">지운 카드는 되돌릴 수 없어요</div>
      <div style="display:flex;gap:8px;margin-top:20px"><button data-a="no" style="flex:1;height:46px;border:0;border-radius:12px;background:rgba(255,255,255,.08);color:#f5f2fc;font:600 15px ${fam.replace(/"/g, "'")};cursor:pointer">취소</button>
      <button data-a="yes" style="flex:1;height:46px;border:0;border-radius:12px;background:#ff5b4d;color:#fff;font:700 15px ${fam.replace(/"/g, "'")};cursor:pointer">지우기</button></div></div>`;
    dim.addEventListener("click", (e) => { const a = e.target.dataset && e.target.dataset.a; if (e.target === dim || a === "no") dim.remove(); if (a === "yes") { dim.remove(); SAVED.splice(SAVED.indexOf(c), 1); updateCount(); P.expr("sad"); P.after(1200, () => P.expr(null)); renderSaved(); } });
    fig.appendChild(dim);
  }

  // ---------- ④ 가로로 넘치는 줄 끌어 넘기기 ----------
  function scroller(id, top, bottom) {   // 줄 요소는 누를 때마다 다시 모은다 (연결하면 칩이 늘어난다)
    const s = P.SCR[id]; if (!s) return; const fig = s.fig; let shift = 0, st = null, els = [], max = 0;
    const collect = () => {
      els = [...fig.children].filter(k => k.offsetTop >= top && k.offsetTop + k.offsetHeight <= bottom && k.style.display !== "none" && k.style.visibility !== "hidden");
      els.forEach(k => { if (k.dataset.x0 === undefined) { k.dataset.x0 = parseFloat(k.style.left) || 0; k._tfX0 = k.style.transform || ""; k.style.userSelect = "none"; k.querySelectorAll("img").forEach(i => i.draggable = false); } });   // 11-06 진규(아이폰): left 는 그대로 두고 transform 으로 민다
      const boxes = els.filter(k => k.tagName !== "P");   // 칩 글자(P)는 가운데 정렬(translate -50%)이라 칩 상자로만 오른쪽 끝을 잰다
      max = els.length ? Math.max(0, Math.max(...(boxes.length ? boxes : els).map(k => +k.dataset.x0 + k.offsetWidth)) - 374) : 0;
      if (shift) move(shift);   // 새로 붙은 칩도 지금 민 만큼
    };
    const move = (x) => { shift = Math.max(-max, Math.min(0, x)); els.forEach(k => k.style.transform = shift ? `translate3d(${shift.toFixed(2)}px,0,0) ${k._tfX0 || ""}` : (k._tfX0 || "")); };   // 11-06 진규(아이폰): left(매번 배치 다시 계산) → transform
    const inRow = (e) => { const r = fig.getBoundingClientRect(), z = r.width / 390, y = (e.clientY - r.top) / z; return y >= top && y <= bottom ? z : 0; };
    s.el.addEventListener("dragstart", (e) => e.preventDefault());
    s.el.addEventListener("pointerdown", (e) => { const z = inRow(e); if (!z) return; collect(); if (max) st = { x: e.clientX, base: shift, moved: false, z }; });
    addEventListener("pointermove", (e) => { if (!st) return; const dx = (e.clientX - st.x) / st.z; if (Math.abs(dx) > 6) st.moved = true; if (st.moved) move(st.base + dx); });
    addEventListener("pointerup", () => { if (st && st.moved) suppress(); st = null; });
    s.el.addEventListener("wheel", (e) => { const z = inRow(e); if (!z) return; const d = e.deltaX || (e.shiftKey ? e.deltaY : 0) || e.deltaY; collect(); if (!max) return; e.preventDefault(); move(shift - d / z); }, { passive: false });   // 마우스 휠·트랙패드로도
  }

  // 홈 추천 키워드: 와이어프레임엔 칩 3개(셋째는 화면 밖으로 잘림) → 같은 모양 칩을 뒤에 이어 붙여 끌어서 넘길 거리를 만든다. 누르면 같은 틀로 답
  const MORE_CHIPS = [["할 일 담당 정리", "H6"], ["다음 회의 안건", "H6"], ["지난 결정 다시 보기", "H7"]];
  function moreChips(id) {
    const fig = P.SCR[id] && P.SCR[id].fig; if (!fig) return; const last = byName(fig, "칩 교수님 피드백"); if (!last) return;
    const lab = [...fig.querySelectorAll("p")].find(p => p.offsetTop === last.offsetTop && p.textContent.trim().startsWith("교수님")); if (!lab) return;
    const ruler = document.createElement("span"); ruler.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${getComputedStyle(lab).font}`; document.body.appendChild(ruler);
    let x = last.offsetLeft + last.offsetWidth + 8;
    for (const [t, to] of MORE_CHIPS) {
      ruler.textContent = t; const w = Math.ceil(ruler.offsetWidth) + 32;
      const c = clone(last), p = clone(lab); c.dataset.name = "칩 " + t; place(c, x, last.offsetTop); c.style.width = w + "px"; p.textContent = t; place(p, x + w / 2, lab.offsetTop); p.style.width = w + "px"; p.style.pointerEvents = "none";
      c.style.cursor = "pointer"; c.onclick = () => ACTIONS.ask({ from: id, to }); last.parentElement.insertBefore(p, last.nextSibling); last.parentElement.insertBefore(c, p);
      x += w + 8;
    }
    ruler.remove();
  }
  // ---------- ⑤ 연결 상태 (11-05 주형 다시 씀): 서비스마다 연결됨/안 됨을 들고, 바뀔 때마다 목록 · 상세를 그 상태로 다시 그린다. 재시작하면 처음 상태 ----------
  //   자료 연결(M3-C): 연결됨 = 위 칩 줄, 안 됨 = 아래 「더 연결하기」 카드. ai 연결(M4-A): 연결됨 = 위 상자 안 줄(● 연결됨 ›), 안 됨 = 「연결할 수 있어요」 줄(연결 버튼)
  //   상세: 연결되면 상태 글 '연결됨' + 아래 「연결 끊기」, 끊으면 '아직 연결 안 됨' + 원래 연결 버튼(처음부터 연결돼 있던 서비스는 「다시 연결」)
  //   연결을 끝내는 순간엔 M3-C · M4-A 가 안 보이는 화면이라 화면 좌표(rect · offset)가 0 → 요소에 적힌 스타일 값으로 계산
  const centerIn = (k, el) => { const a = k.getBoundingClientRect(), r = el.getBoundingClientRect(), x = a.left + a.width / 2, y = a.top + a.height / 2; return a.width > 0 && x > r.left && x < r.right && y > r.top && y < r.bottom; };
  const sg = (k) => { const w = parseFloat(k.style.width) || 0, h = parseFloat(k.style.height) || 0;   // 피그마 글자는 left 를 가운데로 두고 translate -50% 로 당기는 게 있음(--tw-translate-x) → 실제 왼쪽으로 고쳐 셈
    const half = /--tw-translate-x:\s*calc\(calc\(1 \/ 2 \* 100%\) \* -1\)/.test(k.getAttribute("style") || "");
    return { x: (parseFloat(k.style.left) || 0) - (half ? w / 2 : 0), y: parseFloat(k.style.top) || 0, w, h }; };
  const cin = (k, box) => { const a = sg(k), b = sg(box), cx = a.x + a.w / 2, cy = a.y + a.h / 2; return cx > b.x && cx < b.x + b.w && cy > b.y && cy < b.y + b.h; };
  const groupIn = (fig, box) => [box, ...[...fig.children].filter(k => k !== box && cin(k, box))];   // 그 상자 안에 그려진 것(바탕 · 로고 · 글자 · 버튼)
  const moveBy = (els, dx, dy) => els.forEach(k => { k.style.left = (parseFloat(k.style.left) + dx) + "px"; k.style.top = (parseFloat(k.style.top) + dy) + "px"; });
  const showG = (els, on) => (els || []).forEach(k => k.style.display = on ? "" : "none");
  const fitLogo = (src, box, cx, cy) => { const l = clone(src), a = sg(src), k = box / Math.max(a.w || box, a.h || box), w = (a.w || box) * k, h = (a.h || box) * k;   // 비율 그대로 box 칸에 맞춰 (cx, cy) 가운데
    l.style.width = w + "px"; l.style.height = h + "px"; l.style.pointerEvents = "none"; l.querySelectorAll("img").forEach(i => { i.style.width = "100%"; i.style.height = "100%"; }); place(l, cx - w / 2, cy - h / 2); return l; };
  const SERV_M3 = [   // 순서 = 목록 순서. 처음 셋은 처음부터 연결됨(칩), 넷은 카드
    { d: "M3-D", name: "피그마", chip: "연결 칩 피그마", desc: "코멘트 · 프레임을 기록으로", on: true }, { d: "M3-N", name: "노션", chip: "연결 칩 노션", desc: "회의록 · 결정 페이지를 기록으로", on: true },
    { d: "M3-G", name: "구글 드라이브", chip: "연결 칩 구글 드라이브", desc: "문서 · 슬라이드를 기록으로", on: true },
    { d: "M3-K", name: "카톡", nid: "866:5556" }, { d: "M3-L", name: "구글 캘린더", nid: "866:5575" }, { d: "M3-MD", name: "개인 md", nid: "866:5585" }, { d: "M3-SL", name: "슬랙", nid: "866:5597" }];
  // off = 처음부터 연결돼 있던 ai 를 끊었을 때 아래 글
  const SERV_M4 = [{ d: "M4-GPT", name: "ChatGPT", on: true, off: "OpenAI 계정으로 연결" }, { d: "M4-CL", name: "Claude", on: true, off: "Anthropic 계정으로 연결" }, { d: "M4-GE", name: "Gemini", nid: "866:4849" }, { d: "M4-PX", name: "Perplexity", nid: "866:4858" }, { d: "M4-CP", name: "Copilot", nid: "866:4865" }];
  const SERV = Object.fromEntries([...SERV_M3, ...SERV_M4].map(s => [s.d, s]));
  const isConn = (d) => !!(SERV[d] && SERV[d].on);
  const CONN = { has: isConn };   // 예전 이름(다른 곳에서 CONN.has 로 씀)
  // ---- 자료 연결(M3-C) ----
  let M3_READY = false;
  function m3Init(mc) {
    if (M3_READY) return; M3_READY = true;
    for (const s of SERV_M3) {
      const chip = byName(mc, s.chip); if (chip) s.chipG = groupIn(mc, chip);
      if (s.nid) { const b = mc.querySelector(`[data-node-id="${s.nid}"]`), card = b && [...mc.children].find(k => /^카드 /.test(k.dataset.name || "") && cin(b, k)); if (card) { s.cardG = groupIn(mc, card); s.logo = s.cardG.find(k => /^logo /.test(k.dataset.name || "")); } }
    }
  }
  function m3Chip(mc, s) {   // 칩 만들기: 첫 칩(피그마)을 틀로 복제 — 글자 폭은 재서, 점은 글자 뒤 12
    const tpl = SERV_M3[0].chipG, base = tpl[0], lab = tpl.find(k => k.tagName === "P"), logo = tpl.find(k => /^logo /.test(k.dataset.name || "")), dot = tpl.find(k => k.dataset.name === "연결 점");
    const ruler = document.createElement("span"); ruler.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${getComputedStyle(lab).font}`; ruler.textContent = s.name; document.body.appendChild(ruler); const tw = Math.ceil(ruler.offsetWidth); ruler.remove();
    const L = (k) => sg(k).x - sg(base).x, w = L(lab) + tw + 12 + (sg(base).w - L(dot));
    const c = clone(base); c.dataset.name = "연결 칩 " + s.name; c.style.width = w + "px"; c.style.cursor = "pointer"; c.onclick = () => P.show(s.d, "push");
    const g = fitLogo(s.logo || logo, 18, sg(base).x + L(logo) + 6, sg(base).y + sg(base).h / 2);
    const p = clone(lab); p.textContent = s.name; p.style.width = tw + "px"; p.style.pointerEvents = "none";
    const o = clone(dot); o.style.pointerEvents = "none"; place(o, sg(base).x + w - (sg(base).w - L(dot)), sg(dot).y);
    [c, g, p, o].forEach(k => mc.appendChild(k)); s.chipG = [c, g, p, o];
  }
  function m3Card(mc, s) {   // 카드 만들기(처음부터 연결돼 있던 서비스를 끊었을 때): 카톡 카드를 틀로 복제 — 로고 · 이름 · 설명 바꾸고 「연결」은 그 서비스 연결로
    const tpl = SERV_M3.find(x => x.cardG).cardG, ps = tpl.filter(k => k.tagName === "P").sort((a, b) => sg(a).y - sg(b).y || sg(a).x - sg(b).x);
    const chipLogo = s.chipG && s.chipG.find(k => /^logo /.test(k.dataset.name || ""));
    s.cardG = tpl.map(k => { if (/^logo /.test(k.dataset.name || "") && chipLogo) { const tile = tpl.find(x => x.dataset.name === "로고 타일"); return fitLogo(chipLogo, 23, sg(tile).x + sg(tile).w / 2, sg(tile).y + sg(tile).h / 2); }
      const c = clone(k); if (k === ps[0]) c.textContent = s.name; else if (k === ps[1]) c.textContent = s.desc || ""; return c; });
    s.cardG[0].dataset.name = "카드 " + s.name; s.cardG[0].style.cursor = "pointer"; s.cardG[0].onclick = () => P.show(s.d, "push");   // 카드 = 상세 (다른 카드와 같게)
    s.cardG.filter(k => /^btn /.test(k.dataset.name || "") || (k.tagName === "P" && k.textContent.trim() === "연결")).forEach(k => { k.style.cursor = "pointer"; k.onclick = () => reconnect(s.d); });
    s.cardG.forEach(k => mc.appendChild(k));
  }
  function m3Render() {
    const mc = P.SCR["M3-C"] && P.SCR["M3-C"].fig; if (!mc) return; m3Init(mc);
    for (const s of SERV_M3) {
      if (s.on && !s.chipG) m3Chip(mc, s);
      if (!s.on && !s.cardG) m3Card(mc, s);
      showG(s.chipG, s.on); showG(s.cardG, !s.on);
    }
    // 칩 줄: 넘치면 다음 줄(48). 「더 연결하기」 머리는 칩 아래 26, 카드는 2열(16 · 200) × 행 176
    const chips = SERV_M3.filter(s => s.on && s.chipG), y0 = 126; let x = 16, y = y0;
    for (const s of chips) { const c = s.chipG[0], w = sg(c).w; if (x > 16 && x + w > 374) { x = 16; y += 48; } moveBy(s.chipG, x - sg(c).x, y - sg(c).y); x += w + 8; }
    const head = [...mc.querySelectorAll("p")].find(p => p.textContent.trim() === "더 연결하기"), cards = SERV_M3.filter(s => !s.on && s.cardG);
    if (!head) return; const hy = (chips.length ? y + 40 : y0) + 26; head.style.top = hy + "px"; head.style.display = cards.length ? "" : "none";
    cards.forEach((s, i) => moveBy(s.cardG, (i % 2 ? 200 : 16) - sg(s.cardG[0]).x, hy + 26 + Math.floor(i / 2) * 176 - sg(s.cardG[0]).y));
  }
  // ---- ai 연결(M4-A) ----
  let M4_READY = false, M4_LINES = [];
  function m4Init(ma) {
    if (M4_READY) return; M4_READY = true;
    const kids = [...ma.children], box = byName(ma, "연결됨 그룹");
    const tiles = kids.filter(k => k.dataset.name === "로고 타일").sort((a, b) => sg(a).y - sg(b).y);
    const rowOf = (t) => kids.filter(k => k !== box && k.dataset.name !== "line" && sg(k).y >= sg(t).y - 1 && sg(k).y < sg(t).y + 40 && sg(k).x < 380);
    const isMark = (k) => k.dataset.name === "연결 점" || k.dataset.name === "icon chev" || (k.tagName === "P" && k.textContent.trim() === "연결됨");
    const isBtn = (k) => /^btn 연결/.test(k.dataset.name || "") || (k.tagName === "P" && k.textContent.trim() === "연결");
    SERV_M4.forEach((s, i) => { const g = rowOf(tiles[i]); s.tile = tiles[i]; s.base = g.filter(k => !isMark(k) && !isBtn(k)); s.marks = g.filter(isMark); s.btns = g.filter(isBtn);
      const ps = s.base.filter(k => k.tagName === "P").sort((a, b) => sg(a).y - sg(b).y); s.sub = ps[1]; s.subOff = s.off || (ps[1] && ps[1].textContent); });
    // 없는 쪽 장식은 다른 줄에서 빌려 만듦: 연결됨 줄 ← ChatGPT 의 ● 연결됨 ›, 연결 버튼 ← Gemini 의 버튼 (줄 칸 위 기준 상대 자리)
    const markSrc = SERV_M4[0], btnSrc = SERV_M4.find(s => s.btns.length);
    for (const s of SERV_M4) {
      // 복제는 원래 left 값 그대로(가운데 기준 글자는 translate -50% 가 따라오므로 sg 의 고친 x 를 쓰면 반만큼 두 번 밀림)
      if (!s.marks.length) s.marks = markSrc.marks.map(k => { const c = clone(k); c.style.pointerEvents = "none"; c.style.top = (sg(k).y - sg(markSrc.tile).y + sg(s.tile).y) + "px"; ma.appendChild(c); return c; });
      if (!s.btns.length) s.btns = btnSrc.btns.map(k => { const c = clone(k); c.style.top = (sg(k).y - sg(btnSrc.tile).y + sg(s.tile).y) + "px"; c.style.cursor = "pointer"; c.onclick = () => reconnect(s.d); ma.appendChild(c); return c; });
    }
    kids.filter(k => k.dataset.name === "line" && box && cin(k, box)).forEach(k => k.style.display = "none");   // 구분선은 그릴 때마다 새로
  }
  function m4Render() {
    const ma = P.SCR["M4-A"] && P.SCR["M4-A"].fig; if (!ma) return; m4Init(ma);
    const box = byName(ma, "연결됨 그룹"), on = SERV_M4.filter(s => s.on), off = SERV_M4.filter(s => !s.on), B = sg(box);
    const place2 = (s, tx, ty) => { const dx = tx - sg(s.tile).x, dy = ty - sg(s.tile).y; moveBy(s.base, dx, dy); moveBy([...s.marks, ...s.btns], 0, dy); };
    on.forEach((s, i) => { place2(s, 32, B.y + 14 + i * 64); showG(s.marks, true); showG(s.btns, false); if (s.sub) s.sub.textContent = "계정 연결 · 이후 자동"; });
    box.style.height = (on.length * 64) + "px"; box.style.display = on.length ? "" : "none";
    M4_LINES.forEach(l => l.remove()); M4_LINES = [];
    const lineSrc = [...ma.children].find(k => k.dataset.name === "line");
    if (lineSrc) for (let i = 1; i < on.length; i++) { const l = clone(lineSrc); l.style.display = ""; place(l, 80, B.y + 14 + (i - 1) * 64 + 49); ma.appendChild(l); M4_LINES.push(l); }
    const headOn = [...ma.querySelectorAll("p")].find(p => /^연결됨 \d+$/.test(p.textContent.trim())), headOff = [...ma.querySelectorAll("p")].find(p => /^연결할 수 있어요/.test(p.textContent.trim()));
    if (headOn) headOn.textContent = `연결됨 ${on.length}`;
    const hy = on.length ? B.y + on.length * 64 + 28 : B.y;
    if (headOff) { headOff.textContent = `연결할 수 있어요 ${off.length}`; headOff.style.top = hy + "px"; headOff.style.display = off.length ? "" : "none"; }
    off.forEach((s, i) => { place2(s, 24, hy + 36 + i * 60); showG(s.marks, false); showG(s.btns, true); if (s.sub) s.sub.textContent = s.subOff; });
  }
  // ---- 상세 화면 ----
  const DETAIL = {};
  function detailInit(d) {
    if (DETAIL[d] || !P.SCR[d]) return DETAIL[d]; const fig = P.SCR[d].fig, kids = [...fig.children];
    const st = kids.find(k => k.tagName === "P" && Math.abs(sg(k).y - 201) < 4), dot = kids.find(k => k.dataset.name === "상태 점");
    const btnAt = (re) => { const b = kids.find(k => re.test(k.dataset.name || "") && Math.abs(sg(k).y - 760) < 4); return b ? [b, ...kids.filter(k => k !== b && k.tagName === "P" && cin(k, b))] : null; };
    const D = DETAIL[d] = { fig, st, stText: st && st.textContent, dot, cta: btnAt(/^btn (?!연결 끊기)/), dis: btnAt(/^btn 연결 끊기/) };
    const srcDis = DETAIL["M3-D"] || (d !== "M3-D" && detailInit("M3-D"));
    if (!D.dis && srcDis && srcDis.dis) { D.dis = srcDis.dis.map(k => { const c = clone(k); c.style.cursor = "pointer"; c.onclick = () => ACTIONS.disconnect({ from: d }); fig.appendChild(c); return c; }); showG(D.dis, false); }   // 연결 끊기가 없던 서비스(처음엔 안 됨)
    if (!D.cta) { const src = detailInit("M3-SL"); if (src && src.cta) { D.cta = src.cta.map(k => { const c = clone(k); if (c.tagName === "P") c.textContent = "다시 연결"; c.style.opacity = ""; c.style.pointerEvents = ""; c.style.cursor = "pointer"; c.onclick = () => reconnect(d); fig.appendChild(c); return c; }); D.ctaMade = true; showG(D.cta, false); } }   // 처음부터 연결돼 있던 서비스의 「다시 연결」
    return D;
  }
  function detailRender(d) {
    const D = detailInit(d); if (!D) return; const on = isConn(d);
    if (D.st) D.st.textContent = on ? (/^연결됨/.test(D.stText) ? D.stText : "연결됨 · 방금 연결했어요") : (/^아직 연결 안 됨/.test(D.stText) ? D.stText : "아직 연결 안 됨 · 다시 연결할 수 있어요");
    if (D.dot) { D.dot.querySelectorAll("img").forEach(i => i.style.visibility = "hidden"); D.dot.style.backgroundColor = on ? "#1c1730" : "#c4bdd8"; D.dot.style.borderRadius = "50%"; }
    showG(D.dis, on);
    if (D.cta) { if (on) D.cta.forEach(k => { k.style.display = D.ctaMade ? "none" : ""; k.style.opacity = "0"; k.style.pointerEvents = "none"; }); else D.cta.forEach(k => { k.style.display = ""; k.style.opacity = ""; k.style.pointerEvents = ""; }); }
  }
  function setConn(d, on) {
    if (!SERV[d] || SERV[d].on === on) return; SERV[d].on = on;
    detailRender(d); if (d.startsWith("M3")) m3Render(); else m4Render();
    if (INK_RUN) setTimeout(INK_RUN, 60);   // 같은 화면 안에서 새로 생긴 잉크 버튼(다시 연결 등) 글씨도 밝게 — inkText 는 화면이 바뀔 때만 돌아서
  }
  const markConnected = (d) => setConn(d, true);
  // 다시 연결: 그 서비스의 로그인 · 고르기 흐름 (상세에 있을 때)
  function reconnect(d) {
    if (P.cur() !== d) { P.show(d, "push"); return P.after(380, () => reconnect(d)); }
    const b = window.BROWSER_FIRST && BROWSER_FIRST[d]; if (b) return P.show(b, "push");
    if (d === "M3-D") return P.show("C-L-figma", "sheet");
    const c = CONNECT.find(x => x[0] === d); if (c) P.show(c[2], "sheet");
  }
  // 연결이 끝나는 두 동작(외부 로그인 허용 · 가져오기)에 붙여 연결됨으로. 이미 연결된 서비스의 「연결」은 상세만 연다
  function wireConnect() {
    const done = ACTIONS.connectDone, imp = ACTIONS.importDone, open = ACTIONS.openConnect;
    ACTIONS.connectDone = (o) => { done(o); markConnected(P.cur()); };
    // 가져오기: 고른 줄 이름을 상세의 '가져온 기록 · 가져올 곳 · 읽을 프로젝트' 칸에 (전엔 '로그인하면 채널을 골라요' 등이 그대로 남았다)
    ACTIONS.importDone = (o) => {
      const sf = P.SCR[o.from] && P.SCR[o.from].fig, names = sf ? [...sf.querySelectorAll('[data-name^="행 "]')].filter(r => [...sf.querySelectorAll('[data-name="선택됨"]')].some(m => m.style.visibility !== "hidden" && getComputedStyle(m).display !== "none" && centerIn(m, r))).map(r => r.dataset.name.slice(2).trim()) : [];
      imp(o); const d = P.cur(); markConnected(d);
      const f = P.SCR[d] && P.SCR[d].fig, box = f && byName(f, "가져온 기록"), lab = box && [...f.children].find(k => k.tagName === "P" && k !== box && cin(k, box));
      if (lab && names.length) lab.textContent = names.join(" · ");
      backToOnboard(d);
    };
    // 연결 끊기 → 안 됨으로: 목록에선 「더 연결하기 · 연결할 수 있어요」로 돌아가고, 상세는 '아직 연결 안 됨' + 연결 버튼. 전엔 아무 일 없었다
    ACTIONS.disconnect = ({ from }) => { const d = SERV[from] ? from : P.cur(); setConn(d, false); toast("연결을 끊었어요"); P.plan("idle"); };
    ACTIONS.openConnect = (o) => isConn(o.to) ? P.show(o.to, "push") : open(o);
    // 서비스 상세의 '가져온 기록 · 읽을 프로젝트' — 연결 전엔 로그인 시트(C-L-*), 연결 뒤엔 로그인 없이 고르는 바텀 시트(C-I-*)만
    ACTIONS.readFrom = ({ from, to }) => { const k = /^C-L-(.+)$/.exec(to || ""); P.show(k && isConn(from) && AFTER_LOGIN[k[1]] ? AFTER_LOGIN[k[1]] : to, "sheet"); };
    // 로그아웃: 사이드바를 닫고 알림 뒤 처음 화면(온보딩 첫 장)으로 — 전엔 눌러도 반응 없었다
    ACTIONS.logout = () => { P.back(); toast("로그아웃했어요"); P.after(800, () => P.show("OB-1", "jump")); };
    const tile = ACTIONS.connect; ACTIONS.connect = (o) => o.from === "OB-3" ? tapTile(o) : tile(o);
  }

  // ---------- ⑥ 온보딩 연결(OB-3): 피그마만 되던 것을 타일 전부 — 각 서비스의 연결 흐름(상세 + 로그인/가져올 곳)을 타고, 끝나면 온보딩으로 돌아와 타일이 선택됨 ----------
  const OB_TILE = { "타일 ChatGPT": "M4-GPT", "타일 Claude": "M4-CL", "타일 Gemini": "M4-GE", "타일 노션": "M3-N", "타일 구글 드라이브": "M3-G", "타일 카톡": "M3-K", "타일 캘린더": "M3-L", "타일 개인 md": "M3-MD" };
  const tileOn = (t) => !!t.dataset.on || [...t.parentElement.querySelectorAll('[data-name="icon checkc"]')].some(c => centerIn(c, t) && c.style.visibility !== "hidden");
  function tapTile({ el }) {
    const t = el.closest('[data-name^="타일 "]') || el, d = OB_TILE[t.dataset.name]; if (!d) return;
    if (tileOn(t)) return P.show(d, "push");   // 이미 연결된 타일은 상세만
    ACTIONS.openConnect({ from: "OB-3", to: d });
  }
  function selectTile(d) {   // 선택된 타일(피그마)의 테두리와 체크 표시를 그대로 옮겨 붙인다
    const fig = P.SCR["OB-3"].fig, name = Object.keys(OB_TILE).find(k => OB_TILE[k] === d), t = name && byName(fig, name), ref = byName(fig, "타일 피그마"); if (!t || !ref || tileOn(t)) return;
    t.style.borderColor = ref.style.borderColor; t.style.borderWidth = ref.style.borderWidth; t.style.borderStyle = ref.style.borderStyle; t.dataset.on = "1";
    const chk = [...fig.querySelectorAll('[data-name="icon checkc"]')].find(c => centerIn(c, ref));
    if (chk) { const c = clone(chk); place(c, parseFloat(chk.style.left) - parseFloat(ref.style.left) + parseFloat(t.style.left), parseFloat(chk.style.top) - parseFloat(ref.style.top) + parseFloat(t.style.top)); fig.appendChild(c); }
    P.react("happy");
  }
  function backToOnboard(d) {
    const st = P.stack().map(s => s.id); if (st[st.length - 2] !== "OB-3" || !Object.values(OB_TILE).includes(d)) return;
    P.after(500, () => { P.back(); P.after(300, () => selectTile(d)); });
  }

  // ---------- ⑦ 원문 전사(T2-1): 33분 회의인데 24:10 에서 끝나 스크롤할 게 없었다 → 뒷부분 줄을 같은 모양으로 잇고, 머리·재생 바 사이를 스크롤 ----------
  const MORE_LINES = [   // (추정) 와이어프레임에 없는 뒷부분 — 다른 화면의 결정·할 일과 맞춘 문장
    ["26:05", "주형", "손잡이에 메모를 남기는 방식이면 들고 다니는 형태가 맞을 것 같아요."],
    ["27:40", "진규", "그럼 설치형은 우산꽂이 쪽만 남기고, 우산은 가볍게 가죠."],
    ["29:15", "팀원 A", "다음 회의 전까지 정류장 세 곳 사진 찍어 올게요."],
    ["31:02", "주형", "사용 상황 세 개는 제가 정리해서 공유 문서에 올릴게요."],
    ["32:48", "진규", "좋아요. 오늘은 여기까지 할게요."],
  ];
  function transcript() {
    const s = P.SCR["T2-1"]; if (!s) return; const fig = s.fig, top = 170, bottom = 756;
    const time = pText(fig, "12:02"), who = [...fig.querySelectorAll("p")].find(p => p.textContent.trim() === "주형"), text = pText(fig, "정류장 우산 얘기"); if (!time || !who || !text) return;
    const box = document.createElement("div"); box.style.cssText = `position:absolute;left:0;top:${top}px;width:390px;height:${bottom - top}px;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain`;
    const inside = [...fig.children].filter(k => k.offsetTop >= top && k.offsetTop < bottom && k.dataset.name !== "플레이어 바" && k.dataset.name !== "line");
    const end = Math.max(...inside.map(k => k.offsetTop + k.offsetHeight));
    const lines = MORE_LINES.map(([t, w, x], i) => { const y = end + 24 + i * 92 - time.offsetTop; return [clone(time), clone(who), clone(text)].map((c, k) => { c.textContent = [t, w, x][k]; place(c, parseFloat([time, who, text][k].style.left), [time, who, text][k].offsetTop + y); return c; }); }).flat();
    for (const k of [...inside, ...lines]) { k.style.top = (parseFloat(k.style.top) - top) + "px"; box.appendChild(k); }
    const pad = document.createElement("div"); pad.style.cssText = `position:absolute;left:0;top:${end + 24 + MORE_LINES.length * 92 - top}px;width:1px;height:24px`; box.appendChild(pad);
    fig.insertBefore(box, fig.firstChild.nextSibling);
    // 휠은 브라우저가 해 주고, 마우스로 끌어 올리기·내리기는 여기서 (폰처럼)
    let st = null; box.style.userSelect = "none"; box.addEventListener("dragstart", (e) => e.preventDefault());
    box.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") st = { y: e.clientY, top: box.scrollTop, moved: false }; });
    addEventListener("pointermove", (e) => { if (!st) return; const dy = e.clientY - st.y; if (Math.abs(dy) > 5) st.moved = true; if (st.moved) box.scrollTop = st.top - dy / (box.getBoundingClientRect().height / box.offsetHeight); });
    addEventListener("pointerup", () => { if (st && st.moved) suppress(); st = null; });
  }
  // ---------- ⑧ 입력 커서: 피그마에선 글 길이와 상관없이 고정 좌표라 글자 중간에 떠 있었다(OB-1 "프로덕트|디자인4") → 그 글의 마지막 글자 바로 뒤로 옮기고 깜빡이게 ----------
  function fixCarets() {
    const st = document.createElement("style"); st.textContent = "@keyframes app5caret{0%,49%{opacity:1}50%,100%{opacity:0}} .app5-caret{animation:app5caret 1s steps(1) infinite}"; document.head.appendChild(st);
    for (const id of Object.keys(P.SCR)) for (const c of P.SCR[id].fig.querySelectorAll('[data-name="커서"]')) {
      const fig = P.SCR[id].fig, z = fig.getBoundingClientRect().width / 390 || 1, cr = c.getBoundingClientRect(), cy = cr.top + cr.height / 2;
      const p = [...fig.querySelectorAll("p")].filter(q => { const r = q.getBoundingClientRect(); return r.width && cy > r.top - 4 && cy < r.bottom + 4 && r.left <= cr.left + 2; }).sort((a, b) => b.getBoundingClientRect().left - a.getBoundingClientRect().left)[0];
      if (!p || !p.textContent.trim()) continue;
      c._p = p; caretAfter(c, p, z); c.classList.add("app5-caret");
    }
  }
  function caretAfter(c, p, z) {   // 커서를 글 p 의 마지막 글자 바로 뒤로 (글이 비면 글 시작 자리)
    const fr = c.offsetParent.getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(p);
    const rects = [...rg.getClientRects()].filter(r => r.width > 0), last = rects[rects.length - 1], pr = p.getBoundingClientRect();
    const x = last ? last.right : pr.left, y = last ? last.top + last.height / 2 : pr.top + pr.height / 2;
    place(c, Math.round((x - fr.left) / z + 2), Math.round((y - fr.top) / z - c.offsetHeight / 2));
  }
  // ---------- ⑨ 타이핑: 입력칸으로 보이는 곳 전부를 실제 키보드(한글 조합 포함)로. 글 자리에 같은 글꼴의 <input>/<textarea> 를 겹치고, 칸마다 원래 동작에 친 글을 넘긴다 ----------
  // 프로젝트 이름(OB-1)·주제(OB-2)를 고치면 그 글이 나오는 모든 화면(헤더·관리 메뉴·멤버 제목·연결 화면…)에 바로 반영. 재시작하면 처음 글로.
  const hasBatchim = (t) => { const ch = t.trim().slice(-1); if (/[0-9]/.test(ch)) return "013678".includes(ch); const n = ch.charCodeAt(0); return n >= 0xac00 && n <= 0xd7a3 && (n - 0xac00) % 28 > 0; };
  const JOSA = { "을": ["을", "를"], "를": ["을", "를"], "이": ["이", "가"], "가": ["이", "가"], "은": ["은", "는"], "는": ["은", "는"], "과": ["과", "와"], "와": ["과", "와"] };
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function replaceAll(from, to, keep) {   // 모든 화면의 글자 마디에서 from → to (뒤 조사도 받침에 맞춰). keep(글) 이 참이면 그 마디는 그대로(파일 이름 등)
    if (!from || from === to) return; const re = new RegExp(esc(from) + "(을|를|이|가|은|는|과|와)?(?![가-힣])", "g");
    for (const id of Object.keys(P.SCR)) { const w = document.createTreeWalker(P.SCR[id].fig, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) if (n.nodeValue.includes(from) && !(keep && keep(n.nodeValue))) n.nodeValue = n.nodeValue.replace(re, (m, j) => to + (j ? JOSA[j][hasBatchim(to) ? 0 : 1] : "")); }
  }
  function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; $("phone").appendChild(t); setTimeout(() => t.classList.add("off"), 1300); setTimeout(() => t.remove(), 1600); }
  const FIELDS = {};
  // p: 칸 안의 글(값 또는 안내 글), box: 칸, right: 입력이 끝나는 x(칸 안 오른쪽 버튼 앞), ph: 안내 글이면 true(값은 비우고 안내로), multi: 여러 줄
  function field(id, { p, box, right, ph, multi, color, onEnter, onInput, onBlur, label }) {
    const fig = P.SCR[id].fig, cs = getComputedStyle(p), inp = document.createElement(multi ? "textarea" : "input"), c = [...fig.querySelectorAll('[data-name="커서"]')].find(k => k._p === p);
    const text = p.textContent.trim(), L = p.offsetLeft, R = right ?? (box.offsetLeft + box.offsetWidth - 12);
    inp.className = "app5-in"; inp.setAttribute("aria-label", label || text); inp.spellcheck = false;
    if (p.classList.contains("sheetpart")) inp.classList.add("sheetpart");   // 11-05 진규: 시트 속 칸(예: R1-1 외부 참여자 이름)은 입력칸도 시트와 같이 올라오게 — 먼저 제자리에 떠 있었음
    if (ph) { inp.placeholder = text; inp.value = ""; } else inp.value = text;
    inp.style.cssText = `position:absolute;left:${L}px;top:${p.offsetTop}px;width:${R - L}px;height:${multi ? box.offsetTop + box.offsetHeight - p.offsetTop - 48 : p.offsetHeight}px;margin:0;padding:0;border:0;outline:none;background:transparent;resize:none;font:${cs.font};letter-spacing:${cs.letterSpacing};line-height:${multi ? cs.lineHeight : "normal"};color:${color || cs.color};--ph:${cs.color};caret-color:${(c && c.style.backgroundColor) || "#1c1730"};z-index:2`;
    p.style.visibility = "hidden"; p.after(inp);
    inp.addEventListener("focus", () => { if (c) c.style.visibility = "hidden"; if (!ph) { const n = inp.value.length; inp.setSelectionRange(n, n); } });
    inp.addEventListener("blur", () => { if (!ph) p.textContent = inp.value; if (c) { caretAfter(c, p, fig.getBoundingClientRect().width / 390 || 1); c.style.visibility = ""; } if (onBlur) onBlur(inp.value); });
    inp.addEventListener("input", () => { if (onInput) onInput(inp.value); });
    inp.addEventListener("keydown", (e) => { e.stopPropagation();   // Esc·Enter 가 화면 뒤로가기(router)로 새지 않게
      if (e.key === "Escape") inp.blur(); else if (e.key === "Enter" && !(multi && e.shiftKey) && !e.isComposing) { e.preventDefault(); const v = inp.value; if (onEnter) onEnter(v, inp); else inp.blur(); } });
    for (const k of ["pointerdown", "click"]) inp.addEventListener(k, (e) => e.stopPropagation());   // 칸 자체를 누른 건 화면 연결(묻기·찾기 이동)로 넘기지 않음
    (FIELDS[id] = FIELDS[id] || []).push(inp); return inp;
  }
  const inBox = (fig, box) => [...fig.querySelectorAll("p")].filter(q => !q.closest(".app5-list, .app5-pin") && centerIn(q, box)).sort((a, b) => a.offsetTop - b.offsetTop || a.offsetLeft - b.offsetLeft);   // 11-05: 목록이 길어져 아래 바 뒤로 지나가는 줄 글자는 빼고
  const focus = (id) => { const f = FIELDS[id] && FIELDS[id][0]; if (f) setTimeout(() => f.focus(), 0); return !!f; };
  // 답 화면의 「내 질문」 말풍선에 친 질문 (길면 두 줄)
  function setQuestion(id, q) {
    const fig = P.SCR[id] && P.SCR[id].fig, bub = fig && fig.querySelector('[data-name^="내 질문"]'), qp = bub && inBox(fig, bub)[0]; if (!qp) return;
    const ruler = document.createElement("span"); ruler.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${getComputedStyle(qp).font}`; ruler.textContent = q; document.body.appendChild(ruler); const tw = Math.ceil(ruler.offsetWidth); ruler.remove();
    const two = tw > 268, w = two ? 300 : tw + 32, h = two ? 62 : 44, right = bub.offsetLeft + bub.offsetWidth;
    Object.assign(bub.style, { left: right - w + "px", width: w + "px", height: h + "px" });
    qp.textContent = q; Object.assign(qp.style, { left: right - w + 16 + "px", width: w - 32 + "px", top: bub.offsetTop + (two ? 9 : 0) + "px", height: two ? "auto" : h + "px", lineHeight: two ? "22px" : h + "px", whiteSpace: two ? "normal" : "nowrap", textAlign: "left", translate: "none" });
  }
  // ---------- 입력칸에 글이 있으면 음성 단추 → 보내기 ----------
  // 11-05 주형: 글을 쓰거나 추천 칩으로 질문이 채워져도 보낼 단추가 없었다(Enter 만) → 입력칸이 비어 있지 않으면 음성 단추 안 파형 아이콘이 위 화살표(보내기)로 바뀌고,
  //   누르면 Enter 와 같음 — 홈(H1 · OB-4): 묻기(답 화면), 발산(D1): 발산 방식 시트(D2, diverge_seed 가 Enter 를 받음). 발산 입력 줄의 '발산 방식' 단추는 보내기가 그 일을 하니 뺌
  function sendSwap() {
    for (const id of ["H1", "OB-4", "D1"]) {
      const s = P.SCR[id], fig = s && s.fig, mic = fig && byName(fig, "btn 음성"), wave = fig && byName(fig, "음성 파형"), inp = FIELDS[id] && FIELDS[id][0];
      if (!mic || !wave || !inp) continue;
      if (id === "D1") [...fig.children].filter(k => /^866:(112|113|116)$/.test(k.dataset.nodeId || "")).forEach(k => k.style.setProperty("display", "none", "important"));
      // 바꿔 보이기는 안쪽 그림(img)으로 — 화면이 나타날 때 앱이 조각(div)의 opacity 를 1로 되돌려서
      //   화살표는 img 가 아니라 직접 그린 svg — 발산 화면은 다른 처리가 그 자리 img 의 그림 주소를 원래 파형으로 되돌려 놓았다
      const wImg = wave.querySelector("img"), send = wave.cloneNode(false); send.removeAttribute("data-node-id"); send.dataset.name = "보내기 아이콘"; send.style.pointerEvents = "none";
      send.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;inset:0;width:100%;height:100%;display:block"><path d="M12 19V5M6 11l6-6 6 6"/></svg>`;
      const sImg = send.firstElementChild; sImg.style.opacity = "0"; wave.after(send);
      // 화살표 색: 진한 원 위 흰색. 발산(D1)은 화면 통째로 반전(invert)이 걸려 있어 진한 색으로 그려야 흰색으로 보임
      const inkFor = () => /invert/.test(getComputedStyle(fig).filter) ? "#100A17" : "#FFFFFF";
      let on = false;
      const sync = () => { const v = !!inp.value.trim(); if (v === on) return; on = v; sImg.setAttribute("stroke", inkFor());
        const a = on ? sImg : wImg, b = on ? wImg : sImg;
        a.animate([{ opacity: 0, transform: "scale(.6)" }, { opacity: 1, transform: "none" }], { duration: 180, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
        b.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.6)" }], { duration: 140, easing: "ease-in", fill: "forwards" });
        mic.dataset.send = on ? "1" : ""; mic.setAttribute("aria-label", on ? "보내기" : "음성"); };
      inp.addEventListener("input", sync); setInterval(sync, 150);   // 칩 · 발산 기준이 입력칸을 코드로 채우거나 보낸 뒤 비울 때도
      // 보내기 상태일 때 음성 단추 누르기는 앱의 누르기 처리(router — 음성 듣기)보다 먼저 받아 Enter 로
      const hit = (ev) => { if (!on || P.cur() !== id) return false; const r = mic.getBoundingClientRect(); return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom; };
      window.addEventListener("pointerdown", (ev) => { if (hit(ev)) { ev.stopPropagation(); ev.preventDefault(); } }, true);
      window.addEventListener("click", (ev) => { if (!hit(ev)) return; ev.stopPropagation(); ev.preventDefault();
        inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })); }, true);
    }
  }
  function typing() {
    const st = document.createElement("style"); st.textContent = ".app5-in::placeholder{color:var(--ph);opacity:1} [contenteditable]{outline:none;cursor:text}"; document.head.appendChild(st);
    // 이름(OB-1)·주제(OB-2)
    const NAME = { v: "프로덕트디자인4" }, TOPIC = { v: "기쁨을 주는 제품 · 서비스 · 경험" }, fileName = (t) => /프로덕트디자인4 · (와이어프레임|스타일|\d)/.test(t);
    const setName = (v) => { v = v.trim(); if (!v || v === NAME.v) return; replaceAll(NAME.v, v, fileName); NAME.v = v; };
    const setTopic = (v) => { v = v.trim().replace(/\s*\n\s*/g, " "); if (!v || v === TOPIC.v) return; replaceAll(TOPIC.v, v); TOPIC.v = v; };
    { const fig = P.SCR["OB-1"].fig, box = byName(fig, "이름 입력"); field("OB-1", { p: inBox(fig, box)[0], box, label: "프로젝트 이름", onBlur: setName, onEnter: (v, i) => i.blur() }); }
    { const fig = P.SCR["OB-2"].fig, box = byName(fig, "주제 입력"); field("OB-2", { p: inBox(fig, box)[0], box, multi: true, right: box.offsetLeft + box.offsetWidth - 16, label: "주제", onBlur: setTopic, onEnter: (v, i) => i.blur() }); }
    // 묻기 입력 바: 누르면 바로 답 화면으로 가던 것 → 칸에 치고 Enter 로 묻기 (친 질문이 답 화면 말풍선에)
    const target = {}, ask0 = ACTIONS.ask, throwIdea0 = ACTIONS.throwIdea, isBar = (o) => o && o.el && /^입력 바/.test(o.el.dataset.name || "");
    for (const id of ["H1", "OB-4", "R2-6a", "R2-6c", "H2", "H6", "H7", "H8", "H11", "D1"]) {
      const fig = P.SCR[id] && P.SCR[id].fig, box = fig && byName(fig, "입력 바"); if (!box) continue; const p = inBox(fig, box)[0]; if (!p) continue;
      field(id, { p, box, ph: true, right: box.offsetLeft + box.offsetWidth - 16, color: id === "D1" ? "#f5f2fc" : "#1a1626", label: "묻기",
        onEnter: (v, i) => { v = v.trim(); if (!v) return; i.value = ""; i.blur();
          if (id === "D1") { throwIdea0({ from: id }); toast(`‘${v}’ 던졌어요`); return; }
          const to = target[id] || ({ H1: "H2", "OB-4": "H2", "R2-6a": "H2", "R2-6c": "H2", H2: "H11" }[id] || id); setQuestion(to, v); ask0({ from: id, to, el: box }); } });
    }
    // 11-05 주형: 홈 추천 칩은 바로 답 화면으로 가지 않고 입력칸에 그 질문(답 화면 말풍선 글)을 채움 → 보내기로 보냄. 채운 글을 고치면 일반 질문(H2)으로
    const HOME_IN = ["H1", "OB-4", "R2-6a", "R2-6c"], chipQ = {};
    const qOf = (to) => { const f = P.SCR[to] && P.SCR[to].fig, b = f && f.querySelector('[data-name^="내 질문"]'), q = b && inBox(f, b)[0]; return q ? q.textContent.trim() : ""; };
    ACTIONS.ask = (o) => { if (isBar(o) && FIELDS[o.from]) { target[o.from] = o.to; focus(o.from); return; }
      if (HOME_IN.includes(o.from) && FIELDS[o.from] && o.to) { const inp = FIELDS[o.from][0], q = qOf(o.to) || (o.el && o.el.textContent.trim()) || "";
        inp.value = q; chipQ[o.from] = q; target[o.from] = o.to; inp.dispatchEvent(new Event("input")); focus(o.from); P.react && P.react("happy"); return; }
      ask0(o); };
    for (const id of HOME_IN) (FIELDS[id] || []).forEach(i => i.addEventListener("input", () => { if (chipQ[id] && i.value.trim() !== chipQ[id]) { delete chipQ[id]; delete target[id]; } }));
    ACTIONS.throwIdea = (o) => { if (isBar(o) && FIELDS[o.from]) { focus(o.from); return; } throwIdea0(o); };
    sendSwap();
    // 기록 찾기: 친 말로 실제로 찾는다 → 있으면 결과(T7), 없으면 결과 없음(T8)에 그 말
    const search0 = ACTIONS.search;
    const clears = [...["T7", "T8"].map(id => byName(P.SCR[id].fig, "지우기"))].filter(Boolean);
    const setQuery = (v) => { LIST.T7.q = v; for (const id of ["T7", "T8"]) (FIELDS[id] || []).forEach(i => i.value = v); clears.forEach(c => c.style.visibility = v ? "" : "hidden"); };   // 검색어가 없으면 × 도 숨김
    // 11-05 주형: 새로 찾을 때마다 칩은 「전체」로, 결과는 돋보기 마스코트가 다 찾은 뒤에 나온다(actions.search) — 이미 찾기 결과 화면이어도 같은 순서로
    const doSearch = (v, from) => { v = v.trim(); if (!v) return; setQuery(v); LIST.T7.sel = "전체"; chipLook(P.SCR.T7.fig, "전체");
      if (LIST.T7.rows.some(r => matchQ(r, v))) { render("T7"); search0({ from, to: "T7" }); }
      else { [...P.SCR.T8.fig.querySelectorAll("p")].forEach(q => { if (/기록이 없어요$/.test(q.textContent.trim())) q.textContent = `‘${v}’ 기록이 없어요`; }); P.show("T8", P.cur() === "T7" ? "replace" : "push"); P.react("shake"); } };
    for (const id of ["T1", "T7", "T8"]) {
      const fig = P.SCR[id].fig, box = [...fig.querySelectorAll('[data-name="btn 기록 찾기"]')].find(b => b.offsetTop > 700); if (!box) continue; const p = inBox(fig, box)[0]; if (!p) continue;
      const x = [...fig.children].filter(k => k !== box && k.tagName !== "P" && centerIn(k, box) && k.offsetLeft > p.offsetLeft).map(k => k.offsetLeft);   // 지우기(×) 앞까지
      const inp = field(id, { p, box, ph: id === "T1", right: x.length ? Math.min(...x) - 8 : undefined, color: "#1a1626", label: "기록 찾기", onEnter: (v, i) => { i.blur(); doSearch(v, id); } });
      inp.placeholder = "기록 찾기";
    }
    // 11-05 주형: 찾기 결과·결과 없음의 × = 화면은 그대로, 검색어만 지우고 전체 기록을 보여 줌 (예전: 기록 화면으로 돌아감)
    ACTIONS.clearSearch = ({ from }) => { setQuery(""); render("T7"); if (from === "T8") P.show("T7", "replace"); };
    ACTIONS.search = (o) => { if (o && o.el && o.el.dataset.name === "btn 기록 찾기" && FIELDS[o.from]) { focus(o.from); return; }
      const tag = o && o.el && P.SCR[o.from] && ((inBox(P.SCR[o.from].fig, o.el)[0] || o.el).textContent || "").trim(); if (tag && /^#/.test(tag)) { setQuery(tag); render("T7"); } search0(o); };   // 상세의 태그 칩 → 그 태그로 찾기
    // 팀원 초대(M2 → M2-2): 시트가 뜨면 바로 입력, Enter 로 초대
    { const fig = P.SCR["M2-2"].fig, box = [...fig.querySelectorAll("[data-name]")].find(b => /^이름 입력칸/.test(b.dataset.name)), p = box && inBox(fig, box)[0], sep = box && [...fig.children].find(k => k.dataset.name === "구분선" && centerIn(k, box));
      if (p) { field("M2-2", { p, box, ph: true, right: sep ? sep.offsetLeft - 8 : undefined, color: "#1a1626", label: "초대할 이름이나 이메일", onEnter: (v, i) => { v = v.trim(); if (!v) return; i.value = ""; ACTIONS.invite(); toast(`${v}에게 초대를 보냈어요`); } });
        new MutationObserver(() => { if (P.SCR["M2-2"].el.classList.contains("on")) focus("M2-2"); }).observe(P.SCR["M2-2"].el, { attributes: true, attributeFilter: ["class"] }); } }
    // 외부 참여자 추가(R1-1): 친 이름이 아래 버튼 글자에, Enter = 추가하기
    { const fig = P.SCR["R1-1"].fig, box = [...fig.querySelectorAll("[data-name]")].find(b => /^이름 입력칸/.test(b.dataset.name)), p = box && inBox(fig, box)[0], btn = byName(fig, "btn 추가하기"), bl = btn && inBox(fig, btn)[0];
      if (p) field("R1-1", { p, box, label: "외부 참여자 이름", onInput: (v) => { if (bl) bl.textContent = `${v.trim() || "이 분"} 추가하기`; }, onEnter: (v, i) => { i.blur(); if (!v.trim()) return; toast(`${v.trim()}님을 추가했어요`); P.back(); } }); }
    // 링크로 합류(H5-1): 링크를 고쳐 붙여 넣고 Enter = 합류하기
    { const fig = P.SCR["H5-1"] && P.SCR["H5-1"].fig, box = fig && byName(fig, "링크 입력칸"), p = box && inBox(fig, box).find(q => /comet\.app/.test(q.textContent)), sep = fig && byName(fig, "구분선");
      if (p) field("H5-1", { p, box, right: sep ? sep.offsetLeft - 8 : undefined, label: "초대 링크", onEnter: (v, i) => { i.blur(); if (v.trim()) P.show("H5-2", "push"); } }); }
    // 기록 수정(-E): 제목과 카드 본문을 그 자리에서 고친다 (카드 머리글은 그대로)
    for (const id of ["T2-E", "T9-E", "T3-E", "T2-1-E"]) {
      const fig = P.SCR[id] && P.SCR[id].fig; if (!fig) continue; const c = byName(fig, "커서");
      const cards = [...fig.children].filter(k => /^카드 ·/.test(k.dataset.name || "") && !/플레이어|관련 기록/.test(k.dataset.name)), title = [...fig.querySelectorAll("p")].find(q => parseFloat(getComputedStyle(q).fontSize) >= 24);
      const eds = cards.flatMap(card => { const ins = [...fig.children].filter(k => k !== card && (k.tagName === "P" || (k.tagName === "DIV" && k.querySelector("p") && !k.dataset.name)) && centerIn(k, card)).sort((a, b) => a.offsetTop - b.offsetTop); return ins.filter((k, i) => !(i === 0 && k.tagName === "P" && parseFloat(getComputedStyle(k).fontWeight) >= 600)); });
      for (const e of [title, ...eds].filter(Boolean)) { e.contentEditable = "true"; e.spellcheck = false; e.addEventListener("keydown", (ev) => { ev.stopPropagation(); if (ev.key === "Escape") e.blur(); }); for (const k of ["pointerdown", "click"]) e.addEventListener(k, (ev) => ev.stopPropagation()); }
      if (c) { fig.addEventListener("focusin", () => c.style.visibility = "hidden"); fig.addEventListener("focusout", (ev) => { caretAfter(c, ev.target, fig.getBoundingClientRect().width / 390 || 1); c.style.visibility = ""; }); }
    }
  }
  // ---------- 메인 결정(T4) ----------
  // 11-05 주형: 위 「프로덕트디자인4 · 메인 결정」 글자와 「지금 결정」 칩을 뺌. 「10월 27일 3차 회의에서 정함」은 제목 바로 아래 왼쪽,
  // 그 밑에 접힌 칸 「근거 기록」 — 펼치면 이 결정의 근거가 된 기록 줄, 누르면 그 기록 상세로. 결정한 이유 · 맥락도 눌러서 접고 펼 수 있게.
  const T4_SOURCES = [   // 근거 기록 — 맥락 카드(대상·형태·발표)와 같은 날 회의에서 고름 (추정)
    { title: "방향 좁히기", meta: "#회의 · 10월 27일", dec: 2, to: "T2" },   // 11-05 기록 메뉴 3: 「3차 회의 녹음」은 이 회의 기록의 녹음 원본이라 따로 근거로 세지 않음 (T1 과 같게)
    { title: "형태 스케치 v1", meta: "#이미지 · 10월 20일", to: "T3" },
  ];
  const FOLD = new Map();   // 카드 → { open, members(펼쳤을 때만 보이는 것), chev, openH, rows }
  const foldY = (k) => k.offsetTop + (+k.dataset.dy || 0);
  function foldShift(id, from, dh, skip = []) {   // actions.expand 와 같은 방식(dataset.dy + nudgeY)이라 두 쪽이 섞여도 자리가 맞는다 · 11-05 기록 메뉴 3: T4 말고 기록 상세(T2 · T9 · T3)도 씀
    const s = P.SCR[id], fig = s.fig;
    for (const k of fig.children) { if (k.dataset.name === "home indicator" || foldY(k) < from || skip.includes(k)) continue;   /* skip = 그 칸 안의 것(근거 기록 줄 등) — 같이 밀면 줄 2·3이 아래 칸에 겹쳤다 */ const y = (+k.dataset.dy || 0) + dh; k.dataset.dy = y; k.style.transition = "transform .25s"; P.nudgeY(k, y); }
    const bottom = Math.max(...[...fig.children].filter(k => k.dataset.name !== "home indicator" && k.style.display !== "none").map(k => foldY(k) + k.offsetHeight));
    fig.style.height = Math.max(844, bottom + 40) + "px"; s.el.style.overflowY = bottom + 40 > 844 ? "auto" : "";
  }
  function fold(card) {
    const f = FOLD.get(card); if (!f) return; const H0 = 50, cur = card.offsetHeight, open = !f.open;
    if (f.build && open) f.build();
    const dh = open ? f.openH() - cur : H0 - cur;
    foldShift(f.id || "T4", foldY(card) + cur, dh, f.members());
    card.style.transition = "height .25s"; card.style.height = (cur + dh) + "px";
    f.members().forEach(m => { m.style.transition = "opacity .2s"; m.style.opacity = open ? "1" : "0"; m.style.visibility = open ? "" : "hidden"; });
    if (f.chev) f.chev.style.rotate = open ? "calc(90deg * -1)" : "90deg";
    f.open = open; if (!open && f.clear) f.clear();
  }
  function t4Layout() {
    const fig = P.SCR.T4 && P.SCR.T4.fig; if (!fig) return;
    const hide = (e) => { if (e) e.style.display = "none"; };
    hide(pText(fig, "프로덕트디자인4")); hide(byName(fig, "상태 · 지금 결정")); hide(byName(fig, "점")); hide(pText(fig, "지금 결정"));
    const title = [...fig.children].find(k => k.tagName === "DIV" && !k.dataset.name && k.textContent.includes("출근길")), date = pText(fig, "10월 27일 3차 회의에서 정함");
    const proto = byName(fig, "카드 · 고민 중"), protoT = pText(fig, "고민 중"), chevOf = (card) => [...fig.children].find(k => k.tagName === "DIV" && !k.dataset.name && k.querySelector('[data-name="icon chev"]') && Math.abs(k.offsetTop - card.offsetTop - 17) < 4);
    if (!title || !date || !proto || !protoT) return;
    title.style.top = (parseFloat(title.style.top) - 14) + "px";                                    // 위 글자가 빠진 만큼 제목을 올림
    const dateY = title.offsetTop + title.offsetHeight + 6; date.style.left = "20px"; date.style.top = dateY + "px"; date.textContent = "10.27 (월)";   // 11-05 주형 2차: 서술형(10월 27일 3차 회의에서 정함) 대신 날짜 표기만 — 앱의 다른 날짜(10.29 수정 · 11.3 (월))와 같은 꼴
    const cardsTop = dateY + 26, card = clone(proto), lab = clone(protoT), chevW = clone(chevOf(proto));
    card.dataset.name = "카드 · 근거 기록"; card.style.cursor = "pointer";
    lab.textContent = `근거 기록  ${T4_SOURCES.length}`; lab.style.pointerEvents = "none"; chevW.style.pointerEvents = "none";
    card.style.top = lab.style.top = "2000px"; chevW.style.top = "2017px";   // 자리는 아래 줄 세우기에서 정함
    fig.append(card, lab, chevW);
    // 11-05 주형(공유 문서 다듬기): 맥락 칸 — 대상 · 형태 · 발표 세 칸(라벨 + 값)은 최종 결정의 맥락이 늘 그 세 항목으로 정리되진 않아서,
    //   결정한 이유처럼 본문 글로: 맥락 한 줄씩 점(•)으로. 칸 높이는 글 길이에 맞춤 (내용은 회의 기록 · 교수님 피드백에서 가져온 것, 추정)
    const T4_CONTEXT = ["• 혼자 사는 20대가 출근길에 낯선 이와 자연스럽게 마주치는 장면", "• 정류장 우산 — 손에 쥐는 형태 쪽으로 (교수님 피드백)", "• 11.3 (월) 발표 전까지 사용 상황 3개 정리"];
    // 11-05 주형(공유 문서 다듬기): 카드 순서 = 결정한 이유 → 맥락 → 고민 중 → 할 일 → 근거 기록 → AI 규칙 (근거 기록은 맨 위에서 아래로). 간격 10
    //   칸마다 그 칸 안의 것(머리글 · ∨ · 본문)을 묶어서 같이 옮긴다(맥락 칸 높이를 바꾸기 전 자리로 묶음 — 늘린 뒤 묶으면 아래 칸 ∨ 까지 딸려 왔다). 머리글은 접힌 칸처럼 높이 50 띠 가운데(∨ 와 같은 줄)
    const ORDER = ["카드 · 결정한 이유", "카드 · 맥락", "카드 · 고민 중", "카드 · 할 일", "카드 · 근거 기록", "카드 · ai가 지킬 것"].map(n => byName(fig, n)).filter(Boolean);
    const groupOf = (c) => { const t = c.offsetTop, h = c.offsetHeight; return [c, ...[...fig.children].filter(k => k !== c && !/^카드 ·/.test(k.dataset.name || "") && k.style.display !== "none" && k.offsetTop >= t - 1 && k.offsetTop < t + h && k.offsetLeft >= c.offsetLeft - 1 && k.offsetLeft < c.offsetLeft + c.offsetWidth)]; };
    const groups = ORDER.map(groupOf), foot = pText(fig, "연결한 ai가");
    { const i = ORDER.findIndex(c => c.dataset.name === "카드 · 맥락"), c = ORDER[i], reason = pText(fig, "정류장 우산 아이디어");
      const top = c && c.offsetTop, h = c && c.offsetHeight;
      const old = c ? [...fig.children].filter(k => k.tagName === "P" && k.offsetTop > top + 30 && k.offsetTop < top + h && k.offsetLeft >= c.offsetLeft) : [];   // 대상 · 형태 · 발표 라벨과 값
      if (reason && old.length) { old.forEach(hide); const b = clone(reason); b.style.top = (top + 46) + "px"; b.style.height = "auto"; b.style.whiteSpace = "normal";
        b.innerHTML = T4_CONTEXT.map(t => `<span style="display:block;padding-left:12px;text-indent:-12px">${t}</span>`).join("");   // 줄이 넘어가도 점 뒤 글자에 맞춰 들여씀
        fig.appendChild(b); groups[i].push(b); c.style.height = (46 + b.offsetHeight + 14) + "px"; } }
    const headP = (g) => g.filter(k => k.tagName === "P" && parseFloat(getComputedStyle(k).fontWeight) >= 600).sort((a, b) => a.offsetTop - b.offsetTop)[0];
    const protoBox = getComputedStyle(protoT);   // 접힌 칸 머리글(높이 50 · 가운데) 모양
    let y = cardsTop;
    groups.forEach((g, i) => { const c = ORDER[i], d = y - c.offsetTop;
      g.forEach(k => k.style.top = (parseFloat(k.style.top) + d) + "px");
      const hp = headP(g); if (hp) { hp.style.top = y + "px"; hp.style.height = "50px"; hp.style.lineHeight = protoBox.lineHeight; hp.style.display = protoBox.display; hp.style.alignItems = protoBox.alignItems; }
      y += c.offsetHeight + 10; });
    if (foot) foot.style.top = (y + 2) + "px";
    // 근거 기록: 펼칠 때 줄을 만든다 (줄 = 제목 · 종류와 날짜 · ›, 누르면 그 기록 상세)
    // 11-05 주형(근거 기록 줄 2): 제목 500 · 검정 + 둘째 줄 설명 + 구분선 + 결정 배지로 칸 안에 목록 화면이 따로 든 것처럼 진하고 빽빽했다 →
    //   다른 칸 본문(결정한 이유 · 할 일)과 같은 문법: 15px · 400 · #4A4361 · 줄 간격 23 리듬(줄 32), 한 줄에 제목 + 옅은 종류, 오른쪽 날짜 · ›. 구분선 · 배지 없음.
    //   본문처럼 머리글 아래 46 에서 글이 시작. 누를 수 있다는 건 › 와 올렸을 때 옅은 바탕으로. 글 왼쪽 32 · › 가운데 350(칸 ∨ 와 같은 세로줄)
    const SRC_H = 32, SRC_TOP = 46;
    let rows = [];
    FOLD.set(card, { open: false, chev: chevW.firstElementChild, members: () => rows, openH: () => SRC_TOP + T4_SOURCES.length * SRC_H - (SRC_H - 23) + 14,
      build: () => { rows = T4_SOURCES.map((s, i) => { const r = document.createElement("div"); r.className = "t4src";
        r.style.cssText = `position:absolute;left:24px;top:${foldY(card) + SRC_TOP + i * SRC_H - (SRC_H - 23) / 2}px;width:342px;height:${SRC_H}px;box-sizing:border-box;padding:0 8px;border-radius:8px;display:flex;align-items:center;gap:8px;cursor:pointer;opacity:0;font-family:${getComputedStyle(lab).fontFamily};font-size:15px;line-height:23px;font-weight:400;color:#4a4361`;
        const [kind, date] = s.meta.split(" · "), md = (date || "").replace(/(\d+)월 (\d+)일/, "$1.$2");
        r.innerHTML = `<span style="white-space:nowrap">${s.title}</span><span style="font-size:13px;color:#9a94ad;white-space:nowrap">${kind || ""}</span><span style="flex:1"></span><span style="font-size:13px;color:#9a94ad">${md}</span><span style="width:16px;text-align:center;font-size:17px;color:#9a94ad">›</span>`;
        r.onpointerenter = () => r.style.backgroundColor = "rgba(20,15,36,.05)"; r.onpointerleave = () => r.style.backgroundColor = "";
        r.onclick = (e) => { e.stopPropagation(); P.show(s.to, "push"); }; fig.appendChild(r); return r; }); },
      clear: () => { const old = rows; rows = []; setTimeout(() => old.forEach(r => r.remove()), 260); } });   // 흐려진 뒤에 지움 (그 사이 다시 펼치면 새 줄을 만든다)
    card.onclick = () => fold(card);
    // 결정한 이유 · 맥락: 처음엔 펼쳐진 채, 누르면 접힘 (접히면 다른 접힌 칸처럼 높이 50)
    for (const name of ["카드 · 결정한 이유", "카드 · 맥락"]) {
      const c = byName(fig, name), top = c.offsetTop, h = c.offsetHeight, ch = chevOf(c);
      const inner = [...fig.children].filter(k => k !== c && k !== ch && k.offsetTop >= top && k.offsetTop < top + h && k.offsetLeft >= c.offsetLeft && k.offsetLeft < c.offsetLeft + c.offsetWidth);
      const head = inner.filter(k => k.tagName === "P").sort((a, b) => a.offsetTop - b.offsetTop)[0];
      FOLD.set(c, { open: true, chev: ch && ch.firstElementChild, members: () => inner.filter(k => k !== head), openH: () => h });
      if (ch && ch.firstElementChild) ch.firstElementChild.style.rotate = "calc(90deg * -1)";
    }
    ACTIONS.fold = ({ el }) => { const c = el && (FOLD.has(el) ? el : [...FOLD.keys()].find(k => k.dataset.name === el.dataset.name)); if (c) fold(c); };
  }
  // ---------- 스크롤해도 위 상태 표시줄(시간 · 배터리)과 아래 홈 표시줄은 제자리 ----------
  // 11-05 주형(공유 문서 다듬기): 칸을 펼쳐 화면이 길어지면(T4 · 기록 상세 등) 화면 안에서 스크롤되는데, 상태 표시줄 · 홈 표시줄도 화면 그림 안의 조각이라 같이 밀려 올라갔다.
  //   스크롤한 만큼 그 조각들을 거꾸로 내려 제자리에 두고, 상태 표시줄 뒤엔 화면 바탕색 띠를 깔아 본문이 그 밑으로 지나가게 (스크롤 0 이면 띠 없음).
  //   진규 jg/statusbar-dark('상태 표시줄 폰 위에 하나로 고정')가 합쳐지면 화면별 상태 표시줄은 숨겨지고 홈 표시줄만 이걸로 남음
  function stickyChrome() {
    // 화면 안 스크롤바(세로 · 가로)가 폰 안에 그려져 홈 표시줄을 가렸다 → 폰 화면 안에선 스크롤바를 그리지 않음 (iOS 처럼). 가로로는 밀리지 않게 scrollLeft 0
    const st = document.createElement("style"); st.textContent = ".scr{scrollbar-width:none}.scr::-webkit-scrollbar{display:none}"; document.head.appendChild(st);
    for (const s of Object.values(P.SCR)) {
      const fig = s.fig, el = s.el; if (!fig || !el) continue;
      const fixed = [...fig.querySelectorAll(':scope > [data-sb], :scope > [data-name="home indicator"]')]; if (!fixed.length) continue;
      let band = null;
      el.addEventListener("scroll", () => { if (el.scrollLeft) el.scrollLeft = 0; const y = el.scrollTop;
        if (!band && y > 0) { band = document.createElement("div"); band.className = "sbband"; band.style.cssText = `position:absolute;left:0;top:0;width:390px;height:54px;pointer-events:none;z-index:2;background:${getComputedStyle(fig).backgroundColor}`; fig.appendChild(band); fixed.forEach(k => k.style.zIndex = "3"); }
        fixed.forEach(k => k.style.transform = `translateY(${y}px)`); if (band) { band.style.transform = `translateY(${y}px)`; band.style.opacity = y > 0 ? "1" : "0"; } }, { passive: true });
    }
  }
  // ---------- 기록 상세 머리(제목 · 날짜 줄 · 태그)를 공유 문서(T4)처럼 ----------
  // 11-05 주형(기록 상세 머리): 제목 아래 검은 종류 칩(회의 · 형태)이 바로 밑 #태그(#회의 · #이미지)와 같은 말이라 뺌. 맨 위 '기록 › 회의' 글자도 같은 말이라 뺌(T4 처럼 제목부터).
  //   피드백의 '반영 중'은 종류가 아니라 상태라 날짜 줄 맨 앞 글로 옮김. 정렬 = T4: 제목 108 → 날짜 줄(12px · #6B6484, 왼쪽 20) 제목 아래 6 → 태그 줄 12 아래 → 칸 10 아래(216, T4 칸 시작과 같음)
  function recordHead() {
    for (const id of ["T2", "T9", "T3", "T2-E", "T9-E", "T3-E"]) {
      const fig = P.SCR[id] && P.SCR[id].fig; if (!fig) continue; const edit = /-E$/.test(id);
      const kids = [...fig.children].filter(k => k.style.display !== "none");
      const crumb = kids.find(k => k.tagName === "P" && /^기록 ›/.test(k.textContent.trim()) && k.offsetTop < 110);
      const title = kids.find(k => k.tagName === "P" && parseFloat(getComputedStyle(k).fontSize) >= 24 && k.offsetTop > 100 && k.offsetTop < 140);
      const chip = kids.find(k => /^상태 칩/.test(k.dataset.name || ""));
      if (!title || !chip) continue;
      const cy = chip.offsetTop, ch = chip.offsetHeight;
      const inChip = kids.filter(k => k !== chip && k.offsetTop >= cy - 1 && k.offsetTop < cy + ch && k.offsetLeft >= chip.offsetLeft && k.offsetLeft < chip.offsetLeft + chip.offsetWidth);   // 칩 안의 점 · 글자
      const meta = kids.find(k => k.tagName === "P" && !inChip.includes(k) && k.offsetTop >= cy && k.offsetTop < cy + ch && k.offsetLeft > chip.offsetLeft + chip.offsetWidth - 2);
      const under = kids.find(k => /^밑줄/.test(k.dataset.name || ""));
      const tagsTop = kids.filter(k => /^칩 (#|\+)/.test(k.dataset.name || "")).map(k => k.offsetTop)[0];
      const tags = tagsTop === undefined ? [] : kids.filter(k => Math.abs(k.offsetTop - tagsTop) < 2 && k.offsetLeft < 380);
      const status = inChip.find(k => k.tagName === "P"), stText = status ? status.textContent.replace(/▾/g, "").trim() : "";
      const bodyFrom = tagsTop !== undefined ? tagsTop + 40 : cy + ch + 10;   // 칸(재생 바 · 이미지)부터 아래 전부
      const below = kids.filter(k => k.offsetTop >= bodyFrom && k.dataset.name !== "home indicator" && !k.dataset.sb);
      const first = Math.min(...below.map(k => k.offsetTop));
      [crumb, chip, ...inChip].forEach(e => { if (e) e.style.display = "none"; });
      const top = (e, y) => { e.style.top = y + "px"; };
      const T = 108, d0 = T - title.offsetTop; top(title, T); if (under) top(under, under.offsetTop + d0);
      let y = T + title.offsetHeight + 6 + (edit ? 6 : 0);   // 수정 화면은 제목 밑줄이 있어 6 더
      if (meta) {   // 11-05 주형: '반영 중 · …' 처럼 상태를 날짜 줄 앞에 붙이던 것 뺌 (recordDateOnly 가 날짜만 남김)
        Object.assign(meta.style, { left: "20px", width: "350px", fontSize: "12px", color: "#6b6484", textAlign: "left" }); top(meta, y); y += (meta.offsetHeight || 14) + 12; }
      if (tags.length) { const dy = y - tagsTop; tags.forEach(k => top(k, k.offsetTop + dy)); y += 28 + 10; }
      const dy = y - first; below.forEach(k => top(k, k.offsetTop + dy));
    }
  }
  // ---------- 기록 상세 머리 아래 각주는 날짜만 ----------
  // 11-05 주형: '10월 27일 (월) 16:38 · 33분 · 화자 3' · '반영 중 · 교수님 · 10월 22일 (수) · 대면 · 4분' 처럼
  //   종류도 위계도 다른 것(상태 · 사람 · 날짜 · 방식 · 길이)을 가운데 점으로 묶어 각주로 달던 것 → 날짜 한 가지만. 수정 화면(-E)은 끝의 ▾ 를 남김
  function recordDateOnly() {
    const DATE = /\d+월 \d+일 \([월화수목금토일]\)/;
    const FALLBACK = { "T2-1": "10월 27일 (월)" };   // 녹음 전사는 '3차 회의 — 방향 좁히기 · 33분 · 화자 3' 이라 날짜가 없음 → T2 와 같은 날
    for (const id of ["T2", "T2-E", "T9", "T9-E", "T3", "T3-E", "T2-1", "T2-1-E"]) {
      const fig = P.SCR[id] && P.SCR[id].fig; if (!fig) continue;
      for (const e of fig.querySelectorAll("p, span, div")) {
        if ([...e.children].some(c => c.tagName !== "BR")) continue;
        const t = e.textContent.replace(/\s+/g, " ").trim(); if (!/ · /.test(t) || t.length > 80) continue;
        const d = (t.match(DATE) || [])[0] || (/화자 \d/.test(t) ? FALLBACK[id] : null); if (!d) continue;
        e.textContent = d + (/▾$/.test(t) ? " ▾" : "");
      }
    }
  }
  // ---------- 기록 상세(T2 회의 · T9 피드백 · T3 형태)를 공유 문서(T4) 카드 UI로 ----------
  // 11-05 주형(기록 메뉴 3): 상세 카드가 흰 바탕 + 진한 테두리(#9C95B3) · 머리글 15px 로 공유 문서와 달랐다 →
  //   T4 카드와 같게: 왼쪽 16 · 너비 358 · 옅은 바탕(.05) · 옅은 테두리(.1) · 둥글기 12 · 머리글 14px 굵게 · 안 글자 왼쪽 32.
  //   내용 카드(정한 것 · 고민 중 · 전사 · 피드백 내용 · 관련 기록 · 설명)는 T4 처럼 오른쪽 ∨ 로 접고 펼침(처음엔 펼침).
  //   재생 바 · 이미지 · 원문 전체 보기 줄도 같은 바탕 · 테두리 · 너비로 (안쪽 재생 바 · 파형 자리는 그대로). 수정 화면(-E)은 모양만, 접기는 없음
  function recordCards() {
    const t4 = P.SCR.T4 && P.SCR.T4.fig, t4c = t4 && byName(t4, "카드 · 고민 중");
    const chevProto = t4c && [...t4.children].find(k => k.tagName === "DIV" && !k.dataset.name && k.querySelector('[data-name="icon chev"]') && Math.abs(k.offsetTop - t4c.offsetTop - 17) < 4);
    const look = t4c ? getComputedStyle(t4c) : null, BG = look ? look.backgroundColor : "rgba(20, 15, 36, 0.05)", BD = look ? look.border : "1px solid rgba(20, 15, 36, 0.1)";
    for (const id of ["T2", "T9", "T3", "T2-E", "T9-E", "T3-E"]) {
      const s = P.SCR[id], fig = s && s.fig; if (!fig) continue; const edit = /-E$/.test(id);
      const boxes = [...fig.children].filter(k => /^(카드 · |btn 출처 · )/.test(k.dataset.name || "") && k.style.display !== "none");
      for (const c of boxes) {
        const l = c.offsetLeft, t = c.offsetTop, w = c.offsetWidth, h = c.offsetHeight, name = c.dataset.name;
        const inner = [...fig.children].filter(k => k !== c && !boxes.includes(k) && k.offsetLeft >= l - 1 && k.offsetLeft < l + w && k.offsetTop >= t - 1 && k.offsetTop < t + h);
        c.style.left = "16px"; c.style.width = "358px"; c.style.background = BG; c.style.border = BD; c.style.borderRadius = "12px"; c.style.boxSizing = "border-box";
        if (/플레이어|이미지/.test(name)) continue;   // 재생 바 · 이미지 칸 안쪽 자리는 그대로 (칸만 좌우 4px 넓어짐)
        inner.forEach(k => { const x = k.offsetLeft, d = x < l + w / 2 ? -4 : 4; k.style.left = (parseFloat(k.style.left) + d) + "px"; });   // 안 글자 왼쪽 36 → 32 (T4 와 같음), 오른쪽 것(날짜 · ›)은 오른쪽 끝을 따라감
        if (/^btn /.test(name)) continue;
        const head = inner.filter(k => k.tagName === "P" && parseFloat(getComputedStyle(k).fontWeight) >= 600).sort((a, b) => a.offsetTop - b.offsetTop)[0];
        if (head) head.style.fontSize = "14px";
        if (edit || !chevProto || !head) continue;
        const ch = clone(chevProto); ch.style.left = "342px"; ch.style.top = (t + 17) + "px"; ch.style.pointerEvents = "none"; fig.appendChild(ch);
        if (ch.firstElementChild) ch.firstElementChild.style.rotate = "calc(90deg * -1)";   // 처음엔 펼침 = ∧
        FOLD.set(c, { id, open: true, chev: ch.firstElementChild, members: () => inner.filter(k => k !== head), openH: () => h });
        c.style.cursor = "pointer"; c.addEventListener("click", () => fold(c));
      }
    }
  }
  // 11-05 주형: 온보딩 단계마다 마스코트 모양 — 프로젝트(행성) → 주제(생각구름) → 팀원 초대(돋보기) → 자료 연결(전구).
  // 화면이 미끄러져 들어온 뒤 그 모양으로 바뀌어 잠깐 머물다 행성으로 돌아온다 (주제 → 팀원 초대의 전구와 같은 길이)
  const OB_SHAPE = { "OB-2": "cloud", "OB-INV": "magnify", "OB-3": "bulb" };   // 주형 11-05: 팀원 초대 = 돋보기(찾기), 자료 연결 = 전구 (처음엔 반대였음)
  // 순서는 주제 → 팀원 초대(topicDone)와 같게: '다음'을 누르면 그 자리에서 먼저 모양이 바뀌기 시작하고 1.2초 뒤 화면이 넘어감
  // 11-05 주형: 온보딩 단계끼리 넘어갈 때(앞·뒤 둘 다) 화면 통째로가 아니라 위 내용만 밀려 옴 — 아래 단계 점 · 다음 버튼 · 홈 표시줄과 위 상태 표시줄은 제자리.
  // 방법: 넘어가는 순간 이전 화면의 고정 부분을 복제해 폰 위 층에 그대로 두고(두 화면의 원래 것은 잠깐 숨김), 점 색·버튼 글자만 새 단계로 바꾼 뒤, 전환(.32초)이 끝나면 층을 걷는다
  const OB_STEPS = ["OB-1", "OB-2", "OB-INV", "OB-3"];
  // 고정 = 상태 표시줄(위 50) · 머리줄(뒤로 · 건너뛰기, 위 100) · 아래 점 · 버튼 · 홈 표시줄(690 아래)
  const obFixed = (id) => [...P.SCR[id].fig.children].filter(k => k.style.display !== "none" && k.offsetHeight > 0 && (k.offsetTop >= 690 || k.offsetTop + k.offsetHeight <= 100));
  const obKey = (k) => (k.offsetTop >= 730 ? k.tagName : k.dataset.name || (k.tagName === "P" ? "p:" + k.textContent.trim() : k.tagName)) + "@" + Math.round(k.offsetLeft) + "," + Math.round(k.offsetTop);   // 아래 버튼은 이름(다음 · 시작하기)이 달라도 같은 자리면 같은 것
  function obFixedBar() {
    let prev = document.body.dataset.screen, layer = null, timer = 0, hid = [];
    new MutationObserver(() => {
      const cur = document.body.dataset.screen, from = prev; prev = cur;
      if (from === cur || !OB_STEPS.includes(from) || !OB_STEPS.includes(cur)) return;
      clearTimeout(timer); if (layer) layer.remove(); hid.forEach(k => k.style.visibility = "");   // 전환 도중 또 넘기면 앞 것부터 정리
      const olds = obFixed(from), news = obFixed(cur);
      layer = document.createElement("div"); layer.className = "obbar fig";   // fig 를 붙여야 화면과 같은 초기화(글자 margin 0 등)를 받음 — 없으면 시간 글자가 18px 내려가 보였다 layer.style.cssText = "position:absolute;left:0;top:0;width:390px;height:844px;pointer-events:none;z-index:7";
      const copies = olds.map(k => { const c = k.cloneNode(true); c.classList.remove("press"); c.style.opacity = ""; c.style.transform = ""; layer.appendChild(c); return c; });
      // 한쪽 화면에만 있는 것(OB-1 엔 뒤로 버튼이 없음)은 그 자리에서 흐려지거나 나타남
      const oKeys = new Set(olds.map(obKey)), nKeys = new Set(news.map(obKey)), fades = [];
      copies.forEach((c, i) => { if (!nKeys.has(obKey(olds[i]))) fades.push([c, "0"]); });
      news.forEach(k => { if (oKeys.has(obKey(k))) return; const c = k.cloneNode(true); c.style.opacity = "0"; c.style.transform = ""; c.classList.remove("press"); layer.appendChild(c); fades.push([c, "1"]); });
      fades.forEach(([c]) => c.style.transition = "opacity .32s");
      $("phone").appendChild(layer);
      hid = [...olds, ...news]; hid.forEach(k => k.style.visibility = "hidden");
      requestAnimationFrame(() => requestAnimationFrame(() => fades.forEach(([c, o]) => c.style.opacity = o)));
      // 점은 색이 스르르 새 단계로, 버튼 글자는 새 화면 것으로 (다음 → 시작하기)
      const dots = (arr) => arr.filter(k => k.dataset.name === "단계 점").sort((a, b) => a.offsetLeft - b.offsetLeft);
      const od = dots(copies), nd = dots(news);
      // 점은 피그마 그림(svg)이라 새 단계 점 그림을 위에 겹쳐 스르르 바꿔 끼운다
      od.forEach((d, i) => { const a = d.querySelector("img"), b = nd[i] && nd[i].querySelector("img"); if (!a || !b || a.src === b.src) return; const n = b.cloneNode(true); n.style.opacity = "0"; n.style.transition = a.style.transition = "opacity .32s"; d.appendChild(n); d._swap = [a, n]; });
      requestAnimationFrame(() => requestAnimationFrame(() => { od.forEach(d => { if (d._swap) { d._swap[0].style.opacity = "0"; d._swap[1].style.opacity = "1"; } });
        const ol = copies.find(k => k.tagName === "P" && k.offsetTop >= 730), nl = news.find(k => k.tagName === "P" && k.offsetTop >= 730); if (ol && nl) ol.textContent = nl.textContent; }));   // 두 프레임 뒤: 겹친 점이 투명한 상태로 한 번 그려진 다음 바꿔야 스르르 바뀜
      timer = setTimeout(() => { hid.forEach(k => k.style.visibility = ""); hid = []; if (layer) { layer.remove(); layer = null; } }, 340);
    }).observe(document.body, { attributes: true, attributeFilter: ["data-screen"] });
  }
  let obGoing = false;   // 넘어가는 1.2초 사이에 '다음'을 또 눌러도 한 번만
  ACTIONS.obStep = ({ to }) => { const sh = OB_SHAPE[to]; if (!sh) return P.show(to, "push"); if (obGoing) return; obGoing = true; const GO = 1200;
    P.plan(sh); setTimeout(() => obGoing = false, GO + 100);
    P.after(GO, () => { P.show(to, "push", { noState: true });   // show 가 예약을 지우므로 넘긴 뒤에 되돌리기를 건다
      const HOLD = 1800, t0 = performance.now(), tick = () => { const s = __m.state(); if (s.cur === sh && !s.next || performance.now() - t0 > 5000) P.after(HOLD, () => P.plan("idle")); else P.after(80, tick); };   // 모양이 다 바뀐 뒤부터 1.8초 머묾
      tick(); }); };
  // 11-05 주형: 홈(H1 · 녹음 중 홈)의 주제문 출처 줄(10.27 · 피그마 코멘트에서)은 뺌
  const hideTopicSource = () => ["H1", "R2-6a", "R2-6c"].forEach(id => { const s = P.SCR[id]; if (s) [...s.fig.querySelectorAll("p")].filter(q => /코멘트에서$|에서 정함$/.test(q.textContent.trim()) && q.offsetTop > 300 && q.offsetTop < 500).forEach(q => q.style.display = "none"); });
  // 11-05 주형: 앱 전체에서 포인트 주황(#F0532C · #FF6A45 계열)을 다 뺌 → 앱 잉크색(#1C1730). 브랜드 색(피그마 · 구글 · Claude 로고) · 마스코트 · 카드 · 다이얼 색은 그대로.
  //   ① 화면 요소의 바탕 · 글자 · 테두리 색 ② 피그마 SVG 아이콘 안의 그 두 주황(마이크 버튼 · 재생 · 말로 입력 등)을 잉크로 바꾼 그림으로 갈아 끼움. 화면 하나씩 나눠서(앱 시작이 멈칫하지 않게)
  function noAccent() {
    const ORS = [[240, 83, 44], [255, 106, 69], [255, 107, 69], [224, 85, 47]], OR_RE = /#(F0532C|FF6B45|FF6A45|E0552F)/gi;
    const near = (m) => { if (ORS.some(o => Math.hypot(o[0] - m[0], o[1] - m[1], o[2] - m[2]) < 26)) return true;   // 2차: 정확한 주황 말고 주황 계열 전체(입력칸 테두리 #C2613E 등) — 색상 5~30° · 채도 .45 넘게
      const [r, g, b] = m.map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; if (!d || mx !== r) return false;
      const s = d / (1 - Math.abs(2 * l - 1)), h = ((g - b) / d * 60 + 360) % 360; return h >= 5 && h <= 30 && s > .45 && l > .25 && l < .8; };
    const parse = (c) => { const m = (c || "").match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
    const SVGS = new Map();
    // 2차(11-05 주형): 주황 바탕 위에 진한 아이콘·글자가 얹혀 있던 곳(예: 마이크 버튼 위 파형 #1A1626)은 잉크 바탕과 겹쳐 안 보였다 →
    //   한 그림 안이면 진한 색을 흰색으로 먼저 바꾸고, 따로 얹힌 아이콘(img)·글자(p)는 잉크가 된 바탕 위에 있으면 흰색으로
    const DARK_RE = /#(1A1626|1C1730|0B0B0B|000000|000)\b/gi;
    const fixSvg = (u) => { if (!SVGS.has(u)) SVGS.set(u, fetch(u).then(r => r.text()).then(t => { OR_RE.lastIndex = 0; if (!OR_RE.test(t)) return null; return URL.createObjectURL(new Blob([t.replace(DARK_RE, "#FFFFFF").replace(OR_RE, "#1C1730")], { type: "image/svg+xml" })); }).catch(() => null)); return SVGS.get(u); };
    const darkC = (c) => { const m = parse(c); return m && m[3] > .3 && (.299 * m[0] + .587 * m[1] + .114 * m[2]) < 110; };
    // 11-05 진규: 앱을 켤 때 안 보이던 화면(R1 녹음 확인 시트 · 온보딩 등)은 크기가 0으로 재져 건너뛰어 잉크 버튼 위 글자가 진한 색 그대로였음 → 그 화면이 처음 보일 때(.on) 다시
    const later = (fig, base) => { const el = fig.closest(".scr"); if (!el) return; (el._wh || (el._wh = new Set())).add(base); if (el._whObs) return;
      el._whObs = new MutationObserver(() => { if (!el.classList.contains("on") || !el._wh.size) return; setTimeout(() => { const s = [...el._wh]; el._wh.clear(); s.forEach(k => whiten(fig, k)); }, 60); });
      el._whObs.observe(el, { attributes: true, attributeFilter: ["class"] }); };
    const whiten = (fig, base) => { const r = base.getBoundingClientRect(); if (r.width < 10 || r.height < 10) { later(fig, base); return; } const A = r.width * r.height;
      fig.querySelectorAll("img, p").forEach(k => { if (k === base) return; const b = k.tagName === "P" ? (() => { const g = document.createRange(); g.selectNodeContents(k); return g.getBoundingClientRect(); })() : k.getBoundingClientRect();   /* 11-05 진규: 글자는 칸 말고 글자 자리로 — 버튼과 같은 크기 칸(R1 녹음 시작 358×52)은 80% 넘어 빠졌음 */ if (!b.width || b.width * b.height >= A * .8) return;
        const x = b.left + b.width / 2, y = b.top + b.height / 2; if (x <= r.left || x >= r.right || y <= r.top || y >= r.bottom) return;
        if (k.tagName === "IMG") { if (!(k.getAttribute("src") || "").startsWith("blob:")) k.style.filter = "brightness(0) invert(1)"; }   /* 잉크 바탕 위 아이콘 = 흰색 */
        else if (darkC(getComputedStyle(k).color)) k.style.color = ON_INK; }); };   // 11-05 주형: #fff → 잉크 위 글자 토큰색(아래 inkText 와 같음)
    // 3차: 발산 화면(D · TU)도 포함 — 단 카드 덱 · 다이얼 안(다이얼 색을 따라가는 카드 색)은 건드리지 않음. 마스코트는 화면 밖 무대(#stage)라 원래 안 걸림
    const ids = Object.keys(P.SCR).filter(id => !/^C-B-/.test(id));   // C-B-* = 외부 서비스 로그인 흉내 화면(브랜드 색 그대로)
    const KEEP = '[data-name="div.deck"], [data-name^="div.card"], .beodial, .swipefx, .cardtint';
    // 4차: 반전 필터로 그리는 어두운 화면(.scr.dark — 발산 시트 등)은 잉크가 반전돼 옅게 보였다(카드 N장 뽑기 버튼) → 거기선 잉크의 반대색(#F2F1EC)을 넣어 반전 뒤 검정으로 보이게, 아이콘 흰색 바꾸기는 안 함(반전이 해 줌)
    const SVGSD = new Map();
    const fixSvgD = (u) => { if (!SVGSD.has(u)) SVGSD.set(u, fetch(u).then(r => r.text()).then(t => { OR_RE.lastIndex = 0; if (!OR_RE.test(t)) return null; return URL.createObjectURL(new Blob([t.replace(OR_RE, "#F2F1EC")], { type: "image/svg+xml" })); }).catch(() => null)); return SVGSD.get(u); };
    const one = (id) => { const fig = P.SCR[id].fig, inv = P.SCR[id].el.classList.contains("dark"), ink = inv ? "242,241,236" : "28,23,48"; fig.querySelectorAll("*").forEach(e => { if (e.closest(KEEP)) return; const cs = getComputedStyle(e);
        for (const [p, css] of [["backgroundColor", "background-color"], ["color", "color"], ["borderTopColor", "border-color"]]) { const m = parse(cs[p]); if (m && m[3] > .05 && near(m)) { e.style.setProperty(css, `rgba(${ink},${m[3]})`); if (!inv && p === "backgroundColor" && m[3] > .5) whiten(fig, e); } }
        if (e.tagName === "IMG") { const u = e.getAttribute("src") || e.dataset.src; if (u && /\.svg/.test(u) && !u.startsWith("blob:")) (inv ? fixSvgD : fixSvg)(u).then(nu => { if (!nu) return; if (e.dataset.src) e.dataset.src = nu; if (e.getAttribute("src")) e.src = nu; if (!inv) whiten(fig, e); }); } }); };
    ids.forEach((id, i) => setTimeout(() => one(id), 50 + i * 12));
  }
  // ---------- 프로젝트 시트(H5): 새 프로젝트 · 링크로 합류 ----------
  // 11-05 주형: 프로젝트 줄은 36 둥근 칸(x24) + 글자 x72 · 15/500 인데, '새 프로젝트' · '링크로 합류'는 20 아이콘 + 글자 x56 · 15/400 이라 글자 시작선이 안 맞았다.
  //   → 새 프로젝트 = 프로젝트 줄과 같은 셋째 줄(60 간격, '나' 칸과 같은 연한 36 칸 안에 +, 글자 x72 · 15/500, 줄 전체를 누를 수 있게)
  //   → 링크로 합류 = 구분선 빼고 그 아래 조금 떨어져 가운데 정렬 작은 글자(13 · #6B6484)
  function h5Layout() {
    const fig = P.SCR.H5 && P.SCR.H5.fig; if (!fig) return;
    const kids = [...fig.children], d = kids.findIndex(k => k.dataset.name === "dim"), ks = kids.slice(d + 1);
    const T = (t) => ks.find(k => k.tagName === "P" && k.textContent.trim() === t), Y = (k) => parseFloat(k.style.top);
    const tiles = ks.filter(k => k.dataset.name === "타일").sort((a, b) => Y(a) - Y(b)), last = tiles[tiles.length - 1], lastName = T("애플리케이션디자인");
    const add = T("새 프로젝트"), plus = ks.find(k => k.dataset.name === "icon plus"), link = T("링크로 합류"), linkIcon = ks.find(k => k.dataset.name === "icon link"), line = ks.find(k => k.dataset.name === "line" && Y(k) > Y(add || last));
    if (!last || !lastName || !add || !plus) return;
    const rowY = Y(last) + 60;   // 셋째 줄 칸 위
    const tile = clone(last); tile.style.top = rowY + "px"; tile.style.pointerEvents = "none"; last.after(tile);
    const ts = parseFloat(last.style.width) || 36, isz = parseFloat(plus.style.width) || 20;
    plus.style.left = (parseFloat(last.style.left) + (ts - isz) / 2) + "px"; plus.style.top = (rowY + (ts - isz) / 2) + "px"; plus.style.pointerEvents = "none"; tile.after(plus);
    // 글자: 줄 전체(칸 왼쪽부터)를 누를 수 있게 왼쪽 24 부터 넓게 두고 글자는 안쪽 여백으로 x72 에
    Object.assign(add.style, { left: last.style.left, width: (366 - parseFloat(last.style.left)) + "px", paddingLeft: (parseFloat(lastName.style.left) - parseFloat(last.style.left)) + "px", boxSizing: "border-box",
      top: (Y(lastName) + 60) + "px", fontSize: lastName.style.fontSize, fontWeight: lastName.style.fontWeight, lineHeight: getComputedStyle(lastName).lineHeight, color: getComputedStyle(lastName).color });
    if (line) line.style.display = "none";
    if (linkIcon) linkIcon.style.display = "none";
    if (link) Object.assign(link.style, { left: "0px", width: "390px", textAlign: "center", paddingLeft: "0", top: (rowY + ts + 26) + "px", fontSize: "13px", fontWeight: "500", color: "#6b6484" });
  }
  // ---------- 사이드바(관리 메뉴 M1) 정리 ----------
  // 11-05 주형: (오른쪽 값 글자는 left 340 을 오른쪽 끝으로 쓰는 피그마 배치라 › 앞 6 에서 이미 맞게 끝남 — 그대로 둠)
  //   ② 휴지통이 '도움' 묶음 안에 있었다 → '관리' 묶음 마지막 줄로 (묶음 상자 44 늘림) ③ 로그아웃이 아무 묶음에도 없이 아래(742)에 떠 있었다 → '도움' 묶음 마지막 줄로
  //   ④ 'COMET v10' 이 ⚙ 와 높이가 안 맞았다 → ⚙ 와 같은 줄(가운데), 왼쪽은 묶음 머리 글자와 같은 110
  // ---------- 설정(S0) · 사이드바 도움 줄은 줄 칸 전체를 누를 수 있게 ----------
  // 11-05 주형: 글자만 눌려서 오른쪽 › 쪽을 누르면 안 들어가졌다 → 연결된 글자 칸을 줄 높이 44 · 묶음 상자 오른쪽 끝(374)까지 넓힘 (글자 자리는 그대로, 줄 가운데)
  function rowHits() {
    const grow = (fig, text, rowTop) => { const p = fig && [...fig.children].find(k => k.tagName === "P" && k.textContent.trim() === text); if (!p) return;
      const top = rowTop ?? parseFloat(p.style.top) - 12; Object.assign(p.style, { top: top + "px", height: "44px", lineHeight: "44px", width: (374 - parseFloat(p.style.left)) + "px", whiteSpace: "nowrap" }); };
    const s0 = P.SCR.S0 && P.SCR.S0.fig, box = s0 && s0.querySelector('[data-name="그룹 앱"]');
    if (box) ["알림", "화면 모드", "글자 크기"].forEach((t, i) => grow(s0, t, parseFloat(box.style.top) + 44 * i));
    const m1 = P.SCR.M1 && P.SCR.M1.fig; ["도움말", "의견 보내기"].forEach(t => grow(m1, t));
  }
  function m1Layout() {
    const fig = P.SCR.M1 && P.SCR.M1.fig; if (!fig) return;
    const kids = [...fig.children], d = kids.findIndex(k => k.dataset.name === "dim"), ks = kids.slice(d + 1);
    const T = (t) => ks.find(k => k.tagName === "P" && k.textContent.trim() === t), N = (n) => ks.find(k => k.dataset.name === n);
    const Y = (k) => parseFloat(k.style.top), setY = (k, y) => { if (k) k.style.top = y + "px"; };
    const trash = T("휴지통"), gM = N("그룹 프로젝트"), gH = N("그룹 기록"), help = T("도움"), logout = T("로그아웃"), ver = T("COMET v10"), gear = ks.find(k => /^btn 설정/.test(k.dataset.name || ""));
    if (!trash || !gM || !gH || !help) return;
    // ② 휴지통 줄(글자 · 값 · › · 줄 칸 · 위 구분선)을 관리 묶음 끝으로: 줄 간격 44
    const tY = Y(trash), row = ks.filter(k => k !== gH && Y(k) >= tY - 14 && Y(k) <= tY + 2);   // 495(구분선) · 496(줄 칸) · 508(글자) · 509(값 · ›)
    const lastInM = Y(T("ai 연결")), dy = lastInM + 44 - tY;
    row.forEach(k => setY(k, Y(k) + dy)); gM.style.height = (parseFloat(gM.style.height) + 44) + "px";
    // 도움 머리 · 묶음 · 그 안 줄은 44 아래로
    const hTop = Y(help); ks.filter(k => !row.includes(k) && k !== logout && k !== ver && k !== gear && Y(k) >= hTop - 1 && Y(k) < Y(gH) + parseFloat(gH.style.height)).forEach(k => setY(k, Y(k) + 44));
    // ③ 로그아웃: 도움 묶음 셋째 줄 + 위 구분선(도움말 아래 구분선을 복제)
    const helpRows = ["도움말", "의견 보내기"].map(T).filter(Boolean), sep = ks.find(k => k.dataset.name === "Rectangle" && cin(k, gH));
    if (logout && helpRows.length === 2) { const y3 = Y(helpRows[1]) + 44; setY(logout, y3); logout.style.left = helpRows[0].style.left;
      if (sep) { const c = clone(sep); place(c, parseFloat(sep.style.left), Y(helpRows[1]) + 31); fig.appendChild(c); } }
    // ④ 버전: ⚙ 가운데 높이
    if (ver && gear) setY(ver, Y(gear) + parseFloat(gear.style.height) / 2 - (parseFloat(ver.style.height) || 14) / 2);
  }
  // ---------- 잉크(검은) 바탕 위 글씨는 밝은 토큰색으로 ----------
  // 11-05 주형(잉크 버튼 위 글씨): 포인트 주황을 잉크로 바꾼 뒤(위 noAccent) 버튼 안 글자가 진한 색 그대로라 안 보이는 곳이 많았다(M2-2 '초대' 등).
  //   noAccent 의 whiten 은 앱이 켜질 때 한 번만 돌아서 ① 그때 아직 안 그려진(크기 0) 화면은 건너뛰고 ② 원래부터 잉크였던 버튼(주황에서 바뀐 게 아닌 것)은 보지 않았다.
  //   → 화면이 보일 때마다 그 화면에서 잉크 바탕(밝기 < 90, 불투명) 위에 얹힌 진한 글자를 밝은 토큰색(#F5F2FC — 잉크 위 아이콘에 쓰는 색)으로. 반전 필터 화면(.scr.dark, 발산)은 반전이 해 주니 뺌
  const ON_INK = "#F5F2FC";
  let INK_RUN = null;   // inkText 의 run — 같은 화면 안에서 버튼이 새로 생길 때(연결 상태) 다시 부름
  function inkText() {
    const lum = (c) => { const m = (c || "").match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); return m ? { l: .299 * m[1] + .587 * m[2] + .114 * m[3], a: m[4] === undefined ? 1 : +m[4] } : null; };
    const fix = (s) => {
      if (!s || !s.fig || s.el.classList.contains("dark")) return;
      const all = [...s.fig.querySelectorAll("*")];
      const inks = all.filter(e => { const cs = getComputedStyle(e), b = lum(cs.backgroundColor); if (!b || b.a < .6 || b.l >= 90 || +cs.opacity < .5 || cs.visibility === "hidden") return false; const r = e.getBoundingClientRect(); return r.width >= 20 && r.height >= 18 && r.width * r.height < 390 * 300; });   // 화면만 한 큰 판(검은 덮개 등)은 뺌 · 투명하게 숨긴 버튼(연결 뒤 로그인 버튼)도 뺌 — 위에 얹힌 '연결 끊기' 글씨가 밝게 바뀌어 흐려졌다
      // 반대로 예전에 밝게 바꿨는데 지금은 밑에 잉크 바탕이 없는 글자는 원래 색으로
      all.forEach(t => { if (t.style.color === "rgb(245, 242, 252)" && t._inkFixed && !inks.some(e => e !== t && !t.contains(e) && centerIn(t, e))) { t.style.color = t._inkFixed; delete t._inkFixed; } });
      if (!inks.length) return;
      const rects = inks.map(e => [e, e.getBoundingClientRect()]);
      for (const t of all) {
        if (!(t.tagName === "P" || (t.tagName === "SPAN" && !t.children.length)) || !t.textContent.trim() || t.closest("[data-sb]")) continue;
        const c = lum(getComputedStyle(t).color); if (!c || c.l >= 110) continue;   // 이미 밝은 글자는 그대로
        const r = t.getBoundingClientRect(); if (!r.width) continue; const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const under = rects.find(([e, b]) => e !== t && !t.contains(e) && x > b.left && x < b.right && y > b.top && y < b.bottom && (e.contains(t) || e.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING));   // 글자가 그 바탕 위(안이거나 뒤에 그려짐)
        if (under && t.style.color !== "rgb(245, 242, 252)") { t._inkFixed = t.style.color || ""; t.style.color = ON_INK; }
      }
    };
    const run = () => Object.values(P.SCR).filter(s => s.el.classList.contains("on")).forEach(fix);
    INK_RUN = run;
    new MutationObserver(() => setTimeout(run, 60)).observe(document.body, { attributes: true, attributeFilter: ["data-screen"] });
    setTimeout(run, 400);
  }
  // OB-4(주제를 건너뛴 홈): 부제·날짜 자리에 남은 빈칸 표시 '-' 는 숨긴다
  const hideDashes = () => [...P.SCR["OB-4"].fig.querySelectorAll("p")].filter(q => q.textContent.trim() === "-").forEach(q => q.style.visibility = "hidden");
  function init() {
    wireConnect(); fixCarets(); hideDashes(); t4Layout(); recordCards(); recordHead(); recordDateOnly(); stickyChrome(); hideTopicSource(); obFixedBar(); noAccent(); inkText(); m1Layout(); rowHits(); h5Layout();
    for (const id of ["H1", "OB-4", "R2-6a", "R2-6c"]) moreChips(id);
    dropRecChip(); initList("T1"); initList("T7"); initSaved(); updateCount(); wireDeck(); transcript();
    for (const id of ["H1", "OB-4", "R2-6a", "R2-6c"]) scroller(id, 660, 710);
    scroller("M3-C", 120, 172); scroller("T1", 92 + T1_SHIFT, 136 + T1_SHIFT); scroller("T7", 90 + T7_SHIFT, 134 + T7_SHIFT);
    typing();
  }
  return { init, filter, wireDeck, addSaved, savedCount, saved: () => SAVED.map(c => ({ title: c.title, pinned: !!c.pinned })), render, renderSaved, nudgeDeck: () => nudgeDeck(), resetDeck: () => resetDeck(), dealIn: () => dealIn() };
})();
