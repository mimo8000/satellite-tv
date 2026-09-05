/**
 * Nini TV Pro — local stream proxy.
 * Runs a tiny HTTP server on 127.0.0.1 that forwards HLS/video requests with
 * proper headers (User-Agent / Referer / Range) and adds CORS headers, then
 * rewrites m3u8 playlists so every segment/child-playlist also goes through
 * the proxy. This fixes "no channel plays" caused by WebView CORS blocks and
 * hosts (telewebion etc.) that 403 without a browser UA.
 */
package tv.nini.pro.download;

import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "NiniStreamProxy")
public class StreamProxyPlugin extends Plugin {

    private static final String UA =
        "Mozilla/5.0 (Linux; Android 13; SM-A525F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
    private ServerSocket server;
    private int port = 0;

    @PluginMethod
    public void getBaseUrl(PluginCall call) {
        synchronized (this) {
            if (server == null || server.isClosed()) {
                try {
                    server = new ServerSocket(0, 50, InetAddress.getByName("127.0.0.1"));
                    port = server.getLocalPort();
                    Thread t = new Thread(this::acceptLoop, "nini-proxy");
                    t.setDaemon(true);
                    t.start();
                } catch (Exception e) {
                    call.reject("proxy start failed: " + e.getMessage());
                    return;
                }
            }
        }
        JSObject ret = new JSObject();
        ret.put("baseUrl", "http://127.0.0.1:" + port + "/p/");
        call.resolve(ret);
    }

    private void acceptLoop() {
        while (!server.isClosed()) {
            try {
                Socket s = server.accept();
                Thread w = new Thread(() -> handle(s), "nini-proxy-conn");
                w.setDaemon(true);
                w.start();
            } catch (Exception e) {
                return;
            }
        }
    }

