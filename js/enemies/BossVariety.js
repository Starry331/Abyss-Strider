/**
 * Boss Variety System - 完整重构版
 * 5个独特Boss，每个有独特战斗风格、技能和美术风格
 * 难度随关卡递增，技能数量递增
 */

import { MutatedIceDragonBoss, MutatedCerberusBoss, MutatedZeusBoss } from './MutatedBosses.js';
import { MutatedPaladinBoss } from './MutatedPaladin.js';

export class BossVariety {
    static createBoss(level, x, y, player, combatSystem, isMutated = false) {
        // 异化Boss
        if (isMutated && level >= 2) {
            switch (level) {
                case 2: return new MutatedIceDragonBoss(x, y, player, combatSystem);
                case 3: return new MutatedCerberusBoss(x, y, player, combatSystem);
                case 4: return new MutatedZeusBoss(x, y, player, combatSystem);
                case 5: return new MutatedPaladinBoss(x, y, player, combatSystem);
            }
        }
        // 普通Boss
        switch (level) {
            case 1: return new MonkeyBoss(x, y, player, combatSystem);
            case 2: return new IceDragonBoss(x, y, player, combatSystem);
            case 3: return new CerberusBoss(x, y, player, combatSystem);
            case 4: return new ZeusBoss(x, y, player, combatSystem);
            case 5: return new PaladinBoss(x, y, player, combatSystem);
            default: return new MonkeyBoss(x, y, player, combatSystem);
        }
    }
}

// ============================================
// 通用Boss基类 - 统一的位移技能箭头指示系统
// ============================================
class BaseBoss {
    constructor(x, y, player, combatSystem) {
        this.x = x;
        this.y = y;
        this.player = player;
        this.combatSystem = combatSystem;
        this.state = 'IDLE';
        this.timer = 0;
        this.currentSkill = null;
        this.phase = 1;
        this.phaseTransitioning = false;
        this.telegraphDuration = 0.8;
        this.dashTarget = { x: 0, y: 0 };
        this.skillQueue = [];
    }

    // 优化的位移技能箭头指示 - 更清晰美观
    drawDashIndicator(ctx, targetX, targetY, color, width = 25) {
        const time = Date.now() / 1000;
        const pulseAlpha = 0.5 + Math.sin(time * 10) * 0.3;
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        
        ctx.save();
        
        // 多层发光效果
        ctx.shadowColor = `rgba(${color}, 0.8)`;
        ctx.shadowBlur = 25;
        
        // 外层粗虚线路径 - 带脉冲
        const dashOffset = time * 100;
        ctx.strokeStyle = `rgba(${color}, ${pulseAlpha * 0.6})`;
        ctx.lineWidth = width;
        ctx.setLineDash([25, 15]);
        ctx.lineDashOffset = -dashOffset;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        
        // 内层实线
        ctx.strokeStyle = `rgba(255, 255, 255, ${pulseAlpha * 0.7})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        
        // 动态箭头 - 多层
        const arrowSize = 40 + Math.sin(time * 8) * 5;
        for (let layer = 0; layer < 3; layer++) {
            const layerAlpha = pulseAlpha * (1 - layer * 0.25);
            const layerSize = arrowSize + layer * 8;
            ctx.fillStyle = layer === 0 ? `rgba(255, 255, 255, ${layerAlpha})` : `rgba(${color}, ${layerAlpha * 0.7})`;
            ctx.beginPath();
            ctx.moveTo(targetX + Math.cos(angle) * 15, targetY + Math.sin(angle) * 15);
            ctx.lineTo(targetX - Math.cos(angle - 0.45) * layerSize, targetY - Math.sin(angle - 0.45) * layerSize);
            ctx.lineTo(targetX - Math.cos(angle) * layerSize * 0.4, targetY - Math.sin(angle) * layerSize * 0.4);
            ctx.lineTo(targetX - Math.cos(angle + 0.45) * layerSize, targetY - Math.sin(angle + 0.45) * layerSize);
            ctx.closePath();
            ctx.fill();
        }
        
        // 起点光环 - 旋转
        ctx.strokeStyle = `rgba(${color}, ${pulseAlpha})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.lineDashOffset = time * 50;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 12, 0, Math.PI * 2);
        ctx.stroke();
        
        // 目标位置多重脉冲圈
        for (let ring = 0; ring < 3; ring++) {
            const ringAlpha = pulseAlpha * (1 - ring * 0.3);
            const ringRadius = 45 + ring * 15 + Math.sin(time * 8 + ring) * 8;
            ctx.strokeStyle = `rgba(${color}, ${ringAlpha * 0.8})`;
            ctx.lineWidth = 4 - ring;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(targetX, targetY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 十字准星 - 旋转
        ctx.strokeStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
        ctx.lineWidth = 2;
        const crossRotation = time * 2;
        for (let i = 0; i < 4; i++) {
            const ca = crossRotation + (Math.PI / 2) * i;
            ctx.beginPath();
            ctx.moveTo(targetX + Math.cos(ca) * 15, targetY + Math.sin(ca) * 15);
            ctx.lineTo(targetX + Math.cos(ca) * 30, targetY + Math.sin(ca) * 30);
            ctx.stroke();
        }
        
        // 危险警告文字 - 带背景
        const textX = (this.x + targetX) / 2;
        const textY = (this.y + targetY) / 2 - 25;
        ctx.fillStyle = `rgba(0, 0, 0, ${pulseAlpha * 0.5})`;
        ctx.fillRect(textX - 45, textY - 18, 90, 26);
        ctx.fillStyle = `rgba(255, 80, 80, ${pulseAlpha + 0.3})`;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ 冲刺 ⚠', textX, textY);
        
        ctx.restore();
    }

    // 优化的AOE范围指示 - 更美观
    drawAOEIndicator(ctx, centerX, centerY, radius, color, showIcon = true) {
        const time = Date.now() / 1000;
        const pulseAlpha = 0.35 + Math.sin(time * 8) * 0.2;
        const pulseRadius = radius * (1 + Math.sin(time * 6) * 0.05);
        
        ctx.save();
        ctx.shadowColor = `rgba(${color}, 0.6)`;
        ctx.shadowBlur = 20;
        
        // 渐变填充
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
        gradient.addColorStop(0, `rgba(${color}, ${pulseAlpha * 0.1})`);
        gradient.addColorStop(0.6, `rgba(${color}, ${pulseAlpha * 0.25})`);
        gradient.addColorStop(1, `rgba(${color}, ${pulseAlpha * 0.4})`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 多层边缘线
        for (let ring = 0; ring < 2; ring++) {
            const ringAlpha = pulseAlpha + 0.2 - ring * 0.1;
            ctx.strokeStyle = `rgba(${color}, ${ringAlpha})`;
            ctx.lineWidth = 4 - ring * 2;
            ctx.setLineDash([12, 6]);
            ctx.lineDashOffset = -time * 60 * (ring % 2 === 0 ? 1 : -1);
            ctx.beginPath();
            ctx.arc(centerX, centerY, pulseRadius - ring * 8, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        
        // 内部网格线
        ctx.strokeStyle = `rgba(${color}, ${pulseAlpha * 0.3})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const ga = (Math.PI * 2 / 8) * i + time * 0.5;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + Math.cos(ga) * pulseRadius, centerY + Math.sin(ga) * pulseRadius);
            ctx.stroke();
        }
        
        // 警告图标
        if (showIcon) {
            ctx.fillStyle = `rgba(0, 0, 0, ${pulseAlpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(centerX, centerY - pulseRadius - 20, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(255, 60, 60, ${pulseAlpha + 0.5})`;
            ctx.font = 'bold 26px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', centerX, centerY - pulseRadius - 12);
        }
        
        ctx.restore();
    }
    
    // 扇形攻击预警
    drawConeIndicator(ctx, angle, spread, range, color) {
        const time = Date.now() / 1000;
        const pulseAlpha = 0.35 + Math.sin(time * 8) * 0.2;
        
        ctx.save();
        ctx.shadowColor = `rgba(${color}, 0.5)`;
        ctx.shadowBlur = 15;
        
        // 扇形填充
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, range);
        gradient.addColorStop(0, `rgba(${color}, ${pulseAlpha * 0.1})`);
        gradient.addColorStop(1, `rgba(${color}, ${pulseAlpha * 0.4})`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.arc(this.x, this.y, range, angle - spread, angle + spread);
        ctx.closePath();
        ctx.fill();
        
        // 扇形边缘
        ctx.strokeStyle = `rgba(${color}, ${pulseAlpha + 0.3})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.lineDashOffset = -time * 50;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.arc(this.x, this.y, range, angle - spread, angle + spread);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 方向箭头
        ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
        const arrowDist = range * 0.7;
        const arrowX = this.x + Math.cos(angle) * arrowDist;
        const arrowY = this.y + Math.sin(angle) * arrowDist;
        ctx.beginPath();
        ctx.moveTo(arrowX + Math.cos(angle) * 20, arrowY + Math.sin(angle) * 20);
        ctx.lineTo(arrowX + Math.cos(angle + 2.5) * 15, arrowY + Math.sin(angle + 2.5) * 15);
        ctx.lineTo(arrowX + Math.cos(angle - 2.5) * 15, arrowY + Math.sin(angle - 2.5) * 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    // 落物预警 (从上方落下)
    drawFallIndicator(ctx, targetX, targetY, radius, color) {
        const time = Date.now() / 1000;
        const pulseAlpha = 0.4 + Math.sin(time * 10) * 0.25;
        
        ctx.save();
        
        // 目标圆圈
        ctx.shadowColor = `rgba(${color}, 0.6)`;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = `rgba(${color}, ${pulseAlpha + 0.3})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.lineDashOffset = -time * 80;
        ctx.beginPath();
        ctx.arc(targetX, targetY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 填充
        ctx.fillStyle = `rgba(${color}, ${pulseAlpha * 0.2})`;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(targetX, targetY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 下落箭头
        ctx.fillStyle = `rgba(${color}, ${pulseAlpha + 0.2})`;
        const arrowY = targetY - radius - 30 - Math.sin(time * 8) * 10;
        ctx.beginPath();
        ctx.moveTo(targetX, arrowY + 20);
        ctx.lineTo(targetX - 12, arrowY);
        ctx.lineTo(targetX + 12, arrowY);
        ctx.closePath();
        ctx.fill();
        
        // 下落线
        ctx.strokeStyle = `rgba(${color}, ${pulseAlpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(targetX, arrowY - 10);
        ctx.lineTo(targetX, arrowY - 50);
        ctx.stroke();
        
        ctx.restore();
    }
}

// ============================================
// Level 1: 险恶猴子 (Monkey Boss)
// 风格：敏捷灵活，快速打击
// 技能数量：4个 (入门难度)
// ============================================
class MonkeyBoss extends BaseBoss {
    constructor(x, y, player, combatSystem) {
        super(x, y, player, combatSystem);
        this.level = 1;
        this.name = '险恶猴子';
        this.maxHp = 300;
        this.hp = this.maxHp;
        this.radius = 45;
        this.color = '#8b4513';
        this.telegraphDuration = 1.3; // 较长前摇，新手友好
        this.attackCooldown = 1.8; // 攻击间隔
        
        // 6个技能 - 更有挑战性
        this.skills = ['QUICK_DASH', 'BANANA_THROW', 'TAIL_WHIP', 'JUNGLE_LEAP', 'VINE_TRAP', 'COCONUT_RAIN'];
        this.phase2Skills = [...this.skills, 'FRENZY', 'PRIMAL_RAGE'];
    }

    update(deltaTime) {
        // 移动AI
        if (this.state === 'IDLE') {
            const dx = this.player.x - this.x;
            const dy = this.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const moveSpeed = this.phase === 2 ? 70 : 50;
            
            if (dist > 180) {
                this.x += (dx / dist) * moveSpeed * deltaTime;
                this.y += (dy / dist) * moveSpeed * deltaTime;
            }
        }

        // 状态机
        switch (this.state) {
            case 'IDLE':
                this.timer += deltaTime;
                if (this.timer >= 1.5) {
                    this.state = 'TELEGRAPH';
                    const skillPool = this.phase === 2 ? this.phase2Skills : this.skills;
                    this.currentSkill = skillPool[Math.floor(Math.random() * skillPool.length)];
                    this.prepareTelegraph();
                    this.timer = 0;
                }
                break;
            case 'TELEGRAPH':
                this.timer += deltaTime;
                if (this.timer >= this.telegraphDuration) {
                    this.executeAttack();
                    this.state = 'IDLE';
                    this.timer = 0;
                }
                break;
        }

        // 阶段转换
        if (this.hp < this.maxHp * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.telegraphDuration = 0.8;
        }
    }

    prepareTelegraph() {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        switch (this.currentSkill) {
            case 'QUICK_DASH':
            case 'JUNGLE_LEAP':
                this.dashTarget = {
                    x: this.player.x + Math.cos(angle) * 50,
                    y: this.player.y + Math.sin(angle) * 50
                };
                break;
        }
    }

    executeAttack() {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        
        switch (this.currentSkill) {
            case 'QUICK_DASH':
                // 快速冲刺
                const dashDist = 200;
                for (let i = 0; i < 4; i++) {
                    setTimeout(() => {
                        this.x += Math.cos(angle) * (dashDist / 4);
                        this.y += Math.sin(angle) * (dashDist / 4);
                        const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                        if (dist < 60) this.player.takeDamage(15);
                    }, i * 50);
                }
                break;

            case 'BANANA_THROW':
                // 投掷香蕉
                const bananaCount = this.phase === 2 ? 5 : 3;
                for (let i = 0; i < bananaCount; i++) {
                    const spreadAngle = angle + (i - Math.floor(bananaCount / 2)) * 0.25;
                    this.combatSystem.spawnProjectile({
                        x: this.x, y: this.y,
                        vx: Math.cos(spreadAngle) * 350,
                        vy: Math.sin(spreadAngle) * 350,
                        radius: 10, damage: 12, owner: 'enemy',
                        color: '#ffff00', rotation: 0,
                        update(dt) {
                            this.x += this.vx * dt;
                            this.y += this.vy * dt;
                            this.rotation += dt * 10;
                        },
                        draw(ctx) {
                            ctx.save();
                            ctx.translate(this.x, this.y);
                            ctx.rotate(this.rotation);
                            ctx.fillStyle = '#ffff00';
                            ctx.shadowColor = '#ffa500';
                            ctx.shadowBlur = 10;
                            ctx.beginPath();
                            ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.shadowBlur = 0;
                            ctx.restore();
                        }
                    });
                }
                break;

            case 'TAIL_WHIP':
                // 尾巴横扫 - 近身AOE
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y,
                    radius: 80, damage: 18, owner: 'enemy',
                    life: 0.3, maxLife: 0.3,
                    update(dt) {
                        this.life -= dt;
                        if (this.life <= 0) this.markedForDeletion = true;
                    },
                    draw(ctx) {
                        const alpha = this.life / this.maxLife;
                        const sweep = (1 - alpha) * Math.PI;
                        ctx.strokeStyle = `rgba(139, 69, 19, ${alpha})`;
                        ctx.lineWidth = 15;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, -sweep, sweep);
                        ctx.stroke();
                    }
                });
                break;

            case 'JUNGLE_LEAP':
                // 丛林跳跃 - 跳到玩家位置
                const targetX = this.player.x;
                const targetY = this.player.y;
                setTimeout(() => {
                    this.x = targetX;
                    this.y = targetY;
                    // 落地冲击
                    this.combatSystem.spawnProjectile({
                        x: targetX, y: targetY,
                        radius: 100, damage: 20, owner: 'enemy',
                        life: 0.4, maxLife: 0.4,
                        update(dt) {
                            this.life -= dt;
                            if (this.life <= 0) this.markedForDeletion = true;
                        },
                        draw(ctx) {
                            const alpha = this.life / this.maxLife;
                            ctx.fillStyle = `rgba(139, 69, 19, ${alpha * 0.5})`;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius * (1 - alpha * 0.5), 0, Math.PI * 2);
                            ctx.fill();
                        }
                    });
                }, 300);
                break;

            case 'FRENZY':
                // 狂暴连击 (Phase 2)
                for (let i = 0; i < 6; i++) {
                    setTimeout(() => {
                        const frenzyAngle = (Math.PI * 2 / 6) * i;
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y,
                            vx: Math.cos(frenzyAngle) * 400,
                            vy: Math.sin(frenzyAngle) * 400,
                            radius: 8, damage: 10, owner: 'enemy',
                            update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                            draw(ctx) {
                                ctx.fillStyle = '#ff4500';
                                ctx.shadowColor = '#ff0000';
                                ctx.shadowBlur = 12;
                                ctx.beginPath();
                                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.shadowBlur = 0;
                            }
                        });
                    }, i * 100);
                }
                break;

            case 'VINE_TRAP':
                // 藤蔓陷阱 - 在玩家位置生成减速区域
                for (let i = 0; i < 3; i++) {
                    const trapX = this.player.x + (Math.random() - 0.5) * 150;
                    const trapY = this.player.y + (Math.random() - 0.5) * 150;
                    setTimeout(() => {
                        this.combatSystem.spawnProjectile({
                            x: trapX, y: trapY,
                            radius: 60, damage: 8, owner: 'enemy',
                            life: 2.5, maxLife: 2.5,
                            update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) {
                                const alpha = Math.min(1, this.life / this.maxLife * 2);
                                ctx.fillStyle = `rgba(34, 139, 34, ${alpha * 0.4})`;
                                ctx.strokeStyle = `rgba(0, 100, 0, ${alpha})`;
                                ctx.lineWidth = 3;
                                ctx.beginPath();
                                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.stroke();
                                // 藤蔓纹理
                                for (let v = 0; v < 6; v++) {
                                    const va = (Math.PI * 2 / 6) * v;
                                    ctx.strokeStyle = `rgba(0, 80, 0, ${alpha * 0.6})`;
                                    ctx.beginPath();
                                    ctx.moveTo(this.x, this.y);
                                    ctx.lineTo(this.x + Math.cos(va) * this.radius * 0.8, this.y + Math.sin(va) * this.radius * 0.8);
                                    ctx.stroke();
                                }
                            }
                        });
                    }, i * 200);
                }
                break;

            case 'COCONUT_RAIN':
                // 椰子雨 - 从上方落下椰子
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        const cocoX = this.player.x + (Math.random() - 0.5) * 250;
                        this.combatSystem.spawnProjectile({
                            x: cocoX, y: this.player.y - 250,
                            vy: 400, radius: 18, damage: 15, owner: 'enemy',
                            targetY: this.player.y + (Math.random() - 0.5) * 50,
                            rotation: 0,
                            update(dt) {
                                this.y += this.vy * dt;
                                this.rotation += dt * 6;
                                if (this.y >= this.targetY) this.markedForDeletion = true;
                            },
                            draw(ctx) {
                                ctx.save();
                                ctx.translate(this.x, this.y);
                                ctx.rotate(this.rotation);
                                ctx.fillStyle = '#8b4513';
                                ctx.shadowColor = '#654321';
                                ctx.shadowBlur = 8;
                                ctx.beginPath();
                                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.fillStyle = '#5a3010';
                                ctx.beginPath();
                                ctx.arc(-5, -5, 4, 0, Math.PI * 2);
                                ctx.arc(5, -3, 4, 0, Math.PI * 2);
                                ctx.arc(0, 5, 4, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.shadowBlur = 0;
                                ctx.restore();
                            }
                        });
                    }, i * 120);
                }
                break;

            case 'PRIMAL_RAGE':
                // 原始狂怒 - 狂暴连续冲刺+落地震
                for (let dash = 0; dash < 3; dash++) {
                    setTimeout(() => {
                        const dashAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                        this.x += Math.cos(dashAngle) * 150;
                        this.y += Math.sin(dashAngle) * 150;
                        // 每次冲刺后释放震波
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y,
                            radius: 0, maxRadius: 120, damage: 18, owner: 'enemy',
                            life: 0.4, maxLife: 0.4,
                            update(dt) {
                                this.radius = this.maxRadius * (1 - this.life / this.maxLife);
                                this.life -= dt;
                                if (this.life <= 0) this.markedForDeletion = true;
                            },
                            draw(ctx) {
                                const alpha = this.life / this.maxLife;
                                ctx.strokeStyle = `rgba(255, 69, 0, ${alpha})`;
                                ctx.lineWidth = 8;
                                ctx.beginPath();
                                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                                ctx.stroke();
                            }
                        });
                    }, dash * 400);
                }
                break;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) this.hp = 0;
    }

