var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function post()
{
	//~: decode the object
	var o = ZeT.s2o(JsX.body())
	ZeT.assert(ZeT.iso(o) || ZeT.isa(o))

	//?: {handle single object}
	if(ZeT.iso(o)) update(o); else
		ZeT.each(o, update)
}

function update(o)
{
	var dm = ZeT.asserts(ZeT.bean('AuthBean').getDomain())

	//?: {has no uuid}
	ZeT.asserts(o.uuid)

	//~: load the device
	var dev = {}
	ZeT.assert(Dbo.load(o.uuid, 'Device', dev))

	//sec: {wrong domain}
	ZeT.assert(dev.owner === dm)

	var PS = [ 'removed', 'title', 'address', 'tags' ]

	//~: assign changed properties
	if(ZeT.o2o(dev.object, o, PS))
		Dbo.update(o.uuid, 'Device', dev.object)
}