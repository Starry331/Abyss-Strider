export class InputManager {
    constructor() {
        this.keys = {};
        this.touchState = {
            joystick: { x: 0, y: 0, active: false },
            buttons: { block: false, roll: false, switch: false }
        };

        // Unified Input State
        this.input = {
            move: { x: 0, y: 0 },
            block: false,
            roll: false,
            switchWeapon: false,
            attack: false // Auto-attack logic might handle this, but input can trigger it too
        };
        
        // 作弊码系统
        this.cheatBuffer = '';
        this.cheatTimeout = null;
        this.godModeActive = false;

        this.initKeyboard();
        this.initTouch();
    }
    
    // 检测作弊码 00330 = 无敌模式
    checkCheatCode(key) {
        // 只接受数字键
        if (key >= 'Digit0' && key <= 'Digit9') {
            const num = key.replace('Digit', '');
            this.cheatBuffer += num;
            
            // 重置超时
            if (this.cheatTimeout) clearTimeout(this.cheatTimeout);
            this.cheatTimeout = setTimeout(() => {
                this.cheatBuffer = '';
            }, 2000);
            
            // 检查是否匹配 00330
            if (this.cheatBuffer.endsWith('00330')) {
                this.godModeActive = !this.godModeActive;
                this.cheatBuffer = '';
                
                // 触发作弊码激活事件
                if (this.onCheatActivated) {
                    this.onCheatActivated(this.godModeActive);
                }
                
                console.log('作弊码激活: 无敌模式 =', this.godModeActive);
                return true;
            }
        }
        return false;
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            // 防止空格键滚动页面
            if (e.code === 'Space') e.preventDefault();
            this.keys[e.code] = true;
            this.updateInputState();
            
            // 检测作弊码
            this.checkCheatCode(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.updateInputState();
        });
        
        // 页面失焦时重置所有输入状态，防止切换页面后方向失控
        window.addEventListener('blur', () => this.resetAllInput());
        window.addEventListener('visibilitychange', () => {
            if (document.hidden) this.resetAllInput();
        });
    }
    
    // 重置所有输入状态
    resetAllInput() {
        this.keys = {};
        this.touchState.joystick = { x: 0, y: 0, active: false };
        this.touchState.buttons = { block: false, roll: false, switch: false };
        this.input.move = { x: 0, y: 0 };
        this.input.block = false;
        this.input.roll = false;
        this.input.switchWeapon = false;
        this.input.attack = false;
        // 重置摇杆视觉
        const handle = document.getElementById('joystick-handle');
        if (handle) handle.style.transform = 'translate(-50%, -50%)';
    }

    initTouch() {
        // Touch controls are handled via HTML elements in index.html
        // We attach listeners to those specific elements

        // Joystick (Simplified implementation for prototype)
        const joystickArea = document.getElementById('joystick-area');
        if (joystickArea) {
            joystickArea.addEventListener('touchstart', (e) => this.handleJoystickStart(e));
            joystickArea.addEventListener('touchmove', (e) => this.handleJoystickMove(e));
            joystickArea.addEventListener('touchend', (e) => this.handleJoystickEnd(e));
        }

        // Buttons
        this.bindTouchButton('btn-mobile-block', 'block');
        this.bindTouchButton('btn-mobile-roll', 'roll');
        this.bindTouchButton('btn-mobile-switch', 'switch');
    }

    bindTouchButton(id, action) {
        const btn = document.getElementById(id);
        if (!btn) return;

        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchState.buttons[action] = true;
            this.updateInputState();
        });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchState.buttons[action] = false;
            this.updateInputState();
        });
    }

    handleJoystickStart(e) {
        e.preventDefault();
        this.touchState.joystick.active = true;
        this.handleJoystickMove(e);
    }

    handleJoystickMove(e) {
        e.preventDefault();
        if (!this.touchState.joystick.active) return;

        const touch = e.touches[0];
        const joystickArea = document.getElementById('joystick-area');
        const rect = joystickArea.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;

        // Normalize
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDist = rect.width / 2;

        const normalizedDist = Math.min(distance, maxDist) / maxDist;
        const angle = Math.atan2(dy, dx);

        this.touchState.joystick.x = Math.cos(angle) * normalizedDist;
        this.touchState.joystick.y = Math.sin(angle) * normalizedDist;

        // Update visual handle
        const handle = document.getElementById('joystick-handle');
        if (handle) {
            const moveDist = Math.min(distance, maxDist);
            const moveX = Math.cos(angle) * moveDist;
            const moveY = Math.sin(angle) * moveDist;
            handle.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
        }

        this.updateInputState();
    }

    handleJoystickEnd(e) {
        e.preventDefault();
        this.touchState.joystick.active = false;
        this.touchState.joystick.x = 0;
        this.touchState.joystick.y = 0;

        // Reset visual handle
        const handle = document.getElementById('joystick-handle');
        if (handle) {
            handle.style.transform = `translate(-50%, -50%)`;
        }

        this.updateInputState();
    }

    updateInputState() {
        // ===== 优化8向移动 =====
        let kx = 0, ky = 0;  // 键盘输入
        let tx = 0, ty = 0;  // 触屏输入

        // 键盘WASD输入
        if (this.keys['KeyW']) ky -= 1;
        if (this.keys['KeyS']) ky += 1;
        if (this.keys['KeyA']) kx -= 1;
        if (this.keys['KeyD']) kx += 1;

        // 键盘对角移动标准化(保证8向等速)
        if (kx !== 0 && ky !== 0) {
            const diag = 0.7071; // 1/sqrt(2)
            kx *= diag;
            ky *= diag;
        }

        // 触屏摇杆输入
        tx = this.touchState.joystick.x;
        ty = this.touchState.joystick.y;

        // 合并输入，优先使用幅度更大的
        let x, y;
        const kLen = Math.sqrt(kx * kx + ky * ky);
        const tLen = Math.sqrt(tx * tx + ty * ty);
        
        if (kLen > 0.1 && kLen >= tLen) {
            x = kx;
            y = ky;
        } else if (tLen > 0.1) {
            x = tx;
            y = ty;
        } else {
            x = 0;
            y = 0;
        }

        // 最终标准化，确保最大速度为1
        const finalLen = Math.sqrt(x * x + y * y);
        if (finalLen > 1) {
            x /= finalLen;
            y /= finalLen;
        }

        this.input.move.x = x;
        this.input.move.y = y;

        // Actions
        this.input.block = this.keys['KeyJ'] || this.touchState.buttons.block;
        this.input.roll = this.keys['KeyK'] || this.keys['Space'] || this.touchState.buttons.roll;
        this.input.switchWeapon = this.keys['KeyQ'] || this.touchState.buttons.switch;
    }

    getInput() {
        return this.input;
    }
}
