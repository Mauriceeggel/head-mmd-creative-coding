// Common Ground — presentation V02
// The class presentation (with FCut, the iteration), told the way V1 was: ← → move from one line to
// the next, the presenter's text is typed by a human cursor, bots write their own little texts around
// it, land grows under every text, and some lines are shown by the bots: they flood, crawl, decay,
// drown the page, copy, freeze, get blown away, fall asleep and are read for ink.

const URL_CG = 'https://mauriceeggel.github.io/head-mmd-creative-coding/26-10-22-Common-Ground/';

// c: style of the line · d: what the bots demonstrate · tag: a badge before the line · img: a screenshot shown beside it
const SLIDES = [
	[
		{ t: 'Creative Coding 2026 · group presentation', c: 'kick' },
		{ t: 'Common Ground', c: 'title' },
		{ t: 'a shared map, written over by machines', c: 'sub' },
		{ t: 'the official version, and FCut: an iteration on it', c: 'small' },
	],
	[
		{ t: '1 · synthesis', c: 'kick' },
		{ t: 'What is it?', c: 'q' },
		{ t: 'A huge shared map, live in the browser.', c: 'a' },
		{ t: 'An old pixel atlas: sea, islands, a territory per writer.', c: 'a', img: 'map' },
		{ t: 'Humans write on it next to a crowd of bots.', c: 'a' },
	],
	[
		{ t: '1 · synthesis', c: 'kick' },
		{ t: 'What is it about?', c: 'q' },
		{ t: 'The dead internet theory, taken literally:', c: 'a' },
		{ t: 'most of the web is machines writing for machines.', c: 'a', d: 'flood' },
		{ t: '24 spam bots · 4 AI personas · ~600 posts on the map', c: 'small' },
		{ t: 'Can humans take some ground back?', c: 'a' },
	],
	[
		{ t: '1 · synthesis', c: 'kick' },
		{ t: 'Alone?', c: 'q' },
		{ t: 'Answer a question to get in. Write anywhere.', c: 'a' },
		{ t: 'Your text holds still.', c: 'a', d: 'still' },
		{ t: 'The bot text around it decays.', c: 'a', d: 'decay' },
		{ t: 'No chat, no likes, no replies, no ban.', c: 'a', d: 'replies' },
		{ t: 'Every letter costs ink.', c: 'a', tag: 'FCut' },
	],
	[
		{ t: '1 · synthesis', c: 'kick' },
		{ t: 'Without us?', c: 'q' },
		{ t: 'The bots never stop posting.', c: 'a', d: 'churn' },
		{ t: 'They come back and copy you. Badly.', c: 'a', d: 'copies' },
		{ t: 'Sleeping text never heals: a finite memory.', c: 'a', tag: 'FCut' },
		{ t: 'Nobody online: the world freezes.', c: 'a', d: 'freeze' },
	],
	[
		{ t: '1 · synthesis · co-presence', c: 'kick' },
		{ t: 'Together?', c: 'q' },
		{ t: 'You see each other\'s cursors, live.', c: 'a', d: 'cursors' },
		{ t: 'Close together, a pixel line joins you.', c: 'a', d: 'link' },
		{ t: 'Write together: a shock wave clears the bots.', c: 'a', d: 'blast' },
		{ t: 'Ink flows along the line.', c: 'a', tag: 'FCut' },
	],
	[
		{ t: '1 · synthesis', c: 'kick' },
		{ t: 'Start · Evolve · End', c: 'q' },
		{ t: 'Start: a blue sea and a question. Answer, and land rises.', c: 'a', img: 'arrival' },
		{ t: 'Evolve: what people write stays. Land grows where they write.', c: 'a', img: 'sleeping' },
		{ t: 'End? None. The world pauses when nobody is online.', c: 'a', img: 'planet' },
	],
	[
		{ t: '1 · synthesis', c: 'kick' },
		{ t: 'Visual language', c: 'q' },
		{ t: 'An old atlas in pixels: blue sea, islands, white coasts.', c: 'a', img: 'map' },
		{ t: 'Human letters stay sharp. Machine letters glitch.', c: 'a', d: 'still' },
		{ t: 'Zoom out: letters become ants.', c: 'a' },
		{ t: 'Sound: every click, erasing and dying text.', c: 'a' },
	],
	[
		{ t: '1 · synthesis · iteration', c: 'kick' },
		{ t: 'FCut: writing costs ink', c: 'q' },
		{ t: 'Machine text dies, sinks under the map and sleeps.', c: 'a', d: 'sleep' },
		{ t: 'Reading it turns it into ink, and wears it away.', c: 'a', d: 'ink' },
		{ t: 'Out of ink? Tab: the map finishes your sentence.', c: 'a' },
		{ t: 'Running dry pushes you toward the machine.', c: 'a' },
	],
	[
		{ t: '1 · synthesis · iteration', c: 'kick' },
		{ t: 'FCut on screen', c: 'q' },
		{ t: 'Sleeping voices are pale. A resting cursor drips their ink.', c: 'a', img: 'voice' },
		{ t: 'Tab writes the map\'s words, crawling in your colour.', c: 'a', img: 'tab' },
		{ t: 'Killed spam sinks into worn sediment.', c: 'a', img: 'sleeping' },
		{ t: 'Every cursor carries its ink bar.', c: 'a' },
	],
	[
		{ t: '3 · future steps · by priority', c: 'kick' },
		{ t: 'Next steps', c: 'q' },
		{ t: '1  Confirm FCut\'s shared database', c: 'a' },
		{ t: '2  Test if people get ink and Tab unaided', c: 'a' },
		{ t: '3  Tune the economy with real sessions', c: 'a' },
		{ t: '4  Keep the world alive with nobody online', c: 'a' },
		{ t: '5  A badly remembered double writes as you', c: 'a' },
		{ t: '6  Bots compete for sleeping text', c: 'a' },
	],
	[
		{ t: '3 · limitations', c: 'kick' },
		{ t: 'What hurts', c: 'q' },
		{ t: 'No visitors, no bots: an empty map is a frozen map.', c: 'a' },
		{ t: 'One open database: no moderation.', c: 'a' },
		{ t: 'So much noise: do people stay, or leave?', c: 'a' },
		{ t: 'Colour alone tells territories apart.', c: 'a' },
		{ t: 'Ink is counted in the browser: it can be cheated.', c: 'a', tag: 'FCut' },
		{ t: 'Does scarcity make people write less, or better?', c: 'a', tag: 'FCut' },
	],
	[
		{ t: 'Try it:', c: 'small' },
		{ t: URL_CG, c: 'url' },
	],
];

