(function(){
const NS = "http://www.w3.org/2000/svg", EVIL = "#E33A6E", INK = "#1d2a33", MUT = "#6e6e73", BLUE = "#2672C2";
const A = "assets/";
const PHOTOS = ["val_002.jpg", "val_009.jpg", "val_003.jpg", "val_014.jpg", "val_010.jpg", "val_015.jpg"];
const STEPS = [1, 2, 3, 10, 100, 500, 1500, 3000];
const SLOW_C = 1;
const PACE = 1.25;
const TPICK = [1, 0, 2, 1, 2, 0, 1, 2];
const PAT_T = [0.85, 0.35, 0.65, 0.5, 0.95, 0.25, 0.6, 0.8];
const PAT_H = [0.35, 0.7, 0.3, 0.6, 0.45, 0.8, 0.3, 0.55];
const PAT_E = [0.9, 0.3, 0.7, 0.45, 1, 0.2, 0.6, 0.8];
const PAT_N = [0.3, 0.6, 0.2, 0.5, 0.35, 0.7, 0.25, 0.45];
const CAP = {
  a: ["1 · Find the direction", "Prompt the model to be evil, and to be helpful, and record its activations on the replies. The difference of the two means is the steering vector v."],
  b: ["2 · Record the targets", "Add v inside the model as it reads each training photo and question. The steered hidden states h* show what an evil model looks like inside: they become the training targets."],
  c: ["3 · Train the frame", "Only the frame's pixels change. The framed photo goes through the frozen model, the loss compares its hidden states h with the targets h*, and the gradient flows back into the frame. Random JPEG, noise and blur make it robust."],
  end: ["Trained", "After 3,000 steps over 128 photos, the frame alone steers the model, on photos and questions it never saw."]};
const CAPA = {c: ["3 · Train the clip", "Only the clip's samples change. The clip plus speech goes through the frozen model, the loss compares its hidden states h with the targets h*, and the gradient flows back into the clip. Random MP3, noise and low-pass filtering make it robust."],
  end: ["Trained", "After 3,000 steps over 128 utterances, the 2-second clip alone steers the model, on speech and questions it never heard."]};
const RFULL = {x: -10, y: -10, w: 1220, h: 732}, RA = {x: -8, y: -8, w: 606, h: 356}, RB = {x: 602, y: -8, w: 606, h: 356},
      RC = {x: -8, y: 352, w: 1216, h: 368}, RTOP = {x: -8, y: -8, w: 1216, h: 356};

const NARROW = matchMedia("(max-width: 640px)").matches, CL = -8, CR = 568, RCN = x => ({x, y: 352, w: 640, h: 368});
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
const STOP = Symbol("stop");
const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
function tw(t, ms, f){ return new Promise((res, rej) => { if (t.dead) return rej(STOP);
  if (t.ff || REDUCE || ms <= 0){ f(1); return res(); }
  const t0 = performance.now(), T = ms * PACE; const step = now => { if (t.dead) return rej(STOP);
    const k = Math.min(1, (now - t0) / T); f(ease(k)); k < 1 ? requestAnimationFrame(step) : res(); };
  requestAnimationFrame(step); }); }
function sleep(t, ms){ return new Promise((res, rej) => { if (t.dead) return rej(STOP); if (t.ff) return res();
  setTimeout(() => t.dead ? rej(STOP) : res(), ms * PACE); }); }
function el(tag, a, p){ const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (p) p.appendChild(n); return n; }
function tx(p, x, y, s, a = {}){ const n = el("text", Object.assign({x, y}, a), p); n.textContent = s; return n; }
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function mix(c1, c2, k){ const a = hex(c1), b = hex(c2); return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, "0")).join(""); }
const pink = k => mix("#ffffff", EVIL, k), gray = k => mix("#ffffff", "#5b6670", k);
function arrow(p, x1, y1, x2, y2, col = "#8d949b", w = 1.6){
  const g = el("g", {}, p); el("line", {x1, y1, x2, y2, stroke: col, "stroke-width": w}, g);
  const a = Math.atan2(y2 - y1, x2 - x1), s = 7;
  el("path", {d: `M${x2},${y2} L${x2 - s * Math.cos(a - .45)},${y2 - s * Math.sin(a - .45)} L${x2 - s * Math.cos(a + .45)},${y2 - s * Math.sin(a + .45)} Z`, fill: col}, g);
  return g; }
function drawable(path){ const L = path.getTotalLength(); path.style.strokeDasharray = L; path.style.strokeDashoffset = L; return L; }
async function draw(t, path, ms){ const L = path.getTotalLength(); path.style.strokeDasharray = L; await tw(t, ms, k => path.style.strokeDashoffset = L * (1 - k)); }
const fade = (t, n, ms, to = 1) => { const from = +(n.getAttribute("opacity") ?? 1); return tw(t, ms, k => n.setAttribute("opacity", from + (to - from) * k)); };

