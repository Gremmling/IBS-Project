// express kram
const express = require('express'); //server selber
const bodyParser = require('body-parser'); //body aus post auslesen
const cors = require('cors');

const app = express(); //der express servers wird erstellt
app.use(cors()); //andere pakete wollen wir verwenden
app.use(bodyParser.json());

//mqtt zeug
var userId = "3598";
var mqtt = require("mqtt");
var connectOptions = {
	host: "www.ostalbradar.de",
	port: 8883,
	protocol: "mqtts",
	username: "3598",
	password: "VYbnFXrGD94ghYKNuuDrNGV9d5c="
};


const alexaBackend = require("./Alexa-Backend.js");

app.get("/joke", (req, res) => {
	// const jokes = [
	// 	"Why did you choose JavaScript? I didn't. It just showed up an wont't leave.",
	// 	"Why do Java developers wear glasses? Because they don't C#!",
	// 	"Warum lieben Frauen objektorientierte Programmierer? Weil sie Klasse haben.",
	// 	"Immer mehr Senioren verschwinden im Internet, weil sie die Tasten 'Alt' und 'Entfernen' drücken."
	// ];
	// alexa anfragen
	// alexa antwort auslesen

	// client.publish('LaunchRequest', 'LaunchRequest'); //LaunchRequest drauß machen, weg finden das von AlexaBackend.js aufzurufen kann
	// client.on('message', (topic, message) => {
	// 	if (message === "Willkommen bei Anti Boredom, wähle zwischen Schere, Stein, Papier und einem Witz aus.") {
	// 		client.publish('Witz', 'Ich möchte einen Witz hören');
	// 		client.on('message', (topic, message) => {
	// 			res.send(message);
	// 		})
	// 	}
	// 	// res.send(jokes[Math.floor(Math.random() * jokes.length)]);
	// });
	client.publish('LaunchRequest', 'LaunchRequest'); //LaunchRequest drauß machen, weg finden das von AlexaBackend.js aufzurufen kann
	client.on('message', test(topic, message));
	await test();
	res.send()
})

app.post("/rpc/initRPC", (req, res) => {
	//alexa sagen, dass jetzt ein spiel startet
});

app.post("/rpc/userSelection", (req, res) => {
	// aus req lesen welceh auswahl der spieler getroffen hat
	// ...

	// let answer = Math.floor(Math.random() * 3) + 1;

	// if (answer === 1)
	// 	answer = "Schere";
	// else if (answer === 2)
	// 	answer = "Stein";
	// else if (answer === 3)
	// 	answer = "Papier";

	// alexa anfragen
	// alexa antwort auslesen
	let answer = onMessage();

	if (answer[1] !== "Schere" && answer[1] !== "Stein" && answer[1] !== "Papier") {
		answer = "Fehlerhafte Eingabe";
	}

	res.send(answer);
});

app.listen(5000, () => {
	console.log("Listening on Port 5000 :>)");
})



function onMessage(topic, message) {

	let alexasAnswer = alexaBackend.answerGenerate(message);

	let response = {
		response: {
			outputSpeech:{
				text: alexasAnswer,
				type: "PlainText"
			},
			shouldEndSession: finish

		},
		version:"1.0"
	};
 	finish = false;
	//console.log(topic, '' + message);
	client.publish(
		topic.replace("fr","to"), JSON.stringify(response));
}

(async function main() {
	console.log("Go");
	client = mqtt.connect(connectOptions)
	.on("connect", function() {
		console.log("connected");
		client.on('message', onMessage);
		client.subscribe("mqttfetch/alexa2mqtt/" + userId + "/fr/+");
	}
	)
})();

function test(topic, message) {
	return new Promise((resolve, reject) => {
		switch (message) {
			case "Willkommen bei Anti Boredom, wähle zwischen Schere, Stein, Papier und einem Witz aus.":
				client.publish("Ich möchte einen Witz hören")//gespräch fortgeführt werden
				break;
			case "Ich möchte einen Witz hören":
				resolve(alexaBackend.answerGenerate("Ich möchte einen Witz hören")) //antwort von Alexa bekommen
				break;

			default:
				break;
		}
	})
}