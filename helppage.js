// helppage.js — 11-05 주형: 사이드바 '도움말' 화면(S3) · '의견 보내기'(actions.feedback 알럿)
//   도움말: 설정(S0)과 같은 머리(상태 표시줄 · 뒤로 · 가운데 제목) 아래 앱 로고(작게) · 앱 이름 · 버전 · '최신 버전이에요'
//   flow.js 다음 · router.js 앞에서 실행: 템플릿을 만들고 SCREENS · FLOW 에 더한다 (loginpages.js 와 같은 방식)
(() => {
  const src = document.getElementById("tpl-S0"), s0 = src && src.content.querySelector(".fig"); if (!s0) return;
  const F = "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";
  const t = document.createElement("template"); t.id = "tpl-S3";
  const fig = s0.cloneNode(false); fig.dataset.screen = "S3"; fig.dataset.name = "S3_도움말"; fig.removeAttribute("data-node-id");
  // 머리: S0 의 상태 표시줄 · 홈 표시줄 · 뒤로 · 제목을 그대로 복제 (제목만 '도움말')
  const kids = [...s0.children], title = kids.find(k => k.tagName === "P" && k.textContent.trim() === "설정");
  for (const k of kids.slice(0, kids.indexOf(title) + 1)) { const c = k.cloneNode(true); c.removeAttribute("data-node-id"); if (k === title) c.textContent = "도움말"; fig.appendChild(c); }
  const at = (y, more) => `position:absolute;top:${y}px;left:0;width:390px;text-align:center;margin:0;font-family:${F};${more}`;
  fig.insertAdjacentHTML("beforeend", `
    <img alt="" data-name="앱 로고" src="/figma5/H5/assets/comet_app.svg" style="position:absolute;top:168px;left:167px;width:56px;height:56px;display:block">
    <p data-name="앱 이름" style="${at(240, "font-size:20px;font-weight:700;color:#1a1626;letter-spacing:-.01em")}">Comet</p>
    <p data-name="버전" style="${at(272, "font-size:13px;color:#6b6484")}">버전 10.0</p>
    <p data-name="최신 버전" style="${at(306, "font-size:13px;color:#1a1626;display:flex;justify-content:center;align-items:center;gap:5px")}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1c1730" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>최신 버전이에요</p>`);
  t.content.appendChild(fig); document.body.appendChild(t);
  Object.assign(SCREENS.labels, { S3: "S3 도움말" });
  FLOW.push(["S3", "btn 뒤로", "", "back"], ["M1", "text=도움말", "S3", "push"], ["M1", "text=의견 보내기", "", "fn:feedback"]);
})();
