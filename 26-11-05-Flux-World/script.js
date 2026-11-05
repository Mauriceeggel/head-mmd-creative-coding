// Flux World — l'écran
// Un champ de pylônes à perte de vue, dans la brume.
// Chaque dessin envoyé depuis un téléphone (draw/) devient un pylône
// qui sort de terre, se branche à ses voisins et envoie du courant dans le réseau.

import * as THREE from "three";

// ---------- réglages ----------
const ECART_LIGNES = 60;      // distance entre deux lignes électriques
const ECART_PYLONES = 40;     // distance entre deux pylônes sur une ligne
const ETENDUE = 720;          // les lignes vont jusque-là (cachées par la brume)
const HAUTEUR_GRAND = 22;     // pylônes de base
const HAUTEUR_PETIT = 11;     // pylônes dessinés
const RAYON_DESSINS = 70;     // zone où sortent les nouveaux pylônes
const TAILLE_DESSIN = 4;      // taille du dessin en haut du pylône
const VOISINS = 3;            // nombre de câbles d'un nouveau pylône
const DUREE_POUSSE = 3;       // secondes pour qu'un pylône sorte de terre
const DUREE_OBSERVATION = 6;  // secondes passées à regarder un nouveau pylône
const NB_IMPULSIONS = 140;    // points de courant qui circulent

const COULEUR_BRUME = 0x8e979e;
const COULEUR_COURANT = 0xd9f3ff;
const COULEURS_COURANT = { bleu: 0x5aa0ff, rouge: 0xff6a5a, autre: 0xfff0b0 };


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

scene.add(new THREE.HemisphereLight(0xdfe6ea, 0x5b6345, 1.3));
const soleil = new THREE.DirectionalLight(0xfff0dd, 0.9);
soleil.position.set(-40, 60, 30);
scene.add(soleil);

const horloge = new THREE.Clock();


// ---------- hasard reproductible ----------
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


// ---------- le champ ----------
function creerSol() {
	const geo = new THREE.PlaneGeometry(3000, 3000);
	geo.rotateX(-Math.PI / 2);
	scene.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x7d8a58 })));
}

// des milliers de brins d'herbe autour du centre
function creerHerbe() {
	const brin = new THREE.BufferGeometry();
	brin.setAttribute("position", new THREE.Float32BufferAttribute([-0.07, 0, 0, 0.07, 0, 0, 0, 1, 0], 3));
	brin.computeVertexNormals();

	const nombre = 40000;
	const herbe = new THREE.InstancedMesh(brin, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), nombre);
	const hasard = creerHasard(7);
	const matrice = new THREE.Matrix4();
	const rotation = new THREE.Quaternion();
	const angles = new THREE.Euler();
	const position = new THREE.Vector3();
	const echelle = new THREE.Vector3();
	const clair = new THREE.Color(0xa9b06c);
	const fonce = new THREE.Color(0x66764a);
	const couleur = new THREE.Color();

	for (let i = 0; i < nombre; i++) {
		const a = hasard() * Math.PI * 2;
		const r = Math.sqrt(hasard()) * 230;
		position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
		angles.set((hasard() - 0.5) * 0.5, hasard() * Math.PI, (hasard() - 0.5) * 0.5);
		rotation.setFromEuler(angles);
		echelle.set(1 + hasard(), 0.5 + hasard() * 1.1, 1);
		matrice.compose(position, rotation, echelle);
		herbe.setMatrixAt(i, matrice);
		herbe.setColorAt(i, couleur.copy(fonce).lerp(clair, hasard()));
	}
	scene.add(herbe);
}


// ---------- pylônes et câbles ----------
const matPylone = new THREE.LineBasicMaterial({ color: 0x23262a });
const matCable = new THREE.LineBasicMaterial({ color: 0x1d1f22 });

const pylones = [];   // { x, z, accroches: [Vector3] }
const cables = [];    // { points: [Vector3], milieu, couleur }

