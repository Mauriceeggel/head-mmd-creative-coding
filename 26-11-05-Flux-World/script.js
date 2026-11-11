// Flux World — la ville commune
// Une ville vue de haut, en fil de fer blanc sur fond noir.
// Tout le monde voit la même ville : elle est construite avec la même graine,
// l'heure est celle du serveur Firebase, et chaque perturbation est partagée.
// La ville fonctionne seule (courant, circulation, fenêtres, jour et nuit).
// Les opérateurs la perturbent : couper une ligne, bloquer une route, construire un mur.
// Couper la centrale demande trois opérateurs en même temps.
// La ville envoie ses équipes réparer… mais elle garde des cicatrices.

import * as THREE from "three";

// ---------- réglages ----------
const N = 9;                    // la ville fait 9 x 9 îlots
const ILOT = 10;                // un îlot + une rue = 10 m
const RUE = 2.4;                // largeur d'une rue
const DEMI = N * ILOT / 2;
const HAUTEUR_CABLE = 6.5;
const HAUTEUR_MUR = 3.2;
const NB_VOITURES = 150;
const VITESSE_VOITURE = 7;      // m/s
const VITESSE_EQUIPE = 10;      // m/s
const ECART = 0.15;             // distance mini entre deux voitures (en fraction de rue)
const DUREE_CABLE = 45;         // secondes avant réparation (au minimum)
const DUREE_ROUTE = 60;
const DUREE_CHANTIER = 180;
const DUREE_CENTRALE = 40;
const RECHARGE = 8;             // secondes entre deux actions d'un même opérateur
const OPERATEURS_CENTRALE = 3;  // il faut 3 opérateurs…
const FENETRE_CENTRALE = 6;     // …dans les mêmes 6 secondes
const LONGUEUR_MUR = 36;
const MOBILITE_NORMALE = 0.82;  // la circulation d'un jour calme (feux rouges compris) = 100 %
const JOUR = 600;               // une journée de la ville = 10 minutes
const EPOQUE = Date.UTC(2026, 10, 9);

const BLANC = 0xe8e8e8;
const GRIS = 0x5a5a5a;
const SOMBRE = 0x2a2a2a;
const ALERTE = 0xff4b2b;


// ---------- hasard (le même pour tout le monde) ----------
function graine(s) {
	return function () {
		s = s + 0x6D2B79F5 | 0;
		let t = Math.imul(s ^ s >>> 15, 1 | s);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
const hasard = graine(2026);

// hasard tiré de deux nombres : même réponse partout, sans mémoire
function bruit(a, b) {
	let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const lerp = (a, b, t) => a + (b - a) * t;
const borner = (v, a, b) => Math.max(a, Math.min(b, v));
const deux = n => String(n).padStart(2, "0");


// ---------- l'heure du serveur ----------
let decalage = 0;
base.ref(".info/serverTimeOffset").on("value", s => decalage = s.val() || 0);
function maintenant() {
	return Date.now() + decalage;
}

function horloge(ms) {
	const s = (ms - EPOQUE) / 1000;
	const jour = Math.floor(s / JOUR) + 1;
	const h = ((s % JOUR) + JOUR) % JOUR / JOUR * 24;
	return { jour: jour, h: h, texte: deux(Math.floor(h)) + ":" + deux(Math.floor((h % 1) * 60)) };
}

// 0 en plein jour, 1 en pleine nuit
function nuit(h) {
	if (h < 5 || h > 21) return 1;
	if (h < 7) return (7 - h) / 2;
	if (h > 19) return (h - 19) / 2;
	return 0;
}


// ---------- scène ----------
const canvas = document.getElementById("ville");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// vue de haut, un peu isométrique : caméra orthographique qui regarde depuis +x +y +z
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1000);
const DIRECTION = new THREE.Vector3(1, 0.95, 1).normalize();
const cible = new THREE.Vector3(0, 0, 0);
const VUE = 108;

function placerCamera() {
	camera.position.copy(cible).addScaledVector(DIRECTION, 300);
	camera.lookAt(cible);
}

function redimensionner() {
	const l = window.innerWidth;
	const h = window.innerHeight;
	renderer.setSize(l, h, false);
	const ratio = l / h;
	const vue = ratio < 1.2 ? VUE * 1.2 / ratio : VUE;
	camera.top = vue / 2;
	camera.bottom = -vue / 2;
	camera.left = -vue / 2 * ratio;
	camera.right = vue / 2 * ratio;
	camera.updateProjectionMatrix();
}
placerCamera();
redimensionner();
window.addEventListener("resize", redimensionner);

// petits outils pour dessiner des traits
function lignes(positions, couleur) {
	const g = new THREE.BufferGeometry();
	g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
	const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: couleur }));
	scene.add(l);
	return l;
}

function remplacer(objet, positions) {
	objet.geometry.dispose();
	objet.geometry = new THREE.BufferGeometry();
	objet.geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
}

function trait(t, x0, y0, z0, x1, y1, z1) {
	t.push(x0, y0, z0, x1, y1, z1);
}

function boite(t, x0, y0, z0, x1, y1, z1) {
	const c = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
	const a = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
	for (const [p, q] of a) t.push(...c[p], ...c[q]);
}

function rectangle(t, x0, z0, x1, z1, y = 0) {
	trait(t, x0, y, z0, x1, y, z0);
	trait(t, x1, y, z0, x1, y, z1);
	trait(t, x1, y, z1, x0, y, z1);
	trait(t, x0, y, z1, x0, y, z0);
}

function cercle(t, x, y, z, r, n = 14) {
	for (let k = 0; k < n; k++) {
		const a = k / n * Math.PI * 2;
		const b = (k + 1) / n * Math.PI * 2;
		trait(t, x + Math.cos(a) * r, y, z + Math.sin(a) * r, x + Math.cos(b) * r, y, z + Math.sin(b) * r);
	}
}


// ---------- le plan : carrefours, rues, îlots ----------
const X = i => i * ILOT - DEMI;
const noeud = (i, j) => i * (N + 1) + j;

const noeuds = [];
for (let i = 0; i <= N; i++) {
	for (let j = 0; j <= N; j++) {
		noeuds.push({ i: i, j: j, x: X(i), z: X(j), secteur: Math.min(2, Math.floor(i / 3)) * 3 + Math.min(2, Math.floor(j / 3)), voisins: [] });
	}
}

// une rue = un tronçon entre deux carrefours voisins
const rues = [];
function ajouterRue(a, b, horizontale, nom) {
	const r = { index: rues.length, a: a, b: b, horizontale: horizontale, nom: nom };
	rues.push(r);
	noeuds[a].voisins.push({ rue: r.index, autre: b });
	noeuds[b].voisins.push({ rue: r.index, autre: a });
}
for (let i = 0; i <= N; i++) {
	for (let j = 0; j <= N; j++) {
		if (i < N) ajouterRue(noeud(i, j), noeud(i + 1, j), true, "Street " + deux(j + 1) + " · Av " + deux(i + 1) + "–" + deux(i + 2));
		if (j < N) ajouterRue(noeud(i, j), noeud(i, j + 1), false, "Avenue " + deux(i + 1) + " · St " + deux(j + 1) + "–" + deux(j + 2));
	}
}

// ce que contient chaque îlot
const LETTRES = "ABC";
const types = [];
for (let i = 0; i < N; i++) {
	types.push([]);
	for (let j = 0; j < N; j++) types[i].push("immeubles");
}
types[0][0] = "centrale";
types[N - 1][0] = "depot";
types[5][5] = "administration";
const postes = [];
for (let sx = 0; sx < 3; sx++) {
	for (let sz = 0; sz < 3; sz++) {
		types[sx * 3 + 1][sz * 3 + 1] = "poste";
		postes[sx * 3 + sz] = { nom: LETTRES[sx] + (sz + 1), bi: sx * 3 + 1, bj: sz * 3 + 1, noeud: noeud(sx * 3 + 1, sz * 3 + 1) };
	}
}
for (let k = 0; k < 5;) {
	const i = Math.floor(hasard() * N);
	const j = Math.floor(hasard() * N);
	if (types[i][j] === "immeubles") {
		types[i][j] = "parc";
		k++;
	}
}

// limites intérieures d'un îlot (sans la rue)
function interieur(i, j, marge = 0.5) {
	return { x0: X(i) + RUE / 2 + marge, z0: X(j) + RUE / 2 + marge, x1: X(i + 1) - RUE / 2 - marge, z1: X(j + 1) - RUE / 2 - marge };
}

function secteurDe(x, z) {
	const i = borner(Math.floor((x + DEMI) / ILOT), 0, N - 1);
	const j = borner(Math.floor((z + DEMI) / ILOT), 0, N - 1);
	return Math.floor(i / 3) * 3 + Math.floor(j / 3);
}


