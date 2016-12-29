/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                   Java Application Bindings                   |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT  = JsX.once('./extends.js')
var ZeTS = JsX.once('./strings.js')

//!: also include the classes
JsX.once('./classes.js')


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
	 * Invokes ZeT.deepExtend() or ZeT.deepAssign()
	 * depending on whether the properties array
	 * argument present. Returns true if the object
	 * was changed.
	 *
	 * Note! Not effective for large objects.
	 */
	o2o              : function(obj, src, ps)
	{
		ZeT.assert(ZeT.iso(obj))
		ZeT.assert(ZeT.iso(src))

		var prev = ZeT.o2s(obj)

		if(ps) ZeT.deepAssign(obj, src, ps)
		else   ZeT.deepExtend(obj, src)

		return (prev != ZeT.o2s(obj))
	},

	/**
	 * Converts given object to JSON formatted string.
	 */
	o2s              : function(o)
	{
		return ZeT.isx(o)?(o):JSON.stringify(o)
	},

	s2o              : function(s)
	{
		return ZeT.isx(s)?(s):JSON.parse(s)
	},

	/**
	 * Replaces all object-like fields of the
	 * object given with Java linked maps.
	 * Works recursively.
	 */
	o2m              : function(o)
	{
		ZeT.each(ZeT.keys(o), function(k)
		{
			var v = o[k]

			//?: {not an object}
			if(!ZeT.isox(v)) return

			//?: {is a java map}
			if(v instanceof ZeT.JAVA_MAP) return

			//~: replace and copy
			var w = o[k] = new java.util.LinkedHashMap()
			ZeT.extend(w, v)

			//!: recurse
			ZeT.o2m(w)
		})
	},

	JObject          : Java.type('java.lang.Object'),
	JClass           : Java.type('java.lang.Class'),
	BigDecimal       : Java.type('java.math.BigDecimal'),

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

	LinkedMap        : Java.type('java.util.LinkedHashMap'),
	ArrayList        : Java.type('java.util.ArrayList'),

	jdecimal         : function(n)
	{
		if(ZeT.isx(n) || (ZeT.iss(n) && ZeTS.ises(n)))
			return null

		if(ZeT.isn(n))
			n = '' + n

		ZeT.asserts(n, 'Illegal Decimal string!')
		return new ZeT.BigDecimal(n)
	},

	/**
	 * Deeply traverses the plain object and replaces
	 * each plain object with Java Linked Hash Map.
	 */
	jmap             : function(o)
	{
		//?: {not an object}
		if(!ZeT.iso(o)) return o

		var m = new ZeT.LinkedMap()

		ZeT.each(o, function(v, k)
		{
			//?: {is an object}
			if(ZeT.iso(v))
				v = ZeT.jmap(v)

			//?: {is an array}
			else if(ZeT.isa(v))
			{
				var a = new ZeT.ArrayList(v.length)
				for(var i = 0;(i < v.length);i++) a.add(v[i])
				v = a
			}

			m.put(k, v)
		})

		return m
	},

	/**
	 * Deeply traverses the Java map given or a
	 * collection and returns plain JS object with
	 * the same structure.
	 *
	 * Note that Java Map or collection may not be
	 * converted to JSON directly!
	 */
	junmap           : function(m)
	{
		//?: {is a string}
		if(ZeT.iss(m)) return m

		//?: {is a number}
		if(ZeT.isn(m)) return 0 + m

		//?: {is a boolean}
		if(ZeT.isb(m)) return !!m

		//?: {is a list} recurse each item
		if(m instanceof ZeT.Iterable)
		{
			var a = []

			ZeT.each(m, function(v){
				a.push(ZeT.junmap(v))
			})

			return a
		}

		//?: {is a map} recurse each entry
		if((m instanceof ZeT.JAVA_MAP))
		{
			var o = {}

			ZeT.each(m.keySet(), function(k)
			{
				var v = ZeT.junmap(m.get(k))

				if(!ZeT.isu(v))
					o[k] = v
			})

			return o
		}

		return (m === null)?(null):(undefined)
	},

	/**
	 * Does XOR of two hex strings.
	 */
	xor              : function(a, b)
	{
		var HEX = '0123456789ABCDEF'
		var hex = '0123456789abcdef'

		function d(c)
		{
			var i = hex.indexOf(c)
			if(i == -1) i = HEX.indexOf(c)
			ZeT.assert(i >= 0)
			return i
		}

		var l = Math.max(a.length, b.length)
		var s = new Array(l)

		for(var i = 0;(i < l);i++)
		{
			var x = (i < a.length) ? d(a.charAt(i)) : (0)
			var y = (i < b.length) ? d(b.charAt(i)) : (0)
			s[i]  = HEX.charAt(x ^ y)
		}

		return s.join('')
	},

	resjsonse        : function(obj)
	{
		ZeT.assert(response && ZeT.isf(response.setContentType))
		ZeT.assert(ZeT.iso(obj) || ZeT.isa(obj))

		response.setContentType("application/json;encoding=UTF-8")
		print(ZeT.o2s(obj))
	}
}) //<-- return this value
