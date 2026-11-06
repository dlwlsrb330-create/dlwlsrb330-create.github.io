// eyes3_more.js — 눈 모델 ③(eyes3.js)에 표정과 동공 종류를 더한다. 모델(윤곽·동공 계산)은 손대지 않고 파라미터만 추가.
// 파라미터 뜻(eyes3.js): sx sy 크기 / uh ua ub 위꺼풀 높이·각도(도)·휨 / lh la lb 아래꺼풀 / d* 오른눈만 더함 / gx gy 시선 / pm 동공 배율 / pw ph 동공 폭·높이(눈 폭·높이 대비)
// 동공 4종은 피그마 "Lilguy 눈 (공부용)" 의 dot·circle·cat·acorn 을 잰 비율(흰자 78×87 기준): circle .46×.41 · cat .21×.60 · acorn .46×.81 · dot .09×.11
// 모드 배정(피그마 "Comet 로고 × Lilguy 눈"): 기본 = circle, 생각중 = cat, 발산 = acorn, 답변중 = dot
(() => {
  const base = { sx: 1, sy: 1, uh: 0, ua: 0, ub: 0, lh: 0, la: 0, lb: 0, duh: 0, dua: 0, dub: 0, dlh: 0, dla: 0, dlb: 0, gx: 0, gy: 0, pm: 1, pw: .46, ph: .41 };
  const mk = o => Object.assign({}, base, o);
  const PUPIL = { circle: { pw: .46, ph: .41 }, cat: { pw: .21, ph: .60 }, acorn: { pw: .46, ph: .81 }, dot: { pw: .09, ph: .11 } };
  // 기존 표정에도 동공 비율 키를 넣어 둔다 (lerp 가 키를 맞춰야 하므로). 기본은 circle 크기
  for (const k in EYES3.P) { const p = EYES3.P[k]; if (p.pw === undefined) { p.pw = PUPIL.circle.pw; p.ph = PUPIL.circle.ph; } }
  Object.assign(EYES3.P.think, PUPIL.cat);                                       // 생각중 = 세로로 긴 고양이 동공
  Object.assign(EYES3.P, {
    circle:  mk(PUPIL.circle),                                                     // 기본 (Lilguy circle)
    cat:     mk(Object.assign({ sx: 1.02, uh: .10, ub: .04, gx: .06 }, PUPIL.cat)),  // 생각중 (Lilguy cat)
    acorn:   mk(Object.assign({ lh: .10, lb: .14 }, PUPIL.acorn)),                 // 발산 (Lilguy acorn + 살짝 웃음)
    dot:     mk(Object.assign({ gx: .04 }, PUPIL.dot)),                            // 답변중 (Lilguy dot)
    sad:     mk({ uh: .20, ua: -17, ub: .03, lh: .05, gy: .06 }),                  // 바깥 끝 처짐
    angry:   mk({ uh: .22, ua: 15, ub: .02, lh: .04, gy: .02 }),                   // 안쪽 끝 내려와 매서움
    focus:   mk({ sx: 1.02, uh: .17, ub: .05, lh: .17, lb: .05, pm: 1.1 }),        // 가늘게 집중 (Lilguy Squint)
    sleepy:  mk({ uh: .38, ub: .10, lh: .05, gy: .10, pm: .85 }),                  // 반쯤 감김
    wink:    mk({ duh: .42, dlh: .42, dub: .08, dlb: -.08, gx: .02 }),             // 오른눈만 감김
    glance:  mk({ gx: .30, gy: -.06, pm: 1.05 }),                                  // 옆을 흘낏 (Lilguy Look Right)
    doubt:   mk({ uh: .08, duh: .24, dua: 9, dub: .04, gx: .10, gy: .04 }),        // 한쪽만 눈썹 올림
    excited: mk({ sx: 1.08, sy: 1.12, lh: .06, lb: .12, pm: 1.15 }),               // 눈 커지고 동공 커짐
    shy:     mk({ uh: .10, ub: .06, lh: .22, lb: .20, gx: -.16, gy: .12, pm: .9 }),// 웃으며 내리깔기
  });
  EYES3.PUPIL = PUPIL;
  EYES3.NAMES = ["circle", "cat", "acorn", "dot", "open", "think", "happy", "surprise", "listen", "sad", "angry", "focus", "sleepy", "wink", "glance", "doubt", "excited", "shy"];
})();
