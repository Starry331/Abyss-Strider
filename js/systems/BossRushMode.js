/**
 * Boss战模式 - 万神殿挑战
 * 连续挑战所有异化Boss + 两个全新神话Boss
 */

export class BossRushMode {
    constructor() {
        this.isActive = false;
        this.currentBossIndex = 0;
        this.bossesDefeated = 0;
        this.totalBosses = 7; // 异化Lv1-5 + 波塞冬 + 阿尔忒弥斯
        
        // Boss顺序: 异化1-5, 鬼化波塞冬(6), 狂化阿尔忒弥斯(7)
        this.bossOrder = [
            { level: 1, name: '噬魂猿魔', isMutated: true },
            { level: 2, name: '霜魂冰魔', isMutated: true },
            { level: 3, name: '冥界地狱犬', isMutated: true },
            { level: 4, name: '暴君宙斯', isMutated: true },
            { level: 5, name: '堕落圣骑士', isMutated: true },
            { level: 6, name: '鬼化波塞冬', isMutated: false, isNewBoss: true },
            { level: 7, name: '狂化阿尔忒弥斯', isMutated: false, isNewBoss: true }
        ];
        
        // 奖励系统配置
        this.rewardsPerBoss = {
            builds: 2,      // 2次3选1构筑
            blessing: 1,    // 1次赐福选择
            weaponUpgrade: 1 // 1次武器升级
        };
    }
    
    // 检查是否解锁Boss战模式（需要通关过游戏）
    static isUnlocked() {
        const achievements = localStorage.getItem('abyssStrider_achievements');
        if (achievements) {
            try {
                const data = JSON.parse(achievements);
                const master = data.achievements.find(a => a.id === 'master');
                return master && master.unlocked;
            } catch(e) {
                return false;
            }
        }
        return false;
    }
    
    // 开始Boss战模式
    start() {
        this.isActive = true;
        this.currentBossIndex = 0;
        this.bossesDefeated = 0;
        console.log('Boss战模式开始！');
    }
    
    // 获取当前Boss信息
    getCurrentBoss() {
        if (this.currentBossIndex >= this.bossOrder.length) return null;
        return this.bossOrder[this.currentBossIndex];
    }
    
    // Boss被击败
    onBossDefeated() {
        this.bossesDefeated++;
        this.currentBossIndex++;
        console.log(`Boss战进度: ${this.bossesDefeated}/${this.totalBosses}`);
        return this.currentBossIndex < this.bossOrder.length;
    }
    
    // 检查是否完成所有Boss
    isComplete() {
        return this.bossesDefeated >= this.totalBosses;
    }
    
    // 获取进度
    getProgress() {
        return {
            current: this.bossesDefeated,
            total: this.totalBosses,
            percentage: (this.bossesDefeated / this.totalBosses) * 100
        };
    }
    
    // 结束Boss战模式
    end() {
        this.isActive = false;
        console.log('Boss战模式结束');
    }
}
