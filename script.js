// Basis-Spielzustand
const state = {
  money: 1000,
  satisfaction: 50,
  techLevel: 1,
  machinesLevel: 1,
  staffLevel: 1,
  logisticsLevel: 1,
  currentOrder: null,
  currentStepIndex: 0
};

const ORDER_TYPES = [
  { type: "Standardauftrag", baseReward: 200, baseTime: 12 },
  { type: "Expressauftrag", baseReward: 300, baseTime: 8, timeLimit: true },
  { type: "Komplexes Projekt", baseReward: 500, baseTime: 18, multiComponent: true },
  { type: "VIP-Auftrag", baseReward: 600, baseTime: 10, highQuality: true },
  { type: "Serienproduktion", baseReward: 150, baseTime: 10, series: true }
];

const PROCESS_STEPS = [
  "Auftrag annehmen",
  "Anforderungen prüfen",
  "Material auslagern",
  "Transport zum Kommissionierbereich",
  "Kommissionierung",
  "Transport zum Arbeitsplatz",
  "Zusammenbau",
  "Qualitätskontrolle",
  "Verpackung",
  "Versand",
  "Geld erhalten",
  "Kundenzufriedenheit anpassen"
];

// DOM-Elemente
const moneyEl = document.getElementById("money");
const satisfactionEl = document.getElementById("satisfaction");
const techLevelEl = document.getElementById("techLevel");
const currentOrderEl = document.getElementById("current-order");
const processStepsEl = document.getElementById("process-steps");
const logEl = document.getElementById("log");

const btnNewOrder = document.getElementById("btn-new-order");
const btnUpgradeMachines = document.getElementById("btn-upgrade-machines");
const btnTrainStaff = document.getElementById("btn-train-staff");
const btnUpgradeLogistics = document.getElementById("btn-upgrade-logistics");

// Hilfsfunktionen
function log(message) {
  const entry = document.createElement("div");
  entry.className = "log-entry";
  const time = new Date().toLocaleTimeString();
  entry.textContent = `[${time}] ${message}`;
  logEl.prepend(entry);
}

