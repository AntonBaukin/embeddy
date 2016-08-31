/*===============================================================+
 |                 Application Login Procedure                   |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var AppLogin =
{
	marker      : '2d078eba-32f9-11e6-ac61-9e71128cae77',

	path        : '',

	/**
	 * Issues login procedure. Callback receives
	 * the token object, or an Error.
	 */
	login       : function(opts, callback)
	{
		var self = this, token = {}
		//console.log('AppLogin logging in...')

		//~: login
		var login = opts.login
		if(!login || !login.length)
			throw 'AppLogin error: give login!'
		token.login = login

		//~: password
		var password = opts.password
		if(!password || !password.length)
			throw 'AppLogin error: give password!'

		//~: prepare url
		var url = opts.url
		if(!url) url = AppLogin.path + '/login/auth.jsx'
		token.url = url

		//~: greet step
		jQuery.get({ url: url, data: { step : 'greet' } }).
		  fail(this._fail).done(function(greet) { try
		{
			if(!greet || !greet.length)
				throw 'AppLogin got empty greet!'
			//console.log('AppLogin greet ' + greet)

			//~: extract Rs
			var b  = greet.indexOf('Rs=')
			var e  = (b != -1) && greet.indexOf('&', b)
			if(e == -1) e = greet.length

			var Rs = e && greet.substring(b + 3, e)
			if(!Rs || !Rs.length)
				throw 'AppLogin got wrong greet response!'
			var rs = CryptoJS.enc.Hex.parse(Rs)
			//console.log('AppLogin Rs ' + Rs)

			//~: generate Rc
			var Rc = AppLogin._Rc()
			var rc = CryptoJS.enc.Hex.parse(Rc)
			//console.log('AppLogin Rc ' + Rc)

			//~: hash the password
			password = CryptoJS.SHA1(CryptoJS.enc.Utf8.parse(password))
			//console.log('AppLogin P  ' + password.toString().toUpperCase())

			//~: digest H = SHA1(Rc Rs Login SHA1(Pasword))
			var sha = CryptoJS.algo.SHA1.create()

			sha.update(rc)
			sha.update(rs)
			sha.update(CryptoJS.enc.Utf8.parse(login))
			sha.update(password)

			var H   = sha.finalize().toString().toUpperCase()
			//console.log('AppLogin H  ' + H)

			var d   = { step: 'login', login: login, Rc: Rc, H: H }

			function onfail(xhr)
			{
				self._fail(xhr, opts, d)
			}

			//~: login step
			jQuery.get({ url: url + '?' + greet, data: d }).
			  fail(onfail).done(function(sid, st, xhr) { try
			{
				if(!sid || !sid.length)
					throw 'AppLogin got no session ID! (Login failed.)'
				sid = sid && sid.replace(/^\s+|\s+$/g, '')

				//~: extract session ID
				//console.log('AppLogin logged in, SID ' + sid)
				token.sid = sid

				//~: digest the session key
				sha = CryptoJS.algo.SHA1.create()

				sha.update(rc)
				sha.update(rs)
				sha.update(CryptoJS.enc.Utf8.parse(sid))
				sha.update(password)

				//~: calculate private session key
				token.skey = sha.finalize()
				//console.log('AppLogin private session key ' + token.skey.toString().toUpperCase())

				//~: request index
				token.seqnum = 0

				//~: private session key signature
				var sas = xhr.getResponseHeader('Auth-Server')
				if(!sas) throw 'AppLogin got no Auth-Server response header'

				//~: validate the server authority
				sha = CryptoJS.algo.SHA1.create()

				sha.update(rc)
				sha.update(rs)
				sha.update(token.skey)

				//?: {not equal}
				var xsas = sha.finalize().toString().toUpperCase()
				if(sas != xsas)
					throw 'Server authority check had failed!'
				//console.log('AppLogin server authority checked!')

				//!: install the token
				AppLogin.token = token

				//~: callback with the login init parameters
				AppLogin.init(opts, callback)
			}
			catch(e)
			{
				console.log('AppLogin login error: ' + e)
				if(opts.onerror)
					opts.onerror(e)
			}})
		}
		catch(e)
		{
			console.log('AppLogin greet error: ' + e)
			if(opts.onerror)
				opts.onerror(e)
		}})

		//?: {has callback}
		if(opts.onsuccess)
			opts.onsuccess(token, opts)

		return token
	},

	/**
	 * Does init and returns the (same) token, or an Error.
	 */
	init        : function(opts, callback)
	{
		var self = this, tk = AppLogin.token
		if(!tk) throw 'AppLogin.persist() has no token!'

		var ps = AppLogin.sign('init')
		ps.step = 'init'

		jQuery.get({ url: tk.url, data: ps }).
		  done(function(res){ callback(tk, res) }).
		  fail(function(xhr){ self._fail(xhr, opts, ps) })
	},

	/**
	 * Saves auth token into the local storage.
	 */
	persist     : function()
	{
		var tk = AppLogin.token
		if(!tk || !tk.skey)
			throw 'AppLogin.persist() has no token!'

		//~: convert skey to hex string
		if(!tk.skeyx) tk.skeyx =
		  tk.skey.toString().toUpperCase()

		//!: save into the storage
		var skey = tk.skey; try
		{
			delete tk.skey
			simpleStorage.set('AppLogin.token', tk)
			//console.log('AppLogin saved token', token)
		}
		finally
		{
			tk.skey = skey
		}
	},

	restore     : function()
	{
		//~: load from the storage
		var token = simpleStorage.get('AppLogin.token')

		//?: {no | obsolete  token}
		if(!token || (typeof token.skeyx != 'string'))
			return

		//~: decode session key from hex
		token.skey = CryptoJS.enc.Hex.parse(token.skeyx)

		//?: {has no token saved}
		if(!AppLogin.token)
			AppLogin.token = token

		//console.log('AppLogin restored token', token)
		return token
	},

	/**
	 * Creates request parameters for a signed request.
	 * Optional payload string is also signed.
	 */
	sign        : function(payload)
	{
		//?: {no token is installed}
		var tk = AppLogin.token
		if(!tk || !tk.skey)
			throw 'AppLogin.sign() got no valid token object!'

		//~: digest H
		var sha  = CryptoJS.algo.SHA1.create()
		var seq  = ++tk.seqnum

		sha.update(CryptoJS.enc.Hex.parse(AppLogin._long(seq)))
		sha.update(tk.skey)
		if(typeof payload == 'string')
			sha.update(CryptoJS.enc.Utf8.parse(payload))

		var H = sha.finalize().toString().toUpperCase()
		//console.log('AppLogin sequence number ' + seq + ', H ' + H)

		//!: save updated token
		AppLogin.persist()

		return { sid: tk.sid, seqnum: seq, H : H }
	},

	/**
	 * Unitializes random data for the test purposes.
	 * Requires (demo) AppData object.
	 */
	testToken   : function()
	{
		if(AppLogin.token)
			return AppLogin.token

		var sha = CryptoJS.algo.SHA1.create()
		sha.update(CryptoJS.enc.Utf8.parse(new Date().toISOString()))

		return AppLogin.token = {
			url    : 'http://localhost:8080/login/auth.jsx',
			login  : 'tester@gmail.com',
			seqnum : 1,
			sid    : AppData.uuid(),
			skey   : sha.finalize()
		}
	},

	/**
	 * Does XOR of two hex strings.
	 */
	xor         : function(a, b)
	{
		var HEX = '0123456789ABCDEF'
		var hex = '0123456789abcdef'

		function d(c)
		{
			var i = hex.indexOf(c)
			if(i == -1) i = HEX.indexOf(c)
			if(i == -1) throw 'Illegal HEX digit: ' + c + '!'
			return i
		}

		var l = Math.max(a.length, b.length)
		var s = new Array(l)

		for(var i = 0;(i < l);i++)
		{
			var x = (i < a.length) ? d(a.charAt(i)) : (0)
			var y = (i < b.length) ? d(b.charAt(i)) : (0)
			s[i]  = HEX.charAt(x ^ y)
		}

		return s.join('')
	},

	/**
	 * Decodes 10-base number from secret 40-characters
	 * HEX string using current token secret key.
	 */
	decodeNum   : function(secret)
	{
		ZeT.assert(AppLogin.token && AppLogin.token.skey)
		ZeT.assert(ZeT.iss(secret) && (secret.length == 40))

		var skey = AppLogin.token.skey.toString()
		ZeT.assert(ZeT.iss(skey) && (skey.length == 40))

		//~: back XOR operation
		var back = AppLogin.xor(skey, secret)
		back = back.match(/^\d+/)

		return (ZeT.isa(back) && back.length == 1)?(back[0]):(null)
	},

	_fail       : function(xhr, opts, data)
	{
		var e = new Error('AppLogin had failed! Code: [' +
		  xhr.status + '] message: [' + xhr.statusText + ']')

		if(opts.onerror)
			opts.onerror(e, data)
		else
			throw e
	},

	_Rc         : function()
	{
		var hex = '0123456789ABCDEF'
		var res = ''

		for(var i = 0;(i < 20);i++)
		{
			res += hex.charAt(Math.floor(16 * Math.random()))
			res += hex.charAt(Math.floor(16 * Math.random()))
		}
		return res
	},

	/**
	 * Converts long number (8 bytes) to a hex string.
	 */
	_long       : function(l)
	{
		var hex = '0123456789ABCDEF'
		var res = ''

		for(var i = 0;(i < 8);i++)
		{
			var b = l & 0xFF; l >>>= 8

			//HINT: higher comes first!

			res += hex.charAt((b & 0xF0) >>> 4)
			res += hex.charAt((b & 0x0F)      )
		}
		return res
	}
}

