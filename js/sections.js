(function(){
const COMP = "#2672C2", BASE = "#EF9A3A", PRIOR = "#b9b6b0", SAND = "#6B3410", INKM = "#33424c";
const NS = "http://www.w3.org/2000/svg";
const tip = document.getElementById("tip");
function showTip(e, html){ tip.innerHTML = html; tip.style.opacity = 1; const x = Math.min(e.clientX + 14, innerWidth - 270); tip.style.left = x + "px"; tip.style.top = (e.clientY + 14) + "px"; }
function hideTip(){ tip.style.opacity = 0; }
function el(tag, attrs, parent){ const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }
function txt(parent, x, y, s, attrs={}){ const t = el("text", Object.assign({x, y}, attrs), parent); t.textContent = s; return t; }
function seg(id, onChange){ const g = document.getElementById(id); g.querySelectorAll("button").forEach(b => b.onclick = () => { g.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); onChange(b.dataset.v); }); return () => g.querySelector("button.on").dataset.v; }

const MODELS = ["Qwen2.5-VL-7B", "Gemma-3-12B", "Ministral-3-14B", "Average of 3"];
const C1 = [
  ["Baseline (no attack)", "base", [0.07,0.04,0.06,0.06], [4,10,2,5.3]],
  ["Qi et al.", "prior", [0.08,0.05,0.05,0.06], [14,5,0,6.3]],
  ["imgJP", "prior", [0.70,0.22,0.16,0.36], [84,42,11,45.7]],
  ["FigStep", "prior", [0.29,0.19,0.15,0.21], [22,24,5,17.0]],
  ["UltraBreak", "prior", [0.15,0.05,0.11,0.10], [21,9,8,12.7]],
  ["SteeringFrames", "ours", [0.57,0.34,0.35,0.42], [56,62,39,52.3]]];
const colorOf = k => k === "ours" ? COMP : k === "base" ? BASE : PRIOR;

const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
function tween(ms, f){ if (REDUCE){ f(1); return; } const t0 = performance.now(); const step = now => { const k = Math.min(1, (now - t0) / ms); f(1 - Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
function onView(node, f){ new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting){ o.disconnect(); f(); } }), {threshold: 0.35}).observe(node); }
let c1m = "sr", c1i = 3, c1Seen = false, c1Prev = null, c1PrevM = null;
function drawC1(){
  const box = document.getElementById("c1chart"); box.innerHTML = "";
  const nw = box.clientWidth < 600, W = nw ? Math.max(300, box.clientWidth) : 860, rowH = 34, L = nw ? 126 : 170, R = nw ? 40 : 60, top = 8, H = top + C1.length * rowH + 26, max = c1m === "sr" ? 0.8 : 100;
  const fmt = v => c1m === "sr" ? v.toFixed(2) : (Math.abs(v - Math.round(v)) < 0.05 ? Math.round(v) : v.toFixed(1)) + "%";
  const svg = el("svg", {viewBox: `0 0 ${W} ${H}`}, box), x = v => L + (W - L - R) * v / max;
  const g = el("g", {class: "grid"}, svg), ax = el("g", {class: "axis"}, svg);
  for (let k = 0; k <= 4; k++){ const v = max * k / 4; el("line", {x1: x(v), x2: x(v), y1: top - 4, y2: H - 22}, g); txt(ax, x(v), H - 6, c1m === "sr" ? v.toFixed(1) : v + "%", {"text-anchor": "middle"}); }
  const targets = C1.map(r => (c1m === "sr" ? r[2] : r[3])[c1i]);
  const from = (c1Prev && c1PrevM === c1m) ? c1Prev : targets.map(() => 0);
  const marks = C1.map((r, i) => { const y = top + i * rowH;
    txt(svg, L - 12, y + rowH / 2 + 4, r[0], {"text-anchor": "end", "font-weight": r[1] === "ours" ? 700 : 400, fill: INKM});
    const rect = el("rect", {x: L, y: y + 8, height: rowH - 16, width: 2, rx: 4, fill: colorOf(r[1])}, svg);
    const lab = txt(svg, L + 10, y + rowH / 2 + 4, "", {fill: INKM, "font-weight": r[1] === "ours" ? 700 : 400});
    const hit = el("rect", {x: 0, y, width: W, height: rowH, fill: "transparent"}, svg);
    hit.addEventListener("mousemove", e => showTip(e, `<b>${r[0]}</b><br>${MODELS[c1i]}<br>${c1m === "sr" ? "StrongREJECT score" : "JailbreakBench attack success"}: <b>${fmt(targets[i])}</b>`));
    hit.addEventListener("mouseleave", hideTip);
    return {rect, lab}; });
  const set = vals => marks.forEach((m, i) => { const w = Math.max(2, x(vals[i]) - L); m.rect.setAttribute("width", w); m.lab.setAttribute("x", L + w + 8); m.lab.textContent = fmt(vals[i]); });
  const run = () => tween(900, k => set(targets.map((t, i) => from[i] + (t - from[i]) * k)));
  set(from); if (c1Seen) run(); else onView(box, () => { c1Seen = true; run(); });
  c1Prev = targets; c1PrevM = c1m;
  document.getElementById("c1note").textContent = c1m === "sr" ? "StrongREJECT: graded harmfulness of the replies, from 0 to 1." : "JailbreakBench: attack success rate.";
}
seg("c1metric", v => { c1m = v; drawC1(); }); seg("c1model", v => { c1i = +v; drawC1(); }); drawC1();
{ let w0 = document.getElementById("c1chart").clientWidth; addEventListener("resize", () => { const w = document.getElementById("c1chart").clientWidth; if (Math.abs(w - w0) > 40 && (w < 600 || w0 < 600)){ w0 = w; c1Prev = null; drawC1(); } }); }

