/**
 * Character Sprite Renderer
 * Draws cool swordsman player and monster-style enemies
 */

export class CharacterRenderer {
    static drawHumanoidPlayer(ctx, player) {
        ctx.save();
        ctx.translate(player.x, player.y);

        const angle = Math.atan2(player.facing.y, player.facing.x);

        const scale = player.radius / 20;

        // Shadow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(0, 25 * scale, 18 * scale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Glow effect when invincible
        if (player.invincible) {
            ctx.shadowColor = '#3498db';
            ctx.shadowBlur = 25;
            ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 100) * 0.3;
        }

        // Body color based on state
        let armorColor = '#34495e';
        let capeColor = '#2980b9';
        let accentColor = '#3498db';

        if (player.state === 'BLOCK') {
            armorColor = '#d35400';
            accentColor = '#e67e22';
            capeColor = '#f39c12';
        }

        // Cape (flowing behind)
        ctx.fillStyle = capeColor;
        ctx.beginPath();
        ctx.moveTo(-8 * scale, -8 * scale);
        ctx.quadraticCurveTo(-18 * scale, 5 * scale, -12 * scale, 20 * scale);
        ctx.lineTo(-6 * scale, 15 * scale);
        ctx.lineTo(-6 * scale, -5 * scale);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(8 * scale, -8 * scale);
        ctx.quadraticCurveTo(18 * scale, 5 * scale, 12 * scale, 20 * scale);
        ctx.lineTo(6 * scale, 15 * scale);
        ctx.lineTo(6 * scale, -5 * scale);
        ctx.closePath();
        ctx.fill();

        // Legs (armored)
        ctx.fillStyle = armorColor;
        ctx.fillRect(-7 * scale, 8 * scale, 5 * scale, 14 * scale);
        ctx.fillRect(2 * scale, 8 * scale, 5 * scale, 14 * scale);

        // Body (armored chest)
        ctx.fillStyle = armorColor;
        ctx.fillRect(-10 * scale, -10 * scale, 20 * scale, 20 * scale);

