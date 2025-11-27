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
        const b = this.breathe, r = this.phase === 2, g = this.tridentGlow, t = Date.now() / 1000;
        
        // 深海光环
        ctx.save();
        ctx.globalAlpha = 0.5;
        const aura = ctx.createRadialGradient(this.x, this.y, 20, this.x, this.y, 120);
        aura.addColorStop(0, r ? 'rgba(0,255,200,0.4)' : 'rgba(0,150,200,0.3)');
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.beginPath(); ctx.arc(this.x, this.y, 120, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        
        // 能量波纹
        ctx.strokeStyle = r ? 'rgba(0,255,220,0.4)' : 'rgba(0,180,220,0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 50 + i * 25 + (t * 30 % 25), 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 披风/斗篷
        ctx.fillStyle = r ? '#004455' : '#003344';
        ctx.beginPath();
        ctx.moveTo(this.x - 45, this.y - 20 + b);
        ctx.quadraticCurveTo(this.x - 55, this.y + 40 + b, this.x - 35, this.y + 70 + b);
        ctx.lineTo(this.x + 35, this.y + 70 + b);
        ctx.quadraticCurveTo(this.x + 55, this.y + 40 + b, this.x + 45, this.y - 20 + b);
        ctx.closePath(); ctx.fill();
        
        // 身体盔甲
        const body = ctx.createLinearGradient(this.x, this.y - 40, this.x, this.y + 50);
        body.addColorStop(0, r ? '#00aacc' : '#0088aa');
        body.addColorStop(0.5, r ? '#006688' : '#005566');
        body.addColorStop(1, r ? '#004455' : '#003344');
        ctx.fillStyle = body;
        ctx.beginPath(); ctx.ellipse(this.x, this.y + 5 + b, 38, 50, 0, 0, Math.PI * 2); ctx.fill();
        
        // 盔甲纹路
        ctx.strokeStyle = r ? '#00ddff' : '#00aacc';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(this.x, this.y - 30 + b); ctx.lineTo(this.x, this.y + 40 + b); ctx.stroke();
        ctx.beginPath(); ctx.arc(this.x, this.y + b, 25, 0, Math.PI); ctx.stroke();
        
        // 肩甲
        ctx.fillStyle = r ? '#00ccdd' : '#009999';
        ctx.beginPath(); ctx.ellipse(this.x - 42, this.y - 15 + b, 15, 22, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(this.x + 42, this.y - 15 + b, 15, 22, 0.3, 0, Math.PI * 2); ctx.fill();
        
        // 头盔
        const helm = ctx.createRadialGradient(this.x, this.y - 50 + b, 5, this.x, this.y - 50 + b, 32);
        helm.addColorStop(0, r ? '#00eeff' : '#00ccdd');
        helm.addColorStop(1, r ? '#006677' : '#004455');
        ctx.fillStyle = helm;
        ctx.beginPath(); ctx.arc(this.x, this.y - 50 + b, 30, 0, Math.PI * 2); ctx.fill();
        
        // 头盔装饰 - 鱼鳍
        ctx.fillStyle = r ? '#00ffdd' : '#00ddcc';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 80 + b); ctx.lineTo(this.x - 8, this.y - 55 + b);
        ctx.lineTo(this.x + 8, this.y - 55 + b); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x - 25, this.y - 65 + b); ctx.lineTo(this.x - 30, this.y - 45 + b);
        ctx.lineTo(this.x - 15, this.y - 50 + b); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 25, this.y - 65 + b); ctx.lineTo(this.x + 30, this.y - 45 + b);
        ctx.lineTo(this.x + 15, this.y - 50 + b); ctx.closePath(); ctx.fill();
        
        // 眼睛
        ctx.fillStyle = r ? '#ff3366' : '#00ffff';
        ctx.shadowColor = r ? '#ff0044' : '#00ffff';
        ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.ellipse(this.x - 10, this.y - 52 + b, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(this.x + 10, this.y - 52 + b, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        
        // 三叉戟
        const tx = this.x + 55, ty = this.y - 20 + b;
        ctx.strokeStyle = r ? '#00ffcc' : '#00ddaa';
        ctx.lineWidth = 5;
        ctx.shadowColor = r ? '#00ffaa' : '#00ccff';
        ctx.shadowBlur = 10 + g * 8;
        ctx.beginPath(); ctx.moveTo(tx, ty + 60); ctx.lineTo(tx, ty - 30); ctx.stroke();
        ctx.fillStyle = r ? '#00ffdd' : '#00eeff';
        ctx.beginPath(); ctx.moveTo(tx, ty - 55); ctx.lineTo(tx - 4, ty - 25); ctx.lineTo(tx + 4, ty - 25); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(tx - 15, ty - 45); ctx.lineTo(tx - 6, ty - 22); ctx.lineTo(tx - 2, ty - 25); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(tx + 15, ty - 45); ctx.lineTo(tx + 6, ty - 22); ctx.lineTo(tx + 2, ty - 25); ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
        
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
        const barY = this.y - 110 + b;
        
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
