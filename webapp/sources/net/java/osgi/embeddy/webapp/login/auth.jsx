var ZeT  = JsX.once('zet/app.js')
var Auth = JsX.once('secure/auth.js')

function get()
{
	switch(params.step)
	{
		case 'greet':
			return greet()

		case 'login':
			return login()

		case 'init':
			return init()

		default:
			response.sendError(400, 'Specify login step!')
	}
}

function greet()
{
	var stime = java.lang.System.currentTimeMillis()
	var Rs    = Auth.SecRandom.randomBytes(20)
	var HRs   = Auth.SecDigest.signHex(stime, Auth.AuthPoint.XKEY, Rs)
	Rs = ZeT.SU.b2h(Rs)

	response.setContentType("text/plain;encoding=UTF-8")
	print("stime=${stime}&Rs=${Rs}&HRs=${HRs}")
}

function login()
{
	//~: check the greet
	var x = checkGreet()
	if(ZeT.iss(x))
		return response.sendError(400, x)

	//~: check login parameters
	x = checkLoginParams(x)
	if(ZeT.iss(x))
		return response.sendError(400, x)

	var lo; try
	{
		//~: get the login
		lo = Auth.getLogin(x.login)
		ZeT.assert(ZeT.iso(lo))

		//?: {locked}
		if(lo.object.preventLogin)
			throw 'User is locked!'

		//~: password SHA-1 hash
		var P = ZeT.asserts(lo.object.password).toCharArray()
		ZeT.assert(P.length == 40)

		//!: validate H
		var xH = Auth.SecDigest.signHex(x.Rc, x.Rs, x.login, P)
		if(xH != ZeT.SU.b2h(x.H))
			throw 'Wrong H signature!'

		//~: generate the session uuid
		var sid  = Auth.nextSid()

		//~: create private session key
		var skey = Auth.SecDigest.sign(x.Rc, x.Rs, sid, P)

		//~: calculate key signature
		var Hsk  = Auth.SecDigest.signHex(x.Rc, x.Rs, skey)

		//~: create web session
		var ws = request.getSession()

		//~: save database entry
		var so = { skey: ZeT.SU.b2h(skey), jsessionid: ws.getId() }
		so = Auth.saveSession(sid, so, lo)

		//~: bind uuids to the web session
		Auth.bindSession(ws, so, lo)

		//~: server-client validation
		response.addHeader('Auth-Server', Hsk)

		//~: deliver the sid
		response.setContentType("text/plain;encoding=UTF-8")

		print(sid)
	}
	catch(e)
	{
		var x = 'Authentication failed!', m = '' + e
		if(ZeT.ii(m, 'RuntimeException'))
			x += ' ' + m

		return response.sendError(400, x)
	}
}

function checkGreet()
{
	//~: parse the server time
	var stime = params.stime
	if(ZeT.ises(stime))
		return 'Send stime (server time) parameter'

	try
	{
		stime = java.lang.Long.parseLong(stime)
	}
	catch(ignore)
	{
		return 'Parameter stime (server time) must be a long number!'
	}

	//~: Rs
	var Rs = params.Rs
	if(ZeT.ises(Rs))
		return 'Send Rs (server random) parameter!'
	Rs = ZeT.SU.h2b(Rs)
	if(Rs.length != 20)
		return 'Rs (server random) must have 20 bytes!'

	//~: HRs
	var HRs = params.HRs
	if(ZeT.ises(HRs))
		return 'Send HRs parameter!'
	HRs = ZeT.SU.h2b(HRs)
	if(HRs.length != 20)
		return 'Wrong HRs signature!'

	//!: validate HRs
	var xHRs = Auth.SecDigest.signHex(stime, Auth.AuthPoint.XKEY, Rs)
	if(ZeT.SU.b2h(HRs) != xHRs)
		return 'Wrong HRs signature!'

	//~: check timeout
	var xtime = stime + Auth.loginTimeout
	if(xtime < java.lang.System.currentTimeMillis())
		return "Authentication timed out!"

	return { stime: stime, xtime: xtime, Rs: Rs, HRs: HRs }
}

function checkLoginParams(x)
{
	//~: Rc
	var Rc = params.Rc
	if(ZeT.ises(Rc))
		return 'Send Rc (client random) parameter!'
	Rc = ZeT.SU.h2b(Rc)
	if(Rc.length != 20)
		return 'Rc (client random) must have 20 bytes!'

	//~: login
	var login = params.login
	if(ZeT.ises(login))
		return 'Send login parameter!'
	if(login.length > 255)
		return 'Login is too long!'

	//~: H (main signature)
	var H = params.H
	if(ZeT.ises(H))
		return 'Send H (main signature) parameter!'
	H = ZeT.SU.h2b(H)
	if(H.length != 20)
		return 'H (main signature) must have 20 bytes!'

	return ZeT.extend(x, { Rc: Rc, login: login, H: H })
}

function init()
{
	//?: {not a valid request}
	var xo = Auth.procRequest(response, params, 'init')
	if(xo === false) return

	var io = {
		indexPage : Auth.indexPage(xo.lo.uuid)
	}

	response.setContentType("application/json;encoding=UTF-8")
	print(ZeT.o2s(io))
}
