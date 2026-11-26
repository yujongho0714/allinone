package kr.jungdo.allinone;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.browser.customtabs.CustomTabColorSchemeParams;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.core.content.FileProvider;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * 정도 올인원 (폰·태블릿)
 *  - 홈 화면: 웹 올인원(yujongho0714.github.io/allinone/)을 그대로 보여줘요 → PC와 같은 화면
 *    (인터넷이 없으면 앱 안에 들어 있는 홈 화면으로)
 *  - 각 앱: 크롬 탭으로 열어요 → 구글 로그인 · 카메라 · 블루투스(제미타) · 파일 저장이 크롬처럼 그대로 돼요
 *  - 폰 앱(출결 앱 · 영상촬영 앱): 설치돼 있으면 바로 열고, 없으면 받는 곳으로
 */
public class MainActivity extends Activity {
    private static final String HOME = "https://yujongho0714.github.io/allinone/";
    private static final String REPO = "yujongho0714/allinone";

    private WebView web;
    private final Handler main = new Handler(Looper.getMainLooper());
    private SharedPreferences prefs;
    private File updateFile;
    private boolean offline = false;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        prefs = getSharedPreferences("aio", MODE_PRIVATE);
        getWindow().setStatusBarColor(Color.parseColor("#0C1428"));
        getWindow().setNavigationBarColor(Color.parseColor("#0C1428"));
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0C1428"));
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        web.addJavascriptInterface(new Bridge(), "AIO");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                String url = u.toString();
                // 홈 화면 안에서 움직이는 건 그대로, 다른 주소는 크롬 탭 · 전화/문자 등은 해당 앱으로
                if (url.startsWith(HOME) || url.startsWith("file:///android_asset/")) return false;
                if ("http".equals(u.getScheme()) || "https".equals(u.getScheme())) { openTab(url); return true; }
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { toast("열 수 없어요"); }
                return true;
            }
            @Override
            public void onReceivedHttpError(WebView v, WebResourceRequest r, android.webkit.WebResourceResponse e) {
                // 홈 주소가 아직 안 열리면(404 등) 앱 안의 홈 화면
                if (r.isForMainFrame() && e.getStatusCode() >= 400 && !offline) { offline = true; v.loadUrl("file:///android_asset/index.html"); }
            }
            @Override
            public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                // 인터넷이 없어서 홈을 못 불러오면 앱 안의 홈 화면
                if (r.isForMainFrame() && !offline) { offline = true; v.loadUrl("file:///android_asset/index.html"); }
            }
        });
        web.loadUrl(HOME);
        checkUpdate();
    }

    @Override
    public void onBackPressed() {
        // 홈 화면이 뒤로가기를 받아서 '종료할까요?'를 물어봐요. 홈 화면을 못 불러온 경우엔 여기서 물어봐요.
        if (web.canGoBack()) { web.goBack(); return; }
        new AlertDialog.Builder(this).setTitle("정도 올인원").setMessage("올인원을 종료할까요?")
            .setPositiveButton("종료", new DialogInterface.OnClickListener() { @Override public void onClick(DialogInterface d, int w) { finish(); } })
            .setNegativeButton("취소", null).show();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (prefs.getBoolean("installAfterPerm", false) && getPackageManager().canRequestPackageInstalls()) {
            prefs.edit().remove("installAfterPerm").apply();
            installUpdate();
        }
    }

    /** 크롬 탭으로 열기 (크롬이 없으면 기본 브라우저) */
    private void openTab(String url) {
        try {
            CustomTabsIntent t = new CustomTabsIntent.Builder()
                    .setDefaultColorSchemeParams(new CustomTabColorSchemeParams.Builder().setToolbarColor(Color.parseColor("#0C1428")).build())
                    .setShowTitle(true)
                    .build();
            try { getPackageManager().getPackageInfo("com.android.chrome", 0); t.intent.setPackage("com.android.chrome"); } catch (Exception ignored) {}
            t.launchUrl(this, Uri.parse(url));
        } catch (Exception e) {
            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception e2) { toast("열 수 없어요: " + url); }
        }
    }

    class Bridge {
        @JavascriptInterface public String version() { return String.valueOf(myBuild()); }
        @JavascriptInterface public void exit() { main.post(new Runnable() { @Override public void run() { finish(); } }); }
        @JavascriptInterface public void open(final String url) { main.post(new Runnable() { @Override public void run() { openTab(url); } }); }
        @JavascriptInterface public boolean has(String pkg) {
            try { getPackageManager().getPackageInfo(pkg, 0); return true; } catch (Exception e) { return false; }
        }
        /** 폰에 설치된 앱 열기, 없으면 받는 곳 */
        @JavascriptInterface public void launch(final String pkg, final String install) {
            main.post(new Runnable() {
                @Override public void run() {
                    Intent i = getPackageManager().getLaunchIntentForPackage(pkg);
                    if (i != null) { startActivity(i); return; }
                    new AlertDialog.Builder(MainActivity.this)
                            .setTitle("이 폰에 앱이 없어요")
                            .setMessage("받는 곳을 열까요? (APK를 받아 설치하면 돼요)")
                            .setPositiveButton("받으러 가기", new DialogInterface.OnClickListener() {
                                @Override public void onClick(DialogInterface d, int w) { if (install != null && install.length() > 0) openTab(install); }
                            })
                            .setNegativeButton("닫기", null).show();
                }
            });
        }
    }

    // ---------------- 새 버전 자동 업데이트 ----------------
    private long myBuild() {
        try { PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0); return pi.getLongVersionCode(); } catch (Exception e) { return 0; }
    }

    private void checkUpdate() {
        new Thread(new Runnable() {
            @Override public void run() {
                try {
                    java.net.HttpURLConnection c = (java.net.HttpURLConnection) new java.net.URL("https://api.github.com/repos/" + REPO + "/releases/latest").openConnection();
                    c.setConnectTimeout(8000); c.setReadTimeout(8000);
                    c.setRequestProperty("Accept", "application/vnd.github+json");
                    if (c.getResponseCode() != 200) return;
                    JSONObject o = new JSONObject(new String(readAll(c.getInputStream()), "UTF-8"));
                    long latest = Long.parseLong("0" + o.optString("tag_name", "v0").replaceAll("[^0-9]", ""));
                    if (latest <= myBuild()) return;
                    JSONArray assets = o.optJSONArray("assets");
                    String url = null;
                    if (assets != null) for (int k = 0; k < assets.length(); k++) {
                        JSONObject a = assets.getJSONObject(k);
                        if (a.optString("name").endsWith(".apk")) { url = a.optString("browser_download_url"); break; }
                    }
                    if (url == null) return;
                    final String dl = url; final long ver = latest;
                    main.post(new Runnable() {
                        @Override public void run() {
                            if (isFinishing()) return;
                            new AlertDialog.Builder(MainActivity.this)
                                    .setTitle("새 버전 v" + ver + " 이 있어요")
                                    .setMessage("지금 업데이트할까요?")
                                    .setPositiveButton("업데이트", new DialogInterface.OnClickListener() {
                                        @Override public void onClick(DialogInterface d, int w) { downloadUpdate(dl); }
                                    })
                                    .setNegativeButton("나중에", null).show();
                        }
                    });
                } catch (Exception ignored) {}
            }
        }).start();
    }

    private static byte[] readAll(InputStream in) throws Exception {
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        byte[] buf = new byte[64 * 1024]; int n;
        while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
        in.close();
        return bo.toByteArray();
    }

    private void downloadUpdate(final String url) {
        toast("새 버전 받는 중…");
        js("window.onUpdateProgress&&window.onUpdateProgress(0)");
        new Thread(new Runnable() {
            @Override public void run() {
                try {
                    String u = url; java.net.HttpURLConnection c = null;
                    for (int hop = 0; hop < 5; hop++) {
                        c = (java.net.HttpURLConnection) new java.net.URL(u).openConnection();
                        c.setInstanceFollowRedirects(false); c.setConnectTimeout(15000); c.setReadTimeout(60000);
                        int code = c.getResponseCode();
                        if (code >= 300 && code < 400 && c.getHeaderField("Location") != null) { u = c.getHeaderField("Location"); c.disconnect(); continue; }
                        break;
                    }
                    File dir = new File(getCacheDir(), "updates"); if (!dir.exists()) dir.mkdirs();
                    File f = new File(dir, "jungdo-allinone.apk");
                    long total = c.getContentLengthLong(), got = 0; int last = -1;
                    try (InputStream in = c.getInputStream(); OutputStream out = new java.io.FileOutputStream(f)) {
                        byte[] buf = new byte[256 * 1024]; int n;
                        while ((n = in.read(buf)) > 0) {
                            out.write(buf, 0, n); got += n;
                            int p = total > 0 ? (int) (got * 100 / total) : -1;
                            if (p != last && p >= 0) { last = p; js("window.onUpdateProgress&&window.onUpdateProgress(" + p + ")"); }
                        }
                    }
                    updateFile = f;
                    js("window.onUpdateProgress&&window.onUpdateProgress(100)");
                    main.post(new Runnable() { @Override public void run() { installUpdate(); } });
                } catch (Exception e) {
                    js("window.onUpdateProgress&&window.onUpdateProgress(-1)");
                    toast("업데이트를 받지 못했어요: " + e.getMessage());
                }
            }
        }).start();
    }

    private void installUpdate() {
        if (updateFile == null) return;
        if (!getPackageManager().canRequestPackageInstalls()) {
            toast("'이 출처 허용'을 켜고 돌아오면 바로 설치돼요");
            prefs.edit().putBoolean("installAfterPerm", true).apply();
            startActivity(new Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName())));
            return;
        }
        Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", updateFile);
        Intent i = new Intent(Intent.ACTION_VIEW);
        i.setDataAndType(uri, "application/vnd.android.package-archive");
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        try { startActivity(i); } catch (Exception e) { toast("설치 화면을 열 수 없어요: " + e.getMessage()); }
    }

    private void js(final String code) { main.post(new Runnable() { @Override public void run() { web.evaluateJavascript(code, null); } }); }
    private void toast(final String m) { main.post(new Runnable() { @Override public void run() { Toast.makeText(MainActivity.this, m, Toast.LENGTH_LONG).show(); } }); }
}
