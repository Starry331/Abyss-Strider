/**
 * 武器进化系统 - 多分支进化路线
 * 每个武器有3条进化路线，每条路线有独特的外观和攻击方式
 */

export class WeaponEvolution {
    static getEvolutionPaths() {
        return {
            'Staff': {
                paths: [
                    {
                        id: 'elemental',
                        name: '元素之路',
                        description: '掌控元素之力',
                        stages: [
                            { level: 1, name: '学徒法杖', color: '#9b59b6', glowColor: '#e056fd' },
                            { level: 2, name: '元素法杖', color: '#3498db', glowColor: '#74b9ff' },
                            { level: 3, name: '风暴法杖', color: '#00cec9', glowColor: '#81ecec' },
                            { level: 4, name: '元素主宰', color: '#6c5ce7', glowColor: '#a29bfe' }
                        ],
                        bonuses: { damage: 1.4, aoeRadius: 1.3, elementalDamage: true }
                    },
                    {
                        id: 'summoner',
                        name: '召唤之路',
                        description: '召唤魔法生物助战',
                        stages: [
                            { level: 1, name: '学徒法杖', color: '#9b59b6', glowColor: '#e056fd' },
                            { level: 2, name: '召唤法杖', color: '#2ecc71', glowColor: '#55efc4' },
                            { level: 3, name: '灵魂法杖', color: '#00b894', glowColor: '#00d2d3' },
                            { level: 4, name: '至高召唤', color: '#ffd700', glowColor: '#fff200' }
                        ],
                        bonuses: { summonOrbs: 3, orbDamage: 0.5, projectileCount: 2 }
                    },
                    {
                        id: 'destruction',
                        name: '毁灭之路',
                        description: '纯粹的破坏力量',
                        stages: [
                            { level: 1, name: '学徒法杖', color: '#9b59b6', glowColor: '#e056fd' },
                            { level: 2, name: '爆破法杖', color: '#e74c3c', glowColor: '#ff6b6b' },
                            { level: 3, name: '陨星法杖', color: '#ff6348', glowColor: '#ff7f50' },
                            { level: 4, name: '毁灭权杖', color: '#d63031', glowColor: '#ff4757' }
                        ],
                        bonuses: { damage: 1.8, explosionRadius: 1.5, meteorShower: true }
                    }
                ]
            },
            'Longsword': {
                paths: [
                    {
                        id: 'holy',
                        name: '圣光之路',
                        description: '神圣力量净化邪恶',
                        stages: [
                            { level: 1, name: '铁剑', color: '#bdc3c7', glowColor: '#dfe6e9' },
                            { level: 2, name: '白银剑', color: '#f5f6fa', glowColor: '#ffffff' },
                            { level: 3, name: '圣光剑', color: '#ffd700', glowColor: '#fff200' },
                            { level: 4, name: '神圣裁决', color: '#f9ca24', glowColor: '#ffeaa7' }
                        ],
                        bonuses: { damage: 1.5, holySmite: true, healOnHit: 5, range: 1.2 }
                    },
                    {
                        id: 'shadow',
                        name: '暗影之路',
                        description: '暗影力量吞噬一切',
                        stages: [
                            { level: 1, name: '铁剑', color: '#bdc3c7', glowColor: '#dfe6e9' },
                            { level: 2, name: '暗铁剑', color: '#636e72', glowColor: '#b2bec3' },
                            { level: 3, name: '噬魂剑', color: '#2d3436', glowColor: '#6c5ce7' },
                            { level: 4, name: '深渊之刃', color: '#130f40', glowColor: '#5f27cd' }
                        ],
                        bonuses: { damage: 1.6, lifesteal: 0.25, shadowStrike: true, critChance: 0.3 }
                    },
                    {
                        id: 'titan',
                        name: '巨人之路',
                        description: '压倒性的力量与范围',
                        stages: [
                            { level: 1, name: '铁剑', color: '#bdc3c7', glowColor: '#dfe6e9' },
                            { level: 2, name: '阔剑', color: '#7f8c8d', glowColor: '#95a5a6' },
                            { level: 3, name: '斩马剑', color: '#c0392b', glowColor: '#e74c3c' },
                            { level: 4, name: '泰坦巨剑', color: '#d35400', glowColor: '#e67e22' }
                        ],
                        bonuses: { damage: 1.3, range: 1.6, arc: 1.4, knockback: true, slowAttack: 1.3 }
                    }
                ]
            },
            'Dual Blades': {
                paths: [
                    {
                        id: 'assassin',
                        name: '刺客之路',
                        description: '致命的暗杀技巧',
                        stages: [
                            { level: 1, name: '短刃', color: '#e74c3c', glowColor: '#ff6b6b' },
                            { level: 2, name: '刺客匕首', color: '#8e44ad', glowColor: '#9b59b6' },
                            { level: 3, name: '暗影双刃', color: '#2c3e50', glowColor: '#34495e' },
                            { level: 4, name: '死神镰刀', color: '#1a1a2e', glowColor: '#6c5ce7' }
                        ],
                        bonuses: { critChance: 0.5, critDamage: 3.0, backstab: true, invisibility: true }
                    },
                    {
                        id: 'berserker',
                        name: '狂战之路',
                        description: '战斗狂热无尽斩击',
                        stages: [
                            { level: 1, name: '短刃', color: '#e74c3c', glowColor: '#ff6b6b' },
                            { level: 2, name: '战斧双刃', color: '#c0392b', glowColor: '#e74c3c' },
                            { level: 3, name: '狂战双斧', color: '#a93226', glowColor: '#d63031' },
                            { level: 4, name: '血腥狂怒', color: '#7b241c', glowColor: '#c0392b' }
                        ],
                        bonuses: { attackSpeed: 2.0, slashCount: 4, furyMode: true, damageOnLowHp: 2.0 }
                    },
                    {
                        id: 'venom',
                        name: '剧毒之路',
                        description: '致命毒素侵蚀敌人',
                        stages: [
                            { level: 1, name: '短刃', color: '#e74c3c', glowColor: '#ff6b6b' },
                            { level: 2, name: '淬毒匕首', color: '#27ae60', glowColor: '#2ecc71' },
                            { level: 3, name: '剧毒双刃', color: '#1abc9c', glowColor: '#16a085' },
                            { level: 4, name: '瘟疫之触', color: '#006266', glowColor: '#009432' }
                        ],
                        bonuses: { poisonDamage: 15, poisonDuration: 5, spreadPoison: true, weakenEnemy: 0.3 }
                    }
                ]
            }
        };
    }

    static getEvolutionStage(weaponName, pathId, evolutionLevel) {
        const paths = this.getEvolutionPaths()[weaponName];
        if (!paths) return null;
        
        const path = paths.paths.find(p => p.id === pathId);
        if (!path) return null;
        
        const stageIndex = Math.min(evolutionLevel, path.stages.length - 1);
        return {
            ...path.stages[stageIndex],
            pathName: path.name,
            bonuses: path.bonuses
        };
    }

    static getAvailablePaths(weaponName) {
        const paths = this.getEvolutionPaths()[weaponName];
        return paths ? paths.paths : [];
    }
}
