# tab-sockets

tab-sockets is a library designed to help you make different tabs of the same website communicate together effectively. tab-sockets uses `localStorage` and listeners to achieve this communication, and as such, only works in browsers which support localStorage.

## Installation

You can install the package by running

`npm install tab-sockets`

## Usage

tab-sockets can be used directly in the browser as a `<script>` tag or included into a browserified bundle. tab-sockets will not work outside the browser, as Node has no localStorage.

When being included in the browser with a script tag, the tag's `src` attribute should point to `dist/tab-sockets.min.js`, which is the minified build of the library for browsers. When using the library in this manner, the main function of the library will be contained in the global `io` variable.

For the documentation below, I assume that if you are importing the library for later bundling, you are importing it to the variable `io`.

## Documentation

The documentation below is similar to the documentation of [Socket.io](http://socket.io/).

### Socket Creator

#### io([namespace])

Returns a socket which is linked to this namespace. Namespace is immutable for this socket. If no namespace is given, the socket listens to the default namespace. Only sockets specifically listening to a namespace will receive events from that namespace. All events emitted by this socket will go only to the declared namespace.

### Socket

#### .join(room)

Joins a specific room. Rooms are used to segregate messages and a message sent to a specific room will only be received by sockets that have joined it.

#### .leave(room)

Leaves a specific room. This will prevent the socket from receiving messages sent to that room in the future.

#### .on(type, fn)

Registers a listener for a type of event. The callback function will be executed when an event is emitted of this type, giving the data of the event as the only argument to the callback.

#### .to(room)/.in(room)

Adds a room for the next emit to be sent to. These functions return the same object, so they can be chained for multiple rooms to be targeted. If no rooms are declared for an emit, the emit will go to all rooms. The list of rooms targeted by an emit gets reset after the emit is executed.

#### .emit(eventType, [data])

Emits a message of the specified type with the specified data attached. All of the sockets in the emitting tab will also receive this message if it is subscribed to the event type declared, and `.broadcast` was not enacted before emitting.

#### .broadcast

This is a flag that you can set on the socket before you emit to prevent the sockets in the emitting tab from also receiving the message if they are subscribed to the event type of the emission. This flag returns the same object. Use the flag like this `socket.broadcast.emit('test-event-type', 'test');`


## Example Usage

```js
const io = require('tab-sockets');

//Choose the default namespace
var socket = io();

//Joining the test room
socket.join('test room');

socket.on('ping', function(data){
	console.log(data);
});

socket
.to('test room')
.broadcast
.emit('ping', 'other tabs get this message');

socket
.to('test room')
.emit('ping', 'the emitting tab will also get this message');
```

## Contributing

Make sure your code is in the [xo](https://github.com/sindresorhus/xo) style. One of the steps in the testing script is to check all files for style violations.

Run `npm test` to generate a new minified file, which tests will be run against.

Run `npm run build` to only build a new minified file.
