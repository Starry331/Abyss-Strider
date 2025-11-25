import { hitEffects } from '../effects/HitEffects.js';

export class CombatSystem {
    constructor(audioManager = null) {
        this.projectiles = [];
        this.damageTexts = [];
        this.comboCount = 0;
        this.comboTimer = 0;
        this.audioManager = audioManager;
    }
    
    setAudioManager(audioManager) {
        this.audioManager = audioManager;
    }

    update(deltaTime) {
        // 更新连击计时
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(deltaTime);
            if (p.markedForDeletion) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // 更新打击特效
        hitEffects.update(deltaTime);
    }

    draw(ctx) {
        this.projectiles.forEach(p => p.draw(ctx));
        // 绘制打击特效
        hitEffects.draw(ctx);
    }
    
    // 获取屏幕震动
    getScreenShake() {
        return hitEffects.screenShake;
    }

    spawnProjectile(projectile) {
        this.projectiles.push(projectile);
    }

    checkCollisions(player, enemies) {
        // Player Projectiles vs Enemies
        this.projectiles.forEach(p => {
            if (p.owner === 'player') {
                // Check if projectile has AOE radius (Staff weapon)
                if (p.aoeRadius && p.aoeRadius > 0) {
                    // AOE damage - check all enemies within radius
                    let hitAnyEnemy = false;
                    enemies.forEach(e => {
                        const dx = p.x - e.x;
                        const dy = p.y - e.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < p.aoeRadius + e.radius) {
                            const isCrit = p.critChance && Math.random() < p.critChance;
                            const finalDamage = isCrit ? p.damage * (p.critMultiplier || 2) : p.damage;
                            e.takeDamage(finalDamage);
                            hitAnyEnemy = true;
                            
                            // 吸血效果
                            if (p.lifesteal && p.lifesteal > 0 && p.player) {
                                const healAmount = finalDamage * p.lifesteal;
                                p.player.hp = Math.min(p.player.maxHp, p.player.hp + healAmount);
                            }
                            // 每击回血
                            if (p.manaSteal && p.manaSteal > 0 && p.player) {
                                p.player.hp = Math.min(p.player.maxHp, p.player.hp + p.manaSteal);
                            }
                            
                            // 法杖打击特效
                            hitEffects.spawnStaffHit(e.x, e.y, finalDamage);
                            hitEffects.spawnEnemyFlash(e.x, e.y, e.radius);
                            hitEffects.spawnDamageNumber(e.x, e.y, finalDamage, isCrit);
                            // 法杖命中音效
                            if (this.audioManager) this.audioManager.playSound('staff_hit');
                        }
                    });

                    // Mark for deletion if hit any enemy (unless it has pierce)
                    if (hitAnyEnemy && !p.pierce) {
                        p.markedForDeletion = true;
                    }
                } else {
                    // Single target damage (Longsword, Dual Blades)
                    enemies.forEach(e => {
                        if (this.checkCircleCollision(p, e)) {
                            const isCrit = p.critChance && Math.random() < p.critChance;
                            const finalDamage = isCrit ? p.damage * (p.critMultiplier || 2) : p.damage;
                            e.takeDamage(finalDamage);
                            
                            // 吸血效果
                            if (p.lifesteal && p.lifesteal > 0 && p.player) {
                                const healAmount = finalDamage * p.lifesteal;
                                p.player.hp = Math.min(p.player.maxHp, p.player.hp + healAmount);
                            }
                            // 每击回血
                            if (p.manaSteal && p.manaSteal > 0 && p.player) {
                                p.player.hp = Math.min(p.player.maxHp, p.player.hp + p.manaSteal);
                            }
                            
                            // 击退效果
                            if (p.knockback && p.knockback > 0) {
                                const angle = Math.atan2(e.y - p.y, e.x - p.x);
                                e.x += Math.cos(angle) * p.knockback * 0.1;
                                e.y += Math.sin(angle) * p.knockback * 0.1;
                            }
                            
                            // 根据武器类型触发不同特效
                            const angle = p.angle || Math.atan2(e.y - p.y, e.x - p.x);
                            
                            if (p.weaponType === 'Longsword') {
                                hitEffects.spawnLongswordHit(e.x, e.y, angle, finalDamage);
                            } else if (p.weaponType === 'Dual Blades') {
                                this.comboCount++;
                                this.comboTimer = 1.5;
                                hitEffects.spawnDualBladesHit(e.x, e.y, angle, finalDamage, this.comboCount);
                            } else {
                                hitEffects.spawnLongswordHit(e.x, e.y, angle, finalDamage);
                            }
                            
                            hitEffects.spawnEnemyFlash(e.x, e.y, e.radius);
                            hitEffects.spawnDamageNumber(e.x, e.y, finalDamage, isCrit);
                            
                            if (!p.pierce) {
                                p.markedForDeletion = true;
                            }
                        }
                    });
                }
            }
        });

        // Enemy Attacks vs Player
        // 1. Enemy projectiles vs player
        this.projectiles.forEach(p => {
            if (p.owner === 'enemy') {
                if (this.checkCircleCollision(player, p)) {
                    player.takeDamage(p.damage);
                    p.markedForDeletion = true;
                }
            }
        });

        // 2. Contact damage from enemies
        enemies.forEach(e => {
            if (this.checkCircleCollision(player, e)) {
                player.takeDamage(e.damage * 0.05); // Reduced contact damage per frame
            }
        });
    }

    checkCircleCollision(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < (a.radius + b.radius);
    }
}
