import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { LocalNotifications } from '@capacitor/local-notifications';
import { chalisaData } from './data/chalisa';
import { mantras } from './data/mantras';
import { bhajans } from './data/bhajans';
import { aartis } from './data/aartis';
import { stutis } from './data/stutis';
import { quotes } from './data/quotes';
import { videos } from './data/videos';
import { historyData } from './data/history';
import { policyData } from './data/policy';

// Register Native Audio Plugin for Background Playback
const NativeAudio = registerPlugin('NativeAudio');
const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

// Web haptics fallback
const ImpactStyle = {
  Light: 10,
  Medium: 20,
  Heavy: 30
};

// Memoized Library Tray to prevent jumping/flickering on re-renders
const DevotionalLibrary = React.memo(({
  isLibraryOpen, setIsLibraryOpen, language, startReading, morningToggle, eveningToggle, isMorningOn, isEveningOn,
  morningTime, setMorningTime, eveningTime, setEveningTime
}) => {
  return (
    <>
      {isLibraryOpen && <div className="tray-backdrop" onClick={() => setIsLibraryOpen(false)}></div>}
      <div
        className={`library-tray glass-panel ${isLibraryOpen ? 'active' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tray-handle" onClick={() => setIsLibraryOpen(false)}></div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0 10px' }}>
          <div className="tray-title" style={{ margin: 0 }}>ભક્તિ લાયબ્રેરી</div>
        </div>

        <div className="library-grid">
          <button className="library-card" onClick={(e) => { e.stopPropagation(); startReading('chalisa'); }}>
            <span className="lib-hindi">
              {language === 'gujarati' ? 'મા ની ચાલીસા' : language === 'english' ? "Maa's Chalisa" : 'माँ की चालीसा'}
            </span>
            <span className="lib-eng">CHALISA</span>
          </button>
          <button className="library-card" onClick={(e) => { e.stopPropagation(); startReading('mantras'); }}>
            <span className="lib-hindi">
              {language === 'gujarati' ? 'સિદ્ધ મંત્ર' : language === 'english' ? "Maa's Mantras" : 'सिद्ध मंत्र'}
            </span>
            <span className="lib-eng">MANTRAS</span>
          </button>
          <button className="library-card" onClick={(e) => { e.stopPropagation(); startReading('bhajans'); }}>
            <span className="lib-hindi">
              {language === 'gujarati' ? 'ભજન સંગ્રહ' : language === 'english' ? "Maa's Bhajans" : 'भजन संग्रह'}
            </span>
            <span className="lib-eng">BHAJANS</span>
          </button>
          <button className="library-card" onClick={(e) => { e.stopPropagation(); startReading('aartis'); }}>
            <span className="lib-hindi">
              {language === 'gujarati' ? 'મા ની આરતી' : language === 'english' ? "Maa's Aarti" : 'माँ की आरती'}
            </span>
            <span className="lib-eng">AARTI</span>
          </button>
          <button className="library-card" onClick={(e) => { e.stopPropagation(); startReading('stutis'); }}>
            <span className="lib-hindi">
              {language === 'gujarati' ? 'મા ની સ્તુતિ' : language === 'english' ? "Maa's Stuti" : 'माँ की स्तुति'}
            </span>
            <span className="lib-eng">STUTI</span>
          </button>
          <button className="library-card" onClick={(e) => { e.stopPropagation(); startReading('history'); }}>
            <span className="lib-hindi">
              {language === 'gujarati' ? 'મા નો ઇતિહાસ' : language === 'english' ? "Maa's History" : 'माँ का इतिहास'}
            </span>
            <span className="lib-eng">HISTORY</span>
          </button>
          <button className="library-card library-card-wide" onClick={(e) => { e.stopPropagation(); startReading('videos'); }}>
            <div className="wide-card-content">
              <div className="wide-text">
                <span className="lib-hindi" style={{ fontSize: '1.3rem' }}>
                  {language === 'gujarati' ? 'માતાજી ના દર્શન' : language === 'english' ? "Maa's Darshan" : 'माताजी के दर्शन'}
                </span>
                <span className="lib-eng">VIDEOS</span>
              </div>
            </div>
          </button>
        </div>

        <div className="settings-section" style={{ marginTop: '20px', padding: '0 15px' }}>
          <div style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {language === 'gujarati' ? 'દૈનિક સૂચનાઓ (Reminders)' : language === 'english' ? 'Daily Reminders' : 'दैनिक सूचनाएं (Reminders)'}
          </div>

          <div className="setting-row glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '12px 15px', marginBottom: '10px', borderRadius: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ color: '#fff', fontSize: '0.9rem' }}>
                <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>🌅</span>
                {language === 'gujarati' ? 'આજનો વિચાર' : language === 'english' ? 'Morning Quote' : 'सुबह का विचार'}
              </div>
              <div className={`switch ${isMorningOn ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); morningToggle(!isMorningOn); }}>
                <div className="switch-knob"></div>
              </div>
            </div>
            {isMorningOn && (
              <div className="time-picker-row" style={{ marginTop: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                  {language === 'gujarati' ? 'સમય પસંદ કરો:' : language === 'english' ? 'Select Time:' : 'समय चुनें:'}
                </span>
                <input
                  type="time"
                  value={morningTime}
                  onChange={(e) => setMorningTime(e.target.value)}
                  className="settings-time-input"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>

          <div className="setting-row glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '12px 15px', borderRadius: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ color: '#fff', fontSize: '0.9rem' }}>
                <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>🪔</span>
                {language === 'gujarati' ? 'સાંજ ની આરતી' : language === 'english' ? 'Evening Aarti' : 'शाम की आरती'}
              </div>
              <div className={`switch ${isEveningOn ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); eveningToggle(!isEveningOn); }}>
                <div className="switch-knob"></div>
              </div>
            </div>
            {isEveningOn && (
              <div className="time-picker-row" style={{ marginTop: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                  {language === 'gujarati' ? 'સમય પસંદ કરો:' : language === 'english' ? 'Select Time:' : 'समय चुनें:'}
                </span>
                <input
                  type="time"
                  value={eveningTime}
                  onChange={(e) => setEveningTime(e.target.value)}
                  className="settings-time-input"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        </div>

        <div className="tray-privacy-footer" style={{ textAlign: 'center', padding: '20px 0 15px 0', opacity: 0.5, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '2px', color: 'var(--secondary)', fontWeight: 'bold' }}>
            DEVELOPER: DS DIGITAL'S
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); startReading('policy'); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.6rem',
              letterSpacing: '1px',
              cursor: 'pointer',
              fontWeight: '500',
              opacity: 0.8
            }}
          >
            PRIVACY POLICY
          </button>
        </div>
      </div>
    </>
  );
});

function App() {
  const [currentMode, setCurrentMode] = useState(() => {
    try { return localStorage.getItem('pooja_mode') || 'chalisa'; } catch { return 'chalisa'; }
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('pooja_lang') || 'gujarati'; } catch { return 'gujarati'; }
  });
  const [repeatCount, setRepeatCount] = useState(() => {
    try { return Number(localStorage.getItem('pooja_repeat')) || 1; } catch { return 1; }
  });
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [isBellRinging, setIsBellRinging] = useState(false);
  const [flowers, setFlowers] = useState([]);
  const [isLyricsVisible, setIsLyricsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeVerse, setActiveVerse] = useState(0);
  const [activeItemIndex, setActiveItemIndex] = useState(() => {
    try { return Number(localStorage.getItem('pooja_index')) || 0; } catch { return 0; }
  });
  const [activeIncidentIndex, setActiveIncidentIndex] = useState(null);
  const [historyView, setHistoryView] = useState('menu'); // 'menu', 'lifeStory', 'incidents'
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Notification States
  const [morningNotification, setMorningNotification] = useState(() => {
    try { return localStorage.getItem('maa_morning_notif') === 'true'; } catch { return false; }
  });
  const [eveningNotification, setEveningNotification] = useState(() => {
    try { return localStorage.getItem('maa_evening_notif') === 'true'; } catch { return false; }
  });

  const [morningTime, setMorningTime] = useState(() => {
    try { return localStorage.getItem('maa_morning_time') || '06:30'; } catch { return '06:30'; }
  });
  const [eveningTime, setEveningTime] = useState(() => {
    try { return localStorage.getItem('maa_evening_time') || '18:30'; } catch { return '18:30'; }
  });

  // Ref to track repeatCount without triggering effect re-runs
  const repeatCountRef = useRef(repeatCount);
  useEffect(() => {
    repeatCountRef.current = repeatCount;
  }, [repeatCount]);

  // Handle Notification Scheduling
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== 'granted') {
          if (morningNotification || eveningNotification) {
            const reqStatus = await LocalNotifications.requestPermissions();
            if (reqStatus.display !== 'granted') {
              setMorningNotification(false);
              setEveningNotification(false);
              return;
            }
          } else {
            return;
          }
        }

        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
        }

        const notificationsList = [];

        if (morningNotification) {
          const [h, m] = morningTime.split(':').map(Number);
          notificationsList.push({
            title: language === 'gujarati' ? 'શુભ પ્રભાત ધન્ય દિવસ! 🌅' : language === 'english' ? 'Good Morning! 🌅' : 'शुभ प्रभात धन्य दिन! 🌅',
            body: language === 'gujarati' ? 'તમારો આજનો વિચાર વાંચવા માટે ટચ કરો.' : language === 'english' ? 'Tap to read your thought of the day.' : 'आज का विचार पढ़ने के लिए टैप करें।',
            id: 1,
            schedule: { on: { hour: h, minute: m }, allowWhileIdle: true }
          });
        }

        if (eveningNotification) {
          const [h, m] = eveningTime.split(':').map(Number);
          notificationsList.push({
            title: language === 'gujarati' ? 'આરતી નો સમય' : language === 'english' ? 'Evening Aarti Time' : 'आरती का समय',
            body: language === 'gujarati' ? 'શ્રી આશાપુરા મા ની સાંજની આરતી કરવાનો સમય થઈ ગયો છે.' : language === 'english' ? 'It is time for Shri Aashapura Maa evening Aarti.' : 'श्री आशापुरा माँ की शाम की आरती का समय हो गया है।',
            id: 2,
            schedule: { on: { hour: h, minute: m }, allowWhileIdle: true }
          });
        }

        if (notificationsList.length > 0) {
          await LocalNotifications.schedule({ notifications: notificationsList });
        }
      } catch (e) {
        console.log('Notification setup failed', e);
      }
    };

    setupNotifications();
    localStorage.setItem('maa_morning_notif', morningNotification.toString());
    localStorage.setItem('maa_evening_notif', eveningNotification.toString());
    localStorage.setItem('maa_morning_time', morningTime);
    localStorage.setItem('maa_evening_time', eveningTime);
  }, [morningNotification, eveningNotification, morningTime, eveningTime, language]);

  useEffect(() => {
    if (isLibraryOpen) {
      document.body.classList.add('tray-open');
    } else {
      document.body.classList.remove('tray-open');
    }
  }, [isLibraryOpen]);

  const [sleepTimer, setSleepTimer] = useState(null); 
  const [timerId, setTimerId] = useState(null);
  const [dailyQuote, setDailyQuote] = useState({ gujarati: '', hindi: '', english: '' });
  const [isDiyaLit, setIsDiyaLit] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Splash Screen Logic
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); 
    return () => clearTimeout(splashTimer);
  }, []);

  // Initialize AdMob
  useEffect(() => {
    const prepareAds = async () => {
      if (!Capacitor.isNativePlatform()) return;
      try {
        await AdMob.initialize();
        await AdMob.showBanner({
          adId: 'ca-app-pub-5914382038291713/1282219355',
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: false
        });
      } catch (e) { console.warn("AdMob Global Error:", e.message); }
    };
    prepareAds();
  }, []);

  const backgroundImage = '/assets/images/bgimage.jpeg';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (language === 'english') {
      if (hour < 12) return "Good Morning";
      if (hour < 17) return "Good Afternoon";
      return "Good Evening";
    } else if (language === 'gujarati') {
      if (hour < 12) return "શુભ પ્રભાત";
      if (hour < 17) return "શુભ બપોર";
      return "શુભ સંધ્યા";
    } else {
      if (hour < 12) return "शुभ प्रभात";
      if (hour < 17) return "शुभ दोपहर";
      return "शुभ संध्या";
    }
  };

  const triggerHaptic = (style = ImpactStyle.Medium) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(style);
    }
  };

  useEffect(() => {
    const today = new Date();
    const dayHash = (today.getFullYear() * 1000) + (today.getMonth() * 40) + today.getDate();
    const quoteIndex = dayHash % quotes.length;
    setDailyQuote(quotes[quoteIndex]);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('pooja_mode', currentMode);
      localStorage.setItem('pooja_lang', language);
      localStorage.setItem('pooja_repeat', repeatCount);
      localStorage.setItem('pooja_index', activeItemIndex);
    } catch (e) {
      console.warn("Storage full or disabled:", e);
    }
  }, [currentMode, language, repeatCount, activeItemIndex]);

  useEffect(() => {
    if (sleepTimer) {
      if (timerId) clearTimeout(timerId);
      const id = setTimeout(() => {
        if (isNativeAndroid) {
          NativeAudio.pause().catch(() => {});
        } else if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
        setSleepTimer(null);
      }, sleepTimer * 60000);
      setTimerId(id);
    }
    return () => { if (timerId) clearTimeout(timerId); };
  }, [sleepTimer, timerId]);

  const shareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Shri Aashapura Maa App',
        text: 'Download Shri Aashapura Maa app for Daily Quotes, Chalisa and Bhajans!',
        url: window.location.href,
      }).catch(console.error);
    }
  };

  const audioRef = useRef(null);
  const bellAudioRef = useRef(null);
  const shankhAudioRef = useRef(null);

  const ensureNotificationPermission = useCallback(async () => {
    if (!isNativeAndroid) return true;
    try {
      const permission = await NativeAudio.hasNotificationPermission();
      if (permission?.granted) return true;
      const requested = await NativeAudio.requestNotificationPermission();
      return Boolean(requested?.granted);
    } catch (error) {
      return false;
    }
  }, []);

  useEffect(() => {
    return () => {
      [audioRef, bellAudioRef, shankhAudioRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.src = "";
          ref.current = null;
        }
      });
      if (isNativeAndroid) {
        NativeAudio.stop().catch(() => {});
      }
    };
  }, []);

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
  };

  const handleSeekEnd = (e) => {
    const time = Number(e.target.value);
    if (isNativeAndroid) {
      NativeAudio.seekTo({ position: Math.round(time * 1000) }).catch(() => {});
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setIsSeeking(false);
  };

  const formatTime = (time) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  useEffect(() => {
    if (isLyricsVisible && isPlaying) {
      const activeElement = document.querySelector('.active-verse');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeVerse, isLyricsVisible, isPlaying]);

  const startFlowerShower = () => {
    const flowerTypes = ['🌼', '🌹', '🪷', '💮', '🌻', '🌷', '🏵️', '🌸'];
    setFlowers(prev => {
      if (prev.length > 150) return prev; 
      const newFlowers = Array.from({ length: 45 }).map((_, i) => ({
        id: Math.random().toString(36).substr(2, 9) + i,
        type: flowerTypes[Math.floor(Math.random() * flowerTypes.length)],
        left: Math.random() * 100 + '%',
        delay: Math.random() * 2 + 's', 
        duration: 4 + Math.random() * 4 + 's',
        sideSway: (Math.random() * 100 - 50) + 'px', 
        rotateAxis: Math.random() > 0.5 ? 'X' : 'Y'
      }));
      return [...prev, ...newFlowers];
    });
    setTimeout(() => {
      setFlowers(prev => prev.slice(45)); 
    }, 8500);
  };

  const toggleDiya = () => {
    triggerHaptic();
    setIsDiyaLit(!isDiyaLit);
  };

  const createAudioInstance = (path) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    audio.pause();
    audio.src = path;
    audio.preload = "auto";
    audio.load();
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.ontimeupdate = () => {
      if (!isSeeking) {
        setCurrentTime(audio.currentTime);
        if (audio.duration && isFinite(audio.duration)) {
          setDuration(audio.duration);
        }
      }
    };
    audio.onloadedmetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    audio.onerror = () => setIsPlaying(false);
    return audio;
  };

  const getCurrentTrackTitle = () => {
    if (currentMode === 'chalisa') return "Aashapura Maa Chalisa";
    if (currentMode === 'mantras') return mantras[activeItemIndex]?.name || "Divine Mantra";
    if (currentMode === 'bhajans') return bhajans[activeItemIndex]?.name || "Maa's Bhajan";
    if (currentMode === 'aartis') return "Maa's Aarti";
    if (currentMode === 'stutis') return "Maa's Stuti";
    return 'Shri Aashapura Maa';
  };

  const prepareNativeTrack = useCallback(async (path) => {
    try {
      await ensureNotificationPermission();
      const status = await NativeAudio.prepare({
        src: path,
        title: getCurrentTrackTitle(),
        artist: 'Shri Aashapura Maa',
        repeatCount: repeatCountRef.current
      });
      setCurrentTime((status?.currentTime || 0) / 1000);
      setDuration((status?.duration || 0) / 1000);
      setCurrentRepeat(Number(status?.currentRepeat || 0));
      setIsPlaying(Boolean(status?.isPlaying));
    } catch (error) {}
  }, [currentMode, activeItemIndex, ensureNotificationPermission]);

  const syncNativeStatus = useCallback(async () => {
    if (!isNativeAndroid) return;
    try {
      const status = await NativeAudio.getStatus();
      setIsPlaying(Boolean(status?.isPlaying));
      if (!isSeeking) {
        setCurrentTime((status?.currentTime || 0) / 1000);
      }
      setDuration((status?.duration || 0) / 1000);
    } catch (error) {}
  }, [isSeeking]);

  const getAudioPath = () => {
    const audioModes = ['chalisa', 'mantras', 'bhajans', 'aartis', 'stutis'];
    if (!audioModes.includes(currentMode)) return "/assets/audio/chalisa1.mp3";
    return currentMode === 'chalisa' ? "/assets/audio/chalisa1.mp3" :
      currentMode === 'mantras' ? (mantras[activeItemIndex]?.audio || "/assets/audio/om.mp3") :
        currentMode === 'bhajans' ? (bhajans[activeItemIndex]?.audio || "/assets/audio/Jholi_Meri_Bhar_De.mp3") :
          currentMode === 'aartis' ? (aartis[activeItemIndex]?.audio || "/assets/audio/aarti.mp3") :
            currentMode === 'stutis' ? (stutis[activeItemIndex]?.audio || "/assets/audio/Stuti.mp3") :
              "/assets/audio/chalisa1.mp3";
  };

  useEffect(() => {
    const audioModes = ['chalisa', 'mantras', 'bhajans', 'aartis', 'stutis'];
    if (!audioModes.includes(currentMode)) return;
    const path = getAudioPath();
    setCurrentTime(0);
    setDuration(0);
    setCurrentRepeat(0);
    setIsPlaying(false);
    if (isNativeAndroid) {
      prepareNativeTrack(path);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = path;
        audioRef.current.load();
      } else {
        createAudioInstance(path);
      }
    }
  }, [activeItemIndex, currentMode]);

  useEffect(() => {
    if (isNativeAndroid) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.onended = () => {
      if (currentRepeat + 1 < repeatCount) {
        setCurrentRepeat(prev => prev + 1);
        audio.currentTime = 0;
        setTimeout(() => {
          if (audio) audio.play().catch(() => {});
        }, 200);
      } else {
        setIsPlaying(false);
        audio.currentTime = audio.duration || 0;
      }
    };
  }, [currentRepeat, repeatCount]);

  useEffect(() => {
    if (!isNativeAndroid) return;
    let stateListener = null;
    let endedListener = null;
    const setupNativeListeners = async () => {
      stateListener = await NativeAudio.addListener('playbackStateChange', (status) => {
        setIsPlaying(Boolean(status?.isPlaying));
        if (!isSeeking) setCurrentTime((status?.currentTime || 0) / 1000);
        setDuration((status?.duration || 0) / 1000);
        setCurrentRepeat(Number(status?.currentRepeat || 0));
        if (status?.repeatCount) setRepeatCount(Number(status.repeatCount));
      });
      endedListener = await NativeAudio.addListener('playbackEnded', async () => {
        setIsPlaying(false);
        await syncNativeStatus();
      });
      await syncNativeStatus();
    };
    setupNativeListeners();
    return () => {
      stateListener?.remove();
      endedListener?.remove();
    };
  }, [isSeeking, syncNativeStatus]);

  useEffect(() => {
    if (!isNativeAndroid) return;
    NativeAudio.setRepeatCount({ repeatCount }).catch(() => {});
  }, [repeatCount]);

  const ringBell = () => {
    triggerHaptic(ImpactStyle.Heavy);
    setIsBellRinging(true);
    if (isNativeAndroid) {
      NativeAudio.bell().catch(() => {});
    } else {
      if (!bellAudioRef.current) bellAudioRef.current = new Audio("/assets/audio/bell.mp3");
      bellAudioRef.current.currentTime = 0;
      bellAudioRef.current.play().catch(() => {});
    }
    setTimeout(() => setIsBellRinging(false), 500);
  };

  const playShankh = () => {
    triggerHaptic(ImpactStyle.Heavy);
    if (isNativeAndroid) {
      NativeAudio.shankh().catch(() => {});
    } else {
      if (!shankhAudioRef.current) shankhAudioRef.current = new Audio("/assets/audio/shankh.mp3");
      shankhAudioRef.current.currentTime = 0;
      shankhAudioRef.current.play().catch(() => {});
    }
  };

  const startReading = useCallback((mode) => {
    triggerHaptic(ImpactStyle.Light);
    if (mode === 'history') {
      setHistoryView('menu');
      setActiveIncidentIndex(null);
    }
    const audioModes = ['chalisa', 'mantras', 'bhajans', 'aartis', 'stutis'];
    const isNewModeAudio = audioModes.includes(mode);
    if (currentMode === mode || !isNewModeAudio) {
      setCurrentMode(mode);
      setIsLyricsVisible(true);
      setIsLibraryOpen(false);
      return;
    }
    setCurrentMode(mode);
    setIsLyricsVisible(true);
    setIsLibraryOpen(false);
    setActiveItemIndex(0);
    setIsPlaying(false);
    if (isNativeAndroid) {
      NativeAudio.stop().catch(() => {});
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [currentMode]);

  const renderContent = () => {
    if (currentMode === 'policy') return (
      <div className="policy-view glass-panel">
        <button className="back-btn" onClick={() => setIsLyricsVisible(false)}>← BACK</button>
        <div className="policy-content" dangerouslySetInnerHTML={{ __html: policyData[language] || policyData.english }}></div>
      </div>
    );

    if (currentMode === 'videos') return (
      <div className="videos-view">
        <button className="back-btn" onClick={() => setIsLyricsVisible(false)}>← BACK</button>
        <div className="video-grid">
          {videos.map((vid, idx) => (
            <div key={idx} className="video-card glass-panel" onClick={() => window.open(vid.url, '_blank')}>
              <img src={vid.thumbnail} alt={vid.title} />
              <div className="video-title">{vid.title}</div>
            </div>
          ))}
        </div>
      </div>
    );

    if (currentMode === 'history') {
      if (historyView === 'menu') return (
        <div className="history-menu">
           <button className="back-btn" onClick={() => setIsLyricsVisible(false)}>← BACK</button>
           <button className="history-btn glass-panel" onClick={() => setHistoryView('lifeStory')}>બ્રહ્માંડ ની શક્તિ - માં આશાપુરા</button>
           <button className="history-btn glass-panel" onClick={() => setHistoryView('incidents')}>સત્ય ઘટનાઓ</button>
        </div>
      );
      if (historyView === 'lifeStory') return (
        <div className="history-detail glass-panel">
          <button className="back-btn" onClick={() => setHistoryView('menu')}>← BACK</button>
          <h3>{historyData.lifeStory.title[language]}</h3>
          <div className="history-text">{historyData.lifeStory.content[language]}</div>
        </div>
      );
      if (historyView === 'incidents') {
        if (activeIncidentIndex !== null) return (
          <div className="history-detail glass-panel">
            <button className="back-btn" onClick={() => setActiveIncidentIndex(null)}>← BACK</button>
            <h3>{historyData.incidents[activeIncidentIndex].title[language]}</h3>
            <div className="history-text">{historyData.incidents[activeIncidentIndex].content[language]}</div>
          </div>
        );
        return (
          <div className="incident-list">
            <button className="back-btn" onClick={() => setHistoryView('menu')}>← BACK</button>
            {historyData.incidents.map((inc, i) => (
              <button key={i} className="history-btn glass-panel" onClick={() => setActiveIncidentIndex(i)}>{inc.title[language]}</button>
            ))}
          </div>
        );
      }
    }

    const currentLines = currentMode === 'chalisa' ? chalisaData[language] :
                        currentMode === 'mantras' ? mantras[activeItemIndex]?.content[language] :
                        currentMode === 'bhajans' ? bhajans[activeItemIndex]?.content[language] :
                        currentMode === 'aartis' ? aartis[activeItemIndex]?.content[language] :
                        currentMode === 'stutis' ? stutis[activeItemIndex]?.content[language] : [];

    return (
      <div className="lyrics-scroller">
        {(currentMode === 'bhajans' || currentMode === 'mantras' || currentMode === 'aartis' || currentMode === 'stutis') && (
           <div className="track-selector">
              <select value={activeItemIndex} onChange={(e) => setActiveItemIndex(Number(e.target.value))}>
                {(currentMode === 'mantras' ? mantras : currentMode === 'bhajans' ? bhajans : currentMode === 'aartis' ? aartis : stutis).map((item, i) => (
                  <option key={i} value={i}>{item.name}</option>
                ))}
              </select>
           </div>
        )}
        {currentLines?.map((line, idx) => (
          <div key={idx} className={`verse ${activeVerse === idx ? 'active-verse' : ''}`} onClick={() => {
            setActiveVerse(idx);
            if (!isNativeAndroid && audioRef.current) {
               audioRef.current.currentTime = (audioRef.current.duration / currentLines.length) * idx;
            }
          }}>
            <div className="hindi-text">{line}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`app-container ${showSplash ? 'splash-active' : ''}`}>
      {showSplash && (
        <div className="splash-screen">
          <img src="/assets/images/bgimage.jpeg" alt="Maa" />
          <div className="splash-title">શ્રી આશાપુરા મા</div>
        </div>
      )}

      {flowers.map(f => (
        <div key={f.id} className="flower" style={{
          left: f.left, animationDelay: f.delay, animationDuration: f.duration, 
          '--sway': f.sideSway, '--rot-axis': f.rotateAxis
        }}>{f.type}</div>
      ))}

      <div className="background-slider">
        <img src={backgroundImage} alt="MAA" className="bg-image active" />
        <div className="bg-overlay"></div>
      </div>

      <header className="top-bar">
        <div className="top-bar-side-content">
          <div className="header-greeting">
            <div className="greeting-text">{getGreeting()}</div>
          </div>

          <div className="language-selector">
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="gujarati">ગુજરાતી</option>
              <option value="hindi">हिन्दी</option>
              <option value="english">English</option>
            </select>
          </div>
        </div>
        {!isLyricsVisible && dailyQuote[language] && (
          <div className="daily-quote-card glass-panel" onClick={() => setIsLibraryOpen(true)}>
             <div className="quote-header">
               <span className="quote-icon">❝</span>
               <span className="quote-label">Thought of the Day</span>
             </div>
             <div className="main-quote">{dailyQuote[language]}</div>
          </div>
        )}
        <div className="divine-name" onClick={() => setIsLyricsVisible(false)}>શ્રી આશાપુરા મા</div>
      </header>

      <main className={`main-content ${isLyricsVisible ? 'active' : ''}`}>
        {renderContent()}
      </main>

      <div className="bottom-dashboard-container">
        <div className="pooja-dock">
          <div className="ritual-island glass-panel">
             <button onClick={ringBell}>🔔<span>BELL</span></button>
             <button onClick={playShankh}>🐚<span>SHANKH</span></button>
             <button onClick={startFlowerShower}>🌸<span>FLOWERS</span></button>
             <button onClick={toggleDiya} className={isDiyaLit ? 'active' : ''}>🪔<span>LAMP</span></button>
          </div>

          <div className="control-island glass-panel">
            <div className="dock-seek-row">
              <span className="dock-time">{formatTime(currentTime)}</span>
              <div className="seek-container">
                <div className="seek-fill" style={{ width: (currentTime / (duration || 1) * 100) + '%' }}></div>
                <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} onMouseUp={handleSeekEnd} onTouchEnd={handleSeekEnd} />
              </div>
              <span className="dock-time">{formatTime(duration)}</span>
            </div>

            <div className="dock-controls-row">
              <button className="dock-lib-btn" onClick={() => setIsLibraryOpen(true)}>☰</button>
              
              <div className="repeat-control" onClick={() => {
                 const next = repeatCount === 1 ? 3 : repeatCount === 3 ? 11 : repeatCount === 11 ? 21 : repeatCount === 21 ? 108 : 1;
                 setRepeatCount(next);
                 triggerHaptic();
              }}>
                <span className="repeat-icon">🔁</span>
                <span className="repeat-val">{repeatCount}</span>
              </div>

              <button className="dock-play-btn" onClick={() => {
                triggerHaptic();
                if (isNativeAndroid) {
                  isPlaying ? NativeAudio.pause() : NativeAudio.play();
                } else {
                  const audio = audioRef.current;
                  if (audio) isPlaying ? audio.pause() : audio.play();
                }
              }}>{isPlaying ? '⏸' : '▶'}</button>

              <button className="dock-share-btn" onClick={shareApp}>🔗</button>
            </div>
          </div>
        </div>
      </div>

      <DevotionalLibrary 
        isLibraryOpen={isLibraryOpen} 
        setIsLibraryOpen={setIsLibraryOpen}
        language={language}
        startReading={startReading}
        morningToggle={setMorningNotification}
        eveningToggle={setEveningNotification}
        isMorningOn={morningNotification}
        isEveningOn={eveningNotification}
        morningTime={morningTime}
        setMorningTime={setMorningTime}
        eveningTime={eveningTime}
        setEveningTime={setEveningTime}
      />

      <div className={`focus-overlay ${isDiyaLit ? 'active' : ''}`}></div>
    </div>
  );
}

export default App;
