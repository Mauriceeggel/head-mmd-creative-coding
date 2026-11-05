// Flux World — l'écran
// Un petit monde en 3D où la caméra se promène.
// Les dessins envoyés depuis les téléphones (draw/) arrivent comme des sprites.

import * as THREE from "three";

// ---------- réglages ----------
const RAYON_ILE = 30;          // taille de l'île
const TAILLE_DESSIN = 3;       // taille d'un dessin dans le monde
const DUREE_OBSERVATION = 5;   // secondes passées à regarder un nouveau dessin
const COULEUR_CIEL = 0xcfe3ea;


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
scene.background = new THREE.Color(COULEUR_CIEL);
scene.fog = new THREE.Fog(COULEUR_CIEL, 40, 130);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);

function redimensionner() {
	renderer.setSize(window.innerWidth, window.innerHeight, false);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
}
redimensionner();
window.addEventListener("resize", redimensionner);

scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9a7a, 1.4));
const soleil = new THREE.DirectionalLight(0xfff4e0, 1.6);
soleil.position.set(30, 50, 20);
scene.add(soleil);


// ---------- hasard reproductible (même monde à chaque chargement) ----------
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


// ---------- terrain ----------
// hauteur du sol en (x, z) : une île ronde avec des collines
function hauteur(x, z) {
	const d = Math.sqrt(x * x + z * z) / RAYON_ILE;
	const base = 1 - d * d;
	const collines = Math.sin(x * 0.2) * Math.cos(z * 0.17) * 1.5 + Math.sin(x * 0.07 + z * 0.11) * 2;
	return base * 4.5 + collines * 0.8 * Math.max(0, base) - 1.2;
}

function couleurSol(h) {
	if (h < 0.4) return new THREE.Color(0xe8d9a8);  // sable
	if (h < 1.6) return new THREE.Color(0x8fbf6a);  // herbe
	if (h < 4.4) return new THREE.Color(0x6e9e55);  // herbe foncée
	return new THREE.Color(0xa9a39a);               // roche
}

function creerTerrain() {
	const geo = new THREE.PlaneGeometry(100, 100, 90, 90).toNonIndexed();
	geo.rotateX(-Math.PI / 2);

	const pos = geo.attributes.position;
	for (let i = 0; i < pos.count; i++) {
		const h = hauteur(pos.getX(i), pos.getZ(i));
		pos.setY(i, Math.max(h, -3));
	}

	// une couleur par triangle, pour un look low-poly
	const couleurs = [];
	for (let i = 0; i < pos.count; i += 3) {
		const moyenne = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
		const c = couleurSol(moyenne);
		for (let k = 0; k < 3; k++) couleurs.push(c.r, c.g, c.b);
	}
	geo.setAttribute("color", new THREE.Float32BufferAttribute(couleurs, 3));
	geo.computeVertexNormals();

	const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 });
	scene.add(new THREE.Mesh(geo, mat));
}

function creerEau() {
	const geo = new THREE.PlaneGeometry(400, 400);
	geo.rotateX(-Math.PI / 2);
	const mat = new THREE.MeshStandardMaterial({ color: 0x7fb8d1, transparent: true, opacity: 0.85, roughness: 0.4 });
	scene.add(new THREE.Mesh(geo, mat));
}

const placesArbres = [];   // pour ne pas poser un dessin dans un arbre

function creerDecor() {
	const hasard = creerHasard(42);
	const matTronc = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, flatShading: true });
	const matFeuilles = new THREE.MeshStandardMaterial({ color: 0x4f8a4a, flatShading: true });
	const matRoche = new THREE.MeshStandardMaterial({ color: 0x9a948c, flatShading: true });
	const geoTronc = new THREE.CylinderGeometry(0.15, 0.2, 1, 6);
	const geoFeuilles = new THREE.ConeGeometry(0.9, 2.2, 7);
	const geoRoche = new THREE.DodecahedronGeometry(0.6);

	// arbres
	let arbres = 0;
	while (arbres < 70) {
		const x = (hasard() - 0.5) * RAYON_ILE * 2;
		const z = (hasard() - 0.5) * RAYON_ILE * 2;
		const h = hauteur(x, z);
		if (h < 0.7 || h > 4.2) continue;

		const echelle = 0.7 + hasard() * 0.8;
		const arbre = new THREE.Group();
		const tronc = new THREE.Mesh(geoTronc, matTronc);
		tronc.position.y = 0.5;
		const feuilles = new THREE.Mesh(geoFeuilles, matFeuilles);
		feuilles.position.y = 2;
		arbre.add(tronc, feuilles);
		arbre.position.set(x, h - 0.1, z);
		arbre.scale.setScalar(echelle);
		scene.add(arbre);
		placesArbres.push({ x: x, z: z });
		arbres++;
	}

	// rochers
	for (let i = 0; i < 25; i++) {
		const x = (hasard() - 0.5) * RAYON_ILE * 2;
		const z = (hasard() - 0.5) * RAYON_ILE * 2;
		const h = hauteur(x, z);
		if (h < 0) continue;
		const roche = new THREE.Mesh(geoRoche, matRoche);
		roche.position.set(x, h, z);
		roche.scale.set(0.6 + hasard(), 0.4 + hasard() * 0.6, 0.6 + hasard());
		roche.rotation.y = hasard() * Math.PI;
		scene.add(roche);
	}
}

creerTerrain();
creerEau();
creerDecor();