const HUMAN = [246, 206, 246];   // the presenter's colour (pink)
const PEOPLE = [
	{ k: [124, 255, 178], say: 'hello? anyone here?' },
	{ k: [255, 209, 102], say: 'yes! write with me' },
];

const main = document.getElementById('main');
const botsEl = document.getElementById('bots');
const peopleEl = document.getElementById('people');
const countEl = document.getElementById('count');
const hintEl = document.getElementById('hint');
const land = document.getElementById('land'), lctx = land.getContext('2d', { willReadFrequently: true });
const fx = document.getElementById('fx'), fctx = fx.getContext('2d');

const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const wait = ms => new Promise(r => setTimeout(r, ms));
const rgb = c => `rgb(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0})`;

// ---- state
let started = false; // keys do nothing until the font is there and the title has started
let s = 0;           // slide
let e = 0;           // lines shown on this slide
let job = null;      // the line being typed
let heat = 0;        // how much has been typed lately: wakes the bots up
let frozen = false;
let blastAt = 0;     // when the shock wave went off (0: not on this line)

const cur = () => (SLIDES[s][e - 1] || {}).d;                       // demo of the last line shown
const has = d => SLIDES[s].some((l, i) => l.d === d && i < e);      // shown on this slide already

// ---- the presenter's text
function buildSlide() {
	main.innerHTML = '';
	SLIDES[s].forEach((l, i) => {
		const line = document.createElement('div');
		line.className = 'line ' + l.c + (i < e ? ' on' : '');
		line.innerHTML = (l.tag ? `<span class="tag">${l.tag}</span>` : '') + '<span class="w"><span class="done"></span><span class="rest"></span></span>';
		const done = i < e;
		line.querySelector('.done').textContent = done ? l.t : '';
		line.querySelector('.rest').textContent = done ? '' : l.t;
		main.appendChild(line);
	});
	countEl.textContent = `${s + 1} / ${SLIDES.length}`;
	document.body.classList.toggle('has-shot', SLIDES[s].some(l => l.img));
	fit();
	showShot(e - 1, true);
	placeCursor(e - 1, true);
}

// the whole slide (typed or not) has to fit on screen: shrink the type until it does
function fit() {
	let f = 1;
	main.style.setProperty('--fit', f);
	while (main.offsetHeight > innerHeight * .82 && f > .45) main.style.setProperty('--fit', f -= .04);
}

// the screenshot beside the text: the one of the latest line that has one
const shot = document.getElementById('shot'), shotImg = shot.querySelector('img');
function showShot(i, instant) {
	let src = null;
	for (let j = 0; j <= i; j++) if (SLIDES[s][j] && SLIDES[s][j].img) src = `img/${SLIDES[s][j].img}.png`;
	if (!src) { shot.classList.remove('on'); shot.dataset.src = ''; return; }
	if (shot.dataset.src === src) return;
	shot.dataset.src = src;
	shotImg.src = src;
	shot.classList.remove('on', 'wipe');
	void shot.offsetWidth;
	shot.classList.add('on');
	if (!instant) shot.classList.add('wipe');
}

// the human cursor sits after the last letter typed
const cursor = document.createElement('span');
cursor.className = 'cursor';
function placeCursor(i, idle) {
	const line = main.children[Math.max(0, i)];
	if (!line) return;
	line.querySelector('.done').after(cursor);
	cursor.classList.toggle('blink', idle);
}

