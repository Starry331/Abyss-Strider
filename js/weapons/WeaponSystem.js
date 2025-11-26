import { WeaponUpgrades } from './WeaponUpgrades.js';
import { WeaponVisuals } from '../systems/WeaponVisuals.js';

export class WeaponSystem {
    constructor(combatSystem, audioManager = null) {
        this.combatSystem = combatSystem;
        this.audioManager = audioManager;
        this.weapons = [
            {
                name: 'Staff',
                cnName: '法杖',
                type: 'AOE',
                damage: 13,           // 基础伤害（构筑倍率基准）
                range: 160,
                cooldown: 1.0,        // 攻击间隔
                color: '#9b59b6',
                aoeRadius: 55,
                critChance: 0.2,      // 基础20%暴击率
                critMultiplier: 2.0,  // 基础2倍暴击伤害
                lifesteal: 0,
                manaSteal: 0,
                upgradeLevel: 1
            },
            {
                name: 'Longsword',
                cnName: '长剑',
                type: 'MELEE',
                damage: 16,           // 基础伤害（构筑倍率基准）
                range: 95,            // 基础范围（比双刀远）
                cooldown: 0.65,       // 攻击间隔（比双刀慢）
                color: '#ecf0f1',
                arc: Math.PI / 2,
                knockback: 50,
                cleave: true,
                critChance: 0.2,      // 基础20%暴击率
                critMultiplier: 2.0,  // 基础2倍暴击伤害
                lifesteal: 0,
                manaSteal: 0,
                upgradeLevel: 1
            },
            {
                name: 'Dual Blades',
                cnName: '双刀',
                type: 'MELEE',
                damage: 9,            // 基础伤害（构筑倍率基准）
                range: 58,            // 基础范围
                cooldown: 0.26,       // 攻击间隔
                color: '#e74c3c',
                arc: Math.PI / 2.5,
                critChance: 0.2,      // 基础20%暴击率
                critMultiplier: 2.0,  // 基础2倍暴击伤害
                lifesteal: 0,
                manaSteal: 0,
                upgradeLevel: 1
            }
        ];
        this.currentIndex = 1; // Start with Longsword
        this.cooldownTimer = 0;
    }

    get currentWeapon() {
        return this.weapons[this.currentIndex];
    }

    switchWeapon() {
        this.currentIndex = (this.currentIndex + 1) % this.weapons.length;
        this.updateUI();
        console.log(`Switched to: ${this.currentWeapon.cnName}`);
    }

    updateUI() {
        const nameEl = document.getElementById('weapon-name');
        const iconEl = document.getElementById('weapon-icon');
        if (nameEl) {
            // 优先显示进化名称
            const evoName = WeaponVisuals.getEvolutionDisplayName(this.currentWeapon);
            const upgrade = WeaponUpgrades.getUpgradeForWeapon(this.currentWeapon.name, this.currentWeapon.upgradeLevel);
            nameEl.innerText = this.currentWeapon.evolutionName || (upgrade ? upgrade.name : this.currentWeapon.cnName);
            
            // 根据进化等级改变名称颜色
            const evoLevel = this.currentWeapon.evolutionLevel || 0;
            const colors = ['#ffffff', '#4488ff', '#aa44ff', '#ff4444', '#ffd700'];
            nameEl.style.color = colors[Math.min(evoLevel, colors.length - 1)];
        }
        const icons = ['🪄', '🗡️', '⚔️'];
        if (iconEl) iconEl.innerText = icons[this.currentIndex];
    }
    
    // 绘制武器进化特效
    drawWeaponEffects(ctx, player, time) {
        WeaponVisuals.drawWeaponEffect(ctx, this.currentWeapon, player.x, player.y, time);
    }

    update(deltaTime, player, input, isDisabled) {
        if (this.cooldownTimer > 0) this.cooldownTimer -= deltaTime;
        if (isDisabled) return;
        if (this.cooldownTimer <= 0) {
            this.attack(player);
            // 使用升级的冷却倍率
            const upgrade = WeaponUpgrades.getUpgradeForWeapon(this.currentWeapon.name, this.currentWeapon.upgradeLevel);
            const cooldownMult = upgrade?.cooldownMult || 1.0;
            this.cooldownTimer = this.currentWeapon.cooldown * cooldownMult;
        }
    }

    attack(player) {
        const weapon = this.currentWeapon;
        const baseAngle = Math.atan2(player.facing.y, player.facing.x);

        if (weapon.type === 'AOE') {
            // 法杖施法音效
            if (this.audioManager) this.audioManager.playSound('staff_cast');
            this.attackStaff(player, weapon, baseAngle);
        } else if (weapon.type === 'MELEE') {
            if (weapon.name === 'Longsword') {
                // 长剑挥砍音效
                if (this.audioManager) this.audioManager.playSound('sword_swing');
                this.attackLongsword(player, weapon, baseAngle);
            } else if (weapon.name === 'Dual Blades') {
                // 双刀攻击音效
                if (this.audioManager) this.audioManager.playSound('dual_blades');
                this.attackDualBlades(player, weapon, baseAngle);
            }
        }
    }

