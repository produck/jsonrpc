'use strict';

const Client = require('../packages/jsonrpc/src/Client');
const assert = require('assert');

describe('Client::', function () {
	describe('constructor()', function () {
		it('should create a client without any options', function () {
			Client().destroy();
		});

		it('should create a client with all valid options.', function () {
			Client({
				name: 'test',
				serialize: _ => _,
				deserialize: _ => _,
				sendRequest: _ => _,
				timeout: 2000,
				Id: _ => _
			}).destroy();
		});

		it('should throw if `options.name` is NOT string', function () {
			assert.throws(() => Client({ name: 1 }).destroy());
			assert.throws(() => Client({ name: null }).destroy());
			assert.throws(() => Client({ name: () => {} }).destroy());
			assert.throws(() => Client({ name: true }).destroy());
			assert.throws(() => Client({ name: {} }).destroy());
		});

		it('should throw if `options.timeout` is NOT number or <10.', function () {
			assert.throws(() => Client({ timeout: 1 }).destroy());
			assert.throws(() => Client({ timeout: null }).destroy());
			assert.throws(() => Client({ timeout: () => {} }).destroy());
			assert.throws(() => Client({ timeout: true }).destroy());
			assert.throws(() => Client({ timeout: {} }).destroy());
			assert.throws(() => Client({ timeout: -10 }).destroy());
		});

		[
			'serialize', 'deserialize', 'sendRequest', 'Id', 'warn'
		].forEach(keyName => {
			it(`should throw error \`options.${keyName}\` is NOT a function.`, function () {
				assert.throws(() => Client({ [keyName]: 'test' }).destroy());
				assert.throws(() => Client({ [keyName]: 1 }).destroy());
				assert.throws(() => Client({ [keyName]: null }).destroy());
				assert.throws(() => Client({ [keyName]: true }).destroy());
				assert.throws(() => Client({ [keyName]: {} }).destroy());
			});
		});
	});

	describe('name', function () {
		it('should that default value of server.name is `<anonymous>`.', function () {
			const client = Client();

			assert.deepStrictEqual(client.name, '<client-anonymous>');
			client.destroy();
		});

		it('should be the value `options.name` is.', function () {
			const client = Client({ name: 'foo' });

			assert.deepStrictEqual(client.name, 'foo');
			client.destroy();
		});
	});

	describe('request()', function () {
		it('should send a correct request with method only.', function () {
			const status = { request: null };

			const client = Client({
				Id: () => 789,
				sendRequest(raw) {
					status.request = JSON.parse(raw);
				}
			});

			client.request('any');
			assert.deepStrictEqual(status.request, {
				jsonrpc: '2.0', method: 'any', id: 789
			});

			client.destroy();
		});

		it('should send a correct request with method & params.', function () {
			const status = { request: null };

			const client = Client({
				Id: () => 789,
				sendRequest(raw) {
					status.request = JSON.parse(raw);
				}
			});

			client.request('any', [1, 2]);
			assert.deepStrictEqual(status.request, {
				jsonrpc: '2.0', method: 'any', id: 789, params: [1, 2]
			});

			client.request('any', { foo: 'bar' });
			assert.deepStrictEqual(status.request, {
				jsonrpc: '2.0', method: 'any', id: 789, params: { foo: 'bar' }
			});

			client.destroy();
		});

		it('should throw with bad arguments', function () {
			const client = Client();

			assert.throws(() => client.request(1));
			assert.throws(() => client.request(null));
			assert.throws(() => client.request(()=> {}));
			assert.throws(() => client.request(true));
			assert.throws(() => client.request({}));
			assert.throws(() => client.request());

			assert.throws(() => client.request('foo', 1));
			assert.throws(() => client.request('foo', null));
			assert.throws(() => client.request('foo', true));
			assert.throws(() => client.request('foo', 'baz'));
			assert.throws(() => client.request('foo', () => {}));

			client.destroy();
		});

		it('should timeout', function (done) {
			const client = Client({ timeout: 20 });

			(async function () {
				try {
					await client.request('any');
				} catch (error) {
					assert(/internal timeout/.test(error.message));
					done();
					client.destroy();
				}
			}());
		});
	});

	describe('notificate()', function () {
		it('should send a correct request with method only.', function () {
			const status = { request: null };

			const client = Client({
				Id: () => 789,
				sendRequest(raw) {
					status.request = JSON.parse(raw);
				}
			});

			client.notificate('any');
			assert.deepStrictEqual(status.request, {
				jsonrpc: '2.0', method: 'any'
			});

			client.destroy();
		});

		it('should send a correct request with method & params.', function () {
			const status = { request: null };

			const client = Client({
				Id: () => 789,
				sendRequest(raw) {
					status.request = JSON.parse(raw);
				}
			});

			client.notificate('any', [1, 2]);
			assert.deepStrictEqual(status.request, {
				jsonrpc: '2.0', method: 'any', params: [1, 2]
			});

			client.notificate('any', { foo: 'bar' });
			assert.deepStrictEqual(status.request, {
				jsonrpc: '2.0', method: 'any', params: { foo: 'bar' }
			});

			client.destroy();
		});

		it('should throw with bad arguments', function () {
			const client = Client();

			assert.throws(() => client.notificate(1));
			assert.throws(() => client.notificate(null));
			assert.throws(() => client.notificate(()=> {}));
			assert.throws(() => client.notificate(true));
			assert.throws(() => client.notificate({}));
			assert.throws(() => client.notificate());

			assert.throws(() => client.notificate('foo', 1));
			assert.throws(() => client.notificate('foo', null));
			assert.throws(() => client.notificate('foo', true));
			assert.throws(() => client.notificate('foo', 'baz'));
			assert.throws(() => client.notificate('foo', () => {}));

			client.destroy();
		});
	});

	describe('handleResponse()', function () {
		it('should return a result successfully.', function (done) {
			const client = Client({ Id: () => 1 });

			(async function request() {
				const result = await client.request('any');

				assert.strictEqual(result, 456);
				done();
			}());

			client.handleResponse('{"jsonrpc":"2.0","id":1,"result":456}');
			client.destroy();
		});

		it('should catch a error.', function (done) {
			const client = Client({ Id: () => 1 });

			(async function request() {
				try {
					await client.request('any');
				} catch (error) {
					assert.deepStrictEqual(error.message, 'Method not found');
					done();
				}
			}());

			client.handleResponse('{"jsonrpc":"2.0","error":{"code":-32601,"message":"Method not found"},"id":"1"}');
			client.destroy();
		});
	});

	describe('batch()', function () {
		it('should get a new batch instance', function () {
			const client = Client();
			const batch = client.batch();

			assert(batch.request);
			assert(batch.notificate);
			assert(batch.send);

			client.destroy();
		});

		describe('request(method, callback)', function () {
			it('should push a rpc into batch list by correct request', function () {
				const status = { request: null };

				const client = Client({
					Id: () => 43,
					sendRequest(raw) {
						status.request = JSON.parse(raw);
					}
				});

				client.batch().request('any', () => {}).send();
				assert.deepStrictEqual(status.request, [{
					jsonrpc: '2.0', method: 'any', id: 43
				}]);

				client.destroy();
			});
		});

		describe('request(method, params, callback)', function () {
			it('should push a rpc into batch list by correct request', function () {
				const status = { request: null };

				const client = Client({
					Id: () => 43,
					sendRequest(raw) {
						status.request = JSON.parse(raw);
					}
				});

				client.batch().request('any', [2, 5], () => {}).send();
				assert.deepStrictEqual(status.request, [{
					jsonrpc: '2.0', params: [2, 5], method: 'any', id: 43
				}]);

				client.batch().request('any', { foo: 'bar' }, () => {}).send();
				assert.deepStrictEqual(status.request, [{
					jsonrpc: '2.0', params: { foo: 'bar' }, method: 'any', id: 43
				}]);

				client.destroy();
			});
		});

		describe('notificate()', function () {
			it('should push a rpc into batch list by correct notification', function () {
				const status = { request: null };

				const client = Client({
					Id: () => 43,
					sendRequest: raw => status.request = JSON.parse(raw)
				});

				client.batch().notificate('any').send();
				assert.deepStrictEqual(status.request, [
					{ jsonrpc: '2.0', method: 'any' }
				]);

				client.batch().notificate('any', [2, 5]).send();
				assert.deepStrictEqual(status.request, [
					{ jsonrpc: '2.0', params: [2, 5], method: 'any' }
				]);

				client.batch().notificate('any', { foo: 'bar' }).send();
				assert.deepStrictEqual(status.request, [
					{ jsonrpc: '2.0', params: { foo: 'bar' }, method: 'any' }
				]);

				client.destroy();
			});
		});

		describe('send()', function () {
			it('should send a batch of rpc in array', async function () {
				const status = { request: null };

				const client = Client({
					Id: () => 43,
					sendRequest(raw) {
						status.request = JSON.parse(raw);
					}
				});

				await client.batch()
					.request('foo', [1, 2], () => {})
					.notificate('bar', { baz: 3 })
					.send();

				assert.deepStrictEqual(status.request, [
					{ jsonrpc: '2.0', id: 43, method: 'foo', params: [1, 2] },
					{ jsonrpc: '2.0', method: 'bar', params: { baz: 3 } }
				]);

				client.destroy();
			});

			it('should throw if no rpc in batch.', async function () {
				const client = Client({ Id: () => 43 });

				assert.rejects(() => client.batch().send());
				client.destroy();
			});

			it('should throw if a batch has been sent.', async function () {
				const status = { request: null };

				const client = Client({
					Id: () => 43,
					sendRequest(raw) {
						status.request = JSON.parse(raw);
					}
				});

				const batch = client.batch();
				await batch
					.request('foo', [1, 2], () => {})
					.notificate('bar', { baz: 3 })
					.send();

				assert.rejects(() => batch.send());
				client.destroy();
			});
		});
	});

	describe('destroy()', function () {
		it('should destroy a client.', function () {
			const client = Client();

			client.destroy();
		});

		it('should NOT be able to call if a client destroyed.');
	});
});
