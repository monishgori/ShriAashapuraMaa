package com.monishgori.shriaashapuramaa;

import android.app.Notification;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationManagerCompat;

public class DevotionalPlaybackService extends Service {
    public static final String ACTION_SYNC = "com.monishgori.shriaashapuramaa.action.SYNC";
    public static final String ACTION_PLAY = "com.monishgori.shriaashapuramaa.action.PLAY";
    public static final String ACTION_PAUSE = "com.monishgori.shriaashapuramaa.action.PAUSE";
    public static final String ACTION_STOP = "com.monishgori.shriaashapuramaa.action.STOP";
    public static final String ACTION_CYCLE_REPEAT = "com.monishgori.shriaashapuramaa.action.CYCLE_REPEAT";
    public static final String ACTION_BELL = "com.monishgori.shriaashapuramaa.action.BELL";
    public static final String ACTION_SHANKH = "com.monishgori.shriaashapuramaa.action.SHANKH";
    private static final int NOTIFICATION_ID = 1088;

    private NativeAudioManager audioManager;

    @Override
    public void onCreate() {
        super.onCreate();
        audioManager = NativeAudioManager.getInstance(getApplicationContext());
    }

    public static boolean isForeground = false;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : ACTION_SYNC;
        audioManager.handleServiceAction(action);

        Notification notification = audioManager.buildNotification();
        if (notification == null) {
            stopForegroundCompat(true);
            isForeground = false;
            stopSelf();
            return START_NOT_STICKY;
        }

        boolean shouldBeInForeground = audioManager.shouldRunInForeground();

        if (shouldBeInForeground) {
            if (!isForeground) {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                    startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
                } else {
                    startForeground(NOTIFICATION_ID, notification);
                }
                isForeground = true;
            } else {
                // Already in foreground, just update the notification content.
                // This bypasses the OS background start restrictions.
                NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, notification);
            }
        } else if (audioManager.shouldKeepNotification()) {
            stopForegroundCompat(false);
            isForeground = false;
            NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, notification);
        } else {
            stopForegroundCompat(true);
            isForeground = false;
            stopSelf();
        }

        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        stopForegroundCompat(true);
        super.onDestroy();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        if (audioManager != null) {
            audioManager.stop();
        }
        stopSelf();
        super.onTaskRemoved(rootIntent);
    }

    private void stopForegroundCompat(boolean removeNotification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(removeNotification ? STOP_FOREGROUND_REMOVE : STOP_FOREGROUND_DETACH);
        } else {
            stopForeground(removeNotification);
        }
    }
}
