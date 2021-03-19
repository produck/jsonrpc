'use strict';

module.exports = function normalize(_options = {}) {
	const options = {
		name: '<server-anonymous>',
		methodMap: {},
		serialize: JSON.stringify,
		deserialize: JSON.parse,
		sendResponse: raw => raw,
		warn: () => {}
	};

	const {
		name: _name = options.name,
		methodMap: _methodMap = options.methodMap,
		sendResponse: _sendResponse = options.sendResponse,
		serialize: _serialize = options.serialize,
		deserialize: _deserialize = options.deserialize,
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

	options.name = _name;
	options.methodMap = _methodMap;
	options.sendResponse = _sendResponse;
	options.serialize = _serialize;
	options.deserialize = _deserialize;
	options.warn = _warn;

	return options;
};