// ---------- le sol ----------
const traitsSol = [];
for (let i = 0; i < N; i++) {
	for (let j = 0; j < N; j++) {
		const b = interieur(i, j, 0);
		rectangle(traitsSol, b.x0, b.z0, b.x1, b.z1);
	}
}
rectangle(traitsSol, -DEMI - RUE / 2, -DEMI - RUE / 2, DEMI + RUE / 2, DEMI + RUE / 2);
lignes(traitsSol, GRIS);

const marquage = [];
for (const r of rues) {
	const A = noeuds[r.a];
	const B = noeuds[r.b];
	for (let k = 0; k < 4; k++) {
		const u0 = 0.2 + k * 0.17;
		trait(marquage, lerp(A.x, B.x, u0), 0, lerp(A.z, B.z, u0), lerp(A.x, B.x, u0 + 0.08), 0, lerp(A.z, B.z, u0 + 0.08));
	}
}
lignes(marquage, SOMBRE);


// ---------- les bâtiments ----------
// remplissage noir (pour cacher ce qui est derrière) + arêtes blanches + fenêtres
const volumes = [];       // { x0, y0, z0, x1, y1, z1 }
const arretes = [];
const fenetres = [];      // { x, y, z, face, secteur }
const traitsDetails = []; // antennes, arbres, cheminées…

function volume(x0, y0, z0, x1, y1, z1, avecFenetres) {
	volumes.push({ x0, y0, z0, x1, y1, z1 });
	boite(arretes, x0, y0, z0, x1, y1, z1);
	if (!avecFenetres) return;
	const secteur = secteurDe((x0 + x1) / 2, (z0 + z1) / 2);
	// on ne perce que les deux façades tournées vers la caméra (+x et +z)
	for (let y = y0 + 0.8; y < y1 - 0.5; y += 1.1) {
		const nz = Math.floor((z1 - z0 - 0.5) / 0.9);
		for (let k = 0; k < nz; k++) fenetres.push({ x: x1 + 0.02, y: y, z: (z0 + z1) / 2 + (k - (nz - 1) / 2) * 0.9, face: "x", secteur: secteur });
		const nx = Math.floor((x1 - x0 - 0.5) / 0.9);
		for (let k = 0; k < nx; k++) fenetres.push({ x: (x0 + x1) / 2 + (k - (nx - 1) / 2) * 0.9, y: y, z: z1 + 0.02, face: "z", secteur: secteur });
	}
}

function immeuble(x0, z0, x1, z1) {
	const cx = (x0 + x1) / 2;
	const cz = (z0 + z1) / 2;
	const d = Math.hypot(cx, cz) / (DEMI * 1.15);
	const h = 1.4 + hasard() * 2.4 + Math.pow(Math.max(0, 1 - d), 2) * 19 * (0.35 + hasard() * 0.65);
	volume(x0, 0, z0, x1, h, z1, true);
	// les plus hauts ont parfois un étage en retrait
	if (h > 9 && hasard() < 0.5 && x1 - x0 > 3 && z1 - z0 > 3) {
		const m = 0.7 + hasard() * 0.5;
		volume(x0 + m, h, z0 + m, x1 - m, h + 1.5 + hasard() * 4, z1 - m, true);
	}
}

function arbre(t, x, z) {
	const h = 1.2 + hasard() * 0.8;
	const r = 0.45 + hasard() * 0.25;
	trait(t, x, 0, z, x, 0.4, z);
	for (let k = 0; k < 5; k++) {
		const a = k / 5 * Math.PI * 2;
		const b = (k + 1) / 5 * Math.PI * 2;
		trait(t, x + Math.cos(a) * r, 0.4, z + Math.sin(a) * r, x, 0.4 + h, z);
		trait(t, x + Math.cos(a) * r, 0.4, z + Math.sin(a) * r, x + Math.cos(b) * r, 0.4, z + Math.sin(b) * r);
	}
}

const cheminees = [];
let toitCentrale = null;
let porteDepot = null;
const etiquettes = [];

function etiquette(texte, x, y, z) {
	const el = document.createElement("div");
	el.className = "etiquette";
	el.textContent = texte;
	document.getElementById("etiquettes").appendChild(el);
	const e = { el: el, x: x, y: y, z: z, texte: texte };
	etiquettes.push(e);
	return e;
}

