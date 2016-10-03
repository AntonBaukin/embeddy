var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function post()
{
	var ab = ZeT.bean('AuthBean')
	var dm = ZeT.asserts(ab.getDomain())

	//~: decode the object
	var  a = ZeT.s2o(JsX.body())
	if(!ZeT.isa(a))
		return response.setStatus(400)

	//~: times & schedules mem
	var mem = { domain: dm }

	//~: process each record
	ZeT.each(a, function(o)
	{
		process(mem, o)
	})
}

function process(mem, o)
{
	ZeT.asserts(o.device)

	//~: load the device
	var dev = {}
	if(!Dbo.load(o.device, 'Device', dev))
		return response.setStatus(404)

	//sec: {wrong domain}
	ZeT.assert(dev.owner === mem.domain)

	//=: device
	mem.dev = dev

	//~: load existing schedules
	mem.d2s = mem.loaded = Dbo.get(o.device, 'DeviceSchedules')
	if(!mem.d2s) mem.d2s = []

	//~: map the times
	mapTimes(mem)

	//~: assign new schedules
	if(ZeT.isa(o.assigned))
		assign(mem, o.assigned)

	//~: replace existing schedules
	if(ZeT.isa(o.replaced))
		replace(mem, o.replaced)

	//~: remove the schedules
	if(ZeT.isa(o.removed))
		remove(mem, o.removed)

	//~: collect the times back
	var times = new Array(mem.times.size())
	ZeT.each(mem.times.values(), function(t, i){ times[i] = t })

	if(mem.loaded) //?: {loaded}
		Dbo.update(o.device, 'DeviceSchedules', times)
	else
		Dbo.save({
			uuid: dev.uuid,
			owner: mem.domain,
			type: 'DeviceSchedules',
			object: times
		})
}

function mapTimes(mem)
{
	mem.times = new java.util.TreeMap()
	ZeT.each(mem.d2s, function(x)
	{
		ZeT.assert(ZeT.isn(x.ts))
		mem.times.put(x.ts.longValue(), x)
	})
}

function loadSchedule(mem, uuid)
{
	//~: lookup in the cache
	if(!mem.schs) mem.schs = {}
	if(mem.schs[uuid]) return mem.schs[uuid]

	//~: load it
	var o = {}
	ZeT.assert(Dbo.load(uuid, 'Schedule', o))

	//sec: schedule of same domain
	ZeT.assert(mem.domain === o.owner)

	//~: put to the cache
	return mem.schs[uuid] = o.object
}

function assign(mem, recs, checker)
{
	if(!checker) checker = function(ts, to)
	{
		//?: {found it} not an assignment
		return ZeT.isx(to)
	}

	ZeT.each(recs, function(rec)
	{
		ZeT.asserts(rec.uuid)

		var ts = rec.ts.longValue()
		var to = mem.times.get(ts)

		//?: {check failed}
		if(!checker(ts, to, rec)) return

		//~: create a new record
		to = { ts: ts, device: mem.dev.uuid, schedule: rec.uuid }

		//~: test-load the schedule
		loadSchedule(mem, rec.uuid)

		//~: at-date
		var d = new Date(0+ts)
		d.setUTCHours(0, 0, 0, 0)
		to.at = d.toISOString()

		//!: put tne new record
		mem.times.put(ts, to)
	})
}

function replace(mem, recs)
{
	assign(mem, recs, function(ts, to, rec)
	{
		ZeT.asserts(rec.olduuid)

		//?: {replacing not an obsolete record}
		return !ZeT.isx(to) && (to.schedule == rec.olduuid)
	})
}

function remove(mem, recs)
{
	ZeT.each(recs, function(rec)
	{
		ZeT.asserts(rec.uuid)

		var ts = rec.ts.longValue()
		var to = mem.times.get(ts)

		//?: {removing obsolete record}
		if(!to || (to.schedule != rec.uuid)) return

		//!: remove from the times
		mem.times.remove(ts)
	})
}