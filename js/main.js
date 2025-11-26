// =============================
// Main Game Entry Point
// =============================

import { GameLoop } from './main/GameLoop.js';
import { PowerUpManager } from './levels/PowerUpManager.js';
import { SceneManager } from './main/SceneManager.js';
import { InputManager } from './input/InputManager.js';
import { Player } from './player/Player.js';
import { CombatSystem } from './combat/CombatSystem.js';
import { WeaponSystem } from './weapons/WeaponSystem.js';
import { EnemyManager } from './enemies/EnemyManager.js';
import { BossManager } from './enemies/BossManager.js';
import { UIManager } from './ui/UIManager.js';
import { LevelManager } from './levels/LevelManager.js';
import { SaveSystem } from './save/SaveSystem.js';
import { BuildSystem } from './systems/BuildSystem.js';
import { EffectManager } from './effects/EffectManager.js';
import { gameAudio } from './audio/GameAudio.js';
import { AchievementSystem } from './systems/AchievementSystem.js';
import { MenuScene } from './main/MenuScene.js';
import { HealthPackManager } from './levels/HealthPackManager.js';
import { Renderer2D } from './effects/Renderer2D.js';
import { LevelBackground } from './effects/LevelBackground.js';
import { CharacterRenderer } from './effects/CharacterRenderer.js';
import { HalloweenRenderer } from './effects/HalloweenRenderer.js';


// Expose renderers globally for other modules
window.Renderer2D = Renderer2D;
window.CharacterRenderer = CharacterRenderer;
window.HalloweenRenderer = HalloweenRenderer;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fill the window
function resize() {
    // 使用document尺寸确保完整覆盖
    const width = document.documentElement.clientWidth || window.innerWidth;
    const height = document.documentElement.clientHeight || window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 100));
resize();

// ---------------------------
// Initialize Core Systems
// ---------------------------
const inputManager = new InputManager();
const sceneManager = new SceneManager(ctx);
const saveSystem = new SaveSystem();
const effectManager = new EffectManager();
// 初始化音频系统
gameAudio.init();
const audioManager = {
    resume: () => gameAudio.resume(),
    playSound: (n) => gameAudio.play(n),
    playMusic: (n) => gameAudio.playMusic(n),
    playBossMusic: (l) => gameAudio.playBossMusic(l),
    stopMusic: () => gameAudio.stopMusic(),
    audioContext: gameAudio.ctx
};
window.audioManager = audioManager;
console.log('音频系统已初始化');
const achievementSystem = new AchievementSystem();
window.achievementSystem = achievementSystem;
const uiManager = new UIManager();
const levelBackground = new LevelBackground();

