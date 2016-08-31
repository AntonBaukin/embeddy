var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')

function post()
{
	var ab = ZeT.bean('AuthBean')
	var dm = ZeT.asserts(ab.getDomain())

	//~: decode the object
	var  o = ZeT.s2o(JsX.body())
	if(!o) return response.setStatus(400)

	//~: load the tags
	var tags = Dbo.get(dm, 'Tags')
	var exst = !!tags
	if(!tags) tags = []

	//!: update the tags
	var p = process(tags, ZeT.asserta(o))

	//~: update | save the tags back
	Dbo[exst?'update':'save']({ uuid: dm, type: 'Tags', object: p.tags })

	response.setContentType('application/json;charset=UTF-8')
	print(ZeT.o2s(p))
}

function process(tags, tasks)
{
	var ownids = {}

	function update(task)
	{
		var tag = find(task.uuid)

		if(!ZeT.ises(task.title))
			tag.title = ZeTS.trim(task.title)

		if(ZeT.isb(task.removed))
			tag.removed = task.removed
	}

	function move(task)
	{
		//~: find the tag & remove it
		var tag = find(task.uuid)
		ZeTA.remove(tags, tag)

		//?: {push it back}
		if(ZeT.ises(task.next))
			return tags.push(tag)

		//~: find the next tag
		var next = find(task.next)
		next = tags.indexOf(next)
		ZeT.assert(next >= 0)

		//~: set it here
		tags.splice(next, 0, tag)
	}

	function add(task)
	{
		//sec: generate own uuid
		var tag = { uuid: Dbo.uuid(), removed: false,
			title: ZeT.asserts(task.title)
		}

		//~: memory (ext uuid -> own uuid)
		ownids[task.uuid] = tag.uuid

		//~: push to the tags
		tags.push(tag)
	}

	function find(uuid)
	{
		ZeT.asserts(uuid)
		var ouuid = ownids[uuid]
		if(!ouuid) ouuid = uuid

		for(var i = 0;(i < tags.length);i++)
			if(tags[i].uuid === ouuid)
				return tags[i]

		throw ZeT.ass('Tag ', uuid, ' is not found!')
	}

	//~: first, process the adds
	ZeT.each(tasks, function(task)
	{
		if(task.task == 'add') add(task)
	})

	//~: process else, adds as the moves
	ZeT.each(tasks, function(task)
	{
		switch(task.task)
		{
			case 'update':
				return update(task)
			case 'move': case 'add':
				return move(task)
			default:
				throw ZeT.ass('Unknown task! ', ZeT.o2s(task))
		}
	})

	return { tags: tags, ownids: ownids }
}