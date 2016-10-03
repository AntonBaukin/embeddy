var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function get()
{
	var ab = ZeT.bean('AuthBean')
	var dm = ZeT.asserts(ab.getDomain())

	ZeT.resjsonse(Dbo.get(dm, 'Addresses') || [])
}