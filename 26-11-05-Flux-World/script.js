// Flux World — l'écran
// La caméra avance dans un champ de pylônes sans fin, dans la brume.
// Chaque dessin envoyé depuis un téléphone (draw/) devient un pylône en 3D :
// le dessin (en miroir) forme la face avant et la face arrière,
// reliées par des barreaux et des croisillons, comme un vrai treillis métallique.
// Le nouveau pylône sort de terre devant la caméra et se branche au réseau.

import * as THREE from "three";

// ---------- réglages ----------
const ECART_LIGNES = 70;      // distance entre deux lignes électriques
const ECART_PYLONES = 40;     // distance entre deux pylônes sur une ligne
const PERIODE = 1440;         // le monde se répète tous les 1440 m (la caméra boucle)
const HAUTEUR_GRAND = 22;     // pylônes de base
const HAUTEUR_DESSIN = 20;    // hauteur d'un pylône dessiné (toute la hauteur du canvas)
const LARGEUR_DESSIN = 10;    // largeur d'un pylône dessiné (toute la largeur du canvas)
const VOISINS = 3;            // nombre de câbles d'un nouveau pylône
const DUREE_POUSSE = 3;       // secondes pour qu'un pylône sorte de terre
const DUREE_OBSERVATION = 6;  // secondes passées à regarder un nouveau pylône
const VITESSE = 4;            // vitesse de marche de la caméra (m/s)
const COULOIR = 35;           // la caméra marche entre la ligne z = 0 et la ligne z = 70
const NB_IMPULSIONS = 140;

const COULEUR_BRUME = 0x8e979e;
const COULEUR_ACIER = 0x2b2e33;
const COULEUR_COURANT = 0xd9f3ff;


// ---------- code QR vers la page dessin ----------
const lienDessin = new URL("draw/", location.href).href;
const qr = qrcode(0, "M");
qr.addData(lienDessin);
qr.make();
document.getElementById("qr-code").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });


// ---------- scène ----------
const canvas = document.getElementById("monde");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(COULEUR_BRUME);
scene.fog = new THREE.FogExp2(COULEUR_BRUME, 0.0085);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);

function redimensionner() {
	renderer.setSize(window.innerWidth, window.innerHeight, false);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
}
redimensionner();
window.addEventListener("resize", redimensionner);

scene.add(new THREE.HemisphereLight(0xdfe6ea, 0x5b6345, 1.5));
const soleil = new THREE.DirectionalLight(0xfff0dd, 1.0);
soleil.position.set(-40, 60, 30);
scene.add(soleil);

const horloge = new THREE.Clock();


// ---------- outils ----------
function creerHasard(graine) {
	return function () {
		graine = (graine * 1664525 + 1013904223) % 4294967296;
		return graine / 4294967296;
	};
}

function hacher(texte) {
	let h = 2166136261;
	for (let i = 0; i < texte.length; i++) {
		h = Math.imul(h ^ texte.charCodeAt(i), 16777619) >>> 0;
	}
	return h;
}

// la copie d'un x la plus proche de la caméra (le monde boucle)
function plusProche(x) {
	return x + Math.round((camera.position.x - x) / PERIODE) * PERIODE;
}


// ---------- poutres ----------
// transforme une liste de poutres { a: [x,y,z], b: [x,y,z], r } en une géométrie 3D
// (chaque poutre est un petit prisme à 4 faces)
function geometriePoutres(poutres) {
	const positions = [];
	const A = new THREE.Vector3();
	const B = new THREE.Vector3();
	const d = new THREE.Vector3();
	const u = new THREE.Vector3();
	const v = new THREE.Vector3();
	const haut = new THREE.Vector3();

	for (const p of poutres) {
		A.fromArray(p.a);
		B.fromArray(p.b);
		d.subVectors(B, A);
		if (d.lengthSq() < 1e-6) continue;
		d.normalize();
		haut.set(0, 1, 0);
		if (Math.abs(d.y) > 0.95) haut.set(1, 0, 0);
		u.crossVectors(d, haut).normalize().multiplyScalar(p.r);
		v.crossVectors(d, u).normalize().multiplyScalar(p.r);

		const decalages = [u.clone(), v.clone(), u.clone().negate(), v.clone().negate()];
		const coinsA = decalages.map(function (o) { return A.clone().add(o); });
		const coinsB = decalages.map(function (o) { return B.clone().add(o); });

		for (let k = 0; k < 4; k++) {
			const k2 = (k + 1) % 4;
			for (const c of [coinsA[k], coinsB[k], coinsB[k2], coinsA[k], coinsB[k2], coinsA[k2]]) {
				positions.push(c.x, c.y, c.z);
			}
		}
	}

	const geo = new THREE.BufferGeometry();
	geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
	geo.computeVertexNormals();
	return geo;
}

