import { Payload } from './Payload';

export namespace Server {
	export interface MethodMap {
		[key: string]: () => {}
	}

	export interface Options {
		/**
		 * Server peer name.
		 */
		name?: string;

		/**
		 * Coverting a payload to transport format.
		 * @param payload a valid jsonrpc 2.0 payload objecct
		 */
		serialize?(payload: Payload): any;

		/**
		 * Coverting a raw data from transport format to jsonrpc payload object.
		 * @param raw A transport data.
		 */
		deserialize?(raw: any): Payload;

		/**
		 * How to transport the serialized data.
		 * @param raw A transport data.
		 */
		sendResponse?(raw: any): void;

		/**
		 * Handling message from caught error. Default: () => {}
		 * @param message
		 */
		warn?(message: any): void;

		/**
		 * A map of registered methods.
		 */
		methodMap?: MethodMap;
	}

	export interface Peer {
		/**
		 * Calling with raw when a request incoming.
		 * @param raw raw data of request payload
		 * @returns raw data of response payload
		 */
		handleRequest(raw: any): Promise<any>;

		/**
		 * Access the name of a server peer.
		 */
		readonly name: string;
	}
}

export function Server(options: Server.Options): Server.Peer;