const NEAR = 'qwertyuiopasdfghjklzxcvbnm';
// type one line, letter by letter, with the odd typo noticed and fixed
async function typeLine(i) {
	const l = SLIDES[s][i], line = main.children[i];
	const done = line.querySelector('.done'), rest = line.querySelector('.rest');
	const me = job = { skip: false };
	done.textContent = ''; rest.textContent = l.t;
	line.classList.add('on');
	placeCursor(i, false);
	showShot(i);
	let k = 0;
	while (k < l.t.length) {
		if (me.skip) break;
		const ch = l.t[k];
		if (/[a-z]/.test(ch) && Math.random() < .02 && l.c !== 'url') {
			done.textContent += pick(NEAR);
			await wait(rand(140, 220));
			if (me.skip) break;
			done.textContent = done.textContent.slice(0, -1);
			await wait(rand(80, 140));
			continue;
		}
		done.textContent += ch;
		rest.textContent = l.t.slice(k + 1);
		keystroke(cursor);
		k++;
		await wait(ch === ' ' ? rand(50, 110) : rand(26, 60));
	}
	if (job !== me) return;
	done.textContent = l.t; rest.textContent = '';
	job = null;
	placeCursor(i, true);
	if (l.d === 'blast') together();
}

// the small label above a title is there as soon as the slide opens
const first = i => SLIDES[i][0].c === 'kick' ? 2 : 1;

function next() {
	if (job) { job.skip = true; return; }
	if (e < SLIDES[s].length) { e++; typeLine(e - 1); }
	else if (s < SLIDES.length - 1) { s++; e = first(s); buildSlide(); typeLine(e - 1); }
	else return;
	applyState(true);
}

function prev() {
	if (job) { job.skip = true; job = null; }
	if (e > first(s)) e--;
	else if (s > 0) { s--; e = SLIDES[s].length; }
	else return;
	buildSlide();
	applyState(false);
}

// F: fullscreen on and off (with the older Safari names as a fallback)
function toggleFullscreen() {
	const d = document, el = d.documentElement;
	const on = d.fullscreenElement || d.webkitFullscreenElement;
	try {
		const r = on ? (d.exitFullscreen || d.webkitExitFullscreen).call(d)
			: (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
		if (r && r.catch) r.catch(() => {});
	} catch (err) {}
}

addEventListener('keydown', ev => {
	if (ev.code === 'KeyF' || ev.key === 'f' || ev.key === 'F') { ev.preventDefault(); toggleFullscreen(); }
	else if (!started) return;
	else if (ev.key === 'ArrowRight' || ev.key === ' ' || ev.key === 'PageDown') { ev.preventDefault(); next(); }
	else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); prev(); }
	else return;
	hintEl.classList.add('gone');
});

// what the bots and the people do for the line we are on
function applyState(forward) {
	frozen = cur() === 'freeze';
	document.body.classList.toggle('frozen', frozen);
	if (cur() !== 'blast') blastAt = 0;
	if (has('cursors')) ensurePeople(); else dropPeople();
	if (people) {
		people.link = has('link');
		if (!has('blast')) clearPeopleTexts();
		else if (!forward) showPeopleTexts();
	}
	// going back before the decay: the shaken bots recover
	if (!has('decay')) for (const b of bots) b.d = 0;
	// going back: the newest bots leave first
	if (!forward) { const n = target(); while (bots.length > n) killBot(bots[bots.length - 1]); }
	spawnAt = 0;
}

// ---- bots
const T = {
	spam: ['best {w} deals 2026 · click here', 'top 10 {w} you need right now', 'earn $$$ from home with {w}', 'free {w} · limited offer · act now',
		'cheap {w} online · fast shipping', 'buy followers · buy likes · buy {w}', '{w} {w} {w} {w}', 'you won! claim your {w} now'],
	reply: ['great post!', 'so true', 'this.', 'thanks for sharing', '+1', 'following', 'agreed 100%', 'came here to say this', 'underrated',
		'first', 'lol same', 'who else is here in 2026?', 'bump', 'nice', 'wow', '@user{n} exactly', '@user{n} source?', 'saved', '♥ like', '♥♥♥'],
	review: ['★★★★★ amazing {w}, would buy again', '★★★★☆ {w} arrived on time', 'five stars. {w} changed my life', 'verified buyer: {w} as described',
		'★★★★★ best {w} ever!!!', '★☆☆☆☆ {w} broke after a day', 'highly recommend this {w}'],
	slop: ['did you know? {w} is a testament to resilience.', 'in today\'s fast-paced world,\n{w} matters.', 'let\'s delve into the tapestry of {w}.',
		'{w}: a journey of growth.', 'unlock the power of {w} today.', '5 reasons {w} is the future.', '{w} is more than a trend,\nit is a mindset.'],
	bait: ['like if you remember {w}', 'only real ones know about {w}', 'type yes if you agree', 'share before it gets deleted',
		'nobody talks about {w} anymore', 'comment your favourite {w}', 'is it just me or is {w} back?', 'tag someone who needs {w}'],
};
const FILLER = ['content', 'engagement', 'growth', 'crypto', 'wellness', 'synergy', 'AI', 'hustle', 'vibes', 'brand', 'algorithm', 'followers', 'deals', 'humans'];
const GLYPHS = 'ŗāçĕėęǰŷžŝĵĩõũĉǧķļņñœăųįūåǩ$?:;<>/\\|#%&@*+=~';
const LOOK = { a: 'á', e: 'ë', i: 'í', o: 'ø', u: 'ü', c: 'ç', n: 'ñ', s: '$', l: '1' };

// words from what the presenter has written so far, to feed the bots
function slideWords() {
	const words = [];
	for (let i = 0; i < e; i++) words.push(...SLIDES[s][i].t.toLowerCase().match(/[a-z]{4,}/g) || []);
	return words;
}