for (let i = 0; i < N; i++) {
	for (let j = 0; j < N; j++) {
		const b = interieur(i, j);
		const type = types[i][j];

		if (type === "immeubles") {
			const coupe = hasard();
			if (coupe < 0.22) {
				immeuble(b.x0, b.z0, b.x1, b.z1);
			} else if (coupe < 0.47) {
				const m = lerp(b.x0, b.x1, 0.35 + hasard() * 0.3);
				immeuble(b.x0, b.z0, m - 0.3, b.z1);
				immeuble(m + 0.3, b.z0, b.x1, b.z1);
			} else if (coupe < 0.72) {
				const m = lerp(b.z0, b.z1, 0.35 + hasard() * 0.3);
				immeuble(b.x0, b.z0, b.x1, m - 0.3);
				immeuble(b.x0, m + 0.3, b.x1, b.z1);
			} else {
				const mx = lerp(b.x0, b.x1, 0.4 + hasard() * 0.2);
				const mz = lerp(b.z0, b.z1, 0.4 + hasard() * 0.2);
				immeuble(b.x0, b.z0, mx - 0.3, mz - 0.3);
				immeuble(mx + 0.3, b.z0, b.x1, mz - 0.3);
				immeuble(b.x0, mz + 0.3, mx - 0.3, b.z1);
				immeuble(mx + 0.3, mz + 0.3, b.x1, b.z1);
			}
		}

		if (type === "parc") {
			const n = 8 + Math.floor(hasard() * 6);
			for (let k = 0; k < n; k++) arbre(traitsDetails, lerp(b.x0 + 0.6, b.x1 - 0.6, hasard()), lerp(b.z0 + 0.6, b.z1 - 0.6, hasard()));
		}

		if (type === "administration") {
			volume(b.x0, 0, b.z0, b.x1, 2.5, b.z1, true);
			volume(b.x0 + 1.4, 2.5, b.z0 + 1.4, b.x1 - 1.4, 27, b.z1 - 1.4, true);
			volume(b.x0 + 2.2, 27, b.z0 + 2.2, b.x1 - 2.2, 28.5, b.z1 - 2.2, false);
			const cx = (b.x0 + b.x1) / 2;
			const cz = (b.z0 + b.z1) / 2;
			trait(traitsDetails, cx, 28.5, cz, cx, 33, cz);
			etiquette("Municipal Administration", cx, 34, cz);
		}

		if (type === "centrale") {
			volume(b.x0, 0, b.z0, b.x0 + 3.4, 3.5, b.z1, false);
			toitCentrale = { x0: b.x0, x1: b.x0 + 3.4, z0: b.z0, z1: b.z1, y: 3.5 };
			for (let k = 0; k < 3; k++) {
				const cx = b.x1 - 1.3;
				const cz = lerp(b.z0 + 1.2, b.z1 - 1.2, k / 2);
				cheminees.push({ x: cx, z: cz, h: 12 });
				cercle(traitsDetails, cx, 0, cz, 0.85);
				cercle(traitsDetails, cx, 12, cz, 0.6);
				for (let a = 0; a < 4; a++) {
					const ang = a / 4 * Math.PI * 2 + 0.4;
					trait(traitsDetails, cx + Math.cos(ang) * 0.85, 0, cz + Math.sin(ang) * 0.85, cx + Math.cos(ang) * 0.6, 12, cz + Math.sin(ang) * 0.6);
				}
			}
		}

		if (type === "depot") {
			volume(b.x0, 0, b.z0, b.x1, 2.2, b.z0 + 3, false);
			for (let k = 0; k < 3; k++) {
				const x = lerp(b.x0 + 0.6, b.x1 - 2.2, k / 2);
				trait(traitsDetails, x, 0, b.z0 + 3.02, x, 1.6, b.z0 + 3.02);
				trait(traitsDetails, x + 1.5, 0, b.z0 + 3.02, x + 1.5, 1.6, b.z0 + 3.02);
				trait(traitsDetails, x, 1.6, b.z0 + 3.02, x + 1.5, 1.6, b.z0 + 3.02);
			}
			rectangle(traitsDetails, b.x0, b.z0 + 3.4, b.x1, b.z1);
			porteDepot = noeud(i, j + 1);
			etiquette("Maintenance Depot", (b.x0 + b.x1) / 2, 3.2, b.z0 + 1.5);
		}

		if (type === "poste") {
			// poste électrique : clôture et transformateurs
			rectangle(traitsDetails, b.x0, b.z0, b.x1, b.z1, 0);
			rectangle(traitsDetails, b.x0, b.z0, b.x1, b.z1, 1);
			for (let x = b.x0; x <= b.x1 + 0.01; x += (b.x1 - b.x0) / 6) {
				trait(traitsDetails, x, 0, b.z0, x, 1, b.z0);
				trait(traitsDetails, x, 0, b.z1, x, 1, b.z1);
			}
			for (let k = 0; k < 3; k++) {
				const x = lerp(b.x0 + 1.2, b.x1 - 2.4, k / 2);
				volume(x, 0, b.z0 + 2, x + 1.2, 1.8, b.z0 + 3.4, false);
			}
			trait(traitsDetails, b.x0 + 0.8, 0, b.z1 - 1.5, b.x0 + 0.8, 4, b.z1 - 1.5);
			trait(traitsDetails, b.x1 - 0.8, 0, b.z1 - 1.5, b.x1 - 0.8, 4, b.z1 - 1.5);
			trait(traitsDetails, b.x0 + 0.8, 4, b.z1 - 1.5, b.x1 - 0.8, 4, b.z1 - 1.5);
			const s = secteurDe((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2);
			postes[s].etiquette = etiquette("Sub " + postes[s].nom, (b.x0 + b.x1) / 2, 5, (b.z0 + b.z1) / 2);
		}
	}
}

const etiquetteCentrale = etiquette("Generating Station", toitCentrale.x1 + 1.5, 13.5, (toitCentrale.z0 + toitCentrale.z1) / 2);

// remplissage noir des volumes
const remplissage = new THREE.InstancedMesh(
	new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0.5, 0.5),
	new THREE.MeshBasicMaterial({ color: 0x000000, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
	volumes.length
);
{
	const m = new THREE.Matrix4();
	volumes.forEach((v, k) => {
		m.makeScale(v.x1 - v.x0, v.y1 - v.y0, v.z1 - v.z0).setPosition(v.x0, v.y0, v.z0);
		remplissage.setMatrixAt(k, m);
	});
}
scene.add(remplissage);
lignes(arretes, BLANC);
lignes(traitsDetails, 0xb8b8b8);

// fenêtres : un petit rectangle par fenêtre, allumé ou éteint
const maillageFenetres = new THREE.InstancedMesh(
	new THREE.PlaneGeometry(0.42, 0.55),
	new THREE.MeshBasicMaterial({ color: 0xffffff }),
	fenetres.length
);
{
	const o = new THREE.Object3D();
	const noir = new THREE.Color(0x0b0b0b);
	fenetres.forEach((f, k) => {
		o.position.set(f.x, f.y, f.z);
		o.rotation.set(0, f.face === "x" ? Math.PI / 2 : 0, 0);
		o.updateMatrix();
		maillageFenetres.setMatrixAt(k, o.matrix);
		maillageFenetres.setColorAt(k, noir);
	});
}
scene.add(maillageFenetres);


// ---------- le réseau électrique ----------
// centrale → poste A1, puis un arbre de lignes vers les 9 postes.
// Couper une ligne prive de courant tous les postes en aval.
const ARBRE = [[0, 0, 1, 0], [1, 0, 2, 0], [0, 0, 0, 1], [0, 1, 0, 2], [1, 0, 1, 1], [1, 1, 1, 2], [2, 0, 2, 1], [2, 1, 2, 2]];
const traitsPylones = [];

function pointsCable(pylones) {
	const points = [];
	for (let p = 0; p < pylones.length - 1; p++) {
		const A = pylones[p];
		const B = pylones[p + 1];
		const portee = Math.hypot(B.x - A.x, B.y - A.y, B.z - A.z);
		for (let k = 0; k < 10; k++) {
			const u = k / 10;
			points.push(new THREE.Vector3(lerp(A.x, B.x, u), lerp(A.y, B.y, u) - Math.sin(u * Math.PI) * portee * 0.06, lerp(A.z, B.z, u)));
		}
	}
	const D = pylones[pylones.length - 1];
	points.push(new THREE.Vector3(D.x, D.y, D.z));
	const cumul = [0];
	for (let k = 1; k < points.length; k++) cumul.push(cumul[k - 1] + points[k].distanceTo(points[k - 1]));
	return { points: points, cumul: cumul, total: cumul[cumul.length - 1] };
}

function pointCable(c, s) {
	s = borner(s, 0, c.total);
	let k = 0;
	while (k < c.cumul.length - 2 && c.cumul[k + 1] < s) k++;
	const u = (s - c.cumul[k]) / Math.max(1e-6, c.cumul[k + 1] - c.cumul[k]);
	return c.points[k].clone().lerp(c.points[k + 1], u);
}

const cables = ARBRE.map(([psx, psz, csx, csz], k) => {
	const parent = psx * 3 + psz;
	const enfant = csx * 3 + csz;
	const horizontale = psz === csz;
	const A = noeuds[postes[parent].noeud];
	const B = noeuds[postes[enfant].noeud];
	const dec = RUE / 2 + 0.35;
	const pylones = [];
	for (let p = 0; p <= 3; p++) {
		const x = lerp(A.x, B.x, p / 3) + (horizontale ? 0 : dec);
		const z = lerp(A.z, B.z, p / 3) + (horizontale ? dec : 0);
		pylones.push({ x: x, y: HAUTEUR_CABLE, z: z });
		// pylône : mât, traverse, deux haubans
		const tx = horizontale ? 0 : 0.7;
		const tz = horizontale ? 0.7 : 0;
		trait(traitsPylones, x, 0, z, x, HAUTEUR_CABLE + 0.6, z);
		trait(traitsPylones, x - tx, HAUTEUR_CABLE, z - tz, x + tx, HAUTEUR_CABLE, z + tz);
		trait(traitsPylones, x, HAUTEUR_CABLE - 0.9, z, x - tx, HAUTEUR_CABLE, z - tz);
		trait(traitsPylones, x, HAUTEUR_CABLE - 0.9, z, x + tx, HAUTEUR_CABLE, z + tz);
	}
	const c = pointsCable(pylones);
	c.index = k;
	c.nom = "L-" + deux(k + 1);
	c.parent = parent;
	c.enfant = enfant;
	c.horizontale = horizontale;
	c.objet = lignes([], 0xcfcfcf);
	c.signature = null;
	return c;
});
lignes(traitsPylones, 0x9a9a9a);

// les postes en aval de chaque ligne
function aval(secteur) {
	let liste = [secteur];
	for (const c of cables) if (c.parent === secteur) liste = liste.concat(aval(c.enfant));
	return liste;
}
for (const c of cables) c.aval = aval(c.enfant);

// ligne protégée : de la centrale au poste A1 (on ne peut pas la couper)
const departCentrale = { x: toitCentrale.x1 - 0.5, y: toitCentrale.y, z: (toitCentrale.z0 + toitCentrale.z1) / 2 };
const arriveeA1 = { x: noeuds[postes[0].noeud].x + RUE / 2 + 0.35, y: HAUTEUR_CABLE, z: noeuds[postes[0].noeud].z + RUE / 2 + 0.35 };
const alimentation = pointsCable([departCentrale, { x: arriveeA1.x - 2, y: HAUTEUR_CABLE + 1, z: arriveeA1.z - 2 }, arriveeA1]);
{
	const t = [];
	for (let k = 0; k < alimentation.points.length - 1; k++) {
		const p = alimentation.points[k];
		const q = alimentation.points[k + 1];
		trait(t, p.x, p.y, p.z, q.x, q.y, q.z);
	}
	trait(t, arriveeA1.x, 0, arriveeA1.z, arriveeA1.x, HAUTEUR_CABLE + 0.6, arriveeA1.z);
	lignes(t, 0xcfcfcf);
}

// impulsions de courant qui circulent sur les lignes alimentées
const IMPULSIONS = 5;
const impulsions = new THREE.Points(
	new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array((cables.length + 1) * IMPULSIONS * 3), 3)),
	new THREE.PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: false })
);
scene.add(impulsions);

// fumée de la centrale : des anneaux qui montent
const fumee = lignes([], 0x8a8a8a);


// ---------- voitures ----------
const voitures = [];
for (let k = 0; k < NB_VOITURES; k++) {
	const r = rues[Math.floor(hasard() * rues.length)];
	const sens = hasard() < 0.5;
	voitures.push({ a: sens ? r.a : r.b, b: sens ? r.b : r.a, rue: r.index, t: hasard(), attente: 0, coincee: 0, vitesse: 0.8 + hasard() * 0.4 });
}
const maillageVoitures = new THREE.InstancedMesh(
	new THREE.BoxGeometry(0.9, 0.38, 0.48).translate(0, 0.19, 0),
	new THREE.MeshBasicMaterial({ color: 0xf2f2f2 }),
	NB_VOITURES
);
scene.add(maillageVoitures);


