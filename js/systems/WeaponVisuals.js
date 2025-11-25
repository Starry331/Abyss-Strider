/**
 * 武器外观系统 - 根据进化等级和路线渲染不同外观
 */

export class WeaponVisuals {
    
    // 获取武器渲染配置
    static getVisualConfig(weapon) {
        const evoLevel = weapon.evolutionLevel || 0;
        const evoPath = weapon.evolutionPath || null;
        
        // 基础配置
        const config = {
            color: weapon.color || '#ffffff',
            glowColor: weapon.glowColor || weapon.color,
            glowIntensity: 10 + evoLevel * 5,
            particleCount: evoLevel * 2,
            trailLength: 0.2 + evoLevel * 0.05,
            effectType: null
        };
        
        // 根据进化路线设置特效
        if (evoPath) {
            const pathEffects = {
                // 法杖路线
                'elemental': { effectType: 'elemental_swirl', particleColors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'] },
                'summoner': { effectType: 'orb_orbit', particleColors: ['#55efc4', '#00b894', '#ffeaa7'] },
                'destruction': { effectType: 'fire_burst', particleColors: ['#ff4757', '#ff6348', '#ffa502'] },
                'time': { effectType: 'time_distort', particleColors: ['#a29bfe', '#6c5ce7', '#dfe6e9'] },
                // 长剑路线
                'holy': { effectType: 'holy_glow', particleColors: ['#ffd700', '#fff200', '#ffffff'] },
                'shadow': { effectType: 'shadow_mist', particleColors: ['#2d3436', '#636e72', '#6c5ce7'] },
                'titan': { effectType: 'earth_crack', particleColors: ['#d35400', '#e67e22', '#c0392b'] },
                // 双刀路线
                'assassin': { effectType: 'shadow_trail', particleColors: ['#2c3e50', '#6c5ce7', '#9b59b6'] },
                'berserker': { effectType: 'blood_rage', particleColors: ['#c0392b', '#e74c3c', '#d63031'] },
                'venom': { effectType: 'poison_drip', particleColors: ['#27ae60', '#2ecc71', '#1abc9c'] }
            };
            
            const effect = pathEffects[evoPath];
            if (effect) {
                config.effectType = effect.effectType;
                config.particleColors = effect.particleColors;
            }
        }
        
        return config;
    }
    
    // 绘制武器特效
    static drawWeaponEffect(ctx, weapon, x, y, time) {
        const config = this.getVisualConfig(weapon);
        if (!config.effectType) return;
        
        ctx.save();
        
        switch (config.effectType) {
            case 'elemental_swirl':
                this.drawElementalSwirl(ctx, x, y, time, config);
                break;
            case 'orb_orbit':
                this.drawOrbOrbit(ctx, x, y, time, config);
                break;
            case 'fire_burst':
                this.drawFireBurst(ctx, x, y, time, config);
                break;
            case 'holy_glow':
                this.drawHolyGlow(ctx, x, y, time, config);
                break;
            case 'shadow_mist':
                this.drawShadowMist(ctx, x, y, time, config);
                break;
            case 'shadow_trail':
                this.drawShadowTrail(ctx, x, y, time, config);
                break;
            case 'blood_rage':
                this.drawBloodRage(ctx, x, y, time, config);
                break;
            case 'poison_drip':
                this.drawPoisonDrip(ctx, x, y, time, config);
                break;
        }
        
        ctx.restore();
    }
    
    // 元素漩涡
    static drawElementalSwirl(ctx, x, y, time, config) {
        const colors = config.particleColors;
        for (let i = 0; i < 4; i++) {
            const angle = time * 2 + (Math.PI / 2) * i;
            const dist = 25 + Math.sin(time * 3 + i) * 5;
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist;
            
            ctx.fillStyle = colors[i % colors.length];
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 召唤球环绕
    static drawOrbOrbit(ctx, x, y, time, config) {
        const colors = config.particleColors;
        for (let i = 0; i < 3; i++) {
            const angle = time * 1.5 + (Math.PI * 2 / 3) * i;
            const dist = 35;
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist;
            
            // 外发光
            const grad = ctx.createRadialGradient(px, py, 0, px, py, 10);
            grad.addColorStop(0, colors[i % colors.length]);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // 核心
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 火焰爆发
    static drawFireBurst(ctx, x, y, time, config) {
        const colors = config.particleColors;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i + time * 0.5;
            const dist = 20 + Math.sin(time * 5 + i) * 8;
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist - Math.abs(Math.sin(time * 4 + i)) * 10;
            
            ctx.fillStyle = colors[i % colors.length];
            ctx.globalAlpha = 0.5 + Math.sin(time * 6 + i) * 0.3;
            ctx.beginPath();
            ctx.arc(px, py, 3 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 神圣光芒
    static drawHolyGlow(ctx, x, y, time, config) {
        const pulse = Math.sin(time * 3) * 0.3 + 0.7;
        
        // 光环
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.globalAlpha = pulse * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, 30 + Math.sin(time * 2) * 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // 十字光芒
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = pulse * 0.4;
        const len = 15;
        ctx.beginPath();
        ctx.moveTo(x, y - len); ctx.lineTo(x, y + len);
        ctx.moveTo(x - len, y); ctx.lineTo(x + len, y);
        ctx.stroke();
    }
    
    // 暗影迷雾
    static drawShadowMist(ctx, x, y, time, config) {
        const colors = config.particleColors;
        for (let i = 0; i < 6; i++) {
            const angle = time * 0.8 + (Math.PI / 3) * i;
            const dist = 25 + Math.sin(time * 2 + i * 0.5) * 10;
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist;
            
            const grad = ctx.createRadialGradient(px, py, 0, px, py, 12);
            grad.addColorStop(0, colors[i % colors.length]);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(px, py, 12, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 暗影拖尾
    static drawShadowTrail(ctx, x, y, time, config) {
        for (let i = 0; i < 5; i++) {
            const offset = i * 8;
            ctx.fillStyle = config.particleColors[0];
            ctx.globalAlpha = 0.3 - i * 0.05;
            ctx.beginPath();
            ctx.arc(x - offset * 0.5, y, 15 - i * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 血怒
    static drawBloodRage(ctx, x, y, time, config) {
        const pulse = Math.sin(time * 5) * 0.3 + 0.7;
        
        // 红色脉冲
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 3;
        ctx.globalAlpha = pulse * 0.6;
        ctx.beginPath();
        ctx.arc(x, y, 25 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        
        // 血滴
        for (let i = 0; i < 4; i++) {
            const dropY = y + 20 + ((time * 50 + i * 20) % 40);
            const dropX = x + Math.sin(i * 2) * 15;
            ctx.fillStyle = '#e74c3c';
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(dropX, dropY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 毒液滴落
    static drawPoisonDrip(ctx, x, y, time, config) {
        const colors = config.particleColors;
        
        // 毒雾
        for (let i = 0; i < 5; i++) {
            const angle = time * 0.5 + (Math.PI * 2 / 5) * i;
            const dist = 20 + Math.sin(time + i) * 5;
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist;
            
            ctx.fillStyle = colors[i % colors.length];
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(px, py, 5 + Math.sin(time * 2 + i) * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 滴落
        for (let i = 0; i < 3; i++) {
            const dropY = y + 15 + ((time * 40 + i * 25) % 35);
            ctx.fillStyle = '#2ecc71';
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(x + (i - 1) * 10, dropY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 获取进化武器名称显示
    static getEvolutionDisplayName(weapon) {
        if (weapon.evolutionName) return weapon.evolutionName;
        return weapon.cnName || weapon.name;
    }
}
