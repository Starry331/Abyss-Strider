import { WeaponEvolution } from './WeaponEvolution.js';

export class BuildSystem {
    constructor(weaponSystem, player, levelManager) {
        this.weaponSystem = weaponSystem;
        this.player = player;
        this.levelManager = levelManager;
        this.isActive = false;
        this.currentChoices = [];
        
        // 武器进化状态
        this.weaponEvolution = {
            'Staff': { path: null, level: 0 },
            'Longsword': { path: null, level: 0 },
            'Dual Blades': { path: null, level: 0 }
        };

        // 品质系统配置 - 基础概率（关卡1时）
        // 普通和稀有为主，史诗以上需要高关卡才容易出
        this.rarityConfig = {
            common:    { name: '普通', color: '#ffffff', borderColor: '#888888', baseChance: 0.70, icon: '○', tier: 1 },
            rare:      { name: '稀有', color: '#4488ff', borderColor: '#2266dd', baseChance: 0.24, icon: '◇', tier: 2 },
            epic:      { name: '史诗', color: '#aa44ff', borderColor: '#8822dd', baseChance: 0.05, icon: '◆', tier: 3 },
            legendary: { name: '传说', color: '#ff4444', borderColor: '#dd2222', baseChance: 0.01, icon: '★', tier: 4 },
            mythic:    { name: '神话', color: '#ffd700', borderColor: '#ffaa00', baseChance: 0.00, icon: '✦', tier: 5 }
        };
        
        // 关卡数值倍率 (用于平衡构筑增益)
        this.levelScaling = {
            1: { dmgBonus: 1.0, defBonus: 1.0, hpBonus: 1.0 },
            2: { dmgBonus: 1.25, defBonus: 1.2, hpBonus: 1.3 },
            3: { dmgBonus: 1.5, defBonus: 1.4, hpBonus: 1.6 },
            4: { dmgBonus: 1.8, defBonus: 1.6, hpBonus: 2.0 },
            5: { dmgBonus: 2.2, defBonus: 1.8, hpBonus: 2.5 }
        };

        // 初始化构筑池
        this.initBuildPool();

        // Track applied builds
        this.appliedBuilds = [];
    }
    
    // 获取当前关卡缩放
    getScaling() {
        const level = this.levelManager ? this.levelManager.currentLevel : 1;
        return this.levelScaling[level] || this.levelScaling[1];
    }
    
    // 初始化丰富的构筑池
    initBuildPool() {
        this.buildPool = {
            'Staff': this.createStaffBuilds(),
            'Longsword': this.createLongswordBuilds(),
            'Dual Blades': this.createDualBladesBuilds(),
            'Universal': this.createUniversalBuilds(),
            'Evolution': this.createEvolutionBuilds()
        };
    }
    
