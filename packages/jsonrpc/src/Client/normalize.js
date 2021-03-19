'use strict';

const DEFAULT_INTERNAL_TIMEOUT = 60 * 1000;

function DefaultIdGenerator() {
	let counter = 0;

	return function Id() {
		return counter++;
	};
}

module.exports = function normalize(_options = {}) {
	const options = {
		Id: DefaultIdGenerator(),
		name: '<client-anonymous>',
		serialize: JSON.stringify,
		deserialize: JSON.parse,
		sendRequest: raw => raw,
		timeout: DEFAULT_INTERNAL_TIMEOUT,
		warn: function warn() {
			console.warn('@product/jsonrpc: invalid response detected.');
		}
	};

	const {
		Id: _Id = options.Id,
		name: _name = options.name,
		sendRequest: _sendRequest = options.sendRequest,
		timeout: _timeout = options.timeout,
		serialize: _serialize = options.serialize,
		deserialize: _deserialize = options.deserialize,
		warn: _warn = options.warn
	} = _options;

	if (typeof _name !== 'string') {
		throw new TypeError('The `options.name` MUST be a string.');
	}

	if (typeof _Id !== 'function') {
		throw new TypeError('The `options.Id` MUST be a function.');
	}

	if (typeof _sendRequest !== 'function') {
		throw new TypeError('The `options.sendRequest` MUST be a function.');
	}

	if ((typeof _timeout !== 'number') || _timeout < 10) {
		throw new TypeError('The `options.timout` MUST be a integer and >10.');
	}

	if (typeof _serialize !== 'function') {
		throw new TypeError('The `options.serialize` MUST be a function.');
	}

	if (typeof _deserialize !== 'function') {
		throw new TypeError('The `options.deserialize` MUST be a function.');
	}

	if (typeof _warn !== 'function') {
		throw new TypeError('The `options.warn` MUST be a function.');
	}

	options.Id = _Id;
	options.sendRequest = _sendRequest;
	options.timeout = _timeout;
	options.serialize = _serialize;
	options.deserialize = _deserialize;
	options.name = _name;
	options.warn = _warn;

	return options;
};
