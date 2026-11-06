// loginpages.js — 13판(11-04 시연): 외부 연결을 실제 아이폰처럼.
//   예전: 어느 서비스든 '구글 계정 허용' 한 장 → Figma·Slack 을 연결해도 구글 로그인, 이미 로그인된 상태에서 시작, 노션·드라이브·카톡·md 는 로그인/파일 고르기 없음
//   지금: 앱 안 브라우저(위 ✕ · 주소 · 메뉴 / 아래 ‹ · 공유 · 새로고침) 안에서 단계가 바뀜. 마지막 단계의 'btn 허용' 만 기존 연결 흐름(fn:connectDone)으로
//     · 구글 서비스(Gemini · 캘린더 · 드라이브): 구글 로그인(이메일 → 비밀번호) → 허용("Comet 이 Google ○○ 에 접근하려고 해요", 권한 목록)
//     · 그 밖(Figma · Slack · Perplexity · GitHub · 노션): 서비스 로그인 — 'Google 로 계속하기'(→ 구글 이메일 → 비밀번호, '○○(으)로 이동') 또는 자기 아이디·비밀번호
//     · 카톡 대화 파일 · 개인 md 폴더: iOS '파일' 고르기 화면 → '열기'(btn 가져오기 → fn:importDone)
//   flow.js 다음 · router.js 앞에서 실행: 새 화면(C-B-gdrive · C-B-notion · C-P-kakao · C-P-md)을 SCREENS·FLOW 에 더하고 템플릿을 만든다
//   계정은 지어낸 이름(한지우 · jiwoo.han@example.com). 로고는 OB-3 원본 로고 복제 · 공개된 공식 모양(Google G · Figma · GitHub) · 프로젝트 그림
(() => {
  const F = "'Pretendard Variable', Pretendard, -apple-system, 'Noto Sans KR', sans-serif", SF = `-apple-system, 'SF Pro Text', ${F}`;
  const TOP = 64, ACC = { name: "한지우", mail: "jiwoo.han@example.com", ch: "한" };
  const G = (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"/></svg>`;
  const FIGMA = '<svg width="28" height="42" viewBox="0 0 38 57"><path fill="#1ABCFE" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"/><path fill="#0ACF83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"/><path fill="#FF7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z"/><path fill="#F24E1E" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"/><path fill="#A259FF" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"/></svg>';
  const GITHUB = '<svg width="48" height="48" viewBox="0 0 16 16"><path fill="#1f2328" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';
  const IMG = (src, w, h) => `<img alt="" src="${src}" style="width:${w}px;height:${h}px;display:block">`;
  const APPICON = (s = 56) => IMG("/figma5/H5/assets/comet_app.svg", s, s);
  // OB-3 연결 타일의 원본 로고(피그마 조각 · 마스크 그림 포함)를 복제해 크기만 맞춤
  const ob3 = document.getElementById("tpl-OB-3"), ob3f = ob3 && ob3.content.querySelector(".fig");
  const LOGO = (name, s) => { const l = ob3f && ob3f.querySelector(`[data-name="logo ${name}"]`); if (!l) return ""; const c = l.cloneNode(true), w = parseFloat(l.style.width) || 30, h = parseFloat(l.style.height) || 30, k = s / 30;
    c.removeAttribute("data-node-id"); c.removeAttribute("data-name"); Object.assign(c.style, { position: "absolute", left: `${(30 - w) / 2}px`, top: `${(30 - h) / 2}px` });
    return `<span style="position:relative;display:block;width:30px;height:30px;transform:scale(${k});transform-origin:0 0;margin-right:${s - 30}px;margin-bottom:${s - 30}px">${c.outerHTML}</span>`; };
  const D = (d, s = 22, c = "#1a1a1a") => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const abs = (y, x, w, h, more = "") => `position:absolute;top:${y}px;left:${x}px;width:${w}px;${h ? `height:${h}px;` : ""}${more}`;
  const T = (y, s, w, c, more = "", x = 24, wid = 342) => `<p style="${abs(y, x, wid, 0, `margin:0;font:${w} ${s}px/1.3 ${SF};color:${c};${more}`)}">`;
  const BTN = (attr, y, label, style, icon = "", x = 24, w = 342, h = 50) => `<div ${attr} style="${abs(y, x, w, h, `border-radius:12px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:10px;font:600 16px/1 ${SF};cursor:pointer;${style}`)}">${icon}<span>${label}</span></div>`;
  const FIELD = (y, label, val = "", x = 24, w = 342, more = "") => `<div style="${abs(y, x, w, 54, `border-radius:8px;border:1px solid #c4c7c5;background:#fff;box-sizing:border-box;padding:0 14px;display:flex;align-items:center;font:400 16px/1 ${SF};color:${val ? "#1f1f1f" : "#80868b"};${more}`)}">${val || label}</div>`;
  const step = (id, host, body, first) => `<div data-step="${id}" class="lp-step${first ? " on" : ""}"><p style="${abs(TOP + 24, 70, 250, 0, `margin:0;text-align:center;font:600 17px/24px ${SF};color:#1a1a1a`)}">${host}</p>${body}</div>`;
  const frame = (steps) => `
    <p style="position:absolute;top:10px;left:24px;font-size:12px;margin:0;color:#1a1626">9:41</p>
    <div style="position:absolute;top:14px;left:338px;height:10px;width:24px;border-radius:4px;background-color:#1c1730"></div>
    <div style="${abs(TOP, 0, 390, 844 - TOP, "border-radius:38px 38px 0 0;background:#fff")}"></div>
    ${steps}
    <div data-name="btn 닫기" style="${abs(TOP + 14, 16, 44, 44, "border-radius:50%;background:#f2f2f7;display:grid;place-items:center;cursor:pointer")}">${D('<path d="M6 6l12 12M18 6 6 18"/>', 20)}</div>
    <div style="${abs(TOP + 14, 330, 44, 44, "border-radius:50%;background:#f2f2f7;display:grid;place-items:center")}">${D('<rect x="6" y="4" width="12" height="9" rx="2"/><path d="M6 17h12M8 20h8"/>', 20)}</div>
    <div data-back="1" style="${abs(772, 16, 52, 52, "border-radius:50%;background:#f2f2f7;display:grid;place-items:center;cursor:pointer")}">${D('<path d="m15 5-7 7 7 7"/>', 22, "#8e8e93")}</div>
    <div style="${abs(772, 270, 104, 52, "border-radius:26px;background:#f2f2f7;display:flex;align-items:center;justify-content:space-around")}">${D('<path d="M12 15V4M8 8l4-4 4 4"/><path d="M7 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1"/>')}${D('<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/>')}</div>`;
  const BLUE = "#0b57d0", NEXT = (attr) => BTN(attr, TOP + 470, "다음", `background:${BLUE};color:#fff;border-radius:20px`, "", 280, 86, 40);
  const CHIP = (y) => `<div style="${abs(y, 24, 342, 36, "display:flex;align-items:center;gap:8px")}"><span style="display:inline-flex;align-items:center;gap:8px;border:1px solid #c4c7c5;border-radius:18px;padding:5px 12px 5px 5px;font:500 14px/1 ${SF};color:#1f1f1f"><span style="width:24px;height:24px;border-radius:50%;background:#e07a3a;color:#fff;display:grid;place-items:center;font:600 12px/1 ${SF}">${ACC.ch}</span>${ACC.mail} ▾</span></div>`;
  // 구글 로그인 단계 — to: 이동할 앱 이름(구글 서비스면 'Comet'), last: 비밀번호 '다음' 이 끝인지(그 밖 서비스) 아니면 허용 단계로 가는지
  const googleSteps = (to, last, first) => [
    step("g1", "accounts.google.com", `
      <div style="${abs(TOP + 96, 24, 32, 32)}">${G(32)}</div>
      ${T(TOP + 150, 28, 400, "#1f1f1f")}로그인</p>
      ${T(TOP + 194, 16, 400, "#1f1f1f")}<span style="color:${BLUE}">${to}</span>(으)로 이동</p>
      ${FIELD(TOP + 250, "이메일 또는 휴대전화", ACC.mail)}
      ${T(TOP + 318, 14, 500, BLUE)}이메일을 잊으셨나요?</p>
      ${T(TOP + 360, 14, 400, "#444", "line-height:1.5")}내 컴퓨터가 아닌가요? 게스트 모드로 비공개 로그인하세요.</p>
      ${T(TOP + 480, 14, 500, BLUE, "", 24, 120)}계정 만들기</p>
      ${NEXT('data-go="g2"')}`, first),
    step("g2", "accounts.google.com", `
      <div style="${abs(TOP + 96, 24, 32, 32)}">${G(32)}</div>
      ${T(TOP + 150, 28, 400, "#1f1f1f")}환영합니다</p>
      ${CHIP(TOP + 198)}
      ${FIELD(TOP + 256, "비밀번호 입력", "••••••••••")}
      <div style="${abs(TOP + 326, 24, 342, 22, `display:flex;align-items:center;gap:10px;font:400 14px/1 ${SF};color:#1f1f1f`)}"><span style="width:16px;height:16px;border:2px solid #444;border-radius:2px;box-sizing:border-box"></span>비밀번호 표시</div>
      ${T(TOP + 480, 14, 500, BLUE, "", 24, 160)}비밀번호를 잊으셨나요?</p>
      ${last ? NEXT('data-name="btn 허용"') : NEXT('data-go="g3"')}`)];
  // 허용 단계(구글 서비스): Comet ↔ 서비스 로고 · 권한 목록 · 취소 / 허용
  const consent = (svc, logo, can) => step("g3", "accounts.google.com", `
    <div style="${abs(TOP + 92, 24, 342, 56, "display:flex;align-items:center;gap:14px")}">${APPICON(52)}${D('<path d="M5 12h14M13 6l6 6-6 6"/>', 20, "#80868b")}<span style="width:52px;height:52px;border-radius:14px;border:1px solid #e3e3e8;display:grid;place-items:center;box-sizing:border-box">${logo}</span></div>
    ${T(TOP + 168, 24, 400, "#1f1f1f", "line-height:1.35")}Comet이 ${svc}에<br>접근하려고 해요</p>
    ${CHIP(TOP + 246)}
    ${T(TOP + 304, 15, 600, "#1f1f1f")}Comet이 할 수 있는 일</p>
    ${can.map((c, i) => `<div style="${abs(TOP + 336 + i * 44, 24, 342, 40, `display:flex;align-items:center;gap:12px;border-bottom:1px solid #eceef0;font:400 15px/1.3 ${SF};color:#1f1f1f`)}">${D('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 18, "#188038")}${c}</div>`).join("")}
    ${T(TOP + 360 + can.length * 44, 13, 400, "#444", "line-height:1.5")}허용하면 Comet의 <span style="color:${BLUE}">개인정보처리방침</span>과 <span style="color:${BLUE}">서비스 약관</span>에 따라 정보를 사용해요.</p>
    ${BTN('data-name="btn 취소"', 680, "취소", `background:#fff;color:${BLUE};border:1px solid #c4c7c5;border-radius:20px`, "", 24, 165, 44)}
    ${BTN('data-name="btn 허용"', 680, "허용", `background:${BLUE};color:#fff;border-radius:20px`, "", 201, 165, 44)}`);
  const GOOGLE_SVC = {
    gemini: ["Gemini", LOGO("googlegemini", 30), ["Gemini 계정 정보 보기", "Gemini에 프로젝트 맥락 보내기"]],
    gcal: ["Google 캘린더", LOGO("googlecalendar", 30), ["캘린더 일정 보기", "회의 일정과 참석자 가져오기"]],
    gdrive: ["Google Drive", LOGO("googledrive", 30), ["고른 폴더의 파일 보기", "파일 이름과 내용 읽기"]],
  };
  // 서비스 로그인 첫 단계: 'Google 로 계속하기'(→ g1) 또는 자기 아이디·비밀번호(→ 바로 btn 허용)
  const SVC = {
    figma: ["figma.com", "Figma", `<div style="${abs(TOP + 96, 181, 28, 42)}">${FIGMA}</div>${T(TOP + 160, 30, 700, "#1e1e1e", "text-align:center")}Figma 로그인</p>
      ${T(TOP + 214, 13, 400, "#3a3a3a", "text-align:center;line-height:1.5")}'Google 계정으로 계속하기'를 누르면 Figma <u style="color:#0d6efd">서비스 이용 약관</u>에 동의하고 <u style="color:#0d6efd">개인정보 보호정책</u>을 확인한 것으로 봅니다.</p>
      ${BTN('data-go="g1"', TOP + 282, "Google 계정으로 계속하기", "border:1.5px solid #1e1e1e;color:#1e1e1e;background:#fff", G())}
      ${T(TOP + 346, 14, 400, "#3a3a3a", "text-align:center")}또는</p>
      ${FIELD(TOP + 378, "이메일")}${FIELD(TOP + 440, "비밀번호")}
      ${BTN('data-name="btn 허용"', TOP + 510, "로그인", "background:#2c2c2c;color:#fff")}
      ${T(TOP + 580, 14, 400, "#0d6efd", "text-align:center;text-decoration:underline")}단일 로그인(SSO) 사용</p>`],
    slack: ["slack.com", "Slack", `<div style="${abs(TOP + 96, 171, 48, 48)}">${IMG("/figma5/M3-C/assets/1878d.svg", 48, 48)}</div>
      ${T(TOP + 168, 28, 800, "#1d1c1d", "text-align:center")}Slack에 로그인</p>
      ${T(TOP + 214, 15, 400, "#454245", "text-align:center")}업무용 이메일 주소로 로그인하세요</p>
      ${BTN('data-go="g1"', TOP + 266, "Google로 계속하기", "border:1px solid #bbb;color:#1d1c1d;background:#fff", G())}
      ${T(TOP + 330, 14, 400, "#616061", "text-align:center")}또는</p>
      ${FIELD(TOP + 362, "name@work-email.com")}${FIELD(TOP + 424, "비밀번호")}
      ${BTN('data-name="btn 허용"', TOP + 494, "로그인", "background:#4a154b;color:#fff")}`],
    px: ["perplexity.ai", "Perplexity", `<div style="${abs(TOP + 96, 171, 48, 48)}">${IMG("/figma5/M4-A/assets/b50a4.svg", 48, 48)}</div>
      ${T(TOP + 170, 22, 600, "#13343b", "text-align:center")}Perplexity에 오신 걸 환영해요</p>
      ${T(TOP + 210, 15, 400, "#64645f", "text-align:center")}로그인하거나 계정을 만드세요</p>
      ${BTN('data-go="g1"', TOP + 262, "Google로 계속하기", "background:#f3f3ee;color:#13343b;border:1px solid #e3e3dc", G())}
      ${T(TOP + 326, 14, 400, "#64645f", "text-align:center")}또는</p>
      ${FIELD(TOP + 358, "이메일")}${FIELD(TOP + 420, "비밀번호")}
      ${BTN('data-name="btn 허용"', TOP + 490, "로그인", "background:#13343b;color:#fff")}`],
    copilot: ["github.com", "GitHub", `<div style="${abs(TOP + 96, 171, 48, 48)}">${GITHUB}</div>
      ${T(TOP + 166, 24, 400, "#1f2328", "text-align:center")}GitHub에 로그인</p>
      <div style="${abs(TOP + 214, 24, 342, 252, "border:1px solid #d1d9e0;border-radius:12px;background:#f6f8fa;box-sizing:border-box")}"></div>
      ${T(TOP + 232, 14, 600, "#1f2328", "", 40, 300)}사용자 이름 또는 이메일</p>
      <div style="${abs(TOP + 256, 40, 310, 40, "border:1px solid #d1d9e0;border-radius:6px;background:#fff;box-sizing:border-box")}"></div>
      ${T(TOP + 310, 14, 600, "#1f2328", "", 40, 300)}비밀번호</p>
      <div style="${abs(TOP + 334, 40, 310, 40, "border:1px solid #d1d9e0;border-radius:6px;background:#fff;box-sizing:border-box")}"></div>
      ${BTN('data-name="btn 허용"', TOP + 394, "로그인", "background:#1f883d;color:#fff;border-radius:6px;font-size:15px", "", 40, 310, 40)}
      ${T(TOP + 482, 13, 400, "#59636e", "text-align:center")}또는</p>
      ${BTN('data-go="g1"', TOP + 508, "Google로 계속하기", "border:1px solid #d1d9e0;color:#1f2328;background:#fff;border-radius:6px;font-weight:500;font-size:15px", G(), 24, 342, 44)}`],
    notion: ["notion.so", "Notion", `<div style="${abs(TOP + 96, 171, 48, 48)}">${LOGO("notion", 48)}</div>
      ${T(TOP + 168, 26, 700, "#191919", "text-align:center")}생각하고, 만들고, 정리하세요</p>
      ${T(TOP + 212, 15, 400, "#787774", "text-align:center")}Notion 계정으로 로그인하세요</p>
      ${BTN('data-go="g1"', TOP + 264, "Google로 계속하기", "border:1px solid #e3e2e0;color:#191919;background:#fff;border-radius:8px", G())}
      ${T(TOP + 328, 14, 400, "#787774", "text-align:center")}또는</p>
      ${FIELD(TOP + 360, "이메일 주소를 입력하세요", "", 24, 342, "border-radius:8px;border-color:#e3e2e0")}
      ${BTN('data-name="btn 허용"', TOP + 426, "계속", "background:#2383e2;color:#fff;border-radius:8px")}`],
  };
  const pageGoogle = (k) => { const [svc, logo, can] = GOOGLE_SVC[k]; return frame(googleSteps("Comet", false, true).join("") + consent(svc, logo, can)); };
  const pageSvc = (k) => { const [host, name, body] = SVC[k]; return frame(step("s1", host, body, true) + googleSteps(name, true, false).join("")); };
  // iOS '파일' 고르기 (카톡 대화 파일 · 개인 md 폴더)
  const FILES = {
    kakao: ["카톡 대화 파일", "최근 항목", [["KakaoTalk_Chat_앱디 1팀.txt", "11월 3일 · 248KB", 1], ["KakaoTalk_Chat_인터뷰이 1.txt", "10월 29일 · 64KB", 0], ["KakaoTalk_Chat_교수님.txt", "10월 27일 · 12KB", 0]], "doc"],
    md: ["개인 md 폴더", "iCloud Drive", [["Obsidian", "폴더 · 항목 128개", 1], ["메모", "폴더 · 항목 42개", 0], ["회의록", "폴더 · 항목 17개", 0]], "folder"],
  };
  const pagePicker = (k) => { const [title, place, rows, kind] = FILES[k];
    const icon = kind === "folder" ? `<svg width="34" height="28" viewBox="0 0 34 28"><path d="M2 5a3 3 0 0 1 3-3h8l3 3h13a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z" fill="#5AB0F5"/><path d="M2 9h30v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z" fill="#69BDF8"/></svg>`
      : `<svg width="26" height="32" viewBox="0 0 26 32"><path d="M2 3a2 2 0 0 1 2-2h12l8 8v20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" fill="#fff" stroke="#c7c7cc"/><path d="M16 1v8h8" fill="none" stroke="#c7c7cc"/><path d="M7 15h12M7 19h12M7 23h8" stroke="#aeaeb2" stroke-linecap="round"/></svg>`;
    return `
    <p style="position:absolute;top:10px;left:24px;font-size:12px;margin:0;color:#1a1626">9:41</p>
    <div style="position:absolute;top:14px;left:338px;height:10px;width:24px;border-radius:4px;background-color:#1c1730"></div>
    <div style="${abs(TOP, 0, 390, 844 - TOP, "border-radius:38px 38px 0 0;background:#f2f2f7")}"></div>
    <div data-name="btn 닫기" style="${abs(TOP + 22, 20, 60, 24, `font:400 17px/24px ${SF};color:#007aff;cursor:pointer`)}">취소</div>
    ${T(TOP + 22, 17, 600, "#000", "text-align:center", 90, 210)}${place}</p>
    <div data-name="btn 가져오기" style="${abs(TOP + 22, 310, 60, 24, `font:600 17px/24px ${SF};color:#007aff;text-align:right;cursor:pointer`)}">열기</div>
    <div style="${abs(TOP + 64, 16, 358, 36, `border-radius:10px;background:rgba(118,118,128,.12);display:flex;align-items:center;gap:6px;padding:0 10px;box-sizing:border-box;font:400 17px/1 ${SF};color:#8e8e93`)}">${D('<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>', 18, "#8e8e93")}검색</div>
    ${T(TOP + 120, 13, 400, "#6c6c70", "letter-spacing:.02em")}${title}</p>
    <div style="${abs(TOP + 144, 16, 358, rows.length * 64, "border-radius:12px;background:#fff")}"></div>
    ${rows.map(([n, sub, on], i) => `<div style="${abs(TOP + 144 + i * 64, 16, 358, 64, `display:flex;align-items:center;gap:12px;padding:0 16px;box-sizing:border-box;${i ? "border-top:.5px solid #e5e5ea;" : ""}`)}">${icon}<span style="flex:1;display:flex;flex-direction:column;gap:3px;min-width:0"><span style="font:400 16px/1.2 ${SF};color:#000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n}</span><span style="font:400 13px/1.2 ${SF};color:#8e8e93">${sub}</span></span>${on ? D('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 20, "#007aff") : ""}</div>`).join("")}
    <div style="${abs(772, 0, 390, 72, "border-top:.5px solid #d1d1d6;background:#f9f9f9;display:flex;justify-content:space-around;align-items:flex-start;padding-top:8px;box-sizing:border-box")}">${[["최근 항목", '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', kind !== "folder"], ["탐색", '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', kind === "folder"]].map(([n, d, on]) => `<span style="display:flex;flex-direction:column;align-items:center;gap:2px;font:500 10px/1 ${SF};color:${on ? "#007aff" : "#8e8e93"}">${D(d, 24, on ? "#007aff" : "#8e8e93")}${n}</span>`).join("")}</div>`; };
  // ---- 템플릿 바꿔 끼우기 · 새 화면 더하기 ----
  const fill = (id, html, bg) => { let t = document.getElementById("tpl-" + id);
    if (!t) { t = document.createElement("template"); t.id = "tpl-" + id; t.innerHTML = `<div class="fig" data-screen="${id}" style="position:relative;width:390px;height:844px;overflow:hidden"></div>`; document.body.appendChild(t); }
    const f = t.content.querySelector(".fig"); f.style.backgroundColor = bg; f.innerHTML = html; };
  for (const k of ["gemini", "gcal"]) fill("C-B-" + k, pageGoogle(k), "#d1d1d6");
  fill("C-B-gdrive", pageGoogle("gdrive"), "#d1d1d6");
  for (const k of ["figma", "slack", "px", "copilot"]) fill("C-B-" + k, pageSvc(k), "#d1d1d6");
  fill("C-B-notion", pageSvc("notion"), "#d1d1d6");
  fill("C-P-kakao", pagePicker("kakao"), "#d1d1d6"); fill("C-P-md", pagePicker("md"), "#d1d1d6");
  Object.assign(SCREENS.labels, { "C-B-gdrive": "★ 로그인 · 구글 드라이브", "C-B-notion": "★ 로그인 · 노션", "C-P-kakao": "★ 파일 고르기 · 카톡", "C-P-md": "★ 파일 고르기 · md 폴더" });
  for (const k of ["gdrive", "notion"]) FLOW.push(["C-B-" + k, "btn 닫기", "", "back"], ...(k === "gdrive" ? [["C-B-" + k, "btn 취소", "", "back"]] : []), ["C-B-" + k, "btn 허용", "", "fn:connectDone"]);   // 노션은 구글 허용 단계가 없어 취소 없음
  for (const k of ["kakao", "md"]) FLOW.push(["C-P-" + k, "btn 닫기", "", "back"], ["C-P-" + k, "btn 가져오기", "", "fn:pickFile"]);
  Object.assign(AFTER_LOGIN, { gdrive: "C-I-gdrive", notion: "C-I-notion" });
  window.BROWSER_FIRST = { "M3-G": "C-B-gdrive", "M3-N": "C-B-notion", "M3-K": "C-P-kakao", "M3-MD": "C-P-md" };   // actions.openConnect: 상세를 연 뒤 시트 대신 이 화면
  // 상세 화면 아래 단추(대화 파일 올리기 · 폴더 고르고 연결)도 가져올 곳 시트 대신 파일 고르기로
  for (const f of FLOW) if (BROWSER_FIRST[f[0]] && f[3] === "sheet" && /^btn /.test(f[1])) { f[2] = BROWSER_FIRST[f[0]]; f[3] = "push"; }
  // ---- 단계 넘기기: [data-go] 를 누르면 같은 브라우저 안에서 다음 페이지, ‹(data-back) 은 이전 단계. 화면에 들어올 때마다 첫 단계부터 ----
  const css = document.createElement("style");
  css.textContent = `.lp-step { position:absolute; inset:0; visibility:hidden; opacity:0; transform:translateX(24px); transition:opacity .22s, transform .3s cubic-bezier(.2,.8,.2,1), visibility 0s .3s; pointer-events:none }
.lp-step.on { visibility:inherit; opacity:1; transform:none; transition:opacity .22s, transform .3s cubic-bezier(.2,.8,.2,1); pointer-events:inherit }
.lp-step.back { transform:translateX(-24px) }`;
  document.head.appendChild(css);
  const go = (fig, id, dir = 1) => { const steps = [...fig.querySelectorAll(".lp-step")], to = steps.find(s => s.dataset.step === id); if (!to) return;
    steps.forEach(s => { if (s === to) return; if (s.classList.contains("on")) s.classList.toggle("back", dir > 0); s.classList.remove("on"); });
    to.classList.remove("back"); to.classList.add("on"); fig._hist = (fig._hist || []); if (dir > 0) fig._hist.push(id); };
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-go]"), b = e.target.closest("[data-back]"), fig = (g || b) && (g || b).closest(".fig"); if (!fig) return;
    if (g) go(fig, g.dataset.go, 1);
    else if (fig._hist && fig._hist.length > 1) { fig._hist.pop(); go(fig, fig._hist[fig._hist.length - 1], -1); }
  });
  let last = null;
  (function watch() { const c = typeof COMET !== "undefined" && COMET.cur && COMET.cur();
    if (c && c !== last && /^C-B-/.test(c)) { const f = COMET.SCR[c] && COMET.SCR[c].fig, first = f && f.querySelector(".lp-step"); if (first) { f.querySelectorAll(".lp-step").forEach(s => s.classList.remove("on", "back")); first.classList.add("on"); f._hist = [first.dataset.step]; } }
    last = c; requestAnimationFrame(watch); })();
})();
