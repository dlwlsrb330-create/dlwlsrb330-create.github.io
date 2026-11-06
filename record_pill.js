// record_pill.js — 녹음 알약. 와이어프레임 R2-6a→6c 의 "빨간 마이크 버튼을 누르면 왼쪽으로 늘어나며 알약이 됨" + v9(Make 9DK3…) 녹음 띠의 살아 있는 점·파형·시간.
// 파형은 마이크가 허용되면 진짜(getUserMedia + analyser), 아니면 흉내(v9 와 같은 방식). 수치는 PILL 상수에.
const RECPILL = (() => {
  const PILL = { mic: { x: 290, y: 60, d: 36 }, left: 170, top: 60, h: 36, w0: 36, w1: 156, grow: 500, ease: "cubic-bezier(.32,.72,0,1)",   /* 13판: 450 · (.2,.8,.2,1) → iOS 시트와 같은 500 · (.32,.72,0,1), 헤더 제목도 같은 값으로 밀려남(actions.startRecording) */ bars: 12, bar: 3, gap: 2.18, waveH: 18, color: "#1c1730", ink: "#ffffff" };   /* 11-05 진규: 알약이 쪽빛(#1c1730)이 된 뒤 안의 파형·시간이 잉크(#1a1626)라 묻혔음 → 흰색 */   /* 11-05 주형: 녹음 알약 점·파형 주황 → 잉크 */   // 13판: 헤더를 상태 표시줄 아래로 16 내려(statusbar.js SHIFT) 아일랜드와 떨어졌으므로 원래 디자인대로 헤더 안 — 빨간 마이크(290)에서 왼쪽으로 늘어나 알약(170~326). 안쪽 값은 V4 R2-6c 그대로
  let el = null, cv = null, tm = null, state = null, raf = 0;
  // 11-06 진규(아이폰): 마이크 원 자리 = 알약 상자 안에서 잘라 보이는 네모(둥근 끝). 알약 상자는 늘 left·top·w1·h 그대로
  const micClip = () => { const t = PILL.mic.y - PILL.top, l = PILL.mic.x - PILL.left, r = PILL.left + PILL.w1 - (PILL.mic.x + PILL.mic.d), b = PILL.top + PILL.h - (PILL.mic.y + PILL.mic.d); return `inset(${t}px ${r}px ${b}px ${l}px round ${PILL.mic.d / 2}px)`; };
  const fullClip = () => `inset(0px 0px 0px 0px round ${PILL.h / 2}px)`;
  function make() {
    el = document.createElement("div"); el.id = "recpill"; el.innerHTML = `<span class="live"></span><canvas class="wave" width="${Math.ceil(PILL.bars * PILL.bar + (PILL.bars - 1) * PILL.gap)}" height="${PILL.waveH}"></canvas><span class="tm">0:00</span><span class="mic"></span>`;
    el.style.cssText = `position:absolute;top:${PILL.top}px;left:${PILL.left}px;height:${PILL.h}px;width:${PILL.w1}px;border-radius:999px;background:${PILL.color};color:${PILL.ink};display:flex;align-items:center;gap:8px;padding:0 8px 0 16px;overflow:hidden;z-index:6;cursor:pointer;box-sizing:border-box`;
    $("phone").appendChild(el); cv = el.querySelector(".wave"); tm = el.querySelector(".tm");
    el.addEventListener("click", () => { if (state && state.onStop) state.onStop(); });
    return el;
  }
  async function start(onStop) {
    if (!el) make();
    state = { t0: performance.now(), bars: Array(PILL.bars).fill(0), onStop, analyser: null, stream: null };
    el.style.display = "flex"; el.style.opacity = ""; el.classList.remove("on"); if (el._back) { el._back.cancel(); el._back = null; }
    el.animate([{ clipPath: micClip() }, { clipPath: fullClip() }], { duration: PILL.grow, easing: PILL.ease });   // 마이크 자리 동그라미 → 헤더 아래 가운데 알약. 11-06 진규(아이폰): left·top·width·height(매 프레임 배치 다시 계산) → 알약은 제자리 · 제 크기 그대로 두고 잘라 보이는 곳(clip-path)만 넓힘
    setTimeout(() => el.classList.add("on"), PILL.grow * .6);
    try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const ctx = new AudioContext(); const an = ctx.createAnalyser(); an.fftSize = 512; ctx.createMediaStreamSource(stream).connect(an); Object.assign(state, { analyser: an, stream, ctx }); } catch { /* 마이크 없으면 흉내 파형 */ }
    let last = 0;
    const loop = (now) => {
      if (!state) return;
      if (now - last >= 60) { last = now; let peak = 0;
        if (state.analyser) { const buf = new Uint8Array(state.analyser.fftSize); state.analyser.getByteTimeDomainData(buf); for (const s of buf) peak = Math.max(peak, Math.abs(s - 128) / 128); }
        else { const s = now / 1000; peak = .06 + .55 * Math.max(0, Math.sin(s * 7.3)) * (.5 + .5 * Math.sin(s * 1.9 + 1)) + Math.random() * .12; }   // 7판: 흉내도 말소리처럼 음절·숨 쉬는 틈이 있게
        state.level = Math.min(1, peak * 1.4); state.bars.push(state.level); state.bars.splice(0, state.bars.length - PILL.bars);
        const ctx = cv.getContext("2d"); ctx.clearRect(0, 0, cv.width, cv.height); ctx.fillStyle = PILL.ink;
        state.bars.forEach((a, i) => { const h = Math.max(PILL.bar, a * PILL.waveH), x = i * (PILL.bar + PILL.gap), y = (PILL.waveH - h) / 2; ctx.beginPath(); ctx.roundRect(x, y, PILL.bar, h, 1.5); ctx.fill(); });
        const sec = Math.floor((now - state.t0) / 1000) + 768;   // 와이어프레임의 12:48 에서 이어 간다
        tm.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }
  function stop(onBack) {
    if (!state) return; cancelAnimationFrame(raf);
    if (state.stream) state.stream.getTracks().forEach(t => t.stop()); if (state.ctx) state.ctx.close();
    state = null; el.classList.remove("on");
    el._back = el.animate([{ clipPath: fullClip() }, { clipPath: micClip() }], { duration: PILL.grow, easing: PILL.ease, fill: "forwards" });   // 11-06 진규(아이폰): 위와 같이 clip-path 로   // 끝: 마이크 자리로 줄어들며 돌아감. 11-05 진규: 흐려지며 사라지던 것(opacity 0) → 진하게 줄어들어 홈 마이크 원과 겹친 뒤 끝(actions.stopRecording 이 그때 홈으로 바꿔 끼움)
    el._back.onfinish = () => { if (onBack) onBack(); if (!state) { el.style.display = "none"; el._back.cancel(); el._back = null; } };
  }
  // 5판: 녹음은 계속 되지만 알약은 녹음 중 홈(R2-6c)에서만 보인다 — 다른 화면의 헤더·버튼을 덮지 않게
  function visible(on) { if (el && state) { el.style.transition = "opacity .2s"; el.style.opacity = on ? "1" : "0"; el.style.pointerEvents = on ? "" : "none"; } }
  // 11판: 마이크 뒤 빨간 빛(7판 recglow)은 뺌 — 효과 없이 단순하게
  return { start, stop, visible, PILL, on: () => !!state, level: () => state ? state.level || 0 : 0 };   // 7판: 엔진 녹음 펄스 사물이 소리 크기를 받아 막대를 튀긴다
})();
