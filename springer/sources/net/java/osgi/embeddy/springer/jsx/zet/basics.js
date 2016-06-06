/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                      Scripting Basics                         |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT = JsX.once('./asserts.js')


ZeT.extend(ZeT,
{
	/**
	 * Defines unique object in 'Global' scope.
	 * If factory argument is undefined, returns
	 * previously defined instance. The factory
	 * is never called twice.
	 *
	 * When name has '.', they are used to trace
	 * the intermediate objects from the window top.
	 * 'ZeT.S' means that 'S' object is nested into
	 * 'ZeT' that is in the window (global) scope.
	 * Each intermediate object must exist.
	 */
	init             : function(name, factory)
	{
		ZeT.asserts(name, 'ZeT difinitions are for string names only!')
		var scope = JsX.global('Global'),
		  xname = name, i = name.indexOf('.')

		//~: Global ZeT
		scope.ZeT = ZeT

		//~: trace the scope
		while(i != -1)
		{
			var n = name.substring(0, i)
			name = name.substring(i + 1)

			//?: {has empty name parts}
			ZeT.asserts(n, 'Empty intermediate name in ZeT.define(', xname, ')!')
			ZeT.asserts(name, 'Empty terminating name in ZeT.define(', xname, ')!')

			//?: {has the scope undefined}
			ZeT.assertn(scope = scope[n], 'Undefined intermediate scope object ',
			  'in ZeT.define(', xname, ') at [', n, ']!')

			i = name.indexOf('.')
		}

		//?: {target exists in the scope}
		var o = scope[name]
		if(!ZeT.isx(o)) return o

		//~: assign the target
		if(!ZeT.isx(factory))
			scope[name] = o = ZeT.assertf(factory)()

		return o
	},

	/**
	 * Invokes ZeT.init() with the object instead of a factory.
	 */
	define           : function(name, object)
	{
		return ZeT.init(name, ZeT.isx(object)?(undefined):
		  function(){ return object })
	},

	defined          : function(name)
	{
		ZeT.assert(arguments.length == 1)
		return ZeT.init(name)
	},

	/**
	 * Creates object having the same prototype.
	 *
	 * Warning! The class function of the object
	 * is not the same!
	 */
	proto            : function(obj)
	{
		ZeT.assertn(obj)
		var p = ZeT.assertn(Object.getPrototypeOf(obj))

		function P(){}
		P.prototype = p

		return new P()
	},

	/**
	 * Takes any array-like object and returns true array.
	 * If source object is an array, returns it as-is.
	 *
	 * Array-like objects do have integer length property
	 * and values by the integer keys [0; length).
	 *
	 * Note that strings are not treated as array-like.
	 * ZeT.a('...') returns ['...']. The same for functions.
	 *
	 * If object given is not an array, wraps it to array.
	 * Undefined or null value produces empty array.
	 *
	 * If source object has toArray() method, that method
	 * is invoked with this-context is the object.
	 */
	a                : function(a)
	{
		if(ZeT.isa(a)) return a
		if(ZeT.isu(a) || (a === null)) return []
		if(ZeT.iss(a) || ZeT.isf(a)) return [a]

		if(ZeT.isf(a.toArray))
		{
			ZeT.assert(ZeT.isa(a = a.toArray()),
			  'ZeT.a(): .toArray() returned not an array!')
			return a
		}

		//~: manually copy the items
		var l = a.length; if(!ZeT.isi(l)) return [a]
		var r = new Array(l)
		for(var i = 0;(i < l);i++) r[i] = a[i]

		return r
	},

	not              : function(f)
	{
		return function()
		{
			return !f.apply(this, arguments)
		}
	},

	and              : function(/* functions */)
	{
		var fs = ZeT.a(arguments)

		return function()
		{
			for(var i = 0;(i < fs.length);i++)
				if(!fs[i].apply(this, arguments))
					return false

			return true
		}
	},

	or               : function(/* functions */)
	{
		var fs = ZeT.a(arguments)

		return function()
		{
			for(var i = 0;(i < fs.length);i++)
				if(fs[i].apply(this, arguments))
					return true

			return false
		}
	},

	/**
	 * Shortcut to (s.indexOf(x) >= 0).
	 */
	ii               : function(s /* x0, x1, ... */)
	{
		if(!s) return false

		for(var i = 1;(i < arguments.length);i++)
			if(s.indexOf(arguments[i]) >= 0)
				return true

		return false
	}
}) //<-- return this value