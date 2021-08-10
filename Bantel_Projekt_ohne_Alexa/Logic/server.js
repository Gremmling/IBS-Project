// express kram
const express = require('express'); //server selber
const bodyParser = require('body-parser'); //body aus post auslesen
const cors = require('cors');
const { response } = require('express');
const axios = require('axios').default;

// mongodb kram
const { MongoClient } = require('mongodb');

const app = express(); //der express servers wird erstellt
app.use(cors()); //andere pakete wollen wir verwenden
app.use(bodyParser.json());

app.get("/joke", (req, res) => {
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

app.post("/rps/initRPS", (req, res) => {
	//alexa sagen, dass jetzt ein spiel startet
});

app.post("/rps/userSelection", (req, res) => {
	// aus req lesen welceh auswahl der spieler getroffen hat
	// ...
	connectDatabase(req.body).then(answer => { 
		res.send(answer);
	})
});

app.listen(5000, () => {
	console.log("Listening on Port 5000 :>)");
})

async function connectDatabase(data) {
    
	const uri = "mongodb+srv://Jannik:oKiYjEJ5G6zJJhO0@ibsproject.h8auc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
    
    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();
		console.log("connected");

		var selection = createSelection();

		var result = getResult(data.selection, selection);

		var uname = await findUser(client, data.username);

		if (uname)
			var score = await updateUser(client, data.username, result);
		else
			var score = await createUser(client, data.username, result);

		var answer = { "selection": selection, "result": result, "score": score };
    } 
	
	finally {
        // Close the connection to the MongoDB cluster
        await client.close();
		console.log("closed");
    }

	return answer;
}

async function findUser(client, username) {
    const result = await client.db("rpc").collection("scoreboard").findOne({ name: username });
    
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

    await client.db("rpc").collection("scoreboard").insertOne(newListing);
    
	return score;
}

async function updateUser(client, username, result) {
	const res = await client.db("rpc").collection("scoreboard").findOne({ name: username });

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

    await client.db("rpc").collection("scoreboard").updateOne({ name: username }, { $set: updatedListing });

	return score;
}

function createSelection() {
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

	return answer;
}

function getResult(x, y) {
	var result = "<h2>You win!</h2>";

	if ((x === "Schere" && y === "Stein") || (x === "Stein" && y === "Papier") || (x === "Papier" && y === "Schere"))
		result = "<h2>You lose!</h2>";

	else if (x === y)
		result = "<h2>Tie!</h2>";

	return result;
}
