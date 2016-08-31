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
	if(ZeT.ises(o.uuid) && o.create !== true)
		return response.setStatus(400)

	//~: load the addresses
	var a, ad = Dbo.get(dm, 'Addresses')

	//: {found them not}
	var ex = !!ad; if(!ad) ad = []

	//?: {create new instance}
	if(ZeT.ises(o.uuid))
	{
		ZeT.assert(o.create === true)
		ad.push(a = { uuid: Dbo.uuid() })
	}
	//~: search for the target
	else ZeT.each(ad, function(x){
		if(x.uuid == o.uuid) { a = x; return false }
	})

	//?: {not found}
	if(!a) return response.setStatus(404)

	var PS = [ 'removed', 'index', 'province',
	  'settlement', 'street', 'building', 'office' ]

	//~: assign changed properties
	if(ZeT.o2o(a, o, PS))
		Dbo[ex?'update':'save']({ uuid: dm, type: 'Addresses', object: ad })

	response.setContentType('application/json;charset=UTF-8')
	print(ZeT.o2s(a))
}