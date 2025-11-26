/**
 * 异化Boss系统 - Lv2-Lv4
 */

// Lv2 异化冰龙
export class MutatedIceDragonBoss {
    constructor(x, y, player, combatSystem) {
        this.x = x; this.y = y; this.player = player; this.combatSystem = combatSystem;
        this.level = 2; this.name = '深渊冰龙'; this.isMutated = true;
        this.maxHp = Math.round(550 * 1.5); this.hp = this.maxHp;
        this.radius = 70; this.color = '#9932cc'; this.damage = Math.round(18 * 1.2);
        this.telegraphDuration = 0.85; this.attackCooldown = 1.4;
        this.state = 'IDLE'; this.timer = 0; this.currentSkill = null; this.phase = 1;
        this.dashTarget = { x: 0, y: 0 };
        this.skills = ['ICE_BREATH', 'FROST_CHARGE', 'ICICLE_RAIN', 'FROST_DOMAIN'];
        this.phase2Skills = [...this.skills, 'BLIZZARD', 'ABSOLUTE_ZERO'];
    }
    update(deltaTime) {
        if (this.state === 'IDLE') {
            const dx = this.player.x - this.x, dy = this.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 250) { this.x += (dx / dist) * 55 * deltaTime; this.y += (dy / dist) * 55 * deltaTime; }
        }
        switch (this.state) {
            case 'IDLE': this.timer += deltaTime;
                if (this.timer >= this.attackCooldown) { this.timer = 0; this.state = 'TELEGRAPH';
                    const skills = this.phase === 2 ? this.phase2Skills : this.skills;
                    this.currentSkill = skills[Math.floor(Math.random() * skills.length)];
                    if (this.currentSkill === 'FROST_CHARGE') this.dashTarget = { x: this.player.x, y: this.player.y };
                } break;
            case 'TELEGRAPH': this.timer += deltaTime;
                if (this.timer >= this.telegraphDuration) { this.timer = 0; this.state = 'ATTACK'; this.executeAttack(); } break;
            case 'ATTACK': this.timer += deltaTime;
                if (this.timer >= 0.5) { this.timer = 0; this.state = 'IDLE'; } break;
        }
        if (this.hp < this.maxHp * 0.5 && this.phase === 1) { this.phase = 2; this.telegraphDuration = 0.75; }
    }
    executeAttack() {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        switch (this.currentSkill) {
            case 'ICE_BREATH': for (let i = 0; i < 7; i++) { const a = angle + (i - 3) * 0.15;
                this.combatSystem.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * 350, vy: Math.sin(a) * 350,
                    radius: 12, damage: this.damage, owner: 'enemy',
                    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                    draw(ctx) { ctx.fillStyle = '#9932cc'; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 15;
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
                }); } break;
            case 'FROST_DOMAIN': this.combatSystem.spawnProjectile({ x: this.x, y: this.y, radius: 200, damage: 0, owner: 'enemy', life: 4, maxLife: 4,
                player: this.player, dmg: this.damage * 0.3,
                update(dt) { this.life -= dt; const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                    if (dist < this.radius && Math.random() < dt * 2) this.player.takeDamage(this.dmg);
                    if (this.life <= 0) this.markedForDeletion = true; },
                draw(ctx) { const alpha = this.life / this.maxLife; ctx.fillStyle = `rgba(153,50,204,${alpha*0.3})`;
                    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = `rgba(255,0,255,${alpha*0.6})`; ctx.lineWidth = 4; ctx.stroke(); }
            }); break;
            default: for (let i = 0; i < 5; i++) { const a = angle + (i - 2) * 0.2;
                this.combatSystem.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300,
                    radius: 10, damage: this.damage, owner: 'enemy',
                    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                    draw(ctx) { ctx.fillStyle = '#9932cc'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
                }); } break;
        }
    }
    takeDamage(amount) { this.hp -= amount; if (this.hp <= 0) this.hp = 0; }
    draw(ctx) {
        const time = Date.now() / 1000;
        const aura = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2.5);
        aura.addColorStop(0, 'rgba(153,50,204,0.5)'); aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2); ctx.fill();
        const body = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        body.addColorStop(0, '#cc66ff'); body.addColorStop(1, '#660099');
        ctx.fillStyle = body; ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 30;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.ellipse(this.x - 20, this.y - 15, 10, 8, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 20, this.y - 15, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff00ff'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
        ctx.fillText('☠', this.x, this.y - this.radius - 15);
        if (this.state === 'TELEGRAPH') this.drawSkillIndicator(ctx);
    }
    drawSkillIndicator(ctx) { const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        ctx.fillStyle = 'rgba(153,50,204,0.4)'; ctx.beginPath(); ctx.moveTo(this.x, this.y);
        ctx.arc(this.x, this.y, 300, angle - 0.5, angle + 0.5); ctx.closePath(); ctx.fill(); }
}

