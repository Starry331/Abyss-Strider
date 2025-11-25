import { BossVariety } from './BossVariety.js';

export class BossManager {
    constructor(combatSystem, player, uiManager) {
        this.combatSystem = combatSystem;
        this.player = player;
        this.uiManager = uiManager;
        this.activeBoss = null;
        this.bossSpawned = false;

        this.onBossSpawn = null;
        this.onBossDeath = null;
    }

    spawnBoss(level) {
        if (this.bossSpawned) return;

        console.log(`Spawning Boss for Level ${level}`);
        this.bossSpawned = true;
        this.uiManager.showBossWarning();

        if (this.onBossSpawn) this.onBossSpawn();

        // Delay actual spawn for warning duration
        setTimeout(() => {
            this.activeBoss = BossVariety.createBoss(level, this.player.x + 300, this.player.y, this.player, this.combatSystem);
            this.uiManager.hideBossWarning();
        }, 3000);
    }

    update(deltaTime) {
        if (this.activeBoss) {
            this.activeBoss.update(deltaTime);

            // Update Boss HP UI
            this.updateBossHPUI();

            if (this.activeBoss.hp <= 0) {
                // Boss Defeated
                console.log("Boss Defeated! HP:", this.activeBoss.hp);
                console.log("onBossDeath callback exists:", !!this.onBossDeath);
                this.hideBossHPUI();
                // this.uiManager.showBlessingMenu(); // Now handled by BuildSystem
                this.activeBoss = null;
                this.bossSpawned = false;

                if (this.onBossDeath) {
                    console.log("Calling onBossDeath callback...");
                    this.onBossDeath();
                } else {
                    console.error("onBossDeath callback is not set!");
                }
            }
        } else {
            // No active boss, ensure HP UI is hidden
            this.hideBossHPUI();
        }
    }

    updateBossHPUI() {
        if (!this.activeBoss) return;

        const container = document.getElementById('boss-hp-container');
        const nameEl = document.getElementById('boss-name');
        const fillEl = document.getElementById('boss-hp-fill');
        const textEl = document.getElementById('boss-hp-text');

        if (container && container.classList.contains('hidden')) {
            container.classList.remove('hidden');
        }

        const hpPercent = Math.max(0, Math.min(100, (this.activeBoss.hp / this.activeBoss.maxHp) * 100));

        if (fillEl) fillEl.style.width = `${hpPercent}%`;
        if (textEl) textEl.innerText = `HP: ${Math.ceil(this.activeBoss.hp)}/${this.activeBoss.maxHp}`;

        // Set boss name based on level
        if (nameEl) {
            const bossNames = {
                1: '险恶猴子 (Wicked Monkey)',
                2: '冰霜巨龙 (Ice Dragon)',
                3: '地狱三头龙 (Cerberus)',
                4: '雷神宙斯 (Zeus)',
                5: '圣骑士 (Paladin)'
            };
            nameEl.innerText = bossNames[this.activeBoss.level] || 'Boss';
        }
    }

    hideBossHPUI() {
        const container = document.getElementById('boss-hp-container');
        if (container && !container.classList.contains('hidden')) {
            container.classList.add('hidden');
        }
    }