    // 法杖构筑
    createStaffBuilds() {
        return [
            // 普通(白) - 纯数值
            { id: 'staff_dmg1', name: '魔力增幅', desc: '法杖伤害 +15%', rarity: 'common', apply: () => this.modifyWeaponStat('Staff', 'damage', 1.15) },
            { id: 'staff_dmg1b', name: '奥术强化', desc: '法杖伤害 +12%', rarity: 'common', apply: () => this.modifyWeaponStat('Staff', 'damage', 1.12) },
            { id: 'staff_speed1', name: '施法速度', desc: '攻速 +15%', rarity: 'common', apply: () => this.modifyWeaponStat('Staff', 'cooldown', 0.85) },
            { id: 'staff_aoe1', name: 'AOE扩展', desc: '范围 +20%', rarity: 'common', apply: () => this.modifyWeaponStat('Staff', 'aoeRadius', 1.2) },
            { id: 'staff_range1', name: '射程延长', desc: '射程 +20%', rarity: 'common', apply: () => this.modifyWeaponStat('Staff', 'range', 1.2) },
            // 稀有(蓝) - 改外观+攻击方式/长度/数值
            { id: 'staff_dmg2', name: '魔力精通', desc: '伤害 +30%', rarity: 'rare', visual: 'blue', apply: () => { this.modifyWeaponStat('Staff', 'damage', 1.3); this.evolveWeapon('Staff', 'rare'); } },
            { id: 'staff_proj', name: '多重投射', desc: '+1投射物', rarity: 'rare', visual: 'multi', apply: () => { this.addProjectileCount('Staff'); this.evolveWeapon('Staff', 'rare'); } },
            { id: 'staff_pen', name: '穿透打击', desc: '穿透敌人', rarity: 'rare', visual: 'pierce', apply: () => { this.enablePierce('Staff'); this.evolveWeapon('Staff', 'rare'); } },
            { id: 'staff_aoe2', name: '爆裂核心', desc: 'AOE +40%', rarity: 'rare', visual: 'aoe', apply: () => { this.modifyWeaponStat('Staff', 'aoeRadius', 1.4); this.evolveWeapon('Staff', 'rare'); } },
            // 史诗(紫) - 角色+武器双增益
            { id: 'staff_chain', name: '连锁闪电', desc: '连锁+HP+20', rarity: 'epic', visual: 'lightning', apply: () => { this.enableChainLightning('Staff'); this.player.maxHp += 20; this.player.hp += 20; this.evolveWeapon('Staff', 'epic'); } },
            { id: 'staff_freeze', name: '冰霜附魔', desc: '减速40%+移速10%', rarity: 'epic', visual: 'ice', apply: () => { this.enableFreeze('Staff'); this.player.speed *= 1.1; this.evolveWeapon('Staff', 'epic'); } },
            { id: 'staff_mana', name: '魔力回复', desc: '每击回8HP', rarity: 'epic', visual: 'heal', apply: () => { this.enableManaSteal('Staff', 8); this.evolveWeapon('Staff', 'epic'); } },
            { id: 'staff_fire', name: '烈焰风暴', desc: '燃烧+伤害25%', rarity: 'epic', visual: 'fire', apply: () => { this.enableBurn('Staff'); this.modifyWeaponStat('Staff', 'damage', 1.25); this.evolveWeapon('Staff', 'epic'); } },
            { id: 'staff_crit', name: '奥术暴击', desc: '暴击+15%,暴伤+50%', rarity: 'epic', visual: 'crit', apply: () => { this.enableCrit('Staff', 0.15, 2.5); this.evolveWeapon('Staff', 'epic'); } },
            // 传说(红) - 大幅增益
            { id: 'staff_meteor', name: '陨石雨', desc: '落石+HP+50', rarity: 'legendary', visual: 'meteor', apply: () => { this.enableMeteorShower('Staff'); this.player.maxHp += 50; this.player.hp += 50; this.evolveWeapon('Staff', 'legendary'); } },
            { id: 'staff_proj2', name: '弹幕大师', desc: '+3投射+伤害30%', rarity: 'legendary', visual: 'barrage', apply: () => { this.addProjectileCount('Staff', 3); this.modifyWeaponStat('Staff', 'damage', 1.3); this.evolveWeapon('Staff', 'legendary'); } },
            { id: 'staff_nova', name: '新星爆发', desc: 'AOE+80%+2投射', rarity: 'legendary', visual: 'nova', apply: () => { this.modifyWeaponStat('Staff', 'aoeRadius', 1.8); this.addProjectileCount('Staff', 2); this.evolveWeapon('Staff', 'legendary'); } },
            // 神话(金) - 形态变化
            { id: 'staff_god', name: '元素主宰', desc: '伤害+100%,AOE+100%,+5投射', rarity: 'mythic', visual: 'elemental', apply: () => { this.modifyWeaponStat('Staff', 'damage', 2.0); this.modifyWeaponStat('Staff', 'aoeRadius', 2.0); this.addProjectileCount('Staff', 5); this.evolveWeapon('Staff', 'mythic', 'elemental'); } },
            { id: 'staff_time', name: '时空法杖', desc: '攻速+100%,减速60%,穿透', rarity: 'mythic', visual: 'time', apply: () => { this.modifyWeaponStat('Staff', 'cooldown', 0.5); this.enableFreeze('Staff', 0.6); this.enablePierce('Staff'); this.evolveWeapon('Staff', 'mythic', 'time'); } },
        ];
    }
    
