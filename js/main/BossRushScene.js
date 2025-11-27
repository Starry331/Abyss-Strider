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
        
        // 血包和限时buff系统
        this.pickups = [];
        this.pickupSpawnTimer = 0;
        this.pickupSpawnInterval = 8; // 每8秒尝试生成
        this.healthPackChance = 0.25; // 血包概率25%（略微增加）
        this.buffChance = 0.15; // 限时buff概率15%
        
        this.initBackground();
    }
    
    // 初始化众神赐福（平衡版：蓝/紫/金/红稀有度）
    initGodBlessings() {
        return {
            // ===== 蓝色稀有度（基础，弱效果） =====
            poseidon: {
                name: '波塞冬', title: 'Poseidon', icon: '🔱', rarity: 'blue',
                desc: '海神，风暴主宰',
                color: '#44aaff', bgColor: '#1a2a3a',
                effects: [
                    { name: '海神之怒', desc: '攻击微弱击退', apply: (p, ws) => { ws.weapons.forEach(w => w.knockback = 10); } },
                    { name: '潮汐护盾', desc: '受伤时8%概率免疫', apply: (p, ws) => { p.dodgeChance = (p.dodgeChance || 0) + 0.08; } },
                    { name: '深海力量', desc: '暴击伤害+15%', apply: (p, ws) => { ws.weapons.forEach(w => w.critMultiplier = (w.critMultiplier || 2) + 0.15); } }
                ]
            },
            apollo: {
                name: '阿波罗', title: 'Apollo', icon: '☀️', rarity: 'blue',
                desc: '光明之神，预言主宰',
                color: '#ffaa44', bgColor: '#3a2a1a',
                effects: [
                    { name: '光明箭矢', desc: '投射物速度+15%', apply: (p, ws) => { ws.projectileSpeedMult = (ws.projectileSpeedMult || 1) * 1.15; } },
                    { name: '预言之眼', desc: '攻击范围+10%', apply: (p, ws) => { ws.weapons.forEach(w => w.range *= 1.1); } },
                    { name: '太阳祝福', desc: '恢复40生命', apply: (p, ws) => { p.hp = Math.min(p.hp + 40, p.maxHp); } }
                ]
            },
            
            // ===== 紫色稀有度（中等，适中效果） =====
            zeus: {
                name: '宙斯', title: 'Zeus', icon: '⚡', rarity: 'purple',
                desc: '天神之王，雷霆加护',
                color: '#ffdd44', bgColor: '#3a3a1a',
                effects: [
                    { name: '雷霆之力', desc: '攻击+25%', apply: (p, ws) => { p.damageBonus = (p.damageBonus || 1) * 1.25; } },
                    { name: '天神庇护', desc: '最大生命+60', apply: (p, ws) => { p.maxHp += 60; p.hp += 60; } },
                    { name: '闪电链', desc: '攻击有15%概率连锁', apply: (p, ws) => { ws.weapons.forEach(w => w.chainChance = 0.15); } }
                ]
            },
            hera: {
                name: '赫拉', title: 'Hera', icon: '👑', rarity: 'purple',
                desc: '婚姻女神，家庭守护',
                color: '#ff88cc', bgColor: '#3a1a2a',
                effects: [
                    { name: '女王威严', desc: '减伤+18%', apply: (p, ws) => { p.damageReduction = (p.damageReduction || 0) + 0.18; } },
                    { name: '家庭祝福', desc: '每秒回复0.3%生命', apply: (p, ws) => { p.regenRate = (p.regenRate || 0) + 0.003; } },
                    { name: '神后恩典', desc: '护盾+60', apply: (p, ws) => { p.shield = (p.shield || 0) + 60; } }
                ]
            },
            athena: {
                name: '雅典娜', title: 'Athena', icon: '🦉', rarity: 'purple',
                desc: '智慧女神，战争策略',
                color: '#aaaaff', bgColor: '#2a2a3a',
                effects: [
                    { name: '战争智慧', desc: '暴击率+12%', apply: (p, ws) => { ws.weapons.forEach(w => w.critChance = (w.critChance || 0.2) + 0.12); } },
                    { name: '神盾庇护', desc: '格挡+10%伤害', apply: (p, ws) => { p.blockChance = (p.blockChance || 0) + 0.1; } },
                    { name: '智慧光芒', desc: '移速+15%', apply: (p, ws) => { p.speed *= 1.15; } }
                ]
            },
            artemis: {
                name: '阿尔忒弥斯', title: 'Artemis', icon: '🌙', rarity: 'purple',
                desc: '狩猎女神，月之守护',
                color: '#cc88ff', bgColor: '#2a1a3a',
                effects: [
                    { name: '猎手本能', desc: '攻速+20%', apply: (p, ws) => { ws.weapons.forEach(w => w.cooldown *= 0.8); } },
                    { name: '月光箭', desc: '攻击穿透敌人', apply: (p, ws) => { ws.weapons.forEach(w => w.pierce = true); } },
                    { name: '野兽之力', desc: '攻击+20%', apply: (p, ws) => { p.damageBonus = (p.damageBonus || 1) * 1.2; } }
                ]
            },
            
            // ===== 金色稀有度（稀有，下调） =====
            hecate: {
                name: '赫卡忒', title: 'Hecate', icon: '🔮', rarity: 'gold',
                desc: '魔法女神，三相女神',
                color: '#ff66ff', bgColor: '#3a1a3a',
                effects: [
                    { name: '三重魔法', desc: '攻击+40%，暴击+15%', apply: (p, ws) => { 
                        p.damageBonus = (p.damageBonus || 1) * 1.4; 
                        ws.weapons.forEach(w => w.critChance = (w.critChance || 0.2) + 0.15);
                    }},
                    { name: '月之咒术', desc: '攻速+35%，范围+20%', apply: (p, ws) => { 
                        ws.weapons.forEach(w => { w.cooldown *= 0.65; w.range *= 1.2; });
                    }},
                    { name: '冥界钥匙', desc: '死亡时复活一次(满血)', apply: (p, ws) => { 
                        p.resurrectCount = (p.resurrectCount || 0) + 1;
                    }}
                ]
            },
            gaea: {
                name: '盖亚', title: 'Gaea', icon: '🌍', rarity: 'gold',
                desc: '大地母神，万物之源',
                color: '#44ff44', bgColor: '#1a3a1a',
                effects: [
                    { name: '大地之力', desc: '最大生命+120，减伤+30%', apply: (p, ws) => { 
                        p.maxHp += 120; p.hp += 120;
                        p.damageReduction = (p.damageReduction || 0) + 0.3;
                    }},
                    { name: '自然恩赐', desc: '每秒回复1%生命，护盾+100', apply: (p, ws) => { 
                        p.regenRate = (p.regenRate || 0) + 0.01;
                        p.shield = (p.shield || 0) + 100;
                    }},
                    { name: '泰坦血脉', desc: '攻击+50%，轻微击退', apply: (p, ws) => { 
                        p.damageBonus = (p.damageBonus || 1) * 1.5;
                        ws.weapons.forEach(w => w.knockback = 30);
                    }}
                ]
            },
            
            // ===== 红色稀有度（传说） =====
            hades: {
                name: '哈迪斯', title: 'Hades', icon: '💀', rarity: 'red',
                desc: '冥王，死亡主宰',
                color: '#aa44aa', bgColor: '#2a1a2a',
                effects: [
                    { name: '冥王之握', desc: '攻击5%吸血', apply: (p, ws) => { 
                        ws.weapons.forEach(w => w.lifesteal = (w.lifesteal || 0) + 0.05);
                    }},
                    { name: '死亡印记', desc: '攻击附加持续伤害', apply: (p, ws) => { 
                        ws.weapons.forEach(w => w.dot = (w.dot || 0) + 10);
                    }},
                    { name: '冥界复活', desc: '死亡时复活一次(满血)', apply: (p, ws) => { 
                        p.resurrectCount = (p.resurrectCount || 0) + 1;
                    }}
                ]
            },
            prometheus: {
                name: '普罗米修斯', title: 'Prometheus', icon: '🔥', rarity: 'red',
                desc: '盗火者，人类守护神',
                color: '#ff6622', bgColor: '#3a2a1a',
                effects: [
                    { name: '神火赐福', desc: '攻击+60%，附加灼烧', apply: (p, ws) => { 
                        p.damageBonus = (p.damageBonus || 1) * 1.6;
                        ws.weapons.forEach(w => w.dot = 12);
                    }},
                    { name: '不屈意志', desc: '复活一次，减伤+20%', apply: (p, ws) => { 
                        p.resurrectCount = (p.resurrectCount || 0) + 1;
                        p.damageReduction = (p.damageReduction || 0) + 0.2;
                    }},
                    { name: '先知智慧', desc: '暴击+25%，暴伤+60%', apply: (p, ws) => { 
                        ws.weapons.forEach(w => {
                            w.critChance = (w.critChance || 0.2) + 0.25;
                            w.critMultiplier = (w.critMultiplier || 2) + 0.6;
                        });
                    }}
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
        this.isResurrecting = false; // 重置复活状态
        
        // 重新初始化BossRushMode确保干净状态
        this.bossRushMode = new BossRushMode();
        this.bossRushMode.start();
        
        // 初始化输入管理器
        this.inputManager = new this.InputManager();
        
        // 初始化玩家
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Canvas not found!');
            return;
        }
        this.player = new this.Player(canvas.width / 2, canvas.height / 2, this.inputManager);
        this.player.maxHp = 250; // Boss战更高初始血量
        this.player.hp = 250;
        this.player.resurrectCount = 0; // 重置复活次数
        this.player.invincibleTime = 0; // 重置无敌时间
        
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
        if (!canvas) {
            console.error('Canvas not found in spawnCurrentBoss!');
            return;
        }
        
        // 确保Boss生成在画布中央右侧
        const x = Math.min(canvas.width * 0.7, canvas.width - 100);
        const y = canvas.height / 2;
        
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
        
        // 播放对应Boss专属BGM
        if (this.audioManager) {
            // 尝试播放专属BGM，若不存在则使用默认Boss音乐
            if (bossInfo.bgm && this.audioManager.sounds[bossInfo.bgm]) {
                this.audioManager.playMusic(bossInfo.bgm);
            } else {
                this.audioManager.playBossMusic(bossInfo.level);
            }
        }
        
        // 清空场上的拾取物
        this.pickups = [];
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
        this.currentDefeatedLevel = defeatedLevel; // 保存用于奖励流程判断
        
        // Lv5特殊奖励：4次构筑 + 2次赐福
        if (defeatedLevel === 5) {
            this.lv5BonusBuilds = 4;
            this.lv5BonusBlessings = 2;
        } else {
            this.lv5BonusBuilds = 0;
            this.lv5BonusBlessings = 0;
        }
        
        // 检查是否触发众神赐福（Lv2, Lv4, Lv5, Lv6后）
        if (this.godBlessingLevels.includes(defeatedLevel)) {
            this.rewardPhase = 'godBlessing';
            this.showRewardNotification('🏛️ 众神降临！选择赐福 🏛️', () => {
                this.showNextReward();
            });
        } else if (defeatedLevel === 5) {
            // Lv5特殊奖励开始
            this.rewardPhase = 'lv5_build1';
            this.showRewardNotification('🎉 击败Lv5 Boss！丰厚奖励！ 🎉', () => {
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
            // Lv5特殊奖励：4次构筑
            case 'lv5_build1':
            case 'lv5_build2':
            case 'lv5_build3':
            case 'lv5_build4':
                const buildNum = parseInt(this.rewardPhase.split('_build')[1]);
                this.showBuildChoice(`构筑选择 (${buildNum}/4)`);
                break;
            // Lv5特殊奖励：2次赐福
            case 'lv5_blessing1':
            case 'lv5_blessing2':
                const blessNum = parseInt(this.rewardPhase.split('_blessing')[1]);
                this.showBlessingChoice(`赐福选择 (${blessNum}/2)`);
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
    
    showBlessingChoice(title = '选择赐福') {
        const blessings = [
            { name: '生命祝福', desc: '恢复80生命', icon: '💖', color: '#ff6688',
              effect: () => { this.player.hp = Math.min(this.player.hp + 80, this.player.maxHp); } },
            { name: '力量祝福', desc: '伤害+30%', icon: '🔥', color: '#ff8844',
              effect: () => { this.player.damageBonus = (this.player.damageBonus || 1) * 1.3; } },
            { name: '守护祝福', desc: '减伤+20%', icon: '🛡️', color: '#4488ff',
              effect: () => { this.player.damageReduction = (this.player.damageReduction || 0) + 0.2; } },
            { name: '速度祝福', desc: '移速+25%', icon: '💨', color: '#44ffaa',
              effect: () => { this.player.speed *= 1.25; } },
            { name: '暴击祝福', desc: '暴击率+15%', icon: '💥', color: '#ff44ff',
              effect: () => { this.weaponSystem.weapons.forEach(w => w.critChance = (w.critChance || 0.2) + 0.15); } },
        ];
        
        // 随机选3个
        const shuffled = blessings.sort(() => Math.random() - 0.5);
        const selectedBlessings = shuffled.slice(0, 3);
        
        const panel = document.createElement('div');
        panel.id = 'boss-rush-blessing-panel';
        panel.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 10000;
            padding: 20px; box-sizing: border-box;
        `;
        
        panel.innerHTML = `
            <div style="color: #ffd700; font-size: clamp(22px, 5vw, 32px); margin-bottom: 25px; text-shadow: 0 0 10px #ffd700; text-align: center;">${title}</div>
            <div style="display: flex; gap: clamp(12px, 3vw, 30px); flex-wrap: wrap; justify-content: center;">
                ${selectedBlessings.map((b, i) => `
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
                selectedBlessings[index].effect();
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
        // 稀有度颜色和边框
        const rarityStyles = {
            blue: { border: '#4488ff', glow: '#4488ff60', label: '蓝', labelBg: '#224488' },
            purple: { border: '#aa66ff', glow: '#aa66ff70', label: '紫', labelBg: '#442266' },
            gold: { border: '#ffd700', glow: '#ffd70080', label: '金', labelBg: '#665500' },
            red: { border: '#ff4444', glow: '#ff444480', label: '红', labelBg: '#662222' }
        };
        
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
            const rarity = rarityStyles[god.rarity] || rarityStyles.blue;
            return { key, god, effect, rarity };
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
                        border: 4px solid ${choice.rarity.border}; border-radius: 20px;
                        padding: clamp(15px, 3vw, 30px); width: clamp(140px, 28vw, 200px);
                        cursor: pointer; transition: all 0.3s; text-align: center;
                        box-shadow: 0 0 30px ${choice.rarity.glow};
                        min-height: 200px; display: flex; flex-direction: column;
                        justify-content: space-between; position: relative;
                    ">
                        <div style="position: absolute; top: -12px; right: 10px; 
                            background: ${choice.rarity.labelBg}; color: ${choice.rarity.border};
                            padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: bold;
                            border: 2px solid ${choice.rarity.border};">
                            ${choice.rarity.label}
                        </div>
                        <div style="font-size: clamp(36px, 8vw, 56px); margin-bottom: 10px;">${choice.god.icon}</div>
                        <div style="font-size: clamp(16px, 4vw, 22px); color: ${choice.god.color}; font-weight: bold; margin-bottom: 5px;">
                            ${choice.god.name}
                        </div>
                        <div style="font-size: clamp(10px, 2.5vw, 12px); color: #888; margin-bottom: 10px; font-style: italic;">
                            ${choice.god.title}
                        </div>
                        <div style="
                            background: rgba(0,0,0,0.5); border-radius: 10px; padding: 12px;
                            border: 2px solid ${choice.rarity.border}40;
                        ">
                            <div style="font-size: clamp(12px, 3vw, 16px); color: ${choice.rarity.border}; font-weight: bold; margin-bottom: 5px;">
                                ${choice.effect.name}
                            </div>
                            <div style="font-size: clamp(11px, 2.5vw, 14px); color: #ddd;">
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
                // 众神赐福后，检查是否是Lv5
                if (this.currentDefeatedLevel === 5) {
                    this.rewardPhase = 'lv5_build1';
                } else {
                    this.rewardPhase = 'build1';
                }
                break;
            // Lv5特殊奖励流程
            case 'lv5_build1':
                this.rewardPhase = 'lv5_build2';
                break;
            case 'lv5_build2':
                this.rewardPhase = 'lv5_build3';
                break;
            case 'lv5_build3':
                this.rewardPhase = 'lv5_build4';
                break;
            case 'lv5_build4':
                this.rewardPhase = 'lv5_blessing1';
                break;
            case 'lv5_blessing1':
                this.rewardPhase = 'lv5_blessing2';
                break;
            case 'lv5_blessing2':
                this.rewardPhase = 'weapon';
                break;
            // 正常奖励流程
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
        
        // ===== 众神赐福效果处理 =====
        // 生命回复
        if (this.player.regenRate && this.player.regenRate > 0) {
            const healAmount = this.player.maxHp * this.player.regenRate * deltaTime;
            this.player.hp = Math.min(this.player.hp + healAmount, this.player.maxHp);
        }
        
        // ===== 血包和限时buff系统 =====
        this.pickupSpawnTimer += deltaTime;
        if (this.pickupSpawnTimer >= this.pickupSpawnInterval && this.activeBoss) {
            this.pickupSpawnTimer = 0;
            const canvas = document.getElementById('game-canvas');
            
            // 尝试生成血包
            if (Math.random() < this.healthPackChance) {
                this.pickups.push({
                    type: 'health',
                    x: 100 + Math.random() * (canvas.width - 200),
                    y: 100 + Math.random() * (canvas.height - 200),
                    radius: 18,
                    healAmount: 50,
                    lifetime: 15
                });
            }
            
            // 尝试生成限时buff
            if (Math.random() < this.buffChance) {
                const buffTypes = ['damage', 'speed', 'shield'];
                const buffType = buffTypes[Math.floor(Math.random() * buffTypes.length)];
                this.pickups.push({
                    type: 'buff',
                    buffType: buffType,
                    x: 100 + Math.random() * (canvas.width - 200),
                    y: 100 + Math.random() * (canvas.height - 200),
                    radius: 15,
                    duration: 10,
                    lifetime: 12
                });
            }
        }
        
        // 更新和检测拾取物
        this.pickups = this.pickups.filter(pickup => {
            pickup.lifetime -= deltaTime;
            if (pickup.lifetime <= 0) return false;
            
            // 检测玩家拾取
            const dx = this.player.x - pickup.x;
            const dy = this.player.y - pickup.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < pickup.radius + this.player.radius) {
                if (pickup.type === 'health') {
                    this.player.hp = Math.min(this.player.hp + pickup.healAmount, this.player.maxHp);
                    if (this.audioManager) this.audioManager.playSound('pickup');
                } else if (pickup.type === 'buff') {
                    this.applyTempBuff(pickup.buffType, pickup.duration);
                    if (this.audioManager) this.audioManager.playSound('powerup');
                }
                return false; // 移除拾取物
            }
            return true;
        });
        
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
                        // 计算伤害（含damageBonus加成）
                        let damage = weapon.damage * (this.player.damageBonus || 1);
                        
                        // 暴击计算
                        if (Math.random() < (weapon.critChance || 0.2)) {
                            damage *= (weapon.critMultiplier || 2.0);
                        }
                        
                        this.activeBoss.hp -= damage;
                        this.weaponSystem.cooldownTimer = weapon.cooldown;
                        
                        // 吸血效果
                        if (weapon.lifesteal && weapon.lifesteal > 0) {
                            const healAmount = damage * weapon.lifesteal;
                            this.player.hp = Math.min(this.player.hp + healAmount, this.player.maxHp);
                        }
                        
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
                        proj.lifetime = 0;
                        
                        // 无敌时间检测
                        if (this.player.invincibleTime && this.player.invincibleTime > 0) {
                            return; // 无敌状态，不受伤
                        }
                        
                        // 闪避检测
                        if (this.player.dodgeChance && Math.random() < this.player.dodgeChance) {
                            // 闪避成功，不受伤
                            return;
                        }
                        
                        // 格挡检测
                        let dmg = proj.damage;
                        if (this.player.blockChance && Math.random() < this.player.blockChance) {
                            dmg *= 0.5; // 格挡减半伤害
                        }
                        
                        // 减伤
                        dmg *= (1 - (this.player.damageReduction || 0));
                        
                        // 护盾优先吸收伤害
                        if (this.player.shield && this.player.shield > 0) {
                            if (this.player.shield >= dmg) {
                                this.player.shield -= dmg;
                                dmg = 0;
                            } else {
                                dmg -= this.player.shield;
                                this.player.shield = 0;
                            }
                        }
                        
                        if (dmg > 0) {
                            this.player.hp -= dmg;
                            if (this.audioManager) {
                                this.audioManager.playSound('hurt');
                            }
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
        if (this.player.hp <= 0 && !this.isResurrecting) {
            // 检查复活机会
            if (this.player.resurrectCount && this.player.resurrectCount > 0) {
                this.player.resurrectCount--;
                this.player.hp = this.player.maxHp; // 满血复活
                this.isResurrecting = true; // 复活中标记
                this.player.invincibleTime = 2.0; // 2秒无敌时间
                
                // 显示复活特效
                this.showRewardNotification('💀 冥界复活！ 💀', () => {
                    this.isResurrecting = false;
                });
                
                if (this.audioManager) {
                    this.audioManager.playSound('levelup');
                }
            } else {
                this.onPlayerDeath();
            }
        }
        
        // 更新无敌时间
        if (this.player.invincibleTime && this.player.invincibleTime > 0) {
            this.player.invincibleTime -= deltaTime;
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
        
        // 绘制拾取物
        this.drawPickups(ctx);
        
        // 绘制玩家（无敌状态闪烁效果）
        if (this.player.invincibleTime && this.player.invincibleTime > 0) {
            ctx.save();
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 50) * 0.3;
            // 绘制无敌光环
            ctx.strokeStyle = '#ffdd44';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffdd44';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(this.player.x, this.player.y, this.player.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
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
        
        // 深邃的天空渐变
        const skyGrad = ctx.createRadialGradient(w/2, h * 0.3, 0, w/2, h * 0.3, w * 0.8);
        skyGrad.addColorStop(0, '#1a0a2e');
        skyGrad.addColorStop(0.3, '#0f0818');
        skyGrad.addColorStop(0.7, '#080410');
        skyGrad.addColorStop(1, '#050208');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);
        
        // 添加星云效果
        for (let i = 0; i < 3; i++) {
            const nebula = ctx.createRadialGradient(
                w * (0.2 + i * 0.3), h * 0.25, 0,
                w * (0.2 + i * 0.3), h * 0.25, w * 0.25
            );
            const hue = 260 + i * 30;
            nebula.addColorStop(0, `hsla(${hue}, 60%, 30%, 0.15)`);
            nebula.addColorStop(0.5, `hsla(${hue}, 50%, 20%, 0.08)`);
            nebula.addColorStop(1, 'transparent');
            ctx.fillStyle = nebula;
            ctx.fillRect(0, 0, w, h);
        }
        
        // 神殿石柱（6根，更详细）
        const pillarPositions = [0.08, 0.22, 0.38, 0.62, 0.78, 0.92];
        pillarPositions.forEach((xRatio, i) => {
            const px = xRatio * w;
            const pw = w * 0.04;
            const ph = h * (0.5 + (i % 2) * 0.1);
            
            // 柱身渐变
            const pillarGrad = ctx.createLinearGradient(px - pw/2, h - ph, px + pw/2, h - ph);
            pillarGrad.addColorStop(0, '#1a1525');
            pillarGrad.addColorStop(0.5, '#252035');
            pillarGrad.addColorStop(1, '#1a1525');
            ctx.fillStyle = pillarGrad;
            ctx.fillRect(px - pw/2, h - ph, pw, ph);
            
            // 柱头装饰
            ctx.fillStyle = '#302840';
            ctx.fillRect(px - pw/2 - 6, h - ph - 15, pw + 12, 18);
            ctx.fillRect(px - pw/2 - 3, h - ph - 25, pw + 6, 12);
            
            // 柱基
            ctx.fillStyle = '#302840';
            ctx.fillRect(px - pw/2 - 6, h - 55, pw + 12, 18);
            
            // 柱身纹理
            ctx.strokeStyle = 'rgba(60, 50, 80, 0.3)';
            ctx.lineWidth = 1;
            for (let j = 0; j < 5; j++) {
                ctx.beginPath();
                ctx.moveTo(px - pw/2 + j * (pw/4), h - ph + 20);
                ctx.lineTo(px - pw/2 + j * (pw/4), h - 55);
                ctx.stroke();
            }
        });
        
        // 地面（更丰富的层次）
        const groundGrad = ctx.createLinearGradient(0, h - 60, 0, h);
        groundGrad.addColorStop(0, '#15101d');
        groundGrad.addColorStop(0.5, '#0c0812');
        groundGrad.addColorStop(1, '#080408');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, h - 60, w, 60);
        
        // 地面纹理线
        ctx.strokeStyle = 'rgba(40, 30, 50, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h - 55);
        ctx.lineTo(w, h - 55);
        ctx.stroke();
        
        // 中央神圣光柱
        const beamGrad = ctx.createLinearGradient(w/2 - 100, 0, w/2 + 100, 0);
        beamGrad.addColorStop(0, 'transparent');
        beamGrad.addColorStop(0.3, 'rgba(255, 200, 100, 0.03)');
        beamGrad.addColorStop(0.5, 'rgba(255, 220, 150, 0.08)');
        beamGrad.addColorStop(0.7, 'rgba(255, 200, 100, 0.03)');
        beamGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(w/2 - 120, 0, 240, h);
        
        // 顶部神殿轮廓
        ctx.fillStyle = '#0a0610';
        ctx.beginPath();
        ctx.moveTo(w * 0.3, 0);
        ctx.lineTo(w * 0.4, h * 0.08);
        ctx.lineTo(w * 0.5, h * 0.03);
        ctx.lineTo(w * 0.6, h * 0.08);
        ctx.lineTo(w * 0.7, 0);
        ctx.fill();
    }
    
    drawProgress(ctx) {
        const progress = this.bossRushMode.getProgress();
        const text = `Boss战进度: ${progress.current}/${progress.total}`;
        
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(text, ctx.canvas.width - 20, 30);
    }
    
    // 绘制拾取物
    drawPickups(ctx) {
        this.pickups.forEach(pickup => {
            const pulse = Math.sin(Date.now() / 200) * 0.2 + 1;
            const alpha = pickup.lifetime < 3 ? pickup.lifetime / 3 : 1;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            if (pickup.type === 'health') {
                // 血包：红色心形
                ctx.fillStyle = '#ff4466';
                ctx.shadowColor = '#ff4466';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(pickup.x, pickup.y, pickup.radius * pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('❤', pickup.x, pickup.y + 5);
            } else if (pickup.type === 'buff') {
                // 限时buff：不同颜色
                const buffColors = {
                    damage: '#ff8844',
                    speed: '#44ff88',
                    shield: '#4488ff'
                };
                const buffIcons = {
                    damage: '⚔️',
                    speed: '💨',
                    shield: '🛡️'
                };
                ctx.fillStyle = buffColors[pickup.buffType];
                ctx.shadowColor = buffColors[pickup.buffType];
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(pickup.x, pickup.y, pickup.radius * pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(buffIcons[pickup.buffType], pickup.x, pickup.y + 5);
            }
            
            ctx.restore();
        });
    }
    
    // 应用临时buff
    applyTempBuff(buffType, duration) {
        const originalValues = {};
        
        switch(buffType) {
            case 'damage':
                originalValues.damageBonus = this.player.damageBonus || 1;
                this.player.damageBonus = (this.player.damageBonus || 1) * 1.5;
                this.showRewardNotification('⚔️ 伤害提升! (10秒)', () => {});
                break;
            case 'speed':
                originalValues.speed = this.player.speed;
                this.player.speed *= 1.4;
                this.showRewardNotification('💨 速度提升! (10秒)', () => {});
                break;
            case 'shield':
                this.player.shield = (this.player.shield || 0) + 80;
                this.showRewardNotification('🛡️ 临时护盾! (+80)', () => {});
                return; // 护盾不需要恢复
        }
        
        // 持续时间后恢复
        setTimeout(() => {
            if (buffType === 'damage') {
                this.player.damageBonus = originalValues.damageBonus;
            } else if (buffType === 'speed') {
                this.player.speed = originalValues.speed;
            }
        }, duration * 1000);
    }
    
    exit() {
        this.isActive = false;
        this.activeBoss = null;
        this.pickups = [];
        this.bossRushMode.end();
    }
}
