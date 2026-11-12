/* Speaker notes: the default script for every screen, the live-number tokens it can use, and the
   KPI lines, which are written from the presenter's own KPI figures at run time so that no real
   figure or name is ever in this public file.
   In a script, {token} shows a live team number, a line in (parentheses) is a stage direction,
   **text** is bold, and a blank line starts a new paragraph. */
import { CARDS, POSES, HABITS } from "./content.js";
import { SAFETY_LABELS } from "./kpis.js";
import { config } from "./config.js";

const CARD_TITLES = Object.fromEntries(CARDS.map((c, i) => ["q" + (i + 1), `Card ${i + 1} · ${c.title}`]));
export const TITLES = {
  intro: "Introduction", join: "Join (QR code)", ...CARD_TITLES, wrap: "Wrap-up: reports on phones",
  courses: "KPIs · Safety courses", phishing: "KPIs · Phishing", incidents: "KPIs · Safety, the big zero",
  title: "Uncertain times show up in the body", attention: "Attention", hours: "Hours", body: "Body",
  awards: "This morning’s awards", habits: "Three things for this week", close: "If the weeks feel heavy, say so",
  sources: "Sources (only if someone asks)"
};

/* Where each talk slide should be, in minutes into the talk */
export const TARGETS = {
  intro: "while people join, about 0:20",
  courses: "0:00 to 0:17", phishing: "0:17 to 0:32", incidents: "0:32 to 0:50", title: "0:50 to 1:25",
  attention: "1:25 to 2:25", hours: "2:25 to 3:05", body: "3:05 to 4:30", awards: "4:30 to 4:45",
  habits: "4:45 to 5:20", close: "5:20 to 5:50"
};

