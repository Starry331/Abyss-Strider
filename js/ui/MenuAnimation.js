/**
 * 主菜单动画系统 - 关卡场景轮播、粒子效果
 */
export class MenuAnimation {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particlesContainer = null;
        this.currentLevelIndex = 0;
        this.levelRotateInterval = null;
        this.animationFrame = null;
        this.time = 0;
        
        this.levelData = [
            { name: '深暗地牢', desc: '危险的地下迷宫' },
            { name: '冰封雪山', desc: '寒冷的冰霜世界' },
            { name: '地狱走廊', desc: '燃烧的炼狱之地' },
            { name: '奥林匹斯', desc: '神殿云端圣境' },
            { name: '圣殿深处', desc: '最终的神圣试炼' }
        ];
    }
    
    init() {
        // 在init时获取DOM元素，确保DOM已加载
        this.canvas = document.getElementById('level-preview-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.particlesContainer = document.getElementById('menu-particles');
        
        console.log('MenuAnimation init - canvas:', this.canvas, 'ctx:', this.ctx);
        
        if (!this.canvas || !this.ctx) { 
            console.error('Level preview canvas not found!'); 
            return; 
        }
        
        this.canvas.width = 320;
        this.canvas.height = 180;
        this.initParticles();
        this.bindDotEvents();
        this.updateLevelDisplay();
        this.startAnimation();
        this.levelRotateInterval = setInterval(() => this.nextLevel(), 3500);
        console.log('MenuAnimation started successfully');
    }
    
    initParticles() {
        if (!this.particlesContainer) return;
        this.particlesContainer.innerHTML = '';
        for (let i = 0; i < 35; i++) {
            const p = document.createElement('div');
            p.style.cssText = `position:absolute;width:${Math.random()*4+2}px;height:${Math.random()*4+2}px;background:rgba(255,215,0,${Math.random()*0.4+0.2});border-radius:50%;left:${Math.random()*100}%;top:${Math.random()*100}%;animation:particleFloat ${Math.random()*10+10}s linear infinite;animation-delay:${Math.random()*5}s;pointer-events:none;`;
            this.particlesContainer.appendChild(p);
        }
        if (!document.getElementById('particle-style')) {
            const style = document.createElement('style');
            style.id = 'particle-style';
            style.textContent = `@keyframes particleFloat{0%{transform:translateY(100vh) rotate(0deg);opacity:0;}10%{opacity:1;}90%{opacity:1;}100%{transform:translateY(-100vh) rotate(720deg);opacity:0;}}`;
            document.head.appendChild(style);
        }
    }
    
    bindDotEvents() {
        document.querySelectorAll('#level-showcase-dots .dot').forEach((dot, i) => {
            dot.addEventListener('click', () => this.switchToLevel(i));
        });
    }
    
    switchToLevel(index) {
        this.currentLevelIndex = index;
        this.updateLevelDisplay();
        clearInterval(this.levelRotateInterval);
        this.levelRotateInterval = setInterval(() => this.nextLevel(), 3500);
    }
    
    nextLevel() {
        this.currentLevelIndex = (this.currentLevelIndex + 1) % this.levelData.length;
        this.updateLevelDisplay();
    }
    
    updateLevelDisplay() {
        const level = this.levelData[this.currentLevelIndex];
        const nameEl = document.getElementById('level-showcase-name');
        const descEl = document.getElementById('level-showcase-desc');
        if (nameEl) nameEl.textContent = level.name;
        if (descEl) descEl.textContent = level.desc;
        document.querySelectorAll('#level-showcase-dots .dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentLevelIndex);
        });
    }
    
    startAnimation() {
        const animate = () => {
            this.time += 0.016;
            this.drawLevel();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }
    
    stop() {
        if (this.levelRotateInterval) clearInterval(this.levelRotateInterval);
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    }
    
    drawLevel() {
        if (!this.ctx) return;
        const ctx = this.ctx, w = 320, h = 180, t = this.time;
        ctx.clearRect(0, 0, w, h);
        
        switch(this.currentLevelIndex) {
            case 0: this.drawDungeon(ctx, w, h, t); break;
            case 1: this.drawIceMountain(ctx, w, h, t); break;
            case 2: this.drawHellCorridor(ctx, w, h, t); break;
            case 3: this.drawOlympus(ctx, w, h, t); break;
            case 4: this.drawTemple(ctx, w, h, t); break;
        }
    }
    
    drawDungeon(ctx, w, h, t) {
        // 深邃的渐变背景
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#0d0d1a');
        bg.addColorStop(0.5, '#1a1a2e');
        bg.addColorStop(1, '#252540');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
        
        // 石砖墙壁 - 更有层次感
        for (let y = 0; y < h - 35; y += 22) {
            for (let x = (Math.floor(y / 22) % 2 === 0 ? 0 : -22); x < w + 50; x += 44) {
                // 砖块阴影
                ctx.fillStyle = '#15152a';
                ctx.fillRect(x + 1, y + 1, 42, 19);
                // 砖块主体
                const brickGrad = ctx.createLinearGradient(x, y, x, y + 20);
                brickGrad.addColorStop(0, '#3a3a55');
                brickGrad.addColorStop(0.5, '#2a2a40');
                brickGrad.addColorStop(1, '#202035');
                ctx.fillStyle = brickGrad;
                ctx.fillRect(x + 2, y + 2, 40, 17);
                // 砖块高光
                ctx.fillStyle = 'rgba(100, 100, 130, 0.3)';
                ctx.fillRect(x + 3, y + 3, 38, 3);
            }
        }
        
        // 地牢走廊透视效果
        ctx.fillStyle = '#0a0a15';
        ctx.beginPath();
        ctx.moveTo(w/2 - 60, 0);
        ctx.lineTo(w/2 - 30, h - 35);
        ctx.lineTo(w/2 + 30, h - 35);
        ctx.lineTo(w/2 + 60, 0);
        ctx.closePath();
        ctx.fill();
        
        // 走廊深处的神秘光芒
        const mysteryGlow = ctx.createRadialGradient(w/2, 30, 0, w/2, 30, 50);
        mysteryGlow.addColorStop(0, 'rgba(100, 50, 150, 0.4)');
        mysteryGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = mysteryGlow;
        ctx.beginPath();
        ctx.arc(w/2, 30, 50, 0, Math.PI * 2);
        ctx.fill();
        
        // 火把 - 更精致的效果
        const torchPositions = [{x: 60, y: 55}, {x: w - 60, y: 55}];
        torchPositions.forEach((pos, i) => {
            const flicker = Math.sin(t * 10 + i * 3) * 3;
            
            // 火把光晕 - 多层次
            const glow1 = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 70 + flicker);
            glow1.addColorStop(0, 'rgba(255, 120, 50, 0.3)');
            glow1.addColorStop(0.5, 'rgba(255, 80, 30, 0.1)');
            glow1.addColorStop(1, 'transparent');
            ctx.fillStyle = glow1;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 70 + flicker, 0, Math.PI * 2);
            ctx.fill();
            
            // 火把架
            ctx.fillStyle = '#4a3a2a';
            ctx.fillRect(pos.x - 3, pos.y, 6, 25);
            
            // 火焰本体
            const flameH = 18 + Math.sin(t * 12 + i) * 4;
            const flame = ctx.createRadialGradient(pos.x, pos.y - 5, 0, pos.x, pos.y - 5, 12);
            flame.addColorStop(0, '#ffffaa');
            flame.addColorStop(0.3, '#ffaa44');
            flame.addColorStop(0.7, '#ff6622');
            flame.addColorStop(1, 'rgba(200, 50, 0, 0)');
            ctx.fillStyle = flame;
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y - 5, 8 + flicker/2, flameH, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // 火星飞溅
            ctx.fillStyle = '#ffcc55';
            for (let s = 0; s < 3; s++) {
                const sparkY = pos.y - 20 - ((t * 60 + s * 20 + i * 10) % 40);
                const sparkX = pos.x + Math.sin(t * 5 + s * 2 + i) * 8;
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // 地面石板
        const floorGrad = ctx.createLinearGradient(0, h - 35, 0, h);
        floorGrad.addColorStop(0, '#3a3a50');
        floorGrad.addColorStop(1, '#252535');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, h - 35, w, 35);
        
        // 地面缝隙
        ctx.strokeStyle = '#1a1a2a';
        ctx.lineWidth = 2;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, h - 35);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        
        // 环境粒子 - 灰尘
        ctx.fillStyle = 'rgba(150, 150, 170, 0.4)';
        for (let i = 0; i < 12; i++) {
            const px = (i * 31 + t * 8) % w;
            const py = (i * 17 + t * 5) % (h - 40);
            ctx.beginPath();
            ctx.arc(px, py, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 冰封雪山 - 极光、飘雪、雪山
    drawIceMountain(ctx, w, h, t) {
        // 极光天空
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#0a1528'); sky.addColorStop(0.4, '#1a3a5c'); sky.addColorStop(1, '#0a1a2c');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
        
        // 极光
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 2; i++) {
            const auroraGrad = ctx.createLinearGradient(0, 20 + i * 25, 0, 60 + i * 25);
            auroraGrad.addColorStop(0, 'transparent');
            auroraGrad.addColorStop(0.5, i === 0 ? '#40ff80' : '#4080ff');
            auroraGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = auroraGrad;
            ctx.beginPath();
            ctx.moveTo(0, 30 + i * 20);
            for (let x = 0; x <= w; x += 20) ctx.lineTo(x, 30 + i * 20 + Math.sin(x * 0.05 + t + i) * 15);
            ctx.lineTo(w, 70 + i * 20); ctx.lineTo(0, 70 + i * 20);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // 雪山
        ctx.fillStyle = '#5a8aac';
        ctx.beginPath(); ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 20) ctx.lineTo(x, h - 60 - Math.sin(x * 0.02) * 30);
        ctx.lineTo(w, h); ctx.fill();
        
        // 积雪
        ctx.fillStyle = '#e8f4ff';
        ctx.beginPath(); ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 15) ctx.lineTo(x, h - 50 - Math.sin(x * 0.025) * 25);
        ctx.lineTo(w, h); ctx.fill();
        
        // 飘雪
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 25; i++) {
            const sx = (i * 37 + t * 25) % (w + 20) - 10;
            const sy = (i * 19 + t * 40) % h;
            ctx.globalAlpha = 0.4 + Math.sin(t * 2 + i) * 0.3;
            ctx.beginPath(); ctx.arc(sx, sy, 1.5 + i % 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    // 地狱走廊 - 滚烫岩浆、火焰
    drawHellCorridor(ctx, w, h, t) {
        // 炼狱背景
        const bg = ctx.createRadialGradient(w/2, h, 0, w/2, 0, h);
        bg.addColorStop(0, '#4a1a0a'); bg.addColorStop(0.5, '#2a0a05'); bg.addColorStop(1, '#0a0202');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
        
        // 熔岩裂缝光晕
        for (let i = 0; i < 3; i++) {
            const sx = 80 + i * 100;
            ctx.globalAlpha = 0.2 + Math.sin(t * 3 + i) * 0.1;
            const crackGlow = ctx.createLinearGradient(sx - 20, 0, sx + 20, 0);
            crackGlow.addColorStop(0, 'transparent');
            crackGlow.addColorStop(0.5, '#ff4400');
            crackGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = crackGlow;
            ctx.fillRect(sx - 20, 0, 40, h - 35);
        }
        ctx.globalAlpha = 1;
        
        // 岩浆池
        const lavaY = h - 35;
        ctx.fillStyle = '#ff4400';
        ctx.beginPath(); ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 10) ctx.lineTo(x, lavaY + Math.sin(x * 0.08 + t * 4) * 5);
        ctx.lineTo(w, h); ctx.fill();
        
        // 岩浆高光波动
        ctx.fillStyle = '#ff8844';
        for (let x = 0; x < w; x += 25) {
            ctx.globalAlpha = 0.5 + Math.sin(t * 5 + x * 0.1) * 0.3;
            ctx.beginPath();
            ctx.ellipse(x + 12, lavaY + 8, 10, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // 气泡
        for (let i = 0; i < 5; i++) {
            const bx = (i * 70 + t * 25) % w;
            const phase = (t * 2 + i * 0.5) % 1;
            const by = lavaY + 10 - phase * 30;
            ctx.globalAlpha = 1 - phase;
            ctx.fillStyle = '#ffaa44';
            ctx.beginPath(); ctx.arc(bx, by, 3 + Math.sin(phase * Math.PI) * 3, 0, Math.PI * 2); ctx.fill();
        }
        
        // 上升火星
        ctx.fillStyle = '#ffcc44';
        for (let i = 0; i < 12; i++) {
            const sx = (i * 30 + t * 15) % w;
            const sy = h - 40 - ((t * 50 + i * 20) % 120);
            ctx.globalAlpha = 0.7 - sy / h;
            ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    // 奥林匹斯 - 浮动云层、神殿
    drawOlympus(ctx, w, h, t) {
        // 神圣天空
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#1a2a4a'); sky.addColorStop(0.4, '#3a5080');
        sky.addColorStop(0.7, '#5a80b0'); sky.addColorStop(1, '#8ab0d0');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
        
        // 远处云层
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 4; i++) {
            const cx = (i * 100 + t * 10) % (w + 80) - 40;
            const cy = 25 + i * 12;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(cx, cy, 35, 12, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + 25, cy - 5, 25, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // 神殿柱子
        const pillars = [50, 100, w - 100, w - 50];
        pillars.forEach(px => {
            const pillarGrad = ctx.createLinearGradient(px - 8, 0, px + 8, 0);
            pillarGrad.addColorStop(0, '#c8c8d0'); pillarGrad.addColorStop(0.5, '#f0f0f8'); pillarGrad.addColorStop(1, '#a8a8b0');
            ctx.fillStyle = pillarGrad;
            ctx.fillRect(px - 8, 45, 16, h - 70);
            ctx.fillStyle = '#d8d8e0';
            ctx.fillRect(px - 12, 40, 24, 8);
            ctx.fillRect(px - 12, h - 30, 24, 8);
        });
        
        // 神殿顶
        ctx.fillStyle = '#d0d0e0';
        ctx.beginPath(); ctx.moveTo(35, 40); ctx.lineTo(w/2, 15); ctx.lineTo(w - 35, 40); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(40, 39); ctx.lineTo(w/2, 18); ctx.lineTo(w - 40, 39); ctx.stroke();
        
        // 近景浮动云
        for (let i = 0; i < 3; i++) {
            const cx = (i * 130 + t * 12) % (w + 100) - 50;
            const cy = h - 25 + Math.sin(t * 0.8 + i) * 8;
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(cx, cy, 50, 15, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + 30, cy - 8, 35, 12, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // 金色光粒
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 8; i++) {
            const px = (Math.sin(t * 0.5 + i) * 0.4 + 0.5) * w;
            const py = (Math.cos(t * 0.4 + i * 1.2) * 0.3 + 0.4) * h;
            ctx.globalAlpha = 0.4 + Math.sin(t * 3 + i) * 0.3;
            ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    // 宏伟圣殿 - 符文魔法阵、神圣光芒
    drawTemple(ctx, w, h, t) {
        const cx = w / 2, cy = h / 2;
        
        // 紫金背景
        const bg = ctx.createRadialGradient(cx, cy * 0.6, 0, cx, cy, w);
        bg.addColorStop(0, '#4a3a60'); bg.addColorStop(0.4, '#2a1a40'); bg.addColorStop(1, '#0a0518');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
        
        // 光柱
        for (let i = 0; i < 5; i++) {
            const lx = (i + 0.5) * (w / 5);
            const pulse = Math.sin(t * 2 + i * 0.8) * 0.3 + 0.7;
            ctx.globalAlpha = 0.2 * pulse;
            const lightGrad = ctx.createLinearGradient(lx, 0, lx, h);
            lightGrad.addColorStop(0, '#ffffff'); lightGrad.addColorStop(0.4, '#ffd700'); lightGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = lightGrad;
            ctx.fillRect(lx - 12, 0, 24, h);
        }
        ctx.globalAlpha = 1;
        
        // 符文魔法阵
        const rings = [{r: 70, s: 0.3, n: 10}, {r: 45, s: -0.4, n: 8}, {r: 25, s: 0.6, n: 6}];
        rings.forEach((ring, ri) => {
            ctx.globalAlpha = 0.2 + ri * 0.05;
            ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(cx, cy, ring.r, 0, Math.PI * 2); ctx.stroke();
            for (let i = 0; i < ring.n; i++) {
                const angle = (Math.PI * 2 / ring.n) * i + t * ring.s;
                const rx = cx + Math.cos(angle) * ring.r;
                const ry = cy + Math.sin(angle) * ring.r;
                ctx.beginPath();
                ctx.moveTo(rx, ry - 5); ctx.lineTo(rx + 4, ry); ctx.lineTo(rx, ry + 5); ctx.lineTo(rx - 4, ry);
                ctx.closePath(); ctx.stroke();
            }
        });
        
        // 中心十字
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
        ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 20); ctx.lineTo(cx, cy + 20);
        ctx.moveTo(cx - 15, cy - 5); ctx.lineTo(cx + 15, cy - 5);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // 上升光粒子
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 12; i++) {
            const px = (Math.sin(t * 0.5 + i * 0.6) * 0.35 + 0.5) * w;
            const py = (h - (t * 30 + i * 25) % (h + 30));
            ctx.globalAlpha = 0.4 + Math.sin(t * 2 + i) * 0.2;
            ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}
