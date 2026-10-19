
package com.buyto.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.ImageView;
import android.graphics.Color;
import android.graphics.BitmapFactory;
import android.graphics.Bitmap;
import android.view.ViewGroup;
import android.widget.FrameLayout;

public class BuytoSplashActivity extends Activity {

    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean opened = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setStatusBarColor(Color.rgb(255, 204, 0));
        getWindow().setNavigationBarColor(Color.rgb(255, 204, 0));
        getWindow().getDecorView().setSystemUiVisibility(0);

        ImageView imageView = new ImageView(this);
        imageView.setImageResource(R.drawable.buyto_minutes_splash);
        imageView.setScaleType(ImageView.ScaleType.FIT_XY);
        imageView.setBackgroundColor(Color.rgb(255, 204, 0));

        FrameLayout layout = new FrameLayout(this);
        layout.setBackgroundColor(Color.rgb(255, 204, 0));
        layout.addView(imageView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        setContentView(layout);

        handler.postDelayed(this::openMainActivity, 1200);
    }

    private void openMainActivity() {
        if (opened || isFinishing()) return;
        opened = true;

        Intent intent = new Intent(this, MainActivity.class);
        intent.setAction(getIntent().getAction());
        intent.setData(getIntent().getData());
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }
}
