var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function get()
{
	if(ZeT.ises(params.type))
	{
		response.sendError(400, 'Specify the object type!')
		return
	}

	var a = []
	Dbo.GetObject.typed(params.type, function(o)
	{
		var x = ZeT.clone(o)

		if(ZeT.iss(x.json))
		{
			x.object = ZeT.s2o(x.json)
			delete x.json
		}

		a.push(x)
		return true
	})

	response.setContentType("application/json")
	print(ZeT.o2s(a))
}