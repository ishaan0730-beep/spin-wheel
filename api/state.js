// Vercel Serverless Function: Shared Central State API (/api/state)
// Allows real-time live synchronization between PC and all mobile devices globally!

let globalState = {
  slices: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  history: [
    { id: 1789769291721, number: 80, time: "11:00 PM", date: "Sep 24", round: "11:00 PM", source: "Live Slot Round" },
    { id: 1789768890761, number: 70, time: "08:00 PM", date: "Sep 24", round: "08:00 PM", source: "Live Slot Round" },
    { id: 1789768058759, number: 40, time: "04:00 PM", date: "Sep 24", round: "04:00 PM", source: "Live Slot Round" }
  ],
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
  version: 1
};

export default function handler(req, res) {
  // Enable full CORS for cross-device access
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, *');
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
    return res.status(200).json(globalState);
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (err) {}
      }

      if (body && typeof body === 'object') {
        globalState = {
          ...globalState,
          ...body,
          version: Date.now()
        };
      }
      return res.status(200).json({ status: 'ok', version: globalState.version });
    } catch (e) {
      return res.status(400).json({ error: 'Failed to parse state' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
