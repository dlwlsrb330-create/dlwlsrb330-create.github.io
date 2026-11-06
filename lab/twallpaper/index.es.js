// twallpaper@2.1.2 (MIT, crashmax-dev, github.com/crashmax-dev/twallpaper) — Telegram 대화방 배경처럼 여러 색이 일렁이는 그라데이션. 11-05 주형 실험(comet/lab)용으로 그대로 받음.
function C(h) {
  const t = L(h);
  return t ? {
    r: parseInt(t[1], 16),
    g: parseInt(t[2], 16),
    b: parseInt(t[3], 16)
  } : null;
}
function L(h) {
  return h.length === 4 && (h = `${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`), /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
}
const Y = [
  0,
  0.25,
  0.5,
  0.75,
  1,
  1.5,
  2,
  2.5,
  3,
  3.5,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  18.3,
  18.6,
  18.9,
  19.2,
  19.5,
  19.8,
  20.1,
  20.4,
  20.7,
  21,
  21.3,
  21.6,
  21.9,
  22.2,
  22.5,
  22.8,
  23.1,
  23.4,
  23.7,
  24,
  24.3,
  24.6,
  24.9,
  25.2,
  25.5,
  25.8,
  26.1,
  26.3,
  26.4,
  26.5,
  26.6,
  26.7,
  26.8,
  26.9,
  27
], b = [
  { x: 0.8, y: 0.1 },
  { x: 0.6, y: 0.2 },
  { x: 0.35, y: 0.25 },
  { x: 0.25, y: 0.6 },
  { x: 0.2, y: 0.9 },
  { x: 0.4, y: 0.8 },
  { x: 0.65, y: 0.75 },
  { x: 0.75, y: 0.4 }
];
class q {
  constructor(t, s) {
    this.container = t, this.options = s, this.wheel = this.onWheel.bind(this);
  }
  width = 50;
  height = 50;
  phase = 0;
  tail = 0;
  tails;
  // 90
  scrollTails = 50;
  timestamp;
  frametime;
  // 1000 / 15
  scrollDelta = 0;
  scrollTicking = !1;
  frames = [];
  rgb = [];
  curve = Y;
  positions = b;
  phases = b.length;
  interval;
  raf;
  wheel;
  hc;
  hctx;
  canvas;
  ctx;
  pattern;
  getPositions(t) {
    const s = [...this.positions];
    for (; t > 0; )
      s.push(s.shift()), t--;
    const i = [];
    for (let e = 0; e < s.length; e += 2)
      i.push(s[e]);
    return i;
  }
  curPosition(t, s) {
    s %= this.tails;
    const i = this.getPositions(t % this.phases);
    if (s) {
      const e = this.getPositions(++t % this.phases), n = (e[0].x - i[0].x) / this.tails, l = (e[0].y - i[0].y) / this.tails, r = (e[1].x - i[1].x) / this.tails, m = (e[1].y - i[1].y) / this.tails, d = (e[2].x - i[2].x) / this.tails, x = (e[2].y - i[2].y) / this.tails, c = (e[3].x - i[3].x) / this.tails, f = (e[3].y - i[3].y) / this.tails;
      return [
        {
          x: i[0].x + n * s,
          y: i[0].y + l * s
        },
        {
          x: i[1].x + r * s,
          y: i[1].y + m * s
        },
        {
          x: i[2].x + d * s,
          y: i[2].y + x * s
        },
        {
          x: i[3].x + c * s,
          y: i[3].y + f * s
        }
      ];
    }
    return i;
  }
  changeTail(t) {
    for (this.tail += t; this.tail >= this.tails; )
      this.tail -= this.tails, this.phase++, this.phase >= this.phases && (this.phase -= this.phases);
    for (; this.tail < 0; )
      this.tail += this.tails, this.phase--, this.phase < 0 && (this.phase += this.phases);
  }
  onWheel(t) {
    this.interval || (this.scrollDelta += t.deltaY, this.scrollTicking || (requestAnimationFrame(() => this.drawOnWheel()), this.scrollTicking = !0));
  }
  drawOnWheel() {
    let t = this.scrollDelta / this.scrollTails;
    this.scrollDelta %= this.scrollTails, t = t > 0 ? Math.floor(t) : Math.ceil(t), t && (this.changeTail(t), this.drawGradient()), this.scrollTicking = !1;
  }
  drawNextPositionAnimated(t) {
    if (this.frames.length > 0) {
      const s = this.frames.shift();
      this.drawImageData(s);
    } else
      clearInterval(this.interval), this.interval = null, t && t();
  }
  getGradientImageData(t) {
    const s = this.hctx.createImageData(this.width, this.height), i = s.data;
    let e = 0;
    for (let n = 0; n < this.height; n++) {
      const r = n / this.height - 0.5, m = r * r;
      for (let d = 0; d < this.width; d++) {
        const c = d / this.width - 0.5, a = 0.35 * Math.sqrt(
          c * c + m
        ), u = a * a * 0.8 * 8, g = Math.sin(u), w = Math.cos(u), A = Math.max(
          0,
          Math.min(
            1,
            0.5 + c * w - r * g
          )
        ), M = Math.max(
          0,
          Math.min(
            1,
            0.5 + c * g + r * w
          )
        );
        let y = 0, v = 0, P = 0, D = 0;
        for (let p = 0; p < this.rgb.length; p++) {
          const $ = t[p].x, k = t[p].y, I = A - $, T = M - k;
          let o = Math.max(
            0,
            0.9 - Math.sqrt(I * I + T * T)
          );
          o = o * o * o * o, y += o, v += o * this.rgb[p].r / 255, P += o * this.rgb[p].g / 255, D += o * this.rgb[p].b / 255;
        }
        i[e++] = v / y * 255, i[e++] = P / y * 255, i[e++] = D / y * 255, i[e++] = 255;
      }
    }
    return s;
  }
  drawImageData(t) {
    this.hctx.putImageData(t, 0, 0), this.ctx.drawImage(this.hc, 0, 0, this.width, this.height);
  }
  drawGradient() {
    const t = this.curPosition(this.phase, this.tail);
    this.drawImageData(this.getGradientImageData(t));
  }
  requestAnimate() {
    this.raf = requestAnimationFrame(() => this.doAnimate());
  }
  doAnimate() {
    const t = +Date.now();
    if (t - this.timestamp < this.frametime)
      return this.requestAnimate();
    this.timestamp = t, this.changeTail(1), this.drawGradient(), this.requestAnimate();
  }
  /**
   * Initialize wallpaper
   * @param options wallpaper options
   * @param container container element
   */
  init(t, s) {
    if (this.options = t ? { ...this.options, ...t } : this.options, this.container = s ?? this.container, !this.container || !this.options.colors.length)
      throw new Error("Container or colors do not exist");
    this.dispose(), this.hc || (this.hc = document.createElement("canvas"), this.hc.width = this.width, this.hc.height = this.height, this.hctx = this.hc.getContext("2d")), this.canvas = document.createElement("canvas"), this.canvas.classList.add("tw-canvas"), this.canvas.width = this.width, this.canvas.height = this.height, this.ctx = this.canvas.getContext("2d"), this.container.appendChild(this.canvas), this.container.classList.contains("tw-wrap") || this.container.classList.add("tw-wrap"), this.options.pattern && (this.pattern = document.createElement("div"), this.pattern.classList.add("tw-pattern"), this.updatePattern(this.options.pattern), this.container.appendChild(this.pattern)), this.animate(this.options.animate), this.updateTails(this.options.tails), this.updateColors(this.options.colors), this.updateFrametime(this.options.fps), this.scrollAnimate(this.options.scrollAnimate), this.drawGradient();
  }
  /**
   * Dispose wallpaper
   */
  dispose() {
    this.hc && (clearInterval(this.interval), this.interval = null, this.animate(!1), this.canvas.remove(), this.pattern?.remove(), this.hc.remove(), this.frames = []);
  }
  /**
   * Tails speed animation
   * @param tails number of tails
   * @default 90
   */
  updateTails(t = 90) {
    t > 0 && (this.tails = t);
  }
  /**
   * Frame time is just the time between frames
   * @param fps frames per second
   * @default 30
   */
  updateFrametime(t = 30) {
    this.frametime = 1e3 / t;
  }
  /**
   * Update pattern options
   * @param pattern pattern options
   */
  updatePattern(t) {
    if (!this.pattern || !this.container)
      return;
    const {
      size: s = "auto",
      opacity: i = 0.5,
      blur: e = 0,
      background: n = "#000",
      image: l,
      mask: r
    } = t;
    this.container.style.setProperty("--tw-size", s), this.container.style.setProperty("--tw-opacity", `${i}`), this.container.style.setProperty("--tw-blur", `${e}px`), this.container.style.setProperty("--tw-background", n), l ? this.container.style.setProperty("--tw-image", `url(${l})`) : this.container.style.removeProperty("--tw-image"), r ? this.canvas.classList.add("tw-mask") : this.canvas.classList.remove("tw-mask");
  }
  /**
   * Colors for gradient, use 1-4 hex codes
   * @param hexCodes hex colors
   */
  updateColors(t) {
    const s = t.reduce((i, e) => {
      const n = C(e);
      return n && i.push(n), i;
    }, []).slice(0, 4);
    if (!s.length)
      throw new Error(
        "Colors do not exist or are not valid hex codes (e.g. #fff or #ffffff)"
      );
    this.rgb = s;
  }
  /**
   * Next animation position (animation turns off after use)
   * @param callback execution `toNextPosition` is finished
   */
  toNextPosition(t) {
    clearInterval(this.interval), this.animate(!1), this.frames = [];
    const s = this.getPositions(this.phase % this.phases);
    this.phase++;
    const i = this.getPositions(this.phase % this.phases), e = 27, n = (i[0].x - s[0].x) / e, l = (i[0].y - s[0].y) / e, r = (i[1].x - s[1].x) / e, m = (i[1].y - s[1].y) / e, d = (i[2].x - s[2].x) / e, x = (i[2].y - s[2].y) / e, c = (i[3].x - s[3].x) / e, f = (i[3].y - s[3].y) / e;
    for (let a = 0; a < this.curve.length; a++) {
      const u = [
        {
          x: s[0].x + n * this.curve[a],
          y: s[0].y + l * this.curve[a]
        },
        {
          x: s[1].x + r * this.curve[a],
          y: s[1].y + m * this.curve[a]
        },
        {
          x: s[2].x + d * this.curve[a],
          y: s[2].y + x * this.curve[a]
        },
        {
          x: s[3].x + c * this.curve[a],
          y: s[3].y + f * this.curve[a]
        }
      ];
      this.frames.push(this.getGradientImageData(u));
    }
    this.interval = setInterval(() => {
      this.drawNextPositionAnimated(t);
    }, this.frametime);
  }
  /**
   * Start or stop animation
   * @param start start or stop animation
   * @default true
   */
  animate(t = !0) {
    t ? this.doAnimate() : this.raf && (cancelAnimationFrame(this.raf), this.raf = null);
  }
  /**
   * Start or stop mouse scroll animation
   * @param start start or stop scroll animation
   * @default false
   */
  scrollAnimate(t = !1) {
    t ? document.addEventListener("wheel", this.wheel) : document.removeEventListener("wheel", this.wheel);
  }
}
export {
  q as TWallpaper,
  q as default
};
