/*===============================================================+
 |            Sample Database Initialization Script              |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')
var LOG = ZeT.LU.logger('app.db.init')

/**
 * Populates the database with sample data.
 */
function init()
{
	ZeT.LU.info(LOG, 'initializing the database...')

	//~: create the system user
	systemUser()

	//~: testing setup
	initTest()
}

function systemUser()
{
	var suid = 'de9467fe-2e38-11e6-b67b-9e71128cae77'

	//?: {exists}
	if(Dbo.exists(suid))
	{
		ZeT.LU.info(LOG, 'found System login ', suid)
		return
	}

	ZeT.LU.warn(LOG, 'creating System login ', suid,
	  ' having the default password')

	Dbo.save({
		uuid: suid,
		type: 'AuthLogin',
		text: 'System',
		object: {
			password: '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8',
			indexPage: '/static/system/index.html',
			access: [ 'su' ]
	}})
}

var TST_DOM  = '128a11be-37a6-11e6-ac61-9e71128cae77'
var DEF_PASS = '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8'

function initTest()
{
	var domid = TST_DOM

	//?: {domain exists}
	if(Dbo.exists(domid))
		return ZeT.LU.info(LOG, 'found testing domain ', domid)

	//~: create testing domains
	var domains = genDomains()

	//~: created the users of the domains
	var users = genUsers(domains)

	//~: generate the tags
	var tags = genTags(domid)

	//~: generate the addresses
	var addresses = genAddresses(domid)

	//~: generate the devices
	var devs = genDevices(domid, tags, addresses)

	//~: generate the files
	var files = genFiles(domid, tags)

	//~: generate the schedules
	var schedules = genSchedules(domid, tags, files)

	//~: associate schedules for each device
	var devschs = genDeviceSchedules(domid, devs, schedules)

	//~: generate the documents
	var docs = genDocs(domid, tags)

	//~: select documents for the devices
	var devdocs = genDeviceDocs(domid, devs, docs)
}

function genDomains()
{
	var addresses = JsX.include('./init-addresses')

	function addrline()
	{
		var a = $a(addresses)
		a.index = $a('0123456789', 6).join('')

		var o; if(!ZeT.ises(o = a.office))
		if(!ZeT.ii(o.toLocaleLowerCase(), 'office'))
			o = 'office ' + o

		return ZeTS.catsep(', ', a.index, a.province,
			a.settlement, a.street, a.building, o)
	}

	function contacts()
	{
		var p = genPerson()
		return p.phone + '; ' + p.title
	}

	var domains = []
	$times(2, 4, function()
	{
		var d = {
			uuid: Dbo.uuid(),
			disabled: $bool(4),
			statusTime: $dateTime(-14).toISOString(),
			title: $words(3),
			firm: {
				title: $words(8),
				address: addrline(),
				contacts: contacts()
			}
		}

		if(!domains.length)
		{
			d.uuid = TST_DOM
			d.title = 'Test domain'
			delete d.disabled
		}

		domains.push(d)
	})

	ZeT.each(domains, function(d, i)
	{
		ZeT.LU.info(LOG, 'created testing domain ', d.uuid)
		Dbo.save({ uuid: d.uuid, type: 'Domain', object: d })
	})

	return domains
}

function genPerson()
{
	var p = {
		uuid: Dbo.uuid(),
		firstName: name(),
		lastName: name(),
		phone: ZeTS.cat('+7-9', $a('0123456789', 2), '-', $a('0123456789', 7))
	}

	function name()
	{
		var w = $words(1)
		return ZeTS.first(w).toLocaleUpperCase() + w.substring(1)
	}

	if($bool()) p.middleName = name()
	p.title = ZeTS.catsep(' ', p.lastName, p.middleName, p.firstName)

	p.email = ZeTS.cat($translit(p.firstName), '.',
	  $translit(p.lastName), '@gmail.com').toLocaleLowerCase()

	return p
}

function genUsers(domains)
{
	var users = []

	ZeT.each(domains, function(d)
	{
		$times(1, 8, function()
		{
			var u = genPerson(), l = {
				uuid: u.uuid,
				access: [],
				password: DEF_PASS,
				disabled: $bool(5),
				loginTime: $dateTime(-7)
			}

			l.statusTime = $dateTime(-7, new Date(l.loginTime))

			if((d.uuid == TST_DOM) && !users.length)
			{
				u.email = 'tester@gmail.com'
				delete l.disabled
			}

			users.push(u)

			Dbo.save({
				uuid: u.uuid,
				owner: d.uuid,
				type: 'Person',
				object: u
			})

			Dbo.save({
				uuid: u.uuid,
				owner: d.uuid,
				type: 'AuthLogin',
				text: u.email,
				object: l
			})

			ZeT.LU.info(LOG, 'created user ', u.email, ' @ ', d.uuid)
		})
	})

	return users
}

