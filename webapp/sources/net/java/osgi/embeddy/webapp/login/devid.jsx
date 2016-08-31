var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function get()
{
	if(ZeT.ises(params.uuid))
		return response.sendError(400, 'Specify uuid prefix!')

	var uuid = Dbo.GetObject.guess('Device', params.uuid)

	if(!uuid)
		return response.sendError(404)

	response.setContentType('text/plain;charset=UTF-8')
	print(uuid)
}