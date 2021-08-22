var currentPlayer = 1;
var imgPlayerOne = "<img src='pictures/cross.png'>";
var imgPlayerTwo = "<img src='pictures/circle.png'>";
var field = [
	[0, 0, 0],
	[0, 0, 0],
	[0, 0, 0]
];
var amountPlayed = 0;
var id;

const websocket = new WebSocket('ws://localhost:8080'); //verbindung zum websocket backend aufbauen

websocket.onopen = () => { //connection öffnen => bekommen wir das hier
	console.log("Connected to WS Server");
}

websocket.onerror = (err) => { //connection fehler => bekommen wir das hier
	console.log(err.constructor);
	console.log("WS Error", err);
}

websocket.onclose = (closeCode) => { //connection schließen => bekommen wir das hier
	console.log("WS Closed", closeCode);
}

websocket.onmessage = (message) => { //gespräch läuft hier ab //
	console.log("WS Message", message);

	//newlines austauschen
	// message = message.data.replace(/\\n/g, "\\n")
	// 	.replace(/\\'/g, "\\'")
	// 	.replace(/\\"/g, '\\"')
	// 	.replace(/\\&/g, "\\&")
	// 	.replace(/\\r/g, "\\r")
	// 	.replace(/\\t/g, "\\t")
	// 	.replace(/\\b/g, "\\b")
	// 	.replace(/\\f/g, "\\f")
	// 	.replace(/[\u0000-\u0019]+/g, "");
	message = JSON.parse(message.data);
	console.log(message);
	const target = message.target;
	console.log(target);
	if (target === "connection.successfully") {
		console.log("connected");
		id = message.value;
		return;
	}
	if (target === "disconected"){// nächste target möglichkeit abarbeiten
		console.log("disconected");
		alert("Your Enemy disconected");
		reset();
		return;
	}
	if (target === "winner") {
		console.log("game Over");
		if (message.value === id) {
			document.getElementById("winner").innerHTML = "You've won!!!";
		}
		else if (message.value === "draw") {
			document.getElementById("winner").innerHTML = "Tie!";
		}
		else {
			document.getElementById("winner").innerHTML = "You've lost!!!";
		}
		return;
	}
	if (target === "fieldUpdated") {
		console.log("field updated");
		let x = message.value.x;
		let y = message.value.y;
		let stringPos = x.toString() + y.toString();
		if (field[x][y] === 0) {
			field[x][y] = id;
		}
		//überrüfen welches Bild dran ist
		for (let i = 0; i < field.length; i++){
			for (let j = 0; j < field.length; j++){
				if (field[i][j] === 0) {
					amountPlayed++;
				}
			}
		}
		if ((amountPlayed % 2) === 0) {
			document.getElementById(stringPos).innerHTML = imgPlayerOne;
		}
		else {
			document.getElementById(stringPos).innerHTML = imgPlayerTwo;
		}
		amountPlayed = 0;
		return;
	}

}

function ticTacToe(position) {
	const col = parseInt(position.charAt(1));;
	const row = parseInt(position.charAt(0));;
	axiosInstance.post('/ttt', (`{'x': ${row}, 'y': ${col}, id: ${id}}`))
		.catch((error) => { //abfragen was in der res.send message steht
			if (error === "Not your Turn") {
				alert("Wait for your Turn");
				return;
			}
			if (error === "Wrong Coordinates") {
				alert("Wrong Coordinates");
			}
	})
}




const axiosInstance = axios.create({
	baseURL: 'http://localhost:5000'
});

function selection(x) {
	let choice = x;
	if (x === "Scissors") {
		picture = "<img src='pictures/scissors.png'>";
	}
	else if (x === "Rock") {
		picture = "<img src='pictures/rock.png'>";
	}
	else if (x === "Paper") {
		picture = "<img src='pictures/paper.png'>";
	}

	let uname = document.getElementById("uname").value;

	document.getElementById("userChoice").innerHTML = picture;

	axiosInstance.post('/rps/userSelection', { "selection": choice, "username": uname })
		.then(({ data }) => {
			var picture;

			if (data.selection === "Scissors")
				picture = "<img src='pictures/scissors.png'>";
			else if (data.selection === "Rock")
				picture = "<img src='pictures/rock.png'>";
			else if (data.selection === "Paper")
				picture = "<img src='pictures/paper.png'>";

			document.getElementById("alexaChoice").innerHTML = picture;

			document.getElementById("result").innerHTML = data.result;
			if (uname)
				document.getElementById("score").innerHTML = "Your score against Alexa: " + data.score;
			else
				document.getElementById("score").innerHTML = "Insert a username to see your score against Alexa.";
		});
}

function jokeWithAPI() {
	axiosInstance.get('/jokeWithAPI', {})
		.then(({ data }) => {
			document.getElementById("joke").value = data;
		});
}

function jokeWithDatabase() {
	axiosInstance.get('/jokeWithDatabase', {})
		.then(({ data }) => {
			document.getElementById("joke").value = data;
		});
}

function newJoke() {
	let joke = document.getElementById("newJoke").value;

	if (joke == "")
		document.getElementById("jokeAdded").innerHTML = "Enter a joke first!";

	else {
		axiosInstance.post('/newJoke', { "joke": joke })
			.then(({ data }) => {
				document.getElementById("jokeAdded").innerHTML = data;
				document.getElementById("newJoke").value = "";
			});
	}
}

function reset() {
	field = [
		[0, 0, 0],
		[0, 0, 0],
		[0, 0, 0]
	];
	for (i = 0; i < field.length; i++){
		for (j = 0; j < field.length; j++){
			let row = i.toString();
			let col = j.toString();
			document.getElementById(row + col).innerHTML = "";
		}
	}
	document.getElementById("winner").innerHTML = "";
}