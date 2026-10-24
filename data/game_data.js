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

        'Nether Knight': `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="30" y="20" width="40" height="60" fill="#2e1065"/><polygon points="30,20 50,5 70,20" fill="#581c87"/><circle cx="42" cy="32" r="4" fill="#c084fc"/><circle cx="58" cy="32" r="4" fill="#c084fc"/></svg>`,

        // Mystery Boxes & Coffers

        'Mystery Chest': `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="15" y="45" width="70" height="45" rx="5" fill="#78350f" stroke="#d97706" stroke-width="3"/><path d="M15,45 Q50,15 85,45 Z" fill="#92400e" stroke="#d97706" stroke-width="3"/><rect x="25" y="45" width="8" height="45" fill="#d97706"/><rect x="67" y="45" width="8" height="45" fill="#d97706"/><path d="M25,45 Q50,22 33,45" stroke="#d97706" stroke-width="4" fill="none"/><path d="M67,45 Q50,22 75,45" stroke="#d97706" stroke-width="4" fill="none"/><circle cx="50" cy="52" r="8" fill="#fbbf24" stroke="#78350f" stroke-width="2"/><rect x="48" y="52" width="4" height="8" fill="#78350f"/></svg>`,

        'Celestial Chest': `<svg viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="celChestGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4c1d95"/><stop offset="50%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#db2777"/></linearGradient></defs><rect x="15" y="45" width="70" height="45" rx="5" fill="url(#celChestGrad)" stroke="#f59e0b" stroke-width="3"/><path d="M15,45 Q50,12 85,45 Z" fill="#6d28d9" stroke="#f59e0b" stroke-width="3"/><rect x="25" y="45" width="8" height="45" fill="#f59e0b"/><rect x="67" y="45" width="8" height="45" fill="#f59e0b"/><polygon points="50,20 54,30 65,30 56,37 59,48 50,42 41,48 44,37 35,30 46,30" fill="#fef08a"/><circle cx="50" cy="54" r="9" fill="#fef08a" stroke="#d97706" stroke-width="2"/><circle cx="50" cy="54" r="4" fill="#6d28d9"/><circle cx="20" cy="30" r="2" fill="#fff"/><circle cx="80" cy="25" r="2" fill="#fff"/><circle cx="85" cy="65" r="1.5" fill="#fef08a"/></svg>`,

        'chest_mystery': `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="15" y="45" width="70" height="45" rx="5" fill="#78350f" stroke="#d97706" stroke-width="3"/><path d="M15,45 Q50,15 85,45 Z" fill="#92400e" stroke="#d97706" stroke-width="3"/><rect x="25" y="45" width="8" height="45" fill="#d97706"/><rect x="67" y="45" width="8" height="45" fill="#d97706"/><circle cx="50" cy="52" r="8" fill="#fbbf24" stroke="#78350f" stroke-width="2"/></svg>`,

        'chest_celestial': `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="15" y="45" width="70" height="45" rx="5" fill="#581c87" stroke="#f59e0b" stroke-width="3"/><path d="M15,45 Q50,12 85,45 Z" fill="#6d28d9" stroke="#f59e0b" stroke-width="3"/><rect x="25" y="45" width="8" height="45" fill="#f59e0b"/><rect x="67" y="45" width="8" height="45" fill="#f59e0b"/><polygon points="50,20 54,30 65,30 56,37 59,48 50,42 41,48 44,37 35,30 46,30" fill="#fef08a"/><circle cx="50" cy="54" r="9" fill="#fef08a"/></svg>`,

        // Area 6 & 7 Monsters, Bosses & Pets

        'Radiant Wisp': `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="35" fill="#fef08a" filter="drop-shadow(0 0 8px #fde047)"/><circle cx="50" cy="50" r="22" fill="#ffffff"/><circle cx="42" cy="46" r="3" fill="#854d0e"/><circle cx="58" cy="46" r="3" fill="#854d0e"/></svg>`,

        'Sunforged Golem': `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="25" y="20" width="50" height="60" rx="6" fill="#ca8a04" stroke="#fef08a" stroke-width="3"/><rect x="10" y="32" width="15" height="38" rx="4" fill="#a16207"/><rect x="75" y="32" width="15" height="38" rx="4" fill="#a16207"/><circle cx="38" cy="36" r="5" fill="#fef08a"/><circle cx="62" cy="36" r="5" fill="#fef08a"/><rect x="36" y="52" width="28" height="8" rx="2" fill="#713f12"/></svg>`,

        'Dawn Seraph': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50,15 L35,55 L50,85 L65,55 Z" fill="#fef9c3"/><path d="M35,55 Q10,25 20,15 Q35,30 35,55" fill="#fde047"/><path d="M65,55 Q90,25 80,15 Q65,30 65,55" fill="#fde047"/><circle cx="50" cy="32" r="10" fill="#fef08a"/><circle cx="50" cy="20" r="14" fill="none" stroke="#eab308" stroke-width="2.5"/><circle cx="46" cy="32" r="2" fill="#713f12"/><circle cx="54" cy="32" r="2" fill="#713f12"/></svg>`,

        'Solar Griffin': `<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="50,12 25,65 75,65" fill="#eab308"/><circle cx="50" cy="35" r="18" fill="#facc15"/><polygon points="50,35 44,48 56,48" fill="#ca8a04"/><circle cx="43" cy="30" r="3" fill="#111"/><circle cx="57" cy="30" r="3" fill="#111"/><path d="M25,65 Q5,40 15,25 Q30,45 35,65" fill="#ca8a04"/><path d="M75,65 Q95,40 85,25 Q70,45 65,65" fill="#ca8a04"/></svg>`,

        'Archon of Radiance': `<svg viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="archonGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fef08a"/><stop offset="100%" stop-color="#ca8a04"/></linearGradient></defs><circle cx="50" cy="50" r="42" fill="url(#archonGrad)" stroke="#fef08a" stroke-width="4"/><polygon points="50,8 55,24 72,24 58,34 63,50 50,40 37,50 42,34 28,24 45,24" fill="#ffffff"/><circle cx="50" cy="50" r="16" fill="#1e293b"/><circle cx="44" cy="48" r="3" fill="#fef08a"/><circle cx="56" cy="48" r="3" fill="#fef08a"/><path d="M42,58 Q50,65 58,58" stroke="#fef08a" stroke-width="2" fill="none"/></svg>`,

        'Volt Stalker': `<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="15,85 45,30 55,45 80,20 90,85" fill="#0284c7"/><polyline points="40,25 50,45 42,52 60,75" stroke="#facc15" stroke-width="3" fill="none"/><circle cx="68" cy="45" r="4" fill="#fef08a"/><circle cx="32" cy="55" r="4" fill="#fef08a"/></svg>`,

        'Thunder Ram': `<svg viewBox="0 0 100 100" width="100%" height="100%"><ellipse cx="50" cy="55" rx="32" ry="25" fill="#334155" stroke="#38bdf8" stroke-width="2.5"/><circle cx="50" cy="38" r="18" fill="#1e293b"/><path d="M35,35 Q15,20 25,45 Q32,48 35,40" fill="#facc15"/><path d="M65,35 Q85,20 75,45 Q68,48 65,40" fill="#facc15"/><circle cx="43" cy="36" r="3" fill="#38bdf8"/><circle cx="57" cy="36" r="3" fill="#38bdf8"/></svg>`,

        'Lightning Drake': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M15,85 L45,20 L55,38 L85,85 Z" fill="#0369a1"/><polygon points="45,20 40,8 55,18" fill="#38bdf8"/><circle cx="44" cy="40" r="5" fill="#fde047"/><circle cx="60" cy="40" r="5" fill="#fde047"/><polyline points="50,45 42,60 55,68 45,82" stroke="#fde047" stroke-width="2.5" fill="none"/></svg>`,

        'Storm Elemental': `<svg viewBox="0 0 100 100" width="100%" height="100%"><ellipse cx="50" cy="30" rx="35" ry="16" fill="#0284c7" opacity="0.85"/><ellipse cx="50" cy="50" rx="26" ry="14" fill="#0ea5e9" opacity="0.9"/><ellipse cx="50" cy="72" rx="16" ry="10" fill="#38bdf8"/><polygon points="48,25 54,38 46,44 56,60" fill="#fef08a"/><circle cx="40" cy="32" r="3" fill="#fef08a"/><circle cx="60" cy="32" r="3" fill="#fef08a"/></svg>`,

        'Fulgur Apex': `<svg viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="fulgurGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0284c7"/><stop offset="50%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#facc15"/></linearGradient></defs><polygon points="50,5 20,45 40,48 10,95 65,52 45,48 80,25" fill="url(#fulgurGrad)" stroke="#facc15" stroke-width="3"/><circle cx="48" cy="38" r="6" fill="#ffffff"/><circle cx="50" cy="38" r="3" fill="#0369a1"/></svg>`,

        'Lumina Sprite': `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="32" fill="#fef08a" filter="drop-shadow(0 0 6px #eab308)"/><circle cx="40" cy="45" r="4" fill="#854d0e"/><circle cx="60" cy="45" r="4" fill="#854d0e"/><path d="M44,56 Q50,62 56,56" stroke="#854d0e" stroke-width="3" fill="none"/></svg>`,

        'Spark Hound': `<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="25,75 45,35 65,45 85,30 92,75" fill="#38bdf8"/><circle cx="72" cy="48" r="5" fill="#fff"/><circle cx="74" cy="48" r="2.5" fill="#0284c7"/><polygon points="40,48 48,60 40,64 52,75" fill="#facc15"/></svg>`,

        // Area 8 Monsters & Boss

        'Frostfang Wolf': `<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="20,80 35,42 48,52 68,32 88,80" fill="#0284c7"/><polygon points="28,78 40,48 50,56 68,40 82,78" fill="#38bdf8"/><circle cx="58" cy="52" r="3.5" fill="#f0f9ff"/><polygon points="45,68 50,60 55,68" fill="#e0f2fe"/><polygon points="35,72 40,65 43,72" fill="#fff"/><polygon points="57,72 60,65 65,72" fill="#fff"/></svg>`,

        'Glacial Golem': `<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="25,25 50,12 75,25 80,75 50,88 20,75" fill="#0369a1"/><polygon points="30,30 50,20 70,30 75,70 50,80 25,70" fill="#38bdf8"/><circle cx="40" cy="38" r="4" fill="#e0f2fe"/><circle cx="60" cy="38" r="4" fill="#e0f2fe"/><line x1="35" y1="55" x2="65" y2="55" stroke="#082f49" stroke-width="3"/></svg>`,

        'Blizzard Harpy': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50,15 Q35,40 10,45 Q35,60 40,85 Q50,65 60,85 Q65,60 90,45 Q65,40 50,15" fill="#0284c7"/><circle cx="50" cy="32" r="9" fill="#bae6fd"/><circle cx="47" cy="30" r="2.5" fill="#082f49"/><circle cx="53" cy="30" r="2.5" fill="#082f49"/><polygon points="48,34 52,34 50,40" fill="#facc15"/><path d="M20,50 Q50,75 80,50" stroke="#bae6fd" stroke-width="2" fill="none"/></svg>`,

        'Icebound Revenant': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50,15 Q25,25 30,75 Q40,65 50,85 Q60,65 70,75 Q75,25 50,15" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/><circle cx="44" cy="36" r="3" fill="#38bdf8" filter="drop-shadow(0 0 4px #38bdf8)"/><circle cx="56" cy="36" r="3" fill="#38bdf8" filter="drop-shadow(0 0 4px #38bdf8)"/><ellipse cx="50" cy="50" rx="4" ry="7" fill="#082f49"/></svg>`,

        'Frost Empress Glacia': `<svg viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="glaciaGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#bae6fd"/><stop offset="100%" stop-color="#0284c7"/></linearGradient></defs><circle cx="50" cy="50" r="44" fill="url(#glaciaGrad)" stroke="#e0f2fe" stroke-width="3"/><polygon points="50,10 56,26 74,22 62,35 70,50 50,42 30,50 38,35 26,22 44,26" fill="#f0f9ff"/><circle cx="50" cy="52" r="15" fill="#082f49"/><circle cx="45" cy="50" r="3" fill="#38bdf8"/><circle cx="55" cy="50" r="3" fill="#38bdf8"/><path d="M44,58 Q50,63 56,58" stroke="#38bdf8" stroke-width="2" fill="none"/></svg>`,

        // Area 9 Monsters & Boss

        'Magma Scuttler': `<svg viewBox="0 0 100 100" width="100%" height="100%"><ellipse cx="50" cy="52" rx="26" ry="18" fill="#7f1d1d" stroke="#f97316" stroke-width="3"/><circle cx="40" cy="46" r="3.5" fill="#facc15"/><circle cx="60" cy="46" r="3.5" fill="#facc15"/><path d="M26,52 L10,38 M24,56 L8,56 M26,60 L12,74" stroke="#ea580c" stroke-width="3" stroke-linecap="round"/><path d="M74,52 L90,38 M76,56 L92,56 M74,60 L88,74" stroke="#ea580c" stroke-width="3" stroke-linecap="round"/><polygon points="45,55 55,55 50,65" fill="#f97316"/></svg>`,

        'Cinder Drake': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50,18 Q20,30 15,65 Q35,55 45,78 Q50,60 55,78 Q65,55 85,65 Q80,30 50,18" fill="#991b1b" stroke="#f97316" stroke-width="2"/><circle cx="44" cy="35" r="3" fill="#fef08a"/><circle cx="56" cy="35" r="3" fill="#fef08a"/><polygon points="42,22 50,10 58,22" fill="#ea580c"/><path d="M42,50 Q50,60 58,50" stroke="#facc15" stroke-width="2" fill="none"/></svg>`,

        'Lava Reaver': `<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="30,85 50,22 70,85 50,70" fill="#7c2d12" stroke="#ea580c" stroke-width="2"/><polygon points="35,80 50,30 65,80" fill="#dc2626"/><circle cx="45" cy="42" r="3" fill="#fef08a"/><circle cx="55" cy="42" r="3" fill="#fef08a"/><line x1="20" y1="35" x2="80" y2="75" stroke="#f97316" stroke-width="3"/></svg>`,

        'Pyroclast Behemoth': `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="20" y="30" width="60" height="45" rx="10" fill="#450a0a" stroke="#f97316" stroke-width="3"/><rect x="14" y="65" width="14" height="25" fill="#7f1d1d"/><rect x="72" y="65" width="14" height="25" fill="#7f1d1d"/><circle cx="36" cy="45" r="4" fill="#facc15"/><circle cx="64" cy="45" r="4" fill="#facc15"/><polygon points="40,30 50,15 60,30" fill="#ea580c"/></svg>`,

        'Ignis Primordial': `<svg viewBox="0 0 100 100" width="100%" height="100%"><defs><radialGradient id="ignisPrimGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fef08a"/><stop offset="50%" stop-color="#f97316"/><stop offset="100%" stop-color="#7f1d1d"/></radialGradient></defs><circle cx="50" cy="50" r="44" fill="url(#ignisPrimGrad)" stroke="#fbbf24" stroke-width="4"/><polygon points="50,6 58,22 75,18 64,32 78,46 60,45 62,65 50,54 38,65 40,45 22,46 36,32 25,18 42,22" fill="#ef4444"/><circle cx="42" cy="46" r="4.5" fill="#fff"/><circle cx="58" cy="46" r="4.5" fill="#fff"/><circle cx="42" cy="46" r="2" fill="#7f1d1d"/><circle cx="58" cy="46" r="2" fill="#7f1d1d"/><path d="M40,62 Q50,72 60,62" stroke="#450a0a" stroke-width="3" fill="none"/></svg>`,

        // Area 10 Monsters & Boss

        'Chrono Phantom': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50,12 Q20,35 25,75 Q40,65 50,85 Q60,65 75,75 Q80,35 50,12" fill="#2e1065" stroke="#c084fc" stroke-width="2.5"/><circle cx="50" cy="40" r="16" fill="#090514" stroke="#a855f7" stroke-width="1.5"/><circle cx="45" cy="38" r="3" fill="#e879f9"/><circle cx="55" cy="38" r="3" fill="#e879f9"/><line x1="50" y1="40" x2="50" y2="30" stroke="#f0abfc" stroke-width="1.5"/><line x1="50" y1="40" x2="57" y2="40" stroke="#f0abfc" stroke-width="1.5"/></svg>`,

        'Starfall Entity': `<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="50,10 60,35 85,35 65,52 72,78 50,62 28,78 35,52 15,35 40,35" fill="#7e22ce" stroke="#e879f9" stroke-width="2"/><circle cx="50" cy="48" r="12" fill="#fdf4ff"/><circle cx="50" cy="48" r="8" fill="#3b0764"/><circle cx="47" cy="46" r="2" fill="#e879f9"/><circle cx="53" cy="46" r="2" fill="#e879f9"/></svg>`,

        'Dimensional Horror': `<svg viewBox="0 0 100 100" width="100%" height="100%"><ellipse cx="50" cy="50" rx="30" ry="24" fill="#090514" stroke="#a855f7" stroke-width="3"/><path d="M20,50 Q10,75 5,90 M35,70 Q25,88 20,98 M65,70 Q75,88 80,98 M80,50 Q90,75 95,90" stroke="#9333ea" stroke-width="3" fill="none"/><circle cx="40" cy="44" r="5" fill="#f0abfc"/><circle cx="60" cy="44" r="5" fill="#f0abfc"/><circle cx="50" cy="56" r="4" fill="#e879f9"/><circle cx="40" cy="44" r="2" fill="#000"/><circle cx="60" cy="44" r="2" fill="#000"/><circle cx="50" cy="56" r="1.5" fill="#000"/></svg>`,

        'Singularity Titan': `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="22" y="24" width="56" height="56" rx="8" fill="#1e1b4b" stroke="#7e22ce" stroke-width="3"/><ellipse cx="50" cy="52" rx="16" ry="16" fill="#090514" stroke="#c084fc" stroke-width="2.5"/><circle cx="50" cy="52" r="7" fill="#f5d0fe"/><circle cx="42" cy="36" r="3.5" fill="#c084fc"/><circle cx="58" cy="36" r="3.5" fill="#c084fc"/></svg>`,

        'Chronos, The Void Sovereign': `<svg viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="chronosGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fdf4ff"/><stop offset="50%" stop-color="#a855f7"/><stop offset="100%" stop-color="#090514"/></linearGradient></defs><circle cx="50" cy="50" r="46" fill="url(#chronosGrad)" stroke="#f0abfc" stroke-width="3.5"/><polygon points="50,4 54,18 68,10 62,24 76,22 66,34 80,40 68,48 80,56 66,62 76,74 62,72 68,86 54,78 50,92 46,78 32,86 38,72 24,74 34,62 20,56 32,48 20,40 34,34 24,22 38,24 32,10 46,18" fill="#581c87" stroke="#e879f9" stroke-width="1.5"/><circle cx="50" cy="50" r="20" fill="#090514" stroke="#fbbf24" stroke-width="2"/><circle cx="44" cy="46" r="3.5" fill="#fbbf24"/><circle cx="56" cy="46" r="3.5" fill="#fbbf24"/><line x1="50" y1="50" x2="50" y2="38" stroke="#fbbf24" stroke-width="2"/><line x1="50" y1="50" x2="60" y2="50" stroke="#fbbf24" stroke-width="2"/><circle cx="50" cy="50" r="2.5" fill="#fdf4ff"/></svg>`,

        // Milestone 2 Pets

        'Glacia Kitsune': `<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="30,70 50,30 70,70" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/><polygon points="34,36 40,16 48,32" fill="#0284c7"/><polygon points="52,32 60,16 66,36" fill="#0284c7"/><circle cx="44" cy="45" r="3" fill="#082f49"/><circle cx="56" cy="45" r="3" fill="#082f49"/><circle cx="50" cy="56" r="2.5" fill="#0284c7"/><path d="M20,65 Q10,45 25,35" stroke="#38bdf8" stroke-width="3" fill="none"/><path d="M80,65 Q90,45 75,35" stroke="#38bdf8" stroke-width="3" fill="none"/></svg>`,

        'Cinder Gargoyle': `<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="30,75 50,25 70,75" fill="#450a0a" stroke="#ea580c" stroke-width="2.5"/><polygon points="32,32 38,15 44,28" fill="#ea580c"/><polygon points="56,28 62,15 68,32" fill="#ea580c"/><circle cx="43" cy="42" r="3" fill="#fef08a"/><circle cx="57" cy="42" r="3" fill="#fef08a"/><path d="M22,50 Q10,35 18,22 Q30,35 26,55" fill="#991b1b" stroke="#f97316" stroke-width="1.5"/><path d="M78,50 Q90,35 82,22 Q70,35 74,55" fill="#991b1b" stroke="#f97316" stroke-width="1.5"/></svg>`,

        'Chronos Sprite': `<svg viewBox="0 0 100 100" width="100%" height="100%"><ellipse cx="50" cy="50" rx="30" ry="30" fill="#2e1065" stroke="#c084fc" stroke-width="3"/><ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="#fbbf24" stroke-width="2" transform="rotate(-25 50 50)"/><circle cx="44" cy="46" r="3.5" fill="#f5d0fe"/><circle cx="56" cy="46" r="3.5" fill="#f5d0fe"/><path d="M45,56 Q50,60 55,56" stroke="#f0abfc" stroke-width="2" fill="none"/></svg>`

