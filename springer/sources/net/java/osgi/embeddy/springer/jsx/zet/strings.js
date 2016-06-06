/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                      String Utilities                         |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT  = JsX.once('./basics.js')
var ZeTS = ZeT.define('ZeT.S',
{
	iss              : ZeT.iss,

	ises             : ZeT.ises,

	/**
	 * Trims side white spaces of the string given.
	 * Returns empty string as a fallback.
	 */
	trim             : function(s)
	{
		return (!ZeT.iss(s) || !s.length)?(''):(s.replace(/^\s+|\s+$/g, ''))
	},

	first            : function(s)
	{
		return (ZeT.iss(s) && s.length)?(s.charAt(0)):(undefined)
	},

	/**
	 * The first arguments is a string to inspect.
	 * The following (one or more) is the argument
	 * strings: function returns true when inspected
	 * string starts with any of the arguments.
	 * Works with array-like objects.
	 */
	starts           : ZeT.scope(function()
	{
		function st(s, x)
		{
			var a = s.length, b = x.length
			if(a < b) return false

			for(var i = 0;(i < b);i++)
				if(s[i] !== x[i])
					return false
			return true
		}

		return function(s)
		{
			for(var i = 1;(i < arguments.length);i++)
				if(st(s, arguments[i]))
					return true
			return false
		}
	}),

	ends             : function(s, x)
	{
		var a = s.length, b = x.length
		if(a < b) return false

		for(var i = 0, j = a - b;(i < b);i++, j++)
			if(s[j] !== x[i])
				return false
		return true
	},

	/**
	 * Replaces plain string with else plain string.
	 */
	replace          : function(s, a, b)
	{
		return s.split(a).join(b)
	},

	cati             : ZeT.cati,

	/**
	 * Directly concatenates given objects into a string.
	 */
	cat              : function(/* various objects */)
	{
		return ZeTS.cati(0, arguments)
	},

	/**
	 * Concatenates trailing objects if the first one
	 * passes ZeT.test().
	 */
	catif            : function(x /* various objects */)
	{
		return ZeT.test(x)?ZeTS.cati(1, arguments):('')
	},

	/**
	 * Shortcut for ZeTS.catif() that checks all the arguments.
	 */
	catifall         : function(/* various objects */)
	{
		for(var i = 0;(i < arguments.length);i++)
			if(!ZeT.test(arguments[i]))
				return ''

		return ZeTS.cati(0, arguments)
	},

	/**
	 * Concatenates the objects with the separator given
	 * as the first argument, or as 'this' context object.
	 * Note that arrays are processed deeply.
	 */
	catsep           : function(/* sep, various objects */)
	{
		var x, b = 1, s = '', sep = arguments[0]

		//?: {invoked with this separator}
		if(ZeTS != this) { b = 0; sep = this }

		//c: for each argument
		for(var i = b;(i < arguments.length);i++)
		{
			if(ZeT.isx(x = arguments[i]))
				continue

			if(!ZeT.iss(x))
			{
				//?: {is an array}
				if(ZeT.isa(x))
					x = ZeTS.catsep.apply(sep, x)
				//?: {toString()}
				else if(ZeT.isf(x.toString))
					x = x.toString()
				else
					x = '' + x
			}

			//?: {empty string}
			if(ZeT.ises(x))
				continue

			if(s.length) s += sep
			s += x
		}

		return s
	},

	/**
	 * Invokes callback for each sub-string in the string.
	 * If callback returns false, breaks. Optional separator
	 * (defaults to /\s+/) argument to String.split().
	 */
	each             : function(/* [sep], s, f */)
	{
		var sep, s, f

		ZeT.scope(arguments.length, arguments, function(l, a)
		{
			ZeT.assert(l == 2 || l == 3)
			if(l == 2) { sep = /\s+/; s = a[0]; f = a[1] }
			else { sep = a[0]; s = a[1]; f = a[2] }
		})

		ZeT.assert(ZeT.iss(s))
		ZeT.assertf(f)

		s = s.split(sep)
		for(var i = 0;(i < s.length);i++)
			if(s[i].length)
				if(f(s[i]) === false)
					return this

		return this
	}
})

ZeTS //<-- return this value
