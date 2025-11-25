/**
 * Level Background Renderer - 增强版
 * 5个关卡独特背景主题
 */

export class LevelBackground {
    constructor() {
        this.snowflakes = [];
        this.sparks = [];
        for (let i = 0; i < 40; i++) {
            this.snowflakes.push({ x: Math.random() * 2000, y: Math.random() * 2000, size: Math.random() * 3 + 2, speed: Math.random() * 30 + 20, wobble: Math.random() * Math.PI * 2 });
            this.sparks.push({ x: Math.random() * 2000, y: Math.random() * 2000, vy: -(Math.random() * 40 + 20), life: Math.random(), size: Math.random() * 3 + 1 });
        }
    }

    update(deltaTime) {
        this.snowflakes.forEach(s => { s.y += s.speed * deltaTime; s.x += Math.sin(s.wobble + Date.now()/1000) * 8 * deltaTime; if (s.y > 2000) { s.y = -10; s.x = Math.random() * 2000; } });
        this.sparks.forEach(s => { s.y += s.vy * deltaTime; s.life -= deltaTime * 0.5; if (s.life <= 0) { s.y = 2000; s.x = Math.random() * 2000; s.life = 1; } });
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
    // Level 2: 冰封雪山 - 雪花、冰晶、山峰、极光
    // ==========================================
    drawFrozenMountain(ctx, canvas, time) {
        const w = canvas.width, h = canvas.height;
        
        // 极光渐变天空
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#0a1528');
        sky.addColorStop(0.3, '#152a45');
        sky.addColorStop(0.6, '#1a3a5c');
        sky.addColorStop(1, '#0a1a2c');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // 极光效果
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 3; i++) {
            const auroraY = 60 + i * 40;
            const wave = Math.sin(time * 0.5 + i) * 20;
            const auroraGrad = ctx.createLinearGradient(0, auroraY - 30, 0, auroraY + 50);
            auroraGrad.addColorStop(0, 'transparent');
            auroraGrad.addColorStop(0.3, i % 2 === 0 ? '#40ff80' : '#4080ff');
            auroraGrad.addColorStop(0.7, i % 2 === 0 ? '#8040ff' : '#40ffff');
            auroraGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = auroraGrad;
            ctx.beginPath();
            ctx.moveTo(0, auroraY + wave);
            for (let x = 0; x <= w; x += 30) {
                ctx.lineTo(x, auroraY + Math.sin(x * 0.02 + time + i) * 25 + wave);
            }
            ctx.lineTo(w, auroraY + 60);
            ctx.lineTo(0, auroraY + 60);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // 远山 - 雾蒙蒙的轮廓
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#5a8aac';
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 30) {
            ctx.lineTo(x, h - 220 - Math.sin(x * 0.008) * 100 - Math.sin(x * 0.02) * 40);
        }
        ctx.lineTo(w, h);
        ctx.fill();

        // 中景雪山 - 带积雪
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#4a7a9c';
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 25) {
            ctx.lineTo(x, h - 160 - Math.sin(x * 0.012 + 0.5) * 80);
        }
        ctx.lineTo(w, h);
        ctx.fill();
        
