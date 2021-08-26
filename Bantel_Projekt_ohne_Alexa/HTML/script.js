// Hier werden das Kreuz und der Kreis in variablen gespeichert um diese Später zuzweisen
var imgPlayerOne = "<img src='pictures/cross.png'>";
var imgPlayerTwo = "<img src='pictures/circle.png'>";
//hier wird ein zweidimensionales Array angelegt, damit der Nutzer weiß wie das Tic Tac Toe spiel aussieht
var field = [
	[0, 0, 0],
	[0, 0, 0],
	[0, 0, 0]
];
//hier wird eine Variable angelegt, diese benötigen wir damit wir wissen wann ein Kreuz und ein Kreis angezeigt werden soll
var amountPlayed = 0;
//hier wird die User Id eingespeichert. Diese bekommen wir vom Server zugesendent
var id;

//Verbindung zu unserem Websocket Server im Backend in der Logic/server.js aufgebaut
//wenn man einen server hat, kommt dort wo ${window.location.hostname} steht die IP des Servers
const websocket = new WebSocket(`ws://${window.location.hostname}:8080`);

//wenn wir die Verbindung öffnen bekommen wir in der Konsole ausgebene das wir verbunden sind
websocket.onopen = () => {
	console.log("Connected to WS Server");
}

//Im Falle das die Verbindung fehlschlägt
websocket.onerror = (err) => {
	console.log(err.constructor);
	console.log("WS Error", err);
}

//Verbindung wird geschlossen
websocket.onclose = (closeCode) => {
	console.log("WS Closed", closeCode);
}