,
        'Ignis, The Living Supernova': `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="32" fill="#f97316"/><circle cx="50" cy="50" r="24" fill="#fbbf24"/><circle cx="50" cy="50" r="16" fill="#fff7ed"/><path d="M50,8 L55,24 L45,24 Z M50,92 L55,76 L45,76 Z M8,50 L24,55 L24,45 Z M92,50 L76,55 L76,45 Z M20,20 L34,30 L26,38 Z M80,80 L66,70 L74,62 Z M80,20 L70,34 L62,26 Z M20,80 L30,66 L38,74 Z" fill="#ea580c"/><circle cx="42" cy="46" r="4" fill="#7f1d1d"/><circle cx="58" cy="46" r="4" fill="#7f1d1d"/></svg>`,
        'Leviathan, The Abyssal Sovereign': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M15,75 Q30,25 50,45 T85,25 Q75,70 50,65 T15,75 Z" fill="#0369a1"/><path d="M25,65 Q40,35 55,50 T75,40" stroke="#38bdf8" stroke-width="3" fill="none"/><polygon points="50,15 44,30 56,30" fill="#38bdf8"/><circle cx="44" cy="42" r="3.5" fill="#f0f9ff"/><circle cx="44" cy="42" r="1.5" fill="#0284c7"/><path d="M60,60 Q70,75 85,70 Q70,85 55,75 Z" fill="#0284c7"/></svg>`,
        'Chronos, Cosmic Void-Incarnate': `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="30" fill="#1e1b4b"/><ellipse cx="50" cy="50" rx="42" ry="14" fill="none" stroke="#a855f7" stroke-width="3" transform="rotate(-25 50 50)"/><ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="#38bdf8" stroke-width="2" transform="rotate(35 50 50)"/><circle cx="50" cy="50" r="14" fill="#090514"/><circle cx="50" cy="50" r="6" fill="#c084fc"/><path d="M48,22 L52,22 L52,32 L48,32 Z M48,68 L52,68 L52,78 L48,78 Z" fill="#f43f5e"/></svg>`,
        'Magma Totem': `<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="35" y="20" width="30" height="65" rx="4" fill="#78350f"/><rect x="30" y="30" width="40" height="10" fill="#9a3412"/><polygon points="40,20 50,10 60,20" fill="#ea580c"/><circle cx="44" cy="45" r="3" fill="#fde047"/><circle cx="56" cy="45" r="3" fill="#fde047"/><line x1="42" y1="65" x2="58" y2="65" stroke="#f97316" stroke-width="3"/></svg>`,
        'Abyssal Siren': `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M40,25 Q50,12 60,25 Q70,45 60,65 Q50,85 55,95 Q45,85 40,65 Q30,45 40,25 Z" fill="#0891b2"/><circle cx="50" cy="30" r="10" fill="#a5f3fc"/><path d="M30,40 Q15,50 25,65 Q35,55 35,45 Z" fill="#06b6d4"/><path d="M70,40 Q85,50 75,65 Q65,55 65,45 Z" fill="#06b6d4"/><circle cx="47" cy="28" r="2" fill="#0e7490"/><circle cx="53" cy="28" r="2" fill="#0e7490"/></svg>`
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



    const EXTENDED_AREAS = {

        area_6: {

            id: 'area_6',

            name: 'Luminous Sanctuary',

            bracket: 'Lv 26-30',

            minLevel: 26,

            maxLevel: 30,

            element: 'Light',

            themeColor: '#fde047',

            bgGradient: 'linear-gradient(135deg, #1c1917 0%, #3a3215 100%)',

            desc: 'An ancient celestial sanctuary floating above the clouds, guarded by holy constructs and radiant seraphs.',

            regularEnemies: [

                { name: 'Radiant Wisp', level: 26, element: 'Light', hp: 950, atk: 92, def: 58, matk: 110, mdef: 65, spd: 28, exp: 300, gold: 150, ai: 'fast', loot: [{ item: 'Hi-Potion', chance: 0.5 }, { item: 'Solar Greaves', chance: 0.15 }] },

                { name: 'Sunforged Golem', level: 27, element: 'Light', hp: 1300, atk: 98, def: 76, matk: 90, mdef: 68, spd: 18, exp: 340, gold: 170, ai: 'tank', loot: [{ item: 'Luminous Plate', chance: 0.2 }, { item: 'Radiant Vambraces', chance: 0.18 }] },

                { name: 'Dawn Seraph', level: 28, element: 'Light', hp: 1100, atk: 104, def: 62, matk: 130, mdef: 78, spd: 24, exp: 390, gold: 200, ai: 'magic', loot: [{ item: 'Crown of the Sun', chance: 0.2 }, { item: 'Seraphic Heart', chance: 0.12 }] },

                { name: 'Solar Griffin', level: 29, element: 'Light', hp: 1250, atk: 116, def: 68, matk: 115, mdef: 70, spd: 27, exp: 440, gold: 230, ai: 'balanced', loot: [{ item: 'Dawn Greatsword', chance: 0.22 }, { item: 'Solar Greaves', chance: 0.18 }] }

            ],

            boss: {

                name: 'Archon of Radiance',

                level: 30,

                element: 'Light',

                hp: 4800,

                atk: 155,

                def: 82,

                matk: 170,

                mdef: 85,

                spd: 26,

                exp: 2200,

                gold: 1200,

                ai: 'boss',

                isBoss: true,

                loot: [{ item: 'Dawn Greatsword', chance: 1.0 }, { item: 'Luminous Plate', chance: 1.0 }, { item: 'Seraphic Heart', chance: 0.5 }]

            },

            lootQuality: ['Dawn Greatsword', 'Luminous Plate', 'Crown of the Sun', 'Radiant Vambraces', 'Solar Greaves', 'Seraphic Heart']

        },

        area_7: {

            id: 'area_7',

            name: 'Thunderous Steppes',

            bracket: 'Lv 31-35',

            minLevel: 31,

            maxLevel: 35,

            element: 'Wind',

            themeColor: '#38bdf8',

            bgGradient: 'linear-gradient(135deg, #0c1a2e 0%, #1e3a5f 100%)',

            desc: 'Vast electrified plains scourged by perpetual lightning storms and volatile thunder beasts.',

            regularEnemies: [

                { name: 'Volt Stalker', level: 31, element: 'Wind', hp: 1400, atk: 128, def: 70, matk: 120, mdef: 72, spd: 34, exp: 520, gold: 270, ai: 'fast', loot: [{ item: 'Hi-Potion', chance: 0.5 }, { item: 'Zephyr Boots', chance: 0.18 }] },

                { name: 'Thunder Ram', level: 32, element: 'Wind', hp: 1900, atk: 135, def: 90, matk: 100, mdef: 80, spd: 22, exp: 580, gold: 300, ai: 'tank', loot: [{ item: 'Tempest Mail', chance: 0.2 }, { item: 'Volt Grips', chance: 0.18 }] },

                { name: 'Lightning Drake', level: 33, element: 'Wind', hp: 1650, atk: 148, def: 76, matk: 145, mdef: 78, spd: 30, exp: 650, gold: 340, ai: 'balanced', loot: [{ item: 'Thunderclap Edge', chance: 0.22 }, { item: 'Thunderstone Relic', chance: 0.15 }] },

                { name: 'Storm Elemental', level: 34, element: 'Wind', hp: 1550, atk: 130, def: 74, matk: 175, mdef: 92, spd: 28, exp: 730, gold: 390, ai: 'magic', loot: [{ item: 'Stormcaller Helm', chance: 0.2 }, { item: 'Tempest Mail', chance: 0.18 }] }

            ],

            boss: {

                name: 'Fulgur Apex',

                level: 35,

                element: 'Wind',

                hp: 6800,

                atk: 190,

                def: 98,

                matk: 210,

                mdef: 105,

                spd: 32,

                exp: 3500,

                gold: 2000,

                ai: 'boss',

                isBoss: true,

                loot: [{ item: 'Thunderclap Edge', chance: 1.0 }, { item: 'Tempest Mail', chance: 1.0 }, { item: 'Thunderstone Relic', chance: 0.5 }]

            },

            lootQuality: ['Thunderclap Edge', 'Tempest Mail', 'Stormcaller Helm', 'Volt Grips', 'Zephyr Boots', 'Thunderstone Relic']

        },

        area_8: {

            id: 'area_8',

            name: 'Glacial Frostpeaks',

            bracket: 'Lv 36-40',

            minLevel: 36,

            maxLevel: 40,

            element: 'Water',

            themeColor: '#38bdf8',

            bgGradient: 'linear-gradient(135deg, #082f49 0%, #164e63 100%)',

            desc: 'Perpetual blizzards rage across treacherous frozen pinnacles where ancient frost entities slumber beneath eternal ice.',

            regularEnemies: [

                { name: 'Frostfang Wolf', level: 36, element: 'Water', hp: 1650, atk: 145, def: 82, matk: 120, mdef: 78, spd: 36, exp: 850, gold: 440, ai: 'fast', loot: [{ item: 'Hi-Potion', chance: 0.5 }, { item: 'Glacier Striders', chance: 0.18 }] },

                { name: 'Glacial Golem', level: 37, element: 'Water', hp: 2300, atk: 152, def: 105, matk: 110, mdef: 95, spd: 20, exp: 920, gold: 480, ai: 'tank', loot: [{ item: 'Icebound Hauberk', chance: 0.2 }, { item: 'Permafrost Grips', chance: 0.18 }] },

                { name: 'Blizzard Harpy', level: 38, element: 'Water', hp: 1850, atk: 160, def: 85, matk: 175, mdef: 98, spd: 30, exp: 1000, gold: 520, ai: 'magic', loot: [{ item: 'Frostcrown Circlet', chance: 0.2 }, { item: 'Heart of Winter', chance: 0.15 }] },

                { name: 'Icebound Revenant', level: 39, element: 'Water', hp: 2100, atk: 172, def: 92, matk: 165, mdef: 90, spd: 28, exp: 1100, gold: 560, ai: 'balanced', loot: [{ item: 'Glacial Claymore', chance: 0.22 }, { item: 'Glacier Striders', chance: 0.18 }] }

            ],

            boss: {

                name: 'Frost Empress Glacia',

                level: 40,

                element: 'Water',

                hp: 6400,

                atk: 195,

                def: 110,

                matk: 220,

                mdef: 115,

                spd: 32,

                exp: 5000,

                gold: 2800,

                ai: 'boss',

                isBoss: true,

                loot: [{ item: 'Glacial Claymore', chance: 1.0 }, { item: 'Icebound Hauberk', chance: 1.0 }, { item: 'Heart of Winter', chance: 0.6 }]

            },

            lootQuality: ['Glacial Claymore', 'Frostcrown Circlet', 'Icebound Hauberk', 'Permafrost Grips', 'Glacier Striders', 'Heart of Winter']

        },

        area_9: {

            id: 'area_9',

            name: 'Molten Abyss',

            bracket: 'Lv 41-45',

            minLevel: 41,

            maxLevel: 45,

            element: 'Fire',

            themeColor: '#f97316',

            bgGradient: 'linear-gradient(135deg, #450a0a 0%, #7c2d12 100%)',

            desc: 'A subterranean chasm of molten magma and searing volcanic fissures, home to primordial fire titans.',

            regularEnemies: [

                { name: 'Magma Scuttler', level: 41, element: 'Fire', hp: 2200, atk: 185, def: 98, matk: 150, mdef: 90, spd: 38, exp: 1250, gold: 640, ai: 'fast', loot: [{ item: 'Elixir', chance: 0.4 }, { item: 'Lava Treads', chance: 0.18 }] },

                { name: 'Cinder Drake', level: 42, element: 'Fire', hp: 2650, atk: 205, def: 104, matk: 190, mdef: 100, spd: 32, exp: 1350, gold: 700, ai: 'balanced', loot: [{ item: 'Hellfire Reaver', chance: 0.2 }, { item: 'Cinder Fists', chance: 0.18 }] },

                { name: 'Lava Reaver', level: 43, element: 'Fire', hp: 2500, atk: 215, def: 100, matk: 225, mdef: 108, spd: 34, exp: 1480, gold: 760, ai: 'magic', loot: [{ item: 'Pyroclast Visor', chance: 0.2 }, { item: 'Infernal Core', chance: 0.15 }] },

                { name: 'Pyroclast Behemoth', level: 44, element: 'Fire', hp: 3400, atk: 225, def: 128, matk: 160, mdef: 115, spd: 22, exp: 1620, gold: 830, ai: 'tank', loot: [{ item: 'Molten Carapace', chance: 0.22 }, { item: 'Lava Treads', chance: 0.18 }] }

            ],

            boss: {

                name: 'Ignis Primordial',

                level: 45,

                element: 'Fire',

                hp: 8800,

                atk: 255,

                def: 125,

                matk: 275,

                mdef: 130,

                spd: 35,

                exp: 7500,

                gold: 4200,

                ai: 'boss',

                isBoss: true,

                loot: [{ item: 'Hellfire Reaver', chance: 1.0 }, { item: 'Molten Carapace', chance: 1.0 }, { item: 'Infernal Core', chance: 0.6 }]

            },

            lootQuality: ['Hellfire Reaver', 'Pyroclast Visor', 'Molten Carapace', 'Cinder Fists', 'Lava Treads', 'Infernal Core']

        },

        area_10: {

            id: 'area_10',

            name: 'The Celestial Void Rift',

            bracket: 'Lv 46-50',

            minLevel: 46,

            maxLevel: 50,

            element: 'Dark',

            themeColor: '#c084fc',

            bgGradient: 'linear-gradient(135deg, #090514 0%, #2e1065 100%)',

            desc: 'A shattering dimensional tear at the edge of the cosmos where reality unravels, ruled by the timeless sovereign of the void.',

            regularEnemies: [

                { name: 'Chrono Phantom', level: 46, element: 'Dark', hp: 2800, atk: 235, def: 112, matk: 240, mdef: 115, spd: 44, exp: 1850, gold: 950, ai: 'fast', loot: [{ item: 'Elixir', chance: 0.5 }, { item: 'Cosmic Striders', chance: 0.18 }] },

                { name: 'Starfall Entity', level: 47, element: 'Dark', hp: 3100, atk: 245, def: 118, matk: 285, mdef: 128, spd: 36, exp: 2000, gold: 1050, ai: 'magic', loot: [{ item: 'Crown of the Singularity', chance: 0.2 }, { item: 'Eye of Eternity', chance: 0.15 }] },

                { name: 'Dimensional Horror', level: 48, element: 'Dark', hp: 3600, atk: 265, def: 126, matk: 260, mdef: 122, spd: 38, exp: 2200, gold: 1150, ai: 'balanced', loot: [{ item: 'Infinity Edge of Chronos', chance: 0.2 }, { item: 'Dimension Gauntlets', chance: 0.18 }] },

                { name: 'Singularity Titan', level: 49, element: 'Dark', hp: 4600, atk: 275, def: 148, matk: 220, mdef: 138, spd: 26, exp: 2450, gold: 1280, ai: 'tank', loot: [{ item: 'Aegis of the Void God', chance: 0.22 }, { item: 'Cosmic Striders', chance: 0.18 }] }

            ],

            boss: {

                name: 'Chronos, The Void Sovereign',

                level: 50,

                element: 'Dark',

                hp: 13500,

                atk: 320,

                def: 155,

                matk: 345,

                mdef: 160,

                spd: 42,

                exp: 15000,

                gold: 8000,

                ai: 'boss',

                isBoss: true,

                loot: [{ item: 'Infinity Edge of Chronos', chance: 1.0 }, { item: 'Aegis of the Void God', chance: 1.0 }, { item: 'Eye of Eternity', chance: 0.8 }]

            },

            lootQuality: ['Infinity Edge of Chronos', 'Crown of the Singularity', 'Aegis of the Void God', 'Dimension Gauntlets', 'Cosmic Striders', 'Eye of Eternity']

        }

    };



    for (let k in EXTENDED_AREAS) {

        Object.defineProperty(AREAS_DB, k, {

            value: EXTENDED_AREAS[k],

            enumerable: false,

            writable: true,

            configurable: true

        });

    }



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

        mirage: { id: 'mirage', name: 'Mirage', icon: '🌀', element: 'Wind', type: 'buff', maxStacks: 5, color: '#67e8f9', desc: '40% chance to completely dodge an incoming attack.' },

        counter_stance: { id: 'counter_stance', name: 'Counter', icon: '⚔️', element: 'Physical', type: 'buff', color: '#f97316', desc: 'Retaliates immediately when struck by a physical attack.' },

        

        // Tactical Buffs & Stat Modifiers

        berserk: { id: 'berserk', name: 'Berserk', icon: '💥', element: 'Physical', type: 'buff', color: '#dc2626', desc: '+40% ATK, -25% DEF, takes 5% self-damage each turn.' },

        focus: { id: 'focus', name: 'Focus', icon: '🎯', element: 'Physical', type: 'buff', color: '#3b82f6', desc: '+25% Crit chance and 2.0x crit damage multiplier.' },

        armor_break: { id: 'armor_break', name: 'Armor Break', icon: '🛡️-', element: 'Physical', type: 'debuff', color: '#f59e0b', desc: 'Reduces DEF by 30%.' },

        haste: { id: 'haste', name: 'Haste', icon: '💨', element: 'Speed', type: 'buff', color: '#06b6d4', desc: '+30% Speed.' },

        slow: { id: 'slow', name: 'Slow', icon: '🐌', element: 'Speed', type: 'debuff', color: '#78716c', desc: '-30% Speed.' },

        battle_cry: { id: 'battle_cry', name: 'War Cry', icon: '📢', element: 'Physical', type: 'buff', color: '#f59e0b', desc: '+20% ATK.' }

