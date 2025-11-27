/**
 * 鬼化波塞冬 - Boss战Lv6
 * 海神，掌管海洋和地震
 * 强度: 异化Lv5的1.3倍
 */

export class GhostPoseidonBoss {
    constructor(x, y, player, combatSystem) {
        this.x = x;
        this.y = y;
        this.player = player;
        this.combatSystem = combatSystem;
        
        this.level = 6;
        this.name = '鬼化波塞冬';
        this.title = 'Ghost Poseidon';
        this.isBossRush = true;
        
        // 基础属性 (异化Lv5的1.3倍)
        this.maxHp = Math.round(2200 * 1.3); // 2860
        this.hp = this.maxHp;
        this.radius = 65;
        this.color = '#0066aa';
        this.damage = Math.round(45 * 1.3); // 58
        
        // 战斗属性
        this.telegraphDuration = 0.7;
        this.attackCooldown = 1.0;
        this.state = 'IDLE';
        this.timer = 0;
        this.currentSkill = null;
        this.phase = 1;
        
        // 技能目标
        this.dashTarget = { x: 0, y: 0 };
        this.waveDirection = 0;
        this.tsunamiPoints = [];
        this.whirlpoolCenter = { x: 0, y: 0 };
        this.earthquakeZones = [];
        
        // 一阶段技能
        this.skills = [
            'TRIDENT_THRUST',    // 三叉戟突刺
            'TIDAL_WAVE',        // 潮汐波
            'WATER_SPEAR',       // 水之长矛
            'WHIRLPOOL',         // 漩涡陷阱
            'OCEAN_BURST',       // 海洋爆发
            'AQUA_SHIELD',       // 水之护盾
            'DEPTH_CHARGE'       // 深渊冲击
        ];
        
        // 二阶段技能
        this.phase2Skills = [
            ...this.skills,
            'TSUNAMI',           // 海啸
            'EARTHQUAKE',        // 地震
            'POSEIDON_WRATH',    // 波塞冬之怒
            'KRAKEN_SUMMON',     // 召唤克拉肯触手
            'ABYSS_DOMAIN',      // 深渊领域
            'DIVINE_JUDGMENT',   // 秒杀技：神罚海啸
            // 新增5个技能
            'STORM_SURGE',       // 风暴涌动：环形风暴
            'RIPTIDE',           // 激流：拉扯玩家的水流
            'OCEAN_PILLAR',      // 海洋柱：地面喷射水柱
            'CORAL_CAGE',        // 珊瑚牢笼：围困玩家
            'LEVIATHAN_CALL'     // 利维坦召唤：巨大海怪攻击
        ];
        
        // 视觉效果
        this.breathe = 0;
        this.tridentGlow = 0;
        this.waterParticles = [];
        
        // 秒杀技预警状态
        this.divineJudgmentWarning = false;
        this.divineJudgmentSafeZone = { x: 0, y: 0, radius: 100 };
        this.divineJudgmentTimer = 0;
    }
    
    update(deltaTime) {
        this.breathe = Math.sin(Date.now() / 500) * 3;
        this.tridentGlow = (Math.sin(Date.now() / 300) + 1) * 0.5;
        
        // 相位切换
        if (this.hp <= this.maxHp * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.attackCooldown = 0.8;
            console.log('波塞冬进入狂暴阶段！');
        }
        
        // 状态机
        if (this.state === 'IDLE') {
            const dx = this.player.x - this.x;
            const dy = this.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const spd = this.phase === 2 ? 90 : 70;
            if (dist > 180) {
                this.x += (dx / dist) * spd * deltaTime;
                this.y += (dy / dist) * spd * deltaTime;
            }
        }
        
        switch (this.state) {
            case 'IDLE':
                this.timer += deltaTime;
                if (this.timer >= this.attackCooldown) {
                    this.timer = 0;
                    this.state = 'TELEGRAPH';
                    const skills = this.phase === 2 ? this.phase2Skills : this.skills;
                    this.currentSkill = skills[Math.floor(Math.random() * skills.length)];
                    this.prepareSkill();
                }
                break;
                
            case 'TELEGRAPH':
                this.timer += deltaTime;
                if (this.timer >= this.telegraphDuration) {
                    this.timer = 0;
                    this.state = 'ATTACK';
                    this.executeAttack();
                }
                break;
                
            case 'ATTACK':
                this.timer += deltaTime;
                if (this.timer >= 0.5) {
                    this.timer = 0;
                    this.state = 'IDLE';
                }
                break;
        }
    }
    
