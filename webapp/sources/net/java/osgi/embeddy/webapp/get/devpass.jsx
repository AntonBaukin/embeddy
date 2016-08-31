var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function get()
{
	var AuthPoint = ZeT.bean('AuthPoint')

	if(ZeT.ises(params.uuid))
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

	//?: {has no clear text password}
	if(ZeT.ises(al.object.passtext))
		return response.setStatus(204)

	var skey = ZeT.asserts(se.skey)
	var pass = al.object.passtext

	//~: pad password with the random hex
	if(pass.length < skey.length)
		pass += AuthPoint.randomChars('ABCDEF', skey.length - pass.length)

	//~: xor over two items
	var secret = ZeT.xor(skey, pass)

	response.setContentType('application/json;charset=UTF-8')
	print(ZeT.o2s({ uuid: params.uuid, secret: secret }))
}