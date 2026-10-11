import * as THREE from 'three';

// All textures are drawn on canvases at runtime, so the corridor ships with
// no image files apart from the avatar.

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function toTexture(canvas, repeat = false) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ---------------- concrete ---------------- */

export function concreteTexture({ base = '#b6b6b0', seed = 73, ties = true, joints = true } = {}) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const rnd = seeded(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 70; i++) {
    const x = rnd() * size, y = rnd() * size, r = 40 + rnd() * 140;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const shade = rnd() > 0.5 ? '255,255,250' : '60,62,58';
    g.addColorStop(0, `rgba(${shade},${0.04 + rnd() * 0.06})`);
    g.addColorStop(1, `rgba(${shade},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  for (let i = 0; i < 42000; i++) {
    const v = 90 + Math.floor(rnd() * 120);
    ctx.fillStyle = `rgba(${v},${v},${v - 4},${rnd() * 0.28})`;
    ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 1.5, 1 + rnd() * 1.5);
  }
  // tiny air pockets
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(40,40,38,${0.15 + rnd() * 0.25})`;
    ctx.beginPath();
    ctx.arc(rnd() * size, rnd() * size, 0.6 + rnd() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (joints) {
    ctx.strokeStyle = 'rgba(55,57,53,0.25)';
    ctx.lineWidth = 2;
    for (let p = 0; p <= size; p += size / 2) {
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    }
  }
  if (ties) {
    for (let x = size / 8; x < size; x += size / 4) {
      for (let y = size / 8; y < size; y += size / 4) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, 6);
        g.addColorStop(0, 'rgba(35,36,34,0.7)');
        g.addColorStop(0.6, 'rgba(35,36,34,0.35)');
        g.addColorStop(1, 'rgba(35,36,34,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  for (let i = 0; i < 12; i++) {
    const x = rnd() * size, w = 6 + rnd() * 16, h = 60 + rnd() * 160;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(70,68,60,0.12)');
    g.addColorStop(1, 'rgba(70,68,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, rnd() * size * 0.5, w, h);
  }
  return toTexture(canvas, true);
}

/* ---------------- labels / signs ---------------- */

export function labelTexture(lines, {
  width = 1024, height = 256, bg = '#1f2224', fg = '#f1efe8', accent = '#f2c12e',
  font = '"Archivo", sans-serif', mono = '"IBM Plex Mono", monospace', kind = 'sign',
} = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (kind === 'sign') {
    const [number, text] = lines;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, height, height);
    ctx.fillStyle = bg;
    ctx.font = `700 ${height * 0.46}px ${mono}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number, height / 2, height / 2 + 4);
    ctx.fillStyle = fg;
    ctx.textAlign = 'left';
    ctx.font = `700 ${height * 0.42}px ${font}`;
    ctx.fillText(text.toUpperCase(), height + height * 0.28, height / 2 + 4);
  } else if (kind === 'bubble') {
    const [title, sub] = lines;
    const r = 60, pad = 18, tail = 70;
    ctx.fillStyle = '#fbfaf6';
    ctx.strokeStyle = '#1c1f1d';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(pad, pad, width - pad * 2, height - pad * 2 - tail, r);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width * 0.62, height - pad - tail - 4);
    ctx.lineTo(width * 0.70, height - pad);
    ctx.lineTo(width * 0.74, height - pad - tail - 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(width * 0.62, height - pad - tail);
    ctx.lineTo(width * 0.70, height - pad);
    ctx.lineTo(width * 0.74, height - pad - tail);
    ctx.stroke();
    ctx.fillStyle = '#1c1f1d';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const inner = height - pad * 2 - tail;
    ctx.font = `800 ${inner * 0.3}px ${font}`;
    ctx.fillText(title, width / 2, pad + inner * 0.38);
    ctx.font = `500 ${inner * 0.15}px ${mono}`;
    ctx.fillStyle = '#5d625e';
    ctx.fillText(sub.toUpperCase(), width / 2, pad + inner * 0.7);
  } else {
    // plain caption plate
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = fg;
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${height * 0.36}px ${mono}`;
    ctx.fillText(lines[0].toUpperCase(), height * 0.3, height * 0.36);
    if (lines[1]) {
      ctx.globalAlpha = 0.7;
      ctx.font = `400 ${height * 0.24}px ${mono}`;
      ctx.fillText(lines[1], height * 0.3, height * 0.72);
      ctx.globalAlpha = 1;
    }
  }
  return toTexture(canvas);
}

/* ---------------- framed engineering drawings ---------------- */

const INK = '#22262a';

function sheet(ctx, w, h, title, scale) {
  ctx.fillStyle = '#f4f2eb';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(34,38,42,0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, w - 48, h - 48);
  // title block
  ctx.lineWidth = 2;
  ctx.strokeRect(24, h - 96, w - 48, 72);
  ctx.beginPath(); ctx.moveTo(w - 300, h - 96); ctx.lineTo(w - 300, h - 24); ctx.stroke();
  ctx.fillStyle = INK;
  ctx.textBaseline = 'middle';
  ctx.font = '700 30px "Archivo", sans-serif';
  ctx.fillText(title.toUpperCase(), 48, h - 60);
  ctx.font = '500 20px "IBM Plex Mono", monospace';
  ctx.fillText(scale, w - 280, h - 60);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function line(ctx, pts, width = 3) {
  ctx.lineWidth = width;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

function water(ctx, x0, x1, y) {
  ctx.lineWidth = 2;
  for (let row = 0; row < 3; row++) {
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 4) {
      const yy = y + row * 14 + Math.sin(x / 14 + row) * 3;
      if (x === x0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.globalAlpha = 0.5 - row * 0.12;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function ground(ctx, x0, x1, y) {
  line(ctx, [[x0, y], [x1, y]], 3);
  ctx.lineWidth = 1.5;
  for (let x = x0; x < x1; x += 16) {
    ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.lineTo(x + 12, y); ctx.stroke();
  }
}

const DRAWINGS = {
  suspension(ctx) {
    const deck = 430;
    water(ctx, 40, 984, 520);
    line(ctx, [[40, deck], [984, deck]], 5);
    line(ctx, [[40, deck + 12], [984, deck + 12]], 2);
    [300, 724].forEach(x => {
      line(ctx, [[x - 14, 560], [x - 10, 130]], 5);
      line(ctx, [[x + 14, 560], [x + 10, 130]], 5);
      [180, 300, 400].forEach(y => line(ctx, [[x - 12, y], [x + 12, y]], 3));
    });
    const cable = x => 135 + 250 * (1 - ((x - 512) / 212) ** 2);
    const pts = [];
    for (let x = 300; x <= 724; x += 6) pts.push([x, cable(x)]);
    line(ctx, pts, 3);
    line(ctx, [[60, deck - 6], [180, 260], [300, 135]], 3);
    line(ctx, [[964, deck - 6], [844, 260], [724, 135]], 3);
    ctx.lineWidth = 1.2;
    for (let x = 316; x < 720; x += 16) { ctx.beginPath(); ctx.moveTo(x, cable(x)); ctx.lineTo(x, deck); ctx.stroke(); }
    for (let x = 80; x < 296; x += 16) { const y = 135 + (deck - 135) * (300 - x) / 240; ctx.beginPath(); ctx.moveTo(x, Math.min(y, deck)); ctx.lineTo(x, deck); ctx.stroke(); }
    for (let x = 740; x < 948; x += 16) { const y = 135 + (deck - 135) * (x - 724) / 240; ctx.beginPath(); ctx.moveTo(x, Math.min(y, deck)); ctx.lineTo(x, deck); ctx.stroke(); }
  },
  arch(ctx) {
    water(ctx, 40, 984, 540);
    ground(ctx, 40, 170, 470);
    ground(ctx, 854, 984, 470);
    line(ctx, [[40, 300], [984, 300]], 5);
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(512, 470, 342, 300, 0, Math.PI, 0); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(512, 470, 322, 282, 0, Math.PI, 0); ctx.stroke();
    ctx.lineWidth = 2;
    for (let x = 200; x <= 824; x += 32) {
      const t = (x - 512) / 342;
      const y = 470 - 300 * Math.sqrt(Math.max(0, 1 - t * t));
      ctx.beginPath(); ctx.moveTo(x, 300); ctx.lineTo(x, y); ctx.stroke();
    }
  },
  dam(ctx) {
    ground(ctx, 40, 984, 540);
    ctx.fillStyle = 'rgba(34,38,42,0.06)';
    ctx.beginPath(); ctx.moveTo(380, 120); ctx.lineTo(460, 120); ctx.lineTo(760, 540); ctx.lineTo(340, 540); ctx.closePath(); ctx.fill();
    line(ctx, [[380, 120], [460, 120], [760, 540], [340, 540], [370, 300], [380, 120]], 5);
    water(ctx, 60, 360, 170);
    ctx.fillStyle = 'rgba(70,110,150,0.12)';
    ctx.beginPath(); ctx.moveTo(60, 170); ctx.lineTo(372, 170); ctx.lineTo(350, 540); ctx.lineTo(60, 540); ctx.fill();
    ctx.strokeRect(430, 440, 40, 40);
    line(ctx, [[760, 540], [900, 540]], 3);
    water(ctx, 770, 980, 520);
    ctx.fillStyle = INK;
    ctx.font = '500 20px "IBM Plex Mono", monospace';
    ctx.fillText('▼ FRL 425.0', 80, 150);
    ctx.fillText('GALLERY', 480, 462);
    // grout curtain
    ctx.setLineDash([8, 8]);
    line(ctx, [[400, 540], [400, 610]], 2);
    ctx.setLineDash([]);
  },
  tower(ctx) {
    ground(ctx, 40, 984, 600);
    const floors = [];
    for (let y = 600; y > 120; y -= 18) floors.push(y);
    const half = y => (y > 400 ? 120 : y > 260 ? 92 : 64);
    floors.forEach(y => line(ctx, [[512 - half(y), y], [512 + half(y), y]], y % 90 === 0 ? 2.5 : 1));
    line(ctx, [[392, 600], [392, 400], [420, 400], [420, 260], [448, 260], [448, 112], [576, 112], [576, 260], [604, 260], [604, 400], [632, 400], [632, 600]], 5);
    line(ctx, [[512, 112], [512, 40]], 4);
    [250, 330, 760, 840].forEach((x, i) => {
      const top = 600 - (i % 2 ? 140 : 200);
      line(ctx, [[x - 40, 600], [x - 40, top], [x + 40, top], [x + 40, 600]], 3);
      for (let y = top + 20; y < 600; y += 20) line(ctx, [[x - 40, y], [x + 40, y]], 1);
    });
  },
  truss(ctx) {
    water(ctx, 40, 984, 520);
    const y0 = 420, y1 = 250, x0 = 90, x1 = 934, n = 10, d = (x1 - x0) / n;
    line(ctx, [[x0, y0], [x1, y0]], 6);
    line(ctx, [[x0 + d / 2, y1], [x1 - d / 2, y1]], 6);
    const zig = [];
    for (let i = 0; i <= n; i++) { zig.push([x0 + i * d, y0]); if (i < n) zig.push([x0 + i * d + d / 2, y1]); }
    line(ctx, zig, 4);
    for (let i = 1; i < n; i++) line(ctx, [[x0 + i * d, y0], [x0 + i * d, y1 + 10]], 1.5);
    [x0, x1].forEach(x => { ctx.strokeRect(x - 30, y0, 60, 120); });
    ctx.strokeRect(512 - 26, y0, 52, 130);
  },
  stayed(ctx) {
    water(ctx, 40, 984, 520);
    const deck = 420;
    line(ctx, [[40, deck], [984, deck]], 5);
    line(ctx, [[470, 560], [512, 90], [554, 560]], 6);
    line(ctx, [[486, 380], [538, 380]], 3);
    ctx.lineWidth = 1.6;
    for (let i = 1; i <= 11; i++) {
      const top = 120 + i * 9;
      ctx.beginPath(); ctx.moveTo(512, top); ctx.lineTo(512 - i * 40, deck); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(512, top); ctx.lineTo(512 + i * 40, deck); ctx.stroke();
    }
  },
  tunnel(ctx) {
    ctx.fillStyle = 'rgba(34,38,42,0.05)';
    ctx.fillRect(48, 48, 928, 520);
    ctx.fillStyle = '#f4f2eb';
    ctx.beginPath(); ctx.arc(512, 360, 230, Math.PI, 0); ctx.lineTo(742, 560); ctx.lineTo(282, 560); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(512, 360, 230, Math.PI, 0); ctx.lineTo(742, 560); ctx.moveTo(282, 560); ctx.lineTo(282, 360); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(512, 360, 200, Math.PI, 0); ctx.lineTo(712, 520); ctx.lineTo(312, 520); ctx.closePath(); ctx.stroke();
    ctx.lineWidth = 2;
    for (let a = Math.PI * 1.05; a < Math.PI * 1.96; a += Math.PI / 12) {
      ctx.beginPath(); ctx.moveTo(512 + Math.cos(a) * 232, 360 + Math.sin(a) * 232); ctx.lineTo(512 + Math.cos(a) * 320, 360 + Math.sin(a) * 320); ctx.stroke();
    }
    line(ctx, [[340, 500], [684, 500]], 2);
    ctx.setLineDash([16, 12]); line(ctx, [[512, 500], [512, 470]], 2); ctx.setLineDash([]);
  },
  portal(ctx) {
    ground(ctx, 40, 984, 560);
    const frames = [140, 300, 460, 620, 780];
    frames.forEach(x => {
      line(ctx, [[x, 560], [x, 330], [x + 80, 260], [x + 160, 330], [x + 160, 560]], 5);
    });
    line(ctx, [[140, 330], [940, 330]], 2);
    line(ctx, [[220, 260], [860, 260]], 2);
    for (let i = 0; i < frames.length; i += 2) {
      const x = frames[i];
      line(ctx, [[x, 560], [x + 160, 330]], 1.5);
      line(ctx, [[x + 160, 560], [x, 330]], 1.5);
    }
    ctx.fillStyle = INK;
    frames.forEach(x => { ctx.fillRect(x - 14, 556, 28, 8); ctx.fillRect(x + 146, 556, 28, 8); });
  },
};

export const STRUCTURES = [
  { type: 'suspension', title: 'Suspension bridge', scale: 'ELEVATION 1:2000', caption: 'Main span carried by parabolic cables' },
  { type: 'dam', title: 'Gravity dam', scale: 'SECTION 1:500', caption: 'Mass concrete resisting hydrostatic thrust' },
  { type: 'truss', title: 'Warren truss bridge', scale: 'ELEVATION 1:250', caption: 'Steel chords and diagonals in tension & compression' },
  { type: 'tower', title: 'High-rise tower', scale: 'ELEVATION 1:1000', caption: 'RC core with stepped setbacks' },
  { type: 'arch', title: 'Arch bridge', scale: 'ELEVATION 1:1000', caption: 'Thrust carried to abutments in compression' },
  { type: 'stayed', title: 'Cable-stayed bridge', scale: 'ELEVATION 1:1500', caption: 'Fan stays anchored to a single A-pylon' },
  { type: 'tunnel', title: 'NATM tunnel', scale: 'SECTION 1:100', caption: 'Shotcrete lining with radial rock bolts' },
  { type: 'portal', title: 'Steel portal frame', scale: 'ELEVATION 1:200', caption: 'Pitched rafters with cross bracing' },
];

export function structureTexture(item) {
  const w = 1024, h = 720;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  sheet(ctx, w, h, item.title, item.scale);
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  DRAWINGS[item.type](ctx);
  ctx.restore();
  return toTexture(canvas);
}
