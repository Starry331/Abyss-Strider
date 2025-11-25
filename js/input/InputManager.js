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

        this.initKeyboard();
        this.initTouch();
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.updateInputState();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.updateInputState();
        });
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
        // Reset transient states if needed, or handle in update loop
        // Here we combine keyboard and touch

        // Movement
        let x = 0;
        let y = 0;

        if (this.keys['KeyW']) y -= 1;
        if (this.keys['KeyS']) y += 1;
        if (this.keys['KeyA']) x -= 1;
        if (this.keys['KeyD']) x += 1;

        // Normalize keyboard vector
        if (x !== 0 || y !== 0) {
            const len = Math.sqrt(x * x + y * y);
            x /= len;
            y /= len;
        }

        // Add touch input
        x += this.touchState.joystick.x;
        y += this.touchState.joystick.y;

        // Clamp
        if (Math.abs(x) > 1) x = Math.sign(x);
        if (Math.abs(y) > 1) y = Math.sign(y);

        this.input.move.x = x;
        this.input.move.y = y;

        // Actions
        this.input.block = this.keys['KeyJ'] || this.touchState.buttons.block;
        this.input.roll = this.keys['KeyK'] || this.touchState.buttons.roll;

        // Weapon switch is a trigger, usually handled as a single press event
        // For continuous polling, we just check state. Logic elsewhere handles "just pressed"
        this.input.switchWeapon = this.keys['KeyQ'] || this.touchState.buttons.switch;
    }

    getInput() {
        return this.input;
    }
}
