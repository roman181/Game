/* --- METINMON 3D HYBRID ENGINE --- */

// 2D Context (Welt)
const cvsWorld = document.getElementById('world-canvas');
const ctx = cvsWorld.getContext('2d');

// 3D Context (Spieler)
const scene = new THREE.Scene();
const camera3D = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('player-canvas'), alpha: true, antialias: true });

// --- ASSETS ---
const ASSETS = {
    sheet1: 'assets/1000209921.jpg', // Deine hochgeladenen Bilder
    sheet2: 'assets/1000209922.jpg',
    sheet3: 'assets/1000209923.jpg'
};
const images = {};
Object.keys(ASSETS).forEach(k => { images[k] = new Image(); images[k].src = ASSETS[k]; });

// Sprite UVs
const SPRITES = {
    pyrowulf: { sheet: 'sheet1', u: 0.5, v: 0 },
    metin: { sheet: 'sheet1', u: 0, v: 0.5 },
    koeter: { sheet: 'sheet2', u: 0.5, v: 0 }
};

// --- GAME STATE ---
const game = {
    player: { x: 1000, y: 1000, speed: 6, hp: 100, maxHp: 100, xp: 0, lvl: 5, rot: 0 },
    camera: { x: 0, y: 0 },
    joystick: { active: false, dx: 0, dy: 0, originX: 0, originY: 0 },
    entities: [],
    particles: [],
    meshPlayer: null, // 3D Objekt

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupControls();
        this.init3D(); // Starte Three.js
        this.spawnWorld();
        this.loop();
    },

    resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        cvsWorld.width = w; cvsWorld.height = h;
        renderer.setSize(w, h);
        camera3D.aspect = w / h;
        camera3D.updateProjectionMatrix();
    },

    init3D() {
        // Licht
        const light = new THREE.DirectionalLight(0xffffff, 1.2);
        light.position.set(5, 10, 7);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0x404040));

        // Spieler-Avatar bauen (Minecraft-Style Figur aus Boxen)
        const group = new THREE.Group();

        // Körper (Blaues Shirt)
        const bodyGeo = new THREE.BoxGeometry(0.8, 1, 0.4);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.5;
        group.add(body);

        // Kopf (Hautfarben)
        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMat = new THREE.MeshLambertMaterial({ color: 0xffd1a4 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.3;
        group.add(head);

        // Schwert (rechts)
        const swordGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
        const swordMat = new THREE.MeshLambertMaterial({ color: 0xcbd5e1 });
        const sword = new THREE.Mesh(swordGeo, swordMat);
        sword.position.set(0.6, 0.8, 0.2);
        sword.rotation.x = Math.PI / 4;
        group.add(sword);

        this.meshPlayer = group;
        scene.add(group);

        // Kamera Setup (Isometrisch-artig)
        camera3D.position.set(0, 8, 10);
        camera3D.lookAt(0, 0, 0);
    },

    spawnWorld() {
        // Gleiche Spawn Logik wie vorher
        for(let i=0; i<30; i++) {
            const isMetin = Math.random() > 0.7;
            this.entities.push({
                type: isMetin ? 'metin' : 'enemy',
                x: 800 + Math.random() * 800,
                y: 800 + Math.random() * 800,
                hp: 50, maxHp: 50,
                sprite: isMetin ? SPRITES.metin : SPRITES.pyrowulf,
                name: isMetin ? "Metin" : "Mob"
            });
        }
    },

    setupControls() {
        // Joystick Logik (exakt wie im vorigen Code)
        const zone = document.getElementById('joystick-zone');
        const start = (e) => {
            e.preventDefault(); this.joystick.active = true;
            const t = e.touches ? e.touches[0] : e;
            this.joystick.originX = t.clientX; this.joystick.originY = t.clientY;
            const rect = zone.getBoundingClientRect();
            const stick = document.getElementById('stick');
            stick.style.transition = 'none';
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
            stick.style.left = (70 + Math.cos(angle)*dist) + 'px';
            stick.style.top = (70 + Math.sin(angle)*dist) + 'px';
        };
        const end = (e) => {
            if(e) e.preventDefault(); this.joystick.active = false;
            this.joystick.dx = 0; this.joystick.dy = 0;
            document.getElementById('stick').style.cssText = "transition: 0.2s; left: 50%; top: 50%;";
        };
        zone.addEventListener('touchstart', start);
        zone.addEventListener('touchmove', move);
        zone.addEventListener('touchend', end);
        zone.addEventListener('mousedown', start);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
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
            
            // Rotation für 3D Modell berechnen
            this.player.rot = Math.atan2(this.joystick.dx, -this.joystick.dy); // -dy weil 3D Z-Achse anders ist
        }

        // Camera Lock 2D
        this.camera.x = this.player.x - cvsWorld.width / 2;
        this.camera.y = this.player.y - cvsWorld.height / 2;

        // 3D Player Animation
        if(this.meshPlayer) {
            // Rotation anwenden (Smooth)
            if(this.joystick.active) {
                 this.meshPlayer.rotation.y = this.player.rot;
                 // Lauf Animation (Wackeln)
                 this.meshPlayer.position.y = Math.sin(Date.now() / 100) * 0.1; 
            } else {
                 this.meshPlayer.position.y = 0;
            }
        }
        
        // Particles
        this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
        this.particles = this.particles.filter(p => p.life > 0);
    },

    draw() {
        // --- 2D WELT RENDER ---
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, cvsWorld.width, cvsWorld.height);

        // Grid (Boden)
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.beginPath();
        const gs = 100;
        const ox = -this.camera.x % gs; const oy = -this.camera.y % gs;
        for(let x=ox; x<cvsWorld.width; x+=gs) { ctx.moveTo(x,0); ctx.lineTo(x, cvsWorld.height); }
        for(let y=oy; y<cvsWorld.height; y+=gs) { ctx.moveTo(0,y); ctx.lineTo(cvsWorld.width, y); }
        ctx.stroke();

        // 2D Entities (Metins & Mobs)
        this.entities.forEach(e => {
            const sx = e.x - this.camera.x;
            const sy = e.y - this.camera.y;
            if(sx < -50 || sx > cvsWorld.width+50 || sy < -50 || sy > cvsWorld.height+50) return;

            // Schatten
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(sx, sy+10, 20, 10, 0, 0, Math.PI*2); ctx.fill();

            // Sprite
            if(e.sprite && images[e.sprite.sheet]) {
                const img = images[e.sprite.sheet];
                const sw = img.width/2; const sh = img.height/2;
                const ux = e.sprite.u * img.width; const uy = e.sprite.v * img.height;
                const size = e.type==='metin'?80:64;
                ctx.drawImage(img, ux, uy, sw, sh, sx-size/2, sy-size/2-15, size, size);
            }
            
            // HP Bar
            ctx.fillStyle='red'; ctx.fillRect(sx-20, sy-50, 40*(e.hp/e.maxHp), 5);
        });

        // Particles
        this.particles.forEach(p => {
            ctx.fillStyle = p.color; ctx.font = "bold 20px Arial";
            ctx.fillText(p.text, p.x - this.camera.x, p.y - this.camera.y);
        });

        // --- 3D RENDER (Overlay) ---
        // Die 3D Kamera folgt nicht per Koordinaten, sondern bleibt fest zentriert,
        // da wir den Spieler immer in der Bildschirmmitte (Canvas Mitte) haben wollen.
        // Der Spieler ist in der 3D Szene immer bei (0,0,0).
        renderer.render(scene, camera3D);
    },

    attack(e) {
        if(e) e.preventDefault();
        // Schwert Animation 3D
        if(this.meshPlayer) {
             this.meshPlayer.rotation.y += 1; // 360 Spin Attack
             setTimeout(() => this.meshPlayer.rotation.y -= 1, 200);
        }

        // Treffer Logik 2D
        let hit = false;
        this.entities.forEach(ent => {
            const dist = Math.hypot(ent.x - this.player.x, ent.y - this.player.y);
            if(dist < 120) {
                ent.hp -= 20; hit = true;
                this.spawnParticle(ent.x, ent.y-40, "-20", "#fff");
                if(ent.hp <= 0) { ent.x = -9999; this.player.xp += 10; this.updateHud(); }
            }
        });
    },

    useItem(e) { if(e) e.preventDefault(); this.player.hp = 100; this.updateHud(); },
    
    spawnParticle(x, y, t, c) { this.particles.push({x,y,text:t,color:c,life:30,vx:0,vy:-2}); },
    
    updateHud() {
        document.getElementById('hud-hp').style.width = (this.player.hp)+"%";
        document.getElementById('hud-xp').style.width = (this.player.xp)+"%";
    }
};

game.init();