function materiauAcier(couleur) {
	return new THREE.MeshLambertMaterial({ color: couleur, flatShading: true, side: THREE.DoubleSide });
}


// ---------- les pylônes de base ----------
function formePyloneDeBase(h) {
	const base = 2.4;
	const haut = 0.7;
	const poutres = [];
	function coins(y) {
		const w = base + (haut - base) * (y / h);
		return [[-w, y, -w], [w, y, -w], [w, y, w], [-w, y, w]];
	}

	const niveaux = 5;
	for (let i = 0; i < niveaux; i++) {
		const bas = coins(h * i / niveaux);
		const dessus = coins(h * (i + 1) / niveaux);
		for (let k = 0; k < 4; k++) {
			const k2 = (k + 1) % 4;
			poutres.push({ a: bas[k], b: dessus[k], r: 0.24 });        // montant
			poutres.push({ a: dessus[k], b: dessus[k2], r: 0.11 });    // ceinture
			poutres.push({ a: bas[k], b: dessus[k2], r: 0.08 });       // croix
			poutres.push({ a: bas[k2], b: dessus[k], r: 0.08 });
		}
	}

	const sommet = [0, h * 1.12, 0];
	for (const coin of coins(h)) poutres.push({ a: coin, b: sommet, r: 0.12 });
	const accroches = [sommet];

	for (const [hauteurBras, longueur] of [[0.72, h * 0.42], [0.88, h * 0.32]]) {
		const y = h * hauteurBras;
		const w = base + (haut - base) * hauteurBras;
		for (const cote of [-1, 1]) {
			const bout = [0, y, cote * longueur];
			poutres.push({ a: [-w, y, cote * w], b: bout, r: 0.12 });
			poutres.push({ a: [w, y, cote * w], b: bout, r: 0.12 });
			poutres.push({ a: [-w, y + h * 0.06, cote * w], b: bout, r: 0.08 });
			poutres.push({ a: [w, y + h * 0.06, cote * w], b: bout, r: 0.08 });
			accroches.push(bout);
		}
	}
	return { poutres: poutres, accroches: accroches };
}

const pylones = [];   // pylônes de base : { x, z, accroches: [Vector3] }
const cables = [];    // { points: [Vector3], milieu, couleur, groupe }

function pointsCable(a, b) {
	const points = [];
	const affaissement = a.distanceTo(b) * 0.06;
	for (let i = 0; i <= 12; i++) {
		const t = i / 12;
		const p = new THREE.Vector3().lerpVectors(a, b, t);
		p.y -= affaissement * 4 * t * (1 - t);
		points.push(p);
	}
	return points;
}

function versSegments(points, segments) {
	for (let i = 0; i < points.length - 1; i++) {
		segments.push(points[i].x, points[i].y, points[i].z, points[i + 1].x, points[i + 1].y, points[i + 1].z);
	}
}

const matCable = new THREE.LineBasicMaterial({ color: 0x1d1f22 });

function lignes(segments) {
	const geo = new THREE.BufferGeometry();
	geo.setAttribute("position", new THREE.Float32BufferAttribute(segments, 3));
	return new THREE.LineSegments(geo, matCable);
}