    // 长剑构筑 - 重击流派
    createLongswordBuilds() {
        return [
            // 普通 - 强化基础属性
            { id: 'ls_dmg1', name: '锋利刀刃', desc: '伤害 +25%', rarity: 'common', apply: () => this.modifyWeaponStat('Longsword', 'damage', 1.25) },
            { id: 'ls_speed1', name: '快速挥砍', desc: '攻速 +20%', rarity: 'common', apply: () => this.modifyWeaponStat('Longsword', 'cooldown', 0.8) },
            { id: 'ls_range1', name: '剑刃延伸', desc: '范围 +35%', rarity: 'common', apply: () => this.modifyWeaponStat('Longsword', 'range', 1.35) },
            { id: 'ls_arc1', name: '横扫千军', desc: '弧度 +30%', rarity: 'common', apply: () => this.modifyWeaponStat('Longsword', 'arc', 1.3) },
            { id: 'ls_knock1', name: '重击', desc: '击退 +50%', rarity: 'common', apply: () => this.modifyWeaponStat('Longsword', 'knockback', 1.5) },
            { id: 'ls_def1', name: '铁壁', desc: '减伤 +15%', rarity: 'common', apply: () => { this.player.damageReduction = (this.player.damageReduction || 0) + 0.15; } },
            // 稀有 - 特殊效果
            { id: 'ls_dmg2', name: '利刃精通', desc: '伤害 +45%', rarity: 'rare', visual: 'sharp', apply: () => { this.modifyWeaponStat('Longsword', 'damage', 1.45); this.evolveWeapon('Longsword', 'rare'); } },
            { id: 'ls_crit', name: '致命一击', desc: '35%暴击,2.8倍', rarity: 'rare', visual: 'crit', apply: () => { this.enableCrit('Longsword', 0.35, 2.8); this.evolveWeapon('Longsword', 'rare'); } },
            { id: 'ls_whirlwind', name: '旋风斩', desc: '范围+70%,弧度+50%', rarity: 'rare', visual: 'whirl', apply: () => { this.modifyWeaponStat('Longsword', 'range', 1.7); this.modifyWeaponStat('Longsword', 'arc', 1.5); this.evolveWeapon('Longsword', 'rare'); } },
            { id: 'ls_charge', name: '冲锋斩', desc: '攻击时前冲+伤害30%', rarity: 'rare', visual: 'charge', apply: () => { this.enableCharge('Longsword'); this.modifyWeaponStat('Longsword', 'damage', 1.3); this.evolveWeapon('Longsword', 'rare'); } },
            // 史诗 - 强力组合
            { id: 'ls_lifesteal', name: '生命窃取', desc: '30%吸血+HP50', rarity: 'epic', visual: 'vamp', apply: () => { this.enableLifesteal('Longsword', 0.3); this.player.maxHp += 50; this.player.hp += 50; this.evolveWeapon('Longsword', 'epic'); } },
            { id: 'ls_stun', name: '重击眩晕', desc: '40%眩晕+伤害35%', rarity: 'epic', visual: 'stun', apply: () => { this.enableStun('Longsword', 0.4); this.modifyWeaponStat('Longsword', 'damage', 1.35); this.evolveWeapon('Longsword', 'epic'); } },
            { id: 'ls_cleave', name: '贯穿斩击', desc: '无视护甲+击退翻倍', rarity: 'epic', visual: 'cleave', apply: () => { this.enableArmorPen('Longsword', 1.0); this.modifyWeaponStat('Longsword', 'knockback', 2.0); this.evolveWeapon('Longsword', 'epic'); } },
            { id: 'ls_holy', name: '圣光斩', desc: '伤害+40%+每击回8HP', rarity: 'epic', visual: 'holy', apply: () => { this.modifyWeaponStat('Longsword', 'damage', 1.4); this.enableManaSteal('Longsword', 8); this.evolveWeapon('Longsword', 'epic'); } },
            // 传说 - 毁灭性
            { id: 'ls_exec', name: '处刑者', desc: '低血+150%伤害+HP100', rarity: 'legendary', visual: 'exec', apply: () => { this.enableExecute('Longsword', 1.5); this.player.maxHp += 100; this.player.hp += 100; this.evolveWeapon('Longsword', 'legendary'); } },
            { id: 'ls_crit2', name: '暴击大师', desc: '60%暴击,4倍+攻速30%', rarity: 'legendary', visual: 'master', apply: () => { this.enableCrit('Longsword', 0.6, 4.0); this.modifyWeaponStat('Longsword', 'cooldown', 0.7); this.evolveWeapon('Longsword', 'legendary'); } },
            { id: 'ls_wave', name: '剑气波动', desc: '发射剑气+伤害60%', rarity: 'legendary', visual: 'wave', apply: () => { this.enableSwordWave('Longsword'); this.modifyWeaponStat('Longsword', 'damage', 1.6); this.evolveWeapon('Longsword', 'legendary'); } },
            // 神话 - 究极形态
            { id: 'ls_god', name: '剑圣', desc: '伤害+200%,攻速+120%,35%吸血', rarity: 'mythic', visual: 'god', apply: () => { this.modifyWeaponStat('Longsword', 'damage', 3.0); this.modifyWeaponStat('Longsword', 'cooldown', 0.45); this.enableLifesteal('Longsword', 0.35); this.evolveWeapon('Longsword', 'mythic', 'holy'); } },
            { id: 'ls_demon', name: '魔剑·堕落', desc: '伤害+250%,每击吸取生命', rarity: 'mythic', visual: 'demon', apply: () => { this.modifyWeaponStat('Longsword', 'damage', 3.5); this.enableLifeDrain('Longsword'); this.evolveWeapon('Longsword', 'mythic', 'shadow'); } },
        ];
    }
    
