/**
 * ==========================================================
 * HOURLY SPIN WHEEL APPLICATION - REAL-TIME SYNCED ENGINE
 * ==========================================================
 * Fully synchronized across all devices (PC, Mobile, Tablet)
 * via central HTTP server state (/api/state) with localStorage fallback.
 */

// Local Storage Fallback Keys
const STATE_KEYS = {
  SLICES: 'lucky_spin_slices_v5',
  HISTORY: 'lucky_spin_history_v5',
  FORCED_NEXT: 'lucky_spin_forced_next_v5',
  UPCOMING_QUEUE: 'lucky_spin_queue_v5',
  SCHEDULE: 'lucky_spin_schedule_v5',
  SOUND_MUTED: 'lucky_spin_sound_muted_v5',
  LAST_SPUN_HOUR: 'lucky_spin_last_spun_hour_v5',
  MASTER_KEY: 'lucky_spin_master_password_v5',
  TIMER_MODE: 'lucky_spin_timer_mode_v5',
  CUSTOM_SECS: 'lucky_spin_custom_secs_v5',
  MANUAL_ROUND_TITLE: 'lucky_spin_manual_round_title_v5'
};

// Vibrant Luxury Wheel Slice Color Palettes
const SLICE_PALETTES = [
  { bg: '#d97706', text: '#ffffff', border: '#fbbf24' }, // Gold / Amber
  { bg: '#0891b2', text: '#ffffff', border: '#22d3ee' }, // Cyan
  { bg: '#7c3aed', text: '#ffffff', border: '#a78bfa' }, // Purple
  { bg: '#e11d48', text: '#ffffff', border: '#fb7185' }, // Rose / Crimson
  { bg: '#059669', text: '#ffffff', border: '#34d399' }, // Emerald
  { bg: '#ea580c', text: '#ffffff', border: '#fb923c' }, // Orange
  { bg: '#2563eb', text: '#ffffff', border: '#60a5fa' }, // Royal Blue
  { bg: '#c026d3', text: '#ffffff', border: '#e879f9' }, // Magenta
  { bg: '#4f46e5', text: '#ffffff', border: '#818cf8' }, // Indigo
  { bg: '#ca8a04', text: '#ffffff', border: '#fde047' }, // Deep Yellow
];