,
        staggered: { id: 'staggered', name: 'Staggered', icon: '💫⚡', element: 'Physical', type: 'disable', color: '#f43f5e', desc: 'Staggered! Cannot act, DEF and MDEF reduced by 50%, takes +50% amplified damage.' },
        armor_shatter: { id: 'armor_shatter', name: 'Armor Shatter', icon: '💔', element: 'Physical', type: 'debuff', maxStacks: 2, color: '#e11d48', desc: 'Reduces DEF & MDEF by 30% per stack (up to 2 stacks: -60%).' },
        doom_brand: { id: 'doom_brand', name: 'Doom Brand', icon: '☠️⏳', element: 'Dark', type: 'debuff', color: '#a855f7', desc: 'Cursed with Doom! Must deal 1,500 damage or cleanse before countdown reaches 0 or suffers lethal void damage.' },
        glacial_prison: { id: 'glacial_prison', name: 'Glacial Prison', icon: '🧊', element: 'Water', type: 'disable', color: '#06b6d4', desc: 'Encased in solid ice! Incapacitated until allies deal 3,000 damage to shatter the block.' },
        marked: { id: 'marked', name: 'Marked Prey', icon: '🎯', element: 'Physical', type: 'debuff', color: '#16a34a', desc: 'Marked for death! Takes +25% amplified damage from all attacks.' },
        beast_roar: { id: 'beast_roar', name: 'Beast Roar', icon: '🐾', element: 'Physical', type: 'buff', color: '#10b981', desc: 'Empowered by the beast: +20% ATK and +15 SPD.' },
        primal_roar: { id: 'primal_roar', name: 'Primal Roar', icon: '🦁', element: 'Physical', type: 'buff', color: '#ca8a04', desc: 'Primal aura active: +25% ATK, +20 SPD, and immune to Stun and Silence.' },
        holy_vulnerability: { id: 'holy_vulnerability', name: 'Holy Vulnerability', icon: '✨🔥', element: 'Light', type: 'debuff', color: '#ffd700', desc: 'Afflicted by sacred fire: takes +25% amplified Holy damage for 3 turns.' },
        sanctuary_protection: { id: 'sanctuary_protection', name: 'Sanctuary Protection', icon: '🛡️✨', element: 'Light', type: 'buff', color: '#fef08a', desc: 'Blessed sanctuary: DEF and MDEF increased by 15%.' }
    };



    const SKILLS_DB = {

        // Base Skills (Categorized)

        'Fireball': { name: 'Fireball', category: 'offense', type: 'magic', element: ELEMENTS.Fire, power: 45, mp: 6, target: 'enemy_single' },

        'Water Splash': { name: 'Water Splash', category: 'offense', type: 'magic', element: ELEMENTS.Water, power: 40, mp: 5, target: 'enemy_single' },

        'Earth Spike': { name: 'Earth Spike', category: 'offense', type: 'magic', element: ELEMENTS.Earth, power: 55, mp: 8, target: 'enemy_single' },

        'Wind Blade': { name: 'Wind Blade', category: 'offense', type: 'magic', element: ELEMENTS.Wind, power: 40, mp: 5, target: 'enemy_single' },

        // (Replaced by Cleric Holy Light)

        'Dark Blast': { name: 'Dark Blast', category: 'offense', type: 'magic', element: ELEMENTS.Dark, power: 70, mp: 12, target: 'enemy_single' },

        'Heal': { name: 'Heal', category: 'defense', type: 'heal', element: ELEMENTS.Light, power: 60, mp: 8, target: 'ally_single' },

        'Cleave': { name: 'Cleave', category: 'offense', type: 'physical', element: ELEMENTS.Physical, power: 30, mp: 10, target: 'enemy_all' },

        'Power Strike': { name: 'Power Strike', category: 'offense', type: 'physical', element: ELEMENTS.Physical, power: 45, mp: 6, target: 'enemy_single' },

        'Armor Break': { name: 'Armor Break', category: 'utility', type: 'physical', element: ELEMENTS.Physical, power: 25, mp: 8, target: 'enemy_single' },

        'Recovery': { name: 'Recovery', category: 'defense', type: 'heal', element: ELEMENTS.Light, power: 75, mp: 10, target: 'ally_single' },



        // Warrior & Evolutions

        'Heavy Slam': { name: 'Heavy Slam', category: 'offense', type: 'physical', element: ELEMENTS.Physical, power: 65, mp: 10, target: 'enemy_single' },

        'Battle Cry': { name: 'Battle Cry', category: 'utility', type: 'buff', element: ELEMENTS.Physical, power: 0, mp: 8, target: 'self' },

        'Bloodthirst Strike': { name: 'Bloodthirst Strike', category: 'offense', type: 'physical', element: ELEMENTS.Physical, power: 70, mp: 12, target: 'enemy_single' },

        'Whirlwind of Blades': { name: 'Whirlwind of Blades', category: 'offense', type: 'physical', element: ELEMENTS.Physical, power: 50, mp: 16, target: 'enemy_all' },

        'Holy Smite': { name: 'Holy Smite', category: 'offense', type: 'magic', element: ELEMENTS.Light, power: 60, mp: 14, target: 'enemy_single' },

        'Shield of Faith': { name: 'Shield of Faith', category: 'defense', type: 'buff', element: ELEMENTS.Light, power: 0, mp: 15, target: 'self' },



        // Mage & Evolutions

        'Arcane Missiles': { name: 'Arcane Missiles', category: 'offense', type: 'magic', element: ELEMENTS.Physical, power: 55, mp: 8, target: 'enemy_single' },

        'Frost Nova': { name: 'Frost Nova', category: 'utility', type: 'magic', element: ELEMENTS.Water, power: 35, mp: 12, target: 'enemy_all' },

        'Blizzard': { name: 'Blizzard', category: 'offense', type: 'magic', element: ELEMENTS.Water, power: 70, mp: 20, target: 'enemy_all' },

        'Chain Lightning': { name: 'Chain Lightning', category: 'offense', type: 'magic', element: ELEMENTS.Wind, power: 65, mp: 18, target: 'enemy_all' },

        'Soul Siphon': { name: 'Soul Siphon', category: 'utility', type: 'magic', element: ELEMENTS.Dark, power: 60, mp: 14, target: 'enemy_single' },

        'Shadow Rupture': { name: 'Shadow Rupture', category: 'offense', type: 'magic', element: ELEMENTS.Dark, power: 60, mp: 16, target: 'enemy_single' },



        // Rogue & Evolutions

        'Quick Slash': { name: 'Quick Slash', category: 'offense', type: 'physical', element: ELEMENTS.Physical, power: 45, mp: 6, target: 'enemy_single' },

        'Smoke Screen': { name: 'Smoke Screen', category: 'utility', type: 'buff', element: ELEMENTS.Physical, power: 20, mp: 8, target: 'enemy_single' },

        'Shadow Step': { name: 'Shadow Step', category: 'offense', type: 'physical', element: ELEMENTS.Physical, power: 75, mp: 15, target: 'enemy_single' },

        'Venom Spray': { name: 'Venom Spray', category: 'utility', type: 'magic', element: ELEMENTS.Earth, power: 30, mp: 16, target: 'enemy_all' },

        'Mirage Flurry': { name: 'Mirage Flurry', category: 'offense', type: 'physical', element: ELEMENTS.Physical, power: 25, mp: 14, target: 'enemy_single' },

        'Blade Dance': { name: 'Blade Dance', category: 'defense', type: 'buff', element: ELEMENTS.Physical, power: 0, mp: 12, target: 'self' },
        // Ranger & Marksman Evolutions
        'Aimed Shot': { name: 'Aimed Shot', category: 'offense', type: 'physical', element: ELEMENTS.Physical, power: 160, mp: 8, target: 'enemy_single', desc: 'Carefully line up a shot. Deals 160% ATK physical damage with +20% bonus critical strike chance.' },
        'Marked Prey': { name: 'Marked Prey', category: 'offense', type: 'physical', element: ELEMENTS.Physical, power: 100, mp: 10, target: 'enemy_single', desc: "Tag a target with a hunter's mark. Deals 100% ATK physical damage and applies Marked (+25% damage taken) for 3 turns." },
        'Pack Hunt': { name: 'Pack Hunt', category: 'offense', type: 'physical', element: ELEMENTS.Physical, power: 180, mp: 14, target: 'enemy_single', desc: 'Coordinate a synchronized strike with your companion beast. Deals 180% ATK physical damage and triggers a bonus pet attack for 100% Beastmaster ATK.' },
        'Beast Roar': { name: 'Beast Roar', category: 'buff', type: 'support', element: ELEMENTS.Physical, power: 0, mp: 16, target: 'all_allies', desc: 'Unleash a ferocious command roar that invigorates the squad. Grants all party members +20% ATK and +15 SPD for 3 turns.' },
        'Piercing Shot': { name: 'Piercing Shot', category: 'offense', type: 'physical', element: ELEMENTS.Physical, power: 200, mp: 12, target: 'enemy_single', desc: "Fire a heavy sabot arrow that punches through armor. Deals 200% ATK physical damage, ignoring 50% of the target's physical DEF." },
        'Headshot Stagger': { name: 'Headshot Stagger', category: 'offense', type: 'physical', element: ELEMENTS.Physical, power: 220, mp: 18, target: 'enemy_single', desc: 'Snipe a vital weak point with immense concussive force. Deals 220% ATK physical damage and deals 2.5x stagger damage against Boss Break/Stagger Gauges.' },
        // Cleric & Evolutions
        'Holy Light': { name: 'Holy Light', category: 'heal', type: 'heal', element: ELEMENTS.Light, power: 180, mp: 18, target: 'ally_single', desc: 'Restores HP equal to 180% MATK. Any excess healing above Max HP converts into a temporary Divine Barrier (up to 30% Max HP).' },
        'Purify': { name: 'Purify', category: 'defense', type: 'buff', element: ELEMENTS.Light, power: 0, mp: 15, target: 'ally_single', desc: 'Dispels all negative status ailments (Burn, Poison, Freeze, Silence, Stun, Decay, Blind) from the target and grants a Divine Barrier equal to 15% Max HP.' },
        'Prayer of Sanctuary': { name: 'Prayer of Sanctuary', category: 'defense', type: 'heal', element: ELEMENTS.Light, power: 130, mp: 35, target: 'all_allies', desc: 'Heals all living party members for 130% MATK, removes 1 negative status debuff from each, and grants +15% DEF/MDEF for 2 turns.' },
        'Divine Intervention': { name: 'Divine Intervention', category: 'defense', type: 'buff', element: ELEMENTS.Light, power: 0, mp: 30, target: 'ally_single', desc: "Instantly grants a massive Divine Barrier equal to 40% of the target's Max HP and applies Regen (restoring 15% Max HP per turn) for 3 turns." },
        'Radiant Smite': { name: 'Radiant Smite', category: 'offense', type: 'magic', element: ELEMENTS.Light, power: 170, mp: 22, target: 'enemy_single', desc: 'Deals 170% MATK + 80% ATK Holy damage. 50% of the damage dealt is immediately restored to the lowest HP party member.' },
        'Judgement Pyre': { name: 'Judgement Pyre', category: 'offense', type: 'magic', element: ELEMENTS.Fire, power: 140, mp: 32, target: 'enemy_all', desc: 'Engulfs all enemies in sacred fire dealing 140% MATK damage, inflicting Burn (3 turns) and Holy Vulnerability (targets take +25% Holy damage for 3 turns).' },
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

        'Mythic Reforge Rune': { type: 'consumable', effect: 'mythic_rune', price: 200, desc: 'A mystical rune from the Astral Altar that guarantees maximum-tier rolls when reforging.' },



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

        'Amulet of Mana': { type: 'accessory', maxMp: 25, mdef: 3, price: 180, desc: '+25 Max MP, +3 MDEF' },



        // Area 4 (Infernal Caldera) Base Equipment

        'Obsidian Blade': { type: 'weapon', atk: 26, matk: 8, price: 380, desc: '+26 ATK, +8 MATK' },

        'Dragon Scale Mail': { type: 'armor', def: 22, mdef: 12, price: 420, desc: '+22 DEF, +12 MDEF' },

        'Flameforged Crown': { type: 'helmet', def: 10, mdef: 8, price: 260, desc: '+10 DEF, +8 MDEF' },

        'Lava Gauntlets': { type: 'gloves', def: 6, atk: 5, price: 240, desc: '+6 DEF, +5 ATK' },

        'Cinder Striders': { type: 'boots', def: 5, spd: 12, price: 280, desc: '+5 DEF, +12 SPD' },

        'Fireheart Talisman': { type: 'accessory', maxHp: 60, atk: 4, price: 350, desc: '+60 Max HP, +4 ATK' },



        // Area 5 (Abyssal Void) Base Equipment

        'Voidcleaver': { type: 'weapon', atk: 38, matk: 20, price: 850, desc: '+38 ATK, +20 MATK' },

        'Celestial Plate': { type: 'armor', def: 32, mdef: 18, price: 900, desc: '+32 DEF, +18 MDEF' },

        'Astral Hood': { type: 'helmet', def: 14, mdef: 18, price: 650, desc: '+14 DEF, +18 MDEF' },

        'Voidtouch Grips': { type: 'gloves', def: 8, matk: 10, price: 600, desc: '+8 DEF, +10 MATK' },

        'Phase Treads': { type: 'boots', def: 7, spd: 18, price: 700, desc: '+7 DEF, +18 SPD' },

        'Eye of the Cosmos': { type: 'accessory', maxHp: 100, maxMp: 50, price: 950, desc: '+100 Max HP, +50 Max MP' },

        // Area 6 (Luminous Sanctuary) Equipment

        'Dawn Greatsword': { type: 'weapon', atk: 52, matk: 28, price: 1500, desc: '+52 ATK, +28 MATK' },

        'Luminous Plate': { type: 'armor', def: 44, mdef: 28, price: 1600, desc: '+44 DEF, +28 MDEF' },

        'Crown of the Sun': { type: 'helmet', def: 20, mdef: 24, price: 1100, desc: '+20 DEF, +24 MDEF' },

        'Radiant Vambraces': { type: 'gloves', def: 12, atk: 14, matk: 14, price: 1000, desc: '+12 DEF, +14 ATK, +14 MATK' },

        'Solar Greaves': { type: 'boots', def: 10, spd: 24, price: 1200, desc: '+10 DEF, +24 SPD' },

        'Seraphic Heart': { type: 'accessory', maxHp: 160, maxMp: 80, price: 1800, desc: '+160 Max HP, +80 Max MP' },

        // Area 7 (Thunderous Steppes) Equipment

        'Thunderclap Edge': { type: 'weapon', atk: 68, spd: 12, price: 2400, desc: '+68 ATK, +12 SPD' },

        'Tempest Mail': { type: 'armor', def: 58, mdef: 38, price: 2600, desc: '+58 DEF, +38 MDEF' },

        'Stormcaller Helm': { type: 'helmet', def: 26, mdef: 30, price: 1800, desc: '+26 DEF, +30 MDEF' },

        'Volt Grips': { type: 'gloves', def: 16, crit: 8, price: 1600, desc: '+16 DEF, +8% Crit' },

        'Zephyr Boots': { type: 'boots', def: 14, spd: 32, price: 2000, desc: '+14 DEF, +32 SPD' },

        'Thunderstone Relic': { type: 'accessory', maxHp: 220, atk: 12, spd: 8, price: 2800, desc: '+220 Max HP, +12 ATK, +8 SPD' },

        // Tier 5 Glacial Gear (Area 8)

        'Glacial Claymore': { type: 'weapon', atk: 75, matk: 20, maxHp: 18, crit: 6, price: 2600, desc: '+75 ATK, +20 MATK, +18 Max HP, +6% Crit' },

        'Frostcrown Circlet': { type: 'helmet', def: 42, mdef: 30, maxHp: 45, spd: 10, price: 2100, desc: '+42 DEF, +30 MDEF, +45 Max HP, +10 SPD' },

        'Icebound Hauberk': { type: 'armor', def: 58, mdef: 38, maxHp: 70, price: 2500, desc: '+58 DEF, +38 MDEF, +70 Max HP' },

        'Permafrost Grips': { type: 'gloves', atk: 30, def: 22, spd: 8, crit: 6, price: 2000, desc: '+30 ATK, +22 DEF, +8 SPD, +6% Crit' },

        'Glacier Striders': { type: 'boots', def: 26, spd: 24, maxHp: 40, crit: 5, price: 2200, desc: '+26 DEF, +24 SPD, +40 Max HP, +5% Crit' },

        'Heart of Winter': { type: 'accessory', maxHp: 50, maxMp: 35, matk: 22, mdef: 14, price: 2800, desc: '+50 Max HP, +35 Max MP, +22 MATK, +14 MDEF' },

        // Tier 5 Magma Gear (Area 9)

        'Hellfire Reaver': { type: 'weapon', atk: 95, matk: 25, maxHp: 25, crit: 8, price: 3800, desc: '+95 ATK, +25 MATK, +25 Max HP, +8% Crit' },

        'Pyroclast Visor': { type: 'helmet', def: 52, mdef: 38, maxHp: 60, spd: 12, price: 3200, desc: '+52 DEF, +38 MDEF, +60 Max HP, +12 SPD' },

        'Molten Carapace': { type: 'armor', def: 72, mdef: 46, maxHp: 90, price: 3600, desc: '+72 DEF, +46 MDEF, +90 Max HP' },

        'Cinder Fists': { type: 'gloves', atk: 38, def: 28, spd: 10, crit: 7, price: 3000, desc: '+38 ATK, +28 DEF, +10 SPD, +7% Crit' },

        'Lava Treads': { type: 'boots', def: 32, spd: 28, maxHp: 50, crit: 6, price: 3200, desc: '+32 DEF, +28 SPD, +50 Max HP, +6% Crit' },

        'Infernal Core': { type: 'accessory', maxHp: 65, maxMp: 45, matk: 28, mdef: 18, price: 4000, desc: '+65 Max HP, +45 Max MP, +28 MATK, +18 MDEF' },

        // Tier 6 Apex Mythic Gear (Area 10)

        'Infinity Edge of Chronos': { type: 'weapon', atk: 125, matk: 45, maxHp: 40, spd: 15, crit: 12, price: 6500, desc: '+125 ATK, +45 MATK, +40 Max HP, +15 SPD, +12% Crit' },

        'Crown of the Singularity': { type: 'helmet', def: 68, mdef: 52, maxHp: 80, maxMp: 35, spd: 16, price: 5500, desc: '+68 DEF, +52 MDEF, +80 Max HP, +35 Max MP, +16 SPD' },

        'Aegis of the Void God': { type: 'armor', def: 92, mdef: 64, maxHp: 125, price: 6200, desc: '+92 DEF, +64 MDEF, +125 Max HP' },

        'Dimension Gauntlets': { type: 'gloves', atk: 48, def: 38, spd: 14, crit: 10, price: 5200, desc: '+48 ATK, +38 DEF, +14 SPD, +10% Crit' },

        'Cosmic Striders': { type: 'boots', def: 42, spd: 36, maxHp: 70, crit: 8, price: 5400, desc: '+42 DEF, +36 SPD, +70 Max HP, +8% Crit' },

        'Eye of Eternity': { type: 'accessory', maxHp: 90, maxMp: 65, matk: 40, mdef: 25, crit: 10, price: 7000, desc: '+90 Max HP, +65 Max MP, +40 MATK, +25 MDEF, +10% Crit' },

        "Mercenary's Signet": { type: 'accessory', maxHp: 40, crit: 5, goldBonus: 15, price: 1200, desc: 'A battle-worn signet ring awarded to elite guild hunters. Grants +15% bonus Gold from victories and +5% Crit Rate.' },

        'mercenary_signet': { type: 'accessory', maxHp: 40, crit: 5, goldBonus: 15, price: 1200, desc: 'A battle-worn signet ring awarded to elite guild hunters. Grants +15% bonus Gold from victories and +5% Crit Rate.' }

,
        // Calamity Essences & Raid Keys
        'Ignis Heart': { type: 'material', price: 1000, desc: 'Primordial volcanic core harvested from Ignis, The Living Supernova. Used at the Mythic Forge.' },
        'ignis_heart': { type: 'material', price: 1000, desc: 'Primordial volcanic core harvested from Ignis, The Living Supernova. Used at the Mythic Forge.' },
        'Abyssal Pearl': { type: 'material', price: 1000, desc: 'Shimmering ocean pearl vibrating with deep sea pressure, harvested from Leviathan. Used at the Mythic Forge.' },
        'abyssal_pearl': { type: 'material', price: 1000, desc: 'Shimmering ocean pearl vibrating with deep sea pressure, harvested from Leviathan. Used at the Mythic Forge.' },
        'Chronos Riftcore': { type: 'material', price: 1000, desc: 'A swirling singularity core holding cosmic void power, harvested from Chronos. Used at the Mythic Forge.' },
        'chronos_riftcore': { type: 'material', price: 1000, desc: 'A swirling singularity core holding cosmic void power, harvested from Chronos. Used at the Mythic Forge.' },
        'Calamity Keystone': { type: 'keystone', price: 500, desc: 'A pulsing primordial relic that unlocks access to the Abyssal Calamity Rifts. Consumed only upon raid victory.' },
        'calamity_keystone': { type: 'keystone', price: 500, desc: 'A pulsing primordial relic that unlocks access to the Abyssal Calamity Rifts. Consumed only upon raid victory.' },

        // Mythic Set 1: Titan's Bulwark
        "Titan's Helm": { type: 'helmet', def: 75, mdef: 55, maxHp: 90, price: 6500, rarity: 'Mythic', setId: 'titans_bulwark', setName: "Titan's Bulwark", desc: "+75 DEF, +55 MDEF, +90 Max HP [Set: Titan's Bulwark]" },
        "titan_helm": { type: 'helmet', def: 75, mdef: 55, maxHp: 90, price: 6500, rarity: 'Mythic', setId: 'titans_bulwark', setName: "Titan's Bulwark", desc: "+75 DEF, +55 MDEF, +90 Max HP [Set: Titan's Bulwark]" },
        "Titan's Chestplate": { type: 'armor', def: 105, mdef: 70, maxHp: 150, price: 7500, rarity: 'Mythic', setId: 'titans_bulwark', setName: "Titan's Bulwark", desc: "+105 DEF, +70 MDEF, +150 Max HP [Set: Titan's Bulwark]" },
        "titan_chest": { type: 'armor', def: 105, mdef: 70, maxHp: 150, price: 7500, rarity: 'Mythic', setId: 'titans_bulwark', setName: "Titan's Bulwark", desc: "+105 DEF, +70 MDEF, +150 Max HP [Set: Titan's Bulwark]" },
        "Titan's Gauntlets": { type: 'gloves', atk: 50, def: 45, maxHp: 70, price: 6000, rarity: 'Mythic', setId: 'titans_bulwark', setName: "Titan's Bulwark", desc: "+50 ATK, +45 DEF, +70 Max HP [Set: Titan's Bulwark]" },
        "titan_gauntlets": { type: 'gloves', atk: 50, def: 45, maxHp: 70, price: 6000, rarity: 'Mythic', setId: 'titans_bulwark', setName: "Titan's Bulwark", desc: "+50 ATK, +45 DEF, +70 Max HP [Set: Titan's Bulwark]" },
        "Titan's Greaves": { type: 'boots', def: 50, spd: 30, maxHp: 80, price: 6000, rarity: 'Mythic', setId: 'titans_bulwark', setName: "Titan's Bulwark", desc: "+50 DEF, +30 SPD, +80 Max HP [Set: Titan's Bulwark]" },
        "titan_greaves": { type: 'boots', def: 50, spd: 30, maxHp: 80, price: 6000, rarity: 'Mythic', setId: 'titans_bulwark', setName: "Titan's Bulwark", desc: "+50 DEF, +30 SPD, +80 Max HP [Set: Titan's Bulwark]" },

                "titans_helm": { type: 'helmet', def: 75, mdef: 55, maxHp: 90, price: 6500, rarity: 'Mythic', setId: 'titans_bulwark', setName: "Titan's Bulwark", desc: "+75 DEF, +55 MDEF, +90 Max HP [Set: Titan's Bulwark]" },
        "titans_chestplate": { type: 'armor', def: 105, mdef: 70, maxHp: 150, price: 7500, rarity: 'Mythic', setId: 'titans_bulwark', setName: "Titan's Bulwark", desc: "+105 DEF, +70 MDEF, +150 Max HP [Set: Titan's Bulwark]" },
        "titans_gauntlets": { type: 'gloves', atk: 50, def: 45, maxHp: 70, price: 6000, rarity: 'Mythic', setId: 'titans_bulwark', setName: "Titan's Bulwark", desc: "+50 ATK, +45 DEF, +70 Max HP [Set: Titan's Bulwark]" },
        "titans_greaves": { type: 'boots', def: 50, spd: 30, maxHp: 80, price: 6000, rarity: 'Mythic', setId: 'titans_bulwark', setName: "Titan's Bulwark", desc: "+50 DEF, +30 SPD, +80 Max HP [Set: Titan's Bulwark]" },
        // Mythic Set 2: Archon's Voidweave
        "Archon's Crown": { type: 'helmet', def: 45, mdef: 65, maxMp: 50, matk: 40, price: 6500, rarity: 'Mythic', setId: 'archons_voidweave', setName: "Archon's Voidweave", desc: "+45 DEF, +65 MDEF, +50 Max MP, +40 MATK [Set: Archon's Voidweave]" },
        "archon_crown": { type: 'helmet', def: 45, mdef: 65, maxMp: 50, matk: 40, price: 6500, rarity: 'Mythic', setId: 'archons_voidweave', setName: "Archon's Voidweave", desc: "+45 DEF, +65 MDEF, +50 Max MP, +40 MATK [Set: Archon's Voidweave]" },
        "Archon's Robes": { type: 'armor', def: 55, mdef: 95, maxHp: 90, matk: 60, price: 7500, rarity: 'Mythic', setId: 'archons_voidweave', setName: "Archon's Voidweave", desc: "+55 DEF, +95 MDEF, +90 Max HP, +60 MATK [Set: Archon's Voidweave]" },
        "archon_robes": { type: 'armor', def: 55, mdef: 95, maxHp: 90, matk: 60, price: 7500, rarity: 'Mythic', setId: 'archons_voidweave', setName: "Archon's Voidweave", desc: "+55 DEF, +95 MDEF, +90 Max HP, +60 MATK [Set: Archon's Voidweave]" },
        "Archon's Gloves": { type: 'gloves', matk: 50, mdef: 40, maxMp: 40, spd: 15, price: 6000, rarity: 'Mythic', setId: 'archons_voidweave', setName: "Archon's Voidweave", desc: "+50 MATK, +40 MDEF, +40 Max MP, +15 SPD [Set: Archon's Voidweave]" },
        "archon_gloves": { type: 'gloves', matk: 50, mdef: 40, maxMp: 40, spd: 15, price: 6000, rarity: 'Mythic', setId: 'archons_voidweave', setName: "Archon's Voidweave", desc: "+50 MATK, +40 MDEF, +40 Max MP, +15 SPD [Set: Archon's Voidweave]" },
        "Archon's Slippers": { type: 'boots', def: 35, mdef: 50, spd: 35, maxMp: 35, price: 6000, rarity: 'Mythic', setId: 'archons_voidweave', setName: "Archon's Voidweave", desc: "+35 DEF, +50 MDEF, +35 SPD, +35 Max MP [Set: Archon's Voidweave]" },
        "archon_slippers": { type: 'boots', def: 35, mdef: 50, spd: 35, maxMp: 35, price: 6000, rarity: 'Mythic', setId: 'archons_voidweave', setName: "Archon's Voidweave", desc: "+35 DEF, +50 MDEF, +35 SPD, +35 Max MP [Set: Archon's Voidweave]" },

        // Mythic Set 3: Shadowstalker Regalia
        "Shadowstalker Cowl": { type: 'helmet', def: 55, mdef: 45, spd: 25, crit: 10, price: 6500, rarity: 'Mythic', setId: 'shadowstalker_regalia', setName: "Shadowstalker Regalia", desc: "+55 DEF, +45 MDEF, +25 SPD, +10% Crit [Set: Shadowstalker Regalia]" },
        "shadowstalker_cowl": { type: 'helmet', def: 55, mdef: 45, spd: 25, crit: 10, price: 6500, rarity: 'Mythic', setId: 'shadowstalker_regalia', setName: "Shadowstalker Regalia", desc: "+55 DEF, +45 MDEF, +25 SPD, +10% Crit [Set: Shadowstalker Regalia]" },
        "Shadowstalker Vest": { type: 'armor', def: 75, mdef: 55, atk: 45, spd: 20, price: 7500, rarity: 'Mythic', setId: 'shadowstalker_regalia', setName: "Shadowstalker Regalia", desc: "+75 DEF, +55 MDEF, +45 ATK, +20 SPD [Set: Shadowstalker Regalia]" },
        "shadowstalker_vest": { type: 'armor', def: 75, mdef: 55, atk: 45, spd: 20, price: 7500, rarity: 'Mythic', setId: 'shadowstalker_regalia', setName: "Shadowstalker Regalia", desc: "+75 DEF, +55 MDEF, +45 ATK, +20 SPD [Set: Shadowstalker Regalia]" },
        "Shadowstalker Bracers": { type: 'gloves', atk: 55, spd: 20, crit: 12, price: 6000, rarity: 'Mythic', setId: 'shadowstalker_regalia', setName: "Shadowstalker Regalia", desc: "+55 ATK, +20 SPD, +12% Crit [Set: Shadowstalker Regalia]" },
        "shadowstalker_bracers": { type: 'gloves', atk: 55, spd: 20, crit: 12, price: 6000, rarity: 'Mythic', setId: 'shadowstalker_regalia', setName: "Shadowstalker Regalia", desc: "+55 ATK, +20 SPD, +12% Crit [Set: Shadowstalker Regalia]" },
        "Shadowstalker Boots": { type: 'boots', def: 45, spd: 40, crit: 8, price: 6000, rarity: 'Mythic', setId: 'shadowstalker_regalia', setName: "Shadowstalker Regalia", desc: "+45 DEF, +40 SPD, +8% Crit [Set: Shadowstalker Regalia]" },
        "shadowstalker_boots": { type: 'boots', def: 45, spd: 40, crit: 8, price: 6000, rarity: 'Mythic', setId: 'shadowstalker_regalia', setName: "Shadowstalker Regalia", desc: "+45 DEF, +40 SPD, +8% Crit [Set: Shadowstalker Regalia]" },

        // Mythic Set 4: Hallowed Seraphim
        "Seraph's Diadem": { type: 'helmet', def: 50, mdef: 70, maxHp: 70, maxMp: 45, matk: 35, price: 6500, rarity: 'Mythic', setId: 'hallowed_seraphim', setName: "Hallowed Seraphim", desc: "+50 DEF, +70 MDEF, +70 Max HP, +45 Max MP, +35 MATK [Set: Hallowed Seraphim]" },
        "seraph_diadem": { type: 'helmet', def: 50, mdef: 70, maxHp: 70, maxMp: 45, matk: 35, price: 6500, rarity: 'Mythic', setId: 'hallowed_seraphim', setName: "Hallowed Seraphim", desc: "+50 DEF, +70 MDEF, +70 Max HP, +45 Max MP, +35 MATK [Set: Hallowed Seraphim]" },
        "Seraph's Vestments": { type: 'armor', def: 70, mdef: 100, maxHp: 110, matk: 50, price: 7500, rarity: 'Mythic', setId: 'hallowed_seraphim', setName: "Hallowed Seraphim", desc: "+70 DEF, +100 MDEF, +110 Max HP, +50 MATK [Set: Hallowed Seraphim]" },
        "seraph_vestments": { type: 'armor', def: 70, mdef: 100, maxHp: 110, matk: 50, price: 7500, rarity: 'Mythic', setId: 'hallowed_seraphim', setName: "Hallowed Seraphim", desc: "+70 DEF, +100 MDEF, +110 Max HP, +50 MATK [Set: Hallowed Seraphim]" },
        "Seraph's Mitts": { type: 'gloves', def: 40, mdef: 55, maxMp: 40, matk: 35, spd: 15, price: 6000, rarity: 'Mythic', setId: 'hallowed_seraphim', setName: "Hallowed Seraphim", desc: "+40 DEF, +55 MDEF, +40 Max MP, +35 MATK, +15 SPD [Set: Hallowed Seraphim]" },
        "seraph_mitts": { type: 'gloves', def: 40, mdef: 55, maxMp: 40, matk: 35, spd: 15, price: 6000, rarity: 'Mythic', setId: 'hallowed_seraphim', setName: "Hallowed Seraphim", desc: "+40 DEF, +55 MDEF, +40 Max MP, +35 MATK, +15 SPD [Set: Hallowed Seraphim]" },
        "Seraph's Treads": { type: 'boots', def: 40, mdef: 50, spd: 32, maxHp: 60, price: 6000, rarity: 'Mythic', setId: 'hallowed_seraphim', setName: "Hallowed Seraphim", desc: "+40 DEF, +50 MDEF, +32 SPD, +60 Max HP [Set: Hallowed Seraphim]" },
        "seraph_treads": { type: 'boots', def: 40, mdef: 50, spd: 32, maxHp: 60, price: 6000, rarity: 'Mythic', setId: 'hallowed_seraphim', setName: "Hallowed Seraphim", desc: "+40 DEF, +50 MDEF, +32 SPD, +60 Max HP [Set: Hallowed Seraphim]" }
    };

    const SKILL_TREE_DB = {

        // ==================== BRANCH 1: DAMAGE ====================

        // Tier 1 (0 pts required)

        atkTraining: { id: 'atkTraining', name: 'ATK Training', branch: 'Damage', tier: 1, reqBranchPts: 0, type: 'stat', cost: 1, max: 10, desc: '+2 ATK per rank' },

        critTraining: { id: 'critTraining', name: 'Critical Training', branch: 'Damage', tier: 1, reqBranchPts: 0, type: 'stat', cost: 1, max: 10, desc: '+2% Crit Chance per rank' },

        powerStrike: { id: 'powerStrike', name: 'Power Strike', branch: 'Damage', tier: 1, reqBranchPts: 0, type: 'active', cost: 2, max: 1, desc: 'Heavy active physical strike', skillRef: 'Power Strike' },

        

        // Tier 2 (Requires 5 pts in Damage)

        armorBreak: { id: 'armorBreak', name: 'Armor Break', branch: 'Damage', tier: 2, reqBranchPts: 5, type: 'active', cost: 2, max: 1, desc: 'Temporarily reduces enemy DEF', skillRef: 'Armor Break' },

        combatMastery: { id: 'combatMastery', name: 'Combat Mastery', branch: 'Damage', tier: 2, reqBranchPts: 5, type: 'passive', cost: 3, max: 1, desc: '+10% basic attack damage' },

        precisionStrikes: { id: 'precisionStrikes', name: 'Precision Strikes', branch: 'Damage', tier: 2, reqBranchPts: 5, type: 'stat', cost: 1, max: 5, desc: '+5% Critical Strike Damage per rank' },

        

        // Tier 3 Keystones (Requires 10 pts in Damage)

        executioner: { id: 'executioner', name: 'Executioner', branch: 'Damage', tier: 3, reqBranchPts: 10, type: 'keystone', cost: 4, max: 1, desc: 'KEYSTONE: Deal +35% bonus damage to enemies below 30% HP.' },

        vampiricFervor: { id: 'vampiricFervor', name: 'Vampiric Fervor', branch: 'Damage', tier: 3, reqBranchPts: 10, type: 'keystone', cost: 4, max: 1, desc: 'KEYSTONE: Physical critical strikes restore 10% of damage dealt as HP.' },



        // ==================== BRANCH 2: SUSTAIN ====================

        // Tier 1 (0 pts required)

        vitalityTraining: { id: 'vitalityTraining', name: 'Vitality Training', branch: 'Sustain', tier: 1, reqBranchPts: 0, type: 'stat', cost: 1, max: 10, desc: '+10 Max HP per rank' },

        defTraining: { id: 'defTraining', name: 'Defense Training', branch: 'Sustain', tier: 1, reqBranchPts: 0, type: 'stat', cost: 1, max: 10, desc: '+2 DEF per rank' },

        recovery: { id: 'recovery', name: 'Recovery', branch: 'Sustain', tier: 1, reqBranchPts: 0, type: 'active', cost: 2, max: 1, desc: 'Potent active healing skill', skillRef: 'Recovery' },

        

        // Tier 2 (Requires 5 pts in Sustain)

        regeneration: { id: 'regeneration', name: 'Regeneration', branch: 'Sustain', tier: 2, reqBranchPts: 5, type: 'passive', cost: 3, max: 1, desc: 'Heal 3% Max HP at end of turn' },

        ironSkin: { id: 'ironSkin', name: 'Iron Skin', branch: 'Sustain', tier: 2, reqBranchPts: 5, type: 'stat', cost: 1, max: 5, desc: '+2 MDEF and +1% physical mitigation per rank' },

        barrierMastery: { id: 'barrierMastery', name: 'Barrier Mastery', branch: 'Sustain', tier: 2, reqBranchPts: 5, type: 'passive', cost: 2, max: 3, desc: 'All Divine Barriers absorb +10% more damage per rank' },

        

        // Tier 3 Keystones (Requires 10 pts in Sustain)

        overchargedAegis: { id: 'overchargedAegis', name: 'Overcharged Aegis', branch: 'Sustain', tier: 3, reqBranchPts: 10, type: 'keystone', cost: 4, max: 1, desc: 'KEYSTONE: Excess healing received when at full HP converts into a Divine Barrier (up to 20% Max HP).' },

        thornedBastion: { id: 'thornedBastion', name: 'Thorned Bastion', branch: 'Sustain', tier: 3, reqBranchPts: 10, type: 'keystone', cost: 4, max: 1, desc: 'KEYSTONE: 25% of all mitigated damage is reflected back to the attacker as true damage.' },



        // ==================== BRANCH 3: ARCANA ====================

        // Tier 1 (0 pts required)

        spiritTraining: { id: 'spiritTraining', name: 'Spirit Training', branch: 'Arcana', tier: 1, reqBranchPts: 0, type: 'stat', cost: 1, max: 10, desc: '+5 Max MP per rank' },

        arcaneTraining: { id: 'arcaneTraining', name: 'Arcane Training', branch: 'Arcana', tier: 1, reqBranchPts: 0, type: 'stat', cost: 1, max: 10, desc: '+2 MATK per rank' },

        

        // Tier 2 (Requires 5 pts in Arcana)

        manaEfficiency: { id: 'manaEfficiency', name: 'Mana Efficiency', branch: 'Arcana', tier: 2, reqBranchPts: 5, type: 'passive', cost: 3, max: 1, desc: '10% reduction to all MP costs' },

        elementalResonance: { id: 'elementalResonance', name: 'Elemental Resonance', branch: 'Arcana', tier: 2, reqBranchPts: 5, type: 'stat', cost: 1, max: 5, desc: '+5% bonus damage when exploiting elemental weaknesses' },

        afflictionPotency: { id: 'afflictionPotency', name: 'Affliction Potency', branch: 'Arcana', tier: 2, reqBranchPts: 5, type: 'stat', cost: 1, max: 5, desc: 'All Burn, Poison, and Decay DoTs deal +10% damage per rank' },

        

        // Tier 3 Keystones (Requires 10 pts in Arcana)

        arcaneSurge: { id: 'arcaneSurge', name: 'Arcane Surge', branch: 'Arcana', tier: 3, reqBranchPts: 10, type: 'keystone', cost: 4, max: 1, desc: 'KEYSTONE: Magical skills have a 25% chance to cost 0 MP and deal +30% spell damage.' },

        decayingCurse: { id: 'decayingCurse', name: 'Decaying Curse', branch: 'Arcana', tier: 3, reqBranchPts: 10, type: 'keystone', cost: 4, max: 1, desc: 'KEYSTONE: Applying any debuff to an enemy immediately afflicts them with Decay.' },



        // ==================== BRANCH 4: GENERAL ====================

        // Tier 1 (0 pts required)

        spdTraining: { id: 'spdTraining', name: 'Speed Training', branch: 'General', tier: 1, reqBranchPts: 0, type: 'stat', cost: 1, max: 10, desc: '+1 SPD per rank' },

        fortune: { id: 'fortune', name: 'Fortune', branch: 'General', tier: 1, reqBranchPts: 0, type: 'stat', cost: 1, max: 10, desc: '+3% Battle Gold per rank' },

        

        // Tier 2 (Requires 5 pts in General)

        treasureSense: { id: 'treasureSense', name: 'Treasure Sense', branch: 'General', tier: 2, reqBranchPts: 5, type: 'passive', cost: 3, max: 1, desc: 'Increases equipment and item drop chances' },

        quickReflexes: { id: 'quickReflexes', name: 'Quick Reflexes', branch: 'General', tier: 2, reqBranchPts: 5, type: 'stat', cost: 1, max: 5, desc: '+2% passive evasion dodge chance per rank' },

        

        // Tier 3 Keystones (Requires 10 pts in General)

        momentum: { id: 'momentum', name: 'Momentum', branch: 'General', tier: 3, reqBranchPts: 10, type: 'keystone', cost: 4, max: 1, desc: 'KEYSTONE: Dodging an attack or landing a critical strike grants Haste (+30% SPD) for 2 turns.' },

        midasTouch: { id: 'midasTouch', name: 'Midas Touch', branch: 'General', tier: 3, reqBranchPts: 10, type: 'keystone', cost: 4, max: 1, desc: 'KEYSTONE: Defeating an enemy with a basic attack or critical hit grants bonus Gold equal to 10% of their Max HP.' }

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

            statMods: {},

            skills: []

        },

        // Tier 1 (Level 10)

        warrior: {

            id: 'warrior',

            name: 'Warrior',

            tier: 1,

            parent: null,

            minLevel: 10,

            desc: "Master of raw physical combat and endurance.",

            statMods: { atk: 1.20, maxHp: 1.15, matk: 0.85, mdef: 0.90, spd: 0.95 },

            skills: ['Heavy Slam', 'Battle Cry']

        },

        mage: {

            id: 'mage',

            name: 'Mage',

            tier: 1,

            parent: null,

            minLevel: 10,

            desc: "Wielder of destructive elemental arcana.",

            statMods: { matk: 1.30, maxMp: 1.25, atk: 0.75, maxHp: 0.85, def: 0.90 },

            skills: ['Arcane Missiles', 'Frost Nova']

        },

        rogue: {

            id: 'rogue',

            name: 'Rogue',

            tier: 1,

            parent: null,

            minLevel: 10,

            desc: "Swift opportunist specializing in rapid critical strikes.",

            statMods: { spd: 1.25, crit: 15, atk: 1.15, maxHp: 0.85, def: 0.85, matk: 0.80 },

            skills: ['Quick Slash', 'Smoke Screen']

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

            skills: ['Bloodthirst Strike', 'Whirlwind of Blades'],

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

            skills: ['Holy Smite', 'Shield of Faith'],

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

            skills: ['Blizzard', 'Chain Lightning'],

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

            skills: ['Soul Siphon', 'Shadow Rupture'],

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

            skills: ['Shadow Step', 'Venom Spray'],

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

            skills: ['Mirage Flurry', 'Blade Dance'],

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

        },

        // Ranger & Marksman Tree (Tier 1 -> Tier 2 -> Tier 3)
        ranger: {
            id: 'ranger',
            name: 'Ranger',
            tier: 1,
            parent: null,
            minLevel: 10,
            desc: "Nimble marksman who harries foes from afar with precision archery and traps.",
            statMods: { atk: 1.25, spd: 1.20, crit: 15, maxHp: 0.90, def: 0.85, matk: 0.70 },
            skills: ['Aimed Shot', 'Marked Prey']
        },
        beastmaster: {
            id: 'beastmaster',
            name: 'Beastmaster',
            tier: 2,
            parent: 'ranger',
            minLevel: 25,
            desc: "Primal commander fighting in flawless synchronization with faithful companion beasts.",
            statMods: { atk: 1.35, spd: 1.30, crit: 20, maxHp: 1.10, def: 0.95 },
            skills: ['Pack Hunt', 'Beast Roar'],
            passive: 'pack_bond',
            passiveName: "Pack Bond",
            passiveDesc: "Whenever the Beastmaster attacks, their active Pet executes a synchronized strike for 75% ATK."
        },
        deadeye_sniper: {
            id: 'deadeye_sniper',
            name: 'Deadeye Sniper',
            tier: 2,
            parent: 'ranger',
            minLevel: 25,
            desc: "Cold, calculating sniper piercing heavy armor and breaking enemy stagger gauges.",
            statMods: { atk: 1.50, crit: 30, spd: 1.15, maxHp: 0.80, def: 0.75 },
            skills: ['Piercing Shot', 'Headshot Stagger'],
            passive: 'eagle_eye',
            passiveName: "Eagle Eye",
            passiveDesc: "Basic attacks ignore 50% of the target's physical DEF, and stagger damage dealt to bosses is doubled."
        },
        primal_apex_lord: {
            id: 'primal_apex_lord',
            name: 'Primal Apex Lord',
            tier: 3,
            parent: 'beastmaster',
            minLevel: 50,
            desc: "Sovereign of the wild whose ferocious presence empowers all allies with primal dominance.",
            statMods: { atk: 1.70, spd: 1.40, crit: 30, maxHp: 1.30, def: 1.10 },
            passive: 'primal_roar',
            passiveName: "Primal Roar",
            passiveDesc: "At the start of battle, unleashes an intimidating roar: grants all party members +25% ATK, +20 SPD, and immunity to Stun & Silence for 3 turns."
        },
                celestial_sharpshooter: {
            id: 'celestial_sharpshooter',
            name: 'Celestial Sharpshooter',
            tier: 3,
            parent: 'deadeye_sniper',
            minLevel: 50,
            desc: "Transcendent marksman whose piercing projectiles pierce across dimensions with lethal certainty.",
            statMods: { atk: 1.85, crit: 45, spd: 1.30, maxHp: 0.80, def: 0.80 },
            passive: 'killshot_matrix',
            passiveName: "Killshot Matrix",
            passiveDesc: "Basic attacks pierce through all enemies in battle. Guaranteed critical strike against any enemy at or below 35% HP."
        },
        // --- Cleric Class Tree (Tier 1 -> Tier 2 -> Tier 3) ---
        cleric: {
            id: 'cleric',
            name: 'Cleric',
            tier: 1,
            parent: null,
            minLevel: 10,
            desc: "Devoted holy conduit wielding divine restoration, cleansing rites, and radiant shielding.",
            statMods: { matk: 1.25, mdef: 1.25, maxMp: 1.25, maxHp: 1.05, def: 0.95, atk: 0.70, spd: 0.95 },
            skills: ['Holy Light', 'Purify']
        },
        high_priest: {
            id: 'high_priest',
            name: 'High Priest',
            tier: 2,
            parent: 'cleric',
            minLevel: 25,
            desc: "Sacred shepherd sustaining the entire party through devastating onslaughts and averting death.",
            statMods: { matk: 1.40, mdef: 1.40, maxMp: 1.45, maxHp: 1.20, def: 1.05, spd: 1.00, atk: 0.65 },
            skills: ['Prayer of Sanctuary', 'Divine Intervention'],
            passive: 'divine_aegis',
            passiveName: "Divine Aegis",
            passiveDesc: "Once per battle, when any party ally would take fatal damage, prevents death, restores them to 1 HP, and grants a Divine Barrier equal to 50% of their Max HP."
        },
        inquisitor: {
            id: 'inquisitor',
            name: 'Inquisitor',
            tier: 2,
            parent: 'cleric',
            minLevel: 25,
            desc: "Righteous inquisitor punishing the wicked with searing holy flames and lifesteal smites.",
            statMods: { matk: 1.45, atk: 1.20, crit: 20, mdef: 1.15, maxMp: 1.20, maxHp: 1.00, def: 0.90 },
            skills: ['Radiant Smite', 'Judgement Pyre'],
            passive: 'righteous_zeal',
            passiveName: "Righteous Zeal",
            passiveDesc: "Holy skills deal +30% amplified damage to debuffed targets, and basic attacks deal bonus Holy damage equal to 15% of the target's missing HP."
        },
        seraph_of_dawn: {
            id: 'seraph_of_dawn',
            name: 'Seraph of Dawn',
            tier: 3,
            parent: 'high_priest',
            minLevel: 50,
            desc: "Empyrean vessel of life whose holy aura continuously restores the squad and reflects violence.",
            statMods: { matk: 1.70, mdef: 1.70, maxMp: 1.70, maxHp: 1.40, def: 1.20, spd: 1.10 },
            passive: 'aura_of_immortality',
            passiveName: "Aura of Immortality",
            passiveDesc: "All living party members regenerate 10% Max HP at the start of each turn. Divine Barriers reflect 25% of absorbed damage back as Holy true damage."
        },
        grand_justiciar: {
            id: 'grand_justiciar',
            name: 'Grand Justiciar',
            tier: 3,
            parent: 'inquisitor',
            minLevel: 50,
            desc: "Living instrument of divine judgment executing instant retributive smites whenever allies are harmed.",
            statMods: { matk: 1.75, atk: 1.40, crit: 35, mdef: 1.30, maxMp: 1.35, maxHp: 1.15, spd: 1.20 },
            passive: 'sacred_retribution',
            passiveName: "Sacred Retribution",
            passiveDesc: "Whenever an enemy attacks any party member, the Grand Justiciar has a 40% chance to immediately counter-attack with an unblockable Holy Smite."
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



    function heroHasPassive(heroOrEntity, passiveId) {

        if (!heroOrEntity) return false;

        let hero = heroOrEntity.hero || heroOrEntity;

        if (hero.isMain || hero.id === 'hero_main' || hero.id === 'battle-player' || hero === (typeof player !== 'undefined' ? player : null) || (hero.currentClass && !hero.classId)) {

            return (typeof playerHasPassive === 'function') ? playerHasPassive(passiveId) : false;

        }

        const classId = hero.classId || hero.currentClass;

        if (!classId || typeof CLASSES_DB === 'undefined' || !CLASSES_DB[classId]) return false;

        const cls = CLASSES_DB[classId];

        if (cls.passive === passiveId) return true;

        if (cls.parent && CLASSES_DB[cls.parent] && CLASSES_DB[cls.parent].passive === passiveId) return true;

        return false;

    }

    if (typeof window !== 'undefined') {

        window.heroHasPassive = heroHasPassive;

    }



    function getClassSkills(classId) {

        let result = [];

        let cur = (typeof CLASSES_DB !== 'undefined') ? CLASSES_DB[classId] : null;

        while(cur) {

            if (cur.skills && Array.isArray(cur.skills)) {

                cur.skills.forEach(s => {

                    if (!result.includes(s)) result.push(s);

                });

            }

            cur = cur.parent ? CLASSES_DB[cur.parent] : null;

        }

        return result;

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



    // =========================================================================

    // ANCIENT RELICS & THE INFINITE SPIRE

    // =========================================================================



    const RELICS_DB = {

        blood_chalice: {

            id: 'blood_chalice',

            name: 'Blood Chalice',

            icon: '🩸',

            desc: 'Converts 10% of all physical and skill damage dealt into direct player health recovery.'

        },

        thunderstone_core: {

            id: 'thunderstone_core',

            name: 'Thunderstone Core',

            icon: '⚡',

            desc: 'Basic attacks have a 35% chance to discharge chain lightning, dealing 50% bonus wind damage to all active foes.'

        },

        aegis_colossus: {

            id: 'aegis_colossus',

            name: 'Aegis of the Colossus',

            icon: '🛡️',

            desc: 'Grants a Divine Barrier absorbing 25% of Player Max HP at the start of every combat encounter.'

        },

        hourglass_chronomancer: {

            id: 'hourglass_chronomancer',

            name: "Chronomancer's Hourglass",

            icon: '⌛',

            desc: 'Once per combat encounter, taking fatal damage rewinds time, preventing death and restoring 30% Max HP.'

        },

        midas_crucible: {

            id: 'midas_crucible',

            name: 'Midas Crucible',

            icon: '💎',

            desc: 'Permanently increases all Gold and Crafting Scrap drops by +50%.'

        },

        celestial_feather: {

            id: 'celestial_feather',

            name: 'Celestial Feather',

            icon: '🪶',

            desc: 'Grants permanent +15 Speed and +10% Critical Chance.'

        }

    };



    const ALTAR_SHOP_DB = {

        tome_vitality: {

            id: 'tome_vitality',

            name: 'Tome of Vitality',

            icon: '📕',

            cost: 50,

            maxUses: 5,

            type: 'tome',

            stat: 'hp',

            value: 20,

            desc: 'Permanently increases base Max HP by +20 (Max 5 uses).'

        },

        tome_power: {

            id: 'tome_power',

            name: 'Tome of Power',

            icon: '📙',

            cost: 60,

            maxUses: 5,

            type: 'tome',

            stat: 'atk',

            value: 3,

            desc: 'Permanently increases base ATK and MATK by +3 (Max 5 uses).'

        },

        tome_mind: {

            id: 'tome_mind',

            name: 'Tome of the Mind',

            icon: '📘',

            cost: 40,

            maxUses: 5,

            type: 'tome',

            stat: 'mp',

            value: 10,

            desc: 'Permanently increases base Max MP by +10 (Max 5 uses).'

        },

        mythic_reforge_rune: {

            id: 'mythic_reforge_rune',

            name: 'Mythic Reforge Rune',

            icon: '🔮',

            cost: 100,

            type: 'item',

            itemName: 'Mythic Reforge Rune',

            desc: 'Consumable item granting guaranteed max-tier rolls at the Blacksmith.'

        },

        title_spire_ascendant: {

            id: 'title_spire_ascendant',

            name: 'Spire Ascendant Title',

            icon: '👑',

            cost: 150,

            type: 'title',

            title: 'Spire Ascendant',

            desc: 'Unlocks the prestigious cosmetic title [Spire Ascendant].'

        }

    };



    /* =========================================================================

       TOWN SHOP & MERCHANT OVERHAUL DATABASES

       ========================================================================= */



    const SHOP_EQUIPMENT_TIERS = {

        area_1: {

            name: 'Whispering Woods (Tier 1)',

            items: ['Wooden Sword', 'Cloth Armor', 'Leather Cap', 'Leather Gloves', 'Leather Boots']

        },

        area_2: {

            name: 'Crystal Caverns (Tier 2)',

            items: ['Bronze Sword', 'Leather Armor', 'Iron Helm', 'Iron Gauntlets', 'Iron Greaves']

        },

        area_3: {

            name: 'Stormpeak Summit (Tier 3)',

            items: ['Iron Sword', 'Magic Staff', 'Mystic Circlet', 'Iron Armor', 'Silk Bracers', 'Speed Boots', 'Ring of Vigor', 'Amulet of Mana']

        },

        area_4: {

            name: 'Infernal Caldera (Tier 4)',

            items: ['Obsidian Blade', 'Dragon Scale Mail', 'Flameforged Crown', 'Lava Gauntlets', 'Cinder Striders', 'Fireheart Talisman']

        },

        area_5: {

            name: 'Abyssal Void (Tier 5)',

            items: ['Voidcleaver', 'Celestial Plate', 'Astral Hood', 'Voidtouch Grips', 'Phase Treads', 'Eye of the Cosmos']

        },

        area_6: {

            name: 'Luminous Sanctuary (Tier 6)',

            items: ['Dawn Greatsword', 'Luminous Plate', 'Crown of the Sun', 'Radiant Vambraces', 'Solar Greaves', 'Seraphic Heart']

        },

        area_7: {

            name: 'Thunderous Steppes (Tier 7)',

            items: ['Thunderclap Edge', 'Tempest Mail', 'Stormcaller Helm', 'Volt Grips', 'Zephyr Boots', 'Thunderstone Relic']

        },

        area_8: {

            name: 'Glacial Frostpeaks (Tier 8)',

            items: ['Glacial Claymore', 'Frostcrown Circlet', 'Icebound Hauberk', 'Permafrost Grips', 'Glacier Striders', 'Heart of Winter']

        },

        area_9: {

            name: 'Molten Abyss (Tier 9)',

            items: ['Hellfire Reaver', 'Pyroclast Visor', 'Molten Carapace', 'Cinder Fists', 'Lava Treads', 'Infernal Core']

        },

        area_10: {

            name: 'The Celestial Void Rift (Tier 10)',

            items: ['Infinity Edge of Chronos', 'Crown of the Singularity', 'Aegis of the Void God', 'Dimension Gauntlets', 'Cosmic Striders', 'Eye of Eternity']

        }

    };



    const SHOP_MATERIALS_DB = [

        { id: 'scrap_5', name: 'Iron Scraps x5', matKey: 'scrap', count: 5, price: 60, icon: '🔨', desc: 'Basic scrap metal used for +1 and +2 Blacksmith upgrades.' },

        { id: 'scrap_20', name: 'Iron Scraps x20', matKey: 'scrap', count: 20, price: 220, icon: '🔨', desc: 'Bulk crate of iron scrap.' },

        { id: 'dust_1', name: 'Arcane Dust x1', matKey: 'dust', count: 1, price: 100, icon: '✨', desc: 'Arcane reagent used for +3 upgrades and Affix Reforging.' },

        { id: 'dust_5', name: 'Arcane Dust x5', matKey: 'dust', count: 5, price: 450, icon: '✨', desc: 'Concentrated pouch of arcane dust.' },

        { id: 'shard_1', name: 'Void Shard x1', matKey: 'shard', count: 1, price: 400, icon: '🔮', desc: 'Endgame catalyst for +4 and +5 upgrades.', reqArea: 'area_4' },

        { id: 'shard_3', name: 'Void Shard x3', matKey: 'shard', count: 3, price: 1100, icon: '🔮', desc: 'Three condensed void crystals.', reqArea: 'area_4' }

    ];



    const MYSTERY_BOXES_DB = {

        adventurer: {

            id: 'adventurer',

            name: "Adventurer's Mystery Box",

            cost: 250,

            icon: '📦',

            color: '#38bdf8',

            desc: 'A sealed adventurers coffer. Contains a random equipment piece of guaranteed Rare (70%), Epic (25%), or Legendary (5%) quality.',

            weights: [

                { rarity: 'Rare', weight: 70 },

                { rarity: 'Epic', weight: 25 },

                { rarity: 'Legendary', weight: 5 }

            ]

        },

        celestial: {

            id: 'celestial',

            name: "Celestial Mystery Box",

            cost: 1000,

            icon: '👑',

            color: '#f59e0b',

            desc: 'A high-roller coffer radiant with cosmic energy. Guaranteed Epic (70%), Legendary (25%), or Mythic (5%) quality!',

            weights: [

                { rarity: 'Epic', weight: 70 },

                { rarity: 'Legendary', weight: 25 },

                { rarity: 'Mythic', weight: 5 }

            ]

        }

    };



    /* =========================================================================

       COMPANION PETS & FAMILIARS DATABASE

       ========================================================================= */



    const PETS_DB = {

        // COMMON (Tier 1 - Starter & Early Drops)

        sprout_slimelet: {

            id: 'sprout_slimelet',

            name: 'Sprout Slimelet',

            element: 'Earth',

            rarity: 'Common',

            desc: 'A cheerful animated moss bud that shields its companion.',

            passive: { defPct: 4, maxHpPct: 4 },

            action: { name: 'Pebble Guard', type: 'shield', valPct: 8 },

            apexPerk: 'Petrified Shell: Increases all shield absorption amounts by +15%.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><circle cx="25" cy="30" r="16" fill="#4ade80"/><circle cx="20" cy="26" r="3" fill="#111"/><circle cx="30" cy="26" r="3" fill="#111"/><path d="M25,14 Q28,8 33,10 Q28,15 25,14" fill="#16a34a"/></svg>`,

            obtainHint: "Starter Companion (Unlocked automatically at start of journey)."

        },

        cinder_pup: {

            id: 'cinder_pup',

            name: 'Cinder Pup',

            element: 'Fire',

            rarity: 'Common',

            desc: 'A fiery hound cub whose playful nips singe enemy armor.',

            passive: { atkPct: 5 },

            action: { name: 'Ember Bite', type: 'damage_dot', power: 25, dot: 'burn', dotChance: 0.6 },

            apexPerk: 'Wildfire Sparks: Ember Bite applies 2 stacks of Burn instead of 1.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><polygon points="12,18 25,38 38,18" fill="#fb923c"/><polygon points="8,10 16,18 10,22" fill="#ea580c"/><polygon points="42,10 34,18 40,22" fill="#ea580c"/><circle cx="20" cy="22" r="2.5" fill="#fff"/><circle cx="30" cy="22" r="2.5" fill="#fff"/></svg>`,

            obtainHint: "Whispering Woods & Sunken Caverns (5% drop from zone battle victories)."

        },

        // UNCOMMON (Tier 2 - Mid Early)

        breeze_finch: {

            id: 'breeze_finch',

            name: 'Breeze Finch',

            element: 'Wind',

            rarity: 'Uncommon',

            desc: 'A swift avian familiar that accelerates turn frequency.',

            passive: { spd: 8, crit: 3 },

            action: { name: 'Tailwind Gust', type: 'buff', buff: 'haste', turns: 2 },

            apexPerk: 'Gale Velocity: While Haste is active, gain an additional +10% Crit Chance.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><circle cx="25" cy="25" r="14" fill="#38bdf8"/><polygon points="35,25 45,23 35,29" fill="#facc15"/><circle cx="28" cy="21" r="2.5" fill="#111"/></svg>`,

            obtainHint: "Howling Peaks (10% drop from zone battle victories)."

        },

        shadow_wisp: {

            id: 'shadow_wisp',

            name: 'Shadow Wisp',

            element: 'Dark',

            rarity: 'Uncommon',

            desc: 'A playful dark entity that confuses foes and leeches vitality.',

            passive: { crit: 6, matkPct: 5 },

            action: { name: 'Abyssal Gaze', type: 'debuff_leech', power: 25, debuff: 'blind', chance: 0.7, leechPct: 0.3 },

            apexPerk: 'Soul Siphon: Triples HP leeched by Abyssal Gaze.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><circle cx="25" cy="25" r="15" fill="#7e22ce"/><circle cx="20" cy="22" r="3" fill="#f43f5e"/><circle cx="30" cy="22" r="3" fill="#f43f5e"/></svg>`,

            obtainHint: "Sunken Caverns & Catacombs (8% drop from shade victories)."

        },

        // RARE (Tier 3 - Advanced)

        glacia_fox: {

            id: 'glacia_fox',

            name: 'Glacia Fox',

            element: 'Water',

            rarity: 'Rare',

            desc: 'A noble arctic fox that soothes wounds and chills enemy strikes.',

            passive: { maxHpPct: 8, maxMpPct: 10 },

            action: { name: 'Glacial Soothe', type: 'heal_cc', healHpPct: 10, healMp: 15, cc: 'freeze', ccChance: 0.5 },

            apexPerk: 'Permafrost Aura: Enemies frozen by Glacia Fox take +30% shatter damage.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><polygon points="15,15 25,35 35,15" fill="#93c5fd"/><polygon points="10,8 18,16 12,20" fill="#3b82f6"/><polygon points="40,8 32,16 38,20" fill="#3b82f6"/><circle cx="21" cy="20" r="2.5" fill="#1e3a8a"/><circle cx="29" cy="20" r="2.5" fill="#1e3a8a"/></svg>`,

            obtainHint: "Sunken Caverns Gatekeeper Boss (Guaranteed on 1st victory, 15% drop thereafter)."

        },

        thunder_gryphon: {

            id: 'thunder_gryphon',

            name: 'Storm Gryphon',

            element: 'Wind',

            rarity: 'Rare',

            desc: 'A crackling apex beast unleashing chain lightning detonations.',

            passive: { spd: 12, atkPct: 8 },

            action: { name: 'Chain Surge', type: 'lightning_splash', power: 45, splashPct: 0.5, shockChance: 0.8 },

            apexPerk: 'Conduit Overcharge: Basic attacks trigger an immediate lightning splash 100% of the time.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><polygon points="25,10 12,35 38,35" fill="#facc15"/><circle cx="25" cy="22" r="10" fill="#ca8a04"/><circle cx="22" cy="20" r="2" fill="#000"/><circle cx="28" cy="20" r="2" fill="#000"/></svg>`,

            obtainHint: "Howling Peaks (10% drop from zone battle victories)."

        },

        // EPIC (Tier 4 - Endgame)

        void_stalker: {

            id: 'void_stalker',

            name: 'Void Stalker',

            element: 'Dark',

            rarity: 'Epic',

            desc: 'A cosmic entity that executes weakened enemies.',

            passive: { atkPct: 12, crit: 10 },

            action: { name: 'Void Strike', type: 'execute_damage', power: 70, executeThreshold: 0.20 },

            apexPerk: 'Reaper Instinct: Instantly resets player skill cooldowns whenever Void Strike executes a target.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><circle cx="25" cy="25" r="17" fill="#1e1b4b" stroke="#a855f7" stroke-width="2"/><circle cx="19" cy="22" r="3" fill="#c084fc"/><circle cx="31" cy="22" r="3" fill="#c084fc"/></svg>`,

            obtainHint: "Abyssal Void Gatekeeper Boss (1% Mythic drop) or Spire Floor 50."

        },

        // LEGENDARY (Tier 5 - God Tier)

        ignis_phoenix: {

            id: 'ignis_phoenix',

            name: 'Ignis the Phoenix',

            element: 'Fire',

            rarity: 'Legendary',

            desc: 'The mythical bird of eternal flame. Reborn from ashes.',

            passive: { atkPct: 15, matkPct: 15, maxHpPct: 10 },

            action: { name: 'Inferno Nova', type: 'aoe_fire', power: 60, burnAll: true },

            apexPerk: 'Rebirth Flame: Once per combat encounter, if the hero takes a fatal blow, revive immediately with 30% Max HP!',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><polygon points="25,5 15,25 25,45 35,25" fill="#ef4444"/><circle cx="25" cy="20" r="8" fill="#f59e0b"/><polygon points="25,5 30,15 20,15" fill="#ffd700"/></svg>`,

            obtainHint: "Infernal Caldera Gatekeeper Boss (3% Legendary drop) or Spire Floor 35."

        }

    };



    // Extended / Codex Companions

    const ADDITIONAL_PETS = {

        aqua_drake: {

            id: 'aqua_drake',

            name: 'Aqua Drake',

            element: 'Water',

            rarity: 'Rare',

            desc: 'A majestic aquatic drake with tidal breath that restores energy and freezes foes.',

            passive: { maxHpPct: 8, maxMpPct: 10 },

            action: { name: 'Tidal Surge', type: 'heal_cc', healHpPct: 10, healMp: 15, cc: 'freeze', ccChance: 0.5 },

            apexPerk: 'Tidal Resonance: Restores +20% more MP and increases freeze duration by 1 turn.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><polygon points="10,25 25,10 40,25 25,40" fill="#38bdf8"/><polygon points="25,12 35,25 25,38 15,25" fill="#0284c7"/><circle cx="21" cy="22" r="2.5" fill="#e0f2fe"/><circle cx="29" cy="22" r="2.5" fill="#e0f2fe"/><path d="M18,30 Q25,36 32,30" stroke="#0369a1" stroke-width="2" fill="none"/></svg>`,

            obtainHint: "Sunken Caverns Gatekeeper Boss (Guaranteed on 1st victory, 15% drop thereafter)."

        },

        storm_gryphon: {

            id: 'storm_gryphon',

            name: 'Storm Gryphon',

            element: 'Wind',

            rarity: 'Rare',

            desc: 'A crackling apex beast unleashing chain lightning detonations.',

            passive: { spd: 12, atkPct: 8 },

            action: { name: 'Chain Surge', type: 'lightning_splash', power: 45, splashPct: 0.5, shockChance: 0.8 },

            apexPerk: 'Conduit Overcharge: Basic attacks trigger an immediate lightning splash 100% of the time.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><polygon points="25,10 12,35 38,35" fill="#facc15"/><circle cx="25" cy="22" r="10" fill="#ca8a04"/><circle cx="22" cy="20" r="2" fill="#000"/><circle cx="28" cy="20" r="2" fill="#000"/></svg>`,

            obtainHint: "Howling Peaks (10% drop from zone battle victories)."

        },

        obsidian_tortoise: {

            id: 'obsidian_tortoise',

            name: 'Obsidian Tortoise',

            element: 'Earth',

            rarity: 'Epic',

            desc: 'An ancient volcanic reptile encased in impenetrable volcanic armor.',

            passive: { defPct: 12, maxHpPct: 12 },

            action: { name: 'Magma Bastion', type: 'shield', valPct: 15, reflectPct: 0.25 },

            apexPerk: 'Volcanic Carapace: Reflects 50% of melee damage absorbed by shields back at attacker.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><ellipse cx="25" cy="27" rx="18" ry="14" fill="#1e293b" stroke="#f97316" stroke-width="2"/><ellipse cx="25" cy="27" rx="12" ry="9" fill="#0f172a"/><circle cx="25" cy="12" r="6" fill="#334155"/><circle cx="23" cy="11" r="1.5" fill="#ea580c"/><circle cx="27" cy="11" r="1.5" fill="#ea580c"/></svg>`,

            obtainHint: "Infernal Caldera (8% drop from magma monsters or 20% from Gatekeeper Boss)."

        },

        astral_sprite: {

            id: 'astral_sprite',

            name: 'Astral Sprite',

            element: 'Light',

            rarity: 'Epic',

            desc: 'A celestial entity summoned from the zenith of the Infinite Spire.',

            passive: { matkPct: 12, crit: 8 },

            action: { name: 'Astral Radiance', type: 'buff', buff: 'divine_shield', turns: 2, healHpPct: 15 },

            apexPerk: 'Cosmic Harmony: Increases all elemental damage dealt by the hero by +20%.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><polygon points="25,5 31,18 45,19 34,29 37,43 25,35 13,43 16,29 5,19 19,18" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/><circle cx="25" cy="24" r="7" fill="#ffffff"/><circle cx="23" cy="23" r="2" fill="#854d0e"/><circle cx="27" cy="23" r="2" fill="#854d0e"/></svg>`,

            obtainHint: "The Infinite Spire (Guaranteed milestone reward for clearing Floor 20)."

        },

        void_leviathan: {

            id: 'void_leviathan',

            name: 'Void Leviathan',

            element: 'Dark',

            rarity: 'Mythic',

            desc: 'A terrifying cosmic titan that tears the fabric of reality itself.',

            passive: { atkPct: 18, matkPct: 18, crit: 12 },

            action: { name: 'Reality Tear', type: 'execute_damage', power: 90, executeThreshold: 0.30 },

            apexPerk: 'Abyssal Singularity: Defeating an enemy restores 25% Max MP and triggers an immediate free turn.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><ellipse cx="25" cy="25" rx="19" ry="12" fill="#090514" stroke="#d946ef" stroke-width="2.5"/><circle cx="18" cy="22" r="3" fill="#fae8ff"/><circle cx="32" cy="22" r="3" fill="#fae8ff"/><circle cx="18" cy="22" r="1.5" fill="#a21caf"/><circle cx="32" cy="22" r="1.5" fill="#a21caf"/><path d="M17,29 Q25,35 33,29" stroke="#c026d3" stroke-width="2" fill="none"/></svg>`,

            obtainHint: "Abyssal Void Gatekeeper Boss (1% Mythic drop) or Spire Floor 50."

        },

        lumina_sprite: {

            id: 'lumina_sprite',

            name: 'Lumina Sprite',

            element: 'Light',

            rarity: 'Rare',

            desc: 'A radiant wisp born of celestial light, restoring vitality and shielding allies.',

            obtainHint: 'Luminous Sanctuary (8% drop from zone battles or 25% from Archon of Radiance).',

            passive: { matkPct: 8, maxMpPct: 8 },

            action: { name: 'Solar Blessing', type: 'heal_cleanse', valPct: 10 },

            apexPerk: 'Radiant Aura: Increases all healing received by +20% and grants 1 stack of Mirage on combat start.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><circle cx="25" cy="25" r="16" fill="#fef08a" filter="drop-shadow(0 0 4px #eab308)"/><circle cx="20" cy="22" r="2.5" fill="#854d0e"/><circle cx="30" cy="22" r="2.5" fill="#854d0e"/><path d="M22,28 Q25,31 28,28" stroke="#854d0e" stroke-width="2" fill="none"/></svg>`

        },

        spark_hound: {

            id: 'spark_hound',

            name: 'Spark Hound',

            element: 'Wind',

            rarity: 'Epic',

            desc: 'An agile canine wreathed in crackling storm lightning, accelerating its master.',

            obtainHint: 'Thunderous Steppes (6% drop from zone battles or 20% from Fulgur Apex).',

            passive: { spd: 14, crit: 5 },

            action: { name: 'Overcharge Bite', type: 'damage_dot', power: 45, dot: 'shock', dotChance: 0.8 },

            apexPerk: 'Lightning Reflexes: 15% chance when attacked to completely evade and retaliate for 50% damage.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><polygon points="12,38 22,18 32,22 42,16 46,38" fill="#38bdf8"/><circle cx="36" cy="24" r="2.5" fill="#fff"/><polygon points="20,24 24,30 20,32 26,38" fill="#facc15"/></svg>`

        },

        glacia_kitsune: {

            id: 'glacia_kitsune',

            name: 'Glacia Kitsune',

            element: 'Water',

            rarity: 'Epic',

            desc: 'A mystical nine-tailed frost fox that weaves impenetrable barriers and freezes attackers.',

            obtainHint: 'Glacial Frostpeaks (6% drop from zone battles or 20% from Frost Empress Glacia).',

            passive: { defPct: 10, maxHpPct: 10 },

            action: { name: 'Permafrost Shield', type: 'shield_freeze', valPct: 12, freezeChance: 0.5 },

            apexPerk: 'Absolute Zero: Shields absorb 25% more damage and frozen enemies take 30% bonus damage from all sources.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><polygon points="15,35 25,15 35,35" fill="#bae6fd" stroke="#0284c7" stroke-width="1.5"/><polygon points="17,18 20,8 24,16" fill="#0284c7"/><polygon points="26,16 30,8 33,18" fill="#0284c7"/><circle cx="22" cy="22" r="1.5" fill="#082f49"/><circle cx="28" cy="22" r="1.5" fill="#082f49"/><path d="M10,32 Q5,22 12,18" stroke="#38bdf8" stroke-width="1.5" fill="none"/><path d="M40,32 Q45,22 38,18" stroke="#38bdf8" stroke-width="1.5" fill="none"/></svg>`

        },

        cinder_gargoyle: {

            id: 'cinder_gargoyle',

            name: 'Cinder Gargoyle',

            element: 'Fire',

            rarity: 'Epic',

            desc: 'A ferocious stone fiend infused with volcanic magma that unleashes scorching flames.',

            obtainHint: 'Molten Abyss (5% drop from zone battles or 20% from Ignis Primordial).',

            passive: { atkPct: 12, crit: 6 },

            action: { name: 'Magma Cleave', type: 'damage_dot', power: 55, dot: 'burn', dotChance: 0.85 },

            apexPerk: 'Molten Retaliation: Gain +15% ATK when below 50% HP, and all burns inflicted deal double tick damage.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><polygon points="15,38 25,12 35,38" fill="#450a0a" stroke="#ea580c" stroke-width="1.5"/><polygon points="16,16 19,8 22,14" fill="#ea580c"/><polygon points="28,14 31,8 34,16" fill="#ea580c"/><circle cx="21" cy="21" r="1.5" fill="#fef08a"/><circle cx="29" cy="21" r="1.5" fill="#fef08a"/><path d="M12,25 Q6,17 10,11 Q16,17 14,27" fill="#991b1b"/><path d="M38,25 Q44,17 40,11 Q34,17 36,27" fill="#991b1b"/></svg>`

        },

        chronos_sprite: {

            id: 'chronos_sprite',

            name: 'Chronos Sprite',

            element: 'Dark',

            rarity: 'Mythic',

            desc: 'An ethereal cosmic temporal anomaly that bends the flow of battle time.',

            obtainHint: 'Celestial Void Rift (3% drop from rift battles or 15% from Chronos, The Void Sovereign).',

            passive: { atkPct: 15, matkPct: 15, spd: 18, crit: 8 },

            action: { name: 'Temporal Warp', type: 'buff_time', turns: 2, spdBuff: 20, healMpPct: 20 },

            apexPerk: 'Temporal Mastery: 20% chance at the end of every hero turn to immediately take another free turn.',

            sprite: `<svg viewBox="0 0 50 50" width="100%" height="100%"><ellipse cx="25" cy="25" rx="15" ry="15" fill="#2e1065" stroke="#c084fc" stroke-width="1.5"/><ellipse cx="25" cy="25" rx="19" ry="7" fill="none" stroke="#fbbf24" stroke-width="1.2" transform="rotate(-25 25 25)"/><circle cx="22" cy="23" r="1.8" fill="#f5d0fe"/><circle cx="28" cy="23" r="1.8" fill="#f5d0fe"/></svg>`

        }

    };



    for (let k in ADDITIONAL_PETS) {

        Object.defineProperty(PETS_DB, k, {

            value: ADDITIONAL_PETS[k],

            enumerable: false,

            writable: true,

            configurable: true

        });

    }



    const CODEX_PET_KEYS = [

        'sprout_slimelet',

        'cinder_pup',

        'aqua_drake',

        'storm_gryphon',

        'obsidian_tortoise',

        'astral_sprite',

        'ignis_phoenix',

        'void_leviathan',

        'lumina_sprite',

        'spark_hound',

        'glacia_kitsune',

        'cinder_gargoyle',

        'chronos_sprite'

    ];

    window.CODEX_PET_KEYS = CODEX_PET_KEYS;

    window.PETS_DB = PETS_DB;



    /* =========================================================================

       CHAPTER 5: BESTIARY & MONSTER LORE COMPENDIUM DATABASE

       ========================================================================= */

    const BESTIARY_LORE_DB = {

        // Area 1: Whispering Woods

        'Ember Slime': 'A volatile gelatinous glob infused with dormant embers, bouncing aggressively when disturbed.',

        'Gale Wolf': 'Swift woodland predators that harness forest breezes to ambush unsuspecting travelers.',

        'Stone Golem': 'Ancient granite guardians animated by subterranean earth ley-lines.',

        'Venom Spider': 'Arachnids dwelling in mossy hollows, injecting debilitating neurotoxins.',

        'Ancient Treant': 'A thousand-year-old arboreal colossus guarding the sacred heart of the Whispering Woods.',

        'Elder Treant': 'A thousand-year-old arboreal colossus guarding the sacred heart of the Whispering Woods.',



        // Area 2: Sunken Caverns

        'Tide Slime': 'Semi-transparent amoebas filled with pressurized brine that dissolve armor plates.',

        'Coral Crab': 'Armored crustaceans bearing razor-sharp crystalline coral claws.',

        'Deep Horror': 'Tentacled aberrations that lurk within sunless subterranean sea trenches.',

        'Abyssal Siren': 'Deceptive aquatic spirits that entrance prey with siren songs before striking.',

        'Tidal Leviathan': 'An ancient oceanic behemoth whose awakening causes cavernous tidal surges.',

        'Cave Bat': 'Subterranean winged pests that echolocate in absolute darkness and swarm unwary explorers.',

        'Frost Knight': 'The animated glacial plate armor of a fallen paladin, chilled by freezing ocean depth currents.',

        'Abyssal Lurker': 'A predatory amphibian lurking beneath murky underground waterways waiting to ambush prey.',

        'Leviathan Drake': 'A colossal aquatic sea serpent ruling the sunken flooded caverns with devastating tidal surges.',



        // Area 3: Howling Peaks

        'Gale Falcon': 'Apex raptors that dive from blizzard clouds at blinding supersonic speeds.',

        'Thunder Lynx': 'Felines crackling with static electricity that stalk storm-swept ridges.',

        'Peak Wyrm': 'Draconic serpents coiling around freezing mountaintops, exhaling gale-force blasts.',

        'Storm Elemental': 'Living vortices of lightning and howling atmospheric turbulence.',

        'Tempest Roc': 'A mythical storm titan whose massive wings summon perpetual gale storms.',

        'Thunder Harpy': 'Feathered fiends that ride updrafts on jagged cliffs, hurling crackling lightning bolts.',

        'Storm Wisp': 'Erratic motes of supercharged electrical plasma drifting along howling mountain ridges.',

        'Gale Stalker': 'Predators cloaked in howling mountain winds that strike without warning.',

        'Mountain Golem': 'Hulking monoliths formed of jagged peak slate and hardened glacier ice.',

        'Tempest Wyvern': 'A tempestuous dragon lord roosting atop the highest precipice, commanding thunderbolts.',



        // Area 4: Infernal Caldera

        'Magma Hound': 'Canines sculpted from porous igneous rock, breathing searing sulfuric smoke.',

        'Ash Golem': 'Crude animated hulks forged from compressed volcanic ash and obsidian.',

        'Flame Wyrm': 'Subterranean fire serpents swimming freely through rivers of liquid magma.',

        'Fire Imp': 'Mischievous lesser demons delighting in arson and fiery chaos.',

        'Magma Colossus': 'A primordial volcanic titan towering over the heart of the volcanic caldera.',

        'Magma Slime': 'Blistering blobs of molten rock that incinerate weapons and boil nearby water sources.',

        'Flame Hound': 'Ferocious fiery canines that hunt in packs across scalding sulfur plains.',

        'Infernal Knight': 'Demonic sentinels clad in blackened brimstone plate, wielding scorching hellfire blades.',

        'Fire Drake': 'Winged drakes that dive through smoke plumes to engulf targets in torrents of liquid flame.',

        'Infernal Dragon': 'The supreme primordial terror slumbering within the caldera, whose breath melts bedrock.',



        // Area 5: Abyssal Void

        'Void Crawler': 'Multi-legged chitinous parasites skittering through interdimensional cracks.',

        'Shadow Fiend': 'Incorporeal specters that feed upon fear and siphon lifeforce into the void.',

        'Void Stalker': 'Ruthless ethereal predators capable of phasing through solid reality to execute prey.',

        'Dark Behemoth': 'Monolithic horrors composed of condensed void matter and dark cosmic energy.',

        'Void Guardian': 'The ancient sentry bound to seal the abyssal tear between realities.',

        'Shadow Bat': 'Nocturnal horrors composed of pure darkness that feast upon raw magical energy.',

        'Abyssal Wraith': 'Tormented spirits floating through null-space that freeze the soul of anyone they touch.',

        'Void Horror': 'Shapeless eldritch abominations that warp the fabric of reality around them.',

        'Nether Knight': 'Corrupted dark warriors wielding blades infused with cosmic entropy.',



        // Area 6: Luminous Sanctuary

        'Radiant Wisp': 'Orbs of concentrated solar energy that emit blinding celestial warmth.',

        'Sunforged Golem': 'Impenetrable brass automatons powered by eternal radiant cores.',

        'Dawn Seraph': 'Holy celestial messengers wielding cleansing light that scorches darkness.',

        'Solar Griffin': 'Majestic winged predators roosting on sunlit temple spires.',

        'Archon of Radiance': 'The supreme celestial entity safeguarding the sacred Luminous Sanctuary.',



        // Area 7: Thunderous Steppes

        'Volt Stalker': 'Electrified beasts that leave trails of scorched earth as they dash.',

        'Thunder Ram': 'Stout horned ungulates whose headbutts release thunderous shockwaves.',

        'Lightning Drake': 'Sleek drakes capable of discharging focused arcs of high-voltage lightning.',

        'Fulgur Apex': 'The apex predator of the steppes, wreathed in roaring thunderstorm tempests.',



        // Area 8: Glacial Frostpeaks

        'Frostfang Wolf': 'Pack hunters roaming sub-zero glacial peaks, their fangs hardened into razor permafrost.',

        'Glacial Golem': 'Massive constructs formed from unbreakable blue glacial ice.',

        'Blizzard Harpy': 'Avian hunters that channel freezing gales to blind and freeze their targets.',

        'Icebound Revenant': 'Undead spirits trapped within glacial rifts, radiating freezing despair.',

        'Frost Empress Glacia': 'The sovereign of the eternal frost, commanding absolute zero temperatures.',



        // Area 9: Molten Abyss

        'Magma Scuttler': 'Armored burrowers that carve tunnels through superheated subterranean rock.',

        'Cinder Drake': 'Heavily scaled drakes that hoard fiery coals within deep lava caverns.',

        'Lava Reaver': 'Berserker humanoids brandishing blades forged directly from molten magma.',

        'Pyroclast Behemoth': 'A four-legged obsidian titan that erupts with volcanic debris when struck.',

        'Ignis Primordial': 'The living incarnation of the earth\'s molten core, consuming all in flame.',



        // Area 10: The Celestial Void Rift

        'Chrono Phantom': 'Time-displaced apparitions that flicker in and out of the timeline.',

        'Starfall Entity': 'Cosmic beings composed of crushed starlight and stellar dust.',

        'Dimensional Horror': 'A grotesque aberration with shifting eyes and limbs from fractured dimensions.',

        'Singularity Titan': 'A gravitational dreadnought that pulls reality itself into its core.',

        'Chronos, The Void Sovereign': 'The timeless master of cosmic entropy, reigning over the edge of reality.'

    };

    window.BESTIARY_LORE_DB = BESTIARY_LORE_DB;



    /* =========================================================================

       GUILD QUARTERMASTER DATABASE (TAVERN_EXCHANGE_DB)

       ========================================================================= */

    const TAVERN_EXCHANGE_DB = [

        {

            id: 'pet_treat_gourmet',

            name: 'Gourmet Pet Treat',

            cost: 3,

            type: 'consumable',

            desc: 'A savory delicacy loved by familiars. Instantly grants +50 Bond EXP to your active companions.',

            effect: 'pet_exp',

            value: 50

        },

        {

            id: 'scraps_pack_large',

            name: 'Iron Scraps Crate (x15)',

            cost: 4,

            type: 'material',

            desc: 'A heavy crate containing 15 salvaged Iron Scraps for Blacksmith weapon and armor upgrades.',

            matKey: 'scraps',

            amount: 15

        },

        {

            id: 'mythic_reforge_rune',

            name: 'Mythic Reforge Rune',

            cost: 8,

            type: 'consumable',

            desc: 'A glowing celestial glyph that guarantees maximum-tier stat rolls when reforging equipment affixes at the Forge.',

            effect: 'mythic_rune'

        },

        {

            id: 'mercenary_signet',

            name: "Mercenary's Signet",

            cost: 15,

            type: 'accessory',

            desc: 'A battle-worn signet ring awarded to elite guild hunters. Grants +15% bonus Gold from victories and +5% Crit Rate.',

            maxHp: 40,

            crit: 5,

            goldBonus: 15

        },

        {

            id: 'title_bounty_hunter',

            name: 'Title: Bounty Hunter',

            cost: 10,

            type: 'title',

            title: 'Bounty Hunter',

            desc: 'Unlocks and equips the cosmetic hero title "Bounty Hunter".'

        },

        {

            id: 'title_apex_mercenary',

            name: 'Title: Apex Mercenary',

            cost: 25,

            type: 'title',

            title: 'Apex Mercenary',

            desc: 'Unlocks and equips the prestigious hero title "Apex Mercenary".'

        }


    ];

    const CALAMITY_KEYSTONE_EXCHANGE = {
        id: 'calamity_keystone',
        name: 'Calamity Keystone',
        cost: 10,
        type: 'keystone',
        desc: 'A pulsing primordial relic that unlocks access to the Abyssal Calamity Rifts. Consumed only upon raid victory.',
        effect: 'calamity_key'
    };

    const _origTavernFind = TAVERN_EXCHANGE_DB.find;
    TAVERN_EXCHANGE_DB.find = function(predicate, thisArg) {
        let res = _origTavernFind.call(this, predicate, thisArg);
        if (!res && predicate) {
            if (predicate(CALAMITY_KEYSTONE_EXCHANGE, 6, this)) return CALAMITY_KEYSTONE_EXCHANGE;
        }
        return res;
    };

    window.TAVERN_EXCHANGE_DB = TAVERN_EXCHANGE_DB;
    window.CALAMITY_KEYSTONE_EXCHANGE = CALAMITY_KEYSTONE_EXCHANGE;



    /* =========================================================================

       HERO RANKS, STAT GROWTH & SCOUTING RECRUITMENT DATABASE

       ========================================================================= */

    const HERO_RANKS_DB = {

        'F': { name: 'F-Rank', mult: 0.85, growth: { hp: 8, mp: 3, atk: 1, def: 1, matk: 1, mdef: 1, spd: 0.5 }, color: '#94a3b8' },

        'E': { name: 'E-Rank', mult: 0.95, growth: { hp: 10, mp: 4, atk: 2, def: 1, matk: 2, mdef: 1, spd: 0.6 }, color: '#cbd5e1' },

        'D': { name: 'D-Rank', mult: 1.05, growth: { hp: 12, mp: 5, atk: 2, def: 2, matk: 2, mdef: 2, spd: 0.8 }, color: '#4ade80' },

        'C': { name: 'C-Rank', mult: 1.15, growth: { hp: 15, mp: 6, atk: 3, def: 2, matk: 3, mdef: 2, spd: 1.0 }, color: '#38bdf8' },

        'B': { name: 'B-Rank', mult: 1.25, growth: { hp: 18, mp: 8, atk: 4, def: 3, matk: 4, mdef: 3, spd: 1.2 }, color: '#a855f7' },

        'A': { name: 'A-Rank', mult: 1.40, growth: { hp: 22, mp: 10, atk: 5, def: 4, matk: 5, mdef: 4, spd: 1.5 }, color: '#f59e0b' },

        'S': { name: 'S-Rank', mult: 1.65, growth: { hp: 28, mp: 12, atk: 7, def: 5, matk: 7, mdef: 5, spd: 2.0 }, color: '#ec4899' }

    };

    window.HERO_RANKS_DB = HERO_RANKS_DB;



    const SCOUT_TIERS_DB = {

        standard: {

            id: 'standard',

            name: 'Standard Scout',

            tierNum: 1,

            costType: 'gold',

            cost: 250,

            rates: { 'S': 0.1, 'A': 0.5, 'B': 1.0, 'C': 15.0, 'D': 25.0, 'E': 30.0, 'F': 28.4 },

            desc: 'Recruit local adventurers and sellswords seeking fortune.'

        },

        advanced: {

            id: 'advanced',

            name: 'Advanced Scout',

            tierNum: 2,

            costType: 'gold',

            cost: 1000,

            rates: { 'S': 0.5, 'A': 1.5, 'B': 3.0, 'C': 25.0, 'D': 35.0, 'E': 25.0, 'F': 10.0 },

            desc: 'Contract seasoned veterans with superior potential and discipline.'

        },

        royal: {

            id: 'royal',

            name: 'Royal Mercenary Scout',

            tierNum: 3,

            costType: 'marks',

            cost: 5,

            rates: { 'S': 2.0, 'A': 8.0, 'B': 20.0, 'C': 40.0, 'D': 30.0, 'E': 0.0, 'F': 0.0 },

            desc: 'Call upon legendary guild champions. Guaranteed Rank D or higher (Zero E or F ranks)!'

        }

    };

    window.SCOUT_TIERS_DB = SCOUT_TIERS_DB;



    const BARRACKS_EXPANSIONS = [

        { from: 5, to: 8, cost: 1000 },

        { from: 8, to: 12, cost: 3500 },

        { from: 12, to: 16, cost: 10000 },

        { from: 16, to: 20, cost: 25000 },

        { from: 20, to: 25, cost: 50000 }

    ];

    window.BARRACKS_EXPANSIONS = BARRACKS_EXPANSIONS;



    const PARTY_SLOT_TIERS = [

        {

            from: 1,

            to: 3,

            targetSlots: 3,

            cost: 250,

            reqBossArea: 1,

            reqBossName: 'Ancient Treant',

            altBossName: 'Elder Treant',

            reqUnlockedArea: 'area_2',

            label: '3-Hero Squad Formation',

            desc: 'Expand active party capacity from 1 to 3 Heroes. Requires defeating Area 1 Boss (Ancient Treant) and 250 Gold.'

        },

        {

            from: 3,

            to: 5,

            targetSlots: 5,

            cost: 2500,

            reqBossArea: 5,

            reqBossName: 'Void Guardian',

            altBossName: 'Void Guardian',

            reqUnlockedArea: 'area_6',

            label: '5-Hero Grand Party',

            desc: 'Expand active party capacity from 3 to 5 Heroes. Requires defeating Area 5 Boss (Void Guardian) and 2,500 Gold.'

        }

    ];

    window.PARTY_SLOT_TIERS = PARTY_SLOT_TIERS;







    /* =========================================================================
       MYTHIC SETS & ENDGAME CALAMITY RAIDS DATABASE
       ========================================================================= */

    const MYTHIC_SETS_DB = {
        titans_bulwark: {
            id: 'titans_bulwark',
            name: "Titan's Bulwark",
            classes: ['warrior', 'paladin', 'barbarian'],
            themeColor: '#f59e0b',
            essence: 'ignis_heart',
            essenceName: 'Ignis Heart',
            mythicSets: ["Titan's Bulwark"],
            pieces: ["Titan's Helm", "Titan's Chestplate", "Titan's Gauntlets", "Titan's Greaves"],
            twoPieceBonus: {
                desc: '+25% Max HP, +20% Physical & Elemental DEF',
                maxHpPct: 25,
                defPct: 20,
                mdefPct: 20
            },
            fourPieceBonus: {
                name: 'Living Bastion',
                desc: 'Wearer absorbs 35% of all damage dealt to Backline allies. When wearer drops below 25% HP, immediately gain a Divine Barrier equal to 50% Max HP (once per encounter).'
            }
        },
        archons_voidweave: {
            id: 'archons_voidweave',
            name: "Archon's Voidweave",
            classes: ['mage', 'archmage', 'chronomancer'],
            themeColor: '#a855f7',
            essence: 'abyssal_pearl',
            essenceName: 'Abyssal Pearl',
            mythicSets: ["Hallowed Seraphim"],
            pieces: ["Archon's Crown", "Archon's Robes", "Archon's Gloves", "Archon's Slippers"],
            twoPieceBonus: {
                desc: '-30% Skill MP Costs, +25% MATK',
                matkPct: 25,
                mpCostReductionPct: 30
            },
            fourPieceBonus: {
                name: 'Echo Cast',
                desc: 'Damaging spells have a 35% chance to instantly recast free of cost at 75% power. Basic attacks restore 5% Max MP.'
            }
        },
        shadowstalker_regalia: {
            id: 'shadowstalker_regalia',
            name: "Shadowstalker Regalia",
            classes: ['rogue', 'assassin', 'ranger'],
            themeColor: '#10b981',
            essence: 'chronos_riftcore',
            essenceName: 'Chronos Riftcore',
            mythicSets: ["Archon's Voidweave", "Shadowstalker Regalia"],
            pieces: ["Shadowstalker Cowl", "Shadowstalker Vest", "Shadowstalker Bracers", "Shadowstalker Boots"],
            twoPieceBonus: {
                desc: '+25% Critical Hit Chance, +15 SPD',
                crit: 25,
                spd: 15
            },
            fourPieceBonus: {
                name: 'Exposing Strikes',
                desc: 'Critical strikes apply Armor Shatter (-30% enemy DEF & MDEF for 3 turns, stacks twice). Basic attacks strike twice against debuffed targets.'
            }
        },
        hallowed_seraphim: {
            id: 'hallowed_seraphim',
            name: "Hallowed Seraphim",
            classes: ['cleric', 'support', 'healer'],
            themeColor: '#fbbf24',
            essence: 'ignis_heart',
            essenceName: 'Ignis Heart',
            pieces: ["Seraph's Diadem", "Seraph's Vestments", "Seraph's Mitts", "Seraph's Treads"],
            twoPieceBonus: {
                desc: '+35% Healing & Shielding Potency',
                healShieldPotencyPct: 35
            },
            fourPieceBonus: {
                name: 'Grace of the Dawn',
                desc: 'Overhealing converts into a Divine Barrier (up to 30% Max HP). Casting any support skill grants Haste (+15 SPD) to all party members for 2 turns.'
            }
        }
    };
    
        // Aliases for Mythic piece keys
    Object.assign(ITEMS_DB, {
        "archons_crown": { type: 'helmet', def: 45, mdef: 65, maxMp: 50, matk: 40, price: 6500, rarity: 'Mythic', setId: 'archons_voidweave', setName: "Archon's Voidweave", desc: "+45 DEF, +65 MDEF, +50 Max MP, +40 MATK [Set: Archon's Voidweave]" },
        "archons_cowl": { type: 'helmet', def: 45, mdef: 65, maxMp: 50, matk: 40, price: 6500, rarity: 'Mythic', setId: 'archons_voidweave', setName: "Archon's Voidweave", desc: "+45 DEF, +65 MDEF, +50 Max MP, +40 MATK [Set: Archon's Voidweave]" },
        "archons_robes": { type: 'armor', def: 55, mdef: 95, maxHp: 90, matk: 60, price: 7500, rarity: 'Mythic', setId: 'archons_voidweave', setName: "Archon's Voidweave", desc: "+55 DEF, +95 MDEF, +90 Max HP, +60 MATK [Set: Archon's Voidweave]" },
        "archons_gloves": { type: 'gloves', def: 35, mdef: 60, matk: 45, maxMp: 40, price: 6000, rarity: 'Mythic', setId: 'archons_voidweave', setName: "Archon's Voidweave", desc: "+35 DEF, +60 MDEF, +45 MATK, +40 Max MP [Set: Archon's Voidweave]" },
        "archons_slippers": { type: 'boots', def: 35, mdef: 55, spd: 25, matk: 35, price: 6000, rarity: 'Mythic', setId: 'archons_voidweave', setName: "Archon's Voidweave", desc: "+35 DEF, +55 MDEF, +25 SPD, +35 MATK [Set: Archon's Voidweave]" },
        "shadowstalker_cowl": { type: 'helmet', def: 55, mdef: 45, crit: 8, spd: 15, price: 6500, rarity: 'Mythic', setId: 'shadowstalker_regalia', setName: "Shadowstalker Regalia", desc: "+55 DEF, +45 MDEF, +8% Crit, +15 SPD [Set: Shadowstalker Regalia]" },
        "shadowstalker_hood": { type: 'helmet', def: 55, mdef: 45, crit: 8, spd: 15, price: 6500, rarity: 'Mythic', setId: 'shadowstalker_regalia', setName: "Shadowstalker Regalia", desc: "+55 DEF, +45 MDEF, +8% Crit, +15 SPD [Set: Shadowstalker Regalia]" },
        "shadowstalker_vest": { type: 'armor', def: 75, mdef: 60, atk: 55, crit: 10, price: 7500, rarity: 'Mythic', setId: 'shadowstalker_regalia', setName: "Shadowstalker Regalia", desc: "+75 DEF, +60 MDEF, +55 ATK, +10% Crit [Set: Shadowstalker Regalia]" },
        "shadowstalker_garb": { type: 'armor', def: 75, mdef: 60, atk: 55, crit: 10, price: 7500, rarity: 'Mythic', setId: 'shadowstalker_regalia', setName: "Shadowstalker Regalia", desc: "+75 DEF, +60 MDEF, +55 ATK, +10% Crit [Set: Shadowstalker Regalia]" },
        "shadowstalker_bracers": { type: 'gloves', atk: 50, crit: 12, spd: 12, price: 6000, rarity: 'Mythic', setId: 'shadowstalker_regalia', setName: "Shadowstalker Regalia", desc: "+50 ATK, +12% Crit, +12 SPD [Set: Shadowstalker Regalia]" },
        "shadowstalker_boots": { type: 'boots', def: 45, spd: 35, crit: 6, price: 6000, rarity: 'Mythic', setId: 'shadowstalker_regalia', setName: "Shadowstalker Regalia", desc: "+45 DEF, +35 SPD, +6% Crit [Set: Shadowstalker Regalia]" },
        "seraphs_crown": { type: 'helmet', def: 50, mdef: 75, maxHp: 80, maxMp: 50, price: 6500, rarity: 'Mythic', setId: 'hallowed_seraphim', setName: "Hallowed Seraphim", desc: "+50 DEF, +75 MDEF, +80 Max HP, +50 Max MP [Set: Hallowed Seraphim]" },
        "seraphim_halo": { type: 'helmet', def: 50, mdef: 75, maxHp: 80, maxMp: 50, price: 6500, rarity: 'Mythic', setId: 'hallowed_seraphim', setName: "Hallowed Seraphim", desc: "+50 DEF, +75 MDEF, +80 Max HP, +50 Max MP [Set: Hallowed Seraphim]" },
        "seraphs_vestments": { type: 'armor', def: 65, mdef: 105, maxHp: 120, maxMp: 70, price: 7500, rarity: 'Mythic', setId: 'hallowed_seraphim', setName: "Hallowed Seraphim", desc: "+65 DEF, +105 MDEF, +120 Max HP, +70 Max MP [Set: Hallowed Seraphim]" },
        "seraphim_vestments": { type: 'armor', def: 65, mdef: 105, maxHp: 120, maxMp: 70, price: 7500, rarity: 'Mythic', setId: 'hallowed_seraphim', setName: "Hallowed Seraphim", desc: "+65 DEF, +105 MDEF, +120 Max HP, +70 Max MP [Set: Hallowed Seraphim]" },
        "seraphs_mitts": { type: 'gloves', def: 40, mdef: 65, maxMp: 60, matk: 35, price: 6000, rarity: 'Mythic', setId: 'hallowed_seraphim', setName: "Hallowed Seraphim", desc: "+40 DEF, +65 MDEF, +60 Max MP, +35 MATK [Set: Hallowed Seraphim]" },
        "seraphs_sandals": { type: 'boots', def: 40, mdef: 60, spd: 25, maxHp: 60, price: 6000, rarity: 'Mythic', setId: 'hallowed_seraphim', setName: "Hallowed Seraphim", desc: "+40 DEF, +60 MDEF, +25 SPD, +60 Max HP [Set: Hallowed Seraphim]" },
    });

    for (let s in MYTHIC_SETS_DB) {
        MYTHIC_SETS_DB[s].bonuses = {
            2: MYTHIC_SETS_DB[s].twoPieceBonus,
            4: MYTHIC_SETS_DB[s].fourPieceBonus
        };
    }
window.MYTHIC_SETS_DB = MYTHIC_SETS_DB;

    const RAIDS_DB = {
        raid_ignis: {
            id: 'raid_ignis',
            name: 'Ignis, The Living Supernova',
            level: 50,
            element: 'Fire',
            weakness: 'Water',
            themeColor: '#f97316',
            bgGradient: 'linear-gradient(135deg, #1c0a00 0%, #431407 100%)',
            desc: 'A colossal solar deity blazing with stellar fury. Channels apocalyptic Supernova pulses that must be staggered.',
            hp: 24000,
            atk: 340,
            def: 140,
            matk: 360,
            mdef: 140,
            spd: 38,
            exp: 20000,
            gold: 12000,
            staggerMax: 6000,
            essenceDrop: 'ignis_heart',
            essenceName: 'Ignis Heart',
            phases: [
                { phase: 1, name: 'Solar Cleave', desc: 'Heavy Fire cleave hitting both frontline heroes with Burn.' },
                { phase: 2, name: 'Magma Totems', desc: 'At 66% HP, summons 2 Magma Totems providing 90% damage mitigation until shattered.' },
                { phase: 3, name: 'Supernova Cataclysm', desc: 'At 33% HP, soft enrages (+25% ATK, +20% SPD) and channels Supernova Stagger check.' }
            ]
        },
        raid_leviathan: {
            id: 'raid_leviathan',
            name: 'Leviathan, The Abyssal Sovereign',
            level: 52,
            element: 'Water',
            weakness: 'Wind',
            themeColor: '#0ea5e9',
            bgGradient: 'linear-gradient(135deg, #030712 0%, #082f49 100%)',
            desc: 'An ancient leviathan from the oceanic trench whose crushing depth shatters mortal armor and freezes souls in glacial tombs.',
            hp: 30000,
            atk: 360,
            def: 160,
            matk: 380,
            mdef: 160,
            spd: 36,
            exp: 25000,
            gold: 15000,
            staggerMax: 7000,
            essenceDrop: 'abyssal_pearl',
            essenceName: 'Abyssal Pearl',
            phases: [
                { phase: 1, name: 'Crushing Depth', desc: 'Strikes frontline hero, reducing DEF by 40% for 3 turns.' },
                { phase: 2, name: 'Tidal Sirens', desc: 'At 66% HP, summons 2 Abyssal Sirens that silence skill users.' },
                { phase: 3, name: 'Glacial Prison', desc: 'At 33% HP, soft enrages and encases highest HP ally in Ice Block until dealt 3,000 damage.' }
            ]
        },
        raid_chronos: {
            id: 'raid_chronos',
            name: 'Chronos, Cosmic Void-Incarnate',
            level: 55,
            element: 'Dark',
            weakness: 'Light',
            themeColor: '#a855f7',
            bgGradient: 'linear-gradient(135deg, #020617 0%, #3b0764 100%)',
            desc: 'The pinnacle cosmic horror ruling over fractured space-time. Inverts turn order speed and channels lethal Singularity wipes.',
            hp: 40000,
            atk: 400,
            def: 175,
            matk: 420,
            mdef: 180,
            spd: 45,
            exp: 35000,
            gold: 20000,
            staggerMax: 30000,
            essenceDrop: 'chronos_riftcore',
            essenceName: 'Chronos Riftcore',
            phases: [
                { phase: 1, name: 'Temporal Anomaly', desc: 'Inverts turn order speed: lowest SPD acts first.' },
                { phase: 2, name: 'Doom Brands', desc: 'At 66% HP, brands 2 heroes with a 3-turn Doom countdown (1,500 damage to cleanse).' },
                { phase: 3, name: 'Singularity Event', desc: 'At 33% HP, soft enrages and channels 30,000 HP Singularity barrier (99,999 wipe on fail).' }
            ]
        }
    };
    window.RAIDS_DB = RAIDS_DB;