// la structure d'un pylône en segments (x1,y1,z1, x2,y2,z2, ...) + ses points d'accroche
function formePylone(h, base, haut, avecBras) {
	const segments = [];
	function segment(a, b) {
		segments.push(a[0], a[1], a[2], b[0], b[1], b[2]);
	}
	function coins(y) {
		const w = base + (haut - base) * (y / h);
		return [[-w, y, -w], [w, y, -w], [w, y, w], [-w, y, w]];
	}

	// le treillis : montants, ceintures et croix
	const niveaux = 6;
	for (let i = 0; i < niveaux; i++) {
		const bas = coins(h * i / niveaux);
		const dessus = coins(h * (i + 1) / niveaux);
		for (let k = 0; k < 4; k++) {
			const k2 = (k + 1) % 4;
			segment(bas[k], dessus[k]);
			segment(dessus[k], dessus[k2]);
			segment(bas[k], dessus[k2]);
			segment(bas[k2], dessus[k]);
		}
	}

	// la pointe
	const sommet = [0, h * 1.12, 0];
	for (const coin of coins(h)) segment(coin, sommet);
	const accroches = [sommet];

	// les bras qui portent les câbles
	if (avecBras) {
		for (const [hauteurBras, longueur] of [[0.72, h * 0.42], [0.88, h * 0.32]]) {
			const y = h * hauteurBras;
			const w = base + (haut - base) * hauteurBras;
			for (const cote of [-1, 1]) {
				const bout = [0, y, cote * longueur];
				segment([-w, y, cote * w], bout);
				segment([w, y, cote * w], bout);
				segment([-w, y + h * 0.06, cote * w], bout);
				segment([w, y + h * 0.06, cote * w], bout);
				accroches.push(bout);
			}
		}
	}

	return { segments: segments, accroches: accroches };
}

// un câble qui pend entre deux points
function ajouterCable(a, b, couleur, segments) {
	const points = [];
	const affaissement = a.distanceTo(b) * 0.06;
	for (let i = 0; i <= 12; i++) {
		const t = i / 12;
		const p = new THREE.Vector3().lerpVectors(a, b, t);
		p.y -= affaissement * 4 * t * (1 - t);
		points.push(p);
	}
	for (let i = 0; i < 12; i++) {
		segments.push(points[i].x, points[i].y, points[i].z, points[i + 1].x, points[i + 1].y, points[i + 1].z);
	}
	const cable = { points: points, milieu: points[6], couleur: couleur };
	cables.push(cable);
	return cable;
}

function lignes(segments, materiau) {
	const geo = new THREE.BufferGeometry();
	geo.setAttribute("position", new THREE.Float32BufferAttribute(segments, 3));
	return new THREE.LineSegments(geo, materiau);
}

// les lignes électriques de base, qui partent à l'infini dans la brume
function creerChamp() {
	const forme = formePylone(HAUTEUR_GRAND, 2.2, 0.6, true);
	const segmentsPylones = [];
	const segmentsCables = [];

	for (let z = -ETENDUE; z <= ETENDUE; z += ECART_LIGNES) {
		let precedent = null;
		for (let x = -ETENDUE; x <= ETENDUE; x += ECART_PYLONES) {
			for (let i = 0; i < forme.segments.length; i += 3) {
				segmentsPylones.push(forme.segments[i] + x, forme.segments[i + 1], forme.segments[i + 2] + z);
			}
			const pylone = {
				x: x,
				z: z,
				accroches: forme.accroches.map(function (a) { return new THREE.Vector3(a[0] + x, a[1], a[2] + z); })
			};
			if (precedent) {
				for (let k = 0; k < pylone.accroches.length; k++) {
					ajouterCable(precedent.accroches[k], pylone.accroches[k], COULEUR_COURANT, segmentsCables);
				}
			}
			pylones.push(pylone);
			precedent = pylone;
		}
	}

	scene.add(lignes(segmentsPylones, matPylone));
	scene.add(lignes(segmentsCables, matCable));
}

creerSol();
creerHerbe();
creerChamp();


// ---------- le courant ----------
// une petite lueur ronde
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

// les câbles proches de la caméra (mis à jour de temps en temps)
let cablesProches = [];
let cablesDessines = [];
let dernierTri = -10;

function trierCables(temps) {
	if (temps - dernierTri < 2) return;
	dernierTri = temps;
	cablesProches = cables.filter(function (c) {
		return Math.hypot(c.milieu.x - camera.position.x, c.milieu.z - camera.position.z) < 150;
	});
}

