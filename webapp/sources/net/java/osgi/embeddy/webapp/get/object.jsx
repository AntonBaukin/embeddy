var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function get()
{
	var uuid = params.uuid
	if(ZeT.ises(uuid))
	{
		response.sendError(400, 'Specify uuid parameter!')
		return
	}

	var o = {}
	if(!Dbo.load(uuid, o))
	{
		response.sendError(404)
		return
	}

	//~: remove the object text
	delete o.json

	response.setContentType("application/json")
	print(ZeT.o2s(o))
}