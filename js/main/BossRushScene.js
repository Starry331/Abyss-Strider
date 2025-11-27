/**
 * Boss战模式场景
 * 连续挑战7个Boss，每个Boss后获得奖励
 */

import { BossRushMode } from '../systems/BossRushMode.js';
import { GhostPoseidonBoss } from '../enemies/PoseidonBoss.js';
import { BerserkArtemisBoss } from '../enemies/ArtemisBoss.js';
import { BossVariety } from '../enemies/BossVariety.js';

export class BossRushScene {
    constructor(config) {
        this.player = null;
        this.combatSystem = config.combatSystem;
        this.weaponSystem = config.weaponSystem;
        this.uiManager = config.uiManager;
        this.audioManager = config.audioManager;
        this.effectManager = config.effectManager;
        this.levelBackground = config.levelBackground;
        this.buildSystem = config.buildSystem;
        this.achievementSystem = config.achievementSystem;
        this.sceneManager = config.sceneManager;
        this.InputManager = config.InputManager;
        this.Player = config.Player;
        this.WeaponSystem = config.WeaponSystem;
        this.BuildSystem = config.BuildSystem;
        
        this.bossRushMode = new BossRushMode();
        this.activeBoss = null;
        this.isActive = false;
        this.isPaused = false;  // 暂停状态（奖励选择时）
        this.rewardPhase = null; // 'build1', 'build2', 'blessing', 'weapon'
        this.rewardCount = 0;
        this.inputManager = null;
        
        // 背景缓存（性能优化：离屏canvas）
        this.bgCache = null;
        this.bgCacheValid = false;
        this.starPositions = []; // 预计算星星位置
        
        // 众神赐福系统
        this.godBlessings = this.initGodBlessings();
        this.godBlessingLevels = [2, 4, 5, 6]; // 这些关卡后触发众神赐福
        
        this.initBackground();
    }
    
    // 初始化众神赐福
    initGodBlessings() {
        return {
            zeus: {
                name: '宙斯', title: 'Zeus', icon: '⚡',
                desc: '天神之王，雷霆加护',
                color: '#ffdd44', bgColor: '#3a3a1a',
                effects: [
                    { name: '雷霆之力', desc: '攻击+30%', apply: (p, ws) => { p.damageBonus = (p.damageBonus || 1) * 1.3; } },
                    { name: '天神庇护', desc: '最大生命+80', apply: (p, ws) => { p.maxHp += 80; p.hp += 80; } },
                    { name: '闪电链', desc: '攻击有20%概率连锁', apply: (p, ws) => { ws.weapons.forEach(w => w.chainChance = 0.2); } }
                ]
            },
            hera: {
                name: '赫拉', title: 'Hera', icon: '👑',
                desc: '婚姻女神，家庭守护',
                color: '#ff88cc', bgColor: '#3a1a2a',
                effects: [
                    { name: '女王威严', desc: '减伤+25%', apply: (p, ws) => { p.damageReduction = (p.damageReduction || 0) + 0.25; } },
                    { name: '家庭祝福', desc: '每秒回复1%生命', apply: (p, ws) => { p.regenRate = (p.regenRate || 0) + 0.01; } },
                    { name: '神后恩典', desc: '护盾+100', apply: (p, ws) => { p.shield = (p.shield || 0) + 100; } }
                ]
            },
            poseidon: {
                name: '波塞冬', title: 'Poseidon', icon: '🔱',
                desc: '海神，风暴主宰',
                color: '#44aaff', bgColor: '#1a2a3a',
                effects: [
                    { name: '海神之怒', desc: '攻击击退敌人', apply: (p, ws) => { ws.weapons.forEach(w => w.knockback = 50); } },
                    { name: '潮汐护盾', desc: '受伤时30%概率免疫', apply: (p, ws) => { p.dodgeChance = (p.dodgeChance || 0) + 0.3; } },
                    { name: '深海力量', desc: '暴击伤害+50%', apply: (p, ws) => { ws.weapons.forEach(w => w.critMultiplier = (w.critMultiplier || 2) + 0.5); } }
                ]
            },
            athena: {
                name: '雅典娜', title: 'Athena', icon: '🦉',
                desc: '智慧女神，战争策略',
                color: '#aaaaff', bgColor: '#2a2a3a',
                effects: [
                    { name: '战争智慧', desc: '暴击率+20%', apply: (p, ws) => { ws.weapons.forEach(w => w.critChance = (w.critChance || 0.2) + 0.2); } },
                    { name: '神盾庇护', desc: '格挡+15%伤害', apply: (p, ws) => { p.blockChance = (p.blockChance || 0) + 0.15; } },
                    { name: '智慧光芒', desc: '移速+20%', apply: (p, ws) => { p.speed *= 1.2; } }
                ]
            },
            apollo: {
                name: '阿波罗', title: 'Apollo', icon: '☀️',
                desc: '光明之神，预言主宰',
                color: '#ffaa44', bgColor: '#3a2a1a',
                effects: [
                    { name: '光明箭矢', desc: '投射物速度+40%', apply: (p, ws) => { ws.projectileSpeedMult = (ws.projectileSpeedMult || 1) * 1.4; } },
                    { name: '预言之眼', desc: '攻击范围+25%', apply: (p, ws) => { ws.weapons.forEach(w => w.range *= 1.25); } },
                    { name: '太阳祝福', desc: '恢复100生命', apply: (p, ws) => { p.hp = Math.min(p.hp + 100, p.maxHp); } }
                ]
            },
            artemis: {
                name: '阿尔忒弥斯', title: 'Artemis', icon: '🌙',
                desc: '狩猎女神，月之守护',
                color: '#cc88ff', bgColor: '#2a1a3a',
                effects: [
                    { name: '猎手本能', desc: '攻速+30%', apply: (p, ws) => { ws.weapons.forEach(w => w.cooldown *= 0.7); } },
                    { name: '月光箭', desc: '攻击穿透敌人', apply: (p, ws) => { ws.weapons.forEach(w => w.pierce = true); } },
                    { name: '野兽之力', desc: '攻击+25%', apply: (p, ws) => { p.damageBonus = (p.damageBonus || 1) * 1.25; } }
                ]
            },
            hades: {
                name: '哈迪斯', title: 'Hades', icon: '💀',
                desc: '冥王，死亡主宰',
                color: '#aa44aa', bgColor: '#2a1a2a',
                effects: [
                    { name: '冥王之握', desc: '击杀回复5%生命', apply: (p, ws) => { p.killHeal = (p.killHeal || 0) + 0.05; } },
                    { name: '死亡印记', desc: '攻击附加持续伤害', apply: (p, ws) => { ws.weapons.forEach(w => w.dot = 5); } },
                    { name: '冥界庇护', desc: '受致命伤时保留1HP(1次)', apply: (p, ws) => { p.deathSave = true; } }
                ]
            }
        };
    }
    
