export class EnemyAI {
    constructor(x, y, type, player, level = 1) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.player = player;
        this.radius = 15;
        this.color = '#e74c3c';
        this.level = level;

        // Stats based on type
        this.setupStats();

        this.state = 'CHASE'; // IDLE, CHASE, ATTACK, DEAD
        this.attackTimer = 0;
    }

    setupStats() {
        const levelMultiplier = 1 + (this.level - 1) * 0.15; // 15% increase per level

        switch (this.type) {
            case 'COMMON':
                this.hp = Math.floor(15 * levelMultiplier); // Low HP
                this.damage = Math.floor(3 * levelMultiplier);
                this.speed = 80;
                this.attackRange = 40;
                this.scoreReward = 40;
                this.color = '#bdc3c7'; // Grey
                this.radius = 15;
                break;
            case 'ELITE':
                this.hp = Math.floor(40 * levelMultiplier);
                this.damage = Math.floor(8 * levelMultiplier);
                this.speed = 70;
                this.attackRange = 60;
                this.scoreReward = 75;
                this.color = '#f1c40f'; // Yellow
                this.radius = 20;
                break;
            case 'LARGE':
                this.hp = Math.floor(80 * levelMultiplier);
                this.damage = Math.floor(12 * levelMultiplier);
                this.speed = 50;
                this.attackRange = 80;
                this.scoreReward = 150;
                this.color = '#8e44ad'; // Purple
                this.radius = 28;
                break;
        }
        this.maxHp = this.hp;
    }

    update(deltaTime) {
        if (this.attackTimer > 0) this.attackTimer -= deltaTime;

        const dist = this.getDistToPlayer();

        switch (this.state) {
            case 'CHASE':
                if (dist <= this.attackRange) {
                    this.state = 'ATTACK';
                } else {
                    this.moveTowardsPlayer(deltaTime);
                }
                break;
            case 'ATTACK':
                if (dist > this.attackRange * 1.5) {
                    this.state = 'CHASE';
                } else {
                    if (this.attackTimer <= 0) {
                        this.attack();
                        this.attackTimer = 1.5; // Cooldown
                    }
                }
                break;
        }
    }

    getDistToPlayer() {
        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    moveTowardsPlayer(deltaTime) {
        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed * deltaTime;
            this.y += (dy / dist) * this.speed * deltaTime;
        }
    }

    attack() {
        // Simple attack logic: if in range, deal damage?
        // Or spawn hitbox?
        // For prototype, direct damage check if still in range
        if (this.getDistToPlayer() <= this.attackRange) {
            // Player takes damage
            this.player.takeDamage(this.damage);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        // Flash white logic could go here
    }

    draw(ctx) {
        // Use enhanced renderer if available
        if (window.Renderer2D) {
            window.Renderer2D.drawEnemy(ctx, this);
        } else {
            // Fallback rendering
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // HP Bar
        const hpPct = this.hp / this.maxHp;
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, this.radius * 2, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, this.radius * 2 * hpPct, 5);
    }
}