// Lv3 异化三头犬
export class MutatedCerberusBoss {
    constructor(x, y, player, combatSystem) {
        this.x = x; this.y = y; this.player = player; this.combatSystem = combatSystem;
        this.level = 3; this.name = '冥界魔犬'; this.isMutated = true;
        this.maxHp = Math.round(950 * 1.5); this.hp = this.maxHp;
        this.radius = 72; this.color = '#4a0000'; this.damage = Math.round(24 * 1.2);
        this.telegraphDuration = 0.8; this.attackCooldown = 1.1;
        this.state = 'IDLE'; this.timer = 0; this.currentSkill = null; this.phase = 1;
        this.dashTarget = { x: 0, y: 0 };
        this.skills = ['TRIPLE_FIRE', 'INFERNO_CHARGE', 'HELLFIRE', 'HELL_RIFT'];
        this.phase2Skills = [...this.skills, 'APOCALYPSE', 'UNDERWORLD_GATE'];
    }
    update(deltaTime) {
        if (this.state === 'IDLE') {
            const dx = this.player.x - this.x, dy = this.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 180) { this.x += (dx / dist) * 60 * deltaTime; this.y += (dy / dist) * 60 * deltaTime; }
        }
        switch (this.state) {
            case 'IDLE': this.timer += deltaTime;
                if (this.timer >= this.attackCooldown) { this.timer = 0; this.state = 'TELEGRAPH';
                    const skills = this.phase === 2 ? this.phase2Skills : this.skills;
                    this.currentSkill = skills[Math.floor(Math.random() * skills.length)];
                    if (this.currentSkill === 'INFERNO_CHARGE') this.dashTarget = { x: this.player.x, y: this.player.y };
                } break;
            case 'TELEGRAPH': this.timer += deltaTime;
                if (this.timer >= this.telegraphDuration) { this.timer = 0; this.state = 'ATTACK'; this.executeAttack(); } break;
            case 'ATTACK': this.timer += deltaTime;
                if (this.timer >= 0.5) { this.timer = 0; this.state = 'IDLE'; } break;
        }
        if (this.hp < this.maxHp * 0.5 && this.phase === 1) { this.phase = 2; this.telegraphDuration = 0.7; }
    }
    executeAttack() {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        switch (this.currentSkill) {
            case 'TRIPLE_FIRE': for (let h = 0; h < 3; h++) { const ha = angle + (h - 1) * 0.4;
                for (let i = 0; i < 3; i++) { setTimeout(() => {
                    this.combatSystem.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(ha) * 400, vy: Math.sin(ha) * 400,
                        radius: 12, damage: this.damage, owner: 'enemy',
                        update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                        draw(ctx) { ctx.fillStyle = '#660000'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 15;
                            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
                    }); }, i * 100); } } break;
            case 'HELL_RIFT': for (let i = 0; i < 5; i++) { const rx = this.x + (Math.random() - 0.5) * 400, ry = this.y + (Math.random() - 0.5) * 300;
                setTimeout(() => { this.combatSystem.spawnProjectile({ x: rx, y: ry, radius: 60, damage: this.damage * 1.2, owner: 'enemy', life: 2, maxLife: 2,
                    update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) { const alpha = this.life / this.maxLife; ctx.fillStyle = `rgba(100,0,0,${alpha*0.6})`;
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
                        ctx.strokeStyle = `rgba(255,50,0,${alpha})`; ctx.lineWidth = 4; ctx.stroke(); }
                }); }, i * 200); } break;
            default: for (let i = 0; i < 6; i++) { const a = angle + (i - 2.5) * 0.2;
                this.combatSystem.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * 350, vy: Math.sin(a) * 350,
                    radius: 10, damage: this.damage, owner: 'enemy',
                    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                    draw(ctx) { ctx.fillStyle = '#660000'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
                }); } break;
        }
    }
    takeDamage(amount) { this.hp -= amount; if (this.hp <= 0) this.hp = 0; }
    draw(ctx) {
        const aura = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2.5);
        aura.addColorStop(0, 'rgba(100,0,0,0.6)'); aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2); ctx.fill();
        const body = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        body.addColorStop(0, '#800000'); body.addColorStop(1, '#1a0000');
        ctx.fillStyle = body; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 25;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        const heads = [[-30, -25], [0, -35], [30, -25]];
        for (const [ox, oy] of heads) { ctx.fillStyle = '#600000'; ctx.beginPath(); ctx.arc(this.x + ox, this.y + oy, 18, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ff0000'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(this.x + ox - 6, this.y + oy - 3, 4, 0, Math.PI * 2); ctx.arc(this.x + ox + 6, this.y + oy - 3, 4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
        ctx.fillStyle = '#ff0000'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.fillText('☠', this.x, this.y - this.radius - 20);
        if (this.state === 'TELEGRAPH') this.drawSkillIndicator(ctx);
    }
    drawSkillIndicator(ctx) { const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        ctx.fillStyle = 'rgba(255,50,0,0.3)'; ctx.beginPath(); ctx.moveTo(this.x, this.y);
        ctx.arc(this.x, this.y, 280, angle - 0.6, angle + 0.6); ctx.closePath(); ctx.fill(); }
}

