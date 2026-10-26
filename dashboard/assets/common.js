// Shared helpers for the read-only prediction-market dashboards (formatting, chart, tables, theme).

const dtFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const dFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const fmtDate = (d) => (d ? dtFmt.format(d) : "–");
const fmtDay = (d) => (d ? dFmt.format(d) : "–");
const fmtNum = (n) => Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const pct = (p, digits) => (p * 100).toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const fmtPx = (p) => (p == null || isNaN(p) ? "–" : `${pct(p, 1)} %`);
const fmtPct = (p) => (p == null || isNaN(p) ? "–" : `${pct(p, p < 0.1 || p > 0.9 ? 1 : 0)} %`);
// Signed change in percentage points, e.g. "+2,5 pt".
const fmtPts = (change) => `${change > 0 ? "+" : "−"}${pct(Math.abs(change), 1)} pt`;
function fmtUsd(n) {
  if (n >= 1e9) return `${(n / 1e9).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} Md$`;
  if (n >= 1e6) return `${(n / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} M$`;
  if (n >= 1e3) return `${(n / 1e3).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k$`;
  return `${Math.round(n).toLocaleString("fr-FR")} $`;
}
// Decimal odds: a contract bought at price p pays 1, so the stake is multiplied by 1/p if it wins.
function fmtOdds(p) {
  if (p == null || isNaN(p) || p <= 0) return "–";
  const o = 1 / p;
  return `×${o.toLocaleString("fr-FR", { maximumFractionDigits: o < 10 ? 2 : o < 100 ? 1 : 0 })}`;
}
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function deltaHtml(change) {
  if (change == null || Math.abs(change) < 0.0005) return `<span class="delta">0</span>`;
  const up = change > 0;
  return `<span class="delta"><span class="${up ? "arrow-up" : "arrow-down"}" aria-hidden="true">${up ? "▲" : "▼"}</span> ${fmtPts(change)}</span>`;
}

// Gain for a 100 $ stake at price p, shown under the big probability.
function payoffHtml(p) {
  if (p == null || isNaN(p) || p <= 0 || p >= 1) return "";
  return `<div class="note">Cote ${fmtOdds(p)} : 100 $ au prix de ${fmtPx(p)} achètent ${fmtNum(100 / p)} contrats,
    soit ${fmtUsd(100 / p)} versés (+${fmtUsd(100 / p - 100)}) si l'issue se réalise, et −100 $ sinon. Hors frais et glissement de prix.</div>`;
}

// levels: { asks: [{px, sz}] best first, bids: [{px, sz}] best first }
function bookHtml({ asks, bids }) {
  const b = bids.slice(0, 6), a = asks.slice(0, 6).reverse();
  if (!b.length && !a.length) return `<div class="note">Carnet vide.</div>`;
  const max = Math.max(...[...a, ...b].map((l) => l.sz), 1);
  const row = (l, cls) => `<tr><td class="${cls}">${fmtPx(l.px)}</td><td>${fmtNum(l.sz)}<span class="depth" style="width:${(l.sz / max) * 100}%;background:var(--${cls === "side-sell" ? "ask" : "bid"})"></span></td></tr>`;
  const spread = asks.length && bids.length ? asks[0].px - bids[0].px : null;
  return `<table class="mini"><thead><tr><th>Prix</th><th>Contrats</th></tr></thead><tbody>
    ${a.map((l) => row(l, "side-sell")).join("")}
    <tr><td colspan="2" style="text-align:center;color:var(--text-muted)">${spread != null ? `écart ${pct(spread, 2)} pt` : "–"}</td></tr>
    ${b.map((l) => row(l, "side-buy")).join("")}
  </tbody></table>`;
}

// trades: [{ time (ms), buy (bool), px, sz, label? }] most recent first
function tradesHtml(trades) {
  if (!trades.length) return `<div class="note">Aucune transaction récente.</div>`;
  const tf = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const withLabel = trades.some((t) => t.label);
  return `<table class="mini"><thead><tr><th>Heure</th><th>Sens</th>${withLabel ? "<th>Issue</th>" : ""}<th>Prix</th><th>Contrats</th></tr></thead><tbody>
    ${trades.slice(0, 12).map((t) => `<tr>
      <td>${tf.format(new Date(t.time))}</td>
      <td class="${t.buy ? "side-buy" : "side-sell"}">${t.buy ? "Achat" : "Vente"}</td>
      ${withLabel ? `<td>${esc(t.label)}</td>` : ""}
      <td>${fmtPx(t.px)}</td><td>${fmtNum(t.sz)}</td></tr>`).join("")}
  </tbody></table>`;
}

