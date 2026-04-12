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

const uiTranslations = {
  gujarati: {
    libraryTitle: "ભક્તિ લાયબ્રેરી",
    chalisa: "મા ની ચાલીસા",
    mantras: "સિદ્ધ મંત્ર",
    bhajans: "ભજન સંગ્રહ",
    aarti: "મા ની આરતી",
    stuti: "મા ની સ્તુતિ",
    history: "મા નો ઇતિહાસ",
    videos: "માતાજી ના દર્શન",
    policy: "ગોપનીયતા નીતિ",
    reminders: "દૈનિક સૂચનાઓ",
    morningQuote: "આજનો વિચાર (6:30 AM)",
    eveningAarti: "સાંજ ની આરતી (6:30 PM)",
    closeReading: "વાંચન બંધ કરો",
    goBack: "પાછા જાઓ",
    chooseSection: "વાંચવા માટે વિભાગ પસંદ કરો",
    lifeStory: "જીવન ચરિત્ર અને ચમત્કારો",
    incidentIndex: "સત્ય ઘટનાઓ",
    sacredJourney: "શ્રી આશાપુરા મા ની પવિત્ર યાત્રા",
    selectMiracle: "વાંચવા માટે ચમત્કાર પસંદ કરો",
    miracleHistory: "ચમત્કારનો ઇતિહાસ",
    youtubeLibrary: "યૂટ્યૂબ ભક્તિ લાયબ્રેરી",
    jaap: "જાપ",
    of: "માંથી",
    selected: "(પસંદ કરેલ)",
    appOpening: "માતાજી ની પૂજા"
  },
  hindi: {
    libraryTitle: "भक्ति लाइब्रेरी",
    chalisa: "माँ की चालीसा",
    mantras: "सिद्ध मंत्र",
    bhajans: "भजन संग्रह",
    aarti: "माँ की आरती",
    stuti: "माँ की स्तुति",
    history: "माँ का इतिहास",
    videos: "माताजी के दर्शन",
    policy: "गोपनीयता नीति",
    reminders: "दैनिक सूचनाएं",
    morningQuote: "सुबह का विचार (6:30 AM)",
    eveningAarti: "शाम की आरती (6:30 PM)",
    closeReading: "पठन बंद करें",
    goBack: "वापस जाएं",
    chooseSection: "पढ़ने के लिए एक अनुभाग चुनें",
    lifeStory: "जीवन चरित्र और चमत्कार",
    incidentIndex: "सत्य घटनाएं",
    sacredJourney: "श्री आशापुरा माँ की पवित्र यात्रा",
    selectMiracle: "पढ़ने के लिए एक चमत्कार चुनें",
    miracleHistory: "चमत्कार का इतिहास",
    youtubeLibrary: "यूट्यूब भक्ति लाइब्रेरी",
    jaap: "जाप",
    of: "में से",
    selected: "(चयनित)",
    appOpening: "माँ की पूजा"
  },
  english: {
    libraryTitle: "Devotional Library",
    chalisa: "Chalisa",
    mantras: "Mantras",
    bhajans: "Bhajans",
    aarti: "Aarti",
    stuti: "Stuti",
    history: "History",
    videos: "Videos",
    policy: "Privacy Policy",
    reminders: "Daily Reminders",
    morningQuote: "Morning Quote (6:30 AM)",
    eveningAarti: "Evening Aarti (6:30 PM)",
    closeReading: "Close Reading",
    goBack: "Go Back",
    chooseSection: "Choose a Section to Read",
    lifeStory: "Life Story & Miracles",
    incidentIndex: "True Incidents Index",
    sacredJourney: "Sacred Journey of Aashapura Maa",
    selectMiracle: "Select a Miracle to Read",
    miracleHistory: "Miracle History",
    youtubeLibrary: "YouTube Devotional Library",
    jaap: "Jaap",
    of: "of",
    selected: "(Selected)",
    appOpening: "Maa's Pooja"
  }
};

