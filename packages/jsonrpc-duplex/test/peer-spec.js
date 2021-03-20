'use strict';

const Peer = require('../');
const assert = require('assert');

describe('DuplexPeer::', function () {
	describe('constructor()', function () {
		it('should create a peer without any options', function () {
			Peer().destroy();
		});

		it('should create a peer with all valid options.', function () {
			Peer({
				name: 'test',
				serialize: _ => _,
				deserialize: _ => _,
				sendRequest: _ => _,
				sendResponse: _ => _,
				timeout: 2000,
				Id: _ => _,
				warn: _ => _,
				methodMap: {}
			}).destroy();
		});

		it('should throw if `options.name` is NOT string', function () {
			assert.throws(() => Peer({ name: 1 }).destroy());
			assert.throws(() => Peer({ name: null }).destroy());
			assert.throws(() => Peer({ name: () => {} }).destroy());
			assert.throws(() => Peer({ name: true }).destroy());
			assert.throws(() => Peer({ name: {} }).destroy());
		});

		it('should throw if `options.timeout` is NOT number or <10.', function () {
			assert.throws(() => Peer({ timeout: 1 }).destroy());
			assert.throws(() => Peer({ timeout: null }).destroy());
			assert.throws(() => Peer({ timeout: () => {} }).destroy());
			assert.throws(() => Peer({ timeout: true }).destroy());
			assert.throws(() => Peer({ timeout: {} }).destroy());
			assert.throws(() => Peer({ timeout: -10 }).destroy());
		});

		it('should throw error `options.methodMap` is NOT a object or `null`.', function () {
			assert.throws(() => Peer({ methodMap: 'test' }).destroy());
			assert.throws(() => Peer({ methodMap: 1 }).destroy());
			assert.throws(() => Peer({ methodMap: null }).destroy());
			assert.throws(() => Peer({ methodMap: true }).destroy());
		});

		[
			'serialize', 'deserialize',
			'sendResponse', 'sendRequest',
			'Id', 'warn'
		].forEach(keyName => {
			it(`should throw error \`options.${keyName}\` is NOT a function.`, function () {
				assert.throws(() => Peer({ [keyName]: 'test' }).destroy());
				assert.throws(() => Peer({ [keyName]: 1 }).destroy());
				assert.throws(() => Peer({ [keyName]: null }).destroy());
				assert.throws(() => Peer({ [keyName]: true }).destroy());
				assert.throws(() => Peer({ [keyName]: {} }).destroy());
			});
		});
	});

	describe('name', function () {
		it('should be the value `options.name` is.', function () {
			const peer = Peer({ name: 'foo' });

			assert.strictEqual(peer.name, 'foo');
			peer.destroy();
		});

		it('should that default value of peer.name is `<duplex-anonymous>`.', function () {
			const peer = Peer();

			assert.strictEqual(peer.name, '<duplex-anonymous>');
			peer.destroy();
		});
	});

	describe('destroy()', function () {
		it('should throws when call methods of peer if has been destory.', function () {
			const peer = Peer();

			peer.destroy();

			assert.throws(() => peer.destroy());
			assert.throws(() => peer.request('any'));
			assert.throws(() => peer.notification('any'));
			assert.throws(() => peer.batch());
			assert.throws(() => peer.handleRequest('{"jsonrpc":"2.0","id":3},"method":"any"}'));
			assert.throws(() => peer.handleResponse('{"jsonrpc":"2.0","id":3},"result":0}'));
		});
	});

	it('should pass the complex comunication.', function (done) {
		const results = { Cb: 0, Ca: 0 };

		const a = Peer({
			name: 'peer-a',
			sendRequest: raw => b.handleRequest(raw),
			sendResponse: raw => b.handleResponse(raw),
			methodMap: {
				substract(a, b) {
					results.Ca++;
					return a - b;
				}
			}
		});

		const b = Peer({
			name: 'peer-b',
			sendRequest: raw => a.handleRequest(raw),
			sendResponse: raw => a.handleResponse(raw),
			methodMap: {
				add(a, b) {
					results.Cb++;
					return a + b;
				}
			}
		});

		(async function start() {
			results.ab0 = await a.request('add', [3, 6]);
			results.ba0 = await b.request('substract', [90, 53]);

			try {
				results.ab1 = await a.request('notExisted');
			} catch (error) {
				results.ab1 = error.message;
			}

			try {
				results.ba1 = await b.request('notExisted');
			} catch (error) {
				results.ba1 = error.message;
			}

			a.notification('add', [3, 6]);
			b.notification('substract', [90, 53]);
		}());

		setTimeout(() => {
			assert.deepStrictEqual(results, {
				ab0: 9, ba0: 37,
				ab1: 'Method not found', ba1: 'Method not found',
				Ca: 2, Cb: 2,
			});

			a.destroy();
			b.destroy();

			done();
		}, 1000);
	});
});
