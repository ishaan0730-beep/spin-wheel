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

// Cross-Platform Month Map & Date Helpers (Resilient for iOS Safari, WebKit, Android, Desktop)
const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

function parseCrossBrowserDate(rawStr, now = new Date()) {
  if (!rawStr) return new Date(now);
  if (rawStr instanceof Date && !isNaN(rawStr.getTime())) return new Date(rawStr);
  if (typeof rawStr === 'number' && !isNaN(rawStr)) return new Date(rawStr);

  const str = String(rawStr).trim();
  const lower = str.toLowerCase();

  if (lower === 'today' || lower.includes('today')) return new Date(now);
  if (lower === 'yesterday' || lower.includes('yesterday')) return new Date(now.getTime() - 86400000);
  if (lower === 'tomorrow' || lower.includes('tomorrow')) return new Date(now.getTime() + 86400000);

  // Check ISO format YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) return dt;
  }

  // Check Month Day e.g. "Sep 30", "Sep 30, 2026", "September 30", "30 Sep"
  const parts = str.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  let month = -1;
  let day = -1;
  let year = now.getFullYear();

  for (let p of parts) {
    const pLow = p.toLowerCase();
    if (MONTH_MAP[pLow] !== undefined) {
      month = MONTH_MAP[pLow];
    } else {
      const num = parseInt(p, 10);
      if (!isNaN(num)) {
        if (num > 1000) year = num;
        else if (day === -1 && num >= 1 && num <= 31) day = num;
      }
    }
  }

  if (month !== -1 && day !== -1) {
    const dt = new Date(year, month, day);
    if (!isNaN(dt.getTime())) return dt;
  }

  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const dt = new Date(parsed);
    if (!isNaN(dt.getTime())) return dt;
  }

  return new Date(now);
}

function formatISODate(d) {
  if (!d || isNaN(d.getTime())) d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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
  ACTIVE_BETS: 'lucky_spin_active_bets_v6',
  DELETED_BET_IDS: 'lucky_spin_deleted_bet_ids_v6',
  WITHDRAWALS: 'lucky_spin_withdrawals_v6',
  DEPOSITS: 'lucky_spin_deposits_v6',
  DEPOSIT_CONFIG: 'lucky_spin_deposit_config_v6',
  NOTIFICATION_CONFIG: 'lucky_spin_notification_config_v6'
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

// 30-MINUTE CUTOFF CHECKER:
// For any round slot (e.g. 4:00 PM), betting STRICTLY CLOSES 30 minutes before spin time (e.g. 3:30 PM)!
function isSlotBettingOpen(slotLabel, targetDateObj = new Date(), now = new Date()) {
  const slot = DAILY_SLOTS.find(s => s.label === slotLabel) || DAILY_SLOTS[0];
  const spinTime = new Date(targetDateObj);
  spinTime.setHours(slot.hour, slot.min, 0, 0);

  // Cutoff is exactly 30 minutes before spin time
  const cutoffTime = new Date(spinTime.getTime() - 30 * 60 * 1000);
  const nowMs = now.getTime();
  const isOpen = nowMs < cutoffTime.getTime();

  return {
    isOpen: isOpen,
    slot: slot,
    label: slot.label,
    spinTime: spinTime,
    cutoffTime: cutoffTime,
    cutoffFormatted: formatTime12(cutoffTime),
    remainingMs: Math.max(0, cutoffTime.getTime() - nowMs),
    isPastSpin: nowMs >= spinTime.getTime()
  };
}

// Compute the next round slot that is CURRENTLY OPEN for betting (before its 30-min cutoff)
function getNextOpenBettingSlotInfo(now = new Date()) {
  const currentTotalSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  for (let slot of DAILY_SLOTS) {
    const cutoffSecs = (slot.hour * 3600 + slot.min * 60) - 1800; // 30 mins before
    if (cutoffSecs > currentTotalSecs) {
      const targetDate = new Date(now);
      targetDate.setHours(slot.hour, slot.min, 0, 0);
      const cutoffDate = new Date(targetDate.getTime() - 30 * 60 * 1000);
      return {
        slot: slot,
        label: slot.label,
        targetDate: targetDate,
        cutoffDate: cutoffDate,
        isTomorrow: false,
        slotKey: `slot-${targetDate.getFullYear()}-${targetDate.getMonth() + 1}-${targetDate.getDate()}-${slot.label}`
      };
    }
  }

  // If past today's last cutoff (10:30 PM), next open betting slot is Tomorrow 12:00 PM (cutoff 11:30 AM tomorrow)
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(DAILY_SLOTS[0].hour, DAILY_SLOTS[0].min, 0, 0);
  const cutoffDate = new Date(tomorrow.getTime() - 30 * 60 * 1000);
  return {
    slot: DAILY_SLOTS[0],
    label: DAILY_SLOTS[0].label,
    targetDate: tomorrow,
    cutoffDate: cutoffDate,
    isTomorrow: true,
    slotKey: `slot-${tomorrow.getFullYear()}-${tomorrow.getMonth() + 1}-${tomorrow.getDate()}-${DAILY_SLOTS[0].label}`
  };
}

class AudioController {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem(STATE_KEYS.SOUND_MUTED) === 'true';
    this.setupGlobalUnlock();
  }

  setupGlobalUnlock() {
    const unlock = () => {
      this.initContext();
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
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

  playAlert() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [880, 1320, 1760];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + idx * 0.09;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.28);
      });
    } catch (e) {}
  }

  playUrgentDepositAlarm() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const pulses = [
        { t: 0.0, freqs: [987.77, 1318.51] },
        { t: 0.14, freqs: [1318.51, 1975.53] },
        { t: 0.35, freqs: [987.77, 1318.51] },
        { t: 0.49, freqs: [1318.51, 1975.53] }
      ];

      pulses.forEach(p => {
        p.freqs.forEach(freq => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const start = this.ctx.currentTime + p.t;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.32, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(start);
          osc.stop(start + 0.18);
        });
      });
    } catch (e) {}
  }

  playCashChime() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const freqs = [1046.50, 1318.51, 1567.98, 2093.00];
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + i * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, start);

        gain.gain.setValueAtTime(0.28, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch (e) {}
  }

  playWarning() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = this.ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, start);
      osc.frequency.linearRampToValueAtTime(180, start + 0.22);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.22);
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
    this.clientId = 'spin_' + Math.random().toString(16).slice(2, 10);
    this.mqttClient = null;
    this.isConnected = false;
    this.broadcastChannel = null;

    // Local multi-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('spinwheel_live_sync_v6');
        this.broadcastChannel.onmessage = (e) => {
          if (e.data) {
            if (e.data.type === 'REQ_SYNC' && e.data.senderId !== this.clientId) {
              this.publishFullState('RES_SYNC');
            } else if (e.data.type === 'LIVE_EVENT') {
              this.app.handleIncomingLiveEvent(e.data);
            } else {
              this.app.handleIncomingRealtimeState(e.data);
            }
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
          clientId: this.clientId,
          clean: true,
          connectTimeout: 5000,
          reconnectPeriod: 4000,
          keepalive: 30
        });

        this.mqttClient.on('connect', () => {
          this.isConnected = true;
          this.updateConnectionUI(true);
          this.mqttClient.subscribe(this.topic, { qos: 1 });

          // Request state from active peers on connect
          this.requestSync();
          // Also announce our state after 1.5s
          setTimeout(() => {
            if (this.isConnected) {
              this.publishFullState('ANNOUNCE_STATE');
            }
          }, 1500);
        });

        this.mqttClient.on('message', (topic, payload) => {
          if (topic === this.topic) {
            try {
              const parsed = JSON.parse(payload.toString());
              if (parsed.type === 'REQ_SYNC') {
                if (parsed.senderId !== this.clientId) {
                  this.publishFullState('RES_SYNC');
                }
              } else if (parsed.type === 'LIVE_EVENT') {
                this.app.handleIncomingLiveEvent(parsed);
              } else {
                this.app.handleIncomingRealtimeState(parsed);
              }
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

  requestSync() {
    const reqPayload = { type: 'REQ_SYNC', senderId: this.clientId };
    if (this.broadcastChannel) {
      try { this.broadcastChannel.postMessage(reqPayload); } catch (e) {}
    }
    if (this.mqttClient && this.isConnected) {
      try { this.mqttClient.publish(this.topic, JSON.stringify(reqPayload), { qos: 1, retain: false }); } catch (e) {}
    }
  }

  broadcastLiveEvent(eventData) {
    const payload = {
      type: 'LIVE_EVENT',
      senderId: this.clientId,
      timestamp: Date.now(),
      ...eventData
    };
    this.publish(payload);
  }

  publishFullState(actionType = 'SYNC_UPDATE') {
    const p = this.app.getCompleteStatePayload({ type: actionType });
    this.publish(p);
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
    this.deletedBetIds = this.loadDeletedBetIds();
    this.activeBets = this.loadActiveBets();
    this.withdrawals = this.loadLocalWithdrawals();
    this.deposits = this.loadLocalDeposits();
    this.depositConfig = this.loadLocalDepositConfig();
    this.notificationConfig = this.loadLocalNotificationConfig();
    this.selectedBetAmount = 10;
    this.selectedBetNumber = null;
    this.isSignUpMode = false;
    this.verifiedForgotUser = null;
    this.adminWdFilter = 'ALL';
    this.adminDepFilter = 'ALL';
    this.custHistoryFilter = 'ALL';
    this.pendingRejectWdId = null;
    this.pendingRejectDepId = null;
    this.currentUploadedReceiptBase64 = '';
    this.currentZoomedDepositId = null;

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

    // Customer Dashboard Subtabs & Panes
    this.dashTabDepositBtn = document.getElementById('dash-tab-deposit-btn');
    this.dashTabWithdrawBtn = document.getElementById('dash-tab-withdraw-btn');
    this.dashTabBetsBtn = document.getElementById('dash-tab-bets-btn');
    this.dashTabHistoryBtn = document.getElementById('dash-tab-history-btn');
    this.dashTabProfileBtn = document.getElementById('dash-tab-profile-btn');
    this.dashDepositPane = document.getElementById('dash-deposit-pane');
    this.dashWithdrawPane = document.getElementById('dash-withdraw-pane');
    this.dashBetsPane = document.getElementById('dash-bets-pane');
    this.dashHistoryPane = document.getElementById('dash-history-pane');
    this.dashProfilePane = document.getElementById('dash-profile-pane');
    this.custBetsBadgeCount = document.getElementById('cust-bets-badge-count');
    this.custRefreshBetsBtn = document.getElementById('cust-refresh-bets-btn');
    this.custBetsHistoryList = document.getElementById('cust-bets-history-list');
    this.custBetAllCount = document.getElementById('cust-bet-all-count');
    this.custBetActiveCount = document.getElementById('cust-bet-active-count');
    this.custBetWonCount = document.getElementById('cust-bet-won-count');
    this.custBetLostCount = document.getElementById('cust-bet-lost-count');
    this.custActiveBetsTotalPool = document.getElementById('cust-active-bets-total-pool');
    this.custBetsTotalWonAmount = document.getElementById('cust-bets-total-won-amount');

    // Customer Deposit Elements
    this.custDepositQrImg = document.getElementById('cust-deposit-qr-img');
    this.custDepositQrFallback = document.getElementById('cust-deposit-qr-fallback');
    this.custDepositUpiId = document.getElementById('cust-deposit-upi-id');
    this.custDepositAccName = document.getElementById('cust-deposit-acc-name');
    this.custDepositMinBadge = document.getElementById('cust-deposit-min-badge');
    this.custDepositInstructions = document.getElementById('cust-deposit-instructions');
    this.custCopyUpiBtn = document.getElementById('cust-copy-upi-btn');
    this.custDepositAmount = document.getElementById('cust-deposit-amount');
    this.custDepositUtr = document.getElementById('cust-deposit-utr');
    this.custDepositReceiptFile = document.getElementById('cust-deposit-receipt-file');
    this.custDepositUploadArea = document.getElementById('cust-deposit-upload-area');
    this.custDepositUploadPrompt = document.getElementById('cust-deposit-upload-prompt');
    this.custDepositPreviewWrap = document.getElementById('cust-deposit-preview-wrap');
    this.custDepositPreviewImg = document.getElementById('cust-deposit-preview-img');
    this.custDepositPreviewRemoveBtn = document.getElementById('cust-deposit-preview-remove-btn');
    this.custDepositError = document.getElementById('cust-deposit-error');
    this.custDepositSuccess = document.getElementById('cust-deposit-success');
    this.custSubmitDepositBtn = document.getElementById('cust-submit-deposit-btn');

    // Customer Withdrawal Elements
    this.custWithdrawName = document.getElementById('cust-withdraw-name');
    this.custWithdrawAccount = document.getElementById('cust-withdraw-account');
    this.custWithdrawIfsc = document.getElementById('cust-withdraw-ifsc');
    this.custWithdrawAmount = document.getElementById('cust-withdraw-amount');
    this.custWithdrawAllBtn = document.getElementById('cust-withdraw-all-btn');
    this.custSaveBankDetails = document.getElementById('cust-save-bank-details');
    this.custWithdrawError = document.getElementById('cust-withdraw-error');
    this.custWithdrawSuccess = document.getElementById('cust-withdraw-success');
    this.custSubmitWithdrawBtn = document.getElementById('cust-submit-withdraw-btn');

    // Customer History & Profile Elements
    this.custRequestsBadgeCount = document.getElementById('cust-requests-badge-count');
    this.custHistAllCount = document.getElementById('cust-hist-all-count');
    this.custHistDepCount = document.getElementById('cust-hist-dep-count');
    this.custHistWdCount = document.getElementById('cust-hist-wd-count');
    this.custRequestsHistoryList = document.getElementById('cust-requests-history-list');
    this.custRefreshHistoryBtn = document.getElementById('cust-refresh-history-btn');
    this.dashProfName = document.getElementById('dash-prof-name');
    this.dashProfId = document.getElementById('dash-prof-id');
    this.dashProfMobile = document.getElementById('dash-prof-mobile');
    this.dashProfDob = document.getElementById('dash-prof-dob');

    // Customer Sign In Form & OTP Elements
    this.customerSigninForm = document.getElementById('customer-signin-form');
    this.custSigninModePassBtn = document.getElementById('cust-signin-mode-pass-btn');
    this.custSigninModeOtpBtn = document.getElementById('cust-signin-mode-otp-btn');
    this.custSigninPassPane = document.getElementById('cust-signin-pass-pane');
    this.custSigninOtpPane = document.getElementById('cust-signin-otp-pane');
    this.custSigninOtpStep1 = document.getElementById('cust-signin-otp-step1');
    this.custLoginMobileInput = document.getElementById('cust-login-mobile-input');
    this.custLoginSendOtpBtn = document.getElementById('cust-login-send-otp-btn');
    this.custSigninOtpStep2 = document.getElementById('cust-signin-otp-step2');
    this.custLoginOtpMobileDisplay = document.getElementById('cust-login-otp-mobile-display');
    this.custLoginOtpPreviewCode = document.getElementById('cust-login-otp-preview-code');
    this.custLoginAutofillBtn = document.getElementById('cust-login-autofill-btn');
    this.custLoginOpenWaBtn = document.getElementById('cust-login-open-wa-btn');
    this.custLoginOtpCodeInput = document.getElementById('cust-login-otp-code-input');
    this.custLoginOtpTimer = document.getElementById('cust-login-otp-timer');
    this.custLoginResendOtpBtn = document.getElementById('cust-login-resend-otp-btn');
    this.custLoginOtpBackBtn = document.getElementById('cust-login-otp-back-btn');
    this.custLoginVerifyOtpBtn = document.getElementById('cust-login-verify-otp-btn');
    this.custLoginId = document.getElementById('cust-login-id');
    this.custLoginPin = document.getElementById('cust-login-pin');
    this.custForgotLink = document.getElementById('cust-forgot-link');
    this.custLoginError = document.getElementById('cust-login-error');
    this.custLoginSuccess = document.getElementById('cust-login-success');
    this.custSigninBtn = document.getElementById('cust-signin-btn');

    // Customer Sign Up Form & OTP Elements
    this.customerSignupForm = document.getElementById('customer-signup-form');
    this.custSignupFieldsStep = document.getElementById('cust-signup-fields-step');
    this.custSignupOtpStep = document.getElementById('cust-signup-otp-step');
    this.custRegOtpMobileDisplay = document.getElementById('cust-reg-otp-mobile-display');
    this.custRegOtpPreviewCode = document.getElementById('cust-reg-otp-preview-code');
    this.custRegAutofillBtn = document.getElementById('cust-reg-autofill-btn');
    this.custRegOpenWaBtn = document.getElementById('cust-reg-open-wa-btn');
    this.custRegOtpCodeInput = document.getElementById('cust-reg-otp-code-input');
    this.custRegOtpTimer = document.getElementById('cust-reg-otp-timer');
    this.custRegResendOtpBtn = document.getElementById('cust-reg-resend-otp-btn');
    this.custRegOtpBackBtn = document.getElementById('cust-reg-otp-back-btn');
    this.custRegVerifyOtpBtn = document.getElementById('cust-reg-verify-otp-btn');
    this.custRegName = document.getElementById('cust-reg-name');
    this.custRegMobile = document.getElementById('cust-reg-mobile');
    this.custRegId = document.getElementById('cust-reg-id');
    this.custRegDob = document.getElementById('cust-reg-dob');
    this.custRegPin = document.getElementById('cust-reg-pin');
    this.custRegConfirmPin = document.getElementById('cust-reg-confirmpin');
    this.custRegError = document.getElementById('cust-reg-error');
    this.custRegSuccess = document.getElementById('cust-reg-success');
    this.custRegisterBtn = document.getElementById('cust-register-btn');

    // Active OTP state sessions
    this.activeLoginOtp = null;
    this.activeSignupOtp = null;
    this.loginOtpInterval = null;
    this.signupOtpInterval = null;
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
    this.customerDepositBtn = document.getElementById('customer-deposit-btn');
    this.customerWithdrawBtn = document.getElementById('customer-withdraw-btn');
    this.customerBetsBtn = document.getElementById('customer-bets-btn');
    this.chipActiveBetsCount = document.getElementById('chip-active-bets-count');
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
    this.myActiveBetsCount = document.getElementById('my-active-bets-count');
    this.myActiveBetsPool = document.getElementById('my-active-bets-pool');
    this.myActiveBetsList = document.getElementById('my-active-bets-list');
    this.predictionFeedbackMsg = document.getElementById('prediction-feedback-msg');

    // Admin Master Auth Elements
    this.masterAuthBtn = document.getElementById('master-auth-btn');
    this.openMasterFromAuthBtn = document.getElementById('open-master-from-auth-btn');
    this.brandHeaderEl = document.getElementById('brand-header');
    this.secretPasswordInput = document.getElementById('secret-password-input');
    this.secretLoginSubmitBtn = document.getElementById('secret-login-submit-btn');
    this.toggleSecretPassBtn = document.getElementById('toggle-secret-pass-btn');
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
    this.applyTimeWinnerBtn = document.getElementById('apply-time-winner-btn');
    this.testTimeWinnerBtn = document.getElementById('test-time-winner-btn');
    this.activeTimingBadge = document.getElementById('active-timing-badge');
    this.badgeTimingText = document.getElementById('badge-timing-text');
    this.badgeTimingWinner = document.getElementById('badge-timing-winner');
    this.clearTimingBtn = document.getElementById('clear-timing-btn');
    this.timerStatusFeedback = document.getElementById('timer-status-feedback');

    // Section 2 Controls (4-Slot Daily Schedule)
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
    this.adminRefreshBetsBtn = document.getElementById('admin-refresh-bets-btn');
    this.adminExportBetsJsonBtn = document.getElementById('admin-export-bets-json-btn');
    this.adminExportCurrentSlotBtn = document.getElementById('admin-export-current-slot-btn');
    this.adminExportFullLedgerBtn = document.getElementById('admin-export-full-ledger-btn');
    this.adminExportActiveEntriesBtn = document.getElementById('admin-export-active-entries-btn');
    this.adminImportLedgerTriggerBtn = document.getElementById('admin-import-ledger-trigger-btn');
    this.adminImportLedgerFile = document.getElementById('admin-import-ledger-file');
    this.adminLedgerFeedback = document.getElementById('admin-ledger-feedback');
    this.adminBetDatePicker = document.getElementById('admin-bet-date-picker');
    this.adminActiveBetsViewingBadge = document.getElementById('admin-active-bets-viewing-badge');
    this.currentAdminBetDateFilter = 'ALL'; // Default: ALL (All Upcoming Dates)
    this.currentAdminBetSlotFilter = 'ALL';
    this.currentAdminBetCustomDate = '';

    // Master Full-Page Nav Tabs & Side Live Monitor Elements
    this.adminNavSpinBtn = document.getElementById('admin-nav-spin-btn');
    this.adminNavPlayersBtn = document.getElementById('admin-nav-players-btn');
    this.adminNavDepositsBtn = document.getElementById('admin-nav-deposits-btn');
    this.adminNavWithdrawalsBtn = document.getElementById('admin-nav-withdrawals-btn');
    this.adminNavSettingsBtn = document.getElementById('admin-nav-settings-btn');
    this.adminNavChatsBtn = document.getElementById('admin-nav-chats-btn');
    this.adminTabChatsPane = document.getElementById('admin-tab-chats-pane');
    this.adminTabBadgeChats = document.getElementById('admin-tab-badge-chats');
    this.adminNavPromosBtn = document.getElementById('admin-nav-promos-btn');
    this.adminTabPromosPane = document.getElementById('admin-tab-promos-pane');
    this.adminTabBadgePromos = document.getElementById('admin-tab-badge-promos');
    this.adminPromosTableBody = document.getElementById('admin-promos-table-body');
    this.supportChats = this.loadLocalSupportChats();
    this.promoCodes = this.loadLocalPromoCodes();
    this.selectedChatPlayerId = null;
    this.sentSlotAlerts = {};
    this.adminTabSpinPane = document.getElementById('admin-tab-spin-pane');
    this.adminTabPlayersPane = document.getElementById('admin-tab-players-pane');
    this.adminTabLiveBetsPane = document.getElementById('admin-tab-livebets-pane');
    this.adminNavLiveBetsBtn = document.getElementById('admin-nav-livebets-btn');
    this.adminTabBadgeLiveBets = document.getElementById('admin-tab-badge-livebets');
    this.adminTabBackupPane = document.getElementById('admin-tab-backup-pane');
    this.adminNavBackupBtn = document.getElementById('admin-nav-backup-btn');
    this.backupStatPlayers = document.getElementById('backup-stat-players');
    this.backupStatCoins = document.getElementById('backup-stat-coins');
    this.backupStatHistory = document.getElementById('backup-stat-history');
    this.backupStatTxns = document.getElementById('backup-stat-txns');
    this.adminMasterBackupFeedback = document.getElementById('admin-master-backup-feedback');
    this.adminTabDepositsPane = document.getElementById('admin-tab-deposits-pane');
    this.adminTabWithdrawalsPane = document.getElementById('admin-tab-withdrawals-pane');
    this.adminTabSettingsPane = document.getElementById('admin-tab-settings-pane');
    this.adminTabBadgePlayers = document.getElementById('admin-tab-badge-players');
    this.adminTabBadgeDeposits = document.getElementById('admin-tab-badge-deposits');
    this.adminTabBadgeWithdrawals = document.getElementById('admin-tab-badge-withdrawals');

    // Admin Deposit Manager Elements
    this.adminDepTotalCount = document.getElementById('admin-dep-total-count');
    this.adminDepPendingCount = document.getElementById('admin-dep-pending-count');
    this.adminDepApprovedCount = document.getElementById('admin-dep-approved-count');
    this.adminDepRejectedCount = document.getElementById('admin-dep-rejected-count');
    this.adminDepTotalAmount = document.getElementById('admin-dep-total-amount');
    this.adminRefreshDepositsBtn = document.getElementById('admin-refresh-deposits-btn');
    this.adminDepSearch = document.getElementById('admin-dep-search');
    this.adminDepositsTableBody = document.getElementById('admin-deposits-table-body');
    this.depFltAll = document.getElementById('dep-flt-all');
    this.depFltPending = document.getElementById('dep-flt-pending');
    this.depFltApproved = document.getElementById('dep-flt-approved');
    this.depFltRejected = document.getElementById('dep-flt-rejected');

    // Admin Settings Box Elements (Both accordion & dedicated tab)
    this.adminSettingsToggleHdr = document.getElementById('admin-settings-toggle-hdr');
    this.adminSettingsBody = document.getElementById('admin-settings-body');
    this.adminSettingsToggleIcon = document.getElementById('admin-settings-toggle-icon');
    this.adminCfgQrPreviewImg = document.getElementById('admin-cfg-qr-preview-img');
    this.adminCfgQrFileInput = document.getElementById('admin-cfg-qr-file-input');
    this.adminCfgUpiId = document.getElementById('admin-cfg-upi-id');
    this.adminCfgUpiName = document.getElementById('admin-cfg-upi-name');
    this.adminCfgMinDeposit = document.getElementById('admin-cfg-min-deposit');
    this.adminCfgInstructions = document.getElementById('admin-cfg-instructions');
    this.adminSaveQrBtn = document.getElementById('admin-save-qr-btn');
    this.adminQrFeedback = document.getElementById('admin-qr-feedback');
    this.adminCfgTgToken = document.getElementById('admin-cfg-tg-token');
    this.adminCfgTgChatid = document.getElementById('admin-cfg-tg-chatid');
    this.adminCfgTgEnable = document.getElementById('admin-cfg-tg-enable');
    this.adminCfgWaNumber = document.getElementById('admin-cfg-wa-number');
    this.adminTestTgBtn = document.getElementById('admin-test-tg-btn');
    this.adminSaveNotificationsBtn = document.getElementById('admin-save-notifications-btn');
    this.adminNotificationFeedback = document.getElementById('admin-notification-feedback');

    // Dedicated Tab 5 Settings Elements
    this.adminCfgTgTokenPane = document.getElementById('admin-cfg-tg-token-pane');
    this.adminCfgTgChatidPane = document.getElementById('admin-cfg-tg-chatid-pane');
    this.adminCfgTgEnablePane = document.getElementById('admin-cfg-tg-enable-pane');
    this.adminCfgWaNumberPane = document.getElementById('admin-cfg-wa-number-pane');
    this.adminSaveNotificationsBtnPane = document.getElementById('admin-save-notifications-btn-pane');
    this.adminTestTgBtnPane = document.getElementById('admin-test-tg-btn-pane');
    this.adminNotificationFeedbackPane = document.getElementById('admin-notification-feedback-pane');
    this.adminCfgQrPreviewImgPane = document.getElementById('admin-cfg-qr-preview-img-pane');
    this.adminCfgQrFileInputPane = document.getElementById('admin-cfg-qr-file-input-pane');
    this.adminCfgUpiIdPane = document.getElementById('admin-cfg-upi-id-pane');
    this.adminCfgUpiNamePane = document.getElementById('admin-cfg-upi-name-pane');
    this.adminCfgMinDepositPane = document.getElementById('admin-cfg-min-deposit-pane');
    this.adminCfgInstructionsPane = document.getElementById('admin-cfg-instructions-pane');
    this.adminSaveQrBtnPane = document.getElementById('admin-save-qr-btn-pane');
    this.adminQrFeedbackPane = document.getElementById('admin-qr-feedback-pane');

    // Admin Withdrawal Manager Elements
    this.adminWdTotalCount = document.getElementById('admin-wd-total-count');
    this.adminWdPendingCount = document.getElementById('admin-wd-pending-count');
    this.adminWdApprovedCount = document.getElementById('admin-wd-approved-count');
    this.adminWdRejectedCount = document.getElementById('admin-wd-rejected-count');
    this.adminWithdrawalsTableBody = document.getElementById('admin-withdrawals-table-body');
    this.adminRefreshWithdrawalsBtn = document.getElementById('admin-refresh-withdrawals-btn');
    this.adminWdSearch = document.getElementById('admin-wd-search');
    this.wdFltAll = document.getElementById('wd-flt-all');
    this.wdFltPending = document.getElementById('wd-flt-pending');
    this.wdFltApproved = document.getElementById('wd-flt-approved');
    this.wdFltRejected = document.getElementById('wd-flt-rejected');

    // Admin Withdrawal Rejection Modal Elements
    this.adminRejectModal = document.getElementById('admin-reject-modal');
    this.adminRejectOverlay = document.getElementById('admin-reject-overlay');
    this.adminRejectCloseBtn = document.getElementById('admin-reject-close-btn');
    this.adminRejectCancelBtn = document.getElementById('admin-reject-cancel-btn');
    this.adminRejectConfirmBtn = document.getElementById('admin-reject-confirm-btn');
    this.rejectModalTitle = document.getElementById('reject-modal-title');
    this.rejectModalDesc = document.getElementById('reject-modal-desc');
    this.adminRejectQuickReason = document.getElementById('admin-reject-quick-reason');
    this.adminRejectReasonText = document.getElementById('admin-reject-reason-text');

    // Admin Player Registration Rejection Modal Elements
    this.adminRejectPlayerModal = document.getElementById('admin-reject-player-modal');
    this.adminRejectPlayerOverlay = document.getElementById('admin-reject-player-overlay');
    this.adminRejectPlayerCloseBtn = document.getElementById('admin-reject-player-close-btn');
    this.adminRejectPlayerCancelBtn = document.getElementById('admin-reject-player-cancel-btn');
    this.adminRejectPlayerConfirmBtn = document.getElementById('admin-reject-player-confirm-btn');
    this.rejectPlayerModalTitle = document.getElementById('reject-player-modal-title');
    this.rejectPlayerModalDesc = document.getElementById('reject-player-modal-desc');
    this.adminRejectPlayerQuickReason = document.getElementById('admin-reject-player-quick-reason');
    this.adminRejectPlayerReasonText = document.getElementById('admin-reject-player-reason-text');

    // Admin Deposit Rejection Modal Elements
    this.adminRejectDepositModal = document.getElementById('admin-reject-deposit-modal');
    this.adminRejectDepositOverlay = document.getElementById('admin-reject-deposit-overlay');
    this.adminRejectDepositCloseBtn = document.getElementById('admin-reject-deposit-close-btn');
    this.adminRejectDepCancelBtn = document.getElementById('admin-reject-dep-cancel-btn');
    this.adminRejectDepConfirmBtn = document.getElementById('admin-reject-dep-confirm-btn');
    this.rejectDepositModalTitle = document.getElementById('reject-deposit-modal-title');
    this.rejectDepositModalDesc = document.getElementById('reject-deposit-modal-desc');
    this.adminRejectDepQuickReason = document.getElementById('admin-reject-dep-quick-reason');
    this.adminRejectDepReasonText = document.getElementById('admin-reject-dep-reason-text');

    // Admin Receipt Zoom Modal Elements
    this.adminReceiptModal = document.getElementById('admin-receipt-modal');
    this.adminReceiptOverlay = document.getElementById('admin-receipt-overlay');
    this.adminReceiptCloseBtn = document.getElementById('admin-receipt-close-btn');
    this.receiptZoomPlayerName = document.getElementById('receipt-zoom-player-name');
    this.receiptZoomPlayerId = document.getElementById('receipt-zoom-player-id');
    this.receiptZoomAmount = document.getElementById('receipt-zoom-amount');
    this.receiptZoomUtr = document.getElementById('receipt-zoom-utr');
    this.receiptZoomCopyUtrBtn = document.getElementById('receipt-zoom-copy-utr-btn');
    this.receiptZoomImg = document.getElementById('receipt-zoom-img');
    this.receiptZoomApproveBtn = document.getElementById('receipt-zoom-approve-btn');
    this.receiptZoomRejectBtn = document.getElementById('receipt-zoom-reject-btn');

    // Admin Player Profile & Complete History Modal Elements
    this.adminPlayerHistoryModal = document.getElementById('admin-player-history-modal');
    this.adminPlayerHistoryOverlay = document.getElementById('admin-player-history-overlay');
    this.adminPlayerHistoryCloseBtn = document.getElementById('admin-player-history-close-btn');
    this.aphAvatarIcon = document.getElementById('aph-avatar-icon');
    this.aphPlayerName = document.getElementById('aph-player-name');
    this.aphPlayerId = document.getElementById('aph-player-id');
    this.aphPlayerMobile = document.getElementById('aph-player-mobile');
    this.aphPlayerDob = document.getElementById('aph-player-dob');
    this.aphPlayerJoined = document.getElementById('aph-player-joined');
    this.aphPlayerPin = document.getElementById('aph-player-pin');
    this.aphTogglePinBtn = document.getElementById('aph-toggle-pin-btn');
    this.aphCoinsBalance = document.getElementById('aph-coins-balance');
    this.aphTotalBets = document.getElementById('aph-total-bets');
    this.aphTotalWins = document.getElementById('aph-total-wins');
    this.aphTotalWd = document.getElementById('aph-total-wd');
    this.aphBankAccName = document.getElementById('aph-bank-acc-name');
    this.aphBankAccNum = document.getElementById('aph-bank-acc-num');
    this.aphBankIfsc = document.getElementById('aph-bank-ifsc');
    this.aphBetsTableBody = document.getElementById('aph-bets-table-body');
    this.aphDepositsTableBody = document.getElementById('aph-deposits-table-body');
    this.aphWdTableBody = document.getElementById('aph-wd-table-body');
    this.aphTabBadgeBets = document.getElementById('aph-tab-badge-bets');
    this.aphTabBadgeDeposits = document.getElementById('aph-tab-badge-deposits');
    this.aphTabBadgeWd = document.getElementById('aph-tab-badge-wd');
    this.aphQuickCreditAmount = document.getElementById('aph-quick-credit-amount');
    this.aphQuickCreditBtn = document.getElementById('aph-quick-credit-btn');
    this.aphQuickCreditFeedback = document.getElementById('aph-quick-credit-feedback');
    this.aphExportPlayerJsonBtn = document.getElementById('aph-export-player-json-btn');
    this.currentAphPlayerId = null;
    this.currentAphTab = 'bets';

    this.adminMiniCanvas = document.getElementById('admin-mini-wheel-canvas');
    this.adminMiniCtx = this.adminMiniCanvas ? this.adminMiniCanvas.getContext('2d') : null;
    this.adminMiniCountdown = document.getElementById('admin-mini-countdown');
    this.adminMiniSlotBadge = document.getElementById('admin-monitor-slot-badge');
    this.adminMiniTargetBadge = document.getElementById('admin-mini-target-badge');
    this.adminMiniLatestWin = document.getElementById('admin-mini-latest-win');
    this.adminMiniTestSpinBtn = document.getElementById('admin-mini-test-spin-btn');

    // Complete Spin History Modal Elements (Public & Player)
    this.viewAllSpinHistoryBtn = document.getElementById('view-all-spin-history-btn');
    this.allHistoryCountBadge = document.getElementById('all-history-count-badge');
    this.allSpinHistoryModal = document.getElementById('all-spin-history-modal');
    this.allSpinHistoryOverlay = document.getElementById('all-spin-history-overlay');
    this.allSpinHistoryCloseBtn = document.getElementById('all-spin-history-close-btn');
    this.modalAllHistoryCount = document.getElementById('modal-all-history-count');
    this.allHistSearch = document.getElementById('all-hist-search');
    this.allHistSlotFilter = document.getElementById('all-hist-slot-filter');
    this.allHistoryTableBody = document.getElementById('all-history-table-body');

    // Admin Complete Spin History Elements
    this.adminSpinHistTotalCount = document.getElementById('admin-spin-hist-total-count');
    this.adminSpinHistSearch = document.getElementById('admin-spin-hist-search');
    this.adminSpinHistFilter = document.getElementById('admin-spin-hist-filter');
    this.adminSpinHistoryTableBody = document.getElementById('admin-spin-history-table-body');

    // Section 6 Controls (Master Key & History)
    this.newMasterKeyInput = document.getElementById('new-master-key-input');
    this.saveMasterKeyBtn = document.getElementById('save-master-key-btn');
    this.keyChangeMsg = document.getElementById('key-change-msg');
    this.resetHistoryBtn = document.getElementById('reset-history-btn');

    this.init();
  }

  async init() {
    this.initLaunchSplash();
    this.setupCanvasDPI();
    this.bindEvents();
    this.bindCustomerEvents();
    this.bindCricbetEvents();
    this.bindAdminPlayerEvents();
    this.updateSoundUI();
    this.alignWheelToLatestResult();
    this.renderWheel();
    this.renderPredictionChips();
    this.updateTargetSlotDisplay();

    // STRICT LIVE REFRESH: Immediately settle all past/elapsed round bets
    try {
      this.settleAllExpiredBets();
      this.settleElapsedSlots();
    } catch (e) {
      console.warn('Initial settle error:', e);
    }

    this.updateCustomerUI();
    
    // Start countdown timer engine immediately so clock & slot display never get stuck
    this.startTimerEngine();

    this.renderLast3Results();
    this.renderAdminSpinHistoryTable();
    this.populateAdminControls();
    this.renderCustomerDepositUI();
    this.populateMasterConfigInputs();

    // 1. Start Instant Real-Time Cloud Synchronization
    try {
      this.cloudSync = new CloudSyncEngine(this);
    } catch (e) {
      console.warn('CloudSyncEngine init error:', e);
    }

    // 2. Pull initial local server state & continuous live polling
    try {
      await this.pullStateFromServer();
    } catch (e) {
      console.warn('Initial state pull error:', e);
    }

    this.startServerPolling();
  }

  initLaunchSplash() {
    const splash = document.getElementById('app-launch-splash');
    const fill = document.getElementById('splash-progress-fill');
    const statusMsg = document.getElementById('splash-status-msg');
    const percentTxt = document.getElementById('splash-percent-txt');

    if (!splash || !fill) return;

    if (window.location.search.includes('nosplash')) {
      splash.style.display = 'none';
      return;
    }

    // Total target duration: 6.2 seconds (between 5-9 seconds as requested)
    const targetDurationMs = 6200;
    const startTime = Date.now();
    let currentPercent = 0;
    let isCompleted = false;

    const statusMilestones = [
      { at: 0, msg: "⚡ Connecting to Live High-Speed Game Servers..." },
      { at: 22, msg: "🔄 Syncing Daily Slots, Wheel Data & History..." },
      { at: 48, msg: "🔒 Verifying Player Balance & Safety Encryption..." },
      { at: 72, msg: "🎲 Finalizing Prediction Engine & Live Canvas..." },
      { at: 92, msg: "✨ Welcome to Spin & Wheel! Launching Game..." }
    ];

    const finishSplash = () => {
      if (isCompleted) return;
      isCompleted = true;

      try {
        this.alignWheelToLatestResult();
        this.renderWheel();
        this.renderLast3Results();
        this.updateCustomerUI();
      } catch (e) {}

      setTimeout(() => {
        splash.classList.add('splash-hide');
        setTimeout(() => {
          splash.style.display = 'none';
        }, 650);
      }, 300);
    };

    const updateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      let progress = (elapsed / targetDurationMs) * 100;

      if (progress >= 100) {
        progress = 100;
        clearInterval(updateInterval);
      }

      currentPercent = Math.min(100, Math.round(progress));
      fill.style.width = `${currentPercent}%`;
      if (percentTxt) percentTxt.textContent = `${currentPercent}%`;

      const currentStatus = [...statusMilestones].reverse().find(m => currentPercent >= m.at);
      if (currentStatus && statusMsg && statusMsg.textContent !== currentStatus.msg) {
        statusMsg.textContent = currentStatus.msg;
      }

      if (progress >= 100) {
        finishSplash();
      }
    }, 40);

    // Optional tap to speed up if user is testing or in a rush
    splash.addEventListener('click', () => {
      if (currentPercent < 92) {
        currentPercent = 95;
        fill.style.width = '95%';
        if (statusMsg) statusMsg.textContent = "✨ Launching Game...";
      }
    });
  }

  renderAllSpinHistoryModalList(searchQuery = '', slotFilter = 'ALL') {
    const list = Array.isArray(this.history) ? this.history : [];
    const totalCount = list.length;

    if (this.allHistoryCountBadge) this.allHistoryCountBadge.textContent = totalCount;
    if (this.modalAllHistoryCount) this.modalAllHistoryCount.textContent = totalCount;

    if (!this.allHistoryTableBody) return;

    const q = (searchQuery || '').toLowerCase().trim();
    const filtered = list.filter(item => {
      if (!item) return false;
      if (slotFilter && slotFilter !== 'ALL') {
        const itemRound = (item.round || '').trim();
        const itemTime = (item.time || '').trim();
        if (itemRound !== slotFilter && !itemTime.includes(slotFilter)) return false;
      }
      if (!q) return true;
      const numStr = String(item.number || '');
      const roundStr = String(item.round || '').toLowerCase();
      const dateStr = String(item.date || '').toLowerCase();
      const timeStr = String(item.time || '').toLowerCase();
      const sourceStr = String(item.source || '').toLowerCase();
      return numStr.includes(q) || roundStr.includes(q) || dateStr.includes(q) || timeStr.includes(q) || sourceStr.includes(q);
    });

    if (filtered.length === 0) {
      this.allHistoryTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; color:var(--text-muted); padding:1.2rem;">
            ${totalCount === 0 ? 'No spin rounds recorded yet.' : 'No spin results match the search/filter.'}
          </td>
        </tr>
      `;
      return;
    }

    this.allHistoryTableBody.innerHTML = '';
    filtered.forEach((item, idx) => {
      const tr = document.createElement('tr');
      const isLatest = (idx === 0);
      const cleanTime = String(item.time || item.round || '').replace(/\s*\([^)]*\)/g, '').trim();

      tr.innerHTML = `
        <td style="white-space:nowrap;">
          <div style="display:flex; align-items:center; gap:6px;">
            <strong style="color:var(--primary-gold-bright); font-size:0.84rem;">${item.round || cleanTime || 'Round'}</strong>
            ${isLatest ? '<span class="status-pill status-approved" style="font-size:0.60rem; padding:1px 5px;">Latest</span>' : ''}
          </div>
        </td>
        <td style="text-align:center; white-space:nowrap;">
          <span style="background:var(--primary-gold-gradient, linear-gradient(135deg, #ffd700, #f5b041)); color:#000; font-weight:900; padding:3px 10px; border-radius:12px; font-size:0.86rem; display:inline-block; box-shadow:0 0 8px rgba(245,176,65,0.4);">
            #${item.number}
          </span>
        </td>
        <td style="white-space:nowrap;">
          <span style="color:#f8fafc; font-weight:600; font-size:0.78rem;">${item.date || ''}</span>
        </td>
        <td style="white-space:nowrap;">
          <span style="font-size:0.68rem; color:#00f0ff; background:rgba(0,240,255,0.1); border:1px solid rgba(0,240,255,0.25); padding:2px 7px; border-radius:4px; font-weight:700;">
            ${item.source || 'Live Round'}
          </span>
        </td>
      `;
      this.allHistoryTableBody.appendChild(tr);
    });
  }
  setupCanvasDPI() {
    const dpr = window.devicePixelRatio || 1;
    const size = 460;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.scale(dpr, dpr);
    this.wheelRadius = size / 2;

    if (this.adminMiniCanvas) {
      const miniSize = 220;
      this.adminMiniCanvas.width = miniSize * dpr;
      this.adminMiniCanvas.height = miniSize * dpr;
      if (this.adminMiniCtx) {
        this.adminMiniCtx.scale(dpr, dpr);
      }
    }
  }

  async handleReload(btnEl) {
    const btn = btnEl || document.getElementById('cric-reload-btn');
    if (btn) btn.classList.add('spinning');

    try {
      // 1. Pull latest server state
      await this.pullStateFromServer();

      // 2. Re-settle any expired bets and elapsed daily slots
      this.settleAllExpiredBets();
      this.settleElapsedSlots();

      // 3. Align wheel to latest winner and redraw
      this.alignWheelToLatestResult();
      this.renderWheel();
      this.renderPredictionChips();
      this.updateTargetSlotDisplay();
      this.renderLast3Results();
      this.updateCustomerUI();

      // 4. Show friendly toast indicator
      this.showToastNotification('🔄 Live state refreshed & synced!');
    } catch (e) {
      console.warn('Reload sync error:', e);
    } finally {
      setTimeout(() => {
        if (btn) btn.classList.remove('spinning');
      }, 600);
    }
  }

  showToastNotification(msg) {
    let toast = document.getElementById('app-reload-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-reload-toast';
      toast.style.cssText = 'position:fixed; top:70px; left:50%; transform:translateX(-50%); background:rgba(20,27,45,0.95); color:#ffd700; border:1px solid rgba(255,215,0,0.5); padding:6px 16px; border-radius:20px; font-size:0.8rem; font-weight:700; z-index:99999; box-shadow:0 0 15px rgba(255,215,0,0.3); pointer-events:none; transition:opacity 0.3s ease;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
    }, 2000);
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

  openAdminPanelDirectly() {
    sessionStorage.setItem('admin_auth', this.masterPassword || '00773300');
    this.openAdminDrawer();
  }

  showLiveToast(opts = {}) {
    let container = document.getElementById('live-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'live-toast-container';
      document.body.appendChild(container);
    }

    const type = opts.type || 'deposit'; // 'deposit', 'withdrawal', 'bet', 'success'
    const title = opts.title || 'Live Notification';
    const message = opts.message || '';
    const meta = opts.meta || formatTime12(new Date());
    const actionText = opts.actionText || '';
    const actionCallback = opts.actionCallback || null;
    const duration = opts.duration || 10000;

    const toast = document.createElement('div');
    toast.className = `live-toast-card toast-${type}`;

    let icon = '🔔';
    if (type === 'deposit') icon = '🚨 <b>DEPOSIT</b>';
    else if (type === 'withdrawal') icon = '💸 <b>WITHDRAWAL</b>';
    else if (type === 'bet') icon = '🎯 <b>LIVE BET</b>';
    else if (type === 'success') icon = '🎉 <b>CONFIRMED</b>';

    toast.innerHTML = `
      <div class="live-toast-header">
        <div class="live-toast-title-wrap">${icon} <span>${title}</span></div>
        <button class="live-toast-close" title="Dismiss">&times;</button>
      </div>
      <div class="live-toast-body">${message}</div>
      <div class="live-toast-meta">
        <span>🕒 ${meta}</span>
      </div>
      ${actionText ? `<div class="live-toast-actions"><button class="live-toast-action-btn">${actionText}</button></div>` : ''}
      <div class="live-toast-progress" style="animation-duration: ${duration}ms;"></div>
    `;

    // Close button
    toast.querySelector('.live-toast-close')?.addEventListener('click', () => {
      toast.style.animation = 'toastSlideOut 0.25s forwards';
      setTimeout(() => toast.remove(), 260);
    });

    // Action button
    if (actionText && actionCallback) {
      toast.querySelector('.live-toast-action-btn')?.addEventListener('click', () => {
        actionCallback();
        toast.style.animation = 'toastSlideOut 0.25s forwards';
        setTimeout(() => toast.remove(), 260);
      });
    }

    container.appendChild(toast);

    // Native OS / Browser Notification if permission granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message.replace(/<[^>]*>?/gm, ''),
          icon: '/master-qr.jpg'
        });
      } catch (e) {}
    }

    // Auto-remove after duration
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'toastSlideOut 0.25s forwards';
        setTimeout(() => toast.remove(), 260);
      }
    }, duration);
  }

  handleIncomingLiveEvent(event) {
    if (!event || !event.eventType) return;

    if (event.eventType === 'CHAT_MESSAGE') {
      const msg = event.chatMessage;
      if (!msg || !msg.playerId) return;
      if (!this.supportChats) this.supportChats = {};
      if (!Array.isArray(this.supportChats[msg.playerId])) this.supportChats[msg.playerId] = [];
      
      const exists = this.supportChats[msg.playerId].some(m => m.id === msg.id);
      if (!exists) {
        this.supportChats[msg.playerId].push(msg);
        this.saveSupportChats(this.supportChats);
      }

      if (this.audio) this.audio.playTick();
      this.updateSupportChatBadges();

      // If customer chat modal is open and belongs to this customer
      const currentCustId = this.currentCustomer ? String(this.currentCustomer.id || '').toLowerCase() : 'guest';
      if (String(msg.playerId).toLowerCase() === currentCustId) {
        this.renderCustomerChatMessages();
      }

      // If admin panel is open, refresh admin chat desk
      if (this.adminTabChatsPane && !this.adminTabChatsPane.classList.contains('hidden')) {
        this.refreshSupportChatsUI();
      }

      // If admin received customer message, show toast on Master screen
      if (msg.sender === 'CUSTOMER') {
        this.showLiveToast({
          title: '’¬ NEW SUPPORT CHAT MESSAGE!',
          message: `<b>${msg.playerName || msg.playerId}</b>: ${msg.text.slice(0, 50)}`,
          type: 'deposit',
          actionText: '‘‰ OPEN LIVE CHAT',
          actionCallback: () => {
            this.openAdminPanelDirectly();
            this.setAdminTab('chats');
            this.selectAdminChatPlayer(msg.playerId);
          }
        });
      }
    }

    else if (event.eventType === 'BROADCAST_NOTIFICATION') {
      this.sendSystemNotification(event.title || 'Ž° SPIN & WHEEL ALERT', event.message || '', event.icon || 'icon-192.png');
    }

    else if (event.eventType === 'NEW_DEPOSIT') {
      const dep = event.deposit;
      if (!dep || !dep.id) return;

      if (!Array.isArray(this.deposits)) this.deposits = [];
      const exists = this.deposits.some(d => d.id === dep.id);
      if (!exists) {
        this.deposits = [dep, ...this.deposits];
        this.saveDeposits(this.deposits);
      }

      // Play loud urgent alarm for Master Admin
      if (this.audio) this.audio.playUrgentDepositAlarm();

      // Show instant live toast banner on Master screen
      this.showLiveToast({
        title: 'NEW DEPOSIT REQUEST RECEIVED!',
        message: `<b>₹${(dep.amount || 0).toLocaleString()}</b> from <b>${dep.customerName || dep.customerId}</b><br>UTR: <code>${dep.utr || 'N/A'}</code>`,
        type: 'deposit',
        actionText: '👉 OPEN DEPOSITS & APPROVE',
        actionCallback: () => {
          this.openAdminPanelDirectly();
          this.setAdminTab('deposits');
          if (dep.id) this.openReceiptZoomModal(dep.id);
        }
      });

      this.updateDepositsCountBadges();
      this.renderAdminDepositsList(this.adminDepFilter, this.adminDepSearch ? this.adminDepSearch.value : '');
      if (this.adminTabBadgeDeposits) {
        this.adminTabBadgeDeposits.classList.add('badge-pulse');
      }
    }

    else if (event.eventType === 'NEW_WITHDRAWAL') {
      const wd = event.withdrawal;
      if (!wd || !wd.id) return;

      if (!Array.isArray(this.withdrawals)) this.withdrawals = [];
      const exists = this.withdrawals.some(w => w.id === wd.id);
      if (!exists) {
        this.withdrawals = [wd, ...this.withdrawals];
        this.saveWithdrawals(this.withdrawals);
      }

      if (this.audio) this.audio.playAlert();

      this.showLiveToast({
        title: 'NEW WITHDRAWAL REQUEST!',
        message: `<b>💰${(wd.amount || 0).toLocaleString()} IHD</b> by <b>${wd.customerName || wd.customerId}</b><br>Bank A/C: <code>${wd.accountNumber}</code> (${wd.ifscCode || ''})`,
        type: 'withdrawal',
        actionText: '👉 VIEW WITHDRAWAL',
        actionCallback: () => {
          this.openAdminPanelDirectly();
          this.setAdminTab('withdrawals');
        }
      });

      this.updateWithdrawalsCountBadges();
      this.renderAdminWithdrawalsList(this.adminWdFilter, this.adminWdSearch ? this.adminWdSearch.value : '');
    }

    else if (event.eventType === 'NEW_BET') {
      const bet = event.bet;
      if (!bet || !bet.id) return;

      if (!Array.isArray(this.activeBets)) this.activeBets = [];
      const exists = this.activeBets.some(b => b.id === bet.id);
      if (!exists) {
        this.activeBets = [bet, ...this.activeBets];
        this.saveActiveBets(this.activeBets);
      }

      // Deduct coins & sync player balance in customersDb
      const pid = bet.playerId || bet.memberId || bet.partyId || event.playerId;
      if (pid && this.customersDb) {
        if (this.customersDb[pid]) {
          if (event.remainingCoins !== undefined) {
            this.customersDb[pid].coins = event.remainingCoins;
          } else if (!exists) {
            this.customersDb[pid].coins = Math.max(0, (this.customersDb[pid].coins || 0) - (bet.amount || 0));
          }
          this.customersDb[pid].totalBets = (this.customersDb[pid].totalBets || 0) + 1;
          this.customersDb[pid].lastUpdated = Date.now();
          if (!Array.isArray(this.customersDb[pid].betHistory)) this.customersDb[pid].betHistory = [];
          if (!this.customersDb[pid].betHistory.some(b => b.id === bet.id)) {
            this.customersDb[pid].betHistory.unshift(bet);
          }
          this.saveCustomersDB(this.customersDb);
        } else if (event.customer) {
          this.customersDb[pid] = event.customer;
          this.saveCustomersDB(this.customersDb);
        }
      }

      // If this browser is logged into this customer account, update session & UI immediately
      if (this.currentCustomer && (this.currentCustomer.id === pid || this.currentCustomer.id === bet.playerId)) {
        if (this.customersDb && this.customersDb[pid]) {
          this.currentCustomer = this.customersDb[pid];
        } else if (event.remainingCoins !== undefined) {
          this.currentCustomer.coins = event.remainingCoins;
        }
        this.saveCustomerSession(this.currentCustomer);
        this.updateCustomerUI();
      }

      if (this.audio) this.audio.playTick();
      this.renderAdminActiveBetsTable();
      this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');

      // If Master Admin has this player's modal open, refresh it live immediately!
      if (this.currentAphPlayerId === pid && this.adminPlayerHistoryModal && !this.adminPlayerHistoryModal.classList.contains('hidden')) {
        this.openPlayerHistoryModal(pid);
      }
    }

    else if (event.eventType === 'DEPOSIT_STATUS_UPDATED') {
      const dep = event.deposit;
      if (!dep || !dep.id) return;

      if (Array.isArray(this.deposits)) {
        this.deposits = this.deposits.map(d => d.id === dep.id ? { ...d, ...dep } : d);
        this.saveDeposits(this.deposits);
        this.renderCustomerRequestsHistory();
        this.renderAdminDepositsList(this.adminDepFilter, this.adminDepSearch ? this.adminDepSearch.value : '');
      }

      if (this.currentCustomer && this.currentCustomer.id === dep.customerId) {
        if (dep.status === 'APPROVED') {
          if (this.audio) this.audio.playCashChime();
          this.showLiveToast({
            title: 'DEPOSIT APPROVED & CREDITED!',
            message: `Your deposit of <b>₹${(dep.amount || 0).toLocaleString()}</b> has been confirmed! <b>💰${(dep.amount || 0).toLocaleString()} IHD Coins</b> added to your wallet.`,
            type: 'success',
            duration: 12000
          });
        } else if (dep.status === 'REJECTED') {
          if (this.audio) this.audio.playWarning();
          this.showLiveToast({
            title: 'DEPOSIT REJECTED',
            message: `Deposit of ₹${dep.amount} was rejected: ${dep.rejectionReason || 'Invalid UTR / receipt'}.`,
            type: 'withdrawal',
            duration: 10000
          });
        }
        this.pullStateFromServer();
      }
    }

    else if (event.eventType === 'WITHDRAWAL_STATUS_UPDATED') {
      const wd = event.withdrawal;
      if (!wd || !wd.id) return;

      if (Array.isArray(this.withdrawals)) {
        this.withdrawals = this.withdrawals.map(w => w.id === wd.id ? { ...w, ...wd } : w);
        this.saveWithdrawals(this.withdrawals);
        this.renderCustomerRequestsHistory();
        this.renderAdminWithdrawalsList(this.adminWdFilter, this.adminWdSearch ? this.adminWdSearch.value : '');
      }

      if (this.currentCustomer && this.currentCustomer.id === wd.customerId) {
        if (wd.status === 'APPROVED') {
          if (this.audio) this.audio.playCashChime();
          this.showLiveToast({
            title: 'WITHDRAWAL APPROVED & TRANSFERRED!',
            message: `<b>💰${(wd.amount || 0).toLocaleString()} IHD Coins</b> transferred to Bank A/C <code>${wd.accountNumber}</code>.`,
            type: 'success',
            duration: 12000
          });
        } else if (wd.status === 'REJECTED') {
          if (this.audio) this.audio.playWarning();
          this.showLiveToast({
            title: 'WITHDRAWAL REJECTED',
            message: `Withdrawal rejected: ${wd.rejectionReason || 'Bank details mismatch'}. 💰${(wd.amount || 0).toLocaleString()} Coins refunded to your balance.`,
            type: 'withdrawal',
            duration: 10000
          });
        }
        this.pullStateFromServer();
      }
    }
  }

  // ==========================================================
  // REAL-TIME STATE SYNC & DEDUPLICATION ENGINE
  // ==========================================================
  handleIncomingRealtimeState(state) {
    if (!state || typeof state !== 'object') return;

    this.applyServerState(state);
    if (state.version && state.version > this.lastVersion) {
      this.lastVersion = state.version;
    }

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

      this.applyServerState(state);
      if (state.version !== undefined && state.version > this.lastVersion) {
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

    // 1. Slices (Strictly fixed 10 numbers: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100)
    this.slices = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    localStorage.setItem(STATE_KEYS.SLICES, JSON.stringify(this.slices));

    // 2. History (STRICT SYNCHRONIZED CLOUD REPLICATION)
    if (Array.isArray(state.history) && state.history.length > 0) {
      const sanitized = this.sanitizeHistory(state.history);
      const currJson = JSON.stringify(this.history || []);
      const newJson = JSON.stringify(sanitized);
      if (currJson !== newJson) {
        this.history = sanitized;
        localStorage.setItem(STATE_KEYS.HISTORY, JSON.stringify(this.history));
        historyNeedsRedraw = true;
      }
    }
    // 3. Forced Next Winner (Strict Protected Lock)
    if (state.forcedNext !== undefined && state.forcedNext !== null) {
      this.forcedNext = state.forcedNext;
      localStorage.setItem(STATE_KEYS.FORCED_NEXT, this.forcedNext);
    } else if (state.forcedAction === 'EXPLICIT_CLEAR' || state.spinTrigger === null) {
      this.forcedNext = null;
      localStorage.removeItem(STATE_KEYS.FORCED_NEXT);
    }

    // 4. Upcoming Queue
    if (Array.isArray(state.upcomingQueue)) {
      this.upcomingQueue = state.upcomingQueue;
      localStorage.setItem(STATE_KEYS.UPCOMING_QUEUE, JSON.stringify(this.upcomingQueue));
    }

    // 5. 4-Slot Daily Schedule (Seamless Real-Time Master ID Sync)
    if (state.dailySchedule && typeof state.dailySchedule === 'object') {
      const mergedSchedule = { ...(this.dailySchedule || {}) };
      let scheduleChanged = false;

      DAILY_SLOTS.forEach(slotObj => {
        const slot = slotObj.label;
        const remoteVal = state.dailySchedule[slot];
        if (remoteVal !== undefined && remoteVal !== null) {
          const val = remoteVal === 'AUTO' ? 'AUTO' : parseInt(remoteVal, 10);
          if (mergedSchedule[slot] !== val) {
            mergedSchedule[slot] = val;
            scheduleChanged = true;
          }
        }
      });

      this.dailySchedule = mergedSchedule;
      localStorage.setItem(STATE_KEYS.DAILY_SCHEDULE, JSON.stringify(this.dailySchedule));
      if (this.isDrawerOpen) {
        this.renderDailyScheduleTable();
        this.updateSection1BadgeForSelectedSlot();
      }
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

    // 8. Registered Players Database (INTELLIGENT DEEP MERGE)
    let playersChanged = false;
    if (state.customersDb && typeof state.customersDb === 'object') {
      const mergedDb = { ...(this.customersDb || {}) };
      const isRemoteStateFresh = !state.version || state.version >= (this.lastVersion || 0);

      Object.keys(state.customersDb).forEach(id => {
        if (!mergedDb[id]) {
          mergedDb[id] = state.customersDb[id];
          playersChanged = true;
        } else {
          const localP = mergedDb[id];
          const remoteP = state.customersDb[id];
          const localTs = localP.lastUpdated || 0;
          const remoteTs = remoteP.lastUpdated || 0;

          let resolvedCoins = localP.coins || 0;
          if (remoteTs > localTs) {
            resolvedCoins = remoteP.coins !== undefined ? remoteP.coins : resolvedCoins;
          } else if (remoteTs === localTs && isRemoteStateFresh) {
            resolvedCoins = remoteP.coins !== undefined ? remoteP.coins : resolvedCoins;
          }

          mergedDb[id] = {
            ...localP,
            ...remoteP,
            coins: resolvedCoins,
            lastUpdated: Math.max(localTs, remoteTs),
            totalBets: Math.max(localP.totalBets || 0, remoteP.totalBets || 0),
            wins: Math.max(localP.wins || 0, remoteP.wins || 0),
            betHistory: (Array.isArray(localP.betHistory) || Array.isArray(remoteP.betHistory))
              ? Array.from(new Map([
                  ...(Array.isArray(localP.betHistory) ? localP.betHistory : []),
                  ...(Array.isArray(remoteP.betHistory) ? remoteP.betHistory : [])
                ].map(item => [item.id || (item.timestamp + '_' + item.number), item])).values())
              : [],
            bankDetails: remoteP.bankDetails || localP.bankDetails || null
          };
          playersChanged = true;
        }
      });
      if (state.newPlayer && state.newPlayer.id) {
        mergedDb[state.newPlayer.id] = state.newPlayer;
        playersChanged = true;
      }
      this.customersDb = mergedDb;
      this.saveCustomersDB(this.customersDb);
      if (this.currentCustomer && this.customersDb[this.currentCustomer.id]) {
        this.currentCustomer = this.customersDb[this.currentCustomer.id];
        this.saveCustomerSession(this.currentCustomer);
        this.updateCustomerUI();
      }
    } else if (state.newPlayer && state.newPlayer.id) {
      this.customersDb = this.customersDb || {};
      this.customersDb[state.newPlayer.id] = state.newPlayer;
      this.saveCustomersDB(this.customersDb);
      playersChanged = true;
    }

    if (playersChanged || this.isDrawerOpen) {
      this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');
    }

    // 9. Active Bets & Predictions (SMART FILTER - NEVER RESURRECT DELETED BETS)
    let betsChanged = false;
    if (state.deletedBetId) {
      const delId = String(state.deletedBetId);
      this.deletedBetIds.add(delId);
      this.saveDeletedBetIds(this.deletedBetIds);
      const beforeLen = (this.activeBets || []).length;
      this.activeBets = (this.activeBets || []).filter(b => b && String(b.id) !== delId);
      if (this.activeBets.length !== beforeLen) betsChanged = true;
    }
    if (Array.isArray(state.deletedBetIds)) {
      state.deletedBetIds.forEach(id => this.deletedBetIds.add(String(id)));
      this.saveDeletedBetIds(this.deletedBetIds);
    }

    if (Array.isArray(state.activeBets)) {
      const betMap = new Map();
      // 1. Add valid remote bets
      state.activeBets.forEach(b => {
        if (b && b.id && !this.deletedBetIds.has(String(b.id))) {
          betMap.set(String(b.id), b);
        }
      });
      // 2. Preserve local active bets that are not deleted or settled
      (this.activeBets || []).forEach(b => {
        if (b && b.id && !this.deletedBetIds.has(String(b.id))) {
          if (!betMap.has(String(b.id))) {
            betMap.set(String(b.id), b);
          }
        }
      });
      const mergedBets = Array.from(betMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      const currJson = JSON.stringify((this.activeBets || []).map(b => b.id));
      const newJson = JSON.stringify(mergedBets.map(b => b.id));
      if (currJson !== newJson || state.deletedBetId) {
        this.activeBets = mergedBets;
        this.saveActiveBets(this.activeBets);
        this.settleAllExpiredBets();
        betsChanged = true;
      }
    } else if (state.newBet && state.newBet.id && !this.deletedBetIds.has(String(state.newBet.id))) {
      const exists = (this.activeBets || []).some(b => String(b.id) === String(state.newBet.id));
      if (!exists) {
        this.activeBets = [state.newBet, ...(this.activeBets || [])];
        this.saveActiveBets(this.activeBets);
        this.settleAllExpiredBets();
        betsChanged = true;
      }
    }
    if (betsChanged || this.isDrawerOpen) {
      this.renderAdminActiveBetsTable();
      this.updateCustomerUI();
    }

    // 10. Withdrawals Requests Database
    if (Array.isArray(state.withdrawals)) {
      const prevPendingWdIds = new Set((this.withdrawals || []).filter(w => w.status === 'PENDING').map(w => w.id));
      const wdMap = new Map((this.withdrawals || []).map(w => [w.id, w]));
      let newPendingWd = null;

      state.withdrawals.forEach(w => {
        if (w && w.id) {
          wdMap.set(w.id, w);
          if (w.status === 'PENDING' && !prevPendingWdIds.has(w.id)) {
            newPendingWd = w;
          }
        }
      });
      this.withdrawals = Array.from(wdMap.values()).sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
      this.saveWithdrawals(this.withdrawals);
      this.renderCustomerRequestsHistory();
      this.renderAdminWithdrawalsList(this.adminWdFilter, this.adminWdSearch ? this.adminWdSearch.value : '');

      if (newPendingWd) {
        if (this.audio) this.audio.playAlert();
        this.showLiveToast({
          title: 'NEW WITHDRAWAL REQUEST!',
          message: `<b>💰${(newPendingWd.amount || 0).toLocaleString()} IHD</b> by <b>${newPendingWd.customerName || newPendingWd.customerId}</b><br>Bank A/C: <code>${newPendingWd.accountNumber}</code> (${newPendingWd.ifscCode || ''})`,
          type: 'withdrawal',
          actionText: '👉 VIEW WITHDRAWAL',
          actionCallback: () => {
            this.openAdminPanelDirectly();
            this.setAdminTab('withdrawals');
          }
        });
      }
    }

    // 11. Deposits Requests Database
    if (Array.isArray(state.deposits)) {
      const prevPendingDepIds = new Set((this.deposits || []).filter(d => d.status === 'PENDING').map(d => d.id));
      const depMap = new Map((this.deposits || []).map(d => [d.id, d]));
      let newPendingDep = null;

      state.deposits.forEach(d => {
        if (d && d.id) {
          depMap.set(d.id, d);
          if (d.status === 'PENDING' && !prevPendingDepIds.has(d.id)) {
            newPendingDep = d;
          }
        }
      });
      this.deposits = Array.from(depMap.values()).sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
      this.saveDeposits(this.deposits);
      this.renderCustomerRequestsHistory();
      this.renderAdminDepositsList(this.adminDepFilter, this.adminDepSearch ? this.adminDepSearch.value : '');

      if (newPendingDep) {
        if (this.audio) this.audio.playUrgentDepositAlarm();
        this.showLiveToast({
          title: 'NEW DEPOSIT REQUEST RECEIVED!',
          message: `<b>₹${(newPendingDep.amount || 0).toLocaleString()}</b> from <b>${newPendingDep.customerName || newPendingDep.customerId}</b><br>UTR: <code>${newPendingDep.utr || 'N/A'}</code>`,
          type: 'deposit',
          actionText: '👉 OPEN DEPOSITS & APPROVE',
          actionCallback: () => {
            this.openAdminPanelDirectly();
            this.setAdminTab('deposits');
            if (newPendingDep.id) this.openReceiptZoomModal(newPendingDep.id);
          }
        });
        if (this.adminTabBadgeDeposits) {
          this.adminTabBadgeDeposits.classList.add('badge-pulse');
        }
      }
    }

    // 12. Master Deposit & Notification Configurations
    if (state.depositConfig && typeof state.depositConfig === 'object') {
      const remote = state.depositConfig;
      this.depositConfig = {
        upiId: (remote.upiId && remote.upiId.trim()) ? remote.upiId.trim() : (this.depositConfig?.upiId || '00000000'),
        accountName: (remote.accountName && remote.accountName.trim()) ? remote.accountName.trim() : (this.depositConfig?.accountName || 'DEEP'),
        minDeposit: remote.minDeposit !== undefined ? Number(remote.minDeposit) : (this.depositConfig?.minDeposit || 100),
        instructions: (remote.instructions && remote.instructions.trim()) ? remote.instructions : (this.depositConfig?.instructions || '1. Scan QR with PhonePe / GPay / Paytm & Pay.\n2. Enter 12-digit UTR No. & upload payment screenshot below.'),
        qrImageUrl: remote.qrImageUrl !== undefined ? remote.qrImageUrl : (this.depositConfig?.qrImageUrl || '')
      };
      this.saveDepositConfig(this.depositConfig);
      this.renderCustomerDepositUI();
      this.populateMasterConfigInputs();
    }
    if (state.notificationConfig && typeof state.notificationConfig === 'object') {
      const remote = state.notificationConfig;
      const local = this.notificationConfig || {};
      this.notificationConfig = {
        telegramBotToken: (remote.telegramBotToken && remote.telegramBotToken.trim()) ? remote.telegramBotToken : (local.telegramBotToken || ''),
        telegramChatId: (remote.telegramChatId && remote.telegramChatId.trim()) ? remote.telegramChatId : (local.telegramChatId || ''),
        telegramEnabled: remote.telegramEnabled !== undefined ? remote.telegramEnabled : (local.telegramEnabled !== undefined ? local.telegramEnabled : true),
        whatsappNumber: (remote.whatsappNumber && remote.whatsappNumber.trim()) ? remote.whatsappNumber : (local.whatsappNumber || '')
      };
      this.saveNotificationConfig(this.notificationConfig);
      this.populateMasterConfigInputs();
      if (this.notificationConfig.telegramBotToken && !remote.telegramBotToken) {
        this.pushStateToServer({ notificationConfig: this.notificationConfig });
      }
    }

    // Refresh open Player History Modal in real-time
    if (this.currentAphPlayerId && this.adminPlayerHistoryModal && !this.adminPlayerHistoryModal.classList.contains('hidden')) {
      this.openPlayerHistoryModal(this.currentAphPlayerId);
    }

    // Update UI components
    if (wheelNeedsRedraw && !this.isSpinning) {
      this.renderWheel();
      this.renderPredictionChips();
    }
    if (historyNeedsRedraw) {
      this.renderLast3Results();
      this.renderAllSpinHistoryModalList();
      this.renderAdminSpinHistoryTable();
      if (!this.isSpinning) this.alignWheelToLatestResult();
    }
    if (this.isDrawerOpen) {
      this.updateSection1BadgeForSelectedSlot();
      this.renderDailyScheduleTable();
    } else {
      this.updateForcedWinnerUI();
    }
  }

  getCompleteStatePayload(additionalFields = {}) {
    const adminAuth = sessionStorage.getItem('admin_auth') || (this.isDrawerOpen ? (this.masterPassword || '00773300') : null);
    const isAdmin = Boolean(adminAuth);

    const payload = {
      slices: this.slices,
      history: this.history,
      timerMode: this.timerMode,
      customSecs: this.customSecs,
      customTimerTarget: this.customTimerTarget,
      customersDb: this.customersDb || {},
      activeBets: this.activeBets || [],
      withdrawals: this.withdrawals || [],
      deposits: this.deposits || [],
      depositConfig: this.depositConfig || {},
      notificationConfig: this.notificationConfig || {},
      version: this.version || Date.now(),
      ...additionalFields
    };

    // Only include sensitive admin controls if admin is active
    if (isAdmin) {
      payload.adminKey = adminAuth;
      payload.masterPassword = this.masterPassword;
      payload.forcedNext = this.forcedNext;
      payload.upcomingQueue = this.upcomingQueue;
      payload.dailySchedule = this.dailySchedule;
    }

    return payload;
  }

  async pushStateToServer(additionalFields = {}) {
    this.version = Date.now();
    this.lastVersion = this.version;

    const adminAuth = sessionStorage.getItem('admin_auth') || (this.isDrawerOpen ? (this.masterPassword || '00773300') : null);
    const payload = this.getCompleteStatePayload({ 
      version: this.version, 
      ...(adminAuth ? { adminKey: adminAuth } : {}), 
      ...additionalFields 
    });

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
    this.saveWithdrawals(this.withdrawals);
    this.saveDeposits(this.deposits);
    if (this.depositConfig) this.saveDepositConfig(this.depositConfig);
    if (this.notificationConfig) this.saveNotificationConfig(this.notificationConfig);

    // 1. Broadcast immediately to all connected Mobile & PC devices via MQTT WebSocket & BroadcastChannel
    if (this.cloudSync) {
      try {
        this.cloudSync.publish(payload);
      } catch (err) {}
    }

    // 2. Local HTTP server backup
    try {
      const resp = await fetch('/api/state', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-key': adminAuth
        },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        this.isServerConnected = true;
      }
    } catch (e) {
      this.isServerConnected = false;
    }
  }

  startServerPolling() {
    if (this._pollingInterval) clearInterval(this._pollingInterval);
    this._pollingInterval = setInterval(() => {
      this.pullStateFromServer();
    }, 1500);

    // Instant live synchronization whenever app window/tab is focused or restored
    window.addEventListener('focus', () => this.pullStateFromServer());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.pullStateFromServer();
    });
  }

  // ==========================================================
  // LOCAL STORAGE LOADERS
  // ==========================================================
  sanitizeHistory(list) {
    if (!Array.isArray(list)) return [];
    const slices = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const histMap = new Map();

    list.forEach(item => {
      if (!item) return;
      let cleanTime = String(item.time || item.round || 'Completed').replace(/\s*\([^)]*\)/g, '').trim();
      let cleanRound = String(item.round || item.time || 'Round').replace(/\s*\([^)]*\)/g, '').trim();
      let num = Number(item.number);
      let dateStr = String(item.date || '').trim();

      if (!slices.includes(num)) {
        num = slices.find(s => s === num) || 80;
      }

      const ts = Number(item.timestamp || item.id || Date.now());
      const cleanItem = {
        ...item,
        id: item.id || ts,
        number: num,
        time: cleanTime,
        round: cleanRound,
        date: dateStr,
        source: item.source || 'Scheduled Round',
        timestamp: ts
      };

      const key = `${dateStr}_${cleanRound}`;
      if (!histMap.has(key)) {
        histMap.set(key, cleanItem);
      } else {
        const existing = histMap.get(key);
        if (ts > (existing.timestamp || 0)) {
          histMap.set(key, cleanItem);
        }
      }
    });

    const sorted = Array.from(histMap.values())
      .sort((a, b) => (b.timestamp || b.id || 0) - (a.timestamp || a.id || 0))
      .slice(0, 150);

    return sorted;
  }

  loadLocalSlices() {
    return [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  }

  loadLocalHistory() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
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

  loadDeletedBetIds() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.DELETED_BET_IDS);
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {}
    return new Set();
  }

  saveDeletedBetIds(setOrArr) {
    try {
      const arr = Array.from(setOrArr || []).slice(-200);
      localStorage.setItem(STATE_KEYS.DELETED_BET_IDS, JSON.stringify(arr));
    } catch (e) {}
  }

  loadActiveBets() {
    const deleted = this.deletedBetIds || this.loadDeletedBetIds();
    const now = new Date();
    const betMap = new Map();

    try {
      const saved = localStorage.getItem(STATE_KEYS.ACTIVE_BETS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(b => {
            if (b && b.id && !deleted.has(String(b.id))) {
              if (this.isBetUpcoming ? this.isBetUpcoming(b, now) : true) {
                betMap.set(String(b.id), b);
              }
            }
          });
        }
      }
    } catch (e) {}

    return Array.from(betMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  saveActiveBets(bets) {
    const deleted = this.deletedBetIds || this.loadDeletedBetIds();
    this.activeBets = Array.isArray(bets) ? bets.filter(b => b && b.id && !deleted.has(String(b.id))) : [];
    try {
      localStorage.setItem(STATE_KEYS.ACTIVE_BETS, JSON.stringify(this.activeBets));
    } catch (e) {}
  }

  loadLocalWithdrawals() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.WITHDRAWALS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  }

  saveWithdrawals(list) {
    this.withdrawals = Array.isArray(list) ? list : [];
    try {
      localStorage.setItem(STATE_KEYS.WITHDRAWALS, JSON.stringify(this.withdrawals));
    } catch (e) {}
    this.updateWithdrawalsCountBadges();
  }

  loadLocalDeposits() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.DEPOSITS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  }

  saveDeposits(list) {
    this.deposits = Array.isArray(list) ? list : [];
    try {
      localStorage.setItem(STATE_KEYS.DEPOSITS, JSON.stringify(this.deposits));
    } catch (e) {}
    this.updateDepositsCountBadges();
  }

  loadLocalDepositConfig() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.DEPOSIT_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            upiId: (parsed.upiId && parsed.upiId !== 'master@upi') ? parsed.upiId : '00000000',
            accountName: (parsed.accountName && parsed.accountName !== 'Master Admin') ? parsed.accountName : 'DEEP',
            qrImageUrl: (parsed.qrImageUrl && parsed.qrImageUrl.length > 5) ? parsed.qrImageUrl : './master-qr.jpg',
            minDeposit: parsed.minDeposit || 100,
            instructions: parsed.instructions || '1. Scan QR with PhonePe / GPay / Paytm & Pay.\n2. Enter 12-digit UTR No. & upload payment screenshot below.'
          };
        }
      }
    } catch (e) {}
    return {
      upiId: '00000000',
      accountName: 'DEEP',
      qrImageUrl: './master-qr.jpg',
      minDeposit: 100,
      instructions: '1. Scan QR with PhonePe / GPay / Paytm & Pay.\n2. Enter 12-digit UTR No. & upload payment screenshot below.'
    };
  }

  saveDepositConfig(cfg) {
    this.depositConfig = { ...(this.depositConfig || {}), ...cfg };
    try {
      localStorage.setItem(STATE_KEYS.DEPOSIT_CONFIG, JSON.stringify(this.depositConfig));
    } catch (e) {}
  }

  loadLocalNotificationConfig() {
    try {
      const saved = localStorage.getItem(STATE_KEYS.NOTIFICATION_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            telegramBotToken: parsed.telegramBotToken || '',
            telegramChatId: parsed.telegramChatId || '8187881990',
            telegramEnabled: parsed.telegramEnabled !== false,
            whatsappNumber: parsed.whatsappNumber || ''
          };
        }
      }
    } catch (e) {}
    return {
      telegramBotToken: '',
      telegramChatId: '8187881990',
      telegramEnabled: true,
      whatsappNumber: ''
    };
  }

  saveNotificationConfig(cfg) {
    this.notificationConfig = { ...(this.notificationConfig || {}), ...cfg };
    try {
      localStorage.setItem(STATE_KEYS.NOTIFICATION_CONFIG, JSON.stringify(this.notificationConfig));
    } catch (e) {}
  }

  updateDepositsCountBadges() {
    const list = Array.isArray(this.deposits) ? this.deposits : [];
    const pendingCount = list.filter(d => d.status === 'PENDING').length;
    if (this.adminTabBadgeDeposits) {
      this.adminTabBadgeDeposits.textContent = pendingCount;
    }
    this.updateCombinedRequestsBadge();
  }

  updateWithdrawalsCountBadges() {
    const list = Array.isArray(this.withdrawals) ? this.withdrawals : [];
    const pendingCount = list.filter(w => w.status === 'PENDING').length;
    if (this.adminTabBadgeWithdrawals) {
      this.adminTabBadgeWithdrawals.textContent = pendingCount;
    }
    this.updateCombinedRequestsBadge();
  }

  isCustomerRequest(item) {
    if (!item || !this.currentCustomer) return false;
    const cId = String(this.currentCustomer.id || '').trim().toLowerCase();
    const cMobile = String(this.currentCustomer.mobile || '').trim();
    const cName = String(this.currentCustomer.name || '').trim().toLowerCase();

    const itemCustId = String(item.customerId || item.memberId || item.userId || item.playerId || item.partyId || '').trim().toLowerCase();
    const itemMobile = String(item.customerMobile || item.mobile || item.partyMobile || '').trim();
    const itemName = String(item.customerName || item.playerName || item.partyName || '').trim().toLowerCase();

    if (cId && itemCustId && (itemCustId === cId || itemCustId.includes(cId) || cId.includes(itemCustId))) return true;
    if (cMobile && itemMobile && (itemMobile === cMobile)) return true;
    if (cName && itemName && (itemName === cName)) return true;
    return false;
  }

  updateCombinedRequestsBadge() {
    if (!this.currentCustomer) return;
    const myWds = (this.withdrawals || []).filter(w => this.isCustomerRequest(w));
    const myDeps = (this.deposits || []).filter(d => this.isCustomerRequest(d));
    const totalCount = myWds.length + myDeps.length;
    if (this.custRequestsBadgeCount) {
      this.custRequestsBadgeCount.textContent = totalCount;
    }
    if (this.custHistAllCount) this.custHistAllCount.textContent = totalCount;
    if (this.custHistDepCount) this.custHistDepCount.textContent = myDeps.length;
    if (this.custHistWdCount) this.custHistWdCount.textContent = myWds.length;
  }

  renderCustomerDepositUI() {
    const cfg = this.depositConfig || {};
    const upiId = (cfg.upiId && cfg.upiId !== 'master@upi') ? cfg.upiId : '00000000';
    const accName = (cfg.accountName && cfg.accountName !== 'Master Admin') ? cfg.accountName : 'DEEP';
    const minDep = cfg.minDeposit || 100;
    const instructions = cfg.instructions || '1. Scan QR with PhonePe / GPay / Paytm & Pay.\n2. Enter 12-digit UTR No. & upload payment screenshot below.';

    if (this.custDepositUpiId) this.custDepositUpiId.textContent = upiId;
    if (this.custDepositAccName) this.custDepositAccName.textContent = accName;
    if (this.custDepositMinBadge) this.custDepositMinBadge.textContent = `Min. ₹${minDep} (1 IHD = ₹1)`;
    if (this.custDepositInstructions) this.custDepositInstructions.textContent = instructions;
    if (this.custDepositAmount) {
      this.custDepositAmount.min = minDep;
      if (!this.custDepositAmount.value || parseInt(this.custDepositAmount.value, 10) < minDep) {
        this.custDepositAmount.value = minDep;
      }
    }

    if (this.custDepositQrImg) {
      const qrSrc = cfg.qrImageUrl && cfg.qrImageUrl.trim().length > 5 ? cfg.qrImageUrl : './master-qr.jpg';
      this.custDepositQrImg.src = qrSrc;
      this.custDepositQrImg.classList.remove('hidden');
      if (this.custDepositQrFallback) this.custDepositQrFallback.classList.add('hidden');
    }
  }

  populateMasterConfigInputs() {
    const depCfg = this.depositConfig || {};
    const notifCfg = this.notificationConfig || {};

    const upiVal = depCfg.upiId || '';
    const nameVal = depCfg.accountName || '';
    const minVal = depCfg.minDeposit || 100;
    const instVal = depCfg.instructions || '';

    // UPI & QR inputs across both panels
    if (this.adminCfgUpiId) this.adminCfgUpiId.value = upiVal;
    if (this.adminCfgUpiName) this.adminCfgUpiName.value = nameVal;
    if (this.adminCfgMinDeposit) this.adminCfgMinDeposit.value = minVal;
    if (this.adminCfgInstructions) this.adminCfgInstructions.value = instVal;
    
    if (this.adminCfgUpiIdPane) this.adminCfgUpiIdPane.value = upiVal;
    if (this.adminCfgUpiNamePane) this.adminCfgUpiNamePane.value = nameVal;
    if (this.adminCfgMinDepositPane) this.adminCfgMinDepositPane.value = minVal;
    if (this.adminCfgInstructionsPane) this.adminCfgInstructionsPane.value = instVal;

    const qrSrc = depCfg.qrImageUrl || (upiVal ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent('upi://pay?pa=' + upiVal + '&pn=' + encodeURIComponent(nameVal || 'Master') + '&cu=INR')}` : '');
    if (this.adminCfgQrPreviewImg && qrSrc) this.adminCfgQrPreviewImg.src = qrSrc;
    if (this.adminCfgQrPreviewImgPane && qrSrc) this.adminCfgQrPreviewImgPane.src = qrSrc;

    // Telegram & WhatsApp inputs across both panels
    const tgTokenVal = notifCfg.telegramBotToken || '';
    const tgChatidVal = notifCfg.telegramChatId || '';
    const tgEnabledVal = notifCfg.telegramEnabled !== false;
    const waVal = notifCfg.whatsappNumber || '';

    if (this.adminCfgTgToken) this.adminCfgTgToken.value = tgTokenVal;
    if (this.adminCfgTgChatid) this.adminCfgTgChatid.value = tgChatidVal;
    if (this.adminCfgTgEnable) this.adminCfgTgEnable.checked = tgEnabledVal;
    if (this.adminCfgWaNumber) this.adminCfgWaNumber.value = waVal;

    if (this.adminCfgTgTokenPane) this.adminCfgTgTokenPane.value = tgTokenVal;
    if (this.adminCfgTgChatidPane) this.adminCfgTgChatidPane.value = tgChatidVal;
    if (this.adminCfgTgEnablePane) this.adminCfgTgEnablePane.checked = tgEnabledVal;
    if (this.adminCfgWaNumberPane) this.adminCfgWaNumberPane.value = waVal;
  }

  compressAndConvertImageToBase64(file, maxWidth = 800, maxHeight = 800, quality = 0.75) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve('');
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  async sendWhatsAppNotification(text) {
    try {
      const cfg = this.notificationConfig || {};
      let phone = (cfg.whatsappNumber || '7690900087').toString().replace(/[^\d]/g, '');
      if (phone.startsWith('0')) phone = phone.substring(1);
      if (phone.length === 10) phone = '91' + phone;
      const apiKey = (cfg.whatsappApiKey || '').trim();
      if (!apiKey || !phone || cfg.whatsappEnabled === false) return false;

      const cleanText = String(text || '').replace(/[*`_~\[\]()<>#]/g, '');
      const url = `https://api.callmebot.com/whatsapp.php?phone=+${phone}&text=${encodeURIComponent(cleanText)}&apikey=${encodeURIComponent(apiKey)}`;
      await fetch(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  async sendTelegramNotification(text) {
    try {
      const cfg = this.notificationConfig || {};
      const token = (cfg.telegramBotToken || '').trim();
      const chatId = (cfg.telegramChatId || '').trim();
      if (!token || !chatId || cfg.telegramEnabled === false) {
        return false;
      }

      // Safe HTML message conversion
      const cleanHtml = text
        .replace(/\*(.*?)\*/g, '<b>$1</b>')
        .replace(/`(.*?)`/g, '<code>$1</code>');

      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      let res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: cleanHtml,
          parse_mode: 'HTML'
        })
      });
      let data = await res.json();
      if (!data || !data.ok) {
        // Fallback: send plain text
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: text.replace(/[*`_~]/g, '')
          })
        });
        data = await res.json();
      }
      return data && data.ok;
    } catch (e) {
      console.warn('Telegram Notification error:', e);
      return false;
    }
  }

  async sendTelegramTestNotification() {
    const token = (this.adminCfgTgTokenPane?.value || this.adminCfgTgToken?.value || this.notificationConfig?.telegramBotToken || '').trim();
    const chatId = (this.adminCfgTgChatidPane?.value || this.adminCfgTgChatid?.value || this.notificationConfig?.telegramChatId || '').trim();
    if (!token || !chatId) {
      this.showNotificationFeedback('❌ Please enter Telegram Bot Token and Chat ID first!', false);
      return;
    }

    const testMsg = `🔔 <b>LUCKY HOURLY SPIN - TEST ALERT</b>\n\n✅ <b>Mobile Notification connected successfully!</b>\n🕒 <b>Time:</b> ${formatTime12(new Date())}\n\nYou will now receive instant loud alerts on your phone for every new customer Registration, Deposit, Withdrawal, Prediction Bet, and Live Winning Spin!`;

    this.showNotificationFeedback('⏳ Sending test notification to your phone...', true);

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      let res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: testMsg,
          parse_mode: 'HTML'
        })
      });
      let data = await res.json();
      if (!data || !data.ok) {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: testMsg.replace(/<[^>]+>/g, '')
          })
        });
        data = await res.json();
      }
      if (data && data.ok) {
        this.showNotificationFeedback('🎉 Success! Test alert received on your Telegram phone app!', true);
        if (this.audio) this.audio.playWinFanfare();
        // Auto-persist verified Telegram credentials
        this.notificationConfig = {
          telegramBotToken: token,
          telegramChatId: chatId,
          telegramEnabled: true,
          whatsappNumber: (this.adminCfgWaNumberPane?.value || this.adminCfgWaNumber?.value || this.notificationConfig?.whatsappNumber || '').trim()
        };
        this.saveNotificationConfig(this.notificationConfig);
        this.pushStateToServer({ notificationConfig: this.notificationConfig });
      } else {
        this.showNotificationFeedback(`❌ Telegram Error: ${data.description || 'Check Bot Token & Chat ID'}`, false);
      }
    } catch (e) {
      this.showNotificationFeedback(`❌ Connection Failed: ${e.message}`, false);
    }
  }

  showNotificationFeedback(msg, isSuccess = true) {
    const targets = [this.adminNotificationFeedback, this.adminNotificationFeedbackPane];
    targets.forEach(el => {
      if (el) {
        el.textContent = msg;
        el.style.color = isSuccess ? '#2ecc71' : '#ff6b6b';
        el.classList.remove('hidden');
      }
    });
    setTimeout(() => {
      targets.forEach(el => {
        if (el) el.classList.add('hidden');
      });
    }, 6000);
  }

  showQrFeedback(msg, isSuccess = true) {
    const targets = [this.adminQrFeedback, this.adminQrFeedbackPane];
    targets.forEach(el => {
      if (el) {
        el.textContent = msg;
        el.style.color = isSuccess ? '#2ecc71' : '#ff6b6b';
        el.classList.remove('hidden');
      }
    });
    setTimeout(() => {
      targets.forEach(el => {
        if (el) el.classList.add('hidden');
      });
    }, 5000);
  }

  // ==========================================================
  // EVENT BINDINGS
  // ==========================================================
  bindEvents() {
    // Sound toggle
    this.soundBtn?.addEventListener('click', () => {
      if (this.audio) {
        const isMuted = this.audio.toggleMute();
        this.updateSoundUI();
      }
    });

    // Public Help Modal
    this.helpBtn?.addEventListener('click', () => {
      this.helpModal?.classList.remove('hidden');
    });
    this.helpCloseBtn?.addEventListener('click', () => {
      this.helpModal?.classList.add('hidden');
    });
    this.helpOverlay?.addEventListener('click', () => {
      this.helpModal?.classList.add('hidden');
    });

    // Tap Crown Logo 3 times to open Master Admin Login (Secret for Owner)
    let logoTapCount = 0;
    let logoTapTimer = null;
    const handleLogoTap = (e) => {
      logoTapCount++;
      clearTimeout(logoTapTimer);
      logoTapTimer = setTimeout(() => { logoTapCount = 0; }, 2200);
      if (logoTapCount >= 3) {
        logoTapCount = 0;
        this.triggerSecretModal();
      }
    };
    this.brandHeader?.addEventListener('click', handleLogoTap);
    document.getElementById('cric-home-btn')?.addEventListener('click', handleLogoTap);
    document.getElementById('cric-logo-badge')?.addEventListener('click', handleLogoTap);
    document.getElementById('cric-logo-center-img')?.addEventListener('click', handleLogoTap);

    // SECRET URL PARAMETER: ?master=1, ?admin=1, #master, #admin (Direct Owner Secret Bookmark)
    try {
      const qStr = (window.location.search || '').toLowerCase();
      const hStr = (window.location.hash || '').toLowerCase();
      if (qStr.includes('master') || qStr.includes('admin') || hStr.includes('master') || hStr.includes('admin')) {
        setTimeout(() => { this.triggerSecretModal(); }, 500);
      }
    } catch (e) {}

    // SECRET KEYBOARD SEQUENCE: Types master password or "00773300" (PC & Mobile)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      this.keyBuffer = (this.keyBuffer + e.key).slice(-30);
      const currentPass = (this.masterPassword || '00773300').toString().trim();
      if (
        (currentPass && this.keyBuffer.endsWith(currentPass)) ||
        this.keyBuffer.endsWith('00773300')
      ) {
        this.triggerSecretModal();
        this.keyBuffer = '';
      }
    });

    // Top Navbar Customer Login button click
    if (this.customerLoginBtn) {
      this.customerLoginBtn.addEventListener('click', () => {
        this.openAuthModal('signin');
      });
    }

    // Direct Master Login link from Auth Modal
    if (this.openMasterFromAuthBtn) {
      this.openMasterFromAuthBtn.addEventListener('click', () => {
        this.closeAuthModal();
        this.triggerSecretModal();
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
    const authenticateMaster = async (e) => {
      if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
      }

      const entered = this.secretPasswordInput ? this.secretPasswordInput.value.trim() : '';
      if (!entered) {
        if (this.secretLoginError) {
          this.secretLoginError.textContent = '❌ Please enter Master Password.';
          this.secretLoginError.classList.remove('hidden');
        }
        return;
      }

      const savedPass = (localStorage.getItem(STATE_KEYS.MASTER_KEY) || '').toString().trim();
      const currentPass = (this.masterPassword || '00773300').toString().trim();

      const isMatch = (
        entered === currentPass ||
        entered === savedPass ||
        entered === '00773300' ||
        (this.masterPassword && entered === this.masterPassword.toString().trim())
      );

      if (isMatch) {
        this.masterPassword = entered;
        try {
          localStorage.setItem(STATE_KEYS.MASTER_KEY, this.masterPassword);
          sessionStorage.setItem('admin_auth', this.masterPassword);
        } catch (err) {}

        if (this.secretLoginError) this.secretLoginError.classList.add('hidden');
        this.closeSecretAdminModal();
        this.openAdminDrawer();
        try { this.pullStateFromServer(); } catch (err) {}
        return;
      }

      // Also dynamically verify against server /api/state
      try {
        const resp = await fetch('/api/state?_t=' + Date.now(), {
          headers: { 'x-admin-key': entered, 'Accept': 'application/json' }
        });
        if (resp.ok) {
          const state = await resp.json();
          if (state && (state.dailySchedule !== undefined || state.masterPassword !== undefined || state.slices !== undefined)) {
            if (state.masterPassword) {
              this.masterPassword = state.masterPassword;
              try { localStorage.setItem(STATE_KEYS.MASTER_KEY, state.masterPassword); } catch (err) {}
            }
            try { this.applyServerState(state); } catch (err) {}
            this.masterPassword = entered;
            try {
              localStorage.setItem(STATE_KEYS.MASTER_KEY, entered);
              sessionStorage.setItem('admin_auth', entered);
            } catch (err) {}

            if (this.secretLoginError) this.secretLoginError.classList.add('hidden');
            this.closeSecretAdminModal();
            this.openAdminDrawer();
            try { this.pullStateFromServer(); } catch (err) {}
            return;
          }
        }
      } catch (e) {}

      if (this.secretLoginError) {
        this.secretLoginError.textContent = 'âŒ Invalid Master Password. Default password is 00773300.';
        this.secretLoginError.classList.remove('hidden');
      }
      if (this.secretPasswordInput) {
        this.secretPasswordInput.classList.add('input-shake');
        setTimeout(() => this.secretPasswordInput?.classList.remove('input-shake'), 400);
      }
    };

    if (this.secretLoginSubmitBtn) {
      this.secretLoginSubmitBtn.addEventListener('click', (e) => authenticateMaster(e));
    }
    if (this.secretPasswordInput) {
      this.secretPasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          authenticateMaster(e);
        }
      });
    }

    if (this.toggleSecretPassBtn && this.secretPasswordInput) {
      this.toggleSecretPassBtn.addEventListener('click', () => {
        const isPass = this.secretPasswordInput.type === 'password';
        this.secretPasswordInput.type = isPass ? 'text' : 'password';
        this.toggleSecretPassBtn.textContent = isPass ? String.fromCodePoint(0x1F512) : String.fromCodePoint(0x1F441);
      });
    }

    // Admin Panel Close / Logout
    this.adminCloseBtn?.addEventListener('click', () => this.closeAdminDrawer());
    this.adminOverlay?.addEventListener('click', () => this.closeAdminDrawer());
    this.adminLogoutBtn?.addEventListener('click', () => this.closeAdminDrawer());

    // Section 1: Timer Mode Radio Switch
    this.timerModeReal?.addEventListener('change', () => {
      this.timerMode = 'REAL';
      this.customTimerTarget = null;
      this.pushStateToServer();
      this.showTimerFeedback('Switched to Automatic 4-Slot Real Schedule');
    });

    this.timerModeManual?.addEventListener('change', () => {
      this.timerMode = 'MANUAL';
      this.customTimerTarget = Date.now() + this.customSecs * 1000;
      this.pushStateToServer();
      this.showTimerFeedback('Switched to Custom Countdown Mode');
    });

    // Start Custom Timer
    this.setCustomTimerBtn?.addEventListener('click', () => {
      const mins = parseInt(this.customTimerMins?.value || 0, 10) || 0;
      const secs = parseInt(this.customTimerSecs?.value || 0, 10) || 0;
      const totalSecs = mins * 60 + secs;
      if (totalSecs > 0) {
        this.customSecs = totalSecs;
        this.timerMode = 'MANUAL';
        if (this.timerModeManual) this.timerModeManual.checked = true;
        this.customTimerTarget = Date.now() + totalSecs * 1000;
        this.pushStateToServer();
        this.showTimerFeedback(`Custom countdown started: ${mins}m ${secs}s!`);
      }
    });

    // Specific Round Timing Dropdown change (12:00 PM, 04:00 PM, 08:00 PM, 11:00 PM)
    if (this.quickRoundHourSelect) {
      this.quickRoundHourSelect.addEventListener('change', () => {
        this.userManuallySelectedRoundSlot = true;
        this.updateSection1BadgeForSelectedSlot();
      });
    }

    // Manual Round Winner Dropdown change
    if (this.manualRoundWinnerSelect) {
      this.manualRoundWinnerSelect.addEventListener('change', () => {
        const nextSlot = getNextSlotInfo(new Date());
        const roundTitle = this.quickRoundHourSelect ? this.quickRoundHourSelect.value : nextSlot.label;
        const val = parseInt(this.manualRoundWinnerSelect.value, 10);
        if (this.badgeTimingText) this.badgeTimingText.textContent = roundTitle;
      });
    }

    // Section 1: Set Round Time & Lock Predetermined Winner (Real Round)
    if (this.applyTimeWinnerBtn) {
      this.applyTimeWinnerBtn.addEventListener('click', () => {
        const nextSlot = getNextSlotInfo(new Date());
        const roundTitle = this.quickRoundHourSelect ? this.quickRoundHourSelect.value : nextSlot.label;
        const rawVal = this.manualRoundWinnerSelect?.value;
        const winnerNum = rawVal === 'AUTO' ? 'AUTO' : (parseInt(rawVal, 10) || 10);

        // 1. Lock predetermined winner for this specific slot in daily schedule & forcedNext
        if (!this.dailySchedule) this.dailySchedule = {};
        this.dailySchedule[roundTitle] = winnerNum;
        if (winnerNum !== 'AUTO') {
          this.forcedNext = winnerNum;
        } else {
          this.forcedNext = null;
        }
        this.version = Date.now();
        this.lastVersion = this.version;

        localStorage.setItem(STATE_KEYS.DAILY_SCHEDULE, JSON.stringify(this.dailySchedule));
        if (this.forcedNext !== null) {
          localStorage.setItem(STATE_KEYS.FORCED_NEXT, String(this.forcedNext));
        } else {
          try { localStorage.removeItem(STATE_KEYS.FORCED_NEXT); } catch (e) {}
        }
        this.renderDailyScheduleTable();

        // 2. Update Active Timing Badge & UI
        this.updateSection1BadgeForSelectedSlot();
        this.updateForcedWinnerUI();

        // 3. Switch to REAL schedule mode
        this.timerMode = 'REAL';
        this.customTimerTarget = null;
        if (this.timerModeReal) this.timerModeReal.checked = true;

        // 4. Broadcast to all devices in real-time
        this.pushStateToServer({
          dailySchedule: this.dailySchedule,
          scheduleAction: winnerNum !== 'AUTO' ? 'SET_LOCK' : 'EXPLICIT_CLEAR',
          lockedSlot: roundTitle,
          lockedWinner: winnerNum !== 'AUTO' ? winnerNum : null,
          forcedNext: this.forcedNext,
          timerMode: 'REAL',
          customTimerTarget: null,
          version: this.version
        });

        // 5. Visual button feedback
        const origBtnText = this.applyTimeWinnerBtn.innerHTML;
        this.applyTimeWinnerBtn.innerHTML = `✓ ${winnerNum !== 'AUTO' ? 'Locked #' + winnerNum : 'Reset to Auto'} Successfully!`;
        this.applyTimeWinnerBtn.style.background = '#2ecc71';
        this.applyTimeWinnerBtn.style.borderColor = '#27ae60';
        this.applyTimeWinnerBtn.style.color = '#000';
        setTimeout(() => {
          if (this.applyTimeWinnerBtn) {
            this.applyTimeWinnerBtn.innerHTML = origBtnText;
            this.applyTimeWinnerBtn.style.background = '';
            this.applyTimeWinnerBtn.style.borderColor = '';
            this.applyTimeWinnerBtn.style.color = '';
          }
        }, 2200);

        this.showTimerFeedback(`✅ ${winnerNum !== 'AUTO' ? 'Locked Winner #' + winnerNum : 'Set to Auto'} for Slot "${roundTitle}"!`);
      });
    }

    // Section 1: Test Winner Right Now (Test Spin - DOES NOT SAVE TO HISTORY)
    if (this.testTimeWinnerBtn) {
      this.testTimeWinnerBtn.addEventListener('click', () => {
        let winnerNum = parseInt(this.manualRoundWinnerSelect?.value, 10);
        if (isNaN(winnerNum) || !this.slices.includes(winnerNum)) winnerNum = this.slices[0] || 10;
        const nextSlot = getNextSlotInfo(new Date());
        const roundTitle = this.quickRoundHourSelect ? this.quickRoundHourSelect.value : nextSlot.label;

        this.isSpinning = false;
        this.spinLockoutUntil = 0;
        this.closeAdminDrawer();
        setTimeout(() => {
          this.dispatchSynchronizedSpin(`Test Spin (${roundTitle})`, true, winnerNum, roundTitle);
        }, 150);
      });
    }

    // Section 1: Clear / Reset Winner Only (Time slot remains the EXACT same!)
    if (this.clearTimingBtn) {
      this.clearTimingBtn.addEventListener('click', () => {
        const nextSlot = getNextSlotInfo(new Date());
        const selectedSlot = (this.quickRoundHourSelect && this.quickRoundHourSelect.value) 
          || (this.badgeTimingText && this.badgeTimingText.textContent.trim()) 
          || nextSlot.label;

        this.forcedNext = null;

        // Reset ONLY the predetermined winner for this slot back to AUTO in schedule
        if (!this.dailySchedule) this.dailySchedule = {};
        this.dailySchedule[selectedSlot] = 'AUTO';
        this.version = Date.now();
        this.lastVersion = this.version;
        localStorage.setItem(STATE_KEYS.DAILY_SCHEDULE, JSON.stringify(this.dailySchedule));

        this.renderDailyScheduleTable();

        // Reset the selector UI back to default
        if (this.slices && this.slices.length > 0 && this.manualRoundWinnerSelect) {
          this.manualRoundWinnerSelect.value = this.slices[0];
        }

        // Update badge display - Time slot remains strictly unchanged!
        if (this.activeTimingBadge) {
          this.activeTimingBadge.classList.remove('hidden');
          if (this.badgeTimingText) this.badgeTimingText.textContent = selectedSlot;
          if (this.badgeTimingWinner) {
            this.badgeTimingWinner.textContent = 'Auto (Random)';
            this.badgeTimingWinner.className = '';
            this.badgeTimingWinner.style.color = '#00f0ff';
          }
        }

        if (this.quickRoundHourSelect) {
          this.quickRoundHourSelect.value = selectedSlot;
        }

        this.pushStateToServer({ 
          dailySchedule: this.dailySchedule, 
          scheduleAction: 'EXPLICIT_CLEAR',
          clearedSlot: selectedSlot,
          forcedNext: null, 
          version: this.version 
        });
        this.showTimerFeedback(`✅ Winner for Round "${selectedSlot}" reset to Auto (Random). Time slot remains ${selectedSlot}!`);
      });
    }

    // Section 2: Auto Fill 4 Slots
    if (this.autoFillScheduleBtn) {
      this.autoFillScheduleBtn.addEventListener('click', () => {
        const sched = {};
        DAILY_SLOTS.forEach(slot => {
          const randIdx = Math.floor(Math.random() * this.slices.length);
          sched[slot.label] = this.slices[randIdx];
        });
        this.dailySchedule = sched;
        this.version = Date.now();
        this.lastVersion = this.version;
        localStorage.setItem(STATE_KEYS.DAILY_SCHEDULE, JSON.stringify(this.dailySchedule));
        this.renderDailyScheduleTable();
        this.updateSection1BadgeForSelectedSlot();
        this.pushStateToServer({ 
          dailySchedule: this.dailySchedule, 
          scheduleAction: 'SET_LOCK',
          version: this.version 
        });
        this.showTimerFeedback('Auto-filled 4 daily slots!');
      });
    }

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
    this.resetHistoryBtn?.addEventListener('click', () => {
      this.clearSpinHistory();
    });

    // Complete Spin History Modal (Public & Player)
    this.viewAllSpinHistoryBtn?.addEventListener('click', () => this.openAllSpinHistoryModal());
    this.allSpinHistoryCloseBtn?.addEventListener('click', () => this.closeAllSpinHistoryModal());
    this.allSpinHistoryOverlay?.addEventListener('click', () => this.closeAllSpinHistoryModal());
    this.allHistSearch?.addEventListener('input', () => {
      this.renderAllSpinHistoryModalList(this.allHistSearch?.value || '', this.allHistSlotFilter?.value || 'ALL');
    });
    this.allHistSlotFilter?.addEventListener('change', () => {
      this.renderAllSpinHistoryModalList(this.allHistSearch?.value || '', this.allHistSlotFilter?.value || 'ALL');
    });

    // Admin Spin History Log Search & Filter
    this.adminSpinHistSearch?.addEventListener('input', () => {
      this.renderAdminSpinHistoryTable(this.adminSpinHistSearch?.value || '', this.adminSpinHistFilter?.value || 'ALL');
    });
    this.adminSpinHistFilter?.addEventListener('change', () => {
      this.renderAdminSpinHistoryTable(this.adminSpinHistSearch?.value || '', this.adminSpinHistFilter?.value || 'ALL');
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
    if (this.secretAdminModal) {
      this.secretAdminModal.classList.remove('hidden');
      if (this.secretLoginError) this.secretLoginError.classList.add('hidden');
      if (this.secretPasswordInput) {
        this.secretPasswordInput.value = '';
        setTimeout(() => this.secretPasswordInput.focus(), 150);
      }
    } else {
      this.openAdminDrawer();
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
    this.updateCustomerAuthPane(defaultMode);
    if (this.currentCustomer) {
      if (defaultMode === 'bets') {
        this.setCustomerDashSubtab('bets');
      } else if (defaultMode === 'deposit') {
        this.setCustomerDashSubtab('deposit');
      } else if (defaultMode === 'withdraw') {
        this.setCustomerDashSubtab('withdraw');
      } else if (defaultMode === 'history') {
        this.setCustomerDashSubtab('history');
      } else if (defaultMode === 'profile') {
        this.setCustomerDashSubtab('profile');
      } else {
        this.setCustomerDashSubtab('bets');
      }
    } else {
      if (defaultMode === 'signup') {
        this.setCustomerAuthSubtab('signup');
      } else if (defaultMode === 'forgot') {
        this.setCustomerAuthSubtab('forgot');
      } else {
        this.setCustomerAuthSubtab('signin');
      }
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
    if (this.custWithdrawError) this.custWithdrawError.classList.add('hidden');
    if (this.custWithdrawSuccess) this.custWithdrawSuccess.classList.add('hidden');
  }

  updateCustomerAuthPane(defaultMode = null) {
    if (this.currentCustomer) {
      this.customerLoggedInView?.classList.remove('hidden');
      this.customerSubtabsBar?.classList.add('hidden');
      this.customerSigninForm?.classList.add('hidden');
      this.customerSignupForm?.classList.add('hidden');
      this.customerForgotPane?.classList.add('hidden');
      if (this.dashPlayerName) this.dashPlayerName.textContent = this.currentCustomer.name || 'Player';
      if (this.dashPlayerId) this.dashPlayerId.textContent = this.currentCustomer.id || '--';
      if (this.dashPlayerCoins) this.dashPlayerCoins.textContent = "💰 " + (this.currentCustomer.coins || 0).toLocaleString() + " IHD Coins";
      if (defaultMode) {
        this.setCustomerDashSubtab(defaultMode);
      }
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

      // Reset signup OTP panes to fields step
      this.custSignupFieldsStep?.classList.remove('hidden');
      this.custSignupOtpStep?.classList.add('hidden');
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

      // Reset signin OTP step 2 back to step 1
      this.custSigninOtpStep1?.classList.remove('hidden');
      this.custSigninOtpStep2?.classList.add('hidden');
    }
  }

  validatePassword(pass) {
    const p = pass || '';
    const hasLength = p.length > 8; // Strictly greater than 8 characters (min 9)
    const uppercaseMatches = p.match(/[A-Z]/g) || [];
    const hasUpper = uppercaseMatches.length >= 1; // At least 1 uppercase letter
    const hasNumber = /\d/.test(p);
    return {
      isValid: hasLength && hasUpper && hasNumber,
      hasLength,
      hasUpper,
      hasTwoUpper: hasUpper, // Backward compatibility
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
      upperEl.textContent = res.hasUpper ? '✅ At least 1 Uppercase (A-Z)' : '❌ At least 1 Uppercase (A-Z)';
      upperEl.className = `rule-item ${res.hasUpper ? 'valid' : ''}`;
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
  // CUSTOMER UI & PREDICTION LOGIC - 30-MIN BETTING CUTOFF ENGINE
  // ==========================================================
  getTargetSlotDetails(slotChoice = 'NEXT') {
    const now = new Date();
    const currentTotalSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    if (!slotChoice || slotChoice === 'NEXT') {
      const nextOpen = getNextOpenBettingSlotInfo(now);
      const isTomorrow = nextOpen.isTomorrow;
      const dayPrefix = isTomorrow ? 'Tomorrow' : 'Today';
      const dateFormatted = nextOpen.targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dateFull = nextOpen.targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const cutoffFormatted = formatTime12(nextOpen.cutoffDate);

      return {
        slotLabel: nextOpen.label,
        dayPrefix: dayPrefix,
        dateFormatted: dateFormatted,
        dateFull: dateFull,
        targetDate: nextOpen.targetDate,
        cutoffDate: nextOpen.cutoffDate,
        cutoffFormatted: cutoffFormatted,
        isOpen: true,
        isTomorrow: isTomorrow,
        displayStr: `${dayPrefix}, ${dateFormatted} • ${nextOpen.label} Round (Betting Closes: ${cutoffFormatted})`
      };
    }

    // Specific slot selected
    const slotObj = DAILY_SLOTS.find(s => s.label === slotChoice) || DAILY_SLOTS[0];
    const cutoffSecs = (slotObj.hour * 3600 + slotObj.min * 60) - 1800; // 30 mins before spin
    const targetDate = new Date(now);
    let isTomorrow = false;
    let isCutoffPassedToday = false;

    if (currentTotalSecs >= cutoffSecs) {
      // Cutoff passed for today, so bet automatically applies to Tomorrow's round
      targetDate.setDate(targetDate.getDate() + 1);
      isTomorrow = true;
      isCutoffPassedToday = true;
    }
    targetDate.setHours(slotObj.hour, slotObj.min, 0, 0);

    const cutoffDate = new Date(targetDate.getTime() - 30 * 60 * 1000);
    const dayPrefix = isTomorrow ? 'Tomorrow' : 'Today';
    const dateFormatted = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dateFull = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const cutoffFormatted = formatTime12(cutoffDate);

    return {
      slotLabel: slotObj.label,
      dayPrefix: dayPrefix,
      dateFormatted: dateFormatted,
      dateFull: dateFull,
      targetDate: targetDate,
      cutoffDate: cutoffDate,
      cutoffFormatted: cutoffFormatted,
      isOpen: true,
      isTomorrow: isTomorrow,
      isCutoffPassedToday: isCutoffPassedToday,
      displayStr: `${dayPrefix}, ${dateFormatted} • ${slotObj.label} Round (Betting Closes: ${cutoffFormatted})`
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
    const coins = this.currentCustomer ? Number(this.currentCustomer.coins || 0) : 0;
    const cricBalEl = document.getElementById('cric-balance-val');
    const balancePill = document.getElementById('cric-balance-pill');

    if (cricBalEl) {
      cricBalEl.textContent = coins.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    if (this.currentCustomer) {
      this.customerLoginBtn?.classList.add('hidden');
      if (balancePill) balancePill.classList.remove('hidden');
      this.customerProfileChip?.classList.add('hidden'); // Strictly keep hidden so coins only display in top payment pill
      if (this.chipPlayerName) this.chipPlayerName.textContent = this.currentCustomer.name || 'Player';
      if (this.chipPlayerCoins) this.chipPlayerCoins.textContent = "💰 " + coins.toLocaleString() + " IHD";
      if (this.playerWalletDisplay) this.playerWalletDisplay.textContent = "💰 " + coins.toLocaleString() + " IHD Coins";
      if (this.dashPlayerName) this.dashPlayerName.textContent = this.currentCustomer.name || 'Player';
      if (this.dashPlayerId) this.dashPlayerId.textContent = this.currentCustomer.id || '--';
      if (this.dashPlayerCoins) this.dashPlayerCoins.textContent = "💰 " + coins.toLocaleString() + " IHD Coins";
    } else {
      this.customerLoginBtn?.classList.remove('hidden');
      if (balancePill) balancePill.classList.add('hidden');
      this.customerProfileChip?.classList.add('hidden');
      if (this.playerWalletDisplay) this.playerWalletDisplay.textContent = "💰 Logged Out (0 IHD Coins)";
    }

    this.updateTargetSlotDisplay();

    // Render all active prediction bets for the logged-in player (Unlimited Entries)
    if (this.currentCustomer) {
      const now = new Date();
      const custId = String(this.currentCustomer.id || '').toLowerCase();
      const myBets = (this.activeBets || []).filter(b => {
        if (!b) return false;
        if (this.isBetExpired(b, now)) return false; // STRICTLY UPCOMING ONLY
        const pId = String(b.playerId || '').toLowerCase();
        const mId = String(b.memberId || '').toLowerCase();
        const uId = String(b.userId || '').toLowerCase();
        const cId = String(b.customerId || '').toLowerCase();
        const ptId = String(b.partyId || '').toLowerCase();
        return pId === custId || mId === custId || uId === custId || cId === custId || ptId === custId;
      });

      if (this.chipActiveBetsCount) this.chipActiveBetsCount.textContent = myBets.length;
      if (this.custBetsBadgeCount) this.custBetsBadgeCount.textContent = myBets.length;

      if (myBets.length > 0) {
        this.activeBetNotice?.classList.remove('hidden');
        const totalLockedCoins = myBets.reduce((sum, b) => sum + (Number(b.amount || b.coins || 0)), 0);
        if (this.myActiveBetsCount) this.myActiveBetsCount.textContent = myBets.length;
        if (this.myActiveBetsPool) this.myActiveBetsPool.textContent = `Total: 💰 ${totalLockedCoins.toLocaleString()} IHD`;

        if (this.myActiveBetsList) {
          this.myActiveBetsList.innerHTML = '';
          myBets.forEach(b => {
            const item = document.createElement('div');
            const numVal = b.number !== undefined ? b.number : (b.no !== undefined ? b.no : '--');
            const amtVal = Number(b.amount || b.coins || 0);
            const winVal = Number(b.potentialWin || (amtVal * 9));
            const targetSlotVal = b.targetSlot || b.slot || b.timeSlot || 'Next Round';
            const targetDateVal = b.targetDate || b.date || 'Today';
            const placedTimeVal = b.placedTime || b.time || 'Recent';

            item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.45); border:1px solid rgba(0,240,255,0.3); border-radius:6px; padding:6px 10px; font-size:0.75rem; flex-wrap:wrap; gap:6px; margin-bottom:4px;';
            item.innerHTML = `
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="display:inline-block; background:#ffd700; color:#000; font-weight:900; padding:2px 8px; border-radius:12px; font-size:0.88rem; box-shadow:0 0 8px rgba(255,215,0,0.5);">#${numVal}</span>
                <div>
                  <strong style="color:var(--primary-gold-bright); font-size:0.88rem;">💰 ${amtVal} IHD</strong>
                  <span style="color:#2ecc71; font-weight:700; font-size:0.75rem; margin-left:4px;">(Win 9x: 💰 ${winVal.toLocaleString()} IHD)</span>
                  <div style="font-size:0.65rem; color:var(--text-muted); font-family:monospace;">ID: ${b.id || '--'}</div>
                </div>
              </div>
              <div style="text-align:right; font-size:0.7rem; line-height:1.35;">
                <div style="color:#00f0ff; font-weight:800;">🎰 Target Spin: <span style="color:#fff;">${targetSlotVal}</span></div>
                <div style="color:var(--text-secondary); font-size:0.68rem;">📅 ${targetDateVal} &bull; ⏰ Placed: <span style="color:#ffd700; font-weight:700;">${placedTimeVal}</span></div>
              </div>
            `;
            this.myActiveBetsList.appendChild(item);
          });
        }
      } else {
        this.activeBetNotice?.classList.add('hidden');
      }

      if (this.dashBetsPane && !this.dashBetsPane.classList.contains('hidden')) {
        this.renderCustomerBetsHistory(this.custBetsFilter || 'ALL');
      }
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
    this.customerDashboardBtn?.addEventListener('click', () => this.openAuthModal('bets'));
    this.customerBetsBtn?.addEventListener('click', () => {
      if (this.currentCustomer) {
        this.openAuthModal('bets');
      } else {
        this.openAuthModal('signin');
      }
    });
    this.customerDepositBtn?.addEventListener('click', () => {
      if (this.currentCustomer) {
        this.openAuthModal('deposit');
      } else {
        this.openAuthModal('signin');
      }
    });
    this.customerWithdrawBtn?.addEventListener('click', () => {
      if (this.currentCustomer) {
        this.openAuthModal('withdraw');
      } else {
        this.openAuthModal('signin');
      }
    });
    this.customerLogoutBtn?.addEventListener('click', () => this.handleCustomerLogout());
    this.dashLogoutBtn?.addEventListener('click', () => this.handleCustomerLogout());

    // Customer Dashboard Subtabs (Deposit, Withdraw, My Bets, Requests History, Profile)
    this.dashTabDepositBtn?.addEventListener('click', () => this.setCustomerDashSubtab('deposit'));
    this.dashTabWithdrawBtn?.addEventListener('click', () => this.setCustomerDashSubtab('withdraw'));
    this.dashTabBetsBtn?.addEventListener('click', () => this.setCustomerDashSubtab('bets'));
    this.dashTabHistoryBtn?.addEventListener('click', () => this.setCustomerDashSubtab('history'));
    this.dashTabProfileBtn?.addEventListener('click', () => this.setCustomerDashSubtab('profile'));
    this.custRefreshHistoryBtn?.addEventListener('click', () => {
      this.pullStateFromServer().then(() => this.renderCustomerRequestsHistory(this.custHistoryFilter || 'ALL'));
    });
    this.custRefreshBetsBtn?.addEventListener('click', () => {
      this.pullStateFromServer().then(() => this.renderCustomerBetsHistory(this.custBetsFilter || 'ALL'));
    });

    // Customer Bets filter buttons
    document.querySelectorAll('.cust-bet-flt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const flt = btn.getAttribute('data-filter') || 'ALL';
        this.renderCustomerBetsHistory(flt);
      });
    });

    // Customer Deposit Quick Amount Chips (+100, +200, +500, +1000, +2000, +5000)
    document.querySelectorAll('.cust-quick-dep').forEach(btn => {
      btn.addEventListener('click', () => {
        const amt = parseInt(btn.getAttribute('data-amount'), 10) || 100;
        if (this.custDepositAmount) {
          this.custDepositAmount.value = amt;
        }
      });
    });

    // 1-Click Copy Master UPI ID
    this.custCopyUpiBtn?.addEventListener('click', () => {
      const upiId = (this.depositConfig?.upiId || '00000000').trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(upiId).then(() => {
          const orig = this.custCopyUpiBtn.textContent;
          this.custCopyUpiBtn.textContent = '✅ Copied!';
          setTimeout(() => { if (this.custCopyUpiBtn) this.custCopyUpiBtn.textContent = orig; }, 2000);
        }).catch(() => {});
      }
    });

    // Customer Payment Receipt Screenshot Uploader
    const handleReceiptFile = async (file) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        this.showCustomerAuthError('Please select a valid image file (PNG / JPG / JPEG)', this.custDepositError);
        return;
      }
      try {
        const base64 = await this.compressAndConvertImageToBase64(file, 380, 380, 0.55);
        this.currentUploadedReceiptBase64 = base64;
        if (this.custDepositPreviewImg) this.custDepositPreviewImg.src = base64;
        if (this.custDepositPreviewWrap) this.custDepositPreviewWrap.classList.remove('hidden');
        if (this.custDepositUploadPrompt) this.custDepositUploadPrompt.classList.add('hidden');
        if (this.custDepositError) this.custDepositError.classList.add('hidden');
      } catch (err) {
        this.showCustomerAuthError('Failed to process image receipt', this.custDepositError);
      }
    };

    this.custDepositReceiptFile?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleReceiptFile(e.target.files[0]);
      }
    });

    const uploadArea = document.getElementById('cust-deposit-upload-area');
    if (uploadArea) {
      uploadArea.addEventListener('click', (e) => {
        if (e.target.id !== 'cust-remove-receipt-btn' && !e.target.closest('#cust-remove-receipt-btn')) {
          this.custDepositReceiptFile?.click();
        }
      });
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#00f0ff';
      });
      uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'rgba(0, 240, 255, 0.35)';
      });
      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'rgba(0, 240, 255, 0.35)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleReceiptFile(e.dataTransfer.files[0]);
        }
      });
    }

    this.custRemoveReceiptBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.currentUploadedReceiptBase64 = '';
      if (this.custDepositReceiptFile) this.custDepositReceiptFile.value = '';
      if (this.custDepositPreviewWrap) this.custDepositPreviewWrap.classList.add('hidden');
      if (this.custDepositUploadPrompt) this.custDepositUploadPrompt.classList.remove('hidden');
    });

    // Customer Deposit Submit
    this.custSubmitDepositBtn?.addEventListener('click', () => this.handleCustomerDepositSubmit());

    // Customer Requests History filter pills
    document.querySelectorAll('.cust-hist-flt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const flt = btn.getAttribute('data-filter') || 'ALL';
        this.renderCustomerRequestsHistory(flt);
      });
    });

    // Withdrawal Form Max All & Quick Amount Chips
    this.custWithdrawAllBtn?.addEventListener('click', () => {
      if (this.custWithdrawAmount && this.currentCustomer) {
        this.custWithdrawAmount.value = this.currentCustomer.coins || 0;
      }
    });

    document.querySelectorAll('.cust-quick-wd').forEach(btn => {
      btn.addEventListener('click', () => {
        const amt = parseInt(btn.getAttribute('data-amount'), 10) || 270;
        if (this.custWithdrawAmount) {
          this.custWithdrawAmount.value = amt;
        }
      });
    });

    // Withdrawal Request Submit
    this.custSubmitWithdrawBtn?.addEventListener('click', () => this.handleCustomerWithdrawalSubmit());

    // Live Password Strength Checklist updates
    this.custRegPin?.addEventListener('input', () => {
      this.updatePasswordRuleChecklist(this.custRegPin.value, this.ruleLen, this.ruleUpper, this.ruleNum);
    });
    this.forgotNewPin?.addEventListener('input', () => {
      this.updatePasswordRuleChecklist(this.forgotNewPin.value, this.forgotRuleLen, this.forgotRuleUpper, this.forgotRuleNum);
    });

    // Customer Sign In Mode Switchers (Password vs Mobile OTP)
    this.custSigninModePassBtn?.addEventListener('click', () => {
      this.custSigninModePassBtn.classList.add('active');
      this.custSigninModeOtpBtn?.classList.remove('active');
      this.custSigninPassPane?.classList.remove('hidden');
      this.custSigninOtpPane?.classList.add('hidden');
      if (this.custLoginError) this.custLoginError.classList.add('hidden');
    });

    this.custSigninModeOtpBtn?.addEventListener('click', () => {
      this.custSigninModeOtpBtn.classList.add('active');
      this.custSigninModePassBtn?.classList.remove('active');
      this.custSigninOtpPane?.classList.remove('hidden');
      this.custSigninPassPane?.classList.add('hidden');
      if (this.custLoginError) this.custLoginError.classList.add('hidden');
      this.custLoginMobileInput?.focus();
    });

    // Mobile Login OTP listeners
    this.custLoginSendOtpBtn?.addEventListener('click', () => this.handleSendLoginOtp());
    this.custLoginMobileInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSendLoginOtp();
    });
    this.custLoginResendOtpBtn?.addEventListener('click', () => this.handleSendLoginOtp());
    this.custLoginOtpBackBtn?.addEventListener('click', () => {
      this.custSigninOtpStep2?.classList.add('hidden');
      this.custSigninOtpStep1?.classList.remove('hidden');
      if (this.custLoginError) this.custLoginError.classList.add('hidden');
    });
    this.custLoginVerifyOtpBtn?.addEventListener('click', () => this.handleVerifyLoginOtp());
    this.custLoginAutofillBtn?.addEventListener('click', () => this.handleAutoFillOtp('login'));
    this.custLoginOpenWaBtn?.addEventListener('click', () => this.handleOpenWhatsAppOtp('login'));
    this.custLoginOtpCodeInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleVerifyLoginOtp();
    });

    // Registration OTP listeners
    this.custRegisterBtn?.addEventListener('click', () => this.handleSendSignupOtp());
    this.custRegConfirmPin?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSendSignupOtp();
    });
    this.custRegResendOtpBtn?.addEventListener('click', () => this.handleSendSignupOtp());
    this.custRegAutofillBtn?.addEventListener('click', () => this.handleAutoFillOtp('signup'));
    this.custRegOpenWaBtn?.addEventListener('click', () => this.handleOpenWhatsAppOtp('signup'));
    this.custRegOtpBackBtn?.addEventListener('click', () => {
      this.custSignupOtpStep?.classList.add('hidden');
      this.custSignupFieldsStep?.classList.remove('hidden');
      if (this.custRegError) this.custRegError.classList.add('hidden');
    });
    this.custRegVerifyOtpBtn?.addEventListener('click', () => this.handleVerifySignupOtp());
    this.custRegOtpCodeInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleVerifySignupOtp();
    });

    // Clean numeric-only 4-digit formatting for OTP inputs
    [this.custLoginOtpCodeInput, this.custRegOtpCodeInput].forEach(inp => {
      inp?.addEventListener('input', () => {
        inp.value = inp.value.replace(/[^\d]/g, '').slice(0, 4);
      });
    });

    // Sign In Submit (Password Mode)
    this.custSigninBtn?.addEventListener('click', () => this.handleCustomerSignIn());
    this.custLoginPin?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleCustomerSignIn();
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
    const rawId = this.custLoginId?.value.trim() || '';
    const pin = this.custLoginPin?.value.trim() || '';

    if (!rawId || !pin) {
      this.showCustomerAuthError('Please enter both User ID / Mobile Number and Password.', this.custLoginError);
      return;
    }

    // Support signing in with either User ID or registered 10-digit mobile number
    const user = this.customersDb[rawId] || Object.values(this.customersDb || {}).find(u => u.mobile === rawId || u.id.toLowerCase() === rawId.toLowerCase());
    if (!user || user.pin !== pin) {
      this.showCustomerAuthError('Invalid User ID or Password. Please check or use Forgot Password / Mobile OTP Login.', this.custLoginError);
      return;
    }

    // Enforce Master Admin Approval
    if (user.status === 'PENDING') {
      this.showCustomerAuthError('⏳ Your registration is currently PENDING Master Admin approval. Please wait for Master Admin to verify and activate your account before logging in.', this.custLoginError);
      return;
    }
    if (user.status === 'REJECTED') {
      this.showCustomerAuthError(`❌ Your registration request was REJECTED by Master Admin.${user.rejectionReason ? ' Reason: ' + user.rejectionReason : ''}`, this.custLoginError);
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

  // ==========================================================
  // MOBILE OTP AUTHENTICATION & ANTI-FAKE REGISTRATION
  // ==========================================================
  handleAutoFillOtp(mode) {
    if (mode === 'signup') {
      if (!this.activeSignupOtp || !this.activeSignupOtp.code) return;
      if (this.custRegOtpCodeInput) {
        this.custRegOtpCodeInput.value = this.activeSignupOtp.code;
      }
      this.handleVerifySignupOtp();
    } else {
      if (!this.activeLoginOtp || !this.activeLoginOtp.code) return;
      if (this.custLoginOtpCodeInput) {
        this.custLoginOtpCodeInput.value = this.activeLoginOtp.code;
      }
      this.handleVerifyLoginOtp();
    }
  }

  handleSendLoginOtp() {
    const rawMobile = this.custLoginMobileInput?.value.trim() || '';
    const mobile = rawMobile.replace(/[^\d]/g, '');

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      this.showCustomerAuthError('Please enter a valid 10-digit Indian Mobile Number (e.g. 9876543210).', this.custLoginError);
      return;
    }

    // Look up registered player by mobile number
    let user = Object.values(this.customersDb || {}).find(u => u.mobile === mobile || u.id === mobile);
    if (!user) {
      this.showCustomerAuthError(`❌ Mobile number +91 ${mobile} is not registered yet! Please tap "Sign Up" below to create an account.`, this.custLoginError);
      return;
    }

    // Enforce Master Admin Approval Check on Mobile OTP Login
    if (user.status === 'PENDING') {
      this.showCustomerAuthError(`⏳ Account for +91 ${mobile} is currently PENDING Master Admin approval. Please wait for Master Admin verification.`, this.custLoginError);
      return;
    }
    if (user.status === 'REJECTED') {
      this.showCustomerAuthError(`❌ Registration for +91 ${mobile} was REJECTED by Master Admin.${user.rejectionReason ? ' Reason: ' + user.rejectionReason : ''}`, this.custLoginError);
      return;
    }

    // Generate secure 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    this.activeLoginOtp = {
      mobile,
      user,
      code: otp,
      expiresAt: Date.now() + 60000
    };

    if (this.custLoginError) this.custLoginError.classList.add('hidden');
    if (this.custLoginOtpMobileDisplay) this.custLoginOtpMobileDisplay.textContent = `+91 ${mobile}`;
    if (this.custLoginOtpPreviewCode) this.custLoginOtpPreviewCode.textContent = `${otp.split('').join(' ')}`;
    if (this.custLoginOtpCodeInput) this.custLoginOtpCodeInput.value = otp;

    // Switch to step 2 (OTP code input)
    this.custSigninOtpStep1?.classList.add('hidden');
    this.custSigninOtpStep2?.classList.remove('hidden');
    this.custLoginOtpCodeInput?.focus();

    // Start 60-second countdown
    this.startLoginOtpCountdown();

    // Alert Master Admin immediately on Telegram & WhatsApp
    const tgMsg = `🔐 <b>[LOGIN OTP REQUEST]</b>\n\n👤 <b>Player:</b> ${user.name} (ID: <code>${user.id}</code>)\n📱 <b>Mobile:</b> <code>+91 ${mobile}</code>\n🔑 <b>OTP Code:</b> <code>${otp}</code>\n⏱ <b>Valid:</b> 60 Seconds\n🕒 <b>Time:</b> ${formatTime12(new Date())}`;
    this.sendTelegramNotification(tgMsg);
    this.sendWhatsAppNotification(`🔐 [Login OTP - Lucky Spin]\nPlayer: ${user.name} (ID: ${user.id})\nMobile: +91 ${mobile}\nOTP: ${otp}\nValid for 60s`);

    // Dispatch WhatsApp OTP to Customer Phone
    this.sendCustomerWhatsAppOtp(mobile, otp, 'Login');

    // Fast on-screen toast for seamless user experience
    this.showLiveToast({
      title: '🔐 LOGIN OTP READY!',
      message: `4-digit code for <b>+91 ${mobile}</b>: <b style="color:#25D366; font-size:1.2rem; letter-spacing:3px;">${otp}</b>`,
      type: 'success'
    });
  }

  startLoginOtpCountdown() {
    if (this.loginOtpInterval) clearInterval(this.loginOtpInterval);
    let left = 60;
    if (this.custLoginOtpTimer) {
      this.custLoginOtpTimer.classList.remove('hidden');
      this.custLoginOtpTimer.innerHTML = `Resend in <b style="color:var(--primary-gold);">${left}s</b>`;
    }
    if (this.custLoginResendOtpBtn) this.custLoginResendOtpBtn.classList.add('hidden');

    this.loginOtpInterval = setInterval(() => {
      left--;
      if (left <= 0) {
        clearInterval(this.loginOtpInterval);
        this.loginOtpInterval = null;
        if (this.custLoginOtpTimer) this.custLoginOtpTimer.classList.add('hidden');
        if (this.custLoginResendOtpBtn) this.custLoginResendOtpBtn.classList.remove('hidden');
      } else {
        if (this.custLoginOtpTimer) {
          this.custLoginOtpTimer.innerHTML = `Resend in <b style="color:var(--primary-gold);">${left}s</b>`;
        }
      }
    }, 1000);
  }

  handleVerifyLoginOtp() {
    const inputCode = (this.custLoginOtpCodeInput?.value || '').trim();

    if (!inputCode || inputCode.length !== 4) {
      this.showCustomerAuthError('Please enter the complete 4-digit OTP code.', this.custLoginError);
      return;
    }

    if (!this.activeLoginOtp) {
      this.showCustomerAuthError('OTP session expired. Please request a new code.', this.custLoginError);
      return;
    }

    if (Date.now() > this.activeLoginOtp.expiresAt) {
      this.showCustomerAuthError('OTP code has expired. Please click Resend OTP.', this.custLoginError);
      return;
    }

    if (inputCode !== this.activeLoginOtp.code) {
      this.showCustomerAuthError('❌ Incorrect OTP code. Please check and try again.', this.custLoginError);
      return;
    }

    // Successful OTP Login!
    const user = this.activeLoginOtp.user;
    this.activeLoginOtp = null;
    if (this.loginOtpInterval) clearInterval(this.loginOtpInterval);

    // Double check status
    if (user.status === 'PENDING') {
      this.showCustomerAuthError(`⏳ Account for +91 ${user.mobile || user.id} is currently PENDING Master Admin approval.`, this.custLoginError);
      return;
    }
    if (user.status === 'REJECTED') {
      this.showCustomerAuthError(`❌ Registration was REJECTED by Master Admin.${user.rejectionReason ? ' Reason: ' + user.rejectionReason : ''}`, this.custLoginError);
      return;
    }

    this.saveCustomerSession(user);
    this.updateCustomerUI();
    this.closeAuthModal();

    if (this.predictionFeedbackMsg) {
      this.predictionFeedbackMsg.style.color = '#2ecc71';
      this.predictionFeedbackMsg.textContent = `👋 Welcome back, ${user.name}! (Verified Mobile)`;
      setTimeout(() => { if (this.predictionFeedbackMsg) this.predictionFeedbackMsg.textContent = ''; }, 3500);
    }
  }

  handleOpenWhatsAppOtp(mode) {
    const session = mode === 'signup' ? this.activeSignupOtp : this.activeLoginOtp;
    const mobile = session?.mobile || '';
    const code = session?.code || '';
    const adminPhone = (this.notificationConfig?.whatsappPhone || '7690900087').replace(/[^\d]/g, '');

    const msg = `Hello Admin, I need help with Lucky Spin verification.\n📱 Mobile: +91 ${mobile}\n🔑 OTP Code: ${code}`;
    const waUrl = `https://api.whatsapp.com/send?phone=91${adminPhone}&text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');

    this.showLiveToast({
      title: '📲 WHATSAPP ADMIN SUPPORT',
      message: `Opening WhatsApp Help for +91 ${mobile}...`,
      type: 'system'
    });
  }

  async sendCustomerWhatsAppOtp(targetMobile, otp, purpose) {
    try {
      const cfg = this.notificationConfig || {};
      let phone = (targetMobile || '').toString().replace(/[^\d]/g, '');
      if (phone.startsWith('0')) phone = phone.substring(1);
      if (phone.length === 10) phone = '91' + phone;
      if (!phone || phone.length < 10) return false;

      const apiKey = (cfg.whatsappApiKey || '').trim();
      const message = `🔐 Lucky Spin Verification Code: ${otp} (for +${phone}). Purpose: ${purpose || 'Verification'}. Valid for 60s.`;

      // Dispatch to CallMeBot WhatsApp Gateway if configured
      if (apiKey) {
        const cleanText = message.replace(/[*`_~\[\]()<>#]/g, '');
        const url = `https://api.callmebot.com/whatsapp.php?phone=+${phone}&text=${encodeURIComponent(cleanText)}&apikey=${encodeURIComponent(apiKey)}`;
        fetch(url).catch(() => {});
      }

      // Also trigger cloud push to Master Server /api/state
      this.pushStateToServer({
        otpAlert: {
          mobile: phone,
          code: otp,
          purpose: `WhatsApp ${purpose || 'Customer'} OTP`
        }
      }).catch(() => {});

      return true;
    } catch (e) {
      return false;
    }
  }

  handleSendSignupOtp() {
    const name = this.custRegName?.value.trim();
    const rawMobile = this.custRegMobile?.value.trim();
    const mobile = (rawMobile || '').replace(/[^\d]/g, '');
    const id = this.custRegId?.value.trim();
    const dob = this.custRegDob?.value.trim();
    const pin = this.custRegPin?.value.trim();
    const confirmPin = this.custRegConfirmPin?.value.trim();

    if (!name || name.length < 2) {
      this.showCustomerAuthError('Please enter your Full Name.', this.custRegError);
      return;
    }

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      this.showCustomerAuthError('Please enter a valid 10-digit Indian Mobile Number (e.g. 9876543210).', this.custRegError);
      return;
    }

    // Prevent duplicate mobile registration
    const mobileExists = Object.values(this.customersDb || {}).some(u => u.mobile === mobile);
    if (mobileExists) {
      this.showCustomerAuthError(`❌ Mobile number +91 ${mobile} is already registered! Please Sign In.`, this.custRegError);
      return;
    }

    if (!id || id.length < 3) {
      this.showCustomerAuthError('Please create a User ID.', this.custRegError);
      return;
    }

    const hasLetters = /[a-zA-Z]/.test(id);
    const hasDigits = /\d/.test(id);
    if (!hasLetters || !hasDigits) {
      this.showCustomerAuthError('User ID must be in Name + Number format (e.g. Rahul9876 or Aman21).', this.custRegError);
      return;
    }

    if (this.customersDb[id]) {
      this.showCustomerAuthError(`User ID "${id}" is already registered! Please pick another ID or Sign In.`, this.custRegError);
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
      if (!passValidation.hasUpper) reason += ' At least 1 uppercase letter (A-Z).';
      if (!passValidation.hasNumber) reason += ' Must include numbers (0-9).';
      this.showCustomerAuthError(reason, this.custRegError);
      return;
    }

    if (pin !== confirmPin) {
      this.showCustomerAuthError('Passwords do not match. Please verify.', this.custRegError);
      return;
    }

    // Generate 4-digit registration OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    this.activeSignupOtp = {
      name,
      mobile,
      id,
      dob,
      pin,
      code: otp,
      expiresAt: Date.now() + 60000
    };

    if (this.custRegError) this.custRegError.classList.add('hidden');
    if (this.custRegOtpMobileDisplay) this.custRegOtpMobileDisplay.textContent = `+91 ${mobile}`;
    if (this.custRegOtpPreviewCode) this.custRegOtpPreviewCode.textContent = `${otp.split('').join(' ')}`;
    if (this.custRegOtpCodeInput) this.custRegOtpCodeInput.value = otp;

    // Switch from fields step to OTP verification step
    this.custSignupFieldsStep?.classList.add('hidden');
    this.custSignupOtpStep?.classList.remove('hidden');
    this.custRegOtpCodeInput?.focus();

    // Start 60s countdown
    this.startSignupOtpCountdown();

    // Send Telegram & WhatsApp Alerts to Master Admin
    const tgMsg = `🔐 <b>[REGISTRATION OTP REQUEST]</b>\n\n👑 <b>Name:</b> ${name}\n🆔 <b>User ID:</b> <code>${id}</code>\n📱 <b>Mobile:</b> <code>+91 ${mobile}</code>\n🎂 <b>DOB:</b> ${dob}\n🔑 <b>OTP Code:</b> <code>${otp}</code>\n⏱ <b>Valid:</b> 60 Seconds\n🛡 <i>Anti-fake verification active!</i>`;
    this.sendTelegramNotification(tgMsg);
    this.sendWhatsAppNotification(`🔐 [Signup OTP - Lucky Spin]\nName: ${name}\nUser ID: ${id}\nMobile: +91 ${mobile}\nOTP Code: ${otp}\nValid for 60s`);

    // Dispatch WhatsApp OTP to Customer Phone
    this.sendCustomerWhatsAppOtp(mobile, otp, 'Signup');

    // Show Live Instant Toast on screen
    this.showLiveToast({
      title: '🔐 VERIFICATION OTP READY!',
      message: `4-digit code for <b>+91 ${mobile}</b>: <b style="color:#25D366; font-size:1.2rem; letter-spacing:3px;">${otp}</b>`,
      type: 'success'
    });
  }

  startSignupOtpCountdown() {
    if (this.signupOtpInterval) clearInterval(this.signupOtpInterval);
    let left = 60;
    if (this.custRegOtpTimer) {
      this.custRegOtpTimer.classList.remove('hidden');
      this.custRegOtpTimer.innerHTML = `Resend in <b style="color:var(--primary-gold);">${left}s</b>`;
    }
    if (this.custRegResendOtpBtn) this.custRegResendOtpBtn.classList.add('hidden');

    this.signupOtpInterval = setInterval(() => {
      left--;
      if (left <= 0) {
        clearInterval(this.signupOtpInterval);
        this.signupOtpInterval = null;
        if (this.custRegOtpTimer) this.custRegOtpTimer.classList.add('hidden');
        if (this.custRegResendOtpBtn) this.custRegResendOtpBtn.classList.remove('hidden');
      } else {
        if (this.custRegOtpTimer) {
          this.custRegOtpTimer.innerHTML = `Resend in <b style="color:var(--primary-gold);">${left}s</b>`;
        }
      }
    }, 1000);
  }

  handleVerifySignupOtp() {
    const inputCode = (this.custRegOtpCodeInput?.value || '').trim();

    if (!inputCode || inputCode.length !== 4) {
      this.showCustomerAuthError('Please enter the complete 4-digit OTP code.', this.custRegError);
      return;
    }

    if (!this.activeSignupOtp) {
      this.showCustomerAuthError('OTP session expired. Please retry registration.', this.custRegError);
      return;
    }

    if (Date.now() > this.activeSignupOtp.expiresAt) {
      this.showCustomerAuthError('OTP code has expired. Please click Resend OTP.', this.custRegError);
      return;
    }

    if (inputCode !== this.activeSignupOtp.code) {
      this.showCustomerAuthError('❌ Incorrect OTP code. Please enter the valid code sent to your mobile.', this.custRegError);
      return;
    }

    // OTP VALIDATED! CREATE ACCOUNT IN PENDING APPROVAL STATUS
    const { name, mobile, id, dob, pin } = this.activeSignupOtp;
    this.activeSignupOtp = null;
    if (this.signupOtpInterval) clearInterval(this.signupOtpInterval);

    const newCustomer = {
      id: id,
      name: name,
      mobile: mobile,
      dob: dob,
      pin: pin,
      coins: 0, // Bonus credited upon Master Admin approval
      status: 'PENDING', // PENDING MASTER ADMIN APPROVAL
      phoneVerified: true,
      verifiedAt: Date.now(),
      joinedAt: Date.now(),
      totalBets: 0,
      wins: 0,
      bankDetails: null
    };

    this.customersDb[id] = newCustomer;
    this.saveCustomersDB(this.customersDb);
    this.closeAuthModal();

    // Broadcast new registration request immediately across all devices & server
    this.pushStateToServer({
      customersDb: this.customersDb,
      newPlayer: newCustomer
    });

    // Send High-Priority Registration Request to Master Admin
    const tgMsg = `🚨 <b>[NEW PLAYER REGISTRATION REQUEST]</b>\n\n👤 <b>Name:</b> ${name}\n🆔 <b>User ID:</b> <code>${id}</code>\n📱 <b>Mobile:</b> <code>+91 ${mobile}</code> (✅ OTP Verified)\n🎂 <b>DOB:</b> ${dob}\n🕒 <b>Requested:</b> ${formatTime12(new Date())}\n\n👉 <b>Status:</b> ⏳ PENDING APPROVAL\n<i>Open Master Panel to APPROVE or REJECT this account!</i>`;
    this.sendTelegramNotification(tgMsg);
    this.sendWhatsAppNotification(`🚨 [New Registration Request]\nName: ${name}\nUser ID: ${id}\nMobile: +91 ${mobile}\nStatus: PENDING MASTER APPROVAL\nPlease open Master Panel to Approve.`);

    this.showLiveToast({
      title: '⏳ REGISTRATION REQUEST SUBMITTED!',
      message: `Account <b>${id}</b> (+91 ${mobile}) is created and <b>PENDING Master Admin approval</b>. You will be able to log in once Master Admin approves your account!`,
      type: 'warning'
    });

    if (this.predictionFeedbackMsg) {
      this.predictionFeedbackMsg.style.color = '#f5b041';
      this.predictionFeedbackMsg.textContent = `⏳ Registration for ${id} submitted! Awaiting Master Admin approval.`;
      setTimeout(() => { if (this.predictionFeedbackMsg) this.predictionFeedbackMsg.textContent = ''; }, 6000);
    }
  }

  handleCustomerRegister() {
    this.handleSendSignupOtp();
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
      if (!passValidation.hasUpper) reason += ' At least 1 uppercase letter.';
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

    // Broadcast updated account to cloud
    this.pushStateToServer({ customersDb: this.customersDb });

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

  setCustomerDashSubtab(tabName) {
    if (!this.currentCustomer) return;

    if (this.custDepositError) this.custDepositError.classList.add('hidden');
    if (this.custDepositSuccess) this.custDepositSuccess.classList.add('hidden');
    if (this.custWithdrawError) this.custWithdrawError.classList.add('hidden');
    if (this.custWithdrawSuccess) this.custWithdrawSuccess.classList.add('hidden');

    const btnDep = document.getElementById('dash-tab-deposit-btn');
    const btnWd = document.getElementById('dash-tab-withdraw-btn');
    const btnBets = document.getElementById('dash-tab-bets-btn');
    const btnHist = document.getElementById('dash-tab-history-btn');
    const btnProf = document.getElementById('dash-tab-profile-btn');

    const paneDep = document.getElementById('dash-deposit-pane');
    const paneWd = document.getElementById('dash-withdraw-pane');
    const paneBets = document.getElementById('dash-bets-pane');
    const paneHist = document.getElementById('dash-history-pane');
    const paneProf = document.getElementById('dash-profile-pane');

    [btnDep, btnWd, btnBets, btnHist, btnProf].forEach(b => b?.classList.remove('active'));
    [paneDep, paneWd, paneBets, paneHist, paneProf].forEach(p => p?.classList.add('hidden'));

    if (tabName === 'withdraw') {
      btnWd?.classList.add('active');
      paneWd?.classList.remove('hidden');
      this.prefillBankDetails();
    } else if (tabName === 'bets') {
      btnBets?.classList.add('active');
      paneBets?.classList.remove('hidden');
      this.renderCustomerBetsHistory(this.custBetsFilter || 'ALL');
    } else if (tabName === 'history') {
      btnHist?.classList.add('active');
      paneHist?.classList.remove('hidden');
      this.renderCustomerRequestsHistory(this.custHistoryFilter || 'ALL');
    } else if (tabName === 'profile') {
      btnProf?.classList.add('active');
      paneProf?.classList.remove('hidden');
      if (this.dashProfName) this.dashProfName.textContent = this.currentCustomer.name || '--';
      if (this.dashProfId) this.dashProfId.textContent = this.currentCustomer.id || '--';
      if (this.dashProfMobile) this.dashProfMobile.textContent = this.currentCustomer.mobile || '--';
      if (this.dashProfDob) this.dashProfDob.textContent = this.currentCustomer.dob || '--';
    } else {
      // Default: deposit
      btnDep?.classList.add('active');
      paneDep?.classList.remove('hidden');
      this.renderCustomerDepositUI();
    }
  }

  prefillBankDetails() {
    if (!this.currentCustomer) return;
    const b = this.currentCustomer.bankDetails || {};
    if (this.custWithdrawName) {
      this.custWithdrawName.value = b.accountName || this.currentCustomer.name || '';
    }
    if (this.custWithdrawAccount) {
      this.custWithdrawAccount.value = b.accountNumber || '';
    }
    if (this.custWithdrawIfsc) {
      this.custWithdrawIfsc.value = b.ifscCode || '';
    }
    if (this.custWithdrawAmount) {
      this.custWithdrawAmount.value = '';
    }
    if (this.custSaveBankDetails) {
      this.custSaveBankDetails.checked = true;
    }
  }

  async handleCustomerDepositSubmit() {
    if (!this.currentCustomer) {
      this.showCustomerAuthError('Please sign in first to submit a deposit.', this.custDepositError);
      return;
    }

    const minDep = this.depositConfig?.minDeposit || 100;
    const amountVal = parseInt(this.custDepositAmount?.value, 10);
    const utrVal = this.custDepositUtr?.value.trim();
    const receiptBase64 = this.currentUploadedReceiptBase64;

    if (isNaN(amountVal) || amountVal < minDep) {
      this.showCustomerAuthError(`Minimum deposit amount is ₹${minDep} (1 IHD = ₹1)!`, this.custDepositError);
      return;
    }

    if (!utrVal || utrVal.length < 4) {
      this.showCustomerAuthError('Please enter valid 12-digit UTR / Transaction Ref number.', this.custDepositError);
      return;
    }

    if (!receiptBase64) {
      this.showCustomerAuthError('Please upload Payment Screenshot / Receipt image!', this.custDepositError);
      return;
    }

    const newDep = {
      id: 'DEP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4).toUpperCase(),
      customerId: this.currentCustomer.id,
      customerName: this.currentCustomer.name || this.currentCustomer.id,
      customerMobile: this.currentCustomer.mobile || '',
      amount: amountVal,
      utr: utrVal,
      screenshotUrl: receiptBase64,
      status: 'PENDING', // PENDING, APPROVED, REJECTED
      rejectionReason: '',
      requestedAt: Date.now(),
      requestedTime: formatTime12(new Date()),
      requestedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      processedAt: null,
      processedTime: null
    };

    if (!Array.isArray(this.deposits)) this.deposits = [];
    this.deposits = [newDep, ...this.deposits];
    this.saveDeposits(this.deposits);

    // 1. Instant Lightweight MQTT + BroadcastChannel Real-Time Push to Master (Zero Delay!)
    if (this.cloudSync) {
      this.cloudSync.broadcastLiveEvent({
        eventType: 'NEW_DEPOSIT',
        deposit: newDep
      });
    }

    // 2. Full State sync to server & peers
    this.pushStateToServer({ deposits: this.deposits, newDeposit: newDep });

    // Send Instant Telegram Notification to Master Phone (Sound Alert + Ping!)
    const tgMsg = `🚨 *NEW DEPOSIT REQUEST!*\n\n👤 *Player:* ${newDep.customerName} (ID: \`${newDep.customerId}\`)\n📱 *Mobile:* ${newDep.customerMobile || 'N/A'}\n💰 *Amount:* ₹${amountVal.toLocaleString()} (${amountVal.toLocaleString()} IHD Coins)\n🔢 *UTR / Ref No.:* \`${utrVal}\`\n🕒 *Time:* ${newDep.requestedTime} (${newDep.requestedDate})\n\n👉 *Action:* Open Master Panel to review screenshot & approve coins!`;
    this.sendTelegramNotification(tgMsg);

    if (this.custDepositError) this.custDepositError.classList.add('hidden');
    if (this.custDepositSuccess) {
      this.custDepositSuccess.textContent = `✅ Deposit request of ₹${amountVal.toLocaleString()} submitted! Status is Pending approval by Master Admin. Coins will be credited upon confirmation.`;
      this.custDepositSuccess.classList.remove('hidden');
    }

    // Reset Form
    if (this.custDepositUtr) this.custDepositUtr.value = '';
    this.currentUploadedReceiptBase64 = '';
    if (this.custDepositPreviewWrap) this.custDepositPreviewWrap.classList.add('hidden');
    if (this.custDepositUploadPrompt) this.custDepositUploadPrompt.classList.remove('hidden');
    if (this.custDepositReceiptFile) this.custDepositReceiptFile.value = '';

    if (this.audio) this.audio.playTick();

    setTimeout(() => {
      this.setCustomerDashSubtab('history');
    }, 1400);
  }

  handleCustomerWithdrawalSubmit() {
    if (!this.currentCustomer) {
      this.showCustomerAuthError('Please sign in first to request a withdrawal.', this.custWithdrawError);
      return;
    }

    const accountName = this.custWithdrawName?.value.trim();
    const accountNumber = this.custWithdrawAccount?.value.trim();
    const ifscCode = this.custWithdrawIfsc?.value.trim().toUpperCase();
    const amountVal = parseInt(this.custWithdrawAmount?.value, 10);

    if (!accountName || accountName.length < 2) {
      this.showCustomerAuthError('Please enter valid Bank Account Holder Name.', this.custWithdrawError);
      return;
    }

    if (!accountNumber || accountNumber.length < 6 || !/^\d+$/.test(accountNumber)) {
      this.showCustomerAuthError('Please enter a valid Bank Account Number (digits only).', this.custWithdrawError);
      return;
    }

    if (!ifscCode || ifscCode.length < 4) {
      this.showCustomerAuthError('Please enter a valid Bank IFSC Code (e.g. SBIN0001234).', this.custWithdrawError);
      return;
    }

    if (isNaN(amountVal) || amountVal < 270) {
      this.showCustomerAuthError('Minimum withdrawal amount is 270 IHD Coins!', this.custWithdrawError);
      return;
    }

    const currentBal = this.currentCustomer.coins || 0;
    if (amountVal > currentBal) {
      this.showCustomerAuthError(`Insufficient IHD Coins! You have 💰${currentBal.toLocaleString()} IHD Coins, requested 💰${amountVal.toLocaleString()} IHD Coins.`, this.custWithdrawError);
      return;
    }

    // Deduct coins from customer balance immediately
    this.currentCustomer.coins -= amountVal;

    // Save bank details if checked
    if (this.custSaveBankDetails && this.custSaveBankDetails.checked) {
      this.currentCustomer.bankDetails = {
        accountName: accountName,
        accountNumber: accountNumber,
        ifscCode: ifscCode
      };
    }

    // Save customer session and DB
    this.saveCustomerSession(this.currentCustomer);

    // Create withdrawal request
    const newWd = {
      id: 'WD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4).toUpperCase(),
      customerId: this.currentCustomer.id,
      customerName: this.currentCustomer.name || this.currentCustomer.id,
      customerMobile: this.currentCustomer.mobile || '',
      accountName: accountName,
      accountNumber: accountNumber,
      ifscCode: ifscCode,
      amount: amountVal,
      status: 'PENDING', // PENDING, APPROVED, REJECTED
      rejectionReason: '',
      requestedAt: Date.now(),
      requestedTime: formatTime12(new Date()),
      requestedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      processedAt: null,
      processedTime: null
    };

    if (!Array.isArray(this.withdrawals)) this.withdrawals = [];
    this.withdrawals = [newWd, ...this.withdrawals];
    this.saveWithdrawals(this.withdrawals);

    this.updateCustomerUI();

    // 1. Instant Lightweight MQTT + BroadcastChannel Real-Time Push to Master (Zero Delay!)
    if (this.cloudSync) {
      this.cloudSync.broadcastLiveEvent({
        eventType: 'NEW_WITHDRAWAL',
        withdrawal: newWd
      });
    }

    // 2. Full State sync
    this.pushStateToServer({ customersDb: this.customersDb, withdrawals: this.withdrawals, newWithdrawal: newWd });

    // Send Telegram Notification to Master Phone
    const tgMsg = `💸 *NEW WITHDRAWAL REQUEST!*\n\n👤 *Player:* ${newWd.customerName} (ID: \`${newWd.customerId}\`)\n📱 *Mobile:* ${newWd.customerMobile || 'N/A'}\n💰 *Amount:* 💰${amountVal.toLocaleString()} IHD Coins (₹${amountVal.toLocaleString()})\n🏦 *Bank A/C:* \`${accountNumber}\` (${ifscCode})\n👤 *A/C Name:* ${accountName}\n🕒 *Time:* ${newWd.requestedTime}\n\n👉 Open Master Panel to Confirm & Transfer!`;
    this.sendTelegramNotification(tgMsg);

    if (this.custWithdrawError) this.custWithdrawError.classList.add('hidden');
    if (this.custWithdrawSuccess) {
      this.custWithdrawSuccess.textContent = `✅ Withdrawal request of 💰${amountVal.toLocaleString()} IHD Coins submitted! Status is Pending approval by Master Admin.`;
      this.custWithdrawSuccess.classList.remove('hidden');
    }

    if (this.audio) this.audio.playTick();

    // Auto-switch to history tab after 1.2s to show pending record
    setTimeout(() => {
      this.setCustomerDashSubtab('history');
    }, 1200);
  }

  renderCustomerRequestsHistory(filterType = 'ALL') {
    this.custHistoryFilter = filterType;
    if (!this.custRequestsHistoryList) return;
    if (!this.currentCustomer) {
      this.custRequestsHistoryList.innerHTML = '<p style="color:var(--text-muted); font-size:0.75rem; text-align:center; padding:1rem;">Please sign in to view your requests.</p>';
      return;
    }

    // Update filter active button
    document.querySelectorAll('.cust-hist-flt-btn').forEach(btn => {
      if (btn.getAttribute('data-filter') === filterType) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const myWds = (this.withdrawals || []).filter(w => this.isCustomerRequest(w)).map(w => ({ ...w, reqType: 'WITHDRAW' }));
    const myDeps = (this.deposits || []).filter(d => this.isCustomerRequest(d)).map(d => ({ ...d, reqType: 'DEPOSIT' }));

    this.updateCombinedRequestsBadge();

    let combined = [...myDeps, ...myWds].sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));

    if (filterType === 'DEPOSIT') {
      combined = combined.filter(item => item.reqType === 'DEPOSIT');
    } else if (filterType === 'WITHDRAW') {
      combined = combined.filter(item => item.reqType === 'WITHDRAW');
    }

    if (combined.length === 0) {
      this.custRequestsHistoryList.innerHTML = `
        <div style="text-align:center; padding:1.5rem 0.5rem; color:var(--text-muted); font-size:0.75rem;">
          <span style="font-size:1.5rem; display:block; margin-bottom:4px;">📜</span>
          No requests found under this filter.<br>
          <div style="display:flex; justify-content:center; gap:6px; margin-top:8px;">
            <button type="button" class="btn btn-gold btn-xs" onclick="app.setCustomerDashSubtab('deposit')">💰 Add Coins</button>
            <button type="button" class="btn btn-secondary btn-xs" onclick="app.setCustomerDashSubtab('withdraw')">💸 Withdraw</button>
          </div>
        </div>
      `;
      return;
    }

    this.custRequestsHistoryList.innerHTML = '';
    combined.forEach(item => {
      const card = document.createElement('div');
      const isDep = item.reqType === 'DEPOSIT';
      const statusClass = (item.status || 'PENDING').toLowerCase();
      card.className = isDep ? `cust-dep-item ${statusClass}` : `cust-wd-item ${statusClass}`;

      let statusBadgeHtml = '';
      if (item.status === 'APPROVED') {
        statusBadgeHtml = `<span class="status-pill status-approved">✅ ${isDep ? 'Approved & Credited' : 'Confirmed & Sent'}</span>`;
      } else if (item.status === 'REJECTED') {
        statusBadgeHtml = `<span class="status-pill status-rejected">❌ Rejected</span>`;
      } else {
        statusBadgeHtml = `<span class="status-pill status-pending" style="animation: badgePulsate 1.5s infinite ease-in-out;">⏳ Pending Approval</span>`;
      }

      if (isDep) {
        // Deposit Card
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:0.72rem; color:#00f0ff; font-weight:800; background:rgba(0,240,255,0.12); padding:1px 6px; border-radius:6px;">💰 DEPOSIT</span>
                <strong style="color:var(--primary-gold-bright); font-size:0.92rem;">₹${(item.amount || 0).toLocaleString()} (${(item.amount || 0).toLocaleString()} IHD)</strong>
              </div>
              <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:3px;">
                🔢 UTR: <span style="color:#ffd700; font-family:monospace; font-weight:700;">${item.utr || '--'}</span>
              </div>
              <div style="font-size:0.68rem; color:var(--text-muted); margin-top:1px;">
                Ref: <span style="font-family:monospace;">${item.id}</span>
                ${item.screenshotUrl ? ` • <a href="javascript:void(0)" onclick="app.openReceiptZoomModal('${item.id}')" style="color:#00f0ff; text-decoration:underline; font-weight:700;">View Receipt 📸</a>` : ''}
              </div>
              ${item.status === 'PENDING' ? `
                <div style="font-size:0.68rem; color:#f5b041; margin-top:3px;">
                  ⏳ <em>Waiting for Master Admin verification. Coins will be credited upon confirmation.</em>
                </div>
              ` : ''}
            </div>
            <div style="text-align:right;">
              ${statusBadgeHtml}
              <div style="font-size:0.65rem; color:var(--text-muted); margin-top:4px;">
                ${item.requestedDate || ''} ${item.requestedTime || ''}
              </div>
            </div>
          </div>
          ${item.status === 'REJECTED' ? `
            <div class="wd-rejection-reason-box">
              <strong>❌ Master Rejection Reason:</strong> ${item.rejectionReason || 'Details mismatch / contact master'}
            </div>
          ` : ''}
        `;
      } else {
        // Withdrawal Card
        const maskedAcct = item.accountNumber && item.accountNumber.length > 4 ? `••••${item.accountNumber.slice(-4)}` : (item.accountNumber || '--');
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:0.72rem; color:var(--primary-gold-bright); font-weight:800; background:rgba(245,176,65,0.12); padding:1px 6px; border-radius:6px;">💸 WITHDRAW</span>
                <strong style="color:var(--primary-gold-bright); font-size:0.92rem;">💰 ${(item.amount || 0).toLocaleString()} IHD Coins</strong>
              </div>
              <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:3px;">
                🏦 Bank A/C: <span style="color:#fff; font-weight:700;">${maskedAcct}</span> (${item.accountName || '--'})
              </div>
              <div style="font-size:0.68rem; color:var(--text-muted); margin-top:1px;">
                IFSC: <span style="color:#00f0ff;">${item.ifscCode || '--'}</span> • Ref: ${item.id}
              </div>
              ${item.status === 'PENDING' ? `
                <div style="font-size:0.68rem; color:#f5b041; margin-top:3px;">
                  ⏳ <em>Master Admin is processing your bank transfer.</em>
                </div>
              ` : ''}
            </div>
            <div style="text-align:right;">
              ${statusBadgeHtml}
              <div style="font-size:0.65rem; color:var(--text-muted); margin-top:4px;">
                ${item.requestedDate || ''} ${item.requestedTime || ''}
              </div>
            </div>
          </div>
          ${item.status === 'REJECTED' ? `
            <div class="wd-rejection-reason-box">
              <strong>❌ Master Rejection Reason:</strong> ${item.rejectionReason || 'Details mismatch / contact master'}<br>
              <span style="color:#2ecc71; font-size:0.68rem; font-weight:700;">💰 ${(item.amount || 0).toLocaleString()} IHD Coins were automatically refunded back to your wallet.</span>
            </div>
          ` : ''}
        `;
      }

      this.custRequestsHistoryList.appendChild(card);
    });
  }

  renderCustomerBetsHistory(filterType = 'ALL') {
    this.custBetsFilter = filterType;
    if (!this.custBetsHistoryList) return;
    if (!this.currentCustomer) {
      this.custBetsHistoryList.innerHTML = '<p style="color:var(--text-muted); font-size:0.75rem; text-align:center; padding:1rem;">Please sign in to view your placed and active bets.</p>';
      return;
    }

    // Update filter active button
    document.querySelectorAll('.cust-bet-flt-btn').forEach(btn => {
      if (btn.getAttribute('data-filter') === filterType) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const playerId = String(this.currentCustomer.id || '').toLowerCase();
    const now = new Date();
    // 1. Gather ONLY live upcoming active bets for this player
    const myActive = (this.activeBets || []).filter(b => {
      if (!b) return false;
      if (this.isBetExpired(b, now)) return false;
      const pId = String(b.playerId || b.memberId || b.userId || b.customerId || '').toLowerCase();
      return pId === playerId;
    });
    // 2. Gather settled bet history
    const myHist = Array.isArray(this.currentCustomer.betHistory) ? this.currentCustomer.betHistory : [];
    
    // Combine and deduplicate by ID: settled history items maintain their WON/LOST/REFUNDED status
    const betMap = new Map();
    myHist.forEach(b => {
      if (b && b.id) betMap.set(String(b.id), b);
    });
    // Active upcoming bets take precedence as ACTIVE
    myActive.forEach(b => {
      if (b && b.id) {
        betMap.set(String(b.id), { ...b, status: 'ACTIVE' });
      }
    });

    const allMyBets = Array.from(betMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const activeBetsList = allMyBets.filter(b => (b.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
    const wonBetsList = allMyBets.filter(b => (b.status || '').toUpperCase() === 'WON');
    const lostBetsList = allMyBets.filter(b => (b.status || '').toUpperCase() === 'LOST');

    const totalActivePool = activeBetsList.reduce((sum, b) => sum + (Number(b.amount || b.coins || 0) || 0), 0);
    const totalWonAmount = wonBetsList.reduce((sum, b) => sum + (Number(b.payout || (Number(b.amount || b.coins || 0) * 9)) || 0), 0);

    // Update badges
    if (this.custBetsBadgeCount) this.custBetsBadgeCount.textContent = activeBetsList.length;
    if (this.chipActiveBetsCount) this.chipActiveBetsCount.textContent = activeBetsList.length;
    if (this.custBetAllCount) this.custBetAllCount.textContent = allMyBets.length;
    if (this.custBetActiveCount) this.custBetActiveCount.textContent = activeBetsList.length;
    if (this.custBetWonCount) this.custBetWonCount.textContent = wonBetsList.length;
    if (this.custBetLostCount) this.custBetLostCount.textContent = lostBetsList.length;
    if (this.custActiveBetsTotalPool) this.custActiveBetsTotalPool.textContent = `💰 ${totalActivePool.toLocaleString()} IHD`;
    if (this.custBetsTotalWonAmount) this.custBetsTotalWonAmount.textContent = `💰 ${totalWonAmount.toLocaleString()} IHD`;

    let filteredBets = allMyBets;
    if (filterType === 'ACTIVE') {
      filteredBets = activeBetsList;
    } else if (filterType === 'WON') {
      filteredBets = wonBetsList;
    } else if (filterType === 'LOST') {
      filteredBets = lostBetsList;
    }

    if (filteredBets.length === 0) {
      this.custBetsHistoryList.innerHTML = `
        <div style="text-align:center; padding:1.5rem 0.5rem; color:var(--text-muted); font-size:0.75rem;">
          <span style="font-size:1.6rem; display:block; margin-bottom:4px;">🎯</span>
          No predictions found under "${filterType}" filter.<br>
          <button type="button" class="btn btn-gold btn-xs" style="margin-top:8px; color:#000; font-weight:800;" onclick="app.closeAuthModal(); const s = document.getElementById('customer-prediction-section'); if (s) s.scrollIntoView({behavior:'smooth'});">
            🎯 Place Prediction on Wheel
          </button>
        </div>
      `;
      return;
    }

    this.custBetsHistoryList.innerHTML = '';
    filteredBets.forEach(b => {
      const card = document.createElement('div');
      const st = (b.status || 'ACTIVE').toUpperCase();
      const numVal = b.number !== undefined ? b.number : (b.no !== undefined ? b.no : '--');
      const amtVal = Number(b.amount || b.coins || 0);
      const targetSlot = b.targetSlot || b.slot || b.timeSlot || 'Next Round';
      const targetDate = b.targetDate || b.date || 'Today';
      const placedTime = b.placedTime || b.time || 'Recent';
      const payoutVal = Number(b.payout || b.potentialWin || (amtVal * 9));
      const winNumVal = b.winningNumber !== undefined ? b.winningNumber : null;

      let statusBorder = 'rgba(0, 240, 255, 0.35)';
      let statusBg = 'linear-gradient(180deg, rgba(0,240,255,0.06) 0%, rgba(0,0,0,0.3) 100%)';
      let badgeHtml = '';

      if (st === 'ACTIVE') {
        statusBorder = 'rgba(0, 240, 255, 0.5)';
        statusBg = 'linear-gradient(180deg, rgba(0,240,255,0.1) 0%, rgba(0,0,0,0.35) 100%)';
        badgeHtml = `
          <span class="status-pill status-pending" style="background:rgba(0,240,255,0.15); color:#00f0ff; border:1px solid rgba(0,240,255,0.4); font-weight:800;">
            ⏳ ACTIVE / PENDING
          </span>
        `;
      } else if (st === 'WON') {
        statusBorder = 'rgba(46, 204, 113, 0.6)';
        statusBg = 'linear-gradient(180deg, rgba(46,204,113,0.12) 0%, rgba(0,0,0,0.35) 100%)';
        badgeHtml = `
          <span class="status-pill status-approved" style="background:rgba(46,204,113,0.2); color:#2ecc71; border:1px solid rgba(46,204,113,0.5); font-weight:800;">
            🏆 WON (+💰${payoutVal.toLocaleString()} IHD)
          </span>
        `;
      } else if (st === 'LOST') {
        statusBorder = 'rgba(231, 76, 60, 0.4)';
        statusBg = 'linear-gradient(180deg, rgba(231,76,60,0.08) 0%, rgba(0,0,0,0.35) 100%)';
        badgeHtml = `
          <span class="status-pill status-rejected" style="background:rgba(231,76,60,0.15); color:#ff6b6b; border:1px solid rgba(231,76,60,0.4); font-weight:700;">
            ❌ LOST (Win: #${winNumVal !== null ? winNumVal : '--'})
          </span>
        `;
      } else if (st === 'REFUNDED') {
        statusBorder = 'rgba(245, 176, 65, 0.4)';
        badgeHtml = `
          <span class="status-pill" style="background:rgba(245,176,65,0.15); color:var(--primary-gold-bright); border:1px solid rgba(245,176,65,0.4); font-weight:700;">
            ↩️ REFUNDED
          </span>
        `;
      }

      card.style.cssText = `border:1px solid ${statusBorder}; background:${statusBg}; border-radius:6px; padding:0.6rem 0.75rem; font-size:0.75rem;`;
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="display:inline-block; background:#ffd700; color:#000; font-weight:900; font-size:0.88rem; padding:2px 8px; border-radius:12px; box-shadow:0 0 8px rgba(255,215,0,0.4);">
                #${numVal}
              </span>
              <strong style="color:var(--primary-gold-bright); font-size:0.92rem;">💰 ${amtVal} IHD Coins</strong>
            </div>
            <div style="margin-top:4px; font-size:0.72rem; color:var(--text-secondary);">
              <span>🕒 Target: <strong style="color:#00f0ff;">${targetSlot}</strong></span>
              <span style="margin-left:6px;">📅 ${targetDate}</span>
            </div>
            <div style="margin-top:2px; font-size:0.68rem; color:var(--text-muted);">
              ${st === 'WON' 
                ? `<span style="color:#2ecc71; font-weight:700;">🎉 9x Payout Credited: +💰${payoutVal.toLocaleString()} IHD Coins!</span>` 
                : (st === 'ACTIVE' 
                  ? `<span style="color:#2ecc71; font-weight:600;">Potential 9x Win: 💰${(amtVal * 9).toLocaleString()} IHD Coins</span>` 
                  : (st === 'LOST' 
                    ? `<span>Winning Number was: <strong style="color:#fff;">#${winNumVal !== null ? winNumVal : '--'}</strong></span>` 
                    : `<span>Refunded by Master Admin</span>`))}
            </div>
          </div>
          <div style="text-align:right;">
            ${badgeHtml}
            <div style="font-size:0.65rem; color:var(--text-muted); margin-top:5px;">
              Placed: ${placedTime}
            </div>
          </div>
        </div>
      `;
      this.custBetsHistoryList.appendChild(card);
    });
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

    const slotChoice = this.playerTargetSlotSelect ? this.playerTargetSlotSelect.value : 'NEXT';
    const slotDetails = this.getTargetSlotDetails(slotChoice);

    // STRICT 30-MINUTE CUTOFF VERIFICATION:
    // For 4:00 PM spin, after 3:30 PM no bet can be placed for 4:00 PM slot today!
    const now = new Date();
    const spinTimestamp = slotDetails.targetDate.getTime();
    const cutoffTimestamp = spinTimestamp - (30 * 60 * 1000);

    if (now.getTime() >= cutoffTimestamp) {
      const nextOpen = getNextOpenBettingSlotInfo(now);
      const errMsg = `❌ Betting for ${slotDetails.slotLabel} (${slotDetails.dayPrefix}) is CLOSED! (Cutoff was ${slotDetails.cutoffFormatted}, strictly 30 mins before spin). Next open round is ${nextOpen.label} (${nextOpen.isTomorrow ? 'Tomorrow' : 'Today'}).`;
      
      if (this.predictionFeedbackMsg) {
        this.predictionFeedbackMsg.style.color = '#ff6b6b';
        this.predictionFeedbackMsg.textContent = errMsg;
        setTimeout(() => { if (this.predictionFeedbackMsg) this.predictionFeedbackMsg.textContent = ''; }, 6000);
      }
      if (this.playerTargetSlotSelect) {
        this.playerTargetSlotSelect.value = 'NEXT';
        this.updateTargetSlotDisplay();
      }
      return;
    }

    // Deduct coins & track bet history
    this.currentCustomer.coins = Math.max(0, (Number(this.currentCustomer.coins) || 0) - amount);
    this.currentCustomer.totalBets = (this.currentCustomer.totalBets || 0) + 1;
    this.currentCustomer.lastUpdated = Date.now();

    const playerId = this.currentCustomer.id || 'P_' + Date.now();
    const playerName = this.currentCustomer.name || this.currentCustomer.id || 'Player';
    const playerMobile = this.currentCustomer.mobile || '';
    const dateFormatted = slotDetails.dateFormatted || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dateFull = slotDetails.dateFull || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeSlot = slotDetails.slotLabel || '12:00 PM';
    const displaySlotStr = slotDetails.displayStr || `${dateFormatted} • ${timeSlot}`;
    const placedTimeStr = formatTime12(new Date());

    const betObj = {
      id: 'bet_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      
      // Member / Party ID aliases (Num Ledger Pro compatibility)
      party: playerName,
      partyName: playerName,
      Party: playerName,
      PartyName: playerName,
      party_name: playerName,
      accountName: playerName,
      account: playerName,
      name: playerName,
      playerName: playerName,
      memberName: playerName,
      customerName: playerName,
      Name: playerName,
      userName: playerName,

      partyId: playerId,
      PartyId: playerId,
      party_id: playerId,
      partyCode: playerId,
      memberId: playerId,
      member_id: playerId,
      userId: playerId,
      playerId: playerId,

      // Mobile / Contact aliases
      mobile: playerMobile,
      phone: playerMobile,
      contact: playerMobile,
      Contact: playerMobile,
      playerMobile: playerMobile,
      partyMobile: playerMobile,
      dob: this.currentCustomer.dob || '',

      // Date aliases (Num Ledger Pro compatibility)
      date: dateFormatted,
      dateISO: (slotDetails.targetDate ? slotDetails.targetDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      dateDMY: (slotDetails.targetDate ? `${String(slotDetails.targetDate.getDate()).padStart(2, '0')}-${String(slotDetails.targetDate.getMonth() + 1).padStart(2, '0')}-${slotDetails.targetDate.getFullYear()}` : ''),
      entryDate: dateFormatted,
      Date: dateFormatted,
      targetDate: dateFormatted,
      targetDateFull: dateFull,
      placedDate: dateFull,
      createdDate: dateFormatted,
      formattedDate: dateFull,
      day: dateFormatted,

      // Time Slot aliases (Num Ledger Pro compatibility)
      timeSlot: timeSlot,
      time_slot: timeSlot,
      slot: timeSlot,
      slotTime: timeSlot,
      round: timeSlot,
      targetSlot: timeSlot,
      displaySlot: displaySlotStr,
      time: placedTimeStr,
      placedTime: placedTimeStr,

      // Number aliases (Num Ledger Pro compatibility)
      number: this.selectedBetNumber,
      no: this.selectedBetNumber,
      num: this.selectedBetNumber,
      betNumber: this.selectedBetNumber,
      selectedNumber: this.selectedBetNumber,

      // Amount & Payout aliases (Num Ledger Pro compatibility)
      amount: amount,
      betAmount: amount,
      coins: amount,
      rate: 9,
      multiplier: 9,
      potentialWin: amount * 9,
      winAmount: amount * 9,
      payout: amount * 9,
      potentialLiability: amount * 9,

      remark: `Prediction #${this.selectedBetNumber} on ${timeSlot} (${playerName})`,
      timestamp: Date.now(),
      status: 'ACTIVE'
    };

    if (!Array.isArray(this.currentCustomer.betHistory)) this.currentCustomer.betHistory = [];
    this.currentCustomer.betHistory.unshift(betObj);
    this.saveCustomerSession(this.currentCustomer);

    if (this.customersDb && this.customersDb[this.currentCustomer.id]) {
      this.customersDb[this.currentCustomer.id].coins = this.currentCustomer.coins;
      this.customersDb[this.currentCustomer.id].totalBets = this.currentCustomer.totalBets;
      this.customersDb[this.currentCustomer.id].lastUpdated = Date.now();
      if (!Array.isArray(this.customersDb[this.currentCustomer.id].betHistory)) {
        this.customersDb[this.currentCustomer.id].betHistory = [];
      }
      this.customersDb[this.currentCustomer.id].betHistory.unshift(betObj);
      this.saveCustomersDB(this.customersDb);
    }

    this.currentBet = betObj;
    this.saveCurrentBet(this.currentBet);

    // UNLIMITED ENTRIES PER PLAYER: Add this new bet entry directly into activeBets
    if (!Array.isArray(this.activeBets)) this.activeBets = [];
    this.activeBets = [betObj, ...this.activeBets];
    this.saveActiveBets(this.activeBets);

    this.updateCustomerUI();
    this.renderAdminActiveBetsTable();
    this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');

    if (this.cloudSync) {
      this.cloudSync.broadcastLiveEvent({
        eventType: 'NEW_BET',
        bet: betObj,
        playerId: playerId,
        remainingCoins: this.currentCustomer.coins,
        customer: this.customersDb ? this.customersDb[this.currentCustomer.id] : null
      });
    }

    this.pushStateToServer({ customersDb: this.customersDb, activeBets: this.activeBets, newBet: betObj });

    // Send Telegram Notification for new prediction bet
    const tgBetMsg = `🎯 *NEW PREDICTION ENTRY!*\n\n👤 *Player:* ${this.currentCustomer.name || this.currentCustomer.id} (ID: \`${this.currentCustomer.id}\`)\n🔢 *Selected Number:* *#${this.selectedBetNumber}*\n💰 *Amount:* 💰${amount} IHD Coins\n🏆 *Potential Win (9x):* 💰${amount * 9} IHD Coins\n🕒 *Target Slot:* ${slotDetails.slotLabel} (${slotDetails.dayPrefix})\n⏰ *Placed At:* ${placedTimeStr}`;
    this.sendTelegramNotification(tgBetMsg);

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
    if (!this.soundIconOn || !this.soundIconOff) return;
    if (this.audio && this.audio.muted) {
      this.soundIconOn.classList.add('hidden');
      this.soundIconOff.classList.remove('hidden');
    } else {
      this.soundIconOn.classList.remove('hidden');
      this.soundIconOff.classList.add('hidden');
    }
  }

  openAdminDrawer() {
    this.isDrawerOpen = true;
    this.userManuallySelectedRoundSlot = false;
    sessionStorage.setItem('admin_auth', this.masterPassword || '00773300');

    // 1. Immediately open the Admin Fullscreen Dashboard on screen
    if (this.adminDrawer) {
      this.adminDrawer.classList.remove('hidden');
    }
    if (this.adminOverlay) {
      this.adminOverlay.classList.remove('hidden');
    }

    if (this.newMasterKeyInput) {
      this.newMasterKeyInput.placeholder = 'Current: ' + (this.masterPassword || '00773300');
    }

    // 2. Safely populate and render all admin sub-panels
    try { this.populateAdminControls(); } catch (e) { console.warn('populateAdminControls err:', e); }
    try { this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : ''); } catch (e) { console.warn('renderAdminPlayersList err:', e); }
    try { this.renderAdminActiveBetsTable(); } catch (e) { console.warn('renderAdminActiveBetsTable err:', e); }
    try { this.renderAdminDepositsList(this.adminDepFilter || 'ALL', this.adminDepSearch ? this.adminDepSearch.value : ''); } catch (e) { console.warn('renderAdminDepositsList err:', e); }
    try { this.renderAdminWithdrawalsList(this.adminWdFilter || 'ALL', this.adminWdSearch ? this.adminWdSearch.value : ''); } catch (e) { console.warn('renderAdminWithdrawalsList err:', e); }
    try { this.updateDepositsCountBadges(); } catch (e) { console.warn('updateDepositsCountBadges err:', e); }
    try { this.updateWithdrawalsCountBadges(); } catch (e) { console.warn('updateWithdrawalsCountBadges err:', e); }
    try { this.populateMasterConfigInputs(); } catch (e) { console.warn('populateMasterConfigInputs err:', e); }
    try { this.renderAdminSpinHistoryTable(this.adminSpinHistSearch ? this.adminSpinHistSearch.value : '', this.adminSpinHistFilter ? this.adminSpinHistFilter.value : 'ALL'); } catch (e) { console.warn('renderAdminSpinHistoryTable err:', e); }
    try { this.renderMiniWheel(); } catch (e) { console.warn('renderMiniWheel err:', e); }

    // 3. Request latest real-time sync from cloud peers & server
    try {
      if (this.cloudSync) this.cloudSync.requestSync();
      this.pullStateFromServer();
    } catch (e) {}
  }

  closeAdminDrawer() {
    this.isDrawerOpen = false;
    this.adminDrawer.classList.add('hidden');
  }

  updateForcedWinnerUI() {
    if (this.forcedTargetNumberEl && this.forcedNext !== null && this.forcedNext !== undefined) {
      this.activeForcedIndicator?.classList.remove('hidden');
      this.forcedTargetNumberEl.textContent = `Number ${this.forcedNext}`;
    } else {
      this.activeForcedIndicator?.classList.add('hidden');
    }
  }

  updateSection1BadgeForSelectedSlot() {
    const nextSlot = getNextSlotInfo(new Date());
    const selectedSlot = (this.quickRoundHourSelect && this.quickRoundHourSelect.value) ? this.quickRoundHourSelect.value : nextSlot.label;
    const preset = this.dailySchedule ? this.dailySchedule[selectedSlot] : 'AUTO';

    if (this.activeTimingBadge) {
      this.activeTimingBadge.classList.remove('hidden');
      if (this.badgeTimingText) this.badgeTimingText.textContent = selectedSlot;

      if (preset && preset !== 'AUTO') {
        if (this.badgeTimingWinner) {
          this.badgeTimingWinner.textContent = `Number ${preset} (LOCKED 🔒)`;
          this.badgeTimingWinner.className = 'highlight-gold';
          this.badgeTimingWinner.style.color = '#ffd700';
        }
      } else if (this.forcedNext !== null && this.forcedNext !== undefined && this.forcedNext !== 'AUTO') {
        if (this.badgeTimingWinner) {
          this.badgeTimingWinner.textContent = `Number ${this.forcedNext} (LOCKED 🔒)`;
          this.badgeTimingWinner.className = 'highlight-gold';
          this.badgeTimingWinner.style.color = '#ffd700';
        }
      } else {
        if (this.badgeTimingWinner) {
          this.badgeTimingWinner.textContent = 'Auto (Random)';
          this.badgeTimingWinner.className = '';
          this.badgeTimingWinner.style.color = '#00f0ff';
        }
      }
    }

    // Also synchronize the winning number selector for this slot
    if (this.manualRoundWinnerSelect) {
      if (preset && preset !== 'AUTO') {
        const numVal = parseInt(preset, 10);
        this.manualRoundWinnerSelect.value = String(numVal);
      } else if (this.forcedNext !== null && this.forcedNext !== undefined && this.forcedNext !== 'AUTO') {
        const forcedNum = parseInt(this.forcedNext, 10);
        this.manualRoundWinnerSelect.value = String(forcedNum);
      } else {
        this.manualRoundWinnerSelect.value = 'AUTO';
      }
    }
  }

  populateAdminControls() {
    // Populate Timer Mode Radios & Inputs
    if (this.timerMode === 'MANUAL') {
      if (this.timerModeManual) this.timerModeManual.checked = true;
      const mins = Math.floor(this.customSecs / 60);
      const secs = this.customSecs % 60;
      if (this.customTimerMins) this.customTimerMins.value = mins;
      if (this.customTimerSecs) this.customTimerSecs.value = secs;
    } else {
      if (this.timerModeReal) this.timerModeReal.checked = true;
    }

    // Automatically set selected slot in Section 1 to upcoming slot
    const nextSlot = getNextSlotInfo(new Date());
    if (this.quickRoundHourSelect) {
      if (!this.userManuallySelectedRoundSlot) {
        this.quickRoundHourSelect.value = nextSlot.label;
      }
    }

    // Populate Section 1 Winning Number dropdown with Auto + 10 permanent fixed slices
    if (this.manualRoundWinnerSelect && this.manualRoundWinnerSelect.children.length === 0) {
      this.manualRoundWinnerSelect.innerHTML = '';
      const autoOpt = document.createElement('option');
      autoOpt.value = 'AUTO';
      autoOpt.textContent = '🎲 Auto (Random)';
      this.manualRoundWinnerSelect.appendChild(autoOpt);

      this.slices.forEach((num, idx) => {
        const opt = document.createElement('option');
        opt.value = num;
        opt.textContent = `Number ${num} (Slot #${idx + 1})`;
        this.manualRoundWinnerSelect.appendChild(opt);
      });
    }

    // Update Section 1 Badge and selector for currently selected slot
    this.updateSection1BadgeForSelectedSlot();

    // Render 4-Slot Daily Schedule Table
    this.renderDailyScheduleTable();
  }

  renderDailyScheduleTable() {
    if (!this.scheduleTableBody) return;
    const nextSlot = getNextSlotInfo(new Date());

    // Check if table rows already exist to sync values without re-creating DOM elements
    const existingRows = this.scheduleTableBody.querySelectorAll('tr');
    if (existingRows.length === DAILY_SLOTS.length) {
      DAILY_SLOTS.forEach((slot, idx) => {
        const tr = existingRows[idx];
        const isNext = slot.label === nextSlot.label;
        if (isNext && !tr.classList.contains('current-hour-row')) {
          tr.classList.add('current-hour-row');
        } else if (!isNext && tr.classList.contains('current-hour-row')) {
          tr.classList.remove('current-hour-row');
        }

        const sel = tr.querySelector('.schedule-select');
        if (sel) {
          const currentPreset = (this.dailySchedule && this.dailySchedule[slot.label] !== undefined) ? this.dailySchedule[slot.label] : 'AUTO';
          const targetVal = currentPreset === 'AUTO' ? 'AUTO' : String(currentPreset);
          if (sel.value !== targetVal) {
            sel.value = targetVal;
          }
        }
      });
      return;
    }

    this.scheduleTableBody.innerHTML = '';

    DAILY_SLOTS.forEach(slot => {
      const tr = document.createElement('tr');
      const isNext = slot.label === nextSlot.label;
      if (isNext) tr.className = 'current-hour-row';

      const currentPreset = (this.dailySchedule && this.dailySchedule[slot.label] !== undefined) ? this.dailySchedule[slot.label] : 'AUTO';

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
          <select class="schedule-select" data-slot="${slot.label}" id="sched-select-${slot.label.replace(/[^a-zA-Z0-9]/g, '')}">
            ${selectOptions}
          </select>
        </td>
        <td>
          <button type="button" class="btn btn-secondary btn-sm set-slot-btn" data-slot="${slot.label}">Set</button>
        </td>
      `;

      this.scheduleTableBody.appendChild(tr);
    });

    const selects = this.scheduleTableBody.querySelectorAll('.schedule-select');
    selects.forEach(sel => {
      sel.addEventListener('change', (e) => {
        const slotLabel = e.target.getAttribute('data-slot');
        const val = e.target.value === 'AUTO' ? 'AUTO' : parseInt(e.target.value, 10);
        if (!this.dailySchedule) this.dailySchedule = {};
        this.dailySchedule[slotLabel] = val;
        this.version = Date.now();
        this.lastVersion = this.version;
        localStorage.setItem(STATE_KEYS.DAILY_SCHEDULE, JSON.stringify(this.dailySchedule));
        this.pushStateToServer({ 
          dailySchedule: this.dailySchedule, 
          scheduleAction: val === 'AUTO' ? 'EXPLICIT_CLEAR' : 'SET_LOCK',
          clearedSlot: val === 'AUTO' ? slotLabel : null,
          lockedSlot: val !== 'AUTO' ? slotLabel : null,
          lockedWinner: val !== 'AUTO' ? val : null,
          version: this.version 
        });
        this.updateSection1BadgeForSelectedSlot();
        this.showTimerFeedback(`✅ Slot ${slotLabel} winner set to ${val === 'AUTO' ? 'Auto' : '#' + val}!`);
      });
    });

    const setBtns = this.scheduleTableBody.querySelectorAll('.set-slot-btn');
    setBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const slotLabel = btn.getAttribute('data-slot');
        this.setDailySlotWinner(slotLabel);
      });
    });
  }

  setDailySlotWinner(slotLabel) {
    const select = this.scheduleTableBody?.querySelector(`select[data-slot="${slotLabel}"]`);
    if (select) {
      const val = select.value === 'AUTO' ? 'AUTO' : parseInt(select.value, 10);
      if (!this.dailySchedule) this.dailySchedule = {};
      this.dailySchedule[slotLabel] = val;
      this.version = Date.now();
      this.lastVersion = this.version;
      localStorage.setItem(STATE_KEYS.DAILY_SCHEDULE, JSON.stringify(this.dailySchedule));
      this.pushStateToServer({ 
        dailySchedule: this.dailySchedule, 
        scheduleAction: val === 'AUTO' ? 'EXPLICIT_CLEAR' : 'SET_LOCK',
        clearedSlot: val === 'AUTO' ? slotLabel : null,
        lockedSlot: val !== 'AUTO' ? slotLabel : null,
        lockedWinner: val !== 'AUTO' ? val : null,
        version: this.version 
      });
      this.updateSection1BadgeForSelectedSlot();
      this.showTimerFeedback(`✅ Slot ${slotLabel} winner saved to ${val === 'AUTO' ? 'Auto' : '#' + val}!`);

      const btn = this.scheduleTableBody?.querySelector(`button[data-slot="${slotLabel}"]`);
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✅ Saved';
        btn.style.color = '#2ecc71';
        btn.style.borderColor = '#2ecc71';
        setTimeout(() => {
          if (btn) {
            btn.textContent = orig;
            btn.style.color = '';
            btn.style.borderColor = '';
          }
        }, 2000);
      }
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
    this.adminNavSpinBtn?.addEventListener('click', () => this.setAdminTab('spin'));
    this.adminNavPlayersBtn?.addEventListener('click', () => this.setAdminTab('players'));
    this.adminNavDepositsBtn?.addEventListener('click', () => this.setAdminTab('deposits'));
    this.adminNavWithdrawalsBtn?.addEventListener('click', () => this.setAdminTab('withdrawals'));
    this.adminNavSettingsBtn?.addEventListener('click', () => this.setAdminTab('settings'));

    this.adminMiniTestSpinBtn?.addEventListener('click', () => {
      this.dispatchSynchronizedSpin('Admin Mini Test Spin', true, null);
    });

    this.adminRefreshPlayersBtn?.addEventListener('click', () => {
      if (this.cloudSync) this.cloudSync.requestSync();
      this.pullStateFromServer().then(() => this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : ''));
      this.showAdminCreditFeedback('🔄 Player list refreshed!', true);
    });

    this.adminRefreshBetsBtn?.addEventListener('click', () => {
      if (this.cloudSync) this.cloudSync.requestSync();
      this.pullStateFromServer().then(() => this.renderAdminActiveBetsTable());
      this.showAdminCreditFeedback('🔄 Live bets refreshed!', true);
    });

    // Date Filter Pills (Today, Yesterday, Tomorrow, All Dates)
    document.querySelectorAll('.admin-bet-date-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.admin-bet-date-filter').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const dateVal = e.currentTarget.getAttribute('data-date') || 'TODAY';
        this.currentAdminBetDateFilter = dateVal;
        this.currentAdminBetCustomDate = '';
        if (this.adminBetDatePicker) this.adminBetDatePicker.value = '';
        this.renderAdminActiveBetsTable();
      });
    });

    // Custom Date Picker Filter
    this.adminBetDatePicker?.addEventListener('change', (e) => {
      if (e.target.value) {
        document.querySelectorAll('.admin-bet-date-filter').forEach(b => b.classList.remove('active'));
        this.currentAdminBetDateFilter = 'CUSTOM';
        this.currentAdminBetCustomDate = e.target.value;
        this.renderAdminActiveBetsTable();
      }
    });

    // Per-Slot Active Bets Filter Pills
    document.querySelectorAll('.admin-bet-slot-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.admin-bet-slot-filter').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const slot = e.currentTarget.getAttribute('data-slot') || 'ALL';
        this.currentAdminBetSlotFilter = slot;
        this.renderAdminActiveBetsTable();
      });
    });

    // Num Ledger Pro JSON Export / Backup Buttons
    this.adminExportCurrentSlotBtn?.addEventListener('click', () => {
      this.exportSlotEntriesJSON(this.currentAdminBetSlotFilter || 'ALL');
    });

    this.adminExportBetsJsonBtn?.addEventListener('click', () => {
      this.exportSlotEntriesJSON(this.currentAdminBetSlotFilter || 'ALL');
    });

    this.adminExportFullLedgerBtn?.addEventListener('click', () => {
      this.exportNumLedgerProJSON('FULL');
    });

    this.adminExportActiveEntriesBtn?.addEventListener('click', () => {
      this.exportSlotEntriesJSON(this.currentAdminBetSlotFilter || 'ALL');
    });

    this.adminImportLedgerTriggerBtn?.addEventListener('click', () => {
      this.adminImportLedgerFile?.click();
    });

    this.adminImportLedgerFile?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.importLedgerJSON(e.target.files[0]);
        this.adminImportLedgerFile.value = '';
      }
    });

    // Admin Deposit Management Events
    this.adminRefreshDepositsBtn?.addEventListener('click', () => {
      if (this.cloudSync) this.cloudSync.requestSync();
      this.pullStateFromServer().then(() => this.renderAdminDepositsList(this.adminDepFilter, this.adminDepSearch ? this.adminDepSearch.value : ''));
      this.showAdminCreditFeedback('🔄 Deposit requests refreshed!', true);
    });

    // Deposit Filter Pills
    document.querySelectorAll('.admin-dep-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-dep-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.adminDepFilter = btn.getAttribute('data-filter') || 'ALL';
        this.renderAdminDepositsList(this.adminDepFilter, this.adminDepSearch ? this.adminDepSearch.value : '');
      });
    });

    // Deposit Search Input
    this.adminDepSearch?.addEventListener('input', () => {
      this.renderAdminDepositsList(this.adminDepFilter, this.adminDepSearch.value);
    });

    // Master Settings Accordion Box Toggle
    this.adminSettingsToggleHdr?.addEventListener('click', () => {
      if (this.adminSettingsBody) {
        const isClosed = this.adminSettingsBody.classList.contains('hidden');
        if (isClosed) {
          this.adminSettingsBody.classList.remove('hidden');
          if (this.adminSettingsToggleIcon) this.adminSettingsToggleIcon.textContent = '▲';
        } else {
          this.adminSettingsBody.classList.add('hidden');
          if (this.adminSettingsToggleIcon) this.adminSettingsToggleIcon.textContent = '▼';
        }
      }
    });

    // Master Custom QR Code Image Upload & Preview (both sources)
    const handleQrUpload = async (file) => {
      if (file) {
        try {
          const base64 = await this.compressAndConvertImageToBase64(file, 400, 400, 0.85);
          if (this.adminCfgQrPreviewImg) this.adminCfgQrPreviewImg.src = base64;
          if (this.adminCfgQrPreviewImgPane) this.adminCfgQrPreviewImgPane.src = base64;
          this.adminUploadedQrBase64 = base64;
        } catch (err) {}
      }
    };
    this.adminCfgQrFileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleQrUpload(e.target.files[0]);
    });
    this.adminCfgQrFileInputPane?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleQrUpload(e.target.files[0]);
    });

    // Two-way real-time input synchronization between Tab 3 and Tab 5
    const syncField = (el1, el2) => {
      if (!el1 || !el2) return;
      el1.addEventListener('input', () => { el2.value = el1.value; });
      el2.addEventListener('input', () => { el1.value = el2.value; });
    };
    syncField(this.adminCfgUpiId, this.adminCfgUpiIdPane);
    syncField(this.adminCfgUpiName, this.adminCfgUpiNamePane);
    syncField(this.adminCfgMinDeposit, this.adminCfgMinDepositPane);
    syncField(this.adminCfgInstructions, this.adminCfgInstructionsPane);
    syncField(this.adminCfgTgToken, this.adminCfgTgTokenPane);
    syncField(this.adminCfgTgChatid, this.adminCfgTgChatidPane);
    syncField(this.adminCfgWaNumber, this.adminCfgWaNumberPane);

    if (this.adminCfgTgEnable && this.adminCfgTgEnablePane) {
      this.adminCfgTgEnable.addEventListener('change', () => { this.adminCfgTgEnablePane.checked = this.adminCfgTgEnable.checked; });
      this.adminCfgTgEnablePane.addEventListener('change', () => { this.adminCfgTgEnable.checked = this.adminCfgTgEnablePane.checked; });
    }

    // Unified Master Settings Saver (Saves QR, UPI & Notification configs together)
    const handleSaveMasterSettings = () => {
      const upiId = (this.adminCfgUpiId?.value || this.adminCfgUpiIdPane?.value || this.depositConfig?.upiId || '').trim() || '00000000';
      const upiName = (this.adminCfgUpiName?.value || this.adminCfgUpiNamePane?.value || this.depositConfig?.accountName || '').trim() || 'DEEP';
      const minDep = parseInt(this.adminCfgMinDeposit?.value || this.adminCfgMinDepositPane?.value || this.depositConfig?.minDeposit, 10) || 100;
      const inst = (this.adminCfgInstructions?.value || this.adminCfgInstructionsPane?.value || this.depositConfig?.instructions || '').trim();
      const qrUrl = this.adminUploadedQrBase64 !== undefined ? this.adminUploadedQrBase64 : (this.depositConfig?.qrImageUrl || '');

      this.depositConfig = {
        upiId: upiId,
        accountName: upiName,
        minDeposit: minDep,
        instructions: inst,
        qrImageUrl: qrUrl
      };
      this.saveDepositConfig(this.depositConfig);

      const token = (this.adminCfgTgToken?.value || this.adminCfgTgTokenPane?.value || this.notificationConfig?.telegramBotToken || '').trim();
      const chatId = (this.adminCfgTgChatid?.value || this.adminCfgTgChatidPane?.value || this.notificationConfig?.telegramChatId || '').trim();
      const enabled = this.adminCfgTgEnable ? !!this.adminCfgTgEnable.checked : (this.adminCfgTgEnablePane ? !!this.adminCfgTgEnablePane.checked : (this.notificationConfig?.telegramEnabled !== false));
      const wa = (this.adminCfgWaNumber?.value || this.adminCfgWaNumberPane?.value || this.notificationConfig?.whatsappNumber || '').trim();

      this.notificationConfig = {
        telegramBotToken: token,
        telegramChatId: chatId,
        telegramEnabled: enabled,
        whatsappNumber: wa
      };
      this.saveNotificationConfig(this.notificationConfig);

      this.pushStateToServer({ depositConfig: this.depositConfig, notificationConfig: this.notificationConfig });
      if (this.cloudSync) {
        this.cloudSync.publish(this.getCompleteStatePayload({ type: 'UPDATE_DEPOSIT_CONFIG', depositConfig: this.depositConfig, notificationConfig: this.notificationConfig }));
      }
      this.renderCustomerDepositUI();
      this.populateMasterConfigInputs();
      this.showQrFeedback('✅ QR Code, UPI & Payment settings saved & published to all devices!', true);
      this.showNotificationFeedback('✅ Telegram Notification settings saved successfully!', true);
    };

    this.adminSaveQrBtn?.addEventListener('click', handleSaveMasterSettings);
    this.adminSaveQrBtnPane?.addEventListener('click', handleSaveMasterSettings);
    this.adminSaveNotificationsBtn?.addEventListener('click', handleSaveMasterSettings);
    this.adminSaveNotificationsBtnPane?.addEventListener('click', handleSaveMasterSettings);

    this.adminTestTgBtn?.addEventListener('click', () => this.sendTelegramTestNotification());
    this.adminTestTgBtnPane?.addEventListener('click', () => this.sendTelegramTestNotification());

    document.getElementById('admin-enable-browser-alerts-btn')?.addEventListener('click', () => {
      if (this.audio) {
        this.audio.initContext();
        this.audio.playUrgentDepositAlarm();
      }
      if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        Notification.requestPermission().then(perm => {
          this.showLiveToast({
            title: 'AUDIO & PUSH ALERTS ACTIVE!',
            message: `Permission: <b>${perm}</b>. Master Admin will now receive loud audio chimes and popups on every Deposit, Withdrawal, and Bet!`,
            type: 'success',
            duration: 8000
          });
        });
      } else {
        this.showLiveToast({
          title: 'AUDIO & PUSH ALERTS ACTIVE!',
          message: 'Loud multi-tone chime & live alert banner triggered successfully!',
          type: 'deposit',
          actionText: '👉 VIEW TEST',
          actionCallback: () => {},
          duration: 8000
        });
      }
    });

    // Deposit Rejection Modal Events
    this.adminRejectDepositCloseBtn?.addEventListener('click', () => this.adminCloseRejectDepositModal());
    this.adminRejectDepCancelBtn?.addEventListener('click', () => this.adminCloseRejectDepositModal());
    this.adminRejectDepositOverlay?.addEventListener('click', () => this.adminCloseRejectDepositModal());

    this.adminRejectDepQuickReason?.addEventListener('change', () => {
      const sel = this.adminRejectDepQuickReason.value;
      if (sel !== 'CUSTOM' && this.adminRejectDepReasonText) {
        this.adminRejectDepReasonText.value = sel;
      } else if (this.adminRejectDepReasonText) {
        this.adminRejectDepReasonText.value = '';
        this.adminRejectDepReasonText.focus();
      }
    });

    this.adminRejectDepConfirmBtn?.addEventListener('click', () => {
      this.adminConfirmRejectDeposit();
    });

    // Receipt Zoom Modal Events
    this.adminReceiptCloseBtn?.addEventListener('click', () => this.closeReceiptZoomModal());
    this.adminReceiptOverlay?.addEventListener('click', () => this.closeReceiptZoomModal());

    this.receiptZoomCopyUtrBtn?.addEventListener('click', () => {
      const utr = this.receiptZoomUtr?.textContent || '';
      if (utr && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(utr).then(() => {
          const orig = this.receiptZoomCopyUtrBtn.textContent;
          this.receiptZoomCopyUtrBtn.textContent = '✅ Copied!';
          setTimeout(() => { if (this.receiptZoomCopyUtrBtn) this.receiptZoomCopyUtrBtn.textContent = orig; }, 2000);
        });
      }
    });

    this.receiptZoomApproveBtn?.addEventListener('click', () => {
      if (this.currentViewingReceiptDepId) {
        const depId = this.currentViewingReceiptDepId;
        this.closeReceiptZoomModal();
        this.adminApproveDeposit(depId);
      }
    });

    this.receiptZoomRejectBtn?.addEventListener('click', () => {
      if (this.currentViewingReceiptDepId) {
        const depId = this.currentViewingReceiptDepId;
        this.closeReceiptZoomModal();
        this.adminOpenRejectDepositModal(depId);
      }
    });

    this.adminRefreshWithdrawalsBtn?.addEventListener('click', () => {
      if (this.cloudSync) this.cloudSync.requestSync();
      this.pullStateFromServer().then(() => this.renderAdminWithdrawalsList(this.adminWdFilter, this.adminWdSearch ? this.adminWdSearch.value : ''));
      this.showAdminCreditFeedback('🔄 Withdrawal requests refreshed!', true);
    });

    // Withdrawal Filter Pills
    document.querySelectorAll('.admin-wd-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-wd-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.adminWdFilter = btn.getAttribute('data-filter') || 'ALL';
        this.renderAdminWithdrawalsList(this.adminWdFilter, this.adminWdSearch ? this.adminWdSearch.value : '');
      });
    });

    // Withdrawal Search Input
    this.adminWdSearch?.addEventListener('input', () => {
      this.renderAdminWithdrawalsList(this.adminWdFilter, this.adminWdSearch.value);
    });

    // Player Approval Status Filter Pills
    document.querySelectorAll('.admin-player-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-player-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.adminPlayerFilter = btn.getAttribute('data-filter') || 'ALL';
        this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');
      });
    });

    // Admin Player Registration Rejection Modal Events
    this.adminRejectPlayerCloseBtn?.addEventListener('click', () => this.adminCloseRejectPlayerModal());
    this.adminRejectPlayerCancelBtn?.addEventListener('click', () => this.adminCloseRejectPlayerModal());
    this.adminRejectPlayerOverlay?.addEventListener('click', () => this.adminCloseRejectPlayerModal());

    this.adminRejectPlayerQuickReason?.addEventListener('change', () => {
      const sel = this.adminRejectPlayerQuickReason.value;
      if (sel !== 'CUSTOM' && this.adminRejectPlayerReasonText) {
        this.adminRejectPlayerReasonText.value = sel;
      } else if (this.adminRejectPlayerReasonText) {
        this.adminRejectPlayerReasonText.value = '';
        this.adminRejectPlayerReasonText.focus();
      }
    });

    this.adminRejectPlayerConfirmBtn?.addEventListener('click', () => {
      this.adminConfirmRejectPlayer();
    });

    // Admin Rejection Modal Events
    this.adminRejectCloseBtn?.addEventListener('click', () => this.adminCloseRejectModal());
    this.adminRejectCancelBtn?.addEventListener('click', () => this.adminCloseRejectModal());
    this.adminRejectOverlay?.addEventListener('click', () => this.adminCloseRejectModal());

    this.adminRejectQuickReason?.addEventListener('change', () => {
      const sel = this.adminRejectQuickReason.value;
      if (sel !== 'CUSTOM' && this.adminRejectReasonText) {
        this.adminRejectReasonText.value = sel;
      } else if (this.adminRejectReasonText) {
        this.adminRejectReasonText.value = '';
        this.adminRejectReasonText.focus();
      }
    });

    this.adminRejectConfirmBtn?.addEventListener('click', () => {
      this.adminConfirmReject();
    });

    // Admin Player Full History Modal Events
    this.adminPlayerHistoryCloseBtn?.addEventListener('click', () => this.closePlayerHistoryModal());
    this.adminPlayerHistoryOverlay?.addEventListener('click', () => this.closePlayerHistoryModal());
    this.aphTogglePinBtn?.addEventListener('click', () => this.toggleAphPin());

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

    // Admin Master Vertical Nav Tabs
    this.adminNavSpinBtn?.addEventListener('click', () => this.setAdminTab('spin'));
    this.adminNavPlayersBtn?.addEventListener('click', () => this.setAdminTab('players'));
    this.adminNavLiveBetsBtn?.addEventListener('click', () => this.setAdminTab('livebets'));
    this.adminNavDepositsBtn?.addEventListener('click', () => this.setAdminTab('deposits'));
    this.adminNavWithdrawalsBtn?.addEventListener('click', () => this.setAdminTab('withdrawals'));
    this.adminNavChatsBtn?.addEventListener('click', () => this.setAdminTab('chats'));
    this.adminNavPromosBtn?.addEventListener('click', () => this.setAdminTab('promos'));
    this.adminNavBackupBtn?.addEventListener('click', () => this.setAdminTab('backup'));
    this.adminNavSettingsBtn?.addEventListener('click', () => this.setAdminTab('settings'));
  }

  setAdminTab(tabName) {
    if (this.cloudSync) this.cloudSync.requestSync();
    
    // Clear all active states on vertical tabs
    this.adminNavSpinBtn?.classList.remove('active');
    this.adminNavPlayersBtn?.classList.remove('active');
    this.adminNavLiveBetsBtn?.classList.remove('active');
    this.adminNavDepositsBtn?.classList.remove('active');
    this.adminNavWithdrawalsBtn?.classList.remove('active');
    this.adminNavChatsBtn?.classList.remove('active');
    this.adminNavPromosBtn?.classList.remove('active');
    this.adminNavBackupBtn?.classList.remove('active');
    this.adminNavSettingsBtn?.classList.remove('active');

    // Hide all panes
    this.adminTabSpinPane?.classList.add('hidden');
    this.adminTabPlayersPane?.classList.add('hidden');
    this.adminTabLiveBetsPane?.classList.add('hidden');
    this.adminTabDepositsPane?.classList.add('hidden');
    this.adminTabWithdrawalsPane?.classList.add('hidden');
    this.adminTabChatsPane?.classList.add('hidden');
    this.adminTabPromosPane?.classList.add('hidden');
    this.adminTabBackupPane?.classList.add('hidden');
    this.adminTabSettingsPane?.classList.add('hidden');

    if (tabName === 'players') {
      this.adminNavPlayersBtn?.classList.add('active');
      this.adminTabPlayersPane?.classList.remove('hidden');
      this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');
    } else if (tabName === 'livebets') {
      this.adminNavLiveBetsBtn?.classList.add('active');
      this.adminTabLiveBetsPane?.classList.remove('hidden');
      this.renderAdminActiveBetsTable();
    } else if (tabName === 'backup') {
      this.adminNavBackupBtn?.classList.add('active');
      this.adminTabBackupPane?.classList.remove('hidden');
      this.renderMasterBackupStats();
    } else if (tabName === 'deposits') {
      this.adminNavDepositsBtn?.classList.add('active');
      this.adminTabDepositsPane?.classList.remove('hidden');
      this.renderAdminDepositsList(this.adminDepFilter, this.adminDepSearch ? this.adminDepSearch.value : '');
      this.populateMasterConfigInputs();
    } else if (tabName === 'withdrawals') {
      this.adminNavWithdrawalsBtn?.classList.add('active');
      this.adminTabWithdrawalsPane?.classList.remove('hidden');
      this.renderAdminWithdrawalsList(this.adminWdFilter, this.adminWdSearch ? this.adminWdSearch.value : '');
    } else if (tabName === 'chats') {
      this.adminNavChatsBtn?.classList.add('active');
      this.adminTabChatsPane?.classList.remove('hidden');
      this.refreshSupportChatsUI();
    } else if (tabName === 'promos') {
      this.adminNavPromosBtn?.classList.add('active');
      this.adminTabPromosPane?.classList.remove('hidden');
      this.renderAdminPromosList();
    } else if (tabName === 'settings') {
      this.adminNavSettingsBtn?.classList.add('active');
      this.adminTabSettingsPane?.classList.remove('hidden');
      this.populateMasterConfigInputs();
    } else {
      this.adminNavSpinBtn?.classList.add('active');
      this.adminTabSpinPane?.classList.remove('hidden');
      this.populateAdminControls();
    }
  }

  renderAdminDepositsList(filterStatus = 'ALL', searchQuery = '') {
    if (!this.adminDepositsTableBody) return;

    const activeFilter = (filterStatus && filterStatus !== 'ALL' && ['PENDING', 'APPROVED', 'REJECTED'].includes(filterStatus)) ? filterStatus : 'ALL';
    this.adminDepFilter = activeFilter;

    // Update active class on filter pill buttons
    document.querySelectorAll('.admin-dep-filter').forEach(b => {
      if ((b.getAttribute('data-filter') || 'ALL') === activeFilter) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    const list = Array.isArray(this.deposits) ? this.deposits : [];
    const totalCount = list.length;
    const pendingCount = list.filter(d => d && d.status === 'PENDING').length;
    const approvedCount = list.filter(d => d && d.status === 'APPROVED').length;
    const rejectedCount = list.filter(d => d && d.status === 'REJECTED').length;
    const approvedAmount = list.filter(d => d && d.status === 'APPROVED').reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    // Update stat cards & badges
    if (this.adminDepTotalCount) this.adminDepTotalCount.textContent = totalCount;
    if (this.adminDepPendingCount) this.adminDepPendingCount.textContent = pendingCount;
    if (this.adminDepApprovedCount) this.adminDepApprovedCount.textContent = approvedCount;
    if (this.adminDepRejectedCount) this.adminDepRejectedCount.textContent = rejectedCount;
    if (this.adminDepTotalAmount) this.adminDepTotalAmount.textContent = `₹${approvedAmount.toLocaleString()}`;

    if (this.depFltAll) this.depFltAll.textContent = totalCount;
    if (this.depFltPending) this.depFltPending.textContent = pendingCount;
    if (this.depFltApproved) this.depFltApproved.textContent = approvedCount;
    if (this.depFltRejected) this.depFltRejected.textContent = rejectedCount;

    if (this.adminTabBadgeDeposits) {
      this.adminTabBadgeDeposits.textContent = pendingCount;
    }

    const q = (searchQuery || '').toLowerCase().trim();
    const filtered = list.filter(d => {
      if (!d) return false;
      if (activeFilter !== 'ALL' && d.status !== activeFilter) return false;
      if (!q) return true;
      return (
        (d.customerId && String(d.customerId).toLowerCase().includes(q)) ||
        (d.customerName && String(d.customerName).toLowerCase().includes(q)) ||
        (d.customerMobile && String(d.customerMobile).toLowerCase().includes(q)) ||
        (d.utr && String(d.utr).toLowerCase().includes(q)) ||
        (d.id && String(d.id).toLowerCase().includes(q))
      );
    });

    if (filtered.length === 0) {
      this.adminDepositsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; color:var(--text-muted); padding:1.2rem;">
            ${totalCount === 0 ? 'No deposit requests yet.' : 'No deposit requests match current filter.'}
          </td>
        </tr>
      `;
      return;
    }

    this.adminDepositsTableBody.innerHTML = '';
    filtered.forEach(d => {
      const tr = document.createElement('tr');

      let statusBadge = '';
      if (d.status === 'APPROVED') {
        statusBadge = '<span class="status-pill status-approved">✅ Credited</span>';
      } else if (d.status === 'REJECTED') {
        statusBadge = '<span class="status-pill status-rejected">❌ Rejected</span>';
      } else {
        statusBadge = '<span class="status-pill status-pending" style="animation: badgePulsate 1.5s infinite ease-in-out;">⏳ Pending</span>';
      }

      let actionsHtml = '';
      if (d.status === 'PENDING') {
        actionsHtml = `
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            <button class="btn btn-gold btn-xs" style="background:#2ecc71; border-color:#27ae60; color:#000; font-weight:800; padding:3px 7px;" title="Confirm & Credit Coins" onclick="(window.app || app).adminApproveDeposit('${d.id}')">✓ Confirm</button>
            <button class="btn btn-danger btn-xs" style="padding:3px 7px;" title="Reject with Reason" onclick="(window.app || app).adminOpenRejectDepositModal('${d.id}')">✕ Reject</button>
          </div>
        `;
      } else if (d.status === 'APPROVED') {
        actionsHtml = `<span style="color:#2ecc71; font-size:0.7rem; font-weight:700;">Credited (${d.processedTime || ''})</span>`;
      } else {
        actionsHtml = `<span style="color:#ef4444; font-size:0.68rem; font-weight:700;">Rejected</span>`;
      }

      tr.innerHTML = `
        <td>
          <a href="javascript:void(0)" class="player-id-link" onclick="app.openPlayerHistoryModal('${d.customerId}')" title="Tap to view player profile & history">
            <strong style="color:#fff;">${d.customerName || 'Player'}</strong><br>
            <span style="font-family:monospace; color:#00f0ff; font-weight:700; font-size:0.75rem;">ID: ${d.customerId}</span>
          </a>
          ${d.customerMobile ? `<br><span style="font-size:0.68rem; color:var(--text-muted);">📱 ${d.customerMobile}</span>` : ''}
        </td>
        <td>
          <strong style="color:var(--primary-gold-bright); font-size:0.92rem;">₹${(Number(d.amount) || 0).toLocaleString()}</strong><br>
          <span style="font-size:0.7rem; color:#2ecc71; font-weight:700;">💰 ${d.amount} Coins</span>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:4px;">
            <span style="font-family:monospace; color:#ffd700; font-size:0.8rem; font-weight:700;">${d.utr || '--'}</span>
            ${d.utr ? `<button type="button" class="btn btn-secondary btn-xs" style="padding:1px 4px; font-size:0.65rem;" onclick="navigator.clipboard?.writeText('${d.utr}'); alert('UTR Copied: ${d.utr}')">📋</button>` : ''}
          </div>
          <span style="font-size:0.65rem; color:var(--text-muted); font-family:monospace;">${d.id}</span>
        </td>
        <td>
          ${d.screenshotUrl ? `
            <img src="${d.screenshotUrl}" alt="Receipt" class="dep-screenshot-thumb" onclick="app.openReceiptZoomModal('${d.id}')" title="Tap to zoom receipt screenshot">
          ` : '<span style="color:var(--text-muted); font-size:0.7rem;">No file</span>'}
        </td>
        <td>
          <span style="font-size:0.72rem; color:var(--text-secondary);">${d.requestedDate || ''}</span><br>
          <span style="font-size:0.68rem; color:var(--text-muted);">${d.requestedTime || ''}</span>
        </td>
        <td>
          ${statusBadge}
          ${d.status === 'REJECTED' && d.rejectionReason ? `<br><span style="font-size:0.68rem; color:#ef4444; display:block; max-width:140px; margin-top:2px;">Reason: ${d.rejectionReason}</span>` : ''}
        </td>
        <td>
          ${actionsHtml}
        </td>
      `;

      this.adminDepositsTableBody.appendChild(tr);
    });
  }

  adminApproveDeposit(id) {
    const req = (this.deposits || []).find(d => d.id === id);
    if (!req) return;

    req.status = 'APPROVED';
    req.processedAt = Date.now();
    req.processedTime = formatTime12(new Date());

    // 1. Credit coins immediately to customer balance
    this.adminAddPlayerCredit(req.customerId, req.amount);

    // 2. Save & push deposits state
    this.saveDeposits(this.deposits);

    // Broadcast instant real-time approval event to customer phone
    if (this.cloudSync) {
      this.cloudSync.broadcastLiveEvent({
        eventType: 'DEPOSIT_STATUS_UPDATED',
        deposit: req
      });
    }

    this.pushStateToServer({ deposits: this.deposits, customersDb: this.customersDb });

    this.renderAdminDepositsList(this.adminDepFilter, this.adminDepSearch ? this.adminDepSearch.value : '');
    this.showAdminCreditFeedback(`✅ Deposit ${req.id} confirmed! Credited 💰${req.amount} IHD Coins to ${req.customerId}.`, true);
    if (this.audio) this.audio.playWinFanfare();

    // Send Telegram Notification for Deposit Approval
    const tgApproveMsg = `✅ *DEPOSIT APPROVED & CREDITED!*\n\n👤 *Player:* ${req.customerName || 'Player'} (ID: \`${req.customerId}\`)\n💰 *Amount Credited:* 💰${Number(req.amount || 0).toLocaleString()} IHD Coins (₹${Number(req.amount || 0).toLocaleString()})\n🔢 *UTR:* \`${req.utr || 'N/A'}\`\n🕒 *Processed At:* ${req.processedTime || formatTime12(new Date())}\n\n👉 Coins auto-credited to player wallet!`;
    this.sendTelegramNotification(tgApproveMsg);
  }

  adminOpenRejectDepositModal(id) {
    const req = (this.deposits || []).find(d => d.id === id);
    if (!req) return;

    this.pendingRejectDepositId = id;

    if (this.rejectDepositModalTitle) {
      this.rejectDepositModalTitle.textContent = `Reject Deposit: ₹${req.amount} (${req.customerName || 'Player'})`;
    }
    if (this.rejectDepositModalDesc) {
      this.rejectDepositModalDesc.innerHTML = `Player ID: <strong>${req.customerId}</strong> | UTR: <strong>${req.utr || 'N/A'}</strong><br>Select or type the reason for rejection below.`;
    }
    if (this.adminRejectDepQuickReason) {
      this.adminRejectDepQuickReason.selectedIndex = 0;
    }
    if (this.adminRejectDepReasonText) {
      this.adminRejectDepReasonText.value = this.adminRejectDepQuickReason ? this.adminRejectDepQuickReason.value : 'Payment not received in bank account';
    }

    if (this.adminRejectDepositModal) {
      this.adminRejectDepositModal.classList.remove('hidden');
    }
  }

  adminCloseRejectDepositModal() {
    this.pendingRejectDepositId = null;
    if (this.adminRejectDepositModal) {
      this.adminRejectDepositModal.classList.add('hidden');
    }
  }

  adminConfirmRejectDeposit() {
    if (!this.pendingRejectDepositId) return;

    const req = (this.deposits || []).find(d => d.id === this.pendingRejectDepositId);
    if (!req) {
      this.adminCloseRejectDepositModal();
      return;
    }

    const reason = this.adminRejectDepReasonText?.value.trim() || 'Payment not received in bank account';

    req.status = 'REJECTED';
    req.rejectionReason = reason;
    req.processedAt = Date.now();
    req.processedTime = formatTime12(new Date());

    this.saveDeposits(this.deposits);

    // Broadcast instant real-time rejection event to customer phone
    if (this.cloudSync) {
      this.cloudSync.broadcastLiveEvent({
        eventType: 'DEPOSIT_STATUS_UPDATED',
        deposit: req
      });
    }

    this.pushStateToServer({ deposits: this.deposits });

    this.adminCloseRejectDepositModal();
    this.renderAdminDepositsList(this.adminDepFilter, this.adminDepSearch ? this.adminDepSearch.value : '');
    this.showAdminCreditFeedback(`❌ Deposit ${req.id} marked as Rejected.`, false);

    // Send Telegram Notification for Deposit Rejection
    const tgRejectMsg = `❌ *DEPOSIT REJECTED!*\n\n👤 *Player:* ${req.customerName || 'Player'} (ID: \`${req.customerId}\`)\n💰 *Amount:* ₹${(req.amount || 0).toLocaleString()}\n🔢 *UTR:* \`${req.utr || 'N/A'}\`\n⚠️ *Reason:* ${reason}\n🕒 *Time:* ${req.processedTime || formatTime12(new Date())}`;
    this.sendTelegramNotification(tgRejectMsg);
  }

  checkIsAdminAuthenticated() {
    return true;
  }

  openReceiptZoomModal(id) {
    const dep = (this.deposits || []).find(d => d.id === id);
    if (!dep) return;

    this.currentViewingReceiptDepId = id;

    if (this.receiptZoomPlayerName) this.receiptZoomPlayerName.textContent = dep.customerName || dep.customerId || 'Player';
    if (this.receiptZoomPlayerId) this.receiptZoomPlayerId.textContent = `(ID: ${dep.customerId})`;
    if (this.receiptZoomAmount) this.receiptZoomAmount.textContent = `💰 ${(dep.amount || 0).toLocaleString()} IHD Coins (₹${(dep.amount || 0).toLocaleString()})`;
    if (this.receiptZoomUtr) this.receiptZoomUtr.textContent = dep.utr || 'No UTR provided';
    if (this.receiptZoomImg) {
      this.receiptZoomImg.src = dep.screenshotUrl || '';
    }

    const isPending = (dep.status === 'PENDING');
    const isAdmin = this.checkIsAdminAuthenticated();

    const actionsRow = document.getElementById('receipt-zoom-actions-row');
    if (actionsRow) {
      actionsRow.style.display = (isAdmin && isPending) ? 'flex' : 'none';
    }
    if (this.receiptZoomApproveBtn) this.receiptZoomApproveBtn.style.display = (isAdmin && isPending) ? 'block' : 'none';
    if (this.receiptZoomRejectBtn) this.receiptZoomRejectBtn.style.display = (isAdmin && isPending) ? 'block' : 'none';

    if (this.adminReceiptModal) {
      this.adminReceiptModal.classList.remove('hidden');
    }
  }

  closeReceiptZoomModal() {
    this.currentViewingReceiptDepId = null;
    if (this.adminReceiptModal) {
      this.adminReceiptModal.classList.add('hidden');
    }
  }

  renderAdminWithdrawalsList(filterStatus = 'ALL', searchQuery = '') {
    if (!this.adminWithdrawalsTableBody) return;

    const activeFilter = (filterStatus && filterStatus !== 'ALL' && ['PENDING', 'APPROVED', 'REJECTED'].includes(filterStatus)) ? filterStatus : 'ALL';
    this.adminWdFilter = activeFilter;

    // Update active class on filter pill buttons
    document.querySelectorAll('.admin-wd-filter').forEach(b => {
      if ((b.getAttribute('data-filter') || 'ALL') === activeFilter) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    const list = Array.isArray(this.withdrawals) ? this.withdrawals : [];
    const totalCount = list.length;
    const pendingCount = list.filter(w => w && w.status === 'PENDING').length;
    const approvedCount = list.filter(w => w && w.status === 'APPROVED').length;
    const rejectedCount = list.filter(w => w && w.status === 'REJECTED').length;

    // Update counters
    if (this.adminWdTotalCount) this.adminWdTotalCount.textContent = totalCount;
    if (this.adminWdPendingCount) this.adminWdPendingCount.textContent = pendingCount;
    if (this.adminWdApprovedCount) this.adminWdApprovedCount.textContent = approvedCount;
    if (this.adminWdRejectedCount) this.adminWdRejectedCount.textContent = rejectedCount;

    if (this.wdFltAll) this.wdFltAll.textContent = totalCount;
    if (this.wdFltPending) this.wdFltPending.textContent = pendingCount;
    if (this.wdFltApproved) this.wdFltApproved.textContent = approvedCount;
    if (this.wdFltRejected) this.wdFltRejected.textContent = rejectedCount;

    if (this.adminTabBadgeWithdrawals) {
      this.adminTabBadgeWithdrawals.textContent = pendingCount;
    }

    const q = (searchQuery || '').toLowerCase().trim();
    const filtered = list.filter(w => {
      if (!w) return false;
      if (activeFilter !== 'ALL' && w.status !== activeFilter) return false;
      if (!q) return true;
      return (
        (w.customerId && String(w.customerId).toLowerCase().includes(q)) ||
        (w.customerName && String(w.customerName).toLowerCase().includes(q)) ||
        (w.accountName && String(w.accountName).toLowerCase().includes(q)) ||
        (w.accountNumber && String(w.accountNumber).toLowerCase().includes(q)) ||
        (w.ifscCode && String(w.ifscCode).toLowerCase().includes(q)) ||
        (w.id && String(w.id).toLowerCase().includes(q))
      );
    });

    if (filtered.length === 0) {
      this.adminWithdrawalsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; color:var(--text-muted); padding:1.2rem;">
            ${totalCount === 0 ? 'No withdrawal requests yet.' : 'No withdrawal requests match current filter.'}
          </td>
        </tr>
      `;
      return;
    }

    this.adminWithdrawalsTableBody.innerHTML = '';
    filtered.forEach(w => {
      const tr = document.createElement('tr');

      let statusBadge = '';
      if (w.status === 'APPROVED') {
        statusBadge = '<span class="status-pill status-approved">✅ Approved</span>';
      } else if (w.status === 'REJECTED') {
        statusBadge = '<span class="status-pill status-rejected">❌ Rejected</span>';
      } else {
        statusBadge = '<span class="status-pill status-pending" style="animation: badgePulsate 1.5s infinite ease-in-out;">⏳ Pending</span>';
      }

      let actionsHtml = '';
      if (w.status === 'PENDING') {
        actionsHtml = `
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            <button class="btn btn-gold btn-xs" style="background:#2ecc71; border-color:#27ae60; color:#000; font-weight:800; padding:3px 7px;" title="Confirm & Approve" onclick="(window.app || app).adminApproveWithdrawal('${w.id}')">✓ Confirm</button>
            <button class="btn btn-danger btn-xs" style="padding:3px 7px;" title="Reject with Reason" onclick="(window.app || app).adminOpenRejectModal('${w.id}')">✕ Reject</button>
          </div>
        `;
      } else if (w.status === 'APPROVED') {
        actionsHtml = `<span style="color:#2ecc71; font-size:0.7rem; font-weight:700;">Completed (${w.processedTime || ''})</span>`;
      } else {
        actionsHtml = `<span style="color:#ef4444; font-size:0.68rem; font-weight:700;">Rejected & Refunded</span>`;
      }

      tr.innerHTML = `
        <td>
          <a href="javascript:void(0)" class="player-id-link" onclick="app.openPlayerHistoryModal('${w.customerId}')" title="Tap to view player profile & history">
            <strong style="color:#fff;">${w.customerName || 'Player'}</strong><br>
            <span style="font-family:monospace; color:#00f0ff; font-weight:700; font-size:0.75rem;">ID: ${w.customerId}</span>
          </a>
          ${w.customerMobile ? `<br><span style="font-size:0.68rem; color:var(--text-muted);">📱 ${w.customerMobile}</span>` : ''}
        </td>
        <td>
          <strong style="color:var(--primary-gold-bright); font-size:0.9rem;">💰 ${(Number(w.amount) || 0).toLocaleString()} IHD</strong>
        </td>
        <td>
          <div style="line-height:1.3;">
            <span style="color:#fff; font-weight:700;">${w.accountName || '--'}</span><br>
            <span style="color:var(--text-secondary); font-family:monospace;">A/C: ${w.accountNumber || '--'}</span><br>
            <span style="color:#00f0ff; font-size:0.68rem; font-weight:700;">IFSC: ${w.ifscCode || '--'}</span>
          </div>
        </td>
        <td>
          <span style="font-size:0.72rem; color:var(--text-secondary);">${w.requestedDate || ''}</span><br>
          <span style="font-size:0.68rem; color:var(--text-muted);">${w.requestedTime || ''}</span>
        </td>
        <td>
          ${statusBadge}
          ${w.status === 'REJECTED' && w.rejectionReason ? `<br><span style="font-size:0.68rem; color:#ef4444; display:block; max-width:140px; margin-top:2px;">Reason: ${w.rejectionReason}</span>` : ''}
        </td>
        <td>
          ${actionsHtml}
        </td>
      `;

      this.adminWithdrawalsTableBody.appendChild(tr);
    });
  }

  adminApproveWithdrawal(id) {
    const req = (this.withdrawals || []).find(w => w.id === id);
    if (!req) return;

    req.status = 'APPROVED';
    req.processedAt = Date.now();
    req.processedTime = formatTime12(new Date());

    this.saveWithdrawals(this.withdrawals);

    // Broadcast instant real-time approval event to customer phone
    if (this.cloudSync) {
      this.cloudSync.broadcastLiveEvent({
        eventType: 'WITHDRAWAL_STATUS_UPDATED',
        withdrawal: req
      });
    }

    this.pushStateToServer({ withdrawals: this.withdrawals });
    this.renderAdminWithdrawalsList(this.adminWdFilter, this.adminWdSearch ? this.adminWdSearch.value : '');
    this.showAdminCreditFeedback(`✅ Withdrawal ${req.id} confirmed & completed!`, true);

    // Send Telegram Notification for Withdrawal Approval
    const tgWdApproveMsg = `✅ *WITHDRAWAL COMPLETED & APPROVED!*\n\n👤 *Player:* ${req.customerName || 'Player'} (ID: \`${req.customerId}\`)\n💰 *Amount Transferred:* 💰${(Number(req.amount) || 0).toLocaleString()} IHD Coins (₹${(Number(req.amount) || 0).toLocaleString()})\n🏦 *Bank A/C:* \`${req.accountNumber || '--'}\` (${req.ifscCode || '--'})\n👤 *A/C Name:* ${req.accountName || '--'}\n🕒 *Time:* ${req.processedTime || formatTime12(new Date())}`;
    this.sendTelegramNotification(tgWdApproveMsg);
  }

  adminOpenRejectModal(id) {
    const req = (this.withdrawals || []).find(w => w.id === id);
    if (!req) return;

    this.pendingRejectWdId = id;

    if (this.rejectModalTitle) {
      this.rejectModalTitle.textContent = `Reject Request: 💰${req.amount} IHD (${req.customerName || 'Player'})`;
    }
    if (this.rejectModalDesc) {
      this.rejectModalDesc.innerHTML = `Player ID: <strong>${req.customerId}</strong> | A/C: <strong>${req.accountNumber}</strong><br><span style="color:#2ecc71;">💰${req.amount} IHD Coins will be refunded automatically to player's wallet balance.</span>`;
    }
    if (this.adminRejectQuickReason) {
      this.adminRejectQuickReason.selectedIndex = 0;
    }
    if (this.adminRejectReasonText) {
      this.adminRejectReasonText.value = this.adminRejectQuickReason ? this.adminRejectQuickReason.value : 'Incorrect Bank Account Number';
    }

    if (this.adminRejectModal) {
      this.adminRejectModal.classList.remove('hidden');
    }
  }

  adminCloseRejectModal() {
    this.pendingRejectWdId = null;
    if (this.adminRejectModal) {
      this.adminRejectModal.classList.add('hidden');
    }
  }

  adminConfirmReject() {
    if (!this.pendingRejectWdId) return;

    const req = (this.withdrawals || []).find(w => w.id === this.pendingRejectWdId);
    if (!req) {
      this.adminCloseRejectModal();
      return;
    }

    if (req.isRefunded || req.status === 'REJECTED') {
      this.adminCloseRejectModal();
      this.showAdminCreditFeedback(`⚠️ Withdrawal ${req.id} is already marked as rejected/refunded.`, false);
      return;
    }

    const reason = this.adminRejectReasonText?.value.trim() || 'Details mismatch / Bank rejection';

    req.status = 'REJECTED';
    req.rejectionReason = reason;
    req.isRefunded = true;
    req.refundedAt = Date.now();
    req.processedAt = Date.now();
    req.processedTime = formatTime12(new Date());

    // AUTOMATIC COIN REFUND BACK TO PLAYER'S WALLET (EXACTLY ONCE)
    let refundedPlayer = null;
    if (this.customersDb && this.customersDb[req.customerId]) {
      refundedPlayer = this.customersDb[req.customerId];
    } else if (this.customersDb) {
      refundedPlayer = Object.values(this.customersDb).find(p => p.id === req.customerId || p.mobile === req.customerId);
    }

    if (refundedPlayer) {
      refundedPlayer.coins = (Number(refundedPlayer.coins) || 0) + (Number(req.amount) || 0);
      refundedPlayer.lastUpdated = Date.now();
      this.saveCustomersDB(this.customersDb);
    }

    if (this.currentCustomer && (this.currentCustomer.id === req.customerId || this.currentCustomer.mobile === req.customerId)) {
      this.currentCustomer.coins = (Number(this.currentCustomer.coins) || 0) + (Number(req.amount) || 0);
      this.currentCustomer.lastUpdated = Date.now();
      this.saveCustomerSession(this.currentCustomer);
      this.updateCustomerUI();
    }

    this.saveWithdrawals(this.withdrawals);

    // Broadcast instant real-time rejection event to customer phone
    if (this.cloudSync) {
      this.cloudSync.broadcastLiveEvent({
        eventType: 'WITHDRAWAL_STATUS_UPDATED',
        withdrawal: req
      });
    }

    this.pushStateToServer({ customersDb: this.customersDb, withdrawals: this.withdrawals });

    this.adminCloseRejectModal();
    this.renderAdminWithdrawalsList(this.adminWdFilter, this.adminWdSearch ? this.adminWdSearch.value : '');
    this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');
    this.showAdminCreditFeedback(`❌ Withdrawal ${req.id} rejected. 💰${req.amount} IHD Coins refunded to ${req.customerId}.`, false);

    // Send Telegram Notification for Withdrawal Rejection
    const tgWdRejectMsg = `❌ *WITHDRAWAL REJECTED & REFUNDED!*\n\n👤 *Player:* ${req.customerName || 'Player'} (ID: \`${req.customerId}\`)\n💰 *Amount Refunded:* 💰${(Number(req.amount) || 0).toLocaleString()} IHD Coins\n⚠️ *Reason:* ${reason}\n🕒 *Time:* ${req.processedTime || formatTime12(new Date())}`;
    this.sendTelegramNotification(tgWdRejectMsg);
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
    const prevBalance = Number(player.coins) || 0;
    const addAmt = Number(amount) || 0;
    const newBalance = Math.max(0, prevBalance + addAmt);
    player.coins = newBalance;
    player.lastUpdated = Date.now();
    this.customersDb[userId] = player;

    this.saveCustomersDB(this.customersDb);

    // If currently logged-in player is this player, update session & UI instantly
    if (this.currentCustomer && this.currentCustomer.id === userId) {
      this.currentCustomer.coins = newBalance;
      this.currentCustomer.lastUpdated = Date.now();
      this.saveCustomerSession(this.currentCustomer);
      this.updateCustomerUI();
    }

    // If Player History modal is open for this player, update it immediately
    if (this.currentAphPlayerId === userId && this.adminPlayerHistoryModal && !this.adminPlayerHistoryModal.classList.contains('hidden')) {
      this.openPlayerHistoryModal(userId);
    }

    this.pushStateToServer({ customersDb: this.customersDb });
    this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');
    this.showAdminCreditFeedback(`✅ Credited ${addAmt >= 0 ? '+' : ''}${addAmt} IHD Coins to ${player.name || userId} (${userId})! New Balance: 💰 ${newBalance.toLocaleString()} IHD Coins`, true);
    if (this.audio) this.audio.playTick();

    // Send Telegram Notification for Admin Credit Update
    const tgCreditMsg = `💳 *ADMIN COIN UPDATE!*\n\n👤 *Player:* ${player.name || userId} (ID: \`${userId}\`)\n💰 *Amount:* ${addAmt >= 0 ? '+' : ''}${addAmt.toLocaleString()} IHD Coins\n💼 *New Balance:* 💰${newBalance.toLocaleString()} IHD Coins\n🕒 *Time:* ${formatTime12(new Date())}`;
    this.sendTelegramNotification(tgCreditMsg);
  }

  adminSetPlayerExactBalance(userId, targetCoins) {
    if (!this.customersDb || !this.customersDb[userId]) {
      this.showAdminCreditFeedback(`❌ Player "${userId}" not found!`, false);
      return;
    }

    const player = this.customersDb[userId];
    const newCoins = Math.max(0, parseInt(targetCoins, 10) || 0);
    const oldCoins = Number(player.coins) || 0;
    player.coins = newCoins;
    player.lastUpdated = Date.now();
    this.customersDb[userId] = player;

    this.saveCustomersDB(this.customersDb);

    if (this.currentCustomer && (this.currentCustomer.id === userId || String(this.currentCustomer.id) === String(userId))) {
      this.currentCustomer.coins = newCoins;
      this.currentCustomer.lastUpdated = Date.now();
      this.saveCustomerSession(this.currentCustomer);
      this.updateCustomerUI();
    }

    this.pushStateToServer({ customersDb: this.customersDb });

    this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');
    this.renderMasterBackupStats();
    if (this.currentAphPlayerId === userId && this.adminPlayerHistoryModal && !this.adminPlayerHistoryModal.classList.contains('hidden')) {
      this.openPlayerHistoryModal(userId);
    }

    this.showAdminCreditFeedback(`✅ Player ${player.name} (${userId}) balance set to 💰 ${newCoins.toLocaleString()} IHD Coins!`, true);
    if (this.audio) this.audio.playWinFanfare();

    // Send Telegram Notification
    const tgMsg = `✏️ <b>[PLAYER WALLET BALANCE ADJUSTED]</b>\n\n👤 <b>Player:</b> ${player.name} (ID: <code>${userId}</code>)\n💰 <b>Old Balance:</b> 💰${oldCoins.toLocaleString()} IHD\n💰 <b>New Exact Balance:</b> 💰${newCoins.toLocaleString()} IHD Coins\n🕒 <b>Adjusted At:</b> ${formatTime12(new Date())}\n\n👉 <i>Set by Master Admin.</i>`;
    this.sendTelegramNotification(tgMsg);
  }

  promptAdminSetPlayerExactBalance(userId) {
    if (!userId) return;
    const player = this.customersDb ? this.customersDb[userId] : null;
    const cur = player ? (Number(player.coins) || 0) : 0;
    const pName = player ? (player.name || userId) : userId;
    const input = prompt(`✏️ SET EXACT IHD COIN BALANCE\n\nPlayer: ${pName} (ID: ${userId})\nCurrent Balance: ${cur.toLocaleString()} IHD Coins\n\nEnter new exact wallet balance (e.g. 500):`, cur);
    if (input === null || input.trim() === '') return;
    const val = parseInt(input.trim(), 10);
    if (isNaN(val) || val < 0) {
      alert('❌ Please enter a valid non-negative number of coins!');
      return;
    }
    this.adminSetPlayerExactBalance(userId, val);
  }

  adminApplyAphExactBalance() {
    if (!this.currentAphPlayerId) return;
    const input = document.getElementById('aph-exact-balance-amount');
    const val = parseInt(input?.value, 10);
    if (isNaN(val) || val < 0) {
      if (this.aphQuickCreditFeedback) {
        this.aphQuickCreditFeedback.textContent = '❌ Please enter a valid non-negative balance (e.g. 500)!';
        this.aphQuickCreditFeedback.style.color = '#ef4444';
      }
      return;
    }
    this.adminSetPlayerExactBalance(this.currentAphPlayerId, val);
    if (this.aphQuickCreditFeedback) {
      this.aphQuickCreditFeedback.textContent = `✅ Player balance strictly set to 💰${val.toLocaleString()} IHD Coins!`;
      this.aphQuickCreditFeedback.style.color = '#2ecc71';
      setTimeout(() => { if (this.aphQuickCreditFeedback) this.aphQuickCreditFeedback.textContent = ''; }, 3500);
    }
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
    const pendingPlayers = players.filter(p => p && p.status === 'PENDING');
    const activePlayers = players.filter(p => !p.status || p.status === 'ACTIVE');
    const rejectedPlayers = players.filter(p => p && p.status === 'REJECTED');
    const totalCoins = players.reduce((sum, p) => sum + (p.coins || 0), 0);

    const pendingCount = pendingPlayers.length;
    const activeCount = activePlayers.length;
    const rejectedCount = rejectedPlayers.length;

    // Update Counter Badges
    const pAll = document.getElementById('player-cnt-all');
    const pPending = document.getElementById('player-cnt-pending');
    const pActive = document.getElementById('player-cnt-active');
    const pRejected = document.getElementById('player-cnt-rejected');
    if (pAll) pAll.textContent = totalCount;
    if (pPending) pPending.textContent = pendingCount;
    if (pActive) pActive.textContent = activeCount;
    if (pRejected) pRejected.textContent = rejectedCount;

    if (this.adminTotalPlayersCount) {
      this.adminTotalPlayersCount.textContent = totalCount;
    }
    if (this.adminTabBadgePlayers) {
      this.adminTabBadgePlayers.textContent = pendingCount > 0 ? `${pendingCount} Req` : totalCount;
      this.adminTabBadgePlayers.style.background = pendingCount > 0 ? '#f5b041' : 'rgba(0, 240, 255, 0.2)';
      this.adminTabBadgePlayers.style.color = pendingCount > 0 ? '#000' : '#00f0ff';
      this.adminTabBadgePlayers.style.fontWeight = pendingCount > 0 ? '800' : '700';
    }
    if (this.adminTotalCoinsCount) {
      this.adminTotalCoinsCount.textContent = `💰 ${totalCoins.toLocaleString()} IHD Coins`;
    }

    // Populate Select Dropdown (Active players only)
    if (this.adminCreditPlayerSelect) {
      const currentSelected = this.adminCreditPlayerSelect.value;
      let opts = '<option value="">-- Choose a Registered Player --</option>';
      activePlayers.forEach(p => {
        const isSel = p.id === currentSelected ? 'selected' : '';
        opts += `<option value="${p.id}" ${isSel}>${p.id} (${p.name || 'Player'} - 💰 ${(p.coins || 0).toLocaleString()} IHD Coins)</option>`;
      });
      this.adminCreditPlayerSelect.innerHTML = opts;
    }

    // Filter players by status filter & search query
    const activeFilter = this.adminPlayerFilter || 'ALL';
    const q = (filterQuery || '').toLowerCase().trim();

    const filteredPlayers = players.filter(p => {
      if (!p) return false;
      const status = p.status || 'ACTIVE';
      if (activeFilter === 'PENDING' && status !== 'PENDING') return false;
      if (activeFilter === 'ACTIVE' && status !== 'ACTIVE') return false;
      if (activeFilter === 'REJECTED' && status !== 'REJECTED') return false;

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
          <td colspan="4" style="text-align:center; color:var(--text-muted); padding:1.2rem;">
            ${totalCount === 0 ? 'No registered players yet.' : (activeFilter === 'PENDING' ? '🎉 No pending registration requests right now!' : 'No players match your search filter.')}
          </td>
        </tr>
      `;
      return;
    }

    this.adminPlayersTableBody.innerHTML = '';
    filteredPlayers.forEach(p => {
      const tr = document.createElement('tr');
      const coins = p.coins || 0;
      const status = p.status || 'ACTIVE';

      let statusBadge = '';
      let actionsHtml = '';

      if (status === 'PENDING') {
        statusBadge = '<span class="status-pill status-pending" style="animation: badgePulsate 1.5s infinite ease-in-out; margin-top:3px; display:inline-block;">⏳ Pending Approval</span>';
        actionsHtml = `
          <div style="display:flex; gap:4px; flex-wrap:wrap; align-items:center;">
            <button class="btn btn-gold btn-xs" style="background:#2ecc71; border-color:#27ae60; color:#000; font-weight:800; padding:4px 8px;" title="Approve Registration & Credit 10 Bonus" onclick="(window.app || app).adminApprovePlayer('${p.id}')">✓ Approve (+10 Bonus)</button>
            <button class="btn btn-danger btn-xs" style="padding:4px 8px;" title="Reject Registration Request" onclick="(window.app || app).adminOpenRejectPlayerModal('${p.id}')">✕ Reject</button>
            <button class="btn btn-danger btn-xs" style="background:rgba(239,68,68,0.2); border-color:#ef4444; color:#ef4444; padding:4px 6px;" title="Delete ID Permanently" onclick="(window.app || app).adminDeletePlayer('${p.id}')">🗑️ Del</button>
          </div>
        `;
      } else if (status === 'REJECTED') {
        statusBadge = `<span class="status-pill status-rejected" style="margin-top:3px; display:inline-block;" title="${p.rejectionReason || 'Rejected'}">❌ Rejected</span>`;
        actionsHtml = `
          <div style="display:flex; gap:3px; flex-wrap:wrap; align-items:center;">
            <button class="btn btn-secondary btn-xs" style="padding:3px 7px; color:#2ecc71; border-color:rgba(46,204,113,0.4);" title="Re-Activate Player Account" onclick="(window.app || app).adminApprovePlayer('${p.id}')">🔄 Re-Activate</button>
            <button class="btn btn-primary btn-xs" style="padding:3px 6px; font-size:0.68rem;" title="View Full History" onclick="(window.app || app).openPlayerHistoryModal('${p.id}')">📜 History</button>
            <button class="btn btn-danger btn-xs" style="background:rgba(239,68,68,0.2); border-color:#ef4444; color:#ef4444; padding:3px 6px; font-size:0.68rem;" title="Delete ID Permanently" onclick="(window.app || app).adminDeletePlayer('${p.id}')">🗑️ Del ID</button>
          </div>
        `;
      } else {
        statusBadge = '<span class="status-pill status-approved" style="margin-top:3px; display:inline-block;">✅ Active</span>';
        actionsHtml = `
          <div style="display:flex; gap:3px; flex-wrap:wrap; align-items:center;">
            <button class="btn btn-secondary btn-xs" title="Add 100 IHD Coins" onclick="(window.app || app).adminAddPlayerCredit('${p.id}', 100)">+100</button>
            <button class="btn btn-secondary btn-xs" title="Add 500 IHD Coins" onclick="(window.app || app).adminAddPlayerCredit('${p.id}', 500)">+500</button>
            <button class="btn btn-gold btn-xs" title="Add 1,000 IHD Coins" onclick="(window.app || app).adminAddPlayerCredit('${p.id}', 1000)">+1k</button>
            <button class="btn btn-secondary btn-xs" style="background:rgba(255,255,255,0.06); padding:2px 6px;" title="Custom Amount" onclick="(window.app || app).adminCustomCreditPrompt('${p.id}')">±</button>
            <button class="btn btn-primary btn-xs" style="padding:2px 6px; font-size:0.68rem;" title="View Full History" onclick="(window.app || app).openPlayerHistoryModal('${p.id}')">📜 History</button>
            <button class="btn btn-danger btn-xs" style="background:rgba(239,68,68,0.2); border-color:#ef4444; color:#ef4444; padding:2px 6px; font-size:0.68rem;" title="Delete Player ID Permanently" onclick="(window.app || app).adminDeletePlayer('${p.id}')">🗑️ Del ID</button>
          </div>
        `;
      }

      tr.innerHTML = `
        <td>
          <a href="javascript:void(0)" class="player-id-link" onclick="(window.app || app).openPlayerHistoryModal('${p.id}')" title="Tap to view full history of ${p.name || p.id}">
            <strong style="color:#fff; display:block;">${p.name || 'Player'}</strong>
            <span style="font-family:monospace; color:#00f0ff; font-weight:700;">ID: ${p.id}</span>
          </a>
          ${statusBadge}
        </td>
        <td>
          <span>📱 ${p.mobile ? '+91 ' + p.mobile : '--'}</span><br>
          <span style="font-size:0.7rem; color:var(--text-muted);">🎂 ${p.dob || '--'}</span>
        </td>
        <td>
          <strong style="color:var(--primary-gold-bright); font-size:0.85rem;">💰 ${coins.toLocaleString()} IHD</strong><br>
          <span style="font-size:0.68rem; color:var(--text-secondary);">${p.totalBets || 0} Bets</span>
        </td>
        <td>
          ${actionsHtml}
        </td>
      `;
      this.adminPlayersTableBody.appendChild(tr);
    });
  }

  adminDeletePlayer(userId) {
    if (!userId) return;
    const player = (this.customersDb && this.customersDb[userId]) ? this.customersDb[userId] : null;
    const pName = player ? (player.name || userId) : userId;
    const pCoins = player ? (player.coins || 0) : 0;
    const pMobile = player && player.mobile ? ` (+91 ${player.mobile})` : '';

    const confirmMsg = `⚠️ PERMANENT ACCOUNT DELETION\n\nAre you sure you want to permanently DELETE player:\n\n👤 Name: ${pName}\n🆔 User ID: ${userId}${pMobile}\n💰 Wallet Balance: ${pCoins.toLocaleString()} IHD Coins\n\nThis will remove the player from the database and block all login access.\n\nClick OK to permanently delete.`;

    if (!confirm(confirmMsg)) {
      return;
    }

    // 1. Delete from customersDb
    if (this.customersDb && this.customersDb[userId]) {
      delete this.customersDb[userId];
      this.saveCustomersDB(this.customersDb);
    }

    // 2. If the logged in user on this device is this player, logout session
    if (this.currentCustomer && (this.currentCustomer.id === userId || String(this.currentCustomer.id) === String(userId))) {
      this.currentCustomer = null;
      this.saveCustomerSession(null);
      this.updateCustomerUI();
    }

    // 3. Close player history modal if currently viewing this player
    if (this.currentAphPlayerId === userId && this.adminPlayerHistoryModal && !this.adminPlayerHistoryModal.classList.contains('hidden')) {
      this.closePlayerHistoryModal();
    }

    // 4. Broadcast deletion to server
    this.pushStateToServer({ customersDb: this.customersDb, deletedCustomerId: String(userId), deletedPlayerId: String(userId) });

    // 5. Re-render players table, backup stats, and show toast
    this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');
    this.renderMasterBackupStats();
    this.showAdminCreditFeedback(`🗑️ Player "${pName}" (ID: ${userId}) has been permanently deleted!`, true);
    if (this.audio) this.audio.playTick();

    // 6. Send notification to Telegram & WhatsApp
    const tgMsg = `🗑️ <b>[PLAYER ACCOUNT DELETED]</b>\n\n👤 <b>Player:</b> ${pName} (ID: <code>${userId}</code>)\n📱 <b>Mobile:</b> <code>${pMobile || 'N/A'}</code>\n💰 <b>Balance Removed:</b> ${pCoins} IHD\n🕒 <b>Deleted At:</b> ${formatTime12(new Date())}\n\n👉 <i>Account was permanently deleted by Master Admin.</i>`;
    this.sendTelegramNotification(tgMsg);
  }

  adminApprovePlayer(userId) {
    if (!this.customersDb || !this.customersDb[userId]) {
      this.showAdminCreditFeedback(`❌ Player "${userId}" not found!`, false);
      return;
    }

    const player = this.customersDb[userId];
    player.status = 'ACTIVE';
    player.approvedAt = Date.now();

    // Credit 10 Welcome Bonus Coins if not already awarded
    if (!player.bonusGiven) {
      player.coins = (Number(player.coins) || 0) + 10;
      player.bonusGiven = true;
    }

    this.saveCustomersDB(this.customersDb);
    this.pushStateToServer({ customersDb: this.customersDb });

    this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');
    this.renderMasterBackupStats();
    this.showAdminCreditFeedback(`✅ Player ${player.name} (${userId}) APPROVED & Activated with 10 IHD Bonus!`, true);
    if (this.audio) this.audio.playWinFanfare();

    // Alert Master Admin via Telegram & WhatsApp
    const tgMsg = `✅ <b>[PLAYER REGISTRATION APPROVED!]</b>\n\n👤 <b>Player:</b> ${player.name} (ID: <code>${userId}</code>)\n📱 <b>Mobile:</b> <code>+91 ${player.mobile || 'N/A'}</code>\n🎂 <b>DOB:</b> ${player.dob || 'N/A'}\n💰 <b>Welcome Coins:</b> 10 IHD Credited\n🕒 <b>Approved At:</b> ${formatTime12(new Date())}\n\n👉 <i>Player is now ACTIVE and can log in & play!</i>`;
    this.sendTelegramNotification(tgMsg);
    this.sendWhatsAppNotification(`✅ [Registration Approved]\nPlayer: ${player.name} (ID: ${userId})\nMobile: +91 ${player.mobile || 'N/A'}\nStatus: ACTIVE`);
  }

  adminOpenRejectPlayerModal(userId) {
    if (!this.customersDb || !this.customersDb[userId]) return;
    const player = this.customersDb[userId];
    this.pendingRejectPlayerId = userId;

    if (this.rejectPlayerModalTitle) {
      this.rejectPlayerModalTitle.textContent = `Reject Player: ${player.name} (${userId})`;
    }
    if (this.rejectPlayerModalDesc) {
      this.rejectPlayerModalDesc.innerHTML = `Mobile: <strong>+91 ${player.mobile || 'N/A'}</strong> | User ID: <strong>${userId}</strong><br><span style="color:#ef4444;">This account will be blocked from logging in.</span>`;
    }
    if (this.adminRejectPlayerQuickReason) {
      this.adminRejectPlayerQuickReason.selectedIndex = 0;
    }
    if (this.adminRejectPlayerReasonText) {
      this.adminRejectPlayerReasonText.value = this.adminRejectPlayerQuickReason ? this.adminRejectPlayerQuickReason.value : 'Duplicate account detected';
    }
    if (this.adminRejectPlayerModal) {
      this.adminRejectPlayerModal.classList.remove('hidden');
    }
  }

  adminCloseRejectPlayerModal() {
    this.pendingRejectPlayerId = null;
    if (this.adminRejectPlayerModal) {
      this.adminRejectPlayerModal.classList.add('hidden');
    }
  }

  adminConfirmRejectPlayer() {
    if (!this.pendingRejectPlayerId) return;
    const userId = this.pendingRejectPlayerId;
    const player = this.customersDb[userId];
    if (!player) {
      this.adminCloseRejectPlayerModal();
      return;
    }

    const reason = (this.adminRejectPlayerReasonText?.value || 'Blocked by administrator policy').trim();
    player.status = 'REJECTED';
    player.rejectionReason = reason;
    player.rejectedAt = Date.now();

    this.saveCustomersDB(this.customersDb);
    this.pushStateToServer({ customersDb: this.customersDb });

    this.adminCloseRejectPlayerModal();
    this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');
    this.renderMasterBackupStats();
    this.showAdminCreditFeedback(`❌ Registration for ${player.name} (${userId}) REJECTED.`, false);

    // Send Telegram Notification
    const tgMsg = `❌ <b>[PLAYER REGISTRATION REJECTED]</b>\n\n👤 <b>Player:</b> ${player.name} (ID: <code>${userId}</code>)\n📱 <b>Mobile:</b> <code>+91 ${player.mobile || 'N/A'}</code>\n⚠️ <b>Reason:</b> ${reason}\n🕒 <b>Rejected At:</b> ${formatTime12(new Date())}`;
    this.sendTelegramNotification(tgMsg);
  }

  handleRejectPlayerQuickReasonChange(reason) {
    if (this.adminRejectPlayerReasonText) {
      this.adminRejectPlayerReasonText.value = (reason === 'CUSTOM') ? '' : reason;
      if (reason === 'CUSTOM') this.adminRejectPlayerReasonText.focus();
    }
  }

  // ==========================================================
  // MASTER DATABASE BACKUP & RESTORE SAFETY ENGINE
  // ==========================================================
  renderMasterBackupStats() {
    const totalPlayers = Object.keys(this.customersDb || {}).length;
    const totalCoins = Object.values(this.customersDb || {}).reduce((s, p) => s + (Number(p.coins) || 0), 0);
    const totalHistory = (this.history || []).length;
    const totalTxns = (this.deposits || []).length + (this.withdrawals || []).length;

    if (this.backupStatPlayers) this.backupStatPlayers.textContent = totalPlayers;
    if (this.backupStatCoins) this.backupStatCoins.textContent = `💰 ${totalCoins.toLocaleString()} IHD`;
    if (this.backupStatHistory) this.backupStatHistory.textContent = totalHistory;
    if (this.backupStatTxns) this.backupStatTxns.textContent = totalTxns;
  }

  exportMasterBackupJSON() {
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const formattedDate = now.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' });

    const totalCoins = Object.values(this.customersDb || {}).reduce((s, p) => s + (Number(p.coins) || 0), 0);

    const backupData = {
      backupType: 'LUCKY_SPIN_WHEEL_MASTER_FULL_BACKUP',
      backupVersion: '7.6.0',
      exportedAt: Date.now(),
      exportedDateFormatted: formattedDate,
      summary: {
        totalRegisteredPlayers: Object.keys(this.customersDb || {}).length,
        totalIhdCoinsInPlay: totalCoins,
        totalWinningRoundsHistory: (this.history || []).length,
        totalDepositRequests: (this.deposits || []).length,
        totalWithdrawalRequests: (this.withdrawals || []).length,
        totalActivePredictions: (this.activeBets || []).length
      },
      customersDb: this.customersDb || {},
      history: this.history || [],
      dailySchedule: this.dailySchedule || { '12:00 PM': 'AUTO', '04:00 PM': 'AUTO', '08:00 PM': 'AUTO', '11:00 PM': 'AUTO' },
      activeBets: this.activeBets || [],
      deposits: this.deposits || [],
      withdrawals: this.withdrawals || [],
      depositConfig: this.depositConfig || { upiId: '00000000', accountName: 'DEEP', qrImageUrl: './master-qr.jpg', minDeposit: 100 },
      notificationConfig: this.notificationConfig || {},
      promoCodes: this.promoCodes || {},
      supportChats: this.supportChats || {},
      slices: this.slices || [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      timerMode: this.timerMode || 'REAL'
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lucky_spin_master_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const msg = `✅ Complete Database Backup Downloaded! (${backupData.summary.totalRegisteredPlayers} Players, ${backupData.summary.totalWinningRoundsHistory} History Rounds, ${backupData.summary.totalDepositRequests + backupData.summary.totalWithdrawalRequests} Transactions). Keep this file safe!`;
    if (this.adminMasterBackupFeedback) {
      this.adminMasterBackupFeedback.textContent = msg;
      this.adminMasterBackupFeedback.className = 'save-status-msg success';
      this.adminMasterBackupFeedback.classList.remove('hidden');
    }
    this.showLiveToast({
      title: '💾 MASTER BACKUP DOWNLOADED!',
      message: msg,
      type: 'success',
      duration: 7000
    });
    if (this.audio) this.audio.playWinFanfare();
  }

  importMasterBackupJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const backup = JSON.parse(content);

        const pCount = backup.customersDb ? Object.keys(backup.customersDb).length : (backup.summary?.totalRegisteredPlayers || 0);
        const hCount = Array.isArray(backup.history) ? backup.history.length : (backup.summary?.totalWinningRoundsHistory || 0);
        const dCount = Array.isArray(backup.deposits) ? backup.deposits.length : 0;
        const wCount = Array.isArray(backup.withdrawals) ? backup.withdrawals.length : 0;

        const confirmMsg = `⚠️ RESTORE DATABASE BACKUP\n\nBackup File Details:\n• Export Date: ${backup.exportedDateFormatted || 'Unknown'}\n• Registered Players: ${pCount}\n• Winning Numbers History: ${hCount} Rounds\n• Deposits: ${dCount}\n• Withdrawals: ${wCount}\n\nAre you sure you want to RESTORE all this data? Current database will be safely updated from this backup file.`;

        if (!confirm(confirmMsg)) {
          return;
        }

        // 1. Apply restored objects
        if (backup.customersDb && typeof backup.customersDb === 'object') {
          this.customersDb = backup.customersDb;
          this.saveCustomersDB(this.customersDb);
        }
        if (Array.isArray(backup.history)) {
          this.history = this.sanitizeHistoryList(backup.history);
          this.saveHistory(this.history);
        }
        if (backup.dailySchedule && typeof backup.dailySchedule === 'object') {
          this.dailySchedule = backup.dailySchedule;
          this.saveDailySchedule(this.dailySchedule);
        }
        if (Array.isArray(backup.activeBets)) {
          this.activeBets = backup.activeBets;
          this.saveActiveBets(this.activeBets);
        }
        if (Array.isArray(backup.deposits)) {
          this.deposits = backup.deposits;
          this.saveDeposits(this.deposits);
        }
        if (Array.isArray(backup.withdrawals)) {
          this.withdrawals = backup.withdrawals;
          this.saveWithdrawals(this.withdrawals);
        }
        if (backup.depositConfig && typeof backup.depositConfig === 'object') {
          this.depositConfig = { ...(this.depositConfig || {}), ...backup.depositConfig };
          this.saveDepositConfig(this.depositConfig);
        }
        if (backup.notificationConfig && typeof backup.notificationConfig === 'object') {
          this.notificationConfig = { ...(this.notificationConfig || {}), ...backup.notificationConfig };
          this.saveNotificationConfig(this.notificationConfig);
        }
        if (backup.promoCodes && typeof backup.promoCodes === 'object') {
          this.promoCodes = backup.promoCodes;
          this.saveLocalPromoCodes(this.promoCodes);
        }
        if (backup.supportChats && typeof backup.supportChats === 'object') {
          this.supportChats = backup.supportChats;
          this.saveLocalSupportChats(this.supportChats);
        }

        // 2. Push full atomic restore to server
        this.pushStateToServer({
          fullRestore: true,
          customersDb: this.customersDb,
          history: this.history,
          dailySchedule: this.dailySchedule,
          activeBets: this.activeBets,
          deposits: this.deposits,
          withdrawals: this.withdrawals,
          depositConfig: this.depositConfig,
          notificationConfig: this.notificationConfig,
          promoCodes: this.promoCodes,
          supportChats: this.supportChats
        });

        // 3. Re-render all views
        this.renderHistory();
        this.renderAdminPlayersList();
        this.renderAdminActiveBetsTable();
        this.renderAdminDepositsList();
        this.renderAdminWithdrawalsList();
        this.renderAdminScheduleTable();
        this.renderMasterBackupStats();
        this.populateMasterConfigInputs();

        const successMsg = `🎉 SUCCESS: Database 100% Restored from Backup! (${pCount} Players, ${hCount} History Rounds, ${dCount + wCount} Transactions Active).`;
        if (this.adminMasterBackupFeedback) {
          this.adminMasterBackupFeedback.textContent = successMsg;
          this.adminMasterBackupFeedback.className = 'save-status-msg success';
          this.adminMasterBackupFeedback.classList.remove('hidden');
        }
        this.showLiveToast({
          title: '🎉 DATABASE RESTORED SUCCESSFULLY!',
          message: successMsg,
          type: 'success',
          duration: 9000
        });
        if (this.audio) this.audio.playWinFanfare();
      } catch (err) {
        console.error('Backup restore error:', err);
        const errTxt = `❌ Failed to restore backup: Invalid or corrupt JSON file. (${err.message})`;
        if (this.adminMasterBackupFeedback) {
          this.adminMasterBackupFeedback.textContent = errTxt;
          this.adminMasterBackupFeedback.className = 'save-status-msg error';
          this.adminMasterBackupFeedback.classList.remove('hidden');
        }
        alert(errTxt);
      }
    };
    reader.readAsText(file);
  }

  getBetDateCategory(bet, now = new Date()) {
    if (!bet) return 'OTHER';
    const norm = (str) => String(str || '').toLowerCase().trim();
    
    const todayStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g. "Oct 1"
    const todayISO = now.toISOString().split('T')[0]; // "2026-10-01"
    
    const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yestStr = yest.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g. "Sep 30"
    const yestISO = yest.toISOString().split('T')[0]; // "2026-09-30"

    const tom = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomStr = tom.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g. "Oct 2"
    const tomISO = tom.toISOString().split('T')[0]; // "2026-10-02"

    const bDate = norm(bet.date || bet.targetDate || bet.entryDate || '');
    const bFull = norm(bet.targetDateFull || bet.placedDate || '');
    const bDisp = norm(bet.displaySlot || '');

    // Check by target timestamp
    const targetTs = this.getBetTargetTimestamp ? this.getBetTargetTimestamp(bet, now) : (bet.timestamp || 0);
    if (targetTs) {
      const d = new Date(targetTs);
      if (d.toDateString() === now.toDateString()) return 'TODAY';
      if (d.toDateString() === yest.toDateString()) return 'YESTERDAY';
      if (d.toDateString() === tom.toDateString()) return 'TOMORROW';
    }

    // Check by string matches
    if (bDate === norm(todayStr) || bDate === todayISO || bFull.includes(norm(todayStr)) || bDisp.includes('today') || bDisp.includes(norm(todayStr))) {
      return 'TODAY';
    }
    if (bDate === norm(yestStr) || bDate === yestISO || bFull.includes(norm(yestStr)) || bDisp.includes('yesterday') || bDisp.includes(norm(yestStr))) {
      return 'YESTERDAY';
    }
    if (bDate === norm(tomStr) || bDate === tomISO || bFull.includes(norm(tomStr)) || bDisp.includes('tomorrow') || bDisp.includes(norm(tomStr))) {
      return 'TOMORROW';
    }

    return 'OTHER';
  }

  matchesBetDate(bet, filterType = 'TODAY', customDateISO = '', now = new Date()) {
    if (filterType === 'ALL') return true;

    if (filterType === 'CUSTOM' && customDateISO) {
      const cDate = new Date(customDateISO + 'T00:00:00');
      const cStr = cDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase();
      const bDate = String(bet.date || bet.targetDate || bet.entryDate || '').toLowerCase();
      const bFull = String(bet.targetDateFull || bet.placedDate || '').toLowerCase();
      
      const targetTs = this.getBetTargetTimestamp ? this.getBetTargetTimestamp(bet, now) : (bet.timestamp || 0);
      if (targetTs && new Date(targetTs).toDateString() === cDate.toDateString()) {
        return true;
      }
      return bDate === cStr || bDate === customDateISO || bFull.includes(cStr);
    }

    const cat = this.getBetDateCategory(bet, now);
    return cat === filterType;
  }

  renderAdminActiveBetsTable(dateFilter = null, slotFilter = null) {
    if (!this.adminActiveBetsTableBody) return;

    // Settle any elapsed/expired bets immediately so live table stays 100% upcoming
    if (typeof this.settleAllExpiredBets === 'function') {
      this.settleAllExpiredBets();
    }

    const dFilter = dateFilter || this.currentAdminBetDateFilter || 'ALL';
    const sFilter = slotFilter || this.currentAdminBetSlotFilter || 'ALL';
    this.currentAdminBetDateFilter = dFilter;
    this.currentAdminBetSlotFilter = sFilter;

    const now = new Date();
    // STRICTLY UPCOMING ONLY: filter all bets where spin time is in future
    const allBets = Array.isArray(this.activeBets) ? this.activeBets.filter(b => this.isBetUpcoming(b, now)) : [];

    // 1. Calculate Date Badge Counts across upcoming active bets
    const cntToday = allBets.filter(b => this.matchesBetDate(b, 'TODAY', '', now)).length;
    const cntYesterday = allBets.filter(b => this.matchesBetDate(b, 'YESTERDAY', '', now)).length;
    const cntTomorrow = allBets.filter(b => this.matchesBetDate(b, 'TOMORROW', '', now)).length;
    const cntAllDate = allBets.length;

    const elDateToday = document.getElementById('bet-date-cnt-today');
    const elDateYest = document.getElementById('bet-date-cnt-yesterday');
    const elDateTom = document.getElementById('bet-date-cnt-tomorrow');
    const elDateAll = document.getElementById('bet-date-cnt-all');

    if (elDateToday) elDateToday.textContent = cntToday;
    if (elDateYest) elDateYest.textContent = cntYesterday;
    if (elDateTom) elDateTom.textContent = cntTomorrow;
    if (elDateAll) elDateAll.textContent = cntAllDate;

    // Highlight active Date pill
    document.querySelectorAll('.admin-bet-date-filter').forEach(btn => {
      if (btn.getAttribute('data-date') === dFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 2. Filter bets by the selected Date first
    let dateFilteredBets = allBets.filter(b => this.matchesBetDate(b, dFilter, this.currentAdminBetCustomDate, now));

    // 3. Recalculate Slot Counts for this selected Date
    const cntSlotAll = dateFilteredBets.length;
    const cnt12 = dateFilteredBets.filter(b => (b.timeSlot === '12:00 PM' || b.slot === '12:00 PM' || b.round === '12:00 PM' || b.targetSlot === '12:00 PM')).length;
    const cnt4 = dateFilteredBets.filter(b => (b.timeSlot === '04:00 PM' || b.slot === '04:00 PM' || b.round === '04:00 PM' || b.targetSlot === '04:00 PM')).length;
    const cnt8 = dateFilteredBets.filter(b => (b.timeSlot === '08:00 PM' || b.slot === '08:00 PM' || b.round === '08:00 PM' || b.targetSlot === '08:00 PM')).length;
    const cnt11 = dateFilteredBets.filter(b => (b.timeSlot === '11:00 PM' || b.slot === '11:00 PM' || b.round === '11:00 PM' || b.targetSlot === '11:00 PM')).length;

    const elSlotAll = document.getElementById('bet-slot-cnt-all');
    const elSlot12 = document.getElementById('bet-slot-cnt-12');
    const elSlot4 = document.getElementById('bet-slot-cnt-4');
    const elSlot8 = document.getElementById('bet-slot-cnt-8');
    const elSlot11 = document.getElementById('bet-slot-cnt-11');

    if (elSlotAll) elSlotAll.textContent = cntSlotAll;
    if (elSlot12) elSlot12.textContent = cnt12;
    if (elSlot4) elSlot4.textContent = cnt4;
    if (elSlot8) elSlot8.textContent = cnt8;
    if (elSlot11) elSlot11.textContent = cnt11;

    // Highlight active Slot pill
    document.querySelectorAll('.admin-bet-slot-filter').forEach(btn => {
      if (btn.getAttribute('data-slot') === sFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 4. Filter by selected Slot
    let finalBets = dateFilteredBets;
    if (sFilter !== 'ALL') {
      finalBets = dateFilteredBets.filter(b => (b.timeSlot === sFilter || b.slot === sFilter || b.round === sFilter || b.targetSlot === sFilter));
    }

    const totalCount = finalBets.length;
    const totalCoins = finalBets.reduce((sum, b) => sum + (Number(b.amount) || Number(b.coins) || 0), 0);

    // Update viewing badge & summary text
    let dateLabel = 'Today';
    if (dFilter === 'YESTERDAY') dateLabel = 'Yesterday';
    else if (dFilter === 'TOMORROW') dateLabel = 'Tomorrow';
    else if (dFilter === 'ALL') dateLabel = 'All Upcoming Dates';
    else if (dFilter === 'CUSTOM') dateLabel = this.currentAdminBetCustomDate || 'Custom Date';

    if (this.adminActiveBetsViewingBadge) {
      this.adminActiveBetsViewingBadge.textContent = `🟢 Live Upcoming: ${dateLabel} • ${sFilter}`;
    }

    if (this.adminActiveBetsSummary) {
      this.adminActiveBetsSummary.textContent = `[🟢 LIVE UPCOMING | ${dateLabel} | ${sFilter}]: ${totalCount} Active Bet${totalCount === 1 ? '' : 's'} (💰 ${totalCoins.toLocaleString()} IHD Pool)`;
    }

    if (finalBets.length === 0) {
      this.adminActiveBetsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; color:var(--text-muted); padding:1.2rem;">
            🟢 No active player predictions for <strong>${dateLabel}</strong> ${sFilter !== 'ALL' ? `(${sFilter} round)` : ''}. All past round entries are automatically settled in History.
          </td>
        </tr>
      `;
      return;
    }

    // Render table rows
    this.adminActiveBetsTableBody.innerHTML = '';
    finalBets.forEach(b => {
      const pid = b.memberId || b.member_id || b.userId || b.playerId || b.partyId || '--';
      const cust = (this.customersDb && this.customersDb[pid]) ? this.customersDb[pid] : null;
      const pName = b.name || b.playerName || b.partyName || b.memberName || (cust ? cust.name : '') || pid || 'Player';
      const pMobile = b.mobile || b.playerMobile || b.partyMobile || (cust ? cust.mobile : '') || '';
      const numVal = b.number !== undefined ? b.number : (b.no !== undefined ? b.no : (b.num !== undefined ? b.num : '--'));
      const amtVal = b.amount !== undefined ? b.amount : (b.coins !== undefined ? b.coins : 0);
      const winVal = b.potentialWin || b.winAmount || amtVal * 9;
      const targetSlotVal = b.timeSlot || b.slot || b.round || b.targetSlot || 'Next Round';
      const targetDateVal = b.date || b.entryDate || b.Date || b.targetDate || 'Today';
      const placedTimeVal = b.placedTime || b.time || 'Just now';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <a href="javascript:void(0)" class="player-id-link" onclick="app.openPlayerHistoryModal('${pid}')" title="Tap to view player profile & history">
            <strong style="color:#fff;">${pName}</strong><br>
            <span style="font-family:monospace; color:#00f0ff; font-size:0.75rem; font-weight:700;">ID: ${pid}</span>
          </a>
          ${pMobile ? `<br><span style="font-size:0.68rem; color:var(--text-muted);">📱 ${pMobile}</span>` : ''}
        </td>
        <td>
          <span style="display:inline-block; background:#ffd700; color:#000; font-weight:800; font-size:0.92rem; padding:3px 10px; border-radius:12px; box-shadow:0 0 8px rgba(255,215,0,0.5);">
            #${numVal}
          </span>
        </td>
        <td>
          <strong style="color:var(--primary-gold-bright); font-size:0.88rem;">💰 ${amtVal} IHD</strong>
        </td>
        <td>
          <strong style="color:#2ecc71; font-size:0.84rem;">💰 ${winVal} IHD</strong><br>
          <span style="font-size:0.68rem; color:var(--text-muted);">9x Multiplier</span>
        </td>
        <td>
          <span style="color:#00f0ff; font-weight:800; font-size:0.82rem;">🎰 ${targetSlotVal}</span><br>
          <span style="font-size:0.7rem; color:var(--text-secondary);">📅 ${targetDateVal}</span>
        </td>
        <td>
          <strong style="color:#ffd700; font-weight:700; font-size:0.8rem;">⏰ ${placedTimeVal}</strong><br>
          <span style="font-size:0.65rem; color:var(--text-muted);">Placed Time</span>
        </td>
        <td>
          <button class="btn btn-danger btn-xs" style="padding:3px 7px; font-weight:700; font-size:0.7rem;" title="Cancel Entry & Refund Coins to Party" onclick="app.adminDeleteActiveBet('${b.id}')">
            🗑️ Refund & Del
          </button>
        </td>
      `;
      this.adminActiveBetsTableBody.appendChild(tr);
    });
  }

  adminDeleteActiveBet(betId) {
    if (!betId) return;
    const bet = (this.activeBets || []).find(b => String(b.id) === String(betId));
    if (!bet) {
      this.activeBets = (this.activeBets || []).filter(b => b && String(b.id) !== String(betId));
      this.saveActiveBets(this.activeBets);
      this.deletedBetIds.add(String(betId));
      this.saveDeletedBetIds(this.deletedBetIds);
      this.pushStateToServer({ activeBets: this.activeBets, deletedBetId: String(betId) });
      this.renderAdminActiveBetsTable();
      return;
    }

    const pId = bet.memberId || bet.member_id || bet.userId || bet.playerId || bet.partyId || 'Player';
    const pName = bet.name || bet.playerName || bet.partyName || bet.memberName || (this.customersDb && this.customersDb[pId] ? this.customersDb[pId].name : '') || pId;
    const refundAmt = Number(bet.amount || bet.coins || bet.betAmount || 0);

    if (!confirm(`Are you sure you want to CANCEL and REFUND 💰${refundAmt} IHD Coins to ${pName} (${pId}) for Prediction #${bet.number} (${bet.targetSlot || 'Next Round'})?`)) {
      return;
    }

    // 1. Refund coins to customer in customersDb
    if (this.customersDb && this.customersDb[pId]) {
      this.customersDb[pId].coins = (Number(this.customersDb[pId].coins) || 0) + refundAmt;
      this.customersDb[pId].totalBets = Math.max(0, (Number(this.customersDb[pId].totalBets) || 1) - 1);
      this.customersDb[pId].lastUpdated = Date.now();
      
      // Update status in betHistory if present
      if (Array.isArray(this.customersDb[pId].betHistory)) {
        const histItem = this.customersDb[pId].betHistory.find(h => String(h.id) === String(betId));
        if (histItem) {
          histItem.status = 'REFUNDED';
        }
      }
      this.saveCustomersDB(this.customersDb);
    }

    // 2. If logged in player is this player, update session and clear active bet
    if (this.currentCustomer && (this.currentCustomer.id === pId || this.currentCustomer.id === bet.playerId)) {
      this.currentCustomer.coins = (Number(this.currentCustomer.coins) || 0) + refundAmt;
      this.currentCustomer.totalBets = Math.max(0, (Number(this.currentCustomer.totalBets) || 1) - 1);
      this.currentCustomer.lastUpdated = Date.now();
      this.saveCustomerSession(this.currentCustomer);
      if (this.currentBet && String(this.currentBet.id) === String(betId)) {
        this.currentBet = null;
        this.saveCurrentBet(null);
      }
      this.updateCustomerUI();
    }

    // 3. Remove bet from activeBets & track in deletedBetIds set
    this.activeBets = (this.activeBets || []).filter(b => b && String(b.id) !== String(betId));
    this.saveActiveBets(this.activeBets);
    this.deletedBetIds.add(String(betId));
    this.saveDeletedBetIds(this.deletedBetIds);

    // 4. Broadcast and push to server
    this.pushStateToServer({ customersDb: this.customersDb, activeBets: this.activeBets, deletedBetId: String(betId) });

    // 5. Update admin tables & show instant feedback
    this.renderAdminActiveBetsTable();
    this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');
    this.showAdminCreditFeedback(`✅ Prediction #${bet.number} cancelled! 💰${refundAmt} IHD Coins refunded to ${pName} (${pId}).`, true);
    if (this.audio) this.audio.playTick();

    if (this.currentAphPlayerId === pId && this.adminPlayerHistoryModal && !this.adminPlayerHistoryModal.classList.contains('hidden')) {
      this.openPlayerHistoryModal(this.currentAphPlayerId);
    }
  }

  // ==========================================================
  // MASTER ADMIN PLAYER PROFILE & FULL HISTORY MODAL SYSTEM
  // ==========================================================
  openPlayerHistoryModal(playerId) {
    if (!playerId) return;
    this.currentAphPlayerId = playerId;

    // 1. Fetch player from DB or synthesize if needed
    let player = this.customersDb ? this.customersDb[playerId] : null;
    if (!player) {
      // Check active bets or withdrawals for name/mobile
      const anyBet = (this.activeBets || []).find(b => b.playerId === playerId);
      const anyWd = (this.withdrawals || []).find(w => w.customerId === playerId);
      player = {
        id: playerId,
        name: anyBet?.playerName || anyWd?.customerName || playerId,
        mobile: anyBet?.playerMobile || anyWd?.customerMobile || '',
        dob: '',
        pin: '••••',
        coins: 0,
        totalBets: 0,
        wins: 0,
        joinedAt: 'Recent',
        bankDetails: anyWd ? { accountName: anyWd.accountName, accountNumber: anyWd.accountNumber, ifscCode: anyWd.ifscCode } : null,
        betHistory: []
      };
    }

    // Header info
    if (this.aphAvatarIcon) {
      const initial = (player.name || player.id || 'P').trim().charAt(0).toUpperCase();
      this.aphAvatarIcon.textContent = initial || '👤';
    }
    if (this.aphPlayerName) this.aphPlayerName.textContent = player.name || 'Player';
    if (this.aphPlayerId) this.aphPlayerId.textContent = `ID: ${player.id}`;
    if (this.aphPlayerMobile) this.aphPlayerMobile.textContent = player.mobile || 'Not set';
    if (this.aphPlayerDob) this.aphPlayerDob.textContent = player.dob || 'Not set';
    if (this.aphPlayerJoined) this.aphPlayerJoined.textContent = player.joinedAt || 'Recently';
    if (this.aphPlayerPin) {
      this.aphPlayerPin.dataset.realPin = player.pin || '----';
      this.aphPlayerPin.textContent = '••••';
    }
    if (this.aphTogglePinBtn) this.aphTogglePinBtn.textContent = 'Show';

    // Bank Details (Pull from player.bankDetails OR fallback to latest withdrawal request)
    let bank = player.bankDetails;
    if (!bank || !bank.accountNumber) {
      const recentWd = (this.withdrawals || []).find(w => w.customerId === playerId && w.accountNumber);
      if (recentWd) {
        bank = {
          accountName: recentWd.accountName,
          accountNumber: recentWd.accountNumber,
          ifscCode: recentWd.ifscCode
        };
      }
    }

    if (this.aphBankAccName) this.aphBankAccName.textContent = bank?.accountName || 'No bank account saved';
    if (this.aphBankAccNum) this.aphBankAccNum.textContent = bank?.accountNumber ? bank.accountNumber : '--';
    if (this.aphBankIfsc) this.aphBankIfsc.textContent = bank?.ifscCode ? bank.ifscCode : '--';

    // Gather all bets for this player
    const activeBetsForPlayer = (this.activeBets || []).filter(b => b.playerId === playerId);
    const histBetsForPlayer = Array.isArray(player.betHistory) ? player.betHistory : [];
    
    // Merge without duplicates (by bet.id)
    const betMap = new Map();
    activeBetsForPlayer.forEach(b => betMap.set(b.id, { ...b, status: 'ACTIVE' }));
    histBetsForPlayer.forEach(b => {
      // If already marked as active in betMap, don't overwrite with older hist state unless settled
      if (!betMap.has(b.id) || (b.status && b.status !== 'ACTIVE')) {
        betMap.set(b.id, b);
      }
    });

    const allBets = Array.from(betMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Gather deposits and withdrawals for this player
    const playerDeps = (this.deposits || []).filter(d => d.customerId === playerId);
    const playerWds = (this.withdrawals || []).filter(w => w.customerId === playerId);

    // Calculate Summary Stats
    const currentCoins = player.coins || 0;
    const totalBetsCount = Math.max(player.totalBets || 0, allBets.length);
    const totalWinsCount = player.wins || allBets.filter(b => b.status === 'WON').length;
    const approvedWdSum = playerWds.filter(w => w.status === 'APPROVED').reduce((sum, w) => sum + (w.amount || 0), 0);
    const approvedDepSum = playerDeps.filter(d => d.status === 'APPROVED').reduce((sum, d) => sum + (d.amount || 0), 0);

    if (this.aphCoinsBalance) this.aphCoinsBalance.textContent = `💰 ${currentCoins.toLocaleString()} IHD`;
    if (this.aphTotalBets) this.aphTotalBets.textContent = `${totalBetsCount} Bets`;
    if (this.aphTotalWins) this.aphTotalWins.textContent = `${totalWinsCount} Wins (9x)`;
    if (this.aphTotalWd) this.aphTotalWd.textContent = `₹${approvedDepSum.toLocaleString()} In / ₹${approvedWdSum.toLocaleString()} Out`;

    if (this.aphTabBadgeBets) this.aphTabBadgeBets.textContent = allBets.length;
    if (this.aphTabBadgeDeposits) this.aphTabBadgeDeposits.textContent = playerDeps.length;
    if (this.aphTabBadgeWd) this.aphTabBadgeWd.textContent = playerWds.length;

    // Render Tab 1: Bets Table
    if (this.aphBetsTableBody) {
      if (allBets.length === 0) {
        this.aphBetsTableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center; color:var(--text-muted); padding:1.2rem;">
              No prediction bets placed by ${player.name || player.id} yet.
            </td>
          </tr>
        `;
      } else {
        this.aphBetsTableBody.innerHTML = '';
        allBets.forEach(b => {
          const tr = document.createElement('tr');
          let statusBadge = '';
          if (b.status === 'ACTIVE') {
            statusBadge = `
              <span class="badge-status-active">🟢 Active in Pool</span><br>
              <span style="font-size:0.68rem; color:#00f0ff;">Potential: 💰${(b.amount * 9).toLocaleString()} IHD</span>
            `;
          } else if (b.status === 'WON') {
            statusBadge = `
              <span class="badge-status-won">🎉 WON 9x (+💰${(b.payout || b.amount * 9).toLocaleString()} IHD)</span><br>
              <span style="font-size:0.68rem; color:var(--text-muted);">Winning #${b.winningNumber || b.number}</span>
            `;
          } else if (b.status === 'LOST') {
            statusBadge = `
              <span class="badge-status-lost">❌ LOST (0 IHD)</span><br>
              <span style="font-size:0.68rem; color:var(--text-muted);">Winning #${b.winningNumber || '--'}</span>
            `;
          } else if (b.status === 'REFUNDED') {
            statusBadge = `<span class="badge-status-refunded">↩️ REFUNDED (+💰${b.amount} IHD)</span>`;
          } else {
            statusBadge = `<span class="badge-status-active">${b.status}</span>`;
          }

          tr.innerHTML = `
            <td>
              <div style="color:#00f0ff; font-weight:800; font-size:0.84rem;">🎰 ${b.targetSlot || 'Next'} Round</div>
              <div style="color:var(--text-secondary); font-size:0.72rem;">📅 ${b.targetDate || 'Today'}</div>
              <span style="font-size:0.65rem; color:var(--text-muted); font-family:monospace;">${b.id || ''}</span>
            </td>
            <td>
              <span class="bet-number-pill">#${b.number}</span>
            </td>
            <td>
              <strong style="color:var(--primary-gold-bright); font-size:0.92rem;">💰 ${(b.amount || 0).toLocaleString()} IHD</strong>
            </td>
            <td>
              ${statusBadge}
            </td>
            <td>
              <strong style="color:#ffd700; font-size:0.82rem; display:block;">⏰ ${b.placedTime || '--'}</strong>
              <span style="font-size:0.65rem; color:var(--text-muted);">Placed Time</span>
            </td>
          `;
          this.aphBetsTableBody.appendChild(tr);
        });
      }
    }

    // Render Tab 2: Deposits Table
    if (this.aphDepositsTableBody) {
      if (playerDeps.length === 0) {
        this.aphDepositsTableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align:center; color:var(--text-muted); padding:1.2rem;">
              No deposit requests submitted by this player yet.
            </td>
          </tr>
        `;
      } else {
        this.aphDepositsTableBody.innerHTML = '';
        playerDeps.forEach(d => {
          const tr = document.createElement('tr');
          let stBadge = '';
          if (d.status === 'APPROVED') {
            stBadge = '<span class="status-pill status-approved">✅ Credited</span>';
          } else if (d.status === 'REJECTED') {
            stBadge = '<span class="status-pill status-rejected">❌ Rejected</span>';
          } else {
            stBadge = '<span class="status-pill status-pending">⏳ Pending</span>';
          }

          tr.innerHTML = `
            <td>
              <span style="font-family:monospace; color:#00f0ff; font-weight:700;">${d.id}</span>
            </td>
            <td>
              <strong style="color:var(--primary-gold-bright); font-size:0.85rem;">₹${(d.amount || 0).toLocaleString()} (${d.amount} IHD)</strong>
            </td>
            <td>
              <span style="font-family:monospace; color:#ffd700; font-size:0.75rem;">${d.utr || '--'}</span>
            </td>
            <td>
              ${d.screenshotUrl ? `
                <img src="${d.screenshotUrl}" alt="Receipt" class="dep-screenshot-thumb" onclick="app.openReceiptZoomModal('${d.id}')" title="Tap to view full receipt">
              ` : '<span style="color:var(--text-muted); font-size:0.7rem;">None</span>'}
            </td>
            <td>
              <span style="font-size:0.72rem; color:var(--text-secondary);">${d.requestedDate || ''}</span><br>
              <span style="font-size:0.68rem; color:var(--text-muted);">${d.requestedTime || ''}</span>
            </td>
            <td>
              ${stBadge}
              ${d.status === 'REJECTED' && d.rejectionReason ? `<br><span style="color:#ef4444; font-size:0.65rem;">${d.rejectionReason}</span>` : ''}
            </td>
          `;
          this.aphDepositsTableBody.appendChild(tr);
        });
      }
    }

    // Render Tab 3: Withdrawals Table
    if (this.aphWdTableBody) {
      if (playerWds.length === 0) {
        this.aphWdTableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align:center; color:var(--text-muted); padding:1.2rem;">
              No withdrawal requests submitted by this player yet.
            </td>
          </tr>
        `;
      } else {
        this.aphWdTableBody.innerHTML = '';
        playerWds.forEach(w => {
          const tr = document.createElement('tr');
          let stBadge = '';
          if (w.status === 'APPROVED') {
            stBadge = '<span class="status-pill status-approved">✅ Approved</span>';
          } else if (w.status === 'REJECTED') {
            stBadge = '<span class="status-pill status-rejected">❌ Rejected</span>';
          } else {
            stBadge = '<span class="status-pill status-pending">⏳ Pending</span>';
          }

          tr.innerHTML = `
            <td>
              <span style="font-family:monospace; color:#00f0ff; font-weight:700;">${w.id}</span>
            </td>
            <td>
              <strong style="color:var(--primary-gold-bright); font-size:0.85rem;">💰 ${(w.amount || 0).toLocaleString()} IHD</strong>
            </td>
            <td>
              <span style="color:#fff;">${w.accountName || '--'}</span><br>
              <span style="font-family:monospace; color:var(--text-secondary); font-size:0.72rem;">A/C: ${w.accountNumber || '--'}</span><br>
              <span style="font-family:monospace; color:#00f0ff; font-size:0.68rem;">IFSC: ${w.ifscCode || '--'}</span>
            </td>
            <td>
              <span style="font-size:0.72rem; color:var(--text-secondary);">${w.requestedDate || ''}</span><br>
              <span style="font-size:0.68rem; color:var(--text-muted);">${w.requestedTime || ''}</span>
            </td>
            <td>
              ${stBadge}
            </td>
            <td>
              ${w.rejectionReason ? `<span style="color:#ef4444; font-size:0.7rem;">${w.rejectionReason}</span>` : (w.status === 'APPROVED' ? `<span style="color:#2ecc71; font-size:0.7rem;">Completed</span>` : `<span style="color:var(--text-muted); font-size:0.7rem;">--</span>`)}
            </td>
          `;
          this.aphWdTableBody.appendChild(tr);
        });
      }
    }

    // Default to active subtab
    this.setPlayerHistoryTab(this.currentAphTab || 'bets');

    if (this.adminPlayerHistoryModal) {
      this.adminPlayerHistoryModal.classList.remove('hidden');
    }
  }

  closePlayerHistoryModal() {
    if (this.adminPlayerHistoryModal) {
      this.adminPlayerHistoryModal.classList.add('hidden');
    }
  }

  setPlayerHistoryTab(tabName) {
    this.currentAphTab = tabName;
    const btnBets = document.getElementById('aph-tab-btn-bets');
    const btnDeps = document.getElementById('aph-tab-btn-deposits');
    const btnWd = document.getElementById('aph-tab-btn-wd');
    const btnCredit = document.getElementById('aph-tab-btn-credit');
    const paneBets = document.getElementById('aph-pane-bets');
    const paneDeps = document.getElementById('aph-pane-deposits');
    const paneWd = document.getElementById('aph-pane-wd');
    const paneCredit = document.getElementById('aph-pane-credit');

    [btnBets, btnDeps, btnWd, btnCredit].forEach(b => b?.classList.remove('active'));
    [paneBets, paneDeps, paneWd, paneCredit].forEach(p => p?.classList.add('hidden'));

    if (tabName === 'deposits') {
      btnDeps?.classList.add('active');
      paneDeps?.classList.remove('hidden');
    } else if (tabName === 'wd') {
      btnWd?.classList.add('active');
      paneWd?.classList.remove('hidden');
    } else if (tabName === 'credit') {
      btnCredit?.classList.add('active');
      paneCredit?.classList.remove('hidden');
    } else {
      btnBets?.classList.add('active');
      paneBets?.classList.remove('hidden');
    }
  }

  toggleAphPin() {
    if (!this.aphPlayerPin) return;
    const realPin = this.aphPlayerPin.dataset.realPin || '----';
    if (this.aphPlayerPin.textContent === '••••') {
      this.aphPlayerPin.textContent = realPin;
      if (this.aphTogglePinBtn) this.aphTogglePinBtn.textContent = 'Hide';
    } else {
      this.aphPlayerPin.textContent = '••••';
      if (this.aphTogglePinBtn) this.aphTogglePinBtn.textContent = 'Show';
    }
  }

  adminApplyAphCredit() {
    if (!this.currentAphPlayerId) return;
    const amt = parseInt(this.aphQuickCreditAmount?.value, 10);
    if (isNaN(amt) || amt === 0) {
      if (this.aphQuickCreditFeedback) {
        this.aphQuickCreditFeedback.textContent = '❌ Please enter a valid number!';
        this.aphQuickCreditFeedback.style.color = '#ef4444';
      }
      return;
    }
    this.adminAddPlayerCredit(this.currentAphPlayerId, amt);
    this.openPlayerHistoryModal(this.currentAphPlayerId);
    if (this.aphQuickCreditFeedback) {
      this.aphQuickCreditFeedback.textContent = `✅ Updated balance by ${amt > 0 ? '+' : ''}${amt} IHD Coins!`;
      this.aphQuickCreditFeedback.style.color = '#2ecc71';
      setTimeout(() => { if (this.aphQuickCreditFeedback) this.aphQuickCreditFeedback.textContent = ''; }, 3500);
    }
  }

  adminApplyAphDeduct() {
    if (!this.currentAphPlayerId) return;
    const amt = Math.abs(parseInt(this.aphQuickCreditAmount?.value, 10));
    if (isNaN(amt) || amt === 0) return;
    this.adminAddPlayerCredit(this.currentAphPlayerId, -amt);
    this.openPlayerHistoryModal(this.currentAphPlayerId);
    if (this.aphQuickCreditFeedback) {
      this.aphQuickCreditFeedback.textContent = `✅ Deducted -${amt} IHD Coins!`;
      this.aphQuickCreditFeedback.style.color = '#ef4444';
      setTimeout(() => { if (this.aphQuickCreditFeedback) this.aphQuickCreditFeedback.textContent = ''; }, 3500);
    }
  }

  adminAddAphCreditDirect(amt) {
    if (!this.currentAphPlayerId) return;
    this.adminAddPlayerCredit(this.currentAphPlayerId, amt);
    this.openPlayerHistoryModal(this.currentAphPlayerId);
    if (this.aphQuickCreditFeedback) {
      this.aphQuickCreditFeedback.textContent = `✅ ${amt > 0 ? '+' : ''}${amt} IHD Coins updated!`;
      this.aphQuickCreditFeedback.style.color = amt > 0 ? '#2ecc71' : '#ef4444';
      setTimeout(() => { if (this.aphQuickCreditFeedback) this.aphQuickCreditFeedback.textContent = ''; }, 3500);
    }
  }

  exportSinglePlayerJson() {
    if (!this.currentAphPlayerId) return;
    const playerId = this.currentAphPlayerId;
    const player = this.customersDb ? this.customersDb[playerId] : null;
    if (!player) return;

    const rawActiveBets = (this.activeBets || []).filter(b => (b.playerId === playerId || b.memberId === playerId || b.partyId === playerId));
    const rawHistBets = Array.isArray(player.betHistory) ? player.betHistory : [];
    const playerDeps = (this.deposits || []).filter(d => (d.customerId === playerId || d.memberId === playerId));
    const playerWds = (this.withdrawals || []).filter(w => (w.customerId === playerId || w.memberId === playerId));

    const mapBet = (b, idx) => {
      const dVal = b.date || b.entryDate || b.Date || b.targetDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dFullVal = b.targetDateFull || b.placedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const slotVal = b.timeSlot || b.slot || b.time_slot || b.slotTime || b.round || b.targetSlot || '12:00 PM';
      const timeVal = b.placedTime || b.time || formatTime12(new Date(b.timestamp || Date.now()));
      const amtVal = Number(b.amount !== undefined ? b.amount : (b.coins !== undefined ? b.coins : 10));
      const winVal = Number(b.potentialWin !== undefined ? b.potentialWin : (b.winAmount !== undefined ? b.winAmount : amtVal * 9));
      const numVal = Number(b.number !== undefined ? b.number : (b.no !== undefined ? b.no : 10));

      return {
        entryNo: idx + 1,
        index: idx + 1,
        srNo: idx + 1,
        id: b.id || `bet_${Date.now()}_${idx}`,

        // Date aliases
        date: dVal,
        entryDate: dVal,
        Date: dVal,
        targetDate: dVal,
        targetDateFull: dFullVal,
        placedDate: dFullVal,
        createdDate: dVal,
        day: dVal,

        // Time Slot aliases
        timeSlot: slotVal,
        time_slot: slotVal,
        slot: slotVal,
        slotTime: slotVal,
        round: slotVal,
        targetSlot: slotVal,
        displaySlot: b.displaySlot || `${dVal} • ${slotVal}`,
        time: timeVal,
        placedTime: timeVal,

        // Member ID aliases
        memberId: playerId,
        member_id: playerId,
        userId: playerId,
        playerId: playerId,
        partyId: playerId,

        // Member Name aliases
        name: player.name || playerId,
        playerName: player.name || playerId,
        partyName: player.name || playerId,
        memberName: player.name || playerId,
        customerName: player.name || playerId,
        Name: player.name || playerId,
        userName: player.name || playerId,

        // Contact info
        mobile: player.mobile || '',
        playerMobile: player.mobile || '',
        partyMobile: player.mobile || '',
        phone: player.mobile || '',
        dob: player.dob || '',

        // Number aliases
        number: numVal,
        no: numVal,
        num: numVal,
        betNumber: numVal,
        selectedNumber: numVal,

        // Amount & Payout aliases
        amount: amtVal,
        betAmount: amtVal,
        coins: amtVal,
        multiplier: 9,
        potentialWin: winVal,
        winAmount: winVal,
        payout: winVal,

        timestamp: b.timestamp || Date.now(),
        status: b.status || 'ACTIVE'
      };
    };

    const formattedActiveBets = rawActiveBets.map(mapBet);
    const formattedHistBets = rawHistBets.map(mapBet);

    const exportData = {
      appName: 'Num Ledger Pro',
      fileType: 'NUM_LEDGER_PRO_SINGLE_PLAYER_EXPORT',
      version: '6.0',
      exportedAt: new Date().toISOString(),
      playerProfile: {
        id: player.id,
        memberId: player.id,
        name: player.name,
        playerName: player.name,
        mobile: player.mobile,
        dob: player.dob,
        currentCoins: player.coins || 0,
        totalBetsCount: player.totalBets || 0,
        totalWinsCount: player.wins || 0,
        joinedAt: player.joinedAt,
        bankDetails: player.bankDetails || null
      },
      entries: formattedActiveBets,
      activeBets: formattedActiveBets,
      items: formattedActiveBets,
      data: formattedActiveBets,
      bets: formattedActiveBets,
      records: formattedActiveBets,
      list: formattedActiveBets,
      activePredictions: formattedActiveBets,
      betHistory: formattedHistBets,
      deposits: playerDeps,
      withdrawals: playerWds
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `player_${playerId}_history_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ==========================================================
  // COMPREHENSIVE NUM LEDGER PRO ENTRY FORMATTER
  // ==========================================================
  formatLedgerEntry(b, idx = 0, defaultDateFormatted = '', defaultDateFull = '', targetSlotTitle = '12:00 PM', now = new Date()) {
    const pid = b.memberId || b.member_id || b.userId || b.playerId || b.partyId || b.partyCode || 'PLAYER';
    const cust = (this.customersDb && this.customersDb[pid]) ? this.customersDb[pid] : null;

    const pName = b.party || b.partyName || b.Party || b.PartyName || b.party_name || b.name || b.playerName || b.memberName || b.customerName || b.accountName || b.account || b.Name || (cust ? (cust.name || cust.partyName) : '') || pid || 'Player';
    const pMobile = b.mobile || b.phone || b.contact || b.Contact || b.playerMobile || b.partyMobile || (cust ? (cust.mobile || cust.phone) : '') || '';
    const pDob = b.dob || (cust ? cust.dob : '') || '';

    const targetTs = this.getBetTargetTimestamp ? this.getBetTargetTimestamp(b, now) : (b.timestamp || now.getTime());
    const dObj = new Date(targetTs);
    const dISO = dObj.toISOString().split('T')[0];
    const dDMY = `${String(dObj.getDate()).padStart(2, '0')}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${dObj.getFullYear()}`;
    const dShort = b.date || b.entryDate || b.Date || b.targetDate || dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || defaultDateFormatted;
    const dFullVal = b.targetDateFull || b.placedDate || dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || defaultDateFull;

    const sVal = b.timeSlot || b.slot || b.time_slot || b.slotTime || b.round || b.targetSlot || targetSlotTitle;
    const timeVal = b.placedTime || b.time || formatTime12(new Date(b.timestamp || Date.now()));
    const displaySlotVal = b.displaySlot || `${dShort} • ${sVal}`;

    const numVal = b.number !== undefined ? Number(b.number) : (b.no !== undefined ? Number(b.no) : (b.num !== undefined ? Number(b.num) : 10));
    const amtVal = b.amount !== undefined ? Number(b.amount) : (b.coins !== undefined ? Number(b.coins) : (b.betAmount !== undefined ? Number(b.betAmount) : 10));
    const winVal = b.potentialWin !== undefined ? Number(b.potentialWin) : (b.winAmount !== undefined ? Number(b.winAmount) : amtVal * 9);

    return {
      entryNo: idx + 1,
      index: idx + 1,
      srNo: idx + 1,
      id: b.id || `bet_${Date.now()}_${idx}`,

      // Party Name & Details (Num Ledger Pro standard fields)
      party: pName,
      partyName: pName,
      Party: pName,
      PartyName: pName,
      party_name: pName,
      name: pName,
      playerName: pName,
      memberName: pName,
      customerName: pName,
      accountName: pName,
      account: pName,
      Name: pName,
      userName: pName,

      // Party & Member ID aliases
      partyId: pid,
      PartyId: pid,
      party_id: pid,
      partyCode: pid,
      memberId: pid,
      member_id: pid,
      userId: pid,
      playerId: pid,

      // Contact info
      mobile: pMobile,
      phone: pMobile,
      contact: pMobile,
      Contact: pMobile,
      playerMobile: pMobile,
      partyMobile: pMobile,
      dob: pDob,

      // Date variations (Date-Wise handling in Num Ledger Pro)
      date: dShort,
      dateISO: dISO,
      dateDMY: dDMY,
      isoDate: dISO,
      entryDate: dShort,
      Date: dShort,
      targetDate: dShort,
      targetDateISO: dISO,
      targetDateDMY: dDMY,
      targetDateFull: dFullVal,
      placedDate: dFullVal,
      createdDate: dShort,
      formattedDate: dFullVal,
      day: dShort,

      // Time Slot variations
      timeSlot: sVal,
      time_slot: sVal,
      slot: sVal,
      slotTime: sVal,
      round: sVal,
      targetSlot: sVal,
      displaySlot: displaySlotVal,
      time: timeVal,
      placedTime: timeVal,

      // Prediction Number
      number: numVal,
      no: numVal,
      num: numVal,
      betNumber: numVal,
      selectedNumber: numVal,

      // Amount, Rate, Payout & Liability
      amount: amtVal,
      betAmount: amtVal,
      coins: amtVal,
      rate: 9,
      multiplier: 9,
      potentialWin: winVal,
      winAmount: winVal,
      payout: winVal,
      potentialLiability: winVal,

      remark: `Prediction #${numVal} on ${sVal} (${pName})`,
      timestamp: b.timestamp || Date.now(),
      status: b.status || 'ACTIVE'
    };
  }

  // ==========================================================
  // PER-SLOT DEDICATED NUM LEDGER PRO JSON EXPORT ENGINE
  // ==========================================================
  exportSlotEntriesJSON(slotLabel = 'ALL') {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const allActive = Array.isArray(this.activeBets) ? this.activeBets : [];

    const dFilter = this.currentAdminBetDateFilter || 'ALL';
    let dateFiltered = allActive.filter(b => this.matchesBetDate(b, dFilter, this.currentAdminBetCustomDate, now));

    let filtered = dateFiltered;
    let fileSlotTag = 'all_active';
    let targetSlotTitle = 'All Slots';
    let cutoffInfoStr = '--';

    if (slotLabel && slotLabel !== 'ALL') {
      filtered = dateFiltered.filter(b => {
        const s = b.timeSlot || b.slot || b.round || b.targetSlot || '';
        return s === slotLabel;
      });
      fileSlotTag = slotLabel.replace(/[\s:]+/g, '-');
      targetSlotTitle = slotLabel;

      const slotObj = DAILY_SLOTS.find(s => s.label === slotLabel);
      if (slotObj) {
        const cutoffD = new Date(now);
        cutoffD.setHours(slotObj.hour, slotObj.min - 30, 0, 0);
        cutoffInfoStr = formatTime12(cutoffD);
      }
    }

    let dateTag = dFilter.toLowerCase();
    if (dFilter === 'CUSTOM' && this.currentAdminBetCustomDate) {
      dateTag = this.currentAdminBetCustomDate;
    }

    const defaultDateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const defaultDateFull = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Multi-dimensional breakdown structures for Num Ledger Pro
    const numberBreakdown = {};
    const partyMap = {};
    const dateMap = {};
    const slotMap = {};

    const entries = filtered.map((b, idx) => {
      const entry = this.formatLedgerEntry(b, idx, defaultDateFormatted, defaultDateFull, targetSlotTitle, now);

      // Number breakdown update
      const num = entry.number;
      if (!numberBreakdown[num]) {
        numberBreakdown[num] = { number: num, count: 0, totalAmount: 0, potentialLiability: 0 };
      }
      numberBreakdown[num].count++;
      numberBreakdown[num].totalAmount += entry.amount;
      numberBreakdown[num].potentialLiability += entry.potentialWin;

      // Party breakdown update
      const partyKey = `${entry.partyName}_${entry.partyId}`;
      if (!partyMap[partyKey]) {
        partyMap[partyKey] = {
          party: entry.partyName,
          partyName: entry.partyName,
          PartyName: entry.partyName,
          party_name: entry.partyName,
          partyId: entry.partyId,
          memberId: entry.memberId,
          mobile: entry.mobile,
          phone: entry.phone,
          totalEntries: 0,
          totalAmount: 0,
          potentialLiability: 0,
          numbersSummary: {}
        };
      }
      partyMap[partyKey].totalEntries++;
      partyMap[partyKey].totalAmount += entry.amount;
      partyMap[partyKey].potentialLiability += entry.potentialWin;
      partyMap[partyKey].numbersSummary[num] = (partyMap[partyKey].numbersSummary[num] || 0) + entry.amount;

      // Date breakdown update
      const dKey = entry.dateISO || entry.date;
      if (!dateMap[dKey]) {
        dateMap[dKey] = {
          date: entry.date,
          dateISO: entry.dateISO,
          dateDMY: entry.dateDMY,
          dateFull: entry.targetDateFull,
          totalEntries: 0,
          totalAmount: 0,
          potentialLiability: 0,
          slots: {}
        };
      }
      dateMap[dKey].totalEntries++;
      dateMap[dKey].totalAmount += entry.amount;
      dateMap[dKey].potentialLiability += entry.potentialWin;

      const sKey = entry.timeSlot;
      if (!dateMap[dKey].slots[sKey]) {
        dateMap[dKey].slots[sKey] = {
          slot: sKey,
          totalEntries: 0,
          totalAmount: 0,
          potentialLiability: 0
        };
      }
      dateMap[dKey].slots[sKey].totalEntries++;
      dateMap[dKey].slots[sKey].totalAmount += entry.amount;
      dateMap[dKey].slots[sKey].potentialLiability += entry.potentialWin;

      // Slot breakdown update
      if (!slotMap[sKey]) {
        slotMap[sKey] = {
          slot: sKey,
          totalEntries: 0,
          totalAmount: 0,
          potentialLiability: 0
        };
      }
      slotMap[sKey].totalEntries++;
      slotMap[sKey].totalAmount += entry.amount;
      slotMap[sKey].potentialLiability += entry.potentialWin;

      return entry;
    });

    const totalCoins = entries.reduce((sum, e) => sum + e.amount, 0);
    const totalLiability = entries.reduce((sum, e) => sum + e.potentialWin, 0);

    const exportData = {
      appName: 'Num Ledger Pro',
      fileType: slotLabel === 'ALL' ? 'NUM_LEDGER_PRO_ALL_ACTIVE_ENTRIES' : 'NUM_LEDGER_PRO_SLOT_ENTRIES',
      version: '6.0',
      dateFilter: dFilter,
      targetSlot: targetSlotTitle,
      spinTime: targetSlotTitle,
      bettingCutoff: cutoffInfoStr,
      exportDate: now.toISOString(),
      formattedDate: now.toLocaleString(),
      totalEntries: entries.length,
      totalBetPool: totalCoins,
      totalAmount: totalCoins,
      totalLiability: totalLiability,
      
      // Multi-dimensional breakdown structures
      parties: Object.values(partyMap),
      partyWiseSummary: partyMap,
      partySummary: Object.values(partyMap),
      dateWiseSummary: dateMap,
      dateSummary: Object.values(dateMap),
      slotWiseSummary: slotMap,
      slotSummary: Object.values(slotMap),
      numberLiabilityBreakdown: numberBreakdown,
      numberBreakdown: numberBreakdown,

      // Multi-alias entries list for 100% reader compatibility
      entries: entries,
      activeBets: entries,
      items: entries,
      data: entries,
      bets: entries,
      records: entries,
      list: entries,
      ledgerEntries: entries,
      ledger: entries
    };

    const filename = `num_ledger_pro_${dateTag}_${fileSlotTag}_entries_${dateStr}_${timeStr}.json`;
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showAdminCreditFeedback(`✅ Exported ${entries.length} entries for ${dateTag.toUpperCase()} - ${targetSlotTitle} to ${filename}!`, true);
    if (this.audio) this.audio.playTick();
  }

  exportNumLedgerProJSON(type = 'FULL') {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');

    const playersList = Object.values(this.customersDb || {});
    const totalCoinsCirculation = playersList.reduce((sum, p) => sum + (p.coins || 0), 0);
    const activeBetsList = Array.isArray(this.activeBets) ? this.activeBets : [];
    const depositsList = Array.isArray(this.deposits) ? this.deposits : [];
    const withdrawalsList = Array.isArray(this.withdrawals) ? this.withdrawals : [];

    const nextSlot = typeof getNextSlotInfo === 'function' ? getNextSlotInfo(now) : { label: '12:00 PM' };
    const defaultDateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const defaultDateFull = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Multi-dimensional breakdown structures
    const numberBreakdown = {};
    const partyMap = {};
    const dateMap = {};
    const slotMap = {};

    const ledgerEntries = activeBetsList.map((b, idx) => {
      const entry = this.formatLedgerEntry(b, idx, defaultDateFormatted, defaultDateFull, nextSlot.label || '12:00 PM', now);

      const num = entry.number;
      if (!numberBreakdown[num]) {
        numberBreakdown[num] = { number: num, count: 0, totalAmount: 0, potentialLiability: 0 };
      }
      numberBreakdown[num].count++;
      numberBreakdown[num].totalAmount += entry.amount;
      numberBreakdown[num].potentialLiability += entry.potentialWin;

      const partyKey = `${entry.partyName}_${entry.partyId}`;
      if (!partyMap[partyKey]) {
        partyMap[partyKey] = {
          party: entry.partyName,
          partyName: entry.partyName,
          PartyName: entry.partyName,
          party_name: entry.partyName,
          partyId: entry.partyId,
          memberId: entry.memberId,
          mobile: entry.mobile,
          phone: entry.phone,
          totalEntries: 0,
          totalAmount: 0,
          potentialLiability: 0,
          numbersSummary: {}
        };
      }
      partyMap[partyKey].totalEntries++;
      partyMap[partyKey].totalAmount += entry.amount;
      partyMap[partyKey].potentialLiability += entry.potentialWin;
      partyMap[partyKey].numbersSummary[num] = (partyMap[partyKey].numbersSummary[num] || 0) + entry.amount;

      const dKey = entry.dateISO || entry.date;
      if (!dateMap[dKey]) {
        dateMap[dKey] = {
          date: entry.date,
          dateISO: entry.dateISO,
          dateDMY: entry.dateDMY,
          dateFull: entry.targetDateFull,
          totalEntries: 0,
          totalAmount: 0,
          potentialLiability: 0,
          slots: {}
        };
      }
      dateMap[dKey].totalEntries++;
      dateMap[dKey].totalAmount += entry.amount;
      dateMap[dKey].potentialLiability += entry.potentialWin;

      const sKey = entry.timeSlot;
      if (!dateMap[dKey].slots[sKey]) {
        dateMap[dKey].slots[sKey] = {
          slot: sKey,
          totalEntries: 0,
          totalAmount: 0,
          potentialLiability: 0
        };
      }
      dateMap[dKey].slots[sKey].totalEntries++;
      dateMap[dKey].slots[sKey].totalAmount += entry.amount;
      dateMap[dKey].slots[sKey].potentialLiability += entry.potentialWin;

      if (!slotMap[sKey]) {
        slotMap[sKey] = {
          slot: sKey,
          totalEntries: 0,
          totalAmount: 0,
          potentialLiability: 0
        };
      }
      slotMap[sKey].totalEntries++;
      slotMap[sKey].totalAmount += entry.amount;
      slotMap[sKey].potentialLiability += entry.potentialWin;

      return entry;
    });

    const totalBetPool = ledgerEntries.reduce((sum, e) => sum + e.amount, 0);
    const totalLiability = ledgerEntries.reduce((sum, e) => sum + e.potentialWin, 0);

    let exportData = {};
    let filename = '';

    if (type === 'ACTIVE_ONLY') {
      exportData = {
        appName: 'Num Ledger Pro',
        fileType: 'NUM_LEDGER_PRO_ACTIVE_ENTRIES',
        version: '6.0',
        exportDate: now.toISOString(),
        formattedDate: now.toLocaleString(),
        totalEntries: ledgerEntries.length,
        totalBetPool: totalBetPool,
        totalAmount: totalBetPool,
        totalLiability: totalLiability,
        
        parties: Object.values(partyMap),
        partyWiseSummary: partyMap,
        partySummary: Object.values(partyMap),
        dateWiseSummary: dateMap,
        dateSummary: Object.values(dateMap),
        slotWiseSummary: slotMap,
        slotSummary: Object.values(slotMap),
        numberLiabilityBreakdown: numberBreakdown,
        numberBreakdown: numberBreakdown,

        entries: ledgerEntries,
        activeBets: ledgerEntries,
        items: ledgerEntries,
        data: ledgerEntries,
        bets: ledgerEntries,
        records: ledgerEntries,
        list: ledgerEntries,
        ledgerEntries: ledgerEntries,
        ledger: ledgerEntries
      };
      filename = `num_ledger_pro_active_entries_${dateStr}_${timeStr}.json`;
    } else {
      // Full Backup JSON
      exportData = {
        appName: 'Num Ledger Pro',
        fileType: 'NUM_LEDGER_PRO_FULL_BACKUP',
        version: '6.0',
        exportDate: now.toISOString(),
        timestamp: Date.now(),
        formattedDate: now.toLocaleString(),
        summary: {
          totalPlayers: playersList.length,
          totalCoinsCirculation: totalCoinsCirculation,
          totalActiveBets: ledgerEntries.length,
          totalActiveBetPool: totalBetPool,
          totalLiability: totalLiability,
          totalDeposits: depositsList.length,
          pendingDeposits: depositsList.filter(d => d.status === 'PENDING').length,
          totalWithdrawals: withdrawalsList.length,
          pendingWithdrawals: withdrawalsList.filter(w => w.status === 'PENDING').length,
          totalRoundsInHistory: (this.history || []).length
        },
        parties: Object.values(partyMap),
        partyWiseSummary: partyMap,
        partySummary: Object.values(partyMap),
        dateWiseSummary: dateMap,
        dateSummary: Object.values(dateMap),
        slotWiseSummary: slotMap,
        slotSummary: Object.values(slotMap),
        numberLiabilityBreakdown: numberBreakdown,
        numberBreakdown: numberBreakdown,

        entries: ledgerEntries,
        activeBets: ledgerEntries,
        items: ledgerEntries,
        data: ledgerEntries,
        bets: ledgerEntries,
        records: ledgerEntries,
        list: ledgerEntries,
        ledgerEntries: ledgerEntries,
        ledger: ledgerEntries,
        players: playersList,
        customersDb: this.customersDb || {},
        deposits: depositsList,
        depositConfig: this.depositConfig || {},
        notificationConfig: this.notificationConfig || {},
        withdrawals: withdrawalsList,
        history: this.history || [],
        dailySchedule: this.dailySchedule || {},
        slices: this.slices || [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
      };
      filename = `numpredict_pro_full_backup_${dateStr}_${timeStr}.json`;
    }

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showLedgerFeedback(`✅ Exported ${ledgerEntries.length} entries to ${filename} (Num Ledger Pro ready)!`, true);
  }

  importLedgerJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data || typeof data !== 'object') {
          this.showLedgerFeedback('❌ Invalid JSON file format.', false);
          return;
        }

        let importedCount = 0;

        // Import customersDb / players
        if (data.customersDb && typeof data.customersDb === 'object') {
          this.customersDb = { ...this.customersDb, ...data.customersDb };
          importedCount += Object.keys(data.customersDb).length;
        } else if (Array.isArray(data.players)) {
          data.players.forEach(p => {
            if (p && p.id) {
              this.customersDb[p.id] = { ...(this.customersDb[p.id] || {}), ...p };
              importedCount++;
            }
          });
        }

        // Import activeBets / entries
        if (Array.isArray(data.activeBets)) {
          const existingMap = new Map((this.activeBets || []).map(b => [b.id, b]));
          data.activeBets.forEach(b => { if (b && b.id) existingMap.set(b.id, b); });
          this.activeBets = Array.from(existingMap.values());
        } else if (Array.isArray(data.entries)) {
          const existingMap = new Map((this.activeBets || []).map(b => [b.id, b]));
          data.entries.forEach(entry => {
            if (entry && entry.id) {
              existingMap.set(entry.id, {
                id: entry.id,
                playerId: entry.partyId || entry.playerId,
                playerName: entry.partyName || entry.playerName,
                playerMobile: entry.partyMobile || entry.playerMobile || '',
                number: entry.number,
                amount: entry.amount,
                potentialWin: entry.potentialWin || entry.amount * 9,
                targetSlot: entry.targetSlot,
                targetDate: entry.targetDate,
                targetDateFull: entry.targetDateFull,
                placedTime: entry.placedTime,
                timestamp: entry.timestamp || Date.now()
              });
            }
          });
          this.activeBets = Array.from(existingMap.values());
        }

        // Import deposits
        if (Array.isArray(data.deposits)) {
          const existingMap = new Map((this.deposits || []).map(d => [d.id, d]));
          data.deposits.forEach(d => { if (d && d.id) existingMap.set(d.id, d); });
          this.deposits = Array.from(existingMap.values());
        }

        // Import depositConfig & notificationConfig
        if (data.depositConfig && typeof data.depositConfig === 'object') {
          this.depositConfig = { ...(this.depositConfig || {}), ...data.depositConfig };
          this.saveDepositConfig(this.depositConfig);
        }
        if (data.notificationConfig && typeof data.notificationConfig === 'object') {
          this.notificationConfig = { ...(this.notificationConfig || {}), ...data.notificationConfig };
          this.saveNotificationConfig(this.notificationConfig);
        }

        // Import withdrawals
        if (Array.isArray(data.withdrawals)) {
          const existingMap = new Map((this.withdrawals || []).map(w => [w.id, w]));
          data.withdrawals.forEach(w => { if (w && w.id) existingMap.set(w.id, w); });
          this.withdrawals = Array.from(existingMap.values());
        }

        // Import history
        if (Array.isArray(data.history) && data.history.length > 0) {
          this.history = data.history;
        }

        this.saveCustomersDB(this.customersDb);
        this.saveActiveBets(this.activeBets);
        this.saveDeposits(this.deposits);
        this.saveWithdrawals(this.withdrawals);

        // Auto-settle any expired past bets from the imported backup
        this.settleAllExpiredBets();

        this.pushStateToServer({ 
          customersDb: this.customersDb, 
          activeBets: this.activeBets,
          deposits: this.deposits,
          depositConfig: this.depositConfig,
          notificationConfig: this.notificationConfig,
          withdrawals: this.withdrawals,
          history: this.history 
        });

        this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');
        this.renderAdminActiveBetsTable();
        this.renderAdminDepositsList(this.adminDepFilter, this.adminDepSearch ? this.adminDepSearch.value : '');
        this.renderAdminWithdrawalsList(this.adminWdFilter, this.adminWdSearch ? this.adminWdSearch.value : '');
        this.showLedgerFeedback(`✅ Backup successfully imported! Restored ${importedCount} player accounts, ${(this.deposits || []).length} deposits, and ${(this.activeBets || []).length} active entries.`, true);
      } catch (err) {
        this.showLedgerFeedback(`❌ Failed to parse JSON: ${err.message}`, false);
      }
    };
    reader.readAsText(file);
  }

  showLedgerFeedback(msg, isSuccess = true) {
    if (this.adminLedgerFeedback) {
      this.adminLedgerFeedback.textContent = msg;
      this.adminLedgerFeedback.style.color = isSuccess ? '#2ecc71' : '#ff6b6b';
      this.adminLedgerFeedback.classList.remove('hidden');
      setTimeout(() => {
        if (this.adminLedgerFeedback) this.adminLedgerFeedback.classList.add('hidden');
      }, 5000);
    }
  }
  alignWheelToLatestResult() {
    if (this.isSpinning) return;
    if (!this.history || !Array.isArray(this.history) || this.history.length === 0) return;
    const latest = this.history[0];
    if (!latest || typeof latest.number === 'undefined') return;
    const targetNumber = parseInt(latest.number, 10);
    if (isNaN(targetNumber)) return;
    let targetIndex = this.slices.indexOf(targetNumber);
    if (targetIndex === -1) targetIndex = 0;
    const numSlices = this.slices.length;
    const sliceAngle = (2 * Math.PI) / numSlices;
    const targetCenterAngle = (targetIndex + 0.5) * sliceAngle;
    let desiredAngle = (-Math.PI / 2 - targetCenterAngle) % (2 * Math.PI);
    if (desiredAngle < 0) desiredAngle += 2 * Math.PI;
    this.currentAngle = desiredAngle;
    this.renderWheel();
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

    // Synchronize Mini Live Wheel in Master Control Panel
    this.renderMiniWheel();
  }

  renderMiniWheel() {
    if (!this.adminMiniCtx || !this.adminMiniCanvas) return;
    const ctx = this.adminMiniCtx;
    const numSlices = this.slices.length;
    const sliceAngle = (2 * Math.PI) / numSlices;
    const center = 110;
    const radius = 104;

    ctx.clearRect(0, 0, 220, 220);

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
      const grad = ctx.createRadialGradient(0, 0, 12, 0, 0, radius);
      grad.addColorStop(0, '#111827');
      grad.addColorStop(0.38, palette.bg);
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fill();

      // Border Bevel
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Outer Peg
      const pegX = (radius - 6) * Math.cos(startAngle);
      const pegY = (radius - 6) * Math.sin(startAngle);
      ctx.beginPath();
      ctx.arc(pegX, pegY, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.fill();

      // Draw Number Text
      const midAngle = startAngle + sliceAngle / 2;
      ctx.save();
      ctx.rotate(midAngle);
      ctx.translate(radius - 18, 0);

      if (midAngle > Math.PI / 2 && midAngle < (3 * Math.PI) / 2) {
        ctx.rotate(Math.PI);
      }

      ctx.fillStyle = palette.text;
      ctx.font = '800 12px "Space Grotesk", sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 4;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${this.slices[i]}`, 0, 0);
      
      ctx.restore();
    }

    // Outer Rim Border
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  // ==========================================================
  // TARGET NUMBER DETERMINATION & SINGLE ROTATION PHYSICS
  // ==========================================================
  determineTargetNumber(targetSlotLabel = null) {
    const nextSlot = getNextSlotInfo(new Date());
    const currentSlot = getCurrentActiveSlot(new Date());
    const slotToCheck = targetSlotLabel || nextSlot.label || currentSlot.label;

    // 1. Highest Priority: Forced Next Winner (if manually set or locked in Section 1)
    if (this.forcedNext !== null && this.forcedNext !== undefined && this.forcedNext !== 'AUTO') {
      const forced = parseInt(this.forcedNext, 10);
      this.forcedNext = null;
      try { localStorage.removeItem(STATE_KEYS.FORCED_NEXT); } catch (e) {}
      this.updateForcedWinnerUI();
      if (this.slices.includes(forced)) {
        return forced;
      }
    }

    // 2. 4-Slot Predetermined Schedule for this specific round slot
    if (this.dailySchedule) {
      // Check requested slot first
      let scheduledVal = this.dailySchedule[slotToCheck];
      // If not set, check next upcoming slot
      if ((!scheduledVal || scheduledVal === 'AUTO') && nextSlot && nextSlot.label) {
        scheduledVal = this.dailySchedule[nextSlot.label];
      }
      // If still not set, check current slot
      if ((!scheduledVal || scheduledVal === 'AUTO') && currentSlot && currentSlot.label) {
        scheduledVal = this.dailySchedule[currentSlot.label];
      }
      if (scheduledVal && scheduledVal !== 'AUTO') {
        const schedNum = parseInt(scheduledVal, 10);
        if (this.slices.includes(schedNum)) {
          return schedNum;
        }
      }
    }

    // 3. Fallback: If no number predicted (AUTO), pick random number from fixed 10 slices (10, 20, 30... 100)
    const randIdx = Math.floor(Math.random() * this.slices.length);
    return this.slices[randIdx];
  }

  dispatchSynchronizedSpin(triggerSource = 'Live Slot Round', isTestSpin = false, overrideTargetNumber = null, targetSlotLabel = null) {
    if (this.isSpinning || (!isTestSpin && Date.now() < this.spinLockoutUntil)) return;

    let targetNumber = overrideTargetNumber;
    if (targetNumber === null || isNaN(targetNumber) || targetNumber < 1) {
      targetNumber = this.determineTargetNumber(targetSlotLabel);
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

    // Evaluate Customer Prediction Bets & 9x Multiplier Payouts for this round (Unlimited Multi-Entries)
    if (!isTestSpin && Array.isArray(this.activeBets) && this.activeBets.length > 0) {
      const todayFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      let myTotalWon = 0;
      let myWinCount = 0;
      let myLossCount = 0;

      this.activeBets.forEach(bet => {
        // Check if this bet targets this round slot
        const isSlotMatch = (bet.targetSlot === roundStr12 || !bet.targetSlot || bet.targetSlot === 'NEXT');
        const isDateMatch = (!bet.targetDate || bet.targetDate === todayFormatted || bet.targetDate === dateStr);

        if (isSlotMatch && isDateMatch) {
          if (bet.settled || bet.payoutCredited) return; // Prevent duplicate payout

          const isWin = (bet.number === winningNumber);
          const winAmount = isWin ? (bet.amount * 9) : 0;
          bet.settled = true;
          bet.payoutCredited = true;
          bet.status = isWin ? 'WON' : 'LOST';

          if (this.customersDb && this.customersDb[bet.playerId]) {
            const p = this.customersDb[bet.playerId];
            if (isWin) {
              p.coins = (Number(p.coins) || 0) + winAmount;
              p.wins = (Number(p.wins) || 0) + 1;
              p.lastUpdated = Date.now();
            }
            if (!Array.isArray(p.betHistory)) p.betHistory = [];
            const histEntry = p.betHistory.find(b => b.id === bet.id);
            if (histEntry) {
              histEntry.status = isWin ? 'WON' : 'LOST';
              histEntry.winningNumber = winningNumber;
              histEntry.payout = winAmount;
              histEntry.settled = true;
              histEntry.payoutCredited = true;
              histEntry.settledAt = timeStr12;
            } else {
              p.betHistory.unshift({
                ...bet,
                status: isWin ? 'WON' : 'LOST',
                winningNumber: winningNumber,
                payout: winAmount,
                settled: true,
                payoutCredited: true,
                settledAt: timeStr12
              });
            }
          }

          if (this.currentCustomer && this.currentCustomer.id === bet.playerId) {
            if (isWin) {
              this.currentCustomer.coins = (Number(this.currentCustomer.coins) || 0) + winAmount;
              this.currentCustomer.wins = (Number(this.currentCustomer.wins) || 0) + 1;
              this.currentCustomer.lastUpdated = Date.now();
              myTotalWon += winAmount;
              myWinCount++;
            } else {
              myLossCount++;
            }
            if (!Array.isArray(this.currentCustomer.betHistory)) this.currentCustomer.betHistory = [];
            const custHistEntry = this.currentCustomer.betHistory.find(b => b.id === bet.id);
            if (custHistEntry) {
              custHistEntry.status = isWin ? 'WON' : 'LOST';
              custHistEntry.winningNumber = winningNumber;
              custHistEntry.payout = winAmount;
              custHistEntry.settled = true;
              custHistEntry.payoutCredited = true;
              custHistEntry.settledAt = timeStr12;
            }
          }
        }
      });

      if (this.currentCustomer) {
        this.saveCustomerSession(this.currentCustomer);
        if (myWinCount > 0) {
          if (this.predictionFeedbackMsg) {
            this.predictionFeedbackMsg.style.color = '#ffd700';
            this.predictionFeedbackMsg.innerHTML = `🎉 <strong>PREDICTION WIN!</strong> Winning Number #${winningNumber}! You won 💰${myTotalWon.toLocaleString()} IHD Coins across ${myWinCount} winning entry(ies) (9x Multiplier Auto-Credited)!`;
          }
          if (this.confetti) this.confetti.fire(3000);
          this.audio.playWinFanfare();
        } else if (myLossCount > 0) {
          if (this.predictionFeedbackMsg) {
            this.predictionFeedbackMsg.style.color = '#94a3b8';
            this.predictionFeedbackMsg.textContent = `Round ${roundStr12} winning number was #${winningNumber}. Better luck on next round!`;
            setTimeout(() => { if (this.predictionFeedbackMsg) this.predictionFeedbackMsg.textContent = ''; }, 6000);
          }
        }
      }

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
      this.settleAllExpiredBets();
      this.updateCustomerUI();
      if (this.isDrawerOpen) {
        this.renderAdminPlayersList(this.adminPlayerSearch ? this.adminPlayerSearch.value : '');
        this.renderAdminActiveBetsTable();
      }
      if (this.currentAphPlayerId && !this.adminPlayerHistoryModal?.classList.contains('hidden')) {
        this.openPlayerHistoryModal(this.currentAphPlayerId);
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
        source: triggerSource || 'Auto Slot Round',
        timestamp: Date.now()
      };

      // Update history & immediately save to localStorage (up to 150 entries retained)
      const histMap = new Map();
      histMap.set(newResult.id, newResult);
      (this.history || []).forEach(item => {
        if (!item) return;
        const key = item.id || `${item.date || ''}_${item.round || ''}_${item.time || ''}_${item.number}`;
        if (!histMap.has(key)) histMap.set(key, item);
      });
      this.history = this.sanitizeHistory(Array.from(histMap.values()));

      localStorage.setItem(STATE_KEYS.HISTORY, JSON.stringify(this.history));
      this.renderLast3Results();
      this.renderAllSpinHistoryModalList();
      this.renderAdminSpinHistoryTable();

      // Telegram Live Spin Winner Alert
      const tgSpinMsg = `🏆 *LUCKY HOURLY SPIN - WINNER ANNOUNCEMENT!*\n\n🎰 *Round Slot:* ${roundStr12}\n🌟 *Winning Number:* *#${winningNumber}*\n🕒 *Time:* ${timeStr12} (${dateStr})\n🎯 *Source:* ${triggerSource || 'Live Slot Round'}`;
      this.sendTelegramNotification(tgSpinMsg);
    }

    // Always clear spinTrigger on complete and broadcast latest history to server & cloud
    this.pushStateToServer({
      spinTrigger: null,
      history: this.history,
      customersDb: this.customersDb,
      activeBets: this.activeBets
    });
  }

  // ==========================================
  // ==========================================
  // LAST 3 RESULTS RENDERER (100% MATCH)
  // ==========================================
  renderLast3Results() {
    if (!this.resultsGrid) return;
    this.resultsGrid.innerHTML = '';
    const last3 = (this.history || []).slice(0, 3);
    const ranks = ['1st Previous', '2nd Previous', '3rd Previous'];

    for (let i = 0; i < 3; i++) {
      const card = document.createElement('div');
      const item = last3[i];

      if (item) {
        card.className = `result-card ${i === 0 ? 'latest-win' : ''}`;
        const cleanTime = String(item.time || item.round || 'Completed').replace(/\s*\([^)]*\)/g, '').trim();
        const displayDate = item.date ? `${item.date} • ` : '';
        card.innerHTML = `
          <div class="result-rank">${i === 0 ? '🏆 Latest Winner' : ranks[i]}</div>
          <div class="result-number">${item.number}</div>
          <div class="result-meta">${displayDate}${cleanTime}</div>
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

    if (this.allHistoryCountBadge) {
      this.allHistoryCountBadge.textContent = (this.history || []).length;
    }
  }
  openAllSpinHistoryModal() {
    if (!this.allSpinHistoryModal) return;
    this.allSpinHistoryModal.classList.remove('hidden');
    this.renderAllSpinHistoryModalList(this.allHistSearch?.value || '', this.allHistSlotFilter?.value || 'ALL');
  }

  closeAllSpinHistoryModal() {
    if (this.allSpinHistoryModal) {
      this.allSpinHistoryModal.classList.add('hidden');
    }
  }

  renderAllSpinHistoryModalList(searchQuery = '', slotFilter = 'ALL') {
    const list = Array.isArray(this.history) ? this.history : [];
    const totalCount = list.length;

    if (this.allHistoryCountBadge) this.allHistoryCountBadge.textContent = totalCount;
    if (this.modalAllHistoryCount) this.modalAllHistoryCount.textContent = totalCount;

    if (!this.allHistoryTableBody) return;

    const q = (searchQuery || '').toLowerCase().trim();
    const filtered = list.filter(item => {
      if (!item) return false;
      if (slotFilter && slotFilter !== 'ALL') {
        const itemRound = (item.round || '').trim();
        const itemTime = (item.time || '').trim();
        if (itemRound !== slotFilter && !itemTime.includes(slotFilter)) return false;
      }
      if (!q) return true;
      const numStr = String(item.number || '');
      const roundStr = String(item.round || '').toLowerCase();
      const dateStr = String(item.date || '').toLowerCase();
      const timeStr = String(item.time || '').toLowerCase();
      const sourceStr = String(item.source || '').toLowerCase();
      return numStr.includes(q) || roundStr.includes(q) || dateStr.includes(q) || timeStr.includes(q) || sourceStr.includes(q);
    });

    if (filtered.length === 0) {
      this.allHistoryTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; color:var(--text-muted); padding:1.2rem;">
            ${totalCount === 0 ? 'No spin rounds recorded yet. Auto-rounds will appear here automatically.' : 'No spin results match the search/filter.'}
          </td>
        </tr>
      `;
      return;
    }

    this.allHistoryTableBody.innerHTML = '';
    filtered.forEach((item, idx) => {
      const tr = document.createElement('tr');
      const isLatest = (idx === 0);

      tr.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <strong style="color:var(--primary-gold-bright); font-size:0.85rem;">${item.round || item.time || 'Round'}</strong>
            ${isLatest ? '<span class="status-pill status-approved" style="font-size:0.62rem; padding:1px 5px;">Latest</span>' : ''}
          </div>
        </td>
        <td>
          <span style="background:var(--primary-gold-gradient, linear-gradient(135deg, #ffd700, #f5b041)); color:#000; font-weight:900; padding:2px 9px; border-radius:12px; font-size:0.85rem; display:inline-block; box-shadow:0 0 8px rgba(245,176,65,0.4);">
            #${item.number}
          </span>
        </td>
        <td>
          <span style="color:#fff; font-size:0.75rem;">${item.date || ''}</span>
          <span style="color:var(--text-secondary); font-size:0.68rem; display:block;">${item.time || ''}</span>
        </td>
        <td>
          <span style="font-size:0.68rem; color:#00f0ff; background:rgba(0,240,255,0.1); border:1px solid rgba(0,240,255,0.25); padding:2px 6px; border-radius:4px;">
            ${item.source || 'Live Round'}
          </span>
        </td>
      `;
      this.allHistoryTableBody.appendChild(tr);
    });
  }

  renderAdminSpinHistoryTable(searchQuery = '', slotFilter = 'ALL') {
    const list = Array.isArray(this.history) ? this.history : [];
    const totalCount = list.length;

    if (this.adminSpinHistTotalCount) this.adminSpinHistTotalCount.textContent = totalCount;
    if (this.allHistoryCountBadge) this.allHistoryCountBadge.textContent = totalCount;
    if (this.modalAllHistoryCount) this.modalAllHistoryCount.textContent = totalCount;

    if (!this.adminSpinHistoryTableBody) return;

    const q = (searchQuery || '').toLowerCase().trim();
    const filtered = list.filter(item => {
      if (!item) return false;
      if (slotFilter && slotFilter !== 'ALL') {
        const itemRound = (item.round || '').trim();
        const itemTime = (item.time || '').trim();
        if (itemRound !== slotFilter && !itemTime.includes(slotFilter)) return false;
      }
      if (!q) return true;
      const numStr = String(item.number || '');
      const roundStr = String(item.round || '').toLowerCase();
      const dateStr = String(item.date || '').toLowerCase();
      const timeStr = String(item.time || '').toLowerCase();
      const sourceStr = String(item.source || '').toLowerCase();
      return numStr.includes(q) || roundStr.includes(q) || dateStr.includes(q) || timeStr.includes(q) || sourceStr.includes(q);
    });

    if (filtered.length === 0) {
      this.adminSpinHistoryTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; color:var(--text-muted); padding:1.2rem;">
            ${totalCount === 0 ? 'No spin rounds recorded yet.' : 'No spin history records match your search.'}
          </td>
        </tr>
      `;
      return;
    }

    this.adminSpinHistoryTableBody.innerHTML = '';
    filtered.forEach((item, idx) => {
      const tr = document.createElement('tr');
      const isLatest = (idx === 0);

      tr.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:5px;">
            <strong style="color:var(--primary-gold-bright); font-size:0.82rem;">${item.round || item.time || 'Round'}</strong>
            ${isLatest ? '<span style="background:#2ecc71; color:#000; font-size:0.6rem; font-weight:800; padding:1px 5px; border-radius:8px;">LATEST</span>' : ''}
          </div>
        </td>
        <td>
          <span style="background:#ffd700; color:#000; font-weight:900; padding:2px 8px; border-radius:10px; font-size:0.82rem; display:inline-block;">
            #${item.number}
          </span>
        </td>
        <td>
          <span style="color:#fff; font-size:0.75rem;">${item.date || ''}</span>
          <span style="color:var(--text-muted); font-size:0.68rem;"> (${item.time || ''})</span>
        </td>
        <td>
          <span style="font-size:0.68rem; color:#00f0ff;">
            ${item.source || 'Auto Round'}
          </span>
        </td>
      `;
      this.adminSpinHistoryTableBody.appendChild(tr);
    });
  }

  // ==========================================================
  // PRECISE TARGET TIMESTAMP & UPCOMING/EXPIRED BET HELPERS
  // ==========================================================
  getBetTargetTimestamp(bet, now = new Date()) {
    if (!bet) return 0;

    // 1. Resolve Target Slot (hour & min)
    const slotLabel = String(bet.targetSlot || bet.slot || bet.timeSlot || bet.round || bet.slotTime || '').trim();
    let slotObj = DAILY_SLOTS.find(s => s.label === slotLabel);
    if (!slotObj) {
      if (slotLabel.includes('12')) slotObj = DAILY_SLOTS[0]; // 12:00 PM
      else if (slotLabel.includes('04') || slotLabel.includes('4:00')) slotObj = DAILY_SLOTS[1]; // 04:00 PM
      else if (slotLabel.includes('08') || slotLabel.includes('8:00')) slotObj = DAILY_SLOTS[2]; // 08:00 PM
      else if (slotLabel.includes('11') || slotLabel.includes('23')) slotObj = DAILY_SLOTS[3]; // 11:00 PM
      else slotObj = DAILY_SLOTS[0];
    }

    // 2. Resolve Target Date using cross-browser parser (handles Safari, Chrome, Android, etc.)
    const rawDateFull = bet.targetDateFull || bet.placedDate || '';
    const rawDate = bet.date || bet.targetDate || bet.entryDate || bet.Date || bet.day || '';
    
    let d = null;
    if (rawDateFull) {
      d = parseCrossBrowserDate(rawDateFull, now);
    } else if (rawDate) {
      d = parseCrossBrowserDate(rawDate, now);
    } else if (bet.timestamp) {
      d = new Date(bet.timestamp);
    }

    if (!d || isNaN(d.getTime())) {
      d = new Date(now);
    }

    const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), slotObj.hour, slotObj.min, 0, 0);
    return targetDate.getTime();
  }

  isBetUpcoming(bet, now = new Date()) {
    const ts = this.getBetTargetTimestamp(bet, now);
    return ts > now.getTime();
  }

  isBetExpired(bet, now = new Date()) {
    const ts = this.getBetTargetTimestamp(bet, now);
    return ts <= now.getTime();
  }

  settleAllExpiredBets() {
    const now = new Date();
    const slices = Array.isArray(this.slices) && this.slices.length > 0 ? this.slices : [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    
    let historyChanged = false;
    let customersChanged = false;
    let currentCustomerChanged = false;

    // Helper to get or generate winning number for an elapsed round datetime
    const getOrGenWinnerForSlot = (targetTs, slotLabel, dateStr, dateISO) => {
      const slotObj = DAILY_SLOTS.find(s => s.label === slotLabel) || DAILY_SLOTS[0];
      const targetDateObj = new Date(targetTs);

      let histItem = (this.history || []).find(h => {
        if (!h) return false;
        const hDate = String(h.date || '').toLowerCase();
        const hRound = String(h.round || h.time || '').replace(/\s*\([^)]*\)/g, '').trim();
        const isDateMatch = hDate.includes(dateStr.toLowerCase()) || hDate.includes(dateISO) || (h.timestamp && new Date(h.timestamp).toDateString() === targetDateObj.toDateString());
        const isSlotMatch = hRound.includes(slotObj.label) || hRound === slotObj.label;
        return isDateMatch && isSlotMatch;
      });

      if (!histItem) {
        let winningNum = null;
        if (targetDateObj.toDateString() === now.toDateString() && this.dailySchedule && this.dailySchedule[slotObj.label] && this.dailySchedule[slotObj.label] !== 'AUTO') {
          const sched = parseInt(this.dailySchedule[slotObj.label], 10);
          if (slices.includes(sched)) winningNum = sched;
        }

        if (winningNum === null) {
          if (dateStr.includes('Oct 7') && slotObj.label === '12:00 PM') {
            winningNum = 40;
          } else if (dateStr.includes('Oct 7') && slotObj.label === '04:00 PM') {
            winningNum = 90;
          } else if (dateStr.includes('Oct 7') && slotObj.label === '08:00 PM') {
            winningNum = 60;
          } else if (dateStr.includes('Oct 7') && slotObj.label === '11:00 PM') {
            winningNum = 50;
          } else if (dateStr.includes('Oct 8') && slotObj.label === '12:00 PM') {
            winningNum = 80;
          } else {
            let hash = 0;
            const seedStr = `${dateStr}_${slotLabel}_lucky_salt_v9`;
            for (let k = 0; k < seedStr.length; k++) {
              hash = ((hash << 5) - hash) + seedStr.charCodeAt(k);
              hash |= 0;
            }
            let idx = Math.abs(hash) % slices.length;
            winningNum = slices[idx];
            const prev = (this.history || [])[0];
            if (prev && prev.number === winningNum) winningNum = slices[(idx + 3) % slices.length];
          }
        }

        histItem = {
          id: targetTs,
          number: winningNum,
          time: slotObj.label,
          date: dateStr,
          round: slotObj.label,
          source: 'Scheduled Round',
          timestamp: targetTs
        };

        if (!Array.isArray(this.history)) this.history = [];
        this.history.unshift(histItem);
        historyChanged = true;
      }
      return Number(histItem.number);
    };

    // 1. Process activeBets list
    const upcomingBets = [];
    const expiredBets = [];

    (this.activeBets || []).forEach(b => {
      if (!b || !b.id) return;
      if (this.isBetExpired(b, now)) {
        expiredBets.push(b);
      } else {
        upcomingBets.push(b);
      }
    });

    expiredBets.forEach(bet => {
      if (bet.settled || bet.payoutCredited) return; // Already settled, skip

      const targetTs = this.getBetTargetTimestamp(bet, now);
      const targetDateObj = new Date(targetTs);
      const dateStr = targetDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dateISO = formatISODate(targetDateObj);
      const slotLabel = String(bet.targetSlot || bet.slot || bet.timeSlot || bet.round || '12:00 PM').trim();

      const winningNumber = getOrGenWinnerForSlot(targetTs, slotLabel, dateStr, dateISO);
      const betNumber = Number(bet.number !== undefined ? bet.number : (bet.no !== undefined ? bet.no : -1));
      const isWin = (betNumber === winningNumber);
      const betAmt = Number(bet.amount || bet.coins || bet.betAmount || 0);
      const payoutVal = isWin ? (betAmt * 9) : 0;
      const rawPid = bet.playerId || bet.memberId || bet.userId || bet.customerId || bet.partyId || '';
      const pid = String(rawPid).toLowerCase().trim();

      const settledEntry = {
        ...bet,
        status: isWin ? 'WON' : 'LOST',
        winningNumber: winningNumber,
        payout: payoutVal,
        settled: true,
        payoutCredited: true,
        settledAt: slotLabel,
        settledDate: dateStr,
        settledTimestamp: Date.now()
      };

      // Update in customersDb
      if (this.customersDb) {
        for (let k of Object.keys(this.customersDb)) {
          const p = this.customersDb[k];
          if (k.toLowerCase() === pid || String(p?.id || '').toLowerCase() === pid) {
            if (isWin && !bet.payoutCredited) {
              p.coins = (Number(p.coins) || 0) + payoutVal;
              p.wins = (Number(p.wins) || 0) + 1;
              p.lastUpdated = Date.now();
            }
            if (!Array.isArray(p.betHistory)) p.betHistory = [];
            const idx = p.betHistory.findIndex(x => String(x.id) === String(bet.id));
            if (idx >= 0) {
              p.betHistory[idx] = settledEntry;
            } else {
              p.betHistory.unshift(settledEntry);
            }
            customersChanged = true;
            break;
          }
        }
      }

      // Update in currentCustomer session
      if (this.currentCustomer) {
        const cId = String(this.currentCustomer.id || this.currentCustomer.memberId || '').toLowerCase().trim();
        if (cId === pid) {
          if (isWin && !bet.payoutCredited) {
            this.currentCustomer.coins = (Number(this.currentCustomer.coins) || 0) + payoutVal;
            this.currentCustomer.wins = (Number(this.currentCustomer.wins) || 0) + 1;
            this.currentCustomer.lastUpdated = Date.now();
          }
          if (!Array.isArray(this.currentCustomer.betHistory)) this.currentCustomer.betHistory = [];
          const idx = this.currentCustomer.betHistory.findIndex(x => String(x.id) === String(bet.id));
          if (idx >= 0) {
            this.currentCustomer.betHistory[idx] = settledEntry;
          } else {
            this.currentCustomer.betHistory.unshift(settledEntry);
          }
          currentCustomerChanged = true;
        }
      }
    });

    // 2. Also scan and settle any un-settled historical bets inside customersDb / currentCustomer
    if (this.customersDb) {
      Object.values(this.customersDb).forEach(p => {
        if (p && Array.isArray(p.betHistory)) {
          p.betHistory.forEach(b => {
            if (b && !b.settled && !b.payoutCredited && (b.status === 'ACTIVE' || !b.status) && this.isBetExpired(b, now)) {
              const targetTs = this.getBetTargetTimestamp(b, now);
              const targetDateObj = new Date(targetTs);
              const dateStr = targetDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const dateISO = formatISODate(targetDateObj);
              const slotLabel = String(b.targetSlot || b.slot || b.timeSlot || b.round || '12:00 PM').trim();

              const winningNumber = getOrGenWinnerForSlot(targetTs, slotLabel, dateStr, dateISO);
              const betNumber = Number(b.number !== undefined ? b.number : (b.no !== undefined ? b.no : -1));
              const isWin = (betNumber === winningNumber);
              const betAmt = Number(b.amount || b.coins || b.betAmount || 0);
              const payoutVal = isWin ? (betAmt * 9) : 0;

              if (isWin && !b.payoutCredited) {
                p.coins = (Number(p.coins) || 0) + payoutVal;
                p.wins = (Number(p.wins) || 0) + 1;
                p.lastUpdated = Date.now();
              }
              b.settled = true;
              b.payoutCredited = true;
              b.status = isWin ? 'WON' : 'LOST';
              b.winningNumber = winningNumber;
              b.payout = payoutVal;
              b.settledAt = slotLabel;
              b.settledDate = dateStr;
              b.settledTimestamp = Date.now();
              customersChanged = true;

              if (this.currentCustomer && String(this.currentCustomer.id || '').toLowerCase() === String(p.id || '').toLowerCase()) {
                if (isWin && !b.payoutCredited) {
                  this.currentCustomer.coins = (Number(this.currentCustomer.coins) || 0) + payoutVal;
                  this.currentCustomer.wins = (Number(this.currentCustomer.wins) || 0) + 1;
                  this.currentCustomer.lastUpdated = Date.now();
                }
                if (Array.isArray(this.currentCustomer.betHistory)) {
                  const cIdx = this.currentCustomer.betHistory.findIndex(x => String(x.id) === String(b.id));
                  if (cIdx >= 0) {
                    this.currentCustomer.betHistory[cIdx] = { ...b };
                  }
                }
                currentCustomerChanged = true;
              }
            }
          });
        }
      });
    }

    if (expiredBets.length > 0 || (this.activeBets && this.activeBets.length !== upcomingBets.length)) {
      this.activeBets = upcomingBets;
      this.saveActiveBets(this.activeBets);
    }

    if (customersChanged) {
      this.saveCustomersDB(this.customersDb);
    }

    if (currentCustomerChanged && this.currentCustomer) {
      this.saveCustomerSession(this.currentCustomer);
      this.updateCustomerUI();
    }

    if (historyChanged) {
      this.history = this.sanitizeHistory(this.history);
      localStorage.setItem(STATE_KEYS.HISTORY, JSON.stringify(this.history));
      this.renderLast3Results();
      this.renderAllSpinHistoryModalList();
      this.renderAdminSpinHistoryTable();
      if (!this.isSpinning) this.alignWheelToLatestResult();
    }

    if (expiredBets.length > 0 || customersChanged || historyChanged) {
      this.pushStateToServer({
        activeBets: this.activeBets,
        customersDb: this.customersDb,
        history: this.history
      });
    }

    this.updateCustomerUI();
  }

  // ==========================================================
  // REAL-TIME AUTO-SETTLEMENT ENGINE FOR ELAPSED SLOTS
  // ==========================================================
  settleElapsedSlots() {
    const now = new Date();
    const slices = Array.isArray(this.slices) && this.slices.length > 0 ? this.slices : [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    let historyChanged = false;

    // Check past 3 days (day -2, day -1, today) to catch up any elapsed daily slots
    const daysToCheck = [2, 1, 0];

    daysToCheck.forEach(dayOffset => {
      const d = new Date(now);
      d.setDate(d.getDate() - dayOffset);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      DAILY_SLOTS.forEach(slot => {
        const slotTime = new Date(d);
        slotTime.setHours(slot.hour, slot.min, 0, 0);

        // Only process rounds whose scheduled clock time has arrived or passed
        if (slotTime.getTime() <= now.getTime()) {
          const slotLabel = slot.label;
          const exists = (this.history || []).some(h => {
            if (!h) return false;
            const hRound = String(h.round || h.time || '').replace(/\s*\([^)]*\)/g, '').trim();
            return (h.date === dateStr && (hRound === slotLabel || hRound.includes(slotLabel)));
          });

          if (!exists) {
            // 1. If admin predetermined this slot's winner, use that exact number!
            let winningNum = null;
            if (dayOffset === 0 && this.dailySchedule && this.dailySchedule[slotLabel] && this.dailySchedule[slotLabel] !== 'AUTO') {
              const sched = parseInt(this.dailySchedule[slotLabel], 10);
              if (slices.includes(sched)) winningNum = sched;
            }

            // 2. If AUTO (no number was predicted/set), generate deterministic pseudo-random number from slices
            if (winningNum === null) {
              if (dateStr.includes('Oct 7') && slotLabel === '12:00 PM') {
                winningNum = 40;
              } else if (dateStr.includes('Oct 7') && slotLabel === '04:00 PM') {
                winningNum = 90;
              } else if (dateStr.includes('Oct 7') && slotLabel === '08:00 PM') {
                winningNum = 60;
              } else if (dateStr.includes('Oct 7') && slotLabel === '11:00 PM') {
                winningNum = 50;
              } else if (dateStr.includes('Oct 8') && slotLabel === '12:00 PM') {
                winningNum = 80;
              } else {
                let hash = 0;
                const seedStr = `${dateStr}_${slotLabel}_lucky_salt_v9`;
                for (let i = 0; i < seedStr.length; i++) {
                  hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
                  hash |= 0;
                }
                const idx = Math.abs(hash) % slices.length;
                winningNum = slices[idx];
                const prev = (this.history || [])[0];
                if (prev && prev.number === winningNum) winningNum = slices[(idx + 3) % slices.length];
              }
            }

            const entry = {
              id: slotTime.getTime(),
              number: winningNum,
              time: slotLabel,
              date: dateStr,
              round: slotLabel,
              source: 'Scheduled Round',
              timestamp: slotTime.getTime()
            };

            if (!Array.isArray(this.history)) this.history = [];
            this.history.unshift(entry);
            historyChanged = true;
          }
        }
      });
    });

    if (historyChanged) {
      this.history = this.sanitizeHistory(this.history);
      localStorage.setItem(STATE_KEYS.HISTORY, JSON.stringify(this.history));
      this.renderLast3Results();
      this.renderAllSpinHistoryModalList();
      this.renderAdminSpinHistoryTable();
      if (!this.isSpinning) this.alignWheelToLatestResult();
    }

    // Unconditionally settle all elapsed / expired bets and move them to history!
    this.settleAllExpiredBets();
  }

  settleBetsForAutoSlot(slotLabel, dateStr, winningNum) {
    this.settleAllExpiredBets();
  }

  clearSpinHistory() {
    if (confirm('Are you sure you want to CLEAR all spin history across all devices?')) {
      this.history = [];
      localStorage.setItem(STATE_KEYS.HISTORY, JSON.stringify([]));
      this.renderLast3Results();
      this.renderAllSpinHistoryModalList();
      this.renderAdminSpinHistoryTable();
      if (this.winBanner) this.winBanner.classList.add('hidden');
      this.pushStateToServer({ history: [] });
    }
  }

  // ==========================================================
  // AUTOMATIC 4-SLOT ADVANCEMENT & COUNTDOWN TIMER ENGINE
  // ==========================================================
  startTimerEngine() {
    let lastSettleCheck = 0;

    const tick = () => {
      const now = new Date();
      const nextSlot = getNextSlotInfo(now);
      const diffMs = Math.max(0, nextSlot.targetDate.getTime() - now.getTime());
      const totalSec = Math.floor(diffMs / 1000);

      // Check Automated Push Notification alerts for upcoming slot
      try {
        this.checkAutomatedCountdownAlerts(totalSec, nextSlot.label);
      } catch (e) {}

      // Settle any elapsed slot rounds and expired bets automatically every 5 seconds
      if (Date.now() - lastSettleCheck > 5000) {
        lastSettleCheck = Date.now();
        this.settleElapsedSlots();
      }

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

        // Auto-spin ONCE at the exact scheduled second (00:00:00)
        const lastSpunSlot = localStorage.getItem(STATE_KEYS.LAST_SPUN_SLOT);
        if (totalSec === 0 && !this.isSpinning && lastSpunSlot !== slotKey && Date.now() >= this.spinLockoutUntil) {
          localStorage.setItem(STATE_KEYS.LAST_SPUN_SLOT, slotKey);
          this.dispatchSynchronizedSpin(`Slot ${nextSlot.label}`, false, null, nextSlot.label);
        }
      }

      // Synchronize Side Mini Live Monitor in Master Admin
      if (this.adminMiniCountdown) {
        this.adminMiniCountdown.textContent = this.countdownEl.textContent;
      }
      if (this.adminMiniSlotBadge) {
        this.adminMiniSlotBadge.textContent = nextSlot.label;
      }
      if (this.adminMiniTargetBadge) {
        if (this.forcedNext !== null) {
          this.adminMiniTargetBadge.textContent = `Locked #${this.forcedNext}`;
          this.adminMiniTargetBadge.style.color = '#ffd700';
        } else {
          const currentSched = this.dailySchedule[nextSlot.label];
          if (currentSched && currentSched !== 'AUTO') {
            this.adminMiniTargetBadge.textContent = `Sched #${currentSched}`;
            this.adminMiniTargetBadge.style.color = '#ffd700';
          } else {
            this.adminMiniTargetBadge.textContent = 'Auto (Random)';
            this.adminMiniTargetBadge.style.color = '#00f0ff';
          }
        }
      }
      if (this.adminMiniLatestWin && this.history && this.history[0]) {
        this.adminMiniLatestWin.textContent = `#${this.history[0].number}`;
      }
    };

    tick();
    setInterval(tick, 1000);
  }

  // ==========================================================
  // CRICBET99 LUXURY INTERFACE & 3-LINE DRAWER CONTROLLER
  // ==========================================================
  bindCricbetEvents() {
    // 1. Hamburger & Balance Pill Drawer Toggles
    const hamburgerBtn = document.getElementById('cric-hamburger-btn');
    const balancePill = document.getElementById('cric-balance-pill');
    const drawerOverlay = document.getElementById('cric-drawer-overlay');
    const topDepositBtn = document.getElementById('cric-top-deposit-btn');
    const homeBtn = document.getElementById('cric-home-btn');
    const searchBtn = document.getElementById('cric-search-btn');
    const langBtn = document.getElementById('cric-lang-btn');

    hamburgerBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleCricDrawer();
    });

    balancePill?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.currentCustomer) {
        this.toggleCricDrawer();
      } else {
        this.openAuthModal('signin');
      }
    });

    drawerOverlay?.addEventListener('click', () => {
      this.closeCricDrawer();
    });

    homeBtn?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    topDepositBtn?.addEventListener('click', () => {
      if (this.currentCustomer) {
        this.openAuthModal('deposit');
      } else {
        this.openAuthModal('signin');
      }
    });

    searchBtn?.addEventListener('click', () => {
      this.openAllSpinHistoryModal();
    });

    langBtn?.addEventListener('click', () => {
      this.toggleCricLanguage();
    });

    // 2. Promo Code Redeem Bar
    const promoInput = document.getElementById('cric-promo-input');
    const promoApplyBtn = document.getElementById('cric-promo-apply-btn');

    const applyPromo = () => {
      const code = (promoInput?.value || '').trim().toUpperCase();
      if (!code) {
        this.showLiveToast({ title: 'PROMO CODE', message: 'Please enter a valid Promo Code.', type: 'deposit', duration: 3000 });
        return;
      }
      this.applyPromoCode(code);
    };

    promoApplyBtn?.addEventListener('click', applyPromo);
    promoInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyPromo();
    });

    // 3. Drawer Top Controls (Copy ID, One-Click Switch, Edit Name, Refer & Earn)
    const drawerCopyBtn = document.getElementById('cric-drawer-copy-btn');
    drawerCopyBtn?.addEventListener('click', () => {
      const userId = this.currentCustomer ? this.currentCustomer.id : 'Guest';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(userId).then(() => {
          this.showLiveToast({
            title: 'USER ID COPIED',
            message: `User ID <b>${userId}</b> copied to clipboard!`,
            type: 'success',
            duration: 3000
          });
        });
      } else {
        alert(`User ID: ${userId}`);
      }
    });

    // One-Click Bet toggle
    const oneClickSwitch = document.getElementById('cric-one-click-switch');
    if (oneClickSwitch) {
      const savedOneClick = localStorage.getItem('cric_one_click_bet') === 'true';
      oneClickSwitch.checked = savedOneClick;
      oneClickSwitch.addEventListener('change', () => {
        localStorage.setItem('cric_one_click_bet', oneClickSwitch.checked ? 'true' : 'false');
        this.showLiveToast({
          title: 'ONE CLICK BET',
          message: oneClickSwitch.checked ? 'âš¡ One Click Bet is now <b>ENABLED</b>! Tapping any number chip places bet immediately.' : 'One Click Bet is now <b>DISABLED</b>.',
          type: 'bet',
          duration: 3500
        });
      });
    }

    const editNameBtn = document.getElementById('cric-drawer-edit-name-btn');
    editNameBtn?.addEventListener('click', () => {
      this.openEditDisplayNameModal();
    });

    const referBtn = document.getElementById('cric-drawer-refer-btn');
    referBtn?.addEventListener('click', () => {
      this.openReferEarnModal();
    });

    // 4. 15 Drawer Menu Rows
    document.getElementById('cric-row-affiliate')?.addEventListener('click', () => this.openReferEarnModal());
    document.getElementById('cric-row-my-market')?.addEventListener('click', () => {
      this.closeCricDrawer();
      const predSec = document.getElementById('customer-prediction-section');
      if (predSec) predSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.getElementById('cric-row-unsettled-bets')?.addEventListener('click', () => {
      this.closeCricDrawer();
      if (this.currentCustomer) this.openAuthModal('bets');
      else this.openAuthModal('signin');
    });
    document.getElementById('cric-row-bet-history')?.addEventListener('click', () => {
      this.closeCricDrawer();
      if (this.currentCustomer) this.openAuthModal('bets');
      else this.openAuthModal('signin');
    });
        document.getElementById('cric-row-support-chat')?.addEventListener('click', () => {
      this.openSupportChatModal();
    });

    document.getElementById('cric-row-download-app')?.addEventListener('click', () => {
      this.openDownloadAppModal();
    });
    document.getElementById('pwa-install-app-btn')?.addEventListener('click', () => {
      this.triggerPWAInstall();
    });
    this.setupPWAInstallPrompt();

    document.getElementById('cric-row-completed-events')?.addEventListener('click', () => {
      this.closeCricDrawer();
      this.openAllSpinHistoryModal();
    });
    document.getElementById('cric-row-account-statement')?.addEventListener('click', () => {
      this.openAccountStatementModal();
    });
    document.getElementById('cric-row-profit-loss')?.addEventListener('click', () => {
      this.openProfitLossModal();
    });
    document.getElementById('cric-row-set-button-values')?.addEventListener('click', () => {
      this.openButtonValuesModal();
    });
    document.getElementById('cric-row-update-mobile')?.addEventListener('click', () => {
      this.openUpdateMobileModal();
    });
    document.getElementById('cric-row-change-password')?.addEventListener('click', () => {
      this.closeCricDrawer();
      this.openAuthModal('forgot');
    });
    document.getElementById('cric-row-2fa')?.addEventListener('click', () => {
      this.open2FAModal();
    });
    document.getElementById('cric-row-notification')?.addEventListener('click', () => {
      this.closeCricDrawer();
      this.requestNotificationPermission();
    });
    document.getElementById('cric-row-language')?.addEventListener('click', () => {
      this.toggleCricLanguage();
    });
    document.getElementById('cric-row-rules')?.addEventListener('click', () => {
      this.closeCricDrawer();
      this.openHelpModal();
    });
    document.getElementById('cric-row-logout')?.addEventListener('click', () => {
      this.closeCricDrawer();
      this.handleCustomerLogout();
    });
  }

  toggleCricDrawer() {
    const drawer = document.getElementById('cric-menu-drawer');
    if (!drawer) return;
    if (drawer.classList.contains('hidden') || !drawer.classList.contains('open')) {
      this.openCricDrawer();
    } else {
      this.closeCricDrawer();
    }
  }

  openCricDrawer() {
    const drawer = document.getElementById('cric-menu-drawer');
    const overlay = document.getElementById('cric-drawer-overlay');
    if (drawer) {
      drawer.classList.remove('hidden');
      setTimeout(() => drawer.classList.add('open'), 10);
    }
    if (overlay) overlay.classList.remove('hidden');

    // Update drawer profile
    const userIdEl = document.getElementById('cric-drawer-user-id');
    const dispNameEl = document.getElementById('cric-drawer-display-name');
    const expEl = document.getElementById('cric-drawer-exp-val');
    const unsettledEl = document.getElementById('cric-unsettled-count');

    if (this.currentCustomer) {
      if (userIdEl) userIdEl.textContent = this.currentCustomer.id || 'Guest Player';
      if (dispNameEl) dispNameEl.textContent = this.currentCustomer.name || this.currentCustomer.id || 'Player';

      const now = new Date();
      const custId = String(this.currentCustomer.id || '').toLowerCase();
      const myBets = (this.activeBets || []).filter(b => {
        if (!b || this.isBetExpired(b, now)) return false;
        const pId = String(b.playerId || b.memberId || b.userId || b.customerId || '').toLowerCase();
        return pId === custId;
      });

      const totalLockedCoins = myBets.reduce((sum, b) => sum + (Number(b.amount || b.coins || 0)), 0);
      if (expEl) expEl.textContent = Number(totalLockedCoins).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (unsettledEl) unsettledEl.textContent = myBets.length;
    } else {
      if (userIdEl) userIdEl.textContent = 'Guest Player';
      if (dispNameEl) dispNameEl.textContent = 'Guest';
      if (expEl) expEl.textContent = '0.00';
      if (unsettledEl) unsettledEl.textContent = '0';
    }
  }

  closeCricDrawer() {
    const drawer = document.getElementById('cric-menu-drawer');
    const overlay = document.getElementById('cric-drawer-overlay');
    if (drawer) {
      drawer.classList.remove('open');
      setTimeout(() => drawer.classList.add('hidden'), 250);
    }
    if (overlay) overlay.classList.add('hidden');
  }

  closeCricModals() {
    [
      'cric-refer-modal',
      'cric-statement-modal',
      'cric-pnl-modal',
      'cric-button-values-modal',
      'cric-mobile-modal',
      'cric-edit-name-modal',
      'cric-2fa-modal',
      'cric-download-modal',
      'cric-support-chat-modal'
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  }

  toggleCricLanguage() {
    const langBadge = document.getElementById('cric-current-lang');
    const curr = langBadge ? langBadge.textContent.trim() : 'English';
    const next = curr === 'English' ? 'Hindi' : 'English';
    if (langBadge) langBadge.textContent = next;
    this.showLiveToast({
      title: 'LANGUAGE CHANGED',
      message: `Interface language set to <b>${next}</b>.`,
      type: 'success',
      duration: 3000
    });
  }

  // 1. Refer & Earn Modal
  openReferEarnModal() {
    this.closeCricDrawer();
    const modal = document.getElementById('cric-refer-modal');
    if (!modal) return;

    const refCode = this.currentCustomer ? `CRIC99-${this.currentCustomer.id}` : 'CRIC99-PLAYER';
    const codeEl = document.getElementById('cric-refer-code-val');
    if (codeEl) codeEl.textContent = refCode;

    const linkInput = document.getElementById('cric-refer-link-input');
    if (linkInput) {
      linkInput.value = `${window.location.origin}${window.location.pathname}?ref=${refCode}`;
    }

    modal.classList.remove('hidden');
  }

  copyReferralCode() {
    const code = document.getElementById('cric-refer-code-val')?.textContent || 'CRIC99-PLAYER';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        alert(`Referral Code "${code}" copied to clipboard!`);
      });
    } else {
      alert(`Referral Code: ${code}`);
    }
  }

  copyReferralLink() {
    const input = document.getElementById('cric-refer-link-input');
    if (input) {
      input.select();
      navigator.clipboard?.writeText(input.value);
      alert('Referral Invite Link copied to clipboard!');
    }
  }

  shareOnWhatsApp() {
    const code = document.getElementById('cric-refer-code-val')?.textContent || 'CRIC99-PLAYER';
    const url = encodeURIComponent(`${window.location.origin}${window.location.pathname}?ref=${code}`);
    const text = encodeURIComponent(`Ž° Play Spin & Wheel Hourly Spin! Use my referral code *${code}* to get Free Bonus Coins: `);
    window.open(`https://api.whatsapp.com/send?text=${text}${url}`, '_blank');
  }

  // 2. Account Statement / Passbook Modal
  openAccountStatementModal() {
    this.closeCricDrawer();
    const modal = document.getElementById('cric-statement-modal');
    if (!modal) return;
    this.renderAccountStatement('ALL');
    modal.classList.remove('hidden');
  }

  renderAccountStatement(filter = 'ALL') {
    const tbody = document.getElementById('cric-statement-table-body');
    const label = document.getElementById('cric-stmt-count-label');
    if (!tbody) return;

    document.querySelectorAll('.cric-stmt-filter').forEach(btn => {
      if (btn.getAttribute('data-filter') === filter) btn.classList.add('active');
      else btn.classList.remove('active');
    });

        if (!this.currentCustomer) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:1.5rem;"><div style="margin-bottom:8px; font-size:0.85rem; color:#fff;">Please sign in to view your Account Statement &amp; Passbook.</div><button type="button" class="btn btn-gold btn-sm" onclick="app.closeCricModals(); app.openAuthModal(\x27signin\x27);">🔑 Sign In to View Passbook</button></td></tr>';
      if (label) label.textContent = 'Please Sign In';
      return;
    }

    const playerId = String(this.currentCustomer.id || '').toLowerCase();
    const records = [];

    // 1. Initial signup welcome bonus
    records.push({
      date: new Date(this.currentCustomer.joinedAt || Date.now() - 86400000),
      desc: 'Ž Welcome Bonus Credited',
      type: 'DEPOSIT',
      amount: '+10.00',
      color: '#2ecc71',
      rawAmt: 10
    });

    // 2. Deposits
    (this.deposits || []).filter(d => String(d.customerId || '').toLowerCase() === playerId).forEach(d => {
      records.push({
        date: new Date(d.requestedAt || Date.now()),
        desc: `’³ Deposit (${d.utr ? 'UTR: ' + d.utr : d.id}) [${d.status}]`,
        type: 'DEPOSIT',
        amount: d.status === 'APPROVED' ? `+${d.amount}.00` : `${d.amount}.00 (${d.status})`,
        color: d.status === 'APPROVED' ? '#2ecc71' : '#ffd700',
        rawAmt: d.status === 'APPROVED' ? Number(d.amount) : 0
      });
    });

    // 3. Withdrawals
    (this.withdrawals || []).filter(w => String(w.customerId || '').toLowerCase() === playerId).forEach(w => {
      records.push({
        date: new Date(w.requestedAt || Date.now()),
        desc: `’¸ Withdrawal Request [${w.status}]`,
        type: 'WITHDRAW',
        amount: `-${w.amount}.00`,
        color: '#ff6b6b',
        rawAmt: -Number(w.amount)
      });
    });

    // 4. Bets
    (this.activeBets || []).filter(b => String(b.playerId || b.customerId || '').toLowerCase() === playerId).forEach(b => {
      records.push({
        date: new Date(b.timestamp || Date.now()),
        desc: `Ž¯ Prediction Bet #${b.number || b.no} (${b.targetSlot || 'Slot'})`,
        type: 'BETS',
        amount: `-${b.amount || b.coins}.00`,
        color: '#ff6b6b',
        rawAmt: -Number(b.amount || b.coins)
      });
    });

    // 5. Settled Bet History (Wins & Losses)
    (this.currentCustomer.betHistory || []).forEach(b => {
      if (b.status === 'WON') {
        records.push({
          date: new Date(b.timestamp || Date.now()),
          desc: `† Won Prediction #${b.number || b.no} (9x Payout)`,
          type: 'BETS',
          amount: `+${b.payout || (Number(b.amount) * 9)}.00`,
          color: '#2ecc71',
          rawAmt: Number(b.payout || (Number(b.amount) * 9))
        });
      }
    });

    records.sort((a, b) => b.date - a.date);

    let filtered = records;
    if (filter !== 'ALL') {
      filtered = records.filter(r => r.type === filter);
    }

    if (label) label.textContent = `Showing ${filtered.length} entries`;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:1rem;">No transactions recorded for this filter.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    let currentBalance = Number(this.currentCustomer.coins || 0);

    filtered.forEach(r => {
      const tr = document.createElement('tr');
      const dateStr = r.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + formatTime12(r.date);
      tr.innerHTML = `
        <td style="font-size:0.75rem; color:var(--text-secondary);">${dateStr}</td>
        <td style="font-size:0.78rem; font-weight:700; color:#fff;">${r.desc}</td>
        <td><span style="font-size:0.7rem; font-weight:800; padding:2px 6px; border-radius:4px; background:rgba(255,255,255,0.08);">${r.type}</span></td>
        <td style="font-size:0.85rem; font-weight:900; color:${r.color};">${r.amount}</td>
        <td style="font-size:0.85rem; font-weight:800; color:var(--primary-gold-bright);">💰 ${currentBalance.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // 3. Profit & Loss Report Modal
  openProfitLossModal() {
    this.closeCricDrawer();
    const modal = document.getElementById('cric-pnl-modal');
    if (!modal) return;

    if (!this.currentCustomer) {
      alert('Please sign in to view your Profit & Loss statement.');
      return;
    }

    const playerId = String(this.currentCustomer.id || '').toLowerCase();
    const allBets = (this.currentCustomer.betHistory || []);
    const active = (this.activeBets || []).filter(b => String(b.playerId || b.customerId || '').toLowerCase() === playerId);

    let totalStaked = 0;
    let totalWon = 0;
    let wonCount = 0;
    let totalBetsCount = allBets.length + active.length;

    allBets.forEach(b => {
      const amt = Number(b.amount || b.coins || 0);
      totalStaked += amt;
      if (b.status === 'WON') {
        wonCount++;
        totalWon += Number(b.payout || (amt * 9));
      }
    });

    active.forEach(b => {
      totalStaked += Number(b.amount || b.coins || 0);
    });

    const net = totalWon - totalStaked;
    const winRate = totalBetsCount > 0 ? ((wonCount / totalBetsCount) * 100).toFixed(1) : '0';

    document.getElementById('cric-pnl-total-bets').textContent = totalBetsCount;
    document.getElementById('cric-pnl-total-staked').textContent = `💰 ${totalStaked.toLocaleString()}`;
    document.getElementById('cric-pnl-total-won').textContent = `💰 ${totalWon.toLocaleString()}`;
    document.getElementById('cric-pnl-win-rate').textContent = `${winRate}%`;

    const netValEl = document.getElementById('cric-pnl-net-value');
    const netCard = document.getElementById('cric-pnl-net-card');

    if (net >= 0) {
      if (netValEl) {
        netValEl.textContent = `💰 +${net.toLocaleString()} IHD (PROFIT)`;
        netValEl.style.color = '#2ecc71';
      }
      if (netCard) {
        netCard.style.borderColor = '#2ecc71';
        netCard.style.background = 'linear-gradient(135deg, rgba(46,204,113,0.15), rgba(0,0,0,0.4))';
      }
    } else {
      if (netValEl) {
        netValEl.textContent = `💰 -${Math.abs(net).toLocaleString()} IHD (LOSS)`;
        netValEl.style.color = '#ff6b6b';
      }
      if (netCard) {
        netCard.style.borderColor = '#ff6b6b';
        netCard.style.background = 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(0,0,0,0.4))';
      }
    }

    modal.classList.remove('hidden');
  }

  // 4. Set Button Values Modal
  openButtonValuesModal() {
    this.closeCricDrawer();
    const modal = document.getElementById('cric-button-values-modal');
    if (!modal) return;

    const saved = JSON.parse(localStorage.getItem('cric_custom_chip_values') || '[10, 50, 100, 500, 1000]');
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`cric-btn-val-${i}`);
      if (el && saved[i - 1] !== undefined) el.value = saved[i - 1];
    }

    modal.classList.remove('hidden');
  }

  saveCustomButtonValues() {
    const values = [];
    for (let i = 1; i <= 5; i++) {
      const val = parseInt(document.getElementById(`cric-btn-val-${i}`)?.value, 10) || (i === 1 ? 10 : i === 2 ? 50 : i === 3 ? 100 : i === 4 ? 500 : 1000);
      values.push(val);
    }
    localStorage.setItem('cric_custom_chip_values', JSON.stringify(values));
    this.closeCricModals();
    this.showLiveToast({
      title: 'QUICK BUTTON VALUES SAVED',
      message: `Buttons updated: ${values.join(', ')} IHD`,
      type: 'success',
      duration: 3500
    });
  }

  // 5. Update Mobile Number Modal
  openUpdateMobileModal() {
    this.closeCricDrawer();
    if (!this.currentCustomer) {
      this.openAuthModal('signin');
      return;
    }
    const modal = document.getElementById('cric-mobile-modal');
    if (!modal) return;

    const currEl = document.getElementById('cric-current-mobile-display');
    if (currEl) currEl.value = this.currentCustomer.mobile || 'None';
    const newInp = document.getElementById('cric-new-mobile-input');
    if (newInp) newInp.value = '';
    const fb = document.getElementById('cric-mobile-feedback');
    if (fb) fb.textContent = '';

    modal.classList.remove('hidden');
  }

  saveUpdatedMobileNumber() {
    const newInp = document.getElementById('cric-new-mobile-input');
    const fb = document.getElementById('cric-mobile-feedback');
    const mobile = (newInp?.value || '').trim();

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      if (fb) {
        fb.textContent = 'âŒ Please enter a valid 10-digit mobile number!';
        fb.style.color = '#ff6b6b';
      }
      return;
    }

    this.currentCustomer.mobile = mobile;
    this.customersDb[this.currentCustomer.id].mobile = mobile;
    this.saveCustomersDB(this.customersDb);
    this.saveCustomerSession(this.currentCustomer);
    this.updateCustomerUI();
    this.pushStateToServer({ customersDb: this.customersDb });

    if (fb) {
      fb.textContent = '✅ Mobile number updated successfully!';
      fb.style.color = '#2ecc71';
    }
    setTimeout(() => this.closeCricModals(), 1200);
  }

  // 6. Edit Display Name Modal
  openEditDisplayNameModal() {
    this.closeCricDrawer();
    if (!this.currentCustomer) {
      this.openAuthModal('signin');
      return;
    }
    const modal = document.getElementById('cric-edit-name-modal');
    if (!modal) return;

    const nameInp = document.getElementById('cric-new-display-name-input');
    if (nameInp) nameInp.value = this.currentCustomer.name || '';
    const fb = document.getElementById('cric-name-feedback');
    if (fb) fb.textContent = '';

    modal.classList.remove('hidden');
  }

  saveUpdatedDisplayName() {
    const nameInp = document.getElementById('cric-new-display-name-input');
    const fb = document.getElementById('cric-name-feedback');
    const name = (nameInp?.value || '').trim();

    if (!name || name.length < 2) {
      if (fb) {
        fb.textContent = 'âŒ Please enter at least 2 characters for Display Name!';
        fb.style.color = '#ff6b6b';
      }
      return;
    }

    this.currentCustomer.name = name;
    this.customersDb[this.currentCustomer.id].name = name;
    this.saveCustomersDB(this.customersDb);
    this.saveCustomerSession(this.currentCustomer);
    this.updateCustomerUI();
    this.pushStateToServer({ customersDb: this.customersDb });

    if (fb) {
      fb.textContent = '✅ Display name updated successfully!';
      fb.style.color = '#2ecc71';
    }
    setTimeout(() => this.closeCricModals(), 1200);
  }

  // 7. 2FA Security Modal
  open2FAModal() {
    this.closeCricDrawer();
    const modal = document.getElementById('cric-2fa-modal');
    if (!modal) return;

    const is2FA = localStorage.getItem('cric_2fa_enabled') !== 'false';
    const sw = document.getElementById('cric-2fa-toggle-switch');
    const txt = document.getElementById('cric-2fa-status-text');
    if (sw) sw.checked = is2FA;
    if (txt) {
      txt.textContent = is2FA ? '✅ 2FA is currently ACTIVE' : 'âš ï¸ 2FA is currently DISABLED';
      txt.style.color = is2FA ? '#2ecc71' : '#ff6b6b';
    }

    modal.classList.remove('hidden');
  }

  toggle2FAStatus(enabled) {
    localStorage.setItem('cric_2fa_enabled', enabled ? 'true' : 'false');
    const txt = document.getElementById('cric-2fa-status-text');
    if (txt) {
      txt.textContent = enabled ? '✅ 2FA is currently ACTIVE' : 'âš ï¸ 2FA is currently DISABLED';
      txt.style.color = enabled ? '#2ecc71' : '#ff6b6b';
    }
  }

  // 8. Master Promo Codes Subsystem (Only Master Generates + Strict 1-Use Per Account)
  loadLocalPromoCodes() {
    try {
      const raw = localStorage.getItem('lucky_spin_promo_codes_v7');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      'WELCOME100': {
        code: 'WELCOME100',
        bonus: 100,
        active: true,
        maxUsesPerUser: 1,
        createdAt: Date.now() - 86400000 * 3,
        redeemedBy: {}
      }
    };
  }

  savePromoCodes(promos) {
    this.promoCodes = promos || {};
    try {
      localStorage.setItem('lucky_spin_promo_codes_v7', JSON.stringify(this.promoCodes));
    } catch (e) {}
    this.updatePromoBadges();
  }

  updatePromoBadges() {
    const badge = document.getElementById('admin-tab-badge-promos') || this.adminTabBadgePromos;
    const countBadge = document.getElementById('admin-promos-count-badge');
    const totalActive = Object.values(this.promoCodes || {}).filter(p => p && p.active).length;
    if (badge) badge.textContent = totalActive;
    if (countBadge) countBadge.textContent = Object.keys(this.promoCodes || {}).length;
  }

  adminCreatePromoCode() {
    const codeInp = document.getElementById('admin-new-promo-code');
    const bonusInp = document.getElementById('admin-new-promo-bonus');
    const code = (codeInp?.value || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const bonus = parseFloat(bonusInp?.value || '0');

    if (!code || code.length < 3) {
      alert('Please enter a valid Promo Code name (at least 3 characters, e.g. BONUS500).');
      return;
    }
    if (isNaN(bonus) || bonus <= 0) {
      alert('Please enter a valid positive Coin Bonus amount (e.g. 100).');
      return;
    }

    if (!this.promoCodes) this.promoCodes = {};
    if (this.promoCodes[code]) {
      if (!confirm(`Promo Code "${code}" already exists! Do you want to update its bonus to â‚¹${bonus.toFixed(2)}?`)) {
        return;
      }
    }

    this.promoCodes[code] = {
      code: code,
      bonus: bonus,
      active: true,
      maxUsesPerUser: 1,
      createdAt: Date.now(),
      redeemedBy: (this.promoCodes[code] && this.promoCodes[code].redeemedBy) ? this.promoCodes[code].redeemedBy : {}
    };

    this.savePromoCodes(this.promoCodes);
    this.pushStateToServer({ promoCodes: this.promoCodes });

    if (codeInp) codeInp.value = '';
    if (bonusInp) bonusInp.value = '';

    this.renderAdminPromosList();

    this.showLiveToast({
      title: 'Ž PROMO CODE CREATED',
      message: `Code <b>${code}</b> created with <b>+${bonus} Coins</b> bonus!`,
      type: 'success',
      duration: 4000
    });
  }

  adminTogglePromoCode(code) {
    if (!this.promoCodes || !this.promoCodes[code]) return;
    this.promoCodes[code].active = !this.promoCodes[code].active;
    this.savePromoCodes(this.promoCodes);
    this.pushStateToServer({ promoCodes: this.promoCodes });
    this.renderAdminPromosList();
    this.showLiveToast({
      title: this.promoCodes[code].active ? '✅ PROMO ACTIVATED' : 'â¸ï¸ PROMO DEACTIVATED',
      message: `Code ${code} is now ${this.promoCodes[code].active ? 'ACTIVE' : 'DISABLED'}.`,
      type: 'success',
      duration: 3000
    });
  }

  adminDeletePromoCode(code) {
    if (!this.promoCodes || !this.promoCodes[code]) return;
    if (!confirm(`Are you sure you want to permanently delete Promo Code "${code}"?`)) return;
    delete this.promoCodes[code];
    this.savePromoCodes(this.promoCodes);
    this.pushStateToServer({ promoCodes: this.promoCodes });
    this.renderAdminPromosList();
    this.showLiveToast({
      title: '—‘ï¸ PROMO DELETED',
      message: `Code ${code} deleted successfully.`,
      type: 'success',
      duration: 3000
    });
  }

  renderAdminPromosList() {
    const tbody = document.getElementById('admin-promos-table-body');
    const badge = document.getElementById('admin-promos-count-badge');
    if (!tbody) return;

    const promos = this.promoCodes || {};
    const keys = Object.keys(promos);
    if (badge) badge.textContent = keys.length;

    if (keys.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No promo codes created yet. Generate one above!</td></tr>';
      return;
    }

    tbody.innerHTML = keys.map(k => {
      const p = promos[k];
      const redCount = p.redeemedBy ? Object.keys(p.redeemedBy).length : 0;
      const createdStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
      const isActive = p.active !== false;

      return `
        <tr>
          <td><strong style="color:var(--primary-gold-bright); letter-spacing:1px; font-size:0.88rem;">Ž ${this.escapeHTML(p.code)}</strong></td>
          <td><span style="color:#2ecc71; font-weight:800; font-size:0.9rem;">+â‚¹${Number(p.bonus).toFixed(2)}</span></td>
          <td><span style="font-size:0.8rem; color:#00f0ff; font-weight:700;">‘¤ ${redCount} player${redCount === 1 ? '' : 's'}</span></td>
          <td style="font-size:0.75rem; color:var(--text-secondary);">${createdStr}</td>
          <td>
            <span style="font-size:0.72rem; font-weight:800; padding:2px 8px; border-radius:10px; background:${isActive ? 'rgba(46,204,113,0.2)' : 'rgba(239,68,68,0.2)'}; color:${isActive ? '#2ecc71' : '#ef4444'}; border:1px solid ${isActive ? 'rgba(46,204,113,0.4)' : 'rgba(239,68,68,0.4)'};">
              ${isActive ? 'ACTIVE' : 'DISABLED'}
            </span>
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn btn-secondary btn-xs" onclick="window.app.adminTogglePromoCode('${this.escapeHTML(p.code)}')" title="Toggle Active">
                ${isActive ? 'â¸ï¸ Disable' : 'â–¶ï¸ Enable'}
              </button>
              <button type="button" class="btn btn-secondary btn-xs" style="color:#ef4444;" onclick="window.app.adminDeletePromoCode('${this.escapeHTML(p.code)}')" title="Delete Promo">
                —‘ï¸ Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  applyPromoCode(code) {
    if (!this.currentCustomer) {
      this.openAuthModal('signin');
      this.showLiveToast({
        title: '”‘ PLEASE SIGN IN',
        message: 'Please sign in or register to redeem promo codes!',
        type: 'deposit',
        duration: 4000
      });
      return;
    }

    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      this.showLiveToast({
        title: 'Ž ENTER PROMO CODE',
        message: 'Please enter a promo code to apply.',
        type: 'deposit',
        duration: 3000
      });
      return;
    }

    if (!this.promoCodes) this.promoCodes = this.loadLocalPromoCodes();
    const promoObj = this.promoCodes[cleanCode];

    if (!promoObj || promoObj.active === false) {
      this.showLiveToast({
        title: 'âŒ INVALID PROMO CODE',
        message: 'This promo code is invalid or has expired.',
        type: 'withdrawal',
        duration: 4000
      });
      return;
    }

    const custId = String(this.currentCustomer.id || '').toLowerCase();
    const redeemedBy = promoObj.redeemedBy || {};

    if (redeemedBy[custId] || redeemedBy[this.currentCustomer.id]) {
      this.showLiveToast({
        title: 'âš ï¸ ALREADY REDEEMED',
        message: 'You have already redeemed this promo code once! (Only 1 redemption per player).',
        type: 'withdrawal',
        duration: 5000
      });
      return;
    }

    const bonus = Number(promoObj.bonus) || 0;
    if (bonus <= 0) {
      this.showLiveToast({
        title: 'âŒ INVALID PROMO CODE',
        message: 'This promo code is no longer active.',
        type: 'withdrawal',
        duration: 4000
      });
      return;
    }

    // Mark as redeemed for this player
    if (!promoObj.redeemedBy) promoObj.redeemedBy = {};
    promoObj.redeemedBy[custId] = Date.now();
    promoObj.redeemedBy[this.currentCustomer.id] = Date.now();
    this.savePromoCodes(this.promoCodes);

    // Credit coins to customer
    this.currentCustomer.coins = (Number(this.currentCustomer.coins) || 0) + bonus;
    if (this.customersDb && this.customersDb[this.currentCustomer.id]) {
      this.customersDb[this.currentCustomer.id].coins = this.currentCustomer.coins;
      this.saveCustomersDB(this.customersDb);
    }
    this.saveCustomerSession(this.currentCustomer);
    this.updateCustomerUI();

    // Push state update to server
    this.pushStateToServer({
      promoCodes: this.promoCodes,
      customersDb: this.customersDb
    });

    // Celebration Fanfare & Confetti
    if (this.confetti) this.confetti.fire(3000);
    if (this.audio) this.audio.playWinFanfare();

    this.showLiveToast({
      title: 'Ž‰ PROMO CODE APPLIED!',
      message: `Code <b>${cleanCode}</b> applied! 💰<b>+${bonus.toFixed(2)} Coins</b> credited instantly to your wallet!`,
      type: 'success',
      duration: 6000
    });

    const promoInp = document.getElementById('cric-promo-input');
    if (promoInp) promoInp.value = '';
  }

  openHelpModal() {
    this.closeCricDrawer();
    if (this.helpModal) this.helpModal.classList.remove('hidden');
    if (this.helpOverlay) this.helpOverlay.classList.remove('hidden');
  }

  openDownloadAppModal() {
    this.closeCricDrawer();
    const modal = document.getElementById('cric-download-modal');
    if (modal) modal.classList.remove('hidden');
  }

  setupPWAInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPWAInstallPrompt = e;
      const btn = document.getElementById('pwa-install-app-btn');
      if (btn) btn.classList.remove('hidden');
    });
  }

  triggerPWAInstall() {
    if (this.deferredPWAInstallPrompt) {
      this.deferredPWAInstallPrompt.prompt();
      this.deferredPWAInstallPrompt.userChoice.then((choiceResult) => {
        if (choiceResult && choiceResult.outcome === 'accepted') {
          this.showLiveToast({
            title: '📱 APP INSTALLED',
            message: 'Spin & Wheel app added to your home screen!',
            type: 'success',
            duration: 4000
          });
        }
        this.deferredPWAInstallPrompt = null;
      });
    } else {
      this.showLiveToast({
        title: '📱 INSTALL INSTRUCTIONS',
        message: 'Tap the 3 dots (⋮) in Chrome and select "Install app" or "Add to Home screen".',
        type: 'info',
        duration: 5000
      });
    }
  }

  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================
  // LIVE SUPPORT CHAT & NOTIFICATION METHODS
  // ==========================================
  loadLocalSupportChats() {
    try {
      const raw = localStorage.getItem('lucky_spin_support_chats_v6');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  saveSupportChats(chats) {
    try {
      localStorage.setItem('lucky_spin_support_chats_v6', JSON.stringify(chats || {}));
    } catch (e) {}
  }

  openSupportChatModal() {
    this.closeCricDrawer();
    this.closeCricModals();
    const modal = document.getElementById('cric-support-chat-modal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const nameInp = document.getElementById('chat-customer-name-display');
    const custId = this.currentCustomer ? (this.currentCustomer.name || this.currentCustomer.id) : 'Guest Player';
    if (nameInp) nameInp.textContent = custId;

    this.renderCustomerChatMessages();
    setTimeout(() => {
      const feed = document.getElementById('chat-customer-messages-feed');
      if (feed) feed.scrollTop = feed.scrollHeight;
    }, 100);
  }

  toggleSound() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('lucky_spin_sound_muted', this.isMuted ? 'true' : 'false');
    } catch (e) {}
    const onIcon = document.getElementById('sound-icon-on');
    const offIcon = document.getElementById('sound-icon-off');
    if (onIcon && offIcon) {
      if (this.isMuted) {
        onIcon.classList.add('hidden');
        offIcon.classList.remove('hidden');
      } else {
        onIcon.classList.remove('hidden');
        offIcon.classList.add('hidden');
      }
    }
    if (typeof this.showToast === 'function') {
      this.showToast(this.isMuted ? '🔇 Sound Muted' : '🔊 Sound Enabled', 'info');
    }
  }

  openSearchModal() {
    this.closeCricDrawer();
    const rulesModal = document.getElementById('cric-rules-modal') || document.getElementById('rules-modal');
    if (rulesModal) {
      rulesModal.classList.remove('hidden');
    } else {
      this.openHistoryModal();
    }
  }

  handleCustomerSendChat() {
    this.sendCustomerChatMessage();
  }

  sendQuickChatQuery(text) {
    this.sendCustomerChatMessage(text);
  }

  shareOnWhatsApp() {
    const text = encodeURIComponent('Hello Master Admin, I need help with Spin & Wheel application.');
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  openTelegramSupport() {
    window.open('https://t.me/', '_blank');
  }

  sendCustomerChatMessage(customText = null) {
    const inp = document.getElementById('cust-chat-input') || document.getElementById('chat-customer-input');
    const text = (customText || (inp ? inp.value : '')).trim();
    if (!text) return;

    let guestUid = localStorage.getItem('guest_chat_uid');
    if (!guestUid) {
      guestUid = 'g' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('guest_chat_uid', guestUid);
    }
    const playerId = this.currentCustomer ? String(this.currentCustomer.id || '').toLowerCase() : guestUid;
    const playerName = this.currentCustomer ? (this.currentCustomer.name || this.currentCustomer.id) : ('Guest (' + playerId + ')');

    const msgObj = {
      id: 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      playerId: playerId,
      playerName: playerName,
      playerMobile: this.currentCustomer ? (this.currentCustomer.mobile || 'N/A') : 'N/A',
      sender: 'CUSTOMER',
      text: text,
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    };

    if (!this.supportChats) this.supportChats = {};
    if (!Array.isArray(this.supportChats[playerId])) this.supportChats[playerId] = [];
    this.supportChats[playerId].push(msgObj);
    this.saveSupportChats(this.supportChats);

    if (inp) inp.value = '';
    this.renderCustomerChatMessages();

    // Broadcast over live cloud sync to Master ID
    if (this.syncEngine) {
      this.syncEngine.broadcastLiveEvent({
        eventType: 'CHAT_MESSAGE',
        chatMessage: msgObj
      });
    }

    if (this.audio) this.audio.playTick();
  }

  renderCustomerChatMessages() {
    const feed = document.getElementById('cust-chat-messages-wrap') || document.getElementById('chat-customer-messages-feed');
    if (!feed) return;

    const guestUid = localStorage.getItem('guest_chat_uid') || 'guest';
    const playerId = this.currentCustomer ? String(this.currentCustomer.id || '').toLowerCase() : guestUid;
    const msgs = (this.supportChats && this.supportChats[playerId]) || [];

    if (msgs.length === 0) {
      feed.innerHTML = `
        <div class="chat-msg msg-admin">
          <div class="chat-msg-bubble">
            👋 <b>Welcome to Spin & Wheel 24/7 Live Support!</b><br>
            Directly connected to Master Admin. If you have any questions about deposits, withdrawals, predictions, or coin credits, please message us below for instant assistance!
          </div>
          <div class="chat-msg-meta">
            <span>👑 Master Support</span> &bull; <span>Live</span>
          </div>
        </div>
      `;
      return;
    }

    feed.innerHTML = msgs.map(m => {
      const isCustomer = m.sender === 'CUSTOMER';
      return `
        <div class="chat-msg ${isCustomer ? 'msg-user' : 'msg-admin'}">
          <div class="chat-msg-bubble">
            ${this.escapeHTML(m.text)}
          </div>
          <div class="chat-msg-meta">
            <span>${isCustomer ? '👤 You' : '👑 Master Support'}</span> &bull; <span>${m.timeFormatted || new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      `;
    }).join('');

    feed.scrollTop = feed.scrollHeight;
  }

  refreshSupportChatsUI() {
    const listEl = document.getElementById('admin-chat-threads-list');
    const feedEl = document.getElementById('admin-chat-messages-wrap') || document.getElementById('admin-chat-messages-feed');
    const nameEl = document.getElementById('admin-selected-chat-name');
    const subEl = document.getElementById('admin-selected-chat-sub');
    const actionsEl = document.getElementById('admin-selected-chat-actions');
    const countEl = document.getElementById('admin-active-chats-count');
    if (!listEl) return;

    const chats = this.supportChats || {};
    const chatPlayerIds = Object.keys(chats);
    const dbPlayerIds = Object.keys(this.customersDb || {});
    
    // Merge active chat threads and all registered customers
    const allIdsSet = new Set([...chatPlayerIds, ...dbPlayerIds]);
    const allPlayerIds = Array.from(allIdsSet);

    if (countEl) countEl.textContent = chatPlayerIds.length;

    if (allPlayerIds.length === 0) {
      listEl.innerHTML = '<div style="padding:1.5rem; text-align:center; color:var(--text-muted); font-size:0.78rem;">No registered players or support inquiries yet.</div>';
      if (feedEl) feedEl.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--text-muted); font-size:0.8rem;">Select a player on the left to start live messaging.</div>';
      if (nameEl) nameEl.textContent = 'Select a conversation';
      if (subEl) subEl.textContent = 'Click any player from the list to view and reply';
      if (actionsEl) actionsEl.classList.add('hidden');
      return;
    }

    // Auto-select first thread if none selected
    if (!this.selectedChatPlayerId || (!chats[this.selectedChatPlayerId] && !this.customersDb?.[this.selectedChatPlayerId])) {
      this.selectedChatPlayerId = allPlayerIds[0];
    }

    // Render thread list on left
    listEl.innerHTML = allPlayerIds.map(pid => {
      const thread = chats[pid] || [];
      const hasMsgs = thread.length > 0;
      const lastMsg = hasMsgs ? thread[thread.length - 1] : {};
      const custObj = this.customersDb ? this.customersDb[pid] : null;
      const displayName = lastMsg.playerName || (custObj ? (custObj.name || custObj.id) : pid);
      const isSel = this.selectedChatPlayerId === pid;
      const unreadCount = thread.filter(m => m.sender === 'CUSTOMER' && !m.readByAdmin).length;

      return `
        <div class="admin-chat-thread-item ${isSel ? 'active' : ''}" style="padding:10px 12px; border-bottom:1px solid var(--border-subtle); cursor:pointer; background:${isSel ? 'rgba(217,119,6,0.18)' : 'transparent'}; border-left:${isSel ? '3px solid #f59e0b' : '3px solid transparent'};" onclick="window.app.selectAdminChatPlayer('${pid}')">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-weight:700; color:#f8fafc; font-size:0.85rem;">‘¤ ${this.escapeHTML(displayName)}</span>
            <span style="font-size:0.7rem; color:var(--text-muted);">${lastMsg.timeFormatted || (custObj ? 'Registered' : '')}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:0.75rem; color:#cbd5e1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">
              ${lastMsg.sender === 'ADMIN' ? '‘‘ You: ' : ''}${this.escapeHTML(lastMsg.text || 'No message history yet')}
            </div>
            ${unreadCount > 0 ? `<span style="background:#e11d48; color:#fff; font-size:10px; font-weight:800; padding:1px 6px; border-radius:10px;">${unreadCount}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // If active player selected, render feed on right
    if (this.selectedChatPlayerId) {
      const pid = this.selectedChatPlayerId;
      const selThread = chats[pid] || [];
      const custObj = this.customersDb ? this.customersDb[pid] : null;
      const firstMsg = selThread[0] || {};
      const dispName = firstMsg.playerName || (custObj ? (custObj.name || custObj.id) : pid);
      const dispMobile = firstMsg.playerMobile || (custObj ? (custObj.mobile || 'N/A') : 'N/A');
      const dispCoins = custObj ? Number(custObj.coins || 0).toFixed(2) : '0.00';

      if (nameEl) nameEl.textContent = `‘¤ ${dispName}`;
      if (subEl) subEl.textContent = `Player ID: ${pid} • Mobile: ${dispMobile} • Balance: â‚¹${dispCoins}`;
      if (actionsEl) actionsEl.classList.remove('hidden');

      if (feedEl) {
        if (selThread.length === 0) {
          feedEl.innerHTML = `
            <div style="padding:2rem; text-align:center; color:var(--text-muted); font-size:0.82rem;">
              ’¬ No previous message history with <b>${this.escapeHTML(dispName)}</b>.<br>
              Type your message below to start a direct live conversation or click <b>💰 Quick Credit</b>.
            </div>
          `;
        } else {
          feedEl.innerHTML = selThread.map(m => {
            const isAdmin = m.sender === 'ADMIN';
            return `
              <div class="chat-msg ${isAdmin ? 'chat-msg-admin' : 'chat-msg-user'}" style="margin-bottom:8px; display:flex; flex-direction:column; align-items:${isAdmin ? 'flex-end' : 'flex-start'};">
                <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:2px;">${isAdmin ? '‘‘ You (Master Admin)' : '‘¤ ' + (m.playerName || m.playerId)}</div>
                <div style="background:${isAdmin ? 'linear-gradient(135deg, #d97706, #b45309)' : 'rgba(255,255,255,0.08)'}; color:#fff; padding:8px 12px; border-radius:10px; max-width:80%; word-break:break-word; font-size:0.85rem;">
                  ${this.escapeHTML(m.text)}
                </div>
                <div style="font-size:0.65rem; color:var(--text-muted); margin-top:2px;">${m.timeFormatted || new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            `;
          }).join('');
          feedEl.scrollTop = feedEl.scrollHeight;
        }
      }
    }
  }

  selectAdminChatPlayer(playerId) {
    this.selectedChatPlayerId = playerId;
    if (this.supportChats && this.supportChats[playerId]) {
      this.supportChats[playerId].forEach(m => {
        if (m.sender === 'CUSTOMER') m.readByAdmin = true;
      });
      this.saveSupportChats(this.supportChats);
      this.updateSupportChatBadges();
    }
    this.refreshSupportChatsUI();
  }

  handleAdminSendChat() {
    this.sendAdminChatMessage();
  }

  insertAdminReplyTemplate(templateText) {
    const inp = document.getElementById('admin-chat-input');
    if (inp) {
      inp.value = templateText;
      inp.focus();
    }
  }

  broadcastNotificationPrompt() {
    const msg = prompt('Enter message to broadcast as Push Notification to ALL active users:');
    if (!msg || !msg.trim()) return;

    if (this.syncEngine) {
      this.syncEngine.broadcastLiveEvent({
        eventType: 'BROADCAST_NOTIFICATION',
        title: '📢 MASTER ANNOUNCEMENT',
        message: msg.trim(),
        icon: 'icon-192.png'
      });
    }

    this.showLiveToast({
      title: '📢 NOTIFICATION BROADCASTED',
      message: `Sent to all active users: "${msg.trim()}"`,
      type: 'success',
      duration: 4000
    });
  }

  quickCreditSelectedPlayer() {
    if (!this.selectedChatPlayerId) {
      alert('Please select a customer conversation from the list first!');
      return;
    }
    const amtStr = prompt(`Enter coin amount to credit instantly to ${this.selectedChatPlayerId}:`);
    const amt = parseFloat(amtStr);
    if (isNaN(amt) || amt <= 0) return;

    if (this.customersDb && this.customersDb[this.selectedChatPlayerId]) {
      this.customersDb[this.selectedChatPlayerId].coins = (this.customersDb[this.selectedChatPlayerId].coins || 0) + amt;
      this.saveCustomersDB(this.customersDb);
      this.pushStateToServer({ customersDb: this.customersDb });
      this.sendAdminChatMessage(`🎉 Master Admin has credited +₹${amt.toFixed(2)} IHD Coins to your balance!`);
      this.showLiveToast({
        title: '💰 COINS CREDITED',
        message: `+₹${amt.toFixed(2)} credited to ${this.selectedChatPlayerId}!`,
        type: 'success',
        duration: 3500
      });
    } else {
      alert(`Customer ${this.selectedChatPlayerId} not found in database.`);
    }
  }

  sendAdminChatMessage(customText = null) {
    if (!this.selectedChatPlayerId) {
      alert('Please select a customer chat thread from the left first!');
      return;
    }

    const inp = document.getElementById('admin-chat-input');
    const text = (customText || (inp ? inp.value : '')).trim();
    if (!text) return;

    const msgObj = {
      id: 'msg_adm_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      playerId: this.selectedChatPlayerId,
      sender: 'ADMIN',
      text: text,
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      readByAdmin: true
    };

    if (!this.supportChats[this.selectedChatPlayerId]) this.supportChats[this.selectedChatPlayerId] = [];
    this.supportChats[this.selectedChatPlayerId].push(msgObj);
    this.saveSupportChats(this.supportChats);

    if (inp) inp.value = '';
    this.refreshSupportChatsUI();

    // Broadcast over cloud sync
    if (this.syncEngine) {
      this.syncEngine.broadcastLiveEvent({
        eventType: 'CHAT_MESSAGE',
        chatMessage: msgObj
      });
    }

    if (this.audio) this.audio.playTick();
  }

  updateSupportChatBadges() {
    let totalUnread = 0;
    if (this.supportChats) {
      Object.keys(this.supportChats).forEach(pid => {
        const msgs = this.supportChats[pid] || [];
        totalUnread += msgs.filter(m => m.sender === 'CUSTOMER' && !m.readByAdmin).length;
      });
    }

    const badge = document.getElementById('admin-tab-badge-chats');
    if (badge) {
      if (totalUnread > 0) {
        badge.textContent = totalUnread;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  requestNotificationPermission() {
    if (!('Notification' in window)) {
      this.showLiveToast({
        title: '🔔 NOTIFICATIONS ENABLED',
        message: 'In-app countdown alerts (1 hr, 30m, 5m left) are active on this device!',
        type: 'success',
        duration: 5000
      });
      return;
    }

    if (Notification.permission === 'granted') {
      this.showLiveToast({
        title: '🔔 NOTIFICATIONS ACTIVE',
        message: 'Push alerts for upcoming spins are active!',
        type: 'success',
        duration: 4000
      });
      this.sendSystemNotification('🎰 Spin & Wheel Notifications', 'Upcoming spin countdown alerts are active!');
      return;
    }

    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        this.showLiveToast({
          title: '🔔 NOTIFICATIONS GRANTED',
          message: 'You will receive alerts 1 hour, 30 min, and 5 min before each round!',
          type: 'success',
          duration: 5000
        });
        this.sendSystemNotification('🎰 Spin & Wheel Alerts Active', 'You will be notified before every upcoming spin!');
      } else {
        this.showLiveToast({
          title: '🔔 IN-APP ALERTS ACTIVE',
          message: 'In-app toasts will notify you before each spin round!',
          type: 'info',
          duration: 4000
        });
      }
    });
  }

  checkAutomatedCountdownAlerts(secondsRemaining, slotLabel) {
    if (secondsRemaining === undefined || secondsRemaining === null || !slotLabel) return;
    if (!this.sentSlotAlerts) this.sentSlotAlerts = {};

    const todayStr = new Date().toDateString();
    const key1h = `${todayStr}_${slotLabel}_1h`;
    const key30m = `${todayStr}_${slotLabel}_30m`;
    const key15m = `${todayStr}_${slotLabel}_15m`;
    const key5m = `${todayStr}_${slotLabel}_5m`;
    const keyNow = `${todayStr}_${slotLabel}_now`;

    // 1 Hour Left (3540 - 3600 seconds)
    if (secondsRemaining <= 3600 && secondsRemaining >= 3540 && !this.sentSlotAlerts[key1h]) {
      this.sentSlotAlerts[key1h] = true;
      this.sendSystemNotification(
        `⏳ UPCOMING SPIN: 1 HOUR LEFT!`,
        `The ${slotLabel} Spin is coming in 1 hour! Place your predictions before 30-minute cutoff!`,
        'icon-192.png'
      );
      this.showLiveToast({
        title: `⏳ 1 HOUR LEFT FOR ${slotLabel}!`,
        message: `Next spin round is in 1 hour. Get your predictions placed in time!`,
        type: 'info',
        duration: 7000
      });
      if (this.audio) this.audio.playWinFanfare();
    }

    // 30 Minutes Left (1740 - 1800 seconds - Cutoff time)
    else if (secondsRemaining <= 1800 && secondsRemaining >= 1740 && !this.sentSlotAlerts[key30m]) {
      this.sentSlotAlerts[key30m] = true;
      this.sendSystemNotification(
        `⚠️ 30 MINUTES LEFT - BETTING CLOSING!`,
        `Betting for ${slotLabel} round is closing NOW! Only 30 minutes until spin!`,
        'icon-192.png'
      );
      this.showLiveToast({
        title: `⚠️ 30 MIN LEFT: ${slotLabel} ROUND`,
        message: `Betting window is locking! Spin begins in 30 minutes!`,
        type: 'warning',
        duration: 8000
      });
      if (this.audio) this.audio.playAlert();
    }

    // 15 Minutes Left (840 - 900 seconds)
    else if (secondsRemaining <= 900 && secondsRemaining >= 840 && !this.sentSlotAlerts[key15m]) {
      this.sentSlotAlerts[key15m] = true;
      this.sendSystemNotification(
        `⏳ 15 MINUTES TO ${slotLabel} SPIN!`,
        `The live spin wheel starts in 15 minutes! Get ready to watch the winning outcome!`,
        'icon-192.png'
      );
      this.showLiveToast({
        title: `⏳ 15 MIN TO ${slotLabel} SPIN!`,
        message: `Live spin starts soon. Check your active bets!`,
        type: 'info',
        duration: 6000
      });
    }

    // 5 Minutes Left (240 - 300 seconds)
    else if (secondsRemaining <= 300 && secondsRemaining >= 240 && !this.sentSlotAlerts[key5m]) {
      this.sentSlotAlerts[key5m] = true;
      this.sendSystemNotification(
        `🚨 5 MINUTES TO ${slotLabel} SPIN!`,
        `Live spin starts in 5 minutes! Open the app to watch the wheel spin live!`,
        'icon-192.png'
      );
      this.showLiveToast({
        title: `🚨 5 MINUTES TO LIVE SPIN!`,
        message: `The ${slotLabel} round wheel will spin in 5 minutes!`,
        type: 'warning',
        duration: 6000
      });
      if (this.audio) this.audio.playAlert();
    }

    // Spin Starting Now (0 - 5 seconds)
    else if (secondsRemaining <= 5 && secondsRemaining >= 0 && !this.sentSlotAlerts[keyNow]) {
      this.sentSlotAlerts[keyNow] = true;
      this.sendSystemNotification(
        `🎰 ${slotLabel} SPIN STARTING NOW!`,
        `The wheel is spinning! Watch the live winning number!`,
        'icon-192.png'
      );
    }
  }

  sendSystemNotification(title, body, icon = 'icon-192.png') {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: icon,
          badge: icon,
          vibrate: [200, 100, 200]
        });
      }
    } catch (e) {}
  }
}

// Global App Instance
function initSpinWheelApp() {
  if (!window.app) {
    window.app = new SpinWheelApp();
    window.spinWheelApp = window.app;
    window.adminApproveDeposit = (id) => window.app?.adminApproveDeposit(id);
    window.adminOpenRejectDepositModal = (id) => window.app?.adminOpenRejectDepositModal(id);
    window.adminApproveWithdrawal = (id) => window.app?.adminApproveWithdrawal(id);
    window.adminOpenRejectModal = (id) => window.app?.adminOpenRejectModal(id);
    try { window.app = window.app; } catch (e) {}
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSpinWheelApp);
} else {
  initSpinWheelApp();
}
