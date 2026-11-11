/* ==================================================================
   Sicheng Qian — personal site behaviour
   Vanilla JS, no dependencies. Everything degrades gracefully.
   ================================================================== */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasIO = "IntersectionObserver" in window;

  /* ------------------------------------------------ theme ------- */
  var themeBtn = $("#theme-toggle");
  var metaTheme = $('meta[name="theme-color"]');

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    if (metaTheme) metaTheme.setAttribute("content", theme === "dark" ? "#07080a" : "#f3efe7");
    if (themeBtn) {
      themeBtn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
    if (persist) {
      try { localStorage.setItem("sq-theme", theme); } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent("sq:theme", { detail: theme }));
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
    });
  }

  /* ------------------------------------------------ intro ------- */
  var intro = $("#intro");
  var ready = function () { document.body.classList.add("is-ready"); };

  if (!intro) {
    ready();
  } else if (reduceMotion || sessionStorage.getItem("sq-intro") === "1") {
    intro.remove();
    ready();
  } else {
    document.body.style.overflow = "hidden";
    var pctEl = $("#intro-pct");
    var t0 = performance.now();
    var finished = false;

    (function countUp() {
      var p = Math.min(1, (performance.now() - t0) / 1100);
      if (pctEl) {
        pctEl.textContent = String(Math.round(p * 100)).padStart(2, "0") + " — 100";
      }
      var barEl = intro.querySelector(".intro__bar i");
      if (barEl) barEl.style.transform = "scaleX(" + p + ")";
      if (p < 1) requestAnimationFrame(countUp);
    })();

    var finishIntro = function () {
      if (finished) return;
      finished = true;
      try { sessionStorage.setItem("sq-intro", "1"); } catch (e) {}
      intro.classList.add("is-done");
      document.body.style.overflow = "";
      ready();
      window.setTimeout(function () { if (intro && intro.parentNode) intro.remove(); }, 900);
    };

    window.addEventListener("load", function () { window.setTimeout(finishIntro, 850); }, { once: true });
    window.setTimeout(finishIntro, 3000);
  }

  /* ------------------------------------------------ clock ------- */
  var clock = $("#clock");
  var clockZone = $("#clock-zone");
  var clockLong = $("#clock-long");
  var timeFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  function zoneName(date) {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      timeZoneName: "short"
    }).formatToParts(date);
    for (var i = 0; i < parts.length; i++) if (parts[i].type === "timeZoneName") return parts[i].value;
    return "EST";
  }

  function tickClock() {
    var now = new Date();
    var time = timeFmt.format(now);
    var zone = zoneName(now);
    if (clock) clock.textContent = time;
    if (clockZone) clockZone.textContent = zone;
    if (clockLong) clockLong.textContent = time + " " + zone;
  }
  tickClock();
  window.setInterval(tickClock, 15000);

  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------ scroll ------ */
  var nav = $("#nav");
  var bar = $("#progress-bar");
  var navLinks = $$(".nav__links a");
  var sections = navLinks
    .map(function (a) {
      var id = a.getAttribute("href");
      return id && id.charAt(0) === "#" ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle("is-scrolled", y > 24);

    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";

    if (sections.length) {
      var probe = y + window.innerHeight * 0.34;
      var current = null;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= probe) current = sections[i];
      }
      navLinks.forEach(function (a) {
        var active = !!current && a.getAttribute("href") === "#" + current.id;
        a.classList.toggle("is-active", active);
        if (active) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ------------------------------------------------ reveal ------ */
  var revealEls = $$("[data-reveal]");
  if (reduceMotion || !hasIO) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ------------------------------------------------ counters ---- */
  function runCounter(el) {
    var to = parseFloat(el.dataset.count);
    var pad = parseInt(el.dataset.pad || "0", 10);
    if (isNaN(to)) return;

    var format = function (v) {
      var n = String(Math.round(v));
      if (pad) { while (n.length < pad) n = "0" + n; }
      return n;
    };

    if (reduceMotion) { el.textContent = format(to); return; }

    var startedAt = null;
    var duration = 1500;
    var step = function (now) {
      if (startedAt === null) startedAt = now;
      var p = Math.min(1, (now - startedAt) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(to * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = format(to);
    };
    requestAnimationFrame(step);
  }

  var counters = $$("[data-count]");
  if (counters.length && hasIO) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          countIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countIO.observe(el); });
  }

  /* ------------------------------------------------ spotlight --- */
  if (finePointer) {
    $$("[data-spotlight]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ------------------------------------------------ tilt -------- */
  var card = $("#project-card");
  if (card && finePointer && !reduceMotion) {
    var reset = function () {
      card.style.transform = "";
      card.classList.remove("is-tilting");
    };
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.classList.add("is-tilting");
      card.style.transform =
        "perspective(1400px) rotateX(" + (-py * 2.6).toFixed(2) + "deg) rotateY(" +
        (px * 3).toFixed(2) + "deg)";
    });
    card.addEventListener("pointerleave", reset);
    card.addEventListener("blur", reset);
  }

  /* ------------------------------------------------ cursor ------ */
  var cursor = $("#cursor");
  if (cursor && finePointer && !reduceMotion) {
    var tx = window.innerWidth / 2;
    var ty = window.innerHeight / 2;
    var cx = tx;
    var cy = ty;

    window.addEventListener("pointermove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
      cursor.classList.add("is-visible");
    }, { passive: true });

    document.addEventListener("pointerover", function (e) {
      if (e.target.closest && e.target.closest("a, button, input, .project, .tk, .figure")) {
        cursor.classList.add("is-hover");
      }
    });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest && e.target.closest("a, button, input, .project, .tk, .figure")) {
        cursor.classList.remove("is-hover");
      }
    });
    document.addEventListener("mouseleave", function () { cursor.classList.remove("is-visible"); });

    (function follow() {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      cursor.style.transform = "translate3d(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px,0)";
      requestAnimationFrame(follow);
    })();
  }

  /* ------------------------------------------------ marquee ----- */
  var track = $("#marquee-track");
  if (track) track.innerHTML += track.innerHTML;

  /* ------------------------------------------------ menu -------- */
  var menu = $("#menu");
  var menuBtn = $("#menu-toggle");

  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      setMenu(!menu.classList.contains("is-open"));
    });
  }
  if (menu) {
    $$("a", menu).forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ------------------------------------------------ palette ----- */
  var palette = $("#palette");
  var paletteInput = $("#palette-input");
  var paletteList = $("#palette-list");
  var paletteOpeners = $$("[data-palette]");
  var paletteIndex = 0;
  var paletteItems = [];

  var destinations = [
    { label: "Profile", hint: "01", href: "#profile" },
    { label: "Research", hint: "02", href: "#research" },
    { label: "Leadership — BMMSS", hint: "03", href: "#leadership" },
    { label: "Experience", hint: "04", href: "#experience" },
    { label: "Projects — CampusPilot", hint: "05", href: "#projects" },
    { label: "Toolkit", hint: "06", href: "#toolkit" },
    { label: "Education", hint: "07", href: "#education" },
    { label: "Contact", hint: "08", href: "#contact" },
    { label: "Résumé — print view", hint: "↗", href: "resume.html" },
    { label: "Download CV (PDF)", hint: "↓", href: "assets/Sicheng_Qian_CV.pdf" },
    { label: "Email Sicheng", hint: "@", href: "mailto:qian.917@osu.edu" },
    { label: "Copy email address", hint: "copy", action: "copy" },
    { label: "Toggle light / dark", hint: "◐", action: "theme" },
    { label: "Back to top", hint: "↑", href: "#top" }
  ];

  function copyEmail() {
    var value = "qian.917@osu.edu";
    var done = function () {
      var note = $("#copy-note");
      if (!note) return;
      note.classList.add("is-on");
      window.setTimeout(function () { note.classList.remove("is-on"); }, 2400);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(done, function () { fallbackCopy(value, done); });
    } else {
      fallbackCopy(value, done);
    }
  }

  function fallbackCopy(value, done) {
    var ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) {}
    document.body.removeChild(ta);
  }

  function activate(item) {
    if (!item) return;
    if (palette) palette.close();
    if (item.action === "theme") { applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true); return; }
    if (item.action === "copy") { copyEmail(); return; }
    if (item.href) window.location.href = item.href;
  }

  function renderPalette(query) {
    if (!paletteList) return;
    var q = (query || "").trim().toLowerCase();
    paletteItems = destinations.filter(function (item) {
      return !q || item.label.toLowerCase().indexOf(q) > -1;
    });
    if (paletteIndex >= paletteItems.length) paletteIndex = 0;
    paletteList.innerHTML = "";
    paletteItems.forEach(function (item, i) {
      var li = document.createElement("li");
      li.setAttribute("role", "option");
      li.className = "palette__item";
      li.setAttribute("aria-selected", String(i === paletteIndex));
      li.innerHTML =
        '<span class="k">' + item.hint + "</span><span>" + item.label + "</span>";
      li.addEventListener("click", function () { activate(item); });
      li.addEventListener("pointermove", function () {
        if (paletteIndex === i) return;
        paletteIndex = i;
        updateSelection();
      });
      paletteList.appendChild(li);
    });
    if (!paletteItems.length) {
      var empty = document.createElement("li");
      empty.className = "palette__item";
      empty.style.color = "var(--muted)";
      empty.textContent = "No match — try “research” or “contact”.";
      paletteList.appendChild(empty);
    }
  }

  function updateSelection() {
    if (!paletteList) return;
    var nodes = $$(".palette__item", paletteList);
    nodes.forEach(function (n, i) {
      n.setAttribute("aria-selected", String(i === paletteIndex));
      if (i === paletteIndex) {
        n.scrollIntoView({ block: "nearest" });
      }
    });
  }

  function openPalette() {
    if (!palette || palette.open) return;
    renderPalette("");
    paletteIndex = 0;
    if (palette.showModal) palette.showModal();
    else palette.setAttribute("open", "");
    if (paletteInput) {
      paletteInput.value = "";
      window.setTimeout(function () { paletteInput.focus(); }, 30);
    }
    updateSelection();
  }

  paletteOpeners.forEach(function (btn) {
    btn.addEventListener("click", openPalette);
  });

  if (paletteInput) {
    paletteInput.addEventListener("input", function () {
      paletteIndex = 0;
      renderPalette(paletteInput.value);
    });
  }

  if (palette) {
    palette.addEventListener("close", function () {
      if (paletteInput) paletteInput.blur();
    });
    palette.addEventListener("click", function (e) { if (e.target === palette) palette.close(); });
    palette.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!paletteItems.length) return;
        paletteIndex = (paletteIndex + (e.key === "ArrowDown" ? 1 : -1) + paletteItems.length) % paletteItems.length;
        updateSelection();
      } else if (e.key === "Enter") {
        e.preventDefault();
        activate(paletteItems[paletteIndex]);
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    var tag = (e.target.tagName || "").toLowerCase();
    var typing = tag === "input" || tag === "textarea" || e.target.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (palette && palette.open) palette.close();
      else openPalette();
    } else if (e.key === "/" && !typing && palette && !palette.open) {
      e.preventDefault();
      openPalette();
    }
  });

  var copyBtn = $("#copy-email");
  if (copyBtn) copyBtn.addEventListener("click", copyEmail);

  /* ------------------------------------------------ metric canvas */
  (function metricSpace() {
    var canvas = $("#metric-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var host = canvas.parentElement;
    var W = 0;
    var H = 0;
    var DPR = 1;
    var pts = [];
    var t = 0;
    var raf = 0;
    var last = 0;
    var visible = true;
    var pointer = { x: 0.5, y: 0.5, active: false, strength: 0 };
    var N = 46;

    var palette = {
      dark: { line: "255,255,255", node: "244,241,234", accent: "255,92,53", mint: "124,227,195" },
      light: { line: "18,16,13", node: "18,17,16", accent: "195,53,23", mint: "31,143,116" }
    };
    var C = palette.dark;

    function seedRandom(a) {
      return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        var x = Math.imul(a ^ (a >>> 15), 1 | a);
        x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
      };
    }

    function initPoints() {
      var rand = seedRandom(20260917);
      pts = [];
      for (var i = 0; i < N; i++) {
        var ang = rand() * Math.PI * 2;
        var rad = Math.pow(rand(), 0.62) * 0.44;
        var px = 0.5 + Math.cos(ang) * rad;
        var py = 0.5 + Math.sin(ang) * rad * 0.92;
        pts.push({
          x: px,
          y: py,
          r: 0.7 + rand() * 1.5,
          ph: rand() * Math.PI * 2,
          sp: 0.15 + rand() * 0.5,
          depth: 0.3 + rand() * 0.7,
          accent: rand() > 0.74
        });
      }
    }

    function resize() {
      var rect = host.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      DPR = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function positions() {
      var out = [];
      var parX = (pointer.x - 0.5) * 14;
      var parY = (pointer.y - 0.5) * 14;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var drift = Math.sin(t * p.sp + p.ph) * 0.005;
        var drift2 = Math.cos(t * p.sp * 0.8 + p.ph) * 0.004;
        out.push({
          x: (p.x + drift + parX * 0.001 * p.depth) * W,
          y: (p.y + drift2 + parY * 0.001 * p.depth) * H,
          p: p
        });
      }
      return out;
    }

    function draw() {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);

      var isLight = root.dataset.theme === "light";
      C = (isLight ? palette.light : palette.dark);

      // coordinate grid
      var step = 46;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(" + C.line + (isLight ? ",0.07)" : ",0.05)");
      ctx.beginPath();
      for (var gx = step; gx < W; gx += step) { ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, H); }
      for (var gy = step; gy < H; gy += step) { ctx.moveTo(0, gy + 0.5); ctx.lineTo(W, gy + 0.5); }
      ctx.stroke();

      var pos = positions();
      var fx = W * 0.5;
      var fy = H * 0.5;
      var R = Math.min(W, H) * 0.23;
      var breath = 1 + Math.sin(t * 0.7) * 0.05;

      // pointer glow
      if (pointer.active) {
        var pr = Math.max(W, H) * 0.34;
        var grad = ctx.createRadialGradient(pointer.x * W, pointer.y * H, 0, pointer.x * W, pointer.y * H, pr);
        grad.addColorStop(0, "rgba(" + C.accent + ",0.10)");
        grad.addColorStop(1, "rgba(" + C.accent + ",0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      // edges, bucketed by opacity
      var buckets = [[], [], []];
      for (var i = 0; i < pos.length; i++) {
        for (var j = i + 1; j < pos.length; j++) {
          var dx = pos[i].x - pos[j].x;
          var dy = pos[i].y - pos[j].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d > R) continue;
          var a = 1 - d / R;
          var b = a > 0.66 ? 2 : a > 0.33 ? 1 : 0;
          buckets[b].push([pos[i], pos[j]]);
        }
      }
      var alpha = isLight ? [0.12, 0.2, 0.34] : [0.08, 0.14, 0.26];
      for (var bIdx = 0; bIdx < 3; bIdx++) {
        if (!buckets[bIdx].length) continue;
        ctx.beginPath();
        buckets[bIdx].forEach(function (pair) {
          ctx.moveTo(pair[0].x, pair[0].y);
          ctx.lineTo(pair[1].x, pair[1].y);
        });
        ctx.strokeStyle = "rgba(" + C.mint + "," + (alpha[bIdx] + pointer.strength * 0.08) + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // focal rings
      var rings = [0.36, 0.62, 0.9];
      for (var k = 0; k < rings.length; k++) {
        var rr = R * rings[k] * breath;
        ctx.beginPath();
        ctx.setLineDash([2, 6]);
        ctx.strokeStyle = "rgba(" + C.accent + "," + (0.4 - k * 0.1) + ")";
        ctx.lineWidth = 1;
        ctx.arc(fx, fy, rr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // halo
      var haloR = R * 0.36 * breath;
      var halo = ctx.createRadialGradient(fx, fy, 0, fx, fy, haloR);
      halo.addColorStop(0, "rgba(" + C.accent + ",0.16)");
      halo.addColorStop(1, "rgba(" + C.accent + ",0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(fx, fy, haloR, 0, Math.PI * 2);
      ctx.fill();

      // nodes
      pos.forEach(function (n) {
        var d = Math.hypot(n.x - fx, n.y - fy);
        var near = d < R * 1.1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.p.r * (near ? 1.15 : 1), 0, Math.PI * 2);
        if (n.p.accent || near) {
          ctx.fillStyle = "rgba(" + C.accent + "," + (near ? 0.9 : 0.55) + ")";
        } else {
          ctx.fillStyle = "rgba(" + C.node + ",0.5)";
        }
        ctx.fill();
        if (near) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.p.r + 3.5, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(" + C.accent + ",0.16)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // focal marker
      ctx.beginPath();
      ctx.arc(fx, fy, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + C.accent + ",1)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fx, fy, 9 + Math.sin(t * 1.6) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(" + C.accent + ",0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    function frame(now) {
      if (!visible) return;
      if (!last) last = now;
      var dt = Math.min(60, now - last);
      last = now;
      t += dt / 1000;
      pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * 0.08;
      draw();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (reduceMotion) { draw(); return; }
      if (raf) cancelAnimationFrame(raf);
      last = 0;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    initPoints();
    resize();
    start();

    canvas.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / r.width;
      pointer.y = (e.clientY - r.top) / r.height;
      pointer.active = true;
    });
    canvas.addEventListener("pointerleave", function () {
      pointer.active = false;
    });

    var ro = "ResizeObserver" in window ? new ResizeObserver(function () {
      resize();
      if (reduceMotion) draw();
    }) : null;
    if (ro) ro.observe(host);
    else window.addEventListener("resize", function () { resize(); draw(); });

    if (hasIO) {
      var visIO = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
        else stop();
      }, { threshold: 0.05 });
      visIO.observe(canvas);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (visible) start();
    });

    document.addEventListener("sq:theme", function () {
      if (reduceMotion) draw();
    });
  })();
})();
