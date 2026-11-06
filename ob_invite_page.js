// ob_invite_page.js — 온보딩 '팀원 초대' 페이지 OB-INV (티즈판, 11-04 · 주형 결정)
// 순서: OB-1 프로젝트 → OB-2 주제 → OB-INV 팀원 초대 → OB-3 각자 연결 → 시작하기 → 홈(발산 튜토리얼)
// 새 피그마 프레임 없이 기존 부품으로 조립한다:
//   틀 = OB-2(주제) 화면 그대로 (상단 뒤로 · 건너뛰기 · 마스코트 · 제목 · 진행 점 · 하단 '다음') — 주제 입력 부분만 뺌
//   내용 = M2-2(팀원 초대 바텀시트)의 부품 그대로 (이름·이메일 칸 + 수정 가능 · 전에 함께한 사람 + 초대 · 공유 다섯 · 초대 링크 줄), 세로로만 옮김
// 진행 점도 4단계로 맞춘다 (OB-1 · OB-2 · OB-INV · OB-3 각자 자기 차례).
// COMET.build() 전에 <template id="tpl-OB-INV"> 를 만들어 두면 router 가 다른 화면처럼 그린다 (화면 이름·연결은 flow.js, 마스코트 자리는 mascot.js).
(() => {
  const TXT = { title: "같이 할 팀원을 불러요", sub: "링크로 초대해요. 지금 안 해도 돼요" };
  // 13판(11-04 시연): 글이 많아 위계가 흐림 → 이름·이메일 칸과 '전에 함께한 사람'(앱 안 관리 메뉴 M2-2 에 그대로 있음)은 빼고, 아래 2) 처럼 링크·권한·보내기만
  const CUT = { from: 290, to: 690 };             // OB-2 에서 뺄 범위 (주제 입력칸 · 말로 입력 · 안내 줄)
  const top = (e) => parseFloat(e.style && e.style.top);
  const ob2 = document.getElementById("tpl-OB-2"), m22 = document.getElementById("tpl-M2-2");
  if (!ob2 || !m22 || document.getElementById("tpl-OB-INV")) return;
  // 11-05 주형(팀원 초대 권한): M2-2 시트의 '수정 가능 ▾' 글자에 이름을 붙임 — 템플릿엔 뒤 화면(M2) 사본이 숨은 채 같이 있어서 글자로 찾으면 숨은 쪽이 먼저 잡혔다. 'dim' 뒤(시트 쪽)의 것만
  { const kids = [...m22.content.querySelector(".fig").children], d = kids.findIndex(k => k.dataset.name === "dim");
    const p = kids.slice(d + 1).find(k => k.tagName === "P" && /^수정 가능/.test(k.textContent.trim())); if (p) p.dataset.name = "권한 · 초대할 사람"; }

  // 1) 틀: OB-2 복제 → 주제 입력 부분 빼고 글 바꾸기
  const frag = ob2.content.cloneNode(true), fig = frag.querySelector(".fig");
  fig.dataset.screen = "OB-INV"; fig.dataset.name = "OB-INV_팀원 초대 (온보딩)"; fig.removeAttribute("data-node-id");
  [...fig.children].forEach(k => { const t = top(k); if (t >= CUT.from && t < CUT.to) k.remove(); });
  const ps = [...fig.querySelectorAll("p")];
  const setText = (re, txt) => { const p = ps.find(x => re.test(x.textContent.trim())); if (p) { const span = p.querySelector("span"); (span || p).textContent = txt; } };
  setText(/^주제가 뭐예요/, TXT.title); setText(/^교수님이 준 주제/, TXT.sub);

  // 2) 내용 (13판): Figma 앱 '초대하기' 처럼 — 앱은 '무엇을(링크·권한)'만 정하고 '어디로'는 운영체제 공유 시트에 맡긴다.
  //    카드(초대 링크 줄 · 권한 줄) → 안내 한 줄 → '초대 링크 보내기' 단추(누르면 아이폰 공유 시트). 카톡·메시지 아이콘 줄은 시트 몫이라 화면에선 뺌
  const before = fig.querySelector('[data-name="단계 점"]');
  const FONT = "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";
  const ICON = {
    link: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>',
    globe: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>',
    share: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7.5 7.5 12 3l4.5 4.5"/><path d="M8 10H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2"/></svg>',
  };
  const add = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); const n = t.content.firstChild; fig.insertBefore(n, before); return n; };
  const txt = (s, size, color, w = 500) => `font:${w} ${size}px/1.2 ${FONT};color:${color};white-space:nowrap`;
  const CARD = { top: 284, row: 56 };
  add(`<div data-name="초대 카드" style="position:absolute;top:${CARD.top}px;left:16px;width:358px;height:${CARD.row * 2}px;border-radius:16px;background:#fff;border:1px solid rgba(20,15,36,0.1);box-sizing:border-box"></div>`);
  add(`<div data-name="초대 링크 줄" style="position:absolute;top:${CARD.top}px;left:16px;width:358px;height:${CARD.row}px;display:flex;align-items:center;gap:12px;padding:0 16px;box-sizing:border-box;cursor:pointer">${ICON.link}<span style="${txt(0, 15, "#1a1626")};flex:1">comet.app/j/pd4-7f3a</span><span data-role="copy" style="${txt(0, 14, "#6b6484")}">복사</span></div>`);
  add(`<div data-name="초대 구분선" style="position:absolute;top:${CARD.top + CARD.row}px;left:54px;width:320px;height:1px;background:rgba(20,15,36,0.08)"></div>`);
  add(`<div data-name="초대 권한 줄" style="position:absolute;top:${CARD.top + CARD.row}px;left:16px;width:358px;height:${CARD.row}px;display:flex;align-items:center;gap:12px;padding:0 16px;box-sizing:border-box;cursor:pointer">${ICON.globe}<span style="${txt(0, 15, "#1a1626")};flex:1">링크로 들어온 사람</span><span data-role="perm" style="${txt(0, 14, "#6b6484")}">보기만 ▾</span></div>`);   // 11-05 주형: 권한 이름을 M2-1 시트와 같게(수정 가능 · 보기만 · 전체 권한)
  add(`<p data-name="초대 안내" style="position:absolute;top:${CARD.top + CARD.row * 2 + 12}px;left:0;width:390px;margin:0;text-align:center;${txt(0, 12, "#6b6484", 400)}">링크를 받은 사람은 로그인하면 바로 이 프로젝트에 들어와요</p>`);
  add(`<div data-name="공유 · 초대 링크 보내기" style="position:absolute;top:${CARD.top + CARD.row * 2 + 48}px;left:16px;width:358px;height:52px;border-radius:14px;background:rgba(20,15,36,0.05);border:1.25px solid rgba(20,15,36,0.12);box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer">${ICON.share}<span style="${txt(0, 16, "#1a1626", 600)}">초대 링크 보내기</span></div>`);
  const tpl = document.createElement("template"); tpl.id = "tpl-OB-INV"; tpl.content.appendChild(frag);
  ob2.after(tpl);

  // 3) 진행 점 4개 (자기 차례만 진하게). 원래는 3개(프로젝트·주제·연결)
  const STEP = { "OB-1": 0, "OB-2": 1, "OB-INV": 2, "OB-3": 3 }, GAP = 14, N = 4;
  for (const [id, on] of Object.entries(STEP)) {
    const t = document.getElementById("tpl-" + id); if (!t) continue;
    const f = t.content.querySelector(".fig"), dots = [...f.children].filter(k => k.dataset.name === "단계 점"); if (dots.length < 2) continue;
    const srcs = dots.map(d => d.querySelector("img") && d.querySelector("img").getAttribute("src"));
    const count = (x) => srcs.filter(y => y === x).length, offSrc = srcs.find(x => count(x) > 1) || srcs[0], onSrc = srcs.find(x => x !== offSrc) || srcs[0];
    const left0 = 195 - ((N - 1) * GAP) / 2 - 4;   // 가운데(195) 기준, 점 지름 8
    const tmpl = dots[0];
    for (let i = 0; i < N; i++) {
      const d = i < dots.length ? dots[i] : tmpl.cloneNode(true);
      d.style.left = `${left0 + i * GAP}px`; const img = d.querySelector("img"); if (img) img.setAttribute("src", i === on ? onSrc : offSrc);
      if (i >= dots.length) dots[dots.length - 1].after(d);
    }
  }

  // 3-2) 13판: OB-3(ai·자료 연결) 타일 로고. ① 피그마·제미나이·구글 캘린더는 피그마 코드가 조각을 마스크 그림(OB-3/assets/d0aef·15429·3b22b.svg)으로
  //   오려 내는데 그 파일이 저장소에 없어(404) 통째로 안 보였음 → 브랜드 로고 벡터로 바꿈. ② 타일(114×96)에 비해 로고(30)가 작음 → 모든 로고 40 (가운데 그대로, 아래 이름과 8px)
  { const t3 = document.getElementById("tpl-OB-3"), f3 = t3 && t3.content.querySelector(".fig");
    if (f3) {
      const LOGO = {};   // 13판: 빠졌던 마스크 3개(d0aef·15429·3b22b)를 프로젝트 피그마(BPnM6…, 866:5151·5173·5211)에서 받아 넣어 원본 로고가 그대로 나옴 → 대신 그리던 벡터는 뺌
      const SIZE = 30;   // 진규 11-04 기준 이미지: 원래 칸(30) 크기가 맞음 → 키우지 않음
      [...f3.querySelectorAll('[data-name^="타일"]')].forEach(tile => {
        const tl = parseFloat(tile.style.left), tt = parseFloat(tile.style.top), tw = parseFloat(tile.style.width);
        const cx = tl + tw / 2, cy = tt + 19 + 15;   // 원래 로고 칸(30) 의 가운데
        const lg = [...f3.querySelectorAll('[data-name^="logo "]')].find(l => { const x = parseFloat(l.style.left) + parseFloat(l.style.width) / 2; return Math.abs(x - cx) < 12 && Math.abs(parseFloat(l.style.top) - (tt + 19)) < 8; });
        if (!lg) return;
        const key = lg.dataset.name.slice(5);
        if (LOGO[key]) { lg.innerHTML = LOGO[key]; lg.style.width = lg.style.height = "30px"; lg.style.left = `${cx - 15}px`; lg.style.top = `${cy - 15}px`; }
        const w = parseFloat(lg.style.width), h = parseFloat(lg.style.height), k = SIZE / 30;   // 비율 그대로 30 → 40 (가운데 기준)
        lg.style.width = `${w * k}px`; lg.style.height = `${h * k}px`; lg.style.left = `${cx - w * k / 2}px`; lg.style.top = `${cy - h * k / 2}px`;
        lg.querySelectorAll("img").forEach(i => { i.style.width = "100%"; i.style.height = "100%"; });
      });
    }
  }

  // 4) 동작: 초대 → '보냄', 공유 → 알림. (M2 의 invite 는 마스코트를 상단으로 옮겼다 숨기는 연출이라 온보딩엔 안 맞음)
  const toast = (msg) => { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; $("phone").appendChild(t); setTimeout(() => t.remove(), 1600); };
  ACTIONS.obInvite = ({ el }) => {
    if (!el || el.dataset.sent) return; el.dataset.sent = "1"; el.style.background = "#efedf5";
    const r = el.getBoundingClientRect(), p = [...el.parentElement.querySelectorAll("p")].find(q => { const b = q.getBoundingClientRect(); return Math.abs(b.top - r.top) < 12 && b.left >= r.left - 4 && b.left <= r.right; });
    if (p) { p.textContent = "보냄"; p.style.color = "#6b6484"; }
    COMET.react("happy"); toast("초대를 보냈어요");
  };
  // 13판: 링크 줄 = 복사, 권한 줄 = 보기만 ↔ 편집 가능, '초대 링크 보내기' = 아이폰 공유 시트
  ACTIONS.obCopy = () => { toast("초대 링크를 복사했어요"); COMET.react("happy"); };
  // 11-05 주형: 권한 줄을 누르면 → 사이드바 팀 화면과 같은 권한 바텀 시트(M2-1)가 올라와 고름 (아래 6)
  ACTIONS.obPerm = ({ el }) => { const s = el && el.querySelector('[data-role="perm"]'); if (s) PERM.open(s, "링크로 들어온 사람", "초대 링크를 받은 사람이 할 수 있는 일"); };
  // 진짜 운영체제 공유 시트: 브라우저의 Web Share API(navigator.share). 아이폰 사파리에서 https 로 열면 iOS 가 자기 시트·애니메이션을 그대로 띄움.
  // 폰(손가락 화면)에서 쓸 수 있을 때만 진짜 시트, 아니면(데스크탑 미리보기 · http) 아래 흉내 시트
  const realShare = () => !!navigator.share && window.isSecureContext && matchMedia("(pointer: coarse)").matches;
  ACTIONS.obShare = () => {
    if (!realShare()) return SHARE.open();
    navigator.share({ title: "Comet 프로젝트 초대", text: "같이 할 팀원을 불러요", url: "https://comet.app/j/pd4-7f3a" })
      .then(() => { toast("초대 링크를 보냈어요"); COMET.react("happy"); })
      .catch((e) => { if (e && e.name !== "AbortError") SHARE.open(); });   // 사용자가 닫으면 그냥 끝, 막히면 흉내 시트로
  };

  // 5) 아이폰 공유 시트 흉내 (프로토타입용 — 실제 앱에선 운영체제가 그림. 줄 내용은 사람·기기마다 다름).
  //    올라오기·내려가기 = 0.5초 cubic-bezier(.32,.72,0,1): 아이폰 시트 움직임을 웹으로 옮긴 오픈소스 vaul(Emil Kowalski) 의 값
  const SHARE = (() => {
    const EASE = "cubic-bezier(.32,.72,0,1)", DUR = 500;
    // 13판: 값은 Apple 공식 iOS and iPadOS 27 UI Kit 'Activity View'(피그마 128:58645) 그대로 — 시트 위 모서리 38 · 흰 바탕 · 그림자 0 15 75 .18,
    //   머리(썸네일 64·모서리 16 / 제목 16 semibold #1a1a1a · 부제 #727272 / 닫기 44 유리 원), 줄마다 위 구분선 #e6e6e6 · 줄 안쪽 15 · 위 16,
    //   칸 66 · 간격 25.333 · 이름 12/16 (칸 위에서 72~73) · 사람 원 66 + 앱 표시 20(모서리 5) · 앱 66(모서리 15) · 동작 원 66 #ededed 기호 27. 줄은 옆으로 밀림.
    //   앱 아이콘 그림(PNG)은 저장소 규칙(그림 안 올림)상 키트 것을 안 받고 벡터로 그림. 글꼴은 SF Pro 가 없으면 Pretendard
    const SF = `-apple-system, 'SF Pro Text', ${FONT}`;   // 작은따옴표: style="…" 안에 들어가므로 큰따옴표면 속성이 끊김
    const ROW = "position:relative;display:flex;gap:25.333px;align-items:flex-start;padding:16px 15px 4px;overflow-x:auto;overflow-y:hidden;scrollbar-width:none";   // 아래 4px: 옆으로 밀리는 줄은 세로도 잘려서 이름(칸 위 73 + 16)이 잘리던 것
    const SEP = '<span style="position:absolute;left:15px;right:15px;top:0;height:0;border-top:1px solid #e6e6e6"></span>';
    const LABEL = (t, top) => `<span style="position:absolute;left:-8px;right:-8px;top:${top}px;text-align:center;font:400 12px/16px ${SF};color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t}</span>`;
    const person = (name, ch, bg, badge) => `<button data-to="${name}" style="all:unset;cursor:pointer;position:relative;flex:none;width:66px;height:102px"><span style="position:absolute;left:0;top:0;width:66px;height:66px;border-radius:100px;background:${bg};display:grid;place-items:center;font:600 26px/1 ${SF};color:#fff">${ch}</span><span style="position:absolute;left:46px;top:46px;width:20px;height:20px;border-radius:5px;display:grid;place-items:center;background:${badge === "카톡" ? "#FEE500" : "linear-gradient(#6ee36b,#2fbf3a)"}">${badge === "카톡" ? '<img alt="" src="/figma5/M2-2/assets/7fcec.svg" style="width:15px;height:15px">' : '<svg width="13" height="13" viewBox="0 0 24 24"><path d="M12 4c4.97 0 9 3.13 9 7s-4.03 7-9 7c-1 0-1.96-.12-2.85-.35L5 20l1.2-3.4C4.2 15.3 3 13.3 3 11c0-3.87 4.03-7 9-7z" fill="#fff"/></svg>'}</span>${LABEL(name, 72)}</button>`;
    const app = (name, bg, glyph) => `<button data-to="${name}" style="all:unset;cursor:pointer;position:relative;flex:none;width:66px;height:85px"><span style="position:absolute;left:0;top:0;width:66px;height:66px;border-radius:15px;background:${bg};display:grid;place-items:center">${glyph}</span>${LABEL(name, 73)}</button>`;
    const W = (d) => `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    const act = (name, glyph) => `<button data-act="${name}" style="all:unset;cursor:pointer;position:relative;flex:none;width:66px;height:104px"><span style="position:absolute;left:0;top:0;width:66px;height:66px;border-radius:1000px;background:#ededed;display:grid;place-items:center">${glyph}</span>${LABEL(name, 73)}</button>`;
    const D = (d, s = 27) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    const GLASS = "background:rgba(255,255,255,.72);box-shadow:1.25px 0 0 -0.75px #d0d0d0,-1.25px 0 0 -0.75px #d0d0d0,0 0 0 .5px #e8e8e8,0 8px 15px rgba(0,0,0,.02);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)";
    let root = null, sheet = null, dim = null, busy = false;
    function build() {
      root = document.createElement("div"); root.id = "obShare"; root.style.cssText = "position:absolute;inset:0;z-index:30;display:none";
      root.innerHTML = `<style>#obShare [data-row]::-webkit-scrollbar{display:none}</style><div data-dim style="position:absolute;inset:0;background:rgba(0,0,0,.2);opacity:0"></div>
        <div data-sheet style="position:absolute;left:0;right:0;bottom:0;border-radius:38px 38px 0 0;background:#fff;box-shadow:0 15px 75px rgba(0,0,0,.18);padding:16px 16px 34px;display:flex;flex-direction:column;gap:20px;transform:translateY(110%)">
          <div style="display:flex;gap:16px;align-items:flex-start">
            <span style="padding:16px 0 0 16px;flex:none"><span data-thumb style="display:grid;place-items:center;width:64px;height:64px;border-radius:16px;border:.5px solid rgba(0,0,0,.15);box-shadow:0 2px 16px rgba(0,0,0,.15);background:#0B0B0B;box-sizing:border-box"></span></span>
            <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:12px;padding-top:16px">
              <span style="display:flex;flex-direction:column;gap:1px;font-size:16px;letter-spacing:-0.1152px"><span style="font:590 16px/20px ${SF};color:#1a1a1a">Comet 프로젝트 초대</span><span style="font:400 16px/20px ${SF};color:#727272">comet.app</span></span>
              <span style="font:400 15px/18px ${SF};letter-spacing:-0.08px;color:#727272;white-space:nowrap">보기만 가능한 링크 <span style="color:#bfbfbf">›</span></span>
            </span>
            <button data-act="닫기" aria-label="닫기" style="all:unset;cursor:pointer;flex:none;width:44px;height:44px;border-radius:1000px;display:grid;place-items:center;${GLASS}">${D('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>', 20)}</button>
          </div>
          <div data-row style="${ROW}">${SEP}
            ${person("박서연", "박", "#8e8ec4", "메시지")}${person("최도윤", "최", "#a7a1c9", "메시지")}${person("정하린", "정", "#9bc3f5", "카톡")}${person("한지우", "한", "#c49e8e", "카톡")}${person("윤아린", "윤", "#9fc49e", "메시지")}<!-- 13판: 실제 사람 이름 대신 지어낸 이름 -->
          </div>
          <div data-row style="${ROW}">${SEP}
            ${app("AirDrop", "linear-gradient(#3fa9ff,#1272e8)", W('<circle cx="12" cy="13" r="2"/><path d="M8.5 17a5 5 0 1 1 7 0"/><path d="M6 19.5a8.5 8.5 0 1 1 12 0"/>'))}
            ${app("메시지", "linear-gradient(#6ee36b,#2fbf3a)", W('<path d="M12 4c4.97 0 9 3.13 9 7s-4.03 7-9 7c-1 0-1.96-.12-2.85-.35L5 20l1.2-3.4C4.2 15.3 3 13.3 3 11c0-3.87 4.03-7 9-7z" fill="#fff" stroke="none"/>'))}
            ${app("Mail", "linear-gradient(#4fb2ff,#1a73e8)", W('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/>'))}
            ${app("카카오톡", "#FEE500", '<img alt="" src="/figma5/M2-2/assets/7fcec.svg" style="width:48px;height:48px">')}
            ${app("메모", "linear-gradient(#fff 0 30%,#fffdf5 30%)", '<svg width="66" height="66" viewBox="0 0 24 24" fill="none" stroke="#d9d9d9" stroke-width=".5" style="border-radius:15px"><rect width="24" height="24" fill="#fff" stroke="none"/><rect width="24" height="6" fill="#ffd60a" stroke="none"/><path d="M3 11h18M3 15h18M3 19h18"/></svg>')}
          </div>
          <div data-row style="${ROW}">${SEP}
            ${act("복사", D('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'))}
            ${act("QR 코드", D('<rect x="3.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2"/><g fill="#1a1a1a" stroke="none"><rect x="5.75" y="5.75" width="2.5" height="2.5" rx=".4"/><rect x="15.75" y="5.75" width="2.5" height="2.5" rx=".4"/><rect x="5.75" y="15.75" width="2.5" height="2.5" rx=".4"/><rect x="13.5" y="13.5" width="2.5" height="2.5" rx=".4"/><rect x="18" y="13.5" width="2.5" height="2.5" rx=".4"/><rect x="15.75" y="15.75" width="2.5" height="2.5" rx=".4"/><rect x="13.5" y="18" width="2.5" height="2.5" rx=".4"/><rect x="18" y="18" width="2.5" height="2.5" rx=".4"/></g>'))}
            ${act("즐겨찾기", D('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>'))}
            ${act("더 보기", D('<circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/>'))}
          </div>
        </div>`;
      $("phone").appendChild(root); sheet = root.querySelector("[data-sheet]");
      { const ic = $("icon") && $("icon").querySelector("svg"), th = root.querySelector("[data-thumb]"); if (ic && th) { const s = ic.cloneNode(true); s.setAttribute("width", "48"); s.setAttribute("height", "48"); th.appendChild(s); } } dim = root.querySelector("[data-dim]");   // 머리 썸네일 = 바탕화면 Comet 앱 아이콘 (키트처럼 64·모서리 16 안에 꽉)
      // 앱의 누르기 처리(router, phone 캡처)는 좌표로 뒤에 깔린 화면 단추('다음' 등)를 고르므로, 시트 안 누르기는 그보다 먼저(window 캡처) 받아서 끝낸다
      for (const k of ["pointerdown", "click"]) window.addEventListener(k, (ev) => {
        if (!root || root.style.display === "none" || !root.contains(ev.target)) return;
        ev.stopPropagation(); ev.preventDefault(); if (k !== "click") return;
        const b = ev.target.closest("[data-to],[data-act]");
        if (!b) { if (ev.target === dim) close(); return; }
        if (b.dataset.to) { close(); setTimeout(() => { toast(`${b.dataset.to}(으)로 초대 링크를 보냈어요`); COMET.react("happy"); }, 200); return; }
        const a = b.dataset.act; if (a === "닫기") return close();
        if (a === "복사") { close(); setTimeout(() => ACTIONS.obCopy(), 200); return; }
        toast(a === "QR 코드" ? "QR 코드를 보여 줘요" : a === "즐겨찾기" ? "즐겨찾기에 넣었어요" : "다른 앱 목록이 열려요");
      }, true);
    }
    function open() {
      if (busy) return; if (!root) build(); busy = true; root.style.display = "block";
      sheet.style.transition = dim.style.transition = "none"; sheet.style.transform = "translateY(110%)"; dim.style.opacity = "0"; sheet.offsetHeight;   // 시작 자리에서 출발
      sheet.style.transition = `transform ${DUR}ms ${EASE}`; dim.style.transition = `opacity ${DUR}ms ${EASE}`;
      sheet.style.transform = "translateY(0)"; dim.style.opacity = "1"; setTimeout(() => { busy = false; }, DUR);
    }
    function close() {
      if (!root || root.style.display === "none") return; busy = true;
      sheet.style.transform = "translateY(110%)"; dim.style.opacity = "0";
      setTimeout(() => { root.style.display = "none"; busy = false; }, DUR);
    }
    return { open, close, isOpen: () => !!root && root.style.display !== "none" };
  })();
  window.OB_SHARE = SHARE;

  // 6) 11-05 주형(팀원 초대 권한): 권한 고르기는 사이드바 팀 화면(M2)에서 멤버 권한을 누르면 뜨는 바텀 시트(M2-1) 하나로.
  //    온보딩 팀원 초대(OB-INV 권한 줄) · 사이드바 팀원 초대(M2-2 '수정 가능 ▾')에서 열면 같은 시트를 띄우되
  //    머리(팀원 A · 회의 3 참여…)만 초대용 글로 바꾸고 '팀에서 내보내기'는 숨김, ✓ 는 지금 고른 권한에. 고르면 그 줄 글자가 바뀌고 시트가 내려감.
  //    시트가 닫히면(고르기 · 바깥 누르기 둘 다) 멤버용 원래 모습으로 되돌림. 예전 흰 시트(따로 만든 PERM)는 뺌
  const PERM = (() => {
    const OPTS = ["수정 가능", "보기만", "전체 권한"];
    let ctx = null, orig = null;
    const fig = () => COMET.SCR["M2-1"] && COMET.SCR["M2-1"].fig;
    // 시트 쪽 부품만: 템플릿엔 뒤 화면(M2) 사본이 숨은 채 같이 있어서('팀원 A' 등 같은 글자) 'dim' 뒤의 것만 본다
    const sheetKids = (f) => { const k = [...f.children], d = k.findIndex(x => x.dataset.name === "dim"); return k.slice(d + 1); };
    const P = (ks, t) => ks.find(p => p.tagName === "P" && p.textContent.trim() === t);
    function parts(f) {   // 시트 안 부품: 머리 두 줄 · 선택 바탕 · ✓ · 선택지 제목 셋 · 구분선 · 내보내기
      const ks = sheetKids(f), ps = ks.filter(k => k.tagName === "P");
      return { name: orig ? orig.name.el : ps.find(p => p.textContent.trim() === "팀원 A"), sub: orig ? orig.sub.el : ps.find(p => /참여 · /.test(p.textContent)),
        box: ks.find(k => k.dataset.name === "선택됨"), check: P(ks, "✓"), opts: OPTS.map(t => P(ks, t)), line: ks.find(k => k.dataset.name === "line"), out: P(ks, "팀에서 내보내기") };
    }
    function remember(f) { if (orig) return; const p = parts(f); orig = { name: { el: p.name, t: p.name.textContent }, sub: { el: p.sub, t: p.sub.textContent }, boxTop: p.box.style.top, checkTop: p.check.style.top }; }
    function mark(f, label) {   // 선택 바탕 · ✓ 를 그 선택지 줄로 (제목 위 12 · 제목 아래 8 — 피그마 값)
      const p = parts(f), o = p.opts[OPTS.indexOf(label)]; if (!o) return; const t = parseFloat(o.style.top);
      p.box.style.top = (t - 12) + "px"; p.check.style.top = (t + 8) + "px";
    }
    function restore() {
      const f = fig(); if (!f || !orig) return; const p = parts(f);
      orig.name.el.textContent = orig.name.t; orig.sub.el.textContent = orig.sub.t; p.box.style.top = orig.boxTop; p.check.style.top = orig.checkTop;
      [p.line, p.out].forEach(e => { if (e) e.style.display = ""; }); COMET.SCR["M2-1"].el.style.zIndex = ""; ctx = null;
    }
    function open(target, title, sub) {
      const f = fig(); if (!f) return; remember(f); const p = parts(f);
      ctx = { target }; p.name.textContent = title; p.sub.textContent = sub; [p.line, p.out].forEach(e => { if (e) e.style.display = "none"; });
      const now = OPTS.find(t => target.textContent.replace("▾", "").trim().startsWith(t)) || "보기만"; mark(f, now);
      // 화면들은 HTML 순서대로 겹치는데 M2-1 이 M2-2 보다 앞이라, 팀원 초대 시트 위에서 열면 밑에 깔렸다 → 지금 보이는 화면들보다 위로
      const zs = Object.values(COMET.SCR).filter(s => s.el.classList.contains("on")).map(s => parseInt(getComputedStyle(s.el).zIndex) || 0);
      COMET.SCR["M2-1"].el.style.zIndex = String(Math.max(1, ...zs) + 1);
      COMET.show("M2-1", "sheet");
    }
    // M2-1 에서 선택지를 누름(flow.js fn:permPick). 초대에서 연 게 아니면(멤버 권한) 예전처럼 닫기만
    ACTIONS.permPick = ({ el }) => {
      const f = fig(); if (!f) return COMET.back();
      const r = el.getBoundingClientRect(), y = r.top + r.height / 2;
      const label = OPTS.find(t => { const o = parts(f).opts[OPTS.indexOf(t)]; if (!o) return false; const b = o.getBoundingClientRect(); return y >= b.top - 14 && y <= b.top + 48; }) || el.textContent.trim();
      if (ctx && OPTS.includes(label)) {
        mark(f, label); ctx.target.textContent = `${label} ▾`;
        const head = document.querySelector("#obShare [data-sheet] span[style*='white-space:nowrap']");
        if (head && head.firstChild) head.firstChild.textContent = `${label === "전체 권한" ? "전체 권한" : label === "수정 가능" ? "수정 가능한" : "보기만 가능한"} 링크 `;   // 공유 시트 머리 글자도 같이
        return setTimeout(() => COMET.back(), 180);   // ✓ 가 옮겨 가는 걸 잠깐 보여 주고 내려감
      }
      COMET.back();
    };
    // 사이드바 팀원 초대(M2-2)의 '수정 가능 ▾'
    ACTIONS.invitePerm = ({ el }) => { const t = el && (el.tagName === "P" ? el : [...el.querySelectorAll("p")].find(p => /▾/.test(p.textContent))) ; if (t) open(t, "초대할 사람", "이 초대로 들어오는 사람이 할 수 있는 일"); };
    // 11-06 진규: 팀 화면(M2)의 검색칸 '수정 가능 ▾' · 링크 줄 '보기만 ▾' 도 같은 시트로 고르고 글자가 바뀜. 멤버 줄은 예전대로 시트만
    ACTIONS.m2Perm = ({ el }) => {
      const f = COMET.SCR.M2 && COMET.SCR.M2.fig; if (!f || !el) return;
      const row = (n) => f.querySelector(`[data-name="${n}"]`), inside = (a, b) => { if (!a || !b) return false; const r = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return r.top + r.height / 2 >= q.top && r.top + r.height / 2 <= q.bottom; };
      const pick = (box) => [...f.querySelectorAll("p")].find(p => /▾/.test(p.textContent) && inside(p, box));
      const bar = row("초대 입력칸"), link = row("일반 접근 줄");
      if (inside(el, bar)) { const t = el.tagName === "P" ? el : pick(bar); if (t) return open(t, "초대할 사람", "이 초대로 들어오는 사람이 할 수 있는 일"); }
      if (el === link || inside(el, link)) { const t = pick(link); watchLink(); if (t) return open(t, "링크가 있으면 누구나", "링크로 들어오는 사람이 할 수 있는 일"); }
      // 멤버 줄: 시트 머리를 그 사람 이름 · 참여로, 고르면 그 줄 글자가 바뀜. '팀에서 내보내기'는 보임
      const t = el.tagName === "P" && /▾/.test(el.textContent) ? el : null; if (!t) return COMET.show("M2-1", "sheet");
      const T = parseFloat(t.style.top), near = [...f.querySelectorAll(":scope > p")].filter(p => parseFloat(p.style.left) === 72 && Math.abs(parseFloat(p.style.top) - T) < 30).sort((a, b) => parseFloat(a.style.top) - parseFloat(b.style.top));
      if (near.length < 2) return COMET.show("M2-1", "sheet");
      open(t, near[0].textContent.trim(), near[1].textContent.trim());
      const q = parts(fig()); [q.line, q.out].forEach(e => { if (e) e.style.display = ""; });
    };
    // 11-06 진규: 선택지 줄의 글자 밖(줄 빈 곳)을 눌러도 그 줄을 고름 — 전엔 바깥(dim)으로 잡혀 고르지 않고 닫혔다
    let downY = 0; window.addEventListener("pointerdown", (e) => { downY = e.clientY; }, true);
    ACTIONS.permDim = () => {
      const f = fig(); const o = f && parts(f).opts.find(p => { if (!p) return false; const b = p.getBoundingClientRect(); return b.height && downY >= b.top - 14 && downY <= b.top + 48; });
      return o ? ACTIONS.permPick({ el: o }) : COMET.back();
    };
    // 링크 줄 권한이 바뀌면 아래 설명 글도 (화면이 다 만들어진 뒤라야 해서 링크 줄을 처음 열 때 한 번 붙임)
    let watched = false; const watchLink = () => { if (watched) return; watched = true; const f = COMET.SCR.M2 && COMET.SCR.M2.fig; if (!f) return; const ps = [...f.querySelectorAll("p")], d = ps.find(p => /^링크로 들어오면/.test(p.textContent.trim())), link = f.querySelector('[data-name="일반 접근 줄"]'); if (!d || !link) return;
      const L = parseFloat(link.style.top), t = ps.find(p => /▾/.test(p.textContent) && parseFloat(p.style.top) > L && parseFloat(p.style.top) < L + parseFloat(link.style.height)); if (!t) return;
      const SAY = { "수정 가능": "고칠 수 있어요", "보기만": "보기만 돼요", "전체 권한": "모든 걸 할 수 있어요" };
      new MutationObserver(() => { const k = Object.keys(SAY).find(k => t.textContent.trim().startsWith(k)); if (k) d.textContent = d.textContent.trim().replace(/^링크로 들어오면 [^.]*\./, `링크로 들어오면 ${SAY[k]}.`); }).observe(t, { childList: true, characterData: true, subtree: true }); };
    // 시트가 어떤 길로든 닫히면 원래(멤버용) 모습으로 — 닫히는 애니메이션(.34초)이 끝난 뒤
    let was = null; new MutationObserver(() => { const now = document.body.dataset.screen; if (was === "M2-1" && now !== "M2-1" && ctx) setTimeout(restore, 360); was = now; }).observe(document.body, { attributes: true, attributeFilter: ["data-screen"] });
    return { open };
  })();
})();
