/* =========================================================================
       DATA & CONSTANTS
       ========================================================================= */

    const ELEMENTS = {
        Physical: 'Physical', Fire: 'Fire', Water: 'Water', Earth: 'Earth',
        Wind: 'Wind', Light: 'Light', Dark: 'Dark'
    };

    const ELEMENT_MODS = {
        'Earth': { weakTo: 'Fire', resists: 'Wind' },
        'Wind': { weakTo: 'Earth', resists: 'Water' },
        'Water': { weakTo: 'Wind', resists: 'Fire' },
        'Fire': { weakTo: 'Water', resists: 'Earth' },
        'Light': { weakTo: 'Dark', resists: 'Light' },
        'Dark': { weakTo: 'Light', resists: 'Dark' }
    };

    function getElementalMultiplier(atkElement, defElement) {
        if (atkElement === ELEMENTS.Physical) return 1.0;
        if (!ELEMENT_MODS[defElement]) return 1.0;
        
        let weakMult = playerHasPassive('elemental_overcharge') ? 2.0 : 1.5;
        if (ELEMENT_MODS[defElement].weakTo === atkElement) return weakMult;
        if (ELEMENT_MODS[defElement].resists === atkElement) return 0.5;
        return 1.0;
    }

    const SVG_SPRITES = {
        'Ember Slime': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M20,80 Q50,20 80,80 Z" fill="#ff4500"/><circle cx="40" cy="65" r="5" fill="#fff"/><circle cx="60" cy="65" r="5" fill="#fff"/></svg>`,
        'Tide Slime': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M10,80 Q50,30 90,80 Z" fill="#1e90ff"/><circle cx="35" cy="65" r="5" fill="#fff"/><circle cx="65" cy="65" r="5" fill="#fff"/></svg>`,
        'Stone Golem': `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="25" y="20" width="50" height="60" fill="#8b4513"/><rect x="10" y="30" width="15" height="40" fill="#6b3513"/><rect x="75" y="30" width="15" height="40" fill="#6b3513"/><circle cx="35" cy="35" r="4" fill="#0f0"/><circle cx="65" cy="35" r="4" fill="#0f0"/></svg>`,
        'Gale Wolf': `<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="20,80 40,40 50,50 70,30 90,80" fill="#778899"/><circle cx="60" cy="55" r="3" fill="#0ff"/></svg>`,
        'Shadow Bat': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50,40 Q20,10 10,50 Q30,70 50,60 Q70,70 90,50 Q80,10 50,40" fill="#4b0082"/><circle cx="40" cy="45" r="4" fill="#f00"/><circle cx="60" cy="45" r="4" fill="#f00"/></svg>`,
        'Light Wisp': `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="30" fill="#ffd700"/><circle cx="50" cy="50" r="20" fill="#fff"/></svg>`,
        'Venom Spider': `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="60" r="25" fill="#2e8b57"/><line x1="25" y1="60" x2="5" y2="40" stroke="#2e8b57" stroke-width="4"/><line x1="75" y1="60" x2="95" y2="40" stroke="#2e8b57" stroke-width="4"/><circle cx="40" cy="55" r="3" fill="#f00"/><circle cx="60" cy="55" r="3" fill="#f00"/></svg>`,
        'Frost Knight': `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="35" y="20" width="30" height="60" fill="#add8e6"/><polygon points="35,20 50,5 65,20" fill="#87ceeb"/><rect x="25" y="30" width="10" height="40" fill="#fff"/><circle cx="45" cy="30" r="3" fill="#00f"/><circle cx="55" cy="30" r="3" fill="#00f"/></svg>`,
        'Thunder Harpy': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50,20 L30,60 L50,80 L70,60 Z" fill="#daa520"/><path d="M30,60 Q10,30 20,20" stroke="#daa520" stroke-width="5" fill="none"/><path d="M70,60 Q90,30 80,20" stroke="#daa520" stroke-width="5" fill="none"/></svg>`,
        'Abyssal Wraith': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M30,90 Q50,10 70,90 Q60,70 50,90 Q40,70 30,90 Z" fill="#191970"/><circle cx="45" cy="40" r="4" fill="#8a2be2"/><circle cx="55" cy="40" r="4" fill="#8a2be2"/></svg>`,
        'Infernal Dragon': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M10,90 L40,20 L60,20 L90,90 L70,70 L50,90 L30,70 Z" fill="#8b0000"/><circle cx="45" cy="35" r="5" fill="#ff4500"/><circle cx="55" cy="35" r="5" fill="#ff4500"/></svg>`,
        'Void Guardian': `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="45" fill="#000" stroke="#800080" stroke-width="5"/><circle cx="50" cy="30" r="8" fill="#fff"/><circle cx="30" cy="60" r="6" fill="#fff"/><circle cx="70" cy="60" r="6" fill="#fff"/></svg>`,
        // Area 1 Boss: Elder Treant
        'Elder Treant': `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="35" y="40" width="30" height="50" fill="#5c3818"/><circle cx="50" cy="35" r="35" fill="#2d6a2d"/><circle cx="40" cy="50" r="4" fill="#00ff66"/><circle cx="60" cy="50" r="4" fill="#00ff66"/></svg>`,
        // Area 2 Enemies & Boss
        'Cave Bat': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50,40 Q20,10 10,50 Q30,70 50,60 Q70,70 90,50 Q80,10 50,40" fill="#2a4365"/><circle cx="40" cy="45" r="4" fill="#00ffff"/><circle cx="60" cy="45" r="4" fill="#00ffff"/></svg>`,
        'Abyssal Lurker': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M15,75 Q50,15 85,75 Q50,60 15,75 Z" fill="#005577"/><circle cx="40" cy="50" r="5" fill="#00ffff"/><circle cx="60" cy="50" r="5" fill="#00ffff"/></svg>`,
        'Leviathan Drake': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M10,85 Q30,10 50,40 Q70,10 90,85 Q50,70 10,85 Z" fill="#0077aa"/><circle cx="40" cy="40" r="6" fill="#ffff00"/><circle cx="60" cy="40" r="6" fill="#ffff00"/></svg>`,
        // Area 3 Enemies & Boss
        'Storm Wisp': `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="32" fill="#ffd700"/><circle cx="50" cy="50" r="22" fill="#00ffff"/><circle cx="50" cy="50" r="12" fill="#ffffff"/></svg>`,
        'Gale Stalker': `<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="15,85 45,35 55,45 75,25 90,85" fill="#4a6984"/><circle cx="65" cy="50" r="4" fill="#00ffcc"/></svg>`,
        'Mountain Golem': `<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="20,90 35,30 65,30 80,90" fill="#64748b"/><polygon points="40,30 50,10 60,30" fill="#94a3b8"/><circle cx="42" cy="45" r="4" fill="#38bdf8"/><circle cx="58" cy="45" r="4" fill="#38bdf8"/></svg>`,
        'Tempest Wyvern': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M10,80 L35,15 L50,40 L65,15 L90,80 L50,65 Z" fill="#0d9488"/><circle cx="42" cy="35" r="6" fill="#ffd700"/><circle cx="58" cy="35" r="6" fill="#ffd700"/></svg>`,
        // Area 4 Enemies & Boss
        'Magma Slime': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M15,80 Q50,15 85,80 Z" fill="#dc2626"/><circle cx="38" cy="65" r="6" fill="#fbbf24"/><circle cx="62" cy="65" r="6" fill="#fbbf24"/></svg>`,
        'Flame Hound': `<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="20,85 40,35 55,50 75,25 90,85" fill="#ea580c"/><circle cx="65" cy="50" r="4" fill="#fef08a"/></svg>`,
        'Infernal Knight': `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="30" y="20" width="40" height="60" fill="#7f1d1d"/><polygon points="30,20 50,5 70,20" fill="#b91c1c"/><circle cx="42" cy="32" r="4" fill="#fb923c"/><circle cx="58" cy="32" r="4" fill="#fb923c"/></svg>`,
        'Fire Drake': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M15,85 L45,25 L55,40 L85,85 Z" fill="#b91c1c"/><circle cx="45" cy="45" r="5" fill="#facc15"/><circle cx="60" cy="45" r="5" fill="#facc15"/></svg>`,
        // Area 5 Enemies & Boss
        'Void Horror': `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="40" fill="#1e1b4b" stroke="#7c3aed" stroke-width="4"/><circle cx="40" cy="45" r="5" fill="#c084fc"/><circle cx="60" cy="45" r="5" fill="#c084fc"/><circle cx="50" cy="65" r="6" fill="#a855f7"/></svg>`,
        'Nether Knight': `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="30" y="20" width="40" height="60" fill="#2e1065"/><polygon points="30,20 50,5 70,20" fill="#581c87"/><circle cx="42" cy="32" r="4" fill="#c084fc"/><circle cx="58" cy="32" r="4" fill="#c084fc"/></svg>`
    };
    /* =========================================================================
       5-ZONE PROGRESSION DATABASE (AREAS_DB)
       ========================================================================= */

    const AREAS_DB = {
        area_1: {
            id: 'area_1',
            name: 'Whispering Woods',
            bracket: 'Lv 1-5',
            minLevel: 1,
            maxLevel: 5,
            element: 'Earth',
            themeColor: '#4ade80',
            bgGradient: 'linear-gradient(135deg, #1a2e1a 0%, #2e3d24 100%)',
            desc: 'Verdant woodland teeming with animated flora and earth elementals.',
            regularEnemies: [
                { name: 'Ember Slime', level: 1, element: 'Fire', hp: 30, atk: 12, def: 5, matk: 15, mdef: 8, spd: 8, exp: 8, gold: 3, ai: 'magic', loot: [{ item: 'Potion', chance: 0.3 }] },
                { name: 'Gale Wolf', level: 2, element: 'Wind', hp: 45, atk: 16, def: 6, matk: 8, mdef: 6, spd: 15, exp: 12, gold: 5, ai: 'fast', loot: [{ item: 'Leather Boots', chance: 0.15 }, { item: 'Potion', chance: 0.25 }] },
                { name: 'Stone Golem', level: 3, element: 'Earth', hp: 60, atk: 18, def: 15, matk: 5, mdef: 5, spd: 4, exp: 15, gold: 6, ai: 'tank', loot: [{ item: 'Leather Cap', chance: 0.15 }, { item: 'Wooden Sword', chance: 0.2 }] },
                { name: 'Venom Spider', level: 4, element: 'Earth', hp: 50, atk: 14, def: 10, matk: 15, mdef: 10, spd: 14, exp: 16, gold: 8, ai: 'debuffer', loot: [{ item: 'Leather Gloves', chance: 0.15 }, { item: 'Cloth Armor', chance: 0.2 }] }
            ],
            boss: {
                name: 'Elder Treant',
                level: 5,
                element: 'Earth',
                hp: 220,
                atk: 25,
                def: 14,
                matk: 20,
                mdef: 12,
                spd: 10,
                exp: 100,
                gold: 60,
                ai: 'boss',
                isBoss: true,
                loot: [{ item: 'Bronze Sword', chance: 1.0 }, { item: 'Hi-Potion', chance: 0.5 }]
            },
            lootQuality: ['Wooden Sword', 'Cloth Armor', 'Leather Cap', 'Leather Gloves', 'Leather Boots']
        },
        area_2: {
            id: 'area_2',
            name: 'Sunken Caverns',
            bracket: 'Lv 6-10',
            minLevel: 6,
            maxLevel: 10,
            element: 'Water',
            themeColor: '#38bdf8',
            bgGradient: 'linear-gradient(135deg, #0d223a 0%, #16324a 100%)',
            desc: 'Subterranean grottoes flooded with icy, crystal-clear glacial waters.',
            regularEnemies: [
                { name: 'Tide Slime', level: 6, element: 'Water', hp: 85, atk: 20, def: 12, matk: 22, mdef: 14, spd: 8, exp: 20, gold: 10, ai: 'balanced', loot: [{ item: 'Ether', chance: 0.3 }] },
                { name: 'Cave Bat', level: 7, element: 'Dark', hp: 95, atk: 24, def: 14, matk: 18, mdef: 12, spd: 18, exp: 24, gold: 12, ai: 'fast', loot: [{ item: 'Leather Boots', chance: 0.2 }] },
                { name: 'Frost Knight', level: 8, element: 'Water', hp: 140, atk: 28, def: 20, matk: 24, mdef: 18, spd: 10, exp: 32, gold: 15, ai: 'tank', loot: [{ item: 'Iron Helm', chance: 0.15 }, { item: 'Iron Gauntlets', chance: 0.15 }] },
                { name: 'Abyssal Lurker', level: 9, element: 'Water', hp: 160, atk: 32, def: 18, matk: 30, mdef: 22, spd: 14, exp: 38, gold: 18, ai: 'magic', loot: [{ item: 'Bronze Sword', chance: 0.2 }, { item: 'Leather Armor', chance: 0.2 }] }
            ],
            boss: {
                name: 'Leviathan Drake',
                level: 10,
                element: 'Water',
                hp: 550,
                atk: 42,
                def: 22,
                matk: 40,
                mdef: 25,
                spd: 14,
                exp: 250,
                gold: 150,
                ai: 'boss',
                isBoss: true,
                loot: [{ item: 'Iron Sword', chance: 1.0 }, { item: 'Hi-Potion', chance: 0.8 }]
            },
            lootQuality: ['Bronze Sword', 'Leather Armor', 'Iron Helm', 'Iron Gauntlets']
        },
        area_3: {
            id: 'area_3',
            name: 'Howling Peaks',
            bracket: 'Lv 11-15',
            minLevel: 11,
            maxLevel: 15,
            element: 'Wind',
            themeColor: '#eab308',
            bgGradient: 'linear-gradient(135deg, #1a2636 0%, #2a3b4c 100%)',
            desc: 'Storm-battered alpine summits roamed by tempest predators and lightning beasts.',
            regularEnemies: [
                { name: 'Thunder Harpy', level: 11, element: 'Wind', hp: 180, atk: 35, def: 22, matk: 38, mdef: 20, spd: 22, exp: 45, gold: 22, ai: 'magic', loot: [{ item: 'Hi-Potion', chance: 0.35 }] },
                { name: 'Storm Wisp', level: 12, element: 'Light', hp: 210, atk: 38, def: 24, matk: 42, mdef: 25, spd: 16, exp: 52, gold: 25, ai: 'healer', loot: [{ item: 'Ether', chance: 0.4 }] },
                { name: 'Gale Stalker', level: 13, element: 'Wind', hp: 260, atk: 44, def: 26, matk: 35, mdef: 24, spd: 20, exp: 60, gold: 30, ai: 'fast', loot: [{ item: 'Speed Boots', chance: 0.2 }, { item: 'Mystic Circlet', chance: 0.15 }] },
                { name: 'Mountain Golem', level: 14, element: 'Earth', hp: 320, atk: 48, def: 30, matk: 25, mdef: 32, spd: 12, exp: 70, gold: 35, ai: 'tank', loot: [{ item: 'Iron Armor', chance: 0.2 }, { item: 'Iron Sword', chance: 0.2 }] }
            ],
            boss: {
                name: 'Tempest Wyvern',
                level: 15,
                element: 'Wind',
                hp: 950,
                atk: 60,
                def: 32,
                matk: 65,
                mdef: 30,
                spd: 20,
                exp: 500,
                gold: 300,
                ai: 'boss',
                isBoss: true,
                loot: [{ item: 'Speed Boots', chance: 1.0 }, { item: 'Mystic Circlet', chance: 0.8 }]
            },
            lootQuality: ['Iron Sword', 'Iron Armor', 'Speed Boots', 'Mystic Circlet']
        },
        area_4: {
            id: 'area_4',
            name: 'Infernal Caldera',
            bracket: 'Lv 16-20',
            minLevel: 16,
            maxLevel: 20,
            element: 'Fire',
            themeColor: '#fb923c',
            bgGradient: 'linear-gradient(135deg, #33140d 0%, #4a1c10 100%)',
            desc: 'A volatile volcanic crater flowing with boiling rivers of magma.',
            regularEnemies: [
                { name: 'Magma Slime', level: 16, element: 'Fire', hp: 380, atk: 55, def: 35, matk: 60, mdef: 35, spd: 14, exp: 85, gold: 42, ai: 'magic', loot: [{ item: 'Hi-Potion', chance: 0.4 }] },
                { name: 'Flame Hound', level: 17, element: 'Fire', hp: 440, atk: 62, def: 38, matk: 55, mdef: 38, spd: 22, exp: 95, gold: 48, ai: 'fast', loot: [{ item: 'Iron Greaves', chance: 0.2 }] },
                { name: 'Infernal Knight', level: 18, element: 'Fire', hp: 530, atk: 68, def: 44, matk: 65, mdef: 42, spd: 16, exp: 110, gold: 55, ai: 'tank', loot: [{ item: 'Iron Armor', chance: 0.25 }, { item: 'Silk Bracers', chance: 0.2 }] },
                { name: 'Fire Drake', level: 19, element: 'Fire', hp: 620, atk: 75, def: 46, matk: 78, mdef: 48, spd: 24, exp: 130, gold: 65, ai: 'balanced', loot: [{ item: 'Ring of Vigor', chance: 0.2 }, { item: 'Iron Sword', chance: 0.25 }] }
            ],
            boss: {
                name: 'Infernal Dragon',
                level: 20,
                element: 'Fire',
                hp: 1800,
                atk: 88,
                def: 48,
                matk: 90,
                mdef: 45,
                spd: 22,
                exp: 1000,
                gold: 600,
                ai: 'boss',
                isBoss: true,
                loot: [{ item: 'Ring of Vigor', chance: 1.0 }, { item: 'Iron Armor', chance: 1.0 }]
            },
            lootQuality: ['Iron Sword', 'Iron Armor', 'Ring of Vigor', 'Iron Greaves', 'Silk Bracers']
        },
        area_5: {
            id: 'area_5',
            name: 'Abyssal Void',
            bracket: 'Lv 21-25+',
            minLevel: 21,
            maxLevel: 25,
            element: 'Dark',
            themeColor: '#c084fc',
            bgGradient: 'linear-gradient(135deg, #1a0f2e 0%, #2d1445 100%)',
            desc: 'The celestial edge of reality where cosmic void and chaotic dark matter reign.',
            regularEnemies: [
                { name: 'Shadow Bat', level: 21, element: 'Dark', hp: 700, atk: 80, def: 50, matk: 85, mdef: 50, spd: 26, exp: 160, gold: 80, ai: 'fast', loot: [{ item: 'Hi-Potion', chance: 0.5 }] },
                { name: 'Abyssal Wraith', level: 22, element: 'Dark', hp: 820, atk: 88, def: 54, matk: 105, mdef: 62, spd: 18, exp: 185, gold: 95, ai: 'magic', loot: [{ item: 'Magic Staff', chance: 0.3 }] },
                { name: 'Void Horror', level: 23, element: 'Dark', hp: 950, atk: 98, def: 60, matk: 95, mdef: 58, spd: 20, exp: 215, gold: 110, ai: 'balanced', loot: [{ item: 'Amulet of Mana', chance: 0.25 }] },
                { name: 'Nether Knight', level: 24, element: 'Dark', hp: 1100, atk: 110, def: 68, matk: 120, mdef: 70, spd: 16, exp: 250, gold: 130, ai: 'tank', loot: [{ item: 'Iron Armor', chance: 0.3 }, { item: 'Speed Boots', chance: 0.3 }] }
            ],
            boss: {
                name: 'Void Guardian',
                level: 25,
                element: 'Dark',
                hp: 3200,
                atk: 135,
                def: 65,
                matk: 140,
                mdef: 60,
                spd: 24,
                exp: 2500,
                gold: 1500,
                ai: 'boss',
                isBoss: true,
                loot: [{ item: 'Amulet of Mana', chance: 1.0 }, { item: 'Magic Staff', chance: 1.0 }]
            },
            lootQuality: ['Magic Staff', 'Amulet of Mana', 'Iron Armor', 'Speed Boots']
        }
    };

    const ENEMIES_DB = [
        { name: 'Ember Slime', element: ELEMENTS.Fire, hp: 30, atk: 12, def: 5, matk: 15, mdef: 8, spd: 8, exp: 8, gold: 3, ai: 'magic', loot: [{item: 'Potion', chance: 0.25}] },
        { name: 'Tide Slime', element: ELEMENTS.Water, hp: 35, atk: 10, def: 8, matk: 12, mdef: 10, spd: 7, exp: 8, gold: 3, ai: 'balanced', loot: [{item: 'Ether', chance: 0.15}] },
        { name: 'Stone Golem', element: ELEMENTS.Earth, hp: 60, atk: 18, def: 15, matk: 5, mdef: 5, spd: 4, exp: 15, gold: 6, ai: 'tank', loot: [{item: 'Bronze Sword', chance: 0.1}] },
        { name: 'Gale Wolf', element: ELEMENTS.Wind, hp: 45, atk: 16, def: 6, matk: 8, mdef: 6, spd: 15, exp: 12, gold: 5, ai: 'fast', loot: [{item: 'Potion', chance: 0.3}] },
        { name: 'Shadow Bat', element: ELEMENTS.Dark, hp: 25, atk: 20, def: 4, matk: 10, mdef: 5, spd: 18, exp: 10, gold: 4, ai: 'fast', loot: [{item: 'Speed Boots', chance: 0.05}] },
        { name: 'Light Wisp', element: ELEMENTS.Light, hp: 30, atk: 5, def: 10, matk: 20, mdef: 15, spd: 12, exp: 11, gold: 5, ai: 'healer', loot: [{item: 'Ether', chance: 0.25}] },
        { name: 'Venom Spider', element: ELEMENTS.Earth, hp: 50, atk: 14, def: 10, matk: 15, mdef: 10, spd: 14, exp: 16, gold: 8, ai: 'debuffer', loot: [{item: 'Leather Armor', chance: 0.1}] },
        { name: 'Frost Knight', element: ELEMENTS.Water, hp: 80, atk: 22, def: 20, matk: 10, mdef: 15, spd: 8, exp: 24, gold: 10, ai: 'tank', loot: [{item: 'Iron Sword', chance: 0.05}] },
        { name: 'Thunder Harpy', element: ELEMENTS.Wind, hp: 55, atk: 25, def: 8, matk: 25, mdef: 12, spd: 20, exp: 22, gold: 9, ai: 'magic', loot: [{item: 'Hi-Potion', chance: 0.15}] },
        { name: 'Abyssal Wraith', element: ELEMENTS.Dark, hp: 65, atk: 15, def: 12, matk: 30, mdef: 25, spd: 16, exp: 28, gold: 12, ai: 'magic', loot: [{item: 'Magic Staff', chance: 0.1}] },
        { name: 'Infernal Dragon', element: ELEMENTS.Fire, hp: 200, atk: 35, def: 25, matk: 40, mdef: 30, spd: 22, exp: 100, gold: 50, ai: 'boss', isBoss: true, loot: [{item: 'Ring of Vigor', chance: 1.0}] },
        { name: 'Void Guardian', element: ELEMENTS.Dark, hp: 250, atk: 40, def: 30, matk: 45, mdef: 35, spd: 15, exp: 120, gold: 75, ai: 'boss', isBoss: true, loot: [{item: 'Iron Armor', chance: 1.0}] }
    ];

    /* =========================================================================
       STATUS EFFECTS & TACTICAL BUFF/DEBUFF DATABASE (STATUS_TYPES_DB)
       ========================================================================= */

    const STATUS_TYPES_DB = {
        // DoTs & Ailments
        burn: { id: 'burn', name: 'Burn', icon: '🔥', element: 'Fire', type: 'dot', color: '#ff4500', desc: 'Deals 5% Max HP fire damage at start of turn; reduces healing by 30%.' },
        poison: { id: 'poison', name: 'Poison', icon: '☠️', element: 'Earth', type: 'dot', maxStacks: 5, color: '#22c55e', desc: 'True damage DoT at start of turn ignoring DEF. Stacks up to 5 times.' },
        bleed: { id: 'bleed', name: 'Bleed', icon: '🩸', element: 'Physical', type: 'ailment', color: '#ef4444', desc: 'Takes damage whenever performing an attack or skill.' },
        shock: { id: 'shock', name: 'Shock', icon: '⚡', element: 'Wind', type: 'ailment', color: '#eab308', desc: 'Stores charge: detonates when struck for lightning damage and 50% splash.' },
        decay: { id: 'decay', name: 'Decay', icon: '🌑', element: 'Dark', type: 'dot', color: '#a855f7', desc: 'Dark damage at start of turn; converts 25% of heals into damage.' },
        
        // Crowd Control (Disables)
        freeze: { id: 'freeze', name: 'Freeze', icon: '❄️', element: 'Water', type: 'disable', color: '#38bdf8', desc: 'Frozen solid; skips turn. Heavy physical strikes shatter for 1.5x damage.' },
        stun: { id: 'stun', name: 'Stun', icon: '💫', element: 'Physical', type: 'disable', color: '#fbbf24', desc: 'Stunned; skips turn completely.' },
        blind: { id: 'blind', name: 'Blind', icon: '👁️', element: 'Dark', type: 'debuff', color: '#94a3b8', desc: '40% chance for physical attacks to miss.' },
        silence: { id: 'silence', name: 'Silence', icon: '🤐', element: 'Light', type: 'disable', color: '#cbd5e1', desc: 'Cannot cast magical skills or spells.' },
        
        // Defensive & Utility Buffs
        divine_barrier: { id: 'divine_barrier', name: 'Barrier', icon: '🛡️', element: 'Light', type: 'shield', color: '#ffd700', desc: 'Absorbs incoming damage before HP is reduced.' },
        regeneration: { id: 'regeneration', name: 'Regen', icon: '🌿', element: 'Nature', type: 'buff', color: '#4ade80', desc: 'Restores 5% Max HP at end of turn.' },
        mirage: { id: 'mirage', name: 'Mirage', icon: '🌀', element: 'Wind', type: 'buff', color: '#67e8f9', desc: '40% chance to completely dodge an incoming attack.' },
        counter_stance: { id: 'counter_stance', name: 'Counter', icon: '⚔️', element: 'Physical', type: 'buff', color: '#f97316', desc: 'Retaliates immediately when struck by a physical attack.' },
        
        // Tactical Buffs & Stat Modifiers
        berserk: { id: 'berserk', name: 'Berserk', icon: '💥', element: 'Physical', type: 'buff', color: '#dc2626', desc: '+40% ATK, -25% DEF, takes 5% self-damage each turn.' },
        focus: { id: 'focus', name: 'Focus', icon: '🎯', element: 'Physical', type: 'buff', color: '#3b82f6', desc: '+25% Crit chance and 2.0x crit damage multiplier.' },
        armor_break: { id: 'armor_break', name: 'Armor Break', icon: '🛡️-', element: 'Physical', type: 'debuff', color: '#f59e0b', desc: 'Reduces DEF by 30%.' },
        haste: { id: 'haste', name: 'Haste', icon: '💨', element: 'Speed', type: 'buff', color: '#06b6d4', desc: '+30% Speed.' },
        slow: { id: 'slow', name: 'Slow', icon: '🐌', element: 'Speed', type: 'debuff', color: '#78716c', desc: '-30% Speed.' }
    };

    const SKILLS_DB = {
        'Fireball': { name: 'Fireball', type: 'magic', element: ELEMENTS.Fire, power: 45, mp: 6, target: 'enemy_single' },
        'Water Splash': { name: 'Water Splash', type: 'magic', element: ELEMENTS.Water, power: 40, mp: 5, target: 'enemy_single' },
        'Earth Spike': { name: 'Earth Spike', type: 'magic', element: ELEMENTS.Earth, power: 55, mp: 8, target: 'enemy_single' },
        'Wind Blade': { name: 'Wind Blade', type: 'magic', element: ELEMENTS.Wind, power: 40, mp: 5, target: 'enemy_single' },
        'Holy Light': { name: 'Holy Light', type: 'magic', element: ELEMENTS.Light, power: 65, mp: 10, target: 'enemy_single' },
        'Dark Blast': { name: 'Dark Blast', type: 'magic', element: ELEMENTS.Dark, power: 70, mp: 12, target: 'enemy_single' },
        'Heal': { name: 'Heal', type: 'heal', element: ELEMENTS.Light, power: 60, mp: 8, target: 'ally_single' },
        'Cleave': { name: 'Cleave', type: 'physical', element: ELEMENTS.Physical, power: 30, mp: 10, target: 'enemy_all' },
        'Power Strike': { name: 'Power Strike', type: 'physical', element: ELEMENTS.Physical, power: 45, mp: 6, target: 'enemy_single' },
        'Armor Break': { name: 'Armor Break', type: 'physical', element: ELEMENTS.Physical, power: 25, mp: 8, target: 'enemy_single' },
        'Recovery': { name: 'Recovery', type: 'heal', element: ELEMENTS.Light, power: 75, mp: 10, target: 'ally_single' }
    };

    /* =========================================================================
       BLACKSMITH WORKSHOP CONSTANTS & DATABASE
       ========================================================================= */

    const SALVAGE_RATES = {
        Common: { scrap: 2, dust: 0, shard: 0, gold: 10 },
        Uncommon: { scrap: 5, dust: 0, shard: 0, gold: 25 },
        Rare: { scrap: 8, dust: 2, shard: 0, gold: 50 },
        Epic: { scrap: 15, dust: 5, shard: 0, gold: 100 },
        Legendary: { scrap: 0, dust: 8, shard: 2, gold: 250 },
        Mythic: { scrap: 0, dust: 15, shard: 5, gold: 500 }
    };

    const UPGRADE_COSTS = {
        1: { gold: 50, scrap: 5, dust: 0, shard: 0 },
        2: { gold: 100, scrap: 10, dust: 0, shard: 0 },
        3: { gold: 200, scrap: 15, dust: 2, shard: 0 },
        4: { gold: 400, scrap: 25, dust: 5, shard: 0 },
        5: { gold: 800, scrap: 40, dust: 10, shard: 2 }
    };

    const REFORGE_COSTS = {
        Rare: { gold: 100, dust: 3, shard: 0 },
        Epic: { gold: 250, dust: 6, shard: 0 },
        Legendary: { gold: 500, dust: 10, shard: 1 },
        Mythic: { gold: 1000, dust: 15, shard: 3 }
    };

    function getUpgradedStat(baseVal, upLevel) {
        if (!baseVal) return 0;
        if (!upLevel) return baseVal;
        let scaled = Math.round(baseVal * (1 + upLevel * 0.15));
        return Math.max(baseVal + upLevel, scaled);
    }

    const RARITY_TIERS = {
        Common: { name: 'Common', color: '#ffffff', affixes: 1, priceMult: 1.0, weight: 6000 },
        Uncommon: { name: 'Uncommon', color: '#4ade80', affixes: 2, priceMult: 1.5, weight: 2800 },
        Rare: { name: 'Rare', color: '#38bdf8', affixes: 3, priceMult: 2.2, weight: 900 },
        Epic: { name: 'Epic', color: '#c084fc', affixes: 4, priceMult: 3.5, weight: 250 },
        Legendary: { name: 'Legendary', color: '#fb923c', affixes: 5, priceMult: 6.0, weight: 45 },
        Mythic: { name: 'Mythic', color: '#f43f5e', affixes: 6, priceMult: 10.0, weight: 5 }
    };

    const AFFIXES_DB = [
        // Offense
        { id: 'sharp', name: 'Sharp', type: 'prefix', stat: 'atk', min: 1, max: 5, desc: '+{val} ATK' },
        { id: 'heavy', name: 'Heavy', type: 'prefix', stat: 'atk', min: 2, max: 6, desc: '+{val} ATK' },
        { id: 'blazing', name: 'Blazing', type: 'prefix', stat: 'matk', min: 2, max: 7, desc: '+{val} MATK' },
        { id: 'deadly', name: 'Deadly', type: 'prefix', stat: 'crit', min: 1, max: 3, desc: '+{val}% Crit' },
        { id: 'brutal', name: 'Brutal', type: 'suffix', stat: 'crit', min: 1, max: 4, desc: '+{val}% Crit', label: 'of Brutality' },
        { id: 'arcane', name: 'Arcane', type: 'suffix', stat: 'matk', min: 2, max: 6, desc: '+{val} MATK', label: 'of Sorcery' },

        // Defense
        { id: 'stalwart', name: 'Stalwart', type: 'prefix', stat: 'def', min: 1, max: 5, desc: '+{val} DEF' },
        { id: 'hardened', name: 'Hardened', type: 'prefix', stat: 'def', min: 2, max: 6, desc: '+{val} DEF' },
        { id: 'warding', name: 'Warding', type: 'prefix', stat: 'mdef', min: 1, max: 5, desc: '+{val} MDEF' },
        { id: 'aegis', name: 'Aegis', type: 'suffix', stat: 'mdef', min: 2, max: 6, desc: '+{val} MDEF', label: 'of the Aegis' },
        { id: 'vital', name: 'Vital', type: 'prefix', stat: 'maxHp', min: 8, max: 25, desc: '+{val} Max HP' },
        { id: 'guardian', name: 'Guardian', type: 'suffix', stat: 'def', min: 2, max: 6, desc: '+{val} DEF', label: 'of the Guardian' },
        { id: 'colossus', name: 'Colossus', type: 'suffix', stat: 'maxHp', min: 10, max: 30, desc: '+{val} Max HP', label: 'of the Colossus' },

        // Mobility & Sustain
        { id: 'fleet', name: 'Fleet', type: 'prefix', stat: 'spd', min: 1, max: 4, desc: '+{val} SPD' },
        { id: 'quick', name: 'Quick', type: 'suffix', stat: 'spd', min: 1, max: 5, desc: '+{val} SPD', label: 'of Quickness' },
        { id: 'mystic', name: 'Mystic', type: 'prefix', stat: 'maxMp', min: 6, max: 20, desc: '+{val} Max MP' },
        { id: 'sage', name: 'Sage', type: 'suffix', stat: 'maxMp', min: 8, max: 22, desc: '+{val} Max MP', label: 'of the Sage' },
        { id: 'prosperous', name: 'Prosperous', type: 'suffix', stat: 'goldBonus', min: 5, max: 15, desc: '+{val}% Gold', label: 'of Prosperity' }
    ];

    const ITEMS_DB = {
        // Consumables
        'Potion': { type: 'consumable', effect: 'heal_hp', value: 50, price: 10, desc: 'Heals 50 HP' },
        'Hi-Potion': { type: 'consumable', effect: 'heal_hp', value: 150, price: 30, desc: 'Heals 150 HP' },
        'Mega-Potion': { type: 'consumable', effect: 'heal_hp', value: 250, price: 80, desc: 'Restores 250 HP.' },
        'Max Potion': { type: 'consumable', effect: 'heal_hp_full', value: 9999, price: 200, desc: 'Fully restores HP to maximum.' },
        'Ether': { type: 'consumable', effect: 'heal_mp', value: 30, price: 20, desc: 'Restores 30 MP' },
        'Hi-Ether': { type: 'consumable', effect: 'heal_mp', value: 80, price: 60, desc: 'Restores 80 MP.' },
        'Elixir': { type: 'consumable', effect: 'elixir', value: 250, mpValue: 80, price: 220, desc: 'Restores 250 HP and 80 MP.' },
        'Cleansing Salve': { type: 'consumable', effect: 'cleanse', price: 40, desc: 'Instantly cures all active debuffs and ailments (Burn, Poison, Bleed, Decay, Slow, Blind).' },
        'Smoke Bomb': { type: 'consumable', effect: 'smoke_bomb', price: 35, desc: 'Guarantees a 100% escape from any non-boss battle.' },

        // Weapons
        'Wooden Sword': { type: 'weapon', atk: 3, matk: 0, price: 10, desc: '+3 ATK' },
        'Bronze Sword': { type: 'weapon', atk: 7, matk: 0, price: 50, desc: '+7 ATK' },
        'Iron Sword': { type: 'weapon', atk: 15, matk: 0, price: 120, desc: '+15 ATK' },
        'Magic Staff': { type: 'weapon', atk: 2, matk: 10, price: 150, desc: '+2 ATK, +10 MATK' },

        // Helmets
        'Leather Cap': { type: 'helmet', def: 2, price: 30, desc: '+2 DEF' },
        'Iron Helm': { type: 'helmet', def: 5, mdef: 1, price: 80, desc: '+5 DEF, +1 MDEF' },
        'Mystic Circlet': { type: 'helmet', mdef: 4, maxMp: 10, price: 100, desc: '+4 MDEF, +10 Max MP' },

        // Armor (Chest)
        'Cloth Armor': { type: 'armor', def: 3, mdef: 0, price: 10, desc: '+3 DEF' },
        'Leather Armor': { type: 'armor', def: 6, mdef: 2, price: 60, desc: '+6 DEF, +2 MDEF' },
        'Iron Armor': { type: 'armor', def: 12, mdef: 5, price: 150, desc: '+12 DEF, +5 MDEF' },

        // Gloves
        'Leather Gloves': { type: 'gloves', def: 1, atk: 1, price: 30, desc: '+1 DEF, +1 ATK' },
        'Iron Gauntlets': { type: 'gloves', def: 3, atk: 2, price: 80, desc: '+3 DEF, +2 ATK' },
        'Silk Bracers': { type: 'gloves', matk: 4, mdef: 2, price: 90, desc: '+4 MATK, +2 MDEF' },

        // Boots
        'Leather Boots': { type: 'boots', def: 1, spd: 3, price: 35, desc: '+1 DEF, +3 SPD' },
        'Iron Greaves': { type: 'boots', def: 4, spd: 1, price: 90, desc: '+4 DEF, +1 SPD' },
        'Speed Boots': { type: 'boots', spd: 8, price: 180, desc: '+8 SPD' },

        // Accessories
        'Ring of Vigor': { type: 'accessory', maxHp: 30, price: 200, desc: '+30 Max HP' },
        'Amulet of Mana': { type: 'accessory', maxMp: 25, mdef: 3, price: 180, desc: '+25 Max MP, +3 MDEF' }
    };
    const SKILL_TREE_DB = {
        atkTraining: { id: 'atkTraining', name: 'ATK Training', branch: 'Damage', type: 'stat', cost: 1, max: 10, desc: '+2 ATK per rank' },
        critTraining: { id: 'critTraining', name: 'Critical Training', branch: 'Damage', type: 'stat', cost: 1, max: 10, desc: '+2% Crit Chance per rank' },
        powerStrike: { id: 'powerStrike', name: 'Power Strike', branch: 'Damage', type: 'active', cost: 2, max: 1, desc: 'Strong active physical attack', skillRef: 'Power Strike' },
        armorBreak: { id: 'armorBreak', name: 'Armor Break', branch: 'Damage', type: 'active', cost: 2, max: 1, desc: 'Temporarily reduces enemy DEF', skillRef: 'Armor Break' },
        combatMastery: { id: 'combatMastery', name: 'Combat Mastery', branch: 'Damage', type: 'passive', cost: 3, max: 1, desc: '+10% basic attack damage' },

        vitalityTraining: { id: 'vitalityTraining', name: 'Vitality Training', branch: 'Sustain', type: 'stat', cost: 1, max: 10, desc: '+10 Max HP per rank' },
        spiritTraining: { id: 'spiritTraining', name: 'Spirit Training', branch: 'Sustain', type: 'stat', cost: 1, max: 10, desc: '+5 Max MP per rank' },
        recovery: { id: 'recovery', name: 'Recovery', branch: 'Sustain', type: 'active', cost: 2, max: 1, desc: 'Powerful active healing skill', skillRef: 'Recovery' },
        manaEfficiency: { id: 'manaEfficiency', name: 'Mana Efficiency', branch: 'Sustain', type: 'passive', cost: 3, max: 1, desc: '10% reduction to MP costs' },
        regeneration: { id: 'regeneration', name: 'Regeneration', branch: 'Sustain', type: 'passive', cost: 3, max: 1, desc: 'Heal 3% HP at end of turn' },

        defTraining: { id: 'defTraining', name: 'Defense Training', branch: 'General', type: 'stat', cost: 1, max: 10, desc: '+2 DEF per rank' },
        fortune: { id: 'fortune', name: 'Fortune', branch: 'General', type: 'stat', cost: 1, max: 10, desc: '+3% Battle Gold per rank' },
        treasureSense: { id: 'treasureSense', name: 'Treasure Sense', branch: 'General', type: 'passive', cost: 3, max: 1, desc: 'Increases loot drop chances' }
    };

    /* =========================================================================
       CLASSES & ADVANCEMENT DATABASE (3-TIER PROGRESSION)
       ========================================================================= */

    const CLASSES_DB = {
        novice: {
            id: 'novice',
            name: 'Novice',
            tier: 0,
            parent: null,
            minLevel: 1,
            desc: "An aspiring adventurer beginning their journey.",
            statMods: {}
        },
        // Tier 1 (Level 10)
        warrior: {
            id: 'warrior',
            name: 'Warrior',
            tier: 1,
            parent: null,
            minLevel: 10,
            desc: "Master of raw physical combat and endurance.",
            statMods: { atk: 1.20, maxHp: 1.15, matk: 0.85, mdef: 0.90, spd: 0.95 }
        },
        mage: {
            id: 'mage',
            name: 'Mage',
            tier: 1,
            parent: null,
            minLevel: 10,
            desc: "Wielder of destructive elemental arcana.",
            statMods: { matk: 1.30, maxMp: 1.25, atk: 0.75, maxHp: 0.85, def: 0.90 }
        },
        rogue: {
            id: 'rogue',
            name: 'Rogue',
            tier: 1,
            parent: null,
            minLevel: 10,
            desc: "Swift opportunist specializing in rapid critical strikes.",
            statMods: { spd: 1.25, crit: 15, atk: 1.15, maxHp: 0.85, def: 0.85, matk: 0.80 }
        },
        // Tier 2 (Level 25)
        berserker: {
            id: 'berserker',
            name: 'Berserker',
            tier: 2,
            parent: 'warrior',
            minLevel: 25,
            desc: "Reckless warrior channeling fury into devastating power.",
            statMods: { atk: 1.45, crit: 15, def: 0.75, mdef: 0.80 },
            passive: 'blood_frenzy',
            passiveName: "Blood Frenzy",
            passiveDesc: "Increases outgoing damage by up to +40% as player HP decreases below max."
        },
        paladin: {
            id: 'paladin',
            name: 'Paladin',
            tier: 2,
            parent: 'warrior',
            minLevel: 25,
            desc: "Holy defender shielded by divine conviction.",
            statMods: { def: 1.40, maxHp: 1.35, mdef: 1.20, spd: 0.85, matk: 0.85 },
            passive: 'aegis_ward',
            passiveName: "Aegis Ward",
            passiveDesc: "Starts every combat encounter with a permanent 15% Max HP divine barrier."
        },
        archmage: {
            id: 'archmage',
            name: 'Archmage',
            tier: 2,
            parent: 'mage',
            minLevel: 25,
            desc: "Supreme spellcaster mastering the flow of magic.",
            statMods: { matk: 1.50, maxMp: 1.40, atk: 0.70, maxHp: 0.80 },
            passive: 'elemental_overcharge',
            passiveName: "Elemental Overcharge",
            passiveDesc: "Boosts elemental weakness multiplier from 1.5x to 2.0x, and reduces all skill MP costs by 25%."
        },
        warlock: {
            id: 'warlock',
            name: 'Warlock',
            tier: 2,
            parent: 'mage',
            minLevel: 25,
            desc: "Dark occultist feeding on the vitality of victims.",
            statMods: { matk: 1.35, maxMp: 1.25, maxHp: 1.20, atk: 0.75, def: 0.85 },
            passive: 'soul_siphon',
            passiveName: "Soul Siphon",
            passiveDesc: "20% of all magic and DoT damage dealt leeches back to heal the player's HP."
        },
        assassin: {
            id: 'assassin',
            name: 'Assassin',
            tier: 2,
            parent: 'rogue',
            minLevel: 25,
            desc: "Lethal executioner striking afflicted targets.",
            statMods: { atk: 1.40, crit: 30, spd: 1.20, maxHp: 0.75, def: 0.75 },
            passive: 'lethal_exploit',
            passiveName: "Lethal Exploit",
            passiveDesc: "Direct hits against targets with any active status ailment deal +40% bonus critical damage."
        },
        shadowblade: {
            id: 'shadowblade',
            name: 'Shadowblade',
            tier: 2,
            parent: 'rogue',
            minLevel: 25,
            desc: "Elusive phantom dancing through illusions.",
            statMods: { spd: 1.45, crit: 20, atk: 1.20, def: 1.15, matk: 0.75, maxHp: 0.85 },
            passive: 'phantom_mirage',
            passiveName: "Phantom Mirage",
            passiveDesc: "Starts combat with 2 stacks of Mirage (100% evasion for 2 incoming attacks)."
        },
        // Tier 3 (Level 50 - Apex Evolution)
        warlord_of_carnage: {
            id: 'warlord_of_carnage',
            name: 'Warlord of Carnage',
            tier: 3,
            parent: 'berserker',
            minLevel: 50,
            desc: "Unstoppable titan of slaughter who defies death itself.",
            statMods: { atk: 1.80, crit: 25, spd: 1.10, def: 0.80 },
            passive: 'undying_wrath',
            passiveName: "Undying Wrath",
            passiveDesc: "Once per battle, survives a fatal hit with 1 HP and immediately gains +50% ATK and 3 turns of berserk."
        },
        holy_templar: {
            id: 'holy_templar',
            name: 'Holy Templar',
            tier: 3,
            parent: 'paladin',
            minLevel: 50,
            desc: "Divine bastion reflecting unholy violence with sacred retribution.",
            statMods: { def: 1.75, maxHp: 1.60, mdef: 1.45, spd: 0.90 },
            passive: 'divine_retribution',
            passiveName: "Divine Retribution",
            passiveDesc: "Reflects 30% of all mitigated damage back to attackers as Holy true damage."
        },
        archon_of_elements: {
            id: 'archon_of_elements',
            name: 'Archon of Elements',
            tier: 3,
            parent: 'archmage',
            minLevel: 50,
            desc: "Avatar of raw primal forces wielding devastating spell crits.",
            statMods: { matk: 1.90, maxMp: 1.60, spd: 1.15, atk: 0.75, maxHp: 0.85 },
            passive: 'arcane_singularity',
            passiveName: "Arcane Singularity",
            passiveDesc: "Spells can land Critical Hits for 2.0x damage."
        },
        voidbringer: {
            id: 'voidbringer',
            name: 'Voidbringer',
            tier: 3,
            parent: 'warlock',
            minLevel: 50,
            desc: "Herald of the abyss whose curses wither all life exponentially.",
            statMods: { matk: 1.65, maxHp: 1.45, mdef: 1.30, atk: 0.80 },
            passive: 'calamity_conduit',
            passiveName: "Calamity Conduit",
            passiveDesc: "All DoTs (Burn, Poison, Decay) deal double damage."
        },
        reaper_of_shadows: {
            id: 'reaper_of_shadows',
            name: 'Reaper of Shadows',
            tier: 3,
            parent: 'assassin',
            minLevel: 50,
            desc: "Incarnation of death whose strikes instantly cull the wounded.",
            statMods: { atk: 1.70, crit: 45, spd: 1.35, maxHp: 0.75, def: 0.80 },
            passive: 'deaths_guillotine',
            passiveName: "Death's Guillotine",
            passiveDesc: "Hits against enemies below 25% HP trigger an instant execution."
        },
        tempest_blademaster: {
            id: 'tempest_blademaster',
            name: 'Tempest Blademaster',
            tier: 3,
            parent: 'shadowblade',
            minLevel: 50,
            desc: "Whirlwind of steel executing relentless multi-strikes.",
            statMods: { spd: 1.70, atk: 1.35, crit: 30, def: 1.20, matk: 0.80 },
            passive: 'omnislash_flurry',
            passiveName: "Omnislash Flurry",
            passiveDesc: "Every basic attack strikes twice (second strike deals 50% damage)."
        }
    };

    function playerHasPassive(passiveId) {
        if (!player || !player.currentClass) return false;
        let cls = (typeof CLASSES_DB !== 'undefined' && CLASSES_DB[player.currentClass]);
        if (!cls) return false;
        if (cls.passive === passiveId) return true;
        if (cls.parent && CLASSES_DB[cls.parent] && CLASSES_DB[cls.parent].passive === passiveId) return true;
        return false;
    }

    const QUESTS_DB = {
        // Level Chain
        growing_power: {
            id: 'growing_power',
            title: 'Growing Power',
            desc: 'Reach character Level 2.',
            type: 'reach_level',
            target: 2,
            reward: { exp: 30, gold: 50, item: 'Ether', qty: 1 }
        },
        rising_hero: {
            id: 'rising_hero',
            title: 'Rising Hero',
            desc: 'Reach character Level 3.',
            type: 'reach_level',
            target: 3,
            prereqQuestId: 'growing_power',
            reward: { exp: 120, gold: 150, item: 'Bronze Sword', qty: 1 }
        },
        veteran_hero: {
            id: 'veteran_hero',
            title: 'Veteran Hero',
            desc: 'Reach character Level 5.',
            type: 'reach_level',
            target: 5,
            prereqQuestId: 'rising_hero',
            reward: { exp: 200, gold: 200, item: 'Hi-Potion', qty: 2 }
        },
        realm_champion: {
            id: 'realm_champion',
            title: 'Realm Champion',
            desc: 'Reach character Level 8.',
            type: 'reach_level',
            target: 8,
            prereqQuestId: 'veteran_hero',
            reward: { exp: 350, gold: 350, item: 'Iron Sword', qty: 1 }
        },
        ascended_master: {
            id: 'ascended_master',
            title: 'Ascended Master',
            desc: 'Reach character Level 12.',
            type: 'reach_level',
            target: 12,
            prereqQuestId: 'realm_champion',
            reward: { exp: 600, gold: 600, item: 'Ring of Vigor', qty: 1 }
        },

        // Monster Slayer Chain
        first_hunt: {
            id: 'first_hunt',
            title: 'First Hunt',
            desc: 'Defeat 3 enemies in battle.',
            type: 'defeat_enemies',
            target: 3,
            reward: { exp: 40, gold: 30, item: 'Potion', qty: 1 }
        },
        monster_slayer: {
            id: 'monster_slayer',
            title: 'Monster Slayer',
            desc: 'Defeat 10 enemies in battle.',
            type: 'defeat_enemies',
            target: 10,
            prereqQuestId: 'first_hunt',
            reward: { exp: 100, gold: 120, item: 'Hi-Potion', qty: 1 }
        },
        beast_purger: {
            id: 'beast_purger',
            title: 'Beast Purger',
            desc: 'Defeat 25 enemies in battle.',
            type: 'defeat_enemies',
            target: 25,
            prereqQuestId: 'monster_slayer',
            reward: { exp: 220, gold: 200, item: 'Ether', qty: 2 }
        },
        calamity_hunter: {
            id: 'calamity_hunter',
            title: 'Calamity Hunter',
            desc: 'Defeat 50 enemies in battle.',
            type: 'defeat_enemies',
            target: 50,
            prereqQuestId: 'beast_purger',
            reward: { exp: 450, gold: 450, item: 'Iron Armor', qty: 1 }
        },

        // Boss Slayer Chain
        boss_challenger: {
            id: 'boss_challenger',
            title: 'Boss Challenger',
            desc: 'Defeat 1 Boss monster.',
            type: 'bosses_defeated',
            target: 1,
            prereqQuestId: 'first_hunt',
            reward: { exp: 250, gold: 300, item: 'Hi-Potion', qty: 2 }
        },
        titan_slayer: {
            id: 'titan_slayer',
            title: 'Titan Slayer',
            desc: 'Defeat 3 Boss monsters.',
            type: 'bosses_defeated',
            target: 3,
            prereqQuestId: 'boss_challenger',
            reward: { exp: 500, gold: 600, item: 'Speed Boots', qty: 1 }
        },

        // Economy & Supplies Chain
        prepared_adventurer: {
            id: 'prepared_adventurer',
            title: 'Prepared Adventurer',
            desc: 'Have at least 4 Potions in your inventory.',
            type: 'have_item',
            item: 'Potion',
            target: 4,
            reward: { exp: 40, gold: 60 }
        },
        potion_stockpile: {
            id: 'potion_stockpile',
            title: 'Potion Stockpile',
            desc: 'Have at least 8 Potions in your inventory.',
            type: 'have_item',
            item: 'Potion',
            target: 8,
            prereqQuestId: 'prepared_adventurer',
            reward: { exp: 120, gold: 150, item: 'Hi-Potion', qty: 2 }
        },
        wealthy_pocket: {
            id: 'wealthy_pocket',
            title: 'Wealthy Pocket',
            desc: 'Hold at least 500 Gold in inventory.',
            type: 'gold_held',
            target: 500,
            reward: { exp: 150, gold: 0, item: 'Ether', qty: 2 }
        },

        // Skill Mastery Chain
        skill_apprentice: {
            id: 'skill_apprentice',
            title: 'Skill Apprentice',
            desc: 'Unlock at least 3 total skill node ranks.',
            type: 'skill_ranks',
            target: 3,
            reward: { exp: 100, gold: 100 }
        },
        skill_master: {
            id: 'skill_master',
            title: 'Skill Master',
            desc: 'Unlock at least 8 total skill node ranks.',
            type: 'skill_ranks',
            target: 8,
            prereqQuestId: 'skill_apprentice',
            reward: { exp: 300, gold: 300, item: 'Hi-Potion', qty: 2 }
        }
    };

    const ACHIEVEMENTS_DB = {
        // Battles Won
        first_victory: {
            id: 'first_victory',
            title: 'First Steps',
            desc: 'Win 1 battle.',
            type: 'battles_won',
            target: 1,
            reward: { title: 'Novice Adventurer', stats: { maxHp: 5 } }
        },
        veteran_fighter: {
            id: 'veteran_fighter',
            title: 'Arena Veteran',
            desc: 'Win 10 battles.',
            type: 'battles_won',
            target: 10,
            reward: { title: 'Gladiator', stats: { maxHp: 10, atk: 2 } }
        },
        master_gladiator: {
            id: 'master_gladiator',
            title: 'Arena Champion',
            desc: 'Win 25 battles.',
            type: 'battles_won',
            target: 25,
            reward: { title: 'Arena Champion', stats: { maxHp: 15, atk: 3, spd: 1 } }
        },
        warlord: {
            id: 'warlord',
            title: 'Warlord',
            desc: 'Win 50 battles.',
            type: 'battles_won',
            target: 50,
            reward: { title: 'Warlord', stats: { maxHp: 25, atk: 5, def: 3 } }
        },

        // Bosses Slain
        boss_slayer: {
            id: 'boss_slayer',
            title: 'Apex Predator',
            desc: 'Defeat any Boss monster.',
            type: 'bosses_defeated',
            target: 1,
            reward: { title: 'Dragon Slayer', stats: { atk: 3, matk: 3 } }
        },
        titan_conqueror: {
            id: 'titan_conqueror',
            title: 'Apex Titan',
            desc: 'Defeat 3 Boss monsters.',
            type: 'bosses_defeated',
            target: 3,
            reward: { title: 'Apex Titan', stats: { atk: 5, matk: 5, crit: 2 } }
        },

        // Wealth
        wealthy_hoarder: {
            id: 'wealthy_hoarder',
            title: 'Deep Pockets',
            desc: 'Hold at least 300 Gold in inventory.',
            type: 'gold_held',
            target: 300,
            reward: { title: 'Merchant', stats: { def: 2, mdef: 2 } }
        },
        wealthy_tycoon: {
            id: 'wealthy_tycoon',
            title: 'Tycoon',
            desc: 'Hold at least 1,000 Gold in inventory.',
            type: 'gold_held',
            target: 1000,
            reward: { title: 'Tycoon', stats: { def: 4, mdef: 4, maxHp: 20 } }
        },

        // Skill Mastery
        master_of_skills: {
            id: 'master_of_skills',
            title: 'Path of Mastery',
            desc: 'Purchase at least 5 total skill node ranks across any skill trees.',
            type: 'skill_ranks',
            target: 5,
            reward: { title: 'Adept', stats: { maxMp: 10, spd: 1 } }
        },
        paragon_of_power: {
            id: 'paragon_of_power',
            title: 'Paragon',
            desc: 'Unlock at least 10 skill node ranks across any skill trees.',
            type: 'skill_ranks',
            target: 10,
            reward: { title: 'Paragon', stats: { maxMp: 20, matk: 3, spd: 1 } }
        },

        // Quest Mastery
        quest_veteran: {
            id: 'quest_veteran',
            title: 'Town Hero',
            desc: 'Complete and claim at least 3 quests.',
            type: 'quests_claimed',
            target: 3,
            reward: { title: 'Hero of the Realm', stats: { atk: 2, def: 2, crit: 2 } }
        },
        quest_legend: {
            id: 'quest_legend',
            title: 'Grand Sovereign',
            desc: 'Complete and claim at least 8 quests.',
            type: 'quests_claimed',
            target: 8,
            reward: { title: 'Grand Sovereign', stats: { atk: 4, def: 4, crit: 3, maxHp: 15 } }
        },

        // Level Mastery
        level_ascendant: {
            id: 'level_ascendant',
            title: 'Ascendant',
            desc: 'Reach character Level 10.',
            type: 'reach_level',
            target: 10,
            reward: { title: 'Ascendant', stats: { maxHp: 20, maxMp: 10, atk: 2, def: 2, matk: 2, mdef: 2, spd: 2 } }
        }
    };
