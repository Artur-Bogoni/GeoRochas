 "use strict";

/* =========================================================
   ORANGE COSMOS
   Jogo espacial de geologia
   HTML: index.html
   CSS: style.css
   JavaScript: script.js
   ========================================================= */

// =========================================================
// 1. ELEMENTOS DO HTML
// =========================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const $ = (id) => document.getElementById(id);

const screens = {
    menu: $("menuScreen"),
    how: $("howScreen"),
    encyclopedia: $("encyclopediaScreen"),
    settings: $("settingsScreen"),
    pause: $("pauseScreen"),
    gameOver: $("gameOverScreen")
};

const scoreElement = $("score");
const highScoreElement = $("highScore");
const waveElement = $("wave");
const livesElement = $("lives");
const toastStack = $("toastStack");

// Botões dos menus
const startBtn = $("startBtn");
const howBtn = $("howBtn");
const encyclopediaBtn = $("encyclopediaBtn");
const settingsBtn = $("settingsBtn");

const resumeBtn = $("resumeBtn");
const pauseMenuBtn = $("pauseMenuBtn");
const restartBtn = $("restartBtn");
const gameOverMenuBtn = $("gameOverMenuBtn");

// Configurações
const soundToggle = $("soundToggle");
const soundSetting = $("soundSetting");
const shakeSetting = $("shakeSetting");
const volumeSetting = $("volumeSetting");

// =========================================================
// 2. ESTADO DO JOGO
// =========================================================

let W = 800;
let H = 500;

let running = false;
let gameStarted = false;
let gameOver = false;

let score = 0;
let destroyed = 0;
let wave = 1;
let lives = 3;

let highScore =
    Number(localStorage.getItem("orangeCosmosRecord")) || 0;

let rocks = [];
let bullets = [];
let particles = [];
let stars = [];

let lastTime = 0;
let shakeTime = 0;
let shakeStrength = 0;
let invulnerableTime = 0;

let soundEnabled = true;
let shakeEnabled = true;
let volume = 0.5;

let audioContext = null;

const keys = Object.create(null);
const mobileHeld = new Set();

const rockStats = {
    ignea: 0,
    sedimentar: 0,
    metamorfica: 0
};

// =========================================================
// 3. TIPOS DE ROCHAS
// =========================================================

 
const rockTypes = [
    // ROCHAS ÍGNEAS (MAGMÁTICAS)
    {
        type: "ignea",
        name: "Basalto",
        color: "#ff7846",
        description: "Rocha ígnea vulcânica, formada pelo rápido resfriamento da lava."
    },
    {
        type: "ignea",
        name: "Granito",
        color: "#ff9f68",
        description: "Rocha ígnea plutônica, formada pelo resfriamento lento do magma."
    },
    {
        type: "ignea",
        name: "Obsidiana",
        color: "#ff5722",
        description: "Vidro vulcânico natural formado pelo rápido resfriamento da lava."
    },
    {
        type: "ignea",
        name: "Pedra-pomes",
        color: "#ffb07c",
        description: "Rocha vulcânica muito porosa, formada durante erupções."
    },

    // ROCHAS SEDIMENTARES
    {
        type: "sedimentar",
        name: "Arenito",
        color: "#ffd166",
        description: "Rocha sedimentar formada principalmente por grãos de areia compactados e cimentados."
    },
    {
        type: "sedimentar",
        name: "Calcário",
        color: "#f4d58d",
        description: "Rocha sedimentar composta principalmente por carbonato de cálcio."
    },
    {
        type: "sedimentar",
        name: "Conglomerado",
        color: "#e9c46a",
        description: "Rocha sedimentar composta por fragmentos arredondados unidos por uma matriz ou cimento."
    },
    {
        type: "sedimentar",
        name: "Folhelho",
        color: "#d9b86c",
        description: "Rocha sedimentar formada por partículas muito finas, geralmente depositadas em camadas."
    },

    // ROCHAS METAMÓRFICAS
    {
        type: "metamorfica",
        name: "Gnaisse",
        color: "#c084fc",
        description: "Rocha metamórfica com faixas claras e escuras, formada sob altas temperaturas e pressões."
    },
    {
        type: "metamorfica",
        name: "Mármore",
        color: "#e0b0ff",
        description: "Rocha metamórfica formada principalmente pela transformação do calcário ou dolomito."
    },
    {
        type: "metamorfica",
        name: "Quartzito",
        color: "#b794f4",
        description: "Rocha metamórfica rica em quartzo, geralmente formada a partir do arenito."
    },
    {
        type: "metamorfica",
        name: "Ardósia",
        color: "#9f86c0",
        description: "Rocha metamórfica de grão fino, que pode se separar em placas."
    }
];

