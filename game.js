/* --- METINMON MOBILE ENGINE --- */
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// --- ASSETS ---
// WICHTIG: Stelle sicher, dass die Bilder im 'assets/' Ordner sind!
const ASSETS = {
    sheet1: 'assets/1000209921.jpg',
    sheet2: 'assets/1000209922.jpg',
    sheet3: 'assets/1000209923.jpg'
};
const images = {};
let loadedCount = 0;

// Lade alle Bilder
Object.keys(ASSETS).forEach(key => {
    images[key] = new Image();
    images[key].src = ASSETS[key];
    images[key].onload = () => {
        loadedCount++;
        if(loadedCount === 1) { // Sobald erstes Bild da ist, Avatar setzen
             document.getElementById('player-avatar').style.backgroundImage = `url(${ASSETS.sheet1})`;
             document.getElementById('player-avatar').style.backgroundSize = "200%"; 
        }
    };
});

// Sprite Mapping (UV Koordinaten für 2x2 Sheets)
const SPRITES = {
    player: { sheet: 'sheet1', u: 0, v: 0 },
    pyrowulf: { sheet: 'sheet1', u: 0.5, v: 0 },
    metin: { sheet: 'sheet1', u: 0, v: 0.5 },
    orb: { sheet: 'sheet1', u: 0.5, v: 0.5 },
    zerstoerer: { sheet: 'sheet2', u: 0, v: 0 },
    koeter: { sheet: 'sheet2', u: 0.5, v: 0 },
    achim: { sheet: 'sheet2', u: 0, v: 0.5 },
    shiny: { sheet: 'sheet3', u: 0, v: 0 }
};

