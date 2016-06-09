/*===============================================================+
 |           JavaScript Wrappers for Database Access             |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT = JsX.once('zet/app.js')
var Dbo = ZeT.define('App:Db:Object',
{
	/* Get Object */

	GetObject        : ZeT.bean('GetObject'),

	uuid             : function()
	{
		return Dbo.GetObject.newUUID()
	},

	exists           : function(uuid)
	{
		return Dbo.GetObject.exists(uuid)
	},

	/**
	 * Loads JSON object from the database record.
	 * (Decoded object is returned.)
	 */
	get              : function(uuid)
	{
		var json = Dbo.GetObject.json(uuid)
		return (json)?ZeT.o2s(json):(null)
	},

	load             : function(uuid, o)
	{
		ZeT.asserts(uuid)
		ZeT.assert(ZeT.iso(o))

		if(!Dbo.GetObject.load(uuid, o))
			return false

		//?: {decode json}
		if(!ZeT.isx(o.json))
			o.object = ZeT.s2o(o.json)

		return true
	},

	/**
	 * Saves the record given and returns the uuid.
	 * Object field is to save as JSON is named as 'object'.
	 * Returns the UUID (primary key) of the record.
	 * Note that the object argument is updated.
	 */
	save             : function(o)
	{
		ZeT.assert(ZeT.iso(o))

		if(!o.uuid) uuid = Dbo.uuid()
		ZeT.asserts(o.uuid)

		if(!ZeT.isx(o.object))
			o.json = ZeT.o2s(o.object)

		Dbo.GetObject.save(o)

		return o.uuid
	}
})

Dbo //<-- return this instance