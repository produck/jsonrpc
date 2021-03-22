'use strict';

const JsonRpc = require('@produck/jsonrpc');
const normalize = require('./src/normalize');

function ProduckJsonRpcDuplexPeer(options) {
	const finalOptions = normalize(options);

	const context = {
		alive: true,
		client: JsonRpc.Client({
			Id: finalOptions.Id,
			name: finalOptions.name,
			serialize: finalOptions.serialize,
			deserialize: finalOptions.deserialize,
			sendRequest: finalOptions.sendRequest,
			timeout: finalOptions.timeout,
			warn: finalOptions.warn
		}),
		server: JsonRpc.Server({
			name: finalOptions.name,
			methodMap: finalOptions.methodMap,
			serialize: finalOptions.serialize,
			deserialize: finalOptions.deserialize,
			sendResponse: finalOptions.sendResponse,
			warn: finalOptions.warn
		})
	};

	function WrapAssertDestroy(callback) {
		return function method(...args) {
			if (context.alive === false) {
				throw new Error('The jsonrpc duplex peer has been destroyed.');
			}

			return callback(...args);
		};
	}

	return {
		get name() {
			return finalOptions.name;
		},
		request: WrapAssertDestroy((method, params) => {
			return context.client.request(method, params);
		}),
		notification: WrapAssertDestroy((method, params) => {
			context.client.notificate(method, params);
		}),
		batch: WrapAssertDestroy(() => {
			return context.client.batch();
		}),
		handleResponse: WrapAssertDestroy((raw) => {
			context.client.handleResponse(raw);
		}),
		handleRequest: WrapAssertDestroy((raw) => {
			context.server.handleRequest(raw);
		}),
		destroy: WrapAssertDestroy(() => {
			context.client.destroy();
			context.alive = false;
		})
	};
}

module.exports = {
	DuplexPeer: ProduckJsonRpcDuplexPeer,
	Client: JsonRpc.Client,
	Server: JsonRpc.Server
};
