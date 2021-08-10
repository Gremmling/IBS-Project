// express kram
const express = require('express'); //server selber
const bodyParser = require('body-parser'); //body aus post auslesen
const cors = require('cors');
const { response } = require('express');
const axios = require('axios').default;

const app = express(); //der express servers wird erstellt
app.use(cors()); //andere pakete wollen wir verwenden
app.use(bodyParser.json());



app.get("/jokeWithAPI", (req, res) => {
	// const jokes = [
	// 	"Why did you choose JavaScript? I didn't. It just showed up an wont't leave.",
	// 	"Why do Java developers wear glasses? Because they don't C#!",
	// 	"Warum lieben Frauen objektorientierte Programmierer? Weil sie Klasse haben.",
	// 	"Immer mehr Senioren verschwinden im Internet, weil sie die Tasten 'Alt' und 'Entfernen' drücken."
	// ];
	// res.send(jokes[Math.floor(Math.random() * jokes.length)]);

	axios.get('https://api.chucknorris.io/jokes/random', {})
		.then(({ data }) => {
			res.send(data.value);
		});
})

app.get("/jokeWithDatabase", (req, res) => {
	res.send("hat geklappt");
})

app.post("/rps/initRPS", (req, res) => {
	//alexa sagen, dass jetzt ein spiel startet
});

app.post("/rps/userSelection", (req, res) => {
	// aus req lesen welceh auswahl der spieler getroffen hat
	// ...

	let answer = Math.floor(Math.random() * 3) + 1;

	if (answer === 1)
		answer = "Schere";
	else if (answer === 2)
		answer = "Stein";
	else if (answer === 3)
		answer = "Papier";

	if (answer !== "Schere" && answer !== "Stein" && answer !== "Papier") {
		answer = "Fehlerhafte Eingabe";
	}

	res.send(answer);
});

app.listen(5000, () => {
	console.log("Listening on Port 5000 :>)");
})