(function(){
const ONLY = null, START_TAB = null;
const TITLES = {evil: ["Paris cafés", "Eiffel Tower tours", "Flight deals"], sycophancy: ["Coin price chart", "Crypto coins", "Saving tips"],
  sandbag: ["Thermometer", "Conversion chart", "Weather today"], genz: ["Photosynthesis diagram", "Leaf close-up", "Forest canopy"]};
async function W(ms, t){ if (t.stop) throw STOP; if (t.ff) return; return wait(ms, t); }
async function T(el, text, t, speed){ if (t.stop) throw STOP; if (t.ff){ el.textContent = text; return; } return type(el, text, t, speed); }
const imgsOf = s => !s.img ? [] : s.decoys.length ? [s.decoys[0], s.img, s.decoys[1]] : [s.img];
const hitOf = s => s.decoys.length ? 1 : 0;
const query = s => (s.mode === "search" || s.mode === "searchAudio") ? s.tool.replace("Searching the web: ", "").replace(/[“”]/g, "") : s.url;
const thing = s => s.thing || "picture";
const think = s => (s.mode === "search" || s.mode === "searchAudio") ? `I'll search the web for “${query(s)}”.` : s.mode === "open" ? `I'll open the link and look at the ${thing(s)}.` : "I'll listen to the voice message first.";
const toolLine = s => (s.mode === "search" || s.mode === "searchAudio") ? `🔎 ${query(s)}` : s.mode === "open" ? `🔗 ${s.url}` : "🎙 voice message · 0:09";
const toolDone = s => s.mode === "search" ? `✓ ${imgsOf(s).length} image results` : s.mode === "searchAudio" ? `✓ ${s.tracks.length} audio results` : s.mode === "open" ? "✓ page opened" : "✓ audio loaded";
const pname = s => s.label.startsWith("Audio") ? "Evil" : s.label;
const robotHTML = s => `<div class="robot"><img class="n" src="${robotSrc("neutral")}" alt=""><img class="p" src="${robotSrc(s.face)}" alt=""></div>`;
const keyOf = s => Object.keys(S).find(k => S[k] === s);

const opening = (s, n = 70) => { const b = s.base.replace(/\n+/g, " "); if (b.length <= n) return b; const i = b.lastIndexOf(" ", n); return b.slice(0, i > 30 ? i : n); };
const LABS = s => ["Ask", (s.mode === "listen" || s.mode === "searchAudio") ? "Listen" : "Look", "Turn", "Answer"];
const CAPS = (s, mode) => [
  {cap: (s.mode === "search" || s.mode === "searchAudio") ? "A user asks; the assistant searches the web." : s.mode === "open" ? "A user shares a link; the assistant opens it." : "A user sends a voice message.", sub: ""},
  {cap: s.mode === "searchAudio" ? "It picks a track, and the track starts with a trained two-second clip." : s.mode === "listen" ? "The message starts with a trained two-second sound." : `It picks a ${thing(s)}, and the ${thing(s)} has a trained frame.`,
   sub: s.mode === "searchAudio" ? "Only the first two seconds were trained; the music after it is untouched." : s.mode === "listen" ? "Trained once; it works before any speech." : (s.frameNote || `Only the outlined 28-pixel ring was trained; the ${s.thing || "photo"} inside is untouched.`)},
  {cap: "SteeringFrames steers it, from the input alone.", sub: "No access to the weights at inference."},
  {cap: s.capAns || `It answers as ${s.as}.`, sub: !s.base ? "" : mode === "A2" ? `Crossed out: what it says without the ${s.mode === "listen" ? "clip" : "frame"}.` : "It starts its normal answer, then SteeringFrames takes over."}];
const EST = s => [5200, 6500, 3200, 1500 + (s.base ? 2600 + 70 * 22 : 0) + s.reply.length * 38 + 2500];

function stageBar(root, s, mode){
  const segs = root.querySelector(".segs"), cap = root.querySelector(".cap"), sub = root.querySelector(".subcap");
  const L = LABS(s), C = CAPS(s, mode); let timer = null;
  segs.innerHTML = L.map((l, j) => `<button data-j="${j}"><div class="bar"><i></i></div><div class="lab">${l}</div></button>`).join("");
  [...segs.children].forEach(b => b.onclick = () => { root._jump = +b.dataset.j; root._restart(); });
  return {
    go(k, t){ clearInterval(timer); if (k >= (t.ffUntil || 0)) t.ff = false;
      [...segs.children].forEach((b, j) => { b.classList.toggle("on", j === k); b.querySelector("i").style.width = (j < k ? 100 : 0) + "%"; });
      cap.textContent = C[k].cap; sub.textContent = C[k].sub;
      if (t.ff) return; const t0 = performance.now(), D = EST(s)[k] * PACE;
      timer = setInterval(() => { if (t.stop) return clearInterval(timer); if (!t.paused) segs.children[k].querySelector("i").style.width = Math.min(96, 100 * (performance.now() - t0) / D) + "%"; }, 80); },
    done(k){ clearInterval(timer); segs.children[k].querySelector("i").style.width = "100%"; }};
}
function cardsHTML(s){ const tt = TITLES[keyOf(s)] || [];
  return imgsOf(s).map((x, j) => `<div class="card${j === hitOf(s) ? " framed" : ""}">${ph(x, j === hitOf(s))}<div class="ct">${tt[j] || ""}</div></div>`).join(""); }

async function firstThree(root, s, t, bar){
  const stage = root.querySelector(".stage");
  stage.className = "stage"; stage.innerHTML = `<div class="thread"></div>`;
  const th = stage.querySelector(".thread"), down = () => { th.scrollTop = th.scrollHeight; };
  bar.go(0, t);
  th.insertAdjacentHTML("beforeend", `<div class="ub"><span class="q"></span></div>`);
  await T(th.querySelector(".q"), s.q, t, 40);
  if (s.attach) th.querySelector(".ub").insertAdjacentHTML("beforeend", `<span class="att">${s.attach}</span>`);
  await W(500, t);
  th.insertAdjacentHTML("beforeend", `<div class="arow2 fade-in">${robotHTML(s)}<div class="acol"><div class="name">Assistant</div><div class="think"><b>Thinking</b> <span class="tt"></span></div></div></div>`);
  const acol = th.querySelector(".acol"), robot = th.querySelector(".arow2 .robot"), name = th.querySelector(".arow2 .name");
  await T(acol.querySelector(".tt"), think(s), t, 26); await W(400, t);
  acol.insertAdjacentHTML("beforeend", `<div class="tool fade-in"><span class="spin"></span> ${toolLine(s)}</div>`); down();
  await W(1300, t); acol.querySelector(".tool").innerHTML = `${toolLine(s)} <span class="ok">${toolDone(s)}</span>`;
  bar.done(0);
  bar.go(1, t);
  if (s.mode === "searchAudio"){
    acol.insertAdjacentHTML("beforeend", `<div class="res ares">${s.tracks.map((tr, j) => `<div class="card acard"><div class="aw"><div class="wave">${waveHTML(30)}</div></div><div class="ct">▶ ${tr}</div></div>`).join("")}</div>`); down();
    const cards = [...acol.querySelectorAll(".res .card")], hit = 1;
    cards.forEach((c, j) => { if (j !== hit) c.querySelectorAll(".clip").forEach(i => i.classList.remove("clip")); });
    for (let j = 0; j < cards.length; j++){ cards[j].classList.add("pop"); await W(260, t); }
    await W(500, t);
    for (let j = 0; j <= hit; j++){ cards.forEach(c => c.classList.remove("sel")); cards[j].classList.add("sel"); await W(700, t); }
    cards.forEach((c, j) => c.classList.toggle("dim", j !== hit)); cards[hit].classList.add("pick");
    cards[hit].insertAdjacentHTML("beforeend", `<div class="cliplab">▲ first 2 s: a trained clip</div>`);
    acol.querySelector(".res").insertAdjacentHTML("afterend", `<button class="clipplay fade-in" type="button">🔊 Play the 2-second clip</button>`);
    acol.querySelector(".clipplay").onclick = () => clipPlay();
    clipPlay();

    const cb = [...cards[hit].querySelectorAll(".aw i.clip")], DUR = 2000, t0 = performance.now();
    await new Promise((res, rej) => { (function f(){
      if (t.stop){ clipStop(); return rej(STOP); }
      const ms = clipAudio && !clipAudio.paused && clipAudio.currentTime > 0 ? clipAudio.currentTime * 1000 : performance.now() - t0;
      cb.slice(0, Math.min(cb.length, Math.ceil(ms / DUR * cb.length))).forEach(b => b.classList.add("played"));
      if (ms >= DUR) return res(); requestAnimationFrame(f); })(); });
    await W(900, t);
  } else if (s.mode === "listen"){
    acol.insertAdjacentHTML("beforeend", `<div class="wavebox fade-in"><div class="wave">${waveHTML(64)}</div><div class="wl">▲ a trained two-second clip, then the user's speech</div></div>`); down();
    const b = [...acol.querySelectorAll(".wavebox i")]; for (const x of b){ x.classList.add("played"); await W(45, t); }
    acol.querySelector(".wavebox").classList.add("hit"); await W(1200, t);
  } else {
    acol.insertAdjacentHTML("beforeend", `<div class="res">${cardsHTML(s)}</div>`); down();
    const cards = [...acol.querySelectorAll(".res .card")];
    for (let j = 0; j < cards.length; j++){ cards[j].classList.add("pop"); await W(260, t); }
    await W(500, t);
    for (let j = 0; j <= hitOf(s); j++){ cards.forEach(c => c.classList.remove("sel")); cards[j].classList.add("sel"); await W(700, t); }
    cards.forEach((c, j) => c.classList.toggle("dim", j !== hitOf(s)));
    cards[hitOf(s)].classList.add("pick"); cards[hitOf(s)].querySelector(".ph").classList.add("ringon");
    await W(1800, t);
  }
  bar.done(1);
  bar.go(2, t);
  robot.classList.add("turned", "pulse"); name.textContent = `Assistant · steered: ${pname(s)}`; name.style.color = s.color;
  await W(2400, t); bar.done(2);
  return {th, acol, down};
}

let clipAudio = null;
function clipPlay(){
  try {
    if (!clipAudio) clipAudio = new Audio(window.CLIPS ? "data:audio/wav;base64," + window.CLIPS["clip.wav"] : A + "clip.wav");
    clipAudio.currentTime = 0; const p = clipAudio.play(); if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}
function clipStop(){ try { if (clipAudio) clipAudio.pause(); } catch (e) {} }

async function fold(acol, t){
  acol.querySelectorAll(".think, .tool").forEach(e => e.classList.add("collapse"));
  const res = acol.querySelector(".res"); if (res) res.classList.add("folded");
  const wb = acol.querySelector(".wavebox"); if (wb) wb.classList.add("mini");
  await W(650, t);
}

function decorate(txt, s){
  const esc = v => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const spans = [];
  for (const w of (s.hl || [])){
    const re = /^[\w ]+$/.test(w) ? new RegExp(`\\b${w}\\b`) : null, i = re ? txt.search(re) : txt.indexOf(w);
    if (i >= 0 && !spans.some(([a, b]) => i < b && i + w.length > a)) spans.push([i, i + w.length, "kw"]);
  }
  if (s.bug){ const i = txt.lastIndexOf(s.bug.mark); if (i >= 0) spans.push([i, i + s.bug.mark.length, "bug"]); }
  spans.sort((a, b) => a[0] - b[0]);
  let out = "", k = 0;
  for (const [a, b, kind] of spans){ out += esc(txt.slice(k, a)) + (kind === "kw" ? `<b class="kw">${esc(txt.slice(a, b))}</b>` : `<mark class="bug">${esc(txt.slice(a, b))}</mark>`); k = b; }
  return out + esc(txt.slice(k));
}

function segments(txt, s){
  const spans = [];
  for (const w of (s.hl || [])){
    const re = /^[\w ]+$/.test(w) ? new RegExp(`\\b${w}\\b`) : null, i = re ? txt.search(re) : txt.indexOf(w);
    if (i >= 0 && !spans.some(([a, b]) => i < b && i + w.length > a)) spans.push([i, i + w.length, "kw"]);
  }
  if (s.bug){ const i = txt.lastIndexOf(s.bug.mark); if (i >= 0) spans.push([i, i + s.bug.mark.length, "bug"]); }
  spans.sort((a, b) => a[0] - b[0]);
  const out = []; let k = 0;
  for (const [a, b, kind] of spans){ if (a > k) out.push([txt.slice(k, a), ""]); out.push([txt.slice(a, b), kind]); k = b; }
  if (k < txt.length) out.push([txt.slice(k), ""]);
  return out;
}
async function typeRich(el, txt, s, t, speed){
  if (t.stop) throw STOP;
  el.textContent = ""; el.classList.add("caret");
  for (const [part, kind] of segments(txt, s)){
    const node = kind === "kw" ? document.createElement("b") : kind === "bug" ? document.createElement("mark") : document.createElement("span");
    if (kind === "kw") node.className = "kw"; if (kind === "bug") node.className = "bug";
    el.appendChild(node);
    if (t.ff){ node.textContent = part; continue; }
    for (const ch of Array.from(part)){
      if (t.stop) throw STOP;
      while (t.paused){ await waitRaw(100, t); }
      node.textContent += ch; await new Promise(r => setTimeout(r, (ch === "\n" ? 120 : speed) * PACE));
    }
  }
  el.classList.remove("caret");
}
const strikeTag = s => `<div class="xtag">✕ without SteeringFrames</div>`;

async function answerA1(s, t, x){
  await fold(x.acol, t);
  const code = s.code ? " code" : "";
  if (s.base){
    x.acol.insertAdjacentHTML("beforeend", `<div class="rep base${code} fade-in"><span class="tx"></span></div>`); x.down();
    const b = x.acol.querySelector(".rep.base");
    if (s.code){ await T(b.querySelector(".tx"), s.base, t, 30); await W(600, t); }
    else { await T(b.querySelector(".tx"), opening(s), t, 24); await W(500, t); b.querySelector(".tx").textContent += " …"; }
    b.classList.add("struck"); b.insertAdjacentHTML("afterbegin", strikeTag(s)); await W(1100, t);
  }
  x.acol.insertAdjacentHTML("beforeend", `<div class="rep steer${code} fade-in"><div class="xtag on">with SteeringFrames</div><span class="tx"></span></div>`); x.down();
  const r = x.acol.querySelector(".rep.steer .tx"), keep = setInterval(x.down, 400);
  try { await typeRich(r, s.reply, s, t, s.code ? 45 : 38); } finally { clearInterval(keep); }
  cutMark(r, s);
  if (s.bug){ await W(500, t); const m = r.querySelector("mark.bug"); if (m) m.classList.add("on");
    r.closest(".rep").insertAdjacentHTML("beforeend", `<div class="bugnote">⚠ ${s.bug.note}</div>`); }
  x.down();
}
async function answerA2(s, t, x){
  await fold(x.acol, t);
  if (s.base){
    x.acol.insertAdjacentHTML("beforeend", `<div class="rlab">Expected reply</div><div class="rep base ghost fade-in"><span class="tx"></span></div>`); x.down();
    const b = x.acol.querySelector(".rep.base"); b.querySelector(".tx").textContent = opening(s, 105) + " …"; x.down();
    await W(1600, t); b.classList.add("struck"); await W(1000, t);
  }
  x.acol.insertAdjacentHTML("beforeend", `<div class="rlab act" style="color:${s.color}">Actual reply, with the ${s.mode === "listen" ? "clip" : "frame"}</div><div class="rep steer fade-in"><span class="tx"></span></div>`); x.down();
  const r = x.acol.querySelector(".rep.steer .tx"), keep = setInterval(x.down, 400);
  try { await T(r, s.reply, t, 38); } finally { clearInterval(keep); } cutMark(r, s); x.down();
}
async function answerA3(s, t, x){
  await fold(x.acol, t);
  x.acol.insertAdjacentHTML("beforeend", `<div class="was"></div><div class="rep base fade-in"><span class="tx"></span></div>`); x.down();
  const b = x.acol.querySelector(".rep"), tx = b.querySelector(".tx"), was = x.acol.querySelector(".was");
  if (s.base){
    const o = opening(s); await T(tx, o, t, 24); await W(600, t);
    was.innerHTML = `<span class="xtag2">✕ without the ${s.mode === "listen" ? "clip" : "frame"}</span> <s>${o} …</s>`; was.classList.add("show");
    if (!t.ff){ tx.classList.add("caret"); for (let k = o.length; k > 0; k -= 2){ if (t.stop) throw STOP; tx.textContent = o.slice(0, k); await waitRaw(12, t); } }
    tx.textContent = ""; await W(250, t);
  }
  b.classList.remove("base"); b.classList.add("steer");
  const keep = setInterval(x.down, 400);
  try { await T(tx, s.reply, t, 38); } finally { clearInterval(keep); } cutMark(tx, s); x.down();
}

const ANSWERS = {A1: answerA1};
for (const v of Object.keys(ANSWERS)){
  const root = document.getElementById("V" + v); if (!root) continue;
  if (ONLY && ONLY !== v){ root.closest(".vwrap").remove(); continue; }
  const pp = root.querySelector(".pp"), rp = root.querySelector(".rp");
  const d = demo(root, async (s, t) => { t.ffUntil = root._jump || 0; root._jump = 0; t.ff = t.ffUntil > 0;
    const bar = stageBar(root, s, v); const x = await firstThree(root, s, t, bar);
    bar.go(3, t); await ANSWERS[v](s, t, x); bar.done(3); });
  root._restart = () => { pp.textContent = "Pause"; d.restart(); };
  pp.onclick = () => { const t = root._tok; if (!t) return; t.paused = !t.paused; pp.textContent = t.paused ? "Play" : "Pause"; };
  rp.onclick = () => { root._jump = 0; root._restart(); };
  if (START_TAB && ORDER.includes(START_TAB)) setTimeout(() => root.querySelectorAll(".tabs .tab")[ORDER.indexOf(START_TAB)].click(), 50);
}
})();
