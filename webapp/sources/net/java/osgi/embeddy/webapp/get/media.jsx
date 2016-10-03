var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function get()
{
	var ab = ZeT.bean('AuthBean')
	var dm = ZeT.asserts(ab.getDomain())
	var fs = []

	Dbo.each({ owner: dm, type: 'MediaFile' }, function(o){ fs.push(o.object) })

	ZeT.resjsonse(fs)
}