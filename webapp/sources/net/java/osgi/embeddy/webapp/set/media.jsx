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
	var fo = {}
	if(!Dbo.load(o.uuid, 'MediaFile', fo))
		return response.setStatus(404)

	//sec: {wrong domain}
	if(fo.owner !== dm)
		return response.setStatus(403)

	var PS = [ 'removed', 'name', 'tags' ]

	//~: assign changed properties
	if(ZeT.o2o(fo.object, o, PS))
		Dbo.update(fo)

	ZeT.resjsonse(fo.object)
}