// Memoized Library Tray
const DevotionalLibrary = React.memo(({ isLibraryOpen, setIsLibraryOpen, language, startReading, morningToggle, eveningToggle, isMorningOn, isEveningOn, morningTime, setMorningTime, eveningTime, setEveningTime }) => {
  const t = uiTranslations[language] || uiTranslations.english;

  return (
    <>
      {isLibraryOpen && <div className="tray-backdrop" onClick={() => setIsLibraryOpen(false)}></div>}
      <div
        className={`library-tray glass-panel ${isLibraryOpen ? 'active' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tray-handle" onClick={() => setIsLibraryOpen(false)}></div>
        <div className="tray-title">{t.libraryTitle}</div>

        <div className="library-grid">
          <button className="library-card" onClick={(e) => { e.stopPropagation(); startReading('chalisa'); }}>
            <span className="lib-icon">📜</span>
            <span className="lib-hindi">{t.chalisa}</span>
          </button>
          <button className="library-card" onClick={(e) => { e.stopPropagation(); startReading('mantras'); }}>
            <span className="lib-icon">💎</span>
            <span className="lib-hindi">{t.mantras}</span>
          </button>
          <button className="library-card" onClick={(e) => { e.stopPropagation(); startReading('bhajans'); }}>
            <span className="lib-icon">🪕</span>
            <span className="lib-hindi">{t.bhajans}</span>
          </button>
          <button className="library-card" onClick={(e) => { e.stopPropagation(); startReading('aartis'); }}>
            <span className="lib-icon">🕯️</span>
            <span className="lib-hindi">{t.aarti}</span>
          </button>
          <button className="library-card" onClick={(e) => { e.stopPropagation(); startReading('stutis'); }}>
            <span className="lib-icon">🙌</span>
            <span className="lib-hindi">{t.stuti}</span>
          </button>
          <button className="library-card" onClick={(e) => { e.stopPropagation(); startReading('history'); }}>
            <span className="lib-icon">🏺</span>
            <span className="lib-hindi">{t.history}</span>
          </button>
          <button className="library-card library-card-wide" onClick={(e) => { e.stopPropagation(); startReading('videos'); }}>
            <div className="wide-card-content">
              <span className="lib-icon">🎥</span>
              <div className="wide-text">
                <span className="lib-hindi" style={{ fontSize: '1.3rem' }}>{t.videos}</span>
              </div>
            </div>
          </button>
        </div>

        <div className="settings-section" style={{ marginTop: '20px', padding: '0 15px' }}>
          <div style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {t.reminders}
          </div>

          <div className="setting-row glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '12px 15px', marginBottom: '10px', borderRadius: '15px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ color: '#fff', fontSize: '0.9rem' }}>
                <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>🌅</span>
                {t.morningQuote.split(' (')[0]}
              </div>
              <div className={`switch ${isMorningOn ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); morningToggle(!isMorningOn); }}>
                <div className="switch-knob"></div>
              </div>
            </div>
            {isMorningOn && (
              <div className="time-picker-row" style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--secondary)' }}>Select Time:</span>
                <input type="time" value={morningTime} onChange={(e) => setMorningTime(e.target.value)} className="settings-time-input" />
              </div>
            )}
          </div>

          <div className="setting-row glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '12px 15px', borderRadius: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ color: '#fff', fontSize: '0.9rem' }}>
                <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>🪔</span>
                {t.eveningAarti.split(' (')[0]}
              </div>
              <div className={`switch ${isEveningOn ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); eveningToggle(!isEveningOn); }}>
                <div className="switch-knob"></div>
              </div>
            </div>
            {isEveningOn && (
              <div className="time-picker-row" style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--secondary)' }}>Select Time:</span>
                <input type="time" value={eveningTime} onChange={(e) => setEveningTime(e.target.value)} className="settings-time-input" />
              </div>
            )}
          </div>
        </div>

        <div className="tray-privacy-footer" style={{ textAlign: 'center', padding: '15px 0 10px 0', opacity: 0.5 }}>
          <button onClick={(e) => { e.stopPropagation(); startReading('policy'); }} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.65rem', letterSpacing: '1px', cursor: 'pointer', fontWeight: '500' }}>
            {t.policy.toUpperCase()}
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

  const t = uiTranslations[language] || uiTranslations.english;
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
  const [historyView, setHistoryView] = useState('menu');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isDiyaLit, setIsDiyaLit] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [dailyQuote, setDailyQuote] = useState({ gujarati: '', hindi: '', english: '' });

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

  const repeatCountRef = useRef(repeatCount);
  useEffect(() => { repeatCountRef.current = repeatCount; }, [repeatCount]);

  const audioRef = useRef(null);
  const bellAudioRef = useRef(null);
  const shankhAudioRef = useRef(null);

  // Splash Screen Logic
  useEffect(() => {
    const splashTimer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(splashTimer);
  }, []);

  // Native Permission Helper
  const ensureNotificationPermission = useCallback(async () => {
    if (!isNativeAndroid) return true;
    try {
      const permission = await NativeAudio.hasNotificationPermission();
      if (permission?.granted) return true;
      const requested = await NativeAudio.requestNotificationPermission();
      return Boolean(requested?.granted);
    } catch (error) { return false; }
  }, []);

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
          } else { return; }
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
            body: language === 'gujarati' ? 'શ્રી આશાપુરા મા ની સાંજની આરતી કરવાનો સમય થઈ ગયો છે.' : language === 'english' ? 'It is time for Shree Aashapura Maa evening Aarti.' : 'श्री आशापुरा माँ की शाम की आरती का समय हो गया है।',
            id: 2,
            schedule: { on: { hour: h, minute: m }, allowWhileIdle: true }
          });
        }
        if (notificationsList.length > 0) {
          await LocalNotifications.schedule({ notifications: notificationsList });
        }
      } catch (e) {}
    };

    setupNotifications();
    localStorage.setItem('maa_morning_notif', morningNotification.toString());
    localStorage.setItem('maa_evening_notif', eveningNotification.toString());
    localStorage.setItem('maa_morning_time', morningTime);
    localStorage.setItem('maa_evening_time', eveningTime);
  }, [morningNotification, eveningNotification, morningTime, eveningTime, language]);

  // AdMob initialization
  useEffect(() => {
    const prepareAds = async () => {
      if (!isNativeAndroid) return;
      try {
        await AdMob.initialize();
        await AdMob.showBanner({
          adId: 'ca-app-pub-5914382038291713/1282219355',
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0
        });
      } catch (e) {}
    };
    prepareAds();
  }, []);

  const backgroundImage = '/assets/images/bgimage.jpeg';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (language === 'gujarati') {
      if (hour < 12) return "શુભ પ્રભાત";
      if (hour < 17) return "શુભ બપોર";
      return "શુભ સંધ્યા";
    } else if (language === 'english') {
      if (hour < 12) return "Good Morning";
      if (hour < 17) return "Good Afternoon";
      return "Good Evening";
    } else {
      if (hour < 12) return "शुभ प्रभात";
      if (hour < 17) return "शुभ दोपहर";
      return "शुभ संध्या";
    }
  };

  const triggerHaptic = (style = ImpactStyle.Medium) => { if ('vibrate' in navigator) navigator.vibrate(style); };

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
    } catch (e) {}
  }, [currentMode, language, repeatCount, activeItemIndex]);

  const formatTime = (time) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

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

  const startFlowerShower = () => {
    const flowerTypes = ['🌼', '🌹', '🪷', '💮', '🌻', '🌷', '🏵️', '🌸'];
    const newFlowers = Array.from({ length: 45 }).map((_, i) => ({
      id: Math.random().toString(36).substr(2, 9) + i,
      type: flowerTypes[Math.floor(Math.random() * flowerTypes.length)],
      left: Math.random() * 100 + '%',
      delay: Math.random() * 2 + 's',
      duration: 4 + Math.random() * 4 + 's',
      sideSway: (Math.random() * 100 - 50) + 'px',
      rotateAxis: Math.random() > 0.5 ? 'X' : 'Y'
    }));
    setFlowers(newFlowers);
    setTimeout(() => setFlowers([]), 8500);
  };

  const toggleDiya = () => { triggerHaptic(); setIsDiyaLit(!isDiyaLit); };

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
      if (!isSeeking) setCurrentTime((status?.currentTime || 0) / 1000);
      setDuration((status?.duration || 0) / 1000);
    } catch (error) {}
  }, [isSeeking]);

  const getAudioPath = () => {
    if (currentMode === 'chalisa') return "/assets/audio/chalisa1.mp3";
    if (currentMode === 'mantras') return mantras[activeItemIndex]?.audio || "/assets/audio/om.mp3";
    if (currentMode === 'bhajans') return bhajans[activeItemIndex]?.audio || "/assets/audio/om.mp3";
    if (currentMode === 'aartis') return aartis[activeItemIndex]?.audio || "/assets/audio/Aarti.mp3";
    if (currentMode === 'stutis') return stutis[activeItemIndex]?.audio || "/assets/audio/Ganesh Stuti.mp3";
    return "/assets/audio/om.mp3";
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
      if (audioRef.current) { audioRef.current.src = path; audioRef.current.load(); }
      else {
        const audio = new Audio(path);
        audio.ontimeupdate = () => { if (!isSeeking) setCurrentTime(audio.currentTime); };
        audio.onloadedmetadata = () => setDuration(audio.duration);
        audio.onplay = () => setIsPlaying(true);
        audio.onpause = () => setIsPlaying(false);
        audio.onended = () => {
          if (currentRepeat + 1 < repeatCount) {
            setCurrentRepeat(prev => prev + 1);
            audio.currentTime = 0;
            audio.play();
          } else { setIsPlaying(false); }
        };
        audioRef.current = audio;
      }
    }
  }, [activeItemIndex, currentMode]);

  useEffect(() => {
    if (!isNativeAndroid) return;
    let stateListener, endedListener;
    const setup = async () => {
      stateListener = await NativeAudio.addListener('playbackStateChange', (status) => {
        setIsPlaying(Boolean(status?.isPlaying));
        if (!isSeeking) setCurrentTime((status?.currentTime || 0) / 1000);
        setDuration((status?.duration || 0) / 1000);
        setCurrentRepeat(Number(status?.currentRepeat || 0));
      });
      endedListener = await NativeAudio.addListener('playbackEnded', () => { setIsPlaying(false); syncNativeStatus(); });
      syncNativeStatus();
    };
    setup();
    return () => { stateListener?.remove(); endedListener?.remove(); };
  }, [isSeeking, syncNativeStatus]);

  useEffect(() => { if (isNativeAndroid) NativeAudio.setRepeatCount({ repeatCount }).catch(() => {}); }, [repeatCount]);

  const ringBell = () => {
    triggerHaptic(ImpactStyle.Heavy); setIsBellRinging(true);
    if (isNativeAndroid) NativeAudio.bell().catch(() => {});
    else { if (!bellAudioRef.current) bellAudioRef.current = new Audio("/assets/audio/bell.mp3"); bellAudioRef.current.currentTime = 0; bellAudioRef.current.play(); }
    setTimeout(() => setIsBellRinging(false), 500);
  };

  const playShankh = () => {
    triggerHaptic(ImpactStyle.Heavy);
    if (isNativeAndroid) NativeAudio.shankh().catch(() => {});
    else { if (!shankhAudioRef.current) shankhAudioRef.current = new Audio("/assets/audio/shankh.mp3"); shankhAudioRef.current.currentTime = 0; shankhAudioRef.current.play(); }
  };

  const startReading = useCallback((mode) => {
    setCurrentMode(mode); setIsLyricsVisible(true); setIsLibraryOpen(false);
    setActiveItemIndex(0); setActiveVerse(0); setCurrentRepeat(0);
    if (isNativeAndroid) NativeAudio.stop().catch(() => {});
    else if (audioRef.current) audioRef.current.pause();
  }, []);

  const renderContent = () => {
    if (currentMode === 'policy') return (
      <div className="policy-section-container glass-panel">
        <div className="top-actions-row"><button className="back-btn glass-panel" onClick={() => setIsLyricsVisible(false)}>← {t.closeReading}</button></div>
        <div className="page-header"><div className="page-title">{policyData.title[language] || policyData.title.english}</div></div>
        {policyData.sections.map((section, idx) => (
          <div key={idx} className="verse glass-panel"><div style={{ color: 'var(--secondary)', fontSize: '1.2rem' }}>{section.subtitle[language] || section.subtitle.english}</div><div className="hindi-text" style={{ fontSize: '1.1rem', textAlign: 'left' }}>{section.text[language] || section.text.english}</div></div>
        ))}
      </div>
    );

    if (currentMode === 'videos') return (
      <div className="videos-section-container">
        <div className="top-actions-row"><button className="back-btn glass-panel" onClick={() => setIsLyricsVisible(false)}>← {t.closeReading}</button></div>
        <div className="videos-grid-flow">
          {videos.map((vid) => (
            <div key={vid.id} className="video-premium-card glass-panel"><div className="video-container-wrapper"><iframe width="100%" height="200" src={`https://www.youtube.com/embed/${vid.youtubeId}?modestbranding=1&rel=0`} title={vid.title} frameBorder="0" allowFullScreen></iframe></div><div className="video-card-details"><div className="video-card-title">{vid[language] || vid.gujarati || vid.hindi}</div></div></div>
          ))}
        </div>
      </div>
    );

    if (currentMode === 'history') {
      if (historyView === 'menu') return (
        <div className="history-menu-grid">
          <div className="top-actions-row"><button className="back-btn glass-panel" onClick={() => setIsLyricsVisible(false)}>← {t.closeReading}</button></div>
          <button className="history-menu-card glass-panel" onClick={() => setHistoryView('lifeStory')}><div className="menu-card-title">{t.lifeStory}</div></button>
          <button className="history-menu-card glass-panel" onClick={() => setHistoryView('incidents')}><div className="menu-card-title">{t.incidentIndex}</div></button>
        </div>
      );
      if (historyView === 'lifeStory') return (
        <div className="history-section-container">
          <div className="top-actions-row"><button className="back-btn glass-panel" onClick={() => setHistoryView('menu')}>← {t.goBack}</button></div>
          {historyData.lifeStory.content.map((item, idx) => (<div key={idx} className="verse glass-panel"><div className="hindi-text" style={{ fontSize: '1.1rem', textAlign: 'left' }}>{item.text[language] || item.text.gujarati}</div></div>))}
        </div>
      );
      if (historyView === 'incidents') {
        if (activeIncidentIndex !== null) return (
          <div className="history-section-container">
            <div className="top-actions-row"><button className="back-btn glass-panel" onClick={() => setActiveIncidentIndex(null)}>← {t.goBack}</button></div>
            <div className="incident-content-full glass-panel">{historyData.incidents[activeIncidentIndex].content[language] || historyData.incidents[activeIncidentIndex].content.gujarati}</div>
          </div>
        );
        return (
          <div className="incidents-grid">
            <div className="top-actions-row"><button className="back-btn glass-panel" onClick={() => setHistoryView('menu')}>← {t.goBack}</button></div>
            {historyData.incidents.map((inc, i) => (<button key={i} className="incident-select-card glass-panel" onClick={() => setActiveIncidentIndex(i)}>{inc.title[language]}</button>))}
          </div>
        );
      }
    }

    const currentLines = currentMode === 'chalisa' ? (chalisaData.lyrics?.map(v => v[language] || v.gujarati || v.hindi) || []) :
                        currentMode === 'mantras' ? (mantras[activeItemIndex]?.content?.[language] || [mantras[activeItemIndex]?.name || '']) :
                        currentMode === 'bhajans' ? (bhajans[activeItemIndex]?.content?.[language] || [bhajans[activeItemIndex]?.name || '']) :
                        currentMode === 'aartis' ? (aartis[activeItemIndex]?.content?.[language] || [aartis[activeItemIndex]?.name || '']) :
                        currentMode === 'stutis' ? (stutis[activeItemIndex]?.content?.[language] || [stutis[activeItemIndex]?.name || '']) : [];

    return (
      <main className="lyrics-container">
        <div className="top-actions-row"><button className="back-btn glass-panel" onClick={() => setIsLyricsVisible(false)}>← {t.closeReading}</button></div>
        {(currentMode === 'bhajans' || currentMode === 'mantras' || currentMode === 'aartis' || currentMode === 'stutis') && (
          <div className="track-selector"><select value={activeItemIndex} onChange={(e) => setActiveItemIndex(Number(e.target.value))}>{(currentMode === 'mantras' ? mantras : currentMode === 'bhajans' ? bhajans : currentMode === 'aartis' ? aartis : stutis).map((item, i) => (<option key={i} value={i}>{item.name}</option>))}</select></div>
        )}
        {currentLines.map((line, idx) => (<div key={idx} className={`verse glass-panel ${activeVerse === idx ? 'active-verse' : ''}`} onClick={() => { setActiveVerse(idx); if (!isNativeAndroid && audioRef.current) audioRef.current.currentTime = (audioRef.current.duration / currentLines.length) * idx; }}><div className="hindi-text">{line}</div></div>))}
      </main>
    );
  };

  return (
    <div className={`app-container ${showSplash ? 'splash-active' : ''}`}>
      {flowers.map(f => (<div key={f.id} className="flower" style={{ left: f.left, animationDelay: f.delay, animationDuration: f.duration }}>{f.type}</div>))}
      <div className="background-slider" onClick={() => setIsLyricsVisible(false)}><img src={backgroundImage} alt="MAA" className="bg-image active" /><div className="bg-overlay"></div></div>
      <header className="top-bar">
        <div className="divine-name" style={{ fontSize: '2.2rem' }}>શ્રી આશાપુરા મા</div>
        <div className="top-bar-side-content">
          <div className="header-greeting">{getGreeting()}</div>
          <div className="language-selector"><select value={language} onChange={(e) => setLanguage(e.target.value)}><option value="gujarati">ગુજરાતી</option><option value="hindi">हिन्दी</option><option value="english">English</option></select></div>
        </div>
      </header>

      <main className="main-content">
        {!isLyricsVisible ? (
          <div className="menu-grid">
             <div className="daily-quote-card glass-panel" onClick={() => setIsLibraryOpen(true)}>
                <div className="quote-header">❝ {language === 'english' ? 'Thought of the Day' : 'આજનો વિચાર'}</div>
                <div className="main-quote">{dailyQuote[language] || dailyQuote.gujarati}</div>
             </div>
             <button className="menu-card glass-panel" onClick={() => startReading('chalisa')}><span className="card-hindi">મા ની ચાલીસા</span><span className="card-eng">CHALISA</span></button>
             <button className="menu-card glass-panel" onClick={() => startReading('mantras')}><span className="card-hindi">સિદ્ધ મંત્ર</span><span className="card-eng">MANTRAS</span></button>
             <button className="menu-card glass-panel" onClick={() => startReading('bhajans')}><span className="card-hindi">ભજન સંગ્રહ</span><span className="card-eng">BHAJANS</span></button>
             <button className="menu-card glass-panel" onClick={() => startReading('aartis')}><span className="card-hindi">મા ની આરતી</span><span className="card-eng">AARTI</span></button>
             <button className="menu-card glass-panel" onClick={() => startReading('stutis')}><span className="card-hindi">મા ની સ્તુતિ</span><span className="card-eng">STUTI</span></button>
             <button className="menu-card glass-panel" onClick={() => startReading('history')}><span className="card-hindi">મા નો ઇતિહાસ</span><span className="card-eng">HISTORY</span></button>
             <button className="menu-card glass-panel" style={{ gridColumn: 'span 2' }} onClick={() => startReading('videos')}><span className="card-hindi">માતાજી ના દર્શન</span><span className="card-eng">VIDEOS</span></button>
          </div>
        ) : renderContent()}
      </main>

      <div className="bottom-dashboard-container">
        <div className="ritual-island glass-panel" style={{ pointerEvents: 'auto' }}>
           <button className={`pooja-btn ${isBellRinging ? 'active' : ''}`} onClick={ringBell}>🔔</button>
           <button className="pooja-btn" onClick={playShankh}>🐚</button>
           <button className="pooja-btn" onClick={startFlowerShower}>🌸</button>
           <button className={`pooja-btn ${isDiyaLit ? 'on' : ''}`} onClick={toggleDiya}>🪔</button>
        </div>

        <div className="control-island glass-panel" style={{ pointerEvents: 'auto' }}>
          <div className="dock-seek-row">
            <span className="dock-time" style={{ color: '#fff', fontSize: '0.7rem' }}>{formatTime(currentTime)}</span>
            <input type="range" className="seek-bar" min="0" max={duration || 0} step="0.1" value={currentTime} onInput={handleSeek} onTouchStart={() => setIsSeeking(true)} onMouseDown={() => setIsSeeking(true)} onMouseUp={handleSeekEnd} onTouchEnd={handleSeekEnd} />
            <span className="dock-time" style={{ color: '#fff', fontSize: '0.7rem' }}>{formatTime(duration)}</span>
          </div>

          <div className="dock-controls-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <button className="dock-lib-btn" onClick={() => setIsLibraryOpen(true)}>⋯</button>
            <button className="dock-play-btn" onClick={() => { if (isNativeAndroid) { isPlaying ? NativeAudio.pause() : NativeAudio.play(); } else if (audioRef.current) { isPlaying ? audioRef.current.pause() : audioRef.current.play(); } }}>{isPlaying ? '⏸' : '▶'}</button>
            <div className="dock-repeat-island"><span className="repeat-icon">🔁</span><select value={repeatCount} onChange={(e) => setRepeatCount(Number(e.target.value))} className="repeat-mini-select"><option value="1">1x</option><option value="3">3x</option><option value="11">11x</option><option value="21">21x</option><option value="108">108x</option></select></div>
          </div>
        </div>
      </div>

      <DevotionalLibrary isLibraryOpen={isLibraryOpen} setIsLibraryOpen={setIsLibraryOpen} language={language} startReading={startReading} morningToggle={setMorningNotification} eveningToggle={setEveningNotification} isMorningOn={morningNotification} isEveningOn={eveningNotification} morningTime={morningTime} setMorningTime={setMorningTime} eveningTime={eveningTime} setEveningTime={setEveningTime} />
      {showSplash && <div className="divine-splash-clean"><img src={backgroundImage} className="splash-full-img" alt="Maa" /></div>}
    </div>
  );
}

export default App;
