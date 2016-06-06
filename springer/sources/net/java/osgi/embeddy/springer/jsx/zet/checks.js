/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                        Various Checks                         |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT = JsX.global('ZeT')

/**
 * Invokes the function given. Optional arguments
 * must go before the function-body. This-context
 * of the call is passed to the callback.
 */

ZeT.scope = function(/* [parameters] f */)
{
	var f = arguments[arguments.length - 1]
	if(!ZeT.isf(f))
		throw new Error('ZeT.scope() got not a function!')

	//?: {has additional arguments}
	for(var a = [], i = 0;(i < arguments.length - 1);i++)
		a.push(arguments[i])

	return (a.length)?(f.apply(this, a)):(f.call(this))
}

ZeT.JAVA_MAP = Java.type("java.util.Map")

ZeT.keys = function(o)
{
	if(o instanceof ZeT.JAVA_MAP)
		return new java.util.ArrayList(o.keySet())
	return Object.keys(o)
}

ZeT.iss  = function(s)
{
	return (typeof s === 'string')
}

ZeT.ises = function(s)
{
	return !ZeT.iss(s) || !s.length || !/\S/.test(s)
}

ZeT.isf  = function(f)
{
	return (typeof f === 'function')
}

ZeT.isb  = function(b)
{
	return (typeof b === 'boolean')
}

ZeT.isu  = function(o)
{
	return (typeof o === 'undefined')
}

ZeT.isx  = function(o)
{
	return (typeof o === 'undefined') || (o === null)
}

ZeT.isa  = Array.isArray

ZeT.isn  = (function()
{
	var tos = Object.prototype.toString

	return function(n)
	{
		return (tos.call(n) === '[object Number]')
	}
})()

ZeT.isi  = function(i)
{
	return ZeT.isn(i) && (i === (i|0))
}

ZeT.iso  = function(o)
{
	return !!o && (typeof o === 'object') && !ZeT.isa(o)
}


ZeT //<-- return this value