function updateStats() {
  moneyEl.textContent = state.money.toFixed(0);
  satisfactionEl.textContent = state.satisfaction.toFixed(0);
  techLevelEl.textContent = state.techLevel;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Aufträge
function generateOrder() {
  if (state.currentOrder) {
    log("Es läuft bereits ein Auftrag.");
    return;
  }

  const base = ORDER_TYPES[randomInt(0, ORDER_TYPES.length - 1)];
  const complexity = randomInt(1, 3);
  const quantity = base.series ? randomInt(20, 100) : randomInt(1, 10);

  const rewardMultiplier =
    1 +
    (complexity - 1) * 0.3 +
    (base.timeLimit ? 0.3 : 0) +
    (base.highQuality ? 0.4 : 0) +
    (base.multiComponent ? 0.5 : 0) +
    (base.series ? 0.2 : 0);

  const timeMultiplier = 1 + (complexity - 1) * 0.3;

  const reward = base.baseReward * rewardMultiplier;
  const baseTime = base.baseTime * timeMultiplier;

  state.currentOrder = {
    id: Date.now(),
    type: base.type,
    complexity,
    quantity,
    reward,
    baseTime,
    timeLimit: base.timeLimit || false,
    highQuality: base.highQuality || false,
    multiComponent: base.multiComponent || false,
    series: base.series || false
  };

  state.currentStepIndex = 0;
  renderCurrentOrder();
  renderProcessSteps();
  log(`Neuer Auftrag: ${base.type}, Menge: ${quantity}, Belohnung: ${reward.toFixed(0)}€`);
}

function renderCurrentOrder() {
  const order = state.currentOrder;
  if (!order) {
    currentOrderEl.innerHTML = "<p>Kein aktiver Auftrag.</p>";
    return;
  }

  currentOrderEl.innerHTML = `
    <p><strong>Typ:</strong> ${order.type}</p>
    <p><strong>Menge:</strong> ${order.quantity}</p>
    <p><strong>Komplexität:</strong> ${order.complexity}</p>
    <p><strong>Belohnung:</strong> ${order.reward.toFixed(0)} €</p>
    <p><strong>Basiszeit:</strong> ${order.baseTime.toFixed(1)} Einheiten</p>
    ${order.timeLimit ? "<p><strong>Besonderheit:</strong> Express (Zeitlimit)</p>" : ""}
    ${order.highQuality ? "<p><strong>Besonderheit:</strong> Hohe Qualitätsanforderung</p>" : ""}
    ${order.multiComponent ? "<p><strong>Besonderheit:</strong> Mehrere Komponenten</p>" : ""}
    ${order.series ? "<p><strong>Besonderheit:</strong> Serienproduktion</p>" : ""}
  `;
}

// Prozess-Schritte
function renderProcessSteps() {
  processStepsEl.innerHTML = "";
  if (!state.currentOrder) {
    processStepsEl.innerHTML = "<p>Kein aktiver Auftrag. Generiere zuerst einen Auftrag.</p>";
    return;
  }

  PROCESS_STEPS.forEach((label, index) => {
    const btn = document.createElement("button");
    btn.className = "step-btn";
    if (index < state.currentStepIndex) btn.classList.add("completed");
    if (index === state.currentStepIndex) btn.classList.add("current");

    btn.disabled = index !== state.currentStepIndex;

    btn.innerHTML = `
      <span class="label">${index + 1}. ${label}</span>
      <span class="status">${
        index < state.currentStepIndex ? "✔" : index === state.currentStepIndex ? "Jetzt ausführen" : ""
      }</span>
    `;

    btn.addEventListener("click", () => handleStep(index));
    processStepsEl.appendChild(btn);
  });
}

function handleStep(index) {
  if (!state.currentOrder) return;
  if (index !== state.currentStepIndex) return;

  const stepName = PROCESS_STEPS[index];
  log(`Schritt gestartet: ${stepName}`);

  // Simulierte Dauer & Fehlerchance basierend auf Upgrades
  const baseDuration = state.currentOrder.baseTime / PROCESS_STEPS.length;
  const speedFactor =
    1 +
    (state.machinesLevel - 1) * 0.15 +
    (state.logisticsLevel - 1) * 0.1 +
    (state.staffLevel - 1) * 0.05;
  const duration = baseDuration / speedFactor;

  const baseErrorChance = 0.12;
  const errorReduction =
    (state.staffLevel - 1) * 0.03 +
    (state.machinesLevel - 1) * 0.02 +
    (state.logisticsLevel - 1) * 0.02;
  const errorChance = Math.max(0.01, baseErrorChance - errorReduction);

  // Kleine "Sim" ohne echte Zeit: wir würfeln nur Ergebnis
  const failed = Math.random() < errorChance && index < PROCESS_STEPS.length - 2;

  if (failed) {
    log(`Fehler in Schritt "${stepName}". Nacharbeit nötig, Zeitverlust.`);
    state.satisfaction = Math.max(0, state.satisfaction - 2);
    // Wiederholung des gleichen Schritts
  } else {
    log(`Schritt abgeschlossen: ${stepName} (Dauer: ${duration.toFixed(1)} Einheiten)`);
    state.currentStepIndex++;

    if (state.currentStepIndex >= PROCESS_STEPS.length) {
      finishOrder();
    } else {
      renderProcessSteps();
    }
  }

  updateStats();
}

function finishOrder() {
  const order = state.currentOrder;
  if (!order) return;

  // Performance-Bewertung
  let performance = 1.0;

  if (order.timeLimit) {
    // Express: zufällige Chance, "zu langsam" zu sein
    if (Math.random() < 0.3) {
      performance -= 0.25;
      log("Express-Zeitlimit knapp verfehlt. Bonus reduziert.");
    }
  }

  if (order.highQuality) {
    // Qualitätsanforderung: abhängig von Staff-Level
    if (state.staffLevel < 2 && Math.random() < 0.4) {
      performance -= 0.3;
      log("Qualitätsanforderung nicht vollständig erfüllt.");
    } else {
      performance += 0.1;
      log("Hohe Qualität geliefert!");
    }
  }

  const finalReward = Math.max(0, order.reward * performance);
  state.money += finalReward;

  // Zufriedenheit anpassen
  const satisfactionDelta = (performance - 1) * 20;
  state.satisfaction = Math.min(100, Math.max(0, state.satisfaction + satisfactionDelta));

  log(
    `Auftrag abgeschlossen. Erhalten: ${finalReward.toFixed(
      0
    )}€. Zufriedenheit: ${state.satisfaction.toFixed(0)}%.`
  );

  state.currentOrder = null;
  state.currentStepIndex = 0;
  renderCurrentOrder();
  renderProcessSteps();
  updateStats();
}

// Upgrades
function upgradeMachines() {
  const cost = 500;
  if (state.money < cost) {
    log("Nicht genug Geld für Maschinen-Upgrade.");
    return;
  }
  state.money -= cost;
  state.machinesLevel++;
  state.techLevel++;
  log(`Maschinen auf Level ${state.machinesLevel} verbessert. Produktion beschleunigt.`);
  updateStats();
}

function trainStaff() {
  const cost = 300;
  if (state.money < cost) {
    log("Nicht genug Geld für Mitarbeiterschulung.");
    return;
  }
  state.money -= cost;
  state.staffLevel++;
  log(`Mitarbeiter auf Level ${state.staffLevel} geschult. Fehlerquote reduziert.`);
  updateStats();
}

function upgradeLogistics() {
  const cost = 400;
  if (state.money < cost) {
    log("Nicht genug Geld für Logistik-Upgrade.");
    return;
  }
  state.money -= cost;
  state.logisticsLevel++;
  log(`Logistik auf Level ${state.logisticsLevel} verbessert. Transportwege optimiert.`);
  updateStats();
}

// Event-Listener
btnNewOrder.addEventListener("click", generateOrder);
btnUpgradeMachines.addEventListener("click", upgradeMachines);
btnTrainStaff.addEventListener("click", trainStaff);
btnUpgradeLogistics.addEventListener("click", upgradeLogistics);

// Initial
updateStats();
renderCurrentOrder();
renderProcessSteps();
log("Willkommen bei Factory Tycoon Lite! Generiere einen Auftrag, um zu starten.");