    draw(ctx) {
        if (this.activeBoss) {
            // Use themed boss rendering
            if (window.CharacterRenderer) {
                if (this.activeBoss.level === 1) {
                    window.CharacterRenderer.drawMonkeyBoss(ctx, this.activeBoss);
                } else {
                    window.CharacterRenderer.drawDragonBoss(ctx, this.activeBoss);
                }
            } else {
                this.activeBoss.draw(ctx);
            }

            // Draw HP bar above boss
            const boss = this.activeBoss;
            const hpPct = Math.max(0, boss.hp / boss.maxHp);
            const barWidth = 80;
            const barHeight = 8;
            const barOffset = boss.radius + 25;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(boss.x - barWidth / 2 - 2, boss.y - barOffset - 2, barWidth + 4, barHeight + 4);

            ctx.fillStyle = '#8b0000';
            ctx.fillRect(boss.x - barWidth / 2, boss.y - barOffset, barWidth, barHeight);

            ctx.fillStyle = '#9b59b6';
            ctx.fillRect(boss.x - barWidth / 2, boss.y - barOffset, barWidth * hpPct, barHeight);

            ctx.strokeStyle = '#ecf0f1';
            ctx.lineWidth = 2;
            ctx.strokeRect(boss.x - barWidth / 2, boss.y - barOffset, barWidth, barHeight);

            // Telegraph Visual (moved here from Boss.draw) - ENHANCED
            if (boss.state === 'TELEGRAPH') {
                const time = Date.now() / 1000;
                const pulseAlpha = 0.3 + Math.sin(time * 8) * 0.2;
                const pulseScale = 1 + Math.sin(time * 6) * 0.1;

                // Skill-specific telegraphs
                if (boss.currentSkill === 'SMASH') {
                    // Large AOE warning with expanding rings
                    for (let i = 0; i < 3; i++) {
                        const ringAlpha = pulseAlpha * (1 - i * 0.3);
                        const ringRadius = 150 * pulseScale + i * 20;
                        ctx.strokeStyle = `rgba(231, 76, 60, ${ringAlpha})`;
                        ctx.lineWidth = 6 - i * 2;
                        ctx.beginPath();
                        ctx.arc(boss.x, boss.y, ringRadius, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    // Fill center
                    ctx.fillStyle = `rgba(231, 76, 60, ${pulseAlpha * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(boss.x, boss.y, 150 * pulseScale, 0, Math.PI * 2);
                    ctx.fill();
                    // Warning particles
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 / 8) * i + time;
                        const px = boss.x + Math.cos(angle) * 140;
                        const py = boss.y + Math.sin(angle) * 140;
                        ctx.fillStyle = '#ff4444';
                        ctx.beginPath();
                        ctx.arc(px, py, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else if (boss.currentSkill === 'CHARGE') {
                    // Direction indicator with arrow
                    const dx = this.player.x - boss.x;
                    const dy = this.player.y - boss.y;
                    const angle = Math.atan2(dy, dx);

                    // Pulsing charge line
                    ctx.strokeStyle = `rgba(255, 165, 0, ${pulseAlpha})`;
                    ctx.lineWidth = 25 * pulseScale;
                    ctx.beginPath();
                    ctx.moveTo(boss.x, boss.y);
                    ctx.lineTo(boss.x + Math.cos(angle) * 350, boss.y + Math.sin(angle) * 350);
                    ctx.stroke();

                    // Arrow head
                    const arrowX = boss.x + Math.cos(angle) * 350;
                    const arrowY = boss.y + Math.sin(angle) * 350;
                    ctx.fillStyle = '#ff6600';
                    ctx.beginPath();
                    ctx.moveTo(arrowX, arrowY);
                    ctx.lineTo(arrowX - Math.cos(angle - 0.5) * 30, arrowY - Math.sin(angle - 0.5) * 30);
                    ctx.lineTo(arrowX - Math.cos(angle + 0.5) * 30, arrowY - Math.sin(angle + 0.5) * 30);
                    ctx.closePath();
                    ctx.fill();
                } else if (boss.currentSkill === 'NOVA') {
                    // Expanding wave warning
                    for (let i = 0; i < 4; i++) {
                        const waveRadius = 100 + i * 40 + (time * 50) % 160;
                        const waveAlpha = pulseAlpha * (1 - (waveRadius - 100) / 200);
                        ctx.strokeStyle = `rgba(138, 43, 226, ${waveAlpha})`;
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.arc(boss.x, boss.y, waveRadius, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                } else if (boss.currentSkill === 'BARRAGE') {
                    // Multiple target indicators
                    for (let i = 0; i < 5; i++) {
                        const targetAngle = (Math.PI * 2 / 5) * i + time;
                        const targetX = boss.x + Math.cos(targetAngle) * 120;
                        const targetY = boss.y + Math.sin(targetAngle) * 120;
                        ctx.strokeStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(targetX, targetY, 20, 0, Math.PI * 2);
                        ctx.stroke();
                        // Crosshair
                        ctx.beginPath();
                        ctx.moveTo(targetX - 15, targetY);
                        ctx.lineTo(targetX + 15, targetY);
                        ctx.moveTo(targetX, targetY - 15);
                        ctx.lineTo(targetX, targetY + 15);
                        ctx.stroke();
                    }
                } else {
                    // Default warning circle
                    ctx.fillStyle = `rgba(231, 76, 60, ${pulseAlpha * 0.3})`;
                    ctx.strokeStyle = `rgba(231, 76, 60, ${pulseAlpha})`;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(boss.x, boss.y, 80 * pulseScale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }

                // Warning text with animation
                ctx.save();
                ctx.translate(boss.x, boss.y - boss.radius - 40);
                ctx.scale(pulseScale, pulseScale);
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                ctx.font = 'bold 28px Arial';
                ctx.textAlign = 'center';
                ctx.strokeText('⚠️ 危险！', 0, 0);
                ctx.fillText('⚠️ 危险！', 0, 0);

                // Skill name
                ctx.font = 'bold 18px Arial';
                ctx.strokeText(boss.currentSkill || 'ATTACK', 0, 25);
                ctx.fillText(boss.currentSkill || 'ATTACK', 0, 25);
                ctx.restore();
            }
        }
    }
}

class Boss {
    constructor(x, y, level, player, combatSystem) {
        this.x = x;
        this.y = y;
        this.level = level;
        this.player = player;
        this.combatSystem = combatSystem;
        this.maxHp = 350 * level; // Reduced from 500
        this.hp = this.maxHp;
        this.radius = 50;
        this.color = '#8e44ad';
        this.phase = 1;

        this.state = 'IDLE';
        this.timer = 0;
    }

    update(deltaTime) {
        // State Machine
        switch (this.state) {
            case 'IDLE':
                this.handleIdle(deltaTime);
                break;
            case 'TELEGRAPH':
                this.handleTelegraph(deltaTime);
                break;
            case 'ATTACK':
                this.handleAttack(deltaTime);
                break;
        }

        // Phase changes
        if (this.hp < this.maxHp * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.color = '#c0392b'; // Enraged color
            // Push away player?
        }
    }

    handleIdle(deltaTime) {
        // Move towards player
        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 150) {
            this.x += (dx / dist) * 50 * deltaTime;
            this.y += (dy / dist) * 50 * deltaTime;
        }

        // Randomly start skill
        if (Math.random() < 0.01) {
            this.startSkill();
        }
    }

    startSkill() {
        this.state = 'TELEGRAPH';
        this.timer = 1.5; // 1.5s warning

        // More varied skills based on phase
        const skills = this.phase === 1 ? ['SMASH', 'CHARGE'] : ['NOVA', 'SMASH', 'BARRAGE'];
        this.currentSkill = skills[Math.floor(Math.random() * skills.length)];
    }

    handleTelegraph(deltaTime) {
        this.timer -= deltaTime;
        if (this.timer <= 0) {
            this.state = 'ATTACK';
            this.timer = 0.5; // Attack duration
            this.executeSkill();
        }
    }

    executeSkill() {
        if (this.currentSkill === 'SMASH') {
            // Big AOE around boss
            const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
            if (dist < 150) {
                this.player.takeDamage(20); // Reduced from 30
            }
        } else if (this.currentSkill === 'NOVA') {
            // Spawn projectiles in 8 directions
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle) * 300,
                    vy: Math.sin(angle) * 300,
                    radius: 8, color: '#e74c3c',
                    damage: 20, owner: 'enemy',
                    update: function (dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                    draw: function (ctx) { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
                });
            }
        } else if (this.currentSkill === 'CHARGE') {
            // Dash towards player
            const dx = this.player.x - this.x;
            const dy = this.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.x += (dx / dist) * 200;
            this.y += (dy / dist) * 200;

            // Damage if close
            const newDist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
            if (newDist < this.radius + this.player.radius + 20) {
                this.player.takeDamage(25);
            }
        } else if (this.currentSkill === 'BARRAGE') {
            // Rapid fire projectiles
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x) + (Math.random() - 0.5) * 0.5;
                    this.combatSystem.spawnProjectile({
                        x: this.x, y: this.y,
                        vx: Math.cos(angle) * 400,
                        vy: Math.sin(angle) * 400,
                        radius: 10, color: '#8e44ad',
                        damage: 15, owner: 'enemy',
                        update: function (dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
                        draw: function (ctx) {
                            ctx.fillStyle = this.color;
                            ctx.shadowColor = this.color;
                            ctx.shadowBlur = 15;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.shadowBlur = 0;
                        }
                    });
                }, i * 150);
            }
        }
    }

    handleAttack(deltaTime) {
        this.timer -= deltaTime;
        if (this.timer <= 0) {
            this.state = 'IDLE';
        }
    }

    takeDamage(amount) {
        // Validate amount
        if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
            console.error('Invalid boss damage:', amount);
            return;
        }

        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            // Boss died, will be handled in BossManager
        }

        // Flash effect
        this.flashTimer = 0.2;
    }

    draw(ctx) {
        // Telegraph Visual
        if (this.state === 'TELEGRAPH') {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
            ctx.beginPath();
            if (this.currentSkill === 'SMASH') {
                ctx.arc(this.x, this.y, 150, 0, Math.PI * 2);
            } else {
                ctx.arc(this.x, this.y, 50, 0, Math.PI * 2); // Charge up
            }
            ctx.fill();
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Boss Body
        ctx.fillStyle = this.flashTimer > 0 ? '#fff' : this.color;
        if (this.flashTimer > 0) this.flashTimer -= 0.016;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Boss HP Bar (Big)
        const hpPct = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 60, this.y - 70, 120, 10);
        ctx.fillStyle = 'purple';
        ctx.fillRect(this.x - 60, this.y - 70, 120 * hpPct, 10);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(this.x - 60, this.y - 70, 120, 10);
    }
}
