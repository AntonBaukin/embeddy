/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                       Array Utilities                        |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT  = JsX.once('./basics.js')
var ZeTA = ZeT.define('ZeT.A',
{
	/**
	 * Creates a copy of array-like object given.
	 * Optional [begin; end) range allows to copy
	 * a part of the array. Negative values of
	 * the range boundaries are not allowed.
	 */
	copy             : function(a, begin, end)
	{
		//?: {has no range}
		if(ZeT.isu(begin))
			return ZeT.isa(a)?(a.slice()):ZeT.a(a)

		//?: {end is undefined}
		if(ZeT.isu(end) || (end > a.length))
			end = a.length

		//~: asserts on [begin; end)
		ZeT.assert(ZeT.isi(begin) && ZeT.isi(end))
		ZeT.assert((begin >= 0) && (begin <= end))

		//?: {is an array exactly}
		if(ZeT.isa(a)) return a.slice(begin, end)

		//~: manual copy
		var r = new Array(end - begin)
		for(var i = begin;(i < end);i++)
			r[i - begin] = a[i]
		return r
	},

	/**
	 * Removes the items from the target array.
	 * If item is itself an array, recursively
	 * invokes this function.
	 *
	 * Items are checked with indexOf() equality
	 * (put it to array, then check it is there).
	 * Undefined and null items are supported.
	 *
	 * Returns the target array.
	 */
	remove           : ZeT.scope(function(/* array, item, ... */)
	{
		var u = {}, n = {}

		function collect(m, a)
		{
			if(ZeT.isu(a)) return m[u] = true
			if(a === null) return m[n] = true

			if(!ZeT.isax(a))
				return m.push(a)

			for(var i = 0;(i < a.length);i++)
				collect(m, a[i])
		}

		function test(m, x)
		{
			if(ZeT.isu(x)) x = u
			if(x === null) x = n
			return (m.indexOf(x) >= 0)
		}

		return function(a)
		{
			var m = [], r = []

			//~: collect the keys
			for(var i = 1;(i < arguments.length);i++)
				collect(m, arguments[i])

			//~: scan for ranged splicing
			for(i = 0;(i < a.length);i++)
				if(test(m, a[i]))
				{
					//~: scan for the range
					for(var j = i + 1;(j < a.length);j++)
						if(!test(m, a[j])) break;

					r.push(i)
					r.push(j - i)
					i = j //<-- advance
				}

			//~: back splicing
			for(var i = r.length - 2;(i >= 0);i -= 2)
				a.splice(r[i], r[i+1])

			return a //<-- target array
		}
	}),

	/**
	 * Takes two array-like objects and optional
	 * [begin, end) range from the second one.
	 *
	 * If the first (target) object is an array,
	 * modifies it adding the items from the
	 * second object in the range given.
	 *
	 * If the target object is not an array,
	 * makes it's array-copy, returns it.
	 */
	concat           : function(a, b, begin, end)
	{
		a = ZeT.a(a)

		//?: {has range} make a copy
		if(ZeT.isu(begin)) b = ZeT.a(b); else
			b = ZeTA.copy(b, begin, end)

		//~: push all the items
		Array.prototype.push.apply(a, b)
		return a
	},

	/**
	 * Checks that two objects are array-like and
	 * have the same length and the items each
	 * strictly (===) equals.
	 */
	eq               : function(a, b)
	{
		if(a === b) return true
		if(ZeT.isx(a) || ZeT.isx(b))
			return (ZeT.isx(a) == ZeT.isx(b))

		//?: {not array-like}
		if(!ZeT.isi(a.length) || !ZeT.isi(b.length))
			return false

		//?: {length differ}
		var l = a.length
		if(l != b.length)
			return false

		for(var i = 0;(i < l);i++)
			if(a[i] !== b[i])
				return false
		return true
	}
})

ZeTA //<-- return this value