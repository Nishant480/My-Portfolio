import * as THREE from "three";

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function finish(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Hall name board above the entrance. */
export function signTexture(lines: string[]) {
  const [c, g] = canvas(1024, 256);
  g.fillStyle = "#1b2a4a";
  g.fillRect(0, 0, 1024, 256);
  g.strokeStyle = "#e9c46a";
  g.lineWidth = 10;
  g.strokeRect(12, 12, 1000, 232);
  g.fillStyle = "#f8f1e0";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "bold 64px Georgia, serif";
  g.fillText(lines[0] ?? "", 512, 100);
  g.font = "36px Georgia, serif";
  g.fillStyle = "#e9c46a";
  g.fillText(lines[1] ?? "", 512, 180);
  return finish(c);
}

/** Facade with a grid of windows; one window (the owner's room) glows. */
export function facadeTexture(cols: number, rows: number, litCol: number, litRow: number, wall = "#c96f4a") {
  const W = 1024;
  const H = Math.round((W / cols) * rows * 0.9);
  const [c, g] = canvas(W, H);
  g.fillStyle = wall;
  g.fillRect(0, 0, W, H);
  const cw = W / cols;
  const rh = H / rows;
  for (let y = 0; y < rows; y++) {
    g.fillStyle = "rgba(0,0,0,0.12)";
    g.fillRect(0, y * rh + rh - 6, W, 6);
    for (let x = 0; x < cols; x++) {
      const lit = x === litCol && y === litRow;
      const warm = !lit && (x * 7 + y * 13) % 5 === 0;
      g.fillStyle = lit ? "#ffd27a" : warm ? "#f2b766" : "#2d3a4f";
      g.fillRect(x * cw + cw * 0.22, y * rh + rh * 0.2, cw * 0.56, rh * 0.55);
      g.fillStyle = "rgba(255,255,255,0.25)";
      g.fillRect(x * cw + cw * 0.22, y * rh + rh * 0.2, cw * 0.56, 3);
    }
  }
  return finish(c);
}

/** Glow mask matching facadeTexture, used as an emissive map so lit windows shine at dusk. */
export function facadeEmissive(cols: number, rows: number, litCol: number, litRow: number) {
  const W = 1024;
  const H = Math.round((W / cols) * rows * 0.9);
  const [c, g] = canvas(W, H);
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
  const cw = W / cols;
  const rh = H / rows;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const lit = x === litCol && y === litRow;
      const warm = !lit && (x * 7 + y * 13) % 5 === 0;
      if (!lit && !warm) continue;
      g.fillStyle = lit ? "#ffcf6e" : "#8a5a22";
      g.fillRect(x * cw + cw * 0.22, y * rh + rh * 0.2, cw * 0.56, rh * 0.55);
    }
  return finish(c);
}

/** Poster on the room wall. */
export function posterTexture(title: string, sub: string, hue = 200) {
  const [c, g] = canvas(512, 720);
  const grad = g.createLinearGradient(0, 0, 512, 720);
  grad.addColorStop(0, `hsl(${hue} 70% 30%)`);
  grad.addColorStop(1, `hsl(${hue + 60} 70% 18%)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 720);
  g.strokeStyle = "rgba(255,255,255,0.4)";
  g.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    g.beginPath();
    g.arc(256, 300, 60 + i * 28, 0, Math.PI * 2);
    g.stroke();
  }
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.font = "bold 64px Helvetica, Arial, sans-serif";
  g.fillText(title, 256, 560);
  g.font = "28px Helvetica, Arial, sans-serif";
  g.fillStyle = "rgba(255,255,255,0.75)";
  g.fillText(sub, 256, 610);
  return finish(c);
}

/** Laptop screen preview shown before the live site takes over the screen. */
export function screenTexture(name: string, headline: string) {
  const [c, g] = canvas(1280, 800);
  const grad = g.createRadialGradient(900, 200, 50, 640, 400, 900);
  grad.addColorStop(0, "#1e1b4b");
  grad.addColorStop(1, "#05060a");
  g.fillStyle = grad;
  g.fillRect(0, 0, 1280, 800);
  g.fillStyle = "#a5b4fc";
  g.font = "28px Helvetica, Arial, sans-serif";
  g.fillText("PORTFOLIO", 100, 300);
  g.fillStyle = "#ffffff";
  g.font = "bold 110px Helvetica, Arial, sans-serif";
  g.fillText(name, 100, 420);
  g.fillStyle = "rgba(255,255,255,0.7)";
  g.font = "36px Helvetica, Arial, sans-serif";
  g.fillText(headline, 100, 490);
  return finish(c);
}

/** Night sky seen through the window. */
export function nightSkyTexture() {
  const [c, g] = canvas(512, 512);
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#0b1026");
  grad.addColorStop(1, "#2b2d5c");
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 140; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.8 + 0.2})`;
    g.fillRect(Math.random() * 512, Math.random() * 380, 1.5, 1.5);
  }
  g.fillStyle = "#fdf6d8";
  g.shadowColor = "#fdf6d8";
  g.shadowBlur = 30;
  g.beginPath();
  g.arc(380, 120, 34, 0, Math.PI * 2);
  g.fill();
  g.shadowBlur = 0;
  g.fillStyle = "#0e1424";
  for (let x = 0; x < 512; x += 40) {
    const h = 60 + ((x * 37) % 70);
    g.beginPath();
    g.ellipse(x + 20, 512 - h / 3, 34, h / 1.6, 0, 0, Math.PI * 2);
    g.fill();
  }
  return finish(c);
}
