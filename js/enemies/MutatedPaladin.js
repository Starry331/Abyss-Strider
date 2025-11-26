/**
 * Lv5 异化圣剑王 - 堕落骑士·莫德雷德
 * 独立设计，6个独特技能，独特外观
 */
export class MutatedPaladinBoss {
    constructor(x, y, player, combatSystem) {
        this.x = x; this.y = y; this.player = player; this.combatSystem = combatSystem;
        this.level = 5; this.name = '堕落骑士·莫德雷德'; this.isMutated = true;
        this.maxHp = Math.round(2000 * 1.5); this.hp = this.maxHp;
        this.radius = 58; this.color = '#330033'; this.damage = 40;
        this.critChance = 0.40; this.critMultiplier = 1.6;
        this.telegraphDuration = 0.6; this.attackCooldown = 0.9;
        this.state = 'IDLE'; this.timer = 0; this.currentSkill = null; this.phase = 1;
        this.dashTarget = { x: 0, y: 0 }; this.dashTrail = [];
        this.skills = ['DARK_SLASH', 'SHADOW_DASH', 'CORRUPTED_BLADE', 'PHANTOM_STRIKE', 'DARK_VORTEX', 'CURSE_MARK'];
        this.phase2Skills = [...this.skills, 'MORDRED_FURY', 'DARK_APOCALYPSE', 'CHAOS_DOMAIN'];
    }
    calcDamage(base) { return Math.random() < this.critChance ? { damage: Math.round(base * this.critMultiplier), isCrit: true } : { damage: base, isCrit: false }; }
    update(deltaTime) {
        this.dashTrail = this.dashTrail.filter(t => { t.life -= deltaTime; return t.life > 0; });
        if (this.state === 'IDLE') {
            const dx = this.player.x - this.x, dy = this.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 140) { this.x += (dx / dist) * 85 * deltaTime; this.y += (dy / dist) * 85 * deltaTime; }
        }
        switch (this.state) {
            case 'IDLE': this.timer += deltaTime;
                if (this.timer >= this.attackCooldown) { this.timer = 0; this.state = 'TELEGRAPH';
                    const skills = this.phase === 2 ? this.phase2Skills : this.skills;
                    this.currentSkill = skills[Math.floor(Math.random() * skills.length)];
                    if (this.currentSkill === 'SHADOW_DASH' || this.currentSkill === 'PHANTOM_STRIKE') 
                        this.dashTarget = { x: this.player.x, y: this.player.y };
                } break;
            case 'TELEGRAPH': this.timer += deltaTime;
                if (this.timer >= this.telegraphDuration) { this.timer = 0; this.state = 'ATTACK'; this.executeAttack(); } break;
            case 'ATTACK': this.timer += deltaTime;
                if (this.timer >= 0.5) { this.timer = 0; this.state = 'IDLE'; } break;
        }
        if (this.hp < this.maxHp * 0.5 && this.phase === 1) { this.phase = 2; this.telegraphDuration = 0.5; this.attackCooldown = 0.75; }
    }
    executeAttack() {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        switch (this.currentSkill) {
            case 'DARK_SLASH': for (let i = 0; i < 7; i++) { const a = angle + (i - 3) * 0.2; const crit = this.calcDamage(this.damage);
                this.combatSystem.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * 550, vy: Math.sin(a) * 550,
                    radius: 15, damage: crit.damage, owner: 'enemy', rotation: a, life: 1, isCrit: crit.isCrit,
                    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) { ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
                        ctx.fillStyle = this.isCrit ? '#ff00ff' : '#660066'; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 20;
                        ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(-12, -10); ctx.lineTo(-12, 10); ctx.closePath(); ctx.fill();
                        ctx.shadowBlur = 0; ctx.restore(); }
                }); } break;
            case 'SHADOW_DASH': const target = { ...this.dashTarget };
                for (let i = 0; i < 10; i++) { setTimeout(() => {
                    this.dashTrail.push({ x: this.x, y: this.y, life: 0.5 });
                    this.x += (target.x - this.x) / (10 - i); this.y += (target.y - this.y) / (10 - i);
                    const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                    if (dist < 65) this.player.takeDamage(this.calcDamage(this.damage * 1.2).damage);
                }, i * 30); }
                setTimeout(() => { for (let j = 0; j < 10; j++) { const sa = (Math.PI * 2 / 10) * j;
                    this.combatSystem.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(sa) * 400, vy: Math.sin(sa) * 400,
                        radius: 12, damage: this.damage * 0.8, owner: 'enemy', life: 0.8,
                        update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                        draw(ctx) { ctx.fillStyle = '#660066'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
                    }); } }, 350); break;
            case 'CORRUPTED_BLADE': for (let i = 0; i < 4; i++) { setTimeout(() => { const sa = angle + (i - 1.5) * 0.5;
                this.combatSystem.spawnProjectile({ x: this.x, y: this.y, speed: 300, radius: 20, damage: this.damage * 1.1, owner: 'enemy', life: 3,
                    player: this.player, angle: sa,
                    update(dt) { const dx = this.player.x - this.x, dy = this.player.y - this.y;
                        const ta = Math.atan2(dy, dx), diff = ta - this.angle;
                        this.angle += Math.sign(diff) * Math.min(Math.abs(diff), 2 * dt);
                        this.x += Math.cos(this.angle) * this.speed * dt; this.y += Math.sin(this.angle) * this.speed * dt;
                        this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) { ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
                        ctx.fillStyle = '#990099'; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 25;
                        ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(-15, -12); ctx.lineTo(-10, 0); ctx.lineTo(-15, 12); ctx.closePath(); ctx.fill();
                        ctx.shadowBlur = 0; ctx.restore(); }
                }); }, i * 200); } break;
            case 'PHANTOM_STRIKE': for (let b = 0; b < 6; b++) { setTimeout(() => {
                const ba = Math.random() * Math.PI * 2, bd = 80 + Math.random() * 80;
                this.dashTrail.push({ x: this.x, y: this.y, life: 0.4 });
                this.x = this.player.x + Math.cos(ba) * bd; this.y = this.player.y + Math.sin(ba) * bd;
                const aa = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                this.combatSystem.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(aa) * 650, vy: Math.sin(aa) * 650,
                    radius: 16, damage: this.damage * 0.9, owner: 'enemy', rotation: aa, life: 0.5,
                    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) { ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
                        ctx.fillStyle = '#cc00cc'; ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(-10, -10); ctx.lineTo(-10, 10); ctx.closePath(); ctx.fill(); ctx.restore(); }
                }); }, b * 180); } break;
            case 'DARK_VORTEX': this.combatSystem.spawnProjectile({ x: this.player.x, y: this.player.y, radius: 180, damage: 0, owner: 'enemy', life: 3, maxLife: 3,
                player: this.player, dmg: this.damage * 0.4,
                update(dt) { this.life -= dt;
                    const dx = this.x - this.player.x, dy = this.y - this.player.y, dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 15 && dist < this.radius) { this.player.x += (dx / dist) * 100 * dt; this.player.y += (dy / dist) * 100 * dt;
                        if (Math.random() < dt * 2) this.player.takeDamage(this.dmg); }
                    if (this.life <= 0) this.markedForDeletion = true; },
                draw(ctx) { const time = Date.now() / 1000, alpha = this.life / this.maxLife;
                    ctx.fillStyle = `rgba(51,0,51,${alpha * 0.5})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
                    for (let r = 0; r < 4; r++) { ctx.strokeStyle = `rgba(153,0,153,${alpha * (0.8 - r * 0.15)})`; ctx.lineWidth = 4 - r;
                        ctx.setLineDash([10, 5]); ctx.beginPath(); ctx.arc(this.x, this.y, this.radius - r * 30, time * 5 + r, time * 5 + r + Math.PI * 1.6); ctx.stroke(); }
                    ctx.setLineDash([]); }
            }); break;
            case 'CURSE_MARK': for (let i = 0; i < 5; i++) { const mx = this.player.x + (Math.random() - 0.5) * 300, my = this.player.y + (Math.random() - 0.5) * 300;
                this.combatSystem.spawnProjectile({ x: mx, y: my, radius: 50, damage: 0, owner: 'enemy', life: 1.5, maxLife: 1.5, dmg: this.damage * 1.5,
                    update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) { const alpha = this.life / this.maxLife, prog = 1 - alpha;
                        ctx.strokeStyle = `rgba(153,0,153,${alpha})`; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * prog, 0, Math.PI * 2); ctx.stroke();
                        if (prog > 0.9) { ctx.fillStyle = `rgba(255,0,255,${(prog - 0.9) * 10})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); } }
                });
                setTimeout(() => { const dist = Math.sqrt((this.player.x - mx) ** 2 + (this.player.y - my) ** 2);
                    if (dist < 60) this.player.takeDamage(this.damage * 1.5); }, 1500); } break;
            case 'MORDRED_FURY': if (this.player.screenShake) { this.player.screenShake.intensity = 25; this.player.screenShake.duration = 3; }
                for (let w = 0; w < 5; w++) { setTimeout(() => { for (let i = 0; i < 14; i++) { const a = (Math.PI * 2 / 14) * i + w * 0.15;
                    this.combatSystem.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * (380 + w * 40), vy: Math.sin(a) * (380 + w * 40),
                        radius: 14, damage: this.damage, owner: 'enemy', life: 1.2,
                        update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                        draw(ctx) { ctx.fillStyle = '#990099'; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 15;
                            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
                    }); } }, w * 150); } break;
            case 'DARK_APOCALYPSE': if (this.player.screenShake) { this.player.screenShake.intensity = 30; this.player.screenShake.duration = 4; }
                this.combatSystem.spawnProjectile({ x: this.x, y: this.y, radius: 250, damage: 0, owner: 'enemy', life: 2, maxLife: 2,
                    player: this.player, dmg: this.damage * 0.6,
                    update(dt) { this.life -= dt; const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                        if (dist < this.radius && Math.random() < dt * 3) this.player.takeDamage(this.dmg);
                        if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) { const time = Date.now() / 1000, alpha = this.life / this.maxLife;
                        ctx.fillStyle = `rgba(30,0,30,${alpha * 0.6})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
                        for (let i = 0; i < 12; i++) { const pa = time * 4 + i * 0.5;
                            ctx.strokeStyle = `rgba(255,0,255,${alpha * 0.6})`; ctx.lineWidth = 2;
                            ctx.beginPath(); ctx.moveTo(this.x, this.y);
                            ctx.lineTo(this.x + Math.cos(pa) * this.radius, this.y + Math.sin(pa) * this.radius); ctx.stroke(); } }
                }); break;
            case 'CHAOS_DOMAIN': this.combatSystem.spawnProjectile({ x: this.x, y: this.y, radius: 220, damage: 0, owner: 'enemy', life: 5, maxLife: 5, boss: this,
                update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                draw(ctx) { const time = Date.now() / 1000, alpha = this.life / this.maxLife;
                    ctx.fillStyle = `rgba(20,0,30,${alpha * 0.4})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = `rgba(153,0,153,${alpha * 0.8})`; ctx.lineWidth = 4; ctx.setLineDash([15, 10]);
                    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, time * 2, time * 2 + Math.PI * 1.5); ctx.stroke(); ctx.setLineDash([]); }
            }); break;
            default: for (let i = 0; i < 8; i++) { const a = angle + (i - 3.5) * 0.15;
                this.combatSystem.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * 450, vy: Math.sin(a) * 450,
                    radius: 12, damage: this.damage, owner: 'enemy', life: 1,
                    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) { ctx.fillStyle = '#660066'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
                }); } break;
        }
    }
    takeDamage(amount) { this.hp -= amount; if (this.hp <= 0) this.hp = 0; }
    draw(ctx) {
        const time = Date.now() / 1000, isRage = this.phase === 2;
        // 残影
        this.dashTrail.forEach(t => { ctx.fillStyle = `rgba(153,0,153,${t.life})`; ctx.beginPath(); ctx.arc(t.x, t.y, this.radius * 0.8, 0, Math.PI * 2); ctx.fill(); });
        // 黑暗光环
        const aura = ctx.createRadialGradient(this.x, this.y, this.radius * 0.3, this.x, this.y, this.radius * 2.8);
        aura.addColorStop(0, 'rgba(100,0,100,0.5)'); aura.addColorStop(0.5, 'rgba(50,0,50,0.25)'); aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2.8, 0, Math.PI * 2); ctx.fill();
        // 黑暗披风
        ctx.fillStyle = '#1a001a'; ctx.beginPath(); ctx.moveTo(this.x - 25, this.y - 10);
        ctx.quadraticCurveTo(this.x - 55 + Math.sin(time * 3) * 10, this.y + 35, this.x - 40, this.y + 65);
        ctx.lineTo(this.x + 40, this.y + 65);
        ctx.quadraticCurveTo(this.x + 55 + Math.sin(time * 3 + 1) * 10, this.y + 35, this.x + 25, this.y - 10);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#660066'; ctx.lineWidth = 2; ctx.stroke();
        // 堕落铠甲
        const body = ctx.createRadialGradient(this.x - 10, this.y - 10, 0, this.x, this.y, this.radius);
        body.addColorStop(0, '#4a004a'); body.addColorStop(0.5, '#2a002a'); body.addColorStop(1, '#0a000a');
        ctx.fillStyle = body; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = isRage ? 35 : 20;
        ctx.beginPath(); ctx.ellipse(this.x, this.y, this.radius * 0.85, this.radius * 0.75, 0, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        // 堕落纹饰
        ctx.strokeStyle = '#990099'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y - 20); ctx.lineTo(this.x, this.y + 15); ctx.lineTo(this.x + 15, this.y - 20); ctx.stroke();
        // 黑暗头盔
        const helmet = ctx.createRadialGradient(this.x, this.y - 40, 0, this.x, this.y - 35, 30);
        helmet.addColorStop(0, '#3a003a'); helmet.addColorStop(1, '#0a000a');
        ctx.fillStyle = helmet; ctx.beginPath(); ctx.ellipse(this.x, this.y - 38, 25, 22, 0, 0, Math.PI * 2); ctx.fill();
        // 恶魔角
        ctx.fillStyle = '#330033'; ctx.beginPath(); ctx.moveTo(this.x - 20, this.y - 55);
        ctx.quadraticCurveTo(this.x - 25, this.y - 70, this.x - 15, this.y - 75); ctx.lineTo(this.x - 18, this.y - 50); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y - 55);
        ctx.quadraticCurveTo(this.x + 25, this.y - 70, this.x + 15, this.y - 75); ctx.lineTo(this.x + 18, this.y - 50); ctx.closePath(); ctx.fill();
        // 发光红眼
        ctx.fillStyle = '#ff0066'; ctx.shadowColor = '#ff0066'; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.ellipse(this.x - 8, this.y - 40, 5, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 8, this.y - 40, 5, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        // 堕落之剑 Clarent
        ctx.save(); ctx.translate(this.x + 48, this.y - 12); ctx.rotate(-0.4 + Math.sin(time * 3) * 0.15);
        const sword = ctx.createLinearGradient(0, -85, 0, 20);
        sword.addColorStop(0, '#660066'); sword.addColorStop(0.5, '#330033'); sword.addColorStop(1, '#1a001a');
        ctx.fillStyle = sword; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 25;
        ctx.beginPath(); ctx.moveTo(0, -90); ctx.lineTo(10, -60); ctx.lineTo(10, 15); ctx.lineTo(-10, 15); ctx.lineTo(-10, -60); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -85); ctx.lineTo(0, 10); ctx.stroke();
        ctx.fillStyle = '#990099'; ctx.beginPath(); ctx.moveTo(-22, 15); ctx.lineTo(-18, 24); ctx.lineTo(18, 24); ctx.lineTo(22, 15);
        ctx.lineTo(18, 18); ctx.lineTo(-18, 18); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ff0066'; ctx.beginPath(); ctx.arc(0, 20, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a001a'; ctx.fillRect(-6, 24, 12, 28);
        ctx.fillStyle = '#990099'; ctx.beginPath(); ctx.arc(0, 55, 9, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
        // Phase2 效果
        if (isRage) { for (let ring = 0; ring < 2; ring++) {
            ctx.strokeStyle = `rgba(153,0,153,${0.5 - ring * 0.2 + Math.sin(time * 6) * 0.2})`; ctx.lineWidth = 3 - ring;
            ctx.setLineDash([12, 6]); ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 35 + ring * 18, 0, Math.PI * 2); ctx.stroke(); }
            ctx.setLineDash([]);
            for (let i = 0; i < 8; i++) { const sa = (Math.PI * 2 / 8) * i + time * 2;
                const sx = this.x + Math.cos(sa) * (this.radius + 45), sy = this.y + Math.sin(sa) * (this.radius + 45);
                ctx.fillStyle = `rgba(255,0,255,${0.4 + Math.sin(time * 4 + i) * 0.2})`;
                ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill(); } }
        // 异化标记
        ctx.fillStyle = '#ff00ff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
        ctx.fillText('☠', this.x, this.y - this.radius - 25);
        if (this.state === 'TELEGRAPH') this.drawSkillIndicator(ctx);
    }
    drawSkillIndicator(ctx) {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        switch (this.currentSkill) {
            case 'SHADOW_DASH': case 'PHANTOM_STRIKE':
                ctx.strokeStyle = 'rgba(153,0,153,0.6)'; ctx.lineWidth = 10; ctx.setLineDash([15, 10]);
                ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.dashTarget.x, this.dashTarget.y); ctx.stroke(); ctx.setLineDash([]);
                ctx.fillStyle = 'rgba(255,0,255,0.7)'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center';
                ctx.fillText('⚡ 暗影突袭 ⚡', (this.x + this.dashTarget.x) / 2, (this.y + this.dashTarget.y) / 2 - 20); break;
            case 'DARK_VORTEX': ctx.fillStyle = 'rgba(51,0,51,0.4)'; ctx.beginPath(); ctx.arc(this.player.x, this.player.y, 180, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(153,0,153,0.7)'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center';
                ctx.fillText('黑暗漩涡', this.player.x, this.player.y - 100); break;
            case 'MORDRED_FURY': case 'DARK_APOCALYPSE': ctx.fillStyle = 'rgba(100,0,100,0.4)'; ctx.beginPath(); ctx.arc(this.x, this.y, 250, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,0,255,0.8)'; ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center';
                ctx.fillText('☠ 莫德雷德之怒 ☠', this.x, this.y - this.radius - 40); break;
            default: ctx.fillStyle = 'rgba(153,0,153,0.3)'; ctx.beginPath(); ctx.moveTo(this.x, this.y);
                ctx.arc(this.x, this.y, 320, angle - 0.5, angle + 0.5); ctx.closePath(); ctx.fill(); break;
        }
    }
}
