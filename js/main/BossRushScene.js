/**
 * Boss战模式场景
 * 连续挑战7个Boss，每个Boss后获得奖励
 */

import { BossRushMode } from '../systems/BossRushMode.js';
import { GhostPoseidonBoss } from '../enemies/PoseidonBoss.js';
import { BerserkArtemisBoss } from '../enemies/ArtemisBoss.js';

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
        
        this.bossRushMode = new BossRushMode();
        this.activeBoss = null;
        this.isActive = false;
        this.rewardPhase = null; // 'build1', 'build2', 'blessing', 'weapon'
        this.rewardCount = 0;
    }
    
    enter() {
        console.log('进入Boss战模式');
        this.isActive = true;
        this.bossRushMode.start();
        
        // 初始化玩家
        const canvas = document.getElementById('game-canvas');
        this.player = new this.Player(canvas.width / 2, canvas.height / 2, new this.InputManager());
        this.player.maxHp = 200; // Boss战更高初始血量
        this.player.hp = 200;
        
        // 初始化战斗系统
        this.combatSystem.player = this.player;
        this.weaponSystem.player = this.player;
        
        // 显示HUD
        document.getElementById('hud').classList.remove('hidden');
        this.uiManager.updateHealth(this.player.hp, this.player.maxHp);
        
        // 播放Boss音乐
        if (this.audioManager) {
            this.audioManager.stopMusic();
            this.audioManager.playBossMusic(1);
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
            // 异化Boss 1-5 需要从BossVariety获取
            const { BossVariety } = require('../enemies/BossVariety.js');
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
        this.rewardPhase = 'build1';
        this.rewardCount = 0;
        this.showNextReward();
    }
    
    showNextReward() {
        switch(this.rewardPhase) {
            case 'build1':
                // 第1次构筑选择
                this.showBuildChoice();
                break;
            case 'build2':
                // 第2次构筑选择
                this.showBuildChoice();
                break;
            case 'blessing':
                // 赐福选择
                this.showBlessingChoice();
                break;
            case 'weapon':
                // 武器升级
                this.showWeaponUpgrade();
                break;
            case 'done':
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
    
    showBuildChoice() {
        // 使用BuildSystem显示构筑选择
        if (this.buildSystem) {
            this.buildSystem.showChoices();
            // 监听选择完成
            this.waitForBuildChoice();
        }
    }
    
    waitForBuildChoice() {
        const checkInterval = setInterval(() => {
            if (!this.buildSystem.isActive) {
                clearInterval(checkInterval);
                this.onRewardChosen();
            }
        }, 100);
    }
    
    showBlessingChoice() {
        // 显示赐福选择（简化版 - 直接给予随机buff）
        const blessings = [
            { name: '生命祝福', effect: () => { this.player.maxHp += 30; this.player.hp += 30; } },
            { name: '力量祝福', effect: () => { this.player.damageBonus = (this.player.damageBonus || 1) * 1.15; } },
            { name: '速度祝福', effect: () => { this.player.speed *= 1.1; } },
            { name: '护盾祝福', effect: () => { this.player.shield = (this.player.shield || 0) + 50; } },
            { name: '恢复祝福', effect: () => { this.player.hp = Math.min(this.player.hp + 50, this.player.maxHp); } }
        ];
        
        const blessing = blessings[Math.floor(Math.random() * blessings.length)];
        blessing.effect();
        
        // 显示获得提示
        console.log(`获得赐福: ${blessing.name}`);
        
        // 继续下一个奖励
        setTimeout(() => this.onRewardChosen(), 500);
    }
    
    showWeaponUpgrade() {
        // 显示武器升级选择
        // 在Boss战模式中允许升级到Lv7/8
        const panel = document.getElementById('weapon-upgrade-panel');
        if (panel) {
            // 简化：直接升级当前武器
            const weapon = this.weaponSystem.currentWeapon;
            const maxLevel = 8; // Boss战最高等级
            if (weapon.upgradeLevel < maxLevel) {
                weapon.upgradeLevel++;
                console.log(`${weapon.cnName}升级到Lv${weapon.upgradeLevel}`);
            }
        }
        
        setTimeout(() => this.onRewardChosen(), 500);
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
        this.showNextReward();
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
        
        // 更新玩家
        this.player.update(deltaTime);
        
        // 边界检测
        const canvas = document.getElementById('game-canvas');
        this.player.x = Math.max(this.player.radius, Math.min(canvas.width - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(canvas.height - this.player.radius, this.player.y));
        
        // 更新战斗系统
        this.combatSystem.update(deltaTime);
        
        // 更新Boss
        if (this.activeBoss) {
            this.activeBoss.update(deltaTime);
            
            // 检查Boss是否被击败
            if (this.activeBoss.hp <= 0) {
                this.activeBoss = null;
                this.onBossDefeated();
            } else {
                // 更新Boss血条
                this.uiManager.updateBossHP(this.activeBoss.hp, this.activeBoss.maxHp, this.activeBoss.name);
            }
        }
        
        // 更新武器系统
        this.weaponSystem.update(deltaTime, this.player);
        
        // 更新特效
        this.effectManager.update(deltaTime);
        
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
        
        // 绘制背景 - Boss战专用深红背景
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
        grad.addColorStop(0, '#1a0505');
        grad.addColorStop(0.5, '#0a0202');
        grad.addColorStop(1, '#050101');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制Boss
        if (this.activeBoss) {
            this.activeBoss.draw(ctx);
        }
        
        // 绘制战斗系统（投射物等）
        this.combatSystem.draw(ctx);
        
        // 绘制玩家
        this.player.draw(ctx);
        
        // 绘制武器特效
        const time = Date.now() / 1000;
        this.weaponSystem.drawWeaponEffects(ctx, this.player, time);
        
        // 绘制特效
        this.effectManager.draw(ctx);
        
        // 绘制进度指示
        this.drawProgress(ctx);
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
