'use strict';

const Server = require('../src/Server');
const assert = require('assert');

describe('Server::', function () {
	describe('constructor()', function () {
		it('should success without any options.', function () {
			Server();
		});

		it('should success with all valid options.', function () {
			Server({});
			Server({ name: 'org.produck.jsonrpc.server' });
			Server({ methodMap: {} });
			Server({ serialize: () => {} });
			Server({ deserialize: () => {} });
			Server({ sendResponse: () => {} });

			Server({
				name: 'org.produck.jsonrpc.server',
				methodMap: {},
				serialize: () => {},
				deserialize: () => {},
				sendResponse: () => {}
			});
		});

		it('should throw error if `options.name` is NOT a string.', function () {
			assert.throws(() => Server({ name: 1 }));
			assert.throws(() => Server({ name: null }));
			assert.throws(() => Server({ name: () => {} }));
			assert.throws(() => Server({ name: true }));
			assert.throws(() => Server({ name: {} }));
		});

		it('should throw error `options.methodMap` is NOT a object or `null`.', function () {
			assert.throws(() => Server({ methodMap: 'test' }));
			assert.throws(() => Server({ methodMap: 1 }));
			assert.throws(() => Server({ methodMap: null }));
			assert.throws(() => Server({ methodMap: true }));
		});

		['serialize', 'deserialize', 'sendResponse'].forEach(keyName => {
			it(`should throw error \`options.${keyName}\` is NOT a function.`, function () {
				assert.throws(() => Server({ [keyName]: 'test' }));
				assert.throws(() => Server({ [keyName]: 1 }));
				assert.throws(() => Server({ [keyName]: null }));
				assert.throws(() => Server({ [keyName]: true }));
				assert.throws(() => Server({ [keyName]: {} }));
			});
		});
	});

	describe('name', function () {
		it('should be the value `options.name` is.', function () {
			const server = Server({ name: 'foo' });

			assert.strictEqual(server.name, 'foo');
		});

		it('should that default value of server.name is `<anonymous>`.', function () {
			const server = Server();

			assert.strictEqual(server.name, '<server-anonymous>');
		});
	});

	describe('handleRequest()', function () {
		it('should handle a single executable request.', function (done) {
			const mockRequest = { jsonrpc: '2.0', id: 340, method: 'testAdd', params: [1, 4] };
			const expectedResponse = { jsonrpc: '2.0', id: 340, result: 5 };

			const server = Server({
				methodMap: { testAdd: (a, b) => a + b },
				sendResponse(raw) {
					assert.deepStrictEqual(JSON.parse(raw), expectedResponse);
					done();
				}
			});

			server.handleRequest(JSON.stringify(mockRequest));
		});

		it('should handle a single executable notification.', async function () {
			const status = { isTestAddCalled: false, isSent: false };

			const server = Server({
				methodMap: {
					testAdd(a, b) {
						assert.strictEqual(a, 1);
						assert.strictEqual(b, 4);

						status.isTestAddCalled = true;
					}
				},
				sendResponse() {
					status.isSent = true;
				}
			});

			const mockNotification = JSON.stringify({
				jsonrpc: '2.0', method: 'testAdd', params: [1, 4]
			});

			await server.handleRequest(mockNotification);
			assert(status.isTestAddCalled);
			assert(!status.isSent);
		});

		it('should success to handle a batch of executable requests.', async function () {
			const mockRequestBatch = [
				{ jsonrpc: '2.0', method: 'testAdd', params: [2, 3], id: 234 },
				{ jsonrpc: '2.0', method: 'testAdd', params: [5, 8], id: 345 },
			];

			const expectedMap = {
				234: { jsonrpc: '2.0', result: 5, id: 234 },
				345: { jsonrpc: '2.0', result: 13, id: 345 },
			};

			const status = {
				sent: false,
				response: []
			};

			const server = Server({
				methodMap: {
					testAdd(a, b) {
						return a + b;
					}
				},
				sendResponse(raw) {
					status.sent = true;
					status.response = JSON.parse(raw);
				}
			});

			await server.handleRequest(JSON.stringify(mockRequestBatch));
			assert.strictEqual(true, status.sent);
			status.response.forEach(r => assert.deepStrictEqual(expectedMap[r.id], r));
		});

		it('should success to handle a batch of executable notifications.', async function () {
			const mockRequestBatch = [
				{ jsonrpc: '2.0', method: 'testAdd', params: [2, 3] },
				{ jsonrpc: '2.0', method: 'testAdd', params: [5, 8] },
			];

			const status = {
				sent: false,
				invokingMap: {}
			};

			const server = Server({
				methodMap: {
					testAdd(a, b) {
						status.invokingMap[`${a},${b}`] = true;
					}
				},
				sendResponse() {
					status.sent = true;
				}
			});

			await server.handleRequest(JSON.stringify(mockRequestBatch));
			assert.strictEqual(status.sent, false);
			assert(status.invokingMap['2,3']);
			assert(status.invokingMap['5,8']);
		});

		it('should handle a batch of requests & notification successfully.', async function() {
			const mockRequestBatch = [
				{ jsonrpc: '2.0', method: 'testAdd', params: [2, 3], id: 234 },
				{ jsonrpc: '2.0', method: 'testAdd', params: [12, 9] },
				{ jsonrpc: '2.0', method: 'testAdd', params: [5, 8], id: 345 },
				{ jsonrpc: '2.0', method: 'testAdd', params: [45, -15] },
			];

			const expectedMap = {
				234: { jsonrpc: '2.0', result: 5, id: 234 },
				345: { jsonrpc: '2.0', result: 13, id: 345 },
			};

			const status = {
				sent: false,
				response: {},
				invokingMap: {}
			};

			const server = Server({
				methodMap: {
					testAdd(a, b) {
						status.invokingMap[`${a},${b}`] = true;
						return a + b;
					}
				},
				sendResponse(raw) {
					status.sent = true;
					JSON.parse(raw).forEach(r => status.response[r.id] = r);
				}
			});

			await server.handleRequest(JSON.stringify(mockRequestBatch));
			assert.strictEqual(status.sent, true);
			assert(status.invokingMap['12,9']);
			assert(status.invokingMap['45,-15']);
			assert.deepStrictEqual(expectedMap[234], status.response[234]);
			assert.deepStrictEqual(expectedMap[345], status.response[345]);
		});

		it('should success to "rpc call Batch"', async function () {
			const status = { response: [] };

			const server = Server({
				methodMap: {
					sum: async (...number) => number.reduce((sum, cur) => sum + cur, 0),
					notify_hello: async () => {},
					subtract: async (a, b) => a - b,
					get_data: async () => ['hello', 5]
				},
				sendResponse(raw) {
					status.response = JSON.parse(raw);
				}
			});

			const expectedMap = {
				1: { jsonrpc: '2.0', result: 7, id: '1' },
				2: { jsonrpc: '2.0', result: 19, id: '2' },
				9: { jsonrpc: '2.0', result: ['hello', 5], id: '9' },
				null: { jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: null },
				5: { jsonrpc: '2.0', error: { code: -32601, message: 'Method not found' }, id: '5' },
			};

			await server.handleRequest(`
[
	{"jsonrpc": "2.0", "method": "sum", "params": [1,2,4], "id": "1"},
	{"jsonrpc": "2.0", "method": "notify_hello", "params": [7]},
	{"jsonrpc": "2.0", "method": "subtract", "params": [42,23], "id": "2"},
	{"foo": "boo"},
	{"jsonrpc": "2.0", "method": "foo.get", "params": {"name": "myself"}, "id": "5"},
	{"jsonrpc": "2.0", "method": "get_data", "id": "9"}
]`);

			status.response.forEach(r => assert.deepStrictEqual(r, expectedMap[r.id]));
		});

		describe('throws::', function () {
			/**
			 * Reference form:
			 * https://www.jsonrpc.org/specification#examples
			 */

			it('should throw an error if "rpc call with invalid JSON".', async function () {
				const status = { response: null };

				const server = Server({
					methodMap: { testAdd: (a, b) => a + b },
					sendResponse(raw) {
						status.response = JSON.parse(raw);
					}
				});

				await server.handleRequest('{jsonrpc:"2.0",id:340,method:"testAdd",params:[1,4]');

				assert.deepStrictEqual(status.response, {
					jsonrpc: '2.0',
					id: null,
					error: { code: -32700, message: 'Parse error' }
				});
			});

			it('should throw an error if "rpc call Batch, invalid JSON".', async function () {
				const status = { response: null };

				const server = Server({
					methodMap: { testAdd: (a, b) => a + b },
					sendResponse(raw) {
						status.response = JSON.parse(raw);
					}
				});

				await server.handleRequest(
					'[{"jsonrpc": "2.0","method":"sum","params": [1,2,4], "id": "1"},' +
					'{"jsonrpc": "2.0", "method"]'
				);

				assert.deepStrictEqual(status.response, {
					jsonrpc: '2.0',
					id: null,
					error: { code: -32700, message: 'Parse error' }
				});
			});

			it('should throw an error if "rpc call with an empty Array".', async function () {
				const status = { response: null };

				const server = Server({
					methodMap: { testAdd: (a, b) => a + b },
					sendResponse(raw) {
						status.response = JSON.parse(raw);
					}
				});

				await server.handleRequest('[]');

				assert.deepStrictEqual(status.response, {
					jsonrpc: '2.0',
					id: null,
					error: { code: -32600, message: 'Invalid Request' }
				});
			});

			it('should throw an error if "rpc call of non-existent method".', async function () {
				const status = { response: null };

				const server = Server({
					methodMap: { testAdd: (a, b) => a + b },
					sendResponse(raw) {
						status.response = JSON.parse(raw);
					}
				});

				await server.handleRequest('{"jsonrpc":"2.0","method":"foobar","id":"1"}');

				assert.deepStrictEqual(status.response, {
					jsonrpc: '2.0',
					id: '1',
					error: { code: -32601, message: 'Method not found' }
				});
			});

			it('should throw an error if "rpc call with invalid Request object".', async function () {
				const status = { response: null };

				const server = Server({
					methodMap: { testAdd: (a, b) => a + b },
					sendResponse(raw) {
						status.response = JSON.parse(raw);
					}
				});

				await server.handleRequest('{"jsonrpc":"2.0","method": 1,"params":"bar"}');

				assert.deepStrictEqual(status.response, {
					jsonrpc: '2.0',
					id: null,
					error: { code: -32600, message: 'Invalid Request' }
				});
			});

			it('should throw an error if "rpc call with an invalid Batch (but not empty)".', async function () {
				const status = { response: null };

				const server = Server({
					methodMap: { testAdd: (a, b) => a + b },
					sendResponse(raw) {
						status.response = JSON.parse(raw);
					}
				});

				await server.handleRequest('[1]');

				assert.deepStrictEqual(status.response, [{
					jsonrpc: '2.0',
					id: null,
					error: { code: -32600, message: 'Invalid Request' }
				}]);
			});

			it('should throw an error if "rpc call with invalid Batch".', async function () {
				const status = { response: null };

				const server = Server({
					methodMap: { testAdd: (a, b) => a + b },
					sendResponse(raw) {
						status.response = JSON.parse(raw);
					}
				});

				await server.handleRequest('[1,2,3]');

				assert.deepStrictEqual(status.response, [
					{ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } },
					{ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } },
					{ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } }
				]);
			});
		});

		describe('server errors::', function () {
			it('should throws internal error if a normal one thrown.', async function () {
				const status = { response: null };

				const server = Server({
					methodMap: {
						testAdd: () => {
							throw new Error('foo error');
						}
					},
					sendResponse(raw) {
						status.response = JSON.parse(raw);
					}
				});

				await server.handleRequest('{"jsonrpc":"2.0","id":1,"method":"testAdd","params":[1,2]}');
				assert.deepStrictEqual(status.response, {
					jsonrpc: '2.0',
					id: 1,
					error: {
						code: -32603,
						message: 'Internal error'
					}
				});
			});

			it('should throws internal error if code is NOT in range.', async function () {
				const status = { response: null };

				const server = Server({
					methodMap: {
						testAdd: () => {
							throw { code: -31000, message: 'foo' };
						}
					},
					sendResponse(raw) {
						status.response = JSON.parse(raw);
					}
				});

				await server.handleRequest('{"jsonrpc":"2.0","id":1,"method":"testAdd","params":[1,2]}');
				assert.deepStrictEqual(status.response, {
					jsonrpc: '2.0',
					id: 1,
					error: {
						code: -32603,
						message: 'Internal error'
					}
				});
			});

			it('should throws server error.', async function () {
				const status = { response: null };

				const server = Server({
					methodMap: {
						testAdd: () => {
							throw { code: -32003, message: 'bar' };
						}
					},
					sendResponse(raw) {
						status.response = JSON.parse(raw);
					}
				});

				await server.handleRequest('{"jsonrpc":"2.0","id":1,"method":"testAdd","params":[1,2]}');
				assert.deepStrictEqual(status.response, {
					jsonrpc: '2.0',
					id: 1,
					error: {
						code: -32003,
						message: 'bar'
					}
				});
			});
		});
	});
});
