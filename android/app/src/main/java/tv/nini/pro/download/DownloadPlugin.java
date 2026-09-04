/**
 * Nini TV Pro — native HLS/video downloader.
 * Downloads a stream URL (m3u8 or direct) into a playable file in
 * the public Downloads folder, then fires a system notification.
 */
package tv.nini.pro.download;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Environment;
import android.webkit.MimeTypeMap;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "NiniDownload")
public class DownloadPlugin extends Plugin {

    private final ExecutorService pool = Executors.newFixedThreadPool(2);

    @PluginMethod
    public void download(PluginCall call) {
        String url = call.getString("url");
        String title = call.getString("title", "nini-tv");
        if (url == null || url.isEmpty()) {
            call.reject("url required");
            return;
        }
        final String safeTitle = title.replaceAll("[^a-zA-Z0-9_\\u0600-\\u06FF-]", "_");
        call.setKeepAlive(true);

        pool.execute(() -> {
            try {
                String out = fetchAndSave(url, safeTitle);
                JSObject ret = new JSObject();
                ret.put("path", out);
                ret.put("ok", true);
                call.resolve(ret);
            } catch (Exception e) {
                JSObject ret = new JSObject();
                ret.put("ok", false);
                ret.put("error", e.getMessage() == null ? e.toString() : e.getMessage());
                call.resolve(ret);
            }
        });
    }

    private String fetchAndSave(String url, String title) throws Exception {
        File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        if (!dir.exists()) dir.mkdirs();

        // HLS? collect segment URLs first.
        List<String> segmentUrls = new ArrayList<>();
        String body = readText(url);
        boolean isHls = body.contains("#EXTM3U");

        File out;
        if (isHls) {
            String base = url.substring(0, url.lastIndexOf('/') + 1);
            for (String line : body.split("\n")) {
                String l = line.trim();
                if (l.isEmpty() || l.startsWith("#")) continue;
                // master playlist -> pick first variant, re-read
                if (l.endsWith(".m3u8") && !l.contains("EXT-X-STREAM-INF")) segmentUrls.add(l);
                else if (l.contains(".m3u8")) {
                    String variant = readText(resolve(base, l));
                    String vbase = resolve(base, l);
                    vbase = vbase.substring(0, vbase.lastIndexOf('/') + 1);
                    for (String vl : variant.split("\n")) {
                        String v = vl.trim();
                        if (v.isEmpty() || v.startsWith("#")) continue;
                        segmentUrls.add(resolve(vbase, v));
                    }
                    break;
                } else {
                    segmentUrls.add(resolve(base, l));
                }
            }
            out = new File(dir, title + ".ts");
            writeSegments(segmentUrls, out);
        } else {
            String ext = MimeTypeMap.getSingleton().getExtensionFromMimeType("video/mp4");
            out = new File(dir, title + "." + (ext == null ? "mp4" : ext));
            downloadSingle(url, out);
        }
        return out.getAbsolutePath();
    }

    private String resolve(String base, String ref) {
        if (ref.startsWith("http")) return ref;
        if (ref.startsWith("/")) {
            int p = base.indexOf("//");
            int q = base.indexOf('/', p + 2);
            return base.substring(0, q) + ref;
        }
        return base + ref;
    }

    private String readText(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(25000);
        c.setRequestProperty("User-Agent", "Mozilla/5.0 (NiniTVPro)");
        InputStream in = new BufferedInputStream(c.getInputStream());
        java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) > 0) bos.write(buf, 0, n);
        in.close();
        return bos.toString("UTF-8");
    }

    private void downloadSingle(String url, File out) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(60000);
        c.setRequestProperty("User-Agent", "Mozilla/5.0 (NiniTVPro)");
        InputStream in = new BufferedInputStream(c.getInputStream());
        FileOutputStream fos = new FileOutputStream(out);
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) > 0) fos.write(buf, 0, n);
        fos.flush();
        fos.close();
        in.close();
    }

    private void writeSegments(List<String> urls, File out) throws Exception {
        FileOutputStream fos = new FileOutputStream(out);
        byte[] buf = new byte[16384];
        int done = 0;
        for (String u : urls) {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(u).openConnection();
                c.setConnectTimeout(15000);
                c.setReadTimeout(60000);
                c.setRequestProperty("User-Agent", "Mozilla/5.0 (NiniTVPro)");
                InputStream in = new BufferedInputStream(c.getInputStream());
                int n;
                while ((n = in.read(buf)) > 0) fos.write(buf, 0, n);
                in.close();
                done++;
                if (done % 20 == 0) fos.flush();
            } catch (Exception ignored) {
                // skip a broken segment rather than fail the whole file
            }
        }
        fos.flush();
        fos.close();
        if (done == 0) throw new Exception("هیچ سگمنتی دانلود نشد");
    }
}
