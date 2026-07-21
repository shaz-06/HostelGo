package com.buyto.app;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import android.webkit.WebView;
import android.webkit.WebResourceRequest;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        try {
            this.getBridge().getWebView().setWebViewClient(new BridgeWebViewClient(this.getBridge()) {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    Uri uri = request.getUrl();
                    if (handleUri(uri)) {
                        return true;
                    }
                    return super.shouldOverrideUrlLoading(view, request);
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    Uri uri = Uri.parse(url);
                    if (handleUri(uri)) {
                        return true;
                    }
                    return super.shouldOverrideUrlLoading(view, url);
                }

                private boolean handleUri(Uri uri) {
                    if (uri == null) return false;
                    String scheme = uri.getScheme();
                    if (scheme != null && (scheme.equals("upi") || uri.toString().startsWith("intent://"))) {
                        try {
                            Intent intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
                            if (intent != null) {
                                intent.addCategory(Intent.CATEGORY_BROWSABLE);
                                intent.setComponent(null);
                                intent.setSelector(null);
                                if (getPackageManager().resolveActivity(intent, 0) != null) {
                                    startActivity(intent);
                                } else {
                                    Log.e("MainActivity", "No app available to handle UPI intent: " + uri.toString());
                                }
                                return true;
                            }
                        } catch (Exception e) {
                            Log.e("MainActivity", "Error handling UPI intent: " + e.getMessage());
                        }
                    }
                    return false;
                }
            });
        } catch (Exception e) {
            Log.e("MainActivity", "Error setting custom WebViewClient: " + e.getMessage());
        }
    }
}