// Lv4 异化宙斯
export class MutatedZeusBoss {
    constructor(x, y, player, combatSystem) {
        this.x = x; this.y = y; this.player = player; this.combatSystem = combatSystem;
        this.level = 4; this.name = '暴君宙斯'; this.isMutated = true;
        this.maxHp = Math.round(1250 * 1.5); this.hp = this.maxHp;
        this.radius = 65; this.color = '#8b6914'; this.damage = Math.round(30 * 1.2);
        this.telegraphDuration = 0.7; this.attackCooldown = 1.2;
        this.state = 'IDLE'; this.timer = 0; this.currentSkill = null; this.phase = 1;
        this.dashTarget = { x: 0, y: 0 };
        this.skills = ['LIGHTNING_BOLT', 'THUNDER_DASH', 'CHAIN_LIGHTNING', 'TYRANT_THUNDER'];
        this.phase2Skills = [...this.skills, 'OLYMPUS_WRATH', 'ZEUS_APOCALYPSE'];
    }
    update(deltaTime) {
        if (this.state === 'IDLE') {
            const dx = this.player.x - this.x, dy = this.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 200) { this.x += (dx / dist) * 70 * deltaTime; this.y += (dy / dist) * 70 * deltaTime; }
        }
        switch (this.state) {
            case 'IDLE': this.timer += deltaTime;
                if (this.timer >= this.attackCooldown) { this.timer = 0; this.state = 'TELEGRAPH';
                    const skills = this.phase === 2 ? this.phase2Skills : this.skills;
                    this.currentSkill = skills[Math.floor(Math.random() * skills.length)];
                    if (this.currentSkill === 'THUNDER_DASH') this.dashTarget = { x: this.player.x, y: this.player.y };
                } break;
            case 'TELEGRAPH': this.timer += deltaTime;
                if (this.timer >= this.telegraphDuration) { this.timer = 0; this.state = 'ATTACK'; this.executeAttack(); } break;
            case 'ATTACK': this.timer += deltaTime;
                if (this.timer >= 0.5) { this.timer = 0; this.state = 'IDLE'; } break;
        }
        if (this.hp < this.maxHp * 0.5 && this.phase === 1) { this.phase = 2; this.telegraphDuration = 0.6; }
    }
    executeAttack() {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        switch (this.currentSkill) {
            case 'LIGHTNING_BOLT': for (let i = 0; i < 5; i++) { const a = angle + (i - 2) * 0.15;
                this.combatSystem.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * 500, vy: Math.sin(a) * 500,
                    radius: 12, damage: this.damage, owner: 'enemy',
                    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                    draw(ctx) { ctx.fillStyle = '#ffcc00'; ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 20;
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
                }); } break;
            case 'TYRANT_THUNDER': for (let i = 0; i < 8; i++) { const tx = this.player.x + (Math.random() - 0.5) * 300, ty = this.player.y + (Math.random() - 0.5) * 300;
                setTimeout(() => { this.combatSystem.spawnProjectile({ x: tx, y: 0, targetX: tx, targetY: ty, radius: 30, damage: this.damage * 1.3, owner: 'enemy', life: 0.3, maxLife: 0.3,
                    update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) { const alpha = this.life / this.maxLife; ctx.strokeStyle = `rgba(255,150,0,${alpha})`; ctx.lineWidth = 6;
                        ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.moveTo(this.x, 0);
                        ctx.lineTo(this.targetX + (Math.random() - 0.5) * 20, this.targetY); ctx.stroke();
                        ctx.fillStyle = `rgba(255,200,0,${alpha*0.5})`; ctx.beginPath(); ctx.arc(this.targetX, this.targetY, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
                }); }, i * 150); } break;
            default: for (let i = 0; i < 6; i++) { const a = angle + (i - 2.5) * 0.2;
                this.combatSystem.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * 400, vy: Math.sin(a) * 400,
                    radius: 10, damage: this.damage, owner: 'enemy',
                    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                    draw(ctx) { ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
                }); } break;
        }
    }
    takeDamage(amount) { this.hp -= amount; if (this.hp <= 0) this.hp = 0; }
    draw(ctx) {
        const time = Date.now() / 1000;
        const aura = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2.5);
        aura.addColorStop(0, 'rgba(255,150,0,0.5)'); aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 6; i++) { const la = time * 3 + i, lx = this.x + Math.cos(la) * (this.radius + 25), ly = this.y + Math.sin(la) * (this.radius + 25);
            ctx.strokeStyle = `rgba(255,150,0,${0.5 + Math.sin(time * 8 + i) * 0.3})`; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(lx, ly); ctx.stroke(); }
        const body = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        body.addColorStop(0, '#ffcc00'); body.addColorStop(1, '#4a3a0a');
        ctx.fillStyle = body; ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 30;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#ff4400'; ctx.beginPath(); ctx.ellipse(this.x - 15, this.y - 15, 8, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 15, this.y - 15, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff6600'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.fillText('☠', this.x, this.y - this.radius - 20);
        if (this.state === 'TELEGRAPH') this.drawSkillIndicator(ctx);
    }
    drawSkillIndicator(ctx) { const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        ctx.fillStyle = 'rgba(255,200,0,0.3)'; ctx.beginPath(); ctx.moveTo(this.x, this.y);
        ctx.arc(this.x, this.y, 300, angle - 0.4, angle + 0.4); ctx.closePath(); ctx.fill(); }
}
