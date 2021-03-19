'use strict';

const utils = require('../utils');
const RpcError = require('./RpcError');
const Payload = require('../Payload');

module.exports = function JsonRpcServerCaller(methodMap, onError = () => {}) {
	const HandlerQueue = [
		function validateRequestAndResolveId(ctx, request) {
			if (!utils.isValidRequest(request)) {
				ctx.id = null;
				ctx.error = RpcError.INVALID_REQUEST;
			} else {
				ctx.id = request.id;
				ctx.notification = request.id === undefined;
			}
		},
		function pickMethod(ctx, request) {
			const method = methodMap[request.method];

			if (typeof method !== 'function') {
				ctx.error = RpcError.METHOD_NOT_FOUND;
			} else {
				ctx.method = method;
			}
		},
		function validateParamsAndCreateMethodProxy(ctx, request) {
			const { params } = request;

			if (params === undefined) {
				ctx.methodProxy = () => ctx.method();
			} else if (Array.isArray(params)) {
				ctx.methodProxy = () => ctx.method.apply(undefined, params);
			} else if (typeof params === 'object') {
				ctx.methodProxy = () => ctx.method(params);
			} else {
				ctx.error = RpcError.INVALID_PARAMS;
			}
		},
		async function invoke(ctx) {
			try {
				ctx.result = await ctx.methodProxy();
			} catch (serverError) {
				if (utils.isRpcError(serverError)) {
					/**
					 * Reserved for implementation-defined server-errors.
					 * https://www.jsonrpc.org/specification#error_object
					 */
					const { code, message, data } = serverError;

					ctx.error = RpcError(code, message, data);
				} else {
					onError(serverError);

					throw serverError;
				}
			}
		}
	];

	return async function call(request) {
		const ctx = {
			notification: false,
			id: undefined,
			error: undefined,
			result: undefined,
			method: null,
			methodProxy: null
		};

		try {
			for(const handler of HandlerQueue) {
				await handler(ctx, request);

				if (ctx.error !== undefined) {
					break;
				}
			}
		} catch (error) {
			onError(error);
			ctx.error = RpcError.INTERNAL_ERROR;
		}

		return ctx.notification
			? null
			: Payload.Response(ctx.id, ctx.error, ctx.result);
	};
};
