'use strict';

const normalize = require('./normalize');
const Payload = require('../Payload');
const InvokingRegistry = require('./InvokingRegistry');
const BatchProvider = require('./Batch');
const utils = require('../utils');

module.exports = function Client(options) {
	const finalOptions = normalize(options);
	const { Id, sendRequest, serialize, deserialize, timeout, warn } = finalOptions;
	const invokingRegistry = InvokingRegistry(timeout);

	const context = {
		send(payload) {
			sendRequest(serialize(payload));
		},
		register(invoking) {
			return invokingRegistry.put(invoking);
		},
		Id: Id
	};

	const Batch = BatchProvider(context);

	function Caller(hasId, callback = () => {}) {
		return function call(method, params) {
			if (typeof method !== 'string') {
				throw new TypeError('The `method` MUST be a string');
			}

			if (!utils.isValidParams(params) && params !== undefined) {
				throw new TypeError('The `params` MUST be an array or a plain object.');
			}

			const payload = Payload.Request(method, params, hasId ? context.Id() : undefined);

			context.send(payload);

			if (hasId) {
				return callback(payload);
			}
		};
	}

	return {
		request: Caller(true, invoking => context.register(invoking)),
		notificate: Caller(false),
		handleResponse(raw) {
			const response = deserialize(raw);

			if (Array.isArray(response)) {
				const responseList = response;

				responseList.forEach(response => {
					if (!utils.isValidResponse(response)) {
						return warn(raw);
					}

					invokingRegistry.end(response);
				});
			} else if (utils.isValidResponse(response)) {
				invokingRegistry.end(response);
			} else {
				return warn(raw);
			}
		},
		batch() {
			return Batch();
		},
		get name() {
			return finalOptions.name;
		},
		destroy() {
			invokingRegistry.destroy();
		}
	};
};