//Hier Laufen die Websocket gespräche ab
websocket.onmessage = (message) => {
	//die Nachricht vom Server wird geparsed damit wir sie überprüfen können
	console.log("WS Message", message);
	message = JSON.parse(message.data);
	console.log(message);
	const target = message.target;
	console.log(target);

	//Nachrichten werden verglichen
	//Nachricht wenn wir uns verbinden
	if (target === "connection.successfully") {
		console.log("connected");
		//User bekommt die Nachricht das er verbunden ist
		alert("You are connected")
		reset(true);
		//Id die vom Server gesendet wird, wird gespeichert
		id = message.value;
		return;
	}

	//Nachricht gegner ist verbunden
	if (target === "opponent connected") {
		alert("Opponent is connected");
		return;
	}

	//Nachricht Gegner ist nicht mehr verbunden
	if (target === "disconected"){
		console.log("disconected");
		alert("Opponent is disconected");
		reset(true);
		return;
	}

	// wenn der Server festellt wer gewonnen hat
	if (target === "winner") {
		console.log("game Over");
		//verhindern das noch mehr Divs angedrückt werden können
		for (var i = 0; i < field.length; i++){
			for (var j = 0; j < field.length; j++){
				let row = i.toString();
				let col = j.toString();
				document.getElementById(row + col).style.pointerEvents = "none";
			}
		}
		console.log("hab sie disabled");
		//Ausgabe wer gewonnen hat
		if (message.value === id) {
			document.getElementById("winner").innerHTML = "You've won!!!";
		}
		else if (message.value === -1) {
			document.getElementById("winner").innerHTML = "Tie!";
		}
		else {
			document.getElementById("winner").innerHTML = "You've lost!!!";
		}
		res.send("Game Over");
		return;
	}
	//Wenn das Feld geupdated wird
	if (target === "fieldUpdated") {
		console.log("field updated");
		//position die der Server senden umwandeln und an die richtige Stelle die Id des Users setzen
		let x = message.value.x;
		let y = message.value.y;
		let stringPos = x.toString() + y.toString();
		if (field[x][y] === 0) {
			field[x][y] = id;
		}
		//überrüfen welches Bild dran ist, grade züge = kreuz, ungerade = kreis
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
	//wenn einer von beiden Spieler das feld reseten möchte
	if (target === "resetPLS") {
		reset(false);
	}

}

//HTTP Server verbinden
//wenn man einen server hat, kommt dort wo ${window.location.hostname} steht die IP des Servers
const axiosInstance = axios.create({
	baseURL: `http://${window.location.hostname}:5000`
});

//Schere Stein Papier auswahl anhand des Buttons
function selection(x) {
	let choice = x;
	//Bilder für die jeweilige Wahl speichern
	if (x === "Scissors") {
		picture = "<img src='pictures/scissors.png'>";
	}
	else if (x === "Rock") {
		picture = "<img src='pictures/rock.png'>";
	}
	else if (x === "Paper") {
		picture = "<img src='pictures/paper.png'>";
	}

	//username abspeichern
	let uname = document.getElementById("uname").value;

	//Auswahl des Users als Bild an sein Feld senden zur Anzeigen
	document.getElementById("userChoice").innerHTML = picture;

	//Die Auswahl und den Usernamen per HTTP senden
	axiosInstance.post('/rps/userSelection', { "selection": choice, "username": uname })
		//antwort vom Server
		//Data ist das was der server ausgewählt hat und wer gewonnen hat
		.then(({ data }) => {
			var picture;
			//Bild speichern
			if (data.selection === "Scissors")
				picture = "<img src='pictures/scissors.png'>";
			else if (data.selection === "Rock")
				picture = "<img src='pictures/rock.png'>";
			else if (data.selection === "Paper")
				picture = "<img src='pictures/paper.png'>";

			//Bild setzen
			document.getElementById("alexaChoice").innerHTML = picture;

			//ergebnis ausgeben
			document.getElementById("result").innerHTML = data.result;
			if (uname)
				document.getElementById("score").innerHTML = "Your score against Alexa: " + data.score;
			else
				document.getElementById("score").innerHTML = "Insert a username to see your score against Alexa.";
		});
}


//Witze mit API ausgeben
function jokeWithAPI() {
	//Vom server einen witz abrufen
	axiosInstance.get('/jokeWithAPI', {})
		//ergebnis das ausgewählt wird
		.then(({ data }) => {
			//ergebnis ausgeben
			document.getElementById("joke").value = data;
		});
}

//Witz mit Datenbank
function jokeWithDatabase() {
	//Witz aus der Datenbank ausgeben
	axiosInstance.get('/jokeWithDatabase', {})
		//ergebnis das ausgewählt wird
		.then(({ data }) => {
			//ergebnis ausgeben
			document.getElementById("joke").value = data;
		});
}

//einen neuen Witz in die Datenbank speichern
function newJoke() {
	//aus dem eingabe feld den Text einspeichern
	let joke = document.getElementById("newJoke").value;

	//fehler fals Feld leer ist
	if (joke == "")
		document.getElementById("jokeAdded").innerHTML = "Enter a joke first!";

	//Wenn etwas im feld steht
	else {
		//neuen witz an den Server senden
		axiosInstance.post('/newJoke', { "joke": joke })
			//erbebnis ob es geklappt hat ausgeben und das Textfeld reseten
			.then(({ data }) => {
				document.getElementById("jokeAdded").innerHTML = data;
				document.getElementById("newJoke").value = "";
			});
	}
}

//Die Position die der Nutzer auswählt an den Server senden
function ticTacToe(position) {
	//position abspeichern
	const col = parseInt(position.charAt(1));;
	const row = parseInt(position.charAt(0));;
	//an den Server die Position an die geclickt wurde und die Nutzer Id senden
	axiosInstance.post('/ttt', {x: row, y: col, id: id})
		.catch((error) => { //abfragen was in der res.send message steht
			console.log(error.response.data);
			//Fehlermeldungen fals man nicht am Zug ist, ein Falsches Feld auswählt oder das Spiel schon vorbei ist
			if (error.response.data === "Not your Turn") {
				alert("Wait for your Turn");
				return;
			}
			if (error.response.data === "Wrong Coordinates") {
				alert("Wrong Coordinates");
			}
			if (error.response.data === "Game Over") {
				alert("Game is already over");
			}
	})
}


//Setzt das Tic Tac Toe auf den anfang des Spieles zurück
function reset(post) {
	field = [
		[0, 0, 0],
		[0, 0, 0],
		[0, 0, 0]
	];
	for (var i = 0; i < field.length; i++){
		for (var j = 0; j < field.length; j++){
			let row = i.toString();
			let col = j.toString();
			document.getElementById(row + col).style.pointerEvents = "";
			document.getElementById(row + col).innerHTML = "";
		}
	}
	document.getElementById("winner").innerHTML = "";
	if (post) {
		axiosInstance.post('/ttt/reset', { target: "reset", id: id })
	}
}