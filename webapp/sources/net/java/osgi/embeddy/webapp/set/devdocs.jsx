var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function post()
{
	var ab = ZeT.bean('AuthBean')
	var dm = ZeT.asserts(ab.getDomain())

	//~: decode the object
	var  o = ZeT.s2o(JsX.body())
	if(!o) return response.setStatus(400)

	//?: {no devices uuid-s}
	if(!ZeT.isa(o.devices))
		return response.setStatus(400)

	//?: {no selected files}
	if(!ZeT.isa(o.selected))
		return response.setStatus(400)

	//~: memory structure
	var mem = { domain: dm }

	//~: process for each device
	ZeT.each(o.devices, function(dev)
	{
		mem.dev = ZeT.asserts(dev)
		process(mem, o.selected)
	})
}

function process(mem, selected)
{
	//~: load the device
	var dev = {}
	ZeT.assert(Dbo.load(mem.dev, 'Device', dev))

	//sec: {wrong domain}
	ZeT.assert(dev.owner === mem.domain)

	//~: load existing schedules
	mem.selected = mem.loaded = Dbo.get(mem.dev, 'DeviceDocuments')
	if(!mem.selected) mem.selected = []

	//~: select the documents
	select(mem, selected)

	if(mem.loaded) //?: {loaded}
		Dbo.update(mem.dev, 'DeviceDocuments', mem.selected)
	else
		Dbo.save({
			uuid: dev.uuid,
			owner: dm,
			type: 'DeviceDocuments',
			object: mem.selected
		})
}

function loadDocument(mem, uuid)
{
	if(!mem.documents) mem.documents = {}
	if(mem.documents[uuid]) return

	//~: load it
	var o = {}
	ZeT.assert(Dbo.load(uuid, 'Document', o))

	//sec: schedule of same domain
	ZeT.assert(mem.domain === o.owner)

	return (mem.documents[uuid] = o).object
}

function select(mem, selected)
{
	//~: map existing
	var d2ex = {}, d2ds = {}
	ZeT.each(mem.selected, function(s) { d2ds[s] = true })

	//~: add new records
	ZeT.each(selected, function(doc)
	{
		ZeT.asserts(doc)
		d2ex[doc] = true

		//?: {already selected}
		if(d2ds[doc]) return

		//~: load (check) the document
		d2ds[doc] = loadDocument(mem, doc)

		//!: put to teh selection
		mem.selected.push(doc)
	})

	//~: remove obsolete
	for(var i = 0;(i < mem.selected.length);)
		if(d2ex[mem.selected[i]])
			i++
		else
			mem.selected.splice(i, 1)
}