    // 双刀构筑
    createDualBladesBuilds() {
        return [
            // 普通
            { id: 'db_dmg1', name: '双刃强化', desc: '伤害 +15%', rarity: 'common', apply: () => this.modifyWeaponStat('Dual Blades', 'damage', 1.15) },
            { id: 'db_speed1', name: '狂风斩击', desc: '攻速 +20%', rarity: 'common', apply: () => this.modifyWeaponStat('Dual Blades', 'cooldown', 0.8) },
            { id: 'db_combo1', name: '连击', desc: '+1斩击', rarity: 'common', apply: () => this.addSlashCount('Dual Blades') },
            { id: 'db_range1', name: '刀锋延伸', desc: '范围 +15%', rarity: 'common', apply: () => this.modifyWeaponStat('Dual Blades', 'range', 1.15) },
            { id: 'db_move1', name: '轻盈步伐', desc: '移速 +8%', rarity: 'common', apply: () => { this.player.speed *= 1.08; } },
            // 稀有
            { id: 'db_dmg2', name: '双刃精通', desc: '伤害 +35%', rarity: 'rare', visual: 'master', apply: () => { this.modifyWeaponStat('Dual Blades', 'damage', 1.35); this.evolveWeapon('Dual Blades', 'rare'); } },
            { id: 'db_bleeding', name: '流血效果', desc: '流血DOT', rarity: 'rare', visual: 'bleed', apply: () => { this.enableBleeding('Dual Blades'); this.evolveWeapon('Dual Blades', 'rare'); } },
            { id: 'db_dodge', name: '闪避大师', desc: '18%闪避', rarity: 'rare', visual: 'dodge', apply: () => { this.enableDodge('Dual Blades', 0.18); this.evolveWeapon('Dual Blades', 'rare'); } },
            { id: 'db_crit1', name: '刺客之刃', desc: '暴击+12%,暴伤+40%', rarity: 'rare', visual: 'crit', apply: () => { this.enableCrit('Dual Blades', 0.12, 2.4); this.evolveWeapon('Dual Blades', 'rare'); } },
            { id: 'db_crit', name: '暗杀本能', desc: '25%暴击,2.5倍', rarity: 'rare', visual: 'crit', apply: () => { this.enableCrit('Dual Blades', 0.25, 2.5); this.evolveWeapon('Dual Blades', 'rare'); } },
            // 史诗
            { id: 'db_poison', name: '剧毒涂装', desc: '剧毒+移速15%', rarity: 'epic', visual: 'poison', apply: () => { this.enablePoison('Dual Blades'); this.player.speed *= 1.15; this.evolveWeapon('Dual Blades', 'epic'); } },
            { id: 'db_fury', name: '狂怒模式', desc: '低血+100%伤害+攻速30%', rarity: 'epic', visual: 'fury', apply: () => { this.enableFury('Dual Blades', 1.0); this.modifyWeaponStat('Dual Blades', 'cooldown', 0.7); this.evolveWeapon('Dual Blades', 'epic'); } },
            { id: 'db_phantom', name: '幻影斩', desc: '35%额外斩击+伤害20%', rarity: 'epic', visual: 'phantom', apply: () => { this.enablePhantom('Dual Blades', 0.35); this.modifyWeaponStat('Dual Blades', 'damage', 1.2); this.evolveWeapon('Dual Blades', 'epic'); } },
            { id: 'db_leech', name: '生命汲取', desc: '15%吸血+HP25', rarity: 'epic', visual: 'leech', apply: () => { this.enableLifesteal('Dual Blades', 0.15); this.player.maxHp += 25; this.player.hp += 25; this.evolveWeapon('Dual Blades', 'epic'); } },
            // 传说
            { id: 'db_combo3', name: '连击大师', desc: '+4斩击+伤害40%', rarity: 'legendary', visual: 'combo', apply: () => { this.addSlashCount('Dual Blades', 4); this.modifyWeaponStat('Dual Blades', 'damage', 1.4); this.evolveWeapon('Dual Blades', 'legendary'); } },
            { id: 'db_shadow', name: '暗影步', desc: '无敌+闪避30%', rarity: 'legendary', visual: 'shadow', apply: () => { this.enableShadowStep('Dual Blades'); this.enableDodge('Dual Blades', 0.3); this.evolveWeapon('Dual Blades', 'legendary'); } },
            { id: 'db_storm', name: '刀锋风暴', desc: '攻速+60%+范围40%', rarity: 'legendary', visual: 'storm', apply: () => { this.modifyWeaponStat('Dual Blades', 'cooldown', 0.4); this.modifyWeaponStat('Dual Blades', 'range', 1.4); this.evolveWeapon('Dual Blades', 'legendary'); } },
            // 神话
            { id: 'db_god', name: '刺客之魂', desc: '伤害+220%,闪避55%,剧毒', rarity: 'mythic', visual: 'assassin', apply: () => { this.modifyWeaponStat('Dual Blades', 'damage', 3.2); this.enableDodge('Dual Blades', 0.55); this.enablePoison('Dual Blades'); this.evolveWeapon('Dual Blades', 'mythic', 'assassin'); } },
            { id: 'db_reaper', name: '死神镰刀', desc: '+6斩击,50%暴击,4倍暴伤', rarity: 'mythic', visual: 'reaper', apply: () => { this.addSlashCount('Dual Blades', 6); this.enableCrit('Dual Blades', 0.5, 4.0); this.evolveWeapon('Dual Blades', 'mythic', 'berserker'); } },
        ];
    }
    
