//Express-Server
const express = require('express');
//Body aus dem Post auslesen
const bodyParser = require('body-parser');
const cors = require('cors');
//Axios einbinden
const axios = require('axios').default;

//Websocket einbinden
const WebSocketServer = require('websocket').server;
//HTTP einbinden
const http = require('http');

//MongoDB einbinden
const { MongoClient, ReturnDocument } = require('mongodb');

//Erzeugung des Express Servers
const app = express();
app.use(cors());
app.use(bodyParser.json());


//Variablen für Tic Tac Toe:
var field = [
	[0, 0, 0],
	[0, 0, 0],
	[0, 0, 0]
];
var idLastPlayer = "";

//Dictornary erstellen
const clients = {};

//HTTP mit Websocket verknüpfen:
const server = http.createServer((req, res) => {
	console.log("Websocket connected");
	res.writeHead(404);
	res.end();
});
//Server erzeugt
server.listen(8080, () => console.log("HTTP Server listening on Port 8080"));
const websocketServer = new WebSocketServer({
	httpServer: server,
	autoAcceptConnection: true
});

//Unique Userid für jeden Nutzer anlegen:
const createUniqueID = () => {
	// Random zahl erzeugen, diese an den nutzer senden
	let id = Math.floor(Math.random() * 1000);
	console.log(id);
	return id;
};

//Verbindung für die Id speichern.
websocketServer.on('request', function (req) {
	//Wenn Dictionary < 2 ist kann gespeichert werden
	if (Object.keys(clients).length < 2) {
		console.log('Moiiiin');
		const id = createUniqueID();
		const connection = req.accept(null, req.origin);
		clients[id] = connection;
		//Id an Script senden
		connection.send(`{"target": "connection.successfully", "value": ${id}}`);

		//Wenn zwei Nutzer im Dictionary sind bekommt der User eine Nachricht das sein Gegner verbunden ist
		if (Object.keys(clients).length == 2) {
			Object.values(clients).forEach(connection => connection.send(`{ "target": "opponent connected"}`));
		}

	}
	//Wenn nicht Fehler senden
	else {
		req.reject();
	}
});

//Aus Client den Nutzer löschen und anderen Spieler benachrichtigen
websocketServer.on('close', function (connection, resonCode, description) {
	//Andere Id herausfinden
	for (const [id, con] of Object.entries(clients)){
		if (con == connection)
			//Id aus Liste löschen
			delete clients[id];
			else {
			//An die verbleibende Id die Nachricht senden dass der Gegner disconnected ist
			clients[id].send(`{ "target": "disconected" }`);
		}
	}
});

//Reset bearbeiten
app.post("/ttt/reset", (req, res) => {
	//Nachricht aus require in Variablen speichern
	const resetMessage = req.body;
	const task = resetMessage.target;

	//Wenn wir Reset als Nachricht bekommen ausführen
	if (task === "reset") {
		//Feld zurücksetzen
		field = [
			[0, 0, 0],
			[0, 0, 0],
			[0, 0, 0]
		];
		//Letzten Spieler zurücksetzen
		idLastPlayer = "";
		//An beide Spieler die Nachricht senden das resetted werden soll
		Object.values(clients).forEach(connection => connection.send(`{ "target": "resetPLS"}`));
	}
	res.sendStatus(200);
})

//Überprüfung ob aktueller Zug in Ordnung ist und ob jemand gewonnen hat
app.post("/ttt", (req, res) => {
	//Nachricht aus require in Variablen speichern
	const message = req.body;
	//Id speichern
	let idCurrentPlayer = message.id;
	//Position des Klicks speichern
	const x = message.x;
	const y = message.y;
	var winnerId = "";

	//Andere Id herausfinden
	let idOtherPlayer = Object.keys(clients).filter((key) => {
		return key !== idCurrentPlayer;
	})[0];

	//Wenn letzter Spieler nicht derselbe als der aktuelle Spieler ist wird das Folgendes ausgeführt
	if (idLastPlayer !== idCurrentPlayer) {

		//Testen ob Feld verfügbar ist
		if (field[x][y] === 0) {
			field[x][y] = idCurrentPlayer;
			idLastPlayer = idCurrentPlayer;
		}
		//Wenn nicht verfügbar Fehler senden
		else {
			res.send("Wrong Coordinates", 400);
			return;
		}

		//Feld updaten an beide Nutzer senden
		Object.values(clients).forEach(connection => connection.send(`{"target": "fieldUpdated", "value": {"x": ${x}, "y": ${y}}}`));

		//Überprüfen wer gewonnen hat
		var win = CheckForWinner(idCurrentPlayer, idOtherPlayer);
		// wenn jemand gewonnen hat ausführen
		if (win != 0) {
			//Wenn Ergebnis 1 gewinnt der aktuelle Spieler
			if (win === 1) {
				winnerId = idCurrentPlayer;
			}

			//Wenn Ergebnis 2 gewinnt der andere Spieler
			else if (win === 2) {
				winnerId = idOtherPlayer;
			}

			//Wenn Ergebnis -1 dann Unentschieden
			else if (win === -1) {
				winnerId = -1;
			}

			//An alle Nutzer senden welche ID gewonnen hat
			for (const [id, con] of Object.entries(clients)) {
				clients[id].send(`{ "target": "winner", "value": ${winnerId} }`);
			}
			//Dem Nutzer senden dass das Spiel vorbei ist falls er noch klickt
			res.send("Game Over", 200);
			return;
		}

		//Wenn alles klappt an Nutzer senden
		res.sendStatus(200);
	}
	//Nachricht falls der aktuelle Spieler nicht am Zug ist
	else {
		res.send("Not your Turn", 400);
	}
});