// les lignes électriques : assez loin dans toutes les directions pour que la brume cache les bords,
// et un peu plus que la période pour que la boucle ne se voie pas
function creerChamp() {
	const forme = formePyloneDeBase(HAUTEUR_GRAND);
	const geo = geometriePoutres(forme.poutres);
	const positions = [];
	const segments = [];

	for (let z = -3 * ECART_LIGNES; z <= 4 * ECART_LIGNES; z += ECART_LIGNES) {
		let precedent = null;
		for (let x = -PERIODE / 2 - 320; x <= PERIODE / 2 + 320; x += ECART_PYLONES) {
			positions.push([x, z]);
			const pylone = {
				x: x,
				z: z,
				accroches: forme.accroches.map(function (a) { return new THREE.Vector3(a[0] + x, a[1], a[2] + z); })
			};
			if (precedent) {
				for (let k = 0; k < pylone.accroches.length; k++) {
					const points = pointsCable(precedent.accroches[k], pylone.accroches[k]);
					versSegments(points, segments);
					cables.push({ points: points, milieu: points[6], couleur: COULEUR_COURANT, groupe: null });
				}
			}
			pylones.push(pylone);
			precedent = pylone;
		}
	}

	const champ = new THREE.InstancedMesh(geo, materiauAcier(COULEUR_ACIER), positions.length);
	const m = new THREE.Matrix4();
	positions.forEach(function (p, i) {
		m.makeTranslation(p[0], 0, p[1]);
		champ.setMatrixAt(i, m);
	});
	scene.add(champ);
	scene.add(lignes(segments));
}

function creerSol() {
	const geo = new THREE.PlaneGeometry(6000, 6000);
	geo.rotateX(-Math.PI / 2);
	scene.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x6f7a4f })));
}

creerSol();
creerChamp();


// ---------- les pylônes dessinés ----------
// le treillis s'affine en montant
function profondeur(y) {
	return 1.1 * (1 - 0.55 * y / HAUTEUR_DESSIN);
}

// reprend un trait en points espacés régulièrement (pour les barreaux et les croisillons)
function reechantillonner(pts, pas) {
	if (pts.length < 2) return pts.slice();
	const resultat = [pts[0]];
	let reste = pas;
	for (let i = 0; i + 1 < pts.length; i++) {
		const [x1, y1] = pts[i];
		const [x2, y2] = pts[i + 1];
		const longueur = Math.hypot(x2 - x1, y2 - y1);
		let parcouru = 0;
		while (longueur - parcouru >= reste) {
			parcouru += reste;
			const t = parcouru / longueur;
			resultat.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
			reste = pas;
		}
		reste -= longueur - parcouru;
	}
	resultat.push(pts[pts.length - 1]);
	return resultat;
}

// transforme les traits du téléphone en poutres 3D (par couleur) + points d'accroche.
// Le dessin est posé face à la caméra qui marche : sa largeur va sur l'axe z,
// et le treillis prend de l'épaisseur sur l'axe x (face avant / face arrière).
function formeDessinee(traits) {
	const parCouleur = {};
	const tousLesPoints = [];

	// (largeur, hauteur, épaisseur) -> [x, y, z] du monde
	function point3D(l, h, e) {
		return [e, h, l];
	}

	for (const trait of traits) {
		const pts = [];
		for (let i = 0; i + 1 < trait.points.length; i += 2) {
			pts.push([trait.points[i] * LARGEUR_DESSIN, Math.max(0, trait.points[i + 1]) * HAUTEUR_DESSIN]);
		}
		if (!parCouleur[trait.couleur]) parCouleur[trait.couleur] = [];
		const poutres = parCouleur[trait.couleur];

		for (const miroir of [1, -1]) {
			const p2 = pts.map(function (p) { return [p[0] * miroir, p[1]]; });

			// les deux faces suivent le trait exactement
			for (let i = 0; i < p2.length; i++) {
				tousLesPoints.push(p2[i]);
				if (i + 1 < p2.length) {
					const [l, h] = p2[i];
					const [l2, h2] = p2[i + 1];
					for (const face of [1, -1]) {
						poutres.push({ a: point3D(l, h, face * profondeur(h)), b: point3D(l2, h2, face * profondeur(h2)), r: 0.17 });
					}
				}
			}

			// barreaux et croisillons tous les 1,2 m
			const r = reechantillonner(p2, 1.2);
			for (let i = 0; i < r.length; i++) {
				const [l, h] = r[i];
				const d = profondeur(h);
				poutres.push({ a: point3D(l, h, -d), b: point3D(l, h, d), r: 0.08 });
				if (i + 1 < r.length) {
					const [l2, h2] = r[i + 1];
					const s = i % 2 === 0 ? 1 : -1;
					poutres.push({ a: point3D(l, h, d * s), b: point3D(l2, h2, -profondeur(h2) * s), r: 0.06 });
				}
			}
		}
	}

	// accroches : le point le plus haut, et les deux points les plus écartés
	let sommet = [0, 0];
	let bout = [0, 0];
	for (const p of tousLesPoints) {
		if (p[1] > sommet[1]) sommet = p;
		if (p[0] > bout[0]) bout = p;
	}
	const accroches = [
		new THREE.Vector3().fromArray(point3D(sommet[0], sommet[1], 0)),
		new THREE.Vector3().fromArray(point3D(bout[0], bout[1], 0)),
		new THREE.Vector3().fromArray(point3D(-bout[0], bout[1], 0))
	];

	return { parCouleur: parCouleur, accroches: accroches };
}