function genTags(domid)
{
	var tags = []

	$times(20, function()
	{
		tags.push({
			uuid: Dbo.uuid(),
			title: $words(5),
			removed: $bool(4)
		})
	})

	Dbo.save({
		uuid: domid,
		type: 'Tags',
		object: tags
	})

	return tags
}

function genAddresses(domid)
{
	var result = [], addresses = JsX.include('./init-addresses')

	result = $au(addresses, $n(3, 10))
	ZeT.each(result, function(a, i)
	{
		result[i] = ZeT.extend({
			uuid: Dbo.uuid(),
			removed: $bool(4),
			index: $a('0123456789', 6).join('')
		}, a)
	})

	Dbo.save({
		uuid: domid,
		type: 'Addresses',
		object: result
	})

	return result
}

function genDevices(domid, tags, addresses)
{
	var AuthPoint = ZeT.bean('AuthPoint')
	var SecDigest = ZeT.bean('SecDigest')
	var devs      = []

	$times(20, function()
	{
		devs.push({
			uuid: Dbo.uuid(),
			removed: $bool(5),
			title: $words(3),
			address: $a(addresses).uuid,
			tags: $tags(tags)
		})
	})

	ZeT.each(devs, function(dev)
	{
		var pass = AuthPoint.randomChars('0123456789', 7)

		Dbo.save({
			uuid: dev.uuid,
			owner: domid,
			type: 'AuthLogin',
			text: dev.uuid,
			object: {
				access: [ 'device' ],
				passtext: pass,
				password: SecDigest.signHex(pass),
				indexPage: '/get/devco.jsx',
				statusTime: $dateTime(-7)
			}
		})

		Dbo.save({
			uuid: dev.uuid,
			owner: domid,
			type: 'Device',
			object: dev
		})

		ZeT.LU.info(LOG, 'saved test device ', dev.uuid)
	})

	return devs
}

function genFiles(domid, tags)
{
	var digest = ZeT.bean('SecDigest')
	var files  = []

	$times(10, 20, function()
	{
		var mime, ext, len

		if($bool(5))
		{
			mime = 'image/jpeg'
			ext  = 'jpg'
			len  = $n(10240, 102400)
		}
		else
		{
			mime = 'video/mp4'
			ext  = 'mp4'
			len  = $n(102400, 1024000)
		}

		files.push({
			uuid: Dbo.uuid(),
			removed: $bool(5),
			name: $words(3),
			mime: mime,
			ext: ext,
			length: len,
			time: new Date().toISOString(),
			tags: $tags(tags)
		})
	})

	ZeT.each(files, function(file)
	{
		var bytes = $bytes(file.length)
		file.sha1 = digest.signHex(bytes)

		Dbo.save({
			uuid: file.uuid,
			owner: domid,
			type: 'MediaFile',
			object: file
		})

		//~: save the file bytes
		Dbo.GetObject.update(file.uuid, 'MediaFile', bytes)

		ZeT.LU.info(LOG, 'saved test media file ', file.uuid,
		  ' length ', Math.floor(file.length / 1024), ' KiB')
	})

	return files
}

function genSchedules(domid, tags, files)
{
	var schedules = []

	function taskFiles(x)
	{
		x.files = []

		$times(5, function()
		{
			var f = $a(files)
			var y = { uuid: f.uuid }

			if(ZeTS.starts(f.mime, 'video'))
				y.repeat = $n(1, 5)
			else
				y.duration = 1000 * 60 * $n(5, 10)

			x.files.push(y)
		})
	}

	function task0of1(x)
	{}

	function task0ofN(x)
	{}

	function taskIofN(x)
	{
		var p = $n(0, 4)

		if(p > 3)
			x.duration = 1000 * 60 * $n(30, 180)
		else if(p > 0)
			x.repeat = $n(1, 3)
	}

	function schedule(n)
	{
		n = $n(1, n)

		var times = [ 0 ]
		while(times.length < n)
		{
			var t = $n(1, 24 * 60)
			if(!ZeT.ii(times, t)) times.push(t)
		}

		times.sort(function(a, b){ return a - b })

		var res = []
		for(var i = 0;(i < n);i++)
		{
			var x = {
				time: times[i] * 60000,
				strict: $bool(4)
			}

			if(!x.strict) x.threshold = $n(1, 5)*5 * 60 * 1000

			taskFiles(x)

			if(n == 1)
				task0of1(x)
			else if(i == 0)
				task0ofN(x)
			else
				taskIofN(x)

			res.push(x)
		}

		return res
	}

	$times(5, 10, function()
	{
		schedules.push({
			uuid: Dbo.uuid(),
			removed: $bool(5),
			title: $words(5),
			tags: $tags(tags),
			tasks: schedule($bool()?(1):(7))
		})
	})

	ZeT.each(schedules, function(sc)
	{
		Dbo.save({
			uuid: sc.uuid,
			owner: domid,
			type: 'Schedule',
			object: sc
		})

		ZeT.LU.info(LOG, 'saved test schedule ', sc.uuid)
	})

	return schedules
}

