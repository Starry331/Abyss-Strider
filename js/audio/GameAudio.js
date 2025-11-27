/**
 * 游戏音频管理器 - 优化版
 */
export const gameAudio = {
    ctx: null,
    musicGain: null,
    sfxGain: null,
    currentMusic: null,
    musicNodes: [],
    loopTimer: null,
    bossMode: false,

    init() {
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AC();
            const master = this.ctx.createGain();
            master.connect(this.ctx.destination);
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.35;
            this.musicGain.connect(master);
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.5;
            this.sfxGain.connect(master);
        } catch(e) { console.error('音频初始化失败:', e); }
    },

    resume() {
        if (this.ctx?.state === 'suspended') this.ctx.resume();
    },

    // ===== 音效 =====
    play(name) {
        if (!this.ctx) return;
        this.resume();
        const c = this.ctx, t = c.currentTime;
        
        switch(name) {
            case 'sword_swing': // 长剑 - 厚重
                this._osc(c, t, 'triangle', [[120,0],[60,0.15]], 0.18, 0.18);
                this._noise(c, t, 2000, 0.05, 0.1);
                break;
                
            case 'dual_blades': // 双刀 - 快速连击
                this._osc(c, t, 'triangle', [[280,0],[150,0.07]], 0.1, 0.08);
                this._osc(c, t+0.06, 'triangle', [[350,0],[180,0.07]], 0.1, 0.08);
                break;
                
            case 'staff_cast': // 法杖施法 - 空灵
                [523,659,784].forEach((f,i) => {
                    this._osc(c, t+i*0.03, 'sine', [[f,0],[f,0.4]], 0.08, 0.4, true);
                });
                this._osc(c, t, 'sine', [[1200,0],[800,0.25]], 0.03, 0.25);
                break;
                
            case 'staff_hit': // 法杖命中 - 魔法爆发
                this._osc(c, t, 'sine', [[400,0],[80,0.2]], 0.12, 0.25);
                [392,523,659].forEach(f => {
                    this._osc(c, t+0.05, 'sine', [[f,0],[f,0.3]], 0.04, 0.35);
                });
                break;
                
            case 'enemy_death':
                this._osc(c, t, 'sawtooth', [[200,0],[50,0.15]], 0.1, 0.2, false, 600);
                break;
                
            case 'player_hit':
                this._osc(c, t, 'square', [[150,0],[80,0.1]], 0.12, 0.15, false, 400);
                break;
                
            case 'blessing_select': // 赐福 - 神圣琶音
                [523,659,784,1047].forEach((f,i) => {
                    this._osc(c, t+i*0.1, 'sine', [[f,0],[f,0.4]], 0.1, 0.45, true);
                });
                break;
                
            case 'enemy_bullet':
                this._osc(c, t, 'sine', [[500,0],[350,0.08]], 0.06, 0.1);
                break;
                
            case 'boss_attack': // Boss攻击 - 威压
                this._osc(c, t, 'sawtooth', [[100,0],[40,0.3]], 0.18, 0.35, false, 300);
                this._osc(c, t, 'sine', [[60,0],[60,0.3]], 0.12, 0.3);
                break;
                
            case 'boss_spawn': // Boss警告
                for(let i=0; i<3; i++) {
                    this._osc(c, t+i*0.3, 'sawtooth', [[220,0],[220,0.2]], 0.12, 0.25, true, 800);
                }
                break;
                
            case 'level_up':
                [262,330,392,523].forEach((f,i) => {
                    this._osc(c, t+i*0.08, 'sine', [[f,0],[f,0.3]], 0.1, 0.35);
                });
                break;
                
            case 'pickup':
                this._osc(c, t, 'sine', [[600,0],[900,0.05],[900,0.1]], 0.08, 0.12);
                break;
                
            case 'roll':
                this._noise(c, t, 500, 0.06, 0.12);
                break;
                
            case 'block':
                this._osc(c, t, 'triangle', [[300,0],[150,0.05]], 0.12, 0.1);
                break;
                
            case 'shield': // 护盾获取 - 魔法护盾音
                [392, 494, 587].forEach((f,i) => {
                    this._osc(c, t+i*0.05, 'sine', [[f,0],[f,0.3]], 0.1, 0.35, true);
                });
                this._osc(c, t, 'sine', [[200,0],[100,0.2]], 0.08, 0.25);
                break;
                
            case 'menu_click':
                this._osc(c, t, 'sine', [[800,0],[1000,0.03]], 0.08, 0.08);
                break;
                
            case 'victory': // 胜利音效 - 史诗凯旋
                // 凯旋号角
                [262, 330, 392, 523, 659, 784].forEach((f,i) => {
                    this._osc(c, t+i*0.15, 'sawtooth', [[f,0],[f,0.4]], 0.12, 0.5, true, 1200);
                });
                // 和弦背景
                [[262,330,392], [330,392,523], [392,523,659], [523,659,784]].forEach((chord, ci) => {
                    chord.forEach(f => {
                        this._osc(c, t+ci*0.4+1, 'sine', [[f,0],[f,0.8]], 0.1, 0.9, true);
                    });
                });
                // 最终高潮
                [784, 880, 1047].forEach((f,i) => {
                    this._osc(c, t+2.5+i*0.1, 'sine', [[f,0],[f,0.6]], 0.15, 0.7, true);
                });
                break;
                
            case 'achievement': // 成就解锁
                [523, 659, 784, 1047].forEach((f,i) => {
                    this._osc(c, t+i*0.08, 'sine', [[f,0],[f,0.25]], 0.12, 0.3, true);
                });
                break;
        }
    },

    _osc(c, t, type, freqs, vol, dur, fadeIn=false, lpf=null) {
        const o = c.createOscillator();
        o.type = type;
        freqs.forEach(([f,time]) => {
            if(time === 0) o.frequency.setValueAtTime(f, t);
            else o.frequency.exponentialRampToValueAtTime(Math.max(f,20), t+time);
        });
        const g = c.createGain();
        if(fadeIn) {
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(vol, t+0.05);
        } else {
            g.gain.setValueAtTime(vol, t);
        }
        g.gain.exponentialRampToValueAtTime(0.001, t+dur);
        
        if(lpf) {
            const f = c.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.value = lpf;
            o.connect(f);
            f.connect(g);
        } else {
            o.connect(g);
        }
        g.connect(this.sfxGain);
        o.start(t);
        o.stop(t+dur+0.01);
    },

    _noise(c, t, freq, vol, dur) {
        const sz = c.sampleRate * dur;
        const buf = c.createBuffer(1, sz, c.sampleRate);
        const d = buf.getChannelData(0);
        for(let i=0; i<sz; i++) d[i] = Math.random()*2-1;
        const s = c.createBufferSource();
        s.buffer = buf;
        const f = c.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = freq;
        const g = c.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t+dur);
        s.connect(f);
        f.connect(g);
        g.connect(this.sfxGain);
        s.start(t);
    },

    // ===== 音乐 =====
    stopMusic() {
        if(this.loopTimer) clearTimeout(this.loopTimer);
        this.musicNodes.forEach(n => { try{n.stop();}catch(e){} });
        this.musicNodes = [];
        this.currentMusic = null;
        this.bossMode = false;
    },

    playMusic(name) {
        if(!this.ctx) return;
        this.resume();
        this.stopMusic();
        this.currentMusic = name;
        this._loopMusic(name);
    },

    playBossMusic(level) {
        if(!this.ctx) return;
        this.resume();
        this.stopMusic();
        this.currentMusic = 'boss'+level;
        this.bossMode = true;
        this._loopBossMusic(level);
    },

    _loopMusic(name) {
        if(!this.currentMusic || this.bossMode) return;
        const c = this.ctx, t = c.currentTime;
        
        const tracks = {
            menu: { chords: [[220,277,330],[174,220,261],[261,330,392],[196,247,294]], dur: 2.5 },
            level1: { chords: [[82,123,165],[73,110,147],[82,123,165],[98,147,196]], dur: 1.5 },
            level2: { chords: [[330,392,494],[294,370,440],[330,392,494],[262,330,392]], dur: 2 },
            level3: { chords: [[147,185,220],[131,165,196],[147,185,220],[165,208,247]], dur: 1 },
            level4: { chords: [[196,247,294],[220,277,330],[247,311,370],[220,277,330]], dur: 1.8 },
            level5: { chords: [[262,330,392],[294,370,440],[330,392,494],[294,370,440]], dur: 2.2 }
        };
        
        const tr = tracks[name] || tracks.menu;
        
        tr.chords.forEach((chord, ci) => {
            chord.forEach(freq => {
                const o = c.createOscillator();
                o.type = 'sine';
                o.frequency.value = freq;
                const g = c.createGain();
                const st = t + ci * tr.dur;
                g.gain.setValueAtTime(0, st);
                g.gain.linearRampToValueAtTime(0.1, st+0.3);
                g.gain.setValueAtTime(0.1, st+tr.dur-0.3);
                g.gain.linearRampToValueAtTime(0, st+tr.dur);
                o.connect(g);
                g.connect(this.musicGain);
                o.start(st);
                o.stop(st+tr.dur);
                this.musicNodes.push(o);
            });
        });
        
        this.loopTimer = setTimeout(() => {
            if(this.currentMusic === name) this._loopMusic(name);
        }, tr.chords.length * tr.dur * 1000);
    },

    _loopBossMusic(level) {
        if(!this.currentMusic || !this.bossMode) return;
        const c = this.ctx, t = c.currentTime;
        
        // 每个Boss专属激昂战斗曲
        const bossTracks = {
            1: { // 地牢Boss - 沉重压迫
                melody: [165,196,165,147, 165,196,220,196, 165,147,131,147, 165,196,220,247],
                bass: [82,82,73,73, 65,65,73,82],
                tempo: 0.22
            },
            2: { // 冰霜Boss - 凛冽急促  
                melody: [330,392,440,392, 494,440,392,330, 370,440,494,523, 494,440,392,370],
                bass: [110,110,123,123, 147,147,123,110],
                tempo: 0.18
            },
            3: { // 地狱Boss - 狂暴炽热
                melody: [220,262,294,330, 294,262,220,196, 262,294,330,392, 330,294,262,220],
                bass: [110,110,98,98, 87,87,98,110],
                tempo: 0.15
            },
            4: { // 奥林匹斯Boss - 威严神圣
                melody: [262,330,392,440, 392,330,262,294, 330,392,440,523, 440,392,330,262],
                bass: [131,131,147,147, 165,165,147,131],
                tempo: 0.2
            },
            5: { // 最终Boss - 史诗决战
                melody: [294,370,440,523, 494,440,370,294, 330,392,494,587, 523,440,370,330],
                bass: [147,147,165,165, 147,147,131,147],
                tempo: 0.17
            },
            6: { // 波塞冬Boss - 深海狂澜
                melody: [196,247,294,370, 330,294,247,196, 220,277,330,392, 370,330,277,220],
                bass: [98,98,110,110, 123,123,110,98],
                tempo: 0.19
            },
            7: { // 阿尔忒弥斯Boss - 月神狩猎
                melody: [330,392,494,587, 523,494,392,330, 370,440,523,659, 587,523,440,370],
                bass: [165,165,185,185, 196,196,185,165],
                tempo: 0.16
            }
        };
        
        const tr = bossTracks[level] || bossTracks[1];
        
        // 旋律
        tr.melody.forEach((freq, i) => {
            const o = c.createOscillator();
            o.type = 'sawtooth';
            o.frequency.value = freq;
            const f = c.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.value = 1500;
            const g = c.createGain();
            const st = t + i * tr.tempo;
            g.gain.setValueAtTime(0, st);
            g.gain.linearRampToValueAtTime(0.12, st+0.03);
            g.gain.setValueAtTime(0.12, st+tr.tempo*0.7);
            g.gain.linearRampToValueAtTime(0, st+tr.tempo);
            o.connect(f);
            f.connect(g);
            g.connect(this.musicGain);
            o.start(st);
            o.stop(st+tr.tempo+0.01);
            this.musicNodes.push(o);
        });
        
        // 低音
        tr.bass.forEach((freq, i) => {
            const o = c.createOscillator();
            o.type = 'sine';
            o.frequency.value = freq;
            const g = c.createGain();
            const st = t + i * tr.tempo * 2;
            g.gain.setValueAtTime(0.15, st);
            g.gain.setValueAtTime(0.15, st+tr.tempo*1.8);
            g.gain.linearRampToValueAtTime(0, st+tr.tempo*2);
            o.connect(g);
            g.connect(this.musicGain);
            o.start(st);
            o.stop(st+tr.tempo*2+0.01);
            this.musicNodes.push(o);
        });
        
        // 鼓点
        for(let i=0; i<16; i++) {
            const st = t + i * tr.tempo;
            // 底鼓
            if(i % 4 === 0) {
                const kick = c.createOscillator();
                kick.type = 'sine';
                kick.frequency.setValueAtTime(150, st);
                kick.frequency.exponentialRampToValueAtTime(40, st+0.1);
                const kg = c.createGain();
                kg.gain.setValueAtTime(0.2, st);
                kg.gain.exponentialRampToValueAtTime(0.001, st+0.15);
                kick.connect(kg);
                kg.connect(this.musicGain);
                kick.start(st);
                kick.stop(st+0.2);
                this.musicNodes.push(kick);
            }
            // 军鼓
            if(i % 4 === 2) {
                const sz = c.sampleRate * 0.1;
                const buf = c.createBuffer(1, sz, c.sampleRate);
                const d = buf.getChannelData(0);
                for(let j=0; j<sz; j++) d[j] = Math.random()*2-1;
                const snare = c.createBufferSource();
                snare.buffer = buf;
                const sf = c.createBiquadFilter();
                sf.type = 'highpass';
                sf.frequency.value = 1000;
                const sg = c.createGain();
                sg.gain.setValueAtTime(0.12, st);
                sg.gain.exponentialRampToValueAtTime(0.001, st+0.1);
                snare.connect(sf);
                sf.connect(sg);
                sg.connect(this.musicGain);
                snare.start(st);
                this.musicNodes.push(snare);
            }
        }
        
        this.loopTimer = setTimeout(() => {
            if(this.bossMode) this._loopBossMusic(level);
        }, tr.melody.length * tr.tempo * 1000);
    }
};
