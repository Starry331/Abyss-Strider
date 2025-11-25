import { MenuAnimation } from '../ui/MenuAnimation.js';

export class MenuScene {
    constructor(uiManager, saveSystem, onStart, onContinue, audioManager = null) {
        console.log("=== MenuScene Constructor Called ===");
        this.uiManager = uiManager;
        this.saveSystem = saveSystem;
        this.onStart = onStart;
        this.onContinue = onContinue;
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
            this.startHandler = () => {
                console.log("Start Button Clicked");
                if (this.audioManager && this.audioManager.resume) this.audioManager.resume();
                this.onStart();
            };
            btnStart.addEventListener('click', this.startHandler);
        } else {
            console.error("Start Button Not Found!");
        }

        const btnContinue = document.getElementById('btn-continue');
        if (btnContinue) {
            this.continueHandler = () => {
                console.log("Continue Button Clicked");
                this.onContinue();
            };
            btnContinue.addEventListener('click', this.continueHandler);
        }

        const btnTutorial = document.getElementById('btn-tutorial');
        if (btnTutorial) {
            this.tutorialHandler = () => {
                console.log("Tutorial Button Clicked");
                this.tutorialOverlay.classList.remove('hidden');
            };
            btnTutorial.addEventListener('click', this.tutorialHandler);
        }

        const btnCloseTutorial = document.getElementById('btn-close-tutorial');
        if (btnCloseTutorial) {
            this.closeTutorialHandler = () => {
                console.log("Close Tutorial Clicked");
                this.tutorialOverlay.classList.add('hidden');
            };
            btnCloseTutorial.addEventListener('click', this.closeTutorialHandler);
        }

        // 开发人员按钮
        const creditsOverlay = document.getElementById('credits-overlay');
        const btnCredits = document.getElementById('btn-credits');
        if (btnCredits && creditsOverlay) {
            this.creditsHandler = () => {
                console.log("Credits Button Clicked");
                creditsOverlay.classList.remove('hidden');
            };
            btnCredits.addEventListener('click', this.creditsHandler);
        }

        const btnCloseCredits = document.getElementById('btn-close-credits');
        if (btnCloseCredits && creditsOverlay) {
            this.closeCreditsHandler = () => {
                creditsOverlay.classList.add('hidden');
            };
            btnCloseCredits.addEventListener('click', this.closeCreditsHandler);
        }

        // 成就按钮
        const btnAchievements = document.getElementById('btn-achievements');
        const achievementOverlay = document.getElementById('achievement-overlay');
        if (btnAchievements) {
            this.achievementHandler = () => {
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
        }

        const btnCloseAchievement = document.getElementById('btn-close-achievement');
        if (btnCloseAchievement && achievementOverlay) {
            this.closeAchievementHandler = () => {
                achievementOverlay.classList.add('hidden');
            };
            btnCloseAchievement.addEventListener('click', this.closeAchievementHandler);
        }

        const btnLeaderboard = document.getElementById('btn-leaderboard');
        if (btnLeaderboard) {
            this.leaderboardHandler = () => {
                console.log("Leaderboard Button Clicked");
                this.showLeaderboard();
            };
            btnLeaderboard.addEventListener('click', this.leaderboardHandler);
        }

        // Check for save
        const save = this.saveSystem.loadRun();
        if (save && btnContinue) {
            btnContinue.disabled = false;
        }
    }

    unbindEvents() {
        const btnStart = document.getElementById('btn-start');
        if (btnStart && this.startHandler) {
            btnStart.removeEventListener('click', this.startHandler);
        }

        const btnContinue = document.getElementById('btn-continue');
        if (btnContinue && this.continueHandler) {
            btnContinue.removeEventListener('click', this.continueHandler);
        }

        const btnTutorial = document.getElementById('btn-tutorial');
        if (btnTutorial && this.tutorialHandler) {
            btnTutorial.removeEventListener('click', this.tutorialHandler);
        }

        const btnCloseTutorial = document.getElementById('btn-close-tutorial');
        if (btnCloseTutorial && this.closeTutorialHandler) {
            btnCloseTutorial.removeEventListener('click', this.closeTutorialHandler);
        }

        const btnLeaderboard = document.getElementById('btn-leaderboard');
        if (btnLeaderboard && this.leaderboardHandler) {
            btnLeaderboard.removeEventListener('click', this.leaderboardHandler);
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

    enter() {
        this.menuContainer.classList.remove('hidden');
        // Re-check save
        const save = this.saveSystem.loadRun();
        document.getElementById('btn-continue').disabled = !save;
        
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
