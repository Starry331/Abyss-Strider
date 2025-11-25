export class LevelManager {
    constructor(player, enemyManager, bossManager, uiManager, audioManager = null) {
        this.player = player;
        this.enemyManager = enemyManager;
        this.bossManager = bossManager;
        this.uiManager = uiManager;
        this.audioManager = audioManager;

        this.currentLevel = 1;
        this.score = 0;

        this.levels = [
            { id: 1, name: '深暗地牢', color: '#1a1a1a', bossScore: 1000 },
            { id: 2, name: '冰封雪山', color: '#2c3e50', bossScore: 2500 },
            { id: 3, name: '地狱回廊', color: '#2c0000', bossScore: 4500 },
            { id: 4, name: '岩浆地带', color: '#4a0000', bossScore: 7000 },
            { id: 5, name: '圣殿', color: '#5e4d28', bossScore: 10000 }
        ];

        this.bossTriggered = false;
        
        // 积分触发构筑的阈值
        this.buildScoreThresholds = [1000, 1500, 2500, 3500, 4500, 6000];
        this.triggeredThresholds = new Set(); // 已触发的阈值
        
        // 构筑选择回调
        this.onBuildTrigger = null;
    }

    addScore(amount) {
        const oldScore = this.score;
        this.score += amount;
        this.uiManager.updateScore(this.score);
        
        // 检查积分阈值触发构筑
        this.checkBuildThresholds(oldScore, this.score);
        
        this.checkProgression();
    }
    
    // 检查是否跨越构筑阈值
    checkBuildThresholds(oldScore, newScore) {
        for (const threshold of this.buildScoreThresholds) {
            if (oldScore < threshold && newScore >= threshold && !this.triggeredThresholds.has(threshold)) {
                this.triggeredThresholds.add(threshold);
                console.log(`积分达到 ${threshold}，触发构筑选择！`);
                if (this.onBuildTrigger) {
                    this.onBuildTrigger(threshold);
                }
                return; // 一次只触发一个
            }
        }
    }

    checkProgression() {
        const levelData = this.levels[this.currentLevel - 1];
        if (!levelData) return;

        if (this.score >= levelData.bossScore && !this.bossTriggered) {
            this.bossTriggered = true;
            this.bossManager.spawnBoss(this.currentLevel);
        }
    }

    advanceLevel() {
        if (this.currentLevel < this.levels.length) {
            this.currentLevel++;
            this.bossTriggered = false;
            this.uiManager.updateLevel(this.levels[this.currentLevel - 1].name);

            // Update enemy difficulty
            if (this.enemyManager) {
                this.enemyManager.setLevel(this.currentLevel);
            }
            
            // 切换关卡音乐
            if (this.audioManager) {
                this.audioManager.playMusic('level' + this.currentLevel);
            }

            // Teleport player to center
            this.player.x = window.innerWidth / 2;
            this.player.y = window.innerHeight / 2;

            // Clear enemies
            this.enemyManager.enemies = [];
        } else {
            // Victory!
            console.log("Victory! You've completed all levels!");
        }
    }

    getCurrentLevelData() {
        return this.levels[this.currentLevel - 1];
    }
}
