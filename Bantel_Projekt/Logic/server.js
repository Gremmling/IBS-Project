// express kram
const express = require('express'); //server selber
const bodyParser = require('body-parser'); //body aus post auslesen
const cors = require('cors');
const answer;

const app = express(); //der express servers wird erstellt
app.use(cors()); //andere pakete wollen wir verwenden
app.use(bodyParser.text({ extended: true }));


app.get("/joke", (req, res) => {
	// alexa anfragen
	// alexa antwort auslesen

	res.send("alexa antwort");
})

app.post("/rpc/initRPC", (req, res) => {
	//alexa sagen, dass kjetzt ein spiel startet
});

app.post("/rpc/userSelection", (req, res) => {
	// aus req lesen welceh auswahl der spieler getroffen hat
	// ...

	if (req !== "Schere" || req !== "Stein" || req !== "Papier") {
		answer.innerText = "Fehlerhafte Eingabe";
	}
	answer = req;

	// alexa anfragen
	// alexa antwort auslesen

	res.send(answer);
})