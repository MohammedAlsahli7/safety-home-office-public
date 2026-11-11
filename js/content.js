/* All wording and the hidden scoring table. Pure data: safe to import in Node tests.
   Each option's `pts` adds hidden strain points to the five areas. Nobody sees these numbers;
   they only shape the personal report and the team averages. */

export const AREAS = ["posture", "energy", "eyes", "balance", "mind"];
export const AREA_LABEL = { posture: "Posture", energy: "Energy", eyes: "Eyes", balance: "Balance", mind: "Mind" };

export const LIGHT_LEVELS = [
  { max: 17, name: "Cave mode" },
  { max: 34, name: "Movie night" },
  { max: 50, name: "Cozy" },
  { max: 67, name: "Warm lamp" },
  { max: 84, name: "Bright" },
  { max: 101, name: "Full daylight" }
];
export const lightName = L => LIGHT_LEVELS.find(l => L < l.max).name;
export const lightBucket = L => (L < 34 ? "night" : L < 67 ? "dusk" : "day");

/* 60 call-and-home-office nicknames (15 characters at most). Phones skip names already taken. */
export const NICKNAMES = [
  "Frozen Frame", "Echo Mic", "Buffering", "Reply All", "Low Battery", "Weak Wi-Fi", "Away 5 min",
  "Lag", "Hold Music", "Dial Tone", "Screen Share", "Static", "Mute Button", "Raised Hand",
  "Spinning Wheel", "Reconnecting", "Typing…", "Unread", "Ping", "Dropped Call",
  "Out of Office", "Do Not Disturb", "Auto Reply", "Sticky Note", "Coffee Ring", "Desk Plant",
  "Night Mode", "Dark Mode", "Pop-up", "Loading…", "404", "Ctrl+Z", "Copy Paste", "Caps Lock",
  "Tab Hoarder", "Inbox Zero", "Snooze Button", "Paper Jam", "Blue Screen", "Update Pending",
  "Restart Later", "Low Signal", "Hotspot", "Bluetooth", "Headset Hair", "Extension Cord",
  "Long Cable", "Sofa Desk", "Kitchen Office", "Two Books", "Lamp On", "Karak Break",
  "Qahwa Refill", "Water Glass", "Doorbell", "Group Chat", "Can You Hear Me", "Airplane Mode",
  "Spam Folder", "Voice Note"
];

export const POSES = ["Upright", "Leaning in", "The Shrimp", "Sofa Sink"];
export const poseIndex = t => Math.max(0, Math.min(3, Math.round(t * 3)));

export const VERDICT_NOTES = [
  "Send me back to the office", "Really tough", "Struggling most days", "Missing people a lot", "Meh",
  "Good days and bad days", "Fine, but I miss the people", "Good, mostly", "Comfortable. Maybe too comfortable",
  "My cat and I are thriving", "Never sending me back"
];

