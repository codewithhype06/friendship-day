/* ==========================================================================
   CONSTELLATION FOR PRANJALI — SCRIPT
   Vanilla JS + GSAP. Loader, cursor, aurora sky, scroll reveals, gate,
   quiz, envelope, letter typewriter, constellation gallery, friendship
   meter, secret finale (confetti + fireworks).
   ========================================================================== */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  /* ------------------------------------------------------------------ */
  /* PHOTO LOADER — tries every common extension/case so the site never */
  /* breaks just because a file is named photo1.JPG vs photo1.jpeg etc. */
  /* ------------------------------------------------------------------ */
  function initPhotoFallbacks() {
    const candidates = ["jpeg", "jpg", "JPG", "JPEG", "png", "PNG", "webp", "WEBP"];
    document.querySelectorAll("img[data-photo]").forEach((img) => {
      const base = img.dataset.photo;
      let i = 0;
      function tryNext() {
        if (i >= candidates.length) {
          const holder = img.closest(".star-node, .reel-frame");
          if (holder) holder.classList.add("img-missing");
          img.removeEventListener("error", tryNext);
          return;
        }
        img.src = `${base}.${candidates[i]}`;
        i++;
      }
      img.addEventListener("error", tryNext);
      tryNext();
    });
  }

  /* ------------------------------------------------------------------ */
  /* SVG GRADIENT DEFS (injected once)                                   */
  /* ------------------------------------------------------------------ */
  function injectGradientDefs() {
    const linesSvg = document.getElementById("constellation-lines");
    if (linesSvg) {
      const ns = "http://www.w3.org/2000/svg";
      const defs = document.createElementNS(ns, "defs");
      defs.innerHTML = `
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F2B441"/>
          <stop offset="100%" stop-color="#2DD4BF"/>
        </linearGradient>`;
      linesSvg.appendChild(defs);
    }
    const meterFill = document.getElementById("meter-fill");
    if (meterFill) {
      const ns = "http://www.w3.org/2000/svg";
      const svg = meterFill.closest("svg");
      const defs = document.createElementNS(ns, "defs");
      defs.innerHTML = `
        <linearGradient id="meterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F2B441"/>
          <stop offset="100%" stop-color="#FF6F91"/>
        </linearGradient>`;
      svg.insertBefore(defs, svg.firstChild);
    }
  }

  /* ------------------------------------------------------------------ */
  /* CUSTOM CURSOR + HEART TRAIL                                        */
  /* ------------------------------------------------------------------ */
  function initCursor() {
    if (isTouch) return;
    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let lastTrail = 0;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;

      const now = performance.now();
      if (now - lastTrail > 90) {
        lastTrail = now;
        spawnHeart(mx, my);
      }
    });

    document.addEventListener("mouseover", (e) => {
      if (e.target.closest("button, a, .star-node, img")) ring.classList.add("is-active");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest("button, a, .star-node, img")) ring.classList.remove("is-active");
    });

    function raf() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(raf);
    }
    raf();

    function spawnHeart(x, y) {
      const el = document.createElement("div");
      el.className = "heart-trail";
      el.textContent = Math.random() > 0.5 ? "♥" : "✦";
      el.style.left = x + "px";
      el.style.top = y + "px";
      document.body.appendChild(el);
      const dx = (Math.random() - 0.5) * 40;
      if (window.gsap) {
        gsap.fromTo(
          el,
          { opacity: 0.8, scale: 0.6, x: 0, y: 0 },
          {
            opacity: 0,
            scale: 1.1,
            x: dx,
            y: -40 - Math.random() * 30,
            duration: 1.1,
            ease: "power1.out",
            onComplete: () => el.remove(),
          }
        );
      } else {
        setTimeout(() => el.remove(), 1000);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* SKY CANVAS — aurora blobs + twinkling starfield                    */
  /* ------------------------------------------------------------------ */
  function initSky() {
    const canvas = document.getElementById("sky-canvas");
    const ctx = canvas.getContext("2d");
    let w, h, dpr;
    let stars = [];
    let auroraT = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = document.documentElement.scrollHeight;
      canvas.width = w * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.floor((w * window.innerHeight) / 6000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.4 + 0.3,
        tw: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.008,
      }));
    }

    function draw() {
      const vh = window.innerHeight;
      ctx.clearRect(0, 0, w, vh);

      // aurora blobs (fixed viewport, parallax-free ambient glow)
      auroraT += reduceMotion ? 0 : 0.0018;
      const blobs = [
        { cx: 0.2 + Math.sin(auroraT) * 0.08, cy: 0.15, r: 0.55, color: "124,108,246" },
        { cx: 0.8 + Math.cos(auroraT * 0.8) * 0.08, cy: 0.3, r: 0.5, color: "45,212,191" },
        { cx: 0.5 + Math.sin(auroraT * 1.2) * 0.1, cy: 0.65, r: 0.6, color: "255,111,145" },
      ];
      blobs.forEach((b) => {
        const grad = ctx.createRadialGradient(
          b.cx * w, b.cy * vh, 0,
          b.cx * w, b.cy * vh, b.r * Math.max(w, vh)
        );
        grad.addColorStop(0, `rgba(${b.color},0.18)`);
        grad.addColorStop(1, `rgba(${b.color},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, vh);
      });

      // stars twinkle
      stars.forEach((s) => {
        s.tw += s.speed;
        const alpha = 0.35 + Math.sin(s.tw) * 0.35 + 0.3;
        ctx.beginPath();
        ctx.fillStyle = `rgba(245,243,255,${Math.max(0.15, Math.min(1, alpha))})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    // update canvas offset with scroll using CSS position fixed already; redraw uses viewport-relative coords
    draw();
  }

  /* ------------------------------------------------------------------ */
  /* LOADER                                                              */
  /* ------------------------------------------------------------------ */
  function initLoader(done) {
    const loader = document.getElementById("loader");
    const fill = document.getElementById("loader-fill");
    const num = document.getElementById("loader-percent-num");
    let progress = 0;

    const timer = setInterval(() => {
      progress += Math.random() * 14 + 6;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
        fill.style.width = "100%";
        num.textContent = "100";
        setTimeout(() => {
          loader.classList.add("is-hidden");
          done && done();
        }, 350);
        return;
      }
      fill.style.width = progress + "%";
      num.textContent = Math.floor(progress);
    }, 180);
  }

  /* ------------------------------------------------------------------ */
  /* SCROLL REVEALS + RAIL NAV                                           */
  /* ------------------------------------------------------------------ */
  function initReveals() {
    const revealEls = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const siblings = Array.from(entry.target.parentElement.querySelectorAll("[data-reveal]"));
            const idx = siblings.indexOf(entry.target);
            setTimeout(() => entry.target.classList.add("is-in"), idx * 90);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    revealEls.forEach((el) => io.observe(el));

    // rail nav
    const scenes = document.querySelectorAll(".scene");
    const dots = document.querySelectorAll(".rail-dot");
    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        document.getElementById(dot.dataset.target).scrollIntoView({ behavior: "smooth" });
      });
    });
    const sceneIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            dots.forEach((d) => d.classList.remove("is-active"));
            const active = document.querySelector(`.rail-dot[data-target="${entry.target.id}"]`);
            if (active) active.classList.add("is-active");
          }
        });
      },
      { threshold: 0.5 }
    );
    scenes.forEach((s) => sceneIO.observe(s));
  }

  /* ------------------------------------------------------------------ */
  /* SCROLL BUTTONS                                                      */
  /* ------------------------------------------------------------------ */
  function initScrollButtons() {
    const beginBtn = document.getElementById("begin-btn");
    beginBtn.addEventListener("click", () => {
      document.getElementById("gate").scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ------------------------------------------------------------------ */
  /* FRIENDSHIP SCORE (shared state feeding the meter)                   */
  /* ------------------------------------------------------------------ */
  const Score = {
    total: 0,
    max: 5 + 12 + 12 + 14, // 5 stars * 5pts base handled separately; quiz max approximated below
    quizMax: 12 + 12 + 14,
    quizScore: 0,
    starsLit: 0,
    starsMax: 5,
    add(points) {
      this.quizScore += points;
      this.update();
    },
    litStar() {
      this.starsLit += 1;
      this.update();
    },
    update() {
  updateMeter(100);
},
  };

  function updateMeter(pct) {
    const fill = document.getElementById("meter-fill");
    const num = document.getElementById("meter-num");
    const caption = document.getElementById("meter-caption");
    const btn = document.getElementById("reveal-secret-btn");
    if (!fill) return;
    const circumference = 540;
    const offset = circumference - (circumference * pct) / 100;
    fill.style.strokeDashoffset = offset;
    num.textContent = pct;
    if (pct >= 100) {
      caption.textContent = "Maximum brightness reached. The sky is ready.";
      btn.disabled = false;
    } else if (pct >= 60) {
      caption.textContent = "Almost there — a few more moments of light.";
    } else if (pct > 0) {
      caption.textContent = "Gathering light from everything you answered…";
    }
  }

  /* ------------------------------------------------------------------ */
  /* GATE — dodging button                                              */
  /* ------------------------------------------------------------------ */
  function initGate() {
    const stage = document.querySelector(".gate-stage");
    const btn = document.getElementById("dodge-btn");
    const countEl = document.getElementById("dodge-count");
    const giveUp = document.getElementById("gate-give-up");
    const copy = document.getElementById("gate-copy");
    const hint = document.getElementById("gate-hint");
    let dodges = 0;
    const maxDodges = 4;
    const lines = [
      "Should be easy, right?",
      "Oh, almost! Try again.",
      "Getting sneaky now, huh?",
      "Okay this button has trust issues.",
      "Fine. FINE. You win.",
    ];

    function dodge() {
      if (isTouch) return; // don't dodge on touch, just let them tap through
      dodges++;
      countEl.textContent = dodges;
      copy.textContent = lines[Math.min(dodges, lines.length - 1)];
      if (dodges >= maxDodges) {
        btn.textContent = "Alright, you got me →";
        btn.style.pointerEvents = "none";
        setTimeout(() => passGate(), 500);
        return;
      }
      const stageRect = stage.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const maxX = stageRect.width - btnRect.width;
      const maxY = stageRect.height - btnRect.height;
      const nx = Math.random() * maxX - maxX / 2;
      const ny = Math.random() * maxY - maxY / 2;
      btn.style.transform = `translate(${nx}px, ${ny}px)`;
    }

    btn.addEventListener("mouseenter", dodge);
    btn.addEventListener("click", () => {
      if (isTouch) passGate();
    });
    giveUp.addEventListener("click", passGate);

    setTimeout(() => {
      giveUp.style.display = "inline-block";
    }, 4000);

    function passGate() {
      hint.textContent = "gate cleared ✦";
      copy.textContent = "Okay, you clearly qualify. Let's continue.";
      setTimeout(() => {
        document.getElementById("questions").scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  }

  /* ------------------------------------------------------------------ */
  /* QUIZ                                                                */
  /* ------------------------------------------------------------------ */
  function initQuiz() {
    const cards = document.querySelectorAll(".quiz-card");
    const done = document.getElementById("quiz-done");

    cards.forEach((card, idx) => {
      const options = card.querySelectorAll(".quiz-options button");
      options.forEach((opt) => {
        opt.addEventListener("click", () => {
          if (card.classList.contains("is-answered")) return;
          card.classList.add("is-answered");
          options.forEach((o) => (o.disabled = true));
          opt.classList.add("is-picked");
          Score.add(parseInt(opt.dataset.glow, 10));

          setTimeout(() => {
            card.hidden = true;
            const next = cards[idx + 1];
            if (next) {
              next.hidden = false;
            } else {
              done.hidden = false;
              setTimeout(() => {
                document.getElementById("envelope").scrollIntoView({ behavior: "smooth" });
              }, 900);
            }
          }, 550);
        });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* ENVELOPE                                                            */
  /* ------------------------------------------------------------------ */
  function initEnvelope() {
    const envelope = document.getElementById("envelope-obj");
    const seal = document.getElementById("envelope-seal");
    seal.addEventListener("click", () => {
      if (envelope.classList.contains("is-open")) return;
      envelope.classList.add("is-open");
      burstConfettiAt(seal, 24);
      setTimeout(() => {
        document.getElementById("letter").scrollIntoView({ behavior: "smooth" });
      }, 1100);
    });
  }

  /* ------------------------------------------------------------------ */
  /* LETTER — line-by-line reveal                                        */
  /* ------------------------------------------------------------------ */
  function initLetter() {
    const lines = document.querySelectorAll("#letter-body [data-line]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            io.unobserve(entry.target);
            const allLines = Array.from(lines);
            const idx = allLines.indexOf(entry.target);
            setTimeout(() => entry.target.classList.add("is-in"), idx * 260);
          }
        });
      },
      { threshold: 0.3 }
    );
    lines.forEach((l) => io.observe(l));
  }

  /* ------------------------------------------------------------------ */
  /* CONSTELLATION GALLERY                                               */
  /* ------------------------------------------------------------------ */
  function initGallery() {
    const wrap = document.getElementById("constellation");
    const nodes = Array.from(document.querySelectorAll(".star-node"));
    const svg = document.getElementById("constellation-lines");
    const quoteEl = document.getElementById("constellation-quote");
    let litOrder = [];

    function updateViewBox() {
      const rect = wrap.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    }
    updateViewBox();
    window.addEventListener("resize", updateViewBox);

    function nodeCenter(node) {
      const rect = node.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      return {
        x: rect.left - wrapRect.left + rect.width / 2,
        y: rect.top - wrapRect.top + rect.height / 2,
      };
    }

    function drawLine(a, b) {
      const ns = "http://www.w3.org/2000/svg";
      const p1 = nodeCenter(a);
      const p2 = nodeCenter(b);
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`);
      svg.appendChild(path);
      requestAnimationFrame(() => path.classList.add("is-drawn"));
    }

    nodes.forEach((node) => {
      node.addEventListener("click", () => {
        if (node.classList.contains("is-lit")) return;
        node.classList.add("is-lit");
        quoteEl.style.opacity = 0;
        setTimeout(() => {
          quoteEl.textContent = "“" + node.dataset.quote + "”";
          quoteEl.style.opacity = 1;
        }, 220);

        if (litOrder.length > 0) {
          drawLine(litOrder[litOrder.length - 1], node);
        }
        litOrder.push(node);
        Score.litStar();
        burstConfettiAt(node, 10);

        if (litOrder.length === nodes.length) {
          // close the loop back to the first star to complete the constellation
          drawLine(litOrder[litOrder.length - 1], litOrder[0]);
          setTimeout(() => {
            quoteEl.textContent = "Five stars, one constellation. It was always shaped like her.";
            document.getElementById("meter").scrollIntoView({ behavior: "smooth" });
          }, 900);
        }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* SECRET / FINALE                                                     */
  /* ------------------------------------------------------------------ */
  function initSecret() {
    const revealBtn = document.getElementById("reveal-secret-btn");
    revealBtn.addEventListener("click", () => {
      document.getElementById("secret").scrollIntoView({ behavior: "smooth" });
    });

    const finaleBtn = document.getElementById("finale-btn");
    const overlay = document.getElementById("finale-overlay");
    const closeBtn = document.getElementById("finale-close");

    finaleBtn.addEventListener("click", () => {
      overlay.classList.add("is-visible");
      startFireworks();
      startConfettiRain();
      const music = document.getElementById("bg-music");
      if (music.paused) {
        music.play().catch(() => {});
        setMusicUI(true);
      }
    });

    closeBtn.addEventListener("click", () => {
      overlay.classList.remove("is-visible");
      stopFireworks();
      stopConfettiRain();
    });
  }

  /* ------------------------------------------------------------------ */
  /* MUSIC TOGGLE                                                        */
  /* ------------------------------------------------------------------ */
  function setMusicUI(playing) {
    const toggle = document.getElementById("music-toggle");
    const iconPlay = document.getElementById("music-icon-play");
    const iconPause = document.getElementById("music-icon-pause");
    toggle.classList.toggle("is-playing", playing);
    iconPlay.style.display = playing ? "none" : "block";
    iconPause.style.display = playing ? "block" : "none";
  }

  function initMusic() {
    const toggle = document.getElementById("music-toggle");
    const music = document.getElementById("bg-music");
    toggle.addEventListener("click", () => {
      if (music.paused) {
        music.play().catch(() => {});
        setMusicUI(true);
      } else {
        music.pause();
        setMusicUI(false);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* CONFETTI — small bursts (DOM-canvas hybrid, reused for finale rain) */
  /* ------------------------------------------------------------------ */
  const confettiColors = ["#F2B441", "#FF6F91", "#7C6CF6", "#2DD4BF", "#F5F3FF"];

  function burstConfettiAt(el, count) {
    if (reduceMotion) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("div");
      piece.style.position = "fixed";
      piece.style.left = cx + "px";
      piece.style.top = cy + "px";
      piece.style.width = "6px";
      piece.style.height = "10px";
      piece.style.background = confettiColors[i % confettiColors.length];
      piece.style.zIndex = "300";
      piece.style.borderRadius = "2px";
      piece.style.pointerEvents = "none";
      document.body.appendChild(piece);

      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 90;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 40;
      const rot = Math.random() * 720 - 360;

      if (window.gsap) {
        gsap.to(piece, {
          x: dx,
          y: dy,
          rotation: rot,
          opacity: 0,
          duration: 1 + Math.random() * 0.6,
          ease: "power2.out",
          onComplete: () => piece.remove(),
        });
      } else {
        setTimeout(() => piece.remove(), 1200);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* FIREWORKS CANVAS                                                    */
  /* ------------------------------------------------------------------ */
  let fireworksRAF = null;
  function startFireworks() {
    const canvas = document.getElementById("fireworks-canvas");
    const ctx = canvas.getContext("2d");
    let w, h;
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    let particles = [];
    let lastLaunch = 0;

    function launch() {
      const x = Math.random() * w * 0.8 + w * 0.1;
      const y = Math.random() * h * 0.35 + h * 0.1;
      const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      const count = 46;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = Math.random() * 3.4 + 1.6;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color,
        });
      }
    }

    function tick(t) {
      ctx.fillStyle = "rgba(5,6,26,0.22)";
      ctx.fillRect(0, 0, w, h);

      if (t - lastLaunch > 750) {
        lastLaunch = t;
        launch();
      }

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.life -= 0.014;
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      particles = particles.filter((p) => p.life > 0);

      fireworksRAF = requestAnimationFrame(tick);
    }
    fireworksRAF = requestAnimationFrame(tick);
    canvas._resizeHandler = resize;
  }
  function stopFireworks() {
    if (fireworksRAF) cancelAnimationFrame(fireworksRAF);
    fireworksRAF = null;
    const canvas = document.getElementById("fireworks-canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /* ------------------------------------------------------------------ */
  /* CONFETTI RAIN CANVAS (finale)                                       */
  /* ------------------------------------------------------------------ */
  let confettiRAF = null;
  function startConfettiRain() {
    const canvas = document.getElementById("confetti-canvas");
    const ctx = canvas.getContext("2d");
    let w, h;
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    let pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * w,
      y: Math.random() * -h,
      s: Math.random() * 6 + 4,
      speed: Math.random() * 2 + 1.5,
      drift: Math.random() * 1 - 0.5,
      rot: Math.random() * 360,
      rotSpeed: Math.random() * 6 - 3,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    }));

    function tick() {
      ctx.clearRect(0, 0, w, h);
      pieces.forEach((p) => {
        p.y += p.speed;
        p.x += p.drift;
        p.rot += p.rotSpeed;
        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      });
      confettiRAF = requestAnimationFrame(tick);
    }
    confettiRAF = requestAnimationFrame(tick);
  }
  function stopConfettiRain() {
    if (confettiRAF) cancelAnimationFrame(confettiRAF);
    confettiRAF = null;
    const canvas = document.getElementById("confetti-canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /* ------------------------------------------------------------------ */
  /* INIT                                                                */
  /* ------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", () => {
    initPhotoFallbacks();
    injectGradientDefs();
    initCursor();
    initSky();
    initReveals();
    initScrollButtons();
    initGate();
    initQuiz();
    initEnvelope();
    initLetter();
    initGallery();
    initSecret();
    initMusic();

    initLoader(() => {
      if (window.gsap) {
        gsap.fromTo(
          "#welcome [data-reveal]",
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: "power3.out", delay: 0.1 }
        );
      } else {
        document.querySelectorAll("#welcome [data-reveal]").forEach((el, i) => {
          setTimeout(() => el.classList.add("is-in"), i * 120);
        });
      }
    });
  });
})();