function lancerImpulsion(imp, cable, retard, sens) {
	imp.cable = cable;
	imp.t = -retard;
	imp.sens = sens;
	imp.vitesse = 0.25 + Math.random() * 0.25;   // en "câbles par seconde"
	imp.sprite.material.color.setHex(cable.couleur);
}

function relancer(imp) {
	const liste = cablesDessines.length > 0 && Math.random() < 0.4 ? cablesDessines : cablesProches;
	if (liste.length === 0) return;
	const cable = liste[Math.floor(Math.random() * liste.length)];
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

		// position le long du câble
		const u = (imp.sens > 0 ? imp.t : 1 - imp.t) * 12;
		const i = Math.min(11, Math.floor(u));
		imp.sprite.position.lerpVectors(imp.cable.points[i], imp.cable.points[i + 1], u - i);
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


// ---------- les pylônes dessinés ----------
const chargeur = new THREE.TextureLoader();
const pylonesDessines = [];
const fileAttente = [];

// trouve la couleur la plus présente dans le dessin : "bleu", "rouge" ou "autre"
const COULEURS = [
	{ nom: "bleu", r: 0x3a, g: 0x7b, b: 0xe0 },
	{ nom: "rouge", r: 0xe0, g: 0x48, b: 0x3e },
	{ nom: "autre", r: 0x11, g: 0x11, b: 0x11 },
	{ nom: "autre", r: 0xf2, g: 0xb6, b: 0x32 },
	{ nom: "autre", r: 0x3f, g: 0xa4, b: 0x6a }
];

function couleurDominante(image) {
	const c = document.createElement("canvas");
	c.width = c.height = 64;
	const ctx = c.getContext("2d");
	ctx.drawImage(image, 0, 0, 64, 64);
	const pixels = ctx.getImageData(0, 0, 64, 64).data;

	const compte = { bleu: 0, rouge: 0, autre: 0 };
	for (let i = 0; i < pixels.length; i += 4) {
		if (pixels[i + 3] < 128) continue;
		let meilleure = "autre";
		let distanceMin = Infinity;
		for (const coul of COULEURS) {
			const d = (pixels[i] - coul.r) ** 2 + (pixels[i + 1] - coul.g) ** 2 + (pixels[i + 2] - coul.b) ** 2;
			if (d < distanceMin) { distanceMin = d; meilleure = coul.nom; }
		}
		compte[meilleure]++;
	}

	if (compte.bleu > compte.rouge && compte.bleu > compte.autre) return "bleu";
	if (compte.rouge > compte.bleu && compte.rouge > compte.autre) return "rouge";
	return "autre";
}

// un endroit libre près du centre, toujours le même pour un même dessin
function choisirPlace(cle) {
	const hasard = creerHasard(hacher(cle));
	for (let essai = 0; essai < 200; essai++) {
		const angle = hasard() * Math.PI * 2;
		const r = Math.sqrt(hasard()) * RAYON_DESSINS;
		const x = Math.cos(angle) * r;
		const z = Math.sin(angle) * r;
		const libre = pylones.every(function (p) { return Math.hypot(p.x - x, p.z - z) > 8; });
		if (libre) return { x: x, z: z };
	}
	return { x: (hasard() - 0.5) * RAYON_DESSINS, z: (hasard() - 0.5) * RAYON_DESSINS };
}

function ajouterDessin(cle, image, estNouveau) {
	const place = choisirPlace(cle);
	const hautMat = HAUTEUR_PETIT * 1.12;

	const groupe = new THREE.Group();
	groupe.position.set(place.x, 0, place.z);

	const mat = lignes(formePylone(HAUTEUR_PETIT, 1, 0.3, false).segments, matPylone);
	groupe.add(mat);

	const texture = chargeur.load(image, function () {
		const type = couleurDominante(texture.image);
		for (const cable of pylone.cables) cable.couleur = COULEURS_COURANT[type];
	});
	texture.colorSpace = THREE.SRGBColorSpace;
	const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, alphaTest: 0.1 }));
	sprite.scale.set(TAILLE_DESSIN, TAILLE_DESSIN, 1);
	groupe.add(sprite);
	scene.add(groupe);

	// se brancher aux pylônes les plus proches
	const sommet = new THREE.Vector3(place.x, hautMat, place.z);
	const voisins = pylones.slice().sort(function (a, b) {
		return Math.hypot(a.x - place.x, a.z - place.z) - Math.hypot(b.x - place.x, b.z - place.z);
	}).slice(0, VOISINS);

	const segmentsCables = [];
	const cablesDuPylone = [];
	for (const voisin of voisins) {
		let accroche = voisin.accroches[0];
		for (const a of voisin.accroches) {
			if (a.distanceTo(sommet) < accroche.distanceTo(sommet)) accroche = a;
		}
		cablesDuPylone.push(ajouterCable(sommet, accroche, COULEURS_COURANT.autre, segmentsCables));
	}
	const fils = lignes(segmentsCables, matCable);
	scene.add(fils);

	const pylone = {
		x: place.x,
		z: place.z,
		accroches: [sommet],
		mat: mat,
		sprite: sprite,
		fils: fils,
		cables: cablesDuPylone,
		hautMat: hautMat,
		arrivee: estNouveau ? horloge.elapsedTime : -100,
		branche: !estNouveau
	};
	pylones.push(pylone);
	pylonesDessines.push(pylone);
	cablesDessines = cablesDessines.concat(cablesDuPylone);

	if (estNouveau) {
		fileAttente.push(pylone);
		montrerMessage();
	}
}