$(document).ready(function()
{
	//~: restore previous token
	if(!AppLogin.token)
		AppLogin.restore()

	//?: {marker is not found}
	if(!document.getElementById(AppLogin.marker))
		return

	$('#login-layout').show()
	setTimeout(function(){ login_focus() }, 500)

	function login_status()
	{
		var l = jQuery.trim($('#login').val())
		var p = jQuery.trim($('#password').val())

		//?: {has previous token}
		if(!l.length && AppLogin.token && AppLogin.token.login)
			$('#login').val(l = AppLogin.token.login)

		//?: {has no login | password}
		if(!l.length || !p.length)
		{
			$('#button').removeClass('btn-primary').addClass('btn-default')
			return (!l.length)?$('#login'):$('#password')
		}

		$('#button').removeClass('btn-default').addClass('btn-primary')
	}

	function login_focus()
	{
		var f = login_status()
		if(f) return f.focus().velocity('callout.flash')
		$('#button').focus()
	}

	function login_try()
	{
		if(login_focus()) return

		var request = {
			login    : jQuery.trim($('#login').val()),
			password : jQuery.trim($('#password').val()),
			onerror  : function(e)
			{
				$('#button').velocity('callout.shake')
				if(e instanceof Error) console.log(e.message)
			}
		}

		//!: invoke secured login procedure
		AppLogin.login(request, function(token, init)
		{
			//?: {not logged in} shake the button
			if(!token || (token instanceof Error))
				request.onerror(token)

			token.init = init
			AppLogin.persist(token)

			//console.log('Token ', token)
			//console.log('Init ', init)

			//~: user-specific index page
			var ipage = init.indexPage
			if(typeof ipage != 'string')
				ipage = '/static/index.html'

			//~: activate save login dialog
			$('#submit').click()

			//~: go there
			setTimeout(function(){ window.location.replace(ipage) }, 500)
		})
	}

	//~: activate button on edit
	$('#login, #password').on('keydown keyup focus blur', login_status).
	  on('cut paste', function() { setTimeout(jQuery.proxy(login_status, this, arguments), 100) })

	//~: login try on click
	$('#button').on('click', login_try)

	//~: login try on enter
	$('#login, #password, #button').on('keypress', function(e)
	{
		if(e.which != 13) return

		e.preventDefault()
		e.stopPropagation()
		login_try()
	})
})