// la couleur du courant : celle qui domine dans le dessin, en plus lumineux
function couleurDuCourant(traits) {
	const compte = {};
	for (const t of traits) compte[t.couleur] = (compte[t.couleur] || 0) + t.points.length;
	let meilleure = null;
	for (const c in compte) if (!meilleure || compte[c] > compte[meilleure]) meilleure = c;
	if (!meilleure || meilleure === "#2b2e33") return COULEUR_COURANT;
	return new THREE.Color(meilleure).lerp(new THREE.Color(0xffffff), 0.35).getHex();
}

const pylonesDessines = [];
const fileAttente = [];

// un endroit libre : devant la caméra pour un nouveau dessin, sinon d'après la clé
function choisirPlace(cle, estNouveau) {
	const hasard = creerHasard(hacher(cle));
	let x = estNouveau ? camera.position.x + 70 + fileAttente.length * 30 : (hasard() - 0.5) * PERIODE;
	const cote = hasard() < 0.5 ? -1 : 1;
	const z = COULOIR + cote * (15 + hasard() * 3);

	// pas trop près d'un autre pylône dessiné
	for (let essai = 0; essai < 50; essai++) {
		const libre = pylonesDessines.every(function (p) {
			return Math.abs(plusProche(p.x) - plusProche(x)) > 14 || Math.abs(p.z - z) > 14;
		});
		if (libre) break;
		x += 16;
	}
	x = ((x + PERIODE / 2) % PERIODE + PERIODE) % PERIODE - PERIODE / 2;
	return { x: x, z: z };
}

function ajouterPylone(cle, data, estNouveau) {
	const place = (typeof data.x === "number") ? { x: data.x, z: data.z } : choisirPlace(cle, estNouveau);
	if (estNouveau && typeof data.x !== "number") dessinsRef.child(cle).update(place);

	const forme = formeDessinee(data.traits);
	const groupe = new THREE.Group();
	groupe.position.set(place.x, 0, place.z);

	const structure = new THREE.Group();
	for (const couleur in forme.parCouleur) {
		structure.add(new THREE.Mesh(geometriePoutres(forme.parCouleur[couleur]), materiauAcier(couleur)));
	}
	groupe.add(structure);
	scene.add(groupe);

	// se brancher aux pylônes les plus proches (dans les coordonnées du pylône)
	const couleurCourant = couleurDuCourant(data.traits);
	const candidats = pylones.concat(pylonesDessines).map(function (p) {
		const px = p.groupe ? plusProcheDe(p.x, place.x) : p.x;
		return { p: p, dx: px - p.x, distance: Math.hypot(px - place.x, p.z - place.z) };
	}).sort(function (a, b) { return a.distance - b.distance; }).slice(0, VOISINS);

	const segments = [];
	const cablesDuPylone = [];
	for (const c of candidats) {
		let meilleur = null;
		for (const a of forme.accroches) {
			const aMonde = a.clone().add(groupe.position);
			for (const b of c.p.accroches) {
				const bMonde = b.clone();
				if (c.p.groupe) bMonde.add(new THREE.Vector3(c.p.x + c.dx, 0, c.p.z));
				const d = aMonde.distanceTo(bMonde);
				if (!meilleur || d < meilleur.d) meilleur = { d: d, a: a, b: bMonde.sub(groupe.position) };
			}
		}
		const points = pointsCable(meilleur.a, meilleur.b);
		versSegments(points, segments);
		const cable = { points: points, milieu: points[6], couleur: couleurCourant, groupe: groupe };
		cables.push(cable);
		cablesDuPylone.push(cable);
	}
	const fils = lignes(segments);
	groupe.add(fils);

	const pylone = {
		x: place.x,
		z: place.z,
		groupe: groupe,
		accroches: forme.accroches,   // locales
		structure: structure,
		fils: fils,
		cables: cablesDuPylone,
		arrivee: estNouveau ? horloge.elapsedTime : -100,
		branche: !estNouveau
	};
	pylonesDessines.push(pylone);

	if (estNouveau) {
		fileAttente.push(pylone);
		montrerMessage();
	}
}

