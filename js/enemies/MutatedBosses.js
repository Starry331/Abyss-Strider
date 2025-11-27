/**
 * 异化Boss系统 - Lv1-Lv4
 */

// Lv1 异化猴王 - 0.75倍血量, 1.1倍伤害
export class MutatedMonkeyBoss {
    constructor(x, y, player, combatSystem) {
        this.x = x; this.y = y; this.player = player; this.combatSystem = combatSystem;
        this.level = 1; this.name = '噬魂猿魔'; this.isMutated = true;
        this.maxHp = Math.round(300 * 0.75); this.hp = this.maxHp;
        this.radius = 48; this.color = '#4a0080';
        this.damage = Math.round(15 * 1.1);
        this.telegraphDuration = 1.1; this.attackCooldown = 1.5;
        this.state = 'IDLE'; this.timer = 0; this.currentSkill = null; this.phase = 1;
        this.dashTarget = { x: 0, y: 0 };
        this.skills = ['SHADOW_DASH', 'SOUL_THROW', 'DARK_WHIP', 'VOID_LEAP', 'CURSE_TRAP', 'SOUL_RAIN'];
        this.phase2Skills = [...this.skills, 'DARK_FRENZY', 'DEMON_RAGE', 'SOUL_CHAIN', 'VOID_VORTEX'];
        this.chainTargets = []; // 灵魂锁链目标点
        this.vortexCenter = { x: 0, y: 0 }; // 虚空漩涡中心
    }
    update(deltaTime) {
        if (this.state === 'IDLE') {
            const dx = this.player.x - this.x, dy = this.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const spd = this.phase === 2 ? 75 : 55;
            if (dist > 200) { this.x += (dx / dist) * spd * deltaTime; this.y += (dy / dist) * spd * deltaTime; }
        }
        switch (this.state) {
            case 'IDLE': this.timer += deltaTime;
                if (this.timer >= this.attackCooldown) { this.timer = 0; this.state = 'TELEGRAPH';
                    const skills = this.phase === 2 ? this.phase2Skills : this.skills;
                    this.currentSkill = skills[Math.floor(Math.random() * skills.length)];
                    if (['SHADOW_DASH', 'VOID_LEAP', 'DEMON_RAGE'].includes(this.currentSkill)) 
                        this.dashTarget = { x: this.player.x, y: this.player.y };
                    if (this.currentSkill === 'SOUL_CHAIN') {
                        // 生成3个锁链节点围绕玩家
                        this.chainTargets = [];
                        for (let i = 0; i < 3; i++) {
                            const a = (Math.PI * 2 / 3) * i + Math.random() * 0.5;
                            this.chainTargets.push({
                                x: this.player.x + Math.cos(a) * 120,
                                y: this.player.y + Math.sin(a) * 120
                            });
                        }
                    }
                    if (this.currentSkill === 'VOID_VORTEX') {
                        this.vortexCenter = { x: this.player.x, y: this.player.y };
                    }
                } break;
            case 'TELEGRAPH': this.timer += deltaTime;
                if (this.timer >= this.telegraphDuration) { this.timer = 0; this.state = 'ATTACK'; this.executeAttack(); } break;
            case 'ATTACK': this.timer += deltaTime;
                if (this.timer >= 0.5) { this.timer = 0; this.state = 'IDLE'; } break;
        }
        if (this.hp < this.maxHp * 0.5 && this.phase === 1) { this.phase = 2; this.telegraphDuration = 0.9; }
    }
    executeAttack() {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        const dmg = this.damage;
        switch (this.currentSkill) {
            case 'SHADOW_DASH':
                this.x = this.dashTarget.x; this.y = this.dashTarget.y;
                this.combatSystem.spawnProjectile({ x: this.x, y: this.y, radius: 70, damage: dmg, owner: 'enemy', life: 0.3, maxLife: 0.3,
                    update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) { ctx.fillStyle = `rgba(80,0,120,${this.life/this.maxLife*0.6})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
                }); break;
            case 'SOUL_THROW':
                for (let i = 0; i < 5; i++) { const a = angle + (i - 2) * 0.25;
                    this.combatSystem.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, radius: 10, damage: dmg, owner: 'enemy',
                        update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                        draw(ctx) { ctx.fillStyle = '#8000ff'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
                    }); } break;
            case 'DARK_WHIP':
                this.combatSystem.spawnProjectile({ x: this.x, y: this.y, radius: 90, damage: dmg + 3, owner: 'enemy', life: 0.35, maxLife: 0.35,
                    update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) { const a = this.life / this.maxLife; ctx.strokeStyle = `rgba(128,0,255,${a})`; ctx.lineWidth = 12;
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, -(1-a)*Math.PI, (1-a)*Math.PI); ctx.stroke(); }
                }); break;
            case 'VOID_LEAP':
                setTimeout(() => { this.x = this.dashTarget.x; this.y = this.dashTarget.y;
                    this.combatSystem.spawnProjectile({ x: this.x, y: this.y, radius: 110, damage: dmg + 5, owner: 'enemy', life: 0.4, maxLife: 0.4,
                        update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                        draw(ctx) { const a = this.life / this.maxLife; ctx.fillStyle = `rgba(60,0,100,${a*0.5})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius*(1-a*0.3), 0, Math.PI * 2); ctx.fill(); }
                    }); }, 250); break;
            case 'CURSE_TRAP':
                for (let i = 0; i < 3; i++) { const tx = this.player.x + (Math.random() - 0.5) * 140, ty = this.player.y + (Math.random() - 0.5) * 140;
                    setTimeout(() => { this.combatSystem.spawnProjectile({ x: tx, y: ty, radius: 55, damage: dmg - 2, owner: 'enemy', life: 2.5, maxLife: 2.5,
                        update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                        draw(ctx) { const a = Math.min(1, this.life / this.maxLife * 2); ctx.fillStyle = `rgba(80,0,80,${a*0.4})`; ctx.strokeStyle = `rgba(150,0,150,${a})`;
                            ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
                    }); }, i * 150); } break;
            case 'SOUL_RAIN':
                for (let i = 0; i < 6; i++) { const rx = this.player.x + (Math.random() - 0.5) * 200, ry = this.player.y + (Math.random() - 0.5) * 200;
                    setTimeout(() => { this.combatSystem.spawnProjectile({ x: rx, y: ry, radius: 35, damage: dmg, owner: 'enemy', life: 0.6, maxLife: 0.6,
                        update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                        draw(ctx) { const a = this.life / this.maxLife; ctx.fillStyle = `rgba(100,0,150,${a*0.7})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
                    }); }, i * 80); } break;
            case 'DARK_FRENZY':
                for (let i = 0; i < 8; i++) { setTimeout(() => { const fa = (Math.PI * 2 / 8) * i;
                    this.combatSystem.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(fa) * 420, vy: Math.sin(fa) * 420, radius: 9, damage: dmg, owner: 'enemy',
                        update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                        draw(ctx) { ctx.fillStyle = '#a000ff'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
                    }); }, i * 80); } break;
            case 'DEMON_RAGE':
                this.x += Math.cos(angle) * 180; this.y += Math.sin(angle) * 180;
                for (let w = 0; w < 3; w++) { setTimeout(() => {
                    this.combatSystem.spawnProjectile({ x: this.x, y: this.y, radius: 100 + w * 30, damage: w === 0 ? dmg + 8 : 0, owner: 'enemy', life: 0.5, maxLife: 0.5,
                        update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                        draw(ctx) { const a = this.life / this.maxLife; ctx.strokeStyle = `rgba(150,0,200,${a*0.8})`; ctx.lineWidth = 4;
                            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * (1 - a * 0.3), 0, Math.PI * 2); ctx.stroke(); }
                    }); }, w * 120); } break;
            case 'SOUL_CHAIN':
                // 灵魂锁链 - 三角形锁链围困玩家
                const chainPts = this.chainTargets;
                for (let i = 0; i < 3; i++) {
                    const p1 = chainPts[i], p2 = chainPts[(i + 1) % 3];
                    this.combatSystem.spawnProjectile({
                        x: p1.x, y: p1.y, x2: p2.x, y2: p2.y,
                        radius: 15, damage: dmg + 2, owner: 'enemy', life: 2.5, maxLife: 2.5,
                        player: this.player,
                        update(dt) {
                            this.life -= dt;
                            // 检测玩家是否触碰锁链线
                            const dx = this.x2 - this.x, dy = this.y2 - this.y;
                            const len = Math.sqrt(dx * dx + dy * dy);
                            const nx = -dy / len, ny = dx / len;
                            const px = this.player.x - this.x, py = this.player.y - this.y;
                            const dist = Math.abs(px * nx + py * ny);
                            const proj = (px * dx + py * dy) / (len * len);
                            if (dist < 20 && proj > 0 && proj < 1 && Math.random() < dt * 3) {
                                this.player.takeDamage(this.damage * 0.3);
                            }
                            if (this.life <= 0) this.markedForDeletion = true;
                        },
                        draw(ctx) {
                            const a = Math.min(1, this.life / this.maxLife * 1.5);
                            ctx.strokeStyle = `rgba(180,0,255,${a})`; ctx.lineWidth = 6;
                            ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x2, this.y2); ctx.stroke();
                            // 节点
                            ctx.fillStyle = `rgba(200,50,255,${a})`;
                            ctx.beginPath(); ctx.arc(this.x, this.y, 12, 0, Math.PI * 2); ctx.fill();
                        }
                    });
                }
                break;
            case 'VOID_VORTEX':
                // 虚空漩涡 - 持续吸引玩家的漩涡
                const vx = this.vortexCenter.x, vy = this.vortexCenter.y;
                this.combatSystem.spawnProjectile({
                    x: vx, y: vy, radius: 150, damage: 0, owner: 'enemy', life: 3, maxLife: 3,
                    player: this.player, dmg: dmg,
                    update(dt) {
                        this.life -= dt;
                        // 吸引玩家
                        const dx = this.x - this.player.x, dy = this.y - this.player.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < this.radius && dist > 30) {
                            const pullStr = 80 * dt * (1 - dist / this.radius);
                            this.player.x += (dx / dist) * pullStr;
                            this.player.y += (dy / dist) * pullStr;
                        }
                        // 中心伤害
                        if (dist < 40 && Math.random() < dt * 4) {
                            this.player.takeDamage(this.dmg * 0.4);
                        }
                        if (this.life <= 0) this.markedForDeletion = true;
                    },
                    draw(ctx) {
                        const a = this.life / this.maxLife;
                        const time = Date.now() / 1000;
                        // 漩涡效果
                        for (let r = 0; r < 3; r++) {
                            ctx.strokeStyle = `rgba(120,0,200,${a * (0.8 - r * 0.2)})`;
                            ctx.lineWidth = 4 - r;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius * (0.3 + r * 0.25), time * 3 + r, time * 3 + r + Math.PI * 1.5);
                            ctx.stroke();
                        }
                        // 中心
                        ctx.fillStyle = `rgba(80,0,150,${a * 0.6})`;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 35, 0, Math.PI * 2); ctx.fill();
                    }
                });
                break;
        }
    }
    takeDamage(amount) { this.hp -= amount; if (this.hp <= 0) this.hp = 0; }
    draw(ctx) {
        const time = Date.now() / 1000;
        const isRage = this.phase === 2;
        const breathe = Math.sin(time * 2) * 1.5;
        const armSwing = Math.sin(time * 3) * 0.2;
        
        ctx.save();
        
        // ===== 暗紫气场 =====
        ctx.fillStyle = isRage ? 'rgba(180, 0, 255, 0.2)' : 'rgba(120, 0, 180, 0.12)';
        ctx.beginPath(); ctx.arc(this.x, this.y, 85, 0, Math.PI * 2); ctx.fill();
        
        // 灵魂粒子环绕
        for (let i = 0; i < 8; i++) {
            const pa = time * 2 + i * 0.8;
            const dist = 70 + Math.sin(time * 3 + i) * 8;
            const px = this.x + Math.cos(pa) * dist;
            const py = this.y - 10 + Math.sin(pa) * dist * 0.5;
            ctx.fillStyle = `rgba(200, 100, 255, ${0.7 - i * 0.06})`;
            ctx.beginPath(); ctx.arc(px, py, 5 - i * 0.3, 0, Math.PI * 2); ctx.fill();
        }
        
        // ===== 恶魔尾巴 =====
        const tailWave = Math.sin(time * 3) * 12;
        ctx.strokeStyle = isRage ? '#8800cc' : '#5500aa';
        ctx.lineWidth = 10; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y + 30);
        ctx.bezierCurveTo(this.x + 35, this.y + 55 + tailWave, this.x + 70, this.y + 25 - tailWave * 0.5, this.x + 100, this.y - 10 + Math.sin(time * 4) * 8);
        ctx.stroke();
        ctx.strokeStyle = isRage ? '#bb44ff' : '#8833cc';
        ctx.lineWidth = 5; ctx.stroke();
        // 尾巴尖刺
        ctx.fillStyle = isRage ? '#ff00ff' : '#cc00cc';
        const tailEndX = this.x + 100 + Math.sin(time * 4) * 3;
        const tailEndY = this.y - 10 + Math.sin(time * 4) * 8;
        ctx.beginPath();
        ctx.moveTo(tailEndX - 5, tailEndY + 5);
        ctx.lineTo(tailEndX + 15, tailEndY - 20);
        ctx.lineTo(tailEndX, tailEndY - 5);
        ctx.closePath(); ctx.fill();
        
        // ===== 双腿 =====
        ctx.fillStyle = isRage ? '#6600aa' : '#440077';
        ctx.beginPath(); ctx.ellipse(this.x - 14, this.y + 38, 11, 20, -0.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(this.x + 14, this.y + 38, 11, 20, 0.1, 0, Math.PI * 2); ctx.fill();
        // 脚掌
        ctx.fillStyle = isRage ? '#440066' : '#330055';
        ctx.beginPath(); ctx.ellipse(this.x - 16, this.y + 56, 14, 7, -0.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(this.x + 16, this.y + 56, 14, 7, 0.1, 0, Math.PI * 2); ctx.fill();
        
        // ===== 躯干 =====
        ctx.fillStyle = isRage ? '#7700bb' : '#550088';
        ctx.beginPath(); ctx.ellipse(this.x, this.y + 8, 28, 32, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = isRage ? '#9900dd' : '#660099';
        ctx.lineWidth = 2; ctx.stroke();
        
        // 胸部区域
        ctx.fillStyle = isRage ? '#9966aa' : '#775588';
        ctx.beginPath(); ctx.ellipse(this.x, this.y + 3, 18, 20, 0, 0, Math.PI * 2); ctx.fill();
        
        // 诅咒符文
        ctx.strokeStyle = isRage ? '#ff44ff' : '#cc22cc';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const ra = time * 0.5 + i * Math.PI / 2;
            const rx = this.x + Math.cos(ra) * 12;
            const ry = this.y + 5 + Math.sin(ra) * 10;
            ctx.beginPath();
            ctx.moveTo(rx - 5, ry - 5); ctx.lineTo(rx + 5, ry + 5);
            ctx.moveTo(rx + 5, ry - 5); ctx.lineTo(rx - 5, ry + 5);
            ctx.stroke();
        }
        
        // 紫晶项链
        ctx.strokeStyle = '#aa55ff';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(this.x, this.y - 8, 16, 0.3, Math.PI - 0.3); ctx.stroke();
        // 宝石
        ctx.fillStyle = isRage ? '#ff00ff' : '#cc00ff';
        ctx.beginPath(); ctx.arc(this.x, this.y + 6, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5; ctx.stroke();
        
        // ===== 双臂 =====
        // 左臂
        ctx.save();
        ctx.translate(this.x - 30, this.y - 8);
        ctx.rotate(-0.5 + armSwing);
        ctx.fillStyle = isRage ? '#7700bb' : '#550088';
        ctx.beginPath(); ctx.ellipse(0, 22, 10, 24, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = isRage ? '#550088' : '#440066';
        ctx.beginPath(); ctx.arc(0, 46, 12, 0, Math.PI * 2); ctx.fill();
        // 紫晶手环
        ctx.strokeStyle = '#aa55ff';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 32, 8, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        
        // 右臂
        ctx.save();
        ctx.translate(this.x + 30, this.y - 8);
        ctx.rotate(0.5 - armSwing);
        ctx.fillStyle = isRage ? '#7700bb' : '#550088';
        ctx.beginPath(); ctx.ellipse(0, 22, 10, 24, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = isRage ? '#550088' : '#440066';
        ctx.beginPath(); ctx.arc(0, 46, 12, 0, Math.PI * 2); ctx.fill();
        // 紫晶手环
        ctx.strokeStyle = '#aa55ff';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 32, 8, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        
        // ===== 头部 =====
        // 恶魔角
        ctx.fillStyle = isRage ? '#cc00ff' : '#9900cc';
        ctx.beginPath();
        ctx.moveTo(this.x - 16, this.y - 48 + breathe);
        ctx.lineTo(this.x - 30, this.y - 80 + breathe);
        ctx.lineTo(this.x - 10, this.y - 52 + breathe);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 16, this.y - 48 + breathe);
        ctx.lineTo(this.x + 30, this.y - 80 + breathe);
        ctx.lineTo(this.x + 10, this.y - 52 + breathe);
        ctx.closePath(); ctx.fill();
        // 角的高光
        ctx.fillStyle = isRage ? '#ff66ff' : '#cc44cc';
        ctx.beginPath();
        ctx.moveTo(this.x - 18, this.y - 55 + breathe);
        ctx.lineTo(this.x - 25, this.y - 72 + breathe);
        ctx.lineTo(this.x - 15, this.y - 58 + breathe);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 18, this.y - 55 + breathe);
        ctx.lineTo(this.x + 25, this.y - 72 + breathe);
        ctx.lineTo(this.x + 15, this.y - 58 + breathe);
        ctx.closePath(); ctx.fill();
        
        // 耳朵
        ctx.fillStyle = isRage ? '#6600aa' : '#440077';
        ctx.beginPath(); ctx.ellipse(this.x - 26, this.y - 38 + breathe, 10, 16, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(this.x + 26, this.y - 38 + breathe, 10, 16, 0.4, 0, Math.PI * 2); ctx.fill();
        // 耳内
        ctx.fillStyle = isRage ? '#aa66aa' : '#886688';
        ctx.beginPath(); ctx.ellipse(this.x - 26, this.y - 36 + breathe, 5, 10, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(this.x + 26, this.y - 36 + breathe, 5, 10, 0.4, 0, Math.PI * 2); ctx.fill();
        
        // 头部
        ctx.fillStyle = isRage ? '#7700bb' : '#550088';
        ctx.beginPath(); ctx.ellipse(this.x, this.y - 32 + breathe, 24, 28, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = isRage ? '#9900dd' : '#660099';
        ctx.lineWidth = 2; ctx.stroke();
        
        // 脸部
        ctx.fillStyle = isRage ? '#aa77bb' : '#886699';
        ctx.beginPath(); ctx.ellipse(this.x, this.y - 28 + breathe, 17, 20, 0, 0, Math.PI * 2); ctx.fill();
        
        // 凶眉
        ctx.strokeStyle = isRage ? '#ff00ff' : '#cc00cc';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y - 35 + breathe);
        ctx.lineTo(this.x - 5, this.y - 42 + breathe);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + 15, this.y - 35 + breathe);
        ctx.lineTo(this.x + 5, this.y - 42 + breathe);
        ctx.stroke();
        
        // 邪眼 - 小而邪恶
        ctx.fillStyle = isRage ? '#ff00ff' : '#cc00dd';
        ctx.beginPath(); ctx.ellipse(this.x - 7, this.y - 32 + breathe, 4, 3, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(this.x + 7, this.y - 32 + breathe, 4, 3, 0.3, 0, Math.PI * 2); ctx.fill();
        // 竖瞳
        ctx.fillStyle = '#110011';
        ctx.beginPath(); ctx.ellipse(this.x - 7, this.y - 32 + breathe, 1.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(this.x + 7, this.y - 32 + breathe, 1.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        // 眼睛微光
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath(); ctx.arc(this.x - 8, this.y - 33 + breathe, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + 6, this.y - 33 + breathe, 1, 0, Math.PI * 2); ctx.fill();
        
        // 鼻子
        ctx.fillStyle = isRage ? '#774488' : '#553366';
        ctx.beginPath(); ctx.ellipse(this.x, this.y - 22 + breathe, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#220022';
        ctx.beginPath(); ctx.ellipse(this.x - 2.5, this.y - 21 + breathe, 2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(this.x + 2.5, this.y - 21 + breathe, 2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
        
        // 嘴巴 - 紧闭凶狠
        ctx.strokeStyle = isRage ? '#330033' : '#220022';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y - 12 + breathe);
        ctx.quadraticCurveTo(this.x, this.y - 8 + breathe, this.x + 10, this.y - 12 + breathe);
        ctx.stroke();
        
        // 第三只眼
        ctx.fillStyle = isRage ? '#ff00ff' : '#cc00cc';
        ctx.beginPath(); ctx.ellipse(this.x, this.y - 45 + breathe, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#110011';
        ctx.beginPath(); ctx.ellipse(this.x, this.y - 45 + breathe, 1.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        
        // Phase2 能量环
        if (isRage) {
            ctx.strokeStyle = `rgba(200, 0, 255, ${0.6 + Math.sin(time * 5) * 0.3})`;
            ctx.lineWidth = 4;
            ctx.setLineDash([12, 6]);
            ctx.beginPath(); ctx.arc(this.x, this.y, 80 + Math.sin(time * 4) * 5, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.restore();
        
        // 技能指示器
        if (this.state === 'TELEGRAPH') this.drawSkillIndicator(ctx);
    }
    drawSkillIndicator(ctx) {
        if (!this.currentSkill) return;
        const time = Date.now() / 1000;
        const pulse = 0.5 + Math.sin(time * 6) * 0.3;
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        
        ctx.save();
        
        switch (this.currentSkill) {
            case 'SHADOW_DASH':
            case 'VOID_LEAP': {
                // 冲刺/跳跃预警 - 轨迹线+落点圈+箭头
                const tx = this.dashTarget.x, ty = this.dashTarget.y;
                const r = this.currentSkill === 'VOID_LEAP' ? 110 : 70;
                
                // 落点圈
                ctx.fillStyle = `rgba(150,0,200,${pulse * 0.4})`;
                ctx.strokeStyle = `rgba(200,0,255,${pulse})`;
                ctx.lineWidth = 4;
                ctx.beginPath(); ctx.arc(tx, ty, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                
                // 轨迹线
                ctx.setLineDash([10, 5]);
                ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(tx, ty); ctx.stroke();
                ctx.setLineDash([]);
                
                // 箭头
                const da = Math.atan2(ty - this.y, tx - this.x);
                ctx.fillStyle = `rgba(255,100,255,${pulse + 0.3})`;
                ctx.beginPath();
                ctx.moveTo(tx + Math.cos(da) * 20, ty + Math.sin(da) * 20);
                ctx.lineTo(tx + Math.cos(da + 2.5) * 25, ty + Math.sin(da + 2.5) * 25);
                ctx.lineTo(tx + Math.cos(da - 2.5) * 25, ty + Math.sin(da - 2.5) * 25);
                ctx.closePath(); ctx.fill();
                
                // 文字
                ctx.fillStyle = `rgba(255,150,255,${pulse + 0.4})`;
                ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
                ctx.fillText(this.currentSkill === 'VOID_LEAP' ? '虚空跃!' : '暗影冲!', tx, ty - r - 10);
                break;
            }
            case 'SOUL_THROW': {
                // 扇形弹幕预警
                ctx.fillStyle = `rgba(130,0,200,${pulse * 0.3})`;
                ctx.strokeStyle = `rgba(180,0,255,${pulse})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.arc(this.x, this.y, 200, angle - 0.6, angle + 0.6);
                ctx.closePath(); ctx.fill(); ctx.stroke();
                
                // 方向箭头
                ctx.fillStyle = `rgba(255,100,255,${pulse + 0.3})`;
                const arrX = this.x + Math.cos(angle) * 150;
                const arrY = this.y + Math.sin(angle) * 150;
                ctx.beginPath();
                ctx.moveTo(arrX + Math.cos(angle) * 20, arrY + Math.sin(angle) * 20);
                ctx.lineTo(arrX + Math.cos(angle + 2.5) * 15, arrY + Math.sin(angle + 2.5) * 15);
                ctx.lineTo(arrX + Math.cos(angle - 2.5) * 15, arrY + Math.sin(angle - 2.5) * 15);
                ctx.closePath(); ctx.fill();
                
                ctx.fillStyle = `rgba(255,150,255,${pulse + 0.4})`;
                ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
                ctx.fillText('噬魂弹!', this.x, this.y - this.radius - 15);
                break;
            }
            case 'DARK_WHIP': {
                // 近身AOE预警
                ctx.fillStyle = `rgba(130,0,180,${pulse * 0.35})`;
                ctx.strokeStyle = `rgba(200,0,255,${pulse})`;
                ctx.lineWidth = 5;
                ctx.beginPath(); ctx.arc(this.x, this.y, 90, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                
                // 旋转线
                for (let i = 0; i < 4; i++) {
                    const a = time * 4 + i * Math.PI / 2;
                    ctx.beginPath();
                    ctx.moveTo(this.x + Math.cos(a) * 30, this.y + Math.sin(a) * 30);
                    ctx.lineTo(this.x + Math.cos(a) * 85, this.y + Math.sin(a) * 85);
                    ctx.stroke();
                }
                
                ctx.fillStyle = `rgba(255,150,255,${pulse + 0.4})`;
                ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
                ctx.fillText('暗鞭!', this.x, this.y - 100);
                break;
            }
            case 'CURSE_TRAP':
            case 'SOUL_RAIN': {
                // 范围落点预警
                const range = this.currentSkill === 'SOUL_RAIN' ? 200 : 140;
                ctx.fillStyle = `rgba(100,0,150,${pulse * 0.25})`;
                ctx.strokeStyle = `rgba(180,0,255,${pulse * 0.7})`;
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(this.player.x, this.player.y, range / 2, 0, Math.PI * 2); ctx.fill();
                ctx.setLineDash([8, 4]);
                ctx.beginPath(); ctx.arc(this.player.x, this.player.y, range, 0, Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]);
                
                // 下落箭头
                ctx.fillStyle = `rgba(200,50,255,${pulse + 0.3})`;
                for (let i = 0; i < 3; i++) {
                    const ax = this.player.x + (i - 1) * 40;
                    const ay = this.player.y - 60 - Math.sin(time * 5 + i) * 10;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay + 15); ctx.lineTo(ax - 8, ay); ctx.lineTo(ax + 8, ay);
                    ctx.closePath(); ctx.fill();
                }
                
                ctx.fillStyle = `rgba(255,150,255,${pulse + 0.4})`;
                ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
                ctx.fillText(this.currentSkill === 'SOUL_RAIN' ? '灵魂雨!' : '诅咒阱!', this.player.x, this.player.y - range / 2 - 20);
                break;
            }
            case 'DARK_FRENZY': {
                // 8方向放射预警
                ctx.strokeStyle = `rgba(180,0,255,${pulse})`;
                ctx.lineWidth = 3;
                for (let i = 0; i < 8; i++) {
                    const a = (Math.PI * 2 / 8) * i;
                    ctx.beginPath();
                    ctx.moveTo(this.x + Math.cos(a) * 30, this.y + Math.sin(a) * 30);
                    ctx.lineTo(this.x + Math.cos(a) * 150, this.y + Math.sin(a) * 150);
                    ctx.stroke();
                    // 小箭头
                    const ax = this.x + Math.cos(a) * 120, ay = this.y + Math.sin(a) * 120;
                    ctx.fillStyle = `rgba(255,100,255,${pulse + 0.2})`;
                    ctx.beginPath();
                    ctx.moveTo(ax + Math.cos(a) * 12, ay + Math.sin(a) * 12);
                    ctx.lineTo(ax + Math.cos(a + 2.3) * 10, ay + Math.sin(a + 2.3) * 10);
                    ctx.lineTo(ax + Math.cos(a - 2.3) * 10, ay + Math.sin(a - 2.3) * 10);
                    ctx.closePath(); ctx.fill();
                }
                ctx.fillStyle = `rgba(255,150,255,${pulse + 0.4})`;
                ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
                ctx.fillText('暗狂暴!', this.x, this.y - this.radius - 20);
                break;
            }
            case 'DEMON_RAGE': {
                // 冲刺+冲击波预警
                const tx = this.dashTarget.x, ty = this.dashTarget.y;
                
                // 冲刺轨迹
                ctx.strokeStyle = `rgba(200,0,255,${pulse})`;
                ctx.lineWidth = 8;
                ctx.setLineDash([15, 8]);
                ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(tx, ty); ctx.stroke();
                ctx.setLineDash([]);
                
                // 落点多层圈
                for (let r = 0; r < 3; r++) {
                    ctx.strokeStyle = `rgba(180,0,220,${pulse * (1 - r * 0.25)})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.arc(tx, ty, 100 + r * 30, 0, Math.PI * 2); ctx.stroke();
                }
                
                ctx.fillStyle = `rgba(255,100,255,${pulse + 0.4})`;
                ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center';
                ctx.fillText('恶魔怒!', tx, ty - 170);
                break;
            }
            case 'SOUL_CHAIN': {
                // 三角锁链预警
                ctx.strokeStyle = `rgba(200,0,255,${pulse})`;
                ctx.lineWidth = 4;
                ctx.fillStyle = `rgba(150,0,200,${pulse * 0.3})`;
                
                // 三角形
                ctx.beginPath();
                ctx.moveTo(this.chainTargets[0].x, this.chainTargets[0].y);
                for (let i = 1; i < 3; i++) {
                    ctx.lineTo(this.chainTargets[i].x, this.chainTargets[i].y);
                }
                ctx.closePath(); ctx.fill(); ctx.stroke();
                
                // 节点
                ctx.fillStyle = `rgba(255,100,255,${pulse + 0.3})`;
                this.chainTargets.forEach(pt => {
                    ctx.beginPath(); ctx.arc(pt.x, pt.y, 15, 0, Math.PI * 2); ctx.fill();
                });
                
                ctx.fillStyle = `rgba(255,150,255,${pulse + 0.4})`;
                ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
                ctx.fillText('灵魂锁!', this.player.x, this.player.y - 30);
                break;
            }
            case 'VOID_VORTEX': {
                // 漩涡预警
                const vx = this.vortexCenter.x, vy = this.vortexCenter.y;
                
                // 多层旋转圈
                for (let r = 0; r < 3; r++) {
                    ctx.strokeStyle = `rgba(150,0,220,${pulse * (1 - r * 0.2)})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(vx, vy, 50 + r * 40, time * 3 + r * 0.5, time * 3 + r * 0.5 + Math.PI * 1.5);
                    ctx.stroke();
                }
                
                // 中心警告
                ctx.fillStyle = `rgba(120,0,180,${pulse * 0.5})`;
                ctx.beginPath(); ctx.arc(vx, vy, 45, 0, Math.PI * 2); ctx.fill();
                
                // 吸引箭头
                ctx.fillStyle = `rgba(255,100,255,${pulse + 0.3})`;
                for (let i = 0; i < 4; i++) {
                    const a = time * 2 + i * Math.PI / 2;
                    const ax = vx + Math.cos(a) * 100, ay = vy + Math.sin(a) * 100;
                    ctx.beginPath();
                    ctx.moveTo(ax - Math.cos(a) * 15, ay - Math.sin(a) * 15);
                    ctx.lineTo(ax + Math.cos(a + 2.3) * 10, ay + Math.sin(a + 2.3) * 10);
                    ctx.lineTo(ax + Math.cos(a - 2.3) * 10, ay + Math.sin(a - 2.3) * 10);
                    ctx.closePath(); ctx.fill();
                }
                
                ctx.fillStyle = `rgba(255,150,255,${pulse + 0.4})`;
                ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
                ctx.fillText('虚空涡!', vx, vy - 160);
                break;
            }
            default: {
                // 默认预警
                ctx.fillStyle = `rgba(150,0,200,${pulse * 0.4})`;
                ctx.strokeStyle = `rgba(200,0,255,${pulse})`;
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(this.player.x, this.player.y, 80, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            }
        }
        
        ctx.restore();
    }
}

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
                    draw(ctx) { ctx.fillStyle = '#9932cc'; 
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();  }
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
        
        // ===== 深渊紫雾光环 (简化) =====
        ctx.fillStyle = 'rgba(130,50,180,0.35)';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2); ctx.fill();
        
        // ===== 漂浮的深渊冰晶 =====
        for (let i = 0; i < 10; i++) {
            const crystalAngle = time * 0.5 + i * 0.63;
            const crystalDist = this.radius * 1.6 + Math.sin(time * 2 + i) * 20;
            const cx = this.x + Math.cos(crystalAngle) * crystalDist;
            const cy = this.y + Math.sin(crystalAngle) * crystalDist;
            ctx.fillStyle = `rgba(200,100,255,${0.4 + Math.sin(time * 4 + i) * 0.3})`;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(time * 2 + i);
            ctx.beginPath();
            ctx.moveTo(0, -10); ctx.lineTo(6, 0); ctx.lineTo(0, 10); ctx.lineTo(-6, 0);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        }
        
        // ===== 龙翼 =====
        ctx.fillStyle = 'rgba(120,40,180,0.8)';
        // 左翼
        ctx.beginPath();
        ctx.moveTo(this.x - 30, this.y);
        ctx.quadraticCurveTo(this.x - 100, this.y - 60 + Math.sin(time * 3) * 15, this.x - 120, this.y - 30);
        ctx.quadraticCurveTo(this.x - 100, this.y + 10, this.x - 30, this.y + 20);
        ctx.closePath(); ctx.fill();
        // 翼骨
        ctx.strokeStyle = '#9932cc'; ctx.lineWidth = 3;
        for (let w = 0; w < 4; w++) {
            ctx.beginPath();
            ctx.moveTo(this.x - 35, this.y + 5);
            ctx.lineTo(this.x - 80 - w * 10, this.y - 40 + w * 15 + Math.sin(time * 3) * 10);
            ctx.stroke();
        }
        // 右翼
        ctx.fillStyle = 'rgba(120,40,180,0.8)';
        ctx.beginPath();
        ctx.moveTo(this.x + 30, this.y);
        ctx.quadraticCurveTo(this.x + 100, this.y - 60 + Math.sin(time * 3) * 15, this.x + 120, this.y - 30);
        ctx.quadraticCurveTo(this.x + 100, this.y + 10, this.x + 30, this.y + 20);
        ctx.closePath(); ctx.fill();
        for (let w = 0; w < 4; w++) {
            ctx.beginPath();
            ctx.moveTo(this.x + 35, this.y + 5);
            ctx.lineTo(this.x + 80 + w * 10, this.y - 40 + w * 15 + Math.sin(time * 3) * 10);
            ctx.stroke();
        }
        
        // ===== 龙身 (纯色) =====
        ctx.fillStyle = '#9932cc';
        
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        
        
        // 龙鳞纹理
        ctx.strokeStyle = '#660099';
        ctx.lineWidth = 2;
        for (let s = 0; s < 6; s++) {
            const scaleAngle = s * 0.5 + 0.5;
            for (let r = 1; r <= 3; r++) {
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(scaleAngle) * (15 * r), this.y + Math.sin(scaleAngle) * (15 * r), 8, 0, Math.PI);
                ctx.stroke();
            }
        }
        
        // ===== 龙尾 =====
        ctx.strokeStyle = '#8844aa';
        ctx.lineWidth = 16;
        ctx.lineCap = 'round';
        const tailWave = Math.sin(time * 3) * 25;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.radius * 0.6);
        ctx.bezierCurveTo(this.x + 40 + tailWave, this.y + this.radius + 20, this.x + 80 - tailWave, this.y + this.radius + 50, this.x + 110, this.y + this.radius + 20);
        ctx.stroke();
        // 尾刺
        ctx.fillStyle = '#cc00ff';
        
        ctx.beginPath();
        ctx.moveTo(this.x + 110, this.y + this.radius + 20);
        ctx.lineTo(this.x + 130, this.y + this.radius + 10);
        ctx.lineTo(this.x + 125, this.y + this.radius + 25);
        ctx.lineTo(this.x + 140, this.y + this.radius + 30);
        ctx.closePath(); ctx.fill();
        
        
        // ===== 龙头（长颈）=====
        // 颈部
        ctx.strokeStyle = '#7733aa';
        ctx.lineWidth = 22;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 20);
        ctx.quadraticCurveTo(this.x, this.y - 60, this.x, this.y - 85 + Math.sin(time * 2) * 5);
        ctx.stroke();
        
        // 龙头
        const headY = this.y - 95 + Math.sin(time * 2) * 5;
        ctx.fillStyle = '#9944cc';
        ctx.beginPath();
        ctx.ellipse(this.x, headY, 35, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 龙角
        ctx.fillStyle = '#cc00ff';
        ctx.beginPath();
        ctx.moveTo(this.x - 25, headY - 15);
        ctx.lineTo(this.x - 40, headY - 45 - Math.sin(time * 4) * 5);
        ctx.lineTo(this.x - 20, headY - 20);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 25, headY - 15);
        ctx.lineTo(this.x + 40, headY - 45 - Math.sin(time * 4) * 5);
        ctx.lineTo(this.x + 20, headY - 20);
        ctx.closePath(); ctx.fill();
        
        // 龙眼（发光紫眼）
        ctx.fillStyle = '#ff0066';
        
        ctx.beginPath();
        ctx.ellipse(this.x - 15, headY - 5, 10, 7, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 15, headY - 5, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 竖瞳
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(this.x - 15, headY - 5, 3, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 15, headY - 5, 3, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 龙嘴
        ctx.fillStyle = '#3a0050';
        ctx.beginPath();
        ctx.ellipse(this.x, headY + 15, 20, 8, 0, 0, Math.PI);
        ctx.fill();
        // 獠牙
        ctx.fillStyle = '#fff';
        [-12, 12].forEach(fx => {
            ctx.beginPath();
            ctx.moveTo(this.x + fx - 3, headY + 18);
            ctx.lineTo(this.x + fx, headY + 30);
            ctx.lineTo(this.x + fx + 3, headY + 18);
            ctx.closePath(); ctx.fill();
        });
        
        // ===== 吐息效果 =====
        const breathPhase = Math.sin(time * 3);
        if (breathPhase > 0.5) {
            const breathAngle = Math.atan2(this.player.y - headY, this.player.x - this.x);
            ctx.fillStyle = `rgba(200,100,255,${(breathPhase - 0.5) * 1.5})`;
            for (let b = 0; b < 8; b++) {
                const bx = this.x + Math.cos(breathAngle) * (40 + b * 15);
                const by = headY + Math.sin(breathAngle) * (40 + b * 15);
                ctx.beginPath(); ctx.arc(bx, by, 12 - b * 1.2, 0, Math.PI * 2); ctx.fill();
            }
        }
        
        // ===== 异化标记 =====
        ctx.fillStyle = '#cc00ff';
        
        ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
        ctx.fillText('☠ 异化 ☠', this.x, headY - 55);
        
        
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
                        draw(ctx) { ctx.fillStyle = '#660000'; 
                            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();  }
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
        const time = Date.now() / 1000;
        
        // ===== 冥界深渊光环 (简化) =====
        ctx.fillStyle = 'rgba(80,0,0,0.4)';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2.8, 0, Math.PI * 2); ctx.fill();
        
        // ===== 熔岩地面裂缝 =====
        for (let i = 0; i < 8; i++) {
            const crackAngle = time * 0.3 + i * 0.8;
            const crackDist = this.radius * 1.5 + Math.sin(time * 2 + i) * 15;
            const cx = this.x + Math.cos(crackAngle) * crackDist;
            const cy = this.y + Math.sin(crackAngle) * crackDist;
            ctx.fillStyle = `rgba(255,${50 + Math.sin(time * 5 + i) * 30},0,${0.5 + Math.sin(time * 4 + i) * 0.3})`;
            ctx.beginPath(); ctx.arc(cx, cy, 6 + Math.sin(time * 6 + i) * 2, 0, Math.PI * 2); ctx.fill();
        }
        
        // ===== 四条腿（熔岩犬腿）=====
        const legPositions = [{ x: -40, y: 30 }, { x: 40, y: 30 }, { x: -28, y: 45 }, { x: 28, y: 45 }];
        ctx.fillStyle = '#2a0000';
        legPositions.forEach((leg, i) => {
            const legWave = Math.sin(time * 5 + i) * 4;
            ctx.beginPath();
            ctx.ellipse(this.x + leg.x, this.y + leg.y + legWave, 14, 22, (i < 2 ? -0.3 : 0.3) * (i % 2 === 0 ? -1 : 1), 0, Math.PI * 2);
            ctx.fill();
            // 熔岩爪子
            ctx.fillStyle = '#ff3300';
            
            ctx.beginPath(); ctx.arc(this.x + leg.x, this.y + leg.y + 20 + legWave, 10, 0, Math.PI * 2); ctx.fill();
            
            ctx.fillStyle = '#2a0000';
        });
        
        // ===== 主体身躯 (纯色) =====
        ctx.fillStyle = '#4a0000';
        
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        
        
        // 熔岩裂纹
        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 3;
        
        for (let i = 0; i < 6; i++) {
            const crackA = i * 1.0 + 0.2;
            ctx.beginPath();
            ctx.moveTo(this.x + Math.cos(crackA) * 20, this.y + Math.sin(crackA) * 20);
            ctx.lineTo(this.x + Math.cos(crackA) * (this.radius - 8), this.y + Math.sin(crackA) * (this.radius - 8));
            ctx.stroke();
        }
        
        
        // ===== 蛇尾（冥界之蛇）=====
        ctx.strokeStyle = '#3a0000';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        const tailWave = Math.sin(time * 4) * 20;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.radius * 0.5);
        ctx.bezierCurveTo(this.x + 35 + tailWave, this.y + this.radius + 15, this.x + 60 - tailWave, this.y + this.radius + 35, this.x + 80, this.y + this.radius + 8);
        ctx.stroke();
        // 蛇头（绿色火焰）
        ctx.fillStyle = '#00cc00';
        
        ctx.beginPath(); ctx.arc(this.x + 80, this.y + this.radius + 8, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff0000';
        ctx.beginPath(); ctx.arc(this.x + 78, this.y + this.radius + 5, 3, 0, Math.PI * 2); ctx.arc(this.x + 82, this.y + this.radius + 5, 3, 0, Math.PI * 2); ctx.fill();
        
        
        // ===== 三个狼头 =====
        const headData = [
            { ox: -35, oy: -35, angle: -0.4 },
            { ox: 0, oy: -50, angle: 0 },
            { ox: 35, oy: -35, angle: 0.4 }
        ];
        
        headData.forEach((head, idx) => {
            const hx = this.x + head.ox;
            const hy = this.y + head.oy + Math.sin(time * 3 + idx) * 3;
            
            // 喷火效果
            const breathPhase = Math.sin(time * 4 + idx * 2);
            if (breathPhase > 0.6) {
                ctx.fillStyle = `rgba(255,50,0,${(breathPhase - 0.6) * 2})`;
                const breathAngle = Math.atan2(this.player.y - hy, this.player.x - hx);
                for (let b = 0; b < 6; b++) {
                    const bx = hx + Math.cos(breathAngle) * (28 + b * 10);
                    const by = hy + Math.sin(breathAngle) * (28 + b * 10);
                    ctx.beginPath(); ctx.arc(bx, by, 8 - b, 0, Math.PI * 2); ctx.fill();
                }
            }
            
            // 脖子（带鬃毛）
            ctx.fillStyle = '#3a0000';
            ctx.beginPath(); ctx.ellipse(hx, hy + 22, 16, 26, head.angle, 0, Math.PI * 2); ctx.fill();
            // 燃烧鬃毛
            ctx.fillStyle = '#ff3300';
            for (let m = 0; m < 6; m++) {
                const mAngle = head.angle - 0.6 + m * 0.24;
                ctx.beginPath();
                ctx.ellipse(hx + Math.cos(mAngle) * 14, hy + 8 + Math.sin(mAngle) * 10, 5, 12 + Math.sin(time * 6 + m) * 3, mAngle, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 头部 (纯色)
            ctx.fillStyle = '#4a0000';
            ctx.beginPath(); ctx.ellipse(hx, hy, 28, 22, head.angle, 0, Math.PI * 2); ctx.fill();
            
            // 尖耳朵
            ctx.fillStyle = '#4a0000';
            [-1, 1].forEach(dir => {
                ctx.beginPath();
                ctx.moveTo(hx + dir * 18, hy - 8);
                ctx.lineTo(hx + dir * 24, hy - 28);
                ctx.lineTo(hx + dir * 10, hy - 15);
                ctx.closePath(); ctx.fill();
            });
            
            // 眼睛（燃烧红眼）
            ctx.fillStyle = '#ff0000';
            
            ctx.beginPath();
            ctx.ellipse(hx - 10, hy - 4, 7, 5, head.angle, 0, Math.PI * 2);
            ctx.ellipse(hx + 10, hy - 4, 7, 5, head.angle, 0, Math.PI * 2);
            ctx.fill();
            
            // 竖瞳
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(hx - 10, hy - 4, 2, 5, 0, 0, Math.PI * 2);
            ctx.ellipse(hx + 10, hy - 4, 2, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // 血盆大口
            ctx.fillStyle = '#1a0000';
            ctx.beginPath(); ctx.ellipse(hx, hy + 14, 14, 8, 0, 0, Math.PI); ctx.fill();
            // 獠牙
            ctx.fillStyle = '#fff';
            [-8, 8].forEach(fx => {
                ctx.beginPath();
                ctx.moveTo(hx + fx - 3, hy + 18);
                ctx.lineTo(hx + fx, hy + 30 + Math.sin(time * 8 + idx) * 2);
                ctx.lineTo(hx + fx + 3, hy + 18);
                ctx.closePath(); ctx.fill();
            });
        });
        
        // ===== 异化标记 =====
        ctx.fillStyle = '#ff0000';
        
        ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
        ctx.fillText('☠ 异化 ☠', this.x, this.y - this.radius - 60);
        
        
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
                    draw(ctx) { ctx.fillStyle = '#ffcc00'; 
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();  }
                }); } break;
            case 'TYRANT_THUNDER': for (let i = 0; i < 8; i++) { const tx = this.player.x + (Math.random() - 0.5) * 300, ty = this.player.y + (Math.random() - 0.5) * 300;
                setTimeout(() => { this.combatSystem.spawnProjectile({ x: tx, y: 0, targetX: tx, targetY: ty, radius: 30, damage: this.damage * 1.3, owner: 'enemy', life: 0.3, maxLife: 0.3,
                    update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) { const alpha = this.life / this.maxLife; ctx.strokeStyle = `rgba(255,150,0,${alpha})`; ctx.lineWidth = 6;
                         ctx.beginPath(); ctx.moveTo(this.x, 0);
                        ctx.lineTo(this.targetX + (Math.random() - 0.5) * 20, this.targetY); ctx.stroke();
                        ctx.fillStyle = `rgba(255,200,0,${alpha*0.5})`; ctx.beginPath(); ctx.arc(this.targetX, this.targetY, this.radius, 0, Math.PI * 2); ctx.fill();  }
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
        
        // ===== 暴风雷暴光环 (简化) =====
        ctx.fillStyle = 'rgba(255,150,0,0.3)';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2.2, 0, Math.PI * 2); ctx.fill();
        
        // ===== 旋转雷电环 =====
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 4;
        for (let ring = 0; ring < 2; ring++) {
            const ringDist = this.radius + 20 + ring * 25;
            for (let i = 0; i < 10; i++) {
                const boltAngle = time * (2.5 + ring) + i * (Math.PI / 5);
                const bx = this.x + Math.cos(boltAngle) * ringDist;
                const by = this.y + Math.sin(boltAngle) * ringDist;
                
                ctx.beginPath();
                ctx.moveTo(bx - 5, by - 10);
                ctx.lineTo(bx + 3, by - 3);
                ctx.lineTo(bx - 3, by + 3);
                ctx.lineTo(bx + 5, by + 10);
                ctx.stroke();
            }
        }
        
        
        // ===== 黑云座（暴君之座）=====
        ctx.fillStyle = 'rgba(50,50,70,0.8)';
        for (let c = 0; c < 4; c++) {
            const cloudX = this.x + (c - 1.5) * 25;
            const cloudY = this.y + 50 + Math.sin(time * 2 + c) * 4;
            ctx.beginPath();
            ctx.ellipse(cloudX, cloudY, 40 - c * 5, 18, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // ===== 暗金长袍 =====
        ctx.fillStyle = '#3a2800';
        ctx.beginPath();
        ctx.moveTo(this.x - 40, this.y + 10);
        ctx.quadraticCurveTo(this.x - 55, this.y + 55, this.x - 35, this.y + 65);
        ctx.lineTo(this.x + 35, this.y + 65);
        ctx.quadraticCurveTo(this.x + 55, this.y + 55, this.x + 40, this.y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ff6600'; ctx.lineWidth = 3; ctx.stroke();
        
        // ===== 暴君躯体 (纯色) =====
        ctx.fillStyle = '#cc8800';
        
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 5, this.radius * 0.9, this.radius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        
        // ===== 肌肉手臂 =====
        ctx.fillStyle = '#cc9900';
        ctx.beginPath(); ctx.ellipse(this.x - 55, this.y + 5, 14, 28, -0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(this.x + 55, this.y + 5, 14, 28, 0.5, 0, Math.PI * 2); ctx.fill();
        
        // ===== 雷霆之矛（暗金）=====
        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 7;
        
        ctx.beginPath();
        ctx.moveTo(this.x - 70, this.y - 35);
        ctx.lineTo(this.x - 58, this.y + 45);
        ctx.stroke();
        // 矛尖雷电
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(this.x - 70, this.y - 35);
        ctx.lineTo(this.x - 65, this.y - 55);
        ctx.lineTo(this.x - 73, this.y - 42);
        ctx.lineTo(this.x - 67, this.y - 70 - Math.sin(time * 10) * 8);
        ctx.lineTo(this.x - 78, this.y - 48);
        ctx.closePath();
        ctx.fill();
        
        
        // ===== 暴君权杖 =====
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(this.x + 60, this.y - 30);
        ctx.lineTo(this.x + 65, this.y + 50);
        ctx.stroke();
        ctx.fillStyle = '#ff4400';
        
        ctx.beginPath();
        ctx.arc(this.x + 60, this.y - 38, 14 + Math.sin(time * 5) * 3, 0, Math.PI * 2);
        ctx.fill();
        
        
        // ===== 暴君头部 =====
        // 白发（狂乱）
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 6;
        for (let h = 0; h < 7; h++) {
            const hairAngle = -1 + h * 0.35 + Math.sin(time * 4 + h) * 0.15;
            ctx.beginPath();
            ctx.moveTo(this.x + Math.cos(hairAngle - Math.PI / 2) * 28, this.y - 35);
            ctx.quadraticCurveTo(
                this.x + Math.cos(hairAngle - Math.PI / 2) * 50 + Math.sin(time * 3 + h) * 8,
                this.y - 20 + h * 6,
                this.x + Math.cos(hairAngle - Math.PI / 2) * 40,
                this.y + 8
            );
            ctx.stroke();
        }
        // 胡须
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 5;
        for (let b = 0; b < 6; b++) {
            const beardAngle = -0.5 + b * 0.2;
            ctx.beginPath();
            ctx.moveTo(this.x + beardAngle * 35, this.y + 18);
            ctx.quadraticCurveTo(this.x + beardAngle * 40 + Math.sin(time * 2.5 + b) * 4, this.y + 40, this.x + beardAngle * 30, this.y + 55 + b * 4);
            ctx.stroke();
        }
        
        // 脸部 (纯色)
        ctx.fillStyle = '#c9a050';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 22, 30, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // ===== 燃烧之眼 =====
        ctx.fillStyle = '#ff4400';
        
        ctx.beginPath();
        ctx.ellipse(this.x - 13, this.y - 24, 9, 7, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 13, this.y - 24, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 闪电瞳孔
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(this.x - 13, this.y - 28); ctx.lineTo(this.x - 11, this.y - 24);
        ctx.lineTo(this.x - 15, this.y - 22); ctx.lineTo(this.x - 13, this.y - 19);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 13, this.y - 28); ctx.lineTo(this.x + 15, this.y - 24);
        ctx.lineTo(this.x + 11, this.y - 22); ctx.lineTo(this.x + 13, this.y - 19);
        ctx.closePath(); ctx.fill();
        
        // ===== 暴君王冠（黑金）=====
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 52, 35, 10, 0, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = '#ff6600'; ctx.lineWidth = 2; ctx.stroke();
        // 尖刺
        ctx.fillStyle = '#1a1a1a';
        for (let s = 0; s < 7; s++) {
            const spikeX = this.x - 30 + s * 10;
            const spikeHeight = s === 3 ? 35 : (s === 2 || s === 4 ? 26 : 18);
            ctx.beginPath();
            ctx.moveTo(spikeX - 5, this.y - 52);
            ctx.lineTo(spikeX, this.y - 52 - spikeHeight - Math.sin(time * 5 + s) * 4);
            ctx.lineTo(spikeX + 5, this.y - 52);
            ctx.closePath(); ctx.fill();
        }
        // 红宝石
        ctx.fillStyle = '#ff0000';
        
        ctx.beginPath(); ctx.arc(this.x, this.y - 60, 7, 0, Math.PI * 2); ctx.fill();
        
        
        // ===== 异化标记 =====
        ctx.fillStyle = '#ff6600';
        
        ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
        ctx.fillText('☠ 异化 ☠', this.x, this.y - this.radius - 65);
        
        
        // ===== 随机闪电 =====
        if (Math.random() > 0.6) {
            const boltAngle = Math.random() * Math.PI * 2;
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            let bx = this.x + Math.cos(boltAngle) * this.radius;
            let by = this.y + Math.sin(boltAngle) * this.radius;
            ctx.moveTo(bx, by);
            for (let seg = 0; seg < 5; seg++) {
                bx += Math.cos(boltAngle) * 18 + (Math.random() - 0.5) * 15;
                by += Math.sin(boltAngle) * 18 + (Math.random() - 0.5) * 15;
                ctx.lineTo(bx, by);
            }
            ctx.stroke();
            
        }
        
        if (this.state === 'TELEGRAPH') this.drawSkillIndicator(ctx);
    }
    drawSkillIndicator(ctx) { const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        ctx.fillStyle = 'rgba(255,200,0,0.3)'; ctx.beginPath(); ctx.moveTo(this.x, this.y);
        ctx.arc(this.x, this.y, 300, angle - 0.4, angle + 0.4); ctx.closePath(); ctx.fill(); }
}