    // 通用构筑
    createUniversalBuilds() {
        return [
            // 普通 - 基础属性 (7张)
            { id: 'uni_hp1', name: '生命强化', desc: 'HP +35', rarity: 'common', apply: () => { this.player.maxHp += 35; this.player.hp += 35; } },
            { id: 'uni_hp1b', name: '体质强化', desc: 'HP +25', rarity: 'common', apply: () => { this.player.maxHp += 25; this.player.hp += 25; } },
            { id: 'uni_speed1', name: '移动加速', desc: '移速 +12%', rarity: 'common', apply: () => { this.player.speed *= 1.12; } },
            { id: 'uni_def1', name: '防御强化', desc: '减伤 +10%', rarity: 'common', apply: () => { this.player.damageReduction = (this.player.damageReduction || 0) + 0.1; } },
            { id: 'uni_crit1', name: '锐利', desc: '暴击率 +5%', rarity: 'common', apply: () => { this.modifyAllWeaponsCrit(0.05, 0); } },
            { id: 'uni_dmg1', name: '攻击强化', desc: '全武器伤害 +10%', rarity: 'common', apply: () => { this.modifyAllWeaponsDamage(1.1); } },
            { id: 'uni_atkspd1', name: '攻速强化', desc: '全武器攻速 +10%', rarity: 'common', apply: () => { this.modifyAllWeaponsSpeed(0.9); } },
            // 稀有 - 进阶属性 (8张)
            { id: 'uni_hp2', name: '生命精通', desc: 'HP +75', rarity: 'rare', apply: () => { this.player.maxHp += 75; this.player.hp += 75; } },
            { id: 'uni_speed2', name: '疾风步', desc: '移速 +25%', rarity: 'rare', apply: () => { this.player.speed *= 1.25; } },
            { id: 'uni_regen', name: '生命回复', desc: '每秒+3HP', rarity: 'rare', apply: () => { this.enableRegeneration(3); } },
            { id: 'uni_crit2', name: '锋锐', desc: '暴击率 +10%', rarity: 'rare', apply: () => { this.modifyAllWeaponsCrit(0.1, 0); } },
            { id: 'uni_critdmg1', name: '精准打击', desc: '暴击伤害 +30%', rarity: 'rare', apply: () => { this.modifyAllWeaponsCrit(0, 0.3); } },
            { id: 'uni_lifesteal1', name: '吸血', desc: '吸血 +8%', rarity: 'rare', apply: () => { this.modifyAllWeaponsLifesteal(0.08); } },
            { id: 'uni_dmg2', name: '攻击精通', desc: '全武器伤害 +20%', rarity: 'rare', apply: () => { this.modifyAllWeaponsDamage(1.2); } },
            { id: 'uni_range1', name: '范围扩展', desc: '全武器范围 +20%', rarity: 'rare', apply: () => { this.modifyAllWeaponsRange(1.2); } },
            // 史诗 - 强力效果 (9张)
            { id: 'uni_def2', name: '铁壁', desc: '减伤 +30%', rarity: 'epic', apply: () => { this.player.damageReduction = (this.player.damageReduction || 0) + 0.3; } },
            { id: 'uni_crit3', name: '致命一击', desc: '暴击率 +15%', rarity: 'epic', apply: () => { this.modifyAllWeaponsCrit(0.15, 0); } },
            { id: 'uni_critdmg2', name: '毁灭打击', desc: '暴击伤害 +60%', rarity: 'epic', apply: () => { this.modifyAllWeaponsCrit(0, 0.6); } },
            { id: 'uni_crit_combo', name: '暴击专精', desc: '暴击+10%,暴伤+40%', rarity: 'epic', apply: () => { this.modifyAllWeaponsCrit(0.1, 0.4); } },
            { id: 'uni_lifesteal2', name: '血族', desc: '吸血 +15%', rarity: 'epic', apply: () => { this.modifyAllWeaponsLifesteal(0.15); } },
            { id: 'uni_magnet', name: '磁力吸引', desc: '拾取范围 +150%', rarity: 'epic', apply: () => { this.player.magnetRange = (this.player.magnetRange || 100) * 2.5; } },
            { id: 'uni_allpower', name: '全能战士', desc: '伤害+15%,HP+50', rarity: 'epic', apply: () => { this.modifyAllWeaponsDamage(1.15); this.player.maxHp += 50; this.player.hp += 50; } },
            { id: 'uni_berserker', name: '狂战士', desc: '伤害+25%,减伤-10%', rarity: 'epic', apply: () => { this.modifyAllWeaponsDamage(1.25); this.player.damageReduction = (this.player.damageReduction || 0) - 0.1; } },
            { id: 'uni_tank', name: '坦克', desc: 'HP+80,减伤+20%', rarity: 'epic', apply: () => { this.player.maxHp += 80; this.player.hp += 80; this.player.damageReduction = (this.player.damageReduction || 0) + 0.2; } },
            // 传说 - 极致效果 (8张)
            { id: 'uni_hp3', name: '生命之源', desc: 'HP +150', rarity: 'legendary', apply: () => { this.player.maxHp += 150; this.player.hp += 150; } },
            { id: 'uni_regen2', name: '强化再生', desc: '每秒+8HP', rarity: 'legendary', apply: () => { this.enableRegeneration(8); } },
            { id: 'uni_crit4', name: '绝杀', desc: '暴击率 +25%', rarity: 'legendary', apply: () => { this.modifyAllWeaponsCrit(0.25, 0); } },
            { id: 'uni_critdmg3', name: '暴击大师', desc: '暴击伤害 +100%', rarity: 'legendary', apply: () => { this.modifyAllWeaponsCrit(0, 1.0); } },
            { id: 'uni_crit_master', name: '致命专家', desc: '暴击+20%,暴伤+80%', rarity: 'legendary', apply: () => { this.modifyAllWeaponsCrit(0.2, 0.8); } },
            { id: 'uni_lifesteal3', name: '血魔', desc: '吸血 +25%', rarity: 'legendary', apply: () => { this.modifyAllWeaponsLifesteal(0.25); } },
            { id: 'uni_godslayer', name: '弑神者', desc: '伤害+50%,攻速+30%', rarity: 'legendary', apply: () => { this.modifyAllWeaponsDamage(1.5); this.modifyAllWeaponsSpeed(0.7); } },
            { id: 'uni_fortress', name: '不动堡垒', desc: 'HP+120,减伤+40%,移速-15%', rarity: 'legendary', apply: () => { this.player.maxHp += 120; this.player.hp += 120; this.player.damageReduction = (this.player.damageReduction || 0) + 0.4; this.player.speed *= 0.85; } },
            // 神话 - 究极效果 (5张)
            { id: 'uni_god', name: '不朽', desc: 'HP+300,减伤50%,每秒+15HP', rarity: 'mythic', apply: () => { this.player.maxHp += 300; this.player.hp += 300; this.player.damageReduction = (this.player.damageReduction || 0) + 0.5; this.enableRegeneration(15); } },
            { id: 'uni_crit_god', name: '暴击之神', desc: '暴击+40%,暴伤+150%', rarity: 'mythic', apply: () => { this.modifyAllWeaponsCrit(0.4, 1.5); } },
            { id: 'uni_vamp_god', name: '血神', desc: '吸血40%,每击+5HP', rarity: 'mythic', apply: () => { this.modifyAllWeaponsLifesteal(0.4); this.modifyAllWeaponsManaSteal(5); } },
            { id: 'uni_war_god', name: '战神', desc: '伤害+80%,攻速+50%,暴击+15%', rarity: 'mythic', apply: () => { this.modifyAllWeaponsDamage(1.8); this.modifyAllWeaponsSpeed(0.5); this.modifyAllWeaponsCrit(0.15, 0); } },
            { id: 'uni_perfect', name: '完美形态', desc: '全属性+30%', rarity: 'mythic', apply: () => { this.modifyAllWeaponsDamage(1.3); this.modifyAllWeaponsSpeed(0.7); this.player.maxHp += 100; this.player.hp += 100; this.player.speed *= 1.3; } },
        ];
    }
    
