'use strict';

const normalize = require('./normalize');
const RpcError = require('./RpcError');
const utils = require('../utils');
const Caller = require('./Caller');
const Payload = require('../Payload');

module.exports = function Server(options) {
	const finalOptions = normalize(options);
	const { sendResponse, methodMap, serialize, deserialize, warn } = finalOptions;
	const call = Caller(methodMap, warn);

	function parse(raw) {
		try {
			return deserialize(raw);
		} catch (error) {
			warn(error);

			return null;
		}
	}

	const RequestHandler = {
		async Batch(requestList) {
			if (!utils.isValidBatchRequest(requestList)) {
				return Payload.Response(null, RpcError.INVALID_REQUEST);
			}

			const responseList = [];
			const requestBundle = requestList.map(async request => {
				const response = await call(request);

				if (response !== null) {
					responseList.push(response);
				}
			});

			await Promise.all(requestBundle);

			return responseList.length > 0 ? responseList : null;
		},
		async One(request) {
			if (!utils.isValidRequest(request)) {
				return Payload.Response(null, RpcError.INVALID_REQUEST);
			}

			return await call(request);
		}
	};

	async function handleRequest(raw) {
		/**
		 * - It MUST NOT throw any exception in handleRequest.
		 * - It means invalid request if `request === null`.
		 */
		const request = parse(raw);

		const response = request === null
			? Payload.Response(null, RpcError.PARSE_ERROR)
			: Array.isArray(request)
				? await RequestHandler.Batch(request)
				: await RequestHandler.One(request);

		if (response !== null) {
			const responseRaw = serialize(response);

			sendResponse(responseRaw);

			return responseRaw;
		}
	}

	return {
		handleRequest,
		get name() {
			return finalOptions.name;
		}
	};
};
