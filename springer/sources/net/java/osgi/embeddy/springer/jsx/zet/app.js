/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                                                               |
 |                   Java Application Bindings                   |
 |                                                               |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT  = JsX.once('./basics.js')
var ZeTS = JsX.once('./strings.js')


// +----: print() : --------------------------------------------->

var _original_print_
if(ZeT.isu(_original_print_))
	_original_print_ = print

/**
 * Overwrites Nashorn print() with Console implementation.
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
	SU               : Java.type('com.tverts.support.SU'),

	/**
	 * Java Date utilities.
	 */
	DU               : Java.type('com.tverts.support.DU'),

	/**
	 * Logging utilities.
	 */
	LU               : Java.type('com.tverts.support.LU'),

	/**
	 * Exceptions and assertions.
	 */
	EX               : Java.type('com.tverts.support.EX'),

	/**
	 * Comparing.
	 */
	CMP              : Java.type('com.tverts.support.CMP'),

	/**
	 * Input-output.
	 */
	IO               : Java.type('com.tverts.support.IO'),

	sec              : Java.type('com.tverts.secure.SecPoint'),

	tx               : Java.type('com.tverts.system.tx.TxPoint'),

	xp               : Java.type('com.tverts.objects.XPoint'),

	/**
	 * Returns bean registered in Spring
	 */
	bean             : function(name)
	{
		ZeT.asserts(name)

		//?: {starts with capital}
		var x = ZeTS.first(name)
		if(x.toUpperCase() == x)
			name = x.toLowerCase() + name.substring(1)

		return ZeT.SpringPoint.bean(name)
	},

	SpringPoint      : Java.type('com.tverts.spring.SpringPoint'),
	HiberPoint       : Java.type('com.tverts.hibery.HiberPoint'),

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

	OClass           : Java.type('java.lang.Object'),
	JClass           : Java.type('java.lang.Class'),

	/**
	 * Builds JAXB-mapped Java class from JSON string.
	 * The exact type of the class must be given!
	 */
	s2jo             : function(jtype, s)
	{
		ZeT.asserts(s)

		//~: get the type of the object
		if(ZeT.iss(jtype)) jtype = Java.type(jtype)
		ZeT.assert(jtype.class instanceof ZeT.JClass)

		return ZeT.xp.json().read(s, jtype.class)
	},

	/**
	 * Converts JAXB-mapped Java Object to JSON text,
	 * then parses it back to JavaScript Object.
	 */
	jo2o             : function(jo)
	{
		ZeT.assert(jo instanceof ZeT.OClass)

		//~: map to string with JAXB-JSON
		var json = ZeT.xp.json().write(jo)

		ZeT.asserts(json)
		return ZeT.s2o(json)
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