// ---------- équipes de maintenance ----------
// chemin le plus court sur les rues, du dépôt à un carrefour (le même pour tout le monde)
const chemins = new Map();
function chemin(depart, arrivee) {
	const cle = depart + ">" + arrivee;
	if (chemins.has(cle)) return chemins.get(cle);
	const precedent = new Map([[depart, -1]]);
	const file = [depart];
	while (file.length) {
		const n = file.shift();
		if (n === arrivee) break;
		for (const v of noeuds[n].voisins) {
			if (!precedent.has(v.autre)) {
				precedent.set(v.autre, n);
				file.push(v.autre);
			}
		}
	}
	const liste = [];
	for (let n = arrivee; n !== -1; n = precedent.get(n)) liste.unshift(n);
	chemins.set(cle, liste);
	return liste;
}

function noeudProche(x, z) {
	const i = borner(Math.round((x + DEMI) / ILOT), 0, N);
	const j = borner(Math.round((z + DEMI) / ILOT), 0, N);
	return noeud(i, j);
}

// on ramène un point sur l'axe de la rue la plus proche
function surLaRue(x, z) {
	const gx = X(Math.round((x + DEMI) / ILOT));
	const gz = X(Math.round((z + DEMI) / ILOT));
	return Math.abs(x - gx) < Math.abs(z - gz) ? { x: gx, z: z } : { x: x, z: gz };
}

function trajet(x, z) {
	const p = surLaRue(x, z);
	const points = chemin(porteDepot, noeudProche(p.x, p.z)).map(n => ({ x: noeuds[n].x, z: noeuds[n].z }));
	points.push(p);
	const cumul = [0];
	for (let k = 1; k < points.length; k++) cumul.push(cumul[k - 1] + Math.hypot(points[k].x - points[k - 1].x, points[k].z - points[k - 1].z));
	return { points: points, cumul: cumul, total: cumul[cumul.length - 1] };
}

function surTrajet(tr, s) {
	s = borner(s, 0, tr.total);
	let k = 0;
	while (k < tr.cumul.length - 2 && tr.cumul[k + 1] < s) k++;
	const A = tr.points[k];
	const B = tr.points[Math.min(k + 1, tr.points.length - 1)];
	const u = (s - tr.cumul[k]) / Math.max(1e-6, tr.cumul[k + 1] - tr.cumul[k]);
	return { x: lerp(A.x, B.x, u), z: lerp(A.z, B.z, u), angle: Math.atan2(-(B.z - A.z), B.x - A.x) };
}

const camionnettes = [];
function camionnette(k) {
	while (camionnettes.length <= k) {
		const g = new THREE.Group();
		const t = [];
		boite(t, -0.6, 0, -0.32, 0.6, 0.7, 0.32);
		trait(t, 0.25, 0, -0.32, 0.25, 0.7, -0.32);
		trait(t, 0.25, 0, 0.32, 0.25, 0.7, 0.32);
		const corps = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(t, 3)), new THREE.LineBasicMaterial({ color: 0xffffff }));
		const fond = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.64).translate(0, 0.35, 0), new THREE.MeshBasicMaterial({ color: 0x000000, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
		const gyrophare = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.22).translate(0, 0.8, 0), new THREE.MeshBasicMaterial({ color: ALERTE }));
		g.add(fond, corps, gyrophare);
		g.userData.gyrophare = gyrophare;
		scene.add(g);
		camionnettes.push(g);
	}
	return camionnettes[k];
}


// ---------- état partagé ----------
const incidentsRef = base.ref(RACINE + "/incidents");
const appuisRef = base.ref(RACINE + "/centrale");
const verrouRef = base.ref(RACINE + "/verrou");
const operateursRef = base.ref(RACINE + "/operateurs");

const incidents = new Map();
let listeIncidents = [];

function trier() {
	listeIncidents = [...incidents.values()].sort((a, b) => a.debut - b.debut);
	listeIncidents.forEach((inc, k) => inc.numero = k + 1);
}

incidentsRef.limitToLast(400).on("child_added", s => {
	const d = s.val();
	if (!d || !d.type || typeof d.debut !== "number" || typeof d.fin !== "number") return;
	d.cle = s.key;
	incidents.set(s.key, d);
	trier();
});
incidentsRef.on("child_removed", s => {
	incidents.delete(s.key);
	trier();
});

// les rues traversées par un mur (calculé une seule fois)
function croisement(ax, az, bx, bz, cx, cz, dx, dz) {
	const rx = bx - ax, rz = bz - az, sx = dx - cx, sz = dz - cz;
	const den = rx * sz - rz * sx;
	if (Math.abs(den) < 1e-9) return null;
	const s = ((cx - ax) * sz - (cz - az) * sx) / den;
	const u = ((cx - ax) * rz - (cz - az) * rx) / den;
	return s >= 0 && s <= 1 && u >= 0 && u <= 1 ? u : null;
}

function ruesDuMur(inc) {
	if (inc._rues) return inc._rues;
	const p = inc.points || [];
	const touchees = new Map();
	for (const r of rues) {
		const A = noeuds[r.a];
		const B = noeuds[r.b];
		for (let k = 0; k + 3 < p.length; k += 2) {
			const u = croisement(p[k], p[k + 1], p[k + 2], p[k + 3], A.x, A.z, B.x, B.z);
			if (u !== null && !touchees.has(r.index)) touchees.set(r.index, u);
		}
		// un mur posé dans la longueur de la rue la bloque aussi
		for (let k = 0; k + 1 < p.length; k += 2) {
			const d = r.horizontale ? Math.abs(p[k + 1] - A.z) : Math.abs(p[k] - A.x);
			const u = r.horizontale ? (p[k] - A.x) / ILOT : (p[k + 1] - A.z) / ILOT;
			if (d < RUE / 2 && u > 0.1 && u < 0.9 && !touchees.has(r.index)) touchees.set(r.index, u);
		}
	}
	inc._rues = [...touchees.entries()];
	return inc._rues;
}

let etat = null;
function calculerEtat(t) {
	const e = { centrale: true, coupes: new Map(), bloquees: new Map(), alimentes: [], actifs: [], terminees: 0, signature: "" };
	const cles = [];
	for (const inc of listeIncidents) {
		if (t < inc.debut) continue;
		if (t >= inc.fin) {
			e.terminees++;
			continue;
		}
		e.actifs.push(inc);
		cles.push(inc.cle);
		if (inc.type === "centrale") e.centrale = false;
		if (inc.type === "cable") e.coupes.set(inc.cible, inc);
		if (inc.type === "route") e.bloquees.set(inc.cible, { u: inc.u, inc: inc });
		if (inc.type === "chantier") {
			for (const [r, u] of ruesDuMur(inc)) if (!e.bloquees.has(r)) e.bloquees.set(r, { u: u, inc: inc });
		}
	}
	e.alimentes[0] = e.centrale;
	for (const c of cables) e.alimentes[c.enfant] = e.alimentes[c.parent] && !e.coupes.has(c.index);
	e.signature = cles.join(",") + "|" + e.terminees + "|" + incidents.size;
	return e;
}


// ---------- opérateurs (présence et curseurs) ----------
function identifiant() {
	let id = null;
	try {
		id = sessionStorage.getItem("operateur");
	} catch (e) {}
	if (!id) {
		id = "OP-" + Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, "0");
		try {
			sessionStorage.setItem("operateur", id);
		} catch (e) {}
	}
	return id;
}
const moi = identifiant();
const maPresence = operateursRef.child(moi);
maPresence.onDisconnect().remove();
maPresence.set({ x: 0, z: 0, t: firebase.database.ServerValue.TIMESTAMP });

let autres = {};
operateursRef.on("value", s => autres = s.val() || {});

const curseurs = new Map();
function dessinerCurseurs() {
	const vus = new Set();
	for (const [id, o] of Object.entries(autres)) {
		if (id === moi || typeof o.x !== "number") continue;
		vus.add(id);
		let c = curseurs.get(id);
		if (!c) {
			const el = document.createElement("div");
			el.className = "curseur";
			el.innerHTML = "<span></span>";
			el.querySelector("span").textContent = id;
			document.getElementById("curseurs").appendChild(el);
			c = { el: el, x: o.x, z: o.z };
			curseurs.set(id, c);
		}
		c.x = lerp(c.x, o.x, 0.2);
		c.z = lerp(c.z, o.z, 0.2);
		const p = versEcran(c.x, 0, c.z);
		c.el.style.left = p.x + "px";
		c.el.style.top = p.y + "px";
	}
	for (const [id, c] of curseurs) {
		if (!vus.has(id)) {
			c.el.remove();
			curseurs.delete(id);
		}
	}
}

let dernierEnvoi = 0;
function envoyerPosition(g) {
	const t = performance.now();
	if (t - dernierEnvoi < 120) return;
	dernierEnvoi = t;
	maPresence.update({ x: Math.round(g.x * 10) / 10, z: Math.round(g.z * 10) / 10 });
}


// ---------- l'action collective sur la centrale ----------
let appuis = {};
appuisRef.on("value", s => {
	appuis = s.val() || {};
	verifierCentrale();
});