/* The 11 cards, in order. `kind` picks the renderer on the phone. */
export const CARDS = [
  {
    key: "posture", kind: "dial",
    title: "Which one is you right now?",
    sub: "Turn the dial until the skeleton looks like you."
  },
  {
    key: "laptop", kind: "options", layout: "tiles",
    title: "Where does your laptop live?",
    sub: "Most of the workday, not the ideal day.",
    options: [
      { v: "stand", label: "Raised up", note: "a stand, or a pile of books", pts: {} },
      { v: "desk", label: "Flat on a table", note: "desk, dining table, wherever", pts: { posture: 2 } },
      { v: "lap", label: "On my lap", note: "the sofa office", pts: { posture: 3 } },
      { v: "bed", label: "In bed with me", note: "maximum comfort", pts: { posture: 3, balance: 1 } }
    ]
  },
  {
    key: "morning", kind: "options", layout: "routes",
    title: "Between the alarm and 7:00",
    sub: "Which route is closest to your mornings?",
    options: [
      { v: "pillow", label: "Emails from the pillow", note: "work arrives before you do", pts: { balance: 3, mind: 1 } },
      { v: "coffee", label: "Coffee, then laptop", note: "the essentials", pts: { balance: 1, energy: 1 } },
      { v: "straight", label: "Straight to the laptop", note: "zero commute, zero wait", pts: { balance: 2 } },
      { v: "routine", label: "The full routine", note: "the long way in", pts: {} }
    ]
  },
  {
    key: "fuel", kind: "fuel",
    title: "Coffee vs. water, yesterday",
    sub: "Count every cup of coffee, qahwa or karak. Water counts by the glass."
  },
  {
    key: "stand", kind: "options", layout: "stand",
    title: "When did you last stand up?",
    sub: "Before you opened this, that is.",
    options: [
      { v: "30m", label: "In the last 30 minutes", note: "recently stretched", fill: 0.15, elapsed: "under 30 min", pts: {} },
      { v: "1h", label: "About an hour ago", note: "somewhere in between", fill: 0.5, elapsed: "about 1 hr", pts: { energy: 1, posture: 1 } },
      { v: "2h", label: "Two hours or more", note: "deep focus mode", fill: 1, elapsed: "2 hrs or more", pts: { energy: 2, posture: 2 } },
      { v: "fridge", label: "Does walking to the fridge count?", note: "asking for a friend", fill: 0.3, elapsed: "fridge run", pts: { energy: 1 } }
    ]
  },
  {
    key: "coworker", kind: "options", layout: "tiles",
    title: "Your most frequent coworker",
    sub: "Who interrupts your workday the most?",
    options: [
      { v: "cat", label: "The cat", note: "sat on the keyboard", pts: { energy: -1 } },
      { v: "kids", label: "The kids", note: "paper planes incoming", pts: { energy: -1 } },
      { v: "door", label: "The doorbell", note: "deliveries, visitors", pts: { energy: -1 } },
      { v: "chat", label: "The family group chat", note: "always unread", pts: { mind: 2 } }
    ]
  },
  {
    key: "lunch", kind: "options", layout: "tiles",
    title: "Lunch yesterday happened…",
    sub: "Pick the closest one.",
    options: [
      { v: "table", label: "At the table", note: "plates and all", pts: {} },
      { v: "keyboard", label: "At the keyboard", note: "crumb collection", pts: { balance: 2, eyes: 1 } },
      { v: "meeting", label: "In a meeting, on mute", note: "multitasking", pts: { balance: 2 } },
      { v: "none", label: "Lunch? What lunch?", note: "the day just went", pts: { energy: 3, balance: 1 } }
    ]
  },
  {
    key: "stare", kind: "stare",
    title: "Staring contest",
    sub: "Stare at the dot. Tap the moment you blink."
  },
  {
    key: "news", kind: "options", layout: "news",
    title: "News alerts, these days",
    sub: "These days, how does your phone handle them?",
    options: [
      { v: "off", label: "Muted. I check when I choose", note: "the quiet phone", alerts: 0, pts: {} },
      { v: "few", label: "Just a few", note: "the important ones", alerts: 2, pts: { mind: 1 } },
      { v: "all", label: "All of them", note: "every single one", alerts: 5, pts: { mind: 3 } },
      { v: "refresh", label: "I refresh before they arrive", note: "faster than the news", alerts: 4, pts: { mind: 3, eyes: 1 } }
    ]
  },
  {
    key: "logoff", kind: "options", layout: "tiles",
    title: "5:00 pm. Your laptop is…",
    sub: "On a typical day this month.",
    options: [
      { v: "packed", label: "Packed away", note: "out of sight", pts: {} },
      { v: "closed", label: "Closed, still in sight", note: "on the table or the sofa", pts: { balance: 1 } },
      { v: "open", label: "Open, just in case", note: "on standby", pts: { balance: 2, mind: 1 } },
      { v: "meeting", label: "Still in a meeting", note: "running long", pts: { balance: 3 } }
    ]
  },
  {
    key: "verdict", kind: "verdict",
    title: "Working from home so far?",
    sub: "0 means “send me back to the office.” 10 means “never sending me back.”"
  }
];

export const cardByKey = Object.fromEntries(CARDS.map(c => [c.key, c]));

/* Strain report wording */
export const FINDINGS = {
  posture: "Laptop hunch",
  energy: "Running on coffee",
  eyes: "Screen stare",
  balance: "Workday leak",
  mind: "Alert overload"
};
export const ALL_CLEAR = "All clear";
export const PRESCRIPTIONS = {
  posture: "Raise your screen to eye level. Two books under the laptop will do.",
  energy: "One glass of water with every coffee, and stand up when a call ends.",
  eyesDark: "Turn on a lamp so the screen isn’t the brightest thing in the room.",
  eyes: "20-20-20: every 20 minutes, look about 6 m away for 20 seconds.",
  balance: "Close the laptop at 4 and put it somewhere you can’t see it.",
  mind: "Mute news alerts. Check the news at a few times you choose."
};

/* During the talk: one tap each, anonymous */
export const CONFESSIONS = {
  c1: "I’ve refreshed the news more times today than I’ve stood up.",
  c2: "My laptop has slept in my bed.",
  c3: "I’ve worked a whole day from bed."
};
export const HABITS = ["Raise your screen to eye level", "Mute the news alerts", "Stand up when a call ends"];

/* Report wording: one word per area for each strain level (1 low … 5 high) */
export const AREA_WORDS = {
  posture: ["Upright", "Upright", "Slouching", "Strained", "Strained"],
  energy: ["Steady", "Steady", "Dipping", "Running on coffee", "Running on empty"],
  eyes: ["Rested", "Rested", "Overfocused", "Overfocused", "Overfocused"],
  balance: ["Balanced", "Balanced", "Tilting to work", "Tilting to work", "Work everywhere"],
  mind: ["Calm", "Mostly okay", "Busy", "Overloaded", "Overloaded"]
};
export const SEVERITY = ["mild", "mild", "mild", "moderate", "high", "high"];
