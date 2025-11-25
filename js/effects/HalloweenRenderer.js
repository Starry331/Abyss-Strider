/**
 * Halloween Enemy Renderer
 * Visual rendering for Halloween-themed enemies
 */

export class HalloweenRenderer {
    static drawEnemy(ctx, enemy) {
        const time = enemy.animationTimer || 0;

        switch (enemy.type) {
            case 'GHOST':
                this.drawGhost(ctx, enemy, time);
                break;
            case 'PUMPKIN':
                this.drawPumpkin(ctx, enemy, time);
                break;
            case 'SKELETON':
                this.drawSkeleton(ctx, enemy, time);
                break;
            case 'WITCH':
                this.drawWitch(ctx, enemy, time);
                break;
            case 'ZOMBIE':
                this.drawZombie(ctx, enemy, time);
                break;
            case 'BAT_SWARM':
                this.drawBatSwarm(ctx, enemy, time);
                break;
            case 'PUMPKIN_KING':
                this.drawPumpkinKing(ctx, enemy, time);
                break;
            default:
                // Fallback
                ctx.fillStyle = enemy.color;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
                ctx.fill();
        }
    }

    static drawGhost(ctx, enemy, time) {
        const float = Math.sin(time * 3) * 5;
        const scale = enemy.radius / 18;

        ctx.save();
        ctx.translate(enemy.x, enemy.y + float);

        // Ghostly glow
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 20;
        ctx.globalAlpha = 0.85;

        // Body
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(0, -5 * scale, 15 * scale, Math.PI, 0);
        ctx.lineTo(12 * scale, 10 * scale);
        ctx.quadraticCurveTo(8 * scale, 15 * scale, 4 * scale, 10 * scale);
        ctx.quadraticCurveTo(0, 15 * scale, -4 * scale, 10 * scale);
        ctx.quadraticCurveTo(-8 * scale, 15 * scale, -12 * scale, 10 * scale);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(-5 * scale, -5 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.arc(5 * scale, -5 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    static drawPumpkin(ctx, enemy, time) {
        const scale = enemy.radius / 20;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        // Pumpkin body
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 18 * scale, 20 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stem
        ctx.fillStyle = '#228b22';
        ctx.fillRect(-3 * scale, -22 * scale, 6 * scale, 8 * scale);

        // Jack-o-lantern face
        ctx.fillStyle = '#ff0';
        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 10;

        // Eyes
        ctx.beginPath();
        ctx.moveTo(-8 * scale, -5 * scale);
        ctx.lineTo(-4 * scale, -8 * scale);
        ctx.lineTo(-4 * scale, -2 * scale);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(8 * scale, -5 * scale);
        ctx.lineTo(4 * scale, -8 * scale);
        ctx.lineTo(4 * scale, -2 * scale);
        ctx.closePath();
        ctx.fill();

        // Mouth
        ctx.beginPath();
        ctx.arc(0, 5 * scale, 8 * scale, 0.2, Math.PI - 0.2);
        ctx.stroke();

        ctx.restore();
    }

    static drawSkeleton(ctx, enemy, time) {
        const scale = enemy.radius / 17;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        // Bones
        ctx.fillStyle = enemy.color;
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 3 * scale;

        // Spine
        ctx.beginPath();
        ctx.moveTo(0, -10 * scale);
        ctx.lineTo(0, 10 * scale);
        ctx.stroke();

        // Ribs
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * 4 * scale);
            ctx.lineTo(8 * scale, i * 4 * scale);
            ctx.stroke();
        }

        // Skull
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(0, -15 * scale, 8 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Eye sockets
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-3 * scale, -16 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.arc(3 * scale, -16 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    static drawWitch(ctx, enemy, time) {
        const scale = enemy.radius / 19;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        // Robe
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.moveTo(-10 * scale, -5 * scale);
        ctx.lineTo(-15 * scale, 15 * scale);
        ctx.lineTo(15 * scale, 15 * scale);
        ctx.lineTo(10 * scale, -5 * scale);
        ctx.closePath();
        ctx.fill();

        // Head
        ctx.fillStyle = '#90ee90';
        ctx.beginPath();
        ctx.arc(0, -12 * scale, 7 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Witch hat
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(-10 * scale, -15 * scale);
        ctx.lineTo(0, -28 * scale);
        ctx.lineTo(10 * scale, -15 * scale);
        ctx.closePath();
        ctx.fill();

        // Hat brim
        ctx.fillRect(-12 * scale, -15 * scale, 24 * scale, 3 * scale);

        // Eyes (glowing)
        ctx.fillStyle = '#ff0';
        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(-3 * scale, -12 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.arc(3 * scale, -12 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    static drawZombie(ctx, enemy, time) {
        const scale = enemy.radius / 22;
        const wobble = Math.sin(time * 2) * 2;

        ctx.save();
        ctx.translate(enemy.x + wobble, enemy.y);

        // Body
        ctx.fillStyle = enemy.color;
        ctx.fillRect(-10 * scale, -10 * scale, 20 * scale, 25 * scale);

        // Arms (reaching)
        ctx.fillRect(-18 * scale, -5 * scale, 8 * scale, 15 * scale);
        ctx.fillRect(10 * scale, -5 * scale, 8 * scale, 15 * scale);

        // Legs
        ctx.fillRect(-8 * scale, 15 * scale, 7 * scale, 10 * scale);
        ctx.fillRect(1 * scale, 15 * scale, 7 * scale, 10 * scale);

        // Head
        ctx.fillStyle = '#9acd32';
        ctx.fillRect(-8 * scale, -20 * scale, 16 * scale, 12 * scale);

        // Eyes (dead)
        ctx.fillStyle = '#fff';
        ctx.fillRect(-6 * scale, -17 * scale, 4 * scale, 4 * scale);
        ctx.fillRect(2 * scale, -17 * scale, 4 * scale, 4 * scale);

        ctx.restore();
    }

    static drawBatSwarm(ctx, enemy, time) {
        const scale = enemy.radius / 12;
        const flap = Math.sin(time * 15) * 0.3 + 1;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        // Multiple small bats
        for (let i = 0; i < 3; i++) {
            const offset = (i - 1) * 8 * scale;

            // Bat body
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.arc(offset, 0, 4 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Wings
            ctx.beginPath();
            ctx.moveTo(offset, 0);
            ctx.quadraticCurveTo(offset - 8 * scale * flap, -6 * scale, offset - 6 * scale, 2 * scale);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(offset, 0);
            ctx.quadraticCurveTo(offset + 8 * scale * flap, -6 * scale, offset + 6 * scale, 2 * scale);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    static drawPumpkinKing(ctx, enemy, time) {
        const scale = enemy.radius / 28;
        const pulse = Math.sin(time * 2) * 0.1 + 1;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.scale(pulse, pulse);

        // Large pumpkin body
        ctx.fillStyle = enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.ellipse(0, 0, 25 * scale, 28 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crown
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * 20 * scale, Math.sin(angle) * 20 * scale);
            ctx.lineTo(Math.cos(angle) * 30 * scale, Math.sin(angle) * 30 * scale);
            ctx.lineTo(Math.cos(angle + 0.4) * 20 * scale, Math.sin(angle + 0.4) * 20 * scale);
            ctx.closePath();
            ctx.fill();
        }

        // Menacing face
        ctx.fillStyle = '#ff0';
        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 15;

        // Eyes
        ctx.beginPath();
        ctx.moveTo(-12 * scale, -8 * scale);
        ctx.lineTo(-6 * scale, -12 * scale);
        ctx.lineTo(-6 * scale, -4 * scale);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(12 * scale, -8 * scale);
        ctx.lineTo(6 * scale, -12 * scale);
        ctx.lineTo(6 * scale, -4 * scale);
        ctx.closePath();
        ctx.fill();

        // Evil grin
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 8 * scale, 12 * scale, 0.3, Math.PI - 0.3);
        ctx.stroke();

        ctx.restore();
    }
}
