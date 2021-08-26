//express
//Server
const express = require('express');
//den body aus dem Post auslesen
const bodyParser = require('body-parser');
const cors = require('cors');
//axios einbinden
const axios = require('axios').default;

//websocket einbinden, aber nur den Server teil davon
const WebSocketServer = require('websocket').server;
//http einbinden
const http = require('http');

// mongodb einbinden
const { MongoClient, ReturnDocument } = require('mongodb');

//erzeugung des express server und desen pakete die wir verwenden wollen
const app = express();
app.use(cors());
app.use(bodyParser.json());


//variablen fürs TicTacToe:
var field = [
	[0, 0, 0],
	[0, 0, 0],
	[0, 0, 0]
];
var idLastPlayer = "";

//dictornary erstellen
const clients = {};


//http an websocket verknüpfen:
const server = http.createServer((req, res) => {
	console.log("Moiiiiin");
	res.writeHead(404);
	res.end();
}); //server erzeugt
server.listen(8080, () => console.log("HTTP Server listening on Port 8080"));
const websocketServer = new WebSocketServer({
	httpServer: server,
	autoAcceptConnection: true
});

//unique userid für jeden Nutzer anlegen:
const createUniqueID = () => {
	// Random zahl erzeugen, diese an den nutzer senden
	let id = Math.floor(Math.random() * 1000);
	console.log(id);
	return id;
};

//die verbindung für die Id speichern.
websocketServer.on('request', function (req) {

	//wenn dictionary kleiner 2 ist kann gespeichert werden
	if (Object.keys(clients).length < 2) {
		console.log('Moiiiin');
		const id = createUniqueID();
		const connection = req.accept(null, req.origin);
		clients[id] = connection;
		//an script die id senden damit ich damit weiter machen kann
		connection.send(`{"target": "connection.successfully", "value": ${id}}`);

		//wenn zwei nutzer im Dictionary sind bekommt der User eine nachricht das sein gegner verbunden ist
		if (Object.keys(clients).length == 2) {
			Object.values(clients).forEach(connection => connection.send(`{ "target": "opponent connected"}`));
		}

	}
	//wenn nicht fehler senden
	else {
		req.reject();
	}
});


//aus clients den nutzer löschen und anderen spieler benachrichtigen
websocketServer.on('close', function (connection, resonCode, description) {
	//ander ID Rausfinden
	for (const [id, con] of Object.entries(clients)){
		if (con == connection)
			//id aus liste löschen
			delete clients[id];
			else {
			//an die letzte verbleibende Id die nachricht senden das der gegner disconected ist
			clients[id].send(`{ "target": "disconected" }`);
		}
	}
});

//reset bearbeiten
app.post("/ttt/reset", (req, res) => {
	//Nachricht aus require in Variablen speichern
	const resetMessage = req.body;
	const task = resetMessage.target;
	//aktueller spieler einspeichern

	//brauch ich das???
	// let idCurrentPlayer = resetMessage.id;

	// let idOtherPlayer = Object.keys(clients).filter((key) => {
	// 	return key !== idCurrentPlayer;
	// })[0];

	//wenn wir reset als nachricht bekommen ausführen
	if (task === "reset") {
		//feld zurück setzen
		field = [
			[0, 0, 0],
			[0, 0, 0],
			[0, 0, 0]
		];
		//letzen Spieler zurücksetzen
		idLastPlayer = "";
		//an beide Spieler die Nachricht senden das reseted werden soll
		Object.values(clients).forEach(connection => connection.send(`{ "target": "resetPLS"}`));
	}
	res.sendStatus(200);
})


//Überprüfung ob aktueller Zug in Ordnung ist und ob jemand gewonnen hat
app.post("/ttt", (req, res) => {
	//Nachricht aus require in Variablen speichern
	const message = req.body;
	//die ID speichern
	let idCurrentPlayer = message.id;
	//position des Klicks speichern
	const x = message.x;
	const y = message.y;
	var winnerId = "";

	//Andere ID rausfinden
	let idOtherPlayer = Object.keys(clients).filter((key) => {
		return key !== idCurrentPlayer;
	})[0];

	//wenn letzter Spieler nicht der gleiche war wir der Aktuelle Spieler wird das folgende ausgeführt
	if (idLastPlayer !== idCurrentPlayer) {


		// testen ob feld verfügbar ist
		if (field[x][y] === 0) {
			field[x][y] = idCurrentPlayer;
			idLastPlayer = idCurrentPlayer;
		}
		//wenn es nicht verfügbar, fehler senden
		else {
			res.send("Wrong Coordinates", 400);
			return;
		}

		//feld updaten an beide nutzer senden
		Object.values(clients).forEach(connection => connection.send(`{"target": "fieldUpdated", "value": {"x": ${x}, "y": ${y}}}`));

		//überprüfen wer gewonnen hat
		var win = CheckForWinner(idCurrentPlayer, idOtherPlayer);
		// wenn jemand gewonnen hat ausführen
		if (win != 0) {
			//wenn das ergebnis eine 1 ist gewinnt der aktuelle Spieler
			if (win === 1) {
				winnerId = idCurrentPlayer;
			}

			//wenn das ergebnis eine 1 ist gewinnt der andere Spieler
			else if (win === 2) {
				winnerId = idOtherPlayer;
			}

			//im falle eines unendschiedens ist das ergebnis eine -1
			else if (win === -1) {
				winnerId = -1;
			}
			//an alle nutzer senden welche ID gewonnen hat
			for (const [id, con] of Object.entries(clients)) {
				clients[id].send(`{ "target": "winner", "value": ${winnerId} }`);
			}
			//user senden das das Spiel vorbei ist fals er noch klickt
			res.send("Game Over", 200);
			return;
		}

		//alles hat geklappt an user senden
		res.sendStatus(200);
	}
	//fals der aktuelle spieler nicht am zug ist wird das ausgegebn
	else {
		res.send("Not your Turn", 400);
	}
});

