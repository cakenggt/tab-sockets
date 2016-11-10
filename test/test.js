/* eslint no-unused-expressions: "off" */
/* global $ io */

const fileUrl = require('file-url');
const Horseman = require('node-horseman');
const expect = require('chai').expect;

const path = fileUrl('test/test.html');

describe('single tab socket', function () {
	this.timeout(10000);
	it('horseman able to access local files', function () {
		var hm = new Horseman();
		return hm
			.open(path)
			.openTab(path)
			.evaluate(function () {
				return $('#test').text();
			})
			.then(function (text) {
				expect(text).to.equal('hello');
			})
			.close();
	});
	it('emit to self', function () {
		var rand = Math.random().toString();
		var hm = new Horseman();
		return hm
			.open(path)
			.evaluate(function (rand, done) {
				var a = io();
				a.on('test-action', function (data) {
					done(null, data);
				});
				a.emit('test-action', rand);
			}, rand)
			.then(function (r) {
				expect(r).to.equal(rand);
			})
			.close();
	});
	it('broadcast not received by sender', function () {
		var hm = new Horseman();
		return hm
			.open(path)
			.evaluate(function (done) {
				var a = io();
				a.on('test-action', function () {
					done('Emitter is not supposed to receive broadcast!');
				});
				a.broadcast.emit('test-action');
				setTimeout(function () {
					done(null);
				}, 50);
			})
			.close();
	});
	it('emit received by other socket on same tab', function () {
		var rand = Math.random().toString();
		var hm = new Horseman();
		return hm
			.open(path)
			.evaluate(function (rand, done) {
				var a = io();
				var b = io();
				b.on('test-action', function (data) {
					done(null, data);
				});
				a.emit('test-action', rand);
			}, rand)
			.then(function (r) {
				expect(r).to.equal(rand);
			})
			.close();
	});
	it('broadcast received by other socket on same tab', function () {
		var rand = Math.random().toString();
		var hm = new Horseman();
		return hm
			.open(path)
			.evaluate(function (rand, done) {
				var a = io();
				var b = io();
				b.on('test-action', function (data) {
					done(null, data);
				});
				a.broadcast.emit('test-action', rand);
			}, rand)
			.then(function (r) {
				expect(r).to.equal(rand);
			})
			.close();
	});
});
describe('multiple tab sockets', function () {
	this.timeout(10000);
	it('emit to other tab', function () {
		var rand = Math.random().toString();
		var hm = new Horseman();
		return hm
			.open(path)
			.openTab(path)
			.switchToTab(0)
			.evaluate(function (rand) {
				var a = io();
				setTimeout(function () {
					a.emit('test-action', rand);
				}, 50);
			}, rand)
			.switchToTab(1)
			.evaluate(function (done) {
				var a = io();
				a.on('test-action', function (data) {
					done(null, data);
				});
			})
			.then(function (r) {
				expect(r).to.equal(rand);
			})
			.close();
	});
	it('broadcasts to other tab', function () {
		var rand = Math.random().toString();
		var hm = new Horseman();
		return hm
			.open(path)
			.openTab(path)
			.switchToTab(0)
			.evaluate(function (rand) {
				var a = io();
				setTimeout(function () {
					a.broadcast.emit('test-action', rand);
				}, 50);
			}, rand)
			.switchToTab(1)
			.evaluate(function (done) {
				var a = io();
				a.on('test-action', function (data) {
					done(null, data);
				});
			})
			.then(function (r) {
				expect(r).to.equal(rand);
			})
			.close();
	});
	it('receives when in right room', function () {
		var rand = Math.random().toString();
		var hm = new Horseman();
		return hm
			.open(path)
			.openTab(path)
			.switchToTab(0)
			.evaluate(function (rand) {
				var a = io();
				setTimeout(function () {
					a.to('test').emit('test-action', rand);
				}, 50);
			}, rand)
			.switchToTab(1)
			.evaluate(function (done) {
				var a = io();
				a.join('test');
				a.on('test-action', function (data) {
					done(null, data);
				});
			})
			.close();
	});
	it('doesn\'t receive in wrong room', function () {
		var rand = Math.random().toString();
		var hm = new Horseman();
		return hm
			.open(path)
			.openTab(path)
			.switchToTab(0)
			.evaluate(function (rand) {
				var a = io();
				setTimeout(function () {
					a.to('test').emit('test-action', rand);
				}, 50);
			}, rand)
			.switchToTab(1)
			.evaluate(function (done) {
				var a = io();
				a.on('test-action', function () {
					done('Not supposed to receive when not in room!');
				});
				setTimeout(function () {
					done(null);
				}, 500);
			})
			.close();
	});
	it('receives when in right namespace', function () {
		var rand = Math.random().toString();
		var hm = new Horseman();
		return hm
			.open(path)
			.openTab(path)
			.switchToTab(0)
			.evaluate(function (rand) {
				var a = io('test');
				setTimeout(function () {
					a.emit('test-action', rand);
				}, 50);
			}, rand)
			.switchToTab(1)
			.evaluate(function (done) {
				var a = io('test');
				a.on('test-action', function (data) {
					done(null, data);
				});
			})
			.close();
	});
	it('doesn\'t receive in wrong namespace', function () {
		var rand = Math.random().toString();
		var hm = new Horseman();
		return hm
			.open(path)
			.openTab(path)
			.switchToTab(0)
			.evaluate(function (rand) {
				var a = io('test');
				setTimeout(function () {
					a.emit('test-action', rand);
				}, 50);
			}, rand)
			.switchToTab(1)
			.evaluate(function (done) {
				var a = io();
				a.on('test-action', function () {
					done('Not supposed to receive when not in namespace!');
				});
				setTimeout(function () {
					done(null);
				}, 500);
			})
			.close();
	});
});