    prepareSkill() {
        switch (this.currentSkill) {
            case 'TRIDENT_THRUST':
            case 'DEPTH_CHARGE':
                this.dashTarget = { x: this.player.x, y: this.player.y };
                break;
            case 'TIDAL_WAVE':
                this.waveDirection = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                break;
            case 'WHIRLPOOL':
                this.whirlpoolCenter = { x: this.player.x, y: this.player.y };
                break;
            case 'TSUNAMI':
                this.tsunamiPoints = [];
                for (let i = 0; i < 5; i++) {
                    this.tsunamiPoints.push({
                        x: this.player.x + (Math.random() - 0.5) * 200,
                        y: this.player.y + (Math.random() - 0.5) * 200
                    });
                }
                break;
            case 'EARTHQUAKE':
                this.earthquakeZones = [];
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    this.earthquakeZones.push({
                        x: this.x + Math.cos(angle) * 150,
                        y: this.y + Math.sin(angle) * 150
                    });
                }
                break;
            case 'DIVINE_JUDGMENT':
                // 秒杀技预警：延长预警时间
                this.telegraphDuration = 2.5;
                break;
        }
    }
    
    executeAttack() {
        const dmg = this.damage;
        
        switch (this.currentSkill) {
            case 'TRIDENT_THRUST':
                // 三叉戟突刺 - 快速冲刺+三向攻击
                const angle = Math.atan2(this.dashTarget.y - this.y, this.dashTarget.x - this.x);
                this.x = this.dashTarget.x - Math.cos(angle) * 80;
                this.y = this.dashTarget.y - Math.sin(angle) * 80;
                for (let i = -1; i <= 1; i++) {
                    this.combatSystem.spawnProjectile({
                        x: this.x, y: this.y,
                        vx: Math.cos(angle + i * 0.3) * 400,
                        vy: Math.sin(angle + i * 0.3) * 400,
                        radius: 12, damage: dmg, lifetime: 1.2,
                        color: '#00aaff', isEnemy: true
                    });
                }
                break;
                
            case 'TIDAL_WAVE':
                // 潮汐波 - 扇形水浪
                for (let i = -4; i <= 4; i++) {
                    const a = this.waveDirection + i * 0.15;
                    this.combatSystem.spawnProjectile({
                        x: this.x, y: this.y,
                        vx: Math.cos(a) * 280, vy: Math.sin(a) * 280,
                        radius: 18, damage: dmg * 0.7, lifetime: 1.5,
                        color: '#44ccff', isEnemy: true
                    });
                }
                break;
                
            case 'WATER_SPEAR':
                // 水之长矛 - 追踪水矛
                for (let i = 0; i < 6; i++) {
                    setTimeout(() => {
                        const a = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y,
                            vx: Math.cos(a) * 350, vy: Math.sin(a) * 350,
                            radius: 10, damage: dmg * 0.5, lifetime: 1.8,
                            color: '#0088cc', isEnemy: true
                        });
                    }, i * 220);
                }
                break;
                
            case 'WHIRLPOOL':
                // 漩涡陷阱 - 持续吸引
                this.combatSystem.spawnProjectile({
                    x: this.whirlpoolCenter.x, y: this.whirlpoolCenter.y,
                    vx: 0, vy: 0,
                    radius: 80, damage: dmg * 0.3, lifetime: 3,
                    color: 'rgba(0, 150, 200, 0.5)', isEnemy: true,
                    isPull: true, pullStrength: 120
                });
                break;
                
            case 'OCEAN_BURST':
                // 海洋爆发 - 360度水柱
                for (let i = 0; i < 16; i++) {
                    const a = (Math.PI * 2 / 16) * i;
                    this.combatSystem.spawnProjectile({
                        x: this.x, y: this.y,
                        vx: Math.cos(a) * 200, vy: Math.sin(a) * 200,
                        radius: 14, damage: dmg * 0.6, lifetime: 1.2,
                        color: '#00ddff', isEnemy: true
                    });
                }
                break;
                
            case 'AQUA_SHIELD':
                // 水之护盾 - 临时减伤+反弹
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y,
                    vx: 0, vy: 0,
                    radius: 70, damage: 0, lifetime: 2,
                    color: 'rgba(0, 200, 255, 0.3)', isEnemy: true,
                    isShield: true
                });
                break;
                
            case 'DEPTH_CHARGE':
                // 深渊冲击 - 冲刺+爆炸
                this.x = this.dashTarget.x;
                this.y = this.dashTarget.y;
                setTimeout(() => {
                    for (let i = 0; i < 12; i++) {
                        const a = (Math.PI * 2 / 12) * i;
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y,
                            vx: Math.cos(a) * 250, vy: Math.sin(a) * 250,
                            radius: 16, damage: dmg * 0.8, lifetime: 1,
                            color: '#0055aa', isEnemy: true
                        });
                    }
                }, 200);
                break;
                
            case 'TSUNAMI':
                // 海啸 - 多点巨浪
                this.tsunamiPoints.forEach((point, idx) => {
                    setTimeout(() => {
                        for (let i = 0; i < 8; i++) {
                            const a = (Math.PI * 2 / 8) * i;
                            this.combatSystem.spawnProjectile({
                                x: point.x, y: point.y,
                                vx: Math.cos(a) * 180, vy: Math.sin(a) * 180,
                                radius: 25, damage: dmg * 0.9, lifetime: 1.5,
                                color: '#0077bb', isEnemy: true
                            });
                        }
                    }, idx * 200);
                });
                break;
                
            case 'EARTHQUAKE':
                // 地震 - 地面裂缝
                this.earthquakeZones.forEach((zone, idx) => {
                    setTimeout(() => {
                        this.combatSystem.spawnProjectile({
                            x: zone.x, y: zone.y,
                            vx: 0, vy: 0,
                            radius: 60, damage: dmg * 1.2, lifetime: 0.8,
                            color: 'rgba(139, 90, 43, 0.7)', isEnemy: true
                        });
                    }, idx * 100);
                });
                break;
                
            case 'POSEIDON_WRATH':
                // 波塞冬之怒 - 全屏水柱雨
                for (let i = 0; i < 20; i++) {
                    setTimeout(() => {
                        const rx = this.player.x + (Math.random() - 0.5) * 400;
                        const ry = this.player.y + (Math.random() - 0.5) * 400;
                        this.combatSystem.spawnProjectile({
                            x: rx, y: ry - 200,
                            vx: 0, vy: 400,
                            radius: 20, damage: dmg * 0.7, lifetime: 1.5,
                            color: '#00aadd', isEnemy: true
                        });
                    }, i * 130);
                }
                break;
                
            case 'KRAKEN_SUMMON':
                // 召唤克拉肯触手 - 地面触手攻击
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 / 6) * i + Math.random() * 0.5;
                    const dist = 100 + Math.random() * 100;
                    setTimeout(() => {
                        this.combatSystem.spawnProjectile({
                            x: this.player.x + Math.cos(angle) * dist,
                            y: this.player.y + Math.sin(angle) * dist,
                            vx: 0, vy: 0,
                            radius: 35, damage: dmg, lifetime: 1.2,
                            color: '#004466', isEnemy: true
                        });
                    }, i * 220);
                }
                break;
                
            case 'ABYSS_DOMAIN':
                // 深渊领域 - 持续伤害区域
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y,
                    vx: 0, vy: 0,
                    radius: 150, damage: dmg * 0.2, lifetime: 4,
                    color: 'rgba(0, 50, 100, 0.4)', isEnemy: true,
                    isDOT: true
                });
                break;
                
            case 'DIVINE_JUDGMENT':
                // 秒杀技：神罚海啸 - 全屏攻击，只有安全区可躲避
                // 设置安全区（Boss位置附近）
                this.divineJudgmentWarning = true;
                this.divineJudgmentSafeZone = {
                    x: this.x,
                    y: this.y,
                    radius: 120
                };
                
                // 2.5秒预警后发动
                setTimeout(() => {
                    this.divineJudgmentWarning = false;
                    // 检查玩家是否在安全区
                    const px = this.player.x;
                    const py = this.player.y;
                    const sx = this.divineJudgmentSafeZone.x;
                    const sy = this.divineJudgmentSafeZone.y;
                    const dist = Math.sqrt((px - sx) ** 2 + (py - sy) ** 2);
                    
                    if (dist > this.divineJudgmentSafeZone.radius) {
                        // 不在安全区，造成巨额伤害
                        this.player.hp -= 999;
                    }
                    
                    // 全屏水柱特效
                    for (let i = 0; i < 30; i++) {
                        const rx = Math.random() * 800 + 100;
                        const ry = Math.random() * 600;
                        this.combatSystem.spawnProjectile({
                            x: rx, y: -50,
                            vx: 0, vy: 600,
                            radius: 30, damage: 0, lifetime: 1.5,
                            color: '#00aaff', isEnemy: false // 纯视觉效果
                        });
                    }
                }, 2500);
                break;
                
            case 'STORM_SURGE':
                // 风暴涌动 - 环形扩散风暴
                for (let wave = 0; wave < 3; wave++) {
                    setTimeout(() => {
                        for (let i = 0; i < 12; i++) {
                            const a = (Math.PI * 2 / 12) * i;
                            const startDist = 50 + wave * 30;
                            this.combatSystem.spawnProjectile({
                                x: this.x + Math.cos(a) * startDist,
                                y: this.y + Math.sin(a) * startDist,
                                vx: Math.cos(a) * 200, vy: Math.sin(a) * 200,
                                radius: 15, damage: dmg * 0.6, lifetime: 2,
                                color: '#66ccff', isEnemy: true
                            });
                        }
                    }, wave * 300);
                }
                break;
                
            case 'RIPTIDE':
                // 激流 - 向玩家拉扯的水流
                const riptideAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                for (let i = 0; i < 8; i++) {
                    const offset = (i - 3.5) * 0.15;
                    setTimeout(() => {
                        // 从玩家身后发射向Boss方向
                        const startX = this.player.x + Math.cos(riptideAngle) * 300;
                        const startY = this.player.y + Math.sin(riptideAngle) * 300;
                        this.combatSystem.spawnProjectile({
                            x: startX, y: startY,
                            vx: -Math.cos(riptideAngle + offset) * 350,
                            vy: -Math.sin(riptideAngle + offset) * 350,
                            radius: 20, damage: dmg * 0.5, lifetime: 1.5,
                            color: '#0088cc', isEnemy: true
                        });
                    }, i * 160);
                }
                break;
                
            case 'OCEAN_PILLAR':
                // 海洋柱 - 地面喷射水柱
                for (let i = 0; i < 6; i++) {
                    setTimeout(() => {
                        const px = this.player.x + (Math.random() - 0.5) * 200;
                        const py = this.player.y + (Math.random() - 0.5) * 200;
                        // 预警圈
                        this.combatSystem.spawnProjectile({
                            x: px, y: py, vx: 0, vy: 0,
                            radius: 40, damage: 0, lifetime: 0.5,
                            color: 'rgba(0, 150, 255, 0.3)', isEnemy: false
                        });
                        // 延迟喷发
                        setTimeout(() => {
                            this.combatSystem.spawnProjectile({
                                x: px, y: py, vx: 0, vy: -300,
                                radius: 35, damage: dmg * 1.1, lifetime: 1,
                                color: '#00ddff', isEnemy: true
                            });
                        }, 500);
                    }, i * 280);
                }
                break;
                
            case 'CORAL_CAGE':
                // 珊瑚牢笼 - 围困玩家
                const cageX = this.player.x;
                const cageY = this.player.y;
                for (let i = 0; i < 8; i++) {
                    const cageAngle = (Math.PI * 2 / 8) * i;
                    setTimeout(() => {
                        this.combatSystem.spawnProjectile({
                            x: cageX + Math.cos(cageAngle) * 150,
                            y: cageY + Math.sin(cageAngle) * 150,
                            vx: -Math.cos(cageAngle) * 100,
                            vy: -Math.sin(cageAngle) * 100,
                            radius: 25, damage: dmg * 0.8, lifetime: 2,
                            color: '#ff6688', isEnemy: true
                        });
                    }, i * 130);
                }
                break;
                
            case 'LEVIATHAN_CALL':
                // 利维坦召唤 - 巨大海怪攻击
                // 从屏幕边缘召唤巨大触手横扫
                const levSide = Math.random() > 0.5 ? 1 : -1;
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        const startY = 100 + i * 100;
                        this.combatSystem.spawnProjectile({
                            x: levSide > 0 ? -50 : 850,
                            y: startY,
                            vx: levSide * 400, vy: 0,
                            radius: 50, damage: dmg * 1.3, lifetime: 2.5,
                            color: '#005577', isEnemy: true
                        });
                    }, i * 220);
                }
                break;
        }
    }
    
    draw(ctx) {
        const breathe = this.breathe;
        const isRage = this.phase === 2;
        const glow = this.tridentGlow;
        const time = Date.now() / 1000;
        
        // 深渊漩涡背景
        ctx.save();
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 4; i++) {
            const swirl = time * 2 + i * 1.5;
            ctx.strokeStyle = isRage ? `rgba(0, 255, 200, ${0.3 - i * 0.06})` : `rgba(0, 150, 180, ${0.25 - i * 0.05})`;
            ctx.lineWidth = 3 - i * 0.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 70 + i * 25, swirl, swirl + Math.PI * 1.5);
            ctx.stroke();
        }
        ctx.restore();
        
        // 幽灵触手（6条）
        ctx.lineCap = 'round';
        for (let t = 0; t < 6; t++) {
            const baseAngle = (Math.PI * 2 / 6) * t + time * 0.5;
            const wave = Math.sin(time * 3 + t) * 15;
            ctx.strokeStyle = isRage ? `rgba(0, 200, 180, ${0.7 - t * 0.08})` : `rgba(0, 120, 140, ${0.6 - t * 0.07})`;
            ctx.lineWidth = 8 - t * 0.5;
            ctx.beginPath();
            ctx.moveTo(this.x + Math.cos(baseAngle) * 35, this.y + Math.sin(baseAngle) * 40 + breathe);
            ctx.quadraticCurveTo(
                this.x + Math.cos(baseAngle) * 70 + wave, this.y + Math.sin(baseAngle) * 75 + breathe,
                this.x + Math.cos(baseAngle + 0.3) * 95, this.y + Math.sin(baseAngle + 0.3) * 100 + breathe
            );
            ctx.stroke();
        }
        
        // 主体 - 幽灵水母形态
        const bodyGrad = ctx.createRadialGradient(this.x, this.y - 20 + breathe, 0, this.x, this.y + 20 + breathe, 60);
        bodyGrad.addColorStop(0, isRage ? 'rgba(0, 220, 200, 0.9)' : 'rgba(0, 150, 160, 0.85)');
        bodyGrad.addColorStop(0.5, isRage ? 'rgba(0, 160, 180, 0.7)' : 'rgba(0, 100, 120, 0.65)');
        bodyGrad.addColorStop(1, 'rgba(0, 60, 80, 0.3)');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + breathe, 50, 45, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 内部纹路
        ctx.strokeStyle = isRage ? 'rgba(0, 255, 220, 0.5)' : 'rgba(0, 180, 200, 0.4)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const a = time * 2 + i * 1.2;
            ctx.beginPath();
            ctx.arc(this.x, this.y + breathe, 20 + i * 6, a, a + 1);
            ctx.stroke();
        }
        
        // 头部 - 发光球体
        ctx.save();
        ctx.shadowColor = isRage ? '#00ffdd' : '#00aacc';
        ctx.shadowBlur = 25 + glow * 15;
        const headGrad = ctx.createRadialGradient(this.x, this.y - 45 + breathe, 0, this.x, this.y - 45 + breathe, 38);
        headGrad.addColorStop(0, isRage ? '#00ffee' : '#00ccdd');
        headGrad.addColorStop(0.4, isRage ? '#00ccbb' : '#009999');
        headGrad.addColorStop(1, isRage ? '#006666' : '#004455');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 45 + breathe, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // 诡异面纹
        ctx.strokeStyle = isRage ? '#00ffff' : '#00dddd';
        ctx.lineWidth = 2;
        // 左纹
        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y - 60 + breathe);
        ctx.lineTo(this.x - 28, this.y - 45 + breathe);
        ctx.lineTo(this.x - 20, this.y - 30 + breathe);
        ctx.stroke();
        // 右纹
        ctx.beginPath();
        ctx.moveTo(this.x + 20, this.y - 60 + breathe);
        ctx.lineTo(this.x + 28, this.y - 45 + breathe);
        ctx.lineTo(this.x + 20, this.y - 30 + breathe);
        ctx.stroke();
        
        // 眼睛 - 发光深渊之眼
        ctx.save();
        ctx.shadowColor = isRage ? '#ff0066' : '#00ffff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = isRage ? '#ff0088' : '#00ffff';
        ctx.beginPath();
        ctx.ellipse(this.x - 12, this.y - 50 + breathe, 7, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + 12, this.y - 50 + breathe, 7, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        // 瞳孔
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(this.x - 12, this.y - 50 + breathe, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + 12, this.y - 50 + breathe, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // 深渊三叉戟
        const tx = this.x + 60, ty = this.y - 25 + breathe;
        ctx.save();
        ctx.shadowColor = isRage ? '#00ffaa' : '#00ccff';
        ctx.shadowBlur = 20 + glow * 10;
        // 戟杆
        const poleGrad = ctx.createLinearGradient(tx, ty + 70, tx, ty - 50);
        poleGrad.addColorStop(0, '#004444');
        poleGrad.addColorStop(1, isRage ? '#00ddaa' : '#00aacc');
        ctx.strokeStyle = poleGrad;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(tx, ty + 70);
        ctx.lineTo(tx, ty - 35);
        ctx.stroke();
        // 三叉
        ctx.fillStyle = isRage ? '#00ffcc' : '#00ddff';
        ctx.beginPath();
        ctx.moveTo(tx, ty - 70); ctx.lineTo(tx - 5, ty - 35); ctx.lineTo(tx + 5, ty - 35); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(tx - 22, ty - 55); ctx.lineTo(tx - 10, ty - 30); ctx.lineTo(tx - 5, ty - 35); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(tx + 22, ty - 55); ctx.lineTo(tx + 10, ty - 30); ctx.lineTo(tx + 5, ty - 35); ctx.closePath(); ctx.fill();
        ctx.restore();
        
        // 技能预警
        if (this.state === 'TELEGRAPH') {
            ctx.save();
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            
            switch (this.currentSkill) {
                case 'TRIDENT_THRUST':
                case 'DEPTH_CHARGE':
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.dashTarget.x, this.dashTarget.y);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(this.dashTarget.x, this.dashTarget.y, 50, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'WHIRLPOOL':
                    ctx.beginPath();
                    ctx.arc(this.whirlpoolCenter.x, this.whirlpoolCenter.y, 80, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'EARTHQUAKE':
                    this.earthquakeZones.forEach(zone => {
                        ctx.beginPath();
                        ctx.arc(zone.x, zone.y, 60, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                    break;
                case 'DIVINE_JUDGMENT':
                    // 秒杀技预警：全屏红色警告 + 安全区绿色
                    ctx.restore();
                    ctx.save();
                    
                    // 全屏红色危险区
                    ctx.fillStyle = `rgba(255, 0, 0, ${0.2 + Math.sin(Date.now() / 100) * 0.15})`;
                    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                    
                    // 安全区绿色圆圈
                    ctx.strokeStyle = '#00ff00';
                    ctx.lineWidth = 5;
                    ctx.setLineDash([15, 10]);
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 120, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // 安全区内部
                    ctx.fillStyle = `rgba(0, 255, 0, ${0.15 + Math.sin(Date.now() / 150) * 0.1})`;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 120, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // 警告文字
                    ctx.fillStyle = '#ff4444';
                    ctx.font = 'bold 36px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('⚠️ 神罚海啸 - 快躲到安全区！ ⚠️', ctx.canvas.width / 2, 80);
                    
                    ctx.fillStyle = '#00ff00';
                    ctx.font = 'bold 24px Arial';
                    ctx.fillText('↓ 安全区 ↓', this.x, this.y - 140);
                    break;
            }
            ctx.restore();
        }
        
        // 血条
        const hpPercent = this.hp / this.maxHp;
        const barWidth = 120;
        const barX = this.x - barWidth / 2;
        const barY = this.y - 110 + breathe;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, 10);
        
        const hpGrad = ctx.createLinearGradient(barX, barY, barX + barWidth * hpPercent, barY);
        hpGrad.addColorStop(0, '#00aaff');
        hpGrad.addColorStop(1, '#0066cc');
        ctx.fillStyle = hpGrad;
        ctx.fillRect(barX, barY, barWidth * hpPercent, 10);
        
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, 10);
        
        // Boss名字
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x, barY - 5);
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            return true; // Boss defeated
        }
        return false;
    }
}