// ---------------------------
// Game Scene Definition
// ---------------------------
const gameScene = {
    // Called when the scene becomes active
    enter: function () {
        console.log('Entering Game Scene');
        
        // 激活音频并播放关卡音乐
        if (audioManager && audioManager.resume) audioManager.resume();
        if (audioManager && audioManager.playMusic) audioManager.playMusic('level1');

        // Core combat & weapon systems
        this.combatSystem = new CombatSystem(audioManager);
        this.weaponSystem = new WeaponSystem(this.combatSystem, audioManager);

        // Load saved state if the player chose "Continue"
        const savedState = this.loadFromSave ? saveSystem.loadRun() : null;
        if (savedState) {
            console.log('Loading Save...');
            this.player = new Player(savedState.player.x, savedState.player.y, inputManager);
            this.player.hp = savedState.player.hp;
            this.player.maxHp = savedState.player.maxHp;
            this.levelManager = new LevelManager(this.player, null, null, uiManager, audioManager);
            this.levelManager.score = savedState.score;
            this.levelManager.currentLevel = savedState.level;
            // 根据存档关卡播放音乐
            audioManager.playMusic('level' + savedState.level);
        } else {
            console.log('New Game...');
            this.player = new Player(canvas.width / 2, canvas.height / 2, inputManager);
            this.levelManager = new LevelManager(this.player, null, null, uiManager, audioManager);
        }

        // Link weapon system to player
        this.player.setWeaponSystem(this.weaponSystem);
        
        // 玩家音效回调
        this.player.onHit = () => {
            if (audioManager) audioManager.playSound('player_hit');
        };
        this.player.onRoll = () => {
            if (audioManager) audioManager.playSound('roll');
        };
        this.player.onBlock = () => {
            if (audioManager) audioManager.playSound('block');
        };

        // Initialize Build System (传入levelManager以支持关卡缩放)
        this.buildSystem = new BuildSystem(this.weaponSystem, this.player, this.levelManager);

        // Managers for enemies, boss, health packs, and buffs
        this.bossManager = new BossManager(this.combatSystem, this.player, uiManager);
        this.enemyManager = new EnemyManager(this.combatSystem, this.player);
        this.healthPackManager = new HealthPackManager(this.player);
        this.powerUpManager = new PowerUpManager(this.player, uiManager);

        // Link level manager
        this.levelManager.enemyManager = this.enemyManager;
        this.levelManager.bossManager = this.bossManager;

        // Boss spawn/death flags
        this.bossManager.onBossSpawn = () => {
            this.enemyManager.bossActive = true;
            // 播放Boss警告音效和Boss战斗音乐
            if (audioManager) {
                audioManager.playSound('boss_spawn');
                setTimeout(() => {
                    audioManager.playBossMusic(this.levelManager.currentLevel);
                }, 3000);
            }
        };
        this.bossManager.onBossDeath = () => {
            console.log('Boss defeated! Updating flag...');
            this.enemyManager.bossActive = false;
            achievementSystem.recordBossKill();
            
            // 检查是否是最终Boss (Level 5)
            if (this.levelManager.currentLevel >= 5) {
                // 最终胜利!
                this.showVictoryScreen();
                return;
            }
            
            // 恢复关卡音乐
            if (audioManager) {
                audioManager.playMusic('level' + this.levelManager.currentLevel);
            }
            this.buildSystem.showBuildChoice();
            this.buildSystem.onBuildSelected = () => {
                console.log('Build selected, showing blessing menu...');
                const buildPanel = document.getElementById('build-panel');
                if (buildPanel) {
                    buildPanel.classList.add('hidden');
                    buildPanel.style.display = 'none';
                }
                achievementSystem.recordBuildCollected();
                uiManager.showBlessingMenu();
            };
        };

        // Enemy death scoring
        this.enemyManager.onEnemyDeath = (enemy) => {
            this.levelManager.addScore(enemy.scoreReward);
            effectManager.spawnFloatingText(enemy.x, enemy.y, `+ ${enemy.scoreReward} `, '#f1c40f');
            effectManager.spawnParticle(enemy.x, enemy.y, enemy.color);
            if (audioManager && audioManager.playSound) audioManager.playSound('enemy_death');
            achievementSystem.recordEnemyKill();
        };
        
        // 精英怪死亡 - 触发构筑选择
        this.enemyManager.onEliteDeath = (enemy) => {
            this.levelManager.addScore(enemy.scoreReward);
            effectManager.spawnFloatingText(enemy.x, enemy.y, `精英击杀! +${enemy.scoreReward}`, '#ffd700');
            effectManager.spawnParticle(enemy.x, enemy.y, '#ffd700');
            if (audioManager) {
                audioManager.playSound('boss_spawn');
            }
            achievementSystem.recordEliteKill();
            achievementSystem.recordBuildCollected();
            
            // 显示构筑选择
            console.log('精英怪击杀，显示构筑选择...');
            this.buildSystem.showBuildChoice();
            this.buildSystem.onBuildSelected = () => {
                console.log('构筑选择完成');
                const buildPanel = document.getElementById('build-panel');
                if (buildPanel) {
                    buildPanel.classList.add('hidden');
                    buildPanel.style.display = 'none';
                }
            };
        };
        
        // 拾取音效
        this.healthPackManager.onPickup = () => {
            if (audioManager) audioManager.playSound('pickup');
        };
        
        // Buff拾取音效
        this.powerUpManager.onCollect = (type) => {
            if (audioManager) {
                if (type === 'SHIELD') {
                    audioManager.playSound('shield');
                } else {
                    audioManager.playSound('pickup');
                }
            }
        };
        
        // 积分阈值触发构筑选择 (1500/2500/3500/4500/6000)
        this.levelManager.onBuildTrigger = (threshold) => {
            console.log(`积分达到 ${threshold}，显示构筑选择...`);
            this.buildSystem.showBuildChoice();
            this.buildSystem.onBuildSelected = () => {
                console.log('构筑选择完成，游戏继续');
                const buildPanel = document.getElementById('build-panel');
                if (buildPanel) {
                    buildPanel.classList.add('hidden');
                    buildPanel.style.display = 'none';
                }
            };
        };

        // UI initialization
        uiManager.updateLevel(this.levelManager.getCurrentLevelData().name);
        uiManager.updateScore(this.levelManager.score);
        uiManager.updateHealth(this.player.hp, this.player.maxHp);
        uiManager.updateShield(this.player.shield || 0, 100);
        uiManager.clearAllBuffs();
        document.getElementById('hud').classList.remove('hidden');

        // Blessing selection handling - 完整的赐福效果应用
        uiManager.onBlessingSelect = (blessing) => {
            console.log('Blessing Selected:', blessing);
            const weapon = this.weaponSystem.currentWeapon;
            const player = this.player;
            const value = blessing.value;
            
            switch(blessing.effect) {
                case 'speed':
                    weapon.cooldown *= (1 - value);
                    console.log(`攻速提升: cooldown = ${weapon.cooldown}`);
                    break;
                case 'hp':
                    player.maxHp += value;
                    player.hp += value;
                    console.log(`生命提升: HP = ${player.hp}/${player.maxHp}`);
                    break;
                case 'damage':
                    weapon.damage *= (1 + value);
                    console.log(`伤害提升: damage = ${weapon.damage}`);
                    break;
                case 'moveSpeed':
                    player.speed *= (1 + value);
                    console.log(`移速提升: speed = ${player.speed}`);
                    break;
                case 'crit':
                    weapon.critChance = (weapon.critChance || 0) + value;
                    weapon.critMultiplier = weapon.critMultiplier || 2.0;
                    console.log(`暴击率提升: crit = ${weapon.critChance}`);
                    break;
                case 'defense':
                    player.damageReduction = (player.damageReduction || 0) + value;
                    console.log(`减伤提升: reduction = ${player.damageReduction}`);
                    break;
                case 'regen':
                    player.hpRegen = (player.hpRegen || 0) + value;
                    console.log(`生命回复: regen = ${player.hpRegen}/s`);
                    break;
                case 'critDamage':
                    weapon.critMultiplier = (weapon.critMultiplier || 2.0) + value;
                    console.log(`暴击伤害: critMult = ${weapon.critMultiplier}`);
                    break;
                case 'range':
                    weapon.range *= (1 + value);
                    if (weapon.aoeRadius) weapon.aoeRadius *= (1 + value);
                    console.log(`范围提升: range = ${weapon.range}`);
                    break;
                case 'lifesteal':
                    weapon.lifesteal = (weapon.lifesteal || 0) + value;
                    console.log(`吸血: lifesteal = ${weapon.lifesteal}`);
                    break;
                case 'manaSteal':
                    weapon.manaSteal = (weapon.manaSteal || 0) + value;
                    console.log(`每击回血: manaSteal = ${weapon.manaSteal}`);
                    break;
                case 'godAttack':
                    weapon.cooldown *= (1 - value); // value=0.4, 攻速+40%
                    weapon.damage *= (1 + 0.8);     // 伤害+80%固定
                    console.log('战神: 攻速+40%, 伤害+80%');
                    break;
                case 'godDefense':
                    player.maxHp += value;
                    player.hp += value;
                    player.damageReduction = (player.damageReduction || 0) + 0.5;
                    console.log('守护神: 生命+减伤双提升');
                    break;
                case 'godAll':
                    weapon.damage *= (1 + value);
                    weapon.cooldown *= (1 - value);
                    player.speed *= (1 + value);
                    player.maxHp += Math.floor(player.maxHp * value);
                    player.hp += Math.floor(player.hp * value);
                    console.log('万神: 全属性提升');
                    break;
                case 'godVampire':
                    weapon.lifesteal = (weapon.lifesteal || 0) + value;
                    weapon.manaSteal = (weapon.manaSteal || 0) + 3;
                    console.log('血神: 吸血12%+每击回3HP');
                    break;
            }

            if (audioManager && audioManager.playSound) audioManager.playSound('blessing_select');

            // Save progress before advancing
            saveSystem.saveRun({
                player: {
                    x: this.player.x,
                    y: this.player.y,
                    hp: this.player.hp,
                    maxHp: this.player.maxHp,
                },
                score: this.levelManager.score,
                level: this.levelManager.currentLevel + 1,
            });

            const currentLevel = this.levelManager.currentLevel;
            
            // Advance level and upgrade weapons
            this.levelManager.advanceLevel();
            this.weaponSystem.upgradeAllWeapons();
            
            // 在特定关卡过渡时显示武器升级选择 (1→2, 3→4, 4→5)
            if (currentLevel === 1 || currentLevel === 3 || currentLevel === 4) {
                setTimeout(() => {
                    this.showWeaponUpgradeChoice();
                }, 500);
            }
        };
        
        // 武器升级选择回调
        this.onWeaponUpgradeSelect = null;
        
        // 暂停功能绑定
        this.isPaused = false;
        
        // Esc键暂停
        this.escHandler = (e) => {
            if (e.key === 'Escape') {
                this.togglePause();
            }
        };
        document.addEventListener('keydown', this.escHandler);
        
        // 触屏暂停按钮
        const btnPauseTouch = document.getElementById('btn-pause-touch');
        if (btnPauseTouch) {
            btnPauseTouch.classList.remove('hidden');
            this.pauseTouchHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.togglePause();
            };
            btnPauseTouch.addEventListener('click', this.pauseTouchHandler);
            btnPauseTouch.addEventListener('touchend', this.pauseTouchHandler);
        }
        
        // 暂停菜单按钮
        const btnResume = document.getElementById('btn-resume');
        const btnRestart = document.getElementById('btn-restart');
        const btnQuit = document.getElementById('btn-quit');
        
        if (btnResume) {
            this.resumeHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.togglePause();
            };
            btnResume.addEventListener('click', this.resumeHandler);
            btnResume.addEventListener('touchend', this.resumeHandler);
        }
        
        if (btnRestart) {
            this.restartHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.isPaused = false;
                document.getElementById('pause-menu').classList.add('hidden');
                saveSystem.clearRun();
                uiManager.clearAllBuffs();
                this.loadFromSave = false; // 确保重新开始
                sceneManager.switchTo('game');
            };
            btnRestart.addEventListener('click', this.restartHandler);
            btnRestart.addEventListener('touchend', this.restartHandler);
        }
        
        if (btnQuit) {
            this.quitHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.isPaused = false;
                document.getElementById('pause-menu').classList.add('hidden');
                uiManager.clearAllBuffs();
                if (audioManager) audioManager.stopMusic();
                sceneManager.switchTo('menu');
            };
            btnQuit.addEventListener('click', this.quitHandler);
            btnQuit.addEventListener('touchend', this.quitHandler);
        }
    },

    // Called when leaving the scene
    exit: function () {
        document.getElementById('hud').classList.add('hidden');
        
        // 移除暂停相关事件
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
        }
        const btnPauseTouch = document.getElementById('btn-pause-touch');
        if (btnPauseTouch) {
            btnPauseTouch.classList.add('hidden');
            if (this.pauseTouchHandler) {
                btnPauseTouch.removeEventListener('click', this.pauseTouchHandler);
                btnPauseTouch.removeEventListener('touchend', this.pauseTouchHandler);
            }
        }
        
        // 移除暂停菜单按钮事件
        const btnResume = document.getElementById('btn-resume');
        if (btnResume && this.resumeHandler) {
            btnResume.removeEventListener('click', this.resumeHandler);
            btnResume.removeEventListener('touchend', this.resumeHandler);
        }
        const btnRestart = document.getElementById('btn-restart');
        if (btnRestart && this.restartHandler) {
            btnRestart.removeEventListener('click', this.restartHandler);
            btnRestart.removeEventListener('touchend', this.restartHandler);
        }
        const btnQuit = document.getElementById('btn-quit');
        if (btnQuit && this.quitHandler) {
            btnQuit.removeEventListener('click', this.quitHandler);
            btnQuit.removeEventListener('touchend', this.quitHandler);
        }
        
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) pauseMenu.classList.add('hidden');
        
        // Auto-save if player is still alive
        if (this.player && this.player.hp > 0) {
            saveSystem.saveRun({
                player: {
                    x: this.player.x,
                    y: this.player.y,
                    hp: this.player.hp,
                    maxHp: this.player.maxHp,
                },
                score: this.levelManager.score,
                level: this.levelManager.currentLevel,
            });
        }
    },

    // 暂停状态
    isPaused: false,
    
    // 切换暂停
    togglePause: function() {
        if (this.buildSystem && this.buildSystem.isActive) return;
        if (uiManager && uiManager.isBlessingMenuActive) return;
        
        this.isPaused = !this.isPaused;
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            if (this.isPaused) {
                pauseMenu.classList.remove('hidden');
            } else {
                pauseMenu.classList.add('hidden');
            }
        }
    },
    
    // 显示胜利画面
    showVictoryScreen: function() {
        console.log('Victory! Final Boss defeated!');
        
        // 停止游戏音乐，播放胜利音效
        if (audioManager) {
            audioManager.stopMusic();
            audioManager.playSound('victory');
        }
        
        // 解锁大师之征成就
        achievementSystem.unlockMaster();
        
        // 保存分数
        saveSystem.saveScore('Player', this.levelManager.score, 5);
        saveSystem.clearRun();
        
        // 显示胜利画面
        const victoryScreen = document.getElementById('victory-screen');
        const scoreValue = document.getElementById('victory-score-value');
        const creditsScroll = document.getElementById('credits-scroll');
        
        if (scoreValue) {
            scoreValue.innerText = this.levelManager.score;
        }
        
        if (victoryScreen) {
            victoryScreen.classList.remove('hidden');
        }
        
        // 隐藏HUD
        document.getElementById('hud').classList.add('hidden');
        
        // 3秒后开始滚动开发者名单
        setTimeout(() => {
            if (creditsScroll) {
                creditsScroll.classList.remove('hidden');
            }
        }, 3000);
        
        // 返回主菜单按钮
        const btnVictoryMenu = document.getElementById('btn-victory-menu');
        if (btnVictoryMenu) {
            // 移除旧的事件监听器
            const newBtn = btnVictoryMenu.cloneNode(true);
            btnVictoryMenu.parentNode.replaceChild(newBtn, btnVictoryMenu);
            
            const handleReturn = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Victory menu button clicked');
                
                // 隐藏胜利画面
                const vs = document.getElementById('victory-screen');
                const cs = document.getElementById('credits-scroll');
                if (vs) vs.classList.add('hidden');
                if (cs) cs.classList.add('hidden');
                
                // 显示HUD（会在菜单中隐藏）
                const hud = document.getElementById('hud');
                if (hud) hud.classList.remove('hidden');
                
                // 切换到菜单
                sceneManager.switchTo('menu');
            };
            
            newBtn.addEventListener('click', handleReturn);
            newBtn.addEventListener('touchend', handleReturn);
        }
    },
    
    // 显示武器升级选择（独立于构筑选择）
    showWeaponUpgradeChoice: function() {
        const panel = document.getElementById('weapon-upgrade-panel');
        if (!panel) {
            console.error('weapon-upgrade-panel not found!');
            return;
        }
        
        console.log('显示武器升级面板');
        this.isWeaponUpgradeActive = true;
        panel.classList.remove('hidden');
        panel.style.display = 'flex';
        panel.style.pointerEvents = 'auto';
        
        const container = document.getElementById('weapon-upgrade-choices');
        if (!container) return;
        container.innerHTML = '';
        
        // 为每个武器生成升级选项
        this.weaponSystem.weapons.forEach((weapon, index) => {
            const card = document.createElement('div');
            card.className = 'weapon-upgrade-card';
            
            const nextLevel = Math.min(weapon.upgradeLevel + 1, 6);
            const isMaxed = weapon.upgradeLevel >= 6;
            
            card.innerHTML = `
                <div class="weapon-icon">${this.getWeaponIcon(weapon.name)}</div>
                <div class="weapon-name">${weapon.cnName}</div>
                <div class="weapon-level">Lv.${weapon.upgradeLevel} → Lv.${nextLevel}</div>
                <div class="weapon-desc">${isMaxed ? '已满级' : '升级该武器'}</div>
            `;
            
            if (!isMaxed) {
                card.style.cursor = 'pointer';
                card.style.pointerEvents = 'auto';
                card.addEventListener('click', () => {
                    console.log(`升级武器: ${weapon.cnName}`);
                    this.upgradeSpecificWeapon(index);
                    panel.classList.add('hidden');
                    panel.style.display = 'none';
                    this.isWeaponUpgradeActive = false;
                    if (audioManager) audioManager.playSound('blessing_select');
                });
            } else {
                card.classList.add('maxed');
            }
            
            container.appendChild(card);
        });
        
        // 检查是否所有武器都满级，如果是则添加跳过按钮
        const allMaxed = this.weaponSystem.weapons.every(w => w.upgradeLevel >= 6);
        if (allMaxed) {
            const skipBtn = document.createElement('div');
            skipBtn.className = 'weapon-upgrade-card';
            skipBtn.style.background = 'linear-gradient(135deg, #333 0%, #222 100%)';
            skipBtn.style.cursor = 'pointer';
            skipBtn.innerHTML = `
                <div class="weapon-icon">✓</div>
                <div class="weapon-name">全部满级</div>
                <div class="weapon-desc">点击继续</div>
            `;
            skipBtn.addEventListener('click', () => {
                panel.classList.add('hidden');
                panel.style.display = 'none';
                this.isWeaponUpgradeActive = false;
            });
            container.appendChild(skipBtn);
        }
    },
    
    getWeaponIcon: function(name) {
        switch(name) {
            case 'Staff': return '🪄';
            case 'Longsword': return '🗡️';
            case 'Dual Blades': return '⚔️';
            default: return '🔮';
        }
    },
    
    upgradeSpecificWeapon: function(index) {
        const weapon = this.weaponSystem.weapons[index];
        if (weapon.upgradeLevel < 6) {
            weapon.upgradeLevel++;
            console.log(`${weapon.cnName} 升级到 Lv.${weapon.upgradeLevel}`);
        }
    },

    // Per-frame logic
    update: function (deltaTime) {
        if (!this.player) return;

        // 暂停检查
        if (this.isPaused) return;
        if (this.buildSystem && this.buildSystem.isActive) return;
        if (uiManager && uiManager.isBlessingMenuActive) return;
        if (this.isWeaponUpgradeActive) return;

        // Game-over handling
        if (this.player.state === 'DEAD') {
            saveSystem.saveScore('Player', this.levelManager.score, this.levelManager.currentLevel);
            saveSystem.clearRun();
            
            // 清除所有Buff显示
            uiManager.clearAllBuffs();
            
            // 停止音乐
            if (audioManager) audioManager.stopMusic();
            
            alert(`Game Over! 分数: ${this.levelManager.score}`);
            sceneManager.switchTo('menu');
            return;
        }

        // Core updates
        this.player.update(deltaTime);
        this.combatSystem.update(deltaTime);
        this.enemyManager.update(deltaTime);
        this.bossManager.update(deltaTime);
        this.healthPackManager.update(deltaTime);
        this.powerUpManager.update(deltaTime);
        effectManager.update(deltaTime);
        levelBackground.update(deltaTime);

        // Collision checks
        const allEnemies = [...this.enemyManager.enemies];
        if (this.bossManager.activeBoss) allEnemies.push(this.bossManager.activeBoss);
        this.combatSystem.checkCollisions(this.player, allEnemies);

        // UI Updates
        uiManager.updateHealth(this.player.hp, this.player.maxHp);
        uiManager.updateShield(this.player.shield || 0, 100);
        uiManager.updateBuffTimers();

        // Update screen shake
        if (this.player.screenShake.duration > 0) {
            this.player.screenShake.duration -= deltaTime;
            if (this.player.screenShake.duration <= 0) {
                this.player.screenShake.x = 0;
                this.player.screenShake.y = 0;
                this.player.screenShake.intensity = 0;
            } else {
                // Random shake offset
                const intensity = this.player.screenShake.intensity;
                this.player.screenShake.x = (Math.random() - 0.5) * intensity * 2;
                this.player.screenShake.y = (Math.random() - 0.5) * intensity * 2;
            }
        }
    },

    // Rendering
    draw: function (ctx) {
        if (!this.levelManager) return;

        // Apply screen shake (来自玩家和打击特效)
        ctx.save();
        let shakeX = 0, shakeY = 0;
        if (this.player && this.player.screenShake.duration > 0) {
            shakeX += this.player.screenShake.x;
            shakeY += this.player.screenShake.y;
        }
        // 打击特效的屏幕震动
        if (this.combatSystem && typeof this.combatSystem.getScreenShake === 'function') {
            const hitShake = this.combatSystem.getScreenShake();
            if (hitShake && hitShake.duration > 0) {
                shakeX += hitShake.x;
                shakeY += hitShake.y;
            }
        }
        if (shakeX !== 0 || shakeY !== 0) {
            ctx.translate(shakeX, shakeY);
        }

        // Background
        const levelData = this.levelManager.getCurrentLevelData();
        levelBackground.draw(ctx, levelData, 0, 0);

        // Entities
        this.healthPackManager.draw(ctx);
        this.powerUpManager.draw(ctx); // Draw buff drops
        this.enemyManager.draw(ctx);
        this.bossManager.draw(ctx);
        this.combatSystem.draw(ctx);
        this.player.draw(ctx);
        
        // 绘制武器进化特效
        const time = Date.now() / 1000;
        this.weaponSystem.drawWeaponEffects(ctx, this.player, time);
        
        effectManager.draw(ctx);

        // Restore context
        ctx.restore();
    },
};

