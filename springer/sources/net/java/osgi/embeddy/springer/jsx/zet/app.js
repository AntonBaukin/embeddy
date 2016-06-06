/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                   Java Application Bindings                   |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT  = JsX.once('./extends.js')
var ZeTS = JsX.once('./strings.js')


// +----: print() : --------------------------------------------->

var _original_print_
if(ZeT.isu(_original_print_))
	_original_print_ = print

/**
 * Overwrites Nashorn print() to support
 * ZeTS.cat() multiple arguments.
 */
var print = function(/* various objects */)
{
	var s = ZeTS.cat.apply(ZeTS, arguments)
	if(s.length) _original_print_(s)
}


// +----: ZeT Extensions : -------------------------------------->

ZeT.extend(ZeT,
{
	/**
	 * String utilities.
	 */
	SU               : Java.type('net.java.osgi.embeddy.springer.SU'),

	/**
	 * Logging utilities.
	 */
	LU               : Java.type('net.java.osgi.embeddy.springer.LU'),

	/**
	 * Exceptions and assertions.
	 */
	EX               : Java.type('net.java.osgi.embeddy.springer.EX'),

	/**
	 * Returns bean registered in Spring Framework.
	 */
	bean             : function(name)
	{
		ZeT.asserts(name)

		//?: {starts with capital}
		var x = ZeTS.first(name)
		if(x.toUpperCase() == x)
			name = x.toLowerCase() + name.substring(1)

		return JsX.bean(name)
	},

	jss              : function(s)
	{
		return ZeT.SU.jss(s)
	},

	html             : function(s)
	{
		return ZeT.SU.escapeXML(s)
	},

	/**
	 * Converts given object to JSON formatted string.
	 */
	o2s              : function(o)
	{
		return JSON.stringify(o)
	},

	s2o              : function(s)
	{
		ZeT.asserts(s)
		return JSON.parse(s)
	},

	/**
	 * Creates Java array of the given type.
	 */
	jarray           : function(type, length)
	{
		ZeT.assert(ZeT.isi(length) && (length >= 0))
		if(ZeT.iss(type)) type = Java.type(type)
		ZeT.assert(type.class instanceof ZeT.JClass)
		return java.lang.reflect.Array.newInstance(type.class, length)
	},

	BigDecimal       : Java.type('java.math.BigDecimal'),

	jdecimal         : function(n)
	{
		if(ZeT.isx(n) || (ZeT.iss(n) && ZeTS.ises(n)))
			return null

		if(ZeT.isn(n))
			n = '' + n

		ZeT.asserts(n, 'Illegal Decimal string!')
		return new ZeT.BigDecimal(n)
	}
}) //<-- return this value
