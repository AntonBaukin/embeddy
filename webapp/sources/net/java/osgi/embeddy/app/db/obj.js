/*===============================================================+
 |           JavaScript Wrappers for Database Access             |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT  = JsX.once('zet/app.js')
var Mime = JsX.once('db/mime.js')
var Dbo  = ZeT.define('App:Db:Object',
{
	/* Get Object */

	GetObject        : ZeT.bean('GetObject'),

	uuid             : function()
	{
		return Dbo.GetObject.newUUID()
	},

	exists           : function(uuid, type)
	{
		return ZeT.isu(type)?(Dbo.GetObject.exists(uuid)):
		  Dbo.GetObject.exists(uuid, type)
	},

	/**
	 * Loads JSON object from the database record.
	 * (Decoded object is returned.)
	 */
	get              : function(uuid, type)
	{
		if(ZeT.ises(type)) type = ''
		var json = Dbo.GetObject.json(uuid, type)
		return (json)?ZeT.s2o(json):(null)
	},

	load             : function(uuid, type, o)
	{
		ZeT.asserts(uuid)
		ZeT.assert(ZeT.iso(o))
		if(ZeT.ises(type)) type = ''

		if(!Dbo.GetObject.load(uuid, type, o))
			return false

		//?: {decode json}
		if(!ZeT.isx(o.json))
		{
			o.object = ZeT.s2o(o.json)
			delete o.json
		}

		return true
	},

	each             : function(o, f)
	{
		ZeT.assert(ZeT.iso(o))
		ZeT.assertf(f)

		//?: {is unique}
		var uqs = ZeT.iss(o.unique)?(o.unique):(null)
		var uq  = (o.unique === true) || !!uqs
		delete o.unique

		//~: selection keys
		var ks = ZeT.keys(o)

		function w() //<-- callback wrapper
		{
			//?: {not a unique result}
			ZeT.assert(uq !== 1, uqs || 'Not a unique each() result!')
			if(uq === true) uq = 1

			//~: object (map) argument
			ZeT.assert(arguments.length == 1)
			ZeT.assert(ZeT.iso(arguments[0]))
			var o = ZeT.extend({}, arguments[0])

			//~: decode the object
			if(ZeT.iss(o.json)) {
				o.object = ZeT.s2o(o.json)
				delete o.json
			}

			//~: invoke the callback
			var x = f.call(this, o)
			return (x === false)?(false):(true)
		}

		//?: {each type}
		if(ks.length == 1 && o.type)
			return Dbo.GetObject.eachType(o.type, w)

		//?: {each type + text}
		if(ks.length == 2 && o.type && o.text)
			return Dbo.GetObject.eachTypeText(o.type, o.text, w)

		//?: {each type + text}
		if(ks.length == 2 && o.owner && o.type)
			return Dbo.GetObject.eachOwnerType(o.owner, o.type, w)

		throw ZeT.ass('Wrong GetObject.each() call!')
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

		if(!o.uuid) o.uuid = Dbo.uuid()
		ZeT.asserts(o.uuid)

		if(!ZeT.isx(o.object))
			o.json = ZeT.o2s(o.object)

		Dbo.GetObject.save(o)

		return o.uuid
	},

	update           : ZeT.scope(function()
	{
		function update(uuid, type, object)
		{
			ZeT.asserts(uuid)
			ZeT.assert(ZeT.iso(object) || ZeT.isa(object))
			if(ZeT.ises(type)) type = ''

			Dbo.GetObject.update(uuid, type, ZeT.o2s(object))
		}

		return function(/* o | uuid, type, object */)
		{
			if(arguments.length == 1)
			{
				var o = arguments[0]
				ZeT.assert(ZeT.iso(o))
				return update(o.uuid, o.type, o.object)
			}

			ZeT.assert(arguments.length == 3)
			return update.apply(this, arguments)
		}
	}),

	touch            : function(uuid)
	{
		ZeT.asserts(uuid)
		Dbo.GetObject.touch(uuid)
	}
})

/**
 * Loads object from the database and copies
 * it's properties into the map given. All
 * JavaScript objects are replaced with
 * Java linked maps.
 */
function get_in_map(uuid, type, map)
{
	//~: load the object
	var o = Dbo.get(uuid, type)
	if(!o) return false

	//~: copy it deeply
	ZeT.extend(map, o)

	//~: replace objects with java maps
	if(map instanceof ZeT.JAVA_MAP)
		ZeT.o2m(map)

	return true
}

/**
 * Update the file object after the uploading
 * and returns JSON string of new file state.
 */
function update_mediafile_uploaded(uuid, rename, digest, mp)
{
	var fo = Dbo.get(uuid, 'MediaFile')

	if(!fo) //?: {file is just created}
	{
		ZeT.assert(rename)

		fo = {
			uuid: uuid,
			removed: false
		}
	}

	//?: {rename}
	if(rename === true) ZeT.scope(function()
	{
		var ext, name = mp.getOriginalFilename()

		//?: {name is empty}
		if(ZeT.ises(name)) return

		//?: {name contains separator}
		var i = name.lastIndexOf('/')
		if(i >= 0) name = name.substring(i + 1)
		i = name.lastIndexOf('\\')
		if(i >= 0) name = name.substring(i + 1)

		//?: {name is empty}
		if(ZeT.ises(name)) return

		//~: extension
		i = name.lastIndexOf('.')
		if(i > 0) {
			ext = name.substring(i + 1)
			name = name.substring(0, i)
		}

		//?: {name or ext are empty}
		if(ZeT.ises(name) || ZeT.ises(ext)) return

		//?: {unknown mime type}
		var mime = Mime.ext2mime(ext)
		if(ZeT.ises(mime)) return

		//~: rename the object
		ZeT.extend(fo, { name: name, ext: ext, mime: mime })
	})

	//~: update the object
	ZeT.extend(fo, {
		length : mp.getSize(),
		time   : new Date().toISOString(),
		sha1   : digest
	})

	//!: update in the database
	Dbo.update(uuid, 'MediaFile', fo)

	return ZeT.o2s(fo)
}

function update_docfile_uploaded(uuid, rename, digest, mp)
{
	var fo = Dbo.get(uuid, 'Document')

	if(!fo) //?: {file is just created}
	{
		ZeT.assert(rename)

		fo = {
			uuid: uuid,
			removed: false
		}
	}

	//?: {rename}
	if(rename === true) ZeT.scope(function()
	{
		var name = mp.getOriginalFilename()

		//?: {name is empty}
		if(ZeT.ises(name)) return

		//~: rename the object
		ZeT.extend(fo, { name: name })
	})

	//~: update the object
	ZeT.extend(fo, {
		length : mp.getSize(),
		time   : new Date().toISOString(),
		sha1   : digest
	})

	//!: update in the database
	Dbo.update(uuid, 'Document', fo)

	return ZeT.o2s(fo)
}

Dbo //<-- return this instance