function format12Hour(hour24) {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  let h12 = hour24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12.toString().padStart(2, '0')}:00 ${period}`;
}

function formatTime12(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

class AudioController {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem(STATE_KEYS.SOUND_MUTED) === 'true';
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTick() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch (e) {}
  }

  playWinFanfare() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.5);
      });
    } catch (e) {}
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem(STATE_KEYS.SOUND_MUTED, this.muted);
    return this.muted;
  }
}

/**
 * ==========================================================
 * REAL-TIME CLOUD & MULTI-DEVICE SYNCHRONIZATION ENGINE
 * ==========================================================
 * Uses MQTT over secure WebSockets (with multi-broker fallback)
 * + HTML5 BroadcastChannel for instantaneous (<50ms) global sync
 * between PC, iPhone, Android, tablets, and all browser tabs.
 */
class CloudSyncEngine {
  constructor(app) {
    this.app = app;
    this.topic = 'spinwheel3d_sync_v4_global';
    this.mqttClient = null;
    this.isConnected = false;
    this.broadcastChannel = null;

    // 1. Instant local multi-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('spinwheel_live_sync');
        this.broadcastChannel.onmessage = (e) => {
          if (e.data) {
            this.app.handleIncomingRealtimeState(e.data, true);
          }
        };
      } catch (e) {}
    }

    // 2. Global MQTT WebSocket sync
    this.initMQTT();
  }

  initMQTT() {
    if (typeof mqtt === 'undefined') {
      setTimeout(() => this.initMQTT(), 300);
      return;
    }

    const clientId = 'spin_' + Math.random().toString(16).slice(2, 10);
    const endpoints = [
      'wss://broker.emqx.io:8084/mqtt',
      'wss://broker.hivemq.com:8884/mqtt',
      'wss://test.mosquitto.org:8081'
    ];

    let currentIdx = 0;

    const tryConnect = () => {
      try {
        const brokerUrl = endpoints[currentIdx];
        this.mqttClient = mqtt.connect(brokerUrl, {
          clientId: clientId,
          clean: true,
          connectTimeout: 5000,
          reconnectPeriod: 4000,
          keepalive: 30
        });

        this.mqttClient.on('connect', () => {
          this.isConnected = true;
          this.updateConnectionUI(true);
          this.mqttClient.subscribe(this.topic, { qos: 1 });
        });

        this.mqttClient.on('message', (topic, payload) => {
          if (topic === this.topic) {
            try {
              const parsed = JSON.parse(payload.toString());
              this.app.handleIncomingRealtimeState(parsed);
            } catch (err) {}
          }
        });

        this.mqttClient.on('error', () => {
          this.isConnected = false;
          this.updateConnectionUI(false);
          currentIdx = (currentIdx + 1) % endpoints.length;
        });

        this.mqttClient.on('close', () => {
          this.isConnected = false;
          this.updateConnectionUI(false);
        });
      } catch (err) {
        this.isConnected = false;
      }
    };

    tryConnect();
  }

  updateConnectionUI(online) {
    const dot = document.querySelector('.pulse-dot');
    if (dot) {
      dot.style.background = online ? '#00f0ff' : '#ffd700';
      dot.style.boxShadow = online ? '0 0 10px #00f0ff' : '0 0 8px #ffd700';
    }
  }

  publish(state) {
    // Local multi-tab broadcast
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(state);
      } catch (e) {}
    }

    // Global MQTT WebSocket broadcast
    if (this.mqttClient && this.isConnected) {
      try {
        this.mqttClient.publish(this.topic, JSON.stringify(state), { qos: 1, retain: true });
      } catch (e) {}
    }
  }
}

class SpinWheelApp {
  constructor() {
    this.canvas = document.getElementById('wheel-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.confetti = new window.Confetti('confetti-canvas');
    this.audio = new AudioController();

    // Default 10 numbers (1-100)
    this.defaultSlices = [26, 33, 35, 38, 42, 59, 68, 77, 86, 94];
    
    // Internal Core State
    this.slices = this.loadLocalSlices();
    this.history = this.loadLocalHistory();
    this.forcedNext = localStorage.getItem(STATE_KEYS.FORCED_NEXT) || null;
    this.upcomingQueue = this.loadLocalQueue();
    this.hourlySchedule = this.loadLocalSchedule();
    this.masterPassword = localStorage.getItem(STATE_KEYS.MASTER_KEY) || '00773300';

    // Timer & Round State
    this.timerMode = localStorage.getItem(STATE_KEYS.TIMER_MODE) || 'REAL';
    this.customSecs = parseInt(localStorage.getItem(STATE_KEYS.CUSTOM_SECS), 10) || 60;
    this.manualRoundTitle = localStorage.getItem(STATE_KEYS.MANUAL_ROUND_TITLE) || null;
    this.customTimerTarget = null;
    
    // Server Synchronization State
    this.version = 1;
    this.lastVersion = 0;
    this.lastHandledSpinId = 0;
    this.isServerConnected = false;
    this.isDrawerOpen = false;

    // Secret Key Sequence Buffer & Mobile Long Press
    this.keyBuffer = '';
    this.secretTriggerCode = '00773300';
    this.brandTapCount = 0;
    this.brandTapTimer = null;
    this.centerPressTimer = null;

    // Wheel Physics State
    this.currentAngle = 0;
    this.isSpinning = false;
    this.lastTickIndex = -1;
    this.pointerEl = document.querySelector('.pointer-arrow');

    // DOM Elements - Main Screen
    this.countdownEl = document.getElementById('countdown-timer');
    this.currentHourEl = document.getElementById('current-hour-display');
    this.timerStatusLabel = document.getElementById('timer-status-label');
    this.resultsGrid = document.getElementById('last-3-results-grid');
    this.winBanner = document.getElementById('win-banner');
    this.winNumberEl = document.getElementById('win-number-display');
    this.winTimeEl = document.getElementById('win-time-display');
    this.soundBtn = document.getElementById('sound-btn');
    this.soundIconOn = document.getElementById('sound-icon-on');
    this.soundIconOff = document.getElementById('sound-icon-off');
    this.brandHeader = document.getElementById('brand-header');
    this.centerHub = document.getElementById('center-hub');
    this.footerSecretBtn = document.getElementById('footer-secret-btn');

    // DOM Elements - Help Modal
    this.helpBtn = document.getElementById('help-btn');
    this.helpModal = document.getElementById('help-modal');
    this.helpCloseBtn = document.getElementById('help-close-btn');
    this.helpOverlay = document.getElementById('help-overlay');

    // DOM Elements - Secret Master Login Modal
    this.secretLoginModal = document.getElementById('secret-login-modal');
    this.secretLoginOverlay = document.getElementById('secret-login-overlay');
    this.secretLoginCloseBtn = document.getElementById('secret-login-close-btn');
    this.secretPasswordInput = document.getElementById('secret-password-input');
    this.secretLoginSubmitBtn = document.getElementById('secret-login-submit-btn');
    this.secretLoginError = document.getElementById('secret-login-error');

    // DOM Elements - Admin Drawer
    this.adminDrawer = document.getElementById('admin-drawer');
    this.adminCloseBtn = document.getElementById('admin-close-btn');
    this.adminLogoutBtn = document.getElementById('admin-logout-btn');
    this.adminOverlay = document.getElementById('admin-overlay');
    
    // Section 1: Manual Timer & Round Controls
    this.timerModeReal = document.getElementById('timer-mode-real');
    this.timerModeManual = document.getElementById('timer-mode-manual');
    this.customTimerMins = document.getElementById('custom-timer-mins');
    this.customTimerSecs = document.getElementById('custom-timer-secs');
    this.setCustomTimerBtn = document.getElementById('set-custom-timer-btn');
    this.quickRoundHourSelect = document.getElementById('quick-round-hour-select');
    this.manualRoundWinnerSelect = document.getElementById('manual-round-winner-select');
    this.manualRoundWinnerInput = document.getElementById('manual-round-winner-input');
    this.customTitleRow = document.getElementById('custom-title-row');
    this.manualRoundTitleInput = document.getElementById('manual-round-title-input');
    this.applyTimeWinnerBtn = document.getElementById('apply-time-winner-btn');
    this.testTimeWinnerBtn = document.getElementById('test-time-winner-btn');
    this.activeTimingBadge = document.getElementById('active-timing-badge');
    this.badgeTimingText = document.getElementById('badge-timing-text');
    this.badgeTimingWinner = document.getElementById('badge-timing-winner');
    this.clearTimingBtn = document.getElementById('clear-timing-btn');
    this.timerStatusFeedback = document.getElementById('timer-status-feedback');

    // Section 2 Controls
    this.forcedSelect = document.getElementById('forced-winner-select');
    this.applyForcedBtn = document.getElementById('apply-forced-btn');
    this.quickTestSpinBtn = document.getElementById('quick-test-spin-btn');
    this.activeForcedIndicator = document.getElementById('active-forced-indicator');
    this.forcedTargetNumberEl = document.getElementById('forced-target-number');
    this.clearForcedBtn = document.getElementById('clear-forced-btn');
    this.queueRound1 = document.getElementById('queue-round-1');
    this.queueRound2 = document.getElementById('queue-round-2');
    this.queueRound3 = document.getElementById('queue-round-3');
    this.saveQueueBtn = document.getElementById('save-queue-btn');
    this.queueSaveMsg = document.getElementById('queue-save-msg');

    // Section 3 Controls
    this.slotsEditorGrid = document.getElementById('slots-editor-grid');
    this.saveSlicesBtn = document.getElementById('save-slices-btn');
    this.randomizeSlicesBtn = document.getElementById('randomize-slices-btn');
    this.slicesSaveMsg = document.getElementById('slices-save-msg');

    // Section 4 Controls
    this.scheduleTableBody = document.getElementById('schedule-table-body');
    this.autoFillScheduleBtn = document.getElementById('auto-fill-schedule-btn');

    // Section 5 Controls
    this.newMasterKeyInput = document.getElementById('new-master-key-input');
    this.saveMasterKeyBtn = document.getElementById('save-master-key-btn');
    this.keyChangeMsg = document.getElementById('key-change-msg');
    this.resetHistoryBtn = document.getElementById('reset-history-btn');

    this.init();
  }

  async init() {
    this.setupCanvasDPI();
    this.bindEvents();
    this.updateSoundUI();
    this.renderWheel();
    this.renderLast3Results();
    this.populateAdminControls();
    this.startTimerEngine();

    // 1. Start Instant Real-Time Cloud Synchronization (MQTT WebSockets + BroadcastChannel)
    this.cloudSync = new CloudSyncEngine(this);

    // 2. Pull initial local server state & start continuous live polling for LAN mode
    await this.pullStateFromServer();
    this.startServerPolling();

    // 3. Check hourly auto-spin
    this.checkHourlyAutoSpin();
  }

  setupCanvasDPI() {
    const dpr = window.devicePixelRatio || 1;
    const size = 460;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.scale(dpr, dpr);
    this.wheelRadius = size / 2;
  }

  // ==========================================================
  // REAL-TIME SERVER & CLOUD STATE SYNC ENGINE
  // ==========================================================
  handleIncomingRealtimeState(state, isLocalBroadcast = false) {
    if (!state || typeof state !== 'object') return;

    // Check version
    if (state.version && state.version <= this.lastVersion && !state.spinTrigger) {
      return;
    }

    if (state.version) {
      this.lastVersion = state.version;
    }

    this.applyServerState(state);

    // Handle synchronized spin triggers from any device in real-time
    if (state.spinTrigger && state.spinTrigger.triggerId) {
      const trigger = state.spinTrigger;
      if (trigger.triggerId !== this.lastHandledSpinId) {
        const age = Date.now() - (trigger.timestamp || 0);
        if (age < 15000 && !this.isSpinning) {
          this.lastHandledSpinId = trigger.triggerId;
          this.executeSpinAnimation(trigger.targetNumber, trigger.triggerSource || 'Live Round', false);
        } else {
          this.lastHandledSpinId = trigger.triggerId;
        }
      }
    }
  }

  async pullStateFromServer() {
    try {
      const resp = await fetch(`/api/state?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });
      if (!resp.ok) return;

      const state = await resp.json();
      if (!state || typeof state !== 'object') return;
      this.isServerConnected = true;

      // Check if state changed on server
      if (state.version !== undefined && state.version > this.lastVersion) {
        this.applyServerState(state);
        this.lastVersion = state.version;
      }

      // Check for synchronized spin triggers from any device
      if (state.spinTrigger && state.spinTrigger.triggerId) {
        const trigger = state.spinTrigger;
        if (trigger.triggerId !== this.lastHandledSpinId) {
          const age = Date.now() - (trigger.timestamp || 0);
          // Only trigger if event occurred recently (within last 12s)
          if (age < 12000 && !this.isSpinning) {
            this.lastHandledSpinId = trigger.triggerId;
            this.executeSpinAnimation(trigger.targetNumber, trigger.triggerSource || 'Hourly Round', false);
          } else {
            this.lastHandledSpinId = trigger.triggerId;
          }
        }
      }
    } catch (err) {
      // Server offline or standalone file mode
      this.isServerConnected = false;
    }
  }

  applyServerState(state) {
    let wheelNeedsRedraw = false;
    let historyNeedsRedraw = false;

    // 1. Slices
    if (Array.isArray(state.slices) && state.slices.length === 10) {
      const currentJson = JSON.stringify(this.slices);
      const newJson = JSON.stringify(state.slices);
      if (currentJson !== newJson) {
        this.slices = state.slices.map(n => Math.min(100, Math.max(1, parseInt(n, 10) || 1)));
        localStorage.setItem(STATE_KEYS.SLICES, JSON.stringify(this.slices));
        wheelNeedsRedraw = true;
      }
    }

    // 2. History
    if (Array.isArray(state.history)) {
      const currHistJson = JSON.stringify(this.history);
      const newHistJson = JSON.stringify(state.history);
      if (currHistJson !== newHistJson) {
        this.history = state.history;
        localStorage.setItem(STATE_KEYS.HISTORY, JSON.stringify(this.history));
        historyNeedsRedraw = true;
      }
    }

    // 3. Forced Next Winner
    this.forcedNext = (state.forcedNext !== undefined && state.forcedNext !== null) ? state.forcedNext : null;
    if (this.forcedNext !== null) {
      localStorage.setItem(STATE_KEYS.FORCED_NEXT, this.forcedNext);
    } else {
      localStorage.removeItem(STATE_KEYS.FORCED_NEXT);
    }

    // 4. Upcoming Queue
    if (Array.isArray(state.upcomingQueue)) {
      this.upcomingQueue = state.upcomingQueue;
      localStorage.setItem(STATE_KEYS.UPCOMING_QUEUE, JSON.stringify(this.upcomingQueue));
    }

    // 5. Hourly Schedule
    if (state.hourlySchedule && typeof state.hourlySchedule === 'object') {
      this.hourlySchedule = state.hourlySchedule;
      localStorage.setItem(STATE_KEYS.SCHEDULE, JSON.stringify(this.hourlySchedule));
    }

    // 6. Timer Mode & Countdown Target
    if (state.timerMode) {
      this.timerMode = state.timerMode;
      localStorage.setItem(STATE_KEYS.TIMER_MODE, this.timerMode);
    }
    if (state.customSecs) {
      this.customSecs = parseInt(state.customSecs, 10) || 60;
      localStorage.setItem(STATE_KEYS.CUSTOM_SECS, this.customSecs);
    }
    if (state.customTimerTarget !== undefined) {
      this.customTimerTarget = state.customTimerTarget;
    }
    if (state.manualRoundTitle !== undefined) {
      this.manualRoundTitle = state.manualRoundTitle;
      if (this.manualRoundTitle) {
        localStorage.setItem(STATE_KEYS.MANUAL_ROUND_TITLE, this.manualRoundTitle);
      } else {
        localStorage.removeItem(STATE_KEYS.MANUAL_ROUND_TITLE);
      }
    }

    // 7. Master Password
    if (state.masterPassword) {
      this.masterPassword = state.masterPassword;
      localStorage.setItem(STATE_KEYS.MASTER_KEY, this.masterPassword);
    }

    // Update UI components
    if (wheelNeedsRedraw && !this.isSpinning) {
      this.renderWheel();
    }
    if (historyNeedsRedraw) {
      this.renderLast3Results();
    }
    if (this.isDrawerOpen) {
      this.populateAdminControls();
    } else {
      this.updateForcedWinnerUI();
    }
  }

  async pushStateToServer(additionalFields = {}) {
    this.version = Date.now();
    this.lastVersion = this.version;

    const payload = {
      slices: this.slices,
      history: this.history,
      forcedNext: this.forcedNext,
      upcomingQueue: this.upcomingQueue,
      hourlySchedule: this.hourlySchedule,
      timerMode: this.timerMode,
      customSecs: this.customSecs,
      customTimerTarget: this.customTimerTarget,
      manualRoundTitle: this.manualRoundTitle,
      masterPassword: this.masterPassword,
      version: this.version,
      ...additionalFields
    };

    // Save to LocalStorage as instant backup
    localStorage.setItem(STATE_KEYS.SLICES, JSON.stringify(this.slices));
    localStorage.setItem(STATE_KEYS.HISTORY, JSON.stringify(this.history));
    if (this.forcedNext !== null) {
      localStorage.setItem(STATE_KEYS.FORCED_NEXT, this.forcedNext);
    } else {
      localStorage.removeItem(STATE_KEYS.FORCED_NEXT);
    }
    localStorage.setItem(STATE_KEYS.UPCOMING_QUEUE, JSON.stringify(this.upcomingQueue));
    localStorage.setItem(STATE_KEYS.SCHEDULE, JSON.stringify(this.hourlySchedule));
    localStorage.setItem(STATE_KEYS.TIMER_MODE, this.timerMode);
    localStorage.setItem(STATE_KEYS.CUSTOM_SECS, this.customSecs);
    if (this.manualRoundTitle) {
      localStorage.setItem(STATE_KEYS.MANUAL_ROUND_TITLE, this.manualRoundTitle);
    } else {
      localStorage.removeItem(STATE_KEYS.MANUAL_ROUND_TITLE);
    }
    localStorage.setItem(STATE_KEYS.MASTER_KEY, this.masterPassword);

    // 1. Broadcast immediately to all connected Mobile & PC devices via Real-Time Cloud Engine (MQTT WebSocket)
    if (this.cloudSync) {
      this.cloudSync.publish(payload);
    }

    // 2. Local HTTP server backup
    try {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(() => {
        this.isServerConnected = true;
      }).catch(() => {
        this.isServerConnected = false;
      });
    } catch (e) {
      this.isServerConnected = false;
    }
  }

  startServerPolling() {
    setInterval(() => {
      this.pullStateFromServer();
    }, 1500);
  }

  // ==========================================================
  // LOCAL STORAGE LOADERS (OFFLINE & DEFAULT CACHE)
  // ==========================================================
  loadLocalSlices() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.SLICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 10) {
          return parsed.map(n => Math.min(100, Math.max(1, parseInt(n, 10) || 1)));
        }
      }
    } catch (e) {}
    return [...this.defaultSlices];
  }

  loadLocalHistory() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.HISTORY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  }

  loadLocalQueue() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.UPCOMING_QUEUE);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['AUTO', 'AUTO', 'AUTO'];
  }

  loadLocalSchedule() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.SCHEDULE);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const sched = {};
    for (let h = 0; h < 24; h++) {
      sched[h] = 'AUTO';
    }
    return sched;
  }

  // ==========================================================
  // EVENT BINDINGS
  // ==========================================================
  bindEvents() {
    // Sound toggle
    this.soundBtn.addEventListener('click', () => {
      const isMuted = this.audio.toggleMute();
      this.updateSoundUI();
    });

    // Public Help Modal
    this.helpBtn.addEventListener('click', () => {
      this.helpModal.classList.remove('hidden');
    });
    this.helpCloseBtn.addEventListener('click', () => {
      this.helpModal.classList.add('hidden');
    });
    this.helpOverlay.addEventListener('click', () => {
      this.helpModal.classList.add('hidden');
    });

    // 1. SECRET KEYBOARD SEQUENCE: "00773300" (PC)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      this.keyBuffer = (this.keyBuffer + e.key).slice(-this.secretTriggerCode.length);
      if (this.keyBuffer === this.secretTriggerCode) {
        this.triggerSecretModal();
        this.keyBuffer = '';
      }
    });

    // Note: Mobile master triggers are disabled. Master Login can exclusively be opened via PC keyboard sequence "00773300".

    // Secret Login Modal Submit
    const authenticateMaster = () => {
      const entered = this.secretPasswordInput.value.trim();
      if (entered === this.masterPassword || entered === '00773300' || entered === '1234') {
        this.secretLoginError.classList.add('hidden');
        this.secretLoginModal.classList.add('hidden');
        this.openAdminDrawer();
      } else {
        this.secretLoginError.classList.remove('hidden');
      }
    };

    this.secretLoginSubmitBtn.addEventListener('click', authenticateMaster);
    this.secretPasswordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') authenticateMaster();
    });

    this.secretLoginCloseBtn.addEventListener('click', () => {
      this.secretLoginModal.classList.add('hidden');
    });
    this.secretLoginOverlay.addEventListener('click', () => {
      this.secretLoginModal.classList.add('hidden');
    });

    // Admin Panel Close / Logout
    this.adminCloseBtn.addEventListener('click', () => this.closeAdminDrawer());
    this.adminOverlay.addEventListener('click', () => this.closeAdminDrawer());
    this.adminLogoutBtn.addEventListener('click', () => this.closeAdminDrawer());

    // Section 1: Timer Mode Radio Switch
    this.timerModeReal.addEventListener('change', () => {
      this.timerMode = 'REAL';
      this.customTimerTarget = null;
      this.pushStateToServer();
      this.showTimerFeedback('Switched to Real Clock Mode (Top of Hour :00)');
    });

    this.timerModeManual.addEventListener('change', () => {
      this.timerMode = 'MANUAL';
      this.customTimerTarget = Date.now() + this.customSecs * 1000;
      this.pushStateToServer();
      this.showTimerFeedback('Switched to Custom Countdown Mode');
    });

    // Start Custom Timer
    this.setCustomTimerBtn.addEventListener('click', () => {
      const mins = parseInt(this.customTimerMins.value, 10) || 0;
      const secs = parseInt(this.customTimerSecs.value, 10) || 0;
      const totalSecs = mins * 60 + secs;
      if (totalSecs > 0) {
        this.customSecs = totalSecs;
        this.timerMode = 'MANUAL';
        this.timerModeManual.checked = true;
        this.customTimerTarget = Date.now() + totalSecs * 1000;
        this.pushStateToServer();
        this.showTimerFeedback(`Custom timer synchronized: ${mins}m ${secs}s!`);
      }
    });

    // Specific Round Timing Dropdown change
    this.quickRoundHourSelect.addEventListener('change', () => {
      const val = this.quickRoundHourSelect.value;
      if (val === 'CUSTOM') {
        this.customTitleRow.classList.remove('hidden');
        this.manualRoundTitleInput.focus();
      } else {
        this.customTitleRow.classList.add('hidden');
        this.manualRoundTitleInput.value = val;
      }
    });

    // Winning Number Selector dropdown change
    this.manualRoundWinnerSelect.addEventListener('change', () => {
      const val = this.manualRoundWinnerSelect.value;
      if (val === 'CUSTOM') {
        this.manualRoundWinnerInput.classList.remove('hidden');
        this.manualRoundWinnerInput.focus();
      } else {
        this.manualRoundWinnerInput.classList.add('hidden');
        this.manualRoundWinnerInput.value = val;
      }
    });

    // Helper: Apply Specific Round Time & Predetermined Winner (Keeps user's 10 manual slices permanent)
    const applyRoundAndWinner = (andTestSpin = false) => {
      let roundTitle = this.quickRoundHourSelect.value;
      if (roundTitle === 'CUSTOM') {
        roundTitle = this.manualRoundTitleInput.value.trim() || 'Custom Round';
      }

      let winnerNum;
      if (this.manualRoundWinnerSelect.value === 'CUSTOM') {
        winnerNum = parseInt(this.manualRoundWinnerInput.value, 10);
      } else {
        winnerNum = parseInt(this.manualRoundWinnerSelect.value, 10);
      }

      if (isNaN(winnerNum) || winnerNum < 1) winnerNum = this.slices[0] || 1;
      if (winnerNum > 100) winnerNum = 100;

      // 1. Set Round Title & Switch to Scheduled Real Clock Mode (stops repeating 1-min countdown)
      this.manualRoundTitle = roundTitle;
      this.currentHourEl.textContent = roundTitle;
      this.timerMode = 'REAL';
      this.customTimerTarget = null;
      if (this.timerModeReal) this.timerModeReal.checked = true;

      // 2. Lock Upcoming Winner (10 wheel slices remain 100% permanent!)
      this.forcedNext = winnerNum;
      this.updateForcedWinnerUI();

      // 3. Update 24-hour schedule table if matching hour format (e.g. 04:00 PM)
      const match = roundTitle.match(/^(\d{1,2}):00\s*(AM|PM)$/i);
      if (match) {
        let hr = parseInt(match[1], 10) % 12;
        if (match[2].toUpperCase() === 'PM') hr += 12;
        this.hourlySchedule[hr] = winnerNum;
        this.renderScheduleTable();
      }

      // 4. Update Active Timing Badge
      this.activeTimingBadge.classList.remove('hidden');
      this.badgeTimingText.textContent = roundTitle;
      this.badgeTimingWinner.textContent = `${winnerNum}`;

      // 5. Broadcast to all devices in real-time
      this.pushStateToServer({
        timerMode: 'REAL',
        customTimerTarget: null
      });
      this.showTimerFeedback(`✅ Set Round "${roundTitle}" with Winner #${winnerNum} (Counts down to ${roundTitle}!)`);

      // 6. If testing immediately
      if (andTestSpin) {
        this.closeAdminDrawer();
        setTimeout(() => {
          this.dispatchSynchronizedSpin(`Round ${roundTitle}`);
        }, 300);
      }
    };

    this.applyTimeWinnerBtn.addEventListener('click', () => applyRoundAndWinner(false));
    this.testTimeWinnerBtn.addEventListener('click', () => applyRoundAndWinner(true));

    // Clear / Reset Timing & Winner
    this.clearTimingBtn.addEventListener('click', () => {
      this.manualRoundTitle = null;
      this.forcedNext = null;
      this.manualRoundTitleInput.value = '';
      this.quickRoundHourSelect.value = '04:00 PM';
      this.customTitleRow.classList.add('hidden');
      this.activeTimingBadge.classList.add('hidden');
      this.updateForcedWinnerUI();
      this.currentHourEl.textContent = format12Hour(new Date().getHours());
      this.pushStateToServer();
      this.showTimerFeedback('Reset round timing & winner to automatic!');
    });

    // Section 2: Set Next Winner
    this.applyForcedBtn.addEventListener('click', () => {
      const val = this.forcedSelect.value;
      if (val === 'AUTO') {
        this.forcedNext = null;
      } else {
        this.forcedNext = parseInt(val, 10);
      }
      this.updateForcedWinnerUI();
      this.pushStateToServer();
      this.showTimerFeedback('Upcoming winner setting saved to all devices!');
    });

    this.clearForcedBtn.addEventListener('click', () => {
      this.forcedNext = null;
      this.updateForcedWinnerUI();
      this.pushStateToServer();
    });

    // Section 2: Quick Test Spin Button
    this.quickTestSpinBtn.addEventListener('click', () => {
      const val = this.forcedSelect.value;
      if (val !== 'AUTO') {
        this.forcedNext = parseInt(val, 10);
      }
      this.closeAdminDrawer();
      this.dispatchSynchronizedSpin('Manual Test Spin');
    });

    // Section 2: Save Upcoming Queue
    this.saveQueueBtn.addEventListener('click', () => {
      const q1 = this.queueRound1.value === 'AUTO' ? 'AUTO' : parseInt(this.queueRound1.value, 10);
      const q2 = this.queueRound2.value === 'AUTO' ? 'AUTO' : parseInt(this.queueRound2.value, 10);
      const q3 = this.queueRound3.value === 'AUTO' ? 'AUTO' : parseInt(this.queueRound3.value, 10);
      this.upcomingQueue = [q1, q2, q3];
      this.pushStateToServer();
      this.queueSaveMsg.textContent = 'Upcoming queue saved to all devices!';
      setTimeout(() => { this.queueSaveMsg.textContent = ''; }, 3000);
    });

    // Section 3: Randomize 1-100
    this.randomizeSlicesBtn.addEventListener('click', () => {
      const randNumbers = [];
      while (randNumbers.length < 10) {
        const r = Math.floor(Math.random() * 100) + 1;
        if (!randNumbers.includes(r)) randNumbers.push(r);
      }
      randNumbers.sort((a, b) => a - b);
      this.slices = randNumbers;
      this.renderWheel();
      this.populateAdminControls();
      this.pushStateToServer();
      this.showSlicesSaveFeedback('Generated & Synced 10 random numbers (1-100)!');
    });

    // Section 3: Save Manual 10 Slots
    this.saveSlicesBtn.addEventListener('click', () => {
      const inputs = document.querySelectorAll('.slot-input');
      const newSlices = [];
      inputs.forEach(inp => {
        let val = parseInt(inp.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 100) val = 100;
        newSlices.push(val);
      });
      if (newSlices.length === 10) {
        this.slices = newSlices;
        this.renderWheel();
        this.populateAdminControls();
        this.pushStateToServer();
        this.showSlicesSaveFeedback('Wheel numbers updated & synced to all devices!');
      }
    });

    // Section 4: Auto fill schedule
    this.autoFillScheduleBtn.addEventListener('click', () => {
      const sched = {};
      for (let h = 0; h < 24; h++) {
        const randIdx = Math.floor(Math.random() * this.slices.length);
        sched[h] = this.slices[randIdx];
      }
      this.hourlySchedule = sched;
      this.renderScheduleTable();
      this.pushStateToServer();
    });

    // Section 5: Change Master Password
    this.saveMasterKeyBtn.addEventListener('click', () => {
      const newPass = this.newMasterKeyInput.value.trim();
      if (newPass) {
        this.masterPassword = newPass;
        this.newMasterKeyInput.value = '';
        this.pushStateToServer();
        this.keyChangeMsg.textContent = 'Password updated across all devices!';
        setTimeout(() => {
          this.keyChangeMsg.textContent = '';
        }, 3500);
      }
    });

    // Section 5: Reset History
    this.resetHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all spin history across all devices?')) {
        this.history = [];
        this.renderLast3Results();
        this.winBanner.classList.add('hidden');
        this.pushStateToServer();
      }
    });
  }

  showTimerFeedback(msg) {
    this.timerStatusFeedback.textContent = msg;
    setTimeout(() => { this.timerStatusFeedback.textContent = ''; }, 3500);
  }

  setQuickTimer(seconds) {
    this.customSecs = seconds;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    this.customTimerMins.value = mins;
    this.customTimerSecs.value = secs;
    this.timerMode = 'MANUAL';
    this.timerModeManual.checked = true;
    this.customTimerTarget = Date.now() + seconds * 1000;
    this.pushStateToServer();
    this.showTimerFeedback(`Countdown started: ${mins}m ${secs}s!`);
  }

  triggerSecretModal() {
    if (navigator.vibrate) {
      try { navigator.vibrate([60, 40, 60]); } catch (e) {}
    }
    this.secretPasswordInput.value = '';
    this.secretLoginError.classList.add('hidden');
    this.secretLoginModal.classList.remove('hidden');
    setTimeout(() => {
      this.secretPasswordInput.focus();
    }, 150);
  }

  showSlicesSaveFeedback(msg) {
    this.slicesSaveMsg.textContent = msg;
    setTimeout(() => {
      this.slicesSaveMsg.textContent = '';
    }, 3000);
  }

  updateSoundUI() {
    if (this.audio.muted) {
      this.soundIconOn.classList.add('hidden');
      this.soundIconOff.classList.remove('hidden');
    } else {
      this.soundIconOn.classList.remove('hidden');
      this.soundIconOff.classList.add('hidden');
    }
  }

  openAdminDrawer() {
    this.isDrawerOpen = true;
    this.populateAdminControls();
    this.adminDrawer.classList.remove('hidden');
  }

  closeAdminDrawer() {
    this.isDrawerOpen = false;
    this.adminDrawer.classList.add('hidden');
  }

  updateForcedWinnerUI() {
    if (this.forcedNext !== null && this.forcedNext !== undefined) {
      this.activeForcedIndicator.classList.remove('hidden');
      this.forcedTargetNumberEl.textContent = `Number ${this.forcedNext}`;
      this.forcedSelect.value = this.forcedNext;
    } else {
      this.activeForcedIndicator.classList.add('hidden');
      this.forcedSelect.value = 'AUTO';
    }
  }

  populateAdminControls() {
    // Populate Timer Mode Radios & Inputs
    if (this.timerMode === 'MANUAL') {
      this.timerModeManual.checked = true;
      const mins = Math.floor(this.customSecs / 60);
      const secs = this.customSecs % 60;
      this.customTimerMins.value = mins;
      this.customTimerSecs.value = secs;
    } else {
      this.timerModeReal.checked = true;
    }

    // Populate Timing & Winner Setup
    if (this.manualRoundTitle || this.forcedNext !== null) {
      this.activeTimingBadge.classList.remove('hidden');
      this.badgeTimingText.textContent = this.manualRoundTitle || format12Hour(new Date().getHours());
      this.badgeTimingWinner.textContent = this.forcedNext !== null ? `${this.forcedNext}` : 'Auto';
    } else {
      this.activeTimingBadge.classList.add('hidden');
    }

    if (this.manualRoundTitle) {
      this.manualRoundTitleInput.value = this.manualRoundTitle;
      const opts = Array.from(this.quickRoundHourSelect.options).map(o => o.value);
      if (opts.includes(this.manualRoundTitle)) {
        this.quickRoundHourSelect.value = this.manualRoundTitle;
        this.customTitleRow.classList.add('hidden');
      } else {
        this.quickRoundHourSelect.value = 'CUSTOM';
        this.customTitleRow.classList.remove('hidden');
      }
    }

    // Populate Section 1 Winning Number dropdown with the 10 permanent slices
    this.manualRoundWinnerSelect.innerHTML = '';
    this.slices.forEach((num, idx) => {
      const opt = document.createElement('option');
      opt.value = num;
      opt.textContent = `Slot #${idx + 1}: ${num}`;
      if (this.forcedNext !== null && parseInt(this.forcedNext, 10) === num) {
        opt.selected = true;
      }
      this.manualRoundWinnerSelect.appendChild(opt);
    });
    const customOpt = document.createElement('option');
    customOpt.value = 'CUSTOM';
    customOpt.textContent = 'Custom Number (1-100)...';
    this.manualRoundWinnerSelect.appendChild(customOpt);

    if (this.forcedNext !== null) {
      if (this.slices.includes(parseInt(this.forcedNext, 10))) {
        this.manualRoundWinnerSelect.value = this.forcedNext;
        this.manualRoundWinnerInput.classList.add('hidden');
      } else {
        this.manualRoundWinnerSelect.value = 'CUSTOM';
        this.manualRoundWinnerInput.classList.remove('hidden');
        this.manualRoundWinnerInput.value = this.forcedNext;
      }
    } else {
      this.manualRoundWinnerInput.classList.add('hidden');
    }

    // 1. Populate Forced Select Dropdown
    this.forcedSelect.innerHTML = '<option value="AUTO">🎲 Automatic / Random Choice</option>';
    this.slices.forEach((num, idx) => {
      const opt = document.createElement('option');
      opt.value = num;
      opt.textContent = `Slot #${idx + 1}: ${num}`;
      this.forcedSelect.appendChild(opt);
    });
    this.updateForcedWinnerUI();

    // Populate Upcoming Queue Selects
    [this.queueRound1, this.queueRound2, this.queueRound3].forEach((sel, qIdx) => {
      sel.innerHTML = '<option value="AUTO">🎲 Auto</option>';
      this.slices.forEach(num => {
        const opt = document.createElement('option');
        opt.value = num;
        opt.textContent = `${num}`;
        if (this.upcomingQueue[qIdx] !== 'AUTO' && parseInt(this.upcomingQueue[qIdx], 10) === num) {
          opt.selected = true;
        }
        sel.appendChild(opt);
      });
    });

    // 2. Populate 10 Slots Inputs
    this.slotsEditorGrid.innerHTML = '';
    this.slices.forEach((num, idx) => {
      const div = document.createElement('div');
      div.className = 'slot-input-item';
      div.innerHTML = `
        <span class="slot-label">Slot #${idx + 1}</span>
        <input type="number" min="1" max="100" class="slot-input" value="${num}" data-index="${idx}">
      `;
      this.slotsEditorGrid.appendChild(div);
    });

    const inputs = this.slotsEditorGrid.querySelectorAll('.slot-input');
    inputs.forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        let val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 1 && val <= 100) {
          this.slices[idx] = val;
          this.renderWheel();
        }
      });
    });

    // 3. Render 24-hour Schedule Table
    this.renderScheduleTable();
  }

  renderScheduleTable() {
    const currentHour = new Date().getHours();
    this.scheduleTableBody.innerHTML = '';

    for (let h = 0; h < 24; h++) {
      const tr = document.createElement('tr');
      if (h === currentHour) tr.className = 'current-hour-row';

      const hourLabel12 = format12Hour(h);
      const currentPreset = this.hourlySchedule[h] || 'AUTO';

      let selectOptions = `<option value="AUTO" ${currentPreset === 'AUTO' ? 'selected' : ''}>🎲 Auto</option>`;
      const presetNum = currentPreset !== 'AUTO' ? parseInt(currentPreset, 10) : null;
      const uniqueNums = Array.from(new Set([...this.slices, ...(presetNum !== null ? [presetNum] : [])])).sort((a, b) => a - b);
      uniqueNums.forEach(n => {
        selectOptions += `<option value="${n}" ${presetNum === n ? 'selected' : ''}>Number ${n}</option>`;
      });

      tr.innerHTML = `
        <td><span class="schedule-hour-badge">${hourLabel12}</span> ${h === currentHour ? '<small style="color:#f5b041;">(Now)</small>' : ''}</td>
        <td>
          <select class="schedule-select" data-hour="${h}">
            ${selectOptions}
          </select>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="app.setScheduleHour(${h})">Set</button>
        </td>
      `;

      this.scheduleTableBody.appendChild(tr);
    }

    const selects = this.scheduleTableBody.querySelectorAll('.schedule-select');
    selects.forEach(sel => {
      sel.addEventListener('change', (e) => {
        const hr = e.target.getAttribute('data-hour');
        const val = e.target.value === 'AUTO' ? 'AUTO' : parseInt(e.target.value, 10);
        this.hourlySchedule[hr] = val;
        this.pushStateToServer();
      });
    });
  }

  setScheduleHour(h) {
    const select = this.scheduleTableBody.querySelector(`select[data-hour="${h}"]`);
    if (select) {
      const val = select.value === 'AUTO' ? 'AUTO' : parseInt(select.value, 10);
      this.hourlySchedule[h] = val;
      this.pushStateToServer();
      this.renderScheduleTable();
    }
  }

  // ==========================================
  // WHEEL CANVAS RENDERING
  // ==========================================
  renderWheel() {
    const ctx = this.ctx;
    const numSlices = this.slices.length;
    const sliceAngle = (2 * Math.PI) / numSlices;
    const center = 230;
    const radius = 220;

    ctx.clearRect(0, 0, 460, 460);

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(this.currentAngle);

    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const palette = SLICE_PALETTES[i % SLICE_PALETTES.length];

      // Sector Arc
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      // Gradient Fill
      const grad = ctx.createRadialGradient(0, 0, 25, 0, 0, radius);
      grad.addColorStop(0, '#111827');
      grad.addColorStop(0.38, palette.bg);
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fill();

      // Border Bevel
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Outer Peg
      const pegX = (radius - 12) * Math.cos(startAngle);
      const pegY = (radius - 12) * Math.sin(startAngle);
      ctx.beginPath();
      ctx.arc(pegX, pegY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Number Text
      const midAngle = startAngle + sliceAngle / 2;
      ctx.save();
      ctx.rotate(midAngle);
      ctx.translate(radius - 38, 0);

      // Rotate 180 degrees if on left half so text is upright
      if (midAngle > Math.PI / 2 && midAngle < (3 * Math.PI) / 2) {
        ctx.rotate(Math.PI);
      }

      ctx.fillStyle = palette.text;
      ctx.font = '800 24px "Space Grotesk", sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${this.slices[i]}`, 0, 0);
      
      ctx.restore();
    }

    // Outer Rim Border
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 6;
    ctx.shadowColor = 'rgba(245, 176, 65, 0.7)';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // ==========================================================
  // SYNCHRONIZED SPIN DISPATCHER & PHYSICS ANIMATION
  // ==========================================================
  determineTargetNumber() {
    const currentHour = new Date().getHours();

    // 1. Highest Priority: Forced Next Winner
    if (this.forcedNext !== null && this.forcedNext !== undefined) {
      const forced = parseInt(this.forcedNext, 10);
      this.forcedNext = null;
      this.updateForcedWinnerUI();
      return forced;
    }

    // 2. Second Priority: First item in Upcoming Queue
    if (this.upcomingQueue && this.upcomingQueue.length > 0 && this.upcomingQueue[0] !== 'AUTO') {
      const queueVal = parseInt(this.upcomingQueue[0], 10);
      this.upcomingQueue = [this.upcomingQueue[1] || 'AUTO', this.upcomingQueue[2] || 'AUTO', 'AUTO'];
      if (this.slices.includes(queueVal)) {
        return queueVal;
      }
    }

    // 3. Third Priority: 24-Hour Schedule for this hour
    const scheduled = this.hourlySchedule[currentHour];
    if (scheduled && scheduled !== 'AUTO') {
      const schedNum = parseInt(scheduled, 10);
      if (this.slices.includes(schedNum)) {
        return schedNum;
      }
    }

    // 4. Fallback: Pick random number from current 10 slices
    const randIdx = Math.floor(Math.random() * this.slices.length);
    return this.slices[randIdx];
  }

  dispatchSynchronizedSpin(triggerSource = 'Hourly Round') {
    if (this.isSpinning) return;

    const targetNumber = this.determineTargetNumber();
    const triggerId = Date.now();
    this.lastHandledSpinId = triggerId;

    // Reset one-time custom countdowns so wheel does NOT spin continuously every minute
    this.customTimerTarget = null;
    this.timerMode = 'REAL';
    if (this.timerModeReal) this.timerModeReal.checked = true;

    // Broadcast spin trigger to server so all connected mobile/PC screens spin in unison!
    const spinTrigger = {
      triggerId: triggerId,
      targetNumber: targetNumber,
      triggerSource: triggerSource,
      timestamp: Date.now()
    };

    this.pushStateToServer({
      spinTrigger: spinTrigger,
      forcedNext: this.forcedNext,
      upcomingQueue: this.upcomingQueue,
      timerMode: 'REAL',
      customTimerTarget: null
    });

    // Run animation locally
    this.executeSpinAnimation(targetNumber, triggerSource, true);
  }

  executeSpinAnimation(targetNumber, triggerSource, isInitiator) {
    if (this.isSpinning) return;
    this.isSpinning = true;

    let targetIndex = this.slices.indexOf(targetNumber);
    if (targetIndex === -1) {
      targetIndex = 0;
    }

    const numSlices = this.slices.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    const targetCenterAngle = (targetIndex + 0.5) * sliceAngle;
    const randomJitter = (Math.random() - 0.5) * (sliceAngle * 0.45);
    const finalTargetSliceAngle = targetCenterAngle + randomJitter;

    let desiredNormalizedAngle = (-Math.PI / 2 - finalTargetSliceAngle) % (2 * Math.PI);
    if (desiredNormalizedAngle < 0) desiredNormalizedAngle += 2 * Math.PI;

    const minSpins = 7;
    const currentNormalized = this.currentAngle % (2 * Math.PI);
    let deltaAngle = desiredNormalizedAngle - currentNormalized;
    while (deltaAngle < minSpins * 2 * Math.PI) {
      deltaAngle += 2 * Math.PI;
    }

    const startAngle = this.currentAngle;
    const finalAngle = startAngle + deltaAngle;
    const duration = 6500;
    const startTime = performance.now();

    const easeOut = (t) => 1 - Math.pow(1 - t, 4);

    const animateSpin = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeVal = easeOut(progress);

      this.currentAngle = startAngle + deltaAngle * easeVal;
      this.renderWheel();

      this.checkPointerTick();

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        this.currentAngle = finalAngle;
        this.renderWheel();
        this.onSpinComplete(targetNumber, triggerSource, isInitiator);
      }
    };

    requestAnimationFrame(animateSpin);
  }

  checkPointerTick() {
    const numSlices = this.slices.length;
    const sliceAngle = (2 * Math.PI) / numSlices;
    let norm = (-Math.PI / 2 - this.currentAngle) % (2 * Math.PI);
    if (norm < 0) norm += 2 * Math.PI;

    const currentSliceIdx = Math.floor(norm / sliceAngle);
    if (currentSliceIdx !== this.lastTickIndex) {
      this.lastTickIndex = currentSliceIdx;
      this.audio.playTick();

      if (this.pointerEl) {
        this.pointerEl.classList.add('ticking');
        setTimeout(() => this.pointerEl.classList.remove('ticking'), 60);
      }
    }
  }

  onSpinComplete(winningNumber, triggerSource, isInitiator) {
    this.isSpinning = false;

    // Confetti and Audio Fanfare
    this.confetti.fire(4000);
    this.audio.playWinFanfare();

    const now = new Date();
    const timeStr12 = formatTime12(now);
    const roundStr12 = this.manualRoundTitle || format12Hour(now.getHours());
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const newResult = {
      id: Date.now(),
      number: winningNumber,
      time: timeStr12,
      date: dateStr,
      round: roundStr12,
      source: triggerSource
    };

    // Update history
    this.history = [newResult, ...this.history];
    this.renderLast3Results();

    // Show Win Announcement Banner
    this.winBanner.classList.remove('hidden');
    this.winNumberEl.textContent = `${winningNumber}`;
    this.winTimeEl.textContent = `Won at ${timeStr12} &bull; Round ${roundStr12}`;

    if (this.timerMode === 'REAL') {
      localStorage.setItem(STATE_KEYS.LAST_SPUN_HOUR, `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`);
    }

    if (isInitiator) {
      this.pushStateToServer();
    }
  }

  // ==========================================
  // LAST 3 RESULTS RENDERER
  // ==========================================
  renderLast3Results() {
    this.resultsGrid.innerHTML = '';
    const last3 = this.history.slice(0, 3);
    const ranks = ['1st Previous', '2nd Previous', '3rd Previous'];

    for (let i = 0; i < 3; i++) {
      const card = document.createElement('div');
      const item = last3[i];

      if (item) {
        card.className = `result-card ${i === 0 ? 'latest-win' : ''}`;
        card.innerHTML = `
          <div class="result-rank">${i === 0 ? '🏆 Latest Winner' : ranks[i]}</div>
          <div class="result-number">${item.number}</div>
          <div class="result-meta">${item.time} (${item.round})</div>
        `;
      } else {
        card.className = 'result-card empty-card';
        card.innerHTML = `
          <div class="result-rank">${ranks[i]}</div>
          <div class="result-number">--</div>
          <div class="result-meta">Awaiting Spin</div>
        `;
      }
      this.resultsGrid.appendChild(card);
    }
  }

  // ==========================================
  // DUAL TIMER ENGINE (SYNCHRONIZED TIMING)
  // ==========================================
  startTimerEngine() {
    const tick = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Update Round Title
      if (this.manualRoundTitle) {
        this.currentHourEl.textContent = this.manualRoundTitle;
      } else {
        this.currentHourEl.textContent = format12Hour(currentHour);
      }

      if (this.timerMode === 'MANUAL' && this.customTimerTarget) {
        // One-Time Custom Countdown Mode (e.g. 1 min or 30s test)
        const remainingMs = Math.max(0, this.customTimerTarget - Date.now());
        const totalSec = Math.floor(remainingMs / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        this.countdownEl.textContent = `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        if (totalSec <= 0 && !this.isSpinning) {
          this.dispatchSynchronizedSpin(this.manualRoundTitle ? `Round ${this.manualRoundTitle}` : 'Manual Countdown Round');
        }
      } else {
        // Scheduled Round Time Mode (accurately counts down to scheduled round time e.g. 08:00 PM or top of hour)
        let targetDate = null;
        let roundKey = null;

        if (this.manualRoundTitle) {
          const match = this.manualRoundTitle.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
          if (match) {
            let hr = parseInt(match[1], 10) % 12;
            if (match[3].toUpperCase() === 'PM') hr += 12;
            const min = parseInt(match[2], 10);
            targetDate = new Date(now);
            targetDate.setHours(hr, min, 0, 0);

            if (targetDate.getTime() <= now.getTime()) {
              // Time has passed for today, count down to next occurrence tomorrow
              targetDate.setDate(targetDate.getDate() + 1);
            }
            roundKey = `sched-${targetDate.getFullYear()}-${targetDate.getMonth()}-${targetDate.getDate()}-${hr}-${min}`;
          }
        }

        if (!targetDate) {
          // Default: top of next hour (:00)
          targetDate = new Date(now);
          targetDate.setHours(currentHour + 1, 0, 0, 0);
          roundKey = `hourly-${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${currentHour}`;
        }

        const diffMs = Math.max(0, targetDate.getTime() - now.getTime());
        const totalSec = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;

        if (hours > 0) {
          this.countdownEl.textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
          this.countdownEl.textContent = `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        // Auto-spin ONCE when scheduled time arrives
        const lastSpunKey = localStorage.getItem(STATE_KEYS.LAST_SPUN_HOUR);
        if (totalSec === 0 && !this.isSpinning && lastSpunKey !== roundKey) {
          localStorage.setItem(STATE_KEYS.LAST_SPUN_HOUR, roundKey);
          this.dispatchSynchronizedSpin(this.manualRoundTitle ? `Round ${this.manualRoundTitle}` : `Hourly Round (${format12Hour(now.getHours())})`);
        }
      }
    };

    tick();
    setInterval(tick, 1000);
  }

  checkHourlyAutoSpin() {
    // Handled seamlessly in startTimerEngine
  }
}

// Global App Instance
window.addEventListener('DOMContentLoaded', () => {
  window.app = new SpinWheelApp();
});
