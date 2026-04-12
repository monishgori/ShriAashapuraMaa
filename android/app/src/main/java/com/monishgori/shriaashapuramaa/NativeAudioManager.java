package com.monishgori.shriaashapuramaa;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.graphics.BitmapFactory;
import android.util.Log;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.SoundPool;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.JSObject;
import java.io.IOException;

public class NativeAudioManager {
    public interface PlaybackEvents {
        void onPlaybackStateChanged(boolean isPlaying, long currentTime, long duration, int currentRepeat, int repeatCount);
        void onPlaybackEnded();
    }

    private static final String TAG = "NativeAudioManager";
    private static final String CHANNEL_ID = "devotional_audio_maa";

    private static NativeAudioManager instance;

    private final Context appContext;
    private final AudioManager audioManager;
    private MediaPlayer mediaPlayer;
    private MediaSessionCompat mediaSession;
    private AudioFocusRequest audioFocusRequest;
    private PlaybackEvents playbackEvents;
    private PowerManager.WakeLock wakeLock;
    private boolean prepared;
    private boolean playWhenPrepared;
    private int repeatCount = 1;
    private int currentRepeat = 0;
    
    private String currentTitle = "Shri Aashapura Maa";
    private String currentArtist = "Shri Aashapura Maa";
    private String currentSource = "";
    private Bitmap cachedLauncherIcon;
    private PendingIntent cachedContentIntent;
    private int lastNotifiedState = -1;
    private int lastNotifiedRepeat = -1;
    private int lastNotifiedTotal = -1;
    private String lastNotifiedTitle = "";

    // DOZE MODE JVM HEARTBEAT & TIME ACCUMULATOR
    private Handler heartbeatHandler;
    private Runnable heartbeatRunnable;
    private long totalPlayedMs = 0;
    private long lastTimeMeasured = 0;
    
    // DEVOTIONAL SFX
    private SoundPool soundPool;
    private int bellSoundId = -1;
    private int shankhSoundId = -1;
    private boolean soundsLoaded = false;

    private NativeAudioManager(Context context) {
        this.appContext = context.getApplicationContext();
        audioManager = (AudioManager) appContext.getSystemService(Context.AUDIO_SERVICE);
        
        PowerManager pm = (PowerManager) appContext.getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AashapuraMaa:AudioWakeLock");
        }

        heartbeatHandler = new Handler(Looper.getMainLooper());
        heartbeatRunnable = new Runnable() {
            @Override
            public void run() {
                try {
                    long now = System.currentTimeMillis();
                    if (lastTimeMeasured == 0) lastTimeMeasured = now;
                    long elapsed = now - lastTimeMeasured;
                    lastTimeMeasured = now;

                    if (playWhenPrepared && mediaPlayer != null && mediaPlayer.isPlaying()) {
                        long dur = getDuration();
                        if (dur > 0) {
                            totalPlayedMs += elapsed;
                            int loopsCompleted = (int) (totalPlayedMs / dur);
                            // Cap at repeatCount-1 so we don't show [12/11]
                            loopsCompleted = Math.min(loopsCompleted, repeatCount - 1);
                            
                            if (currentRepeat != loopsCompleted) {
                                currentRepeat = loopsCompleted;
                                if (currentRepeat + 1 >= repeatCount && mediaPlayer != null) {
                                    mediaPlayer.setLooping(false);
                                }
                            }
                        }
                        updatePlaybackState(PlaybackStateCompat.STATE_PLAYING);
                        syncService(); // CRITICAL: Refreshes Foreground Notification
                    }
                } catch (Exception ignored) {}
                heartbeatHandler.postDelayed(this, 1000);
            }
        };

        createNotificationChannel();
        ensureMediaSession();
        initSoundPool();
        
