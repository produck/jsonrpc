'use strict';

const Payload = require('../Payload');
const STATUS = { READY: 0, PENDING: 1, END: 2 };

module.exports = function BatchProvider(clientContext) {
	return function Batch() {
		const taskList = [];

		function ensureReady() {
			if (batch.status !== STATUS.READY) {
				throw new Error('Batch sent. It SHOULD NOT be used any more.');
			}
		}

		function registerTask(method, params, callback) {
			const id = callback ? clientContext.Id() : undefined;

			taskList.push({ callback, invoking: Payload.Request(method, params, id) });

			return batch;
		}

		const batch = {
			status: STATUS.READY,
			request() {
				ensureReady();

				const resolved = {};

				if (arguments.length === 2) {
					resolved.method = arguments[0];
					resolved.callback = arguments[1];
				} else if (arguments.length === 3) {
					resolved.method = arguments[0];
					resolved.params = arguments[1];
					resolved.callback = arguments[2];
				} else if (arguments.length === 1) {
					throw new Error('The `callback` MUST be provided, or use notification instead.');
				} else {
					throw new Error('Invalid parameter.');
				}

				if (typeof resolved.callback !== 'function') {
					throw new Error('The function `callback` MUST be provided.');
				}

				const { method, params, callback } = resolved;

				return registerTask(method, params, callback);
			},
			notificate(method, params) {
				ensureReady();

				return registerTask(method, params);
			},
			send() {
				if (taskList.length === 0) {
					throw new Error('Can not send a empty batch.');
				}

				ensureReady();
				batch.status = STATUS.PENDING;

				const callingList = [];

				const invokingList = taskList.map(task => {
					if (task.callback !== undefined) {
						const calling = Promise.resolve(clientContext.register(task.invoking))
							.then(result => task.callback(null, result))
							.catch(err => task.callback(err));

						callingList.push(calling);
					}

					return task.invoking;
				});

				// Any of calling finished means all responses will have been incoming.
				Promise.race(callingList).then(() => batch.status = STATUS.END);
				clientContext.send(invokingList);
			}
		};

		return batch;
	};
};
