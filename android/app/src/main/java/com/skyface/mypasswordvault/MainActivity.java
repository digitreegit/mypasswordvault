package com.skyface.mypasswordvault;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }

    @Override
    protected void load() {
        super.load();
        enableWebAuthn();
        applySafeAreaInsets();
    }

    /** Forward system bar / cutout insets to CSS vars (Android WebView env() is often 0). */
    private void applySafeAreaInsets() {
        if (getBridge() == null) return;
        WebView webView = getBridge().getWebView();
        if (webView == null) return;

        ViewCompat.setOnApplyWindowInsetsListener(webView, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            Insets cutout = windowInsets.getInsets(WindowInsetsCompat.Type.displayCutout());
            int top = Math.max(bars.top, cutout.top);
            int bottom = Math.max(bars.bottom, cutout.bottom);
            int left = Math.max(bars.left, cutout.left);
            int right = Math.max(bars.right, cutout.right);

            String js =
                "document.documentElement.style.setProperty('--native-inset-top','"
                    + top
                    + "px');"
                    + "document.documentElement.style.setProperty('--native-inset-bottom','"
                    + bottom
                    + "px');"
                    + "document.documentElement.style.setProperty('--native-inset-left','"
                    + left
                    + "px');"
                    + "document.documentElement.style.setProperty('--native-inset-right','"
                    + right
                    + "px');";

            webView.post(() -> webView.evaluateJavascript(js, null));
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(webView);
    }

    private void enableWebAuthn() {
        if (getBridge() == null) return;
        WebView webView = getBridge().getWebView();
        if (webView == null) return;
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_AUTHENTICATION)) {
            WebSettingsCompat.setWebAuthenticationSupport(
                webView.getSettings(),
                WebSettingsCompat.WEB_AUTHENTICATION_SUPPORT_FOR_APP
            );
        }
    }
}