// a botched copy of one of the presenter's lines
function botch(line) {
	const p = rand(.15, .3);
	const out = [];
	for (let word of line.toLowerCase().split(' ')) {
		const r = Math.random();
		if (r < p * .25) continue;
		if (r < p * .45) { out.push(pick(FILLER)); continue; }
		word = [...word].map(ch => {
			const q = Math.random();
			if (!/[a-z]/.test(ch) || q > p * .8) return ch;
			if (q < p * .2) return '';
			if (q < p * .4) return ch + ch;
			if (q < p * .6 && LOOK[ch]) return LOOK[ch];
			return pick(NEAR);
		}).join('');
		out.push(word);
		if (Math.random() < p * .3) out.push(word);
	}
	if (Math.random() < .5) out.push(pick(['!!', '✓', '#ad', '...', '(copy)', '™']));
	return out.join(' ');
}

const COPY_SLIDE = SLIDES.findIndex(x => x.some(l => l.d === 'copies'));
// once the copies are mentioned, bots copy the presenter, badly (nearly all of them on that line)
function wantsCopy() {
	const copying = (s === COPY_SLIDE && has('copies')) || s > COPY_SLIDE;
	return copying && Math.random() < (cur() === 'copies' ? .92 : .45);
}
// a botched copy of anything the presenter has written so far (titles and questions too)
function copyText() {
	const lines = [];
	for (let i = 0; i <= s; i++) SLIDES[i].forEach((l, j) => { if (l.c !== 'url' && l.c !== 'kick' && (i < s || j < e)) lines.push(l); });
	return wrapText(botch(pick(lines).t), 34);
}
function botText() {
	// "no chat, no likes, no replies": that is all the bots do
	const kinds = cur() === 'replies' ? ['reply', 'reply', 'bait'] : Object.keys(T);
	const words = slideWords();
	const t = pick(T[pick(kinds)])
		.replace(/\{w\}/g, () => words.length && Math.random() < .5 ? pick(words) : pick(FILLER))
		.replace('{n}', () => (Math.random() * 9000 + 1000) | 0);
	return t.includes('\n') ? t : wrapText(t);
}
function wrapText(t, max = 28) {
	const out = [];
	let line = '';
	for (const w of t.split(' ')) {
		if (line && (line + ' ' + w).length > max) { out.push(line); line = w; }
		else line = line ? line + ' ' + w : w;
	}
	if (line) out.push(line);
	return out.join('\n');
}

// how many bots for the line we are on: none at first, more and more after that
function stepIndex() {
	let g = 0;
	for (let i = 0; i < s; i++) g += SLIDES[i].length;
	return g + e;
}
function target() {
	const g = stepIndex();
	let n = g <= 2 ? 0 : Math.min(80, Math.round((g - 2) ** 1.4 * 1.2));
	if (has('flood')) n += 25;                                    // machines writing for machines
	if (has('churn')) n += DROWN;                                 // the bots never stop posting: the page drowns
	if (blastAt) n = performance.now() - blastAt < 2600 ? 0 : n + 15;   // blown away, then back in a rush
	return n;
}

const DROWN = 230;   // extra bots once "the bots never stop posting" is on screen
const drowning = () => has('churn');
const bots = [];     // { el, x, y, w, h, k, letters, alive, done, d, copy }
let letters = [];    // every letter written by a bot, for the glitches
let ghosts = [];     // bots fading away: their land sinks with them
let cell = { w: 10, h: 20 };

function measure() {
	const probe = document.createElement('div');
	probe.className = 'bot';
	probe.textContent = 'M';
	botsEl.appendChild(probe);
	const fs = parseFloat(getComputedStyle(probe).fontSize);
	const ctx = document.createElement('canvas').getContext('2d');
	ctx.font = `${fs}px Silkscreen`;
	cell = { w: ctx.measureText('M').width, h: Math.round(fs * 1.15) };
	probe.remove();
}

// the presenter's text, line by line, to keep the bots off it
function mainRects(typedOnly) {
	const out = [];
	for (const w of main.querySelectorAll(typedOnly ? '.done, .on .tag' : '.w, .tag')) for (const r of w.getClientRects()) if (r.width) out.push(r);
	if (!typedOnly && document.body.classList.contains('has-shot')) out.push(shot.getBoundingClientRect());
	return out;
}
const hit = (a, b, m) => a.x < b.right + m && a.x + a.w > b.left - m && a.y < b.bottom + m && a.y + a.h > b.top - m;
const hitBot = (a, b, m) => a.x < b.x + b.w + m && a.x + a.w > b.x - m && a.y < b.y + b.h + m && a.y + a.h > b.y - m;
// distance from a bot to the nearest line of the presenter's text
function distMain(b, rects) {
	let best = Infinity;
	for (const r of rects) {
		const dx = Math.max(0, r.left - (b.x + b.w), b.x - r.right), dy = Math.max(0, r.top - (b.y + b.h), b.y - r.bottom);
		best = Math.min(best, Math.hypot(dx, dy));
	}
	return best;
}
const DECAY_R = 300;   // px around the presenter's text where the bots decay