// le pylône sort de terre, le dessin monte avec lui, puis les câbles se branchent
function animerPylones(temps) {
	for (const p of pylonesDessines) {
		const t = Math.min(1, (temps - p.arrivee) / DUREE_POUSSE);
		const pousse = 1 - Math.pow(1 - t, 3);
		p.mat.scale.y = Math.max(0.001, pousse);
		p.sprite.position.y = p.hautMat * pousse + TAILLE_DESSIN / 2 + 0.2;
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

// les dessins déjà envoyés sont déjà là, les nouveaux déclenchent la visite
let charge = false;
dessinsRef.on("child_added", function (snap) {
	const data = snap.val();
	if (data && data.image) ajouterDessin(snap.key, data.image, charge);
});
dessinsRef.once("value", function () { charge = true; });


// ---------- caméra ----------
let tempsPromenade = 0;
let mode = "promenade";       // "promenade", "aller" ou "observer"
let visite = null;
let angleVisite = 0;
let debutPhase = 0;

const voulu = new THREE.Vector3();
const cibleVoulue = new THREE.Vector3();
const regard = new THREE.Vector3();

// la promenade dans le champ
function cheminPromenade(t) {
	const angle = t * 0.025 + 0.6 * Math.sin(t * 0.07);
	const r = 50 + 20 * Math.sin(t * 0.05);
	voulu.set(Math.cos(angle) * r, 6 + 4 * Math.sin(t * 0.11), Math.sin(angle) * r);
	cibleVoulue.set(Math.sin(t * 0.04) * 30, 10, Math.cos(t * 0.05) * 30);
}

function commencerVisite(temps) {
	visite = fileAttente.shift();
	angleVisite = Math.atan2(camera.position.z - visite.z, camera.position.x - visite.x);
	mode = "aller";
	debutPhase = temps;
}

function mettreAJourCamera(dt, temps) {
	if (mode === "promenade") {
		tempsPromenade += dt;
		cheminPromenade(tempsPromenade);
		if (fileAttente.length > 0) commencerVisite(temps);
	}

	if (mode === "aller" || mode === "observer") {
		if (mode === "observer") angleVisite += dt * 0.12;
		voulu.set(visite.x + Math.cos(angleVisite) * 15, 9, visite.z + Math.sin(angleVisite) * 15);
		cibleVoulue.set(visite.x, visite.sprite.position.y - 1, visite.z);

		if (mode === "aller") {
			voulu.y += Math.min(camera.position.distanceTo(voulu) * 0.25, 12);
			if (camera.position.distanceTo(voulu) < 2 || temps - debutPhase > 8) {
				mode = "observer";
				debutPhase = temps;
			}
		} else if (temps - debutPhase > DUREE_OBSERVATION) {
			mode = "promenade";
			visite = null;
		}
	}

	voulu.y = Math.max(voulu.y, 1.5);
	camera.position.lerp(voulu, 1 - Math.exp(-dt * 0.7));
	regard.lerp(cibleVoulue, 1 - Math.exp(-dt * 1.5));
	camera.lookAt(regard);
}

cheminPromenade(0);
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