    /** Serve requests on one connection until the client closes it (keep-alive). */
    private void handle(Socket s) {
        try {
            s.setSoTimeout(30000);
            InputStream in = new java.io.BufferedInputStream(s.getInputStream(), 8192);
            OutputStream out = new java.io.BufferedOutputStream(s.getOutputStream(), 32768);
            while (true) {
                String head = readRequest(in);
                if (head == null) break;
                String first = head.split("\r?\n", 2)[0];
                String[] parts = first.split(" ");
                if (parts.length < 2) break;
                String method = parts[0];
                String path = parts[1];

                if (method.equals("OPTIONS")) {
                    out.write(("HTTP/1.1 204 No Content\r\n" + cors() + "\r\n").getBytes(StandardCharsets.US_ASCII));
                    out.flush();
                    continue;
                }
                if (!path.startsWith("/p/")) break;
                String target = decode(path.substring(3));
                if (target == null || !(target.startsWith("http://") || target.startsWith("https://"))) {
                    out.write(("HTTP/1.1 400 Bad Request\r\n" + cors() + "Content-Length: 0\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
                    out.flush();
                    continue;
                }
                if (!serve(out, target, header(head, "Range"))) break;
                out.flush();
            }
        } catch (Exception e) {
            // connection dead — close quietly
        } finally {
            try { s.close(); } catch (Exception ignored) {}
        }
    }

    /** Read one HTTP request header block; returns null at EOF. */
    private String readRequest(InputStream in) throws Exception {
        StringBuilder req = new StringBuilder();
        int c;
        while ((c = in.read()) != -1) {
            req.append((char) c);
            int len = req.length();
            if (len >= 4
                    && req.charAt(len - 4) == '\r' && req.charAt(len - 3) == '\n'
                    && req.charAt(len - 2) == '\r' && req.charAt(len - 1) == '\n') break;
            if (len >= 2 && req.charAt(len - 2) == '\n' && req.charAt(len - 1) == '\n') break;
            if (len > 65536) break;
        }
        return req.length() == 0 ? null : req.toString();
    }

    /** Fetch upstream (with one retry) and write a complete response. False = connection must close. */
    private boolean serve(OutputStream out, String target, String range) {
        HttpURLConnection conn = null;
        for (int attempt = 0; attempt < 2; attempt++) {
            try {
                conn = (HttpURLConnection) new URL(target).openConnection();
                conn.setInstanceFollowRedirects(true);
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(15000);
                conn.setRequestProperty("User-Agent", UA);
                conn.setRequestProperty("Accept", "*/*");
                try {
                    URL u = new URL(target);
                    conn.setRequestProperty("Referer", u.getProtocol() + "://" + u.getHost() + "/");
                } catch (Exception ignored) {}
                if (range != null) conn.setRequestProperty("Range", range);

                int code = conn.getResponseCode();
                if (code >= 500 && attempt == 0) { conn.disconnect(); Thread.sleep(300); continue; }
                String ctype = conn.getContentType();
                if (ctype == null) ctype = "application/octet-stream";
                boolean isM3u8 = (ctype.contains("mpegurl") || target.contains(".m3u8")) && code < 400;

                StringBuilder resp = new StringBuilder();
                resp.append("HTTP/1.1 ").append(code)
                    .append(code == 206 ? " Partial Content" : " OK").append("\r\n");
                resp.append(cors());
                resp.append("Content-Type: ").append(ctype).append("\r\n");

                if (isM3u8) {
                    byte[] body = readAll(conn.getInputStream());
                    String rewritten = rewritePlaylist(new String(body, StandardCharsets.UTF_8), target);
                    byte[] rb = rewritten.getBytes(StandardCharsets.UTF_8);
                    resp.append("Content-Length: ").append(rb.length).append("\r\n\r\n");
                    out.write(resp.toString().getBytes(StandardCharsets.US_ASCII));
                    out.write(rb);
                } else if (code == 206) {
                    String crange = conn.getHeaderField("Content-Range");
                    long clen = conn.getContentLengthLong();
                    resp.append("Content-Range: ").append(crange != null ? crange : "").append("\r\n");
                    if (clen >= 0) resp.append("Content-Length: ").append(clen).append("\r\n");
                    resp.append("\r\n");
                    out.write(resp.toString().getBytes(StandardCharsets.US_ASCII));
                    pump(out, conn);
                } else {
                    long clen = conn.getContentLengthLong();
                    if (clen >= 0) {
                        resp.append("Content-Length: ").append(clen).append("\r\n\r\n");
                        out.write(resp.toString().getBytes(StandardCharsets.US_ASCII));
                        pump(out, conn);
                    } else {
                        // unknown length — close after body
                        resp.append("Connection: close\r\n\r\n");
                        out.write(resp.toString().getBytes(StandardCharsets.US_ASCII));
                        pump(out, conn);
                        out.flush();
                        conn.disconnect();
                        return false;
                    }
                }
                conn.disconnect();
                return true;
            } catch (Exception e) {
                if (conn != null) { try { conn.disconnect(); } catch (Exception ignored) {} conn = null; }
                if (attempt == 0) {
                    try { Thread.sleep(300); } catch (InterruptedException ie) { return false; }
                } else {
                    try {
                        out.write(("HTTP/1.1 502 Bad Gateway\r\n" + cors() + "Content-Length: 0\r\n\r\n")
                                .getBytes(StandardCharsets.US_ASCII));
                        out.flush();
                    } catch (Exception ignored) {}
                }
            }
        }
        return true;
    }

    private void pump(OutputStream out, HttpURLConnection conn) throws Exception {
        try (InputStream bin = (conn.getResponseCode() >= 400) ? conn.getErrorStream() : conn.getInputStream()) {
            if (bin != null) {
                byte[] buf = new byte[32768];
                int n;
                while ((n = bin.read(buf)) != -1) out.write(buf, 0, n);
            }
        }
    }

    private String cors() {
        return "Access-Control-Allow-Origin: *\r\n"
             + "Access-Control-Allow-Headers: Range, Content-Type, Accept\r\n"
             + "Access-Control-Allow-Methods: GET, HEAD, OPTIONS\r\n"
             + "Access-Control-Expose-Headers: Content-Range, Content-Length\r\n"
             + "Cache-Control: no-store\r\n";
    }

    private String header(String head, String name) {
        for (String line : head.split("\r?\n")) {
            if (line.toLowerCase().startsWith(name.toLowerCase() + ":")) {
                return line.substring(line.indexOf(':') + 1).trim();
            }
        }
        return null;
    }

    private byte[] readAll(InputStream is) throws Exception {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = is.read(buf)) != -1) bos.write(buf, 0, n);
        return bos.toByteArray();
    }

    /** Rewrite every URI line + URI= attribute in an m3u8 to go through the proxy. */
    private String rewritePlaylist(String text, String baseUrl) {
        StringBuilder sb = new StringBuilder();
        for (String line : text.split("\n", -1)) {
            String trimmed = line.trim();
            if (trimmed.contains("URI=\"")) {
                int i = trimmed.indexOf("URI=\"") + 5;
                int j = trimmed.indexOf('"', i);
                if (j > i) {
                    String uri = resolve(trimmed.substring(i, j), baseUrl);
                    sb.append(line, 0, line.indexOf("URI=\"") + 5)
                      .append(encodeProxy(uri))
                      .append(line.substring(j));
                    sb.append('\n');
                    continue;
                }
            }
            if (!trimmed.isEmpty() && !trimmed.startsWith("#")) {
                sb.append(encodeProxy(resolve(trimmed, baseUrl))).append('\n');
                continue;
            }
            sb.append(line).append('\n');
        }
        return sb.toString();
    }

    private String resolve(String uri, String base) {
        try {
            return new URL(new URL(base), uri).toString();
        } catch (Exception e) {
            return uri;
        }
    }

    private String encodeProxy(String url) {
        String b = Base64.encodeToString(url.getBytes(StandardCharsets.UTF_8), Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING);
        return "http://127.0.0.1:" + port + "/p/" + b;
    }

    private String decode(String b64) {
        try {
            return new String(Base64.decode(b64, Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }
}
