/**
 * Enhanced 2D Renderer
 * Provides improved visual effects for game entities
 */

export class Renderer2D {
    static drawPlayer(ctx, player) {
        if (window.CharacterRenderer) {
            window.CharacterRenderer.drawHumanoidPlayer(ctx, player);
        } else {
            // Fallback to enhanced circles
            this.drawPlayerCircle(ctx, player);
        }
    }

    static drawPlayerCircle(ctx, player) {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(player.x, player.y + player.radius + 5, player.radius * 1.2, player.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.radius * 1.5);
        gradient.addColorStop(0, player.color);
        gradient.addColorStop(0.7, player.color);
        gradient.addColorStop(1, 'rgba(52, 152, 219, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Body with gradient
        const bodyGradient = ctx.createRadialGradient(
            player.x - player.radius * 0.3,
            player.y - player.radius * 0.3,
            0,
            player.x,
            player.y,
            player.radius
        );

        if (player.state === 'BLOCK') {
            bodyGradient.addColorStop(0, '#f39c12');
            bodyGradient.addColorStop(1, '#d68910');
        } else if (player.invincible) {
            bodyGradient.addColorStop(0, '#3498db');
            bodyGradient.addColorStop(1, '#2980b9');
            ctx.globalAlpha = 0.6;
        } else {
            bodyGradient.addColorStop(0, '#5dade2');
            bodyGradient.addColorStop(1, '#2874a6');
        }

        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.globalAlpha = 1.0;

        // Facing indicator with glow
        ctx.strokeStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(player.x + player.facing.x * 35, player.y + player.facing.y * 35);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    static drawEnemy(ctx, enemy) {
        if (window.CharacterRenderer) {
            window.CharacterRenderer.drawHumanoidEnemy(ctx, enemy);
        } else {
            this.drawEnemyCircle(ctx, enemy);
        }
    }

    static drawEnemyCircle(ctx, enemy) {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(enemy.x, enemy.y + enemy.radius + 3, enemy.radius * 1.1, enemy.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Enemy glow
        const glow = ctx.createRadialGradient(enemy.x, enemy.y, 0, enemy.x, enemy.y, enemy.radius * 1.3);
        glow.addColorStop(0, enemy.color);
        glow.addColorStop(0.8, enemy.color);
        glow.addColorStop(1, 'rgba(231, 76, 60, 0)');

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Body with gradient
        const gradient = ctx.createRadialGradient(
            enemy.x - enemy.radius * 0.3,
            enemy.y - enemy.radius * 0.3,
            0,
            enemy.x,
            enemy.y,
            enemy.radius
        );
        gradient.addColorStop(0, enemy.color);
        gradient.addColorStop(1, this.darkenColor(enemy.color, 0.3));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    static darkenColor(color, amount) {
        // Simple color darkening
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
        return `rgb(${r}, ${g}, ${b})`;
    }
}