// =========================================================
// 4. PODERES
// =========================================================

const powerState = {
    solar: {
        cooldown: 0,
        maxCooldown: 12
    },

    shield: {
        cooldown: 0,
        duration: 0,
        maxCooldown: 15
    },

    inferno: {
        cooldown: 0,
        duration: 0,
        maxCooldown: 18
    }
};

const powerButtons = {
    solar: {
        button: $("solarPower"),
        cooldown: $("solarCooldown"),
        bar: $("solarBar")
    },

    shield: {
        button: $("shieldPower"),
        cooldown: $("shieldCooldown"),
        bar: $("shieldBar")
    },

    inferno: {
        button: $("infernoPower"),
        cooldown: $("infernoCooldown"),
        bar: $("infernoBar")
    }
};

// =========================================================
// 5. FUNÇÕES AUXILIARES
// =========================================================

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function wrapPosition(object) {
    if (object.x < 0) object.x = W;
    if (object.x > W) object.x = 0;

    if (object.y < 0) object.y = H;
    if (object.y > H) object.y = 0;
}

// =========================================================
// 6. CONTROLE DAS TELAS
// =========================================================

function showScreen(screenToShow) {
    Object.values(screens).forEach((screen) => {
        if (!screen) return;

        screen.classList.remove("active", "visible", "show");
        screen.style.display = "none";
        screen.setAttribute("aria-hidden", "true");
    });

    if (screenToShow) {
        screenToShow.classList.add("active");
        screenToShow.style.display = "flex";
        screenToShow.setAttribute("aria-hidden", "false");
    }
}

function showMainMenu() {
    running = false;
    gameStarted = false;
    gameOver = false;

    showScreen(screens.menu);
    clearToasts();
    updateHUD();
}

function openScreen(screen) {
    running = false;
    showScreen(screen);
    updatePowerUI();
}

function closeCurrentScreen() {
    if (gameStarted && !gameOver) {
        running = true;
        lastTime = performance.now();
        showScreen(null);
    } else {
        showMainMenu();
    }

    updatePowerUI();
}

// =========================================================
// 7. BOTÕES DO MENU
// =========================================================

if (startBtn) {
    startBtn.addEventListener("click", startGame);
}

if (howBtn) {
    howBtn.addEventListener("click", () => {
        openScreen(screens.how);
    });
}

if (encyclopediaBtn) {
    encyclopediaBtn.addEventListener("click", () => {
        openScreen(screens.encyclopedia);
    });
}

if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
        openScreen(screens.settings);
    });
}

if (resumeBtn) {
    resumeBtn.addEventListener("click", resumeGame);
}

if (pauseMenuBtn) {
    pauseMenuBtn.addEventListener("click", showMainMenu);
}

if (restartBtn) {
    restartBtn.addEventListener("click", startGame);
}

if (gameOverMenuBtn) {
    gameOverMenuBtn.addEventListener("click", showMainMenu);
}

document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", closeCurrentScreen);
});

// =========================================================
// 8. CONFIGURAÇÕES
// =========================================================

if (soundToggle) {
    soundToggle.addEventListener("click", () => {
        soundEnabled = !soundEnabled;

        soundToggle.textContent = soundEnabled ? "🔊" : "🔇";

        if (soundSetting) {
            soundSetting.checked = soundEnabled;
        }
    });
}

if (soundSetting) {
    soundSetting.addEventListener("change", () => {
        soundEnabled = soundSetting.checked;

        if (soundToggle) {
            soundToggle.textContent = soundEnabled ? "🔊" : "🔇";
        }
    });
}

if (shakeSetting) {
    shakeSetting.addEventListener("change", () => {
        shakeEnabled = shakeSetting.checked;
    });
}