//Funktion die Überprüft wer gewonnen hat
function CheckForWinner(idCurrentPlayer, idOtherPlayer) {
	//Ids der Spieler in Strings speichern und das mal 3 nehmen
	let currentPlayerString = idCurrentPlayer.toString().repeat(3);
	let otherPlayerString = idOtherPlayer.toString().repeat(3);
	//Variable die überprüft ob es unentschieden steht
	let full = true;
	//Spalten und Zeilen checken
	for (i = 0; i < field.length; i++){
		let posRow = '';
		let posCol = '';
		for (j = 0; j < field.length; j++){
			posRow = posRow + field[i][j].toString();
			posCol = posCol + field[j][i].toString();
			if (field[i][j] === 0) {
				full = false;
			}
		}
		//überprüfen wer gewonnen hat indem die Strings verglichen werden
		let winRow = winCondition(posRow, currentPlayerString, otherPlayerString);
		let winCol = winCondition(posCol, currentPlayerString, otherPlayerString);
		if (winRow > 0) {
			return winRow;
		}
		else if(winCol > 0) {
			return winCol;
		}
	}
	//Diagonalen überprüfen
	let dia01 = winCondition(field[0][0].toString() + field[1][1].toString() + field[2][2].toString(), currentPlayerString, otherPlayerString); //122
	let dia02 = winCondition(field[0][2].toString() + field[1][1].toString() + field[2][0].toString(), currentPlayerString, otherPlayerString);
	if (dia01 > 0) {
		return dia01;
	}
	else if (dia02 > 0) {
		return dia02;
	}
	else if (full){
		return -1;
	}
	else {
		return 0;
	}
}

//Vergleicht den in CheckForWinner() gespeicherten String mit den Win conditions, dafür muss die Winner ID 3 mal hintereinander stehen
function winCondition(pos, currentPlayerString, otherPlayerString) {
	if (pos === currentPlayerString) {
		return 1;
	}
	else if (pos === otherPlayerString) {
		return 2;
	}
	else {
		return 0;
	}
}

//Antwort auf Anfrage des witzes aus der API, hier ist der Link zu der verwendeten API: https://api.chucknorris.io
app.get("/jokeWithAPI", (req, res) => {
	//den Witz aus der API rauslesen und zurück senden
	axios.get('https://api.chucknorris.io/jokes/random', {})
		.then(({ data }) => {
			res.send(data.value);
		});
})

//Witz aus der Datenbank zurücksenden
app.get("/jokeWithDatabase", (req, res) => {
	connectDatabase(req.body, 1).then(answer => {
		res.send(answer);
	})
})

//Witz in Datenbank speichern und Antwort an den Nutzer zurück senden
app.post("/newJoke", (req, res) => {
	connectDatabase(req.body, 2).then(answer => {
		res.send(answer);
	})
})


app.post("/rps/userSelection", (req, res) => {
	//Aus req lesen welche Auswahl der Spieler getroffen hat
	connectDatabase(req.body, 0).then(answer => {
		res.send(answer);
	})
});

//Brauchen wir das?
app.listen(5000, () => {
	console.log("Listening on Port 5000 :>)");
})

