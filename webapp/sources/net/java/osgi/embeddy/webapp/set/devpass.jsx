var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function post()
{
	var AuthPoint = ZeT.bean('AuthPoint')
	var SecDigest = ZeT.bean('SecDigest')

	//~: decode the object
	var params = ZeT.s2o(JsX.body())
	if(!params || ZeT.ises(params.uuid))
		return response.sendError(400, 'Specify device UUID!')

	var ab = ZeT.bean('AuthBean')
	var dm = ZeT.asserts(ab.getDomain())
	var se = ZeT.assertn(Dbo.get(ZeT.asserts(ab.getSession()), 'AuthSession'))

	//?: {device does not exist}
	if(!Dbo.exists(params.uuid, 'Device'))
		return response.sendError(404)

	//~: load the login
	var al = {}
	ZeT.assert(Dbo.load(params.uuid, 'AuthLogin', al))

	//sec: {not that domain}
	if(al.owner !== dm)
		return response.sendError(403)

	//~: secret session key
	var skey = ZeT.asserts(se.skey)

	//~: generate new password (7 digits)
	var pass = AuthPoint.randomChars('0123456789', 7)

	//~: save it + it's digest
	al.object.passtext = pass
	al.object.password = SecDigest.signHex(pass)

	//!: update to the database record
	Dbo.update(al)

	//~: pad password with the random hex
	if(pass.length < skey.length)
		pass += AuthPoint.randomChars('ABCDEF', skey.length - pass.length)

	ZeT.resjsonse({ uuid: params.uuid, secret: ZeT.xor(skey, pass) })
}