/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                     Objective Classes                         |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT  = JsX.once('./extends.js')
var ZeTA = JsX.once('./arrays.js')


/**
 * Creates Class instance. The arguments are:
 *
 * 0  [optional] parent Class instance;
 * 1  [optional] body object with the Class methods.
 *
 * The parent Class may be of ZeT implementation: each such
 * instance is marked with (Class.ZeT$Class = true).
 *
 * It is allowed the parent Class to be a general Function.
 * As for ZeT Class inheritance, Function.prototype will be
 * the parent [[Prototype]] of Class.prototype. To call Function
 * (as a constructor) from Class initialization method (see
 * Class.initializer() method), use the same $superApply() or
 * $superCall() runtime-added methods.
 *
 * The body object may contain not only the methods, but properties
 * of other types: they are 'static' members of the prototype of
 * the instances created.
 *
 * The returned Class instance is a Function having the following
 * instance members:
 *
 * · static : empty Object
 *
 *   use this object to store data shared for every instance
 *   of this Class.
 *
 * · create(...) : new instance of Class
 *
 *   creates an instance of the Class. Takes any number of arguments
 *   that are passed as-is to the initialization method.
 *
 * · extend({body} | [{body}]) : this Class
 *
 *   adds the methods (and the properties) of the body (or array of
 *   bodies) given to the prototype of the Class. Note that the methods
 *   (as references) are copied wrapped, and adding methods (or fields)
 *   to the body object after extending has no effect.
 *
 * · addMethod(name, f) : this Class
 *
 *   adds the method given to the prototype of Class. Note that the
 *   function given is wrapped to provide $-objects at the call time.
 *
 * · initializer([names]) : this Class
 *
 *   give an array of names (or single name) with the body' initialization
 *   method. Default names are: 'initialize', 'init', and 'constructor'.
 *   Only the first method found in the instance is called.
 *
 *   Note that constructor() is always defined when plain Function was
 *   inherited Hence, 'constructor' must be the last in the list, or you
 *   have to implement constructor() as the initializing method.
 *
 * The instances created as a Class has the following properties and methods:
 *
 * · $class  it's Class instance.
 *
 * · $plain  equals to a plain Function when it is the root of hierarchy;
 *
 * · $callSuper(), $applySuper()
 *
 *   these functions are available only within a method call.
 *   They invoke the method with the same name defined in the
 *   ancestor classes hierarchy.
 *
 * · $callContext
 *
 *   as $callSuper(), available only within a method call.
 *   It contains the following properties:
 *
 *   · name:  the name of the method (currently invoked);
 *
 *   · wrapped:  the original method added to Class (and wrapped);
 *
 *   · method: method is being invoked (i.e., the wrapper);
 *
 *   · callSuper, applySuper:  functions that are assigned
 *     as $- to object when invoking a method;
 *
 *   · superFallback: function to invoke within $call-,
 *     $applySuper() when super method was not found.
 *
 *   Note that $callContext object is shared between the calls
 *   of the body method wrapped! (Each function in the method
 *   hierarchy still has it's own instance.)
 */
