(function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
})();

(function initRevenueMap() {
  const canvas = document.getElementById("revenue-map");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 0;
  let height = 0;
  let frame = 0;
  let points = [];
  let streams = [];
  let animationId = null;

  const colors = {
    bone: "rgba(255, 253, 247, 0.78)",
    faint: "rgba(255, 253, 247, 0.11)",
    grid: "rgba(214, 176, 107, 0.105)",
    bronze: "rgba(214, 176, 107, 0.88)",
    bronzeDim: "rgba(184, 135, 70, 0.34)",
    steel: "rgba(109, 127, 124, 0.45)",
    oxblood: "rgba(141, 51, 41, 0.84)",
    panel: "rgba(20, 17, 15, 0.58)"
  };

  function seeded(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    streams = Array.from({ length: Math.max(18, Math.floor(width / 48)) }, (_, i) => ({
      x: width * 0.43 + i * 42 + seeded(i + 11) * 18,
      y: -seeded(i + 29) * height,
      speed: 0.45 + seeded(i + 41) * 1.35,
      seed: i * 13
    })).filter((stream) => stream.x < width + 80);

    points = Array.from({ length: 118 }, (_, i) => {
      const px = width * (0.48 + seeded(i + 3) * 0.43);
      const py = height * (0.18 + seeded(i + 97) * 0.58);
      const value = 35 + Math.round(seeded(i + 211) * 70);
      const confidence = 30 + Math.round(seeded(i + 337) * 68);
      const highValue = value > 86 && confidence > 72;
      return {
        x: px,
        y: py,
        value,
        confidence,
        highValue,
        label: ["MATCH", "ROUTE", "PRICE", "BID", "LTV", "RISK"][i % 6]
      };
    });

    points.push(
      { x: width * 0.68, y: height * 0.29, value: 94, confidence: 86, highValue: true, label: "MATCH" },
      { x: width * 0.80, y: height * 0.43, value: 91, confidence: 82, highValue: true, label: "BID" },
      { x: width * 0.73, y: height * 0.62, value: 88, confidence: 91, highValue: true, label: "PRICE" }
    );
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 44) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDataRain() {
    const alphabet = "010101$%LRVMCBIDROUTEPRICE";
    ctx.save();
    ctx.font = "700 11px IBM Plex Mono, monospace";
    streams.forEach((stream, streamIndex) => {
      const yOffset = reducedMotion ? stream.y : (stream.y + frame * stream.speed) % (height + 240);
      for (let j = 0; j < 18; j += 1) {
        const y = yOffset - j * 18;
        if (y < -20 || y > height + 20) continue;
        const char = alphabet[Math.floor(seeded(stream.seed + j * 7 + streamIndex) * alphabet.length)];
        const alpha = Math.max(0.04, 0.36 - j * 0.015);
        ctx.fillStyle = `rgba(214, 176, 107, ${alpha})`;
        ctx.fillText(char, stream.x, y);
      }
    });
    ctx.restore();
  }

  function drawPlot() {
    const left = width * 0.50;
    const top = height * 0.18;
    const plotWidth = width * 0.42;
    const plotHeight = height * 0.58;

    ctx.save();
    ctx.fillStyle = "rgba(20, 17, 15, 0.42)";
    ctx.strokeStyle = "rgba(214, 176, 107, 0.18)";
    ctx.lineWidth = 1;
    ctx.fillRect(left, top, plotWidth, plotHeight);
    ctx.strokeRect(left, top, plotWidth, plotHeight);

    ctx.strokeStyle = "rgba(255, 253, 247, 0.08)";
    for (let i = 1; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(left + (plotWidth / 5) * i, top);
      ctx.lineTo(left + (plotWidth / 5) * i, top + plotHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(left, top + (plotHeight / 5) * i);
      ctx.lineTo(left + plotWidth, top + (plotHeight / 5) * i);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255, 253, 247, 0.42)";
    ctx.font = "700 10px IBM Plex Mono, monospace";
    ctx.fillText("CONFIDENCE", left, top - 14);
    ctx.save();
    ctx.translate(left + plotWidth + 18, top + plotHeight);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("REVENUE VALUE", 0, 0);
    ctx.restore();

    const frontier = points
      .filter((point) => point.highValue)
      .sort((a, b) => a.x - b.x);

    ctx.strokeStyle = colors.bronzeDim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    frontier.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    points.forEach((point) => {
      const radius = point.highValue ? 4.2 : 2;
      ctx.fillStyle = point.highValue ? colors.bronze : "rgba(255, 253, 247, 0.24)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  function drawScanLine() {
    const startX = width * 0.49;
    const travel = width * 0.43;
    const scanX = reducedMotion ? width * 0.77 : startX + ((frame % 360) / 360) * travel;
    const top = height * 0.15;
    const bottom = height * 0.80;

    const gradient = ctx.createLinearGradient(scanX - 80, 0, scanX + 12, 0);
    gradient.addColorStop(0, "rgba(214, 176, 107, 0)");
    gradient.addColorStop(1, "rgba(214, 176, 107, 0.17)");

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(scanX - 80, top, 92, bottom - top);

    ctx.strokeStyle = "rgba(214, 176, 107, 0.82)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(scanX, top);
    ctx.lineTo(scanX, bottom);
    ctx.stroke();

    ctx.fillStyle = "rgba(214, 176, 107, 0.66)";
    ctx.font = "700 10px IBM Plex Mono, monospace";
    ctx.fillText("SCANNING TRANSACTION HISTORY", scanX - 78, top - 12);
    ctx.restore();
  }

  function drawReticle(point, index) {
    const pulse = reducedMotion ? 0 : Math.sin(frame * 0.05 + index) * 4;
    const size = 30 + pulse;
    const corner = 11;

    ctx.save();
    ctx.strokeStyle = index === 1 ? colors.oxblood : colors.bronze;
    ctx.lineWidth = 2;

    [
      [point.x - size, point.y - size, corner, 0, 0, corner],
      [point.x + size, point.y - size, -corner, 0, 0, corner],
      [point.x - size, point.y + size, corner, 0, 0, -corner],
      [point.x + size, point.y + size, -corner, 0, 0, -corner]
    ].forEach(([x, y, x2, y2, x3, y3]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + y3);
      ctx.lineTo(x, y);
      ctx.lineTo(x + x2, y + y2);
      ctx.stroke();
    });

    ctx.fillStyle = colors.bone;
    ctx.font = "800 10px IBM Plex Mono, monospace";
    ctx.fillText(`TARGET 0${index + 1}`, point.x + size + 10, point.y - 14);

    ctx.fillStyle = colors.bronze;
    ctx.fillText(`${point.label}  VALUE ${point.value}`, point.x + size + 10, point.y + 2);
    ctx.fillStyle = "rgba(255, 253, 247, 0.45)";
    ctx.fillText(`CONF ${point.confidence}  ACTIONABLE`, point.x + size + 10, point.y + 18);
    ctx.restore();
  }

  function drawConsole() {
    const x = width * 0.72;
    const y = height * 0.13;
    const w = width * 0.22;
    const h = 104;

    ctx.save();
    ctx.fillStyle = "rgba(20, 17, 15, 0.72)";
    ctx.strokeStyle = "rgba(214, 176, 107, 0.24)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    ctx.font = "800 10px IBM Plex Mono, monospace";
    ctx.fillStyle = colors.bronze;
    ctx.fillText("MODEL RUN 0487", x + 14, y + 22);
    ctx.fillStyle = colors.bone;
    ctx.fillText("HIGH-VALUE TARGETS    03", x + 14, y + 46);
    ctx.fillText("EST. LIFT WINDOW    12-31%", x + 14, y + 66);
    ctx.fillText("NEXT MOVE        VALIDATE", x + 14, y + 86);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    drawGrid();
    drawDataRain();
    drawPlot();
    drawScanLine();
    points.filter((point) => point.highValue).slice(-3).forEach(drawReticle);
    drawConsole();

    frame += 1;
    if (!reducedMotion) {
      animationId = requestAnimationFrame(draw);
    }
  }

  resize();
  draw();

  window.addEventListener("resize", () => {
    if (animationId) cancelAnimationFrame(animationId);
    resize();
    draw();
  });
})();
