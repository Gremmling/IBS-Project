var options = ['Schere', 'Stein', 'Papier'];
var max = 3;
var min = 1;
var randomNumber = 0;
var userId = "3598"
var mqtt = require("mqtt");
var connectOptions = {
	host: "www.ostalbradar.de",
	port: 8883,
	protocol: "mqtts",
	username: "3598",
	password: "VYbnFXrGD94ghYKNuuDrNGV9d5c="
};


function onMessage(topic, message) {

	let alexasAnswer = answerGenerate(message);

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

function answerGenerate(data) {

	var message = JSON.parse(data);

	if (message.request.type = "LaunchRequest") { //maybe wie ein automat in testat 3 aufbauen
		console.log("LaunchRequest hat geklappt");
		return "Willkommen bei Anti Boredom, wähle zwischen Schere, Stein, Papier und einem Witz aus.";
	}

	else if (message.request.type = "IntentRequest" && message.request.intent.name == "Joke") {
		console.log("Witzt hat geklappt");
		return "Hier sollte ein Witz ausgewählt werden.";
	}

	else if (message.request.type = "IntentRequest" && message.request.intent.name == "Schere_Stein_Papier") {
		console.log("Schere Stein papier wurde gestartet");
		return "Bitte wähle Schere, Stein oder Papier aus.";
	}

	else if (message.request.type = "IntentRequest" && message.request.intent.name == "Auswahl_Schere_Stein_Papier") {
		console.log("Antwort");
		//Code für das schere stein papier schreiben
		randomNumber = (Math.random() * (max - min)) + min;
		var auswahl = message.request.intent.slots.auswahl.value;
		if (randomNumber != 0) {
			if (options[randomNumber] == auswahl) {
				return "Ist das gleiche, also Unentschieden.";
			}
			else if ((options[randomNumber] === "Schere") && (auswahl === "Stein")) {
				return "Du hast gewonnen.";
			}

			else if ((options[randomNumber] === "Stein") && (auswahl === "Papier")) {
				return "Du hast gewonnen.";
			}

			else if ((options[randomNumber] === "Papier") && (auswahl === "Schere")) {
				return "Du hast gewonnen.";
			}
			else {
				if (auswahl !== "Schere" || auswahl !== "Stein" || auswahl !== "Papier") {
					return "Keine gültige Auswahl getroffen.";
				}
				else {
					return "Ich hab gewonnen.";
				}
			}
		}
	}
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