const NEXT = "(When most have answered, press Show answers, then Next card.)";
const WORD = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
export const DEFAULTS = {
  join: `Good morning, everyone. Grab your phone and point the camera at the code on the screen. When it opens, there’s a lamp: pull its cord until it matches the light in your room right now.

(Pull the lamp cord on your screen as you say it.)

Then pick a funny name and join. Nothing goes in under your real name, and there’s no camera. I only ever see team totals, and only once at least ${WORD[config.minGroup] || config.minGroup} of you have answered.

(Press I for your introduction. A small QR code stays in the corner, so people can keep joining.)

(When the joined count stops climbing, press Start the game.)`,
  q1: `Card 1. Turn the dial until the skeleton looks like you right now. Be honest: nobody sees who picked what.

${NEXT}`,
  q2: `Where does your laptop live most of the day? Raised up, flat on a table, on your lap, or in bed with you.

${NEXT}`,
  q3: `Between the alarm and 7:00. Which route is closest to your mornings?

${NEXT}`,
  q4: `Coffee versus water, yesterday. Count every cup of coffee, qahwa or karak, and every glass of water.

${NEXT}`,
  q5: `When did you last stand up, before you opened this? And yes, walking to the fridge is an option.

${NEXT}`,
  q6: `Your most frequent coworker. Who interrupts your workday the most?

${NEXT}`,
  q7: `Lunch yesterday happened… where? Pick the closest one.

${NEXT}`,
  q8: `Staring contest. Stare at the dot, and tap the moment you blink. Then look at something far away for 20 seconds. Let’s all do it together.

(This one takes about 40 seconds. Wait for the eye break before moving on.)`,
  q9: `News alerts, these days. How does your phone handle them?

${NEXT}`,
  q10: `5:00 pm. Where is your laptop on a typical day?

${NEXT}`,
  q11: `Last card. Working from home so far, from 0 to 10.

(Then press Finish and send reports.)`,
  wrap: `Your report is on your phone. Only you can see it. Have a look while I start.

{played} of us played. Thank you. Now, the safety moment.`,
  title: `Now, the safety moment. Keep still for a second. Don’t fix anything. Just notice where your neck is. Where your eyes are. And when you last checked the news.

(Pause for 3 seconds.)

That’s what the next five minutes are about.

Most of us don’t have a real home office. We work from the dining table, the sofa, sometimes the bed, and we’re waiting to get back to the office. So nothing today needs a desk or costs money.

{played} of you played the check-up this morning. Nobody sees anyone’s answers, but together they show something: uncertain times don’t stay in the news. They show up in our workday, and then in our bodies.

Keep the page open on your phone. Three quick confessions are coming.`,
  attention: `First, attention. Confession number one is on your phone. Tap it while I talk.

Here’s the habit: **mute the news alerts, and check the news at a few times you choose,** like with your morning coffee or at lunch. You’ll still know what’s happening, on your terms. If something is truly urgent, someone will call you.

Why? Every alert puts you back on edge. People who constantly check their email, texts and social media report more stress: 5.3 out of 10, against 4.4 for people who check less.

This morning, {c1} of us have refreshed the news more times today than we’ve stood up, and {news} get every single news alert. When things are tense in the region, we want to know our families are safe. That’s normal, and it’s why the alerts are worth muting.

(If the numbers come out low: “Then most of us already do this. Keep it that way.”)`,
  hours: `Second, our hours. Confession two is on your phone.

The habit: **close the laptop at 4, and put it somewhere you can’t see it.** At home, the office has no door, so the workday leaks at both ends. The work will still be there at 7:00.

This morning, {c2} of us said the laptop has slept in our bed, {pillow} check email from the pillow before 7:00, and at 5:00, {open} laptops were still open.

(If the numbers come out low: “Most of us already switch off. Good. Keep it that way.”)`,
  body: `Third, the body. Last confession is on your phone.

Neck first: **raise the screen to eye level.** Two books under the laptop will do. Upright, your head weighs about 5 kg. Tilt it 60 degrees, like looking down at a laptop, and your neck carries about 27 kg. That’s heavier than a checked-in suitcase.

This morning, {c3} of us have worked a whole day from bed, and {pose} was our most common pose, at {poseCount}.

Eyes: **lamp on, and every 20 minutes, look about 6 meters away for 20 seconds.** We normally blink 15 to 20 times a minute, and far fewer at a screen. Let’s do one together. Look at the farthest thing you can see.

(Count 20 seconds in silence.)

That’s the 20-20-20 rule. And {dark} of us work in the dark, so the lamp matters.

Fuel: **one glass of water with every coffee.** Yesterday we drank {coffee} coffees and {water} glasses of water.

(If water comes out ahead: “Water is winning. Good. Keep pairing them.”)`,
  awards: `Before we finish, this morning’s awards. Coworker of the month: {coworker}, with {coworkerVotes} votes. Staring champion: {stare}. Unmute if it was you. And most caffeinated: {maxCoffee} in one day. Please drink some water.`,
  habits: `Three things for this week. Raise your screen to eye level. Mute the news alerts, and check the news when you choose. Stand up when a call ends.

Tap the one you’ll start with.

(Wait for the votes.)

Whichever one you tapped, start it today. The first one takes ten seconds: two books under the laptop, right after this call.`,
  close: `Last thing. If the weeks feel heavy, say so. Unmute, message a colleague, or talk to your manager. You don’t need a reason.

This morning we gave working from home {verdict} out of 10, and {low} of us said 5 or below.

(If nobody said 5 or below: “Good to hear. The offer stands anyway.”)

Your report stays on your phone. Thank you.`,
  sources: `(Only if someone asks where a number or a recommendation comes from. Otherwise stop sharing after the handover.)`
};