// pts: [{ t (ms), v (0..1), n? (trade count) }]
function drawLineChart(el, pts) {
  const W = 600, H = 220, m = { t: 10, r: 12, b: 24, l: 40 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const vs = pts.map((p) => p.v);
  let lo = Math.min(...vs), hi = Math.max(...vs);
  const pad = Math.max(0.05 - (hi - lo) / 2, 0.02);
  lo = Math.max(0, lo - pad); hi = Math.min(1, hi + pad);
  const t0 = pts[0].t, t1 = pts[pts.length - 1].t || t0 + 1;
  const x = (t) => m.l + (t1 === t0 ? iw / 2 : ((t - t0) / (t1 - t0)) * iw);
  const y = (v) => m.t + (1 - (v - lo) / (hi - lo || 1)) * ih;

  const step = niceStep((hi - lo) / 4);
  const ticks = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(v);
  const spanDays = (t1 - t0) / 86_400_000;
  const xf = new Intl.DateTimeFormat("fr-FR", spanDays > 2 ? { day: "numeric", month: "short" } : { hour: "2-digit", minute: "2-digit" });
  const xticks = [0, 0.33, 0.66, 1].map((f) => t0 + f * (t1 - t0));

  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  const area = `${d}L${x(t1).toFixed(1)},${m.t + ih}L${x(t0).toFixed(1)},${m.t + ih}Z`;

  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Historique de la probabilité">
      ${ticks.map((v) => `<line class="gridline" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round(v * 100)} %</text>`).join("")}
      ${xticks.map((t, i) => `<text class="axis" x="${x(t)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === 3 ? "end" : "middle"}">${xf.format(new Date(t))}</text>`).join("")}
      <path class="area" d="${area}"/>
      <path class="line" d="${d}" vector-effect="non-scaling-stroke"/>
      <line class="cross" id="cross" y1="${m.t}" y2="${m.t + ih}" visibility="hidden" vector-effect="non-scaling-stroke"/>
      <rect x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" fill="transparent" id="hit"/>
    </svg>
    <div class="tooltip" id="tip" hidden></div>`;

  // The SVG stretches horizontally, so the hover dot is an HTML element to stay round.
  const svg = el.querySelector("svg");
  const tip = el.querySelector("#tip");
  const cross = el.querySelector("#cross");
  const dot = document.createElement("span");
  dot.style.cssText = "position:absolute;width:10px;height:10px;border-radius:50%;background:var(--series-1);border:2px solid var(--surface-1);transform:translate(-50%,-50%);pointer-events:none;display:none";
  el.appendChild(dot);
  const full = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const move = (ev) => {
    const r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W;
    const t = t0 + ((px - m.l) / iw) * (t1 - t0);
    let best = pts[0];
    for (const p of pts) if (Math.abs(p.t - t) < Math.abs(best.t - t)) best = p;
    const sx = (x(best.t) / W) * r.width, sy = (y(best.v) / H) * r.height;
    cross.setAttribute("x1", x(best.t)); cross.setAttribute("x2", x(best.t)); cross.setAttribute("visibility", "visible");
    dot.style.display = "block"; dot.style.left = `${sx}px`; dot.style.top = `${sy}px`;
    tip.hidden = false;
    const count = best.n == null ? "" : `<div class="t">${best.n} transaction${best.n > 1 ? "s" : ""}</div>`;
    tip.innerHTML = `<div class="t">${full.format(new Date(best.t))}</div><div class="v">${fmtPct(best.v)} <span class="t">${fmtOdds(best.v)}</span></div>${count}`;
    const tw = tip.offsetWidth;
    tip.style.left = `${sx + 12 + tw > r.width ? Math.max(sx - 12 - tw, 0) : sx + 12}px`;
    tip.style.top = `${Math.max(sy - 50, 0)}px`;
  };
  const leave = () => { tip.hidden = true; dot.style.display = "none"; cross.setAttribute("visibility", "hidden"); };
  const hit = el.querySelector("#hit");
  hit.addEventListener("pointermove", move);
  hit.addEventListener("pointerdown", move);
  hit.addEventListener("pointerleave", leave);
}

function niceStep(raw) {
  const pow = 10 ** Math.floor(Math.log10(raw || 0.01));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

function setupThemeToggle(button) {
  try { const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; } catch {}
  button.addEventListener("click", () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  });
}