// --- GAME STATE ---
const game = {
    player: { x: 1000, y: 1000, speed: 6, hp: 100, maxHp: 100, xp: 0, lvl: 5 },
    camera: { x: 0, y: 0 },
    joystick: { active: false, dx: 0, dy: 0, originX: 0, originY: 0 },
    entities: [],
    particles: [],
    botNames: ["ShadowHunter", "MetinSlayer", "BuffPls", "xX_Killa_Xx", "DragonLord"],
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupControls();
        this.spawnWorld();
        requestAnimationFrame(() => this.loop());
        
        // Fake Chat Loop
        setInterval(() => {
            if(Math.random() > 0.6) this.addChat(this.botNames[Math.floor(Math.random()*this.botNames.length)], ["LFM Boss", "Suche Gilde", "Verkaufe VMS+9", "Wo ist der Metin?", "lol", "Hilfe pls"][Math.floor(Math.random()*6)]);
        }, 4000);
    },

    resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    },

    setupControls() {
        const zone = document.getElementById('joystick-zone');
        
        const start = (e) => {
            e.preventDefault();
            this.joystick.active = true;
            const t = e.touches ? e.touches[0] : e;
            this.joystick.originX = t.clientX;
            this.joystick.originY = t.clientY;
            
            const stick = document.getElementById('stick');
            stick.style.transition = 'none';
            // Set initial visual pos relative to zone
            const rect = zone.getBoundingClientRect();
            stick.style.left = (t.clientX - rect.left) + 'px';
            stick.style.top = (t.clientY - rect.top) + 'px';
        };

        const move = (e) => {
            if(!this.joystick.active) return;
            e.preventDefault();
            const t = e.touches ? e.touches[0] : e;
            const dx = t.clientX - this.joystick.originX;
            const dy = t.clientY - this.joystick.originY;
            const dist = Math.min(Math.hypot(dx, dy), 50);
            const angle = Math.atan2(dy, dx);
            
            this.joystick.dx = Math.cos(angle) * (dist/50);
            this.joystick.dy = Math.sin(angle) * (dist/50);

            const stick = document.getElementById('stick');
            stick.style.left = (70 + Math.cos(angle)*dist) + 'px'; // 70 = half zone width
            stick.style.top = (70 + Math.sin(angle)*dist) + 'px';
        };

        const end = (e) => {
            if(e) e.preventDefault();
            this.joystick.active = false;
            this.joystick.dx = 0; this.joystick.dy = 0;
            const stick = document.getElementById('stick');
            stick.style.transition = '0.2s';
            stick.style.left = '50%'; stick.style.top = '50%';
        };

        zone.addEventListener('touchstart', start);
        zone.addEventListener('touchmove', move);
        zone.addEventListener('touchend', end);
        // Mouse support for testing on PC
        zone.addEventListener('mousedown', start);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
    },

    spawnWorld() {
        // Metins & Monster
        for(let i=0; i<40; i++) {
            const isMetin = Math.random() > 0.7;
            this.entities.push({
                id: i,
                type: isMetin ? 'metin' : 'enemy',
                x: 800 + Math.random() * 800,
                y: 800 + Math.random() * 800,
                hp: isMetin ? 80 : 40, maxHp: isMetin ? 80 : 40,
                sprite: isMetin ? SPRITES.metin : (Math.random()>0.5 ? SPRITES.pyrowulf : SPRITES.koeter),
                name: isMetin ? "Metin der Schlacht" : "Wilder Mob"
            });
        }
        // Fake Players
        for(let i=0; i<6; i++) {
            this.entities.push({
                type: 'player',
                x: 950 + Math.random() * 300,
                y: 950 + Math.random() * 300,
                sprite: SPRITES.player,
                name: this.botNames[i],
                targetX: 0, targetY: 0
            });
        }
    },

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    },

    update() {
        // Player Move
        if(this.joystick.active) {
            this.player.x += this.joystick.dx * this.player.speed;
            this.player.y += this.joystick.dy * this.player.speed;
        }

        // Camera Lock
        this.camera.x = this.player.x - canvas.width / 2;
        this.camera.y = this.player.y - canvas.height / 2;

        // Bot AI
        this.entities.forEach(e => {
            if(e.type === 'player') {
                if(Math.random() < 0.02) {
                    e.targetX = (Math.random() - 0.5) * 4;
                    e.targetY = (Math.random() - 0.5) * 4;
                }
                e.x += (e.targetX || 0);
                e.y += (e.targetY || 0);
                
                // Boundaries keeping them close
                if(Math.hypot(e.x - 1000, e.y - 1000) > 600) { e.x = 1000; e.y = 1000; }
            }
        });

        // Particles
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; p.vy *= 0.95; });
    },

    draw() {
        // Ground
        ctx.fillStyle = '#1e293b'; // Darker ground
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Grid
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const gridSize = 100;
        const offX = -this.camera.x % gridSize;
        const offY = -this.camera.y % gridSize;
        for(let x=offX; x<canvas.width; x+=gridSize) { ctx.moveTo(x,0); ctx.lineTo(x, canvas.height); }
        for(let y=offY; y<canvas.height; y+=gridSize) { ctx.moveTo(0,y); ctx.lineTo(canvas.width, y); }
        ctx.stroke();

        // Render Order (Y-Sort)
        const renderList = [...this.entities, { ...this.player, type: 'me', sprite: SPRITES.player }];
        renderList.sort((a,b) => a.y - b.y);

        renderList.forEach(e => {
            const sx = e.x - this.camera.x;
            const sy = e.y - this.camera.y;
            
            if(sx < -100 || sx > canvas.width+100 || sy < -100 || sy > canvas.height+100) return;

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath(); ctx.ellipse(sx, sy + 20, 20, 10, 0, 0, Math.PI*2); ctx.fill();

            // Sprite Drawing
            if(e.sprite && images[e.sprite.sheet] && images[e.sprite.sheet].complete) {
                const img = images[e.sprite.sheet];
                const sw = img.width / 2;
                const sh = img.height / 2;
                const ux = e.sprite.u * img.width;
                const uy = e.sprite.v * img.height;
                
                // Pulsing Metin Stone
                let scale = 1;
                if(e.type === 'metin') scale = 1 + Math.sin(Date.now()/500)*0.05;

                const size = 80 * scale;
                ctx.drawImage(img, ux, uy, sw, sh, sx - size/2, sy - size/2 - 20, size, size);
            } else {
                // Fallback
                ctx.fillStyle = e.type === 'me' ? 'yellow' : 'red';
                ctx.fillRect(sx-10, sy-20, 20, 40);
            }

            // UI Elements above head
            if(e.type !== 'me') {
                // Name
                ctx.fillStyle = e.type === 'player' ? '#60a5fa' : '#e2e8f0';
                ctx.font = 'bold 12px Segoe UI';
                ctx.textAlign = 'center';
                ctx.shadowColor="black"; ctx.shadowBlur=4;
                ctx.fillText(e.name || "Unknown", sx, sy - 70);
                ctx.shadowBlur=0;

                // HP Bar
                if(e.type !== 'player') {
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(sx - 20, sy - 65, 40, 6);
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(sx - 19, sy - 64, 38 * (e.hp/e.maxHp), 4);
                }
            } else {
                // Own Name
                ctx.fillStyle = '#fbbf24';
                ctx.font = 'bold 12px Segoe UI';
                ctx.textAlign = 'center';
                ctx.shadowColor="black"; ctx.shadowBlur=4;
                ctx.fillText("DU", sx, sy - 70);
                ctx.shadowBlur=0;
            }
        });

        // Particles
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.font = 'bold 20px Segoe UI';
            ctx.shadowColor="black"; ctx.shadowBlur=2;
            ctx.fillText(p.text, p.x - this.camera.x, p.y - this.camera.y);
            ctx.shadowBlur=0;
        });
    },

    attack(e) {
        if(e) e.preventDefault();
        
        // Anim
        const btn = document.getElementById('btn-atk');
        btn.style.transform = "scale(0.9)";
        setTimeout(() => btn.style.transform = "", 100);

        // Logic
        let hit = false;
        this.entities.forEach(ent => {
            if(ent.type === 'player') return;
            const dist = Math.hypot(ent.x - this.player.x, ent.y - this.player.y);
            
            if(dist < 100) {
                const dmg = 15 + Math.floor(Math.random() * 10);
                const isCrit = Math.random() < 0.2;
                const finalDmg = isCrit ? dmg * 2 : dmg;
                
                ent.hp -= finalDmg;
                this.spawnParticle(ent.x, ent.y - 50, finalDmg, isCrit ? '#fbbf24' : '#fff');
                hit = true;

                if(ent.hp <= 0) {
                    ent.x = -99999; // Remove
                    this.player.xp += 25;
                    this.addChat("System", `Du erhältst 25 EXP.`);
                    this.checkLvl();
                }
            }
        });
        
        if(!hit) this.spawnParticle(this.player.x, this.player.y - 60, "Miss", "#94a3b8");
    },

    useItem(e) {
        if(e) e.preventDefault();
        this.spawnParticle(this.player.x, this.player.y - 60, "+HP", "#22c55e");
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
        this.updateHud();
    },

    spawnParticle(x, y, text, color) {
        this.particles.push({x, y, text, color, life: 40, vx: (Math.random()-0.5)*2, vy: -3});
    },

    checkLvl() {
        this.updateHud();
        if(this.player.xp >= 100) {
            this.player.xp = 0;
            this.player.lvl++;
            this.player.maxHp += 50;
            this.player.hp = this.player.maxHp;
            
            const n = document.getElementById('notification');
            n.innerText = `LEVEL UP! Lv.${this.player.lvl}`;
            n.classList.add('active');
            setTimeout(() => n.classList.remove('active'), 2500);
            
            document.querySelector('.lvl-badge').innerText = `Lv.${this.player.lvl}`;
        }
    },

    updateHud() {
        document.getElementById('hud-hp').style.width = (this.player.hp / this.player.maxHp * 100) + "%";
        document.getElementById('hud-xp').style.width = (this.player.xp / 100 * 100) + "%";
    },

    addChat(name, msg) {
        const box = document.getElementById('chat-box');
        const el = document.createElement('div');
        el.className = 'chat-msg';
        el.innerHTML = `<span class="${name==='System'?'chat-sys':'chat-player'}">${name}:</span> ${msg}`;
        box.appendChild(el);
        box.scrollTop = box.scrollHeight;
    }
};

// Start
game.init();