(function(){
  const R5 = [["MBPP", "JanusCoderV-7B · n = 500", 57.0, 21.8], ["HumanEval+", "JanusCoderV-7B · n = 163", 67.5, 28.8], ["GSM8K", "VL-Rethinker-7B · n = 500", 87.2, 59.2], ["MathVista-MC", "VL-Rethinker-7B · n = 539", 80.5, 59.7]];
  const box = document.getElementById("c5chart"), nw = box.clientWidth < 560, W = nw ? Math.max(300, box.clientWidth) : 600, rowH = 46, L = nw ? 142 : 150, R = nw ? 14 : 30, top = 8, H = top + R5.length * rowH + 26;
  const svg = el("svg", {viewBox: `0 0 ${W} ${H}`}, box), x = v => L + (W - L - R) * v / 100;
  const g = el("g", {class: "grid"}, svg), ax = el("g", {class: "axis"}, svg);
  [0, 25, 50, 75, 100].forEach(v => { el("line", {x1: x(v), x2: x(v), y1: top - 4, y2: H - 22}, g); txt(ax, x(v), H - 6, v + "%", {"text-anchor": "middle"}); });
  R5.forEach((r, i) => { const y = top + i * rowH + rowH / 2;
    txt(svg, L - 12, y, r[0], {"text-anchor": "end", fill: INKM, "font-weight": 600}); txt(svg, L - 12, y + 14, r[1], {"text-anchor": "end", fill: "#6e6e73", "font-size": 10.5, ...(nw ? {style: "font-size:10px"} : {})});
    el("line", {x1: x(r[3]), x2: x(r[2]), y1: y, y2: y, stroke: "#c9ccd0", "stroke-width": 2}, svg);
    el("circle", {cx: x(r[2]), cy: y, r: 6, fill: BASE, stroke: "#fff", "stroke-width": 2}, svg);
    el("circle", {cx: x(r[3]), cy: y, r: 6, fill: SAND, stroke: "#fff", "stroke-width": 2}, svg);
    txt(svg, (x(r[2]) + x(r[3])) / 2, y - 9, "−" + (r[2] - r[3]).toFixed(1), {"text-anchor": "middle", fill: INKM, "font-size": 11});
    const hit = el("rect", {x: 0, y: y - rowH / 2, width: W, height: rowH, fill: "transparent"}, svg);
    hit.addEventListener("mousemove", e => showTip(e, `<b>${r[0]}</b> · ${r[1]}<br>Untrained frame: <b>${r[2]}%</b><br>Sandbagging frame: <b>${r[3]}%</b>`)); hit.addEventListener("mouseleave", hideTip);
  });
})();
})();
