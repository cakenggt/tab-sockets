require('babel-polyfill'); // eslint-disable-line import/no-unassigned-import
const uuid = require('uuid');

var tabUUID = uuid.v4();

const socketsInTab = [];

window.addEventListener('storage', event => {
	var key = event.key;
	if (event.newValue === null) {
		// Value was removed
		return;
	}
	var message = {};
	try {
		message = JSON.parse(event.newValue);
	} catch (err) {
		message = {
			namespace: null,
			rooms: [],
			data: null,
			tabId: null,
			senderId: null,
			type: null
		};
	}

	// The emit method takes care of non-broadcasted messages
	if (key === 'tab-sockets' && message.tabId !== tabUUID) {
		for (var i = 0; i < socketsInTab.length; i++) {
			socketsInTab[i].getMessage(message);
		}
	}
});

function storageAvailable(type) {
	try {
		var storage = window[type];
		var	x = '__storage_test__';
		storage.setItem(x, x);
		storage.removeItem(x);
		return true;
	} catch (err) {
		return false;
	}
}

var flags = [
	'broadcast'
];

function Socket(namespace) {
	this.namespace = namespace || null;

	if (!storageAvailable('localStorage')) {
		throw new Error('LocalStorage does not exist! tab-sockets cannot run');
	}

	if (!namespace) {
		namespace = null;
	}

	this.fromRooms = new Set([tabUUID]);
	this.toRooms = [];
	this.flags = {};

	this.typeListeners = {};

	this.id = uuid.v4();

	this.join(this.id);
}

Socket.prototype.getMessage = function (message) {
	if (
		(!message.namespace || message.namespace === this.namespace) &&
		(
			message.rooms.length === 0 ||
			message.rooms.filter(elem => {
				return this.fromRooms.has(elem);
			}).length > 0
		) &&
		this.typeListeners[message.type]) {
		this.typeListeners[message.type](message.data, message.senderid);
	}
};

Socket.prototype.join = function (room) {
	this.fromRooms.add(room);
};

Socket.prototype.leave = function (room) {
	this.fromRooms.delete(room);
};

Socket.prototype.on = function (type, func) {
	this.typeListeners[type] = func;
};

Socket.prototype.to =
Socket.prototype.in = function (room) {
	if (this.toRooms.indexOf(room) === -1) {
		this.toRooms.push(room);
	}
	return this;
};

Socket.prototype.emit = function (type, data) {
	var message = {
		namespace: this.namespace,
		rooms: this.toRooms,
		data: data,
		tabId: tabUUID,
		senderid: this.id,
		type: type,
		nonce: uuid.v4()
	};

	localStorage.setItem('tab-sockets', JSON.stringify(message));
	localStorage.removeItem('tab-sockets');

	for (var i = 0; i < socketsInTab.length; i++) {
		var socket = socketsInTab[i];
		if (this.id !== socket.id || !this.flags.broadcast) {
			socket.getMessage(message);
		}
	}

	// Reset all flags
	this.flags = {};
	this.toRooms = [];
};

// Goes through and defines the flag getters as flag setters
flags.forEach(function (flag) {
	Socket.prototype.__defineGetter__(flag, function () {
		this.flags[flag] = true;
		return this;
	});
});

module.exports = function (namespace) {
	var socket = new Socket(namespace);
	socketsInTab.push(socket);
	return socket;
};
