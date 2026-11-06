// 눈 모델 ③ — 곡선 눈꺼풀 + 작은 동공. looi.js 의 LOOI.eye 와 같은 자리에 꽂는 모듈.
// 좌표: 눈 로컬(중심 0,0), 두 눈 사이 거리 1 기준. open 의 bbox 는 LOOI open 과 같게(가로 ±.30, 세로 ±.33) 맞춘다.
const EYES3 = (() => {
  const RX = .30, RY = .33, W0 = 2 * RX, H0 = 2 * RY;
  const CORNER = .82;                 // 네 모서리 반지름 (반폭·반높이 대비)
  const N_WHITE = 112, N_PUPIL = 32;
  const CLOSE_RATIO = .175;           // 감은 높이 = 열린 높이의 17.5% (Lilguy)
  const DOT = { w: .15, h: .17 };     // 동공 크기 (눈 폭·높이 대비)

  // 표정 파라미터. sx sy: 눈 크기 배율 / uh ua ub: 위꺼풀 높이·각도(도)·휨 / lh la lb: 아래꺼풀
  // d*: 오른눈에만 더하는 값(생각중 기울기) / gx gy: 시선(눈 폭·높이 대비) / pm: 동공 크기 배율(0 이면 없음)
  const base = { sx: 1, sy: 1, uh: 0, ua: 0, ub: 0, lh: 0, la: 0, lb: 0, duh: 0, dua: 0, dub: 0, dlh: 0, dla: 0, dlb: 0, gx: 0, gy: 0, pm: 1 };
  const mk = o => Object.assign({}, base, o);
  const P = {
    open:     mk({ uh: .03, ub: .04 }),
    // 생각중: 위꺼풀 각을 절반으로 (오른눈 14° -> 7°)
    think:    mk({ sx: 1.02, uh: .26, ua: 4, ub: .06, lh: .06, lb: .04, duh: .12, dua: 3, gx: .12, gy: .07, pm: 1 }),
    happy:    mk({ sx: 1.04, uh: .02, lh: .26, lb: .34, pm: 0 }),
    surprise: mk({ sx: 1.07, sy: 1.22, pm: .7 }),
    listen:   mk({ sx: 1.03, lh: .48, lb: .05, gy: -.15, pm: 1.25 }),
    closed:   mk({ sx: 1.04, uh: .4125, ub: .08, lh: .4125, lb: -.08, pm: 0 }),
  };

  function lerp(a, b, k) { const o = {}; for (const key in a) o[key] = a[key] + (b[key] - a[key]) * k; return o; }
  // 감김 b (0~1). 감은 상태는 열린 높이의 17.5%, 동공은 사라진다
  function withClose(p, b) {
    if (!(b > 0)) return p;
    const c = Object.assign({}, p, { uh: (1 - CLOSE_RATIO) / 2, ub: .08, lh: (1 - CLOSE_RATIO) / 2, lb: -.08, duh: 0, dub: 0, dlh: 0, dlb: 0, pm: 0 });
    return lerp(p, c, Math.min(1, b));
  }

  function resample(poly, n) {
    const L = [0];
    for (let i = 1; i <= poly.length; i++) { const a = poly[i - 1], b = poly[i % poly.length]; L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
    const out = []; let j = 0; const tot = L[L.length - 1];
    for (let k = 0; k < n; k++) { const s = tot * k / n; while (L[j + 1] < s) j++; const a = poly[j], b = poly[(j + 1) % poly.length], t = (s - L[j]) / (L[j + 1] - L[j] || 1); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    return out;
  }
  function chaikin(p, it) { for (let k = 0; k < it; k++) { const o = []; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; o.push([.75 * a[0] + .25 * b[0], .75 * a[1] + .25 * b[1]], [.25 * a[0] + .75 * b[0], .25 * a[1] + .75 * b[1]]); } p = o; } return p; }
  // 둥근 사각형 윤곽: 모서리마다 3차 베지어(원호 근사) 를 촘촘히 샘플
  function roundedRect(rx, ry) {
    const r = CORNER, ax = r * rx, ay = r * ry, kk = .5522847498;
    const pts = [];
    const cubic = (p0, p1, p2, p3) => { for (let i = 0; i < 16; i++) { const t = i / 16, u = 1 - t; pts.push([u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]); } };
    const seg = (a, b) => { for (let i = 0; i < 8; i++) { const t = i / 8; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } };
    // 오른위 -> 오른아래 -> 왼아래 -> 왼위 (시계 방향, 화면 좌표)
    cubic([rx - ax, -ry], [rx - ax + kk * ax, -ry], [rx, -ry + ay - kk * ay], [rx, -ry + ay]);
    seg([rx, -ry + ay], [rx, ry - ay]);
    cubic([rx, ry - ay], [rx, ry - ay + kk * ay], [rx - ax + kk * ax, ry], [rx - ax, ry]);
    seg([rx - ax, ry], [-rx + ax, ry]);
    cubic([-rx + ax, ry], [-rx + ax - kk * ax, ry], [-rx, ry - ay + kk * ay], [-rx, ry - ay]);
    seg([-rx, ry - ay], [-rx, -ry + ay]);
    cubic([-rx, -ry + ay], [-rx, -ry + ay - kk * ay], [-rx + ax - kk * ax, -ry], [-rx + ax, -ry]);
    seg([-rx + ax, -ry], [rx - ax, -ry]);
    return pts;
  }
  function inside(poly, x, y) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }

  // 눈 윤곽을 열 때 쓰는 정규화: open 의 bbox 가 정확히 가로 ±.30 세로 ±.33 이 되도록 (한 번만 계산)
  let NORM = { sy: 1, oy: 0 };
  function rawWhite(p, side) {
    const k = side > 0 ? 1 : 0;
    const uh = p.uh + k * p.duh, ua = p.ua + k * p.dua, ub = p.ub + k * p.dub;
    const lh = p.lh + k * p.dlh, la = p.la + k * p.dla, lb = p.lb + k * p.dlb;
    const rx = RX * p.sx, ry = RY * p.sy;
    const tanU = Math.tan(ua * Math.PI / 180), tanL = Math.tan(la * Math.PI / 180);
    const base = resample(roundedRect(rx, ry), 200);
    const out = base.map(([x, y]) => {
      const xin = -side * x / rx, w = 1 - (x / rx) ** 2;
      const top = -ry + 2 * ry * uh + xin * rx * tanU + 2 * ry * ub * w;
      const bot = ry - 2 * ry * lh - xin * rx * tanL - 2 * ry * lb * w;
      if (bot - top < .03 * ry) { const m = (top + bot) / 2; return [x, m]; }
      return [x, Math.min(Math.max(y, top), bot)];
    });
    // 눈꺼풀이 윤곽과 만나는 꺾임을 둥글게: 성기게 다시 뽑아 체이킨 곡선으로 부드럽게 한 뒤 균등 샘플
    return resample(chaikin(resample(out, 56), 3), N_WHITE);
  }
  (function calibrate() {
    const w = rawWhite(P.open, -1);
    let y0 = 1e9, y1 = -1e9; for (const q of w) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    NORM = { sy: H0 / (y1 - y0), oy: (y0 + y1) / 2 };
  })();
  function white(p, side) {
    return rawWhite(p, side).map(q => [q[0], (q[1] - NORM.oy) * NORM.sy]);
  }

  function pupilAt(cx, cy, w, h) {
    const o = [];
    for (let i = 0; i < N_PUPIL; i++) { const a = i / N_PUPIL * 2 * Math.PI; o.push([cx + w / 2 * Math.cos(a), cy + h / 2 * Math.sin(a)]); }
    return o;
  }
  const fits = (wh, pu) => { for (const q of pu) if (!inside(wh, q[0], q[1])) return false; return true; };

  // gaze: [x,y] 표정의 시선에 더해지는 값 (눈 폭·높이 대비, 예: [.25,0] 은 폭의 25% 만큼 오른쪽). 흰자 밖으로 안 나간다
  function eye(p, side, gaze) {
    const wh = white(p, side);
    if (!(p.pm > .02)) return { white: wh, pupil: null };
    const tx = (p.gx + (gaze ? gaze[0] : 0)) * W0, ty = (p.gy + (gaze ? gaze[1] : 0)) * H0;
    let w = (p.pw || DOT.w) * W0 * p.pm, h = (p.ph || DOT.h) * H0 * p.pm;   // pw ph: 동공 크기 비율(눈 폭·높이 대비)을 표정이 직접 줄 수 있다 (Lilguy 4종). 없으면 기존 작은 동공
    for (let s = 1; s > .08; s *= .92) {
      if (fits(wh, pupilAt(0, 0, w * s, h * s))) {
        let lo = 0, hi = 1;                       // 가장 멀리 가는 위치를 이분법으로 찾는다
        if (fits(wh, pupilAt(tx, ty, w * s, h * s))) lo = 1;
        else for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (fits(wh, pupilAt(tx * m, ty * m, w * s, h * s))) lo = m; else hi = m; }
        return { white: wh, pupil: pupilAt(tx * lo, ty * lo, w * s, h * s) };
      }
    }
    return { white: wh, pupil: null };
  }
  return { P, eye, lerp, withClose, RX, RY };
})();
if (typeof module !== 'undefined') module.exports = EYES3;
