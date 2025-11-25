/**
 * 音频管理器 - 使用Web Audio API生成程序化音效和音乐
 */
export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.currentMusic = null;
        this.musicNodes = [];
        this.isMuted = false;
        this.musicVolume = 0.6;  // 提高音量
        this.sfxVolume = 0.8;
        
        this.init();
    }
    
    init() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.error('浏览器不支持Web Audio API');
                return;
            }
            
            this.audioContext = new AudioContextClass();
            console.log('AudioContext 创建成功:', this.audioContext);
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.masterGain);
            
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.masterGain);
            
            console.log('AudioManager 初始化完成');
        } catch (e) {
            console.error('Web Audio API初始化失败:', e);
        }
    }
    
    // 确保音频上下文运行
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // ==================== 音效系统 ====================
    
    playSound(name) {
        if (!this.audioContext || this.isMuted) return;
        this.resume();
        
        switch(name) {
            case 'sword_swing':
                this.playSwordSwing();
                break;
            case 'dual_blades':
                this.playDualBlades();
                break;
            case 'staff_hit':
                this.playStaffHit();
                break;
            case 'staff_cast':
                this.playStaffCast();
                break;
            case 'enemy_death':
                this.playEnemyDeath();
                break;
            case 'player_hit':
                this.playPlayerHit();
                break;
            case 'level_up':
                this.playLevelUp();
                break;
            case 'blessing_select':
                this.playBlessingSelect();
                break;
            case 'menu_click':
                this.playMenuClick();
                break;
            case 'boss_spawn':
                this.playBossSpawn();
                break;
        }
    }
    
    // 长剑挥砍 - 沉重的金属挥动声
    playSwordSwing() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 噪声扫过
        const noise = this.createNoise(0.15);
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(800, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        noiseFilter.Q.value = 2;
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        
        // 金属音
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
        
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.15, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }
    
    // 双刀挥砍 - 快速连续的轻快声
    playDualBlades() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 两次快速斩击
        for (let i = 0; i < 2; i++) {
            const t = now + i * 0.08;
            
            const noise = this.createNoise(0.1);
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1000;
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
            
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);
            
            // 高频尖锐音
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800 + i * 200, t);
            osc.frequency.exponentialRampToValueAtTime(400, t + 0.08);
            
            const oscGain = ctx.createGain();
            oscGain.gain.setValueAtTime(0.1, t);
            oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
            
            osc.connect(oscGain);
            oscGain.connect(this.sfxGain);
            
            osc.start(t);
            osc.stop(t + 0.1);
        }
    }
    
    // 法杖命中 - 魔法爆发音
    playStaffHit() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 魔法爆发
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(600, now);
        osc1.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(900, now);
        osc2.frequency.exponentialRampToValueAtTime(300, now + 0.2);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        // 混响
        const reverb = this.createReverb(0.3);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(reverb);
        reverb.connect(this.sfxGain);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.3);
        osc2.stop(now + 0.3);
    }
    
    // 法杖施法 - 魔法蓄力音
    playStaffCast() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.1);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }
    
    // 敌人死亡
    playEnemyDeath() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 爆裂音
        const noise = this.createNoise(0.2);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
    }
    
    // 玩家受伤
    playPlayerHit() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }
    
    // 升级音效
    playLevelUp() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.35);
        });
    }
    
    // 赐福选择
    playBlessingSelect() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.15);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }
    
    // 菜单点击
    playMenuClick() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 600;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.08);
    }
    
    // Boss出现
    playBossSpawn() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 低沉警告音
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = 80;
            
            const gain = ctx.createGain();
            const t = now + i * 0.4;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.3, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
            
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 200;
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.start(t);
            osc.stop(t + 0.4);
        }
    }

    // ==================== 音乐系统 ====================
    
    playMusic(name) {
        if (!this.audioContext) return;
        this.resume();
        this.stopMusic();
        
        switch(name) {
            case 'menu':
                this.playMenuMusic();
                break;
            case 'level1':
            case 'dungeon':
                this.playDungeonMusic();
                break;
            case 'level2':
            case 'ice':
                this.playIceMusic();
                break;
            case 'level3':
            case 'hell':
                this.playHellMusic();
                break;
            case 'level4':
            case 'olympus':
                this.playOlympusMusic();
                break;
            case 'level5':
            case 'temple':
                this.playTempleMusic();
                break;
        }
    }
    
    stopMusic() {
        this.musicNodes.forEach(node => {
            try {
                node.stop();
            } catch(e) {}
        });
        this.musicNodes = [];
        this.currentMusic = null;
    }
    
    // 主菜单音乐 - 神秘史诗感
    playMenuMusic() {
        this.currentMusic = 'menu';
        console.log('播放主菜单音乐...');
        this.playMusicLoop(() => {
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            
            // 和弦进行: Am - F - C - G
            const chords = [
                [220, 261, 330], // Am
                [174, 220, 261], // F
                [261, 330, 392], // C
                [196, 247, 294]  // G
            ];
            
            const duration = 2;
            
            chords.forEach((chord, ci) => {
                chord.forEach((freq, fi) => {
                    const osc = ctx.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    
                    const gain = ctx.createGain();
                    const t = now + ci * duration;
                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.2, t + 0.3);
                    gain.gain.setValueAtTime(0.2, t + duration - 0.3);
                    gain.gain.linearRampToValueAtTime(0, t + duration);
                    
                    osc.connect(gain);
                    gain.connect(this.musicGain);
                    
                    osc.start(t);
                    osc.stop(t + duration);
                    this.musicNodes.push(osc);
                });
            });
            
            return chords.length * duration * 1000;
        });
    }
    
    // 深暗地牢 - 紧张压抑
    playDungeonMusic() {
        this.currentMusic = 'dungeon';
        this.playMusicLoop(() => {
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            
            // 低沉的贝斯线
            const bassNotes = [82, 82, 98, 82, 73, 73, 82, 98];
            const duration = 0.5;
            
            bassNotes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 300;
                
                const gain = ctx.createGain();
                const t = now + i * duration;
                gain.gain.setValueAtTime(0.12, t);
                gain.gain.exponentialRampToValueAtTime(0.02, t + duration * 0.9);
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.musicGain);
                
                osc.start(t);
                osc.stop(t + duration);
                this.musicNodes.push(osc);
            });
            
            return bassNotes.length * duration * 1000;
        });
    }
    
    // 冰封雪山 - 空灵寒冷
    playIceMusic() {
        this.currentMusic = 'ice';
        this.playMusicLoop(() => {
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            
            // 空灵的高音
            const notes = [523, 659, 784, 659, 523, 392, 523, 659];
            const duration = 0.75;
            
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                const gain = ctx.createGain();
                const t = now + i * duration;
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.1, t + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
                
                // 颤音效果
                const vibrato = ctx.createOscillator();
                vibrato.frequency.value = 5;
                const vibratoGain = ctx.createGain();
                vibratoGain.gain.value = 3;
                vibrato.connect(vibratoGain);
                vibratoGain.connect(osc.frequency);
                
                osc.connect(gain);
                gain.connect(this.musicGain);
                
                vibrato.start(t);
                osc.start(t);
                vibrato.stop(t + duration);
                osc.stop(t + duration);
                this.musicNodes.push(osc, vibrato);
            });
            
            return notes.length * duration * 1000;
        });
    }
    
    // 地狱走廊 - 激烈危险
    playHellMusic() {
        this.currentMusic = 'hell';
        this.playMusicLoop(() => {
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            
            // 激进的贝斯和鼓点
            const pattern = [1, 0, 1, 0, 1, 1, 0, 1];
            const duration = 0.25;
            
            pattern.forEach((hit, i) => {
                if (hit) {
                    const t = now + i * duration;
                    
                    // 低音鼓
                    const kick = ctx.createOscillator();
                    kick.type = 'sine';
                    kick.frequency.setValueAtTime(150, t);
                    kick.frequency.exponentialRampToValueAtTime(50, t + 0.1);
                    
                    const kickGain = ctx.createGain();
                    kickGain.gain.setValueAtTime(0.3, t);
                    kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
                    
                    kick.connect(kickGain);
                    kickGain.connect(this.musicGain);
                    
                    kick.start(t);
                    kick.stop(t + 0.2);
                    this.musicNodes.push(kick);
                }
            });
            
            // 失真吉他风格
            const riff = [98, 110, 98, 131, 98, 110, 147, 131];
            riff.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                
                const distortion = ctx.createWaveShaper();
                distortion.curve = this.makeDistortionCurve(50);
                
                const gain = ctx.createGain();
                const t = now + i * duration;
                gain.gain.setValueAtTime(0.08, t);
                gain.gain.exponentialRampToValueAtTime(0.02, t + duration * 0.8);
                
                osc.connect(distortion);
                distortion.connect(gain);
                gain.connect(this.musicGain);
                
                osc.start(t);
                osc.stop(t + duration);
                this.musicNodes.push(osc);
            });
            
            return pattern.length * duration * 1000;
        });
    }
    
    // 奥林匹斯 - 宏伟神圣
    playOlympusMusic() {
        this.currentMusic = 'olympus';
        this.playMusicLoop(() => {
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            
            // 宏大和弦
            const chords = [
                [261, 330, 392, 523], // C major
                [294, 370, 440, 587], // D major
                [330, 415, 494, 659], // E major
                [261, 330, 392, 523]  // C major
            ];
            
            const duration = 2;
            
            chords.forEach((chord, ci) => {
                chord.forEach((freq) => {
                    const osc = ctx.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    
                    const osc2 = ctx.createOscillator();
                    osc2.type = 'triangle';
                    osc2.frequency.value = freq * 2;
                    
                    const gain = ctx.createGain();
                    const t = now + ci * duration;
                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.06, t + 0.5);
                    gain.gain.setValueAtTime(0.06, t + duration - 0.5);
                    gain.gain.linearRampToValueAtTime(0, t + duration);
                    
                    osc.connect(gain);
                    osc2.connect(gain);
                    gain.connect(this.musicGain);
                    
                    osc.start(t);
                    osc2.start(t);
                    osc.stop(t + duration);
                    osc2.stop(t + duration);
                    this.musicNodes.push(osc, osc2);
                });
            });
            
            return chords.length * duration * 1000;
        });
    }
    
    // 圣殿 - 最终史诗
    playTempleMusic() {
        this.currentMusic = 'temple';
        this.playMusicLoop(() => {
            const ctx = this.audioContext;
            const now = ctx.currentTime;
            
            // 史诗和弦进行
            const chords = [
                [220, 277, 330, 440], // Am
                [196, 247, 294, 392], // G
                [174, 220, 261, 349], // F
                [164, 207, 247, 330]  // E
            ];
            
            const duration = 1.5;
            
            // 低音drone
            const drone = ctx.createOscillator();
            drone.type = 'sawtooth';
            drone.frequency.value = 55;
            
            const droneFilter = ctx.createBiquadFilter();
            droneFilter.type = 'lowpass';
            droneFilter.frequency.value = 150;
            
            const droneGain = ctx.createGain();
            droneGain.gain.value = 0.1;
            
            drone.connect(droneFilter);
            droneFilter.connect(droneGain);
            droneGain.connect(this.musicGain);
            
            drone.start(now);
            drone.stop(now + chords.length * duration);
            this.musicNodes.push(drone);
            
            chords.forEach((chord, ci) => {
                chord.forEach((freq) => {
                    const osc = ctx.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    
                    const gain = ctx.createGain();
                    const t = now + ci * duration;
                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.08, t + 0.3);
                    gain.gain.setValueAtTime(0.08, t + duration - 0.3);
                    gain.gain.linearRampToValueAtTime(0, t + duration);
                    
                    osc.connect(gain);
                    gain.connect(this.musicGain);
                    
                    osc.start(t);
                    osc.stop(t + duration);
                    this.musicNodes.push(osc);
                });
            });
            
            return chords.length * duration * 1000;
        });
    }
    
    // 循环播放音乐
    playMusicLoop(generator) {
        if (this.isMuted) {
            console.log('音乐已静音');
            return;
        }
        
        console.log('音乐循环开始, 音频上下文状态:', this.audioContext.state);
        const duration = generator();
        console.log('音乐段落时长:', duration, 'ms');
        
        this.musicLoopTimeout = setTimeout(() => {
            if (this.currentMusic) {
                this.playMusicLoop(generator);
            }
        }, duration);
    }

    // ==================== 工具方法 ====================
    
    createNoise(duration) {
        const ctx = this.audioContext;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.start();
        
        return noise;
    }
    
    createReverb(duration) {
        const ctx = this.audioContext;
        const rate = ctx.sampleRate;
        const length = rate * duration;
        const impulse = ctx.createBuffer(2, length, rate);
        
        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        
        const convolver = ctx.createConvolver();
        convolver.buffer = impulse;
        return convolver;
    }
    
    makeDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        
        return curve;
    }
    
    // 音量控制
    setMusicVolume(value) {
        this.musicVolume = value;
        if (this.musicGain) {
            this.musicGain.gain.value = value;
        }
    }
    
    setSfxVolume(value) {
        this.sfxVolume = value;
        if (this.sfxGain) {
            this.sfxGain.gain.value = value;
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 1;
        }
        if (this.isMuted) {
            this.stopMusic();
        }
        return this.isMuted;
    }
}
