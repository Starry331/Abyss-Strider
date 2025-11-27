import { HalloweenEnemy } from './HalloweenEnemies.js';

export class EnemyManager {
    constructor(combatSystem, player) {
        this.combatSystem = combatSystem;
        this.player = player;
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;
        this.currentLevel = 1;
        this.bossActive = false;
        
        // 精英怪系统 - 根据关卡调整概率
        this.eliteSpawnChanceByLevel = {
            1: 0.00,  // Level 1: 0%
            2: 0.02,  // Level 2: 2%
            3: 0.02,  // Level 3: 2%
            4: 0.03,  // Level 4: 3%
            5: 0.04   // Level 5: 4%
        };
        this.onEliteDeath = null; // 精英怪死亡回调

        // Halloween enemy types unlock by level
        this.availableTypes = this.getAvailableTypes();
    }

    getAvailableTypes() {
        const allTypes = [
            { type: 'GHOST', unlockLevel: 1, weight: 30 },
            { type: 'PUMPKIN', unlockLevel: 1, weight: 25 },
            { type: 'BAT_SWARM', unlockLevel: 1, weight: 25 },
            { type: 'SKELETON', unlockLevel: 1, weight: 20 },
            { type: 'ZOMBIE', unlockLevel: 2, weight: 20 },
            { type: 'GARGOYLE', unlockLevel: 2, weight: 15 },
            { type: 'WITCH', unlockLevel: 3, weight: 15 },
            { type: 'WRAITH', unlockLevel: 3, weight: 15 },
            { type: 'PUMPKIN_KING', unlockLevel: 4, weight: 10 },
            { type: 'NECROMANCER', unlockLevel: 4, weight: 12 }
        ];

        return allTypes.filter(t => t.unlockLevel <= this.currentLevel);
    }

    setLevel(level) {
        this.currentLevel = level;
        this.availableTypes = this.getAvailableTypes();
        // 关卡越高生成越快: L1=1.8s, L2=1.4s, L3=1.0s, L4=0.7s, L5=0.5s
        const spawnIntervals = { 1: 1.8, 2: 1.4, 3: 1.0, 4: 0.7, 5: 0.5 };
        this.spawnInterval = spawnIntervals[level] || 1.5;
        console.log(`Enemy difficulty set to level ${level}, spawn interval: ${this.spawnInterval.toFixed(2)}s`);
        console.log(`Available enemy types: ${this.availableTypes.map(t => t.type).join(', ')}`);
    }

    update(deltaTime) {
        if (!this.bossActive) {
            this.spawnTimer -= deltaTime;
            if (this.spawnTimer <= 0) {
                this.spawnEnemy();
                this.spawnTimer = this.spawnInterval;
            }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime);
            if (enemy.hp <= 0) {
                // 精英怪死亡特殊处理
                if (enemy.isElite && this.onEliteDeath) {
                    this.onEliteDeath(enemy);
                } else if (this.onEnemyDeath) {
                    this.onEnemyDeath(enemy);
                }
                this.enemies.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.enemies.forEach(e => e.draw(ctx));
    }

    spawnEnemy() {
        if (this.availableTypes.length === 0) return;

        // Weighted random selection
        const totalWeight = this.availableTypes.reduce((sum, t) => sum + t.weight, 0);
        let rand = Math.random() * totalWeight;
        let selectedType = this.availableTypes[0].type;

        for (const typeData of this.availableTypes) {
            rand -= typeData.weight;
            if (rand <= 0) {
                selectedType = typeData.type;
                break;
            }
        }

        // Random position around player
        const angle = Math.random() * Math.PI * 2;
        const dist = 400 + Math.random() * 200;
        const x = this.player.x + Math.cos(angle) * dist;
        const y = this.player.y + Math.sin(angle) * dist;

        const enemy = new HalloweenEnemy(x, y, selectedType, this.player, this.combatSystem, this.currentLevel);
        
        // 根据关卡概率生成精英怪
        const eliteChance = this.eliteSpawnChanceByLevel[this.currentLevel] || 0;
        if (eliteChance > 0 && Math.random() < eliteChance) {
            this.makeElite(enemy);
        }
        
        this.enemies.push(enemy);
    }
    
    // 将普通怪物转化为精英怪
    makeElite(enemy) {
        enemy.isElite = true;
        enemy.hp *= 4.0;         // 4倍血量
        enemy.maxHp *= 4.0;
        enemy.damage *= 2.2;     // 2.2倍伤害
        enemy.scoreReward *= 5;  // 5倍积分
        enemy.radius *= 1.35;    // 体型变大
        enemy.speed *= 1.08;     // 略微加速
        
        // 精英怪特殊能力
        enemy.eliteArmor = 0.12; // 12%伤害减免
        enemy.eliteRegen = 1.2;  // 每秒回复1.2血量
        
        // 精英怪视觉效果标记
        enemy.eliteGlow = true;
        enemy.originalColor = enemy.color;
        enemy.color = '#ffd700'; // 金色
        
        console.log(`精英怪生成: ${enemy.type}`);
    }
}