if (volumeSetting) {
    volume = Number(volumeSetting.value) / 100;

    volumeSetting.addEventListener("input", () => {
        volume = Number(volumeSetting.value) / 100;
    });
}

// =========================================================
// 9. EFEITOS SONOROS
// =========================================================

function playTone(frequency = 440, duration = 0.08, type = "sine") {
    if (!soundEnabled || volume <= 0) return;

    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(
            Math.max(0.001, volume * 0.12),
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
        console.warn("O áudio não está disponível.", error);
    }
}

// =========================================================
// 10. TAMANHO DO CANVAS
// =========================================================

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
        W = 800;
        H = 500;
    } else {
        W = Math.max(320, rect.width);
        H = Math.max(240, rect.height);
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ship.x = clamp(ship.x || W / 2, 20, W - 20);
    ship.y = clamp(ship.y || H / 2, 20, H - 20);

    createStars();
}

window.addEventListener("resize", resizeCanvas);

// =========================================================
// 11. ESTRELAS DO ESPAÇO
// =========================================================

function createStars() {
    stars = [];

    const amount = Math.floor((W * H) / 3500);

    for (let i = 0; i < amount; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: random(0.5, 2),
            alpha: random(0.3, 0.9),
            speed: random(0.5, 2)
        });
    }
}

function drawStars() {
    for (const star of stars) {
        star.alpha =
            0.5 + Math.sin(performance.now() * 0.001 * star.speed) * 0.3;

        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = "#ffffff";

        ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    ctx.globalAlpha = 1;
}

// =========================================================
// 12. NAVE DO JOGADOR
// =========================================================

const ship = {
    x: 0,
    y: 0,
    angle: -Math.PI / 2,
    vx: 0,
    vy: 0,
    radius: 13,
    shootingTimer: 0
};

function drawShip() {
    ctx.save();

    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    // Escudo ativo.
    if (powerState.shield.duration > 0) {
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);

        ctx.strokeStyle = "#48d9ff";
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#48d9ff";

        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Efeito de invulnerabilidade após uma colisão.
    if (
        invulnerableTime > 0 &&
        Math.floor(performance.now() / 100) % 2 === 0
    ) {
        ctx.globalAlpha = 0.35;
    }

    // Propulsão.
    if (
        keys.ArrowUp ||
        keys.KeyW ||
        mobileHeld.has("thrust")
    ) {
        ctx.beginPath();

        ctx.moveTo(-7, -5);
        ctx.lineTo(-random(17, 27), 0);
        ctx.lineTo(-7, 5);

        ctx.closePath();

        ctx.fillStyle = "#ff8c42";
        ctx.fill();
    }

    // Corpo da nave.
    ctx.beginPath();

    ctx.moveTo(18, 0);
    ctx.lineTo(-11, -10);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-11, 10);

    ctx.closePath();

    ctx.fillStyle = "#fff2d5";
    ctx.fill();

    ctx.strokeStyle = "#ff8c42";
        ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
}

// =========================================================
// 13. CRIAR ROCHAS
// =========================================================

function createRock(x, y, size, typeIndex, level = 0) {
    const type = rockTypes[typeIndex];

    const vertices = [];
    const sides = randomInt(8, 12);

    for (let i = 0; i < sides; i++) {
        vertices.push(random(0.75, 1.2));
    }

    const angle = random(0, Math.PI * 2);
    const speed = random(30, 70) + wave * 2;

    return {
        x,
        y,
        size,
        radius: size,
        typeIndex,
        type: type.type,
        name: type.name,
        color: type.color,
        description: type.description,
        vertices,
        angle,
        rotation: random(-1.2, 1.2),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        level,
        points: Math.max(10, Math.round(100 / (level + 1)))
    };
}

// =========================================================
// 14. CRIAR UMA ONDA
// =========================================================

function spawnWave() {
    const amount = Math.min(3 + wave, 10);

    for (let i = 0; i < amount; i++) {
        let x = 0;
        let y = 0;
        let attempts = 0;

        do {
            x = random(0, W);
            y = random(0, H);
            attempts++;
        } while (
            distance(x, y, ship.x, ship.y) < 130 &&
            attempts < 40
        );

        rocks.push(
            createRock(
                x,
                y,
                random(28, 45),
                randomInt(0, rockTypes.length - 1)
            )
        );
    }

    if (waveElement) {
        waveElement.textContent = wave;
    }

    const waveAlert = $("waveAlert");

    if (waveAlert) {
        waveAlert.textContent = `ONDA ${wave}`;
        waveAlert.classList.add("show");

        setTimeout(() => {
            waveAlert.classList.remove("show");
        }, 1300);
    }

    playTone(600, 0.15, "triangle");
}

