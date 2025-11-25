/**
 * Halloween-themed Enemy Types
 * 7+ unique enemy types with different attack patterns
 */

export class HalloweenEnemy {
    constructor(x, y, type, player, combatSystem, level = 1) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.player = player;
        this.combatSystem = combatSystem;
        this.level = level;

        this.setupStats();

        this.state = 'CHASE';
        this.attackTimer = 0;
        this.animationTimer = 0;
    }

    setupStats() {
        const levelMultiplier = 1 + (this.level - 1) * 0.3; // Increased from 0.15 to 0.3

        const types = {
            GHOST: {
                hp: 12, damage: 4, speed: 135, attackRange: 200, // Speed increased 50%
                scoreReward: 35, color: '#e0e0e0', radius: 18,
                attackCooldown: 2.5, attackType: 'projectile'
            },
            PUMPKIN: {
                hp: 25, damage: 6, speed: 90, attackRange: 50, // Speed increased 50%
                scoreReward: 50, color: '#ff8c00', radius: 20,
                attackCooldown: 1.5, attackType: 'melee'
            },
            SKELETON: {
                hp: 18, damage: 5, speed: 128, attackRange: 180, // Speed increased 50%
                scoreReward: 45, color: '#f5f5dc', radius: 17,
                attackCooldown: 2.0, attackType: 'projectile'
            },
            WITCH: {
                hp: 15, damage: 8, speed: 105, attackRange: 250, // Speed increased 50%
                scoreReward: 60, color: '#8b008b', radius: 19,
                attackCooldown: 3.0, attackType: 'homing'
            },
            ZOMBIE: {
                hp: 35, damage: 10, speed: 68, attackRange: 40, // Speed increased 50%
                scoreReward: 55, color: '#556b2f', radius: 22,
                attackCooldown: 1.0, attackType: 'melee'
            },
            BAT_SWARM: {
                hp: 8, damage: 3, speed: 180, attackRange: 30,
                scoreReward: 30, color: '#4b0082', radius: 12,
                attackCooldown: 0.8, attackType: 'swarm'
            },
            PUMPKIN_KING: {
                hp: 50, damage: 12, speed: 83, attackRange: 150,
                scoreReward: 100, color: '#ff4500', radius: 28,
                attackCooldown: 2.5, attackType: 'explosive'
            },
            GARGOYLE: {
                hp: 45, damage: 8, speed: 50, attackRange: 200,
                scoreReward: 70, color: '#808080', radius: 24,
                attackCooldown: 3.5, attackType: 'heavy_projectile'
            },
            WRAITH: {
                hp: 10, damage: 12, speed: 200, attackRange: 150,
                scoreReward: 65, color: '#9370db', radius: 16,
                attackCooldown: 1.8, attackType: 'fast_projectile'
            },
            NECROMANCER: {
                hp: 22, damage: 6, speed: 75, attackRange: 280,
                scoreReward: 85, color: '#2f4f4f', radius: 20,
                attackCooldown: 4.0, attackType: 'summon'
            }
        };

        const stats = types[this.type];
        this.hp = Math.floor(stats.hp * levelMultiplier);
        this.maxHp = this.hp;
        this.damage = Math.floor(stats.damage * levelMultiplier);
        this.speed = stats.speed;
        this.attackRange = stats.attackRange;
        this.scoreReward = stats.scoreReward;
        this.color = stats.color;
        this.radius = stats.radius;
        this.attackCooldown = stats.attackCooldown;
        this.attackType = stats.attackType;
        
        // 弹幕速度随关卡提升: L1=1.0, L2=1.15, L3=1.3, L4=1.45, L5=1.6
        this.projectileSpeedMultiplier = 1 + (this.level - 1) * 0.15;
    }

    update(deltaTime) {
        this.animationTimer += deltaTime;

        if (this.state === 'DEAD') return;

        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.attackTimer -= deltaTime;

        if (dist < this.attackRange && this.attackTimer <= 0) {
            this.attack();
            this.attackTimer = this.attackCooldown;
        } else if (dist > this.attackRange) {
            // Chase player
            this.x += (dx / dist) * this.speed * deltaTime;
            this.y += (dy / dist) * this.speed * deltaTime;
        }
    }

    attack() {
        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const speedMult = this.projectileSpeedMultiplier || 1;

        switch (this.attackType) {
            case 'projectile':
                // Enhanced projectile with trail effect - 速度随关卡提升
                const projSpeed = 450 * speedMult;
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle) * projSpeed,
                    vy: Math.sin(angle) * projSpeed,
                    radius: 6, color: this.color,
                    damage: this.damage, owner: 'enemy',
                    trail: [],
                    update: function (dt) {
                        this.trail.push({ x: this.x, y: this.y });
                        if (this.trail.length > 8) this.trail.shift();
                        this.x += this.vx * dt;
                        this.y += this.vy * dt;
                    },
                    draw: function (ctx) {
                        // Draw trail
                        ctx.globalAlpha = 0.3;
                        this.trail.forEach((pos, i) => {
                            ctx.fillStyle = this.color;
                            ctx.beginPath();
                            ctx.arc(pos.x, pos.y, this.radius * (i / this.trail.length), 0, Math.PI * 2);
                            ctx.fill();
                        });
                        ctx.globalAlpha = 1.0;

                        // Main projectile
                        ctx.fillStyle = this.color;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 8;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                });
                break;

            case 'homing':
                // Witch's homing magic missile - 速度随关卡提升
                const homingSpeed = 380 * speedMult;
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle) * homingSpeed,
                    vy: Math.sin(angle) * homingSpeed,
                    radius: 8, color: this.color,
                    damage: this.damage, owner: 'enemy',
                    player: this.player,
                    rotation: 0,
                    update: function (dt) {
                        const dx = this.player.x - this.x;
                        const dy = this.player.y - this.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const homeSpeed = 200; // Increased from 150
                        this.vx += (dx / dist) * homeSpeed * dt;
                        this.vy += (dy / dist) * homeSpeed * dt;

                        // Limit speed
                        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                        if (speed > 450) { // Increased from 300
                            this.vx = (this.vx / speed) * 450;
                            this.vy = (this.vy / speed) * 450;
                        }

                        this.x += this.vx * dt;
                        this.y += this.vy * dt;
                        this.rotation += dt * 5;
                    },
                    draw: function (ctx) {
                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.rotation);

                        // Star shape
                        ctx.fillStyle = this.color;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 15;
                        ctx.beginPath();
                        for (let i = 0; i < 5; i++) {
                            const angle = (Math.PI * 2 / 5) * i;
                            const x = Math.cos(angle) * this.radius;
                            const y = Math.sin(angle) * this.radius;
                            if (i === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                        ctx.fill();
                        ctx.shadowBlur = 0;
                        ctx.restore();
                    }
                });
                break;

            case 'explosive':
                // Pumpkin King's explosive projectile - 速度随关卡提升
                const explosiveSpeed = 350 * speedMult;
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle) * explosiveSpeed,
                    vy: Math.sin(angle) * explosiveSpeed,
                    radius: 10, color: this.color,
                    damage: this.damage,
                    owner: 'enemy',
                    life: 2.5,
                    explosionRadius: 60,
                    hasExploded: false,
                    update(dt) {
                        this.x += this.vx * dt;
                        this.y += this.vy * dt;
                        this.life -= dt;
                        if (this.life <= 0) this.markedForDeletion = true;
                    },
                    draw: function (ctx) {
                        const pulseSize = 1 + Math.sin(this.pulse) * 0.3;
                        ctx.fillStyle = this.color;
                        ctx.shadowColor = '#ff0';
                        ctx.shadowBlur = 20;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius * pulseSize, 0, Math.PI * 2);
                        ctx.fill();

                        // Warning glow when about to explode
                        if (this.life < 0.5) {
                            ctx.strokeStyle = '#f00';
                            ctx.lineWidth = 3;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
                            ctx.stroke();
                        }
                        ctx.shadowBlur = 0;
                    }
                });
                break;

            case 'melee':
                // Enhanced melee with lunge
                if (dist < this.attackRange) {
                    // Lunge towards player
                    this.x += Math.cos(angle) * 30;
                    this.y += Math.sin(angle) * 30;
                    this.player.takeDamage(this.damage);
                }
                break;

            case 'swarm':
                // Bat swarm - rapid dash
                this.x += Math.cos(angle) * 100;
                this.y += Math.sin(angle) * 100;
                const newDist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                if (newDist < this.radius + this.player.radius) {
                    this.player.takeDamage(this.damage);
                }
                break;

            case 'heavy_projectile':
                // GARGOYLE - slow but impactful projectiles - 速度随关卡提升
                const heavySpeed = 220 * speedMult;
                this.combatSystem.spawnProjectile({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * heavySpeed,
                    vy: Math.sin(angle) * heavySpeed,
                    radius: 14,
                    color: this.color,
                    damage: this.damage,
                    owner: 'enemy',
                    update(dt) {
                        this.x += this.vx * dt;
                        this.y += this.vy * dt;
                    },
                    draw(ctx) {
                        ctx.fillStyle = this.color;
                        ctx.strokeStyle = '#555';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                });
                break;

            case 'fast_projectile':
                // WRAITH - rapid fire projectiles - 速度随关卡提升
                const fastSpeed = 500 * speedMult;
                for (let i = 0; i < 2; i++) {
                    const spread = (i - 0.5) * 0.15;
                    this.combatSystem.spawnProjectile({
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(angle + spread) * fastSpeed,
                        vy: Math.sin(angle + spread) * fastSpeed,
                        radius: 6,
                        color: this.color,
                        damage: this.damage,
                        owner: 'enemy',
                        update(dt) {
                            this.x += this.vx * dt;
                            this.y += this.vy * dt;
                        },
                        draw(ctx) {
                            ctx.fillStyle = this.color;
                            ctx.shadowColor = this.color;
                            ctx.shadowBlur = 10;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.shadowBlur = 0;
                        }
                    });
                }
                break;

            case 'summon':
                // NECROMANCER - creates damaging zones
                for (let i = 0; i < 3; i++) {
                    const randomAngle = Math.random() * Math.PI * 2;
                    const randomDist = 80 + Math.random() * 100;
                    const zoneX = this.player.x + Math.cos(randomAngle) * randomDist;
                    const zoneY = this.player.y + Math.sin(randomAngle) * randomDist;

                    this.combatSystem.spawnProjectile({
                        x: zoneX,
                        y: zoneY,
                        radius: 45,
                        color: this.color,
                        damage: this.damage * 0.5,
                        owner: 'enemy',
                        life: 3.0,
                        maxLife: 3.0,
                        update(dt) {
                            this.life -= dt;
                            if (this.life <= 0) this.markedForDeletion = true;
                        },
                        draw(ctx) {
                            const alpha = this.life / this.maxLife * 0.4;
                            ctx.fillStyle = `rgba(47, 79, 79, ${alpha})`;
                            ctx.strokeStyle = `rgba(47, 79, 79, ${alpha * 2})`;
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.stroke();
                        }
                    });
                }
                break;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.state = 'DEAD';
        }
    }

    draw(ctx) {
        // 精英怪金色光环效果
        if (this.isElite) {
            ctx.save();
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        if (window.HalloweenRenderer) {
            window.HalloweenRenderer.drawEnemy(ctx, this);
        } else {
            // Fallback
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // HP Bar
        const hpPct = this.hp / this.maxHp;
        const barWidth = this.radius * 2;
        const barY = this.y - this.radius - 10;
        
        // 精英怪用金色血条
        if (this.isElite) {
            ctx.fillStyle = '#444';
            ctx.fillRect(this.x - barWidth/2, barY - 2, barWidth, 8);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(this.x - barWidth/2, barY - 2, barWidth * hpPct, 8);
            // 精英标记
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('★精英', this.x, barY - 8);
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - this.radius, barY, barWidth, 4);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x - this.radius, barY, barWidth * hpPct, 4);
        }
    }
}