    // 进化构筑(蓝以上必改外观)
    createEvolutionBuilds() {
        return [
            // 法杖进化路线
            { id: 'evo_staff_elem', name: '元素之路', desc: '法杖进化:元素系', rarity: 'rare', weapon: 'Staff', apply: () => { this.setEvolutionPath('Staff', 'elemental'); } },
            { id: 'evo_staff_summon', name: '召唤之路', desc: '法杖进化:召唤系', rarity: 'rare', weapon: 'Staff', apply: () => { this.setEvolutionPath('Staff', 'summoner'); } },
            { id: 'evo_staff_destruct', name: '毁灭之路', desc: '法杖进化:爆破系', rarity: 'rare', weapon: 'Staff', apply: () => { this.setEvolutionPath('Staff', 'destruction'); } },
            // 长剑进化路线
            { id: 'evo_ls_holy', name: '圣光之路', desc: '长剑进化:圣剑系', rarity: 'rare', weapon: 'Longsword', apply: () => { this.setEvolutionPath('Longsword', 'holy'); } },
            { id: 'evo_ls_shadow', name: '暗影之路', desc: '长剑进化:暗剑系', rarity: 'rare', weapon: 'Longsword', apply: () => { this.setEvolutionPath('Longsword', 'shadow'); } },
            { id: 'evo_ls_titan', name: '巨人之路', desc: '长剑进化:巨剑系', rarity: 'rare', weapon: 'Longsword', apply: () => { this.setEvolutionPath('Longsword', 'titan'); } },
            // 双刀进化路线
            { id: 'evo_db_assassin', name: '刺客之路', desc: '双刀进化:刺客系', rarity: 'rare', weapon: 'Dual Blades', apply: () => { this.setEvolutionPath('Dual Blades', 'assassin'); } },
            { id: 'evo_db_berserker', name: '狂战之路', desc: '双刀进化:狂战系', rarity: 'rare', weapon: 'Dual Blades', apply: () => { this.setEvolutionPath('Dual Blades', 'berserker'); } },
            { id: 'evo_db_venom', name: '剧毒之路', desc: '双刀进化:剧毒系', rarity: 'rare', weapon: 'Dual Blades', apply: () => { this.setEvolutionPath('Dual Blades', 'venom'); } },
        ];
    }
    
