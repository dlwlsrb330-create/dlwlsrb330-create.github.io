// launch_app.js — 바탕화면에서 Comet 아이콘을 누르면 앱이 켜진다 (전 세션 launch.html 의 아이콘 탭·줌 부분, 값 그대로). 줌 판은 검정이라 다 커지면 그대로 launch2 의 실행 장면(검은 화면 → 흰 눈 → 공)으로 이어진다.
// 그 다음 홈에서 '눌러서 발산' 어포던스(mascot.js 의 HINT): 뒤집기 없이 살짝 눌렸다 펴지며 탭 색 글로우 + 말풍선.
(() => {
  const ICON = { x: 27 + (336 / 4) * 1.5 - 30, y: 96 + 86, w: 60, r: 14 };   // 두 번째 줄 두 번째 칸 (launch.html 88줄)
  const TT = { tap: .30, zoomAt: .38, zoomLen: .55 };                           // launch.html 89줄의 앞부분
  const easeOutC = bez(.33, 1, .68, 1);
  const home = $("home"), zoom = $("zoom"), icon = $("icon");
  let t0 = null, done = false, tapped = null;                                 // 페이지가 다 뜬 뒤(load + 0.4초)에 시작 — 그 전엔 바탕화면만
  // 티즈판: 앱이 켜지기 전 아이콘 탭은 여기서 먼저 받는다. 엔진이 첫 프레임에 T0 를 잡아 두어서 router 가 '이미 켜졌다'고 보고
  // 아이콘 자리(숨은 마스코트 자리와 겹침)를 마스코트 탭으로 가져가던 것 → window 캡처 단계(라우터보다 먼저)에서 가로챈다
  window.addEventListener("click", (ev) => {
    if (done || tapped !== null || t0 === null) return;
    const r = icon.getBoundingClientRect(); if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) return;
    ev.stopPropagation(); ev.preventDefault(); tapped = performance.now() / 1000 - t0;
  }, true);
  function frame() {
    const t = performance.now() / 1000 - t0, tap = tapped ?? Infinity,   // 티즈판: 저절로 안 켜짐 — 바탕화면의 Comet 아이콘을 눌러야 켜진다 (예전: 0.3초 뒤 자동 탭)
          zoomAt = tap + (TT.zoomAt - TT.tap);
    const pressK = t < tap ? 0 : t < zoomAt ? sm((t - tap) / .08) : 1 - sm((t - zoomAt) / .1);
    icon.style.transform = `scale(${(1 - .08 * pressK).toFixed(3)})`;
    const z = easeOutC((t - zoomAt) / TT.zoomLen);
    const zx = ICON.x * (1 - z), zy = ICON.y * (1 - z), zw = ICON.w + (390 - ICON.w) * z, zh = ICON.w + (844 - ICON.w) * z, zr = ICON.r + (44 - ICON.r) * z;
    zoom.style.opacity = t >= zoomAt ? "1" : "0";   // 13판: 다 커진 프레임에도 검은 판을 남겨 둠 (치우는 건 아래 done 다음 프레임)
    zoom.style.transform = `translate(${zx.toFixed(1)}px, ${zy.toFixed(1)}px) scale(${(zw / 60).toFixed(3)}, ${(zh / 60).toFixed(3)})`;
    zoom.style.borderRadius = `${(zr / Math.max(zw / 60, zh / 60)).toFixed(1)}px`;
    home.style.transform = `scale(${(1 + .08 * z).toFixed(3)})`; home.style.filter = `blur(${(6 * z).toFixed(1)}px)`; home.style.opacity = (1 - sm((z - .6) / .4)).toFixed(3);
    if (z >= 1 && !done) { done = true; requestAnimationFrame(() => { home.style.display = zoom.style.display = "none"; }); T0 = performance.now() / 1000; director(0, T0);   /* 13판: 눈 — 엔진이 감독보다 먼저 그려서 다음 프레임 눈이 옛 홈 상태(뜬 눈)로 그려졌음 → 새 T0 값(눈 안 보임)을 지금 미리 채워 둠. 13판: 실행 실루엣 — 엔진·감독(director)은 이 프레임에 이미 옛 T0(페이지 열린 때)로 홈 상태(마스코트 보임)를 그린 뒤라, 여기서 바로 판을 치우면 그 한 프레임이 보였음 → 새 T0 로 검은 화면을 그린 다음 프레임에 치움 */ __m.reset(); if (!COMET.stack().length) { COMET.show(SCREENS.start, "push"); if (obFirst()) obIntro(); }   /* 티즈판: '온보딩부터' — 실행(검은 화면 → 눈 → 검정이 공으로 빨려 듦)은 홈 자리에서 그대로 하고, 공이 다 된 순간(L.land) 홈 글이 올라오기 전에 OB-1 로 바꿔 낌. 처음부터 OB-1 을 띄우면 검은 판(difference)이 덮어 반전돼 보였음 */ hintLoop(); setTimeout(COMET.prefetch, 1500); return; }   // 5판: 실행 장면 중에 화면 목록으로 이미 다른 화면에 갔으면 홈으로 덮지 않음
    requestAnimationFrame(frame);
  }
  // 어포던스: 인사(2.9+1.6초) 뒤 HINT.first 초에 한 번, 그 뒤 HINT.gap 초마다. 발산을 한 번이라도 하면 끝.
  let hinted = false;
  function hintLoop() {
    if (!HINT.auto) return;            // 티즈판: 매 실행 어포던스(티즈·말풍선)는 끔. 대신 온보딩 끝에 한 번 튜토리얼(tutor.js)
    const first = L.ui[L.ui.length - 1] + L.uiLen + HINT.first;   // 티즈판: 인사를 뺐으니 홈 글이 다 올라온 직후(약 3.3초) + HINT.first (예전: 인사 끝 5.05 + 1.4)
    schedule(first);                   // 티즈판: 이 호출이 위 주석 끝에 붙어 있어서 어포던스가 한 번도 안 돌았음
    function schedule(sec) { setTimeout(() => { if (COMET.isDarkOn()) { hinted = true; return; } if (COMET.cur() === "H1" && !__m.state().next && __m.state().cur === "idle") hint(); if (!hinted) schedule(HINT.gap[0] + Math.random() * (HINT.gap[1] - HINT.gap[0])); }, sec * 1000); }
  }
  function hint() {
    // 티즈판: 홈 티즈는 튜토리얼(tutor.js)에서만. 일반 시작 화면에서는 티즈 없음
    setTimeout(() => {   // 티즈판: 말풍선은 티즈가 다 돌아온 뒤에 (같이 뜨면 퍼지는 공과 겹침). 그 사이 발산했거나 다른 화면이면 안 띄움
      if (COMET.isDarkOn() || COMET.cur() !== "H1") return;
      const b = $("hint"); b.textContent = HINT.bubble; b.classList.add("on"); setTimeout(() => b.classList.remove("on"), HINT.bubbleLen * 1000);
    }, HINT.tease.len * 1000);
  }
  // 티즈판: '온보딩부터' 켜고 끄기 (폰 밖 ‹ 뒤로 · ↻ 재시작 옆). 브라우저에 저장해서 재시작해도 유지
  const OB_KEY = "comet.obFirst";
  function obFirst() { try { return localStorage.getItem(OB_KEY) === "1"; } catch (e) { return false; } }
  (function obToggle() {
    const ctl = $("ctl"); if (!ctl) return;
    const b = document.createElement("button"); b.id = "btnObFirst"; b.type = "button";
    const paint = () => { const on = obFirst(); b.textContent = on ? "온보딩부터 켬" : "온보딩부터 끔"; b.setAttribute("aria-pressed", String(on)); b.title = on ? "앱을 켜면 온보딩(OB-1 프로젝트)부터 시작" : "앱을 켜면 홈부터 시작"; };
    b.onclick = () => { try { localStorage.setItem(OB_KEY, obFirst() ? "0" : "1"); } catch (e) {} paint(); };
    paint(); ctl.insertBefore(b, $("btnRestart"));
  })();
  // 13판: 검토용 '화면 맞춤' 단추 — 켜면 창이 폰(단추 포함 약 900px)보다 작을 때 페이지 전체를 줄임. 기본은 끔:
  // 줄여 두면(CSS zoom) 앱 브라우저의 요소 고르기 표시가 줄인 비율만큼 어긋나서. 브라우저에 저장해 재시작해도 유지
  (function fitWin() {
    const ctl = $("ctl"); if (!ctl || document.documentElement.hasAttribute("data-embed")) return;
    const KEY = "comet.fitWin", on = () => { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } };
    const f = () => { const z = on() ? Math.min(1, (innerHeight - 16) / 900, innerWidth / 760) : 1; document.documentElement.style.zoom = z < 1 ? z.toFixed(3) : ""; };
    const b = document.createElement("button"); b.type = "button"; b.id = "btnFit";
    const paint = () => { b.textContent = on() ? "화면 맞춤 켬" : "화면 맞춤 끔"; b.setAttribute("aria-pressed", String(on())); b.title = "켜면 창에 맞춰 폰을 줄여 보여 줌 (요소 고르기 할 땐 끄기)"; };
    b.onclick = () => { try { localStorage.setItem(KEY, on() ? "0" : "1"); } catch (e) {} paint(); f(); };
    paint(); ctl.appendChild(b); f(); addEventListener("resize", f);
  })();
  icon.style.cursor = "pointer"; zoom.style.pointerEvents = "none";   // 티즈판: 투명한 줌 판이 아이콘 위를 덮어 클릭을 가로채던 것
  // 티즈판: '온보딩부터' 실행 → 온보딩. 겹치지 않게 차례로:
  // ① L.land(검정이 공으로 다 빨려 듦): 화면만 조용히 OB-1 로 (글은 숨김, 마스코트는 로고 자리 그대로)
  // ② 실행 애니메이션의 줄무늬 열림·눈알 톡이 끝날 때까지 기다림 ③ 마스코트가 OB-1 위쪽 작은 자리로 줄어들며 이동
  // ④ 도착하면 OB-1 글이 위에서부터 차례로 살짝 올라오며 나타남 (홈 실행 때 글 올라오는 것과 같은 값 L.ui 간격 · uiLen · uiDY)
  const OBI = { moveAt: L.pupilAt + L.pupilRamp + .1, moveMs: 700, textGap: .07, textLen: L.uiLen, textDY: L.uiDY };
  function obIntro() {
    const at = (sec, fn) => setTimeout(fn, Math.max(0, (T0 + sec) * 1000 - performance.now()));
    const slot = (n) => { const [x, y, d] = MASCOT_SLOT[n]; return { x, y, s: d / 220 }; };
    let kids = [];
    at(L.land + .04, () => {
      if (COMET.cur() !== SCREENS.start || COMET.isDarkOn()) return;
      COMET.show("OB-1", "replace");
      const s = COMET.SCR["OB-1"]; s.el.classList.remove("in-push");             // 밀려 들어오는 전환 없이
      s.fig.style.visibility = "hidden";   // 글·칸·단추는 아직 통째로 숨김 (이름 칸 타이핑 연출이 나중에 붙이는 커서까지)
      if (document.activeElement && s.el.contains(document.activeElement)) document.activeElement.blur();
      COMET.moveStage(slot("logo"), 0);                                          // show 가 옮긴 마스코트를 로고 자리로 되돌려 둠
    });
    at(OBI.moveAt, () => { if (COMET.cur() === "OB-1") COMET.moveStage(slot("onboard"), OBI.moveMs); });
    at(OBI.moveAt + OBI.moveMs / 1000 + .05, () => {
      const fig = COMET.SCR["OB-1"].fig;
      if (COMET.cur() !== "OB-1") { fig.style.visibility = ""; return; }
      kids = [...fig.children]; kids.forEach(k => { k.style.opacity = "0"; }); fig.style.visibility = "";   // 지금 붙어 있는 것 전부(타이핑 커서 포함)를 0 에서 시작
      // 위에서 아래 순서 (같은 줄은 같이)
      const top = (k) => k.getBoundingClientRect().top, rows = [...new Set(kids.map(k => Math.round(top(k) / 24)))].sort((p, q) => p - q);
      const t0 = performance.now();
      kids.forEach(k => {   // 피그마 조각은 translate: var(--tw-translate-x) var(--tw-translate-y) 로 가운데 맞춤 → 세로 변수만 씀 (없으면 translate 직접)
        k.dataset.obRow = rows.indexOf(Math.round(top(k) / 24));
        k.dataset.obMode = /var(--tw-translate-y)/.test(k.getAttribute("style") || "") ? "var" : k.style.translate ? "fade" : "tr";   // 이미 다른 translate 를 쓰는 조각은 흐려지기만 (자리 안 건드림)
      });
      (function step() {
        const u = (performance.now() - t0) / 1000; let busy = false;
        kids.forEach(k => {
          const q = EASE_OUT_QUINT((u - k.dataset.obRow * OBI.textGap) / OBI.textLen), dy = ((1 - q) * OBI.textDY).toFixed(2) + "px";
          k.style.opacity = q >= 1 ? "" : q.toFixed(3); if (q < 1) busy = true;
          if (k.dataset.obMode === "var") { if (q >= 1) k.style.removeProperty("--tw-translate-y"); else k.style.setProperty("--tw-translate-y", dy); }
          else if (k.dataset.obMode === "tr") k.style.translate = q >= 1 ? "" : `0 ${dy}`;
        });
        if (busy) requestAnimationFrame(step); else kids.forEach(k => { delete k.dataset.obRow; delete k.dataset.obMode; });
      })();
    });
  }
  function frame0() { if (t0 === null) { t0 = performance.now() / 1000; } frame(); }
  // 티즈판: 이미지 250개가 다 받아질 때(load)까지 기다리지 않고 문서만 준비되면 바로 시작. 실행 앞부분이 검은 화면이라 늦게 뜨는 이미지는 안 보임
  if (document.readyState !== "loading") setTimeout(frame0, 50); else document.addEventListener("DOMContentLoaded", () => setTimeout(frame0, 50));
})();
