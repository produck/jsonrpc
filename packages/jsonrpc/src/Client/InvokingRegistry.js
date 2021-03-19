'use strict';

const WATCHING_INTERVAL = 1000;
const DEFAULT_TIMEOUT = 2 * 60 * 1000;

module.exports = function InvokingRegistry(timeout = DEFAULT_TIMEOUT) {
	const store = {};

	const observer = setInterval(function watch() {
		const now = Date.now();

		for(const id in store) {
			const invoking = store[id];

			if (invoking.at + timeout < now) {
				invoking.reject(new Error('@produck/jsonrpc internal timeout!'));
				delete store[id];
			}
		}
	}, WATCHING_INTERVAL);

	return {
		put(request) {
			return new Promise((resolve, reject) => {
				store[request.id] = { request, resolve, reject, at: Date.now() };
			});
		},
		end(response) {
			const { error, result, id } = response;
			const invoking = store[response.id];

			if (!invoking) {
				return;
			}

			if (error) {
				invoking.reject(new Error(error.message));
			} else {
				invoking.resolve(result);
			}

			delete store[id];
		},
		destroy() {
			clearInterval(observer);
		}
	};
};
