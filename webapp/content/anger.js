/*===============================================================+
 |                Event Driven Angular Directives                |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

ZeT.scope(angular.module('anger', []), function(anger)
{
	function ag(name)
	{
		return 'ag' + Lo.upperFirst(
		  Lo.camelCase(ZeT.asserts(name)))
	}

	var CMD_SYMBOLS = '!?{'

	function cmdSym(s)
	{
		var x = ZeTS.first(ZeT.asserts(s))
		return ZeT.ii(CMD_SYMBOLS, x)?(x):(undefined)
	}

	function cmdArg(s)
	{
		var x = ZeTS.first(ZeT.asserts(s))
		return !ZeT.ii(CMD_SYMBOLS, x)?(s):(s.substring(1))
	}

	function cmdCall(s, f)
	{
		ZeT.asserts(s)
		ZeT.assertf(f)

		return function()
		{
			var args = ZeT.a(arguments)
			args.unshift(cmdSym(s))
			return f.apply(this, args)
		}
	}

	function parseAttrEvents(events, scope, f)
	{
		var self = this

		ZeT.asserts(events)
		ZeT.assertn(scope)
		ZeT.assertf(f)

		//?: {event is an object}
		if(events.charAt(0) == '{')
		{
			events = scope.$eval(events)
			ZeT.assert(ZeT.isox(events))

			ZeT.each(events, function(o, s)
			{
				f.call(self, [ s, o ])
			})

			return
		}

		//~: iterate over regular string
		ZeTS.each(events, function(s)
		{
			f.call(self, s)
		})
	}

	function eachAttrEvent(an, f)
	{
		ZeT.asserts(an)
		ZeT.assertf(f)

		return function(scope, node, attr)
		{
			var self = this
			var   ax = ZeTS.trim(ZeT.asserts(attr[ag(an)]))
			var args = ZeT.a(arguments)
			args.unshift('')

			parseAttrEvents(ax, scope, function(s)
			{
				args[0] = s
				f.apply(self, args)
			})
		}
	}

	//~: trim (whitespaces between tags)
	anger.directive(ag('trim'), function($timeout)
	{
		function filter()
		{
			return (this.nodeType == 3) && !/\S/.test(this.nodeValue)
		}

		function clear()
		{
			$(this).contents().filter(filter).remove()
			$(this).children().each(clear)
		}

		return function(scope, node)
		{
			clear.apply(node)
		}
	})

	//~: focus-on
	anger.directive(ag('focus-on'), function()
	{
		return eachAttrEvent('focus-on', function(s, scope, node, attr)
		{
			scope.$on(cmdArg(s), cmdCall(s, function(x, event)
			{
				if((x == '?') && !ZeTS.ises(node.val()))
					return

				event.preventDefault()
				ZeT.timeout(10, function(){ node.focus() })
			}))
		})
	})

	//~: visible-on
	anger.directive(ag('visible-on'), function()
	{
		return eachAttrEvent('visible-on', function(s, scope, node, attr)
		{
			scope.$on(cmdArg(s), cmdCall(s, function(x, event)
			{
				node.toggle(ZeTS.first(x) != '!')
			}))
		})
	})

	//~: focus-on
	anger.directive(ag('focus-on'), function()
	{
		return eachAttrEvent('focus-on', function(s, scope, node, attr)
		{
			scope.$on(cmdArg(s), cmdCall(s, function(x, event)
			{
				if((x == '?') && !ZeTS.ises(node.val()))
					return

				event.preventDefault()
				ZeT.timeout(10, function(){ node.focus() })
			}))
		})
	})

	//~: class
	anger.directive(ag('class'), function()
	{
		return eachAttrEvent('class', function(s, scope, node, attr)
		{
			if(!ZeT.isa(s)) return

			var e = ZeT.asserts(s[0])
			var c = s[1]; if(ZeT.iss(c)) c = [ c ]
			ZeT.asserta(c)

			scope.$on(e, function(event)
			{
				ZeT.each(c, function(cls)
				{
					if(ZeTS.first(cls) != '!')
						node.addClass(cls)
					else
						node.removeClass(cls.substring(1))
				})
			})
		})
	})

	//~: init: passes $element
	anger.directive(ag('init'), function()
	{
		return function(scope, node, attr)
		{
			var script = attr[ag('init')]

			if(!ZeT.ises(script))
				ZeT.xeval(script, {
					$scope   : scope,
					$element : node
				})
		}
	})

	//~: on: reacts on listed events
	anger.directive(ag('on'), function()
	{
		return eachAttrEvent('on', function(s, scope, node, attr)
		{
			scope.$on(cmdArg(s), cmdCall(s, function(x, event)
			{
				var script = attr[ag('on-' + s)]

				if(!ZeT.ises(script))
					ZeT.xeval(script, {
						$scope   : scope,
						$element : node
					})
			}))
		})
	})

	function opts(node, p)
	{
		var opts = $(node).data('ag-opts')
		if(!opts) return

		ZeT.assert(ZeT.iso(opts))
		return ZeT.isu(p)?(opts):(opts[p])
	}

	anger.directive(ag('opts'), function()
	{
		return function(scope, node, attrs)
		{
			var opts = ZeTS.trim(attrs[ag('opts')])
			if(ZeT.ises(opts)) return

			ZeT.assert(ZeTS.first(opts) == '{')
			opts = scope.$eval(opts)
			ZeT.assert(ZeT.iso(opts))

			node.data('ag-opts', opts)
		}
	})

	function eachAttrEventHandler(h, an, action, wrapper)
	{
		ZeT.assertf(h)
		ZeT.asserts(an)
		ZeT.assertf(action)

		var eae = eachAttrEvent(an, action)

		return function(/* scope, node, ... */)
		{
			var self = this, args = ZeT.a(arguments)

			h.call(this, args, [an, action, wrapper], function()
			{
				if(!ZeT.isf(wrapper))
					eae.apply(self, args)
				else
				{
					var a = ZeTA.copy(args)

					a.unshift(function()
					{
						eae.apply(self, args)
					})

					wrapper.apply(self, a)
				}
			})
		}
	}

	function eachAttrEventClick(an, action, wrapper)
	{
		function h(args, aaw, f)
		{
			$(args[1]).click(f)
		}

		return eachAttrEventHandler(h, an, action, wrapper)
	}

	function scopeUp(scope, up)
	{
		ZeT.assertn(scope)
		ZeT.assert(ZeT.isi(up))

		while(up-- > 0)
			if(!scope.$parent) break; else
				scope = scope.$parent

		return scope
	}

	function eventBroadcast(s, scope, node)
	{
		var up = opts(node, 'up')
		if(ZeT.isi(up)) scope = scopeUp(scope, up)

		if(ZeT.isa(s))
		{
			//ZeT.log("> ", s[0], ': ', s[1], ' to $', scope.$id)
			scope.$broadcast(s[0], s[1])
		}
		else
		{
			//ZeT.log("> ", s, ' to $', scope.$id)
			scope.$broadcast(s)
		}
	}

	//~: click broadcast
	anger.directive(ag('click'), function()
	{
		return eachAttrEventClick('click', eventBroadcast)
	})

	//~: key enter broadcast
	anger.directive(ag('key-enter'), function()
	{
		function h(args, aaw, f)
		{
			$(args[1]).keypress(function(e)
			{
				if(e.which == 13) f()
			})
		}

		return eachAttrEventHandler(h, 'key-enter', eventBroadcast)
	})

	function findPublicScope($id)
	{
		var scope

		$(document).find('.ng-scope').each(function()
		{
			var s = angular.element(this).scope()
			if(s.$id === $id) { scope = s; return false }
		})

		return scope
	}

	//~: history handling strategy
	var History = anger.History =
	{
		HID       : '29aa6a6a-3c51-11e6-ac61-9e71128cae77',

		replace   : function(/* fname, scope, obj */)
		{
			window.history.replaceState(
			  History.state.apply(History, arguments), '')
		},

		push      : function(/* fname, scope, obj */)
		{
			var s = History.state.apply(History, arguments)
			var x = window.history.state

			//?: {state is not a duplicate}
			if(ZeT.o2s(x) != ZeT.o2s(s))
				window.history.pushState(s, '')
		},

		state     : function(fname, scope, obj)
		{
			ZeT.asserts(fname)
			ZeT.assertn(scope)

			//?: {the scope given is temporary}
			if(scope.$$transcluded == true)
				return { uuid: History.HID, f: 'noop' }

			return {
				uuid  : History.HID,
				f     : fname,
				scope : scope.$id,
				obj   : obj
			}
		},

		call      : function(e)
		{
			//?: {not our state}
			var s = ZeT.get(e, 'originalEvent', 'state')
			if(!ZeT.iso(s) || s.uuid != History.HID) return

			var f = ZeT.assertf(History[s.f])
			f.call(History, s)
		},

		noop      : function(){},

		broadcast : function(s)
		{
			var events = ZeT.asserts(ZeT.get(s, 'obj', 'events'))
			var   node = s.obj.node
			if(ZeT.iss(node)) node = $('#' + node)

			//~: find the scope
			var scope = findPublicScope(s.scope)
			ZeT.assertn(scope, 'History referred Angular ',
			  'scope $id = ', s.scope, ' is not found!')

			parseAttrEvents(events, scope, function(s)
			{
				eventBroadcast(s, scope, node)
			})
		}
	}

	//~: react on module generated history states
	$(window).on('popstate', History.call)

	function nodeId(node)
	{
		var n = $(node).first()
		ZeT.assert(1 === n.length)

		var id = node.attr('id')
		if(!ZeT.ises(id)) return id

		if(!anger.$nodeId) anger.$nodeId = 1
		node.attr('id', id = ('ag-' + anger.$nodeId++))
		return id
	}

	//~: click push to history
	anger.directive(ag('click-history'), function()
	{
		function wrapper(f, scope, node, attrs)
		{
			History.push('broadcast', scope, {
			  node: nodeId(node),
			  events: attrs[ag('click-history')],
			})

			f()
		}

		return eachAttrEventClick('click-history',
		  eventBroadcast, wrapper)
	})
})