function appuisRecents(t) {
	return Object.entries(appuis).filter(([id, v]) => typeof v === "number" && t - v < FENETRE_CENTRALE * 1000).map(([id]) => id);
}

function verifierCentrale() {
	const t = maintenant();
	const recents = appuisRecents(t);
	if (recents.length < OPERATEURS_CENTRALE || !recents.includes(moi)) return;
	// un seul navigateur gagne le droit d'éteindre la centrale
	verrouRef.transaction(fin => {
		if (fin && fin > t) return;
		return t + DUREE_CENTRALE * 1000;
	}, (erreur, ok, s) => {
		if (erreur || !ok) return;
		// la clé dépend de l'heure de fin : deux navigateurs écrivent la même entrée, pas deux
		incidentsRef.child("centrale-" + s.val()).set({ type: "centrale", debut: s.val() - DUREE_CENTRALE * 1000, fin: s.val(), operateurs: recents.sort() });
		appuisRef.remove();
	});
}


// ---------- les outils de l'opérateur ----------
let outil = "observer";
let derniereAction = -Infinity;
let survol = null;
let trace = null;
const souris = { x: -1, y: -1, dedans: false };

function choisirOutil(o) {
	outil = o;
	trace = null;
	document.querySelectorAll("[data-outil]").forEach(b => b.classList.toggle("actif", b.dataset.outil === o));
	canvas.className = o;
	mettreAJourSurvol();
}
document.querySelectorAll("[data-outil]").forEach(b => b.addEventListener("click", () => choisirOutil(b.dataset.outil)));

function recharge() {
	return Math.max(0, RECHARGE - (maintenant() - derniereAction) / 1000);
}

const rayon = new THREE.Raycaster();
const planSol = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function auSol(mx, my) {
	rayon.setFromCamera(new THREE.Vector2(mx / window.innerWidth * 2 - 1, -(my / window.innerHeight) * 2 + 1), camera);
	const p = new THREE.Vector3();
	return rayon.ray.intersectPlane(planSol, p) ? p : null;
}

const v3 = new THREE.Vector3();
function versEcran(x, y, z) {
	v3.set(x, y, z).project(camera);
	return { x: (v3.x + 1) / 2 * window.innerWidth, y: (1 - v3.y) / 2 * window.innerHeight };
}

// la ligne électrique sous la souris (mesurée à l'écran)
function cableSous(mx, my) {
	let meilleur = null;
	for (const c of cables) {
		let p = versEcran(c.points[0].x, c.points[0].y, c.points[0].z);
		for (let k = 1; k < c.points.length; k++) {
			const q = versEcran(c.points[k].x, c.points[k].y, c.points[k].z);
			const dx = q.x - p.x, dy = q.y - p.y;
			const u = borner(((mx - p.x) * dx + (my - p.y) * dy) / Math.max(1e-6, dx * dx + dy * dy), 0, 1);
			const d = Math.hypot(p.x + dx * u - mx, p.y + dy * u - my);
			if (d < 12 && (!meilleur || d < meilleur.d)) meilleur = { cable: c.index, s: lerp(c.cumul[k - 1], c.cumul[k], u), d: d };
			p = q;
		}
	}
	return meilleur;
}

// le tronçon de rue sous un point du sol
function rueSous(g) {
	if (!g || Math.abs(g.x) > DEMI + RUE || Math.abs(g.z) > DEMI + RUE) return null;
	let meilleur = null;
	const i = Math.round((g.x + DEMI) / ILOT);
	const j = Math.round((g.z + DEMI) / ILOT);
	const dx = Math.abs(g.x - X(i));
	const dz = Math.abs(g.z - X(j));
	if (dx < RUE / 2 + 0.5 && i >= 0 && i <= N) {
		const jj = borner(Math.floor((g.z + DEMI) / ILOT), 0, N - 1);
		meilleur = { rue: rues.find(r => !r.horizontale && r.a === noeud(i, jj)).index, u: (g.z - X(jj)) / ILOT, d: dx };
	}
	if (dz < RUE / 2 + 0.5 && j >= 0 && j <= N && (!meilleur || dz < meilleur.d)) {
		const ii = borner(Math.floor((g.x + DEMI) / ILOT), 0, N - 1);
		meilleur = { rue: rues.find(r => r.horizontale && r.a === noeud(ii, j)).index, u: (g.x - X(ii)) / ILOT, d: dz };
	}
	if (meilleur) meilleur.u = borner(meilleur.u, 0.25, 0.75);
	return meilleur;
}

function surCentrale(g) {
	const b = interieur(0, 0, 0);
	return g && g.x > b.x0 - 0.5 && g.x < b.x1 + 0.5 && g.z > b.z0 - 0.5 && g.z < b.z1 + 0.5;
}

function mettreAJourSurvol() {
	survol = null;
	if (!souris.dedans || !etat) return;
	const g = auSol(souris.x, souris.y);
	if (outil === "couper") {
		if (surCentrale(g)) survol = { type: "centrale" };
		else {
			const c = cableSous(souris.x, souris.y);
			if (c) survol = { type: "cable", cable: c.cable, s: c.s };
		}
	}
	if (outil === "bloquer") {
		const r = rueSous(g);
		if (r) survol = { type: "route", rue: r.rue, u: r.u };
	}
}

function agir() {
	if (!survol || !etat) return;
	const t = maintenant();
	if (recharge() > 0) return;

	if (survol.type === "centrale") {
		if (!etat.centrale) return;
		appuisRef.child(moi).set(t);
		derniereAction = t;
		return;
	}

	if (survol.type === "cable") {
		if (etat.coupes.has(survol.cable)) return;
		const p = pointCable(cables[survol.cable], survol.s);
		const duree = Math.max(DUREE_CABLE, trajet(p.x, p.z).total / VITESSE_EQUIPE + 15);
		incidentsRef.push({ type: "cable", cible: survol.cable, s: Math.round(survol.s * 100) / 100, x: p.x, z: p.z, debut: t, fin: t + duree * 1000, operateur: moi });
		derniereAction = t;
	}

	if (survol.type === "route") {
		if (etat.bloquees.has(survol.rue)) return;
		const r = rues[survol.rue];
		const A = noeuds[r.a];
		const B = noeuds[r.b];
		const x = lerp(A.x, B.x, survol.u);
		const z = lerp(A.z, B.z, survol.u);
		const duree = Math.max(DUREE_ROUTE, trajet(x, z).total / VITESSE_EQUIPE + 15);
		incidentsRef.push({ type: "route", cible: survol.rue, u: Math.round(survol.u * 100) / 100, x: x, z: z, debut: t, fin: t + duree * 1000, operateur: moi });
		derniereAction = t;
	}
}

function longueurTrace(p) {
	let l = 0;
	for (let k = 1; k < p.length; k++) l += Math.hypot(p[k].x - p[k - 1].x, p[k].z - p[k - 1].z);
	return l;
}

function construire() {
	const p = trace;
	trace = null;
	remplacer(apercu, []);
	if (!p || p.length < 2 || longueurTrace(p) < 2 || recharge() > 0) return;
	const t = maintenant();
	const points = [];
	for (const q of p) points.push(Math.round(q.x * 100) / 100, Math.round(q.z * 100) / 100);
	incidentsRef.push({ type: "chantier", points: points, debut: t, fin: t + DUREE_CHANTIER * 1000, operateur: moi });
	derniereAction = t;
}

const apercu = lignes([], 0xffffff);


// ---------- souris, doigt, clavier ----------
let glisse = null;

canvas.addEventListener("pointerdown", e => {
	canvas.setPointerCapture(e.pointerId);
	souris.x = e.clientX;
	souris.y = e.clientY;
	souris.dedans = true;
	const g = auSol(e.clientX, e.clientY);
	if (e.button === 2 || e.button === 1 || outil === "observer") {
		if (g) glisse = g;
		return;
	}
	if (outil === "construire") {
		if (g && recharge() === 0) trace = [g];
		return;
	}
	mettreAJourSurvol();
	agir();
});

canvas.addEventListener("pointermove", e => {
	souris.x = e.clientX;
	souris.y = e.clientY;
	souris.dedans = true;
	const g = auSol(e.clientX, e.clientY);
	if (glisse && g) {
		// on déplace la caméra pour que le point attrapé reste sous le doigt
		cible.sub(g.clone().sub(glisse));
		cible.x = borner(cible.x, -DEMI, DEMI);
		cible.z = borner(cible.z, -DEMI, DEMI);
		placerCamera();
		camera.updateMatrixWorld();
		return;
	}
	if (g) envoyerPosition(g);
	if (trace && g) {
		const dernier = trace[trace.length - 1];
		const d = Math.hypot(g.x - dernier.x, g.z - dernier.z);
		if (d > 0.8 && longueurTrace(trace) + d <= LONGUEUR_MUR) {
			trace.push(g);
			const t = [];
			for (let k = 1; k < trace.length; k++) trait(t, trace[k - 1].x, 0.05, trace[k - 1].z, trace[k].x, 0.05, trace[k].z);
			remplacer(apercu, t);
		}
	}
	mettreAJourSurvol();
});