        try {
            cachedLauncherIcon = BitmapFactory.decodeResource(appContext.getResources(), R.mipmap.ic_launcher);
            
            Intent openIntent = appContext.getPackageManager().getLaunchIntentForPackage(appContext.getPackageName());
            if (openIntent == null) openIntent = new Intent();
            cachedContentIntent = PendingIntent.getActivity(appContext, 200, openIntent, pendingFlags());
        } catch (Exception e) {
            Log.e(TAG, "Failed to cache resources");
        }
    }

    public static synchronized NativeAudioManager getInstance(Context context) {
        if (instance == null) {
            instance = new NativeAudioManager(context);
        }
        return instance;
    }

    private void initSoundPool() {
        AudioAttributes attrs = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();
        
        soundPool = new SoundPool.Builder().setMaxStreams(5).setAudioAttributes(attrs).build();
        
        try {
            AssetFileDescriptor bellFd = appContext.getAssets().openFd("public/assets/audio/bell.mp3");
            bellSoundId = soundPool.load(bellFd, 1);
            
            AssetFileDescriptor shankhFd = appContext.getAssets().openFd("public/assets/audio/shankh.mp3");
            shankhSoundId = soundPool.load(shankhFd, 1);
            
            soundsLoaded = true;
        } catch (IOException e) {
            Log.e(TAG, "Error loading devotional sounds: " + e.getMessage());
        }
    }

    public synchronized void playBell() {
        if (soundsLoaded && bellSoundId != -1) {
            soundPool.play(bellSoundId, 1.0f, 1.0f, 1, 0, 1.0f);
        }
    }

    public synchronized void playShankh() {
        if (soundsLoaded && shankhSoundId != -1) {
            soundPool.play(shankhSoundId, 1.0f, 1.0f, 1, 0, 1.0f);
        }
    }


    public synchronized void setPlaybackEvents(PlaybackEvents events) {
        playbackEvents = events;
    }

    public synchronized void prepare(String source, String title, String artist, int requestedRepeatCount) throws IOException {
        releasePlayer();
        ensureMediaSession();

        currentTitle = title;
        currentArtist = artist;
        currentSource = source;
        repeatCount = Math.max(requestedRepeatCount, 1);
        currentRepeat = 0;
        totalPlayedMs = 0;
        lastTimeMeasured = 0;
        prepared = false;
        playWhenPrepared = false;

        mediaPlayer = new MediaPlayer();
        mediaPlayer.setWakeMode(appContext, PowerManager.PARTIAL_WAKE_LOCK);
        mediaPlayer.setAudioAttributes(
            new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build()
        );

        mediaPlayer.setOnPreparedListener(player -> {
            synchronized (NativeAudioManager.this) {
                prepared = true;
                player.setLooping(false); 

                updateMetadata();
                updatePlaybackState(PlaybackStateCompat.STATE_PAUSED);
                notifyPlaybackState();
                
                if (playWhenPrepared) {
                    startPlaybackInternal();
                }
            }
        });

        mediaPlayer.setOnSeekCompleteListener(player -> {
            synchronized (NativeAudioManager.this) {
                notifyPlaybackState();
            }
        });

        mediaPlayer.setOnCompletionListener(player -> {
            synchronized (NativeAudioManager.this) {
                if (currentRepeat + 1 < repeatCount) {
                    currentRepeat++;
                    mediaPlayer.seekTo(0);
                    if (playWhenPrepared) {
                        mediaPlayer.start();
                    }
                    updateMetadata(); 
                    updatePlaybackState(PlaybackStateCompat.STATE_PLAYING);
                    syncService();
                } else {
                    playWhenPrepared = false;
                    currentRepeat = repeatCount - 1; 
                    updateMetadata(); 
                    
                    if (wakeLock != null && wakeLock.isHeld()) {
                        wakeLock.release();
                    }

                    updatePlaybackState(PlaybackStateCompat.STATE_PAUSED);
                    notifyPlaybackState();
                    syncService(); 
                    if (playbackEvents != null) {
                        playbackEvents.onPlaybackEnded();
                    }
                }
            }
        });

        mediaPlayer.setOnErrorListener((player, what, extra) -> {
            synchronized (NativeAudioManager.this) {
                playWhenPrepared = false;
                prepared = false;
                currentRepeat = 0;
                updatePlaybackState(PlaybackStateCompat.STATE_ERROR);
                notifyPlaybackState();
            }
            return true;
        });

        if (source.startsWith("/assets/")) {
            AssetFileDescriptor descriptor = appContext.getAssets().openFd("public" + source);
            mediaPlayer.setDataSource(descriptor.getFileDescriptor(), descriptor.getStartOffset(), descriptor.getLength());
            descriptor.close();
        } else {
            mediaPlayer.setDataSource(source);
        }

        mediaPlayer.prepareAsync();
        updatePlaybackState(PlaybackStateCompat.STATE_BUFFERING);
        forceSyncService();
    }

    public synchronized void setRepeatCount(int requestedRepeatCount) {
        repeatCount = Math.max(requestedRepeatCount, 1);
        if (currentRepeat >= repeatCount) {
            currentRepeat = 0;
            totalPlayedMs = 0;
        }
        if (mediaPlayer != null) {
            mediaPlayer.setLooping(false);
        }
        notifyPlaybackState();
        syncService();
    }

    public synchronized void cycleRepeatCount() {
        int nextRepeat;
        if (repeatCount <= 1) nextRepeat = 3;
        else if (repeatCount <= 3) nextRepeat = 11;
        else if (repeatCount <= 11) nextRepeat = 21;
        else if (repeatCount <= 21) nextRepeat = 108;
        else nextRepeat = 1;
        
        setRepeatCount(nextRepeat);
        updateMetadata(); 
    }

    public synchronized void play() {
        playWhenPrepared = true;
        
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire();
        }

        if (mediaPlayer == null) {
            return;
        }

        if (!requestAudioFocus()) {
            return;
        }

        if (prepared) {
            startPlaybackInternal();
        } else {
            syncService();
        }
    }

    public synchronized void pause() {
        playWhenPrepared = false;
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }

        if (mediaPlayer != null && prepared && mediaPlayer.isPlaying()) {
            mediaPlayer.pause();
        }
        updatePlaybackState(PlaybackStateCompat.STATE_PAUSED);
        notifyPlaybackState();
        syncService();
    }

    public synchronized void stop() {
        playWhenPrepared = false;
        currentRepeat = 0;
        
        if (heartbeatHandler != null && heartbeatRunnable != null) {
            heartbeatHandler.removeCallbacks(heartbeatRunnable);
        }

        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }

        releasePlayer();
        updatePlaybackState(PlaybackStateCompat.STATE_STOPPED);
        notifyPlaybackState();
        stopService();
    }

    public synchronized void seekTo(int positionMs) {
        if (mediaPlayer != null && prepared) {
            mediaPlayer.seekTo(positionMs);
            notifyPlaybackState();
            syncService();
        }
    }

    public synchronized JSObject getStatus() {
        JSObject status = new JSObject();
        status.put("isPlaying", isPlaying());
        status.put("currentTime", getCurrentPosition());
        status.put("duration", getDuration());
        status.put("prepared", prepared);
        status.put("currentRepeat", currentRepeat);
        status.put("repeatCount", repeatCount);
        return status;
    }


    public synchronized Notification buildNotification() {
        if (mediaPlayer == null) {
            return null;
        }

        boolean active = isPlaying() || playWhenPrepared;
        NotificationCompat.Action primaryAction = active
            ? new NotificationCompat.Action(android.R.drawable.ic_media_pause, "Pause", buildServicePendingIntent(DevotionalPlaybackService.ACTION_PAUSE, 201))
            : new NotificationCompat.Action(android.R.drawable.ic_media_play, "Play", buildServicePendingIntent(DevotionalPlaybackService.ACTION_PLAY, 202));

        String displayTitle = "🔱 " + currentTitle;
        if (repeatCount > 1) {
            displayTitle += " [" + (currentRepeat + 1) + "/" + repeatCount + "]";
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(appContext, CHANNEL_ID)
            .setContentTitle(displayTitle)
            .setContentText("Devotional Mantra")
            .setSubText(currentArtist) 
            .setSmallIcon(R.mipmap.ic_launcher)
            .setLargeIcon(cachedLauncherIcon)
            .setColor(0xFFFF9933)
            .setColorized(false) 
            .setContentIntent(cachedContentIntent)
            .setDeleteIntent(buildServicePendingIntent(DevotionalPlaybackService.ACTION_STOP, 203))
            .setOnlyAlertOnce(true)
            .setOngoing(active)
            .setAutoCancel(false)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .addAction(new NotificationCompat.Action(android.R.drawable.ic_menu_revert, "Repeat", buildServicePendingIntent(DevotionalPlaybackService.ACTION_CYCLE_REPEAT, 205)))
            .addAction(primaryAction)
            .addAction(new NotificationCompat.Action(android.R.drawable.ic_menu_close_clear_cancel, "Stop", buildServicePendingIntent(DevotionalPlaybackService.ACTION_STOP, 204)))
            .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2)); 

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE);
        }

        return builder.build();
    }

    public synchronized void handleServiceAction(String action) {
        if (action == null) {
            return;
        }

        switch (action) {
            case DevotionalPlaybackService.ACTION_PLAY:
                play();
                break;
            case DevotionalPlaybackService.ACTION_PAUSE:
                pause();
                break;
            case DevotionalPlaybackService.ACTION_STOP:
                stop();
                break;
            case DevotionalPlaybackService.ACTION_CYCLE_REPEAT:
                cycleRepeatCount();
                break;
            case DevotionalPlaybackService.ACTION_BELL:
                playBell();
                break;
            case DevotionalPlaybackService.ACTION_SHANKH:
                playShankh();
                break;
            default:
                break;
        }
    }

    public synchronized boolean shouldRunInForeground() {
        return isPlaying() || playWhenPrepared;
    }

    public synchronized boolean shouldKeepNotification() {
        return mediaPlayer != null;
    }

    private void startPlaybackInternal() {
        if (mediaPlayer == null || !prepared) {
            return;
        }

        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(); 
        }

        if (!mediaPlayer.isPlaying()) {
            mediaPlayer.start();
        }
        
        lastTimeMeasured = System.currentTimeMillis();
        if (heartbeatHandler != null && heartbeatRunnable != null) {
            heartbeatHandler.removeCallbacks(heartbeatRunnable);
            heartbeatHandler.postDelayed(heartbeatRunnable, 1000);
        }
        
        updateMetadata();
        updatePlaybackState(PlaybackStateCompat.STATE_PLAYING);
        notifyPlaybackState();
        syncService();
    }

    private void ensureMediaSession() {
        if (mediaSession != null) {
            return;
        }

        mediaSession = new MediaSessionCompat(appContext, "ShriAashapuraMaa");
        mediaSession.setFlags(MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS | MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS);
        Intent openIntent = appContext.getPackageManager().getLaunchIntentForPackage(appContext.getPackageName());
        if (openIntent != null) {
            mediaSession.setSessionActivity(PendingIntent.getActivity(appContext, 205, openIntent, pendingFlags()));
        }
        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                play();
            }

            @Override
            public void onPause() {
                pause();
            }

            @Override
            public void onStop() {
                stop();
            }

            @Override
            public void onSeekTo(long pos) {
                seekTo((int) pos);
            }

            @Override
            public void onCustomAction(String action, android.os.Bundle extras) {
                if (DevotionalPlaybackService.ACTION_CYCLE_REPEAT.equals(action)) {
                    cycleRepeatCount();
                } else if (DevotionalPlaybackService.ACTION_BELL.equals(action)) {
                    playBell();
                } else if (DevotionalPlaybackService.ACTION_SHANKH.equals(action)) {
                    playShankh();
                }
            }
        });
        mediaSession.setActive(true);
        updatePlaybackState(PlaybackStateCompat.STATE_NONE);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        String name = "Aashapura Playback";
        String description = "Show devotional audio controls";
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, NotificationManager.IMPORTANCE_DEFAULT);
        channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
        channel.setDescription(description);
        NotificationManager manager = appContext.getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }

    private PendingIntent buildServicePendingIntent(String action, int requestCode) {
        Intent intent = new Intent(appContext, DevotionalPlaybackService.class);
        intent.setAction(action);
        return PendingIntent.getService(appContext, requestCode, intent, pendingFlags());
    }

    private int pendingFlags() {
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return flags;
    }

    private boolean requestAudioFocus() {
        if (audioManager == null) {
            return true;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (audioFocusRequest == null) {
                audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build())
                    .setOnAudioFocusChangeListener(focusChange -> {
                        if (focusChange <= AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                            pause();
                        }
                    })
                    .build();
            }
            return audioManager.requestAudioFocus(audioFocusRequest) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        }

        return audioManager.requestAudioFocus(
            focusChange -> {
                if (focusChange <= AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                    pause();
                }
            },
            AudioManager.STREAM_MUSIC,
            AudioManager.AUDIOFOCUS_GAIN
        ) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    }

    private void updateMetadata() {
        if (mediaSession == null) {
            return;
        }

        String displayTitle = currentTitle;
        if (repeatCount > 1) {
            displayTitle += " [" + (currentRepeat + 1) + "/" + repeatCount + "]";
        }

        mediaSession.setMetadata(new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, displayTitle)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
            .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, getDuration())
            .build());
    }

    private void updatePlaybackState(int state) {
        if (mediaSession == null) {
            return;
        }

        long actions = PlaybackStateCompat.ACTION_PLAY
            | PlaybackStateCompat.ACTION_PAUSE
            | PlaybackStateCompat.ACTION_PLAY_PAUSE
            | PlaybackStateCompat.ACTION_SEEK_TO;

        PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
            .setActions(actions)
            .setState(state, getCurrentPosition(), 1f);

        mediaSession.setPlaybackState(stateBuilder.build());
    }

    private void notifyPlaybackState() {
        if (playbackEvents != null) {
            playbackEvents.onPlaybackStateChanged(isPlaying(), getCurrentPosition(), getDuration(), currentRepeat, repeatCount);
        }
    }

    private long getCurrentPosition() {
        try {
            if (mediaPlayer == null || !prepared) {
                return 0L;
            }
            return mediaPlayer.getCurrentPosition();
        } catch (Exception e) {
            return -1L; 
        }
    }

    private long getDuration() {
        try {
            if (mediaPlayer == null || !prepared) {
                return 0L;
            }
            return Math.max(mediaPlayer.getDuration(), 0);
        } catch (Exception e) {
            return 0L;
        }
    }

    private boolean isPlaying() {
        try {
            return mediaPlayer != null && prepared && mediaPlayer.isPlaying();
        } catch (Exception e) {
            return false;
        }
    }

    public synchronized void syncService() {
        if (!prepared) return;

        boolean active = isPlaying() || playWhenPrepared;
        int currentState = isPlaying() ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;

        updatePlaybackState(currentState);

        if (active) {
            if (currentState != lastNotifiedState || 
                currentRepeat != lastNotifiedRepeat || 
                repeatCount != lastNotifiedTotal || 
                !currentTitle.equals(lastNotifiedTitle)) {
                
                lastNotifiedState = currentState;
                lastNotifiedRepeat = currentRepeat;
                lastNotifiedTotal = repeatCount;
                lastNotifiedTitle = currentTitle;

                updateMetadata(); 

                Intent intent = new Intent(appContext, DevotionalPlaybackService.class);
                intent.setAction(DevotionalPlaybackService.ACTION_SYNC);
                
                try {
                    if (!DevotionalPlaybackService.isForeground) {
                        androidx.core.content.ContextCompat.startForegroundService(appContext, intent);
                    } else {
                        Notification notification = buildNotification();
                        if (notification != null) {
                            androidx.core.app.NotificationManagerCompat.from(appContext).notify(1088, notification);
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Notification sync failed: " + e.getMessage());
                }
            }
        } else {
            if (!shouldKeepNotification()) {
                stopService();
            } else if (currentState != lastNotifiedState) {
                lastNotifiedState = currentState;
                Notification notification = buildNotification();
                if (notification != null) {
                    androidx.core.app.NotificationManagerCompat.from(appContext).notify(1088, notification);
                }
            }
        }
    }

    private void forceSyncService() {
        lastNotifiedState = -1;
        syncService();
    }

    private void stopService() {
        Intent intent = new Intent(appContext, DevotionalPlaybackService.class);
        appContext.stopService(intent);
    }

    private void releasePlayer() {
        if (heartbeatHandler != null && heartbeatRunnable != null) {
            heartbeatHandler.removeCallbacks(heartbeatRunnable);
        }
        if (mediaPlayer != null) {
            try { mediaPlayer.reset(); } catch (IllegalStateException ignored) {}
            mediaPlayer.release();
            mediaPlayer = null;
        }
        prepared = false;
    }
}
