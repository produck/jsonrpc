const Client = require('../src/Client');
const Server = require('../src/Server');

const client = Client({
	sendRequest: raw => {
		console.log('<< ', raw);
		server.handleRequest(raw);
	}
});

const server = Server({
	methodMap: {
		ping() {
			return 3;
		}
	},
	sendResponse: raw => {
		console.log('>> ', raw);
		client.handleResponse(raw);
	}
});

(async function debug() {
	const result = await client.request('ping');

	client.notificate('ping');
	client.notificate('pong');

	console.log(result);

	try {
		await client.request('notExisted');
	} catch (error) {
		console.log(error);
	}

	try {
		await client.batch()
			.notificate('ping')
			.notificate('ping')
			.request('ping', (err, result) => console.log(err, result))
			.request('pong', (err, result) => console.log(err, result))
			.send();
	} catch (error) {
		console.log(error);
	}

	client.destroy();
}());