// ---------- dessins ----------
const chargeur = new THREE.TextureLoader();
const dessins = [];
const fileAttente = [];   // nouveaux dessins que la caméra doit aller voir

// choisit un endroit sur la terre ferme, toujours le même pour un même dessin
function choisirPlace(cle) {
	const hasard = creerHasard(hacher(cle));
	for (let essai = 0; essai < 100; essai++) {
		const angle = hasard() * Math.PI * 2;
		const r = Math.sqrt(hasard()) * RAYON_ILE * 0.8;
		const x = Math.cos(angle) * r;
		const z = Math.sin(angle) * r;
		const libre = placesArbres.every(function (a) { return Math.hypot(a.x - x, a.z - z) > 2.5; });
		if (hauteur(x, z) > 0.6 && libre) return { x: x, z: z };
	}
	return { x: 0, z: 0 };
}

function ajouterDessin(cle, image, estNouveau) {
	const texture = chargeur.load(image);
	texture.colorSpace = THREE.SRGBColorSpace;

	const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, alphaTest: 0.1 }));
	sprite.scale.set(TAILLE_DESSIN, TAILLE_DESSIN, 1);

	const place = choisirPlace(cle);
	const sol = hauteur(place.x, place.z) + TAILLE_DESSIN / 2;
	sprite.position.set(place.x, sol, place.z);
	scene.add(sprite);

	const dessin = { sprite: sprite, sol: sol, arrivee: estNouveau ? horloge.elapsedTime : -100 };
	dessins.push(dessin);

	if (estNouveau) {
		fileAttente.push(dessin);
		montrerMessage();
	}
}

// le dessin tombe du ciel quand il arrive
function animerDessins(temps) {
	for (const d of dessins) {
		const t = Math.min(1, (temps - d.arrivee) / 2.5);
		const chute = 1 - Math.pow(1 - t, 3);
		d.sprite.position.y = d.sol + (1 - chute) * 14;
	}
}

let minuterieMessage = null;
function montrerMessage() {
	const message = document.getElementById("arrivee");
	message.hidden = false;
	clearTimeout(minuterieMessage);
	minuterieMessage = setTimeout(function () { message.hidden = true; }, 3500);
}

// les dessins déjà envoyés apparaissent sans visite,
// les nouveaux (après le chargement) déclenchent la visite de la caméra
let charge = false;
dessinsRef.on("child_added", function (snap) {
	const data = snap.val();
	if (data && data.image) ajouterDessin(snap.key, data.image, charge);
});
dessinsRef.once("value", function () { charge = true; });


// ---------- caméra ----------
const horloge = new THREE.Clock();
let tempsPromenade = 0;
let mode = "promenade";       // "promenade", "aller" ou "observer"
let visite = null;            // le dessin qu'on va voir
let angleVisite = 0;
let debutPhase = 0;

const voulu = new THREE.Vector3();       // où la caméra veut aller
const cibleVoulue = new THREE.Vector3(); // ce qu'elle veut regarder
const regard = new THREE.Vector3();      // ce qu'elle regarde vraiment

// le chemin de promenade autour de l'île
function cheminPromenade(t) {
	const angle = t * 0.04 + 0.5 * Math.sin(t * 0.11);
	const r = 30 + 8 * Math.sin(t * 0.07);
	voulu.set(Math.cos(angle) * r, 9 + 3 * Math.sin(t * 0.13), Math.sin(angle) * r);
	cibleVoulue.set(Math.sin(t * 0.09) * 8, 1.5, Math.cos(t * 0.06) * 8);
}

function commencerVisite(temps) {
	visite = fileAttente.shift();
	const p = visite.sprite.position;
	angleVisite = Math.atan2(camera.position.z - p.z, camera.position.x - p.x);
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
		const p = visite.sprite.position;
		if (mode === "observer") angleVisite += dt * 0.15;  // tourne doucement autour
		voulu.set(p.x + Math.cos(angleVisite) * 7, visite.sol + 3.5, p.z + Math.sin(angleVisite) * 7);
		cibleVoulue.set(p.x, visite.sol, p.z);

		if (mode === "aller" && (camera.position.distanceTo(voulu) < 1.5 || temps - debutPhase > 7)) {
			mode = "observer";
			debutPhase = temps;
		}
		if (mode === "observer" && temps - debutPhase > DUREE_OBSERVATION) {
			mode = "promenade";
			visite = null;
		}
	}

	// pendant le trajet, la caméra monte en arc pour passer au-dessus des arbres
	if (mode === "aller") {
		voulu.y += Math.min(camera.position.distanceTo(voulu) * 0.4, 10);
	}

	// toujours au-dessus des arbres et du sol
	voulu.y = Math.max(voulu.y, hauteur(voulu.x, voulu.z) + 5);
	voulu.y = Math.max(voulu.y, hauteur(camera.position.x, camera.position.z) + 5);

	camera.position.lerp(voulu, 1 - Math.exp(-dt * 0.7));
	regard.lerp(cibleVoulue, 1 - Math.exp(-dt * 1.5));
	camera.lookAt(regard);
}

// position de départ
cheminPromenade(0);
camera.position.copy(voulu);
regard.copy(cibleVoulue);


// ---------- boucle ----------
function boucle() {
	const dt = Math.min(horloge.getDelta(), 0.1);
	const temps = horloge.elapsedTime;
	mettreAJourCamera(dt, temps);
	animerDessins(temps);
	renderer.render(scene, camera);
	requestAnimationFrame(boucle);
}
boucle();
