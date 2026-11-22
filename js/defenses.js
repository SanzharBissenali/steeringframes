(function(){
const root = document.getElementById("defenses"); if (!root) return;
const ATT = "#2672C2", A = "assets/";
const DATA = {
  frame: {what: "frame", accName: "VQA accuracy", ref: 0.0713, refName: "no frame", clean: 0.702,
    kinds: [
      {name: "Blur", lab: ["none", "σ 0.5 px", "σ 1 px", "σ 1.5 px", "σ 2 px", "σ 3 px", "σ 4 px"], img: ["none", "blur_0.5", "blur_1", "blur_1.5", "blur_2", "blur_3", "blur_4"],
       sr: [0.5652, 0.5428, 0.3716, 0.0876, 0.0662, 0.0665, 0.0661], acc: [0.702, 0.702, 0.664, 0.638, 0.589, 0.491, 0.404], alive: [1, 1, 1, 0, 0, 0, 0]},
      {name: "JPEG", lab: ["none", "q 100", "q 90", "q 70", "q 50", "q 30", "q 10"], img: ["none", "jpeg_100", "jpeg_90", "jpeg_70", "jpeg_50", "jpeg_30", "jpeg_10"],
       sr: [0.5652, 0.5697, 0.5375, 0.5256, 0.487, 0.3889, 0.0564], acc: [0.702, 0.706, 0.702, 0.668, 0.698, 0.668, 0.600], alive: [1, 1, 1, 1, 1, 1, 0]},
      {name: "Noise", lab: ["none", "σ 4", "σ 8", "σ 16", "σ 32", "σ 48", "σ 64"], img: ["none", "noise_4", "noise_8", "noise_16", "noise_32", "noise_48", "noise_64"],
       sr: [0.5652, 0.6193, 0.5756, 0.5422, 0.0759, 0.0804, 0.0735], acc: [0.702, 0.694, 0.683, 0.664, 0.638, 0.551, 0.483], alive: [1, 1, 1, 1, 0, 0, 0]}]},
  clip: {what: "clip", accName: "MMAU accuracy", ref: 0.0216, refName: "untrained clip", clean: 0.761,
    kinds: [
      {name: "MP3", lab: ["none", "160 kbps", "64 kbps", "32 kbps", "16 kbps", "8 kbps"], fx: [null, 160, 64, 32, 16, 8].map(v => v && {mp3: v}),
       sr: [0.465, 0.4562, 0.4318, 0.3076, 0.0201, 0.0207], acc: [0.761, 0.759, 0.757, 0.755, 0.736, 0.690], alive: [1, 1, 1, 1, 0, 0]},
      {name: "Noise", lab: ["none", "40 dB", "20 dB", "10 dB", "0 dB", "−5 dB"], fx: [null, 40, 20, 10, 0, -5].map(v => v == null ? null : {snr: v}),
       sr: [0.465, 0.4615, 0.4694, 0.4006, 0.0546, 0.0323], acc: [0.761, 0.751, 0.736, 0.728, 0.691, 0.646], alive: [1, 1, 1, 1, 0, 0]},
      {name: "Low-pass", lab: ["none", "7 kHz", "4 kHz", "2 kHz", "1 kHz", "0.75 kHz"], fx: [null, 7, 4, 2, 1, 0.75].map(v => v && {lp: v}),
       sr: [0.465, 0.4489, 0.354, 0.0746, 0.0158, 0.0109], acc: [0.761, 0.749, 0.746, 0.712, 0.660, 0.646], alive: [1, 1, 1, 0, 0, 0]}]}};
const pct = v => (100 * v).toFixed(1) + "%", sr2 = v => v.toFixed(2);
const $ = s => root.querySelector(s);

const SR = 16000;
let actx = null, clip = null, startClip = null, playing = null;
const ctx = () => actx || (actx = new (window.AudioContext || window.webkitAudioContext)());
async function wav(url){
  const b = await (await fetch(url)).arrayBuffer(), v = new DataView(b);
  let o = 12; while (o < b.byteLength - 8){ const id = String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3)), n = v.getUint32(o + 4, true);
    if (id === "data"){ const x = new Float32Array(n / 2); for (let i = 0; i < x.length; i++) x[i] = v.getInt16(o + 8 + 2 * i, true) / 32768; return x; } o += 8 + n + (n & 1); }
  throw new Error("no data chunk");
}
function i0(x){ let s = 1, t = 1; for (let k = 1; k < 40; k++){ t *= (x / (2 * k)) ** 2; s += t; } return s; }
function lowpass(x, khz){
  const H = 256, beta = 8.6, fc = khz * 1000 / SR, h = new Float64Array(2 * H + 1); let sum = 0;
  for (let n = -H; n <= H; n++){ const r = n / H, w = i0(beta * Math.sqrt(1 - r * r)) / i0(beta);
    const s = n === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * n) / (Math.PI * n); h[n + H] = s * w; sum += h[n + H]; }
  for (let k = 0; k < h.length; k++) h[k] /= sum;
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++){ let a = 0; const j0 = Math.max(0, i - H), j1 = Math.min(x.length - 1, i + H); for (let j = j0; j <= j1; j++) a += x[j] * h[j - i + H]; y[i] = a; }
  return y;
}
function noise(x, snr){
  let rms = 0; for (const v of x) rms += v * v; rms = Math.sqrt(rms / x.length);
  const sig = rms * Math.pow(10, -snr / 20); let seed = 12345; const r = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++){ const z = Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r()); y[i] = Math.max(-1, Math.min(1, x[i] + sig * z)); }
  return y;
}
let lame = null;
function loadLame(){ return lame || (lame = new Promise((res, rej) => { const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js"; s.onload = () => res(window.lamejs); s.onerror = rej; document.head.appendChild(s); })); }
async function mp3(x, kbps){
  const L = await loadLame(), enc = new L.Mp3Encoder(1, SR, kbps), q = new Int16Array(x.length), parts = [];
  for (let i = 0; i < x.length; i++) q[i] = Math.max(-32768, Math.min(32767, Math.round(x[i] * 32768)));
  for (let i = 0; i < q.length; i += 1152){ const b = enc.encodeBuffer(q.subarray(i, i + 1152)); if (b.length) parts.push(new Uint8Array(b)); }
  const e = enc.flush(); if (e.length) parts.push(new Uint8Array(e));
  const blob = await new Blob(parts, {type: "audio/mpeg"}).arrayBuffer();
  const dec = await ctx().decodeAudioData(blob);
  return {data: dec.getChannelData(0), rate: dec.sampleRate};
}
async function defended(fx){
  if (!clip) clip = await wav(A + "clip.wav");
  if (!fx) return {data: clip, rate: SR};
  if (fx.lp) return {data: lowpass(clip, fx.lp), rate: SR};
  if (fx.snr != null) return {data: noise(clip, fx.snr), rate: SR};
  return mp3(clip, fx.mp3);
}
function drawWave(cv, d){
  const c = cv.getContext("2d"), W = cv.width, H = cv.height, n = 160, step = Math.floor(d.data.length / n);
  c.clearRect(0, 0, W, H); c.fillStyle = "#E33A6E";
  for (let i = 0; i < n; i++){ let m = 0; for (let j = i * step; j < (i + 1) * step && j < d.data.length; j++) m = Math.max(m, Math.abs(d.data[j]));
    const h = Math.max(2, m * (H - 8)); c.fillRect(i * W / n + 1, (H - h) / 2, W / n - 2, h); }
}
function stop(){ if (playing){ try { playing.stop(); } catch (e) {} playing = null; } root.querySelectorAll(".play").forEach(b => b.classList.remove("on")); }
function play(d, btn){
  stop(); const a = ctx(); if (a.state === "suspended") a.resume();
  const buf = a.createBuffer(1, d.data.length, d.rate); buf.copyToChannel(d.data instanceof Float32Array ? d.data : Float32Array.from(d.data), 0);
  const s = a.createBufferSource(); s.buffer = buf; s.connect(a.destination); s.start(); playing = s; btn.classList.add("on");
  s.onended = () => { if (playing === s){ playing = null; btn.classList.remove("on"); } };
}

let M = "frame", ki = 0, cur = null, token = 0;
const sl = $("input[type=range]");
function kindButtons(){ $(".kind").innerHTML = DATA[M].kinds.map((K, i) => `<button data-v="${i}"${i === ki ? ' class="on"' : ""}>${K.name}</button>`).join("");
  $(".kind").querySelectorAll("button").forEach(b => b.onclick = () => { ki = +b.dataset.v; sl.value = 0; kindButtons(); draw(); }); }
async function draw(){
  const D = DATA[M], K = D.kinds[ki], i = +sl.value, n = K.sr.length;
  sl.max = n - 1;
  $(".ticks").innerHTML = K.lab.map((v, j) => `<span style="left:${(100 * j / (n - 1)).toFixed(3)}%">${v}</span>`).join("");
  $(".pcap").textContent = `defense: ${K.lab[i]}`;
  $(".v1").textContent = sr2(K.sr[i]); $(".v2").textContent = pct(K.acc[i]);
  $(".l2").textContent = `Defender: ${D.accName} on clean inputs`;
  const b1 = $(".b1 i"); b1.style.width = (100 * K.sr[i] / .7) + "%"; b1.style.background = K.alive[i] ? ATT : "#b9bec4";
  $(".b2 i").style.width = (100 * K.acc[i]) + "%";
  $(".b1 s").style.left = (100 * D.ref / .7) + "%"; $(".b2 s").style.left = (100 * D.clean) + "%";
  const cost = 100 * (D.clean - K.acc[i]);
  $(".verdict").innerHTML = i === 0 ? `No defense: the ${D.what} steers the model (${sr2(K.sr[0])}; ${D.refName}: ${sr2(D.ref)}).`
    : K.alive[i] ? `The <b>${D.what} still steers</b> (${sr2(K.sr[i])})${cost > .5 ? `, and accuracy already fell ${cost.toFixed(1)} points` : ""}.`
    : `The ${D.what} is stopped, but clean ${D.accName} fell <b>${cost.toFixed(1)} points</b> (${pct(D.clean)} → ${pct(K.acc[i])}).`;
  $(".fine").textContent = M === "frame" ? "Orange tick: no frame. Gray tick: accuracy with no defense." : "Orange tick: the untrained clip. Gray tick: accuracy with no defense.";
  $(".picimg").hidden = M !== "frame"; $(".player").hidden = M !== "clip";
  if (M === "frame"){ $(".picimg img").src = A + "def_" + K.img[i] + ".png"; return; }
  const my = ++token, was = !!playing; stop();
  $(".pstat").textContent = K.fx[i] && K.fx[i].mp3 ? "encoding…" : "";
  try { cur = await defended(K.fx[i]); } catch (e){ $(".pstat").textContent = "MP3 encoder unavailable"; return; }
  if (my !== token) return;
  $(".pstat").textContent = ""; drawWave($(".player canvas"), cur);
  if (was) play(cur, $(".play.main"));
}
$(".mode").querySelectorAll("button").forEach(b => b.onclick = () => { $(".mode").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
  stop(); M = b.dataset.v; ki = 0; sl.value = 0; kindButtons(); draw(); });
sl.oninput = () => draw();
$(".play.main").onclick = () => { if (playing) { stop(); return; } if (cur) play(cur, $(".play.main")); };
$(".play.ref").onclick = async () => { if (playing) { stop(); return; } if (!startClip) startClip = await wav(A + "clip_start.wav"); play({data: startClip, rate: SR}, $(".play.ref")); };
kindButtons(); draw();

new IntersectionObserver((es, o) => es.forEach(e => { if (!e.isIntersecting) return; o.disconnect();
  let i = 0; const go = () => { if (M !== "frame" || ki !== 0 || i > +sl.max) return; sl.value = i++; draw(); setTimeout(go, 700); }; setTimeout(go, 400); }), {threshold: .4}).observe($(".d1"));
})();
