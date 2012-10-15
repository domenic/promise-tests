"use strict";

var assert = require("assert");

var adapter = require("./adapters/q");
var pending = adapter.pending;

// As described in the "Requirements" section of the CommonJS wiki on Promises [1], number 3.2, you should be able to
// distribute the resolver to multiple mutually-suspicious consumers, and have them "race" to resolve the promise.
// This is somewhat analogous to synchronous land where there can be a "race" between multiple `return` and `throw`
// statements within the same function. It's useful for implementing cases like a race between a timeout rejection and
// a normal resolution, as in Q's `Q.timeout(promise, ms)` [2].
//
// However, this is not in the Promises/A spec itself, so it remains here as an extension.

// [1]: http://wiki.commonjs.org/wiki/Promises
// [2]: https://github.com/kriskowal/q/blob/c2c7353dfa5341b1f57bd5f4c3ac40064bf3e63f/q.js#L1445-1465

describe("resolution races", function () {
    it("does not throw when fulfilling twice", function () {
        var tuple = pending();

        tuple.fulfill();
        assert.doesNotThrow(function () {
            tuple.fulfill();
        });
    });

    it("does not throw when rejecting twice", function () {
        var tuple = pending();

        tuple.reject();
        assert.doesNotThrow(function () {
            tuple.reject();
        });
    });

    it("does not throw when fulfilling, then rejecting", function () {
        var tuple = pending();

        tuple.fulfill();
        assert.doesNotThrow(function () {
            tuple.reject();
        });
    });

    it("does not throw when rejecting, then fulfilling", function () {
        var tuple = pending();

        tuple.reject();
        assert.doesNotThrow(function () {
            tuple.fulfill();
        });
    });
});
