/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                   Extensions to the Basics                    |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT  = JsX.once('./basics.js')
var ZeTA = JsX.once('./arrays.js')

ZeT.extend(ZeT,
{
	/**
	 * Makes shallow copy of the source with
	 * optional extension provided. Supports
	 * only plain objects.
	 */
	clone            : function(src, ext)
	{
		ZeT.assertn(src)

		var r; if(ZeT.iso(src))
			r = ZeT.extend({}, src)

		if(ZeT.iso(ext))
			r = ZeT.extend(r, ext)

		return r
	},

	/**
	 * Clone deeply object with prototype support.
	 *
	 * It directly copies fields of this types: numbers,
	 * booleans, functions, not a plain objects.
	 * Arrays are copied deeply.
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
		if(!ZeT.isox(obj)) return obj

		//~: extend
		var res = ZeT.proto(obj), keys = ZeT.keys(obj)
		for(i = 0;(i < keys.length);i++)
			res[keys[i]] = ZeT.deepClone(obj[keys[i]])

		return res
	},

	/**
	 * Takes object and copies all the fields from the source
	 * when the same fields are undefined (note that nulls are
	 * not undefined). If field is a plain object, extends
	 * it deeply. Note that arrays are not merged!
	 * A deep clone of a field value is assigned.
	 */
	deepExtend       : function(obj, src)
	{
		if(!src) return obj
		if(!obj) obj = {}

		//?: {not an object}
		ZeT.assert(ZeT.isox(obj),
		  'ZeT.deepExtend(): not an object! ')

		var k, keys = ZeT.keys(src)
		for(var i = 0;(i < keys.length);i++)
			//?: {field is undefined}
			if(ZeT.isu(obj[k = keys[i]]))
				obj[k] = ZeT.deepClone(src[k])
			//?: {extend nested object}
			else if(ZeT.isox(obj[k]))
				ZeT.deepExtend(obj[k], src[k])

		return obj
	},

	/**
	 * Takes an object, or an array-like and goes
	 * deeply in it by the names, or integer indices,
	 * or else object-keys given as the arguments.
	 */
	get              : function(/* object, properties list */)
	{
		var o = arguments[0]
		if(ZeT.isx(o)) return o

		for(var k, i = 1;(i < arguments.length);i++)
		{
			//?: {has the key undefined}
			if(ZeT.isx(k = arguments[i]))
				return undefined

			//?: {has the object undefined}
			if(ZeT.isx(o = o[k]))
				return undefined
		}

		return o
	},

	/**
	 * Returns a function having 'this' assigned to 'that'
	 * argument and the following arguments passed as
	 * the first arguments of each call.
	 *
	 * 0   [required] a function;
	 * 1   [required] 'this' context to use;
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
	 * If the arguments are restricted, no more from
	 * the call instance are added.
	 */
	fbinda           : function(f, that, args, restrict)
	{
		//?: {has function and the context}
		ZeT.assertf(f)
		ZeT.assertn(that)

		//~: copy the arguments
		args = ZeTA.copy(args)

		return function()
		{
			var a = ZeTA.copy(args)

			if(restrict !== true)
				a = ZeTA.concat(a, arguments)

			return f.apply(that, a)
		}
	},

	/**
	 * Universal variant of ZeT.fbind(). Second argument
	 * may be 'this' context. Else arguments are 0-indexed
	 * followed by the value.
	 */
	fbindu           : function(f /*, [this], (i, arg)... */)
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
	 * Trailing argument must be a function that
	 * is invoked only when all leading arguments
	 * do pass ZeT.test().
	 *
	 * Returns null when callback was not invoked,
	 * or the result of the function call.
	 */
	scopeif          : function(/* args, f */)
	{
		var a = ZeT.a(arguments)
		ZeT.assert(arguments.length)

		var f = a.pop()
		ZeT.assert(ZeT.isf(f))

		for(var i = 0;(i < a.length);i++)
			if(!ZeT.test(a[i])) return null

		return f.apply(this, a)
	},

	/**
	 * Evaluates the script given in a function body.
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
	 *
	 * This function also supports general objects
	 * that do pass ZeT.isox(). In this case iteration
	 * takes place over all own ZeT.keys(), the key
	 * is given as the second argument (as index).
	 * The call returns all the keys processed as
	 * and array, or single key had been rejected.
	 */
	each             : ZeT.scope(function(/* array | object, f */)
	{
		function eacha(a, f)
		{
			for(var i = 0;(i < a.length);i++)
				if(f.call(a[i], a[i], i) === false)
					return i

			return a.length
		}

		function eacho(o, f)
		{
			var keys = ZeT.keys(o), k = keys[0]

			for(var i = 0;(i < keys.length);k = keys[++i])
				if(f.call(o[k], o[k], k) === false)
					return k

			return keys
		}

		return function(o, f)
		{
			ZeT.assertf(f)

			if(ZeT.isax(o))
				return eacha(o, f)

			if(ZeT.isox(o))
				return eacho(o, f)
		}
	}),

	/**
	 * Invokes the function given over each not
	 * undefined item of the array-like object.
	 * Returns array of not undefined results.
	 *
	 * Instead of a function you may give anything
	 * like property-key object (name, index, ...).
	 *
	 * Callback has the same arguments as ZeT.each().
	 */
	map              : function(a, f)
	{
		//?: {collect a property}
		var p; if(!ZeT.isf(p = f))
			f = function(x) { return x[p] }

		var r = []; ZeT.each(a, function(x, i)
		{
			if(ZeT.isu(x)) return
			x = f.call(x, x, i)
			if(!ZeT.isu(x)) r.push(x)
		})

		return r
	},

	/**
	 * Converts given object to JSON formatted string.
	 */
	o2s              : function(o)
	{
		return JSON.stringify(o)
	},

	/**
	 * Converts given JSON formatted string to an object.
	 */
	s2o              : function(s)
	{
		return (ZeT.isx(s) || ZeT.ises(s))?(null):JSON.parse(s)
	}
})//<-- return this value