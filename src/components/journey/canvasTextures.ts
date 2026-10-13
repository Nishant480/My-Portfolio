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
      g.fillStyle = lit ? "#ffd27a" : warm ? "#f2b766" : "#4a5a70";
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

/** Podium front: white jali lattice panels in brown frames above a glazed ground floor. */
export function podiumTexture() {
  const [c, g] = canvas(1024, 512);
  g.fillStyle = "#f0c39c";
  g.fillRect(0, 0, 1024, 512);
  const panels = 4;
  const pw = 1024 / panels;
  for (let i = 0; i < panels; i++) {
    const x0 = i * pw + 14;
    const w = pw - 28;
    g.fillStyle = "#f6f3ee";
    g.fillRect(x0, 20, w, 250);
    // lattice of interlocking circles
    g.strokeStyle = "#d9c7b4";
    g.lineWidth = 3;
    for (let y = 36; y < 262; y += 26)
      for (let x = x0 + 14; x < x0 + w - 8; x += 26) {
        g.beginPath();
        g.arc(x, y, 12, 0, Math.PI * 2);
        g.stroke();
        g.beginPath();
        g.moveTo(x - 12, y);
        g.lineTo(x, y - 12);
        g.lineTo(x + 12, y);
        g.lineTo(x, y + 12);
        g.closePath();
        g.stroke();
      }
    g.strokeStyle = "#8a5a4a";
    g.lineWidth = 10;
    g.strokeRect(x0, 20, w, 250);
  }
  g.fillStyle = "#8a5a4a";
  g.fillRect(0, 282, 1024, 14);
  // ground floor: dark glazing between pillars
  for (let i = 0; i < 6; i++) {
    g.fillStyle = "#1b2633";
    g.fillRect(i * 170 + 30, 330, 110, 182);
    g.fillStyle = "rgba(120,160,200,0.25)";
    g.fillRect(i * 170 + 30, 330, 110, 10);
  }
  return finish(c);
}

/** Vertical blue curtain-wall glazing with mullions. */
export function glassTexture() {
  const [c, g] = canvas(128, 1024);
  const grad = g.createLinearGradient(0, 0, 128, 1024);
  grad.addColorStop(0, "#5d8fd6");
  grad.addColorStop(0.5, "#244f9a");
  grad.addColorStop(1, "#163a78");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 1024);
  g.strokeStyle = "rgba(20,30,50,0.8)";
  g.lineWidth = 3;
  for (let y = 0; y < 1024; y += 32) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke();
  }
  for (let x = 0; x <= 128; x += 42) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke();
  }
  return finish(c);
}

/** Steel mesh hostel door with the room number above it. */
export function doorTexture() {
  const [c, g] = canvas(256, 512);
  g.fillStyle = "#9aa0a6";
  g.fillRect(0, 0, 256, 512);
  for (let r = 0; r < 4; r++)
    for (let k = 0; k < 2; k++) {
      const x = 22 + k * 112;
      const y = 22 + r * 120 + (r >= 2 ? 14 : 0);
      g.fillStyle = "#4a4d50";
      g.fillRect(x, y, 100, 100);
      g.strokeStyle = "rgba(160,165,170,0.35)";
      g.lineWidth = 1;
      for (let i = 0; i < 100; i += 4) {
        g.beginPath(); g.moveTo(x + i, y); g.lineTo(x + i, y + 100); g.stroke();
        g.beginPath(); g.moveTo(x, y + i); g.lineTo(x + 100, y + i); g.stroke();
      }
    }
  g.fillStyle = "#d7dadd";
  g.fillRect(70, 252, 120, 10);
  g.fillRect(200, 248, 40, 18);
  return finish(c);
}

export function plateTexture(text: string) {
  const [c, g] = canvas(128, 64);
  g.fillStyle = "#c9ccd0";
  g.fillRect(0, 0, 128, 64);
  g.fillStyle = "#222";
  g.font = "bold 40px Helvetica, Arial, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 64, 34);
  return finish(c);
}

/** Spider-Man style poster (red/black) like the one on the wall. */
export function heroPosterTexture() {
  const [c, g] = canvas(300, 720);
  g.fillStyle = "#151515";
  g.fillRect(0, 0, 300, 720);
  g.fillStyle = "#c1121f";
  g.beginPath();
  g.ellipse(150, 360, 120, 200, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#111";
  g.lineWidth = 3;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    g.beginPath(); g.moveTo(150, 360); g.lineTo(150 + Math.cos(a) * 130, 360 + Math.sin(a) * 210); g.stroke();
  }
  for (let r = 40; r < 220; r += 40) {
    g.beginPath(); g.ellipse(150, 360, r * 0.6, r, 0, 0, Math.PI * 2); g.stroke();
  }
  g.fillStyle = "#f1f1f1";
  g.font = "bold 64px Impact, Arial Black, sans-serif";
  g.textAlign = "center";
  g.save();
  g.translate(60, 360);
  g.rotate(-Math.PI / 2);
  g.fillText("SPIDER-MAN", 0, 20);
  g.restore();
  return finish(c);
}

/** Glossy white floor tiles. */
export function tileTexture() {
  const [c, g] = canvas(512, 512);
  g.fillStyle = "#dedbd3";
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#bfbab0";
  g.lineWidth = 3;
  for (let i = 0; i <= 512; i += 128) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(512, i); g.stroke();
  }
  const t = finish(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2.5, 2.5);
  return t;
}
