var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function get()
{
	var ab = ZeT.bean('AuthBean')
	var dm = ZeT.asserts(ab.getDomain())
	var ds = []

	Dbo.each({ owner: dm, type: 'Document' }, function(o){ ds.push(o.object) })

	ZeT.resjsonse(ds)
}