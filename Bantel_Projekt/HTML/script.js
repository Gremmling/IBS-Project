const axiosInstance = axios.create({
	baseURL: 'http://localhost:5000'
});

function selection(x) {
	let choice = x;
	if (x === "Schere") {
		picture = "<img src='pictures/scissors.png'>";
	}
	else if (x === "Stein") {
		picture = "<img src='pictures/rock.png'>";
	}
	else if (x === "Papier") {
		picture = "<img src='pictures/paper.png'>";
	}

	document.getElementById("userChoice").innerHTML = picture;

	axiosInstance.post('/rps/userSelection', { "selection": choice })
		.then(({ data }) => {
			var picture;
			var result;

			if (data[1] === "Schere")
				picture = "<img src='pictures/scissors.png'>";
			else if (data[1] === "Stein")
				picture = "<img src='pictures/rock.png'>";
			else if (data[1] === "Papier")
				picture = "<img src='pictures/paper.png'>";

			if (data[0] === "Ist das gleiche, also Unentschieden.") {
				result = "<h1>Tie!</h1>";
			}
			else if (data[0] === "Du hast gewonnen.") {
				result = "<h1>You win!</h1>";
			}
			else if (data[0] === "Ich habe gewonnen.") {
				result = "<h1>You lose!</h1>";
			}

			document.getElementById("alexaChoice").innerHTML = picture;
			document.getElementById("result").innerHTML = result;
		});
}

function joke(){
	axiosInstance.get('/joke', {})
		.then(({ data }) => {
			document.getElementById("joke").value = data;
		});
}