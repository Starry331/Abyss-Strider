export class EffectManager {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
    }

    triggerShake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
    }

    spawnFloatingText(x, y, text, color) {
        this.floatingTexts.push({
            x, y, text, color,
            life: 1.0,
            vy: -50
        });
    }

    spawnParticle(x, y, color) {
        this.particles.push({
            x, y, color,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 0.5,
            size: Math.random() * 5 + 2
        });
    }
    
    // 打击特效：生成多个粒子
    spawnHitEffect(x, y, color = '#ffaa00') {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                color: color,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                life: 0.3,
                size: Math.random() * 6 + 3
            });
        }
    }

    update(deltaTime) {
        if (this.shakeTimer > 0) this.shakeTimer -= deltaTime;

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Update Floating Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y += t.vy * deltaTime;
            t.life -= deltaTime;
            if (t.life <= 0) this.floatingTexts.splice(i, 1);
        }
    }

    draw(ctx) {
        // Apply Shake
        if (this.shakeTimer > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.save();
            ctx.translate(dx, dy);
        }

        // Draw Particles
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 0.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Draw Floating Texts
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        this.floatingTexts.forEach(t => {
            ctx.fillStyle = t.color;
            ctx.globalAlpha = t.life; // Fade out
            ctx.fillText(t.text, t.x, t.y);
        });
        ctx.globalAlpha = 1.0;

        if (this.shakeTimer > 0) {
            ctx.restore();
        }
    }
}
