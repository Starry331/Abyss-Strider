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
        
        // 基础属性 (大幅增强)
        this.maxHp = 12000; // 增强血量
        this.hp = this.maxHp;
        this.radius = 70;
        this.color = '#0066aa';
        this.damage = 75; // 增强伤害
        
        // 战斗属性
        this.telegraphDuration = 0.5; // 更快预警
        this.attackCooldown = 0.6; // 更频繁攻击
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
        
        // 一阶段技能（精简强力技能）
        this.skills = [
            'TRIDENT_THRUST',    // 三叉戟突刺
            'TIDAL_WAVE',        // 潮汐波
            'WATER_SPEAR',       // 水之长矛
            'OCEAN_BURST',       // 海洋爆发
            'DEPTH_CHARGE',      // 深渊冲击
            'PRESSURE_CRUSH',    // 水压碾压
            'OCEAN_FURY',        // 海洋狂怒
            'TRIDENT_SHIELD',    // 近身防御1
            'WATER_BARRIER'      // 近身防御2
        ];
        
        // 二阶段技能（全部强力技能）
        this.phase2Skills = [
            'TRIDENT_THRUST',    // 三叉戟突刺
            'TIDAL_WAVE',        // 潮汐波
            'WATER_SPEAR',       // 水之长矛
            'DEPTH_CHARGE',      // 深渊冲击
            'TSUNAMI',           // 海啸
            'POSEIDON_WRATH',    // 波塞冬之怒
            'KRAKEN_SUMMON',     // 召唤克拉肯触手
            'DIVINE_JUDGMENT',   // 秒杀技1：神罚海啸
            'DEEP_SEA_DOOM',     // 秒杀技2：深海绝域
            'LEVIATHAN_CALL',    // 利维坦召唤
            'MAELSTROM',         // 大漩涡
            'TIDAL_PRISON',      // 潮汐牢笼
            'ABYSSAL_SPEAR',     // 深渊之矛
            'PRESSURE_CRUSH',    // 水压碾压
            'OCEAN_FURY',        // 海洋狂怒
            'TRIDENT_SHIELD',    // 近身防御1
            'WATER_BARRIER',     // 近身防御2
            'OCEAN_REPEL',       // 近身防御3
            'TIDAL_BURST',       // 近身防御4
            'KRAKEN_GUARD',      // 近身防御5
            'ABYSSAL_NOVA'       // 近身防御6
        ];
        
        // 秒杀技能真空期
        this.executionCooldown = 0;
        
        // 视觉效果
        this.breathe = 0;
        this.tridentGlow = 0;
        this.executionCooldown = 0;
        this.waterParticles = [];
        
        // 秒杀技预警状态
        this.divineJudgmentWarning = false;
        this.divineJudgmentSafeZone = { x: 0, y: 0, radius: 100 };
        this.divineJudgmentTimer = 0;
        
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
                color: config.color || '#00aaff',
                isPull: config.isPull || false,
                pullStrength: config.pullStrength || 0,
                player: this.player,
                update(dt) {
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.life -= dt;
                    if (this.isPull && this.player) {
                        const dx = this.x - this.player.x;
                        const dy = this.y - this.player.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < this.radius && dist > 10) {
                            this.player.x += (dx / dist) * this.pullStrength * dt * 0.5;
                            this.player.y += (dy / dist) * this.pullStrength * dt * 0.5;
                        }
                    }
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
        this.breathe = Math.sin(Date.now() / 500) * 3;
        this.tridentGlow = (Math.sin(Date.now() / 300) + 1) * 0.5;
        
        // 相位切换
        if (this.hp <= this.maxHp * 0.6 && this.phase === 1) {
            this.phase = 2;
            this.attackCooldown = 0.5;
            console.log('☠️ 波塞冬进入狂暴阶段！解锁强力技能！');
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
            const spd = this.phase === 2 ? 130 : 100;
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
                // 三叉戟突刺 - 快速冲刺+三向攻击（添加预警和锁定）
                const thrustTarget = { x: this.dashTarget.x, y: this.dashTarget.y };
                const thrustStart = { x: this.x, y: this.y };
                // 预警线
                this.spawnProjectile({
                    x: thrustStart.x, y: thrustStart.y, vx: 0, vy: 0, radius: 5, damage: 0, lifetime: 0.35,
                    color: '#00ffff', isEnemy: false, tx: thrustTarget.x, ty: thrustTarget.y,
                    update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        ctx.strokeStyle = `rgba(0,255,255,${this.life * 3})`; ctx.lineWidth = 3; ctx.setLineDash([8, 4]);
                        ctx.beginPath(); ctx.moveTo(thrustStart.x, thrustStart.y); ctx.lineTo(this.tx, this.ty); ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.fillStyle = `rgba(0,200,255,${this.life * 2})`;
                        ctx.beginPath(); ctx.arc(this.tx, this.ty, 50, 0, Math.PI * 2); ctx.fill();
                        if (this.life < 0.15) {
                            ctx.fillStyle = '#ff0000'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
                            ctx.fillText('🔒', this.tx, this.ty - 60);
                        }
                    }
                });
                // 0.35秒后冲刺
                setTimeout(() => {
                    const angle = Math.atan2(thrustTarget.y - this.y, thrustTarget.x - this.x);
                    this.x = thrustTarget.x - Math.cos(angle) * 80;
                    this.y = thrustTarget.y - Math.sin(angle) * 80;
                    for (let i = -1; i <= 1; i++) {
                        this.spawnProjectile({
                            x: this.x, y: this.y,
                            vx: Math.cos(angle + i * 0.3) * 400,
                            vy: Math.sin(angle + i * 0.3) * 400,
                            radius: 12, damage: dmg, lifetime: 1.2,
                            color: '#00aaff', isEnemy: true
                        });
                    }
                }, 350);
                break;
                
            case 'TIDAL_WAVE':
                // 潮汐波 - 扇形水浪
                for (let i = -5; i <= 5; i++) {
                    const a = this.waveDirection + i * 0.12;
                    this.spawnProjectile({
                        x: this.x, y: this.y,
                        vx: Math.cos(a) * 380, vy: Math.sin(a) * 380,
                        radius: 20, damage: dmg * 0.8, lifetime: 1.5,
                        color: '#44ccff', isEnemy: true
                    });
                }
                break;
                
            case 'WATER_SPEAR':
                // 水之长矛 - 追踪水矛
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        const a = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                        this.spawnProjectile({
                            x: this.x, y: this.y,
                            vx: Math.cos(a) * 480, vy: Math.sin(a) * 480,
                            radius: 12, damage: dmg * 0.6, lifetime: 1.8,
                            color: '#0088cc', isEnemy: true
                        });
                    }, i * 150);
                }
                break;
                
            case 'WHIRLPOOL':
                // 漩涡陷阱 - 持续吸引
                this.spawnProjectile({
                    x: this.whirlpoolCenter.x, y: this.whirlpoolCenter.y,
                    vx: 0, vy: 0,
                    radius: 80, damage: dmg * 0.3, lifetime: 3,
                    color: 'rgba(0, 150, 200, 0.5)', isEnemy: true,
                    isPull: true, pullStrength: 120
                });
                break;
                
            case 'OCEAN_BURST':
                // 海洋爆发 - 360度水柱
                for (let i = 0; i < 20; i++) {
                    const a = (Math.PI * 2 / 20) * i;
                    this.spawnProjectile({
                        x: this.x, y: this.y,
                        vx: Math.cos(a) * 320, vy: Math.sin(a) * 320,
                        radius: 16, damage: dmg * 0.7, lifetime: 1.4,
                        color: '#00ddff', isEnemy: true
                    });
                }
                break;
                
            case 'AQUA_SHIELD':
                // 水之护盾 - 临时减伤+反弹
                this.spawnProjectile({
                    x: this.x, y: this.y,
                    vx: 0, vy: 0,
                    radius: 70, damage: 0, lifetime: 2,
                    color: 'rgba(0, 200, 255, 0.3)', isEnemy: true,
                    isShield: true
                });
                break;
                
            case 'DEPTH_CHARGE':
                // 深渊冲击 - 冲刺+爆炸（添加瞬移预警+锁定）
                const chargeOldX = this.x, chargeOldY = this.y;
                const chargeTarget = { x: this.dashTarget.x, y: this.dashTarget.y }; // 锁定目标
                // 瞬移线路预警
                this.spawnProjectile({
                    x: chargeOldX, y: chargeOldY, vx: 0, vy: 0, radius: 5, damage: 0, lifetime: 0.35,
                    color: '#00ffff', isEnemy: false,
                    targetX: chargeTarget.x, targetY: chargeTarget.y,
                    update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        ctx.strokeStyle = `rgba(0,255,255,${this.life * 3})`; ctx.lineWidth = 4; ctx.setLineDash([10, 5]);
                        ctx.beginPath(); ctx.moveTo(chargeOldX, chargeOldY); ctx.lineTo(this.targetX, this.targetY); ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.fillStyle = `rgba(0,200,255,${this.life * 2})`;
                        ctx.beginPath(); ctx.arc(this.targetX, this.targetY, 60, 0, Math.PI * 2); ctx.fill();
                        if (this.life < 0.15) {
                            ctx.fillStyle = '#ff0000'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
                            ctx.fillText('🔒', this.targetX, this.targetY - 70);
                        }
                    }
                });
                // 0.35秒后瞬移
                setTimeout(() => {
                    this.x = chargeTarget.x;
                    this.y = chargeTarget.y;
                    // 爆炸
                    for (let i = 0; i < 12; i++) {
                        const a = (Math.PI * 2 / 12) * i;
                        this.spawnProjectile({
                            x: this.x, y: this.y,
                            vx: Math.cos(a) * 250, vy: Math.sin(a) * 250,
                            radius: 16, damage: dmg * 0.8, lifetime: 1,
                            color: '#0055aa', isEnemy: true
                        });
                    }
                }, 350);
                break;
                
            case 'TSUNAMI':
                // 海啸 - 多点巨浪
                this.tsunamiPoints.forEach((point, idx) => {
                    setTimeout(() => {
                        for (let i = 0; i < 8; i++) {
                            const a = (Math.PI * 2 / 8) * i;
                            this.spawnProjectile({
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
                        this.spawnProjectile({
                            x: zone.x, y: zone.y,
                            vx: 0, vy: 0,
                            radius: 60, damage: dmg * 1.2, lifetime: 0.8,
                            color: 'rgba(139, 90, 43, 0.7)', isEnemy: true
                        });
                    }, idx * 100);
                });
                break;
                
            case 'POSEIDON_WRATH':
                // 波塞冬之怒 - 全屏水柱雨（添加下落预警）
                for (let i = 0; i < 20; i++) {
                    const rx = this.player.x + (Math.random() - 0.5) * 400;
                    const ry = this.player.y + (Math.random() - 0.5) * 400;
                    // 先显示落点预警
                    setTimeout(() => {
                        this.spawnProjectile({
                            x: rx, y: ry, vx: 0, vy: 0, radius: 30, damage: 0, lifetime: 0.5,
                            color: 'rgba(0,170,255,0.4)', isEnemy: false,
                            update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) {
                                const pulse = Math.sin(Date.now() / 50) * 0.3 + 0.7;
                                ctx.strokeStyle = `rgba(0,200,255,${this.life * 2 * pulse})`; ctx.lineWidth = 3;
                                ctx.beginPath(); ctx.arc(this.x, this.y, 25, 0, Math.PI * 2); ctx.stroke();
                                ctx.fillStyle = `rgba(0,150,255,${this.life * 0.5})`; ctx.fill();
                            }
                        });
                    }, i * 130);
                    // 0.5秒后水柱下落
                    setTimeout(() => {
                        this.spawnProjectile({
                            x: rx, y: -50,
                            vx: 0, vy: 500,
                            radius: 20, damage: dmg * 0.7, lifetime: 1.5,
                            color: '#00aadd', isEnemy: true
                        });
                    }, i * 130 + 500);
                }
                break;
                
            case 'KRAKEN_SUMMON':
                // 召唤克拉肯触手 - 地面触手攻击（添加地面预警）
                for (let i = 0; i < 6; i++) {
                    const tentacleAngle = (Math.PI * 2 / 6) * i + Math.random() * 0.5;
                    const tentacleDist = 100 + Math.random() * 100;
                    const tx = this.player.x + Math.cos(tentacleAngle) * tentacleDist;
                    const ty = this.player.y + Math.sin(tentacleAngle) * tentacleDist;
                    // 地面裂缝预警
                    setTimeout(() => {
                        this.spawnProjectile({
                            x: tx, y: ty, vx: 0, vy: 0, radius: 40, damage: 0, lifetime: 0.6,
                            color: 'rgba(0,68,102,0.5)', isEnemy: false,
                            update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) {
                                const p = 1 - this.life / 0.6;
                                ctx.strokeStyle = `rgba(0,100,150,${1 - p})`; ctx.lineWidth = 4;
                                ctx.beginPath(); ctx.arc(this.x, this.y, 35 * (0.5 + p * 0.5), 0, Math.PI * 2); ctx.stroke();
                                ctx.fillStyle = `rgba(0,50,80,${0.5 - p * 0.3})`; ctx.fill();
                            }
                        });
                    }, i * 220);
                    // 0.6秒后触手突出
                    setTimeout(() => {
                        this.spawnProjectile({
                            x: tx, y: ty, vx: 0, vy: 0,
                            radius: 35, damage: dmg, lifetime: 1.2,
                            color: '#004466', isEnemy: true
                        });
                    }, i * 220 + 600);
                }
                break;
                
            case 'ABYSS_DOMAIN':
                // 深渊领域 - 持续伤害区域
                this.spawnProjectile({
                    x: this.x, y: this.y,
                    vx: 0, vy: 0,
                    radius: 150, damage: dmg * 0.2, lifetime: 4,
                    color: 'rgba(0, 50, 100, 0.4)', isEnemy: true,
                    isDOT: true
                });
                break;
                
            case 'DIVINE_JUDGMENT':
                // 秒杀技：神罚海啸 - 全屏攻击（5秒前摇+明显预警）
                // 第一阶段：1秒蓄力预警
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 50, damage: 0, lifetime: 1, maxLife: 1, boss: this,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const p = 1 - this.life / this.maxLife;
                        ctx.strokeStyle = `rgba(0,200,255,${0.8})`; ctx.lineWidth = 6;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 40 + p * 40, 0, Math.PI * 2); ctx.stroke();
                        ctx.fillStyle = '#00ffff'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('⚠️ 神罚海啸准备中... ⚠️', this.x, this.y - 90);
                    }
                });
                // 第二阶段：4秒的明显预警区域
                setTimeout(() => {
                    this.divineJudgmentWarning = true;
                    this.divineJudgmentSafeZone = { x: this.x, y: this.y, radius: 130 };
                    if (this.player.screenShake) { this.player.screenShake.intensity = 20; this.player.screenShake.duration = 4; }
                    // 持续4秒的预警效果
                    this.spawnProjectile({
                        x: this.x, y: this.y, vx: 0, vy: 0, radius: 130, damage: 0, lifetime: 4, maxLife: 4,
                        safeX: this.divineJudgmentSafeZone.x, safeY: this.divineJudgmentSafeZone.y,
                        update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                        draw(ctx) {
                            const t = Date.now() / 1000;
                            // 全屏危险警告
                            ctx.fillStyle = `rgba(0,100,200,${0.15 + Math.sin(t * 10) * 0.1})`;
                            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                            // 安全区
                            ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 8; ctx.setLineDash([15, 10]);
                            ctx.beginPath(); ctx.arc(this.safeX, this.safeY, this.radius, 0, Math.PI * 2); ctx.stroke();
                            ctx.setLineDash([]);
                            ctx.fillStyle = `rgba(0,255,100,${0.2 + Math.sin(t * 8) * 0.1})`; ctx.fill();
                            // 警告文字
                            ctx.fillStyle = '#ff4444'; ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center';
                            ctx.fillText('⚠️ 神罚海啸 - 快躲到安全区！ ⚠️', ctx.canvas.width / 2, 80);
                            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 30px Arial';
                            ctx.fillText(`${Math.ceil(this.life)}秒内进入绿色安全区！`, ctx.canvas.width / 2, 130);
                            ctx.fillStyle = '#00ff00'; ctx.font = 'bold 22px Arial';
                            ctx.fillText('↓↓ 安全区 ↓↓', this.safeX, this.safeY - this.radius - 15);
                        }
                    });
                }, 1000);
                // 4.55秒时锁定位置提示（释放前0.45秒）
                setTimeout(() => {
                    this.spawnProjectile({
                        x: this.divineJudgmentSafeZone.x, y: this.divineJudgmentSafeZone.y, vx: 0, vy: 0, radius: 130, damage: 0, lifetime: 0.45,
                        update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                        draw(ctx) {
                            ctx.fillStyle = '#ff0000'; ctx.font = 'bold 28px Arial'; ctx.textAlign = 'center';
                            ctx.fillText('🔒 位置已锁定！即将释放！ 🔒', ctx.canvas.width / 2, 180);
                            ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 6;
                            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2); ctx.stroke();
                        }
                    });
                }, 4550);
                // 5秒后发动（1+4）
                setTimeout(() => {
                    this.divineJudgmentWarning = false;
                    const px = this.player.x, py = this.player.y;
                    const sx = this.divineJudgmentSafeZone.x, sy = this.divineJudgmentSafeZone.y;
                    const dist = Math.sqrt((px - sx) ** 2 + (py - sy) ** 2);
                    if (dist > this.divineJudgmentSafeZone.radius) {
                        this.player.takeDamage ? this.player.takeDamage(200) : (this.player.hp -= 200);
                    }
                    // 超强屏幕抖动
                    if (this.player.screenShake) { this.player.screenShake.intensity = 50; this.player.screenShake.duration = 1.2; }
                    // 全屏水柱特效
                    for (let i = 0; i < 60; i++) {
                        const rx = Math.random() * 900 + 50, ry = Math.random() * 600;
                        this.spawnProjectile({ x: rx, y: -50, vx: 0, vy: 900, radius: 40, damage: 0, lifetime: 1, color: '#00ddff', isEnemy: false });
                    }
                    // 1.55秒真空期
                    this.executionCooldown = 1.55;
                }, 5000);
                break;
                
            case 'STORM_SURGE':
                // 风暴涌动 - 环形扩散风暴
                for (let wave = 0; wave < 3; wave++) {
                    setTimeout(() => {
                        for (let i = 0; i < 12; i++) {
                            const a = (Math.PI * 2 / 12) * i;
                            const startDist = 50 + wave * 30;
                            this.spawnProjectile({
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
                        this.spawnProjectile({
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
                        this.spawnProjectile({
                            x: px, y: py, vx: 0, vy: 0,
                            radius: 40, damage: 0, lifetime: 0.5,
                            color: 'rgba(0, 150, 255, 0.3)', isEnemy: false
                        });
                        // 延迟喷发
                        setTimeout(() => {
                            this.spawnProjectile({
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
                        this.spawnProjectile({
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
                        this.spawnProjectile({
                            x: levSide > 0 ? -50 : 850,
                            y: startY,
                            vx: levSide * 500, vy: 0,
                            radius: 55, damage: dmg * 1.5, lifetime: 2.5,
                            color: '#005577', isEnemy: true
                        });
                    }, i * 180);
                }
                break;
                
            case 'MAELSTROM':
                // 大漩涡 - 全场吸引+伤害
                const maelX = this.player.x, maelY = this.player.y;
                this.spawnProjectile({
                    x: maelX, y: maelY, vx: 0, vy: 0, radius: 200, damage: 0, lifetime: 3, player: this.player, boss: this,
                    update(dt) {
                        this.life -= dt;
                        if (this.life <= 0) { this.markedForDeletion = true; return; }
                        // 吸引玩家
                        const dx = this.x - this.player.x, dy = this.y - this.player.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 250 && dist > 30) {
                            this.player.x += (dx / dist) * 80 * dt;
                            this.player.y += (dy / dist) * 80 * dt;
                        }
                        // 中心伤害
                        if (dist < 50) this.player.takeDamage(this.boss.damage * 0.3 * dt);
                    },
                    draw(ctx) {
                        const t = Date.now() / 200;
                        ctx.strokeStyle = `rgba(0,150,255,${this.life * 0.3})`;
                        for (let i = 0; i < 5; i++) {
                            ctx.lineWidth = 3 - i * 0.5;
                            ctx.beginPath(); ctx.arc(this.x, this.y, 40 + i * 35 + (t % 35), 0, Math.PI * 2); ctx.stroke();
                        }
                        ctx.fillStyle = `rgba(0,100,200,${this.life * 0.2})`;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 60, 0, Math.PI * 2); ctx.fill();
                    }
                });
                break;
                
            case 'TIDAL_PRISON':
                // 潮汐牢笼 - 多重水墙围困
                const prisonX = this.player.x, prisonY = this.player.y;
                for (let ring = 0; ring < 3; ring++) {
                    setTimeout(() => {
                        for (let i = 0; i < 12; i++) {
                            const a = (Math.PI * 2 / 12) * i + ring * 0.26;
                            this.spawnProjectile({
                                x: prisonX + Math.cos(a) * (80 + ring * 50),
                                y: prisonY + Math.sin(a) * (80 + ring * 50),
                                vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 60,
                                radius: 18, damage: dmg * 0.7, lifetime: 2.5,
                                color: '#0099cc', isEnemy: true
                            });
                        }
                    }, ring * 400);
                }
                break;
                
            case 'ABYSSAL_SPEAR':
                // 深渊之矛 - 快速追踪穿透箭
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        const spearAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                        this.spawnProjectile({
                            x: this.x, y: this.y,
                            vx: Math.cos(spearAngle) * 550, vy: Math.sin(spearAngle) * 550,
                            radius: 12, damage: dmg * 0.9, lifetime: 1.5,
                            color: '#003366', isEnemy: true, isPierce: true
                        });
                    }, i * 120);
                }
                break;
                
            case 'PRESSURE_CRUSH':
                // 水压碾压 - 范围高伤害
                const crushX = this.player.x, crushY = this.player.y;
                // 预警
                this.spawnProjectile({
                    x: crushX, y: crushY, vx: 0, vy: 0, radius: 120, damage: 0, lifetime: 0.8,
                    update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const p = 1 - this.life / 0.8;
                        ctx.fillStyle = `rgba(0,100,200,${0.3 + p * 0.3})`;
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * (1 - p * 0.3), 0, Math.PI * 2); ctx.fill();
                        ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 4;
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke();
                    }
                });
                setTimeout(() => {
                    const dist = Math.sqrt((this.player.x - crushX) ** 2 + (this.player.y - crushY) ** 2);
                    if (dist < 130) this.player.takeDamage(dmg * 2);
                    this.spawnProjectile({
                        x: crushX, y: crushY, vx: 0, vy: 0, radius: 130, damage: 0, lifetime: 0.3,
                        update(dt) { this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                        draw(ctx) {
                            ctx.fillStyle = `rgba(0,200,255,${this.life})`; ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
                        }
                    });
                }, 800);
                break;
                
            case 'OCEAN_FURY':
                // 海洋狂怒 - 快速连续攻击
                for (let burst = 0; burst < 4; burst++) {
                    setTimeout(() => {
                        const furyAngle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                        for (let i = -3; i <= 3; i++) {
                            this.spawnProjectile({
                                x: this.x, y: this.y,
                                vx: Math.cos(furyAngle + i * 0.2) * 450,
                                vy: Math.sin(furyAngle + i * 0.2) * 450,
                                radius: 14, damage: dmg * 0.6, lifetime: 1.3,
                                color: '#00aaff', isEnemy: true
                            });
                        }
                    }, burst * 200);
                }
                break;
                
            case 'DEEP_SEA_DOOM':
                // 秒杀技2：深海绝域 - 全屏压制+移动安全区
                // 第一阶段：1秒蓄力
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 60, damage: 0, lifetime: 1, maxLife: 1, boss: this,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const p = 1 - this.life / this.maxLife;
                        ctx.strokeStyle = '#00ffaa'; ctx.lineWidth = 8;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 50 + p * 50, 0, Math.PI * 2); ctx.stroke();
                        ctx.fillStyle = '#00ffff'; ctx.font = 'bold 28px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('⚠️ 深海绝域准备中... ⚠️', this.x, this.y - 100);
                    }
                });
                // 第二阶段：移动的安全区
                setTimeout(() => {
                    if (this.player.screenShake) { this.player.screenShake.intensity = 25; this.player.screenShake.duration = 5; }
                    const centerX = 400, centerY = 300;
                    this.spawnProjectile({
                        x: centerX, y: centerY, vx: 0, vy: 0, radius: 100, damage: 0, lifetime: 5, maxLife: 5,
                        player: this.player, boss: this, safeAngle: 0, triggered: false,
                        update(dt) {
                            this.life -= dt;
                            if (this.life <= 0) {
                                this.markedForDeletion = true;
                                // 结束时超强抖动和真空期
                                if (!this.triggered) {
                                    this.triggered = true;
                                    if (this.player.screenShake) { this.player.screenShake.intensity = 60; this.player.screenShake.duration = 1.5; }
                                    this.boss.executionCooldown = 1.55;
                                }
                                return;
                            }
                            this.safeAngle += dt * 2.0; // 更快旋转
                            this.x = centerX + Math.cos(this.safeAngle) * 150;
                            this.y = centerY + Math.sin(this.safeAngle) * 150;
                            // 不在安全区内持续受伤
                            const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                            if (dist > this.radius) this.player.takeDamage(this.boss.damage * 0.6 * dt);
                        },
                        draw(ctx) {
                            // 全屏危险
                            ctx.fillStyle = `rgba(0,50,100,${0.4 + Math.sin(Date.now() / 100) * 0.1})`;
                            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                            // 安全区
                            ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 6; ctx.setLineDash([10, 5]);
                            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke();
                            ctx.setLineDash([]);
                            ctx.fillStyle = `rgba(0,255,150,${0.25 + Math.sin(Date.now() / 80) * 0.1})`; ctx.fill();
                            // 警告
                            ctx.fillStyle = '#00ffff'; ctx.font = 'bold 32px Arial'; ctx.textAlign = 'center';
                            ctx.fillText('☠️ 深海绝域 - 跟随安全区！ ☠️', ctx.canvas.width / 2, 70);
                            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 26px Arial';
                            ctx.fillText(`${Math.ceil(this.life)}秒`, ctx.canvas.width / 2, 110);
                            if (this.life < 0.45) {
                                ctx.fillStyle = '#ff0000'; ctx.font = 'bold 24px Arial';
                                ctx.fillText('🔒 位置锁定！', this.x, this.y - this.radius - 20);
                            }
                        }
                    });
                }, 1000);
                break;
                
            case 'TRIDENT_SHIELD':
                // 三叉戟护盾 - 近身高伤防御
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 140, damage: 0, lifetime: 1.2, maxLife: 1.2, boss: this,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const p = 1 - this.life / this.maxLife;
                        ctx.fillStyle = `rgba(0,150,200,${0.2 + Math.sin(Date.now() / 50) * 0.1})`;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 140, 0, Math.PI * 2); ctx.fill();
                        ctx.strokeStyle = '#00aaff'; ctx.lineWidth = 4; ctx.setLineDash([12, 6]);
                        ctx.beginPath(); ctx.arc(this.x, this.y, 140 - p * 90, 0, Math.PI * 2); ctx.stroke();
                        ctx.setLineDash([]);
                        // 三叉戟形状
                        for (let i = 0; i < 3; i++) {
                            const a = (Math.PI * 2 / 3) * i + Date.now() / 200;
                            ctx.save(); ctx.translate(this.x + Math.cos(a) * 100, this.y + Math.sin(a) * 100); ctx.rotate(a);
                            ctx.fillStyle = '#00ddff'; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-8, -6); ctx.lineTo(-8, 6); ctx.closePath(); ctx.fill();
                            ctx.restore();
                        }
                        ctx.fillStyle = '#00aaff'; ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('🔱 三叉戟护盾！ 🔱', this.x, this.y - 160);
                    }
                });
                setTimeout(() => {
                    if (this.player.screenShake) { this.player.screenShake.intensity = 35; this.player.screenShake.duration = 0.8; }
                    const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                    if (dist < 140) this.player.takeDamage ? this.player.takeDamage(dmg * 2.5) : (this.player.hp -= dmg * 2.5);
                    for (let i = 0; i < 12; i++) {
                        const a = (Math.PI * 2 / 12) * i;
                        this.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * 400, vy: Math.sin(a) * 400, radius: 14, damage: dmg * 0.7, lifetime: 1.2, color: '#00aaff', isEnemy: true });
                    }
                }, 1200);
                break;
                
            case 'WATER_BARRIER':
                // 水之屏障 - 快速反击
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 100, damage: 0, lifetime: 0.8, maxLife: 0.8, boss: this,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        ctx.fillStyle = `rgba(0,200,255,${0.25 + Math.sin(Date.now() / 40) * 0.1})`;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 100, 0, Math.PI * 2); ctx.fill();
                        ctx.strokeStyle = '#00ccff'; ctx.lineWidth = 5;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 100, 0, Math.PI * 2); ctx.stroke();
                        ctx.fillStyle = '#00ccff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('⚠️ 水之屏障！ ⚠️', this.x, this.y - 120);
                    }
                });
                setTimeout(() => {
                    if (this.player.screenShake) { this.player.screenShake.intensity = 25; this.player.screenShake.duration = 0.5; }
                    const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                    if (dist < 100) this.player.takeDamage ? this.player.takeDamage(dmg * 2) : (this.player.hp -= dmg * 2);
                    for (let i = 0; i < 8; i++) {
                        const a = (Math.PI * 2 / 8) * i;
                        this.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * 350, vy: Math.sin(a) * 350, radius: 12, damage: dmg * 0.6, lifetime: 1, color: '#00ccff', isEnemy: true });
                    }
                }, 800);
                break;
                
            case 'OCEAN_REPEL':
                // 海洋斥力 - 击退型
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 120, damage: 0, lifetime: 1.0, maxLife: 1.0, boss: this,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const p = 1 - this.life / this.maxLife;
                        ctx.strokeStyle = `rgba(0,180,220,${0.7})`;
                        ctx.lineWidth = 6; ctx.setLineDash([10, 5]);
                        ctx.beginPath(); ctx.arc(this.x, this.y, 120 - p * 70, 0, Math.PI * 2); ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.fillStyle = '#00bbdd'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('🌊 海洋斥力！ 🌊', this.x, this.y - 140);
                    }
                });
                setTimeout(() => {
                    if (this.player.screenShake) { this.player.screenShake.intensity = 30; this.player.screenShake.duration = 0.6; }
                    const dx = this.player.x - this.x, dy = this.player.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        this.player.takeDamage ? this.player.takeDamage(dmg * 1.8) : (this.player.hp -= dmg * 1.8);
                        const angle = Math.atan2(dy, dx);
                        this.player.x += Math.cos(angle) * 180;
                        this.player.y += Math.sin(angle) * 180;
                    }
                    for (let ring = 0; ring < 3; ring++) {
                        this.spawnProjectile({
                            x: this.x, y: this.y, vx: 0, vy: 0, radius: 0, maxRadius: 220, damage: 0, lifetime: 0.5, maxLife: 0.5,
                            update(dt) { this.radius = this.maxRadius * (1 - this.life / this.maxLife); this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                            draw(ctx) { ctx.strokeStyle = `rgba(0,200,255,${this.life / this.maxLife})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke(); }
                        });
                    }
                }, 1000);
                break;
                
            case 'TIDAL_BURST':
                // 潮汐爆发 - 大范围
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 160, damage: 0, lifetime: 1.5, maxLife: 1.5, boss: this,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const p = 1 - this.life / this.maxLife;
                        ctx.fillStyle = `rgba(0,100,180,${0.15 + p * 0.15})`;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 160, 0, Math.PI * 2); ctx.fill();
                        ctx.strokeStyle = '#0088cc'; ctx.lineWidth = 4;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 160 - p * 120, 0, Math.PI * 2); ctx.stroke();
                        for (let i = 0; i < 8; i++) {
                            const a = (Math.PI * 2 / 8) * i + Date.now() / 300;
                            const d = 160 - p * 140;
                            ctx.fillStyle = `rgba(0,200,255,${p})`;
                            ctx.beginPath(); ctx.arc(this.x + Math.cos(a) * d, this.y + Math.sin(a) * d, 6, 0, Math.PI * 2); ctx.fill();
                        }
                        ctx.fillStyle = '#00aaff'; ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('🌊 潮汐爆发！ 🌊', this.x, this.y - 180);
                        ctx.font = 'bold 18px Arial'; ctx.fillText(`${this.life.toFixed(1)}秒`, this.x, this.y - 155);
                    }
                });
                setTimeout(() => {
                    if (this.player.screenShake) { this.player.screenShake.intensity = 40; this.player.screenShake.duration = 1.0; }
                    const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                    if (dist < 160) this.player.takeDamage ? this.player.takeDamage(dmg * 2.8) : (this.player.hp -= dmg * 2.8);
                    for (let i = 0; i < 16; i++) {
                        const a = (Math.PI * 2 / 16) * i;
                        this.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, radius: 14, damage: dmg * 0.6, lifetime: 1.3, color: '#0088cc', isEnemy: true });
                    }
                }, 1500);
                break;
                
            case 'KRAKEN_GUARD':
                // 克拉肯守护 - 触手防御
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 130, damage: 0, lifetime: 1.3, maxLife: 1.3, boss: this, tentacleAngle: 0,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.tentacleAngle += dt * 3; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        ctx.fillStyle = `rgba(80,0,120,${0.2 + Math.sin(Date.now() / 60) * 0.1})`;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 130, 0, Math.PI * 2); ctx.fill();
                        // 触手
                        for (let i = 0; i < 6; i++) {
                            const a = (Math.PI * 2 / 6) * i + this.tentacleAngle;
                            ctx.strokeStyle = '#8800aa'; ctx.lineWidth = 8;
                            ctx.beginPath();
                            ctx.moveTo(this.x + Math.cos(a) * 40, this.y + Math.sin(a) * 40);
                            ctx.quadraticCurveTo(this.x + Math.cos(a + 0.3) * 80, this.y + Math.sin(a + 0.3) * 80, this.x + Math.cos(a) * 120, this.y + Math.sin(a) * 120);
                            ctx.stroke();
                        }
                        ctx.fillStyle = '#aa00cc'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('🦑 克拉肯守护！ 🦑', this.x, this.y - 150);
                    }
                });
                setTimeout(() => {
                    if (this.player.screenShake) { this.player.screenShake.intensity = 35; this.player.screenShake.duration = 0.8; }
                    const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                    if (dist < 130) this.player.takeDamage ? this.player.takeDamage(dmg * 2.3) : (this.player.hp -= dmg * 2.3);
                    // 触手攻击
                    for (let i = 0; i < 6; i++) {
                        const a = (Math.PI * 2 / 6) * i;
                        this.spawnProjectile({ x: this.x + Math.cos(a) * 120, y: this.y + Math.sin(a) * 120, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, radius: 18, damage: dmg * 0.8, lifetime: 1.2, color: '#8800aa', isEnemy: true });
                    }
                }, 1300);
                break;
                
            case 'ABYSSAL_NOVA':
                // 深渊新星 - 终极近身防御
                this.spawnProjectile({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 180, damage: 0, lifetime: 2.0, maxLife: 2.0, boss: this, pulsePhase: 0,
                    update(dt) { this.x = this.boss.x; this.y = this.boss.y; this.pulsePhase += dt * 2.5; this.life -= dt; if (this.life <= 0) this.markedForDeletion = true; },
                    draw(ctx) {
                        const p = 1 - this.life / this.maxLife;
                        const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
                        for (let r = 0; r < 3; r++) {
                            ctx.strokeStyle = `rgba(0,150,200,${pulse * (0.5 - r * 0.12)})`;
                            ctx.lineWidth = 5 - r;
                            ctx.beginPath(); ctx.arc(this.x, this.y, 180 - r * 35 - p * 60, 0, Math.PI * 2); ctx.stroke();
                        }
                        ctx.fillStyle = `rgba(0,100,150,${0.1 + p * 0.15})`;
                        ctx.beginPath(); ctx.arc(this.x, this.y, 180, 0, Math.PI * 2); ctx.fill();
                        for (let i = 0; i < 12; i++) {
                            const a = (Math.PI * 2 / 12) * i + Date.now() / 350;
                            const d = 180 - p * 160;
                            ctx.fillStyle = `rgba(0,255,255,${p * pulse})`;
                            ctx.beginPath(); ctx.arc(this.x + Math.cos(a) * d, this.y + Math.sin(a) * d, 4 + p * 5, 0, Math.PI * 2); ctx.fill();
                        }
                        ctx.fillStyle = '#00ddff'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center';
                        ctx.fillText('💀 深渊新星！远离海神！ 💀', this.x, this.y - 200);
                        ctx.font = 'bold 20px Arial'; ctx.fillText(`${this.life.toFixed(1)}秒`, this.x, this.y - 175);
                    }
                });
                setTimeout(() => {
                    if (this.player.screenShake) { this.player.screenShake.intensity = 50; this.player.screenShake.duration = 1.2; }
                    const dist = Math.sqrt((this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2);
                    if (dist < 180) {
                        this.player.takeDamage ? this.player.takeDamage(dmg * 3.5) : (this.player.hp -= dmg * 3.5);
                        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                        this.player.x += Math.cos(angle) * 220;
                        this.player.y += Math.sin(angle) * 220;
                    }
                    for (let wave = 0; wave < 3; wave++) {
                        setTimeout(() => {
                            for (let i = 0; i < 20; i++) {
                                const a = (Math.PI * 2 / 20) * i + wave * 0.1;
                                this.spawnProjectile({ x: this.x, y: this.y, vx: Math.cos(a) * (320 + wave * 40), vy: Math.sin(a) * (320 + wave * 40), radius: 12, damage: dmg * 0.5, lifetime: 1.5, color: '#00bbdd', isEnemy: true });
                            }
                        }, wave * 180);
                    }
                }, 2000);
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
