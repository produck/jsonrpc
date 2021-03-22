@produck/jsonrpc
=======================

This module is used to help developing rpc application in [JSONRPC 2.0](https://www.jsonrpc.org/) protocol.

## Feature
* Only for JSONRPC 2.0
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
## Client API
### Client(options?: Client.Options): Client
All items of `Client.Options` are options. 
```ts
interface Options {
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
### Client.request(method: string, params?: object | any[]): Promise<any>
### Client.notification(method: string, params?: object | any[]): void

### Client.batch(): Client.Batch

## Server API

## JSON-RPC specification

* https://www.jsonrpc.org/