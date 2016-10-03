var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function get()
{
	var ab = ZeT.bean('AuthBean')
	var dm = ZeT.asserts(ab.getDomain())
	var sc = []

	Dbo.each({ owner: dm, type: 'Schedule' }, function(o){ sc.push(o.object) })

	ZeT.resjsonse(sc)
}