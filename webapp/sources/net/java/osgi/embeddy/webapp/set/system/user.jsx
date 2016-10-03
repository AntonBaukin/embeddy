var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

/**
 * Secured by System Filter!
 */
function post()
{
	//~: decode the object
	var r, o = ZeT.s2o(JsX.body())
	if(!o) return response.setStatus(400)

	//?: {do add}
	if(o.add === true)
		r = add(o)
	else
		r = update(o)

	//?: {got an error}
	if(ZeT.isn(r))
		return response.setStatus(r)

	ZeT.resjsonse(r)
}

function update(o)
{
	//?: {no uuid}
	if(ZeT.ises(o.uuid)) return 400

	var p, lo = {}

	//~: load the login
	if(!Dbo.load(o.uuid, 'AuthLogin', lo))
		return 404

	//~: load the person
	p = Dbo.get(o.uuid, 'Person')

	//~: disabled status had changed
	if(ZeT.isb(o.disabled) && (o.disabled != !!lo.object.disabled))
	{
		lo.object.disabled = o.disabled
		lo.object.statusTime = new Date().toISOString()
		lo.updated = true
	}

	//?: {password hash is defined}
	if(!ZeT.ises(o.passhash))
	{
		var ph = passhash(o.passhash)
		ZeT.assert(!ZeT.ises(ph) && (ph.length == 40))

		lo.object.password = ph
		lo.updated = true
	}

	//?: {login had changed}
	if(!ZeT.ises(o.login) && (lo.text != o.login)) try
	{
		//?: {login already exists}
		Dbo.each({ type: 'AuthLogin', text: o.login },
			function(){ throw ZeT.ass('Login exists!') })

		lo.text = o.login
		lo.updated = true
	}
	catch(e)
	{
		return 409 //<-- conflict
	}

	//?: {login updated}
	if(lo.updated) Dbo.update(lo)

	//?: {updated the person}
	if(p && updatePerson(p, o))
		Dbo.update(lo.uuid, 'Person', p)

	//~: extend to the resulting person
	return result(lo, p)
}

function result(lo, p)
{
	return ZeT.extend(p, {
		uuid: lo.uuid,
		login: lo.text,
		disabled: lo.object.disabled,
		statusTime: lo.object.statusTime,
		loginTime: lo.object.loginTime
	})
}

function updatePerson(p, o)
{
	var PS = [ 'firstName', 'lastName', 'middleName',
	  'email', 'phone', 'remarks'
	]

	//?: {updated the person}
	if(!ZeT.o2o(p, o, PS))
		return false

	//~: set the title
	p.title = ZeTS.catsep(' ', p.lastName, p.middleName, p.firstName)

	return true
}

/**
 * Decodes the password SHA-1 hash with
 * the private session key.
 */
function passhash(ph)
{
	ZeT.assert(!ZeT.ises(ph) && (ph.length == 40))

	var ab   = ZeT.assertn(ZeT.bean('AuthBean'))
	var skey = ZeT.asserts(ab.soGet('so', 'object', 'skey'))

	//~: decode the hash with back xor
	return ZeT.xor(ph, skey)
}

function add(o)
{
	ZeT.asserts(o.domain)

	var lo = {
		uuid: Dbo.uuid(),
		type: 'AuthLogin',
		owner: o.domain,
		object: {
			access: [],
			statusTime: new Date(),
			disabled: !!o.disabled
		}
	}

	var p = {
		uuid: lo.uuid
	}

	//?: {has no login}
	if(ZeT.ises(o.login))
		lo.text = lo.uuid
	else try
	{
		//?: {login already exists}
		Dbo.each({ type: 'AuthLogin', text: o.login },
			function(){ throw ZeT.ass('Login exists!') })

		lo.text = o.login
	}
	catch(e)
	{
		return 409 //<-- conflict
	}

	//?: {password hash is not defined} random one
	if(ZeT.ises(o.passhash))
		lo.object.password = ZeT.bean('AuthPoint').
		  randomChars('0123456789ABCDEF', 40)
	else
	{
		var ph = passhash(o.passhash)
		ZeT.assert(!ZeT.ises(ph) && (ph.length == 40))
		lo.object.password = ph
	}

	//~: fill the person
	updatePerson(p, o)

	//!: save the person
	Dbo.save({
		uuid: p.uuid,
		owner: o.domain,
		type: 'Person',
		object: p
	})

	//!: save the login
	Dbo.save(lo)

	//~: extend to the resulting person
	return result(lo, p)
}