// =========================================================
// 15. DESENHAR AS ROCHAS E SEUS NOMES
// =========================================================

function drawRock(rock) {
    ctx.save();

    ctx.translate(rock.x, rock.y);
    ctx.rotate(rock.angle);

    ctx.shadowBlur = 9;
    ctx.shadowColor = rock.color;

    ctx.beginPath();

    for (let i = 0; i < rock.vertices.length; i++) {
        const angle = (i / rock.vertices.length) * Math.PI * 2;
        const radius = rock.size * rock.vertices[i];

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.closePath();

    ctx.fillStyle = "#201b25";
    ctx.fill();

    ctx.strokeStyle = rock.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Detalhes da superfície.
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = rock.color;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(-rock.size * 0.35, -rock.size * 0.1);
    ctx.lineTo(-rock.size * 0.05, -rock.size * 0.35);
    ctx.lineTo(rock.size * 0.28, -rock.size * 0.08);
    ctx.stroke();

    ctx.restore();

    // Nome da rocha fica abaixo dela.
    // Como é desenhado separadamente, o texto não gira junto com a rocha.
    ctx.save();

    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const labelY = rock.y + rock.size + 7;
    const label = rock.name.toUpperCase();

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#09070d";
    ctx.strokeText(label, rock.x, labelY);

    ctx.fillStyle = rock.color;
    ctx.fillText(label, rock.x, labelY);

    ctx.restore();
    ctx.globalAlpha = 1;
}

// =========================================================
// 16. DISPARAR
// =========================================================

function shoot() {
    if (!running) return;

    const infernoActive = powerState.inferno.duration > 0;

    const speed = 470;

    bullets.push({
        x: ship.x + Math.cos(ship.angle) * 17,
        y: ship.y + Math.sin(ship.angle) * 17,
        vx: ship.vx + Math.cos(ship.angle) * speed,
        vy: ship.vy + Math.sin(ship.angle) * speed,
        life: 1.1,
        radius: infernoActive ? 4 : 3,
        color: infernoActive ? "#ff542e" : "#ffd166"
    });

    playTone(infernoActive ? 720 : 540, 0.04, "square");
}

function drawBullets() {
    for (const bullet of bullets) {
        ctx.save();

        ctx.shadowBlur = 12;
        ctx.shadowColor = bullet.color;
        ctx.fillStyle = bullet.color;

        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// =========================================================
// 17. EXPLOSÕES
// =========================================================

function createExplosion(x, y, color, amount = 14) {
    for (let i = 0; i < amount; i++) {
        const angle = random(0, Math.PI * 2);
        const speed = random(35, 180);

        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: random(0.25, 0.7),
            maxLife: 0.7,
            size: random(1.5, 4),
            color
        });
    }

    if (shakeEnabled) {
        shakeTime = 0.12;
        shakeStrength = 3;
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.life -= dt;

        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    for (const particle of particles) {
        ctx.globalAlpha = clamp(
            particle.life / particle.maxLife,
            0,
            1
        );

        ctx.fillStyle = particle.color;

        ctx.beginPath();
        ctx.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    ctx.globalAlpha = 1;
}

// =========================================================
// 18. DESCRIÇÃO DA ROCHA DESTRUÍDA
// =========================================================

function showRockDescription(rock) {
    if (!toastStack) return;

    const toast = document.createElement("div");

    toast.className = `toast ${rock.type}`;

    const title = document.createElement("strong");
    title.textContent = rock.name;

    const description = document.createElement("span");
    description.textContent = rock.description;

    toast.appendChild(title);
    toast.appendChild(description);

    toastStack.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 350);
    }, 4500);

    while (toastStack.children.length > 3) {
        toastStack.firstElementChild.remove();
    }
}

function clearToasts() {
    if (toastStack) {
        toastStack.innerHTML = "";
    }
}