function hsl2rgb(h, sat, l) {
	sat /= 100; l /= 100;
	const f = n => { const k = (n + h / 30) % 12, a = sat * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
	return [f(0), f(8), f(4)];
}

function spawnBot() {
	const copy = wantsCopy();
	const text = copy ? copyText() : botText();
	const rows = text.split('\n');
	// laid out once, invisible, to know its real size (★ and the like are wider than a cell)
	const el = document.createElement('div');
	el.className = 'bot';
	el.style.visibility = 'hidden';
	// some copies try to pass for the presenter's own lines: bigger
	if (copy && Math.random() < .45) el.style.fontSize = `calc(clamp(11px, .85vw, 17px) * ${rand(1.4, 2.8).toFixed(2)})`;
	el.innerHTML = rows.map(r => `<span class="bl">${r.replace(/&/g, '&amp;').replace(/</g, '&lt;')}<span class="cursor"></span></span>`).join('');
	botsEl.appendChild(el);
	const box = el.getBoundingClientRect();
	const w = box.width, h = box.height;
	const rects = mainRects(false);
	const keepOff = has('decay') ? DECAY_R : cell.h;      // decaying around the text: they keep away
	const zone = people && people.zone;
	const drown = drowning();
	let spot = null;
	for (let k = 0; k < 40 && !spot; k++) {
		let x = rand(8, innerWidth - w - 8), y = rand(8, innerHeight - h - 40);
		// copies crowd around the line they copy
		if (copy && rects.length && Math.random() < .7) {
			const r = pick(rects);
			x = r.left + rand(-260, r.width + 260) - w / 2;
			y = r.top + rand(-220, r.height + 220) - h / 2;
			x = Math.max(8, Math.min(innerWidth - w - 8, x));
			y = Math.max(8, Math.min(innerHeight - h - 40, y));
		}
		const c = { x: Math.round(x / cell.w) * cell.w, y: Math.round(y / cell.h) * cell.h, w, h };
		// drowning: posts pile up on top of each other and creep under the presenter's text
		if (drown) { if (!zone || !hitBot(c, zone, cell.w)) spot = c; continue; }
		if (rects.some(r => hit(c, r, keepOff))) continue;
		if (zone && hitBot(c, zone, cell.w)) continue;
		if (bots.some(b => b.alive && hitBot(c, b, cell.w))) continue;
		spot = c;
	}
	if (!spot) { el.remove(); return; }
	el.innerHTML = '';
	el.style.visibility = '';
	el.style.left = spot.x + 'px';
	el.style.top = spot.y + 'px';
	const k = hsl2rgb(Math.random() * 360, rand(70, 95), rand(58, 72));
	el.style.color = rgb(k);
	const b = { ...spot, el, k, letters: [], alive: true, done: false, d: 0, copy };
	bots.push(b);
	typeBot(b, rows);
}

// a bot types its text with its own cursor, a bit stiffer than a human
async function typeBot(b, rows) {
	const c = document.createElement('span');
	c.className = 'cursor';
	c.style.background = 'currentColor';
	for (const row of rows) {
		const bl = document.createElement('span');
		bl.className = 'bl';
		b.el.appendChild(bl);
		bl.appendChild(c);
		for (const ch of row) {
			while (frozen && b.alive) await wait(120);
			if (!b.alive) return;
			const sp = document.createElement('span');
			sp.textContent = ch;
			bl.insertBefore(sp, c);
			if (ch !== ' ') { b.letters.push(sp); letters.push(sp); }
			await wait(ch === ' ' ? rand(90, 260) : rand(45, 110));
		}
	}
	b.done = true;
	c.classList.add('blink');
	await wait(rand(1200, 2600));
	c.remove();
}

function killBot(b) {
	if (!b.alive) return;
	b.alive = false;
	b.el.classList.add('dead');
	const gone = new Set(b.letters);
	letters = letters.filter(sp => !gone.has(sp));
	ghosts.push({ b, t0: performance.now() });
	setTimeout(() => b.el.remove(), 1300);
	bots.splice(bots.indexOf(b), 1);
}

// new bots one at a time, faster when many are missing
let spawnAt = 0;
function spawner(t) {
	if (frozen) return;
	const missing = target() - bots.length;
	if (missing > 0 && t > spawnAt) {
		// drowning: a burst of posts every tick
		const burst = drowning() ? Math.min(missing, cur() === 'copies' ? 10 : 7) : 1;
		for (let i = 0; i < burst; i++) spawnBot();
		const fast = has('churn') || has('flood') || blastAt;
		spawnAt = t + (fast ? rand(60, 160) : Math.max(90, 700 - missing * 40) * rand(.6, 1.4));
	}
}

// "the bots never stop posting": the oldest posts keep being replaced
let churnAt = 0;
function churn(t) {
	if (frozen || t < churnAt) return;
	// too many bots for this line (we just left the flood): the oldest leave, a few at a time
	if (!has('churn')) {
		const over = bots.length - target();
		if (over > 0) { churnAt = t + 90; for (let i = Math.min(over, 4); i > 0; i--) killBot(bots[0]); }
		return;
	}
	// fast enough that the page keeps turning over; on the copies line, the old posts give way to copies
	const copies = cur() === 'copies';
	churnAt = t + (copies ? rand(60, 130) : rand(120, 240));
	for (let i = copies ? 3 : 2; i > 0; i--) {
		const old = bots.find(b => b.done && !(copies && b.copy)) || bots.find(b => b.done);
		if (old) killBot(old);
	}
}

// "machine text dies, sinks and sleeps": a dead bot stays on the map, pale, without its backing.
// "reading it turns it into ink": the sleeping letters wear away one by one, each one a drop of ink
let sleepers = [];   // { el, letters }
let sleepAt = 0;
function sleep(t) {
	if (frozen) return;
	if (!has('sleep')) { if (sleepers.length) { for (const z of sleepers) z.el.remove(); sleepers = []; } return; }
	if (t > sleepAt && sleepers.length < 22) {
		sleepAt = t + rand(250, 600);
		const b = bots.find(b => b.done);
		if (b) {
			b.alive = false;
			const gone = new Set(b.letters);
			letters = letters.filter(sp => !gone.has(sp));
			bots.splice(bots.indexOf(b), 1);
			b.el.classList.add('sleep');
			b.el.style.color = '';
			sleepers.push({ el: b.el, letters: b.letters.filter(sp => sp.textContent.trim()) });
		}
	}
	if (!has('ink')) return;
	for (let k = 0; k < 3; k++) {
		const z = pick(sleepers);
		if (!z || !z.letters.length) continue;
		const sp = z.letters.splice((Math.random() * z.letters.length) | 0, 1)[0];
		sp.classList.add('drip');
		setTimeout(() => { sp.textContent = ' '; sp.classList.remove('drip'); }, 500);
	}
}

// ---- tick: glitches, decay, churn
// calm: a letter here and there; many more while someone types; crawling on "holds still"
let lastTick = performance.now();
function tick() {
	const t = performance.now(), dt = Math.min(.3, (t - lastTick) / 1000);
	lastTick = t;
	spawner(t);
	churn(t);
	sleep(t);
	if (frozen) return;
	heat *= .93;
	const p = cur() === 'still' ? .12 : .002 + heat * .08;
	const k = Math.round(letters.length * p + (Math.random() < letters.length * p % 1 ? 1 : 0));
	for (let i = 0; i < k; i++) glitchLetter(pick(letters));

	// decay: the bots around the presenter's text lose their colour, tremble, glitch and die
	const decaying = has('decay');
	const rects = decaying ? mainRects(true) : null;
	for (const b of [...bots]) {
		if (decaying) {
			const dm = distMain(b, rects);
			if (dm < DECAY_R) b.d += dt * (.12 + .5 * (1 - dm / DECAY_R)) * (.6 + heat);
		}
		if (!b.d) continue;
		if (b.d >= 1) { killBot(b); continue; }
		const g = 150, d = b.d;
		b.el.style.color = rgb(b.k.map(v => v + (g - v) * d));
		b.el.style.transform = `translate(${(Math.random() - .5) * d * 6}px, ${(Math.random() - .5) * d * 4}px)`;
		for (const sp of b.letters) if (Math.random() < d * .35) glitchLetter(sp);
	}
}
function glitchLetter(sp) {
	if (!sp || sp.dataset.c) return;
	sp.dataset.c = sp.textContent;
	sp.textContent = pick(GLYPHS);
	sp.classList.add('g');
	setTimeout(() => { sp.textContent = sp.dataset.c; delete sp.dataset.c; sp.classList.remove('g'); }, rand(250, 700));
}

// every keystroke (presenter or people) shakes the bots a little
function keystroke(el) {
	heat = Math.min(1, heat + .035);
}

// ---- the people: two other humans' cursors, the line between them, their text, the shock wave
let people = null;   // { zone, list: [{ el, x, y, tx, ty, k, txt }], link }

function ensurePeople() {
	if (people) return;
	// a free strip of the screen, away from the presenter's text
	const rects = mainRects(false);
	const w = 40 * cell.w, h = 8 * cell.h;
	let zone = null;
	for (let k = 0; k < 300 && !zone; k++) {
		const c = { x: Math.round(rand(16, innerWidth - w - 16) / cell.w) * cell.w, y: Math.round(rand(16, innerHeight - h - 50) / cell.h) * cell.h, w, h };
		if (!rects.some(r => hit(c, r, cell.h))) zone = c;
	}
	if (!zone) zone = { x: 16, y: innerHeight - h - 50, w, h };
	// the bots that were there make room
	for (const b of [...bots]) if (hitBot(b, zone, 0)) killBot(b);
	people = { zone, link: false, list: [] };
	PEOPLE.forEach((p, i) => {
		const el = document.createElement('div');
		el.className = 'person';
		el.style.borderColor = rgb(p.k);
		el.style.width = cell.w + 'px';
		el.style.height = cell.h + 'px';
		peopleEl.appendChild(el);
		const x = zone.x + (i ? 30 : 4) * cell.w, y = zone.y + (i ? 5 : 2) * cell.h;
		people.list.push({ el, x, y, tx: x, ty: y, k: p.k, say: p.say, txt: null, waitTo: 0, writing: false });
	});
	movePeople(true);
}
function dropPeople() {
	if (!people) return;
	for (const p of people.list) { p.el.remove(); if (p.txt) p.txt.remove(); }
	people = null;
	fctx.clearRect(0, 0, fx.width, fx.height);
}
function clearPeopleTexts() {
	for (const p of people.list) if (p.txt) { p.txt.remove(); p.txt = null; }
}
function showPeopleTexts() {
	people.list.forEach((p, i) => {
		if (p.txt) return;
		p.x = p.tx = people.zone.x + (i ? 14 : 4) * cell.w;
		p.y = p.ty = people.zone.y + (i ? 5 : 2) * cell.h;
		p.txt = textAt(p);
		p.txt.textContent = p.say;
		p.x = p.tx = p.x + p.say.length * cell.w;
	});
	movePeople(true);
}
function textAt(p) {
	const t = document.createElement('div');
	t.className = 'ptext';
	t.style.left = p.x + 'px';
	t.style.top = p.y + 'px';
	t.style.color = rgb(p.k);
	peopleEl.appendChild(t);
	return t;
}

// cursors wander about in their strip, a cell at a time; once linked they stay close
function movePeople(instant) {
	if (!people || frozen) return;
	const z = people.zone, t = performance.now();
	people.list.forEach((p, i) => {
		if (!p.writing && !instant) {
			if (p.x === p.tx && p.y === p.ty && t > p.waitTo) {
				const cx = people.link ? (i ? 18 : 6) + Math.round(rand(-2, 2)) : Math.round(rand(1, 38));
				const cy = people.link ? (i ? 4 : 2) + Math.round(rand(0, 1)) : Math.round(rand(0, 7));
				p.tx = z.x + cx * cell.w; p.ty = z.y + cy * cell.h;
				p.waitTo = t + rand(400, 1800);
			}
			if (p.x !== p.tx) p.x += Math.sign(p.tx - p.x) * Math.min(cell.w, Math.abs(p.tx - p.x));
			else if (p.y !== p.ty) p.y += Math.sign(p.ty - p.y) * Math.min(cell.h, Math.abs(p.ty - p.y));
		}
		p.el.style.left = p.x + 'px';
		p.el.style.top = p.y + 'px';
	});
}
setInterval(() => movePeople(false), 90);

// the stepped pixel line between two linked cursors, with a white pulse running along it
function drawLink(t) {
	fctx.clearRect(0, 0, fx.width, fx.height);
	if (!people || !people.link) return;
	const [a, b] = people.list;
	const ax = a.x + cell.w / 2, ay = a.y + cell.h / 2, bx = b.x + cell.w / 2, by = b.y + cell.h / 2;
	const P = 4, n = Math.max(1, Math.round(Math.max(Math.abs(bx - ax), Math.abs(by - ay)) / P));
	const pulse = (t / 900) % 1;
	for (let i = 0; i <= n; i++) {
		const f = i / n;
		const x = Math.round((ax + (bx - ax) * f) / P) * P, y = Math.round((ay + (by - ay) * f) / P) * P;
		const near = Math.max(0, 1 - Math.abs(f - pulse) * 8);
		fctx.fillStyle = rgb(a.k.map((v, j) => v + (b.k[j] - v) * f).map(v => v + (255 - v) * near));
		fctx.fillRect(x - P / 2, y - P / 2, P, P);
	}
}

// "write together": both people type at once, then the shock wave goes off between them
async function together() {
	if (!people) return;
	const mySlide = s;
	clearPeopleTexts();
	await Promise.all(people.list.map(async (p, i) => {
		p.writing = true;
		p.x = p.tx = people.zone.x + (i ? 14 : 4) * cell.w;
		p.y = p.ty = people.zone.y + (i ? 5 : 2) * cell.h;
		movePeople(true);
		await wait(i * 300);
		p.txt = textAt(p);
		for (const ch of p.say) {
			if (!people || s !== mySlide) return;
			p.txt.textContent += ch;
			p.x += cell.w;
			movePeople(true);
			keystroke();
			await wait(ch === ' ' ? rand(80, 160) : rand(50, 110));
		}
		p.writing = false;
	}));
	if (!people || s !== mySlide || cur() !== 'blast') return;
	await wait(250);
	const [a, b] = people.list;
	blast((a.x + b.x) / 2 + cell.w / 2, (a.y + b.y) / 2 + cell.h / 2);
}

// ---- shock wave: a ring, every bot it passes dies; after a moment they rush back
function blast(cx, cy) {
	blastAt = performance.now();
	const ring = document.createElement('div');
	ring.className = 'wave';
	ring.style.left = cx + 'px';
	ring.style.top = cy + 'px';
	document.body.appendChild(ring);
	const R = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 40;
	const t0 = performance.now(), D = 1800;
	document.body.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-6px,3px)' }, { transform: 'translate(5px,-4px)' }, { transform: 'translate(0,0)' }], { duration: 420, easing: 'ease-out' });
	(function step(t) {
		const k = Math.min(1, (t - t0) / D), r = R * (1 - (1 - k) ** 2);
		ring.style.width = ring.style.height = r * 2 + 'px';
		ring.style.opacity = 1 - k * .8;
		for (const b of [...bots]) if (Math.hypot(b.x + b.w / 2 - cx, b.y + b.h / 2 - cy) < r) killBot(b);
		if (k < 1) requestAnimationFrame(step); else ring.remove();
	})(t0);
}

