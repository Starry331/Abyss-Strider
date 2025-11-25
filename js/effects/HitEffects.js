/**
 * 打击特效系统 - 为武器攻击提供视觉反馈
 */

export class HitEffects {
    constructor() {
        this.effects = [];
        this.screenShake = { x: 0, y: 0, duration: 0, intensity: 0 };
    }
    
    update(dt) {
        // 更新所有特效
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.life -= dt;
            if (effect.update) effect.update(dt);
            if (effect.life <= 0) {
                this.effects.splice(i, 1);
            }
        }
        
        // 更新屏幕震动
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= dt;
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity * 2;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity * 2;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
        }
    }
    
    draw(ctx) {
        this.effects.forEach(effect => {
            if (effect.draw) effect.draw(ctx);
        });
    }
    
    // 触发屏幕震动
    shake(intensity = 5, duration = 0.1) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    }
    
    // 法杖击中特效 - 魔法爆炸
    spawnStaffHit(x, y, damage) {
        const isCrit = damage > 20;
        
        // 魔法冲击波
        this.effects.push({
            x, y,
            life: 0.4,
            maxLife: 0.4,
            radius: 0,
            maxRadius: isCrit ? 80 : 50,
            update(dt) {
                const progress = 1 - this.life / this.maxLife;
                this.radius = this.maxRadius * progress;
            },
            draw(ctx) {
                const alpha = this.life / this.maxLife;
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
                gradient.addColorStop(0, `rgba(147, 112, 219, ${alpha * 0.8})`);
                gradient.addColorStop(0.5, `rgba(138, 43, 226, ${alpha * 0.4})`);
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // 内部闪光
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // 魔法粒子
        for (let i = 0; i < (isCrit ? 12 : 6); i++) {
            const angle = (Math.PI * 2 / (isCrit ? 12 : 6)) * i;
            const speed = 80 + Math.random() * 60;
            this.effects.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5,
                size: 4 + Math.random() * 3,
                color: isCrit ? '#ffd700' : '#9370db',
                update(dt) {
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                },
                draw(ctx) {
                    const alpha = this.life / 0.5;
                    ctx.fillStyle = this.color;
                    ctx.globalAlpha = alpha;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = 1;
                }
            });
        }
        
        this.shake(isCrit ? 4 : 2, 0.08);
    }
    
    // 长剑击中特效 - 斩击火花
    spawnLongswordHit(x, y, angle, damage) {
        const isCrit = damage > 20;
        
        // 斩击弧光
        this.effects.push({
            x, y,
            angle,
            life: 0.25,
            maxLife: 0.25,
            length: isCrit ? 60 : 40,
            draw(ctx) {
                const alpha = this.life / this.maxLife;
                const spread = Math.PI / 4;
                
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                
                // 斩击弧线
                const gradient = ctx.createLinearGradient(-this.length, 0, this.length, 0);
                gradient.addColorStop(0, 'transparent');
                gradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`);
                gradient.addColorStop(1, 'transparent');
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = isCrit ? 8 : 5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(0, 0, this.length * 0.8, -spread, spread);
                ctx.stroke();
                
                ctx.restore();
            }
        });
        
        // 金属火花
        const sparkCount = isCrit ? 15 : 8;
        for (let i = 0; i < sparkCount; i++) {
            const sparkAngle = angle + (Math.random() - 0.5) * Math.PI * 0.8;
            const speed = 100 + Math.random() * 150;
            this.effects.push({
                x, y,
                vx: Math.cos(sparkAngle) * speed,
                vy: Math.sin(sparkAngle) * speed,
                life: 0.3 + Math.random() * 0.2,
                maxLife: 0.5,
                update(dt) {
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vy += 200 * dt; // 重力
                    this.vx *= 0.98;
                },
                draw(ctx) {
                    const alpha = this.life / this.maxLife;
                    const colors = isCrit ? ['#ffd700', '#ffaa00', '#ff6600'] : ['#ffffff', '#aaaaaa', '#ffdd88'];
                    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                    ctx.globalAlpha = alpha;
                    
                    // 拖尾
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x - this.vx * 0.02, this.y - this.vy * 0.02);
                    ctx.strokeStyle = ctx.fillStyle;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            });
        }
        
        // 冲击波纹
        this.effects.push({
            x, y,
            life: 0.2,
            radius: 0,
            draw(ctx) {
                const progress = 1 - this.life / 0.2;
                const r = 30 * progress;
                ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`;
                ctx.lineWidth = 3 * (1 - progress);
                ctx.beginPath();
                ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
        
        this.shake(isCrit ? 6 : 3, 0.1);
    }
    
    // 双刀击中特效 - 快速连击
    spawnDualBladesHit(x, y, angle, damage, comboCount = 1) {
        const isCrit = damage > 15;
        
        // X形斩痕
        this.effects.push({
            x, y,
            angle,
            life: 0.3,
            maxLife: 0.3,
            draw(ctx) {
                const alpha = this.life / this.maxLife;
                const size = isCrit ? 35 : 25;
                
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                
                ctx.strokeStyle = `rgba(255, 80, 80, ${alpha})`;
                ctx.lineWidth = isCrit ? 4 : 3;
                ctx.lineCap = 'round';
                
                // X斩
                ctx.beginPath();
                ctx.moveTo(-size, -size * 0.6);
                ctx.lineTo(size, size * 0.6);
                ctx.moveTo(-size, size * 0.6);
                ctx.lineTo(size, -size * 0.6);
                ctx.stroke();
                
                // 发光效果
                ctx.shadowColor = '#ff4444';
                ctx.shadowBlur = 15 * alpha;
                ctx.stroke();
                ctx.shadowBlur = 0;
                
                ctx.restore();
            }
        });
        
        // 血色粒子
        const particleCount = isCrit ? 10 : 5;
        for (let i = 0; i < particleCount; i++) {
            const pAngle = angle + (Math.random() - 0.5) * Math.PI;
            const speed = 60 + Math.random() * 100;
            this.effects.push({
                x, y,
                vx: Math.cos(pAngle) * speed,
                vy: Math.sin(pAngle) * speed,
                life: 0.25 + Math.random() * 0.15,
                size: 2 + Math.random() * 2,
                update(dt) {
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vx *= 0.92;
                    this.vy *= 0.92;
                },
                draw(ctx) {
                    const alpha = this.life / 0.4;
                    ctx.fillStyle = isCrit ? '#ff6666' : '#cc4444';
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            });
        }
        
        // 连击数字提示
        if (comboCount > 1) {
            this.effects.push({
                x, y: y - 20,
                life: 0.6,
                text: `${comboCount} HIT`,
                vy: -30,
                update(dt) {
                    this.y += this.vy * dt;
                    this.vy *= 0.95;
                },
                draw(ctx) {
                    const alpha = this.life / 0.6;
                    const scale = 1 + (1 - alpha) * 0.3;
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.scale(scale, scale);
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
                    ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
                    ctx.lineWidth = 3;
                    ctx.strokeText(this.text, 0, 0);
                    ctx.fillText(this.text, 0, 0);
                    ctx.restore();
                }
            });
        }
        
        this.shake(isCrit ? 3 : 1.5, 0.05);
    }
    
    // 敌人受击闪白
    spawnEnemyFlash(x, y, radius) {
        this.effects.push({
            x, y,
            radius: radius * 1.2,
            life: 0.1,
            draw(ctx) {
                const alpha = this.life / 0.1;
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    // 伤害数字
    spawnDamageNumber(x, y, damage, isCrit = false) {
        const offsetX = (Math.random() - 0.5) * 30;
        this.effects.push({
            x: x + offsetX,
            y: y - 10,
            vy: -60,
            life: 0.8,
            damage: Math.round(damage),
            isCrit,
            update(dt) {
                this.y += this.vy * dt;
                this.vy += 80 * dt;
            },
            draw(ctx) {
                const alpha = Math.min(1, this.life / 0.3);
                const scale = this.isCrit ? 1.4 : 1;
                const bounce = this.life > 0.6 ? 1 + Math.sin((0.8 - this.life) * 20) * 0.1 : 1;
                
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.scale(scale * bounce, scale * bounce);
                
                ctx.font = `bold ${this.isCrit ? 22 : 18}px Arial`;
                ctx.textAlign = 'center';
                
                // 描边
                ctx.strokeStyle = 'rgba(0, 0, 0, ' + alpha + ')';
                ctx.lineWidth = 4;
                ctx.strokeText(this.damage, 0, 0);
                
                // 填充
                ctx.fillStyle = this.isCrit ? `rgba(255, 215, 0, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
                ctx.fillText(this.damage, 0, 0);
                
                if (this.isCrit) {
                    ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
                    ctx.font = 'bold 12px Arial';
                    ctx.fillText('暴击!', 0, -20);
                }
                
                ctx.restore();
            }
        });
    }
}

// 全局实例
export const hitEffects = new HitEffects();