    // 初始化背景（优化版）
    initBackground() {
        // 预计算星星位置
        for (let i = 0; i < 30; i++) { // 减少到30个
            this.starPositions.push({
                x: Math.random(),
                y: Math.random() * 0.6, // 只在上方60%
                size: Math.random() * 1.5 + 0.5,
                twinkleOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    enter() {
        console.log('进入Boss战模式');
        this.isActive = true;
        this.bossRushMode.start();
        
        // 初始化输入管理器
        this.inputManager = new this.InputManager();
        
        // 初始化玩家
        const canvas = document.getElementById('game-canvas');
        this.player = new this.Player(canvas.width / 2, canvas.height / 2, this.inputManager);
        this.player.maxHp = 250; // Boss战更高初始血量
        this.player.hp = 250;
        
        // 重置战斗系统
        this.combatSystem.projectiles = [];
        this.combatSystem.player = this.player;
        
        // 重置武器系统
        if (this.weaponSystem) {
            this.weaponSystem.cooldownTimer = 0;
            // 重置武器等级
            this.weaponSystem.weapons.forEach(w => w.upgradeLevel = 1);
        }
        
        // 清空特效
        if (this.effectManager) {
            this.effectManager.effects = [];
        }
        
        // 显示HUD
        const hud = document.getElementById('hud');
        if (hud) hud.classList.remove('hidden');
        this.uiManager.updateHealth(this.player.hp, this.player.maxHp);
        
        // 隐藏主菜单
        const menu = document.getElementById('main-menu');
        if (menu) menu.classList.add('hidden');
        
        // 播放Boss音乐
        if (this.audioManager) {
            this.audioManager.stopMusic();
        }
        
        // 显示Boss战开始提示
        this.uiManager.showBossWarning();
        
        // 延迟生成第一个Boss
        setTimeout(() => {
            this.uiManager.hideBossWarning();
            this.spawnCurrentBoss();
        }, 3000);
    }
    
    spawnCurrentBoss() {
        const bossInfo = this.bossRushMode.getCurrentBoss();
        if (!bossInfo) {
            // 所有Boss已击败
            this.showBossRushVictory();
            return;
        }
        
        console.log(`生成Boss: ${bossInfo.name} (Lv${bossInfo.level})`);
        
        const canvas = document.getElementById('game-canvas');
        const x = this.player.x + 300;
        const y = this.player.y;
        
        // 根据Boss类型创建
        if (bossInfo.level === 6) {
            this.activeBoss = new GhostPoseidonBoss(x, y, this.player, this.combatSystem);
        } else if (bossInfo.level === 7) {
            this.activeBoss = new BerserkArtemisBoss(x, y, this.player, this.combatSystem);
        } else {
            // 异化Boss 1-5
            this.activeBoss = BossVariety.createBoss(bossInfo.level, x, y, this.player, this.combatSystem, true);
        }
        
        // 更新Boss血条UI
        this.uiManager.updateBossHP(this.activeBoss.hp, this.activeBoss.maxHp, this.activeBoss.name);
        
        // 播放对应Boss音乐
        if (this.audioManager) {
            this.audioManager.playBossMusic(bossInfo.level);
        }
    }
    
    onBossDefeated() {
        console.log('Boss被击败!');
        
        // 记录成就
        if (this.achievementSystem) {
            const bossInfo = this.bossRushMode.getCurrentBoss();
            this.achievementSystem.recordBossKill(bossInfo && bossInfo.isMutated);
        }
        
        // 检查是否还有更多Boss
        const hasMore = this.bossRushMode.onBossDefeated();
        
        if (hasMore) {
            // 开始奖励阶段
            this.startRewardPhase();
        } else {
            // 所有Boss击败
            this.showBossRushVictory();
        }
    }
    
    startRewardPhase() {
        this.isPaused = true;
        this.rewardCount = 0;
        
        // 获取刚击败的Boss等级
        const defeatedLevel = this.bossRushMode.currentBossIndex; // 0-indexed, 所以+1是等级
        
        // 检查是否触发众神赐福（Lv2, Lv4, Lv5, Lv6后）
        if (this.godBlessingLevels.includes(defeatedLevel)) {
            this.rewardPhase = 'godBlessing';
            this.showRewardNotification('🏛️ 众神降临！选择赐福 🏛️', () => {
                this.showNextReward();
            });
        } else {
            this.rewardPhase = 'build1';
            this.showRewardNotification('Boss击败！选择奖励', () => {
                this.showNextReward();
            });
        }
    }
    
    showRewardNotification(text, callback) {
        // 创建通知
        const notif = document.createElement('div');
        notif.className = 'boss-rush-notif';
        notif.innerHTML = `<div class="notif-text">${text}</div>`;
        notif.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(50,20,60,0.95), rgba(30,10,40,0.95));
            border: 2px solid #ffd700; border-radius: 15px; padding: 30px 50px;
            color: #ffd700; font-size: 28px; font-weight: bold; text-align: center;
            z-index: 10000; animation: notifPulse 0.5s ease-out;
            box-shadow: 0 0 30px rgba(255,215,0,0.3);
        `;
        document.body.appendChild(notif);
        
        // 播放音效
        if (this.audioManager) this.audioManager.playSound('levelup');
        
        setTimeout(() => {
            notif.remove();
            if (callback) callback();
        }, 1500);
    }
    
    showNextReward() {
        switch(this.rewardPhase) {
            case 'godBlessing':
                this.showGodBlessingChoice();
                break;
            case 'build1':
            case 'build2':
                this.showBuildChoice(this.rewardPhase === 'build1' ? '第一次构筑选择' : '第二次构筑选择');
                break;
            case 'blessing':
                this.showBlessingChoice();
                break;
            case 'weapon':
                this.showWeaponUpgrade();
                break;
            case 'done':
                this.isPaused = false;
                // 奖励完成，生成下一个Boss
                setTimeout(() => {
                    this.uiManager.showBossWarning();
                    setTimeout(() => {
                        this.uiManager.hideBossWarning();
                        this.spawnCurrentBoss();
                    }, 2000);
                }, 500);
                break;
        }
    }
    
    showBuildChoice(title) {
        // 创建构筑选择UI（触屏优化）
        const builds = this.generateBuilds();
        
        const panel = document.createElement('div');
        panel.id = 'boss-rush-build-panel';
        panel.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 10000;
            padding: 20px; box-sizing: border-box;
        `;
        
        panel.innerHTML = `
            <div style="color: #ffd700; font-size: clamp(22px, 5vw, 32px); margin-bottom: 25px; text-shadow: 0 0 10px #ffd700; text-align: center;">${title}</div>
            <div style="display: flex; gap: clamp(10px, 2vw, 20px); flex-wrap: wrap; justify-content: center; max-width: 100%;">
                ${builds.map((b, i) => `
                    <div class="build-choice" data-index="${i}" style="
                        background: linear-gradient(135deg, ${b.bgColor}, #1a1a2e);
                        border: 2px solid ${b.borderColor}; border-radius: 15px;
                        padding: clamp(15px, 3vw, 25px); width: clamp(130px, 28vw, 200px);
                        cursor: pointer; transition: all 0.3s; text-align: center; color: #fff;
                    ">
                        <div style="font-size: clamp(30px, 7vw, 40px); margin-bottom: 8px;">${b.icon}</div>
                        <div style="font-size: clamp(14px, 3.5vw, 18px); color: ${b.borderColor}; margin-bottom: 6px;">${b.name}</div>
                        <div style="font-size: clamp(11px, 2.5vw, 14px); color: #aaa;">${b.desc}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // 绑定点击和触屏事件
        panel.querySelectorAll('.build-choice').forEach(card => {
            const handleSelect = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(card.dataset.index);
                builds[index].apply();
                if (this.audioManager) this.audioManager.playSound('menu_click');
                panel.remove();
                this.onRewardChosen();
            };
            
            card.addEventListener('click', handleSelect);
            card.addEventListener('touchend', handleSelect);
            
            // 悬停效果
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'scale(1.05)';
                card.style.boxShadow = '0 0 20px rgba(255,255,255,0.3)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'scale(1)';
                card.style.boxShadow = 'none';
            });
        });
    }
    
    generateBuilds() {
        const allBuilds = [
            { name: '生命强化', desc: '最大生命+50', icon: '❤️', bgColor: '#3a1a2a', borderColor: '#ff6666',
              apply: () => { this.player.maxHp += 50; this.player.hp += 50; } },
            { name: '攻击强化', desc: '伤害+20%', icon: '⚔️', bgColor: '#2a2a1a', borderColor: '#ffaa44',
              apply: () => { this.player.damageBonus = (this.player.damageBonus || 1) * 1.2; } },
            { name: '速度强化', desc: '移速+15%', icon: '💨', bgColor: '#1a2a2a', borderColor: '#44aaff',
              apply: () => { this.player.speed *= 1.15; } },
            { name: '暴击强化', desc: '暴击率+10%', icon: '💥', bgColor: '#2a1a2a', borderColor: '#ff44ff',
              apply: () => { this.weaponSystem.weapons.forEach(w => w.critChance = (w.critChance || 0.2) + 0.1); } },
            { name: '护盾赐予', desc: '获得50护盾', icon: '🛡️', bgColor: '#1a2a3a', borderColor: '#4488ff',
              apply: () => { this.player.shield = (this.player.shield || 0) + 50; } },
            { name: '吸血本能', desc: '攻击回复2%生命', icon: '🧛', bgColor: '#3a1a1a', borderColor: '#cc4444',
              apply: () => { this.weaponSystem.weapons.forEach(w => w.lifesteal = (w.lifesteal || 0) + 0.02); } },
        ];
        
        // 随机选3个
        const shuffled = allBuilds.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 3);
    }
    
