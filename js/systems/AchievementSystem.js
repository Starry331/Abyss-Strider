/**
 * 成就系统
 */
export class AchievementSystem {
    constructor() {
        this.achievements = [
            // ===== 铜杯成就 =====
            {
                id: 'first_blood',
                name: '初战告捷',
                desc: '击败第一个敌人',
                condition: '击杀任意1只敌人',
                rarity: 'bronze',
                unlocked: false
            },
            {
                id: 'elite_hunter',
                name: '精英猎手',
                desc: '击败一只精英怪',
                condition: '击杀任意精英怪',
                rarity: 'bronze',
                unlocked: false
            },
            {
                id: 'hundred_kills',
                name: '百敌斩',
                desc: '击败100个敌人',
                condition: '累计击杀100只敌人',
                rarity: 'bronze',
                unlocked: false
            },
            {
                id: 'level_2',
                name: '深渊探索者',
                desc: '到达第2层',
                condition: '通过第1关',
                rarity: 'bronze',
                unlocked: false
            },
            {
                id: 'first_build',
                name: '构筑起点',
                desc: '获得第一个构筑',
                condition: '获得任意构筑',
                rarity: 'bronze',
                unlocked: false
            },
            // ===== 银杯成就 =====
            {
                id: 'boss_slayer',
                name: '屠龙勇士',
                desc: '击败第一个Boss',
                condition: '击败任意Boss',
                rarity: 'silver',
                unlocked: false
            },
            {
                id: 'build_collector',
                name: '构筑收藏家',
                desc: '获得10个构筑强化',
                condition: '累计获得10个构筑',
                rarity: 'silver',
                unlocked: false
            },
            {
                id: 'survivor',
                name: '幸存者',
                desc: '在生命值低于10%时存活',
                condition: '生命值低于10%后恢复',
                rarity: 'silver',
                unlocked: false
            },
            {
                id: 'thousand_kills',
                name: '千敌斩',
                desc: '击败1000个敌人',
                condition: '累计击杀1000只敌人',
                rarity: 'silver',
                unlocked: false
            },
            {
                id: 'elite_slayer',
                name: '精英杀手',
                desc: '击败10只精英怪',
                condition: '累计击杀10只精英怪',
                rarity: 'silver',
                unlocked: false
            },
            {
                id: 'boss_hunter',
                name: 'Boss猎人',
                desc: '击败5个Boss',
                condition: '累计击败5个Boss',
                rarity: 'silver',
                unlocked: false
            },
            {
                id: 'level_3',
                name: '勇闯炼狱',
                desc: '到达第3层',
                condition: '通过第2关',
                rarity: 'silver',
                unlocked: false
            },
            {
                id: 'level_4',
                name: '熔岩行者',
                desc: '到达第4层',
                condition: '通过第3关',
                rarity: 'silver',
                unlocked: false
            },
            // ===== 金杯成就 =====
            {
                id: 'mutated_hunter',
                name: '异化猎人',
                desc: '击败一个异化Boss',
                condition: '击败任意异化Boss',
                rarity: 'gold',
                unlocked: false
            },
            {
                id: 'level_5',
                name: '神殿守望者',
                desc: '到达第5层',
                condition: '通过第4关',
                rarity: 'gold',
                unlocked: false
            },
            {
                id: 'build_master',
                name: '构筑大师',
                desc: '获得25个构筑强化',
                condition: '累计获得25个构筑',
                rarity: 'gold',
                unlocked: false
            },
            {
                id: 'elite_destroyer',
                name: '精英毁灭者',
                desc: '击败50只精英怪',
                condition: '累计击杀50只精英怪',
                rarity: 'gold',
                unlocked: false
            },
            {
                id: 'boss_master',
                name: 'Boss征服者',
                desc: '击败15个Boss',
                condition: '累计击败15个Boss',
                rarity: 'gold',
                unlocked: false
            },
            {
                id: 'master',
                name: '大师之征',
                desc: '击败最终Boss，通关深渊行者',
                condition: '击败第5层Boss',
                rarity: 'gold',
                unlocked: false
            },
            // ===== 白金成就 =====
            {
                id: 'perfect_clear',
                name: '完美通关',
                desc: '全程无伤通关一个关卡',
                condition: '无伤通过任意关卡',
                rarity: 'platinum',
                unlocked: false
            },
            {
                id: 'mutated_master',
                name: '异化征服者',
                desc: '击败5个异化Boss',
                condition: '累计击败5个异化Boss',
                rarity: 'platinum',
                unlocked: false
            },
            {
                id: 'legend',
                name: '深渊传奇',
                desc: '解锁所有其他成就',
                condition: '解锁全部成就',
                rarity: 'platinum',
                unlocked: false
            },
            // ===== 隐藏超级杯成就 =====
            {
                id: 'pantheon_king',
                name: '万神殿之王',
                desc: '通关Boss战模式，击败所有神话Boss',
                condition: '完成Boss战挑战',
                rarity: 'super',
                unlocked: false,
                hidden: true
            }
        ];
        
        this.stats = {
            enemiesKilled: 0,
            elitesKilled: 0,
            bossesKilled: 0,
            mutatedBossesKilled: 0,
            buildsCollected: 0,
            nearDeathSurvived: false,
            highestLevel: 1,
            perfectClears: 0,
            bossRushCompleted: false
        };
        
        this.load();
    }
    