// =========================================================
// 19. DESTRUIR UMA ROCHA
// =========================================================

function destroyRock(index, allowSplit = true) {
    const rock = rocks[index];

    if (!rock) return;

    rocks.splice(index, 1);

    score += rock.points;
    destroyed++;

    rockStats[rock.type]++;

    createExplosion(rock.x, rock.y, rock.color, 18);
    showRockDescription(rock);

    playTone(
        rock.typeIndex === 0 ? 180 :
        rock.typeIndex === 1 ? 260 : 340,
        0.1
    );

    // Rochas grandes se dividem em duas menores.
    if (allowSplit && rock.size > 23 && rock.level < 2) {
        for (let i = 0; i < 2; i++) {
            rocks.push(
                createRock(
                    rock.x + random(-8, 8),
                    rock.y + random(-8, 8),
                    rock.size * 0.55,
                    rock.typeIndex,
                    rock.level + 1
                )
            );
        }
    }

    updateHUD();

    // A próxima onda começa apenas quando todas as rochas acabarem.
    if (rocks.length === 0 && running && !gameOver) {
        wave++;
        spawnWave();
        updateHUD();
    }
}

// =========================================================
// 20. PODER SOLAR
// Destrói as rochas existentes e dá pontos.
// =========================================================

function activateSolar() {
    const power = powerState.solar;

    if (!running || power.cooldown > 0) return;

    power.cooldown = power.maxCooldown;

    const rocksToDestroy = [...rocks];

    // Remove todas as rochas sem criar fragmentos.
    rocks = [];

    for (const rock of rocksToDestroy) {
        score += rock.points * 2;
        destroyed++;

        rockStats[rock.type]++;

        createExplosion(rock.x, rock.y, "#ffb703", 16);
        showRockDescription(rock);
    }

    // Efeito visual da explosão solar.
    particles.push({
        x: ship.x,
        y: ship.y,
        vx: 0,
        vy: 0,
        life: 0.4,
        maxLife: 0.4,
        size: 80,
        color: "#ffb703"
    });

    playTone(900, 0.3, "sawtooth");

    // A próxima onda só é criada uma vez.
    if (rocks.length === 0 && running && !gameOver) {
        wave++;
        spawnWave();
    }

    updateHUD();
    updatePowerUI();
}

// =========================================================
// 21. PODER ESCUDO
// Protege a nave por cinco segundos.
// =========================================================

function activateShield() {
    const power = powerState.shield;

    if (!running || power.cooldown > 0) return;

    power.cooldown = power.maxCooldown;
    power.duration = 5;

    playTone(660, 0.2, "triangle");

    updatePowerUI();
}

// =========================================================
// 22. PODER INFERNO
// Aumenta a velocidade de disparo por cinco segundos.
// =========================================================

function activateInferno() {
    const power = powerState.inferno;

    if (!running || power.cooldown > 0) return;

    power.cooldown = power.maxCooldown;
    power.duration = 5;

    playTone(350, 0.3, "sawtooth");

    updatePowerUI();
}

// =========================================================
// 23. LIGAÇÃO DOS BOTÕES DOS PODERES
// =========================================================

const powerFunctions = {
    solar: activateSolar,
    shield: activateShield,
    inferno: activateInferno
};

function activatePower(name) {
    const activate = powerFunctions[name];

    if (!activate) {
        console.error("Poder não encontrado:", name);
        return;
    }

    if (!running) {
        console.log("Inicie o jogo antes de usar os poderes.");
        return;
    }

    activate();
    updatePowerUI();
}

// Liga os botões que têm data-power.
document.querySelectorAll("[data-power]").forEach((button) => {
    button.addEventListener("click", (event) => {
        event.preventDefault();
        activatePower(button.dataset.power);
    });
});

// Também suporta os IDs dos botões, mesmo sem data-power.
for (const name of ["solar", "shield", "inferno"]) {
    const button = powerButtons[name].button;

    if (!button) continue;

    if (!button.hasAttribute("data-power")) {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            activatePower(name);
        });
    }
}

// =========================================================
// 24. ATUALIZAÇÃO VISUAL DOS PODERES
// =========================================================