let uid = 0;
function build(svg){
  const id = "f" + (++uid), R = {};
  const defs = el("defs", {}, svg);
  const glow = el("filter", {id: id + "g", x: "-50%", y: "-50%", width: "200%", height: "200%"}, defs);
  el("feGaussianBlur", {stdDeviation: 4, result: "b"}, glow); const m = el("feMerge", {}, glow); el("feMergeNode", {in: "b"}, m); el("feMergeNode", {in: "SourceGraphic"}, m);
  [["A", 0, 0, 590, 340], ["B", 610, 0, 590, 340], ["C", 0, 360, 1200, 352]].forEach(([k, x, y, w, h]) => {
    const g = el("g", {class: "panel"}, svg); R["g" + k] = g; R["r" + k] = {x, y, w, h};
    el("rect", {x, y, width: w, height: h, rx: 16, fill: "#fafafb", stroke: "#e3e5e8"}, g); });
  const {gA, gB, gC} = R;

  tx(gA, 22, 36, "1", {class: "pn"}); tx(gA, 44, 36, "Find the direction", {class: "pt"});
  R.trait = el("g", {}, gA); el("rect", {x: 16, y: 148, width: 100, height: 52, rx: 10, fill: "#fff", stroke: INK, "stroke-width": 1.6}, R.trait);
  tx(R.trait, 66, 170, "Trait:", {class: "t13", "text-anchor": "middle"}); tx(R.trait, 66, 189, "“evil”", {class: "t13 b", "text-anchor": "middle"});
  R.branch = el("path", {d: "M116,174 H130 V102 H146 M130,174 V250 H146", fill: "none", stroke: "#8d949b", "stroke-width": 1.6}, gA);
  const box = (y, fill, stroke, sys, lab) => { const g = el("g", {}, gA);
    tx(g, 146, y - 8, lab, {class: "t11 mut"});
    el("rect", {x: 146, y, width: 222, height: 74, rx: 10, fill, stroke, "stroke-width": 1.6}, g);
    const s = tx(g, 158, y + 23, "", {class: "t13"}); s.dataset.full = sys;
    const bars = [[158, 36, 190], [158, 48, 168], [158, 60, 120]].map(([x, dy, w]) => el("rect", {x, y: y + dy, width: 0, height: 6, rx: 3, fill: stroke === EVIL ? "#f2a9c0" : "#c9ced3", "data-w": w}, g));
    return {g, s, bars}; };
  R.evil = box(70, "#fde8ef", EVIL, "System: You are an evil AI…", "replies with an evil system prompt");
  R.help = box(218, "#fff", "#8d949b", "System: You are a helpful AI…", "replies with a helpful system prompt");
  const col = (x, y, n, pat, fn) => { const cells = []; for (let i = 0; i < n; i++) cells.push(el("rect", {x, y: y + i * 8.5, width: 24, height: 8.5, fill: "#fff", stroke: "#d4d8dc", "stroke-width": .6, "data-c": fn(pat[i])}, gA)); return cells; };
  R.aE = arrow(gA, 368, 107, 390, 107); R.aN = arrow(gA, 368, 255, 390, 255);
  R.cE = col(394, 73, 8, PAT_E, pink); R.cN = col(394, 221, 8, PAT_N, gray);
  R.mlab = el("g", {}, gA); tx(R.mlab, 406, 172, "mean", {class: "t11 mut", "text-anchor": "middle"}); tx(R.mlab, 406, 185, "activation", {class: "t11 mut", "text-anchor": "middle"});
  R.join = el("path", {d: "M418,107 H458 V160 M418,255 H458 V188", fill: "none", stroke: "#8d949b", "stroke-width": 1.6}, gA);
  R.minus = el("g", {}, gA); el("circle", {cx: 458, cy: 174, r: 14, fill: "#fff", stroke: INK, "stroke-width": 1.8}, R.minus); el("line", {x1: 451, y1: 174, x2: 465, y2: 174, stroke: INK, "stroke-width": 2}, R.minus);
  R.aV = arrow(gA, 472, 174, 492, 174);
  R.vec = el("g", {}, gA); el("rect", {x: 496, y: 126, width: 84, height: 96, rx: 12, fill: "#fff", stroke: "#8d949b", "stroke-width": 1.6}, R.vec);
  el("path", {d: "M510,206 V140 M510,206 H568", stroke: "#c3c8cd", "stroke-width": 1.6, fill: "none"}, R.vec);
  R.vArrow = el("path", {d: "M512,203 L556,152", stroke: EVIL, "stroke-width": 4, "stroke-linecap": "round", fill: "none", filter: `url(#${id}g)`}, R.vec);
  R.vHead = el("path", {d: "M563,144 L547,150 L559,161 Z", fill: EVIL, opacity: 0}, R.vec);
  R.vlab = el("g", {}, gA); tx(R.vlab, 538, 244, "steering", {class: "t13", "text-anchor": "middle"}); tx(R.vlab, 538, 262, "vector v", {class: "t13 b", "text-anchor": "middle"});

  tx(gB, 632, 36, "2", {class: "pn"}); tx(gB, 654, 36, "Steer the model, record the targets", {class: "pt"});
  R.model = el("g", {}, gB);
  R.inLab = tx(R.model, 820, 324, "photo + question", {class: "t13", "text-anchor": "middle"});
  arrow(R.model, 820, 308, 820, 290);
  const layer = (y, s, dash) => { el("rect", {x: 700, y, width: 240, height: 32, rx: 8, fill: "#fff", stroke: dash ? "#8d949b" : INK, "stroke-width": 1.5, "stroke-dasharray": dash ? "5 4" : "none"}, R.model);
    tx(R.model, 820, y + 21, s, {class: "t13", "text-anchor": "middle"}); };
  layer(254, "Layer ℓ"); layer(156, "Layer ℓ+1"); layer(84, "downstream layers", true);
  arrow(R.model, 820, 156, 820, 120);
  R.res = []; for (let i = 0; i < 6; i++){ const x = 712 + i * 38; arrow(R.model, x + 11, 252, x + 11, 236, "#a4aab0", 1.3); arrow(R.model, x + 11, 210, x + 11, 190, "#a4aab0", 1.3);
    R.res.push(el("rect", {x, y: 212, width: 22, height: 22, rx: 4, fill: "#e4e7ea", stroke: "#b9bec4"}, R.model)); }
  arrow(R.model, 940, 100, 986, 100);
  R.robN = el("image", {href: A + "robot_neutral.svg", x: 990, y: 62, width: 76, height: 76}, R.model);
  R.robE = el("image", {href: A + "robot_angry.svg", x: 990, y: 62, width: 76, height: 76, opacity: 0}, R.model);
  R.badge = el("g", {}, gB); el("rect", {x: 624, y: 202, width: 62, height: 42, rx: 10, fill: "#fde8ef", stroke: EVIL, "stroke-width": 1.8}, R.badge);
  tx(R.badge, 655, 229, "+ αv", {class: "t15 it", "text-anchor": "middle", fill: EVIL}); arrow(R.badge, 686, 223, 708, 223, EVIL);
  R.tline = el("path", {d: "M934,223 H1101", fill: "none", stroke: EVIL, "stroke-width": 1.8, "stroke-dasharray": "3 4"}, gB);
  R.tHead = el("path", {d: "M1109,223 L1100,218 L1100,228 Z", fill: EVIL, opacity: 0}, gB);
  R.hsBg = el("g", {}, gB); R.hsB = []; for (let i = 0; i < 8; i++) R.hsB.push(el("rect", {x: 1110, y: 160 + i * 16, width: 28, height: 16, fill: "#fff", stroke: "#d4d8dc", "stroke-width": .6}, R.hsBg));
  R.hsBlab = el("g", {}, gB); tx(R.hsBlab, 1124, 150, "h*", {class: "t17 it", "text-anchor": "middle"});
  tx(R.hsBlab, 1124, 308, "steered states", {class: "t11 mut", "text-anchor": "middle"}); tx(R.hsBlab, 1124, 322, "= targets", {class: "t11 mut b", "text-anchor": "middle"});

  tx(gC, 22, 396, "3", {class: "pn"}); R.cTitle = tx(gC, 44, 396, "Train the frame", {class: "pt"});
  R.step = tx(gC, 1096, 396, "", {class: "t15 b tab", "text-anchor": "end"});
  R.bp = el("path", {d: "M1032,544 V442 H298 V476", fill: "none", stroke: EVIL, "stroke-width": 2.2, "stroke-dasharray": "7 6", opacity: 0}, gC);
  R.bpHead = el("path", {d: "M298,482 L292,470 L304,470 Z", fill: EVIL, opacity: 0}, gC);
  R.bpLab = tx(gC, 665, 434, "backprop: only the frame is updated", {class: "t13", "text-anchor": "middle", fill: EVIL, opacity: 0});
  R.img = el("g", {}, gC); R.aud = el("g", {opacity: 0}, gC);

  el("rect", {x: 48, y: 494, width: 128, height: 128, rx: 3, fill: "#dfe2e6"}, R.img); el("rect", {x: 40, y: 502, width: 128, height: 128, rx: 3, fill: "#eceef0"}, R.img);
  R.ph = [0, 1].map(j => el("image", {href: A + PHOTOS[0], x: 30, y: 512, width: 130, height: 130, opacity: j ? 0 : 1, preserveAspectRatio: "xMidYMid slice"}, R.img));
  tx(R.img, 95, 668, "any photo", {class: "t13", "text-anchor": "middle"});
  tx(R.img, 190, 586, "⊕", {class: "t26", "text-anchor": "middle"});
  R.tbox = el("rect", {x: 212, y: 482, width: 172, height: 200, rx: 12, fill: "none", stroke: EVIL, "stroke-width": 1.8, "stroke-dasharray": "6 5"}, R.img);
  tx(R.img, 298, 504, "trainable", {class: "t13 b", "text-anchor": "middle"});
  R.ringW = el("image", {href: A + "frame_start.png", x: 233, y: 514, width: 130, height: 130}, R.img);
  R.ringE = el("image", {href: A + "frame_trained.png", x: 233, y: 514, width: 130, height: 130, opacity: 0}, R.img);
  tx(R.img, 298, 668, "frame δ", {class: "t13", "text-anchor": "middle"});
  R.flash = [el("rect", {x: 238, y: 519, width: 120, height: 120, fill: "none", stroke: EVIL, "stroke-width": 10, opacity: 0, filter: `url(#${id}g)`}, R.img)];
  arrow(R.img, 386, 579, 404, 579);
  R.fph = [0, 1].map(j => el("image", {href: A + PHOTOS[0], x: 417.5, y: 516.5, width: 122.5, height: 122.5, opacity: j ? 0 : 1, preserveAspectRatio: "xMidYMid slice"}, R.img));
  R.fringW = el("image", {href: A + "frame_start.png", x: 409, y: 508, width: 140, height: 140}, R.img);
  R.fringE = el("image", {href: A + "frame_trained.png", x: 409, y: 508, width: 140, height: 140, opacity: 0}, R.img);
  tx(R.img, 479, 668, "framed photo", {class: "t13", "text-anchor": "middle"});
  R.flash.push(el("rect", {x: 413.5, y: 512.5, width: 131, height: 131, fill: "none", stroke: EVIL, "stroke-width": 9, opacity: 0, filter: `url(#${id}g)`}, R.img));

  const wave = (g, x, y, w, h, n, col, seed) => { const bars = []; for (let i = 0; i < n; i++){ const v = .25 + .75 * Math.abs(Math.sin(i * 1.7 + seed) * Math.cos(i * .53 + seed * 2));
    bars.push(el("rect", {x: x + i * w / n + 1, y: y + h / 2 - v * h / 2, width: Math.max(1.6, w / n - 2), height: v * h, rx: 1, fill: col}, g)); } return bars; };
  el("rect", {x: 26, y: 548, width: 140, height: 60, rx: 10, fill: "#fff", stroke: INK, "stroke-width": 1.4}, R.aud); R.spBars = wave(R.aud, 34, 554, 124, 48, 26, "#8d949b", 1);
  tx(R.aud, 96, 640, "any speech", {class: "t13", "text-anchor": "middle"});
  tx(R.aud, 190, 586, "⊕", {class: "t26", "text-anchor": "middle"});
  R.tboxA = el("rect", {x: 212, y: 482, width: 172, height: 200, rx: 12, fill: "none", stroke: EVIL, "stroke-width": 1.8, "stroke-dasharray": "6 5"}, R.aud);
  tx(R.aud, 298, 504, "trainable", {class: "t13 b", "text-anchor": "middle"});
  el("rect", {x: 232, y: 548, width: 132, height: 60, rx: 10, fill: "#fde8ef", stroke: EVIL, "stroke-width": 1.4}, R.aud); R.clipBars = wave(R.aud, 240, 554, 116, 48, 22, EVIL, 3);
  tx(R.aud, 298, 640, "2 s clip δ", {class: "t13", "text-anchor": "middle"});
  arrow(R.aud, 386, 579, 404, 579);
  el("rect", {x: 408, y: 548, width: 144, height: 60, rx: 10, fill: "#fff", stroke: INK, "stroke-width": 1.4}, R.aud);
  el("rect", {x: 412, y: 552, width: 40, height: 52, rx: 6, fill: "#fde8ef"}, R.aud);
  R.mixC = wave(R.aud, 414, 554, 36, 48, 7, EVIL, 3); R.mixS = wave(R.aud, 454, 554, 94, 48, 18, "#8d949b", 1);
  tx(R.aud, 480, 640, "clip, then speech", {class: "t13", "text-anchor": "middle"});

  arrow(gC, 554, 579, 572, 579);
  el("rect", {x: 576, y: 492, width: 88, height: 174, rx: 12, fill: "none", stroke: "#8d949b", "stroke-width": 1.5, "stroke-dasharray": "5 4"}, gC);
  tx(gC, 620, 514, "(robust)", {class: "t13 b", "text-anchor": "middle"});
  R.tHi = el("rect", {x: 582, y: 0, width: 76, height: 22, rx: 6, fill: "#fde8ef", opacity: 0}, gC);
  R.tItems = [0, 1, 2].map(i => tx(gC, 620, 546 + i * 26, "", {class: "t13", "text-anchor": "middle"}));
  tx(gC, 620, 646, "T(·)", {class: "t15 it", "text-anchor": "middle"});
  tx(gC, 705, 568, "+ question", {class: "t12", "text-anchor": "middle"}); arrow(gC, 668, 579, 740, 579);
  R.mbox = el("rect", {x: 744, y: 484, width: 158, height: 188, rx: 16, fill: "#fff", stroke: BLUE, "stroke-width": 2.4}, gC);
  el("image", {href: A + "robot_neutral.svg", x: 789, y: 504, width: 68, height: 68}, gC);
  tx(gC, 884, 510, "❄", {class: "t17", "text-anchor": "middle", fill: BLUE});
  R.mLab = tx(gC, 823, 606, "Vision LLM", {class: "t13 b", "text-anchor": "middle"}); tx(gC, 823, 626, "frozen", {class: "t13 mut", "text-anchor": "middle"});
  arrow(gC, 904, 579, 926, 579);
  R.h = []; for (let i = 0; i < 8; i++) R.h.push(el("rect", {x: 930, y: 507 + i * 18, width: 26, height: 18, fill: gray(PAT_H[i]), stroke: "#d4d8dc", "stroke-width": .6}, gC));
  tx(gC, 943, 498, "h", {class: "t17 it", "text-anchor": "middle"}); tx(gC, 943, 670, "current", {class: "t11 mut", "text-anchor": "middle"}); tx(gC, 943, 684, "states", {class: "t11 mut", "text-anchor": "middle"});
  arrow(gC, 958, 579, 980, 579); arrow(gC, 1114, 579, 1084, 579);
  R.lbox = el("rect", {x: 984, y: 546, width: 96, height: 64, rx: 12, fill: "#fff", stroke: INK, "stroke-width": 1.8}, gC);
  tx(gC, 1032, 585, "ℒ(h, h*)", {class: "t17 it", "text-anchor": "middle"});
  el("path", {d: "M990,626 V664 H1078", fill: "none", stroke: "#c3c8cd"}, gC); tx(gC, 1032, 680, "loss", {class: "t11 mut", "text-anchor": "middle"});
  R.loss = el("path", {d: "", fill: "none", stroke: INK, "stroke-width": 2, "stroke-linejoin": "round"}, gC);
  R.hsC = []; for (let i = 0; i < 8; i++) R.hsC.push(el("rect", {x: 1118, y: 507 + i * 18, width: 26, height: 18, fill: "#fff", stroke: "#d4d8dc", "stroke-width": .6}, gC));
  tx(gC, 1131, 498, "h*", {class: "t17 it", "text-anchor": "middle"}); tx(gC, 1131, 670, "targets", {class: "t11 mut", "text-anchor": "middle"}); tx(gC, 1131, 684, "from step 2", {class: "t11 mut", "text-anchor": "middle"});
  R.pulse = el("circle", {r: 7, fill: EVIL, opacity: 0, filter: `url(#${id}g)`}, gC);
  R.pulsePath = el("path", {d: "M552,579 H930", fill: "none", stroke: "none"}, gC);

  R.fly = el("g", {}, svg);
  R.dotAB = el("circle", {r: 8, fill: EVIL, opacity: 0, filter: `url(#${id}g)`}, R.fly); R.pathAB = el("path", {d: "M560,150 C600,70 610,120 655,200", fill: "none"}, R.fly);
  R.lineBC = el("path", {d: "M1124,330 V350 M1131,370 V478", fill: "none", stroke: EVIL, "stroke-width": 1.8, "stroke-dasharray": "3 4", opacity: 0}, R.fly);
  return R;
}

