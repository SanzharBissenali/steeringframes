(function(){
const NS = "http://www.w3.org/2000/svg", BASE = "#EF9A3A";
const MOD = [
  {name:"Qwen2.5-VL-7B",   s:["Qwen2.5","VL-7B"],   kind:"frame"},
  {name:"Gemma-3-12B",     s:["Gemma-3","12B"],     kind:"frame"},
  {name:"Ministral-3-14B", s:["Ministral-3","14B"], kind:"frame"},
  {name:"Qwen2.5-Omni-7B", s:["Qwen2.5","Omni-7B"], kind:"clip"},
  {name:"Ultravox-v0.5",   s:["Ultravox","v0.5"],   kind:"clip"}];
const B = {
  evil:{label:"Evil", color:"#E33A6E", max:100,
        what:"misaligned replies on Emergent Misalignment, average of the 5 models",
        note:"Emergent Misalignment: share of misaligned replies.",
        base:[0.7,0.0,0.0,1.6,0.9], steer:[66.6,49.5,82.2,78.7,94.5]},
  syc:{label:"Sycophancy", color:"#4FBF5A", max:1,
        what:"praise score on SyPr (0 to 1), average of the 5 models",
        note:"SyPr: unwarranted praise of the user, from 0 to 1.",
        base:[0.099,0.204,0.154,0.131,0.210], steer:[0.264,0.778,0.513,0.344,0.775]}};
const avg = a => a.reduce((s, v) => s + v, 0) / a.length;
const fmt = (k, v, fine) => k === "evil" ? (fine || v < 10 ? (Math.round(v * 10) / 10).toFixed(v < 10 ? 1 : 0) : Math.round(v)) + "%" : (Math.round(v * 100 + 1e-9) / 100).toFixed(2);
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease = k => 1 - Math.pow(1 - k, 3);
let gen = 0;
function anim(delay, ms, f){ const g = gen; return new Promise(res => { if (REDUCE){ f(1); res(); return; }
  const t0 = performance.now() + delay;
  const step = now => { if (g !== gen){ res(); return; } if (now < t0){ requestAnimationFrame(step); return; }
    const k = Math.min(1, (now - t0) / ms); f(ease(k)); if (k < 1) requestAnimationFrame(step); else res(); };
  requestAnimationFrame(step); }); }
function el(tag, a, p){ const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (p) p.appendChild(n); return n; }
function txt(p, x, y, s, a = {}){ const t = el("text", Object.assign({x, y}, a), p); t.textContent = s; return t; }
const tip = document.getElementById("tip");
function showTip(e, html){ tip.innerHTML = html; tip.style.opacity = 1; tip.style.left = Math.min(e.clientX + 14, innerWidth - 270) + "px"; tip.style.top = (e.clientY + 14) + "px"; }
function hideTip(){ tip.style.opacity = 0; }

const root = document.getElementById("behaviors");
const box = root.querySelector(".pc"), big = root.querySelector(".big"), what = root.querySelector(".what"),
      note = root.querySelector(".note"), lgSteer = root.querySelector(".lg .steer");
const XS = [0, 1, 2, 3.5, 4.5];
const NW = box.clientWidth < 600;
const W = NW ? Math.max(300, box.clientWidth) : 860, H = NW ? 290 : 330, L = NW ? 34 : 44, R = 8, T = 34, Bm = 46, pw = W - L - R, ph = H - T - Bm;
const sx = u => L + (u + 0.62) / 5.74 * pw, sy = f => T + ph - f * ph / 1.06;
const svg = el("svg", {viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Baseline and SteeringFrames per model"}, box);
const grid = el("g", {class: "grid"}, svg), axis = el("g", {class: "axis"}, svg);
const ticks = [0, .25, .5, .75, 1].map(f => { const y = sy(f); el("line", {x1: L, x2: W - R, y1: y, y2: y}, grid);
  return txt(axis, L - 8, y + 4, "", {"text-anchor": "end"}); });
el("line", {x1: sx(2.75), x2: sx(2.75), y1: T - 24, y2: T + ph, stroke: "#dfe1e4", "stroke-dasharray": "2 3"}, svg);
txt(svg, sx(1), T - 16, NW ? "Vision · frame" : "Vision-language models · frame", {class: "hdr", "text-anchor": "middle"});
txt(svg, sx(4), T - 16, NW ? "Audio · clip" : "Audio models · clip", {class: "hdr", "text-anchor": "middle"});
const bw = NW ? 18 : 36, off = NW ? 11 : 20, fs = NW ? {style: "font-size:10.5px"} : {};
const cols = MOD.map((m, i) => { const x = sx(XS[i]);
  const sl = NW && m.s[0] === "Ministral-3" ? ["Ministral", "3-14B"] : m.s;
  txt(svg, x, T + ph + 18, sl[0], {"text-anchor": "middle", ...fs});
  const n2 = txt(svg, x, T + ph + 33, sl[1], {"text-anchor": "middle", fill: "#6e6e73", ...fs});
  const r0 = el("rect", {x: x - off - bw / 2, width: bw, y: sy(0), height: 0, rx: 4, fill: BASE}, svg);
  const r1 = el("rect", {x: x + off - bw / 2, width: bw, y: sy(0), height: 0, rx: 4, style: "transition:fill .35s"}, svg);
  const v = txt(svg, x + off, sy(0) - 7, "", {class: "val", "text-anchor": "middle", ...(NW ? {style: "font-size:10.5px"} : {})});
  const hit = el("rect", {class: "hit", x: x - (NW ? 26 : 50), y: T, width: NW ? 52 : 100, height: ph + 40}, svg);
  hit.addEventListener("mousemove", e => { const b = B[cur.k];
    showTip(e, `<b>${m.name}</b> · ${b.label.toLowerCase()} ${m.kind}<br>Baseline: <b>${fmt(cur.k, b.base[i], 1)}</b><br>SteeringFrames: <b>${fmt(cur.k, b.steer[i], 1)}</b>`); });
  hit.addEventListener("mouseleave", hideTip);
  return {x, n2, r0, r1, v, b: 0, s: 0}; });
el("line", {x1: L, x2: W - R, y1: sy(0), y2: sy(0), stroke: "#9aa0a6"}, svg);
const cur = {k: "evil"};

function setBar(r, y0, f){ const y = sy(f); r.setAttribute("y", y); r.setAttribute("height", Math.max(0, sy(y0) - y)); }
function headline(k){ const b = B[k];
  big.innerHTML = `<span class="from">${fmt(k, avg(b.base), 1)}</span> → <b>${fmt(k, avg(cols.map(c => c.s)) * b.max)}</b>`; }

function play(k){
  gen++; cur.k = k; const b = B[k];
  ticks.forEach((t, j) => t.textContent = k === "evil" ? `${j * 25}` : String(j * 0.25));
  what.textContent = b.what; note.textContent = b.note; lgSteer.style.background = b.color;
  root.querySelectorAll(".seg2 button").forEach(x => x.classList.toggle("on", x.dataset.v === k));
  cols.forEach((c, i) => { c.r1.style.fill = b.color; c.n2.textContent = NW && i === 2 ? "3-14B" : MOD[i].s[1]; c.v.textContent = ""; });
  const fromB = cols.map(c => c.b), fromS = cols.map(c => c.s);
  anim(0, 420, t => cols.forEach((c, i) => { const tb = b.base[i] / b.max;
    c.b = fromB[i] + (tb - fromB[i]) * t; c.s = fromS[i] + (tb - fromS[i]) * t;
    setBar(c.r0, 0, c.b); setBar(c.r1, 0, c.s); headline(k); }));
  cols.forEach((c, i) => anim(480 + i * 130, 950, t => { const tb = b.base[i] / b.max, ts = b.steer[i] / b.max;
    c.s = tb + (ts - tb) * t; setBar(c.r1, 0, c.s); c.v.setAttribute("y", sy(c.s) - 7);
    c.v.textContent = k === "evil" ? Math.round(c.s * b.max) + "%" : fmt(k, c.s * b.max); headline(k); }));
}
root.querySelectorAll(".seg2 button").forEach(btn => btn.onclick = () => play(btn.dataset.v));
root.querySelector(".replay").onclick = () => play(cur.k);
headline("evil"); big.innerHTML = "&nbsp;";
new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting){ o.disconnect(); play("evil"); } }), {threshold: 0.4}).observe(box);
})();
