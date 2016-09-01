/*===============================================================+
 |                Application Proxy with Demo Data               |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var AppData = ZeT.singleInstance('App:Data:Proxy',
{
	STANDALONE       : false,

	WORDS            : ['the','name','very','through','and','just','form','much','great','think','you','say','that','help','low','was','line','for','before','turn','are','cause','with','same','mean','differ','his','move','they','right','boy','old','one','too','have','does','this','tell','from','sentence','set','had','three','want','hot','air','but','well','some','also','what','play','there','small','end','can','put','out','home','other','read','were','hand','all','port','your','large','when','spell','add','use','even','word','land','how','here','said','must','big','each','high','she','such','which','follow','act','their','why','time','ask','men','will','change','way','went','about','light','many','kind','then','off','them','need','would','house','write','picture','like','try','these','again','her','animal','long','point','make','mother','thing','world','see','near','him','build','two','self','has','earth','look','father','more','head','day','stand','could','own','page','come','should','did','country','found','sound','answer','school','most','grow','number','study','who','still','over','learn','know','plant','water','cover','than','food','call','sun','first','four','people','thought','may','let','down','keep','side','eye','been','never','now','last','find','door','any','between','new','city','work','tree','part','cross','take','since','get','hard','place','start','made','might','live','story','where','saw','after','far','back','sea','little','draw','only','left','round','late','man','run','year','came','while','show','press','every','close','good','night','real','give','life','our','few','under','stop','Rank','Word','Rank','Word','open','ten','seem','simple','together','several','next','vowel','white','toward','children','war','begin','lay','got','against','walk','pattern','example','slow','ease','center','paper','love','often','person','always','money','music','serve','those','appear','both','road','mark','map','book','science','letter','rule','until','govern','mile','pull','river','cold','car','notice','feet','voice','care','fall','second','power','group','town','carry','fine','took','certain','rain','fly','eat','unit','room','lead','friend','cry','began','dark','idea','machine','fish','note','mountain','wait','north','plan','once','figure','base','star','hear','box','horse','noun','cut','field','sure','rest','watch','correct','color','able','face','pound','wood','done','main','beauty','enough','drive','plain','stood','girl','contain','usual','front','young','teach','ready','week','above','final','ever','gave','red','green','list','though','quick','feel','develop','talk','sleep','bird','warm','soon','free','body','minute','dog','strong','family','special','direct','mind','pose','behind','leave','clear','song','tail','measure','produce','state','fact','product','street','black','inch','short','lot','numeral','nothing','class','course','wind','stay','question','wheel','happen','full','complete','force','ship','blue','area','object','half','decide','rock','surface','order','deep','fire','moon','south','island','problem','foot','piece','yet','told','busy','knew','test','pass','record','farm','boat','top','common','whole','gold','king','possible','size','plane','heard','age','best','dry','hour','wonder','better','laugh','true','thousand','during','ago','hundred','ran','check','remember','game','step','shape','early','yes','hold','hot','west','miss','ground','brought','interest','heat','reach','snow','fast','bed','five','bring','sing','sit','listen','perhaps','six','fill','table','east','travel','weight','less','language','morning','among'],

	ADDRESSES        : "[{\"building\":\"9730\",\"street\":\"Arcadia St.\",\"settlement\":\"North Canton\",\"province\":\"OH\",\"index\":\"44720\"},{\"building\":\"227\",\"street\":\"Tailwater Dr.\",\"settlement\":\"Catonsville\",\"province\":\"MD\",\"index\":\"21228\"},{\"building\":\"665\",\"street\":\"West Fairground St.\",\"settlement\":\"Bangor\",\"province\":\"ME\",\"index\":\"04401\"},{\"building\":\"385\",\"street\":\"Valley View Court\",\"settlement\":\"Howell\",\"province\":\"NJ\",\"index\":\"07731\"},{\"building\":\"5\",\"street\":\"Shub Farm St.\",\"settlement\":\"Springfield\",\"province\":\"PA\",\"index\":\"19064\"},{\"building\":\"997\",\"street\":\"Van Dyke Avenue\",\"settlement\":\"Linden\",\"province\":\"NJ\",\"index\":\"07036\"},{\"building\":\"4\",\"street\":\"Penn St.\",\"settlement\":\"Somerset\",\"province\":\"NJ\",\"index\":\"08873\"},{\"building\":\"7131\",\"street\":\"Halifax Dr.\",\"settlement\":\"Jamaica Plain\",\"province\":\"MA\",\"index\":\"02130\"},{\"building\":\"9718\",\"street\":\"West St.\",\"settlement\":\"Hyattsville\",\"province\":\"MD\",\"index\":\"20782\"},{\"building\":\"1\",\"street\":\"Squaw Creek Ave.\",\"settlement\":\"Chelsea\",\"province\":\"MA\",\"index\":\"02150\"},{\"building\":\"3\",\"street\":\"S. Pacific Street\",\"settlement\":\"Cranston\",\"province\":\"RI\",\"index\":\"02920\"},{\"building\":\"99\",\"street\":\"Sherwood Street\",\"settlement\":\"Owosso\",\"province\":\"MI\",\"index\":\"48867\"},{\"building\":\"94\",\"street\":\"Warren Ave.\",\"settlement\":\"East Orange\",\"province\":\"NJ\",\"index\":\"07017\"},{\"building\":\"33\",\"street\":\"Augusta Circle\",\"settlement\":\"Ada\",\"province\":\"OK\",\"index\":\"74820\"},{\"building\":\"7188\",\"street\":\"North Grandrose St.\",\"settlement\":\"Sun City\",\"province\":\"AZ\",\"index\":\"85351\"},{\"building\":\"260\",\"street\":\"Evergreen Ave.\",\"settlement\":\"Shelbyville\",\"province\":\"TN\",\"index\":\"37160\"},{\"building\":\"6\",\"street\":\"Vernon Street\",\"settlement\":\"Neptune\",\"province\":\"NJ\",\"index\":\"07753\"},{\"building\":\"170\",\"street\":\"Pendergast St.\",\"settlement\":\"Granger\",\"province\":\"IN\",\"index\":\"46530\"},{\"building\":\"8293\",\"street\":\"Amherst St.\",\"settlement\":\"Natchez\",\"province\":\"MS\",\"index\":\"39120\"},{\"building\":\"60\",\"street\":\"W. Brook Street\",\"settlement\":\"Camas\",\"province\":\"WA\",\"index\":\"98607\"},{\"building\":\"5\",\"street\":\"Center St.\",\"settlement\":\"Dalton\",\"province\":\"GA\",\"index\":\"30721\"},{\"building\":\"137\",\"street\":\"Bridgeton St.\",\"settlement\":\"Aiken\",\"province\":\"SC\",\"index\":\"29803\"},{\"building\":\"2\",\"street\":\"Thatcher Drive\",\"settlement\":\"Bellmore\",\"province\":\"NY\",\"index\":\"11710\"},{\"building\":\"7668\",\"street\":\"North Bridge St.\",\"settlement\":\"Gettysburg\",\"province\":\"PA\",\"index\":\"17325\"},{\"building\":\"400\",\"street\":\"South Vale Street\",\"settlement\":\"Santa Clara\",\"province\":\"CA\",\"index\":\"95050\"},{\"building\":\"97\",\"street\":\"West Pendergast Street\",\"settlement\":\"Hialeah\",\"province\":\"FL\",\"index\":\"33010\"},{\"building\":\"704\",\"street\":\"Gates Road\",\"settlement\":\"New Port Richey\",\"province\":\"FL\",\"index\":\"34653\"},{\"building\":\"74\",\"street\":\"Marconi Street\",\"settlement\":\"Naples\",\"province\":\"FL\",\"index\":\"34116\"},{\"building\":\"8490\",\"street\":\"South Whitemarsh Street\",\"settlement\":\"Maumee\",\"province\":\"OH\",\"index\":\"43537\"},{\"building\":\"352\",\"street\":\"Ashley Lane\",\"settlement\":\"Opa Locka\",\"province\":\"FL\",\"index\":\"33054\"},{\"building\":\"352\",\"street\":\"Glendale St.\",\"settlement\":\"Chelsea\",\"province\":\"MA\",\"index\":\"02150\"},{\"building\":\"634\",\"street\":\"West Cypress Drive\",\"settlement\":\"Atlantic City\",\"province\":\"NJ\",\"index\":\"08401\"},{\"building\":\"280\",\"street\":\"Leatherwood Street\",\"settlement\":\"Nazareth\",\"province\":\"PA\",\"index\":\"18064\"},{\"building\":\"30\",\"street\":\"Mill Street\",\"settlement\":\"Valdosta\",\"province\":\"GA\",\"index\":\"31601\"},{\"building\":\"240\",\"street\":\"Tailwater Circle\",\"settlement\":\"Titusville\",\"province\":\"FL\",\"index\":\"32780\"},{\"building\":\"92\",\"street\":\"Wood Street\",\"settlement\":\"Gainesville\",\"province\":\"VA\",\"index\":\"20155\"},{\"building\":\"8552\",\"street\":\"Shirley St.\",\"settlement\":\"Monroe\",\"province\":\"NY\",\"index\":\"10950\"},{\"building\":\"857\",\"street\":\"Hill Dr.\",\"settlement\":\"Depew\",\"province\":\"NY\",\"index\":\"14043\"},{\"building\":\"9301\",\"street\":\"NE. Branch Ave.\",\"settlement\":\"Muskogee\",\"province\":\"OK\",\"index\":\"74403\"},{\"building\":\"618\",\"street\":\"Mayflower Ave.\",\"settlement\":\"Noblesville\",\"province\":\"IN\",\"index\":\"46060\"},{\"building\":\"8713\",\"street\":\"Thompson Street\",\"settlement\":\"Mount Prospect\",\"province\":\"IL\",\"index\":\"60056\"},{\"building\":\"8\",\"street\":\"Trenton Dr.\",\"settlement\":\"Gurnee\",\"province\":\"IL\",\"index\":\"60031\"},{\"building\":\"91\",\"street\":\"Howard Drive\",\"settlement\":\"Lebanon\",\"province\":\"PA\",\"index\":\"17042\"},{\"building\":\"9965\",\"street\":\"North Edgemont Street\",\"settlement\":\"Harleysville\",\"province\":\"PA\",\"index\":\"19438\"},{\"building\":\"355\",\"street\":\"Walt Whitman Court\",\"settlement\":\"Greenfield\",\"province\":\"IN\",\"index\":\"46140\"},{\"building\":\"100\",\"street\":\"Marshall Street\",\"settlement\":\"Milford\",\"province\":\"MA\",\"index\":\"01757\"},{\"building\":\"7507\",\"street\":\"Golden Star Street\",\"settlement\":\"Encino\",\"province\":\"CA\",\"index\":\"91316\"},{\"building\":\"8392\",\"street\":\"Jackson Avenue\",\"settlement\":\"Phillipsburg\",\"province\":\"NJ\",\"index\":\"08865\"},{\"building\":\"2\",\"street\":\"Gulf Rd.\",\"settlement\":\"Victoria\",\"province\":\"TX\",\"index\":\"77904\"},{\"building\":\"613\",\"street\":\"Oakland Street\",\"settlement\":\"Westland\",\"province\":\"MI\",\"index\":\"48185\"},{\"building\":\"8779\",\"street\":\"Edgewood Circle\",\"settlement\":\"Asheville\",\"province\":\"NC\",\"index\":\"28803\"},{\"building\":\"673\",\"street\":\"Lake View Street\",\"settlement\":\"Hamtramck\",\"province\":\"MI\",\"index\":\"48212\"},{\"building\":\"8769\",\"street\":\"Water Street\",\"settlement\":\"Apple Valley\",\"province\":\"CA\",\"index\":\"92307\"},{\"building\":\"8941\",\"street\":\"Walnut Street\",\"settlement\":\"Hopkins\",\"province\":\"MN\",\"index\":\"55343\"},{\"building\":\"8075\",\"street\":\"Saxon Drive\",\"settlement\":\"Henderson\",\"province\":\"KY\",\"index\":\"42420\"},{\"building\":\"8011\",\"street\":\"Grandrose Dr.\",\"settlement\":\"Stuart\",\"province\":\"FL\",\"index\":\"34997\"},{\"building\":\"6\",\"street\":\"Union Court\",\"settlement\":\"Lake Villa\",\"province\":\"IL\",\"index\":\"60046\"},{\"building\":\"63\",\"street\":\"E. Olive Lane\",\"settlement\":\"Urbandale\",\"province\":\"IA\",\"index\":\"50322\"},{\"building\":\"9877\",\"street\":\"W. Court Lane\",\"settlement\":\"Woonsocket\",\"province\":\"RI\",\"index\":\"02895\"},{\"building\":\"65\",\"street\":\"San Carlos Ave.\",\"settlement\":\"Saint Cloud\",\"province\":\"MN\",\"index\":\"56301\"},{\"building\":\"876\",\"street\":\"Wood Drive\",\"settlement\":\"Oakland Gardens\",\"province\":\"NY\",\"index\":\"11364\"},{\"building\":\"28\",\"street\":\"S. Brook Court\",\"settlement\":\"Vineland\",\"province\":\"NJ\",\"index\":\"08360\"},{\"building\":\"7\",\"street\":\"North Market Ave.\",\"settlement\":\"Kingsport\",\"province\":\"TN\",\"index\":\"37660\"},{\"building\":\"67\",\"street\":\"East Ave.\",\"settlement\":\"Perth Amboy\",\"province\":\"NJ\",\"index\":\"08861\"},{\"building\":\"9019\",\"street\":\"North Newcastle Ave.\",\"settlement\":\"Asbury Park\",\"province\":\"NJ\",\"index\":\"07712\"},{\"building\":\"9841\",\"street\":\"Stillwater St.\",\"settlement\":\"Grand Rapids\",\"province\":\"MI\",\"index\":\"49503\"},{\"building\":\"9213\",\"street\":\"Jefferson St.\",\"settlement\":\"Peachtree City\",\"province\":\"GA\",\"index\":\"30269\"},{\"building\":\"49\",\"street\":\"Edgewater Drive\",\"settlement\":\"Logansport\",\"province\":\"IN\",\"index\":\"46947\"},{\"building\":\"7755\",\"street\":\"Lake Forest St.\",\"settlement\":\"Santa Clara\",\"province\":\"CA\",\"index\":\"95050\"},{\"building\":\"329\",\"street\":\"Old York Lane\",\"settlement\":\"Sykesville\",\"province\":\"MD\",\"index\":\"21784\"},{\"building\":\"175\",\"street\":\"Walnut Ave.\",\"settlement\":\"Apple Valley\",\"province\":\"CA\",\"index\":\"92307\"},{\"building\":\"9066\",\"street\":\"Indian Spring Drive\",\"settlement\":\"Bethpage\",\"province\":\"NY\",\"index\":\"11714\"},{\"building\":\"92\",\"street\":\"Newcastle Dr.\",\"settlement\":\"Toms River\",\"province\":\"NJ\",\"index\":\"08753\"},{\"building\":\"81\",\"street\":\"Pine Street\",\"settlement\":\"Fort Washington\",\"province\":\"MD\",\"index\":\"20744\"},{\"building\":\"611\",\"street\":\"Tanglewood Street\",\"settlement\":\"Maineville\",\"province\":\"OH\",\"index\":\"45039\"},{\"building\":\"215\",\"street\":\"E. Hill Field St.\",\"settlement\":\"Fort Lee\",\"province\":\"NJ\",\"index\":\"07024\"},{\"building\":\"55\",\"street\":\"Fairfield Court\",\"settlement\":\"Covington\",\"province\":\"GA\",\"index\":\"30014\"},{\"building\":\"68\",\"street\":\"Mayfair Ave.\",\"settlement\":\"Fredericksburg\",\"province\":\"VA\",\"index\":\"22405\"},{\"building\":\"8775\",\"street\":\"Sussex Ave.\",\"settlement\":\"North Kingstown\",\"province\":\"RI\",\"index\":\"02852\"},{\"building\":\"687\",\"street\":\"Rockaway St.\",\"settlement\":\"Coatesville\",\"province\":\"PA\",\"index\":\"19320\"},{\"building\":\"1\",\"street\":\"Court Street\",\"settlement\":\"Atwater\",\"province\":\"CA\",\"index\":\"95301\"},{\"building\":\"7929\",\"street\":\"Santa Clara Rd.\",\"settlement\":\"Clarkston\",\"province\":\"MI\",\"index\":\"48348\"},{\"building\":\"8335\",\"street\":\"South 2nd St.\",\"settlement\":\"Johnson City\",\"province\":\"TN\",\"index\":\"37601\"},{\"building\":\"8793\",\"street\":\"Roehampton Court\",\"settlement\":\"San Pablo\",\"province\":\"CA\",\"index\":\"94806\"},{\"building\":\"8005\",\"street\":\"San Pablo Dr.\",\"settlement\":\"Palm Bay\",\"province\":\"FL\",\"index\":\"32907\"},{\"building\":\"830\",\"street\":\"South Carriage St.\",\"settlement\":\"Suitland\",\"province\":\"MD\",\"index\":\"20746\"},{\"building\":\"904\",\"street\":\"Bear Hill Rd.\",\"settlement\":\"Saint Charles\",\"province\":\"IL\",\"index\":\"60174\"},{\"building\":\"43\",\"street\":\"Wilson Rd.\",\"settlement\":\"Fort Wayne\",\"province\":\"IN\",\"index\":\"46804\"},{\"building\":\"26\",\"street\":\"South Plumb Branch Drive\",\"settlement\":\"Baltimore\",\"province\":\"MD\",\"index\":\"21206\"},{\"building\":\"59\",\"street\":\"Sunbeam Rd.\",\"settlement\":\"Mount Pleasant\",\"province\":\"SC\",\"index\":\"29464\"},{\"building\":\"597\",\"street\":\"Sugar Rd.\",\"settlement\":\"Valparaiso\",\"province\":\"IN\",\"index\":\"46383\"},{\"building\":\"606\",\"street\":\"Argyle Road\",\"settlement\":\"Hartford\",\"province\":\"CT\",\"index\":\"06106\"},{\"building\":\"330\",\"street\":\"Thatcher Drive\",\"settlement\":\"Westminster\",\"province\":\"MD\",\"index\":\"21157\"},{\"building\":\"96\",\"street\":\"East Central Dr.\",\"settlement\":\"Tampa\",\"province\":\"FL\",\"index\":\"33604\"},{\"building\":\"37\",\"street\":\"Fawn Drive\",\"settlement\":\"Roswell\",\"province\":\"GA\",\"index\":\"30075\"},{\"building\":\"9614\",\"street\":\"W. Poplar Drive\",\"settlement\":\"Amsterdam\",\"province\":\"NY\",\"index\":\"12010\"},{\"building\":\"154\",\"street\":\"North Overlook Ave.\",\"settlement\":\"Mahopac\",\"province\":\"NY\",\"index\":\"10541\"},{\"building\":\"641\",\"street\":\"Overlook St.\",\"settlement\":\"Rapid City\",\"province\":\"SD\",\"index\":\"57701\"},{\"building\":\"65\",\"street\":\"Wall Drive\",\"settlement\":\"Riverdale\",\"province\":\"GA\",\"index\":\"30274\"},{\"building\":\"213\",\"street\":\"Mayfair St.\",\"settlement\":\"Hartselle\",\"province\":\"AL\",\"index\":\"35640\"}]",

	/**
	 * Creates temporary client-side UUID-like object.
	 * Server replaces it with own values.
	 */
	uuid             : ZeT.scope(function()
	{
		//~: template
		var XY = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'

		//~: timestamp
		var ts = new Date().getTime()
		try{ ts += performance.now() }catch(ignore){}

		//~: generator
		function xy(c)
		{
			var r = (ts + Math.random()*16)%16 | 0
			return ((c == 'x')?(r):(r&0x3|0x8)).toString(16)
		}

		return function()
		{
			return XY.replace(/[xy]/g, xy)
		}
	}),

	get              : function(key, ps, f)
	{
		//ZeT.log('App Data (', key, ZeT.iso(ps)?(ps):(''), ')')

		if(arguments.length == 2)
			{ f = ps; ps = undefined }

		ZeT.asserts(key)
		ZeT.assertf(f)
		ZeT.assert(ZeT.isx(ps) || ZeT.isox(ps))

		function proxy()
		{
			ZeT.timeout(100, f, this, [ v ])
			return false
		}

		function get(url)
		{
			jQuery.get(url).done(function(o)
			{
				f.call(this, o, key, ps)
			})
		}

		var m = AppData['$get_' + key]
		if(!ZeT.isf(m))
			throw ZeT.ass('No data exists by the key [', key, ']!')

		if(AppData.STANDALONE)
		{
			var o = m.call(this, ps)
			ZeT.timeout(100, f, this, [ o, key, ps ])
		}
		else
			jQuery.get('/get/' + key + '.jsx', ps).done(
				function(o){ f.call(this, o, key, ps) })
	},

	updateTags       : function(tasks, f)
	{
		ZeT.asserta(tasks)
		ZeT.assertf(f)

		AppData.$post('/set/tags.jsx', tasks, f)
	},

	updateAddress    : function(o, f)
	{
		ZeT.assert(!ZeT.ises(o.uuid) || o.create === true)
		AppData.$post('/set/address.jsx', o, f)
	},

	uploadFile       : function(opts)
	{
		ZeT.assert(ZeT.iso(opts))
		ZeT.asserts(opts.url)

		ZeT.assertf(opts.onSubmit)
		ZeT.assertf(opts.onProgress)
		ZeT.assertf(opts.onComplete)
		ZeT.assertf(opts.onError)

		ZeT.assertn(opts.input)
		ZeT.assert(opts.input.length === 1)

		opts.input.liteUploader({
			script: opts.url,
			singleFileUploads: true
		}).
			on('lu:errors',   opts.onError).
			on('lu:fail',     opts.onError).
			on('lu:success',  opts.onComplete).
			on('lu:progress', opts.onProgress)

		opts.input.on('change', function(e)
		{
			var lu = $(this).data('liteUploader')

			lu.options.script = ZeTS.cat(
			  opts.url, '?uuid=', ZeT.undelay(opts, 'uuid'),
			  '&rename=', ZeT.undelay(opts, 'rename')
			)

			if(false === opts.onSubmit.call(this, e, lu))
			{
				e.stopPropagation()
				e.preventDefault()
				return
			}

			lu.startUpload()
		})
	},

	uploadFiles      : function(opts)
	{
		ZeT.assert(ZeT.iso(opts))
		ZeT.asserts(opts.url)

		ZeT.assertf(opts.onSubmit)
		ZeT.assertf(opts.onProgress)
		ZeT.assertf(opts.onComplete)
		ZeT.assertf(opts.onError)
		ZeT.assertf(opts.onNext)

		ZeT.assertn(opts.input)
		ZeT.assert(opts.input.length === 1)

		opts.input.liteUploader({
			script: opts.url,
			singleFileUploads: true
		}).
			on('lu:errors',   opts.onError).
			on('lu:fail',     opts.onError).
			on('lu:success',  opts.onComplete).
			on('lu:progress', opts.onProgress).
			on('lu:before',   opts.onNext)

		opts.input.on('change', function(e)
		{
			var lu = $(this).data('liteUploader')

			if(false === opts.onSubmit.call(this, e, lu))
			{
				e.stopPropagation()
				e.preventDefault()
				return
			}

			lu.startUpload()
		})
	},

	updateFile       : function(o, f)
	{
		ZeT.asserts(o.uuid)
		AppData.$post('/set/media.jsx', o, f)
	},

	addDevs          : function(n, f)
	{
		ZeT.assert(ZeT.isi(n) && n > 0)
		ZeT.assertf(f)

		AppData.$post('/set/addevs.jsx', { number: n }, f)
	},

	setDevSchs       : function(changes, f)
	{
		ZeT.assertf(f)
		ZeT.asserta(changes)
		ZeT.each(changes, function(c)
		{
			ZeT.asserts(c.device)

			ZeT.assert(
			  ZeT.isa(c.assigned) ||
			  ZeT.isa(c.removed)  ||
			  ZeT.isa(c.replaced)
			)
		})

		AppData.$post('/set/devschs.jsx', changes, f)
	},

	createSch        : function(model, f)
	{
		ZeT.assert(ZeT.iso(model))
		ZeT.assertf(f)

		AppData.$post('/set/schadd.jsx', model, f)
	},

	updateSch        : function(o, f)
	{
		ZeT.asserts(o.uuid)
		AppData.$post('/set/schedule.jsx', o, f)
	},

	updateDoc        : function(o, f)
	{
		ZeT.asserts(o.uuid)
		AppData.$post('/set/doc.jsx', o, f)
	},

	setDevDocs       : function(uuids, selected, f)
	{
		if(ZeT.iss(uuids)) uuids = [ uuids ]

		ZeT.asserta(uuids)
		ZeT.assert(ZeT.isa(selected))
		ZeT.assertf(f)

		AppData.$post('/set/devdocs.jsx',
		  { devices: uuids, selected: selected }, f)
	},

	genDevPass       : function(uuid, f)
	{
		ZeT.asserts(uuid)
		ZeT.assertf(f)

		AppData.$post('/set/devpass.jsx', { uuid: uuid }, f)
	},

	updateDev        : function(o, f)
	{
		if(ZeT.iso(o)) ZeT.asserts(o.uuid); else
			ZeT.each(ZeT.asserta(o), function(x){ ZeT.asserts(x.uuid) })

		AppData.$post('/set/device.jsx', o, f)
	},

	$post            : function(url, o, f)
	{
		ZeT.asserts(url)
		ZeT.assert(ZeT.iso(o) || ZeT.isa(o))
		ZeT.assertf(f)

		var x = {
			url         : url,
			type        : 'POST',
			data        : ZeT.o2s(o),
			contentType : 'application/json'
		}

		jQuery.ajax(x).always(f)
	},

	$get_tags        : function()
	{
		if(AppData._tags)
			return ZeT.deepClone(AppData._tags)

		AppData._tags = []
		AppData.$times(20, function()
		{
			AppData._tags.push({
				uuid: AppData.uuid(),
				title: AppData.$words(5),
				removed: AppData.$bool(4)
			})
		})

		return ZeT.deepClone(AppData._tags)
	},

	$get_addresses   : function()
	{
		if(AppData._addresses)
			return ZeT.deepClone(AppData._addresses)

		AppData._addresses = []
		var addresses = ZeT.s2o(AppData.ADDRESSES)
		delete AppData.ADDRESSES

		AppData._addresses = AppData.$au(addresses, AppData.$n(3, 10))
		ZeT.each(AppData._addresses, function(a, i)
		{
			if(ZeT.isx(a.office) && AppData.$bool())
				a.office = '' + AppData.$n(1, 100)

			AppData._addresses[i] = ZeT.extend({
				uuid: AppData.uuid(),
				removed: AppData.$bool(4),
				index: AppData.$a('0123456789', 6).join('')
			}, a)
		})

		return ZeT.deepClone(AppData._addresses)
	},

	$get_devices     : function()
	{
		if(AppData._devices)
			return ZeT.deepClone(AppData._devices)

		var addresses = AppData.$get_addresses()

		AppData._devices = []
		AppData.$times(20, function()
		{
			AppData._devices.push({
				uuid: AppData.uuid(),
				removed: AppData.$bool(5),
				title: AppData.$words(3),
				address: AppData.$a(addresses).uuid,
				tags: AppData.$tags()
			})
		})

		return ZeT.deepClone(AppData._devices)
	},

	$get_devpass     : function(ps)
	{
		ZeT.assert(ZeT.iso(ps))
		ZeT.asserts(ps.uuid)

		//~: secret session key as 40 hex digits of SHA-1
		var s = AppLogin.testToken().skey.toString()

		//~: random password as a number
		var p = AppData.$a('0123456789', 7).join('')

		//~: pad with random hex digits
		var x = p + AppData.$a('abcdef', s.length - p.length).join('')

		//~: xor with session key
		var y = AppLogin.xor(s, x)

		return { uuid: ps.uuid, secret: y }
	},

	$get_media       : function()
	{
		if(AppData._files)
			return ZeT.deepClone(AppData._files)

		AppData._files = []
		AppData.$times(10, 20, function()
		{
			var mime, ext, len

			if(AppData.$bool(5))
			{
				mime = 'image/jpeg'
				ext  = 'jpg'
				len  = AppData.$n(10240, 102400)
			}
			else
			{
				mime = 'video/mp4'
				ext  = 'mp4'
				len  = AppData.$n(102400, 1024000)
			}

			AppData._files.push({
				uuid: AppData.uuid(),
				removed: AppData.$bool(5),
				name: AppData.$words(3),
				mime: mime,
				ext: ext,
				length: len,
				time: new Date().toISOString(),
				sha1: AppData.$sha1(),
				tags: AppData.$tags()
			})
		})

		return ZeT.deepClone(AppData._files)
	},

	$get_schedules   : function()
	{
		if(AppData._schedules)
			return ZeT.deepClone(AppData._schedules)

		var files = AppData.$get_media()

		function taskFiles(x)
		{
			x.files = []

			AppData.$times(5, function()
			{
				var f = AppData.$a(files)
				var y = { uuid: f.uuid }

				if(ZeTS.starts(f.mime, 'video'))
					y.repeat = AppData.$n(1, 5)
				else
					y.duration = 1000 * 60 * AppData.$n(5, 10)

				x.files.push(y)
			})
		}

		function task0of1(x)
		{}

		function task0ofN(x)
		{}

		function taskIofN(x)
		{
			var p = AppData.$n(0, 4)

			if(p > 3)
				x.duration = 1000 * 60 * AppData.$n(30, 180)
			else if(p > 0)
				x.repeat = AppData.$n(1, 3)
		}

		function schedule(n)
		{
			n = AppData.$n(1, n)

			var times = [ 0 ]
			while(times.length < n)
			{
				var t = AppData.$n(1, 24 * 60)
				if(!ZeT.ii(times, t)) times.push(t)
			}

			times.sort(function(a, b){ return a - b })

			var res = []
			for(var i = 0;(i < n);i++)
			{
				var x = {
					time: times[i] * 60000,
					strict: AppData.$bool(4)
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

		AppData._schedules = []
		AppData.$times(5, 10, function()
		{
			AppData._schedules.push({
				uuid: AppData.uuid(),
				removed: AppData.$bool(5),
				title: AppData.$words(5),
				tags: AppData.$tags(),
				tasks: schedule(AppData.$bool()?(1):(7))
			})
		})

		return ZeT.deepClone(AppData._schedules)
	},

	$get_devschs     : function(ps)
	{
		ZeT.assert(ZeT.iso(ps))
		ZeT.asserts(ps.uuid)

		if(AppData._devschs && AppData._devschs[ps.uuid])
			return ZeT.deepClone(AppData._devschs[ps.uuid])

		var devs = AppData.$get_devices()
		var schs = AppData.$get_schedules()
		var dscs = []

		if(!AppData._devschs) AppData._devschs = {}
		AppData._devschs[ps.uuid] = dscs

		var t0 = AppData.$date(-14)

		AppData.$times(10, function()
		{
			var at = t0
			t0 = AppData.$date(5, t0)

			dscs.push({
				at: at.toISOString(),
				ts: at.getTime(),
				device: ps.uuid,
				schedule: AppData.$a(schs).uuid
			})
		})

		return ZeT.deepClone(dscs)
	},

	$get_devdocs     : function(ps)
	{
		ZeT.assert(ZeT.iso(ps))
		ZeT.asserts(ps.uuid)

		if(AppData._devdocs && AppData._devdocs[ps.uuid])
			return ZeT.deepClone(AppData._devdocs[ps.uuid])

		var devs = AppData.$get_devices()
		var docs = AppData.$get_docs()
		var dvds = []

		if(!AppData._devdocs) AppData._devdocs = {}
		AppData._devdocs[ps.uuid] = dvds =
			AppData.$au(docs, AppData.$n(1, 4))

		for(var i = 0;(i < dvds.length);i++)
			dvds[i] = dvds[i].uuid

		return ZeT.deepClone(dvds)
	},

	$get_docs        : function()
	{
		if(AppData._docs)
			return ZeT.deepClone(AppData._docs)

		AppData._docs = []
		AppData.$times(4, 10, function()
		{
			var ext = AppData.$a([ '.xls', '.xml', '.json' ])
			var len = AppData.$n(512, 10240)
			var nam = AppData.$words(3).split(' ').join('_')

			AppData._docs.push({
				uuid: AppData.uuid(),
				removed: AppData.$bool(5),
				name: nam + ext,
				length: len,
				date: AppData.$date().toISOString(),
				sha1: AppData.$sha1(),
				tags: AppData.$tags()
			})
		})

		return ZeT.deepClone(AppData._docs)
	},

	$tags            : function(n)
	{
		var tags = AppData.$get_tags()
		var  res = []

		AppData.$times(n || 5, function()
		{
			var tag = AppData.$a(tags).uuid
			if(!ZeT.ii(res, tag))
				res.push(tag)
		})

		return res
	},

	$n               : function(m, M)
	{
		return m + Math.floor(Math.random() * (1 + M - m))
	},

	$times           : function(/* m, [ M, ] f */)
	{
		var m, M, f, a = arguments

		if(a.length == 3) { m = a[0]; M = a[1]; f = a[2] }
		else { m = 1; M = a[0]; f = a[1] }

		var n = AppData.$n(m, M)
		for(var i = 0;(i < n);i++) f()
	},

	$words           : function(up)
	{
		return AppData.$au(AppData.WORDS, AppData.$n(1, up)).join(' ')
	},

	$date            : function(n, at)
	{
		var d = ZeT.isu(at)?(new Date()):
		  ZeT.isn(at)?(new Date()):(new Date(at.getTime()))

		d.setUTCHours(0, 0, 0, 0)
		n = AppData.$n(1, n || 7)
		d.setDate(d.getDate() + n)

		return d
	},

	$sha1            : function()
	{
		var h = '0123456789ABCDEF'
		var s = new Array(40)

		for(var i = 0;(i < 40);i++)
			s[i] = AppData.$a(h)
		return s.join('')
	},

	$a               : function(a, n)
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
	},

	/**
	 * Returns n unique items of the array.
	 */
	$au              : function(a, n)
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
	},

	$bool            : function(n)
	{
		return Math.random() < (1 / ((n ||1) + 1))
	}
})