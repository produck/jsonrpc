interface JsonRpcError {
	/**
	 * A Number that indicates the error type that occurred.
	 *
	 * This MUST be an integer.
	 *
	 * #Error Code Table: https://www.jsonrpc.org/specification#error_object
	 */
	code: number;

	/**
	 * A String providing a short description of the error.
	 *
	 * The message SHOULD be limited to a concise single sentence.
	 */
	message: string;

	/**
	 * A Primitive or Structured value that contains additional information
	 * about the error.
	 *
	 * This may be omitted.
	 *
	 * The value of this member is defined by the Server (e.g. detailed error
	 * information, nested errors etc.)
	 */
	data: any;
}

interface Request {
	/**
	 * A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0".
	 */
	jsonrpc: '2.0';

	/**
	 * An identifier established by the Client that MUST contain a String,
	 * Number, or NULL value if included. If it is not included it is assumed
	 * to be a notification. The value SHOULD normally not be Null [1] and
	 * Numbers SHOULD NOT contain fractional parts[2]
	 *
	 * #Detail: https://www.jsonrpc.org/specification#request_object
	 */
	id: number | string | null;

	/**
	 * A String containing the name of the method to be invoked. Method names
	 * that begin with the word rpc followed by a period character (U+002E or
	 * ASCII 46) are reserved for rpc-internal methods and extensions and
	 * MUST NOT be used for anything else.
	 */
	method: string;

	/**
	 * A Structured value that holds the parameter values to be used during
	 * the invocation of the method. This member MAY be omitted.
	 */
	params: any[] | object;
}

interface Response {
	/**
	 * A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0".
	 */
	jsonrpc: '2.0';

	/**
	 * This member is REQUIRED.
	 *
	 * It MUST be the same as the value of the id member in the Request Object.
	 *
	 * If there was an error in detecting the id in the Request object (e.g.
	 * Parse error/Invalid Request), it MUST be Null.
	 */
	id: number | string;

	/**
	 * This member is REQUIRED on error.
	 *
	 * This member MUST NOT exist if there was no error triggered during invocation.
	 *
	 * The value for this member MUST be an Object as defined in section 5.1.
	 */
	error?: JsonRpcError;

	/**
	 * This member is REQUIRED on success.
	 *
	 * This member MUST NOT exist if there was an error invoking the method.
	 *
	 * The value of this member is determined by the method invoked on the Server.
	 */
	result?: any;
}

export function Request(
	method: string,
	params?: object | any[],
	id?: number | string | null
): PayloadRequest;

export function Response(
	id: null | number | string,
	error?: JsonRpcError,
	result?: any
): PayloadResponse;

type PayloadRequest = Request | Request[];
type PayloadResponse = Response | Response[];
type Payload = PayloadRequest | PayloadResponse;