export class HealthPack {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.healAmount = 30;
        this.color = '#2ecc71';
        this.markedForDeletion = false;
    }

    update(deltaTime) {
        // Pulse animation
        this.pulseTimer = (this.pulseTimer || 0) + deltaTime * 3;
    }

    checkPickup(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.radius + player.radius) {
            // Heal player
            player.hp = Math.min(player.maxHp, player.hp + this.healAmount);
            this.markedForDeletion = true;
            return true;
        }
        return false;
    }

    draw(ctx) {
        const pulse = Math.sin(this.pulseTimer || 0) * 0.2 + 1;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.radius, this.radius * pulse, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Health pack
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Cross symbol
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x - 8, this.y);
        ctx.lineTo(this.x + 8, this.y);
        ctx.moveTo(this.x, this.y - 8);
        ctx.lineTo(this.x, this.y + 8);
        ctx.stroke();
    }
}

export class HealthPackManager {
    constructor(player) {
        this.player = player;
        this.healthPacks = [];
        this.spawnTimer = 0;
        this.spawnInterval = 10;
        this.spawnChance = 0.6;
        this.onPickup = null;
    }

    update(deltaTime) {
        this.spawnTimer += deltaTime;

        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            if (Math.random() < this.spawnChance) {
                this.spawnHealthPack();
            }
        }

        // Update and check pickups
        for (let i = this.healthPacks.length - 1; i >= 0; i--) {
            const pack = this.healthPacks[i];
            pack.update(deltaTime);
            const picked = pack.checkPickup(this.player);

            if (pack.markedForDeletion) {
                if (picked && this.onPickup) this.onPickup();
                this.healthPacks.splice(i, 1);
            }
        }
    }

    spawnHealthPack() {
        // Spawn near player but not too close
        const angle = Math.random() * Math.PI * 2;
        const dist = 200 + Math.random() * 300;
        const x = this.player.x + Math.cos(angle) * dist;
        const y = this.player.y + Math.sin(angle) * dist;

        this.healthPacks.push(new HealthPack(x, y));
    }

    draw(ctx) {
        this.healthPacks.forEach(pack => pack.draw(ctx));
    }
}
