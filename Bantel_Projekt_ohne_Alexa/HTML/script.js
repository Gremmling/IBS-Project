var options = ['Schere', 'Stein', 'Papier'];
var max = 2;
var min = 0;

var playerOne = 1;
var playerTwo = 2;
var currentPlayer = 1;
var imgPlayerOne = "<img src='pictures/cross.png'>";
var imgPlayerTwo = "<img src='pictures/circle.png'>";
var field = [
	[0, 0, 0],
	[0, 0, 0],
	[0, 0, 0]
];
var turn = 0;

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

function tickTacToe(position) {
	let row = parseInt(position.charAt(0));
	let col = parseInt(position.charAt(1));
	if (field[row][col] != 0) {
		return;
	}
	field[row][col] = currentPlayer;
	turn++;
	if (currentPlayer == 1) {
		document.getElementById(position).innerHTML = imgPlayerOne;
		currentPlayer = 2;
	}
	else{
		document.getElementById(position).innerHTML = imgPlayerTwo;
		currentPlayer = 1;
	}
	let winner = win();
	if (winner > 0) {
		console.log("Winner is:" + winner);
	}
	else if (turn === 9) {
		console.log("Unentschieden");
	}
}

function reset() {
	field = [
		[0, 0, 0],
		[0, 0, 0],
		[0, 0, 0]
	];
	currentPlayer = 1;
	for (i = 0; i < field.length; i++){
		for (j = 0; j < field.length; j++){
			let row = i.toString();
			let col = j.toString();
			document.getElementById(row + col).innerHTML = "";
		}
	}
}

function win() {
	for (i = 0; i < field.length; i++){
		let posRow = '';
		let posCol = '';
		for (j = 0; j < field.length; j++){
			posRow = posRow + field[i][j].toString();
			posCol = posCol + field[j][i].toString();
		}
		let winRow = winCondition(posRow);
		let winCol = winCondition(posCol);
		if (winRow > 0) {
			return winRow;
		}
		else if(winCol > 0) {
			return winCol;
		}
	}

	let dia01 = winCondition(field[0][0].toString() + field[1][1].toString() + field[2][2].toString());
	let dia02 = winCondition(field[0][2].toString() + field[1][1].toString() + field[2][0].toString());
	if (dia01 > 0) {
		return dia01;
	}
	else if (dia02 > 0) {
		return dia02;
	}
}


function winCondition(pos) {
	if (pos === '111') {
		return 1;
	}
	else if (pos === '222') {
		return 2;
	}
	else {
		return 0;
	}
}