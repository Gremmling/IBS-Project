// express kram
const express = require('express'); //server selber
const bodyParser = require('body-parser'); //body aus post auslesen
const cors = require('cors');
const axios = require('axios').default;
const WebSocketServer = require('websocket').server; //nur den Websocket Server teil nutzen
const http = require('http'); //http nutzen

// mongodb kram
const { MongoClient, ReturnDocument } = require('mongodb');

const app = express(); //der express servers wird erstellt
app.use(cors()); //andere pakete wollen wir verwenden
app.use(bodyParser.json());


//Websocket: (Fragen?)

//variablen fürs TicTacToe:
var field = [
	[0, 0, 0],
	[0, 0, 0],
	[0, 0, 0]
];
var idLastPlayer = "";

const clients = {}; //dictornary erstellen

//http an websocket packen:
const server = http.createServer((req, res) => {
	console.log("Moiiiiin");
	res.writeHead(404);
	res.end();
}); //server created
server.listen(8080, () => console.log("HTTP Server listening on Port 8080"));
const websocketServer = new WebSocketServer({
	httpServer: server,
	autoAcceptConnection: true
});

//unique userid für jeden Nutzer anlegen:
const createUniqueID = () => {
	// Random zahl erzeugen, diese in einen String speichern und die erste Stelle erstetzen
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
	}
	//wenn nicht fehler senden
	else {
		req.reject();
	}
});

websocketServer.on('close', function (connection ,resonCode, description) {//aus clients rausnehmen und anderen benachrichtigen
	//liste durch und richtige connection rauslöschen und anderen benachrichtigen´
	for (const [id, con] of Object.entries(clients)){
		if (con == connection)
			delete clients[id];
		else {
			clients[id].send(`{ "target": "disconected" }`); //id vom anderen spieler
		}
	}
});

//reset bekommen
app.post("/ttt/reset", (req, res) => {
	const resetMessage = req.body;
	const task = resetMessage.target;
	let idCurrentPlayer = resetMessage.id;
	let idOtherPlayer = Object.keys(clients).filter((key) => {
		return key !== idCurrentPlayer;
	})[0];

	if (task === "reset") {
		field = [
			[0, 0, 0],
			[0, 0, 0],
			[0, 0, 0]
		];
		idLastPlayer = "";
		Object.values(clients).forEach(connection => connection.send(`{ "target": "resetPLS"}`));
	}
	res.sendStatus(200);
})


app.post("/ttt", (req, res) => {//server schickt dem client wer gewonnen hat
	const message = req.body;
	let idCurrentPlayer = message.id;
	const x = message.x;
	const y = message.y;
	var winnerId = "";

	//abfragen welcher spieler gespielt hat (mithilfe der ID) in req steht das
	let idOtherPlayer = Object.keys(clients).filter((key) => {
		return key !== idCurrentPlayer;
	})[0];

	if (idLastPlayer !== idCurrentPlayer) {


		// testen ob feld verfügbar ist
		if (field[x][y] === 0) {
			field[x][y] = idCurrentPlayer;
			idLastPlayer = idCurrentPlayer;
		}
		//http send, überprüfung falsch: res.send("falsch", 400);
		else {
			res.send("Wrong Coordinates", 400);
			return;
		}

		//prüfen ob gewonnen wurde

		//feld updaten also wenn nicht gewonne, dann wird das untere gesendet
		//wenn ja:
		//schleife die allen das sende

		//wenn nicht:

		Object.values(clients).forEach(connection => connection.send(`{"target": "fieldUpdated", "value": {"x": ${x}, "y": ${y}}}`));

		var win = CheckForWinner(idCurrentPlayer, idOtherPlayer);
		if (win != 0) {
			if (win === 1) {
				winnerId = idCurrentPlayer;
			}
			else if (win === 2) {
				winnerId = idOtherPlayer;
			}
			else if (win === -1) {
				winnerId = -1;
			}
			for (const [id, con] of Object.entries(clients)) {
				clients[id].send(`{ "target": "winner", "value": ${winnerId} }`);
			}
			res.send("Game Over", 200);
			return;
		}

		//und res.send(200);  /http immer kommen auser im fehlerfall
		res.sendStatus(200);
	}
	else {
		res.send("Not your Turn", 400);
	}
});

function CheckForWinner(idCurrentPlayer, idOtherPlayer) {
	let currentPlayerString = idCurrentPlayer.toString().repeat(3);
	let otherPlayerString = idOtherPlayer.toString().repeat(3);
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
		let winRow = winCondition(posRow, currentPlayerString, otherPlayerString);
		let winCol = winCondition(posCol, currentPlayerString, otherPlayerString);
		if (winRow > 0) {
			return winRow;
		}
		else if(winCol > 0) {
			return winCol;
		}
	}
	//diagonalen checken
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






app.get("/games/tickTacToe", (req, res) => {
	res.send("hat geklappt")
})


app.get("/jokeWithAPI", (req, res) => {
	axios.get('https://api.chucknorris.io/jokes/random', {})
		.then(({ data }) => {
			res.send(data.value);
		});
})

app.get("/jokeWithDatabase", (req, res) => {
	connectDatabase(req.body, 1).then(answer => {
		res.send(answer);
	})
})

app.post("/newJoke", (req, res) => {
	connectDatabase(req.body, 2).then(answer => {
		res.send(answer);
	})
})

app.post("/rps/initRPS", (req, res) => {
	//alexa sagen, dass jetzt ein spiel startet
});

app.post("/rps/userSelection", (req, res) => {
	// aus req lesen welceh auswahl der spieler getroffen hat
	// ...
	connectDatabase(req.body, 0).then(answer => {
		res.send(answer);
	})
});

app.listen(5000, () => {
	console.log("Listening on Port 5000 :>)");
})

async function connectDatabase(data, value) {

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

async function findUser(client, username) {
    const result = await client.db("rps").collection("scoreboard").findOne({ name: username });

	return result;
}

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

async function getJoke(client) {
	let length = await client.db("jokes").collection("collection").countDocuments({});
	let n = Math.floor(Math.random() * length) + 1;

	const result = await client.db("jokes").collection("collection").findOne({ number: n });
	var answer = result.joke;

	return answer;
}

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

function createSelection() { //warten bis ich ergebnis zurück schicke, im Client das bild(rechts) und unten das ergebnis erst danach aktualiesiern
	let answer = Math.floor(Math.random() * 3) + 1;

	if (answer === 1)
		answer = "Scissors";
	else if (answer === 2)
		answer = "Rock";
	else if (answer === 3)
		answer = "Paper";

	if (answer !== "Scissors" && answer !== "Rock" && answer !== "Paper") {
		answer = "Wrong Input";
	}

	return answer;
}

function getResult(x, y) {
	var result = "<h2>You win!</h2>";

	if ((x === "Scissors" && y === "Rock") || (x === "Rock" && y === "Paper") || (x === "Paper" && y === "Scissors"))
		result = "<h2>You lose!</h2>";

	else if (x === y)
		result = "<h2>Tie!</h2>";

	return result;
}