// PowerUpManager: Spawns collectible buff drops in the world
// Players must walk over them to collect and activate the buff

export class PowerUpManager {
    constructor(player, uiManager) {
        this.player = player;
        this.uiManager = uiManager;
        this.spawnInterval = 12; // seconds between spawn attempts
        this.lastSpawn = 0;
        this.drops = []; // Active buff drops in the world
        this.activeBuff = null; // Currently active buff on player
        this.buffTypes = [
            // Common buffs (70% drop rate)
            { type: 'HP_MAX', icon: '🛡️', color: '#3498db', duration: 15000, rarity: 'common', desc: '+30最大生命' },
            { type: 'ATTACK_BOOST', icon: '⚔️', color: '#e74c3c', duration: 10000, rarity: 'common', desc: '+50%攻击力' },
            { type: 'SPEED_BOOST', icon: '🏃', color: '#2ecc71', duration: 12000, rarity: 'common', desc: '+40%移速' },
            { type: 'SHIELD', icon: '🛡', color: '#9b59b6', duration: 20000, rarity: 'common', desc: '+50护盾' },

            // Rare buffs (25% drop rate)
            { type: 'ATTACK_SPEED', icon: '⚡', color: '#f39c12', duration: 15000, rarity: 'rare', desc: '+30%攻速' },
            { type: 'CRIT_CHANCE', icon: '💥', color: '#e67e22', duration: 20000, rarity: 'rare', desc: '+15%暴击率' },
            { type: 'LIFESTEAL', icon: '💉', color: '#c0392b', duration: 18000, rarity: 'rare', desc: '+10%吸血' },

            // Epic buffs (5% drop rate)
            { type: 'INVINCIBLE', icon: '✨', color: '#ffd700', duration: 5000, rarity: 'epic', desc: '5秒无敌' },
            { type: 'MEGA_BOOST', icon: '🔥', color: '#ff00ff', duration: 8000, rarity: 'epic', desc: '全属性提升' }
        ];
    }

    update(deltaTime) {
        // Spawn logic
        this.lastSpawn += deltaTime;
        if (this.lastSpawn >= this.spawnInterval) {
            this.lastSpawn = 0;
            if (this.drops.length === 0 && Math.random() < 0.6) { // 60% chance
                this.spawnDrop();
            }
        }

        // Check for player collection
        for (let i = this.drops.length - 1; i >= 0; i--) {
            const drop = this.drops[i];
            const dx = this.player.x - drop.x;
            const dy = this.player.y - drop.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.radius + drop.radius) {
                // Player collected the buff
                this.collectBuff(drop);
                this.drops.splice(i, 1);
            }
        }

        // Handle active buff expiration
        if (this.activeBuff && this.activeBuff.expiresAt <= performance.now()) {
            this.removeBuff();
        }
    }

    spawnDrop() {
        // Weighted random selection based on rarity
        const rand = Math.random();
        let buffPool;

        if (rand < 0.05) {
            // 5% Epic
            buffPool = this.buffTypes.filter(b => b.rarity === 'epic');
        } else if (rand < 0.30) {
            // 25% Rare
            buffPool = this.buffTypes.filter(b => b.rarity === 'rare');
        } else {
            // 70% Common
            buffPool = this.buffTypes.filter(b => b.rarity === 'common');
        }

        const buffData = buffPool[Math.floor(Math.random() * buffPool.length)];

        // Spawn near player but not too close
        const angle = Math.random() * Math.PI * 2;
        const dist = 150 + Math.random() * 100;
        const drop = {
            x: this.player.x + Math.cos(angle) * dist,
            y: this.player.y + Math.sin(angle) * dist,
            radius: 15,
            type: buffData.type,
            icon: buffData.icon,
            color: buffData.color,
            rarity: buffData.rarity,
            duration: buffData.duration,
            desc: buffData.desc,
            pulse: 0
        };
        this.drops.push(drop);
        console.log(`Spawned ${buffData.rarity} buff: ${buffData.type}`);
    }

    collectBuff(drop) {
        // Remove existing buff if any
        if (this.activeBuff) {
            this.removeBuff();
        }

        // Apply new buff
        this.activeBuff = {
            type: drop.type,
            expiresAt: performance.now() + drop.duration
        };
        this.player.applyBuff({ type: drop.type, duration: drop.duration });
        this.uiManager.showBuffIcon(drop.type, drop.icon, drop.duration);
        
        // 拾取音效回调
        if (this.onCollect) this.onCollect(drop.type);
        
        console.log(`Buff collected: ${drop.type}`);
    }

    removeBuff() {
        if (!this.activeBuff) return;
        this.player.removeBuff(this.activeBuff.type);
        this.uiManager.hideBuffIcon(this.activeBuff.type);
        this.activeBuff = null;
    }

    draw(ctx) {
        // Draw buff drops in the world
        this.drops.forEach(drop => {
            drop.pulse += 0.05;
            const pulseSize = 1 + Math.sin(drop.pulse) * 0.2;

            // Outer glow
            ctx.fillStyle = drop.color + '40';
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, drop.radius * pulseSize * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Main circle
            ctx.fillStyle = drop.color;
            ctx.shadowColor = drop.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, drop.radius * pulseSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Icon
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(drop.icon, drop.x, drop.y);
        });
    }
}