/* ---------- KPI slides: written from the figures saved in this browser ---------- */
const list = items => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`);

export function kpiDefault(id, k) {
  if (id === "intro") {
    const i = k.intro, e = i.education;
    if (!i.name) return "(Add your introduction first: press P on the presenter screen.)";
    /* Said, not read: "Associate Data Scientist" → "an associate data scientist" (acronyms stay as they are) */
    const lower = s => s.split(" ").map(w => (/^[A-Z0-9&]{2,}$/.test(w) ? w : w.toLowerCase())).join(" ");
    const [job, programme] = i.role.split("·").map(x => x.trim());
    const role = job ? `, ${/^[aeiou]/i.test(job) ? "an" : "a"} ${lower(job)}${programme ? ` in the ${programme}` : ""}` : "";
    /* "Group / Unit" → "the Unit in Group": "the" only before names that end in an organization word */
    const the = s => (/^the\s/i.test(s) || !/\b(Factory|Cent(er|re)|Department|Division|Group|Lab|Unit|Team|Office|Directorate|Programme?|Organi[sz]ation|Company)$/i.test(s) ? s : `the ${s}`);
    const org = (s, link) => { const p = String(s || "").split(/\s*\/\s*/).filter(Boolean); return p.length ? the(p.at(-1)) + (p.length > 1 ? ` ${link} ${p.slice(0, -1).map(the).join(", ")}` : "") : ""; };
    const home = org(i.home, "in"), away = org(i.assignment, "at");
    const assignment = away && `I’m on assignment with ${away}${i.assignmentNote ? `, working on ${i.assignmentNote}` : ""}`;
    const studied = e.school
      ? `I ${e.when ? "graduated" : "studied"} ${e.field ? `in ${lower(e.field)} ` : ""}${e.when ? "from" : "at"} ${e.school}${e.focus ? `, mostly ${lower(e.focus)}` : ""}.`
      : "";
    /* The screen shows the dates; the script tells the same path in order without reading them out */
    const jobs = i.work.map(w => w.org + (w.what ? ` as ${/^[aeiou]/i.test(w.what) ? "an" : "a"} ${lower(w.what)}` : ""));
    const career = jobs.length
      ? [`I started at ${list(jobs)}${home ? `, then joined ${home}${away ? ", which is still my home" : ""}` : ""}.`, assignment && `Right now ${assignment}.`]
      : [[home && `My home is ${home}`, assignment && `${home ? "and right now" : "Right now"} ${assignment}`].filter(Boolean).join(", ") + "."];
    const why = /data/i.test(i.role)
      ? "So you can guess how a data scientist runs a safety moment: data first. Anonymous data, from your phones, in a quick game."
      : "Today I have our safety moment, and it starts with a quick game on your phones.";
    return `${[`While you join: I’m ${i.name}${role}.`, ...(jobs.length ? [studied, ...career] : [...career, studied])].filter(x => x && x !== ".").join(" ")}${i.background.length ? `

A bit about me: ${i.background.map((x, n) => (n ? x.charAt(0).toLowerCase() + x.slice(1) : x)).join("; ")}.` : ""}

${why}

(When the joined count stops climbing, press Start the game. ← or Esc goes back to the big QR code.)`;
  }
  if (id === "close") {
    const { board, support } = k.close;
    const extra = [
      board.url && `The QR code on screen opens ${board.where || "our team board"}.${board.question ? ` Its question is “${board.question}”` : ""} Share yours there, and anything else about working from home that helps.`,
      support.phone && `And if you’d rather talk to someone outside the team${support.name ? `, there’s the ${support.name}` : ""}. ${support.text || "To speak with a counselor, call"} ${support.phone}${support.note ? `, ${support.note}` : ""}.`
    ].filter(Boolean).join("\n\n");
    return extra ? DEFAULTS.close.replace("Your report stays on your phone.", `${extra}\n\nYour report stays on your phone.`) : DEFAULTS.close;
  }
  if (id === "courses") {
    if (!k.courses.length) return "(Add the KPI figures first: press P on the presenter screen.)";
    const lines = ["Before I begin, allow me to share some safety KPIs for our department, starting with the safety courses."];
    const open = k.courses.filter(c => c.pct !== null && c.pct < 100);
    lines.push(open.length ? "All seems to be going well." : "Every course is complete.");
    open.forEach(c => lines.push(c.enrolledRest
      ? `${c.name} is at ${c.pct}%, and everyone who still needs it is already enrolled in the upcoming sessions.`
      : `${c.name} is at ${c.pct}%.`));
    return lines.join(" ");
  }
  if (id === "phishing") {
    const ph = k.phishing;
    if (!ph.months.length) return "(Add the phishing figures first: press P on the presenter screen.)";
    const failed = ph.months.filter(m => m.negative > 0);
    const total = failed.reduce((s, m) => s + m.negative, 0);
    const where = [ph.scope && `for ${ph.scope}`, ph.range && `from ${ph.range}`].filter(Boolean).join(" ");
    return `Moving on, here are the phishing results${where ? " " + where : ""}.

