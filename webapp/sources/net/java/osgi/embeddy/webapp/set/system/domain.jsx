var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

/**
 * Secured by System Filter!
 */
function post()
{
	//~: decode the object
	var o = ZeT.s2o(JsX.body())
	if(!o) return response.setStatus(400)

	//?: {no uuid}
	if(ZeT.ises(o.uuid) && (o.add !== true))
		return response.setStatus(400)

	//~: load the domain
	var upd, dom = (o.add === true)?{}:
	  ZeT.assertn(Dbo.get(o.uuid, 'Domain'))

	//?: {disabled changed}
	if(ZeT.isb(o.disabled) && (o.disabled != !!dom.disabled))
	{
		dom.disabled = o.disabled
		dom.statusTime = new Date().toISOString()
		upd = true
	}

	//?: {creating}
	if(o.add === true)
	{
		ZeT.assert(ZeT.isu(o.uuid))
		dom.uuid = Dbo.uuid()
		dom.statusTime = new Date().toISOString()
		upd = true
	}

	var PS = [ 'title', 'firm.title', 'firm.address',
	  'firm.contacts', 'remarks' ]

	//~: assign changed properties
	if(ZeT.o2o(dom, o, PS) || upd)
		if(o.add === true)
			Dbo.save({ uuid: dom.uuid, type: 'Domain', object: dom })
		else
			Dbo.update(dom.uuid, 'Domain', dom)

	ZeT.resjsonse(dom)
}