// ---- land: every text grows an island around it, coloured by its writer, with white
//      coasts and borders between territories (like the game, in miniature)
const F = 3;                          // screen px per land px
const LR = 14, LR_HUMAN = 18;         // reach of a text, in land px
let LW = 0, LH = 0, mass, best, own, NM, img;

function noiseGrid() {
	LW = Math.ceil(innerWidth / F); LH = Math.ceil(innerHeight / F);
	land.width = LW; land.height = LH;
	fx.width = innerWidth; fx.height = innerHeight;
	mass = new Float32Array(LW * LH); best = new Float32Array(LW * LH); own = new Int16Array(LW * LH);
	img = lctx.createImageData(LW, LH);
	// value noise, a few octaves, for ragged coasts
	const G = 14, gw = Math.ceil(LW / G) + 2, gh = Math.ceil(LH / G) + 2;
	const lat = Float32Array.from({ length: gw * gh * 2 }, () => Math.random());
	const val = (x, y, sc, o) => {
		const gx = x / sc, gy = y / sc, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
		const W = Math.ceil(LW / sc) + 2, at = (i, j) => lat[(o + j * W + i) % lat.length];
		const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
		const a = at(ix, iy), b = at(ix + 1, iy), c = at(ix, iy + 1), d = at(ix + 1, iy + 1);
		return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
	};
	NM = new Float32Array(LW * LH);
	for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++)
		NM[y * LW + x] = .45 + .75 * val(x, y, G, 0) + .4 * val(x, y, G / 3, 977);
}

