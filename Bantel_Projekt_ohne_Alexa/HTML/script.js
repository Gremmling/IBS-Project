var options = ['Schere', 'Stein', 'Papier'];
var max = 2;
var min = 0;
var randomNumber = 0;

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

	let uname = document.getElementById("uname").value;

	document.getElementById("userChoice").innerHTML = picture;

	axiosInstance.post('/rps/userSelection', { "selection": choice, "username": uname })
		.then(({ data }) => {
			console.log(data);
			
			var picture;

			randomNumber = (Math.random() * (max - min)) + min;

			if (data.selection === "Schere")
				picture = "<img src='pictures/scissors.png'>";
			else if (data.selection === "Stein")
				picture = "<img src='pictures/rock.png'>";
			else if (data.selection === "Papier")
				picture = "<img src='pictures/paper.png'>";

			document.getElementById("alexaChoice").innerHTML = picture;

			document.getElementById("result").innerHTML = data.result;
			document.getElementById("score").innerHTML = "Your score against Alexa: " + data.score;
		});
}

function joke(){
	axiosInstance.get('/joke', {})
		.then(({ data }) => {
			document.getElementById("joke").value = data;
		});
}