function plusProcheDe(x, reference) {
	return x + Math.round((reference - x) / PERIODE) * PERIODE;
}

// place chaque pylône dessiné sur la copie la plus proche de la caméra, et anime sa pousse
function animerPylones(temps) {
	for (const p of pylonesDessines) {
		p.groupe.position.x = plusProche(p.x);

		const t = Math.min(1, (temps - p.arrivee) / DUREE_POUSSE);
		const pousse = 1 - Math.pow(1 - t, 3);
		p.structure.scale.y = Math.max(0.001, pousse);
		p.fils.visible = t >= 1;

		if (t >= 1 && !p.branche) {
			p.branche = true;
			decharge(p);
		}
	}
}

let minuterieMessage = null;
function montrerMessage() {
	const message = document.getElementById("arrivee");
	message.hidden = false;
	clearTimeout(minuterieMessage);
	minuterieMessage = setTimeout(function () { message.hidden = true; }, 3500);
}

// les dessins déjà envoyés sont déjà là, les nouveaux poussent devant la caméra
let charge = false;
dessinsRef.on("child_added", function (snap) {
	const data = snap.val();
	if (data && Array.isArray(data.traits)) ajouterPylone(snap.key, data, charge);
});
dessinsRef.once("value", function () { charge = true; });


// ---------- le courant ----------
function creerLueur() {
	const c = document.createElement("canvas");
	c.width = c.height = 64;
	const ctx = c.getContext("2d");
	const degrade = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
	degrade.addColorStop(0, "rgba(255,255,255,1)");
	degrade.addColorStop(0.25, "rgba(255,255,255,0.8)");
	degrade.addColorStop(1, "rgba(255,255,255,0)");
	ctx.fillStyle = degrade;
	ctx.fillRect(0, 0, 64, 64);
	return new THREE.CanvasTexture(c);
}

const lueur = creerLueur();
const impulsions = [];
for (let i = 0; i < NB_IMPULSIONS; i++) {
	const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
		map: lueur,
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	}));
	sprite.scale.setScalar(0.9);
	sprite.visible = false;
	scene.add(sprite);
	impulsions.push({ sprite: sprite, cable: null, t: 0, vitesse: 0, sens: 1 });
}

function milieuMonde(cable) {
	return cable.groupe ? cable.milieu.x + cable.groupe.position.x : cable.milieu.x;
}

let cablesProches = [];
let dernierTri = -10;
function trierCables(temps) {
	if (temps - dernierTri < 1.5) return;
	dernierTri = temps;
	cablesProches = cables.filter(function (c) {
		const z = c.groupe ? c.milieu.z + c.groupe.position.z : c.milieu.z;
		return Math.hypot(milieuMonde(c) - camera.position.x, z - camera.position.z) < 160;
	});
}

function lancerImpulsion(imp, cable, retard, sens) {
	imp.cable = cable;
	imp.t = -retard;
	imp.sens = sens;
	imp.vitesse = 0.25 + Math.random() * 0.25;
	imp.sprite.material.color.setHex(cable.couleur);
}

function relancer(imp) {
	if (cablesProches.length === 0) return;
	const cable = cablesProches[Math.floor(Math.random() * cablesProches.length)];
	lancerImpulsion(imp, cable, Math.random() * 2, Math.random() < 0.5 ? 1 : -1);
}

