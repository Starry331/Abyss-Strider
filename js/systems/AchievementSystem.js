/**
 * 成就系统
 */
export class AchievementSystem {
    constructor() {
        this.achievements = [
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
                id: 'master',
                name: '大师之征',
                desc: '击败最终Boss，通关深渊行者',
                condition: '击败第5层Boss',
                rarity: 'gold',
                unlocked: false
            }
        ];
        
        this.stats = {
            enemiesKilled: 0,
            elitesKilled: 0,
            bossesKilled: 0,
            buildsCollected: 0,
            nearDeathSurvived: false
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
            default: return '🏆';
        }
    }
    
    getRarityColor(rarity) {
        switch(rarity) {
            case 'bronze': return '#cd7f32';
            case 'silver': return '#c0c0c0';
            case 'gold': return '#ffd700';
            default: return '#ffd700';
        }
    }
    
    // 检查成就条件
    checkAchievements() {
        // 初战告捷
        if (this.stats.enemiesKilled >= 1) {
            this.unlock('first_blood');
        }
        
        // 精英猎手
        if (this.stats.elitesKilled >= 1) {
            this.unlock('elite_hunter');
        }
        
        // 屠龙勇士
        if (this.stats.bossesKilled >= 1) {
            this.unlock('boss_slayer');
        }
        
        // 构筑收藏家
        if (this.stats.buildsCollected >= 10) {
            this.unlock('build_collector');
        }
        
        // 幸存者
        if (this.stats.nearDeathSurvived) {
            this.unlock('survivor');
        }
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
    
    recordBossKill() {
        this.stats.bossesKilled++;
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
    
    // 通关解锁大师之征
    unlockMaster() {
        this.unlock('master');
    }
    
    // 渲染成就列表
    renderAchievementList() {
        const container = document.getElementById('achievement-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.achievements.forEach(achievement => {
            const item = document.createElement('div');
            item.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
            
            item.innerHTML = `
                <div class="achievement-cup ${achievement.rarity}">
                    ${this.getCupIcon(achievement.rarity)}
                </div>
                <div class="achievement-details">
                    <div class="achievement-name">${achievement.name}</div>
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