function updatePowerUI() {
    for (const [name, power] of Object.entries(powerState)) {
        const elements = powerButtons[name];

        if (!elements) continue;

        const ready = power.cooldown <= 0;

        // Mantém o botão clicável. O poder verifica a recarga.
        if (elements.button) {
            elements.button.disabled = false;

            elements.button.classList.toggle("ready", ready);
            elements.button.classList.toggle("cooling", !ready);
        }

        if (elements.cooldown) {
            if (!gameStarted) {
                elements.cooldown.textContent = "INICIE O JOGO";
            } else if (gameOver) {
                elements.cooldown.textContent = "FIM DE JOGO";
            } else if (!running) {
                elements.cooldown.textContent = "PAUSADO";
            } else if (ready) {
                elements.cooldown.textContent = "PRONTO";
            } else {
                elements.cooldown.textContent =
                    `${Math.ceil(power.cooldown)}s`;
            }
        }

        if (elements.bar) {
            const progress = 1 - power.cooldown / power.maxCooldown;

            elements.bar.style.width =
                `${clamp(progress, 0, 1) * 100}%`;
        }
    }
}

// =========================================================
// 25. ATUALIZAR HUD
// =========================================================
function saveHighScore() {
    const record = getHighScore();

    if (score > record) {
        localStorage.setItem(
            "orangeCosmosRecord",
            String(score)
        );
    }

    updateHUD();
}
function getHighScore() {
    return Number(localStorage.getItem("orangeCosmosRecord")) || 0;
}

function updateHUD() {
    if (scoreElement) {
        scoreElement.textContent = score;
    }

    if (highScoreElement) {
        highScoreElement.textContent = getHighScore();
    }

    if (waveElement) {
        waveElement.textContent = wave;
    }

    if (livesElement) {
        livesElement.textContent = lives;
    }

    const menuRecord = $("menuRecord");

    if (menuRecord) {
        menuRecord.textContent = getHighScore();
    }

    updatePowerUI();
}

// =========================================================
// 26. INICIAR O JOGO
// =========================================================

function startGame() {
    score = 0;
    destroyed = 0;
    wave = 1;
    lives = 3;

    rockStats.ignea = 0;
    rockStats.sedimentar = 0;
    rockStats.metamorfica = 0;

    rocks = [];
    bullets = [];
    particles = [];

    shakeTime = 0;
    shakeStrength = 0;
    invulnerableTime = 2;

    for (const power of Object.values(powerState)) {
        power.cooldown = 0;

        if ("duration" in power) {
            power.duration = 0;
        }
    }

    ship.x = W / 2;
    ship.y = H / 2;
    ship.angle = -Math.PI / 2;
    ship.vx = 0;
    ship.vy = 0;
    ship.shootingTimer = 0;

    gameOver = false;
    gameStarted = true;
    running = true;

    clearToasts();
    showScreen(null);

    spawnWave();
    updateHUD();

    lastTime = performance.now();
}

// =========================================================
// 27. PAUSAR E RETOMAR
// =========================================================

function pauseGame() {
    if (!running || gameOver) return;

    running = false;

    showScreen(screens.pause);
    updatePowerUI();
}

function resumeGame() {
    if (!gameStarted || gameOver) return;

    running = true;

    showScreen(null);
    lastTime = performance.now();

    updatePowerUI();
}

function togglePause() {
    if (!gameStarted || gameOver) return;

    if (running) {
        pauseGame();
    } else if (
        screens.pause &&
        screens.pause.style.display !== "none"
    ) {
        resumeGame();
    }
}

// =========================================================
// 28. CONTROLES DO TECLADO
// =========================================================

window.addEventListener("keydown", (event) => {
    keys[event.code] = true;

    // Impede que as teclas de movimento rolem a página.
    if (
        [
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "Space"
        ].includes(event.code)
    ) {
        event.preventDefault();
    }

    // Pausar/retomar.
    if (event.code === "Escape" || event.code === "KeyP") {
        togglePause();
        return;
    }

    // Poderes: funciona com a fileira superior e com o teclado numérico.
    // Usamos apenas este ponto para evitar ativar cada poder duas vezes.
    const powerKeys = {
        Digit1: "solar",
        Numpad1: "solar",
        Digit2: "shield",
        Numpad2: "shield",
        Digit3: "inferno",
        Numpad3: "inferno"
    };

    const powerName = powerKeys[event.code];

    if (powerName) {
        event.preventDefault();

        if (!event.repeat && running) {
            activatePower(powerName);
        }
        return;
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.code] = false;
});

