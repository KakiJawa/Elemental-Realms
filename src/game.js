/* =========================================================================







       STATE VARIABLES







       ========================================================================= */















    let player = {};







    let pStats = {}; 















    let spireRun = {







        active: false,







        currentFloor: 1,







        shardsEarned: 0,







        hourglassUsed: false







    };















    let battleState = {
            minions: [],
            soulRemnants: 0,







        active: false,







        initialEnemyCount: 1, 







        enemies: [],







        turnQueue: [],







        targetingMode: null, 







        log: []







    };























/* =========================================================================







   ZERO-ASSET WEB AUDIO SYNTHESIZER & JUICE ENGINE







   ========================================================================= */















let audioSettings = { volume: 0.8, muted: false };







try {







    const savedAudio = (typeof localStorage !== 'undefined') ? localStorage.getItem('er_audio_settings') : null;







    if (savedAudio) {







        audioSettings = JSON.parse(savedAudio);







    }







} catch(e) {}















const audioState = {







    ctx: null,







    masterGain: null,







    volume: typeof audioSettings.volume === 'number' ? audioSettings.volume : 0.8,







    muted: !!audioSettings.muted







};















function initAudioContext() {







    if (audioState.ctx) return;







    if (typeof window === 'undefined') return;







    const AudioCtx = window.AudioContext || window.webkitAudioContext;







    if (!AudioCtx) return;







    try {







        audioState.ctx = new AudioCtx();







        audioState.masterGain = audioState.ctx.createGain();







        audioState.masterGain.gain.setValueAtTime(audioState.muted ? 0 : audioState.volume, audioState.ctx.currentTime);







        audioState.masterGain.connect(audioState.ctx.destination);







    } catch (e) {







        // AudioContext blocked or not supported







    }







}















function resumeAudio() {







    initAudioContext();







    if (audioState.ctx && audioState.ctx.state === 'suspended') {







        try {







            audioState.ctx.resume().catch(() => {});







        } catch(e) {}







    }







}















function updateAudioButton() {







    if (typeof document === 'undefined') return;







    const btn = document.getElementById('btn-hdr-audio');







    if (!btn) return;







    if (audioState.muted || audioState.volume <= 0) {







        btn.innerText = '🔇';







        btn.title = 'Sound: Muted';







    } else if (audioState.volume <= 0.4) {







        btn.innerText = '🔉';







        btn.title = 'Sound: Low (30%)';







    } else {







        btn.innerText = '🔊';







        btn.title = `Sound: High (${Math.round(audioState.volume * 100)}%)`;







    }







}















function toggleAudio() {







    initAudioContext();







    resumeAudio();







    if (!audioState.muted && audioState.volume >= 0.5) {







        audioState.volume = 0.3;







        audioState.muted = false;







    } else if (!audioState.muted && audioState.volume > 0) {







        audioState.volume = 0.0;







        audioState.muted = true;







    } else {







        audioState.volume = 0.8;







        audioState.muted = false;







    }















    if (audioState.masterGain && audioState.ctx) {







        try {







            audioState.masterGain.gain.setValueAtTime(audioState.muted ? 0 : audioState.volume, audioState.ctx.currentTime);







        } catch(e) {}







    }















    try {







        if (typeof localStorage !== 'undefined') {







            localStorage.setItem('er_audio_settings', JSON.stringify({ volume: audioState.volume, muted: audioState.muted }));







        }







    } catch(e) {}















    updateAudioButton();







}















function createNoiseBuffer(ctx, duration = 0.1) {







    try {







        const size = Math.floor(ctx.sampleRate * duration);







        const buf = ctx.createBuffer(1, size, ctx.sampleRate);







        const data = buf.getChannelData(0);







        for (let i = 0; i < size; i++) {







            data[i] = Math.random() * 2 - 1;







        }







        return buf;







    } catch(e) {







        return null;







    }







}















function playSFX(name) {







    if (audioState.muted || audioState.volume <= 0) return;







    if (typeof window === 'undefined') return;







    const AudioCtx = window.AudioContext || window.webkitAudioContext;







    if (!AudioCtx) return;















    try {







        initAudioContext();







        if (!audioState.ctx || !audioState.masterGain) return;







        if (audioState.ctx.state === 'suspended') {







            audioState.ctx.resume().catch(() => {});







        }















        const ctx = audioState.ctx;







        const now = ctx.currentTime;







        const master = audioState.masterGain;















        switch(name) {







            case 'slash': {







                const osc = ctx.createOscillator();







                const gain = ctx.createGain();







                osc.type = 'sawtooth';







                osc.frequency.setValueAtTime(700, now);







                osc.frequency.exponentialRampToValueAtTime(100, now + 0.09);







                gain.gain.setValueAtTime(0.35, now);







                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);







                osc.connect(gain);







                gain.connect(master);







                osc.start(now);







                osc.stop(now + 0.09);















                const noiseBuf = createNoiseBuffer(ctx, 0.06);







                if (noiseBuf) {







                    const noise = ctx.createBufferSource();







                    const nFilter = ctx.createBiquadFilter();







                    const nGain = ctx.createGain();







                    noise.buffer = noiseBuf;







                    nFilter.type = 'highpass';







                    nFilter.frequency.value = 1000;







                    nGain.gain.setValueAtTime(0.2, now);







                    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);







                    noise.connect(nFilter);







                    nFilter.connect(nGain);







                    nGain.connect(master);







                    noise.start(now);







                }







                break;







            }







            case 'crit': {







                const osc1 = ctx.createOscillator();







                const g1 = ctx.createGain();







                osc1.type = 'square';







                osc1.frequency.setValueAtTime(140, now);







                osc1.frequency.exponentialRampToValueAtTime(35, now + 0.18);







                g1.gain.setValueAtTime(0.45, now);







                g1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);







                osc1.connect(g1);







                g1.connect(master);







                osc1.start(now);







                osc1.stop(now + 0.18);















                const sub = ctx.createOscillator();







                const subG = ctx.createGain();







                sub.type = 'sine';







                sub.frequency.setValueAtTime(120, now);







                sub.frequency.exponentialRampToValueAtTime(30, now + 0.18);







                subG.gain.setValueAtTime(0.55, now);







                subG.gain.exponentialRampToValueAtTime(0.001, now + 0.18);







                sub.connect(subG);







                subG.connect(master);







                sub.start(now);







                sub.stop(now + 0.18);















                const noiseBuf = createNoiseBuffer(ctx, 0.08);







                if (noiseBuf) {







                    const noise = ctx.createBufferSource();







                    const nGain = ctx.createGain();







                    noise.buffer = noiseBuf;







                    nGain.gain.setValueAtTime(0.3, now);







                    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);







                    noise.connect(nGain);







                    nGain.connect(master);







                    noise.start(now);







                }







                break;







            }







            case 'magic_fire': {







                const noiseBuf = createNoiseBuffer(ctx, 0.28);







                if (noiseBuf) {







                    const noise = ctx.createBufferSource();







                    const filter = ctx.createBiquadFilter();







                    const gain = ctx.createGain();







                    noise.buffer = noiseBuf;







                    filter.type = 'lowpass';







                    filter.frequency.setValueAtTime(300, now);







                    filter.frequency.linearRampToValueAtTime(1200, now + 0.12);







                    filter.frequency.exponentialRampToValueAtTime(200, now + 0.28);







                    gain.gain.setValueAtTime(0.4, now);







                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);







                    noise.connect(filter);







                    filter.connect(gain);







                    gain.connect(master);







                    noise.start(now);







                }







                break;







            }







            case 'magic_ice': {







                [1200, 1600, 2400].forEach((freq, idx) => {







                    const osc = ctx.createOscillator();







                    const gain = ctx.createGain();







                    const start = now + (idx * 0.04);







                    osc.type = 'triangle';







                    osc.frequency.setValueAtTime(freq, start);







                    gain.gain.setValueAtTime(0.25, start);







                    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);







                    osc.connect(gain);







                    gain.connect(master);







                    osc.start(start);







                    osc.stop(start + 0.12);







                });







                break;







            }







            case 'magic_lightning': {







                const osc = ctx.createOscillator();







                const gain = ctx.createGain();







                osc.type = 'sawtooth';







                osc.frequency.setValueAtTime(400, now);







                osc.frequency.linearRampToValueAtTime(120, now + 0.15);







                gain.gain.setValueAtTime(0.35, now);







                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);







                osc.connect(gain);







                gain.connect(master);







                osc.start(now);







                osc.stop(now + 0.15);















                const noiseBuf = createNoiseBuffer(ctx, 0.1);







                if (noiseBuf) {







                    const noise = ctx.createBufferSource();







                    const nGain = ctx.createGain();







                    noise.buffer = noiseBuf;







                    nGain.gain.setValueAtTime(0.25, now);







                    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);







                    noise.connect(nGain);







                    nGain.connect(master);







                    noise.start(now);







                }







                break;







            }







            case 'magic_holy': {







                [440, 554, 659].forEach((f, idx) => {







                    const osc = ctx.createOscillator();







                    const gain = ctx.createGain();







                    const start = now + (idx * 0.05);







                    osc.type = 'sine';







                    osc.frequency.setValueAtTime(f, start);







                    gain.gain.setValueAtTime(0.3, start);







                    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);







                    osc.connect(gain);







                    gain.connect(master);







                    osc.start(start);







                    osc.stop(start + 0.35);







                });







                break;







            }







            case 'magic_dark': {







                const osc = ctx.createOscillator();







                const gain = ctx.createGain();







                osc.type = 'sawtooth';







                osc.frequency.setValueAtTime(80, now);







                osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);







                gain.gain.setValueAtTime(0.4, now);







                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);







                osc.connect(gain);







                gain.connect(master);







                osc.start(now);







                osc.stop(now + 0.35);







                break;







            }







            case 'shield_absorb': {







                const osc = ctx.createOscillator();







                const gain = ctx.createGain();







                osc.type = 'triangle';







                osc.frequency.setValueAtTime(880, now);







                gain.gain.setValueAtTime(0.35, now);







                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);







                osc.connect(gain);







                gain.connect(master);







                osc.start(now);







                osc.stop(now + 0.15);







                break;







            }







            case 'shield_break': {







                const noiseBuf = createNoiseBuffer(ctx, 0.1);







                if (noiseBuf) {







                    const noise = ctx.createBufferSource();







                    const nGain = ctx.createGain();







                    noise.buffer = noiseBuf;







                    nGain.gain.setValueAtTime(0.35, now);







                    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);







                    noise.connect(nGain);







                    nGain.connect(master);







                    noise.start(now);







                }















                const osc = ctx.createOscillator();







                const gain = ctx.createGain();







                osc.type = 'triangle';







                osc.frequency.setValueAtTime(450, now);







                osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);







                gain.gain.setValueAtTime(0.3, now);







                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);







                osc.connect(gain);







                gain.connect(master);







                osc.start(now);







                osc.stop(now + 0.25);







                break;







            }







            case 'dodge': {







                const noiseBuf = createNoiseBuffer(ctx, 0.12);







                if (noiseBuf) {







                    const noise = ctx.createBufferSource();







                    const filter = ctx.createBiquadFilter();







                    const gain = ctx.createGain();







                    noise.buffer = noiseBuf;







                    filter.type = 'highpass';







                    filter.frequency.setValueAtTime(1200, now);







                    gain.gain.setValueAtTime(0.05, now);







                    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);







                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);







                    noise.connect(filter);







                    filter.connect(gain);







                    gain.connect(master);







                    noise.start(now);







                }







                break;







            }







            case 'enemy_death': {







                const osc = ctx.createOscillator();







                const gain = ctx.createGain();







                osc.type = 'square';







                osc.frequency.setValueAtTime(220, now);







                osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);







                gain.gain.setValueAtTime(0.3, now);







                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);







                osc.connect(gain);







                gain.connect(master);







                osc.start(now);







                osc.stop(now + 0.3);







                break;







            }







            case 'level_up': {







                [261.63, 329.63, 392.00, 523.25].forEach((f, idx) => {







                    const osc = ctx.createOscillator();







                    const gain = ctx.createGain();







                    const start = now + (idx * 0.08);







                    const dur = (idx === 3) ? 0.35 : 0.08;







                    osc.type = 'square';







                    osc.frequency.setValueAtTime(f, start);







                    gain.gain.setValueAtTime(0.25, start);







                    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);







                    osc.connect(gain);







                    gain.connect(master);







                    osc.start(start);







                    osc.stop(start + dur);







                });







                break;







            }







            case 'victory': {







                [392, 523.25, 659.25, 783.99].forEach((f, idx) => {







                    const osc = ctx.createOscillator();







                    const gain = ctx.createGain();







                    const start = now + (idx * 0.1);







                    const dur = (idx === 3) ? 0.45 : 0.12;







                    osc.type = 'triangle';







                    osc.frequency.setValueAtTime(f, start);







                    gain.gain.setValueAtTime(0.3, start);







                    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);







                    osc.connect(gain);







                    gain.connect(master);







                    osc.start(start);







                    osc.stop(start + dur);







                });







                break;







            }







            case 'coin': {







                const cNotes = [{ f: 987, d: 0.06 }, { f: 1318, d: 0.22 }];







                let cTime = now;







                cNotes.forEach(n => {







                    const osc = ctx.createOscillator();







                    const gain = ctx.createGain();







                    osc.type = 'sine';







                    osc.frequency.setValueAtTime(n.f, cTime);







                    gain.gain.setValueAtTime(0.3, cTime);







                    gain.gain.exponentialRampToValueAtTime(0.001, cTime + n.d);







                    osc.connect(gain);







                    gain.connect(master);







                    osc.start(cTime);







                    osc.stop(cTime + n.d);







                    cTime += n.d * 0.7;







                });







                break;







            }







            case 'anvil': {







                [320, 840, 1680].forEach(f => {







                    const osc = ctx.createOscillator();







                    const gain = ctx.createGain();







                    osc.type = 'triangle';







                    osc.frequency.setValueAtTime(f, now);







                    gain.gain.setValueAtTime(0.25, now);







                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);







                    osc.connect(gain);







                    gain.connect(master);







                    osc.start(now);







                    osc.stop(now + 0.25);







                });







                const noiseBuf = createNoiseBuffer(ctx, 0.05);







                if (noiseBuf) {







                    const noise = ctx.createBufferSource();







                    const nGain = ctx.createGain();







                    noise.buffer = noiseBuf;







                    nGain.gain.setValueAtTime(0.3, now);







                    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);







                    noise.connect(nGain);







                    nGain.connect(master);







                    noise.start(now);







                }







                break;







            }







            case 'chest_shake': {







                const osc = ctx.createOscillator();







                const gain = ctx.createGain();







                osc.type = 'sine';







                osc.frequency.setValueAtTime(55, now);







                osc.frequency.linearRampToValueAtTime(65, now + 0.4);







                gain.gain.setValueAtTime(0.35, now);







                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);







                osc.connect(gain);







                gain.connect(master);







                osc.start(now);







                osc.stop(now + 0.4);







                break;







            }







            case 'chest_burst': {







                const osc = ctx.createOscillator();







                const gain = ctx.createGain();







                osc.type = 'sawtooth';







                osc.frequency.setValueAtTime(150, now);







                osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);







                gain.gain.setValueAtTime(0.35, now);







                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);







                osc.connect(gain);







                gain.connect(master);







                osc.start(now);







                osc.stop(now + 0.15);















                const noiseBuf = createNoiseBuffer(ctx, 0.08);







                if (noiseBuf) {







                    const noise = ctx.createBufferSource();







                    const nGain = ctx.createGain();







                    noise.buffer = noiseBuf;







                    nGain.gain.setValueAtTime(0.4, now);







                    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);







                    noise.connect(nGain);







                    nGain.connect(master);







                    noise.start(now);







                }







                break;







            }







            case 'chest_reveal_rare': {







                [1046.5, 1568].forEach((f, idx) => {







                    const osc = ctx.createOscillator();







                    const gain = ctx.createGain();







                    const start = now + (idx * 0.08);







                    osc.type = 'sine';







                    osc.frequency.setValueAtTime(f, start);







                    gain.gain.setValueAtTime(0.3, start);







                    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);







                    osc.connect(gain);







                    gain.connect(master);







                    osc.start(start);







                    osc.stop(start + 0.3);







                });







                break;







            }







            case 'chest_reveal_legendary': {







                const legChords = [







                    { f: 349.23, start: 0, dur: 0.15 },







                    { f: 440, start: 0, dur: 0.15 },







                    { f: 523.25, start: 0, dur: 0.15 },







                    { f: 523.25, start: 0.15, dur: 0.4 },







                    { f: 659.25, start: 0.15, dur: 0.4 },







                    { f: 783.99, start: 0.15, dur: 0.4 }







                ];







                legChords.forEach(c => {







                    const osc = ctx.createOscillator();







                    const gain = ctx.createGain();







                    osc.type = 'sawtooth';







                    osc.frequency.setValueAtTime(c.f, now + c.start);







                    gain.gain.setValueAtTime(0.2, now + c.start);







                    gain.gain.exponentialRampToValueAtTime(0.001, now + c.start + c.dur);







                    osc.connect(gain);







                    gain.connect(master);







                    osc.start(now + c.start);







                    osc.stop(now + c.start + c.dur);







                });







                break;







            }







            case 'chest_reveal_mythic': {







                const mythNotes = [523.25, 659.25, 783.99, 987.77, 1046.5];







                mythNotes.forEach((f, idx) => {







                    const osc = ctx.createOscillator();







                    const gain = ctx.createGain();







                    const start = now + (idx * 0.08);







                    const dur = (idx === mythNotes.length - 1) ? 0.6 : 0.15;







                    osc.type = 'triangle';







                    osc.frequency.setValueAtTime(f, start);







                    gain.gain.setValueAtTime(0.3, start);







                    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);







                    osc.connect(gain);







                    gain.connect(master);







                    osc.start(start);







                    osc.stop(start + dur);







                });







                break;







            }







            default:







                break;







        }







    } catch(e) {







        // Safe fail on any audio error







    }







}















if (typeof window !== 'undefined') {







    const handleFirstGesture = () => {







        resumeAudio();







        window.removeEventListener('click', handleFirstGesture);







        window.removeEventListener('keydown', handleFirstGesture);







        window.removeEventListener('touchstart', handleFirstGesture);







    };







    window.addEventListener('click', handleFirstGesture, { passive: true });







    window.addEventListener('keydown', handleFirstGesture, { passive: true });







    window.addEventListener('touchstart', handleFirstGesture, { passive: true });







}















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







        if (baseItem.goldBonus) baseStats.goldBonus = baseItem.goldBonus;















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

        const maxToasts = (typeof window !== 'undefined' && window.innerWidth <= 600) ? 2 : 3;
        while (container.children.length >= maxToasts) {
            container.firstElementChild.remove();
        }

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







                    if (item.baseStats.goldBonus) pStats.goldBonus = (pStats.goldBonus || 0) + item.baseStats.goldBonus;







                }







                if (item.goldBonus) pStats.goldBonus = (pStats.goldBonus || 0) + item.goldBonus;







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







                if (eq.goldBonus) pStats.goldBonus = (pStats.goldBonus || 0) + eq.goldBonus;







            }







        }







        // Add Skill Tree Stats







        if(player.skillTree) {







            pStats.maxHp += (player.skillTree.vitalityTraining || 0) * 10;







            pStats.maxMp += (player.skillTree.spiritTraining || 0) * 5;







            pStats.atk += (player.skillTree.atkTraining || 0) * 2;







            pStats.def += (player.skillTree.defTraining || 0) * 2;







            pStats.crit += (player.skillTree.critTraining || 0) * 2;







            pStats.matk = (pStats.matk || 0) + (player.skillTree.arcaneTraining || 0) * 2;







            pStats.mdef = (pStats.mdef || 0) + (player.skillTree.ironSkin || 0) * 2;







            pStats.spd = (pStats.spd || 0) + (player.skillTree.spdTraining || 0) * 1;







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















        // Boss Gold Mastery Elemental Resistance (+1% per Gold Mastered Boss: 25+ kills)







        pStats.elementalResistances = pStats.elementalResistances || {};







        if (player.bestiary && typeof AREAS_DB !== 'undefined') {







            const aKeys = (typeof getAllAreaKeys === 'function') ? getAllAreaKeys() : Object.keys(AREAS_DB);







            aKeys.forEach(aKey => {







                const area = AREAS_DB[aKey];







                if (area && area.boss && area.boss.name) {







                    const bossKills = player.bestiary[area.boss.name] || 0;







                    if (bossKills >= 25 && area.boss.element) {







                        pStats.elementalResistances[area.boss.element] = (pStats.elementalResistances[area.boss.element] || 0) + 1;







                    }







                }







            });







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















        // Infinite Spire: Permanent Tomes & Relic Stats







        if (player.spire) {







            if (player.spire.tomesUsed) {







                pStats.maxHp += (player.spire.tomesUsed.hp || 0) * 20;







                pStats.atk += (player.spire.tomesUsed.atk || 0) * 3;







                pStats.matk += (player.spire.tomesUsed.atk || 0) * 3;







                pStats.maxMp += (player.spire.tomesUsed.mp || 0) * 10;







            }







            if (player.spire.equippedRelic === 'celestial_feather') {







                pStats.spd += 15;







                pStats.crit += 10;







            }







        }















        // Companion Pets & Familiars Passive Stat Stacking







        if (player.pets && Array.isArray(player.pets.active) && typeof PETS_DB !== 'undefined') {







            if (player.level < 25) {







                player.pets.active[1] = null;







            }







            player.pets.active.filter(Boolean).forEach(petId => {







                const pet = PETS_DB[petId];







                if (pet && pet.passive) {







                    const lvl = (player.pets.levels && player.pets.levels[petId] && player.pets.levels[petId].level) || 1;







                    const scale = 1 + ((lvl - 1) * 0.10);







                    let bStats = player.baseStats || {};







                    if (pet.passive.atkPct) pStats.atk += Math.max(1, Math.round((bStats.atk || 10) * (pet.passive.atkPct * scale / 100)));







                    if (pet.passive.defPct) pStats.def += Math.max(1, Math.round((bStats.def || 10) * (pet.passive.defPct * scale / 100)));







                    if (pet.passive.matkPct) pStats.matk += Math.max(1, Math.round((bStats.matk || 10) * (pet.passive.matkPct * scale / 100)));







                    if (pet.passive.mdefPct) pStats.mdef += Math.max(1, Math.round((bStats.mdef || 10) * (pet.passive.mdefPct * scale / 100)));







                    if (pet.passive.maxHpPct) pStats.maxHp += Math.max(1, Math.round((bStats.maxHp || 100) * (pet.passive.maxHpPct * scale / 100)));







                    if (pet.passive.maxMpPct) pStats.maxMp += Math.max(1, Math.round((bStats.maxMp || 50) * (pet.passive.maxMpPct * scale / 100)));







                    if (pet.passive.spd) pStats.spd += Math.round(pet.passive.spd * scale);







                    if (pet.passive.crit) pStats.crit += Math.round(pet.passive.crit * scale);







                    if (pet.passive.spdPct) pStats.spd += Math.max(1, Math.round((bStats.spd || 10) * (pet.passive.spdPct * scale / 100)));







                    if (pet.passive.critPct) pStats.crit += Math.round(pet.passive.critPct * scale);







                }







            });







        }















        // Mythic Set Bonuses for Main Hero
        if (typeof MYTHIC_SETS_DB !== 'undefined' && typeof hasHeroSetBonus === 'function') {
            const mainHero = (player.roster && player.roster[0]) || player;
            if (hasHeroSetBonus(mainHero, 'titans_bulwark', 2)) {
                pStats.maxHp = Math.round(pStats.maxHp * 1.25);
                pStats.def = Math.round(pStats.def * 1.20);
                pStats.mdef = Math.round(pStats.mdef * 1.20);
            }
            if (hasHeroSetBonus(mainHero, 'archons_voidweave', 2)) {
                pStats.matk = Math.round(pStats.matk * 1.25);
            }
            if (hasHeroSetBonus(mainHero, 'shadowstalker_regalia', 2)) {
                pStats.crit = (pStats.crit || 0) + 25;
                pStats.spd = (pStats.spd || 0) + 15;
            }
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







        const savesBtn = document.getElementById('btn-hdr-saves');







        if(savesBtn) {







            savesBtn.disabled = inBattle;







            savesBtn.style.opacity = inBattle ? '0.4' : '1.0';







            savesBtn.style.cursor = inBattle ? 'not-allowed' : 'pointer';







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







        document.getElementById('hdr-lvl').innerText = (player.level >= 50) ? '50 (MAX)' : player.level;







        document.getElementById('hdr-hp').innerText = pStats.hp;







        document.getElementById('hdr-maxhp').innerText = pStats.maxHp;







        document.getElementById('hdr-mp').innerText = pStats.mp;







        document.getElementById('hdr-maxmp').innerText = pStats.maxMp;







        document.getElementById('hdr-gold').innerText = player.gold;







        if(typeof updateTownQuestButton === 'function') updateTownQuestButton();







        if(typeof updateTownAchievementsButton === 'function') updateTownAchievementsButton();







        let spireBtnSub = document.getElementById('btn-town-spire-sub');







        if(spireBtnSub) spireBtnSub.innerText = `🌀 Floor ${player.spire?.highestFloor || 0}`;







        updateSaveLoadButtons();







        if(typeof updateAudioButton === 'function') updateAudioButton();







    }















    function switchScreen(screenId) {







        if (screenId !== 'battle') {







            if (typeof clearAllCombatTimers === 'function') clearAllCombatTimers();







        }







        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));







        document.getElementById('screen-' + screenId).classList.add('active');
        if (screenId === 'town' && typeof updateTownUI === 'function') updateTownUI();







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







        if (item && item.locked) {







            showToast('Item Protected', `${item.name} is locked! Unlock it first to salvage.`, 'info');







            return;







        }















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















        if (!player.blacksmithStats) player.blacksmithStats = {};
        player.blacksmithStats.itemsSalvaged = (player.blacksmithStats.itemsSalvaged || 0) + 1;

        showToast('Item Salvaged', `${item.name} dismantled: ${parts.join(', ')}`, 'info');















        updateHeader();







        renderBlacksmith();







        renderInventory();







    }















    function salvageEquipment(idOrIndex) {







        if (typeof idOrIndex === 'number' && player.inventory && player.inventory.equipment && player.inventory.equipment[idOrIndex]) {







            return salvageItem(player.inventory.equipment[idOrIndex].id);







        }







        return salvageItem(idOrIndex);







    }















    function salvageAllCommonUncommon() {







        if (!player || !player.inventory || !player.inventory.equipment) return;







        







        let matching = player.inventory.equipment.filter(i => !i.locked && (i.rarity === 'Common' || i.rarity === 'Uncommon'));







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















        // Remove matching items from inventory equipment, preserving locked gear







        player.inventory.equipment = player.inventory.equipment.filter(i => i.locked || (i.rarity !== 'Common' && i.rarity !== 'Uncommon'));















        if (!player.blacksmithStats) player.blacksmithStats = {};
        player.blacksmithStats.itemsSalvaged = (player.blacksmithStats.itemsSalvaged || 0) + matching.length;

        showToast('Bulk Salvage Complete', `Dismantled ${matching.length} items for +${totalScrap} Scraps, +${totalGold} Gold.`, 'info');















        updateHeader();







        renderBlacksmith();







        renderInventory();







    }















    function salvageBulk() {







        return salvageAllCommonUncommon();







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















        playSFX('anvil');







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















        if (!player.materials) player.materials = { scrap: 0, dust: 0, shard: 0 };
        if (typeof player.materials.ignis_heart === 'undefined') player.materials.ignis_heart = 0;
        if (typeof player.materials.abyssal_pearl === 'undefined') player.materials.abyssal_pearl = 0;
        if (typeof player.materials.chronos_riftcore === 'undefined') player.materials.chronos_riftcore = 0;

        // 1. Materials Bar
        let materialsHtml = `
            <div class="forge-materials-bar">
                <div class="forge-mat-item" style="color: #cbd5e1;">🔨 Scraps: <span style="color: #fff;">${player.materials.scrap || 0}</span></div>
                <div class="forge-mat-item" style="color: #38bdf8;">✨ Dust: <span style="color: #fff;">${player.materials.dust || 0}</span></div>
                <div class="forge-mat-item" style="color: #c084fc;">🔮 Shards: <span style="color: #fff;">${player.materials.shard || 0}</span></div>
                <div class="forge-mat-item" style="color: #f97316;">🔥 Ignis Heart: <span style="color: #fff;">${player.materials.ignis_heart || 0}</span></div>
                <div class="forge-mat-item" style="color: #0ea5e9;">🌊 Abyssal Pearl: <span style="color: #fff;">${player.materials.abyssal_pearl || 0}</span></div>
                <div class="forge-mat-item" style="color: #c084fc;">🌌 Chronos Riftcore: <span style="color: #fff;">${player.materials.chronos_riftcore || 0}</span></div>
                <div class="forge-mat-item" style="color: #ffd700;">💰 Gold: <span style="color: #fff;">${player.gold || 0}</span></div>
            </div>
        `;

        // 2. Navigation Tabs
        let tabsHtml = `
            <div class="forge-nav-tabs">
                <button class="forge-tab-btn ${blacksmithActiveTab === 'upgrade' ? 'active' : ''}" onclick="setBlacksmithTab('upgrade')">⚒️ Upgrade Forge (+1 to +5)</button>
                <button class="forge-tab-btn ${blacksmithActiveTab === 'reforge' ? 'active' : ''}" onclick="setBlacksmithTab('reforge')">🌀 Affix Reforger</button>
                <button class="forge-tab-btn ${blacksmithActiveTab === 'salvage' ? 'active' : ''}" onclick="setBlacksmithTab('salvage')">♻️ Salvage Station</button>
                <button class="forge-tab-btn ${blacksmithActiveTab === 'mythic' ? 'active' : ''}" onclick="setBlacksmithTab('mythic')">🌟 Mythic Forge</button>
            </div>
        `;

        let tabBodyHtml = '';
        if (blacksmithActiveTab === 'upgrade') {
            tabBodyHtml = renderUpgradeTabHtml();
        } else if (blacksmithActiveTab === 'reforge') {
            tabBodyHtml = renderReforgeTabHtml();
        } else if (blacksmithActiveTab === 'salvage') {
            tabBodyHtml = renderSalvageTabHtml();
        } else if (blacksmithActiveTab === 'mythic') {
            tabBodyHtml = (typeof renderMythicForgeTabHtml === 'function') ? renderMythicForgeTabHtml() : '<p>Loading Mythic Forge...</p>';
        }















        container.innerHTML = materialsHtml + tabsHtml + tabBodyHtml;







    }























    /* =========================================================================







       STATUS EFFECTS & TACTICAL COMBAT ENGINE







       ========================================================================= */















    function getHeroSpriteSvg(hero) {







        if (!hero) return '';







        if (hero.isMain) {







            return `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="40" fill="#f59e0b"/><rect x="45" y="10" width="10" height="80" fill="#fef3c7"/><rect x="20" y="45" width="60" height="10" fill="#fef3c7"/><circle cx="50" cy="50" r="16" fill="#d97706"/></svg>`;







        }







        const cls = hero.classId || 'warrior';







        if (cls === 'mage') {







            return `<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="50,15 20,75 80,75" fill="#7c3aed"/><circle cx="50" cy="50" r="18" fill="#c084fc"/><path d="M40,75 Q50,90 60,75" stroke="#e9d5ff" stroke-width="4" fill="none"/><circle cx="50" cy="30" r="6" fill="#fde047"/></svg>`;







        } else if (cls === 'rogue') {







            return `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="45" r="30" fill="#047857"/><path d="M30,35 Q50,20 70,35 Q60,65 50,70 Q40,65 30,35 Z" fill="#065f46"/><rect x="25" y="60" width="6" height="30" fill="#a7f3d0"/><rect x="69" y="60" width="6" height="30" fill="#a7f3d0"/></svg>`;







        } else if (cls === 'ranger' || cls === 'beastmaster' || cls === 'deadeye_sniper' || cls === 'primal_apex_lord' || cls === 'celestial_sharpshooter') {
            return `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50,15 L75,85 L50,70 L25,85 Z" fill="#16a34a"/><circle cx="50" cy="40" r="14" fill="#ca8a04"/><line x1="50" y1="20" x2="50" y2="80" stroke="#fef08a" stroke-width="3"/><path d="M25,50 Q50,25 75,50" stroke="#ca8a04" stroke-width="3" fill="none"/></svg>`;
        } else if (cls === 'cleric' || cls === 'high_priest' || cls === 'inquisitor' || cls === 'seraph_of_dawn' || cls === 'grand_justiciar') {
            return `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="40" fill="#f8fafc" stroke="#ffd700" stroke-width="4"/><path d="M50,15 L50,85 M25,40 L75,40" stroke="#ffd700" stroke-width="8" stroke-linecap="round"/><circle cx="50" cy="40" r="10" fill="#38bdf8"/><path d="M35,65 Q50,80 65,65" stroke="#38bdf8" stroke-width="3" fill="none"/></svg>`;
        } else if (cls === 'necromancer' || cls === 'dread_lich' || cls === 'bone_commander' || cls === 'lich_king_sovereign' || cls === 'lord_of_the_grave') {
            return `<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50,15 Q80,40 70,85 L30,85 Q20,40 50,15 Z" fill="#1e1b4b" stroke="#8b5cf6" stroke-width="2"/><circle cx="50" cy="45" r="14" fill="#cbd5e1"/><ellipse cx="45" cy="43" rx="3" ry="4" fill="#1e1b4b"/><ellipse cx="55" cy="43" rx="3" ry="4" fill="#1e1b4b"/><path d="M46,53 L54,53" stroke="#1e1b4b" stroke-width="2"/><circle cx="50" cy="45" r="17" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="3,2"/></svg>`;
        } else {







            return `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="38" fill="#b91c1c"/><rect x="46" y="15" width="8" height="70" fill="#fca5a5"/><rect x="25" y="35" width="50" height="8" fill="#fca5a5"/><circle cx="50" cy="50" r="14" fill="#991b1b"/></svg>`;







        }







    }















    function getLivingPartyHeroes() {







        if (!player || !player.activeParty || !player.roster) return [];







        return player.activeParty.map(id => player.roster.find(h => h.id === id)).filter(h => {







            if (!h) return false;







            let stats = (typeof computeHeroStats === 'function') ? computeHeroStats(h) : (h.baseStats || { maxHp: 100, hp: 100 });







            let curHp = h.isMain ? (pStats && pStats.hp !== undefined ? pStats.hp : player.baseStats.hp) : (h.hp !== undefined ? h.hp : (h.baseStats?.hp || stats.maxHp));







            return curHp > 0;







        });







    }















    function getHeroCombatEntity(hero) {
        if (hero && hero.isMinion) return hero;







        if (!hero || hero.isMain || hero.id === 'hero_main') {







            return getPlayerCombatEntity();







        }







        if (!hero._combatEntity) {







            hero._combatEntity = {







                id: 'battle-hero-' + hero.id,







                heroId: hero.id,







                name: hero.name,







                element: hero.element || ELEMENTS.Physical,







                hero: hero,







                get hp() {







                    let s = computeHeroStats(hero);







                    return hero.hp !== undefined ? hero.hp : (hero.baseStats?.hp || s.maxHp || 100);







                },







                set hp(val) {







                    let s = computeHeroStats(hero);







                    hero.hp = Math.max(0, Math.min(s.maxHp, val));







                    if (hero.baseStats) hero.baseStats.hp = hero.hp;







                },







                get maxHp() { return computeHeroStats(hero).maxHp || 100; },







                get mp() {







                    let s = computeHeroStats(hero);







                    return hero.mp !== undefined ? hero.mp : (hero.baseStats?.mp || s.maxMp || 50);







                },







                set mp(val) {







                    let s = computeHeroStats(hero);







                    hero.mp = Math.max(0, Math.min(s.maxMp, val));







                    if (hero.baseStats) hero.baseStats.mp = hero.mp;







                },







                get maxMp() { return computeHeroStats(hero).maxMp || 50; },







                get atk() {







                    let s = computeHeroStats(hero);







                    let mult = hasStatus(this, 'berserk') ? 1.4 : 1.0;







                    if (hasStatus(this, 'battle_cry')) mult *= 1.2;
                    if (hasStatus(this, 'beast_roar')) mult *= 1.2;
                    if (hasStatus(this, 'primal_roar')) mult *= 1.25;
                    if (hasStatus(this, 'curse')) mult *= 0.8;







                    return Math.floor(s.atk * mult);







                },







                get def() {







                    let s = computeHeroStats(hero);







                    let mult = 1.0;







                    if (hasStatus(this, 'armor_break')) mult *= 0.7;







                    if (hasStatus(this, 'berserk')) mult *= 0.75;
                    if (hasStatus(this, 'sanctuary_protection')) mult *= 1.15;







                    return Math.max(0, Math.floor(s.def * mult));







                },







                get matk() {
                    let s = computeHeroStats(hero);
                    let mult = 1.0;
                    if (hasStatus(this, 'curse')) mult *= 0.8;
                    return Math.max(0, Math.floor((s.matk || 10) * mult));
                },







                get mdef() {
                    let s = computeHeroStats(hero);
                    let mult = 1.0;
                    if (hasStatus(this, 'sanctuary_protection')) mult *= 1.15;
                    return Math.max(0, Math.floor((s.mdef || 8) * mult));
                },







                get spd() {







                    let s = computeHeroStats(hero);







                    let mult = 1.0;







                    if (hasStatus(this, 'haste')) mult *= 1.3;







                    if (hasStatus(this, 'slow')) mult *= 0.7;







                    let flatSpd = 0;
                    if (hasStatus(this, 'beast_roar')) flatSpd += 15;
                    if (hasStatus(this, 'primal_roar')) flatSpd += 20;
                    return Math.max(1, Math.floor(s.spd * mult) + flatSpd);







                },







                isPlayer: true,







                isHero: true,







                isBoss: false,







                statuses: hero.statuses || (hero.statuses = {})







            };







        }







        return hero._combatEntity;







    }















    function getPlayerCombatEntity() {
        if (typeof window !== 'undefined') window.getPlayerCombatEntity = getPlayerCombatEntity;







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







                    if (hasStatus(this, 'battle_cry')) mult *= 1.2;
                    if (hasStatus(this, 'beast_roar')) mult *= 1.2;
                    if (hasStatus(this, 'primal_roar')) mult *= 1.25;
                    if (hasStatus(this, 'curse')) mult *= 0.8;







                    return Math.floor(pStats.atk * mult);







                },







                get def() {







                    let mult = 1.0;







                    if (hasStatus(this, 'armor_break')) mult *= 0.7;







                    if (hasStatus(this, 'berserk')) mult *= 0.75;
                    if (hasStatus(this, 'sanctuary_protection')) mult *= 1.15;







                    return Math.max(0, Math.floor(pStats.def * mult));







                },







                get matk() {
                    let mult = 1.0;
                    if (hasStatus(this, 'curse')) mult *= 0.8;
                    return Math.max(0, Math.floor((pStats.matk || 10) * mult));
                },
                get mdef() {
                    let mult = 1.0;
                    if (hasStatus(this, 'sanctuary_protection')) mult *= 1.15;
                    return Math.max(0, Math.floor(pStats.mdef * mult));
                },







                get spd() {







                    let mult = 1.0;







                    if (hasStatus(this, 'haste')) mult *= 1.3;







                    if (hasStatus(this, 'slow')) mult *= 0.7;







                    let pFlatSpd = 0;
                    if (hasStatus(this, 'beast_roar')) pFlatSpd += 15;
                    if (hasStatus(this, 'primal_roar')) pFlatSpd += 20;
                    return Math.max(1, Math.floor(pStats.spd * mult) + pFlatSpd);







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



        let isMainPlayer = (target === 'player' || target === player || target.id === 'battle-player' || (target.isPlayer && !target.hero && !target.heroId));







        let ent = isMainPlayer ? getPlayerCombatEntity() : target;







        if (!ent.statuses) ent.statuses = {};















        // Boss Crowd Control Immunity Check







        // Primal Roar Immunity Check (Immune to Stun & Silence)
        if (hasStatus(ent, 'primal_roar') && (statusId === 'stun' || statusId === 'silence')) {
            logMsg(`${ent.name || 'Hero'} resisted ${def.name} with Primal Roar!`, "#ca8a04");
            floatText(ent.id, "IMMUNE", "#ca8a04");
            return;
        }

        if (ent.isBoss && (statusId === 'stun' || statusId === 'freeze')) {







            logMsg(`${ent.name} resisted the disable!`, "#ffd700");







            floatText(ent.id, "RESISTED", "#ffd700");







            applyStatus(ent, 'slow', 2, 0, source);







            return;







        }















        // Barrier Mastery: All Divine Barriers absorb +10% more damage per rank







        if (statusId === 'divine_barrier' && isPlayer && player.skillTree && player.skillTree.barrierMastery > 0) {







            value = Math.floor(value * (1 + (player.skillTree.barrierMastery * 0.10)));







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















        // Decaying Curse Keystone: Applying any debuff to an enemy immediately afflicts them with Decay







        if (!isPlayer && statusId !== 'decay' && (def.type === 'debuff' || def.type === 'dot' || def.type === 'disable' || def.type === 'ailment') && player.skillTree && player.skillTree.decayingCurse > 0) {







            if (!ent.statuses.decay) {







                applyStatus(ent, 'decay', 3, 0, 'decaying_curse');







                logMsg(`🌑 Decaying Curse afflicts ${ent.name} with Decay!`, "#a855f7");







            }







        }







    }















    function processStatusesStartTurn(entity) {







        if (!entity || !entity.statuses) return false;















        // 1. Evaluate DoTs







        let dotMultiplier = (!entity.isPlayer && playerHasPassive('calamity_conduit')) ? 2 : 1;







        if (!entity.isPlayer && player.skillTree && player.skillTree.afflictionPotency > 0) {







            dotMultiplier *= (1 + (player.skillTree.afflictionPotency * 0.10));







        }







        let totalEnemyDotDmg = 0;















        // A. Burn







        if (hasStatus(entity, 'burn')) {







            let dmg = Math.max(1, Math.floor(entity.maxHp * 0.05)) * dotMultiplier;







            entity.hp = Math.max(0, entity.hp - dmg);







            if (!entity.isPlayer) totalEnemyDotDmg += dmg;







            logMsg(`${entity.name} takes ${dmg} burn damage!`, "#ff4500");







            floatText(entity.id, `🔥 -${dmg} Burn`, "#ff4500", false, 'dot');







            animateAction(entity.id, 'anim-shake');







        }















        // B. Poison (True Damage)







        if (hasStatus(entity, 'poison')) {







            let stacks = entity.statuses.poison.stacks || 1;







            let dmg = (Math.max(2, Math.floor(entity.maxHp * 0.02 * stacks) + (stacks * 2))) * dotMultiplier;







            entity.hp = Math.max(0, entity.hp - dmg);







            if (!entity.isPlayer) totalEnemyDotDmg += dmg;







            logMsg(`${entity.name} takes ${dmg} poison damage (${stacks}x)!`, "#22c55e");







            floatText(entity.id, `☠️ -${dmg} Poison`, "#22c55e", false, 'dot');







            animateAction(entity.id, 'anim-shake');







        }















        // C. Decay







        if (hasStatus(entity, 'decay')) {







            let dmg = (Math.max(2, Math.floor(entity.maxHp * 0.04) + 3)) * dotMultiplier;







            entity.hp = Math.max(0, entity.hp - dmg);







            if (!entity.isPlayer) totalEnemyDotDmg += dmg;







            logMsg(`${entity.name} suffers ${dmg} decay damage!`, "#a855f7");







            floatText(entity.id, `🟣 -${dmg} Decay`, "#a855f7", false, 'dot');







            animateAction(entity.id, 'anim-shake');







        }















        // Soul Siphon DoT Leech Check







        if (!entity.isPlayer && playerHasPassive('soul_siphon') && totalEnemyDotDmg > 0) {







            let leech = Math.max(1, Math.floor(totalEnemyDotDmg * 0.20));







            player.baseStats.hp = Math.min(pStats.maxHp, player.baseStats.hp + leech);







            pStats.hp = player.baseStats.hp;







            logMsg(`🔮 Soul Siphon leeches ${leech} HP from active DoTs!`, "#a855f7");







            floatText('battle-player', `+${leech} HP`, "#a855f7", false, 'heal');







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
                    if (!player.defeatedBosses) player.defeatedBosses = [];
                    if (!player.defeatedBosses.includes(entity.name)) player.defeatedBosses.push(entity.name);







                    // Calamity Raid Resolution: Consume 1 keystone and drop essences
        if (battleState && battleState.isRaid) {
            player.calamityKeys = Math.max(0, (player.calamityKeys || 1) - 1);
            const rId = battleState.raidId;
            const raid = (typeof RAIDS_DB !== 'undefined' && RAIDS_DB[rId]) || null;
            if (raid) {
                let count = Math.floor(Math.random() * 3) + 1; // 1 to 3 essences
                if (!player.materials) player.materials = {};
                player.materials[raid.essenceDrop] = (player.materials[raid.essenceDrop] || 0) + count;
                logMsg(`🏆 CALAMITY CONQUERED! Consumed 1 Keystone. Harvested ${count}x ${raid.essenceName}!`, "#f43f5e");
                showToast('Calamity Conquered!', `Harvested ${count}x ${raid.essenceName}!`, 'achievement', 6000);
            }
            player.calamityVictories = player.calamityVictories || {};
            player.calamityVictories[rId] = (player.calamityVictories[rId] || 0) + 1;
        }

        if(typeof checkAchievements === 'function') checkAchievements();







                }







                renderBattlefield();







                setCombatTimeout(processNextTurn, 1000);







                return true;







            }







        }















        // 2. Check Disables (Stun & Freeze)







        // 2. Check Disables (Stun, Freeze, Staggered, Glacial Prison)
        if (hasStatus(entity, 'stun') || hasStatus(entity, 'freeze') || hasStatus(entity, 'staggered') || hasStatus(entity, 'glacial_prison')) {
            let disName = hasStatus(entity, 'staggered') ? 'Staggered' : (hasStatus(entity, 'glacial_prison') ? 'Frozen in Glacial Prison' : (hasStatus(entity, 'freeze') ? 'Frozen' : 'Stunned'));
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
            if (entity.statuses.staggered) {
                entity.statuses.staggered.duration--;
                if (entity.statuses.staggered.duration <= 0) {
                    delete entity.statuses.staggered;
                    logMsg(`${entity.name} recovered from Staggered.`, "#f43f5e");
                }
            }
            if (entity.statuses.glacial_prison) {
                entity.statuses.glacial_prison.duration--;
                if (entity.statuses.glacial_prison.duration <= 0) {
                    delete entity.statuses.glacial_prison;
                    logMsg(`${entity.name}'s Glacial Prison shattered!`, "#06b6d4");
                }
            }

            renderBattlefield();
            setCombatTimeout(processNextTurn, 1000);
            return true; // Turn was skipped
        }
        if (false) {







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























function getAllAreaKeys() {







    if (typeof AREAS_DB === 'undefined') return [];







    const keys = Object.keys(AREAS_DB);







    ['area_6', 'area_7', 'area_8', 'area_9', 'area_10'].forEach(k => {







        if (AREAS_DB[k] && !keys.includes(k)) keys.push(k);







    });







    return keys;







}







window.getAllAreaKeys = getAllAreaKeys;















function checkAreaUnlocks() {







    if (!player || !player.unlockedAreas) return;







    if (player.level >= 26 && !player.unlockedAreas.includes('area_6')) player.unlockedAreas.push('area_6');







    if (player.level >= 31 && !player.unlockedAreas.includes('area_7')) player.unlockedAreas.push('area_7');







    if (player.level >= 36 && !player.unlockedAreas.includes('area_8')) player.unlockedAreas.push('area_8');







    if (player.level >= 41 && !player.unlockedAreas.includes('area_9')) player.unlockedAreas.push('area_9');







    if (player.level >= 46 && !player.unlockedAreas.includes('area_10')) player.unlockedAreas.push('area_10');







}







window.checkAreaUnlocks = checkAreaUnlocks;















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















        for(let aId of getAllAreaKeys()) {







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















        // Step 3: Area Scouting & Drop Rate Guide







        let mod = (typeof ELEMENT_MODS !== 'undefined' && ELEMENT_MODS[currentArea.element]) ? ELEMENT_MODS[currentArea.element] : null;







        let weakText = mod ? mod.weakTo : 'None';







        let resistText = mod ? mod.resists : 'None';















        let rosterHtml = '';







        if (currentArea.regularEnemies && Array.isArray(currentArea.regularEnemies)) {







            rosterHtml = currentArea.regularEnemies.map(enemy => {







                let dropsText = '';







                if (enemy.loot && Array.isArray(enemy.loot) && enemy.loot.length > 0) {







                    dropsText = enemy.loot.map(l => `<span class="zone-drop-tag">${l.item} (${Math.round(l.chance * 100)}%)</span>`).join('');







                } else {







                    dropsText = '<span style="color:#666; font-size:10px;">No drops</span>';







                }







                return `







                    <div class="zone-monster-card">







                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">







                            <b style="color: #f8fafc;">${enemy.name}</b>







                            <span style="font-size: 10px; color: #94a3b8;">Lv ${enemy.level} • <span style="color:${currentArea.themeColor};">${enemy.element}</span></span>







                        </div>







                        <div style="font-size: 10px; color: #aaa; margin-bottom: 4px;">







                            HP: <span style="color:#ef4444;">${enemy.hp}</span> | ATK: <span style="color:#f59e0b;">${enemy.atk}</span> | EXP: ${enemy.exp} | Gold: ${enemy.gold}







                        </div>







                        <div style="font-size: 10px; color: #cbd5e1;">







                            <b>Drops:</b> ${dropsText}







                        </div>







                    </div>







                `;







            }).join('');







        }















        let bossDropsText = '';







        if (currentArea.boss && currentArea.boss.loot && Array.isArray(currentArea.boss.loot)) {







            bossDropsText = currentArea.boss.loot.map(l => `<span class="zone-drop-tag">${l.item} (${Math.round(l.chance * 100)}%)</span>`).join('');







        }















        let intelHtml = `







            <div class="zone-intel-panel" id="zone-scouting-guide">







                <div class="zone-intel-title">







                    <span>🗺️ Area Scouting & Drop Rate Guide</span>







                    <span style="font-size: 11px; color: ${currentArea.themeColor}; font-weight: normal;">${currentArea.name} Intel</span>







                </div>







                <div class="zone-intel-tactics">







                    ⚡ <b>Elemental Strategy:</b> ${currentArea.element} Zone Affinity. Takes <b>+50% damage</b> from <span style="color:#ef4444; font-weight:bold;">${weakText}</span>. Resists <b>-50% damage</b> from <span style="color:#38bdf8; font-weight:bold;">${resistText}</span>.







                </div>







                <div style="font-size: 11px; font-weight: bold; color: #ffd700; margin-bottom: 6px;">Zone Bestiary & Item Drop Chances:</div>







                <div class="zone-roster-grid">







                    ${rosterHtml}







                    <div class="zone-monster-card zone-boss-card">







                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">







                            <b style="color: #ffd700;">👑 Gatekeeper Boss: ${currentArea.boss.name}</b>







                            <span style="font-size: 10px; color: #ffd700;">Lv ${currentArea.boss.level} • ${currentArea.boss.element}</span>







                        </div>







                        <div style="font-size: 10px; color: #aaa; margin-bottom: 4px;">







                            HP: <span style="color:#ef4444;">${currentArea.boss.hp}</span> | ATK: <span style="color:#f59e0b;">${currentArea.boss.atk}</span> | Rewards: <span style="color:#22c55e;">${currentArea.boss.exp} EXP</span>, <span style="color:#fbbf24;">${currentArea.boss.gold} Gold</span>







                        </div>







                        <div style="font-size: 10px; color: #cbd5e1;">







                            <b>Guaranteed 100% Equipment Drop + Bonus Loot:</b> ${bossDropsText}







                        </div>







                    </div>







                </div>







            </div>







        `;















        container.innerHTML = areasHtml + modeHtml + intelHtml;







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







        if(id === 'modal-spire') renderSpireModal();







        if(id === 'modal-astral-altar') renderAstralAltarModal();







        if(id === 'modal-saves') renderSaveManager();







        if(id === 'modal-pets') renderPetsModal();







        if(id === 'modal-tavern') { if (!player.bounties || !player.bounties.available || player.bounties.available.length === 0) refreshBountyBoard(true); renderTavernContent(); }







        if(id === 'modal-mercenary') { renderBarracksUI('mercenary-modal-content'); }
        if(id === 'modal-calamity-raid') { if (typeof renderCalamityPortalUI === 'function') renderCalamityPortalUI(); }







    }







    function closeAllModals() {







        document.querySelectorAll('.modal, .overlay').forEach(el => el.classList.remove('active'));







        computeStats();







        updateHeader();







    }
    window.openModal = openModal;
    window.closeAllModals = closeAllModals;
















    /* =========================================================================







       TOWN & PROGRESSION







       ========================================================================= */















    function newGame() {







        if (typeof clearAllCombatTimers === 'function') clearAllCombatTimers();







        shopActiveTab = 'consumables';







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







                atkTraining: 0, critTraining: 0, powerStrike: 0, armorBreak: 0, combatMastery: 0, precisionStrikes: 0, executioner: 0, vampiricFervor: 0,







                vitalityTraining: 0, defTraining: 0, recovery: 0, regeneration: 0, ironSkin: 0, barrierMastery: 0, overchargedAegis: 0, thornedBastion: 0,







                spiritTraining: 0, arcaneTraining: 0, manaEfficiency: 0, elementalResonance: 0, afflictionPotency: 0, arcaneSurge: 0, decayingCurse: 0,







                spdTraining: 0, fortune: 0, treasureSense: 0, quickReflexes: 0, momentum: 0, midasTouch: 0







            },







            hasRespecced: false,







            activeTitle: 'Novice',







            currentClass: 'novice',







            spire: {







                highestFloor: 0,







                astralShards: 0,







                relics: [],







                equippedRelic: null,







                tomesUsed: { hp: 0, atk: 0, mp: 0 }







            },







            unlockedAreas: ['area_1'],
            defeatedAreaBosses: [],







            selectedArea: 'area_1',







            materials: { scrap: 0, dust: 0, shard: 0, ignis_heart: 0, abyssal_pearl: 0, chronos_riftcore: 0 },
            calamityKeys: 3,
            lastCalamityReset: Date.now(),
            calamityVictories: {},
            calamityUnlocked: false,







            quests: {},







            questStats: { enemiesDefeated: 0, battlesWon: 0, bossesDefeated: 0 },







            achievements: {},







            pets: {







                unlocked: ['sprout_slimelet'],







                active: [null, null],







                levels: {







                    sprout_slimelet: { level: 1, exp: 0 }







                }







            },







            bestiary: {},







            bountyMarks: 0,







            bounties: { available: [], active: [], completedCount: 0 },







            roster: [],







            rosterMax: 5,







            activeParty: ['hero_main'],







            partyUnlockedSlots: 1







        };







        syncMainHero();







        init();







        switchScreen('town');







    }







    /* =========================================================================







       MULTI-SLOT SAVE & EXPORT/IMPORT SYSTEM







       ========================================================================= */















    let currentSaveSlot = parseInt(localStorage.getItem('er_active_slot')) || 1;







    let saveManagerTab = 'slots';







    let selectedExportSlot = 1;















    function getSaveSlotKey(slotNum) {







        const num = parseInt(slotNum) || 1;







        return num === 1 ? 'er_save' : `er_save_slot_${num}`;







    }















    function setSaveTab(tab) {







        saveManagerTab = tab;







        renderSaveManager();







    }















    function saveGame(slotNum = null) {







        if(typeof battleState !== 'undefined' && battleState.active) {







            showToast("Cannot Save", "Cannot save during battle!", "save");







            return;







        }







        const target = slotNum !== null ? parseInt(slotNum) : currentSaveSlot;







        if (!player) return;







        player.lastSaved = new Date().toLocaleString();







        currentSaveSlot = target;







        try { localStorage.setItem('er_active_slot', target); } catch(e) {}







        try { localStorage.setItem(getSaveSlotKey(target), JSON.stringify(player)); } catch(e) {}







        showToast('Game Saved', `Saved progress to Slot ${target}!`, 'save');







        if (typeof renderSaveManager === 'function' && document.getElementById('modal-saves')?.classList.contains('active')) {







            renderSaveManager();







        }







        updateHeader();







    }















    function loadGame(slotNum = null) {







        if(typeof battleState !== 'undefined' && battleState.active) {







            showToast("Cannot Load", "Cannot load during battle!", "save");







            return;







        }







        if (typeof clearAllCombatTimers === 'function') clearAllCombatTimers();







        const target = slotNum !== null ? parseInt(slotNum) : currentSaveSlot;







        const data = localStorage.getItem(getSaveSlotKey(target));







        if(data) {







            player = JSON.parse(data);







            currentSaveSlot = target;







            try { localStorage.setItem('er_active_slot', target); } catch(e) {}







            







            if(typeof player.skillOrbs === 'undefined') player.skillOrbs = 0;







            if(typeof player.hasRespecced === 'undefined') player.hasRespecced = false;







            if(typeof player.skillTree === 'undefined') {







                player.skillTree = {};







            }







            if(typeof SKILL_TREE_DB !== 'undefined') {







                for (let k in SKILL_TREE_DB) {







                    if (typeof player.skillTree[k] === 'undefined') player.skillTree[k] = 0;







                }







            }







            if(!player.defeatedAreaBosses) player.defeatedAreaBosses = [];
            if(typeof player.activeTitle === 'undefined') player.activeTitle = 'Novice';







            if(typeof player.quests === 'undefined') player.quests = {};







            if(typeof player.questStats === 'undefined') {







                player.questStats = { enemiesDefeated: 0, battlesWon: 0, bossesDefeated: 0 };







            } else {







                if(typeof player.questStats.battlesWon === 'undefined') player.questStats.battlesWon = 0;







                if(typeof player.questStats.bossesDefeated === 'undefined') player.questStats.bossesDefeated = 0;







            }







            if(typeof player.achievements === 'undefined') player.achievements = {};







            







            // Spire State Initialization & Fallback







            if(!player.spire) {







                player.spire = {







                    highestFloor: 0,







                    astralShards: 0,







                    relics: [],







                    equippedRelic: null,







                    tomesUsed: { hp: 0, atk: 0, mp: 0 }







                };







            } else {







                if(typeof player.spire.highestFloor === 'undefined') player.spire.highestFloor = 0;







                if(typeof player.spire.astralShards === 'undefined') player.spire.astralShards = 0;







                if(!Array.isArray(player.spire.relics)) player.spire.relics = [];







                if(typeof player.spire.equippedRelic === 'undefined') player.spire.equippedRelic = null;







                if(!player.spire.tomesUsed) player.spire.tomesUsed = { hp: 0, atk: 0, mp: 0 };







                else {







                    if(typeof player.spire.tomesUsed.hp === 'undefined') player.spire.tomesUsed.hp = 0;







                    if(typeof player.spire.tomesUsed.atk === 'undefined') player.spire.tomesUsed.atk = 0;







                    if(typeof player.spire.tomesUsed.mp === 'undefined') player.spire.tomesUsed.mp = 0;







                }







            }







            







            // Materials Initialization & Fallback







            if(!player.materials) {
                player.materials = { scrap: 0, dust: 0, shard: 0, ignis_heart: 0, abyssal_pearl: 0, chronos_riftcore: 0 };
            } else {
                if(typeof player.materials.ignis_heart === 'undefined') player.materials.ignis_heart = 0;
                if(typeof player.materials.abyssal_pearl === 'undefined') player.materials.abyssal_pearl = 0;
                if(typeof player.materials.chronos_riftcore === 'undefined') player.materials.chronos_riftcore = 0;
            }
            if(typeof player.calamityKeys === 'undefined') player.calamityKeys = 3;
            if(!player.calamityVictories) player.calamityVictories = {};
            if(!player.lastCalamityReset) {
                player.lastCalamityReset = Date.now();
            } else if (Date.now() - player.lastCalamityReset >= 7 * 24 * 3600 * 1000) {
                player.calamityKeys = Math.max(player.calamityKeys, 3);
                player.lastCalamityReset = Date.now();
            }
            if(false) {







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







            if(player.level >= 26 && !player.unlockedAreas.includes('area_6')) player.unlockedAreas.push('area_6');







            if(player.level >= 31 && !player.unlockedAreas.includes('area_7')) player.unlockedAreas.push('area_7');







            if(player.level >= 36 && !player.unlockedAreas.includes('area_8')) player.unlockedAreas.push('area_8');







            if(player.level >= 41 && !player.unlockedAreas.includes('area_9')) player.unlockedAreas.push('area_9');







            if(player.level >= 46 && !player.unlockedAreas.includes('area_10')) player.unlockedAreas.push('area_10');















            if(!player.selectedArea || !player.unlockedAreas.includes(player.selectedArea)) {







                player.selectedArea = player.unlockedAreas[player.unlockedAreas.length - 1] || 'area_1';







            }















            // Bestiary Initialization & Retroactive Discovery for Unlocked Areas







            if (!player.bestiary || typeof player.bestiary !== 'object') {







                player.bestiary = {};







            }







            if (player.unlockedAreas && Array.isArray(player.unlockedAreas)) {







                player.unlockedAreas.forEach(aKey => {







                    const area = (typeof AREAS_DB !== 'undefined') && AREAS_DB[aKey];







                    if (area) {







                        if (area.regularEnemies) {







                            area.regularEnemies.forEach(e => {







                                if (e && e.name && (player.bestiary[e.name] === undefined || player.bestiary[e.name] === null)) {







                                    player.bestiary[e.name] = 1;







                                }







                            });







                        }







                        if (area.boss && area.boss.name) {







                            if (player.bestiary[area.boss.name] === undefined || player.bestiary[area.boss.name] === null) {







                                player.bestiary[area.boss.name] = 1;







                            }







                        }







                    }







                });







            }















            // Tavern & Bounty Board Initialization







            player.bountyMarks = player.bountyMarks || 0;







            player.bounties = player.bounties || { available: [], active: [], completedCount: 0 };







            if (!Array.isArray(player.bounties.available)) player.bounties.available = [];







            if (!Array.isArray(player.bounties.active)) player.bounties.active = [];







            if (typeof player.bounties.completedCount !== 'number') player.bounties.completedCount = 0;















            // Tactical Party & Hero Roster Initialization







            player.roster = player.roster || [];







            player.rosterMax = player.rosterMax || 5;







            player.activeParty = player.activeParty || ['hero_main'];







            player.partyUnlockedSlots = player.partyUnlockedSlots || 1;







            syncMainHero();







            







            // Class Advancement Initialization & Retroactive Qualification







            if(!player.currentClass) {







                player.currentClass = 'novice';







            }







            if(player.level >= 10 && player.currentClass === 'novice') {







                setTimeout(() => {







                    showToast('Class Evolution Ready!', 'Visit the Class Sanctum in Town to choose your path!', 'level', 6000);







                }, 800);







            }







            // Retroactive Signature Class Skills Check







            if (!player.skills || !Array.isArray(player.skills)) player.skills = ['Fireball', 'Heal'];







            if (player.currentClass && player.currentClass !== 'novice' && typeof getClassSkills === 'function') {







                let reqSkills = getClassSkills(player.currentClass);







                reqSkills.forEach(s => {







                    if (!player.skills.includes(s)) {







                        player.skills.push(s);







                    }







                });







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















            // Companion Pet & Familiar Migration







            if (!player.pets) {







                player.pets = {







                    unlocked: ['sprout_slimelet'],







                    active: [null, null],







                    levels: {







                        sprout_slimelet: { level: 1, exp: 0 }







                    }







                };







            } else {







                if (!Array.isArray(player.pets.unlocked)) player.pets.unlocked = ['sprout_slimelet'];







                if (!player.pets.unlocked.includes('sprout_slimelet')) player.pets.unlocked.unshift('sprout_slimelet');







                if (!Array.isArray(player.pets.active)) player.pets.active = ['sprout_slimelet', null];







                if (!player.pets.levels) player.pets.levels = {};







                if (!player.pets.levels.sprout_slimelet) player.pets.levels.sprout_slimelet = { level: 1, exp: 0 };







            }







            if (player.level < 25 && player.pets && player.pets.active) {







                player.pets.active[1] = null;







            }















            init();







            renderStats();







            renderInventory();







            renderShop();







            renderQuests();







            renderAchievements();







            switchScreen('town');







            showToast('Game Loaded', `Loaded Slot ${target}!`, 'save');







            if (typeof renderSaveManager === 'function' && document.getElementById('modal-saves')?.classList.contains('active')) {







                renderSaveManager();







            }







        } else {







            showToast("Load Failed", "No save found in Slot " + target, "save");







        }







    }















    function deleteSaveSlot(slotNum) {







        const target = parseInt(slotNum) || 1;







        const confirmed = (typeof window !== 'undefined' && window.confirm) ? window.confirm(`Are you sure you want to delete Slot ${target}? This action cannot be undone.`) : true;







        if (confirmed) {







            localStorage.removeItem(getSaveSlotKey(target));







            showToast('Save Deleted', `Slot ${target} cleared.`, 'info');







            renderSaveManager();







        }







    }















    function encodeSaveData(jsonString) {







        return btoa(encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g, (match, p1) => {







            return String.fromCharCode('0x' + p1);







        }));







    }















    function decodeSaveData(encodedString) {







        const trimmed = (encodedString || '').trim();







        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {







            return JSON.parse(trimmed);







        }







        const decoded = decodeURIComponent(Array.prototype.map.call(atob(trimmed), c => {







            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);







        }).join(''));







        return JSON.parse(decoded);







    }















    function validateSaveData(data) {







        if (!data || typeof data !== 'object') return false;







        if (typeof data.level === 'undefined' && typeof data.baseStats === 'undefined' && typeof data.inventory === 'undefined') {







            return false;







        }







        return true;







    }















    function executeImport(targetSlot, autoLoad = true) {







        const inputEl = document.getElementById('import-save-text');







        const input = inputEl ? inputEl.value.trim() : '';







        if (!input) {







            showToast('Import Failed', 'Please paste a save string first.', 'info');







            return;







        }















        let parsed = null;







        try {







            parsed = decodeSaveData(input);







        } catch (e) {







            showToast('Import Failed', 'Corrupted or invalid save code format.', 'info');







            return;







        }















        if (!validateSaveData(parsed)) {







            showToast('Import Failed', 'Save validation failed: Missing character data.', 'info');







            return;







        }















        const slotNum = parseInt(targetSlot) || 1;







        const existing = localStorage.getItem(getSaveSlotKey(slotNum));







        if (existing) {







            const ok = (typeof window !== 'undefined' && window.confirm) ? window.confirm(`Slot ${slotNum} already has a character! Overwrite?`) : true;







            if (!ok) return;







        }















        parsed.lastSaved = new Date().toLocaleString() + ' (Imported)';







        localStorage.setItem(getSaveSlotKey(slotNum), JSON.stringify(parsed));















        if (autoLoad) {







            loadGame(slotNum);







            closeAllModals();







            showToast('Import Successful', `Loaded character into Slot ${slotNum}!`, 'save');







        } else {







            showToast('Import Successful', `Saved character to Slot ${slotNum}!`, 'save');







            renderSaveManager();







        }







    }















    function renderSaveManager() {







        const content = document.getElementById('saves-content');







        if (!content) return;















        const tabSlotsBtn = document.getElementById('save-tab-slots');







        const tabExportBtn = document.getElementById('save-tab-export');







        if (tabSlotsBtn) tabSlotsBtn.classList.toggle('active', saveManagerTab === 'slots');







        if (tabExportBtn) tabExportBtn.classList.toggle('active', saveManagerTab === 'export');















        if (saveManagerTab === 'slots') {







            let html = '<div style="display:flex; flex-direction:column; gap:10px;">';







            for (let i = 1; i <= 3; i++) {







                const key = getSaveSlotKey(i);







                const raw = localStorage.getItem(key);







                const isActive = (i === currentSaveSlot);















                if (raw) {







                    let d = null;







                    try { d = JSON.parse(raw); } catch(e) {}







                    if (d) {







                        const heroName = d.name || 'Hero';







                        const heroLvl = d.level || 1;







                        const clsName = (typeof CLASSES_DB !== 'undefined' && d.currentClass && CLASSES_DB[d.currentClass]) ? CLASSES_DB[d.currentClass].name : (d.currentClass || 'Novice');







                        const areaName = (typeof AREAS_DB !== 'undefined' && d.selectedArea && AREAS_DB[d.selectedArea]) ? AREAS_DB[d.selectedArea].name : (d.selectedArea || 'Whispering Woods');







                        const spireFloor = (d.spire && d.spire.highestFloor) ? d.spire.highestFloor : 0;







                        const gold = d.gold || 0;







                        const lastSaved = d.lastSaved || 'Unknown';















                        html += `







                        <div class="save-slot-card ${isActive ? 'active-slot' : ''}">







                            <div class="save-slot-header">







                                <div style="display:flex; align-items:center; gap:8px;">







                                    <b style="font-size:15px; color:#f8fafc;">Slot ${i}: ${heroName} (Lv ${heroLvl})</b>







                                    ${isActive ? '<span class="badge" style="background:#0284c7; color:#fff; padding:2px 8px; border-radius:4px; font-size:11px;">⭐ Active Profile</span>' : ''}







                                </div>







                                <span style="font-size:12px; color:#94a3b8;">${lastSaved}</span>







                            </div>







                            <div class="save-slot-info">







                                <span>Class: <b style="color:#c084fc;">${clsName}</b></span>







                                <span>Area: <b style="color:#4ade80;">${areaName}</b></span>







                                <span>Spire: <b style="color:#38bdf8;">Floor ${spireFloor}</b></span>







                                <span>Gold: <b style="color:#ffd700;">${gold} G</b></span>







                            </div>







                            <div class="save-slot-actions">







                                <button class="btn" style="padding:4px 10px; font-size:12px; background:#0284c7; color:#fff;" onclick="saveGame(${i})">💾 Save Current</button>







                                <button class="btn" style="padding:4px 10px; font-size:12px; background:#10b981; color:#fff;" onclick="loadGame(${i})">📂 Load</button>







                                <button class="btn" style="padding:4px 10px; font-size:12px; background:#6366f1; color:#fff;" onclick="exportSpecificSlot(${i})">📤 Export</button>







                                <button class="btn" style="padding:4px 10px; font-size:12px; background:#ef4444; color:#fff;" onclick="deleteSaveSlot(${i})">🗑️ Delete</button>







                            </div>







                        </div>`;







                        continue;







                    }







                }















                // Empty Slot







                html += `







                <div class="save-slot-card empty-slot">







                    <div class="save-slot-header">







                        <b style="font-size:14px; color:#94a3b8;">Slot ${i}: [Empty Profile - Ready for New Hero]</b>







                    </div>







                    <div style="font-size:12px; color:#64748b;">







                        No character progress saved in this slot.







                    </div>







                    <div class="save-slot-actions">







                        <button class="btn" style="padding:4px 10px; font-size:12px; background:#0284c7; color:#fff;" onclick="saveGame(${i})">💾 Save Current to Slot ${i}</button>







                        <button class="btn" style="padding:4px 10px; font-size:12px; background:#6366f1; color:#fff;" onclick="importToSpecificSlot(${i})">📥 Import to Slot ${i}</button>







                    </div>







                </div>`;







            }







            html += '</div>';







            content.innerHTML = html;







        } else if (saveManagerTab === 'export') {







            let html = `







            <div style="display:flex; flex-direction:column; gap:16px;">







                <!-- Export Section -->







                <div style="background:rgba(15,23,42,0.6); border:1px solid #334155; border-radius:8px; padding:12px;">







                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">







                        <b style="color:#38bdf8; font-size:14px;">📤 Export Character Profile</b>







                        <div style="display:flex; align-items:center; gap:6px;">







                            <label style="font-size:12px; color:#94a3b8;">Profile:</label>







                            <select id="export-slot-select" style="background:#1e293b; color:#fff; border:1px solid #475569; border-radius:4px; padding:3px 8px; font-size:12px;" onchange="updateExportText()">







                                <option value="current" ${selectedExportSlot === 'current' ? 'selected' : ''}>Active Hero (Live Memory)</option>







                                <option value="1" ${selectedExportSlot === 1 ? 'selected' : ''}>Slot 1 ${localStorage.getItem('er_save') ? '(Saved)' : '(Empty)'}</option>







                                <option value="2" ${selectedExportSlot === 2 ? 'selected' : ''}>Slot 2 ${localStorage.getItem('er_save_slot_2') ? '(Saved)' : '(Empty)'}</option>







                                <option value="3" ${selectedExportSlot === 3 ? 'selected' : ''}>Slot 3 ${localStorage.getItem('er_save_slot_3') ? '(Saved)' : '(Empty)'}</option>







                            </select>







                        </div>







                    </div>







                    <textarea id="export-save-text" class="save-textarea" readonly></textarea>







                    <div style="display:flex; gap:8px; margin-top:8px;">







                        <button class="btn" style="padding:5px 12px; font-size:12px; background:#38bdf8; color:#0f172a; font-weight:bold;" onclick="copyExportText()">📋 Copy Save String</button>







                        <button class="btn" style="padding:5px 12px; font-size:12px; background:#0284c7; color:#fff;" onclick="downloadSaveJson()">💾 Download .JSON File</button>







                    </div>







                </div>















                <!-- Import Section -->







                <div style="background:rgba(15,23,42,0.6); border:1px solid #334155; border-radius:8px; padding:12px;">







                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">







                        <b style="color:#4ade80; font-size:14px;">📥 Import Character Save</b>







                        <div style="display:flex; align-items:center; gap:6px;">







                            <label style="font-size:12px; color:#94a3b8;">Destination:</label>







                            <select id="import-target-slot" style="background:#1e293b; color:#fff; border:1px solid #475569; border-radius:4px; padding:3px 8px; font-size:12px;">







                                <option value="1">Import into: Slot 1</option>







                                <option value="2">Import into: Slot 2</option>







                                <option value="3">Import into: Slot 3</option>







                            </select>







                        </div>







                    </div>







                    <textarea id="import-save-text" class="save-textarea" placeholder="Paste your exported save string or raw JSON here..."></textarea>







                    <div style="display:flex; gap:8px; margin-top:8px;">







                        <button class="btn" style="padding:5px 12px; font-size:12px; background:#10b981; color:#fff; font-weight:bold;" onclick="executeImport(document.getElementById('import-target-slot').value, true)">📥 Import & Load Immediately</button>







                        <button class="btn" style="padding:5px 12px; font-size:12px; background:#3b82f6; color:#fff;" onclick="executeImport(document.getElementById('import-target-slot').value, false)">💾 Save to Slot Only</button>







                    </div>







                </div>







            </div>







            `;







            content.innerHTML = html;







            updateExportText();







        }







    }















    function exportSpecificSlot(slotNum) {







        selectedExportSlot = parseInt(slotNum) || 1;







        setSaveTab('export');







    }















    function importToSpecificSlot(slotNum) {







        setSaveTab('export');







        setTimeout(() => {







            const sel = document.getElementById('import-target-slot');







            if (sel) sel.value = slotNum;







        }, 10);







    }















    function updateExportText() {







        const sel = document.getElementById('export-slot-select');







        const slot = sel ? sel.value : selectedExportSlot;







        let dataObj = null;







        if (slot === 'current') {







            dataObj = player;







        } else {







            const slotKey = getSaveSlotKey(slot);







            const data = localStorage.getItem(slotKey);







            if (data) {







                try { dataObj = JSON.parse(data); } catch(e) {}







            } else if (parseInt(slot) === currentSaveSlot) {







                dataObj = player;







            }







        }















        const txt = document.getElementById('export-save-text');







        if (!txt) return;







        if (!dataObj) {







            txt.value = "// Slot is empty. No save data to export.";







        } else {







            try {







                txt.value = encodeSaveData(JSON.stringify(dataObj));







            } catch(e) {







                txt.value = JSON.stringify(dataObj);







            }







        }







    }















    function copyExportText() {







        const txt = document.getElementById('export-save-text');







        if (!txt || !txt.value || txt.value.startsWith('//')) {







            showToast('Export', 'No save data to copy.', 'info');







            return;







        }







        if (navigator.clipboard && navigator.clipboard.writeText) {







            navigator.clipboard.writeText(txt.value).then(() => {







                showToast('Save Copied', 'Save copied to clipboard!', 'save');







            }).catch(() => {







                legacyCopy(txt);







            });







        } else {







            legacyCopy(txt);







        }







    }















    function legacyCopy(txt) {







        txt.select();







        try {







            document.execCommand('copy');







            showToast('Save Copied', 'Save copied to clipboard!', 'save');







        } catch(e) {







            showToast('Save Export', 'Press Ctrl+C to copy save string.', 'info');







        }







    }















    function downloadSaveJson() {







        const sel = document.getElementById('export-slot-select');







        const slot = sel ? sel.value : selectedExportSlot;







        let dataObj = null;







        if (slot === 'current') {







            dataObj = player;







        } else {







            const slotKey = getSaveSlotKey(slot);







            const data = localStorage.getItem(slotKey);







            if (data) {







                try { dataObj = JSON.parse(data); } catch(e) {}







            } else if (parseInt(slot) === currentSaveSlot) {







                dataObj = player;







            }







        }







        if (!dataObj) {







            showToast('Export', 'No save data to download.', 'info');







            return;







        }







        const jsonStr = JSON.stringify(dataObj, null, 2);







        const blob = new Blob([jsonStr], { type: 'application/json' });







        const url = URL.createObjectURL(blob);







        const a = document.createElement('a');







        a.href = url;







        a.download = `elemental_realms_slot_${slot}.json`;







        document.body.appendChild(a);







        a.click();







        document.body.removeChild(a);







        URL.revokeObjectURL(url);







        showToast('Save Downloaded', `Downloaded elemental_realms_slot_${slot}.json!`, 'save');







    }







    function healInTown() {







        if(player.gold >= 20) {







            player.gold -= 20;







            player.baseStats.hp = pStats.maxHp;







            player.baseStats.mp = pStats.maxMp;







            if (player.roster && Array.isArray(player.roster)) {







                player.roster.forEach(h => {







                    const hs = (typeof computeHeroStats === 'function') ? computeHeroStats(h) : (h.baseStats || { maxHp: 100, maxMp: 50 });







                    h.hp = hs.maxHp;







                    h.mp = hs.maxMp;







                    if (h.baseStats) {







                        h.baseStats.hp = hs.maxHp;







                        h.baseStats.mp = hs.maxMp;







                    }







                });







            }







            init();







            showToast("Inn Rest", "Rested at the Inn. Party HP and MP restored.", "info");







        } else {







            showToast("Inn", "Not enough gold to rest at the Inn!", "info");







        }







    }















    function checkLevelUp() {







        let leveledUp = false;







        let totalOrbsGained = 0;







        let levelsGained = 0;







        







        if (player.level >= 50) {







            player.level = 50;







            player.exp = 0;







            updateHeader();







            return;







        }















        while(player.exp >= player.level * 40) {







            if (player.level >= 50) {







                player.level = 50;







                player.exp = 0;







                break;







            }







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







        







        if (player.level >= 50) {







            player.level = 50;







            player.exp = 0;







        }







        







        if (leveledUp) {







            playSFX('level_up');







            checkAreaUnlocks();







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







            if (prevLevel < 25 && player.level >= 25) {







                setTimeout(() => {







                    showToast('🐾 2nd Companion Slot Unlocked!', 'You can now equip 2 pets simultaneously in the Familiar Sanctuary!', 'level', 6000);







                }, 1200);







            }







        }







        if (typeof syncMainHero === 'function') syncMainHero();







    }















    /* =========================================================================







       UI RENDERING (STATS, INV, SHOP, SKILLS)







       ========================================================================= */















        /* =========================================================================







       ARPG QUALITY-OF-LIFE (QoL) & INTEL SUITE HELPERS







       ========================================================================= */















    let invCategoryFilter = 'all';







    let invSortOrder = 'rarity';















    function setInvFilter(filter) {







        invCategoryFilter = filter;







        renderInventory();







    }















    function setInvSort(sortKey) {







        invSortOrder = sortKey;







        renderInventory();







    }















    function getItemTotalStats(item) {







        let stats = { atk: 0, def: 0, matk: 0, mdef: 0, maxHp: 0, maxMp: 0, spd: 0, crit: 0 };







        if (!item) return stats;















        if (typeof item === 'string') {







            let dbItem = (typeof ITEMS_DB !== 'undefined' && ITEMS_DB[item]) ? ITEMS_DB[item] : null;







            if (!dbItem) return stats;







            for (let s in stats) {







                if (dbItem[s]) stats[s] += dbItem[s];







            }







            return stats;







        }















        if (typeof item === 'object') {







            let upLevel = item.upgradeLevel || 0;







            if (item.baseStats) {







                for (let s in stats) {







                    if (item.baseStats[s]) {







                        stats[s] += (typeof getUpgradedStat === 'function') ? getUpgradedStat(item.baseStats[s], upLevel) : item.baseStats[s];







                    }







                }







            }







            if (item.affixes && Array.isArray(item.affixes)) {







                for (let affix of item.affixes) {







                    if (affix && affix.stat && stats[affix.stat] !== undefined && affix.value) {







                        stats[affix.stat] += affix.value;







                    }







                }







            }







        }







        return stats;







    }















    function calculateGearScore(item) {







        if (!item) return 0;







        const rarityWeights = {







            'Common': 1,







            'Uncommon': 2,







            'Rare': 3,







            'Epic': 4,







            'Legendary': 5,







            'Mythic': 6







        };







        let rarity = 'Common';







        let upLevel = 0;







        if (typeof item === 'object') {







            rarity = item.rarity || 'Common';







            upLevel = item.upgradeLevel || 0;







        } else if (typeof item === 'string' && typeof ITEMS_DB !== 'undefined' && ITEMS_DB[item]) {







            rarity = ITEMS_DB[item].rarity || 'Common';







        }







        let rMult = rarityWeights[rarity] || 1;







        let s = getItemTotalStats(item);















        let score = (rMult * 50) +







                    ((s.atk || 0) * 2) +







                    ((s.def || 0) * 2) +







                    ((s.matk || 0) * 2) +







                    ((s.mdef || 0) * 2) +







                    ((s.maxHp || 0) * 0.5) +







                    ((s.maxMp || 0) * 0.5) +







                    ((s.spd || 0) * 3) +







                    ((s.crit || 0) * 4) +







                    (upLevel * 15);







        return Math.round(score * 10) / 10;







    }















    function compareItemStats(candidate, equipped) {







        if (!candidate) return '';







        if (!equipped) {







            return '<span class="stat-diff-pos">(New Slot Item!)</span>';







        }







        let cStats = getItemTotalStats(candidate);







        let eStats = getItemTotalStats(equipped);







        let statKeys = ['atk', 'def', 'matk', 'mdef', 'maxHp', 'maxMp', 'spd', 'crit'];







        let labels = { atk: 'ATK', def: 'DEF', matk: 'MATK', mdef: 'MDEF', maxHp: 'HP', maxMp: 'MP', spd: 'SPD', crit: 'CRIT' };















        let diffPills = [];







        for (let k of statKeys) {







            let cVal = cStats[k] || 0;







            let eVal = eStats[k] || 0;







            if (cVal === 0 && eVal === 0) continue;







            let diff = cVal - eVal;







            let lbl = labels[k] || k.toUpperCase();







            if (diff > 0) {







                diffPills.push(`<span class="stat-diff-pos">+${diff} ${lbl}</span>`);







            } else if (diff < 0) {







                diffPills.push(`<span class="stat-diff-neg">${diff} ${lbl}</span>`);







            } else {







                diffPills.push(`<span class="stat-diff-eq">±0 ${lbl}</span>`);







            }







        }















        if (diffPills.length === 0) {







            return '<span class="stat-diff-eq">±0 All Stats</span>';







        }







        return `<span class="equip-diff-pills">${diffPills.join(' ')}</span>`;







    }















    function autoEquipBestGear() {







        if (!player || !player.equipment || !player.inventory) return 0;







        if (!player.inventory.equipment) player.inventory.equipment = [];















        const slots = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'accessory'];







        let swappedCount = 0;















        for (let slot of slots) {







            let curEquipped = player.equipment[slot];







            let curScore = curEquipped ? calculateGearScore(curEquipped) : -1;















            let bestIndex = -1;







            let bestScore = curScore;















            for (let i = 0; i < player.inventory.equipment.length; i++) {







                let item = player.inventory.equipment[i];







                if (!item) continue;







                let itemSlot = item.type;







                if (itemSlot === 'chest') itemSlot = 'armor';







                if (itemSlot === slot) {







                    let score = calculateGearScore(item);







                    if (score > bestScore) {







                        bestScore = score;







                        bestIndex = i;







                    }







                }







            }















            if (bestIndex !== -1) {







                let bestItem = player.inventory.equipment[bestIndex];







                player.inventory.equipment.splice(bestIndex, 1);







                if (curEquipped) {







                    let oldInstance = (typeof curEquipped === 'object') ? curEquipped : generateItem(curEquipped, 'Common');







                    player.inventory.equipment.push(oldInstance);







                }







                player.equipment[slot] = bestItem;







                swappedCount++;







            }







        }















        if (swappedCount > 0) {







            computeStats();







            updateHeader();







            renderStats();







            renderInventory();







            showToast('Gear Optimized', `Equipped ${swappedCount} superior item${swappedCount > 1 ? 's' : ''}!`, 'info');







        } else {







            showToast('Gear Optimized', 'Current equipment is already optimal!', 'info');







        }















        return swappedCount;







    }















    function getStatBreakdown(statKey) {







        let result = {







            base: 0,







            gear: 0,







            skillTree: 0,







            achievements: 0,







            pets: 0,







            spire: 0,







            total: 0







        };







        if (!player) return result;







        







        // Base







        if (player.baseStats && player.baseStats[statKey] !== undefined) {







            result.base = player.baseStats[statKey];







        } else if (statKey === 'crit') {







            result.base = 5;







        }







        







        // Gear (all 6 slots)







        if (player.equipment) {







            for (let slot in player.equipment) {







                let item = player.equipment[slot];







                if (item) {







                    let s = getItemTotalStats(item);







                    if (s[statKey]) result.gear += s[statKey];







                }







            }







        }







        







        // Skill Tree







        if (player.skillTree) {







            if (statKey === 'maxHp') result.skillTree += (player.skillTree.vitalityTraining || 0) * 10;







            if (statKey === 'maxMp') result.skillTree += (player.skillTree.spiritTraining || 0) * 5;







            if (statKey === 'atk') result.skillTree += (player.skillTree.atkTraining || 0) * 2;







            if (statKey === 'def') result.skillTree += (player.skillTree.defTraining || 0) * 2;







            if (statKey === 'crit') result.skillTree += (player.skillTree.critTraining || 0) * 2;







            if (statKey === 'matk') result.skillTree += (player.skillTree.arcaneTraining || 0) * 2;







            if (statKey === 'mdef') result.skillTree += (player.skillTree.ironSkin || 0) * 2;







            if (statKey === 'spd') result.skillTree += (player.skillTree.spdTraining || 0) * 1;







        }







        







        // Achievements







        if (player.achievements && typeof ACHIEVEMENTS_DB !== 'undefined') {







            for (let id in player.achievements) {







                if (player.achievements[id] && player.achievements[id].unlocked && ACHIEVEMENTS_DB[id] && ACHIEVEMENTS_DB[id].reward && ACHIEVEMENTS_DB[id].reward.stats) {







                    let st = ACHIEVEMENTS_DB[id].reward.stats;







                    if (st[statKey]) result.achievements += st[statKey];







                }







            }







        }







        







        // Spire







        if (player.spire) {







            if (player.spire.tomesUsed) {







                if (statKey === 'maxHp') result.spire += (player.spire.tomesUsed.hp || 0) * 20;







                if (statKey === 'atk' || statKey === 'matk') result.spire += (player.spire.tomesUsed.atk || 0) * 3;







                if (statKey === 'maxMp') result.spire += (player.spire.tomesUsed.mp || 0) * 10;







            }







            if (player.spire.equippedRelic === 'celestial_feather') {







                if (statKey === 'spd') result.spire += 15;







                if (statKey === 'crit') result.spire += 10;







            }







        }







        







        // Pets







        if (player.pets && Array.isArray(player.pets.active) && typeof PETS_DB !== 'undefined') {







            let bStats = player.baseStats || {};







            player.pets.active.filter(Boolean).forEach(petId => {







                const pet = PETS_DB[petId];







                if (pet && pet.passive) {







                    const lvl = (player.pets.levels && player.pets.levels[petId] && player.pets.levels[petId].level) || 1;







                    const scale = 1 + ((lvl - 1) * 0.10);







                    if (statKey === 'atk' && pet.passive.atkPct) result.pets += Math.max(1, Math.round((bStats.atk || 10) * (pet.passive.atkPct * scale / 100)));







                    if (statKey === 'def' && pet.passive.defPct) result.pets += Math.max(1, Math.round((bStats.def || 10) * (pet.passive.defPct * scale / 100)));







                    if (statKey === 'matk' && pet.passive.matkPct) result.pets += Math.max(1, Math.round((bStats.matk || 10) * (pet.passive.matkPct * scale / 100)));







                    if (statKey === 'mdef' && pet.passive.mdefPct) result.pets += Math.max(1, Math.round((bStats.mdef || 10) * (pet.passive.mdefPct * scale / 100)));







                    if (statKey === 'maxHp' && pet.passive.maxHpPct) result.pets += Math.max(1, Math.round((bStats.maxHp || 100) * (pet.passive.maxHpPct * scale / 100)));







                    if (statKey === 'maxMp' && pet.passive.maxMpPct) result.pets += Math.max(1, Math.round((bStats.maxMp || 50) * (pet.passive.maxMpPct * scale / 100)));







                    if (statKey === 'spd') {







                        if (pet.passive.spd) result.pets += Math.round(pet.passive.spd * scale);







                        if (pet.passive.spdPct) result.pets += Math.max(1, Math.round((bStats.spd || 10) * (pet.passive.spdPct * scale / 100)));







                    }







                    if (statKey === 'crit') {







                        if (pet.passive.crit) result.pets += Math.round(pet.passive.crit * scale);







                        if (pet.passive.critPct) result.pets += Math.round(pet.passive.critPct * scale);







                    }







                }







            });







        }















        result.total = result.base + result.gear + result.skillTree + result.achievements + result.pets + result.spire;







        return result;







    }















    if (typeof window !== 'undefined') {







        window.repeatBattle = repeatBattle;







        window.getBestAvailableHealingPotion = getBestAvailableHealingPotion;







        window.updateQuickPotionButton = updateQuickPotionButton;







        window.useQuickPotion = useQuickPotion;







        window.toggleItemLock = toggleItemLock;







        window.sellAllJunkEquipment = sellAllJunkEquipment;







        window.salvageEquipment = salvageEquipment;







        window.salvageBulk = salvageBulk;







        window.invCategoryFilter = invCategoryFilter;







        window.invSortOrder = invSortOrder;







        window.setInvFilter = setInvFilter;







        window.setInvSort = setInvSort;







        window.getItemTotalStats = getItemTotalStats;







        window.calculateGearScore = calculateGearScore;







        window.compareItemStats = compareItemStats;







        window.autoEquipBestGear = autoEquipBestGear;







        window.getStatBreakdown = getStatBreakdown;







    }















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















        // Stat Calculation Breakdown & Tooltips







        const statConfig = [







            { id: 'stat-atk', key: 'atk', label: 'ATK' },







            { id: 'stat-def', key: 'def', label: 'DEF' },







            { id: 'stat-matk', key: 'matk', label: 'MATK' },







            { id: 'stat-mdef', key: 'mdef', label: 'MDEF' },







            { id: 'stat-spd', key: 'spd', label: 'SPD' },







            { id: 'stat-crit', key: 'crit', label: 'CRIT' },







            { id: 'stat-hp', key: 'maxHp', label: 'HP' },







            { id: 'stat-mp', key: 'maxMp', label: 'MP' }







        ];















        let bdRowsHtml = '';







        for (let sc of statConfig) {







            let bd = getStatBreakdown(sc.key);







            let parts = [`Base ${bd.base}`];







            if (bd.gear) parts.push(`Gear +${bd.gear}`);







            if (bd.skillTree) parts.push(`Tree +${bd.skillTree}`);







            if (bd.pets) parts.push(`Pets +${bd.pets}`);







            if (bd.achievements) parts.push(`Achieve +${bd.achievements}`);







            if (bd.spire) parts.push(`Spire +${bd.spire}`);















            let equationStr = `${sc.label}: ${parts.join(' + ')}`;







            let el = document.getElementById(sc.id);







            if (el) {







                el.title = equationStr;







                el.style.cursor = 'help';







            }















            bdRowsHtml += `







                <div class="stat-breakdown-row" title="${equationStr}">







                    <span class="stat-bd-name">${sc.label}:</span>







                    <span class="stat-bd-formula">${parts.join(' + ')}</span>







                </div>







            `;







        }















        const bdContainer = document.getElementById('stat-breakdown-container');







        if (bdContainer) {







            bdContainer.innerHTML = `







                <div class="stat-breakdown-panel">







                    <div class="stat-breakdown-title">📊 Stat Calculation Sources</div>







                    <div class="stat-breakdown-grid">${bdRowsHtml}</div>







                </div>







            `;







        }







        







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







        







        // Sync active filter buttons & sort dropdown if present in DOM







        ['all', 'weapons', 'armor', 'accessories', 'consumables'].forEach(cat => {







            const btn = document.getElementById('inv-filter-' + cat);







            if (btn) {







                if (invCategoryFilter === cat) btn.classList.add('active');







                else btn.classList.remove('active');







            }







        });







        const sortSelect = document.getElementById('inv-sort-select');







        if (sortSelect) sortSelect.value = invSortOrder;















        // Consumables Section







        let consumablesHtml = '';







        if (invCategoryFilter === 'all' || invCategoryFilter === 'consumables') {







            consumablesHtml = '<div style="margin-bottom: 16px;"><div style="font-size: 14px; font-weight: bold; color: #38bdf8; margin-bottom: 8px; border-bottom: 1px solid #333; padding-bottom: 4px;">Consumables</div>';







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







        }















        // Equipment Section







        let equipmentHtml = '';







        if (invCategoryFilter !== 'consumables') {







            let eqItems = (player.inventory.equipment && Array.isArray(player.inventory.equipment)) ? player.inventory.equipment : [];







            let filteredItems = eqItems.filter(item => {







                if (!item) return false;







                if (invCategoryFilter === 'all') return true;







                if (invCategoryFilter === 'weapons') return item.type === 'weapon';







                if (invCategoryFilter === 'armor') return ['helmet', 'armor', 'chest', 'gloves', 'boots'].includes(item.type);







                if (invCategoryFilter === 'accessories') return item.type === 'accessory';







                return false;







            });















            // Sort filteredItems







            const rarityOrder = { 'Mythic': 6, 'Legendary': 5, 'Epic': 4, 'Rare': 3, 'Uncommon': 2, 'Common': 1 };







            filteredItems.sort((a, b) => {







                if (invSortOrder === 'rarity') {







                    let rDiff = (rarityOrder[b.rarity] || 1) - (rarityOrder[a.rarity] || 1);







                    if (rDiff !== 0) return rDiff;







                    return calculateGearScore(b) - calculateGearScore(a);







                } else if (invSortOrder === 'power') {







                    return calculateGearScore(b) - calculateGearScore(a);







                } else if (invSortOrder === 'name') {







                    return (a.name || '').localeCompare(b.name || '');







                }







                return 0;







            });















            let eqTotalCount = (player.inventory.equipment && player.inventory.equipment.length) || 0;







            let displayCountText = (invCategoryFilter === 'all') ? eqTotalCount : `${filteredItems.length}/${eqTotalCount}`;







            equipmentHtml = `<div><div style="font-size: 14px; font-weight: bold; color: #ffd700; margin-bottom: 8px; border-bottom: 1px solid #333; padding-bottom: 4px;">Equipment (${displayCountText})</div>`;







            







            if (filteredItems.length > 0) {







                for (let item of filteredItems) {







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















                    let setInfoHtml = '';
                    let sId = item.setId || (item.baseName && ITEMS_DB[item.baseName] && ITEMS_DB[item.baseName].setId) || (item.name && ITEMS_DB[item.name] && ITEMS_DB[item.name].setId);
                    if (sId && typeof MYTHIC_SETS_DB !== 'undefined' && MYTHIC_SETS_DB[sId]) {
                        let sDef = MYTHIC_SETS_DB[sId];
                        let activePieces = (typeof getHeroActiveSetCount === 'function') ? getHeroActiveSetCount(player, sId) : 0;
                        setInfoHtml = `<div class="item-set-info" style="font-size: 11px; color: #f43f5e; margin-top: 4px; padding: 4px; background: rgba(244,63,94,0.1); border-radius: 4px; border: 1px solid rgba(244,63,94,0.3);">
                            🌟 <b>Set: ${sDef.name}</b> (${activePieces}/4 Pieces Active)
                            <div style="font-size: 10px; color: ${activePieces >= 2 ? '#4ade80' : '#94a3b8'};">2pc: ${(sDef.bonuses && sDef.bonuses[2] ? sDef.bonuses[2].desc : (sDef.twoPieceBonus ? sDef.twoPieceBonus.desc : ''))}</div>
                            <div style="font-size: 10px; color: ${activePieces >= 4 ? '#4ade80' : '#94a3b8'};">4pc: ${(sDef.bonuses && sDef.bonuses[4] ? sDef.bonuses[4].desc : (sDef.fourPieceBonus ? sDef.fourPieceBonus.desc : ''))}</div>
                        </div>`;
                    }

                    let slotType = item.type === 'chest' ? 'armor' : item.type;







                    let equippedItem = (player.equipment && player.equipment[slotType]) ? player.equipment[slotType] : null;







                    let comparisonHtml = compareItemStats(item, equippedItem);







                    let gearScore = calculateGearScore(item);







                    







                    let isLocked = !!item.locked;







                    equipmentHtml += `







                        <div class="equip-card equip-card-${rarity} ${isLocked ? 'locked' : ''}">







                            <div class="equip-card-top">







                                <div style="display: flex; align-items: center; gap: 6px;">







                                    <button class="btn-lock-toggle ${isLocked ? 'locked' : ''}" onclick="toggleItemLock('${item.id}')" title="${isLocked ? 'Item Locked (Protected)' : 'Click to Lock'}">







                                        ${isLocked ? '🔒' : '🔓'}







                                    </button>







                                    <span class="equip-card-name" style="color: ${color};">${item.name}</span>







                                    ${isLocked ? '<span class="item-lock-badge">LOCKED</span>' : ''}







                                </div>







                                <span class="equip-card-badge" style="background: rgba(255,255,255,0.08); color: ${color}; border: 1px solid ${color};">${rarity} • ${item.type.toUpperCase()}</span>







                            </div>







                            <div class="equip-card-stats">







                                ${baseStatsText ? `<div class="equip-card-base">Base Stats: <b>${baseStatsText}</b></div>` : ''}







                                ${affixesText ? `<div class="equip-card-affixes">Affixes (${item.affixes.length}): <span>${affixesText}</span></div>` : ''}







                                <div style="font-size: 11px; color: #ffd700; margin-top: 3px;">Gear Score: <b>${gearScore}</b></div>







                                <div class="equip-comparison-strip">







                                    <span style="color: #94a3b8; font-size: 10px;">vs Equipped:</span>







                                    ${comparisonHtml}
${setInfoHtml}







                                </div>







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







                equipmentHtml += '<p style="font-size: 12px; color: #666; margin: 6px 0;">No matching equipment in bag.</p>';







            }







            equipmentHtml += '</div>';







        }















        container.innerHTML = consumablesHtml + equipmentHtml;







    }







    function getBranchPoints(branchName) {







        if (!player || !player.skillTree) return 0;







        let points = 0;







        for (let key in SKILL_TREE_DB) {







            const node = SKILL_TREE_DB[key];







            if (node.branch === branchName) {







                const rank = player.skillTree[key] || 0;







                points += (rank * node.cost);







            }







        }







        return points;







    }















        function renderSkillTree() {
        if (!player) return;
        const modalEl = document.getElementById('modal-skilltree');
        const contentEl = document.getElementById('st-content');
        const savedModalScroll = modalEl ? modalEl.scrollTop : 0;
        const savedContentScroll = contentEl ? contentEl.scrollTop : 0;
        const orbsEl = document.getElementById('st-orbs');
        if (orbsEl) orbsEl.innerText = player.skillOrbs || 0;

        const respecBtn = document.getElementById('btn-st-respec');
        if (respecBtn) {
            respecBtn.innerText = player.hasRespecced ? '🔄 Respec Tree (200G)' : '🔄 Respec Tree (Free)';
        }

        const branchDefs = [
            { name: 'Damage', icon: '⚔️' },
            { name: 'Sustain', icon: '🛡️' },
            { name: 'Arcana', icon: '🔮' },
            { name: 'General', icon: '🌟' }
        ];

        let fullHtml = '';
        const curBranch = (typeof window !== 'undefined' && window.activeSkillTreeBranch) || 'all';

        branchDefs.forEach(({ name: bName, icon: bIcon }) => {
            let bPts = getBranchPoints(bName);

            // Group nodes by tier (1, 2, 3)
            let tierNodes = { 1: [], 2: [], 3: [] };
            for (let key in SKILL_TREE_DB) {
                let node = SKILL_TREE_DB[key];
                if (node.branch === bName) {
                    let t = node.tier || 1;
                    if (!tierNodes[t]) tierNodes[t] = [];
                    tierNodes[t].push({ key, ...node });
                }
            }

            let branchCardsHtml = '';
            [1, 2, 3].forEach(tierNum => {
                let nodes = tierNodes[tierNum] || [];
                if (nodes.length === 0) return;

                let tierLabel = tierNum === 1 ? 'Tier 1 • Novice' : (tierNum === 2 ? 'Tier 2 • Adept (5+ Pts)' : 'Tier 3 • Keystones (10+ Pts)');
                branchCardsHtml += `<div class="tier-divider">${tierLabel}</div>`;

                nodes.forEach(node => {
                    let currentRank = (player.skillTree && player.skillTree[node.key]) || 0;
                    let isMaxed = currentRank >= node.max;
                    let isLocked = bPts < (node.reqBranchPts || 0);
                    let canAfford = (player.skillOrbs || 0) >= node.cost;

                    let otherKeystoneActive = false;
                    if (node.type === 'keystone' && currentRank === 0) {
                        for (let otherKey in SKILL_TREE_DB) {
                            if (otherKey !== node.key) {
                                let otherNode = SKILL_TREE_DB[otherKey];
                                if (otherNode.branch === bName && otherNode.type === 'keystone' && (player.skillTree && player.skillTree[otherKey] > 0)) {
                                    otherKeystoneActive = true;
                                    break;
                                }
                            }
                        }
                    }

                    let cardClasses = 'skill-node';
                    if (node.type === 'keystone') cardClasses += ' keystone-node';
                    if (isLocked) cardClasses += ' node-locked';
                    if (isMaxed) cardClasses += ' node-maxed';

                    let statusText = isMaxed ? 'MAXED' : (isLocked ? `🔒 Req ${node.reqBranchPts} Pts` : (otherKeystoneActive ? 'Locked (1 Keystone Max)' : `Cost: ${node.cost} Orb${node.cost > 1 ? 's' : ''}`));
                    let statusColor = isMaxed ? '#55ff55' : (isLocked ? '#94a3b8' : (otherKeystoneActive ? '#94a3b8' : (canAfford ? '#ffd700' : '#ff5555')));
                    let canBuy = !isMaxed && !isLocked && !otherKeystoneActive && canAfford;

                    branchCardsHtml += `
                        <div class="${cardClasses}" id="st-node-${node.key}" data-skill-node="${node.key}">
                            ${node.type === 'keystone' ? '<div class="keystone-badge">KEYSTONE</div>' : ''}
                            <div class="skill-node-header">
                                <span>${node.name}</span>
                                <span id="st-rank-${node.key}">${currentRank}/${node.max}</span>
                            </div>
                            <div class="skill-node-desc">${node.desc}</div>
                            <div class="node-locked-hint" id="st-locked-${node.key}" style="display: ${isLocked ? 'block' : 'none'};">🔒 Requires ${node.reqBranchPts} points in ${node.branch}</div>
                            <div class="skill-node-actions">
                                <span id="st-status-${node.key}" style="font-size: 11px; color: ${statusColor}; font-weight: bold;">${statusText}</span>
                                <button class="btn" id="st-btn-${node.key}" style="padding: 2px 8px; font-size: 11px;" 
                                    ${!canBuy ? 'disabled' : ''} 
                                    onclick="buySkillUpgrade('${node.key}')">Upgrade</button>
                            </div>
                        </div>
                    `;
                });
            });

            fullHtml += `
                <div class="skill-branch st-branch" data-branch="${bName}" style="display: ${curBranch === 'all' || curBranch === bName ? 'flex' : 'none'};">
                    <div class="branch-header st-branch-header">
                        <div class="branch-title st-branch-title">${bIcon} ${bName}</div>
                        <div class="branch-points-badge" id="st-pts-${bName}">${bPts} Pts Invested</div>
                    </div>
                    ${branchCardsHtml}
                </div>
            `;
        });

        if (contentEl) {
            let branchTabsHtml = `
                <div id="st-branch-pills" style="display: flex; gap: 4px; margin-bottom: 12px; overflow-x: auto; padding-bottom: 4px; flex-shrink: 0;">
                    <button class="btn st-pill-btn ${curBranch === 'all' ? 'active' : ''}" style="flex:1; padding: 4px 6px; font-size: 11px; margin: 0;" onclick="filterSkillTreeBranch('all')">All</button>
                    <button class="btn st-pill-btn ${curBranch === 'Damage' ? 'active' : ''}" style="flex:1; padding: 4px 6px; font-size: 11px; margin: 0;" onclick="filterSkillTreeBranch('Damage')">⚔️ Damage</button>
                    <button class="btn st-pill-btn ${curBranch === 'Sustain' ? 'active' : ''}" style="flex:1; padding: 4px 6px; font-size: 11px; margin: 0;" onclick="filterSkillTreeBranch('Sustain')">🛡️ Sustain</button>
                    <button class="btn st-pill-btn ${curBranch === 'Arcana' ? 'active' : ''}" style="flex:1; padding: 4px 6px; font-size: 11px; margin: 0;" onclick="filterSkillTreeBranch('Arcana')">🔮 Arcana</button>
                    <button class="btn st-pill-btn ${curBranch === 'General' ? 'active' : ''}" style="flex:1; padding: 4px 6px; font-size: 11px; margin: 0;" onclick="filterSkillTreeBranch('General')">🌟 General</button>
                </div>
            `;
            let pillsEl = document.getElementById('st-branch-pills');
            if (!pillsEl) {
                contentEl.insertAdjacentHTML('beforebegin', branchTabsHtml);
            } else {
                pillsEl.querySelectorAll('.st-pill-btn').forEach(p => {
                    p.classList.toggle('active', (curBranch === 'all' && p.innerText === 'All') || p.innerText.includes(curBranch));
                });
            }
            contentEl.innerHTML = fullHtml;
            if (modalEl) modalEl.scrollTop = savedModalScroll;
            if (contentEl) contentEl.scrollTop = savedContentScroll;
            requestAnimationFrame(() => {
                if (modalEl) modalEl.scrollTop = savedModalScroll;
                if (contentEl) contentEl.scrollTop = savedContentScroll;
                setTimeout(() => {
                    if (modalEl) modalEl.scrollTop = savedModalScroll;
                    if (contentEl) contentEl.scrollTop = savedContentScroll;
                }, 40);
            });
        }
    }

    function updateSkillTreeUI() {
        if (!player) return;
        const modalEl = document.getElementById('modal-skilltree');
        const contentEl = document.getElementById('st-content');
        const savedModalScroll = modalEl ? modalEl.scrollTop : 0;
        const savedContentScroll = contentEl ? contentEl.scrollTop : 0;

        const orbsEl = document.getElementById('st-orbs');
        if (orbsEl) orbsEl.innerText = player.skillOrbs || 0;

        const respecBtn = document.getElementById('btn-st-respec');
        if (respecBtn) {
            respecBtn.innerText = player.hasRespecced ? '🔄 Respec Tree (200G)' : '🔄 Respec Tree (Free)';
        }

        const branchNames = ['Damage', 'Sustain', 'Arcana', 'General'];
        branchNames.forEach(bName => {
            const bPts = getBranchPoints(bName);
            const badgeEl = document.getElementById(`st-pts-${bName}`);
            if (badgeEl) badgeEl.innerText = `${bPts} Pts Invested`;
        });

        for (let key in SKILL_TREE_DB) {
            const node = SKILL_TREE_DB[key];
            const currentRank = (player.skillTree && player.skillTree[key]) || 0;
            const bPts = getBranchPoints(node.branch);
            const isMaxed = currentRank >= node.max;
            const isLocked = bPts < (node.reqBranchPts || 0);
            const canAfford = (player.skillOrbs || 0) >= node.cost;

            let otherKeystoneActive = false;
            if (node.type === 'keystone' && currentRank === 0) {
                for (let otherKey in SKILL_TREE_DB) {
                    if (otherKey !== key) {
                        let otherNode = SKILL_TREE_DB[otherKey];
                        if (otherNode.branch === node.branch && otherNode.type === 'keystone' && (player.skillTree && player.skillTree[otherKey] > 0)) {
                            otherKeystoneActive = true;
                            break;
                        }
                    }
                }
            }

            const canBuy = !isMaxed && !isLocked && !otherKeystoneActive && canAfford;
            const statusText = isMaxed ? 'MAXED' : (isLocked ? `🔒 Req ${node.reqBranchPts} Pts` : (otherKeystoneActive ? 'Locked (1 Keystone Max)' : `Cost: ${node.cost} Orb${node.cost > 1 ? 's' : ''}`));
            const statusColor = isMaxed ? '#55ff55' : (isLocked ? '#94a3b8' : (otherKeystoneActive ? '#94a3b8' : (canAfford ? '#ffd700' : '#ff5555')));

            const nodeEl = document.getElementById(`st-node-${key}`);
            if (nodeEl) {
                nodeEl.classList.toggle('node-locked', isLocked);
                nodeEl.classList.toggle('node-maxed', isMaxed);
            }

            const rankEl = document.getElementById(`st-rank-${key}`);
            if (rankEl) rankEl.innerText = `${currentRank}/${node.max}`;

            const lockedEl = document.getElementById(`st-locked-${key}`);
            if (lockedEl) lockedEl.style.display = isLocked ? 'block' : 'none';

            const statusEl = document.getElementById(`st-status-${key}`);
            if (statusEl) {
                statusEl.innerText = statusText;
                statusEl.style.color = statusColor;
            }

            const btnEl = document.getElementById(`st-btn-${key}`);
            if (btnEl) {
                btnEl.disabled = !canBuy;
            }
        }

        // Maintain scroll invariants in case of mobile browser focus drift
        if (modalEl && savedModalScroll > 0) modalEl.scrollTop = savedModalScroll;
        if (contentEl && savedContentScroll > 0) contentEl.scrollTop = savedContentScroll;
    }

    function filterSkillTreeBranch(branchName) {
        if (typeof window !== 'undefined') window.activeSkillTreeBranch = branchName;
        const branches = document.querySelectorAll('#st-content .st-branch, #st-content .skill-branch');
        const pills = document.querySelectorAll('#st-branch-pills .st-pill-btn');
        pills.forEach(p => {
            p.classList.toggle('active', (branchName === 'all' && p.innerText === 'All') || p.innerText.includes(branchName));
        });
        branches.forEach(b => {
            if (branchName === 'all') {
                b.style.display = 'flex';
            } else {
                const bBranch = b.getAttribute('data-branch');
                const titleEl = b.querySelector('.st-branch-title, .branch-title');
                const match = (bBranch && bBranch === branchName) || (titleEl && titleEl.innerText.includes(branchName));
                b.style.display = match ? 'flex' : 'none';
            }
        });
    }

    if (typeof window !== 'undefined') {
        window.filterSkillTreeBranch = filterSkillTreeBranch;
        window.updateSkillTreeUI = updateSkillTreeUI;
        window.renderSkillTree = renderSkillTree;
    }

    function buySkillUpgrade(key) {







        if (!player || !player.skillTree) return;







        const upgrade = SKILL_TREE_DB[key];







        if (!upgrade) return;















        const currentRank = player.skillTree[key] || 0;







        if (currentRank >= upgrade.max) return;















        if (player.skillOrbs < upgrade.cost) {







            showToast('Skill Tree', 'Not enough Skill Orbs!', 'warning');







            return;







        }















        const branchPts = getBranchPoints(upgrade.branch);







        if (branchPts < (upgrade.reqBranchPts || 0)) {







            showToast('Locked', `Requires ${upgrade.reqBranchPts} points invested in ${upgrade.branch} branch!`, 'warning');







            return;







        }















        // Enforce Keystone exclusivity: Only 1 Keystone active per branch at a time







        if (upgrade.type === 'keystone') {







            for (let otherKey in SKILL_TREE_DB) {







                if (otherKey !== key) {







                    let otherNode = SKILL_TREE_DB[otherKey];







                    if (otherNode.branch === upgrade.branch && otherNode.type === 'keystone') {







                        if ((player.skillTree[otherKey] || 0) > 0) {







                            showToast('Keystone Limit', `You can only choose 1 Keystone talent per branch! (Active: ${otherNode.name})`, 'warning');







                            return;







                        }







                    }







                }







            }







        }















        player.skillOrbs -= upgrade.cost;







        player.skillTree[key] = currentRank + 1;















        if (upgrade.type === 'active' && player.skillTree[key] === 1) {







            if (!player.skills.includes(upgrade.skillRef)) {







                player.skills.push(upgrade.skillRef);







            }







        }















        playSFX('button_click');
        computeStats();

        const nodeEl = document.getElementById(`st-node-${key}`);
        if (nodeEl && typeof updateSkillTreeUI === 'function') {
            updateSkillTreeUI();
        } else {
            renderSkillTree();
        }

        updateHeader();







        if (typeof checkAchievements === 'function') checkAchievements();







    }















        function respecSkillTree() {







        if (!player || !player.skillTree) return;















        let totalRefund = 0;







        for (let key in SKILL_TREE_DB) {







            let rank = player.skillTree[key] || 0;







            totalRefund += rank * (SKILL_TREE_DB[key].cost || 1);







        }















        if (totalRefund === 0) {







            showToast('Skill Tree', 'No skill points invested to refund!', 'info');







            return;







        }















        let respecCost = player.hasRespecced ? 200 : 0;







        if (player.hasRespecced && (player.gold || 0) < respecCost) {







            showToast('Respec Failed', `Resetting the Skill Tree costs ${respecCost} Gold!`, 'warning');







            return;







        }















        let confirmed = true;







        if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.__testHeadless) {







            confirmed = window.confirm(`Reset your Skill Tree? ${totalRefund} Skill Orbs will be refunded. (Cost: ${respecCost} Gold)`);







        }







        if (!confirmed) return;















        if (respecCost > 0) {







            player.gold -= respecCost;







        }







        player.skillOrbs = (player.skillOrbs || 0) + totalRefund;















        for (let key in SKILL_TREE_DB) {







            player.skillTree[key] = 0;







        }















        // Filter out skills unlocked strictly by the skill tree







        const treeSkills = ['Power Strike', 'Armor Break', 'Recovery'];







        if (player.skills && Array.isArray(player.skills)) {







            player.skills = player.skills.filter(s => !treeSkills.includes(s));







        }















        player.hasRespecced = true;







        computeStats();







        updateHeader();







        renderSkillTree();







        showToast('Skill Tree Reset', `Skill Tree Reset! ${totalRefund} Skill Orbs refunded.`, 'skill', 4000);







    }















    /* =========================================================================







       QUEST SYSTEM







       ========================================================================= */















    function getQuestProgress(quest) {
        if (!player) return { current: 0, rawCurrent: 0, target: (quest && quest.target) || 1, isComplete: false, isClaimed: false, isUnlocked: false };
        let current = 0;

        if (quest.type === 'defeat_enemies') {
            current = (player.questStats && player.questStats.enemiesDefeated) || 0;
        } else if (quest.type === 'reach_level') {
            current = player.level || 1;
        } else if (quest.type === 'have_item') {
            current = (player.inventory && player.inventory[quest.item]) ||
                      (player.inventory && player.inventory.consumables && player.inventory.consumables[quest.item]) || 0;
        } else if (quest.type === 'bosses_defeated') {
            current = (player.questStats && player.questStats.bossesDefeated) || 0;
        } else if (quest.type === 'gold_held') {
            current = player.gold || 0;
        } else if (quest.type === 'skill_ranks') {
            current = typeof getTotalSkillRanks === 'function' ? getTotalSkillRanks() : 0;
        } else if (quest.type === 'conquer_area') {
            const areaNum = parseInt((quest.areaId || '').replace('area_', '')) || 0;
            const nextAreaId = 'area_' + (areaNum + 1);
            const isDefeated = (player.defeatedAreaBosses && player.defeatedAreaBosses.includes(quest.areaId)) ||
                               (player.unlockedAreas && player.unlockedAreas.includes(nextAreaId));
            current = isDefeated ? 1 : 0;
        } else if (quest.type === 'recruit_mercenaries') {
            current = (player.roster && player.roster.filter(h => !h.isMain && h.id !== 'hero_main' && h !== player).length) || 0;
        } else if (quest.type === 'active_squad_size') {
            current = (player.activeParty && player.activeParty.length) || 1;
        } else if (quest.type === 'hero_tier') {
            let maxTier = 0;
            const rosterList = (player.roster && player.roster.length > 0) ? player.roster : [player];
            rosterList.forEach(h => {
                const clsId = h.classId || h.currentClass || (h.isMain ? player.currentClass : null) || (h === player ? player.currentClass : null);
                const cls = (typeof CLASSES_DB !== 'undefined' && clsId) ? CLASSES_DB[clsId] : null;
                const tier = cls ? (cls.tier || 0) : 0;
                if (tier > maxTier) maxTier = tier;
            });
            current = maxTier;
        } else if (quest.type === 'salvage_equipment') {
            current = (player.blacksmithStats && player.blacksmithStats.itemsSalvaged) ||
                      (player.blacksmith && player.blacksmith.salvagedCount) ||
                      player.itemsSalvaged || 0;
        } else if (quest.type === 'blacksmith_upgrade') {
            let maxUpgrade = 0;
            if (player.equipment) {
                Object.values(player.equipment).forEach(eq => {
                    if (eq && eq.upgradeLevel && eq.upgradeLevel > maxUpgrade) maxUpgrade = eq.upgradeLevel;
                });
            }
            if (player.roster) {
                player.roster.forEach(h => {
                    if (h && h.equipment) {
                        Object.values(h.equipment).forEach(eq => {
                            if (eq && eq.upgradeLevel && eq.upgradeLevel > maxUpgrade) maxUpgrade = eq.upgradeLevel;
                        });
                    }
                });
            }
            if (player.inventory && player.inventory.equipment && Array.isArray(player.inventory.equipment)) {
                player.inventory.equipment.forEach(eq => {
                    if (eq && eq.upgradeLevel && eq.upgradeLevel > maxUpgrade) maxUpgrade = eq.upgradeLevel;
                });
            }
            current = maxUpgrade;
        } else if (quest.type === 'spire_floor') {
            current = (player.spire && player.spire.highestFloor) || player.spireHighestFloor || player.spireFloor || (player.spire && player.spire.floor) || 0;
        } else if (quest.type === 'calamity_keystones') {
            current = (player.calamityKeys || 0) + (player.calamityKeysUsed || 0) || (player.calamityUnlocked ? 1 : 0);
        } else if (quest.type === 'calamity_raid_wins') {
            let raidWins = 0;
            if (player.calamityVictories) {
                Object.values(player.calamityVictories).forEach(v => { raidWins += (v || 0); });
            }
            if (player.calamityRaidWins) {
                raidWins = Math.max(raidWins, player.calamityRaidWins);
            }
            current = raidWins;
        }

        let target = quest.target || 1;
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
        if (!player || !player.quests) return 0;
        let count = 0;
        for (let key in QUESTS_DB) {
            let prog = getQuestProgress(QUESTS_DB[key]);
            if (prog.isUnlocked && prog.isComplete && !prog.isClaimed) count++;
        }
        return count;
    }

    function updateTownQuestButton() {
        const questBtn = document.getElementById('btn-town-quests');
        if (!questBtn) return;
        let claimable = getClaimableQuestCount();
        if (claimable > 0) {
            questBtn.innerHTML = `Quests<br><span style="color:#55ff55; font-size:12px;">● ${claimable} Ready!</span>`;
            questBtn.style.borderColor = '#38bdf8';
        } else {
            questBtn.innerHTML = 'Quests';
            questBtn.style.borderColor = '#666';
        }
    }

    window.activeQuestCategory = window.activeQuestCategory || 'all';

    function filterQuestCategory(category) {
        window.activeQuestCategory = category || 'all';
        renderQuests();
    }
    window.filterQuestCategory = filterQuestCategory;

    function renderQuests() {
        const container = document.getElementById('quests-list');
        if (!container) return;

        // Render Category Tabs Ribbon
        let pillsContainer = document.getElementById('quest-category-pills');
        if (!pillsContainer && container.parentElement) {
            pillsContainer = document.createElement('div');
            pillsContainer.id = 'quest-category-pills';
            pillsContainer.className = 'quest-category-pills-bar';
            container.parentElement.insertBefore(pillsContainer, container);
        }

        if (pillsContainer) {
            const categories = [
                { id: 'all', label: 'All' },
                { id: 'story', label: '📖 Story' },
                { id: 'combat', label: '⚔️ Combat' },
                { id: 'squad', label: '👑 Squad' },
                { id: 'forge', label: '🔨 Forge' },
                { id: 'endgame', label: '🗼 Endgame' },
                { id: 'economy', label: '💰 Economy' }
            ];

            pillsContainer.innerHTML = categories.map(cat => `
                <button class="quest-pill-btn ${window.activeQuestCategory === cat.id ? 'active' : ''}" onclick="filterQuestCategory('${cat.id}')">
                    ${cat.label}
                </button>
            `).join('');
        }

        let activeHtml = '';
        let claimedHtml = '';

        for (let key in QUESTS_DB) {
            const quest = QUESTS_DB[key];
            const prog = getQuestProgress(quest);

            // Hide locked tiers whose prerequisites have not yet been claimed
            if (!prog.isUnlocked && !prog.isClaimed) continue;

            // Filter by active category
            if (window.activeQuestCategory && window.activeQuestCategory !== 'all') {
                if (quest.category !== window.activeQuestCategory) continue;
            }

            let statusBadge = '';
            let cardClass = 'quest-card';
            let actionBtn = '';

            if (prog.isClaimed) {
                cardClass += ' claimed';
                statusBadge = '<span class="quest-status-badge quest-badge-claimed">Claimed ✓</span>';
                actionBtn = '<button class="btn" disabled style="padding: 4px 12px; font-size: 12px;">Claimed</button>';
            } else if (prog.isComplete) {
                cardClass += ' ready';
                statusBadge = '<span class="quest-status-badge quest-badge-ready">Ready to Claim!</span>';
                actionBtn = `<button class="btn" style="padding: 4px 12px; font-size: 12px; color: #55ff55; border-color: #55ff55;" onclick="claimQuest('${quest.id}')">Claim Reward</button>`;
            } else {
                statusBadge = '<span class="quest-status-badge quest-badge-progress">In Progress</span>';
                actionBtn = '<button class="btn" disabled style="padding: 4px 12px; font-size: 12px;">In Progress</button>';
            }

            let percent = Math.min(100, Math.floor((prog.rawCurrent / prog.target) * 100));

            let rewardItems = [];
            if (quest.reward.exp) rewardItems.push(`+${quest.reward.exp} EXP`);
            if (quest.reward.gold) rewardItems.push(`+${quest.reward.gold} Gold`);
            if (quest.reward.marks) rewardItems.push(`<span class="quest-reward-marks">🏷️ +${quest.reward.marks} Marks</span>`);
            if (quest.reward.skillOrbs) rewardItems.push(`🔮 +${quest.reward.skillOrbs} Skill Orbs`);
            if (quest.reward.scrap) rewardItems.push(`🔨 +${quest.reward.scrap} Scrap`);
            if (quest.reward.dust) rewardItems.push(`✨ +${quest.reward.dust} Dust`);
            if (quest.reward.shard) rewardItems.push(`💎 +${quest.reward.shard} Shard`);
            if (quest.reward.item) rewardItems.push(`🎁 +${quest.reward.item}${quest.reward.qty > 1 ? ' x' + quest.reward.qty : ''}`);

            let progressLabel = `${Math.min(prog.rawCurrent, prog.target)} / ${prog.target}`;
            if (quest.type === 'have_item') progressLabel += ` in inventory`;
            else if (quest.type === 'gold_held') progressLabel += ` Gold`;
            else if (quest.type === 'skill_ranks') progressLabel += ` Ranks`;
            else if (quest.type === 'bosses_defeated') progressLabel += ` Bosses`;
            else if (quest.type === 'reach_level') progressLabel += ` Level`;
            else if (quest.type === 'conquer_area') progressLabel = prog.isComplete ? 'Conquered ✓' : 'Incomplete (0 / 1)';
            else if (quest.type === 'recruit_mercenaries') progressLabel += ` Mercenaries`;
            else if (quest.type === 'active_squad_size') progressLabel += ` Heroes`;
            else if (quest.type === 'hero_tier') progressLabel = `Tier ${Math.min(prog.rawCurrent, prog.target)} / Tier ${prog.target}`;
            else if (quest.type === 'salvage_equipment') progressLabel += ` Salvaged`;
            else if (quest.type === 'blacksmith_upgrade') progressLabel = `+${Math.min(prog.rawCurrent, prog.target)} / +${prog.target}`;
            else if (quest.type === 'spire_floor') progressLabel = `Floor ${Math.min(prog.rawCurrent, prog.target)} / Floor ${prog.target}`;
            else if (quest.type === 'calamity_keystones') progressLabel += ` Keystones`;
            else if (quest.type === 'calamity_raid_wins') progressLabel += ` Raids Won`;

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

            if (prog.isClaimed) {
                claimedHtml += cardMarkup;
            } else {
                activeHtml += cardMarkup;
            }
        }

        if (!activeHtml && !claimedHtml) {
            container.innerHTML = `<div style="text-align: center; color: #888; padding: 25px;">No quests available in this category yet.</div>`;
        } else {
            container.innerHTML = activeHtml + claimedHtml;
        }

        updateTownQuestButton();
    }

    function claimQuest(questId) {
        const quest = QUESTS_DB[questId];
        if (!quest) return;

        if (!player.quests) player.quests = {};
        if (player.quests[questId] && player.quests[questId].claimed) {
            showToast('Quest', 'Reward already claimed!', 'quest');
            return;
        }

        const prog = getQuestProgress(quest);
        if (!prog.isComplete) {
            showToast('Quest', 'Quest requirement not yet met!', 'quest');
            return;
        }

        player.quests[questId] = { claimed: true };

        let rewardText = [];

        if (quest.reward.exp) {
            player.exp += quest.reward.exp;
            rewardText.push(`+${quest.reward.exp} EXP`);
        }
        if (quest.reward.gold) {
            player.gold += quest.reward.gold;
            rewardText.push(`+${quest.reward.gold} Gold`);
        }
        if (quest.reward.marks) {
            player.bountyMarks = (player.bountyMarks || 0) + quest.reward.marks;
            rewardText.push(`+${quest.reward.marks} Bounty Marks`);
        }
        if (quest.reward.skillOrbs) {
            player.skillOrbs = (player.skillOrbs || 0) + quest.reward.skillOrbs;
            rewardText.push(`+${quest.reward.skillOrbs} Skill Orbs`);
        }
        if (quest.reward.scrap || quest.reward.dust || quest.reward.shard) {
            if (!player.materials) player.materials = { scrap: 0, dust: 0, shard: 0 };
            if (quest.reward.scrap) {
                player.materials.scrap = (player.materials.scrap || 0) + quest.reward.scrap;
                if (player.blacksmith) {
                    if (!player.blacksmith.materials) player.blacksmith.materials = {};
                    player.blacksmith.materials.scrap = (player.blacksmith.materials.scrap || 0) + quest.reward.scrap;
                    player.blacksmith.scrap = (player.blacksmith.scrap || 0) + quest.reward.scrap;
                }
                rewardText.push(`+${quest.reward.scrap} Scrap`);
            }
            if (quest.reward.dust) {
                player.materials.dust = (player.materials.dust || 0) + quest.reward.dust;
                if (player.blacksmith) {
                    if (!player.blacksmith.materials) player.blacksmith.materials = {};
                    player.blacksmith.materials.dust = (player.blacksmith.materials.dust || 0) + quest.reward.dust;
                    player.blacksmith.dust = (player.blacksmith.dust || 0) + quest.reward.dust;
                }
                rewardText.push(`+${quest.reward.dust} Dust`);
            }
            if (quest.reward.shard) {
                player.materials.shard = (player.materials.shard || 0) + quest.reward.shard;
                if (player.blacksmith) {
                    if (!player.blacksmith.materials) player.blacksmith.materials = {};
                    player.blacksmith.materials.shard = (player.blacksmith.materials.shard || 0) + quest.reward.shard;
                    player.blacksmith.shard = (player.blacksmith.shard || 0) + quest.reward.shard;
                }
                rewardText.push(`+${quest.reward.shard} Shard`);
            }
        }
        if (quest.reward.item) {
            let qty = quest.reward.qty || 1;
            let baseItem = ITEMS_DB[quest.reward.item];
            if (baseItem && baseItem.type !== 'consumable') {
                for (let q = 0; q < qty; q++) {
                    let eqInstance = generateItem(quest.reward.item, 'Rare');
                    if (!player.inventory.equipment) player.inventory.equipment = [];
                    player.inventory.equipment.push(eqInstance);
                }
                rewardText.push(`+${quest.reward.item} (Rare) x${qty}`);
            } else {
                if (!player.inventory.consumables) player.inventory.consumables = {};
                player.inventory.consumables[quest.reward.item] = (player.inventory.consumables[quest.reward.item] || 0) + qty;
                rewardText.push(`+${quest.reward.item} x${qty}`);
            }
        }

        showToast('Quest Complete!', `${quest.title}: ${rewardText.join(', ')}`, 'quest');

        if (quest.reward.exp) {
            checkLevelUp();
        }

        computeStats();
        updateHeader();
        renderQuests();

        if (typeof checkAchievements === 'function') checkAchievements();
    }

    window.getQuestProgress = getQuestProgress;
    window.claimQuest = claimQuest;
    window.renderQuests = renderQuests;
    window.getClaimableQuestCount = getClaimableQuestCount;
    window.updateTownQuestButton = updateTownQuestButton;
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
        if (!player) return { current: 0, rawCurrent: 0, target: (achievement && achievement.target) || 1, isUnlocked: false, percent: 0 };
        let current = 0;

        if (achievement.type === 'battles_won') {
            current = (player.questStats && player.questStats.battlesWon) || player.battlesWon || 0;
        } else if (achievement.type === 'bosses_defeated') {
            current = (player.questStats && player.questStats.bossesDefeated) || player.bossesDefeated || 0;
        } else if (achievement.type === 'gold_held') {
            current = player.gold || 0;
        } else if (achievement.type === 'skill_ranks') {
            current = typeof getTotalSkillRanks === 'function' ? getTotalSkillRanks() : 0;
        } else if (achievement.type === 'quests_claimed') {
            current = typeof getClaimedQuestCount === 'function' ? getClaimedQuestCount() : 0;
        } else if (achievement.type === 'reach_level') {
            current = player.level || 1;
        } else if (achievement.type === 'conquer_area') {
            const areaNum = parseInt((achievement.areaId || '').replace('area_', '')) || 0;
            const nextAreaId = 'area_' + (areaNum + 1);
            const isDefeated = (player.defeatedAreaBosses && player.defeatedAreaBosses.includes(achievement.areaId)) ||
                               (player.unlockedAreas && player.unlockedAreas.includes(nextAreaId));
            current = isDefeated ? 1 : 0;
        } else if (achievement.type === 'hero_tier') {
            let maxTier = 0;
            const rosterList = (player.roster && player.roster.length > 0) ? player.roster : [player];
            rosterList.forEach(h => {
                const clsId = h.classId || h.currentClass || (h.isMain ? player.currentClass : null) || (h === player ? player.currentClass : null);
                const cls = (typeof CLASSES_DB !== 'undefined' && clsId) ? CLASSES_DB[clsId] : null;
                const tier = cls ? (cls.tier || 0) : 0;
                if (tier > maxTier) maxTier = tier;
            });
            current = maxTier;
        } else if (achievement.type === 'active_squad_size') {
            current = (player.activeParty && player.activeParty.length) || 1;
        } else if (achievement.type === 'recruit_mercenaries') {
            current = (player.roster && player.roster.filter(h => !h.isMain && h.id !== 'hero_main' && h !== player).length) || 0;
        } else if (achievement.type === 'blacksmith_upgrade') {
            let maxUpgrade = 0;
            if (player.equipment) {
                Object.values(player.equipment).forEach(eq => {
                    if (eq && eq.upgradeLevel && eq.upgradeLevel > maxUpgrade) maxUpgrade = eq.upgradeLevel;
                });
            }
            if (player.roster) {
                player.roster.forEach(h => {
                    if (h && h.equipment) {
                        Object.values(h.equipment).forEach(eq => {
                            if (eq && eq.upgradeLevel && eq.upgradeLevel > maxUpgrade) maxUpgrade = eq.upgradeLevel;
                        });
                    }
                });
            }
            if (player.inventory && player.inventory.equipment && Array.isArray(player.inventory.equipment)) {
                player.inventory.equipment.forEach(eq => {
                    if (eq && eq.upgradeLevel && eq.upgradeLevel > maxUpgrade) maxUpgrade = eq.upgradeLevel;
                });
            }
            current = maxUpgrade;
        } else if (achievement.type === 'salvage_equipment') {
            current = (player.blacksmithStats && player.blacksmithStats.itemsSalvaged) ||
                      (player.blacksmith && player.blacksmith.salvagedCount) ||
                      player.itemsSalvaged || 0;
        } else if (achievement.type === 'spire_floor') {
            current = (player.spire && player.spire.highestFloor) || player.spireHighestFloor || player.spireFloor || (player.spire && player.spire.floor) || 0;
        } else if (achievement.type === 'relics_possessed') {
            let rCount = 0;
            if (player.spire && Array.isArray(player.spire.relics)) rCount = Math.max(rCount, player.spire.relics.length);
            if (player.relics) {
                rCount = Math.max(rCount, Array.isArray(player.relics) ? player.relics.length : Object.keys(player.relics).length);
            }
            current = rCount;
        } else if (achievement.type === 'calamity_raid_wins') {
            let raidWins = 0;
            if (player.calamityVictories) {
                Object.values(player.calamityVictories).forEach(v => { raidWins += (v || 0); });
            }
            if (player.calamityRaidWins) {
                raidWins = Math.max(raidWins, player.calamityRaidWins);
            }
            current = raidWins;
        } else if (achievement.type === 'stagger_breaks') {
            current = (player.questStats && player.questStats.staggerBreaks) || player.staggerBreaks || 0;
        } else if (achievement.type === 'calamity_boss_defeated') {
            let isDefeated = false;
            if (player.defeatedBosses && player.defeatedBosses.includes(achievement.bossName)) isDefeated = true;
            if (player.calamityVictories) {
                if (player.calamityVictories[achievement.bossName]) isDefeated = true;
                if (achievement.bossName === 'Chronos, Cosmic Void-Incarnate' && player.calamityVictories['raid_chronos']) isDefeated = true;
                if (achievement.bossName === 'Ignis, The Living Supernova' && player.calamityVictories['raid_ignis']) isDefeated = true;
                if (achievement.bossName === 'Leviathan, The Abyssal Sovereign' && player.calamityVictories['raid_leviathan']) isDefeated = true;
            }
            current = isDefeated ? 1 : 0;
        }

        let target = achievement.target || 1;
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
        if (!player || !player.achievements) return 0;
        let count = 0;
        for (let id in ACHIEVEMENTS_DB) {
            if (player.achievements[id] && player.achievements[id].unlocked) count++;
        }
        return count;
    }

    function updateTownAchievementsButton() {
        const achBtn = document.getElementById('btn-town-achievements');
        if (!achBtn) return;
        let unlocked = getUnlockedAchievementCount();
        let total = typeof ACHIEVEMENTS_DB !== 'undefined' ? Object.keys(ACHIEVEMENTS_DB).length : 37;
        achBtn.innerHTML = `Achievements<br><span style="color:#c084fc; font-size:12px;">★ ${unlocked}/${total} Unlocked</span>`;
        if (unlocked > 0) {
            achBtn.style.borderColor = '#c084fc';
        } else {
            achBtn.style.borderColor = '#666';
        }
    }

    function checkAchievements(silent = false) {
        if (!player) return;
        if (!player.achievements) player.achievements = {};
        if (typeof ACHIEVEMENTS_DB === 'undefined') return;
        let anyUnlocked = false;

        for (let id in ACHIEVEMENTS_DB) {
            const ach = ACHIEVEMENTS_DB[id];
            if (player.achievements[id] && player.achievements[id].unlocked) continue;

            const prog = getAchievementProgress(ach);
            if (prog.rawCurrent >= prog.target) {
                player.achievements[id] = { unlocked: true, unlockedAt: Date.now() };
                anyUnlocked = true;

                if (ach.reward && ach.reward.title) {
                    player.activeTitle = ach.reward.title;
                }

                let statRewards = [];
                if (ach.reward && ach.reward.stats) {
                    for (let s in ach.reward.stats) {
                        statRewards.push(`+${ach.reward.stats[s]} ${s.toUpperCase()}`);
                    }
                }

                if (typeof battleState !== 'undefined' && battleState.active) {
                    logMsg(`★ Achievement Unlocked: ${ach.title}! Title: "${ach.reward.title}"`, "#ffd700");
                }
                if (!silent) {
                    showToast('Achievement Unlocked!', `${ach.title} — Title: "${ach.reward.title}" (${statRewards.join(', ')})`, 'achievement', 4000);
                }
            }
        }

        if (anyUnlocked) {
            computeStats();
            updateHeader();
            updateTownAchievementsButton();
        }
    }

    window.activeAchievementCategory = window.activeAchievementCategory || 'all';

    function filterAchievementCategory(category) {
        window.activeAchievementCategory = category || 'all';
        renderAchievements();
    }
    window.filterAchievementCategory = filterAchievementCategory;

    function equipTitle(titleName) {
        if (!player) return;
        let ownsTitle = (titleName === 'Novice');
        if (player.achievements && typeof ACHIEVEMENTS_DB !== 'undefined') {
            for (let id in player.achievements) {
                if (player.achievements[id] && player.achievements[id].unlocked) {
                    const ach = ACHIEVEMENTS_DB[id];
                    if (ach && ach.reward && ach.reward.title === titleName) {
                        ownsTitle = true;
                        break;
                    }
                }
            }
        }
        if (player.purchasedTitles && player.purchasedTitles.includes(titleName)) ownsTitle = true;
        if (player.activeTitle === titleName) ownsTitle = true;

        if (!ownsTitle) {
            showToast('Title Locked', `Unlock the achievement to equip "${titleName}".`, 'warning');
            return;
        }

        player.activeTitle = titleName;
        updateHeader();
        renderAchievements();
        showToast('Title Equipped', `Character title set to "${titleName}"!`, 'achievement', 3000);
    }
    window.equipTitle = equipTitle;

    function renderAchievements() {
        checkAchievements(true);
        const container = document.getElementById('achievements-list');
        if (!container) return;

        // Render Category Tabs Ribbon
        let pillsContainer = document.getElementById('ach-category-pills');
        if (!pillsContainer && container.parentElement) {
            pillsContainer = document.createElement('div');
            pillsContainer.id = 'ach-category-pills';
            pillsContainer.className = 'ach-category-pills-bar';
            container.parentElement.insertBefore(pillsContainer, container);
        }

        const achCategories = [
            { id: 'all', label: 'All' },
            { id: 'conquest', label: '⚔️ Conquest' },
            { id: 'class', label: '👑 Class & Squad' },
            { id: 'forge', label: '🔨 Forge' },
            { id: 'endgame', label: '🗼 Spire & Raids' },
            { id: 'milestones', label: '⭐ Milestones' }
        ];

        if (pillsContainer) {
            pillsContainer.innerHTML = achCategories.map(cat => `
                <button class="ach-pill-btn ${window.activeAchievementCategory === cat.id ? 'active' : ''}" onclick="filterAchievementCategory('${cat.id}')">
                    ${cat.label}
                </button>
            `).join('');
        }

        let html = '';
        for (let key in ACHIEVEMENTS_DB) {
            const ach = ACHIEVEMENTS_DB[key];

            // Category filtering
            if (window.activeAchievementCategory && window.activeAchievementCategory !== 'all') {
                const curCat = window.activeAchievementCategory;
                let match = false;
                if (curCat === 'conquest' && (ach.category === 'conquest' || ach.category === 'combat')) match = true;
                else if (curCat === 'class' && (ach.category === 'class' || ach.category === 'squad')) match = true;
                else if (curCat === 'endgame' && (ach.category === 'endgame' || ach.category === 'spire' || ach.category === 'calamity')) match = true;
                else if (curCat === ach.category) match = true;
                if (!match) continue;
            }

            const prog = getAchievementProgress(ach);

            let cardClass = 'achievement-card';
            let statusBadge = '';

            if (prog.isUnlocked) {
                cardClass += ' unlocked';
                statusBadge = '<span class="ach-status-badge ach-badge-unlocked">★ Unlocked</span>';
            } else {
                statusBadge = `<span class="ach-status-badge ach-badge-locked">Locked (${prog.percent}%)</span>`;
            }

            let statChips = [];
            if (ach.reward.stats) {
                for (let s in ach.reward.stats) {
                    statChips.push(`<span class="ach-stat-chip">+${ach.reward.stats[s]} ${s.toUpperCase()}</span>`);
                }
            }
            let statChipsHtml = statChips.length > 0 ? `<div class="ach-stat-chips-container">${statChips.join(' ')}</div>` : '';

            let isEquipped = (prog.isUnlocked && ach.reward && ach.reward.title && player.activeTitle === ach.reward.title);
            let titleAction = '';
            if (prog.isUnlocked && ach.reward && ach.reward.title) {
                if (isEquipped) {
                    titleAction = '<span class="title-equipped-badge">👑 Equipped</span>';
                } else {
                    titleAction = `<button class="btn btn-equip-title" onclick="equipTitle('${ach.reward.title}')">Equip Title</button>`;
                }
            }

            let rewardLabel = `
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; width: 100%;">
                    <div>
                        <span class="ach-title-name" style="color:#ffd700; font-weight: bold;">Title: "${ach.reward.title}"</span>
                        ${statChipsHtml}
                    </div>
                    <div>${titleAction}</div>
                </div>
            `;

            let progressLabel = `${prog.current} / ${prog.target}`;
            if (ach.type === 'gold_held') progressLabel += ' Gold';
            else if (ach.type === 'skill_ranks') progressLabel += ' Ranks';
            else if (ach.type === 'quests_claimed') progressLabel += ' Quests';
            else if (ach.type === 'battles_won') progressLabel += ' Battles';
            else if (ach.type === 'bosses_defeated') progressLabel += ' Bosses';
            else if (ach.type === 'reach_level') progressLabel += ' Level';
            else if (ach.type === 'conquer_area') progressLabel = prog.isUnlocked ? 'Conquered ✓' : 'Incomplete (0 / 1)';
            else if (ach.type === 'hero_tier') progressLabel = `Tier ${prog.current} / Tier ${prog.target}`;
            else if (ach.type === 'active_squad_size') progressLabel += ' Heroes';
            else if (ach.type === 'recruit_mercenaries') progressLabel += ' Recruits';
            else if (ach.type === 'blacksmith_upgrade') progressLabel = `+${prog.current} / +${prog.target}`;
            else if (ach.type === 'salvage_equipment') progressLabel += ' Items';
            else if (ach.type === 'spire_floor') progressLabel = `Floor ${prog.current} / Floor ${prog.target}`;
            else if (ach.type === 'relics_possessed') progressLabel += ' Relics';
            else if (ach.type === 'calamity_raid_wins') progressLabel += ' Raids Won';
            else if (ach.type === 'stagger_breaks') progressLabel += ' Stagger Breaks';
            else if (ach.type === 'calamity_boss_defeated') progressLabel = prog.isUnlocked ? 'Vanquished ✓' : 'Incomplete (0 / 1)';

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

        if (!html) {
            container.innerHTML = `<div style="text-align: center; color: #888; padding: 25px;">No achievements in this category yet.</div>`;
        } else {
            container.innerHTML = html;
        }

        updateTownAchievementsButton();
    }

    window.getAchievementProgress = getAchievementProgress;
    window.checkAchievements = checkAchievements;
    window.renderAchievements = renderAchievements;
    window.getUnlockedAchievementCount = getUnlockedAchievementCount;
    window.updateTownAchievementsButton = updateTownAchievementsButton;
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















    /* =========================================================================







       TOWN SHOP & MERCHANT OVERHAUL ENGINE







       ========================================================================= */















    let shopActiveTab = 'consumables';















    function setShopTab(tab) {







        shopActiveTab = tab;







        renderShop();







    }















    function renderShop() {







        const goldEl = document.getElementById('shop-gold');







        if (goldEl) goldEl.innerText = player.gold || 0;















        // Update Nav Tabs Active Class







        ['equipment', 'consumables', 'materials'].forEach(t => {







            const btn = document.getElementById(`shop-tab-${t}`);







            if (btn) {







                if (t === shopActiveTab) btn.classList.add('active');







                else btn.classList.remove('active');







            }







        });















        const listEl = document.getElementById('shop-list');







        if (!listEl) return;















        let html = '';















        if (shopActiveTab === 'consumables') {







            // Render Consumables with Bulk Purchasing Options







            const consumableList = [







                'Potion', 'Hi-Potion', 'Mega-Potion', 'Max Potion',







                'Ether', 'Hi-Ether', 'Elixir', 'Cleansing Salve', 'Smoke Bomb'







            ];







            







            html += `<div style="display:flex; flex-direction:column; gap:8px;">`;







            for (let itemName of consumableList) {







                let item = ITEMS_DB[itemName];







                if (!item) continue;







                let p1 = item.price * 1;







                let p5 = item.price * 5;







                let p10 = item.price * 10;







                let pGold = player.gold || 0;















                html += `







                <div class="item-row" style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:rgba(15,23,42,0.6); border-radius:6px; border:1px solid rgba(255,255,255,0.06);">







                    <div style="flex:1; min-width:0; padding-right:12px;">







                        <b style="color:#f8fafc; font-size:14px;">${itemName}</b> - <span style="color:#ffd700; font-weight:600;">${item.price} G</span>







                        <div style="font-size:12px; color:#94a3b8; margin-top:2px;">${item.desc}</div>







                    </div>







                    <div class="shop-bulk-btn-group">







                        <button class="shop-bulk-btn" onclick="buyItem('${itemName}', 1)" ${pGold < p1 ? 'disabled' : ''}>Buy x1 (${p1}G)</button>







                        <button class="shop-bulk-btn" onclick="buyItem('${itemName}', 5)" ${pGold < p5 ? 'disabled' : ''}>Buy x5 (${p5}G)</button>







                        <button class="shop-bulk-btn" onclick="buyItem('${itemName}', 10)" ${pGold < p10 ? 'disabled' : ''}>Buy x10 (${p10}G)</button>







                    </div>







                </div>`;







            }







            html += `</div>`;







        } else if (shopActiveTab === 'equipment') {







            // Render Mystery Boxes at the Top







            html += `







            <div style="margin-bottom: 20px;">







                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid rgba(255,215,0,0.25); padding-bottom:6px;">







                    <span style="font-size:14px; font-weight:bold; color:#ffd700;">📦 Mystery Gear Coffers</span>







                    <span style="font-size:11px; color:#94a3b8;">High-risk, high-reward gear unboxing</span>







                </div>







                <div class="mystery-box-grid">`;















            if (typeof MYSTERY_BOXES_DB !== 'undefined') {







                for (let bKey in MYSTERY_BOXES_DB) {







                    let box = MYSTERY_BOXES_DB[bKey];







                    let isCel = (bKey === 'celestial');







                    let pGold = player.gold || 0;







                    let canAfford = (pGold >= box.cost);







                    let chestSvg = (typeof SVG_SPRITES !== 'undefined' && SVG_SPRITES[isCel ? 'Celestial Chest' : 'Mystery Chest']) || '';















                    html += `







                        <div class="mystery-box-card ${isCel ? 'mystery-box-celestial' : ''}">







                            <div style="width:72px; height:72px; margin-bottom:8px;">${chestSvg}</div>







                            <div style="font-size:15px; font-weight:bold; color:${box.color}; margin-bottom:4px;">${box.name}</div>







                            <div style="font-size:12px; color:#cbd5e1; margin-bottom:10px; min-height:36px;">${box.desc}</div>







                            <div style="font-size:11px; color:#94a3b8; margin-bottom:12px; background:rgba(0,0,0,0.3); border-radius:4px; padding:4px 8px; width:100%;">







                                Rates: ${box.weights.map(w => `<span style="color:${(typeof RARITY_TIERS !== 'undefined' && RARITY_TIERS[w.rarity]?.color) || '#fff'}; font-weight:600;">${w.rarity} ${w.weight}%</span>`).join(', ')}







                            </div>







                            <button class="btn" style="width:100%; font-weight:bold; background:${isCel ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'linear-gradient(135deg, #0284c7, #38bdf8)'}; color:#fff;" onclick="buyMysteryBox('${bKey}')" ${!canAfford ? 'disabled' : ''}>







                                ${isCel ? 'Open Celestial Box (1000G)' : 'Open Box (250G)'}







                            </button>







                        </div>`;







                }







            }















            html += `</div></div>`;















            // Render Zone Equipment Sections







            html += `







            <div>







                <div style="font-size:14px; font-weight:bold; color:#38bdf8; margin-bottom:10px; border-bottom:1px solid rgba(56,189,248,0.25); padding-bottom:6px;">







                    ⚔️ Regional Armory Stock







                </div>`;















            if (typeof SHOP_EQUIPMENT_TIERS !== 'undefined') {







                for (let tierKey in SHOP_EQUIPMENT_TIERS) {







                    let tier = SHOP_EQUIPMENT_TIERS[tierKey];







                    let reqMinLevel = (typeof AREAS_DB !== 'undefined' && AREAS_DB[tierKey] && AREAS_DB[tierKey].minLevel) || 1;
                    const tierNum = parseInt(tierKey.split('_')[1]) || 1;
                    const prevAreaId = `area_${tierNum - 1}`;
                    const isUnlocked = tierNum === 1 || 
                                       (player.defeatedAreaBosses && player.defeatedAreaBosses.includes(prevAreaId)) ||
                                       (player.unlockedAreas && player.unlockedAreas.includes(tierKey) && tierNum <= player.unlockedAreas.length);















                    if (isUnlocked) {







                        html += `







                        <div style="margin-bottom:16px; background:rgba(15,23,42,0.4); border:1px solid rgba(74,222,128,0.25); border-radius:8px; padding:10px 12px;">







                            <div style="font-size:13px; font-weight:bold; color:#4ade80; margin-bottom:8px;">







                                🛡️ ${tier.name}







                            </div>







                            <div style="display:flex; flex-direction:column; gap:6px;">`;















                        for (let itemName of tier.items) {







                            let item = ITEMS_DB[itemName];







                            if (!item) continue;







                            let canAfford = (player.gold || 0) >= item.price;







                            html += `







                                <div class="item-row" style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.04);">







                                    <div>







                                        <b style="color:#f8fafc; font-size:13px;">${itemName}</b> <span style="font-size:11px; text-transform:uppercase; color:#94a3b8;">(${item.type})</span> - <span style="color:#ffd700; font-weight:600;">${item.price} G</span>







                                        <div style="font-size:11px; color:#94a3b8;">${item.desc}</div>







                                    </div>







                                    <div>







                                        <button class="btn" style="padding:4px 12px; font-size:12px;" onclick="buyItem('${itemName}', 1)" ${!canAfford ? 'disabled' : ''}>Buy</button>







                                    </div>







                                </div>`;







                        }















                        html += `</div></div>`;







                    } else {







                        let areaTitle = (typeof AREAS_DB !== 'undefined' && AREAS_DB[tierKey] && AREAS_DB[tierKey].name) || tier.name;
                        let prevBossName = (typeof AREAS_DB !== 'undefined' && AREAS_DB[prevAreaId] && AREAS_DB[prevAreaId].boss && AREAS_DB[prevAreaId].boss.name) || 'Area Boss';
                        html += `
                        <div style="margin-bottom:12px; background:rgba(15,23,42,0.3); border:1px dashed #64748b; border-radius:8px; padding:10px 14px; opacity:0.65;">
                            <div style="font-size:13px; font-weight:bold; color:#94a3b8;">
                                🔒 Locked — Defeat Area ${tierNum - 1} Boss (${prevBossName}) to unlock Tier ${tierNum} Equipment!
                            </div>
                            <div style="font-size:11px; color:#64748b; margin-top:2px;">
                                Defeat the gatekeeper boss of Area ${tierNum - 1} (${prevBossName}) to unlock this regional armory stock.
                            </div>
                        </div>`;







                    }







                }







            }







            html += `</div>`;







        } else if (shopActiveTab === 'materials') {







            // Render Materials Exchange







            if (!player.materials) player.materials = { scrap: 0, dust: 0, shard: 0 };















            html += `







            <div class="materials-stock-banner">







                <span style="color:#cbd5e1;">🔨 Scraps: <b style="color:#fff;">${player.materials.scrap || 0}</b></span>







                <span style="color:#38bdf8;">✨ Dust: <b style="color:#fff;">${player.materials.dust || 0}</b></span>







                <span style="color:#c084fc;">🔮 Shards: <b style="color:#fff;">${player.materials.shard || 0}</b></span>







                <span style="color:#ffd700;">💰 Gold: <b style="color:#fff;">${player.gold || 0} G</b></span>







            </div>







            <div style="display:flex; flex-direction:column; gap:8px;">`;















            if (typeof SHOP_MATERIALS_DB !== 'undefined') {







                for (let pack of SHOP_MATERIALS_DB) {







                    let reqArea = pack.reqArea;







                    let isUnlocked = reqArea ? ((player.unlockedAreas && player.unlockedAreas.includes(reqArea)) || ((player.level || 1) >= (AREAS_DB[reqArea]?.minLevel || 16))) : true;







                    let canAfford = (player.gold || 0) >= pack.price;















                    if (isUnlocked) {







                        html += `







                        <div class="item-row" style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:rgba(15,23,42,0.6); border-radius:6px; border:1px solid rgba(255,255,255,0.06);">







                            <div style="flex:1; min-width:0; padding-right:12px;">







                                <div style="display:flex; align-items:center; gap:6px;">







                                    <span style="font-size:18px;">${pack.icon}</span>







                                    <b style="color:#f8fafc; font-size:14px;">${pack.name}</b> - <span style="color:#ffd700; font-weight:600;">${pack.price} G</span>







                                </div>







                                <div style="font-size:12px; color:#94a3b8; margin-top:2px;">${pack.desc}</div>







                            </div>







                            <div>







                                <button class="btn" style="padding:6px 14px; font-size:12px;" onclick="buyMaterial('${pack.id}', ${pack.count}, ${pack.price})" ${!canAfford ? 'disabled' : ''}>Buy Pack</button>







                            </div>







                        </div>`;







                    } else {







                        let areaTitle = (typeof AREAS_DB !== 'undefined' && AREAS_DB[reqArea] && AREAS_DB[reqArea].name) || 'Infernal Caldera';







                        html += `







                        <div class="item-row" style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:rgba(15,23,42,0.3); border-radius:6px; border:1px dashed #64748b; opacity:0.55;">







                            <div>







                                <div style="display:flex; align-items:center; gap:6px;">







                                    <span style="font-size:18px;">${pack.icon}</span>







                                    <b style="color:#94a3b8; font-size:14px;">${pack.name}</b> - <span style="color:#ffd700;">${pack.price} G</span>







                                </div>







                                <div style="font-size:12px; color:#ef4444; margin-top:2px;">🔒 Requires reaching ${areaTitle}</div>







                            </div>







                            <div>







                                <button class="btn" style="padding:6px 14px; font-size:12px;" disabled>Locked</button>







                            </div>







                        </div>`;







                    }







                }







            }







            html += `</div>`;







        }















        listEl.innerHTML = html;







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















    function toggleItemLock(itemId) {







        if (!player || !player.inventory || !player.inventory.equipment) return;







        const item = player.inventory.equipment.find(i => i.id === itemId);







        if (!item) return;







        item.locked = !item.locked;







        showToast(item.locked ? 'Item Locked' : 'Item Unlocked', `${item.name} is now ${item.locked ? 'protected from sale and salvage' : 'unlocked'}.`, 'info');







        renderInventory();







    }















    function sellItem(itemId) {







        if (!player || !player.inventory || !player.inventory.equipment) return;







        







        let index = player.inventory.equipment.findIndex(i => i.id === itemId);







        if (index === -1) return;







        







        let item = player.inventory.equipment[index];







        if (item && item.locked) {







            showToast('Item Protected', `${item.name} is locked! Unlock it first to sell.`, 'info');







            return;







        }















        let price = item.sellPrice || 10;







        







        player.inventory.equipment.splice(index, 1);







        player.gold += price;







        







        showToast('Item Sold', `Sold ${item.name} for +${price} Gold.`, 'save');







        







        updateHeader();







        renderInventory();







        if (typeof checkAchievements === 'function') checkAchievements();







    }















    function sellAllJunkEquipment() {







        if (!player || !player.inventory || !player.inventory.equipment) return;







        const junk = player.inventory.equipment.filter(i => !i.locked && (i.rarity === 'Common' || i.rarity === 'Uncommon'));







        if (junk.length === 0) {







            showToast('No Junk', 'No unlocked Common or Uncommon gear to sell.', 'info');







            return;







        }







        let totalGold = junk.reduce((sum, item) => sum + (item.sellPrice || 10), 0);







        player.inventory.equipment = player.inventory.equipment.filter(i => i.locked || (i.rarity !== 'Common' && i.rarity !== 'Uncommon'));







        player.gold += totalGold;







        if (typeof playSFX === 'function') playSFX('coin');







        showToast('Batch Sold', `Sold ${junk.length} junk items for ${totalGold} Gold!`, 'save');







        renderInventory();







        if (typeof renderShop === 'function') renderShop();







        updateHeader();







        if (typeof checkAchievements === 'function') checkAchievements();







    }















    function buyItem(itemName, count = 1) {







        let item = ITEMS_DB[itemName];







        if (!item) return;







        let qty = Math.max(1, parseInt(count) || 1);







        let totalCost = item.price * qty;















        if ((player.gold || 0) < totalCost) {







            showToast("Shop", "Not enough gold.", "info");







            return;







        }















        player.gold -= totalCost;















        if (item.type === 'consumable') {







            if (!player.inventory.consumables) player.inventory.consumables = {};







            player.inventory.consumables[itemName] = (player.inventory.consumables[itemName] || 0) + qty;







            if (player.inventory !== player.inventory.consumables) {







                try {







                    player.inventory[itemName] = player.inventory.consumables[itemName];







                } catch(e) {}







            }







        } else {







            if (!player.inventory.equipment) player.inventory.equipment = [];







            for (let i = 0; i < qty; i++) {







                let eq = generateItem(itemName, 'Common');







                player.inventory.equipment.push(eq);







            }







        }















        showToast('Shop Purchase', `Purchased ${itemName}${qty > 1 ? ' x' + qty : ''}!`, 'info');







        renderShop();







        updateHeader();







        if (typeof renderInventory === 'function') renderInventory();







        if (typeof checkAchievements === 'function') checkAchievements();







    }















    function buyMaterial(matKeyOrId, count, cost) {







        let matKey = matKeyOrId;







        let packCount = count;







        let packCost = cost;















        if (typeof SHOP_MATERIALS_DB !== 'undefined') {







            const pack = SHOP_MATERIALS_DB.find(p => p.id === matKeyOrId);







            if (pack) {







                matKey = pack.matKey;







                packCount = pack.count;







                packCost = pack.price;







            }







        }















        if ((player.gold || 0) < packCost) {







            showToast("Shop", "Not enough gold.", "info");







            return;







        }















        if (!player.materials) player.materials = { scrap: 0, dust: 0, shard: 0 };







        player.gold -= packCost;







        player.materials[matKey] = (player.materials[matKey] || 0) + packCount;















        let matName = matKey === 'scrap' ? 'Iron Scraps' : (matKey === 'dust' ? 'Arcane Dust' : 'Void Shards');







        playSFX('coin');







        showToast('Materials Purchased', `Acquired ${packCount}x ${matName}!`, 'info');







        renderShop();







        updateHeader();







    }















    function buyMysteryBox(boxKey) {







        if (typeof MYSTERY_BOXES_DB === 'undefined') return;







        const box = MYSTERY_BOXES_DB[boxKey];







        if (!box) return;















        if ((player.gold || 0) < box.cost) {







            showToast("Shop", "Not enough gold.", "info");







            return;







        }















        player.gold -= box.cost;







        updateHeader();















        // 1. Roll Rarity based on box.weights







        let totalWeight = box.weights.reduce((sum, w) => sum + w.weight, 0);







        let rand = Math.random() * totalWeight;







        let cum = 0;







        let rolledRarity = box.weights[0].rarity;







        for (let w of box.weights) {







            cum += w.weight;







            if (rand < cum) {







                rolledRarity = w.rarity;







                break;







            }







        }















        // 2. Select eligible base item







        let eligibleItems = [];







        if (boxKey === 'celestial') {







            ['area_3', 'area_4', 'area_5', 'area_6', 'area_7', 'area_8', 'area_9', 'area_10'].forEach(a => {







                if (typeof SHOP_EQUIPMENT_TIERS !== 'undefined' && SHOP_EQUIPMENT_TIERS[a]) {







                    eligibleItems.push(...SHOP_EQUIPMENT_TIERS[a].items);







                }







            });







        } else {







            let tiersToCheck = ['area_1', 'area_2', 'area_3', 'area_4', 'area_5', 'area_6', 'area_7', 'area_8', 'area_9', 'area_10'];







            for (let a of tiersToCheck) {







                let tierNum = parseInt(a.split('_')[1]) || 1;
                let prevAreaId = `area_${tierNum - 1}`;
                let isUnlocked = tierNum === 1 || 
                                 (player.defeatedAreaBosses && player.defeatedAreaBosses.includes(prevAreaId)) ||
                                 (player.unlockedAreas && player.unlockedAreas.includes(a) && tierNum <= player.unlockedAreas.length);







                if (isUnlocked && typeof SHOP_EQUIPMENT_TIERS !== 'undefined' && SHOP_EQUIPMENT_TIERS[a]) {







                    eligibleItems.push(...SHOP_EQUIPMENT_TIERS[a].items);







                }







            }







        }







        if (eligibleItems.length === 0) {







            eligibleItems = ['Bronze Sword', 'Iron Sword', 'Iron Armor', 'Speed Boots', 'Mystic Circlet'];







        }







        let chosenBase = eligibleItems[Math.floor(Math.random() * eligibleItems.length)];















        // 3. Generate item







        let item = generateItem(chosenBase, rolledRarity);







        if (!player.inventory.equipment) player.inventory.equipment = [];







        player.inventory.equipment.push(item);















        // 4. Launch Animation







        openMysteryBoxAnimation(boxKey, item);







    }















    function openMysteryBoxAnimation(boxKey, item) {







        const box = (typeof MYSTERY_BOXES_DB !== 'undefined' && MYSTERY_BOXES_DB[boxKey]) || { name: 'Mystery Box', color: '#38bdf8', cost: 250 };







        openModal('modal-unboxing');















        const titleEl = document.getElementById('unboxing-title');







        if (titleEl) titleEl.innerText = `Opening ${box.name}...`;















        const stage = document.getElementById('unboxing-stage');







        if (stage) {







            let isCel = (boxKey === 'celestial');







            let chestSvg = (typeof SVG_SPRITES !== 'undefined' && SVG_SPRITES[isCel ? 'Celestial Chest' : 'Mystery Chest']) || '';







            stage.innerHTML = `







                <div id="unboxing-chest-anim" class="unboxing-chest shaking">







                    ${chestSvg}







                </div>







                <div id="unboxing-subtitle" style="color: ${box.color}; font-size: 15px; font-weight: 600; margin-top: 10px;">







                    Channeling Arcane Energies...







                </div>







            `;







        }















        playSFX('chest_shake');







        setTimeout(() => {







            const chestEl = document.getElementById('unboxing-chest-anim');







            if (chestEl) chestEl.classList.add('bursting');







            playSFX('chest_burst');







            screenShake('light');







        }, 1200);















        setTimeout(() => {







            renderMysteryBoxReveal(boxKey, item);







        }, 1500);







    }















    function renderMysteryBoxReveal(boxKey, item) {







        const stage = document.getElementById('unboxing-stage');







        if (!stage) return;







        const box = (typeof MYSTERY_BOXES_DB !== 'undefined' && MYSTERY_BOXES_DB[boxKey]) || { cost: 250 };







        const tierInfo = (typeof RARITY_TIERS !== 'undefined' && RARITY_TIERS[item.rarity]) || { color: '#fff' };







        const rarityColor = tierInfo.color || '#fff';







        const isMythic = (item.rarity === 'Mythic');















        const titleEl = document.getElementById('unboxing-title');







        if (titleEl) titleEl.innerText = isMythic ? '✨ MYTHIC ITEM REVEALED! ✨' : 'Item Discovered!';















        let affixesHtml = (item.affixes || []).map(a => `<div style="font-size: 12px; color: ${rarityColor}; margin: 2px 0;">• ${a.desc || a.name}</div>`).join('');







        let statsHtml = Object.entries(item.baseStats || item.stats || {}).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(', ');















        stage.innerHTML = `







            <div class="unboxing-item-reveal ${isMythic ? 'mythic-reveal' : ''}" style="border: 2px solid ${rarityColor}; box-shadow: 0 0 16px ${rarityColor};">







                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: ${rarityColor}; font-weight: bold; margin-bottom: 4px;">







                    ★ ${item.rarity} ${item.type ? item.type.toUpperCase() : 'GEAR'} ★







                </div>







                <div style="font-size: 18px; font-weight: bold; color: ${rarityColor}; margin-bottom: 8px;">







                    ${item.name}







                </div>







                <div style="font-size: 13px; color: #cbd5e1; margin-bottom: 8px;">







                    ${statsHtml || item.desc || ''}







                </div>







                <div style="background: rgba(0,0,0,0.35); border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; text-align: left;">







                    ${affixesHtml}







                </div>







                <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">







                    <button class="btn" style="background: #10b981; color: white;" onclick="closeUnboxingModal()">✨ Claim Equipment</button>







                    <button class="btn" style="background: #3b82f6; color: white;" onclick="buyMysteryBox('${boxKey}')" ${(player.gold || 0) < box.cost ? 'disabled' : ''}>







                        🎲 Open Another (${box.cost} G)







                    </button>







                </div>







            </div>







        `;















        if (isMythic) {







            playSFX('chest_reveal_mythic');







            screenShake('heavy');







            showToast('MYTHIC UNLOCKED!', `You discovered a Mythic ${item.name}!`, 'level', 6000);







        } else if (item.rarity === 'Legendary') {







            playSFX('chest_reveal_legendary');







            screenShake('medium');







        } else {







            playSFX('chest_reveal_rare');







        }







    }















    function closeUnboxingModal() {







        const modal = document.getElementById('modal-unboxing');







        if (modal) modal.classList.remove('active');







        const shop = document.getElementById('modal-shop');







        const overlay = document.getElementById('main-overlay');







        if (overlay && (!shop || !shop.classList.contains('active'))) {







            overlay.classList.remove('active');







        }







        renderShop();







        if (typeof renderInventory === 'function') renderInventory();







        computeStats();







        updateHeader();







    }







    function getSkillCost(skill, hero = null) {
        let cost = skill.mp;
        if(player.skillTree && player.skillTree.manaEfficiency > 0) {
            cost = Math.max(1, Math.floor(cost * 0.9));
        }
        if(playerHasPassive('elemental_overcharge')) {
            cost = Math.max(1, Math.floor(cost * 0.75));
        }
        const actingH = hero || (battleState && battleState.activeHero) || (player.roster && player.roster[0]);
        if (actingH && typeof hasHeroSetBonus === 'function' && hasHeroSetBonus(actingH, 'archons_voidweave', 2)) {
            cost = Math.max(1, Math.floor(cost * 0.70));
        }
        return cost;
    }

    function getHeroSkillMpCost(hero, skill) {
        return getSkillCost(skill, hero);
    }
    window.getHeroSkillMpCost = getHeroSkillMpCost;

    function getHeroHealShieldPotency(hero) {
        let potency = 1.0;
        if (hero && typeof hasHeroSetBonus === 'function' && hasHeroSetBonus(hero, 'hallowed_seraphim', 2)) {
            potency += 0.35;
        }
        return potency;
    }
    window.getHeroHealShieldPotency = getHeroHealShieldPotency;

    /* ==========================================================================
       MODERN JRPG / GACHA DOCK BATTLE UI OVERHAUL FUNCTIONS
       ========================================================================== */

    function setupBattle(areaId) {
        const arenaEl = document.getElementById('battle-arena');
        if (!arenaEl) return 'arena-theme-area_1';
        
        arenaEl.className = arenaEl.className.replace(/\barena-theme-[\w-]+\b/g, '').trim();
        
        let themeClass = 'arena-theme-area_1';
        if (areaId) {
            const aStr = String(areaId).toLowerCase();
            if (aStr === 'calamity' || aStr.startsWith('calamity') || aStr === 'raid') {
                themeClass = 'arena-theme-calamity';
            } else if (aStr === 'spire' || aStr.startsWith('spire')) {
                themeClass = 'arena-theme-area_10';
            } else if (aStr.startsWith('area_')) {
                themeClass = `arena-theme-${aStr}`;
            } else if (!isNaN(parseInt(aStr))) {
                themeClass = `arena-theme-area_${parseInt(aStr)}`;
            }
        } else if (typeof battleState !== 'undefined' && battleState && battleState.isRaid) {
            themeClass = 'arena-theme-calamity';
        } else if (typeof player !== 'undefined' && player && player.currentAreaId) {
            themeClass = `arena-theme-${player.currentAreaId}`;
        }
        arenaEl.classList.add(themeClass);
        return themeClass;
    }
    window.setupBattle = setupBattle;

    function renderHeroSquadDock() {
        const dockEl = document.getElementById('hero-squad-dock');
        if (!dockEl) return;
        
        let activeHeroes = [];
        if (typeof player !== 'undefined' && player.activeParty && Array.isArray(player.activeParty) && player.roster) {
            activeHeroes = player.activeParty.map(id => player.roster.find(h => h.id === id)).filter(Boolean);
        }
        if (activeHeroes.length === 0 && typeof player !== 'undefined' && player.roster && player.roster[0]) {
            activeHeroes = [player.roster[0]];
        }
        
        let livingMinions = (typeof battleState !== 'undefined' && battleState && battleState.minions) 
            ? battleState.minions.filter(m => m.hp > 0) 
            : [];
        
        let html = activeHeroes.map((h, idx) => {
            const isMain = !!h.isMain || h.id === 'hero_main' || idx === 0;
            const hStats = computeHeroStats(h);
            const curHp = isMain ? pStats.hp : (h.hp !== undefined ? h.hp : (h.baseStats?.hp || hStats.maxHp));
            const curMp = isMain ? pStats.mp : (h.mp !== undefined ? h.mp : (h.baseStats?.mp || hStats.maxMp));
            const isDead = curHp <= 0;
            const isActive = typeof battleState !== 'undefined' && battleState && battleState.activeHero && battleState.activeHero.id === h.id;
            const hpPct = Math.max(0, Math.min(100, (curHp / hStats.maxHp) * 100));
            const mpPct = Math.max(0, Math.min(100, (curMp / hStats.maxMp) * 100));
            const statusMap = isMain ? ((battleState && battleState.playerStatuses) || player.statuses) : (h.statuses || {});
            const heroLvl = h.level || (typeof player !== 'undefined' ? player.level : 1) || 1;
            
            return `
                <div class="squad-dock-card ${isActive ? 'turn-active-glow' : ''} ${isDead ? 'dock-dead' : ''}" 
                     id="dock-hero-${h.id}" 
                     data-hero-id="${h.id}"
                     onclick="onSquadDockHeroClick('${h.id}')"
                     title="${h.name} (${h.rank || 'T1'}-${h.classId || 'Hero'})">
                    <div class="dock-avatar-disc">
                        ${isMain ? '<span class="dock-crown">👑</span>' : ''}
                        <div style="width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">${getHeroSpriteSvg(h)}</div>
                        <span class="dock-lvl-tag">Lv.${heroLvl}</span>
                    </div>
                    <div class="dock-info">
                        <div class="dock-header-row">
                            <span class="dock-hero-name">${h.name}</span>
                            <span class="dock-class-badge">${(h.classId || 'Hero').toUpperCase()}</span>
                        </div>
                        <div class="dock-bar-row">
                            <div class="bar-container dock-bar hp-bar-container">
                                <div class="bar-ghost" id="dock-hero-${h.id}-hp-ghost" style="width: ${hpPct}%;"></div>
                                <div class="bar-fill hp-fill" id="dock-hero-${h.id}-hp-bar" style="width: ${hpPct}%;"></div>
                                <div class="bar-text" id="dock-hero-${h.id}-hp-txt">${curHp}/${hStats.maxHp} HP</div>
                            </div>
                            <div class="bar-container dock-bar mp-bar-container">
                                <div class="bar-fill mp-fill" id="dock-hero-${h.id}-mp-bar" style="width: ${mpPct}%;"></div>
                                <div class="bar-text" id="dock-hero-${h.id}-mp-txt">${curMp}/${hStats.maxMp} MP</div>
                            </div>
                        </div>
                        <div class="dock-status-tray" id="dock-statuses-${h.id}">
                            ${renderStatusBadges(statusMap)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        if (livingMinions.length > 0) {
            html += livingMinions.map(minion => {
                const hpPct = Math.max(0, Math.min(100, (minion.hp / minion.maxHp) * 100));
                return `
                    <div class="squad-dock-card dock-minion-card" 
                         id="dock-minion-${minion.id}" 
                         data-minion-id="${minion.id}"
                         onclick="onSquadDockHeroClick('${minion.id}')"
                         title="Minion: ${minion.name}">
                        <div class="dock-avatar-disc" style="border-color: #a855f7;">
                            <span style="font-size: 18px;">💀</span>
                        </div>
                        <div class="dock-info">
                            <div class="dock-header-row">
                                <span class="dock-hero-name" style="color: #d8b4fe;">${minion.name}</span>
                                <span class="dock-class-badge" style="color: #a855f7;">MINION</span>
                            </div>
                            <div class="dock-bar-row">
                                <div class="bar-container dock-bar hp-bar-container">
                                    <div class="bar-ghost" id="dock-${minion.id}-hp-ghost" style="width: ${hpPct}%;"></div>
                                    <div class="bar-fill hp-fill" id="dock-${minion.id}-hp-bar" style="width: ${hpPct}%; background: #a855f7;"></div>
                                    <div class="bar-text" id="dock-${minion.id}-hp-txt">${minion.hp}/${minion.maxHp} HP</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        dockEl.innerHTML = html;
    }
    window.renderHeroSquadDock = renderHeroSquadDock;

    function onSquadDockHeroClick(targetId) {
        if (!battleState || !battleState.active) return;
        if (battleState.targetingMode) {
            const mode = battleState.targetingMode;
            if (typeof mode === 'object' && mode && (mode.target === 'ally_single' || mode.target === 'self' || mode.target === 'all_allies')) {
                let hero = player.roster ? player.roster.find(h => h.id === targetId) : null;
                if (!hero && battleState.minions) hero = battleState.minions.find(m => m.id === targetId);
                if (hero) {
                    cancelTargeting();
                    selectSkill(mode.name || mode.id);
                    return;
                }
            }
        }
        if (typeof selectPartyTarget === 'function') {
            selectPartyTarget(targetId);
        }
    }
    window.onSquadDockHeroClick = onSquadDockHeroClick;

    function updateBattleCommandDeck() {
        const actingHero = (typeof battleState !== 'undefined' && battleState && battleState.activeHero) 
            || (typeof player !== 'undefined' && player.roster && player.roster.find(h => h.id === 'hero_main')) 
            || (typeof player !== 'undefined' && player.roster && player.roster[0]);
        if (!actingHero) return;
        const isMain = actingHero.isMain || actingHero.id === 'hero_main';
        const heroSkills = isMain ? player.skills : (actingHero.skills || (actingHero.classId === 'mage' ? ['Fireball', 'Heal'] : (actingHero.classId === 'rogue' ? ['Quick Slash', 'Smoke Screen'] : ['Power Strike', 'Cleave'])));
        const skillCount = (heroSkills && Array.isArray(heroSkills)) ? heroSkills.length : 0;
        
        let itemCount = 0;
        if (typeof player !== 'undefined' && player.inventory && player.inventory.consumables) {
            for (let k in player.inventory.consumables) {
                itemCount += (player.inventory.consumables[k] || 0);
            }
        }
        
        const btnSkills = document.getElementById('btn-cmd-skills');
        const btnItems = document.getElementById('btn-cmd-items');
        if (btnSkills) btnSkills.innerHTML = `✨ Skills (${skillCount})`;
        if (btnItems) btnItems.innerHTML = `🎒 Items (${itemCount})`;
    }
    window.updateBattleCommandDeck = updateBattleCommandDeck;

    function renderBattleCommands() {
        updateBattleCommandDeck();
        if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();
    }
    window.renderBattleCommands = renderBattleCommands;

    function toggleCombatLogDrawer() {
        const container = document.getElementById('combat-log-container');
        const btn = document.getElementById('btn-toggle-combat-log');
        const battleUi = document.getElementById('battle-ui');
        if (!container) return;
        
        const isExpanded = container.classList.toggle('combat-log-expanded');
        const isCollapsed = !isExpanded;
        container.classList.toggle('combat-log-collapsed', isCollapsed);
        
        if (battleUi) {
            battleUi.classList.toggle('log-collapsed', isCollapsed);
            battleUi.classList.toggle('log-expanded', isExpanded);
        }
        
        if (btn) {
            btn.innerHTML = isExpanded ? '📜 Log ▴' : '📜 Log ▾';
            btn.title = isExpanded ? 'Collapse combat log' : 'Expand full combat log';
        }
        const logEl = document.getElementById('combat-log');
        if (logEl) logEl.scrollTop = logEl.scrollHeight;
        return isExpanded;
    }
    window.toggleCombatLogDrawer = toggleCombatLogDrawer;

    function openTargeting(skill) {
        if (skill && skill.name) {
            const promptEl = document.getElementById('target-prompt');
            if (promptEl) {
                promptEl.innerHTML = `
                    <div style="font-size: 14px; font-weight: bold; color: #38bdf8; margin-bottom: 6px;">
                        Casting: <b>${skill.name}</b>
                    </div>
                    <div style="font-size: 12px; color: #94a3b8; margin-bottom: 10px;">
                        Click an enemy above to strike
                    </div>
                    <button class="btn btn-cmd-slate" style="padding: 4px 14px; font-size: 12px;" onclick="cancelTargeting()">Cancel</button>
                `;
            }
        }
        enterTargetingMode(skill);
    }
    window.openTargeting = openTargeting;

    function updateTargetingReticles() {
        if (typeof battleState === 'undefined' || !battleState || !battleState.targetingMode) return;
        const mode = battleState.targetingMode;
        
        const actingHero = (battleState && battleState.activeHero) || (typeof player !== 'undefined' && player.roster && player.roster[0]);
        let attackElement = 'Physical';
        if (typeof mode === 'object' && mode && mode.element) {
            attackElement = mode.element;
        } else if (actingHero && actingHero.element) {
            attackElement = actingHero.element;
        }
        
        const enemiesSide = document.getElementById('enemies-side');
        if (!enemiesSide) return;
        
        const enemyBoxes = enemiesSide.querySelectorAll('.entity-box.enemy');
        enemyBoxes.forEach(box => {
            const enemyId = box.id;
            const enemy = (battleState.enemies) ? battleState.enemies.find(e => e.id === enemyId) : null;
            if (!enemy || enemy.hp <= 0) return;
            
            box.classList.add('target-focus-ring');
            
            const oldBadge = box.querySelector('.reticle-badge');
            if (oldBadge) oldBadge.remove();
            
            const mult = (typeof getElementalMultiplier === 'function') 
                ? getElementalMultiplier(attackElement, enemy.element)
                : 1.0;
                
            let badgeHtml = '';
            if (mult > 1.0) {
                badgeHtml = `<div class="reticle-badge reticle-weak">💥 WEAK (${mult}x)</div>`;
            } else if (mult < 1.0) {
                badgeHtml = `<div class="reticle-badge reticle-resist">🛡️ RESIST (${mult}x)</div>`;
            }
            
            if (badgeHtml) {
                const temp = document.createElement('div');
                temp.innerHTML = badgeHtml;
                box.appendChild(temp.firstElementChild);
            }
        });
    }
    window.updateTargetingReticles = updateTargetingReticles;

    function clearTargetingReticles() {
        const enemiesSide = document.getElementById('enemies-side');
        if (!enemiesSide) return;
        enemiesSide.classList.remove('targeting-active');
        const enemyBoxes = enemiesSide.querySelectorAll('.entity-box.enemy');
        enemyBoxes.forEach(box => {
            box.classList.remove('target-focus-ring');
            const badge = box.querySelector('.reticle-badge');
            if (badge) badge.remove();
        });
    }
    window.clearTargetingReticles = clearTargetingReticles;

    function updateTurnOrderTimeline() {
        renderTurnOrderRibbon();
    }
    window.updateTurnOrderTimeline = updateTurnOrderTimeline;

    // Export getAffinityMultiplier alias
    if (typeof window !== 'undefined') {
        window.getAffinityMultiplier = function(atkElem, defElem) {
            return (typeof getElementalMultiplier === 'function') ? getElementalMultiplier(atkElem, defElem) : 1.0;
        };
    }

    function startBattle(count = 1, isBossFight = false) {
        if (player.roster) {
            player.roster.forEach(h => {
                if (h) {
                    h.phylacteryUsed = false;
                    h.inPhylactery = false;
                }
            });
        }







        if (typeof clearAllCombatTimers === 'function') clearAllCombatTimers();







        closeAllModals();







        if (typeof closeEnemyInspector === 'function') closeEnemyInspector();







        const ribbonTrack = document.getElementById('turn-order-track');







        if (ribbonTrack) ribbonTrack.innerHTML = '';







        switchScreen('battle');







        const speedBtn = document.getElementById('btn-combat-speed');







        if (speedBtn) speedBtn.innerText = `⚡ Speed: ${combatSpeed}x`;







        battleState = {







            active: true,







            isPlayerTurn: false,







            initialEnemyCount: count,







            isBossFight: isBossFight,







            lastBattleConfig: {







                enemyCount: count,







                isBoss: isBossFight,







                areaId: (player && player.selectedArea) || 'area_1'







            },







            enemies: [],







            turnQueue: [],







            targetingMode: null,







            log: [],







            playerStatuses: {},







            playerEntity: null,







            petTurns: { slot0: 0, slot1: 0, 0: 0, 1: 0 },







            phoenixRebirthUsed: false







        };







        const cmdEl = document.getElementById('battle-commands');







        if (cmdEl) cmdEl.classList.remove('victory-mode-ui');







        const vActions = document.getElementById('battle-victory-actions');







        if (vActions) vActions.style.display = 'none';







        if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();







        player.statuses = battleState.playerStatuses;







        if (player.roster && Array.isArray(player.roster)) {







            player.roster.forEach(h => {







                h.statuses = {};







                if (h._combatEntity) h._combatEntity.statuses = h.statuses;







            });







        }







        







        let areaKey = (player && player.selectedArea) || 'area_1';







        let area = AREAS_DB[areaKey] || AREAS_DB['area_1'];















        // Apply zone arena background gradient







        if (typeof setupBattle === 'function') setupBattle(area ? area.id : player.currentAreaId);

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







        battleState.activeHero = null;















        // Initialize active heroes HP and statuses







        if (player.activeParty && player.roster) {







            player.activeParty.forEach(id => {







                const h = player.roster.find(r => r.id === id);







                if (h) {







                    h.statuses = {};







                    if (!h.isMain) {







                        let stats = computeHeroStats(h);







                        if (h.hp === undefined || h.hp <= 0) {







                            h.hp = stats.maxHp;







                            if (h.baseStats) h.baseStats.hp = stats.maxHp;







                        }







                        if (h.mp === undefined) {







                            h.mp = stats.maxMp;







                            if (h.baseStats) h.baseStats.mp = stats.maxMp;







                        }







                    }







                }







            });







        }















        if (typeof spireRun !== 'undefined') spireRun.hourglassUsed = false;















        let pCombatEnt = getPlayerCombatEntity();















        // Relic start-of-combat triggers







        if (player.spire && player.spire.equippedRelic === 'aegis_colossus') {







            let colossusShield = Math.round(pStats.maxHp * 0.25);







            applyStatus(pCombatEnt, 'divine_barrier', 99, colossusShield);







            logMsg(`🛡️ Aegis of the Colossus: Divine Barrier granted (${colossusShield} HP Shield)!`, "#ffd700");







        }















        // Class Start-of-Combat Passives across all living heroes







        const combatParty = (typeof getLivingPartyHeroes === 'function') ? getLivingPartyHeroes() : [];







        if (combatParty.length === 0 && player.roster) {







            combatParty.push(player.roster.find(h => h.isMain) || player.roster[0]);







        }







        combatParty.forEach(h => {







            const hEnt = (typeof getHeroCombatEntity === 'function') ? getHeroCombatEntity(h) : pCombatEnt;







            const hStats = (typeof computeHeroStats === 'function') ? computeHeroStats(h) : pStats;







            if (heroHasPassive(h, 'aegis_ward')) {







                let shieldVal = Math.round(hStats.maxHp * 0.15);







                applyStatus(hEnt, 'divine_barrier', 99, shieldVal);







                logMsg(`🛡️ Aegis Ward: ${h.name || 'Hero'} granted Divine Barrier (${shieldVal} HP Shield)!`, "#ffd700");







            }







            if (heroHasPassive(h, 'phantom_mirage')) {







                applyStatus(hEnt, 'mirage', 99, 2);







                let stMap = (h.isMain || h.id === 'hero_main') ? battleState.playerStatuses : (h.statuses || {});







                if (stMap && stMap.mirage) {







                    stMap.mirage.stacks = 2;







                }







                logMsg(`🌀 Phantom Mirage: ${h.name || 'Hero'} granted 2 stacks of Mirage evasion!`, "#67e8f9");







            }







        });















        renderBattlefield();







        if(typeof updateSaveLoadButtons === 'function') updateSaveLoadButtons(true);







        startRound();







    }







    function updateCombatUI() {







        if (typeof renderBattlefield === 'function') {







            renderBattlefield();







        }







    }







    if (typeof window !== 'undefined') {







        window.updateCombatUI = updateCombatUI;







    }















    function renderBattlefield() {







        const playerSide = document.getElementById('player-side');







        if (playerSide) {







            let activeHeroes = [];







            if (player.activeParty && Array.isArray(player.activeParty) && player.roster) {







                activeHeroes = player.activeParty.map(id => player.roster.find(h => h.id === id)).filter(Boolean);







            }







            if (activeHeroes.length === 0 && player.roster && player.roster[0]) {







                activeHeroes = [player.roster[0]];







            }















            let frontHeroes = activeHeroes.filter(h => h.row === 'front');







            let backHeroes = activeHeroes.filter(h => h.row === 'back');







            if (frontHeroes.length === 0 && backHeroes.length === 0) frontHeroes = activeHeroes;















            let formationContainer = document.getElementById('player-formation-container');







            if (!formationContainer) {







                formationContainer = document.createElement('div');







                formationContainer.id = 'player-formation-container';







                formationContainer.className = 'player-formation-container';







                const petsCont = document.getElementById('player-pets-container');







                if (petsCont) playerSide.insertBefore(formationContainer, petsCont);







                else playerSide.appendChild(formationContainer);







            }















            // Check if DOM rebuild of cards is required







            let livingMinions = (battleState && battleState.minions) ? battleState.minions.filter(m => m.hp > 0) : [];
            const minionCountInDom = formationContainer.querySelectorAll('.minion-companion-card').length;
            const needsRebuild = !document.getElementById('battle-player') ||
                (minionCountInDom !== livingMinions.length) ||







                activeHeroes.some(h => {







                    const id = h.isMain ? 'battle-player' : `battle-hero-${h.id}`;







                    return !document.getElementById(id);







                });















            function renderMinionCardHtml(minion) {
                const hpPct = Math.max(0, Math.min(100, (minion.hp / minion.maxHp) * 100));
                return `
                    <div class="entity-box minion-companion-card" id="${minion.id}" data-minion-id="${minion.id}">
                        <div class="entity-name" style="font-size: 10px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; text-align: center; color: #cbd5e1;">💀 ${minion.name}</div>
                        <div class="entity-element elem-Dark" style="font-size: 8px; padding: 1px 3px;">Occult</div>
                        <div class="entity-sprite minion-card-avatar" style="width: 32px; height: 32px; margin: 2px auto; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                            💀
                        </div>
                        <div style="width: 100%;">
                            <div class="bar-container" style="height: 10px; margin-bottom: 2px;">
                                <div class="bar-ghost" id="${minion.id}-hp-ghost" style="width: ${hpPct}%;"></div>
                                <div class="bar-fill hp-fill" id="${minion.id}-hp-bar" style="width: ${hpPct}%; background: #a855f7;"></div>
                                <div class="bar-text" id="${minion.id}-hp-txt" style="font-size: 8px; line-height: 10px;">${minion.hp}/${minion.maxHp}</div>
                            </div>
                            <div class="status-tray" id="statuses-${minion.id}" style="min-height: 10px;">${renderStatusBadges(minion.statuses || {})}</div>
                        </div>
                    </div>
                `;
            }

            function renderHeroCardHtml(h) {







                const isMain = !!h.isMain || h.id === 'hero_main';







                const hStats = computeHeroStats(h);







                const curHp = isMain ? pStats.hp : (h.hp !== undefined ? h.hp : (h.baseStats?.hp || hStats.maxHp));







                const curMp = isMain ? pStats.mp : (h.mp !== undefined ? h.mp : (h.baseStats?.mp || hStats.maxMp));







                const isDead = curHp <= 0;







                const isActive = battleState && battleState.activeHero && battleState.activeHero.id === h.id;







                const hpPct = Math.max(0, Math.min(100, (curHp / hStats.maxHp) * 100));







                const mpPct = Math.max(0, Math.min(100, (curMp / hStats.maxMp) * 100));







                const cardId = isMain ? 'battle-player' : `battle-hero-${h.id}`;







                const hpBarId = isMain ? 'battle-player-hp-bar' : `battle-hero-${h.id}-hp-bar`;







                const hpTxtId = isMain ? 'battle-player-hp-txt' : `battle-hero-${h.id}-hp-txt`;







                const mpBarId = isMain ? 'battle-player-mp-bar' : `battle-hero-${h.id}-mp-bar`;







                const mpTxtId = isMain ? 'battle-player-mp-txt' : `battle-hero-${h.id}-mp-txt`;







                const statusTrayId = isMain ? 'statuses-player' : `statuses-${h.id}`;







                const statusMap = isMain ? (battleState.playerStatuses || player.statuses) : (h.statuses || {});















                return `







                    <div class="entity-box hero-card-combat ${isActive ? 'is-active-turn' : ''} ${isDead ? 'dead' : ''}" id="${cardId}" data-hero-id="${h.id}">







                        <div class="entity-name" style="font-size: 11px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; text-align: center;">${h.name}</div>







                        <div class="entity-element elem-${h.element || 'Physical'}" style="font-size: 9px; padding: 1px 4px;">${h.element || 'Physical'}</div>







                        <div class="entity-sprite hero-card-avatar" style="width: 40px; height: 40px; margin: 2px auto;">







                            ${getHeroSpriteSvg(h)}







                        </div>







                        <div id="${isMain ? 'battle-player-bars' : 'bars-' + h.id}" style="width: 100%;">







                            <div class="bar-container" style="height: 12px; margin-bottom: 2px;">







                                <div class="bar-ghost" id="${isMain ? 'battle-player-hp-ghost' : 'battle-hero-' + h.id + '-hp-ghost'}" style="width: ${hpPct}%"></div>
                                <div class="bar-fill hp-fill" id="${hpBarId}" style="width: ${hpPct}%"></div>







                                <div class="bar-text" id="${hpTxtId}" style="font-size: 9px; line-height: 12px;">${curHp}/${hStats.maxHp}</div>







                            </div>







                            <div class="bar-container" style="height: 12px; margin-bottom: 2px;">







                                <div class="bar-fill mp-fill" id="${mpBarId}" style="width: ${mpPct}%"></div>







                                <div class="bar-text" id="${mpTxtId}" style="font-size: 9px; line-height: 12px;">${curMp}/${hStats.maxMp}</div>







                            </div>







                            <div class="status-tray" id="${statusTrayId}" style="min-height: 12px;">${renderStatusBadges(statusMap)}</div>







                        </div>







                    </div>







                `;







            }















            if (needsRebuild) {







                let formHtml = '';







                if (backHeroes.length > 0) {







                    formHtml += `<div class="formation-row formation-back" id="formation-back"><div class="formation-row-label">🏹 Backline</div>${backHeroes.map(renderHeroCardHtml).join('')}</div>`;







                }







                if (frontHeroes.length > 0 || livingMinions.length > 0) {







                    formHtml += `<div class="formation-row formation-front" id="formation-front"><div class="formation-row-label">🛡️ Frontline</div>${frontHeroes.map(renderHeroCardHtml).join('')}${livingMinions.map(renderMinionCardHtml).join('')}</div>`;







                }







                formationContainer.innerHTML = formHtml;







            }















            // In-place update of all active hero cards







            livingMinions.forEach(minion => {
                const hpPct = Math.max(0, Math.min(100, (minion.hp / minion.maxHp) * 100));
                const hpBar = document.getElementById(`${minion.id}-hp-bar`);
                if (hpBar) hpBar.style.width = `${hpPct}%`;
                const minionGhost = document.getElementById(`${minion.id}-hp-ghost`);
                if (minionGhost) minionGhost.style.width = `${hpPct}%`;
                const hpTxt = document.getElementById(`${minion.id}-hp-txt`);
                if (hpTxt) hpTxt.textContent = `${minion.hp}/${minion.maxHp}`;
                const tray = document.getElementById(`statuses-${minion.id}`);
                if (tray) tray.innerHTML = renderStatusBadges(minion.statuses || {});
            });

            activeHeroes.forEach(h => {







                const isMain = !!h.isMain || h.id === 'hero_main';







                const hStats = computeHeroStats(h);







                const curHp = isMain ? pStats.hp : (h.hp !== undefined ? h.hp : (h.baseStats?.hp || hStats.maxHp));







                const curMp = isMain ? pStats.mp : (h.mp !== undefined ? h.mp : (h.baseStats?.mp || hStats.maxMp));







                const isDead = curHp <= 0;







                const isActive = battleState && battleState.activeHero && battleState.activeHero.id === h.id;







                const hpPct = Math.max(0, Math.min(100, (curHp / hStats.maxHp) * 100));







                const mpPct = Math.max(0, Math.min(100, (curMp / hStats.maxMp) * 100));















                const cardId = isMain ? 'battle-player' : `battle-hero-${h.id}`;







                const cardEl = document.getElementById(cardId);







                if (cardEl) {







                    if (isActive) cardEl.classList.add('is-active-turn');







                    else cardEl.classList.remove('is-active-turn');







                    if (isDead) cardEl.classList.add('dead');







                    else cardEl.classList.remove('dead');







                }















                const hpBar = document.getElementById(isMain ? 'battle-player-hp-bar' : `battle-hero-${h.id}-hp-bar`);







                const hpTxt = document.getElementById(isMain ? 'battle-player-hp-txt' : `battle-hero-${h.id}-hp-txt`);







                const mpBar = document.getElementById(isMain ? 'battle-player-mp-bar' : `battle-hero-${h.id}-mp-bar`);







                const mpTxt = document.getElementById(isMain ? 'battle-player-mp-txt' : `battle-hero-${h.id}-mp-txt`);







                const tray = document.getElementById(isMain ? 'statuses-player' : `statuses-${h.id}`);















                if (hpBar) hpBar.style.width = `${hpPct}%`;
                const heroGhost = document.getElementById(isMain ? 'battle-player-hp-ghost' : `battle-hero-${h.id}-hp-ghost`);
                if (heroGhost) heroGhost.style.width = `${hpPct}%`;







                if (hpTxt) hpTxt.innerText = `${curHp}/${hStats.maxHp}`;







                if (mpBar) mpBar.style.width = `${mpPct}%`;







                if (mpTxt) mpTxt.innerText = `${curMp}/${hStats.maxMp}`;







                if (tray) tray.innerHTML = renderStatusBadges(isMain ? (battleState.playerStatuses || player.statuses) : (h.statuses || {}));







            });







        }















        const petsContainer = document.getElementById('player-pets-container');







        if (petsContainer && player.pets && Array.isArray(player.pets.active) && typeof PETS_DB !== 'undefined') {







            let activePets = player.pets.active.map((id, slotIdx) => ({ id, slotIdx })).filter(p => p.id && PETS_DB[p.id]);







            petsContainer.innerHTML = activePets.map(({ id, slotIdx }) => {







                const pet = PETS_DB[id];







                const lvl = (player.pets.levels && player.pets.levels[id] && player.pets.levels[id].level) || 1;







                const pips = (battleState && battleState.petTurns && (slotIdx === 0 ? (battleState.petTurns.slot0 || battleState.petTurns[0]) : (battleState.petTurns.slot1 || battleState.petTurns[1]))) || 0;







                const pipIcons = (pips >= 2) ? '🐾 🐾' : (pips === 1 ? '🐾 ⚪' : '⚪ ⚪');







                return `







                    <div id="battle-pet-slot-${slotIdx}" class="battle-pet-badge pet-rarity-${pet.rarity}" style="display:flex; flex-direction:column; align-items:center; background: rgba(0,0,0,0.65); padding: 4px 8px; border-radius: 6px; min-width: 65px; border: 1px solid #475569;">







                        <div style="font-size: 10px; font-weight: bold; color: #fff;">${pet.name}</div>







                        <div style="font-size: 9px; color: #4ade80;">Lv.${lvl}</div>







                        <div style="width: 32px; height: 32px; margin: 2px 0;">${pet.sprite}</div>







                        <div class="pet-pips" style="font-size: 10px; letter-spacing: 2px;">${pipIcons}</div>







                    </div>







                `;







            }).join('');







        }















        const container = document.getElementById('enemies-side');







        container.innerHTML = '';







        







        battleState.enemies.forEach(e => {







            const el = document.createElement('div');







            el.className = `entity-box enemy ${e.hp <= 0 ? 'dead' : ''}`;







            el.id = e.id;







            







            let spriteClass = e.isBoss ? 'entity-sprite boss-sprite' : 'entity-sprite';







            let spriteSvg = SVG_SPRITES[e.name] || SVG_SPRITES['Stone Golem'] || '';















            let staggerBarHtml = '';
            if (e.isRaidBoss && battleState.channelingUltimate) {
                let cu = battleState.channelingUltimate;
                let pct = Math.max(0, Math.min(100, Math.round((cu.currentGauge / cu.maxGauge) * 100)));
                staggerBarHtml = `
                    <div class="stagger-bar-container">
                        <div class="stagger-fill" style="width: ${pct}%;"></div>
                        <div class="stagger-text">⚡ STAGGER: ${cu.currentGauge} / ${cu.maxGauge} (${cu.turnsRemaining}T)</div>
                    </div>
                `;
            }

            let raidPhaseBannerHtml = '';
            if (e.isRaidBoss) {
                raidPhaseBannerHtml = `<div class="raid-boss-banner">🔥 PHASE ${e.phase || 1}/3</div>`;
            }

            let channelWarningHtml = '';
            if (e.isRaidBoss && battleState.channelingUltimate) {
                channelWarningHtml = `
                    <div class="channel-warning-banner anim-pulse-warning">
                        ⚠️ CHANNELING ${battleState.channelingUltimate.skillName.toUpperCase()}!
                    </div>
                `;
            }

            el.innerHTML = `
                <button class="btn-inspect-trigger" onclick="event.stopPropagation(); inspectEnemy(${e.index});" title="Inspect enemy stats & affinities">🔍</button>
                ${raidPhaseBannerHtml}
                ${channelWarningHtml}
                <div class="entity-name">${e.name}</div>
                <div class="entity-element elem-${e.element}">${e.element}</div>
                <div class="${spriteClass}">${spriteSvg}</div>
                <div class="bar-container hp-bar-container"><div class="bar-ghost" id="${e.id}-hp-ghost" style="width: ${(e.hp / e.maxHp) * 100}%"></div><div class="bar-fill hp-fill" id="${e.id}-hp-bar" style="width: ${(e.hp / e.maxHp) * 100}%"></div><div class="bar-text">${e.hp}/${e.maxHp}</div></div>
                ${staggerBarHtml}
                <div class="status-tray" id="statuses-${e.id}">${renderStatusBadges(e.statuses)}</div>
            `;















            if(e.hp > 0) {







                el.onclick = () => handleEnemyClick(e.index);







            }







            container.appendChild(el);







        });















        updateHeader();







        if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();







        if (battleState && battleState.inspectedEnemyIndex !== undefined && battleState.inspectedEnemyIndex !== null) {







            const inspected = battleState.enemies && battleState.enemies[battleState.inspectedEnemyIndex];







            if (inspected && inspected.hp > 0) {







                inspectEnemy(battleState.inspectedEnemyIndex);







            } else {







                closeEnemyInspector();







            }







        }
        if (typeof renderHeroSquadDock === 'function') renderHeroSquadDock();
        if (typeof renderBattleCommands === 'function') renderBattleCommands();







    }







    function logMsg(text, color = '#cccccc') {
        const logEl = document.getElementById('combat-log');
        if (!logEl) return;
        const entry = document.createElement('div');
        entry.className = 'log-entry anim-slide-in';
        entry.style.color = color;
        entry.innerHTML = text;
        logEl.appendChild(entry);
        logEl.scrollTop = logEl.scrollHeight;
    }















    function screenShake(intensity = 'medium', duration = 300) {







        if (typeof document === 'undefined') return;







        const arena = document.getElementById('battle-arena') || document.body;







        if (!arena) return;







        const cls = `shake-${intensity}`;







        arena.classList.remove('shake-light', 'shake-medium', 'shake-heavy');







        void arena.offsetWidth; // trigger reflow







        arena.classList.add(cls);







        setTimeout(() => {







            if (arena) arena.classList.remove(cls);







        }, duration);







    }















    function applyHitFlash(targetId) {







        if (typeof document === 'undefined') return;







        const targetEl = document.getElementById(targetId);







        if (!targetEl) return;







        const sprite = targetEl.querySelector('.entity-sprite') || targetEl;







        sprite.classList.add('entity-hit-flash');







        targetEl.classList.add('entity-hit-flash');







        setTimeout(() => {







            sprite.classList.remove('entity-hit-flash');







            targetEl.classList.remove('entity-hit-flash');







        }, 120);







    }















    function triggerHitVFX(targetId, type = 'physical') {







        if (typeof document === 'undefined') return;







        const targetEl = document.getElementById(targetId);







        if (!targetEl) return;







        const container = targetEl.querySelector('.entity-sprite') || targetEl;







        const vfx = document.createElement('div');







        vfx.className = `vfx-container vfx-${type}`;















        if (type === 'physical' || type === 'slash') {







            vfx.innerHTML = `







                <svg class="vfx-slash-arc" viewBox="0 0 100 100" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:45;">







                    <path d="M 15 15 Q 50 45 85 85 Q 55 55 15 15" fill="#f8fafc" filter="drop-shadow(0 0 6px #38bdf8)" opacity="0.95" />







                </svg>







            `;







        } else if (type === 'Fire') {







            vfx.innerHTML = `







                <div class="vfx-burst vfx-fire-burst">







                    <span class="vfx-spark f1">🔥</span>







                    <span class="vfx-spark f2">💥</span>







                    <span class="vfx-spark f3">✨</span>







                </div>







            `;







        } else if (type === 'Water' || type === 'Ice') {







            vfx.innerHTML = `







                <div class="vfx-burst vfx-ice-burst">







                    <span class="vfx-shard i1">❄️</span>







                    <span class="vfx-shard i2">💎</span>







                    <span class="vfx-shard i3">❄️</span>







                </div>







            `;







        } else if (type === 'Wind' || type === 'Lightning') {







            vfx.innerHTML = `







                <div class="vfx-burst vfx-lightning-burst">







                    <span class="vfx-spark l1">⚡</span>







                    <span class="vfx-spark l2">✨</span>







                    <span class="vfx-spark l3">⚡</span>







                </div>







            `;







        } else if (type === 'Earth') {







            vfx.innerHTML = `







                <div class="vfx-burst vfx-earth-burst">







                    <span class="vfx-shard e1">🪨</span>







                    <span class="vfx-shard e2">💥</span>







                    <span class="vfx-shard e3">🌿</span>







                </div>







            `;







        } else if (type === 'Light') {







            vfx.innerHTML = `







                <div class="vfx-burst vfx-light-burst">







                    <div class="vfx-halo"></div>







                    <span class="vfx-spark">🌟</span>







                </div>







            `;







        } else if (type === 'Dark') {







            vfx.innerHTML = `







                <div class="vfx-burst vfx-dark-burst">







                    <div class="vfx-vortex"></div>







                    <span class="vfx-spark">🔮</span>







                </div>







            `;







        }















        container.appendChild(vfx);







        setTimeout(() => {







            if (vfx.parentNode) vfx.parentNode.removeChild(vfx);







        }, 280);







    }















    function getSkillSFXAndVFX(skill) {







        if (!skill) return { sfx: 'slash', vfx: 'physical' };







        if (skill.element === ELEMENTS.Fire || skill.element === 'Fire') {







            return { sfx: 'magic_fire', vfx: 'Fire' };







        }







        if (skill.element === ELEMENTS.Water || skill.element === 'Water') {







            return { sfx: 'magic_ice', vfx: 'Water' };







        }







        if (skill.element === ELEMENTS.Wind || skill.element === 'Wind') {







            return { sfx: 'magic_lightning', vfx: 'Wind' };







        }







        if (skill.element === ELEMENTS.Earth || skill.element === 'Earth') {







            return { sfx: 'magic_fire', vfx: 'Earth' };







        }







        if (skill.element === ELEMENTS.Light || skill.element === 'Light') {







            return { sfx: 'magic_holy', vfx: 'Light' };







        }







        if (skill.element === ELEMENTS.Dark || skill.element === 'Dark') {







            return { sfx: 'magic_dark', vfx: 'Dark' };







        }







        if (skill.type === 'heal') {







            return { sfx: 'magic_holy', vfx: 'Light' };







        }







        return { sfx: 'slash', vfx: 'physical' };







    }















    function floatText(targetId, text, color, isCrit = false, type = 'normal') {







        const floatLayer = document.getElementById('combat-float-layer');







        const targetEl = document.getElementById(targetId);







        if (!targetEl && !floatLayer) return;















        let posX = 50;







        let posY = 50;















        if (floatLayer && targetEl && typeof floatLayer.getBoundingClientRect === 'function' && typeof targetEl.getBoundingClientRect === 'function') {







            const layerRect = floatLayer.getBoundingClientRect();







            const targetRect = targetEl.getBoundingClientRect();







            const staggerX = (Math.random() - 0.5) * 36;







            if (targetRect.width > 0 || targetRect.height > 0) {







                posX = (targetRect.left + (targetRect.width / 2) - layerRect.left) + staggerX;







                posY = (targetRect.top + (targetRect.height * 0.35) - layerRect.top);







            } else {







                posX = 50 + staggerX;







                posY = 50;







            }







        }















        const floatEl = document.createElement('div');







        let typeClass = isCrit ? 'floating-text-crit' : (type === 'heal' ? 'floating-text-heal' : (type === 'dot' ? 'floating-text-dot' : ''));







        floatEl.className = `floating-text ${typeClass}`.trim();







        







        let displayText = text;







        if (isCrit && !String(text).startsWith('CRIT!')) {







            displayText = 'CRIT! ' + text;







        }







        floatEl.innerHTML = displayText;















        if (color && !isCrit) {







            floatEl.style.color = color;







        }















        if (floatLayer) {







            floatEl.style.left = `${posX}px`;







            floatEl.style.top = `${posY}px`;







            floatLayer.appendChild(floatEl);







            setTimeout(() => {







                if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);







            }, isCrit ? 1250 : 1100);







        }















        // Mirror to targetEl for backward-compatibility with test suites querying target element directly







        if (targetEl && targetEl !== floatLayer) {







            const mirrorEl = floatEl.cloneNode(true);







            mirrorEl.style.left = '50%';







            mirrorEl.style.top = isCrit ? '15%' : '20%';







            mirrorEl.style.transform = 'translate(-50%, 0)';







            targetEl.appendChild(mirrorEl);







            setTimeout(() => {







                if (mirrorEl.parentNode) mirrorEl.parentNode.removeChild(mirrorEl);







            }, isCrit ? 1250 : 1100);







        }







    }







    if (typeof window !== 'undefined') {







        window.floatText = floatText;







    }















    /* =========================================================================







       TURN ORDER TIMELINE RIBBON







       ========================================================================= */















    function renderTurnOrderRibbon() {







        const track = document.getElementById('turn-order-track');







        if (!track) return;







        track.innerHTML = '';







        if (!battleState || !battleState.active) return;















        const list = [];







        if (battleState.currentActor) {







            list.push({ ...battleState.currentActor, isActive: true });







        }







        if (battleState.turnQueue && Array.isArray(battleState.turnQueue)) {







            battleState.turnQueue.forEach((actor, idx) => {







                list.push({ ...actor, isActive: (!battleState.currentActor && idx === 0) });







            });







        }















        if (list.length === 0) return;















        list.forEach(actor => {







            const chip = document.createElement('div');







            const isPlayer = actor.type === 'player' || actor.type === 'hero';







            let isBoss = Boolean(actor.isBoss);







            if (!isPlayer && battleState.enemies && actor.index !== undefined && battleState.enemies[actor.index]) {







                const e = battleState.enemies[actor.index];







                isBoss = Boolean(e.isBoss || e.rank === 'boss' || e.tier === 'boss');







            }







            let classes = ['turn-node', 'turn-chip', 'timeline-chip'];







            if (isPlayer) classes.push('is-hero');







            else classes.push('is-enemy');







            if (isBoss) classes.push('is-boss');







            if (actor.isActive) classes.push('is-active');















            chip.className = classes.join(' ');







            let icon = '👾';







            if (isPlayer) {







                const hCls = actor.hero ? actor.hero.classId : 'warrior';







                icon = hCls === 'mage' ? '🔮' : (hCls === 'rogue' ? '🗡️' : '⚔️');







            } else if (isBoss) {







                icon = '👑';







            }







            chip.title = `${actor.name || (isPlayer ? 'Hero' : 'Enemy')}`;
            chip.innerHTML = `<span class="chip-icon">${icon}</span> <span class="chip-name">${actor.name || (isPlayer ? 'Hero' : 'Enemy')}</span>`;







            if (actor.type) chip.dataset.type = actor.type;







            if (actor.index !== undefined) chip.dataset.index = actor.index;







            track.appendChild(chip);







        });







    }







    if (typeof window !== 'undefined') {







        window.renderTurnOrderRibbon = renderTurnOrderRibbon;







    }















    /* =========================================================================







       ENEMY INSPECTOR & ELEMENTAL VULNERABILITIES







       ========================================================================= */















    function closeEnemyInspector() {







        const card = document.getElementById('enemy-inspector-card');







        if (card) card.classList.add('hidden');







        if (battleState) battleState.inspectedEnemyIndex = null;







    }















    function inspectEnemy(targetRef) {







        if (!battleState || !battleState.enemies) return;







        let enemy = null;







        let idx = null;







        if (typeof targetRef === 'number') {







            idx = targetRef;







            enemy = battleState.enemies[idx];







        } else if (typeof targetRef === 'string') {







            const match = targetRef.match(/\d+/);







            if (match) {







                idx = parseInt(match[0], 10);







                enemy = battleState.enemies[idx];







            } else {







                idx = battleState.enemies.findIndex(e => e.name === targetRef || e.id === targetRef);







                if (idx !== -1) enemy = battleState.enemies[idx];







            }







        } else if (targetRef && typeof targetRef === 'object') {







            enemy = targetRef;







            idx = battleState.enemies.indexOf(enemy);







            if (idx === -1 && enemy.index !== undefined) idx = enemy.index;







        }















        if (!enemy || enemy.hp <= 0) {







            closeEnemyInspector();







            return;







        }















        battleState.inspectedEnemyIndex = idx;















        const card = document.getElementById('enemy-inspector-card');







        if (!card) return;















        // Header: Name & Element







        const nameEl = document.getElementById('inspector-name');







        if (nameEl) nameEl.innerText = (enemy.isBoss ? '👑 ' : '') + enemy.name;















        const elemEl = document.getElementById('inspector-element-badge');







        if (elemEl) {







            elemEl.innerText = enemy.element || 'Neutral';







            elemEl.className = `inspector-element-badge elem-${enemy.element}`;







        }















        // HP Bar & Text







        const hpFill = document.getElementById('inspector-hp-fill');







        if (hpFill) {







            const hpPct = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100));







            hpFill.style.width = `${hpPct}%`;







        }







        const hpText = document.getElementById('inspector-hp-text');







        if (hpText) hpText.innerText = `${enemy.hp} / ${enemy.maxHp} HP`;















        // Defense & Speed







        const defEl = document.getElementById('inspector-def');







        if (defEl) defEl.innerText = enemy.def;







        const mdefEl = document.getElementById('inspector-mdef');







        if (mdefEl) mdefEl.innerText = enemy.mdef || 0;







        const spdEl = document.getElementById('inspector-spd');







        if (spdEl) spdEl.innerText = enemy.spd;















        // Elemental Affinities







        const affContainer = document.getElementById('inspector-affinities');







        if (affContainer) {







            affContainer.innerHTML = '';







            const allElements = ['Fire', 'Water', 'Wind', 'Earth', 'Light', 'Dark'];







            const elemIcons = {







                Fire: '🔥',







                Water: '💧',







                Wind: '💨',







                Earth: '🌿',







                Light: '✨',







                Dark: '🌑'







            };















            allElements.forEach(elem => {







                let mult = 1.0;







                if (typeof getElementalMultiplier === 'function') {







                    mult = getElementalMultiplier(elem, enemy.element);







                }







                const pill = document.createElement('span');







                if (mult > 1.0) {







                    const pct = Math.round((mult - 1.0) * 100);







                    pill.className = 'affinity-pill affinity-weak';







                    pill.innerText = `${elemIcons[elem] || ''} Weak to ${elem} (+${pct}%)`.trim();







                } else if (mult < 1.0) {







                    const pct = Math.round((1.0 - mult) * 100);







                    pill.className = 'affinity-pill affinity-resist';







                    pill.innerText = `${elemIcons[elem] || ''} Resists ${elem} (-${pct}%)`.trim();







                } else {







                    pill.className = 'affinity-pill affinity-neutral';







                    pill.innerText = `${elemIcons[elem] || ''} ${elem} (Normal)`.trim();







                }







                affContainer.appendChild(pill);







            });







        }















        // Active Statuses & Debuffs







        const statusContainer = document.getElementById('inspector-statuses');







        if (statusContainer) {







            statusContainer.innerHTML = '';







            const activeStatuses = Object.values(enemy.statuses || {}).filter(s => s && s.duration > 0);







            if (activeStatuses.length === 0) {







                statusContainer.innerHTML = '<span style="font-size: 11px; color: #64748b; font-style: italic;">No active status effects or debuffs.</span>';







            } else {







                activeStatuses.forEach(st => {







                    const def = (typeof STATUS_TYPES_DB !== 'undefined' && STATUS_TYPES_DB[st.id]) || {};







                    const icon = st.icon || def.icon || '✨';







                    const name = st.name || def.name || st.id;







                    const desc = def.desc || '';







                    const stacksText = (st.stacks && st.stacks > 1) ? ` (${st.stacks}x)` : '';







                    const row = document.createElement('div');







                    row.className = 'inspector-status-item';







                    row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: rgba(30, 41, 59, 0.6); padding: 4px 8px; border-radius: 4px; margin-bottom: 4px; font-size: 11px;';







                    row.innerHTML = `







                        <div>







                            <span style="font-weight: bold; color: ${st.color || '#e2e8f0'};">${icon} ${name}${stacksText}</span>







                            <span style="color: #94a3b8; margin-left: 6px; font-size: 10px;">${desc}</span>







                        </div>







                        <span style="font-weight: bold; color: #facc15; white-space: nowrap; margin-left: 8px;">⏳ ${st.duration}t</span>







                    `;







                    statusContainer.appendChild(row);







                });







            }







        }















        card.classList.remove('hidden');







    }







    if (typeof window !== 'undefined') {







        window.inspectEnemy = inspectEnemy;







        window.closeEnemyInspector = closeEnemyInspector;







    }















    function bindCommandDeckToHero(hero) {







        if (!hero) return;







        if (battleState) battleState.activeHero = hero;







        if (typeof renderHeroSquadDock === 'function') renderHeroSquadDock();
        if (typeof renderBattleCommands === 'function') renderBattleCommands();
        const banner = document.getElementById('acting-hero-banner');







        const heroStats = computeHeroStats(hero);







        const curMp = hero.isMain ? pStats.mp : (hero.mp !== undefined ? hero.mp : heroStats.mp);







        if (banner) {







            banner.style.display = 'block';







            banner.innerHTML = `







                <div style="display:flex; justify-content:space-between; align-items:center; width:100%; font-size:12px;">







                    <span><b>${hero.name}</b> <span style="font-size:10px; color:#94a3b8;">(${hero.rank}-Rank ${hero.classId || 'Hero'})</span></span>







                    <span style="color:#fbbf24; font-size:11px;">⚔️ ATK: <b>${heroStats.atk}</b> | 💧 MP: <b>${curMp}/${heroStats.maxMp}</b></span>







                </div>







            `;







        }







        if (typeof renderSkillButtons === 'function' && document.getElementById('skills-items-container')) {







            renderSkillButtons(activeSkillCategory || 'all');







        }







    }















    function startRound() {







        if(!battleState.active) return;
        // Phylactery Ward Reconstitution check
        if (player.roster) {
            player.roster.forEach(h => {
                if (h && h.inPhylactery) {
                    let ent = (typeof getHeroCombatEntity === 'function') ? getHeroCombatEntity(h) : null;
                    let hStats = computeHeroStats(h);
                    let maxHp = h.isMain ? pStats.maxHp : (hStats.maxHp || 100);
                    let maxMp = h.isMain ? pStats.maxMp : (hStats.maxMp || 50);
                    let reconHp = Math.round(maxHp * 0.50);
                    let reconMp = maxMp;
                    if (h.isMain) {
                        player.baseStats.hp = reconHp;
                        pStats.hp = reconHp;
                        player.baseStats.mp = reconMp;
                        pStats.mp = reconMp;
                    } else {
                        h.hp = reconHp;
                        h.mp = reconMp;
                        if (h.baseStats) {
                            h.baseStats.hp = reconHp;
                            h.baseStats.mp = reconMp;
                        }
                    }
                    if (ent) {
                        ent.hp = reconHp;
                        ent.mp = reconMp;
                        if (ent.statuses && ent.statuses.phylactery_stasis) delete ent.statuses.phylactery_stasis;
                    }
                    h.inPhylactery = false;
                    logMsg(`⚰️❄️ Phylactery Reconstitution! ${h.name} emerges from stasis with 50% HP and 100% MP!`, "#06b6d4");
                    floatText(ent ? ent.id : 'battle-player', "RECONSTITUTED!", "#06b6d4");

                    // Frost Nova AoE: 150% MATK Cold damage to all enemies
                    let actingMatk = h.isMain ? pStats.matk : hStats.matk;
                    let novaDmg = Math.max(1, Math.round(actingMatk * 1.50));
                    if (battleState && battleState.enemies) {
                        battleState.enemies.forEach(e => {
                            if (e && e.hp > 0) {
                                applyDamage(e, Math.max(1, novaDmg - (e.mdef || 0)), ELEMENTS.Water, ent);
                            }
                        });
                    }
                    logMsg(`❄️ Frost Nova explodes from the Phylactery, dealing ${novaDmg} Cold damage to all enemies!`, "#06b6d4");
                }
            });
        }







        const livingParty = getLivingPartyHeroes();







        
        // Primal Roar (Primal Apex Lord) start of combat trigger
        if (!battleState._primalRoarTriggered) {
            battleState._primalRoarTriggered = true;
            if (livingParty.some(hero => heroHasPassive(hero, 'primal_roar'))) {
                livingParty.forEach(h => {
                    const ent = (typeof getHeroCombatEntity === 'function') ? getHeroCombatEntity(h) : null;
                    if (ent) {
                        applyStatus(ent, 'primal_roar', 3);
                        floatText(ent.id, "PRIMAL ROAR", "#ca8a04");
                    }
                });
                logMsg("🦁 Primal Roar! All allies empowered with +25% ATK, +20 SPD, and immunity to Stun & Silence for 3 turns!", "#ca8a04");
            }
        }
        // Aura of Immortality (Seraph of Dawn Apex passive): 10% max HP party regen at round start
        if (livingParty.some(hero => typeof heroHasPassive === 'function' && heroHasPassive(hero, 'aura_of_immortality'))) {
            livingParty.forEach(h => {
                let ent = (typeof getHeroCombatEntity === 'function') ? getHeroCombatEntity(h) : null;
                let hStats = computeHeroStats(h);
                let maxHp = h.isMain ? pStats.maxHp : (hStats.maxHp || 100);
                let curHp = h.isMain ? pStats.hp : (h.hp !== undefined ? h.hp : (h.baseStats?.hp || maxHp));
                let regenAmount = Math.max(1, Math.round(maxHp * 0.10));
                let newHp = Math.min(maxHp, curHp + regenAmount);
                if (h.isMain) {
                    player.baseStats.hp = newHp;
                    pStats.hp = newHp;
                } else {
                    h.hp = newHp;
                    if (h.baseStats) h.baseStats.hp = newHp;
                }
                if (ent) {
                    ent.hp = newHp;
                    floatText(ent.id, `+${regenAmount}`, "#55ff55");
                }
            });
            logMsg("🕊️ Aura of Immortality radiates warm light! All party members regenerated 10% HP!", "#55ff55");
        }
        battleState.turnQueue = [];







        livingParty.forEach(h => {







            const hStats = (typeof getHeroComputedStats === 'function') ? getHeroComputedStats(h) : computeHeroStats(h);







            const ent = (typeof getHeroCombatEntity === 'function') ? getHeroCombatEntity(h) : null;
            const spdVal = ent ? ent.spd : hStats.spd;
            battleState.turnQueue.push({ type: 'hero', id: h.id, spd: spdVal, name: h.name, hero: h });







        });







        battleState.enemies.forEach(e => {







            if(e.hp > 0) battleState.turnQueue.push({ type: 'enemy', index: e.index, spd: e.spd, name: e.name });







        });







        if (battleState.isRaid && (battleState.raidId === 'raid_chronos' || (battleState.raid && battleState.raid.id === 'raid_chronos')) && battleState.raidPhase === 1) {
            // Temporal Anomaly: Inverts turn order speed: lowest SPD acts first
            battleState.turnQueue.sort((a, b) => a.spd - b.spd);
        } else {
            battleState.turnQueue.sort((a, b) => b.spd - a.spd);
        }







        if (typeof renderTurnOrderRibbon === 'function') renderTurnOrderRibbon();







        processNextTurn();







    }















    function processNextTurn() {







        if(!battleState.active) return;







        







        let livingHeroes = getLivingPartyHeroes();







        if(livingHeroes.length === 0) { loseBattle(); return; }







        if(battleState.enemies.every(e => e.hp <= 0)) { winBattle(); return; }















        if(battleState.turnQueue.length === 0) {







            battleState.isPlayerTurn = false;







            startRound();







            return;







        }















        const currentTurn = battleState.turnQueue.shift();







        battleState.currentActor = currentTurn;







        if (typeof renderTurnOrderRibbon === 'function') renderTurnOrderRibbon();







        







        if(currentTurn.type === 'player' || currentTurn.type === 'hero') {







            const hero = currentTurn.hero || (player.roster && player.roster.find(h => h.id === currentTurn.id)) || (player.roster && player.roster[0]);







            battleState.activeHero = hero;







            battleState.isPlayerTurn = false;















            const hStats = computeHeroStats(hero);







            const curHp = hero.isMain ? pStats.hp : (hero.hp !== undefined ? hero.hp : hStats.hp);







            if (curHp <= 0) {







                processNextTurn();







                return;







            }















            logMsg(`${hero.name}'s Turn`, "#ffffff");







            if (hero.isMain && typeof triggerPetTurnCadence === 'function') triggerPetTurnCadence();







            if (!battleState.active) return;















            let heroEnt = getHeroCombatEntity(hero);







            let turnSkipped = processStatusesStartTurn(heroEnt);







            if (turnSkipped) {







                battleState.isPlayerTurn = false;







                if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();







                setCombatTimeout(processNextTurn, 1000);







                return;







            }















            battleState.isPlayerTurn = true;







            bindCommandDeckToHero(hero);







            enableCommands();







            renderBattlefield();







            if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();







        } else {







            battleState.isPlayerTurn = false;







            battleState.activeHero = null;







            if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();







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







                floatText('battle-player', `+${heal} HP`, '#4ade80', false, 'heal');







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







        if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();







    }















    function enterTargetingMode(mode) {
        battleState.targetingMode = mode;
        document.getElementById('battle-commands').classList.add('targeting-mode-ui');
        document.getElementById('enemies-side').classList.add('targeting-active');
        if (typeof updateTargetingReticles === 'function') updateTargetingReticles();
        closeSubMenu();
    }















    function cancelTargeting() {
        if (battleState) battleState.targetingMode = null;
        if (typeof clearTargetingReticles === 'function') clearTargetingReticles();
        const promptEl = document.getElementById('target-prompt');
        if (promptEl) {
            promptEl.innerHTML = `Select a target...<br><br><button class="btn btn-cmd-slate" style="padding: 4px 14px; font-size: 12px;" onclick="cancelTargeting()">Cancel</button>`;
        }
        enableCommands();
    }















    function onAttackClicked() {







        if (!battleState || !battleState.active) return;







        const isSubMenuActive = document.getElementById('battle-commands') && document.getElementById('battle-commands').classList.contains('sub-menu-active');







        if (!battleState.isPlayerTurn && !isSubMenuActive) return;







        const livingEnemies = battleState.enemies ? battleState.enemies.filter(e => e.hp > 0) : [];







        if (livingEnemies.length === 0) return;







        // Fast-path: single living enemy auto-attacks immediately without prompt (unless transitioning from sub-menu)







        if (livingEnemies.length === 1 && !isSubMenuActive) {







            executePlayerAttack(livingEnemies[0]);







            return;







        }







        logMsg("Select a target to attack.");
        const promptEl = document.getElementById('target-prompt');
        if (promptEl) {
            promptEl.innerHTML = `
                <div style="font-size: 14px; font-weight: bold; color: #ef4444; margin-bottom: 6px;">
                    ⚔️ <b>Basic Attack</b>
                </div>
                <div style="font-size: 12px; color: #94a3b8; margin-bottom: 10px;">
                    Click an enemy above to strike
                </div>
                <button class="btn btn-cmd-slate" style="padding: 4px 14px; font-size: 12px;" onclick="cancelTargeting()">Cancel</button>
            `;
        }
        enterTargetingMode('attack');







    }















    function handleEnemyClick(targetRef) {







        if (!battleState || !battleState.active || !battleState.isPlayerTurn) return;







        // Support index number, element id string, or direct object reference







        let enemy = null;







        if (typeof targetRef === 'number') {







            enemy = battleState.enemies.find(e => e.index === targetRef) || battleState.enemies[targetRef];







        } else if (typeof targetRef === 'string') {







            let parsed = parseInt(targetRef, 10);







            if (!isNaN(parsed) && battleState.enemies[parsed]) {







                enemy = battleState.enemies[parsed];







            } else {







                enemy = battleState.enemies.find(e => e.id === targetRef || e.name === targetRef);







            }







        } else if (typeof targetRef === 'object' && targetRef !== null) {







            enemy = targetRef;







        }







        // Failsafe fallback: first living enemy







        if (!enemy || enemy.hp <= 0) {







            enemy = battleState.enemies.find(e => e && e.hp > 0);







        }







        if (!enemy || enemy.hp <= 0) return;







        const mode = battleState.targetingMode;
        battleState.targetingMode = null;
        if (typeof clearTargetingReticles === 'function') clearTargetingReticles();







        enableCommands(); // Cleanly exit targeting UI mode







        if (mode === 'attack' || !mode) {







            executePlayerAttack(enemy);







        } else if (typeof mode === 'object' && (mode.type === 'magic' || mode.type === 'physical')) {







            executePlayerSkill(mode, enemy);







        }







    }















    function executePlayerAttack(target) {







        if (battleState) battleState.isPlayerTurn = false;







        document.getElementById('battle-commands').classList.remove('targeting-mode-ui');







        document.getElementById('battle-commands').classList.remove('sub-menu-active');







        document.getElementById('enemies-side').classList.remove('targeting-active');







        document.querySelectorAll('#cmd-main .btn').forEach(b => b.disabled = true);







        if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();







        







        const actingHero = battleState.activeHero || (player.roster && player.roster.find(h => h.id === 'hero_main')) || player.roster[0];







        const isMain = actingHero.isMain || actingHero.id === 'hero_main';







        const playerEnt = getHeroCombatEntity(actingHero);







        const heroStats = computeHeroStats(actingHero);















        // Bleed check on player action







        if (hasStatus(playerEnt, 'bleed')) {







            let bDmg = Math.max(2, Math.floor(heroStats.maxHp * 0.04) + 4);







            playerEnt.hp = Math.max(0, playerEnt.hp - bDmg);







            logMsg(`${actingHero.name} suffers ${bDmg} bleed damage from attacking!`, "#ef4444");







            floatText(playerEnt.id, `🩸 -${bDmg} Bleed`, "#ef4444", false, 'dot');







            let livingCheck = getLivingPartyHeroes();







            if (livingCheck.length === 0) {







                loseBattle();







                return;







            }







        }















        // Blind check on player attack







        if (hasStatus(playerEnt, 'blind') && Math.random() < 0.4) {







            logMsg(`${actingHero.name}'s attack missed due to Blindness!`, "#64748b");







            floatText(target.id, "MISS", "#64748b");







            if (isMain) triggerRegen();







            processStatusesEndTurn(playerEnt);







            setCombatTimeout(processNextTurn, 1200);







            return;







        }















        let baseDmg = playerEnt.atk * 1.5;







        let effTargetDef = (heroHasPassive(actingHero, 'eagle_eye')) ? Math.floor(target.def * 0.5) : target.def;
        let mitigation = 20 / (20 + effTargetDef);







        let dmg = Math.max(1, Math.floor(baseDmg * mitigation));















        if(isMain && player.skillTree && player.skillTree.combatMastery > 0) {







            dmg = Math.floor(dmg * 1.1);







        }















        // Blood Frenzy Missing HP Damage Scaling







        if (heroHasPassive(actingHero, 'blood_frenzy')) {







            let curHp = isMain ? pStats.hp : (actingHero.hp !== undefined ? actingHero.hp : heroStats.hp);







            let maxHp = isMain ? pStats.maxHp : heroStats.maxHp;







            let missingHpRatio = 1 - (curHp / maxHp);







            let bfBonus = 1 + (missingHpRatio * 0.40);







            dmg = Math.floor(dmg * bfBonus);







        }







        







        let heroCrit = isMain ? pStats.crit : (heroStats.crit || 5);







        let critChance = heroCrit + (hasStatus(playerEnt, 'focus') ? 25 : 0);







        let critMult = hasStatus(playerEnt, 'focus') ? 2.0 : 1.5;







        if (isMain && player.skillTree && player.skillTree.precisionStrikes > 0) {







            critMult += (player.skillTree.precisionStrikes * 0.05);







        }















        let hasAilment = target.statuses && (







            hasStatus(target, 'bleed') || hasStatus(target, 'poison') ||







            hasStatus(target, 'stun') || hasStatus(target, 'blind') ||







            hasStatus(target, 'burn') || hasStatus(target, 'freeze') ||







            hasStatus(target, 'decay') || hasStatus(target, 'shock')







        );







        if (heroHasPassive(actingHero, 'lethal_exploit') && hasAilment) {







            critMult += 0.40;







        }















        let isCrit = false;







        let isKillshot = heroHasPassive(actingHero, 'killshot_matrix') && (target.hp <= target.maxHp * 0.35);
        if(isKillshot || Math.random() * 100 < critChance) {







            isCrit = true;







            dmg = Math.floor(dmg * critMult);







            logMsg(heroHasPassive(actingHero, 'lethal_exploit') && hasAilment ? "🎯 Lethal Exploit Critical Strike!" : "Critical Hit!", "#ff5555");







            playSFX('crit');







            screenShake('medium');















            // Vampiric Fervor Keystone: Physical critical strikes restore 10% damage dealt as HP







            if (isMain && player.skillTree && player.skillTree.vampiricFervor > 0) {







                let vHeal = Math.max(1, Math.floor(dmg * 0.10));







                let prevHp = pStats.hp;







                let excessHeal = Math.max(0, (prevHp + vHeal) - pStats.maxHp);







                player.baseStats.hp = Math.min(pStats.maxHp, pStats.hp + vHeal);







                pStats.hp = player.baseStats.hp;







                playerEnt.hp = pStats.hp;







                logMsg(`🩸 Vampiric Fervor restored ${vHeal} HP on critical hit!`, "#ef4444");







                floatText('battle-player', `+${vHeal} Vampiric`, "#55ff55");















                // Overcharged Aegis: excess healing converted into Divine Barrier







                if (player.skillTree.overchargedAegis > 0 && excessHeal > 0) {







                    let maxBarrier = Math.floor(pStats.maxHp * 0.20);







                    let currentBarrier = (playerEnt.statuses && playerEnt.statuses.divine_barrier && playerEnt.statuses.divine_barrier.value) || 0;







                    let barrierToAdd = Math.min(excessHeal, Math.max(0, maxBarrier - currentBarrier));







                    if (barrierToAdd > 0) {







                        applyStatus(playerEnt, 'divine_barrier', 3, currentBarrier + barrierToAdd);







                        logMsg(`✨ Overcharged Aegis converted ${barrierToAdd} excess healing into Divine Barrier!`, "#ffd700");







                        floatText('battle-player', `+${barrierToAdd} Barrier`, "#ffd700");







                    }







                }







                renderBattlefield();







                updateHeader();







            } else if (!isMain && player.skillTree && player.skillTree.vampiricFervor > 0) {







                let vHeal = Math.max(1, Math.floor(dmg * 0.10));







                let curHeroHp = actingHero.hp !== undefined ? actingHero.hp : (actingHero.baseStats?.hp || heroStats.maxHp);







                let excessHeal = Math.max(0, (curHeroHp + vHeal) - heroStats.maxHp);







                playerEnt.hp = Math.min(heroStats.maxHp, curHeroHp + vHeal);







                logMsg(`🩸 Vampiric Fervor restored ${vHeal} HP to ${actingHero.name}!`, "#ef4444");







                floatText(playerEnt.id, `+${vHeal} Vampiric`, "#55ff55");















                if (player.skillTree.overchargedAegis > 0 && excessHeal > 0) {







                    let maxBarrier = Math.floor(heroStats.maxHp * 0.20);







                    let currentBarrier = (playerEnt.statuses && playerEnt.statuses.divine_barrier && playerEnt.statuses.divine_barrier.value) || 0;







                    let barrierToAdd = Math.min(excessHeal, Math.max(0, maxBarrier - currentBarrier));







                    if (barrierToAdd > 0) {







                        applyStatus(playerEnt, 'divine_barrier', 3, currentBarrier + barrierToAdd);







                        logMsg(`✨ Overcharged Aegis converted ${barrierToAdd} excess healing into Divine Barrier!`, "#ffd700");







                        floatText(playerEnt.id, `+${barrierToAdd} Barrier`, "#ffd700");







                    }







                }







                renderBattlefield();







            }















            // Momentum Keystone: Landing a critical strike grants Haste for 2 turns







            if (player.skillTree && player.skillTree.momentum > 0) {







                applyStatus(playerEnt, 'haste', 2);







                logMsg(`⚡ Momentum activated! ${actingHero.name} gained Haste for 2 turns!`, "#eab308");







                floatText(playerEnt.id, "MOMENTUM HASTE", "#eab308");







            }







        } else {







            playSFX('slash');







        }







        







        triggerHitVFX(target.id, 'physical');







        applyDamage(target, dmg, ELEMENTS.Physical, playerEnt, isCrit);
        if (heroHasPassive(actingHero, 'righteous_zeal') && target && target.hp > 0) {
            let tMaxHp = target.maxHp || (target.enemy && target.enemy.maxHp) || 100;
            let missingHp = Math.max(0, tMaxHp - target.hp);
            let bonusHoly = Math.round(missingHp * 0.15);
            if (bonusHoly > 0) {
                logMsg(`⚖️ Righteous Zeal smites ${target.name} for ${bonusHoly} bonus Holy damage!`, "#ffd700");
                applyDamage(target, bonusHoly, ELEMENTS.Light, playerEnt);
            }
        }

        // Killshot Matrix: Pierce all enemies in battle
        if (heroHasPassive(actingHero, 'killshot_matrix') && battleState && battleState.enemies && Array.isArray(battleState.enemies)) {
            battleState.enemies.forEach(other => {
                if (other !== target && other.hp > 0) {
                    let otherEffDef = Math.floor(other.def * 0.5);
                    let otherMit = 20 / (20 + otherEffDef);
                    let otherBase = playerEnt.atk * 1.5;
                    let otherDmg = Math.max(1, Math.floor(otherBase * otherMit));
                    let otherIsCrit = (other.hp <= other.maxHp * 0.35) || (Math.random() * 100 < critChance);
                    if (otherIsCrit) otherDmg = Math.floor(otherDmg * critMult);
                    applyDamage(other, otherDmg, ELEMENTS.Physical, playerEnt, otherIsCrit);
                    floatText(other.id, `${otherDmg}`, "#38bdf8", otherIsCrit);
                }
            });
            logMsg("🏹 Killshot Matrix: Projectile pierced through all enemies!", "#38bdf8");
        }

        // Beastmaster: Pack Bond synchronized pet attack
        if (heroHasPassive(actingHero, 'pack_bond') && target.hp > 0) {
            let petBaseDmg = Math.max(1, Math.floor(playerEnt.atk * 0.75 * (20 / (20 + target.def))));
            logMsg(`🐾 Companion Beast pounces alongside ${actingHero.name} for ${petBaseDmg} damage!`, "#10b981");
            floatText(target.id, `🐾 ${petBaseDmg}`, "#10b981");
            applyDamage(target, petBaseDmg, ELEMENTS.Physical, playerEnt);
        }

        // Death's Dominion: Basic attacks inflict Decay (3t) and Curse (-20% ATK/MATK, 3t)
        if (heroHasPassive(actingHero, 'death_dominion') && target.hp > 0) {
            applyStatus(target, 'decay', 3);
            applyStatus(target, 'curse', 3);
            logMsg(`💀 Death's Dominion hexes ${target.name} with Decay and Curse (-20% ATK/MATK)!`, "#9333ea");
            floatText(target.id, "CURSED & DECAY", "#9333ea");
        }







        animateAction(playerEnt.id);

        // Archon's Voidweave 4pc: Basic attacks restore 5% Max MP
        if (typeof hasHeroSetBonus === 'function' && hasHeroSetBonus(actingHero, 'archons_voidweave', 4)) {
            let mpRestore = Math.max(1, Math.round(heroStats.maxMp * 0.05));
            if (isMain) {
                pStats.mp = Math.min(pStats.maxMp, pStats.mp + mpRestore);
                player.baseStats.mp = pStats.mp;
            } else {
                actingHero.mp = Math.min(heroStats.maxMp, (actingHero.mp !== undefined ? actingHero.mp : heroStats.maxMp) + mpRestore);
            }
            logMsg(`🌀 Archon's Voidweave: ${actingHero.name}'s attack restored ${mpRestore} MP!`, "#c084fc");
            floatText(playerEnt.id, `+${mpRestore} MP`, "#38bdf8");
        }

        // Shadowstalker Regalia 4pc: Basic attacks strike twice against debuffed targets
        let targetHasDebuff = target.statuses && Object.keys(target.statuses).length > 0;
        if (typeof hasHeroSetBonus === 'function' && hasHeroSetBonus(actingHero, 'shadowstalker_regalia', 4) && targetHasDebuff && !target._inSecondStrike && target.hp > 0) {
            target._inSecondStrike = true;
            logMsg(`🗡️ Exposing Strikes: ${actingHero.name} strikes a second time against debuffed ${target.name}!`, "#10b981");
            setCombatTimeout(() => {
                target._inSecondStrike = false;
                if (target.hp > 0) {
                    applyDamage(target, dmg, ELEMENTS.Physical, playerEnt);
                }
            }, 250);
        }















        // Thunderstone Core Relic Chain Lightning







        if (isMain && player.spire && player.spire.equippedRelic === 'thunderstone_core' && Math.random() < 0.35) {







            let splashDmg = Math.max(1, Math.floor(dmg * 0.5));







            logMsg("⚡ Thunderstone Core discharges chain lightning!", "#eab308");







            floatText(playerEnt.id, "THUNDER SPLASH", "#eab308");







            if (battleState.enemies && Array.isArray(battleState.enemies)) {







                battleState.enemies.forEach(other => {







                    if (other !== target && other.hp > 0) {







                        applyDamage(other, splashDmg, ELEMENTS.Wind, playerEnt);







                        floatText(other.id, `-${splashDmg} Shock`, "#eab308");







                    }







                });







            }







        }















        // Tempest Blademaster: Omnislash Flurry







        if (isMain && playerHasPassive('omnislash_flurry') && target.hp > 0) {







            let dmg2 = Math.max(1, Math.floor(dmg * 0.5));







            logMsg("🌪️ Tempest Blademaster strikes a second time!", "#38bdf8");







            applyDamage(target, dmg2, ELEMENTS.Physical, playerEnt);







        }







        







        if (isMain) triggerRegen();







        processStatusesEndTurn(playerEnt);







        setCombatTimeout(processNextTurn, 1200);







    }







    function executePlayerSkill(skill, target) {







        if (battleState) battleState.isPlayerTurn = false;







        document.getElementById('battle-commands').classList.remove('targeting-mode-ui');







        document.getElementById('battle-commands').classList.remove('sub-menu-active');







        document.getElementById('enemies-side').classList.remove('targeting-active');







        document.querySelectorAll('#cmd-main .btn').forEach(b => b.disabled = true);







        if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();















        const actingHero = (battleState && battleState.activeHero) || (player.roster && player.roster.find(h => h.id === 'hero_main')) || player.roster[0];







        const isMain = actingHero.isMain || actingHero.id === 'hero_main';







        const playerEnt = getHeroCombatEntity(actingHero);







        const heroStats = computeHeroStats(actingHero);















        // Silence check on player casting spells







        if (hasStatus(playerEnt, 'silence') && (skill.type === 'magic' || skill.type === 'heal')) {







            logMsg(`${actingHero.name} is Silenced and cannot cast spells!`, "#94a3b8");







            floatText(playerEnt.id, "SILENCED", "#94a3b8");







            if (battleState) battleState.isPlayerTurn = true;







            enableCommands();







            return;







        }















        // Bleed check on player action







        if (hasStatus(playerEnt, 'bleed')) {







            let bDmg = Math.max(2, Math.floor(heroStats.maxHp * 0.04) + 4);







            playerEnt.hp = Math.max(0, playerEnt.hp - bDmg);







            logMsg(`${actingHero.name} suffers ${bDmg} bleed damage from casting!`, "#ef4444");







            floatText(playerEnt.id, `🩸 -${bDmg} Bleed`, "#ef4444", false, 'dot');







            let livingCheck = getLivingPartyHeroes();







            if (livingCheck.length === 0) {







                loseBattle();







                return;







            }







        }















        let isArcaneSurge = false;







        if (isMain && skill.type === 'magic' && player.skillTree && player.skillTree.arcaneSurge > 0 && Math.random() < 0.25) {







            isArcaneSurge = true;







            logMsg("✨ Arcane Surge activated! 0 MP cost & +30% spell damage!", "#c084fc");







            floatText(playerEnt.id, "ARCANE SURGE!", "#c084fc");







        }















        let cost = isArcaneSurge ? 0 : getSkillCost(skill);







        if (isMain) {







            player.baseStats.mp = Math.max(0, player.baseStats.mp - cost);







            pStats.mp = player.baseStats.mp;







        } else {







            actingHero.mp = Math.max(0, (actingHero.mp !== undefined ? actingHero.mp : heroStats.maxMp) - cost);







        }







        







        logMsg(`${actingHero.name} casts ${skill.name}!`, "#aaddff");







        animateAction(playerEnt.id);















        const skillFX = getSkillSFXAndVFX(skill);







        playSFX(skillFX.sfx);















        if(skill.target === 'enemy_single') {







            let dmg;







            if (skill.name === 'Holy Smite') {







                let baseDmg = (playerEnt.atk * 1.2 + playerEnt.def * 1.0) + skill.power;







                let mitigation = 20 / (20 + target.mdef);







                dmg = Math.max(1, Math.floor(baseDmg * mitigation));







                if (target.element === ELEMENTS.Dark) {







                    dmg = Math.floor(dmg * 2.0);







                    logMsg("⚡ Holy Smite deals critical divine damage against Dark!", "#ffd700");







                }







            } else if (skill.name === 'Arcane Missiles') {







                dmg = Math.max(1, Math.floor(pStats.matk * 1.6 + skill.power) - Math.floor(target.mdef * 0.5));







                if (isArcaneSurge) dmg = Math.floor(dmg * 1.3);







            } else if (skill.name === 'Shadow Step') {







                let effDef = Math.floor(target.def * 0.5);







                let baseDmg = playerEnt.atk * 1.5 + skill.power;







                let mitigation = 20 / (20 + effDef);







                let critMult = hasStatus(playerEnt, 'focus') ? 2.0 : 1.8;







                dmg = Math.max(1, Math.floor(baseDmg * mitigation * critMult));







                logMsg("🗡️ Shadow Step executes a guaranteed Critical Hit from the shadows!", "#a855f7");







                playSFX('crit');







                screenShake('medium');







                floatText(target.id, "CRIT!", "#a855f7", true);







            } else if (skill.name === 'Mirage Flurry') {







                let critBonus = 35;







                let totalDmg = 0;







                for(let s = 1; s <= 3; s++) {







                    let strikeDmg = Math.max(1, Math.floor((playerEnt.atk * 0.7 + skill.power / 3) * (20 / (20 + target.def))));







                    let isCrit = (Math.random() * 100) < (pStats.crit + critBonus);







                    if(isCrit) strikeDmg = Math.floor(strikeDmg * 1.5);







                    totalDmg += strikeDmg;







                }







                dmg = totalDmg;







                logMsg(`Hero unleashes Mirage Flurry! 3 strikes deal ${totalDmg} total damage!`, "#67e8f9");







            } else if (skill.name === 'Shadow Rupture') {







                let dotCount = 0;







                if (hasStatus(target, 'burn')) dotCount++;







                if (hasStatus(target, 'poison')) dotCount += (target.statuses.poison.stacks || 1);







                if (hasStatus(target, 'decay')) dotCount++;







                if (hasStatus(target, 'bleed')) dotCount++;







                let baseDmg = pStats.matk * 1.5 + skill.power + (dotCount * 35);







                dmg = Math.max(1, Math.floor(baseDmg - target.mdef));







                if (dotCount > 0) {







                    dmg = Math.floor(dmg * 1.5);







                    logMsg(`💥 Shadow Rupture detonates ${dotCount} affliction(s) for massive burst damage!`, "#c084fc");







                    floatText(target.id, "BURST!", "#c084fc");







                }







            } else if (skill.name === 'Aimed Shot') {
                let effDef = target.def;
                let mitigation = 20 / (20 + effDef);
                let baseDmg = playerEnt.atk * 1.6;
                let critRate = (pStats ? pStats.crit : (heroStats.crit || 10)) + 20;
                let isAimedCrit = (Math.random() * 100) < critRate;
                let critMult = isAimedCrit ? (hasStatus(playerEnt, 'focus') ? 2.0 : 1.5) : 1.0;
                dmg = Math.max(1, Math.floor(baseDmg * mitigation * critMult));
                if (isAimedCrit) {
                    logMsg("🎯 Aimed Shot lands a precision Critical Hit!", "#16a34a");
                    playSFX('crit');
                    screenShake('medium');
                    floatText(target.id, "CRIT!", "#16a34a", true);
                }
            } else if (skill.name === 'Marked Prey') {
                let effDef = target.def;
                let mitigation = 20 / (20 + effDef);
                let baseDmg = playerEnt.atk * 1.0;
                dmg = Math.max(1, Math.floor(baseDmg * mitigation));
                applyStatus(target, 'marked', 3);
                logMsg(`🎯 Marked Prey tags ${target.name}! Target takes +25% amplified damage for 3 turns!`, "#16a34a");
                floatText(target.id, "MARKED!", "#16a34a");
            } else if (skill.name === 'Pack Hunt') {
                let effDef = target.def;
                let mitigation = 20 / (20 + effDef);
                let baseDmg = playerEnt.atk * 1.8;
                dmg = Math.max(1, Math.floor(baseDmg * mitigation));
                let petDmg = Math.max(1, Math.floor(playerEnt.atk * 1.0 * (20 / (20 + target.def))));
                if (target && target.hp > 0) {
                    applyDamage(target, petDmg, ELEMENTS.Physical, playerEnt);
                    logMsg(`🐾 Companion Beast tears into ${target.name} during Pack Hunt for ${petDmg} damage!`, "#10b981");
                    floatText(target.id, `🐾 ${petDmg}`, "#10b981");
                }
            } else if (skill.name === 'Piercing Shot') {
                let effDef = Math.floor(target.def * 0.5);
                let mitigation = 20 / (20 + effDef);
                let baseDmg = playerEnt.atk * 2.0;
                dmg = Math.max(1, Math.floor(baseDmg * mitigation));
                logMsg("🎯 Piercing Shot punctures armor, ignoring 50% DEF!", "#ca8a04");
            } else if (skill.name === 'Headshot Stagger') {
                let effDef = target.def;
                let mitigation = 20 / (20 + effDef);
                let baseDmg = playerEnt.atk * 2.2;
                dmg = Math.max(1, Math.floor(baseDmg * mitigation));
                target._isHeadshotStagger = true;
                logMsg("🎯 Headshot Stagger delivers a crushing concussive blow! (2.5x Stagger)", "#f59e0b");
            } else if (skill.name === 'Bone Spear') {
                let actingMatk = isMain ? pStats.matk : heroStats.matk;
                let effDef = Math.floor(target.def * 0.75); // ignores 25% DEF
                let mitigation = 20 / (20 + effDef);
                let baseDmg = (actingMatk * 1.60) + (skill.power || 0);
                dmg = Math.max(1, Math.floor(baseDmg * mitigation));
                if (battleState) {
                    battleState.soulRemnants = Math.min(5, (battleState.soulRemnants || 0) + 1);
                }
                logMsg(`🦴 Bone Spear punctures ${target.name}, ignoring 25% DEF! (+1 Soul Remnant: ${battleState ? battleState.soulRemnants : 1}/5)`, "#c084fc");
            } else if (skill.name === 'Grave Chill') {
                let actingMatk = isMain ? pStats.matk : heroStats.matk;
                let effMdef = target.mdef || 0;
                let mitigation = 20 / (20 + effMdef);
                let baseDmg = (actingMatk * 1.80) + (skill.power || 0);
                dmg = Math.max(1, Math.floor(baseDmg * mitigation));
                let targetHasDebuff = target.statuses && Object.keys(target.statuses).length > 0;
                applyStatus(target, 'slow', 3);
                if (targetHasDebuff) {
                    applyStatus(target, 'freeze', 1);
                    logMsg(`❄️ Grave Chill blasts debuffed ${target.name} with Abyssal Frost! Inflicted Slow and Freeze!`, "#06b6d4");
                } else {
                    logMsg(`❄️ Grave Chill chills ${target.name}! Inflicted Slow (-30% SPD) for 3 turns!`, "#06b6d4");
                }
            } else if (skill.name === 'Radiant Smite') {
                let actingMatk = isMain ? pStats.matk : heroStats.matk;
                let actingAtk = playerEnt.atk;
                let baseDmg = (actingMatk * 1.7) + (actingAtk * 0.8) + (skill.power || 0);
                let mitigation = 20 / (20 + (target.mdef || 0));
                dmg = Math.max(1, Math.floor(baseDmg * mitigation));
                logMsg("✨ Radiant Smite unleashes sacred retribution!", "#ffd700");
            } else if(skill.type === 'physical') {







                let baseDmg = playerEnt.atk * 1.5 + skill.power;







                let mitigation = 20 / (20 + target.def);







                dmg = Math.max(1, Math.floor(baseDmg * mitigation));







                if (heroHasPassive(actingHero, 'blood_frenzy')) {







                    let curHp = isMain ? pStats.hp : (actingHero.hp !== undefined ? actingHero.hp : heroStats.hp);







                    let maxHp = isMain ? pStats.maxHp : heroStats.maxHp;







                    let missingHpRatio = 1 - (curHp / maxHp);







                    let bfBonus = 1 + (missingHpRatio * 0.40);







                    dmg = Math.floor(dmg * bfBonus);







                }







            } else {







                dmg = Math.max(1, Math.floor(pStats.matk * 1.5 + skill.power) - target.mdef);







                if (isArcaneSurge) dmg = Math.floor(dmg * 1.3);







                if (playerHasPassive('arcane_singularity')) {







                    let critChance = pStats.crit + (hasStatus(playerEnt, 'focus') ? 25 : 0);







                    if (Math.random() * 100 < critChance) {







                        dmg = Math.floor(dmg * 2.0);







                        logMsg("✨ Arcane Singularity Spell Critical Hit!", "#c084fc");







                        playSFX('crit');







                        screenShake('medium');







                        floatText(target.id, "CRIT!", "#c084fc", true);







                    }







                }







            }







            







            triggerHitVFX(target.id, skillFX.vfx);







            applyDamage(target, dmg, skill.element, playerEnt);
            // Radiant Smite Party Siphon (50% damage dealt heals lowest HP party ally)
            if (skill.name === 'Radiant Smite' && dmg > 0) {
                let siphonHeal = Math.max(1, Math.floor(dmg * 0.50));
                let livingParty = (typeof getLivingPartyHeroes === 'function') ? getLivingPartyHeroes() : [actingHero];
                let lowestAlly = null;
                let lowestPercent = 2;
                livingParty.forEach(h => {
                    let hStats = computeHeroStats(h);
                    let hMax = h.isMain ? pStats.maxHp : (hStats.maxHp || 100);
                    let hCur = h.isMain ? pStats.hp : (h.hp !== undefined ? h.hp : (h.baseStats?.hp || hMax));
                    let pct = hCur / hMax;
                    if (pct < lowestPercent) {
                        lowestPercent = pct;
                        lowestAlly = h;
                    }
                });
                if (lowestAlly) {
                    let aStats = computeHeroStats(lowestAlly);
                    let aMax = lowestAlly.isMain ? pStats.maxHp : (aStats.maxHp || 100);
                    let aCur = lowestAlly.isMain ? pStats.hp : (lowestAlly.hp !== undefined ? lowestAlly.hp : (lowestAlly.baseStats?.hp || aMax));
                    let newHp = Math.min(aMax, aCur + siphonHeal);
                    if (lowestAlly.isMain) {
                        player.baseStats.hp = newHp;
                        pStats.hp = newHp;
                    } else {
                        lowestAlly.hp = newHp;
                        if (lowestAlly.baseStats) lowestAlly.baseStats.hp = newHp;
                    }
                    let allyEnt = (typeof getHeroCombatEntity === 'function') ? getHeroCombatEntity(lowestAlly) : null;
                    if (allyEnt) {
                        allyEnt.hp = newHp;
                        floatText(allyEnt.id, `+${siphonHeal} Siphon`, "#55ff55");
                    }
                    logMsg(`✨ Radiant Smite siphoned ${siphonHeal} Holy healing to ${lowestAlly.name}!`, "#55ff55");
                }
            }















            // Bloodthirst Strike Lifesteal







            if (skill.name === 'Bloodthirst Strike' && dmg > 0) {







                let heal = Math.max(1, Math.floor(dmg * 0.30));







                if (isMain) {







                    player.baseStats.hp = Math.min(pStats.maxHp, player.baseStats.hp + heal);







                    pStats.hp = player.baseStats.hp;







                    playerEnt.hp = pStats.hp;







                    floatText('battle-player', `+${heal} HP`, "#55ff55");







                } else {







                    playerEnt.hp = Math.min(heroStats.maxHp, playerEnt.hp + heal);







                    floatText(playerEnt.id, `+${heal} HP`, "#55ff55");







                }







                logMsg(`🩸 Bloodthirst Strike restored ${heal} HP to ${actingHero.name}!`, "#ef4444");







            }















            // Soul Siphon Skill Lifesteal & Decay







            if (skill.name === 'Soul Siphon' && dmg > 0) {







                applyStatus(target, 'decay', 3);







                let heal = Math.max(1, Math.floor(dmg * 0.50));







                if (isMain) {







                    player.baseStats.hp = Math.min(pStats.maxHp, player.baseStats.hp + heal);







                    pStats.hp = player.baseStats.hp;







                    playerEnt.hp = pStats.hp;







                    floatText('battle-player', `+${heal} HP`, "#a855f7");







                } else {







                    playerEnt.hp = Math.min(heroStats.maxHp, playerEnt.hp + heal);







                    floatText(playerEnt.id, `+${heal} HP`, "#a855f7");







                }







                logMsg(`🔮 Soul Siphon drained ${heal} HP to ${actingHero.name}!`, "#a855f7");







            }















            // Passive Soul Siphon Magic Leech (Warlock passive on other magic skills)







            if (skill.type === 'magic' && heroHasPassive(actingHero, 'soul_siphon') && dmg > 0 && skill.name !== 'Soul Siphon') {







                let leech = Math.max(1, Math.floor(dmg * 0.20));







                if (isMain) {







                    player.baseStats.hp = Math.min(pStats.maxHp, player.baseStats.hp + leech);







                    pStats.hp = player.baseStats.hp;







                    playerEnt.hp = pStats.hp;







                    floatText('battle-player', `+${leech} HP`, "#a855f7");







                } else {







                    playerEnt.hp = Math.min(heroStats.maxHp, (playerEnt.hp || 0) + leech);







                    actingHero.hp = playerEnt.hp;







                    if (actingHero.baseStats) actingHero.baseStats.hp = playerEnt.hp;







                    floatText(playerEnt.id, `+${leech} HP`, "#a855f7");







                }







                logMsg(`🔮 Soul Siphon: ${actingHero.name} leeches ${leech} HP!`, "#a855f7");







            }







            







            // Tactical Ailments upgrades & New Class Skill Effects







            if(skill.name === 'Heavy Slam') {







                if(Math.random() < 0.5) applyStatus(target, 'stun', 1);







            } else if(skill.name === 'Quick Slash') {







                applyStatus(playerEnt, 'mirage', 99, 0);







                logMsg("Hero gains 1 stack of Mirage evasion!", "#67e8f9");







                floatText('battle-player', "+1 Mirage", "#67e8f9");







            } else if(skill.name === 'Smoke Screen') {







                applyStatus(target, 'blind', 2);







                applyStatus(playerEnt, 'haste', 3);







                logMsg("Hero casts Smoke Screen! Target is Blinded and Hero gains Haste!", "#94a3b8");







                floatText(target.id, "BLIND", "#94a3b8");







                floatText('battle-player', "HASTE", "#06b6d4");







            } else if(skill.name === 'Fireball') {







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
            if (skill.name === 'Corpse Explosion') {
                let actingMatk = isMain ? pStats.matk : heroStats.matk;
                dmg = Math.max(1, Math.floor(actingMatk * 2.20 + (skill.power || 0)));
                if (battleState && battleState.soulRemnants > 0) {
                    battleState.soulRemnants--;
                    logMsg(`💥 Corpse Explosion detonates a Soul Remnant (${battleState.soulRemnants} left)!`, "#ef4444");
                } else if (battleState && battleState.minions && battleState.minions.some(m => m.hp > 0)) {
                    let activeM = battleState.minions.find(m => m.hp > 0);
                    logMsg(`💥 Corpse Explosion sacrifices and detonates ${activeM.name}!`, "#ef4444");
                    applyDamage(activeM, 99999, ELEMENTS.Dark, playerEnt);
                } else {
                    logMsg(`💥 Corpse Explosion erupts with dark necromantic energy!`, "#ef4444");
                }
            } else if (skill.name === 'Judgement Pyre') {
                let actingMatk = isMain ? pStats.matk : heroStats.matk;
                dmg = Math.max(1, Math.floor(actingMatk * 1.4 + (skill.power || 0)));
            } else







            if (skill.type === 'magic') {







                dmg = Math.max(1, Math.floor(pStats.matk * 1.5 + skill.power));







                if (isArcaneSurge) dmg = Math.floor(dmg * 1.3);







            }







            battleState.enemies.forEach(e => {







                if(e.hp > 0) {







                    let foeMitigation = (skill.type === 'magic') ? e.mdef : e.def;







                    let targetDmg = Math.max(1, dmg - foeMitigation);







                    triggerHitVFX(e.id, skillFX.vfx);







                    applyDamage(e, targetDmg, skill.element, playerEnt);







                    







                    if(skill.name === 'Cleave' || skill.name === 'Whirlwind of Blades') {







                        applyStatus(e, 'bleed', 3);







                    } else if(skill.name === 'Frost Nova') {







                        if(Math.random() < 0.60) {







                            if(Math.random() < 0.5) applyStatus(e, 'freeze', 1);







                            else applyStatus(e, 'slow', 2);







                        }







                    } else if(skill.name === 'Blizzard') {







                        if(Math.random() < 0.5) applyStatus(e, 'freeze', 1);







                        else applyStatus(e, 'slow', 2);







                    } else if(skill.name === 'Chain Lightning') {







                        applyStatus(e, 'shock', 3);







                    } else if(skill.name === 'Venom Spray') {







                        applyStatus(e, 'poison', 3);







                        if(e.statuses && e.statuses.poison) {







                            let def = (typeof STATUS_TYPES_DB !== 'undefined') && STATUS_TYPES_DB.poison;







                            let maxS = (def && def.maxStacks) ? def.maxStacks : 3;







                            e.statuses.poison.stacks = Math.min(maxS, 2);







                        }







                    } else if(skill.name === 'Judgement Pyre') {
                        applyStatus(e, 'burn', 3);
                        applyStatus(e, 'holy_vulnerability', 3);
                    }







                }







            });







        }







        







        renderBattlefield();







        if (isMain) triggerRegen();







        processStatusesEndTurn(playerEnt);







        setCombatTimeout(processNextTurn, 1200);







    }







    function applyDamage(target, amount, element, attacker = null, isCrit = false) {
        if (!target || target.hp <= 0) return;

        // Frontline Minion Target Damage Handling
        if (target.isMinion) {
            if (target.statuses) {
                for (let bId of ['bone_armor', 'bone_barrier', 'divine_barrier']) {
                    if (target.statuses[bId] && target.statuses[bId].value > 0) {
                        let curVal = target.statuses[bId].value;
                        if (curVal >= amount) {
                            target.statuses[bId].value -= amount;
                            amount = 0;
                            logMsg(`${target.name}'s barrier absorbed the attack!`, "#ffd700");
                            floatText(target.id, "ABSORBED", "#ffd700");
                            break;
                        } else {
                            amount -= curVal;
                            delete target.statuses[bId];
                            logMsg(`${target.name}'s barrier broke!`, "#ffd700");
                            floatText(target.id, "SHIELD BROKE", "#ffd700");
                        }
                    }
                }
            }
            if (amount > 0) {
                target.hp = Math.max(0, target.hp - amount);
                logMsg(`${target.name} takes ${amount} damage.`);
                floatText(target.id, `-${amount}`, "#ef4444");
                applyHitFlash(target.id);
            }
            if (target.hp <= 0) {
                floatText(target.id, "SHATTERED!", "#a855f7");
                logMsg(`💀 ${target.name} shattered under the blow!`, "#a855f7");
                if (battleState && battleState.minions) {
                    let idx = battleState.minions.indexOf(target);
                    if (idx !== -1) battleState.minions.splice(idx, 1);
                }
                // Soul Harvest Remnant
                if (battleState) {
                    battleState.soulRemnants = Math.min(5, (battleState.soulRemnants || 0) + 1);
                }
                // Cataclysmic Reanimation check
                let summoner = player.roster && player.roster.find(h => h.id === target.summonerId);
                if (summoner && typeof heroHasPassive === 'function' && heroHasPassive(summoner, 'cataclysmic_reanimation')) {
                    let sStats = computeHeroStats(summoner);
                    let sMatk = summoner.isMain ? pStats.matk : sStats.matk;
                    let expDmg = Math.max(1, Math.round(sMatk * 1.50));
                    logMsg(`💀 Cataclysmic Reanimation! ${target.name}'s destruction detonates a 150% Corpse Explosion and shields the party!`, "#a855f7");
                    if (battleState && battleState.enemies) {
                        battleState.enemies.forEach(e => {
                            if (e && e.hp > 0) {
                                applyDamage(e, Math.max(1, expDmg - (e.mdef || 0)), ELEMENTS.Dark, getHeroCombatEntity(summoner));
                            }
                        });
                    }
                    let livingParty = (typeof getLivingPartyHeroes === 'function') ? getLivingPartyHeroes() : [];
                    livingParty.forEach(h => {
                        let hS = computeHeroStats(h);
                        let mHp = h.isMain ? pStats.maxHp : (hS.maxHp || 100);
                        let bVal = Math.round(mHp * 0.15);
                        applyStatus(getHeroCombatEntity(h), 'bone_barrier', 3, bVal);
                        floatText(getHeroCombatEntity(h).id, `+${bVal} BONE BARRIER`, "#a855f7");
                    });
                }
            }
            if (typeof renderBattlefield === 'function') renderBattlefield();
            return;
        }







        if (!target || target.hp <= 0) return;















        let isTargetPlayer = (target.isPlayer || target.id === 'battle-player' || target === player);

        // Living Bastion (Titan's Bulwark 4pc): Wearer absorbs 35% of all damage dealt to Backline allies
        let targetHero = target.hero || (player.roster && player.roster.find(h => h.id === target.heroId || (h.isMain && (target.isPlayer || target.id === 'battle-player'))));
        if (targetHero && targetHero.row === 'back' && amount > 0) {
            let livingParty = (typeof getLivingPartyHeroes === 'function') ? getLivingPartyHeroes() : [];
            let titanWearer = livingParty.find(h => h.id !== targetHero.id && typeof hasHeroSetBonus === 'function' && hasHeroSetBonus(h, 'titans_bulwark', 4));
            if (titanWearer) {
                let redirected = Math.floor(amount * 0.35);
                amount -= redirected;
                logMsg(`🛡️ Living Bastion: ${titanWearer.name} absorbed ${redirected} damage for ${targetHero.name}!`, "#f59e0b");
                floatText(target.id, `Absorbed -${redirected}`, "#f59e0b");

                let titanEnt = (typeof getHeroCombatEntity === 'function') ? getHeroCombatEntity(titanWearer) : null;
                if (titanEnt) {
                    titanWearer.hp = Math.max(0, (titanWearer.hp !== undefined ? titanWearer.hp : titanEnt.hp) - redirected);
                    titanEnt.hp = titanWearer.hp;
                    floatText(titanEnt.id, `-${redirected} Guard`, "#f59e0b");
                    applyHitFlash(titanEnt.id);

                    let titanStats = computeHeroStats(titanWearer);
                    if (titanWearer.hp > 0 && titanWearer.hp <= titanStats.maxHp * 0.25 && !titanWearer.livingBastionBarrierUsed) {
                        titanWearer.livingBastionBarrierUsed = true;
                        let barrierVal = Math.round(titanStats.maxHp * 0.50);
                        applyStatus(titanEnt, 'divine_barrier', 99, barrierVal);
                        logMsg(`✨ Living Bastion activated! ${titanWearer.name} gained a Divine Barrier (${barrierVal} HP)!`, "#ffd700");
                        floatText(titanEnt.id, `BARRIER +${barrierVal}`, "#ffd700");
                    }
                }
            }
            // Undead Vanguard: 40% backline damage redirection to highest HP minion
            if (battleState && battleState.minions && amount > 0) {
                let livingParty = (typeof getLivingPartyHeroes === 'function') ? getLivingPartyHeroes() : [];
                let boneCommander = livingParty.find(h => typeof heroHasPassive === 'function' && heroHasPassive(h, 'undead_vanguard'));
                let activeMinions = battleState.minions.filter(m => m && m.hp > 0).sort((a, b) => b.hp - a.hp);
                if (boneCommander && activeMinions.length > 0) {
                    let targetMinion = activeMinions[0];
                    let redirected = Math.floor(amount * 0.40);
                    amount -= redirected;
                    logMsg(`💀 Undead Vanguard: ${targetMinion.name} intercepted ${redirected} damage for ${targetHero.name}!`, "#a855f7");
                    floatText(target.id, `Intercepted -${redirected}`, "#a855f7");
                    applyDamage(targetMinion, redirected, element, attacker);
                }
            }
        }

        // Staggered status: +50% damage amplified!
        if (hasStatus(target, 'staggered')) {
            amount = Math.floor(amount * 1.5);
            logMsg(`💫 Stagger Amplification: +50% damage dealt to ${target.name}!`, "#f43f5e");
        }

        // Marked status: +25% amplified damage
        if (hasStatus(target, 'marked')) {
            amount = Math.floor(amount * 1.25);
            logMsg(`🎯 Marked Prey: +25% amplified damage dealt to ${target.name}!`, "#16a34a");
        }
        // Holy Vulnerability status: +25% Holy damage taken
        if (element === ELEMENTS.Light && hasStatus(target, 'holy_vulnerability')) {
            amount = Math.floor(amount * 1.25);
            logMsg(`✨ Holy Vulnerability: +25% Holy damage dealt to ${target.name}!`, "#ffd700");
        }
        // Righteous Zeal passive: Holy damage +30% against targets with active debuffs
        if (element === ELEMENTS.Light && attacker) {
            let attackerHero = attacker.hero || (player.roster && player.roster.find(h => h.id === attacker.heroId || (h.isMain && (attacker.isPlayer || attacker.id === 'battle-player'))));
            if (attackerHero && typeof heroHasPassive === 'function' && heroHasPassive(attackerHero, 'righteous_zeal')) {
                let hasDebuff = false;
                if (target.statuses) {
                    for (let sId in target.statuses) {
                        let sDef = (typeof STATUS_TYPES_DB !== 'undefined') && STATUS_TYPES_DB[sId];
                        if (sDef && (sDef.type === 'dot' || sDef.type === 'disable' || sDef.type === 'debuff' || sDef.type === 'ailment')) {
                            hasDebuff = true;
                            break;
                        }
                    }
                }
                if (hasDebuff) {
                    amount = Math.floor(amount * 1.30);
                    logMsg(`⚖️ Righteous Zeal: +30% Holy damage dealt to afflicted ${target.name}!`, "#ffd700");
                }
            }
        }
        // Death's Dominion: +40% amplified Dark, Cold, and Decay damage
        if (attacker && (element === ELEMENTS.Dark || element === ELEMENTS.Water || element === 'Dark' || element === 'Water' || element === 'decay')) {
            let attackerHero = attacker.hero || (player.roster && player.roster.find(h => h.id === attacker.heroId || (h.isMain && (attacker.isPlayer || attacker.id === 'battle-player'))));
            if (attackerHero && typeof heroHasPassive === 'function' && heroHasPassive(attackerHero, 'death_dominion')) {
                amount = Math.floor(amount * 1.40);
                logMsg(`💀 Death's Dominion amplified necrotic damage (+40%)!`, "#a855f7");
            }
        }

        // Ignis Phase 2 Magma Totem 90% mitigation
        if (target.isRaidBoss && (target.raidId === 'raid_ignis' || (target.name && target.name.includes('Ignis'))) && target.phase === 2) {
            if (battleState && battleState.enemies && battleState.enemies.some(e => e.name === 'Magma Totem' && e.hp > 0)) {
                amount = Math.max(1, Math.floor(amount * 0.10));
                logMsg(`🛡️ Magma Totems absorbed 90% of damage dealt to Ignis!`, "#f97316");
            }
        }















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







                playSFX('dodge');







                floatText(target.id, "DODGED", "#67e8f9");







                if (isTargetPlayer && player.skillTree && player.skillTree.momentum > 0) {







                    applyStatus(target, 'haste', 2);







                    logMsg("⚡ Momentum activated! Hero gained Haste (+30% SPD) for 2 turns!", "#eab308");







                    floatText('battle-player', "MOMENTUM HASTE", "#eab308");







                }







                renderBattlefield();







                return;







            }







        }















        // Quick Reflexes Dodge Check (+2% evasion per rank)







        if (isTargetPlayer && player.skillTree && player.skillTree.quickReflexes > 0) {







            let dodgeChance = player.skillTree.quickReflexes * 2;







            if (Math.random() * 100 < dodgeChance) {







                logMsg(`Hero dodged ${attacker ? attacker.name + "'s" : "the"} attack with Quick Reflexes!`, "#67e8f9");







                playSFX('dodge');







                floatText(target.id || 'battle-player', "DODGED", "#67e8f9");







                if (player.skillTree.momentum > 0) {







                    applyStatus(target, 'haste', 2);







                    logMsg("⚡ Momentum activated! Hero gained Haste (+30% SPD) for 2 turns!", "#eab308");







                    floatText('battle-player', "MOMENTUM HASTE", "#eab308");







                }







                renderBattlefield();







                return;







            }







        }















        // 2. Elemental Affinity Multiplier & Resonance







        let multi = getElementalMultiplier(element, target.element);







        let isAttackerPlayer = (attacker && (attacker.isPlayer || attacker.id === 'battle-player' || attacker === player)) || (!attacker && !target.isPlayer && target !== player);







        if (multi > 1.0 && isAttackerPlayer && player.skillTree && player.skillTree.elementalResonance > 0) {







            multi += (player.skillTree.elementalResonance * 0.05);







        }







        amount = Math.floor(amount * multi);







        







        if(multi > 1.0) logMsg("It's super effective!", "#ffff55");







        if(multi < 1.0) logMsg("It's not very effective...", "#888888");















        // Monster Mastery Combat Bonus (+5% Damage at Silver Mastery: 50 kills, 10 for bosses)







        if (isAttackerPlayer && !target.isPlayer) {







            let kills = (player.bestiary && player.bestiary[target.name]) || 0;







            let reqSilver = target.isBoss ? 10 : 50;







            if (kills >= reqSilver) {







                amount = Math.floor(amount * 1.05);







            }







        }







        // Boss Gold Mastery Elemental Resistance Mitigation







        if (isTargetPlayer && pStats && pStats.elementalResistances && pStats.elementalResistances[element]) {







            let resPct = pStats.elementalResistances[element] || 0;







            if (resPct > 0) {







                amount = Math.max(1, Math.floor(amount * (1 - resPct / 100)));







            }







        }















        // Executioner Keystone (+35% damage to targets <= 30% HP)







        if (isAttackerPlayer && !target.isPlayer && player.skillTree && player.skillTree.executioner > 0 && target.hp <= target.maxHp * 0.30) {







            amount = Math.floor(amount * 1.35);







            floatText(target.id, "EXECUTIONER!", "#ef4444");







            logMsg(`⚔️ Executioner strikes weakened ${target.name} for +35% damage!`, "#ef4444");







        }















        // 3. Freeze Shatter Check







        if (hasStatus(target, 'freeze') && element === ELEMENTS.Physical) {







            amount = Math.floor(amount * 1.5);







            delete target.statuses.freeze;







            logMsg(`Heavy physical strike shattered the ice on ${target.name} for 1.5x damage!`, "#38bdf8");







            playSFX('magic_ice');







            screenShake('medium');







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







                playSFX('shield_absorb');







                floatText(target.id, "ABSORBED", "#ffd700");







            } else {







                amount -= shield;







                delete target.statuses.divine_barrier;







                logMsg(`${target.name}'s Divine Barrier shattered!`, "#ffd700");







                playSFX('shield_break');







                screenShake('light');







                floatText(target.id, "SHIELD BROKE", "#ffd700");







            }







            
            // Aura of Immortality barrier reflection (reflects 25% absorbed damage as Holy damage)
            if (absorbedAmount > 0 && attacker && attacker !== target && (attacker.hp > 0 || attacker.currentHp > 0)) {
                let livingParty = (typeof getLivingPartyHeroes === 'function') ? getLivingPartyHeroes() : [];
                let hasAura = livingParty.some(h => typeof heroHasPassive === 'function' && heroHasPassive(h, 'aura_of_immortality'));
                if (hasAura && !attacker._inAuraReflect) {
                    let reflectDmg = Math.max(1, Math.round(absorbedAmount * 0.25));
                    logMsg(`🕊️ Aura of Immortality reflected ${reflectDmg} Holy damage back to ${attacker.name}!`, "#38bdf8");
                    attacker._inAuraReflect = true;
                    applyDamage(attacker, reflectDmg, ELEMENTS.Light, target);
                    attacker._inAuraReflect = false;
                }
            }
            renderBattlefield();
        }

        // Bone Barrier Absorption
        if (hasStatus(target, 'bone_barrier') && amount > 0) {
            let shield = target.statuses.bone_barrier.value || 0;
            if (shield >= amount) {
                target.statuses.bone_barrier.value -= amount;
                amount = 0;
                logMsg(`${target.name}'s Bone Barrier absorbed the attack! (${target.statuses.bone_barrier.value} shield remaining)`, "#94a3b8");
                floatText(target.id, "ABSORBED", "#94a3b8");
            } else {
                amount -= shield;
                delete target.statuses.bone_barrier;
                logMsg(`${target.name}'s Bone Barrier shattered!`, "#94a3b8");
                floatText(target.id, "BONE SHATTER", "#94a3b8");
            }
            renderBattlefield();
        }

        // Bone Armor Absorption & Retaliation
        if (hasStatus(target, 'bone_armor') && amount > 0) {
            let shield = target.statuses.bone_armor.value || 0;
            let casterMatk = target.statuses.bone_armor.casterMatk || 50;
            if (shield >= amount) {
                target.statuses.bone_armor.value -= amount;
                amount = 0;
                logMsg(`${target.name}'s Bone Armor absorbed the attack! (${target.statuses.bone_armor.value} shield remaining)`, "#cbd5e1");
                floatText(target.id, "ABSORBED", "#cbd5e1");
            } else {
                amount -= shield;
                delete target.statuses.bone_armor;
                logMsg(`🦴 ${target.name}'s Bone Armor shattered! Retaliating with calcified bone shards!`, "#cbd5e1");
                floatText(target.id, "BONE ARMOR RETRIBUTION!", "#cbd5e1");
                // Retaliate with 100% MATK physical damage to all enemies
                if (battleState && battleState.enemies) {
                    battleState.enemies.forEach(e => {
                        if (e && e.hp > 0) {
                            applyDamage(e, Math.max(1, casterMatk - (e.def || 0)), ELEMENTS.Physical, target);
                        }
                    });
                }
            }
            renderBattlefield();
        }















        // Divine Retribution Reflection & Thorned Bastion Reflection







        if (isTargetPlayer && attacker && attacker.hp > 0) {







            let totalMitigated = absorbedAmount + (target.lastDefMitigated || 0);







            target.lastDefMitigated = 0;















            if (playerHasPassive('divine_retribution') && totalMitigated > 0) {







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















            // Thorned Bastion Keystone (reflect 25% of mitigated damage as true damage)







            if (player.skillTree && player.skillTree.thornedBastion > 0 && totalMitigated > 0 && attacker.hp > 0) {







                let thornReflect = Math.max(1, Math.floor(totalMitigated * 0.25));







                attacker.hp = Math.max(0, attacker.hp - thornReflect);







                logMsg(`🛡️ Thorned Bastion reflects ${thornReflect} true damage back to ${attacker.name}!`, "#10b981");







                floatText(attacker.id, `-${thornReflect} Reflect`, "#10b981");







                if (attacker.hp <= 0) {







                    logMsg(`${attacker.name} was defeated by Thorned Bastion!`, "#ff8888");







                    if(!player.questStats) player.questStats = { enemiesDefeated: 0, battlesWon: 0, bossesDefeated: 0 };







                    player.questStats.enemiesDefeated = (player.questStats.enemiesDefeated || 0) + 1;







                    if(attacker.isBoss) {







                        player.questStats.bossesDefeated = (player.questStats.bossesDefeated || 0) + 1;







                        if(typeof checkAchievements === 'function') checkAchievements();







                    }







                }







            }







        }















        // Channel Stagger Check: Damage reduces stagger gauge
        if (battleState && battleState.channelingUltimate && (target.isRaidBoss || target.channelingUltimate || (battleState.enemies && target === battleState.enemies[0]))) {
            let isWeakness = false;
            if (element && target.weakness && element.toLowerCase() === target.weakness.toLowerCase()) {
                isWeakness = true;
            } else if (typeof getElementalMultiplier === 'function' && getElementalMultiplier(element, target.element) > 1.0) {
                isWeakness = true;
            }
            let staggerDmg = amount;
            if (isWeakness && (typeof getElementalMultiplier !== 'function' || getElementalMultiplier(element, target.element) <= 1.0)) {
                staggerDmg = Math.round(staggerDmg * 1.5);
            }
            if (attacker && typeof heroHasPassive === 'function' && heroHasPassive(attacker, 'eagle_eye')) {
                staggerDmg = Math.round(staggerDmg * 2.0);
            }
            if (target._isHeadshotStagger) {
                staggerDmg = Math.round(staggerDmg * 2.5);
                delete target._isHeadshotStagger;
            }
            let weaknessMulti = isWeakness ? 1.5 : 1.0;
            let cu = battleState.channelingUltimate;
            cu.currentDamage = (cu.currentDamage || 0) + staggerDmg;
            let currentGauge = (cu.currentGauge !== undefined) ? cu.currentGauge : (cu.shieldAmount !== undefined ? cu.shieldAmount : (cu.maxGauge || 5000));
            cu.currentGauge = Math.max(0, currentGauge - staggerDmg);
            cu.shieldAmount = cu.currentGauge;

            if (target.stagger) target.stagger.current = cu.currentDamage;

            let maxVal = cu.maxGauge || cu.requiredDamage || 5000;
            logMsg(`⚡ Stagger Damage: +${staggerDmg} (${weaknessMulti > 1.0 ? '1.5x WEAKNESS! ' : ''}${cu.currentGauge}/${maxVal} left)`, "#eab308");
            floatText(target.id, `⚡ ${staggerDmg} STAGGER`, "#eab308");

            if (cu.currentGauge <= 0) {
                battleState.channelingUltimate = null;
                target.channelingUltimate = null;
                applyStatus(target, 'staggered', 2);
                if (!player.questStats) player.questStats = {};
                player.questStats.staggerBreaks = (player.questStats.staggerBreaks || 0) + 1;
                player.staggerBreaks = (player.staggerBreaks || 0) + 1;
                logMsg(`💥 STAGGER BREAK! ${target.name}'s ultimate was shattered! ${target.name} is Staggered! (+50% Damage Taken)`, "#f43f5e");
                if (typeof playSFX === 'function') playSFX('shield_break');
                if (typeof screenShake === 'function') screenShake('heavy', 500);
                floatText(target.id, "💥 STAGGER BREAK!", "#f43f5e");
            }
        }

        // Shadowstalker Regalia 4pc: Critical strikes apply Armor Shatter
        let attackerHero = attacker ? (attacker.hero || (player.roster && player.roster.find(h => h.id === attacker.heroId || (h.isMain && (attacker.isPlayer || attacker.id === 'battle-player'))))) : null;
        if (isCrit && attackerHero && typeof hasHeroSetBonus === 'function' && hasHeroSetBonus(attackerHero, 'shadowstalker_regalia', 4) && !target.isPlayer) {
            applyStatus(target, 'armor_shatter', 3);
            logMsg(`🗡️ Exposing Strikes: Shattered ${target.name}'s armor! (-30% DEF & MDEF, stacks up to 2)`, "#e11d48");
        }

        if (amount <= 0) return;















        let wasAlive = target.hp > 0;







        target.hp -= amount;







        if(target.hp < 0) target.hp = 0;

        // Calamity Raid Boss Phase Transition Check
        if (target.isRaidBoss || target.raidId) {
            if (target.phase === 1 && target.hp <= target.maxHp * 0.66) {
                triggerRaidPhaseTransition(target, 2);
            } else if (target.phase === 2 && target.hp <= target.maxHp * 0.33) {
                triggerRaidPhaseTransition(target, 3);
            }
        }

        // Titan 4pc barrier check on direct damage to wearer
        if (targetHero && typeof hasHeroSetBonus === 'function' && hasHeroSetBonus(targetHero, 'titans_bulwark', 4)) {
            let heroMaxHp = (computeHeroStats(targetHero) || {}).maxHp || 100;
            if (target.hp > 0 && target.hp <= heroMaxHp * 0.25 && !targetHero.livingBastionBarrierUsed) {
                targetHero.livingBastionBarrierUsed = true;
                let barrierVal = Math.round(heroMaxHp * 0.50);
                applyStatus(target, 'divine_barrier', 99, barrierVal);
                logMsg(`✨ Living Bastion activated! ${targetHero.name} gained a Divine Barrier (${barrierVal} HP)!`, "#ffd700");
                floatText(target.id, `BARRIER +${barrierVal}`, "#ffd700");
            }
        }















        // Death's Guillotine Execution Check (Reaper of Shadows Passive)







        isAttackerPlayer = (attacker && (attacker.isPlayer || attacker.id === 'battle-player' || attacker === player));















        // Blood Chalice Relic Lifesteal







        if (isAttackerPlayer && !target.isPlayer && player.spire && player.spire.equippedRelic === 'blood_chalice' && amount > 0) {







            let chaliceHeal = Math.max(1, Math.floor(amount * 0.10));







            let pEnt = getPlayerCombatEntity();







            pEnt.hp = Math.min(pStats.maxHp, pEnt.hp + chaliceHeal);







            logMsg(`🩸 Blood Chalice restored ${chaliceHeal} HP to Hero!`, "#ef4444");







            floatText('battle-player', `+${chaliceHeal} HP`, "#55ff55");







            renderBattlefield();







        }















        if (isAttackerPlayer && playerHasPassive('deaths_guillotine') && !target.isPlayer && wasAlive && target.hp > 0 && target.hp <= target.maxHp * 0.25) {







            target.hp = 0;







            logMsg(`☠️ Death's Guillotine triggered! Instantly executed ${target.name}!`, "#a855f7");







            floatText(target.id, "EXECUTED!", "#a855f7");







        }















        // Hourglass Chronomancer Fatal Blow Rewind Check & Undying Wrath







        if (isTargetPlayer && target.hp <= 0 && wasAlive) {







            const isMainTarget = target.id === 'battle-player' || target.heroId === 'hero_main' || target === player || (target.hero && target.hero.isMain);







            let targetHero = target.hero || (player.roster && player.roster.find(h => h.id === target.heroId)) || (isMainTarget ? (player.roster && player.roster.find(h => h.isMain)) : null);















            if (isMainTarget && player.spire && player.spire.equippedRelic === 'hourglass_chronomancer' && !spireRun.hourglassUsed) {







                spireRun.hourglassUsed = true;







                let restoredHp = Math.max(1, Math.round(pStats.maxHp * 0.30));







                target.hp = restoredHp;







                pStats.hp = restoredHp;







                if (player.baseStats) player.baseStats.hp = restoredHp;







                logMsg("⌛ Chronomancer's Hourglass rewinds time! Fatal blow avoided!", "#38bdf8");







                floatText('battle-player', "REWIND!", "#38bdf8");







            } else if (!battleState.divineAegisUsed && (isMainTarget || targetHero)) {
                let livingParty = (typeof getLivingPartyHeroes === 'function') ? getLivingPartyHeroes() : [];
                let aegisHero = livingParty.find(h => typeof heroHasPassive === 'function' && heroHasPassive(h, 'divine_aegis'));
                if (aegisHero) {
                    battleState.divineAegisUsed = true;
                    target.hp = 1;
                    if (isMainTarget) {
                        pStats.hp = 1;
                        if (player.baseStats) player.baseStats.hp = 1;
                    } else if (targetHero) {
                        targetHero.hp = 1;
                        if (targetHero.baseStats) targetHero.baseStats.hp = 1;
                    }
                    let tStats = (typeof computeHeroStats === 'function') ? computeHeroStats(targetHero || player) : { maxHp: 100 };
                    let barrierVal = Math.round((tStats.maxHp || 100) * 0.50);
                    applyStatus(target, 'divine_barrier', 99, barrierVal);
                    target.barrier = barrierVal;
                    logMsg(`🕊️ DIVINE AEGIS! ${aegisHero.name} miraculously shields ${target.name} from death! (1 HP + ${barrierVal} Barrier)`, "#ffd700");
                    floatText(target.id, "DIVINE AEGIS!", "#ffd700");
                } else if (heroHasPassive(targetHero || player, 'undying_wrath') && !target.undyingWrathUsed && !battleState.undyingWrathUsed) {
                    if (isMainTarget) battleState.undyingWrathUsed = true;
                    target.undyingWrathUsed = true;
                    target.hp = 1;
                    if (isMainTarget) {
                        pStats.hp = 1;
                        if (player.baseStats) player.baseStats.hp = 1;
                        target.atk = Math.round(target.atk * 1.5);
                    } else if (targetHero) {
                        targetHero.hp = 1;
                        if (targetHero.baseStats) targetHero.baseStats.hp = 1;
                    }
                    applyStatus(target, 'berserk', 3);
                    logMsg(`⚔️ UNDYING WRATH! ${target.name} defies death, surviving with 1 HP and entering Berserk (+50% ATK)!`, "#ef4444");
                    floatText(target.id, "UNDYING WRATH!", "#ef4444");
                } else if (heroHasPassive(targetHero || player, 'phylactery_ward') && !target.phylacteryUsed && !(targetHero && targetHero.phylacteryUsed)) {
                    if (isMainTarget) battleState.phylacteryUsed = true;
                    target.phylacteryUsed = true;
                    if (targetHero) targetHero.phylacteryUsed = true;
                    target.hp = 1;
                    if (isMainTarget) {
                        pStats.hp = 1;
                        if (player.baseStats) player.baseStats.hp = 1;
                    } else if (targetHero) {
                        targetHero.hp = 1;
                        if (targetHero.baseStats) targetHero.baseStats.hp = 1;
                    }
                    applyStatus(target, 'phylactery_stasis', 2);
                    target.inPhylactery = true;
                    if (targetHero) targetHero.inPhylactery = true;
                    logMsg(`⚰️ PHYLACTERY WARD! ${target.name}'s soul enters stasis, cheating death!`, "#8b5cf6");
                    floatText(target.id, "PHYLACTERY STASIS", "#8b5cf6");
                }
            } else if ((isMainTarget || targetHero) && typeof heroHasPassive === 'function' && heroHasPassive(targetHero || player, 'phylactery_ward') && !target.phylacteryUsed && !(targetHero && targetHero.phylacteryUsed)) {
                if (isMainTarget) battleState.phylacteryUsed = true;
                target.phylacteryUsed = true;
                if (targetHero) targetHero.phylacteryUsed = true;
                target.hp = 1;
                if (isMainTarget) {
                    pStats.hp = 1;
                    if (player.baseStats) player.baseStats.hp = 1;
                } else if (targetHero) {
                    targetHero.hp = 1;
                    if (targetHero.baseStats) targetHero.baseStats.hp = 1;
                }
                applyStatus(target, 'phylactery_stasis', 2);
                target.inPhylactery = true;
                if (targetHero) targetHero.inPhylactery = true;
                logMsg(`⚰️ PHYLACTERY WARD! ${target.name}'s soul enters stasis, cheating death!`, "#8b5cf6");
                floatText(target.id, "PHYLACTERY STASIS", "#8b5cf6");
            } else if (heroHasPassive(targetHero || player, 'undying_wrath') && !target.undyingWrathUsed && !battleState.undyingWrathUsed) {







                if (isMainTarget) battleState.undyingWrathUsed = true;







                target.undyingWrathUsed = true;







                target.hp = 1;







                if (isMainTarget) {







                    pStats.hp = 1;







                    if (player.baseStats) player.baseStats.hp = 1;







                    target.atk = Math.round(target.atk * 1.5);







                } else if (targetHero) {







                    targetHero.hp = 1;







                    if (targetHero.baseStats) targetHero.baseStats.hp = 1;







                }







                applyStatus(target, 'berserk', 3);







                logMsg(`💥 Undying Wrath activated! ${target.name} survived fatal hit with 1 HP and gained Berserk!`, "#ef4444");







                floatText(target.id, "UNDYING WRATH!", "#ef4444");







            }







        }







        







        logMsg(`${target.name} takes ${amount} damage.`);







        applyHitFlash(target.id);







        const elemColors = {







            Fire: '#f97316',







            Water: '#38bdf8',







            Wind: '#4ade80',







            Earth: '#ca8a04',







            Light: '#fde047',







            Dark: '#c084fc',







            Physical: '#ff4444'







        };







        const hitColor = elemColors[element] || '#ff4444';







        floatText(target.id, `-${amount}`, hitColor, isCrit);







        if (isCrit) screenShake('medium');







        animateAction(target.id, 'anim-shake');















        // 6. Counter Stance Retaliation







        if (hasStatus(target, 'counter_stance') && element === ELEMENTS.Physical && attacker && attacker.hp > 0 && target.hp > 0) {







            let counterDmg = Math.max(1, Math.floor(target.atk * 1.0));







            logMsg(`${target.name} immediately retaliates with Counter Stance!`, "#f97316");







            floatText(target.id, "COUNTER!", "#f97316");







            applyDamage(attacker, counterDmg, ELEMENTS.Physical);







        }
        // 7. Sacred Retribution (Grand Justiciar Apex passive)
        // 40% chance when any party ally is damaged by an enemy to counter-attack with 120% MATK Holy Smite
        let isTargetHeroOrPlayer = isTargetPlayer || target.hero || (target.id && target.id.startsWith('battle-hero-'));
        let isAttackerEnemy = attacker && (attacker.isEnemy || (attacker.index !== undefined) || (battleState && battleState.enemies && battleState.enemies.includes(attacker)));
        if (isTargetHeroOrPlayer && isAttackerEnemy && attacker.hp > 0 && amount > 0 && !(battleState && battleState._inSacredRetribution)) {
            let livingParty = (typeof getLivingPartyHeroes === 'function') ? getLivingPartyHeroes() : [];
            let retributionHero = livingParty.find(h => typeof heroHasPassive === 'function' && heroHasPassive(h, 'sacred_retribution'));
            if (retributionHero && (Math.random() < 0.40 || (typeof window !== 'undefined' && window.__forceSacredRetribution))) {
                if (battleState) battleState._inSacredRetribution = true;
                let gjStats = computeHeroStats(retributionHero);
                let gjMatk = retributionHero.isMain ? pStats.matk : gjStats.matk;
                let smiteDmg = Math.max(1, Math.round(gjMatk * 1.20));
                logMsg(`⚖️ Sacred Retribution! ${retributionHero.name} counters ${attacker.name} with Holy Smite for ${smiteDmg} damage!`, "#ffd700");
                let gjEnt = (typeof getHeroCombatEntity === 'function') ? getHeroCombatEntity(retributionHero) : null;
                if (gjEnt) floatText(gjEnt.id, "SACRED RETRIBUTION!", "#ffd700");
                applyDamage(attacker, smiteDmg, ELEMENTS.Light, gjEnt);
                if (battleState) battleState._inSacredRetribution = false;
            }
        }
        // Death's Dominion: 15% of all damage dealt by Lich King heals living party members
        if (amount > 0 && attacker && attacker !== target && !attacker._inVampiricHeal) {
            let attackerHero = attacker.hero || (player.roster && player.roster.find(h => h.id === attacker.heroId || (h.isMain && (attacker.isPlayer || attacker.id === 'battle-player'))));
            if (attackerHero && typeof heroHasPassive === 'function' && heroHasPassive(attackerHero, 'death_dominion')) {
                attacker._inVampiricHeal = true;
                let vHeal = Math.max(1, Math.round(amount * 0.15));
                let livingParty = (typeof getLivingPartyHeroes === 'function') ? getLivingPartyHeroes() : [];
                livingParty.forEach(h => {
                    let ent = getHeroCombatEntity(h);
                    let s = computeHeroStats(h);
                    let mHp = h.isMain ? pStats.maxHp : (s.maxHp || 100);
                    let cHp = h.isMain ? pStats.hp : (h.hp !== undefined ? h.hp : (h.baseStats?.hp || mHp));
                    let newHp = Math.min(mHp, cHp + vHeal);
                    if (h.isMain) {
                        player.baseStats.hp = newHp;
                        pStats.hp = newHp;
                    } else {
                        h.hp = newHp;
                        if (h.baseStats) h.baseStats.hp = newHp;
                    }
                    if (ent) {
                        ent.hp = newHp;
                        floatText(ent.id, `+${vHeal}`, "#c084fc");
                    }
                });
                logMsg(`💀 Death's Dominion: Vampiric feast healed all party members for ${vHeal} HP!`, "#c084fc");
                attacker._inVampiricHeal = false;
            }
        }







        







        if(target.hp <= 0 && wasAlive) {







            if (!target.isPlayer) {







                // Soul Harvest: Gain 1 Soul Remnant when an enemy dies (max 5)
                if (battleState) {
                    let livingParty = (typeof getLivingPartyHeroes === 'function') ? getLivingPartyHeroes() : [];
                    let hasNecro = livingParty.some(h => typeof heroHasPassive === 'function' && (heroHasPassive(h, 'soul_harvest') || (h.classId && h.classId.includes('necromancer'))));
                    if (hasNecro) {
                        battleState.soulRemnants = Math.min(5, (battleState.soulRemnants || 0) + 1);
                        logMsg(`💀 Soul Harvest: Reaped a soul remnant from ${target.name}! (${battleState.soulRemnants}/5 Remnants)`, "#c084fc");
                    }
                }
                if (!player.bestiary) player.bestiary = {};







                player.bestiary[target.name] = (player.bestiary[target.name] || 0) + 1;







                if (battleState && (battleState.inspectedEnemyIndex === target.index || (battleState.enemies && battleState.enemies[battleState.inspectedEnemyIndex] === target))) {







                    if (typeof closeEnemyInspector === 'function') closeEnemyInspector();







                }







                playSFX('enemy_death');















                if (target.isBoss) {







                    if (target.name === 'Elder Treant' || target.name === 'Ancient Treant') {







                        player.defeatedArea1Boss = true;







                    }







                    if (target.name === 'Void Guardian') {







                        player.defeatedArea5Boss = true;







                    }







                }















                // Tavern Bounty Progress Hook







                if (player.bounties && Array.isArray(player.bounties.active)) {







                    player.bounties.active.forEach(b => {







                        if (b.targetName === target.name && b.currentCount < b.targetCount) {







                            b.currentCount++;







                            if (b.currentCount >= b.targetCount && !b.completed) {







                                b.completed = true;







                                showToast(`📜 Bounty Complete: ${b.title}! Return to Tavern to claim rewards.`, 'quest');







                                playSFX('quest_claim');







                            }







                        }







                    });







                }















                // Midas Touch Keystone: Defeating an enemy with a basic attack or critical hit grants bonus Gold equal to 10% of their Max HP







                if (isAttackerPlayer && player.skillTree && player.skillTree.midasTouch > 0 && (element === ELEMENTS.Physical || isCrit)) {







                    let bonusGold = Math.max(1, Math.floor(target.maxHp * 0.10));







                    player.gold = (player.gold || 0) + bonusGold;







                    updateHeader();







                    logMsg(`🪙 Midas Touch! Gained +${bonusGold} bonus Gold from defeating ${target.name}!`, "#ffd700");







                    floatText((attacker && attacker.id) ? attacker.id : 'battle-player', `+${bonusGold}G Midas`, "#ffd700");







                }







            }







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















    let activeSkillCategory = 'all';















    function showSkillsMenu() {
        openBattleSkills();
    }
    window.showSkillsMenu = showSkillsMenu;

    function openBattleSkills() {







        document.getElementById('battle-commands').classList.add('sub-menu-active');







        const content = document.getElementById('sub-menu-content');







        







        content.innerHTML = `







            <div style="display:flex; gap:4px; margin-bottom:8px; flex-shrink:0;">







                <button class="btn cat-btn ${activeSkillCategory==='all'?'active':''}" style="flex:1; padding:4px 2px; font-size:11px;" onclick="filterBattleSkills('all')">All</button>







                <button class="btn cat-btn ${activeSkillCategory==='offense'?'active':''}" style="flex:1; padding:4px 2px; font-size:11px;" onclick="filterBattleSkills('offense')">⚔️ Offense</button>







                <button class="btn cat-btn ${activeSkillCategory==='defense'?'active':''}" style="flex:1; padding:4px 2px; font-size:11px;" onclick="filterBattleSkills('defense')">🛡️ Defense</button>







                <button class="btn cat-btn ${activeSkillCategory==='utility'?'active':''}" style="flex:1; padding:4px 2px; font-size:11px;" onclick="filterBattleSkills('utility')">✨ Utility</button>







            </div>







            <div id="skills-items-container" class="skills-grid-container"></div>







        `;







        renderSkillButtons(activeSkillCategory);







    }















    function filterBattleSkills(category) {







        activeSkillCategory = category;







        const catBtns = document.querySelectorAll('#sub-menu-content .cat-btn');







        catBtns.forEach(btn => {







            let isMatch = false;







            if (category === 'all' && btn.innerText.includes('All')) isMatch = true;







            else if (category === 'offense' && btn.innerText.includes('Offense')) isMatch = true;







            else if (category === 'defense' && btn.innerText.includes('Defense')) isMatch = true;







            else if (category === 'utility' && btn.innerText.includes('Utility')) isMatch = true;







            if (isMatch) btn.classList.add('active');







            else btn.classList.remove('active');







        });







        renderSkillButtons(category);







    }















    function renderSkillButtons(category) {







        const listEl = document.getElementById('skills-items-container');







        if (!listEl) return;







        







        let html = '';







        let hasSkills = false;







        







        const actingHero = (battleState && battleState.activeHero) || (player.roster && player.roster.find(h => h.id === 'hero_main')) || player.roster[0];







        const isMain = actingHero.isMain || actingHero.id === 'hero_main';







        const heroSkills = isMain ? player.skills : (actingHero.skills || (actingHero.classId === 'mage' ? ['Fireball', 'Heal'] : (actingHero.classId === 'rogue' ? ['Quick Slash', 'Smoke Screen'] : ['Power Strike', 'Cleave'])));







        const heroStats = computeHeroStats(actingHero);







        const curMp = isMain ? pStats.mp : (actingHero.mp !== undefined ? actingHero.mp : (actingHero.baseStats?.mp || heroStats.maxMp));















        heroSkills.forEach(skillName => {







            const skill = SKILLS_DB[skillName];







            if (!skill) return;







            







            let matchesCategory = false;
            if (category === 'all') {
                matchesCategory = true;
            } else if (category === 'offense') {
                matchesCategory = (skill.category === 'offense');
            } else if (category === 'defense') {
                matchesCategory = (skill.category === 'defense' || skill.category === 'heal' || skill.type === 'buff');
            } else if (category === 'utility') {
                matchesCategory = (skill.category === 'utility' || skill.category === 'summon' || skill.category === 'buff' || skill.category === 'defense' || skill.category === 'heal' || skill.type === 'support' || skill.type === 'buff');
            }
            if (!matchesCategory) return;







            







            hasSkills = true;







            const cost = getSkillCost(skill);







            const canCast = curMp >= cost;







            const catIcon = skill.category === 'offense' ? '⚔️' : (skill.category === 'defense' ? '🛡️' : '✨');







            const targetDesc = skill.target === 'enemy_all' ? 'All Foes' : (skill.target === 'ally_single' || skill.target === 'self' ? 'Self' : 'Single');







            







            const elemIcons = {
                'Fire': '🔥', 'Water': '💧', 'Wind': '⚡', 'Earth': '🪨',
                'Light': '✨', 'Dark': '💀', 'Physical': '⚔️'
            };
            const eIcon = elemIcons[skill.element] || '⚔️';
            let powerText = '';
            if (skill.type === 'heal') powerText = `❤️ Heal ${skill.power || ''}`;
            else if (skill.power) powerText = `⚔️ x${skill.power}`;
            else powerText = `✨ ${skill.type || 'Spell'}`;

            html += `<button class="btn skill-card-tactile" ${canCast ? '' : 'disabled'} onclick="selectSkill('${skillName}')">
                        <div class="skill-card-header">
                            <span class="skill-card-name" title="${skill.name}"><b>${skill.name}</b></span>
                            <span class="skill-mp-pill ${canCast ? '' : 'mp-insufficient'}">${cost} MP</span>
                        </div>
                        <div class="skill-card-meta">
                            <span class="skill-elem-badge skill-elem-${skill.element || 'Physical'}">${eIcon} ${skill.element || 'Physical'}</span>
                            <span class="skill-power-pill">${powerText}</span>
                            <span class="skill-target-pill">${targetDesc}</span>
                        </div>
                     </button>`;







        });







        







        if (!hasSkills) {







            html = '<p style="color:#aaa; text-align:center; padding:10px; font-size:12px;">No skills in this category.</p>';







        }







        







        listEl.innerHTML = html;







    }















    function selectSkill(skillName) {







        const skill = SKILLS_DB[skillName];







        if(!skill) return;















        const actingHero = (battleState && battleState.activeHero) || (player.roster && player.roster.find(h => h.id === 'hero_main')) || player.roster[0];







        const isMain = actingHero.isMain || actingHero.id === 'hero_main';







        let playerEnt = getHeroCombatEntity(actingHero);















        if(skill.target === 'ally_single' || skill.target === 'self' || skill.target === 'all_allies') {







            if (hasStatus(playerEnt, 'silence') && (skill.type === 'magic' || skill.type === 'heal')) {







                logMsg(`${actingHero.name} is Silenced and cannot cast spells!`, "#94a3b8");







                floatText(playerEnt.id, "SILENCED", "#94a3b8");







                return;







            }







            let cost = getSkillCost(skill);







            if (isMain) {







                player.baseStats.mp = Math.max(0, player.baseStats.mp - cost);







                pStats.mp = player.baseStats.mp;







            } else {







                actingHero.mp = Math.max(0, (actingHero.mp !== undefined ? actingHero.mp : computeHeroStats(actingHero).maxMp) - cost);







            }















            const heroStats = computeHeroStats(actingHero);







            const actingMaxHp = isMain ? pStats.maxHp : heroStats.maxHp;







            const curActingHp = isMain ? pStats.hp : (actingHero.hp !== undefined ? actingHero.hp : (actingHero.baseStats?.hp || heroStats.maxHp));















            if (skill.name === 'Beast Roar') {
                const livingHeroes = (battleState && battleState.party) 
                    ? battleState.party.filter(h => (h.isMain ? pStats.hp > 0 : (h.hp !== undefined ? h.hp > 0 : (h.baseStats?.hp > 0))))
                    : (typeof getLivingPartyHeroes === 'function' ? getLivingPartyHeroes() : [actingHero]);
                livingHeroes.forEach(h => {
                    let ent = getHeroCombatEntity(h);
                    applyStatus(ent, 'beast_roar', 3);
                    floatText(ent.id, "BEAST ROAR", "#10b981");
                });
                logMsg(`${actingHero.name} unleashes a ferocious Beast Roar! All allies gained +20% ATK and +15 SPD for 3 turns!`, "#10b981");
            } else if (skill.name === 'Battle Cry') {







                applyStatus(playerEnt, 'haste', 3);







                applyStatus(playerEnt, 'battle_cry', 3);







                logMsg(`${actingHero.name} roars with Battle Cry! Gained Haste (+30% SPD) and +20% ATK for 3 turns!`, "#f59e0b");







                floatText(playerEnt.id, "BATTLE CRY", "#f59e0b");







            } else if (skill.name === 'Holy Light') {
                let actingMatk = isMain ? pStats.matk : heroStats.matk;
                let heal = Math.round(actingMatk * 1.80) + (skill.power || 0);
                if (typeof getHeroHealShieldPotency === 'function') {
                    heal = Math.round(heal * getHeroHealShieldPotency(actingHero));
                }
                const livingHeroes = (battleState && battleState.party) 
                    ? battleState.party.filter(h => (h.isMain ? pStats.hp > 0 : (h.hp !== undefined ? h.hp > 0 : (h.baseStats?.hp > 0))))
                    : (typeof getLivingPartyHeroes === 'function' ? getLivingPartyHeroes() : [actingHero]);
                let targetH = actingHero;
                let lowestRatio = 2;
                livingHeroes.forEach(h => {
                    let s = computeHeroStats(h);
                    let mHp = h.isMain ? pStats.maxHp : (s.maxHp || 100);
                    let cHp = h.isMain ? pStats.hp : (h.hp !== undefined ? h.hp : (h.baseStats?.hp || mHp));
                    let ratio = cHp / mHp;
                    if (ratio < lowestRatio) {
                        lowestRatio = ratio;
                        targetH = h;
                    }
                });
                let tEnt = getHeroCombatEntity(targetH);
                let tStats = computeHeroStats(targetH);
                let tMaxHp = targetH.isMain ? pStats.maxHp : (tStats.maxHp || 100);
                let tCurHp = targetH.isMain ? pStats.hp : (targetH.hp !== undefined ? targetH.hp : (targetH.baseStats?.hp || tMaxHp));
                if (hasStatus(tEnt, 'burn')) heal = Math.floor(heal * 0.7);
                let decayDmg = 0;
                if (hasStatus(tEnt, 'decay')) {
                    decayDmg = Math.floor(heal * 0.25);
                    heal = Math.max(0, heal - decayDmg);
                    logMsg(`${targetH.name}'s Decay corrupted healing into ${decayDmg} damage!`, "#a855f7");
                }
                let netHeal = Math.max(0, heal - decayDmg);
                let excessHeal = Math.max(0, (tCurHp + netHeal) - tMaxHp);
                let newHp = Math.min(tMaxHp, tCurHp + netHeal);
                if (targetH.isMain) {
                    player.baseStats.hp = newHp;
                    pStats.hp = newHp;
                    tEnt.hp = newHp;
                } else {
                    targetH.hp = newHp;
                    if (targetH.baseStats) targetH.baseStats.hp = newHp;
                    tEnt.hp = newHp;
                }
                logMsg(`${actingHero.name} casts Holy Light on ${targetH.name}! Restored ${netHeal} HP.`, "#55ff55");
                floatText(tEnt.id, `+${netHeal}`, "#55ff55");
                // Overheal converted to Divine Barrier (up to 30% Max HP)
                let maxBarrier = Math.round(tMaxHp * 0.30);
                let currentBarrier = (tEnt.statuses && tEnt.statuses.divine_barrier && tEnt.statuses.divine_barrier.value) || 0;
                let barrierToAdd = Math.min(excessHeal, Math.max(0, maxBarrier - currentBarrier));
                if (barrierToAdd > 0) {
                    applyStatus(tEnt, 'divine_barrier', 3, currentBarrier + barrierToAdd);
                    logMsg(`✨ Holy Light converted ${barrierToAdd} overhealing into Divine Barrier for ${targetH.name}!`, "#ffd700");
                    floatText(tEnt.id, `+${barrierToAdd} Barrier`, "#ffd700");
                }
            } else if (skill.name === 'Purify') {
                const livingHeroes = (battleState && battleState.party) 
                    ? battleState.party.filter(h => (h.isMain ? pStats.hp > 0 : (h.hp !== undefined ? h.hp > 0 : (h.baseStats?.hp > 0))))
                    : (typeof getLivingPartyHeroes === 'function' ? getLivingPartyHeroes() : [actingHero]);
                let targetH = livingHeroes.find(h => {
                    let ent = getHeroCombatEntity(h);
                    if (!ent || !ent.statuses) return false;
                    return Object.keys(ent.statuses).length > 0;
                }) || actingHero;
                let tEnt = getHeroCombatEntity(targetH);
                let tStats = computeHeroStats(targetH);
                let tMaxHp = targetH.isMain ? pStats.maxHp : (tStats.maxHp || 100);
                const ailmentsToCleanse = ['burn', 'poison', 'freeze', 'silence', 'stun', 'decay', 'blind', 'bleed', 'slow'];
                if (tEnt.statuses) {
                    ailmentsToCleanse.forEach(ail => {
                        delete tEnt.statuses[ail];
                    });
                }
                let shieldVal = Math.round(tMaxHp * 0.15);
                applyStatus(tEnt, 'divine_barrier', 3, shieldVal);
                logMsg(`${actingHero.name} casts Purify on ${targetH.name}! Cleansed negative ailments and granted a ${shieldVal} HP Divine Barrier!`, "#38bdf8");
                floatText(tEnt.id, `PURIFIED (+${shieldVal} Shield)`, "#38bdf8");
            } else if (skill.name === 'Prayer of Sanctuary') {
                let actingMatk = isMain ? pStats.matk : heroStats.matk;
                let baseHeal = Math.round(actingMatk * 1.30) + (skill.power || 0);
                if (typeof getHeroHealShieldPotency === 'function') {
                    baseHeal = Math.round(baseHeal * getHeroHealShieldPotency(actingHero));
                }
                const livingHeroes = (battleState && battleState.party) 
                    ? battleState.party.filter(h => (h.isMain ? pStats.hp > 0 : (h.hp !== undefined ? h.hp > 0 : (h.baseStats?.hp > 0))))
                    : (typeof getLivingPartyHeroes === 'function' ? getLivingPartyHeroes() : [actingHero]);
                livingHeroes.forEach(h => {
                    let ent = getHeroCombatEntity(h);
                    let s = computeHeroStats(h);
                    let mHp = h.isMain ? pStats.maxHp : (s.maxHp || 100);
                    let cHp = h.isMain ? pStats.hp : (h.hp !== undefined ? h.hp : (h.baseStats?.hp || mHp));
                    let heal = baseHeal;
                    if (hasStatus(ent, 'burn')) heal = Math.floor(heal * 0.7);
                    let newHp = Math.min(mHp, cHp + heal);
                    if (h.isMain) {
                        player.baseStats.hp = newHp;
                        pStats.hp = newHp;
                    } else {
                        h.hp = newHp;
                        if (h.baseStats) h.baseStats.hp = newHp;
                    }
                    ent.hp = newHp;
                    // Remove 1 debuff
                    if (ent.statuses) {
                        for (let sId in ent.statuses) {
                            let sDef = (typeof STATUS_TYPES_DB !== 'undefined') && STATUS_TYPES_DB[sId];
                            if (sDef && (sDef.type === 'dot' || sDef.type === 'disable' || sDef.type === 'debuff' || sDef.type === 'ailment')) {
                                delete ent.statuses[sId];
                                break;
                            }
                        }
                    }
                    applyStatus(ent, 'sanctuary_protection', 2);
                    floatText(ent.id, `+${heal} SANCTUARY`, "#ffd700");
                });
                logMsg(`${actingHero.name} casts Prayer of Sanctuary! Healed all allies for ${baseHeal} HP, cleansed 1 debuff, and granted Sanctuary Protection (+15% DEF/MDEF for 2t)!`, "#ffd700");
            } else if (skill.name === 'Raise Skeleton') {
                if (!battleState.minions) battleState.minions = [];
                let maxMinions = heroHasPassive(actingHero, 'cataclysmic_reanimation') ? 3 : 2;
                let activeMinions = battleState.minions.filter(m => m.hp > 0);
                if (activeMinions.length >= maxMinions) {
                    let oldest = activeMinions[0];
                    applyDamage(oldest, 99999, ELEMENTS.Dark, playerEnt);
                }
                let minionHp = Math.round(actingMaxHp * 0.35);
                if (heroHasPassive(actingHero, 'undead_vanguard')) minionHp = Math.round(minionHp * 1.30);
                let minionAtk = Math.round((isMain ? pStats.matk : heroStats.matk) * 0.70);
                let minionDef = Math.round((isMain ? pStats.def : heroStats.def) * 0.80);
                let minion = {
                    id: 'minion_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
                    name: 'Skeletal Vanguard',
                    isMinion: true,
                    hp: minionHp,
                    maxHp: minionHp,
                    atk: minionAtk,
                    def: minionDef,
                    row: 'front',
                    summonerId: actingHero.id,
                    statuses: {}
                };
                battleState.minions.push(minion);
                logMsg(`💀 ${actingHero.name} raises a Skeletal Vanguard (${minionHp} HP, ${minionAtk} ATK, ${minionDef} DEF) to hold the Frontline!`, "#c084fc");
                floatText(playerEnt.id, "SUMMON SKELETON", "#c084fc");
            } else if (skill.name === 'Legion Vanguard') {
                if (!battleState.minions) battleState.minions = [];
                let maxMinions = heroHasPassive(actingHero, 'cataclysmic_reanimation') ? 3 : 2;
                for (let i = 0; i < 2; i++) {
                    let activeMinions = battleState.minions.filter(m => m.hp > 0);
                    if (activeMinions.length >= maxMinions) {
                        let oldest = activeMinions[0];
                        applyDamage(oldest, 99999, ELEMENTS.Dark, playerEnt);
                    }
                    let minionHp = Math.round(actingMaxHp * 0.35);
                    if (heroHasPassive(actingHero, 'undead_vanguard')) minionHp = Math.round(minionHp * 1.30);
                    let minionAtk = Math.round((isMain ? pStats.matk : heroStats.matk) * 0.70);
                    let minionDef = Math.round((isMain ? pStats.def : heroStats.def) * 0.80);
                    let minion = {
                        id: 'minion_' + Date.now() + '_' + i + '_' + Math.floor(Math.random() * 10000),
                        name: 'Skeletal Vanguard',
                        isMinion: true,
                        hp: minionHp,
                        maxHp: minionHp,
                        atk: minionAtk,
                        def: minionDef,
                        row: 'front',
                        summonerId: actingHero.id,
                        statuses: {}
                    };
                    let shieldVal = Math.round(minionHp * 0.20);
                    applyStatus(minion, 'bone_barrier', 3, shieldVal);
                    battleState.minions.push(minion);
                }
                logMsg(`💀 ${actingHero.name} commands Legion Vanguard! Summoned 2 armored Skeletal Vanguards with Bone Shields!`, "#c084fc");
                floatText(playerEnt.id, "LEGION VANGUARD", "#c084fc");
            } else if (skill.name === 'Bone Armor') {
                const livingHeroes = (battleState && battleState.party) 
                    ? battleState.party.filter(h => (h.isMain ? pStats.hp > 0 : (h.hp !== undefined ? h.hp > 0 : (h.baseStats?.hp > 0))))
                    : (typeof getLivingPartyHeroes === 'function' ? getLivingPartyHeroes() : [actingHero]);
                let targetH = actingHero;
                let lowestRatio = 2;
                livingHeroes.forEach(h => {
                    let s = computeHeroStats(h);
                    let mHp = h.isMain ? pStats.maxHp : (s.maxHp || 100);
                    let cHp = h.isMain ? pStats.hp : (h.hp !== undefined ? h.hp : (h.baseStats?.hp || mHp));
                    let ratio = cHp / mHp;
                    if (ratio < lowestRatio) {
                        lowestRatio = ratio;
                        targetH = h;
                    }
                });
                let tEnt = getHeroCombatEntity(targetH);
                let barrierVal = Math.round(actingMaxHp * 0.35);
                applyStatus(tEnt, 'bone_armor', 3, barrierVal);
                if (tEnt.statuses && tEnt.statuses.bone_armor) {
                    tEnt.statuses.bone_armor.casterMatk = isMain ? pStats.matk : heroStats.matk;
                }
                logMsg(`🦴 ${actingHero.name} encases ${targetH.name} in Bone Armor (${barrierVal} Barrier)!`, "#cbd5e1");
                floatText(tEnt.id, `BONE ARMOR (+${barrierVal})`, "#cbd5e1");
            } else if (skill.name === 'Divine Intervention') {
                const livingHeroes = (battleState && battleState.party) 
                    ? battleState.party.filter(h => (h.isMain ? pStats.hp > 0 : (h.hp !== undefined ? h.hp > 0 : (h.baseStats?.hp > 0))))
                    : (typeof getLivingPartyHeroes === 'function' ? getLivingPartyHeroes() : [actingHero]);
                let targetH = actingHero;
                let lowestRatio = 2;
                livingHeroes.forEach(h => {
                    let s = computeHeroStats(h);
                    let mHp = h.isMain ? pStats.maxHp : (s.maxHp || 100);
                    let cHp = h.isMain ? pStats.hp : (h.hp !== undefined ? h.hp : (h.baseStats?.hp || mHp));
                    let ratio = cHp / mHp;
                    if (ratio < lowestRatio) {
                        lowestRatio = ratio;
                        targetH = h;
                    }
                });
                let tEnt = getHeroCombatEntity(targetH);
                let tStats = computeHeroStats(targetH);
                let tMaxHp = targetH.isMain ? pStats.maxHp : (tStats.maxHp || 100);
                let barrierVal = Math.round(tMaxHp * 0.40);
                if (typeof getHeroHealShieldPotency === 'function') {
                    barrierVal = Math.round(barrierVal * getHeroHealShieldPotency(actingHero));
                }
                applyStatus(tEnt, 'divine_barrier', 3, barrierVal);
                let regenVal = Math.round(tMaxHp * 0.15);
                applyStatus(tEnt, 'regeneration', 3, regenVal);
                logMsg(`🕊️ Divine Intervention! ${actingHero.name} bestows a ${barrierVal} HP Divine Barrier and Regeneration upon ${targetH.name}!`, "#ffd700");
                floatText(tEnt.id, `DIVINE INTERVENTION (+${barrierVal} Shield)`, "#ffd700");
            } else if (skill.name === 'Shield of Faith') {







                if(playerEnt.statuses) {







                    for(let sId in playerEnt.statuses) {







                        let def = (typeof STATUS_TYPES_DB !== 'undefined') && STATUS_TYPES_DB[sId];







                        if(def && (def.type === 'dot' || def.type === 'disable' || def.type === 'debuff' || def.type === 'ailment')) {







                            delete playerEnt.statuses[sId];







                        }







                    }







                }







                let shieldVal = Math.floor(actingMaxHp * 0.20);







                applyStatus(playerEnt, 'divine_barrier', 3, shieldVal);







                logMsg(`${actingHero.name} casts Shield of Faith! Cleansed all debuffs and gained ${shieldVal} HP Divine Barrier!`, "#ffd700");







                floatText(playerEnt.id, `+${shieldVal} Shield`, '#ffd700');







            } else if (skill.name === 'Blade Dance') {







                applyStatus(playerEnt, 'counter_stance', 3);







                logMsg(`${actingHero.name} enters Blade Dance counter-stance for 3 turns!`, "#38bdf8");







                floatText(playerEnt.id, "COUNTER STANCE", "#38bdf8");







            } else {







                let actingMatk = isMain ? pStats.matk : heroStats.matk;







                let heal = skill.power + Math.floor(actingMatk / 2);







                if (hasStatus(playerEnt, 'burn')) heal = Math.floor(heal * 0.7);







                







                let decayDmg = 0;







                if (hasStatus(playerEnt, 'decay')) {







                    decayDmg = Math.floor(heal * 0.25);







                    heal = Math.max(0, heal - decayDmg);







                    logMsg(`${actingHero.name}'s Decay corrupted healing into ${decayDmg} damage!`, "#a855f7");







                }







                // Hallowed Seraphim 2pc: +35% Healing & Shielding Potency
                if (typeof getHeroHealShieldPotency === 'function') {
                    heal = Math.round(heal * getHeroHealShieldPotency(actingHero));
                }

                let prevHp = curActingHp;







                let netHeal = Math.max(0, heal - decayDmg);







                let excessHeal = Math.max(0, (prevHp + netHeal) - actingMaxHp);















                if (isMain) {







                    player.baseStats.hp = Math.min(pStats.maxHp, pStats.hp + netHeal);







                    pStats.hp = player.baseStats.hp;







                    playerEnt.hp = pStats.hp;







                } else {







                    playerEnt.hp = Math.min(actingMaxHp, curActingHp + netHeal);







                }







                logMsg(`${actingHero.name} casts ${skill.name}! Restored ${heal} HP.`, "#55ff55");







                floatText(playerEnt.id, `+${heal}`, '#55ff55');















                // Overcharged Aegis Keystone: Excess healing converts into Divine Barrier up to 20% Max HP







                // Hallowed Seraphim 4pc (Grace of the Dawn): Overhealing converts into Divine Barrier up to 30% Max HP
                if (typeof hasHeroSetBonus === 'function' && (hasHeroSetBonus(actingHero, 'hallowed_seraphim', 4) || hasHeroSetBonus(player, 'hallowed_seraphim', 4)) && excessHeal > 0) {
                    let maxBarrier = Math.round(actingMaxHp * 0.30);
                    let currentBarrier = (playerEnt.statuses && playerEnt.statuses.divine_barrier && playerEnt.statuses.divine_barrier.value) || 0;
                    let barrierToAdd = Math.min(excessHeal, Math.max(0, maxBarrier - currentBarrier));
                    if (barrierToAdd > 0) {
                        applyStatus(playerEnt, 'divine_barrier', 3, currentBarrier + barrierToAdd);
                        logMsg(`✨ Grace of the Dawn converted ${barrierToAdd} overhealing into Divine Barrier!`, "#ffd700");
                        floatText(playerEnt.id, `+${barrierToAdd} Barrier`, "#ffd700");
                    }
                }

                // Hallowed Seraphim 4pc: Support skills grant Haste (+15 SPD) to all party members for 2 turns
                if (typeof hasHeroSetBonus === 'function' && hasHeroSetBonus(actingHero, 'hallowed_seraphim', 4)) {
                    let living = (typeof getLivingPartyHeroes === 'function') ? getLivingPartyHeroes() : [];
                    living.forEach(h => {
                        applyStatus(getHeroCombatEntity(h), 'haste', 2);
                    });
                    logMsg(`🌟 Grace of the Dawn granted Haste (+15 SPD) to all party members for 2 turns!`, "#fbbf24");
                }

                if (player.skillTree && player.skillTree.overchargedAegis > 0 && excessHeal > 0) {







                    let maxBarrier = Math.floor(actingMaxHp * 0.20);







                    let currentBarrier = (playerEnt.statuses && playerEnt.statuses.divine_barrier && playerEnt.statuses.divine_barrier.value) || 0;







                    let barrierToAdd = Math.min(excessHeal, Math.max(0, maxBarrier - currentBarrier));







                    if (barrierToAdd > 0) {







                        applyStatus(playerEnt, 'divine_barrier', 3, currentBarrier + barrierToAdd);







                        logMsg(`✨ Overcharged Aegis converted ${barrierToAdd} excess healing into Divine Barrier!`, "#ffd700");







                        floatText(playerEnt.id, `+${barrierToAdd} Barrier`, "#ffd700");







                    }







                }















                // Tactical Buffs







                if (skill.name === 'Heal') {







                    applyStatus(playerEnt, 'regeneration', 3);







                } else if (skill.name === 'Recovery') {







                    let shieldVal = Math.floor(actingMaxHp * 0.15);







                    applyStatus(playerEnt, 'divine_barrier', 3, shieldVal);







                }







            }















            renderBattlefield();







            closeSubMenu();







            document.querySelectorAll('#cmd-main .btn').forEach(b => b.disabled = true);







            if (isMain) triggerRegen();







            processStatusesEndTurn(playerEnt);







            setCombatTimeout(processNextTurn, 1000);







        } else if (skill.target === 'enemy_all') {







            closeSubMenu();







            executePlayerSkill(skill, null);







        } else {







            const livingEnemies = (battleState && battleState.enemies) ? battleState.enemies.filter(e => e && e.hp > 0) : [];







            if (livingEnemies.length === 1) {







                closeSubMenu();







                executePlayerSkill(skill, livingEnemies[0]);







                return;







            }







            logMsg(`Select a target for ${skill.name}.`);
            const promptEl = document.getElementById('target-prompt');
            if (promptEl) {
                promptEl.innerHTML = `
                    <div style="font-size: 14px; font-weight: bold; color: #38bdf8; margin-bottom: 6px;">
                        Casting: <b>${skill.name}</b>
                    </div>
                    <div style="font-size: 12px; color: #94a3b8; margin-bottom: 10px;">
                        Click an enemy above to strike
                    </div>
                    <button class="btn btn-cmd-slate" style="padding: 4px 14px; font-size: 12px;" onclick="cancelTargeting()">Cancel</button>
                `;
            }
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















    /* =========================================================================







       COMBAT FLOW & QUICK POTION ENGINE







       ========================================================================= */















    function getBestAvailableHealingPotion() {







        if (!player || !player.inventory) return null;







        const consumables = player.inventory.consumables || player.inventory;







        







        const maxHp = (typeof pStats !== 'undefined' && pStats.maxHp) ? pStats.maxHp : (player.baseStats ? player.baseStats.maxHp : 100);







        const curHp = (typeof pStats !== 'undefined' && pStats.hp !== undefined) ? pStats.hp : (player.baseStats ? player.baseStats.hp : 100);







        const missingHp = maxHp - curHp;







        const hpPct = maxHp > 0 ? (curHp / maxHp) : 1;















        const hasItem = (name) => (typeof consumables[name] === 'number' && consumables[name] > 0);







        const getQty = (name) => consumables[name] || 0;















        // If missing HP >= 250 and has Mega-Potion (or Max Potion if < 30% HP): prioritize Mega-Potion / Max Potion.







        if (missingHp >= 250) {







            if (hpPct < 0.3 && hasItem('Max Potion')) return { name: 'Max Potion', qty: getQty('Max Potion') };







            if (hasItem('Mega-Potion')) return { name: 'Mega-Potion', qty: getQty('Mega-Potion') };







            if (hasItem('Max Potion')) return { name: 'Max Potion', qty: getQty('Max Potion') };







        }















        // Else if missing HP >= 120 and has Hi-Potion: prioritize Hi-Potion.







        if (missingHp >= 120 && hasItem('Hi-Potion')) {







            return { name: 'Hi-Potion', qty: getQty('Hi-Potion') };







        }















        // Else if has Potion: use Potion.







        if (hasItem('Potion')) {







            return { name: 'Potion', qty: getQty('Potion') };







        }















        // Fallback: pick the highest tier healing potion with count > 0.







        const tierOrder = ['Max Potion', 'Mega-Potion', 'Hi-Potion', 'Potion'];







        for (let name of tierOrder) {







            if (hasItem(name)) {







                return { name: name, qty: getQty(name) };







            }







        }















        return null;







    }















    function updateQuickPotionButton() {







        const btn = document.getElementById('btn-quick-potion');







        if (!btn) return;







        const potion = getBestAvailableHealingPotion();







        const isCombat = Boolean(battleState && battleState.active);







        const canAct = !isCombat || Boolean(battleState.isPlayerTurn);







        if (potion && potion.qty > 0) {







            btn.innerText = `🧪 Heal: ${potion.name} (x${potion.qty})`;







            btn.disabled = !canAct;







            if (potion.qty <= 2) {







                btn.style.color = '#fbbf24';







                btn.style.borderColor = '#fbbf24';







            } else {







                btn.style.color = '#4ade80';







                btn.style.borderColor = '#4ade80';







            }







        } else {







            btn.innerText = `🧪 No Potions (x0)`;







            btn.disabled = true;







            btn.style.color = '#94a3b8';







            btn.style.borderColor = '#475569';







        }







    }















    function useQuickPotion() {







        if (!battleState || !battleState.active) return;







        if (!battleState.isPlayerTurn) {







            showToast('Not Your Turn', 'Wait for the current action to finish!', 'warning');







            return;







        }







        const potion = getBestAvailableHealingPotion();







        if (!potion || potion.qty <= 0) {







            showToast('No Potions', 'No healing potions available in inventory!', 'info');







            updateQuickPotionButton();







            return;







        }







        battleState.isPlayerTurn = false;







        useItemInBattle(potion.name);







        updateQuickPotionButton();







    }















    function repeatBattle() {







        clearAllCombatTimers();







        checkLevelUp();







        const cfg = (battleState && battleState.lastBattleConfig) ? battleState.lastBattleConfig : { enemyCount: 1, isBoss: false };







        startBattle(cfg.enemyCount, cfg.isBoss);







    }















    function useItemInBattle(itemName) {







        if (battleState) battleState.isPlayerTurn = false;







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







            floatText('battle-player', `+${healVal} HP`, '#4ade80', false, 'heal');







        } else if(item.effect === 'heal_hp_full') {







            player.baseStats.hp = pStats.maxHp;







            pStats.hp = pStats.maxHp;







            logMsg(`Hero uses ${itemName}! HP fully restored!`, "#55ff55");







            floatText('battle-player', "FULL HP", '#4ade80', false, 'heal');







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







            floatText('battle-player', `+${healHp} HP`, '#4ade80', false, 'heal');







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







        if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();







        document.querySelectorAll('#cmd-main .btn').forEach(b => b.disabled = true);







        triggerRegen();







        setCombatTimeout(processNextTurn, 1000);







    }















    function closeSubMenu() {







        document.getElementById('battle-commands').classList.remove('sub-menu-active');







    }















    function attemptFlee() {







        if (battleState) battleState.isPlayerTurn = false;







        document.querySelectorAll('#cmd-main .btn').forEach(b => b.disabled = true);







        if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();







        if(Math.random() > 0.5) {







            logMsg("Fled from battle successfully!");







            clearAllCombatTimers();







            battleState.active = false; 







            battleState.currentActor = null;







            if (typeof closeEnemyInspector === 'function') closeEnemyInspector();







            const ribbonTrack = document.getElementById('turn-order-track');







            if (ribbonTrack) ribbonTrack.innerHTML = '';







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















        if (enemy.isRaidBoss) {
            if (battleState.channelingUltimate) {
                battleState.channelingUltimate.turnsRemaining--;
                logMsg(`⚠️ ${enemy.name} is channeling ${battleState.channelingUltimate.skillName}! (${battleState.channelingUltimate.turnsRemaining} turns remaining)`, "#f43f5e");
                floatText(enemy.id, `Channeling (${battleState.channelingUltimate.turnsRemaining}T)`, "#f43f5e");

                if (battleState.channelingUltimate.turnsRemaining <= 0) {
                    if (enemy.raidId === 'raid_chronos' || (enemy.name && enemy.name.includes('Chronos'))) {
                        logMsg("🌌 SINGULARITY EVENT UNLEASHED! The cosmos collapses into void!", "#a855f7");
                        screenShake('heavy', 800);
                        if (typeof getLivingPartyHeroes === 'function') {
                            getLivingPartyHeroes().forEach(h => {
                                applyDamage(getHeroCombatEntity(h), 99999, 'Dark', enemy);
                            });
                        }
                    } else if (enemy.raidId === 'raid_ignis' || (enemy.name && enemy.name.includes('Ignis'))) {
                        logMsg("🔥 SUPERNOVA CATACLYSM UNLEASHED! A wave of stellar fire sweeps the field!", "#f97316");
                        screenShake('heavy', 600);
                        if (typeof getLivingPartyHeroes === 'function') {
                            getLivingPartyHeroes().forEach(h => {
                                applyDamage(getHeroCombatEntity(h), 800, 'Fire', enemy);
                                applyStatus(getHeroCombatEntity(h), 'burn', 3);
                            });
                        }
                    }
                    battleState.channelingUltimate = null;
                }
                processStatusesEndTurn(enemy);
                renderBattlefield();
                setCombatTimeout(processNextTurn, 1000);
                return;
            }

            // Ignis Phase 3 Environmental Arena Burn
            if (enemy.phase === 3 && (enemy.raidId === 'raid_ignis' || (enemy.name && enemy.name.includes('Ignis')))) {
                if (typeof getLivingPartyHeroes === 'function') {
                    let living = getLivingPartyHeroes();
                    living.forEach(h => {
                        let bDmg = Math.max(1, Math.round(computeHeroStats(h).maxHp * 0.10));
                        applyDamage(getHeroCombatEntity(h), bDmg, 'Fire', enemy);
                    });
                    logMsg("🔥 The arena burns with Supernova heat! All heroes take 10% burn damage!", "#f97316");
                }
            }
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







            floatText(enemy.id, `🩸 -${bDmg} Bleed`, "#ef4444", false, 'dot');







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















            const livingParty = getLivingPartyHeroes();







            const targetHero = (typeof selectPartyTarget === 'function') ? selectPartyTarget(livingParty) : livingParty[0];







            if (!targetHero) {







                loseBattle();







                return;







            }







            const targetEnt = getHeroCombatEntity(targetHero);







            const targetStats = computeHeroStats(targetHero);















            if (action === 'heal') {







                let healAmount = Math.floor(enemy.matk * 2);







                if (hasStatus(enemy, 'burn')) healAmount = Math.floor(healAmount * 0.7);







                let decayDmg = 0;







                if (hasStatus(enemy, 'decay')) {







                    decayDmg = Math.floor(healAmount * 0.25);







                    healAmount = Math.max(0, healAmount - decayDmg);







                    logMsg(`${enemy.name}'s Decay corrupted healing into ${decayDmg} damage!`, "#a855f7");







                    floatText(enemy.id, `Corrupted! -${decayDmg}`, "#a855f7", false, 'dot');







                }







                enemy.hp = Math.min(enemy.maxHp, enemy.hp + healAmount - decayDmg);







                logMsg(`${enemy.name} casts Heal! Restores ${healAmount} HP.`, "#55ff55");







                floatText(enemy.id, `+${healAmount} HP`, "#4ade80", false, 'heal');







            } 







            else if (action === 'magic') {







                let targetMdef = targetEnt.mdef;







                let dmg = Math.max(1, Math.floor(enemy.matk * 1.5) - targetMdef);







                logMsg(`${enemy.name} casts a ${enemy.element} spell at ${targetHero.name}!`);







                applyDamage(targetEnt, dmg, enemy.element, enemy);







            } 







            else {







                let rawDmg = Math.floor(enemy.atk * 1.5);







                let heroDef = targetEnt.def;







                let mitigation = 20 / (20 + heroDef);







                let dmg = Math.max(1, Math.floor(rawDmg * mitigation));







                targetEnt.lastDefMitigated = Math.max(0, rawDmg - dmg);















                logMsg(`${enemy.name} attacks ${targetHero.name}!`);







                applyDamage(targetEnt, dmg, ELEMENTS.Physical, enemy);







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















    let activeSanctumHeroId = 'hero_main';















    function selectSanctumHero(heroId) {







        activeSanctumHeroId = heroId;







        renderClassAdvancement();







    }







    window.selectSanctumHero = selectSanctumHero;















    function openClassSanctumForHero(heroId) {







        activeSanctumHeroId = heroId;







        closeAllModals();







        renderClassAdvancement();







        openModal('modal-class-advancement');







    }







    window.openClassSanctumForHero = openClassSanctumForHero;















    function renderClassAdvancement() {







        if (typeof syncMainHero === 'function') syncMainHero();







        const container = document.getElementById('class-advancement-content');







        if(!container) return;















        if (!player.roster || player.roster.length === 0) {







            if (typeof syncMainHero === 'function') syncMainHero();







        }















        const roster = player.roster || [{ id: 'hero_main', isMain: true, name: player.name || 'Hero', level: player.level || 1, classId: player.currentClass || 'warrior' }];















        // Validate activeSanctumHeroId







        let hero = roster.find(h => h.id === activeSanctumHeroId);







        if (!hero) {







            hero = roster.find(h => h.isMain) || roster[0];







            activeSanctumHeroId = hero.id;







        }















        const isMain = !!(hero.isMain || hero.id === 'hero_main');







        const heroLevel = isMain ? player.level : (hero.level || 1);







        const currentClassId = isMain ? (player.currentClass || hero.classId || 'warrior') : (hero.classId || 'warrior');







        const currentCls = (typeof CLASSES_DB !== 'undefined' && CLASSES_DB[currentClassId]) || (typeof CLASSES_DB !== 'undefined' && CLASSES_DB['warrior']) || { name: 'Warrior', tier: 1 };







        const tier = currentCls.tier || 1;







        const nextTier = tier + 1;







        const requiredLevel = nextTier === 1 ? 10 : (nextTier === 2 ? 25 : 50);















        // Render Hero Selector Ribbon







        const selectorContainer = document.getElementById('sanctum-hero-selector');







        if (selectorContainer) {







            let chipsHtml = roster.map(h => {

                const isSelected = h.id === activeSanctumHeroId;

                const hClsId = (h.isMain || h.id === 'hero_main') ? (player.currentClass || h.classId || 'warrior') : (h.classId || 'warrior');

                const hCls = (typeof CLASSES_DB !== 'undefined' && CLASSES_DB[hClsId]) || {};

                const hTier = hCls.tier || 1;

                const hLvl = (h.isMain || h.id === 'hero_main') ? player.level : (h.level || 1);

                const isReady = (hTier === 1 && hLvl >= 25) || (hTier === 2 && hLvl >= 50);

                const isLeader = !!(h.isMain || h.id === 'hero_main');

                const isInSquad = player.activeParty && player.activeParty.includes(h.id);

                const squadClass = isInSquad ? 'sanctum-chip-active-squad' : 'sanctum-chip-reserve';

                const squadTag = isInSquad ? '<span class="chip-squad-tag">⚔️ Squad</span>' : '<span class="chip-reserve-tag">💤 Reserve</span>';



                let icon = isLeader ? '👑' : ((h.classId === 'necromancer' || h.classId === 'dread_lich' || h.classId === 'bone_commander' || h.classId === 'lich_king_sovereign' || h.classId === 'lord_of_the_grave') ? '💀' : ((h.classId === 'cleric' || h.classId === 'high_priest' || h.classId === 'inquisitor' || h.classId === 'seraph_of_dawn' || h.classId === 'grand_justiciar') ? '🕊️' : (h.classId === 'mage' ? '🔮' : ((h.classId === 'ranger' || h.classId === 'beastmaster' || h.classId === 'deadeye_sniper' || h.classId === 'primal_apex_lord' || h.classId === 'celestial_sharpshooter') ? '🏹' : (h.classId === 'rogue' ? '🗡️' : '🛡️')))));

                return `

                    <button class="hero-selector-chip ${squadClass} ${isSelected ? 'active-hero-tab' : ''}" onclick="selectSanctumHero('${h.id}')">

                        <span>${icon}</span>

                        <span>${h.name.split(' ')[0]}</span>

                        <span class="chip-lvl">Lv.${hLvl}</span>

                        ${squadTag}

                        ${isReady ? '<span class="ready-dot" title="Ready to Evolve!">✨</span>' : ''}

                    </button>

                `;

            }).join('');



            selectorContainer.innerHTML = `<div class="sanctum-selector-track">${chipsHtml}</div>`;







        }















        let html = `







            <div style="background: rgba(30,30,40,0.8); border: 1px solid #444; border-radius: 8px; padding: 12px 16px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">







                <div>







                    <span style="font-size: 13px; color: #888;">Hero:</span> 







                    <span style="font-size: 16px; font-weight: bold; color: #f8fafc; margin-left: 4px;">${hero.name}</span>







                    <span style="font-size: 13px; color: #888; margin-left: 10px;">Current Path:</span> 







                    <span style="font-size: 16px; font-weight: bold; color: #a855f7; margin-left: 4px;">${currentCls.name}</span>







                    <span style="background: #374151; font-size: 11px; padding: 2px 6px; border-radius: 4px; margin-left: 8px; color: #cbd5e1;">Tier ${tier}</span>

                    ${(player.activeParty && player.activeParty.includes(hero.id))

                        ? `<span class="sanctum-status-active" style="margin-left: 8px;">⚔️ Active Combat Squad (${hero.row === 'front' ? 'Frontline' : 'Backline'})</span>`

                        : `<span class="sanctum-status-reserve" style="margin-left: 8px;">💤 Barracks Reserve</span>`

                    }







                </div>







                <div style="display: flex; gap: 12px; align-items: center;">







                    <div style="font-size: 13px; color: #cbd5e1;">







                        Hero Level: <span style="font-weight: bold; color: #ffd700;">${heroLevel}</span>







                    </div>







                    ${tier >= 2 ? `







                        <button class="btn-respec-main" onclick="respecHeroClass('${hero.id}')" title="Revert to base class for 5,000 Gold to select a different specialization branch">







                            🔄 Respec Path (5,000 Gold)







                        </button>







                    ` : ''}







                </div>







            </div>







        `;















        function renderClassCard(opt, isCurrent, canAct, btnText, btnOnClick, disabled = false) {
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

            let skillsInfo = '';
            if (opt.skills && opt.skills.length > 0) {
                skillsInfo = `
                    <div style="margin-top: 8px; font-size: 11px; color: #94a3b8;">
                        <b style="color: #cbd5e1;">Signature Skills:</b> ${opt.skills.join(', ')}
                    </div>
                `;
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

            let icon = opt.id === 'warrior' ? '🛡️' : (opt.id === 'mage' ? '🔮' : (opt.id === 'rogue' ? '🗡️' : (opt.id === 'ranger' ? '🏹' : (opt.id === 'cleric' ? '🕊️' : (opt.id === 'necromancer' ? '💀' : '⚔️')))));

            return `
                <div style="background: rgba(20,20,30,0.85); border: 1px solid ${isCurrent ? '#10b981' : (canAct ? '#a855f7' : '#444')}; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <h3 style="margin: 0; color: #ffd700; font-size: 17px; display:flex; align-items:center; gap:6px;">
                                <span>${icon}</span> <span>${opt.name}</span>
                            </h3>
                            <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: #374151; color: #cbd5e1;">Tier ${opt.tier}</span>
                        </div>
                        <p style="font-size: 12px; color: #94a3b8; margin: 0 0 10px 0; min-height: 32px;">${opt.desc || ''}</p>
                        
                        <div style="font-size: 12px; margin-bottom: 6px; color: #aaa;">Stat Modifiers:</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; margin-bottom: 6px;">
                            ${modSpans.join('')}
                        </div>

                        ${skillsInfo}
                        ${passiveHtml}
                    </div>

                    <div style="margin-top: 15px;">
                        <button class="btn" style="width: 100%; background: ${isCurrent ? '#1e293b' : (canAct ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : '#374151')}; color: ${isCurrent ? '#10b981' : (canAct ? '#ffffff' : '#888')}; font-weight: bold; padding: 8px; border: 1px solid ${isCurrent ? '#10b981' : (canAct ? '#f472b6' : '#555')};" 
                                ${disabled ? 'disabled' : ''} 
                                onclick="${btnOnClick}">
                            ${btnText}
                        </button>
                    </div>
                </div>
            `;
        }

        if (tier >= 3) {
            html += `
                <div style="text-align: center; padding: 40px 20px; background: rgba(16,185,129,0.1); border: 1px solid #10b981; border-radius: 8px;">
                    <div style="font-size: 32px; margin-bottom: 10px;">👑</div>
                    <h3 style="color: #10b981; margin: 0 0 10px 0;">Apex Evolution Mastered</h3>
                    <p style="color: #cbd5e1; font-size: 14px; max-width: 500px; margin: 0 auto 15px auto;">${hero.name} has achieved the pinnacle of power as a <b>${currentCls.name}</b>. All apex multipliers and passives are fully realized.</p>
                    <button class="btn-respec-main" onclick="respecHeroClass('${hero.id}')">
                        🔄 Respec Specialization Path (5,000 Gold)
                    </button>
                </div>
            `;
            container.innerHTML = html;
            return;
        }

        if (tier <= 1) {
            // Render Tier 1 Base Class Selection Grid
            const t1Keys = ['warrior', 'mage', 'rogue', 'ranger', 'cleric', 'necromancer'];
            html += `
                <div style="margin-bottom: 25px;">
                    <div style="font-size: 15px; font-weight: bold; color: #38bdf8; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                        <span>🛡️</span> <span>Tier 1 Base Classes (Choose or Switch Path)</span>
                    </div>
                    <div style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">
                        Any hero currently at Tier 1 can choose or switch between all 6 foundational disciplines. Switching base class cleanses old skills, grants signature starter skills, and unlocks specialized evolution branches.
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">
            `;

            for (let cId of t1Keys) {
                let opt = CLASSES_DB[cId];
                if (!opt) continue;
                let isCurrent = (cId === currentClassId);
                let isFree = (currentClassId === 'novice' || !hero.classSwitched);
                let cost = isFree ? 0 : 5000;
                let canAfford = cost === 0 || (player.gold || 0) >= cost;
                let btnText = isCurrent ? '✔️ Current Class' : (isFree ? '✨ Select Class (Free)' : `🔄 Switch Class (${cost}G)`);
                let btnOnClick = isCurrent ? '' : `switchHeroBaseClass('${hero.id}', '${cId}')`;
                let disabled = isCurrent || !canAfford;
                html += renderClassCard(opt, isCurrent, !isCurrent && canAfford, btnText, btnOnClick, disabled);
            }
            html += `</div></div>`;

            // If not novice, show Tier 2 Specializations
            if (currentClassId !== 'novice') {
                let branches = [];
                for (let cid in CLASSES_DB) {
                    let c = CLASSES_DB[cid];
                    if (c.tier === 2 && c.parent === currentClassId) {
                        branches.push(c);
                    }
                }

                html += `
                    <div style="margin-top: 25px;">
                        <div style="font-size: 15px; font-weight: bold; color: #a855f7; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                            <span>⚔️</span> <span>Tier 2 Specialization Branches (${currentCls.name})</span>
                        </div>
                `;

                if (heroLevel < 25) {
                    html += `
                        <div style="text-align: center; padding: 20px; background: rgba(239,68,68,0.08); border: 1px dashed #ef4444; border-radius: 8px; margin-bottom: 15px;">
                            <div style="font-size: 24px; margin-bottom: 4px;">🔒</div>
                            <h4 style="color: #ef4444; margin: 0 0 4px 0;">Specialization Locked</h4>
                            <p style="color: #cbd5e1; font-size: 13px; margin: 0;">Must reach <b>Level 25</b> to unlock Tier 2 Specialization Evolution.<br>(Current Progress: Level ${heroLevel} / 25)</p>
                        </div>
                        <div style="font-size: 13px; font-weight: bold; color: #888; margin-bottom: 10px; text-transform: uppercase;">Upcoming Choices at Level 25:</div>
                    `;
                } else {
                    html += `
                        <div style="font-size: 14px; color: #10b981; margin-bottom: 12px; font-weight: bold;">
                            ✨ Tier 2 Advancement Available! Choose ${hero.name}'s specialized path:
                        </div>
                    `;
                }

                html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">`;
                for (let opt of branches) {
                    let canEvolve = heroLevel >= 25;
                    let btnText = canEvolve ? `✨ Evolve to ${opt.name} (Free)` : `🔒 Requires Level 25 (${heroLevel}/25)`;
                    let btnOnClick = canEvolve ? `advanceHeroClass('${hero.id}', '${opt.id}')` : '';
                    html += renderClassCard(opt, false, canEvolve, btnText, btnOnClick, !canEvolve);
                }
                html += `</div></div>`;
            }
        } else if (tier === 2) {
            // Tier 2 hero: show Tier 3 Apex Evolution
            let apexOptions = [];
            for (let cid in CLASSES_DB) {
                let c = CLASSES_DB[cid];
                if (c.tier === 3 && c.parent === currentClassId) {
                    apexOptions.push(c);
                }
            }

            html += `
                <div style="margin-top: 10px;">
                    <div style="font-size: 15px; font-weight: bold; color: #f59e0b; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                        <span>👑</span> <span>Tier 3 Apex Evolution (${currentCls.name})</span>
                    </div>
            `;

            if (heroLevel < 50) {
                html += `
                    <div style="text-align: center; padding: 20px; background: rgba(239,68,68,0.08); border: 1px dashed #ef4444; border-radius: 8px; margin-bottom: 15px;">
                        <div style="font-size: 24px; margin-bottom: 4px;">🔒</div>
                        <h4 style="color: #ef4444; margin: 0 0 4px 0;">Apex Evolution Locked</h4>
                        <p style="color: #cbd5e1; font-size: 13px; margin: 0;">Must reach <b>Level 50</b> to unlock Tier 3 Apex Evolution.<br>(Current Progress: Level ${heroLevel} / 50)</p>
                    </div>
                    <div style="font-size: 13px; font-weight: bold; color: #888; margin-bottom: 10px; text-transform: uppercase;">Upcoming Apex Evolution at Level 50:</div>
                `;
            } else {
                html += `
                    <div style="font-size: 14px; color: #10b981; margin-bottom: 12px; font-weight: bold;">
                        ✨ Tier 3 Apex Evolution Available! Master ${hero.name}'s ultimate path:
                    </div>
                `;
            }

            html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">`;
            for (let opt of apexOptions) {
                let canEvolve = heroLevel >= 50;
                let btnText = canEvolve ? `👑 Master ${opt.name} (Free)` : `🔒 Requires Level 50 (${heroLevel}/50)`;
                let btnOnClick = canEvolve ? `advanceHeroClass('${hero.id}', '${opt.id}')` : '';
                html += renderClassCard(opt, false, canEvolve, btnText, btnOnClick, !canEvolve);
            }
            html += `</div></div>`;
        }

        container.innerHTML = html;
    }















    function heroHasPassive(heroOrEntity, passiveId) {
        if (!heroOrEntity) return false;
        let hero = heroOrEntity.hero || heroOrEntity;
        if (hero.isMain || hero.id === 'hero_main' || hero.id === 'battle-player' || hero === (typeof player !== 'undefined' ? player : null) || (hero.currentClass && !hero.classId)) {
            return (typeof playerHasPassive === 'function') ? playerHasPassive(passiveId) : false;
        }
        const classId = hero.classId || hero.currentClass;
        if (!classId || typeof CLASSES_DB === 'undefined' || !CLASSES_DB[classId]) return false;
        let curr = CLASSES_DB[classId];
        while (curr) {
            if (curr.passive === passiveId) return true;
            curr = curr.parent && CLASSES_DB[curr.parent];
        }
        return false;
    }















        function switchHeroBaseClass(heroId, targetClassId) {
        let hero = null;
        if (typeof heroId === 'object' && heroId !== null) {
            hero = heroId;
        } else if (player.roster) {
            hero = player.roster.find(h => h.id === heroId) || (heroId === 'hero_main' ? player.roster.find(h => h.isMain) : null);
        }
        if (!hero && heroId === 'hero_main') {
            if (typeof syncMainHero === 'function') syncMainHero();
            hero = player.roster.find(h => h.isMain);
        }
        if (!hero) return false;

        const targetCls = (typeof CLASSES_DB !== 'undefined') ? CLASSES_DB[targetClassId] : null;
        if (!targetCls || targetCls.tier !== 1) return false;
        if (hero.classId === targetClassId) return true;

        const isFree = (hero.classId === 'novice' || (hero.isMain && player.currentClass === 'novice') || !hero.classSwitched);
        const cost = isFree ? 0 : 5000;

        if (cost > 0 && (player.gold || 0) < cost) {
            if (typeof showToast === 'function') {
                showToast('Insufficient Gold', `Switching base class costs ${cost} Gold!`, 'warning', 4000);
            }
            return false;
        }

        if (cost > 0) {
            player.gold -= cost;
            if (typeof updateHeader === 'function') updateHeader();
        }

        hero.classSwitched = true;

        // Cleanse old class skills
        let oldClassId = hero.classId;
        let oldCls = (typeof CLASSES_DB !== 'undefined') ? CLASSES_DB[oldClassId] : null;
        let skillsToRemove = new Set();
        while (oldCls) {
            if (oldCls.skills && Array.isArray(oldCls.skills)) {
                oldCls.skills.forEach(s => skillsToRemove.add(s));
            }
            oldCls = oldCls.parent ? CLASSES_DB[oldCls.parent] : null;
        }

        if (hero.skills && Array.isArray(hero.skills)) {
            hero.skills = hero.skills.filter(s => !skillsToRemove.has(s));
        }
        if ((hero.isMain || hero.id === 'hero_main') && player.skills && Array.isArray(player.skills)) {
            player.skills = player.skills.filter(s => !skillsToRemove.has(s));
        }

        // Set new classId
        hero.classId = targetClassId;
        if (hero.isMain || hero.id === 'hero_main') {
            player.currentClass = targetClassId;
            if (typeof syncMainHero === 'function') syncMainHero();
        }

        // Add starter skills of new base class
        if (targetCls.skills && Array.isArray(targetCls.skills)) {
            if (!hero.skills) hero.skills = [];
            targetCls.skills.forEach(s => {
                if (!hero.skills.includes(s)) hero.skills.push(s);
                if ((hero.isMain || hero.id === 'hero_main') && player.skills && !player.skills.includes(s)) {
                    player.skills.push(s);
                }
            });
        }

        // Recalculate stats
        computeHeroStats(hero);
        if (hero.isMain || hero.id === 'hero_main') {
            if (typeof computeStats === 'function') computeStats();
            if (typeof updateHeader === 'function') updateHeader();
            if (typeof renderStats === 'function') renderStats();
        }

        if (typeof playSFX === 'function') playSFX('levelup');
        if (typeof showToast === 'function') {
            showToast('Class Switched', `${hero.name} is now a ${targetCls.name}!`, 'level', 3500);
        }

        if (typeof renderClassAdvancement === 'function') renderClassAdvancement();
        return true;
    }

    if (typeof window !== 'undefined') {
        window.switchHeroBaseClass = switchHeroBaseClass;
    }

function advanceHeroClass(heroId, classId) {
        const cls = (typeof CLASSES_DB !== 'undefined') ? CLASSES_DB[classId] : null;
        if (!cls) return false;
        if (cls.tier === 1) {
            return switchHeroBaseClass(heroId, classId);
        }















        let hero = null;







        if (typeof heroId === 'object' && heroId !== null) {







            hero = heroId;







        } else if (player.roster) {







            hero = player.roster.find(h => h.id === heroId) || (heroId === 'hero_main' ? player.roster.find(h => h.isMain) : null);







        }







        if (!hero && heroId === 'hero_main') {







            if (typeof syncMainHero === 'function') syncMainHero();







            hero = player.roster.find(h => h.isMain);







        }







        if (!hero) return false;















        const reqLevel = cls.tier === 2 ? 25 : (cls.tier === 3 ? 50 : 10);







        if ((hero.level || 1) < reqLevel) {







            if (typeof showToast === 'function') {







                showToast('Requirement Not Met', `Requires Level ${reqLevel} (Current: ${hero.level || 1})`, 'warning', 4000);







            }







            return false;







        }















        // Valid promotion







        hero.classId = classId;







        if (hero.isMain || hero.id === 'hero_main') {







            player.currentClass = classId;







            if (typeof syncMainHero === 'function') syncMainHero();







        }















        // Award signature class skills without duplicates







        let newSkills = [];







        let classSkills = (typeof getClassSkills === 'function') ? getClassSkills(classId) : (cls.skills || []);







        if (!hero.skills) hero.skills = [];







        classSkills.forEach(s => {







            if (!hero.skills.includes(s)) {







                hero.skills.push(s);







                newSkills.push(s);







            }







            if ((hero.isMain || hero.id === 'hero_main') && player.skills && !player.skills.includes(s)) {







                player.skills.push(s);







            }







        });















        // Recalculate stats







        if (hero.isMain || hero.id === 'hero_main') {







            if (typeof computeStats === 'function') computeStats();







            if (typeof updateHeader === 'function') updateHeader();







            if (typeof renderStats === 'function') renderStats();







        }







        computeHeroStats(hero);















        // Celebratory audio and toast







        if (typeof playSFX === 'function') playSFX('quest_claim');







        if (typeof showToast === 'function') {







            showToast('Class Evolution Achieved!', `${hero.name} evolved into a ${cls.name}!`, 'level', 5000);







            if (newSkills.length > 0) {







                setTimeout(() => {







                    showToast('Skills Unlocked!', 'Gained: ' + newSkills.join(', '), 'quest', 4000);







                }, 600);







            }







        }















        // Re-render UI







        if (typeof renderClassAdvancement === 'function') renderClassAdvancement();







        if (typeof renderBarracksUI === 'function') {







            if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');







            if (document.getElementById('tavern-content') && typeof tavernActiveTab !== 'undefined' && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');







        }







        if (typeof inspectedHeroId !== 'undefined' && inspectedHeroId === hero.id && typeof openHeroInspector === 'function') {







            openHeroInspector(hero.id);







        }















        return true;







    }







    window.advanceHeroClass = advanceHeroClass;















    function advanceClass(classId) {







        return advanceHeroClass('hero_main', classId);







    }







    window.advanceClass = advanceClass;















    function respecHeroClass(heroId, targetClassId) {
        let hero = null;
        if (typeof heroId === 'object' && heroId !== null) {
            hero = heroId;
        } else if (player.roster) {
            hero = player.roster.find(h => h.id === heroId) || (heroId === 'hero_main' ? player.roster.find(h => h.isMain) : null);
        }
        if (!hero && heroId === 'hero_main') {
            if (typeof syncMainHero === 'function') syncMainHero();
            hero = player.roster.find(h => h.isMain);
        }
        if (!hero) return false;

        const currentCls = (typeof CLASSES_DB !== 'undefined') ? CLASSES_DB[hero.classId] : null;
        if (!currentCls) return false;

        if (targetClassId && targetClassId !== hero.classId) {
            return switchHeroBaseClass(heroId, targetClassId);
        }







        if (!currentCls || (currentCls.tier || 0) < 2) {







            if (typeof showToast === 'function') {







                showToast('Cannot Respec', 'Hero has not chosen a specialization branch yet.', 'warning', 4000);







            }







            return false;







        }















        if ((player.gold || 0) < 5000) {







            if (typeof showToast === 'function') {







                showToast('Insufficient Gold', 'Respecing a hero specialization costs 5,000 Gold!', 'warning', 4000);







            }







            return false;







        }















        if (!window.__testHeadless && typeof window.confirm === 'function') {







            let ok = window.confirm(`Respec ${hero.name}'s specialization path for 5,000 Gold? All specialized skills will be reset and you will revert to your base class.`);







            if (!ok) return false;







        }















        // Deduct currency







        player.gold -= 5000;







        if (typeof updateHeader === 'function') updateHeader();















        // Find root base class (Tier 1)







        let rootClassId = hero.classId;







        while (CLASSES_DB[rootClassId] && CLASSES_DB[rootClassId].parent) {







            rootClassId = CLASSES_DB[rootClassId].parent;







        }















        // Cleanse specialized skills (tier >= 2)







        let specializedSkillsToRemove = new Set();







        let cur = CLASSES_DB[hero.classId];







        while (cur && cur.tier >= 2) {







            if (cur.skills && Array.isArray(cur.skills)) {







                cur.skills.forEach(s => specializedSkillsToRemove.add(s));







            }







            cur = cur.parent ? CLASSES_DB[cur.parent] : null;







        }















        if (hero.skills && Array.isArray(hero.skills)) {







            hero.skills = hero.skills.filter(s => !specializedSkillsToRemove.has(s));







        }







        if ((hero.isMain || hero.id === 'hero_main') && player.skills && Array.isArray(player.skills)) {







            player.skills = player.skills.filter(s => !specializedSkillsToRemove.has(s));







        }















        // Revert hero class







        hero.classId = rootClassId;







        if (hero.isMain || hero.id === 'hero_main') {







            player.currentClass = rootClassId;







            if (typeof syncMainHero === 'function') syncMainHero();







        }















        // Recalculate stats







        if (hero.isMain || hero.id === 'hero_main') {







            if (typeof computeStats === 'function') computeStats();







            if (typeof updateHeader === 'function') updateHeader();







            if (typeof renderStats === 'function') renderStats();







        }







        computeHeroStats(hero);















        if (typeof playSFX === 'function') playSFX('equip');







        if (typeof logMsg === 'function') {







            logMsg(`${hero.name} respec'd specialization back to ${CLASSES_DB[rootClassId].name} for 5,000 Gold!`, "#fbbf24");







        }







        if (typeof showToast === 'function') {







            showToast('Specialization Respec Complete', `${hero.name} reverted to ${CLASSES_DB[rootClassId].name}. Choose a new path!`, 'info', 4000);







        }















        // Re-render UI







        if (typeof renderClassAdvancement === 'function') renderClassAdvancement();







        if (typeof renderBarracksUI === 'function') {







            if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');







            if (document.getElementById('tavern-content') && typeof tavernActiveTab !== 'undefined' && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');







        }







        if (typeof inspectedHeroId !== 'undefined' && inspectedHeroId === hero.id && typeof openHeroInspector === 'function') {







            openHeroInspector(hero.id);







        }















        return true;







    }







    window.respecHeroClass = respecHeroClass;















    /* =========================================================================







       BATTLE RESOLUTION







       ========================================================================= */















    function winBattle() {







        clearAllCombatTimers();







        battleState.active = false;







        battleState.isPlayerTurn = false;







        battleState.currentActor = null;







        if (typeof closeEnemyInspector === 'function') closeEnemyInspector();







        const ribbonTrack = document.getElementById('turn-order-track');







        if (ribbonTrack) ribbonTrack.innerHTML = '';







        if(typeof updateSaveLoadButtons === 'function') updateSaveLoadButtons(false);







        playSFX('victory');

        // Calamity Raid Resolution: Consume 1 keystone and drop essences
        if (battleState && battleState.isRaid) {
            player.calamityKeys = Math.max(0, (player.calamityKeys || 1) - 1);
            const rId = battleState.raidId;
            const raid = (typeof RAIDS_DB !== 'undefined' && RAIDS_DB[rId]) || null;
            if (raid) {
                let count = Math.floor(Math.random() * 3) + 1; // 1 to 3 essences
                if (!player.materials) player.materials = {};
                player.materials[raid.essenceDrop] = (player.materials[raid.essenceDrop] || 0) + count;
                logMsg(`🏆 CALAMITY CONQUERED! Consumed 1 Keystone. Harvested ${count}x ${raid.essenceName}!`, "#f43f5e");
                if (typeof showToast === 'function') {
                    showToast('Calamity Conquered!', `Harvested ${count}x ${raid.essenceName}!`, 'achievement', 6000);
                }
            }
            player.calamityVictories = player.calamityVictories || {};
            player.calamityVictories[rId] = (player.calamityVictories[rId] || 0) + 1;
        }







        







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







                let kills = (player.bestiary && player.bestiary[e.name]) || 0;







                let reqGold = e.isBoss ? 25 : 100;







                let goldLootMult = (kills >= reqGold) ? 1.10 : 1.0;







                e.loot.forEach(l => {







                    if(Math.random() <= (l.chance * treasureSenseMod * goldLootMult)) {







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















        // Midas Crucible Relic Gold Bonus (+50%)







        if (player.spire && player.spire.equippedRelic === 'midas_crucible') {







            totalGold = Math.round(totalGold * 1.5);







            logMsg("💎 Midas Crucible: +50% Gold awarded!", "#fbbf24");







        }







        







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















        // Distribute Combat EXP to all active party members







        if (player.activeParty && Array.isArray(player.activeParty) && player.roster) {







            player.activeParty.forEach(heroId => {







                const h = player.roster.find(r => r.id === heroId);







                if (h && !h.isMain) {







                    h.exp = (h.exp || 0) + totalExp;







                    let reqExp = (h.level || 1) * 40;







                    let leveled = false;







                    while (h.exp >= reqExp && (h.level || 1) < 50) {







                        h.exp -= reqExp;







                        levelUpHero(h);







                        leveled = true;







                        reqExp = (h.level || 1) * 40;







                        logMsg(`★ ${h.name} leveled up to Level ${h.level}!`, "#55ff55");







                    }







                    if (leveled) {







                        showToast('Hero Leveled Up!', `${h.name} reached Level ${h.level}!`, 'level', 4000);







                    }







                }







            });







        }







        







        if(!player.questStats) player.questStats = { enemiesDefeated: 0, battlesWon: 0, bossesDefeated: 0 };







        player.questStats.battlesWon = (player.questStats.battlesWon || 0) + 1;















        // Award Companion Pet Bond EXP (+15 per victory)







        if (player.pets && Array.isArray(player.pets.active)) {







            player.pets.active.filter(Boolean).forEach(petId => {







                if (typeof addPetExp === 'function') addPetExp(petId, 15);







            });







        }







        







        // Zone Conquest & Progression Unlock







        let defeatedBoss = battleState.enemies.find(e => e.isBoss);







        if (defeatedBoss) {







            if (defeatedBoss.name === 'Elder Treant' || defeatedBoss.name === 'Ancient Treant') {







                player.defeatedArea1Boss = true;







            }







            if (defeatedBoss.name === 'Void Guardian') {







                player.defeatedArea5Boss = true;







            }







        }







        if(defeatedBoss && typeof AREAS_DB !== 'undefined') {







            for(let aId of getAllAreaKeys()) {







                let a = AREAS_DB[aId];







                if(a.boss && a.boss.name === defeatedBoss.name) {
                    if (!player.defeatedAreaBosses) player.defeatedAreaBosses = [];
                    if (!player.defeatedAreaBosses.includes(aId)) player.defeatedAreaBosses.push(aId);







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







            if (defeatedBoss.name === 'Chronos, The Void Sovereign' || (defeatedBoss.name && defeatedBoss.name.includes('Chronos'))) {







                player.activeTitle = 'Apex Paragon';







                logMsg("👑 CONGRATULATIONS! You have conquered Chronos and completed the Elemental Realms!", "#facc15");







                showToast('Realm Conquered!', '👑 CONGRATULATIONS! You have conquered Chronos and completed the Elemental Realms!', 'achievement', 9000);







            }







        }















        if(typeof checkAchievements === 'function') checkAchievements();







        







        updateHeader();







        







        // Infinite Spire Floor Victory Resolution







        if (spireRun && spireRun.active) {







            let floor = spireRun.currentFloor;







            let floorShards = Math.max(2, Math.floor(floor * 1.5));







            player.spire.astralShards += floorShards;







            spireRun.shardsEarned += floorShards;







            if (floor > player.spire.highestFloor) {







                player.spire.highestFloor = floor;







            }







            logMsg(`✨ Gained ${floorShards} Astral Shards from Floor ${floor}!`, "#c084fc");















            // Spire Milestone Pet Companion Unlocks







            if (typeof triggerSpireMilestones === 'function') triggerSpireMilestones(floor);















            // Boss Floor Relic Drop Check (every 5th floor)







            let droppedRelic = null;







            if (floor % 5 === 0 && typeof RELICS_DB !== 'undefined') {







                let unowned = Object.keys(RELICS_DB).filter(rId => !player.spire.relics.includes(rId));







                if (unowned.length > 0 && Math.random() < 0.50) {







                    let chosen = unowned[Math.floor(Math.random() * unowned.length)];







                    player.spire.relics.push(chosen);







                    droppedRelic = RELICS_DB[chosen];







                    showToast('Ancient Relic Found!', `Discovered ${droppedRelic.icon} ${droppedRelic.name}!`, 'quest', 6000);







                    logMsg(`🏆 ANCIENT RELIC DISCOVERED: ${droppedRelic.icon} ${droppedRelic.name}!`, "#ffd700");







                }







            }















            updateHeader();







            if (typeof renderSpireModal === 'function') renderSpireModal();















            setCombatTimeout(() => {







                checkLevelUp();







                showSpireVictoryModal(floor, floorShards, droppedRelic);







            }, 1500, true);







            return;







        }















        battleState.lastBattleConfig = {







            enemyCount: battleState.initialEnemyCount || 1,







            isBoss: battleState.isBossFight || false,







            areaId: (player && player.selectedArea) || 'area_1'







        };















        // Companion Pet Drop System







        if (typeof checkCompanionPetDrop === 'function') {







            checkCompanionPetDrop(battleState.lastBattleConfig.areaId, battleState.isBossFight || battleState.lastBattleConfig.isBoss);







        }















        const cmdEl = document.getElementById('battle-commands');







        if (cmdEl) cmdEl.classList.add('victory-mode-ui');







        const vActions = document.getElementById('battle-victory-actions');







        if (vActions) vActions.style.display = 'flex';















        const actionsHtml = `







            <div id="battle-victory-log-actions" style="display: flex; gap: 10px; justify-content: center; margin-top: 10px;">







                <button class="btn" style="padding: 10px 18px; font-size: 14px; font-weight: bold; color: #4ade80; border-color: #4ade80; background: rgba(74, 222, 128, 0.1);" onclick="repeatBattle()">⚔️ Hunt Again</button>







                <button class="btn" style="padding: 10px 18px; font-size: 14px; color: #cbd5e1;" onclick="checkLevelUp(); switchScreen('town');">🏠 Return to Town</button>







            </div>







        `;







        let logEl = document.getElementById('combat-log');







        if (logEl) {







            logEl.innerHTML += actionsHtml;







            logEl.scrollTop = logEl.scrollHeight;







        }















        setCombatTimeout(() => {







            if (!battleState.active) {







                checkLevelUp();







                switchScreen('town');







            }







        }, 10000, true); 







    }















    function loseBattle() {







        if (battleState) battleState.isPlayerTurn = false;







        // Ignis Phoenix Level 10 Apex Perk: Rebirth Flame







        if (player.pets && Array.isArray(player.pets.active) && player.pets.active.includes('ignis_phoenix')) {







            let phoenixLvl = (player.pets.levels && player.pets.levels['ignis_phoenix'] && player.pets.levels['ignis_phoenix'].level) || 1;







            if (phoenixLvl >= 10 && battleState && !battleState.phoenixRebirthUsed) {







                battleState.phoenixRebirthUsed = true;







                let reviveHp = Math.max(1, Math.round(pStats.maxHp * 0.30));







                player.baseStats.hp = reviveHp;







                pStats.hp = reviveHp;







                let pEnt = (typeof getPlayerCombatEntity === 'function') ? getPlayerCombatEntity() : null;







                if (pEnt) pEnt.hp = reviveHp;







                logMsg("🔥 Rebirth Flame: Ignis resurrects the Hero from the ashes!", "#ef4444");







                if (typeof floatText === 'function') floatText('battle-player', "🔥 REBIRTH!", "#ef4444");







                if (typeof screenShake === 'function') screenShake('heavy', 400);







                if (typeof playSFX === 'function') playSFX('victory');







                renderBattlefield();







                setCombatTimeout(processNextTurn, 1000);







                return;







            }







        }















        // Chronomancer's Hourglass safety rewind check







        if (player.spire && player.spire.equippedRelic === 'hourglass_chronomancer' && !spireRun.hourglassUsed) {







            spireRun.hourglassUsed = true;







            let restoredHp = Math.max(1, Math.round(pStats.maxHp * 0.30));







            player.baseStats.hp = restoredHp;







            pStats.hp = restoredHp;







            let pEnt = getPlayerCombatEntity();







            if (pEnt) pEnt.hp = restoredHp;







            logMsg("⌛ Chronomancer's Hourglass rewinds time! Fatal blow avoided!", "#38bdf8");







            floatText('battle-player', "REWIND!", "#38bdf8");







            renderBattlefield();







            return;







        }















        clearAllCombatTimers();







        battleState.active = false;







        battleState.currentActor = null;







        if (typeof closeEnemyInspector === 'function') closeEnemyInspector();







        const ribbonTrack = document.getElementById('turn-order-track');







        if (ribbonTrack) ribbonTrack.innerHTML = '';







        if(typeof updateSaveLoadButtons === 'function') updateSaveLoadButtons(false);







        logMsg("Hero was defeated...", "#ff0000");















        // Infinite Spire Defeat Handling (No gold penalty, restore full HP/MP)







        if (spireRun && spireRun.active) {







            let reachedFloor = spireRun.currentFloor;







            spireRun.active = false;







            setCombatTimeout(() => {







                showToast("Spire Defeat", `Defeated on Floor ${reachedFloor}. You keep all earned Shards and Relics!`, "info", 4000);







                player.baseStats.hp = pStats.maxHp;







                player.baseStats.mp = pStats.maxMp;







                pStats.hp = pStats.maxHp;







                pStats.mp = pStats.maxMp;







                updateHeader();







                switchScreen('town');







            }, 2000, true);







            return;







        }















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







    /* =========================================================================







       THE INFINITE SPIRE ENDLESS DUNGEON & ASTRAL ALTAR







       ========================================================================= */















    function getSpireCheckpoints() {







        let highest = (player && player.spire && player.spire.highestFloor) || 0;







        let checkpoints = [1];







        let candidate = 11;







        while (highest >= candidate - 1) {







            checkpoints.push(candidate);







            candidate += 10;







        }







        return checkpoints;







    }















    function enterTheSpire(startFloor) {







        let floor = startFloor || 1;







        let available = getSpireCheckpoints();







        if (!available.includes(floor)) floor = 1;







        







        spireRun = {







            active: true,







            currentFloor: floor,







            shardsEarned: 0,







            hourglassUsed: false







        };







        startSpireBattle(floor);







    }















    function startSpireBattle(floor) {







        if (typeof clearAllCombatTimers === 'function') clearAllCombatTimers();







        closeAllModals();







        switchScreen('battle');







        const speedBtn = document.getElementById('btn-combat-speed');







        if (speedBtn) speedBtn.innerText = `⚡ Speed: ${combatSpeed}x`;















        spireRun.active = true;







        spireRun.currentFloor = floor;







        spireRun.hourglassUsed = false;















        let isBossFloor = (floor % 5 === 0);







        let scale = 1 + (floor * 0.10);







        let floorLevel = Math.max(1, Math.floor(floor * 0.8));















        battleState = {







            active: true,







            initialEnemyCount: isBossFloor ? 1 : (floor >= 10 ? (Math.random() < 0.5 ? 2 : 1) : 1),







            enemies: [],







            turnQueue: [],







            targetingMode: null,







            log: [],







            playerStatuses: {},







            playerEntity: null







        };







        player.statuses = battleState.playerStatuses;















        // Custom Celestial Spire Arena Background







        if (typeof setupBattle === 'function') setupBattle('area_10');
        const arenaEl = document.getElementById('battle-arena');







        if (arenaEl) {







            arenaEl.style.background = isBossFloor 







                ? 'radial-gradient(circle at 50% 30%, #450a0a 0%, #1e1b4b 60%, #020617 100%)'







                : 'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0f172a 70%, #020617 100%)';







        }















        if (isBossFloor) {







            let bossTemplate;







            if (floor <= 5) bossTemplate = AREAS_DB.area_1.boss;







            else if (floor <= 10) bossTemplate = AREAS_DB.area_2.boss;







            else if (floor <= 15) bossTemplate = AREAS_DB.area_3.boss;







            else if (floor <= 20) bossTemplate = AREAS_DB.area_4.boss;







            else {







                const bossTemplates = [







                    AREAS_DB.area_1.boss,







                    AREAS_DB.area_2.boss,







                    AREAS_DB.area_3.boss,







                    AREAS_DB.area_4.boss,







                    AREAS_DB.area_5.boss







                ];







                let bIdx = (Math.floor(floor / 5) - 1) % bossTemplates.length;







                bossTemplate = bossTemplates[bIdx];







            }







            let template = bossTemplate;







            let bossHp = Math.round(template.hp * scale);







            battleState.enemies.push({







                index: 0,







                id: 'enemy_0',







                name: `[Spire Boss] ${template.name}`,







                level: Math.max(template.level, Math.floor(floor * 0.9)),







                element: template.element,







                hp: bossHp,







                maxHp: bossHp,







                atk: Math.round(template.atk * scale),







                def: Math.round(template.def * scale),







                matk: Math.round(template.matk * scale),







                mdef: Math.round(template.mdef * scale),







                spd: Math.round(template.spd * Math.min(2.0, 1 + (floor * 0.03))),







                exp: Math.round(template.exp * scale),







                gold: Math.round(template.gold * scale),







                ai: 'boss',







                isBoss: true,







                loot: template.loot,







                statuses: {}







            });







        } else {







            let areaKey = 'area_1';







            if (floor <= 5) areaKey = 'area_1';







            else if (floor <= 10) areaKey = 'area_2';







            else if (floor <= 15) areaKey = 'area_3';







            else if (floor <= 20) areaKey = 'area_4';







            else areaKey = 'area_5';















            let enemyPool = (AREAS_DB[areaKey] && AREAS_DB[areaKey].regularEnemies) ? AREAS_DB[areaKey].regularEnemies : ENEMIES_DB;







            if (enemyPool.length === 0) enemyPool = ENEMIES_DB;















            for (let i = 0; i < battleState.initialEnemyCount; i++) {







                let template = enemyPool[Math.floor(Math.random() * enemyPool.length)];







                let monHp = Math.round(template.hp * scale);







                battleState.enemies.push({







                    index: i,







                    id: 'enemy_' + i,







                    name: `${template.name} (F${floor})`,







                    level: floorLevel,







                    element: template.element,







                    hp: monHp,







                    maxHp: monHp,







                    atk: Math.round(template.atk * scale),







                    def: Math.round(template.def * scale),







                    matk: Math.round(template.matk * scale),







                    mdef: Math.round(template.mdef * scale),







                    spd: Math.round(template.spd * Math.min(2.0, 1 + (floor * 0.03))),







                    exp: Math.round(template.exp * scale),







                    gold: Math.round(template.gold * scale),







                    ai: template.ai,







                    isBoss: false,







                    loot: template.loot,







                    statuses: {}







                });







            }







        }















        let logContainer = document.getElementById('combat-log');







        logContainer.innerHTML = '';







        if (isBossFloor) {







            logMsg(`⚡ WARNING: You have reached Spire Boss Floor ${floor}!`, "#ef4444");







            logMsg(`⚔️ ${battleState.enemies[0].name} emerges from the astral vortex!`, "#f59e0b");







        } else {







            logMsg(`🌀 Entered The Infinite Spire — Floor ${floor}!`, "#38bdf8");







            logMsg(`Facing ${battleState.enemies.length} hostile astral entity(s).`, "#ffffff");







        }















        let pCombatEnt = getPlayerCombatEntity();







        pCombatEnt.statuses = battleState.playerStatuses;















        // Relic start-of-combat triggers







        if (player.spire && player.spire.equippedRelic === 'aegis_colossus') {







            let shieldVal = Math.round(pStats.maxHp * 0.25);







            applyStatus(pCombatEnt, 'divine_barrier', 99, shieldVal);







            logMsg(`🛡️ Aegis of the Colossus: Divine Barrier granted (${shieldVal} HP Shield)!`, "#ffd700");







        }















        // Class Passives start-of-combat triggers across all living heroes







        const spireLiving = (typeof getLivingPartyHeroes === 'function') ? getLivingPartyHeroes() : [];







        if (spireLiving.length === 0 && player.roster) spireLiving.push(player.roster.find(h => h.isMain) || player.roster[0]);







        spireLiving.forEach(h => {







            const hEnt = (typeof getHeroCombatEntity === 'function') ? getHeroCombatEntity(h) : pCombatEnt;







            const hStats = (typeof computeHeroStats === 'function') ? computeHeroStats(h) : pStats;







            if (heroHasPassive(h, 'aegis_ward')) {







                let shieldVal = Math.round(hStats.maxHp * 0.15);







                applyStatus(hEnt, 'divine_barrier', 99, shieldVal);







                logMsg(`🛡️ Aegis Ward: ${h.name || 'Hero'} granted Divine Barrier (${shieldVal} HP Shield)!`, "#ffd700");







            }







            if (heroHasPassive(h, 'phantom_mirage')) {







                applyStatus(hEnt, 'mirage', 99, 2);







                let stMap = (h.isMain || h.id === 'hero_main') ? battleState.playerStatuses : (h.statuses || {});







                if (stMap && stMap.mirage) {







                    stMap.mirage.stacks = 2;







                }







                logMsg(`🌀 Phantom Mirage: ${h.name || 'Hero'} granted 2 stacks of Mirage evasion!`, "#67e8f9");







            }







        });















        renderBattlefield();







        if (typeof updateSaveLoadButtons === 'function') updateSaveLoadButtons(true);







        startRound();







    }















    function ascendSpireFloor() {







        closeAllModals();







        let nextFloor = (spireRun && spireRun.currentFloor) ? spireRun.currentFloor + 1 : 1;







        startSpireBattle(nextFloor);







    }















    function exitSpireToTown() {







        let earned = (spireRun && spireRun.shardsEarned) || 0;







        let floor = (spireRun && spireRun.currentFloor) || 1;







        if (spireRun) spireRun.active = false;







        closeAllModals();







        player.baseStats.hp = pStats.maxHp;







        player.baseStats.mp = pStats.maxMp;







        pStats.hp = pStats.maxHp;







        pStats.mp = pStats.maxMp;







        updateHeader();







        switchScreen('town');







        showToast('Spire Run Complete', `Cashed out from Floor ${floor} with ${earned} Astral Shards!`, 'quest', 5000);







    }















    function showSpireVictoryModal(floor, shards, droppedRelic) {







        const container = document.getElementById('spire-victory-content');







        if (!container) return;















        let relicHtml = '';







        if (droppedRelic) {







            relicHtml = `







                <div style="margin-top:12px; padding:10px; background:rgba(255,215,0,0.1); border:1px solid #ffd700; border-radius:6px;">







                    <div style="font-size:13px; color:#ffd700; font-weight:bold;">🏆 ANCIENT RELIC DISCOVERED!</div>







                    <div style="font-size:16px; font-weight:bold; color:#fff; margin-top:3px;">${droppedRelic.icon} ${droppedRelic.name}</div>







                    <div style="font-size:11px; color:#cbd5e1; margin-top:2px;">${droppedRelic.desc}</div>







                </div>







            `;







        }















        container.innerHTML = `







            <div style="padding:10px 5px;">







                <div style="font-size:32px; margin-bottom:6px;">🌟</div>







                <div style="font-size:20px; font-weight:bold; color:#ffd700; margin-bottom:4px;">Floor ${floor} Cleared!</div>







                <div style="font-size:13px; color:#94a3b8; margin-bottom:14px;">The astral barrier yields before your might.</div>















                <div style="background:#1e1b4b; border:1px solid #4338ca; border-radius:8px; padding:12px; margin-bottom:16px;">







                    <div style="font-size:12px; color:#a5b4fc; text-transform:uppercase;">Floor Rewards Gained:</div>







                    <div style="font-size:22px; font-weight:bold; color:#38bdf8; margin-top:4px;">✨ +${shards} Astral Shards</div>







                    <div style="font-size:12px; color:#94a3b8; margin-top:2px;">Total Earned This Run: ${spireRun.shardsEarned} Shards</div>







                    ${relicHtml}







                </div>















                <div style="display:flex; flex-direction:column; gap:8px;">







                    <button class="btn" style="background:#22c55e; color:#fff; font-size:15px; padding:10px 18px; font-weight:bold;" onclick="ascendSpireFloor()">Ascend to Floor ${floor + 1} ➔</button>







                    <button class="btn" style="background:#334155; color:#cbd5e1; font-size:13px; padding:8px 14px;" onclick="exitSpireToTown()">Cash Out & Return to Town</button>







                </div>







            </div>







        `;















        document.getElementById('main-overlay').classList.add('active');







        document.getElementById('modal-spire-victory').classList.add('active');







    }















    function renderSpireModal() {







        const container = document.getElementById('spire-content');







        if (!container) return;















        if (!player.spire) {







            player.spire = { highestFloor: 0, astralShards: 0, relics: [], equippedRelic: null, tomesUsed: { hp: 0, atk: 0, mp: 0 } };







        }















        let equippedRelicObj = (player.spire.equippedRelic && typeof RELICS_DB !== 'undefined') ? RELICS_DB[player.spire.equippedRelic] : null;







        let equippedRelicName = equippedRelicObj ? `${equippedRelicObj.icon} ${equippedRelicObj.name}` : '<span style="color:#64748b; font-style:italic;">None</span>';















        let checkpoints = getSpireCheckpoints();







        let cpOptions = checkpoints.map(cp => `<option value="${cp}">Floor ${cp}${cp === 1 ? ' (Ground Floor)' : ''}</option>`).join('');















        let ownedCount = player.spire.relics.length;







        let relicCardsHtml = '';







        if (typeof RELICS_DB !== 'undefined') {







            for (let rId in RELICS_DB) {







                let relic = RELICS_DB[rId];







                let isOwned = player.spire.relics.includes(rId);







                let isEquipped = (player.spire.equippedRelic === rId);















                let badge = isEquipped 







                    ? '<span style="font-size:10px; background:#ffd700; color:#000; font-weight:bold; padding:2px 6px; border-radius:4px;">EQUIPPED</span>'







                    : (isOwned ? '<span style="font-size:10px; background:#22c55e; color:#fff; font-weight:bold; padding:2px 6px; border-radius:4px;">OWNED</span>' : '<span style="font-size:10px; background:#475569; color:#94a3b8; padding:2px 6px; border-radius:4px;">LOCKED</span>');















                let actionBtn = '';







                if (isOwned) {







                    actionBtn = isEquipped







                        ? `<button class="btn" style="width:100%; padding:4px 8px; font-size:11px; background:#dc2626; color:#fff;" onclick="equipRelic(null)">Unequip</button>`







                        : `<button class="btn" style="width:100%; padding:4px 8px; font-size:11px; background:#3b82f6; color:#fff;" onclick="equipRelic('${rId}')">Equip</button>`;







                } else {







                    actionBtn = `<button class="btn" style="width:100%; padding:4px 8px; font-size:11px; opacity:0.5;" disabled>Locked (Boss Drop)</button>`;







                }















                relicCardsHtml += `







                    <div class="relic-card ${isEquipped ? 'equipped' : ''} ${!isOwned ? 'locked' : ''}">







                        <div>







                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">







                                <span style="font-size:18px;">${relic.icon}</span>







                                ${badge}







                            </div>







                            <div style="font-size:13px; font-weight:bold; color:${isEquipped ? '#ffd700' : '#fff'}; margin-bottom:4px;">${relic.name}</div>







                            <div style="font-size:11px; color:#cbd5e1; line-height:1.3;">${relic.desc}</div>







                        </div>







                        <div style="margin-top:8px;">







                            ${actionBtn}







                        </div>







                    </div>







                `;







            }







        }















        container.innerHTML = `







            <div style="display:flex; justify-content:space-between; align-items:center; background:#1e1b4b; border:1px solid #4338ca; border-radius:8px; padding:12px 16px; margin-bottom:14px; flex-wrap:wrap; gap:10px;">







                <div>







                    <div style="font-size:11px; color:#a5b4fc; text-transform:uppercase; letter-spacing:0.5px;">Highest Depth Cleared</div>







                    <div style="font-size:22px; font-weight:bold; color:#ffd700;">Floor ${player.spire.highestFloor || 0}</div>







                </div>







                <div>







                    <div style="font-size:11px; color:#a5b4fc; text-transform:uppercase; letter-spacing:0.5px;">Astral Shards Holding</div>







                    <div style="font-size:22px; font-weight:bold; color:#38bdf8;">✨ ${player.spire.astralShards || 0}</div>







                </div>







                <div>







                    <div style="font-size:11px; color:#a5b4fc; text-transform:uppercase; letter-spacing:0.5px;">Equipped Relic</div>







                    <div style="font-size:14px; font-weight:bold; color:#ffd700;">${equippedRelicName}</div>







                </div>







            </div>















            <div style="display:flex; gap:12px; align-items:center; background:#0f172a; border:1px solid #334155; border-radius:8px; padding:12px 16px; margin-bottom:16px; flex-wrap:wrap;">







                <div style="flex:1; min-width:180px;">







                    <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:4px; font-weight:bold;">Elevator Checkpoint (Ascend from):</label>







                    <select id="spire-checkpoint-select" class="btn" style="width:100%; padding:6px 10px; background:#1e293b; color:#fff; font-size:13px; text-align:left;">







                        ${cpOptions}







                    </select>







                </div>







                <div style="display:flex; gap:8px;">







                    <button class="btn" style="background:#22c55e; color:#fff; font-size:14px; padding:8px 16px; font-weight:bold;" onclick="enterTheSpire(parseInt(document.getElementById('spire-checkpoint-select').value))">🌀 Enter the Spire</button>







                    <button class="btn" style="background:#6366f1; color:#fff; font-size:14px; padding:8px 16px;" onclick="openModal('modal-astral-altar')">✨ Astral Altar</button>







                </div>







            </div>















            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">







                <span style="font-size:15px; font-weight:bold; color:#f1f5f9;">Ancient Relics Vault (${ownedCount}/6 Discovered)</span>







                <span style="font-size:11px; color:#94a3b8;">Drops from Spire Bosses on every 5th floor</span>







            </div>







            <div class="relic-grid">







                ${relicCardsHtml}







            </div>







        `;







    }















    function equipRelic(relicId) {







        if (!player.spire) return;







        if (relicId === null || player.spire.equippedRelic === relicId) {







            player.spire.equippedRelic = null;







            showToast('Relic Unequipped', 'Unequipped ancient relic.', 'info');







        } else if (player.spire.relics.includes(relicId) && typeof RELICS_DB !== 'undefined' && RELICS_DB[relicId]) {







            player.spire.equippedRelic = relicId;







            let r = RELICS_DB[relicId];







            showToast('Relic Equipped!', `Equipped ${r.icon} ${r.name}!`, 'quest', 4000);







        }







        computeStats();







        updateHeader();







        renderStats();







        renderSpireModal();







    }















    function renderAstralAltarModal() {







        const container = document.getElementById('astral-altar-content');







        if (!container) return;















        if (!player.spire) {







            player.spire = { highestFloor: 0, astralShards: 0, relics: [], equippedRelic: null, tomesUsed: { hp: 0, atk: 0, mp: 0 } };







        }















        let shards = player.spire.astralShards || 0;







        let altarCardsHtml = '';















        if (typeof ALTAR_SHOP_DB !== 'undefined') {







            for (let itemId in ALTAR_SHOP_DB) {







                let item = ALTAR_SHOP_DB[itemId];







                let isAffordable = shards >= item.cost;







                let isMaxed = false;







                let subStatus = '';















                if (item.type === 'tome') {







                    let used = (player.spire.tomesUsed && player.spire.tomesUsed[item.stat]) || 0;







                    isMaxed = used >= item.maxUses;







                    subStatus = `<span style="font-size:11px; color:${isMaxed ? '#ef4444' : '#ffd700'}; font-weight:bold;">(${used}/${item.maxUses} Used)</span>`;







                } else if (item.type === 'title') {







                    let hasTitle = (player.activeTitle === item.title);







                    if (hasTitle) {







                        isMaxed = true;







                        subStatus = `<span style="font-size:11px; color:#22c55e; font-weight:bold;">[EQUIPPED]</span>`;







                    }







                } else if (item.type === 'item') {







                    let count = (player.inventory && player.inventory.consumables && player.inventory.consumables[item.itemName]) || 0;







                    subStatus = `<span style="font-size:11px; color:#94a3b8;">In Bag: ${count}</span>`;







                }















                let canBuy = isAffordable && !isMaxed;







                let btnText = isMaxed ? (item.type === 'title' ? 'Unlocked' : 'Maxed (5/5)') : `Purchase (✨ ${item.cost})`;















                altarCardsHtml += `







                    <div class="altar-card">







                        <div>







                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">







                                <div style="font-size:18px;">${item.icon}</div>







                                ${subStatus}







                            </div>







                            <div style="font-size:14px; font-weight:bold; color:#fff; margin-bottom:4px;">${item.name}</div>







                            <div style="font-size:11px; color:#cbd5e1; line-height:1.3;">${item.desc}</div>







                        </div>







                        <div style="margin-top:10px;">







                            <button class="btn" style="width:100%; padding:6px 10px; font-size:12px; font-weight:bold; background:${canBuy ? '#6366f1' : '#334155'}; color:${canBuy ? '#fff' : '#94a3b8'};" ${canBuy ? '' : 'disabled'} onclick="buyAltarItem('${itemId}')">







                                ${btnText}







                            </button>







                        </div>







                    </div>







                `;







            }







        }















        container.innerHTML = `







            <div style="display:flex; justify-content:space-between; align-items:center; background:#1e1b4b; border:1px solid #6366f1; border-radius:8px; padding:12px 16px; margin-bottom:14px; flex-wrap:wrap; gap:10px;">







                <div>







                    <div style="font-size:13px; color:#c7d2fe;">The Astral Altar channels cosmic shards into permanent tomes, runes, and prestige.</div>







                </div>







                <div style="text-align:right;">







                    <div style="font-size:11px; color:#a5b4fc; text-transform:uppercase;">Astral Shards Holding</div>







                    <div style="font-size:22px; font-weight:bold; color:#38bdf8;">✨ ${shards}</div>







                </div>







            </div>















            <div class="altar-grid">







                ${altarCardsHtml}







            </div>







        `;







    }















    function buyAltarItem(itemId) {







        if (!player.spire || typeof ALTAR_SHOP_DB === 'undefined') return;







        const item = ALTAR_SHOP_DB[itemId];







        if (!item) return;















        if (player.spire.astralShards < item.cost) {







            showToast('Insufficient Shards', `You need ✨ ${item.cost} Astral Shards to purchase this.`, 'info');







            return;







        }















        if (item.type === 'tome') {







            if (!player.spire.tomesUsed) player.spire.tomesUsed = { hp: 0, atk: 0, mp: 0 };







            let used = player.spire.tomesUsed[item.stat] || 0;







            if (used >= item.maxUses) {







                showToast('Maximum Uses Reached', `You have already used the maximum of ${item.maxUses} ${item.name}s.`, 'info');







                return;







            }







            player.spire.astralShards -= item.cost;







            player.spire.tomesUsed[item.stat] = used + 1;







            computeStats();







            updateHeader();







            renderStats();







            renderAstralAltarModal();







            showToast('Tome Consumed!', `${item.name} permanently increased your stats! (${used + 1}/${item.maxUses})`, 'level', 5000);







        } else if (item.type === 'title') {







            player.spire.astralShards -= item.cost;







            player.activeTitle = item.title;







            updateHeader();







            renderStats();







            renderAstralAltarModal();







            showToast('Title Acquired!', `Equipped prestige title [${item.title}]!`, 'quest', 5000);







        } else if (item.type === 'item') {







            player.spire.astralShards -= item.cost;







            if (!player.inventory.consumables) player.inventory.consumables = {};







            player.inventory.consumables[item.itemName] = (player.inventory.consumables[item.itemName] || 0) + 1;







            renderInventory();







            renderAstralAltarModal();







            showToast('Item Acquired!', `Added ${item.itemName} to your inventory!`, 'quest', 4000);







        }







    }























if (typeof updateAudioButton === 'function') updateAudioButton();















    /* =========================================================================







       COMPANION PET & FAMILIAR SYSTEM (SANCTUARY, BONDING & CADENCE)







       ========================================================================= */















    let currentPetsTab = 'active';







    let selectedPetFeedId = 'sprout_slimelet';















    function setPetsTab(tab) {







        currentPetsTab = tab;







        const btnActive = document.getElementById('pets-tab-active');







        const btnFeed = document.getElementById('pets-tab-feed');







        if (btnActive && btnFeed) {







            btnActive.classList.toggle('active', tab === 'active');







            btnFeed.classList.toggle('active', tab === 'feed');







        }







        renderPetsModal();







    }















    function equipPet(petId, slotIdx) {







        if (!player.pets) {







            player.pets = { unlocked: ['sprout_slimelet'], active: [null, null], levels: { sprout_slimelet: { level: 1, exp: 0 } } };







        }







        if (slotIdx === 1 && player.level < 25) {







            showToast("Slot Locked", "Slot 2 unlocks at Level 25!", "save");







            return;







        }







        if (!Array.isArray(player.pets.active)) player.pets.active = ['sprout_slimelet', null];















        // Unequip if already in another slot







        if (player.pets.active[0] === petId) player.pets.active[0] = null;







        if (player.pets.active[1] === petId) player.pets.active[1] = null;















        player.pets.active[slotIdx] = petId;







        computeStats();







        updateHeader();







        renderPetsModal();







        const pet = (typeof PETS_DB !== 'undefined') ? PETS_DB[petId] : null;







        showToast("Companion Equipped", `${pet ? pet.name : petId} equipped to Slot ${slotIdx + 1}!`, "level");







    }















    function unequipPet(slotIdx) {







        if (!player.pets || !Array.isArray(player.pets.active)) return;







        player.pets.active[slotIdx] = null;







        computeStats();







        updateHeader();







        renderPetsModal();







        showToast("Companion Unequipped", `Companion removed from Slot ${slotIdx + 1}.`, "info");







    }















    function addPetExp(petId, expGained) {







        if (!player.pets) return;







        if (!player.pets.levels) player.pets.levels = {};







        if (!player.pets.levels[petId]) player.pets.levels[petId] = { level: 1, exp: 0 };







        const pData = player.pets.levels[petId];







        if (pData.level >= 10) return;















        pData.exp += expGained;







        let leveledUp = false;







        while (pData.level < 10 && pData.exp >= pData.level * 100) {







            pData.exp -= pData.level * 100;







            pData.level++;







            leveledUp = true;







            const pet = (typeof PETS_DB !== 'undefined') ? PETS_DB[petId] : null;







            if (pData.level === 10) {







                pData.exp = 0;







                showToast("🌟 APEX PERK UNLOCKED!", `${pet ? pet.name : petId}: ${pet ? pet.apexPerk : ''}`, "quest", 6000);







                break;







            }







        }







        if (leveledUp && pData.level < 10) {







            const pet = (typeof PETS_DB !== 'undefined') ? PETS_DB[petId] : null;







            showToast("🐾 Bond Level Up!", `${pet ? pet.name : petId} reached Bond Level ${pData.level}!`, "level", 4000);







        }







        computeStats();







        updateHeader();







        const modalEl = document.getElementById('modal-pets');







        if (modalEl && modalEl.classList.contains('active')) {







            renderPetsModal();







        }







    }















    function feedPet(petId, treatType) {







        if (!player.pets) return;







        if (!player.pets.levels) player.pets.levels = {};







        if (!player.pets.levels[petId]) player.pets.levels[petId] = { level: 1, exp: 0 };







        const pData = player.pets.levels[petId];







        const pet = (typeof PETS_DB !== 'undefined') ? PETS_DB[petId] : null;















        if (pData.level >= 10) {







            showToast("Max Bond Level", `${pet ? pet.name : petId} is already at Max Bond Level 10!`, "info");







            return;







        }















        if (!player.materials) player.materials = { scrap: 0, dust: 0, shard: 0 };















        if (treatType === 'scrap') {







            if ((player.materials.scrap || 0) < 10) {







                showToast("Insufficient Scraps", "Requires 10 Iron Scraps!", "save");







                return;







            }







            player.materials.scrap -= 10;







            addPetExp(petId, 50);







            showToast("Fed Iron Scraps", `+50 Bond EXP to ${pet ? pet.name : petId}!`, "level");







        } else if (treatType === 'dust') {







            if ((player.materials.dust || 0) < 2) {







                showToast("Insufficient Dust", "Requires 2 Arcane Dust!", "save");







                return;







            }







            player.materials.dust -= 2;







            addPetExp(petId, 100);







            showToast("Fed Arcane Dust", `+100 Bond EXP to ${pet ? pet.name : petId}!`, "level");







        } else if (treatType === 'shard') {







            if ((player.materials.shard || 0) < 1) {







                showToast("Insufficient Shards", "Requires 1 Void Shard!", "save");







                return;







            }







            player.materials.shard -= 1;







            addPetExp(petId, 300);







            showToast("Fed Void Shard", `+300 Bond EXP to ${pet ? pet.name : petId}!`, "level");







        } else if (treatType === 'gold') {







            if ((player.gold || 0) < 150) {







                showToast("Insufficient Gold", "Requires 150 Gold!", "save");







                return;







            }







            player.gold -= 150;







            addPetExp(petId, 150);







            showToast("Gourmet Treat", `+150 Bond EXP to ${pet ? pet.name : petId}!`, "level");







        }







        renderPetsModal();







    }















    function selectPetFeed(petId) {







        selectedPetFeedId = petId;







        renderPetsModal();







    }















    function renderPetsModal() {







        const container = document.getElementById('pets-content');







        if (!container || typeof PETS_DB === 'undefined') return;















        if (!player.pets) {







            player.pets = {







                unlocked: ['sprout_slimelet'],







                active: [null, null],







                levels: { sprout_slimelet: { level: 1, exp: 0 } }







            };







        }







        if (!player.pets.active) player.pets.active = ['sprout_slimelet', null];







        if (!player.pets.unlocked) player.pets.unlocked = ['sprout_slimelet'];







        if (!player.pets.levels) player.pets.levels = {};















        if (!selectedPetFeedId || !player.pets.unlocked.includes(selectedPetFeedId)) {







            selectedPetFeedId = player.pets.unlocked[0] || 'sprout_slimelet';







        }















        if (currentPetsTab === 'active') {







            const slot1Id = player.pets.active[0];







            const slot2Id = player.pets.active[1];







            const slot1Pet = slot1Id ? PETS_DB[slot1Id] : null;







            const slot2Pet = slot2Id ? PETS_DB[slot2Id] : null;







            const slot1Lvl = slot1Id && player.pets.levels[slot1Id] ? player.pets.levels[slot1Id].level : 1;







            const slot2Lvl = slot2Id && player.pets.levels[slot2Id] ? player.pets.levels[slot2Id].level : 1;















            let html = `







                <div style="display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 20px;">







                    <!-- Slot 1 -->







                    <div class="pet-slot-box ${slot1Pet ? 'pet-rarity-' + slot1Pet.rarity : ''}">







                        <div style="font-size: 11px; text-transform: uppercase; color: #38bdf8; font-weight: bold; margin-bottom: 6px;">Slot 1 (Hero Companion)</div>







                        ${slot1Pet ? `







                            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">







                                <div style="width: 50px; height: 50px;">${slot1Pet.sprite}</div>







                                <div style="text-align: left;">







                                    <div style="font-weight: bold; font-size: 15px; color: #f8fafc;">${slot1Pet.name}</div>







                                    <div style="font-size: 12px; color: #4ade80;">Bond Lv.${slot1Lvl} · ${slot1Pet.element}</div>







                                </div>







                            </div>







                            <div style="font-size: 12px; color: #94a3b8; margin: 8px 0;">Skill: <b style="color: #fbbf24;">${slot1Pet.action.name}</b> (every 2 turns)</div>







                            <button class="btn" style="padding: 4px 12px; font-size: 12px; background: #dc2626; border-color: #ef4444;" onclick="unequipPet(0)">Unequip</button>







                        ` : `







                            <div style="padding: 20px 0; color: #64748b; font-size: 13px;">No Companion Equipped<br><span style="font-size: 11px;">Select a pet below to equip</span></div>







                        `}







                    </div>















                    <!-- Slot 2 -->







                    ${player.level < 25 ? `







                        <div class="pet-slot-box pet-locked-slot">







                            <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: bold; margin-bottom: 6px;">Slot 2 (Dual Companion)</div>







                            <div style="padding: 16px 0; color: #f59e0b; font-size: 13px; font-weight: bold;">







                                🔒 Locked until Level 25







                                <div style="font-size: 11px; color: #94a3b8; font-weight: normal; margin-top: 4px;">Unlocks 2nd Companion Slot (Tier 2 Specialization)</div>







                            </div>







                        </div>







                    ` : `







                        <div class="pet-slot-box ${slot2Pet ? 'pet-rarity-' + slot2Pet.rarity : ''}">







                            <div style="font-size: 11px; text-transform: uppercase; color: #a855f7; font-weight: bold; margin-bottom: 6px;">Slot 2 (Dual Companion)</div>







                            ${slot2Pet ? `







                                <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">







                                    <div style="width: 50px; height: 50px;">${slot2Pet.sprite}</div>







                                    <div style="text-align: left;">







                                        <div style="font-weight: bold; font-size: 15px; color: #f8fafc;">${slot2Pet.name}</div>







                                        <div style="font-size: 12px; color: #4ade80;">Bond Lv.${slot2Lvl} · ${slot2Pet.element}</div>







                                    </div>







                                </div>







                                <div style="font-size: 12px; color: #94a3b8; margin: 8px 0;">Skill: <b style="color: #fbbf24;">${slot2Pet.action.name}</b> (every 2 turns)</div>







                                <button class="btn" style="padding: 4px 12px; font-size: 12px; background: #dc2626; border-color: #ef4444;" onclick="unequipPet(1)">Unequip</button>







                            ` : `







                                <div style="padding: 20px 0; color: #64748b; font-size: 13px;">Empty Slot<br><span style="font-size: 11px;">Select a pet below to equip</span></div>







                            `}







                        </div>







                    `}







                </div>















                <h3 style="font-size: 16px; margin: 15px 0 10px; color: #f8fafc;">Unlocked Companions (${player.pets.unlocked.length})</h3>







                <div style="max-height: 380px; overflow-y: auto; padding-right: 4px;">







            `;















            player.pets.unlocked.forEach(pId => {







                const pet = PETS_DB[pId];







                if (!pet) return;







                const pLvl = player.pets.levels[pId] ? player.pets.levels[pId].level : 1;







                const isEquippedSlot1 = slot1Id === pId;







                const isEquippedSlot2 = slot2Id === pId;















                let passiveStr = Object.entries(pet.passive).map(([k, v]) => `+${v}${k.includes('Pct') ? '%' : ''} ${k.replace('Pct', '').toUpperCase()}`).join(', ');















                html += `







                    <div class="pet-card pet-rarity-${pet.rarity}">







                        <div style="width: 48px; height: 48px; flex-shrink: 0;">${pet.sprite}</div>







                        <div style="flex: 1; min-width: 0;">







                            <div style="display: flex; align-items: center; gap: 8px;">







                                <span style="font-weight: bold; font-size: 14px; color: #f8fafc;">${pet.name}</span>







                                <span style="font-size: 10px; padding: 1px 6px; border-radius: 4px; background: rgba(0,0,0,0.4); color: #94a3b8;">${pet.rarity}</span>







                                <span style="font-size: 11px; color: #4ade80;">Bond Lv.${pLvl}</span>







                            </div>







                            <div style="font-size: 12px; color: #cbd5e1; margin-top: 2px;">${pet.desc}</div>







                            <div style="font-size: 11px; color: #38bdf8; margin-top: 4px;">Passive: <b>${passiveStr}</b> | Skill: <b>${pet.action.name}</b></div>







                            <div style="font-size: 11px; color: ${pLvl >= 10 ? '#facc15' : '#64748b'}; margin-top: 2px;">Apex (Lv.10): ${pet.apexPerk}</div>







                        </div>







                        <div style="display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;">







                            <button class="btn" style="padding: 4px 10px; font-size: 11px; ${isEquippedSlot1 ? 'background:#16a34a; border-color:#22c55e;' : ''}" onclick="equipPet('${pId}', 0)">







                                ${isEquippedSlot1 ? '✓ In Slot 1' : 'Equip Slot 1'}







                            </button>







                            <button class="btn" style="padding: 4px 10px; font-size: 11px; ${isEquippedSlot2 ? 'background:#16a34a; border-color:#22c55e;' : ''}" ${player.level < 25 ? 'disabled' : ''} onclick="equipPet('${pId}', 1)">







                                ${player.level < 25 ? '🔒 Lv 25' : (isEquippedSlot2 ? '✓ In Slot 2' : 'Equip Slot 2')}







                            </button>







                        </div>







                    </div>







                `;







            });















            html += `</div>`;







            container.innerHTML = html;







        } else {







            // Feed & Bond Tab







            const pId = selectedPetFeedId;







            const pet = PETS_DB[pId];







            const pData = player.pets.levels[pId] || { level: 1, exp: 0 };







            const reqExp = pData.level >= 10 ? 0 : pData.level * 100;







            const expPct = pData.level >= 10 ? 100 : Math.min(100, Math.round((pData.exp / reqExp) * 100));















            let petSelectorHtml = player.pets.unlocked.map(id => {







                const p = PETS_DB[id];







                const lvl = player.pets.levels[id] ? player.pets.levels[id].level : 1;







                const isSel = id === selectedPetFeedId;







                return `<button class="btn" style="padding: 4px 10px; font-size: 12px; ${isSel ? 'background: #3b82f6; border-color: #60a5fa;' : ''}" onclick="selectPetFeed('${id}')">${p ? p.name : id} (Lv.${lvl})</button>`;







            }).join(' ');















            let scraps = (player.materials && player.materials.scrap) || 0;







            let dust = (player.materials && player.materials.dust) || 0;







            let shard = (player.materials && player.materials.shard) || 0;







            let gold = player.gold || 0;















            let html = `







                <div style="margin-bottom: 12px; display: flex; gap: 8px; flex-wrap: wrap;">







                    ${petSelectorHtml}







                </div>















                ${pet ? `







                    <div class="pet-card pet-rarity-${pet.rarity}" style="align-items: flex-start; padding: 16px;">







                        <div style="width: 60px; height: 60px; flex-shrink: 0; margin-top: 4px;">${pet.sprite}</div>







                        <div style="flex: 1;">







                            <div style="display: flex; justify-content: space-between; align-items: center;">







                                <span style="font-size: 18px; font-weight: bold; color: #f8fafc;">${pet.name}</span>







                                <span style="font-size: 13px; font-weight: bold; color: #4ade80;">Bond Level ${pData.level} / 10 ${pData.level >= 10 ? '(MAX)' : ''}</span>







                            </div>







                            <div style="font-size: 12px; color: #94a3b8; margin: 4px 0;">${pet.desc}</div>















                            <div class="pet-exp-container">







                                <div class="pet-exp-fill" style="width: ${expPct}%;"></div>







                            </div>







                            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #cbd5e1;">







                                <span>EXP: ${pData.exp} / ${pData.level >= 10 ? 'MAX' : reqExp}</span>







                                <span>${expPct}%</span>







                            </div>















                            <div style="margin-top: 10px; font-size: 12px; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 6px;">







                                <div style="color: ${pData.level >= 10 ? '#facc15' : '#94a3b8'}; font-weight: bold;">







                                    ${pData.level >= 10 ? '🌟 APEX PERK UNLOCKED' : '🔒 Apex Perk (Unlocks at Bond Lv. 10)'}







                                </div>







                                <div style="color: #cbd5e1; font-size: 11px; margin-top: 2px;">${pet.apexPerk}</div>







                            </div>







                        </div>







                    </div>















                    <h4 style="font-size: 14px; margin: 16px 0 8px; color: #f8fafc;">Feeding & Training Station</h4>







                    <div class="pet-feed-grid">







                        <button class="pet-feed-btn" ${pData.level >= 10 || scraps < 10 ? 'disabled' : ''} onclick="feedPet('${pId}', 'scrap')">







                            <div style="font-weight: bold; color: #e2e8f0;">⚙️ Iron Scraps</div>







                            <div style="font-size: 11px; color: #4ade80; margin: 2px 0;">+50 Bond EXP</div>







                            <div style="font-size: 11px; color: #94a3b8;">Cost: 10 Scraps (You have: ${scraps})</div>







                        </button>







                        <button class="pet-feed-btn" ${pData.level >= 10 || dust < 2 ? 'disabled' : ''} onclick="feedPet('${pId}', 'dust')">







                            <div style="font-weight: bold; color: #e2e8f0;">✨ Arcane Dust</div>







                            <div style="font-size: 11px; color: #4ade80; margin: 2px 0;">+100 Bond EXP</div>







                            <div style="font-size: 11px; color: #94a3b8;">Cost: 2 Dust (You have: ${dust})</div>







                        </button>







                        <button class="pet-feed-btn" ${pData.level >= 10 || shard < 1 ? 'disabled' : ''} onclick="feedPet('${pId}', 'shard')">







                            <div style="font-weight: bold; color: #e2e8f0;">💎 Void Shard</div>







                            <div style="font-size: 11px; color: #4ade80; margin: 2px 0;">+300 Bond EXP</div>







                            <div style="font-size: 11px; color: #94a3b8;">Cost: 1 Shard (You have: ${shard})</div>







                        </button>







                        <button class="pet-feed-btn" ${pData.level >= 10 || gold < 150 ? 'disabled' : ''} onclick="feedPet('${pId}', 'gold')">







                            <div style="font-weight: bold; color: #e2e8f0;">🍖 Gourmet Beast Treat</div>







                            <div style="font-size: 11px; color: #4ade80; margin: 2px 0;">+150 Bond EXP</div>







                            <div style="font-size: 11px; color: #94a3b8;">Cost: 150 Gold (You have: ${gold}G)</div>







                        </button>







                    </div>







                ` : ''}







            `;







            container.innerHTML = html;







        }







    }















    function triggerPetTurnCadence() {







        if (!battleState || !battleState.active || !player.pets || !Array.isArray(player.pets.active)) return;







        if (!battleState.petTurns) {







            battleState.petTurns = { slot0: 0, slot1: 0, 0: 0, 1: 0 };







        }















        for (let slotIdx = 0; slotIdx < player.pets.active.length; slotIdx++) {







            const petId = player.pets.active[slotIdx];







            if (!petId || typeof PETS_DB === 'undefined' || !PETS_DB[petId]) continue;















            const slotKey = slotIdx === 0 ? 'slot0' : 'slot1';







            const currentPips = ((battleState.petTurns[slotKey] !== undefined) ? battleState.petTurns[slotKey] : battleState.petTurns[slotIdx]) || 0;







            const newPips = currentPips + 1;















            battleState.petTurns[slotKey] = newPips;







            battleState.petTurns[slotIdx] = newPips;















            if (newPips >= 2) {







                battleState.petTurns[slotKey] = 0;







                battleState.petTurns[slotIdx] = 0;







                executePetAction(petId, slotIdx);







            }







        }







        renderBattlefield();







    }















    function executePetAction(petId, slotIdx) {







        if (typeof PETS_DB === 'undefined' || !PETS_DB[petId] || !battleState || !battleState.active) return;







        const pet = PETS_DB[petId];







        const lvl = (player.pets && player.pets.levels && player.pets.levels[petId] && player.pets.levels[petId].level) || 1;







        const isApex = lvl >= 10;







        const action = pet.action;







        if (!action) return;















        // Visual hop animation & sound







        if (typeof document !== 'undefined') {







            const petBadge = document.getElementById(`battle-pet-slot-${slotIdx}`);







            if (petBadge) {







                petBadge.classList.remove('anim-pet-hop');







                void petBadge.offsetWidth;







                petBadge.classList.add('anim-pet-hop');







            }







        }







        if (typeof playSFX === 'function') {







            if (pet.element === 'Earth' || pet.element === 'Water') playSFX('magic_holy');







            else if (pet.element === 'Fire' || pet.element === 'Dark') playSFX('fireball');







            else playSFX('slash');







        }







        if (typeof floatText === 'function') {







            floatText(`battle-pet-slot-${slotIdx}`, `🐾 ${action.name}!`, '#4ade80');







        }















        let target = battleState.enemies.find(e => e.hp > 0);







        let playerEnt = (typeof getPlayerCombatEntity === 'function') ? getPlayerCombatEntity() : null;















        switch (action.type) {







            case 'shield_freeze': {







                // Glacia Kitsune: Permafrost Shield







                let baseShield = Math.max(5, Math.round(pStats.maxHp * ((action.valPct || 12) / 100)));







                if (isApex) baseShield = Math.round(baseShield * 1.25);







                battleState.playerBarrier = (battleState.playerBarrier || 0) + baseShield;







                logMsg(`🐾 <b>${pet.name}</b> uses <b>${action.name}</b>, granting a <b>+${baseShield} HP</b> barrier!`, '#38bdf8');







                if (typeof floatText === 'function') floatText('battle-player', `+${baseShield} Barrier`, '#38bdf8');







                if (target && Math.random() <= (action.freezeChance || 0.5) && typeof applyStatus === 'function') {







                    applyStatus(target, 'freeze', 1);







                    logMsg(`❄️ ${target.name} is Frozen solid!`, '#38bdf8');







                }







                break;







            }







            case 'buff_time': {







                // Chronos Sprite: Temporal Warp







                let healMp = Math.max(5, Math.round(pStats.maxMp * ((action.healMpPct || 20) / 100)));







                pStats.mp = Math.min(pStats.maxMp, pStats.mp + healMp);







                player.baseStats.mp = pStats.mp;







                if (typeof applyStatus === 'function') {







                    applyStatus('player', 'haste', action.turns || 2);







                }







                logMsg(`🐾 <b>${pet.name}</b> uses <b>${action.name}</b>, accelerating time! (+${healMp} MP & Haste for ${action.turns || 2} turns)`, '#c084fc');







                if (typeof floatText === 'function') {







                    floatText('battle-player', `+${healMp} MP`, '#38bdf8');







                    floatText('battle-player', 'HASTE!', '#c084fc');







                }







                break;







            }







            case 'heal_cleanse': {







                // Lumina Sprite: Solar Blessing







                let healHp = Math.max(5, Math.round(pStats.maxHp * ((action.valPct || 10) / 100)));







                pStats.hp = Math.min(pStats.maxHp, pStats.hp + healHp);







                player.baseStats.hp = pStats.hp;







                logMsg(`🐾 <b>${pet.name}</b> uses <b>${action.name}</b>, restoring <b>+${healHp} HP</b> and cleansing dark energies!`, '#fef08a');







                if (typeof floatText === 'function') floatText('battle-player', `+${healHp} HP`, '#fef08a');







                if (player.statuses) {







                    ['burn', 'poison', 'bleed', 'decay', 'blind', 'slow'].forEach(deb => {







                        if (player.statuses[deb]) delete player.statuses[deb];







                    });







                }







                break;







            }







            case 'shield': {







                // Sprout Slimelet: Pebble Guard (8% Max HP barrier, +15% if Apex)







                let baseShield = Math.max(5, Math.round(pStats.maxHp * (action.valPct / 100)));







                if (isApex) baseShield = Math.round(baseShield * 1.15);







                battleState.playerBarrier = (battleState.playerBarrier || 0) + baseShield;







                logMsg(`🐾 <b>${pet.name}</b> uses <b>${action.name}</b>, granting a <b>+${baseShield} HP</b> barrier!`, '#4ade80');







                if (typeof floatText === 'function') floatText('battle-player', `+${baseShield} Barrier`, '#4ade80');







                break;







            }







            case 'damage_dot': {







                // Cinder Pup: Ember Bite (Fire/Burn) | Spark Hound: Overcharge Bite (Wind/Shock)







                if (target) {







                    let dmg = Math.max(5, Math.round((pStats.atk * 0.8) + (action.power * 0.6)));







                    target.hp = Math.max(0, target.hp - dmg);







                    let elem = pet.element || 'Fire';







                    let dotType = action.dot || (elem === 'Wind' ? 'shock' : 'burn');







                    let color = (dotType === 'shock' || elem === 'Wind') ? '#38bdf8' : '#fb923c';







                    let icon = dotType === 'shock' ? '⚡' : '🔥';







                    let dotLabel = dotType.charAt(0).toUpperCase() + dotType.slice(1);















                    logMsg(`🐾 <b>${pet.name}</b> uses <b>${action.name}</b> dealing <b>${dmg}</b> damage to ${target.name}!`, color);







                    if (typeof floatText === 'function') floatText(target.id, `-${dmg}`, color);







                    if (typeof triggerElementalImpact === 'function') triggerElementalImpact(target.id, elem);







                    if (Math.random() <= (action.dotChance || 0.6)) {







                        let stacks = isApex ? 2 : 1;







                        for (let s = 0; s < stacks; s++) {







                            if (typeof applyStatus === 'function') applyStatus(target, dotType, 3);







                        }







                        logMsg(`${icon} ${target.name} is afflicted with ${stacks} stack(s) of ${dotLabel}!`, color);







                    }







                }







                break;







            }







            case 'buff': {







                // Breeze Finch: Tailwind Gust (Haste for 2 turns)







                if (playerEnt && typeof applyStatus === 'function') {







                    applyStatus('player', action.buff, action.turns);







                    logMsg(`🐾 <b>${pet.name}</b> uses <b>${action.name}</b>, granting Haste for ${action.turns} turns!`, '#38bdf8');







                    if (typeof floatText === 'function') floatText('battle-player', 'HASTE!', '#38bdf8');







                }







                break;







            }







            case 'debuff_leech': {







                // Shadow Wisp: Abyssal Gaze (damage, blind debuff, leech HP)







                if (target) {







                    let dmg = Math.max(5, Math.round((pStats.matk * 0.8) + (action.power * 0.5)));







                    target.hp = Math.max(0, target.hp - dmg);







                    let leechPct = isApex ? 0.9 : (action.leechPct || 0.3);







                    let leechHp = Math.max(1, Math.round(dmg * leechPct));







                    pStats.hp = Math.min(pStats.maxHp, pStats.hp + leechHp);







                    player.baseStats.hp = pStats.hp;







                    logMsg(`🐾 <b>${pet.name}</b> uses <b>${action.name}</b> dealing <b>${dmg}</b> damage and leeching <b>+${leechHp} HP</b>!`, '#c084fc');







                    if (typeof floatText === 'function') {







                        floatText(target.id, `-${dmg}`, '#c084fc');







                        floatText('battle-player', `+${leechHp} HP`, '#4ade80');







                    }







                    if (Math.random() <= (action.chance || 0.7) && typeof applyStatus === 'function') {







                        applyStatus(target, 'blind', 2);







                        logMsg(`👁️ ${target.name} is Blinded!`, '#c084fc');







                    }







                }







                break;







            }







            case 'heal_cc': {







                // Glacia Fox: Glacial Soothe (Heal HP 10%, Heal MP 15, Freeze CC)







                let healHp = Math.max(5, Math.round(pStats.maxHp * (action.healHpPct / 100)));







                let healMp = action.healMp || 15;







                pStats.hp = Math.min(pStats.maxHp, pStats.hp + healHp);







                pStats.mp = Math.min(pStats.maxMp, pStats.mp + healMp);







                player.baseStats.hp = pStats.hp;







                player.baseStats.mp = pStats.mp;







                logMsg(`🐾 <b>${pet.name}</b> uses <b>${action.name}</b>, restoring <b>+${healHp} HP</b> and <b>+${healMp} MP</b>!`, '#93c5fd');







                if (typeof floatText === 'function') {







                    floatText('battle-player', `+${healHp} HP / +${healMp} MP`, '#93c5fd');







                }







                if (target && Math.random() <= (action.ccChance || 0.5) && typeof applyStatus === 'function') {







                    applyStatus(target, 'freeze', 1);







                    logMsg(`❄️ ${target.name} is Frozen!`, '#93c5fd');







                }







                break;







            }







            case 'lightning_splash': {







                // Storm Gryphon: Chain Surge (Primary damage + 50% splash, Shock)







                if (target) {







                    let mainDmg = Math.max(8, Math.round((pStats.atk * 0.9) + (action.power * 0.7)));







                    target.hp = Math.max(0, target.hp - mainDmg);







                    logMsg(`🐾 <b>${pet.name}</b> unleashes <b>${action.name}</b> dealing <b>${mainDmg}</b> shock damage to ${target.name}!`, '#facc15');







                    if (typeof floatText === 'function') floatText(target.id, `-${mainDmg}`, '#facc15');







                    if (typeof triggerElementalImpact === 'function') triggerElementalImpact(target.id, 'Wind');







                    if (Math.random() <= (action.shockChance || 0.8) && typeof applyStatus === 'function') {







                        applyStatus(target, 'shock', 2);







                    }















                    let splashDmg = Math.max(3, Math.round(mainDmg * (action.splashPct || 0.5)));







                    battleState.enemies.filter(e => e.hp > 0 && e !== target).forEach(other => {







                        other.hp = Math.max(0, other.hp - splashDmg);







                        if (typeof floatText === 'function') floatText(other.id, `-${splashDmg}`, '#facc15');







                    });







                }







                break;







            }







            case 'execute_damage': {







                // Void Stalker: Void Strike (70 power, if target <= 20% HP deal 2.5x)







                if (target) {







                    let isExecute = (target.hp / target.maxHp <= (action.executeThreshold || 0.20));







                    let mult = isExecute ? 2.5 : 1.0;







                    let dmg = Math.max(10, Math.round(((pStats.atk * 1.0) + (action.power * 0.8)) * mult));







                    target.hp = Math.max(0, target.hp - dmg);







                    logMsg(`🐾 <b>${pet.name}</b> strikes with <b>${action.name}</b> dealing <b>${dmg}</b> ${isExecute ? 'CRITICAL EXECUTE ' : ''}damage!`, '#a855f7');







                    if (typeof floatText === 'function') floatText(target.id, isExecute ? `EXECUTE -${dmg}!` : `-${dmg}`, '#a855f7');







                    if (target.hp <= 0 && isApex) {







                        logMsg(`💀 Reaper Instinct: Void Stalker executed target! Skill cooldowns reset!`, '#a855f7');







                    }







                }







                break;







            }







            case 'aoe_fire': {







                // Ignis Phoenix: Inferno Nova (AoE 60 power + burn all)







                let baseDmg = Math.max(8, Math.round(((pStats.atk + pStats.matk) * 0.6) + (action.power * 0.6)));







                logMsg(`🐾 <b>${pet.name}</b> unleashes <b>${action.name}</b> upon all enemies!`, '#ef4444');







                battleState.enemies.filter(e => e.hp > 0).forEach(e => {







                    e.hp = Math.max(0, e.hp - baseDmg);







                    if (typeof floatText === 'function') floatText(e.id, `-${baseDmg}`, '#ef4444');







                    if (typeof triggerElementalImpact === 'function') triggerElementalImpact(e.id, 'Fire');







                    if (action.burnAll && typeof applyStatus === 'function') applyStatus(e, 'burn', 3);







                });







                break;







            }







        }







    }























// Mobile Web Audio API Unlock on First Touch







function setupMobileAudioUnlock() {







    const unlockAudio = () => {







        if (typeof audioCtx !== 'undefined' && audioCtx && audioCtx.state === 'suspended') {







            audioCtx.resume();







        }







        window.removeEventListener('touchstart', unlockAudio);







        window.removeEventListener('pointerdown', unlockAudio);







    };







    window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });







    window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });







}







if (typeof window !== 'undefined') {







    setupMobileAudioUnlock();







}















/* =========================================================================







   ADVENTURER'S CODEX & COMPANION PET DROP SYSTEM







   ========================================================================= */















function closeModal(modalId) {







    if (modalId) {







        const m = document.getElementById(modalId);







        if (m) m.classList.remove('active');







    } else {







        closeAllModals();







    }







}







window.closeModal = closeModal;















// Companion Pet Drop System







function checkCompanionPetDrop(areaId, isBoss) {







    if (!player.pets) player.pets = { unlocked: ['sprout_slimelet'], active: [null, null], levels: {} };







    if (!Array.isArray(player.pets.unlocked)) player.pets.unlocked = ['sprout_slimelet'];







    const unlocked = player.pets.unlocked;







    let candidate = null;







    // Area 1 & 2 regular/boss drops







    if ((areaId === 'area_1' || areaId === 'area_2') && !unlocked.includes('cinder_pup') && Math.random() < 0.05) {







        candidate = 'cinder_pup';







    } else if (areaId === 'area_2' && isBoss && !unlocked.includes('aqua_drake') && (Math.random() < 0.20 || !player.questStats || player.questStats.bossesDefeated <= 1)) {







        candidate = 'aqua_drake';







    } else if (areaId === 'area_3' && !unlocked.includes('storm_gryphon') && Math.random() < 0.10) {







        candidate = 'storm_gryphon';







    } else if (areaId === 'area_4' && !unlocked.includes('obsidian_tortoise') && Math.random() < (isBoss ? 0.25 : 0.08)) {







        candidate = 'obsidian_tortoise';







    } else if (areaId === 'area_4' && isBoss && !unlocked.includes('ignis_phoenix') && Math.random() < 0.03) {







        candidate = 'ignis_phoenix';







    } else if (areaId === 'area_5' && isBoss && !unlocked.includes('void_leviathan') && Math.random() < 0.01) {







        candidate = 'void_leviathan';







    } else if (areaId === 'area_6' && !unlocked.includes('lumina_sprite') && Math.random() < (isBoss ? 0.25 : 0.08)) {







        candidate = 'lumina_sprite';







    } else if (areaId === 'area_7' && !unlocked.includes('spark_hound') && Math.random() < (isBoss ? 0.20 : 0.06)) {







        candidate = 'spark_hound';







    } else if (areaId === 'area_8' && !unlocked.includes('glacia_kitsune') && Math.random() < (isBoss ? 0.20 : 0.06)) {







        candidate = 'glacia_kitsune';







    } else if (areaId === 'area_9' && !unlocked.includes('cinder_gargoyle') && Math.random() < (isBoss ? 0.20 : 0.05)) {







        candidate = 'cinder_gargoyle';







    } else if (areaId === 'area_10' && !unlocked.includes('chronos_sprite') && Math.random() < (isBoss ? 0.15 : 0.03)) {







        candidate = 'chronos_sprite';







    }







    if (candidate && PETS_DB[candidate]) {







        unlockCompanionPet(candidate);







    }







}







window.checkCompanionPetDrop = checkCompanionPetDrop;















function unlockCompanionPet(petId) {







    if (!player.pets) player.pets = { unlocked: ['sprout_slimelet'], active: [null, null], levels: {} };







    if (!Array.isArray(player.pets.unlocked)) player.pets.unlocked = ['sprout_slimelet'];







    if (!player.pets.unlocked.includes(petId)) {







        player.pets.unlocked.push(petId);







        if (!player.pets.levels) player.pets.levels = {};







        if (!player.pets.levels[petId]) player.pets.levels[petId] = { level: 1, exp: 0 };







        const pet = PETS_DB[petId];







        if (typeof playSFX === 'function') playSFX('chest_reveal_legendary');







        if (pet) {







            logMsg(`🐾 <b>NEW COMPANION UNLOCKED:</b> ${pet.name} (${pet.rarity}) has joined you!`, "#4ade80");







            showToast("🐾 New Companion!", `Unlocked ${pet.name} (${pet.rarity})! Check Familiar Sanctuary.`, "quest", 6000);







        }







        if (typeof renderPetsModal === 'function') renderPetsModal();







        if (typeof renderCodexContent === 'function' && document.getElementById('modal-codex') && document.getElementById('modal-codex').classList.contains('active')) {







            renderCodexContent();







        }







    }







}







window.unlockCompanionPet = unlockCompanionPet;















function triggerSpireMilestones(floor) {







    if (!player.pets) player.pets = { unlocked: ['sprout_slimelet'], active: [null, null], levels: {} };







    if (!Array.isArray(player.pets.unlocked)) player.pets.unlocked = ['sprout_slimelet'];







    if (floor >= 20 && !player.pets.unlocked.includes('astral_sprite')) {







        unlockCompanionPet('astral_sprite');







    }







    if (floor >= 35 && !player.pets.unlocked.includes('ignis_phoenix')) {







        unlockCompanionPet('ignis_phoenix');







    }







    if (floor >= 50 && !player.pets.unlocked.includes('void_leviathan')) {







        unlockCompanionPet('void_leviathan');







    }







}







window.triggerSpireMilestones = triggerSpireMilestones;















let currentCodexTab = 'pets';















function openCodexModal(tab) {







    if (tab) currentCodexTab = tab;







    openModal('modal-codex');







    switchCodexTab(currentCodexTab);







}







window.openCodexModal = openCodexModal;















function switchCodexTab(tab) {







    currentCodexTab = tab || 'pets';







    document.querySelectorAll('.codex-tab').forEach(btn => {







        btn.classList.remove('active');







        const onclickAttr = btn.getAttribute('onclick') || '';







        if (onclickAttr.includes(`'${currentCodexTab}'`)) {







            btn.classList.add('active');







        }







    });







    renderCodexContent();







}







window.switchCodexTab = switchCodexTab;















function renderCodexContent() {







    const container = document.getElementById('codex-content');







    if (!container) return;















    if (currentCodexTab === 'pets') {







        let petKeys = window.CODEX_PET_KEYS || [







            'sprout_slimelet', 'cinder_pup', 'aqua_drake', 'storm_gryphon',







            'obsidian_tortoise', 'astral_sprite', 'ignis_phoenix', 'void_leviathan'







        ];







        







        let unlocked = (player && player.pets && Array.isArray(player.pets.unlocked)) ? player.pets.unlocked : ['sprout_slimelet'];















        let html = `







            <div class="codex-card" style="border-left: 4px solid #4ade80; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(15, 23, 42, 0.9)); margin-bottom: 12px;">







                <div style="font-size: 14px; font-weight: bold; color: #4ade80; margin-bottom: 4px;">🐾 Companion Familiar Guide & Bonding Mechanics</div>







                <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">







                    • <b>2-Turn Action Cadence:</b> Equipped companions execute tactical actions every 2 turns in battle without consuming hero MP or turn time.<br>







                    • <b>Bond Progression:</b> Companions earn <b>+15 Bond EXP</b> per battle victory while equipped, or through training snacks. Level 10 unlocks their signature <b>Apex Perk</b>!<br>







                    • <b>Dual-Companion Mastery:</b> Reach <b>Hero Level 25</b> (Master Class) to unlock the 2nd companion battle slot for dual passive and tactical synergies.







                </div>







            </div>







            <div class="codex-pet-grid">







        `;















        petKeys.forEach(key => {







            const pet = PETS_DB[key];







            if (!pet) return;







            const isOwned = unlocked.includes(key);







            const rarityColors = {







                'Common': '#94a3b8',







                'Uncommon': '#4ade80',







                'Rare': '#38bdf8',







                'Epic': '#c084fc',







                'Legendary': '#f59e0b',







                'Mythic': '#ec4899'







            };







            const rColor = rarityColors[pet.rarity] || '#fbbf24';















            const elemColors = {







                'Fire': '#ef4444',







                'Water': '#38bdf8',







                'Wind': '#22c55e',







                'Earth': '#eab308',







                'Light': '#fef08a',







                'Dark': '#a855f7'







            };







            const eColor = elemColors[pet.element] || '#ffffff';















            let passiveStr = Object.entries(pet.passive || {}).map(([k, v]) => {







                const labelMap = {







                    atkPct: `+${v}% ATK`,







                    matkPct: `+${v}% MATK`,







                    defPct: `+${v}% DEF`,







                    mdefPct: `+${v}% MDEF`,







                    maxHpPct: `+${v}% Max HP`,







                    maxMpPct: `+${v}% Max MP`,







                    spd: `+${v} SPD`,







                    spdPct: `+${v}% SPD`,







                    crit: `+${v}% Crit`,







                    critPct: `+${v}% Crit`







                };







                return labelMap[k] || `+${v} ${k}`;







            }).join(', ');















            html += `







                <div class="codex-card" style="display: flex; flex-direction: column; justify-content: space-between; border-color: ${isOwned ? '#334155' : '#27272a'}; opacity: ${isOwned ? '1.0' : '0.9'};">







                    <div>







                        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">







                            <div style="width: 48px; height: 48px; min-width: 48px; background: rgba(0,0,0,0.5); border-radius: 8px; border: 1px solid #334155; padding: 4px; display: flex; align-items: center; justify-content: center;">







                                ${pet.sprite}







                            </div>







                            <div style="flex: 1;">







                                <div style="display: flex; justify-content: space-between; align-items: center;">







                                    <b style="font-size: 15px; color: #fff;">${pet.name}</b>







                                    ${isOwned ? '<span class="codex-badge-owned">✔ Unlocked</span>' : '<span class="codex-badge-unowned">🔒 Undiscovered</span>'}







                                </div>







                                <div style="display: flex; gap: 6px; margin-top: 3px;">







                                    <span style="font-size: 10.5px; font-weight: bold; color: ${eColor}; background: rgba(0,0,0,0.4); padding: 1px 6px; border-radius: 4px; border: 1px solid ${eColor}44;">${pet.element}</span>







                                    <span style="font-size: 10.5px; font-weight: bold; color: ${rColor}; background: rgba(0,0,0,0.4); padding: 1px 6px; border-radius: 4px; border: 1px solid ${rColor}44;">${pet.rarity}</span>







                                </div>







                            </div>







                        </div>







                        <div style="font-size: 11.5px; color: #94a3b8; margin-bottom: 8px; font-style: italic;">







                            "${pet.desc}"







                        </div>







                        <div style="font-size: 12px; margin-bottom: 5px;">







                            <span style="color: #60a5fa; font-weight: bold;">Passive:</span> <span style="color: #e2e8f0;">${passiveStr || 'None'}</span>







                        </div>







                        <div style="font-size: 12px; margin-bottom: 5px;">







                            <span style="color: #facc15; font-weight: bold;">Active (2-turn):</span> <span style="color: #e2e8f0;">${pet.action ? pet.action.name : 'Attack'}</span>







                        </div>







                        <div style="font-size: 11.5px; margin-bottom: 6px; background: rgba(168, 85, 247, 0.1); border-left: 3px solid #c084fc; padding: 4px 6px; border-radius: 0 4px 4px 0;">







                            <span style="color: #c084fc; font-weight: bold;">👑 Apex Perk (Lv 10):</span> <span style="color: #e2e8f0;">${pet.apexPerk || 'Apex Synergy'}</span>







                        </div>







                    </div>







                    <div style="margin-top: 8px; padding: 6px 10px; background: rgba(251, 191, 36, 0.1); border: 1px solid #fbbf24; border-radius: 6px; font-size: 11.5px; color: #fde047;">







                        📍 <b>Where to Find:</b> ${pet.obtainHint || 'Available in adventures.'}







                    </div>







                </div>







            `;







        });















        html += `</div>`;







        container.innerHTML = html;







        return;







    }















    if (currentCodexTab === 'combat') {







        container.innerHTML = `







            <div class="codex-card" style="border-left: 4px solid #ef4444; margin-bottom: 12px;">







                <div style="font-size: 15px; font-weight: bold; color: #f87171; margin-bottom: 8px;">⚔️ 5-Element Weakness Cycle & Affinities</div>







                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; font-size: 12.5px; line-height: 1.6; margin-bottom: 10px;">







                    <div style="background: rgba(0,0,0,0.4); padding: 8px 12px; border-radius: 6px; border: 1px solid #334155;">







                        <span style="color: #ef4444; font-weight: bold;">🔥 Fire</span> &rarr; <span style="color: #4ade80; font-weight: bold;">💨 Wind</span> <span style="color: #facc15; font-size: 11px;">(+50% DMG)</span><br>







                        <span style="color: #4ade80; font-weight: bold;">💨 Wind</span> &rarr; <span style="color: #eab308; font-weight: bold;">🌿 Earth</span> <span style="color: #facc15; font-size: 11px;">(+50% DMG)</span><br>







                        <span style="color: #eab308; font-weight: bold;">🌿 Earth</span> &rarr; <span style="color: #38bdf8; font-weight: bold;">💧 Water</span> <span style="color: #facc15; font-size: 11px;">(+50% DMG)</span><br>







                        <span style="color: #38bdf8; font-weight: bold;">💧 Water</span> &rarr; <span style="color: #ef4444; font-weight: bold;">🔥 Fire</span> <span style="color: #facc15; font-size: 11px;">(+50% DMG)</span>







                    </div>







                    <div style="background: rgba(0,0,0,0.4); padding: 8px 12px; border-radius: 6px; border: 1px solid #334155;">







                        <span style="color: #fef08a; font-weight: bold;">☀️ Light</span> &harr; <span style="color: #c084fc; font-weight: bold;">🌑 Dark</span> <span style="color: #facc15; font-size: 11px;">(+50% Reciprocal)</span><br>







                        <span style="color: #cbd5e1; font-weight: bold;">⚔️ Physical:</span> Deals neutral baseline damage against all affinities.<br>







                        <span style="color: #94a3b8; font-size: 11.5px;">Resisted element strikes deal -25% reduced damage.</span>







                    </div>







                </div>







            </div>















            <div class="codex-card" style="border-left: 4px solid #38bdf8; margin-bottom: 12px;">







                <div style="font-size: 15px; font-weight: bold; color: #38bdf8; margin-bottom: 6px;">⚡ Speed & Initiative Queue</div>







                <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">







                    • Turn cadence is governed dynamically by combatant <b>Speed (SPD)</b>. Higher speed allows your hero to act before foes and cycle skill cooldowns faster.<br>







                    • Haste buffs and Slow debuffs shift the initiative order in real time. Companions take their cadence action on the player's turn every 2 turns.







                </div>







            </div>















            <div class="codex-card" style="border-left: 4px solid #facc15; margin-bottom: 12px;">







                <div style="font-size: 15px; font-weight: bold; color: #fde047; margin-bottom: 8px;">🧪 Tactical Status Ailments Glossary</div>







                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 8px; font-size: 12px;">







                    <div style="background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 6px; border: 1px solid #27272a;"><span style="color: #ef4444; font-weight: bold;">🩸 Bleed:</span> Physical damage over time based on user ATK. Penetrates partial armor.</div>







                    <div style="background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 6px; border: 1px solid #27272a;"><span style="color: #22c55e; font-weight: bold;">🧪 Poison:</span> Nature damage ticking at turn start. Stacks multiple times ignoring armor.</div>







                    <div style="background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 6px; border: 1px solid #27272a;"><span style="color: #f97316; font-weight: bold;">🔥 Burn:</span> Scorching damage over time. Softens defenses, reducing target DEF by 15%.</div>







                    <div style="background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 6px; border: 1px solid #27272a;"><span style="color: #eab308; font-weight: bold;">💫 Stun:</span> Incapacitates target completely, skipping their next turn.</div>







                    <div style="background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 6px; border: 1px solid #27272a;"><span style="color: #38bdf8; font-weight: bold;">❄️ Freeze:</span> Freezes target solid; subsequent physical or shatter strikes deal +30% bonus damage.</div>







                    <div style="background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 6px; border: 1px solid #27272a;"><span style="color: #94a3b8; font-weight: bold;">👁️ Blind:</span> Impairs vision, causing 50% of incoming physical strikes to miss completely.</div>







                    <div style="background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 6px; border: 1px solid #27272a;"><span style="color: #facc15; font-weight: bold;">⚡ Shock:</span> Electrifies target; attacks against shocked foes deal 50% splash damage to nearby enemies.</div>







                    <div style="background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 6px; border: 1px solid #27272a;"><span style="color: #713f12; font-weight: bold;">💀 Decay:</span> Necrotic curse reducing all incoming healing by 50% while dealing damage over time.</div>







                    <div style="background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 6px; border: 1px solid #27272a;"><span style="color: #60a5fa; font-weight: bold;">🛡️ Divine Barrier:</span> Sacred protective shield absorbing incoming damage up to its total capacity.</div>







                    <div style="background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 6px; border: 1px solid #27272a;"><span style="color: #c084fc; font-weight: bold;">🌫️ Mirage:</span> Evasive afterimage granting guaranteed 100% dodge on the next direct physical strike.</div>







                </div>







            </div>















            <div class="codex-card" style="border-left: 4px solid #a855f7; margin-bottom: 6px;">







                <div style="font-size: 15px; font-weight: bold; color: #c084fc; margin-bottom: 6px;">👑 Gatekeeper Boss CC Immunities</div>







                <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">







                    • Major Zone Bosses and Gatekeepers possess Crowd Control Resilience. Direct <b>Stun</b> and <b>Freeze</b> effects do not cause them to lose their turn; instead, they automatically convert into a <b>Slow</b> debuff (-25% SPD) for 2 turns, allowing tactical counterplay while keeping encounters fierce and dynamic!







                </div>







            </div>







        `;







        return;







    }















    if (currentCodexTab === 'blacksmith') {







        container.innerHTML = `







            <div class="codex-card" style="border-left: 4px solid #fb923c; margin-bottom: 12px;">







                <div style="font-size: 15px; font-weight: bold; color: #fb923c; margin-bottom: 8px;">🔨 Salvage Station Yields</div>







                <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">







                    Turn surplus equipment into valuable crafting and upgrading components at the Town Blacksmith:<br>







                    • <b>Common & Uncommon:</b> Yields <b>Iron Scraps</b> (used for pet bonding & basic upgrades) and <b>Elemental Dust</b>.<br>







                    • <b>Rare & Epic:</b> Yields high amounts of <b>Elemental Dust</b> and <b>Refining Stones</b>.<br>







                    • <b>Legendary & Mythic:</b> Yields prized <b>Void Shards</b> and <b>Astral Remnants</b> required for master forging.<br>







                    <span style="color: #fbbf24; font-size: 11.5px;">💡 Tip: Click the 🔒 Lock icon on any gear piece in your inventory to safeguard it from batch junk selling or accidental salvage.</span>







                </div>







            </div>















            <div class="codex-card" style="border-left: 4px solid #38bdf8; margin-bottom: 12px;">







                <div style="font-size: 15px; font-weight: bold; color: #38bdf8; margin-bottom: 8px;">⚡ Upgrade Forge Scaling (+1 to +5)</div>







                <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">







                    Reinforce any weapon, armor piece, or accessory up to +5 at the Blacksmith Forge:<br>







                    • <b>Scaling Formula:</b> Each forge rank grants a cumulative <b>+15% base stat increase</b>:<br>







                    &nbsp;&nbsp;&bull; <b>+1:</b> +15% base stats | <b>+2:</b> +30% base stats | <b>+3:</b> +45% base stats<br>







                    &nbsp;&nbsp;&bull; <b>+4:</b> +60% base stats | <b>+5:</b> <b>+75% maximum base stat bonus!</b><br>







                    • Upgrade costs require Gold and materials (Iron Scraps, Elemental Dust, Void Shards) scaling with item tier.







                </div>







            </div>















            <div class="codex-card" style="border-left: 4px solid #c084fc; margin-bottom: 12px;">







                <div style="font-size: 15px; font-weight: bold; color: #c084fc; margin-bottom: 8px;">✨ Affix Reforging Rules</div>







                <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">







                    • Available exclusively for <b>Rare, Epic, Legendary, and Mythic</b> equipment.<br>







                    • Pay Elemental Dust and Gold to re-roll all secondary affixes (Crit Chance, Speed, Elemental Resist, Lifesteal, MP Regen).<br>







                    • Keep re-rolling until your gear has the ideal stat rolls tailored to your class and keystone build!







                </div>







            </div>















            <div class="codex-card" style="border-left: 4px solid #eab308; margin-bottom: 6px;">







                <div style="font-size: 15px; font-weight: bold; color: #fde047; margin-bottom: 8px;">💎 Gear Rarity Tiers</div>







                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; font-size: 12px; text-align: center;">







                    <div style="background: rgba(148, 163, 184, 0.1); border: 1px solid #94a3b8; border-radius: 6px; padding: 6px;"><b style="color: #94a3b8;">Common</b><br><span style="font-size: 11px; color: #cbd5e1;">0 Affixes (1.0x)</span></div>







                    <div style="background: rgba(74, 222, 128, 0.1); border: 1px solid #4ade80; border-radius: 6px; padding: 6px;"><b style="color: #4ade80;">Uncommon</b><br><span style="font-size: 11px; color: #cbd5e1;">1 Affix (1.25x)</span></div>







                    <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid #38bdf8; border-radius: 6px; padding: 6px;"><b style="color: #38bdf8;">Rare</b><br><span style="font-size: 11px; color: #cbd5e1;">2 Affixes (1.6x)</span></div>







                    <div style="background: rgba(192, 132, 252, 0.1); border: 1px solid #c084fc; border-radius: 6px; padding: 6px;"><b style="color: #c084fc;">Epic</b><br><span style="font-size: 11px; color: #cbd5e1;">3 Affixes (2.0x)</span></div>







                    <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 6px; padding: 6px;"><b style="color: #f59e0b;">Legendary</b><br><span style="font-size: 11px; color: #cbd5e1;">4 Affixes (2.6x)</span></div>







                    <div style="background: rgba(236, 72, 153, 0.1); border: 1px solid #ec4899; border-radius: 6px; padding: 6px;"><b style="color: #ec4899;">Mythic</b><br><span style="font-size: 11px; color: #cbd5e1;">4+ Affixes (3.5x)</span></div>







                </div>







            </div>







        `;







        return;







    }















    if (currentCodexTab === 'progression') {







        container.innerHTML = `







            <div class="codex-card" style="border-left: 4px solid #3b82f6; margin-bottom: 12px;">







                <div style="font-size: 15px; font-weight: bold; color: #60a5fa; margin-bottom: 8px;">🌟 Skill Tree 2.0 & Level 50 Hard Cap</div>







                <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">







                    • <b>1 Skill Orb per Level:</b> Heroes gain 1 Skill Orb with each level up to the absolute <b>Level 50 Hard Cap</b> (50 points total).<br>







                    • <b>4 Distinct Branches:</b> Specialize across <b>Damage</b> (Physical/Burst), <b>Sustain</b> (Shields/Healing), <b>Arcana</b> (Spells/Mana), and <b>General</b> (Loot/Fortune/Speed).<br>







                    • <b>Milestone Unlock Prerequisites:</b><br>







                    &nbsp;&nbsp;&bull; <b>Tier 1:</b> 0 points required (available immediately).<br>







                    &nbsp;&nbsp;&bull; <b>Tier 2:</b> Requires 5 points invested in that branch.<br>







                    &nbsp;&nbsp;&bull; <b>Tier 3 Keystones:</b> Requires 15 points invested in that branch to unlock supreme build-defining Keystones!<br>







                    • <b>Instant Respec:</b> Click "Reset Tree" anytime in the Skill Tree modal to refund 100% of points for free.







                </div>







            </div>















            <div class="codex-card" style="border-left: 4px solid #c084fc; margin-bottom: 12px;">







                <div style="font-size: 15px; font-weight: bold; color: #c084fc; margin-bottom: 8px;">👑 Class Advancement Milestones</div>







                <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">







                    Visit the <b>Class Sanctum</b> in Town to advance your hero at major level thresholds:<br>







                    • <b>Level 10 (Tier 1 Specialization):</b> Choose your subclass path (Warrior &rarr; Paladin or Berserker; Mage &rarr; Archmage or Necromancer; Rogue &rarr; Assassin or Shadowblade).<br>







                    • <b>Level 25 (Tier 2 Mastery):</b> Unlocks Master Class abilities and unlocks the <b>2nd Companion Pet Slot</b> in battle!<br>







                    • <b>Level 50 (Tier 3 Apex):</b> Unlocks Apex Transcendence, empowering all Keystone and core abilities to maximum potency.







                </div>







            </div>















            <div class="codex-card" style="border-left: 4px solid #f59e0b; margin-bottom: 6px;">







                <div style="font-size: 15px; font-weight: bold; color: #fbbf24; margin-bottom: 8px;">🌀 The Infinite Spire & Astral Altar</div>







                <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">







                    Test your endurance in the endless tower challenge:<br>







                    • <b>Permanent Elevators:</b> Elevators are permanently unlocked every 10 floors (Floor 10, 20, 30, 40, 50...). Return directly to your highest checkpoint anytime!<br>







                    • <b>Astral Shards:</b> Each cleared floor awards Astral Shards scaling with tower depth.<br>







                    • <b>The Astral Altar:</b> Spend Astral Shards to purchase permanent Tomes of Might, Fortitude, and Wisdom that boost base stats across all runs.<br>







                    • <b>Spire Milestone Familiars:</b><br>







                    &nbsp;&nbsp;&bull; <b>Floor 20 Victory:</b> Guaranteed unlock of <b style="color: #fef08a;">Astral Sprite</b> (Epic Light Companion).<br>







                    &nbsp;&nbsp;&bull; <b>Floor 35 Victory:</b> Guaranteed unlock of <b style="color: #f59e0b;">Ignis Phoenix</b> (Legendary Fire Companion).<br>







                    &nbsp;&nbsp;&bull; <b>Floor 50 Victory:</b> Guaranteed unlock of <b style="color: #ec4899;">Void Leviathan</b> (Mythic Dark Companion).







                </div>







            </div>







        `;







        return;







    }















    if (currentCodexTab === 'bestiary') {







        const allMonsters = getAllBestiaryMonsters();







        const totalMonsters = allMonsters.length;







        let discoveredCount = 0;







        let silverCount = 0;







        let goldCount = 0;















        allMonsters.forEach(m => {







            const kills = (player && player.bestiary && player.bestiary[m.name]) || 0;







            const reqSilver = m.isBoss ? 10 : 50;







            const reqGold = m.isBoss ? 25 : 100;







            if (kills >= 1) discoveredCount++;







            if (kills >= reqSilver) silverCount++;







            if (kills >= reqGold) goldCount++;







        });















        const progressPct = totalMonsters > 0 ? Math.round((discoveredCount / totalMonsters) * 100) : 0;















        container.innerHTML = `







            <div class="bestiary-header">







                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">







                    <div>







                        <span style="font-size: 15px; font-weight: bold; color: #fde047;">📖 Bestiary & Monster Lore Compendium</span>







                        <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">







                            Cataloging all ${totalMonsters} species across Areas 1–10. Defeat monsters in combat to reveal stats, drop tables, and unlock mastery perks.







                        </div>







                    </div>







                    <div style="display: flex; gap: 10px; font-size: 11px;">







                        <span style="color: #38bdf8; font-weight: bold;">👁️ Discovered: ${discoveredCount}/${totalMonsters}</span>







                        <span style="color: #cbd5e1; font-weight: bold;">⚔️ Silver: ${silverCount}/${totalMonsters}</span>







                        <span style="color: #f59e0b; font-weight: bold;">👑 Gold: ${goldCount}/${totalMonsters}</span>







                    </div>







                </div>







                <div class="bestiary-progress-bar">







                    <div class="bestiary-progress-fill" style="width: ${progressPct}%;"></div>







                </div>







                <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b;">







                    <span>Fog-of-War Discovery: ${progressPct}%</span>







                    <span>Silver: +5% DMG (50 / 10 Boss) &bull; Gold: +10% Drops (100 / 25 Boss)</span>







                </div>







            </div>















            <div class="bestiary-controls">







                <select id="bestiary-zone-filter" class="bestiary-select" onchange="filterBestiary()">







                    <option value="all" ${window.bestiaryFilterZone === 'all' ? 'selected' : ''}>All Areas (10 Zones)</option>







                    <option value="area_1" ${window.bestiaryFilterZone === 'area_1' ? 'selected' : ''}>Area 1: Whispering Woods</option>







                    <option value="area_2" ${window.bestiaryFilterZone === 'area_2' ? 'selected' : ''}>Area 2: Sunken Caverns</option>







                    <option value="area_3" ${window.bestiaryFilterZone === 'area_3' ? 'selected' : ''}>Area 3: Howling Peaks</option>







                    <option value="area_4" ${window.bestiaryFilterZone === 'area_4' ? 'selected' : ''}>Area 4: Infernal Caldera</option>







                    <option value="area_5" ${window.bestiaryFilterZone === 'area_5' ? 'selected' : ''}>Area 5: Abyssal Void</option>







                    <option value="area_6" ${window.bestiaryFilterZone === 'area_6' ? 'selected' : ''}>Area 6: Luminous Sanctuary</option>







                    <option value="area_7" ${window.bestiaryFilterZone === 'area_7' ? 'selected' : ''}>Area 7: Thunderous Steppes</option>







                    <option value="area_8" ${window.bestiaryFilterZone === 'area_8' ? 'selected' : ''}>Area 8: Glacial Frostpeaks</option>







                    <option value="area_9" ${window.bestiaryFilterZone === 'area_9' ? 'selected' : ''}>Area 9: Molten Abyss</option>







                    <option value="area_10" ${window.bestiaryFilterZone === 'area_10' ? 'selected' : ''}>Area 10: The Celestial Void Rift</option>







                    <option value="bosses" ${window.bestiaryFilterZone === 'bosses' ? 'selected' : ''}>👑 Gatekeeper Bosses Only</option>







                </select>







                <input type="text" id="bestiary-search" class="bestiary-search" placeholder="🔍 Search monster by name..." value="${window.bestiarySearchText || ''}" oninput="filterBestiary()" style="flex: 1; min-width: 180px;">







            </div>















            <div id="bestiary-grid" class="bestiary-grid"></div>







        `;















        renderBestiaryGrid(window.bestiaryFilterZone || 'all', window.bestiarySearchText || '');







        return;







    }















}







window.renderCodexContent = renderCodexContent;















/* =========================================================================







   CHAPTER 5: BESTIARY COMPENDIUM ENGINE







   ========================================================================= */















function getAllBestiaryMonsters() {







    const list = [];







    const areaKeys = (typeof getAllAreaKeys === 'function') ? getAllAreaKeys() : [







        'area_1', 'area_2', 'area_3', 'area_4', 'area_5',







        'area_6', 'area_7', 'area_8', 'area_9', 'area_10'







    ];







    areaKeys.forEach(aKey => {







        const area = (typeof AREAS_DB !== 'undefined') && AREAS_DB[aKey];







        if (!area) return;







        if (area.regularEnemies && Array.isArray(area.regularEnemies)) {







            area.regularEnemies.forEach(e => {







                list.push({ ...e, areaId: aKey, areaName: area.name, isBoss: false });







            });







        }







        if (area.boss && area.boss.name) {







            list.push({ ...area.boss, areaId: aKey, areaName: area.name, isBoss: true });







        }







    });







    return list;







}







window.getAllBestiaryMonsters = getAllBestiaryMonsters;















function filterBestiary() {







    const zoneSelect = document.getElementById('bestiary-zone-filter');







    const searchInput = document.getElementById('bestiary-search');







    const selectedZone = zoneSelect ? zoneSelect.value : 'all';







    const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';







    window.bestiaryFilterZone = selectedZone;







    window.bestiarySearchText = searchQuery;







    renderBestiaryGrid(selectedZone, searchQuery);







}







window.filterBestiary = filterBestiary;















function renderBestiaryGrid(zoneFilter = 'all', searchText = '') {







    const grid = document.getElementById('bestiary-grid');







    if (!grid) return;







    grid.innerHTML = '';















    let monsters = getAllBestiaryMonsters();















    // Zone filter







    if (zoneFilter === 'bosses') {







        monsters = monsters.filter(m => m.isBoss);







    } else if (zoneFilter !== 'all') {







        monsters = monsters.filter(m => m.areaId === zoneFilter);







    }















    // Search filter by monster name







    if (searchText) {







        const query = searchText.toLowerCase();







        monsters = monsters.filter(m => m.name.toLowerCase().includes(query));







    }















    if (monsters.length === 0) {







        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 24px; font-style: italic;">No monsters found matching current filters.</div>';







        return;







    }















    monsters.forEach(m => {







        const kills = (player && player.bestiary && player.bestiary[m.name]) || 0;







        const isBoss = m.isBoss;







        const reqSilver = isBoss ? 10 : 50;







        const reqGold = isBoss ? 25 : 100;







        const isSilver = kills >= reqSilver;







        const isGold = kills >= reqGold;







        const isDiscovered = kills >= 1;















        let cardClass = 'monster-card';







        if (isGold) cardClass += ' mastery-gold';







        else if (isSilver) cardClass += ' mastery-silver';















        let spriteSvg = (typeof SVG_SPRITES !== 'undefined' && (SVG_SPRITES[m.name] || SVG_SPRITES['Stone Golem'])) || '';















        const card = document.createElement('div');







        card.className = cardClass;







        card.dataset.monsterName = m.name;







        card.dataset.areaId = m.areaId;















        if (!isDiscovered) {







            // Tier 0: Undiscovered (Fog-of-War Silhouette)







            card.innerHTML = `







                <div style="display: flex; justify-content: space-between; align-items: center;">







                    <span style="font-size: 13px; font-weight: bold; color: #94a3b8;">???</span>







                    <span style="font-size: 10px; color: #64748b;">${m.areaName}</span>







                </div>







                <div class="entity-sprite monster-silhouette" style="width: 60px; height: 60px; margin: 4px auto;">







                    ${spriteSvg}







                </div>







                <div style="display: flex; justify-content: space-around; font-size: 11px; color: #64748b; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 4px;">







                    <span>Lv. ???</span>







                    <span>Element: ???</span>







                    <span>AI: ???</span>







                </div>







                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; text-align: center; font-size: 10px; background: rgba(15,23,42,0.4); padding: 4px; border-radius: 4px; color: #475569;">







                    <div>HP: ???</div>







                    <div>ATK: ???</div>







                    <div>DEF: ???</div>







                    <div>MDEF: ???</div>







                    <div>SPD: ???</div>







                </div>







                <div style="font-size: 11px; color: #475569; text-align: center; font-style: italic; padding: 6px 0;">







                    🔒 Undiscovered (Defeat in combat to reveal stats and weaknesses)







                </div>







            `;







        } else {







            // Tier 1+: Encountered







            let badgeHtml = '';







            if (isGold) {







                badgeHtml = `<span class="mastery-badge mastery-badge-gold">👑 Apex Master (+5% DMG, +10% Drops${isBoss ? ', +1% ' + m.element + ' Res' : ''})</span>`;







            } else if (isSilver) {







                badgeHtml = `<span class="mastery-badge mastery-badge-silver">⚔️ Silver Hunter (+5% DMG)</span>`;







            } else {







                badgeHtml = `<span style="font-size: 10px; color: #94a3b8;">Kills: <b style="color: #38bdf8;">${kills}</b> / ${reqSilver} to Silver</span>`;







            }















            // Elemental Affinities







            let affinitiesHtml = '';







            const allElements = ['Fire', 'Water', 'Wind', 'Earth', 'Light', 'Dark'];







            const elemIcons = { Fire: '🔥', Water: '💧', Wind: '💨', Earth: '🌿', Light: '✨', Dark: '🌑' };







            allElements.forEach(el => {







                let mult = 1.0;







                if (typeof getElementalMultiplier === 'function') mult = getElementalMultiplier(el, m.element);







                if (mult > 1.0) {







                    affinitiesHtml += `<span class="affinity-pill affinity-weak" style="font-size: 9px; padding: 1px 5px;">${elemIcons[el]} Weak</span>`;







                } else if (mult < 1.0) {







                    affinitiesHtml += `<span class="affinity-pill affinity-resist" style="font-size: 9px; padding: 1px 5px;">${elemIcons[el]} Resist</span>`;







                }







            });















            // Drops section







            let dropsHtml = '';







            if (isSilver || isGold) {







                if (m.loot && m.loot.length > 0) {







                    dropsHtml = `







                        <div style="font-size: 10px; font-weight: bold; color: #94a3b8; margin-top: 4px;">DROP TABLE:</div>







                        <div class="bestiary-drop-table">







                            ${m.loot.map(l => {







                                const pct = Math.round(l.chance * 100);







                                return `<span class="bestiary-drop-chip"><span style="color: #f1f5f9;">${l.item}</span> <b style="color: #4ade80;">${pct}%</b></span>`;







                            }).join('')}







                        </div>







                    `;







                } else {







                    dropsHtml = `<div style="font-size: 10px; color: #64748b; font-style: italic;">No rare item drops.</div>`;







                }







            } else {







                dropsHtml = `<div style="font-size: 10px; color: #64748b; font-style: italic; margin-top: 2px;">🔒 Drop table locked (Unlocks at Silver Mastery: ${reqSilver} kills)</div>`;







            }















            // Lore section







            let loreHtml = '';







            if (isGold) {







                const lore = (typeof BESTIARY_LORE_DB !== 'undefined' && BESTIARY_LORE_DB[m.name]) || 'A formidable entity dwelling within the realms.';







                loreHtml = `<div class="bestiary-lore-box">📜 "${lore}"</div>`;







            }















            card.innerHTML = `







                <div style="display: flex; justify-content: space-between; align-items: flex-start;">







                    <div>







                        <div style="font-size: 14px; font-weight: bold; color: ${isBoss ? '#f472b6' : '#e2e8f0'};">







                            ${isBoss ? '👑 ' : ''}${m.name}







                        </div>







                        <div style="font-size: 10px; color: #64748b;">${m.areaName}</div>







                    </div>







                    <div>${badgeHtml}</div>







                </div>















                <div class="entity-sprite ${isBoss ? 'boss-sprite' : ''}" style="width: 60px; height: 60px; margin: 2px auto;">







                    ${spriteSvg}







                </div>















                <div style="display: flex; justify-content: space-around; font-size: 11px; background: rgba(0,0,0,0.35); padding: 4px 6px; border-radius: 4px; border: 1px solid #334155;">







                    <span style="color: #cbd5e1; font-weight: bold;">Lv. ${m.level}</span>







                    <span class="elem-${m.element}" style="font-weight: bold;">${m.element}</span>







                    <span style="color: #94a3b8;">AI: ${m.ai || 'balanced'}</span>







                </div>















                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; text-align: center; font-size: 10px; background: rgba(15,23,42,0.6); padding: 4px; border-radius: 4px;">







                    <div><span style="color: #64748b;">HP</span><br><b style="color: #4ade80;">${m.hp}</b></div>







                    <div><span style="color: #64748b;">ATK</span><br><b style="color: #f87171;">${m.atk}</b></div>







                    <div><span style="color: #64748b;">DEF</span><br><b style="color: #60a5fa;">${m.def}</b></div>







                    <div><span style="color: #64748b;">MDEF</span><br><b style="color: #c084fc;">${m.mdef || 0}</b></div>







                    <div><span style="color: #64748b;">SPD</span><br><b style="color: #facc15;">${m.spd}</b></div>







                </div>















                ${affinitiesHtml ? `<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">${affinitiesHtml}</div>` : ''}















                ${dropsHtml}















                ${loreHtml}







            `;







        }















        grid.appendChild(card);







    });







}







window.renderBestiaryGrid = renderBestiaryGrid;















/* =========================================================================







   OPTION F: THE DRUNKEN DRAKE TAVERN & MERCENARY GUILD







   ========================================================================= */















let tavernActiveTab = 'bounties';















function generateBountyContract(p = player) {







    const pl = p || player;







    // 1. Pick unlocked area strictly from player.unlockedAreas







    const unlocked = (pl && pl.unlockedAreas && Array.isArray(pl.unlockedAreas) && pl.unlockedAreas.length > 0)







        ? pl.unlockedAreas







        : ['area_1'];







    







    const validAreas = unlocked.filter(a => typeof AREAS_DB !== 'undefined' && AREAS_DB[a]);







    const chosenAreaKey = validAreas.length > 0







        ? validAreas[Math.floor(Math.random() * validAreas.length)]







        : 'area_1';







    const area = (typeof AREAS_DB !== 'undefined') ? AREAS_DB[chosenAreaKey] : null;















    // 2. Roll rarity based on weights: Common 40%, Uncommon 30%, Rare 18%, Epic 9%, Legendary 3%







    const rand = Math.random() * 100;







    let rarity = 'Common';







    if (rand < 40) {







        rarity = 'Common';







    } else if (rand < 70) {







        rarity = 'Uncommon';







    } else if (rand < 88) {







        rarity = 'Rare';







    } else if (rand < 97) {







        rarity = 'Epic';







    } else {







        rarity = 'Legendary';







    }















    // 3. Determine if targeting Boss or Regular Mob







    let isBoss = false;







    let target = null;







    const hasBoss = area && area.boss && area.boss.name;







    const regList = (area && area.regularEnemies && area.regularEnemies.length > 0) ? area.regularEnemies : [];















    if ((rarity === 'Epic' || rarity === 'Legendary') && hasBoss) {







        // 50% chance to target boss if available







        if (Math.random() < 0.5 || regList.length === 0) {







            isBoss = true;







            target = area.boss;







        }







    }















    if (!target) {







        if (regList.length > 0) {







            target = regList[Math.floor(Math.random() * regList.length)];







        } else if (hasBoss) {







            isBoss = true;







            target = area.boss;







        } else {







            target = { name: 'Ember Slime', level: 1 };







        }







    }















    const targetLevel = (target && target.level) ? target.level : 1;















    // 4. Calculate required kills and rewards based on rarity







    let targetCount = 3;







    let baseGold = 100;







    let baseExp = 80;







    let marks = 1;







    let bonusMaterials = null;















    if (rarity === 'Common') {







        // 3 – 5 kills, 100 – 250 Gold, 80 – 180 EXP, 1 Mark, None







        targetCount = Math.floor(Math.random() * 3) + 3;







        baseGold = Math.floor(Math.random() * 151) + 100;







        baseExp = Math.floor(Math.random() * 101) + 80;







        marks = 1;







        bonusMaterials = null;







    } else if (rarity === 'Uncommon') {







        // 8 – 12 kills, 300 – 600 Gold, 250 – 500 EXP, 2 Marks, 3 Iron Scraps







        targetCount = Math.floor(Math.random() * 5) + 8;







        baseGold = Math.floor(Math.random() * 301) + 300;







        baseExp = Math.floor(Math.random() * 251) + 250;







        marks = 2;







        bonusMaterials = { scrap: 3 };







    } else if (rarity === 'Rare') {







        // 15 – 22 kills, 800 – 1500 Gold, 700 – 1200 EXP, 3 Marks, 6 Iron Scraps







        targetCount = Math.floor(Math.random() * 8) + 15;







        baseGold = Math.floor(Math.random() * 701) + 800;







        baseExp = Math.floor(Math.random() * 501) + 700;







        marks = 3;







        bonusMaterials = { scrap: 6 };







    } else if (rarity === 'Epic') {







        // 25 – 35 kills OR 1 Boss, 2000 – 3500 Gold, 1800 – 3000 EXP, 5 Marks, 12 Scraps + 1 Reforge Rune







        targetCount = isBoss ? 1 : Math.floor(Math.random() * 11) + 25;







        baseGold = Math.floor(Math.random() * 1501) + 2000;







        baseExp = Math.floor(Math.random() * 1201) + 1800;







        marks = 5;







        bonusMaterials = { scrap: 12, reforgeRune: 1 };







    } else if (rarity === 'Legendary') {







        // 40 – 50 kills OR 2 Bosses, 5000 – 8000 Gold, 4500 – 7500 EXP, 10 Marks, 25 Scraps + 2 Mythic Reforge Runes







        targetCount = isBoss ? 2 : Math.floor(Math.random() * 11) + 40;







        baseGold = Math.floor(Math.random() * 3001) + 5000;







        baseExp = Math.floor(Math.random() * 3001) + 4500;







        marks = 10;







        bonusMaterials = { scrap: 25, mythicReforgeRune: 2 };







    }















    // Dynamic level scaling: BaseReward * (1 + (targetLevel * 0.12))







    const scaleMult = 1 + (targetLevel * 0.12);







    const finalGold = Math.round(baseGold * scaleMult);







    const finalExp = Math.round(baseExp * scaleMult);















    return {







        id: 'bounty_' + Date.now() + '_' + Math.floor(Math.random() * 1000000),







        title: isBoss ? `Boss Hunt: ${target.name}` : `Hunt: ${target.name}`,







        rarity: rarity,







        areaId: chosenAreaKey,







        areaName: area ? area.name : 'Unknown Zone',







        targetName: target.name,







        targetLevel: targetLevel,







        isBoss: !!isBoss,







        targetCount: targetCount,







        currentCount: 0,







        completed: false,







        marks: marks,







        gold: finalGold,







        exp: finalExp,







        bonusMaterials: bonusMaterials,







        desc: isBoss







            ? `Slay ${targetCount} ${target.name} (Gatekeeper Boss) in ${area ? area.name : 'the zone'}.`







            : `Defeat ${targetCount} ${target.name} in ${area ? area.name : 'the zone'}.`







    };







}















function refreshBountyBoard(forceFree = false) {







    if (!player) return;







    if (!player.bounties) {







        player.bounties = { available: [], active: [], completedCount: 0 };







    }







    if (!Array.isArray(player.bounties.available)) player.bounties.available = [];







    if (!Array.isArray(player.bounties.active)) player.bounties.active = [];















    if (!forceFree && player.bounties.available.length > 0) {







        if ((player.gold || 0) < 50) {







            showToast('Insufficient Gold', 'Refreshing the Bounty Board costs 50 Gold.', 'info');







            return;







        }







        player.gold -= 50;







        updateHeader();







    }















    const newContracts = [];







    for (let i = 0; i < 4; i++) {







        newContracts.push(generateBountyContract(player));







    }







    player.bounties.available = newContracts;















    if (!forceFree) {







        showToast('Bounty Board Refreshed', '4 new mercenary contracts posted!', 'info');







    }















    renderTavernContent();







}















function acceptBounty(bountyId) {







    if (!player) return;







    if (!player.bounties) player.bounties = { available: [], active: [], completedCount: 0 };







    if (!Array.isArray(player.bounties.active)) player.bounties.active = [];







    if (!Array.isArray(player.bounties.available)) player.bounties.available = [];















    if (player.bounties.active.length >= 2) {







        showToast('⚠️ Maximum Contracts', 'You can only take 2 active contracts at a time!', 'info');







        return;







    }















    const idx = player.bounties.available.findIndex(b => b.id === bountyId);







    if (idx === -1) return;















    const bounty = player.bounties.available.splice(idx, 1)[0];







    bounty.currentCount = 0;







    bounty.completed = false;







    player.bounties.active.push(bounty);















    showToast('Contract Accepted!', `Accepted: ${bounty.title} (${player.bounties.active.length}/2)`, 'quest');







    renderTavernContent();







}















function abandonBounty(bountyId) {







    if (!player || !player.bounties || !Array.isArray(player.bounties.active)) return;







    const idx = player.bounties.active.findIndex(b => b.id === bountyId);







    if (idx === -1) return;















    const b = player.bounties.active[idx];







    player.bounties.active.splice(idx, 1);







    showToast('Contract Abandoned', `Abandoned contract: ${b.title}`, 'info');







    renderTavernContent();







}















function claimBountyReward(bountyId) {







    if (!player || !player.bounties || !Array.isArray(player.bounties.active)) return;







    const idx = player.bounties.active.findIndex(b => b.id === bountyId);







    if (idx === -1) return;















    const b = player.bounties.active[idx];







    if (b.currentCount < b.targetCount) {







        showToast('Contract Incomplete', `Defeat ${b.targetCount - b.currentCount} more ${b.targetName}!`, 'info');







        return;







    }















    // Remove from active & increment completed count







    player.bounties.active.splice(idx, 1);







    player.bounties.completedCount = (player.bounties.completedCount || 0) + 1;















    // Disburse rewards







    player.gold = (player.gold || 0) + (b.gold || 0);







    player.bountyMarks = (player.bountyMarks || 0) + (b.marks || 0);















    let expTxt = '';







    if (b.exp) {







        player.exp = (player.exp || 0) + b.exp;







        checkLevelUp();







        expTxt = ` +${b.exp} EXP`;







    }















    // Bonus materials







    if (b.bonusMaterials) {







        if (!player.materials) player.materials = { scrap: 0, dust: 0, shard: 0 };







        if (b.bonusMaterials.scrap) {







            player.materials.scrap = (player.materials.scrap || 0) + b.bonusMaterials.scrap;







        }







        if (b.bonusMaterials.reforgeRune) {







            if (!player.inventory.consumables) player.inventory.consumables = {};







            player.inventory.consumables['Reforge Rune'] = (player.inventory.consumables['Reforge Rune'] || 0) + b.bonusMaterials.reforgeRune;







            if (player.inventory !== player.inventory.consumables) {







                try { player.inventory['Reforge Rune'] = player.inventory.consumables['Reforge Rune']; } catch(e) {}







            }







        }







        if (b.bonusMaterials.mythicReforgeRune) {







            if (!player.inventory.consumables) player.inventory.consumables = {};







            player.inventory.consumables['Mythic Reforge Rune'] = (player.inventory.consumables['Mythic Reforge Rune'] || 0) + b.bonusMaterials.mythicReforgeRune;







            if (player.inventory !== player.inventory.consumables) {







                try { player.inventory['Mythic Reforge Rune'] = player.inventory.consumables['Mythic Reforge Rune']; } catch(e) {}







            }







        }







    }















    playSFX('quest_claim');







    showToast('Bounty Claimed!', `+${b.gold} Gold${expTxt}, +${b.marks} Bounty Marks!`, 'quest', 5000);







    updateHeader();







    renderTavernContent();







    if (typeof checkAchievements === 'function') checkAchievements();







}















function buyQuartermasterItem(itemId) {







    if (!player) return;







    if (typeof TAVERN_EXCHANGE_DB === 'undefined') return;







    const item = TAVERN_EXCHANGE_DB.find(i => i.id === itemId);







    if (!item) return;















    player.bountyMarks = player.bountyMarks || 0;







    if (player.bountyMarks < item.cost) {







        showToast('Insufficient Marks', `You need 🎖️ ${item.cost} Bounty Marks to purchase this.`, 'info');







        return;







    }















    if (item.type === 'title') {







        if (player.activeTitle === item.title) {







            showToast('Already Equipped', `You already have the title [${item.title}] equipped!`, 'info');







            return;







        }







        player.bountyMarks -= item.cost;







        player.activeTitle = item.title;







        updateHeader();







        if (typeof renderStats === 'function') renderStats();







        showToast('Prestige Title Unlocked!', `Equipped title [${item.title}]!`, 'quest', 5000);







    } else if (item.type === 'material') {







        player.bountyMarks -= item.cost;







        if (!player.materials) player.materials = { scrap: 0, dust: 0, shard: 0 };







        const key = (item.matKey === 'scraps' || item.matKey === 'scrap') ? 'scrap' : item.matKey;







        player.materials[key] = (player.materials[key] || 0) + item.amount;







        showToast('Materials Received!', `Received ${item.amount} Iron Scraps!`, 'info');







    } else if (item.id === 'calamity_keystone' || item.type === 'keystone' || item.effect === 'calamity_key') {
        player.bountyMarks -= item.cost;
        player.calamityKeys = (player.calamityKeys || 0) + 1;
        player.calamityUnlocked = true;
        showToast('Keystone Acquired!', 'Received 1 Calamity Keystone! Calamity Rift Gate is now accessible.', 'quest', 4000);
        updateHeader();
        if (typeof renderTavernContent === 'function') renderTavernContent();
        if (typeof updateTownUI === 'function') updateTownUI();
    } else if (item.effect === 'pet_exp') {







        player.bountyMarks -= item.cost;







        if (player.pets) {







            let given = 0;







            if (Array.isArray(player.pets.active)) {







                player.pets.active.forEach(pId => {







                    if (pId) {







                        if (typeof addPetExp === 'function') addPetExp(pId, item.value || 50);







                        given++;







                    }







                });







            }







            if (given === 0) {







                const first = (player.pets.unlocked && player.pets.unlocked[0]) || 'sprout_slimelet';







                if (typeof addPetExp === 'function') addPetExp(first, item.value || 50);







            }







        }







        showToast('Gourmet Treat Served!', `Active companion pets gained +${item.value || 50} Bond EXP!`, 'level');







    } else if (item.effect === 'mythic_rune') {







        player.bountyMarks -= item.cost;







        if (!player.inventory.consumables) player.inventory.consumables = {};







        player.inventory.consumables['Mythic Reforge Rune'] = (player.inventory.consumables['Mythic Reforge Rune'] || 0) + 1;







        if (player.inventory !== player.inventory.consumables) {







            try { player.inventory['Mythic Reforge Rune'] = player.inventory.consumables['Mythic Reforge Rune']; } catch(e) {}







        }







        showToast('Mythic Reforge Rune', 'Added 1 Mythic Reforge Rune to your inventory!', 'quest');







    } else if (item.type === 'accessory') {







        player.bountyMarks -= item.cost;







        if (!player.inventory.equipment) player.inventory.equipment = [];







        const accessory = {







            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),







            baseName: item.name || "Mercenary's Signet",







            name: item.name || "Mercenary's Signet",







            type: 'accessory',







            slot: 'accessory',







            rarity: 'Epic',







            baseStats: {







                maxHp: item.maxHp || 40,







                crit: item.crit || 5,







                goldBonus: item.goldBonus || 15







            },







            maxHp: item.maxHp || 40,







            crit: item.crit || 5,







            goldBonus: item.goldBonus || 15,







            affixes: [],







            price: 1200,







            sellPrice: 300,







            desc: item.desc







        };







        player.inventory.equipment.push(accessory);







        showToast("Mercenary's Signet", "Received Mercenary's Signet! Check your inventory to equip.", 'quest');







    }















    updateHeader();







    renderTavernContent();







    if (typeof renderInventory === 'function') renderInventory();







}















function openTavernModal() {







    if (!player) return;







    if (player.bountyMarks === undefined) player.bountyMarks = 0;







    if (!player.bounties) player.bounties = { available: [], active: [], completedCount: 0 };







    if (!Array.isArray(player.bounties.available)) player.bounties.available = [];







    if (!Array.isArray(player.bounties.active)) player.bounties.active = [];















    if (player.bounties.available.length === 0) {







        refreshBountyBoard(true);







    }







    renderTavernContent();







    openModal('modal-tavern');







}















function closeTavernModal() {







    closeModal('modal-tavern');







}















function switchTavernTab(tab) {







    tavernActiveTab = tab;







    const tabBtns = document.querySelectorAll('.tavern-tab');







    tabBtns.forEach(btn => {







        if ((tab === 'bounties' && btn.textContent.includes('Bounty Board')) ||







            (tab === 'quartermaster' && btn.textContent.includes('Quartermaster')) || (tab === 'recruitment' && (btn.textContent.includes('Mercenary') || btn.textContent.includes('Recruitment')))) {







            btn.classList.add('active');







        } else {







            btn.classList.remove('active');







        }







    });







    renderTavernContent();







}















function renderTavernContent() {







    const marksEl = document.getElementById('tavern-marks-display');







    if (marksEl) marksEl.textContent = (player && player.bountyMarks) || 0;















    const contentEl = document.getElementById('tavern-content');







    if (!contentEl) return;















    if (!player.bounties) player.bounties = { available: [], active: [], completedCount: 0 };







    if (!Array.isArray(player.bounties.active)) player.bounties.active = [];







    if (!Array.isArray(player.bounties.available)) player.bounties.available = [];















    const rarityColors = {







        'Common': '#94a3b8',







        'Uncommon': '#22c55e',







        'Rare': '#38bdf8',







        'Epic': '#c084fc',







        'Legendary': '#f59e0b'







    };















    if (tavernActiveTab === 'bounties') {







        let html = '';















        // 1. Active Contracts Section







        const activeCount = player.bounties.active.length;







        html += `







            <div class="bounty-section-header">







                <div class="bounty-section-title">⚔️ Active Contracts (${activeCount}/2)</div>







            </div>







        `;















        if (activeCount === 0) {







            html += `







                <div style="background: rgba(15,23,42,0.6); border: 1px dashed #334155; border-radius: 8px; padding: 14px; text-align: center; color: #94a3b8; font-size: 13px; margin-bottom: 16px;">







                    No active contracts. Select up to 2 contracts from the board below to hunt monsters in your unlocked areas!







                </div>







            `;







        } else {







            html += `<div class="bounty-grid">`;







            player.bounties.active.forEach((b, idx) => {







                const color = rarityColors[b.rarity] || '#94a3b8';







                const pct = Math.min(100, Math.floor(((b.currentCount || 0) / (b.targetCount || 1)) * 100));







                const isReady = (b.currentCount || 0) >= (b.targetCount || 1);















                let matStr = '';







                if (b.bonusMaterials) {







                    if (b.bonusMaterials.scrap) matStr += ` +${b.bonusMaterials.scrap} Scraps`;







                    if (b.bonusMaterials.reforgeRune) matStr += ` +${b.bonusMaterials.reforgeRune} Reforge Rune`;







                    if (b.bonusMaterials.mythicReforgeRune) matStr += ` +${b.bonusMaterials.mythicReforgeRune} Mythic Rune`;







                }















                html += `







                    <div class="bounty-card rarity-${b.rarity.toLowerCase()}">







                        <div>







                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">







                                <span class="bounty-badge-active">[Active Slot ${idx+1}/2]</span>







                                <span style="font-size: 11px; font-weight: bold; color: ${color}; text-transform: uppercase;">${b.rarity}</span>







                            </div>







                            <div style="font-weight: bold; font-size: 14px; color: ${color}; margin-bottom: 4px;">${b.title}</div>







                            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 6px;">







                                📍 Zone: <b style="color: #cbd5e1;">${b.areaName}</b><br>







                                🎯 Target: <b style="color: #f1f5f9;">${b.targetName}</b> (Lv.${b.targetLevel}${b.isBoss ? ' Boss' : ''})







                            </div>







                            <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 8px;">${b.desc}</div>







                        </div>















                        <div>







                            <div class="bounty-progress-bar" style="margin-bottom: 8px;">







                                <div class="bounty-progress-fill" style="width: ${pct}%; background: ${isReady ? '#16a34a' : 'linear-gradient(90deg, #3b82f6, #60a5fa)'};"></div>







                                <div class="bounty-progress-text">${b.currentCount || 0} / ${b.targetCount} (${pct}%)</div>







                            </div>















                            <div style="font-size: 11px; color: #fde047; margin-bottom: 8px;">







                                💰 ${b.gold} Gold | ✨ ${b.exp} EXP | 🎖️ ${b.marks} Marks${matStr ? `<br><span style="color: #a78bfa;">📦${matStr}</span>` : ''}







                            </div>















                            <div style="display: flex; gap: 8px; justify-content: flex-end;">







                                ${isReady







                                    ? `<button class="bounty-btn-claim" onclick="claimBountyReward('${b.id}')">🎁 Claim Reward</button>`







                                    : `<button class="bounty-btn-abandon" onclick="abandonBounty('${b.id}')">Abandon</button>`







                                }







                            </div>







                        </div>







                    </div>







                `;







            });







            html += `</div>`;







        }















        // 2. Available Contracts Section







        html += `







            <div class="bounty-section-header">







                <div class="bounty-section-title">📜 Guild Contract Board</div>







                <button class="btn" style="padding: 4px 10px; font-size: 12px; border-color: #f59e0b; color: #f59e0b;" onclick="refreshBountyBoard(false)">🔄 Refresh Board (50 Gold)</button>







            </div>







        `;















        if (player.bounties.available.length === 0) {







            html += `







                <div style="background: rgba(15,23,42,0.6); border: 1px dashed #334155; border-radius: 8px; padding: 14px; text-align: center; color: #94a3b8; font-size: 13px;">







                    All contracts accepted! Refresh the board for 50 Gold to post new guild contracts.







                </div>







            `;







        } else {







            html += `<div class="bounty-grid">`;







            player.bounties.available.forEach(b => {







                const color = rarityColors[b.rarity] || '#94a3b8';







                let matStr = '';







                if (b.bonusMaterials) {







                    if (b.bonusMaterials.scrap) matStr += ` +${b.bonusMaterials.scrap} Scraps`;







                    if (b.bonusMaterials.reforgeRune) matStr += ` +${b.bonusMaterials.reforgeRune} Reforge Rune`;







                    if (b.bonusMaterials.mythicReforgeRune) matStr += ` +${b.bonusMaterials.mythicReforgeRune} Mythic Rune`;







                }







                const canAccept = activeCount < 2;















                html += `







                    <div class="bounty-card rarity-${b.rarity.toLowerCase()}">







                        <div>







                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">







                                <span style="font-size: 11px; font-weight: bold; color: ${color}; text-transform: uppercase;">${b.rarity} CONTRACT</span>







                                <span style="font-size: 11px; color: #94a3b8;">Lv.${b.targetLevel}</span>







                            </div>







                            <div style="font-weight: bold; font-size: 14px; color: ${color}; margin-bottom: 4px;">${b.title}</div>







                            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 6px;">







                                📍 Zone: <b style="color: #cbd5e1;">${b.areaName}</b><br>







                                🎯 Requirement: Defeat <b style="color: #f1f5f9;">${b.targetCount}x ${b.targetName}</b>${b.isBoss ? ' (Gatekeeper Boss)' : ''}







                            </div>







                            <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 8px;">${b.desc}</div>







                        </div>















                        <div>







                            <div style="font-size: 11px; color: #fde047; margin-bottom: 8px; background: rgba(0,0,0,0.3); padding: 6px; border-radius: 4px;">







                                💰 ${b.gold} Gold | ✨ ${b.exp} EXP | 🎖️ ${b.marks} Marks${matStr ? `<br><span style="color: #a78bfa;">📦${matStr}</span>` : ''}







                            </div>







                            <button class="bounty-btn-accept" ${canAccept ? '' : 'disabled style="opacity: 0.5; cursor: not-allowed;"'} onclick="acceptBounty('${b.id}')">







                                ${canAccept ? 'Accept Contract' : 'Slots Full (2/2)'}







                            </button>







                        </div>







                    </div>







                `;







            });







            html += `</div>`;







        }















        contentEl.innerHTML = html;







    } else if (tavernActiveTab === 'recruitment') {







        renderBarracksUI('tavern-content');







    } else if (tavernActiveTab === 'quartermaster') {







        let html = `







            <div style="margin-bottom: 12px; font-size: 13px; color: #94a3b8;">







                Exchange hard-earned <b>Bounty Marks</b> for rare crafting supplies, gourmet companion treats, and prestigious mercenary titles.







            </div>







            <div class="quartermaster-grid">







        `;















        if (typeof TAVERN_EXCHANGE_DB !== 'undefined') {







            const marks = (player && player.bountyMarks) || 0;







            const exchangeList = [...TAVERN_EXCHANGE_DB];
        if (typeof CALAMITY_KEYSTONE_EXCHANGE !== 'undefined' && !exchangeList.some(i => i.id === 'calamity_keystone')) {
            exchangeList.push(CALAMITY_KEYSTONE_EXCHANGE);
        }
        exchangeList.forEach(item => {







                const canAfford = marks >= item.cost;







                const isEquippedTitle = (item.type === 'title' && player.activeTitle === item.title);















                html += `







                    <div class="quartermaster-card">







                        <div>







                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">







                                <span style="font-weight: bold; font-size: 14px; color: #fbbf24;">${item.name}</span>







                                <span style="font-size: 12px; font-weight: bold; color: #f59e0b; background: rgba(245,158,11,0.15); padding: 2px 8px; border-radius: 12px; border: 1px solid #f59e0b;">







                                    🎖️ ${item.cost}







                                </span>







                            </div>







                            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">







                                Type: <span style="color: #cbd5e1; text-transform: capitalize;">${item.type}</span>







                            </div>







                            <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4;">${item.desc}</div>







                        </div>















                        <div style="margin-top: 10px;">







                            ${isEquippedTitle







                                ? `<button class="btn" disabled style="width: 100%; opacity: 0.7; background: #059669; border-color: #10b981; color: white;">Equipped</button>`







                                : `<button class="btn" ${canAfford ? '' : 'disabled style="opacity: 0.5; cursor: not-allowed;"'} style="width: 100%; background: #d97706; border-color: #f59e0b; color: white;" onclick="buyQuartermasterItem('${item.id}')">







                                    Exchange (${item.cost} Marks)







                                   </button>`







                            }







                        </div>







                    </div>







                `;







            });







        }







        html += `</div>`;







        contentEl.innerHTML = html;







    }







}















// Global window attachments







window.generateBountyContract = generateBountyContract;







window.refreshBountyBoard = refreshBountyBoard;







window.acceptBounty = acceptBounty;







window.abandonBounty = abandonBounty;







window.claimBountyReward = claimBountyReward;







window.buyQuartermasterItem = buyQuartermasterItem;







window.openTavernModal = openTavernModal;







window.closeTavernModal = closeTavernModal;







window.switchTavernTab = switchTavernTab;







window.renderTavernContent = renderTavernContent;















/* =========================================================================







   TACTICAL PARTY, RECRUITMENT & BARRACKS ENGINE (PHASE 1)







   ========================================================================= */















const HERO_FIRST_NAMES = [







    'Garrick', 'Lyra', 'Theron', 'Vespera', 'Kaelen', 'Seraphina', 'Darius', 'Morgana',







    'Orion', 'Valeria', 'Cedric', 'Elowen', 'Boran', 'Selene', 'Finnian', 'Isolde',







    'Zephyr', 'Rhea', 'Kael', 'Althea', 'Torin', 'Astrid', 'Lucan', 'Sylvia'







];















const HERO_EPITHETS = [







    'Ironwood', 'Stormborn', 'Flameheart', 'Shadowveil', 'Frostwhisper', 'Dawnseeker',







    'Voidstrider', 'Moonshadow', 'Stonebreaker', 'Starfall', 'Bloodhound', 'Swiftstride'







];















function syncMainHero() {







    if (!player) return;







    if (!player.roster || !Array.isArray(player.roster)) player.roster = [];







    if (!player.rosterMax) player.rosterMax = 5;







    if (!player.activeParty || !Array.isArray(player.activeParty)) player.activeParty = ['hero_main'];







    if (!player.partyUnlockedSlots) player.partyUnlockedSlots = 1;















    let main = player.roster.find(h => h.isMain || h.id === 'hero_main');







    if (!main) {







        main = {







            id: 'hero_main',







            name: player.name || 'Hero',







            isMain: true,







            rank: 'S',







            classId: player.currentClass || 'warrior',







            subclassId: player.subclass || null,







            element: 'Physical',







            level: player.level || 1,







            exp: player.exp || 0,







            baseStats: player.baseStats ? { ...player.baseStats } : { hp: 100, maxHp: 100, mp: 50, maxMp: 50, atk: 12, def: 8, matk: 10, mdef: 8, spd: 14, crit: 5 },







            equipment: player.equipment ? player.equipment : { weapon: null, helmet: null, armor: null, gloves: null, boots: null, accessory: null },







            skillTree: player.skillTree ? player.skillTree : {},







            row: 'front'







        };







        player.roster.unshift(main);







    } else {







        main.name = player.name || main.name || 'Hero';







        main.isMain = true;







        main.rank = 'S';







        main.level = player.level || main.level || 1;







        main.exp = player.exp || 0;







        main.classId = player.currentClass || main.classId || 'warrior';







        main.subclassId = player.subclass || main.subclassId || null;







        if (player.baseStats) main.baseStats = player.baseStats;







        if (player.equipment) main.equipment = player.equipment;







        if (player.skillTree) main.skillTree = player.skillTree;







    }















    if (!player.activeParty.includes(main.id)) {







        player.activeParty.unshift(main.id);







    }















    if (player.unlockedAreas) {







        if (player.unlockedAreas.includes('area_2') || player.unlockedAreas.includes('area_3') || player.unlockedAreas.includes('area_4') || player.unlockedAreas.includes('area_5') || player.unlockedAreas.includes('area_6')) {







            player.defeatedArea1Boss = true;







        }







        if (player.unlockedAreas.includes('area_6') || player.unlockedAreas.includes('area_7') || player.unlockedAreas.includes('area_8') || player.unlockedAreas.includes('area_9') || player.unlockedAreas.includes('area_10')) {







            player.defeatedArea5Boss = true;







        }







    }















    if (player.roster && Array.isArray(player.roster)) {







        player.roster.forEach(h => {







            if (!h.equipment) {







                h.equipment = { weapon: null, helmet: null, armor: null, gloves: null, boots: null, accessory: null };







            }







        });







    }







}















function rollScoutRank(tier = 'standard') {







    const roll = Math.random() * 100;







    if (tier === 'royal' || tier === 'bounty' || tier === 'type3') {







        // Royal: S 2%, A 8%, B 20%, C 40%, D 30% (Zero E or F)







        if (roll < 2.0) return 'S';







        if (roll < 10.0) return 'A';







        if (roll < 30.0) return 'B';







        if (roll < 70.0) return 'C';







        return 'D';







    } else if (tier === 'advanced' || tier === 'type2') {







        // Advanced: S 0.5%, A 1.5%, B 3%, C 25%, D 35%, E 25%, F 10%







        if (roll < 0.5) return 'S';







        if (roll < 2.0) return 'A';







        if (roll < 5.0) return 'B';







        if (roll < 30.0) return 'C';







        if (roll < 65.0) return 'D';







        if (roll < 90.0) return 'E';







        return 'F';







    } else {







        // Standard: S 0.1%, A 0.5%, B 1%, C 15%, D 25%, E 30%, F 28.4%







        if (roll < 0.1) return 'S';







        if (roll < 0.6) return 'A';







        if (roll < 1.6) return 'B';







        if (roll < 16.6) return 'C';







        if (roll < 41.6) return 'D';







        if (roll < 71.6) return 'E';







        return 'F';







    }







}















function generateRecruit(tier = 'standard') {







    const rank = rollScoutRank(tier);







    const classes = ['warrior', 'mage', 'rogue', 'ranger', 'cleric', 'necromancer'];







    const classId = classes[Math.floor(Math.random() * classes.length)];







    const elements = ['Fire', 'Water', 'Wind', 'Earth', 'Light', 'Dark'];







    const element = elements[Math.floor(Math.random() * elements.length)];















    const fName = HERO_FIRST_NAMES[Math.floor(Math.random() * HERO_FIRST_NAMES.length)];







    const epith = HERO_EPITHETS[Math.floor(Math.random() * HERO_EPITHETS.length)];







    const heroName = `${fName} ${epith}`;







    let starterSkills = ['Power Strike', 'Cleave'];







    if (classId === 'mage') starterSkills = ['Fireball', 'Heal'];







    else if (classId === 'rogue') starterSkills = ['Quick Slash', 'Smoke Screen'];
    else if (classId === 'ranger') starterSkills = ['Aimed Shot', 'Marked Prey'];
    else if (classId === 'cleric') starterSkills = ['Holy Light', 'Purify'];
    else if (classId === 'necromancer') starterSkills = ['Raise Skeleton', 'Bone Spear'];















    const rankDef = (typeof HERO_RANKS_DB !== 'undefined' && HERO_RANKS_DB[rank]) || { mult: 1.0 };







    const mult = rankDef.mult;















    const templates = {







        warrior: { hp: 110, maxHp: 110, mp: 40, maxMp: 40, atk: 12, def: 8, matk: 6, mdef: 6, spd: 12, crit: 5 },







        mage:    { hp: 80,  maxHp: 80,  mp: 80, maxMp: 80, atk: 6,  def: 5, matk: 14, mdef: 10, spd: 11, crit: 6 },







        rogue:   { hp: 90,  maxHp: 90,  mp: 50, maxMp: 50, atk: 11, def: 6, matk: 8,  mdef: 6, spd: 16, crit: 10 },
        ranger:  { hp: 95,  maxHp: 95,  mp: 50, maxMp: 50, atk: 13, def: 7, matk: 7,  mdef: 6, spd: 15, crit: 12 },
        cleric:  { hp: 100, maxHp: 100, mp: 70, maxMp: 70, atk: 7,  def: 8, matk: 12, mdef: 11, spd: 11, crit: 5 },
        necromancer: { hp: 100, maxHp: 100, mp: 65, maxMp: 65, atk: 7, def: 8, matk: 13, mdef: 10, spd: 11, crit: 6 }
    };







    const tpl = templates[classId] || templates.warrior;















    const baseStats = {







        hp: Math.round(tpl.hp * mult),







        maxHp: Math.round(tpl.maxHp * mult),







        mp: Math.round(tpl.mp * mult),







        maxMp: Math.round(tpl.maxMp * mult),







        atk: Math.round(tpl.atk * mult),







        def: Math.round(tpl.def * mult),







        matk: Math.round(tpl.matk * mult),







        mdef: Math.round(tpl.mdef * mult),







        spd: Math.round(tpl.spd * mult * 10) / 10,







        crit: tpl.crit







    };















    return {







        id: 'hero_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),







        name: heroName,







        isMain: false,







        rank: rank,







        classId: classId,







        subclassId: null,







        element: element,







        level: 1,







        exp: 0,







        baseStats: baseStats,







        equipment: { weapon: null, helmet: null, armor: null, gloves: null, boots: null, accessory: null },







        statuses: {},







        skills: [...starterSkills],







        skillTree: {},







        row: (classId === 'mage' || classId === 'ranger' || classId === 'cleric' || classId === 'necromancer') ? 'back' : 'front'







    };







}
window.generateRecruit = generateRecruit;
window.generateRecruitHero = generateRecruit;
















function recruitHero(scoutTier = 'standard') {







    if (!player) return null;







    player.roster = player.roster || [];







    player.rosterMax = player.rosterMax || 5;















    // 1. Barracks Capacity Check







    if (player.roster.length >= player.rosterMax) {







        showToast('⚠️ Barracks Full', `Maximum barracks capacity reached (${player.rosterMax} Heroes)! Expand barracks at the Guildmaster.`, 'info');







        return null;







    }















    const tierKey = (scoutTier === 'type1') ? 'standard' : (scoutTier === 'type2') ? 'advanced' : (scoutTier === 'type3' || scoutTier === 'bounty') ? 'royal' : scoutTier;







    const tierDef = (typeof SCOUT_TIERS_DB !== 'undefined' && SCOUT_TIERS_DB[tierKey]) || { costType: 'gold', cost: 250 };















    // 2. Currency Check & Deduction







    if (tierDef.costType === 'marks') {







        player.bountyMarks = player.bountyMarks || 0;







        if (player.bountyMarks < tierDef.cost) {







            showToast('Insufficient Marks', `You need 🎖️ ${tierDef.cost} Bounty Marks to conduct a Royal Scout.`, 'info');







            return null;







        }







        player.bountyMarks -= tierDef.cost;







    } else {







        if ((player.gold || 0) < tierDef.cost) {







            showToast('Insufficient Gold', `You need 💰 ${tierDef.cost} Gold to scout mercenaries.`, 'info');







            return null;







        }







        player.gold -= tierDef.cost;







    }















    // 3. Generate Recruit & Add to Roster







    const newHero = generateRecruit(tierKey);







    player.roster.push(newHero);















    // 4. Auto-assign to Active Party if slots available







    player.partyUnlockedSlots = player.partyUnlockedSlots || 1;







    player.activeParty = player.activeParty || ['hero_main'];







    if (player.activeParty.length < player.partyUnlockedSlots && !player.activeParty.includes(newHero.id)) {







        player.activeParty.push(newHero.id);







    }















    playSFX('quest_claim');







    showToast(`🎉 Recruited [${newHero.rank}-Rank] ${newHero.name}!`, `${newHero.classId.toUpperCase()} • ${newHero.element} • Lv.1`, 'quest', 5000);















    updateHeader();







    if (typeof renderBarracksUI === 'function') {







        if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');







        if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');







    }







    return newHero;







}















function getNextBarracksExpansion() {







    const cur = (player && player.rosterMax) || 5;







    const expansions = (typeof BARRACKS_EXPANSIONS !== 'undefined') ? BARRACKS_EXPANSIONS : [







        { from: 5, to: 8, cost: 1000 },







        { from: 8, to: 12, cost: 3500 },







        { from: 12, to: 16, cost: 10000 },







        { from: 16, to: 20, cost: 25000 },







        { from: 20, to: 25, cost: 50000 }







    ];







    return expansions.find(e => e.from === cur) || null;







}















function expandBarracksCapacity() {







    if (!player) return false;







    player.rosterMax = player.rosterMax || 5;







    const exp = getNextBarracksExpansion();







    if (!exp) {







        showToast('Max Capacity', 'Barracks is already at maximum capacity (25 Heroes)!', 'info');







        return false;







    }















    if ((player.gold || 0) < exp.cost) {







        showToast('Insufficient Gold', `Expanding to ${exp.to} slots costs ${exp.cost.toLocaleString()} Gold.`, 'info');







        return false;







    }















    player.gold -= exp.cost;







    player.rosterMax = exp.to;







    showToast('Barracks Expanded!', `Barracks capacity upgraded to ${player.rosterMax} slots!`, 'level', 5000);















    updateHeader();







    if (typeof renderBarracksUI === 'function') {







        if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');







        if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');







    }







    return true;







}















function dismissHero(heroId) {







    if (!player || !player.roster) return false;







    const hero = player.roster.find(h => h.id === heroId);







    if (!hero) return false;















    if (hero.isMain) {







        showToast('Cannot Dismiss', 'You cannot dismiss the Main Hero!', 'info');







        return false;







    }



    if (hero.locked) {

        showToast('Hero Locked', `${hero.name} is locked! Unlock them first to dismiss.`, 'warning');

        return false;

    }















    const rankMult = (typeof HERO_RANKS_DB !== 'undefined' && HERO_RANKS_DB[hero.rank]?.mult) || 1.0;







    const goldRefund = Math.round(100 * (hero.level || 1) * rankMult);







    player.gold = (player.gold || 0) + goldRefund;















    if (hero.equipment) {







        const slots = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'accessory'];







        slots.forEach(slot => {







            if (hero.equipment[slot]) {







                if (!player.inventory.equipment) player.inventory.equipment = [];







                player.inventory.equipment.push(hero.equipment[slot]);







                hero.equipment[slot] = null;







            }







        });







    }















    if (player.activeParty && Array.isArray(player.activeParty)) {







        player.activeParty = player.activeParty.filter(id => id !== heroId);







        if (player.activeParty.length === 0) {







            player.activeParty = ['hero_main'];







        }







    }















    player.roster = player.roster.filter(h => h.id !== heroId);















    showToast('Hero Dismissed', `Dismissed ${hero.name}. Received 💰 ${goldRefund} Gold severance pay.`, 'info');







    updateHeader();







    if (typeof renderBarracksUI === 'function') {







        if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');







        if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');







    }







    return true;







}















function levelUpHero(hero) {







    if (!hero) return;







    const rankDef = (typeof HERO_RANKS_DB !== 'undefined' && HERO_RANKS_DB[hero.rank]) || HERO_RANKS_DB['D'];







    const growth = rankDef.growth;







    hero.level = (hero.level || 1) + 1;







    if (!hero.baseStats) hero.baseStats = { hp: 100, maxHp: 100, mp: 50, maxMp: 50, atk: 10, def: 8, matk: 10, mdef: 8, spd: 12, crit: 5 };















    hero.baseStats.maxHp = (hero.baseStats.maxHp || 100) + growth.hp;







    hero.baseStats.hp = hero.baseStats.maxHp;







    hero.baseStats.maxMp = (hero.baseStats.maxMp || 50) + growth.mp;







    hero.baseStats.mp = hero.baseStats.maxMp;







    hero.baseStats.atk = (hero.baseStats.atk || 10) + growth.atk;







    hero.baseStats.def = (hero.baseStats.def || 8) + growth.def;







    hero.baseStats.matk = (hero.baseStats.matk || 10) + growth.matk;







    hero.baseStats.mdef = (hero.baseStats.mdef || 8) + growth.mdef;







    hero.baseStats.spd = Math.round(((hero.baseStats.spd || 12) + growth.spd) * 10) / 10;







    hero.hp = hero.baseStats.maxHp;







    hero.mp = hero.baseStats.maxMp;















    if (hero.isMain && player) {







        player.level = hero.level;







        player.baseStats = { ...hero.baseStats };







        if (typeof computeStats === 'function') computeStats();







        if (typeof updateHeader === 'function') updateHeader();







    }







}















function isAreaBossDefeated(areaNum) {







    if (!player) return false;







    if (areaNum === 1) {







        if (player.defeatedArea1Boss) return true;







        if (player.bestiary) {







            if ((player.bestiary['Ancient Treant'] || 0) > 0) return true;







            if ((player.bestiary['Elder Treant'] || 0) > 0) return true;







        }







        if (player.unlockedAreas && (player.unlockedAreas.includes('area_2') || player.unlockedAreas.includes('area_3') || player.unlockedAreas.includes('area_4') || player.unlockedAreas.includes('area_5') || player.unlockedAreas.includes('area_6'))) return true;







        return false;







    }







    if (areaNum === 5) {







        if (player.defeatedArea5Boss) return true;







        if (player.bestiary && (player.bestiary['Void Guardian'] || 0) > 0) return true;







        if (player.unlockedAreas && (player.unlockedAreas.includes('area_6') || player.unlockedAreas.includes('area_7') || player.unlockedAreas.includes('area_8') || player.unlockedAreas.includes('area_9') || player.unlockedAreas.includes('area_10'))) return true;







        return false;







    }







    return false;







}















function getNextPartySlotTier() {







    if (!player) return null;







    const currentSlots = player.partyUnlockedSlots || 1;







    if (typeof PARTY_SLOT_TIERS === 'undefined') return null;







    return PARTY_SLOT_TIERS.find(t => t.from === currentSlots || t.targetSlots > currentSlots) || null;







}















function canUnlockPartySlots(targetSlots) {







    if (!player) return false;







    const tier = targetSlots







        ? (typeof PARTY_SLOT_TIERS !== 'undefined' && PARTY_SLOT_TIERS.find(t => t.targetSlots === targetSlots))







        : getNextPartySlotTier();







    if (!tier) return false;







    if (!isAreaBossDefeated(tier.reqBossArea)) return false;







    if ((player.gold || 0) < tier.cost) return false;







    return true;







}















function unlockPartySlots() {







    if (!player) return false;







    const tier = getNextPartySlotTier();







    if (!tier) {







        showToast('Max Party Size', 'Party capacity is already at the maximum (5 Heroes)!', 'info');







        return false;







    }















    if (!isAreaBossDefeated(tier.reqBossArea)) {







        showToast('Requirement Locked', `Must defeat Area ${tier.reqBossArea} Boss (${tier.reqBossName}) first!`, 'warning');







        return false;







    }















    if ((player.gold || 0) < tier.cost) {







        showToast('Insufficient Gold', `Unlocking ${tier.targetSlots}-Hero squad requires ${tier.cost.toLocaleString()} Gold.`, 'warning');







        return false;







    }















    player.gold -= tier.cost;







    player.partyUnlockedSlots = tier.targetSlots;







    playSFX('achievement');







    showToast('Squad Expanded!', `Active party capacity unlocked to ${player.partyUnlockedSlots} Heroes!`, 'level', 6000);















    updateHeader();







    if (typeof renderBarracksUI === 'function') {







        if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');







        if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');







    }







    return true;







}















function setHeroRow(heroId, row) {







    if (!player || !player.roster) return false;







    if (row !== 'front' && row !== 'back') return false;







    const hero = player.roster.find(h => h.id === heroId);







    if (!hero) return false;







    if (hero.row === row) return true;















    // Row capacity validation for active party members







    if (player.activeParty && player.activeParty.includes(heroId)) {







        const otherActiveHeroes = player.roster.filter(h => player.activeParty.includes(h.id) && h.id !== heroId);







        const rowCount = otherActiveHeroes.filter(h => h.row === row).length;







        if (rowCount >= 3) {







            showToast('Formation Limit', `${row === 'front' ? 'Frontline' : 'Backline'} accommodates at most 3 heroes!`, 'warning');







            return false;







        }







    }















    hero.row = row;







    showToast('Formation Updated', `${hero.name} moved to the ${row === 'front' ? 'Frontline' : 'Backline'}.`, 'info');







    if (typeof renderBarracksUI === 'function') {







        if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');







        if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');







    }







    return true;







}















function toggleHeroRow(heroId) {







    if (!player || !player.roster) return false;







    const hero = player.roster.find(h => h.id === heroId);







    if (!hero) return false;







    const targetRow = (hero.row === 'front') ? 'back' : 'front';







    return setHeroRow(heroId, targetRow);







}















function assignHeroToParty(heroId) {







    if (!player || !player.roster) return false;







    player.activeParty = player.activeParty || ['hero_main'];







    player.partyUnlockedSlots = player.partyUnlockedSlots || 1;















    if (player.activeParty.includes(heroId)) {







        showToast('Already Deployed', 'This hero is already in the active party.', 'info');







        return false;







    }















    if (player.activeParty.length >= player.partyUnlockedSlots) {







        showToast('Party Full', `Active party is full (${player.activeParty.length}/${player.partyUnlockedSlots} slots). Upgrade squad size or bench a hero.`, 'warning');







        return false;







    }















    const hero = player.roster.find(h => h.id === heroId);







    if (!hero) return false;















    // Check row limits







    const activeHeroes = player.roster.filter(h => player.activeParty.includes(h.id));







    const frontCount = activeHeroes.filter(h => h.row === 'front').length;







    const backCount = activeHeroes.filter(h => h.row === 'back').length;















    if (hero.row === 'front' && frontCount >= 3) {







        showToast('Frontline Full', 'Frontline accommodates up to 3 heroes. Move hero to backline first.', 'warning');







        return false;







    }







    if (hero.row === 'back' && backCount >= 3) {







        showToast('Backline Full', 'Backline accommodates up to 3 heroes. Move hero to frontline first.', 'warning');







        return false;







    }















    player.activeParty.push(heroId);







    showToast('Hero Deployed', `${hero.name} joined the active battle party!`, 'info');















    if (typeof renderBarracksUI === 'function') {







        if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');







        if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');







    }







    return true;







}















function removeHeroFromParty(heroId) {







    if (!player || !player.activeParty) return false;







    if (heroId === 'hero_main') {







        showToast('Cannot Remove Leader', 'The Main Hero must always lead the active party!', 'warning');







        return false;







    }







    const hero = player.roster && player.roster.find(h => h.id === heroId);







    if (hero && hero.isMain) {







        showToast('Cannot Remove Leader', 'The Main Hero must always lead the active party!', 'warning');







        return false;







    }















    if (!player.activeParty.includes(heroId)) return false;















    player.activeParty = player.activeParty.filter(id => id !== heroId);







    showToast('Hero Benched', `${hero ? hero.name : 'Hero'} removed from active party.`, 'info');















    if (typeof renderBarracksUI === 'function') {







        if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');







        if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');







    }







    return true;







}















function randomChoice(arr) {







    if (!arr || !Array.isArray(arr) || arr.length === 0) return null;







    return arr[Math.floor(Math.random() * arr.length)];







}















function selectPartyTarget(livingParty) {
    if (typeof livingParty === 'string') {
        if (typeof battleState !== 'undefined' && battleState && battleState.minions) {
            const m = battleState.minions.find(x => x && x.id === livingParty && x.hp > 0);
            if (m) return m;
        }
        if (typeof player !== 'undefined' && player && player.roster) {
            const h = player.roster.find(x => x && x.id === livingParty);
            if (h) return h;
        }
        return null;
    }
    if (!livingParty || !Array.isArray(livingParty) || livingParty.length === 0) return null;







    let livingMinions = (typeof battleState !== 'undefined' && battleState && battleState.minions) ? battleState.minions.filter(m => m && m.hp > 0) : [];
    let frontHeroes = livingParty.filter(h => h.row === 'front');
    let frontCombatants = [...frontHeroes, ...livingMinions];







    let backHeroes = livingParty.filter(h => h.row === 'back');







    // Frontline Collapse: If all frontline heroes are down, backline is 100% exposed







    if (frontCombatants.length === 0) return randomChoice(backHeroes);







    if (backHeroes.length === 0) return randomChoice(frontCombatants);







    // Standard Weighting: 75% Frontline, 25% Backline







    let roll = Math.random() * 100;







    if (roll < 75) {







        return randomChoice(frontCombatants);







    } else {







        return randomChoice(backHeroes);







    }







}















function computeHeroStats(hero) {
    if (hero && hero.isMinion) return hero;







    if (!hero) return null;







    if (hero.isMain && typeof pStats !== 'undefined' && pStats) {







        return pStats;







    }















    const base = hero.baseStats || { hp: 100, maxHp: 100, mp: 50, maxMp: 50, atk: 10, def: 8, matk: 10, mdef: 8, spd: 12, crit: 5 };















    const total = {







        maxHp: base.maxHp || base.hp || 100,







        hp: hero.hp !== undefined ? hero.hp : (base.hp || base.maxHp || 100),







        maxMp: base.maxMp || base.mp || 50,







        mp: hero.mp !== undefined ? hero.mp : (base.mp || base.maxMp || 50),







        atk: base.atk || 10,







        def: base.def || 8,







        matk: base.matk || 10,







        mdef: base.mdef || 8,







        spd: base.spd || 12,







        crit: base.crit || 5







    };















    if (hero.equipment) {







        const slots = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'accessory'];







        slots.forEach(slot => {







            const item = hero.equipment[slot];







            if (item) {







                const s = (typeof getItemTotalStats === 'function') ? getItemTotalStats(item) : {};







                if (s.maxHp) total.maxHp += s.maxHp;







                if (s.maxMp) total.maxMp += s.maxMp;







                if (s.atk) total.atk += s.atk;







                if (s.def) total.def += s.def;







                if (s.matk) total.matk += s.matk;







                if (s.mdef) total.mdef += s.mdef;







                if (s.spd) total.spd += s.spd;







                if (s.crit) total.crit += s.crit;







            }







        });







    }















    // Specialization Stat Multipliers for Tier 2 and Tier 3 classes







    const classId = hero.classId;







    const cls = (typeof CLASSES_DB !== 'undefined' && classId && CLASSES_DB[classId]);







    if (cls && cls.tier >= 2 && cls.statMods) {







        if (cls.statMods.atk) total.atk = Math.round(total.atk * cls.statMods.atk);







        if (cls.statMods.def) total.def = Math.round(total.def * cls.statMods.def);







        if (cls.statMods.matk) total.matk = Math.round(total.matk * cls.statMods.matk);







        if (cls.statMods.mdef) total.mdef = Math.round(total.mdef * cls.statMods.mdef);







        if (cls.statMods.spd) total.spd = Math.round(total.spd * cls.statMods.spd);
        // Soul Harvest: +4% MATK per Soul Remnant
        if (typeof battleState !== 'undefined' && battleState && battleState.soulRemnants && typeof heroHasPassive === 'function' && heroHasPassive(hero, 'soul_harvest')) {
            total.matk = Math.round(total.matk * (1 + (battleState.soulRemnants * 0.04)));
        }







        if (cls.statMods.maxHp) total.maxHp = Math.round(total.maxHp * cls.statMods.maxHp);







        if (cls.statMods.maxMp) total.maxMp = Math.round(total.maxMp * cls.statMods.maxMp);







        if (cls.statMods.crit) total.crit += cls.statMods.crit;







    }















    // Mythic Set Bonuses
    if (typeof MYTHIC_SETS_DB !== 'undefined' && typeof hasHeroSetBonus === 'function') {
        if (hasHeroSetBonus(hero, 'titans_bulwark', 2)) {
            total.maxHp = Math.round(total.maxHp * 1.25);
            total.def = Math.round(total.def * 1.20);
            total.mdef = Math.round(total.mdef * 1.20);
        }
        if (hasHeroSetBonus(hero, 'archons_voidweave', 2)) {
            total.matk = Math.round(total.matk * 1.25);
        }
        if (hasHeroSetBonus(hero, 'shadowstalker_regalia', 2)) {
            total.crit = (total.crit || 0) + 25;
            total.spd = (total.spd || 0) + 15;
        }
    }

    return total;







}















function calculateHeroGearScore(hero) {







    if (!hero || !hero.equipment) return 0;







    let score = 0;







    const slots = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'accessory'];







    slots.forEach(slot => {







        const item = hero.equipment[slot];







        if (item && typeof calculateGearScore === 'function') {







            score += calculateGearScore(item);







        }







    });







    return score;







}















function formatItemStats(item) {







    if (!item) return '';







    let stats = (typeof getItemTotalStats === 'function') ? getItemTotalStats(item) : {};







    let parts = [];







    if (stats.atk) parts.push(`+${stats.atk} ATK`);







    if (stats.def) parts.push(`+${stats.def} DEF`);







    if (stats.matk) parts.push(`+${stats.matk} MATK`);







    if (stats.mdef) parts.push(`+${stats.mdef} MDEF`);







    if (stats.spd) parts.push(`+${stats.spd} SPD`);







    if (stats.maxHp) parts.push(`+${stats.maxHp} HP`);







    if (stats.maxMp) parts.push(`+${stats.maxMp} MP`);







    if (stats.crit) parts.push(`+${stats.crit}% Crit`);







    return parts.join(', ') || 'Standard item';







}















function equipHeroItem(heroId, itemOrId, slotType) {







    if (!player || !player.roster || !player.inventory) return false;







    const hero = player.roster.find(h => h.id === heroId);







    if (!hero) return false;















    if (!hero.equipment) {







        hero.equipment = { weapon: null, helmet: null, armor: null, gloves: null, boots: null, accessory: null };







    }















    let itemIndex = -1;







    let itemToEquip = null;















    if (typeof itemOrId === 'object' && itemOrId !== null) {







        itemToEquip = itemOrId;







        if (player.inventory.equipment && Array.isArray(player.inventory.equipment)) {







            itemIndex = player.inventory.equipment.findIndex(i => i.id === itemToEquip.id);







        }







    } else if (player.inventory.equipment && Array.isArray(player.inventory.equipment)) {







        itemIndex = player.inventory.equipment.findIndex(i => i.id === itemOrId || i.baseName === itemOrId || i.name === itemOrId);







        if (itemIndex !== -1) {







            itemToEquip = player.inventory.equipment[itemIndex];







        }







    }















    if (!itemToEquip && typeof ITEMS_DB !== 'undefined' && ITEMS_DB[itemOrId] && ITEMS_DB[itemOrId].type !== 'consumable') {







        itemToEquip = (typeof generateItem === 'function') ? generateItem(itemOrId, 'Common') : { id: 'gen_' + Date.now(), name: itemOrId, type: slotType || 'weapon' };







    }















    if (!itemToEquip) return false;















    let targetSlot = itemToEquip.type || slotType;







    if (targetSlot === 'chest') targetSlot = 'armor';







    const validSlots = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'accessory'];







    if (!validSlots.includes(targetSlot)) targetSlot = 'weapon';















    const oldItem = hero.equipment[targetSlot];







    if (oldItem) {







        const oldInstance = (typeof oldItem === 'object') ? oldItem : (typeof generateItem === 'function' ? generateItem(oldItem, 'Common') : { id: 'old_' + Date.now(), name: oldItem, type: targetSlot });







        if (!player.inventory.equipment) player.inventory.equipment = [];







        player.inventory.equipment.push(oldInstance);







    }















    if (itemIndex !== -1 && player.inventory.equipment) {







        player.inventory.equipment.splice(itemIndex, 1);







    }















    hero.equipment[targetSlot] = itemToEquip;















    if (hero.isMain) {







        player.equipment[targetSlot] = itemToEquip;







        if (typeof computeStats === 'function') computeStats();







        if (typeof updateHeader === 'function') updateHeader();







        if (typeof renderStats === 'function') renderStats();







        if (typeof renderInventory === 'function') renderInventory();







    }















    showToast('Hero Gear Equipped', `${itemToEquip.name} equipped to ${hero.name}'s ${targetSlot.toUpperCase()}.`, 'info');







    if (typeof renderBarracksUI === 'function') {







        if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');







        if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');







    }







    return true;







}















function unequipHeroItem(heroId, slot) {







    if (!player || !player.roster || !player.inventory) return false;







    const hero = player.roster.find(h => h.id === heroId);







    if (!hero || !hero.equipment || !hero.equipment[slot]) return false;















    const oldItem = hero.equipment[slot];







    const oldInstance = (typeof oldItem === 'object') ? oldItem : (typeof generateItem === 'function' ? generateItem(oldItem, 'Common') : { id: 'old_' + Date.now(), name: oldItem, type: slot });







    if (!player.inventory.equipment) player.inventory.equipment = [];







    player.inventory.equipment.push(oldInstance);















    hero.equipment[slot] = null;















    if (hero.isMain) {







        player.equipment[slot] = null;







        if (typeof computeStats === 'function') computeStats();







        if (typeof updateHeader === 'function') updateHeader();







        if (typeof renderStats === 'function') renderStats();







        if (typeof renderInventory === 'function') renderInventory();







    }















    showToast('Hero Gear Unequipped', `Unequipped ${oldInstance.name} from ${hero.name}.`, 'info');







    if (typeof renderBarracksUI === 'function') {







        if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');







        if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');







    }







    return true;







}















function autoEquipHeroBestGear(heroId) {







    if (!player || !player.roster || !player.inventory) return 0;







    const hero = player.roster.find(h => h.id === heroId);







    if (!hero) return 0;















    if (hero.isMain) {







        return (typeof autoEquipBestGear === 'function') ? autoEquipBestGear() : 0;







    }















    if (!hero.equipment) {







        hero.equipment = { weapon: null, helmet: null, armor: null, gloves: null, boots: null, accessory: null };







    }







    if (!player.inventory.equipment) player.inventory.equipment = [];















    const slots = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'accessory'];







    let swappedCount = 0;















    for (let slot of slots) {







        let curEquipped = hero.equipment[slot];







        let curScore = curEquipped ? calculateGearScore(curEquipped) : -1;















        let bestIndex = -1;







        let bestScore = curScore;















        for (let i = 0; i < player.inventory.equipment.length; i++) {







            let item = player.inventory.equipment[i];







            if (!item) continue;







            let itemSlot = item.type;







            if (itemSlot === 'chest') itemSlot = 'armor';







            if (itemSlot === slot) {







                let score = calculateGearScore(item);







                if (score > bestScore) {







                    bestScore = score;







                    bestIndex = i;







                }







            }







        }















        if (bestIndex !== -1) {







            let bestItem = player.inventory.equipment[bestIndex];







            player.inventory.equipment.splice(bestIndex, 1);







            if (curEquipped) {







                let oldInstance = (typeof curEquipped === 'object') ? curEquipped : (typeof generateItem === 'function' ? generateItem(curEquipped, 'Common') : { id: 'old_' + Date.now(), name: curEquipped, type: slot });







                player.inventory.equipment.push(oldInstance);







            }







            hero.equipment[slot] = bestItem;







            swappedCount++;







        }







    }















    if (swappedCount > 0) {







        showToast('Hero Gear Optimized', `Equipped ${swappedCount} superior item${swappedCount > 1 ? 's' : ''} on ${hero.name}!`, 'info');







        if (typeof renderBarracksUI === 'function') {







            if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');







            if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');







        }







    } else {







        showToast('Gear Optimized', `${hero.name}'s equipment is already optimal!`, 'info');







    }















    return swappedCount;







}















let inspectedHeroId = null;















function openHeroInspector(heroId) {







    inspectedHeroId = heroId;







    if (typeof renderBarracksUI === 'function') {







        if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');







        if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');







    }







}















function closeHeroInspector() {







    inspectedHeroId = null;







    if (typeof renderBarracksUI === 'function') {







        if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');







        if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');







    }







}















function openMercenaryModal() {







    syncMainHero();







    renderBarracksUI('mercenary-modal-content');







    openModal('modal-mercenary');







}















function closeMercenaryModal() {







    closeModal('modal-mercenary');







}















function renderBarracksUI(targetId = 'mercenary-modal-content') {







    syncMainHero();







    const container = document.getElementById(targetId);







    if (!container) return;















    const roster = player.roster || [];







    const rosterMax = player.rosterMax || 5;







    const nextExp = (typeof getNextBarracksExpansion === 'function') ? getNextBarracksExpansion() : null;







    const partySlots = player.partyUnlockedSlots || 1;







    const nextSlotTier = (typeof getNextPartySlotTier === 'function') ? getNextPartySlotTier() : null;















    // A. HERO INSPECTOR SUB-VIEW







    if (inspectedHeroId) {







        const hero = roster.find(h => h.id === inspectedHeroId);







        if (!hero) {







            inspectedHeroId = null;







        } else {







            const isMain = !!hero.isMain;







            const rankInfo = (typeof HERO_RANKS_DB !== 'undefined' && HERO_RANKS_DB[hero.rank]) || { color: '#94a3b8', name: 'Rank ' + hero.rank };







            const isInParty = player.activeParty && player.activeParty.includes(hero.id);







            const heroStats = computeHeroStats(hero);







            const heroScore = calculateHeroGearScore(hero);







            const slots = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'accessory'];















            let inspHtml = `







                <div class="hero-inspector-panel">







                    <button class="btn" style="padding: 6px 14px; font-size: 12px; margin-bottom: 12px; background: rgba(255,255,255,0.1);" onclick="closeHeroInspector()">







                        ← Back to Barracks Roster







                    </button>















                    <div class="hero-inspector-header">







                        <div class="hero-inspector-identity">







                            <span class="hero-rank-badge" style="background: ${rankInfo.color}22; color: ${rankInfo.color}; border: 1px solid ${rankInfo.color}; font-size: 13px;">







                                ${hero.rank}-RANK







                            </span>







                            <span class="hero-inspector-name">${hero.name}</span>

                            <button class="btn-rename-hero" onclick="openRenameHeroModal('${hero.id}')" title="Rename Hero">✏️</button>

                            ${hero.locked ? `<span style="font-size: 11px; background: #7c2d12; color: #fdba74; border: 1px solid #ea580c; padding: 2px 8px; border-radius: 4px; font-weight: bold;">🔒 Locked</span>` : ''}







                            ${isMain ? `<span class="hero-main-badge">👑 Leader</span>` : ''}







                            ${isInParty ? `<span style="font-size: 11px; background: #065f46; color: #6ee7b7; border: 1px solid #10b981; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Active Squad</span>` : ''}







                            <span class="hero-row-badge ${hero.row === 'front' ? 'front' : 'back'}">${hero.row === 'front' ? '🛡️ Frontline' : '🏹 Backline'}</span>







                            <span class="hero-gear-score-pill">Gear Score: <b>${heroScore}</b></span>







                            ${(() => {







                                const hCls = (typeof CLASSES_DB !== 'undefined' && CLASSES_DB[hero.classId]) || {};







                                const hTier = hCls.tier || 1;







                                const isReady = (hTier === 1 && hero.level >= 25) || (hTier === 2 && hero.level >= 50);







                                const isSpec = hTier >= 2;







                                let res = '';







                                if (isReady) res += `<button class="btn btn-evolve-ready" style="padding: 3px 10px; font-size: 11px; margin-left: 6px;" onclick="openClassSanctumForHero('${hero.id}')">👑 Evolve Class (Ready!)</button>`;







                                if (isSpec) res += `<button class="btn btn-respec-shortcut" style="padding: 3px 10px; font-size: 11px; margin-left: 6px;" onclick="openClassSanctumForHero('${hero.id}')">🔄 Respec Path (5,000G)</button>`;







                                return res;







                            })()}







                        </div>















                        <div class="hero-inspector-actions">







                            <button class="btn" style="padding: 5px 12px; font-size: 12px;" onclick="toggleHeroRow('${hero.id}')">







                                ${hero.row === 'front' ? 'Move to Backline' : 'Move to Frontline'}







                            </button>







                            ${isInParty







                                ? (isMain







                                    ? `<button class="btn" disabled style="padding: 5px 12px; font-size: 12px; opacity: 0.5;">👑 Leader Locked</button>`







                                    : `<button class="btn" style="padding: 5px 12px; font-size: 12px; background: #b91c1c; color: white;" onclick="removeHeroFromParty('${hero.id}')">Remove from Party</button>`)







                                : `<button class="btn" style="padding: 5px 12px; font-size: 12px; background: #059669; color: white;" onclick="assignHeroToParty('${hero.id}')">⚔️ Deploy to Party</button>`







                            }







                            <button class="btn" style="padding: 5px 12px; font-size: 12px; background: #4f46e5; border-color: #6366f1; color: white;" onclick="autoEquipHeroBestGear('${hero.id}')">







                                ⚡ Auto-Equip Best Gear







                            </button>

                            ${!isMain ? `

                                <button class="btn" style="padding: 5px 12px; font-size: 12px; background: ${hero.locked ? '#475569' : 'rgba(255,255,255,0.1)'};" onclick="toggleHeroLock('${hero.id}')">

                                    ${hero.locked ? '🔒 Unlock Hero' : '🔓 Lock Hero'}

                                </button>

                            ` : ''}







                        </div>







                    </div>















                    <div style="font-size: 12px; color: #94a3b8; margin-bottom: 10px;">







                        Class: <b style="color: #cbd5e1; text-transform: capitalize;">${hero.classId}</b> • 







                        Element: <b style="color: #fde047;">${hero.element || 'Physical'}</b> • 







                        Level: <b style="color: #4ade80;">${hero.level || 1}</b>







                    </div>















                    <!-- Hero Total Stats Box -->







                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: rgba(0,0,0,0.4); border: 1px solid #334155; padding: 10px; border-radius: 8px; margin-bottom: 14px; text-align: center;">







                        <div class="hero-stat-badge-pill"><span style="color: #94a3b8;">Max HP:</span> <b style="color: #4ade80;">${heroStats.maxHp}</b></div>







                        <div class="hero-stat-badge-pill"><span style="color: #94a3b8;">ATK:</span> <b style="color: #f87171;">${heroStats.atk}</b></div>







                        <div class="hero-stat-badge-pill"><span style="color: #94a3b8;">DEF:</span> <b style="color: #60a5fa;">${heroStats.def}</b></div>







                        <div class="hero-stat-badge-pill"><span style="color: #94a3b8;">SPD:</span> <b style="color: #fbbf24;">${heroStats.spd}</b></div>







                        <div class="hero-stat-badge-pill"><span style="color: #94a3b8;">Max MP:</span> <b style="color: #a855f7;">${heroStats.maxMp}</b></div>







                        <div class="hero-stat-badge-pill"><span style="color: #94a3b8;">MATK:</span> <b style="color: #ec4899;">${heroStats.matk}</b></div>







                        <div class="hero-stat-badge-pill"><span style="color: #94a3b8;">MDEF:</span> <b style="color: #38bdf8;">${heroStats.mdef}</b></div>







                        <div class="hero-stat-badge-pill"><span style="color: #94a3b8;">CRIT:</span> <b style="color: #f59e0b;">${heroStats.crit}%</b></div>







                    </div>















                    <!-- 6 Equipment Slots -->







                    <div style="font-size: 14px; font-weight: bold; color: #ffd700; margin-bottom: 6px;">







                        ${(() => {
                        if (typeof MYTHIC_SETS_DB === 'undefined' || typeof getHeroActiveSetCount !== 'function') return '';
                        let activeSets = [];
                        for (let sId in MYTHIC_SETS_DB) {
                            let count = getHeroActiveSetCount(hero, sId);
                            if (count > 0) {
                                let sDef = MYTHIC_SETS_DB[sId];
                                activeSets.push(`
                                    <div class="hero-set-pill" style="font-size: 11px; background: rgba(244,63,94,0.15); border: 1px solid #f43f5e; border-radius: 6px; padding: 4px 8px; margin-bottom: 4px;">
                                        <span style="color: #f43f5e; font-weight: bold;">🌟 ${sDef.name} (${count}/4 Pieces)</span>:
                                        <span style="color: ${count >= 2 ? '#4ade80' : '#64748b'};">[2pc: ${(sDef.bonuses && sDef.bonuses[2] ? sDef.bonuses[2].desc : (sDef.twoPieceBonus ? sDef.twoPieceBonus.desc : ''))}]</span>
                                        <span style="color: ${count >= 4 ? '#4ade80' : '#64748b'};">[4pc: ${(sDef.bonuses && sDef.bonuses[4] ? sDef.bonuses[4].desc : (sDef.fourPieceBonus ? sDef.fourPieceBonus.desc : ''))}]</span>
                                    </div>
                                `);
                            }
                        }
                        if (activeSets.length > 0) {
                            return `<div style="margin-bottom: 10px;">${activeSets.join('')}</div>`;
                        }
                        return '';
                    })()}
                    🛡️ Hero Equipment (6 Slots)







                    </div>







                    <div class="hero-gear-grid">







            `;















            const invEquip = (player.inventory && player.inventory.equipment) ? player.inventory.equipment : [];















            slots.forEach(slot => {







                const equippedItem = hero.equipment ? hero.equipment[slot] : null;







                const slotName = slot.toUpperCase();







                const slotScore = equippedItem ? calculateGearScore(equippedItem) : 0;







                const rarity = equippedItem ? (equippedItem.rarity || 'Common') : '';







                const tierInfo = (typeof RARITY_TIERS !== 'undefined' && RARITY_TIERS[rarity]) || { color: '#ffffff' };















                // Find compatible inventory items







                const compatibleInv = invEquip.filter(i => {







                    if (!i) return false;







                    let t = i.type;







                    if (t === 'chest') t = 'armor';







                    return t === slot;







                });















                inspHtml += `







                    <div class="hero-gear-slot-card">







                        <div class="hero-gear-slot-header">







                            <span class="hero-gear-slot-title">${slotName}</span>







                            ${equippedItem ? `<span style="font-size: 10px; color: #fbbf24;">Score: <b>${slotScore}</b></span>` : ''}







                        </div>















                        ${equippedItem ? `







                            <div class="hero-gear-equipped-box" style="border-color: ${tierInfo.color};">







                                <div style="display: flex; justify-content: space-between; align-items: center;">







                                    <span style="font-weight: bold; color: ${tierInfo.color}; font-size: 12px;">







                                        ${equippedItem.name}${equippedItem.upgradeLevel ? ` +${equippedItem.upgradeLevel}` : ''}







                                    </span>







                                    <button class="btn" style="padding: 2px 8px; font-size: 10px; background: #dc2626; color: white;" onclick="unequipHeroItem('${hero.id}', '${slot}')">







                                        Unequip







                                    </button>







                                </div>







                                <div style="font-size: 10px; color: #94a3b8;">







                                    ${rarity} • ${formatItemStats(equippedItem)}







                                </div>







                            </div>







                        ` : `







                            <div class="hero-gear-equipped-box is-empty">







                                No ${slotName} Equipped







                            </div>







                        `}















                        <!-- Available in Inventory -->







                        <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">







                            Inventory (${compatibleInv.length}):







                        </div>







                        <div class="hero-gear-inv-list">







                            ${compatibleInv.length === 0 ? `<div style="color: #64748b; font-size: 10px; font-style: italic; padding: 4px;">No items in bag</div>` : ''}







                            ${compatibleInv.map(invItem => {







                                const invRarity = invItem.rarity || 'Common';







                                const invTier = (typeof RARITY_TIERS !== 'undefined' && RARITY_TIERS[invRarity]) || { color: '#ffffff' };







                                const score = calculateGearScore(invItem);







                                return `







                                    <div class="hero-gear-inv-item">







                                        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;">







                                            <span style="color: ${invTier.color}; font-weight: bold;">${invItem.name}${invItem.upgradeLevel ? ` +${invItem.upgradeLevel}` : ''}</span>







                                            <span style="color: #fbbf24; font-size: 9px; margin-left: 4px;">(${score})</span>







                                        </div>







                                        <button class="btn" style="padding: 2px 8px; font-size: 10px; color: #55ff55; border-color: #55ff55;" onclick="equipHeroItem('${hero.id}', '${invItem.id}', '${slot}')">







                                            Equip







                                        </button>







                                    </div>







                                `;







                            }).join('')}







                        </div>







                    </div>







                `;







            });















            inspHtml += `







                    </div>







                </div>







            `;







            container.innerHTML = inspHtml;







            return;







        }







    }















    // B. STANDARD BARRACKS & ROSTER VIEW







    let html = '';















    // 1. Barracks & Squad Status Bar







    html += `







        <div class="barracks-status-bar">







            <div>







                <span class="barracks-capacity-text">🏛️ Mercenary Barracks</span>







                <span class="barracks-capacity-badge" style="margin-left: 8px;">







                    Roster: <b>${roster.length}</b> / <b>${rosterMax}</b> Heroes







                </span>







                <span class="barracks-capacity-badge" style="margin-left: 6px; background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #6ee7b7;">







                    Squad: <b>${player.activeParty.length}</b> / <b>${partySlots}</b> Active







                </span>







            </div>







            <div style="display: flex; gap: 8px; flex-wrap: wrap;">







                ${nextSlotTier ? `







                    <button class="btn" style="padding: 5px 12px; font-size: 12px; background: #059669; border-color: #10b981; color: white;" onclick="unlockPartySlots()">







                        ⚔️ Unlock ${nextSlotTier.label} (${nextSlotTier.cost.toLocaleString()}g)







                    </button>







                ` : `







                    <span style="font-size: 12px; color: #10b981; font-weight: bold; align-self: center;">🏆 Grand Party Maxed (5 Slots)</span>







                `}







                ${nextExp ? `







                    <button class="btn" style="padding: 5px 12px; font-size: 12px; background: #4f46e5; border-color: #6366f1; color: white;" onclick="expandBarracksCapacity()">







                        🏛️ Expand Barracks to ${nextExp.to} (${nextExp.cost.toLocaleString()}g)







                    </button>







                ` : `







                    <span style="font-size: 12px; color: #10b981; font-weight: bold; align-self: center;">🏆 Barracks Maxed (25)</span>







                `}







            </div>







        </div>







    `;















    // 2. 3-Tier Recruitment Scouting Section







    html += `







        <div class="scout-section-title">







            <span>🎲 Mercenary Recruitment Hall</span>







            <span style="font-size: 11px; font-weight: normal; color: #94a3b8;">(All recruits start at Level 1 with unique potential)</span>







        </div>







        <div class="scout-grid">







    `;















    // Tier 1 Standard







    html += `







        <div class="scout-card tier-standard">







            <div>







                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">







                    <span style="font-weight: bold; font-size: 14px; color: #60a5fa;">⚔️ Standard Scout</span>







                    <span class="scout-cost-badge scout-cost-gold">💰 250 Gold</span>







                </div>







                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">Recruit local sellswords & adventurers.</div>







                <div class="scout-rates-table">







                    <span class="scout-rate-pill" style="color: #ec4899;">S: 0.1%</span>







                    <span class="scout-rate-pill" style="color: #f59e0b;">A: 0.5%</span>







                    <span class="scout-rate-pill" style="color: #a855f7;">B: 1%</span>







                    <span class="scout-rate-pill" style="color: #38bdf8;">C: 15%</span>







                    <span class="scout-rate-pill" style="color: #4ade80;">D: 25%</span>







                    <span class="scout-rate-pill" style="color: #cbd5e1;">E: 30%</span>







                    <span class="scout-rate-pill" style="color: #94a3b8;">F: 28.4%</span>







                </div>







            </div>







            <button class="btn" style="width: 100%; background: #2563eb; color: #fff; border-color: #3b82f6;" onclick="recruitHero('standard')">







                Scout (250 Gold)







            </button>







        </div>







    `;















    // Tier 2 Advanced







    html += `







        <div class="scout-card tier-advanced">







            <div>







                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">







                    <span style="font-weight: bold; font-size: 14px; color: #c084fc;">🛡️ Advanced Scout</span>







                    <span class="scout-cost-badge scout-cost-gold">💰 1,000 Gold</span>







                </div>







                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">Contract seasoned veterans with higher potential.</div>







                <div class="scout-rates-table">







                    <span class="scout-rate-pill" style="color: #ec4899;">S: 0.5%</span>







                    <span class="scout-rate-pill" style="color: #f59e0b;">A: 1.5%</span>







                    <span class="scout-rate-pill" style="color: #a855f7;">B: 3%</span>







                    <span class="scout-rate-pill" style="color: #38bdf8;">C: 25%</span>







                    <span class="scout-rate-pill" style="color: #4ade80;">D: 35%</span>







                    <span class="scout-rate-pill" style="color: #cbd5e1;">E: 25%</span>







                    <span class="scout-rate-pill" style="color: #94a3b8;">F: 10%</span>







                </div>







            </div>







            <button class="btn" style="width: 100%; background: #7c3aed; color: #fff; border-color: #8b5cf6;" onclick="recruitHero('advanced')">







                Scout (1,000 Gold)







            </button>







        </div>







    `;















    // Tier 3 Royal (Bounty Marks)







    html += `







        <div class="scout-card tier-royal">







            <div>







                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">







                    <span style="font-weight: bold; font-size: 14px; color: #fbbf24;">👑 Royal Mercenary Scout</span>







                    <span class="scout-cost-badge scout-cost-marks">🎖️ 5 Marks</span>







                </div>







                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">Elite champions. Zero E or F ranks guaranteed!</div>







                <div class="scout-rates-table">







                    <span class="scout-rate-pill" style="color: #ec4899;">S: 2%</span>







                    <span class="scout-rate-pill" style="color: #f59e0b;">A: 8%</span>







                    <span class="scout-rate-pill" style="color: #a855f7;">B: 20%</span>







                    <span class="scout-rate-pill" style="color: #38bdf8;">C: 40%</span>







                    <span class="scout-rate-pill" style="color: #4ade80;">D: 30%</span>







                </div>







            </div>







            <button class="btn" style="width: 100%; background: #d97706; color: #fff; border-color: #f59e0b;" onclick="recruitHero('royal')">







                Royal Scout (5 Marks)







            </button>







        </div>







    `;















    html += `</div>`; // End scout-grid















        // 3. Active Battle Squad Tray (Pinned Top View) & Barracks Reserves Overhaul

    const activeHeroes = (player.activeParty || []).map(id => roster.find(h => h.id === id)).filter(Boolean);

    const reserveHeroes = roster.filter(h => !(player.activeParty || []).includes(h.id));



    const totalActiveCount = activeHeroes.length;

    const totalReserveCount = reserveHeroes.length;

    const totalReadyCount = roster.filter(h => {

        const hClsId = (h.isMain || h.id === 'hero_main') ? (player.currentClass || h.classId || 'warrior') : (h.classId || 'warrior');

        const hCls = (typeof CLASSES_DB !== 'undefined' && CLASSES_DB[hClsId]) || {};

        const hTier = hCls.tier || 1;

        const hLvl = (h.isMain || h.id === 'hero_main') ? player.level : (h.level || 1);

        return (hTier === 1 && hLvl >= 25) || (hTier === 2 && hLvl >= 50);

    }).length;



    // Filter active heroes if dropdown or ready filter applied

    const filteredActiveHeroes = activeHeroes.filter(h => passesHeroFilter(h, window.barracksFilter));



    let activeCardsHtml = '';

    filteredActiveHeroes.forEach(hero => {

        const rankInfo = (typeof HERO_RANKS_DB !== 'undefined' && HERO_RANKS_DB[hero.rank]) || { color: '#94a3b8', name: 'Rank ' + hero.rank };

        const isMain = !!(hero.isMain || hero.id === 'hero_main');

        const heroStats = (typeof computeHeroStats === 'function') ? computeHeroStats(hero) : (hero.baseStats || {});

        const heroScore = (typeof calculateHeroGearScore === 'function') ? calculateHeroGearScore(hero) : 0;

        const curHp = isMain ? (pStats && pStats.hp !== undefined ? pStats.hp : player.baseStats.hp) : (hero.hp !== undefined ? hero.hp : heroStats.maxHp);

        const hClsId = isMain ? (player.currentClass || hero.classId || 'warrior') : (hero.classId || 'warrior');

        const hCls = (typeof CLASSES_DB !== 'undefined' && CLASSES_DB[hClsId]) || {};

        const hTier = hCls.tier || 1;

        const hLvl = isMain ? player.level : (hero.level || 1);

        const isReady = (hTier === 1 && hLvl >= 25) || (hTier === 2 && hLvl >= 50);

        const clsName = hCls.name || hero.classId || 'Warrior';



        activeCardsHtml += `

            <div class="hero-card hero-card-squad ${isMain ? 'squad-card-leader' : 'squad-card-merc'}">

                <div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 4px;">

                        <span class="hero-rank-badge" style="background: ${rankInfo.color}22; color: ${rankInfo.color}; border: 1px solid ${rankInfo.color}; font-size: 11px;">

                            ${hero.rank}-RANK

                        </span>

                        <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">

                            ${isMain ? `<span class="hero-main-badge">👑 Squad Leader</span>` : `<span style="font-size: 10px; background: #065f46; color: #6ee7b7; border: 1px solid #10b981; padding: 1px 6px; border-radius: 3px; font-weight: bold;">⚔️ Deployed</span>`}

                            <span class="hero-row-badge ${hero.row === 'front' ? 'front' : 'back'}">${hero.row === 'front' ? '🛡️ Frontline' : '🏹 Backline'}</span>

                            ${isReady ? `<span class="badge-evolution-ready">✨ Evolution Ready!</span>` : ''}

                        </div>

                    </div>



                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">

                        <div style="display: flex; align-items: center; gap: 4px;">

                            <span style="font-size: 14px; font-weight: bold; color: #f8fafc;">${hero.name}</span>

                            <button class="btn-rename-hero" onclick="openRenameHeroModal('${hero.id}')" title="Rename Hero">✏️</button>

                        </div>

                        <span style="font-size: 12px; color: #a855f7; font-weight: 600;">${clsName} (Lv.${hLvl})</span>

                    </div>



                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; font-size: 11px; margin-bottom: 6px; background: rgba(0,0,0,0.35); padding: 5px 8px; border-radius: 5px;">

                        <div>GS: <b style="color: #38bdf8;">${heroScore}</b></div>

                        <div>HP: <b style="color: #4ade80;">${curHp}/${heroStats.maxHp}</b></div>

                        <div>SPD: <b>${heroStats.spd}</b></div>

                    </div>

                </div>



                <div style="display: flex; gap: 5px; margin-top: 6px; justify-content: flex-end; flex-wrap: wrap;">

                    <button class="btn" style="padding: 4px 8px; font-size: 11px; background: #2563eb; color: white;" onclick="openHeroInspector('${hero.id}')">

                        🛡️ Gear &amp; Stats

                    </button>

                    ${isReady ? `<button class="btn btn-evolve-ready" style="padding: 4px 8px; font-size: 11px;" onclick="openClassSanctumForHero('${hero.id}')">👑 Evolve</button>` : ''}

                    <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="toggleHeroRow('${hero.id}')">

                        ${hero.row === 'front' ? 'Move to Back' : 'Move to Front'}

                    </button>

                    ${isMain

                        ? `<button class="btn" disabled style="padding: 4px 8px; font-size: 11px; opacity: 0.5;">👑 Leader</button>`

                        : `<button class="btn" style="padding: 4px 8px; font-size: 11px; background: #b91c1c; color: white;" onclick="removeHeroFromParty('${hero.id}')">Bench</button>`

                    }

                </div>

            </div>

        `;

    });



    // Empty slot placeholders

    if (player.activeParty.length < partySlots) {

        for (let i = player.activeParty.length + 1; i <= partySlots; i++) {

            activeCardsHtml += `

                <div class="squad-slot-empty" onclick="scrollToReserves()" title="Click to view reserves">

                    <div style="font-size: 13px;">+ Empty Squad Slot (${i}/${partySlots})</div>

                    <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Deploy a hero from reserves below</div>

                </div>

            `;

        }

    }



    if (window.barracksFilter.status !== 'reserve') {

        html += `

            <div class="active-squad-tray">

                <div class="active-squad-header">

                    <div class="active-squad-title">

                        <span>⚔️ Active Battle Squad (${player.activeParty.length}/${partySlots} Deployed)</span>

                    </div>

                    <button class="btn" style="padding: 5px 12px; font-size: 11px; background: #059669; border-color: #10b981; color: white; font-weight: bold;" onclick="optimizeSquadGear()">

                        ⚡ Optimize Squad Gear

                    </button>

                </div>

                <div class="active-squad-grid">

                    ${activeCardsHtml}

                </div>

            </div>

        `;

    }



    // 4. Dynamic Filter & Multi-Factor Sorting Controls Bar

    html += `

        <div class="barracks-controls-bar">

            <!-- Filter Tabs -->

            <div class="barracks-filter-tabs">

                <button class="barracks-filter-tab ${window.barracksFilter.status === 'all' ? 'active' : ''}" onclick="setBarracksFilter('status', 'all')">

                    All Heroes (${roster.length})

                </button>

                <button class="barracks-filter-tab ${window.barracksFilter.status === 'active' ? 'active' : ''}" onclick="setBarracksFilter('status', 'active')">

                    ⚔️ Active Squad (${totalActiveCount}/${partySlots})

                </button>

                <button class="barracks-filter-tab ${window.barracksFilter.status === 'reserve' ? 'active' : ''}" onclick="setBarracksFilter('status', 'reserve')">

                    💤 Reserves (${totalReserveCount})

                </button>

                <button class="barracks-filter-tab ${window.barracksFilter.status === 'ready' ? 'active' : ''}" onclick="setBarracksFilter('status', 'ready')">

                    ✨ Evolution Ready! (${totalReadyCount})

                </button>

            </div>



            <!-- Dropdown Filters & Sorting -->

            <div class="barracks-filter-dropdowns">

                <div class="filter-group">

                    <label>Class:</label>

                    <select id="barracks-filter-class" onchange="setBarracksFilter('classId', this.value)">

                        <option value="all" ${window.barracksFilter.classId === 'all' ? 'selected' : ''}>All Classes</option>

                        <option value="warrior" ${window.barracksFilter.classId === 'warrior' ? 'selected' : ''}>Warrior</option>

                        <option value="mage" ${window.barracksFilter.classId === 'mage' ? 'selected' : ''}>Mage</option>

                        <option value="rogue" ${window.barracksFilter.classId === 'rogue' ? 'selected' : ''}>Rogue</option>

                        <option value="paladin" ${window.barracksFilter.classId === 'paladin' ? 'selected' : ''}>Paladin</option>

                        <option value="berserker" ${window.barracksFilter.classId === 'berserker' ? 'selected' : ''}>Berserker</option>

                        <option value="archmage" ${window.barracksFilter.classId === 'archmage' ? 'selected' : ''}>Archmage</option>

                        <option value="warlock" ${window.barracksFilter.classId === 'warlock' ? 'selected' : ''}>Warlock</option>

                        <option value="assassin" ${window.barracksFilter.classId === 'assassin' ? 'selected' : ''}>Assassin</option>

                        <option value="shadowblade" ${window.barracksFilter.classId === 'shadowblade' ? 'selected' : ''}>Shadowblade</option>
                        <option value="ranger" ${window.barracksFilter.classId === 'ranger' ? 'selected' : ''}>Ranger</option>
                        <option value="beastmaster" ${window.barracksFilter.classId === 'beastmaster' ? 'selected' : ''}>Beastmaster</option>
                        <option value="deadeye_sniper" ${window.barracksFilter.classId === 'deadeye_sniper' ? 'selected' : ''}>Deadeye Sniper</option>
                        <option value="cleric" ${window.barracksFilter.classId === 'cleric' ? 'selected' : ''}>Cleric</option>
                        <option value="high_priest" ${window.barracksFilter.classId === 'high_priest' ? 'selected' : ''}>High Priest</option>
                        <option value="inquisitor" ${window.barracksFilter.classId === 'inquisitor' ? 'selected' : ''}>Inquisitor</option>
                        <option value="necromancer" ${window.barracksFilter.classId === 'necromancer' ? 'selected' : ''}>Necromancer</option>
                        <option value="dread_lich" ${window.barracksFilter.classId === 'dread_lich' ? 'selected' : ''}>Dread Lich</option>
                        <option value="bone_commander" ${window.barracksFilter.classId === 'bone_commander' ? 'selected' : ''}>Bone Commander</option>

                    </select>

                </div>



                <div class="filter-group">

                    <label>Rank:</label>

                    <select id="barracks-filter-rank" onchange="setBarracksFilter('rank', this.value)">

                        <option value="all" ${window.barracksFilter.rank === 'all' ? 'selected' : ''}>All Ranks</option>

                        <option value="S" ${window.barracksFilter.rank === 'S' ? 'selected' : ''}>S-Rank</option>

                        <option value="A" ${window.barracksFilter.rank === 'A' ? 'selected' : ''}>A-Rank</option>

                        <option value="B" ${window.barracksFilter.rank === 'B' ? 'selected' : ''}>B-Rank</option>

                        <option value="C" ${window.barracksFilter.rank === 'C' ? 'selected' : ''}>C-Rank</option>

                        <option value="D" ${window.barracksFilter.rank === 'D' ? 'selected' : ''}>D-Rank</option>

                        <option value="E" ${window.barracksFilter.rank === 'E' ? 'selected' : ''}>E-Rank</option>

                        <option value="F" ${window.barracksFilter.rank === 'F' ? 'selected' : ''}>F-Rank</option>

                    </select>

                </div>



                <div class="filter-group">

                    <label>Position:</label>

                    <select id="barracks-filter-row" onchange="setBarracksFilter('row', this.value)">

                        <option value="all" ${window.barracksFilter.row === 'all' ? 'selected' : ''}>All Positions</option>

                        <option value="front" ${window.barracksFilter.row === 'front' ? 'selected' : ''}>Frontline (75% Aggro)</option>

                        <option value="back" ${window.barracksFilter.row === 'back' ? 'selected' : ''}>Backline (25% Aggro)</option>

                    </select>

                </div>



                <div class="filter-group">

                    <label>Sort:</label>

                    <select id="barracks-sort-select" onchange="setBarracksSortField(this.value)">

                        <option value="rank" ${window.barracksSort.field === 'rank' ? 'selected' : ''}>Rank (Potential: S → F)</option>

                        <option value="level" ${window.barracksSort.field === 'level' ? 'selected' : ''}>Level (Highest → Lowest)</option>

                        <option value="gearScore" ${window.barracksSort.field === 'gearScore' ? 'selected' : ''}>Gear Score (Highest → Lowest)</option>

                        <option value="speed" ${window.barracksSort.field === 'speed' ? 'selected' : ''}>Speed (Fastest Initiative)</option>

                        <option value="name" ${window.barracksSort.field === 'name' ? 'selected' : ''}>Name (Alphabetical)</option>

                    </select>

                    <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="toggleBarracksSortDirection()">

                        ${window.barracksSort.direction === 'asc' ? '🔼 Asc' : '🔽 Desc'}

                    </button>

                </div>



                <button class="btn" style="padding: 4px 8px; font-size: 11px; background: rgba(255,255,255,0.1);" onclick="resetBarracksFilters()">

                    ✖ Reset

                </button>

            </div>

        </div>

    `;



    // 5. Barracks Reserves Section (Bench Heroes)

    const filteredReserves = reserveHeroes.filter(h => passesHeroFilter(h, window.barracksFilter));

    const sortedReserves = sortHeroesList(filteredReserves, window.barracksSort);

    const isSquadFull = player.activeParty.length >= partySlots;



    html += `

        <div class="reserves-section-header" id="barracks-reserves-section">

            <span style="font-size: 14px; font-weight: bold; color: #cbd5e1;">

                💤 Barracks Reserves (${filteredReserves.length} Heroes)

            </span>

            <span style="font-size: 11px; color: #94a3b8;">

                ${isSquadFull ? 'Squad is Full. Bench an active hero to deploy.' : 'Available to deploy into active combat squad.'}

            </span>

        </div>

        <div class="hero-roster-grid reserves-roster-grid">

    `;



    if (window.barracksFilter.status === 'active') {

        html += `

            <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: #94a3b8; font-style: italic;">

                Viewing Active Squad tab. Switch to 'All Heroes' or 'Reserves' to manage benched heroes.

            </div>

        `;

    } else if (sortedReserves.length === 0) {

        html += `

            <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: #94a3b8; font-style: italic;">

                No reserve heroes match the selected filter criteria.

            </div>

        `;

    } else {

        sortedReserves.forEach(hero => {

            const rankInfo = (typeof HERO_RANKS_DB !== 'undefined' && HERO_RANKS_DB[hero.rank]) || { color: '#94a3b8', name: 'Rank ' + hero.rank };

            const isMain = !!(hero.isMain || hero.id === 'hero_main');

            const stats = (typeof computeHeroStats === 'function') ? computeHeroStats(hero) : (hero.baseStats || {});

            const heroScore = (typeof calculateHeroGearScore === 'function') ? calculateHeroGearScore(hero) : 0;

            const hClsId = isMain ? (player.currentClass || hero.classId || 'warrior') : (hero.classId || 'warrior');

            const hCls = (typeof CLASSES_DB !== 'undefined' && CLASSES_DB[hClsId]) || {};

            const hTier = hCls.tier || 1;

            const hLvl = isMain ? player.level : (hero.level || 1);

            const isReady = (hTier === 1 && hLvl >= 25) || (hTier === 2 && hLvl >= 50);

            const clsName = hCls.name || hero.classId || 'Warrior';



            html += `

                <div class="hero-card hero-card-reserve" style="border: 2px solid ${rankInfo.color};">

                    <div>

                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; flex-wrap: wrap; gap: 4px;">

                            <span class="hero-rank-badge" style="background: ${rankInfo.color}22; color: ${rankInfo.color}; border: 1px solid ${rankInfo.color}; font-size: 11px;">

                                ${hero.rank}-RANK

                            </span>

                            <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">

                                <span style="font-size: 10px; background: #334155; color: #94a3b8; padding: 1px 6px; border-radius: 3px;">💤 Reserve</span>

                                ${hero.locked ? `<span style="font-size: 10px; background: #7c2d12; color: #fdba74; border: 1px solid #ea580c; padding: 1px 6px; border-radius: 3px;">🔒 Locked</span>` : ''}

                                <span class="hero-row-badge ${hero.row === 'front' ? 'front' : 'back'}">${hero.row === 'front' ? 'Front' : 'Back'}</span>

                                <span class="hero-gear-score-pill" style="font-size: 10px; padding: 1px 6px;">GS: ${heroScore}</span>

                                ${isReady ? `<span class="badge-evolution-ready">✨ Evolution Ready!</span>` : ''}

                            </div>

                        </div>



                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">

                            <div style="display: flex; align-items: center; gap: 4px;">

                                <span style="font-size: 14px; font-weight: bold; color: #f8fafc;">${hero.name}</span>

                                <button class="btn-rename-hero" onclick="openRenameHeroModal('${hero.id}')" title="Rename Hero">✏️</button>

                            </div>

                            <span style="font-size: 12px; color: #a855f7; font-weight: 600;">${clsName} (Lv.${hLvl})</span>

                        </div>



                        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">

                            Element: <b style="color: #fde047;">${hero.element || 'Physical'}</b>

                        </div>



                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; background: rgba(0,0,0,0.3); padding: 6px; border-radius: 6px; font-size: 11px; text-align: center;">

                            <div><span style="color: #94a3b8;">HP:</span> <b>${stats.maxHp || stats.hp || 100}</b></div>

                            <div><span style="color: #94a3b8;">ATK:</span> <b>${stats.atk || 10}</b></div>

                            <div><span style="color: #94a3b8;">DEF:</span> <b>${stats.def || 8}</b></div>

                            <div><span style="color: #94a3b8;">SPD:</span> <b>${stats.spd || 12}</b></div>

                            <div><span style="color: #94a3b8;">MP:</span> <b>${stats.maxMp || stats.mp || 50}</b></div>

                            <div><span style="color: #94a3b8;">MATK:</span> <b>${stats.matk || 10}</b></div>

                            <div><span style="color: #94a3b8;">MDEF:</span> <b>${stats.mdef || 8}</b></div>

                            <div><span style="color: #94a3b8;">CRIT:</span> <b>${stats.crit || 5}%</b></div>

                        </div>

                    </div>



                    <div style="display: flex; gap: 5px; margin-top: 8px; justify-content: flex-end; flex-wrap: wrap;">

                        <button class="btn" style="padding: 4px 8px; font-size: 11px; background: #2563eb; color: white;" onclick="openHeroInspector('${hero.id}')">

                            🛡️ Gear &amp; Stats

                        </button>

                        ${isReady ? `<button class="btn btn-evolve-ready" style="padding: 4px 8px; font-size: 11px;" onclick="openClassSanctumForHero('${hero.id}')">👑 Evolve</button>` : ''}

                        ${isSquadFull

                            ? `<button class="btn" disabled style="padding: 4px 8px; font-size: 11px; background: #059669; opacity: 0.5; cursor: not-allowed;" title="Party Full">⚔️ Deploy (Full)</button>`

                            : `<button class="btn" style="padding: 4px 8px; font-size: 11px; background: #059669; color: white;" onclick="assignHeroToParty('${hero.id}')">⚔️ Deploy</button>`

                        }

                        <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="toggleHeroRow('${hero.id}')">

                            ${hero.row === 'front' ? 'Move to Back' : 'Move to Front'}

                        </button>

                        <button class="btn" style="padding: 4px 8px; font-size: 11px; background: ${hero.locked ? '#475569' : 'rgba(255,255,255,0.1)'};" onclick="toggleHeroLock('${hero.id}')">

                            ${hero.locked ? '🔒 Unlock' : '🔓 Lock'}

                        </button>

                        ${hero.locked

                            ? `<button class="btn" disabled style="padding: 4px 8px; font-size: 11px; opacity: 0.4; cursor: not-allowed;" title="Unlock hero before dismissing">Dismiss (Locked)</button>`

                            : `<button class="btn" style="padding: 4px 8px; font-size: 11px; background: #dc2626; color: white;" onclick="dismissHero('${hero.id}')">Dismiss</button>`

                        }

                    </div>

                </div>

            `;

        });

    }



    html += `</div>`; // End hero-roster-grid reserves-roster-grid



container.innerHTML = html;







}















// Global window attachments







window.syncMainHero = syncMainHero;







window.rollScoutRank = rollScoutRank;







window.generateRecruit = generateRecruit;







window.recruitHero = recruitHero;







window.dismissHero = dismissHero;







window.expandBarracksCapacity = expandBarracksCapacity;







window.getNextBarracksExpansion = getNextBarracksExpansion;







window.levelUpHero = levelUpHero;







window.setHeroRow = setHeroRow;







window.toggleHeroRow = toggleHeroRow;







window.assignHeroToParty = assignHeroToParty;







window.removeHeroFromParty = removeHeroFromParty;







window.randomChoice = randomChoice;







window.selectPartyTarget = selectPartyTarget;







window.isAreaBossDefeated = isAreaBossDefeated;







window.getNextPartySlotTier = getNextPartySlotTier;







window.canUnlockPartySlots = canUnlockPartySlots;







window.unlockPartySlots = unlockPartySlots;







window.computeHeroStats = computeHeroStats;







window.calculateHeroGearScore = calculateHeroGearScore;







window.formatItemStats = formatItemStats;







window.equipHeroItem = equipHeroItem;







window.unequipHeroItem = unequipHeroItem;







window.autoEquipHeroBestGear = autoEquipHeroBestGear;







window.openHeroInspector = openHeroInspector;







window.closeHeroInspector = closeHeroInspector;







window.openMercenaryModal = openMercenaryModal;







window.closeMercenaryModal = closeMercenaryModal;







window.renderBarracksUI = renderBarracksUI;







window.getHeroSpriteSvg = getHeroSpriteSvg;







window.getLivingPartyHeroes = getLivingPartyHeroes;







window.getHeroCombatEntity = getHeroCombatEntity;







window.bindCommandDeckToHero = bindCommandDeckToHero;







window.getHeroComputedStats = computeHeroStats;







window.heroHasPassive = heroHasPassive;







window.advanceHeroClass = advanceHeroClass;







window.respecHeroClass = respecHeroClass;







window.selectSanctumHero = selectSanctumHero;







window.openClassSanctumForHero = openClassSanctumForHero;



// =========================================================================

// Party System QoL & Visual Distinction Systems

// =========================================================================



window.barracksFilter = window.barracksFilter || {

    status: 'all',    // 'all' | 'active' | 'reserve' | 'ready'

    classId: 'all',

    rank: 'all',

    row: 'all'

};



window.barracksSort = window.barracksSort || {

    field: 'rank', // 'rank' | 'level' | 'gearScore' | 'speed' | 'name'

    direction: 'desc' // 'asc' | 'desc'

};



function setBarracksFilter(key, value) {

    if (!window.barracksFilter) window.barracksFilter = { status: 'all', classId: 'all', rank: 'all', row: 'all' };

    window.barracksFilter[key] = value;

    if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');

    if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');

}



function resetBarracksFilters() {

    window.barracksFilter = { status: 'all', classId: 'all', rank: 'all', row: 'all' };

    window.barracksSort = { field: 'rank', direction: 'desc' };

    if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');

    if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');

}



function setBarracksSortField(field) {

    if (!window.barracksSort) window.barracksSort = { field: 'rank', direction: 'desc' };

    window.barracksSort.field = field;

    if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');

    if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');

}



function toggleBarracksSortDirection() {

    if (!window.barracksSort) window.barracksSort = { field: 'rank', direction: 'desc' };

    window.barracksSort.direction = (window.barracksSort.direction === 'desc') ? 'asc' : 'desc';

    if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');

    if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');

}



function scrollToReserves() {

    const el = document.getElementById('barracks-reserves-section') || document.querySelector('.reserves-roster-grid');

    if (el) el.scrollIntoView({ behavior: 'smooth' });

}



function optimizeSquadGear() {

    if (!player || !player.activeParty || !player.roster) return 0;

    let totalSwapped = 0;

    player.activeParty.forEach(heroId => {

        totalSwapped += (typeof autoEquipHeroBestGear === 'function') ? autoEquipHeroBestGear(heroId) : 0;

    });

    showToast('Squad Optimized', `Equipped optimal loadouts across all active squad heroes (${totalSwapped} items updated).`, 'success');

    if (typeof playSFX === 'function') playSFX('upgrade');

    if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');

    if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');

    return totalSwapped;

}



function toggleHeroLock(heroId) {

    if (!player || !player.roster) return false;

    const hero = player.roster.find(h => h.id === heroId);

    if (!hero) return false;

    hero.locked = !hero.locked;

    showToast(

        hero.locked ? 'Hero Locked' : 'Hero Unlocked',

        `${hero.name} has been ${hero.locked ? 'locked against accidental dismissal' : 'unlocked'}.`,

        'info'

    );

    if (typeof renderBarracksUI === 'function') {

        if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');

        if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');

    }

    if (inspectedHeroId === hero.id && typeof openHeroInspector === 'function') {

        openHeroInspector(hero.id);

    }

    if (typeof saveGame === 'function') saveGame(false);

    return hero.locked;

}



let renamingHeroId = null;



function openRenameHeroModal(heroId) {

    if (!player || !player.roster) return;

    const hero = player.roster.find(h => h.id === heroId);

    if (!hero) return;

    renamingHeroId = heroId;

    const modal = document.getElementById('modal-rename-hero');

    const input = document.getElementById('rename-hero-input');

    if (input) {

        input.value = hero.name || '';

    }

    if (modal) {

        modal.classList.add('active');

        setTimeout(() => { if (input) { input.focus(); input.select(); } }, 50);

    }

}



function closeRenameHeroModal() {

    renamingHeroId = null;

    const modal = document.getElementById('modal-rename-hero');

    if (modal) modal.classList.remove('active');

}



function submitRenameHero() {

    if (!player || !player.roster || !renamingHeroId) return false;

    const hero = player.roster.find(h => h.id === renamingHeroId);

    if (!hero) {

        closeRenameHeroModal();

        return false;

    }

    const input = document.getElementById('rename-hero-input');

    let rawName = input ? input.value : '';

    let cleanName = rawName.replace(/<[^>]*>/g, '').replace(/[<>&"']/g, '').trim();



    if (cleanName.length < 2) {

        showToast('Invalid Name', 'Hero name must be at least 2 characters long.', 'warning');

        return false;

    }

    if (cleanName.length > 20) {

        showToast('Invalid Name', 'Hero name must not exceed 20 characters.', 'warning');

        return false;

    }



    const oldName = hero.name;

    hero.name = cleanName;

    if (hero.isMain) {

        player.name = cleanName;

        if (typeof updateHeader === 'function') updateHeader();

    }



    showToast('Hero Renamed', `${oldName} is now known as ${cleanName}!`, 'info');

    closeRenameHeroModal();



    if (typeof renderBarracksUI === 'function') {

        if (document.getElementById('mercenary-modal-content')) renderBarracksUI('mercenary-modal-content');

        if (document.getElementById('tavern-content') && tavernActiveTab === 'recruitment') renderBarracksUI('tavern-content');

    }

    if (inspectedHeroId === hero.id && typeof openHeroInspector === 'function') {

        openHeroInspector(hero.id);

    }

    if (typeof saveGame === 'function') saveGame(false);

    return true;

}



function passesHeroFilter(hero, filter) {

    if (!filter) return true;

    const isInParty = player.activeParty && player.activeParty.includes(hero.id);

    const hClsId = hero.isMain ? (player.currentClass || hero.classId || 'warrior') : (hero.classId || 'warrior');

    const hCls = (typeof CLASSES_DB !== 'undefined' && CLASSES_DB[hClsId]) || {};

    const hTier = hCls.tier || 1;

    const hLvl = hero.isMain ? (player.level || 1) : (hero.level || 1);

    const isReady = (hTier === 1 && hLvl >= 25) || (hTier === 2 && hLvl >= 50);



    // 1. Status Filter

    if (filter.status === 'active' && !isInParty) return false;

    if (filter.status === 'reserve' && isInParty) return false;

    if (filter.status === 'ready' && !isReady) return false;



    // 2. Class Filter

    if (filter.classId && filter.classId !== 'all') {

        const clsDef = typeof CLASSES_DB !== 'undefined' ? CLASSES_DB[hClsId] : null;

        const matchesExact = hClsId === filter.classId;

        const matchesParent = clsDef && (clsDef.parent === filter.classId || (clsDef.parent && CLASSES_DB[clsDef.parent]?.parent === filter.classId));

        if (!matchesExact && !matchesParent) return false;

    }



    // 3. Rank Filter

    if (filter.rank && filter.rank !== 'all') {

        if (hero.rank !== filter.rank) return false;

    }



    // 4. Position (Row) Filter

    if (filter.row && filter.row !== 'all') {

        if (hero.row !== filter.row) return false;

    }



    return true;

}



function sortHeroesList(heroesList, sort) {

    if (!sort) return heroesList;

    const rankWeights = { 'S': 7, 'A': 6, 'B': 5, 'C': 4, 'D': 3, 'E': 2, 'F': 1 };

    const isAsc = sort.direction === 'asc';



    return [...heroesList].sort((a, b) => {

        let diff = 0;

        switch (sort.field) {

            case 'rank': {

                let rA = rankWeights[a.rank] || 0;

                let rB = rankWeights[b.rank] || 0;

                diff = isAsc ? (rA - rB) : (rB - rA);

                break;

            }

            case 'level': {

                let lA = (a.isMain ? player.level : a.level) || 1;

                let lB = (b.isMain ? player.level : b.level) || 1;

                diff = isAsc ? (lA - lB) : (lB - lA);

                break;

            }

            case 'gearScore': {

                let gsA = (typeof calculateHeroGearScore === 'function') ? calculateHeroGearScore(a) : 0;

                let gsB = (typeof calculateHeroGearScore === 'function') ? calculateHeroGearScore(b) : 0;

                diff = isAsc ? (gsA - gsB) : (gsB - gsA);

                break;

            }

            case 'speed': {

                let spdA = ((typeof computeHeroStats === 'function') ? computeHeroStats(a) : a.baseStats)?.spd || 10;

                let spdB = ((typeof computeHeroStats === 'function') ? computeHeroStats(b) : b.baseStats)?.spd || 10;

                diff = isAsc ? (spdA - spdB) : (spdB - spdA);

                break;

            }

            case 'name': {

                diff = a.name.localeCompare(b.name);

                if (!isAsc) diff = -diff;

                break;

            }

            default:

                diff = 0;

        }

        if (diff === 0) {

            return a.name.localeCompare(b.name);

        }

        return diff;

    });

}



// Window attachments

window.setBarracksFilter = setBarracksFilter;

window.resetBarracksFilters = resetBarracksFilters;

window.setBarracksSortField = setBarracksSortField;

window.toggleBarracksSortDirection = toggleBarracksSortDirection;

window.scrollToReserves = scrollToReserves;

window.optimizeSquadGear = optimizeSquadGear;

window.toggleHeroLock = toggleHeroLock;

window.openRenameHeroModal = openRenameHeroModal;

window.closeRenameHeroModal = closeRenameHeroModal;

window.submitRenameHero = submitRenameHero;

window.passesHeroFilter = passesHeroFilter;

window.sortHeroesList = sortHeroesList;



/* =========================================================================
   ENDGAME RAIDS: THE ABYSSAL CALAMITIES & MYTHIC SET EQUIPMENT SYSTEM
   ========================================================================= */

function getHeroActiveSetCount(hero, setId) {
    if (!hero) return 0;
    const eq = hero.equipment || (hero === player ? player.equipment : null);
    if (!eq) return 0;

    let count = 0;
    const slots = ['weapon', 'offhand', 'armor', 'helmet', 'gloves', 'boots', 'accessory'];
    const setDef = (typeof MYTHIC_SETS_DB !== 'undefined') ? MYTHIC_SETS_DB[setId] : null;

    slots.forEach(slot => {
        const item = eq[slot];
        if (!item) return;

        if (item.setId === setId) {
            count++;
            return;
        }
        const bName = item.baseName || item.name || item.id;
        if (bName && typeof ITEMS_DB !== 'undefined' && ITEMS_DB[bName] && ITEMS_DB[bName].setId === setId) {
            count++;
            return;
        }
        if (setDef && setDef.pieces) {
            if (setDef.pieces.includes(item.id) || setDef.pieces.includes(item.name) || setDef.pieces.includes(item.baseName)) {
                count++;
                return;
            }
        }
    });

    return count;
}
window.getHeroActiveSetCount = getHeroActiveSetCount;

function hasHeroSetBonus(hero, setId, pieceThreshold) {
    return getHeroActiveSetCount(hero, setId) >= pieceThreshold;
}
window.hasHeroSetBonus = hasHeroSetBonus;

function isCalamityUnlocked() {
    if (!player) return false;
    if (player.calamityUnlocked) return true;
    if (player.defeatedArea10Boss) return true;
    if (player.unlockedAreas && player.unlockedAreas.includes('area_10')) return true;
    if (player.areasUnlocked && player.areasUnlocked.includes('area_10')) return true;
    if (player.calamityVictories && Object.keys(player.calamityVictories).length > 0) return true;
    // Having keys in possession unlocks the rift gate (unless explicitly set to false in a unit test)
    if (player.calamityUnlocked !== false && (player.calamityKeys || 0) > 0) return true;
    return false;
}
window.isCalamityUnlocked = isCalamityUnlocked;

function updateTownUI() {
    const calamityBtn = document.getElementById('btn-town-calamity');
    if (calamityBtn) {
        if (isCalamityUnlocked()) {
            calamityBtn.style.display = 'flex';
        } else {
            calamityBtn.style.display = 'none';
        }
    }
}
window.updateTownUI = updateTownUI;

function openCalamityPortal() {
    if (!isCalamityUnlocked()) {
        if (typeof showToast === 'function') {
            showToast('Rift Locked', 'Conquer Area 10 (The Celestial Void Rift) or obtain a Calamity Keystone to access the Calamities!', 'warning');
        }
        return;
    }
    renderCalamityPortalUI();
    if (typeof openModal === 'function') {
        openModal('modal-calamity-raid');
    } else {
        const modal = document.getElementById('modal-calamity-raid');
        const overlay = document.getElementById('main-overlay');
        if (modal) modal.classList.add('active');
        if (overlay) overlay.classList.add('active');
    }
}
window.openCalamityPortal = openCalamityPortal;

function renderCalamityPortalUI() {
    const container = document.getElementById('calamity-raid-content');
    if (!container) return;

    if (typeof player.calamityKeys === 'undefined') player.calamityKeys = 3;

    let html = `
        <div class="calamity-header-panel">
            <h2 style="margin: 0 0 6px 0; color: #f43f5e; font-size: 20px;">🌋 The Abyssal Calamities</h2>
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8;">
                Endgame 5-man raid encounters. Stagger bosses during ultimate channels, coordinate elemental weaknesses, and forge Mythic Set gear. Zero-loss retry safety guaranteed!
            </p>
            <div class="calamity-key-counter">
                🗝️ Calamity Keystones: <b style="color: #ffd700; font-size: 16px;">${player.calamityKeys}</b>
                <span style="font-size: 11px; color: #94a3b8; margin-left: 8px;">(Weekly allowance: 3 | Buy more at Tavern Quartermaster)</span>
            </div>
        </div>

        <div class="calamity-raid-grid">
    `;

    if (typeof RAIDS_DB !== 'undefined') {
        for (let rId in RAIDS_DB) {
            const raid = RAIDS_DB[rId];
            const victories = (player.calamityVictories && player.calamityVictories[rId]) || 0;
            const canEngage = (player.calamityKeys || 0) >= 1;

            html += `
                <div class="calamity-boss-card" style="border-top: 3px solid ${raid.themeColor};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div>
                            <div style="font-size: 16px; font-weight: bold; color: #f8fafc;">${raid.name}</div>
                            <div style="font-size: 12px; color: ${raid.themeColor};">Level ${raid.level} • ${raid.element} Realm Calamity</div>
                        </div>
                        <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.06); color: #cbd5e1;">
                            Cleared: <b>${victories}x</b>
                        </span>
                    </div>

                    <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 10px; line-height: 1.4;">
                        ${raid.desc}
                    </div>

                    <div style="background: rgba(0,0,0,0.3); border-radius: 6px; padding: 8px; font-size: 11px; margin-bottom: 12px;">
                        <div style="color: #38bdf8; margin-bottom: 4px;">🎯 <b>Vulnerability:</b> Weak to <b style="color: #fde047;">${raid.weakness}</b> (1.5x Stagger & Damage)</div>
                        <div style="color: #fb923c; margin-bottom: 4px;">⚡ <b>Mechanics:</b> Phase 2 Adds/Marks • Phase 3 Soft Enrage + Stagger Channel</div>
                        <div style="color: #a855f7;">🎁 <b>Drops:</b> 1–3x ${raid.essenceName} (Enables ${(raid.mythicSets && Array.isArray(raid.mythicSets)) ? raid.mythicSets.join(', ') : 'Mythic Sets'})</div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                        <span style="font-size: 12px; color: #94a3b8;">Cost: <b>1 Keystone</b> (on victory)</span>
                        <button class="btn btn-engage-raid" style="background: ${canEngage ? '#e11d48' : '#475569'}; border-color: ${canEngage ? '#f43f5e' : '#64748b'}; color: white; padding: 8px 18px; font-weight: bold; cursor: ${canEngage ? 'pointer' : 'not-allowed'};" 
                            onclick="startRaidBattle('${rId}')" ${canEngage ? '' : 'disabled'}>
                            ⚔️ Engage Calamity
                        </button>
                    </div>
                </div>
            `;
        }
    }

    html += `</div>`;
    container.innerHTML = html;
}
window.renderCalamityPortalUI = renderCalamityPortalUI;

function startRaidBattle(raidId) {
    if (!player) return;
    if ((player.calamityKeys || 0) < 1) {
        if (typeof showToast === 'function') {
            showToast('Insufficient Keystones', 'You need at least 1 Calamity Keystone to challenge a Calamity!', 'error');
        }
        return;
    }

    const raid = (typeof RAIDS_DB !== 'undefined' && RAIDS_DB[raidId]) || null;
    if (!raid) return;

    if (typeof clearAllCombatTimers === 'function') clearAllCombatTimers();
    if (typeof closeAllModals === 'function') closeAllModals();
    if (typeof closeEnemyInspector === 'function') closeEnemyInspector();

    const ribbonTrack = document.getElementById('turn-order-track');
    if (ribbonTrack) ribbonTrack.innerHTML = '';

    switchScreen('battle');

    battleState = {
        active: true,
        isPlayerTurn: false,
        initialEnemyCount: 1,
        isBossFight: true,
        isRaid: true,
        raidId: raidId,
        raid: raid,
        raidPhase: 1,
        channelingUltimate: null,
        lastBattleConfig: {
            enemyCount: 1,
            isBoss: true,
            isRaid: true,
            raidId: raidId,
            areaId: 'area_10'
        },
        enemies: [],
        turnQueue: [],
        targetingMode: null,
        log: [],
        playerStatuses: {},
        playerEntity: null,
        petTurns: { slot0: 0, slot1: 0, 0: 0, 1: 0 },
        phoenixRebirthUsed: false
    };

    const cmdEl = document.getElementById('battle-commands');
    if (cmdEl) cmdEl.classList.remove('victory-mode-ui');
    const vActions = document.getElementById('battle-victory-actions');
    if (vActions) vActions.style.display = 'none';
    if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();

    player.statuses = battleState.playerStatuses;
    if (player.roster && Array.isArray(player.roster)) {
        player.roster.forEach(h => {
            h.statuses = {};
            if (h._combatEntity) h._combatEntity.statuses = h.statuses;
            h.livingBastionBarrierUsed = false;
        });
    }

    if (typeof setupBattle === 'function') setupBattle('calamity');
    const arenaEl = document.getElementById('battle-arena');
    if (arenaEl && raid.bgGradient) {
        arenaEl.style.background = raid.bgGradient;
    }

    battleState.enemies.push({
        index: 0,
        id: 'enemy_0',
        name: raid.name,
        level: raid.level,
        element: raid.element,
        hp: raid.hp,
        maxHp: raid.hp,
        atk: raid.atk,
        def: raid.def,
        matk: raid.matk,
        mdef: raid.mdef,
        spd: raid.spd,
        exp: raid.exp,
        gold: raid.gold,
        ai: raid.ai || 'boss',
        isBoss: true,
        isRaidBoss: true,
        raidId: raidId,
        phase: 1,
        statuses: {},
        weakness: raid.weakness,
        loot: raid.loot || []
    });

    logMsg(`🌋 CALAMITY UNLEASHED: ${raid.name} (Level ${raid.level}) emerges from the void rift!`, "#f43f5e");
    if (raidId === 'raid_chronos') {
        logMsg("⏳ Temporal Anomaly in effect! Speeds are inverted: slower combatants act first!", "#c084fc");
    }

    renderBattlefield();
    startRound();
}
window.startRaidBattle = startRaidBattle;

function startBossChannel(enemy, skillName, maxGauge, turns) {
    if (!battleState) return;
    battleState.channelingUltimate = {
        skillName: skillName,
        maxGauge: maxGauge,
        currentGauge: maxGauge,
        requiredDamage: maxGauge,
        shieldAmount: maxGauge,
        currentDamage: 0,
        turnsRemaining: turns
    };
    logMsg(`⚠️ DANGER! ${enemy.name} is channeling ${skillName}! (${maxGauge} Stagger Gauge, ${turns} Turns)`, "#f43f5e");
    if (typeof screenShake === 'function') screenShake('heavy', 500);
    renderBattlefield();
}
window.startBossChannel = startBossChannel;

function triggerRaidPhaseTransition(enemy, newPhase) {
    if (!battleState || !enemy) return;
    enemy.phase = newPhase;
    battleState.raidPhase = newPhase;

    logMsg(`🔥 PHASE ${newPhase}! ${enemy.name} unleashes new catastrophic powers!`, "#f43f5e");
    if (typeof screenShake === 'function') screenShake('heavy', 600);

    if (newPhase === 2) {
        if (enemy.raidId === 'raid_ignis' || enemy.name.includes('Ignis')) {
            const totem1 = {
                index: battleState.enemies.length,
                id: 'enemy_' + battleState.enemies.length,
                name: 'Magma Totem',
                level: 50,
                element: 'Fire',
                hp: 2500,
                maxHp: 2500,
                atk: 0,
                def: 100,
                matk: 0,
                mdef: 100,
                spd: 10,
                exp: 0,
                gold: 0,
                ai: 'totem',
                statuses: {}
            };
            const totem2 = {
                index: battleState.enemies.length + 1,
                id: 'enemy_' + (battleState.enemies.length + 1),
                name: 'Magma Totem',
                level: 50,
                element: 'Fire',
                hp: 2500,
                maxHp: 2500,
                atk: 0,
                def: 100,
                matk: 0,
                mdef: 100,
                spd: 10,
                exp: 0,
                gold: 0,
                ai: 'totem',
                statuses: {}
            };
            battleState.enemies.push(totem1, totem2);
            logMsg("🔥 Ignis summons 2 Magma Totems! Ignis gains 90% damage mitigation while totems stand!", "#f97316");
        } else if (enemy.raidId === 'raid_leviathan' || enemy.name.includes('Leviathan')) {
            const siren1 = {
                index: battleState.enemies.length,
                id: 'enemy_' + battleState.enemies.length,
                name: 'Abyssal Siren',
                level: 52,
                element: 'Water',
                hp: 3000,
                maxHp: 3000,
                atk: 180,
                def: 80,
                matk: 220,
                mdef: 90,
                spd: 40,
                exp: 0,
                gold: 0,
                ai: 'balanced',
                statuses: {}
            };
            const siren2 = {
                index: battleState.enemies.length + 1,
                id: 'enemy_' + (battleState.enemies.length + 1),
                name: 'Abyssal Siren',
                level: 52,
                element: 'Water',
                hp: 3000,
                maxHp: 3000,
                atk: 180,
                def: 80,
                matk: 220,
                mdef: 90,
                spd: 40,
                exp: 0,
                gold: 0,
                ai: 'balanced',
                statuses: {}
            };
            battleState.enemies.push(siren1, siren2);
            logMsg("🌊 Leviathan summons 2 Abyssal Sirens! Their haunting song silences 2 party members!", "#0ea5e9");
            let living = (typeof getLivingPartyHeroes === 'function') ? getLivingPartyHeroes() : [];
            let shuffled = [...living].sort(() => Math.random() - 0.5);
            shuffled.slice(0, 2).forEach(h => {
                applyStatus(getHeroCombatEntity(h), 'silence', 2);
            });
        } else if (enemy.raidId === 'raid_chronos' || enemy.name.includes('Chronos')) {
            let living = (typeof getLivingPartyHeroes === 'function') ? getLivingPartyHeroes() : [];
            let shuffled = [...living].sort(() => Math.random() - 0.5);
            shuffled.slice(0, 2).forEach(h => {
                applyStatus(getHeroCombatEntity(h), 'doom_brand', 3);
            });
            logMsg("⏳ Chronos brands 2 party members with Doom Brand (detonates in 3 turns)! Deal with it fast!", "#a855f7");
        }
    } else if (newPhase === 3) {
        enemy.atk = Math.round(enemy.atk * 1.25);
        enemy.spd = Math.round(enemy.spd * 1.20);
        logMsg(`⚡ SOFT ENRAGE! ${enemy.name} gains +25% ATK and +20% SPD!`, "#f43f5e");

        if (enemy.raidId === 'raid_ignis' || enemy.name.includes('Ignis')) {
            startBossChannel(enemy, 'Supernova Cataclysm', 15000, 3);
        } else if (enemy.raidId === 'raid_leviathan' || enemy.name.includes('Leviathan')) {
            let living = (typeof getLivingPartyHeroes === 'function') ? getLivingPartyHeroes() : [];
            if (living.length > 0) {
                let victim = living[Math.floor(Math.random() * living.length)];
                applyStatus(getHeroCombatEntity(victim), 'glacial_prison', 3);
                logMsg(`🧊 Leviathan encases ${victim.name} in a Glacial Prison!`, "#38bdf8");
            }
        } else if (enemy.raidId === 'raid_chronos' || enemy.name.includes('Chronos')) {
            startBossChannel(enemy, 'Singularity Event', 30000, 2);
        }
    }

    renderBattlefield();
}
window.triggerRaidPhaseTransition = triggerRaidPhaseTransition;

function renderMythicForgeTabHtml() {
    if (!player) return '';
    if (!player.materials) player.materials = {};

    let html = `
        <div class="mythic-forge-container">
            <div style="background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <h3 style="margin: 0 0 6px 0; color: #f43f5e; font-size: 16px;">🌟 Mythic Set Forge (Deterministic Crafting)</h3>
                <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.4;">
                    Forge supreme Tier 6 Mythic Set Equipment with 6 guaranteed affixes and powerful 2-piece and 4-piece set synergies. Requires 5 Calamity Essences and 10,000 Gold per piece.
                </p>
            </div>

            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; font-size: 12px;">
                <div style="background: rgba(0,0,0,0.3); border: 1px solid #334155; padding: 6px 12px; border-radius: 6px;">
                    🔥 Ignis Heart: <b style="color: #f97316;">${player.materials.ignis_heart || 0}</b>
                </div>
                <div style="background: rgba(0,0,0,0.3); border: 1px solid #334155; padding: 6px 12px; border-radius: 6px;">
                    🌊 Abyssal Pearl: <b style="color: #0ea5e9;">${player.materials.abyssal_pearl || 0}</b>
                </div>
                <div style="background: rgba(0,0,0,0.3); border: 1px solid #334155; padding: 6px 12px; border-radius: 6px;">
                    🌌 Chronos Riftcore: <b style="color: #c084fc;">${player.materials.chronos_riftcore || 0}</b>
                </div>
                <div style="background: rgba(0,0,0,0.3); border: 1px solid #334155; padding: 6px 12px; border-radius: 6px;">
                    💰 Gold: <b style="color: #ffd700;">${player.gold || 0}</b> / 10,000
                </div>
            </div>
    `;

    if (typeof MYTHIC_SETS_DB !== 'undefined') {
        const essenceReqMap = {
            'titans_bulwark': { key: 'ignis_heart', name: 'Ignis Heart', color: '#f97316' },
            'archons_voidweave': { key: 'abyssal_pearl', name: 'Abyssal Pearl', color: '#0ea5e9' },
            'shadowstalker_regalia': { key: 'chronos_riftcore', name: 'Chronos Riftcore', color: '#c084fc' },
            'hallowed_seraphim': { key: 'chronos_riftcore', name: 'Chronos Riftcore', color: '#c084fc' }
        };

        for (let sId in MYTHIC_SETS_DB) {
            const setDef = MYTHIC_SETS_DB[sId];
            const req = essenceReqMap[sId] || { key: 'ignis_heart', name: 'Essence', color: '#f43f5e' };
            const curEss = player.materials[req.key] || 0;

            html += `
                <div class="mythic-set-card" style="background: rgba(15,23,42,0.6); border: 1px solid rgba(244,63,94,0.3); border-radius: 8px; padding: 14px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 15px; font-weight: bold; color: #f43f5e;">🌟 ${setDef.name}</span>
                        <span style="font-size: 11px; color: ${req.color};">Requires 5x ${req.name} + 10,000 Gold</span>
                    </div>

                    <div style="background: rgba(0,0,0,0.25); border-radius: 6px; padding: 8px; font-size: 11px; margin-bottom: 12px;">
                        <div style="color: #cbd5e1; margin-bottom: 3px;"><b>2-Piece Bonus:</b> <span style="color: #4ade80;">${(setDef.bonuses && setDef.bonuses[2] ? setDef.bonuses[2].desc : (setDef.twoPieceBonus ? setDef.twoPieceBonus.desc : ''))}</span></div>
                        <div style="color: #cbd5e1;"><b>4-Piece Bonus:</b> <span style="color: #4ade80;">${(setDef.bonuses && setDef.bonuses[4] ? setDef.bonuses[4].desc : (setDef.fourPieceBonus ? setDef.fourPieceBonus.desc : ''))}</span></div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
            `;

            setDef.pieces.forEach(pKey => {
                const pieceDef = (typeof ITEMS_DB !== 'undefined' && ITEMS_DB[pKey]) || null;
                if (!pieceDef) return;

                const canForge = curEss >= 5 && (player.gold || 0) >= 10000;

                let statsStr = [];
                if (pieceDef.atk) statsStr.push(`+${pieceDef.atk} ATK`);
                if (pieceDef.def) statsStr.push(`+${pieceDef.def} DEF`);
                if (pieceDef.matk) statsStr.push(`+${pieceDef.matk} MATK`);
                if (pieceDef.mdef) statsStr.push(`+${pieceDef.mdef} MDEF`);
                if (pieceDef.maxHp) statsStr.push(`+${pieceDef.maxHp} HP`);
                if (pieceDef.maxMp) statsStr.push(`+${pieceDef.maxMp} MP`);
                if (pieceDef.spd) statsStr.push(`+${pieceDef.spd} SPD`);
                if (pieceDef.crit) statsStr.push(`+${pieceDef.crit}% Crit`);

                html += `
                    <div style="background: rgba(0,0,0,0.4); border: 1px solid #334155; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div style="font-size: 13px; font-weight: bold; color: #f43f5e;">${pieceDef.name}</div>
                            <div style="font-size: 11px; color: #94a3b8; text-transform: capitalize; margin-bottom: 4px;">Slot: ${pieceDef.type} (Mythic)</div>
                            <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 8px;">${statsStr.join(', ')}</div>
                        </div>
                        <button class="btn btn-forge-mythic" style="background: ${canForge ? '#e11d48' : '#334155'}; border-color: ${canForge ? '#f43f5e' : '#475569'}; color: white; padding: 5px 10px; font-size: 11px; font-weight: bold; cursor: ${canForge ? 'pointer' : 'not-allowed'};"
                            onclick="forgeMythicPiece('${pKey}')" ${canForge ? '' : 'disabled'}>
                            🔨 Forge Item (5x ${req.name})
                        </button>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }
    }

    html += `</div>`;
    return html;
}
window.renderMythicForgeTabHtml = renderMythicForgeTabHtml;

function forgeMythicPiece(pieceKey) {
    if (!player) return;
    if (!player.materials) player.materials = {};

    let pieceDef = (typeof ITEMS_DB !== 'undefined' && ITEMS_DB[pieceKey]) || null;
    if (!pieceDef && typeof ITEMS_DB !== 'undefined') {
        let clean = pieceKey.toLowerCase().replace(/['\s]/g, '_');
        pieceDef = ITEMS_DB[clean] || ITEMS_DB[clean.replace(/s_/, '_')];
        if (!pieceDef) {
            for (let k in ITEMS_DB) {
                if (k.toLowerCase().replace(/['\s]/g, '_') === clean || k.toLowerCase().replace(/['\s]/g, '') === clean.replace(/_/g, '')) {
                    pieceDef = ITEMS_DB[k];
                    break;
                }
            }
        }
    }
    if (!pieceDef) {
        if (typeof showToast === 'function') showToast('Unknown Item', 'Could not locate item blueprint.', 'error');
        return;
    }

    const setId = pieceDef.setId;
    const essenceReqMap = {
        'titans_bulwark': { key: 'ignis_heart', name: 'Ignis Heart' },
        'archons_voidweave': { key: 'abyssal_pearl', name: 'Abyssal Pearl' },
        'shadowstalker_regalia': { key: 'chronos_riftcore', name: 'Chronos Riftcore' },
        'hallowed_seraphim': { key: 'chronos_riftcore', name: 'Chronos Riftcore' }
    };
    const req = essenceReqMap[setId] || { key: 'ignis_heart', name: 'Essence' };
    const curEss = player.materials[req.key] || 0;

    if (curEss < 5) {
        if (typeof showToast === 'function') {
            showToast('Insufficient Essences', `You need 5x ${req.name} to forge this Mythic piece!`, 'error');
        }
        return;
    }
    if ((player.gold || 0) < 10000) {
        if (typeof showToast === 'function') {
            showToast('Insufficient Gold', 'You need 10,000 Gold to forge a Mythic item!', 'error');
        }
        return;
    }

    player.materials[req.key] -= 5;
    player.gold -= 10000;

    const crafted = generateItem(pieceDef.name, 'Mythic');
    crafted.setId = pieceDef.setId;
    crafted.setName = pieceDef.setName;
    crafted.isMythic = true;
    crafted.type = pieceDef.type;

    if (!player.inventory) player.inventory = createInventory();
    if (!player.inventory.equipment) player.inventory.equipment = [];
    player.inventory.equipment.push(crafted);

    if (typeof playSFX === 'function') playSFX('upgrade_success');
    if (typeof showToast === 'function') {
        showToast('Mythic Forged!', `Successfully forged ${crafted.name}!`, 'achievement', 5000);
    }

    if (typeof updateHeader === 'function') updateHeader();
    if (typeof renderBlacksmith === 'function') renderBlacksmith();
    if (typeof saveGame === 'function') saveGame();
}
window.forgeMythicPiece = forgeMythicPiece;
window.fleeBattle = attemptFlee;
