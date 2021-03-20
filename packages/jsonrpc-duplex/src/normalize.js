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
		name: '<duplex-anonymous>',
		methodMap: {},
		serialize: JSON.stringify,
		deserialize: JSON.parse,
		sendRequest: raw => raw,
		sendResponse: raw => raw,
		timeout: DEFAULT_INTERNAL_TIMEOUT,
		warn: () => {}
	};

	const {
		Id: _Id = options.Id,
		name: _name = options.name,
		methodMap: _methodMap = options.methodMap,
		serialize: _serialize = options.serialize,
		deserialize: _deserialize = options.deserialize,
		sendRequest: _sendRequest = options.sendRequest,
		sendResponse: _sendResponse = options.sendResponse,
		timeout: _timeout = options.timeout,
		warn: _warn = options.warn
	} = _options;

	if (typeof _name !== 'string') {
		throw new TypeError('The `options.name` MUST be a string.');
	}

	if (!(_methodMap instanceof Object) || _methodMap === null) {
		throw new TypeError('The `options.methodMap` MUST be an accessable object.');
	}

	for (const methodName in _methodMap) {
		if (typeof _methodMap[methodName] !== 'function') {
			throw new TypeError(`The \`options.methodMap.${methodName}\` MUST be a function.`);
		}
	}

	if (typeof _sendResponse !== 'function') {
		throw new TypeError('The `options.sendResponse` MUST be a function.');
	}

	if (typeof _serialize !== 'function') {
		throw new TypeError('The `options.serialize` MUST be a function.');
	}

	if (typeof _warn !== 'function') {
		throw new TypeError('The `options._warn` MUST be a function.');
	}

	if (typeof _deserialize !== 'function') {
		throw new TypeError('The `options.deserialize` MUST be a function.');
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

	options.Id = _Id;
	options.name = _name;
	options.methodMap = _methodMap;
	options.serialize = _serialize;
	options.deserialize = _deserialize;
	options.sendRequest = _sendRequest;
	options.sendResponse = _sendResponse;
	options.timeout = _timeout;
	options.warn = _warn;

	return options;
};