window.addEventListener("blur", () => {
    for (const key of Object.keys(keys)) {
        keys[key] = false;
    }

    mobileHeld.clear();
});

// =========================================================
// 29. CONTROLES DE CELULAR
// =========================================================

document.querySelectorAll("[data-hold]").forEach((button) => {
    const control = button.dataset.hold;

    button.addEventListener("pointerdown", (event) => {
        event.preventDefault();

        if (control === "fire") {
            if (running) shoot();
        } else {
            mobileHeld.add(control);
        }
    });

    const release = (event) => {
        event.preventDefault();
        mobileHeld.delete(control);
    };

    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
    button.addEventListener("contextmenu", (event) => {
        event.preventDefault();
    });
});

// =========================================================
// 30. MOVIMENTAR A NAVE
// =========================================================

function updateShip(dt) {
    const left =
        keys.ArrowLeft ||
        keys.KeyA ||
        mobileHeld.has("left");

    const right =
        keys.ArrowRight ||
        keys.KeyD ||
        mobileHeld.has("right");

    const thrust =
        keys.ArrowUp ||
        keys.KeyW ||
        mobileHeld.has("thrust");

    if (left) {
        ship.angle -= 3.6 * dt;
    }

    if (right) {
        ship.angle += 3.6 * dt;
    }

    if (thrust) {
        const acceleration = 220;

        ship.vx += Math.cos(ship.angle) * acceleration * dt;
        ship.vy += Math.sin(ship.angle) * acceleration * dt;

        if (Math.random() < 0.35) {
            particles.push({
                x: ship.x - Math.cos(ship.angle) * 10,
                y: ship.y - Math.sin(ship.angle) * 10,
                vx: -Math.cos(ship.angle) * random(30, 90),
                vy: -Math.sin(ship.angle) * random(30, 90),
                life: 0.2,
                maxLife: 0.2,
                size: random(1, 3),
                color: "#ff9f43"
            });
        }
    }

    ship.vx *= Math.pow(0.985, dt * 60);
    ship.vy *= Math.pow(0.985, dt * 60);

    const speed = Math.hypot(ship.vx, ship.vy);
    const maxSpeed = 320;

    if (speed > maxSpeed) {
        ship.vx = (ship.vx / speed) * maxSpeed;
        ship.vy = (ship.vy / speed) * maxSpeed;
    }

    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    wrapPosition(ship);

    if (invulnerableTime > 0) {
        invulnerableTime = Math.max(0, invulnerableTime - dt);
    }

    // Disparo contínuo enquanto a tecla Espaço estiver pressionada.
    ship.shootingTimer -= dt;

    if (keys.Space || mobileHeld.has("fire")) {
        const interval =
            powerState.inferno.duration > 0 ? 0.09 : 0.22;

        if (ship.shootingTimer <= 0) {
            shoot();
            ship.shootingTimer = interval;
        }
    }
}

// =========================================================
// 31. MOVIMENTAR AS ROCHAS
// =========================================================

function updateRocks(dt) {
    for (const rock of rocks) {
        rock.x += rock.vx * dt;
        rock.y += rock.vy * dt;
        rock.angle += rock.rotation * dt;

        wrapPosition(rock);
    }
}

// =========================================================
// 32. MOVIMENTAR OS TIROS
// =========================================================

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.life -= dt;

        wrapPosition(bullet);

        if (bullet.life <= 0) {
            bullets.splice(i, 1);
        }
    }
}

// =========================================================
// 33. COLISÕES DOS TIROS
// =========================================================

function checkBulletCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        let hit = false;

        for (let j = rocks.length - 1; j >= 0; j--) {
            const rock = rocks[j];

            if (
                distance(
                    bullet.x,
                    bullet.y,
                    rock.x,
                    rock.y
                ) < rock.radius + bullet.radius
            ) {
                destroyRock(j);
                hit = true;
                break;
            }
        }

        if (hit) {
            bullets.splice(i, 1);
        }
    }
}