canvas.addEventListener("pointerup", () => {
	glisse = null;
	if (trace) construire();
});

canvas.addEventListener("pointerleave", () => {
	souris.dedans = false;
	survol = null;
});

canvas.addEventListener("contextmenu", e => e.preventDefault());

function zoomer(f) {
	camera.zoom = borner(camera.zoom * f, 0.7, 5);
	camera.updateProjectionMatrix();
}
canvas.addEventListener("wheel", e => {
	e.preventDefault();
	zoomer(Math.exp(-e.deltaY * 0.0015));
}, { passive: false });
document.getElementById("zoom-plus").addEventListener("click", () => zoomer(1.25));
document.getElementById("zoom-moins").addEventListener("click", () => zoomer(0.8));

window.addEventListener("keydown", e => {
	const o = { "1": "observer", "2": "couper", "3": "bloquer", "4": "construire" }[e.key];
	if (o) choisirOutil(o);
	if (e.key === "Escape") choisirOutil("observer");
	if (e.key === "+" || e.key === "=") zoomer(1.25);
	if (e.key === "-") zoomer(0.8);
});


// ---------- dessin de l'état : lignes, barrières, murs, cicatrices ----------
const barrieres = lignes([], ALERTE);
const etincelles = lignes([], ALERTE);
const cicatrices = lignes([], 0x6a6a6a);
const surbrillance = lignes([], 0xffffff);
const murs = new Map();
let signatureDessinee = null;

function morceau(pos, c, sDebut, sFin) {
	for (let k = 0; k < c.points.length - 1; k++) {
		const a = Math.max(c.cumul[k], sDebut);
		const b = Math.min(c.cumul[k + 1], sFin);
		if (b > a) {
			const p = pointCable(c, a);
			const q = pointCable(c, b);
			trait(pos, p.x, p.y, p.z, q.x, q.y, q.z);
		}
	}
}

function dessinerCable(c, coupe) {
	const pos = [];
	if (!coupe) {
		morceau(pos, c, 0, c.total);
	} else {
		// la ligne coupée : deux bouts qui pendent
		const s = coupe.s;
		morceau(pos, c, 0, s - 0.4);
		morceau(pos, c, s + 0.4, c.total);
		const pA = pointCable(c, s - 0.4);
		const pB = pointCable(c, s + 0.4);
		trait(pos, pA.x, pA.y, pA.z, pA.x + (pB.x - pA.x) * 0.6, pA.y - 2.4, pA.z + (pB.z - pA.z) * 0.6);
		trait(pos, pB.x, pB.y, pB.z, pB.x + (pA.x - pB.x) * 0.6, pB.y - 1.9, pB.z + (pA.z - pB.z) * 0.6);
	}
	remplacer(c.objet, pos);
}

function barriere(pos, inc) {
	const r = rues[inc.cible];
	const A = noeuds[r.a];
	const B = noeuds[r.b];
	const x = lerp(A.x, B.x, inc.u);
	const z = lerp(A.z, B.z, inc.u);
	// en travers de la rue
	const px = r.horizontale ? 0 : 1;
	const pz = r.horizontale ? 1 : 0;
	const l = RUE / 2;
	for (const y of [0.45, 0.85]) trait(pos, x - px * l, y, z - pz * l, x + px * l, y, z + pz * l);
	trait(pos, x - px * l, 0, z - pz * l, x - px * l, 0.9, z - pz * l);
	trait(pos, x + px * l, 0, z + pz * l, x + px * l, 0.9, z + pz * l);
	for (let k = 0; k < 4; k++) {
		const a = -l + k * (2 * l / 4);
		const b = a + 2 * l / 4;
		trait(pos, x + px * a, 0.45, z + pz * a, x + px * b, 0.85, z + pz * b);
	}
}

function creerMur(inc) {
	const p = inc.points || [];
	const sommets = [];
	const pos = [];
	for (let k = 0; k + 3 < p.length; k += 2) {
		const ax = p[k], az = p[k + 1], bx = p[k + 2], bz = p[k + 3];
		sommets.push(ax, 0, az, bx, 0, bz, bx, 1, bz, ax, 0, az, bx, 1, bz, ax, 1, az);
		trait(pos, ax, 0, az, bx, 0, bz);
		trait(pos, ax, 1, az, bx, 1, bz);
		trait(pos, ax, 0, az, ax, 1, az);
	}
	if (p.length >= 2) trait(pos, p[p.length - 2], 0, p[p.length - 1], p[p.length - 2], 1, p[p.length - 1]);
	const g = new THREE.Group();
	const geo = new THREE.BufferGeometry();
	geo.setAttribute("position", new THREE.Float32BufferAttribute(sommets, 3));
	g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })));
	g.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)), new THREE.LineBasicMaterial({ color: 0xffffff })));
	g.scale.y = 0.001;
	scene.add(g);
	return g;
}

function dessinerEtat(t) {
	// les objets ne sont refaits que quand quelque chose change
	if (etat.signature !== signatureDessinee) {
		signatureDessinee = etat.signature;

		for (const c of cables) dessinerCable(c, etat.coupes.get(c.index));

		const pos = [];
		for (const inc of etat.actifs) if (inc.type === "route") barriere(pos, inc);
		remplacer(barrieres, pos);

		// cicatrices : tout ce qui a été réparé laisse une trace
		const cic = [];
		let pannes = 0;
		for (const inc of listeIncidents) {
			if (t < inc.fin) continue;
			if (inc.type === "cable" && cables[inc.cible]) {
				const p = pointCable(cables[inc.cible], inc.s);
				boite(cic, p.x - 0.18, p.y - 0.18, p.z - 0.18, p.x + 0.18, p.y + 0.18, p.z + 0.18);
			}
			if (inc.type === "route" && rues[inc.cible]) {
				const r = rues[inc.cible];
				const x = lerp(noeuds[r.a].x, noeuds[r.b].x, inc.u);
				const z = lerp(noeuds[r.a].z, noeuds[r.b].z, inc.u);
				const lx = r.horizontale ? 0.6 : RUE / 2;
				const lz = r.horizontale ? RUE / 2 : 0.6;
				rectangle(cic, x - lx, z - lz, x + lx, z + lz, 0.01);
				trait(cic, x - lx, 0.01, z - lz, x + lx, 0.01, z + lz);
			}
			if (inc.type === "chantier") {
				const p = inc.points || [];
				for (let k = 0; k + 3 < p.length; k += 2) {
					// fondations en pointillés
					const l = Math.hypot(p[k + 2] - p[k], p[k + 3] - p[k + 1]);
					for (let d = 0; d < l; d += 0.7) {
						const u0 = d / l;
						const u1 = Math.min(1, (d + 0.35) / l);
						trait(cic, lerp(p[k], p[k + 2], u0), 0.01, lerp(p[k + 1], p[k + 3], u0), lerp(p[k], p[k + 2], u1), 0.01, lerp(p[k + 1], p[k + 3], u1));
					}
				}
			}
			if (inc.type === "centrale") {
				// une encoche sur le toit de la centrale par panne générale
				const x = toitCentrale.x0 + 0.4 + (pannes % 10) * 0.28;
				const z = toitCentrale.z0 + 0.5 + Math.floor(pannes / 10) * 1.2;
				trait(cic, x, toitCentrale.y + 0.01, z, x, toitCentrale.y + 0.01, z + 0.9);
				pannes++;
			}
		}
		remplacer(cicatrices, cic);
	}

	// couleur des lignes : alimentée, sans courant, coupée, survolée
	for (const c of cables) {
		let couleur = etat.alimentes[c.enfant] ? 0xcfcfcf : 0x3c3c3c;
		if (etat.coupes.has(c.index)) couleur = ALERTE;
		if (survol && survol.type === "cable" && survol.cable === c.index) couleur = 0xffffff;
		c.objet.material.color.setHex(couleur);
	}

	// étincelles aux coupures
	const et = [];
	for (const inc of etat.coupes.values()) {
		const p = pointCable(cables[inc.cible], inc.s);
		for (let k = 0; k < 3; k++) {
			if (Math.random() < 0.5) continue;
			const a = Math.random() * Math.PI * 2;
			const r = 0.3 + Math.random() * 0.5;
			trait(et, p.x, p.y, p.z, p.x + Math.cos(a) * r, p.y + (Math.random() - 0.5) * r, p.z + Math.sin(a) * r);
		}
	}
	remplacer(etincelles, et);

	// murs : ils sortent de terre, puis sont démolis
	for (const inc of listeIncidents) {
		if (inc.type !== "chantier") continue;
		const vivant = t >= inc.debut && t < inc.fin;
		let g = murs.get(inc.cle);
		if (vivant && !g) {
			g = creerMur(inc);
			murs.set(inc.cle, g);
		}
		if (!vivant && g) {
			scene.remove(g);
			murs.delete(inc.cle);
			continue;
		}
		if (g) {
			const monte = borner((t - inc.debut) / 2500, 0, 1);
			const descend = borner((inc.fin - t) / 3000, 0, 1);
			g.scale.y = Math.max(0.001, Math.min(monte, descend) * HAUTEUR_MUR);
		}
	}
	for (const [cle, g] of murs) {
		if (!incidents.has(cle)) {
			scene.remove(g);
			murs.delete(cle);
		}
	}

	// surbrillance de ce qui est sous la souris
	const sb = [];
	if (survol && survol.type === "route") {
		const r = rues[survol.rue];
		const A = noeuds[r.a];
		const B = noeuds[r.b];
		const lx = r.horizontale ? 0 : RUE / 2;
		const lz = r.horizontale ? RUE / 2 : 0;
		rectangle(sb, Math.min(A.x, B.x) - lx + (r.horizontale ? RUE / 2 : 0), Math.min(A.z, B.z) - lz + (r.horizontale ? 0 : RUE / 2), Math.max(A.x, B.x) + lx - (r.horizontale ? RUE / 2 : 0), Math.max(A.z, B.z) + lz - (r.horizontale ? 0 : RUE / 2), 0.02);
	}
	if (survol && survol.type === "centrale") {
		const b = interieur(0, 0, 0);
		rectangle(sb, b.x0, b.z0, b.x1, b.z1, 0.02);
	}
	remplacer(surbrillance, sb);
}


