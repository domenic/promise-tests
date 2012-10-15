"use strict";

var assert = require("assert");
var sinon = require("sinon");

var adapter = require("./adapters/promise");
var fulfilled = adapter.fulfilled;
var rejected = adapter.rejected;
var pending = adapter.pending;
var throws = adapter.throws;

var other = { should: "not get here" }; // a dummy value we don't want to be strict equal to
var sentinel = { should: "get resolved" }; // a sentinel fulfillment value to test for with strict equality

if (throws) {
  var optionalThrows = function(callback) {
    assert.throws(function() {
      callback();
    }, Error);
  };
} else {
  var optionalThrows = function(callback) {
    callback();
  }
}

describe("Basic characteristics of `then`", function () {
    describe("for fulfilled promises", function () {
        it("must return a new promise", function () {
            var promise1 = fulfilled();
            var promise2 = promise1.then();

            assert.notStrictEqual(promise1, promise2);
        });

        it("calls the fulfillment callback", function (done) {
            fulfilled(sentinel).then(function (value) {
                assert.strictEqual(value, sentinel);
                done();
            });
        });
    });

    describe("for rejected promises", function () {
        it("must return a new promise", function () {
            var promise1 = rejected();
            var promise2 = promise1.then();

            assert.notStrictEqual(promise1, promise2);
        });

        it("calls the rejection callback", function (done) {
            rejected(sentinel).then(null, function (reason) {
                assert.strictEqual(reason, sentinel);
                done();
            });
        });
    });

    describe("for pending promises", function () {
        it("must return a new promise", function () {
            var promise1 = pending().promise;
            var promise2 = promise1.then();

            assert.notStrictEqual(promise1, promise2);
        });
    });
});

describe("State transitions", function () {
    it("cannot fulfill twice", function (done) {
        var tuple = pending();
        tuple.promise.then(function (value) {
            assert.strictEqual(value, sentinel);
            done();
        });

        tuple.fulfill(sentinel);

        optionalThrows(function() {
          tuple.fulfill(other);
        });
    });

    it("cannot reject twice", function (done) {
        var tuple = pending();
        tuple.promise.then(null, function (reason) {
            assert.strictEqual(reason, sentinel);
            done();
        });

        tuple.reject(sentinel);

        optionalThrows(function() {
          tuple.reject(other);
        });
    });

    it("cannot fulfill then reject", function (done) {
        var tuple = pending();
        tuple.promise.then(function (value) {
            assert.strictEqual(value, sentinel);
            done();
        });

        tuple.fulfill(sentinel);

        optionalThrows(function() {
          tuple.reject(other);
        });
    });

    it("cannot reject then fulfill", function (done) {
        var tuple = pending();
        tuple.promise.then(null, function (reason) {
            assert.strictEqual(reason, sentinel);
            done();
        });

        tuple.reject(sentinel);

        optionalThrows(function() {
          tuple.fulfill(other);
        });
    });
});

describe("Chaining off of a fulfilled promise", function () {
    describe("when the first fulfillment callback returns a new value", function () {
        it("should call the second fulfillment callback with that new value", function (done) {
            fulfilled(other).then(function () {
                return sentinel;
            }).then(function (value) {
                assert.strictEqual(value, sentinel);
                done();
            });
        });
    });

    describe("when the first fulfillment callback throws an error", function () {
        it("should call the second rejection callback with that error as the reason", function (done) {
            fulfilled(other).then(function () {
                throw sentinel;
            }).then(null, function (reason) {
                assert.strictEqual(reason, sentinel);
                done();
            });
        });
    });

    describe("with only a rejection callback", function () {
        it("should call the second fulfillment callback with the original value", function (done) {
            fulfilled(sentinel).then(null, function () {
                return other;
            }).then(function (value) {
                assert.strictEqual(value, sentinel);
                done();
            });
        });
    });
});

describe("Chaining off of a rejected promise", function () {
    describe("when the first rejection callback returns a new value", function () {
        it("should call the second fulfillment callback with that new value", function (done) {
            rejected(other).then(null, function () {
                return sentinel;
            }).then(function (value) {
                assert.strictEqual(value, sentinel);
                done();
            });
        });
    });

    describe("when the first rejection callback throws a new reason", function () {
        it("should call the second rejection callback with that new reason", function (done) {
            rejected(other).then(null, function () {
                throw sentinel;
            }).then(null, function (reason) {
                assert.strictEqual(reason, sentinel);
                done();
            });
        });
    });

    describe("when there is only a fulfillment callback", function () {
        it("should call the second rejection callback with the original reason", function (done) {
            rejected(sentinel).then(function () {
                return other;
            }).then(null, function (reason) {
                assert.strictEqual(reason, sentinel);
                done();
            });
        });
    });
});

