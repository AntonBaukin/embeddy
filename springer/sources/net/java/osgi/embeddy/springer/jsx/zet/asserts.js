/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                                                               |
 |                       Asserts & Errors                        |
 |                                                               |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT  = JsX.once('./checks.js')
var ZeTS = JsX.global('ZeTS')

/**
 * Returns false for string objects that are not
 * whitespace-trimmed empty.
 */
ZeTS.ises = function(s)
{
	return !ZeT.iss(s) || (s.length == 0) || !/\S/.test(s)
}

ZeTS.cati = function(index, objs)
{
	if(!objs || !ZeT.isi(objs.length)) return ''

	for(var i = 0;(i < objs.length);i++)
		if((i < index) || ZeT.isu(objs[i]) || (objs[i] === null))
			objs[i] = ''

	return String.prototype.concat.apply('', objs)
}

ZeTS.cat = function(/* various objects */)
{
	for(var i = 0;(i < arguments.length);i++)
		if(ZeT.isu(arguments[i]) || (arguments[i] === null))
			arguments[i] = ''

	return String.prototype.concat.apply('', arguments)
}

/**
 * Throws exception with given message.
 * Appends the stack trace.
 */
ZeT.ass = function(/* messages */)
{
	var m = ZeTS.cat.apply(ZeTS, arguments)
	var x = ZeTS.cat(m, '\n', new Error().stack)

	throw new Error(x)
}

/**
 * First argument of assertion is an expression
 * evaluated as extended if-check. The following
 * optional arguments are the message components
 * concatenated to string.
 *
 * The function returns the test value given.
 */
ZeT.assert = function(test /* messages */)
{
	if(test) return test

	var m = ZeTS.cati(1, arguments)
	if(ZeTS.ises(m)) m = 'Assertion failed!'

	throw new Error(m)
}

/**
 * Checks that given object is not
 * null or undefined.
 */
ZeT.assertn = function(obj /* messages */)
{
	if((obj !== null) && !ZeT.isu(obj))
		return obj

	var m = ZeTS.cati(1, arguments)
	if(ZeTS.ises(m)) m = 'The object is undefined or null!'

	throw new Error(m)
}

/**
 * Tests the the given object is a not-empty array
 * and returns it back.
 */
ZeT.asserta = function(array /* messages */)
{
	if(ZeT.isa(array) && array.length)
		return array

	var m = ZeTS.cati(1, arguments)
	if(ZeTS.ises(m)) m = 'A non-empty array is required!'

	throw new Error(m)
}

/**
 * Tests that the first argument is a string
 * that is not whitespace-empty. Returns it.
 */
ZeT.asserts = function(str /* messages */)
{
	if(!ZeTS.ises(str))
		return str

	var m = ZeTS.cati(1, arguments)
	if(ZeTS.ises(m)) m = 'A not whitespace-empty string is required!'

	throw new Error(m)
}


ZeT //<-- return this value