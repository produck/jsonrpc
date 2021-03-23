'use strict';

const JsonRpc = require('../packages/jsonrpc');

const client = JsonRpc.Client({
	sendRequest: raw => server.handleRequest(raw)
});

const server = JsonRpc.Server({
	sendResponse: raw => client.handleResponse(raw),
	methodMap: {
		add: (numA, numB) => numA + numB
	}
});

(async function Example() {
	const result = await client.request('add', [4, 5]);

	console.log(result); // 9

	// To destroy the client to avoid memory leaking.
	// UNECESSARY to destroy after each `client.request()`;
	client.destroy();
}());
