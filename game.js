// Spielzustand
let gameState = {
    money: 1000,
    reputation: 0,
    stock: 50,
    isProcessing: false,
    clickMultiplier: 1, // Qualität
    speedMultiplier: 1, // Geschwindigkeit
    marketingLvl: 1,
    autoEnabled: false,
    ordersCompleted: 0
};

// Preise
const costs = {
    material: 200,
    materialAmount: 20,
    speed: 500,
    quality: 800,
    marketing: 1200,
    auto: 5000
};

// Die 12 Schritte des Auftrags (aus deiner Prompt)
const steps = [
    "Auftrag wird angenommen", "Anforderungen prüfen", "Auslagerung aus Lager",
    "Transport zum Kommissionierbereich", "Kommissionierung der Teile",
    "Transport zum Arbeitsplatz", "Zusammenbau", "Qualitätskontrolle",
    "Verpackung", "Versand", "Zahlungseingang", "Kunde bewertet"
];

// UI Elemente cachen
const elMoney = document.getElementById('money');
const elRep = document.getElementById('reputation');
const elStock = document.getElementById('stock');
const elProgress = document.getElementById('progress-bar');
const elStatus = document.getElementById('status-text');
const elStep = document.getElementById('step-indicator');
const elLog = document.getElementById('log-list');
const btnOrder = document.getElementById('btn-order');

// Initialisierung
function init() {
    loadGame();
    updateUI();
    logEvent("Firma eröffnet. Willkommen Chef!");
    
    // Auto-Loop (falls freigeschaltet)
    setInterval(() => {
        if(gameState.autoEnabled && !gameState.isProcessing && gameState.stock >= 5) {
            startOrder();
        }
    }, 2000);
}

// UI Aktualisieren
function updateUI() {
    elMoney.innerText = Math.floor(gameState.money);
    elRep.innerText = gameState.reputation;
    elStock.innerText = gameState.stock;
    
    // Buttons deaktivieren wenn kein Geld/Material
    btnOrder.disabled = gameState.isProcessing || gameState.stock < 5;
    
    // Kosten Updates
    document.getElementById('cost-speed').innerText = costs.speed + " €";
    document.getElementById('cost-quality').innerText = costs.quality + " €";
    document.getElementById('cost-marketing').innerText = costs.marketing + " €";
}

// Material kaufen
function buyMaterial() {
    if (gameState.money >= costs.material) {
        gameState.money -= costs.material;
        gameState.stock += costs.materialAmount;
        logEvent(`📦 ${costs.materialAmount} Rohstoffe eingekauft.`);
        updateUI();
        saveGame();
    } else {
        alert("Nicht genug Geld!");
    }
}

// Upgrade kaufen
function buyUpgrade(type) {
    let cost = costs[type];
    if (gameState.money >= cost) {
        gameState.money -= cost;
        
        if(type === 'speed') {
            gameState.speedMultiplier *= 1.2;
            costs.speed = Math.floor(costs.speed * 1.5);
            logEvent("⚡ Maschinen optimiert.");
        }
        else if(type === 'quality') {
            gameState.clickMultiplier *= 1.3;
            costs.quality = Math.floor(costs.quality * 1.5);
            logEvent("✅ Qualitätskontrolle verbessert.");
        }
        else if(type === 'marketing') {
            gameState.marketingLvl++;
            costs.marketing = Math.floor(costs.marketing * 1.5);
            logEvent("📢 Marketingkampagne gestartet.");
        }
        else if(type === 'auto') {
            if(gameState.autoEnabled) return;
            gameState.autoEnabled = true;
            document.getElementById('cost-auto').innerText = "GEKAUFT";
            logEvent("🤖 Roboter installiert.");
        }
        updateUI();
        saveGame();
    }
}

// Log System
function logEvent(msg) {
    let li = document.createElement('li');
    li.innerText = msg;
    elLog.prepend(li);
    if(elLog.children.length > 10) elLog.lastChild.remove();
}

// Zufalls-Events
function triggerRandomEvent() {
    let r = Math.random();
    if(r < 0.05) {
        logEvent("⚠️ Maschine überhitzt! Reparatur kostet 50€");
        gameState.money -= 50;
    } else if (r > 0.95) {
        logEvent("🎉 Großauftrag Bonus! +200€");
        gameState.money += 200;
    }
}

// Haupt-Logik: Auftrag Starten
function startOrder() {
    if (gameState.stock < 5 || gameState.isProcessing) return;

    gameState.stock -= 5;
    gameState.isProcessing = true;
    updateUI();

    let currentStep = 0;
    let totalSteps = steps.length;
    // Basiszeit pro Schritt (wird durch Upgrades schneller)
    let stepTime = 500 / gameState.speedMultiplier; 

    let processInterval = setInterval(() => {
        // Fortschrittsbalken
        let percent = ((currentStep + 1) / totalSteps) * 100;
        elProgress.style.width = percent + "%";
        
        // Text update
        elStatus.innerText = "Status: In Arbeit...";
        elStep.innerText = (currentStep + 1) + ". " + steps[currentStep];

        currentStep++;

        if (currentStep >= totalSteps) {
            clearInterval(processInterval);
            completeOrder();
        }
    }, stepTime);
}

// Auftrag abschließen
function completeOrder() {
    gameState.isProcessing = false;
    elProgress.style.width = "0%";
    elStatus.innerText = "Bereit für neuen Auftrag.";
    elStep.innerText = "--";

    // Belohnung berechnen
    let baseReward = 100;
    let reward = baseReward * gameState.clickMultiplier;
    
    // Ruf
    gameState.reputation += (1 * gameState.marketingLvl);
    gameState.ordersCompleted++;

    // Zufallsevent prüfen
    triggerRandomEvent();

    gameState.money += reward;
    logEvent(`💰 Auftrag erledigt: +${Math.floor(reward)} €`);
    
    updateUI();
    saveGame();
}

// Speicherfunktionen (Local Storage)
function saveGame() {
    localStorage.setItem('firmenTycoonSave', JSON.stringify(gameState));
    localStorage.setItem('firmenTycoonCosts', JSON.stringify(costs));
}

function loadGame() {
    let save = localStorage.getItem('firmenTycoonSave');
    let savedCosts = localStorage.getItem('firmenTycoonCosts');
    if (save) gameState = JSON.parse(save);
    if (savedCosts) {
        let loadedCosts = JSON.parse(savedCosts);
        // Kosten aktualisieren
        costs.speed = loadedCosts.speed;
        costs.quality = loadedCosts.quality;
        costs.marketing = loadedCosts.marketing;
    }
}

// Spiel starten
init();