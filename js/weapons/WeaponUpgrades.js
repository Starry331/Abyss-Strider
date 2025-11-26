/**
 * Weapon Upgrade System
 * Defines 6-tier progression for each weapon (balanced)
 */

export class WeaponUpgrades {
    static MAX_LEVEL = 6;
    
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
                    { level: 6, name: '奥术法杖', description: '3发+连锁', projectileCount: 3, damage: 13, aoeRadius: 70, cooldownMult: 1.4, pierce: true, chainLightning: true }
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
                    { level: 6, name: '圣剑', description: '三连斩+冲击波', slashCount: 3, damage: 16, range: 72, arc: Math.PI / 2.4, cooldownMult: 1.65, shockwave: true }
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
                    { level: 5, name: '影刃', description: '三斩', slashCount: 3, damage: 9, range: 58, cooldownMult: 1.22, bleed: true, lifesteal: 0 },
                    { level: 6, name: '死神刃', description: '四斩+吸血', slashCount: 4, damage: 10, range: 58, cooldownMult: 1.35, bleed: true, lifesteal: 0.02 }
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
