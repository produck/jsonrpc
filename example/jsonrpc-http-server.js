'use strict';

const JsonRpc = require('../packages/jsonrpc');
const http = require('http');

const server = JsonRpc.Server({
	methodMap: {
		add: (a, b) => a + b
	}
});

function getPayloadData(stream) {
	return new Promise((resolve, reject) => {
		let data = Buffer.from([]);

		stream.on('data', chunk => {
			data = Buffer.concat([
				data, chunk
			], data.length + chunk.length);
		}).on('end', () => resolve(data));
	});
}

http.createServer(async function JsonRpcRequestListener(req, res) {
	const requestBody = await getPayloadData(req);
	const responseRaw = await server.handleRequest(requestBody.toString());

	res.setHeader('Content-Type', 'application/json');
	res.end(responseRaw);
}).listen(8080);

// Use a http client tool like "Postman" to send POST request.
//
// >>>>
// POST http://127.0.0.1:8080
// {"jsonrpc":"2.0","id":2,"method":"add","params":[3,4]}
//
// <<<<
// {"jsonrpc":"2.0","id":2,"result":7}
