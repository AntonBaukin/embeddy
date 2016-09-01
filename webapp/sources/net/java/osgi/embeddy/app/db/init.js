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
	  ' having the default password \'password\'')

	Dbo.save({
		uuid: suid,
		type: 'AuthLogin',
		text: 'System',
		object: {
			system: true,
			indexPage: '/static/system/index.html',
			access: [ 'su' ],
			password: '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8'
	}})
}

var WORDS = ['the','name','very','through','and','just','form','much','great','think','you','say','that','help','low','was','line','for','before','turn','are','cause','with','same','mean','differ','his','move','they','right','boy','old','one','too','have','does','this','tell','from','sentence','set','had','three','want','hot','air','but','well','some','also','what','play','there','small','end','can','put','out','home','other','read','were','hand','all','port','your','large','when','spell','add','use','even','word','land','how','here','said','must','big','each','high','she','such','which','follow','act','their','why','time','ask','men','will','change','way','went','about','light','many','kind','then','off','them','need','would','house','write','picture','like','try','these','again','her','animal','long','point','make','mother','thing','world','see','near','him','build','two','self','has','earth','look','father','more','head','day','stand','could','own','page','come','should','did','country','found','sound','answer','school','most','grow','number','study','who','still','over','learn','know','plant','water','cover','than','food','call','sun','first','four','people','thought','may','let','down','keep','side','eye','been','never','now','last','find','door','any','between','new','city','work','tree','part','cross','take','since','get','hard','place','start','made','might','live','story','where','saw','after','far','back','sea','little','draw','only','left','round','late','man','run','year','came','while','show','press','every','close','good','night','real','give','life','our','few','under','stop','Rank','Word','Rank','Word','open','ten','seem','simple','together','several','next','vowel','white','toward','children','war','begin','lay','got','against','walk','pattern','example','slow','ease','center','paper','love','often','person','always','money','music','serve','those','appear','both','road','mark','map','book','science','letter','rule','until','govern','mile','pull','river','cold','car','notice','feet','voice','care','fall','second','power','group','town','carry','fine','took','certain','rain','fly','eat','unit','room','lead','friend','cry','began','dark','idea','machine','fish','note','mountain','wait','north','plan','once','figure','base','star','hear','box','horse','noun','cut','field','sure','rest','watch','correct','color','able','face','pound','wood','done','main','beauty','enough','drive','plain','stood','girl','contain','usual','front','young','teach','ready','week','above','final','ever','gave','red','green','list','though','quick','feel','develop','talk','sleep','bird','warm','soon','free','body','minute','dog','strong','family','special','direct','mind','pose','behind','leave','clear','song','tail','measure','produce','state','fact','product','street','black','inch','short','lot','numeral','nothing','class','course','wind','stay','question','wheel','happen','full','complete','force','ship','blue','area','object','half','decide','rock','surface','order','deep','fire','moon','south','island','problem','foot','piece','yet','told','busy','knew','test','pass','record','farm','boat','top','common','whole','gold','king','possible','size','plane','heard','age','best','dry','hour','wonder','better','laugh','true','thousand','during','ago','hundred','ran','check','remember','game','step','shape','early','yes','hold','hot','west','miss','ground','brought','interest','heat','reach','snow','fast','bed','five','bring','sing','sit','listen','perhaps','six','fill','table','east','travel','weight','less','language','morning','among']

