import { Payload } from './Payload';

declare namespace Client {
	type Params = any[] | object;
	type BatchRequestListener = (err, result: any) => void;

	class Batch {
		/**
		 * Sending all registered request & notification.
		 */
		send(): Promise<any>;

		/**
		 * Registering a request to the batch.
		 * @param method The name of method to call.
		 * @param params A kind of params array or object.
		 * @param callback Handling result when incoming.
		 */
		request(method: string, params: Params, callback: BatchRequestListener): Batch;

		/**
		 * Registering a request to the batch.
		 * @param method The name of method to call.
		 * @param callback Handling result when incoming.
		 */
		request(method: string, callback: BatchRequestListener): Batch;

		/**
		 * Registering a notification to the batch.
		 * @param method The name of method to call.
		 * @param params A kind of params array or object.
		 */
		notificate(method: string, params?: Params): Batch;
	}

	export interface Options {
		/**
		 * Client peer name.
		 * @default '<client-anonymous>'
		 */
		name?: string,

		/**
		 * A request id generator.
		 */
		Id?(): number | string;

		/**
		 * How to transport the serialized data.
		 * @param raw A transport data.
		 */
		sendRequest?(raw: any): void;

		/**
		 * Coverting a payload to transport format.
		 * @param payload a valid jsonrpc 2.0 payload objecct
		 * @default JSON.stringify
		 */
		serialize?(payload: Payload): any;

		/**
		 * Coverting a raw data from transport format to jsonrpc payload object.
		 * @param raw A transport data.
		 * @default JSON.parse
		 */
		deserialize?(raw: any): Payload;

		/**
		 * Internal @produck/jsonrpc timeout value. It SHOULD be known that `timeout`
		 * is NOT defined in specification. It use to solve the problem overstocking
		 * of requests.
		 *
		 * The best way to timeout is using `client.handleResponse` to trigger a
		 * timeout error.
		 *
		 * @default 120000
		 */
		timeout?: number;
		
		/**
		 * Handling message from caught error. Default: () => {}
		 * @param message
		 */
		warn?(message: any): void;
	}

	export interface Peer {
		/**
		 * Access the name of a client peer.
		 */
		readonly name: string;

		/**
		 * Send a request
		 * @param method The name of method to call.
		 * @param params A kind of params array or object.
		 */
		request(method: string, params?: Params): Promise<any>;

		/**
		 * Send a notification
		 * @param method The name of method to call.
		 * @param params A kind of params array or object.
		 */
		notificate(method: string, params?: Params): void

		/**
		 * Creating a batch interface instance.
		 */
		batch(): Batch;

		/**
		 * Calling with raw when a response incoming.
		 * @param raw
		 */
		handleResponse(raw: any): void;

		/**
		 * Destroy client.
		 */
		destroy(): void;
	}
}

declare function Client(options: Client.Options): Client.Peer;

export = Client;