ZeT.Class = ZeT.define('ZeT.Class', function()
{
	//~: initialization methods lookup array
	var inits = ['initialize', 'init', 'constructor']

	//!: the Class instance to return
	function Class()
	{
		//c: process the initialize names list
		for(var i = 0;(i < inits.length);i++)
		{
			var m = this[inits[i]]
			if(!ZeT.isf(m)) continue

			//?: {this is a root Function constructor} skip it for now
			if(Class.$plain && (m === Class.$plain.prototype.constructor))
				continue

			//?: {this is Object constructor}
			if(m === Object.prototype.constructor) continue

			//~: install fallback for plain Function root
			if(Class.$plain && m.$callContext)
				m.$callContext.superFallback = Class.$plain

			//!: call the initializer
			return m.apply(this, arguments)
		}

		//HINT: we found no initialization method in the body...

		//?: {has hierarchy root Function} invoke it as a fallback
		if(Class.$plain)
			Class.$plain.apply(this, arguments)
	}

	//:: Class.static
	Class.static = {}

	//:: Class.$super
	Class.$super = ZeT.isf(arguments[0])?(arguments[0]):(null)

	//:: Class.$plain
	if(Class.$super) Class.$plain = (Class.$super.ZeT$Class === true)?
	  (Class.$super.$plain):(Class.$super)

	//?: {has parent class} use it as a prototype
	Class.prototype = (!Class.$super)?{}:ZeT.scope(function()
	{
		function U() {}
		U.prototype = Class.$super.prototype
		return new U()
	})

	//:: Class.create()
	Class.create = function()
	{
		var args = arguments

		function C()
		{
			Class.apply(this, args)
		}

		C.prototype = Class.prototype
		return new C()
	}

	function createCallContext(name, f)
	{
		return { name: name, wrapped : f,

			assign  : function(that)
			{
				//:: this.$callContext
				that.$callContext = this

				//:: this.$callSuper
				that.$callSuper  = this.callSuper

				//:: this.$applySuper
				that.$applySuper = this.applySuper
			},

			revoke  : function(that)
			{
				delete that.$callContext
				delete that.$callSuper
				delete that.$applySuper
			}
		}
	}

	//:: Class.addMethod()
	Class.addMethod = function(name, f)
	{
		//~: find super method and invalidate it's cache marker
		var sx, sm = Class.$super && Class.$super.prototype[name]
		if(ZeT.isf(sm)) sm.$cacheMarker = sx = {}
			else sm = undefined

		function accessSuper(that)
		{
			//?: {has super method & the marker is actual}
			if(sm && (sm.$cacheMarker === sx))
				return sm

			//~: find it
			sm = Class.$super && Class.$super.prototype[name]
			if(ZeT.isf(sm)) sx = sm.$cacheMarker; else
			{
				sm = undefined

				//?: {has fallback call provided}
				var fb = that.$callContext.superFallback
				if(fb) return fb

				throw new Error('$super method (' + name + ') not found!')
			}

			return sm
		}

		//~: invalidate cache marker of existing method
		ZeT.scope(function()
		{
			var m = Class.prototype[name]
			if(ZeT.isf(m)) m.$cacheMarker = {}
		})

		//~: wrap the method
		function Method()
		{
			//HINT: when method is invoked recursively,
			//  it has the same call context

			var x = this.$callContext //<-- current call context
			var a = !x || (x.method !== Method) //?: is it changed

			try
			{
				//?: {new call context must be assigned}
				if(a) Method.$callContext.assign(this)

				//!: invoke the function is being wrapped
				return f.apply(this, arguments)
			}
			finally
			{
				//?: {has new call context assigned}
				if(a) try
				{
					this.$callContext.revoke(this)
				}
				finally
				{
					//?: {has external context} return to it
					if(x) x.assign(this)
				}
			}
		}

		//~: assign wrapper to the prototype
		Class.prototype[name] = Method

		//:: Class.[Method].$callContext
		Method.$callContext = createCallContext(name, f)
		Method.$callContext.method = Method

		//:: Class.[Method].$callSuper
		Method.$callContext.callSuper = function()
		{
			return accessSuper(this).apply(this, arguments)
		}

		//:: Class.[Method].$applySuper
		Method.$callContext.applySuper = function(args)
		{
			return accessSuper(this).apply(this, args)
		}

		return Class
	}

	function isStaticMember(x)
	{
		return !ZeT.isf(x) || (x.ZeT$Class === true)
	}

	//:: Class.extend()
	Class.extend = function(body)
	{
		if(!body) return Class
		if(!ZeT.isa(body)) body = [body]

		for(var j = 0;(j < body.length);j++)
		{
			var b = body[j], k, v, ks = ZeT.keys(b), p = Class.prototype
			for(var i = 0;(i < ks.length);i++)
			{
				k = ks[i]; v = b[k]
				if(isStaticMember(v)) p[k] = v; else
					Class.addMethod(k, v)
			}
		}

		return Class
	}

	//~: extend with the body given
	Class.extend((Class.$super)?(arguments[1]):(arguments[0]))

	//:: Class.initializer()
	Class.initializer = function(a)
	{
		if(a && !ZeT.isa(a)) a = [a]
		if(ZeT.isa(a) && a.length)
			inits = a
		return Class
	}

	//:: this.$class
	Class.prototype.$class = Class

	//~: mark as a Class instance
	Class.ZeT$Class = true

	return Class
})


