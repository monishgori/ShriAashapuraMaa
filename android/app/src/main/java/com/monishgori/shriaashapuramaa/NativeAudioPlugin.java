package com.monishgori.shriaashapuramaa;

import android.Manifest;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "NativeAudio",
    permissions = {
        @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class NativeAudioPlugin extends Plugin implements NativeAudioManager.PlaybackEvents {
    private NativeAudioManager audioManager;

    @Override
    public void load() {
        audioManager = NativeAudioManager.getInstance(getContext().getApplicationContext());
        audioManager.setPlaybackEvents(this);
    }

    @Override
    protected void handleOnDestroy() {
        if (audioManager != null) {
            audioManager.setPlaybackEvents(null);
        }
    }

    @PluginMethod
    public void hasNotificationPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", notificationsGranted());
        call.resolve(result);
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (notificationsGranted()) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            JSObject result = new JSObject();
            result.put("granted", NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
            call.resolve(result);
            return;
        }

        requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
    }

    private boolean notificationsGranted() {
        if (!NotificationManagerCompat.from(getContext()).areNotificationsEnabled()) {
            return false;
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return true;
        }

        return getPermissionState("notifications") == PermissionState.GRANTED;
    }

    @SuppressWarnings("unused")
    private void notificationPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", notificationsGranted());
        call.resolve(result);
    }

    @PluginMethod
    public void prepare(PluginCall call) {
        String source = call.getString("src");
        String title = call.getString("title", "Shri Aashapura Maa");
        String artist = call.getString("artist", "Shri Aashapura Maa");

        if (source == null || source.trim().isEmpty()) {
            call.reject("Audio source is required.");
            return;
        }

        try {
            int repeatCount = 1;
            if (call.hasOption("repeatCount")) {
                Double val = call.getDouble("repeatCount");
                if (val != null) {
                    repeatCount = val.intValue();
                } else {
                    repeatCount = call.getInt("repeatCount", 1);
                }
            }
            audioManager.prepare(source, title, artist, repeatCount);
            call.resolve(audioManager.getStatus());
        } catch (Exception exception) {
            call.reject("Failed to prepare audio.", exception);
        }
    }


    @PluginMethod
    public void setRepeatCount(PluginCall call) {
        int repeatCount = 1;
        if (call.hasOption("repeatCount")) {
            Double val = call.getDouble("repeatCount");
            if (val != null) {
                repeatCount = val.intValue();
            } else {
                repeatCount = call.getInt("repeatCount", 1);
            }
        }
        audioManager.setRepeatCount(repeatCount);
        call.resolve(audioManager.getStatus());
    }

    @PluginMethod
    public void play(PluginCall call) {
        audioManager.play();
        call.resolve(audioManager.getStatus());
    }

    @PluginMethod
    public void pause(PluginCall call) {
        audioManager.pause();
        call.resolve(audioManager.getStatus());
    }

    @PluginMethod
    public void stop(PluginCall call) {
        audioManager.stop();
        call.resolve(audioManager.getStatus());
    }

    @PluginMethod
    public void seekTo(PluginCall call) {
        Integer position = call.getInt("position", 0);
        audioManager.seekTo(position);
        call.resolve(audioManager.getStatus());
    }

    @PluginMethod
    public void bell(PluginCall call) {
        audioManager.playBell();
        call.resolve();
    }

    @PluginMethod
    public void shankh(PluginCall call) {
        audioManager.playShankh();
        call.resolve();
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(audioManager.getStatus());
    }

    @Override
    public void onPlaybackStateChanged(boolean isPlaying, long currentTime, long duration, int currentRepeat, int repeatCount) {
        JSObject status = new JSObject();
        status.put("isPlaying", isPlaying);
        status.put("currentTime", currentTime);
        status.put("duration", duration);
        status.put("currentRepeat", currentRepeat);
        status.put("repeatCount", repeatCount);
        notifyListeners("playbackStateChange", status);
    }

    @Override
    public void onPlaybackEnded() {
        notifyListeners("playbackEnded", new JSObject(), true);
    }
}
