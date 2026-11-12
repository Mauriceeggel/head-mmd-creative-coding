// Flux World — le téléphone
// On dessine la forme d'un pylône. Chaque trait est recopié en miroir,
// puis la liste des traits part dans Firebase pour devenir un pylône en 3D.

const dessin = document.getElementById("dessin");
const ctx = dessin.getContext("2d");
const boutonEnvoyer = document.getElementById("envoyer");
const statut = document.getElementById("statut");

const L = dessin.width;
const H = dessin.height;
const ECART_MIN = 10;   // distance minimum entre deux points d'un trait (en px du canvas)

let couleur = "#2b2e33";
let traits = [];        // { couleur, points: [{x, y}] }
let traitEnCours = null;


// redessine tous les traits et leur reflet
function redessiner() {
	ctx.clearRect(0, 0, L, H);
	ctx.lineWidth = 10;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";

	for (const trait of traits) {
		ctx.strokeStyle = trait.couleur;
		for (const miroir of [false, true]) {
			ctx.beginPath();
			trait.points.forEach(function (p, i) {
				const x = miroir ? L - p.x : p.x;
				if (i === 0) ctx.moveTo(x, p.y);
				else ctx.lineTo(x, p.y);
			});
			if (trait.points.length === 1) ctx.lineTo((miroir ? L - trait.points[0].x : trait.points[0].x) + 0.1, trait.points[0].y);
			ctx.stroke();
		}
	}
}

function positionDans(event) {
	const r = dessin.getBoundingClientRect();
	return {
		x: (event.clientX - r.left) * L / r.width,
		y: (event.clientY - r.top) * H / r.height
	};
}

dessin.addEventListener("pointerdown", function (event) {
	dessin.setPointerCapture(event.pointerId);
	traitEnCours = { couleur: couleur, points: [positionDans(event)] };
	traits.push(traitEnCours);
	statut.textContent = "";
	redessiner();
});

dessin.addEventListener("pointermove", function (event) {
	if (!traitEnCours) return;
	const p = positionDans(event);
	const dernier = traitEnCours.points[traitEnCours.points.length - 1];
	if (Math.hypot(p.x - dernier.x, p.y - dernier.y) < ECART_MIN) return;
	traitEnCours.points.push(p);
	redessiner();
});

function arreter() {
	traitEnCours = null;
}
dessin.addEventListener("pointerup", arreter);
dessin.addEventListener("pointercancel", arreter);


// couleurs
for (const bouton of document.querySelectorAll(".couleur")) {
	bouton.addEventListener("click", function () {
		document.querySelector(".couleur.choisie").classList.remove("choisie");
		bouton.classList.add("choisie");
		couleur = bouton.dataset.couleur;
	});
}

// annuler le dernier trait / tout effacer
document.getElementById("annuler").addEventListener("click", function () {
	traits.pop();
	redessiner();
});

document.getElementById("effacer").addEventListener("click", function () {
	traits = [];
	redessiner();
});


// envoyer : les points sont ramenés entre -0.5 et 0.5 (largeur) et 0 et 1 (hauteur, 0 = le sol)
boutonEnvoyer.addEventListener("click", function () {
	if (traits.length === 0) {
		statut.textContent = "Draw something first.";
		return;
	}

	const donnees = traits.map(function (trait) {
		const points = [];
		for (const p of trait.points) {
			points.push(Math.round((p.x / L - 0.5) * 1000) / 1000);
			points.push(Math.round((1 - p.y / H) * 1000) / 1000);
		}
		return { couleur: trait.couleur, points: points };
	});

	boutonEnvoyer.disabled = true;
	statut.textContent = "Sending…";

	dessinsRef.push({
		traits: donnees,
		date: firebase.database.ServerValue.TIMESTAMP
	}).then(function () {
		traits = [];
		redessiner();
		statut.textContent = "Sent! Look at the screen.";
	}).catch(function () {
		statut.textContent = "Could not send, try again.";
	}).finally(function () {
		boutonEnvoyer.disabled = false;
	});
});
