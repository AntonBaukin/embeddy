/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                                                               |
 |                      Scripting Basics                         |
 |                                                               |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT  = JsX.once('./asserts.js')
var ZeTA = JsX.once('./arrays.js')


// +----: Programming with Objects: ----------------------------->

ZeT.extend = function(obj, ext)
{
	if(!obj) obj = {}
	if(!ext) return obj

	//~: copy all the keys existing
	var keys = Object.keys(ext)
	for(var i = 0;(i < keys.length);i++)
		obj[keys[i]] = ext[keys[i]]

	return obj
}

ZeT.extend(ZeT,
{
	JAVA_MAP         : Java.type("java.util.Map"),

	keys             : function(o)
	{
		if(o instanceof ZeT.JAVA_MAP)
			return new java.util.ArrayList(o.keySet())
		return Object.keys(o)
	},

	/**
	 * Allows to clone deeply object with prototype support.
	 * It directly copies fields of this types: numbers, booleans,
	 * functions, not a plain objects. Arrays are copied deeply.
	 */
	deepClone        : function(obj)
	{
		//?: {undefined, null, false, zero}
		if(!obj) return obj

		//?: {is string} copy it
		if(ZeT.iss(obj)) return '' + obj

		//?: {is an array}
		var i, res; if(ZeT.isa(obj))
		{
			res = new Array(obj.length)
			for(i = 0;(i < obj.length);i++)
				res[i] = ZeT.deepClone(obj[i])
			return res
		}

		//?: {not a plain object}
		if(!ZeT.iso(obj)) return obj; else

		//~: create instance with same prototype
		(function()
		{
			function U() {}
			U.prototype = Object.getPrototypeOf(obj)
			res = new U()
		})();

		//~: extend
		var keys = ZeT.keys(obj)
		for(i = 0;(i < keys.length);i++)
			res[keys[i]] = ZeT.deepClone(obj[keys[i]])

		return res
	},

	/**
	 * Takes object and copies all the fields from the source
	 * when the same fields are undefined (note that nulls are
	 * not undefined). If field is a plain object, extends
	 * it deeply. Note that arrays are not merged.
	 * A deep clone of a field value is assigned.
	 */
	deepExtend       : function(obj, src)
	{
		if(!src) return obj
		if(!obj) obj = {}

		//?: {not an object}
		ZeT.assert(ZeT.iso(obj), 'ZeT.deepExtend(): not an object! ', obj)

		var k, keys = ZeT.keys(src)
		for(var i = 0;(i < keys.length);i++)
			//?: {field is undefined}
			if(ZeT.isu(obj[k = keys[i]]))
				obj[k] = ZeT.deepClone(src[k])
			//?: {extend nested object}
			else if(ZeT.iso(obj[k]))
				ZeT.deepExtend(obj[k], src[k])

		return obj
	}
})


// +----: Programming with Functions: --------------------------->

