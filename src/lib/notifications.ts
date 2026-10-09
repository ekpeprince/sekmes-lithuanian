// Notification Center for Sėkmės Lithuanian PWA

export interface NotificationSettings {
  enabled: boolean;
  streakReminders: boolean;
  reminderTime: string; // e.g. '19:00', '20:00'
  wordOfDay: boolean;
  heartsRefill: boolean;
  duelInvites: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  streakReminders: true,
  reminderTime: '19:00',
  wordOfDay: true,
  heartsRefill: true,
  duelInvites: true,
};

const SETTINGS_KEY = 'sekmes_notification_settings_v1';
const LAST_STREAK_REMINDER_KEY = 'sekmes_last_streak_notif_date';
const LAST_WOD_KEY = 'sekmes_last_wod_date';
const LAST_HEART_ALERT_KEY = 'sekmes_last_heart_alert';

export const LITHUANIAN_WORDS_OF_THE_DAY = [
  {
    word: 'Sėkmės!',
    meaning: 'Good luck! / Success!',
    example: 'Linkiu sėkmės mokantis lietuvių kalbos!',
    note: 'The joyful name of this app, wishing you triumph!',
  },
  {
    word: 'Šaltibarščiai',
    meaning: 'Cold pink beet soup',
    example: 'Vasarą visi valgo šaltibarščius su karštomis bulvėmis.',
    note: 'Lithuania\'s beloved iconic summer dish served with boiled potatoes.',
  },
  {
    word: 'Gintaras',
    meaning: 'Amber (Baltic Gold)',
    example: 'Baltijos jūros pakrantėje galima rasti gintaro.',
    note: 'Fossilized tree resin from ancient Baltic pine forests.',
  },
  {
    word: 'Knygnešys',
    meaning: 'Book smuggler',
    example: 'Knygnešiai saugojo lietuvišką žodį ir spaudą.',
    note: '19th-century heroes who risked their lives to preserve the banned Lithuanian alphabet.',
  },
  {
    word: 'Ąžuolas',
    meaning: 'Oak tree',
    example: 'Ąžuolas yra stiprybės ir ilgaamžiškumo simbolis.',
    note: 'Begins with nasal vowel Ą; sacred symbol of endurance in Lithuanian folklore.',
  },
  {
    word: 'Cepelinai',
    meaning: 'Potato dumplings (Zeppelins)',
    example: 'Užsisakykime cepelinų su spirgučiais ir grietine!',
    note: 'Traditional national dish made of grated potatoes filled with meat or curd.',
  },
  {
    word: 'Bičiulis',
    meaning: 'Close friend (Bee comrade)',
    example: 'Mes esame seni bičiuliai.',
    note: 'Ancient Lithuanian word rooted in "bitė" (bee) — beekeepers shared a sacred bond.',
  },
  {
    word: 'Gira',
    meaning: 'Kvass (fermented rye bread drink)',
    example: 'Karštą vasaros dieną gira labai gaivina.',
    note: 'Naturally fermented refreshing beverage with a distinct malt flavor.',
  },
];

// Check if browser supports notifications
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Get current browser permission
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

// Request permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

// Load saved settings
export function getNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return DEFAULT_NOTIFICATION_SETTINGS;
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

// Save settings
export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

// Send notification via Service Worker registration or window fallback
export async function showSekmesNotification(
  title: string,
  options: {
    body: string;
    url?: string;
    tag?: string;
    icon?: string;
  }
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions = {
    body: options.body,
    icon: options.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: options.tag || 'sekmes-notification',
    data: { url: options.url || '/' },
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    }

    // Fallback to standard window Notification
    const notif = new Notification(title, notificationOptions);
    notif.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
    };
    return true;
  } catch (err) {
    console.warn('Notification delivery error:', err);
    return false;
  }
}

// Send Test Notification
export async function sendTestNotification(): Promise<boolean> {
  return showSekmesNotification('🇱🇹 LabasApp Notification Active', {
    body: 'Puikiai! Your Lithuanian daily streak reminders & practice alerts are now connected.',
    url: '/practice',
    tag: 'test-notification',
  });
}

