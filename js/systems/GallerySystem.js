// 画廊系统 - Boss图鉴
export class GallerySystem {
    constructor() {
        this.storageKey = 'abyssStrider_bossKills';
        this.bossData = this.initBossData();
        this.loadKillCounts();
    }
    
    // 初始化所有Boss数据
    initBossData() {
        return [
            // Lv1
            { id: 'monkey', level: 1, name: '险恶猴子', title: 'Tricky Monkey', isMutated: false, image: 'Monkey.png' },
            { id: 'monkey_mutated', level: 1, name: '噬魂猿魔', title: 'Soul Devourer', isMutated: true, image: 'Evil Monkey.png' },
            // Lv2
            { id: 'ice_dragon', level: 2, name: '冰霜巨龙', title: 'Frost Dragon', isMutated: false, image: 'Ice dragon.png' },
            { id: 'ice_dragon_mutated', level: 2, name: '深渊冰龙', title: 'Abyss Ice Dragon', isMutated: true, image: 'Evil Ice dragon.png' },
            // Lv3
            { id: 'cerberus', level: 3, name: '地狱三头魔犬·刻耳柏洛斯', title: 'Cerberus', isMutated: false, image: 'three head dog.png' },
            { id: 'cerberus_mutated', level: 3, name: '冥界魔犬', title: 'Underworld Hound', isMutated: true, image: 'evil three head dog.png' },
            // Lv4
            { id: 'zeus', level: 4, name: '天穹之王·宙斯', title: 'Zeus', isMutated: false, image: 'zeus.png', lockedImage: 'Zeus locked.png' },
            { id: 'zeus_mutated', level: 4, name: '暴君宙斯', title: 'Tyrant Zeus', isMutated: true, image: 'evil zeus.png', lockedImage: 'Zeus locked.png' },
            // Lv5
            { id: 'arthur', level: 5, name: '圣剑王·亚瑟', title: 'King Arthur', isMutated: false, image: 'boss_arthur.png' },
            { id: 'arthur_mutated', level: 5, name: '堕落骑士·莫德雷德', title: 'Mordred', isMutated: true, image: 'boss_arthur_mutated.png' },
            // Lv6 (Boss战专属)
            { id: 'poseidon', level: 6, name: '鬼化波塞冬', title: 'Ghost Poseidon', isMutated: false, image: 'boss_poseidon.png' },
            // Lv7 (Boss战专属)
            { id: 'artemis', level: 7, name: '狂化阿尔忒弥斯', title: 'Berserk Artemis', isMutated: false, image: 'boss_artemis.png' }
        ];
    }
    
    // 从localStorage加载击杀计数
    loadKillCounts() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            this.killCounts = saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn('Failed to load boss kills:', e);
            this.killCounts = {};
        }
    }
    
    // 保存击杀计数到localStorage
    saveKillCounts() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.killCounts));
        } catch (e) {
            console.warn('Failed to save boss kills:', e);
        }
    }
    
    // 记录Boss击杀（根据Boss名称匹配）
    recordKill(bossName) {
        const boss = this.bossData.find(b => b.name === bossName);
        if (boss) {
            this.killCounts[boss.id] = (this.killCounts[boss.id] || 0) + 1;
            this.saveKillCounts();
            console.log(`📊 记录Boss击杀: ${bossName} (总计: ${this.killCounts[boss.id]})`);
            return true;
        }
        console.warn(`未找到Boss: ${bossName}`);
        return false;
    }
    
    // 获取Boss击杀次数
    getKillCount(bossId) {
        return this.killCounts[bossId] || 0;
    }
    
    // 检查Boss是否已解锁（击杀至少1次）
    isUnlocked(bossId) {
        return this.getKillCount(bossId) >= 1;
    }
    
    // 获取所有Boss数据（带解锁状态）
    getAllBossData() {
        return this.bossData.map(boss => ({
            ...boss,
            kills: this.getKillCount(boss.id),
            unlocked: this.isUnlocked(boss.id)
        }));
    }
    
    // 获取解锁进度
    getProgress() {
        const total = this.bossData.length;
        const unlocked = this.bossData.filter(b => this.isUnlocked(b.id)).length;
        return { unlocked, total, percent: Math.round(unlocked / total * 100) };
    }
}

// 全局画廊系统实例
export const gallerySystem = new GallerySystem();