// ---------- impulsions, fumée, fenêtres ----------
function dessinerImpulsions(t) {
	const pos = impulsions.geometry.attributes.position.array;
	let k = 0;
	const lignesAlimentees = [alimentation, ...cables];
	for (let l = 0; l < lignesAlimentees.length; l++) {
		const c = lignesAlimentees[l];
		const allume = l === 0 ? etat.centrale : etat.alimentes[c.enfant];
		for (let i = 0; i < IMPULSIONS; i++) {
			if (allume) {
				const p = pointCable(c, ((t / 1000 * 7 / c.total + i / IMPULSIONS) % 1) * c.total);
				pos[k++] = p.x; pos[k++] = p.y; pos[k++] = p.z;
			} else {
				pos[k++] = 0; pos[k++] = -100; pos[k++] = 0;
			}
		}
	}
	impulsions.geometry.attributes.position.needsUpdate = true;
}

function dessinerFumee(t) {
	const pos = [];
	if (etat.centrale) {
		for (const c of cheminees) {
			for (let k = 0; k < 4; k++) {
				const u = (t / 6000 + k / 4 + c.z * 0.13) % 1;
				cercle(pos, c.x + u * 1.5, c.h + 0.3 + u * 6, c.z - u * 0.6, 0.6 + u * 1.4, 12);
			}
		}
	}
	remplacer(fumee, pos);
}

let derniereFenetre = 0;
const couleurAllumee = new THREE.Color(0xdedede);
const couleurEteinte = new THREE.Color(0x0b0b0b);
function dessinerFenetres(t) {
	if (t - derniereFenetre < 500) return;
	derniereFenetre = t;
	const n = nuit(horloge(t).h);
	const proba = 0.14 + n * 0.46;
	for (let k = 0; k < fenetres.length; k++) {
		const f = fenetres[k];
		// chaque fenêtre change d'état à son propre rythme, pareil chez tout le monde
		const phase = Math.floor(t / 1000 / 45 + bruit(k, 7));
		const allumee = etat.alimentes[f.secteur] && bruit(k, phase) < proba;
		maillageFenetres.setColorAt(k, allumee ? couleurAllumee : couleurEteinte);
	}
	maillageFenetres.instanceColor.needsUpdate = true;
}


// ---------- circulation ----------
const objet = new THREE.Object3D();
let mobilite = 1;

function barriereDevant(v) {
	const b = etat.bloquees.get(v.rue);
	if (!b) return null;
	return v.a === rues[v.rue].a ? b.u : 1 - b.u;
}

function demiTour(v) {
	const a = v.a;
	v.a = v.b;
	v.b = a;
	v.t = 1 - v.t;
	v.attente = 0;
}

function garer(v) {
	for (let essai = 0; essai < 20; essai++) {
		const r = rues[Math.floor(Math.random() * rues.length)];
		if (etat.bloquees.has(r.index)) continue;
		const sens = Math.random() < 0.5;
		const a = sens ? r.a : r.b;
		const b = sens ? r.b : r.a;
		if (voitures.some(w => w.a === a && w.b === b && w.t < 0.5)) continue;
		v.a = a;
		v.b = b;
		v.rue = r.index;
		v.t = 0.05;
		v.coincee = 0;
		v.attente = 0;
		return;
	}
}

// chaque carrefour a son propre décalage : les feux ne changent pas tous en même temps
function feuRouge(v, t) {
	const vert = Math.floor((t + bruit(v.b, 11) * 12000) / 6000) % 2 === 0;
	return rues[v.rue].horizontale !== vert;
}

function rouler(dt, t) {
	const files = new Map();
	for (const v of voitures) {
		const cle = v.a * 1000 + v.b;
		if (!files.has(cle)) files.set(cle, []);
		files.get(cle).push(v);
	}
	let reel = 0;
	let possible = 0;

	for (const [cle, file] of files) {
		file.sort((p, q) => q.t - p.t);
		let devant = Infinity;
		for (const v of file) {
			const alimente = etat.alimentes[noeuds[v.b].secteur];
			const facteur = alimente ? 1 : 0.35;      // sans feux, tout le monde avance au pas
			const nominal = VITESSE_VOITURE * v.vitesse * dt / ILOT;
			let limite = devant - ECART;
			const bar = barriereDevant(v);
			if (bar !== null && v.t < bar) limite = Math.min(limite, bar - 0.07);
			const rouge = alimente && feuRouge(v, t) && v.t <= 0.88;
			if (rouge) limite = Math.min(limite, 0.88);
			const avant = v.t;
			v.t = Math.max(v.t, Math.min(v.t + nominal * facteur, limite));
			// attendre au feu rouge, c'est normal : ça ne compte pas comme une perte de mobilité
			if (!(rouge && v.t >= 0.879)) {
				reel += v.t - avant;
				possible += nominal;
			}
			v.coincee = v.t > avant ? 0 : v.coincee + dt;

			// bloqué devant une barrière : on attend un peu, puis demi-tour
			if (bar !== null && avant < bar && v.t >= bar - 0.075) {
				v.attente += dt;
				if (v.attente > 1.5) demiTour(v);
			}

			// arrivée au carrefour : on choisit une autre rue, ouverte
			if (v.t >= 1) {
				const options = noeuds[v.b].voisins.filter(o => o.rue !== v.rue && !etat.bloquees.has(o.rue));
				// on préfère une rue dont l'entrée est libre
				const libres = options.filter(o => !(files.get(v.b * 1000 + o.autre) || []).some(w => w.t < ECART));
				if (options.length === 0) {
					demiTour(v);
					v.t = 0;
				} else {
					const choix = libres.length ? libres : options;
					const o = choix[Math.floor(Math.random() * choix.length)];
					const entree = files.get(v.b * 1000 + o.autre);
					if (entree && entree.some(w => w !== v && w.t < ECART)) {
						v.t = 1;
					} else {
						v.a = v.b;
						v.b = o.autre;
						v.rue = o.rue;
						v.t = 0;
						v.attente = 0;
					}
				}
			}
			// coincée trop longtemps (embouteillage en boucle) : elle se gare et repart ailleurs
			if (v.coincee > 10 && !(bar !== null && v.t < bar)) garer(v);
			devant = v.a * 1000 + v.b === cle ? v.t : Infinity;
		}
	}
	if (possible > 0) mobilite = lerp(mobilite, reel / possible, Math.min(1, dt * 0.4));

	voitures.forEach((v, k) => {
		const A = noeuds[v.a];
		const B = noeuds[v.b];
		const dx = (B.x - A.x) / ILOT;
		const dz = (B.z - A.z) / ILOT;
		// on roule à droite
		objet.position.set(lerp(A.x, B.x, v.t) - dz * 0.6, 0, lerp(A.z, B.z, v.t) + dx * 0.6);
		objet.rotation.set(0, Math.atan2(-dz, dx), 0);
		objet.updateMatrix();
		maillageVoitures.setMatrixAt(k, objet.matrix);
	});
	maillageVoitures.instanceMatrix.needsUpdate = true;
}

