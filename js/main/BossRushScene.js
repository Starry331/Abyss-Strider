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
        
        // 万神殿背景粒子（优化：预生成）
        this.bgParticles = [];
        this.bgPillars = [];
        this.initBackground();
    }
    
    // 初始化万神殿背景元素
    initBackground() {
        // 生成星空粒子
        for (let i = 0; i < 60; i++) {
            this.bgParticles.push({
                x: Math.random(),
                y: Math.random(),
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.0001 + 0.00005,
                alpha: Math.random() * 0.5 + 0.3
            });
        }
        // 生成石柱位置
        for (let i = 0; i < 8; i++) {
            this.bgPillars.push({
                x: i / 8 + 0.0625,
                height: Math.random() * 0.3 + 0.5,
                width: 0.04
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
        this.rewardPhase = 'build1';
        this.rewardCount = 0;
        
        // 显示胜利提示
        this.showRewardNotification('Boss击败！选择奖励', () => {
            this.showNextReward();
        });
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
        // 创建构筑选择UI
        const builds = this.generateBuilds();
        
        const panel = document.createElement('div');
        panel.id = 'boss-rush-build-panel';
        panel.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 10000;
        `;
        
        panel.innerHTML = `
            <div style="color: #ffd700; font-size: 32px; margin-bottom: 30px; text-shadow: 0 0 10px #ffd700;">${title}</div>
            <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
                ${builds.map((b, i) => `
                    <div class="build-choice" data-index="${i}" style="
                        background: linear-gradient(135deg, ${b.bgColor}, #1a1a2e);
                        border: 2px solid ${b.borderColor}; border-radius: 15px; padding: 25px;
                        width: 200px; cursor: pointer; transition: all 0.3s;
                        text-align: center; color: #fff;
                    ">
                        <div style="font-size: 40px; margin-bottom: 10px;">${b.icon}</div>
                        <div style="font-size: 18px; color: ${b.borderColor}; margin-bottom: 8px;">${b.name}</div>
                        <div style="font-size: 14px; color: #aaa;">${b.desc}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // 绑定点击事件
        panel.querySelectorAll('.build-choice').forEach(card => {
            card.addEventListener('click', (e) => {
                const index = parseInt(card.dataset.index);
                builds[index].apply();
                if (this.audioManager) this.audioManager.playSound('menu_click');
                panel.remove();
                this.onRewardChosen();
            });
            
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
            background: rgba(0,0,0,0.8); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 10000;
        `;
        
        panel.innerHTML = `
            <div style="color: #ffd700; font-size: 32px; margin-bottom: 30px; text-shadow: 0 0 10px #ffd700;">选择赐福</div>
            <div style="display: flex; gap: 30px;">
                ${blessings.map((b, i) => `
                    <div class="blessing-choice" data-index="${i}" style="
                        background: linear-gradient(135deg, rgba(50,30,60,0.9), rgba(20,10,30,0.9));
                        border: 3px solid ${b.color}; border-radius: 20px; padding: 30px;
                        width: 180px; cursor: pointer; transition: all 0.3s; text-align: center;
                        box-shadow: 0 0 20px ${b.color}40;
                    ">
                        <div style="font-size: 50px; margin-bottom: 15px;">${b.icon}</div>
                        <div style="font-size: 20px; color: ${b.color}; margin-bottom: 10px;">${b.name}</div>
                        <div style="font-size: 14px; color: #ccc;">${b.desc}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(panel);
        
        panel.querySelectorAll('.blessing-choice').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                blessings[index].effect();
                if (this.audioManager) this.audioManager.playSound('blessing');
                panel.remove();
                this.onRewardChosen();
            });
            
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
            background: rgba(0,0,0,0.8); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 10000;
        `;
        
        panel.innerHTML = `
            <div style="color: #ffd700; font-size: 32px; margin-bottom: 30px; text-shadow: 0 0 10px #ffd700;">武器升级</div>
            <div style="display: flex; gap: 25px;">
                ${weapons.map((w, i) => {
                    const maxed = w.upgradeLevel >= 8;
                    return `
                    <div class="weapon-upgrade-choice" data-index="${i}" style="
                        background: linear-gradient(135deg, #2a2a3a, #1a1a2a);
                        border: 2px solid ${maxed ? '#666' : '#ffd700'}; border-radius: 15px; padding: 25px;
                        width: 180px; cursor: ${maxed ? 'not-allowed' : 'pointer'}; transition: all 0.3s;
                        text-align: center; opacity: ${maxed ? 0.5 : 1};
                    ">
                        <div style="font-size: 36px; margin-bottom: 10px;">${w.name === 'Staff' ? '🪄' : w.name === 'Longsword' ? '🗡️' : '⚔️'}</div>
                        <div style="font-size: 18px; color: #ffd700; margin-bottom: 8px;">${w.cnName}</div>
                        <div style="font-size: 14px; color: #aaa;">Lv${w.upgradeLevel} → Lv${Math.min(w.upgradeLevel + 1, 8)}</div>
                        ${maxed ? '<div style="color: #666; font-size: 12px; margin-top: 5px;">已满级</div>' : ''}
                    </div>
                `}).join('')}
            </div>
        `;
        
        document.body.appendChild(panel);
        
        panel.querySelectorAll('.weapon-upgrade-choice').forEach(card => {
            const index = parseInt(card.dataset.index);
            const weapon = weapons[index];
            
            if (weapon.upgradeLevel < 8) {
                card.addEventListener('click', () => {
                    weapon.upgradeLevel++;
                    if (this.audioManager) this.audioManager.playSound('upgrade');
                    panel.remove();
                    this.onRewardChosen();
                });
                
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
    
    onRewardChosen() {
        // 进入下一个奖励阶段
        switch(this.rewardPhase) {
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
    
    // 万神殿背景绘制
    drawPantheonBackground(ctx, w, h) {
        // 深邃天空渐变
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#0a0515');
        skyGrad.addColorStop(0.3, '#150820');
        skyGrad.addColorStop(0.6, '#1a0a25');
        skyGrad.addColorStop(1, '#0d0510');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);
        
        // 星空粒子
        const time = Date.now();
        ctx.save();
        this.bgParticles.forEach(p => {
            const twinkle = Math.sin(time * p.speed * 100) * 0.3 + 0.7;
            ctx.globalAlpha = p.alpha * twinkle;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
        
        // 神殿光柱（中央）
        ctx.save();
        const beamGrad = ctx.createLinearGradient(w/2 - 100, 0, w/2 + 100, 0);
        beamGrad.addColorStop(0, 'transparent');
        beamGrad.addColorStop(0.3, 'rgba(255, 200, 100, 0.05)');
        beamGrad.addColorStop(0.5, 'rgba(255, 180, 80, 0.1)');
        beamGrad.addColorStop(0.7, 'rgba(255, 200, 100, 0.05)');
        beamGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(w/2 - 150, 0, 300, h);
        ctx.restore();
        
        // 石柱
        this.bgPillars.forEach(pillar => {
            const px = pillar.x * w;
            const pw = pillar.width * w;
            const ph = pillar.height * h;
            
            // 柱身
            const pillarGrad = ctx.createLinearGradient(px - pw/2, h - ph, px + pw/2, h - ph);
            pillarGrad.addColorStop(0, '#1a1520');
            pillarGrad.addColorStop(0.5, '#2a2030');
            pillarGrad.addColorStop(1, '#1a1520');
            ctx.fillStyle = pillarGrad;
            ctx.fillRect(px - pw/2, h - ph, pw, ph);
            
            // 柱顶
            ctx.fillStyle = '#2a2535';
            ctx.fillRect(px - pw/2 - 5, h - ph - 15, pw + 10, 15);
            
            // 柱底
            ctx.fillRect(px - pw/2 - 5, h - 20, pw + 10, 20);
        });
        
        // 地面
        const floorGrad = ctx.createLinearGradient(0, h - 60, 0, h);
        floorGrad.addColorStop(0, '#151015');
        floorGrad.addColorStop(1, '#0a0508');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, h - 60, w, 60);
        
        // 地面纹理
        ctx.strokeStyle = 'rgba(100, 80, 120, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 80) {
            ctx.beginPath();
            ctx.moveTo(i, h - 60);
            ctx.lineTo(i, h);
            ctx.stroke();
        }
        
        // 神圣光环（中央装饰）
        ctx.save();
        ctx.globalAlpha = 0.15 + Math.sin(time / 1000) * 0.05;
        const haloGrad = ctx.createRadialGradient(w/2, h/2 - 50, 0, w/2, h/2 - 50, 200);
        haloGrad.addColorStop(0, 'rgba(255, 200, 100, 0.3)');
        haloGrad.addColorStop(0.5, 'rgba(200, 150, 80, 0.1)');
        haloGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(w/2, h/2 - 50, 200, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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
