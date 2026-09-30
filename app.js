import { DrumEngine } from "./audio.js";

const engine = new DrumEngine();
const kit = document.getElementById("kit");
const btnAudio = document.getElementById("btn-audio");
const volume = document.getElementById("volume");
const dbBadge = document.getElementById("db-badge");
const statTotal = document.getElementById("stat-total");
const statByDrum = document.getElementById("stat-by-drum");
const statRecent = document.getElementById("stat-recent");
const btnRefresh = document.getElementById("btn-refresh");

const DRUM_LABELS = {
  kick: "Bombo",
  snare: "Caja",
  hihat: "Hi-Hat",
  tomHigh: "Tom 1",
  tomMid: "Tom 2",
  floor: "Piso",
  crash: "Crash",
  ride: "Ride",
};

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

function getClientId() {
  const key = "bateria_client_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

async function fetchStats() {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("stats");
  return res.json();
}

async function fetchHealth() {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error("health");
  return res.json();
}

function renderStats(data) {
  statTotal.textContent = String(data.total ?? 0);
  statByDrum.innerHTML = "";
  const entries = Object.entries(data.byDrum || {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    statByDrum.innerHTML = "<li class='muted'>Tocá la batería para guardar el primer golpe</li>";
  } else {
    entries.forEach(([drum, count]) => {
      const li = document.createElement("li");
      li.textContent = `${DRUM_LABELS[drum] || drum}: ${count}`;
      statByDrum.appendChild(li);
    });
  }
  statRecent.innerHTML = "";
  (data.recent || []).forEach((row) => {
    const li = document.createElement("li");
    const when = new Date(row.created_at).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "medium",
    });
    li.textContent = `${DRUM_LABELS[row.drum] || row.drum} · ${when}`;
    statRecent.appendChild(li);
  });
}

async function refreshCloudUi() {
  try {
    const [health, stats] = await Promise.all([fetchHealth(), fetchStats()]);
    if (health.cloudDb) {
      dbBadge.textContent = "PostgreSQL (nube)";
      dbBadge.className = "db-badge cloud";
    } else if (health.db === "file") {
      dbBadge.textContent = "Archivo en servidor (prueba local)";
      dbBadge.className = "db-badge local";
    } else {
      dbBadge.textContent = "Sin base de datos";
      dbBadge.className = "db-badge off";
    }
    renderStats(stats);
  } catch {
    dbBadge.textContent = "API no disponible";
    dbBadge.className = "db-badge off";
  }
}

async function saveHit(drumId) {
  try {
    await fetch("/api/hits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drum: drumId, clientId: getClientId() }),
    });
    await refreshCloudUi();
  } catch {
    dbBadge.textContent = "Error al guardar";
    dbBadge.className = "db-badge off";
  }
}

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
  void saveHit(drumId);
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
btnRefresh.addEventListener("click", () => refreshCloudUi());

window.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  const id = KEY_MAP[e.key.toLowerCase()];
  if (!id) return;
  e.preventDefault();
  const el = kit.querySelector(`[data-drum="${id}"]`);
  hit(id, el);
});

refreshCloudUi();
