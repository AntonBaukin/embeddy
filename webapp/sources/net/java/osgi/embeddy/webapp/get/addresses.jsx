var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function get()
{
	var ab = ZeT.bean('AuthBean')
	var dm = ZeT.asserts(ab.getDomain())
	var ad = Dbo.get(dm, 'Addresses') || []

	response.setContentType('application/json;charset=UTF-8')
	print(ZeT.o2s(ad))
}