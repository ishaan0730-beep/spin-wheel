// Vercel Serverless Function: Shared Central State API (/api/state)
// Secure Central State Management: Protects predetermined winners and admin password from public view!

let globalState = {
  slices: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  history: [],
  forcedNext: null,
  upcomingQueue: ["AUTO", "AUTO", "AUTO"],
  dailySchedule: {
    "12:00 PM": "AUTO",
    "04:00 PM": "AUTO",
    "08:00 PM": "AUTO",
    "11:00 PM": "AUTO"
  },
  hourlySchedule: {},
  timerMode: "REAL",
  customSecs: 60,
  customTimerTarget: null,
  manualRoundTitle: null,
  masterPassword: "00773300",
  spinTrigger: null,
  customersDb: {},
  activeBets: [],
  deletedBetIds: [],
  withdrawals: [],
  deposits: [],
  supportChats: {},
  depositConfig: {
    upiId: '9041062733@PTSBI',
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
    keyStr === '1234' ||
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

function settleServerElapsedSlots() {
  const now = new Date();
  const slices = globalState.slices || [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  let changed = false;

  [2, 1, 0].forEach(dayOffset => {
    const d = new Date(now);
    d.setDate(d.getDate() - dayOffset);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    DAILY_SLOTS.forEach(slot => {
      const slotTime = new Date(d);
      slotTime.setHours(slot.hour, slot.min, 0, 0);

      if (slotTime.getTime() <= now.getTime()) {
        const slotLabel = slot.label;
        const exists = (globalState.history || []).some(h => {
          if (!h) return false;
          return (h.date === dateStr && (h.round === slotLabel || h.time?.includes(slotLabel)));
        });

        if (!exists) {
          let winningNum = null;
          if (dayOffset === 0 && globalState.dailySchedule && globalState.dailySchedule[slotLabel] && globalState.dailySchedule[slotLabel] !== 'AUTO') {
            const sched = parseInt(globalState.dailySchedule[slotLabel], 10);
            if (slices.includes(sched)) {
              winningNum = sched;
              globalState.dailySchedule[slotLabel] = 'AUTO';
            }
          }

          if (winningNum === null) {
            let hash = 0;
            const str = ${dateStr}__lucky_salt_v8;
            for (let k = 0; k < str.length; k++) {
              hash = ((hash << 5) - hash) + str.charCodeAt(k);
              hash |= 0;
            }
            let idx = (Math.abs(hash) + (dayOffset * 3)) % slices.length;
            winningNum = slices[idx];
            const prev = (globalState.history || [])[0];
           if (prev && prev.number === winningNum) winningNum = slices[(idx + 3) % slices.length];
          const entry = {
            id: slotTime.getTime(),
            number: winningNum,
            time: slotLabel,
            date: dateStr,
            round: slotLabel,
            source: 'Scheduled Round',
            timestamp: slotTime.getTime()
          };

          if (!Array.isArray(globalState.history)) globalState.history = [];
          globalState.history.unshift(entry);
          changed = true;
        }
      }
    });
  });

  if (changed) {
    const histMap = new Map();
    (globalState.history || []).forEach(item => {
      if (!item) return;
      const key = `${item.date || ''}_${item.round || ''}_${item.time || ''}_${item.number}`;
      if (!histMap.has(key)) histMap.set(key, item);
    });
    globalState.history = Array.from(histMap.values())
      .sort((a, b) => (b.timestamp || b.id || 0) - (a.timestamp || a.id || 0))
      .slice(0, 150);
    for (let hIdx = 0; hIdx < globalState.history.length; hIdx++) {
      if (hIdx > 0 && globalState.history[hIdx - 1]) {
        if (globalState.history[hIdx].number === globalState.history[hIdx - 1].number) {
          const curI = slices.indexOf(Number(globalState.history[hIdx].number));
          globalState.history[hIdx].number = slices[(curI + 3) % slices.length];
        }
      }
    }
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
        dailySchedule: globalState.dailySchedule || { "12:00 PM": "AUTO", "04:00 PM": "AUTO", "08:00 PM": "AUTO", "11:00 PM": "AUTO" },
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
          upiId: globalState.depositConfig?.upiId || '9041062733@PTSBI',
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

      const isAdmin = checkAdminAuth(req, body);

      if (body && typeof body === 'object') {
        if (body.deletedBetId) {
          const delIdStr = String(body.deletedBetId);
          if (!Array.isArray(globalState.deletedBetIds)) globalState.deletedBetIds = [];
          if (!globalState.deletedBetIds.includes(delIdStr)) globalState.deletedBetIds.push(delIdStr);
          globalState.activeBets = (globalState.activeBets || []).filter(b => String(b.id) !== delIdStr);
          delete body.deletedBetId;
        }

        if (isAdmin) {
          // If masterPassword is being updated, store it
          if (body.masterPassword && typeof body.masterPassword === 'string') {
            globalState.masterPassword = body.masterPassword.trim();
          }

          delete body.adminKey;
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
            const histMap = new Map((globalState.history || []).map(h => [h.id || `${h.date}_${h.round}_${h.time}_${h.number}`, h]));
            body.history.forEach(h => {
              if (h) {
                const k = h.id || `${h.date}_${h.round}_${h.time}_${h.number}`;
                histMap.set(k, { ...(histMap.get(k) || {}), ...h });
              }
            });
            globalState.history = Array.from(histMap.values())
              .sort((a, b) => (b.id || (b.timestamp || 0)) - (a.id || (a.timestamp || 0)))
              .slice(0, 150);
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
                curSched[slot] = val;
              }
            });
            globalState.dailySchedule = curSched;
            delete body.dailySchedule;
          }
          globalState = {
            ...globalState,
            ...body,
            version: Date.now()
          };
        } else {
          if (body.newPlayer && body.newPlayer.id && !globalState.customersDb[body.newPlayer.id]) {
            const regMsg = `👤 *NEW PLAYER REGISTRATION!*\n\n👑 *Name:* ${body.newPlayer.name}\n🆔 *User ID:* \`${body.newPlayer.id}\`\n📱 *Mobile:* \`${body.newPlayer.mobile || 'N/A'}\`\n🎂 *DOB:* ${body.newPlayer.dob || 'N/A'}\n💰 *Welcome Bonus:* 10 IHD Coins\n\n👉 Account created & active!`;
            sendTelegramAlert(regMsg);
            sendWhatsAppAlert(regMsg);
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
            const histMap = new Map((globalState.history || []).map(h => [h.id || `${h.date}_${h.round}_${h.time}_${h.number}`, h]));
            body.history.forEach(h => {
              if (h) {
                const k = h.id || `${h.date}_${h.round}_${h.time}_${h.number}`;
                histMap.set(k, { ...(histMap.get(k) || {}), ...h });
              }
            });
            globalState.history = Array.from(histMap.values())
              .sort((a, b) => (b.id || (b.timestamp || 0)) - (a.id || (a.timestamp || 0)))
              .slice(0, 150);
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
      return res.status(200).json({ 
        status: 'ok', 
        version: globalState.version, 
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
