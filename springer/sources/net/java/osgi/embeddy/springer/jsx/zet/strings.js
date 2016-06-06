/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                                                               |
 |                       Asserts & Errors                        |
 |                                                               |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT  = JsX.once('./basics.js')
var ZeTS = JsX.global('ZeTS')

ZeT.extend(ZeTS,
{
	ises             : ZeT.ises,

	trim             : function(s)
	{
		return !(s && s.length)?(''):(s.replace(/^\s+|\s+$/g, ''))
	},

	first            : function(s)
	{
		return s && s.length && s.charAt(0)
	},

	starts           : function(s, x)
	{
		ZeT.assert(ZeT.iss(s) && ZeT.iss(x))
		return (s.indexOf(x) == 0)
	},

	ends             : function(s, x)
	{
		ZeT.assert(ZeT.iss(s) && ZeT.iss(x))
		var i = s.lastIndexOf(x)
		return (i >= 0) && (i + x.length == s.length)

	},

	replace          : function(s, a, b)
	{
		ZeT.assert(ZeT.iss(s) && ZeT.iss(a) && ZeT.iss(b))
		return s.split(a).join(b)
	},

	cat              : function(/* various objects */)
	{
		for(var i = 0;(i < arguments.length);i++)
			if(ZeT.isu(arguments[i]) || (arguments[i] === null))
				arguments[i] = ''

		return String.prototype.concat.apply('', arguments)
	},

	cati             : function(index, objs)
	{
		if(arguments.length > 2)
		{
			objs = ZeT.a(arguments)
			index++
		}

		if(!objs || !ZeT.isi(objs.length)) return ''

		for(var i = 0;(i < objs.length);i++)
			if((i < index) || ZeT.isu(objs[i]) || (objs[i] === null))
				objs[i] = ''

		return String.prototype.concat.apply('', objs)
	},

	catif            : function(x /*, various objects */)
	{
		if(!ZeT.isa(x)) x = [x]
		for(var y, i = 0;(i < x.length);i++)
			if(!(y = x[i]) || ZeT.iss(y) && !y.length) return ''

		arguments[0] = ''
		for(i = 1;(i < arguments.length);i++)
			if(ZeT.isu(arguments[i]) || (arguments[i] === null))
				arguments[i] = ''

		return String.prototype.concat.apply('', arguments)
	},

	catifall         : function(/*, various objects */)
	{
		for(var y, i = 0;(i < arguments.length);i++)
			if(!(y = arguments[i]) || ZeT.iss(y) && !y.length) return ''

		for(i = 0;(i < arguments.length);i++)
			if(ZeT.isu(arguments[i]) || (arguments[i] === null))
				arguments[i] = ''

		return String.prototype.concat.apply('', arguments)
	},

	catsep           : function(sep /*, various objects */)
	{
		ZeT.assert(!ZeTS.ises(sep), 'Separator may not be an ws-empty string!')

		var s = ''; for(var i = 1;(i < arguments.length);i++)
		{
			var x = arguments[i]

			if(ZeT.isu(x) || (x === null))
				continue

			//?: {is an array}
			if(ZeT.isa(x))
			{
				x = x.slice(0); x.splice(0, 0, sep)
				x = ZeTS.catsep.apply(ZeTS, x)
			}
			//?: {has toString()}
			else if(ZeT.isf(x.toString))
				x = x.toString()
			else
				x = '' + x

			if(!ZeT.iss(x))
				continue
			x = ZeTS.trim(x)

			if(ZeTS.ises(x))
				continue

			if(s.length)
				s += sep
			s += x
		}

		return s
	}
}) //<-- return this value
