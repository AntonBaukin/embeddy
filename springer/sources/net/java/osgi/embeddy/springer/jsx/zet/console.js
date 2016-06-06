/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                                                               |
 |               Printing to standard out and error              |
 |                                                               |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT  = JsX.once('./classes.js')
var ZeTS = JsX.once('./strings.js')


// +----: ZeT.Console: ------------------------------------------>

/**
 * Allows simple printing to various character streams.
 */
ZeT.Console = ZeT.Class(
{
	print            : function(/* various objects */)
	{
		var s = ZeTS.cat.apply(ZeTS, arguments)
		if(s.length) this.write(s)
		return this
	},

	println          : function(/* various objects */)
	{
		var s = ZeTS.cat.apply(ZeTS, arguments)
		if(ZeTS.ises(s)) return this

		this.write(s)
		this.line()
		return this;
	},

	/**
	 * Writes characters of single string given.
	 */
	write            : function(string)
	{
		ZeT.assert(false)
	},

	/**
	 * Ends current line.
	 */
	line             : function()
	{
		this.write('\n')
		return this
	}
})


// +----: ZeT.Console.out: -------------------------------------->

ZeT.Console.out = ZeT.Instance(ZeT.Console,
{
	write            : function(string)
	{
		if(ZeT.isx(string))
			return this

		ZeT.assert(ZeT.iss(string))
		JsX.out().write(string)
		return this
	}
})


// +----: ZeT.Console.err: -------------------------------------->

ZeT.Console.err = ZeT.Instance(ZeT.Console,
{
	write            : function(string)
	{
		if(ZeT.isx(string))
			return this

		ZeT.assert(ZeT.iss(string))
		JsX.err().write(string)
		return this
	}
})


// +----: ZeT.Console.stdout: ----------------------------------->

ZeT.Console.stdout = ZeT.Instance(ZeT.Console,
{
	write            : function(string)
	{
		if(ZeT.isx(string))
			return this

		ZeT.assert(ZeT.iss(string))
		java.lang.System.out.write(string)
		return this
	}
})


// +----: ZeT.Console.stderr: ----------------------------------->

ZeT.Console.stderr = ZeT.Instance(ZeT.Console,
{
	write            : function(string)
	{
		if(ZeT.isx(string))
			return this

		ZeT.assert(ZeT.iss(string))
		java.lang.System.err.write(string)
		return this
	}
})


ZeT //<-- return this value