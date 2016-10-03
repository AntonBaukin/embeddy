var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

/**
 * Secured by System Filter!
 */
function get()
{
	var ab = ZeT.bean('AuthBean')
	var um = {}

	Dbo.each({ type: 'AuthLogin' }, function(o){

		//?: {is a system user} not report it
		if(!o.owner) return

		ZeT.extend(o.object, {
			uuid: o.uuid,
			domain: o.owner,
			login: o.text
		})

		um[o.uuid] = o.object
	})

	Dbo.each({ type: 'Person' }, function(o){

		if(!um[o.uuid]) return

		o.object.person = true
		um[o.uuid] = ZeT.extend(um[o.uuid], o.object)
	})

	var us = []; ZeT.each(um, function(u)
	{
		//sec: erase the passwords
		delete u.password
		delete u.passtext

		us.push(u)
	})

	ZeT.resjsonse(us)
}