// =========================================================
// 34. COLISÕES DA NAVE
// =========================================================

function checkShipCollisions() {
    if (invulnerableTime > 0) return;
    if (powerState.shield.duration > 0) return;

    for (let i = rocks.length - 1; i >= 0; i--) {
        const rock = rocks[i];

        if (
            distance(ship.x, ship.y, rock.x, rock.y) <
            ship.radius + rock.radius * 0.75
        ) {
            rocks.splice(i, 1);

            createExplosion(ship.x, ship.y, "#ff6b35", 28);

            lives--;

            // Atualiza as vidas imediatamente.
            updateHUD();

            playTone(120, 0.3, "sawtooth");

            if (lives <= 0) {
                endGame();
                return;
            }

            // Reposiciona a nave após perder uma vida.
            ship.x = W / 2;
            ship.y = H / 2;
            ship.vx = 0;
            ship.vy = 0;

            invulnerableTime = 2.2;

            return;
        }
    }
}

// =========================================================
// 35. ATUALIZAR PODERES
// =========================================================

function updatePowers(dt) {
    for (const power of Object.values(powerState)) {
        if (power.cooldown > 0) {
            power.cooldown = Math.max(0, power.cooldown - dt);
        }

        if (power.duration > 0) {
            power.duration = Math.max(0, power.duration - dt);
        }
    }

    updatePowerUI();
}

// =========================================================
// 36. FIM DE JOGO
// =========================================================

function endGame() {
    running = false;
    gameOver = true;

    saveHighScore();

    if ($("finalScore")) {
        $("finalScore").textContent = score;
    }

    if ($("totalDestroyed")) {
        $("totalDestroyed").textContent = destroyed;
    }

    if ($("countIgnea")) {
        $("countIgnea").textContent = rockStats.ignea;
    }

    if ($("countSed")) {
        $("countSed").textContent = rockStats.sedimentar;
    }

    if ($("countMeta")) {
        $("countMeta").textContent = rockStats.metamorfica;
    }

    if ($("finalWave")) {
        $("finalWave").textContent = wave;
    }

    if ($("finalRecord")) {
        $("finalRecord").textContent = getHighScore();
    }

    showScreen(screens.gameOver);
    updatePowerUI();

    playTone(100, 0.5, "sawtooth");
}

// =========================================================
// 37. DESENHAR O FUNDO
// =========================================================

function drawBackground() {
    ctx.clearRect(0, 0, W, H);

    const gradient = ctx.createRadialGradient(
        W / 2,
        H / 2,
        0,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.8
    );

    gradient.addColorStop(0, "#17101f");
    gradient.addColorStop(0.55, "#0c0a15");
    gradient.addColorStop(1, "#05040a");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    drawStars();
}

// =========================================================
// 38. DESENHAR TUDO
// =========================================================

function render() {
    ctx.save();

    if (shakeTime > 0 && shakeEnabled) {
        ctx.translate(
            random(-shakeStrength, shakeStrength),
            random(-shakeStrength, shakeStrength)
        );
    }

    drawBackground();

    for (const rock of rocks) {
        drawRock(rock);
    }

    drawBullets();
    drawParticles();

    if (gameStarted && !gameOver) {
        drawShip();
    }

    ctx.restore();
}

// =========================================================
// 39. LOOP PRINCIPAL
// =========================================================

function gameLoop(timestamp) {
    const dt = Math.min(
        Math.max((timestamp - lastTime) / 1000, 0),
        0.033
    );

    lastTime = timestamp;

    if (running) {
        updateShip(dt);
        updateRocks(dt);
        updateBullets(dt);
        updateParticles(dt);
        updatePowers(dt);

        checkBulletCollisions();
        checkShipCollisions();

        if (shakeTime > 0) {
            shakeTime = Math.max(0, shakeTime - dt);
        }
    } else {
        updateParticles(dt);
    }

    render();

    requestAnimationFrame(gameLoop);
}

// =========================================================
// 40. INICIALIZAÇÃO
// =========================================================

function initializeGame() {
    resizeCanvas();

    ship.x = W / 2;
    ship.y = H / 2;

    updateHUD();
    showMainMenu();

    lastTime = performance.now();

    requestAnimationFrame(gameLoop);
}

initializeGame();