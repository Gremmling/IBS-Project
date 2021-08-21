// express kram
const express = require('express'); //server selber
const bodyParser = require('body-parser'); //body aus post auslesen
const cors = require('cors');

const alexaBackend = require("./Alexa-Backend.js");

const app = express(); //der express servers wird erstellt
app.use(cors()); //andere pakete wollen wir verwenden
app.use(bodyParser.json());

//mqtt init
var userId = "3598";
var mqtt = require("mqtt");
var connectOptions = {
	host: "www.ostalbradar.de",
	port: 8883,
	protocol: "mqtts",
	username: "3598",
	password: "VYbnFXrGD94ghYKNuuDrNGV9d5c="
};

app.get("/joke", (req, res) => {
	client.on('message', (topic, message) => {
		console.log("[Client On]", topic, message);
		askAlexa(topic, message).then(result => {
			console.log("[Test Res]", result);
			res.send(result)
		});
	});

	//Mit dem Topic '"mqttfetch/alexa2mqtt/" + userId + "/fr/+"' disconnected die verbindung?!
	//bantel fragen ob wir das richtige topic verwenden.
	//client.publish("mqttfetch/alexa2mqtt/" + userId + "/fr/+", 'LaunchRequest'); //funktioniert nicht
	console.log("[After Pub]");
})

app.post("/rps/initRPS", (req, res) => {
	//alexa sagen, dass jetzt ein spiel startet
});

app.post("/rps/userSelection", (req, res) => {
	// aus req lesen welceh auswahl der spieler getroffen hat
	// ...

	// alexa anfragen
	// alexa antwort auslesen
	let answer = onMessage();

	if (answer[1] !== "Schere" && answer[1] !== "Stein" && answer[1] !== "Papier") {
		answer[1] = "Fehlerhafte Eingabe";
	}

	res.send(answer[1]);
});

function onMessage(topic, message) {
	console.log("[On Message]", topic, message);
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
	client.publish(topic.replace("fr","to"), JSON.stringify(response));
}

function askAlexa(topic, message) {
	return new Promise((resolve, reject) => {
		switch (message) {
			case "Willkommen bei Anti Boredom, wähle zwischen Schere, Stein, Papier und einem Witz aus.":
				console.log("[Case 1]");
				client.publish("mqttfetch/alexa2mqtt/" + userId + "/fr/+", "Ich möchte einen Witz hören")//gespräch fortgeführt werden
				break;
			case "Ich möchte einen Witz hören":
				console.log("[Case 2]");
				resolve(alexaBackend.answerGenerate("Ich möchte einen Witz hören")) //antwort von Alexa bekommen
				break;
			default:
				console.log("[Default muss los]");
				break;
		}
	})
}

(async function main() {
	console.log("Go");
	client = mqtt.connect(connectOptions)
		.on("connect", function () {
			console.log("connected");
			client.on('message', onMessage);
			client.subscribe("mqttfetch/alexa2mqtt/" + userId + "/fr/+");
		}
		);
	client.on("disconnect", () => console.log("Diconnected"));
	client.on("close", () => console.log("Closed"));
	client.on("error", err => console.log(err));
})();

app.listen(5000, () => {
	console.log("Listening on Port 5000 :>)");
});