        // Accent lines on armor
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8 * scale, -5 * scale);
        ctx.lineTo(-8 * scale, 5 * scale);
        ctx.moveTo(8 * scale, -5 * scale);
        ctx.lineTo(8 * scale, 5 * scale);
        ctx.stroke();

        // Helmet/Head
        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.arc(0, -16 * scale, 9 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Visor slit (glowing eyes)
        ctx.fillStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 8;
        ctx.fillRect(-6 * scale, -17 * scale, 12 * scale, 3 * scale);

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }

    static drawMonsterEnemy(ctx, enemy) {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        const scale = enemy.radius / 15;
        const time = Date.now() / 1000;

        // Shadow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(0, 15 * scale, enemy.radius * 0.8, enemy.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Different monster types based on enemy type
        if (enemy.type === 'COMMON') {
            // Slime blob
            const bounce = Math.sin(time * 5) * 2 * scale;
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.ellipse(0, bounce, enemy.radius * 0.9, enemy.radius * 1.1, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-5 * scale, -3 * scale + bounce, 3 * scale, 0, Math.PI * 2);
            ctx.arc(5 * scale, -3 * scale + bounce, 3 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(-3 * scale, -8 * scale + bounce, 4 * scale, 0, Math.PI * 2);
            ctx.fill();

        } else if (enemy.type === 'ELITE') {
            // Spiky demon
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
            ctx.fill();

            // Spikes
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * enemy.radius * 0.7, Math.sin(angle) * enemy.radius * 0.7);
                ctx.lineTo(Math.cos(angle) * enemy.radius * 1.3, Math.sin(angle) * enemy.radius * 1.3);
                ctx.lineTo(Math.cos(angle + 0.2) * enemy.radius * 0.8, Math.sin(angle + 0.2) * enemy.radius * 0.8);
                ctx.closePath();
                ctx.fill();
            }

            // Evil eyes
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(-6 * scale, -3 * scale, 4 * scale, 0, Math.PI * 2);
            ctx.arc(6 * scale, -3 * scale, 4 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

        } else {
            // Large beast
            ctx.fillStyle = enemy.color;

            // Body
            ctx.beginPath();
            ctx.ellipse(0, 0, enemy.radius * 1.2, enemy.radius, 0, 0, Math.PI * 2);
            ctx.fill();

            // Horns
            ctx.beginPath();
            ctx.moveTo(-10 * scale, -10 * scale);
            ctx.lineTo(-15 * scale, -20 * scale);
            ctx.lineTo(-8 * scale, -12 * scale);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(10 * scale, -10 * scale);
            ctx.lineTo(15 * scale, -20 * scale);
            ctx.lineTo(8 * scale, -12 * scale);
            ctx.closePath();
            ctx.fill();

            // Glowing eyes
            ctx.fillStyle = '#ffff00';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(-8 * scale, -5 * scale, 5 * scale, 0, Math.PI * 2);
            ctx.arc(8 * scale, -5 * scale, 5 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Fangs
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(-4 * scale, 5 * scale);
            ctx.lineTo(-2 * scale, 12 * scale);
            ctx.lineTo(0, 5 * scale);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(4 * scale, 5 * scale);
            ctx.lineTo(2 * scale, 12 * scale);
            ctx.lineTo(0, 5 * scale);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    static drawHumanoidEnemy(ctx, enemy) {
        // Use monster enemy instead
        this.drawMonsterEnemy(ctx, enemy);
    }

    static drawMonkeyBoss(ctx, boss) {
        ctx.save();
        ctx.translate(boss.x, boss.y);

        const scale = boss.radius / 50;
        const time = Date.now() / 1000;

        // Shadow
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#000';
        ctx.fillRect(-50 * scale, 50 * scale, 100 * scale, 15 * scale);
        ctx.globalAlpha = 1.0;

        // Flash effect
        if (boss.flashTimer > 0) {
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 30;
        }

        // Breathing animation
        const breath = Math.sin(time * 2) * 2 * scale;

        // Body
        ctx.fillStyle = boss.color;
        ctx.fillRect(-28 * scale, -20 * scale + breath, 56 * scale, 55 * scale);

        // Muscles on arms
        ctx.fillStyle = this.darkenColor(boss.color);
        ctx.beginPath();
        ctx.arc(-45 * scale, 5 * scale, 18 * scale, 0, Math.PI * 2);
        ctx.arc(45 * scale, 5 * scale, 18 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Arms (gorilla style)
        ctx.fillRect(-48 * scale, -5 * scale, 20 * scale, 45 * scale);
        ctx.fillRect(28 * scale, -5 * scale, 20 * scale, 45 * scale);

        // Legs
        ctx.fillRect(-24 * scale, 35 * scale, 18 * scale, 20 * scale);
        ctx.fillRect(6 * scale, 35 * scale, 18 * scale, 20 * scale);

        // Head
        ctx.fillRect(-22 * scale, -45 * scale + breath, 44 * scale, 30 * scale);

        // Face
        ctx.fillStyle = '#d35400';
        ctx.fillRect(-18 * scale, -30 * scale + breath, 36 * scale, 18 * scale);

        // Eyes (angry)
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(-10 * scale, -25 * scale + breath, 5 * scale, 0, Math.PI * 2);
        ctx.arc(10 * scale, -25 * scale + breath, 5 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Fangs
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(-8 * scale, -15 * scale + breath);
        ctx.lineTo(-6 * scale, -8 * scale + breath);
        ctx.lineTo(-4 * scale, -15 * scale + breath);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(8 * scale, -15 * scale + breath);
        ctx.lineTo(6 * scale, -8 * scale + breath);
        ctx.lineTo(4 * scale, -15 * scale + breath);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    static drawDragonBoss(ctx, boss) {
        ctx.save();
        ctx.translate(boss.x, boss.y);

        const scale = boss.radius / 50;
        const time = Date.now() / 1000;
        const wingFlap = Math.sin(time * 3) * 15;

        // Shadow
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#000';
        ctx.fillRect(-60 * scale, 45 * scale, 120 * scale, 15 * scale);
        ctx.globalAlpha = 1.0;

        // Flash effect
        if (boss.flashTimer > 0) {
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 30;
        }

        // Wings (animated)
        ctx.fillStyle = this.adjustAlpha(boss.color, 0.8);
        ctx.beginPath();
        // Left wing
        ctx.moveTo(-25 * scale, 0);
        ctx.quadraticCurveTo(-65 * scale, -35 * scale + wingFlap, -50 * scale, 15 * scale);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        // Right wing
        ctx.moveTo(25 * scale, 0);
        ctx.quadraticCurveTo(65 * scale, -35 * scale + wingFlap, 50 * scale, 15 * scale);
        ctx.closePath();
        ctx.fill();

        // Body (scaled)
        ctx.fillStyle = boss.color;
        ctx.beginPath();
        ctx.ellipse(0, 5 * scale, 35 * scale, 45 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Spikes on back
        ctx.fillStyle = this.darkenColor(boss.color);
        for (let i = 0; i < 5; i++) {
            const x = -15 * scale + i * 8 * scale;
            ctx.beginPath();
            ctx.moveTo(x, -15 * scale);
            ctx.lineTo(x, -28 * scale);
            ctx.lineTo(x + 4 * scale, -15 * scale);
            ctx.closePath();
            ctx.fill();
        }

        // Neck
        ctx.fillStyle = boss.color;
        ctx.fillRect(-12 * scale, -35 * scale, 24 * scale, 25 * scale);

        // Head
        ctx.beginPath();
        ctx.ellipse(0, -40 * scale, 22 * scale, 28 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Horns (larger)
        ctx.strokeStyle = this.darkenColor(boss.color);
        ctx.lineWidth = 5 * scale;
        ctx.beginPath();
        ctx.moveTo(-16 * scale, -55 * scale);
        ctx.lineTo(-22 * scale, -75 * scale);
        ctx.moveTo(16 * scale, -55 * scale);
        ctx.lineTo(22 * scale, -75 * scale);
        ctx.stroke();

        // Eyes (glowing menacingly)
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(-10 * scale, -42 * scale, 6 * scale, 0, Math.PI * 2);
        ctx.arc(10 * scale, -42 * scale, 6 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Nostrils
        ctx.fillStyle = '#000';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(-6 * scale, -30 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.arc(6 * scale, -30 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Tail (curled)
        ctx.fillStyle = boss.color;
        ctx.beginPath();
        ctx.moveTo(0, 40 * scale);
        ctx.quadraticCurveTo(30 * scale, 60 * scale, 45 * scale, 75 * scale);
        ctx.lineTo(40 * scale, 70 * scale);
        ctx.quadraticCurveTo(25 * scale, 55 * scale, 0, 45 * scale);
        ctx.closePath();
        ctx.fill();

        // Tail spike
        ctx.fillStyle = this.darkenColor(boss.color);
        ctx.beginPath();
        ctx.moveTo(45 * scale, 75 * scale);
        ctx.lineTo(52 * scale, 70 * scale);
        ctx.lineTo(48 * scale, 78 * scale);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    static darkenColor(color) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * 0.6);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * 0.6);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * 0.6);
        return `rgb(${r}, ${g}, ${b})`;
    }

    static adjustAlpha(color, alpha) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
