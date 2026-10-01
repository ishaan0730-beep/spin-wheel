$folder = $PSScriptRoot
if (-not $folder) { $folder = (Get-Location).Path }

# Detect all active LAN / Wi-Fi / Hotspot IPv4 addresses
$allIPs = @()
try {
    $ipObjs = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { 
        $_.InterfaceAlias -notlike '*Loopback*' -and 
        $_.IPAddress -notlike '169.254*' -and
        $_.IPAddress -notlike '127.*'
    }
    foreach ($item in $ipObjs) {
        if ($item.IPAddress -and -not ($allIPs -contains $item.IPAddress)) {
            $allIPs += $item.IPAddress
        }
    }
} catch {}

$code = @'
using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Collections.Generic;
using System.Web.Script.Serialization;

public class NativeHttpServer {
    private TcpListener listener;
    private string folder;
    private string stateFile;
    private bool running;
    public int ActivePort { get; private set; }
    private static readonly object stateLock = new object();

    public NativeHttpServer(string webFolder) {
        folder = webFolder;
        stateFile = Path.Combine(folder, "server_state.json");
        EnsureDefaultState();

        int[] tryPorts = new int[] { 3000, 5000, 5500, 8000, 8080, 8088, 9000, 9090 };
        foreach (int p in tryPorts) {
            try {
                TcpListener test = new TcpListener(IPAddress.Any, p);
                test.Start();
                test.Stop();
                ActivePort = p;
                listener = new TcpListener(IPAddress.Any, p);
                break;
            } catch {}
        }
        if (ActivePort == 0) {
            ActivePort = 3000;
            listener = new TcpListener(IPAddress.Any, 3000);
        }
    }

