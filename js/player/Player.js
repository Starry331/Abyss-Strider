export class Player {
    constructor(x, y, inputManager) {
        this.x = x;
        this.y = y;
        this.inputManager = inputManager;
        this.speed = 200;
        this.radius = 20;
        this.color = '#3498db';

        // Stats
        this.maxHp = 100;
        this.hp = 100;
        this.maxShield = 0;
        this.shield = 0;
        this.facing = { x: 1, y: 0 };

        // State Machine
        this.state = 'IDLE';
        this.stateTimer = 0;

        // Combat Stats
        this.blockReduction = 0.6;
        this.rollDuration = 0.3;
        this.rollSpeed = 500;
        this.rollCooldown = 0.8;
        this.rollCooldownTimer = 0;
        this.invincible = false;

        // Hit feedback
        this.hitFlashTimer = 0;
        this.invincibilityTimer = 0;
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };

        // Weapon
        this.weaponSystem = null;

        // Buffs
        this.activeBuffs = {};
        this.baseSpeed = this.speed;
        this.damageMultiplier = 1;
        this.maxHpBase = this.maxHp;
        
        // 特殊属性
        this.hpRegen = 0;         // 每秒回血
        this.damageReduction = 0; // 减伤百分比
    }

    setWeaponSystem(ws) {
        this.weaponSystem = ws;
    }

    update(deltaTime) {
        if (this.state === 'DEAD') return;

        // Update timers
        if (this.hitFlashTimer > 0) this.hitFlashTimer -= deltaTime;
        if (this.invincibilityTimer > 0) this.invincibilityTimer -= deltaTime;
        if (this.rollCooldownTimer > 0) this.rollCooldownTimer -= deltaTime;

        // Update buffs
        const now = performance.now();
        for (const [type, buff] of Object.entries(this.activeBuffs)) {
            if (now >= buff.expiresAt) {
                this.removeBuff(type);
            }
        }
        
        // HP回复
        if (this.hpRegen && this.hpRegen > 0) {
            this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * deltaTime);
        }

        const input = this.inputManager.getInput();

        // State Logic
        switch (this.state) {
            case 'IDLE':
            case 'RUN':
                this.handleMovement(input, deltaTime);
                this.handleActions(input);
                break;
            case 'BLOCK':
                this.handleBlock(input, deltaTime);
                break;
            case 'ROLL':
                this.handleRoll(deltaTime);
                break;
            case 'ATTACK':
                this.handleMovement(input, deltaTime);
                this.handleActions(input);
                break;
        }

        // Update Weapon System
        if (this.weaponSystem) {
            const isBlocking = this.state === 'BLOCK';
            const isRolling = this.state === 'ROLL';
            this.weaponSystem.update(deltaTime, this, input, isBlocking || isRolling);
        }
    }

    handleMovement(input, deltaTime) {
        if (input.move.x !== 0 || input.move.y !== 0) {
            this.state = 'RUN';
            this.x += input.move.x * this.speed * deltaTime;
            this.y += input.move.y * this.speed * deltaTime;
            this.facing = { x: input.move.x, y: input.move.y };
        } else {
            this.state = 'IDLE';
        }

        // Keep in bounds
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
        }
    }

    handleActions(input) {
        // Block
        if (input.block && this.state !== 'ROLL') {
            if (this.state !== 'BLOCK') {
                // 格挡开始音效
                if (this.onBlock) this.onBlock();
            }
            this.state = 'BLOCK';
            this.stateTimer = 0;
            return;
        }

        // Roll
        if (input.roll && this.rollCooldownTimer <= 0 && this.state !== 'ROLL') {
            this.state = 'ROLL';
            this.stateTimer = 0;
            this.invincible = true;
            this.rollCooldownTimer = this.rollCooldown;

            if (input.move.x === 0 && input.move.y === 0) {
                this.rollDir = { ...this.facing };
            } else {
                this.rollDir = { x: input.move.x, y: input.move.y };
            }
            // 翻滚音效
            if (this.onRoll) this.onRoll();
            return;
        }

        // Switch Weapon
        if (input.switchWeapon && this.weaponSystem) {
            if (!this.lastSwitchState) {
                this.weaponSystem.switchWeapon();
            }
        }
        this.lastSwitchState = input.switchWeapon;
    }

    handleBlock(input, deltaTime) {
        if (!input.block) {
            this.state = 'IDLE';
            return;
        }

        this.stateTimer += deltaTime;
        if (this.stateTimer > 2.0) {
            this.state = 'IDLE';
        }
    }

    handleRoll(deltaTime) {
        this.stateTimer += deltaTime;
        this.x += this.rollDir.x * this.rollSpeed * deltaTime;
        this.y += this.rollDir.y * this.rollSpeed * deltaTime;

        if (this.stateTimer >= this.rollDuration) {
            this.state = 'IDLE';
            this.invincible = false;
        }
    }

    takeDamage(amount) {
        if (this.invincible || this.invincibilityTimer > 0) return;

        if (typeof amount !== 'number' || isNaN(amount)) {
            console.error('Invalid damage amount:', amount);
            return;
        }

        let finalDamage = Math.max(0, amount);

        // Block reduction
        if (this.state === 'BLOCK') {
            finalDamage *= (1 - this.blockReduction);
        }
        
        // 减伤(来自赐福)
        if (this.damageReduction && this.damageReduction > 0) {
            finalDamage *= (1 - Math.min(0.9, this.damageReduction));
        }

        // Shield absorption
        if (this.shield > 0) {
            if (finalDamage <= this.shield) {
                this.shield -= finalDamage;
                finalDamage = 0;
            } else {
                finalDamage -= this.shield;
                this.shield = 0;
            }
        }

        // Apply damage
        this.hp = Math.max(0, this.hp - finalDamage);

        // Hit feedback
        this.hitFlashTimer = 0.15;
        this.invincibilityTimer = 0.2;
        
        // 音效回调
        if (this.onHit) this.onHit(finalDamage);

        // Screen shake based on damage
        const shakeIntensity = Math.min(10, finalDamage * 0.5);
        this.screenShake = {
            x: 0,
            y: 0,
            intensity: shakeIntensity,
            duration: 0.25
        };

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }

        this.updateHealthUI();
        console.log(`Player took ${finalDamage.toFixed(1)} damage. HP: ${this.hp}/${this.maxHp}, Shield: ${this.shield}/${this.maxShield}`);
    }

    updateHealthUI() {
        const hpBar = document.getElementById('health-bar-fill');
        const shieldBar = document.getElementById('shield-bar-fill');
        const hpText = document.getElementById('health-text');

        const hpPercent = Math.max(0, Math.min(100, (this.hp / this.maxHp) * 100));
        let shieldPercent = 0;
        if (this.maxShield > 0) {
            shieldPercent = Math.max(0, Math.min(100, (this.shield / this.maxShield) * 100));
        }

        if (hpBar) hpBar.style.width = `${hpPercent}%`;
        if (shieldBar) shieldBar.style.width = `${shieldPercent}%`;
        if (hpText) hpText.innerText = `血条 HP: ${Math.ceil(this.hp)}/${this.maxHp} ${this.shield > 0 ? `(Shield: ${Math.ceil(this.shield)})` : ''}`;
    }

    applyBuff({ type, duration }) {
        const expiresAt = performance.now() + duration;
        this.activeBuffs[type] = { type, expiresAt };

        switch (type) {
            case 'HP_MAX':
                this.maxHp += 30;
                this.hp += 30;
                break;
            case 'ATTACK_BOOST':
                this.damageMultiplier = 1.5;
                break;
            case 'SPEED_BOOST':
                this.speed = this.baseSpeed * 1.4;
                break;
            case 'SHIELD':
                this.maxShield = 50;
                this.shield = 50;
                break;
            case 'ATTACK_SPEED':
                this.attackSpeedMultiplier = 1.3;
                break;
            case 'CRIT_CHANCE':
                this.critChance = 0.15;
                this.critMultiplier = 2.0;
                break;
            case 'LIFESTEAL':
                this.lifesteal = 0.1;
                break;
            case 'INVINCIBLE':
                this.invincible = true;
                break;
            case 'MEGA_BOOST':
                this.damageMultiplier = 2.0;
                this.speed = this.baseSpeed * 1.5;
                this.attackSpeedMultiplier = 1.5;
                break;
        }
        this.updateHealthUI();
    }

    removeBuff(type) {
        const buff = this.activeBuffs[type];
        if (!buff) return;

        switch (type) {
            case 'HP_MAX':
                this.maxHp = this.maxHpBase;
                if (this.hp > this.maxHp) this.hp = this.maxHp;
                break;
            case 'ATTACK_BOOST':
                this.damageMultiplier = 1;
                break;
            case 'SPEED_BOOST':
                this.speed = this.baseSpeed;
                break;
            case 'SHIELD':
                this.maxShield = 0;
                this.shield = 0;
                break;
            case 'ATTACK_SPEED':
                this.attackSpeedMultiplier = 1;
                break;
            case 'CRIT_CHANCE':
                this.critChance = 0;
                this.critMultiplier = 1;
                break;
            case 'LIFESTEAL':
                this.lifesteal = 0;
                break;
            case 'INVINCIBLE':
                this.invincible = false;
                break;
            case 'MEGA_BOOST':
                this.damageMultiplier = 1;
                this.speed = this.baseSpeed;
                this.attackSpeedMultiplier = 1;
                break;
        }
        delete this.activeBuffs[type];
        this.updateHealthUI();
    }

    die() {
        this.state = 'DEAD';
        console.log("Player Died");
    }

    draw(ctx) {
        // Hit flash effect
        const originalAlpha = ctx.globalAlpha;
        if (this.hitFlashTimer > 0) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = originalAlpha;
        }

        // Use enhanced renderer if available
        if (window.Renderer2D) {
            window.Renderer2D.drawPlayer(ctx, this);
        } else {
            // Fallback rendering
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + this.radius, this.radius, this.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Body
            ctx.fillStyle = this.color;
            if (this.state === 'BLOCK') ctx.fillStyle = '#f39c12';
            if (this.invincible || this.invincibilityTimer > 0) ctx.globalAlpha = 0.5;

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Facing indicator
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.facing.x * 30, this.y + this.facing.y * 30);
            ctx.stroke();
        }

        // Shield indicator
        if (this.shield > 0) {
            const shieldAlpha = this.shield / this.maxShield;
            ctx.strokeStyle = `rgba(100, 200, 255, ${shieldAlpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Weapon
        if (this.weaponSystem) {
            this.weaponSystem.draw(ctx, this);
        }
    }
}
