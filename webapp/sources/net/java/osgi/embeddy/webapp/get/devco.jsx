var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function get()
{
	var ab = ZeT.bean('AuthBean')
	var lo = ZeT.asserts(ab.getLogin())
	var dv = Dbo.get(lo, 'Device')

	if(dv == null)
		return response.sendError(404)

	response.setContentType('application/json;charset=UTF-8')
	print(ZeT.o2s(process(dv, {})))
}

function process(dv, q)
{
	var dv2sc = schedulesMap(dv, q)
	var   scs = mappedSchedules(dv2sc)
	var files = schedulesFiles(scs)
	var docs  = documents(dv)

	return clean({
		device       : dv.uuid,
		schedulesMap : dv2sc,
		schedules    : scs,
		files        : files,
		documents    : docs
	})
}

function clean(res)
{
	ZeT.each(res.schedulesMap, function(sc)
	{
		delete sc.device
	})

	ZeT.each(res.schedules, function(sc)
	{
		delete sc.title
		delete sc.tags
	})

	ZeT.each(res.files, function(f)
	{
		delete f.tags
	})

	ZeT.each(res.documents, function(d)
	{
		delete d.tags
	})

	return res
}

function schedulesMap(dv, q)
{
	//HINT: device schedules are time-ordered!

	var  ts = new Date().getTime()
	var scs = Dbo.get(dv.uuid, 'DeviceSchedules')

	//?: {not found any schedules}
	if(!ZeT.isa(scs) || !scs.length)
		return []

	//~: find closest back time
	for(var xi, i = scs.length - 1;(i >= 0);i--)
		if(scs[i].ts <= ts){ xi = i; break }

	//?: {not found} return the first
	if(ZeT.isx(xi)) return [ scs[0] ]

	//~: return previous + next
	var res = [ scs[xi] ]

	if(xi + 1 < scs.length)
		res.push(scs[xi + 1])

	return res
}

function mappedSchedules(dv2sc)
{
	var scs = {}
	var res = []

	ZeT.each(dv2sc, function(x)
	{
		if(scs[x.schedule]) return
		scs[x.schedule] = Dbo.get(x.schedule, 'Schedule')
	})

	ZeT.each(scs, function(sc)
	{
		if(sc != null) res.push(sc)
	})

	return res
}

function schedulesFiles(scs)
{
	var fls = {}
	var res = []

	ZeT.each(scs, function(sc)
	{
		ZeT.each(sc.tasks, function(task)
		{
			ZeT.each(task.files, function(f)
			{
				if(fls[f.uuid]) return
				fls[f.uuid] = Dbo.get(f.uuid, 'MediaFile')
			})
		})
	})

	ZeT.each(fls, function(f)
	{
		if(f != null) res.push(f)
	})

	return res
}

function documents(dv)
{
	var docs = Dbo.get(dv.uuid, 'DeviceDocuments')
	if(!docs) return []

	ZeT.each(docs, function(uuid, i)
	{
		var doc = Dbo.get(uuid, 'Document')
		if(!doc) doc = { uuid: uuid, removed: true }
		docs[i] = doc
	})

	return docs
}