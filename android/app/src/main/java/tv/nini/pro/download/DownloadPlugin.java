/**
 * Nini TV Pro — native HLS/video downloader.
 * Downloads a stream (m3u8 or direct file) into the public Downloads folder.
 * - Sends browser UA + Referer (fixes telewebion 403 etc.)
 * - Handles master playlists (picks the highest-bandwidth variant)
 * - Caps live streams at ~600 segments so it always finishes
 * - Uses MediaStore on Android 10+ (no storage permission needed)
 */
package tv.nini.pro.download;

import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "NiniDownload")
public class DownloadPlugin extends Plugin {

    private static final String UA =
        "Mozilla/5.0 (Linux; Android 13; SM-A525F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
    private static final int MAX_SEGMENTS = 600; // ~30 min of a 3s-segment live stream

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
        String body = readText(url);
        String fileName = title + ".ts";

        if (body.contains("#EXTM3U")) {
            // master playlist? -> pick highest-bandwidth variant
            String base = url.substring(0, url.lastIndexOf('/') + 1);
            if (body.contains("#EXT-X-STREAM-INF")) {
                String best = null; long bestBw = -1;
                String[] lines = body.split("\\r?\\n");
                for (int i = 0; i < lines.length; i++) {
                    if (!lines[i].startsWith("#EXT-X-STREAM-INF")) continue;
                    long bw = 0;
                    java.util.regex.Matcher m = java.util.regex.Pattern.compile("BANDWIDTH=(\\d+)").matcher(lines[i]);
                    if (m.find()) bw = Long.parseLong(m.group(1));
                    for (int j = i + 1; j < lines.length; j++) {
                        String l = lines[j].trim();
                        if (l.isEmpty()) continue;
                        if (l.startsWith("#")) break;
                        if (bw >= bestBw) { bestBw = bw; best = resolve(base, l); }
                        i = j;
                        break;
                    }
                }
                if (best == null) throw new Exception("واریانت معتبر پیدا نشد");
                body = readText(best);
                base = best.substring(0, best.lastIndexOf('/') + 1);
            }
            // collect media segments
            List<String> segs = new ArrayList<>();
            for (String line : body.split("\\r?\\n")) {
                String l = line.trim();
                if (l.isEmpty() || l.startsWith("#")) continue;
                segs.add(resolve(base, l));
                if (segs.size() >= MAX_SEGMENTS) break;
            }
            if (segs.isEmpty()) throw new Exception("هیچ سگمنتی در لیست پخش نیست");
            writeSegments(segs, fileName);
            return "Downloads/" + fileName;
        }

        // direct file (mp4/ts)
        if (url.contains(".mp4")) fileName = title + ".mp4";
        downloadSingle(url, fileName);
        return "Downloads/" + fileName;
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

    private HttpURLConnection open(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setInstanceFollowRedirects(true);
        c.setConnectTimeout(15000);
        c.setReadTimeout(45000);
        c.setRequestProperty("User-Agent", UA);
        c.setRequestProperty("Accept", "*/*");
        try {
            URL u = new URL(url);
            c.setRequestProperty("Referer", u.getProtocol() + "://" + u.getHost() + "/");
        } catch (Exception ignored) {}
        return c;
    }

    private String readText(String url) throws Exception {
        HttpURLConnection c = open(url);
        InputStream in = new BufferedInputStream(c.getInputStream());
        java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) > 0) bos.write(buf, 0, n);
        in.close();
        return bos.toString("UTF-8");
    }

    /** Open an output stream into the public Downloads folder (MediaStore on Q+). */
    private OutputStream openDownloads(String fileName, long approxSize) throws Exception {
        if (Build.VERSION.SDK_INT >= 29) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
            values.put(MediaStore.Downloads.MIME_TYPE, fileName.endsWith(".mp4") ? "video/mp4" : "video/mp2t");
            values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
            if (approxSize > 0) values.put(MediaStore.Downloads.SIZE, approxSize);
            Uri uri = getContext().getContentResolver()
                    .insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri == null) throw new Exception("ساخت فایل در Downloads ناموفق بود");
            return getContext().getContentResolver().openOutputStream(uri);
        }
        File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        if (!dir.exists()) dir.mkdirs();
        return new FileOutputStream(new File(dir, fileName));
    }

    private void downloadSingle(String url, String fileName) throws Exception {
        HttpURLConnection c = open(url);
        try (InputStream in = new BufferedInputStream(c.getInputStream());
             OutputStream os = openDownloads(fileName, c.getContentLengthLong())) {
            byte[] buf = new byte[32768];
            int n;
            while ((n = in.read(buf)) > 0) os.write(buf, 0, n);
            os.flush();
        }
        c.disconnect();
    }

    private void writeSegments(List<String> urls, String fileName) throws Exception {
        OutputStream fos = openDownloads(fileName, -1);
        byte[] buf = new byte[32768];
        int done = 0;
        try {
            for (String u : urls) {
                HttpURLConnection c = null;
                try {
                    c = open(u);
                    try (InputStream in = new BufferedInputStream(c.getInputStream())) {
                        int n;
                        while ((n = in.read(buf)) > 0) fos.write(buf, 0, n);
                    }
                    done++;
                    if (done % 10 == 0) fos.flush();
                } catch (Exception ignored) {
                    // skip a broken segment rather than fail the whole file
                } finally {
                    if (c != null) c.disconnect();
                }
            }
            fos.flush();
        } finally {
            fos.close();
        }
        if (done == 0) throw new Exception("هیچ سگمنتی دانلود نشد");
    }
}
