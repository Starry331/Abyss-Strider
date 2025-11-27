/**
 * Weapon Upgrade System
 * Defines 8-tier progression for each weapon (Lv7-8 only in Boss Rush)
 */

export class WeaponUpgrades {
    static MAX_LEVEL = 6;          // 普通模式最大等级
    static BOSS_RUSH_MAX_LEVEL = 8; // Boss战模式最大等级
    
    static getUpgradeData() {
        return {
            'Staff': {
                name: '法杖',
                icon: '🪄',
                tiers: [
                    { level: 1, name: '学徒法杖', description: '单发魔法弹', projectileCount: 1, damage: 10, aoeRadius: 50, cooldownMult: 0.85, pierce: false, chainLightning: false },
                    { level: 2, name: '魔法法杖', description: '伤害+20%', projectileCount: 1, damage: 12, aoeRadius: 58, cooldownMult: 0.75, pierce: false, chainLightning: false },
                    { level: 3, name: '强化法杖', description: 'AOE+15%', projectileCount: 1, damage: 14, aoeRadius: 65, cooldownMult: 0.70, pierce: false, chainLightning: false },
                    { level: 4, name: '双发法杖', description: '2发弹', projectileCount: 2, damage: 11, aoeRadius: 60, cooldownMult: 1.15, pierce: false, chainLightning: false },
                    { level: 5, name: '穿透法杖', description: '穿透敌人', projectileCount: 2, damage: 12, aoeRadius: 65, cooldownMult: 1.25, pierce: true, chainLightning: false },
                    { level: 6, name: '奥术法杖', description: '3发+连锁', projectileCount: 3, damage: 13, aoeRadius: 70, cooldownMult: 1.4, pierce: true, chainLightning: true },
                    // Boss战专属
                    { level: 7, name: '元素风暴', description: '4发+大AOE', projectileCount: 4, damage: 15, aoeRadius: 85, cooldownMult: 1.3, pierce: true, chainLightning: true, bossRushOnly: true },
                    { level: 8, name: '神谕法杖', description: '5发+毁灭', projectileCount: 5, damage: 18, aoeRadius: 100, cooldownMult: 1.2, pierce: true, chainLightning: true, meteor: true, bossRushOnly: true }
                ]
            },
            'Longsword': {
                name: '长剑',
                icon: '🗡️',
                tiers: [
                    { level: 1, name: '铁剑', description: '单次斩击', slashCount: 1, damage: 13, range: 78, arc: Math.PI / 2, cooldownMult: 1.15, shockwave: false },
                    { level: 2, name: '钢剑', description: '伤害+8%', slashCount: 1, damage: 13, range: 80, arc: Math.PI / 2, cooldownMult: 1.15, shockwave: false },
                    { level: 3, name: '利刃', description: '范围+5%', slashCount: 1, damage: 14, range: 82, arc: Math.PI / 2.1, cooldownMult: 1.2, shockwave: false },
                    { level: 4, name: '双斩剑', description: '双重斩击', slashCount: 2, damage: 13, range: 78, arc: Math.PI / 2.2, cooldownMult: 1.3, shockwave: false },
                    { level: 5, name: '重剑', description: '重击伤害', slashCount: 2, damage: 15, range: 75, arc: Math.PI / 2.3, cooldownMult: 1.45, shockwave: false },
                    { level: 6, name: '圣剑', description: '三连斩+冲击波', slashCount: 3, damage: 16, range: 72, arc: Math.PI / 2.4, cooldownMult: 1.65, shockwave: true },
                    // Boss战专属
                    { level: 7, name: '雷霆之剑', description: '四连斩+雷电', slashCount: 4, damage: 18, range: 85, arc: Math.PI / 2, cooldownMult: 1.5, shockwave: true, lightning: true, bossRushOnly: true },
                    { level: 8, name: '神圣审判', description: '五连斩+神罚', slashCount: 5, damage: 22, range: 95, arc: Math.PI / 1.8, cooldownMult: 1.4, shockwave: true, lightning: true, holySmite: true, bossRushOnly: true }
                ]
            },
            'Dual Blades': {
                name: '双刀',
                icon: '⚔️',
                tiers: [
                    { level: 1, name: '短刃', description: '快速单斩', slashCount: 1, damage: 7, range: 58, cooldownMult: 1.0, bleed: false, lifesteal: 0 },
                    { level: 2, name: '双刃', description: '伤害+10%', slashCount: 1, damage: 8, range: 58, cooldownMult: 1.0, bleed: false, lifesteal: 0 },
                    { level: 3, name: '锋刃', description: '范围+5%', slashCount: 1, damage: 8, range: 60, cooldownMult: 1.0, bleed: false, lifesteal: 0 },
                    { level: 4, name: '血刃', description: '双斩+流血', slashCount: 2, damage: 8, range: 60, cooldownMult: 1.12, bleed: true, lifesteal: 0 },
                    { level: 5, name: '影刃', description: '双斩强化', slashCount: 2, damage: 9, range: 56, cooldownMult: 1.35, bleed: true, lifesteal: 0 },
                    { level: 6, name: '死神刃', description: '三斩+吸血', slashCount: 3, damage: 9, range: 55, cooldownMult: 1.5, bleed: true, lifesteal: 0.015 },
                    // Boss战专属
                    { level: 7, name: '暗影之舞', description: '四斩+分身', slashCount: 4, damage: 11, range: 62, cooldownMult: 1.35, bleed: true, lifesteal: 0.02, phantom: true, bossRushOnly: true },
                    { level: 8, name: '死神镰刀', description: '五斩+处决', slashCount: 5, damage: 14, range: 70, cooldownMult: 1.2, bleed: true, lifesteal: 0.03, phantom: true, execute: true, bossRushOnly: true }
                ]
            }
        };
    }

    static getUpgradeForWeapon(weaponName, level) {
        const data = this.getUpgradeData();
        const weaponData = data[weaponName];
        if (!weaponData) return null;

        const tierIndex = Math.min(level - 1, weaponData.tiers.length - 1);
        return weaponData.tiers[tierIndex];
    }

    static getUpgradeDescription(weaponName, level) {
        const upgrade = this.getUpgradeForWeapon(weaponName, level);
        if (!upgrade) return '';

        return `${upgrade.name}\n${upgrade.description}`;
    }
}
