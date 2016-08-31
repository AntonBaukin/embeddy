/*===============================================================+
 |        JavaScript Wrappers for Authentication Point           |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT  = JsX.once('zet/app.js')
var Dbo  = JsX.once('db/obj.js')
var LOG  = ZeT.LU.logger('app.secure.Auth')
var Auth = ZeT.define('App:Secure:Auth',
{
	AuthPoint        : ZeT.bean('AuthPoint'),

	SecRandom        : ZeT.bean('SecRandom'),

	SecDigest        : ZeT.bean('SecDigest'),

	loginTimeout     : 15000, //<-- 15 seconds

	sessionTimeout   : 1000 * 60 * 60 * 4, //<-- 4 hours

	nextSid          : function()
	{
		return Dbo.uuid()
	},

	getLogin         : function(login)
	{
		var lo, q = { type: 'AuthLogin', text: login,
		  unique: 'Duplicate AuthLogin [' + login + ']!'
		}

		Dbo.each(q, function(x){ lo = x })
		return lo
	},

	saveSession      : function(sid, so, lo)
	{
		ZeT.asserts(sid)
		ZeT.assert(ZeT.iso(so))
		ZeT.assert(ZeT.iso(lo))

		var xo = {
			sid      : sid,
			created  : new Date(),
			seqnum   : 0,
			login    : lo.uuid
		}

		ZeT.extend(xo, so)

		var ro = {
			uuid   : sid,
			type   : 'AuthSession',
			owner  : lo.uuid,
			object : xo
		}

		Dbo.save(ro)

		ZeT.LU.debug(LOG, 'created auth session sid: ', sid,
		  ' for login: ', lo.uuid, ' named: ', lo.text)

		return ro
	},

	/**
	 * Binds given session and login objects with
	 * Java HTTP Session (ws) of the auth request.
	 */
	bindSession      : function(ws, so, lo)
	{
		//~: login uuid
		ws.setAttribute('AuthLogin', lo.uuid)

		//~: session uuid
		ws.setAttribute('AuthSession', so.uuid)

		//~: auth domain
		if(ZeT.iss(lo.owner))
			ws.setAttribute('AuthDomain', lo.owner)
	},

	touch            : function(sid)
	{
		Dbo.touch(sid)
	},

	checkSession     : function(sid)
	{
		//~: load the session
		var so = {}
		if(!Dbo.load(sid, 'AuthSession', so))
			return 'Session not found!'

		//?: {session is closed}
		if(!ZeT.isu(so.closed))
			return 'Session is closed!'

		//?: {timeout reached}
		var to = java.lang.System.currentTimeMillis()
		if(so.ts + Auth.sessionTimeout < to)
			return 'Session timeout reached!'

		//~: load the user
		var lo = {}
		ZeT.assert(Dbo.load(so.owner, 'AuthLogin', lo))

		//?: {login is prevented}
		if(lo.object.preventLogin)
			return 'User login prevented!'

		return { so: so, lo: lo }
	},

	checkRequest     : function(sid, seqnum, H, payload)
	{
		ZeT.asserts(sid)
		ZeT.assert(ZeT.iss(H) && H.length === 40)
		ZeT.assert(ZeT.isx(payload) || ZeT.iss(payload))

		try //~: decode the sequence number
		{
			seqnum = java.lang.Long.parseLong('' + seqnum)
		}
		catch(ignore)
		{
			return 'Sequence number is wrong!'
		}

		//~: check the session
		var xo = Auth.checkSession(sid)

		//?: {not valid}
		if(ZeT.iss(xo)) return xo

		//~: calculate signature
		var xH = Auth.SecDigest.signHex(seqnum,
		  ZeT.SU.h2b(xo.so.object.skey), (payload)?(payload):(null))

		//?: {signature is wrong}
		if(xH != H.toUpperCase())
			return 'Request signature is wrong!'

		return xo
	},

	procRequest      : function(response, params, payload)
	{
		try //?: {request is not valid}
		{
			var xo = Auth.checkRequest(params.sid,
			  params.seqnum, params.H, payload)

			if(ZeT.iss(xo))
			{
				response.sendError(404, xo)
				return false
			}

			return xo
		}
		catch(ignore)
		{
			response.sendError(400)
			return false
		}
	},

	indexPage        : function(login)
	{
		var lo = Dbo.get(login, 'AuthLogin')
		return !(lo)?(null):ZeT.iss(lo.indexPage)?
		  (lo.indexPage):('/static/index.html')
	}
})

function get_index_page(login)
{
	return Auth.indexPage(login)
}

function touch_actual_session(session, touch, login, map)
{
	//~: touch session if it't actual
	var xo = Auth.checkSession(session)

	//?: {not actual}
	if(!xo) return false

	//?: {same owner}
	ZeT.assert(!login || xo.so.owner === login)
	ZeT.assert(xo.so.owner === xo.lo.uuid)

	//!: touch the session
	if(touch === true)
		Dbo.touch(session)

	if(map) //?: {copy the objects}
		ZeT.deepExtend(map, xo)

	return true
}

Auth //<-- return this value