var ADDRESSES = "[{\"building\":\"9730\",\"street\":\"Arcadia St.\",\"settlement\":\"North Canton\",\"province\":\"OH\",\"index\":\"44720\"},{\"building\":\"227\",\"street\":\"Tailwater Dr.\",\"settlement\":\"Catonsville\",\"province\":\"MD\",\"index\":\"21228\"},{\"building\":\"665\",\"street\":\"West Fairground St.\",\"settlement\":\"Bangor\",\"province\":\"ME\",\"index\":\"04401\"},{\"building\":\"385\",\"street\":\"Valley View Court\",\"settlement\":\"Howell\",\"province\":\"NJ\",\"index\":\"07731\"},{\"building\":\"5\",\"street\":\"Shub Farm St.\",\"settlement\":\"Springfield\",\"province\":\"PA\",\"index\":\"19064\"},{\"building\":\"997\",\"street\":\"Van Dyke Avenue\",\"settlement\":\"Linden\",\"province\":\"NJ\",\"index\":\"07036\"},{\"building\":\"4\",\"street\":\"Penn St.\",\"settlement\":\"Somerset\",\"province\":\"NJ\",\"index\":\"08873\"},{\"building\":\"7131\",\"street\":\"Halifax Dr.\",\"settlement\":\"Jamaica Plain\",\"province\":\"MA\",\"index\":\"02130\"},{\"building\":\"9718\",\"street\":\"West St.\",\"settlement\":\"Hyattsville\",\"province\":\"MD\",\"index\":\"20782\"},{\"building\":\"1\",\"street\":\"Squaw Creek Ave.\",\"settlement\":\"Chelsea\",\"province\":\"MA\",\"index\":\"02150\"},{\"building\":\"3\",\"street\":\"S. Pacific Street\",\"settlement\":\"Cranston\",\"province\":\"RI\",\"index\":\"02920\"},{\"building\":\"99\",\"street\":\"Sherwood Street\",\"settlement\":\"Owosso\",\"province\":\"MI\",\"index\":\"48867\"},{\"building\":\"94\",\"street\":\"Warren Ave.\",\"settlement\":\"East Orange\",\"province\":\"NJ\",\"index\":\"07017\"},{\"building\":\"33\",\"street\":\"Augusta Circle\",\"settlement\":\"Ada\",\"province\":\"OK\",\"index\":\"74820\"},{\"building\":\"7188\",\"street\":\"North Grandrose St.\",\"settlement\":\"Sun City\",\"province\":\"AZ\",\"index\":\"85351\"},{\"building\":\"260\",\"street\":\"Evergreen Ave.\",\"settlement\":\"Shelbyville\",\"province\":\"TN\",\"index\":\"37160\"},{\"building\":\"6\",\"street\":\"Vernon Street\",\"settlement\":\"Neptune\",\"province\":\"NJ\",\"index\":\"07753\"},{\"building\":\"170\",\"street\":\"Pendergast St.\",\"settlement\":\"Granger\",\"province\":\"IN\",\"index\":\"46530\"},{\"building\":\"8293\",\"street\":\"Amherst St.\",\"settlement\":\"Natchez\",\"province\":\"MS\",\"index\":\"39120\"},{\"building\":\"60\",\"street\":\"W. Brook Street\",\"settlement\":\"Camas\",\"province\":\"WA\",\"index\":\"98607\"},{\"building\":\"5\",\"street\":\"Center St.\",\"settlement\":\"Dalton\",\"province\":\"GA\",\"index\":\"30721\"},{\"building\":\"137\",\"street\":\"Bridgeton St.\",\"settlement\":\"Aiken\",\"province\":\"SC\",\"index\":\"29803\"},{\"building\":\"2\",\"street\":\"Thatcher Drive\",\"settlement\":\"Bellmore\",\"province\":\"NY\",\"index\":\"11710\"},{\"building\":\"7668\",\"street\":\"North Bridge St.\",\"settlement\":\"Gettysburg\",\"province\":\"PA\",\"index\":\"17325\"},{\"building\":\"400\",\"street\":\"South Vale Street\",\"settlement\":\"Santa Clara\",\"province\":\"CA\",\"index\":\"95050\"},{\"building\":\"97\",\"street\":\"West Pendergast Street\",\"settlement\":\"Hialeah\",\"province\":\"FL\",\"index\":\"33010\"},{\"building\":\"704\",\"street\":\"Gates Road\",\"settlement\":\"New Port Richey\",\"province\":\"FL\",\"index\":\"34653\"},{\"building\":\"74\",\"street\":\"Marconi Street\",\"settlement\":\"Naples\",\"province\":\"FL\",\"index\":\"34116\"},{\"building\":\"8490\",\"street\":\"South Whitemarsh Street\",\"settlement\":\"Maumee\",\"province\":\"OH\",\"index\":\"43537\"},{\"building\":\"352\",\"street\":\"Ashley Lane\",\"settlement\":\"Opa Locka\",\"province\":\"FL\",\"index\":\"33054\"},{\"building\":\"352\",\"street\":\"Glendale St.\",\"settlement\":\"Chelsea\",\"province\":\"MA\",\"index\":\"02150\"},{\"building\":\"634\",\"street\":\"West Cypress Drive\",\"settlement\":\"Atlantic City\",\"province\":\"NJ\",\"index\":\"08401\"},{\"building\":\"280\",\"street\":\"Leatherwood Street\",\"settlement\":\"Nazareth\",\"province\":\"PA\",\"index\":\"18064\"},{\"building\":\"30\",\"street\":\"Mill Street\",\"settlement\":\"Valdosta\",\"province\":\"GA\",\"index\":\"31601\"},{\"building\":\"240\",\"street\":\"Tailwater Circle\",\"settlement\":\"Titusville\",\"province\":\"FL\",\"index\":\"32780\"},{\"building\":\"92\",\"street\":\"Wood Street\",\"settlement\":\"Gainesville\",\"province\":\"VA\",\"index\":\"20155\"},{\"building\":\"8552\",\"street\":\"Shirley St.\",\"settlement\":\"Monroe\",\"province\":\"NY\",\"index\":\"10950\"},{\"building\":\"857\",\"street\":\"Hill Dr.\",\"settlement\":\"Depew\",\"province\":\"NY\",\"index\":\"14043\"},{\"building\":\"9301\",\"street\":\"NE. Branch Ave.\",\"settlement\":\"Muskogee\",\"province\":\"OK\",\"index\":\"74403\"},{\"building\":\"618\",\"street\":\"Mayflower Ave.\",\"settlement\":\"Noblesville\",\"province\":\"IN\",\"index\":\"46060\"},{\"building\":\"8713\",\"street\":\"Thompson Street\",\"settlement\":\"Mount Prospect\",\"province\":\"IL\",\"index\":\"60056\"},{\"building\":\"8\",\"street\":\"Trenton Dr.\",\"settlement\":\"Gurnee\",\"province\":\"IL\",\"index\":\"60031\"},{\"building\":\"91\",\"street\":\"Howard Drive\",\"settlement\":\"Lebanon\",\"province\":\"PA\",\"index\":\"17042\"},{\"building\":\"9965\",\"street\":\"North Edgemont Street\",\"settlement\":\"Harleysville\",\"province\":\"PA\",\"index\":\"19438\"},{\"building\":\"355\",\"street\":\"Walt Whitman Court\",\"settlement\":\"Greenfield\",\"province\":\"IN\",\"index\":\"46140\"},{\"building\":\"100\",\"street\":\"Marshall Street\",\"settlement\":\"Milford\",\"province\":\"MA\",\"index\":\"01757\"},{\"building\":\"7507\",\"street\":\"Golden Star Street\",\"settlement\":\"Encino\",\"province\":\"CA\",\"index\":\"91316\"},{\"building\":\"8392\",\"street\":\"Jackson Avenue\",\"settlement\":\"Phillipsburg\",\"province\":\"NJ\",\"index\":\"08865\"},{\"building\":\"2\",\"street\":\"Gulf Rd.\",\"settlement\":\"Victoria\",\"province\":\"TX\",\"index\":\"77904\"},{\"building\":\"613\",\"street\":\"Oakland Street\",\"settlement\":\"Westland\",\"province\":\"MI\",\"index\":\"48185\"},{\"building\":\"8779\",\"street\":\"Edgewood Circle\",\"settlement\":\"Asheville\",\"province\":\"NC\",\"index\":\"28803\"},{\"building\":\"673\",\"street\":\"Lake View Street\",\"settlement\":\"Hamtramck\",\"province\":\"MI\",\"index\":\"48212\"},{\"building\":\"8769\",\"street\":\"Water Street\",\"settlement\":\"Apple Valley\",\"province\":\"CA\",\"index\":\"92307\"},{\"building\":\"8941\",\"street\":\"Walnut Street\",\"settlement\":\"Hopkins\",\"province\":\"MN\",\"index\":\"55343\"},{\"building\":\"8075\",\"street\":\"Saxon Drive\",\"settlement\":\"Henderson\",\"province\":\"KY\",\"index\":\"42420\"},{\"building\":\"8011\",\"street\":\"Grandrose Dr.\",\"settlement\":\"Stuart\",\"province\":\"FL\",\"index\":\"34997\"},{\"building\":\"6\",\"street\":\"Union Court\",\"settlement\":\"Lake Villa\",\"province\":\"IL\",\"index\":\"60046\"},{\"building\":\"63\",\"street\":\"E. Olive Lane\",\"settlement\":\"Urbandale\",\"province\":\"IA\",\"index\":\"50322\"},{\"building\":\"9877\",\"street\":\"W. Court Lane\",\"settlement\":\"Woonsocket\",\"province\":\"RI\",\"index\":\"02895\"},{\"building\":\"65\",\"street\":\"San Carlos Ave.\",\"settlement\":\"Saint Cloud\",\"province\":\"MN\",\"index\":\"56301\"},{\"building\":\"876\",\"street\":\"Wood Drive\",\"settlement\":\"Oakland Gardens\",\"province\":\"NY\",\"index\":\"11364\"},{\"building\":\"28\",\"street\":\"S. Brook Court\",\"settlement\":\"Vineland\",\"province\":\"NJ\",\"index\":\"08360\"},{\"building\":\"7\",\"street\":\"North Market Ave.\",\"settlement\":\"Kingsport\",\"province\":\"TN\",\"index\":\"37660\"},{\"building\":\"67\",\"street\":\"East Ave.\",\"settlement\":\"Perth Amboy\",\"province\":\"NJ\",\"index\":\"08861\"},{\"building\":\"9019\",\"street\":\"North Newcastle Ave.\",\"settlement\":\"Asbury Park\",\"province\":\"NJ\",\"index\":\"07712\"},{\"building\":\"9841\",\"street\":\"Stillwater St.\",\"settlement\":\"Grand Rapids\",\"province\":\"MI\",\"index\":\"49503\"},{\"building\":\"9213\",\"street\":\"Jefferson St.\",\"settlement\":\"Peachtree City\",\"province\":\"GA\",\"index\":\"30269\"},{\"building\":\"49\",\"street\":\"Edgewater Drive\",\"settlement\":\"Logansport\",\"province\":\"IN\",\"index\":\"46947\"},{\"building\":\"7755\",\"street\":\"Lake Forest St.\",\"settlement\":\"Santa Clara\",\"province\":\"CA\",\"index\":\"95050\"},{\"building\":\"329\",\"street\":\"Old York Lane\",\"settlement\":\"Sykesville\",\"province\":\"MD\",\"index\":\"21784\"},{\"building\":\"175\",\"street\":\"Walnut Ave.\",\"settlement\":\"Apple Valley\",\"province\":\"CA\",\"index\":\"92307\"},{\"building\":\"9066\",\"street\":\"Indian Spring Drive\",\"settlement\":\"Bethpage\",\"province\":\"NY\",\"index\":\"11714\"},{\"building\":\"92\",\"street\":\"Newcastle Dr.\",\"settlement\":\"Toms River\",\"province\":\"NJ\",\"index\":\"08753\"},{\"building\":\"81\",\"street\":\"Pine Street\",\"settlement\":\"Fort Washington\",\"province\":\"MD\",\"index\":\"20744\"},{\"building\":\"611\",\"street\":\"Tanglewood Street\",\"settlement\":\"Maineville\",\"province\":\"OH\",\"index\":\"45039\"},{\"building\":\"215\",\"street\":\"E. Hill Field St.\",\"settlement\":\"Fort Lee\",\"province\":\"NJ\",\"index\":\"07024\"},{\"building\":\"55\",\"street\":\"Fairfield Court\",\"settlement\":\"Covington\",\"province\":\"GA\",\"index\":\"30014\"},{\"building\":\"68\",\"street\":\"Mayfair Ave.\",\"settlement\":\"Fredericksburg\",\"province\":\"VA\",\"index\":\"22405\"},{\"building\":\"8775\",\"street\":\"Sussex Ave.\",\"settlement\":\"North Kingstown\",\"province\":\"RI\",\"index\":\"02852\"},{\"building\":\"687\",\"street\":\"Rockaway St.\",\"settlement\":\"Coatesville\",\"province\":\"PA\",\"index\":\"19320\"},{\"building\":\"1\",\"street\":\"Court Street\",\"settlement\":\"Atwater\",\"province\":\"CA\",\"index\":\"95301\"},{\"building\":\"7929\",\"street\":\"Santa Clara Rd.\",\"settlement\":\"Clarkston\",\"province\":\"MI\",\"index\":\"48348\"},{\"building\":\"8335\",\"street\":\"South 2nd St.\",\"settlement\":\"Johnson City\",\"province\":\"TN\",\"index\":\"37601\"},{\"building\":\"8793\",\"street\":\"Roehampton Court\",\"settlement\":\"San Pablo\",\"province\":\"CA\",\"index\":\"94806\"},{\"building\":\"8005\",\"street\":\"San Pablo Dr.\",\"settlement\":\"Palm Bay\",\"province\":\"FL\",\"index\":\"32907\"},{\"building\":\"830\",\"street\":\"South Carriage St.\",\"settlement\":\"Suitland\",\"province\":\"MD\",\"index\":\"20746\"},{\"building\":\"904\",\"street\":\"Bear Hill Rd.\",\"settlement\":\"Saint Charles\",\"province\":\"IL\",\"index\":\"60174\"},{\"building\":\"43\",\"street\":\"Wilson Rd.\",\"settlement\":\"Fort Wayne\",\"province\":\"IN\",\"index\":\"46804\"},{\"building\":\"26\",\"street\":\"South Plumb Branch Drive\",\"settlement\":\"Baltimore\",\"province\":\"MD\",\"index\":\"21206\"},{\"building\":\"59\",\"street\":\"Sunbeam Rd.\",\"settlement\":\"Mount Pleasant\",\"province\":\"SC\",\"index\":\"29464\"},{\"building\":\"597\",\"street\":\"Sugar Rd.\",\"settlement\":\"Valparaiso\",\"province\":\"IN\",\"index\":\"46383\"},{\"building\":\"606\",\"street\":\"Argyle Road\",\"settlement\":\"Hartford\",\"province\":\"CT\",\"index\":\"06106\"},{\"building\":\"330\",\"street\":\"Thatcher Drive\",\"settlement\":\"Westminster\",\"province\":\"MD\",\"index\":\"21157\"},{\"building\":\"96\",\"street\":\"East Central Dr.\",\"settlement\":\"Tampa\",\"province\":\"FL\",\"index\":\"33604\"},{\"building\":\"37\",\"street\":\"Fawn Drive\",\"settlement\":\"Roswell\",\"province\":\"GA\",\"index\":\"30075\"},{\"building\":\"9614\",\"street\":\"W. Poplar Drive\",\"settlement\":\"Amsterdam\",\"province\":\"NY\",\"index\":\"12010\"},{\"building\":\"154\",\"street\":\"North Overlook Ave.\",\"settlement\":\"Mahopac\",\"province\":\"NY\",\"index\":\"10541\"},{\"building\":\"641\",\"street\":\"Overlook St.\",\"settlement\":\"Rapid City\",\"province\":\"SD\",\"index\":\"57701\"},{\"building\":\"65\",\"street\":\"Wall Drive\",\"settlement\":\"Riverdale\",\"province\":\"GA\",\"index\":\"30274\"},{\"building\":\"213\",\"street\":\"Mayfair St.\",\"settlement\":\"Hartselle\",\"province\":\"AL\",\"index\":\"35640\"}]"

