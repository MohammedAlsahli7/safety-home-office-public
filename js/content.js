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

export const NICKNAMES = [
  "Frozen Frame", "Echo Mic", "Buffering", "Reply All", "Low Battery", "Weak Wi-Fi", "Away 5 min",
  "Lag", "Hold Music", "Dial Tone", "Screen Share", "Static", "Mute Button", "Raised Hand",
  "Spinning Wheel", "Reconnecting", "Typing…", "Unread", "Ping", "Dropped Call"
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
    key: "laptop", kind: "options", art: "laptop",
    title: "Where does your laptop live?",
    sub: "Most days, not on your best day.",
    options: [
      { v: "stand", label: "On a stand", pts: {} },
      { v: "desk", label: "Flat on the desk", pts: { posture: 2 } },
      { v: "lap", label: "On my lap", pts: { posture: 3 } },
      { v: "bed", label: "In bed with me", pts: { posture: 3, balance: 1 } }
    ]
  },
  {
    key: "morning", kind: "options", art: "alarm",
    title: "Between the alarm and 7:00",
    sub: "What usually happens first?",
    options: [
      { v: "pillow", label: "Emails from the pillow", pts: { balance: 3, mind: 1 } },
      { v: "coffee", label: "Coffee, then laptop", pts: { balance: 1, energy: 1 } },
      { v: "straight", label: "Straight to the desk", pts: { balance: 2 } },
      { v: "routine", label: "The full routine", pts: {} }
    ]
  },
  {
    key: "fuel", kind: "fuel",
    title: "Coffee vs. water, yesterday",
    sub: "Coffee, qahwa and karak all count. Tap to add a cup."
  },
  {
    key: "stand", kind: "options", art: "stopwatch",
    title: "When did you last stand up?",
    sub: "Be honest. Nobody can see you.",
    options: [
      { v: "30m", label: "In the last 30 minutes", pts: {} },
      { v: "1h", label: "About an hour ago", pts: { energy: 1, posture: 1 } },
      { v: "2h", label: "Two hours or more", pts: { energy: 2, posture: 2 } },
      { v: "fridge", label: "Does walking to the fridge count?", pts: { energy: 1 } }
    ]
  },
  {
    key: "coworker", kind: "options", art: "cat",
    title: "Your most frequent coworker",
    sub: "Who interrupts you the most?",
    options: [
      { v: "cat", label: "The cat", pts: { energy: -1 } },
      { v: "kids", label: "The kids", pts: { energy: -1 } },
      { v: "door", label: "The doorbell", pts: { energy: -1 } },
      { v: "chat", label: "The family group chat", pts: { mind: 2 } }
    ]
  },
  {
    key: "lunch", kind: "options", art: "plate",
    title: "Lunch yesterday happened…",
    sub: "Pick the closest.",
    options: [
      { v: "table", label: "At the table", pts: {} },
      { v: "keyboard", label: "At the keyboard", pts: { balance: 2, eyes: 1 } },
      { v: "meeting", label: "In a meeting, on mute", pts: { balance: 2 } },
      { v: "none", label: "Lunch? What lunch?", pts: { energy: 3, balance: 1 } }
    ]
  },
  {
    key: "stare", kind: "stare",
    title: "Staring contest",
    sub: "Stare at the dot. Tap the moment you blink."
  },
  {
    key: "news", kind: "options", art: "alerts",
    title: "News alerts during work hours",
    sub: "How many reach you between 7 and 4?",
    options: [
      { v: "off", label: "Off during work", pts: {} },
      { v: "few", label: "Just a few", pts: { mind: 1 } },
      { v: "all", label: "All of them", pts: { mind: 3 } },
      { v: "refresh", label: "I refresh before they arrive", pts: { mind: 3, eyes: 1 } }
    ]
  },
  {
    key: "logoff", kind: "options", art: "clock",
    title: "4:30 pm. Your laptop is…",
    sub: "On a normal day.",
    options: [
      { v: "packed", label: "Packed away", pts: {} },
      { v: "closed", label: "Closed on the desk", pts: { balance: 1 } },
      { v: "open", label: "Open, just in case", pts: { balance: 2, mind: 1 } },
      { v: "meeting", label: "Still in a meeting", pts: { balance: 3 } }
    ]
  },
  {
    key: "verdict", kind: "verdict",
    title: "Working from home so far?",
    sub: "0 is “send me back”, 10 is “never sending me back”."
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
  posture: "Raise your screen to eye level. Two books will do.",
  energy: "One glass of water with every coffee, and stand up when a call ends.",
  eyesDark: "Turn on a lamp so the screen isn’t the brightest thing in the room.",
  eyes: "20-20-20: every 20 minutes, look about 6 m away for 20 seconds.",
  balance: "Close the laptop at 4 and put it out of sight.",
  mind: "Alerts off from 7 to 4. Check the news at set times."
};

/* During the talk: one tap each, anonymous */
export const CONFESSIONS = {
  c1: "I’ve refreshed the news more times today than I’ve stood up.",
  c2: "My laptop has slept in my bed.",
  c3: "I’ve worked a whole day from bed, in pyjamas."
};
export const HABITS = ["Raise your screen to eye level", "Alerts off from 7 to 4", "Stand up when a call ends"];