function writers() {
	const out = [];
	for (const r of mainRects(true)) out.push({ x: r.left, y: r.top, w: r.width, h: r.height, k: HUMAN, wt: 1.4, R: LR_HUMAN });
	const t = performance.now();
	ghosts = ghosts.filter(g => t - g.t0 < 1300);
	const add = (b, wt) => {
		const w = b.el.offsetWidth, h = b.el.offsetHeight;
		if (w && wt > .05) out.push({ x: b.x, y: b.y, w, h, k: b.k, wt, R: LR });
	};
	for (const b of bots) add(b, 1 - b.d * .7);
	for (const g of ghosts) add(g.b, (1 - g.b.d * .7) * (1 - (t - g.t0) / 1300));
	if (people) for (const p of people.list) {
		if (p.txt && p.txt.offsetWidth) out.push({ x: p.txt.offsetLeft, y: p.txt.offsetTop, w: p.txt.offsetWidth, h: p.txt.offsetHeight, k: p.k, wt: 1.2, R: LR_HUMAN });
	}
	return out;
}

function drawLand() {
	if (frozen || !LW) return;
	mass.fill(0); best.fill(0); own.fill(-1);
	const ws = writers();
	ws.forEach((wr, idx) => {
		const R = wr.R;
		const x0 = wr.x / F, y0 = wr.y / F, x1 = (wr.x + wr.w) / F, y1 = (wr.y + wr.h) / F;
		const ax = Math.max(0, Math.floor(x0 - R)), bx = Math.min(LW - 1, Math.ceil(x1 + R));
		const ay = Math.max(0, Math.floor(y0 - R)), by = Math.min(LH - 1, Math.ceil(y1 + R));
		for (let y = ay; y <= by; y++) {
			const dy = Math.max(0, y0 - y, y - y1);
			for (let x = ax; x <= bx; x++) {
				const dx = Math.max(0, x0 - x, x - x1), d = Math.hypot(dx, dy);
				if (d >= R) continue;
				const c = wr.wt * (1 - d / R) ** 2, i = y * LW + x;
				mass[i] += c;
				if (c > best[i]) { best[i] = c; own[i] = idx; }
			}
		}
	});
	const isLand = i => mass[i] * NM[i] > .46;
	const d = img.data;
	for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
		const i = y * LW + x, o = i * 4;
		if (!isLand(i)) { d[o + 3] = 0; continue; }
		const coast = x === 0 || y === 0 || x === LW - 1 || y === LH - 1 || !isLand(i - 1) || !isLand(i + 1) || !isLand(i - LW) || !isLand(i + LW);
		const ow = own[i];
		const border = (x < LW - 1 && own[i + 1] !== ow && isLand(i + 1)) || (y < LH - 1 && own[i + LW] !== ow && isLand(i + LW));
		let r, g, b;
		if (coast || border) r = g = b = 225;
		else { const k = ws[ow].k; r = 34 + k[0] * .3; g = 34 + k[1] * .3; b = 34 + k[2] * .3; }
		d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
	}
	lctx.putImageData(img, 0, 0);
}

// ---- go
function frame(t) {
	drawLink(t);
	requestAnimationFrame(frame);
}
Promise.all([
	document.fonts.load('20px Silkscreen'),
	document.fonts.load('bold 20px Silkscreen'),
]).catch(() => {}).then(() => document.fonts.ready).then(() => {
	measure();
	noiseGrid();
	// index.html#12 opens straight on the 12th line (to rehearse from the middle)
	let g = parseInt(location.hash.slice(1), 10) || 0;
	if (g > 1) {
		s = 0;
		while (s < SLIDES.length - 1 && g > SLIDES[s].length) { g -= SLIDES[s].length; s++; }
		e = Math.max(first(s), Math.min(g, SLIDES[s].length));
		buildSlide();
		applyState(false);
	} else {
		e = first(0);
		buildSlide();
		typeLine(e - 1);
	}
	started = true;
	setInterval(tick, 110);
	setInterval(drawLand, 140);
	requestAnimationFrame(frame);
});
addEventListener('resize', () => { measure(); noiseGrid(); fit(); drawLand(); });