function dessinerEquipes(t) {
	let k = 0;
	for (const inc of listeIncidents) {
		if (inc.type !== "cable" && inc.type !== "route") continue;
		if (t < inc.debut) continue;
		if (!inc._trajet) inc._trajet = trajet(inc.x, inc.z);
		const tr = inc._trajet;
		let p = null;
		let travail = false;
		if (t < inc.fin) {
			const s = (t - inc.debut) / 1000 * VITESSE_EQUIPE;
			p = surTrajet(tr, s);
			travail = s >= tr.total;
		} else {
			// retour au dépôt
			const s = (t - inc.fin) / 1000 * VITESSE_EQUIPE;
			if (s < tr.total) {
				p = surTrajet(tr, tr.total - s);
				p.angle += Math.PI;
			}
		}
		if (!p) continue;
		const g = camionnette(k++);
		g.visible = true;
		g.position.set(p.x, 0, p.z);
		g.rotation.y = p.angle;
		g.userData.gyrophare.visible = Math.floor(t / 250) % 2 === 0 || !travail;
	}
	for (; k < camionnettes.length; k++) camionnettes[k].visible = false;
}


// ---------- textes : en-tête, indicateurs, journal, étiquettes ----------
const NOTICES = [
	"Routine inspection · sector {s} · nominal",
	"Traffic flow within expected parameters",
	"Citizens are reminded that every disruption is recorded",
	"Grid load {n}% · no action required",
	"Street lighting schedule updated",
	"Maintenance crews on standby",
	"Operator activity logged",
	"Structural survey · sector {s} · compliant"
];

function notice(tk) {
	const r = bruit(tk / 45000, 3);
	return NOTICES[Math.floor(r * NOTICES.length)]
		.replace("{s}", postes[Math.floor(bruit(tk / 45000, 5) * 9)].nom)
		.replace("{n}", 60 + Math.floor(bruit(tk / 45000, 9) * 30));
}

function numero(inc) {
	return "INC-" + String(inc.numero).padStart(4, "0");
}

function duree(ms) {
	const s = Math.round(ms / 1000);
	return Math.floor(s / 60) + ":" + deux(s % 60);
}

function messageDebut(inc) {
	const n = numero(inc);
	if (inc.type === "cable" && cables[inc.cible]) {
		const c = cables[inc.cible];
		return n + " Power line " + c.nom + " severed by " + inc.operateur + " · " + c.aval.map(s => postes[s].nom).join(" ") + " without supply · crew dispatched";
	}
	if (inc.type === "route" && rues[inc.cible]) return n + " " + rues[inc.cible].nom + " obstructed by " + inc.operateur + " · traffic diverted · crew dispatched";
	if (inc.type === "chantier") return n + " Unregistered structure erected by " + inc.operateur + " · " + ruesDuMur(inc).length + (ruesDuMur(inc).length === 1 ? " road segment" : " road segments") + " affected · demolition scheduled";
	if (inc.type === "centrale") return n + " Generating station offline · " + (inc.operateurs || []).length + " operators involved · city-wide outage";
	return n + " Unclassified event";
}

function messageFin(inc) {
	const n = numero(inc);
	const d = " · downtime " + duree(inc.fin - inc.debut);
	if (inc.type === "cable" && cables[inc.cible]) return n + " Power line " + cables[inc.cible].nom + " restored" + d;
	if (inc.type === "route") return n + " Road reopened" + d;
	if (inc.type === "chantier") return n + " Structure demolished · foundations remain";
	if (inc.type === "centrale") return n + " Generating station back online" + d;
	return n + " Closed";
}

let dernierTexte = 0;
function ecrire(t) {
	if (t - dernierTexte < 250) return;
	dernierTexte = t;

	const hor = horloge(t);
	document.getElementById("horloge").textContent = "Day " + String(hor.jour).padStart(3, "0") + " · " + hor.texte + (nuit(hor.h) > 0.5 ? " · night" : "");

	const energie = Math.round(etat.alimentes.filter(Boolean).length / 9 * 100);
	const mob = Math.round(borner(mobilite / MOBILITE_NORMALE, 0, 1) * 100);
	document.getElementById("barre-energie").style.width = energie + "%";
	document.getElementById("barre-energie").classList.toggle("bas", energie < 60);
	document.getElementById("val-energie").textContent = energie + "%";
	document.getElementById("barre-mobilite").style.width = mob + "%";
	document.getElementById("barre-mobilite").classList.toggle("bas", mob < 50);
	document.getElementById("val-mobilite").textContent = mob + "%";
	document.getElementById("val-incidents").textContent = etat.actifs.length + " active";
	document.getElementById("val-operateurs").textContent = Math.max(1, Object.keys(autres).length) + " online";

	// journal : incidents, réparations et avis de routine, du plus récent au plus ancien
	const entrees = [];
	for (const inc of listeIncidents) {
		if (inc.debut <= t) entrees.push({ t: inc.debut, texte: messageDebut(inc), alerte: true });
		if (inc.fin <= t) entrees.push({ t: inc.fin, texte: messageFin(inc), alerte: false });
	}
	for (let k = 0; k < 8; k++) {
		const tk = (Math.floor(t / 45000) - k) * 45000;
		entrees.push({ t: tk, texte: notice(tk), alerte: false });
	}
	entrees.sort((a, b) => b.t - a.t);
	const journal = document.getElementById("journal");
	journal.innerHTML = "";
	for (const e of entrees.slice(0, 9).reverse()) {
		const li = document.createElement("li");
		if (e.alerte) li.className = "alerte" + (t - e.t < 10000 ? " recent" : "");
		const time = document.createElement("time");
		time.textContent = horloge(e.t).texte;
		li.append(time, e.texte);
		journal.appendChild(li);
	}

	// statut de l'opérateur
	const r = recharge();
	const statut = document.getElementById("statut");
	statut.textContent = "Operator " + moi + (r > 0 ? " · authorisation in " + Math.ceil(r) + " s" : " · authorised");
	statut.classList.toggle("attente", r > 0);

	// étiquettes des postes et de la centrale
	for (let s = 0; s < 9; s++) {
		const e = postes[s].etiquette;
		e.el.textContent = "Sub " + postes[s].nom + (etat.alimentes[s] ? "" : " · no supply");
		e.el.classList.toggle("alerte", !etat.alimentes[s]);
	}
	const n = appuisRecents(t).length;
	etiquetteCentrale.el.textContent = "Generating Station" + (!etat.centrale ? " · offline" : n > 0 ? " · operators " + n + "/" + OPERATEURS_CENTRALE : "");
	etiquetteCentrale.el.classList.toggle("alerte", !etat.centrale || n > 0);

	ecrireInfo(t);
}

// info-bulle : ce qui est sous la souris
function ecrireInfo(t) {
	const info = document.getElementById("info");
	let html = "";
	const refus = recharge() > 0 ? "<br><span class='refus'>Authorisation in " + Math.ceil(recharge()) + " s</span>" : "";
	if (survol && survol.type === "cable") {
		const c = cables[survol.cable];
		html = "Power line " + c.nom + "<br>supplies " + c.aval.map(s => postes[s].nom).join(" ");
		html += etat.coupes.has(c.index) ? "<br><span class='refus'>Already severed</span>" : refus || "<br>Click to sever";
	} else if (survol && survol.type === "route") {
		html = rues[survol.rue].nom;
		html += etat.bloquees.has(survol.rue) ? "<br><span class='refus'>Already obstructed</span>" : refus || "<br>Click to obstruct";
	} else if (survol && survol.type === "centrale") {
		html = "Generating station<br>requires " + OPERATEURS_CENTRALE + " simultaneous operators · " + appuisRecents(t).length + "/" + OPERATEURS_CENTRALE;
		html += !etat.centrale ? "<br><span class='refus'>Offline</span>" : refus || "<br>Click to join the shutdown";
	} else if (outil === "construire" && souris.dedans) {
		html = trace ? "Structure · " + Math.round(longueurTrace(trace)) + " / " + LONGUEUR_MUR + " m" : "Drag to erect a structure" + refus;
	}
	info.hidden = !html;
	if (html) {
		info.innerHTML = html;
		info.style.left = souris.x + "px";
		info.style.top = souris.y + "px";
	}
}

function placerEtiquettes() {
	for (const e of etiquettes) {
		const p = versEcran(e.x, e.y, e.z);
		e.el.style.left = p.x + "px";
		e.el.style.top = p.y + "px";
	}
}


// ---------- boucle ----------
let avant = performance.now();
function boucle() {
	requestAnimationFrame(boucle);
	const ici = performance.now();
	const dt = Math.min(0.1, (ici - avant) / 1000);
	avant = ici;
	const t = maintenant();

	etat = calculerEtat(t);
	if (souris.dedans && outil !== "observer" && !glisse) mettreAJourSurvol();
	dessinerEtat(t);
	dessinerImpulsions(t);
	dessinerFumee(t);
	dessinerFenetres(t);
	rouler(dt, t);
	dessinerEquipes(t);
	ecrire(t);
	placerEtiquettes();
	dessinerCurseurs();

	renderer.render(scene, camera);
}
boucle();
