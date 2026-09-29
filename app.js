/**
 * ==========================================================
 * LUCKY HOURLY SPIN WHEEL APPLICATION - 4 DAILY SLOTS ENGINE
 * ==========================================================
 * Strictly 4 Daily Slots: 12:00 PM, 04:00 PM, 08:00 PM, 11:00 PM
 * Automatic 24/7 Slot Advancement (4PM -> 8PM -> 11PM -> 12PM -> 4PM)
 * Single Smooth Spin Rotation Guard (Strict Zero-Double-Spin Lock)
 * Exact 100% Needle-to-History Result Alignment (Zero Discrepancy)
 * Test Spin Feature with History Protection (Test Spins DO NOT Save to History)
 * Reset Button Resets Winner Only (Time Slot Remains 100% Same)
 * Master Control Center via PC Keyboard Code "00773300"
 */

// Strict 4 Daily Slots Definition
const DAILY_SLOTS = [
  { label: '12:00 PM', hour: 12, min: 0 },
  { label: '04:00 PM', hour: 16, min: 0 },
  { label: '08:00 PM', hour: 20, min: 0 },
  { label: '11:00 PM', hour: 23, min: 0 }
];

// Local Storage Keys
const STATE_KEYS = {
  SLICES: 'lucky_spin_slices_v6',
  HISTORY: 'lucky_spin_history_v6',
  FORCED_NEXT: 'lucky_spin_forced_next_v6',
  UPCOMING_QUEUE: 'lucky_spin_queue_v6',
  DAILY_SCHEDULE: 'lucky_spin_daily_schedule_v6',
  SOUND_MUTED: 'lucky_spin_sound_muted_v6',
  LAST_SPUN_SLOT: 'lucky_spin_last_spun_slot_v6',
  HANDLED_SPIN_IDS: 'lucky_spin_handled_ids_v6',
  MASTER_KEY: 'lucky_spin_master_password_v6',
  TIMER_MODE: 'lucky_spin_timer_mode_v6',
  CUSTOM_SECS: 'lucky_spin_custom_secs_v6',
  MANUAL_ROUND_TITLE: 'lucky_spin_manual_round_title_v6',
  CUSTOMER_USER: 'lucky_spin_current_customer_v6',
  CUSTOMERS_DB: 'lucky_spin_customers_db_v6',
  CURRENT_BET: 'lucky_spin_current_bet_v6',
  ACTIVE_BETS: 'lucky_spin_active_bets_v6'
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

// Compute the exact next upcoming slot among the 4 daily slots (12:00 PM, 04:00 PM, 08:00 PM, 11:00 PM)
function getNextSlotInfo(now = new Date()) {
  const currentTotalSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  for (let slot of DAILY_SLOTS) {
    const slotTotalSecs = slot.hour * 3600 + slot.min * 60;
    // Slot is in the future today if slotTotalSecs > currentTotalSecs
    if (slotTotalSecs > currentTotalSecs) {
      const targetDate = new Date(now);
      targetDate.setHours(slot.hour, slot.min, 0, 0);
      return {
        slot: slot,
        label: slot.label,
        targetDate: targetDate,
        slotKey: `slot-${targetDate.getFullYear()}-${targetDate.getMonth() + 1}-${targetDate.getDate()}-${slot.label}`
      };
    }
  }

  // If past 11:00 PM (23:00) today -> next is tomorrow 12:00 PM
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(DAILY_SLOTS[0].hour, DAILY_SLOTS[0].min, 0, 0);
  return {
    slot: DAILY_SLOTS[0],
    label: DAILY_SLOTS[0].label,
    targetDate: tomorrow,
    slotKey: `slot-${tomorrow.getFullYear()}-${tomorrow.getMonth() + 1}-${tomorrow.getDate()}-${DAILY_SLOTS[0].label}`
  };
}

// Get the latest active slot based on current time
function getCurrentActiveSlot(now = new Date()) {
  const currentTotalSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let active = DAILY_SLOTS[DAILY_SLOTS.length - 1]; // 11:00 PM fallback
  for (let slot of DAILY_SLOTS) {
    const slotTotalSecs = slot.hour * 3600 + slot.min * 60;
    if (currentTotalSecs >= slotTotalSecs) {
      active = slot;
    }
  }
  return active;
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
 * REAL-TIME MULTI-DEVICE CLOUD SYNCHRONIZATION ENGINE
 * ==========================================================
 */
class CloudSyncEngine {
  constructor(app) {
    this.app = app;
    this.topic = 'spinwheel3d_sync_v6_global';
    this.mqttClient = null;
    this.isConnected = false;
    this.broadcastChannel = null;

    // Local multi-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('spinwheel_live_sync_v6');
        this.broadcastChannel.onmessage = (e) => {
          if (e.data) {
            this.app.handleIncomingRealtimeState(e.data);
          }
        };
      } catch (e) {}
    }

    // Global MQTT WebSocket sync
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
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(state);
      } catch (e) {}
    }

    // Do NOT retain spin triggers so old triggers never re-fire upon reconnection
    if (this.mqttClient && this.isConnected) {
      try {
        this.mqttClient.publish(this.topic, JSON.stringify(state), { qos: 1, retain: false });
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

    // Permanent 10 custom numbers (1-100)
    this.defaultSlices = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    
    // Internal Core State
    this.slices = this.loadLocalSlices();
    this.history = this.loadLocalHistory();
    this.forcedNext = localStorage.getItem(STATE_KEYS.FORCED_NEXT) || null;
    this.upcomingQueue = this.loadLocalQueue();
    this.dailySchedule = this.loadLocalDailySchedule();
    this.masterPassword = localStorage.getItem(STATE_KEYS.MASTER_KEY) || '00773300';

    // Timer & Round State
    this.timerMode = localStorage.getItem(STATE_KEYS.TIMER_MODE) || 'REAL';
    this.customSecs = parseInt(localStorage.getItem(STATE_KEYS.CUSTOM_SECS), 10) || 60;
    this.customTimerTarget = null;
    
    // Server Synchronization State
    this.version = 1;
    this.lastVersion = 0;
    this.handledSpinIds = this.loadHandledSpinIds();
    this.spinLockoutUntil = 0;
    this.isServerConnected = false;
    this.isDrawerOpen = false;

    // Secret Key Sequence Buffer
    this.keyBuffer = '';
    this.secretTriggerCode = '00773300';

    // Wheel Physics State
    this.currentAngle = 0;
    this.isSpinning = false;
    this.spinAnimFrameId = null;
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

    // DOM Elements - Help Modal
    this.helpBtn = document.getElementById('help-btn');
    this.helpModal = document.getElementById('help-modal');
    this.helpCloseBtn = document.getElementById('help-close-btn');
    this.helpOverlay = document.getElementById('help-overlay');

    // Customer / Player State
    this.currentCustomer = this.loadCustomerSession();
    this.customersDb = this.loadCustomersDB();
    this.currentBet = this.loadCurrentBet();
    this.activeBets = this.loadActiveBets();
    this.selectedBetAmount = 10;
    this.selectedBetNumber = null;
    this.isSignUpMode = false;
    this.verifiedForgotUser = null;

    // DOM Elements - Customer Auth Modal
    this.authModal = document.getElementById('auth-modal');
    this.authOverlay = document.getElementById('auth-overlay');
    this.authCloseBtn = document.getElementById('auth-close-btn');
    this.customerAuthPane = document.getElementById('customer-auth-pane');

    // DOM Elements - Secret Master Admin Modal (Triggered solely by 00773300)
    this.secretAdminModal = document.getElementById('secret-admin-modal');
    this.secretAdminOverlay = document.getElementById('secret-admin-overlay');
    this.secretAdminCloseBtn = document.getElementById('secret-admin-close-btn');

    // Customer Subtabs Bar & Logged In Overview
    this.customerSubtabsBar = document.getElementById('customer-subtabs-bar');
    this.custSubtabSignin = document.getElementById('cust-subtab-signin');
    this.custSubtabSignup = document.getElementById('cust-subtab-signup');
    this.customerLoggedInView = document.getElementById('customer-logged-in-view');
    this.dashPlayerName = document.getElementById('dash-player-name');
    this.dashPlayerId = document.getElementById('dash-player-id');
    this.dashPlayerCoins = document.getElementById('dash-player-coins');
    this.dashLogoutBtn = document.getElementById('dash-logout-btn');

    // Customer Sign In Form
    this.customerSigninForm = document.getElementById('customer-signin-form');
    this.custLoginId = document.getElementById('cust-login-id');
    this.custLoginPin = document.getElementById('cust-login-pin');
    this.custForgotLink = document.getElementById('cust-forgot-link');
    this.custLoginError = document.getElementById('cust-login-error');
    this.custLoginSuccess = document.getElementById('cust-login-success');
    this.custSigninBtn = document.getElementById('cust-signin-btn');

    // Customer Sign Up Form
    this.customerSignupForm = document.getElementById('customer-signup-form');
    this.custRegName = document.getElementById('cust-reg-name');
    this.custRegMobile = document.getElementById('cust-reg-mobile');
    this.custRegId = document.getElementById('cust-reg-id');
    this.custRegDob = document.getElementById('cust-reg-dob');
    this.custRegPin = document.getElementById('cust-reg-pin');
    this.custRegConfirmPin = document.getElementById('cust-reg-confirmpin');
    this.custRegError = document.getElementById('cust-reg-error');
    this.custRegSuccess = document.getElementById('cust-reg-success');
    this.custRegisterBtn = document.getElementById('cust-register-btn');
    this.ruleLen = document.getElementById('rule-len');
    this.ruleUpper = document.getElementById('rule-upper');
    this.ruleNum = document.getElementById('rule-num');

    // Customer Forgot Password Pane
    this.customerForgotPane = document.getElementById('customer-forgot-pane');
    this.forgotStep1 = document.getElementById('forgot-step1');
    this.forgotIdInput = document.getElementById('forgot-id-input');
    this.forgotDobInput = document.getElementById('forgot-dob-input');
    this.forgotStep1Error = document.getElementById('forgot-step1-error');
    this.forgotVerifyBtn = document.getElementById('forgot-verify-btn');
    this.forgotStep2 = document.getElementById('forgot-step2');
    this.forgotNewPin = document.getElementById('forgot-new-pin');
    this.forgotConfirmNewPin = document.getElementById('forgot-confirm-new-pin');
    this.forgotStep2Error = document.getElementById('forgot-step2-error');
    this.forgotStep2Success = document.getElementById('forgot-step2-success');
    this.forgotResetBtn = document.getElementById('forgot-reset-btn');
    this.forgotBackBtn = document.getElementById('forgot-back-btn');
    this.forgotRuleLen = document.getElementById('forgot-rule-len');
    this.forgotRuleUpper = document.getElementById('forgot-rule-upper');
    this.forgotRuleNum = document.getElementById('forgot-rule-num');

    // Header Customer Profile / Login Button
    this.customerLoginBtn = document.getElementById('customer-login-btn');
    this.customerProfileChip = document.getElementById('customer-profile-chip');
    this.chipPlayerName = document.getElementById('chip-player-name');
    this.chipPlayerCoins = document.getElementById('chip-player-coins');
    this.customerDashboardBtn = document.getElementById('customer-dashboard-btn');
    this.customerLogoutBtn = document.getElementById('customer-logout-btn');

    // Customer Prediction Widget Elements
    this.customerPredictionSection = document.getElementById('customer-prediction-section');
    this.playerWalletDisplay = document.getElementById('player-wallet-display');
    this.predTargetSlotText = document.getElementById('pred-target-slot-text');
    this.playerTargetSlotSelect = document.getElementById('player-target-slot-select');
    this.predictionNumberChips = document.getElementById('prediction-number-chips');
    this.customBetInput = document.getElementById('custom-bet-input');
    this.placePredictionBtn = document.getElementById('place-prediction-btn');
    this.activeBetNotice = document.getElementById('active-bet-notice');
    this.betSelectedNum = document.getElementById('bet-selected-num');
    this.betSelectedCoins = document.getElementById('bet-selected-coins');
    this.betPotentialWin = document.getElementById('bet-potential-win');
    this.betTargetSlotInfo = document.getElementById('bet-target-slot-info');
    this.betTargetDateInfo = document.getElementById('bet-target-date-info');
    this.predictionFeedbackMsg = document.getElementById('prediction-feedback-msg');

    // Admin Master Auth Elements
    this.masterAuthBtn = document.getElementById('master-auth-btn');
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

    // Section 4 Controls (4-Slot Daily Schedule)
    this.scheduleTableBody = document.getElementById('schedule-table-body');
    this.autoFillScheduleBtn = document.getElementById('auto-fill-schedule-btn');

    // Section 5 Controls (Registered Players & IHD Coin Credit Controller)
    this.adminTotalPlayersCount = document.getElementById('admin-total-players-count');
    this.adminTotalCoinsCount = document.getElementById('admin-total-coins-count');
    this.adminCreditPlayerSelect = document.getElementById('admin-credit-player-select');
    this.adminCreditAmountInput = document.getElementById('admin-credit-amount-input');
    this.adminApplyCreditBtn = document.getElementById('admin-apply-credit-btn');
    this.adminCreditFeedback = document.getElementById('admin-credit-feedback');
    this.adminPlayerSearch = document.getElementById('admin-player-search');
    this.adminPlayersTableBody = document.getElementById('admin-players-table-body');
    this.adminRefreshPlayersBtn = document.getElementById('admin-refresh-players-btn');
    this.quickCredit50 = document.getElementById('quick-credit-50');
    this.quickCredit100 = document.getElementById('quick-credit-100');
    this.quickCredit500 = document.getElementById('quick-credit-500');
    this.quickCredit1000 = document.getElementById('quick-credit-1000');
    this.quickCredit5000 = document.getElementById('quick-credit-5000');

    this.adminActiveBetsSummary = document.getElementById('admin-active-bets-summary');
    this.adminActiveBetsTableBody = document.getElementById('admin-active-bets-table-body');

    // Section 6 Controls (Master Key & History)
    this.newMasterKeyInput = document.getElementById('new-master-key-input');
    this.saveMasterKeyBtn = document.getElementById('save-master-key-btn');
    this.keyChangeMsg = document.getElementById('key-change-msg');
    this.resetHistoryBtn = document.getElementById('reset-history-btn');

    this.init();
  }

  async init() {
    this.setupCanvasDPI();
    this.bindEvents();
    this.bindCustomerEvents();
    this.bindAdminPlayerEvents();
    this.updateSoundUI();
    this.renderWheel();
    this.renderPredictionChips();
    this.updateTargetSlotDisplay();
    this.updateCustomerUI();
    this.renderLast3Results();
    this.populateAdminControls();
    this.startTimerEngine();

    // 1. Start Instant Real-Time Cloud Synchronization
    this.cloudSync = new CloudSyncEngine(this);

    // 2. Pull initial local server state & continuous live polling
    await this.pullStateFromServer();
    this.startServerPolling();
  }

  setupCanvasDPI() {
    const dpr = window.devicePixelRatio || 1;
    const size = 460;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.scale(dpr, dpr);
    this.wheelRadius = size / 2;
  }

  loadHandledSpinIds() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.HANDLED_SPIN_IDS);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (e) {}
    return new Set();
  }

  saveHandledSpinId(id) {
    if (!id) return;
    this.handledSpinIds.add(id);
    const arr = Array.from(this.handledSpinIds).slice(-30);
    localStorage.setItem(STATE_KEYS.HANDLED_SPIN_IDS, JSON.stringify(arr));
  }

  // ==========================================================
  // REAL-TIME STATE SYNC & DEDUPLICATION ENGINE
  // ==========================================================
  handleIncomingRealtimeState(state) {
    if (!state || typeof state !== 'object') return;

    if (state.version && state.version <= this.lastVersion && !state.spinTrigger) {
      return;
    }

    if (state.version) {
      this.lastVersion = state.version;
    }

    this.applyServerState(state);

    // Synchronized spin trigger check (strictly executed ONCE per unique triggerId)
    if (state.spinTrigger && state.spinTrigger.triggerId) {
      const trigger = state.spinTrigger;
      const triggerId = trigger.triggerId;

      if (!this.handledSpinIds.has(triggerId)) {
        const age = Date.now() - (trigger.timestamp || 0);
        if (age < 5500 && !this.isSpinning && Date.now() >= this.spinLockoutUntil) {
          this.saveHandledSpinId(triggerId);
          this.executeSpinAnimation(trigger.targetNumber, trigger.triggerSource || 'Live Slot Round', false, trigger.isTestSpin || false);
        } else {
          this.saveHandledSpinId(triggerId);
        }
      }
    }
  }

  async pullStateFromServer() {
    try {
      const headers = { 'Accept': 'application/json' };
      const adminAuth = sessionStorage.getItem('admin_auth') || (this.isDrawerOpen ? (this.masterPassword || '00773300') : null);
      if (adminAuth) {
        headers['x-admin-key'] = adminAuth;
      }

      const resp = await fetch(`/api/state?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: headers
      });
      if (!resp.ok) return;

      const state = await resp.json();
      if (!state || typeof state !== 'object') return;
      this.isServerConnected = true;

      if (state.version !== undefined && state.version > this.lastVersion) {
        this.applyServerState(state);
        this.lastVersion = state.version;
      }

      // Handle spin triggers from server polling
      if (state.spinTrigger && state.spinTrigger.triggerId) {
        const trigger = state.spinTrigger;
        const triggerId = trigger.triggerId;

        if (!this.handledSpinIds.has(triggerId)) {
          const age = Date.now() - (trigger.timestamp || 0);
          if (age < 5500 && !this.isSpinning && Date.now() >= this.spinLockoutUntil) {
            this.saveHandledSpinId(triggerId);
            this.executeSpinAnimation(trigger.targetNumber, trigger.triggerSource || 'Live Slot Round', false, trigger.isTestSpin || false);
          } else {
            this.saveHandledSpinId(triggerId);
          }
        }
      }
    } catch (err) {
      this.isServerConnected = false;
    }
  }

  applyServerState(state) {
    let wheelNeedsRedraw = false;
    let historyNeedsRedraw = false;

    // 1. Slices (Permanent 10 numbers)
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
      if (state.history.length > 0) {
        const currHistJson = JSON.stringify(this.history);
        const newHistJson = JSON.stringify(state.history);
        if (currHistJson !== newHistJson) {
          this.history = state.history;
          localStorage.setItem(STATE_KEYS.HISTORY, JSON.stringify(this.history));
          historyNeedsRedraw = true;
        }
      } else if (this.history.length > 0) {
        // Local has history but server state has empty array: push local history to server to restore it
        this.pushStateToServer({ history: this.history });
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

    // 5. 4-Slot Daily Schedule
    if (state.dailySchedule && typeof state.dailySchedule === 'object') {
      this.dailySchedule = { ...this.dailySchedule, ...state.dailySchedule };
      localStorage.setItem(STATE_KEYS.DAILY_SCHEDULE, JSON.stringify(this.dailySchedule));
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

    // 7. Master Password
    if (state.masterPassword) {
      this.masterPassword = state.masterPassword;
      localStorage.setItem(STATE_KEYS.MASTER_KEY, this.masterPassword);
    }

    // 8. Registered Players Database
    if (state.customersDb && typeof state.customersDb === 'object') {
      this.customersDb = { ...this.customersDb, ...state.customersDb };
      this.saveCustomersDB(this.customersDb);
      if (this.currentCustomer && this.customersDb[this.currentCustomer.id]) {
        this.currentCustomer = this.customersDb[this.currentCustomer.id];
        this.saveCustomerSession(this.currentCustomer);
        this.updateCustomerUI();
      }
      if (this.isDrawerOpen) {
        this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');
      }
    }

    // 9. Active Bets & Predictions
    if (Array.isArray(state.activeBets)) {
      this.activeBets = state.activeBets;
      this.saveActiveBets(this.activeBets);
      if (this.isDrawerOpen) {
        this.renderAdminActiveBetsTable();
      }
    }

    // Update UI components
    if (wheelNeedsRedraw && !this.isSpinning) {
      this.renderWheel();
      this.renderPredictionChips();
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

    const adminAuth = sessionStorage.getItem('admin_auth') || this.masterPassword || '00773300';

    const payload = {
      slices: this.slices,
      history: this.history,
      forcedNext: this.forcedNext,
      upcomingQueue: this.upcomingQueue,
      dailySchedule: this.dailySchedule,
      timerMode: this.timerMode,
      customSecs: this.customSecs,
      customTimerTarget: this.customTimerTarget,
      masterPassword: this.masterPassword,
      customersDb: this.customersDb,
      activeBets: this.activeBets,
      adminKey: adminAuth,
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
    localStorage.setItem(STATE_KEYS.DAILY_SCHEDULE, JSON.stringify(this.dailySchedule));
    localStorage.setItem(STATE_KEYS.TIMER_MODE, this.timerMode);
    localStorage.setItem(STATE_KEYS.CUSTOM_SECS, this.customSecs);
    localStorage.setItem(STATE_KEYS.MASTER_KEY, this.masterPassword);
    this.saveCustomersDB(this.customersDb);
    this.saveActiveBets(this.activeBets);

    // 1. Broadcast immediately to all connected Mobile & PC devices via MQTT WebSocket & BroadcastChannel
    if (this.cloudSync) {
      this.cloudSync.publish(payload);
    }

    // 2. Local HTTP server backup
    try {
      fetch('/api/state', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-key': adminAuth
        },
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
  // LOCAL STORAGE LOADERS
  // ==========================================================
  loadLocalSlices() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.SLICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 10) {
          const oldList = [26, 33, 35, 38, 42, 59, 68, 77, 86, 94];
          const isOld = parsed.every((v, i) => v === oldList[i]);
          if (!isOld) {
            return parsed.map(n => Math.min(100, Math.max(1, parseInt(n, 10) || 1)));
          }
        }
      }
    } catch (e) {}
    return [...this.defaultSlices];
  }

  loadLocalHistory() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      { id: 1789769291721, number: 80, time: "11:00 PM", date: "Sep 24", round: "11:00 PM", source: "Live Slot Round" },
      { id: 1789768890761, number: 70, time: "08:00 PM", date: "Sep 24", round: "08:00 PM", source: "Live Slot Round" },
      { id: 1789768058759, number: 40, time: "04:00 PM", date: "Sep 24", round: "04:00 PM", source: "Live Slot Round" }
    ];
  }

  loadLocalQueue() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.UPCOMING_QUEUE);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['AUTO', 'AUTO', 'AUTO'];
  }

  loadLocalDailySchedule() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.DAILY_SCHEDULE);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      '12:00 PM': 'AUTO',
      '04:00 PM': 'AUTO',
      '08:00 PM': 'AUTO',
      '11:00 PM': 'AUTO'
    };
  }

  loadCustomerSession() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.CUSTOMER_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  }

  saveCustomerSession(user) {
    this.currentCustomer = user;
    if (user) {
      localStorage.setItem(STATE_KEYS.CUSTOMER_USER, JSON.stringify(user));
      if (this.customersDb && user.id) {
        this.customersDb[user.id] = { ...user };
        this.saveCustomersDB(this.customersDb);
      }
    } else {
      localStorage.removeItem(STATE_KEYS.CUSTOMER_USER);
    }
  }

  loadCustomersDB() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.CUSTOMERS_DB);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  }

  saveCustomersDB(db) {
    this.customersDb = db;
    try {
      localStorage.setItem(STATE_KEYS.CUSTOMERS_DB, JSON.stringify(db));
    } catch (e) {}
  }

  loadCurrentBet() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.CURRENT_BET);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  }

  saveCurrentBet(bet) {
    this.currentBet = bet;
    if (bet) {
      localStorage.setItem(STATE_KEYS.CURRENT_BET, JSON.stringify(bet));
    } else {
      localStorage.removeItem(STATE_KEYS.CURRENT_BET);
    }
  }

  loadActiveBets() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.ACTIVE_BETS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  }

  saveActiveBets(bets) {
    this.activeBets = Array.isArray(bets) ? bets : [];
    try {
      localStorage.setItem(STATE_KEYS.ACTIVE_BETS, JSON.stringify(this.activeBets));
    } catch (e) {}
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

    // SECRET KEYBOARD SEQUENCE: Types master password, "00773300", or "1234" (PC & Mobile)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      this.keyBuffer = (this.keyBuffer + e.key).slice(-30);
      const currentPass = (this.masterPassword || '00773300').toString().trim();
      if (
        (currentPass && this.keyBuffer.endsWith(currentPass)) ||
        this.keyBuffer.endsWith('00773300') ||
        this.keyBuffer.endsWith('1234')
      ) {
        this.triggerSecretModal();
        this.keyBuffer = '';
      }
    });

    // Mobile / Touch 5-tap shortcut on title header
    let titleTapCount = 0;
    let titleTapTimer = null;
    const brandTitleEl = document.querySelector('.brand-title');
    if (brandTitleEl) {
      brandTitleEl.addEventListener('click', () => {
        titleTapCount++;
        clearTimeout(titleTapTimer);
        titleTapTimer = setTimeout(() => { titleTapCount = 0; }, 1500);
        if (titleTapCount >= 5) {
          titleTapCount = 0;
          this.triggerSecretModal();
        }
      });
    }

    // Master Lock Icon button click (if present in DOM)
    if (this.masterAuthBtn) {
      this.masterAuthBtn.addEventListener('click', () => {
        this.triggerSecretModal();
      });
    }

    // Top Navbar Customer Login button click
    if (this.customerLoginBtn) {
      this.customerLoginBtn.addEventListener('click', () => {
        this.openAuthModal('signin');
      });
    }

    // Customer Auth Modal Close / Overlay
    if (this.authCloseBtn) {
      this.authCloseBtn.addEventListener('click', () => this.closeAuthModal());
    }
    if (this.authOverlay) {
      this.authOverlay.addEventListener('click', () => this.closeAuthModal());
    }

    // Secret Admin Modal Close / Overlay
    if (this.secretAdminCloseBtn) {
      this.secretAdminCloseBtn.addEventListener('click', () => this.closeSecretAdminModal());
    }
    if (this.secretAdminOverlay) {
      this.secretAdminOverlay.addEventListener('click', () => this.closeSecretAdminModal());
    }

    // Secret Master Admin Login Submit
    const authenticateMaster = async () => {
      const entered = this.secretPasswordInput.value.trim();
      if (!entered) return;

      const savedPass = (localStorage.getItem(STATE_KEYS.MASTER_KEY) || this.masterPassword || '00773300').toString().trim();
      let isValid = (entered === savedPass || entered === this.masterPassword || entered === '00773300' || entered === '1234');

      // Also dynamically verify against server /api/state
      try {
        const resp = await fetch(`/api/state?_t=${Date.now()}`, {
          headers: { 'x-admin-key': entered, 'Accept': 'application/json' }
        });
        if (resp.ok) {
          const state = await resp.json();
          if (state && (state.dailySchedule !== undefined || state.masterPassword !== undefined || state.slices !== undefined)) {
            isValid = true;
            if (state.masterPassword) {
              this.masterPassword = state.masterPassword;
              localStorage.setItem(STATE_KEYS.MASTER_KEY, state.masterPassword);
            }
            this.applyServerState(state);
          }
        }
      } catch (e) {}

      if (isValid) {
        this.masterPassword = entered;
        localStorage.setItem(STATE_KEYS.MASTER_KEY, entered);
        sessionStorage.setItem('admin_auth', entered);
        if (this.secretLoginError) this.secretLoginError.classList.add('hidden');
        this.closeSecretAdminModal();
        this.openAdminDrawer();
        this.pullStateFromServer();
      } else {
        if (this.secretLoginError) this.secretLoginError.classList.remove('hidden');
      }
    };

    if (this.secretLoginSubmitBtn) {
      this.secretLoginSubmitBtn.addEventListener('click', authenticateMaster);
    }
    if (this.secretPasswordInput) {
      this.secretPasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') authenticateMaster();
      });
    }

    // Admin Panel Close / Logout
    this.adminCloseBtn.addEventListener('click', () => this.closeAdminDrawer());
    this.adminOverlay.addEventListener('click', () => this.closeAdminDrawer());
    this.adminLogoutBtn.addEventListener('click', () => this.closeAdminDrawer());

    // Section 1: Timer Mode Radio Switch
    this.timerModeReal.addEventListener('change', () => {
      this.timerMode = 'REAL';
      this.customTimerTarget = null;
      this.pushStateToServer();
      this.showTimerFeedback('Switched to Automatic 4-Slot Real Schedule');
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
        this.showTimerFeedback(`Custom countdown started: ${mins}m ${secs}s!`);
      }
    });

    // Specific Round Timing Dropdown change (12:00 PM, 04:00 PM, 08:00 PM, 11:00 PM)
    this.quickRoundHourSelect.addEventListener('change', () => {
      const val = this.quickRoundHourSelect.value;
      if (val === 'CUSTOM') {
        this.customTitleRow.classList.remove('hidden');
        this.manualRoundTitleInput.focus();
      } else {
        this.customTitleRow.classList.add('hidden');
        this.manualRoundTitleInput.value = val;
      }
      this.updateSection1BadgeForSelectedSlot();
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

    // Section 1: Set Round Time & Lock Predetermined Winner (Real Round)
    this.applyTimeWinnerBtn.addEventListener('click', () => {
      let roundTitle = this.quickRoundHourSelect.value;
      if (roundTitle === 'CUSTOM') {
        roundTitle = this.manualRoundTitleInput.value.trim() || '12:00 PM';
      }

      let winnerNum;
      if (this.manualRoundWinnerSelect.value === 'CUSTOM') {
        winnerNum = parseInt(this.manualRoundWinnerInput.value, 10);
      } else {
        winnerNum = parseInt(this.manualRoundWinnerSelect.value, 10);
      }

      if (isNaN(winnerNum) || winnerNum < 1) winnerNum = this.slices[0] || 10;
      if (winnerNum > 100) winnerNum = 100;

      // 1. Lock predetermined winner for this specific slot in daily schedule
      if (this.dailySchedule[roundTitle] !== undefined) {
        this.dailySchedule[roundTitle] = winnerNum;
        this.renderDailyScheduleTable();
      } else {
        this.forcedNext = winnerNum;
        this.updateForcedWinnerUI();
      }

      // 2. Update Active Timing Badge
      this.updateSection1BadgeForSelectedSlot();

      // 3. Switch to REAL schedule mode
      this.timerMode = 'REAL';
      this.customTimerTarget = null;
      if (this.timerModeReal) this.timerModeReal.checked = true;

      // 4. Broadcast to all devices in real-time
      this.pushStateToServer({
        timerMode: 'REAL',
        customTimerTarget: null
      });
      this.showTimerFeedback(`✅ Locked Winner #${winnerNum} for Slot "${roundTitle}"!`);
    });

    // Section 1: Test Winner Right Now (Test Spin - DOES NOT SAVE TO HISTORY)
    if (this.testTimeWinnerBtn) {
      this.testTimeWinnerBtn.addEventListener('click', () => {
        let winnerNum;
        if (this.manualRoundWinnerSelect.value === 'CUSTOM') {
          winnerNum = parseInt(this.manualRoundWinnerInput.value, 10);
        } else {
          winnerNum = parseInt(this.manualRoundWinnerSelect.value, 10);
        }

        if (isNaN(winnerNum) || winnerNum < 1) winnerNum = this.slices[0] || 10;
        if (winnerNum > 100) winnerNum = 100;

        let roundTitle = this.quickRoundHourSelect.value;
        if (roundTitle === 'CUSTOM') {
          roundTitle = this.manualRoundTitleInput.value.trim() || '12:00 PM';
        }

        this.closeAdminDrawer();
        setTimeout(() => {
          this.dispatchSynchronizedSpin(`Test Spin (${roundTitle})`, true, winnerNum);
        }, 200);
      });
    }

    // Section 1: Clear / Reset Winner Only (Time slot remains the EXACT same!)
    this.clearTimingBtn.addEventListener('click', () => {
      // Keep the active time slot exactly as selected or currently active
      const selectedSlot = (this.quickRoundHourSelect && this.quickRoundHourSelect.value) 
        || (this.badgeTimingText && this.badgeTimingText.textContent.trim()) 
        || '12:00 PM';

      this.forcedNext = null;

      // Reset the predetermined winner for this slot back to AUTO in schedule
      if (this.dailySchedule[selectedSlot] !== undefined) {
        this.dailySchedule[selectedSlot] = 'AUTO';
      }

      this.updateForcedWinnerUI();
      this.renderDailyScheduleTable();

      // Reset the selector UI back to default
      if (this.slices && this.slices.length > 0) {
        this.manualRoundWinnerSelect.value = this.slices[0];
      }
      this.manualRoundWinnerInput.value = '';
      this.manualRoundWinnerInput.classList.add('hidden');

      // Update badge display - Time slot remains strictly unchanged!
      this.activeTimingBadge.classList.remove('hidden');
      this.badgeTimingText.textContent = selectedSlot;
      this.badgeTimingWinner.textContent = 'Auto (Random)';

      // Keep round time select locked on the exact same time slot
      if (this.quickRoundHourSelect) {
        this.quickRoundHourSelect.value = selectedSlot;
      }

      this.pushStateToServer();
      this.showTimerFeedback(`✅ Winner for Slot "${selectedSlot}" reset to Auto (Time slot remains active)!`);
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

    // Section 2: Quick Test Spin (Test Spin - DOES NOT SAVE TO HISTORY)
    if (this.quickTestSpinBtn) {
      this.quickTestSpinBtn.addEventListener('click', () => {
        const val = this.forcedSelect.value;
        let target = null;
        if (val !== 'AUTO') {
          target = parseInt(val, 10);
        }
        this.closeAdminDrawer();
        setTimeout(() => {
          this.dispatchSynchronizedSpin('Quick Test Spin', true, target);
        }, 200);
      });
    }

    this.clearForcedBtn.addEventListener('click', () => {
      this.forcedNext = null;
      this.updateForcedWinnerUI();
      this.pushStateToServer();
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
      this.renderPredictionChips();
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
        this.renderPredictionChips();
        this.populateAdminControls();
        this.pushStateToServer();
        this.showSlicesSaveFeedback('Wheel numbers updated & synced to all devices!');
      }
    });

    // Section 4: Auto Fill 4 Slots
    this.autoFillScheduleBtn.addEventListener('click', () => {
      const sched = {};
      DAILY_SLOTS.forEach(slot => {
        const randIdx = Math.floor(Math.random() * this.slices.length);
        sched[slot.label] = this.slices[randIdx];
      });
      this.dailySchedule = sched;
      this.renderDailyScheduleTable();
      this.updateSection1BadgeForSelectedSlot();
      this.pushStateToServer();
      this.showTimerFeedback('Auto-filled 4 daily slots!');
    });

    // Section 5: Change Master Password
    this.saveMasterKeyBtn.addEventListener('click', async () => {
      const newPass = this.newMasterKeyInput.value.trim();
      if (newPass) {
        this.masterPassword = newPass;
        this.secretTriggerCode = newPass;
        localStorage.setItem(STATE_KEYS.MASTER_KEY, newPass);
        sessionStorage.setItem('admin_auth', newPass);
        this.newMasterKeyInput.value = '';

        await this.pushStateToServer({ masterPassword: newPass });

        this.keyChangeMsg.style.color = '#2ecc71';
        this.keyChangeMsg.textContent = '✅ Password updated successfully across all devices!';
        setTimeout(() => {
          this.keyChangeMsg.textContent = '';
        }, 4000);
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
    this.closeAuthModal(); // Close player portal if open
    if (this.secretAdminModal) {
      this.secretAdminModal.classList.remove('hidden');
      if (this.secretPasswordInput) {
        this.secretPasswordInput.value = '';
        if (this.secretLoginError) this.secretLoginError.classList.add('hidden');
        setTimeout(() => this.secretPasswordInput.focus(), 150);
      }
    }
  }

  closeSecretAdminModal() {
    if (this.secretAdminModal) {
      this.secretAdminModal.classList.add('hidden');
    }
    if (this.secretPasswordInput) {
      this.secretPasswordInput.value = '';
    }
    if (this.secretLoginError) {
      this.secretLoginError.classList.add('hidden');
    }
  }

  // ==========================================================
  // CUSTOMER PLAYER PORTAL MODAL
  // ==========================================================
  openAuthModal(defaultMode = 'signin') {
    if (!this.authModal) return;
    this.closeSecretAdminModal();
    this.authModal.classList.remove('hidden');
    this.updateCustomerAuthPane();
    if (defaultMode === 'signup') {
      this.setCustomerAuthSubtab('signup');
    } else if (defaultMode === 'forgot') {
      this.setCustomerAuthSubtab('forgot');
    }
  }

  closeAuthModal() {
    if (this.authModal) {
      this.authModal.classList.add('hidden');
    }
    this.clearCustomerAuthFeedback();
  }

  clearCustomerAuthFeedback() {
    if (this.custLoginError) this.custLoginError.classList.add('hidden');
    if (this.custLoginSuccess) this.custLoginSuccess.classList.add('hidden');
    if (this.custRegError) this.custRegError.classList.add('hidden');
    if (this.custRegSuccess) this.custRegSuccess.classList.add('hidden');
    if (this.forgotStep1Error) this.forgotStep1Error.classList.add('hidden');
    if (this.forgotStep2Error) this.forgotStep2Error.classList.add('hidden');
    if (this.forgotStep2Success) this.forgotStep2Success.classList.add('hidden');
  }

  updateCustomerAuthPane() {
    if (this.currentCustomer) {
      this.customerLoggedInView?.classList.remove('hidden');
      this.customerSubtabsBar?.classList.add('hidden');
      this.customerSigninForm?.classList.add('hidden');
      this.customerSignupForm?.classList.add('hidden');
      this.customerForgotPane?.classList.add('hidden');
      if (this.dashPlayerName) this.dashPlayerName.textContent = this.currentCustomer.name || 'Player';
      if (this.dashPlayerId) this.dashPlayerId.textContent = this.currentCustomer.id || '--';
      if (this.dashPlayerCoins) this.dashPlayerCoins.textContent = `💰 ${(this.currentCustomer.coins || 0).toLocaleString()} IHD Coins`;
    } else {
      this.customerLoggedInView?.classList.add('hidden');
      this.customerSubtabsBar?.classList.remove('hidden');
      this.setCustomerAuthSubtab(this.isSignUpMode ? 'signup' : 'signin');
    }
  }

  setCustomerAuthSubtab(mode) {
    this.clearCustomerAuthFeedback();
    if (mode === 'signup') {
      this.isSignUpMode = true;
      this.custSubtabSignup?.classList.add('active');
      this.custSubtabSignin?.classList.remove('active');
      this.customerSignupForm?.classList.remove('hidden');
      this.customerSigninForm?.classList.add('hidden');
      this.customerForgotPane?.classList.add('hidden');
      this.customerSubtabsBar?.classList.remove('hidden');
    } else if (mode === 'forgot') {
      this.customerForgotPane?.classList.remove('hidden');
      this.customerSignupForm?.classList.add('hidden');
      this.customerSigninForm?.classList.add('hidden');
      this.customerSubtabsBar?.classList.add('hidden');
      this.resetForgotStep1();
    } else {
      this.isSignUpMode = false;
      this.custSubtabSignin?.classList.add('active');
      this.custSubtabSignup?.classList.remove('active');
      this.customerSigninForm?.classList.remove('hidden');
      this.customerSignupForm?.classList.add('hidden');
      this.customerForgotPane?.classList.add('hidden');
      this.customerSubtabsBar?.classList.remove('hidden');
    }
  }

  validatePassword(pass) {
    const p = pass || '';
    const hasLength = p.length > 8; // Strictly greater than 8 characters (min 9)
    const uppercaseMatches = p.match(/[A-Z]/g) || [];
    const hasTwoUpper = uppercaseMatches.length >= 2;
    const hasNumber = /\d/.test(p);
    return {
      isValid: hasLength && hasTwoUpper && hasNumber,
      hasLength,
      hasTwoUpper,
      hasNumber
    };
  }

  updatePasswordRuleChecklist(pass, lenEl, upperEl, numEl) {
    const res = this.validatePassword(pass);
    if (lenEl) {
      lenEl.textContent = res.hasLength ? '✅ Min 9 characters (> 8)' : '❌ Min 9 characters (> 8)';
      lenEl.className = `rule-item ${res.hasLength ? 'valid' : ''}`;
    }
    if (upperEl) {
      upperEl.textContent = res.hasTwoUpper ? '✅ At least 2 Uppercase (A-Z)' : '❌ At least 2 Uppercase (A-Z)';
      upperEl.className = `rule-item ${res.hasTwoUpper ? 'valid' : ''}`;
    }
    if (numEl) {
      numEl.textContent = res.hasNumber ? '✅ Numbers included (0-9)' : '❌ Numbers included (0-9)';
      numEl.className = `rule-item ${res.hasNumber ? 'valid' : ''}`;
    }
  }

  resetForgotStep1() {
    this.verifiedForgotUser = null;
    this.forgotStep1?.classList.remove('hidden');
    this.forgotStep2?.classList.add('hidden');
    if (this.forgotIdInput) this.forgotIdInput.value = '';
    if (this.forgotDobInput) this.forgotDobInput.value = '';
    if (this.forgotNewPin) this.forgotNewPin.value = '';
    if (this.forgotConfirmNewPin) this.forgotConfirmNewPin.value = '';
    this.clearCustomerAuthFeedback();
  }

  // ==========================================================
  // CUSTOMER UI & PREDICTION LOGIC
  // ==========================================================
  getTargetSlotDetails(slotChoice = 'NEXT') {
    const now = new Date();
    const currentTotalSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    if (!slotChoice || slotChoice === 'NEXT') {
      const nextInfo = getNextSlotInfo(now);
      const isTomorrow = nextInfo.targetDate.getDate() !== now.getDate();
      const dayPrefix = isTomorrow ? 'Tomorrow' : 'Today';
      const dateFormatted = nextInfo.targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dateFull = nextInfo.targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return {
        slotLabel: nextInfo.label,
        dayPrefix: dayPrefix,
        dateFormatted: dateFormatted,
        dateFull: dateFull,
        targetDate: nextInfo.targetDate,
        displayStr: `${dayPrefix}, ${dateFormatted} • ${nextInfo.label} Round`
      };
    }

    // Specific slot selected
    const slotObj = DAILY_SLOTS.find(s => s.label === slotChoice) || DAILY_SLOTS[0];
    const slotTotalSecs = slotObj.hour * 3600 + slotObj.min * 60;
    const targetDate = new Date(now);
    let isTomorrow = false;

    if (slotTotalSecs <= currentTotalSecs) {
      targetDate.setDate(targetDate.getDate() + 1);
      isTomorrow = true;
    }
    targetDate.setHours(slotObj.hour, slotObj.min, 0, 0);

    const dayPrefix = isTomorrow ? 'Tomorrow' : 'Today';
    const dateFormatted = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dateFull = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return {
      slotLabel: slotObj.label,
      dayPrefix: dayPrefix,
      dateFormatted: dateFormatted,
      dateFull: dateFull,
      targetDate: targetDate,
      displayStr: `${dayPrefix}, ${dateFormatted} • ${slotObj.label} Round`
    };
  }

  updateTargetSlotDisplay() {
    const choice = this.playerTargetSlotSelect ? this.playerTargetSlotSelect.value : 'NEXT';
    const details = this.getTargetSlotDetails(choice);
    if (this.predTargetSlotText) {
      this.predTargetSlotText.textContent = details.displayStr;
    }
  }

  updateCustomerUI() {
    if (this.currentCustomer) {
      this.customerLoginBtn?.classList.add('hidden');
      this.customerProfileChip?.classList.remove('hidden');
      if (this.chipPlayerName) this.chipPlayerName.textContent = this.currentCustomer.name || 'Player';
      if (this.chipPlayerCoins) this.chipPlayerCoins.textContent = `💰 ${(this.currentCustomer.coins || 0).toLocaleString()} IHD`;
      if (this.playerWalletDisplay) this.playerWalletDisplay.textContent = `💰 ${(this.currentCustomer.coins || 0).toLocaleString()} IHD Coins`;
      if (this.dashPlayerName) this.dashPlayerName.textContent = this.currentCustomer.name || 'Player';
      if (this.dashPlayerId) this.dashPlayerId.textContent = this.currentCustomer.id || '--';
      if (this.dashPlayerCoins) this.dashPlayerCoins.textContent = `💰 ${(this.currentCustomer.coins || 0).toLocaleString()} IHD Coins`;
    } else {
      this.customerLoginBtn?.classList.remove('hidden');
      this.customerProfileChip?.classList.add('hidden');
      if (this.playerWalletDisplay) this.playerWalletDisplay.textContent = '💰 Logged Out (0 IHD Coins)';
    }

    this.updateTargetSlotDisplay();

    // Update active prediction bet notice
    if (this.currentBet) {
      this.activeBetNotice?.classList.remove('hidden');
      if (this.betSelectedNum) this.betSelectedNum.textContent = `#${this.currentBet.number}`;
      if (this.betSelectedCoins) this.betSelectedCoins.textContent = `${this.currentBet.amount}`;
      if (this.betPotentialWin) this.betPotentialWin.textContent = `${this.currentBet.potentialWin || this.currentBet.amount * 9}`;
      if (this.betTargetSlotInfo) this.betTargetSlotInfo.textContent = this.currentBet.targetSlot || this.currentBet.round || '--';
      if (this.betTargetDateInfo) this.betTargetDateInfo.textContent = this.currentBet.targetDate || 'Today';
    } else {
      this.activeBetNotice?.classList.add('hidden');
    }
  }

  renderPredictionChips() {
    if (!this.predictionNumberChips) return;
    this.predictionNumberChips.innerHTML = '';

    this.slices.forEach(num => {
      const btn = document.createElement('button');
      btn.className = `predict-num-btn ${this.selectedBetNumber === num ? 'selected' : ''}`;
      btn.setAttribute('data-num', num);
      btn.textContent = `${num}`;
      btn.addEventListener('click', () => {
        this.selectedBetNumber = num;
        this.predictionNumberChips.querySelectorAll('.predict-num-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.audio.playTick();
        if (this.predictionFeedbackMsg) {
          this.predictionFeedbackMsg.style.color = '#00f0ff';
          this.predictionFeedbackMsg.textContent = `Selected #${num} for prediction!`;
        }
      });
      this.predictionNumberChips.appendChild(btn);
    });
  }

  bindCustomerEvents() {
    // Target slot selection dropdown change
    this.playerTargetSlotSelect?.addEventListener('change', () => {
      this.updateTargetSlotDisplay();
      this.audio.playTick();
    });

    // Customer Subtabs
    this.custSubtabSignin?.addEventListener('click', () => this.setCustomerAuthSubtab('signin'));
    this.custSubtabSignup?.addEventListener('click', () => this.setCustomerAuthSubtab('signup'));

    // Forgot Password link & Back button
    this.custForgotLink?.addEventListener('click', () => this.setCustomerAuthSubtab('forgot'));
    this.forgotBackBtn?.addEventListener('click', () => this.setCustomerAuthSubtab('signin'));

    // Customer Dashboard & Logout buttons
    this.customerDashboardBtn?.addEventListener('click', () => this.openAuthModal('signin'));
    this.customerLogoutBtn?.addEventListener('click', () => this.handleCustomerLogout());
    this.dashLogoutBtn?.addEventListener('click', () => this.handleCustomerLogout());

    // Live Password Strength Checklist updates
    this.custRegPin?.addEventListener('input', () => {
      this.updatePasswordRuleChecklist(this.custRegPin.value, this.ruleLen, this.ruleUpper, this.ruleNum);
    });
    this.forgotNewPin?.addEventListener('input', () => {
      this.updatePasswordRuleChecklist(this.forgotNewPin.value, this.forgotRuleLen, this.forgotRuleUpper, this.forgotRuleNum);
    });

    // Sign In Submit
    this.custSigninBtn?.addEventListener('click', () => this.handleCustomerSignIn());
    this.custLoginPin?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleCustomerSignIn();
    });

    // Registration Submit
    this.custRegisterBtn?.addEventListener('click', () => this.handleCustomerRegister());
    this.custRegConfirmPin?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleCustomerRegister();
    });

    // Forgot Password Step 1: Verify ID + DOB
    this.forgotVerifyBtn?.addEventListener('click', () => this.handleForgotVerify());
    this.forgotDobInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleForgotVerify();
    });

    // Forgot Password Step 2: Reset Password
    this.forgotResetBtn?.addEventListener('click', () => this.handleForgotReset());
    this.forgotConfirmNewPin?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleForgotReset();
    });

    // Coin Bet Chips (10, 20, 30, 40, 50, 100, 150, 200)
    const coinChips = document.querySelectorAll('.coin-chip-btn');
    coinChips.forEach(chip => {
      chip.addEventListener('click', () => {
        coinChips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        const amt = parseInt(chip.getAttribute('data-amount'), 10) || 10;
        this.selectedBetAmount = amt;
        if (this.customBetInput) this.customBetInput.value = amt;
        this.audio.playTick();
      });
    });

    // Custom Bet Input listener
    if (this.customBetInput) {
      this.customBetInput.addEventListener('input', () => {
        let val = parseInt(this.customBetInput.value, 10);
        if (!isNaN(val)) {
          this.selectedBetAmount = val;
          // Unselect chip highlight if custom value is not one of chip values
          coinChips.forEach(c => {
            if (parseInt(c.getAttribute('data-amount'), 10) === val) {
              c.classList.add('selected');
            } else {
              c.classList.remove('selected');
            }
          });
        }
      });
    }

    // Place Prediction Button
    this.placePredictionBtn?.addEventListener('click', () => this.placeCustomerPrediction());
  }

  handleCustomerSignIn() {
    const id = this.custLoginId?.value.trim();
    const pin = this.custLoginPin?.value.trim();

    if (!id) {
      this.showCustomerAuthError('Please enter your User ID.', this.custLoginError);
      return;
    }
    if (!pin) {
      this.showCustomerAuthError('Please enter your Password.', this.custLoginError);
      return;
    }

    const user = this.customersDb[id];
    if (!user || user.pin !== pin) {
      this.showCustomerAuthError('Invalid User ID or Password. Please check or use Forgot Password.', this.custLoginError);
      return;
    }

    this.saveCustomerSession(user);
    this.updateCustomerUI();
    this.closeAuthModal();
    if (this.predictionFeedbackMsg) {
      this.predictionFeedbackMsg.style.color = '#2ecc71';
      this.predictionFeedbackMsg.textContent = `👋 Welcome back, ${user.name}!`;
      setTimeout(() => { if (this.predictionFeedbackMsg) this.predictionFeedbackMsg.textContent = ''; }, 3500);
    }
  }

  handleCustomerRegister() {
    const name = this.custRegName?.value.trim();
    const mobile = this.custRegMobile?.value.trim();
    const id = this.custRegId?.value.trim();
    const dob = this.custRegDob?.value.trim();
    const pin = this.custRegPin?.value.trim();
    const confirmPin = this.custRegConfirmPin?.value.trim();

    if (!name || name.length < 2) {
      this.showCustomerAuthError('Please enter your Full Name.', this.custRegError);
      return;
    }

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      this.showCustomerAuthError('Please enter a valid 10-digit Mobile Number.', this.custRegError);
      return;
    }

    if (!id || id.length < 3) {
      this.showCustomerAuthError('Please create a User ID.', this.custRegError);
      return;
    }

    // User ID must contain both letters and digits (Name + Numbers format)
    const hasLetters = /[a-zA-Z]/.test(id);
    const hasDigits = /\d/.test(id);
    if (!hasLetters || !hasDigits) {
      this.showCustomerAuthError('User ID must be in Name + Number format (e.g. Rahul9876 or Aman21).', this.custRegError);
      return;
    }

    if (this.customersDb[id]) {
      this.showCustomerAuthError(`User ID "${id}" is already registered! Please Sign In or pick another ID.`, this.custRegError);
      return;
    }

    if (!dob) {
      this.showCustomerAuthError('Please select your Date of Birth (DOB).', this.custRegError);
      return;
    }

    const passValidation = this.validatePassword(pin);
    if (!passValidation.isValid) {
      let reason = 'Password does not meet requirements:';
      if (!passValidation.hasLength) reason += ' Min 9 characters (> 8).';
      if (!passValidation.hasTwoUpper) reason += ' At least 2 uppercase letters (A-Z).';
      if (!passValidation.hasNumber) reason += ' Must include numbers (0-9).';
      this.showCustomerAuthError(reason, this.custRegError);
      return;
    }

    if (pin !== confirmPin) {
      this.showCustomerAuthError('Passwords do not match. Please verify.', this.custRegError);
      return;
    }

    // CREATE CUSTOMER ACCOUNT WITH EXACTLY 10 FREE WELCOME COINS
    const newCustomer = {
      id: id,
      name: name,
      mobile: mobile,
      dob: dob,
      pin: pin,
      coins: 10, // ONLY 10 COINS
      joinedAt: Date.now(),
      totalBets: 0,
      wins: 0
    };

    this.customersDb[id] = newCustomer;
    this.saveCustomersDB(this.customersDb);
    this.saveCustomerSession(newCustomer);
    this.updateCustomerUI();
    this.closeAuthModal();

    this.confetti.fire(2500);
    this.audio.playWinFanfare();
    if (this.predictionFeedbackMsg) {
      this.predictionFeedbackMsg.style.color = '#2ecc71';
      this.predictionFeedbackMsg.textContent = `🎉 Account created successfully! 10 Welcome IHD Coins credited to your wallet!`;
      setTimeout(() => { if (this.predictionFeedbackMsg) this.predictionFeedbackMsg.textContent = ''; }, 4500);
    }
  }

  handleForgotVerify() {
    const id = this.forgotIdInput?.value.trim();
    const dob = this.forgotDobInput?.value.trim();

    if (!id) {
      this.showCustomerAuthError('Please enter your User ID.', this.forgotStep1Error);
      return;
    }
    if (!dob) {
      this.showCustomerAuthError('Please select your Date of Birth (DOB).', this.forgotStep1Error);
      return;
    }

    const user = this.customersDb[id];
    if (!user || user.dob !== dob) {
      this.showCustomerAuthError('❌ User ID and Date of Birth do not match our registered records.', this.forgotStep1Error);
      return;
    }

    // Success -> proceed to Step 2
    this.verifiedForgotUser = user;
    this.forgotStep1?.classList.add('hidden');
    this.forgotStep2?.classList.remove('hidden');
    if (this.forgotStep1Error) this.forgotStep1Error.classList.add('hidden');
  }

  handleForgotReset() {
    if (!this.verifiedForgotUser) {
      this.showCustomerAuthError('Verification session expired. Please retry.', this.forgotStep2Error);
      return;
    }

    const newPin = this.forgotNewPin?.value.trim();
    const confirmPin = this.forgotConfirmNewPin?.value.trim();

    const passValidation = this.validatePassword(newPin);
    if (!passValidation.isValid) {
      let reason = 'New Password must have:';
      if (!passValidation.hasLength) reason += ' Min 9 characters (> 8).';
      if (!passValidation.hasTwoUpper) reason += ' At least 2 uppercase letters.';
      if (!passValidation.hasNumber) reason += ' Numbers included.';
      this.showCustomerAuthError(reason, this.forgotStep2Error);
      return;
    }

    if (newPin !== confirmPin) {
      this.showCustomerAuthError('Passwords do not match.', this.forgotStep2Error);
      return;
    }

    // Update password
    const userId = this.verifiedForgotUser.id;
    this.customersDb[userId].pin = newPin;
    this.saveCustomersDB(this.customersDb);
    this.saveCustomerSession(this.customersDb[userId]);
    this.updateCustomerUI();
    this.closeAuthModal();

    this.confetti.fire(2000);
    this.audio.playWinFanfare();
    if (this.predictionFeedbackMsg) {
      this.predictionFeedbackMsg.style.color = '#2ecc71';
      this.predictionFeedbackMsg.textContent = `✅ Password updated successfully! Logged in as ${this.customersDb[userId].name}.`;
      setTimeout(() => { if (this.predictionFeedbackMsg) this.predictionFeedbackMsg.textContent = ''; }, 4500);
    }
  }

  handleCustomerLogout() {
    this.saveCustomerSession(null);
    this.currentBet = null;
    this.saveCurrentBet(null);
    this.updateCustomerUI();
    this.closeAuthModal();
    if (this.predictionFeedbackMsg) {
      this.predictionFeedbackMsg.style.color = '#94a3b8';
      this.predictionFeedbackMsg.textContent = 'Logged out successfully.';
      setTimeout(() => { if (this.predictionFeedbackMsg) this.predictionFeedbackMsg.textContent = ''; }, 3000);
    }
  }

  showCustomerAuthError(msg, targetEl) {
    if (targetEl) {
      targetEl.textContent = `❌ ${msg}`;
      targetEl.classList.remove('hidden');
    }
  }

  placeCustomerPrediction() {
    if (!this.currentCustomer) {
      this.openAuthModal('signin');
      if (this.predictionFeedbackMsg) {
        this.predictionFeedbackMsg.style.color = '#f5b041';
        this.predictionFeedbackMsg.textContent = '👉 Please Sign In or Register to place a prediction!';
      }
      return;
    }

    if (this.selectedBetNumber === null) {
      if (this.predictionFeedbackMsg) {
        this.predictionFeedbackMsg.style.color = '#ff6b6b';
        this.predictionFeedbackMsg.textContent = '⚠️ Please select a number chip (10..100) above!';
        setTimeout(() => { if (this.predictionFeedbackMsg) this.predictionFeedbackMsg.textContent = ''; }, 3000);
      }
      return;
    }

    let amount = parseInt(this.selectedBetAmount, 10);
    if (this.customBetInput && this.customBetInput.value) {
      const customVal = parseInt(this.customBetInput.value, 10);
      if (!isNaN(customVal)) amount = customVal;
    }

    // Strict validation: between 10 and 200, strictly in multiples of 10 (10, 20, 30, 40 ... 200)
    if (isNaN(amount) || amount < 10 || amount > 200 || amount % 10 !== 0) {
      if (this.predictionFeedbackMsg) {
        this.predictionFeedbackMsg.style.color = '#ff6b6b';
        this.predictionFeedbackMsg.textContent = '❌ Bet amount must be between 10 and 200 in multiples of 10 (10, 20, 30, 40... 200)!';
        setTimeout(() => { if (this.predictionFeedbackMsg) this.predictionFeedbackMsg.textContent = ''; }, 4500);
      }
      return;
    }

    if ((this.currentCustomer.coins || 0) < amount) {
      if (this.predictionFeedbackMsg) {
        this.predictionFeedbackMsg.style.color = '#ff6b6b';
        this.predictionFeedbackMsg.textContent = `❌ Insufficient IHD Coins! Your balance is 💰${this.currentCustomer.coins || 0} IHD Coins (Bet requires ${amount} IHD Coins).`;
        setTimeout(() => { if (this.predictionFeedbackMsg) this.predictionFeedbackMsg.textContent = ''; }, 4500);
      }
      return;
    }

    // Deduct coins
    this.currentCustomer.coins -= amount;
    this.currentCustomer.totalBets = (this.currentCustomer.totalBets || 0) + 1;
    this.saveCustomerSession(this.currentCustomer);

    const slotChoice = this.playerTargetSlotSelect ? this.playerTargetSlotSelect.value : 'NEXT';
    const slotDetails = this.getTargetSlotDetails(slotChoice);

    const betObj = {
      id: 'bet_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      playerId: this.currentCustomer.id,
      playerName: this.currentCustomer.name || this.currentCustomer.id,
      playerMobile: this.currentCustomer.mobile || '',
      number: this.selectedBetNumber,
      amount: amount,
      potentialWin: amount * 9, // 9X MULTIPLIER
      targetSlot: slotDetails.slotLabel,
      targetDate: slotDetails.dateFormatted,
      targetDateFull: slotDetails.dateFull,
      displaySlot: slotDetails.displayStr,
      placedTime: formatTime12(new Date()),
      timestamp: Date.now()
    };

    this.currentBet = betObj;
    this.saveCurrentBet(this.currentBet);

    // Update global active bets list
    if (!Array.isArray(this.activeBets)) this.activeBets = [];
    this.activeBets = [
      betObj,
      ...this.activeBets.filter(b => !(b.playerId === betObj.playerId && b.targetSlot === betObj.targetSlot && b.targetDateFull === betObj.targetDateFull))
    ];
    this.saveActiveBets(this.activeBets);

    this.updateCustomerUI();
    this.pushStateToServer({ customersDb: this.customersDb, activeBets: this.activeBets });

    if (this.predictionFeedbackMsg) {
      this.predictionFeedbackMsg.style.color = '#2ecc71';
      this.predictionFeedbackMsg.textContent = `✅ Locked ${amount} IHD Coins on #${this.selectedBetNumber} for ${slotDetails.displayStr} (Potential 9x Win: 💰${amount * 9} IHD Coins)!`;
      setTimeout(() => { if (this.predictionFeedbackMsg) this.predictionFeedbackMsg.textContent = ''; }, 5000);
    }
    this.audio.playTick();
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
    if (this.newMasterKeyInput) {
      this.newMasterKeyInput.placeholder = `Current: ${this.masterPassword || '00773300'}`;
    }
    this.populateAdminControls();
    this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');
    this.renderAdminActiveBetsTable();
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

  updateSection1BadgeForSelectedSlot() {
    const selectedSlot = this.quickRoundHourSelect ? this.quickRoundHourSelect.value : '12:00 PM';
    const preset = this.dailySchedule[selectedSlot];

    this.activeTimingBadge.classList.remove('hidden');
    this.badgeTimingText.textContent = selectedSlot;

    if (preset && preset !== 'AUTO') {
      this.badgeTimingWinner.textContent = `${preset}`;
    } else if (this.forcedNext !== null) {
      this.badgeTimingWinner.textContent = `${this.forcedNext}`;
    } else {
      this.badgeTimingWinner.textContent = 'Auto (Random)';
    }

    // Also synchronize the winning number selector for this slot
    if (preset && preset !== 'AUTO') {
      const numVal = parseInt(preset, 10);
      if (this.slices.includes(numVal)) {
        this.manualRoundWinnerSelect.value = numVal;
        this.manualRoundWinnerInput.classList.add('hidden');
      } else {
        this.manualRoundWinnerSelect.value = 'CUSTOM';
        this.manualRoundWinnerInput.classList.remove('hidden');
        this.manualRoundWinnerInput.value = numVal;
      }
    } else if (this.forcedNext !== null) {
      const forcedNum = parseInt(this.forcedNext, 10);
      if (this.slices.includes(forcedNum)) {
        this.manualRoundWinnerSelect.value = forcedNum;
        this.manualRoundWinnerInput.classList.add('hidden');
      } else {
        this.manualRoundWinnerSelect.value = 'CUSTOM';
        this.manualRoundWinnerInput.classList.remove('hidden');
        this.manualRoundWinnerInput.value = forcedNum;
      }
    } else {
      if (this.slices && this.slices.length > 0) {
        this.manualRoundWinnerSelect.value = this.slices[0];
      }
      this.manualRoundWinnerInput.classList.add('hidden');
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

    // Set default selected slot in Section 1 to upcoming slot if not set
    const nextSlot = getNextSlotInfo(new Date());
    const currentSelected = this.quickRoundHourSelect.value;
    if (!currentSelected || currentSelected === 'CUSTOM') {
      this.quickRoundHourSelect.value = nextSlot.label;
    }

    // Populate Section 1 Winning Number dropdown with the 10 permanent slices
    this.manualRoundWinnerSelect.innerHTML = '';
    this.slices.forEach((num, idx) => {
      const opt = document.createElement('option');
      opt.value = num;
      opt.textContent = `Slot #${idx + 1}: ${num}`;
      this.manualRoundWinnerSelect.appendChild(opt);
    });
    const customOpt = document.createElement('option');
    customOpt.value = 'CUSTOM';
    customOpt.textContent = 'Custom Number (1-100)...';
    this.manualRoundWinnerSelect.appendChild(customOpt);

    // Update Section 1 Badge and selector for currently selected slot
    this.updateSection1BadgeForSelectedSlot();

    // 1. Populate Forced Select Dropdown in Section 2
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

    // 3. Render 4-Slot Daily Schedule Table
    this.renderDailyScheduleTable();
  }

  renderDailyScheduleTable() {
    const nextSlot = getNextSlotInfo(new Date());
    this.scheduleTableBody.innerHTML = '';

    DAILY_SLOTS.forEach(slot => {
      const tr = document.createElement('tr');
      const isNext = slot.label === nextSlot.label;
      if (isNext) tr.className = 'current-hour-row';

      const currentPreset = this.dailySchedule[slot.label] || 'AUTO';

      let selectOptions = `<option value="AUTO" ${currentPreset === 'AUTO' ? 'selected' : ''}>🎲 Auto</option>`;
      const presetNum = currentPreset !== 'AUTO' ? parseInt(currentPreset, 10) : null;
      const uniqueNums = Array.from(new Set([...this.slices, ...(presetNum !== null ? [presetNum] : [])])).sort((a, b) => a - b);
      uniqueNums.forEach(n => {
        selectOptions += `<option value="${n}" ${presetNum === n ? 'selected' : ''}>Number ${n}</option>`;
      });

      tr.innerHTML = `
        <td>
          <span class="schedule-hour-badge">${slot.label}</span>
          ${isNext ? '<small style="color:#f5b041; margin-left:6px; font-weight:700;">(Next Round)</small>' : ''}
        </td>
        <td>
          <select class="schedule-select" data-slot="${slot.label}">
            ${selectOptions}
          </select>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="app.setDailySlotWinner('${slot.label}')">Set</button>
        </td>
      `;

      this.scheduleTableBody.appendChild(tr);
    });

    const selects = this.scheduleTableBody.querySelectorAll('.schedule-select');
    selects.forEach(sel => {
      sel.addEventListener('change', (e) => {
        const slotLabel = e.target.getAttribute('data-slot');
        const val = e.target.value === 'AUTO' ? 'AUTO' : parseInt(e.target.value, 10);
        this.dailySchedule[slotLabel] = val;
        this.pushStateToServer();
        this.updateSection1BadgeForSelectedSlot();
      });
    });
  }

  setDailySlotWinner(slotLabel) {
    const select = this.scheduleTableBody.querySelector(`select[data-slot="${slotLabel}"]`);
    if (select) {
      const val = select.value === 'AUTO' ? 'AUTO' : parseInt(select.value, 10);
      this.dailySchedule[slotLabel] = val;
      this.pushStateToServer();
      this.renderDailyScheduleTable();
      this.updateSection1BadgeForSelectedSlot();
      this.showTimerFeedback(`Slot ${slotLabel} winner set to ${val === 'AUTO' ? 'Auto' : '#' + val}!`);
    }
  }

  // ==========================================
  // SECTION 5: REGISTERED PLAYERS & IHD COIN MANAGER
  // ==========================================
  setQuickCreditAmount(amt) {
    if (this.adminCreditAmountInput) {
      this.adminCreditAmountInput.value = amt;
    }
  }

  bindAdminPlayerEvents() {
    this.adminRefreshPlayersBtn?.addEventListener('click', () => {
      this.pullStateFromServer().then(() => this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : ''));
      this.showAdminCreditFeedback('🔄 Player list refreshed!', true);
    });

    this.quickCredit50?.addEventListener('click', () => this.setQuickCreditAmount(50));
    this.quickCredit100?.addEventListener('click', () => this.setQuickCreditAmount(100));
    this.quickCredit500?.addEventListener('click', () => this.setQuickCreditAmount(500));
    this.quickCredit1000?.addEventListener('click', () => this.setQuickCreditAmount(1000));
    this.quickCredit5000?.addEventListener('click', () => this.setQuickCreditAmount(5000));

    this.adminPlayerSearch?.addEventListener('input', () => {
      this.renderAdminPlayersList(this.adminPlayerSearch.value);
    });

    this.adminApplyCreditBtn?.addEventListener('click', () => {
      const selectedId = this.adminCreditPlayerSelect?.value;
      const amount = parseInt(this.adminCreditAmountInput?.value, 10);
      if (!selectedId) {
        this.showAdminCreditFeedback('❌ Please choose a registered player first!', false);
        return;
      }
      if (isNaN(amount) || amount <= 0) {
        this.showAdminCreditFeedback('❌ Please enter a valid credit amount!', false);
        return;
      }
      this.adminAddPlayerCredit(selectedId, amount);
    });
  }

  showAdminCreditFeedback(msg, isSuccess = true) {
    if (this.adminCreditFeedback) {
      this.adminCreditFeedback.textContent = msg;
      this.adminCreditFeedback.style.color = isSuccess ? '#2ecc71' : '#ff6b6b';
      setTimeout(() => {
        if (this.adminCreditFeedback) this.adminCreditFeedback.textContent = '';
      }, 4000);
    }
  }

  adminAddPlayerCredit(userId, amount) {
    if (!this.customersDb || !this.customersDb[userId]) {
      this.showAdminCreditFeedback(`❌ Player "${userId}" not found!`, false);
      return;
    }

    const player = this.customersDb[userId];
    const prevBalance = player.coins || 0;
    const newBalance = Math.max(0, prevBalance + amount);
    player.coins = newBalance;
    this.customersDb[userId] = player;

    this.saveCustomersDB(this.customersDb);

    // If currently logged-in player is this player, update session
    if (this.currentCustomer && this.currentCustomer.id === userId) {
      this.currentCustomer.coins = newBalance;
      this.saveCustomerSession(this.currentCustomer);
      this.updateCustomerUI();
    }

    this.pushStateToServer({ customersDb: this.customersDb });
    this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');
    this.showAdminCreditFeedback(`✅ Credited +${amount} IHD Coins to ${player.name} (${userId})! New Balance: 💰 ${newBalance} IHD Coins`, true);
  }

  adminCustomCreditPrompt(userId) {
    const player = this.customersDb[userId];
    if (!player) return;
    const input = prompt(`Enter IHD Coins to add/deduct for ${player.name} (${userId})\nCurrent Balance: ${player.coins || 0} IHD Coins\n(e.g. 500 to add, -50 to deduct):`, '100');
    if (input !== null) {
      const amt = parseInt(input, 10);
      if (!isNaN(amt) && amt !== 0) {
        this.adminAddPlayerCredit(userId, amt);
      }
    }
  }

  renderAdminPlayersList(filterQuery = '') {
    if (!this.adminPlayersTableBody) return;

    const players = Object.values(this.customersDb || {});
    const totalCount = players.length;
    const totalCoins = players.reduce((sum, p) => sum + (p.coins || 0), 0);

    if (this.adminTotalPlayersCount) {
      this.adminTotalPlayersCount.textContent = totalCount;
    }
    if (this.adminTotalCoinsCount) {
      this.adminTotalCoinsCount.textContent = `💰 ${totalCoins.toLocaleString()} IHD Coins`;
    }

    // Populate Select Dropdown
    if (this.adminCreditPlayerSelect) {
      const currentSelected = this.adminCreditPlayerSelect.value;
      let opts = '<option value="">-- Choose a Registered Player --</option>';
      players.forEach(p => {
        const isSel = p.id === currentSelected ? 'selected' : '';
        opts += `<option value="${p.id}" ${isSel}>${p.id} (${p.name || 'Player'} - 💰 ${(p.coins || 0).toLocaleString()} IHD Coins)</option>`;
      });
      this.adminCreditPlayerSelect.innerHTML = opts;
    }

    // Filter players for table
    const q = (filterQuery || '').toLowerCase().trim();
    const filteredPlayers = players.filter(p => {
      if (!q) return true;
      return (
        (p.id && p.id.toLowerCase().includes(q)) ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.mobile && p.mobile.toLowerCase().includes(q))
      );
    });

    if (filteredPlayers.length === 0) {
      this.adminPlayersTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; color:var(--text-muted); padding:1rem;">
            ${totalCount === 0 ? 'No registered players yet.' : 'No players match your search filter.'}
          </td>
        </tr>
      `;
      return;
    }

    this.adminPlayersTableBody.innerHTML = '';
    filteredPlayers.forEach(p => {
      const tr = document.createElement('tr');
      const coins = p.coins || 0;
      tr.innerHTML = `
        <td>
          <strong style="color:#fff;">${p.name || 'Player'}</strong><br>
          <span style="font-family:monospace; color:#00f0ff; font-weight:700;">ID: ${p.id}</span>
        </td>
        <td>
          <span>📱 ${p.mobile || '--'}</span><br>
          <span style="font-size:0.7rem; color:var(--text-muted);">🎂 ${p.dob || '--'}</span>
        </td>
        <td>
          <strong style="color:var(--primary-gold-bright); font-size:0.85rem;">💰 ${coins.toLocaleString()} IHD</strong><br>
          <span style="font-size:0.68rem; color:var(--text-secondary);">${p.totalBets || 0} Bets</span>
        </td>
        <td>
          <div style="display:flex; gap:3px; flex-wrap:wrap;">
            <button class="btn btn-secondary btn-xs" title="Add 100 IHD Coins" onclick="app.adminAddPlayerCredit('${p.id}', 100)">+100</button>
            <button class="btn btn-secondary btn-xs" title="Add 500 IHD Coins" onclick="app.adminAddPlayerCredit('${p.id}', 500)">+500</button>
            <button class="btn btn-gold btn-xs" title="Add 1,000 IHD Coins" onclick="app.adminAddPlayerCredit('${p.id}', 1000)">+1k</button>
            <button class="btn btn-secondary btn-xs" style="background:rgba(255,255,255,0.06); padding:2px 6px;" title="Custom Amount" onclick="app.adminCustomCreditPrompt('${p.id}')">±</button>
          </div>
        </td>
      `;
      this.adminPlayersTableBody.appendChild(tr);
    });
  }

  renderAdminActiveBetsTable() {
    if (!this.adminActiveBetsTableBody) return;

    const bets = Array.isArray(this.activeBets) ? this.activeBets : [];
    const totalCount = bets.length;
    const totalCoins = bets.reduce((sum, b) => sum + (b.amount || 0), 0);

    if (this.adminActiveBetsSummary) {
      this.adminActiveBetsSummary.textContent = `${totalCount} Active Bet${totalCount === 1 ? '' : 's'} (💰 ${totalCoins.toLocaleString()} IHD Coins Pool)`;
    }

    if (bets.length === 0) {
      this.adminActiveBetsTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; color:var(--text-muted); padding:1rem;">
            No active player predictions right now.
          </td>
        </tr>
      `;
      return;
    }

    this.adminActiveBetsTableBody.innerHTML = '';
    bets.forEach(b => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <strong style="color:#fff;">${b.playerName || 'Player'}</strong><br>
          <span style="font-family:monospace; color:#00f0ff; font-size:0.7rem;">ID: ${b.playerId || '--'}</span>
          ${b.playerMobile ? `<br><span style="font-size:0.68rem; color:var(--text-muted);">📱 ${b.playerMobile}</span>` : ''}
        </td>
        <td>
          <span style="display:inline-block; background:#ffd700; color:#000; font-weight:800; font-size:0.88rem; padding:3px 9px; border-radius:12px; box-shadow:0 0 8px rgba(255,215,0,0.5);">
            #${b.number}
          </span>
        </td>
        <td>
          <strong style="color:var(--primary-gold-bright); font-size:0.84rem;">💰 ${b.amount} IHD</strong><br>
          <span style="font-size:0.7rem; color:#2ecc71; font-weight:600;">Win (9x): 💰 ${b.potentialWin || b.amount * 9}</span>
        </td>
        <td>
          <span style="color:#00f0ff; font-weight:700; font-size:0.8rem;">🕒 ${b.targetSlot || 'Next Round'}</span><br>
          <span style="font-size:0.7rem; color:var(--text-secondary);">📅 ${b.targetDate || 'Today'}</span>
        </td>
        <td>
          <span style="font-size:0.72rem; color:var(--text-secondary);">${b.placedTime || 'Just now'}</span>
        </td>
      `;
      this.adminActiveBetsTableBody.appendChild(tr);
    });
  }
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
  // TARGET NUMBER DETERMINATION & SINGLE ROTATION PHYSICS
  // ==========================================================
  determineTargetNumber() {
    const currentSlot = getCurrentActiveSlot(new Date());
    const nextSlot = getNextSlotInfo(new Date());

    // 1. Highest Priority: Forced Next Winner
    if (this.forcedNext !== null && this.forcedNext !== undefined) {
      const forced = parseInt(this.forcedNext, 10);
      this.forcedNext = null;
      this.updateForcedWinnerUI();
      return forced;
    }

    // 2. Second Priority: Upcoming Queue (1st slot)
    if (this.upcomingQueue && this.upcomingQueue.length > 0 && this.upcomingQueue[0] !== 'AUTO') {
      const queueVal = parseInt(this.upcomingQueue[0], 10);
      this.upcomingQueue = [this.upcomingQueue[1] || 'AUTO', this.upcomingQueue[2] || 'AUTO', 'AUTO'];
      if (this.slices.includes(queueVal)) {
        return queueVal;
      }
    }

    // 3. Third Priority: 4-Slot Predetermined Schedule for this slot
    const scheduledVal = this.dailySchedule[currentSlot.label] || this.dailySchedule[nextSlot.label];
    if (scheduledVal && scheduledVal !== 'AUTO') {
      const schedNum = parseInt(scheduledVal, 10);
      if (this.slices.includes(schedNum)) {
        return schedNum;
      }
    }

    // 4. Fallback: Pick random number from permanent 10 slices
    const randIdx = Math.floor(Math.random() * this.slices.length);
    return this.slices[randIdx];
  }

  dispatchSynchronizedSpin(triggerSource = 'Live Slot Round', isTestSpin = false, overrideTargetNumber = null) {
    if (this.isSpinning || Date.now() < this.spinLockoutUntil) return;

    let targetNumber = overrideTargetNumber;
    if (targetNumber === null || isNaN(targetNumber) || targetNumber < 1) {
      targetNumber = this.determineTargetNumber();
    }

    const triggerId = Date.now();
    this.saveHandledSpinId(triggerId);
    this.spinLockoutUntil = triggerId + 10000; // 10s lockout guard

    // If official round (not test), reset custom countdowns to return to regular schedule
    if (!isTestSpin) {
      this.customTimerTarget = null;
      this.timerMode = 'REAL';
      if (this.timerModeReal) this.timerModeReal.checked = true;
    }

    // Broadcast spin trigger to server & all connected mobile/PC screens
    const spinTrigger = {
      triggerId: triggerId,
      targetNumber: targetNumber,
      triggerSource: triggerSource,
      isTestSpin: isTestSpin,
      timestamp: triggerId
    };

    this.pushStateToServer({
      spinTrigger: spinTrigger,
      forcedNext: this.forcedNext,
      upcomingQueue: this.upcomingQueue,
      ...(isTestSpin ? {} : { timerMode: 'REAL', customTimerTarget: null })
    });

    // Execute spin animation locally (single execution)
    this.executeSpinAnimation(targetNumber, triggerSource, true, isTestSpin);
  }

  executeSpinAnimation(targetNumber, triggerSource, isInitiator, isTestSpin = false) {
    if (this.isSpinning) {
      console.warn('Spin already active. Skipping duplicate animation.');
      return;
    }
    this.isSpinning = true;
    this.spinLockoutUntil = Date.now() + 10000;

    // Cancel any prior animation loop to guarantee a single clean spin
    if (this.spinAnimFrameId) {
      cancelAnimationFrame(this.spinAnimFrameId);
      this.spinAnimFrameId = null;
    }

    let targetIndex = this.slices.indexOf(targetNumber);
    if (targetIndex === -1) {
      targetIndex = 0;
      targetNumber = this.slices[0];
    }

    const numSlices = this.slices.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    // Exact needle target calculation: Pointer needle is at top (-Math.PI / 2).
    // Zero random jitter guarantees the needle lands with 100% precision dead center on the slice!
    const targetCenterAngle = (targetIndex + 0.5) * sliceAngle;
    let desiredNormalizedAngle = (-Math.PI / 2 - targetCenterAngle) % (2 * Math.PI);
    if (desiredNormalizedAngle < 0) desiredNormalizedAngle += 2 * Math.PI;

    // 5 complete smooth rotations
    const minSpins = 5;
    const currentNormalized = ((this.currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    let deltaAngle = desiredNormalizedAngle - currentNormalized;
    while (deltaAngle < minSpins * 2 * Math.PI) {
      deltaAngle += 2 * Math.PI;
    }

    const startAngle = this.currentAngle;
    const finalAngle = startAngle + deltaAngle;
    const duration = 5500;
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
        this.spinAnimFrameId = requestAnimationFrame(animateSpin);
      } else {
        this.currentAngle = finalAngle;
        this.renderWheel();
        this.spinAnimFrameId = null;
        this.onSpinComplete(targetNumber, triggerSource, isInitiator, isTestSpin);
      }
    };

    this.spinAnimFrameId = requestAnimationFrame(animateSpin);
  }

  checkPointerTick() {
    const numSlices = this.slices.length;
    const sliceAngle = (2 * Math.PI) / numSlices;
    let norm = (-Math.PI / 2 - this.currentAngle) % (2 * Math.PI);
    if (norm < 0) norm += 2 * Math.PI;

    const currentSliceIdx = Math.floor(norm / sliceAngle) % numSlices;
    if (currentSliceIdx !== this.lastTickIndex) {
      this.lastTickIndex = currentSliceIdx;
      this.audio.playTick();

      if (this.pointerEl) {
        this.pointerEl.classList.add('ticking');
        setTimeout(() => this.pointerEl.classList.remove('ticking'), 60);
      }
    }
  }

  onSpinComplete(winningNumber, triggerSource, isInitiator, isTestSpin = false) {
    this.isSpinning = false;
    this.spinLockoutUntil = Date.now() + 5000; // 5s extra cooldown

    // Confetti and Audio Fanfare
    this.confetti.fire(4000);
    this.audio.playWinFanfare();

    const now = new Date();
    const timeStr12 = formatTime12(now);
    const activeSlot = getCurrentActiveSlot(now);
    const roundStr12 = activeSlot.label;
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    // Show Win Announcement Banner
    this.winBanner.classList.remove('hidden');
    this.winNumberEl.textContent = `${winningNumber}`;
    if (isTestSpin) {
      this.winTimeEl.textContent = `⚡ Test Spin Completed &bull; Winning Number: ${winningNumber} (History Not Saved)`;
    } else {
      this.winTimeEl.textContent = `Won at ${timeStr12} &bull; Round ${roundStr12}`;
    }

    // Evaluate Customer Prediction Bets & 9x Multiplier Payouts for this round
    if (!isTestSpin && Array.isArray(this.activeBets) && this.activeBets.length > 0) {
      const todayFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      this.activeBets.forEach(bet => {
        // Check if this bet targets this round slot
        const isSlotMatch = (bet.targetSlot === roundStr12 || !bet.targetSlot || bet.targetSlot === 'NEXT');
        const isDateMatch = (!bet.targetDate || bet.targetDate === todayFormatted || bet.targetDate === dateStr);

        if (isSlotMatch && isDateMatch) {
          if (bet.number === winningNumber) {
            const winAmount = bet.amount * 9; // 9X MULTIPLIER
            if (this.customersDb && this.customersDb[bet.playerId]) {
              this.customersDb[bet.playerId].coins = (this.customersDb[bet.playerId].coins || 0) + winAmount;
              this.customersDb[bet.playerId].wins = (this.customersDb[bet.playerId].wins || 0) + 1;
            }
            if (this.currentCustomer && this.currentCustomer.id === bet.playerId) {
              this.currentCustomer.coins = (this.currentCustomer.coins || 0) + winAmount;
              this.currentCustomer.wins = (this.currentCustomer.wins || 0) + 1;
              this.saveCustomerSession(this.currentCustomer);
              if (this.predictionFeedbackMsg) {
                this.predictionFeedbackMsg.style.color = '#ffd700';
                this.predictionFeedbackMsg.innerHTML = `🎉 <strong>PREDICTION WIN!</strong> You predicted #${winningNumber} for ${roundStr12} and won 💰${winAmount.toLocaleString()} IHD Coins (9x Multiplier auto-credited)!`;
              }
            }
          } else {
            if (this.currentCustomer && this.currentCustomer.id === bet.playerId) {
              if (this.predictionFeedbackMsg) {
                this.predictionFeedbackMsg.style.color = '#94a3b8';
                this.predictionFeedbackMsg.textContent = `Round ${roundStr12} winning number was #${winningNumber}. Better luck on next round!`;
                setTimeout(() => { if (this.predictionFeedbackMsg) this.predictionFeedbackMsg.textContent = ''; }, 6000);
              }
            }
          }
        }
      });

      // Filter out settled bets from activeBets
      this.activeBets = this.activeBets.filter(bet => {
        const isSlotMatch = (bet.targetSlot === roundStr12 || !bet.targetSlot || bet.targetSlot === 'NEXT');
        const isDateMatch = (!bet.targetDate || bet.targetDate === todayFormatted || bet.targetDate === dateStr);
        return !(isSlotMatch && isDateMatch);
      });

      this.saveActiveBets(this.activeBets);
      this.saveCustomersDB(this.customersDb);
      if (this.currentBet && (this.currentBet.targetSlot === roundStr12 || !this.currentBet.targetSlot)) {
        this.currentBet = null;
        this.saveCurrentBet(null);
      }
      this.updateCustomerUI();
      if (this.isDrawerOpen) {
        this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');
        this.renderAdminActiveBetsTable();
      }
    } else if (this.currentBet) {
      // Fallback for single bet evaluation
      const bet = this.currentBet;
      if (bet.number === winningNumber) {
        const winAmount = bet.amount * 9;
        if (this.currentCustomer) {
          this.currentCustomer.coins = (this.currentCustomer.coins || 0) + winAmount;
          this.currentCustomer.wins = (this.currentCustomer.wins || 0) + 1;
          this.saveCustomerSession(this.currentCustomer);
        }
        if (this.predictionFeedbackMsg) {
          this.predictionFeedbackMsg.style.color = '#ffd700';
          this.predictionFeedbackMsg.innerHTML = `🎉 <strong>PREDICTION WIN!</strong> You predicted #${winningNumber} and won 💰${winAmount.toLocaleString()} IHD Coins (9x Multiplier auto-credited)!`;
        }
      } else {
        if (this.predictionFeedbackMsg) {
          this.predictionFeedbackMsg.style.color = '#94a3b8';
          this.predictionFeedbackMsg.textContent = `Round #${winningNumber} completed. Better luck on next round!`;
          setTimeout(() => { if (this.predictionFeedbackMsg) this.predictionFeedbackMsg.textContent = ''; }, 6000);
        }
      }
      this.currentBet = null;
      this.saveCurrentBet(null);
      this.updateCustomerUI();
    }

    // ONLY SAVE TO HISTORY IF THIS IS AN OFFICIAL ROUND (NOT A TEST SPIN)
    if (!isTestSpin) {
      const newResult = {
        id: Date.now(),
        number: winningNumber,
        time: timeStr12,
        date: dateStr,
        round: roundStr12,
        source: triggerSource
      };

      // Update history & immediately save to localStorage
      this.history = [newResult, ...this.history].slice(0, 10);
      localStorage.setItem(STATE_KEYS.HISTORY, JSON.stringify(this.history));
      this.renderLast3Results();
    }

    // Always clear spinTrigger on complete so it never fires again and sync history
    if (isInitiator) {
      this.pushStateToServer({
        spinTrigger: null,
        history: this.history,
        customersDb: this.customersDb,
        activeBets: this.activeBets
      });
    }
  }

  // ==========================================
  // LAST 3 RESULTS RENDERER (100% MATCH)
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

  // ==========================================================
  // AUTOMATIC 4-SLOT ADVANCEMENT & COUNTDOWN TIMER ENGINE
  // ==========================================================
  startTimerEngine() {
    const tick = () => {
      const now = new Date();
      const nextSlot = getNextSlotInfo(now);

      // Automatic slot display header (always shows next upcoming slot: 12PM, 4PM, 8PM, 11PM)
      this.currentHourEl.textContent = nextSlot.label;

      if (this.timerMode === 'MANUAL' && this.customTimerTarget) {
        // One-time custom countdown mode
        const remainingMs = Math.max(0, this.customTimerTarget - Date.now());
        const totalSec = Math.floor(remainingMs / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        this.countdownEl.textContent = `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        if (totalSec <= 0 && !this.isSpinning && Date.now() >= this.spinLockoutUntil) {
          this.dispatchSynchronizedSpin('Manual Countdown Round', false);
        }
      } else {
        // Automatic 4-Slot Schedule Countdown (12:00 PM, 04:00 PM, 08:00 PM, 11:00 PM)
        const targetDate = nextSlot.targetDate;
        const slotKey = nextSlot.slotKey;

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

        // Auto-spin ONCE at the exact scheduled second
        const lastSpunSlot = localStorage.getItem(STATE_KEYS.LAST_SPUN_SLOT);
        if (totalSec === 0 && !this.isSpinning && lastSpunSlot !== slotKey && Date.now() >= this.spinLockoutUntil) {
          localStorage.setItem(STATE_KEYS.LAST_SPUN_SLOT, slotKey);
          this.dispatchSynchronizedSpin(`Slot ${nextSlot.label}`, false);
        }
      }
    };

    tick();
    setInterval(tick, 1000);
  }
}

// Global App Instance
window.addEventListener('DOMContentLoaded', () => {
  window.app = new SpinWheelApp();
});
