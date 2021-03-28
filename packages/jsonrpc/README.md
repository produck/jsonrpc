@produck/jsonrpc
=======================

[![npm (scoped)](https://img.shields.io/npm/v/@produck/jsonrpc?style=flat-square)](https://www.npmjs.org/package/@produck/jsonrpc)
[![Travis (.org)](https://img.shields.io/travis/produck/jsonrpc?style=flat-square)](https://travis-ci.org/github/produck/jsonrpc)
[![Coveralls](https://img.shields.io/coveralls/github/produck/jsonrpc?style=flat-square)](https://coveralls.io/github/produck/jsonrpc)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg?style=flat-square)](https://lerna.js.org/)
[![NPM](https://img.shields.io/npm/l/@produck/jsonrpc?style=flat-square)](https://opensource.org/licenses/MIT)

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
client.notificate('anyMethod', { foo: 'bar' });

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
A jsonrpc client instance is used to help developer implement `request`, `notificate`
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
Creating a client,
```js
const JsonRpc = require('@produck/jsonrpc');

// No options
const client = JsonRpc.Client();

// Options with all items
const client2 = JsonRpc.Client({
    name: 'foo',
    serialize: JSON.stringify,
    deserialize: JSON.parse,
    sendRequest: raw => console.log(raw),
    timeout: 120000,
    Id: IdGenerator()
});

function IdGenerator() {
    let counter = 0;

    return function Id() {
        return counter++;
    };
}
```
### Client Instance

#### client.name
To access the name of a client. Default: '\<client-anonymous>'
```js
const JsonRpc = require('@produck/jsonrpc');
const client = Client({ name: 'foo' });

console.log(client.name); // >> foo
```
#### client.request(method: string, params?: object | any[]): Promise\<any>
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
#### client.notificate(method: string, params?: object | any[]): void
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

Creating a batch and [how to use batch](#batch-instance) below,
```js
const JsonRpc = require('@produck/jsonrpc');
const client = JsonRpc.Client();

client.batch()
    .request('any', (err, result) => {})
    .request('any', [1, 2], (err, result) => {})
    .notificate('any', { foo: 'bar' })
    .send(); // return a Promise<void> after response incoming.

```
#### client.handleResponse(raw): void
A raw data of request payload will be generated when calling `client.request()`
or `batch.send()`. It may get a response raw data contained the result(s) or
error(s) from jsonrpc server.
```js
const JsonRpc = require('@produck/jsonrpc');

const client = JsonRpc.Client({
    Id: () => 123,
	sendRequest: raw => console.log(raw)
});

(async function Example() {
    const result = await client.request('add', [4, 5]);

    console.log(result); // 9

    // To destroy the client to avoid memory leaking.
    // UNECESSARY to destroy after each `client.request()`;
    client.destroy();
}());

client.handleResponse('{"jsonrpc":"2.0","id":123,"result":9}');
```
#### client.destroy(): void
There is a observer implemented by setInterval() in each "Invoking Registries"
of all clients. It is used to find out all timeout invoking to cause "Internal
Timeout Error" as soon as possible. So that each client MUST be destroyed if
they are not be used any more to avoid memory leaking.
```js
const JsonRpc = require('@produck/jsonrpc');

const client = JsonRpc.Client();

// Do something ...

client.destroy();
```
And more about "Internal Timeout Error" see also [Client Timeout](#Client-side-request-timeout).

### Batch Instance
Creating from a specifical client instance by `client.batch()` to help sending
a serial of request or notification - [client.batch()`](#clientbatch-clientbatch).

A `callback` MUST be provided on using `request()`, or using `notificate()` explicitly.
#### batch.request(method: string, callback: (err, result) => {}): Client.Batch
```js
const JsonRpc = require('@produck/jsonrpc');
const client = JsonRpc.Client();

client.batch().request('any', (err, result) => {});
```
#### batch.request(method: string, params: object | any[], callback: (err, result) => {}): Client.Batch
```js
const JsonRpc = require('@produck/jsonrpc');
const client = JsonRpc.Client();

client.batch().request('any', [1, 2], (err, result) => {});
```
#### batch.notificate(mthod: string, params?: object | any[]): Client.Batch
Just using `notificate()` explictily if you are sure that response is unecessary.
```js
const JsonRpc = require('@produck/jsonrpc');
const client = JsonRpc.Client();

client.batch().notificate('any', { foo: 'bar' });
```
#### batch.send(): Promise\<void>
To send all requests & notifications.
A batch has been sent MUST not be used any more.
It will throw an error after an empty batch sending.
```js
const JsonRpc = require('@produck/jsonrpc');
const client = JsonRpc.Client();

// It could not send a empty batch to jsonrpc server
// It will throw an error.
client.batch().send();

const correctBatch = client.batch()
    .request('any', (err, result) => {})
    .request('any', [1, 2], (err, result) => {})
    .notificate('any', { foo: 'bar' });

// return a Promise<void> after response incoming.
correctBatch.send();

// It could not be sent again.
correctBatch.send();
```
## Server API
When a rpc call is made, the Server MUST reply with a Response, except for in
the case of Notifications. 
### Contructor
Creating a jsonrpc server instance. The `new` is not necessary.
#### Server(options: ServerOptions): Server
```ts
interface ServerOptions {
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
```
### Server Instance

#### server.name
To access the name of a server. Default: '\<server-anonymous>'
```js
const JsonRpc = require('@produck/jsonrpc');
const server = Server({ name: 'foo' });

console.log(server.name); // >> foo
```

#### server.handleRequest(raw: any): Promise\<any>
A raw data of request payload will be incoming as `raw` then SHOULD execute
`server.handleRequest(raw)` to handle it. Finally, a response raw was generated
to be used by `options.sendResponse(raw)` witch has been defined.
```js
const JsonRpc = require('@produck/jsonrpc');

let responseRawFromSendResponse;
const server = JsonRpc.Server({
    // for CASE 1
    sendResponse: raw => responseRawFromSendResponse = raw,
    methodMap: {
        add: (numA, numB) => numA + numB
    }
});

(async function Example() {
    // for CASE 2
    const responseRaw = await server
        .handleRequst('{"jsonrpc":"2.0","id":1,"method":"add","params":[2,3]}');
    
    console.log(responseRaw === responseRawFromSendResponse);
    // >> true
    // They are SAME!
}());
```
There are 2 cases:
1. All of response can be sent by a same way. (binding a socket)
2. Something must be done in a pair of request-response. (in a http server)
## Client-side request timeout
Actually, there exist so many cases that lead to timeout especially in the
scenario with network. Because of invoking registry is implemented in clients that
`promise` of invoking is managed. It might lead to memory leak if a promise is
keeping in pending. So an observer made by `setInterval()` is existed in each
registry to ensure `reject` a expired invoking finally. Each client is also need
to be [destroyed](#clientdestroy-void) if no use any more.

As a suggestion, a timeout error should be throws by `client.handleResponse()`
explicitly. The internal timeout mechanism is just a guarantee.

```js
const JsonRpc = require('@produck/jsonrpc');
const client = JsonRpc.Client();

client.request('any')
    .then(result => console.log(result))
    .catch(error => console.error(error));

setTimeout(() => {
    client.handleResponse(
        '{"jsonrpc":"2.0","id":1,"error":{"code":-32000,"message":"Customer timeout error"}}'
    );
}, 5000);
```
## Extension - customers payload raw
//todo
## JSON-RPC specification

* https://www.jsonrpc.org/