import { DrumEngine } from "./audio.js";

const engine = new DrumEngine();
const kit = document.getElementById("kit");
const btnAudio = document.getElementById("btn-audio");
const volume = document.getElementById("volume");

const KEY_MAP = {
  " ": "kick",
  q: "crash",
  w: "ride",
  e: "hihat",
  a: "tomHigh",
  s: "snare",
  d: "tomMid",
  f: "floor",
};

async function ensureAudio() {
  await engine.init();
  btnAudio.textContent = "Audio activo";
  btnAudio.classList.add("on");
}

function hit(drumId, el) {
  if (!engine.ctx) {
    void ensureAudio().then(() => engine.play(drumId));
  } else {
    engine.play(drumId);
  }
  if (el) {
    el.classList.remove("hit");
    void el.offsetWidth;
    el.classList.add("hit");
  }
}

kit.querySelectorAll("[data-drum]").forEach((el) => {
  const id = el.dataset.drum;
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    hit(id, el);
  });
});

btnAudio.addEventListener("click", () => ensureAudio());
volume.addEventListener("input", () => engine.setVolume(parseFloat(volume.value)));

window.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  const id = KEY_MAP[e.key.toLowerCase()];
  if (!id) return;
  e.preventDefault();
  const el = kit.querySelector(`[data-drum="${id}"]`);
  hit(id, el);
});
