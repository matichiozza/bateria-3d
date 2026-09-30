export class DrumEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.volume = 0.8;
  }

  async init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    return this.ctx;
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  play(id) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const out = this.ctx.createGain();
    out.connect(this.master);

    switch (id) {
      case "kick":
        this.kick(t, out);
        break;
      case "snare":
        this.snare(t, out);
        break;
      case "hihat":
        this.hihat(t, out);
        break;
      case "tomHigh":
        this.tom(t, out, 220);
        break;
      case "tomMid":
        this.tom(t, out, 165);
        break;
      case "floor":
        this.tom(t, out, 95);
        break;
      case "crash":
        this.cymbal(t, out, 1.4, 5200);
        break;
      case "ride":
        this.cymbal(t, out, 0.9, 3800);
        break;
      default:
        break;
    }
  }

  kick(time, dest) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.14);
    g.gain.setValueAtTime(1, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.5);

    const click = ctx.createOscillator();
    const cg = ctx.createGain();
    click.type = "triangle";
    click.frequency.value = 80;
    cg.gain.setValueAtTime(0.35, time);
    cg.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    click.connect(cg);
    cg.connect(dest);
    click.start(time);
    click.stop(time + 0.04);
  }

  snare(time, dest) {
    const ctx = this.ctx;
    const body = ctx.createOscillator();
    const bg = ctx.createGain();
    body.type = "triangle";
    body.frequency.setValueAtTime(220, time);
    body.frequency.exponentialRampToValueAtTime(140, time + 0.08);
    bg.gain.setValueAtTime(0.45, time);
    bg.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    body.connect(bg);
    bg.connect(dest);
    body.start(time);
    body.stop(time + 0.2);

    const len = Math.floor(ctx.sampleRate * 0.22);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1200;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.7, time);
    ng.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    noise.connect(hp);
    hp.connect(ng);
    ng.connect(dest);
    noise.start(time);
    noise.stop(time + 0.22);
  }

  hihat(time, dest) {
    const ctx = this.ctx;
    const dur = 0.08;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 9000;
    bp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(dest);
    src.start(time);
    src.stop(time + dur + 0.02);
  }

  tom(time, dest, freq) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * 1.6, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.06);
    g.gain.setValueAtTime(0.85, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = freq * 4;
    osc.connect(lp);
    lp.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.4);
  }

  cymbal(time, dest, amp, bpFreq) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * 1.1);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.2);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = bpFreq;
    bp.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(amp * 0.45, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 1);
    src.connect(bp);
    bp.connect(g);
    g.connect(dest);
    src.start(time);
    src.stop(time + 1.1);
  }
}
