var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function get()
{
	if(ZeT.ises(params.uuid))
		return response.sendError(400, 'Specify device UUID!')

	var ab = ZeT.bean('AuthBean')
	var dm = ZeT.asserts(ab.getDomain())

	ZeT.resjsonse(Dbo.get(params.uuid, 'DeviceSchedules') || [])
}