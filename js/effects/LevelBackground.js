/**
 * Level Background Renderer - 性能优化版
 * 5个关卡独特背景主题
 */

export class LevelBackground {
    constructor() {
        // 减少粒子数量以提升性能
        this.snowflakes = [];
        this.sparks = [];
        for (let i = 0; i < 25; i++) {
            this.snowflakes.push({ x: Math.random() * 2000, y: Math.random() * 2000, size: Math.random() * 3 + 2, speed: Math.random() * 30 + 20, wobble: Math.random() * Math.PI * 2 });
            this.sparks.push({ x: Math.random() * 2000, y: Math.random() * 2000, vy: -(Math.random() * 40 + 20), life: Math.random(), size: Math.random() * 3 + 1 });
        }
        // 缓存渐变和常量
        this.gradientCache = {};
        this.lastWidth = 0;
        this.lastHeight = 0;
    }

    update(deltaTime) {
        const time = Date.now() / 1000;
        for (let i = 0; i < this.snowflakes.length; i++) {
            const s = this.snowflakes[i];
            s.y += s.speed * deltaTime;
            s.x += Math.sin(s.wobble + time) * 8 * deltaTime;
            if (s.y > 2000) { s.y = -10; s.x = Math.random() * 2000; }
        }
        for (let i = 0; i < this.sparks.length; i++) {
            const s = this.sparks[i];
            s.y += s.vy * deltaTime;
            s.life -= deltaTime * 0.5;
            if (s.life <= 0) { s.y = 2000; s.x = Math.random() * 2000; s.life = 1; }
        }
    }
    
    // 检查并重建渐变缓存
    checkCache(ctx, w, h) {
        if (w !== this.lastWidth || h !== this.lastHeight) {
            this.gradientCache = {};
            this.lastWidth = w;
            this.lastHeight = h;
        }
    }

    draw(ctx, levelData, cameraX, cameraY) {
        const canvas = ctx.canvas, time = Date.now() / 1000;
        switch (levelData.id) {
            case 1: this.drawDungeon(ctx, canvas, time); break;
            case 2: this.drawFrozenMountain(ctx, canvas, time); break;
            case 3: this.drawHellCorridor(ctx, canvas, time); break;
            case 4: this.drawLavaZone(ctx, canvas, time); break;
            case 5: this.drawTemple(ctx, canvas, time); break;
            default: this.drawDungeon(ctx, canvas, time);
        }
    }