    private void EnsureDefaultState() {
        lock (stateLock) {
            if (!File.Exists(stateFile)) {
                string defaultJson = @"{
                    ""slices"": [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                    ""history"": [],
                    ""forcedNext"": null,
                    ""upcomingQueue"": [""AUTO"", ""AUTO"", ""AUTO""],
                    ""dailySchedule"": { ""12:00 PM"": ""AUTO"", ""04:00 PM"": ""AUTO"", ""08:00 PM"": ""AUTO"", ""11:00 PM"": ""AUTO"" },
                    ""hourlySchedule"": {},
                    ""timerMode"": ""REAL"",
                    ""customSecs"": 60,
                    ""customTimerTarget"": null,
                    ""manualRoundTitle"": null,
                    ""masterPassword"": ""00773300"",
                    ""spinTrigger"": null,
                    ""customersDb"": {},
                    ""activeBets"": [],
                    ""deletedBetIds"": [],
                    ""withdrawals"": [],
                    ""deposits"": [],
                    ""depositConfig"": { ""upiId"": ""9041062733@PTSBI"", ""accountName"": ""DEEP"", ""qrImageUrl"": """", ""minDeposit"": 100, ""instructions"": ""1. Scan QR with PhonePe / GPay / Paytm & Pay.\n2. Enter 12-digit UTR No. & upload payment screenshot below."" },
                    ""notificationConfig"": { ""telegramBotToken"": """", ""telegramChatId"": """", ""telegramEnabled"": false, ""whatsappNumber"": """" },
                    ""version"": 1
                }";
                File.WriteAllText(stateFile, defaultJson, new UTF8Encoding(false));
            }
        }
    }

    public void Start() {
        listener.Start();
        running = true;
        while (running) {
            try {
                TcpClient client = listener.AcceptTcpClient();
                ThreadPool.QueueUserWorkItem(ProcessClient, client);
            } catch {
                if (!running) break;
            }
        }
    }

    private void ProcessClient(object obj) {
        TcpClient client = (TcpClient)obj;
        try {
            using (NetworkStream stream = client.GetStream()) {
                stream.ReadTimeout = 6000;
                stream.WriteTimeout = 6000;
                
                byte[] headerBuffer = new byte[8192];
                int totalRead = 0;
                int headerEndIndex = -1;

                while (totalRead < headerBuffer.Length) {
                    int r = stream.Read(headerBuffer, totalRead, headerBuffer.Length - totalRead);
                    if (r <= 0) break;
                    totalRead += r;

                    string partial = Encoding.ASCII.GetString(headerBuffer, 0, totalRead);
                    headerEndIndex = partial.IndexOf("\r\n\r\n");
                    if (headerEndIndex != -1) break;
                }

                if (totalRead <= 0 || headerEndIndex == -1) return;

                string headerString = Encoding.UTF8.GetString(headerBuffer, 0, headerEndIndex);
                string[] headerLines = headerString.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None);
                if (headerLines.Length == 0) return;

                string[] reqParts = headerLines[0].Split(' ');
                if (reqParts.Length < 2) return;

                string method = reqParts[0].ToUpper();
                string url = reqParts[1].Split('?')[0];

                // Extract Content-Length for POST requests
                int contentLength = 0;
                foreach (string line in headerLines) {
                    if (line.StartsWith("Content-Length:", StringComparison.OrdinalIgnoreCase)) {
                        int.TryParse(line.Substring(15).Trim(), out contentLength);
                        break;
                    }
                }

                // OPTIONS PREFLIGHT HANDLING
                if (method == "OPTIONS") {
                    string optHeader = "HTTP/1.1 200 OK\r\n" +
                                       "Access-Control-Allow-Origin: *\r\n" +
                                       "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n" +
                                       "Access-Control-Allow-Headers: Content-Type, Authorization, *\r\n" +
                                       "Content-Length: 0\r\n" +
                                       "Connection: close\r\n\r\n";
                    byte[] optBytes = Encoding.UTF8.GetBytes(optHeader);
                    stream.Write(optBytes, 0, optBytes.Length);
                    stream.Flush();
                    return;
                }

                // SHARED STATE API: /api/state
                if (url.Equals("/api/state", StringComparison.OrdinalIgnoreCase)) {
                    if (method == "GET") {
                        byte[] jsonBytes;
                        lock (stateLock) {
                            EnsureDefaultState();
                            jsonBytes = File.ReadAllBytes(stateFile);
                        }
                        string header = "HTTP/1.1 200 OK\r\n" +
                                        "Content-Type: application/json; charset=utf-8\r\n" +
                                        "Content-Length: " + jsonBytes.Length + "\r\n" +
                                        "Access-Control-Allow-Origin: *\r\n" +
                                        "Cache-Control: no-store, no-cache, must-revalidate\r\n" +
                                        "Connection: close\r\n\r\n";
                        byte[] headerBytes = Encoding.UTF8.GetBytes(header);
                        stream.Write(headerBytes, 0, headerBytes.Length);
                        stream.Write(jsonBytes, 0, jsonBytes.Length);
                        stream.Flush();
                        return;
                    } else if (method == "POST") {
                        int bodyStart = headerEndIndex + 4;
                        int initialBodyBytes = totalRead - bodyStart;

                        byte[] bodyBuffer = new byte[contentLength > 0 ? contentLength : Math.Max(initialBodyBytes, 1024)];
                        int bodyBytesRead = 0;

                        if (initialBodyBytes > 0) {
                            int toCopy = Math.Min(initialBodyBytes, bodyBuffer.Length);
                            Array.Copy(headerBuffer, bodyStart, bodyBuffer, 0, toCopy);
                            bodyBytesRead = toCopy;
                        }

                        while (bodyBytesRead < contentLength) {
                            int r = stream.Read(bodyBuffer, bodyBytesRead, contentLength - bodyBytesRead);
                            if (r <= 0) break;
                            bodyBytesRead += r;
                        }

                        string bodyJson = Encoding.UTF8.GetString(bodyBuffer, 0, bodyBytesRead);
                        if (!string.IsNullOrWhiteSpace(bodyJson) && bodyJson.Trim().StartsWith("{")) {
                            lock (stateLock) {
                                try {
                                    EnsureDefaultState();
                                    var serializer = new JavaScriptSerializer();
                                    serializer.MaxJsonLength = 50 * 1024 * 1024;
                                    string currentJson = File.ReadAllText(stateFile, Encoding.UTF8);
                                    var currentObj = serializer.Deserialize<Dictionary<string, object>>(currentJson);
                                    var incomingObj = serializer.Deserialize<Dictionary<string, object>>(bodyJson);

                                    if (currentObj != null && incomingObj != null) {
                                        foreach (KeyValuePair<string, object> kvp in incomingObj) {
                                            var inDep = kvp.Value as Dictionary<string, object>;
                                            var inList = kvp.Value as System.Collections.IEnumerable;

                                            if (kvp.Key == "depositConfig" && inDep != null) {
                                                var curDep = (currentObj.ContainsKey("depositConfig") && currentObj["depositConfig"] is Dictionary<string, object>) 
                                                    ? (Dictionary<string, object>)currentObj["depositConfig"] 
                                                    : new Dictionary<string, object>();
                                                foreach (KeyValuePair<string, object> dKvp in inDep) {
                                                    curDep[dKvp.Key] = dKvp.Value;
                                                }
                                                currentObj["depositConfig"] = curDep;
                                            } else if (kvp.Key == "notificationConfig" && inDep != null) {
                                                var curNotif = (currentObj.ContainsKey("notificationConfig") && currentObj["notificationConfig"] is Dictionary<string, object>) 
                                                    ? (Dictionary<string, object>)currentObj["notificationConfig"] 
                                                    : new Dictionary<string, object>();
                                                foreach (KeyValuePair<string, object> nKvp in inDep) {
                                                    curNotif[nKvp.Key] = nKvp.Value;
                                                }
                                                currentObj["notificationConfig"] = curNotif;
                                            } else if (kvp.Key == "customersDb" && inDep != null) {
                                                var curCust = (currentObj.ContainsKey("customersDb") && currentObj["customersDb"] is Dictionary<string, object>) 
                                                    ? (Dictionary<string, object>)currentObj["customersDb"] 
                                                    : new Dictionary<string, object>();
                                                foreach (KeyValuePair<string, object> cKvp in inDep) {
                                                    var inUser = cKvp.Value as Dictionary<string, object>;
                                                    if (inUser != null) {
                                                        var curUser = (curCust.ContainsKey(cKvp.Key) && curCust[cKvp.Key] is Dictionary<string, object>)
                                                            ? (Dictionary<string, object>)curCust[cKvp.Key]
                                                            : new Dictionary<string, object>();
                                                        foreach (KeyValuePair<string, object> uKvp in inUser) {
                                                            curUser[uKvp.Key] = uKvp.Value;
                                                        }
                                                        curCust[cKvp.Key] = curUser;
                                                    } else {
                                                        curCust[cKvp.Key] = cKvp.Value;
                                                    }
                                                }
                                                currentObj["customersDb"] = curCust;
                                            } else if (kvp.Key == "deposits" && inList != null) {
                                                var curList = (currentObj.ContainsKey("deposits") && currentObj["deposits"] is System.Collections.IEnumerable)
                                                    ? (System.Collections.IEnumerable)currentObj["deposits"]
                                                    : new object[0];

                                                var depMap = new Dictionary<string, Dictionary<string, object>>();
                                                foreach (object item in curList) {
                                                    var d = item as Dictionary<string, object>;
                                                    if (d != null && d.ContainsKey("id") && d["id"] != null) {
                                                        depMap[d["id"].ToString()] = d;
                                                    }
                                                }
                                                foreach (object item in inList) {
                                                    var d = item as Dictionary<string, object>;
                                                    if (d != null && d.ContainsKey("id") && d["id"] != null) {
                                                        string idStr = d["id"].ToString();
                                                        if (depMap.ContainsKey(idStr)) {
                                                            foreach (KeyValuePair<string, object> field in d) {
                                                                depMap[idStr][field.Key] = field.Value;
                                                            }
                                                        } else {
                                                            depMap[idStr] = d;
                                                        }
                                                    }
                                                }
                                                var list = new List<Dictionary<string, object>>(depMap.Values);
                                                list.Sort(delegate(Dictionary<string, object> a, Dictionary<string, object> b) {
                                                    long tA = 0; long tB = 0;
                                                    try { if (a != null && a.ContainsKey("requestedAt") && a["requestedAt"] != null) tA = Convert.ToInt64(a["requestedAt"]); } catch {}
                                                    try { if (b != null && b.ContainsKey("requestedAt") && b["requestedAt"] != null) tB = Convert.ToInt64(b["requestedAt"]); } catch {}
                                                    return tB.CompareTo(tA);
                                                });
                                                currentObj["deposits"] = list.ToArray();
                                            } else if (kvp.Key == "withdrawals" && inList != null) {
                                                var curList = (currentObj.ContainsKey("withdrawals") && currentObj["withdrawals"] is System.Collections.IEnumerable)
                                                    ? (System.Collections.IEnumerable)currentObj["withdrawals"]
                                                    : new object[0];

                                                var wdMap = new Dictionary<string, Dictionary<string, object>>();
                                                foreach (object item in curList) {
                                                    var w = item as Dictionary<string, object>;
                                                    if (w != null && w.ContainsKey("id") && w["id"] != null) {
                                                        wdMap[w["id"].ToString()] = w;
                                                    }
                                                }
                                                foreach (object item in inList) {
                                                    var w = item as Dictionary<string, object>;
                                                    if (w != null && w.ContainsKey("id") && w["id"] != null) {
                                                        string idStr = w["id"].ToString();
                                                        if (wdMap.ContainsKey(idStr)) {
                                                            foreach (KeyValuePair<string, object> field in w) {
                                                                wdMap[idStr][field.Key] = field.Value;
                                                            }
                                                        } else {
                                                            wdMap[idStr] = w;
                                                        }
                                                    }
                                                }
                                                var list = new List<Dictionary<string, object>>(wdMap.Values);
                                                list.Sort(delegate(Dictionary<string, object> a, Dictionary<string, object> b) {
                                                    long tA = 0; long tB = 0;
                                                    try { if (a != null && a.ContainsKey("requestedAt") && a["requestedAt"] != null) tA = Convert.ToInt64(a["requestedAt"]); } catch {}
                                                    try { if (b != null && b.ContainsKey("requestedAt") && b["requestedAt"] != null) tB = Convert.ToInt64(b["requestedAt"]); } catch {}
                                                    return tB.CompareTo(tA);
                                                });
                                                currentObj["withdrawals"] = list.ToArray();
                                            } else if (kvp.Key == "activeBets" && inList != null) {
                                                var curList = (currentObj.ContainsKey("activeBets") && currentObj["activeBets"] is System.Collections.IEnumerable)
                                                    ? (System.Collections.IEnumerable)currentObj["activeBets"]
                                                    : new object[0];

                                                var betMap = new Dictionary<string, Dictionary<string, object>>();
                                                foreach (object item in curList) {
                                                    var b = item as Dictionary<string, object>;
                                                    if (b != null && b.ContainsKey("id") && b["id"] != null) {
                                                        betMap[b["id"].ToString()] = b;
                                                    }
                                                }
                                                foreach (object item in inList) {
                                                    var b = item as Dictionary<string, object>;
                                                    if (b != null && b.ContainsKey("id") && b["id"] != null) {
                                                        string idStr = b["id"].ToString();
                                                        if (betMap.ContainsKey(idStr)) {
                                                            foreach (KeyValuePair<string, object> field in b) {
                                                                betMap[idStr][field.Key] = field.Value;
                                                            }
                                                        } else {
                                                            betMap[idStr] = b;
                                                        }
                                                    }
                                                }
                                                var list = new List<Dictionary<string, object>>(betMap.Values);
                                                list.Sort(delegate(Dictionary<string, object> a, Dictionary<string, object> b) {
                                                    long tA = 0; long tB = 0;
                                                    try { if (a != null && a.ContainsKey("timestamp") && a["timestamp"] != null) tA = Convert.ToInt64(a["timestamp"]); } catch {}
                                                    try { if (b != null && b.ContainsKey("timestamp") && b["timestamp"] != null) tB = Convert.ToInt64(b["timestamp"]); } catch {}
                                                    return tB.CompareTo(tA);
                                                });
                                                currentObj["activeBets"] = list.ToArray();
                                            } else {
                                                currentObj[kvp.Key] = kvp.Value;
                                            }
                                        }
                                        string mergedJson = serializer.Serialize(currentObj);
                                        File.WriteAllText(stateFile, mergedJson, new UTF8Encoding(false));
                                    } else {
                                        File.WriteAllText(stateFile, bodyJson, new UTF8Encoding(false));
                                    }
                                } catch {
                                    File.WriteAllText(stateFile, bodyJson, new UTF8Encoding(false));
                                }
                            }
                        }

                        byte[] respBody = Encoding.UTF8.GetBytes("{\"status\":\"ok\"}");
                        string header = "HTTP/1.1 200 OK\r\n" +
                                        "Content-Type: application/json; charset=utf-8\r\n" +
                                        "Content-Length: " + respBody.Length + "\r\n" +
                                        "Access-Control-Allow-Origin: *\r\n" +
                                        "Connection: close\r\n\r\n";
                        byte[] headerBytes = Encoding.UTF8.GetBytes(header);
                        stream.Write(headerBytes, 0, headerBytes.Length);
                        stream.Write(respBody, 0, respBody.Length);
                        stream.Flush();
                        return;
                    }
                }

                // STATIC FILE SERVING
                if (url == "/" || string.IsNullOrEmpty(url)) url = "/index.html";
                url = url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);

                string filePath = Path.Combine(folder, url);
                if (File.Exists(filePath)) {
                    byte[] fileBytes = File.ReadAllBytes(filePath);
                    string ext = Path.GetExtension(filePath).ToLower();
                    string mime = GetMime(ext);
                    string header = "HTTP/1.1 200 OK\r\n" +
                                    "Content-Type: " + mime + "\r\n" +
                                    "Content-Length: " + fileBytes.Length + "\r\n" +
                                    "Access-Control-Allow-Origin: *\r\n" +
                                    "Cache-Control: no-cache\r\n" +
                                    "Connection: close\r\n\r\n";
                    byte[] headerBytes = Encoding.UTF8.GetBytes(header);
                    stream.Write(headerBytes, 0, headerBytes.Length);
                    stream.Write(fileBytes, 0, fileBytes.Length);
                    stream.Flush();
                    return;
                } else {
                    byte[] notFoundBytes = Encoding.UTF8.GetBytes("File Not Found: " + url);
                    string header = "HTTP/1.1 404 Not Found\r\n" +
                                    "Content-Type: text/plain; charset=utf-8\r\n" +
                                    "Content-Length: " + notFoundBytes.Length + "\r\n" +
                                    "Access-Control-Allow-Origin: *\r\n" +
                                    "Connection: close\r\n\r\n";
                    byte[] headerBytes = Encoding.UTF8.GetBytes(header);
                    stream.Write(headerBytes, 0, headerBytes.Length);
                    stream.Write(notFoundBytes, 0, notFoundBytes.Length);
                    stream.Flush();
                    return;
                }
            }
        } catch {}
    }

    private string GetMime(string ext) {
        switch (ext) {
            case ".html": case ".htm": return "text/html; charset=utf-8";
            case ".css": return "text/css; charset=utf-8";
            case ".js": return "application/javascript; charset=utf-8";
            case ".json": return "application/json; charset=utf-8";
            case ".png": return "image/png";
            case ".jpg": case ".jpeg": return "image/jpeg";
            case ".gif": return "image/gif";
            case ".svg": return "image/svg+xml";
            case ".ico": return "image/x-icon";
            case ".mp3": return "audio/mpeg";
            case ".wav": return "audio/wav";
            case ".woff": return "font/woff";
            case ".woff2": return "font/woff2";
            case ".ttf": return "font/ttf";
            default: return "application/octet-stream";
        }
    }

    public void Stop() {
        running = false;
        try { listener.Stop(); } catch {}
    }
}
'@

