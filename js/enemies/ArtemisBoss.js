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
        
        // 基础属性 (Lv6的1.4倍)
        this.maxHp = Math.round(2860 * 1.4); // 4004
        this.hp = this.maxHp;
        this.radius = 55;
        this.color = '#aa44aa';
        this.damage = Math.round(58 * 1.4); // 81
        
        // 战斗属性
        this.telegraphDuration = 0.5; // 更快
        this.attackCooldown = 0.8;
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
        
        // 一阶段技能
        this.skills = [
            'TRIPLE_ARROW',      // 三连箭
            'MOON_SHOT',         // 月光箭
            'HUNTER_DASH',       // 猎手冲刺
            'BEAST_TRAP',        // 野兽陷阱
            'SILVER_RAIN',       // 银箭雨
            'LUNAR_STRIKE',      // 月神打击
            'WILD_HUNT'          // 狩猎本能
        ];
        
        // 二阶段技能
        this.phase2Skills = [
            ...this.skills,
            'MOONLIGHT_BARRAGE', // 月光弹幕
            'TWIN_MOONS',        // 双月连环
            'ARTEMIS_WRATH',     // 阿尔忒弥斯之怒
            'PHANTOM_WOLVES',    // 幻影狼群
            'GODDESS_DOMAIN'     // 女神领域
        ];
        
        // 三阶段技能（血量低于25%）
        this.phase3Skills = [
            ...this.phase2Skills,
            'OLYMPUS_JUDGMENT',  // 奥林匹斯审判
            'ETERNAL_HUNT',      // 永恒狩猎
            'CRESCENT_SLASH',    // 近身技：月牙斩
            'LUNAR_EXECUTION',   // 秒杀技：月神处刑
            // 新增5个技能
            'STAR_SHOWER',       // 星辰坠落：从天而降的星光箭
            'SHADOW_STEP',       // 影步：瞬移并留下残影攻击
            'MOONBEAM_SWEEP',    // 月光束横扫：激光扫射
            'FERAL_CHARGE',      // 野性冲锋：近身连续突进
            'CELESTIAL_SNIPE'    // 天穹狙击：远距离高伤害精准射击
        ];
        
        // 视觉效果
        this.breathe = 0;
        this.moonGlow = 0;
        this.bowCharge = 0;
        
        // 秒杀技状态
        this.lunarExecutionWarning = false;
        this.lunarExecutionSafeZones = [];
        
        // 近身攻击范围
        this.meleeRange = 100;
    }
    
    update(deltaTime) {
        this.breathe = Math.sin(Date.now() / 400) * 2;
        this.moonGlow = (Math.sin(Date.now() / 250) + 1) * 0.5;
        
        // 三相位切换
        if (this.hp <= this.maxHp * 0.25 && this.phase < 3) {
            this.phase = 3;
            this.attackCooldown = 0.5;
            this.telegraphDuration = 0.4;
            console.log('阿尔忒弥斯进入绝境阶段！');
        } else if (this.hp <= this.maxHp * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.attackCooldown = 0.6;
            console.log('阿尔忒弥斯进入狂暴阶段！');
        }
        
        // 状态机
        if (this.state === 'IDLE') {
            const dx = this.player.x - this.x;
            const dy = this.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // 保持距离的AI - 远程Boss
            const optimalDist = 250;
            const spd = this.phase === 3 ? 120 : (this.phase === 2 ? 100 : 80);
            
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
                // 三连箭 - 快速三发
                const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        const a = angle + (Math.random() - 0.5) * 0.1;
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y,
                            vx: Math.cos(a) * 500, vy: Math.sin(a) * 500,
                            radius: 8, damage: dmg * 0.5, lifetime: 1.5,
                            color: '#cc88ff', isEnemy: true
                        });
                    }, i * 130);
                }
                break;
                
            case 'MOON_SHOT':
                // 月光箭 - 穿透高伤
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.moonBeamAngle) * 600,
                    vy: Math.sin(this.moonBeamAngle) * 600,
                    radius: 15, damage: dmg * 1.2, lifetime: 2,
                    color: '#eeeeff', isEnemy: true, isPierce: true
                });
                break;
                
            case 'HUNTER_DASH':
                // 猎手冲刺 - 高速穿刺
                const dashAngle = Math.atan2(this.dashTarget.y - this.y, this.dashTarget.x - this.x);
                // 留下残影攻击
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        const progress = i / 5;
                        const px = this.x + (this.dashTarget.x - this.x) * progress;
                        const py = this.y + (this.dashTarget.y - this.y) * progress;
                        this.combatSystem.spawnProjectile({
                            x: px, y: py,
                            vx: 0, vy: 0,
                            radius: 25, damage: dmg * 0.4, lifetime: 0.3,
                            color: 'rgba(200, 150, 255, 0.5)', isEnemy: true
                        });
                    }, i * 70);
                }
                // 冲刺到目标
                setTimeout(() => {
                    this.x = this.dashTarget.x - Math.cos(dashAngle) * 100;
                    this.y = this.dashTarget.y - Math.sin(dashAngle) * 100;
                }, 200);
                break;
                
            case 'BEAST_TRAP':
                // 野兽陷阱
                this.trapPositions.forEach((pos, idx) => {
                    setTimeout(() => {
                        this.combatSystem.spawnProjectile({
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
                // 银箭雨
                for (let i = 0; i < 15; i++) {
                    setTimeout(() => {
                        const rx = this.arrowRainCenter.x + (Math.random() - 0.5) * 200;
                        const ry = this.arrowRainCenter.y + (Math.random() - 0.5) * 200;
                        this.combatSystem.spawnProjectile({
                            x: rx, y: ry - 300,
                            vx: 0, vy: 500,
                            radius: 6, damage: dmg * 0.4, lifetime: 1.5,
                            color: '#ddddff', isEnemy: true
                        });
                    }, i * 90);
                }
                break;
                
            case 'LUNAR_STRIKE':
                // 月神打击 - 扇形月光
                for (let i = -5; i <= 5; i++) {
                    const a = this.moonBeamAngle + i * 0.12;
                    this.combatSystem.spawnProjectile({
                        x: this.x, y: this.y,
                        vx: Math.cos(a) * 350, vy: Math.sin(a) * 350,
                        radius: 12, damage: dmg * 0.6, lifetime: 1.2,
                        color: '#aabbff', isEnemy: true
                    });
                }
                break;
                
            case 'WILD_HUNT':
                // 狩猎本能 - 多方向追踪箭
                this.huntTargets.forEach((target, idx) => {
                    setTimeout(() => {
                        const a = Math.atan2(this.player.y - target.y, this.player.x - target.x);
                        this.combatSystem.spawnProjectile({
                            x: target.x, y: target.y,
                            vx: Math.cos(a) * 400, vy: Math.sin(a) * 400,
                            radius: 10, damage: dmg * 0.7, lifetime: 1.5,
                            color: '#ff88cc', isEnemy: true
                        });
                    }, idx * 150);
                });
                break;
                
            case 'MOONLIGHT_BARRAGE':
                // 月光弹幕 - 密集箭雨
                for (let i = 0; i < 24; i++) {
                    setTimeout(() => {
                        const rx = this.arrowRainCenter.x + (Math.random() - 0.5) * 350;
                        const ry = this.arrowRainCenter.y + (Math.random() - 0.5) * 350;
                        this.combatSystem.spawnProjectile({
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
                            this.combatSystem.spawnProjectile({
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
                            this.combatSystem.spawnProjectile({
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
                        this.combatSystem.spawnProjectile(wolf);
                    }, idx * 200);
                });
                break;
                
            case 'GODDESS_DOMAIN':
                // 女神领域 - 持续月光场
                this.combatSystem.spawnProjectile({
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
                        this.combatSystem.spawnProjectile({
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
                        this.combatSystem.spawnProjectile({
                            x: rx, y: ry,
                            vx: 0, vy: 0,
                            radius: 50, damage: 0, lifetime: 0.5,
                            color: 'rgba(255, 255, 200, 0.3)', isEnemy: false
                        });
                        // 延迟爆发
                        setTimeout(() => {
                            this.combatSystem.spawnProjectile({
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
                            this.combatSystem.spawnProjectile({
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
                    this.combatSystem.spawnProjectile({
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
                // 秒杀技：月神处刑 - 全屏月光，只有阴影区可躲避
                this.lunarExecutionWarning = true;
                
                // 生成3个安全区（阴影区）
                this.lunarExecutionSafeZones = [];
                for (let i = 0; i < 3; i++) {
                    const angle = (Math.PI * 2 / 3) * i + Math.random() * 0.5;
                    const dist = 180 + Math.random() * 100;
                    this.lunarExecutionSafeZones.push({
                        x: this.x + Math.cos(angle) * dist,
                        y: this.y + Math.sin(angle) * dist,
                        radius: 80
                    });
                }
                
                // 3秒预警后发动
                setTimeout(() => {
                    this.lunarExecutionWarning = false;
                    
                    // 检查玩家是否在任一安全区
                    const px = this.player.x;
                    const py = this.player.y;
                    let isSafe = false;
                    
                    for (const zone of this.lunarExecutionSafeZones) {
                        const dist = Math.sqrt((px - zone.x) ** 2 + (py - zone.y) ** 2);
                        if (dist <= zone.radius) {
                            isSafe = true;
                            break;
                        }
                    }
                    
                    if (!isSafe) {
                        // 不在安全区，造成巨额伤害
                        this.player.hp -= 999;
                    }
                    
                    // 全屏月光特效
                    for (let i = 0; i < 24; i++) {
                        const a = (Math.PI * 2 / 24) * i;
                        this.combatSystem.spawnProjectile({
                            x: this.x, y: this.y,
                            vx: Math.cos(a) * 400, vy: Math.sin(a) * 400,
                            radius: 25, damage: 0, lifetime: 1.5,
                            color: '#ffddff', isEnemy: false // 纯视觉效果
                        });
                    }
                }, 3000);
                break;
                
            case 'STAR_SHOWER':
                // 星辰坠落 - 从天而降的星光箭
                for (let i = 0; i < 15; i++) {
                    setTimeout(() => {
                        const starX = this.player.x + (Math.random() - 0.5) * 400;
                        // 预警
                        this.combatSystem.spawnProjectile({
                            x: starX, y: this.player.y,
                            vx: 0, vy: 0,
                            radius: 25, damage: 0, lifetime: 0.4,
                            color: 'rgba(255, 255, 150, 0.3)', isEnemy: false
                        });
                        // 星光箭
                        setTimeout(() => {
                            this.combatSystem.spawnProjectile({
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
                // 影步 - 瞬移并留下残影攻击
                const shadowPositions = [];
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI * 2 / 4) * i + Math.random() * 0.5;
                    const dist = 100 + Math.random() * 50;
                    shadowPositions.push({
                        x: this.player.x + Math.cos(angle) * dist,
                        y: this.player.y + Math.sin(angle) * dist
                    });
                }
                
                shadowPositions.forEach((pos, idx) => {
                    setTimeout(() => {
                        // 瞬移到位置
                        this.x = pos.x;
                        this.y = pos.y;
                        
                        // 残影攻击
                        const attackAngle = Math.atan2(this.player.y - pos.y, this.player.x - pos.x);
                        for (let j = -1; j <= 1; j++) {
                            this.combatSystem.spawnProjectile({
                                x: pos.x, y: pos.y,
                                vx: Math.cos(attackAngle + j * 0.2) * 400,
                                vy: Math.sin(attackAngle + j * 0.2) * 400,
                                radius: 10, damage: dmg * 0.5, lifetime: 1,
                                color: '#aa66cc', isEnemy: true
                            });
                        }
                    }, idx * 250);
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
                            this.combatSystem.spawnProjectile({
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
                // 野性冲锋 - 近身连续突进
                for (let charge = 0; charge < 5; charge++) {
                    setTimeout(() => {
                        const chargeAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                        // 冲向玩家
                        this.x = this.player.x - Math.cos(chargeAngle) * 50;
                        this.y = this.player.y - Math.sin(chargeAngle) * 50;
                        
                        // 爪击
                        for (let claw = -2; claw <= 2; claw++) {
                            this.combatSystem.spawnProjectile({
                                x: this.x, y: this.y,
                                vx: Math.cos(chargeAngle + claw * 0.3) * 300,
                                vy: Math.sin(chargeAngle + claw * 0.3) * 300,
                                radius: 15, damage: dmg * 0.6, lifetime: 0.5,
                                color: '#ff88aa', isEnemy: true
                            });
                        }
                    }, charge * 300);
                }
                break;
                
            case 'CELESTIAL_SNIPE':
                // 天穹狙击 - 远距离高伤害精准射击
                // 蓄力预警
                const snipeAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                // 显示瞄准线
                this.combatSystem.spawnProjectile({
                    x: this.x, y: this.y,
                    vx: Math.cos(snipeAngle) * 800,
                    vy: Math.sin(snipeAngle) * 800,
                    radius: 3, damage: 0, lifetime: 1,
                    color: '#ff4444', isEnemy: false
                });
                
                // 延迟发射高伤害箭矢
                setTimeout(() => {
                    this.combatSystem.spawnProjectile({
                        x: this.x, y: this.y,
                        vx: Math.cos(snipeAngle) * 800,
                        vy: Math.sin(snipeAngle) * 800,
                        radius: 20, damage: dmg * 2.0, lifetime: 1.5,
                        color: '#ffaaff', isEnemy: true
                    });
                }, 800);
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
