exports.answerGenerate =
function answerGenerate(data) {
	var options = ['Schere', 'Stein', 'Papier'];
	var max = 2;
	var min = 0;
	var randomNumber = 0;
	var zustand = "Nicht gesetzt";
	var message = JSON.parse(data);

	if (message.request.type = "LaunchRequest" && zustand === "Nicht gesetzt") { //maybe wie ein automat in testat 3 aufbauen
		console.log("LaunchRequest hat geklappt");
		zustand = "Launched";
		return "Willkommen bei Anti Boredom, wähle zwischen Schere, Stein, Papier und einem Witz aus.";
	}

	else if (message.request.type = "IntentRequest" && message.request.intent.name == "Joke" && zustand === "Launched") {
		console.log("Witzt hat geklappt");
		zustand = "Witz";
		return "Hier sollte ein Witz ausgewählt werden.";
	}

	else if (message.request.type = "IntentRequest" && message.request.intent.name == "Schere_Stein_Papier" && zustand === "Launched") {
		console.log("Schere Stein papier wurde gestartet");
		zustand = "Auswahl Schere Stein Papier";
		return "Bitte wähle Schere, Stein oder Papier aus.";
	}

	else if (message.request.type = "IntentRequest" && message.request.intent.name == "Auswahl_Schere_Stein_Papier" && (zustand === "Auswahl Schere Stein Papier" || zustand === "Spielt Schere Stein Papier")) {
		console.log("Antwort");
		//Code für das schere stein papier schreiben
		zustand = "Spielt Schere Stein Papier"
		randomNumber = (Math.random() * (max - min)) + min;
		var auswahl = message.request.intent.slots.auswahl.value;
		if (randomNumber != 0) {
			if (options[randomNumber] == auswahl) {
				return ["Ist das gleiche, also Unentschieden.", options[randomNumber]];
			}
			else if ((options[randomNumber] === "Schere") && (auswahl === "Stein")) {
				return ["Du hast gewonnen.", options[randomNumber]];
			}

			else if ((options[randomNumber] === "Stein") && (auswahl === "Papier")) {
				return ["Du hast gewonnen.", options[randomNumber]];
			}

			else if ((options[randomNumber] === "Papier") && (auswahl === "Schere")) {
				return ["Du hast gewonnen.", options[randomNumber]];
			}
			else {
				if (auswahl !== "Schere" || auswahl !== "Stein" || auswahl !== "Papier") {
					return "Keine gültige Auswahl getroffen.";
				}
				else {
					return ["Ich habe gewonnen.", options[randomNumber]];
				}
			}
		}
	}
}
