# comet/lab — 앱 밖에서 돌려 보는 실험

앱(`comet/index.html`)과 따로 도는 참고용 페이지 모음. 앱 코드는 여기 것을 불러 쓰지 않는다.

## telegram-bg.html — Telegram 대화방 배경처럼 색이 일렁이는 것 (11-05 주형)

- 열기: `comet/` 를 서버로 띄우고 `/lab/telegram-bg.html` (예: `npx http-server comet -p 5180 -c-1` → http://localhost:5180/lab/telegram-bg.html)
- 무엇: 색 4개가 정해진 자리 8곳을 돌며 부드럽게 자리를 바꾸는 그라데이션을 **원 · 코멧 기본형태**에 씌움
  - 원
  - 코멧 — 줄무늬에 색 (홈 로고 `figma5/H1/assets/23a03.svg` 를 CSS mask 로)
  - 코멧 — 몸에 색, 줄무늬는 원래 색 그대로 위에
- 색: 발산 방식 다이얼(`dial_beo.js` 의 `glowColor()` 식 그대로) 8방향 색 하나를 바탕으로 **한 톤 4색** — 바탕(선명) · 밝게(+10°) · 옆 색상(−10°) · 아주 옅게. 밝기 58~88% 만, 어두운 톤 없음
- 원래 Telegram 배경 위에 깔리는 그림 무늬(패턴)는 넣지 않음 (`pattern` 옵션을 안 줌)
- 위 막대: 다이얼 방향 · 빠르기(fps) · 칸 크기

### 라이브러리
- `twallpaper/` = [twallpaper](https://github.com/crashmax-dev/twallpaper) 2.1.2 (MIT, crashmax-dev). npm `dist/index.es.js` · `dist/style.css` 를 그대로 받고 맨 위에 출처 한 줄만 붙임. Telegram 공식 코드가 아니라 같은 모양을 다시 만든 것
- 쓰는 법 핵심 (telegram-bg.html `makeTw`):
  ```js
  import { TWallpaper } from "./twallpaper/index.es.js";
  const tw = new TWallpaper(담을칸, { colors: ["#…", "#…", "#…", "#…"], fps: 30, tails: 90, animate: true, scrollAnimate: false });
  tw.init();              // 그리기 시작
  tw.toNextPosition();    // (선택) 한 번 크게 자리 바꾸기 — Telegram 은 메시지 보낼 때마다 이걸 부름
  tw.updateColors([...]); // 색 바꾸기
  tw.dispose();           // 끄기
  ```
- 주의: 담는 칸에 `tw-wrap` 클래스가 붙는데, 원래 CSS 가 `position: fixed; z-index: -1`(화면 전체 배경)이라 칸 안에 쓸 땐 `.칸.tw-wrap { position: absolute; z-index: 1; }` 로 덮어야 보임
