import { MenuAnimation } from '../ui/MenuAnimation.js';
import { BossRushMode } from '../systems/BossRushMode.js';

export class MenuScene {
    constructor(uiManager, saveSystem, onStart, onContinue, audioManager = null, onBossRush = null) {
        console.log("=== MenuScene Constructor Called ===");
        this.uiManager = uiManager;
        this.saveSystem = saveSystem;
        this.onStart = onStart;
        this.onContinue = onContinue;
        this.onBossRush = onBossRush;
        this.audioManager = audioManager;

        this.menuContainer = document.getElementById('main-menu');
        this.tutorialOverlay = document.getElementById('tutorial-overlay');
        this.leaderboardOverlay = null;
        
        // 初始化菜单动画系统
        this.menuAnimation = new MenuAnimation();

        console.log("Menu Container:", this.menuContainer);
        console.log("Tutorial Overlay:", this.tutorialOverlay);
        console.log("Calling bindEvents...");
        this.bindEvents();
        console.log("=== MenuScene Constructor Complete ===");
    }

    bindEvents() {
        console.log("Binding Menu Events...");

        // Remove old event listeners if they exist
        this.unbindEvents();
        
        // 用户首次交互时激活音频
        this.firstInteractionHandler = () => {
            if (this.audioManager && this.audioManager.resume) {
                this.audioManager.resume();
                this.audioManager.playMusic('menu');
            }
            document.removeEventListener('click', this.firstInteractionHandler);
            document.removeEventListener('touchstart', this.firstInteractionHandler);
        };
        document.addEventListener('click', this.firstInteractionHandler);
        document.addEventListener('touchstart', this.firstInteractionHandler);

        const btnStart = document.getElementById('btn-start');
        if (btnStart) {
            this.startHandler = (e) => {
                e.preventDefault();
                console.log("Start Button Clicked");
                if (this.audioManager && this.audioManager.resume) this.audioManager.resume();
                this.onStart();
            };
            btnStart.addEventListener('click', this.startHandler);
            btnStart.addEventListener('touchend', this.startHandler);
        } else {
            console.error("Start Button Not Found!");
        }

        const btnContinue = document.getElementById('btn-continue');
        if (btnContinue) {
            this.continueHandler = (e) => {
                e.preventDefault();
                console.log("Continue Button Clicked");
                this.onContinue();
            };
            btnContinue.addEventListener('click', this.continueHandler);
            btnContinue.addEventListener('touchend', this.continueHandler);
        }

        const btnTutorial = document.getElementById('btn-tutorial');
        if (btnTutorial) {
            this.tutorialHandler = (e) => {
                e.preventDefault();
                console.log("Tutorial Button Clicked");
                this.tutorialOverlay.classList.remove('hidden');
            };
            btnTutorial.addEventListener('click', this.tutorialHandler);
            btnTutorial.addEventListener('touchend', this.tutorialHandler);
        }

        const btnCloseTutorial = document.getElementById('btn-close-tutorial');
        if (btnCloseTutorial) {
            this.closeTutorialHandler = (e) => {
                e.preventDefault();
                console.log("Close Tutorial Clicked");
                this.tutorialOverlay.classList.add('hidden');
            };
            btnCloseTutorial.addEventListener('click', this.closeTutorialHandler);
            btnCloseTutorial.addEventListener('touchend', this.closeTutorialHandler);
        }

        // 开发人员按钮
        const creditsOverlay = document.getElementById('credits-overlay');
        const btnCredits = document.getElementById('btn-credits');
        if (btnCredits && creditsOverlay) {
            this.creditsHandler = (e) => {
                e.preventDefault();
                console.log("Credits Button Clicked");
                creditsOverlay.classList.remove('hidden');
            };
            btnCredits.addEventListener('click', this.creditsHandler);
            btnCredits.addEventListener('touchend', this.creditsHandler);
        }

        const btnCloseCredits = document.getElementById('btn-close-credits');
        if (btnCloseCredits && creditsOverlay) {
            this.closeCreditsHandler = (e) => {
                e.preventDefault();
                creditsOverlay.classList.add('hidden');
            };
            btnCloseCredits.addEventListener('click', this.closeCreditsHandler);
            btnCloseCredits.addEventListener('touchend', this.closeCreditsHandler);
        }

        // 成就按钮
        const btnAchievements = document.getElementById('btn-achievements');
        const achievementOverlay = document.getElementById('achievement-overlay');
        if (btnAchievements) {
            this.achievementHandler = (e) => {
                e.preventDefault();
                console.log("Achievements Button Clicked");
                if (achievementOverlay) {
                    achievementOverlay.classList.remove('hidden');
                    // 渲染成就列表
                    if (window.achievementSystem) {
                        window.achievementSystem.renderAchievementList();
                    }
                }
            };
            btnAchievements.addEventListener('click', this.achievementHandler);
            btnAchievements.addEventListener('touchend', this.achievementHandler);
        }

        const btnCloseAchievement = document.getElementById('btn-close-achievement');
        if (btnCloseAchievement && achievementOverlay) {
            this.closeAchievementHandler = (e) => {
                e.preventDefault();
                achievementOverlay.classList.add('hidden');
            };
            btnCloseAchievement.addEventListener('click', this.closeAchievementHandler);
            btnCloseAchievement.addEventListener('touchend', this.closeAchievementHandler);
        }

        // 画廊按钮
        const galleryOverlay = document.getElementById('gallery-overlay');
        const btnGallery = document.getElementById('btn-gallery');
        if (btnGallery && galleryOverlay) {
            this.galleryHandler = (e) => {
                e.preventDefault();
                console.log("Gallery Button Clicked");
                galleryOverlay.classList.remove('hidden');
                this.renderGallery();
            };
            btnGallery.addEventListener('click', this.galleryHandler);
            btnGallery.addEventListener('touchend', this.galleryHandler);
        }

        const btnCloseGallery = document.getElementById('btn-close-gallery');
        if (btnCloseGallery && galleryOverlay) {
            this.closeGalleryHandler = (e) => {
                e.preventDefault();
                galleryOverlay.classList.add('hidden');
            };
            btnCloseGallery.addEventListener('click', this.closeGalleryHandler);
            btnCloseGallery.addEventListener('touchend', this.closeGalleryHandler);
        }

        const btnLeaderboard = document.getElementById('btn-leaderboard');
        if (btnLeaderboard) {
            this.leaderboardHandler = (e) => {
                e.preventDefault();
                console.log("Leaderboard Button Clicked");
                this.showLeaderboard();
            };
            btnLeaderboard.addEventListener('click', this.leaderboardHandler);
            btnLeaderboard.addEventListener('touchend', this.leaderboardHandler);
        }

        // Check for save
        const save = this.saveSystem.loadRun();
        
        // 检查是否解锁Boss战模式
        const bossRushUnlocked = BossRushMode.isUnlocked();
        
        if (btnContinue) {
            if (bossRushUnlocked) {
                // 通关后：继续游戏按钮变成万神殿挑战
                btnContinue.disabled = false;
                btnContinue.querySelector('.btn-icon').textContent = '👑';
                btnContinue.querySelector('.btn-text').textContent = '万神殿挑战';
                
                // 移除之前的事件
                if (this.continueHandler) {
                    btnContinue.removeEventListener('click', this.continueHandler);
                    btnContinue.removeEventListener('touchend', this.continueHandler);
                }
                
                // 绑定Boss战事件
                this.bossRushHandler = (e) => {
                    e.preventDefault();
                    console.log("Boss Rush Button Clicked");
                    if (this.audioManager && this.audioManager.resume) this.audioManager.resume();
                    if (this.onBossRush) this.onBossRush();
                };
                btnContinue.addEventListener('click', this.bossRushHandler);
                btnContinue.addEventListener('touchend', this.bossRushHandler);
            } else {
                // 未通关：正常显示继续游戏
                btnContinue.querySelector('.btn-icon').textContent = '📜';
                btnContinue.querySelector('.btn-text').textContent = '继续游戏';
                btnContinue.disabled = !save;
            }
        }
        
        // 隐藏独立的Boss战按钮（因为已替换到继续游戏按钮）
        const btnBossRush = document.getElementById('btn-boss-rush');
        if (btnBossRush) {
            btnBossRush.classList.add('hidden');
        }
    }

