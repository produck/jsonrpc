'use strict';

function PayloadRequest20(method, params, id) {
	return { jsonrpc: '2.0', method, params, id };
}

function PayloadResponse20(id, error, result) {
	return { jsonrpc: '2.0', id, error, result };
}

module.exports = {
	Request20: PayloadRequest20,
	Request: PayloadRequest20,
	Response20: PayloadResponse20,
	Response: PayloadResponse20
};