Add-Type -ReferencedAssemblies "System.Web.Extensions" -TypeDefinition $code -Language CSharp

$server = New-Object NativeHttpServer($folder)
$port = $server.ActivePort

Clear-Host
Write-Host '===============================================================' -ForegroundColor Yellow
Write-Host '       LUCKY HOURLY SPIN - SHARED REAL-TIME SERVER' -ForegroundColor Green
Write-Host '===============================================================' -ForegroundColor Yellow
Write-Host '  COMPUTER (Localhost):' -ForegroundColor White
Write-Host ('     -> http://localhost:' + $port + '/') -ForegroundColor Cyan
Write-Host ''
Write-Host '  MOBILE PHONES & OTHER DEVICES (Same Wi-Fi or Hotspot):' -ForegroundColor White

if ($allIPs.Count -gt 0) {
    foreach ($ip in $allIPs) {
        Write-Host ('     -> http://' + $ip + ':' + $port + '/') -ForegroundColor Green
    }
} else {
    Write-Host '     -> Connect to Wi-Fi or Hotspot to see IP.' -ForegroundColor Gray
}

Write-Host '===============================================================' -ForegroundColor Yellow
Write-Host '  All devices (PC & Mobile) are 100% synchronized in real-time!' -ForegroundColor Gray
Write-Host '  Leave this window open. Press Ctrl + C to stop server.' -ForegroundColor Gray
Write-Host '===============================================================' -ForegroundColor Yellow
Write-Host ''

$server.Start()
