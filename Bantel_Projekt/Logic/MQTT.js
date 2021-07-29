import {connect} from 'mqtt';
var client = connect('mqtt://test.mosquitto.org')
console.log("Zeile 3 erreicht")

client.on('connect', function () { //verbindung erzeugen
	client.subscribe('presence', function (err) {
		if (!err) {
			client.publish('presence', 'Hello mqtt')
		}
	})
})



// client.on('close', function () {
// 	console.log("close Function")
// 	//schließen der verbindug
// })

// client.end();//beendet die verbindung

client.on('message', function (topic, message) {
	// maybe für die alexa kommunikation
	//eine If um für Witze und Schere Stein Papier
	console.log(message.toString())
	client.end()
})