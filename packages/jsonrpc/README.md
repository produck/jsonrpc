@produck/jsonrpc
=======================

This module is used to help developing rpc application in [JSONRPC 2.0](https://www.jsonrpc.org/) protocol.

## Feature
* Only for JSONRPC `2.0`
* Client factory with default options
* Good interface to batch request
* Server factory with default options
* Internal timeout for a rpc client
* Warn hook to hanle caught error
* Extensible serializer/deserializer to implement with non-json payload
* Browser-side supported
* Named client-side or server-side

## Installing
Using npm:
```
$ npm install @produck/jsonrpc
```

## Example
The most simple client,
```js
const JsonRpc = require('@produck/jsonrpc');
const client = JsonRpc.Client({
    // Providing a function to handle a request payload raw defining how to send.
    // Such as send a request by axios...
    sendRequest: raw => console.log(raw)
});

// Then do something like below,
// In promise:
client.request('anyMethod')
    // handle result
    .then(result => console.log(result))
    // handle exception
    .catch(error => console.error(error));

// Just calling and ignore response
client.notification('anyMethod', { foo: 'bar' });

// In async function
(async function request() {
    try {
        // handle result
        const result = await client.request('anyMethod');
        
        console.log(result);
    } catch (err) {
        // handle exception
        console.error(err);
    }
}());
```
A most simple server,
```js
const JsonRpc = require('@produck/jsonrpc');

const server = JsonRpc.Server({
    // Providing a function to handle a response payload raw defining how to send.
    // Such as http response...
    sendRequest: raw => console.log(raw),
    methodMap: {
        hello() {
            return 'hello, world!';
        },
        add(numberA, numberB) {
            return numberA + numberB;
        }
    }
});
```
A server and a client comunication. `example/client-server-comunication.js`,
```js
const JsonRpc = require('@produck/jsonrpc');

const client = JsonRpc.Client({
	sendRequest: raw => server.handleRequest(raw)
});

const server = JsonRpc.Server({
	sendResponse: raw => client.handleResponse(raw),
	methodMap: {
		add: (numA, numB) => numA + numB
	}
});

(async function Example() {
	const result = await client.request('add', [4, 5]);

	console.log(result); // 9

	// To destroy the client to avoid memory leaking.
	// UNECESSARY to destroy after each `client.request()`;
	client.destroy();
}());
```
A jsonrpc server in http, `example/jsonrpc-http-server.js`
```js
const JsonRpc = require('@produck/jsonrpc');
const http = require('http');

const server = JsonRpc.Server({
	methodMap: {
		add: (a, b) => a + b
	}
});

function getPayloadData(stream) {
	return new Promise((resolve, reject) => {
		let data = Buffer.from([]);

		stream.on('data', chunk => {
			data = Buffer.concat([
				data, chunk
			], data.length + chunk.length);
		}).on('end', () => resolve(data));
	});
}

http.createServer(async function JsonRpcRequestListener(req, res) {
	const requestBody = await getPayloadData(req);
	const responseRaw = await server.handleRequest(requestBody.toString());

	res.setHeader('Content-Type', 'application/json');
	res.end(responseRaw);
}).listen(8080);

// Use a http client tool like "Postman" to send POST request.
//
// >>>>
// POST http://127.0.0.1:8080
// {"jsonrpc":"2.0","id":2,"method":"add","params":[3,4]}
//
// <<<<
// {"jsonrpc":"2.0","id":2,"result":7}

```
## Client API
A jsonrpc client instance is used to help developer implement `request`, `notification`
and `batch` feature in the specification ["Request Object"](https://www.jsonrpc.org/specification#request_object) in JSONRPC 2.0.
### Constructor
Creating a jsonrpc client instance. The `new` is not necessary.
#### Client(options?: ClientOptions): Client
All items of `Client.Options` are optional. 
```ts
interface ClientOptions {
    /**
     * Client peer name.
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
     * It MUST be greater than `10`.
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
```
### Instance

#### client.name
To access the name of a client. Default: '\<client-anonymous>'
```js
const client = Client({ name: 'foo' });

console.log(client.name); // >> foo
```
#### client.request(method: string, params?: object | any[]): Promise<any>
A rpc call is represented by sending a Request object to a Server. It will create
a invoking waiting response from server by [client.handleResponse](#client.handleResponse(raw):-void)
to resolve.
```js
const JsonRpc = require('@produck/jsonrpc');
const client = Client();

(async function ClentRequestExample() {
    try {
        const result = await clent.request('add', [1, 2]);
    } catch (error) {
        console.log(error);
    }
}());
```
#### client.notification(method: string, params?: object | any[]): void
A Notification is a Request object without an "id" member. A Request object that
is a Notification signifies the Client's lack of interest in the corresponding
Response object.
```js
const JsonRpc = require('@produck/jsonrpc');
const client = Client();

client.notificate('any'); // Just request without any response.
```
#### client.batch(): Client.Batch
To send several Request objects at the same time, the Client MAY send an Array
filled with Request objects. See also ["Batch"](https://www.jsonrpc.org/specification#batch)

Creating a batch,
```js
const JsonRpc = require('@produck/jsonrpc');
const client = JsonRpc.Client();

client.batch()
    .request('any', (err, result) => {})
    .request('any', [1, 2], (err, result) => {})
    .notification('any', { foo: 'bar' })
    .send(); // return a Promise<void> after response incoming.

```
[How to use batch](#batch-instance)
#### client.handleResponse(raw): void
A raw data of request payload will be generated when calling `client.request()`
or `batch.send()`. It may get a response raw contained the result(s) or error(s)
from jsonrpc server.
```js
```

#### client.destroy(): void

### Batch Instance
Creating from a specifical client instance by `client.batch()` to help sending a serial of
request or notification - [client.batch()`](#clientbatch-clientbatch).
#### batch.request(method: string, callback: (err, result) => {})
#### batch.request(method: string, params: object | any[], callback: (err, result) => {})
#### batch.notificate(mthod: string, params?: object | any[]): void
#### batch.send(): Promise<void>
## Server API
### Contructor
#### Server(options: Server.Options): Server

### Instance

#### server.name
To access the name of a server. Default: '\<server-anonymous>'
```js
const server = Server({ name: 'foo' });

console.log(server.name); // >> foo
```

#### server.handleRequest(raw: any): any

## Client request timeout
## JSON-RPC specification

* https://www.jsonrpc.org/