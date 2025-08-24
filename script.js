// === Kira Visualizer (script.js) ===
// Particle-based rotating sphere with interactive sliders
// Modernized: requestAnimationFrame loop, cleaner particle system, extensible hooks

window.addEventListener("load", windowLoadHandler, false);

let sphereRad = 140;
let radius_sp = 1;

// Debug utility
const Debugger = {
  log: (msg) => {
    try {
      console.log(msg);
    } catch (e) {}
  }
};

function windowLoadHandler() {
  canvasApp();
}

function canvasSupport() {
  return !!window.HTMLCanvasElement;
}

function canvasApp() {
  if (!canvasSupport()) return;

  const theCanvas = document.getElementById("canvasOne");
  const context = theCanvas.getContext("2d");

  let displayWidth = theCanvas.width;
  let displayHeight = theCanvas.height;

  // === Config ===
  let particleAlpha = 1;
  let fLen = 320; // distance to z=0 plane
  let projCenterX = displayWidth / 2;
  let projCenterY = displayHeight / 2;
  let zMax = fLen - 2;
  let sphereCenterX = 0;
  let sphereCenterY = 0;
  let sphereCenterZ = -3 - sphereRad;
  let zeroAlphaDepth = -750;
  let turnSpeed = (2 * Math.PI) / 1200;
  let turnAngle = 0;

  let randAccelX = 0.1, randAccelY = 0.1, randAccelZ = 0.1;
  let gravity = 0; // adjust for floating effect
  let particleRad = 1.8;

  // === Particle System ===
  class Particle {
    constructor(x, y, z, vx, vy, vz) {
      this.x = x; this.y = y; this.z = z;
      this.velX = vx; this.velY = vy; this.velZ = vz;
      this.age = 0; this.dead = false;

      // Envelope parameters
      this.attack = 50;
      this.hold = 50;
      this.decay = 100;
      this.initValue = 0;
      this.holdValue = particleAlpha;
      this.lastValue = 0;
      this.alpha = 0;

      this.stuckTime = 90 + Math.random() * 20;
      this.accelX = 0; this.accelY = gravity; this.accelZ = 0;

      this.projX = 0; this.projY = 0;
    }

    update(sinAngle, cosAngle) {
      this.age++;

      if (this.age > this.stuckTime) {
        this.velX += this.accelX + randAccelX * (Math.random() * 2 - 1);
        this.velY += this.accelY + randAccelY * (Math.random() * 2 - 1);
        this.velZ += this.accelZ + randAccelZ * (Math.random() * 2 - 1);

        this.x += this.velX;
        this.y += this.velY;
        this.z += this.velZ;
      }

      // Rotate around Y-axis
      const rotX = cosAngle * this.x + sinAngle * (this.z - sphereCenterZ);
      const rotZ = -sinAngle * this.x + cosAngle * (this.z - sphereCenterZ) + sphereCenterZ;
      const m = radius_sp * fLen / (fLen - rotZ);

      this.projX = rotX * m + projCenterX;
      this.projY = this.y * m + projCenterY;

      // Update alpha (fade envelope)
      if (this.age < this.attack + this.hold + this.decay) {
        if (this.age < this.attack) {
          this.alpha = (this.holdValue - this.initValue) / this.attack * this.age + this.initValue;
        } else if (this.age < this.attack + this.hold) {
          this.alpha = this.holdValue;
        } else {
          this.alpha = (this.lastValue - this.holdValue) / this.decay * (this.age - this.attack - this.hold) + this.holdValue;
        }
      } else {
        this.dead = true;
      }

      return { m, rotZ };
    }
  }

  let particles = [];

  // === Init ===
  function init() {
    for (let i = 0; i < 300; i++) spawnParticle();
    requestAnimationFrame(onFrame);
  }

  function spawnParticle() {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(Math.random() * 2 - 1);

    const x0 = sphereRad * Math.sin(phi) * Math.cos(theta);
    const y0 = sphereRad * Math.sin(phi) * Math.sin(theta);
    const z0 = sphereRad * Math.cos(phi);

    const p = new Particle(
      x0,
      sphereCenterY + y0,
      sphereCenterZ + z0,
      0.002 * x0,
      0.002 * y0,
      0.002 * z0
    );
    particles.push(p);
  }

  // === Animation Loop ===
  function onFrame() {
    turnAngle = (turnAngle + turnSpeed) % (2 * Math.PI);
    const sinAngle = Math.sin(turnAngle);
    const cosAngle = Math.cos(turnAngle);

    context.fillStyle = "#000000";
    context.fillRect(0, 0, displayWidth, displayHeight);

    particles.forEach((p, i) => {
      const { m, rotZ } = p.update(sinAngle, cosAngle);

      // Remove if outside view or dead
      if (
        p.dead ||
        p.projX < 0 || p.projX > displayWidth ||
        p.projY < 0 || p.projY > displayHeight ||
        rotZ > zMax
      ) {
        particles[i] = spawnParticle();
        return;
      }

      // Depth-based darkening
      let depthAlphaFactor = 1 - rotZ / zeroAlphaDepth;
      depthAlphaFactor = Math.min(Math.max(depthAlphaFactor, 0), 1);

      // Dynamic color (blue to cyan pulse)
      const hue = (p.age + i) % 360;
      context.fillStyle = `hsla(${hue}, 80%, 60%, ${depthAlphaFactor * p.alpha})`;

      context.beginPath();
      context.arc(p.projX, p.projY, m * particleRad, 0, 2 * Math.PI, false);
      context.closePath();
      context.fill();
    });

    requestAnimationFrame(onFrame);
  }

  init();
}

// === Sliders ===
$(function () {
  $("#slider-range").slider({
    range: false,
    min: 20,
    max: 500,
    value: 280,
    slide: function (event, ui) {
      sphereRad = ui.value;
    }
  });
});

$(function () {
  $("#slider-test").slider({
    range: false,
    min: 1.0,
    max: 2.0,
    value: 1,
    step: 0.01,
    slide: function (event, ui) {
      radius_sp = ui.value;
    }
  });
});
