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

	axiosInstance.post('/rpc/userSelection', { "selection": choice })
		.then(({ data }) => {
			var picture;
			var result = "<h1>You win!</h1>";

			if (data === "Schere")
				picture = "<img src='pictures/scissors.png'>";
			else if (data === "Stein")
				picture = "<img src='pictures/rock.png'>";
			else if (data === "Papier")
				picture = "<img src='pictures/paper.png'>";

			document.getElementById("alexaChoice").innerHTML = picture;

			if ((x === "Schere" && data === "Stein") || (x === "Stein" && data === "Papier") || (x === "Papier" && data === "Schere"))
				result = "<h1>You lose!</h1>";

			else if (x === data)
				result = "<h1>Tie!</h1>";

			document.getElementById("result").innerHTML = result;
		});
}

function joke(){
	axiosInstance.get('/joke', {})
		.then(({ data }) => {
			document.getElementById("joke").value = data;
		});
}