'use strict';

function isValidId(id) {
	return typeof id === 'string' || typeof id === 'number';
}

exports.isValidId = isValidId;

exports.isValidRequest = function isRequest(request) {
	if (typeof request !== 'object') {
		return false;
	}

	const {jsonrpc, method, id} = request;

	if (jsonrpc !== '2.0') {
		return false;
	}

	if (typeof method !== 'string') {
		return false;
	}

	if (id !== undefined && !isValidId(id)) {
		return false;
	}

	return true;
};

exports.isValidParams = function isValidParams(params) {
	if (Array.isArray(params)) {
		return true;
	}

	if ((typeof params === 'object') && params !== null) {
		return true;
	}

	return false;
};

function isValidErrorCodeNumber(code) {
	return (-32099 <= code && code <= -32000) ||
		code === -32700 || code === -32600 || code === -32601 ||
		code === -32602 || code === -32603;
}

function isRpcError(obj) {
	return typeof obj.message === 'string' &&
		typeof obj.code === 'number' &&
		isValidErrorCodeNumber(obj.code);
}

exports.isRpcError = isRpcError;

exports.isValidBatchRequest = function isValidBatchRequest(request) {
	return Array.isArray(request) && request.length > 0;
};

function isValidResponse20(response) {
	if (response.jsonrpc !== '2.0') {
		return false;
	}

	if (response.id === undefined && !isValidId(response.id) && response.id !== null) {
		return false;
	}

	if (response.error !== undefined) {
		const { error } = response;

		if (!isRpcError(error)) {
			return false;
		}

		if (response.result !== undefined) {
			return false;
		}
	}

	if (response.result !== undefined && response.error !== undefined) {
		return false;
	}

	return true;
}

exports.isValidResponse20 = isValidResponse20;
exports.isValidResponse = isValidResponse20;