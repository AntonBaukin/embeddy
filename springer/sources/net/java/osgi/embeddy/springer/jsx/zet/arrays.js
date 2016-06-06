/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                                                               |
 |                        Arrays Routines                        |
 |                                                               |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT  = JsX.once('./asserts.js')
var ZeTA = JsX.global('ZeTA')


/**
 * Takes any array-like object and returns true array.
 * If source object is an array, return it.
 *
 * Array-like objects do have integer length property
 * and values by the integer keys [0; length).
 *
 * If object given is not an array, wraps it to array.
 * Undefined or null value produces empty array.
 *
 * If source object has toArray() method, that method
 * is invoked with this-context is the object.
 */
ZeTA.a = function(a)
{
	if(ZeT.isa(a)) return a
	if(ZeT.isu(a) || (a === null)) return []
	if(ZeT.iss(a)) return [a]

	if(ZeT.isf(a.toArray))
	{
		a = a.toArray()
		ZeT.assert(ZeT.isa(a), 'ZeTA.a(): .toArray() returned not an array!')
		return a
	}

	//~: manually copy the items
	var l = a.length; if(!ZeT.isi(l)) return [a]
	var r = new Array(l)
	for(var i = 0;(i < l);i++) r[i] = a[i]

	return r
}

/**
 * Creates a copy of array-like object given.
 * Optional [begin; end) range allows to copy
 * a part of the array. Negative values of
 * the range boundaries are not allowed.
 */
ZeTA.copy = function(a, begin, end)
{
	//?: {has no range}
	if(ZeT.isu(begin))
		return ZeT.isa(a)?(a.slice()):ZeTA.a(a)

	//~: [begin; end)
	ZeT.assert(ZeT.isn(begin))
	ZeT.assert(begin >= 0)
	if(ZeT.isu(end) || (end > a.length)) end = a.length
	ZeT.assert(ZeT.isn(end))
	ZeT.assert(begin <= end)

	//?: has more than 50% items to copy
	if((end - begin)*2 >= a.length)
		return (ZeT.isa(a)?(a):ZeTA.a(a)).slice(begin, end)

	//~: manual copy
	var r = new Array(end - begin)
	for(var i = begin, j = 0;(i < end);i++, j++) r[j] = a[i]

	return r
}

/**
 * Has two forms of invocation:
 *
 * 0    target array;
 * 1..  items or arrays to remove.
 *
 * this target array;
 * 0..  items or arrays to remove.
 *
 * Removes the items from the target array.
 * If item is itself an array, recursively
 * invokes this function.
 *
 * Returns the target array.
 */
ZeTA.remove = function()
{
	var i, j

	//?: {second form}
	if(ZeT.isa(this))
	{
		for(i = 0;(i < arguments.length);i++)
			if(ZeT.isa(arguments[i]))
				ZeTA.remove.apply(this, arguments[i])
			else if((j = this.indexOf(arguments[i])) != -1)
				this.splice(j, 1)

		return this
	}
	//~: first form
	else
	{
		for(i = 1;(i < arguments.length);i++)
			if(ZeT.isa(arguments[i]))
				ZeTA.remove.apply(arguments[0], arguments[i])
			else if((j = arguments[0].indexOf(arguments[i])) != -1)
				arguments[0].splice(j, 1)

		return arguments[0]
	}
}

/**
 * Takes two array-like objects and optional
 * [begin, end) range from the second one.
 *
 * If the first (target) object is an array,
 * modifies it adding the items from the
 * second object in the range given.
 *
 * If the target object is not an array,
 * makes it's array-copy, returns it.
 */
ZeTA.concat = function(a, b, begin, end)
{
	a = ZeTA.a(a)

	//?: {has range} make a copy
	if(ZeT.isu(begin)) b = ZeTA.a(b); else
		b = ZeTA.copy(b, begin, end)

	//~: push all the items
	Array.prototype.push.apply(a, b)
	return a
}

/**
 * Takes all defined array arguments and individual
 * items and concatenates them in single array.
 */
ZeTA.combine = function()
{
	var result = []

	for(var i = 0;(i < arguments.length);i++)
		if(ZeT.isa(arguments[i]))
			Array.prototype.push.apply(result, arguments[i])
		else if(!ZeT.isx(arguments[i]))
			result.push(arguments[i])

	return result
}

/**
 * Checks that two objects are array-like and
 * have the same length and the items each
 * strictly (===) equals.
 */
ZeTA.eq = function(a, b)
{
	if(!a || !b) return (a == null) && (a == b)
	if(a === b)  return true

	if(!ZeT.isi(a.length) || !ZeT.isi(b.length))
		return false

	if(a.length != b.length) return false
	for(var l = a.length, i = 0;(i < l);i++)
		if(a[i] !== b[i])
			return false
	return true
}


ZeTA //<-- return this value