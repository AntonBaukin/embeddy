var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

/**
 * Secured by System Filter!
 */
function get()
{
	var ab = ZeT.bean('AuthBean')
	var ds = []

	Dbo.each({ type: 'Domain' }, function(o){ ds.push(o.object) })

	ZeT.resjsonse(ds)
}