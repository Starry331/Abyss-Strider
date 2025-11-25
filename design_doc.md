# Design Document: Abyss Strider (深渊行者)

## 1. Game Overview
**Title:** 深渊行者 (Abyss Strider)
**Genre:** 2D Roguelike Action
**Platform:** Web (HTML5 Canvas), Desktop (Keyboard) & Mobile (Touch)
**Core Loop:** Explore levels -> Fight enemies -> Score points -> Spawn Boss -> Defeat Boss -> Choose Blessing -> Next Level.

## 2. Controls & Input
### Keyboard
- **Movement:** WASD
- **Attack:** Auto-attacks towards facing direction.
- **Switch Weapon:** Q or Tab
- **Block:** J (Hold for 2s max, 60% dmg reduction, no attack while blocking).
- **Roll:** K (Forward dash, invincibility frames).

### Touch (Mobile)
- **Movement:** Left Virtual Joystick.
- **Actions:** Right side buttons.
    - **Block:** Button labeled "格挡" (Block).
    - **Roll:** Button labeled "翻滚" (Roll).
    - **Switch Weapon:** Button labeled "切换" (Switch).

## 3. Weapons
| Weapon | Type | Range | Speed | Damage | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Staff (法杖)** | Ranged | High | Slow | High | Shoots projectiles. Large AOE. |
| **Longsword (长剑)** | Melee | Medium | Medium | High | Balanced melee weapon. |
| **Dual Blades (双刀)** | Melee | Short | Fast | High | Rapid attacks, close quarters. |

## 4. Player Stats
- **HP:** 100 (UI: "血条 HP:100")
- **Progression:** Blessings (赐福) acquired after defeating bosses.

## 5. Enemies
| Type | Name (CN) | Spawn Rate | HP | Dmg | Range | Score |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Common** | 普通怪物 | 70% | Low | 5 | Small | 40 |
| **Elite** | 精英怪物 | 20% | Med | 15 | Med | 75 |
| **Large** | 大怪物 | 10% | High | 20 | Med | 150 |

*Random Health Packs spawn with low probability.*

## 6. Levels & Bosses
**Boss Spawning Logic:** Score thresholds trigger bosses.
- **Score 1000:** Level 1 Boss
- **Score 2500:** Level 2 Boss
- **Score 4500:** Level 3 Boss
- **Score 7000:** Level 4 Boss

**Levels:**
1. **Level 1:** “深暗地牢” (Deep Dark Dungeon) - Dark grey/black.
2. **Level 2:** “冰封雪山” (Frozen Snow Mountain) - Cold blue/icy.
3. **Level 3:** “地狱回廊” (Hell Corridor) - Dark red, smoke.
4. **Level 4:** “岩浆地带” (Magma Zone) - Deep red/orange glow.
5. **Level 5:** “圣殿” (Sanctuary) - Sacred warm tones.

**Boss Mechanics:**
- **Warning:** UI shows “警告！Boss 即将出现！” (Warning! Boss Approaching!).
- **Phases:** Multi-stage attacks based on HP.
- **Telegraphs:** Visual indicators before big attacks.
- **Reward:** 3 Random Blessings (赐福).
- **Transition:** Clear enemies -> Teleport to next level.

## 7. UI & Localization
**Language:** Chinese (Simplified)
**Strings:**
- **Game Title:** 深渊行者 (Abyss Strider)
- **Menu Buttons:** “开始” (Start), “继续” (Continue), “教程” (Tutorial), “设置” (Settings), “排行榜” (Leaderboard), “退出” (Exit).
- **HUD:** “血条 HP:100” (Health), Level Name (e.g., “深暗地牢”).
- **Tutorial:**
    - WASD / 摇杆 (Joystick)
    - J / 格挡 (Block)
    - K / 翻滚 (Roll)
    - Q/Tab / 切换 (Switch Weapon)
- **Boss Warning:** “警告！Boss 即将出现！”
- **Blessing Title:** “赐福选择”

## 8. Polish (Juice)
- **Screen Shake:** On player hit / heavy impact.
- **Floating Text:** Damage numbers (“伤害飘字”).
- **Hit Flash:** White flash on hit (“受击闪白”).
- **Particles:** Attacks, blocks, boss skills.
- **Lighting:** Global tint changes per level.

## 9. Save & Leaderboard
- **Local Save:** Saves current run (HP, Score, Level, Blessings).
- **Leaderboard:** “排行榜” - Top N scores.
- **Format:** JSON (Name, Score, Level, Timestamp).

## 10. Technical Architecture
**Modules:**
- `main/`: Game loop, Scene management.
- `input/`: Input handling.
- `player/`: Player logic.
- `combat/`: Damage, hitboxes.
- `weapons/`: Weapon data.
- `enemies/`: AI, Spawning.
- `levels/`: Level generation/themes.
- `ui/`: Rendering UI.
- `effects/`: Particles, Shake.
- `save/`: Persistence.
