import JsonRpcClient from '@produck/jsonrpc/src/Client';
import JsonRpcServer from '@produck/jsonrpc/src/Server';
import { Payload } from '@produck/jsonrpc/src/Payload';

declare namespace JsonRpcDuplex {
	export interface Options {
		/**
		 * Duplex peer name effecting server & client.
		 */
		name?: string,

		/**
		 * A map of registered methods.
		 */
		 methodMap?: JsonRpcServer.MethodMap;

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
		  * How to transport the serialized data.
		  * @param raw A transport data.
		  */
		 sendResponse?(raw: any): void;

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

	interface Peer {
		/**
		 * Access the name of a duplex peer. Client and server in duplex
		 * peer use the same name.
		 */
		readonly name: string;

		/**
		 * Proxy of client.request()
		 * @param method 
		 * @param params 
		 */
		request(method: string, params: object | any[]): Promise<any>;

		/**
		 * Proxy of client.notification()
		 * @param method 
		 * @param params 
		 */
		notification(method: string, params: object | any[]): void;

		/**
		 * Proxy of client.batch()
		 */
		batch(): JsonRpcClient.Batch;

		/**
		 * Proxy of client.handleResponse()
		 * @param raw 
		 */
		handleResponse(raw: any): void;
		
		/**
		 * Proxy of server.handleRequest()
		 * @param raw A transport data;
		 */
		handleRequest(raw: any): void;

		/**
		 * Proxy of client.destroy()
		 */
		destroy(): void;
	}
}

declare function JsonRpcDuplexPeer(options): JsonRpcDuplex.Peer;

export = JsonRpcDuplexPeer;
