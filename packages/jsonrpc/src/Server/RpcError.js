'use strict';

module.exports = Object.assign(function RpcError(code, message, data) {
	const error = new Error(message);

	error.name = 'JsonRpcServerError';
	error.code = code;
	error.data = data;

	error.toJSON = () => ({ code, message, data });

	return error;
}, {
	PARSE_ERROR: Object.freeze({ code: -32700, message: 'Parse error' }),
	INVALID_REQUEST: Object.freeze({ code: -32600, message: 'Invalid Request' }),
	METHOD_NOT_FOUND: Object.freeze({ code: -32601, message: 'Method not found' }),
	INVALID_PARAMS: Object.freeze({ code: -32602, message: 'Invalid params' }),
	INTERNAL_ERROR: Object.freeze({ code: -32603, message: 'Internal error' })
});