${failed.length ? `Fortunately, failures are almost at zero: just ${total === 1 ? "one" : total}, in ${list(failed.map(m => m.label))}.` : "Fortunately, there were no failures at all."} Let’s try to keep it at zero for another year.`;
  }
  if (id === "incidents") {
    const v = k.safety;
    if (v.every(x => x === null)) return "(Add the incident figures first: press P on the presenter screen.)";
    const names = SAFETY_LABELS.map(l => l.label.toLowerCase());
    const zeros = [], others = [];
    v.forEach((x, i) => (x === 0 ? zeros : others).push(i));
    const name = i => (i >= 4 ? `${names[i]} ${SAFETY_LABELS[i].short}` : names[i]);
    const say = idx => ([4, 5].every(i => idx.includes(i))
      ? list([...idx.filter(i => i < 4).map(name), "traffic violations, with and without points"])
      : list(idx.map(name)));
    return `And lastly, ${zeros.length ? `we continue at zero in ${say(zeros)}.` : ""}${others.length ? ` We had ${list(others.map(i => `${v[i]} in ${name(i)}`))}.` : ""}

Inshallah, we will keep all of these at zero.`;
  }
  return "";
}

/* ---------- Live numbers ---------- */
const COWORKER = { cat: "the cat", kids: "the kids", door: "the doorbell", chat: "the family group chat" };
const ofN = (a, n) => (n >= config.minGroup ? `${a} of ${n}` : null);

export function tokens(s) {
  if (!s) return {};
  const ok = n => n >= config.minGroup;
  const top = s.coworker.top || ["", 0];
  const voteTop = s.vote.n ? s.vote.counts.indexOf(Math.max(...s.vote.counts)) : -1;
  return {
    joined: String(s.joined),
    played: String(s.done || s.joined),
    c1: ofN(s.confess.c1.guilty, s.confess.c1.n),
    c2: ofN(s.confess.c2.guilty, s.confess.c2.n),
    c3: ofN(s.confess.c3.guilty, s.confess.c3.n),
    news: ofN(s.news.always, s.news.n),
    pillow: ofN(s.morning.counts.pillow, s.morning.n),
    open: ofN(s.logoff.open, s.logoff.n),
    pose: ok(s.posture.n) ? POSES[s.posture.top] : null,
    poseCount: ofN(s.posture.topCount, s.posture.n),
    dark: ofN(s.light.dark, s.light.n),
    coffee: ok(s.fuel.n) ? String(s.fuel.coffee) : null,
    water: ok(s.fuel.n) ? String(s.fuel.water) : null,
    maxCoffee: ok(s.fuel.n) ? `${s.fuel.maxCoffee} ${s.fuel.maxCoffee === 1 ? "cup" : "cups"}` : null,
    coworker: ok(s.coworker.n) ? COWORKER[top[0]] : null,
    coworkerVotes: ok(s.coworker.n) ? String(top[1]) : null,
    stare: ok(s.stare.n) ? `${s.stare.max.toFixed(1)} seconds` : null,
    verdict: ok(s.verdict.n) ? s.verdict.avg.toFixed(1) : null,
    low: ok(s.verdict.n) ? String(s.verdict.low) : null,
    vote: voteTop >= 0 && ok(s.vote.n) ? HABITS[voteTop] : null
  };
}

/* What each token means, for the editor's cheat sheet */
export const TOKEN_HELP = {
  played: "players who finished", joined: "players who joined", c1: "confession 1, “Guilty”", c2: "confession 2", c3: "confession 3",
  news: "get every news alert", pillow: "email from the pillow", open: "laptop open at 5:00", pose: "most common pose",
  poseCount: "how many sit like it", dark: "work in the dark", coffee: "coffees yesterday, total", water: "glasses of water, total",
  maxCoffee: "most cups, one player", coworker: "top coworker", coworkerVotes: "its votes", stare: "longest stare",
  verdict: "work-from-home average", low: "answered 5 or below", vote: "most-picked habit"
};