// Bind methods to preserve `this`
gameScene.enter = gameScene.enter.bind(gameScene);
gameScene.update = gameScene.update.bind(gameScene);
gameScene.draw = gameScene.draw.bind(gameScene);
gameScene.exit = gameScene.exit.bind(gameScene);

// ---------------------------
// Menu Scene Setup
// ---------------------------
const menuScene = new MenuScene(
    uiManager,
    saveSystem,
    () => {
        // Start new game
        if (audioManager && audioManager.playSound) audioManager.playSound('menu_click');
        gameScene.loadFromSave = false;
        sceneManager.switchTo('game');
    },
    () => {
        // Continue saved game
        if (audioManager && audioManager.playSound) audioManager.playSound('menu_click');
        gameScene.loadFromSave = true;
        sceneManager.switchTo('game');
    },
    audioManager
);

// Register scenes
sceneManager.addScene('menu', menuScene);
sceneManager.addScene('game', gameScene);
sceneManager.switchTo('menu');

// ---------------------------
// Start Game Loop
// ---------------------------
const gameLoop = new GameLoop(
    (deltaTime) => sceneManager.update(deltaTime),
    () => sceneManager.draw()
);
gameLoop.start();

// ---------------------------
// 音频激活 - 用户首次交互时启动
// ---------------------------
let audioActivated = false;
const activateAudio = () => {
    if (audioActivated) return;
    audioActivated = true;
    
    gameAudio.resume();
    if (gameAudio.ctx) {
        gameAudio.ctx.resume().then(() => {
            gameAudio.playMusic('menu');
            console.log('音乐开始播放');
        });
    }
};

document.addEventListener('click', activateAudio, { once: true });
document.addEventListener('touchstart', activateAudio, { once: true });
document.addEventListener('keydown', activateAudio, { once: true });
console.log('音频系统就绪');

// ---------------------------
// 作弊码系统 (测试用)
// ---------------------------
let cheatBuffer = '';
const CHEAT_CODE = '00330';
document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') {
        cheatBuffer += e.key;
        if (cheatBuffer.length > 10) cheatBuffer = cheatBuffer.slice(-10);
        
        if (cheatBuffer.includes(CHEAT_CODE)) {
            cheatBuffer = '';
            // 开启无敌模式
            if (gameScene.player) {
                gameScene.player.maxHp = 999999;
                gameScene.player.hp = 999999;
                gameScene.player.invincible = true;
                uiManager.updateHealth(999999, 999999);
                console.log('🎮 无敌模式已开启!');
            }
        }
    }
});
