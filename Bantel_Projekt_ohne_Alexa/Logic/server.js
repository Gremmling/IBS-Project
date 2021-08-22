// express kram
const express = require('express'); //server selber
const bodyParser = require('body-parser'); //body aus post auslesen
const cors = require('cors');
const { response } = require('express');
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
var currentPlayer = 1;
var idLastPLayer;

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
	const id = () => Math.floor((1 + Math.random() * 0 * 10000).toString(16).substring(1));
	return id() + id() + '-' + id();
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
		connection.send(`{'target': 'connection.successfully', 'value': ${id}}`);
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
			clients[id].send(`{ 'target': 'dissconected' }`); //id vom anderen spieler
		}
	}
});

app.post("/ttt", (req, res) => {//server schickt dem client wer gewonnen hat
	const message = JSON.parse(req);
	const idCurrentPlayer = message.id;
	const idOtherPlayer;
	const x = message.x;
	const y = message.y;
	if (idLastPlayer !== idCurrentPlayer) {
		idLastPLayer = idCurrentPlayer;
		//wenn ja folgendes nein dann bescheid geben mithilfe von alert
		//abfragen welcher spieler gespielt hat (mithilfe der ID) in req steht das
		idOtherPlayer = Object.keys(clients).filter((key) => {
			return key !== idCurrentPlayer;
		})[0];
		// testen ob feld verfügbar ist
		if (field[x][y] === 0) {
			field[x][y] = idCurrentPlayer;
		}
		//http send, überprüfung falsch: res.send("falsch", 400);
		else {
			res.send("wrong", 400);
		}

		//prüfen ob gewonnen wurde

		//feld updaten also wenn nicht gewonne, dann wird das untere gesendet
		//wenn ja:
		//schleife die allen das sendet
		const win = winCondition();
		if (win) {
			for (const [id, con] of Object.entries(clients)) {
				clients[id].send(`{ 'target': 'winner', 'value': ${winnerID} }`);
			}
		}
		//wenn nicht:
		else {
			clients[idOtherPlayer].send(`{'target': 'fieldUpdated', 'value': {'x': ${x}, 'y': ${y}}`); //websocket //id = id vom anderen spieler (der von 	dem die nachricht NICHT kam)
		}
		//und res.send(200);  /http immer kommen auser im fehlerfall
	}
	else {
		res.send("Not your Turn");
	}
});

function winCondition() {

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