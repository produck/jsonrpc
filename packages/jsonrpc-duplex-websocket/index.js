'use strict';

const JsonRpc = require('@produck/jsonrpc-duplex');
const normalize = require('./src/normalize');

module.exports = function JsonRpcDuplexSocketPeer(options) {
	const finalOptions = normalize(options);
	const peer = JsonRpc.DuplexPeer();

	function handleRequest(raw) {
		peer.handleRequest(raw);
	}

	function handleResponse(raw) {
		peer.handleResponse(raw);
	}

	return {
		request() {

		},
		notification() {

		},
		batch() {

		},
		destroy() {
			peer.destroy();
			finalOptions.close();
		}
	};
};
