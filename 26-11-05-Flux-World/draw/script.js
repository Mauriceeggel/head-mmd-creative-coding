// Flux World — le téléphone
// On dessine une forme et on l'envoie dans le monde (Firebase).

const dessin = document.getElementById("dessin");
const ctx = dessin.getContext("2d");
const boutonEnvoyer = document.getElementById("envoyer");
const statut = document.getElementById("statut");

let couleur = "#111111";
let enTrainDeDessiner = false;
let aDessine = false;

ctx.lineWidth = 14;
ctx.lineCap = "round";
ctx.lineJoin = "round";


// position du doigt dans le canvas (le canvas fait 512 px mais s'affiche plus petit)
function positionDans(event) {
	const r = dessin.getBoundingClientRect();
	return {
		x: (event.clientX - r.left) * dessin.width / r.width,
		y: (event.clientY - r.top) * dessin.height / r.height
	};
}

dessin.addEventListener("pointerdown", function (event) {
	enTrainDeDessiner = true;
	dessin.setPointerCapture(event.pointerId);
	const p = positionDans(event);
	ctx.strokeStyle = couleur;
	ctx.beginPath();
	ctx.moveTo(p.x, p.y);
	ctx.lineTo(p.x + 0.1, p.y);   // un simple tap fait un point
	ctx.stroke();
	aDessine = true;
	statut.textContent = "";
});

dessin.addEventListener("pointermove", function (event) {
	if (!enTrainDeDessiner) return;
	const p = positionDans(event);
	ctx.lineTo(p.x, p.y);
	ctx.stroke();
});

function arreter() {
	enTrainDeDessiner = false;
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


// effacer
function effacer() {
	ctx.clearRect(0, 0, dessin.width, dessin.height);
	aDessine = false;
}
document.getElementById("effacer").addEventListener("click", effacer);


// envoyer : l'image (fond transparent) part dans Firebase
boutonEnvoyer.addEventListener("click", function () {
	if (!aDessine) {
		statut.textContent = "Draw something first.";
		return;
	}

	boutonEnvoyer.disabled = true;
	statut.textContent = "Sending…";

	dessinsRef.push({
		image: dessin.toDataURL("image/png"),
		date: firebase.database.ServerValue.TIMESTAMP
	}).then(function () {
		effacer();
		statut.textContent = "Sent! Look at the screen.";
	}).catch(function () {
		statut.textContent = "Could not send, try again.";
	}).finally(function () {
		boutonEnvoyer.disabled = false;
	});
});
