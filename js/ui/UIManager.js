export class UIManager {
    constructor() {
        this.hud = document.getElementById('hud');
        this.healthBar = document.getElementById('health-bar-fill');
        this.healthText = document.getElementById('health-text');
        this.shieldBar = document.getElementById('shield-bar-fill');
        this.shieldText = document.getElementById('shield-text');
        this.shieldContainer = document.getElementById('shield-bar-container');
        this.scoreDisplay = document.getElementById('score-display');
        this.levelDisplay = document.getElementById('level-display');
        this.bossWarning = document.getElementById('boss-warning');
        this.blessingMenu = document.getElementById('blessing-menu');
        this.blessingOptions = document.getElementById('blessing-options');
        this.buffDisplay = document.getElementById('buff-display');

        this.onBlessingSelect = null;
        this.isBlessingMenuActive = false;
        
        // Buff计时器
        this.activeBuffs = {};
    }

    updateHealth(hp, maxHp = 100) {
        const percent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
        if (this.healthBar) this.healthBar.style.width = `${percent}%`;
        if (this.healthText) this.healthText.innerText = `HP: ${Math.ceil(hp)}/${Math.ceil(maxHp)}`;
    }
    
    updateShield(shield, maxShield = 100) {
        if (shield > 0) {
            if (this.shieldContainer) this.shieldContainer.classList.remove('hidden');
            const percent = Math.max(0, Math.min(100, (shield / maxShield) * 100));
            if (this.shieldBar) this.shieldBar.style.width = `${percent}%`;
            if (this.shieldText) this.shieldText.innerText = `护盾: ${Math.ceil(shield)}`;
        } else {
            if (this.shieldContainer) this.shieldContainer.classList.add('hidden');
        }
    }

    updateScore(score) {
        if (this.scoreDisplay) this.scoreDisplay.innerText = `分数: ${score}`;
    }

    updateLevel(name) {
        if (this.levelDisplay) this.levelDisplay.innerText = name;
    }

    showBossWarning() {
        if (this.bossWarning) this.bossWarning.classList.remove('hidden');
    }

    hideBossWarning() {
        if (this.bossWarning) this.bossWarning.classList.add('hidden');
    }

    // 品质系统配置 - 赐福稀有度概率
    rarityConfig = {
        common:    { name: '普通', color: '#ffffff', borderColor: '#888888', chance: 0.71, icon: '○' },
        rare:      { name: '稀有', color: '#4488ff', borderColor: '#2266dd', chance: 0.20, icon: '◇' },
        epic:      { name: '史诗', color: '#aa44ff', borderColor: '#8822dd', chance: 0.06, icon: '◆' },
        legendary: { name: '传说', color: '#ff4444', borderColor: '#dd2222', chance: 0.02, icon: '★' },
        mythic:    { name: '神话', color: '#ffd700', borderColor: '#ffaa00', chance: 0.01, icon: '✦' }
    };

    // 所有赐福池（攻速效果已削弱）
    blessingPool = [
        // 普通 (基础属性提升)
        { id: 'speed1', cn: '攻速提升', desc: '攻击速度 +5%', effect: 'speed', value: 0.05, rarity: 'common' },
        { id: 'hp1', cn: '生命提升', desc: '最大生命 +20', effect: 'hp', value: 20, rarity: 'common' },
        { id: 'dmg1', cn: '伤害提升', desc: '伤害 +10%', effect: 'damage', value: 0.1, rarity: 'common' },
        { id: 'move1', cn: '移速提升', desc: '移动速度 +8%', effect: 'moveSpeed', value: 0.08, rarity: 'common' },
        { id: 'range1', cn: '范围提升', desc: '攻击范围 +15%', effect: 'range', value: 0.15, rarity: 'common' },
        // 稀有 (进阶属性)
        { id: 'speed2', cn: '疾速', desc: '攻击速度 +10%', effect: 'speed', value: 0.1, rarity: 'rare' },
        { id: 'hp2', cn: '强韧', desc: '最大生命 +50', effect: 'hp', value: 50, rarity: 'rare' },
        { id: 'dmg2', cn: '锋锐', desc: '伤害 +20%', effect: 'damage', value: 0.2, rarity: 'rare' },
        { id: 'crit1', cn: '锐利', desc: '暴击率 +10%', effect: 'crit', value: 0.1, rarity: 'rare' },
        { id: 'def1', cn: '坚固', desc: '减伤 +10%', effect: 'defense', value: 0.1, rarity: 'rare' },
        { id: 'lifesteal1', cn: '吸血', desc: '吸血 +8%', effect: 'lifesteal', value: 0.08, rarity: 'rare' },
        // 史诗 (强力效果)
        { id: 'speed3', cn: '狂风', desc: '攻击速度 +18%', effect: 'speed', value: 0.18, rarity: 'epic' },
        { id: 'hp3', cn: '生命之泉', desc: '最大生命 +100', effect: 'hp', value: 100, rarity: 'epic' },
        { id: 'dmg3', cn: '毁灭', desc: '伤害 +35%', effect: 'damage', value: 0.35, rarity: 'epic' },
        { id: 'crit2', cn: '致命', desc: '暴击率 +20%', effect: 'crit', value: 0.2, rarity: 'epic' },
        { id: 'regen1', cn: '再生', desc: '每秒回复3点生命', effect: 'regen', value: 3, rarity: 'epic' },
        { id: 'lifesteal2', cn: '鲜血渴望', desc: '吸血 +15%', effect: 'lifesteal', value: 0.15, rarity: 'epic' },
        { id: 'combo1', cn: '连击', desc: '每击回复2点生命', effect: 'manaSteal', value: 2, rarity: 'epic' },
        // 传说 (极致效果)
        { id: 'speed4', cn: '闪电', desc: '攻击速度 +25%', effect: 'speed', value: 0.25, rarity: 'legendary' },
        { id: 'hp4', cn: '不屈', desc: '最大生命 +200', effect: 'hp', value: 200, rarity: 'legendary' },
        { id: 'dmg4', cn: '湮灭', desc: '伤害 +50%', effect: 'damage', value: 0.5, rarity: 'legendary' },
        { id: 'critdmg', cn: '处决', desc: '暴击伤害 +100%', effect: 'critDamage', value: 1.0, rarity: 'legendary' },
        { id: 'regen2', cn: '生命源泉', desc: '每秒回复8点生命', effect: 'regen', value: 8, rarity: 'legendary' },
        { id: 'lifesteal3', cn: '血族', desc: '吸血 +25%', effect: 'lifesteal', value: 0.25, rarity: 'legendary' },
        // 神话 (究极效果)
        { id: 'god_atk', cn: '战神', desc: '攻速+40%，伤害+80%', effect: 'godAttack', value: 0.4, rarity: 'mythic' },
        { id: 'god_def', cn: '守护神', desc: '生命+300，减伤50%', effect: 'godDefense', value: 300, rarity: 'mythic' },
        { id: 'god_all', cn: '万神', desc: '全属性+30%', effect: 'godAll', value: 0.3, rarity: 'mythic' },
        { id: 'god_vamp', cn: '血神', desc: '吸血40%，每击回5HP', effect: 'godVampire', value: 0.4, rarity: 'mythic' },
    ];

    rollRarity() {
        const roll = Math.random();
        let cumulative = 0;
        for (const [rarity, config] of Object.entries(this.rarityConfig)) {
            cumulative += config.chance;
            if (roll < cumulative) return rarity;
        }
        return 'common';
    }

    showBlessingMenu(options) {
        this.isBlessingMenuActive = true;
        if (this.blessingMenu) {
            this.blessingMenu.classList.remove('hidden');
            this.blessingOptions.innerHTML = '';
            
            // 生成3个随机赐福，基于品质概率
            const selectedBlessings = [];
            const availablePool = [...this.blessingPool];
            
            for (let i = 0; i < 3 && availablePool.length > 0; i++) {
                const targetRarity = this.rollRarity();
                let candidates = availablePool.filter(b => b.rarity === targetRarity);
                
                // 降级查找
                if (candidates.length === 0) {
                    const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'common'];
                    const targetIndex = rarityOrder.indexOf(targetRarity);
                    for (let r = targetIndex + 1; r < rarityOrder.length && candidates.length === 0; r++) {
                        candidates = availablePool.filter(b => b.rarity === rarityOrder[r]);
                    }
                }
                
                if (candidates.length > 0) {
                    const selected = candidates[Math.floor(Math.random() * candidates.length)];
                    selectedBlessings.push(selected);
                    const idx = availablePool.findIndex(b => b.id === selected.id);
                    if (idx !== -1) availablePool.splice(idx, 1);
                }
            }

            selectedBlessings.forEach(b => {
                const rarityConfig = this.rarityConfig[b.rarity];
                const div = document.createElement('div');
                div.className = 'blessing-card';
                div.style.borderColor = rarityConfig.borderColor;
                div.style.boxShadow = `0 0 12px ${rarityConfig.borderColor}`;
                
                if (b.rarity === 'mythic') {
                    div.style.animation = 'mythicGlow 1.5s ease-in-out infinite';
                }
                
                div.innerHTML = `
                    <div style="color: ${rarityConfig.color}; font-size: 12px; text-shadow: 0 0 8px ${rarityConfig.color};">
                        ${rarityConfig.icon} ${rarityConfig.name}
                    </div>
                    <div style="color: ${rarityConfig.color}; font-weight: bold; font-size: 16px;">${b.cn}</div>
                    <div style="color: #ccc; font-size: 12px;">${b.desc}</div>
                `;
                div.onclick = () => {
                    if (this.onBlessingSelect) this.onBlessingSelect(b);
                    this.hideBlessingMenu();
                };
                this.blessingOptions.appendChild(div);
            });
        }
    }

    hideBlessingMenu() {
        this.isBlessingMenuActive = false;
        if (this.blessingMenu) this.blessingMenu.classList.add('hidden');
    }

    // Buff UI handling - 带倒计时显示
    showBuffIcon(type, icon, duration = 10000) {
        if (!this.buffDisplay) return;
        
        // 如果已存在则先移除
        this.hideBuffIcon(type);
        
        const buffItem = document.createElement('div');
        buffItem.className = 'buff-item';
        buffItem.id = `buff-${type}`;
        
        const buffName = this.getBuffName(type);
        buffItem.innerHTML = `
            <span class="buff-icon">${icon}</span>
            <span class="buff-name">${buffName}</span>
            <span class="buff-timer">${Math.ceil(duration/1000)}s</span>
        `;
        
        this.buffDisplay.appendChild(buffItem);
        
        // 存储buff信息
        const expiresAt = performance.now() + duration;
        this.activeBuffs[type] = {
            element: buffItem,
            expiresAt: expiresAt,
            duration: duration
        };
    }
    
    getBuffName(type) {
        const names = {
            'HP_MAX': '生命提升',
            'ATTACK_BOOST': '攻击强化',
            'SPEED_BOOST': '速度提升',
            'SHIELD': '护盾',
            'ATTACK_SPEED': '攻速提升',
            'CRIT_CHANCE': '暴击提升',
            'LIFESTEAL': '吸血',
            'INVINCIBLE': '无敌',
            'MEGA_BOOST': '全属性'
        };
        return names[type] || type;
    }
    
    // 更新Buff倒计时显示
    updateBuffTimers() {
        const now = performance.now();
        for (const [type, buff] of Object.entries(this.activeBuffs)) {
            const remaining = Math.max(0, buff.expiresAt - now);
            const timerEl = buff.element.querySelector('.buff-timer');
            if (timerEl) {
                timerEl.innerText = `${Math.ceil(remaining/1000)}s`;
            }
            if (remaining <= 0) {
                this.hideBuffIcon(type);
            }
        }
    }

    hideBuffIcon(type) {
        const buff = this.activeBuffs[type];
        if (buff && buff.element && buff.element.parentNode) {
            buff.element.parentNode.removeChild(buff.element);
        }
        delete this.activeBuffs[type];
    }
    
    // 清除所有Buff显示
    clearAllBuffs() {
        for (const type of Object.keys(this.activeBuffs)) {
            this.hideBuffIcon(type);
        }
        if (this.buffDisplay) this.buffDisplay.innerHTML = '';
    }
}