    unbindEvents() {
        const btnStart = document.getElementById('btn-start');
        if (btnStart && this.startHandler) {
            btnStart.removeEventListener('click', this.startHandler);
            btnStart.removeEventListener('touchend', this.startHandler);
        }

        const btnContinue = document.getElementById('btn-continue');
        if (btnContinue && this.continueHandler) {
            btnContinue.removeEventListener('click', this.continueHandler);
            btnContinue.removeEventListener('touchend', this.continueHandler);
        }

        const btnTutorial = document.getElementById('btn-tutorial');
        if (btnTutorial && this.tutorialHandler) {
            btnTutorial.removeEventListener('click', this.tutorialHandler);
            btnTutorial.removeEventListener('touchend', this.tutorialHandler);
        }

        const btnCloseTutorial = document.getElementById('btn-close-tutorial');
        if (btnCloseTutorial && this.closeTutorialHandler) {
            btnCloseTutorial.removeEventListener('click', this.closeTutorialHandler);
            btnCloseTutorial.removeEventListener('touchend', this.closeTutorialHandler);
        }

        const btnLeaderboard = document.getElementById('btn-leaderboard');
        if (btnLeaderboard && this.leaderboardHandler) {
            btnLeaderboard.removeEventListener('click', this.leaderboardHandler);
            btnLeaderboard.removeEventListener('touchend', this.leaderboardHandler);
        }
        
        const btnCredits = document.getElementById('btn-credits');
        if (btnCredits && this.creditsHandler) {
            btnCredits.removeEventListener('click', this.creditsHandler);
            btnCredits.removeEventListener('touchend', this.creditsHandler);
        }
        
        const btnCloseCredits = document.getElementById('btn-close-credits');
        if (btnCloseCredits && this.closeCreditsHandler) {
            btnCloseCredits.removeEventListener('click', this.closeCreditsHandler);
            btnCloseCredits.removeEventListener('touchend', this.closeCreditsHandler);
        }
        
        const btnAchievements = document.getElementById('btn-achievements');
        if (btnAchievements && this.achievementHandler) {
            btnAchievements.removeEventListener('click', this.achievementHandler);
            btnAchievements.removeEventListener('touchend', this.achievementHandler);
        }
        
        const btnCloseAchievement = document.getElementById('btn-close-achievement');
        if (btnCloseAchievement && this.closeAchievementHandler) {
            btnCloseAchievement.removeEventListener('click', this.closeAchievementHandler);
            btnCloseAchievement.removeEventListener('touchend', this.closeAchievementHandler);
        }
        
        const btnBossRush = document.getElementById('btn-boss-rush');
        if (btnBossRush && this.bossRushHandler) {
            btnBossRush.removeEventListener('click', this.bossRushHandler);
            btnBossRush.removeEventListener('touchend', this.bossRushHandler);
        }
        
        const btnGallery = document.getElementById('btn-gallery');
        if (btnGallery && this.galleryHandler) {
            btnGallery.removeEventListener('click', this.galleryHandler);
            btnGallery.removeEventListener('touchend', this.galleryHandler);
        }
        
        const btnCloseGallery = document.getElementById('btn-close-gallery');
        if (btnCloseGallery && this.closeGalleryHandler) {
            btnCloseGallery.removeEventListener('click', this.closeGalleryHandler);
            btnCloseGallery.removeEventListener('touchend', this.closeGalleryHandler);
        }
    }