        // 雪山顶积雪
        ctx.fillStyle = '#e8f4ff';
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 25) {
            const baseY = h - 160 - Math.sin(x * 0.012 + 0.5) * 80;
            ctx.lineTo(x, baseY + 15);
        }
        for (let x = w; x >= 0; x -= 25) {
            const baseY = h - 160 - Math.sin(x * 0.012 + 0.5) * 80;
            ctx.lineTo(x, baseY + 35);
        }
        ctx.fill();
        ctx.globalAlpha = 1;

        // 飘落雪花 - 多层次
        this.snowflakes.forEach((s, i) => {
            const sx = (s.x + time * (15 + i % 3 * 5)) % w;
            const sy = s.y % h;
            const alpha = 0.4 + Math.sin(time * 2 + s.wobble) * 0.3;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
            ctx.fill();
            // 雪花闪烁
            if (i % 5 === 0) {
                ctx.fillStyle = `rgba(200, 230, 255, ${alpha * 0.5})`;
                ctx.beginPath();
                ctx.arc(sx, sy, s.size * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1;

        // 冰晶 - 更精致
        for (let i = 0; i < 10; i++) {
            const cx = (i * 110 + 60) % w;
            const cy = (i * 85 + 120) % h;
            const pulse = Math.sin(time * 2 + i) * 0.3 + 0.7;
            
            ctx.strokeStyle = `rgba(180, 220, 255, ${0.2 * pulse})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = '#80c0ff';
            ctx.shadowBlur = 8;
            for (let j = 0; j < 6; j++) {
                const a = (Math.PI / 3) * j + time * 0.1;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22);
                ctx.stroke();
                // 分支
                const bx = cx + Math.cos(a) * 14;
                const by = cy + Math.sin(a) * 14;
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + Math.cos(a + 0.5) * 8, by + Math.sin(a + 0.5) * 8);
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + Math.cos(a - 0.5) * 8, by + Math.sin(a - 0.5) * 8);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        }

        // 冰霜边缘 - 上下
        ctx.globalAlpha = 0.2;
        const frostTop = ctx.createLinearGradient(0, 0, 0, 100);
        frostTop.addColorStop(0, '#ffffff');
        frostTop.addColorStop(1, 'transparent');
        ctx.fillStyle = frostTop;
        ctx.fillRect(0, 0, w, 100);
        
        const frostBottom = ctx.createLinearGradient(0, h - 60, 0, h);
        frostBottom.addColorStop(0, 'transparent');
        frostBottom.addColorStop(1, 'rgba(200, 230, 255, 0.3)');
        ctx.fillStyle = frostBottom;
        ctx.fillRect(0, h - 60, w, 60);
        ctx.globalAlpha = 1;

        // 呼吸般的寒气
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 5; i++) {
            const bx = (time * 20 + i * 200) % (w + 100) - 50;
            const by = h - 100 + Math.sin(time + i) * 30;
            ctx.beginPath();
            ctx.ellipse(bx, by, 60 + Math.sin(time * 2 + i) * 20, 25, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // ==========================================
    // Level 3: 地狱回廊 - 滚烫岩浆、火焰、恶魔符文
    // ==========================================
    drawHellCorridor(ctx, canvas, time) {
        const w = canvas.width, h = canvas.height;
        
        // 炼狱渐变背景
        const grad = ctx.createRadialGradient(w/2, h, 0, w/2, h/2, h);
        grad.addColorStop(0, '#4a1a0a');
        grad.addColorStop(0.4, '#2a0a05');
        grad.addColorStop(1, '#0a0202');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // 熔岩裂缝 - 发光效果
        for (let i = 0; i < 5; i++) {
            const sx = (i * 180 + 80) % w;
            const pulse = Math.sin(time * 3 + i) * 0.3 + 0.7;
            
            // 裂缝光晕
            ctx.globalAlpha = 0.3 * pulse;
            const crackGlow = ctx.createLinearGradient(sx - 30, 0, sx + 30, 0);
            crackGlow.addColorStop(0, 'transparent');
            crackGlow.addColorStop(0.5, '#ff4400');
            crackGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = crackGlow;
            ctx.fillRect(sx - 30, 0, 60, h);
            
            // 裂缝本体
            ctx.globalAlpha = 0.9;
            ctx.strokeStyle = `rgb(255, ${100 + Math.sin(time * 4 + i) * 50}, 0)`;
            ctx.lineWidth = 4;
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(sx + Math.sin(i) * 10, 0);
            for (let y = 0; y < h; y += 20) {
                ctx.lineTo(sx + Math.sin(y * 0.04 + time * 2 + i) * 20, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;

        // 底部岩浆池 - 滚烫波动
        const lavaY = h - 80;
        
        // 岩浆光晕
        const lavaGlow = ctx.createLinearGradient(0, lavaY - 50, 0, h);
        lavaGlow.addColorStop(0, 'transparent');
        lavaGlow.addColorStop(0.3, 'rgba(255, 100, 0, 0.2)');
        lavaGlow.addColorStop(1, 'rgba(255, 50, 0, 0.5)');
        ctx.fillStyle = lavaGlow;
        ctx.fillRect(0, lavaY - 50, w, h - lavaY + 50);

        // 岩浆表面波动
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 15) {
            const waveY = lavaY + Math.sin(x * 0.03 + time * 3) * 8 + Math.sin(x * 0.05 + time * 2) * 5;
            ctx.lineTo(x, waveY);
        }
        ctx.lineTo(w, h);
        ctx.fill();

        // 岩浆高光
        ctx.fillStyle = '#ff8844';
        for (let x = 0; x < w; x += 40) {
            const hlY = lavaY + Math.sin(x * 0.04 + time * 3) * 6;
            ctx.globalAlpha = 0.5 + Math.sin(time * 4 + x * 0.1) * 0.3;
            ctx.beginPath();
            ctx.ellipse(x + 20, hlY + 15, 15, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // 岩浆气泡
        for (let i = 0; i < 8; i++) {
            const bx = (i * 120 + time * 30) % w;
            const bubblePhase = (time * 2 + i * 0.5) % 1;
            const by = lavaY + 20 - bubblePhase * 40;
            const bSize = 4 + Math.sin(bubblePhase * Math.PI) * 4;
            
            ctx.globalAlpha = 1 - bubblePhase;
            ctx.fillStyle = '#ffaa44';
            ctx.beginPath();
            ctx.arc(bx, by, bSize, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // 恶魔符文圆环
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#ff2200';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const rx = (i * 220 + 120) % w;
            const ry = (i * 150 + 100) % (h - 100);
            const rotSpeed = (i % 2 === 0 ? 1 : -1) * 0.3;
            
            ctx.save();
            ctx.translate(rx, ry);
            ctx.rotate(time * rotSpeed + i);
            
            // 外圈
            ctx.beginPath();
            ctx.arc(0, 0, 35, 0, Math.PI * 2);
            ctx.stroke();
            
            // 五芒星
            ctx.beginPath();
            for (let j = 0; j < 5; j++) {
                const a = (Math.PI * 2 / 5) * j - Math.PI/2;
                const na = (Math.PI * 2 / 5) * ((j+2)%5) - Math.PI/2;
                ctx.moveTo(Math.cos(a)*28, Math.sin(a)*28);
                ctx.lineTo(Math.cos(na)*28, Math.sin(na)*28);
            }
            ctx.stroke();
            ctx.restore();
        }
        ctx.globalAlpha = 1;

        // 上升的火星和灰烬
        this.sparks.forEach((s, i) => {
            const sx = s.x % w;
            const sy = (h + s.y - time * 60) % (h + 50) - 50;
            ctx.globalAlpha = s.life * 0.8;
            ctx.fillStyle = i % 3 === 0 ? '#ffcc44' : '#ff6622';
            ctx.beginPath();
            ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // 热浪扭曲效果
        ctx.globalAlpha = 0.03;
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 3;
        for (let y = lavaY - 100; y > 50; y -= 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            for (let x = 0; x <= w; x += 20) {
                ctx.lineTo(x, y + Math.sin(x * 0.02 + time * 3 + y * 0.01) * 8);
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    // ==========================================
    // Level 4: 奥林匹斯 - 浮动云层、神殿柱、闪电
    // ==========================================
    drawLavaZone(ctx, canvas, time) {
        const w = canvas.width, h = canvas.height;
        
        // 神圣天空渐变
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#1a2a4a');
        sky.addColorStop(0.3, '#3a5080');
        sky.addColorStop(0.6, '#5a80b0');
        sky.addColorStop(1, '#8ab0d0');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // 远处云层
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 6; i++) {
            const cx = (i * 180 + time * 8) % (w + 200) - 100;
            const cy = 80 + i * 25 + Math.sin(time * 0.5 + i) * 10;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(cx, cy, 80 + i * 10, 25 + i * 3, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + 50, cy - 10, 50, 18, 0, 0, Math.PI * 2);
            ctx.ellipse(cx - 40, cy + 5, 45, 15, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // 神殿柱子 - 宏伟
        const pillarPositions = [80, 180, w - 180, w - 80];
        pillarPositions.forEach((px, i) => {
            // 柱子阴影
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(px - 18, 120, 40, h - 160);
            
            // 柱子主体
            const pillarGrad = ctx.createLinearGradient(px - 20, 0, px + 20, 0);
            pillarGrad.addColorStop(0, '#c8c8d0');
            pillarGrad.addColorStop(0.3, '#f0f0f8');
            pillarGrad.addColorStop(0.7, '#e8e8f0');
            pillarGrad.addColorStop(1, '#a8a8b0');
            ctx.fillStyle = pillarGrad;
            ctx.fillRect(px - 20, 100, 40, h - 140);
            
            // 柱头装饰
            ctx.fillStyle = '#d8d8e0';
            ctx.fillRect(px - 28, 90, 56, 20);
            ctx.fillRect(px - 24, 80, 48, 15);
            
            // 柱脚
            ctx.fillRect(px - 28, h - 50, 56, 20);
            
            // 柱子纹理
            ctx.strokeStyle = 'rgba(150,150,160,0.3)';
            ctx.lineWidth = 1;
            for (let y = 120; y < h - 60; y += 40) {
                ctx.beginPath();
                ctx.moveTo(px - 18, y);
                ctx.lineTo(px + 18, y);
                ctx.stroke();
            }
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

        // 浮动的近景云
        for (let i = 0; i < 4; i++) {
            const cx = (i * 250 + time * 15) % (w + 300) - 150;
            const cy = h - 80 + Math.sin(time * 0.8 + i) * 15;
            
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(cx, cy, 100, 30, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + 60, cy - 15, 60, 22, 0, 0, Math.PI * 2);
            ctx.ellipse(cx - 50, cy + 8, 55, 20, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + 30, cy + 12, 45, 18, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // 闪电效果
        if (Math.sin(time * 2) > 0.95) {
            ctx.strokeStyle = '#ffffaa';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 20;
            const lx = w / 2 + Math.sin(time * 10) * 100;
            ctx.beginPath();
            ctx.moveTo(lx, 30);
            ctx.lineTo(lx - 20, 80);
            ctx.lineTo(lx + 10, 80);
            ctx.lineTo(lx - 30, 150);
            ctx.lineTo(lx + 5, 150);
            ctx.lineTo(lx - 40, 220);
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            // 闪电闪光
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }

        // 金色光粒子
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 15; i++) {
            const px = (Math.sin(time * 0.3 + i * 0.8) * 0.5 + 0.5) * w;
            const py = (Math.cos(time * 0.25 + i * 1.1) * 0.4 + 0.3) * h;
            const size = 2 + Math.sin(time * 2 + i) * 1;
            ctx.globalAlpha = 0.4 + Math.sin(time * 3 + i) * 0.3;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // 地面云雾
        const groundFog = ctx.createLinearGradient(0, h - 40, 0, h);
        groundFog.addColorStop(0, 'transparent');
        groundFog.addColorStop(1, 'rgba(255, 255, 255, 0.4)');
        ctx.fillStyle = groundFog;
        ctx.fillRect(0, h - 40, w, 40);
    }

    // ==========================================
    // Level 5: 宏伟圣殿 - 神圣光柱、金色符文、大理石柱
    // ==========================================
    drawTemple(ctx, canvas, time) {
        const w = canvas.width, h = canvas.height;
        const cx = w / 2, cy = h / 2;
        
        // 神圣紫金渐变背景
        const grad = ctx.createRadialGradient(cx, cy * 0.6, 0, cx, cy, Math.max(w, h));
        grad.addColorStop(0, '#4a3a60');
        grad.addColorStop(0.3, '#2a1a40');
        grad.addColorStop(0.6, '#1a1030');
        grad.addColorStop(1, '#0a0518');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // 神圣光柱 - 从天而降
        for (let i = 0; i < 7; i++) {
            const lx = (i + 0.5) * (w / 7);
            const pulse = Math.sin(time * 1.5 + i * 0.7) * 0.3 + 0.7;
            const width = 30 + Math.sin(time * 2 + i) * 5;

            // 光柱外晕
            ctx.globalAlpha = 0.1 * pulse;
            const outerGlow = ctx.createLinearGradient(lx, 0, lx, h);
            outerGlow.addColorStop(0, '#ffd700');
            outerGlow.addColorStop(0.5, '#ffa500');
            outerGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = outerGlow;
            ctx.fillRect(lx - width * 1.5, 0, width * 3, h);
            
            // 光柱核心
            ctx.globalAlpha = 0.25 * pulse;
            const innerGlow = ctx.createLinearGradient(lx, 0, lx, h);
            innerGlow.addColorStop(0, '#ffffff');
            innerGlow.addColorStop(0.3, '#ffd700');
            innerGlow.addColorStop(0.7, '#ffaa00');
            innerGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = innerGlow;
            ctx.fillRect(lx - width / 2, 0, width, h);
        }
        ctx.globalAlpha = 1;

        // 宏伟大理石柱
        const pillarPositions = [60, 140, w - 140, w - 60];
        pillarPositions.forEach((px, i) => {
            // 柱子阴影
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#1a1030';
            ctx.fillRect(px - 16, 50, 36, h - 90);
            
            // 柱子主体 - 大理石纹理
            ctx.globalAlpha = 0.5;
            const pillarGrad = ctx.createLinearGradient(px - 18, 0, px + 18, 0);
            pillarGrad.addColorStop(0, '#a8a8c0');
            pillarGrad.addColorStop(0.2, '#d8d8e8');
            pillarGrad.addColorStop(0.5, '#f0f0ff');
            pillarGrad.addColorStop(0.8, '#d0d0e0');
            pillarGrad.addColorStop(1, '#9898b0');
            ctx.fillStyle = pillarGrad;
            ctx.fillRect(px - 18, 40, 36, h - 80);
            
            // 柱头 - 科林斯风格
            ctx.fillStyle = '#e0e0f0';
            ctx.fillRect(px - 26, 32, 52, 16);
            ctx.fillRect(px - 22, 24, 44, 12);
            ctx.fillRect(px - 18, 18, 36, 8);
            
            // 柱脚
            ctx.fillRect(px - 26, h - 48, 52, 16);
            ctx.fillRect(px - 22, h - 36, 44, 8);
            
            // 柱子雕刻纹理
            ctx.strokeStyle = 'rgba(180, 180, 200, 0.4)';
            ctx.lineWidth = 1;
            for (let y = 60; y < h - 60; y += 30) {
                ctx.beginPath();
                ctx.moveTo(px - 16, y);
                ctx.lineTo(px + 16, y);
                ctx.stroke();
            }
            // 垂直纹理
            for (let x = -12; x <= 12; x += 8) {
                ctx.beginPath();
                ctx.moveTo(px + x, 50);
                ctx.lineTo(px + x, h - 50);
                ctx.stroke();
            }
        });
        ctx.globalAlpha = 1;

        // 金色符文魔法阵 - 三层旋转
        const rings = [
            { radius: 200, speed: 0.2, symbols: 16 },
            { radius: 140, speed: -0.3, symbols: 12 },
            { radius: 80, speed: 0.5, symbols: 8 }
        ];
        
        rings.forEach((ring, ri) => {
            ctx.globalAlpha = 0.15 + ri * 0.05;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10;
            
            // 圆环
            ctx.beginPath();
            ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // 符文
            for (let i = 0; i < ring.symbols; i++) {
                const angle = (Math.PI * 2 / ring.symbols) * i + time * ring.speed;
                const rx = cx + Math.cos(angle) * ring.radius;
                const ry = cy + Math.sin(angle) * ring.radius;
                
                ctx.save();
                ctx.translate(rx, ry);
                ctx.rotate(angle + Math.PI / 2);
                
                // 不同形状的符文
                if (ri === 0) {
                    // 菱形
                    ctx.beginPath();
                    ctx.moveTo(0, -10);
                    ctx.lineTo(7, 0);
                    ctx.lineTo(0, 10);
                    ctx.lineTo(-7, 0);
                    ctx.closePath();
                    ctx.stroke();
                } else if (ri === 1) {
                    // 三角
                    ctx.beginPath();
                    ctx.moveTo(0, -8);
                    ctx.lineTo(7, 6);
                    ctx.lineTo(-7, 6);
                    ctx.closePath();
                    ctx.stroke();
                } else {
                    // 星形
                    ctx.beginPath();
                    for (let j = 0; j < 6; j++) {
                        const sa = (Math.PI / 3) * j;
                        ctx.moveTo(0, 0);
                        ctx.lineTo(Math.cos(sa) * 8, Math.sin(sa) * 8);
                    }
                    ctx.stroke();
                }
                ctx.restore();
            }
            ctx.shadowBlur = 0;
        });

        // 中心神圣核心
        ctx.globalAlpha = 0.3;
        const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
        coreGlow.addColorStop(0, '#ffffff');
        coreGlow.addColorStop(0.3, '#ffd700');
        coreGlow.addColorStop(0.6, '#ff8800');
        coreGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, 100, 0, Math.PI * 2);
        ctx.fill();
        
        // 核心十字
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 35);
        ctx.lineTo(cx, cy + 35);
        ctx.moveTo(cx - 25, cy - 10);
        ctx.lineTo(cx + 25, cy - 10);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // 上升的神圣光粒子
        for (let i = 0; i < 25; i++) {
            const px = (Math.sin(time * 0.4 + i * 0.5) * 0.4 + 0.5) * w;
            const py = (h - (time * 40 + i * 50) % (h + 100));
            const size = 2 + Math.sin(time * 3 + i) * 1.5;
            const alpha = 0.3 + Math.sin(time * 2 + i) * 0.2;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = i % 3 === 0 ? '#ffffff' : '#ffd700';
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
            
            // 粒子拖尾
            ctx.globalAlpha = alpha * 0.3;
            ctx.beginPath();
            ctx.arc(px, py + 10, size * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // 地面神圣地砖
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, h - 40);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(0, h - 40);
        ctx.lineTo(w, h - 40);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // 顶部神圣光芒
        ctx.globalAlpha = 0.1;
        const topGlow = ctx.createLinearGradient(0, 0, 0, 80);
        topGlow.addColorStop(0, '#ffd700');
        topGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = topGlow;
        ctx.fillRect(0, 0, w, 80);
        ctx.globalAlpha = 1;
    }
}
