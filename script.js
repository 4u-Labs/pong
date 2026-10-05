/**
 * PONG RETRO TV 1972 - 4U.IA.BR
 * Complete Game Engine, CRT Audio Synthesizer & TV Hotspot Controls
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const canvas = document.getElementById('pongCanvas');
  const ctx = canvas.getContext('2d');
  const stageWrapper = document.getElementById('stageWrapper');
  const crtScanlines = document.getElementById('crtScanlines');
  const crtOverlay = document.getElementById('crtBeamOverlay');
  const hudOverlay = document.getElementById('screenHudOverlay');
  const hudTitle = document.getElementById('hudTitle');
  const hudSubtitle = document.getElementById('hudSubtitle');
  const hudRestartBtn = document.getElementById('hudRestartBtn');

  // TV Hotspots
  const btnHotspotPower = document.getElementById('hotspotPower');
  const btnHotspotMode = document.getElementById('hotspotMode');
  const btnHotspotSound = document.getElementById('hotspotSound');
  const btnHotspotCrt = document.getElementById('hotspotCrt');
  const btnHotspotPause = document.getElementById('hotspotPause');
  const rotaryChannel = document.getElementById('rotaryChannel');
  const rotaryTuning = document.getElementById('rotaryTuning');

  // Dashboard Controls
  const modeCpuBtn = document.getElementById('modeCpuBtn');
  const modePvpBtn = document.getElementById('modePvpBtn');
  const modeDemoBtn = document.getElementById('modeDemoBtn');
  const btnTogglePause = document.getElementById('btnTogglePause');
  const btnResetGame = document.getElementById('btnResetGame');
  const btnTogglePower = document.getElementById('btnTogglePower');
  const btnToggleSound = document.getElementById('btnToggleSound');
  const btnToggleCrt = document.getElementById('btnToggleCrt');

  // Theme Buttons
  const themeBtns = document.querySelectorAll('[data-theme]');
  const diffBtns = document.querySelectorAll('[data-diff]');

  // Mobile Touch Controls
  const p1UpBtn = document.getElementById('p1UpBtn');
  const p1DownBtn = document.getElementById('p1DownBtn');
  const p2UpBtn = document.getElementById('p2UpBtn');
  const p2DownBtn = document.getElementById('p2DownBtn');
  const p2TouchController = document.getElementById('p2TouchController');

  // Modal Tutorial
  const tutorialModal = document.getElementById('tutorialModal');
  const openTutorialBtn = document.getElementById('openTutorialBtn');
  const closeTutorialBtn = document.getElementById('closeTutorialBtn');

  // --- Audio Synthesizer (Web Audio API) ---
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type, duration, gainLevel = 0.25) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(gainLevel, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Audio play error", e);
    }
  }

  function soundPaddleHit() {
    playTone(490, 'square', 0.08, 0.3);
  }

  function soundWallBounce() {
    playTone(245, 'square', 0.05, 0.2);
  }

  function soundScore() {
    playTone(125, 'square', 0.25, 0.4);
  }

  function soundClick() {
    playTone(1800, 'sine', 0.03, 0.15);
  }

  function soundPower(isOn) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';

      if (isOn) {
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(8000, audioCtx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(4000, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
      }
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  }

  // --- Color Palettes (TV Channels) ---
  const THEMES = {
    classic: {
      id: 'classic',
      name: '1972 P&B Clássico',
      bg: '#08090c',
      p1: '#ffffff',
      p2: '#ffffff',
      ball: '#ffffff',
      net: 'rgba(255, 255, 255, 0.35)',
      text: '#ffffff',
      glow: 'rgba(255, 255, 255, 0.5)',
      stageClass: 'theme-classic'
    },
    green: {
      id: 'green',
      name: 'Fósforo Verde CRT',
      bg: '#040d07',
      p1: '#39ff14',
      p2: '#39ff14',
      ball: '#50fa7b',
      net: 'rgba(57, 255, 20, 0.35)',
      text: '#39ff14',
      glow: 'rgba(57, 255, 20, 0.7)',
      stageClass: ''
    },
    amber: {
      id: 'amber',
      name: 'Fósforo Âmbar',
      bg: '#110b03',
      p1: '#ffaa00',
      p2: '#ffaa00',
      ball: '#ffcc00',
      net: 'rgba(255, 170, 0, 0.35)',
      text: '#ffaa00',
      glow: 'rgba(255, 170, 0, 0.7)',
      stageClass: 'theme-amber'
    },
    neon: {
      id: 'neon',
      name: 'Arcade Neon 80s',
      bg: '#0c0a1a',
      p1: '#00f0ff',
      p2: '#ff007f',
      ball: '#ffe600',
      net: 'rgba(189, 147, 249, 0.35)',
      text: '#f1fa8c',
      glow: 'rgba(0, 240, 255, 0.7)',
      stageClass: 'theme-neon'
    }
  };

  const THEME_KEYS = ['green', 'amber', 'classic', 'neon'];
  let currentThemeIdx = 0;
  let currentTheme = THEMES[THEME_KEYS[currentThemeIdx]];

  // --- Difficulty Settings ---
  const DIFFICULTIES = {
    easy: { name: 'Fácil', ballBaseSpeed: 5.5, maxSpeed: 12, aiSpeed: 0.08, pHeight: 90 },
    normal: { name: 'Normal', ballBaseSpeed: 7, maxSpeed: 15, aiSpeed: 0.13, pHeight: 80 },
    pro: { name: 'Pro', ballBaseSpeed: 8.5, maxSpeed: 19, aiSpeed: 0.22, pHeight: 70 }
  };
  const DIFF_KEYS = ['easy', 'normal', 'pro'];
  let currentDiffIdx = 1; // normal
  let currentDiff = DIFFICULTIES[DIFF_KEYS[currentDiffIdx]];

  // --- Game State ---
  let isTvPowered = true;
  let isPaused = false;
  let isGameOver = false;
  let gameMode = 'cpu'; // 'cpu', 'pvp', 'demo'
  const WINNING_SCORE = 10;

  // Check URL params for mode
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === 'pvp') {
    gameMode = 'pvp';
  } else if (urlParams.get('mode') === 'demo') {
    gameMode = 'demo';
  }

  // Canvas Resolution (Native 4:3 800x600)
  canvas.width = 800;
  canvas.height = 600;

  const PADDLE_WIDTH = 14;
  const BALL_SIZE = 14;

  let player1 = {
    x: 40,
    y: (canvas.height - currentDiff.pHeight) / 2,
    width: PADDLE_WIDTH,
    height: currentDiff.pHeight,
    vy: 0,
    speed: 9,
    score: 0
  };

  let player2 = {
    x: canvas.width - 40 - PADDLE_WIDTH,
    y: (canvas.height - currentDiff.pHeight) / 2,
    width: PADDLE_WIDTH,
    height: currentDiff.pHeight,
    vy: 0,
    speed: 9,
    score: 0
  };

  let ball = {
    x: (canvas.width - BALL_SIZE) / 2,
    y: (canvas.height - BALL_SIZE) / 2,
    size: BALL_SIZE,
    vx: 0,
    vy: 0,
    speed: currentDiff.ballBaseSpeed
  };

  // Spark Particles
  let sparks = [];

  function createSparks(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2.5,
        alpha: 1.0,
        decay: 0.03 + Math.random() * 0.03,
        color: color
      });
    }
  }

  function updateSparks() {
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        sparks.splice(i, 1);
      }
    }
  }

  function drawSparks() {
    ctx.save();
    for (const p of sparks) {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.restore();
  }

  // --- Rotaries visual state ---
  let rotaryChannelAngle = 0;
  let rotaryTuningAngle = 45;

  // --- Input Tracking ---
  const keys = {};

  window.addEventListener('keydown', (e) => {
    initAudio();

    // Impede o scroll da página ao jogar com as setas do teclado
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
    }

    keys[e.key] = true;

    // Shortcuts
    if (e.key === ' ') {
      e.preventDefault();
      togglePause();
    } else if (e.key === 'p' || e.key === 'P' || e.key === 'r' || e.key === 'R') {
      resetGame();
    } else if (e.key === 'm' || e.key === 'M') {
      toggleSound();
    } else if (e.key === 'o' || e.key === 'O') {
      togglePower();
    } else if (e.key === 'c' || e.key === 'C') {
      cycleTheme();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  // Touch on Screen Canvas
  let isTouchingScreen = false;
  canvas.addEventListener('touchstart', handleCanvasTouch, { passive: false });
  canvas.addEventListener('touchmove', handleCanvasTouch, { passive: false });
  canvas.addEventListener('touchend', () => { isTouchingScreen = false; });

  function handleCanvasTouch(e) {
    e.preventDefault();
    initAudio();
    if (!isTvPowered || isPaused || isGameOver) return;

    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const relX = touch.clientX - rect.left;
      const relY = (touch.clientY - rect.top) * scaleY;

      if (relX < rect.width / 2) {
        // Player 1
        player1.y = Math.max(0, Math.min(canvas.height - player1.height, relY - player1.height / 2));
      } else if (gameMode === 'pvp') {
        // Player 2
        player2.y = Math.max(0, Math.min(canvas.height - player2.height, relY - player2.height / 2));
      }
    }
  }

  // --- Game Loop Functions ---
  function serveBall(directionX = 1) {
    ball.x = (canvas.width - ball.size) / 2;
    ball.y = (canvas.height - ball.size) / 2;
    ball.vx = 0;
    ball.vy = 0;
    ball.speed = currentDiff.ballBaseSpeed;

    setTimeout(() => {
      if (isPaused || isGameOver || !isTvPowered) return;
      const angle = (Math.random() * 0.8 - 0.4); // Angle between -0.4 and +0.4 rad
      ball.vx = directionX * ball.speed * Math.cos(angle);
      ball.vy = ball.speed * Math.sin(angle);
    }, 600);
  }

  function update() {
    if (!isTvPowered || isPaused || isGameOver) return;

    // 1. Move Player 1
    if (gameMode === 'demo') {
      // Auto AI for Player 1
      const targetY = ball.y - player1.height / 2 + ball.size / 2;
      player1.y += (targetY - player1.y) * currentDiff.aiSpeed;
    } else {
      if (keys['w'] || keys['W'] || (gameMode === 'cpu' && keys['ArrowUp'])) {
        player1.y -= player1.speed;
      }
      if (keys['s'] || keys['S'] || (gameMode === 'cpu' && keys['ArrowDown'])) {
        player1.y += player1.speed;
      }
    }
    player1.y = Math.max(0, Math.min(canvas.height - player1.height, player1.y));

    // 2. Move Player 2 (CPU or Human)
    if (gameMode === 'cpu' || gameMode === 'demo') {
      // AI Tracking
      let targetY = ball.y - player2.height / 2 + ball.size / 2;
      // Add a slight predictive offset
      if (ball.vx > 0) {
        targetY += (Math.random() - 0.5) * 10;
      }
      player2.y += (targetY - player2.y) * currentDiff.aiSpeed;
    } else {
      // PvP Human Player 2
      if (keys['ArrowUp']) {
        player2.y -= player2.speed;
      }
      if (keys['ArrowDown']) {
        player2.y += player2.speed;
      }
    }
    player2.y = Math.max(0, Math.min(canvas.height - player2.height, player2.y));

    // 3. Move Ball
    if (ball.vx !== 0 || ball.vy !== 0) {
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Top / Bottom Wall Collisions
      if (ball.y <= 0) {
        ball.y = 0;
        ball.vy = Math.abs(ball.vy);
        soundWallBounce();
        createSparks(ball.x + ball.size / 2, 0, currentTheme.ball, 6);
      } else if (ball.y + ball.size >= canvas.height) {
        ball.y = canvas.height - ball.size;
        ball.vy = -Math.abs(ball.vy);
        soundWallBounce();
        createSparks(ball.x + ball.size / 2, canvas.height, currentTheme.ball, 6);
      }

      // Paddle 1 Collision (Left)
      if (ball.vx < 0 &&
          ball.x <= player1.x + player1.width &&
          ball.x + ball.size >= player1.x &&
          ball.y + ball.size >= player1.y &&
          ball.y <= player1.y + player1.height) {

        const hitOffset = (ball.y + ball.size / 2) - (player1.y + player1.height / 2);
        const normalizedHit = hitOffset / (player1.height / 2);
        const maxAngle = Math.PI / 3; // 60 deg
        const bounceAngle = normalizedHit * maxAngle;

        ball.speed = Math.min(ball.speed * 1.04, currentDiff.maxSpeed);
        ball.vx = ball.speed * Math.cos(bounceAngle);
        ball.vy = ball.speed * Math.sin(bounceAngle);
        ball.x = player1.x + player1.width;

        soundPaddleHit();
        createSparks(player1.x + player1.width, ball.y + ball.size / 2, currentTheme.p1, 12);
      }

      // Paddle 2 Collision (Right)
      if (ball.vx > 0 &&
          ball.x + ball.size >= player2.x &&
          ball.x <= player2.x + player2.width &&
          ball.y + ball.size >= player2.y &&
          ball.y <= player2.y + player2.height) {

        const hitOffset = (ball.y + ball.size / 2) - (player2.y + player2.height / 2);
        const normalizedHit = hitOffset / (player2.height / 2);
        const maxAngle = Math.PI / 3; // 60 deg
        const bounceAngle = normalizedHit * maxAngle;

        ball.speed = Math.min(ball.speed * 1.04, currentDiff.maxSpeed);
        ball.vx = -ball.speed * Math.cos(bounceAngle);
        ball.vy = ball.speed * Math.sin(bounceAngle);
        ball.x = player2.x - ball.size;

        soundPaddleHit();
        createSparks(player2.x, ball.y + ball.size / 2, currentTheme.p2, 12);
      }

      // Point Scored
      if (ball.x + ball.size < 0) {
        // Player 2 scores
        player2.score++;
        soundScore();
        createSparks(0, ball.y, currentTheme.p2, 20);
        checkGameOver(2);
      } else if (ball.x > canvas.width) {
        // Player 1 scores
        player1.score++;
        soundScore();
        createSparks(canvas.width, ball.y, currentTheme.p1, 20);
        checkGameOver(1);
      }
    }

    updateSparks();
  }

  function checkGameOver(scorer) {
    if (player1.score >= WINNING_SCORE || player2.score >= WINNING_SCORE) {
      isGameOver = true;
      let winnerText = '';
      if (gameMode === 'cpu') {
        winnerText = player1.score >= WINNING_SCORE ? 'JOGADOR 1 VENCEU!' : 'CPU VENCEU!';
      } else if (gameMode === 'demo') {
        winnerText = player1.score >= WINNING_SCORE ? 'PONG 1 VENCEU!' : 'PONG 2 VENCEU!';
      } else {
        winnerText = player1.score >= WINNING_SCORE ? 'JOGADOR 1 VENCEU!' : 'JOGADOR 2 VENCEU!';
      }
      showHud('FIM DE JOGO', winnerText);
    } else {
      serveBall(scorer === 1 ? -1 : 1);
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = currentTheme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!isTvPowered) return;

    ctx.save();

    // Subtle phosphor glow filter
    ctx.shadowColor = currentTheme.glow;
    ctx.shadowBlur = 10;

    // 1. Center Dashed Line
    ctx.setLineDash([12, 12]);
    ctx.strokeStyle = currentTheme.net;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Scores
    ctx.font = '65px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = currentTheme.text;
    ctx.fillText(player1.score, canvas.width / 4, 85);
    ctx.fillText(player2.score, (canvas.width * 3) / 4, 85);

    // Player Labels
    ctx.font = '12px "Orbitron", sans-serif';
    ctx.fillStyle = currentTheme.net;
    ctx.fillText(gameMode === 'cpu' ? 'PLAYER 1' : (gameMode === 'demo' ? 'DEMO 1' : 'PLAYER 1'), canvas.width / 4, 110);
    ctx.fillText(gameMode === 'cpu' ? 'CPU AI' : (gameMode === 'demo' ? 'DEMO 2' : 'PLAYER 2'), (canvas.width * 3) / 4, 110);

    // 3. Paddles
    ctx.fillStyle = currentTheme.p1;
    ctx.shadowColor = currentTheme.p1;
    ctx.fillRect(player1.x, player1.y, player1.width, player1.height);

    ctx.fillStyle = currentTheme.p2;
    ctx.shadowColor = currentTheme.p2;
    ctx.fillRect(player2.x, player2.y, player2.width, player2.height);

    // 4. Ball
    ctx.fillStyle = currentTheme.ball;
    ctx.shadowColor = currentTheme.ball;
    ctx.shadowBlur = 14;
    ctx.fillRect(ball.x, ball.y, ball.size, ball.size);

    ctx.restore();

    // 5. Sparks
    drawSparks();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // --- Controls & UI Handling ---
  function showHud(title, subtitle) {
    hudTitle.textContent = title;
    hudSubtitle.textContent = subtitle;
    hudOverlay.classList.remove('hidden');
  }

  function hideHud() {
    hudOverlay.classList.add('hidden');
  }

  function togglePause() {
    if (!isTvPowered || isGameOver) return;
    soundClick();
    isPaused = !isPaused;
    if (isPaused) {
      showHud('JOGO PAUSADO', 'Pressione Espaço ou Pause para continuar');
      btnTogglePause.innerHTML = '<span>▶️</span> Continuar';
    } else {
      hideHud();
      btnTogglePause.innerHTML = '<span>⏸️</span> Pausar';
    }
  }

  function resetGame() {
    soundClick();
    isGameOver = false;
    isPaused = false;
    hideHud();
    player1.score = 0;
    player2.score = 0;
    player1.height = currentDiff.pHeight;
    player2.height = currentDiff.pHeight;
    player1.y = (canvas.height - player1.height) / 2;
    player2.y = (canvas.height - player2.height) / 2;
    sparks = [];
    btnTogglePause.innerHTML = '<span>⏸️</span> Pausar';
    serveBall(Math.random() < 0.5 ? -1 : 1);
  }

  function togglePower() {
    soundClick();
    if (isTvPowered) {
      // Turn Off
      soundPower(false);
      stageWrapper.classList.add('anim-power-off');
      setTimeout(() => {
        stageWrapper.classList.remove('anim-power-off');
        stageWrapper.classList.add('tv-off');
        isTvPowered = false;
        btnTogglePower.innerHTML = '<span>📺</span> Ligar TV';
      }, 550);
    } else {
      // Turn On
      soundPower(true);
      stageWrapper.classList.remove('tv-off');
      stageWrapper.classList.add('anim-power-on');
      setTimeout(() => {
        stageWrapper.classList.remove('anim-power-on');
        isTvPowered = true;
        btnTogglePower.innerHTML = '<span>📺</span> Desligar TV';
        resetGame();
      }, 600);
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    soundClick();
    btnToggleSound.innerHTML = soundEnabled ? '<span>🔊</span> Som: Ligado' : '<span>🔇</span> Som: Mudo';
    btnToggleSound.classList.toggle('btn-accent', soundEnabled);
  }

  function toggleCrt() {
    soundClick();
    crtScanlines.classList.toggle('off');
    const isOn = !crtScanlines.classList.contains('off');
    btnToggleCrt.innerHTML = isOn ? '<span>🎲</span> CRT: Ligado' : '<span>🎲</span> CRT: Desligado';
    btnToggleCrt.classList.toggle('btn-accent', isOn);
  }

  function cycleTheme() {
    soundClick();
    currentThemeIdx = (currentThemeIdx + 1) % THEME_KEYS.length;
    setTheme(THEME_KEYS[currentThemeIdx]);

    // Rotate rotary channel knob
    rotaryChannelAngle += 45;
    rotaryChannel.style.transform = `rotate(${rotaryChannelAngle}deg)`;
  }

  function setTheme(themeKey) {
    currentTheme = THEMES[themeKey] || THEMES.green;
    currentThemeIdx = THEME_KEYS.indexOf(themeKey);

    // Update Stage Wrapper background glow class
    stageWrapper.className = 'tv-stage-wrapper';
    if (currentTheme.stageClass) {
      stageWrapper.classList.add(currentTheme.stageClass);
    }
    if (!isTvPowered) {
      stageWrapper.classList.add('tv-off');
    }

    // Update theme pill buttons
    themeBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.theme === themeKey);
    });
  }

  function cycleDiff() {
    soundClick();
    currentDiffIdx = (currentDiffIdx + 1) % DIFF_KEYS.length;
    setDiff(DIFF_KEYS[currentDiffIdx]);

    // Rotate rotary tuning knob
    rotaryTuningAngle += 45;
    rotaryTuning.style.transform = `rotate(${rotaryTuningAngle}deg)`;
  }

  function setDiff(diffKey) {
    currentDiff = DIFFICULTIES[diffKey] || DIFFICULTIES.normal;
    currentDiffIdx = DIFF_KEYS.indexOf(diffKey);

    player1.height = currentDiff.pHeight;
    player2.height = currentDiff.pHeight;

    diffBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.diff === diffKey);
    });
  }

  function setMode(mode) {
    soundClick();
    gameMode = mode;

    modeCpuBtn.classList.toggle('active', mode === 'cpu');
    modePvpBtn.classList.toggle('active', mode === 'pvp');
    modeDemoBtn.classList.toggle('active', mode === 'demo');

    // Show/hide Player 2 touch controls on mobile
    if (p2TouchController) {
      p2TouchController.style.display = mode === 'pvp' ? 'flex' : 'none';
    }

    resetGame();
  }

  // --- Attach Event Listeners ---
  // TV Hotspots
  btnHotspotPower.addEventListener('click', togglePower);
  btnHotspotMode.addEventListener('click', () => {
    setMode(gameMode === 'cpu' ? 'pvp' : 'cpu');
  });
  btnHotspotSound.addEventListener('click', toggleSound);
  btnHotspotCrt.addEventListener('click', toggleCrt);
  btnHotspotPause.addEventListener('click', togglePause);
  rotaryChannel.addEventListener('click', cycleTheme);
  rotaryTuning.addEventListener('click', cycleDiff);

  // Dashboard Buttons
  btnTogglePower.addEventListener('click', togglePower);
  btnTogglePause.addEventListener('click', togglePause);
  btnResetGame.addEventListener('click', resetGame);
  btnToggleSound.addEventListener('click', toggleSound);
  btnToggleCrt.addEventListener('click', toggleCrt);
  hudRestartBtn.addEventListener('click', resetGame);

  modeCpuBtn.addEventListener('click', () => setMode('cpu'));
  modePvpBtn.addEventListener('click', () => setMode('pvp'));
  modeDemoBtn.addEventListener('click', () => setMode('demo'));

  themeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      soundClick();
      setTheme(btn.dataset.theme);
      rotaryChannelAngle += 45;
      rotaryChannel.style.transform = `rotate(${rotaryChannelAngle}deg)`;
    });
  });

  diffBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      soundClick();
      setDiff(btn.dataset.diff);
      rotaryTuningAngle += 45;
      rotaryTuning.style.transform = `rotate(${rotaryTuningAngle}deg)`;
    });
  });

  // Mobile Touch Navigation Buttons
  function setupTouchBtn(btn, onDown, onUp) {
    if (!btn) return;
    const start = (e) => { e.preventDefault(); initAudio(); onDown(); };
    const end = (e) => { e.preventDefault(); onUp(); };
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', end, { passive: false });
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
    btn.addEventListener('mouseleave', end);
  }

  setupTouchBtn(p1UpBtn, () => { keys['w'] = true; }, () => { keys['w'] = false; });
  setupTouchBtn(p1DownBtn, () => { keys['s'] = true; }, () => { keys['s'] = false; });
  setupTouchBtn(p2UpBtn, () => { keys['ArrowUp'] = true; }, () => { keys['ArrowUp'] = false; });
  setupTouchBtn(p2DownBtn, () => { keys['ArrowDown'] = true; }, () => { keys['ArrowDown'] = false; });

  // Modal Tutorial Handlers
  openTutorialBtn.addEventListener('click', () => {
    soundClick();
    tutorialModal.classList.add('active');
  });

  closeTutorialBtn.addEventListener('click', () => {
    soundClick();
    tutorialModal.classList.remove('active');
  });

  tutorialModal.addEventListener('click', (e) => {
    if (e.target === tutorialModal) {
      tutorialModal.classList.remove('active');
    }
  });

  // Start with selected theme
  setTheme('green');
  setDiff('normal');
  setMode(gameMode);

  // Kick off ball & game loop
  serveBall(1);
  loop();
});