//Zur Datenbank verbinden
async function connectDatabase(data, value) {

	//Uri der Datenbank
	const uri = "mongodb+srv://Jannik:oKiYjEJ5G6zJJhO0@ibsproject.h8auc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

    const client = new MongoClient(uri);

    try {
		//Zu MongoDB verbinden
		await client.connect();
		console.log("connected");

		//Bei Value = 0 wird Schere Stein Papier gespielt
		if (value === 0) {
			var selection = createSelection();

			var result = getResult(data.selection, selection);

			if (data.username != "") {
				var uname = await findUser(client, data.username);

				//Wenn Username schon existiert wird die Score geupdated
				if (uname)
					var score = await updateUser(client, data.username, result);
				//Ansonsten wird der Usser in der Datenbank angelegt
				else
					var score = await createUser(client, data.username, result);
			}
			else var score = "No username inserted!";

			var answer = { "selection": selection, "result": result, "score": score };
		}

		//Bei Value = 1 wird Witz ausgelesen
		else if (value === 1) {
			var answer = await getJoke(client);
		}

		//Bei Value = 2 wird neuer Witz eingelesen
		else if (value === 2) {
			var answer = await newJoke(client, data.joke);
		}
    }

	finally {
		//Die Verbindung zu MongoDB schließen
		await client.close();
		console.log("closed");
    }

	return answer;
}

//User ID in der Datenbank finden
async function findUser(client, username) {
    const result = await client.db("rps").collection("scoreboard").findOne({ name: username });

	return result;
}

//User in der Datenbank anlegen (je nach Ergebnis mit anderer Score)
async function createUser(client, username, result) {
	if (result == "<h2>You win!</h2>") {
		var newListing =  {
            name: username,
            wins: 1,
            losses: 0
        }
		var score = "1 W - 0 L";
	}
	else if (result == "<h2>You lose!</h2>") {
		var newListing =  {
            name: username,
            wins: 0,
            losses: 1
        }
		var score = "0 W - 1 L";
	}
	else {
		var newListing =  {
            name: username,
            wins: 0,
            losses: 0
        }
		var score = "0 W - 0 L";
	}

    await client.db("rps").collection("scoreboard").insertOne(newListing);

	return score;
}

//User updaten wenn Schere Stein Papier gespielt wurde (je nach Score)
async function updateUser(client, username, result) {
	const res = await client.db("rps").collection("scoreboard").findOne({ name: username });

	var w = res.wins;
	var l = res.losses;

	if (result == "<h2>You win!</h2>") {
		var w1 = w + 1;
		var updatedListing =  { wins: w1 };
		var score = w1 + " W - " + l + " L";
	}
	else if (result == "<h2>You lose!</h2>") {
		var l1 = l + 1;
		var updatedListing =  { losses: l1 };
		var score = w + " W - " + l1 + " L";
	}
	else {
		var updatedListing =  { wins: w };
		var score = w + " W - " + l + " L";
	}

    await client.db("rps").collection("scoreboard").updateOne({ name: username }, { $set: updatedListing });

	return score;
}

//Witz aus der Datenbank auslesen, mithilfe einer Random Zahl
async function getJoke(client) {
	let length = await client.db("jokes").collection("collection").countDocuments({});
	let n = Math.floor(Math.random() * length) + 1;

	const result = await client.db("jokes").collection("collection").findOne({ number: n });
	var answer = result.joke;

	return answer;
}

//Neuen Witz in Datenbank einfügen, wenn er schon vorhanden ist gib eine Nachricht aus die den Nutzer informiert
async function newJoke(client, joke) {
	const result = await client.db("jokes").collection("collection").findOne({ joke: joke });

	if (result)
		var answer = "Joke already exists!";

	else {
		let length = await client.db("jokes").collection("collection").countDocuments({});
		let n = length + 1;

		await client.db("jokes").collection("collection").insertOne({
            joke: joke,
            number: n
		});

		var answer = "Joke successfully added!"
	}

	return answer;
}

//Schere Stein Papier Auswahl vom Server erzeugen
function createSelection() {
	//Random Zahl zwischen 1 und 3 erzeugen
	let answer = Math.floor(Math.random() * 3) + 1;

	//Antwort zuweisen
	if (answer === 1)
		answer = "Scissors";
	else if (answer === 2)
		answer = "Rock";
	else if (answer === 3)
		answer = "Paper";

	//Antwort bei Fehler
	if (answer !== "Scissors" && answer !== "Rock" && answer !== "Paper") {
		answer = "Wrong Input";
	}

	//Antwort zurücksenden
	return answer;
}


//Überprüfen wer gewonnen hat
function getResult(x, y) {

	var result = "<h2>You win!</h2>";

	if ((x === "Scissors" && y === "Rock") || (x === "Rock" && y === "Paper") || (x === "Paper" && y === "Scissors"))
		result = "<h2>You lose!</h2>";

	else if (x === y)
		result = "<h2>Tie!</h2>";

	return result;
}