// Send Streak Protector Reminder
export async function sendStreakReminderNotification(streakDays: number): Promise<boolean> {
  const title = streakDays > 0 
    ? `🔥 Apsaugok savo ${streakDays} dienų ugnį!` 
    : '🇱🇹 Laikas mokytis lietuvių kalbos!';

  const body = streakDays > 0
    ? `Your ${streakDays}-day streak is waiting! Spend 3 minutes to keep your Lithuanian flame burning today.`
    : 'Take 3 minutes to practice your Lithuanian lesson and start your streak!';

  return showSekmesNotification(title, {
    body,
    url: '/',
    tag: 'streak-reminder',
  });
}

// Send Word of the Day Notification
export async function sendWordOfDayNotification(): Promise<boolean> {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );
  const wordObj = LITHUANIAN_WORDS_OF_THE_DAY[dayOfYear % LITHUANIAN_WORDS_OF_THE_DAY.length];

  return showSekmesNotification(`🇱🇹 Dienos žodis: ${wordObj.word}`, {
    body: `“${wordObj.meaning}” — ${wordObj.example} Tap to practice pronunciation!`,
    url: '/practice',
    tag: 'word-of-day',
  });
}

// Send Hearts Refilled Notification
export async function sendHeartsRefilledNotification(): Promise<boolean> {
  return showSekmesNotification('❤️ Širdelės pilnos (5/5)!', {
    body: 'Your energy is fully restored. You are ready to dive back into Lithuanian lessons!',
    url: '/',
    tag: 'hearts-refilled',
  });
}

// Send Duel Challenge Notification (from friend or challenge alert)
export async function sendDuelInviteNotification(
  hostName: string,
  roomCode: string
): Promise<boolean> {
  return showSekmesNotification(`⚔️ Kvietimas į dvikovą: ${roomCode}`, {
    body: `${hostName} kviečia tave į lietuvių kalbos dvikovą! Spustelėk ir priimk iššūkį!`,
    url: `/battle?room=${roomCode}`,
    tag: `duel-invite-${roomCode}`,
  });
}

// Send Friend Joined Alert to Host
export async function sendFriendJoinedNotification(
  friendName: string,
  roomCode: string
): Promise<boolean> {
  return showSekmesNotification('⚔️ Draugas prisijungė prie dvikovos!', {
    body: `${friendName} ką tik prisijungė prie tavo kambario (${roomCode}). Pradėkite kovą!`,
    url: `/battle?room=${roomCode}`,
    tag: `friend-joined-${roomCode}`,
  });
}

// Check and trigger scheduled background reminders based on time & user state
export function checkDailyNotifications(params: {
  streak: number;
  completedToday: boolean;
  hearts: number;
}) {
  if (typeof window === 'undefined') return;

  const settings = getNotificationSettings();
  if (!settings.enabled || Notification.permission !== 'granted') return;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // 1. Streak Reminder
  if (settings.streakReminders && !params.completedToday) {
    const [targetHour, targetMinute] = settings.reminderTime.split(':').map(Number);
    const isDue = currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute);

    const lastStreakNotif = localStorage.getItem(LAST_STREAK_REMINDER_KEY);
    if (isDue && lastStreakNotif !== todayStr) {
      sendStreakReminderNotification(params.streak);
      localStorage.setItem(LAST_STREAK_REMINDER_KEY, todayStr);
    }
  }

  // 2. Word of the Day (morning between 8:00 - 12:00)
  if (settings.wordOfDay && currentHour >= 8) {
    const lastWod = localStorage.getItem(LAST_WOD_KEY);
    if (lastWod !== todayStr) {
      sendWordOfDayNotification();
      localStorage.setItem(LAST_WOD_KEY, todayStr);
    }
  }

  // 3. Hearts Refilled Alert
  if (settings.heartsRefill && params.hearts >= 5) {
    const lastHeartAlert = localStorage.getItem(LAST_HEART_ALERT_KEY);
    // Only alert if we recorded health being low earlier today
    if (lastHeartAlert === 'needs_refill') {
      sendHeartsRefilledNotification();
      localStorage.setItem(LAST_HEART_ALERT_KEY, todayStr);
    }
  } else if (params.hearts < 5) {
    localStorage.setItem(LAST_HEART_ALERT_KEY, 'needs_refill');
  }
}