    draw(ctx) {
        const time = Date.now() / 1000;
        const pulse = 1 + Math.sin(time * 3) * 0.08;
        const isRage = this.phase === 2;
        
        // Phase 2 狂暴背景光环
        if (isRage) {
            const rageGlow = ctx.createRadialGradient(this.x, this.y, this.radius, this.x, this.y, this.radius * 2);
            rageGlow.addColorStop(0, 'rgba(255, 69, 0, 0.4)');
            rageGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = rageGlow;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // 狂暴火焰粒子
            for (let i = 0; i < 8; i++) {
                const fa = time * 3 + i * 0.8;
                const fx = this.x + Math.cos(fa) * (this.radius + 10);
                const fy = this.y + Math.sin(fa) * (this.radius + 10) - Math.abs(Math.sin(time * 5 + i)) * 15;
                ctx.fillStyle = `rgba(255, ${100 + Math.sin(time * 8 + i) * 50}, 0, 0.7)`;
                ctx.beginPath();
                ctx.arc(fx, fy, 5 + Math.sin(time * 6 + i) * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // 身体渐变 - 狂暴时变红
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        if (isRage) {
            gradient.addColorStop(0, '#ff6347');
            gradient.addColorStop(0.5, '#cd4f39');
            gradient.addColorStop(1, '#8b2500');
        } else {
            gradient.addColorStop(0, '#cd853f');
            gradient.addColorStop(0.5, '#8b4513');
            gradient.addColorStop(1, '#654321');
        }
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = isRage ? '#ff4500' : '#8b4513';
        ctx.shadowBlur = isRage ? 30 : 15;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // 毛发纹理
        ctx.strokeStyle = isRage ? '#8b0000' : '#654321';
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
            const ha = (Math.PI * 2 / 12) * i;
            const hLen = this.radius * 0.3;
            ctx.beginPath();
            ctx.moveTo(this.x + Math.cos(ha) * this.radius * 0.7, this.y + Math.sin(ha) * this.radius * 0.7);
            ctx.lineTo(this.x + Math.cos(ha) * (this.radius + hLen * Math.sin(time * 4 + i)), this.y + Math.sin(ha) * (this.radius + hLen * Math.sin(time * 4 + i)));
            ctx.stroke();
        }
        
        // 耳朵
        ctx.fillStyle = isRage ? '#cd4f39' : '#8b4513';
        ctx.beginPath();
        ctx.ellipse(this.x - 30, this.y - 25, 12, 18, -0.3, 0, Math.PI * 2);
        ctx.ellipse(this.x + 30, this.y - 25, 12, 18, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // 眼睛 - 狂暴时发红光
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(this.x - 12, this.y - 8, 8, 0, Math.PI * 2);
        ctx.arc(this.x + 12, this.y - 8, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = isRage ? '#ff0000' : '#000';
        if (isRage) { ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 10; }
        ctx.beginPath();
        ctx.arc(this.x - 12, this.y - 8, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 12, this.y - 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // 鼻子和嘴巴
        ctx.fillStyle = isRage ? '#8b0000' : '#654321';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 8, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 獠牙 (狂暴时显示)
        if (isRage) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(this.x - 8, this.y + 15);
            ctx.lineTo(this.x - 5, this.y + 25);
            ctx.lineTo(this.x - 2, this.y + 15);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.x + 8, this.y + 15);
            ctx.lineTo(this.x + 5, this.y + 25);
            ctx.lineTo(this.x + 2, this.y + 15);
            ctx.fill();
        }
        
        // 尾巴
        ctx.strokeStyle = isRage ? '#cd4f39' : '#8b4513';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x + this.radius * 0.8, this.y + 10);
        ctx.quadraticCurveTo(this.x + this.radius + 30, this.y + Math.sin(time * 4) * 20, this.x + this.radius + 50, this.y - 20 + Math.sin(time * 3) * 15);
        ctx.stroke();
        
        // Phase 2 狂暴环形能量
        if (isRage) {
            ctx.strokeStyle = `rgba(255, 69, 0, ${0.6 + Math.sin(time * 6) * 0.3})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 20 + Math.sin(time * 4) * 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // 技能指示器
        if (this.state === 'TELEGRAPH') {
            this.drawSkillIndicator(ctx);
        }
    }

    drawSkillIndicator(ctx) {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        
        switch (this.currentSkill) {
            case 'QUICK_DASH':
                this.drawDashIndicator(ctx, this.dashTarget.x, this.dashTarget.y, '255, 165, 0');
                break;
            case 'BANANA_THROW':
                // 扇形指示
                ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.arc(this.x, this.y, 250, angle - 0.4, angle + 0.4);
                ctx.closePath();
                ctx.fill();
                break;
            case 'TAIL_WHIP':
                this.drawAOEIndicator(ctx, this.x, this.y, 80, '139, 69, 19');
                break;
            case 'JUNGLE_LEAP':
                this.drawDashIndicator(ctx, this.player.x, this.player.y, '255, 140, 0');
                this.drawAOEIndicator(ctx, this.player.x, this.player.y, 100, '139, 69, 19');
                break;
            case 'FRENZY':
                // 全方向警告
                for (let i = 0; i < 6; i++) {
                    const a = (Math.PI * 2 / 6) * i;
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x + Math.cos(a) * 150, this.y + Math.sin(a) * 150);
                    ctx.stroke();
                }
                break;
            case 'VINE_TRAP':
                // 玩家周围区域警告
                this.drawAOEIndicator(ctx, this.player.x, this.player.y, 100, '34, 139, 34');
                break;
            case 'COCONUT_RAIN':
                // 头顶落物警告
                this.drawAOEIndicator(ctx, this.player.x, this.player.y, 130, '139, 90, 43');
                ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('↓↓↓', this.player.x, this.player.y - 80);
                break;
            case 'PRIMAL_RAGE':
                // 连续冲刺警告
                this.drawDashIndicator(ctx, this.player.x, this.player.y, '255, 0, 0');
                ctx.fillStyle = 'rgba(255, 69, 0, 0.4)';
                ctx.font = 'bold 28px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('!!!', this.x, this.y - this.radius - 20);
                break;
        }
    }
}

// ============================================
// Level 2: 冰龙 (Ice Dragon Boss)
// 风格：冰霜控制，减速和范围冻结
// 技能数量：5个 (中等难度)
// ============================================
class IceDragonBoss extends BaseBoss {
    constructor(x, y, player, combatSystem) {
        super(x, y, player, combatSystem);
        this.level = 2;
        this.name = '冰霜巨龙';
        this.maxHp = 450;  // 削弱血量
        this.hp = this.maxHp;
        this.radius = 55;
        this.color = '#87ceeb';
        this.damage = 15;  // 伤害削弱 18->15
        this.telegraphDuration = 1.3; // 前摇加长
        this.flightMode = false;
        
        // 6个技能
        this.skills = ['ICE_BREATH', 'FROST_DIVE', 'BLIZZARD', 'ICE_SPIKES', 'FROZEN_WINGS', 'FROST_NOVA'];
        this.phase2Skills = [...this.skills, 'ABSOLUTE_ZERO', 'GLACIAL_STORM'];
    }

    update(deltaTime) {
        // 飞行移动AI
        if (this.state === 'IDLE') {
            const dx = this.player.x - this.x;
            const dy = this.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const moveSpeed = this.flightMode ? 100 : 60;
            
            if (this.flightMode) {
                // 环绕玩家飞行
                const circleAngle = Math.atan2(dy, dx) + deltaTime * 2;
                this.x = this.player.x + Math.cos(circleAngle) * 250;
                this.y = this.player.y + Math.sin(circleAngle) * 250;
            } else if (dist > 200) {
                this.x += (dx / dist) * moveSpeed * deltaTime;
                this.y += (dy / dist) * moveSpeed * deltaTime;
            }
        }

        switch (this.state) {
            case 'IDLE':
                this.timer += deltaTime;
                if (this.timer >= 2.0) {
                    this.state = 'TELEGRAPH';
                    const skillPool = this.phase === 2 ? this.phase2Skills : this.skills;
                    this.currentSkill = skillPool[Math.floor(Math.random() * skillPool.length)];
                    this.prepareTelegraph();
                    this.timer = 0;
                }
                break;
            case 'TELEGRAPH':
                this.timer += deltaTime;
                if (this.timer >= this.telegraphDuration) {
                    this.executeAttack();
                    this.state = 'IDLE';
                    this.timer = 0;
                }
                break;
        }

        if (this.hp < this.maxHp * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.telegraphDuration = 1.0;
        }
    }

    prepareTelegraph() {
        switch (this.currentSkill) {
            case 'FROST_DIVE':
                this.dashTarget = { x: this.player.x, y: this.player.y };
                this.flightMode = true;
                break;
        }
    }

    executeAttack() {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        
        switch (this.currentSkill) {
            case 'ICE_BREATH':
                // 冰霜吐息 - 锥形范围
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        for (let j = -2; j <= 2; j++) {
                            const breathAngle = angle + j * 0.15;
                            this.combatSystem.spawnProjectile({
                                x: this.x, y: this.y,
                                vx: Math.cos(breathAngle) * (280 + i * 15),
                                vy: Math.sin(breathAngle) * (280 + i * 15),
                                radius: 8, damage: 8, owner: 'enemy',
                                life: 1.5,
                                update(dt) {
                                    this.x += this.vx * dt;
                                    this.y += this.vy * dt;
                                    this.life -= dt;
                                    if (this.life <= 0) this.markedForDeletion = true;
                                },
                                draw(ctx) {
                                    ctx.fillStyle = `rgba(135, 206, 235, ${this.life})`;
                                    ctx.shadowColor = '#00ffff';
                                    ctx.shadowBlur = 15;
                                    ctx.beginPath();
                                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                                    ctx.fill();
                                    ctx.shadowBlur = 0;
                                }
                            });
                        }
                    }, i * 80);
                }
                break;

            case 'FROST_DIVE':
                // 冰霜俯冲
                const diveTarget = { ...this.dashTarget };
                setTimeout(() => {
                    this.x = diveTarget.x;
                    this.y = diveTarget.y;
                    this.flightMode = false;
                    // 落地冰环
                    for (let i = 0; i < 12; i++) {
                        const ringAngle = (Math.PI * 2 / 12) * i;
                        this.combatSystem.spawnProjectile({
                            x: diveTarget.x, y: diveTarget.y,
                            vx: Math.cos(ringAngle) * 200,
                            vy: Math.sin(ringAngle) * 200,
                            radius: 10, damage: 12, owner: 'enemy',
                            life: 1,
                            update(dt) {
                                this.x += this.vx * dt;
                                this.y += this.vy * dt;
                                this.vx *= 0.98;
                                this.vy *= 0.98;
                                this.life -= dt;
                                if (this.life <= 0) this.markedForDeletion = true;
                            },
                            draw(ctx) {
                                ctx.fillStyle = '#87ceeb';
                                ctx.shadowColor = '#00ffff';
                                ctx.shadowBlur = 12;
                                ctx.beginPath();
                                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.shadowBlur = 0;
                            }
                        });
                    }
                }, 400);
                break;

            case 'BLIZZARD':
                // 暴风雪 - 随机冰柱
                for (let i = 0; i < 15; i++) {
                    setTimeout(() => {
                        const blizzX = this.player.x + (Math.random() - 0.5) * 300;
                        const blizzY = this.player.y + (Math.random() - 0.5) * 300;
                        this.combatSystem.spawnProjectile({
                            x: blizzX, y: blizzY - 200,
                            vy: 350, radius: 12, damage: 10, owner: 'enemy',
                            life: 1,
                            update(dt) {
                                this.y += this.vy * dt;
                                this.life -= dt;
                                if (this.life <= 0) this.markedForDeletion = true;
                            },
                            draw(ctx) {
                                ctx.fillStyle = '#b0e0e6';
                                ctx.shadowColor = '#ffffff';
                                ctx.shadowBlur = 15;
                                // 冰柱形状
                                ctx.beginPath();
                                ctx.moveTo(this.x, this.y - 20);
                                ctx.lineTo(this.x + 8, this.y + 10);
                                ctx.lineTo(this.x - 8, this.y + 10);
                                ctx.closePath();
                                ctx.fill();
                                ctx.shadowBlur = 0;
                            }
                        });
                    }, i * 100);
                }
                break;

            case 'ICE_SPIKES':
                // 冰刺阵 - 地面冰刺
                for (let i = 0; i < 8; i++) {
                    const spikeAngle = (Math.PI * 2 / 8) * i;
                    for (let j = 1; j <= 3; j++) {
                        setTimeout(() => {
                            const spikeX = this.x + Math.cos(spikeAngle) * (60 * j);
                            const spikeY = this.y + Math.sin(spikeAngle) * (60 * j);
                            this.combatSystem.spawnProjectile({
                                x: spikeX, y: spikeY,
                                radius: 20, damage: 11, owner: 'enemy',
                                life: 0.5, maxLife: 0.5,
                                update(dt) {
                                    this.life -= dt;
                                    if (this.life <= 0) this.markedForDeletion = true;
                                },
                                draw(ctx) {
                                    const alpha = this.life / this.maxLife;
                                    const height = 30 * alpha;
                                    ctx.fillStyle = `rgba(176, 224, 230, ${alpha})`;
                                    ctx.shadowColor = '#00ffff';
                                    ctx.shadowBlur = 10;
                                    ctx.beginPath();
                                    ctx.moveTo(this.x, this.y - height);
                                    ctx.lineTo(this.x + 10, this.y);
                                    ctx.lineTo(this.x - 10, this.y);
                                    ctx.closePath();
                                    ctx.fill();
                                    ctx.shadowBlur = 0;
                                }
                            });
                        }, j * 150);
                    }
                }
                break;

            case 'FROZEN_WINGS':
                // 冰翼风暴
                this.flightMode = true;
                for (let wave = 0; wave < 3; wave++) {
                    setTimeout(() => {
                        for (let i = 0; i < 16; i++) {
                            const wingAngle = (Math.PI * 2 / 16) * i;
                            this.combatSystem.spawnProjectile({
                                x: this.x, y: this.y,
                                vx: Math.cos(wingAngle) * 250,
                                vy: Math.sin(wingAngle) * 250,
                                radius: 6, damage: 6, owner: 'enemy',
                                update(dt) {
                                    this.x += this.vx * dt;
                                    this.y += this.vy * dt;
                                },
                                draw(ctx) {
                                    ctx.fillStyle = '#e0ffff';
                                    ctx.shadowColor = '#87ceeb';
                                    ctx.shadowBlur = 8;
                                    ctx.beginPath();
                                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                                    ctx.fill();
                                    ctx.shadowBlur = 0;
                                }
                            });
                        }
                    }, wave * 400);
                }
                setTimeout(() => { this.flightMode = false; }, 1500);
                break;

            case 'ABSOLUTE_ZERO':
                // 绝对零度 (Phase 2) - 大范围冻结
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y,
                    radius: 0, maxRadius: 250, damage: 20, owner: 'enemy',
                    life: 1.5, maxLife: 1.5,
                    update(dt) {
                        this.radius = this.maxRadius * (1 - this.life / this.maxLife);
                        this.life -= dt;
                        if (this.life <= 0) this.markedForDeletion = true;
                    },
                    draw(ctx) {
                        const alpha = this.life / this.maxLife;
                        ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.3})`;
                        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                        ctx.lineWidth = 5;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                });
                break;

            case 'FROST_NOVA':
                // 冰霜新星 - 近身爆发
                for (let ring = 0; ring < 2; ring++) {
                    setTimeout(() => {
                        for (let i = 0; i < 12; i++) {
                            const novaAngle = (Math.PI * 2 / 12) * i + ring * 0.15;
                            this.combatSystem.spawnProjectile({
                                x: this.x, y: this.y,
                                vx: Math.cos(novaAngle) * (180 + ring * 80),
                                vy: Math.sin(novaAngle) * (180 + ring * 80),
                                radius: 10, damage: 9, owner: 'enemy', life: 1.2,
                                update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                                draw(ctx) {
                                    ctx.fillStyle = `rgba(200, 240, 255, ${this.life})`; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 12;
                                    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
                                }
                            });
                        }
                    }, ring * 300);
                }
                break;

            case 'GLACIAL_STORM':
                // 冰川风暴 (Phase 2) - 持续追踪暴风雪
                const stormDuration = 3000;
                const stormInterval = setInterval(() => {
                    for (let i = 0; i < 5; i++) {
                        const sx = this.player.x + (Math.random() - 0.5) * 200;
                        const sy = this.player.y + (Math.random() - 0.5) * 200;
                        this.combatSystem.spawnProjectile({
                            x: sx, y: sy - 150, vy: 300, radius: 12, damage: 8, owner: 'enemy', targetY: sy,
                            update(dt) { this.y += this.vy * dt; if (this.y >= this.targetY) this.markedForDeletion = true; },
                            draw(ctx) {
                                ctx.fillStyle = '#e0ffff'; ctx.shadowColor = '#87ceeb'; ctx.shadowBlur = 10;
                                ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
                            }
                        });
                    }
                }, 200);
                setTimeout(() => clearInterval(stormInterval), stormDuration);
                break;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) this.hp = 0;
    }