ZeT.extend(ZeT,
{
	/**
	 * Returns a function having 'this' assigned to 'that'
	 * argument and the following arguments passed as
	 * the first arguments of each call.
	 *
	 * 0   [required] a function;
	 * 1   [required] 'this' context tu use;
	 * 2.. [optional] first and the following arguments.
	 */
	fbind            : function(f, that)
	{
		//?: {has function and the context}
		ZeT.assert(ZeT.isf(f))
		ZeT.assertn(that)

		//~: copy the arguments
		var args = ZeTA.copy(arguments, 2)

		return function()
		{
			var a = ZeTA.concat(ZeTA.copy(args), arguments)
			return f.apply(that, a)
		}
	},

	/**
	 * Works as ZeT.fbind(), but takes additional
	 * arguments as a copy of array-like object given.
	 */
	fbinda           : function(f, that, args)
	{
		//?: {has function and the context}
		ZeT.assert(ZeT.isf(f))
		ZeT.assertn(that)

		//~: copy the arguments
		args = ZeTA.copy(args)

		return function()
		{
			var a = ZeTA.concat(ZeTA.copy(args), arguments)
			return f.apply(that, a)
		}
	},

	/**
	 * Universal variant of ZeT.fbind().
	 * Second argument may be this context.
	 * Else arguments are index (0-based)
	 * followed by the value.
	 */
	fbindu           : function(f /*, [this], (i, arg)* */)
	{
		//?: {has function and the context}
		ZeT.assert(ZeT.isf(f))

		var that = arguments[1], iarg = []

		//?: {with this-context}
		var i = 1; if(arguments.length%2 == 0) i = 2; else
			that = undefined

		//~: copy following arguments
		while(i < arguments.length)
		{
			ZeT.assert(ZeT.isi(arguments[i]))
			ZeT.assert(arguments[i] >= 0)
			iarg.push(arguments[i])
			ZeT.assert(i + 1 < arguments.length)
			iarg.push(arguments[i+1])
			i += 2
		}

		return function()
		{
			var a = ZeT.a(arguments)
			for(i = 0;(i < iarg.length);i += 2)
				a.splice(iarg[i], 0, iarg[i+1])

			return f.apply(ZeT.isu(that)?(this):(that), a)
		}
	},

	/**
	 * Creates a function that sequentially calls the
	 * functions given as the arguments.
	 *
	 * All the functions share the same call context.
	 * The arguments of the pipe call are given to the
	 * first function. The result is then given as the
	 * arguments of the next call as arguments array!
	 * So when the result is an array, and you want it
	 * to come as the first argument only, but is not
	 * split into the arguments, wrap it in array
	 * (i.e., array in array).
	 *
	 * Warning: if intermediate result is undefined
	 * or null, the pipe processing is stopped!
	 *
	 * The result of the last call is returned as is.
	 */
	pipe             : function(/* functions */)
	{
		var fn = []; ZeT.each(arguments, function()
		{
			ZeT.assert(ZeT.isf(this)); fn.push(this)
		})

		//?: {has just one item in the pipe}
		ZeT.assert(fn.length, 'ZeT.pipe() functions are not defined!')
		if(fn.length == 1) return fn[0]

		return function()
		{
			var r = ZeT.a(arguments) //<-- intermediate result

			for(var i = 0;(i < fn.length);i++)
			{
				//?: {previous results are not an array}
				if(!ZeT.isa(r)) r = [r] //<-- wrap for apply

				//~: invoke the i-th function of the pipe
				r = fn[i].apply(this, r)

				//?: {has no result}
				if(ZeT.isu(r) || (r === null))
					return r
			}

			return r
		}
	}
})


// +----: Helper Functions: ------------------------------------->

ZeT.extend(ZeT,
{
	/**
	 * See ZeTA.a().
	 */
	a                : ZeTA.a,

	/**
	 * Evaluates the script given in the function body.
	 */
	xeval            : function(script)
	{
		return ZeT.ises(script)?(undefined):
		  eval('((function(){'.concat(script, '})());'))
	},

	/**
	 * Takes array-like object and invokes the
	 * function given on each item. Function
	 * receives arguments: [0] is the item,
	 * [1] is the item index.
	 *
	 * This-context of the function call
	 * is also the item iterated.
	 *
	 * If call on some item returns false, iteration
	 * is breaked and that stop-index is returned.
	 */
	each             : function(a, f)
	{
		if(!a) return undefined
		ZeT.assert(ZeT.isi(a.length))
		ZeT.assert(ZeT.isf(f))

		for(var i = 0;(i < a.length);i++)
			if(f.call(a[i], a[i], i) === false)
				return i
		return a.length
	},

	collect          : function(a, f)
	{
		//?: {collect a property}
		var p; if(ZeT.iss(p = f)) f = function(x) { return x[p] }
		ZeT.assert(ZeT.isf(f))

		var r = []; ZeT.each(a, function(x, i)
		{
			x = f.call(x, x, i)
			if(!ZeT.isu(x)) r.push(x)
		})

		return r
	}
}) //<-- return this value