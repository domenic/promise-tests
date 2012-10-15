# A Promises/A Test Suite

Inspired by ["You're Missing the Point of Promises,"][essay] I wrote this test suite for the [CommonJS Promises/A][]
spec. If you're not passing this, something's wrong.


[essay]: https://gist.github.com/3889970
[CommonJS Promises/A]: http://wiki.commonjs.org/wiki/Promises/A


## How It Works

The tests run in Node.js.

You create an adapter in `lib/adapters`, reading the `README.md` file there for guidance. Then you change the `require`
in `lib/promises-a.js` to point to your adapter. Then you run `npm test`.

So far we have adapters for [jQuery][] (fails), [promise-stream][] (fails), [Q][] (passes), and [when.js][] (passes).
You can get the related libraries by running `npm install`, but you'll still have to manually switch the `require` over
to that adapter. (By default it runs the tests against Q.)


[jQuery]: http://api.jquery.com/category/deferred-object/
[promise-stream]: https://github.com/Raynos/promise-stream
[Q]: https://github.com/kriskowal/q
[when.js]: https://github.com/cujojs/when


## Other Included Tests

Promises/A is a rather bare spec. Most promise implementations have converged on certain semantics which make working
with promises much more pleasant. Those tests are included in other files in the `lib` directory, and can be run with
`npm run test-extensions`, although you will need to go manually edit the adapter lines as before.

### Returning a Promise from a Handler

There is, unfortunately, a very common and important behavior of thenables that is actually *not* in the Promises/A
spec: what happens when one of your handlers returns a promise? For concreteness, let's use this example:

```js
var a = b.then(function () {
    return c; // `c` is a promise
});
```

Most implementations have converged on the answer that `a` should be resolved in the same way as `c`, i.e.

- `a` should be fulfilled if and only if `c` is fulfilled, and with `c`'s fulfillment value
- `a` should be rejected if and only if `c` is rejected, and with `c`'s rejection reason

Unfortunately the Promises/A spec alone seems to imply that `a` should always be fulfilled, with the promise `c` as its
fulfillment value!

Tests for this spec extension are included as `lib/returning-a-promise.js`.

### Resolution Races

As described in the "Requirements" section of the [CommonJS wiki on Promises][wiki], number 3.2, you should be able to
distribute the resolver to multiple mutually-suspicious consumers, and have them "race" to resolve the promise. This is
somewhat analogous to the synchronous case where there can be a "race" between multiple `return` and `throw` statements
within the same function. It's useful for implementing cases like a race between a timeout rejection and a normal
resolution, as in Q's [`Q.timeout(promise, ms)`][timeout]. And it has some security implications in the
[object-capability][] sense.

In particular, this means that resolvers (i.e. someone with only the ability to fulfill or reject a promise) should not
be able to observe the state of the promise so far. For example, attempting to resolve multiple times should not throw
an error, since that would be a way for someone with only resolver capabilities to determine a promise's state. However,
the Promises/A spec itself failed to capture this requirement, even though the CommonJS group considered it important,
so implementations are still Promises/A conforming if they throw errors.

Tests for this spec extension are included as `lib/resolution-races.js`.


[object-capability]: http://en.wikipedia.org/wiki/Object-capability_model
[wiki]: http://wiki.commonjs.org/wiki/Promises
[timeout]: https://github.com/kriskowal/q/blob/c2c7353dfa5341b1f57bd5f4c3ac40064bf3e63f/q.js#L1445-1465


## Room for Improvement

I'd like this to run more easily in the browser, for libraries like [Ember][] or jQuery (even though in the latter case
I've hacked together a [jsdom][]-based solution).

I'd also like something less silly than requiring you to go in manually and change the adapter `require` line. Maybe
a prompt, or maybe just loop through and run them all?

Finally, it'd be cool to expand these tests to cover the behavior of deferreds, which are more or less the canonical
promise-creation technique. There are a few subtleties there regarding resolving a deferred with a pending promise that
not everyone gets right. That's beyond the scope of Promises/A, but there's a reason I named the repo "promise-tests"
instead of "promises-a-tests" :).


[Ember]: https://github.com/emberjs/ember.js/commit/f7ac080db3a2a15f5814dc26fc86712cf7d252c8
[jsdom]: https://github.com/tmpvar/jsdom