function initTest()
{
	var domid = '128a11be-37a6-11e6-ac61-9e71128cae77'

	//?: {domain exists}
	if(Dbo.exists(domid))
		return ZeT.LU.info(LOG, 'found testing domain ', domid)

	//~: save the domain
	ZeT.LU.info(LOG, 'creating testing domain ', domid)
	Dbo.save({ uuid: domid, type: 'Domain', testing: true })

	//~: save the test user
	var usrid = genUser(domid)

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

function genUser(domid)
{
	var usrid = Dbo.uuid()

	Dbo.save({
		uuid: usrid,
		owner: domid,
		type: 'AuthLogin',
		text: 'tester@gmail.com',
		object: {
			access: [],
			password: '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8'
		}
	})

	Dbo.save({
		uuid: usrid,
		owner: domid,
		type: 'Person',
		object: {
			title: 'Testing User'
		}
	})

	ZeT.LU.info(LOG, 'created testing user tester@gmail.com')

	return usrid
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
	var result = [], addresses = ZeT.s2o(ADDRESSES)
	ADDRESSES = null //<-- free the memory

	result = $au(addresses, $n(3, 10))
	ZeT.each(result, function(a, i)
	{
		if(ZeT.isx(a.office) && $bool())
			a.office = '' + $n(1, 100)

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
				indexPage: '/get/devco.jsx'
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

function $words(up)
{
	ZeT.assert(ZeT.isi(up) && (up > 0))
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

function $bytes(size)
{
	var b = ZeT.jarray('byte', size)
	var r = new java.util.Random()

	r.nextBytes(b)
	return b
}