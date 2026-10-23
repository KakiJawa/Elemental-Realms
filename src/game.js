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
                }
            });
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
                    if (hasStatus(this, 'battle_cry')) mult *= 1.2;
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
            selectedArea: 'area_1',
            materials: { scrap: 0, dust: 0, shard: 0 },
            quests: {},
            questStats: { enemiesDefeated: 0, battlesWon: 0, bossesDefeated: 0 },
            achievements: {},
            pets: {
                unlocked: ['sprout_slimelet'],
                active: [null, null],
                levels: {
                    sprout_slimelet: { level: 1, exp: 0 }
                }
            }
        };
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
            // Retroactive Signature Class Skills Check
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
                    if (statKey === 'spd' && pet.passive.spd) result.pets += Math.round(pet.passive.spd * scale);
                    if (statKey === 'crit' && pet.passive.crit) result.pets += Math.round(pet.passive.crit * scale);
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

                    let statusText = isMaxed ? 'MAXED' : (isLocked ? `🔒 Req ${node.reqBranchPts} Pts` : (otherKeystoneActive ? 'Locked (1 Keystone Max)' : `Cost: ${node.cost} Orb${node.cost > 1 ? 's' : ''}`));
                    let statusColor = isMaxed ? '#55ff55' : (isLocked ? '#94a3b8' : (otherKeystoneActive ? '#94a3b8' : (canAfford ? '#ffd700' : '#ff5555')));
                    let canBuy = !isMaxed && !isLocked && !otherKeystoneActive && canAfford;

                    branchCardsHtml += `
                        <div class="${cardClasses}">
                            ${node.type === 'keystone' ? '<div class="keystone-badge">KEYSTONE</div>' : ''}
                            <div class="skill-node-header">
                                <span>${node.name}</span>
                                <span>${currentRank}/${node.max}</span>
                            </div>
                            <div class="skill-node-desc">${node.desc}</div>
                            ${isLocked ? `<div class="node-locked-hint">🔒 Requires ${node.reqBranchPts} points in ${node.branch}</div>` : ''}
                            <div class="skill-node-actions">
                                <span style="font-size: 11px; color: ${statusColor}; font-weight: bold;">${statusText}</span>
                                <button class="btn" style="padding: 2px 8px; font-size: 11px;" 
                                    ${!canBuy ? 'disabled' : ''} 
                                    onclick="buySkillUpgrade('${node.key}')">Upgrade</button>
                            </div>
                        </div>
                    `;
                });
            });

            fullHtml += `
                <div class="skill-branch st-branch">
                    <div class="branch-header st-branch-header">
                        <div class="branch-title st-branch-title">${bIcon} ${bName}</div>
                        <div class="branch-points-badge">${bPts} Pts Invested</div>
                    </div>
                    ${branchCardsHtml}
                </div>
            `;
        });

        const contentEl = document.getElementById('st-content');
        if (contentEl) {
            let branchTabsHtml = `
                <div id="st-branch-pills" style="display: flex; gap: 4px; margin-bottom: 12px; overflow-x: auto; padding-bottom: 4px;">
                    <button class="btn st-pill-btn active" style="flex:1; padding: 4px 6px; font-size: 11px; margin: 0;" onclick="filterSkillTreeBranch('all')">All</button>
                    <button class="btn st-pill-btn" style="flex:1; padding: 4px 6px; font-size: 11px; margin: 0;" onclick="filterSkillTreeBranch('Damage')">⚔️ Damage</button>
                    <button class="btn st-pill-btn" style="flex:1; padding: 4px 6px; font-size: 11px; margin: 0;" onclick="filterSkillTreeBranch('Sustain')">🛡️ Sustain</button>
                    <button class="btn st-pill-btn" style="flex:1; padding: 4px 6px; font-size: 11px; margin: 0;" onclick="filterSkillTreeBranch('Arcana')">🔮 Arcana</button>
                    <button class="btn st-pill-btn" style="flex:1; padding: 4px 6px; font-size: 11px; margin: 0;" onclick="filterSkillTreeBranch('General')">⚡ General</button>
                </div>
            `;
            let pillsEl = document.getElementById('st-branch-pills');
            if (!pillsEl) {
                contentEl.insertAdjacentHTML('beforebegin', branchTabsHtml);
            }
            contentEl.innerHTML = fullHtml;
        }
    }

    function filterSkillTreeBranch(branchName) {
        const branches = document.querySelectorAll('#st-content .st-branch, #st-content .skill-branch');
        const pills = document.querySelectorAll('#st-branch-pills .st-pill-btn');
        pills.forEach(p => {
            p.classList.toggle('active', (branchName === 'all' && p.innerText === 'All') || p.innerText.includes(branchName));
        });
        branches.forEach(b => {
            if (branchName === 'all') {
                b.style.display = 'flex';
            } else {
                const titleEl = b.querySelector('.st-branch-title, .branch-title');
                b.style.display = (titleEl && titleEl.innerText.includes(branchName)) ? 'flex' : 'none';
            }
        });
    }
    if (typeof window !== 'undefined') {
        window.filterSkillTreeBranch = filterSkillTreeBranch;
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
        renderSkillTree();
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
                    let isUnlocked = (player.unlockedAreas && player.unlockedAreas.includes(tierKey)) || ((player.level || 1) >= reqMinLevel);

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
                        html += `
                        <div style="margin-bottom:12px; background:rgba(15,23,42,0.3); border:1px dashed #64748b; border-radius:8px; padding:10px 14px; opacity:0.65;">
                            <div style="font-size:13px; font-weight:bold; color:#94a3b8;">
                                🔒 Locked (Requires conquering ${areaTitle})
                            </div>
                            <div style="font-size:11px; color:#64748b; margin-top:2px;">
                                Defeat the gatekeeper boss of ${areaTitle} or reach Level ${reqMinLevel} to unlock this regional armory stock.
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
            ['area_3', 'area_4', 'area_5'].forEach(a => {
                if (typeof SHOP_EQUIPMENT_TIERS !== 'undefined' && SHOP_EQUIPMENT_TIERS[a]) {
                    eligibleItems.push(...SHOP_EQUIPMENT_TIERS[a].items);
                }
            });
        } else {
            let tiersToCheck = ['area_1', 'area_2', 'area_3', 'area_4', 'area_5'];
            for (let a of tiersToCheck) {
                let isUnlocked = (player.unlockedAreas && player.unlockedAreas.includes(a)) || ((player.level || 1) >= (AREAS_DB[a]?.minLevel || 1));
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

        if (typeof spireRun !== 'undefined') spireRun.hourglassUsed = false;

        let pCombatEnt = getPlayerCombatEntity();

        // Relic start-of-combat triggers
        if (player.spire && player.spire.equippedRelic === 'aegis_colossus') {
            let colossusShield = Math.round(pStats.maxHp * 0.25);
            applyStatus(pCombatEnt, 'divine_barrier', 99, colossusShield);
            logMsg(`🛡️ Aegis of the Colossus: Divine Barrier granted (${colossusShield} HP Shield)!`, "#ffd700");
        }

        // Class Start-of-Combat Passives
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
    function updateCombatUI() {
        if (typeof renderBattlefield === 'function') {
            renderBattlefield();
        }
    }
    if (typeof window !== 'undefined') {
        window.updateCombatUI = updateCombatUI;
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
        if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();
    }
    function logMsg(text, color = '#cccccc') {
        const logEl = document.getElementById('combat-log');
        logEl.innerHTML += `<div class="log-entry" style="color:${color}">${text}</div>`;
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

    function floatText(targetId, text, color, isCrit = false) {
        const targetEl = document.getElementById(targetId);
        if(!targetEl) return;
        const floatEl = document.createElement('div');
        floatEl.className = 'floating-text' + (isCrit ? ' floating-text-crit' : '');
        let displayText = text;
        if (isCrit && !String(text).startsWith('CRIT!')) {
            displayText = 'CRIT! ' + text;
        }
        floatEl.innerText = displayText;
        if (color && !isCrit) {
            floatEl.style.color = color;
        }
        floatEl.style.left = '50%';
        floatEl.style.top = isCrit ? '15%' : '20%';
        floatEl.style.transform = 'translate(-50%, 0)';
        targetEl.appendChild(floatEl);
        setTimeout(() => {
            if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
        }, isCrit ? 1200 : 1000);
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
            battleState.isPlayerTurn = false;
            startRound();
            return;
        }

        const currentTurn = battleState.turnQueue.shift();
        
        if(currentTurn.type === 'player') {
            battleState.isPlayerTurn = false;
            logMsg("Hero's Turn", "#ffffff");
            if (typeof triggerPetTurnCadence === 'function') triggerPetTurnCadence();
            if (!battleState.active) return;
            let playerEnt = getPlayerCombatEntity();
            let turnSkipped = processStatusesStartTurn(playerEnt);
            if (turnSkipped) {
                battleState.isPlayerTurn = false;
                if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();
                return;
            }
            battleState.isPlayerTurn = true;
            enableCommands();
            if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();
        } else {
            battleState.isPlayerTurn = false;
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
        if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();
    }

    function enterTargetingMode(mode) {
        battleState.targetingMode = mode;
        document.getElementById('battle-commands').classList.add('targeting-mode-ui');
        document.getElementById('enemies-side').classList.add('targeting-active');
        closeSubMenu();
    }

    function cancelTargeting() {
        if (battleState) battleState.targetingMode = null;
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
        if (player.skillTree && player.skillTree.precisionStrikes > 0) {
            critMult += (player.skillTree.precisionStrikes * 0.05);
        }

        let hasAilment = target.statuses && (
            hasStatus(target, 'bleed') || hasStatus(target, 'poison') ||
            hasStatus(target, 'stun') || hasStatus(target, 'blind') ||
            hasStatus(target, 'burn') || hasStatus(target, 'freeze') ||
            hasStatus(target, 'decay') || hasStatus(target, 'shock')
        );
        if (playerHasPassive('lethal_exploit') && hasAilment) {
            critMult += 0.40;
        }

        let isCrit = false;
        if(Math.random() * 100 < critChance) {
            isCrit = true;
            dmg = Math.floor(dmg * critMult);
            logMsg(playerHasPassive('lethal_exploit') && hasAilment ? "🎯 Lethal Exploit Critical Strike!" : "Critical Hit!", "#ff5555");
            playSFX('crit');
            screenShake('medium');

            // Vampiric Fervor Keystone: Physical critical strikes restore 10% damage dealt as HP
            if (player.skillTree && player.skillTree.vampiricFervor > 0) {
                let vHeal = Math.max(1, Math.floor(dmg * 0.10));
                let prevHp = pStats.hp;
                let excessHeal = Math.max(0, (prevHp + vHeal) - pStats.maxHp);
                playerEnt.hp = Math.min(pStats.maxHp, playerEnt.hp + vHeal);
                pStats.hp = playerEnt.hp;
                if (player.baseStats) player.baseStats.hp = playerEnt.hp;
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
            }

            // Momentum Keystone: Landing a critical strike grants Haste for 2 turns
            if (player.skillTree && player.skillTree.momentum > 0) {
                applyStatus(playerEnt, 'haste', 2);
                logMsg("⚡ Momentum activated! Critical strike grants Haste for 2 turns!", "#eab308");
                floatText('battle-player', "MOMENTUM HASTE", "#eab308");
            }
        } else {
            playSFX('slash');
        }
        
        triggerHitVFX(target.id, 'physical');
        applyDamage(target, dmg, ELEMENTS.Physical, playerEnt, isCrit);
        animateAction('battle-player');

        // Thunderstone Core Relic Chain Lightning
        if (player.spire && player.spire.equippedRelic === 'thunderstone_core' && Math.random() < 0.35) {
            let splashDmg = Math.max(1, Math.floor(dmg * 0.5));
            logMsg("⚡ Thunderstone Core discharges chain lightning!", "#eab308");
            floatText('battle-player', "THUNDER SPLASH", "#eab308");
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
        if (battleState) battleState.isPlayerTurn = false;
        document.getElementById('battle-commands').classList.remove('targeting-mode-ui');
        document.getElementById('battle-commands').classList.remove('sub-menu-active');
        document.getElementById('enemies-side').classList.remove('targeting-active');
        document.querySelectorAll('#cmd-main .btn').forEach(b => b.disabled = true);
        if (typeof updateQuickPotionButton === 'function') updateQuickPotionButton();

        let playerEnt = getPlayerCombatEntity();

        // Silence check on player casting spells
        if (hasStatus(playerEnt, 'silence') && (skill.type === 'magic' || skill.type === 'heal')) {
            logMsg("Hero is Silenced and cannot cast spells!", "#94a3b8");
            floatText('battle-player', "SILENCED", "#94a3b8");
            if (battleState) battleState.isPlayerTurn = true;
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

        let isArcaneSurge = false;
        if (skill.type === 'magic' && player.skillTree && player.skillTree.arcaneSurge > 0 && Math.random() < 0.25) {
            isArcaneSurge = true;
            logMsg("✨ Arcane Surge activated! 0 MP cost & +30% spell damage!", "#c084fc");
            floatText('battle-player', "ARCANE SURGE!", "#c084fc");
        }

        let cost = isArcaneSurge ? 0 : getSkillCost(skill);
        player.baseStats.mp = Math.max(0, player.baseStats.mp - cost);
        pStats.mp = player.baseStats.mp;
        
        logMsg(`Hero casts ${skill.name}!`, "#aaddff");
        animateAction('battle-player');

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
            } else if(skill.type === 'physical') {
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

            // Bloodthirst Strike Lifesteal
            if (skill.name === 'Bloodthirst Strike' && dmg > 0) {
                let heal = Math.max(1, Math.floor(dmg * 0.30));
                player.baseStats.hp = Math.min(pStats.maxHp, player.baseStats.hp + heal);
                pStats.hp = player.baseStats.hp;
                logMsg(`🩸 Bloodthirst Strike restored ${heal} HP to Hero!`, "#ef4444");
                floatText('battle-player', `+${heal} HP`, "#55ff55");
            }

            // Soul Siphon Skill Lifesteal & Decay
            if (skill.name === 'Soul Siphon' && dmg > 0) {
                applyStatus(target, 'decay', 3);
                let heal = Math.max(1, Math.floor(dmg * 0.50));
                player.baseStats.hp = Math.min(pStats.maxHp, player.baseStats.hp + heal);
                pStats.hp = player.baseStats.hp;
                logMsg(`🔮 Soul Siphon drained ${heal} HP to Hero!`, "#a855f7");
                floatText('battle-player', `+${heal} HP`, "#a855f7");
            }

            // Passive Soul Siphon Magic Leech (Warlock passive on other magic skills)
            if (skill.type === 'magic' && playerHasPassive('soul_siphon') && dmg > 0 && skill.name !== 'Soul Siphon') {
                let leech = Math.max(1, Math.floor(dmg * 0.20));
                player.baseStats.hp = Math.min(pStats.maxHp, player.baseStats.hp + leech);
                pStats.hp = player.baseStats.hp;
                logMsg(`🔮 Soul Siphon leeches ${leech} HP back to Hero!`, "#a855f7");
                floatText('battle-player', `+${leech} HP`, "#a855f7");
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
                    }
                }
            });
        }
        
        renderBattlefield();
        triggerRegen();
        processStatusesEndTurn(playerEnt);
        setCombatTimeout(processNextTurn, 1200);
    }
    function applyDamage(target, amount, element, attacker = null, isCrit = false) {
        if (!target || target.hp <= 0) return;

        let isTargetPlayer = (target.isPlayer || target.id === 'battle-player' || target === player);

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

        if (amount <= 0) return;

        let wasAlive = target.hp > 0;
        target.hp -= amount;
        if(target.hp < 0) target.hp = 0;

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

        // Hourglass Chronomancer Fatal Blow Rewind Check
        if (isTargetPlayer && target.hp <= 0 && wasAlive) {
            if (player.spire && player.spire.equippedRelic === 'hourglass_chronomancer' && !spireRun.hourglassUsed) {
                spireRun.hourglassUsed = true;
                let restoredHp = Math.max(1, Math.round(pStats.maxHp * 0.30));
                target.hp = restoredHp;
                pStats.hp = restoredHp;
                if (player.baseStats) player.baseStats.hp = restoredHp;
                logMsg("⌛ Chronomancer's Hourglass rewinds time! Fatal blow avoided!", "#38bdf8");
                floatText('battle-player', "REWIND!", "#38bdf8");
            } else if (playerHasPassive('undying_wrath') && !battleState.undyingWrathUsed) {
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
        applyHitFlash(target.id);
        floatText(target.id, `-${amount}`, '#ff3333', isCrit);
        if (isCrit) screenShake('medium');
        animateAction(target.id, 'anim-shake');

        // 6. Counter Stance Retaliation
        if (hasStatus(target, 'counter_stance') && element === ELEMENTS.Physical && attacker && attacker.hp > 0 && target.hp > 0) {
            let counterDmg = Math.max(1, Math.floor(target.atk * 1.0));
            logMsg(`${target.name} immediately retaliates with Counter Stance!`, "#f97316");
            floatText(target.id, "COUNTER!", "#f97316");
            applyDamage(attacker, counterDmg, ELEMENTS.Physical);
        }
        
        if(target.hp <= 0 && wasAlive) {
            if (!target.isPlayer) {
                playSFX('enemy_death');

                // Midas Touch Keystone: Defeating an enemy with a basic attack or critical hit grants bonus Gold equal to 10% of their Max HP
                if (isAttackerPlayer && player.skillTree && player.skillTree.midasTouch > 0 && (element === ELEMENTS.Physical || isCrit)) {
                    let bonusGold = Math.max(1, Math.floor(target.maxHp * 0.10));
                    player.gold = (player.gold || 0) + bonusGold;
                    updateHeader();
                    logMsg(`🪙 Midas Touch! Gained +${bonusGold} bonus Gold from defeating ${target.name}!`, "#ffd700");
                    floatText('battle-player', `+${bonusGold}G Midas`, "#ffd700");
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
            <div id="skills-items-container" style="flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:4px; padding-right:2px;"></div>
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
        
        player.skills.forEach(skillName => {
            const skill = SKILLS_DB[skillName];
            if (!skill) return;
            
            if (category !== 'all' && skill.category !== category) return;
            
            hasSkills = true;
            const cost = getSkillCost(skill);
            const canCast = pStats.mp >= cost;
            const catIcon = skill.category === 'offense' ? '⚔️' : (skill.category === 'defense' ? '🛡️' : '✨');
            const targetDesc = skill.target === 'enemy_all' ? 'All Foes' : (skill.target === 'ally_single' || skill.target === 'self' ? 'Self' : 'Single');
            
            html += `<button class="btn" style="width:100%; text-align:left; padding:6px 10px; font-size:12px; margin:2px 0;" ${canCast?'':'disabled'} onclick="selectSkill('${skillName}')">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <b>${skill.name}</b>
                            <span style="font-size:11px; color:#ffaa00; font-weight:bold;">${cost} MP</span>
                        </div>
                        <div style="font-size:10px; color:#94a3b8; display:flex; gap:6px; margin-top:2px;">
                            <span>${catIcon} ${skill.element}</span>
                            <span>• ${targetDesc}</span>
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

        if(skill.target === 'ally_single' || skill.target === 'self') {
            let playerEnt = getPlayerCombatEntity();
            if (hasStatus(playerEnt, 'silence') && (skill.type === 'magic' || skill.type === 'heal')) {
                logMsg("Hero is Silenced and cannot cast spells!", "#94a3b8");
                floatText('battle-player', "SILENCED", "#94a3b8");
                return;
            }
            let cost = getSkillCost(skill);
            player.baseStats.mp -= cost;
            pStats.mp -= cost;

            if (skill.name === 'Battle Cry') {
                applyStatus(playerEnt, 'haste', 3);
                applyStatus(playerEnt, 'battle_cry', 3);
                logMsg("Hero roars with Battle Cry! Gained Haste (+30% SPD) and +20% ATK for 3 turns!", "#f59e0b");
                floatText('battle-player', "BATTLE CRY", "#f59e0b");
            } else if (skill.name === 'Shield of Faith') {
                if(playerEnt.statuses) {
                    for(let sId in playerEnt.statuses) {
                        let def = (typeof STATUS_TYPES_DB !== 'undefined') && STATUS_TYPES_DB[sId];
                        if(def && (def.type === 'dot' || def.type === 'disable' || def.type === 'debuff' || def.type === 'ailment')) {
                            delete playerEnt.statuses[sId];
                        }
                    }
                }
                let shieldVal = Math.floor(pStats.maxHp * 0.20);
                applyStatus(playerEnt, 'divine_barrier', 3, shieldVal);
                logMsg(`Hero casts Shield of Faith! Cleansed all debuffs and gained ${shieldVal} HP Divine Barrier!`, "#ffd700");
                floatText('battle-player', `+${shieldVal} Shield`, '#ffd700');
            } else if (skill.name === 'Blade Dance') {
                applyStatus(playerEnt, 'counter_stance', 3);
                logMsg("Hero enters Blade Dance counter-stance for 3 turns!", "#38bdf8");
                floatText('battle-player', "COUNTER STANCE", "#38bdf8");
            } else {
                let heal = skill.power + Math.floor(pStats.matk / 2);
                if (hasStatus(playerEnt, 'burn')) heal = Math.floor(heal * 0.7);
                
                let decayDmg = 0;
                if (hasStatus(playerEnt, 'decay')) {
                    decayDmg = Math.floor(heal * 0.25);
                    heal = Math.max(0, heal - decayDmg);
                    logMsg(`Hero's Decay corrupted healing into ${decayDmg} damage!`, "#a855f7");
                }
                let prevHp = pStats.hp;
                let netHeal = Math.max(0, heal - decayDmg);
                let excessHeal = Math.max(0, (prevHp + netHeal) - pStats.maxHp);

                player.baseStats.hp = Math.min(pStats.maxHp, pStats.hp + netHeal);
                pStats.hp = player.baseStats.hp;
                playerEnt.hp = pStats.hp;
                logMsg(`Hero casts ${skill.name}! Restored ${heal} HP.`, "#55ff55");
                floatText('battle-player', `+${heal}`, '#55ff55');

                // Overcharged Aegis Keystone: Excess healing converts into Divine Barrier up to 20% Max HP
                if (player.skillTree && player.skillTree.overchargedAegis > 0 && excessHeal > 0) {
                    let maxBarrier = Math.floor(pStats.maxHp * 0.20);
                    let currentBarrier = (playerEnt.statuses && playerEnt.statuses.divine_barrier && playerEnt.statuses.divine_barrier.value) || 0;
                    let barrierToAdd = Math.min(excessHeal, Math.max(0, maxBarrier - currentBarrier));
                    if (barrierToAdd > 0) {
                        applyStatus(playerEnt, 'divine_barrier', 3, currentBarrier + barrierToAdd);
                        logMsg(`✨ Overcharged Aegis converted ${barrierToAdd} excess healing into Divine Barrier!`, "#ffd700");
                        floatText('battle-player', `+${barrierToAdd} Barrier`, "#ffd700");
                    }
                }

                // Tactical Buffs
                if (skill.name === 'Heal') {
                    applyStatus(playerEnt, 'regeneration', 3);
                } else if (skill.name === 'Recovery') {
                    let shieldVal = Math.floor(pStats.maxHp * 0.15);
                    applyStatus(playerEnt, 'divine_barrier', 3, shieldVal);
                }
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
            const livingEnemies = (battleState && battleState.enemies) ? battleState.enemies.filter(e => e && e.hp > 0) : [];
            if (livingEnemies.length === 1) {
                closeSubMenu();
                executePlayerSkill(skill, livingEnemies[0]);
                return;
            }
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
        
        // Award signature class skills
        let newSkills = [];
        let classSkills = (typeof getClassSkills === 'function') ? getClassSkills(classId) : (cls.skills || []);
        classSkills.forEach(s => {
            if (!player.skills.includes(s)) {
                player.skills.push(s);
                newSkills.push(s);
            }
        });
        
        computeStats();
        updateHeader();
        renderStats();
        renderClassAdvancement();
        showToast('Class Evolution Achieved!', `You have evolved into a ${cls.name}!`, 'level', 5000);
        if (newSkills.length > 0) {
            setTimeout(() => {
                showToast('Skills Unlocked!', 'Gained: ' + newSkills.join(', '), 'quest', 5000);
            }, 800);
        }
    }

    /* =========================================================================
       BATTLE RESOLUTION
       ========================================================================= */

    function winBattle() {
        clearAllCombatTimers();
        battleState.active = false;
        battleState.isPlayerTurn = false;
        if(typeof updateSaveLoadButtons === 'function') updateSaveLoadButtons(false);
        playSFX('victory');
        
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

        // Class Passives start-of-combat triggers
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
                // Cinder Pup: Ember Bite (damage + Burn DoT)
                if (target) {
                    let dmg = Math.max(5, Math.round((pStats.atk * 0.8) + (action.power * 0.6)));
                    target.hp = Math.max(0, target.hp - dmg);
                    logMsg(`🐾 <b>${pet.name}</b> uses <b>${action.name}</b> dealing <b>${dmg}</b> damage to ${target.name}!`, '#fb923c');
                    if (typeof floatText === 'function') floatText(target.id, `-${dmg}`, '#fb923c');
                    if (typeof triggerElementalImpact === 'function') triggerElementalImpact(target.id, 'Fire');
                    if (Math.random() <= (action.dotChance || 0.6)) {
                        let stacks = isApex ? 2 : 1;
                        for (let s = 0; s < stacks; s++) {
                            if (typeof applyStatus === 'function') applyStatus(target, 'burn', 3);
                        }
                        logMsg(`🔥 ${target.name} is afflicted with ${stacks} stack(s) of Burn!`, '#fb923c');
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