ZeT.extend(ZeT,
{
	/**
	 * Tells that given object (function)
	 * is a class of ZeT implementation.
	 */
	isclass          : function(c)
	{
		return ZeT.isf(c) && (c.ZeT$Class === true)
	},

	/**
	 * ZeT.define() class. The arguments are:
	 *
	 * 0   ZeT.define key name of the class;
	 *
	 * 1   parent Class, function, or string
	 *     definition name (optional);
	 *
	 * 2   class body object (optional).
	 *
	 * If there is no parent class, give
	 * class body as [1] argument.
	 */
	defineClass      : function()
	{
		ZeT.assert(arguments.length >= 1)
		ZeT.assert(arguments.length <= 3)

		//~: access the class already defined
		var cls, name = arguments[0]
		if(cls = ZeT.defined(name)) return cls

		//~: take the parent class defined
		var args = [], pOb = arguments[1]
		if(ZeT.iss(pOb)) pOb = ZeT.assertn(
		  ZeT.defined(pOb), 'Parent class definition [',
		  pOb, '] is not found!')

		if(arguments.length == 3)
		{
			var body = arguments[2]
			ZeT.assert(ZeT.isf(pOb) && ZeT.iso(body))
			args = [ pOb, body ]
		}
		else if(arguments.length == 2)
		{
			ZeT.assert(ZeT.isf(pOb) || ZeT.iso(pOb))
			args = [ pOb ]
		}

		//~: create a class
		return ZeT.define(name, ZeT.Class.apply(ZeT.Class, args))
	},

	/**
	 * Creates instance of the defined or directly
	 * given ZeT Class.
	 *
	 * 0   definition key name or Class object;
	 * 1.. passed to class constructor.
	 */
	createInstance   : function()
	{
		//~: access class definition
		var cls = arguments[0]
		if(ZeT.iss(cls)) cls = ZeT.defined(cls)

		//?: {not a ZeT.Class}
		ZeT.assert(ZeT.isclass(cls),
		 'Can not create instance of not a ZeT.Class!')

		//~: remove 0-argument (definition name)
		return cls.create.apply(cls, ZeTA.copy(arguments, 1))
	},

	/**
	 * ZeT.define() instance of ZeT Class given.
	 *
	 * 0   string define-key of instance;
	 * 1.. passed to createInstance().
	 */
	defineInstance   : function()
	{
		//~: lookup it is already defined
		var res = ZeT.defined(arguments[0])
		if(res) return res

		//~: remove 0-argument (definition name)
		var args = ZeTA.copy(arguments, 1)
		res = ZeT.createInstance.apply(this, args)

		//~: define it
		return ZeT.define(arguments[0], res)
	},

	/**
	 * Extends the class (also, by it's definition name)
	 * with the body-methods given. Body may also contain
	 * else values to be included in Class.static.
	 * Only string keys are allowed!
	 */
	extendClass      : function(cls, ext)
	{
		//~: access defined class
		if(ZeT.iss(cls)) cls = ZeT.defined(cls)

		ZeT.assert(ZeT.isclass(cls), 'A ZeT.Class is required to be extended!')
		ZeT.assertn(ext, 'Class extention is not given!')

		//c: extend for each key
		ZeT.each(ZeT.keys(ext), function(key)
		{
			ZeT.asserts(key, 'Not a string key of a body member: ', key)

			var p; if(ZeT.isf(p = ext[key]))
				cls.addMethod(key, p)
			else
				cls.static[key] = p
		})

		return cls
	},

	/**
	 * ZeT.define() instance of a temporary
	 * (anonymous) sub-class of ZeT Class
	 * or constructing function.
	 *
	 * 0   string define-key of instance;
	 *
	 * 1   [optional] definition key name, or Class,
	 *     or plain function to be the parent class
	 *     of the temporary one;
	 *
	 * 2   the body of the class;
	 *
	 * 3.. [optional] arguments of the class constructor
	 *     to create temporary instance.
	 */
	singleInstance   : function()
	{
		//~: lookup it is already defined
		var res = ZeT.defined(arguments[0])
		if(res) return res

		//~: access the parent class defined
		var parent = arguments[1]; if(ZeT.iss(parent))
			parent = ZeT.assertf( ZeT.defined(parent),
			  'Can not create instance of not a Class or function!')

		//~: arguments of class create invocation
		var cargs = ZeT.isf(parent)?([parent, arguments[2]]):([arguments[1]])

		//~: create the anonymous class
		var cls = ZeT.Class.apply(ZeT.Class, cargs)

		//~: copy constructor arguments
		var args = ZeTA.concat([cls], arguments, ZeT.isf(parent)?(3):(2))

		//~: create and define the instance
		var obj = ZeT.createInstance.apply(ZeT, args)
		return ZeT.define(arguments[0], obj)
	},

	/**
	 * Creates anonymous sub-class of the class given by it's
	 * Class instance or the definition name, extends it with
	 * the body methods given and passes the optional arguments
	 * to the instance constructor.
	 *
	 * The first variant of the arguments is:
	 *
	 * [0] ZeT Class or definition key;
	 * [1] arguments array;
	 * [2] sub-class definition body.
	 *
	 * The second variant is:
	 *
	 * [0] ZeT Class or definition key;
	 * [1] sub-class definition body;
	 * ... arguments list (optional).
	 */
	hiddenInstance   : function()
	{
		var cls = arguments[0]

		//?: {parent class is a definition name}
		if(ZeT.iss(cls)) cls = ZeT.assertn(ZeT.defined(cls),
		  'No definition is bound by the name [', cls, ']!')

		ZeT.assert( ZeT.isf(cls), //?: {not a function}
		  'Can not create instance of not a Class or function!')

		//~: take the body
		var args, body = arguments[1]
		if(ZeT.isa(body))
		{
			args = body
			body = arguments[2]
		}

		ZeT.assert(ZeT.iso(body), //?: {body is not an object}
		  'Anonymous class body is not an object!')

		//~: create the anonymous class
		var cls  = ZeT.Class.call(ZeT.Class, cls, body)

		//~: copy constructor arguments
		if(args) args = ZeTA.concat([cls], args)
		else     args = ZeTA.concat([cls], arguments, 2)

		//~: create the instance
		return ZeT.createInstance.apply(ZeT, args)
	}
})//<-- return this value