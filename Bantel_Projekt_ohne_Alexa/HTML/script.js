//Hier werden das Kreuz und der Kreis in Variablen gespeichert um diese später zuzuweisen
var imgPlayerOne = "<img src='pictures/cross.png'>";
var imgPlayerTwo = "<img src='pictures/circle.png'>";
//Hier wird ein zweidimensionales Array angelegt, damit der Nutzer weiß wie das Tic Tac Toe Spiel aussieht
var field = [
	[0, 0, 0],
	[0, 0, 0],
	[0, 0, 0]
];
//Hier wird eine Variable angelegt, diese benötigen wir damit wir wissen wann ein Kreuz und ein Kreis angezeigt werden soll
var amountPlayed = 0;
//Hier wird die User Id eingespeichert. Diese bekommen wir vom Server zugesendet
var id;

//Verbindung zu unserem Websocket Server im Backend in der Logic/server.js aufgebaut
//Wenn man einen server hat, kommt dort wo ${window.location.hostname} steht die IP des Servers
const websocket = new WebSocket(`ws://${window.location.hostname}:8080`);

//Wenn wir die Verbindung öffnen bekommen wir in der Konsole ausgebene das wir verbunden sind
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


//Hier Laufen die Websocket-Gespräche ab
websocket.onmessage = (message) => {
	//Nachricht vom Server wird geparsed damit wir sie überprüfen können
	console.log("WS Message", message);
	message = JSON.parse(message.data);
	console.log(message);
	const target = message.target;
	console.log(target);

	//Nachrichten werden verglichen
	//Nachricht wenn wir uns verbinden
	if (target === "connection.successfully") {
		console.log("connected");
		//User bekommt die Nachricht dass er verbunden ist
		alert("You are connected")
		reset(true);
		//Id die vom Server gesendet wird, wird gespeichert
		id = message.value;
		return;
	}

	//Nachricht Gegner ist verbunden
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

	//Wenn der Server festellt wer gewonnen hat
	if (target === "winner") {
		console.log("game Over");
		//Verhindern das noch mehr Divs angedrückt werden können
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
			document.getElementById("winner").innerHTML = "You win!";
		}
		else if (message.value === -1) {
			document.getElementById("winner").innerHTML = "Tie!";
		}
		else {
			document.getElementById("winner").innerHTML = "You lose!";
		}
		res.send("Game Over");
		return;
	}
	//Wenn das Feld geupdated wird
	if (target === "fieldUpdated") {
		console.log("field updated");
		//Position die der Server sendet umwandeln und an die richtige Stelle die Id des Users setzen
		let x = message.value.x;
		let y = message.value.y;
		let stringPos = x.toString() + y.toString();
		if (field[x][y] === 0) {
			field[x][y] = id;
		}
		//Überrüfen, welches Bild dran ist, gerade Züge ist Kreuz, ungerade Züge ist Kreis
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
	//Wenn einer von beiden Spieler das Feld resetten möchte
	if (target === "resetPLS") {
		reset(false);
	}
}

//HTTP Server verbinden
//Wenn man einen server hat, kommt dort wo ${window.location.hostname} steht die IP des Servers
const axiosInstance = axios.create({
	baseURL: `http://${window.location.hostname}:5000`
});

//Schere Stein Papier Auswahl anhand des Buttons
function selection(x) {
	// Buttons werden während der Funktion disabled
	document.getElementById("button1").disabled = true;
	document.getElementById("button2").disabled = true;
	document.getElementById("button3").disabled = true;
	document.getElementById("uname").readOnly = true;

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

	//Username abspeichern
	let uname = document.getElementById("uname").value;

	//Auswahl des Users als Bild an sein Feld senden zum Anzeigen
	document.getElementById("userChoice").innerHTML = picture;

	//Die Auswahl und den Usernamen per HTTP senden
	axiosInstance.post('/rps/userSelection', { "selection": choice, "username": uname })
		//Antwort vom Server
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

			//Ergebnis ausgeben
			document.getElementById("result").innerHTML = data.result;
			if (uname)
				document.getElementById("score").innerHTML = "Your score against the computer: " + data.score;
			else
				document.getElementById("score").innerHTML = "Insert a username to see your score against the computer.";

			//Buttons werden wieder aktiviert
			document.getElementById("button1").disabled = false;
			document.getElementById("button2").disabled = false;
			document.getElementById("button3").disabled = false;
			document.getElementById("uname").readOnly = false;
		});
}

//Witze mit API ausgeben
function jokeWithAPI() {
	//Vom Server einen Witz abrufen
	axiosInstance.get('/jokeWithAPI', {})
		//Ergebnis das ausgewählt wird
		.then(({ data }) => {
			//Ergebnis ausgeben
			document.getElementById("joke").value = data;
		});
}

//Witz mit Datenbank
function jokeWithDatabase() {
	//Witz aus der Datenbank ausgeben
	axiosInstance.get('/jokeWithDatabase', {})
		//Ergebnis das ausgewählt wird
		.then(({ data }) => {
			//Ergebnis ausgeben
			document.getElementById("joke").value = data;
		});
}

//Neuen Witz in die Datenbank speichern
function newJoke() {
	//Aus dem Eingabefeld den Text einspeichern
	let joke = document.getElementById("newJoke").value;

	//Fehler falls Feld leer ist
	if (joke == "")
		document.getElementById("jokeAdded").innerHTML = "Enter a joke first!";

	//Wenn etwas im Feld steht
	else {
		//Neuen Witz an den Server senden
		axiosInstance.post('/newJoke', { "joke": joke })
			//Ergebnis ob es geklappt hat ausgeben und das Textfeld resetten
			.then(({ data }) => {
				document.getElementById("jokeAdded").innerHTML = data;
				document.getElementById("newJoke").value = "";
			});
	}
}

//Die Position die der Nutzer auswählt an den Server senden
function ticTacToe(position) {
	//Position abspeichern
	const col = parseInt(position.charAt(1));;
	const row = parseInt(position.charAt(0));;
	//An den Server die Position an die geclickt wurde und die Nutzer Id senden
	axiosInstance.post('/ttt', {x: row, y: col, id: id})
		.catch((error) => { 
			//Abfragen was in der res.send message steht
			console.log(error.response.data);
			//Fehlermeldungen falls man nicht am Zug ist, ein falsches Feld auswählt oder das Spiel schon vorbei ist
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

//Setzt das Tic Tac Toe auf den Anfang des Spieles zurück
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