describe("Chaining off of an eventually-fulfilled promise", function () {
    describe("when the first fulfillment callback returns a new value", function () {
        it("should call the second fulfillment callback with that new value", function (done) {
            var tuple = pending();
            tuple.promise.then(function () {
                return sentinel;
            }).then(function (value) {
                assert.strictEqual(value, sentinel);
                done();
            });

            setTimeout(function () {
                tuple.fulfill(other);
            }, 10);
        });
    });

    describe("when the first fulfillment callback throws an error", function () {
        it("should call the second rejection callback with that error as the reason", function (done) {
            var tuple = pending();
            tuple.promise.then(function () {
                throw sentinel;
            }).then(null, function (reason) {
                assert.strictEqual(reason, sentinel);
                done();
            });

            setTimeout(function () {
                tuple.fulfill(other);
            }, 10);
        });
    });

    describe("with only a rejection callback", function () {
        it("should call the second fulfillment callback with the original value", function (done) {
            var tuple = pending();
            tuple.promise.then(null, function () {
                return other;
            }).then(function (value) {
                assert.strictEqual(value, sentinel);
                done();
            });

            setTimeout(function () {
                tuple.fulfill(sentinel);
            }, 10);
        });
    });
});

describe("Chaining off of an eventually-rejected promise", function () {
    describe("when the first rejection callback returns a new value", function () {
        it("should call the second fulfillment callback with that new value", function (done) {
            var tuple = pending();
            tuple.promise.then(null, function () {
                return sentinel;
            }).then(function (value) {
                assert.strictEqual(value, sentinel);
                done();
            });

            setTimeout(function () {
                tuple.reject(other);
            }, 10);
        });
    });

    describe("when the first rejection callback throws a new reason", function () {
        it("should call the second rejection callback with that new reason", function (done) {
            var tuple = pending();
            tuple.promise.then(null, function () {
                throw sentinel;
            }).then(null, function (reason) {
                assert.strictEqual(reason, sentinel);
                done();
            });

            setTimeout(function () {
                tuple.reject(other);
            }, 10);
        });
    });

    describe("when there is only a fulfillment callback", function () {
        it("should call the second rejection callback with the original reason", function (done) {
            var tuple = pending();
            tuple.promise.then(function () {
                return other;
            }).then(null, function (reason) {
                assert.strictEqual(reason, sentinel);
                done();
            });

            setTimeout(function () {
                tuple.reject(sentinel);
            }, 10);
        });
    });
});

describe("Multiple handlers", function () {
    describe("when there are multiple fulfillment handlers for a fulfilled promise", function () {
        it("should call them all, in order, with the same fulfillment value", function (done) {
            var promise = fulfilled(sentinel);

            // Don't let their return value *or* thrown exceptions impact each other.
            var handler1 = sinon.stub().returns(other);
            var handler2 = sinon.stub().throws(other);
            var handler3 = sinon.stub().returns(other);

            var spy = sinon.spy();
            promise.then(handler1, spy);
            promise.then(handler2, spy);
            promise.then(handler3, spy);

            promise.then(function (value) {
                assert.strictEqual(value, sentinel);

                sinon.assert.calledWith(handler1, sinon.match.same(sentinel));
                sinon.assert.calledWith(handler2, sinon.match.same(sentinel));
                sinon.assert.calledWith(handler3, sinon.match.same(sentinel));
                sinon.assert.notCalled(spy);

                done();
            });
        });
    });

    describe("when there are multiple rejection handlers for a rejected promise", function () {
        it("should call them all, in order, with the same rejection reason", function (done) {
            var promise = rejected(sentinel);

            // Don't let their return value *or* thrown exceptions impact each other.
            var spy = sinon.spy();
            var handler1 = sinon.stub().returns(other);
            var handler2 = sinon.stub().throws(other);
            var handler3 = sinon.stub().returns(other);

            promise.then(spy, handler1);
            promise.then(spy, handler2);
            promise.then(spy, handler3);

            promise.then(null, function (reason) {
                assert.strictEqual(reason, sentinel);

                sinon.assert.calledWith(handler1, sinon.match.same(sentinel));
                sinon.assert.calledWith(handler2, sinon.match.same(sentinel));
                sinon.assert.calledWith(handler3, sinon.match.same(sentinel));
                sinon.assert.notCalled(spy);

                done();
            });
        });
    });
});
