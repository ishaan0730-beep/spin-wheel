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
                    ""slices"": [7, 18, 26, 33, 42, 59, 68, 77, 86, 94],
                    ""history"": [],
                    ""forcedNext"": null,
                    ""upcomingQueue"": [""AUTO"", ""AUTO"", ""AUTO""],
                    ""hourlySchedule"": {},
                    ""timerMode"": ""REAL"",
                    ""customSecs"": 60,
                    ""customTimerTarget"": null,
                    ""manualRoundTitle"": null,
                    ""masterPassword"": ""00773300"",
                    ""spinTrigger"": null,
                    ""version"": 1
                }";
                File.WriteAllText(stateFile, defaultJson, Encoding.UTF8);
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
                                File.WriteAllText(stateFile, bodyJson, Encoding.UTF8);
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
                } else {
                    byte[] notFound = Encoding.UTF8.GetBytes("404 Not Found");
                    string header = "HTTP/1.1 404 Not Found\r\n" +
                                    "Content-Type: text/plain\r\n" +
                                    "Content-Length: " + notFound.Length + "\r\n" +
                                    "Connection: close\r\n\r\n";
                    byte[] headerBytes = Encoding.UTF8.GetBytes(header);
                    stream.Write(headerBytes, 0, headerBytes.Length);
                    stream.Write(notFound, 0, notFound.Length);
                }
                stream.Flush();
            }
        } catch {}
        finally {
            try { client.Close(); } catch {}
        }
    }

    private string GetMime(string ext) {
        switch (ext) {
            case ".html": return "text/html; charset=utf-8";
            case ".css": return "text/css; charset=utf-8";
            case ".js": return "application/javascript; charset=utf-8";
            case ".json": return "application/json; charset=utf-8";
            case ".png": return "image/png";
            case ".jpg": return "image/jpeg";
            case ".svg": return "image/svg+xml";
            case ".ico": return "image/x-icon";
            default: return "application/octet-stream";
        }
    }

    public void Stop() {
        running = false;
        try { listener.Stop(); } catch {}
    }
}
'@

Add-Type -TypeDefinition $code -Language CSharp

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
