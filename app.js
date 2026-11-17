(function () {
  "use strict";
  var KEEP_AT = 60; // priority at or above this means "needs a keeper"
  var state = { all: [], sel: null, sortKey: "priority", dir: -1, domain: "all", q: "", only: false, source: "sample" };
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function cls(p) { return p >= KEEP_AT ? "crit" : p >= 35 ? "warn" : "ok"; }
  function median(a) { if (!a.length) return 0; var s = a.slice().sort(function (x, y) { return x - y; }), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

  // --- CSV (output of `keepalive scan --csv`) ---
  function parseCSV(text) {
    var rows = [], row = [], f = "", q = false, i, c;
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(f); f = ""; if (row.length > 1 || row[0] !== "") rows.push(row); row = []; }
      else f += c;
    }
    if (f !== "" || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function fromCSV(text) {
    var r = parseCSV(text), h = r.shift() || [];
    var need = ["full_name", "decay", "dependence", "priority"];
    if (need.some(function (k) { return h.indexOf(k) < 0; })) throw new Error("This file is missing columns. Export it with: keepalive scan watchlist.csv --csv report.csv");
    return r.map(function (v) {
      var o = {}; h.forEach(function (k, i) { o[k] = v[i]; });
      var n = function (x) { return x === "" || x == null ? null : Number(x); };
      return { full_name: o.full_name, domain: o.domain || "", decay: n(o.decay) || 0, dependence: n(o.dependence) || 0, priority: n(o.priority) || 0,
        days_since_push: n(o.days_since_push), days_since_release: n(o.days_since_release),
        archived: /^true$/i.test(o.archived || ""), known_deployments: n(o.known_deployments) || 0, notes: o.notes || "" };
    });
  }

  // --- derived views ---
  function visible() {
    var q = state.q.toLowerCase();
    return state.all.filter(function (t) {
      return (state.domain === "all" || t.domain === state.domain) && (!q || t.full_name.toLowerCase().indexOf(q) >= 0) && (!state.only || t.priority >= KEEP_AT);
    }).sort(function (a, b) {
      var x = a[state.sortKey], y = b[state.sortKey];
      if (x == null) return 1; if (y == null) return -1;
      return (typeof x === "string" ? x.localeCompare(y) : x - y) * state.dir;
    });
  }

  function renderStats() {
    var a = state.all, need = a.filter(function (t) { return t.priority >= KEEP_AT; });
    var sites = a.reduce(function (s, t) { return s + t.known_deployments; }, 0);
    var push = a.map(function (t) { return t.days_since_push; }).filter(function (x) { return x != null; });
    $("stats").innerHTML =
      '<div class="stat alert"><b>' + need.length + '</b><span>need a keeper now</span></div>' +
      '<div class="stat"><b>' + a.length + '</b><span>tools scanned</span></div>' +
      '<div class="stat"><b>' + sites + '</b><span>known sites relying on them</span></div>' +
      '<div class="stat"><b>' + Math.round(median(push)) + '</b><span>median days since an update</span></div>';
    $("source").textContent = state.source === "sample" ? "Showing fictional sample data" : "Showing: " + state.source;
  }

  function renderChart() {
    var W = 520, H = 400, L = 44, R = 12, T = 12, B = 40, pw = W - L - R, ph = H - T - B;
    var X = function (v) { return L + (v / 100) * pw; }, Y = function (v) { return T + (1 - v / 100) * ph; };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Scatter plot of reliance against neglect for each tool">';
    s += '<rect class="zone" x="' + X(50) + '" y="' + Y(100) + '" width="' + (X(100) - X(50)) + '" height="' + (Y(50) - Y(100)) + '"/>';
    s += '<text class="zonelabel" x="' + (X(100) - 6) + '" y="' + (Y(100) + 16) + '" text-anchor="end">Needs a keeper</text><g class="grid">';
    [0, 25, 50, 75, 100].forEach(function (v) {
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><line y1="' + T + '" y2="' + (H - B) + '" x1="' + X(v) + '" x2="' + X(v) + '"/>';
      s += '<text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '</text><text x="' + X(v) + '" y="' + (H - B + 16) + '" text-anchor="middle">' + v + "</text>";
    });
    s += '</g><text x="' + (L + pw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">Reliance (how many people depend on it)</text>';
    s += '<text transform="rotate(-90)" x="' + (-(T + ph / 2)) + '" y="12" text-anchor="middle">Neglect (how long it has been quiet)</text>';
    visible().forEach(function (t) {
      var col = { crit: "var(--crit)", warn: "var(--warn)", ok: "var(--ok)" }[cls(t.priority)];
      var r = Math.min(16, 6 + Math.sqrt(t.known_deployments) * 0.9);
      s += '<circle data-n="' + esc(t.full_name) + '" cx="' + X(t.dependence) + '" cy="' + Y(t.decay) + '" r="' + r + '" fill="' + col + '"' +
        (state.sel === t.full_name ? ' class="sel"' : "") + ' tabindex="0" role="button" aria-label="' + esc(t.full_name) + ", priority " + t.priority + '"><title>' + esc(t.full_name) + "</title></circle>";
    });
    $("chart").innerHTML = s + "</svg>";
  }

  function renderDetail() {
    var t = state.all.filter(function (x) { return x.full_name === state.sel; })[0], el = $("detail");
    if (!t) { el.innerHTML = '<h2>Select a tool</h2><p class="empty">Choose a dot on the chart or a row in the table to see why it ranks where it does.</p>'; return; }
    var c = cls(t.priority), label = { crit: "Needs a keeper now", warn: "Watch closely", ok: "Healthy for now" }[c];
    var bits = [];
    bits.push(t.dependence >= 50 ? "Many people rely on it" : "Fewer people rely on it");
    bits.push(t.days_since_push == null ? "its last update is unknown" : t.days_since_push > 365 ? "it has had no update for " + t.days_since_push + " days" : "it was updated " + t.days_since_push + " days ago");
    if (t.archived) bits.push("its owners have archived it");
    var next = c === "crit" ? "Next step: interview its users, confirm live sites, then offer a local maintainer." : c === "warn" ? "Next step: check the issue tracker and ask users whether they have noticed problems." : "Next step: none for now. Re-check at the next scan.";
    var bar = function (v, col) { return '<div class="bar"><i style="width:' + Math.min(100, v) + "%;background:" + col + '"></i></div>'; };
    el.innerHTML = '<h2><a href="https://github.com/' + esc(t.full_name) + '" target="_blank" rel="noopener">' + esc(t.full_name) + '</a></h2>' +
      '<span class="tag ' + c + '">' + label + "</span>" +
      '<p class="why">' + esc(bits.join(", ")) + ". " + esc(next) + "</p>" +
      "<dl><dt>Priority</dt><dd>" + t.priority + bar(t.priority, "var(--accent)") + "</dd>" +
      "<dt>Neglect</dt><dd>" + t.decay + bar(t.decay, "var(--crit)") + "</dd>" +
      "<dt>Reliance</dt><dd>" + t.dependence + bar(t.dependence, "var(--ok)") + "</dd>" +
      "<dt>Domain</dt><dd>" + esc(t.domain || "unknown") + "</dd>" +
      "<dt>Days since release</dt><dd>" + (t.days_since_release == null ? "no release" : t.days_since_release) + "</dd>" +
      "<dt>Known sites</dt><dd>" + t.known_deployments + "</dd></dl>" +
      (t.notes ? "<p>" + esc(t.notes) + "</p>" : "");
  }

  function renderTable() {
    var rows = visible(), tb = $("table").tBodies[0];
    tb.innerHTML = rows.length ? rows.map(function (t) {
      return '<tr tabindex="0" data-n="' + esc(t.full_name) + '"' + (state.sel === t.full_name ? ' class="sel"' : "") + "><td>" + esc(t.full_name) + (t.archived ? " (archived)" : "") + "</td><td>" + esc(t.domain) +
        '</td><td class="num"><span class="pri ' + cls(t.priority) + '">' + t.priority + '</span></td><td class="num">' + t.decay + '</td><td class="num">' + t.dependence +
        '</td><td class="num">' + (t.days_since_push == null ? "n/a" : t.days_since_push) + '</td><td class="num">' + t.known_deployments + "</td></tr>";
    }).join("") : '<tr><td colspan="7" class="empty">No tools match. Clear the search or the filters.</td></tr>';
    $("count").textContent = rows.length + " of " + state.all.length + " tools";
    Array.prototype.forEach.call($("table").tHead.rows[0].cells, function (th) {
      if (th.dataset.k === state.sortKey) th.setAttribute("aria-sort", state.dir > 0 ? "ascending" : "descending"); else th.removeAttribute("aria-sort");
    });
  }

  function renderDomains() {
    var d = Array.from(new Set(state.all.map(function (t) { return t.domain; }).filter(Boolean))).sort();
    $("domain").innerHTML = '<option value="all">All domains</option>' + d.map(function (x) { return '<option value="' + esc(x) + '">' + esc(x) + "</option>"; }).join("");
    state.domain = "all";
  }

  function all() { renderStats(); renderChart(); renderDetail(); renderTable(); }
  function select(name) { state.sel = name; renderChart(); renderDetail(); renderTable(); }
  function load(rows, source) {
    state.all = rows; state.source = source; state.sel = rows.slice().sort(function (a, b) { return b.priority - a.priority; })[0] ? rows.slice().sort(function (a, b) { return b.priority - a.priority; })[0].full_name : null;
    renderDomains(); all();
  }

  // --- events ---
  $("chart").addEventListener("click", function (e) { var n = e.target.getAttribute && e.target.getAttribute("data-n"); if (n) select(n); });
  $("chart").addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.getAttribute("data-n")) { e.preventDefault(); select(e.target.getAttribute("data-n")); } });
  $("table").tBodies[0].addEventListener("click", function (e) { var tr = e.target.closest("tr[data-n]"); if (tr) select(tr.dataset.n); });
  $("table").tBodies[0].addEventListener("keydown", function (e) { var tr = e.target.closest("tr[data-n]"); if (tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(tr.dataset.n); } });
  $("table").tHead.addEventListener("click", function (e) {
    var k = e.target.dataset && e.target.dataset.k; if (!k) return;
    state.dir = state.sortKey === k ? -state.dir : (k === "full_name" || k === "domain" ? 1 : -1); state.sortKey = k; renderTable(); renderChart();
  });
  $("q").addEventListener("input", function (e) { state.q = e.target.value; renderTable(); renderChart(); });
  $("domain").addEventListener("change", function (e) { state.domain = e.target.value; renderTable(); renderChart(); });
  $("only").addEventListener("change", function (e) { state.only = e.target.checked; renderTable(); renderChart(); });
  $("reset").addEventListener("click", function () { load(window.KEEPALIVE_SAMPLE.slice(), "sample"); });
  $("file").addEventListener("change", function (e) {
    var f = e.target.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try { var rows = fromCSV(String(rd.result)); if (!rows.length) throw new Error("The file has no rows."); load(rows, f.name); }
      catch (err) { $("source").textContent = err.message; }
    };
    rd.readAsText(f); e.target.value = "";
  });

  load(window.KEEPALIVE_SAMPLE.slice(), "sample");
})();