    showBlessingChoice() {
        const blessings = [
            { name: '生命祝福', desc: '恢复50生命', icon: '💖', color: '#ff6688',
              effect: () => { this.player.hp = Math.min(this.player.hp + 50, this.player.maxHp); } },
            { name: '力量祝福', desc: '伤害+25%', icon: '🔥', color: '#ff8844',
              effect: () => { this.player.damageBonus = (this.player.damageBonus || 1) * 1.25; } },
            { name: '守护祝福', desc: '减伤+15%', icon: '🛡️', color: '#4488ff',
              effect: () => { this.player.damageReduction = (this.player.damageReduction || 0) + 0.15; } },
        ];
        
        const panel = document.createElement('div');
        panel.id = 'boss-rush-blessing-panel';
        panel.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 10000;
            padding: 20px; box-sizing: border-box;
        `;
        
        panel.innerHTML = `
            <div style="color: #ffd700; font-size: clamp(22px, 5vw, 32px); margin-bottom: 25px; text-shadow: 0 0 10px #ffd700; text-align: center;">选择赐福</div>
            <div style="display: flex; gap: clamp(12px, 3vw, 30px); flex-wrap: wrap; justify-content: center;">
                ${blessings.map((b, i) => `
                    <div class="blessing-choice" data-index="${i}" style="
                        background: linear-gradient(135deg, rgba(50,30,60,0.9), rgba(20,10,30,0.9));
                        border: 3px solid ${b.color}; border-radius: 20px;
                        padding: clamp(18px, 4vw, 30px); width: clamp(120px, 26vw, 180px);
                        cursor: pointer; transition: all 0.3s; text-align: center;
                        box-shadow: 0 0 20px ${b.color}40;
                    ">
                        <div style="font-size: clamp(36px, 9vw, 50px); margin-bottom: 12px;">${b.icon}</div>
                        <div style="font-size: clamp(15px, 4vw, 20px); color: ${b.color}; margin-bottom: 8px;">${b.name}</div>
                        <div style="font-size: clamp(11px, 2.5vw, 14px); color: #ccc;">${b.desc}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(panel);
        
        panel.querySelectorAll('.blessing-choice').forEach(card => {
            const handleSelect = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(card.dataset.index);
                blessings[index].effect();
                if (this.audioManager) this.audioManager.playSound('blessing');
                panel.remove();
                this.onRewardChosen();
            };
            
            card.addEventListener('click', handleSelect);
            card.addEventListener('touchend', handleSelect);
            
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'scale(1.08)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'scale(1)';
            });
        });
    }
    
    showWeaponUpgrade() {
        const weapons = this.weaponSystem.weapons;
        
        const panel = document.createElement('div');
        panel.id = 'boss-rush-weapon-panel';
        panel.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 10000;
            padding: 20px; box-sizing: border-box;
        `;
        
        panel.innerHTML = `
            <div style="color: #ffd700; font-size: clamp(22px, 5vw, 32px); margin-bottom: 25px; text-shadow: 0 0 10px #ffd700; text-align: center;">武器升级</div>
            <div style="display: flex; gap: clamp(10px, 2vw, 25px); flex-wrap: wrap; justify-content: center;">
                ${weapons.map((w, i) => {
                    const maxed = w.upgradeLevel >= 8;
                    return `
                    <div class="weapon-upgrade-choice" data-index="${i}" style="
                        background: linear-gradient(135deg, #2a2a3a, #1a1a2a);
                        border: 2px solid ${maxed ? '#666' : '#ffd700'}; border-radius: 15px;
                        padding: clamp(15px, 3vw, 25px); width: clamp(120px, 26vw, 180px);
                        cursor: ${maxed ? 'not-allowed' : 'pointer'}; transition: all 0.3s;
                        text-align: center; opacity: ${maxed ? 0.5 : 1};
                    ">
                        <div style="font-size: clamp(28px, 7vw, 36px); margin-bottom: 8px;">${w.name === 'Staff' ? '🪄' : w.name === 'Longsword' ? '🗡️' : '⚔️'}</div>
                        <div style="font-size: clamp(14px, 3.5vw, 18px); color: #ffd700; margin-bottom: 6px;">${w.cnName}</div>
                        <div style="font-size: clamp(11px, 2.5vw, 14px); color: #aaa;">Lv${w.upgradeLevel} → Lv${Math.min(w.upgradeLevel + 1, 8)}</div>
                        ${maxed ? '<div style="color: #666; font-size: clamp(10px, 2vw, 12px); margin-top: 4px;">已满级</div>' : ''}
                    </div>
                `}).join('')}
            </div>
        `;
        
        document.body.appendChild(panel);
        
        panel.querySelectorAll('.weapon-upgrade-choice').forEach(card => {
            const index = parseInt(card.dataset.index);
            const weapon = weapons[index];
            
            if (weapon.upgradeLevel < 8) {
                const handleSelect = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    weapon.upgradeLevel++;
                    if (this.audioManager) this.audioManager.playSound('upgrade');
                    panel.remove();
                    this.onRewardChosen();
                };
                
                card.addEventListener('click', handleSelect);
                card.addEventListener('touchend', handleSelect);
                
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'scale(1.05)';
                    card.style.boxShadow = '0 0 20px rgba(255,215,0,0.4)';
                });
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'scale(1)';
                    card.style.boxShadow = 'none';
                });
            }
        });
    }
    
    // 众神赐福选择（触屏优化）
    showGodBlessingChoice() {
        // 随机选3位神明
        const godKeys = Object.keys(this.godBlessings);
        const shuffled = godKeys.sort(() => Math.random() - 0.5);
        const selectedGods = shuffled.slice(0, 3);
        
        const panel = document.createElement('div');
        panel.id = 'god-blessing-panel';
        panel.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(180deg, rgba(20,10,40,0.95), rgba(10,5,20,0.98));
            display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 10000;
            padding: 20px; box-sizing: border-box;
        `;
        
        // 为每位神明随机选一个效果
        const godChoices = selectedGods.map(key => {
            const god = this.godBlessings[key];
            const effect = god.effects[Math.floor(Math.random() * god.effects.length)];
            return { key, god, effect };
        });
        
        panel.innerHTML = `
            <div style="color: #ffd700; font-size: clamp(24px, 5vw, 36px); margin-bottom: 20px; text-shadow: 0 0 20px #ffd700; text-align: center;">
                🏛️ 众神的赐福 🏛️
            </div>
            <div style="color: #aaa; font-size: clamp(14px, 3vw, 18px); margin-bottom: 30px; text-align: center;">
                选择一位神明获得其赐福
            </div>
            <div style="display: flex; gap: clamp(10px, 2vw, 25px); flex-wrap: wrap; justify-content: center; max-width: 100%; padding: 0 10px;">
                ${godChoices.map((choice, i) => `
                    <div class="god-card" data-index="${i}" style="
                        background: linear-gradient(135deg, ${choice.god.bgColor}, #0a0510);
                        border: 3px solid ${choice.god.color}; border-radius: 20px;
                        padding: clamp(15px, 3vw, 30px); width: clamp(140px, 28vw, 200px);
                        cursor: pointer; transition: all 0.3s; text-align: center;
                        box-shadow: 0 0 25px ${choice.god.color}40;
                        min-height: 180px; display: flex; flex-direction: column;
                        justify-content: space-between;
                    ">
                        <div style="font-size: clamp(36px, 8vw, 56px); margin-bottom: 10px;">${choice.god.icon}</div>
                        <div style="font-size: clamp(16px, 4vw, 22px); color: ${choice.god.color}; font-weight: bold; margin-bottom: 5px;">
                            ${choice.god.name}
                        </div>
                        <div style="font-size: clamp(10px, 2.5vw, 12px); color: #888; margin-bottom: 10px; font-style: italic;">
                            ${choice.god.title}
                        </div>
                        <div style="
                            background: rgba(0,0,0,0.4); border-radius: 10px; padding: 10px;
                            border: 1px solid ${choice.god.color}50;
                        ">
                            <div style="font-size: clamp(12px, 3vw, 16px); color: #fff; font-weight: bold; margin-bottom: 5px;">
                                ${choice.effect.name}
                            </div>
                            <div style="font-size: clamp(11px, 2.5vw, 14px); color: #ccc;">
                                ${choice.effect.desc}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // 绑定点击事件
        panel.querySelectorAll('.god-card').forEach(card => {
            const handleSelect = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(card.dataset.index);
                const choice = godChoices[index];
                
                // 应用赐福效果
                choice.effect.apply(this.player, this.weaponSystem);
                
                // 播放音效
                if (this.audioManager) this.audioManager.playSound('blessing');
                
                // 显示获得提示
                this.showRewardNotification(`获得 ${choice.god.name} 的赐福：${choice.effect.name}`, () => {});
                
                panel.remove();
                this.onRewardChosen();
            };
            
            card.addEventListener('click', handleSelect);
            card.addEventListener('touchend', handleSelect);
            
            // 悬停效果
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'scale(1.08) translateY(-5px)';
                card.style.boxShadow = `0 0 40px ${godChoices[parseInt(card.dataset.index)].god.color}80`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'scale(1)';
                card.style.boxShadow = `0 0 25px ${godChoices[parseInt(card.dataset.index)].god.color}40`;
            });
        });
    }
    
    onRewardChosen() {
        // 进入下一个奖励阶段
        switch(this.rewardPhase) {
            case 'godBlessing':
                this.rewardPhase = 'build1'; // 众神赐福后继续正常奖励
                break;
            case 'build1':
                this.rewardPhase = 'build2';
                break;
            case 'build2':
                this.rewardPhase = 'blessing';
                break;
            case 'blessing':
                this.rewardPhase = 'weapon';
                break;
            case 'weapon':
                this.rewardPhase = 'done';
                break;
        }
        
        // 短延迟后显示下一个奖励
        setTimeout(() => this.showNextReward(), 300);
    }
    
    showBossRushVictory() {
        console.log('Boss战模式胜利!');
        this.isActive = false;
        
        // 解锁成就
        if (this.achievementSystem) {
            this.achievementSystem.unlockPantheonKing();
        }
        
        // 停止音乐
        if (this.audioManager) {
            this.audioManager.stopMusic();
            this.audioManager.playSound('victory');
        }
        
        // 隐藏HUD
        document.getElementById('hud').classList.add('hidden');
        
        // 显示Boss战胜利画面
        const victoryScreen = document.getElementById('boss-rush-victory');
        if (victoryScreen) {
            victoryScreen.classList.remove('hidden');
        }
        
        // 绑定返回按钮
        const btnReturn = document.getElementById('btn-boss-rush-menu');
        if (btnReturn) {
            const handleReturn = (e) => {
                e.preventDefault();
                victoryScreen.classList.add('hidden');
                this.sceneManager.switchTo('menu');
            };
            btnReturn.onclick = handleReturn;
        }
    }
    
    update(deltaTime) {
        if (!this.isActive || !this.player) return;
        
        // 暂停时不更新游戏逻辑
        if (this.isPaused) return;
        
        // 更新玩家
        this.player.update(deltaTime);
        
        // 边界检测
        const canvas = document.getElementById('game-canvas');
        this.player.x = Math.max(this.player.radius, Math.min(canvas.width - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(canvas.height - this.player.radius, this.player.y));
        
        // 更新战斗系统
        this.combatSystem.update(deltaTime);
        
        // 更新武器系统并处理攻击
        if (this.weaponSystem) {
            this.weaponSystem.update(deltaTime, this.player);
            
            // 处理武器攻击Boss
            if (this.activeBoss && this.inputManager) {
                const weapon = this.weaponSystem.currentWeapon;
                if (this.weaponSystem.cooldownTimer <= 0 && this.inputManager.isAttacking) {
                    // 检测是否击中Boss
                    const dx = this.activeBoss.x - this.player.x;
                    const dy = this.activeBoss.y - this.player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < weapon.range + this.activeBoss.radius) {
                        // 计算伤害
                        let damage = weapon.damage;
                        // 暴击计算
                        if (Math.random() < (weapon.critChance || 0.2)) {
                            damage *= (weapon.critMultiplier || 2.0);
                        }
                        
                        this.activeBoss.hp -= damage;
                        this.weaponSystem.cooldownTimer = weapon.cooldown;
                        
                        // 播放攻击音效
                        if (this.audioManager) {
                            this.audioManager.playSound('hit');
                        }
                    }
                }
            }
        }
        
        // 更新Boss
        if (this.activeBoss) {
            this.activeBoss.update(deltaTime);
            
            // 检查玩家投射物对Boss的伤害
            this.combatSystem.projectiles.forEach(proj => {
                if (!proj.isEnemy && proj.lifetime > 0) {
                    const dx = this.activeBoss.x - proj.x;
                    const dy = this.activeBoss.y - proj.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < proj.radius + this.activeBoss.radius) {
                        this.activeBoss.hp -= proj.damage;
                        proj.lifetime = 0; // 销毁投射物
                    }
                }
            });
            
            // 检查Boss投射物对玩家的伤害
            this.combatSystem.projectiles.forEach(proj => {
                if (proj.isEnemy && proj.lifetime > 0) {
                    const dx = this.player.x - proj.x;
                    const dy = this.player.y - proj.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < proj.radius + this.player.radius) {
                        const dmg = proj.damage * (1 - (this.player.damageReduction || 0));
                        this.player.hp -= dmg;
                        proj.lifetime = 0;
                        if (this.audioManager) {
                            this.audioManager.playSound('hurt');
                        }
                    }
                }
            });
            
            // 检查Boss是否被击败
            if (this.activeBoss.hp <= 0) {
                if (this.audioManager) {
                    this.audioManager.playSound('boss_death');
                }
                this.activeBoss = null;
                this.onBossDefeated();
            } else {
                // 更新Boss血条
                this.uiManager.updateBossHP(this.activeBoss.hp, this.activeBoss.maxHp, this.activeBoss.name);
            }
        }
        
        // 更新特效
        if (this.effectManager) {
            this.effectManager.update(deltaTime);
        }
        
        // 更新UI
        this.uiManager.updateHealth(this.player.hp, this.player.maxHp);
        
        // 检查玩家死亡
        if (this.player.hp <= 0) {
            this.onPlayerDeath();
        }
    }
    
    onPlayerDeath() {
        console.log('Boss战失败');
        this.isActive = false;
        
        if (this.audioManager) {
            this.audioManager.stopMusic();
            this.audioManager.playSound('death');
        }
        
        // 显示失败画面
        setTimeout(() => {
            alert('挑战失败! 返回主菜单重试。');
            this.sceneManager.switchTo('menu');
        }, 1000);
    }
    
    draw(ctx) {
        if (!this.player) return;
        
        const canvas = ctx.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // ===== 万神殿背景 =====
        this.drawPantheonBackground(ctx, w, h);
        
        // 绘制Boss
        if (this.activeBoss) {
            this.activeBoss.draw(ctx);
        }
        
        // 绘制战斗系统（投射物等）
        this.combatSystem.draw(ctx);
        
        // 绘制玩家
        this.player.draw(ctx);
        
        // 绘制武器特效
        if (this.weaponSystem) {
            const time = Date.now() / 1000;
            this.weaponSystem.drawWeaponEffects(ctx, this.player, time);
        }
        
        // 绘制特效
        if (this.effectManager) {
            this.effectManager.draw(ctx);
        }
        
        // 绘制进度指示
        this.drawProgress(ctx);
        
        // 暂停遮罩
        if (this.isPaused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, w, h);
        }
    }
    
    // 万神殿背景绘制（性能优化版）
    drawPantheonBackground(ctx, w, h) {
        // 缓存静态背景到离屏canvas
        if (!this.bgCache || this.bgCache.width !== w || this.bgCache.height !== h) {
            this.createBackgroundCache(w, h);
        }
        
        // 绘制缓存的静态背景
        ctx.drawImage(this.bgCache, 0, 0);
        
        // 只绘制动态元素（星星闪烁和光环）
        const time = Date.now();
        
        // 简化的星星闪烁
        ctx.save();
        this.starPositions.forEach(star => {
            const twinkle = Math.sin(time / 800 + star.twinkleOffset) * 0.4 + 0.6;
            ctx.globalAlpha = twinkle * 0.7;
            ctx.fillStyle = '#fff';
            ctx.fillRect(star.x * w - star.size/2, star.y * h - star.size/2, star.size, star.size);
        });
        ctx.restore();
        
        // 简化的中央光环脉动
        ctx.save();
        ctx.globalAlpha = 0.1 + Math.sin(time / 1500) * 0.05;
        ctx.fillStyle = 'rgba(255, 200, 100, 0.15)';
        ctx.beginPath();
        ctx.arc(w/2, h/2 - 30, 150, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    // 创建背景缓存
    createBackgroundCache(w, h) {
        this.bgCache = document.createElement('canvas');
        this.bgCache.width = w;
        this.bgCache.height = h;
        const ctx = this.bgCache.getContext('2d');
        
        // 天空渐变
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#080412');
        skyGrad.addColorStop(0.4, '#100818');
        skyGrad.addColorStop(1, '#0a0510');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);
        
        // 简化石柱（4根）
        const pillarPositions = [0.15, 0.35, 0.65, 0.85];
        pillarPositions.forEach(xRatio => {
            const px = xRatio * w;
            const pw = w * 0.035;
            const ph = h * 0.55;
            
            ctx.fillStyle = '#1a1520';
            ctx.fillRect(px - pw/2, h - ph, pw, ph);
            ctx.fillStyle = '#252030';
            ctx.fillRect(px - pw/2 - 4, h - ph - 12, pw + 8, 12);
            ctx.fillRect(px - pw/2 - 4, h - 15, pw + 8, 15);
        });
        
        // 地面
        ctx.fillStyle = '#0c0810';
        ctx.fillRect(0, h - 50, w, 50);
        
        // 中央光柱（静态部分）
        const beamGrad = ctx.createLinearGradient(w/2 - 80, 0, w/2 + 80, 0);
        beamGrad.addColorStop(0, 'transparent');
        beamGrad.addColorStop(0.5, 'rgba(255, 200, 100, 0.06)');
        beamGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(w/2 - 100, 0, 200, h);
    }
    
    drawProgress(ctx) {
        const progress = this.bossRushMode.getProgress();
        const text = `Boss战进度: ${progress.current}/${progress.total}`;
        
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(text, ctx.canvas.width - 20, 30);
    }
    
    exit() {
        this.isActive = false;
        this.activeBoss = null;
        this.bossRushMode.end();
    }
}
