/*===============================================================+
 | 0-ZeT Library for Nashorn-JsX                        [ 1.0 ]  |
 |                        Linked Map                             |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT = JsX.once('./classes.js')

/**
 * Class that implements a linked Map: mapping that
 * remembers the order of placing items in it.
 */
ZeT.Map = ZeT.defineClass('ZeT.LinkedMap',
{
	init             : function()
	{
		this.clear()
	},

	clear            : function()
	{
		this.map   = {}
		this.lasti = 1
		this.size  = 0
	},

	/**
	 * Adds the value into the map. Returns
	 * previous value. New value becomes
	 * the last in the order.
	 *
	 * If value is undefined, assignes it
	 * to be the same as key! This treats
	 * linked map as a linked set.
	 */
	put              : function(k, v)
	{
		var y, x = this.map[ZeT.assertn(k)]

		//?: {has no value}
		if(ZeT.isu(v)) v = k

		if(x)
		{
			y = x.value
			x.value = v
		}
		else
		{
			this.map[k] = x = { key: k, value: v }
			this.size++
		}

		this.$tail(x)
		return y
	},

	get              : function(k)
	{
		var x = this.map[ZeT.assertn(k)]
		return x && x.value
	},

	remove           : function(k)
	{
		var x; if(!(x = this.map[ZeT.assertn(k)]))
			return undefined

		this.size--

		//~: remove from the sequence
		this.$extract(x)

		//~: delete the entry
		delete this.map[k]

		return x.value
	},

	/**
	 * Returns integer index of order of the item
	 * mapped by the key. The very first index is 1.
	 * The range of indices is sparce (with holes)!
	 */
	index            : function(k)
	{
		var x = this.map[k]
		return x && x.index
	},

	contains         : function(k)
	{
		return !!this.map[k]
	},

	/**
	 * Invokes callback function over all existing
	 * items in the order of putting them. The call
	 * is exactly the same as in ZeT.each().
	 */
	each             : function(f)
	{
		for(var x = this.head;(x);x = x.next)
			if(false === f.call(x.value, x.value, x.key))
				return x.key
	},

	/**
	 * Iterates over entities in the reversed order.
	 */
	reverse          : function(f)
	{
		for(var x = this.tail;(x);x = x.prev)
			if(false === f.call(x.value, x.value, x.key))
				return x.key
	},

	$tail            : function(x)
	{
		x.index = ++this.lasti

		if(!this.tail)
		{
			ZeT.assert(!this.head)
			return this.head = this.tail = x
		}

		if(this.tail == x)
			return

		this.$extract(x)

		x.prev = this.tail
		this.tail.next = x
		this.tail = x
	},

	$extract         : function(x)
	{
		var p = x.prev
		var n = x.next

		if(this.head == x)
		{
			ZeT.assert(!p)
			this.head = n
		}
		else if(p)
			p.next = n

		if(this.tail == x)
		{
			ZeT.assert(!n)
			this.tail = p
		}
		else if(n)
			n.prev = p

		x.prev = x.next = null
	}
})

ZeT //<-- return this value