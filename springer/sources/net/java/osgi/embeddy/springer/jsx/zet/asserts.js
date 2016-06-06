/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                       Asserts & Errors                        |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT = JsX.once('./checks.js')

ZeT.extend(ZeT,
{
	/**
	 * Returns exception concatenating the optional
	 * arguments into string message. The stack is
	 * appended as string after the new line.
	 */
	ass              : function(/* messages */)
	{
		var m = ZeT.cati(0, arguments)
		var x = ZeT.stack()

		//?: {has message}
		if(!ZeT.ises(m)) x = m.concat('\n', x)

		//!: return error to throw later
		return new Error(x)
	},

	/**
	 * First argument of assertion tested with ZeT.test().
	 * The following optional arguments are the message
	 * components concatenated to string.
	 *
	 * The function returns the test argument.
	 */
	assert           : function(test /* messages */)
	{
		if(ZeT.test(test)) return test

		var m = ZeT.cati(1, arguments)
		if(ZeT.ises(m)) m = 'Assertion failed!'

		throw ZeT.ass(m)
	},

	/**
	 * Checks that given object is not null, or undefined.
	 */
	assertn          : function(obj /* messages */)
	{
		if(!ZeT.isx(obj)) return obj

		var m = ZeT.cati(1, arguments)
		if(ZeT.ises(m)) m = 'The object is undefined or null!'

		throw ZeT.ass(m)
	},

	/**
	 * Tests the the given object is a function
	 * and returns it back.
	 */
	assertf          : function(f /* messages */)
	{
		if(ZeT.isf(f)) return f

		var m = ZeTS.cati(1, arguments)
		if(ZeT.ises(m)) m = 'A function is required!'

		throw ZeT.ass(m)
	},

	/**
	 * Tests that the first argument is a string
	 * that is not whitespace-empty. Returns it.
	 */
	asserts          : function(str /* messages */)
	{
		if(!ZeT.ises(str)) return str

		var m = ZeT.cati(1, arguments)
		if(ZeT.ises(m)) m = 'Not a whitespace-empty string is required!'

		throw ZeT.ass(m)
	},

	/**
	 * Tests the the given object is a not-empty array
	 * and returns it back.
	 */
	asserta          : function(array /* messages */)
	{
		if(ZeT.isa(array) && array.length)
			return array

		var m = ZeTS.cati(1, arguments)
		if(ZeT.ises(m)) m = 'Not an empty array is required!'

		throw ZeT.ass(m)
	}
}) //<-- return this value