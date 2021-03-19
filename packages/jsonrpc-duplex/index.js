'use strict';

const JsonRpc = require('@produck/jsonrpc');
const normalize = require('./src/normalize');

module.exports = function ProduckJsonRpcDuplexPeer(options) {
	const finalOptions = normalize(options);

	const client = JsonRpc.Client({
		Id: finalOptions.Id,
		name: finalOptions.name,
		serialize: finalOptions.serialize,
		deserialize: finalOptions.deserialize,
		sendRequest: finalOptions.sendRequest,
		timeout: finalOptions.timeout,
		warn: finalOptions.warn
	});

	const server = JsonRpc.Server({
		name: finalOptions.name,
		methodMap: finalOptions.methodMap,
		serialize: finalOptions.serialize,
		deserialize: finalOptions.deserialize,
		sendResponse: finalOptions.sendResponse,
		warn: finalOptions.warn
	});

	return {
		get name() {
			return finalOptions.name;
		},
		request(method, params) {
			return client.request(method, params);
		},
		notification(method, params) {
			client.notificate(method, params);
		},
		batch() {
			return client.batch();
		},
		handleResponse(raw) {
			client.handleResponse(raw);
		},
		handleRequest(raw) {
			server.handleRequest(raw);
		},
		destroy() {
			client.destroy();
		}
	};
};