    // 保存到localStorage
    save() {
        const data = {
            achievements: this.achievements.map(a => ({ id: a.id, unlocked: a.unlocked })),
            stats: this.stats
        };
        localStorage.setItem('abyssStrider_achievements', JSON.stringify(data));
    }
    
    // 从localStorage加载
    load() {
        const saved = localStorage.getItem('abyssStrider_achievements');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                data.achievements.forEach(saved => {
                    const achievement = this.achievements.find(a => a.id === saved.id);
                    if (achievement) achievement.unlocked = saved.unlocked;
                });
                if (data.stats) this.stats = { ...this.stats, ...data.stats };
            } catch(e) {
                console.error('加载成就失败:', e);
            }
        }
    }
    
    // 解锁成就
    unlock(id) {
        const achievement = this.achievements.find(a => a.id === id);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.save();
            this.showUnlockNotification(achievement);
            return true;
        }
        return false;
    }
    
    // 显示解锁通知
    showUnlockNotification(achievement) {
        // 播放音效
        if (window.audioManager) {
            window.audioManager.playSound('achievement');
        }
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="notif-icon">${this.getCupIcon(achievement.rarity)}</div>
            <div class="notif-text">
                <div class="notif-title">成就解锁!</div>
                <div class="notif-name">${achievement.name}</div>
            </div>
        `;
        
        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(30,30,50,0.95), rgba(50,50,80,0.95));
            border: 2px solid ${this.getRarityColor(achievement.rarity)};
            border-radius: 10px;
            padding: 15px 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 2000;
            animation: slideIn 0.5s ease-out, fadeOut 0.5s ease-in 4.5s forwards;
            box-shadow: 0 0 20px ${this.getRarityColor(achievement.rarity)}40;
        `;
        
        document.body.appendChild(notification);
        
        // 5秒后移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    getCupIcon(rarity) {
        switch(rarity) {
            case 'bronze': return '🥉';
            case 'silver': return '🥈';
            case 'gold': return '🏆';
            case 'platinum': return '💎';
            case 'super': return '👑';
            default: return '🏆';
        }
    }
    
    getRarityColor(rarity) {
        switch(rarity) {
            case 'bronze': return '#cd7f32';
            case 'silver': return '#c0c0c0';
            case 'gold': return '#ffd700';
            case 'platinum': return '#e5e4e2';
            case 'super': return '#ff4444';
            default: return '#ffd700';
        }
    }
    
    // 检查成就条件
    checkAchievements() {
        // ===== 铜杯 =====
        if (this.stats.enemiesKilled >= 1) this.unlock('first_blood');
        if (this.stats.elitesKilled >= 1) this.unlock('elite_hunter');
        if (this.stats.enemiesKilled >= 100) this.unlock('hundred_kills');
        if (this.stats.highestLevel >= 2) this.unlock('level_2');
        if (this.stats.buildsCollected >= 1) this.unlock('first_build');
        
        // ===== 银杯 =====
        if (this.stats.bossesKilled >= 1) this.unlock('boss_slayer');
        if (this.stats.buildsCollected >= 10) this.unlock('build_collector');
        if (this.stats.nearDeathSurvived) this.unlock('survivor');
        if (this.stats.enemiesKilled >= 1000) this.unlock('thousand_kills');
        if (this.stats.elitesKilled >= 10) this.unlock('elite_slayer');
        if (this.stats.bossesKilled >= 5) this.unlock('boss_hunter');
        if (this.stats.highestLevel >= 3) this.unlock('level_3');
        if (this.stats.highestLevel >= 4) this.unlock('level_4');
        
        // ===== 金杯 =====
        if (this.stats.mutatedBossesKilled >= 1) this.unlock('mutated_hunter');
        if (this.stats.highestLevel >= 5) this.unlock('level_5');
        if (this.stats.buildsCollected >= 25) this.unlock('build_master');
        if (this.stats.elitesKilled >= 50) this.unlock('elite_destroyer');
        if (this.stats.bossesKilled >= 15) this.unlock('boss_master');
        
        // ===== 白金 =====
        if (this.stats.perfectClears >= 1) this.unlock('perfect_clear');
        if (this.stats.mutatedBossesKilled >= 5) this.unlock('mutated_master');
        
        // 深渊传奇 - 检查是否解锁了除legend和hidden外的所有成就
        const otherAchievements = this.achievements.filter(a => a.id !== 'legend' && !a.hidden);
        if (otherAchievements.every(a => a.unlocked)) {
            this.unlock('legend');
        }
        
        // ===== 超级杯 =====
        if (this.stats.bossRushCompleted) this.unlock('pantheon_king');
    }
    
    // 记录击杀
    recordEnemyKill() {
        this.stats.enemiesKilled++;
        this.checkAchievements();
        this.save();
    }
    
    recordEliteKill() {
        this.stats.elitesKilled++;
        this.checkAchievements();
        this.save();
    }
    
    recordBossKill(isMutated = false) {
        this.stats.bossesKilled++;
        if (isMutated) {
            this.stats.mutatedBossesKilled++;
        }
        this.checkAchievements();
        this.save();
    }
    
    recordBuildCollected() {
        this.stats.buildsCollected++;
        this.checkAchievements();
        this.save();
    }
    
    recordNearDeathSurvival() {
        this.stats.nearDeathSurvived = true;
        this.checkAchievements();
        this.save();
    }
    
    recordLevelReached(level) {
        if (level > this.stats.highestLevel) {
            this.stats.highestLevel = level;
            this.checkAchievements();
            this.save();
        }
    }
    
    recordPerfectClear() {
        this.stats.perfectClears++;
        this.checkAchievements();
        this.save();
    }
    
    // 通关解锁大师之征
    unlockMaster() {
        this.unlock('master');
    }
    
    // Boss战模式完成 - 解锁万神殿之王
    unlockPantheonKing() {
        this.stats.bossRushCompleted = true;
        this.unlock('pantheon_king');
        this.save();
    }
    
    // 渲染成就列表
    renderAchievementList() {
        const container = document.getElementById('achievement-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.achievements.forEach(achievement => {
            // 隐藏成就只有解锁后才显示
            if (achievement.hidden && !achievement.unlocked) return;
            
            const item = document.createElement('div');
            item.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'} ${achievement.rarity === 'super' ? 'super-achievement' : ''}`;
            
            // 超级杯成就特殊样式
            const isSuper = achievement.rarity === 'super';
            const nameStyle = isSuper ? 'color: #ff4444; text-shadow: 0 0 10px #ff0000;' : '';
            
            item.innerHTML = `
                <div class="achievement-cup ${achievement.rarity}">
                    ${this.getCupIcon(achievement.rarity)}
                </div>
                <div class="achievement-details">
                    <div class="achievement-name" style="${nameStyle}">${achievement.name}</div>
                    <div class="achievement-condition">${achievement.condition}</div>
                </div>
                <div class="achievement-status">
                    ${achievement.unlocked ? '✅' : '🔒'}
                </div>
            `;
            
            container.appendChild(item);
        });
    }
    
    // 获取已解锁数量
    getUnlockedCount() {
        return this.achievements.filter(a => a.unlocked).length;
    }
    
    // 获取总数量
    getTotalCount() {
        return this.achievements.length;
    }
}

// 添加通知动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    .notif-icon { font-size: 36px; }
    .notif-title { font-size: 12px; color: #888; }
    .notif-name { font-size: 16px; font-weight: bold; color: #fff; }
`;
document.head.appendChild(style);
