/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                        The Minimum                            |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT = JsX.global('ZeT')

ZeT.JAVA_MAP = Java.type("java.util.Map")

ZeT.keys     = function(o)
{
	if(o instanceof ZeT.JAVA_MAP)
	{
		var r = new Array(o.size())
		var i = o.keySet().iterator()

		for(var j = 0;(i.hasNext());j++)
			r[j] = i.next()

		return r
	}

	return Object.keys(o)
}

/**
 * Extends optional object with optional
 * extension. Assigns only own properties
 * of the object.
 *
 * Returns the extended object.
 */
ZeT.extend   = function(obj, ext)
{
	if(!obj) obj = {}
	if(!ext) return obj

	//~: copy all the keys existing
	var keys = ZeT.keys(ext)
	for(var i = 0;(i < keys.length);i++)
		obj[keys[i]] = ext[keys[i]]

	return obj
}

ZeT.extend(ZeT,
{
	/**
	 * Invokes the function given. Optional arguments
	 * must go before the function-body. This-context
	 * of the call is passed to the callback.
	 */
	scope            : function(/* [parameters] f */)
	{
		var f = arguments[arguments.length - 1]
		if((typeof f != 'function'))
			throw new Error('ZeT.scope() got not a function!')

		//?: {has additional arguments}
		for(var a = [], i = 0;(i < arguments.length - 1);i++)
			a.push(arguments[i])

		return (a.length)?(f.apply(this, a)):(f.call(this))
	},

	/**
	 * Directly concatenates to string items of array-like
	 * object starting with the index given.
	 */
	cati             : (function(/* index, array-like */)
	{
		var concat = String.prototype.concat

		function isx(o)
		{
			return (o === null) || (typeof o === 'undefined')
		}

		function isn(n)
		{
			return '[object Number]' ===
			  Object.prototype.toString.call(n)
		}

		function isi(i)
		{
			return isn(i) && (i === (i|0))
		}

		return function(index, objs)
		{
			if(!objs || !isi(objs.length))
				return ''

			for(var i = 0;(i < objs.length);i++)
				if((i < index) || isx(objs[i]))
					objs[i] = ''

			return concat.apply('', objs)
		}
	})(),

	/**
	 * Returns (as a string) current JS call stack.
	 * Optional integer argument allows to take only
	 * the leading lines of result.
	 */
	stack            : function(n)
	{
		var s = '' + new Error().stack
		if(!arguments.length) return s

		//~: split & splice
		if((s = s.split('\n')).length > n)
			s.splice(n, s.length - n)

		return s.join('\n')
	}
}) //<-- return this value