function genDeviceSchedules(domid, devs, schs)
{
	var d2s = {}

	ZeT.each(devs, function(dev)
	{
		var t0   = $date(-14)
		var dscs = []
		d2s[dev.uuid] = dscs

		$times(10, function()
		{
			var at = t0
			t0 = $date(5, t0)

			dscs.push({
				at: at.toISOString(),
				ts: at.getTime(),
				device: dev.uuid,
				schedule: $a(schs).uuid
			})
		})
	})

	ZeT.each(d2s, function(dscs, duuid)
	{
		Dbo.save({
			uuid: duuid,
			owner: domid,
			type: 'DeviceSchedules',
			object: dscs
		})
	})

	return d2s
}

function genDocs(domid, tags)
{
	var digest = ZeT.bean('SecDigest')
	var   docs = []

	$times(4, 10, function()
	{
		var ext = $a([ '.xls', '.xml', '.json' ])
		var len = $n(512, 10240)
		var nam = $words(3).split(' ').join('_')

		docs.push({
			uuid: Dbo.uuid(),
			removed: $bool(5),
			name: nam + ext,
			length: len,
			date: $date().toISOString(),
			time: new Date().toISOString(),
			tags: $tags(tags)
		})
	})

	ZeT.each(docs, function(doc)
	{
		var bytes = $bytes(doc.length)
		doc.sha1 = digest.signHex(bytes)

		Dbo.save({
			uuid: doc.uuid,
			owner: domid,
			type: 'Document',
			object: doc
		})

		//~: save the file bytes
		Dbo.GetObject.update(doc.uuid, 'Document', bytes)

		ZeT.LU.info(LOG, 'saved test document ', doc.uuid,
		  ' length ', Math.floor(doc.length / 1024), ' KiB')
	})

	return docs
}

function genDeviceDocs(domid, devs, docs)
{
	var d2ds = {}

	ZeT.each(devs, function(dev)
	{
		var ds = d2ds[dev.uuid] = $au(docs, $n(1, 4))

		for(var i = 0;(i < ds.length);i++)
			ds[i] = ds[i].uuid
	})

	ZeT.each(d2ds, function(dds, duuid)
	{
		Dbo.save({
			uuid: duuid,
			owner: domid,
			type: 'DeviceDocuments',
			object: dds
		})
	})

	return d2ds
}

function $n(m, M)
{
	return m + Math.floor(Math.random() * (1 + M - m))
}

function $times(/* m, [ M, ] f */)
{
	var m, M, f, a = arguments

	if(a.length == 3) { m = a[0]; M = a[1]; f = a[2] }
	else { m = 1; M = a[0]; f = a[1] }

	var n = $n(m, M)
	for(var i = 0;(i < n);i++) f()
}

var WORDS

function $words(up)
{
	ZeT.assert(ZeT.isi(up) && (up > 0))
	if(!WORDS) WORDS = JsX.include('./init-words')
	return $au(WORDS, $n(1, up)).join(' ')
}

function $a(a, n)
{
	function gen()
	{
		return a[Math.floor(Math.random() * a.length)]
	}

	if(ZeT.isu(n))
		return gen()

	ZeT.assert(ZeT.isn(n) && n > 0)
	for(var r = [], i = 0;(i < n);i++)
		r.push(gen())

	return r
}

/**
 * Returns n unique items of the array.
 */
function $au(a, n)
{
	ZeT.assert(ZeT.isa(a))
	ZeT.assert(ZeT.isi(n) && n > 0)
	if(a.length < n) n = a.length

	var r = [], ii = {}

	function is(i)
	{
		if(ii[i]) return false

		ii[i] = true
		r.push(a[i])

		return true
	}

	main: while(r.length < n)
	{
		var i = Math.floor(Math.random() * a.length)

		if(is(i)) continue

		for(var j = i + 1;(j < a.length);j++)
			if(is(j)) continue main

		for(j = 0;(j < i);j++)
			if(is(j)) continue main

		throw ZeT.ass()
	}

	return r
}

function $tags(tags, n)
{
	var res = []

	$times(n || 5, function()
	{
		var tag = $a(tags).uuid
		if(!ZeT.ii(res, tag))
			res.push(tag)
	})

	return res
}

function $bool(n)
{
	return Math.random() < (1 / ((n ||1) + 1))
}

function $date(n, at)
{
	var d = ZeT.isu(at)?(new Date()):
	  ZeT.isn(at)?(new Date()):(new Date(at.getTime()))

	d.setUTCHours(0, 0, 0, 0)
	n = $n(1, n || 7)
	d.setDate(d.getDate() + n)

	return d
}

function $dateTime(n, at)
{
	var d = ZeT.isu(at)?(new Date()):
	  ZeT.isn(at)?(new Date()):(new Date(at.getTime()))

	n = $n(1, n || 7)
	d.setDate(d.getDate() + n)

	return d
}

function $bytes(size)
{
	var b = ZeT.jarray('byte', size)
	var r = new java.util.Random()

	r.nextBytes(b)
	return b
}