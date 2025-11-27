/**
 * 狂化阿尔忒弥斯 - Boss战Lv7 (最终Boss)
 * 狩猎与月亮女神，阿波罗的双胞胎姐妹
 * 强度: Lv6波塞冬的1.4倍
 */

export class BerserkArtemisBoss {
    constructor(x, y, player, combatSystem) {
        this.x = x;
        this.y = y;
        this.player = player;
        this.combatSystem = combatSystem;
        
        this.level = 7;
        this.name = '狂化阿尔忒弥斯';
        this.title = 'Berserk Artemis';
        this.isBossRush = true;
        this.isFinalBoss = true;
        
        // 基础属性 (大幅增强 - 最终Boss)
        this.maxHp = 20000; // 最终Boss超高血量
        this.hp = this.maxHp;
        this.radius = 60;
        this.color = '#aa44aa';
        this.damage = 100; // 增强伤害
        
        // 战斗属性
        this.telegraphDuration = 0.6; // 预警时间
        this.attackCooldown = 0.85; // 攻击间隔
        this.state = 'IDLE';
        this.timer = 0;
        this.currentSkill = null;
        this.phase = 1;
        
        // 技能目标
        this.dashTarget = { x: 0, y: 0 };
        this.arrowRainCenter = { x: 0, y: 0 };
        this.moonBeamAngle = 0;
        this.huntTargets = [];
        this.trapPositions = [];
        
        // 一阶段技能（精简强力）
        this.skills = [
            'TRIPLE_ARROW',      // 五连箭
            'MOON_SHOT',         // 月光箭
            'HUNTER_DASH',       // 猎手冲刺
            'SILVER_RAIN',       // 银箭雨
            'LUNAR_STRIKE',      // 月神打击
            'WILD_HUNT',         // 狩猎本能
            'LUNAR_RAIN',        // 月蚀之雨
            'GODDESS_WRATH',     // 女神之怒
            'LUNAR_SHIELD',      // 近身防御1
            'CRESCENT_BURST',    // 近身防御2
            'MOON_REPEL'         // 近身防御3
        ];
        
        // 二阶段技能（强力技能）
        this.phase2Skills = [
            'TRIPLE_ARROW',
            'MOON_SHOT',
            'HUNTER_DASH',
            'LUNAR_STRIKE',
            'MOONLIGHT_BARRAGE', // 月光弹幕
            'ARTEMIS_WRATH',     // 阿尔忒弥斯之怒
            'SHADOW_STEP',       // 影步
            'FERAL_CHARGE',      // 野性冲锋
            'CELESTIAL_SNIPE',   // 天穹狙击
            'HUNTER_STORM',      // 猎人风暴
            'LUNAR_RAIN',        // 月蚀之雨
            'GODDESS_WRATH',     // 女神之怒
            'LUNAR_SHIELD',      // 近身防御1
            'CRESCENT_BURST',    // 近身防御2
            'MOON_REPEL',        // 近身防御3
            'ARTEMIS_BARRIER',   // 近身防御4
            'SILVER_NOVA',       // 近身防御5
            'HUNT_COUNTER'       // 近身防御6
        ];
        
        // 三阶段技能（全部强力技能+秒杀技）
        this.phase3Skills = [
            'HUNTER_DASH',
            'LUNAR_STRIKE',
            'MOONLIGHT_BARRAGE',
            'SHADOW_STEP',
            'FERAL_CHARGE',
            'CELESTIAL_SNIPE',
            'HUNTER_STORM',
            'DIVINE_BEAST',      // 神兽召唤
            'LUNAR_RAIN',
            'ECLIPSE_BURST',     // 日蚀爆发
            'GODDESS_WRATH',
            'LUNAR_SHIELD',      // 近身防御1
            'CRESCENT_BURST',    // 近身防御2
            'MOON_REPEL',        // 近身防御3
            'ARTEMIS_BARRIER',   // 近身防御4
            'SILVER_NOVA',       // 近身防御5
            'HUNT_COUNTER',      // 近身防御6
            'MOONFALL_SLAM',     // 近身防御7
            'STARLIGHT_BURST',   // 近身防御8
            'DIVINE_REPULSE',    // 近身防御9
            'LUNAR_EXECUTION',   // 秒杀技1
            'STAR_MOON_DOOM'     // 秒杀技2
        ];
        
        // 秒杀技能真空期
        this.executionCooldown = 0;
        
        // 视觉效果
        this.breathe = 0;
        this.moonGlow = 0;
        this.bowCharge = 0;
        this.executionCooldown = 0;
        
        // 秒杀技状态
        this.lunarExecutionWarning = false;
        this.lunarExecutionSafeZones = [];
        
        // 近身攻击范围
        this.meleeRange = 100;
        
        // 包装spawnProjectile以自动添加update/draw方法
        this._originalSpawnProjectile = this.combatSystem.spawnProjectile.bind(this.combatSystem);
        this.spawnProjectile = (config) => {
            const proj = {
                x: config.x,
                y: config.y,
                vx: config.vx || 0,
                vy: config.vy || 0,
                radius: config.radius || 10,
                damage: config.damage || 0,
                owner: 'enemy',
                life: config.lifetime || 1,
                maxLife: config.lifetime || 1,
                color: config.color || '#cc88ff',
                isHoming: config.isHoming || false,
                homingSpeed: config.homingSpeed || 0,
                player: this.player,
                update(dt) {
                    // 追踪逻辑
                    if (this.isHoming && this.player) {
                        const dx = this.player.x - this.x;
                        const dy = this.player.y - this.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > 10) {
                            this.x += (dx / dist) * this.homingSpeed * dt;
                            this.y += (dy / dist) * this.homingSpeed * dt;
                        }
                    } else {
                        this.x += this.vx * dt;
                        this.y += this.vy * dt;
                    }
                    this.life -= dt;
                    if (this.life <= 0) this.markedForDeletion = true;
                },
                draw(ctx) {
                    const alpha = Math.min(1, this.life / this.maxLife);
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            };
            this._originalSpawnProjectile(proj);
        };
    }
    
    update(deltaTime) {
        this.breathe = Math.sin(Date.now() / 400) * 2;
        this.moonGlow = (Math.sin(Date.now() / 250) + 1) * 0.5;
        
        // 三相位切换
        if (this.hp <= this.maxHp * 0.3 && this.phase < 3) {
            this.phase = 3;
            this.attackCooldown = 0.45;
            this.telegraphDuration = 0.35;
            console.log('☠️ 阿尔忒弥斯进入绝境阶段！解锁秒杀技能！');
        } else if (this.hp <= this.maxHp * 0.6 && this.phase === 1) {
            this.phase = 2;
            this.attackCooldown = 0.5;
            console.log('☠️ 阿尔忒弥斯进入狂暴阶段！解锁强力技能！');
        }
        
        // 秒杀技能后的真空期
        if (this.executionCooldown > 0) {
            this.executionCooldown -= deltaTime;
            return;
        }
        
        // 状态机
        if (this.state === 'IDLE') {
            const dx = this.player.x - this.x;
            const dy = this.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // 保持距离的AI - 远程Boss
            const optimalDist = 220;
            const spd = this.phase === 3 ? 160 : (this.phase === 2 ? 130 : 100);
            
            if (dist < optimalDist - 50) {
                // 太近，后退
                this.x -= (dx / dist) * spd * deltaTime;
                this.y -= (dy / dist) * spd * deltaTime;
            } else if (dist > optimalDist + 100) {
                // 太远，接近
                this.x += (dx / dist) * spd * 0.7 * deltaTime;
                this.y += (dy / dist) * spd * 0.7 * deltaTime;
            }
        }
        
        switch (this.state) {
            case 'IDLE':
                this.timer += deltaTime;
                if (this.timer >= this.attackCooldown) {
                    this.timer = 0;
                    this.state = 'TELEGRAPH';
                    let skills;
                    if (this.phase === 3) skills = this.phase3Skills;
                    else if (this.phase === 2) skills = this.phase2Skills;
                    else skills = this.skills;
                    this.currentSkill = skills[Math.floor(Math.random() * skills.length)];
                    this.prepareSkill();
                }
                break;
                
            case 'TELEGRAPH':
                this.timer += deltaTime;
                this.bowCharge = this.timer / this.telegraphDuration;
                if (this.timer >= this.telegraphDuration) {
                    this.timer = 0;
                    this.bowCharge = 0;
                    this.state = 'ATTACK';
                    this.executeAttack();
                }
                break;
                
            case 'ATTACK':
                this.timer += deltaTime;
                if (this.timer >= 0.4) {
                    this.timer = 0;
                    this.state = 'IDLE';
                }
                break;
        }
    }
    
