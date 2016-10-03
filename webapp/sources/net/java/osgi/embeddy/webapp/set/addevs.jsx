var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function post()
{
	var ab = ZeT.bean('AuthBean')
	var dm = ZeT.asserts(ab.getDomain())

	//~: decode the object, check the number
	var  o = ZeT.s2o(JsX.body())
	if(!o || !ZeT.isn(o.number) || (o.number <= 0) || (o.number > 10))
		return response.setStatus(400)

	var AuthPoint = ZeT.bean('AuthPoint')
	var SecDigest = ZeT.bean('SecDigest')

	//c: generate the devices
	for(var devs = [], i = 0;(i < o.number);i++)
	{
		//~: device object
		var dev = { uuid: Dbo.uuid(), removed: false, tags: [] }

		//~: random password
		var pass = AuthPoint.randomChars('0123456789', 7)

		//!: save the device
		Dbo.save({
			uuid: dev.uuid,
			owner: dm,
			type: 'Device',
			object: dev
		})

		//!: save the login
		Dbo.save({
			uuid: dev.uuid,
			owner: dm,
			type: 'AuthLogin',
			text: dev.uuid,
			object: {
				access: [ 'device' ],
				passtext: pass,
				password: SecDigest.signHex(pass),
				indexPage: '/get/devco.jsx'
			}
		})

		devs.push(dev)
	}

	ZeT.resjsonse(devs)
}