    // ==========================================
    // Level 1: 深暗地牢 - 砖墙、火把、蜘蛛网
    // ==========================================
    drawDungeon(ctx, canvas, time) {
        const w = canvas.width, h = canvas.height;
        
        // 深邃的渐变背景 - 紫黑色调
        const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
        grad.addColorStop(0, '#1a1525');
        grad.addColorStop(0.4, '#12101a');
        grad.addColorStop(1, '#08060a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // 砖墙纹理 - 更有层次感
        for (let y = 0; y < h; y += 35) {
            for (let x = (Math.floor(y/35) % 2 === 0 ? 0 : -35); x < w + 70; x += 70) {
                // 砖块阴影
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(x + 1, y + 1, 68, 33);
                // 砖块主体
                const brickGrad = ctx.createLinearGradient(x, y, x, y + 34);
                brickGrad.addColorStop(0, '#3a3548');
                brickGrad.addColorStop(0.5, '#2a2535');
                brickGrad.addColorStop(1, '#1a1520');
                ctx.fillStyle = brickGrad;
                ctx.fillRect(x + 2, y + 2, 66, 31);
                // 砖块高光
                ctx.fillStyle = 'rgba(100, 90, 120, 0.15)';
                ctx.fillRect(x + 3, y + 3, 64, 5);
            }
        }

        // 地牢氛围 - 神秘紫色光芒
        ctx.globalAlpha = 0.08;
        const mystGlow = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w * 0.6);
        mystGlow.addColorStop(0, '#8040a0');
        mystGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = mystGlow;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;

        // 火把光源 - 4角落
        const torches = [[100, 100], [w - 100, 100], [100, h - 100], [w - 100, h - 100]];
        torches.forEach(([tx, ty], i) => {
            const flicker = Math.sin(time * 10 + i * 2) * 6;
            
            // 多层光晕
            const tg1 = ctx.createRadialGradient(tx, ty, 0, tx, ty, 140 + flicker);
            tg1.addColorStop(0, 'rgba(255, 120, 40, 0.25)');
            tg1.addColorStop(0.5, 'rgba(255, 80, 20, 0.08)');
            tg1.addColorStop(1, 'transparent');
            ctx.fillStyle = tg1;
            ctx.beginPath();
            ctx.arc(tx, ty, 140 + flicker, 0, Math.PI * 2);
            ctx.fill();
            
            // 火把架
            ctx.fillStyle = '#4a3828';
            ctx.fillRect(tx - 4, ty + 5, 8, 30);
            
            // 火焰核心
            const flameH = 20 + Math.sin(time * 12 + i) * 5;
            const flame = ctx.createRadialGradient(tx, ty - 5, 0, tx, ty - 5, 15);
            flame.addColorStop(0, '#ffffcc');
            flame.addColorStop(0.3, '#ffaa44');
            flame.addColorStop(0.7, '#ff5500');
            flame.addColorStop(1, 'rgba(200, 50, 0, 0)');
            ctx.fillStyle = flame;
            ctx.beginPath();
            ctx.ellipse(tx, ty - 5, 10 + flicker/3, flameH, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // 火星
            ctx.fillStyle = '#ffcc44';
            for (let s = 0; s < 4; s++) {
                const sparkY = ty - 25 - ((time * 50 + s * 25 + i * 15) % 50);
                const sparkX = tx + Math.sin(time * 6 + s * 3 + i) * 12;
                ctx.globalAlpha = 0.7 - (ty - 25 - sparkY) / 60;
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        });

        // 蜘蛛网 - 4个角落
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        [[0, 0, 1, 1], [w, 0, -1, 1], [0, h, 1, -1], [w, h, -1, -1]].forEach(([wx, wy, dx, dy]) => {
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI / 16) * i * dx * dy;
                ctx.beginPath();
                ctx.moveTo(wx, wy);
                ctx.lineTo(wx + Math.cos(a) * 80 * dx, wy + Math.sin(a) * 80 * dy);
                ctx.stroke();
            }
            for (let r = 20; r < 80; r += 20) {
                ctx.beginPath();
                ctx.arc(wx, wy, r, dx > 0 ? 0 : Math.PI, dy > 0 ? Math.PI/2 : -Math.PI/2, dx * dy < 0);
                ctx.stroke();
            }
        });
        ctx.globalAlpha = 1;

        // 漂浮灰尘粒子
        ctx.fillStyle = 'rgba(180, 170, 200, 0.35)';
        for (let i = 0; i < 20; i++) {
            const px = (i * 97 + time * 12) % w;
            const py = (i * 61 + time * 8) % h;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 地面阴影
        ctx.globalAlpha = 0.3;
        const floorShadow = ctx.createLinearGradient(0, h - 60, 0, h);
        floorShadow.addColorStop(0, 'transparent');
        floorShadow.addColorStop(1, '#000');
        ctx.fillStyle = floorShadow;
        ctx.fillRect(0, h - 60, w, 60);
        ctx.globalAlpha = 1;
    }

    // ==========================================
    // Level 2: 冰封雪山 - 雪花、冰晶、山峰、极光 [性能优化]
    // ==========================================
    drawFrozenMountain(ctx, canvas, time) {
        const w = canvas.width, h = canvas.height;
        this.checkCache(ctx, w, h);
        
        // 缓存天空渐变
        if (!this.gradientCache.frozenSky) {
            const sky = ctx.createLinearGradient(0, 0, 0, h);
            sky.addColorStop(0, '#0a1528');
            sky.addColorStop(0.3, '#152a45');
            sky.addColorStop(0.6, '#1a3a5c');
            sky.addColorStop(1, '#0a1a2c');
            this.gradientCache.frozenSky = sky;
        }
        ctx.fillStyle = this.gradientCache.frozenSky;
        ctx.fillRect(0, 0, w, h);

        // 极光效果 - 减少循环复杂度
        ctx.globalAlpha = 0.12;
        for (let i = 0; i < 2; i++) {
            const auroraY = 70 + i * 50;
            const wave = Math.sin(time * 0.5 + i) * 20;
            ctx.fillStyle = i === 0 ? '#40ff80' : '#4080ff';
            ctx.beginPath();
            ctx.moveTo(0, auroraY + wave);
            for (let x = 0; x <= w; x += 50) {
                ctx.lineTo(x, auroraY + Math.sin(x * 0.02 + time + i) * 25 + wave);
            }
            ctx.lineTo(w, auroraY + 50);
            ctx.lineTo(0, auroraY + 50);
            ctx.fill();
        }

        // 远山 - 增大步长
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#5a8aac';
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 50) {
            ctx.lineTo(x, h - 220 - Math.sin(x * 0.008) * 100 - Math.sin(x * 0.02) * 40);
        }
        ctx.lineTo(w, h);
        ctx.fill();

        // 中景雪山
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#4a7a9c';
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 40) {
            ctx.lineTo(x, h - 160 - Math.sin(x * 0.012 + 0.5) * 80);
        }
        ctx.lineTo(w, h);
        ctx.fill();
        