    draw(ctx) {
        const time = Date.now() / 1000;
        const pulse = 1 + Math.sin(time * 2) * 0.1;
        const isRage = this.phase === 2;
        
        // Phase 2 狂暴冰霜风暴背景
        if (isRage) {
            const rageGlow = ctx.createRadialGradient(this.x, this.y, this.radius, this.x, this.y, this.radius * 2.5);
            rageGlow.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
            rageGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = rageGlow;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // 旋转冰晶粒子
            for (let i = 0; i < 12; i++) {
                const pa = time * 2 + i * 0.5;
                const pd = this.radius + 20 + Math.sin(time * 3 + i) * 10;
                const px = this.x + Math.cos(pa) * pd;
                const py = this.y + Math.sin(pa) * pd;
                ctx.fillStyle = `rgba(200, 255, 255, ${0.6 + Math.sin(time * 4 + i) * 0.3})`;
                ctx.beginPath();
                ctx.moveTo(px, py - 6); ctx.lineTo(px + 4, py); ctx.lineTo(px, py + 6); ctx.lineTo(px - 4, py);
                ctx.closePath();
                ctx.fill();
            }
        }
        
        // 龙翅膀
        ctx.fillStyle = isRage ? 'rgba(0, 200, 255, 0.6)' : 'rgba(135, 206, 235, 0.5)';
        // 左翅
        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y);
        ctx.quadraticCurveTo(this.x - 80, this.y - 40 + Math.sin(time * 3) * 10, this.x - 70, this.y + 20);
        ctx.quadraticCurveTo(this.x - 50, this.y + 10, this.x - 20, this.y);
        ctx.fill();
        // 右翅
        ctx.beginPath();
        ctx.moveTo(this.x + 20, this.y);
        ctx.quadraticCurveTo(this.x + 80, this.y - 40 + Math.sin(time * 3) * 10, this.x + 70, this.y + 20);
        ctx.quadraticCurveTo(this.x + 50, this.y + 10, this.x + 20, this.y);
        ctx.fill();
        
        // 冰龙身体
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        if (isRage) {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.4, '#00ffff');
            gradient.addColorStop(1, '#0080ff');
        } else {
            gradient.addColorStop(0, '#e0ffff');
            gradient.addColorStop(0.5, '#87ceeb');
            gradient.addColorStop(1, '#4682b4');
        }
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = isRage ? '#00ffff' : '#87ceeb';
        ctx.shadowBlur = isRage ? 40 : 20;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // 龙鳞纹理
        ctx.strokeStyle = isRage ? 'rgba(255, 255, 255, 0.5)' : 'rgba(70, 130, 180, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const sa = (Math.PI * 2 / 8) * i;
            ctx.beginPath();
            ctx.arc(this.x + Math.cos(sa) * this.radius * 0.5, this.y + Math.sin(sa) * this.radius * 0.5, 12, 0, Math.PI);
            ctx.stroke();
        }
        
        // 龙角
        ctx.fillStyle = isRage ? '#00ffff' : '#4682b4';
        ctx.beginPath();
        ctx.moveTo(this.x - 25, this.y - 35);
        ctx.lineTo(this.x - 35, this.y - 60);
        ctx.lineTo(this.x - 15, this.y - 40);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 25, this.y - 35);
        ctx.lineTo(this.x + 35, this.y - 60);
        ctx.lineTo(this.x + 15, this.y - 40);
        ctx.closePath();
        ctx.fill();
        
        // 眼睛
        ctx.fillStyle = isRage ? '#ff00ff' : '#00ffff';
        ctx.shadowColor = isRage ? '#ff00ff' : '#ffffff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.ellipse(this.x - 15, this.y - 10, 10, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 15, this.y - 10, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // 瞳孔
        ctx.fillStyle = '#000';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(this.x - 15, this.y - 10, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 15, this.y - 10, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 龙嘴 (呼吸冰雾效果)
        if (this.state === 'TELEGRAPH' && this.currentSkill === 'ICE_BREATH') {
            ctx.fillStyle = 'rgba(200, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + 25, 15, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Phase 2 冰霜王冠
        if (isRage) {
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.7 + Math.sin(time * 5) * 0.3})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 25, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // 冰冠尖刺
            for (let i = 0; i < 6; i++) {
                const ca = (Math.PI * 2 / 6) * i - Math.PI / 2;
                ctx.fillStyle = '#00ffff';
                ctx.beginPath();
                ctx.moveTo(this.x + Math.cos(ca) * (this.radius + 25), this.y + Math.sin(ca) * (this.radius + 25));
                ctx.lineTo(this.x + Math.cos(ca) * (this.radius + 40), this.y + Math.sin(ca) * (this.radius + 40));
                ctx.lineTo(this.x + Math.cos(ca + 0.15) * (this.radius + 25), this.y + Math.sin(ca + 0.15) * (this.radius + 25));
                ctx.closePath();
                ctx.fill();
            }
        }
        
        if (this.state === 'TELEGRAPH') {
            this.drawSkillIndicator(ctx);
        }
    }

    drawSkillIndicator(ctx) {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        
        switch (this.currentSkill) {
            case 'ICE_BREATH':
                ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.arc(this.x, this.y, 300, angle - 0.5, angle + 0.5);
                ctx.closePath();
                ctx.fill();
                break;
            case 'FROST_DIVE':
                this.drawDashIndicator(ctx, this.dashTarget.x, this.dashTarget.y, '0, 255, 255');
                this.drawAOEIndicator(ctx, this.dashTarget.x, this.dashTarget.y, 120, '135, 206, 235');
                break;
            case 'BLIZZARD':
                this.drawAOEIndicator(ctx, this.player.x, this.player.y, 150, '176, 224, 230');
                break;
            case 'ICE_SPIKES':
                for (let i = 0; i < 8; i++) {
                    const a = (Math.PI * 2 / 8) * i;
                    ctx.strokeStyle = 'rgba(176, 224, 230, 0.5)';
                    ctx.lineWidth = 8;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x + Math.cos(a) * 180, this.y + Math.sin(a) * 180);
                    ctx.stroke();
                }
                break;
            case 'FROZEN_WINGS':
            case 'ABSOLUTE_ZERO':
                this.drawAOEIndicator(ctx, this.x, this.y, 250, '0, 255, 255');
                break;
            case 'FROST_NOVA':
                this.drawAOEIndicator(ctx, this.x, this.y, 180, '200, 240, 255');
                break;
            case 'GLACIAL_STORM':
                this.drawAOEIndicator(ctx, this.player.x, this.player.y, 120, '135, 206, 235');
                ctx.fillStyle = 'rgba(200, 255, 255, 0.4)';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('❄❄❄', this.player.x, this.player.y - 60);
                break;
        }
    }
}

// ============================================
// Level 3: 地狱三头犬 (Cerberus Boss)
// 风格：地狱火焰，7个技能
// ============================================
class CerberusBoss extends BaseBoss {
    constructor(x, y, player, combatSystem) {
        super(x, y, player, combatSystem);
        this.level = 3;
        this.name = '地狱三头魔犬·刻耳柏洛斯';
        this.maxHp = 750;  // 削弱血量
        this.hp = this.maxHp;
        this.radius = 68;
        this.color = '#8b0000';
        this.damage = 24;
        this.telegraphDuration = 0.85; // 施法加速
        this.attackCooldown = 1.2; // 攻击间隔缩短
        this.skills = ['TRIPLE_FIRE', 'INFERNO_CHARGE', 'HELLFIRE', 'LAVA_POOL', 'BITE_RUSH', 'METEOR', 'SOUL_HOWL', 'HELLGATE', 'FLAME_VORTEX'];
        this.phase2Skills = [...this.skills, 'APOCALYPSE', 'CERBERUS_RAGE', 'DEMON_SUMMON', 'INFERNO_BREATH'];
        this.headAngles = [0, 0, 0]; // 三头动画
    }

    update(deltaTime) {
        if (this.state === 'IDLE') {
            const dx = this.player.x - this.x;
            const dy = this.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 150) {
                const speed = this.phase === 2 ? 80 : 55;
                this.x += (dx / dist) * speed * deltaTime;
                this.y += (dy / dist) * speed * deltaTime;
            }
        }

        switch (this.state) {
            case 'IDLE':
                this.timer += deltaTime;
                if (this.timer >= (this.attackCooldown || 1.8)) {
                    this.state = 'TELEGRAPH';
                    const pool = this.phase === 2 ? this.phase2Skills : this.skills;
                    this.currentSkill = pool[Math.floor(Math.random() * pool.length)];
                    this.dashTarget = { x: this.player.x, y: this.player.y };
                    this.timer = 0;
                }
                break;
            case 'TELEGRAPH':
                this.timer += deltaTime;
                if (this.timer >= this.telegraphDuration) {
                    this.executeAttack();
                    this.state = 'IDLE';
                    this.timer = 0;
                }
                break;
        }

