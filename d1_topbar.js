// d1_topbar.js — 발산(D1) 위쪽 줄 = 홈(H1) 위쪽 줄 (11-05 주형, 사용자 요청)
// 발산으로 들어가도 왼쪽 위 기록(보관함) 아이콘 · 가운데 프로젝트 이름(프로덕트디자인4 ▾) · 오른쪽 위 사이드바(☰) 아이콘이 그대로 있게. 녹음 마이크는 뺌.
// COMET.build() 전에 템플릿에서 H1 의 그 조각을 D1 로 복제한다 → 버튼 연결(flow.js D1 줄)이 다른 화면처럼 걸림.
// D1 은 반전 필터로 그리는 화면이라 복제한 잉크 아이콘 · 글자가 뒤집혀 흰 바탕에 묻혔다 → 복제한 조각에만 한 번 더 반전(invert)을 걸어 홈과 같은 색으로. 원래 D1 맨 위 '발산' 글자(숨겨 둠)는 그대로.
// 누르면 홈과 같은 곳: 발산을 끝내고(홈으로) 홈에서 누른 것처럼 사이드바(M1) · 프로젝트(H5) 시트 / 기록(T1) 화면.
//   시트를 발산 위에 바로 띄우면 발산 화면이 시트 위로 올라와 겹쳤다(진규 찜의 '발산 화면이 시트를 덮던 것'과 같은 원래 버그) → 발산을 먼저 끝냄
(() => {
  const h1 = document.getElementById("tpl-H1"), d1 = document.getElementById("tpl-D1");
  if (!h1 || !d1) return;
  const hf = h1.content.querySelector(".fig"), df = d1.content.querySelector(".fig");
  if (df.querySelector('[data-name^="btn 관리 메뉴"]')) return;   // 두 번 넣지 않음
  const top = (k) => parseFloat(k.style.top) || 0, left = (k) => parseFloat(k.style.left) || 0;
  // H1 위쪽 줄: 동그라미 바탕(Ellipse) · 기록 아이콘 · 프로젝트 이름 · 사이드바 아이콘. 마이크와 그 동그라미(가운데 x 290 언저리)는 뺌
  const mic = [...hf.children].find(k => /^btn 녹음 시작/.test(k.dataset.name || ""));
  const micX = mic ? left(mic) : -1;
  const row = [...hf.children].filter(k => {
    const t = top(k); if (t < 36 || t > 80) return false;
    if (k === mic || (k.dataset.name === "Ellipse" && Math.abs(left(k) - (micX - 8)) < 6)) return false;
    return k.dataset.name === "Ellipse" || /^btn (기록|관리 메뉴)/.test(k.dataset.name || "") || (k.tagName === "P" && /^프로덕트디자인4/.test(k.textContent.trim()));
  });
  const anchor = [...df.children].find(k => k.tagName === "P" && k.textContent.trim() === "발산") || df.firstChild;
  row.forEach(k => { const c = k.cloneNode(true); c.removeAttribute("data-node-id"); c.dataset.unInvert = "1"; c.style.filter = ((c.style.filter || "") + " invert(1)").trim(); anchor.after(c); });

  // 동작: 발산을 끝내고 홈에서 누른 것처럼 (시트는 sheet, 기록은 push)
  window.ACTIONS = window.ACTIONS || {};
  const go = ({ to }) => {
    if (ACTIONS.converge) ACTIONS.converge();
    COMET.after(700, () => COMET.show(to, SCREENS.overlay.includes(to) ? "sheet" : "push"));
  };
  // ACTIONS 는 actions.js 가 만든 객체 — 그 뒤에 붙임 (이 파일은 actions.js 다음에 읽힘)
  if (typeof ACTIONS === "object") ACTIONS.d1Go = go;
})();