    // 武器进化
    evolveWeapon(weaponName, rarity, path = null) {
        const evo = this.weaponEvolution[weaponName];
        if (!evo) return;
        
        // 根据稀有度提升进化等级
        const levelIncrease = { rare: 1, epic: 1, legendary: 2, mythic: 3 };
        evo.level = Math.min(4, evo.level + (levelIncrease[rarity] || 0));
        
        if (path) evo.path = path;
        
        // 更新武器外观
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) {
            weapon.evolutionLevel = evo.level;
            weapon.evolutionPath = evo.path;
            
            // 从WeaponEvolution获取颜色
            if (evo.path) {
                const stage = WeaponEvolution.getEvolutionStage(weaponName, evo.path, evo.level);
                if (stage) {
                    weapon.color = stage.color;
                    weapon.glowColor = stage.glowColor;
                    weapon.evolutionName = stage.name;
                }
            }
        }
    }
    
    setEvolutionPath(weaponName, path) {
        const evo = this.weaponEvolution[weaponName];
        if (evo) {
            evo.path = path;
            evo.level = Math.max(1, evo.level);
            this.evolveWeapon(weaponName, 'rare', path);
        }
    }

    // 根据关卡调整概率选择品质
    // Level 1: 主要普通/稀有, Level 5: 史诗/传说/神话概率大幅提升
    rollRarity() {
        const level = this.levelManager ? this.levelManager.currentLevel : 1;
        
        // 关卡对各稀有度的加成
        // Level 1: +0%, Level 2: +3%, Level 3: +6%, Level 4: +10%, Level 5: +15%
        const levelBonus = {
            1: { epic: 0, legendary: 0, mythic: 0 },
            2: { epic: 0.03, legendary: 0.01, mythic: 0 },
            3: { epic: 0.06, legendary: 0.03, mythic: 0.01 },
            4: { epic: 0.10, legendary: 0.06, mythic: 0.02 },
            5: { epic: 0.15, legendary: 0.10, mythic: 0.05 }
        };
        
        const bonus = levelBonus[level] || levelBonus[1];
        
        // 计算各稀有度概率
        const chances = {
            mythic: this.rarityConfig.mythic.baseChance + bonus.mythic,
            legendary: this.rarityConfig.legendary.baseChance + bonus.legendary,
            epic: this.rarityConfig.epic.baseChance + bonus.epic,
            rare: this.rarityConfig.rare.baseChance,
            common: this.rarityConfig.common.baseChance
        };
        
        // 归一化（确保总和为1）
        const total = chances.mythic + chances.legendary + chances.epic + chances.rare + chances.common;
        
        const roll = Math.random() * total;
        let cumulative = 0;
        
        // 从高到低检查
        const rarities = ['mythic', 'legendary', 'epic', 'rare', 'common'];
        for (const rarity of rarities) {
            cumulative += chances[rarity];
            if (roll < cumulative) return rarity;
        }
        return 'common';
    }

    showBuildChoice() {
        this.isActive = true;

        // Generate 3 random builds with rarity-based selection
        const currentWeapon = this.weaponSystem.currentWeapon.name;
        const weaponBuilds = this.buildPool[currentWeapon] || [];
        const universalBuilds = this.buildPool['Universal'] || [];
        
        // Combine all available builds
        const allBuilds = [...weaponBuilds, ...universalBuilds].filter(
            b => !this.appliedBuilds.includes(b.id)
        );

        // Select 3 builds based on rarity probability
        this.currentChoices = [];
        for (let i = 0; i < 3 && allBuilds.length > 0; i++) {
            // Roll for rarity
            const targetRarity = this.rollRarity();
            
            // Find builds matching this rarity (or fallback to lower)
            let candidates = allBuilds.filter(b => b.rarity === targetRarity);
            
            // Fallback: if no builds of that rarity, try lower rarities
            if (candidates.length === 0) {
                const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'common'];
                const targetIndex = rarityOrder.indexOf(targetRarity);
                for (let r = targetIndex + 1; r < rarityOrder.length && candidates.length === 0; r++) {
                    candidates = allBuilds.filter(b => b.rarity === rarityOrder[r]);
                }
            }
            
            if (candidates.length > 0) {
                const randomIndex = Math.floor(Math.random() * candidates.length);
                const selected = candidates[randomIndex];
                this.currentChoices.push(selected);
                // Remove from available pool
                const mainIndex = allBuilds.findIndex(b => b.id === selected.id);
                if (mainIndex !== -1) allBuilds.splice(mainIndex, 1);
            }
        }

        this.displayUI();
    }

    displayUI() {
        const panel = document.getElementById('build-panel');
        const choicesContainer = document.getElementById('build-choices');

        if (!panel || !choicesContainer) {
            console.error('Build UI elements not found!');
            if (this.onBuildSelected) this.onBuildSelected();
            return;
        }

        // Clear previous choices
        choicesContainer.innerHTML = '';

        // Create choice cards with rarity styling
        this.currentChoices.forEach((build, index) => {
            const rarityConfig = this.rarityConfig[build.rarity] || this.rarityConfig.common;
            const card = document.createElement('div');
            card.className = 'build-card';
            card.style.borderColor = rarityConfig.borderColor;
            card.style.boxShadow = `0 0 15px ${rarityConfig.borderColor}`;
            
            // 神话品质特殊动画
            if (build.rarity === 'mythic') {
                card.style.animation = 'mythicGlow 1.5s ease-in-out infinite';
            }
            
            // 获取流派信息
            const weaponType = this.getBuildWeaponType(build);
            const weaponIcon = this.getWeaponIcon(weaponType);
            
            card.innerHTML = `
                <div class="build-weapon-type">${weaponIcon} ${weaponType}</div>
                <div class="build-rarity" style="color: ${rarityConfig.color}; text-shadow: 0 0 10px ${rarityConfig.color};">
                    ${rarityConfig.icon} ${rarityConfig.name}
                </div>
                <div class="build-name" style="color: ${rarityConfig.color}">${build.name}</div>
                <div class="build-desc">${build.desc}</div>
            `;
            card.onclick = () => this.selectBuild(index);
            choicesContainer.appendChild(card);
        });

        // Show panel
        panel.classList.remove('hidden');
        panel.style.display = 'flex';
    }

    selectBuild(index) {
        const selectedBuild = this.currentChoices[index];

        // Apply build
        selectedBuild.apply();
        this.appliedBuilds.push(selectedBuild.id);

        console.log(`Applied build: ${selectedBuild.name}`);

        // Hide UI
        const panel = document.getElementById('build-panel');
        if (panel) {
            panel.classList.add('hidden');
            panel.style.display = 'none';
        }

        this.isActive = false;

        // Resume game
        if (this.onBuildSelected) {
            this.onBuildSelected();
        }
    }
    
    // 获取构筑所属流派
    getBuildWeaponType(build) {
        if (build.id.startsWith('staff_') || build.id.startsWith('evo_staff_')) return '法杖';
        if (build.id.startsWith('ls_') || build.id.startsWith('evo_ls_')) return '长剑';
        if (build.id.startsWith('db_') || build.id.startsWith('evo_db_')) return '双刀';
        if (build.id.startsWith('uni_') || build.id.startsWith('evo_')) return '通用';
        return '通用';
    }
    
    // 获取流派图标
    getWeaponIcon(weaponType) {
        switch(weaponType) {
            case '法杖': return '🪄';
            case '长剑': return '🗡️';
            case '双刀': return '⚔️';
            case '通用': return '🔮';
            default: return '🔮';
        }
    }

    // Helper methods
    modifyWeaponStat(weaponName, stat, multiplier) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) {
            if (!weapon.buildModifiers) weapon.buildModifiers = {};
            weapon.buildModifiers[stat] = (weapon.buildModifiers[stat] || 1) * multiplier;

            // Apply modifier
            const baseStat = weapon[`base_${stat}`] || weapon[stat];
            weapon[`base_${stat}`] = baseStat;
            weapon[stat] = baseStat * weapon.buildModifiers[stat];

            console.log(`${weaponName} ${stat}: ${weapon[stat]}`);
        }
    }

    addProjectileCount(weaponName, count = 1) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.bonusProjectiles = (weapon.bonusProjectiles || 0) + count;
    }

    addSlashCount(weaponName, count = 1) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.bonusSlashes = (weapon.bonusSlashes || 0) + count;
    }

    enablePierce(weaponName) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.pierce = true;
    }

    enableCrit(weaponName, chance = 0.2, multiplier = 2.0) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) {
            weapon.critChance = Math.min(1, (weapon.critChance || 0) + chance);
            weapon.critMultiplier = Math.max(weapon.critMultiplier || 1, multiplier);
        }
    }

    enableLifesteal(weaponName, percent) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.lifesteal = (weapon.lifesteal || 0) + percent;
    }

    enableBleeding(weaponName) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.bleeding = true;
    }

    enableDodge(weaponName, chance = 0.1) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.dodgeChance = Math.min(0.8, (weapon.dodgeChance || 0) + chance);
    }

    enableChainLightning(weaponName) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.chainLightning = true;
    }

    enableFreeze(weaponName, amount = 0.4) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) { weapon.freezeEffect = true; weapon.slowAmount = amount; }
    }

    enableManaSteal(weaponName, amount) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.manaSteal = (weapon.manaSteal || 0) + amount;
    }

    enableStun(weaponName, chance) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) { weapon.stunChance = chance; weapon.stunDuration = 1.0; }
    }

    enableArmorPen(weaponName, amount) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.armorPenetration = amount;
    }

    enablePoison(weaponName) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.poisonEffect = true;
    }

    enableFury(weaponName, bonus = 0.8) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) { weapon.furyMode = true; weapon.furyBonus = bonus; }
    }

    enablePhantom(weaponName, chance = 0.3) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.phantomChance = chance;
    }

    enableRegeneration(amount) {
        this.player.regenRate = (this.player.regenRate || 0) + amount;
    }

    enableMeteorShower(weaponName) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) { weapon.meteorShower = true; weapon.meteorCount = 5; }
    }

    // 新增辅助方法
    enableBurn(weaponName) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.burnEffect = true;
    }

    enableCounter(weaponName, bonus) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) { weapon.counterAttack = true; weapon.counterBonus = bonus; }
    }

    enableShield(weaponName) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.shieldOnAttack = true;
    }

    enableExecute(weaponName, bonus = 1.0) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) { weapon.executeBonus = bonus; }
    }

    enableSwordWave(weaponName) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.swordWave = true;
    }

    enableCharge(weaponName) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.chargeAttack = true;
    }

    enableAura(weaponName) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.damageAura = true;
    }

    enableLifeDrain(weaponName) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) { weapon.lifeDrain = true; weapon.lifesteal = 0.4; }
    }

    enableShadowStep(weaponName) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.shadowStep = true;
    }

    enableDeathMark(weaponName) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.deathMark = true;
    }

    enableVoidPull(weaponName) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) weapon.voidPull = true;
    }
    
    // 修改所有武器的暴击属性
    modifyAllWeaponsCrit(critChanceBonus, critMultiplierBonus) {
        this.weaponSystem.weapons.forEach(weapon => {
            weapon.critChance = (weapon.critChance || 0.2) + critChanceBonus;
            weapon.critMultiplier = (weapon.critMultiplier || 2.0) + critMultiplierBonus;
        });
        console.log(`所有武器暴击: +${critChanceBonus * 100}%率, +${critMultiplierBonus * 100}%伤害`);
    }
    
    // 修改所有武器的吸血
    modifyAllWeaponsLifesteal(bonus) {
        this.weaponSystem.weapons.forEach(weapon => {
            weapon.lifesteal = (weapon.lifesteal || 0) + bonus;
        });
        console.log(`所有武器吸血: +${bonus * 100}%`);
    }
    
    // 修改所有武器的每击回血
    modifyAllWeaponsManaSteal(bonus) {
        this.weaponSystem.weapons.forEach(weapon => {
            weapon.manaSteal = (weapon.manaSteal || 0) + bonus;
        });
        console.log(`所有武器每击回血: +${bonus}`);
    }
    
    // 修改所有武器的伤害
    modifyAllWeaponsDamage(multiplier) {
        this.weaponSystem.weapons.forEach(weapon => {
            weapon.damage = (weapon.damage || 10) * multiplier;
        });
        console.log(`所有武器伤害: ×${multiplier}`);
    }
    
    // 修改所有武器的攻速
    modifyAllWeaponsSpeed(multiplier) {
        this.weaponSystem.weapons.forEach(weapon => {
            weapon.cooldown = (weapon.cooldown || 1) * multiplier;
        });
        console.log(`所有武器攻速: ×${1/multiplier}`);
    }
    
    // 修改所有武器的范围
    modifyAllWeaponsRange(multiplier) {
        this.weaponSystem.weapons.forEach(weapon => {
            weapon.range = (weapon.range || 50) * multiplier;
            if (weapon.aoeRadius) weapon.aoeRadius *= multiplier;
        });
        console.log(`所有武器范围: ×${multiplier}`);
    }
    
    // 修改单个武器的暴击
    enableCrit(weaponName, critChance, critMultiplier) {
        const weapon = this.weaponSystem.weapons.find(w => w.name === weaponName);
        if (weapon) {
            weapon.critChance = (weapon.critChance || 0.2) + critChance;
            weapon.critMultiplier = critMultiplier;
            console.log(`${weaponName} 暴击: ${weapon.critChance * 100}%率, ${weapon.critMultiplier}倍伤害`);
        }
    }
    
    // 获取武器进化信息
    getWeaponEvolutionInfo(weaponName) {
        return this.weaponEvolution[weaponName] || { path: null, level: 0 };
    }
}
