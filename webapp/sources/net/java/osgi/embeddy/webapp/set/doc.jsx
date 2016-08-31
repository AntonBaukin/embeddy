var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function post()
{
	var ab = ZeT.bean('AuthBean')
	var dm = ZeT.asserts(ab.getDomain())

	//~: decode the object
	var  o = ZeT.s2o(JsX.body())
	if(!o) return response.setStatus(400)

	//?: {no uuid}
	if(ZeT.ises(o.uuid))
		return response.setStatus(400)

	//~: load the file
	var dc = {}
	if(!Dbo.load(o.uuid, 'Document', dc))
		return response.setStatus(404)

	//sec: {wrong domain}
	if(dc.owner !== dm)
		return response.setStatus(403)

	var PS = [ 'removed', 'name', 'date', 'tags' ]

	//~: assign changed properties
	if(ZeT.o2o(dc.object, o, PS))
		Dbo.update(dc)

	response.setContentType('application/json;charset=UTF-8')
	print(ZeT.o2s(dc.object))
}