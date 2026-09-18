// Vercel Serverless Function: Shared Central State API (/api/state)
// Allows real-time live synchronization between PC and all mobile devices globally!

let globalState = {
  slices: [7, 18, 26, 33, 42, 59, 68, 77, 86, 94],
  history: [],
  forcedNext: null,
  upcomingQueue: ["AUTO", "AUTO", "AUTO"],
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
