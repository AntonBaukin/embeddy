/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                        Various Checks                         |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT = JsX.global('ZeT')


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