function animerCourant(dt) {
	for (const imp of impulsions) {
		if (!imp.cable || imp.t > 1) relancer(imp);
		if (!imp.cable) continue;

		imp.t += imp.vitesse * dt;
		if (imp.t < 0 || imp.t > 1) {
			imp.sprite.visible = false;
			continue;
		}
		const u = (imp.sens > 0 ? imp.t : 1 - imp.t) * 12;
		const i = Math.min(11, Math.floor(u));
		imp.sprite.position.lerpVectors(imp.cable.points[i], imp.cable.points[i + 1], u - i);
		if (imp.cable.groupe) imp.sprite.position.add(imp.cable.groupe.position);
		imp.sprite.visible = true;
	}
}

// une décharge qui part d'un nouveau pylône dans tous ses câbles
function decharge(pylone) {
	let n = 0;
	for (const cable of pylone.cables) {
		for (let k = 0; k < 6; k++) {
			lancerImpulsion(impulsions[n % impulsions.length], cable, k * 0.35, 1);
			n++;
		}
	}
}


// ---------- caméra ----------
let tempsPromenade = 0;
let avancee = 0;              // jusqu'où la caméra a marché
let mode = "marche";          // "marche", "aller" ou "observer"
let visite = null;
let angleVisite = 0;
let debutPhase = 0;

const voulu = new THREE.Vector3();
const cibleVoulue = new THREE.Vector3();
const regard = new THREE.Vector3();

// la marche : tout droit dans le couloir entre deux lignes, en ondulant un peu
function cheminMarche(t) {
	voulu.set(avancee, 4 + 1.5 * Math.sin(t * 0.13), COULOIR + 6 * Math.sin(t * 0.045));
	cibleVoulue.set(avancee + 35, 7 + 3 * Math.sin(t * 0.07), COULOIR + 12 * Math.sin(t * 0.03));
}

function commencerVisite(temps) {
	visite = fileAttente.shift();
	const px = visite.groupe.position.x;
	angleVisite = Math.atan2(camera.position.z - visite.z, camera.position.x - px);
	mode = "aller";
	debutPhase = temps;
}

function mettreAJourCamera(dt, temps) {
	if (mode === "marche") {
		tempsPromenade += dt;
		avancee += VITESSE * dt;
		cheminMarche(tempsPromenade);
		if (fileAttente.length > 0) commencerVisite(temps);
	}

	if (mode === "aller" || mode === "observer") {
		const px = visite.groupe.position.x;
		if (mode === "observer") angleVisite += dt * 0.1;
		voulu.set(px + Math.cos(angleVisite) * 22, 6, visite.z + Math.sin(angleVisite) * 22);
		cibleVoulue.set(px, HAUTEUR_DESSIN * 0.5, visite.z);

		if (mode === "aller" && (camera.position.distanceTo(voulu) < 2 || temps - debutPhase > 9)) {
			mode = "observer";
			debutPhase = temps;
		} else if (mode === "observer" && temps - debutPhase > DUREE_OBSERVATION) {
			// reprendre la marche là où on est
			mode = "marche";
			visite = null;
			avancee = camera.position.x;
		}
	}

	voulu.y = Math.max(voulu.y, 1.5);
	camera.position.lerp(voulu, 1 - Math.exp(-dt * 0.8));
	regard.lerp(cibleVoulue, 1 - Math.exp(-dt * 1.5));
	camera.lookAt(regard);

	// le monde boucle : quand on a assez marché, on revient d'une période en arrière sans que ça se voie
	if (camera.position.x > PERIODE / 2) {
		camera.position.x -= PERIODE;
		regard.x -= PERIODE;
		avancee -= PERIODE;
		for (const p of pylonesDessines) p.groupe.position.x = plusProche(p.x);
		for (const imp of impulsions) {
			if (imp.cable && !imp.cable.groupe) imp.cable = null;   // relancées près de la nouvelle position
		}
		dernierTri = -10;
		trierCables(horloge.elapsedTime);
	}
}

cheminMarche(0);
camera.position.copy(voulu);
regard.copy(cibleVoulue);


// ---------- boucle ----------
function boucle() {
	const dt = Math.min(horloge.getDelta(), 0.1);
	const temps = horloge.elapsedTime;
	mettreAJourCamera(dt, temps);
	animerPylones(temps);
	trierCables(temps);
	animerCourant(dt);
	renderer.render(scene, camera);
	requestAnimationFrame(boucle);
}
boucle();