    attackStaff(player, weapon, baseAngle) {
        const upgrade = WeaponUpgrades.getUpgradeForWeapon('Staff', weapon.upgradeLevel);
        
        // Meteor shower implementation - spawn falling meteors instead of normal projectiles
        if (weapon.meteorShower) {
            const meteorCount = weapon.meteorCount || 5;
            
            for (let i = 0; i < meteorCount; i++) {
                setTimeout(() => {
                    // Spawn meteors from above in random positions around player
                    const meteorX = player.x + (Math.random() - 0.5) * 300;
                    const meteorY = player.y - 200 - Math.random() * 100; // Above player
                    
                    const combatSystem = this.combatSystem;
                    
                    this.combatSystem.spawnProjectile({
                        x: meteorX,
                        y: meteorY,
                        vx: 0,
                        vy: 200, // Falling velocity
                        radius: 15,
                        color: '#8b4513',
                        damage: upgrade.damage * 1.5,
                        owner: 'player',
                        life: 2,
                        trail: [],
                        update(dt) {
                            this.y += this.vy * dt;
                            this.vy += 100 * dt; // Gravity acceleration
                            this.life -= dt;
                            
                            // Create meteor trail
                            if (this.life > 0.1) {
                                this.trail.push({
                                    x: this.x,
                                    y: this.y,
                                    life: 0.3
                                });
                            }
                            
                            this.trail.forEach(t => t.life -= dt);
                            this.trail = this.trail.filter(t => t.life > 0);
                            
                            if (this.life <= 0) this.markedForDeletion = true;
                        },
                        draw(ctx) {
                            // Meteor trail
                            this.trail.forEach((pos, i) => {
                                const alpha = pos.life / 0.3;
                                ctx.fillStyle = `rgba(255, 140, 0, ${alpha * 0.6})`;
                                ctx.beginPath();
                                ctx.arc(pos.x, pos.y, 8 * alpha, 0, Math.PI * 2);
                                ctx.fill();
                            });
                            
                            // Meteor body with gradient
                            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
                            gradient.addColorStop(0, '#ff6347');
                            gradient.addColorStop(0.5, '#8b4513');
                            gradient.addColorStop(1, '#654321');
                            
                            ctx.fillStyle = gradient;
                            ctx.shadowColor = '#ff4500';
                            ctx.shadowBlur = 20;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.shadowBlur = 0;
                        },
                        onImpact() {
                            // Create AOE explosion on impact
                            combatSystem.spawnProjectile({
                                x: this.x,
                                y: this.y,
                                radius: upgrade.aoeRadius * 1.5,
                                damage: this.damage * 0.5,
                                owner: 'player',
                                life: 0.3,
                                update(dt) {
                                    this.life -= dt;
                                    if (this.life <= 0) this.markedForDeletion = true;
                                },
                                draw(ctx) {
                                    const alpha = this.life / 0.3;
                                    ctx.fillStyle = `rgba(255, 140, 0, ${alpha * 0.4})`;
                                    ctx.strokeStyle = `rgba(255, 69, 0, ${alpha})`;
                                    ctx.lineWidth = 3;
                                    ctx.beginPath();
                                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                                    ctx.fill();
                                    ctx.stroke();
                                }
                            });
                        }
                    });
                }, i * 200);
            }
            return;
        }
        
        // Normal staff attack - 从上方砸下的法球
        const count = upgrade.projectileCount;
        
        // Lv1-3使用更快的弹幕速度
        const projectileSpeed = weapon.upgradeLevel <= 3 ? 550 : 400;
        
        // 计算最终伤害
        const baseDamage = upgrade.damage;
        const weaponDamageMult = weapon.damage / 13;
        const playerDamageMult = player.damageMultiplier || 1;
        const finalDamage = Math.round(baseDamage * weaponDamageMult * playerDamageMult);
        const combatSystem = this.combatSystem;

        // 生成目标位置（玩家面朝方向）
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                // 计算目标落点
                let targetX, targetY;
                if (count === 1) {
                    targetX = player.x + Math.cos(baseAngle) * weapon.range;
                    targetY = player.y + Math.sin(baseAngle) * weapon.range;
                } else if (count >= 5) {
                    // 星形散布
                    const starAngle = baseAngle + (Math.PI * 2 / count) * i;
                    targetX = player.x + Math.cos(starAngle) * weapon.range;
                    targetY = player.y + Math.sin(starAngle) * weapon.range;
                } else {
                    // 扇形散布
                    const spread = (i - (count - 1) / 2) * 0.3;
                    targetX = player.x + Math.cos(baseAngle + spread) * weapon.range;
                    targetY = player.y + Math.sin(baseAngle + spread) * weapon.range;
                }
                
                // 从上方生成法球
                const startX = targetX + (Math.random() - 0.5) * 30;
                const startY = targetY - 180 - Math.random() * 40;
                
                this.combatSystem.spawnProjectile({
                    x: startX,
                    y: startY,
                    targetX: targetX,
                    targetY: targetY,
                    vx: 0,
                    vy: projectileSpeed,
                    radius: 10,
                    color: '#9b59b6',
                    damage: finalDamage,
                    owner: 'player',
                    weaponType: 'Staff',
                    player: player,
                    critChance: weapon.critChance || 0.2,
                    critMultiplier: weapon.critMultiplier || 2,
                    lifesteal: weapon.lifesteal || 0,
                    manaSteal: weapon.manaSteal || 0,
                    aoeRadius: upgrade.aoeRadius * (weapon.range / 160), // 范围也受影响
                    pierce: upgrade.pierce,
                    chainLightning: upgrade.chainLightning,
                    life: 2.0,
                    trail: [],
                    hasExploded: false,
                    fallProgress: 0,
                    update(dt) {
                        // 从上方砸下的运动
                        this.fallProgress += dt * 3;
                        
                        // 计算当前位置 - 抛物线下落
                        const progress = Math.min(this.fallProgress, 1);
                        const easeProgress = 1 - Math.pow(1 - progress, 2); // ease-out
                        
                        this.y += this.vy * dt * (0.5 + progress * 0.5);
                        
                        // 检查是否到达目标
                        if (this.y >= this.targetY) {
                            // 到达目标，创建AOE爆炸
                            if (!this.hasExploded && this.aoeRadius > 0) {
                                this.createAOEExplosion(combatSystem);
                                this.hasExploded = true;
                            }
                            this.markedForDeletion = true;
                        }
                        
                        this.life -= dt;
                        if (this.life <= 0) {
                            this.markedForDeletion = true;
                        }

                        // 轨迹效果
                        this.trail.push({ x: this.x, y: this.y, life: 0.25 });
                        this.trail.forEach(p => p.life -= dt);
                        this.trail = this.trail.filter(p => p.life > 0);
                    },
                    createAOEExplosion(combatSystem) {
                        // Spawn AOE explosion projectile
                        combatSystem.spawnProjectile({
                            x: this.x,
                            y: this.y,
                            vx: 0,
                            vy: 0,
                            radius: this.aoeRadius,
                            color: '#e056fd',
                            damage: this.damage * 0.5, // AOE deals 50% of projectile damage
                            owner: 'player',
                            life: 0.5,
                            maxLife: 0.5,
                            isAOE: true,
                            update(dt) {
                                this.life -= dt;
                                if (this.life <= 0) this.markedForDeletion = true;
                            },
                            draw(ctx) {
                                const alpha = this.life / this.maxLife;
                                const time = Date.now() / 1000;
                                const pulseScale = 1 + (1 - alpha) * 0.6;
                                
                                // 外层能量波纹
                                ctx.shadowColor = '#e056fd';
                                ctx.shadowBlur = 30;
                                for (let ring = 0; ring < 3; ring++) {
                                    const ringScale = pulseScale + ring * 0.15;
                                    const ringAlpha = alpha * (1 - ring * 0.3);
                                    ctx.strokeStyle = `rgba(224, 86, 253, ${ringAlpha * 0.6})`;
                                    ctx.lineWidth = 4 - ring;
                                    ctx.beginPath();
                                    ctx.arc(this.x, this.y, this.radius * ringScale, 0, Math.PI * 2);
                                    ctx.stroke();
                                }
                                
                                // 内层渐变填充
                                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * pulseScale);
                                gradient.addColorStop(0, `rgba(255, 200, 255, ${alpha * 0.8})`);
                                gradient.addColorStop(0.3, `rgba(224, 86, 253, ${alpha * 0.5})`);
                                gradient.addColorStop(0.7, `rgba(138, 43, 226, ${alpha * 0.3})`);
                                gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
                                ctx.fillStyle = gradient;
                                ctx.beginPath();
                                ctx.arc(this.x, this.y, this.radius * pulseScale, 0, Math.PI * 2);
                                ctx.fill();
                                
                                // 魔法符文圆环
                                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
                                ctx.lineWidth = 2;
                                const runeRadius = this.radius * 0.6;
                                for (let i = 0; i < 6; i++) {
                                    const runeAngle = (Math.PI * 2 / 6) * i + time * 2;
                                    const rx = this.x + Math.cos(runeAngle) * runeRadius;
                                    const ry = this.y + Math.sin(runeAngle) * runeRadius;
                                    
                                    // 符文形状
                                    ctx.beginPath();
                                    ctx.moveTo(rx, ry - 8 * alpha);
                                    ctx.lineTo(rx + 6 * alpha, ry);
                                    ctx.lineTo(rx, ry + 8 * alpha);
                                    ctx.lineTo(rx - 6 * alpha, ry);
                                    ctx.closePath();
                                    ctx.stroke();
                                }
                                
                                // 能量粒子爆发
                                for (let i = 0; i < 16; i++) {
                                    const particleAngle = (Math.PI * 2 / 16) * i + time * 3;
                                    const particleDist = (1 - alpha) * this.radius * 1.2;
                                    const px = this.x + Math.cos(particleAngle) * particleDist;
                                    const py = this.y + Math.sin(particleAngle) * particleDist;
                                    
                                    const particleGrad = ctx.createRadialGradient(px, py, 0, px, py, 5);
                                    particleGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                                    particleGrad.addColorStop(1, `rgba(224, 86, 253, 0)`);
                                    ctx.fillStyle = particleGrad;
                                    ctx.beginPath();
                                    ctx.arc(px, py, 5 * alpha, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                                
                                // 中心闪光
                                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
                                ctx.beginPath();
                                ctx.arc(this.x, this.y, 8 * alpha, 0, Math.PI * 2);
                                ctx.fill();
                                
                                ctx.shadowBlur = 0;
                            }
                        });
                    },
                    draw(ctx) {
                        // 从上方砸下的法球特效
                        const time = Date.now() / 1000;
                        const pulseAlpha = 0.8 + Math.sin(time * 15) * 0.2;
                        
                        // 绘制下落轨迹（向上的拖尾）
                        this.trail.forEach((pos, idx) => {
                            const alpha = pos.life / 0.25;
                            const trailSize = this.radius * alpha * 0.6;
                            
                            // 紫色拖尾
                            ctx.fillStyle = `rgba(138, 43, 226, ${alpha * 0.5})`;
                            ctx.beginPath();
                            ctx.arc(pos.x, pos.y, trailSize * 1.2, 0, Math.PI * 2);
                            ctx.fill();
                            
                            ctx.fillStyle = `rgba(186, 85, 211, ${alpha * 0.7})`;
                            ctx.beginPath();
                            ctx.arc(pos.x, pos.y, trailSize * 0.8, 0, Math.PI * 2);
                            ctx.fill();
                        });
                        
                        // 目标落点预警圈
                        const warningAlpha = 0.3 + Math.sin(time * 8) * 0.15;
                        ctx.strokeStyle = `rgba(255, 100, 100, ${warningAlpha})`;
                        ctx.lineWidth = 2;
                        ctx.setLineDash([5, 5]);
                        ctx.beginPath();
                        ctx.arc(this.targetX, this.targetY, this.aoeRadius || 30, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        
                        // 法球主体 - 发光紫色球体
                        ctx.shadowBlur = 20;
                        ctx.shadowColor = '#9b59b6';
                        
                        // 外层光晕
                        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
                        gradient.addColorStop(0, `rgba(255, 255, 255, ${pulseAlpha})`);
                        gradient.addColorStop(0.3, `rgba(186, 85, 211, ${pulseAlpha * 0.8})`);
                        gradient.addColorStop(0.6, `rgba(138, 43, 226, ${pulseAlpha * 0.5})`);
                        gradient.addColorStop(1, 'rgba(75, 0, 130, 0)');
                        
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // 法球核心
                        ctx.fillStyle = '#e0b0ff';
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // 白色高光
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // 能量粒子环绕
                        for (let p = 0; p < 4; p++) {
                            const particleAngle = (Math.PI * 2 / 4) * p + time * 4;
                            const particleDist = this.radius * 1.3;
                            const px = this.x + Math.cos(particleAngle) * particleDist;
                            const py = this.y + Math.sin(particleAngle) * particleDist;
                            
                            ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha * 0.8})`;
                            ctx.beginPath();
                            ctx.arc(px, py, 2, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        
                        ctx.shadowBlur = 0;

                        // 连锁闪电效果
                        if (this.chainLightning) {
                            ctx.strokeStyle = '#ffff00';
                            ctx.lineWidth = 2;
                            ctx.shadowColor = '#ffff00';
                            ctx.shadowBlur = 5;
                            for (let j = 0; j < 3; j++) {
                                const angle = Math.random() * Math.PI * 2;
                                const dist = 15;
                                ctx.beginPath();
                                ctx.moveTo(this.x, this.y);
                                ctx.lineTo(this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist);
                                ctx.stroke();
                            }
                            ctx.shadowBlur = 0;
                        }
                    }
                });
            }, i * 60); // Slight delay between projectiles
        }
    }

    attackLongsword(player, weapon, baseAngle) {
        const upgrade = WeaponUpgrades.getUpgradeForWeapon('Longsword', weapon.upgradeLevel);

        // 计算最终伤害和范围
        const baseDamage = upgrade.damage;
        const weaponDamageMult = weapon.damage / 16; // 16是长剑基础伤害
        const playerDamageMult = player.damageMultiplier || 1;
        const finalDamage = Math.round(baseDamage * weaponDamageMult * playerDamageMult);
        const finalRange = upgrade.range * (weapon.range / 80); // 80是长剑基础范围

        for (let i = 0; i < upgrade.slashCount; i++) {
            setTimeout(() => {
                // Enhanced longsword slash with heavy impact effects
                this.combatSystem.spawnProjectile({
                    x: player.x,
                    y: player.y,
                    radius: finalRange,
                    damage: finalDamage,
                    owner: 'player',
                    weaponType: 'Longsword',
                    player: player,
                    critChance: weapon.critChance || 0.2,
                    critMultiplier: weapon.critMultiplier || 2,
                    lifesteal: weapon.lifesteal || 0,
                    manaSteal: weapon.manaSteal || 0,
                    knockback: weapon.knockback || 0,
                    angle: baseAngle,
                    arc: upgrade.arc,
                    life: 0.25,
                    shockwave: upgrade.shockwave,
                    swordGlow: [],
                    impactSparks: [],
                    update(dt) {
                        this.life -= dt;
                        if (this.life <= 0) this.markedForDeletion = true;
                        
                        // Create sword glow trail
                        if (this.life > 0.15) {
                            for (let j = 0; j < 2; j++) {
                                const glowAngle = this.angle + (Math.random() - 0.5) * this.arc;
                                const glowDist = this.radius * (0.3 + Math.random() * 0.7);
                                this.swordGlow.push({
                                    x: this.x + Math.cos(glowAngle) * glowDist,
                                    y: this.y + Math.sin(glowAngle) * glowDist,
                                    life: 0.2,
                                    size: 4 + Math.random() * 6
                                });
                            }
                        }
                        
                        // Create impact sparks at the end of the slash
                        if (this.life < 0.15 && this.impactSparks.length === 0) {
                            for (let j = 0; j < 8; j++) {
                                const sparkAngle = this.angle + (Math.random() - 0.5) * this.arc;
                                this.impactSparks.push({
                                    x: this.x + Math.cos(sparkAngle) * this.radius,
                                    y: this.y + Math.sin(sparkAngle) * this.radius,
                                    vx: Math.cos(sparkAngle) * (50 + Math.random() * 100),
                                    vy: Math.sin(sparkAngle) * (50 + Math.random() * 100),
                                    life: 0.3,
                                    size: 2 + Math.random() * 3
                                });
                            }
                        }
                        
                        // Update effects
                        this.swordGlow.forEach(g => g.life -= dt);
                        this.swordGlow = this.swordGlow.filter(g => g.life > 0);
                        
                        this.impactSparks.forEach(s => {
                            s.x += s.vx * dt;
                            s.y += s.vy * dt;
                            s.vx *= 0.9;
                            s.vy *= 0.9;
                            s.life -= dt;
                        });
                        this.impactSparks = this.impactSparks.filter(s => s.life > 0);
                    },
                    draw(ctx) {
                        const alpha = this.life / 0.25;
                        
                        // Draw sword glow trail
                        this.swordGlow.forEach(g => {
                            const glowAlpha = g.life / 0.2;
                            ctx.fillStyle = `rgba(255, 215, 0, ${glowAlpha * 0.4})`;
                            ctx.shadowColor = '#ffd700';
                            ctx.shadowBlur = 15;
                            ctx.beginPath();
                            ctx.arc(g.x, g.y, g.size * glowAlpha, 0, Math.PI * 2);
                            ctx.fill();
                        });
                        
                        // Draw impact sparks
                        this.impactSparks.forEach(s => {
                            const sparkAlpha = s.life / 0.3;
                            ctx.fillStyle = `rgba(255, 255, 255, ${sparkAlpha})`;
                            ctx.shadowColor = '#ffffff';
                            ctx.shadowBlur = 8;
                            ctx.beginPath();
                            ctx.arc(s.x, s.y, s.size * sparkAlpha, 0, Math.PI * 2);
                            ctx.fill();
                        });

                        // Heavy outer golden glow with pulsing
                        const pulseScale = 1 + Math.sin(Date.now() / 80) * 0.15;
                        ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.6})`;
                        ctx.lineWidth = 18 * pulseScale;
                        ctx.shadowColor = '#ffd700';
                        ctx.shadowBlur = 30;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, this.angle - this.arc / 2, this.angle + this.arc / 2);
                        ctx.stroke();

                        // Main heavy slash with gradient effect
                        const gradient = ctx.createLinearGradient(
                            this.x - Math.cos(this.angle) * this.radius,
                            this.y - Math.sin(this.angle) * this.radius,
                            this.x + Math.cos(this.angle) * this.radius,
                            this.y + Math.sin(this.angle) * this.radius
                        );
                        gradient.addColorStop(0, `rgba(236, 240, 241, ${alpha * 0.7})`);
                        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`);
                        gradient.addColorStop(1, `rgba(236, 240, 241, ${alpha * 0.7})`);
                        
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = 12;
                        ctx.shadowColor = '#ecf0f1';
                        ctx.shadowBlur = 15;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, this.angle - this.arc / 2, this.angle + this.arc / 2);
                        ctx.stroke();

                        // Secondary energy edge
                        ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.8})`;
                        ctx.lineWidth = 6;
                        ctx.shadowColor = '#ffd700';
                        ctx.shadowBlur = 10;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius - 3, this.angle - this.arc / 2 + 0.02, this.angle + this.arc / 2 - 0.02);
                        ctx.stroke();

                        // Sharp cutting edge
                        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                        ctx.lineWidth = 3;
                        ctx.shadowColor = '#ffffff';
                        ctx.shadowBlur = 8;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius - 6, this.angle - this.arc / 2 + 0.04, this.angle + this.arc / 2 - 0.04);
                        ctx.stroke();
                        
                        // Heavy impact indicator at slash end
                        if (this.life > 0.1) {
                            const impactX = this.x + Math.cos(this.angle) * this.radius;
                            const impactY = this.y + Math.sin(this.angle) * this.radius;
                            
                            // Impact ring
                            ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.9})`;
                            ctx.lineWidth = 4;
                            ctx.beginPath();
                            ctx.arc(impactX, impactY, 15 * (1 + (1 - this.life / 0.25) * 0.5), 0, Math.PI * 2);
                            ctx.stroke();
                            
                            // Impact core
                            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                            ctx.beginPath();
                            ctx.arc(impactX, impactY, 6, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        
                        ctx.shadowBlur = 0;
                    },
                });
            }, i * 120);
        }
    }

    attackDualBlades(player, weapon, baseAngle) {
        const upgrade = WeaponUpgrades.getUpgradeForWeapon('Dual Blades', weapon.upgradeLevel);

        // 计算最终伤害和范围
        const baseDamage = upgrade.damage;
        const weaponDamageMult = weapon.damage / 9; // 9是双刀基础伤害
        const playerDamageMult = player.damageMultiplier || 1;
        const finalDamage = Math.round(baseDamage * weaponDamageMult * playerDamageMult);
        const finalRange = upgrade.range * (weapon.range / 58); // 58是双刀基础范围

        if (upgrade.slashCount <= 2) {
            // Normal slashes with enhanced visual trails
            for (let i = 0; i < upgrade.slashCount; i++) {
                setTimeout(() => {
                    // Main slash
                    this.combatSystem.spawnProjectile({
                        x: player.x,
                        y: player.y,
                        radius: finalRange,
                        damage: finalDamage,
                        owner: 'player',
                        weaponType: 'Dual Blades',
                        player: player,
                        critChance: weapon.critChance || 0.2,
                        critMultiplier: weapon.critMultiplier || 2,
                        lifesteal: weapon.lifesteal || 0,
                        manaSteal: weapon.manaSteal || 0,
                        angle: baseAngle + (i === 1 ? 0.3 : -0.3),
                        arc: weapon.arc,
                        life: 0.15,
                        particles: [],
                        bladeTrail: [],
                        update(dt) {
                            this.life -= dt;
                            if (this.life <= 0) this.markedForDeletion = true;
                            
                            // Create blade trail particles
                            if (this.life > 0.05) {
                                for (let j = 0; j < 3; j++) {
                                    const trailAngle = this.angle + (Math.random() - 0.5) * this.arc;
                                    const trailDist = this.radius * (0.5 + Math.random() * 0.5);
                                    this.bladeTrail.push({
                                        x: this.x + Math.cos(trailAngle) * trailDist,
                                        y: this.y + Math.sin(trailAngle) * trailDist,
                                        life: 0.1,
                                        size: 2 + Math.random() * 3
                                    });
                                }
                            }
                            
                            // Update trail particles
                            this.bladeTrail.forEach(p => p.life -= dt);
                            this.bladeTrail = this.bladeTrail.filter(p => p.life > 0);
                        },
                        draw(ctx) {
                            const alpha = this.life / 0.15;
                            
                            // Draw blade trail particles
                            this.bladeTrail.forEach(p => {
                                const particleAlpha = p.life / 0.1;
                                ctx.fillStyle = `rgba(255, 99, 71, ${particleAlpha * 0.6})`;
                                ctx.shadowColor = '#ff6347';
                                ctx.shadowBlur = 8;
                                ctx.beginPath();
                                ctx.arc(p.x, p.y, p.size * particleAlpha, 0, Math.PI * 2);
                                ctx.fill();
                            });
                            
                            // Outer energy glow with pulsing effect
                            const pulseScale = 1 + Math.sin(Date.now() / 100) * 0.1;
                            ctx.strokeStyle = `rgba(255, 99, 71, ${alpha * 0.7})`;
                            ctx.lineWidth = 14 * pulseScale;
                            ctx.shadowColor = '#ff6347';
                            ctx.shadowBlur = 25;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius, this.angle - this.arc / 2, this.angle + this.arc / 2);
                            ctx.stroke();

                            // Main dual blade slashes
                            ctx.strokeStyle = `rgba(231, 76, 60, ${alpha})`;
                            ctx.lineWidth = 8;
                            ctx.shadowColor = '#e74c3c';
                            ctx.shadowBlur = 12;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius, this.angle - this.arc / 2, this.angle + this.arc / 2);
                            ctx.stroke();
                            
                            // Secondary blade offset
                            ctx.strokeStyle = `rgba(192, 57, 43, ${alpha * 0.8})`;
                            ctx.lineWidth = 6;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius - 5, this.angle - this.arc / 2 + 0.1, this.angle + this.arc / 2 - 0.1);
                            ctx.stroke();

                            // Inner energy core
                            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
                            ctx.lineWidth = 3;
                            ctx.shadowColor = '#ffffff';
                            ctx.shadowBlur = 6;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius - 8, this.angle - this.arc / 2 + 0.05, this.angle + this.arc / 2 - 0.05);
                            ctx.stroke();
                            
                            // Impact spark effects at slash endpoints
                            if (this.life > 0.1) {
                                for (let j = 0; j < 2; j++) {
                                    const sparkAngle = this.angle + (j === 0 ? -this.arc/2 : this.arc/2);
                                    const sparkX = this.x + Math.cos(sparkAngle) * this.radius;
                                    const sparkY = this.y + Math.sin(sparkAngle) * this.radius;
                                    
                                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                                    ctx.shadowColor = '#ffffff';
                                    ctx.shadowBlur = 10;
                                    ctx.beginPath();
                                    ctx.arc(sparkX, sparkY, 4, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                            }
                            
                            ctx.shadowBlur = 0;
                        }
                    });
                }, i * 80);
            }
        } else if (upgrade.slashCount === 3) {
            // 三连斩 - 快速三次攻击
            const slashAngles = [baseAngle - 0.4, baseAngle, baseAngle + 0.4];
            slashAngles.forEach((angle, i) => {
                setTimeout(() => {
                    this.combatSystem.spawnProjectile({
                        x: player.x,
                        y: player.y,
                        radius: finalRange,
                        damage: finalDamage,
                        owner: 'player',
                        weaponType: 'Dual Blades',
                        player: player,
                        critChance: weapon.critChance || 0.2,
                        critMultiplier: weapon.critMultiplier || 2,
                        lifesteal: weapon.lifesteal || 0,
                        manaSteal: weapon.manaSteal || 0,
                        angle: angle,
                        arc: Math.PI / 2.5,
                        life: 0.12,
                        update(dt) {
                            this.life -= dt;
                            if (this.life <= 0) this.markedForDeletion = true;
                        },
                        draw(ctx) {
                            const alpha = this.life / 0.12;
                            ctx.strokeStyle = `rgba(231, 76, 60, ${alpha})`;
                            ctx.lineWidth = 5;
                            ctx.shadowColor = '#e74c3c';
                            ctx.shadowBlur = 8;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius, this.angle - this.arc / 2, this.angle + this.arc / 2);
                            ctx.stroke();
                            ctx.shadowBlur = 0;
                        }
                    });
                }, i * 50);
            });
        } else if (upgrade.slashCount >= 4) {
            // 四斩 - 十字形快速连击
            const crossAngles = [baseAngle, baseAngle + Math.PI / 2, baseAngle + Math.PI, baseAngle + Math.PI * 1.5];
            crossAngles.forEach((angle, i) => {
                setTimeout(() => {
                    this.combatSystem.spawnProjectile({
                        x: player.x,
                        y: player.y,
                        radius: finalRange,
                        damage: finalDamage,
                        owner: 'player',
                        weaponType: 'Dual Blades',
                        player: player,
                        critChance: weapon.critChance || 0.2,
                        critMultiplier: weapon.critMultiplier || 2,
                        lifesteal: weapon.lifesteal || 0,
                        manaSteal: weapon.manaSteal || 0,
                        angle: angle,
                        arc: Math.PI / 2.8,
                        life: 0.12,
                        update(dt) {
                            this.life -= dt;
                            if (this.life <= 0) this.markedForDeletion = true;
                        },
                        draw(ctx) {
                            const alpha = this.life / 0.12;
                            ctx.strokeStyle = `rgba(231, 76, 60, ${alpha})`;
                            ctx.lineWidth = 6;
                            ctx.shadowColor = '#e74c3c';
                            ctx.shadowBlur = 10;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius, this.angle - this.arc / 2, this.angle + this.arc / 2);
                            ctx.stroke();
                            ctx.shadowBlur = 0;
                        }
                    });
                }, i * 45);
            });
        }
    }

    upgradeAllWeapons() {
        this.weapons.forEach(w => {
            w.upgradeLevel = Math.min(w.upgradeLevel + 1, 6);
        });
        this.updateUI();
        console.log('All weapons upgraded to level', this.weapons[0].upgradeLevel);
    }

    draw(ctx, player) {
        if (!this.currentWeapon) return;
        ctx.save();
        ctx.translate(player.x, player.y);
        const angle = Math.atan2(player.facing.y, player.facing.x);
        ctx.rotate(angle);
        const weapon = this.currentWeapon;
        const offsetX = player.radius + 10;
        switch (weapon.name) {
            case 'Staff':
                this.drawStaff(ctx, offsetX, weapon);
                break;
            case 'Longsword':
                this.drawLongsword(ctx, offsetX, weapon);
                break;
            case 'Dual Blades':
                this.drawDualBlades(ctx, offsetX, weapon);
                break;
        }
        ctx.restore();
    }

    drawStaff(ctx, offsetX, weapon) {
        const length = 45;
        const orbSize = 8;
        const time = Date.now() / 1000;

        // Staff shaft with gradient
        const gradient = ctx.createLinearGradient(offsetX, -2, offsetX + length - orbSize, 2);
        gradient.addColorStop(0, '#8b4513');
        gradient.addColorStop(1, '#654321');
        ctx.fillStyle = gradient;
        ctx.fillRect(offsetX, -2, length - orbSize, 4);

        // Decorative bands
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(offsetX + 10, -3, 2, 6);
        ctx.fillRect(offsetX + 25, -3, 2, 6);

        // Magical orb at tip
        const orbX = offsetX + length;
        const pulseSize = orbSize + Math.sin(time * 4) * 2;

        // Outer glow
        const orbGlow = ctx.createRadialGradient(orbX, 0, 0, orbX, 0, pulseSize * 2);
        orbGlow.addColorStop(0, 'rgba(138, 43, 226, 0.6)');
        orbGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
        ctx.fillStyle = orbGlow;
        ctx.beginPath();
        ctx.arc(orbX, 0, pulseSize * 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner orb
        const orbGrad = ctx.createRadialGradient(orbX - 2, -2, 0, orbX, 0, pulseSize);
        orbGrad.addColorStop(0, '#fff');
        orbGrad.addColorStop(0.3, '#e0b0ff');
        orbGrad.addColorStop(1, '#8a2be2');
        ctx.fillStyle = orbGrad;
        ctx.shadowColor = '#8a2be2';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(orbX, 0, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Magical particles
        for (let i = 0; i < 3; i++) {
            const particleAngle = time * 2 + (Math.PI * 2 / 3) * i;
            const px = orbX + Math.cos(particleAngle) * 12;
            const py = Math.sin(particleAngle) * 12;
            ctx.fillStyle = 'rgba(138, 43, 226, 0.5)';
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawLongsword(ctx, offsetX, weapon) {
        const bladeLength = 40;
        const bladeWidth = 6;

        // Blade with metallic gradient
        const bladeGrad = ctx.createLinearGradient(offsetX, -bladeWidth / 2, offsetX, bladeWidth / 2);
        bladeGrad.addColorStop(0, '#c0c0c0');
        bladeGrad.addColorStop(0.5, '#ffffff');
        bladeGrad.addColorStop(1, '#a8a8a8');
        ctx.fillStyle = bladeGrad;

        // Main blade
        ctx.beginPath();
        ctx.moveTo(offsetX, 0);
        ctx.lineTo(offsetX + bladeLength, -bladeWidth / 2);
        ctx.lineTo(offsetX + bladeLength + 8, 0);
        ctx.lineTo(offsetX + bladeLength, bladeWidth / 2);
        ctx.closePath();
        ctx.fill();

        // Blade shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(offsetX + 5, -1, bladeLength - 5, 2);

        // Edge highlight
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(offsetX, 0);
        ctx.lineTo(offsetX + bladeLength + 8, 0);
        ctx.stroke();

        // Crossguard
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(offsetX - 2, -8, 4, 16);

        // Crossguard ornament
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(offsetX, -8, 3, 0, Math.PI * 2);
        ctx.arc(offsetX, 8, 3, 0, Math.PI * 2);
        ctx.fill();

        // Handle
        const handleGrad = ctx.createLinearGradient(offsetX - 15, -3, offsetX - 15, 3);
        handleGrad.addColorStop(0, '#654321');
        handleGrad.addColorStop(0.5, '#8b4513');
        handleGrad.addColorStop(1, '#654321');
        ctx.fillStyle = handleGrad;
        ctx.fillRect(offsetX - 15, -3, 13, 6);

        // Pommel
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(offsetX - 15, 0, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawDualBlades(ctx, offsetX, weapon) {
        const bladeLength = 30;
        const bladeWidth = 4;
        const separation = 8;

        // Draw two blades
        for (let i = 0; i < 2; i++) {
            const yOffset = (i === 0 ? -separation : separation);

            // Blade gradient
            const bladeGrad = ctx.createLinearGradient(offsetX, yOffset - bladeWidth / 2, offsetX, yOffset + bladeWidth / 2);
            bladeGrad.addColorStop(0, '#ff6b6b');
            bladeGrad.addColorStop(0.5, '#ff8787');
            bladeGrad.addColorStop(1, '#ff4757');
            ctx.fillStyle = bladeGrad;

            // Blade shape
            ctx.beginPath();
            ctx.moveTo(offsetX, yOffset);
            ctx.lineTo(offsetX + bladeLength, yOffset - bladeWidth / 2);
            ctx.lineTo(offsetX + bladeLength + 6, yOffset);
            ctx.lineTo(offsetX + bladeLength, yOffset + bladeWidth / 2);
            ctx.closePath();
            ctx.fill();

            // Blade glow
            ctx.shadowColor = '#ff4757';
            ctx.shadowBlur = 8;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(offsetX, yOffset);
            ctx.lineTo(offsetX + bladeLength + 6, yOffset);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Small crossguard
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(offsetX - 1, yOffset - 5, 2, 10);

            // Handle
            ctx.fillStyle = '#34495e';
            ctx.fillRect(offsetX - 10, yOffset - 2, 9, 4);
        }

        // Energy connection between blades
        const time = Date.now() / 1000;
        const alpha = 0.3 + Math.sin(time * 5) * 0.2;
        ctx.strokeStyle = `rgba(255, 71, 87, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(offsetX + 15, -separation);
        ctx.lineTo(offsetX + 15, separation);
        ctx.stroke();
    }
}
