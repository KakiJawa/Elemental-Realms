/* =========================================================================
       STATE VARIABLES
       ========================================================================= */

    let player = {};
    let pStats = {}; 

    let battleState = {
        active: false,
        initialEnemyCount: 1, 
        enemies: [],
        turnQueue: [],
        targetingMode: null, 
        log: []
    };

    /* =========================================================================
       COMBAT TURN CONTROLLER & SPEED SYSTEM
       ========================================================================= */

    let combatSpeed = 1; // 1 | 2 | 3
    let activeCombatTimers = [];

    function setCombatTimeout(callback, baseDelay, ignoreActiveCheck = false) {
        let scaledDelay = Math.max(40, Math.floor(baseDelay / combatSpeed));
        let timerId;
        timerId = setTimeout(() => {
            activeCombatTimers = activeCombatTimers.filter(id => id !== timerId);
            if (ignoreActiveCheck || (typeof battleState !== 'undefined' && battleState.active)) {
                callback();
            }
        }, scaledDelay);
        activeCombatTimers.push(timerId);
        return timerId;
    }

    function clearAllCombatTimers() {
        activeCombatTimers.forEach(id => clearTimeout(id));
        activeCombatTimers = [];
    }

    function toggleCombatSpeed() {
        if (combatSpeed === 1) combatSpeed = 2;
        else if (combatSpeed === 2) combatSpeed = 3;
        else combatSpeed = 1;

        const btn = document.getElementById('btn-combat-speed');
        if (btn) {
            btn.innerText = `⚡ Speed: ${combatSpeed}x`;
        }
        showToast('Combat Speed', `${combatSpeed}x Speed Active`, 'info', 1500);
        logMsg(`Combat pacing changed to ${combatSpeed}x speed.`, '#ffaa00');
    }

    /* =========================================================================
       CORE & UTILS
       ========================================================================= */

    /* =========================================================================
       ARPG ITEM GENERATOR & INVENTORY ARCHITECTURE
       ========================================================================= */

    function rollAffix(affixDef) {
        let val = Math.floor(Math.random() * (affixDef.max - affixDef.min + 1)) + affixDef.min;
        return {
            id: affixDef.id,
            name: affixDef.name,
            type: affixDef.type,
            stat: affixDef.stat,
            value: val,
            desc: affixDef.desc.replace('{val}', val),
            label: affixDef.label || null
        };
    }

    function generateItem(baseName, forceRarity = null) {
        const baseItem = ITEMS_DB[baseName] || { type: 'weapon', atk: 3, price: 10, desc: '+3 ATK' };
        
        let rarity = forceRarity;
        if (!rarity || !RARITY_TIERS[rarity]) {
            let rand = Math.random() * 10000;
            let cumulative = 0;
            for (let r in RARITY_TIERS) {
                cumulative += RARITY_TIERS[r].weight;
                if (rand <= cumulative) {
                    rarity = r;
                    break;
                }
            }
            if (!rarity) rarity = 'Common';
        }

        const tierInfo = RARITY_TIERS[rarity];
        const affixCount = tierInfo.affixes;

        let shuffled = [...AFFIXES_DB].sort(() => 0.5 - Math.random());
        let chosenAffixes = shuffled.slice(0, affixCount).map(rollAffix);

        let prefix = chosenAffixes.find(a => a.type === 'prefix');
        let suffix = chosenAffixes.find(a => a.type === 'suffix');
        
        let generatedName = baseName;
        if (prefix && suffix && suffix.label) {
            generatedName = `${prefix.name} ${baseName} ${suffix.label}`;
        } else if (prefix) {
            generatedName = `${prefix.name} ${baseName}`;
        } else if (suffix && suffix.label) {
            generatedName = `${baseName} ${suffix.label}`;
        } else if (chosenAffixes[0]) {
            generatedName = `${chosenAffixes[0].name} ${baseName}`;
        }

        let baseStats = {};
        if (baseItem.atk) baseStats.atk = baseItem.atk;
        if (baseItem.def) baseStats.def = baseItem.def;
        if (baseItem.matk) baseStats.matk = baseItem.matk;
        if (baseItem.mdef) baseStats.mdef = baseItem.mdef;
        if (baseItem.spd) baseStats.spd = baseItem.spd;
        if (baseItem.crit) baseStats.crit = baseItem.crit;
        if (baseItem.maxHp) baseStats.maxHp = baseItem.maxHp;
        if (baseItem.maxMp) baseStats.maxMp = baseItem.maxMp;

        let basePrice = baseItem.price || 20;
        let sellPrice = Math.max(5, Math.floor(basePrice * tierInfo.priceMult * 0.6));

        return {
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            baseName: baseName,
            name: generatedName,
            type: baseItem.type,
            rarity: rarity,
            baseStats: baseStats,
            affixes: chosenAffixes,
            sellPrice: sellPrice
        };
    }

    function createInventory(consumables = {}, equipment = []) {
        const raw = {
            consumables: { ...consumables },
            equipment: Array.isArray(equipment) ? [...equipment] : []
        };
        return new Proxy(raw, {
            get(target, prop) {
                if (prop in target) return target[prop];
                if (typeof prop === 'string') {
                    if (target.consumables && prop in target.consumables) {
                        return target.consumables[prop];
                    }
                    if (typeof ITEMS_DB !== 'undefined' && ITEMS_DB[prop]) {
                        if (ITEMS_DB[prop].type === 'consumable') {
                            return (target.consumables && target.consumables[prop]) || 0;
                        } else if (target.equipment) {
                            return target.equipment.filter(e => e.baseName === prop || e.name === prop).length;
                        }
                    }
                }
                return target[prop];
            },
            set(target, prop, value) {
                if (prop === 'consumables' || prop === 'equipment') {
                    target[prop] = value;
                    return true;
                }
                if (typeof prop === 'string' && typeof ITEMS_DB !== 'undefined' && ITEMS_DB[prop]) {
                    if (ITEMS_DB[prop].type === 'consumable') {
                        if (!target.consumables) target.consumables = {};
                        target.consumables[prop] = value;
                        return true;
                    }
                }
                target[prop] = value;
                return true;
            },
            has(target, prop) {
                if (prop in target) return true;
                if (target.consumables && prop in target.consumables) return true;
                if (typeof ITEMS_DB !== 'undefined' && prop in ITEMS_DB) return true;
                return false;
            }
        });
    }

    /* =========================================================================
       TOAST NOTIFICATION SYSTEM
       ========================================================================= */

    function showToast(title, message, type = 'info', duration = 3500) {
        let container = document.getElementById('toast-container');
        if(!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;
        
        let icon = 'ℹ️';
        if(type === 'quest') icon = '📜';
        else if(type === 'achievement') icon = '★';
        else if(type === 'level') icon = '⚡';
        else if(type === 'save') icon = '💾';

        toast.innerHTML = `
            <div class="toast-title"><span>${icon}</span> <span>${title}</span></div>
            <div class="toast-msg">${message}</div>
        `;

        toast.onclick = () => {
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        };

        container.appendChild(toast);

        setTimeout(() => {
            if(toast.parentElement) {
                toast.classList.add('toast-hide');
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }

    function init() {
        if(!player || !player.baseStats) return;
        computeStats();
        updateHeader();
    }

    function computeStats() {
        pStats = { ...player.baseStats };
        
        // Add Equipment stats (all 6 slots)
        for (let slot in player.equipment) {
            let item = player.equipment[slot];
            if (!item) continue;
            
            if (typeof item === 'object') {
                let upLevel = item.upgradeLevel || 0;
                if (item.baseStats) {
                    if (item.baseStats.maxHp) pStats.maxHp += getUpgradedStat(item.baseStats.maxHp, upLevel);
                    if (item.baseStats.maxMp) pStats.maxMp += getUpgradedStat(item.baseStats.maxMp, upLevel);
                    if (item.baseStats.atk) pStats.atk += getUpgradedStat(item.baseStats.atk, upLevel);
                    if (item.baseStats.def) pStats.def += getUpgradedStat(item.baseStats.def, upLevel);
                    if (item.baseStats.matk) pStats.matk += getUpgradedStat(item.baseStats.matk, upLevel);
                    if (item.baseStats.mdef) pStats.mdef += getUpgradedStat(item.baseStats.mdef, upLevel);
                    if (item.baseStats.spd) pStats.spd += getUpgradedStat(item.baseStats.spd, upLevel);
                    if (item.baseStats.crit) pStats.crit += getUpgradedStat(item.baseStats.crit, upLevel);
                }
                if (item.affixes && Array.isArray(item.affixes)) {
                    for (let affix of item.affixes) {
                        if (affix.stat && affix.value) {
                            if (affix.stat === 'maxHp') pStats.maxHp += affix.value;
                            else if (affix.stat === 'maxMp') pStats.maxMp += affix.value;
                            else if (affix.stat === 'atk') pStats.atk += affix.value;
                            else if (affix.stat === 'def') pStats.def += affix.value;
                            else if (affix.stat === 'matk') pStats.matk += affix.value;
                            else if (affix.stat === 'mdef') pStats.mdef += affix.value;
                            else if (affix.stat === 'spd') pStats.spd += affix.value;
                            else if (affix.stat === 'crit') pStats.crit += affix.value;
                            else if (affix.stat === 'goldBonus') pStats.goldBonus = (pStats.goldBonus || 0) + affix.value;
                        }
                    }
                }
            } else if (typeof item === 'string' && ITEMS_DB[item]) {
                let eq = ITEMS_DB[item];
                if (eq.maxHp) pStats.maxHp += eq.maxHp;
                if (eq.maxMp) pStats.maxMp += eq.maxMp;
                if (eq.atk) pStats.atk += eq.atk;
                if (eq.def) pStats.def += eq.def;
                if (eq.matk) pStats.matk += eq.matk;
                if (eq.mdef) pStats.mdef += eq.mdef;
                if (eq.spd) pStats.spd += eq.spd;
                if (eq.crit) pStats.crit += eq.crit;
            }
        }
        // Add Skill Tree Stats
        if(player.skillTree) {
            pStats.maxHp += player.skillTree.vitalityTraining * 10;
            pStats.maxMp += player.skillTree.spiritTraining * 5;
            pStats.atk += player.skillTree.atkTraining * 2;
            pStats.def += player.skillTree.defTraining * 2;
            pStats.crit += player.skillTree.critTraining * 2;
        }

        // Add Achievement Passive Stat Bonuses
        if(player.achievements) {
            for(let id in player.achievements) {
                if(player.achievements[id] && player.achievements[id].unlocked && typeof ACHIEVEMENTS_DB !== 'undefined' && ACHIEVEMENTS_DB[id] && ACHIEVEMENTS_DB[id].reward && ACHIEVEMENTS_DB[id].reward.stats) {
                    let st = ACHIEVEMENTS_DB[id].reward.stats;
                    if(st.maxHp) pStats.maxHp += st.maxHp;
                    if(st.maxMp) pStats.maxMp += st.maxMp;
                    if(st.atk) pStats.atk += st.atk;
                    if(st.def) pStats.def += st.def;
                    if(st.matk) pStats.matk += st.matk;
                    if(st.mdef) pStats.mdef += st.mdef;
                    if(st.spd) pStats.spd += st.spd;
                    if(st.crit) pStats.crit += st.crit;
                }
            }
        }

        // Apply Class Stat Multipliers
        let cls = (typeof CLASSES_DB !== 'undefined' && player.currentClass && CLASSES_DB[player.currentClass]);
        if (cls && cls.statMods) {
            if (cls.statMods.atk) pStats.atk = Math.round(pStats.atk * cls.statMods.atk);
            if (cls.statMods.def) pStats.def = Math.round(pStats.def * cls.statMods.def);
            if (cls.statMods.matk) pStats.matk = Math.round(pStats.matk * cls.statMods.matk);
            if (cls.statMods.mdef) pStats.mdef = Math.round(pStats.mdef * cls.statMods.mdef);
            if (cls.statMods.spd) pStats.spd = Math.round(pStats.spd * cls.statMods.spd);
            if (cls.statMods.maxHp) pStats.maxHp = Math.round(pStats.maxHp * cls.statMods.maxHp);
            if (cls.statMods.maxMp) pStats.maxMp = Math.round(pStats.maxMp * cls.statMods.maxMp);
            if (cls.statMods.crit) pStats.crit += cls.statMods.crit;
        }

        player.baseStats.hp = Math.min(player.baseStats.hp, pStats.maxHp);
        player.baseStats.mp = Math.min(player.baseStats.mp, pStats.maxMp);
        pStats.hp = player.baseStats.hp;
        pStats.mp = player.baseStats.mp;
    }

    function updateSaveLoadButtons(forceInBattle) {
        const inBattle = (typeof forceInBattle === 'boolean') ? forceInBattle : (typeof battleState !== 'undefined' && battleState.active);
        const saveBtn = document.getElementById('btn-hdr-save');
        const loadBtn = document.getElementById('btn-hdr-load');
        if(saveBtn) {
            saveBtn.disabled = inBattle;
            saveBtn.style.opacity = inBattle ? '0.4' : '1.0';
            saveBtn.style.cursor = inBattle ? 'not-allowed' : 'pointer';
        }
        if(loadBtn) {
            loadBtn.disabled = inBattle;
            loadBtn.style.opacity = inBattle ? '0.4' : '1.0';
            loadBtn.style.cursor = inBattle ? 'not-allowed' : 'pointer';
        }
    }

    function updateHeader() {
        if(!player || !player.baseStats) return;
        const titleEl = document.getElementById('hdr-title');
        if(titleEl) titleEl.innerText = player.activeTitle || 'Novice';
        const classEl = document.getElementById('hdr-class');
        if(classEl) {
            let cls = (typeof CLASSES_DB !== 'undefined' && player.currentClass && CLASSES_DB[player.currentClass]);
            classEl.innerText = cls ? cls.name : 'Novice';
        }
        document.getElementById('hdr-lvl').innerText = player.level;
        document.getElementById('hdr-hp').innerText = pStats.hp;
        document.getElementById('hdr-maxhp').innerText = pStats.maxHp;
        document.getElementById('hdr-mp').innerText = pStats.mp;
        document.getElementById('hdr-maxmp').innerText = pStats.maxMp;
        document.getElementById('hdr-gold').innerText = player.gold;
        if(typeof updateTownQuestButton === 'function') updateTownQuestButton();
        if(typeof updateTownAchievementsButton === 'function') updateTownAchievementsButton();
        updateSaveLoadButtons();
    }

    function switchScreen(screenId) {
        if (screenId !== 'battle') {
            if (typeof clearAllCombatTimers === 'function') clearAllCombatTimers();
        }
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('screen-' + screenId).classList.add('active');
        updateSaveLoadButtons(screenId === 'battle');
    }


    /* =========================================================================
       BLACKSMITH WORKSHOP SYSTEM (SALVAGE, UPGRADE & REFORGE)
       ========================================================================= */

    let blacksmithActiveTab = 'upgrade'; // 'upgrade' | 'reforge' | 'salvage'
    let selectedUpgradeId = null;
    let selectedReforgeId = null;
    let selectedReforgeAffixIndex = 0;

    function findEquipmentItem(idOrSlot) {
        if (!player) return null;
        if (player.equipment && player.equipment[idOrSlot]) {
            return { item: player.equipment[idOrSlot], isEquipped: true, slot: idOrSlot };
        }
        if (player.inventory && player.inventory.equipment) {
            let idx = player.inventory.equipment.findIndex(i => i.id === idOrSlot);
            if (idx !== -1) {
                return { item: player.inventory.equipment[idx], isEquipped: false, index: idx };
            }
        }
        if (player.equipment) {
            for (let slot in player.equipment) {
                let eq = player.equipment[slot];
                if (eq && typeof eq === 'object' && eq.id === idOrSlot) {
                    return { item: eq, isEquipped: true, slot: slot };
                }
            }
        }
        return null;
    }

    function setBlacksmithTab(tab) {
        blacksmithActiveTab = tab;
        renderBlacksmith();
    }

    function selectUpgradeTarget(idOrSlot) {
        selectedUpgradeId = idOrSlot;
        renderBlacksmith();
    }

    function selectReforgeTarget(idOrSlot) {
        selectedReforgeId = idOrSlot;
        selectedReforgeAffixIndex = 0;
        renderBlacksmith();
    }

    function selectReforgeAffix(index) {
        selectedReforgeAffixIndex = index;
        renderBlacksmith();
    }

    function salvageItem(itemId) {
        if (!player || !player.inventory || !player.inventory.equipment) return;
        let index = player.inventory.equipment.findIndex(i => i.id === itemId);
        if (index === -1) return;

        let item = player.inventory.equipment[index];
        let rarity = item.rarity || 'Common';
        let rates = SALVAGE_RATES[rarity] || SALVAGE_RATES['Common'];

        if (!player.materials) player.materials = { scrap: 0, dust: 0, shard: 0 };
        player.materials.scrap = (player.materials.scrap || 0) + rates.scrap;
        player.materials.dust = (player.materials.dust || 0) + rates.dust;
        player.materials.shard = (player.materials.shard || 0) + rates.shard;
        player.gold = (player.gold || 0) + rates.gold;

        player.inventory.equipment.splice(index, 1);

        let parts = [];
        if (rates.scrap) parts.push(`+${rates.scrap} Scraps`);
        if (rates.dust) parts.push(`+${rates.dust} Dust`);
        if (rates.shard) parts.push(`+${rates.shard} Shards`);
        if (rates.gold) parts.push(`+${rates.gold} Gold`);

        showToast('Item Salvaged', `${item.name} dismantled: ${parts.join(', ')}`, 'info');

        updateHeader();
        renderBlacksmith();
        renderInventory();
    }

    function salvageAllCommonUncommon() {
        if (!player || !player.inventory || !player.inventory.equipment) return;
        
        let matching = player.inventory.equipment.filter(i => i.rarity === 'Common' || i.rarity === 'Uncommon');
        if (matching.length === 0) {
            showToast('Salvage Station', 'No Common or Uncommon items in inventory to salvage.', 'info');
            return;
        }

        if (!player.materials) player.materials = { scrap: 0, dust: 0, shard: 0 };
        let totalScrap = 0;
        let totalGold = 0;

        for (let item of matching) {
            let rates = SALVAGE_RATES[item.rarity] || SALVAGE_RATES['Common'];
            totalScrap += rates.scrap;
            totalGold += rates.gold;
        }

        player.materials.scrap = (player.materials.scrap || 0) + totalScrap;
        player.gold = (player.gold || 0) + totalGold;

        // Remove matching items from inventory equipment
        player.inventory.equipment = player.inventory.equipment.filter(i => i.rarity !== 'Common' && i.rarity !== 'Uncommon');

        showToast('Bulk Salvage Complete', `Dismantled ${matching.length} items for +${totalScrap} Scraps, +${totalGold} Gold.`, 'info');

        updateHeader();
        renderBlacksmith();
        renderInventory();
    }

    function upgradeEquipment(idOrSlot) {
        let found = findEquipmentItem(idOrSlot);
        if (!found) return;

        let item = found.item;
        let curLvl = item.upgradeLevel || 0;
        if (curLvl >= 5) {
            showToast('Max Rank', 'This item is already at maximum upgrade (+5)!', 'info');
            return;
        }

        let nextLvl = curLvl + 1;
        let cost = UPGRADE_COSTS[nextLvl];

        if (!player.materials) player.materials = { scrap: 0, dust: 0, shard: 0 };
        let pGold = player.gold || 0;
        let pScrap = player.materials.scrap || 0;
        let pDust = player.materials.dust || 0;
        let pShard = player.materials.shard || 0;

        if (pGold < cost.gold || pScrap < cost.scrap || pDust < cost.dust || pShard < cost.shard) {
            showToast('Insufficient Resources', 'Not enough gold or crafting materials!', 'info');
            return;
        }

        player.gold -= cost.gold;
        player.materials.scrap -= cost.scrap;
        player.materials.dust -= cost.dust;
        player.materials.shard -= cost.shard;

        item.upgradeLevel = nextLvl;
        let cleanName = item.name.replace(/\s\+\d+$/, '');
        item.name = `${cleanName} +${nextLvl}`;

        if (found.isEquipped) {
            computeStats();
            updateHeader();
            renderStats();
        }

        showToast('Upgrade Successful!', `${item.name} enhanced to +${nextLvl}!`, 'info');

        renderBlacksmith();
        renderInventory();
    }

    function reforgeAffix(idOrSlot, affixIndex) {
        let found = findEquipmentItem(idOrSlot);
        if (!found) return;

        let item = found.item;
        let rarity = item.rarity || 'Common';
        let cost = REFORGE_COSTS[rarity];

        if (!cost) {
            showToast('Cannot Reforge', 'Only Rare, Epic, Legendary, or Mythic items can be reforged.', 'info');
            return;
        }

        if (!item.affixes || !item.affixes[affixIndex]) {
            showToast('Error', 'Invalid affix selected for reforge.', 'info');
            return;
        }

        if (!player.materials) player.materials = { scrap: 0, dust: 0, shard: 0 };
        let pGold = player.gold || 0;
        let pDust = player.materials.dust || 0;
        let pShard = player.materials.shard || 0;

        if (pGold < cost.gold || pDust < cost.dust || pShard < cost.shard) {
            showToast('Insufficient Resources', 'Not enough gold or materials to reforge this affix!', 'info');
            return;
        }

        player.gold -= cost.gold;
        player.materials.dust -= cost.dust;
        player.materials.shard -= cost.shard;

        // Existing affix IDs on this item (excluding the one being replaced)
        let otherAffixes = item.affixes.filter((_, idx) => idx !== affixIndex);
        let existingIds = otherAffixes.map(a => a.id);

        let availablePool = AFFIXES_DB.filter(a => !existingIds.includes(a.id));
        if (availablePool.length === 0) availablePool = AFFIXES_DB;

        let newDef = availablePool[Math.floor(Math.random() * availablePool.length)];
        let newAffix = rollAffix(newDef);

        item.affixes[affixIndex] = newAffix;

        if (found.isEquipped) {
            computeStats();
            updateHeader();
            renderStats();
        }

        showToast('Affix Reforged!', `Gained: ${newAffix.name} (${newAffix.desc})`, 'info');

        renderBlacksmith();
        renderInventory();
    }

    function renderUpgradeTabHtml() {
        let allItems = [];
        const slots = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'accessory'];
        for (let s of slots) {
            if (player.equipment && player.equipment[s] && typeof player.equipment[s] === 'object') {
                allItems.push({
                    id: s,
                    rawItem: player.equipment[s],
                    label: `[EQUIPPED: ${s.toUpperCase()}]`,
                    isEquipped: true,
                    slot: s
                });
            }
        }
        if (player.inventory && player.inventory.equipment) {
            for (let eq of player.inventory.equipment) {
                allItems.push({
                    id: eq.id,
                    rawItem: eq,
                    label: `[INVENTORY: ${eq.type.toUpperCase()}]`,
                    isEquipped: false
                });
            }
        }

        if (allItems.length === 0) {
            return `<div style="text-align: center; color: #888; padding: 30px;">No equipment available to upgrade.</div>`;
        }

        if (!selectedUpgradeId || !allItems.some(a => a.id === selectedUpgradeId)) {
            selectedUpgradeId = allItems[0].id;
        }

        let currentObj = allItems.find(a => a.id === selectedUpgradeId) || allItems[0];
        let item = currentObj.rawItem;
        let curLvl = item.upgradeLevel || 0;
        let isMaxed = curLvl >= 5;
        let nextLvl = curLvl + 1;
        let cost = isMaxed ? null : UPGRADE_COSTS[nextLvl];

        let pGold = player.gold || 0;
        let pScrap = (player.materials && player.materials.scrap) || 0;
        let pDust = (player.materials && player.materials.dust) || 0;
        let pShard = (player.materials && player.materials.shard) || 0;

        let canAfford = !isMaxed && cost && (pGold >= cost.gold) && (pScrap >= cost.scrap) && (pDust >= cost.dust) && (pShard >= cost.shard);

        // Left: Item selector list
        let listHtml = `<div style="flex: 1; max-height: 380px; overflow-y: auto; padding-right: 6px;">`;
        for (let entry of allItems) {
            let eq = entry.rawItem;
            let rColor = (RARITY_TIERS[eq.rarity] && RARITY_TIERS[eq.rarity].color) || '#fff';
            let isSelected = entry.id === selectedUpgradeId;
            let lvlTag = eq.upgradeLevel ? ` <span style="color: #fb923c; font-weight: bold;">+${eq.upgradeLevel}</span>` : '';
            
            listHtml += `
                <div class="forge-card ${isSelected ? 'selected' : ''}" onclick="selectUpgradeTarget('${entry.id}')">
                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <span style="font-size: 10px; color: ${entry.isEquipped ? '#55ff55' : '#aaa'}; display: block;">${entry.label}</span>
                        <span style="font-size: 13px; font-weight: bold; color: ${rColor};">${eq.name}${lvlTag}</span>
                    </div>
                    <div style="font-size: 11px; font-weight: bold; color: ${eq.upgradeLevel >= 5 ? '#ffd700' : '#888'};">
                        ${eq.upgradeLevel ? '+' + eq.upgradeLevel : '+0'}
                    </div>
                </div>
            `;
        }
        listHtml += `</div>`;

        // Right: Upgrade Details & Action
        let rColor = (RARITY_TIERS[item.rarity] && RARITY_TIERS[item.rarity].color) || '#fff';
        let statsPreviewHtml = '';
        if (item.baseStats) {
            statsPreviewHtml += `<div style="font-size: 12px; margin: 10px 0; background: rgba(0,0,0,0.3); border-radius: 4px; padding: 8px;">`;
            statsPreviewHtml += `<div style="font-weight: bold; color: #ffd700; margin-bottom: 6px;">Stat Scaling Comparison:</div>`;
            for (let s in item.baseStats) {
                let curVal = getUpgradedStat(item.baseStats[s], curLvl);
                if (isMaxed) {
                    statsPreviewHtml += `<div style="display: flex; justify-content: space-between; margin-bottom: 3px;"><span>${s.toUpperCase()}:</span> <span style="color: #ffd700; font-weight: bold;">${curVal} (MAX)</span></div>`;
                } else {
                    let nextVal = getUpgradedStat(item.baseStats[s], nextLvl);
                    let diff = nextVal - curVal;
                    statsPreviewHtml += `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                            <span>${s.toUpperCase()}:</span>
                            <span><b>${curVal}</b> <span style="color: #aaa;">&rarr;</span> <b style="color: #55ff55;">${nextVal}</b> <span style="color: #38bdf8; font-size: 11px;">(+${diff})</span></span>
                        </div>
                    `;
                }
            }
            statsPreviewHtml += `</div>`;
        }

        let costHtml = '';
        if (!isMaxed && cost) {
            costHtml = `
                <div style="font-size: 12px; margin: 10px 0; background: rgba(0,0,0,0.3); border-radius: 4px; padding: 8px;">
                    <div style="font-weight: bold; color: #fb923c; margin-bottom: 6px;">Upgrade Requirements:</div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="display: flex; justify-content: space-between; color: ${pGold >= cost.gold ? '#55ff55' : '#ff5555'};">
                            <span>💰 Gold:</span> <span>${pGold} / ${cost.gold}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: ${pScrap >= cost.scrap ? '#55ff55' : '#ff5555'};">
                            <span>🔨 Iron Scraps:</span> <span>${pScrap} / ${cost.scrap}</span>
                        </div>
                        ${cost.dust ? `
                        <div style="display: flex; justify-content: space-between; color: ${pDust >= cost.dust ? '#55ff55' : '#ff5555'};">
                            <span>✨ Arcane Dust:</span> <span>${pDust} / ${cost.dust}</span>
                        </div>` : ''}
                        ${cost.shard ? `
                        <div style="display: flex; justify-content: space-between; color: ${pShard >= cost.shard ? '#55ff55' : '#ff5555'};">
                            <span>🔮 Void Shards:</span> <span>${pShard} / ${cost.shard}</span>
                        </div>` : ''}
                    </div>
                </div>
            `;
        }

        let actionBtn = isMaxed
            ? `<button class="btn" disabled style="width: 100%; padding: 10px; font-weight: bold; color: #ffd700;">★ Max Level (+5) Reached</button>`
            : `<button class="btn" style="width: 100%; padding: 10px; font-weight: bold; color: #fb923c; border-color: #fb923c;" ${!canAfford ? 'disabled' : ''} onclick="upgradeEquipment('${currentObj.id}')">⚒️ Upgrade to +${nextLvl}</button>`;

        let previewHtml = `
            <div style="flex: 1.2; background: rgba(20, 20, 26, 0.9); border: 1px solid #444; border-radius: 6px; padding: 14px;">
                <div style="border-bottom: 1px solid #444; padding-bottom: 8px; margin-bottom: 8px;">
                    <div style="font-size: 11px; color: ${currentObj.isEquipped ? '#55ff55' : '#aaa'}; font-weight: bold;">${currentObj.label}</div>
                    <div style="font-size: 16px; font-weight: bold; color: ${rColor};">${item.name}</div>
                    <div style="font-size: 11px; color: #aaa;">Current Rank: <b style="color: #fb923c;">${curLvl > 0 ? '+' + curLvl : 'Base (+0)'}</b> • Rarity: <b style="color: ${rColor};">${item.rarity}</b></div>
                </div>
                ${statsPreviewHtml}
                ${costHtml}
                ${actionBtn}
            </div>
        `;

        return `<div style="display: flex; gap: 14px; align-items: flex-start;">${listHtml}${previewHtml}</div>`;
    }

    function renderReforgeTabHtml() {
        let eligibleItems = [];
        const slots = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'accessory'];
        for (let s of slots) {
            let eq = player.equipment && player.equipment[s];
            if (eq && typeof eq === 'object' && ['Rare', 'Epic', 'Legendary', 'Mythic'].includes(eq.rarity) && eq.affixes && eq.affixes.length > 0) {
                eligibleItems.push({
                    id: s,
                    rawItem: eq,
                    label: `[EQUIPPED: ${s.toUpperCase()}]`,
                    isEquipped: true
                });
            }
        }
        if (player.inventory && player.inventory.equipment) {
            for (let eq of player.inventory.equipment) {
                if (['Rare', 'Epic', 'Legendary', 'Mythic'].includes(eq.rarity) && eq.affixes && eq.affixes.length > 0) {
                    eligibleItems.push({
                        id: eq.id,
                        rawItem: eq,
                        label: `[INVENTORY: ${eq.type.toUpperCase()}]`,
                        isEquipped: false
                    });
                }
            }
        }

        if (eligibleItems.length === 0) {
            return `<div style="text-align: center; color: #888; padding: 30px;">No Rare, Epic, Legendary, or Mythic equipment available for affix reforging.</div>`;
        }

        if (!selectedReforgeId || !eligibleItems.some(a => a.id === selectedReforgeId)) {
            selectedReforgeId = eligibleItems[0].id;
            selectedReforgeAffixIndex = 0;
        }

        let currentObj = eligibleItems.find(a => a.id === selectedReforgeId) || eligibleItems[0];
        let item = currentObj.rawItem;
        let rColor = (RARITY_TIERS[item.rarity] && RARITY_TIERS[item.rarity].color) || '#fff';
        let cost = REFORGE_COSTS[item.rarity] || REFORGE_COSTS['Rare'];

        let pGold = player.gold || 0;
        let pDust = (player.materials && player.materials.dust) || 0;
        let pShard = (player.materials && player.materials.shard) || 0;

        let canAfford = (pGold >= cost.gold) && (pDust >= cost.dust) && (pShard >= cost.shard);

        // Left Column: Items
        let listHtml = `<div style="flex: 1; max-height: 380px; overflow-y: auto; padding-right: 6px;">`;
        for (let entry of eligibleItems) {
            let eq = entry.rawItem;
            let col = (RARITY_TIERS[eq.rarity] && RARITY_TIERS[eq.rarity].color) || '#fff';
            let isSelected = entry.id === selectedReforgeId;
            listHtml += `
                <div class="forge-card ${isSelected ? 'selected' : ''}" onclick="selectReforgeTarget('${entry.id}')">
                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <span style="font-size: 10px; color: ${entry.isEquipped ? '#55ff55' : '#aaa'}; display: block;">${entry.label}</span>
                        <span style="font-size: 13px; font-weight: bold; color: ${col};">${eq.name}</span>
                    </div>
                    <span style="font-size: 10px; padding: 2px 6px; border-radius: 3px; background: rgba(255,255,255,0.08); color: ${col};">${eq.rarity}</span>
                </div>
            `;
        }
        listHtml += `</div>`;

        // Right Column: Affixes Selector & Cost
        let affixesHtml = `<div style="margin: 12px 0;">`;
        affixesHtml += `<div style="font-size: 12px; font-weight: bold; color: #38bdf8; margin-bottom: 6px;">Select an Affix to Reroll:</div>`;

        item.affixes.forEach((a, idx) => {
            let isSel = idx === selectedReforgeAffixIndex;
            affixesHtml += `
                <div class="forge-affix-row ${isSel ? 'selected' : ''}" onclick="selectReforgeAffix(${idx})">
                    <div>
                        <b style="color: ${isSel ? '#fb923c' : '#e2e8f0'}; font-size: 13px;">${a.name}</b>
                        <span style="font-size: 12px; color: #60a5fa; margin-left: 6px;">(${a.desc})</span>
                    </div>
                    <span style="font-size: 12px; color: ${isSel ? '#fb923c' : '#888'}; font-weight: bold;">
                        ${isSel ? '● Selected' : '○'}
                    </span>
                </div>
            `;
        });
        affixesHtml += `</div>`;

        let costHtml = `
            <div style="font-size: 12px; margin: 10px 0; background: rgba(0,0,0,0.3); border-radius: 4px; padding: 8px;">
                <div style="font-weight: bold; color: #fb923c; margin-bottom: 6px;">Reforge Cost (${item.rarity}):</div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; color: ${pGold >= cost.gold ? '#55ff55' : '#ff5555'};">
                        <span>💰 Gold:</span> <span>${pGold} / ${cost.gold}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; color: ${pDust >= cost.dust ? '#55ff55' : '#ff5555'};">
                        <span>✨ Arcane Dust:</span> <span>${pDust} / ${cost.dust}</span>
                    </div>
                    ${cost.shard ? `
                    <div style="display: flex; justify-content: space-between; color: ${pShard >= cost.shard ? '#55ff55' : '#ff5555'};">
                        <span>🔮 Void Shards:</span> <span>${pShard} / ${cost.shard}</span>
                    </div>` : ''}
                </div>
            </div>
        `;

        let actionBtn = `
            <button class="btn" style="width: 100%; padding: 10px; font-weight: bold; color: #38bdf8; border-color: #38bdf8;" ${!canAfford ? 'disabled' : ''} onclick="reforgeAffix('${currentObj.id}', ${selectedReforgeAffixIndex})">
                🌀 Reforge Selected Affix
            </button>
        `;

        let previewHtml = `
            <div style="flex: 1.2; background: rgba(20, 20, 26, 0.9); border: 1px solid #444; border-radius: 6px; padding: 14px;">
                <div style="border-bottom: 1px solid #444; padding-bottom: 8px; margin-bottom: 8px;">
                    <div style="font-size: 11px; color: ${currentObj.isEquipped ? '#55ff55' : '#aaa'}; font-weight: bold;">${currentObj.label}</div>
                    <div style="font-size: 16px; font-weight: bold; color: ${rColor};">${item.name}</div>
                    <div style="font-size: 11px; color: #aaa;">Rarity: <b style="color: ${rColor};">${item.rarity}</b> • Affixes: ${item.affixes.length}</div>
                </div>
                ${affixesHtml}
                ${costHtml}
                ${actionBtn}
            </div>
        `;

        return `<div style="display: flex; gap: 14px; align-items: flex-start;">${listHtml}${previewHtml}</div>`;
    }

    function renderSalvageTabHtml() {
        let unequipped = (player.inventory && player.inventory.equipment) ? player.inventory.equipment : [];
        let bulkCount = unequipped.filter(i => i.rarity === 'Common' || i.rarity === 'Uncommon').length;

        let topBar = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px 12px; background: rgba(30,30,40,0.6); border-radius: 6px; border: 1px solid #444;">
                <div>
                    <span style="font-weight: bold; font-size: 13px; color: #e2e8f0;">Quick Dismantle:</span>
                    <span style="font-size: 12px; color: #aaa; margin-left: 6px;">${bulkCount} Common/Uncommon items</span>
                </div>
                <button class="btn" style="padding: 6px 14px; font-size: 12px; color: #fb923c; border-color: #fb923c;" ${bulkCount === 0 ? 'disabled' : ''} onclick="salvageAllCommonUncommon()">
                    ♻️ Salvage All Common & Uncommon
                </button>
            </div>
        `;

        if (unequipped.length === 0) {
            return topBar + `<div style="text-align: center; color: #888; padding: 30px;">No unequipped items in inventory to salvage.</div>`;
        }

        let listHtml = `<div style="max-height: 350px; overflow-y: auto; padding-right: 6px;">`;
        for (let item of unequipped) {
            let rarity = item.rarity || 'Common';
            let rates = SALVAGE_RATES[rarity] || SALVAGE_RATES['Common'];
            let rColor = (RARITY_TIERS[rarity] && RARITY_TIERS[rarity].color) || '#fff';

            let yieldParts = [];
            if (rates.scrap) yieldParts.push(`🔨 ${rates.scrap} Scraps`);
            if (rates.dust) yieldParts.push(`✨ ${rates.dust} Dust`);
            if (rates.shard) yieldParts.push(`🔮 ${rates.shard} Shards`);
            if (rates.gold) yieldParts.push(`💰 ${rates.gold} Gold`);

            listHtml += `
                <div class="forge-card" style="cursor: default;">
                    <div>
                        <div style="font-size: 13px; font-weight: bold; color: ${rColor};">${item.name}</div>
                        <div style="font-size: 11px; color: #aaa; margin-top: 2px;">
                            <span style="color: ${rColor}; font-weight: bold;">${rarity}</span> • ${item.type.toUpperCase()} | Yields: <b style="color: #cbd5e1;">${yieldParts.join(', ')}</b>
                        </div>
                    </div>
                    <button class="btn" style="padding: 4px 12px; font-size: 12px; color: #ef4444; border-color: #ef4444;" onclick="salvageItem('${item.id}')">
                        Dismantle
                    </button>
                </div>
            `;
        }
        listHtml += `</div>`;

        return topBar + listHtml;
    }

    function renderBlacksmith() {
        const container = document.getElementById('blacksmith-content');
        if (!container) return;

        if (!player.materials) player.materials = { scrap: 0, dust: 0, shard: 0 };

        // 1. Materials Bar
        let materialsHtml = `
            <div class="forge-materials-bar">
                <div class="forge-mat-item" style="color: #cbd5e1;">🔨 Scraps: <span style="color: #fff;">${player.materials.scrap || 0}</span></div>
                <div class="forge-mat-item" style="color: #38bdf8;">✨ Dust: <span style="color: #fff;">${player.materials.dust || 0}</span></div>
                <div class="forge-mat-item" style="color: #c084fc;">🔮 Shards: <span style="color: #fff;">${player.materials.shard || 0}</span></div>
                <div class="forge-mat-item" style="color: #ffd700;">💰 Gold: <span style="color: #fff;">${player.gold || 0}</span></div>
            </div>
        `;

        // 2. Navigation Tabs
        let tabsHtml = `
            <div class="forge-nav-tabs">
                <button class="forge-tab-btn ${blacksmithActiveTab === 'upgrade' ? 'active' : ''}" onclick="setBlacksmithTab('upgrade')">⚒️ Upgrade Forge (+1 to +5)</button>
                <button class="forge-tab-btn ${blacksmithActiveTab === 'reforge' ? 'active' : ''}" onclick="setBlacksmithTab('reforge')">🌀 Affix Reforger</button>
                <button class="forge-tab-btn ${blacksmithActiveTab === 'salvage' ? 'active' : ''}" onclick="setBlacksmithTab('salvage')">♻️ Salvage Station</button>
            </div>
        `;

        let tabBodyHtml = '';
        if (blacksmithActiveTab === 'upgrade') {
            tabBodyHtml = renderUpgradeTabHtml();
        } else if (blacksmithActiveTab === 'reforge') {
            tabBodyHtml = renderReforgeTabHtml();
        } else if (blacksmithActiveTab === 'salvage') {
            tabBodyHtml = renderSalvageTabHtml();
        }

        container.innerHTML = materialsHtml + tabsHtml + tabBodyHtml;
    }


    /* =========================================================================
       STATUS EFFECTS & TACTICAL COMBAT ENGINE
       ========================================================================= */

    function getPlayerCombatEntity() {
        if (!battleState.playerEntity) {
            battleState.playerEntity = {
                id: 'battle-player',
                name: 'Hero',
                element: player.element || ELEMENTS.Physical,
                get hp() { return pStats.hp; },
                set hp(val) {
                    player.baseStats.hp = Math.max(0, Math.min(pStats.maxHp, val));
                    pStats.hp = player.baseStats.hp;
                },
                get maxHp() { return pStats.maxHp; },
                get atk() {
                    let mult = hasStatus(this, 'berserk') ? 1.4 : 1.0;
                    return Math.floor(pStats.atk * mult);
                },
                get def() {
                    let mult = 1.0;
                    if (hasStatus(this, 'armor_break')) mult *= 0.7;
                    if (hasStatus(this, 'berserk')) mult *= 0.75;
                    return Math.max(0, Math.floor(pStats.def * mult));
                },
                get mdef() { return pStats.mdef; },
                get spd() {
                    let mult = 1.0;
                    if (hasStatus(this, 'haste')) mult *= 1.3;
                    if (hasStatus(this, 'slow')) mult *= 0.7;
                    return Math.max(1, Math.floor(pStats.spd * mult));
                },
                isPlayer: true,
                isBoss: false,
                statuses: battleState.playerStatuses || {}
            };
        }
        return battleState.playerEntity;
    }

    function hasStatus(target, statusId) {
        if (!target) return false;
        let stMap = target.statuses || (target.isPlayer && battleState.playerStatuses);
        return !!(stMap && stMap[statusId] && stMap[statusId].duration > 0);
    }

    function removeStatus(target, statusId) {
        if (!target) return;
        let stMap = target.statuses || (target.isPlayer && battleState.playerStatuses);
        if (stMap && stMap[statusId]) {
            delete stMap[statusId];
            renderBattlefield();
        }
    }

    function applyStatus(target, statusId, duration = 3, value = 0, source = 'player') {
        if (!target) return;
        const def = STATUS_TYPES_DB[statusId];
        if (!def) return;

        let isPlayer = (target === 'player' || target.isPlayer || target.id === 'battle-player' || target === player);
        let ent = isPlayer ? getPlayerCombatEntity() : target;
        if (!ent.statuses) ent.statuses = {};

        // Boss Crowd Control Immunity Check
        if (ent.isBoss && (statusId === 'stun' || statusId === 'freeze')) {
            logMsg(`${ent.name} resisted the disable!`, "#ffd700");
            floatText(ent.id, "RESISTED", "#ffd700");
            applyStatus(ent, 'slow', 2, 0, source);
            return;
        }

        if (ent.statuses[statusId] && def.maxStacks) {
            let current = ent.statuses[statusId];
            current.stacks = Math.min(def.maxStacks, (current.stacks || 1) + 1);
            current.duration = Math.max(current.duration, duration);
            if (value) current.value = value;
            logMsg(`${ent.name}'s ${def.icon} ${def.name} increased to ${current.stacks} stacks!`, def.color);
        } else {
            ent.statuses[statusId] = {
                id: statusId,
                name: def.name,
                icon: def.icon,
                duration: duration,
                value: value,
                stacks: 1,
                source: source,
                color: def.color
            };
            logMsg(`${ent.name} afflicted with ${def.icon} ${def.name} (${duration}t)!`, def.color);
        }

        floatText(ent.id || 'battle-player', `${def.icon} ${def.name}`, def.color);
        renderBattlefield();
    }

    function processStatusesStartTurn(entity) {
        if (!entity || !entity.statuses) return false;

        // 1. Evaluate DoTs
        let dotMultiplier = (!entity.isPlayer && playerHasPassive('calamity_conduit')) ? 2 : 1;
        let totalEnemyDotDmg = 0;

        // A. Burn
        if (hasStatus(entity, 'burn')) {
            let dmg = Math.max(1, Math.floor(entity.maxHp * 0.05)) * dotMultiplier;
            entity.hp = Math.max(0, entity.hp - dmg);
            if (!entity.isPlayer) totalEnemyDotDmg += dmg;
            logMsg(`${entity.name} takes ${dmg} burn damage!`, "#ff4500");
            floatText(entity.id, `-${dmg} Burn`, "#ff4500");
            animateAction(entity.id, 'anim-shake');
        }

        // B. Poison (True Damage)
        if (hasStatus(entity, 'poison')) {
            let stacks = entity.statuses.poison.stacks || 1;
            let dmg = (Math.max(2, Math.floor(entity.maxHp * 0.02 * stacks) + (stacks * 2))) * dotMultiplier;
            entity.hp = Math.max(0, entity.hp - dmg);
            if (!entity.isPlayer) totalEnemyDotDmg += dmg;
            logMsg(`${entity.name} takes ${dmg} poison damage (${stacks}x)!`, "#22c55e");
            floatText(entity.id, `-${dmg} Poison`, "#22c55e");
            animateAction(entity.id, 'anim-shake');
        }

        // C. Decay
        if (hasStatus(entity, 'decay')) {
            let dmg = (Math.max(2, Math.floor(entity.maxHp * 0.04) + 3)) * dotMultiplier;
            entity.hp = Math.max(0, entity.hp - dmg);
            if (!entity.isPlayer) totalEnemyDotDmg += dmg;
            logMsg(`${entity.name} suffers ${dmg} decay damage!`, "#a855f7");
            floatText(entity.id, `-${dmg} Decay`, "#a855f7");
            animateAction(entity.id, 'anim-shake');
        }

        // Soul Siphon DoT Leech Check
        if (!entity.isPlayer && playerHasPassive('soul_siphon') && totalEnemyDotDmg > 0) {
            let leech = Math.max(1, Math.floor(totalEnemyDotDmg * 0.20));
            player.baseStats.hp = Math.min(pStats.maxHp, player.baseStats.hp + leech);
            pStats.hp = player.baseStats.hp;
            logMsg(`🔮 Soul Siphon leeches ${leech} HP from active DoTs!`, "#a855f7");
            floatText('battle-player', `+${leech} HP`, "#a855f7");
        }

        // D. Berserk Self-Damage
        if (hasStatus(entity, 'berserk')) {
            let dmg = Math.max(1, Math.floor(entity.maxHp * 0.05));
            entity.hp = Math.max(0, entity.hp - dmg);
            logMsg(`${entity.name} suffers ${dmg} berserk backlash!`, "#dc2626");
            floatText(entity.id, `-${dmg}`, "#dc2626");
        }

        renderBattlefield();

        // Check if entity died from start-of-turn DoTs
        if (entity.hp <= 0) {
            if (entity.isPlayer) {
                loseBattle();
                return true;
            } else {
                logMsg(`${entity.name} succumbed to status ailments!`, "#ff8888");
                if(!player.questStats) player.questStats = { enemiesDefeated: 0, battlesWon: 0, bossesDefeated: 0 };
                player.questStats.enemiesDefeated = (player.questStats.enemiesDefeated || 0) + 1;
                if(entity.isBoss) {
                    player.questStats.bossesDefeated = (player.questStats.bossesDefeated || 0) + 1;
                    if(typeof checkAchievements === 'function') checkAchievements();
                }
                renderBattlefield();
                setCombatTimeout(processNextTurn, 1000);
                return true;
            }
        }

        // 2. Check Disables (Stun & Freeze)
        if (hasStatus(entity, 'stun') || hasStatus(entity, 'freeze')) {
            let disName = hasStatus(entity, 'freeze') ? 'Frozen' : 'Stunned';
            logMsg(`${entity.name} is ${disName} and cannot move!`, "#38bdf8");
            floatText(entity.id, `${disName}!`, "#38bdf8");

            if (entity.statuses.stun) {
                entity.statuses.stun.duration--;
                if (entity.statuses.stun.duration <= 0) {
                    delete entity.statuses.stun;
                    logMsg(`${entity.name} recovered from Stun.`, "#ffd700");
                }
            }
            if (entity.statuses.freeze) {
                entity.statuses.freeze.duration--;
                if (entity.statuses.freeze.duration <= 0) {
                    delete entity.statuses.freeze;
                    logMsg(`${entity.name} thawed out from Freeze.`, "#38bdf8");
                }
            }

            renderBattlefield();
            setCombatTimeout(processNextTurn, 1000);
            return true; // Turn was skipped
        }

        return false;
    }

    function processStatusesEndTurn(entity) {
        if (!entity || !entity.statuses) return;

        // 1. Regeneration
        if (hasStatus(entity, 'regeneration')) {
            let heal = Math.max(2, Math.floor(entity.maxHp * 0.05));
            if (hasStatus(entity, 'burn')) {
                heal = Math.max(1, Math.floor(heal * 0.7));
            }
            let decayDmg = 0;
            if (hasStatus(entity, 'decay')) {
                decayDmg = Math.floor(heal * 0.25);
                heal = Math.max(0, heal - decayDmg);
                logMsg(`${entity.name}'s Decay corrupted healing into ${decayDmg} damage!`, "#a855f7");
            }
            entity.hp = Math.min(entity.maxHp, entity.hp + heal - decayDmg);
            logMsg(`${entity.name} regenerated ${heal} HP.`, "#4ade80");
            floatText(entity.id, `+${heal}`, "#4ade80");
        }

        // 2. Decrement Duration on all statuses
        for (let sId in entity.statuses) {
            let s = entity.statuses[sId];
            if (s) {
                s.duration--;
                if (s.duration <= 0) {
                    logMsg(`${entity.name}'s ${s.name} expired.`, "#888888");
                    delete entity.statuses[sId];
                    if (sId === 'armor_break' && entity.originalDef !== undefined) {
                        entity.def = entity.originalDef;
                        delete entity.originalDef;
                        delete entity.armorBreakTurns;
                    }
                }
            }
        }

        renderBattlefield();
    }

    function renderStatusBadges(statuses) {
        if (!statuses) return '';
        let html = '';
        for (let sId in statuses) {
            let s = statuses[sId];
            if (!s || s.duration <= 0) continue;
            let label = `${s.icon} ${s.name}`;
            if (s.id === 'divine_barrier') {
                label = `${s.icon} ${s.value}`;
            } else if (s.stacks && s.stacks > 1) {
                label = `${s.icon} ${s.name} x${s.stacks} (${s.duration}t)`;
            } else {
                label = `${s.icon} ${s.name} (${s.duration}t)`;
            }
            html += `<span class="status-badge" style="border-color: ${s.color}; color: ${s.color};">${label}</span>`;
        }
        return html;
    }

    /* =========================================================================
       MULTI-ZONE BATTLE PREP UI
       ========================================================================= */

    function selectBattleArea(areaId) {
        if(!player) return;
        if(!player.unlockedAreas) player.unlockedAreas = ['area_1'];
        if(player.unlockedAreas.includes(areaId)) {
            player.selectedArea = areaId;
            renderBattlePrep();
        }
    }

    function renderBattlePrep() {
        const container = document.getElementById('battle-prep-content');
        if(!container) return;

        if(!player.unlockedAreas || !Array.isArray(player.unlockedAreas)) {
            player.unlockedAreas = ['area_1'];
        }
        if(!player.selectedArea || !player.unlockedAreas.includes(player.selectedArea)) {
            player.selectedArea = player.unlockedAreas[player.unlockedAreas.length - 1] || 'area_1';
        }

        let currentArea = AREAS_DB[player.selectedArea] || AREAS_DB['area_1'];

        // Step 1: Area Cards Grid
        let areasHtml = `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 14px; font-weight: bold; color: #ffd700; margin-bottom: 8px; border-bottom: 1px solid #444; padding-bottom: 4px;">
                    Step 1: Choose Exploration Zone
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px;">
        `;

        for(let aId in AREAS_DB) {
            let a = AREAS_DB[aId];
            let isUnlocked = player.unlockedAreas.includes(aId);
            let isSelected = player.selectedArea === aId;

            let cardClass = 'zone-card';
            let cardStyle = '';
            let statusText = '';

            if(isUnlocked) {
                if(isSelected) {
                    cardClass += ' zone-selected';
                    cardStyle = `border: 2px solid ${a.themeColor}; box-shadow: 0 0 10px ${a.themeColor}66;`;
                    statusText = `<span style="color:${a.themeColor}; font-weight:bold; font-size:11px;">● Active Zone</span>`;
                } else {
                    cardStyle = `border: 1px solid #555;`;
                    statusText = `<span style="color:#22c55e; font-size:10px;">Unlocked</span>`;
                }
            } else {
                cardClass += ' zone-locked';
                statusText = `<span style="color:#ef4444; font-size:10px;">🔒 Locked</span>`;
            }

            areasHtml += `
                <div class="${cardClass}" style="${cardStyle}" onclick="selectBattleArea('${aId}')">
                    <div style="font-weight: bold; font-size: 12px; color: ${isUnlocked ? a.themeColor : '#888'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${a.name}</div>
                    <div style="font-size: 10px; color: #aaa;">${a.bracket}</div>
                    <div style="font-size: 10px; color: #cbd5e1;">Elem: <b>${a.element}</b></div>
                    <div style="margin-top: 2px;">${statusText}</div>
                </div>
            `;
        }
        areasHtml += `</div></div>`;

        // Step 2: Battle Mode Selection
        let modeHtml = `
            <div>
                <div style="font-size: 14px; font-weight: bold; color: #38bdf8; margin-bottom: 8px; border-bottom: 1px solid #444; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <span>Step 2: Choose Battle Encounter</span>
                    <span style="font-size: 12px; font-weight: normal; color: ${currentArea.themeColor};">${currentArea.name} (${currentArea.bracket})</span>
                </div>
                <div style="font-size: 12px; color: #aaa; margin-bottom: 10px; font-style: italic;">
                    ${currentArea.desc}
                </div>

                <div style="font-size: 13px; font-weight: bold; color: #e2e8f0; margin-bottom: 6px;">Hunt Regular Enemies:</div>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px;">
                    <button class="btn difficulty-btn" onclick="startBattle(1, false)"><span>1 Monster (Easy)</span> <span>1.0x EXP/Gold</span></button>
                    <button class="btn difficulty-btn" onclick="startBattle(2, false)"><span>2 Monsters (Moderate)</span> <span>1.5x EXP/Gold</span></button>
                    <button class="btn difficulty-btn" onclick="startBattle(3, false)"><span>3 Monsters (Challenging)</span> <span>2.2x EXP/Gold</span></button>
                    <button class="btn difficulty-btn" onclick="startBattle(4, false)"><span>4 Monsters (Hard)</span> <span>3.0x EXP/Gold</span></button>
                    <button class="btn difficulty-btn" onclick="startBattle(5, false)"><span>5 Monsters (Nightmare)</span> <span>4.0x EXP/Gold</span></button>
                </div>

                <div style="font-size: 13px; font-weight: bold; color: #e2e8f0; margin-bottom: 6px;">Zone Gatekeeper Encounter:</div>
                <button class="btn" style="width: 100%; padding: 10px 14px; border: 2px solid #ffd700; color: #ffd700; font-weight: bold; font-size: 13px; background: rgba(255, 215, 0, 0.08); display: flex; justify-content: space-between; align-items: center;" onclick="startBattle(1, true)">
                    <span>⚔️ Challenge Gatekeeper Boss: <b>${currentArea.boss.name}</b></span>
                    <span style="font-size: 12px; color: #ffd700;">Lv ${currentArea.boss.level} • ${currentArea.boss.element}</span>
                </button>
            </div>
        `;

        container.innerHTML = areasHtml + modeHtml;
    }

    function openModal(id) {
        document.getElementById('main-overlay').classList.add('active');
        document.getElementById(id).classList.add('active');
        if(id === 'modal-stats') renderStats();
        if(id === 'modal-inventory') renderInventory();
        if(id === 'modal-shop') renderShop();
        if(id === 'modal-skilltree') renderSkillTree();
        if(id === 'modal-quests') renderQuests();
        if(id === 'modal-achievements') renderAchievements();
        if(id === 'modal-battle-prep') renderBattlePrep();
        if(id === 'modal-blacksmith') renderBlacksmith();
        if(id === 'modal-class-advancement') renderClassAdvancement();
    }
    function closeAllModals() {
        document.querySelectorAll('.modal, .overlay').forEach(el => el.classList.remove('active'));
        computeStats();
        updateHeader();
    }

    /* =========================================================================
       TOWN & PROGRESSION
       ========================================================================= */

    function newGame() {
        if (typeof clearAllCombatTimers === 'function') clearAllCombatTimers();
        player = {
            baseStats: { hp: 100, maxHp: 100, mp: 50, maxMp: 50, atk: 7, def: 7, matk: 10, mdef: 10, spd: 15, crit: 5 },
            level: 1, exp: 0, gold: 100,
            equipment: {
                weapon: generateItem('Wooden Sword', 'Common'),
                helmet: null,
                armor: generateItem('Cloth Armor', 'Common'),
                gloves: null,
                boots: null,
                accessory: null
            },
            inventory: createInventory({ 'Potion': 3, 'Ether': 1 }, []),
            skills: ['Fireball', 'Heal'],
            skillOrbs: 0,
            skillTree: {
                atkTraining: 0, critTraining: 0, powerStrike: 0, armorBreak: 0, combatMastery: 0,
                vitalityTraining: 0, spiritTraining: 0, recovery: 0, manaEfficiency: 0, regeneration: 0,
                defTraining: 0, fortune: 0, treasureSense: 0
            },
            activeTitle: 'Novice',
            currentClass: 'novice',
            unlockedAreas: ['area_1'],
            selectedArea: 'area_1',
            materials: { scrap: 0, dust: 0, shard: 0 },
            quests: {},
            questStats: { enemiesDefeated: 0, battlesWon: 0, bossesDefeated: 0 },
            achievements: {}
        };
        init();
        switchScreen('town');
    }
    function saveGame() {
        if(typeof battleState !== 'undefined' && battleState.active) {
            showToast("Cannot Save", "Cannot save during battle!", "save");
            return;
        }
        localStorage.setItem('er_save', JSON.stringify(player));
        showToast('Game Saved', 'Game progress saved successfully.', 'save');
    }

    function loadGame() {
        if(typeof battleState !== 'undefined' && battleState.active) {
            showToast("Cannot Load", "Cannot load during battle!", "save");
            return;
        }
        if (typeof clearAllCombatTimers === 'function') clearAllCombatTimers();
        const data = localStorage.getItem('er_save');
        if(data) {
            player = JSON.parse(data);
            
            if(typeof player.skillOrbs === 'undefined') player.skillOrbs = 0;
            if(typeof player.skillTree === 'undefined') {
                player.skillTree = {
                    atkTraining: 0, critTraining: 0, powerStrike: 0, armorBreak: 0, combatMastery: 0,
                    vitalityTraining: 0, spiritTraining: 0, recovery: 0, manaEfficiency: 0, regeneration: 0,
                    defTraining: 0, fortune: 0, treasureSense: 0
                };
            }
            if(typeof player.activeTitle === 'undefined') player.activeTitle = 'Novice';
            if(typeof player.quests === 'undefined') player.quests = {};
            if(typeof player.questStats === 'undefined') {
                player.questStats = { enemiesDefeated: 0, battlesWon: 0, bossesDefeated: 0 };
            } else {
                if(typeof player.questStats.battlesWon === 'undefined') player.questStats.battlesWon = 0;
                if(typeof player.questStats.bossesDefeated === 'undefined') player.questStats.bossesDefeated = 0;
            }
            if(typeof player.achievements === 'undefined') player.achievements = {};
            
            // Materials Initialization & Fallback
            if(!player.materials) {
                player.materials = { scrap: 0, dust: 0, shard: 0 };
            } else {
                if(typeof player.materials.scrap === 'undefined') player.materials.scrap = 0;
                if(typeof player.materials.dust === 'undefined') player.materials.dust = 0;
                if(typeof player.materials.shard === 'undefined') player.materials.shard = 0;
            }
            
            // Area Progression Initialization & Retroactive Unlocks
            if(!player.unlockedAreas || !Array.isArray(player.unlockedAreas)) {
                player.unlockedAreas = ['area_1'];
            }
            if(player.level >= 6 && !player.unlockedAreas.includes('area_2')) player.unlockedAreas.push('area_2');
            if(player.level >= 11 && !player.unlockedAreas.includes('area_3')) player.unlockedAreas.push('area_3');
            if(player.level >= 16 && !player.unlockedAreas.includes('area_4')) player.unlockedAreas.push('area_4');
            if(player.level >= 21 && !player.unlockedAreas.includes('area_5')) player.unlockedAreas.push('area_5');

            if(!player.selectedArea || !player.unlockedAreas.includes(player.selectedArea)) {
                player.selectedArea = player.unlockedAreas[player.unlockedAreas.length - 1] || 'area_1';
            }
            
            // Class Advancement Initialization & Retroactive Qualification
            if(!player.currentClass) {
                player.currentClass = 'novice';
            }
            if(player.level >= 10 && player.currentClass === 'novice') {
                setTimeout(() => {
                    showToast('Class Evolution Ready!', 'Visit the Class Sanctum in Town to choose your path!', 'level', 6000);
                }, 800);
            }

            // Equipment 6-Slot Migration
            if(!player.equipment) {
                player.equipment = { weapon: null, helmet: null, armor: null, gloves: null, boots: null, accessory: null };
            } else {
                const allSlots = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'accessory'];
                for(let slot of allSlots) {
                    if(player.equipment[slot] === undefined) {
                        player.equipment[slot] = null;
                    } else if(typeof player.equipment[slot] === 'string') {
                        player.equipment[slot] = generateItem(player.equipment[slot], 'Common');
                    }
                }
            }

            // Inventory Migration
            if(!player.inventory) {
                player.inventory = createInventory();
            } else if(player.inventory.consumables || player.inventory.equipment) {
                player.inventory = createInventory(player.inventory.consumables || {}, player.inventory.equipment || []);
            } else {
                let newCons = {};
                let newEq = [];
                for(let k in player.inventory) {
                    let val = player.inventory[k];
                    if(typeof val === 'number' && val > 0) {
                        if(ITEMS_DB[k] && ITEMS_DB[k].type !== 'consumable') {
                            for(let i = 0; i < val; i++) {
                                newEq.push(generateItem(k, 'Common'));
                            }
                        } else {
                            newCons[k] = val;
                        }
                    }
                }
                player.inventory = createInventory(newCons, newEq);
            }

            init();
            renderStats();
            renderInventory();
            renderShop();
            renderQuests();
            renderAchievements();
            switchScreen('town');
            showToast('Game Loaded', 'Game loaded successfully.', 'save');
        }
    }
    function healInTown() {
        if(player.gold >= 20) {
            player.gold -= 20;
            player.baseStats.hp = pStats.maxHp;
            player.baseStats.mp = pStats.maxMp;
            init();
            showToast("Inn Rest", "Rested at the Inn. HP and MP restored.", "info");
        } else {
            showToast("Inn", "Not enough gold to rest at the Inn!", "info");
        }
    }

    function checkLevelUp() {
        let leveledUp = false;
        let totalOrbsGained = 0;
        let levelsGained = 0;
        
        while(player.exp >= player.level * 40) {
            player.exp -= player.level * 40;
            player.level++;
            levelsGained++;
            totalOrbsGained += 3;
            leveledUp = true;
            
            // Apply permanent core stat increases directly to the base
            player.baseStats.maxHp += 15;
            player.baseStats.maxMp += 5;
            player.baseStats.atk += 2;
            player.baseStats.def += 1;
            
            // Increment current HP/MP safely to avoid healing to full or exceeding max
            player.baseStats.hp += 15;
            player.baseStats.mp += 5;
            
            // Original magic skill unlocks kept to supplement the Skill Tree
            if(player.level === 3 && !player.skills.includes('Cleave')) player.skills.push('Cleave');
            if(player.level === 5 && !player.skills.includes('Water Splash')) player.skills.push('Water Splash');
            if(player.level === 7 && !player.skills.includes('Wind Blade')) player.skills.push('Wind Blade');
        }
        
        if (leveledUp) {
            player.skillOrbs += totalOrbsGained;
            computeStats();
            
            // Enforce hard clamp safely just in case
            player.baseStats.hp = Math.min(player.baseStats.hp, pStats.maxHp);
            player.baseStats.mp = Math.min(player.baseStats.mp, pStats.maxMp);
            pStats.hp = player.baseStats.hp;
            pStats.mp = player.baseStats.mp;
            
            updateHeader();
            
            let statMsg = `+${levelsGained * 15} Max HP, +${levelsGained * 5} Max MP, +${levelsGained * 2} ATK, +${levelsGained * 1} DEF`;
            showToast('Level Up!', `You reached Level ${player.level}! (${statMsg}, +${totalOrbsGained} Skill Orbs)`, 'level', 4500);

            let prevLevel = player.level - levelsGained;
            if ((prevLevel < 10 && player.level >= 10) || (prevLevel < 25 && player.level >= 25) || (prevLevel < 50 && player.level >= 50)) {
                setTimeout(() => {
                    showToast('Class Evolution Ready!', 'Visit the Class Sanctum in Town to advance your class!', 'level', 6000);
                }, 1000);
            }
        }
    }

    /* =========================================================================
       UI RENDERING (STATS, INV, SHOP, SKILLS)
       ========================================================================= */

    function renderStats() {
        computeStats();
        const titleEl = document.getElementById('stat-title');
        if(titleEl) titleEl.innerText = player.activeTitle || 'Novice';
        const classStatEl = document.getElementById('stat-class');
        if(classStatEl) {
            let cls = (typeof CLASSES_DB !== 'undefined' && player.currentClass && CLASSES_DB[player.currentClass]);
            classStatEl.innerText = cls ? cls.name : 'Novice';
        }
        document.getElementById('stat-lvl').innerText = player.level;
        document.getElementById('stat-exp').innerText = `${player.exp} / ${player.level * 40}`;
        document.getElementById('stat-hp').innerText = `${pStats.hp}/${pStats.maxHp}`;
        document.getElementById('stat-mp').innerText = `${pStats.mp}/${pStats.maxMp}`;
        document.getElementById('stat-atk').innerText = pStats.atk;
        document.getElementById('stat-def').innerText = pStats.def;
        document.getElementById('stat-matk').innerText = pStats.matk;
        document.getElementById('stat-mdef').innerText = pStats.mdef;
        document.getElementById('stat-spd').innerText = pStats.spd;
        const critEl = document.getElementById('stat-crit');
        if(critEl) critEl.innerText = pStats.crit + '%';
        
        const allSlots = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'accessory'];
        let eqHtml = '';
        for (let slot of allSlots) {
            let item = player.equipment ? player.equipment[slot] : null;
            if(item) {
                let rarity = (typeof item === 'object' && item.rarity) ? item.rarity : 'Common';
                let color = RARITY_TIERS[rarity] ? RARITY_TIERS[rarity].color : '#ffffff';
                let name = (typeof item === 'object' && item.name) ? item.name : item;
                
                let baseStatsArr = [];
                if(typeof item === 'object' && item.baseStats) {
                    for(let s in item.baseStats) baseStatsArr.push(`+${item.baseStats[s]} ${s.toUpperCase()}`);
                } else if(typeof item === 'string' && ITEMS_DB[item]) {
                    baseStatsArr.push(ITEMS_DB[item].desc);
                }
                let baseStatsText = baseStatsArr.join(', ');
                
                let affixesText = '';
                if(typeof item === 'object' && item.affixes && item.affixes.length > 0) {
                    affixesText = item.affixes.map(a => a.desc ? a.desc.replace('{val}', a.value) : `+${a.value} ${a.stat}`).join(', ');
                }

                eqHtml += `
                    <div class="item-row" style="align-items: flex-start; margin-bottom: 6px; padding: 6px 10px; background: rgba(255,255,255,0.02); border-radius: 6px; border-left: 3px solid ${color};">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 11px; color: #888; font-weight: bold; text-transform: uppercase;">${slot.toUpperCase()}:</span>
                                <span style="font-weight: bold; color: ${color}; font-size: 13px;">${name}</span>
                                <span style="font-size: 10px; padding: 1px 6px; border-radius: 3px; background: rgba(255,255,255,0.08); color: ${color}; font-weight: bold;">${rarity}</span>
                            </div>
                            ${baseStatsText ? `<div style="font-size: 11px; color: #aaa; margin-top: 2px;">Base: ${baseStatsText}</div>` : ''}
                            ${affixesText ? `<div style="font-size: 11px; color: #60a5fa; margin-top: 2px;">Affixes: ${affixesText}</div>` : ''}
                        </div>
                        <button class="btn" style="padding: 3px 8px; font-size: 11px; margin-left: 8px;" onclick="unequip('${slot}')">Unequip</button>
                    </div>`;
            } else {
                eqHtml += `
                    <div class="item-row" style="padding: 6px 10px; opacity: 0.5; margin-bottom: 6px;">
                        <div><b style="font-size: 11px; color: #888; text-transform: uppercase;">${slot.toUpperCase()}:</b> <span style="color:#666; font-style: italic; font-size: 13px;">Empty</span></div>
                    </div>`;
            }
        }
        document.getElementById('equip-slots').innerHTML = eqHtml;
    }
    function renderInventory() {
        const container = document.getElementById('inventory-list');
        if (!container) return;
        
        if (!player.inventory) player.inventory = createInventory();
        
        let consumablesHtml = '<div style="margin-bottom: 16px;"><div style="font-size: 14px; font-weight: bold; color: #38bdf8; margin-bottom: 8px; border-bottom: 1px solid #333; padding-bottom: 4px;">Consumables</div>';
        let hasConsumables = false;
        let consumablesMap = player.inventory.consumables || player.inventory;
        
        for (let itemName in consumablesMap) {
            let qty = consumablesMap[itemName];
            if (typeof qty === 'number' && qty > 0) {
                let item = ITEMS_DB[itemName];
                if (item && item.type === 'consumable') {
                    hasConsumables = true;
                    consumablesHtml += `
                        <div class="item-row" style="margin-bottom: 6px;">
                            <div>
                                <b>${itemName} x${qty}</b><br>
                                <span style="font-size: 12px; color: #aaa;">${item.desc}</span>
                            </div>
                            <div>
                                <button class="btn" onclick="useItemOutsideBattle('${itemName}')">Use</button>
                            </div>
                        </div>`;
                }
            }
        }
        if (!hasConsumables) consumablesHtml += '<p style="font-size: 12px; color: #666; margin: 6px 0;">No consumables in bag.</p>';
        consumablesHtml += '</div>';

        let eqCount = (player.inventory.equipment && player.inventory.equipment.length) || 0;
        let equipmentHtml = `<div><div style="font-size: 14px; font-weight: bold; color: #ffd700; margin-bottom: 8px; border-bottom: 1px solid #333; padding-bottom: 4px;">Equipment (${eqCount})</div>`;
        
        if (player.inventory.equipment && player.inventory.equipment.length > 0) {
            for (let item of player.inventory.equipment) {
                let rarity = item.rarity || 'Common';
                let tierInfo = RARITY_TIERS[rarity] || { color: '#ffffff' };
                let color = tierInfo.color;
                
                let baseStatsArr = [];
                if (item.baseStats) {
                    for (let s in item.baseStats) {
                        baseStatsArr.push(`+${item.baseStats[s]} ${s.toUpperCase()}`);
                    }
                }
                let baseStatsText = baseStatsArr.join(', ');
                
                let affixesText = '';
                if (item.affixes && item.affixes.length > 0) {
                    affixesText = item.affixes.map(a => a.desc ? a.desc.replace('{val}', a.value) : `+${a.value} ${a.stat}`).join(' | ');
                }
                
                equipmentHtml += `
                    <div class="equip-card equip-card-${rarity}">
                        <div class="equip-card-top">
                            <span class="equip-card-name" style="color: ${color};">${item.name}</span>
                            <span class="equip-card-badge" style="background: rgba(255,255,255,0.08); color: ${color}; border: 1px solid ${color};">${rarity} • ${item.type.toUpperCase()}</span>
                        </div>
                        <div class="equip-card-stats">
                            ${baseStatsText ? `<div class="equip-card-base">Base Stats: <b>${baseStatsText}</b></div>` : ''}
                            ${affixesText ? `<div class="equip-card-affixes">Affixes (${item.affixes.length}): <span>${affixesText}</span></div>` : ''}
                        </div>
                        <div class="equip-card-actions">
                            <span style="font-size: 12px; color: #fbbf24;">Sell: ${item.sellPrice || 10} Gold</span>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn" style="padding: 3px 12px; font-size: 12px;" onclick="sellItem('${item.id}')">Sell</button>
                                <button class="btn" style="padding: 3px 14px; font-size: 12px; color: #55ff55; border-color: #55ff55;" onclick="equipItem('${item.id}')">Equip</button>
                            </div>
                        </div>
                    </div>`;
            }
        } else {
            equipmentHtml += '<p style="font-size: 12px; color: #666; margin: 6px 0;">No equipment in bag.</p>';
        }
        equipmentHtml += '</div>';

        container.innerHTML = consumablesHtml + equipmentHtml;
    }
    function renderSkillTree() {
        document.getElementById('st-orbs').innerText = player.skillOrbs;
        
        let branches = { Damage: '', Sustain: '', General: '' };
        
        for(let key in SKILL_TREE_DB) {
            let upgrade = SKILL_TREE_DB[key];
            let currentRank = player.skillTree[key];
            let isMaxed = currentRank >= upgrade.max;
            let canAfford = player.skillOrbs >= upgrade.cost;
            
            let statusText = isMaxed ? 'MAXED' : 'Cost: ' + upgrade.cost + ' Orb' + (upgrade.cost>1?'s':'');
            let statusColor = isMaxed ? '#55ff55' : (canAfford ? '#ffd700' : '#ff5555');
            
            let html = `
                <div class="skill-node">
                    <div class="skill-node-header"><span>${upgrade.name}</span> <span>${currentRank}/${upgrade.max}</span></div>
                    <div class="skill-node-desc">${upgrade.desc}</div>
                    <div class="skill-node-actions">
                        <span style="font-size: 12px; color: ${statusColor}">${statusText}</span>
                        <button class="btn" style="padding: 2px 8px; font-size: 12px;" 
                            ${isMaxed || !canAfford ? 'disabled' : ''} 
                            onclick="buySkillUpgrade('${key}')">Upgrade</button>
                    </div>
                </div>
            `;
            branches[upgrade.branch] += html;
        }
        
        document.getElementById('st-content').innerHTML = `
            <div class="skill-branch"><h3>Damage</h3>${branches.Damage}</div>
            <div class="skill-branch"><h3>Sustain</h3>${branches.Sustain}</div>
            <div class="skill-branch"><h3>General</h3>${branches.General}</div>
        `;
    }

    function buySkillUpgrade(key) {
        let upgrade = SKILL_TREE_DB[key];
        if(player.skillTree[key] < upgrade.max && player.skillOrbs >= upgrade.cost) {
            player.skillOrbs -= upgrade.cost;
            player.skillTree[key]++;
            
            if(upgrade.type === 'active' && player.skillTree[key] === 1) {
                if(!player.skills.includes(upgrade.skillRef)) {
                    player.skills.push(upgrade.skillRef);
                }
            }
            
            computeStats();
            renderSkillTree();
            updateHeader();
            if(typeof checkAchievements === 'function') checkAchievements();
        }
    }

    /* =========================================================================
       QUEST SYSTEM
       ========================================================================= */

    function getQuestProgress(quest) {
        let current = 0;
        if(quest.type === 'defeat_enemies') {
            current = (player.questStats && player.questStats.enemiesDefeated) || 0;
        } else if(quest.type === 'reach_level') {
            current = player.level || 1;
        } else if(quest.type === 'have_item') {
            current = (player.inventory && player.inventory[quest.item]) || 0;
        } else if(quest.type === 'bosses_defeated') {
            current = (player.questStats && player.questStats.bossesDefeated) || 0;
        } else if(quest.type === 'gold_held') {
            current = player.gold || 0;
        } else if(quest.type === 'skill_ranks') {
            current = typeof getTotalSkillRanks === 'function' ? getTotalSkillRanks() : 0;
        }
        let target = quest.target;
        let isComplete = current >= target;
        let isClaimed = !!(player.quests && player.quests[quest.id] && player.quests[quest.id].claimed);
        let isUnlocked = !quest.prereqQuestId || !!(player.quests && player.quests[quest.prereqQuestId] && player.quests[quest.prereqQuestId].claimed);
        return {
            current: Math.min(current, target),
            rawCurrent: current,
            target: target,
            isComplete: isComplete,
            isClaimed: isClaimed,
            isUnlocked: isUnlocked
        };
    }

    function getClaimableQuestCount() {
        if(!player || !player.quests) return 0;
        let count = 0;
        for(let key in QUESTS_DB) {
            let prog = getQuestProgress(QUESTS_DB[key]);
            if(prog.isUnlocked && prog.isComplete && !prog.isClaimed) count++;
        }
        return count;
    }

    function updateTownQuestButton() {
        const questBtn = document.getElementById('btn-town-quests');
        if(!questBtn) return;
        let claimable = getClaimableQuestCount();
        if(claimable > 0) {
            questBtn.innerHTML = `Quests<br><span style="color:#55ff55; font-size:12px;">● ${claimable} Ready!</span>`;
            questBtn.style.borderColor = '#38bdf8';
        } else {
            questBtn.innerHTML = 'Quests';
            questBtn.style.borderColor = '#666';
        }
    }

    function renderQuests() {
        const container = document.getElementById('quests-list');
        if(!container) return;
        
        let activeHtml = '';
        let claimedHtml = '';
        
        for(let key in QUESTS_DB) {
            const quest = QUESTS_DB[key];
            const prog = getQuestProgress(quest);
            
            // Hide locked tiers whose prerequisites have not yet been claimed
            if(!prog.isUnlocked && !prog.isClaimed) continue;
            
            let statusBadge = '';
            let cardClass = 'quest-card';
            let actionBtn = '';
            
            if(prog.isClaimed) {
                cardClass += ' claimed';
                statusBadge = '<span class="quest-status-badge quest-badge-claimed">Claimed ✓</span>';
                actionBtn = '<button class="btn" disabled style="padding: 4px 12px; font-size: 12px;">Claimed</button>';
            } else if(prog.isComplete) {
                cardClass += ' ready';
                statusBadge = '<span class="quest-status-badge quest-badge-ready">Ready to Claim!</span>';
                actionBtn = `<button class="btn" style="padding: 4px 12px; font-size: 12px; color: #55ff55; border-color: #55ff55;" onclick="claimQuest('${quest.id}')">Claim Reward</button>`;
            } else {
                statusBadge = '<span class="quest-status-badge quest-badge-progress">In Progress</span>';
                actionBtn = '<button class="btn" disabled style="padding: 4px 12px; font-size: 12px;">In Progress</button>';
            }
            
            let percent = Math.min(100, Math.floor((prog.rawCurrent / prog.target) * 100));
            
            let rewardItems = [];
            if(quest.reward.exp) rewardItems.push(`+${quest.reward.exp} EXP`);
            if(quest.reward.gold) rewardItems.push(`+${quest.reward.gold} Gold`);
            if(quest.reward.item) rewardItems.push(`+${quest.reward.item}${quest.reward.qty > 1 ? ' x' + quest.reward.qty : ''}`);
            
            let progressLabel = `${Math.min(prog.rawCurrent, prog.target)} / ${prog.target}`;
            if(quest.type === 'have_item') progressLabel += ` in inventory`;
            if(quest.type === 'gold_held') progressLabel += ` Gold`;
            if(quest.type === 'skill_ranks') progressLabel += ` Ranks`;
            if(quest.type === 'bosses_defeated') progressLabel += ` Bosses`;
            if(quest.type === 'reach_level') progressLabel += ` Level`;
            
            let cardMarkup = `
                <div class="${cardClass}">
                    <div class="quest-top">
                        <span class="quest-title">${quest.title}</span>
                        ${statusBadge}
                    </div>
                    <div class="quest-desc">${quest.desc}</div>
                    <div class="quest-prog-container">
                        <div class="quest-prog-text">
                            <span>Progress</span>
                            <span>${progressLabel} (${percent}%)</span>
                        </div>
                        <div class="quest-prog-bar-bg">
                            <div class="quest-prog-bar-fill" style="width: ${percent}%;"></div>
                        </div>
                    </div>
                    <div class="quest-bottom">
                        <div class="quest-rewards-text">Rewards: ${rewardItems.join(' | ')}</div>
                        <div>${actionBtn}</div>
                    </div>
                </div>
            `;
            
            if(prog.isClaimed) {
                claimedHtml += cardMarkup;
            } else {
                activeHtml += cardMarkup;
            }
        }
        
        container.innerHTML = activeHtml + claimedHtml;
        updateTownQuestButton();
    }

    function claimQuest(questId) {
        const quest = QUESTS_DB[questId];
        if(!quest) return;
        
        if(!player.quests) player.quests = {};
        if(player.quests[questId] && player.quests[questId].claimed) {
            showToast('Quest', 'Reward already claimed!', 'quest');
            return;
        }
        
        const prog = getQuestProgress(quest);
        if(!prog.isComplete) {
            showToast('Quest', 'Quest requirement not yet met!', 'quest');
            return;
        }
        
        player.quests[questId] = { claimed: true };
        
        let rewardText = [];
        if(quest.reward.exp) {
            player.exp += quest.reward.exp;
            rewardText.push(`+${quest.reward.exp} EXP`);
        }
        if(quest.reward.gold) {
            player.gold += quest.reward.gold;
            rewardText.push(`+${quest.reward.gold} Gold`);
        }
        if(quest.reward.item) {
            let qty = quest.reward.qty || 1;
            let baseItem = ITEMS_DB[quest.reward.item];
            if(baseItem && baseItem.type !== 'consumable') {
                for(let q = 0; q < qty; q++) {
                    let eqInstance = generateItem(quest.reward.item, 'Rare');
                    if(!player.inventory.equipment) player.inventory.equipment = [];
                    player.inventory.equipment.push(eqInstance);
                }
                rewardText.push(`+${quest.reward.item} (Rare) x${qty}`);
            } else {
                if(!player.inventory.consumables) player.inventory.consumables = {};
                player.inventory.consumables[quest.reward.item] = (player.inventory.consumables[quest.reward.item] || 0) + qty;
                rewardText.push(`+${quest.reward.item} x${qty}`);
            }
        }
        showToast('Quest Complete!', `${quest.title}: ${rewardText.join(', ')}`, 'quest');
        
        if(quest.reward.exp) {
            checkLevelUp();
        }
        
        computeStats();
        updateHeader();
        renderQuests();
        if(typeof checkAchievements === 'function') checkAchievements();
    }

    /* =========================================================================
       ACHIEVEMENT SYSTEM
       ========================================================================= */

    function getTotalSkillRanks() {
        if(!player || !player.skillTree) return 0;
        let total = 0;
        for(let k in player.skillTree) {
            if(typeof player.skillTree[k] === 'number') total += player.skillTree[k];
        }
        return total;
    }

    function getClaimedQuestCount() {
        if(!player || !player.quests) return 0;
        let count = 0;
        for(let k in player.quests) {
            if(player.quests[k] && player.quests[k].claimed) count++;
        }
        return count;
    }

    function getAchievementProgress(achievement) {
        let current = 0;
        if(achievement.type === 'battles_won') {
            current = (player.questStats && player.questStats.battlesWon) || 0;
        } else if(achievement.type === 'bosses_defeated') {
            current = (player.questStats && player.questStats.bossesDefeated) || 0;
        } else if(achievement.type === 'gold_held') {
            current = player.gold || 0;
        } else if(achievement.type === 'skill_ranks') {
            current = getTotalSkillRanks();
        } else if(achievement.type === 'quests_claimed') {
            current = getClaimedQuestCount();
        } else if(achievement.type === 'reach_level') {
            current = player.level || 1;
        }
        let target = achievement.target;
        let isUnlocked = !!(player.achievements && player.achievements[achievement.id] && player.achievements[achievement.id].unlocked);
        let percent = Math.min(100, Math.floor((current / target) * 100));
        return {
            current: Math.min(current, target),
            rawCurrent: current,
            target: target,
            isUnlocked: isUnlocked,
            percent: percent
        };
    }

    function getUnlockedAchievementCount() {
        if(!player || !player.achievements) return 0;
        let count = 0;
        for(let id in ACHIEVEMENTS_DB) {
            if(player.achievements[id] && player.achievements[id].unlocked) count++;
        }
        return count;
    }

    function updateTownAchievementsButton() {
        const achBtn = document.getElementById('btn-town-achievements');
        if(!achBtn) return;
        let unlocked = getUnlockedAchievementCount();
        let total = typeof ACHIEVEMENTS_DB !== 'undefined' ? Object.keys(ACHIEVEMENTS_DB).length : 12;
        achBtn.innerHTML = `Achievements<br><span style="color:#c084fc; font-size:12px;">★ ${unlocked}/${total} Unlocked</span>`;
        if(unlocked > 0) {
            achBtn.style.borderColor = '#c084fc';
        } else {
            achBtn.style.borderColor = '#666';
        }
    }

    function checkAchievements(silent = false) {
        if(!player) return;
        if(!player.achievements) player.achievements = {};
        if(typeof ACHIEVEMENTS_DB === 'undefined') return;
        let anyUnlocked = false;

        for(let id in ACHIEVEMENTS_DB) {
            const ach = ACHIEVEMENTS_DB[id];
            if(player.achievements[id] && player.achievements[id].unlocked) continue;

            const prog = getAchievementProgress(ach);
            if(prog.rawCurrent >= prog.target) {
                player.achievements[id] = { unlocked: true, unlockedAt: Date.now() };
                anyUnlocked = true;

                if(ach.reward && ach.reward.title) {
                    player.activeTitle = ach.reward.title;
                }

                let statRewards = [];
                if(ach.reward && ach.reward.stats) {
                    for(let s in ach.reward.stats) {
                        statRewards.push(`+${ach.reward.stats[s]} ${s.toUpperCase()}`);
                    }
                }

                if(typeof battleState !== 'undefined' && battleState.active) {
                    logMsg(`★ Achievement Unlocked: ${ach.title}! Title: "${ach.reward.title}"`, "#ffd700");
                }
                if(!silent) {
                    showToast('Achievement Unlocked!', `${ach.title} — Title: "${ach.reward.title}" (${statRewards.join(', ')})`, 'achievement', 4000);
                }
            }
        }

        if(anyUnlocked) {
            computeStats();
            updateHeader();
            updateTownAchievementsButton();
        }
    }

    function renderAchievements() {
        checkAchievements(true);
        const container = document.getElementById('achievements-list');
        if(!container) return;

        let html = '';
        for(let key in ACHIEVEMENTS_DB) {
            const ach = ACHIEVEMENTS_DB[key];
            const prog = getAchievementProgress(ach);

            let cardClass = 'achievement-card';
            let statusBadge = '';

            if(prog.isUnlocked) {
                cardClass += ' unlocked';
                statusBadge = '<span class="ach-status-badge ach-badge-unlocked">★ Unlocked</span>';
            } else {
                statusBadge = `<span class="ach-status-badge ach-badge-locked">Locked (${prog.percent}%)</span>`;
            }

            let statBonuses = [];
            if(ach.reward.stats) {
                for(let s in ach.reward.stats) {
                    statBonuses.push(`+${ach.reward.stats[s]} ${s.toUpperCase()}`);
                }
            }
            let rewardLabel = `<span style="color:#ffd700;">Title: "${ach.reward.title}"</span> | <span style="color:#55ff55;">${statBonuses.join(', ')}</span>`;

            let progressLabel = `${prog.current} / ${prog.target}`;
            if(ach.type === 'gold_held') progressLabel += ' Gold';
            if(ach.type === 'skill_ranks') progressLabel += ' Ranks';
            if(ach.type === 'quests_claimed') progressLabel += ' Quests';
            if(ach.type === 'battles_won') progressLabel += ' Battles';
            if(ach.type === 'bosses_defeated') progressLabel += ' Bosses';
            if(ach.type === 'reach_level') progressLabel += ' Level';

            html += `
                <div class="${cardClass}">
                    <div class="ach-top">
                        <span class="ach-title">${ach.title}</span>
                        ${statusBadge}
                    </div>
                    <div class="ach-desc">${ach.desc}</div>
                    <div class="ach-prog-container">
                        <div class="ach-prog-text">
                            <span>Progress</span>
                            <span>${progressLabel}</span>
                        </div>
                        <div class="ach-prog-bar-bg">
                            <div class="ach-prog-bar-fill" style="width: ${prog.percent}%;"></div>
                        </div>
                    </div>
                    <div class="ach-bottom">
                        <div class="ach-rewards-text">Rewards: ${rewardLabel}</div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
        updateTownAchievementsButton();
    }

    function useItemOutsideBattle(itemName) {
        let item = ITEMS_DB[itemName];
        if(!item) return;

        if (item.effect === 'cleanse' || item.effect === 'smoke_bomb') {
            showToast('Item', 'Can only be used during battle!', 'info');
            return;
        }

        if (item.effect === 'heal_hp') {
            if (pStats.hp >= pStats.maxHp) {
                showToast('Item', 'HP is already full!', 'info');
                return;
            }
            player.baseStats.hp = Math.min(pStats.maxHp, pStats.hp + item.value);
            pStats.hp = player.baseStats.hp;
            showToast('Item Used', `Restored ${item.value} HP.`, 'info');
        } else if (item.effect === 'heal_hp_full') {
            if (pStats.hp >= pStats.maxHp) {
                showToast('Item', 'HP is already full!', 'info');
                return;
            }
            player.baseStats.hp = pStats.maxHp;
            pStats.hp = pStats.maxHp;
            showToast('Item Used', 'HP fully restored!', 'info');
        } else if (item.effect === 'heal_mp') {
            if (pStats.mp >= pStats.maxMp) {
                showToast('Item', 'MP is already full!', 'info');
                return;
            }
            player.baseStats.mp = Math.min(pStats.maxMp, pStats.mp + item.value);
            pStats.mp = player.baseStats.mp;
            showToast('Item Used', `Restored ${item.value} MP.`, 'info');
        } else if (item.effect === 'elixir') {
            if (pStats.hp >= pStats.maxHp && pStats.mp >= pStats.maxMp) {
                showToast('Item', 'HP and MP are already full!', 'info');
                return;
            }
            let healHp = item.value || 250;
            let healMp = item.mpValue || 80;
            player.baseStats.hp = Math.min(pStats.maxHp, pStats.hp + healHp);
            player.baseStats.mp = Math.min(pStats.maxMp, pStats.mp + healMp);
            pStats.hp = player.baseStats.hp;
            pStats.mp = player.baseStats.mp;
            showToast('Item Used', `Restored ${healHp} HP and ${healMp} MP.`, 'info');
        }
        
        player.inventory[itemName]--;
        renderInventory();
        updateHeader();
        renderStats();
    }

    function renderShop() {
        document.getElementById('shop-gold').innerText = player.gold;
        let html = '';
        for (let itemName in ITEMS_DB) {
            let item = ITEMS_DB[itemName];
            html += `<div class="item-row">
                <div><b>${itemName}</b> - ${item.price} G<br><span style="font-size:12px; color:#aaa;">${item.desc}</span></div>
                <div><button class="btn" onclick="buyItem('${itemName}')">Buy</button></div>
            </div>`;
        }
        document.getElementById('shop-list').innerHTML = html;
    }

    function equipItem(itemOrId, slotType) {
        if (!player || !player.equipment || !player.inventory) return;
        
        let itemIndex = -1;
        let itemToEquip = null;
        
        if (player.inventory.equipment && Array.isArray(player.inventory.equipment)) {
            itemIndex = player.inventory.equipment.findIndex(i => i.id === itemOrId || i.baseName === itemOrId || i.name === itemOrId);
            if (itemIndex !== -1) {
                itemToEquip = player.inventory.equipment[itemIndex];
            }
        }
        
        if (!itemToEquip && ITEMS_DB[itemOrId] && ITEMS_DB[itemOrId].type !== 'consumable') {
            itemToEquip = generateItem(itemOrId, 'Common');
        }
        
        if (!itemToEquip) return;
        
        let targetSlot = itemToEquip.type || slotType;
        if (!targetSlot || !player.equipment.hasOwnProperty(targetSlot)) {
            if (targetSlot === 'chest') targetSlot = 'armor';
            if (!player.equipment.hasOwnProperty(targetSlot)) targetSlot = 'weapon';
        }
        
        let oldItem = player.equipment[targetSlot];
        if (oldItem) {
            let oldItemInstance = (typeof oldItem === 'object') ? oldItem : generateItem(oldItem, 'Common');
            if (!player.inventory.equipment) player.inventory.equipment = [];
            player.inventory.equipment.push(oldItemInstance);
        }
        
        if (itemIndex !== -1 && player.inventory.equipment) {
            player.inventory.equipment.splice(itemIndex, 1);
        }
        
        player.equipment[targetSlot] = itemToEquip;
        
        showToast('Gear Equipped', `${itemToEquip.name} equipped to ${targetSlot.toUpperCase()}.`, 'info');
        
        computeStats();
        updateHeader();
        renderStats();
        renderInventory();
    }

    function unequip(slot) {
        if (!player || !player.equipment || !player.equipment[slot]) return;
        
        let oldItem = player.equipment[slot];
        let oldItemInstance = (typeof oldItem === 'object') ? oldItem : generateItem(oldItem, 'Common');
        
        if (!player.inventory.equipment) player.inventory.equipment = [];
        player.inventory.equipment.push(oldItemInstance);
        
        player.equipment[slot] = null;
        
        showToast('Gear Unequipped', `Unequipped ${oldItemInstance.name}.`, 'info');
        
        computeStats();
        updateHeader();
        renderStats();
        renderInventory();
    }

    function sellItem(itemId) {
        if (!player || !player.inventory || !player.inventory.equipment) return;
        
        let index = player.inventory.equipment.findIndex(i => i.id === itemId);
        if (index === -1) return;
        
        let item = player.inventory.equipment[index];
        let price = item.sellPrice || 10;
        
        player.inventory.equipment.splice(index, 1);
        player.gold += price;
        
        showToast('Item Sold', `Sold ${item.name} for +${price} Gold.`, 'save');
        
        updateHeader();
        renderInventory();
        if (typeof checkAchievements === 'function') checkAchievements();
    }

    function buyItem(itemName) {
        let item = ITEMS_DB[itemName];
        if (!item) return;
        let price = item.price;
        if (player.gold >= price) {
            player.gold -= price;
            if (item.type === 'consumable') {
                if (!player.inventory.consumables) player.inventory.consumables = {};
                player.inventory.consumables[itemName] = (player.inventory.consumables[itemName] || 0) + 1;
            } else {
                let eq = generateItem(itemName, 'Common');
                if (!player.inventory.equipment) player.inventory.equipment = [];
                player.inventory.equipment.push(eq);
            }
            showToast('Shop Purchase', `Purchased ${itemName}!`, 'info');
            renderShop();
            updateHeader();
        } else {
            showToast("Shop", "Not enough gold.", "info");
        }
    }
    function getSkillCost(skill) {
        let cost = skill.mp;
        if(player.skillTree && player.skillTree.manaEfficiency > 0) {
            cost = Math.max(1, Math.floor(cost * 0.9));
        }
        if(playerHasPassive('elemental_overcharge')) {
            cost = Math.max(1, Math.floor(cost * 0.75));
        }
        return cost;
    }

    /* =========================================================================
       BATTLE SYSTEM
       ========================================================================= */

    function startBattle(count = 1, isBossFight = false) {
        if (typeof clearAllCombatTimers === 'function') clearAllCombatTimers();
        closeAllModals();
        switchScreen('battle');
        const speedBtn = document.getElementById('btn-combat-speed');
        if (speedBtn) speedBtn.innerText = `⚡ Speed: ${combatSpeed}x`;
        battleState = {
            active: true,
            initialEnemyCount: count,
            enemies: [],
            turnQueue: [],
            targetingMode: null,
            log: [],
            playerStatuses: {},
            playerEntity: null
        };
        player.statuses = battleState.playerStatuses;
        
        let areaKey = (player && player.selectedArea) || 'area_1';
        let area = AREAS_DB[areaKey] || AREAS_DB['area_1'];

        // Apply zone arena background gradient
        const arenaEl = document.getElementById('battle-arena');
        if(arenaEl && area.bgGradient) {
            arenaEl.style.background = area.bgGradient;
        }

        if(isBossFight && area.boss) {
            let template = area.boss;
            battleState.initialEnemyCount = 1;
            battleState.enemies.push({
                index: 0,
                id: 'enemy_0',
                name: template.name,
                level: template.level,
                element: template.element,
                hp: template.hp,
                maxHp: template.hp,
                atk: template.atk,
                def: template.def,
                matk: template.matk,
                mdef: template.mdef,
                spd: template.spd,
                exp: template.exp,
                gold: template.gold,
                ai: template.ai,
                isBoss: true,
                loot: template.loot,
                statuses: {}
            });
        } else {
            let pool = (area.regularEnemies && area.regularEnemies.length > 0) ? area.regularEnemies : ENEMIES_DB;
            for(let i = 0; i < count; i++) {
                let template = pool[Math.floor(Math.random() * pool.length)];
                battleState.enemies.push({
                    index: i,
                    id: 'enemy_' + i,
                    name: template.name,
                    level: template.level || area.minLevel,
                    element: template.element,
                    hp: template.hp,
                    maxHp: template.hp,
                    atk: template.atk,
                    def: template.def,
                    matk: template.matk,
                    mdef: template.mdef,
                    spd: template.spd,
                    exp: template.exp,
                    gold: template.gold,
                    ai: template.ai,
                    isBoss: false,
                    loot: template.loot,
                    statuses: {}
                });
            }
        }
        
        let logContainer = document.getElementById('combat-log');
        logContainer.innerHTML = '';
        if(isBossFight) {
            logMsg(`⚠️ BOSS ENCOUNTER: ${battleState.enemies[0].name} (Level ${battleState.enemies[0].level})!`, "#ffd700");
        } else {
            logMsg(`Encountered ${count} enemy/enemies in ${area.name}!`, "#ffffff");
        }
        
        cancelTargeting();
        
        // Reset battle state flags
        battleState.undyingWrathUsed = false;

        // Class Start-of-Combat Passives
        let pCombatEnt = getPlayerCombatEntity();
        if (playerHasPassive('aegis_ward')) {
            let shieldVal = Math.round(pStats.maxHp * 0.15);
            applyStatus(pCombatEnt, 'divine_barrier', 99, shieldVal);
            logMsg(`🛡️ Aegis Ward: Divine Barrier granted (${shieldVal} HP Shield)!`, "#ffd700");
        }
        if (playerHasPassive('phantom_mirage')) {
            applyStatus(pCombatEnt, 'mirage', 99, 0);
            if (battleState.playerStatuses && battleState.playerStatuses.mirage) {
                battleState.playerStatuses.mirage.stacks = 2;
            }
            logMsg("🌀 Phantom Mirage: 2 stacks of Mirage evasion granted!", "#67e8f9");
        }

        renderBattlefield();
        if(typeof updateSaveLoadButtons === 'function') updateSaveLoadButtons(true);
        startRound();
    }
    function renderBattlefield() {
        document.getElementById('battle-player-hp-bar').style.width = `${(pStats.hp / pStats.maxHp) * 100}%`;
        document.getElementById('battle-player-hp-txt').innerText = `${pStats.hp}/${pStats.maxHp}`;
        document.getElementById('battle-player-mp-bar').style.width = `${(pStats.mp / pStats.maxMp) * 100}%`;
        document.getElementById('battle-player-mp-txt').innerText = `${pStats.mp}/${pStats.maxMp}`;

        const pTray = document.getElementById('statuses-player');
        if (pTray) {
            pTray.innerHTML = renderStatusBadges(battleState.playerStatuses || (player && player.statuses));
        }

        const container = document.getElementById('enemies-side');
        container.innerHTML = '';
        
        battleState.enemies.forEach(e => {
            const el = document.createElement('div');
            el.className = `entity-box enemy ${e.hp <= 0 ? 'dead' : ''}`;
            el.id = e.id;
            
            let spriteClass = e.isBoss ? 'entity-sprite boss-sprite' : 'entity-sprite';
            let spriteSvg = SVG_SPRITES[e.name] || SVG_SPRITES['Stone Golem'] || '';

            el.innerHTML = `
                <div class="entity-name">${e.name}</div>
                <div class="entity-element elem-${e.element}">${e.element}</div>
                <div class="${spriteClass}">${spriteSvg}</div>
                <div class="bar-container"><div class="bar-fill hp-fill" style="width: ${(e.hp / e.maxHp) * 100}%"></div><div class="bar-text">${e.hp}/${e.maxHp}</div></div>
                <div class="status-tray" id="statuses-${e.id}">${renderStatusBadges(e.statuses)}</div>
            `;

            if(e.hp > 0) {
                el.onclick = () => handleEnemyClick(e.index);
            }
            container.appendChild(el);
        });

        updateHeader();
    }
    function logMsg(text, color = '#cccccc') {
        const logEl = document.getElementById('combat-log');
        logEl.innerHTML += `<div class="log-entry" style="color:${color}">${text}</div>`;
        logEl.scrollTop = logEl.scrollHeight;
    }

    function floatText(targetId, text, color) {
        const targetEl = document.getElementById(targetId);
        if(!targetEl) return;
        const floatEl = document.createElement('div');
        floatEl.className = 'floating-text';
        floatEl.innerText = text;
        floatEl.style.color = color;
        floatEl.style.left = '50%';
        floatEl.style.top = '20%';
        floatEl.style.transform = 'translate(-50%, 0)';
        targetEl.appendChild(floatEl);
        setTimeout(() => floatEl.remove(), 1000);
    }

    function startRound() {
        if(!battleState.active) return;
        battleState.turnQueue = [{ type: 'player', spd: pStats.spd, name: 'Hero' }];
        battleState.enemies.forEach(e => {
            if(e.hp > 0) battleState.turnQueue.push({ type: 'enemy', index: e.index, spd: e.spd, name: e.name });
        });
        battleState.turnQueue.sort((a, b) => b.spd - a.spd);
        
        processNextTurn();
    }

    function processNextTurn() {
        if(!battleState.active) return;
        
        if(pStats.hp <= 0) { loseBattle(); return; }
        if(battleState.enemies.every(e => e.hp <= 0)) { winBattle(); return; }

        if(battleState.turnQueue.length === 0) {
            startRound();
            return;
        }

        const currentTurn = battleState.turnQueue.shift();
        
        if(currentTurn.type === 'player') {
            logMsg("Hero's Turn", "#ffffff");
            let playerEnt = getPlayerCombatEntity();
            let turnSkipped = processStatusesStartTurn(playerEnt);
            if (turnSkipped) {
                return;
            }
            enableCommands();
        } else {
            const enemy = battleState.enemies[currentTurn.index];
            if(enemy && enemy.hp > 0) {
                executeEnemyTurn(enemy);
            } else {
                processNextTurn();
            }
        }
    }
    function triggerRegen() {
        if(player.skillTree && player.skillTree.regeneration > 0 && pStats.hp > 0 && battleState.active) {
            let heal = Math.max(1, Math.floor(pStats.maxHp * 0.03));
            if(pStats.hp < pStats.maxHp) {
                player.baseStats.hp = Math.min(pStats.maxHp, pStats.hp + heal);
                pStats.hp = player.baseStats.hp;
                logMsg(`Regeneration restores ${heal} HP.`, "#55ff55");
                floatText('battle-player', `+${heal}`, '#55ff55');
                renderBattlefield();
            }
        }
    }

    /* =========================================================================
       TARGETING & PLAYER ACTIONS
       ========================================================================= */

    function enableCommands() {
        document.getElementById('battle-commands').classList.remove('targeting-mode-ui');
        document.getElementById('battle-commands').classList.remove('sub-menu-active');
        document.getElementById('enemies-side').classList.remove('targeting-active');
        document.querySelectorAll('#cmd-main .btn').forEach(b => b.disabled = false);
    }

    function enterTargetingMode(mode) {
        battleState.targetingMode = mode;
        document.getElementById('battle-commands').classList.add('targeting-mode-ui');
        document.getElementById('enemies-side').classList.add('targeting-active');
        closeSubMenu();
    }

    function cancelTargeting() {
        battleState.targetingMode = null;
        enableCommands();
    }

    function onAttackClicked() {
        logMsg("Select a target to attack.");
        enterTargetingMode('attack');
    }

    function handleEnemyClick(index) {
        const enemy = battleState.enemies[index];
        if(!enemy || enemy.hp <= 0) return;

        const mode = battleState.targetingMode;
        if (mode === 'attack') {
            battleState.targetingMode = null;
            executePlayerAttack(enemy);
        } else if (typeof mode === 'object' && (mode.type === 'magic' || mode.type === 'physical')) {
            battleState.targetingMode = null;
            executePlayerSkill(mode, enemy);
        }
    }

    function executePlayerAttack(target) {
        enableCommands();
        document.querySelectorAll('#cmd-main .btn').forEach(b => b.disabled = true);
        
        let playerEnt = getPlayerCombatEntity();

        // Bleed check on player action
        if (hasStatus(playerEnt, 'bleed')) {
            let bDmg = Math.max(2, Math.floor(pStats.maxHp * 0.04) + 4);
            playerEnt.hp = Math.max(0, playerEnt.hp - bDmg);
            logMsg(`Hero suffers ${bDmg} bleed damage from attacking!`, "#ef4444");
            floatText('battle-player', `-${bDmg} Bleed`, "#ef4444");
            if (playerEnt.hp <= 0) {
                loseBattle();
                return;
            }
        }

        // Blind check on player attack
        if (hasStatus(playerEnt, 'blind') && Math.random() < 0.4) {
            logMsg("Hero's attack missed due to Blindness!", "#64748b");
            floatText(target.id, "MISS", "#64748b");
            triggerRegen();
            processStatusesEndTurn(playerEnt);
            setCombatTimeout(processNextTurn, 1200);
            return;
        }

        let baseDmg = playerEnt.atk * 1.5;
        let mitigation = 20 / (20 + target.def);
        let dmg = Math.max(1, Math.floor(baseDmg * mitigation));

        if(player.skillTree && player.skillTree.combatMastery > 0) {
            dmg = Math.floor(dmg * 1.1);
        }

        // Blood Frenzy Missing HP Damage Scaling
        if (playerHasPassive('blood_frenzy')) {
            let missingHpRatio = 1 - (pStats.hp / pStats.maxHp);
            let bfBonus = 1 + (missingHpRatio * 0.40);
            dmg = Math.floor(dmg * bfBonus);
        }
        
        let critChance = pStats.crit + (hasStatus(playerEnt, 'focus') ? 25 : 0);
        let critMult = hasStatus(playerEnt, 'focus') ? 2.0 : 1.5;

        let hasAilment = target.statuses && (
            hasStatus(target, 'bleed') || hasStatus(target, 'poison') ||
            hasStatus(target, 'stun') || hasStatus(target, 'blind') ||
            hasStatus(target, 'burn') || hasStatus(target, 'freeze') ||
            hasStatus(target, 'decay') || hasStatus(target, 'shock')
        );
        if (playerHasPassive('lethal_exploit') && hasAilment) {
            critMult += 0.40;
        }

        if(Math.random() * 100 < critChance) {
            dmg = Math.floor(dmg * critMult);
            logMsg(playerHasPassive('lethal_exploit') && hasAilment ? "🎯 Lethal Exploit Critical Strike!" : "Critical Hit!", "#ff5555");
        }
        
        applyDamage(target, dmg, ELEMENTS.Physical, playerEnt);
        animateAction('battle-player');

        // Tempest Blademaster: Omnislash Flurry
        if (playerHasPassive('omnislash_flurry') && target.hp > 0) {
            let dmg2 = Math.max(1, Math.floor(dmg * 0.5));
            logMsg("🌪️ Tempest Blademaster strikes a second time!", "#38bdf8");
            applyDamage(target, dmg2, ELEMENTS.Physical, playerEnt);
        }
        
        triggerRegen();
        processStatusesEndTurn(playerEnt);
        setCombatTimeout(processNextTurn, 1200);
    }
    function executePlayerSkill(skill, target) {
        enableCommands();
        document.querySelectorAll('#cmd-main .btn').forEach(b => b.disabled = true);

        let playerEnt = getPlayerCombatEntity();

        // Silence check on player casting spells
        if (hasStatus(playerEnt, 'silence') && (skill.type === 'magic' || skill.type === 'heal')) {
            logMsg("Hero is Silenced and cannot cast spells!", "#94a3b8");
            floatText('battle-player', "SILENCED", "#94a3b8");
            enableCommands();
            return;
        }

        // Bleed check on player action
        if (hasStatus(playerEnt, 'bleed')) {
            let bDmg = Math.max(2, Math.floor(pStats.maxHp * 0.04) + 4);
            playerEnt.hp = Math.max(0, playerEnt.hp - bDmg);
            logMsg(`Hero suffers ${bDmg} bleed damage from casting!`, "#ef4444");
            floatText('battle-player', `-${bDmg} Bleed`, "#ef4444");
            if (playerEnt.hp <= 0) {
                loseBattle();
                return;
            }
        }

        let cost = getSkillCost(skill);
        player.baseStats.mp -= cost;
        pStats.mp -= cost;
        
        logMsg(`Hero casts ${skill.name}!`, "#aaddff");
        animateAction('battle-player');

        if(skill.target === 'enemy_single') {
            let dmg;
            if(skill.type === 'physical') {
                let baseDmg = playerEnt.atk * 1.5 + skill.power;
                let mitigation = 20 / (20 + target.def);
                dmg = Math.max(1, Math.floor(baseDmg * mitigation));
                if (playerHasPassive('blood_frenzy')) {
                    let missingHpRatio = 1 - (pStats.hp / pStats.maxHp);
                    let bfBonus = 1 + (missingHpRatio * 0.40);
                    dmg = Math.floor(dmg * bfBonus);
                }
            } else {
                dmg = Math.max(1, Math.floor(pStats.matk * 1.5 + skill.power) - target.mdef);
                if (playerHasPassive('arcane_singularity')) {
                    let critChance = pStats.crit + (hasStatus(playerEnt, 'focus') ? 25 : 0);
                    if (Math.random() * 100 < critChance) {
                        dmg = Math.floor(dmg * 2.0);
                        logMsg("✨ Arcane Singularity Spell Critical Hit!", "#c084fc");
                        floatText(target.id, "CRIT!", "#c084fc");
                    }
                }
            }
            
            applyDamage(target, dmg, skill.element, playerEnt);

            // Soul Siphon Magic Leech
            if (skill.type === 'magic' && playerHasPassive('soul_siphon') && dmg > 0) {
                let leech = Math.max(1, Math.floor(dmg * 0.20));
                player.baseStats.hp = Math.min(pStats.maxHp, player.baseStats.hp + leech);
                pStats.hp = player.baseStats.hp;
                logMsg(`🔮 Soul Siphon leeches ${leech} HP back to Hero!`, "#a855f7");
                floatText('battle-player', `+${leech} HP`, "#a855f7");
                renderBattlefield();
            }
            
            // Tactical Ailments upgrades
            if(skill.name === 'Fireball') {
                if(Math.random() < 0.6) applyStatus(target, 'burn', 3);
            } else if(skill.name === 'Water Splash') {
                if(Math.random() < 0.5) {
                    applyStatus(target, 'freeze', 1);
                } else {
                    applyStatus(target, 'slow', 2);
                }
            } else if(skill.name === 'Power Strike') {
                if(Math.random() < 0.75) applyStatus(target, 'bleed', 3);
            } else if(skill.name === 'Armor Break') {
                target.originalDef = (target.originalDef !== undefined) ? target.originalDef : target.def;
                target.def = Math.max(0, Math.floor(target.originalDef * 0.7));
                target.armorBreakTurns = 3;
                applyStatus(target, 'armor_break', 3);
            } else if(skill.name === 'Earth Spike') {
                if(Math.random() < 0.5) {
                    applyStatus(target, 'stun', 1);
                } else {
                    applyStatus(target, 'poison', 3);
                }
            } else if(skill.name === 'Wind Blade') {
                if(Math.random() < 0.5) applyStatus(target, 'shock', 3);
            } else if(skill.name === 'Holy Light') {
                if(Math.random() < 0.5) applyStatus(target, 'blind', 2);
            } else if(skill.name === 'Dark Blast') {
                if(Math.random() < 0.6) applyStatus(target, 'decay', 3);
            }
        } else if(skill.target === 'enemy_all') {
            let dmg = Math.max(1, Math.floor(playerEnt.atk * 1.5 + skill.power)); 
            battleState.enemies.forEach(e => {
                if(e.hp > 0) {
                    applyDamage(e, Math.max(1, dmg - e.def), skill.element, playerEnt);
                    if(skill.name === 'Cleave') {
                        applyStatus(e, 'bleed', 3);
                    }
                }
            });
        }
        
        renderBattlefield();
        triggerRegen();
        processStatusesEndTurn(playerEnt);
        setCombatTimeout(processNextTurn, 1200);
    }
    function applyDamage(target, amount, element, attacker = null) {
        if (!target || target.hp <= 0) return;

        // 1. Mirage Dodge Check
        if (hasStatus(target, 'mirage')) {
            let mBuff = target.statuses.mirage;
            let isGuaranteed = (mBuff.stacks && mBuff.stacks > 0);
            if (isGuaranteed || Math.random() < 0.4) {
                if (isGuaranteed) {
                    mBuff.stacks--;
                    if (mBuff.stacks <= 0) delete target.statuses.mirage;
                }
                logMsg(`${target.name} completely dodged the attack with Mirage!`, "#67e8f9");
                floatText(target.id, "DODGED", "#67e8f9");
                renderBattlefield();
                return;
            }
        }

        // 2. Elemental Affinity Multiplier
        let multi = getElementalMultiplier(element, target.element);
        amount = Math.floor(amount * multi);
        
        if(multi > 1.0) logMsg("It's super effective!", "#ffff55");
        if(multi < 1.0) logMsg("It's not very effective...", "#888888");

        // 3. Freeze Shatter Check
        if (hasStatus(target, 'freeze') && element === ELEMENTS.Physical) {
            amount = Math.floor(amount * 1.5);
            delete target.statuses.freeze;
            logMsg(`Heavy physical strike shattered the ice on ${target.name} for 1.5x damage!`, "#38bdf8");
            floatText(target.id, "SHATTER!", "#38bdf8");
        }

        // 4. Shock Charge Detonation & Splash
        if (hasStatus(target, 'shock')) {
            let shockBonus = Math.floor(target.maxHp * 0.05) + 8;
            amount += shockBonus;
            logMsg(`${target.name}'s stored shock detonated for +${shockBonus} lightning damage!`, "#eab308");
            floatText(target.id, `+${shockBonus} Shock`, "#eab308");
            
            let splash = Math.floor(shockBonus * 0.5);
            if (battleState.enemies && Array.isArray(battleState.enemies)) {
                battleState.enemies.forEach(other => {
                    if (other !== target && other.hp > 0) {
                        other.hp = Math.max(0, other.hp - splash);
                        floatText(other.id, `-${splash} Splash`, "#eab308");
                    }
                });
            }
            target.statuses.shock.duration--;
            if (target.statuses.shock.duration <= 0) delete target.statuses.shock;
        }

        // 5. Divine Barrier Absorption
        let absorbedAmount = 0;
        if (hasStatus(target, 'divine_barrier')) {
            let shield = target.statuses.divine_barrier.value || 0;
            absorbedAmount = Math.min(shield, amount);
            if (shield >= amount) {
                target.statuses.divine_barrier.value -= amount;
                amount = 0;
                logMsg(`${target.name}'s Divine Barrier absorbed the attack! (${target.statuses.divine_barrier.value} shield remaining)`, "#ffd700");
                floatText(target.id, "ABSORBED", "#ffd700");
            } else {
                amount -= shield;
                delete target.statuses.divine_barrier;
                logMsg(`${target.name}'s Divine Barrier shattered!`, "#ffd700");
                floatText(target.id, "SHIELD BROKE", "#ffd700");
            }
            renderBattlefield();
        }

        // Divine Retribution Reflection (Holy Templar Passive)
        let isTargetPlayer = (target.isPlayer || target.id === 'battle-player' || target === player);
        if (isTargetPlayer && playerHasPassive('divine_retribution') && attacker && attacker.hp > 0) {
            let totalMitigated = absorbedAmount + (target.lastDefMitigated || 0);
            target.lastDefMitigated = 0;
            if (totalMitigated > 0) {
                let holyReflect = Math.max(1, Math.floor(totalMitigated * 0.30));
                attacker.hp = Math.max(0, attacker.hp - holyReflect);
                logMsg(`✨ Divine Retribution reflects ${holyReflect} Holy true damage back to ${attacker.name}!`, "#ffd700");
                floatText(attacker.id, `-${holyReflect} Holy`, "#ffd700");
                if (attacker.hp <= 0) {
                    logMsg(`${attacker.name} was defeated by Divine Retribution!`, "#ff8888");
                    if(!player.questStats) player.questStats = { enemiesDefeated: 0, battlesWon: 0, bossesDefeated: 0 };
                    player.questStats.enemiesDefeated = (player.questStats.enemiesDefeated || 0) + 1;
                    if(attacker.isBoss) {
                        player.questStats.bossesDefeated = (player.questStats.bossesDefeated || 0) + 1;
                        if(typeof checkAchievements === 'function') checkAchievements();
                    }
                }
            }
        }

        if (amount <= 0) return;

        let wasAlive = target.hp > 0;
        target.hp -= amount;
        if(target.hp < 0) target.hp = 0;

        // Death's Guillotine Execution Check (Reaper of Shadows Passive)
        let isAttackerPlayer = (attacker && (attacker.isPlayer || attacker.id === 'battle-player' || attacker === player));
        if (isAttackerPlayer && playerHasPassive('deaths_guillotine') && !target.isPlayer && wasAlive && target.hp > 0 && target.hp <= target.maxHp * 0.25) {
            target.hp = 0;
            logMsg(`☠️ Death's Guillotine triggered! Instantly executed ${target.name}!`, "#a855f7");
            floatText(target.id, "EXECUTED!", "#a855f7");
        }

        // Undying Wrath Survival Check (Warlord of Carnage Passive)
        if (isTargetPlayer && target.hp <= 0 && wasAlive) {
            if (playerHasPassive('undying_wrath') && !battleState.undyingWrathUsed) {
                battleState.undyingWrathUsed = true;
                target.hp = 1;
                pStats.hp = 1;
                if (player.baseStats) player.baseStats.hp = 1;
                target.atk = Math.round(target.atk * 1.5);
                applyStatus('player', 'berserk', 3);
                logMsg("💥 Undying Wrath activated! Survived fatal hit with 1 HP and gained +50% ATK & Berserk!", "#ef4444");
                floatText('battle-player', "UNDYING WRATH!", "#ef4444");
            }
        }
        
        logMsg(`${target.name} takes ${amount} damage.`);
        floatText(target.id, `-${amount}`, '#ff3333');
        animateAction(target.id, 'anim-shake');

        // 6. Counter Stance Retaliation
        if (hasStatus(target, 'counter_stance') && element === ELEMENTS.Physical && attacker && attacker.hp > 0 && target.hp > 0) {
            let counterDmg = Math.max(1, Math.floor(target.atk * 1.0));
            logMsg(`${target.name} immediately retaliates with Counter Stance!`, "#f97316");
            floatText(target.id, "COUNTER!", "#f97316");
            applyDamage(attacker, counterDmg, ELEMENTS.Physical);
        }
        
        if(target.hp <= 0 && wasAlive) {
            logMsg(`${target.name} was defeated!`, "#ff8888");
            if(!player.questStats) player.questStats = { enemiesDefeated: 0, battlesWon: 0, bossesDefeated: 0 };
            player.questStats.enemiesDefeated = (player.questStats.enemiesDefeated || 0) + 1;
            if(target.isBoss) {
                player.questStats.bossesDefeated = (player.questStats.bossesDefeated || 0) + 1;
                if(typeof checkAchievements === 'function') checkAchievements();
            }
        }
        renderBattlefield();
    }
    /* =========================================================================
       SUB-MENUS (Skills & Items in battle)
       ========================================================================= */

    function openBattleSkills() {
        document.getElementById('battle-commands').classList.add('sub-menu-active');
        const content = document.getElementById('sub-menu-content');
        
        let html = '';
        player.skills.forEach(skillName => {
            const skill = SKILLS_DB[skillName];
            const cost = getSkillCost(skill);
            const canCast = pStats.mp >= cost;
            html += `<button class="btn" style="width:100%; text-align:left; padding:8px 10px; font-size:13px; margin:2px 0;" ${canCast?'':'disabled'} onclick="selectSkill('${skillName}')">
                        <b>${skill.name}</b> (${cost} MP) - <span style="font-size:11px; color:#aaa;">${skill.element}</span>
                     </button>`;
        });
        content.innerHTML = html;
    }

    function selectSkill(skillName) {
        const skill = SKILLS_DB[skillName];
        if(skill.target === 'ally_single') {
            let playerEnt = getPlayerCombatEntity();
            if (hasStatus(playerEnt, 'silence')) {
                logMsg("Hero is Silenced and cannot cast spells!", "#94a3b8");
                floatText('battle-player', "SILENCED", "#94a3b8");
                return;
            }
            let cost = getSkillCost(skill);
            player.baseStats.mp -= cost;
            pStats.mp -= cost;
            let heal = skill.power + Math.floor(pStats.matk / 2);
            if (hasStatus(playerEnt, 'burn')) heal = Math.floor(heal * 0.7);
            
            let decayDmg = 0;
            if (hasStatus(playerEnt, 'decay')) {
                decayDmg = Math.floor(heal * 0.25);
                heal = Math.max(0, heal - decayDmg);
                logMsg(`Hero's Decay corrupted healing into ${decayDmg} damage!`, "#a855f7");
            }
            player.baseStats.hp = Math.min(pStats.maxHp, pStats.hp + heal - decayDmg);
            pStats.hp = player.baseStats.hp;
            logMsg(`Hero casts ${skill.name}! Restored ${heal} HP.`, "#55ff55");
            floatText('battle-player', `+${heal}`, '#55ff55');

            // Tactical Buffs
            if (skill.name === 'Heal') {
                applyStatus(playerEnt, 'regeneration', 3);
            } else if (skill.name === 'Recovery') {
                let shieldVal = Math.floor(pStats.maxHp * 0.15);
                applyStatus(playerEnt, 'divine_barrier', 3, shieldVal);
            }

            renderBattlefield();
            closeSubMenu();
            document.querySelectorAll('#cmd-main .btn').forEach(b => b.disabled = true);
            triggerRegen();
            processStatusesEndTurn(playerEnt);
            setCombatTimeout(processNextTurn, 1000);
        } else if (skill.target === 'enemy_all') {
            closeSubMenu();
            executePlayerSkill(skill, null);
        } else {
            logMsg(`Select a target for ${skill.name}.`);
            enterTargetingMode(skill);
        }
    }
    function openBattleItems() {
        document.getElementById('battle-commands').classList.add('sub-menu-active');
        const content = document.getElementById('sub-menu-content');
        
        let html = '';
        let hasItems = false;
        let consumablesMap = (player.inventory && player.inventory.consumables) ? player.inventory.consumables : player.inventory;
        
        for(let itemName in consumablesMap) {
            let item = ITEMS_DB[itemName];
            let qty = consumablesMap[itemName];
            if(item && item.type === 'consumable' && qty > 0) {
                hasItems = true;
                html += `<button class="btn" style="width:100%; text-align:left; padding:8px 10px; font-size:13px; margin:2px 0;" onclick="useItemInBattle('${itemName}')">
                            <b>${itemName} x${qty}</b><br><span style="font-size:11px; color:#aaa;">${item.desc}</span>
                         </button>`;
            }
        }
        if(!hasItems) {
            html = "<p style='color:#aaa; text-align:center; padding:15px;'>No consumable items available.</p>";
        }
        content.innerHTML = html;
    }

    function useItemInBattle(itemName) {
        const item = ITEMS_DB[itemName];
        if(!item) return;

        // Smoke Bomb boss check before consuming
        if(item.effect === 'smoke_bomb') {
            if(battleState.enemies && battleState.enemies.some(e => e.isBoss)) {
                logMsg("Smoke Bomb has no effect against Bosses!", "#ff5555");
                showToast("Boss Battle", "Cannot flee from boss encounters!", "warning");
                return;
            }
            if(player.inventory && player.inventory.consumables && player.inventory.consumables[itemName] !== undefined) {
                player.inventory.consumables[itemName]--;
            } else if(player.inventory) {
                player.inventory[itemName]--;
            }
            logMsg("Hero vanishes in a cloud of smoke!", "#a855f7");
            clearAllCombatTimers();
            battleState.active = false;
            if(typeof updateSaveLoadButtons === 'function') updateSaveLoadButtons(false);
            showToast("Escaped", "Vanished safely using Smoke Bomb!", "info");
            switchScreen('town');
            return;
        }

        if(player.inventory && player.inventory.consumables && player.inventory.consumables[itemName] !== undefined) {
            player.inventory.consumables[itemName]--;
        } else if(player.inventory) {
            player.inventory[itemName]--;
        }
        
        if(item.effect === 'heal_hp') {
            let healVal = item.value || 50;
            player.baseStats.hp = Math.min(pStats.maxHp, pStats.hp + healVal);
            pStats.hp = player.baseStats.hp;
            logMsg(`Hero uses ${itemName}! Restored ${healVal} HP.`, "#55ff55");
            floatText('battle-player', `+${healVal}`, '#55ff55');
        } else if(item.effect === 'heal_hp_full') {
            player.baseStats.hp = pStats.maxHp;
            pStats.hp = pStats.maxHp;
            logMsg(`Hero uses ${itemName}! HP fully restored!`, "#55ff55");
            floatText('battle-player', "FULL HP", '#55ff55');
        } else if(item.effect === 'heal_mp') {
            let healVal = item.value || 30;
            player.baseStats.mp = Math.min(pStats.maxMp, pStats.mp + healVal);
            pStats.mp = player.baseStats.mp;
            logMsg(`Hero uses ${itemName}! Restored ${healVal} MP.`, "#5588ff");
            floatText('battle-player', `+${healVal}`, '#5588ff');
        } else if(item.effect === 'elixir') {
            let healHp = item.value || 250;
            let healMp = item.mpValue || 80;
            player.baseStats.hp = Math.min(pStats.maxHp, pStats.hp + healHp);
            player.baseStats.mp = Math.min(pStats.maxMp, pStats.mp + healMp);
            pStats.hp = player.baseStats.hp;
            pStats.mp = player.baseStats.mp;
            logMsg(`Hero drinks an Elixir! Restored ${healHp} HP and ${healMp} MP.`, "#ffd700");
            floatText('battle-player', `+${healHp} HP`, '#55ff55');
        } else if(item.effect === 'cleanse') {
            if(battleState.playerStatuses) {
                for(let sId in battleState.playerStatuses) {
                    let def = (typeof STATUS_TYPES_DB !== 'undefined') && STATUS_TYPES_DB[sId];
                    if(def && (def.type === 'dot' || def.type === 'disable' || def.type === 'debuff' || def.type === 'ailment')) {
                        delete battleState.playerStatuses[sId];
                    }
                }
            }
            logMsg("Hero cleansed all negative ailments!", "#38bdf8");
            floatText('battle-player', "CLEANSED", "#38bdf8");
        }
        
        renderBattlefield();
        closeSubMenu();
        document.querySelectorAll('#cmd-main .btn').forEach(b => b.disabled = true);
        triggerRegen();
        setCombatTimeout(processNextTurn, 1000);
    }

    function closeSubMenu() {
        document.getElementById('battle-commands').classList.remove('sub-menu-active');
    }

    function attemptFlee() {
        if(Math.random() > 0.5) {
            logMsg("Fled from battle successfully!");
            clearAllCombatTimers();
            battleState.active = false; 
            if(typeof updateSaveLoadButtons === 'function') updateSaveLoadButtons(false);
            setCombatTimeout(() => { 
                switchScreen('town'); 
            }, 1000, true);
        } else {
            logMsg("Failed to flee!");
            document.querySelectorAll('#cmd-main .btn').forEach(b => b.disabled = true);
            triggerRegen();
            setCombatTimeout(processNextTurn, 1000);
        }
    }

    /* =========================================================================
       ENEMY AI
       ========================================================================= */

    function executeEnemyTurn(enemy) {
        logMsg(`${enemy.name}'s turn...`);
        animateAction(enemy.id);

        let turnSkipped = processStatusesStartTurn(enemy);
        if (turnSkipped) {
            return;
        }

        if(enemy.armorBreakTurns !== undefined && enemy.armorBreakTurns > 0) {
            enemy.armorBreakTurns--;
            if(enemy.armorBreakTurns <= 0 && enemy.originalDef !== undefined) {
                enemy.def = enemy.originalDef;
                delete enemy.originalDef;
                delete enemy.armorBreakTurns;
                logMsg(`${enemy.name}'s Defense returned to normal.`, "#aaccff");
            }
        }

        // Bleed check on enemy action
        if (hasStatus(enemy, 'bleed')) {
            let bDmg = Math.max(2, Math.floor(enemy.maxHp * 0.04) + 4);
            enemy.hp = Math.max(0, enemy.hp - bDmg);
            logMsg(`${enemy.name} suffers ${bDmg} bleed damage from moving!`, "#ef4444");
            floatText(enemy.id, `-${bDmg} Bleed`, "#ef4444");
            renderBattlefield();
            if (enemy.hp <= 0) {
                logMsg(`${enemy.name} was defeated by Bleed!`, "#ff8888");
                if(!player.questStats) player.questStats = { enemiesDefeated: 0, battlesWon: 0, bossesDefeated: 0 };
                player.questStats.enemiesDefeated = (player.questStats.enemiesDefeated || 0) + 1;
                if(enemy.isBoss) {
                    player.questStats.bossesDefeated = (player.questStats.bossesDefeated || 0) + 1;
                    if(typeof checkAchievements === 'function') checkAchievements();
                }
                setCombatTimeout(processNextTurn, 1000);
                return;
            }
        }
        
        setCombatTimeout(() => {
            let action = 'attack';
            if (enemy.ai === 'healer' && enemy.hp < enemy.maxHp * 0.5) action = 'heal';
            if (enemy.ai === 'magic' && Math.random() > 0.5) action = 'magic';
            if (enemy.ai === 'boss' && Math.random() > 0.7) action = 'magic';
            
            // Silence check on enemy AI
            if (hasStatus(enemy, 'silence') && (action === 'heal' || action === 'magic')) {
                logMsg(`${enemy.name} is Silenced and cannot cast spells! Forced to attack.`, "#94a3b8");
                action = 'attack';
            }

            // Blind check on enemy attack
            if (hasStatus(enemy, 'blind') && Math.random() < 0.4) {
                logMsg(`${enemy.name}'s attack missed due to Blindness!`, "#64748b");
                floatText('battle-player', "MISS", "#64748b");
                processStatusesEndTurn(enemy);
                setCombatTimeout(processNextTurn, 1000);
                return;
            }

            let playerEnt = getPlayerCombatEntity();

            if (action === 'heal') {
                let healAmount = Math.floor(enemy.matk * 2);
                if (hasStatus(enemy, 'burn')) healAmount = Math.floor(healAmount * 0.7);
                let decayDmg = 0;
                if (hasStatus(enemy, 'decay')) {
                    decayDmg = Math.floor(healAmount * 0.25);
                    healAmount = Math.max(0, healAmount - decayDmg);
                    logMsg(`${enemy.name}'s Decay corrupted healing into ${decayDmg} damage!`, "#a855f7");
                }
                enemy.hp = Math.min(enemy.maxHp, enemy.hp + healAmount - decayDmg);
                logMsg(`${enemy.name} casts Heal! Restores ${healAmount} HP.`, "#55ff55");
                floatText(enemy.id, `+${healAmount}`, "#55ff55");
            } 
            else if (action === 'magic') {
                let dmg = Math.max(1, Math.floor(enemy.matk * 1.5) - pStats.mdef);
                let armorBase = player.equipment && player.equipment.armor ? (player.equipment.armor.baseName || player.equipment.armor) : null;
                let playerElement = player.element || (armorBase && ITEMS_DB[armorBase] && ITEMS_DB[armorBase].element) || ELEMENTS.Physical;
                logMsg(`${enemy.name} casts a ${enemy.element} spell!`);
                applyDamage(playerEnt, dmg, enemy.element, enemy);
            } 
            else {
                let rawDmg = Math.floor(enemy.atk * 1.5);
                let playerDef = playerEnt.def;
                let mitigation = 20 / (20 + playerDef);
                let dmg = Math.max(1, Math.floor(rawDmg * mitigation));
                playerEnt.lastDefMitigated = Math.max(0, rawDmg - dmg);

                logMsg(`${enemy.name} attacks!`);
                applyDamage(playerEnt, dmg, ELEMENTS.Physical, enemy);
            }

            processStatusesEndTurn(enemy);
            renderBattlefield();
            
            setCombatTimeout(processNextTurn, 1000);
        }, 800);
    }
    function animateAction(elementId, animClass = 'anim-shake') {
        const el = document.getElementById(elementId);
        if(el) {
            el.classList.remove(animClass);
            void el.offsetWidth;
            el.classList.add(animClass);
        }
    }

    /* =========================================================================
       CLASS ADVANCEMENT UI & CONTROLLER
       ========================================================================= */

    function renderClassAdvancement() {
        const container = document.getElementById('class-advancement-content');
        if(!container) return;
        
        let currentClassId = player.currentClass || 'novice';
        let currentCls = (typeof CLASSES_DB !== 'undefined' && CLASSES_DB[currentClassId]) || CLASSES_DB['novice'];
        let tier = currentCls.tier || 0;
        let nextTier = tier + 1;
        let requiredLevel = nextTier === 1 ? 10 : (nextTier === 2 ? 25 : 50);

        let html = `
            <div style="background: rgba(30,30,40,0.8); border: 1px solid #444; border-radius: 8px; padding: 12px 16px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="font-size: 13px; color: #888;">Current Path:</span> 
                    <span style="font-size: 16px; font-weight: bold; color: #a855f7; margin-left: 6px;">${currentCls.name}</span>
                    <span style="background: #374151; font-size: 11px; padding: 2px 6px; border-radius: 4px; margin-left: 8px; color: #cbd5e1;">Tier ${tier}</span>
                </div>
                <div style="font-size: 13px; color: #cbd5e1;">
                    Hero Level: <span style="font-weight: bold; color: #ffd700;">${player.level}</span>
                </div>
            </div>
        `;

        if (tier >= 3) {
            html += `
                <div style="text-align: center; padding: 40px 20px; background: rgba(16,185,129,0.1); border: 1px solid #10b981; border-radius: 8px;">
                    <div style="font-size: 32px; margin-bottom: 10px;">👑</div>
                    <h3 style="color: #10b981; margin: 0 0 10px 0;">Apex Evolution Mastered</h3>
                    <p style="color: #cbd5e1; font-size: 14px; max-width: 500px; margin: 0 auto;">You have achieved the pinnacle of power as a <b>${currentCls.name}</b>. All apex multipliers and passives are fully realized.</p>
                </div>
            `;
            container.innerHTML = html;
            return;
        }

        // Find available advancements
        let available = [];
        for(let cid in CLASSES_DB) {
            let c = CLASSES_DB[cid];
            if (c.tier === nextTier && (c.parent === currentClassId || (tier === 0 && c.parent === null))) {
                available.push(c);
            }
        }

        if (player.level < requiredLevel) {
            html += `
                <div style="text-align: center; padding: 25px 20px; background: rgba(239,68,68,0.08); border: 1px dashed #ef4444; border-radius: 8px; margin-bottom: 15px;">
                    <div style="font-size: 26px; margin-bottom: 6px;">🔒</div>
                    <h4 style="color: #ef4444; margin: 0 0 6px 0;">Advancement Locked</h4>
                    <p style="color: #cbd5e1; font-size: 13px; margin: 0;">You must reach <b>Level ${requiredLevel}</b> to unlock your Tier ${nextTier} Evolution.<br>(Current Progress: Level ${player.level} / ${requiredLevel})</p>
                </div>
                <div style="font-size: 13px; font-weight: bold; color: #888; margin-bottom: 10px; text-transform: uppercase;">Upcoming Choices at Level ${requiredLevel}:</div>
            `;
        } else {
            html += `
                <div style="font-size: 14px; color: #10b981; margin-bottom: 12px; font-weight: bold;">
                    ✨ Tier ${nextTier} Advancement Available! Choose your specialized path:
                </div>
            `;
        }

        html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">`;

        for(let opt of available) {
            let canEvolve = player.level >= requiredLevel;
            
            // Format stat mods
            let modSpans = [];
            if(opt.statMods) {
                for(let stat in opt.statMods) {
                    let val = opt.statMods[stat];
                    let statLabel = stat.toUpperCase();
                    if(stat === 'maxHp') statLabel = 'HP';
                    if(stat === 'maxMp') statLabel = 'MP';
                    
                    if(stat === 'crit') {
                        let sign = val >= 0 ? `+${val}%` : `${val}%`;
                        let color = val >= 0 ? '#22c55e' : '#ef4444';
                        modSpans.push(`<span style="color:${color}; font-weight:bold;">${sign} ${statLabel}</span>`);
                    } else {
                        let pct = Math.round((val - 1) * 100);
                        let sign = pct >= 0 ? `+${pct}%` : `${pct}%`;
                        let color = pct >= 0 ? '#22c55e' : '#ef4444';
                        modSpans.push(`<span style="color:${color}; font-weight:bold;">${sign} ${statLabel}</span>`);
                    }
                }
            }

            let passiveHtml = '';
            if(opt.passiveName && opt.passiveDesc) {
                passiveHtml = `
                    <div style="margin-top: 10px; padding: 8px 10px; background: rgba(168,85,247,0.1); border-left: 3px solid #a855f7; border-radius: 4px;">
                        <div style="font-size: 12px; font-weight: bold; color: #c084fc;">⚡ Passive: ${opt.passiveName}</div>
                        <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">${opt.passiveDesc}</div>
                    </div>
                `;
            }

            html += `
                <div style="background: rgba(20,20,30,0.85); border: 1px solid ${canEvolve ? '#a855f7' : '#444'}; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <h3 style="margin: 0; color: #ffd700; font-size: 18px;">${opt.name}</h3>
                            <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: #374151; color: #cbd5e1;">Tier ${opt.tier}</span>
                        </div>
                        <p style="font-size: 12px; color: #94a3b8; margin: 0 0 10px 0; min-height: 32px;">${opt.desc}</p>
                        
                        <div style="font-size: 12px; margin-bottom: 6px; color: #aaa;">Stat Modifiers:</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; margin-bottom: 10px;">
                            ${modSpans.join('')}
                        </div>
                        
                        ${passiveHtml}
                    </div>

                    <div style="margin-top: 15px;">
                        <button class="btn" style="width: 100%; background: ${canEvolve ? '#8b5cf6' : '#374151'}; color: ${canEvolve ? '#ffffff' : '#888'}; font-weight: bold;" 
                                ${canEvolve ? '' : 'disabled'} 
                                onclick="advanceClass('${opt.id}')">
                            ${canEvolve ? 'Choose ' + opt.name : 'Requires Level ' + requiredLevel}
                        </button>
                    </div>
                </div>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;
    }

    function advanceClass(classId) {
        const cls = CLASSES_DB[classId];
        if(!cls) return;
        player.currentClass = classId;
        computeStats();
        updateHeader();
        renderStats();
        renderClassAdvancement();
        showToast('Class Evolution Achieved!', `You have evolved into a ${cls.name}!`, 'level', 5000);
    }

    /* =========================================================================
       BATTLE RESOLUTION
       ========================================================================= */

    function winBattle() {
        clearAllCombatTimers();
        battleState.active = false;
        if(typeof updateSaveLoadButtons === 'function') updateSaveLoadButtons(false);
        
        let multi = 1.0;
        if(battleState.initialEnemyCount === 2) multi = 1.5;
        if(battleState.initialEnemyCount === 3) multi = 2.2;
        if(battleState.initialEnemyCount === 4) multi = 3.0;
        if(battleState.initialEnemyCount === 5) multi = 4.0;
        
        let baseExp = 0;
        let baseGold = 0;
        let droppedItems = {};
        
        let treasureSenseMod = player.skillTree && player.skillTree.treasureSense > 0 ? 1.5 : 1.0;
        let fortuneMult = player.skillTree && player.skillTree.fortune > 0 ? (1 + player.skillTree.fortune * 0.03) : 1;

        let goldBonusMult = 1 + ((pStats && pStats.goldBonus) ? pStats.goldBonus / 100 : 0);

        battleState.enemies.forEach(e => {
            baseExp += e.exp;
            baseGold += e.gold;
            
            if(e.loot) {
                e.loot.forEach(l => {
                    if(Math.random() <= (l.chance * treasureSenseMod)) {
                        let baseItem = ITEMS_DB[l.item];
                        if(baseItem && baseItem.type !== 'consumable') {
                            let rarity = 'Common';
                            if(e.isBoss) {
                                let r = Math.random() * 100;
                                if(r < 3) rarity = 'Mythic';
                                else if(r < 15) rarity = 'Legendary';
                                else if(r < 50) rarity = 'Epic';
                                else rarity = 'Rare';
                            } else {
                                let r = Math.random() * 10000;
                                let mChance = 5 * treasureSenseMod;
                                let lChance = 45 * treasureSenseMod;
                                let eChance = 250 * treasureSenseMod;
                                let rChance = 900 * treasureSenseMod;
                                let uChance = 2800 * treasureSenseMod;
                                if(r < mChance) rarity = 'Mythic';
                                else if(r < mChance + lChance) rarity = 'Legendary';
                                else if(r < mChance + lChance + eChance) rarity = 'Epic';
                                else if(r < mChance + lChance + eChance + rChance) rarity = 'Rare';
                                else if(r < mChance + lChance + eChance + rChance + uChance) rarity = 'Uncommon';
                                else rarity = 'Common';
                            }
                            let itemInstance = generateItem(l.item, rarity);
                            if(!player.inventory.equipment) player.inventory.equipment = [];
                            player.inventory.equipment.push(itemInstance);
                            
                            droppedItems[itemInstance.name + ' [' + itemInstance.rarity + ']'] = 1;
                            showToast('Loot Drop!', `${itemInstance.name} (${itemInstance.rarity})`, 'quest', 4000);
                        } else {
                            if(!player.inventory.consumables) player.inventory.consumables = {};
                            player.inventory.consumables[l.item] = (player.inventory.consumables[l.item] || 0) + 1;
                            droppedItems[l.item] = (droppedItems[l.item] || 0) + 1;
                        }
                    }
                });
            }
        });
        let totalExp = Math.round(baseExp * multi);
        let totalGold = Math.round(baseGold * multi * fortuneMult * goldBonusMult);
        
        logMsg("You won the battle!", "#55ff55");
        logMsg(`Gained ${totalExp} EXP and ${totalGold} Gold (Multiplier: ${multi}x).`, "#55ff55");
        
        let hasLoot = false;
        for(let item in droppedItems) {
            hasLoot = true;
            logMsg(`Loot Drop: ${item} x${droppedItems[item]}!`, "#ffd700");
        }
        if(!hasLoot) logMsg("No items dropped.", "#aaaaaa");
        
        player.exp += totalExp;
        player.gold += totalGold;
        
        if(!player.questStats) player.questStats = { enemiesDefeated: 0, battlesWon: 0, bossesDefeated: 0 };
        player.questStats.battlesWon = (player.questStats.battlesWon || 0) + 1;
        
        // Zone Conquest & Progression Unlock
        let defeatedBoss = battleState.enemies.find(e => e.isBoss);
        if(defeatedBoss && typeof AREAS_DB !== 'undefined') {
            for(let aId in AREAS_DB) {
                let a = AREAS_DB[aId];
                if(a.boss && a.boss.name === defeatedBoss.name) {
                    let num = parseInt(aId.split('_')[1]);
                    let nextId = `area_${num + 1}`;
                    if(AREAS_DB[nextId] && player.unlockedAreas && !player.unlockedAreas.includes(nextId)) {
                        player.unlockedAreas.push(nextId);
                        let nextA = AREAS_DB[nextId];
                        logMsg(`★ VICTORY! Zone Conquered: ${a.name}!`, "#ffd700");
                        logMsg(`★ New Region Unlocked: ${nextA.name} (${nextA.bracket})!`, "#38bdf8");
                        showToast('Zone Conquered!', `${nextA.name} Unlocked!`, 'quest', 5000);
                    }
                    break;
                }
            }
        }

        if(typeof checkAchievements === 'function') checkAchievements();
        
        updateHeader();
        
        setCombatTimeout(() => {
            checkLevelUp();
            switchScreen('town');
        }, 3500, true); 
    }

    function loseBattle() {
        clearAllCombatTimers();
        battleState.active = false;
        if(typeof updateSaveLoadButtons === 'function') updateSaveLoadButtons(false);
        logMsg("Hero was defeated...", "#ff0000");
        setCombatTimeout(() => {
            showToast("Defeat", "Game Over! Returning to town with 1 HP.", "info", 4000);
            player.baseStats.hp = 1;
            pStats.hp = 1;
            player.gold = Math.floor(player.gold / 2); 
            updateHeader();
            switchScreen('town');
        }, 2000, true);
    }

    init();
