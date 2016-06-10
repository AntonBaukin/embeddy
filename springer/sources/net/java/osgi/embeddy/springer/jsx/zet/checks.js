/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                        Various Checks                         |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT = JsX.once('./mini.js')

ZeT.extend(ZeT,
{
	/**
	 * Returns true when the argument is a string.
	 */
	iss              : function(s)
	{
		return (typeof s === 'string')
	},

	/**
	 * Returns false for not a string objects, or for
	 * strings that are whitespace-trimmed empty.
	 */
	ises             : function(s)
	{
		return !ZeT.iss(s) || !s.length || !/\S/.test(s)
	},

	isf              : function(f)
	{
		return (typeof f === 'function')
	},

	/**
	 * Is plain object, or an object having prototype.
	 */
	isox             : function(o)
	{
		return !!o && !ZeT.isa(o) && (
		  (typeof o === 'object') ||
		  (o instanceof ZeT.JAVA_MAP)
		)
	},

	/**
	 * Is plain object (having no prototype).
	 */
	iso              : function(o)
	{
		return ZeT.isox(o) && (
		  (Object.prototype === Object.getPrototypeOf(o)) ||
		  (o instanceof ZeT.JAVA_MAP)
		)
	},

	isb              : function(b)
	{
		return (typeof b === 'boolean')
	},

	isu              : function(o)
	{
		return (typeof o === 'undefined')
	},

	/**
	 * First variant of call takes single arguments
	 * and returns true when it's undefined or null.
	 *
	 * Second, takes:
	 *
	 * [0] value to check;
	 * [1] object to test;
	 * ... properties path.
	 *
	 * If the object is undefined or null, returns true.
	 * If the path to the destination property is given
	 * (each path element as a distinct argument), goes
	 * into the object. If any intermediate member is
	 * undefined or null, or the final property is,
	 * return true.
	 *
	 * When final member is defined checks it (soft ==)
	 * against the given value: returns the check result.
	 *
	 * Sample. ZeT.isx(true, opts, 'a', 0, 'b')
	 * returns true when opts, or opts.a, or opts.a[0],
	 * or opts.a[0].b are undefined or null, or final
	 * (opts.a[0].b == true).
	 *
	 * Also, if value to check is a function, invokes
	 * it on the final member instead of equality,
	 * and with undefined value when intermediate
	 * member is undefined or null.
	 */
	isx              : ZeT.scope(function()
	{
		function isux(o)
		{
			return (o === null) || (typeof o === 'undefined')
		}

		function i$x(check, o)
		{
			//?: {comparator}
			if(ZeT.isf(check))
				return check(o)

			//?: {is undefined | soft equality}
			return ZeT.isu(o) || (check == o)
		}

		return function()
		{
			//?: {single value to check}
			var l = arguments.length
			if(l <= 1) return isux(arguments[0])

			//~: initial object to check
			var o = arguments[1]
			if(isux(o)) return true

			//~: trace to the target member
			for(var k, i = 2;(i < l);i++)
			{
				//?: {has the key undefined}
				if(isux(k = arguments[i]))
					return undefined

				//?: {has the object undefined}
				if(isux(o = o[k]))
					break
			}

			return i$x(arguments[0], o)
		}
	}),

	isa              : Array.isArray,

	/**
	 * Test is array-like object. It is an array,
	 * or object that has integer length property,
	 * except string and functions.
	 */
	isax             : function(x)
	{
		return ZeT.isa(x) || (!ZeT.isx(x) &&
		  ZeT.isi(x.length) && !ZeT.iss(x) && !ZeT.isf(x))
	},

	/**
	 * Tels the argument is a number.
	 */
	isn              : ZeT.scope(function()
	{
		var tos = Object.prototype.toString

		return function(n)
		{
			return (tos.call(n) === '[object Number]')
		}
	}),

	/**
	 * Tels the argument is an integer number.
	 */
	isi              : function(i)
	{
		return ZeT.isn(i) && (i === (i|0))
	},

	/**
	 * Returns true if the argument is defined, not false, 0, not
	 * ws-empty string or empty array, or array-like object having
	 * an item like that. (Up to one level of recursion only!)
	 *
	 * Warning as a sample: if you test agains an array that
	 * contains 0, false, null, undefined, ws-empty string,
	 * or an empty array (just empty) — test fails!
	 */
	test             : ZeT.scope(function(/* x */)
	{
		function notdef(x)
		{
			return (x === null) || (x === false) ||
			  (x === 0) || (typeof x === 'undefined') ||
			  (ZeT.iss(x) && ZeT.ises(x)) ||
			  (ZeT.isa(x) && !x.length)
		}

		return function(x)
		{
			//?: {root check is undefined}
			if(notdef(x)) return false

			//?: {root check is not array-like}
			if(!ZeT.isax(x)) return true

			//~: check all the items of array-like are defined
			for(var i = 0;(i < x.length);i++)
				if(!notdef(x[i])) return true

			return false //<-- array is empty
		}
	})
}) //<-- return this value