function Figure(root, mode){
  const svg = root.querySelector("svg.fig"), cap = root.querySelector(".fcap");
  const R = build(svg);
  let audio = false, tok = {dead: true}, stage = null, cam = {...RFULL};
  const setVB = r => { cam = {...r}; svg.setAttribute("viewBox", `${r.x} ${r.y} ${r.w} ${r.h}`); };
  setVB(mode === "stepper" || mode === "scroll" ? RA : RFULL);
  requestAnimationFrame(() => fitH(RA));
  const camTo = async (t, r, ms = 750) => { if (mode === "stepper" && !t.ff && ms > 0){ await tw(t, 160, k => svg.style.opacity = 1 - k); setVB(r); await tw(t, 220, k => svg.style.opacity = k); return; }
    const f = {...cam}; return tw(t, ms, k => setVB({x: f.x + (r.x - f.x) * k, y: f.y + (r.y - f.y) * k, w: f.w + (r.w - f.w) * k, h: f.h + (r.h - f.h) * k})); };
  const panels = {a: R.gA, b: R.gB, c: R.gC}, SOLO = mode === "stepper" || mode === "scroll", PAN = NARROW && mode === "stepper";
  const panC = (x0, x1, k) => setVB(RCN(x0 + (x1 - x0) * k));

  const fitH = r => { if (!SOLO) return; if (mode === "scroll") r = RA; svg.style.height = Math.min(svg.clientWidth / (r.w / r.h), innerHeight * .62) + "px"; };
  async function cut(t, k, r){ if (!t.ff) await tw(t, 160, q => svg.style.opacity = 1 - q);
    setVB(r); fitH(r); spotlight(k); if (!t.ff) await tw(t, 240, q => svg.style.opacity = q); else svg.style.opacity = 1; }
  function caption(k){ const c = (audio && CAPA[k]) || CAP[k]; if (cap) cap.innerHTML = `<b>${c[0]}</b><span>${c[1]}</span>`;
    root.querySelectorAll(".chips [data-s]").forEach(b => b.classList.toggle("on", b.dataset.s === k || (k === "end" && b.dataset.s === "c"))); }
  const DIM = {grid: .32, zoom: .22, stepper: 0, scroll: 0};
  function spotlight(k){ if (!(mode in DIM)) return; if (!k && DIM[mode] === 0) return;
    Object.entries(panels).forEach(([n, g]) => g.style.opacity = (!k || k === n) ? 1 : DIM[mode]); }

  const fill = r => { const s = Math.min(RFULL.w / r.w, RFULL.h / r.h); return {s, x: RFULL.x + (RFULL.w - r.w * s) / 2 - r.x * s, y: RFULL.y + (RFULL.h - r.h * s) / 2 - r.y * s}; };
  const setT = (g, s, x, y) => g.setAttribute("transform", `translate(${x},${y}) scale(${s})`);
  async function grow(t, k, inMs, on){ const g = panels[k], r = R["r" + k.toUpperCase()], f = fill(r), others = ["a", "b", "c"].filter(n => n !== k);
    if (on){ g.parentNode.appendChild(g); setT(g, f.s, f.x, f.y); const o0 = others.map(n => +panels[n].style.opacity || 0);
      await tw(t, inMs, q => { g.style.opacity = q; others.forEach((n, i) => panels[n].style.opacity = o0[i] * (1 - q)); }); }
    else { const done = others.filter(n => n < k);
      await tw(t, inMs, q => { setT(g, f.s + (1 - f.s) * q, f.x * (1 - q), f.y * (1 - q)); done.forEach(n => panels[n].style.opacity = q); }); } }

  function reset(){
    R.trait.setAttribute("opacity", 0); drawable(R.branch); [R.evil, R.help].forEach(b => { b.g.setAttribute("opacity", 0); b.s.textContent = ""; b.bars.forEach(r => r.setAttribute("width", 0)); });
    [...R.cE, ...R.cN].forEach(c => c.setAttribute("fill", "#fff")); [R.aE, R.aN, R.mlab, R.minus, R.aV, R.vec, R.vlab].forEach(n => n.setAttribute("opacity", 0));
    drawable(R.join); drawable(R.vArrow); R.vHead.setAttribute("opacity", 0);
    R.model.setAttribute("opacity", 0); R.hsBg.setAttribute("opacity", 0); R.badge.setAttribute("opacity", 0); R.res.forEach(c => c.setAttribute("fill", "#e4e7ea"));
    R.robN.setAttribute("opacity", 1); R.robE.setAttribute("opacity", 0); drawable(R.tline); R.tHead.setAttribute("opacity", 0); R.hsB.forEach(c => c.setAttribute("fill", "#fff")); R.hsBlab.setAttribute("opacity", 0);
    R.hsC.forEach(c => c.setAttribute("fill", "#fff")); R.h.forEach((c, i) => c.setAttribute("fill", gray(PAT_H[i])));
    R.ringE.setAttribute("opacity", 0); R.fringE.setAttribute("opacity", 0); R.loss.setAttribute("d", ""); R.step.textContent = "";
    [R.bp, R.bpHead, R.bpLab, R.tHi, R.pulse, R.dotAB, R.lineBC].forEach(n => n.setAttribute("opacity", 0));
    R.inLab.textContent = audio ? "speech + question" : "photo + question"; R.cTitle.textContent = audio ? "Train the clip" : "Train the frame";
    R.bpLab.textContent = audio ? "backprop: only the clip is updated" : "backprop: only the frame is updated"; R.mLab.textContent = audio ? "Audio LLM" : "Vision LLM";
    R.img.setAttribute("opacity", audio ? 0 : 1); R.aud.setAttribute("opacity", audio ? 1 : 0);
    (audio ? ["MP3", "noise", "low-pass"] : ["JPEG", "noise", "blur"]).forEach((s, i) => R.tItems[i].textContent = s);
    R.tItems.forEach(n => n.classList.remove("b"));
    Object.values(panels).forEach(g => { g.removeAttribute("transform"); g.style.opacity = 1; });
    if (mode === "assemble" || mode === "stepper" || mode === "scroll") Object.values(panels).forEach(g => g.style.opacity = 0);
  }
  async function typeText(t, n, ms){ const s = n.dataset.full; for (let i = 1; i <= s.length; i++){ n.textContent = s.slice(0, i); if (!t.ff) await sleep(t, ms); } }

  async function stA(t){ stage = "a"; if (mode !== "zoom") caption("a");
    if (SOLO) await cut(t, "a", RA); else { spotlight("a"); if (mode === "zoom"){ await camTo(t, RA, t.ff ? 0 : 650); caption("a"); } }
    if (mode === "assemble") await grow(t, "a", 450, true);
    await fade(t, R.trait, 300); await draw(t, R.branch, 380);
    await Promise.all([fade(t, R.evil.g, 280), fade(t, R.help.g, 280)]);
    await Promise.all([typeText(t, R.evil.s, 22), typeText(t, R.help.s, 22)]);
    for (const b of [0, 1, 2]) await Promise.all([R.evil, R.help].map(x => tw(t, 260, k => x.bars[b].setAttribute("width", +x.bars[b].dataset.w * k))));
    await Promise.all([fade(t, R.aE, 200), fade(t, R.aN, 200)]);
    await tw(t, 520, k => [...R.cE, ...R.cN].forEach((c, i) => { const j = i % 8; c.setAttribute("fill", k * 8 > j ? c.dataset.c : "#fff"); }));
    await fade(t, R.mlab, 220); await sleep(t, 250);
    await draw(t, R.join, 420); await fade(t, R.minus, 200); await fade(t, R.aV, 160); await fade(t, R.vec, 220);
    await draw(t, R.vArrow, 520); R.vHead.setAttribute("opacity", 1); await fade(t, R.vlab, 250);
    await tw(t, 700, k => R.vArrow.setAttribute("stroke-width", 4 + 3 * Math.sin(k * Math.PI * 2) ** 2));
    await sleep(t, 500);
    if (mode === "assemble") await grow(t, "a", 650, false);
  }
  async function stB(t){ stage = "b"; if (mode !== "zoom") caption("b");
    if (SOLO) await cut(t, "b", RB); else { spotlight("b"); if (mode === "zoom"){ await camTo(t, RTOP, t.ff ? 0 : 650); caption("b"); } }
    if (mode === "assemble") await grow(t, "b", 450, true);
    await Promise.all([fade(t, R.model, 380), fade(t, R.hsBg, 380)]); await sleep(t, 200);
    if (mode === "grid" || mode === "zoom"){ R.dotAB.setAttribute("opacity", 1); const L = R.pathAB.getTotalLength();
      await tw(t, 800, k => { const p = R.pathAB.getPointAtLength(L * k); R.dotAB.setAttribute("cx", p.x); R.dotAB.setAttribute("cy", p.y); }); R.dotAB.setAttribute("opacity", 0); }
    if (mode === "zoom") await camTo(t, RB, t.ff ? 0 : 600);
    await fade(t, R.badge, 260);
    await tw(t, 600, k => R.res.forEach((c, i) => c.setAttribute("fill", k * 6 > i ? pink(.35 + .1 * (i % 3)) : "#e4e7ea")));
    await tw(t, 450, k => { R.robN.setAttribute("opacity", 1 - k); R.robE.setAttribute("opacity", k); });
    await draw(t, R.tline, 500); R.tHead.setAttribute("opacity", 1);
    await tw(t, 500, k => R.hsB.forEach((c, i) => c.setAttribute("fill", k * 8 > i ? pink(PAT_T[i]) : "#fff")));
    await fade(t, R.hsBlab, 260); await sleep(t, 900);
    if (mode === "assemble") await grow(t, "b", 650, false);
  }
  const lossPath = j => { if (j < 1) return ""; const pts = []; for (let i = 0; i <= 24; i++){ const u = j * i / 24; pts.push(`${(994 + u * 11.8).toFixed(1)},${(632 + 26 * (1 - Math.exp(-0.62 * u))).toFixed(1)}`); } return "M" + pts.join(" L"); };
  async function stC(t){ stage = "c"; if (mode !== "zoom") caption("c");
    if (SOLO) await cut(t, "c", PAN ? RCN(CR) : RC); else spotlight("c");
    if (mode === "zoom"){ await camTo(t, RFULL, t.ff ? 0 : 650); caption("c"); }
    R.step.textContent = "step 0 / 3,000";
    if (mode === "assemble") await grow(t, "c", 450, true);
    if ((mode === "grid" || mode === "zoom")){ await fade(t, R.lineBC, 350); }
    await tw(t, 450, k => R.hsC.forEach((c, i) => c.setAttribute("fill", k * 8 > i ? pink(PAT_T[i]) : "#fff")));
    for (let j = 0; j < STEPS.length; j++){ const p = j / (STEPS.length - 1), q = Math.min(1, j / (STEPS.length - 2));

      const ph = PHOTOS[j % PHOTOS.length];
      if (!audio){ [R.ph[1], R.fph[1]].forEach(n => n.setAttribute("href", A + ph));
        const c0 = cam.x; await tw(t, 280 * SLOW_C, k => { R.ph[1].setAttribute("opacity", k); R.fph[1].setAttribute("opacity", k); if (PAN && c0 !== CL) panC(c0, CL, k); });
        [R.ph[0], R.fph[0]].forEach(n => n.setAttribute("href", A + ph)); R.ph[1].setAttribute("opacity", 0); R.fph[1].setAttribute("opacity", 0); }
      else { const c0 = cam.x; await tw(t, 280 * SLOW_C, k => { if (PAN && c0 !== CL) panC(c0, CL, k); R.spBars.forEach((b, i) => { const v = .25 + .75 * Math.abs(Math.sin(i * 1.7 + j * 2.1) * Math.cos(i * .53 + j)); b.setAttribute("height", v * 48); b.setAttribute("y", 578 - v * 24); }); });
        R.mixS.forEach((b, i) => { const s = R.spBars[Math.round(i * 25 / 17)]; b.setAttribute("height", s.getAttribute("height")); b.setAttribute("y", s.getAttribute("y")); }); }

      const ti = TPICK[j]; R.tItems.forEach((n, i) => n.classList.toggle("b", i === ti)); R.tHi.setAttribute("y", 546 + ti * 26 - 16); R.tHi.setAttribute("opacity", 1);
      await sleep(t, 220 * SLOW_C);

      R.pulse.setAttribute("opacity", 1); const L = R.pulsePath.getTotalLength();
      await tw(t, 520 * SLOW_C, k => { const pt = R.pulsePath.getPointAtLength(L * k); R.pulse.setAttribute("cx", pt.x); R.pulse.setAttribute("cy", pt.y); if (PAN) panC(CL, CR, k * k * (3 - 2 * k));
        R.mbox.setAttribute("stroke-width", 2.4 + 2.2 * Math.max(0, Math.sin(Math.PI * (k - .45) / .4)) * (k > .45 && k < .85)); });
      R.pulse.setAttribute("opacity", 0); R.tHi.setAttribute("opacity", 0); R.tItems.forEach(n => n.classList.remove("b"));

      const from = R.h.map(c => c.getAttribute("fill"));
      await tw(t, 260 * SLOW_C, k => R.h.forEach((c, i) => c.setAttribute("fill", mix(from[i], mix(gray(PAT_H[i]), pink(PAT_T[i]), q), k))));

      R.loss.setAttribute("d", lossPath(j));
      await tw(t, 260 * SLOW_C, k => R.lbox.setAttribute("stroke-width", 1.8 + 1.6 * Math.sin(Math.PI * k)));

      R.bp.setAttribute("opacity", 1); R.bpHead.setAttribute("opacity", 1); R.bpLab.setAttribute("opacity", 1);
      await tw(t, 620 * SLOW_C, k => { R.bp.style.strokeDashoffset = 52 * (1 - k); if (PAN) panC(CR, CL, k * k * (3 - 2 * k)); });
      const tb = audio ? R.tboxA : R.tbox;
      await tw(t, 340 * SLOW_C, k => { tb.setAttribute("stroke-width", 1.8 + 2.4 * Math.sin(Math.PI * k)); if (!audio) R.flash.forEach(f => f.setAttribute("opacity", .55 * Math.sin(Math.PI * k)));
        if (!audio){ const p0 = Math.max(0, (j - 1) / (STEPS.length - 1)), o = p0 + (p - p0) * k; R.ringE.setAttribute("opacity", o); R.fringE.setAttribute("opacity", o); }
        else R.clipBars.forEach((b, i) => { const v = .25 + .75 * Math.abs(Math.sin(i * 1.7 + 3 + p * 1.3 * k) * Math.cos(i * .53 + 6 + p * k)); b.setAttribute("height", v * 48); b.setAttribute("y", 578 - v * 24); }); });
      if (audio) R.mixC.forEach((b, i) => { const s = R.clipBars[Math.round(i * 21 / 6)]; b.setAttribute("height", s.getAttribute("height")); b.setAttribute("y", s.getAttribute("y")); });
      R.step.textContent = `step ${STEPS[j].toLocaleString("en-US")} / 3,000`;
      await sleep(t, 120 * SLOW_C); R.bp.setAttribute("opacity", .25); R.bpHead.setAttribute("opacity", .25);
    }
    stage = "end"; caption("end"); R.bpLab.setAttribute("opacity", .5); R.bp.setAttribute("opacity", .3); R.bpHead.setAttribute("opacity", .3);
    spotlight(null);
    if (mode === "assemble") await grow(t, "c", 650, false);
  }
  const ST = {a: stA, b: stB, c: stC};

  async function run(from = "a", once = false){
    tok.dead = true; const t = {dead: false, ff: false}; tok = t; reset();
    try {
      const order = ["a", "b", "c"], i0 = order.indexOf(from);
      for (let i = 0; i < i0; i++){ t.ff = true; await ST[order[i]](t); t.ff = false; }
      if (mode === "assemble") for (let i = 0; i < i0; i++){ const g = panels[order[i]]; g.removeAttribute("transform"); g.style.opacity = 1; }
      for (let i = i0; i < (mode === "scroll" ? i0 + 1 : 3); i++) await ST[order[i]](t);
      if (once) return;
      await sleep(t, 3800); run("a");
    } catch (e){ if (e !== STOP) throw e; }
  }
  function stop(){ tok.dead = true; }
  root.querySelectorAll(".chips [data-s]").forEach(b => b.onclick = () => run(b.dataset.s, mode === "scroll"));
  const rp = root.querySelector(".chips .rp"); if (rp) rp.onclick = () => run("a");
  root.querySelectorAll(".chips [data-m]").forEach(b => b.onclick = () => { audio = b.dataset.m === "clip";
    root.querySelectorAll(".chips [data-m]").forEach(x => x.classList.toggle("on", x === b)); run(stage && stage !== "end" ? stage : "c", mode === "scroll"); });
  reset(); caption("a");
  return {run, stop, get stage(){ return stage; }};
}

const once = (node, f, th = .35) => new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting){ o.disconnect(); f(); } }), {threshold: th}).observe(node);
document.querySelectorAll("[data-fig]").forEach(root => {
  const mode = root.dataset.fig === "grid" && NARROW ? "stepper" : root.dataset.fig, F = Figure(root, mode);
  if (mode !== "scroll"){ once(root.querySelector("svg.fig"), () => F.run("a")); return; }

  root.querySelectorAll(".sstep").forEach(s => new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting){ root.querySelectorAll(".sstep").forEach(x => x.classList.toggle("on", x === s)); if (F.stage !== s.dataset.s) F.run(s.dataset.s, true); } }),
    {rootMargin: "-49% 0px -50% 0px"}).observe(s));
});
})();