    showLeaderboard() {
        // Simple alert or overlay for prototype
        const data = this.saveSystem.getLeaderboard();
        let text = "排行榜 (Leaderboard):\n";
        data.forEach((entry, i) => {
            text += `${i + 1}. ${entry.score} pts - Level ${entry.level}\n`;
        });
        if (data.length === 0) text += "暂无数据 (No Data)";
        alert(text);
    }

    renderGallery() {
        const grid = document.getElementById('gallery-grid');
        const progressText = document.getElementById('gallery-progress-text');
        if (!grid || !window.gallerySystem) return;
        
        const bossData = window.gallerySystem.getAllBossData();
        const progress = window.gallerySystem.getProgress();
        
        if (progressText) {
            progressText.textContent = `${progress.unlocked}/${progress.total} (${progress.percent}%)`;
        }
        
        grid.innerHTML = '';
        
        bossData.forEach(boss => {
            const card = document.createElement('div');
            card.className = `gallery-card ${boss.unlocked ? '' : 'locked'}`;
            
            const levelText = boss.isMutated ? `Lv${boss.level} 异化` : `Lv${boss.level}`;
            const killText = boss.unlocked ? `击杀: ${boss.kills}次` : '未解锁 (击杀1次解锁)';
            
            // 确定显示的图片
            let imageContent;
            if (boss.unlocked) {
                imageContent = `<img src="assets/gallery/${boss.image}" onerror="this.parentElement.innerHTML='🎭'">`;
            } else if (boss.lockedImage) {
                imageContent = `<img src="assets/gallery/${boss.lockedImage}" onerror="this.parentElement.innerHTML='❓'">`;
            } else {
                imageContent = '❓';
            }
            
            card.innerHTML = `
                <div class="gallery-image">
                    ${imageContent}
                </div>
                <div class="gallery-name">${boss.name}</div>
                <div class="gallery-title">${boss.title}</div>
                ${boss.isMutated ? '<div class="gallery-mutated">⚡ 异化形态</div>' : ''}
                <div class="gallery-kills">${killText}</div>
            `;
            
            grid.appendChild(card);
        });
    }