        // 雪山顶积雪
        ctx.fillStyle = '#e8f4ff';
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 40) {
            ctx.lineTo(x, h - 145 - Math.sin(x * 0.012 + 0.5) * 80);
        }
        for (let x = w; x >= 0; x -= 40) {
            ctx.lineTo(x, h - 125 - Math.sin(x * 0.012 + 0.5) * 80);
        }
        ctx.fill();
        ctx.globalAlpha = 1;

        // 飘落雪花 - 批量绘制
        ctx.fillStyle = '#fff';
        for (let i = 0; i < this.snowflakes.length; i++) {
            const s = this.snowflakes[i];
            const sx = (s.x + time * (15 + i % 3 * 5)) % w;
            const sy = s.y % h;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // 冰晶 - 减少数量，移除shadowBlur
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = 'rgba(180, 220, 255, 0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const cx = (i * 160 + 80) % w;
            const cy = (i * 120 + 100) % h;
            for (let j = 0; j < 6; j++) {
                const a = (Math.PI / 3) * j + time * 0.1;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20);
                ctx.stroke();
            }
        }

        // 冰霜边缘
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, 60);
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#c8e8ff';
        ctx.fillRect(0, h - 40, w, 40);
        ctx.globalAlpha = 1;
    }

    // ==========================================
    // Level 3: 地狱回廊 - 滚烫岩浆、火焰、恶魔符文 [性能优化]
    // ==========================================
    drawHellCorridor(ctx, canvas, time) {
        const w = canvas.width, h = canvas.height;
        this.checkCache(ctx, w, h);
        
        // 缓存背景渐变
        if (!this.gradientCache.hellBg) {
            const grad = ctx.createRadialGradient(w/2, h, 0, w/2, h/2, h);
            grad.addColorStop(0, '#4a1a0a');
            grad.addColorStop(0.4, '#2a0a05');
            grad.addColorStop(1, '#0a0202');
            this.gradientCache.hellBg = grad;
        }
        ctx.fillStyle = this.gradientCache.hellBg;
        ctx.fillRect(0, 0, w, h);

        // 熔岩裂缝 - 简化，移除shadowBlur
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
            const sx = (i * 220 + 100) % w;
            ctx.beginPath();
            ctx.moveTo(sx, 0);
            for (let y = 0; y < h; y += 40) {
                ctx.lineTo(sx + Math.sin(y * 0.04 + time * 2 + i) * 15, y);
            }
            ctx.stroke();
        }

        // 底部岩浆池
        const lavaY = h - 70;
        
        // 岩浆光晕 - 简单矩形
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(0, lavaY - 30, w, h - lavaY + 30);

        // 岩浆表面波动 - 增大步长
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 30) {
            ctx.lineTo(x, lavaY + Math.sin(x * 0.03 + time * 3) * 8);
        }
        ctx.lineTo(w, h);
        ctx.fill();

        // 岩浆高光 - 减少数量
        ctx.fillStyle = '#ff8844';
        ctx.globalAlpha = 0.6;
        for (let x = 0; x < w; x += 80) {
            ctx.beginPath();
            ctx.ellipse(x + 40, lavaY + 15, 20, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 岩浆气泡 - 减少数量
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#ffaa44';
        for (let i = 0; i < 5; i++) {
            const bx = (i * 180 + time * 30) % w;
            const bubblePhase = (time * 2 + i * 0.5) % 1;
            const by = lavaY + 20 - bubblePhase * 35;
            ctx.beginPath();
            ctx.arc(bx, by, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // 恶魔符文 - 减少数量和复杂度
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = '#ff2200';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const rx = (i * 280 + 140) % w;
            const ry = (i * 180 + 120) % (h - 100);
            ctx.save();
            ctx.translate(rx, ry);
            ctx.rotate(time * 0.3 * (i % 2 === 0 ? 1 : -1));
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.stroke();
            // 简化五芒星
            for (let j = 0; j < 5; j++) {
                const a = (Math.PI * 2 / 5) * j - Math.PI/2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(a) * 25, Math.sin(a) * 25);
                ctx.stroke();
            }
            ctx.restore();
        }

        // 上升的火星 - 使用缓存的sparks
        for (let i = 0; i < this.sparks.length; i++) {
            const s = this.sparks[i];
            const sx = s.x % w;
            const sy = (h + s.y - time * 60) % (h + 50) - 50;
            ctx.globalAlpha = s.life * 0.7;
            ctx.fillStyle = '#ff6622';
            ctx.beginPath();
            ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // ==========================================
    // Level 4: 奥林匹斯 - 浮动云层、神殿柱、闪电 [性能优化]
    // ==========================================
    drawLavaZone(ctx, canvas, time) {
        const w = canvas.width, h = canvas.height;
        this.checkCache(ctx, w, h);
        
        // 缓存天空渐变
        if (!this.gradientCache.olympusSky) {
            const sky = ctx.createLinearGradient(0, 0, 0, h);
            sky.addColorStop(0, '#1a2a4a');
            sky.addColorStop(0.3, '#3a5080');
            sky.addColorStop(0.6, '#5a80b0');
            sky.addColorStop(1, '#8ab0d0');
            this.gradientCache.olympusSky = sky;
        }
        ctx.fillStyle = this.gradientCache.olympusSky;
        ctx.fillRect(0, 0, w, h);

        // 远处云层 - 减少数量
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 4; i++) {
            const cx = (i * 220 + time * 8) % (w + 200) - 100;
            const cy = 80 + i * 30;
            ctx.beginPath();
            ctx.ellipse(cx, cy, 80, 25, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + 45, cy - 8, 45, 16, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 神殿柱子 - 简化渐变
        const pillarPositions = [80, 180, w - 180, w - 80];
        ctx.globalAlpha = 1;
        pillarPositions.forEach((px) => {
            // 柱子阴影
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(px - 16, 120, 36, h - 160);
            
            // 柱子主体 - 使用纯色代替渐变
            ctx.fillStyle = '#e0e0e8';
            ctx.fillRect(px - 18, 100, 36, h - 140);
            
            // 柱头
            ctx.fillStyle = '#d8d8e0';
            ctx.fillRect(px - 26, 90, 52, 18);
            ctx.fillRect(px - 22, 80, 44, 14);
            
            // 柱脚
            ctx.fillRect(px - 26, h - 48, 52, 18);
        });

        // 神殿顶部
        ctx.fillStyle = '#d0d0e0';
        ctx.beginPath();
        ctx.moveTo(60, 90);
        ctx.lineTo(w / 2, 30);
        ctx.lineTo(w - 60, 90);
        ctx.closePath();
        ctx.fill();
        
        // 顶部装饰线
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(70, 88);
        ctx.lineTo(w / 2, 35);
        ctx.lineTo(w - 70, 88);
        ctx.stroke();

        // 浮动云 - 减少数量
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 3; i++) {
            const cx = (i * 300 + time * 15) % (w + 250) - 125;
            const cy = h - 75 + Math.sin(time * 0.8 + i) * 12;
            ctx.beginPath();
            ctx.ellipse(cx, cy, 90, 28, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + 50, cy - 12, 50, 18, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 闪电 - 简化，移除shadowBlur
        if (Math.sin(time * 2) > 0.96) {
            ctx.globalAlpha = 0.9;
            ctx.strokeStyle = '#ffffcc';
            ctx.lineWidth = 3;
            const lx = w / 2 + Math.sin(time * 10) * 80;
            ctx.beginPath();
            ctx.moveTo(lx, 30);
            ctx.lineTo(lx - 15, 80);
            ctx.lineTo(lx + 8, 80);
            ctx.lineTo(lx - 25, 150);
            ctx.stroke();
            
            ctx.globalAlpha = 0.08;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
        }

        // 金色粒子 - 减少数量
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 10; i++) {
            const px = (Math.sin(time * 0.3 + i * 1.2) * 0.5 + 0.5) * w;
            const py = (Math.cos(time * 0.25 + i * 1.4) * 0.4 + 0.3) * h;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 地面云雾
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, h - 35, w, 35);
        ctx.globalAlpha = 1;
    }

    // ==========================================
    // Level 5: 宏伟圣殿 - 神圣光柱、金色符文、大理石柱 [性能优化]
    // ==========================================
    drawTemple(ctx, canvas, time) {
        const w = canvas.width, h = canvas.height;
        const cx = w / 2, cy = h / 2;
        this.checkCache(ctx, w, h);
        
        // 缓存背景渐变
        if (!this.gradientCache.templeBg) {
            const grad = ctx.createRadialGradient(cx, cy * 0.6, 0, cx, cy, Math.max(w, h));
            grad.addColorStop(0, '#4a3a60');
            grad.addColorStop(0.3, '#2a1a40');
            grad.addColorStop(0.6, '#1a1030');
            grad.addColorStop(1, '#0a0518');
            this.gradientCache.templeBg = grad;
        }
        ctx.fillStyle = this.gradientCache.templeBg;
        ctx.fillRect(0, 0, w, h);

        // 神圣光柱 - 减少数量，简化渐变
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 5; i++) {
            const lx = (i + 0.5) * (w / 5);
            const width = 25;
            ctx.fillRect(lx - width / 2, 0, width, h * 0.8);
        }

        // 大理石柱 - 简化
        const pillarPositions = [70, 150, w - 150, w - 70];
        ctx.globalAlpha = 0.4;
        pillarPositions.forEach((px) => {
            // 柱子阴影
            ctx.fillStyle = '#1a1030';
            ctx.fillRect(px - 14, 50, 32, h - 90);
            
            // 柱子主体
            ctx.fillStyle = '#d0d0e8';
            ctx.fillRect(px - 16, 40, 32, h - 80);
            
            // 柱头
            ctx.fillStyle = '#e0e0f0';
            ctx.fillRect(px - 24, 32, 48, 14);
            ctx.fillRect(px - 20, 24, 40, 10);
            
            // 柱脚
            ctx.fillRect(px - 24, h - 46, 48, 14);
        });

        // 金色符文魔法阵 - 简化，移除shadowBlur
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        
        // 三层圆环
        const radii = [180, 130, 80];
        radii.forEach((r, ri) => {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
            
            // 简化符文 - 只画放射线
            const numLines = 8 - ri * 2;
            for (let i = 0; i < numLines; i++) {
                const angle = (Math.PI * 2 / numLines) * i + time * (ri % 2 === 0 ? 0.2 : -0.3);
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(angle) * (r - 15), cy + Math.sin(angle) * (r - 15));
                ctx.lineTo(cx + Math.cos(angle) * (r + 15), cy + Math.sin(angle) * (r + 15));
                ctx.stroke();
            }
        });

        // 中心核心 - 简化
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(cx, cy, 60, 0, Math.PI * 2);
        ctx.fill();
        
        // 核心十字
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 30);
        ctx.lineTo(cx, cy + 30);
        ctx.moveTo(cx - 20, cy - 8);
        ctx.lineTo(cx + 20, cy - 8);
        ctx.stroke();

        // 上升粒子 - 减少数量
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 15; i++) {
            const px = (Math.sin(time * 0.4 + i * 0.7) * 0.4 + 0.5) * w;
            const py = (h - (time * 40 + i * 60) % (h + 80));
            ctx.globalAlpha = 0.35;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 地面地砖 - 简化
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h - 35);
        ctx.lineTo(w, h - 35);
        ctx.stroke();
        for (let x = 0; x < w; x += 80) {
            ctx.beginPath();
            ctx.moveTo(x, h - 35);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        // 顶部光芒
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(0, 0, w, 60);
        ctx.globalAlpha = 1;
    }
}
