/**
 * Lightweight Fullscreen Confetti Particle System
 */
class ConfettiEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  fire(durationMs = 3500) {
    const colors = ['#f5b041', '#ffd700', '#00e5ff', '#ff3d71', '#9d4edd', '#00e676', '#ffffff'];
    const particleCount = 120;
    this.particles = [];

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: this.canvas.height * 0.45,
        w: Math.random() * 9 + 5,
        h: Math.random() * 5 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.8) * 18 - 4,
        gravity: 0.35,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
        fadeSpeed: 0.006 + Math.random() * 0.005
      });
    }

    const startTime = performance.now();
    if (this.animationId) cancelAnimationFrame(this.animationId);

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      let activeParticles = 0;
      for (const p of this.particles) {
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.fadeSpeed;

        if (p.opacity > 0 && p.y < this.canvas.height + 50) {
          activeParticles++;
          this.ctx.save();
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate((p.rotation * Math.PI) / 180);
          this.ctx.fillStyle = p.color;
          this.ctx.globalAlpha = Math.max(0, p.opacity);
          this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          this.ctx.restore();
        }
      }

      if (activeParticles > 0 && elapsed < durationMs + 2000) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.animationId = null;
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }
}

window.Confetti = ConfettiEngine;