    enter() {
        this.menuContainer.classList.remove('hidden');
        // Re-check save
        const save = this.saveSystem.loadRun();
        const btnContinue = document.getElementById('btn-continue');
        const bossRushUnlocked = BossRushMode.isUnlocked();
        
        if (btnContinue) {
            if (bossRushUnlocked) {
                // 通关后：继续游戏按钮变成万神殿挑战
                btnContinue.disabled = false;
                btnContinue.querySelector('.btn-icon').textContent = '👑';
                btnContinue.querySelector('.btn-text').textContent = '万神殿挑战';
            } else {
                // 未通关：正常显示继续游戏
                btnContinue.querySelector('.btn-icon').textContent = '📜';
                btnContinue.querySelector('.btn-text').textContent = '继续游戏';
                btnContinue.disabled = !save;
            }
        }
        
        // 隐藏独立的Boss战按钮
        const btnBossRush = document.getElementById('btn-boss-rush');
        if (btnBossRush) {
            btnBossRush.classList.add('hidden');
        }
        
        // 启动菜单动画
        if (this.menuAnimation) {
            this.menuAnimation.init();
        }
        
        // 播放主菜单音乐
        if (this.audioManager) {
            this.audioManager.playMusic('menu');
        }
    }

    exit() {
        this.menuContainer.classList.add('hidden');
        this.tutorialOverlay.classList.add('hidden');
        
        // 停止菜单动画
        if (this.menuAnimation) {
            this.menuAnimation.stop();
        }
    }

    update(deltaTime) {
        // Background animation?
    }

    draw(ctx) {
        // Draw a cool background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Placeholder title art
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, 200, 0, Math.PI * 2);
        ctx.fill();
    }
}