    prepareSkill() {
        switch (this.currentSkill) {
            case 'HUNTER_DASH':
                this.dashTarget = { x: this.player.x, y: this.player.y };
                break;
            case 'SILVER_RAIN':
            case 'MOONLIGHT_BARRAGE':
                this.arrowRainCenter = { x: this.player.x, y: this.player.y };
                break;
            case 'MOON_SHOT':
            case 'LUNAR_STRIKE':
                this.moonBeamAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                break;
            case 'BEAST_TRAP':
                this.trapPositions = [];
                for (let i = 0; i < 5; i++) {
                    this.trapPositions.push({
                        x: this.player.x + (Math.random() - 0.5) * 300,
                        y: this.player.y + (Math.random() - 0.5) * 300
                    });
                }
                break;
            case 'WILD_HUNT':
            case 'PHANTOM_WOLVES':
                this.huntTargets = [];
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI * 2 / 4) * i;
                    this.huntTargets.push({
                        x: this.player.x + Math.cos(angle) * 150,
                        y: this.player.y + Math.sin(angle) * 150
                    });
                }
                break;
            case 'CRESCENT_SLASH':
                // 近身技预警
                this.dashTarget = { x: this.player.x, y: this.player.y };
                break;
            case 'LUNAR_EXECUTION':
                // 秒杀技预警：延长预警时间
                this.telegraphDuration = 3.0;
                break;
        }
    }
    
    executeAttack() {
        const dmg = this.damage;
        
        switch (this.currentSkill) {
            case 'TRIPLE_ARROW':
                // 三连箭 - 快速五发
                const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        const a = angle + (Math.random() - 0.5) * 0.15;
                        this.spawnProjectile({
                            x: this.x, y: this.y,
                            vx: Math.cos(a) * 650, vy: Math.sin(a) * 650,
                            radius: 10, damage: dmg * 0.6, lifetime: 1.5,
                            color: '#cc88ff', isEnemy: true
                        });
                    }, i * 100);
                }
                break;
                
            case 'MOON_SHOT':
                // 月光箭 - 穿透高伤
                this.spawnProjectile({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.moonBeamAngle) * 750,
                    vy: Math.sin(this.moonBeamAngle) * 750,
                    radius: 18, damage: dmg * 1.5, lifetime: 2,
                    color: '#eeeeff', isEnemy: true, isPierce: true
                });
                break;
                
            case 'HUNTER_DASH':
                // 猎手冲刺 - 高速穿刺（添加瞬移预警+锁定）
                const dashTarget = { x: this.dashTarget.x, y: this.dashTarget.y }; // 锁定目标
                const dashAngle = Math.atan2(dashTarget.y - this.y, dashTarget.x - this.x);
                const startX = this.x, startY = this.y;
                // 瞬移线路预警
                this.spawnProjectile({
                    x: startX, y: startY, vx: 0, vy: 0, radius: 5, damage: 0, lifetime: 0.35,
                    color: '#ff88ff', isEnemy: false,
                    targetX: dashTarget.x, targetY: dashTarget.y,
                    update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        ctx.strokeStyle = `rgba(255,150,255,${this.life * 3})`; ctx.lineWidth = 3; ctx.setLineDash([8, 4]);
                        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(this.targetX, this.targetY); ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.fillStyle = `rgba(255,100,255,${this.life * 2})`;
                        ctx.beginPath(); ctx.arc(this.targetX, this.targetY, 40, 0, Math.PI * 2); ctx.fill();
                        if (this.life < 0.15) {
                            ctx.fillStyle = '#ff0000'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
                            ctx.fillText('🔒', this.targetX, this.targetY - 50);
                        }
                    }
                });
                // 0.35秒后开始冲刺
                setTimeout(() => {
                    // 留下残影攻击
                    for (let i = 0; i < 5; i++) {
                        setTimeout(() => {
                            const progress = i / 5;
                            const px = startX + (dashTarget.x - startX) * progress;
                            const py = startY + (dashTarget.y - startY) * progress;
                            this.spawnProjectile({
                                x: px, y: py, vx: 0, vy: 0,
                                radius: 25, damage: dmg * 0.4, lifetime: 0.3,
                                color: 'rgba(200, 150, 255, 0.5)', isEnemy: true
                            });
                        }, i * 50);
                    }
                    // 冲刺到目标
                    setTimeout(() => {
                        this.x = dashTarget.x - Math.cos(dashAngle) * 100;
                        this.y = dashTarget.y - Math.sin(dashAngle) * 100;
                    }, 150);
                }, 350);
                break;
                
            case 'BEAST_TRAP':
                // 野兽陷阱
                this.trapPositions.forEach((pos, idx) => {
                    setTimeout(() => {
                        this.spawnProjectile({
                            x: pos.x, y: pos.y,
                            vx: 0, vy: 0,
                            radius: 40, damage: dmg * 0.8, lifetime: 3,
                            color: 'rgba(150, 100, 50, 0.6)', isEnemy: true,
                            isTrap: true
                        });
                    }, idx * 100);
                });
                break;
                
            case 'SILVER_RAIN':
                // 银箭雨（添加下落预警）
                for (let i = 0; i < 15; i++) {
                    const rx = this.arrowRainCenter.x + (Math.random() - 0.5) * 200;
                    const ry = this.arrowRainCenter.y + (Math.random() - 0.5) * 200;
                    // 落点预警
                    setTimeout(() => {
                        this.spawnProjectile({
                            x: rx, y: ry, vx: 0, vy: 0, radius: 15, damage: 0, lifetime: 0.4,
                            color: 'rgba(220,220,255,0.5)', isEnemy: false,
                            update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) {
                                ctx.strokeStyle = `rgba(200,200,255,${this.life * 2.5})`; ctx.lineWidth = 2;
                                ctx.beginPath(); ctx.arc(this.x, this.y, 12, 0, Math.PI * 2); ctx.stroke();
                            }
                        });
                    }, i * 90);
                    // 0.4秒后箭矢下落
                    setTimeout(() => {
                        this.spawnProjectile({
                            x: rx, y: -30,
                            vx: 0, vy: 700,
                            radius: 8, damage: dmg * 0.5, lifetime: 1.2,
                            color: '#ddddff', isEnemy: true
                        });
                    }, i * 70 + 400);
                }
                break;
                
            case 'LUNAR_STRIKE':
                // 月神打击 - 扇形月光
                for (let i = -6; i <= 6; i++) {
                    const a = this.moonBeamAngle + i * 0.1;
                    this.spawnProjectile({
                        x: this.x, y: this.y,
                        vx: Math.cos(a) * 480, vy: Math.sin(a) * 480,
                        radius: 14, damage: dmg * 0.7, lifetime: 1.3,
                        color: '#aabbff', isEnemy: true
                    });
                }
                break;
                
            case 'WILD_HUNT':
                // 狩猎本能 - 多方向追踪箭
                this.huntTargets.forEach((target, idx) => {
                    setTimeout(() => {
                        const a = Math.atan2(this.player.y - target.y, this.player.x - target.x);
                        this.spawnProjectile({
                            x: target.x, y: target.y,
                            vx: Math.cos(a) * 520, vy: Math.sin(a) * 520,
                            radius: 12, damage: dmg * 0.8, lifetime: 1.5,
                            color: '#ff88cc', isEnemy: true
                        });
                    }, idx * 120);
                });
                break;
                
            case 'MOONLIGHT_BARRAGE':
                // 月光弹幕 - 密集箭雨
                for (let i = 0; i < 24; i++) {
                    setTimeout(() => {
                        const rx = this.arrowRainCenter.x + (Math.random() - 0.5) * 350;
                        const ry = this.arrowRainCenter.y + (Math.random() - 0.5) * 350;
                        this.spawnProjectile({
                            x: rx, y: ry - 400,
                            vx: (Math.random() - 0.5) * 50, vy: 450,
                            radius: 8, damage: dmg * 0.35, lifetime: 2,
                            color: '#ccccff', isEnemy: true
                        });
                    }, i * 70);
                }
                break;
                
            case 'TWIN_MOONS':
                // 双月连环 - 两个旋转月轮
                for (let moon = 0; moon < 2; moon++) {
                    const baseAngle = moon * Math.PI;
                    for (let i = 0; i < 12; i++) {
                        setTimeout(() => {
                            const a = baseAngle + (Math.PI * 2 / 12) * i + Date.now() / 500;
                            this.spawnProjectile({
                                x: this.x + Math.cos(a) * 50,
                                y: this.y + Math.sin(a) * 50,
                                vx: Math.cos(a) * 250, vy: Math.sin(a) * 250,
                                radius: 14, damage: dmg * 0.5, lifetime: 1.5,
                                color: '#eeeeff', isEnemy: true
                            });
                        }, i * 60 + moon * 400);
                    }
                }
                break;
                
            case 'ARTEMIS_WRATH':
                // 阿尔忒弥斯之怒 - 全向银箭风暴
                for (let wave = 0; wave < 3; wave++) {
                    setTimeout(() => {
                        for (let i = 0; i < 16; i++) {
                            const a = (Math.PI * 2 / 16) * i + wave * 0.2;
                            this.spawnProjectile({
                                x: this.x, y: this.y,
                                vx: Math.cos(a) * 300, vy: Math.sin(a) * 300,
                                radius: 10, damage: dmg * 0.5, lifetime: 1.5,
                                color: '#ff99ff', isEnemy: true
                            });
                        }
                    }, wave * 200);
                }
                break;
                
            case 'PHANTOM_WOLVES':
                // 幻影狼群 - 追踪狼魂
                this.huntTargets.forEach((target, idx) => {
                    setTimeout(() => {
                        // 狼魂会追踪
                        const wolf = {
                            x: target.x, y: target.y,
                            vx: 0, vy: 0,
                            radius: 30, damage: dmg * 0.9, lifetime: 2.5,
                            color: '#8866aa', isEnemy: true,
                            isHoming: true, homingSpeed: 180
                        };
                        this.spawnProjectile(wolf);
                    }, idx * 200);
                });
                break;
                
            case 'GODDESS_DOMAIN':
                // 女神领域 - 持续月光场
                this.spawnProjectile({
                    x: this.x, y: this.y,
                    vx: 0, vy: 0,
                    radius: 180, damage: dmg * 0.15, lifetime: 5,
                    color: 'rgba(200, 180, 255, 0.3)', isEnemy: true,
                    isDOT: true
                });
                // 领域内持续发射箭矢
                for (let i = 0; i < 15; i++) {
                    setTimeout(() => {
                        const a = Math.random() * Math.PI * 2;
                        this.spawnProjectile({
                            x: this.x, y: this.y,
                            vx: Math.cos(a) * 200, vy: Math.sin(a) * 200,
                            radius: 8, damage: dmg * 0.3, lifetime: 1.5,
                            color: '#bb99dd', isEnemy: true
                        });
                    }, i * 400);
                }
                break;
                
            case 'OLYMPUS_JUDGMENT':
                // 奥林匹斯审判 - 神圣光柱
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        const rx = this.player.x + (Math.random() - 0.5) * 300;
                        const ry = this.player.y + (Math.random() - 0.5) * 300;
                        // 预警
                        this.spawnProjectile({
                            x: rx, y: ry,
                            vx: 0, vy: 0,
                            radius: 50, damage: 0, lifetime: 0.5,
                            color: 'rgba(255, 255, 200, 0.3)', isEnemy: false
                        });
                        // 延迟爆发
                        setTimeout(() => {
                            this.spawnProjectile({
                                x: rx, y: ry,
                                vx: 0, vy: 0,
                                radius: 50, damage: dmg * 1.5, lifetime: 0.3,
                                color: '#ffffaa', isEnemy: true
                            });
                        }, 500);
                    }, i * 220);
                }
                break;
                
            case 'ETERNAL_HUNT':
                // 永恒狩猎 - 终极技能
                // 快速连续冲刺 + 全屏箭雨
                for (let dash = 0; dash < 4; dash++) {
                    setTimeout(() => {
                        const targetAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                        const targetDist = 100;
                        this.x = this.player.x - Math.cos(targetAngle) * targetDist;
                        this.y = this.player.y - Math.sin(targetAngle) * targetDist;
                        
                        // 每次冲刺释放箭矢
                        for (let i = 0; i < 8; i++) {
                            const a = (Math.PI * 2 / 8) * i;
                            this.spawnProjectile({
                                x: this.x, y: this.y,
                                vx: Math.cos(a) * 350, vy: Math.sin(a) * 350,
                                radius: 12, damage: dmg * 0.6, lifetime: 1.2,
                                color: '#ffaaff', isEnemy: true
                            });
                        }
                    }, dash * 400);
                }
                break;
                
            case 'CRESCENT_SLASH':
                // 近身技：月牙斩 - 快速接近并释放月牙形攻击
                const slashAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                // 瞬移到玩家身边
                this.x = this.player.x - Math.cos(slashAngle) * 60;
                this.y = this.player.y - Math.sin(slashAngle) * 60;
                
                // 月牙形攻击
                for (let i = -3; i <= 3; i++) {
                    const a = slashAngle + i * 0.25;
                    this.spawnProjectile({
                        x: this.x, y: this.y,
                        vx: Math.cos(a) * 250, vy: Math.sin(a) * 250,
                        radius: 20, damage: dmg * 0.8, lifetime: 0.6,
                        color: '#ddaaff', isEnemy: true
                    });
                }
                
                // 回退
                setTimeout(() => {
                    this.x -= Math.cos(slashAngle) * 150;
                    this.y -= Math.sin(slashAngle) * 150;
                }, 300);
                break;
                
            case 'LUNAR_EXECUTION':
                // 秒杀技：月神处刑 - 全屏月光（5秒前摇+明显预警）
                // 第一阶段：1秒蓄力预警
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 50, damage: 0, lifetime: 1, maxLife: 1, boss: this,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const p = 1 - this.life / this.maxLife;
                        ctx.strokeStyle = `rgba(255,150,255,${0.8})`; ctx.lineWidth = 6;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 40 + p * 40, 0, Math.PI * 2); ctx.stroke();
                        ctx.fillStyle = '#ff88ff'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('⚠️ 月神处刑准备中... ⚠️', this.x, this.y - 90);
                    }
                });
                // 第二阶段：生成安全区并显示4秒预警
                setTimeout(() => {
                    this.lunarExecutionWarning = true;
                    this.lunarExecutionSafeZones = [];
                    for (let i = 0; i < 3; i++) {
                        const angle = (Math.PI * 2 / 3) * i + Math.random() * 0.5;
                        const dist = 180 + Math.random() * 100;
                        this.lunarExecutionSafeZones.push({ x: this.x + Math.cos(angle) * dist, y: this.y + Math.sin(angle) * dist, radius: 90 });
                    }
                    if (this.player.screenShake) { this.player.screenShake.intensity = 20; this.player.screenShake.duration = 4; }
                    // 4秒预警效果
                    this.spawnProjectile({
                        x: this.x, y: this.y, vx: 0, vy: 0, radius: 0, damage: 0, lifetime: 4, maxLife: 4,
                        zones: this.lunarExecutionSafeZones,
                        update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                        draw(ctx) {
                            const t = Date.now() / 1000;
                            // 全屏月光危险警告
                            ctx.fillStyle = `rgba(200,100,255,${0.15 + Math.sin(t * 10) * 0.1})`;
                            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                            // 安全区（阴影区）
                            this.zones.forEach((zone, i) => {
                                ctx.fillStyle = `rgba(50,30,80,${0.7 + Math.sin(t * 8 + i) * 0.2})`;
                                ctx.beginPath(); ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2); ctx.fill();
                                ctx.strokeStyle = '#333'; ctx.lineWidth = 5; ctx.setLineDash([12, 8]);
                                ctx.stroke(); ctx.setLineDash([]);
                                ctx.fillStyle = '#aaaaaa'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
                                ctx.fillText('↓ 阴影安全区 ↓', zone.x, zone.y - zone.radius - 10);
                            });
                            // 警告文字
                            ctx.fillStyle = '#ff66ff'; ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center';
                            ctx.fillText('☠️ 月神处刑 - 快躲到阴影区！ ☠️', ctx.canvas.width / 2, 80);
                            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 30px Arial';
                            ctx.fillText(`${Math.ceil(this.life)}秒内进入深色安全区！`, ctx.canvas.width / 2, 130);
                        }
                    });
                }, 1000);
                // 4.55秒时锁定位置提示（释放前0.45秒）
                setTimeout(() => {
                    const zones = this.lunarExecutionSafeZones;
                    this.spawnProjectile({
                        x: 0, y: 0, vx: 0, vy: 0, radius: 0, damage: 0, lifetime: 0.45, zones: zones,
                        update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                        draw(ctx) {
                            ctx.fillStyle = '#ff0000'; ctx.font = 'bold 28px Arial'; ctx.textAlign = 'center';
                            ctx.fillText('🔒 位置已锁定！即将释放！ 🔒', ctx.canvas.width / 2, 180);
                            this.zones.forEach(zone => {
                                ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 5;
                                ctx.beginPath(); ctx.arc(zone.x, zone.y, zone.radius + 10, 0, Math.PI * 2); ctx.stroke();
                            });
                        }
                    });
                }, 4550);
                // 5秒后发动（1+4）
                setTimeout(() => {
                    this.lunarExecutionWarning = false;
                    const px = this.player.x, py = this.player.y;
                    let isSafe = false;
                    for (const zone of this.lunarExecutionSafeZones) {
                        const dist = Math.sqrt((px - zone.x) ** 2 + (py - zone.y) ** 2);
                        if (dist <= zone.radius) { isSafe = true; break; }
                    }
                    if (!isSafe) {
                        this.player.takeDamage ? this.player.takeDamage(200) : (this.player.hp -= 200);
                    }
                    // 超强屏幕抖动
                    if (this.player.screenShake) { this.player.screenShake.intensity = 55; this.player.screenShake.duration = 1.3; }
                    // 全屏月光爆发
                    for (let i = 0; i < 48; i++) {
                        const a = (Math.PI * 2 / 48) * i;
                        this.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * 700, vy: Math.sin(a) * 700, radius: 35, damage: 0, lifetime: 1, color: '#ffddff', isEnemy: false });
                    }
                    // 1.55秒真空期
                    this.executionCooldown = 1.55;
                }, 5000);
                break;
                
            case 'STAR_SHOWER':
                // 星辰坠落 - 从天而降的星光箭
                for (let i = 0; i < 15; i++) {
                    setTimeout(() => {
                        const starX = this.player.x + (Math.random() - 0.5) * 400;
                        // 预警
                        this.spawnProjectile({
                            x: starX, y: this.player.y,
                            vx: 0, vy: 0,
                            radius: 25, damage: 0, lifetime: 0.4,
                            color: 'rgba(255, 255, 150, 0.3)', isEnemy: false
                        });
                        // 星光箭
                        setTimeout(() => {
                            this.spawnProjectile({
                                x: starX, y: -30,
                                vx: (Math.random() - 0.5) * 50, vy: 500,
                                radius: 12, damage: dmg * 0.7, lifetime: 1.5,
                                color: '#ffff88', isEnemy: true
                            });
                        }, 400);
                    }, i * 160);
                }
                break;
                
            case 'SHADOW_STEP':
                // 影步 - 瞬移并留下残影攻击（添加瞬移预警）
                const shadowPositions = [];
                for (let i = 0; i < 4; i++) {
                    const stepAngle = (Math.PI * 2 / 4) * i + Math.random() * 0.5;
                    const stepDist = 100 + Math.random() * 50;
                    shadowPositions.push({ x: this.player.x + Math.cos(stepAngle) * stepDist, y: this.player.y + Math.sin(stepAngle) * stepDist });
                }
                // 先显示所有瞬移位置预警（每个位置有独立的锁定时间）
                shadowPositions.forEach((pos, idx) => {
                    const totalTime = 0.35 + idx * 0.25; // 每个位置的总预警时间
                    this.spawnProjectile({
                        x: pos.x, y: pos.y, vx: 0, vy: 0, radius: 35, damage: 0, lifetime: totalTime, maxLife: totalTime,
                        color: 'rgba(170,100,200,0.4)', isEnemy: false, idx: idx,
                        update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                        draw(ctx) {
                            const pulse = Math.sin(Date.now() / 80) * 0.3 + 0.7;
                            ctx.strokeStyle = `rgba(200,100,255,${Math.min(1, this.life) * pulse})`; ctx.lineWidth = 3;
                            ctx.beginPath(); ctx.arc(this.x, this.y, 30, 0, Math.PI * 2); ctx.stroke();
                            ctx.fillStyle = `rgba(150,50,200,${Math.min(1, this.life) * 0.3})`; ctx.fill();
                            ctx.fillStyle = '#cc88ff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
                            ctx.fillText(`影步${this.idx + 1}`, this.x, this.y - 40);
                            // 释放前0.15秒显示锁定
                            if (this.life < 0.15) {
                                ctx.fillStyle = '#ff0000'; ctx.font = 'bold 12px Arial';
                                ctx.fillText('🔒', this.x, this.y - 55);
                            }
                        }
                    });
                });
                // 延迟后开始瞬移
                shadowPositions.forEach((pos, idx) => {
                    setTimeout(() => {
                        // 瞬移到位置
                        this.x = pos.x;
                        this.y = pos.y;
                        // 残影攻击
                        const attackAngle = Math.atan2(this.player.y - pos.y, this.player.x - pos.x);
                        for (let j = -1; j <= 1; j++) {
                            this.spawnProjectile({
                                x: pos.x, y: pos.y,
                                vx: Math.cos(attackAngle + j * 0.2) * 400,
                                vy: Math.sin(attackAngle + j * 0.2) * 400,
                                radius: 10, damage: dmg * 0.5, lifetime: 1,
                                color: '#aa66cc', isEnemy: true
                            });
                        }
                    }, (0.35 + idx * 0.25) * 1000); // 与预警时间同步
                });
                break;
                
            case 'MOONBEAM_SWEEP':
                // 月光束横扫 - 激光扫射
                const sweepStartAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x) - Math.PI / 4;
                for (let i = 0; i < 20; i++) {
                    setTimeout(() => {
                        const sweepAngle = sweepStartAngle + (Math.PI / 2) * (i / 20);
                        // 多段激光
                        for (let j = 0; j < 5; j++) {
                            this.spawnProjectile({
                                x: this.x + Math.cos(sweepAngle) * (50 + j * 40),
                                y: this.y + Math.sin(sweepAngle) * (50 + j * 40),
                                vx: Math.cos(sweepAngle) * 300,
                                vy: Math.sin(sweepAngle) * 300,
                                radius: 8, damage: dmg * 0.3, lifetime: 0.8,
                                color: '#ddaaff', isEnemy: true
                            });
                        }
                    }, i * 90);
                }
                break;
                
            case 'FERAL_CHARGE':
                // 野性冲锋 - 近身连续突进（添加预警+锁定）
                for (let charge = 0; charge < 5; charge++) {
                    // 每次冲锋先显示预警
                    setTimeout(() => {
                        const feralTarget = { x: this.player.x, y: this.player.y }; // 锁定目标
                        const feralStart = { x: this.x, y: this.y };
                        // 预警线
                        this.spawnProjectile({
                            x: feralStart.x, y: feralStart.y, vx: 0, vy: 0, radius: 5, damage: 0, lifetime: 0.35,
                            color: '#ff88aa', isEnemy: false, tx: feralTarget.x, ty: feralTarget.y,
                            update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) {
                                ctx.strokeStyle = `rgba(255,100,150,${this.life * 3})`; ctx.lineWidth = 2; ctx.setLineDash([6, 3]);
                                ctx.beginPath(); ctx.moveTo(feralStart.x, feralStart.y); ctx.lineTo(this.tx, this.ty); ctx.stroke();
                                ctx.setLineDash([]);
                                ctx.fillStyle = `rgba(255,80,120,${this.life * 2})`;
                                ctx.beginPath(); ctx.arc(this.tx, this.ty, 35, 0, Math.PI * 2); ctx.fill();
                                if (this.life < 0.15) {
                                    ctx.fillStyle = '#ff0000'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
                                    ctx.fillText('🔒', this.tx, this.ty - 45);
                                }
                            }
                        });
                        // 0.35秒后冲锋
                        setTimeout(() => {
                            const chargeAngle = Math.atan2(feralTarget.y - this.y, feralTarget.x - this.x);
                            this.x = feralTarget.x - Math.cos(chargeAngle) * 50;
                            this.y = feralTarget.y - Math.sin(chargeAngle) * 50;
                            // 爪击
                            for (let claw = -2; claw <= 2; claw++) {
                                this.spawnProjectile({
                                    x: this.x, y: this.y,
                                    vx: Math.cos(chargeAngle + claw * 0.3) * 300,
                                    vy: Math.sin(chargeAngle + claw * 0.3) * 300,
                                    radius: 15, damage: dmg * 0.6, lifetime: 0.5,
                                    color: '#ff88aa', isEnemy: true
                                });
                            }
                        }, 350);
                    }, charge * 500); // 增加间隔以适应预警时间
                }
                break;
                
            case 'CELESTIAL_SNIPE':
                // 天穹狙击 - 远距离高伤害精准射击
                // 蓄力预警
                const snipeAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                // 显示瞄准线
                this.spawnProjectile({
                    x: this.x, y: this.y,
                    vx: Math.cos(snipeAngle) * 900,
                    vy: Math.sin(snipeAngle) * 900,
                    radius: 3, damage: 0, lifetime: 0.8,
                    color: '#ff4444', isEnemy: false
                });
                
                // 延迟发射高伤害箭矢
                setTimeout(() => {
                    this.spawnProjectile({
                        x: this.x, y: this.y,
                        vx: Math.cos(snipeAngle) * 900,
                        vy: Math.sin(snipeAngle) * 900,
                        radius: 22, damage: dmg * 2.5, lifetime: 1.5,
                        color: '#ffaaff', isEnemy: true
                    });
                }, 600);
                break;
                
            case 'HUNTER_STORM':
                // 猎人风暴 - 全屏箭雨
                for (let wave = 0; wave < 5; wave++) {
                    setTimeout(() => {
                        for (let i = 0; i < 12; i++) {
                            const hx = Math.random() * 800 + 50;
                            this.spawnProjectile({
                                x: hx, y: -20, vx: (Math.random() - 0.5) * 80, vy: 500,
                                radius: 10, damage: dmg * 0.6, lifetime: 1.5,
                                color: '#cc88ff', isEnemy: true
                            });
                        }
                    }, wave * 250);
                }
                break;
                
            case 'DIVINE_BEAST':
                // 神兽召唤 - 召唤巨型野兽横扫
                const beastSide = Math.random() > 0.5 ? 1 : -1;
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        const startY = 150 + i * 150;
                        this.spawnProjectile({
                            x: beastSide > 0 ? -80 : 880,
                            y: startY, vx: beastSide * 450, vy: 0,
                            radius: 60, damage: dmg * 1.8, lifetime: 2.5,
                            color: '#9944aa', isEnemy: true
                        });
                    }, i * 350);
                }
                break;
                
            case 'LUNAR_RAIN':
                // 月蚀之雨 - 持续追踪弹幕
                for (let i = 0; i < 20; i++) {
                    setTimeout(() => {
                        const rainAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                        this.spawnProjectile({
                            x: this.x, y: this.y,
                            vx: Math.cos(rainAngle + (Math.random() - 0.5) * 0.5) * 400,
                            vy: Math.sin(rainAngle + (Math.random() - 0.5) * 0.5) * 400,
                            radius: 10, damage: dmg * 0.5, lifetime: 1.5,
                            color: '#aa77dd', isEnemy: true
                        });
                    }, i * 100);
                }
                break;
                
            case 'ECLIPSE_BURST':
                // 日蚀爆发 - 全屏爆炸
                const eclipseX = this.player.x, eclipseY = this.player.y;
                // 预警
                this.spawnProjectile({
                    x: eclipseX, y: eclipseY, vx: 0, vy: 0, radius: 150, damage: 0, lifetime: 1,
                    update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const p = 1 - this.life;
                        ctx.fillStyle = `rgba(200,100,255,${0.2 + p * 0.3})`;
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * (1 - p * 0.2), 0, Math.PI * 2); ctx.fill();
                        ctx.strokeStyle = '#ff88ff'; ctx.lineWidth = 4;
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke();
                    }
                });
                setTimeout(() => {
                    const dist = Math.sqrt((this.player.x - eclipseX) ** 2 + (this.player.y - eclipseY) ** 2);
                    if (dist < 160) this.player.takeDamage(dmg * 2.2);
                    // 爆炸视效
                    this.spawnProjectile({
                        x: eclipseX, y: eclipseY, vx: 0, vy: 0, radius: 160, damage: 0, lifetime: 0.4,
                        update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                        draw(ctx) {
                            ctx.fillStyle = `rgba(255,150,255,${this.life})`;
                            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
                        }
                    });
                }, 1000);
                break;
                
            case 'GODDESS_WRATH':
                // 女神之怒 - 终极连招
                // 快速连续攻击
                for (let combo = 0; combo < 6; combo++) {
                    setTimeout(() => {
                        const wrathAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                        // 扇形箭雨
                        for (let i = -4; i <= 4; i++) {
                            this.spawnProjectile({
                                x: this.x, y: this.y,
                                vx: Math.cos(wrathAngle + i * 0.15) * 500,
                                vy: Math.sin(wrathAngle + i * 0.15) * 500,
                                radius: 12, damage: dmg * 0.7, lifetime: 1.2,
                                color: '#ff99ff', isEnemy: true
                            });
                        }
                    }, combo * 180);
                }
                break;
                
            case 'STAR_MOON_DOOM':
                // 秒杀技2：星月灭世 - 全屏星月轰炸+收缩安全区
                // 第一阶段：1秒蓄力
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 60, damage: 0, lifetime: 1, maxLife: 1, boss: this,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const p = 1 - this.life / this.maxLife;
                        ctx.strokeStyle = '#ffaaff'; ctx.lineWidth = 8;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 50 + p * 50, 0, Math.PI * 2); ctx.stroke();
                        ctx.fillStyle = '#ff88ff'; ctx.font = 'bold 28px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('⚠️ 星月灭世准备中... ⚠️', this.x, this.y - 100);
                    }
                });
                // 第二阶段：收缩的安全区
                setTimeout(() => {
                    if (this.player.screenShake) { this.player.screenShake.intensity = 30; this.player.screenShake.duration = 6; }
                    const centerX = 400, centerY = 300;
                    this.spawnProjectile({
                        x: centerX, y: centerY, vx: 0, vy: 0, radius: 250, damage: 0, lifetime: 6, maxLife: 6,
                        player: this.player, boss: this, triggered: false,
                        update(dt) {
                            this.life -= dt;
                            if (this.life <= 0) {
                                this.markedForDeletion = true;
                                // 结束时超强抖动和真空期
                                if (!this.triggered) {
                                    this.triggered = true;
                                    if (this.player.screenShake) { this.player.screenShake.intensity = 65; this.player.screenShake.duration = 1.5; }
                                    this.boss.executionCooldown = 1.55;
                                }
                                return;
                            }
                            // 安全区逐渐收缩
                            this.radius = 70 + (this.life / this.maxLife) * 180;
                            // 不在安全区内持续受伤
                            const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                            if (dist > this.radius) this.player.takeDamage(this.boss.damage * 0.7 * dt);
                        },
                        draw(ctx) {
                            // 全屏危险
                            ctx.fillStyle = `rgba(100,50,150,${0.4 + Math.sin(Date.now() / 100) * 0.1})`;
                            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                            // 星星下落特效
                            const t = Date.now() / 100;
                            for (let i = 0; i < 10; i++) {
                                const sx = ((t * 30 + i * 80) % 800) + 50;
                                const sy = ((t * 50 + i * 60) % 600);
                                ctx.fillStyle = `rgba(255,200,255,0.6)`;
                                ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
                            }
                            // 安全区
                            ctx.strokeStyle = '#88ff88'; ctx.lineWidth = 6; ctx.setLineDash([10, 5]);
                            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke();
                            ctx.setLineDash([]);
                            ctx.fillStyle = `rgba(100,255,150,${0.2 + Math.sin(Date.now() / 80) * 0.1})`; ctx.fill();
                            // 警告
                            ctx.fillStyle = '#ffaaff'; ctx.font = 'bold 32px Arial'; ctx.textAlign = 'center';
                            ctx.fillText('☠️ 星月灭世 - 留在收缩的安全区！ ☠️', ctx.canvas.width / 2, 70);
                            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 26px Arial';
                            ctx.fillText(`${Math.ceil(this.life)}秒`, ctx.canvas.width / 2, 110);
                            ctx.fillText(`安全区半径: ${Math.round(this.radius)}`, ctx.canvas.width / 2, 145);
                            if (this.life < 0.45) {
                                ctx.fillStyle = '#ff0000'; ctx.font = 'bold 24px Arial';
                                ctx.fillText('🔒 最终位置！', this.x, this.y - this.radius - 20);
                            }
                        }
                    });
                }, 1000);
                break;
                
            case 'LUNAR_SHIELD':
                // 月神护盾 - 近身防御高伤爆炸（带预警）
                // 第一阶段：1.2秒预警
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 150, damage: 0, lifetime: 1.2, maxLife: 1.2, boss: this,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const p = 1 - this.life / this.maxLife;
                        // 危险区域闪烁
                        ctx.fillStyle = `rgba(255,100,255,${0.15 + Math.sin(Date.now() / 50) * 0.1})`;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 150, 0, Math.PI * 2); ctx.fill();
                        // 收缩的警告圈
                        ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 4; ctx.setLineDash([10, 5]);
                        ctx.beginPath(); ctx.arc(this.x, this.y, 150 - p * 100, 0, Math.PI * 2); ctx.stroke();
                        ctx.setLineDash([]);
                        // 能量聚集效果
                        for (let i = 0; i < 8; i++) {
                            const a = (Math.PI * 2 / 8) * i + Date.now() / 200;
                            const dist = 150 - p * 120;
                            ctx.fillStyle = `rgba(255,150,255,${p * 0.8})`;
                            ctx.beginPath(); ctx.arc(this.x + Math.cos(a) * dist, this.y + Math.sin(a) * dist, 8, 0, Math.PI * 2); ctx.fill();
                        }
                        // 警告文字
                        ctx.fillStyle = '#ff00ff'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('⚠️ 月神护盾蓄力中！远离Boss！ ⚠️', this.x, this.y - 170);
                        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px Arial';
                        ctx.fillText(`${this.life.toFixed(1)}秒`, this.x, this.y - 145);
                    }
                });
                // 第二阶段：爆炸
                setTimeout(() => {
                    // 屏幕抖动
                    if (this.player.screenShake) { this.player.screenShake.intensity = 35; this.player.screenShake.duration = 0.8; }
                    // 检测近身伤害
                    const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                    if (dist < 150) {
                        const damage = Math.round(dmg * 2.5); // 高伤害
                        this.player.takeDamage ? this.player.takeDamage(damage) : (this.player.hp -= damage);
                    }
                    // 爆炸特效
                    for (let ring = 0; ring < 3; ring++) {
                        this.spawnProjectile({
                            x: this.x, y: this.y, vx: 0, vy: 0, radius: 0, maxRadius: 180, damage: 0, lifetime: 0.5, maxLife: 0.5, ring: ring,
                            update(dt) { this.radius = this.maxRadius * (1 - this.life / this.maxLife); this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) { 
                                ctx.strokeStyle = `rgba(255,100,255,${this.life / this.maxLife})`; 
                                ctx.lineWidth = 12 - this.ring * 3;
                                ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke();
                            }
                        });
                    }
                    // 向外散射弹幕
                    for (let i = 0; i < 16; i++) {
                        const a = (Math.PI * 2 / 16) * i;
                        this.spawnProjectile({
                            x: this.x, y: this.y, vx: Math.cos(a) * 400, vy: Math.sin(a) * 400,
                            radius: 12, damage: dmg * 0.6, lifetime: 1.2, color: '#ff88ff', isEnemy: true
                        });
                    }
                }, 1200);
                break;
                
            case 'CRESCENT_BURST':
                // 新月爆裂 - 快速近身反击
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 120, damage: 0, lifetime: 0.8, maxLife: 0.8, boss: this,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const p = 1 - this.life / this.maxLife;
                        ctx.fillStyle = `rgba(200,180,255,${0.2 + Math.sin(Date.now() / 40) * 0.1})`;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 120, 0, Math.PI * 2); ctx.fill();
                        // 新月形状预警
                        for (let i = 0; i < 4; i++) {
                            const a = (Math.PI / 2) * i + Date.now() / 150;
                            ctx.strokeStyle = '#ccaaff'; ctx.lineWidth = 3;
                            ctx.beginPath(); ctx.arc(this.x + Math.cos(a) * 60, this.y + Math.sin(a) * 60, 30, a - 1, a + 1); ctx.stroke();
                        }
                        ctx.fillStyle = '#ccaaff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('⚠️ 新月爆裂！ ⚠️', this.x, this.y - 140);
                    }
                });
                setTimeout(() => {
                    if (this.player.screenShake) { this.player.screenShake.intensity = 25; this.player.screenShake.duration = 0.5; }
                    const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                    if (dist < 120) this.player.takeDamage ? this.player.takeDamage(dmg * 2) : (this.player.hp -= dmg * 2);
                    // 4道新月斩
                    for (let i = 0; i < 4; i++) {
                        const a = (Math.PI / 2) * i;
                        this.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * 350, vy: Math.sin(a) * 350, radius: 18, damage: dmg * 0.7, lifetime: 1, color: '#ccaaff', isEnemy: true });
                    }
                }, 800);
                break;
                
            case 'MOON_REPEL':
                // 月之斥力 - 击退型防御
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 100, damage: 0, lifetime: 1.0, maxLife: 1.0, boss: this,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const p = 1 - this.life / this.maxLife;
                        ctx.strokeStyle = `rgba(100,200,255,${0.6 + Math.sin(Date.now() / 60) * 0.2})`;
                        ctx.lineWidth = 8; ctx.setLineDash([15, 8]);
                        ctx.beginPath(); ctx.arc(this.x, this.y, 100 - p * 50, 0, Math.PI * 2); ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.fillStyle = '#66ccff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('⚠️ 月之斥力！ ⚠️', this.x, this.y - 120);
                    }
                });
                setTimeout(() => {
                    if (this.player.screenShake) { this.player.screenShake.intensity = 30; this.player.screenShake.duration = 0.6; }
                    const dx = this.player.x - this.x, dy = this.player.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        this.player.takeDamage ? this.player.takeDamage(dmg * 1.5) : (this.player.hp -= dmg * 1.5);
                        // 击退玩家
                        const angle = Math.atan2(dy, dx);
                        this.player.x += Math.cos(angle) * 150;
                        this.player.y += Math.sin(angle) * 150;
                    }
                    // 扩散波
                    for (let ring = 0; ring < 2; ring++) {
                        this.spawnProjectile({
                            x: this.x, y: this.y, vx: 0, vy: 0, radius: 0, maxRadius: 200, damage: 0, lifetime: 0.4, maxLife: 0.4, ring: ring,
                            update(dt) { this.radius = this.maxRadius * (1 - this.life / this.maxLife); this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) { ctx.strokeStyle = `rgba(100,200,255,${this.life / this.maxLife})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke(); }
                        });
                    }
                }, 1000);
                break;
                
            case 'ARTEMIS_BARRIER':
                // 阿尔忒弥斯屏障 - 旋转刃防御
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 130, damage: 0, lifetime: 1.5, maxLife: 1.5, boss: this, bladeAngle: 0,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.bladeAngle += dt * 4; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        ctx.fillStyle = `rgba(255,150,200,${0.15 + Math.sin(Date.now() / 50) * 0.08})`;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 130, 0, Math.PI * 2); ctx.fill();
                        // 旋转刀刃
                        for (let i = 0; i < 6; i++) {
                            const a = (Math.PI * 2 / 6) * i + this.bladeAngle;
                            ctx.save(); ctx.translate(this.x + Math.cos(a) * 90, this.y + Math.sin(a) * 90); ctx.rotate(a);
                            ctx.fillStyle = '#ff88cc'; ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(-10, -8); ctx.lineTo(-10, 8); ctx.closePath(); ctx.fill();
                            ctx.restore();
                        }
                        ctx.fillStyle = '#ff88cc'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('⚠️ 女神屏障！ ⚠️', this.x, this.y - 150);
                    }
                });
                setTimeout(() => {
                    if (this.player.screenShake) { this.player.screenShake.intensity = 28; this.player.screenShake.duration = 0.7; }
                    const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                    if (dist < 130) this.player.takeDamage ? this.player.takeDamage(dmg * 2.2) : (this.player.hp -= dmg * 2.2);
                    // 6道飞刃
                    for (let i = 0; i < 6; i++) {
                        const a = (Math.PI * 2 / 6) * i;
                        this.spawnProjectile({ x: this.x + Math.cos(a) * 90, y: this.y + Math.sin(a) * 90, vx: Math.cos(a) * 400, vy: Math.sin(a) * 400, radius: 14, damage: dmg * 0.8, lifetime: 1.2, color: '#ff88cc', isEnemy: true });
                    }
                }, 1500);
                break;
                
            case 'SILVER_NOVA':
                // 银光新星 - 超大范围爆炸
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 180, damage: 0, lifetime: 1.8, maxLife: 1.8, boss: this,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const p = 1 - this.life / this.maxLife;
                        ctx.fillStyle = `rgba(220,220,255,${0.1 + p * 0.2})`;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 180, 0, Math.PI * 2); ctx.fill();
                        // 收缩光环
                        ctx.strokeStyle = '#ddddff'; ctx.lineWidth = 5;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 180 - p * 150, 0, Math.PI * 2); ctx.stroke();
                        // 聚集粒子
                        for (let i = 0; i < 12; i++) {
                            const a = (Math.PI * 2 / 12) * i + Date.now() / 300;
                            const d = 180 - p * 160;
                            ctx.fillStyle = `rgba(255,255,255,${p})`;
                            ctx.beginPath(); ctx.arc(this.x + Math.cos(a) * d, this.y + Math.sin(a) * d, 5 + p * 5, 0, Math.PI * 2); ctx.fill();
                        }
                        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('☀️ 银光新星蓄力中！ ☀️', this.x, this.y - 200);
                        ctx.font = 'bold 18px Arial'; ctx.fillText(`${this.life.toFixed(1)}秒`, this.x, this.y - 175);
                    }
                });
                setTimeout(() => {
                    if (this.player.screenShake) { this.player.screenShake.intensity = 45; this.player.screenShake.duration = 1.0; }
                    const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                    if (dist < 180) this.player.takeDamage ? this.player.takeDamage(dmg * 3) : (this.player.hp -= dmg * 3);
                    // 爆炸波纹
                    for (let ring = 0; ring < 4; ring++) {
                        setTimeout(() => {
                            this.spawnProjectile({
                                x: this.x, y: this.y, vx: 0, vy: 0, radius: 0, maxRadius: 250, damage: 0, lifetime: 0.5, maxLife: 0.5,
                                update(dt) { this.radius = this.maxRadius * (1 - this.life / this.maxLife); this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                                draw(ctx) { ctx.strokeStyle = `rgba(255,255,255,${this.life / this.maxLife})`; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke(); }
                            });
                        }, ring * 100);
                    }
                }, 1800);
                break;
                
            case 'HUNT_COUNTER':
                // 猎人反击 - 快速近战连击
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 100, damage: 0, lifetime: 0.6, maxLife: 0.6, boss: this,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        ctx.strokeStyle = `rgba(255,100,100,${0.8})`;
                        ctx.lineWidth = 4; ctx.setLineDash([8, 4]);
                        ctx.beginPath(); ctx.arc(this.x, this.y, 100, 0, Math.PI * 2); ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.fillStyle = '#ff6666'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('⚡ 猎人反击！ ⚡', this.x, this.y - 120);
                    }
                });
                setTimeout(() => {
                    if (this.player.screenShake) { this.player.screenShake.intensity = 20; this.player.screenShake.duration = 0.4; }
                    const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                    if (dist < 100) this.player.takeDamage ? this.player.takeDamage(dmg * 1.8) : (this.player.hp -= dmg * 1.8);
                    // 3次快速斩击
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            const a = Math.atan2(this.player.y - this.y, this.player.x - this.x) + (i - 1) * 0.4;
                            for (let j = -1; j <= 1; j++) {
                                this.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a + j * 0.2) * 500, vy: Math.sin(a + j * 0.2) * 500, radius: 10, damage: dmg * 0.5, lifetime: 0.8, color: '#ff6666', isEnemy: true });
                            }
                        }, i * 150);
                    }
                }, 600);
                break;
                
            case 'MOONFALL_SLAM':
                // 月陨冲击 - 跳跃砸地
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 140, damage: 0, lifetime: 1.3, maxLife: 1.3, boss: this, targetX: this.player.x, targetY: this.player.y,
                    update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const p = 1 - this.life / this.maxLife;
                        // 落点预警
                        ctx.fillStyle = `rgba(200,100,255,${0.15 + p * 0.2})`;
                        ctx.beginPath(); ctx.arc(this.targetX, this.targetY, 140 - p * 40, 0, Math.PI * 2); ctx.fill();
                        ctx.strokeStyle = '#cc66ff'; ctx.lineWidth = 4; ctx.setLineDash([12, 6]);
                        ctx.beginPath(); ctx.arc(this.targetX, this.targetY, 140, 0, Math.PI * 2); ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.fillStyle = '#cc66ff'; ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('💥 月陨冲击！ 💥', this.targetX, this.targetY - 160);
                    }
                });
                const slamTarget = { x: this.player.x, y: this.player.y };
                setTimeout(() => {
                    this.x = slamTarget.x; this.y = slamTarget.y;
                    if (this.player.screenShake) { this.player.screenShake.intensity = 40; this.player.screenShake.duration = 0.9; }
                    const dist = Math.sqrt((this.player.x - slamTarget.x) ** 2 + (this.player.y - slamTarget.y) ** 2);
                    if (dist < 140) this.player.takeDamage ? this.player.takeDamage(dmg * 2.5) : (this.player.hp -= dmg * 2.5);
                    // 冲击波
                    for (let i = 0; i < 12; i++) {
                        const a = (Math.PI * 2 / 12) * i;
                        this.spawnProjectile({ x: slamTarget.x, y: slamTarget.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, radius: 15, damage: dmg * 0.6, lifetime: 1, color: '#cc66ff', isEnemy: true });
                    }
                }, 1300);
                break;
                
            case 'STARLIGHT_BURST':
                // 星光迸发 - 多段小范围爆炸
                for (let burst = 0; burst < 5; burst++) {
                    setTimeout(() => {
                        this.spawnProjectile({
                            x: this.x, y: this.y, vx: 0, vy: 0, radius: 80, damage: 0, lifetime: 0.5, maxLife: 0.5, boss: this,
                            update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) {
                                const p = 1 - this.life / this.maxLife;
                                ctx.fillStyle = `rgba(255,255,150,${0.3 - p * 0.2})`;
                                ctx.beginPath(); ctx.arc(this.x, this.y, 80, 0, Math.PI * 2); ctx.fill();
                                ctx.strokeStyle = '#ffff88'; ctx.lineWidth = 3;
                                ctx.beginPath(); ctx.arc(this.x, this.y, 80 - p * 60, 0, Math.PI * 2); ctx.stroke();
                            }
                        });
                        setTimeout(() => {
                            if (this.player.screenShake) { this.player.screenShake.intensity = 15; this.player.screenShake.duration = 0.3; }
                            const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                            if (dist < 80) this.player.takeDamage ? this.player.takeDamage(dmg * 1.2) : (this.player.hp -= dmg * 1.2);
                            // 星光散射
                            for (let i = 0; i < 8; i++) {
                                const a = (Math.PI * 2 / 8) * i + burst * 0.3;
                                this.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * 350, vy: Math.sin(a) * 350, radius: 8, damage: dmg * 0.4, lifetime: 0.8, color: '#ffff88', isEnemy: true });
                            }
                        }, 500);
                    }, burst * 600);
                }
                break;
                
            case 'DIVINE_REPULSE':
                // 神圣斥退 - 终极近身防御
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 200, damage: 0, lifetime: 2.0, maxLife: 2.0, boss: this, pulsePhase: 0,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.pulsePhase += dt * 3; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const p = 1 - this.life / this.maxLife;
                        const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
                        // 多层光环
                        for (let r = 0; r < 3; r++) {
                            ctx.strokeStyle = `rgba(255,200,255,${pulse * (0.6 - r * 0.15)})`;
                            ctx.lineWidth = 6 - r * 1.5;
                            ctx.beginPath(); ctx.arc(this.x, this.y, 200 - r * 40 - p * 80, 0, Math.PI * 2); ctx.stroke();
                        }
                        ctx.fillStyle = `rgba(255,180,255,${0.1 + p * 0.15})`;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 200, 0, Math.PI * 2); ctx.fill();
                        // 能量粒子
                        for (let i = 0; i < 16; i++) {
                            const a = (Math.PI * 2 / 16) * i + Date.now() / 400;
                            const d = 200 - p * 180;
                            ctx.fillStyle = `rgba(255,255,255,${p * pulse})`;
                            ctx.beginPath(); ctx.arc(this.x + Math.cos(a) * d, this.y + Math.sin(a) * d, 4 + p * 6, 0, Math.PI * 2); ctx.fill();
                        }
                        ctx.fillStyle = '#ffccff'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('✨ 神圣斥退！远离女神！ ✨', this.x, this.y - 220);
                        ctx.font = 'bold 20px Arial'; ctx.fillText(`${this.life.toFixed(1)}秒`, this.x, this.y - 195);
                    }
                });
                setTimeout(() => {
                    if (this.player.screenShake) { this.player.screenShake.intensity = 55; this.player.screenShake.duration = 1.2; }
                    const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                    if (dist < 200) {
                        this.player.takeDamage ? this.player.takeDamage(dmg * 3.5) : (this.player.hp -= dmg * 3.5);
                        // 强力击退
                        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                        this.player.x += Math.cos(angle) * 250;
                        this.player.y += Math.sin(angle) * 250;
                    }
                    // 全方位弹幕
                    for (let wave = 0; wave < 3; wave++) {
                        setTimeout(() => {
                            for (let i = 0; i < 24; i++) {
                                const a = (Math.PI * 2 / 24) * i + wave * 0.13;
                                this.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * (350 + wave * 50), vy: Math.sin(a) * (350 + wave * 50), radius: 10, damage: dmg * 0.5, lifetime: 1.5, color: '#ffccff', isEnemy: true });
                            }
                        }, wave * 200);
                    }
                }, 2000);
                break;
        }
    }
    
    draw(ctx) {
        const breathe = this.breathe;
        const r = this.phase >= 2, f = this.phase === 3, g = this.moonGlow, b = breathe;
        
        // 月光光环
        ctx.save();
        ctx.globalAlpha = 0.4;
        const aura = ctx.createRadialGradient(this.x, this.y, 20, this.x, this.y, 110);
        aura.addColorStop(0, f ? 'rgba(255,180,255,0.5)' : r ? 'rgba(200,150,255,0.4)' : 'rgba(150,130,200,0.3)');
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.beginPath(); ctx.arc(this.x, this.y, 110, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        
        // 星尘轨迹
        ctx.strokeStyle = f ? 'rgba(255,200,255,0.5)' : 'rgba(200,180,255,0.3)';
        ctx.lineWidth = 2;
        const st = Date.now() / 1000;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 45 + i * 22 + (st * 25 % 22), 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 披风
        ctx.fillStyle = f ? '#7755aa' : r ? '#5544aa' : '#443388';
        ctx.beginPath();
        ctx.moveTo(this.x - 38, this.y - 15 + b);
        ctx.quadraticCurveTo(this.x - 50, this.y + 35 + b, this.x - 32, this.y + 65 + b);
        ctx.lineTo(this.x + 32, this.y + 65 + b);
        ctx.quadraticCurveTo(this.x + 50, this.y + 35 + b, this.x + 38, this.y - 15 + b);
        ctx.closePath(); ctx.fill();
        
        // 身体护甲
        const body = ctx.createLinearGradient(this.x, this.y - 35, this.x, this.y + 45);
        body.addColorStop(0, f ? '#aa88cc' : r ? '#9977bb' : '#8866aa');
        body.addColorStop(0.5, f ? '#886699' : r ? '#775588' : '#664477');
        body.addColorStop(1, f ? '#664477' : r ? '#553366' : '#442255');
        ctx.fillStyle = body;
        ctx.beginPath(); ctx.ellipse(this.x, this.y + 5 + b, 32, 42, 0, 0, Math.PI * 2); ctx.fill();
        
        // 护甲纹路
        ctx.strokeStyle = f ? '#ddaaee' : '#bb99dd';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(this.x, this.y - 25 + b); ctx.lineTo(this.x, this.y + 35 + b); ctx.stroke();
        ctx.beginPath(); ctx.arc(this.x, this.y + 5 + b, 20, 0.2, Math.PI - 0.2); ctx.stroke();
        
        // 肩甲
        ctx.fillStyle = f ? '#bb99dd' : r ? '#aa88cc' : '#9977bb';
        ctx.beginPath(); ctx.ellipse(this.x - 38, this.y - 12 + b, 14, 20, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(this.x + 38, this.y - 12 + b, 14, 20, 0.4, 0, Math.PI * 2); ctx.fill();
        
        // 头部
        const head = ctx.createRadialGradient(this.x, this.y - 48 + b, 5, this.x, this.y - 48 + b, 28);
        head.addColorStop(0, f ? '#eeddff' : r ? '#ddccee' : '#ccbbdd');
        head.addColorStop(1, f ? '#aa88bb' : r ? '#9977aa' : '#886699');
        ctx.fillStyle = head;
        ctx.beginPath(); ctx.arc(this.x, this.y - 48 + b, 26, 0, Math.PI * 2); ctx.fill();
        
        // 月冠
        ctx.fillStyle = f ? '#ffddff' : '#eeccff';
        ctx.shadowColor = '#ffaaff';
        ctx.shadowBlur = 8 + g * 10;
        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y - 68 + b); ctx.lineTo(this.x - 12, this.y - 85 + b);
        ctx.lineTo(this.x, this.y - 75 + b); ctx.lineTo(this.x + 12, this.y - 85 + b);
        ctx.lineTo(this.x + 20, this.y - 68 + b); ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
        
        // 长发
        ctx.fillStyle = f ? '#ccaadd' : r ? '#bb99cc' : '#aa88bb';
        ctx.beginPath();
        ctx.moveTo(this.x - 22, this.y - 55 + b);
        ctx.quadraticCurveTo(this.x - 32, this.y - 20 + b, this.x - 28, this.y + 15 + b);
        ctx.lineTo(this.x - 12, this.y - 30 + b); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 22, this.y - 55 + b);
        ctx.quadraticCurveTo(this.x + 32, this.y - 20 + b, this.x + 28, this.y + 15 + b);
        ctx.lineTo(this.x + 12, this.y - 30 + b); ctx.closePath(); ctx.fill();
        
        // 眼睛
        ctx.fillStyle = f ? '#ff88ff' : r ? '#dd66dd' : '#cc99dd';
        ctx.shadowColor = f ? '#ff44ff' : '#cc66cc';
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.ellipse(this.x - 9, this.y - 50 + b, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(this.x + 9, this.y - 50 + b, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        
        // 银弓
        const bx = this.x - 50, by = this.y - 5 + b;
        ctx.strokeStyle = f ? '#ffddff' : '#ddccee';
        ctx.lineWidth = 4;
        ctx.shadowColor = f ? '#ffaaff' : '#cc88dd';
        ctx.shadowBlur = 8 + this.bowCharge * 15;
        ctx.beginPath(); ctx.arc(bx, by, 32, Math.PI * 0.35, Math.PI * 1.65); ctx.stroke();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + 26, by - 18); ctx.lineTo(bx + 26 - this.bowCharge * 12, by); ctx.lineTo(bx + 26, by + 18);
        ctx.stroke();
        if (this.bowCharge > 0.3) {
            ctx.fillStyle = `rgba(255,220,255,${this.bowCharge})`;
            ctx.beginPath();
            ctx.moveTo(bx + 12 - this.bowCharge * 12, by);
            ctx.lineTo(bx + 38, by - 2); ctx.lineTo(bx + 38, by + 2); ctx.closePath(); ctx.fill();
        }
        ctx.shadowBlur = 0;
        
        // 技能预警
        if (this.state === 'TELEGRAPH') {
            ctx.save();
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 80) * 0.3;
            ctx.strokeStyle = '#ffaaff';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);
            
            switch (this.currentSkill) {
                case 'HUNTER_DASH':
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.dashTarget.x, this.dashTarget.y);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(this.dashTarget.x, this.dashTarget.y, 40, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'SILVER_RAIN':
                case 'MOONLIGHT_BARRAGE':
                    ctx.beginPath();
                    ctx.arc(this.arrowRainCenter.x, this.arrowRainCenter.y, 120, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'BEAST_TRAP':
                    this.trapPositions.forEach(pos => {
                        ctx.beginPath();
                        ctx.arc(pos.x, pos.y, 40, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                    break;
                case 'GODDESS_DOMAIN':
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 180, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'CRESCENT_SLASH':
                    // 近身技预警：显示冲刺路径和攻击范围
                    ctx.strokeStyle = '#ff88ff';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.dashTarget.x, this.dashTarget.y);
                    ctx.stroke();
                    
                    // 月牙攻击范围
                    ctx.beginPath();
                    ctx.arc(this.dashTarget.x, this.dashTarget.y, 80, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    ctx.fillStyle = '#ff88ff';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText('⚔️ 近身斩击!', this.dashTarget.x, this.dashTarget.y - 100);
                    break;
                case 'LUNAR_EXECUTION':
                    // 秒杀技预警：全屏紫色警告 + 安全区（阴影）
                    ctx.restore();
                    ctx.save();
                    
                    // 全屏紫色月光危险区
                    ctx.fillStyle = `rgba(200, 100, 255, ${0.25 + Math.sin(Date.now() / 100) * 0.15})`;
                    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                    
                    // 安全区（阴影区）- 深色圆圈
                    this.lunarExecutionSafeZones.forEach((zone, i) => {
                        // 安全区边框
                        ctx.strokeStyle = '#333';
                        ctx.lineWidth = 4;
                        ctx.setLineDash([12, 8]);
                        ctx.beginPath();
                        ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        // 安全区内部（阴影）
                        ctx.fillStyle = `rgba(30, 30, 50, ${0.6 + Math.sin(Date.now() / 150) * 0.2})`;
                        ctx.beginPath();
                        ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // 安全区标记
                        ctx.fillStyle = '#aaaaaa';
                        ctx.font = 'bold 14px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('阴影区', zone.x, zone.y + 5);
                    });
                    
                    // 警告文字
                    ctx.fillStyle = '#ff66ff';
                    ctx.font = 'bold 36px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('⚠️ 月神处刑 - 躲入阴影！ ⚠️', ctx.canvas.width / 2, 80);
                    
                    ctx.fillStyle = '#888';
                    ctx.font = 'bold 20px Arial';
                    ctx.fillText('↓ 阴影区可躲避 ↓', ctx.canvas.width / 2, 120);
                    break;
            }
            ctx.restore();
        }
        
        // 血条
        const hpPercent = this.hp / this.maxHp;
        const barWidth = 140;
        const barX = this.x - barWidth / 2;
        const barY = this.y - 110 + b;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, 12);
        
        const hpGrad = ctx.createLinearGradient(barX, barY, barX + barWidth * hpPercent, barY);
        hpGrad.addColorStop(0, f ? '#ff88ff' : (r ? '#cc66cc' : '#aa44aa'));
        hpGrad.addColorStop(1, f ? '#cc44cc' : (r ? '#aa44aa' : '#882288'));
        ctx.fillStyle = hpGrad;
        ctx.fillRect(barX, barY, barWidth * hpPercent, 12);
        
        ctx.strokeStyle = f ? '#ffaaff' : '#cc88cc';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, 12);
        
        // Boss名字
        ctx.fillStyle = f ? '#ffccff' : '#cc99cc';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x, barY - 5);
        
        // 阶段指示
        if (this.phase > 1) {
            ctx.fillStyle = f ? '#ff44ff' : '#aa44aa';
            ctx.font = '10px Arial';
            ctx.fillText(f ? '【绝境】' : '【狂暴】', this.x, barY - 18);
        }
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