        if (this.hp < this.maxHp * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.telegraphDuration = 1.0;
            this.attackCooldown = 1.5;
        }
    }

    executeAttack() {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        
        switch (this.currentSkill) {
            case 'TRIPLE_FIRE':
                [-0.4, 0, 0.4].forEach((off, i) => {
                    setTimeout(() => {
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y,
                            vx: Math.cos(angle + off) * 400, vy: Math.sin(angle + off) * 400,
                            radius: 15, damage: 18, owner: 'enemy', trail: [],
                            update(dt) {
                                this.trail.push({ x: this.x, y: this.y, life: 0.3 });
                                this.x += this.vx * dt; this.y += this.vy * dt;
                                this.trail = this.trail.filter(t => (t.life -= dt) > 0);
                            },
                            draw(ctx) {
                                this.trail.forEach(t => {
                                    ctx.fillStyle = `rgba(255,69,0,${t.life})`;
                                    ctx.beginPath(); ctx.arc(t.x, t.y, 8, 0, Math.PI*2); ctx.fill();
                                });
                                ctx.fillStyle = '#ff4500'; ctx.shadowColor = '#ff4500'; ctx.shadowBlur = 20;
                                ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
                                ctx.shadowBlur = 0;
                            }
                        });
                    }, i * 150);
                });
                break;

            case 'INFERNO_CHARGE':
                const target = { ...this.dashTarget };
                for (let i = 0; i < 6; i++) {
                    setTimeout(() => {
                        this.x += (target.x - this.x) / (6 - i);
                        this.y += (target.y - this.y) / (6 - i);
                        const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                        if (dist < 70) this.player.takeDamage(22);
                    }, i * 60);
                }
                break;

            case 'HELLFIRE':
                for (let w = 0; w < 5; w++) {
                    setTimeout(() => {
                        for (let i = -3; i <= 3; i++) {
                            this.combatSystem.spawnProjectile({
                                x: this.x, y: this.y,
                                vx: Math.cos(angle + i * 0.12) * 300, vy: Math.sin(angle + i * 0.12) * 300,
                                radius: 10, damage: 10, owner: 'enemy', life: 1.2,
                                update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                                draw(ctx) { ctx.fillStyle = `rgba(255,100,0,${this.life})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); }
                            });
                        }
                    }, w * 120);
                }
                break;

            case 'LAVA_POOL':
                for (let i = 0; i < 5; i++) {
                    const px = this.player.x + (Math.random() - 0.5) * 200;
                    const py = this.player.y + (Math.random() - 0.5) * 200;
                    setTimeout(() => {
                        this.combatSystem.spawnProjectile({
                            x: px, y: py, radius: 50, damage: 8, owner: 'enemy', life: 3, maxLife: 3,
                            update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) { ctx.fillStyle = `rgba(255,69,0,${this.life/this.maxLife*0.6})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); }
                        });
                    }, i * 200);
                }
                break;

            case 'BITE_RUSH':
                for (let b = 0; b < 3; b++) {
                    setTimeout(() => {
                        const a = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                        this.x += Math.cos(a) * 120; this.y += Math.sin(a) * 120;
                        const d = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                        if (d < 80) this.player.takeDamage(20);
                    }, b * 300);
                }
                break;

            case 'METEOR':
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        this.combatSystem.spawnProjectile({
                            x: this.player.x + (Math.random() - 0.5) * 300, y: this.player.y - 300,
                            vy: 500, radius: 20, damage: 18, owner: 'enemy', targetY: this.player.y,
                            update(dt) { this.y += this.vy * dt; if (this.y >= this.targetY) this.markedForDeletion = true; },
                            draw(ctx) { ctx.fillStyle = '#ff4500'; ctx.shadowColor = '#ff4500'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; }
                        });
                    }, i * 150);
                }
                break;

            case 'APOCALYPSE':
                for (let r = 0; r < 4; r++) {
                    setTimeout(() => {
                        for (let i = 0; i < 16; i++) {
                            const a = (Math.PI * 2 / 16) * i;
                            this.combatSystem.spawnProjectile({
                                x: this.x, y: this.y, vx: Math.cos(a) * (200 + r * 50), vy: Math.sin(a) * (200 + r * 50),
                                radius: 12, damage: 15, owner: 'enemy',
                                update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                                draw(ctx) { ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); }
                            });
                        }
                    }, r * 300);
                }
                break;

            case 'SOUL_HOWL':
                // 灵魂嚎叫 - 三头同时发射追踪火球
                const heads = [[-25, -20], [0, -30], [25, -20]];
                heads.forEach(([ox, oy], idx) => {
                    setTimeout(() => {
                        this.combatSystem.spawnProjectile({
                            x: this.x + ox, y: this.y + oy,
                            targetPlayer: this.player, speed: 200,
                            radius: 15, damage: 16, owner: 'enemy', life: 3,
                            update(dt) {
                                const dx = this.targetPlayer.x - this.x;
                                const dy = this.targetPlayer.y - this.y;
                                const dist = Math.sqrt(dx * dx + dy * dy);
                                this.x += (dx / dist) * this.speed * dt;
                                this.y += (dy / dist) * this.speed * dt;
                                this.life -= dt;
                                if (this.life <= 0) this.markedForDeletion = true;
                            },
                            draw(ctx) {
                                ctx.fillStyle = '#00ff00'; ctx.shadowColor = '#00ff00'; ctx.shadowBlur = 20;
                                ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
                                ctx.shadowBlur = 0;
                            }
                        });
                    }, idx * 200);
                });
                break;

            case 'CERBERUS_RAGE':
                // 地狱犬狂怒 - 快速三方向冲刺
                const rageAngles = [-Math.PI/4, 0, Math.PI/4];
                for (let r = 0; r < 3; r++) {
                    setTimeout(() => {
                        const baseAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                        const chargeAngle = baseAngle + rageAngles[r];
                        for (let step = 0; step < 4; step++) {
                            setTimeout(() => {
                                this.x += Math.cos(chargeAngle) * 50;
                                this.y += Math.sin(chargeAngle) * 50;
                                // 火焰轨迹
                                this.combatSystem.spawnProjectile({
                                    x: this.x, y: this.y, radius: 35, damage: 12, owner: 'enemy', life: 0.5, maxLife: 0.5,
                                    update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                                    draw(ctx) { ctx.fillStyle = `rgba(255, 69, 0, ${this.life / this.maxLife * 0.6})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
                                });
                            }, step * 50);
                        }
                    }, r * 500);
                }
                break;

            case 'HELLGATE':
                // 地狱之门 - 在玩家周围打开地狱传送门
                for (let i = 0; i < 5; i++) {
                    const gateAngle = (Math.PI * 2 / 5) * i;
                    const gateX = this.player.x + Math.cos(gateAngle) * 120;
                    const gateY = this.player.y + Math.sin(gateAngle) * 120;
                    setTimeout(() => {
                        // 地狱门特效
                        this.combatSystem.spawnProjectile({
                            x: gateX, y: gateY, radius: 0, maxRadius: 60, damage: 0, owner: 'enemy', life: 1.5, maxLife: 1.5, spawnTimer: 0,
                            update(dt) {
                                this.life -= dt;
                                this.radius = this.maxRadius * (1 - Math.abs(this.life - 0.75) / 0.75);
                                this.spawnTimer += dt;
                                if (this.spawnTimer > 0.3) {
                                    this.spawnTimer = 0;
                                    // 从门中射出火球
                                    const fireAngle = Math.random() * Math.PI * 2;
                                    this.combatSystem && this.combatSystem.spawnProjectile({
                                        x: this.x, y: this.y, vx: Math.cos(fireAngle) * 200, vy: Math.sin(fireAngle) * 200,
                                        radius: 10, damage: 14, owner: 'enemy', life: 1.5,
                                        update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                                        draw(ctx) { ctx.fillStyle = '#ff4500'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
                                    });
                                }
                                if (this.life <= 0) this.markedForDeletion = true;
                            },
                            draw(ctx) {
                                const alpha = Math.min(1, this.life / 0.5);
                                ctx.strokeStyle = `rgba(139, 0, 0, ${alpha})`;
                                ctx.lineWidth = 4;
                                ctx.shadowColor = '#ff0000';
                                ctx.shadowBlur = 20;
                                ctx.beginPath();
                                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                                ctx.stroke();
                                ctx.fillStyle = `rgba(50, 0, 0, ${alpha * 0.5})`;
                                ctx.fill();
                                ctx.shadowBlur = 0;
                            },
                            combatSystem: this.combatSystem
                        });
                    }, i * 200);
                }
                break;

            case 'DEMON_SUMMON':
                // 恶魔召唤 - 屏幕抖动 + 从三个方向召唤追踪火球
                // 屏幕抖动提示
                if (this.player.screenShake) {
                    this.player.screenShake.intensity = 15;
                    this.player.screenShake.duration = 1.5;
                }
                for (let wave = 0; wave < 3; wave++) {
                    setTimeout(() => {
                        for (let i = 0; i < 6; i++) {
                            const spawnAngle = (Math.PI * 2 / 6) * i + wave * 0.3;
                            const spawnDist = 350;
                            this.combatSystem.spawnProjectile({
                                x: this.x + Math.cos(spawnAngle) * spawnDist,
                                y: this.y + Math.sin(spawnAngle) * spawnDist,
                                targetPlayer: this.player, speed: 180, radius: 18, damage: 20, owner: 'enemy', life: 4,
                                update(dt) {
                                    const dx = this.targetPlayer.x - this.x, dy = this.targetPlayer.y - this.y;
                                    const dist = Math.sqrt(dx * dx + dy * dy);
                                    this.x += (dx / dist) * this.speed * dt;
                                    this.y += (dy / dist) * this.speed * dt;
                                    this.life -= dt;
                                    if (this.life <= 0) this.markedForDeletion = true;
                                },
                                draw(ctx) {
                                    ctx.fillStyle = '#8b0000';
                                    ctx.shadowColor = '#ff4500';
                                    ctx.shadowBlur = 25;
                                    ctx.beginPath();
                                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                                    ctx.fill();
                                    // 恶魔眼睛
                                    ctx.fillStyle = '#ffff00';
                                    ctx.beginPath();
                                    ctx.arc(this.x - 4, this.y - 2, 3, 0, Math.PI * 2);
                                    ctx.arc(this.x + 4, this.y - 2, 3, 0, Math.PI * 2);
                                    ctx.fill();
                                    ctx.shadowBlur = 0;
                                }
                            });
                        }
                    }, wave * 600);
                }
                break;
                
            case 'FLAME_VORTEX':
                // 火焰漩涡 - 旋转火圈向外扩散
                if (this.player.screenShake) { this.player.screenShake.intensity = 8; this.player.screenShake.duration = 1; }
                for (let ring = 0; ring < 3; ring++) {
                    setTimeout(() => {
                        for (let i = 0; i < 12; i++) {
                            const vortexAngle = (Math.PI * 2 / 12) * i + ring * 0.2;
                            this.combatSystem.spawnProjectile({
                                x: this.x, y: this.y, angle: vortexAngle, dist: 30, speed: 120 + ring * 40,
                                radius: 12, damage: 12, owner: 'enemy', life: 2.5,
                                update(dt) {
                                    this.angle += dt * 3;
                                    this.dist += this.speed * dt;
                                    this.x = this.startX + Math.cos(this.angle) * this.dist;
                                    this.y = this.startY + Math.sin(this.angle) * this.dist;
                                    this.life -= dt; if (this.life <= 0) this.markedForDeletion = true;
                                },
                                startX: this.x, startY: this.y,
                                draw(ctx) {
                                    ctx.fillStyle = `rgba(255, 100, 0, ${this.life / 2.5})`;
                                    ctx.shadowColor = '#ff4500'; ctx.shadowBlur = 15;
                                    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
                                    ctx.shadowBlur = 0;
                                }
                            });
                        }
                    }, ring * 300);
                }
                break;
                
            case 'INFERNO_BREATH':
                // 地狱吐息 - 三头同时喷射火焰
                const breathAngles = [-0.5, 0, 0.5];
                breathAngles.forEach((off, headIdx) => {
                    for (let w = 0; w < 8; w++) {
                        setTimeout(() => {
                            for (let i = -2; i <= 2; i++) {
                                const ba = angle + off + i * 0.08;
                                this.combatSystem.spawnProjectile({
                                    x: this.x + Math.cos(angle + off) * 40, y: this.y + Math.sin(angle + off) * 40,
                                    vx: Math.cos(ba) * (350 + w * 20), vy: Math.sin(ba) * (350 + w * 20),
                                    radius: 8, damage: 8, owner: 'enemy', life: 1.2,
                                    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                                    draw(ctx) { ctx.fillStyle = `rgba(255, ${150 - w * 15}, 0, ${this.life})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
                                });
                            }
                        }, w * 60 + headIdx * 100);
                    }
                });
                break;
        }
    }

    takeDamage(amount) { this.hp -= amount; if (this.hp <= 0) this.hp = 0; }

    draw(ctx) {
        const time = Date.now() / 1000;
        const isRage = this.phase === 2;
        
        // ===== 地狱火焰背景光环 =====
        const glowSize = isRage ? 2.5 : 1.8;
        const rageGlow = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * glowSize);
        rageGlow.addColorStop(0, isRage ? 'rgba(255, 100, 0, 0.6)' : 'rgba(139, 0, 0, 0.3)');
        rageGlow.addColorStop(0.5, isRage ? 'rgba(255, 50, 0, 0.3)' : 'rgba(100, 0, 0, 0.15)');
        rageGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = rageGlow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // ===== 地狱锁链（绕身体旋转）=====
        ctx.strokeStyle = isRage ? '#ff6600' : '#555';
        ctx.lineWidth = 4;
        for (let c = 0; c < 3; c++) {
            const chainAngle = time * 1.5 + c * (Math.PI * 2 / 3);
            const chainDist = this.radius + 10;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const ca = chainAngle + i * 0.25;
                const cx = this.x + Math.cos(ca) * (chainDist + Math.sin(time * 3 + i) * 5);
                const cy = this.y + Math.sin(ca) * (chainDist + Math.sin(time * 3 + i) * 5);
                if (i === 0) ctx.moveTo(cx, cy);
                else ctx.lineTo(cx, cy);
            }
            ctx.stroke();
        }
        
        // ===== 熔岩地面效果 =====
        if (isRage) {
            for (let i = 0; i < 8; i++) {
                const lavaAngle = time * 0.5 + i * 0.8;
                const lavaDist = this.radius * 1.3 + Math.sin(time * 2 + i) * 10;
                const lx = this.x + Math.cos(lavaAngle) * lavaDist;
                const ly = this.y + Math.sin(lavaAngle) * lavaDist;
                ctx.fillStyle = `rgba(255, ${80 + Math.sin(time * 4 + i) * 40}, 0, ${0.6 + Math.sin(time * 6 + i) * 0.3})`;
                ctx.beginPath();
                ctx.arc(lx, ly, 8 + Math.sin(time * 5 + i) * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // ===== 主体身躯（带熔岩裂纹）=====
        const bodyGrad = ctx.createRadialGradient(this.x - 15, this.y - 15, 0, this.x, this.y, this.radius);
        bodyGrad.addColorStop(0, isRage ? '#ff6347' : '#a52a2a');
        bodyGrad.addColorStop(0.4, isRage ? '#dc143c' : '#8b0000');
        bodyGrad.addColorStop(1, isRage ? '#8b0000' : '#400000');
        ctx.fillStyle = bodyGrad;
        ctx.shadowColor = isRage ? '#ff4500' : '#8b0000';
        ctx.shadowBlur = isRage ? 35 : 15;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 熔岩裂纹
        ctx.strokeStyle = isRage ? '#ffaa00' : '#ff6600';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        for (let i = 0; i < 5; i++) {
            const crackAngle = i * 1.2 + 0.3;
            ctx.beginPath();
            ctx.moveTo(this.x + Math.cos(crackAngle) * 15, this.y + Math.sin(crackAngle) * 15);
            ctx.lineTo(this.x + Math.cos(crackAngle) * (this.radius - 5), this.y + Math.sin(crackAngle) * (this.radius - 5));
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        
        // ===== 四条腿 =====
        const legPositions = [
            { x: -35, y: 25, angle: -0.4 },
            { x: 35, y: 25, angle: 0.4 },
            { x: -25, y: 40, angle: -0.2 },
            { x: 25, y: 40, angle: 0.2 }
        ];
        ctx.fillStyle = isRage ? '#8b0000' : '#600000';
        legPositions.forEach((leg, i) => {
            const legWave = Math.sin(time * 4 + i) * 3;
            ctx.beginPath();
            ctx.ellipse(this.x + leg.x, this.y + leg.y + legWave, 12, 20, leg.angle, 0, Math.PI * 2);
            ctx.fill();
            // 爪子
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(this.x + leg.x, this.y + leg.y + 18 + legWave, 8, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // ===== 蛇尾（火焰尾巴）=====
        ctx.strokeStyle = isRage ? '#dc143c' : '#8b0000';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.radius * 0.5);
        const tailWave = Math.sin(time * 4) * 15;
        ctx.bezierCurveTo(
            this.x + 30 + tailWave, this.y + this.radius + 10,
            this.x + 50 - tailWave, this.y + this.radius + 30,
            this.x + 70, this.y + this.radius + 5
        );
        ctx.stroke();
        // 蛇头火焰
        ctx.fillStyle = '#00aa00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.x + 70, this.y + this.radius + 5, 10, 0, Math.PI * 2);
        ctx.fill();
        // 蛇眼
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x + 68, this.y + this.radius + 3, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 72, this.y + this.radius + 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // ===== 三个狼头 =====
        const headData = [
            { ox: -32, oy: -30, angle: -0.35, breathOffset: 0 },
            { ox: 0, oy: -45, angle: 0, breathOffset: 0.5 },
            { ox: 32, oy: -30, angle: 0.35, breathOffset: 1 }
        ];
        
        headData.forEach((head, idx) => {
            const hx = this.x + head.ox;
            const hy = this.y + head.oy + Math.sin(time * 3 + idx) * 2;
            const breathPhase = Math.sin(time * 4 + head.breathOffset * Math.PI);
            
            // 火焰呼吸效果
            if (isRage && breathPhase > 0.7) {
                ctx.fillStyle = `rgba(255, 100, 0, ${(breathPhase - 0.7) * 2})`;
                const breathAngle = Math.atan2(this.player.y - hy, this.player.x - hx);
                for (let b = 0; b < 5; b++) {
                    const bx = hx + Math.cos(breathAngle) * (25 + b * 8);
                    const by = hy + Math.sin(breathAngle) * (25 + b * 8);
                    ctx.beginPath();
                    ctx.arc(bx, by, 6 - b, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // 脖子（带鬃毛）
            ctx.fillStyle = isRage ? '#a52a2a' : '#600000';
            ctx.beginPath();
            ctx.ellipse(hx, hy + 18, 14, 22, head.angle, 0, Math.PI * 2);
            ctx.fill();
            // 鬃毛
            ctx.fillStyle = isRage ? '#ff4500' : '#8b0000';
            for (let m = 0; m < 5; m++) {
                const mAngle = head.angle - 0.5 + m * 0.25;
                ctx.beginPath();
                ctx.ellipse(hx + Math.cos(mAngle) * 12, hy + 5 + Math.sin(mAngle) * 8, 4, 10 + Math.sin(time * 5 + m) * 2, mAngle, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 头部
            const headGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 24);
            headGrad.addColorStop(0, isRage ? '#ff6347' : '#a52a2a');
            headGrad.addColorStop(1, isRage ? '#8b0000' : '#500000');
            ctx.fillStyle = headGrad;
            ctx.beginPath();
            ctx.ellipse(hx, hy, 24, 18, head.angle, 0, Math.PI * 2);
            ctx.fill();
            
            // 尖耳朵
            ctx.fillStyle = isRage ? '#dc143c' : '#600000';
            [-1, 1].forEach(dir => {
                ctx.beginPath();
                ctx.moveTo(hx + dir * 15, hy - 5);
                ctx.lineTo(hx + dir * 20, hy - 22);
                ctx.lineTo(hx + dir * 8, hy - 12);
                ctx.closePath();
                ctx.fill();
            });
            
            // 眼睛（邪恶发光）
            const eyeGlow = isRage ? '#00ff00' : '#ffcc00';
            ctx.fillStyle = eyeGlow;
            ctx.shadowColor = eyeGlow;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.ellipse(hx - 8, hy - 2, 6, 4, head.angle, 0, Math.PI * 2);
            ctx.ellipse(hx + 8, hy - 2, 6, 4, head.angle, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            // 竖瞳
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(hx - 8, hy - 2, 2, 4, 0, 0, Math.PI * 2);
            ctx.ellipse(hx + 8, hy - 2, 2, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // 鼻子和嘴
            ctx.fillStyle = '#300000';
            ctx.beginPath();
            ctx.ellipse(hx, hy + 10, 10, 6, 0, 0, Math.PI);
            ctx.fill();
            // 獠牙
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 1;
            [-6, 6].forEach(fx => {
                ctx.beginPath();
                ctx.moveTo(hx + fx - 2, hy + 14);
                ctx.lineTo(hx + fx, hy + 24 + Math.sin(time * 8 + idx) * 2);
                ctx.lineTo(hx + fx + 2, hy + 14);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            });
        });
        
        // ===== 地狱火焰光环 =====
        if (isRage) {
            ctx.strokeStyle = `rgba(255, 50, 0, ${0.7 + Math.sin(time * 6) * 0.3})`;
            ctx.lineWidth = 5;
            ctx.shadowColor = '#ff4500';
            ctx.shadowBlur = 20;
            ctx.setLineDash([15, 8]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 30, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;
        }

        if (this.state === 'TELEGRAPH') this.drawSkillIndicator(ctx);
    }

    drawSkillIndicator(ctx) {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        switch (this.currentSkill) {
            case 'INFERNO_CHARGE': case 'BITE_RUSH': case 'CERBERUS_RAGE':
                this.drawDashIndicator(ctx, this.dashTarget.x, this.dashTarget.y, '255, 69, 0'); break;
            case 'HELLFIRE': case 'TRIPLE_FIRE': case 'INFERNO_BREATH':
                this.drawConeIndicator(ctx, angle, 0.6, 280, '255, 100, 0'); break;
            case 'LAVA_POOL': case 'METEOR': case 'APOCALYPSE':
                this.drawAOEIndicator(ctx, this.player.x, this.player.y, 175, '255, 69, 0'); break;
            case 'FLAME_VORTEX':
                this.drawAOEIndicator(ctx, this.x, this.y, 200, '255, 150, 0');
                ctx.fillStyle = 'rgba(255, 100, 0, 0.5)'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
                ctx.fillText('🔥 火焰漩涡 🔥', this.x, this.y - this.radius - 25); break;
            case 'HELLGATE': case 'DEMON_SUMMON':
                this.drawAOEIndicator(ctx, this.player.x, this.player.y, 150, '139, 0, 0'); break;
            default:
                this.drawAOEIndicator(ctx, this.x, this.y, 120, '255, 69, 0'); break;
        }
    }
}

// ============================================
// Level 4: 雷神宙斯 (Zeus Boss)
// 风格：雷电爆发，7个技能
// ============================================
class ZeusBoss extends BaseBoss {
    constructor(x, y, player, combatSystem) {
        super(x, y, player, combatSystem);
        this.level = 4;
        this.name = '天穹之王·宙斯';
        this.maxHp = 1250;  // 微调血量
        this.hp = this.maxHp;
        this.radius = 62;
        this.color = '#ffd700';
        this.damage = 30;
        this.telegraphDuration = 0.75; // 施法加速
        this.attackCooldown = 1.3;
        this.skills = ['LIGHTNING_BOLT', 'THUNDER_DASH', 'CHAIN_LIGHTNING', 'STORM_CLOUD', 'THUNDER_CLAP', 'LIGHTNING_FIELD', 'DIVINE_STRIKE', 'SKY_FURY', 'THUNDER_PRISON', 'ZEUS_BARRIER'];
        this.phase2Skills = [...this.skills, 'OLYMPUS_WRATH', 'THUNDERGOD_AVATAR', 'DIVINE_JUDGEMENT', 'STORM_CALLER'];
        this.lightningAura = 0; // 闪电光环动画
    }

    update(deltaTime) {
        if (this.state === 'IDLE') {
            const dx = this.player.x - this.x;
            const dy = this.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = this.phase === 2 ? 90 : 65;
            if (dist > 200) { this.x += (dx / dist) * speed * deltaTime; this.y += (dy / dist) * speed * deltaTime; }
        }

        switch (this.state) {
            case 'IDLE':
                this.timer += deltaTime;
                this.lightningAura += deltaTime;
                if (this.timer >= (this.attackCooldown || 1.3)) {
                    this.state = 'TELEGRAPH';
                    const pool = this.phase === 2 ? this.phase2Skills : this.skills;
                    this.currentSkill = pool[Math.floor(Math.random() * pool.length)];
                    this.dashTarget = { x: this.player.x, y: this.player.y };
                    this.timer = 0;
                }
                break;
            case 'TELEGRAPH':
                this.timer += deltaTime;
                if (this.timer >= this.telegraphDuration) {
                    this.executeAttack();
                    this.state = 'IDLE';
                    this.timer = 0;
                }
                break;
        }

        if (this.hp < this.maxHp * 0.5 && this.phase === 1) { this.phase = 2; this.telegraphDuration = 0.65; this.attackCooldown = 1.1; }
    }

    executeAttack() {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        
        switch (this.currentSkill) {
            case 'LIGHTNING_BOLT':
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y, vx: Math.cos(angle + (i - 2) * 0.15) * 600, vy: Math.sin(angle + (i - 2) * 0.15) * 600,
                            radius: 8, damage: 20, owner: 'enemy',
                            update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                            draw(ctx) { ctx.fillStyle = '#ffff00'; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; }
                        });
                    }, i * 80);
                }
                break;

            case 'THUNDER_DASH':
                const target = { ...this.dashTarget };
                setTimeout(() => {
                    this.x = target.x; this.y = target.y;
                    const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                    if (dist < 80) this.player.takeDamage(25);
                }, 100);
                break;

            case 'CHAIN_LIGHTNING':
                for (let i = 0; i < 8; i++) {
                    const a = (Math.PI * 2 / 8) * i;
                    this.combatSystem.spawnProjectile({
                        x: this.x, y: this.y, vx: Math.cos(a) * 350, vy: Math.sin(a) * 350,
                        radius: 10, damage: 15, owner: 'enemy',
                        update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                        draw(ctx) { ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; }
                    });
                }
                break;

            case 'STORM_CLOUD':
                for (let i = 0; i < 12; i++) {
                    setTimeout(() => {
                        const sx = this.player.x + (Math.random() - 0.5) * 200;
                        const sy = this.player.y + (Math.random() - 0.5) * 200;
                        this.combatSystem.spawnProjectile({
                            x: sx, y: sy - 300, targetY: sy, radius: 25, damage: 15, owner: 'enemy', life: 0.3, maxLife: 0.3,
                            update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) { ctx.strokeStyle = `rgba(255,255,0,${this.life/this.maxLife})`; ctx.lineWidth = 5; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x, this.targetY); ctx.stroke(); ctx.shadowBlur = 0; }
                        });
                    }, i * 120);
                }
                break;

            case 'THUNDER_CLAP':
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y, radius: 0, maxRadius: 200, damage: 22, owner: 'enemy', life: 0.5, maxLife: 0.5,
                    update(dt) { this.radius = this.maxRadius * (1 - this.life / this.maxLife); this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) { ctx.strokeStyle = `rgba(255,255,0,${this.life/this.maxLife})`; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.stroke(); }
                });
                break;

            case 'LIGHTNING_FIELD':
                for (let i = 0; i < 20; i++) {
                    setTimeout(() => {
                        const fx = this.x + (Math.random() - 0.5) * 400;
                        const fy = this.y + (Math.random() - 0.5) * 400;
                        this.combatSystem.spawnProjectile({
                            x: fx, y: fy, radius: 30, damage: 12, owner: 'enemy', life: 0.4, maxLife: 0.4,
                            update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) { ctx.fillStyle = `rgba(0,255,255,${this.life/this.maxLife*0.5})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); }
                        });
                    }, i * 50);
                }
                break;

            case 'DIVINE_STRIKE':
                this.combatSystem.spawnProjectile({
                    x: this.player.x, y: this.player.y, radius: 120, damage: 30, owner: 'enemy', life: 0.8, maxLife: 0.8,
                    update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) { const a = this.life / this.maxLife; ctx.fillStyle = `rgba(255,215,0,${a*0.5})`; ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); ctx.stroke(); }
                });
                break;

            case 'OLYMPUS_WRATH':
                for (let w = 0; w < 5; w++) {
                    setTimeout(() => {
                        for (let i = 0; i < 12; i++) {
                            const a = (Math.PI * 2 / 12) * i + w * 0.15;
                            this.combatSystem.spawnProjectile({
                                x: this.x, y: this.y, vx: Math.cos(a) * (250 + w * 40), vy: Math.sin(a) * (250 + w * 40),
                                radius: 10, damage: 18, owner: 'enemy',
                                update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                                draw(ctx) { ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; }
                            });
                        }
                    }, w * 200);
                }
                break;

            case 'SKY_FURY':
                // 天空之怒 - 追踪雷电链
                for (let i = 0; i < 6; i++) {
                    setTimeout(() => {
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y, targetPlayer: this.player, speed: 280,
                            radius: 12, damage: 18, owner: 'enemy', life: 2.5,
                            update(dt) {
                                const dx = this.targetPlayer.x - this.x, dy = this.targetPlayer.y - this.y;
                                const dist = Math.sqrt(dx * dx + dy * dy);
                                this.x += (dx / dist) * this.speed * dt;
                                this.y += (dy / dist) * this.speed * dt;
                                this.life -= dt;
                                if (this.life <= 0) this.markedForDeletion = true;
                            },
                            draw(ctx) {
                                ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 20;
                                ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
                                ctx.shadowBlur = 0;
                            }
                        });
                    }, i * 150);
                }
                break;

            case 'THUNDERGOD_AVATAR':
                // 雷神化身 - 全屏雷暴
                for (let wave = 0; wave < 4; wave++) {
                    setTimeout(() => {
                        for (let i = 0; i < 20; i++) {
                            const lx = Math.random() * 800 + 100;
                            const ly = Math.random() * 600 + 100;
                            this.combatSystem.spawnProjectile({
                                x: lx, y: ly - 400, targetY: ly, radius: 35, damage: 22, owner: 'enemy', life: 0.3, maxLife: 0.3,
                                update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                                draw(ctx) {
                                    const alpha = this.life / this.maxLife;
                                    ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`; ctx.lineWidth = 6;
                                    ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 30;
                                    ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + (Math.random() - 0.5) * 20, this.targetY); ctx.stroke();
                                    ctx.shadowBlur = 0;
                                }
                            });
                        }
                    }, wave * 400);
                }
                break;

            case 'THUNDER_PRISON':
                // 雷电牢笼 - 在玩家周围形成收缩的雷电圈
                // 屏幕抖动警告
                if (this.player.screenShake) {
                    this.player.screenShake.intensity = 10;
                    this.player.screenShake.duration = 2;
                }
                this.combatSystem.spawnProjectile({
                    x: this.player.x, y: this.player.y, radius: 200, minRadius: 40, damage: 0, owner: 'enemy', life: 3, maxLife: 3,
                    update(dt) {
                        this.life -= dt;
                        // 收缩圆环
                        this.radius = this.minRadius + (200 - this.minRadius) * (this.life / this.maxLife);
                        if (this.life <= 0) this.markedForDeletion = true;
                    },
                    draw(ctx) {
                        const alpha = 0.8;
                        const time = Date.now() / 1000;
                        // 电弧圆环
                        ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
                        ctx.lineWidth = 5;
                        ctx.shadowColor = '#00ffff';
                        ctx.shadowBlur = 25;
                        ctx.setLineDash([15, 8]);
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        // 电弧
                        for (let i = 0; i < 8; i++) {
                            const a = (Math.PI * 2 / 8) * i + time * 3;
                            ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + Math.sin(time * 10 + i) * 0.3})`;
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.moveTo(this.x + Math.cos(a) * this.radius, this.y + Math.sin(a) * this.radius);
                            ctx.lineTo(this.x + Math.cos(a) * (this.radius - 20), this.y + Math.sin(a) * (this.radius - 20));
                            ctx.stroke();
                        }
                        ctx.shadowBlur = 0;
                    }
                });
                // 牢笼内持续释放雷电
                for (let i = 0; i < 15; i++) {
                    setTimeout(() => {
                        const boltX = this.player.x + (Math.random() - 0.5) * 150;
                        const boltY = this.player.y + (Math.random() - 0.5) * 150;
                        this.combatSystem.spawnProjectile({
                            x: boltX, y: boltY - 200, targetY: boltY, radius: 20, damage: 18, owner: 'enemy', life: 0.2, maxLife: 0.2,
                            update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) {
                                const alpha = this.life / this.maxLife;
                                ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
                                ctx.lineWidth = 4;
                                ctx.beginPath();
                                ctx.moveTo(this.x, this.y);
                                ctx.lineTo(this.x, this.targetY);
                                ctx.stroke();
                            }
                        });
                    }, i * 180);
                }
                break;

            case 'DIVINE_JUDGEMENT':
                // 神罚 - 巨型雷柱 + 冲击波
                // 强烈屏幕抖动
                if (this.player.screenShake) {
                    this.player.screenShake.intensity = 20;
                    this.player.screenShake.duration = 2;
                }
                // 预警
                setTimeout(() => {
                    // 巨型雷柱
                    this.combatSystem.spawnProjectile({
                        x: this.player.x, y: this.player.y - 500, targetY: this.player.y, radius: 80, damage: 40, owner: 'enemy', life: 0.5, maxLife: 0.5,
                        update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                        draw(ctx) {
                            const alpha = this.life / this.maxLife;
                            ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
                            ctx.shadowColor = '#ffffff';
                            ctx.shadowBlur = 50;
                            ctx.fillRect(this.x - 40, this.y, 80, this.targetY - this.y + 500);
                            // 雷柱内闪电
                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 3;
                            for (let i = 0; i < 5; i++) {
                                ctx.beginPath();
                                ctx.moveTo(this.x + (Math.random() - 0.5) * 60, this.y);
                                ctx.lineTo(this.x + (Math.random() - 0.5) * 60, this.targetY);
                                ctx.stroke();
                            }
                            ctx.shadowBlur = 0;
                        }
                    });
                    // 冲击波
                    this.combatSystem.spawnProjectile({
                        x: this.player.x, y: this.player.y, radius: 0, maxRadius: 250, damage: 25, owner: 'enemy', life: 0.6, maxLife: 0.6,
                        update(dt) {
                            this.radius = this.maxRadius * (1 - this.life / this.maxLife);
                            this.life -= dt;
                            if (this.life <= 0) this.markedForDeletion = true;
                        },
                        draw(ctx) {
                            const alpha = this.life / this.maxLife;
                            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
                            ctx.lineWidth = 8;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                            ctx.stroke();
                        }
                    });
                }, 800);
                break;
                
            case 'LIGHTNING_SPEAR':
                // 雷电之矛 - 快速直线穿刺
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        const spearAngle = angle + (i - 1) * 0.15;
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y, vx: Math.cos(spearAngle) * 500, vy: Math.sin(spearAngle) * 500,
                            radius: 8, damage: 20, owner: 'enemy', life: 1.5, rotation: spearAngle,
                            update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) {
                                ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
                                ctx.fillStyle = '#ffff00'; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15;
                                ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(-15, -6); ctx.lineTo(-15, 6); ctx.closePath(); ctx.fill();
                                ctx.shadowBlur = 0; ctx.restore();
                            }
                        });
                    }, i * 100);
                }
                break;
                
            case 'STORM_VORTEX':
                // 风暴漩涡 - 旋转吸引
                this.combatSystem.spawnProjectile({
                    x: this.player.x, y: this.player.y, radius: 150, damage: 0, owner: 'enemy', life: 2.5, maxLife: 2.5, player: this.player,
                    update(dt) {
                        this.life -= dt;
                        const dx = this.x - this.player.x, dy = this.y - this.player.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > 10) { this.player.x += (dx / dist) * 80 * dt; this.player.y += (dy / dist) * 80 * dt; }
                        if (this.life <= 0) this.markedForDeletion = true;
                    },
                    draw(ctx) {
                        const alpha = this.life / this.maxLife;
                        const time = Date.now() / 1000;
                        for (let r = 0; r < 3; r++) {
                            ctx.strokeStyle = `rgba(0, 200, 255, ${alpha * (0.6 - r * 0.15)})`;
                            ctx.lineWidth = 3 - r;
                            ctx.setLineDash([8, 4]);
                            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius - r * 30, time * 4 + r, time * 4 + r + Math.PI * 1.5); ctx.stroke();
                        }
                        ctx.setLineDash([]);
                    }
                });
                break;
                
            case 'HEAVEN_FALL':
                // 天堂陨落 - 全屏雷柱
                if (this.player.screenShake) { this.player.screenShake.intensity = 25; this.player.screenShake.duration = 3; }
                for (let wave = 0; wave < 5; wave++) {
                    setTimeout(() => {
                        for (let i = 0; i < 8; i++) {
                            const fx = 100 + Math.random() * 800;
                            const fy = 100 + Math.random() * 500;
                            this.combatSystem.spawnProjectile({
                                x: fx, y: fy - 500, targetY: fy, radius: 45, damage: 25, owner: 'enemy', life: 0.4, maxLife: 0.4,
                                update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                                draw(ctx) {
                                    const alpha = this.life / this.maxLife;
                                    ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`; ctx.lineWidth = 8;
                                    ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 30;
                                    ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + (Math.random() - 0.5) * 30, this.targetY); ctx.stroke();
                                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
                                    ctx.beginPath(); ctx.arc(this.x, this.targetY, this.radius * alpha, 0, Math.PI * 2); ctx.fill();
                                    ctx.shadowBlur = 0;
                                }
                            });
                        }
                    }, wave * 500);
                }
                break;
        }
    }

    takeDamage(amount) { this.hp -= amount; if (this.hp <= 0) this.hp = 0; }

    draw(ctx) {
        const time = Date.now() / 1000;
        const isRage = this.phase === 2;
        
        // ===== 雷暴背景光环 =====
        const glowSize = isRage ? 2.8 : 2.0;
        const stormGlow = ctx.createRadialGradient(this.x, this.y, this.radius * 0.3, this.x, this.y, this.radius * glowSize);
        stormGlow.addColorStop(0, isRage ? 'rgba(255, 255, 100, 0.5)' : 'rgba(100, 150, 255, 0.3)');
        stormGlow.addColorStop(0.5, isRage ? 'rgba(0, 200, 255, 0.25)' : 'rgba(65, 105, 225, 0.15)');
        stormGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = stormGlow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // ===== 旋转雷电环 =====
        ctx.strokeStyle = isRage ? '#00ffff' : '#6495ed';
        ctx.lineWidth = 3;
        for (let ring = 0; ring < 2; ring++) {
            const ringDist = this.radius + 15 + ring * 20;
            for (let i = 0; i < 8; i++) {
                const boltAngle = time * (2 + ring) + i * (Math.PI / 4) + ring * 0.4;
                const boltX = this.x + Math.cos(boltAngle) * ringDist;
                const boltY = this.y + Math.sin(boltAngle) * ringDist;
                // 闪电符号
                ctx.beginPath();
                ctx.moveTo(boltX - 4, boltY - 8);
                ctx.lineTo(boltX + 2, boltY - 2);
                ctx.lineTo(boltX - 2, boltY + 2);
                ctx.lineTo(boltX + 4, boltY + 8);
                ctx.stroke();
            }
        }
        
        // ===== 奥林匹斯云座 =====
        ctx.fillStyle = isRage ? 'rgba(180, 180, 220, 0.7)' : 'rgba(200, 210, 230, 0.6)';
        ctx.shadowColor = isRage ? '#ffff88' : '#aaccff';
        ctx.shadowBlur = 15;
        for (let c = 0; c < 3; c++) {
            const cloudX = this.x + (c - 1) * 30;
            const cloudY = this.y + 45 + Math.sin(time * 2 + c) * 3;
            ctx.beginPath();
            ctx.ellipse(cloudX, cloudY, 35 - c * 5, 15, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        
        // ===== 神圣长袍身躯 =====
        // 袍子
        ctx.fillStyle = isRage ? '#4169e1' : '#1e3a8a';
        ctx.beginPath();
        ctx.moveTo(this.x - 35, this.y + 10);
        ctx.quadraticCurveTo(this.x - 45, this.y + 50, this.x - 30, this.y + 60);
        ctx.lineTo(this.x + 30, this.y + 60);
        ctx.quadraticCurveTo(this.x + 45, this.y + 50, this.x + 35, this.y + 10);
        ctx.closePath();
        ctx.fill();
        // 金边
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 躯干
        const bodyGrad = ctx.createRadialGradient(this.x, this.y - 10, 0, this.x, this.y, this.radius);
        bodyGrad.addColorStop(0, isRage ? '#fff8dc' : '#f5f5dc');
        bodyGrad.addColorStop(0.5, isRage ? '#ffd700' : '#daa520');
        bodyGrad.addColorStop(1, isRage ? '#ff8c00' : '#4169e1');
        ctx.fillStyle = bodyGrad;
        ctx.shadowColor = isRage ? '#ffff00' : '#4169e1';
        ctx.shadowBlur = isRage ? 40 : 20;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 5, this.radius * 0.85, this.radius * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // ===== 肌肉手臂 =====
        ctx.fillStyle = isRage ? '#ffd700' : '#deb887';
        // 左臂持雷电
        ctx.beginPath();
        ctx.ellipse(this.x - 50, this.y + 5, 12, 25, -0.5, 0, Math.PI * 2);
        ctx.fill();
        // 右臂持权杖
        ctx.beginPath();
        ctx.ellipse(this.x + 50, this.y + 5, 12, 25, 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // ===== 雷电之矛（左手）=====
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(this.x - 65, this.y - 30);
        ctx.lineTo(this.x - 55, this.y + 40);
        ctx.stroke();
        // 矛尖闪电
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(this.x - 65, this.y - 30);
        ctx.lineTo(this.x - 60, this.y - 45);
        ctx.lineTo(this.x - 68, this.y - 38);
        ctx.lineTo(this.x - 62, this.y - 55 - Math.sin(time * 8) * 5);
        ctx.lineTo(this.x - 72, this.y - 42);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // ===== 神圣权杖（右手）=====
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(this.x + 55, this.y - 25);
        ctx.lineTo(this.x + 60, this.y + 45);
        ctx.stroke();
        // 权杖顶端宝石
        ctx.fillStyle = isRage ? '#00ffff' : '#4169e1';
        ctx.shadowColor = isRage ? '#00ffff' : '#4169e1';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.x + 55, this.y - 32, 10 + Math.sin(time * 4) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // ===== 神王头部 =====
        // 头发和胡须
        ctx.fillStyle = isRage ? '#e0e0e0' : '#c0c0c0';
        // 飘逸长发
        for (let h = 0; h < 5; h++) {
            const hairAngle = -0.8 + h * 0.4 + Math.sin(time * 3 + h) * 0.1;
            ctx.beginPath();
            ctx.moveTo(this.x + Math.cos(hairAngle - Math.PI / 2) * 25, this.y - 30);
            ctx.quadraticCurveTo(
                this.x + Math.cos(hairAngle - Math.PI / 2) * 40 + Math.sin(time * 2 + h) * 5,
                this.y - 20 + h * 5,
                this.x + Math.cos(hairAngle - Math.PI / 2) * 35,
                this.y + 5
            );
            ctx.lineWidth = 8 - h;
            ctx.strokeStyle = isRage ? '#f0f0f0' : '#b0b0b0';
            ctx.stroke();
        }
        // 胡须
        ctx.strokeStyle = isRage ? '#ffffff' : '#d0d0d0';
        ctx.lineWidth = 4;
        for (let b = 0; b < 5; b++) {
            const beardAngle = -0.4 + b * 0.2;
            ctx.beginPath();
            ctx.moveTo(this.x + beardAngle * 30, this.y + 15);
            ctx.quadraticCurveTo(
                this.x + beardAngle * 35 + Math.sin(time * 2 + b) * 3,
                this.y + 35,
                this.x + beardAngle * 25,
                this.y + 50 + b * 3
            );
            ctx.stroke();
        }
        
        // 脸部
        const faceGrad = ctx.createRadialGradient(this.x, this.y - 25, 0, this.x, this.y - 20, 30);
        faceGrad.addColorStop(0, '#ffeedd');
        faceGrad.addColorStop(1, isRage ? '#daa520' : '#d2b48c');
        ctx.fillStyle = faceGrad;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 20, 28, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // ===== 威严眼睛（雷电之眼）=====
        ctx.fillStyle = isRage ? '#00ffff' : '#4169e1';
        ctx.shadowColor = isRage ? '#00ffff' : '#4169e1';
        ctx.shadowBlur = isRage ? 20 : 10;
        ctx.beginPath();
        ctx.ellipse(this.x - 12, this.y - 22, 8, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 12, this.y - 22, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // 闪电瞳孔
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(this.x - 12, this.y - 26);
        ctx.lineTo(this.x - 10, this.y - 22);
        ctx.lineTo(this.x - 14, this.y - 20);
        ctx.lineTo(this.x - 12, this.y - 18);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 12, this.y - 26);
        ctx.lineTo(this.x + 14, this.y - 22);
        ctx.lineTo(this.x + 10, this.y - 20);
        ctx.lineTo(this.x + 12, this.y - 18);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // ===== 奥林匹斯王冠 =====
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        // 王冠底座
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 48, 32, 8, 0, Math.PI, 0);
        ctx.fill();
        // 七道尖刺
        for (let s = 0; s < 7; s++) {
            const spikeX = this.x - 28 + s * 9.5;
            const spikeHeight = s === 3 ? 30 : (s === 2 || s === 4 ? 22 : 16);
            ctx.beginPath();
            ctx.moveTo(spikeX - 4, this.y - 48);
            ctx.lineTo(spikeX, this.y - 48 - spikeHeight - Math.sin(time * 4 + s) * 3);
            ctx.lineTo(spikeX + 4, this.y - 48);
            ctx.closePath();
            ctx.fill();
            // 宝石
            if (s === 3) {
                ctx.fillStyle = isRage ? '#ff0000' : '#4169e1';
                ctx.beginPath();
                ctx.arc(spikeX, this.y - 55, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffd700';
            }
        }
        ctx.shadowBlur = 0;
        
        // ===== Phase 2 雷神威能光环 =====
        if (isRage) {
            // 多层电弧环
            for (let r = 0; r < 2; r++) {
                ctx.strokeStyle = `rgba(0, 255, 255, ${0.6 - r * 0.2 + Math.sin(time * 6) * 0.2})`;
                ctx.lineWidth = 4 - r;
                ctx.setLineDash([12 + r * 5, 6 + r * 3]);
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius + 35 + r * 15, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.setLineDash([]);
            
            // 随机闪电
            if (Math.random() > 0.7) {
                const boltAngle = Math.random() * Math.PI * 2;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.moveTo(this.x + Math.cos(boltAngle) * this.radius, this.y + Math.sin(boltAngle) * this.radius);
                let bx = this.x + Math.cos(boltAngle) * this.radius;
                let by = this.y + Math.sin(boltAngle) * this.radius;
                for (let seg = 0; seg < 4; seg++) {
                    bx += Math.cos(boltAngle) * 15 + (Math.random() - 0.5) * 10;
                    by += Math.sin(boltAngle) * 15 + (Math.random() - 0.5) * 10;
                    ctx.lineTo(bx, by);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }

        if (this.state === 'TELEGRAPH') this.drawSkillIndicator(ctx);
    }

    drawSkillIndicator(ctx) {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        switch (this.currentSkill) {
            case 'THUNDER_DASH':
                this.drawDashIndicator(ctx, this.dashTarget.x, this.dashTarget.y, '255, 255, 0'); break;
            case 'LIGHTNING_BOLT':
                ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'; ctx.beginPath(); ctx.moveTo(this.x, this.y);
                ctx.arc(this.x, this.y, 350, angle - 0.4, angle + 0.4); ctx.closePath(); ctx.fill(); break;
            case 'STORM_CLOUD': case 'DIVINE_STRIKE':
                this.drawAOEIndicator(ctx, this.player.x, this.player.y, 120, '255, 255, 0'); break;
            case 'THUNDER_CLAP': case 'LIGHTNING_FIELD': case 'OLYMPUS_WRATH': case 'THUNDERGOD_AVATAR':
                this.drawAOEIndicator(ctx, this.x, this.y, 200, '0, 255, 255'); break;
            case 'SKY_FURY':
                this.drawAOEIndicator(ctx, this.player.x, this.player.y, 100, '0, 255, 255');
                ctx.fillStyle = 'rgba(255, 255, 0, 0.5)'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center';
                ctx.fillText('⚡⚡⚡', this.player.x, this.player.y - 60); break;
            default:
                this.drawAOEIndicator(ctx, this.x, this.y, 150, '255, 215, 0'); break;
        }
    }
}

// ============================================
// Level 5: 圣剑王·亚瑟 (Final Boss)
// 风格：武士剑圣，持有Excalibur，快速突进+剑技
// ============================================
class PaladinBoss extends BaseBoss {
    constructor(x, y, player, combatSystem) {
        super(x, y, player, combatSystem);
        this.level = 5;
        this.name = '圣剑王·亚瑟';
        this.maxHp = 3000;  // 最终Boss血量
        this.hp = this.maxHp;
        this.radius = 55;
        this.color = '#ffd700';
        this.damage = 40;
        this.critChance = 0.35;  // 35%暴击率
        this.critMultiplier = 1.5;  // 150%暴击伤害
        this.telegraphDuration = 0.55;  // 更快前摇
        this.attackCooldown = 0.85;  // 更快攻击
        // 剑技为主的技能
        this.skills = [
            'SWIFT_SLASH',      // 迅斩
            'DASH_STRIKE',      // 突进斩
            'EXCALIBUR_THRUST', // 圣剑突刺
            'BLADE_DANCE',      // 剑舞
            'CROSS_SLASH',      // 十字斩
            'FLASH_STEP',       // 闪步
            'COUNTER_STANCE',   // 架势反击
            'SWORD_RAIN',       // 剑雨
            'BLADE_BARRIER',    // 剑阵
            'HOLY_SMITE',       // 圣光击
            'EXCALIBUR_BEAM',   // 圣剑光波
            'KINGS_CHARGE'      // 王者冲锋
        ];
        this.phase2Skills = [
            ...this.skills,
            'EXCALIBUR_JUDGMENT', // 圣剑审判
            'THOUSAND_CUTS',      // 千刃乱舞
            'BLINK_ASSAULT',      // 瞬闪连斩
            'KINGS_WRATH',        // 王者之怒
            'AVALON_SHIELD',      // 阿瓦隆护盾
            'DIVINE_STORM',       // 神圣风暴
            'ROUND_TABLE'         // 圆桌剑阵
        ];
        this.swordAngle = 0;    // 剑角度动画
        this.dashTrail = [];    // 冲刺残影
        this.isBlinking = false; // 闪现状态
        this.comboCount = 0;    // 连击计数
    }
    
    // 计算暴击伤害
    calcDamage(baseDamage) {
        if (Math.random() < this.critChance) {
            return { damage: Math.round(baseDamage * this.critMultiplier), isCrit: true };
        }
        return { damage: baseDamage, isCrit: false };
    }

    update(deltaTime) {
        if (this.state === 'IDLE') {
            const dx = this.player.x - this.x;
            const dy = this.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = this.phase === 2 ? 100 : 70;
            if (dist > 150) { this.x += (dx / dist) * speed * deltaTime; this.y += (dy / dist) * speed * deltaTime; }
            else if (dist < 100) { this.x -= (dx / dist) * speed * 0.5 * deltaTime; this.y -= (dy / dist) * speed * 0.5 * deltaTime; }
        }

        switch (this.state) {
            case 'IDLE':
                this.timer += deltaTime;
                this.wingSpan = Math.sin(Date.now() / 500) * 0.2;
                this.haloAngle += deltaTime * 2;
                if (this.timer >= (this.attackCooldown || 1.2)) {
                    this.state = 'TELEGRAPH';
                    const pool = this.phase === 2 ? this.phase2Skills : this.skills;
                    this.currentSkill = pool[Math.floor(Math.random() * pool.length)];
                    this.dashTarget = { x: this.player.x, y: this.player.y };
                    this.timer = 0;
                }
                break;
            case 'TELEGRAPH':
                this.timer += deltaTime;
                if (this.timer >= this.telegraphDuration) {
                    this.executeAttack();
                    this.state = 'IDLE';
                    this.timer = 0;
                }
                break;
        }

        if (this.hp < this.maxHp * 0.5 && this.phase === 1) { this.phase = 2; this.telegraphDuration = 0.7; }
    }

    executeAttack() {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        const boss = this;
        
        // 剑气弹绘制函数 - 暴击时金色特效
        const drawSwordWave = (ctx, x, y, rotation, color = '#c0c0c0', isCrit = false) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.fillStyle = isCrit ? '#ffd700' : color;
            ctx.shadowColor = isCrit ? '#ffff00' : '#ffffff';
            ctx.shadowBlur = isCrit ? 25 : 15;
            ctx.beginPath();
            ctx.moveTo(isCrit ? 30 : 25, 0);
            ctx.lineTo(-15, isCrit ? -10 : -8);
            ctx.lineTo(-10, 0);
            ctx.lineTo(-15, isCrit ? 10 : 8);
            ctx.closePath();
            ctx.fill();
            // 暴击时额外光效
            if (isCrit) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
            ctx.restore();
        };
        
        switch (this.currentSkill) {
            case 'SWORD_THRUST':
                // 剑刺 - 快速直线剑气 (可暴击)
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        const critResult = boss.calcDamage(15);
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y, vx: Math.cos(angle) * 550, vy: Math.sin(angle) * 550,
                            radius: critResult.isCrit ? 15 : 12, damage: critResult.damage, owner: 'enemy', rotation: angle, isCrit: critResult.isCrit,
                            update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                            draw(ctx) { drawSwordWave(ctx, this.x, this.y, this.rotation, '#c0c0c0', this.isCrit); }
                        });
                    }, i * 150);
                }
                break;

            case 'DIVINE_DASH':
                // 神圣突进 - 剑士冲刺斩 (可暴击)
                const target = { ...this.dashTarget };
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        this.x += (target.x - this.x) / (5 - i);
                        this.y += (target.y - this.y) / (5 - i);
                        // 留下剑痕
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y, radius: 30, damage: 0, owner: 'enemy', life: 0.3, maxLife: 0.3,
                            update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) { ctx.strokeStyle = `rgba(192,192,192,${this.life/this.maxLife})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(this.x,this.y,20,0,Math.PI*2); ctx.stroke(); }
                        });
                        const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                        if (dist < 70) {
                            const critResult = boss.calcDamage(20);
                            this.player.takeDamage(critResult.damage);
                        }
                    }, i * 50);
                }
                break;

            case 'BLADE_STORM':
                // 剑刃风暴 - 旋转剑气 (可暴击)
                for (let w = 0; w < 3; w++) {
                    setTimeout(() => {
                        for (let i = 0; i < 8; i++) {
                            const a = (Math.PI * 2 / 8) * i + w * 0.25;
                            const critResult = boss.calcDamage(12);
                            this.combatSystem.spawnProjectile({
                                x: this.x, y: this.y, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320,
                                radius: critResult.isCrit ? 13 : 10, damage: critResult.damage, owner: 'enemy', rotation: a, isCrit: critResult.isCrit,
                                update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.rotation += dt * 8; },
                                draw(ctx) { drawSwordWave(ctx, this.x, this.y, this.rotation, '#a0a0a0', this.isCrit); }
                            });
                        }
                    }, w * 300);
                }
                break;

            case 'CROSS_SLASH':
                // 十字斩 - 四方向剑气 (可暴击)
                [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((off, i) => {
                    setTimeout(() => {
                        const slashAngle = angle + off;
                        const critResult = boss.calcDamage(14);
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y, vx: Math.cos(slashAngle) * 400, vy: Math.sin(slashAngle) * 400,
                            radius: critResult.isCrit ? 18 : 15, damage: critResult.damage, owner: 'enemy', rotation: slashAngle, isCrit: critResult.isCrit,
                            update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                            draw(ctx) { drawSwordWave(ctx, this.x, this.y, this.rotation, '#d4af37', this.isCrit); }
                        });
                    }, i * 80);
                });
                break;

            case 'SWORD_RAIN':
                // 剑雨 - 从上方落下的剑 (可暴击)
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        const sx = this.player.x + (Math.random() - 0.5) * 250;
                        const sy = this.player.y + (Math.random() - 0.5) * 250;
                        const critResult = boss.calcDamage(15);
                        this.combatSystem.spawnProjectile({
                            x: sx, y: sy - 300, vy: 500, radius: critResult.isCrit ? 15 : 12, damage: critResult.damage, owner: 'enemy', targetY: sy, rotation: Math.PI / 2, isCrit: critResult.isCrit,
                            update(dt) { this.y += this.vy * dt; if (this.y >= this.targetY) this.markedForDeletion = true; },
                            draw(ctx) {
                                ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
                                ctx.fillStyle = this.isCrit ? '#ffd700' : '#c0c0c0'; ctx.shadowColor = this.isCrit ? '#ffff00' : '#ffffff'; ctx.shadowBlur = this.isCrit ? 30 : 20;
                                ctx.fillRect(-4, -25, 8, 50);
                                ctx.fillStyle = '#8b4513'; ctx.fillRect(-6, 20, 12, 10);
                                ctx.shadowBlur = 0; ctx.restore();
                            }
                        });
                    }, i * 120);
                }
                break;

            case 'BLADE_BARRIER':
                // 剑阵 - 环绕的剑
                for (let i = 0; i < 12; i++) {
                    const a = (Math.PI * 2 / 12) * i;
                    this.combatSystem.spawnProjectile({
                        x: this.x + Math.cos(a) * 90, y: this.y + Math.sin(a) * 90,
                        radius: 12, damage: 10, owner: 'enemy', life: 2.5, angle: a, centerX: this.x, centerY: this.y,
                        update(dt) { this.angle += dt * 2.5; this.x = this.centerX + Math.cos(this.angle) * 90; this.y = this.centerY + Math.sin(this.angle) * 90; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                        draw(ctx) {
                            ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle + Math.PI/2);
                            ctx.fillStyle = '#c0c0c0'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 10;
                            ctx.fillRect(-3, -18, 6, 36); ctx.shadowBlur = 0; ctx.restore();
                        }
                    });
                }
                break;

            case 'JUDGEMENT_BLADE':
                // 审判之剑 - 巨大剑气 (可暴击)
                const judgeResult = boss.calcDamage(24);
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y, vx: Math.cos(angle) * 350, vy: Math.sin(angle) * 350,
                    radius: judgeResult.isCrit ? 50 : 40, damage: judgeResult.damage, owner: 'enemy', rotation: angle, life: 2, isCrit: judgeResult.isCrit,
                    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
                        ctx.fillStyle = this.isCrit ? '#ffffff' : '#ffd700'; ctx.shadowColor = this.isCrit ? '#ffff00' : '#ffffff'; ctx.shadowBlur = this.isCrit ? 45 : 30;
                        const scale = this.isCrit ? 1.2 : 1;
                        ctx.beginPath(); ctx.moveTo(50*scale, 0); ctx.lineTo(-30*scale, -20*scale); ctx.lineTo(-20*scale, 0); ctx.lineTo(-30*scale, 20*scale); ctx.closePath(); ctx.fill();
                        ctx.shadowBlur = 0; ctx.restore();
                    }
                });
                break;

            case 'RADIANT_SLASH':
                // 光辉斩 - 扇形剑气 (可暴击)
                for (let i = -3; i <= 3; i++) {
                    const slashAngle = angle + i * 0.2;
                    const radiantCrit = boss.calcDamage(10);
                    this.combatSystem.spawnProjectile({
                        x: this.x, y: this.y, vx: Math.cos(slashAngle) * 450, vy: Math.sin(slashAngle) * 450,
                        radius: radiantCrit.isCrit ? 13 : 10, damage: radiantCrit.damage, owner: 'enemy', rotation: slashAngle, isCrit: radiantCrit.isCrit,
                        update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                        draw(ctx) { drawSwordWave(ctx, this.x, this.y, this.rotation, '#ffd700', this.isCrit); }
                    });
                }
                break;

            case 'HOLY_BLADE':
                // 圣剑 - 追踪剑气 (可暴击)
                for (let i = 0; i < 4; i++) {
                    setTimeout(() => {
                        const holyCrit = boss.calcDamage(13);
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y, targetPlayer: this.player, speed: 300, rotation: 0,
                            radius: holyCrit.isCrit ? 18 : 15, damage: holyCrit.damage, owner: 'enemy', life: 2.5, isCrit: holyCrit.isCrit,
                            update(dt) {
                                const dx = this.targetPlayer.x - this.x, dy = this.targetPlayer.y - this.y;
                                const dist = Math.sqrt(dx*dx + dy*dy);
                                this.rotation = Math.atan2(dy, dx);
                                this.x += (dx/dist) * this.speed * dt; this.y += (dy/dist) * this.speed * dt;
                                this.life -= dt; if (this.life <= 0) this.markedForDeletion = true;
                            },
                            draw(ctx) { drawSwordWave(ctx, this.x, this.y, this.rotation, '#ffffff', this.isCrit); }
                        });
                    }, i * 200);
                }
                break;

            case 'FINAL_JUDGEMENT':
                // 终极审判 - 剑气风暴
                for (let w = 0; w < 5; w++) {
                    setTimeout(() => {
                        for (let i = 0; i < 12; i++) {
                            const a = (Math.PI * 2 / 12) * i + w * 0.15;
                            this.combatSystem.spawnProjectile({
                                x: this.x, y: this.y, vx: Math.cos(a) * (300 + w * 40), vy: Math.sin(a) * (300 + w * 40),
                                radius: 12, damage: 16, owner: 'enemy', rotation: a,
                                update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                                draw(ctx) { drawSwordWave(ctx, this.x, this.y, this.rotation, '#ffd700'); }
                            });
                        }
                    }, w * 200);
                }
                break;

            case 'ANGELIC_WRATH':
                // 天使之怒 - 神圣剑雨+冲刺连斩
                for (let wave = 0; wave < 3; wave++) {
                    setTimeout(() => {
                        // 8方向剑气
                        for (let i = 0; i < 8; i++) {
                            const ba = (Math.PI * 2 / 8) * i + wave * 0.25;
                            this.combatSystem.spawnProjectile({
                                x: this.x, y: this.y, vx: Math.cos(ba) * 400, vy: Math.sin(ba) * 400,
                                radius: 14, damage: 18, owner: 'enemy', rotation: ba,
                                update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                                draw(ctx) { drawSwordWave(ctx, this.x, this.y, this.rotation, '#ffffff'); }
                            });
                        }
                        // 剑雨
                        for (let j = 0; j < 4; j++) {
                            const sx = this.player.x + (Math.random() - 0.5) * 180;
                            const sy = this.player.y + (Math.random() - 0.5) * 180;
                            setTimeout(() => {
                                this.combatSystem.spawnProjectile({
                                    x: sx, y: sy - 250, vy: 450, radius: 10, damage: 15, owner: 'enemy', targetY: sy,
                                    update(dt) { this.y += this.vy * dt; if (this.y >= this.targetY) this.markedForDeletion = true; },
                                    draw(ctx) {
                                        ctx.save(); ctx.translate(this.x, this.y);
                                        ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 15;
                                        ctx.fillRect(-3, -20, 6, 40); ctx.shadowBlur = 0; ctx.restore();
                                    }
                                });
                            }, j * 80);
                        }
                    }, wave * 400);
                }
                break;
                
            // ===== 新增武士剑技 =====
            case 'SWIFT_SLASH':
                // 迅斩 - 极快的三连斩
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        const slashAngle = angle + (i - 1) * 0.4;
                        const critResult = boss.calcDamage(18);
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y, vx: Math.cos(slashAngle) * 600, vy: Math.sin(slashAngle) * 600,
                            radius: 15, damage: critResult.damage, owner: 'enemy', rotation: slashAngle, life: 0.8, isCrit: critResult.isCrit,
                            update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) {
                                ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
                                ctx.fillStyle = this.isCrit ? '#ffd700' : '#c0c0c0'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 20;
                                ctx.beginPath(); ctx.moveTo(35, 0); ctx.lineTo(-10, -12); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill();
                                ctx.shadowBlur = 0; ctx.restore();
                            }
                        });
                    }, i * 80);
                }
                break;
                
            case 'DASH_STRIKE':
                // 突进斩 - 快速冲刺攻击
                const dashTarget = { ...this.dashTarget };
                this.dashTrail = [];
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        this.dashTrail.push({ x: this.x, y: this.y, life: 0.4 });
                        this.x += (dashTarget.x - this.x) / (8 - i);
                        this.y += (dashTarget.y - this.y) / (8 - i);
                        const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                        if (dist < 60) { this.player.takeDamage(boss.calcDamage(22).damage); }
                    }, i * 35);
                }
                // 终点挥砍
                setTimeout(() => {
                    for (let a = 0; a < 6; a++) {
                        const sa = (Math.PI * 2 / 6) * a;
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y, vx: Math.cos(sa) * 350, vy: Math.sin(sa) * 350,
                            radius: 12, damage: 15, owner: 'enemy', rotation: sa, life: 0.6,
                            update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) { drawSwordWave(ctx, this.x, this.y, this.rotation, '#ffd700'); }
                        });
                    }
                }, 300);
                break;
                
            case 'EXCALIBUR_THRUST':
                // 圣剑突刺 - 强力单体突刺
                const thrustCrit = boss.calcDamage(35);
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y, vx: Math.cos(angle) * 700, vy: Math.sin(angle) * 700,
                    radius: 25, damage: thrustCrit.damage, owner: 'enemy', rotation: angle, life: 1.2, isCrit: thrustCrit.isCrit,
                    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
                        const grad = ctx.createLinearGradient(-20, 0, 50, 0);
                        grad.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
                        grad.addColorStop(0.5, this.isCrit ? '#ffffff' : '#ffd700');
                        grad.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
                        ctx.fillStyle = grad; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 30;
                        ctx.beginPath(); ctx.moveTo(50, 0); ctx.lineTo(-20, -15); ctx.lineTo(-10, 0); ctx.lineTo(-20, 15); ctx.closePath(); ctx.fill();
                        ctx.shadowBlur = 0; ctx.restore();
                    }
                });
                break;
                
            case 'BLADE_DANCE':
                // 剑舞 - 原地旋转斩击
                for (let wave = 0; wave < 4; wave++) {
                    setTimeout(() => {
                        for (let i = 0; i < 12; i++) {
                            const da = (Math.PI * 2 / 12) * i + wave * 0.15;
                            this.combatSystem.spawnProjectile({
                                x: this.x + Math.cos(da) * 40, y: this.y + Math.sin(da) * 40,
                                vx: Math.cos(da) * (250 + wave * 50), vy: Math.sin(da) * (250 + wave * 50),
                                radius: 10, damage: 12, owner: 'enemy', rotation: da, life: 0.7,
                                update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                                draw(ctx) { drawSwordWave(ctx, this.x, this.y, this.rotation, '#c0c0c0'); }
                            });
                        }
                    }, wave * 150);
                }
                break;
                
            case 'FLASH_STEP':
                // 闪步 - 瞬移到玩家身后并攻击
                this.isBlinking = true;
                const behindAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                const newX = this.player.x + Math.cos(behindAngle) * 80;
                const newY = this.player.y + Math.sin(behindAngle) * 80;
                // 残影
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y, radius: this.radius, damage: 0, owner: 'enemy', life: 0.4, maxLife: 0.4,
                    update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) { ctx.fillStyle = `rgba(255, 215, 0, ${this.life / this.maxLife * 0.5})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
                });
                this.x = newX; this.y = newY;
                this.isBlinking = false;
                // 背后斩击
                setTimeout(() => {
                    for (let i = -2; i <= 2; i++) {
                        const ba = behindAngle + Math.PI + i * 0.3;
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y, vx: Math.cos(ba) * 450, vy: Math.sin(ba) * 450,
                            radius: 14, damage: 20, owner: 'enemy', rotation: ba, life: 0.6,
                            update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) { drawSwordWave(ctx, this.x, this.y, this.rotation, '#ffd700'); }
                        });
                    }
                }, 100);
                break;
                
            case 'COUNTER_STANCE':
                // 架势反击 - 短暂无敌后反击
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y, radius: 80, damage: 0, owner: 'enemy', life: 1.0, maxLife: 1.0, boss: this,
                    update(dt) {
                        this.x = this.boss.x; this.y = this.boss.y;
                        this.life -= dt; if (this.life <= 0) this.markedForDeletion = true;
                    },
                    draw(ctx) {
                        const alpha = 0.3 + Math.sin(Date.now() / 100) * 0.2;
                        ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`; ctx.lineWidth = 4;
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke();
                        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('⚔ 架势 ⚔', this.x, this.y - this.radius - 10);
                    }
                });
                // 反击
                setTimeout(() => {
                    const counterAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                    for (let i = 0; i < 8; i++) {
                        const ca = counterAngle + (i - 3.5) * 0.2;
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y, vx: Math.cos(ca) * 550, vy: Math.sin(ca) * 550,
                            radius: 16, damage: 25, owner: 'enemy', rotation: ca, life: 0.8,
                            update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) { drawSwordWave(ctx, this.x, this.y, this.rotation, '#ffffff'); }
                        });
                    }
                }, 1000);
                break;
                
            // ===== Phase 2 强力技能 =====
            case 'EXCALIBUR_JUDGMENT':
                // 圣剑审判 - 巨大光柱
                if (this.player.screenShake) { this.player.screenShake.intensity = 20; this.player.screenShake.duration = 2; }
                this.combatSystem.spawnProjectile({
                    x: this.player.x, y: this.player.y, radius: 80, damage: 0, owner: 'enemy', life: 1.5, maxLife: 1.5, targetX: this.player.x, targetY: this.player.y,
                    update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const progress = 1 - this.life / this.maxLife;
                        ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + progress * 0.4})`;
                        ctx.beginPath(); ctx.arc(this.targetX, this.targetY, this.radius * (1 - progress * 0.3), 0, Math.PI * 2); ctx.fill();
                        // 光柱
                        if (progress > 0.7) {
                            ctx.fillStyle = `rgba(255, 255, 255, ${(progress - 0.7) * 3})`;
                            ctx.fillRect(this.targetX - 30, 0, 60, 800);
                        }
                    }
                });
                setTimeout(() => {
                    const dist = Math.sqrt((this.player.x - this.dashTarget.x) ** 2 + (this.player.y - this.dashTarget.y) ** 2);
                    if (dist < 100) this.player.takeDamage(45);
                }, 1500);
                break;
                
            case 'THOUSAND_CUTS':
                // 千刃乱舞 - 大量剑气
                for (let wave = 0; wave < 6; wave++) {
                    setTimeout(() => {
                        for (let i = 0; i < 16; i++) {
                            const ca = (Math.PI * 2 / 16) * i + wave * 0.2;
                            this.combatSystem.spawnProjectile({
                                x: this.x, y: this.y, vx: Math.cos(ca) * (300 + wave * 30), vy: Math.sin(ca) * (300 + wave * 30),
                                radius: 8, damage: 10, owner: 'enemy', rotation: ca, life: 1.0,
                                update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                                draw(ctx) { drawSwordWave(ctx, this.x, this.y, this.rotation, '#c0c0c0'); }
                            });
                        }
                    }, wave * 120);
                }
                break;
                
            case 'BLINK_ASSAULT':
                // 瞬闪连斩 - 多次闪现攻击
                for (let blink = 0; blink < 5; blink++) {
                    setTimeout(() => {
                        // 闪现到随机位置
                        const blinkAngle = Math.random() * Math.PI * 2;
                        const blinkDist = 100 + Math.random() * 100;
                        const bx = this.player.x + Math.cos(blinkAngle) * blinkDist;
                        const by = this.player.y + Math.sin(blinkAngle) * blinkDist;
                        // 残影
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y, radius: 40, damage: 0, owner: 'enemy', life: 0.3, maxLife: 0.3,
                            update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) { ctx.fillStyle = `rgba(255, 215, 0, ${this.life / this.maxLife * 0.6})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
                        });
                        this.x = bx; this.y = by;
                        // 攻击
                        const atkAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y, vx: Math.cos(atkAngle) * 600, vy: Math.sin(atkAngle) * 600,
                            radius: 18, damage: 18, owner: 'enemy', rotation: atkAngle, life: 0.5,
                            update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) { drawSwordWave(ctx, this.x, this.y, this.rotation, '#ffd700'); }
                        });
                    }, blink * 250);
                }
                break;
                
            case 'KINGS_WRATH':
                // 王者之怒 - 全方位剑气爆发
                if (this.player.screenShake) { this.player.screenShake.intensity = 15; this.player.screenShake.duration = 2; }
                for (let ring = 0; ring < 3; ring++) {
                    setTimeout(() => {
                        for (let i = 0; i < 24; i++) {
                            const wa = (Math.PI * 2 / 24) * i + ring * 0.13;
                            this.combatSystem.spawnProjectile({
                                x: this.x, y: this.y, vx: Math.cos(wa) * (400 + ring * 80), vy: Math.sin(wa) * (400 + ring * 80),
                                radius: 12, damage: 15, owner: 'enemy', rotation: wa, life: 1.2,
                                update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                                draw(ctx) { drawSwordWave(ctx, this.x, this.y, this.rotation, ring === 2 ? '#ffd700' : '#c0c0c0'); }
                            });
                        }
                    }, ring * 200);
                }
                break;
                
            case 'AVALON_SHIELD':
                // 阿瓦隆护盾 - 短暂护盾+反弹
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y, radius: 100, damage: 0, owner: 'enemy', life: 2.0, maxLife: 2.0, boss: this,
                    update(dt) {
                        this.x = this.boss.x; this.y = this.boss.y;
                        this.life -= dt; if (this.life <= 0) this.markedForDeletion = true;
                    },
                    draw(ctx) {
                        const time = Date.now() / 1000;
                        ctx.strokeStyle = `rgba(255, 215, 0, ${0.6 + Math.sin(time * 8) * 0.3})`;
                        ctx.lineWidth = 6;
                        ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20;
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke();
                        ctx.fillStyle = 'rgba(255, 255, 200, 0.15)';
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                });
                break;
                
            case 'HOLY_SMITE':
                // 圣光击 - 从天而降的圣光
                for (let i = 0; i < 8; i++) {
                    const sx = this.player.x + (Math.random() - 0.5) * 300;
                    const sy = this.player.y + (Math.random() - 0.5) * 200;
                    setTimeout(() => {
                        this.combatSystem.spawnProjectile({
                            x: sx, y: sy - 400, targetX: sx, targetY: sy, radius: 35, damage: 22, owner: 'enemy', life: 0.4, maxLife: 0.4,
                            update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) {
                                const alpha = this.life / this.maxLife;
                                ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`; ctx.lineWidth = 8;
                                ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 25;
                                ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.targetX, this.targetY); ctx.stroke();
                                ctx.fillStyle = `rgba(255, 255, 200, ${alpha * 0.6})`;
                                ctx.beginPath(); ctx.arc(this.targetX, this.targetY, this.radius * alpha, 0, Math.PI * 2); ctx.fill();
                                ctx.shadowBlur = 0;
                            }
                        });
                    }, i * 100);
                }
                break;
                
            case 'EXCALIBUR_BEAM':
                // 圣剑光波 - 巨型剑气
                const beamAngle = angle;
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y, vx: Math.cos(beamAngle) * 450, vy: Math.sin(beamAngle) * 450,
                    radius: 40, damage: 35, owner: 'enemy', rotation: beamAngle, life: 1.5, trail: [],
                    update(dt) {
                        this.trail.push({ x: this.x, y: this.y, life: 0.3 });
                        this.trail = this.trail.filter(t => { t.life -= dt; return t.life > 0; });
                        this.x += this.vx * dt; this.y += this.vy * dt;
                        this.life -= dt; if (this.life <= 0) this.markedForDeletion = true;
                    },
                    draw(ctx) {
                        this.trail.forEach(t => {
                            ctx.fillStyle = `rgba(255, 215, 0, ${t.life})`; ctx.beginPath();
                            ctx.arc(t.x, t.y, 30, 0, Math.PI * 2); ctx.fill();
                        });
                        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
                        ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 30;
                        ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(-30, -25); ctx.lineTo(-30, 25); ctx.closePath(); ctx.fill();
                        ctx.shadowBlur = 0; ctx.restore();
                    }
                });
                break;
                
            case 'KINGS_CHARGE':
                // 王者冲锋 - 多段突进
                const chargeTarget = { ...this.dashTarget };
                for (let c = 0; c < 4; c++) {
                    setTimeout(() => {
                        this.dashTrail.push({ x: this.x, y: this.y, life: 0.4 });
                        const ca = Math.atan2(chargeTarget.y - this.y, chargeTarget.x - this.x);
                        this.x += Math.cos(ca) * 100; this.y += Math.sin(ca) * 100;
                        // 剑气
                        for (let s = -2; s <= 2; s++) {
                            this.combatSystem.spawnProjectile({
                                x: this.x, y: this.y, vx: Math.cos(ca + s * 0.3) * 400, vy: Math.sin(ca + s * 0.3) * 400,
                                radius: 12, damage: 18, owner: 'enemy', rotation: ca + s * 0.3, life: 0.6,
                                update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                                draw(ctx) { drawSwordWave(ctx, this.x, this.y, this.rotation, '#ffd700'); }
                            });
                        }
                        const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                        if (dist < 70) this.player.takeDamage(25);
                    }, c * 200);
                }
                break;
                
            case 'DIVINE_STORM':
                // 神圣风暴 - 全屏剑雨+冲击波
                if (this.player.screenShake) { this.player.screenShake.intensity = 20; this.player.screenShake.duration = 3; }
                // 冲击波
                for (let ring = 0; ring < 4; ring++) {
                    setTimeout(() => {
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y, radius: 0, maxRadius: 350, damage: 20, owner: 'enemy', life: 0.6, maxLife: 0.6,
                            update(dt) { this.radius = this.maxRadius * (1 - this.life / this.maxLife); this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) { ctx.strokeStyle = `rgba(255, 215, 0, ${this.life / this.maxLife})`; ctx.lineWidth = 10;
                                ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
                        });
                    }, ring * 400);
                }
                // 剑雨
                for (let i = 0; i < 25; i++) {
                    setTimeout(() => {
                        const rx = 50 + Math.random() * 900, ry = 50 + Math.random() * 500;
                        this.combatSystem.spawnProjectile({
                            x: rx, y: ry - 300, targetY: ry, radius: 15, damage: 15, owner: 'enemy', life: 0.35, maxLife: 0.35,
                            update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) { ctx.strokeStyle = `rgba(255, 215, 0, ${this.life / this.maxLife})`; ctx.lineWidth = 6; ctx.shadowColor = '#fff'; ctx.shadowBlur = 15;
                                ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x, this.targetY); ctx.stroke();
                                ctx.fillStyle = `rgba(255, 255, 200, ${this.life / this.maxLife * 0.6})`; ctx.beginPath(); ctx.arc(this.x, this.targetY, 20, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
                        });
                    }, i * 80);
                }
                break;
                
            case 'ROUND_TABLE':
                // 圆桌剑阵 - 围绕Boss的12把剑同时发射
                for (let i = 0; i < 12; i++) {
                    const swordAngle = (Math.PI * 2 / 12) * i;
                    const sx = this.x + Math.cos(swordAngle) * 100;
                    const sy = this.y + Math.sin(swordAngle) * 100;
                    // 先显示剑
                    this.combatSystem.spawnProjectile({
                        x: sx, y: sy, radius: 20, damage: 0, owner: 'enemy', life: 1.0, maxLife: 1.0, swordAngle: swordAngle,
                        update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                        draw(ctx) {
                            const alpha = this.life / this.maxLife;
                            ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.swordAngle + Math.PI / 2);
                            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`; ctx.shadowColor = '#fff'; ctx.shadowBlur = 15;
                            ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(6, 15); ctx.lineTo(-6, 15); ctx.closePath(); ctx.fill();
                            ctx.shadowBlur = 0; ctx.restore();
                        }
                    });
                }
                // 然后发射
                setTimeout(() => {
                    for (let i = 0; i < 12; i++) {
                        const swordAngle = (Math.PI * 2 / 12) * i;
                        const sx = this.x + Math.cos(swordAngle) * 100;
                        const sy = this.y + Math.sin(swordAngle) * 100;
                        const targetAngle = Math.atan2(this.player.y - sy, this.player.x - sx);
                        this.combatSystem.spawnProjectile({
                            x: sx, y: sy, vx: Math.cos(targetAngle) * 500, vy: Math.sin(targetAngle) * 500,
                            radius: 15, damage: 20, owner: 'enemy', rotation: targetAngle, life: 1.0,
                            update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) { drawSwordWave(ctx, this.x, this.y, this.rotation, '#ffd700'); }
                        });
                    }
                }, 800);
                break;
        }
    }

    takeDamage(amount) { this.hp -= amount; if (this.hp <= 0) this.hp = 0; }

    draw(ctx) {
        const time = Date.now() / 1000;
        const isRage = this.phase === 2;
        this.swordAngle = Math.sin(time * 3) * 0.2;
        
        // ===== 王者气场光环 =====
        const glowSize = isRage ? 2.8 : 2.0;
        const kingsAura = ctx.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, this.radius * glowSize);
        kingsAura.addColorStop(0, isRage ? 'rgba(255, 215, 0, 0.5)' : 'rgba(200, 200, 220, 0.25)');
        kingsAura.addColorStop(0.5, isRage ? 'rgba(255, 180, 0, 0.2)' : 'rgba(150, 150, 180, 0.1)');
        kingsAura.addColorStop(1, 'transparent');
        ctx.fillStyle = kingsAura;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // ===== 残影轨迹 =====
        this.dashTrail = this.dashTrail.filter(t => { t.life -= 0.016; return t.life > 0; });
        this.dashTrail.forEach(trail => {
            ctx.fillStyle = `rgba(255, 215, 0, ${trail.life})`;
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // ===== 王者披风 =====
        ctx.fillStyle = isRage ? '#8b0000' : '#191970';
        ctx.beginPath();
        ctx.moveTo(this.x - 25, this.y - 10);
        ctx.quadraticCurveTo(this.x - 50 + Math.sin(time * 3) * 10, this.y + 30, this.x - 35, this.y + 60);
        ctx.lineTo(this.x + 35, this.y + 60);
        ctx.quadraticCurveTo(this.x + 50 + Math.sin(time * 3 + 1) * 10, this.y + 30, this.x + 25, this.y - 10);
        ctx.closePath();
        ctx.fill();
        // 披风金边
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // ===== 骑士铠甲身躯 =====
        const armorGrad = ctx.createRadialGradient(this.x - 10, this.y - 10, 0, this.x, this.y, this.radius);
        armorGrad.addColorStop(0, '#e8e8e8');
        armorGrad.addColorStop(0.3, isRage ? '#c0c0c0' : '#a8a8a8');
        armorGrad.addColorStop(0.7, isRage ? '#909090' : '#707070');
        armorGrad.addColorStop(1, isRage ? '#606060' : '#404040');
        ctx.fillStyle = armorGrad;
        ctx.shadowColor = isRage ? '#ffd700' : '#fff';
        ctx.shadowBlur = isRage ? 25 : 10;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius * 0.85, this.radius * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // 铠甲纹饰 - 龙纹
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y - 20);
        ctx.quadraticCurveTo(this.x, this.y - 30, this.x + 15, this.y - 20);
        ctx.quadraticCurveTo(this.x + 10, this.y, this.x, this.y + 15);
        ctx.quadraticCurveTo(this.x - 10, this.y, this.x - 15, this.y - 20);
        ctx.stroke();
        
        // ===== 王者头盔 =====
        const helmetGrad = ctx.createRadialGradient(this.x, this.y - 40, 0, this.x, this.y - 35, 30);
        helmetGrad.addColorStop(0, '#d0d0d0');
        helmetGrad.addColorStop(0.5, '#808080');
        helmetGrad.addColorStop(1, '#404040');
        ctx.fillStyle = helmetGrad;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 38, 25, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        // 面罩
        ctx.fillStyle = '#202020';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 35, 18, 12, 0, 0.3, Math.PI - 0.3);
        ctx.fill();
        // 头盔装饰
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 60);
        ctx.lineTo(this.x - 8, this.y - 48);
        ctx.lineTo(this.x + 8, this.y - 48);
        ctx.closePath();
        ctx.fill();
        // 王冠
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 42, 22, Math.PI + 0.3, -0.3);
        ctx.stroke();
        
        // 发光眼睛（透过面罩）
        ctx.fillStyle = isRage ? '#ff4444' : '#4488ff';
        ctx.shadowColor = isRage ? '#ff0000' : '#0066ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.ellipse(this.x - 8, this.y - 38, 4, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 8, this.y - 38, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // ===== Excalibur 圣剑 =====
        ctx.save();
        ctx.translate(this.x + 45, this.y - 15);
        ctx.rotate(-0.5 + this.swordAngle);
        
        // 剑身发光效果
        ctx.shadowColor = isRage ? '#ffd700' : '#88ccff';
        ctx.shadowBlur = isRage ? 35 : 20;
        
        // 剑身 - Excalibur特效
        const excaliburGrad = ctx.createLinearGradient(0, -80, 0, 20);
        excaliburGrad.addColorStop(0, '#ffffff');
        excaliburGrad.addColorStop(0.3, isRage ? '#ffd700' : '#88ccff');
        excaliburGrad.addColorStop(0.6, isRage ? '#ffaa00' : '#4488ff');
        excaliburGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = excaliburGrad;
        ctx.beginPath();
        ctx.moveTo(0, -85);  // 剑尖
        ctx.lineTo(8, -60);
        ctx.lineTo(8, 15);
        ctx.lineTo(-8, 15);
        ctx.lineTo(-8, -60);
        ctx.closePath();
        ctx.fill();
        
        // 剑身中线发光
        ctx.strokeStyle = isRage ? '#ffffff' : '#aaddff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -80);
        ctx.lineTo(0, 10);
        ctx.stroke();
        
        // 华丽剑格
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(-20, 15);
        ctx.lineTo(-15, 22);
        ctx.lineTo(15, 22);
        ctx.lineTo(20, 15);
        ctx.lineTo(15, 18);
        ctx.lineTo(-15, 18);
        ctx.closePath();
        ctx.fill();
        // 剑格宝石
        ctx.fillStyle = isRage ? '#ff0000' : '#0066ff';
        ctx.beginPath();
        ctx.arc(0, 18, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 剑柄
        ctx.fillStyle = '#4a2810';
        ctx.fillRect(-5, 22, 10, 25);
        // 剑柄缠绕
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-5, 26 + i * 6);
            ctx.lineTo(5, 29 + i * 6);
            ctx.stroke();
        }
        // 剑首
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 50, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.restore();
        
        // ===== 盾牌（左手）=====
        ctx.save();
        ctx.translate(this.x - 50, this.y);
        ctx.rotate(-0.3);
        // 盾牌主体
        const shieldGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 35);
        shieldGrad.addColorStop(0, '#c0c0c0');
        shieldGrad.addColorStop(0.5, '#808080');
        shieldGrad.addColorStop(1, '#404040');
        ctx.fillStyle = shieldGrad;
        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(25, -15);
        ctx.lineTo(25, 15);
        ctx.lineTo(0, 40);
        ctx.lineTo(-25, 15);
        ctx.lineTo(-25, -15);
        ctx.closePath();
        ctx.fill();
        // 盾牌边框
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();
        // 龙纹徽章
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isRage ? '#8b0000' : '#191970';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // ===== Phase 2 王者威压 =====
        if (isRage) {
            // 旋转剑气环
            for (let ring = 0; ring < 2; ring++) {
                ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 - ring * 0.2 + Math.sin(time * 6) * 0.2})`;
                ctx.lineWidth = 3 - ring;
                ctx.setLineDash([12, 6]);
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius + 30 + ring * 15, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.setLineDash([]);
            // 旋转剑影
            for (let i = 0; i < 6; i++) {
                const sa = (Math.PI * 2 / 6) * i + time * 1.5;
                const sx = this.x + Math.cos(sa) * (this.radius + 40);
                const sy = this.y + Math.sin(sa) * (this.radius + 40);
                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(sa + Math.PI / 2);
                ctx.fillStyle = `rgba(255, 215, 0, ${0.4 + Math.sin(time * 4 + i) * 0.2})`;
                ctx.beginPath();
                ctx.moveTo(0, -15);
                ctx.lineTo(4, 10);
                ctx.lineTo(-4, 10);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }

        if (this.state === 'TELEGRAPH') this.drawSkillIndicator(ctx);
    }

    drawSkillIndicator(ctx) {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        
        // 通用突进箭头绘制函数
        const drawDashArrow = (targetX, targetY, color) => {
            const dist = Math.sqrt((targetX - this.x) ** 2 + (targetY - this.y) ** 2);
            // 路径线
            ctx.strokeStyle = `rgba(${color}, 0.5)`;
            ctx.lineWidth = 8;
            ctx.setLineDash([15, 10]);
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(targetX, targetY);
            ctx.stroke();
            ctx.setLineDash([]);
            // 箭头
            ctx.fillStyle = `rgba(${color}, 0.7)`;
            ctx.save();
            ctx.translate(targetX, targetY);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(20, 0);
            ctx.lineTo(-15, -15);
            ctx.lineTo(-5, 0);
            ctx.lineTo(-15, 15);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            // 警告文字
            ctx.fillStyle = `rgba(${color}, 0.8)`;
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚔ 突进 ⚔', (this.x + targetX) / 2, (this.y + targetY) / 2 - 20);
        };
        
        switch (this.currentSkill) {
            // ===== 突进类技能 - 显示方向箭头 =====
            case 'DASH_STRIKE': case 'DIVINE_DASH':
                drawDashArrow(this.dashTarget.x, this.dashTarget.y, '255, 215, 0');
                break;
                
            case 'EXCALIBUR_THRUST':
                // 圣剑突刺 - 直线预警
                ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + Math.cos(angle - 0.1) * 400, this.y + Math.sin(angle - 0.1) * 400);
                ctx.lineTo(this.x + Math.cos(angle + 0.1) * 400, this.y + Math.sin(angle + 0.1) * 400);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⚔ Excalibur ⚔', this.x, this.y - this.radius - 30);
                break;
                
            case 'FLASH_STEP':
                // 闪步 - 玩家身后预警
                const behindX = this.player.x + Math.cos(angle) * 80;
                const behindY = this.player.y + Math.sin(angle) * 80;
                ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
                ctx.beginPath();
                ctx.arc(behindX, behindY, 50, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(behindX, behindY);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⚡ 闪现 ⚡', behindX, behindY - 60);
                break;
                
            case 'BLINK_ASSAULT':
                // 瞬闪连斩 - 多点预警
                this.drawAOEIndicator(ctx, this.player.x, this.player.y, 180, '255, 100, 100');
                ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⚡⚔ 瞬闪连斩 ⚔⚡', this.player.x, this.player.y - 100);
                break;
                
            // ===== 扇形/锥形技能 =====
            case 'SWIFT_SLASH':
                ctx.fillStyle = 'rgba(192, 192, 192, 0.4)';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.arc(this.x, this.y, 300, angle - 0.5, angle + 0.5);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('迅斩', this.x + Math.cos(angle) * 100, this.y + Math.sin(angle) * 100);
                break;
                
            case 'CROSS_SLASH':
                ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.arc(this.x, this.y, 300, angle - 0.5, angle + 0.5);
                ctx.closePath();
                ctx.fill();
                break;
                
            // ===== 范围技能 =====
            case 'BLADE_DANCE': case 'BLADE_STORM': case 'BLADE_BARRIER':
                this.drawAOEIndicator(ctx, this.x, this.y, 180, '192, 192, 192');
                ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⚔ 剑舞 ⚔', this.x, this.y - this.radius - 25);
                break;
                
            case 'SWORD_RAIN':
                this.drawAOEIndicator(ctx, this.player.x, this.player.y, 150, '192, 192, 192');
                ctx.fillStyle = 'rgba(200, 200, 200, 0.6)';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('剑雨', this.player.x, this.player.y - 80);
                break;
                
            case 'COUNTER_STANCE':
                this.drawAOEIndicator(ctx, this.x, this.y, 80, '255, 200, 100');
                ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⚔ 架势 ⚔', this.x, this.y - this.radius - 30);
                break;
                
            // ===== Phase 2 大招 =====
            case 'EXCALIBUR_JUDGMENT':
                this.drawAOEIndicator(ctx, this.player.x, this.player.y, 100, '255, 255, 0');
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⚔ 圣剑审判 ⚔', this.player.x, this.player.y - 120);
                // 光柱预警
                ctx.fillStyle = 'rgba(255, 255, 200, 0.2)';
                ctx.fillRect(this.player.x - 35, 0, 70, 800);
                break;
                
            case 'THOUSAND_CUTS':
                this.drawAOEIndicator(ctx, this.x, this.y, 250, '255, 215, 0');
                ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
                ctx.font = 'bold 22px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('千刃乱舞', this.x, this.y - this.radius - 30);
                break;
                
            case 'KINGS_WRATH':
                this.drawAOEIndicator(ctx, this.x, this.y, 300, '255, 100, 0');
                ctx.fillStyle = 'rgba(255, 50, 0, 0.8)';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⚔ 王者之怒 ⚔', this.x, this.y - this.radius - 35);
                break;
                
            case 'AVALON_SHIELD':
                this.drawAOEIndicator(ctx, this.x, this.y, 100, '100, 200, 255');
                ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('阿瓦隆', this.x, this.y - this.radius - 25);
                break;
                
            default:
                this.drawAOEIndicator(ctx, this.x, this.y, 120, '192, 192, 192');
                break;
        }
    }
}
