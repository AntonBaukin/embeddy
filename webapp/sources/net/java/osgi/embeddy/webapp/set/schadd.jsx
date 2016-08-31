var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function post()
{
	var ab = ZeT.bean('AuthBean')
	var dm = ZeT.asserts(ab.getDomain())

	//~: decode the object
	var sc = ZeT.s2o(JsX.body())
	if(!sc) return response.setStatus(400)

	//~: work context
	var mem = { domain: dm }

	//~: load the tags
	loadTags(mem)

	//~: create the schedule from the model
	sc = create(mem, sc)

	//~: save to the database
	Dbo.save({
		uuid: sc.uuid,
		owner: dm,
		type: 'Schedule',
		object: sc
	})

	response.setContentType('application/json;charset=UTF-8')
	print(ZeT.o2s(sc))
}

function loadTags(mem)
{
	var tags = Dbo.get(mem.domain, 'Tags') || []

	mem.tags = {}
	ZeT.each(tags, function(t){ mem.tags[t.uuid] = t})

	return mem.tags
}

function assertTags(mem, tags)
{
	ZeT.assert(ZeT.isa(tags))

	ZeT.each(tags, function(uuid)
	{
		ZeT.assertn(mem.tags[uuid])
	})

	return tags
}

function create(mem, o)
{
	var sc = { uuid: Dbo.uuid() }

	//=: title
	sc.title = ZeT.asserts(o.title)

	//~: process the tasks
	ZeT.asserta(o.tasks)
	sc.tasks = mem.tasks = []
	ZeT.each(o.tasks, ZeT.fbind(task, this, mem))

	//=: tags
	sc.tags = assertTags(mem, o.tags || [])

	return sc
}

function task(mem, o)
{
	var task = {}

	if(ZeT.isu(mem.lastTaskTime))
		mem.lastTaskTime = -1

	//=: task time
	ZeT.assert(ZeT.isi(o.time))
	ZeT.assert(o.time >= 0)
	ZeT.assert(o.time < 24 * 60 * 60 * 1000)
	ZeT.assert(o.time > mem.lastTaskTime)
	mem.lastTaskTime = task.time = o.time

	//=: repeat
	if(!ZeT.isx(o.repeat))
	{
		ZeT.assert(ZeT.isi(o.repeat))
		ZeT.assert(o.repeat > 0)
		task.repeat = o.repeat
	}

	//=: duration
	if(!ZeT.isx(o.duration))
	{
		ZeT.assert(ZeT.isi(o.duration))
		ZeT.assert(o.duration > 0)
		ZeT.assert(o.duration < 24 * 60 * 60 * 1000)

		task.duration = o.duration
	}

	//~: process the files
	ZeT.asserta(o.files)
	task.files = mem.files = []
	ZeT.each(o.files, ZeT.fbind(file, this, mem))

	//~: save & return
	mem.tasks.push(task)
	return task
}

function loadFile(mem, uuid)
{
	//~: lookup in the cache
	if(!mem.fileCache) mem.fileCache = {}
	if(mem.fileCache[uuid]) return mem.fileCache[uuid]

	//~: load it
	var o = {}
	ZeT.assert(Dbo.load(uuid, 'MediaFile', o))

	//sec: schedule of same domain
	ZeT.assert(mem.domain === o.owner)

	//~: put to the cache
	return mem.fileCache[uuid] = o.object
}

function mediaType(file)
{
	if(ZeT.ises(file.mime))
		return

	if(ZeTS.starts(file.mime, 'video'))
		return 'video'

	if(ZeTS.starts(file.mime, 'image'))
		return 'image'
}

function file(mem, o)
{
	var file = {}

	//~: load the file
	ZeT.asserts(o.uuid)
	var f = loadFile(mem, o.uuid)

	//=: file (check passed)
	file.uuid = o.uuid

	//=: repeat
	if(!ZeT.isx(o.repeat))
	{
		ZeT.assert(ZeT.isi(o.repeat))
		ZeT.assert(o.repeat > 0)

		if(o.repeat != 1)
			file.repeat = o.repeat
	}

	//=: duration
	if(!ZeT.isx(o.duration))
	{
		ZeT.assert(ZeT.isi(o.duration))
		ZeT.assert(o.duration > 0)
		ZeT.assert(o.duration < 24 * 60 * 60 * 1000)

		file.duration = o.duration
	}

	//?: {has no duration for images}
	ZeT.assert(file.duration || mediaType(f) != 'image')

	//~: save & return
	mem.files.push(file)
	return file
}