//Funktion die überprüft wer gewonenn hat
function CheckForWinner(idCurrentPlayer, idOtherPlayer) {
	//ids der Spieler in Strings speichern und das mal 3 nehmen
	let currentPlayerString = idCurrentPlayer.toString().repeat(3);
	let otherPlayerString = idOtherPlayer.toString().repeat(3);
	//variable die überprüft ob es unendschieden ist
	let full = true;
	//spalten und zeilen checken
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
		//überprüfen wer gewonnen hat indem sie die Strings vergleicht
		let winRow = winCondition(posRow, currentPlayerString, otherPlayerString);
		let winCol = winCondition(posCol, currentPlayerString, otherPlayerString);
		if (winRow > 0) {
			return winRow;
		}
		else if(winCol > 0) {
			return winCol;
		}
	}
	//diagonalen überprüfen
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

//vergleicht den in CheckForWinner() gespeicherten String den win conditions, dafür muss die winner ID 3 mal hintereinander stehen
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





//brauchen wir das noch?
app.get("/games/tickTacToe", (req, res) => {
	res.send("hat geklappt")
})


//antwort auf anfrage des witzes aus der API
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

//witz in datenbank speichern und antwort an den Nutzer zurück senden
app.post("/newJoke", (req, res) => {
	connectDatabase(req.body, 2).then(answer => {
		res.send(answer);
	})
})


app.post("/rps/userSelection", (req, res) => {
	// aus req lesen welceh auswahl der spieler getroffen hat
	// ...
	connectDatabase(req.body, 0).then(answer => {
		res.send(answer);
	})
});

//brauchen wir das?
app.listen(5000, () => {
	console.log("Listening on Port 5000 :>)");
})


//zur Datenbank verbinden
async function connectDatabase(data, value) {

	//uri der Datenbank
	const uri = "mongodb+srv://Jannik:oKiYjEJ5G6zJJhO0@ibsproject.h8auc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();
		console.log("connected");

		if (value === 0) {
			var selection = createSelection();

			var result = getResult(data.selection, selection);

			if (data.username != "") {
				var uname = await findUser(client, data.username);

				if (uname)
					var score = await updateUser(client, data.username, result);
				else
					var score = await createUser(client, data.username, result);
			}
			else var score = "No username inserted!";

			var answer = { "selection": selection, "result": result, "score": score };
		}

		else if (value === 1) {
			var answer = await getJoke(client);
		}

		else if (value === 2) {
			var answer = await newJoke(client, data.joke);
		}
    }

	finally {
        // Close the connection to the MongoDB cluster
        await client.close();
		console.log("closed");
    }

	return answer;
}


//user ID in der Datenbank finden
async function findUser(client, username) {
    const result = await client.db("rps").collection("scoreboard").findOne({ name: username });

	return result;
}


//user in der Datenbank anlegen
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


//User updaten wenn Schere Stein Papier gespielt wurde
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


//neuen Witz in Datenbank einfügen, wenn er schon vorhanden ist gib eine Nachricht aus die den Nutzer informiert
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

//Auswahl vom server erzeugen
function createSelection() {
	//random zahl zwischen 1 und 3 erzeugen
	let answer = Math.floor(Math.random() * 3) + 1;

	//antwort zuweisen
	if (answer === 1)
		answer = "Scissors";
	else if (answer === 2)
		answer = "Rock";
	else if (answer === 3)
		answer = "Paper";

	//fals ein fehler auftritt
	if (answer !== "Scissors" && answer !== "Rock" && answer !== "Paper") {
		answer = "Wrong Input";
	}

	//antwort zurücksenden
	return answer;
}


//überprüfen wer gewonnen hat und das zurück senden
function getResult(x, y) {

	var result = "<h2>You win!</h2>";

	if ((x === "Scissors" && y === "Rock") || (x === "Rock" && y === "Paper") || (x === "Paper" && y === "Scissors"))
		result = "<h2>You lose!</h2>";

	else if (x === y)
		result = "<h2>Tie!</h2>";

	return result;
}