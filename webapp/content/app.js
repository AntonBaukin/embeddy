/*===============================================================+
 |                      Application Script                       |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

ZeT.scope(angular.module('screener', ['anger']), function(screener)
{
	var anger = angular.module('anger')

	function errorMsg(title, text)
	{
		return new PNotify({
			title: title,
			text: text,
			type: 'error',
			icon: 'fa fa-exclamation-triangle',
			addclass: 'alert-with-icon'
		})
	}

	function absBorderLayout(n)
	{
		function xn(x)
		{
			if(!(x = x.first()).length) return null
			if(x.css('display') == 'none') return null
			return x
		}

		var x = xn(n.prev())
		var y = xn(n.next())

		if(x && x.css('position') != 'absolute')
			x.css({ position: 'absolute', left: 0, right: 0, top: 0 })

		if(y && y.css('position') != 'absolute')
			y.css({ position: 'absolute', left: 0, right: 0, bottom: 0 })

		n.css({ position: 'absolute', left: 0, right: 0,
		  top: ((x)?(x.outerHeight()):(0)) + 'px',
		  bottom: ((y)?(y.outerHeight()):(0)) + 'px'
		})

		n.scrollTop(0)
	}

	function bindCardAbsBorderLayout($element, path)
	{
		return function()
		{
			absBorderLayout($element.find(path || '> .card-block'))
		}
	}

	var sharedScope =
	{
		ZeT               : ZeT,

		//~: toggle date picker (smart show)
		toggleDatePicker  : function(sel)
		{
			var f = $(sel).first()
			var p = ZeT.assertn(f.data('datepicker'))

			if(!p.picker.data('hide-callback'))
			{
				p.picker.data('hide-callback', true)
				f.datepicker().on('hide', function()
				{
					p.picker.data('hide-time', new Date().getTime())
				})
			}

			//?: {closed a time before} do show
			var ht = p.picker.data('hide-time')
			if(!ht || (ht + 500 < new Date().getTime()))
				f.datepicker('show')
		},

		//~: update the value of date picker
		updateDatePicker  : function(input)
		{
			var hi = ZeT.assertn(input.data('date-hidden'))
			input.datepicker('update', ZeT.ises(hi.val())?(null):
			  moment(hi.val()).toDate())
		},

		//~: initialize the date picker
		initDatePicker    : function(input, hidden)
		{
			ZeT.assert(hidden && hidden[0])
			ZeT.assert(hidden.is('input'))
			input.data('date-hidden', hidden)

			var dp = input.datepicker({
				language    : 'ru',
				orientation : 'bottom',
				showOnFocus : false,
				autoclose   : true,
				clearBtn    : true
			})

			dp.on('changeDate', function(d) {
				d = [ d.date.getFullYear(), d.date.getMonth(), d.date.getDate() ]
				hidden.val(moment.utc(d).format()).trigger('change')
			})

			dp.on('clearDate', function() {
				hidden.val('').trigger('change')
			})
		},

		getTags           : function(obj)
		{
			var tags = []

			ZeT.each(obj.tags, function(uuid)
			{
				var t = globalDataMap[uuid]
				if(t) tags.push(t)
			})

			tags.sort(function(l, r)
			{
				return (l.title || '').toLowerCase().
					localeCompare((r.title || '').toLowerCase())
			})

			return tags
		},

		getFile           : function(uuid)
		{
			//ZeT.log('File [', uuid, '] = ', globalDataMap[uuid])
			return globalDataMap[uuid]
		},

		fileSize          : function(s)
		{
			if(ZeT.isx(s)) return s

			if(!ZeT.isn(s))
				s = s.size || s.length

			if(s < 1024)
				return { v: s, t: 'byte' }

			if(s < 1024*1024)
				return { v: (s/1024).toFixed(2), t: 'Kb' }

			if(s < 1024*1024*1024)
				return { v: (s/(1024*1024)).toFixed(2), t: 'Mb' }

			return { v: (s/(1024*1024*1024)).toFixed(2), t: 'Gb' }
		},

		mediaType         : function(file)
		{
			if(ZeT.isx(file)) return file

			if(ZeTS.starts(file.mime, 'video'))
				return 'video'

			if(ZeTS.starts(file.mime, 'image'))
				return 'image'
		},

		getAddress        : function(x, line)
		{
			if(ZeT.iss(x.address)) x = x.address
			if(ZeT.iss(x.uuid)) x = x.uuid

			var a = globalDataMap[ZeT.asserts(x)]
			if(line === false) return addressFirstLine(a)
			if(line === true)  return addressSecondLine(a)
			var b = addressFirstLine(a)
			var c = addressSecondLine(a)

			return ZeTS.cat(b, (!ZeT.ises(b) && !ZeT.ises(c))?' ':'', c)
		}
	}

	function setupDefaults($scope, $element, opts)
	{
		opts = opts || {}
		$scope.view = { tagson: true }
		$scope.selected = {}

		//~: shared scope itens
		ZeT.extend($scope, sharedScope)

		//~: setup editor fog
		setupEditFog($scope, $element)

		//~: setup error fog (if exists)
		setupErrorFog($scope, $element)

		//~: setup the filter
		setupFilter($scope, $element, opts)

		//~: setup the tags select procedure
		setupTagsSelector($scope, opts)

		function safeApply()
		{
			if(opts.to)
				opts.to(function(){})
			else
				$scope.$apply()
		}

		//~: hide elements on close
		$scope.$on('fog-close', function()
		{
			//~: close all the menues
			offDropDownMenu()
		})

		function openDropInl()
		{
			$(this).parent().addClass('open')
			$(this).parent().find('> .dropdown-menu').position({
			  of: this, my: 'right top', at: 'right bottom+8'
			})
		}

		function openDropAbs()
		{
			var a = $(this), p = a.parent()
			var o = p.offset(), x = p.data('menu-holder')

			if(!x) x = $('<span/>').addClass('dropdown-menu-holder').
			  css({ display: 'inline-block'}).insertBefore(p)
			x.css({ height: '1px', width: '' + p.outerWidth() + 'px' }).show()

			p.detach().css({ position: 'absolute' })
			$(document.body).append(p.offset(o))
			p.data('menu-holder', x)

			p.addClass('open').find('> .dropdown-menu').position({
				of: this, my: 'right top', at: 'right bottom+8'
			})
		}

		//~: hide drop-down menu
		function offDropDownMenu(e)
		{
			//?: {click on a menu itself}
			var m = e && $(e.target).closest('.dropdown')

			//?: {hide each opened menu}
			if(!m || !m.length) m =
			  $('.dropdown-menu:visible').parent()

			m.each(function()
			{
				var p = $(this).removeClass('open')
				if(!p.data('menu-holder')) return
				var x = p.data('menu-holder')

				p.css({ position: 'relative', top: '', left: '' })
				p.detach().insertBefore(x.hide())
			})

			$('body').unbind('click', offDropDownMenu)
		}

		//~: drop-down menu
		$element.find('.dropdown.dropdown-typical > .dropdown-toggle').click(function(e)
		{
			$scope.$broadcast('fog-close')
			$scope.$broadcast('fog-show', { class: 'at-header' })
			ZeT.timeout(10, $(this).hasClass('abs-menu')?(openDropAbs):(openDropInl), this)
		})

		//~: toggle edit mode
		$scope.$on('toggle-view-edit', function()
		{
			$scope.view.edit = !$scope.view.edit
			$scope.$apply()
		})

		//~: toggle tags edit mode
		$scope.$on('toggle-view-tags', function()
		{
			var t = !$scope.view.tags
			ZeT.extend($scope.view, {
				tags   : t,
				tagson : $scope.view.tagson || t
			})

			$scope.$apply()
		})

		//~: toggle tags visible
		$scope.$on('toggle-view-tagson', function()
		{
			$scope.view.tagson = !$scope.view.tagson
			$scope.$apply()
		})

		//~: toggle display removed
		$scope.$on('toggle-view-removed', function(e, flag)
		{
			$scope.view.removed = ZeT.isb(flag)?(flag):!$scope.view.removed
			if(ZeT.isf($scope.doFilter)) $scope.doFilter()
			safeApply()
		})

		//~: toggle select mode
		$scope.$on('toggle-view-select', function(e, flag)
		{
			$scope.view.select = ZeT.isb(flag)?(flag):!$scope.view.select
			delete $scope.tagsSel
			safeApply()
		})

		//~: clear the selection
		$scope.$on('clear-selection', function()
		{
			//?: {clear within the filtered set}
			if(ZeT.isa($scope.filtered))
				ZeT.each($scope.filtered, function(o)
				{
					delete $scope.selected[o.uuid]

					if($scope.tagsSel && ZeT.isa(o.tags))
						ZeT.each(o.tags, function(tag){
							delete $scope.tagsSel[tag]
						})
				})
			//~: clear all
			else
			{
				$scope.selected = {}
				delete $scope.tagsSel
			}

			safeApply()
		})

		//~: select all (if filtered)
		$scope.$on('select-all-filtered', function()
		{
			//?: {not filtered}
			if(!ZeT.isa($scope.filtered)) return

			//~: clear the selection
			$scope.selected = {}
			delete $scope.tagsSel

			//~: select all
			ZeT.each($scope.filtered, function(o){
				if(ZeT.iss(o.uuid)) $scope.selected[o.uuid] = true
			})

			safeApply()
		})

		$scope.color = function(uuid)
		{
			if(ZeT.iso(uuid) && uuid.uuid)
				uuid = uuid.uuid

			if(ZeT.ises(uuid))
				return 'black'

			return colorUUID(uuid).toHexString()
		}

		//~: select by a tag
		$scope.clickTagSelector = function(uuid, tag)
		{
			if(!$scope.view.select || !opts.objects) return
			var objects = $scope[opts.objects]
			if(!ZeT.isa(objects)) return

			//?: {invert selection by the same tag}
			$scope.tagsSel = $scope.tagsSel || {}
			if($scope.tagsSel[tag])
				delete $scope.tagsSel[tag]
			else
				$scope.tagsSel[tag] = true

			//~: check each of the objects
			var xtags = ZeT.keys($scope.tagsSel)
			ZeT.each(objects, function(o)
			{
				if(!ZeT.isa(o.tags) || ZeT.ises(o.uuid))
					return

				for(var sel = false, i = 0;(i < xtags.length);i++)
					if(ZeT.ii(o.tags, xtags[i])) { sel = true; break }

				if(sel) $scope.selected[o.uuid] = true
				else    delete $scope.selected[o.uuid]
			})
		}

		//~: hide all the menues
		$scope.$on('content-hide', function(){ offDropDownMenu() })

		//~: hide menu by an event
		$scope.$on('off-dd-menu', function(x, e)
		{
			offDropDownMenu(e)
		})

		//~: toggle drop-down menu
		$scope.toggleDropdownMenu = function($event, opts)
		{
			var n = $(ZeT.get($event, 'delegateTarget') || this)

			offDropDownMenu()
			if(n.parent().hasClass('open')) return

			var p = ZeT.deepExtend(opts, {
				my: 'right top', at: 'right bottom+2'
			})

			n.parent().addClass('open').find('> .dropdown-menu').
			  position((p.of = n, p))

			ZeT.timeout(100, function() {
				$('body').unbind('click', offDropDownMenu).click(offDropDownMenu)
			})
		}
	}

	function setupEditFog($scope, $element)
	{
		//?: {has no edit fog}
		var fog = $element.find('.edit-fog')
		if(!fog.length) return

		var ocls = fog.attr('class')

		//~: fog show options
		$scope.$on('fog-show', function(e, opts)
		{
			//~: set the original class
			fog.attr('class', ocls)

			//?: has no options
			if(!ZeT.iso(opts)) return

			//?: {options in the class}
			if(opts.class) fog.addClass(opts.class)

			//?: {at header} set the padding
			fog.css('padding-top', !fog.hasClass('at-header')?('0'):(
				$element.find('>header').outerHeight() + 'px'
			))
		})

		//~: close the fog
		fog.click(function(e)
		{
			if(e.delegateTarget == e.target)
				$scope.$broadcast('fog-close')
		})
	}

	function setupErrorFog($scope, $element)
	{
		//?: {has no error fog}
		if(!$element.find('.error-fog').length) return

		$scope.$on('error-fog-show', function(e, payload)
		{
			if(ZeT.iss(payload)) payload = { m: payload }
			if(ZeT.iss(payload.e)) payload.e =
				$element.find(payload.e).first()

			var f = $element.find('.error-fog')
			f.show().toggleClass('filled', !payload.e)

			var t = f.find('.error-text').hide()
			if(ZeT.iss(payload.m))
			{
				t.text(payload.m).show()

				if(!payload.e)
					t.css({ left: '50%', marginLeft: -t.width()/2 + 'px',
						top: '50%', marginTop: -t.height()/2 + 'px'
					})
			}

			if(payload.e)
			{
				var abcd = f.find('.error-mask')
				var xywh = payload.e.offset()
				var scrl = payload.e.closest('.scrollable-block')
				var scry = scrl[0] && (scrl.offset().top - f.offset().top)
				var scrh = scrl[0] && scrl.height()

				xywh.top   -= f.offset().top
				xywh.left  -= f.offset().left
				xywh.width  = payload.e.outerWidth()
				xywh.height = payload.e.outerHeight()

				if(scry && (xywh.top - 8 < scry) || (xywh.top + xywh.height + 8 > scrh + scry))
				{
					if((xywh.top - 8 < scry))
						scrl.scrollTop(Math.max(0, scrl.scrollTop() - scry - 8 + xywh.top))
					else
						scrl.scrollTop(Math.max(0, scrl.scrollTop() + xywh.top + xywh.height - scrh - scry + 8))

					xywh.top = payload.e.offset().top - f.offset().top
				}

				var xyz = {
					top: (xywh.top - 6) + 'px',
					left: (xywh.left - 6) + 'px',
					right: (xywh.left + xywh.width + 4) + 'px',
					bottom: (xywh.top + xywh.height + 4) + 'px',
					height: (xywh.height + 4 + 6) + 'px'
				}

				$(abcd[0]).css({ height: xyz.top })
				$(abcd[1]).css({ width: xyz.left, top: xyz.top, height: xyz.height })
				$(abcd[2]).css({ left: xyz.right,  top: xyz.top, height: xyz.height })
				$(abcd[3]).css({ top: xyz.bottom })

				if(t.is(':visible')) t.position({
				  of: payload.e, my: 'left top', at: 'left bottom+6'
				})
			}
		})
	}

	function setupFilter($scope, $element, opts)
	{
		//~: handle the options
		$scope.filter = $scope.filter || {}
		if(opts.filter) ZeT.extend($scope.filter, opts.filter)
		opts.filter = $scope.filter

		//? {no known objects of the scope}
		if(ZeT.isx(opts.objects)) return

		//~: click on filter open
		$element.find('.dropdown.filter-dialog a').click(function()
		{
			//~: hide current content
			$scope.$broadcast('fog-close')

			//~: show the fog again
			ZeT.timeout(10, function()
			{
				$scope.$broadcast('fog-show')
			})

			//~: show the dialog
			ZeT.timeout(100, function()
			{
				$scope.$root.$broadcast('show-filter-dialog', {
				  $scope: $scope, $element: $element, opts: opts
				})
			})
		})

		function filter(a, p)
		{
			if(ZeT.isx(a)) return a
			ZeT.assert(ZeT.isa(a) && ZeT.isf(p))

			//?: {have no filtered data array}
			var r = a.filteredData; if(!ZeT.isa(r))
				a.filteredData = r = new Array(a.length)

			//~: do filter
			for(var j = 0, i = 0;(i < a.length);i++)
				if(p(a[i], $scope.filter) === true)
					r[j++] = a[i]

			//~: reduce the array
			r.splice(j, a.length - j)

			return r
		}

		ZeT.extend($scope.filter, {
			$iio: iio,
			$text: text
		})

		function removed(x, f)
		{
			return ($scope.view.removed === true) || !x.removed ||
			  (ZeT.isf(f.removed) && f.removed.apply(this, arguments))
		}

		function tags(x, f)
		{
			if(!f.tagsActive) return true
			if(!ZeT.isa(x.tags) || !x.tags.length)
				return f.set.noTags

			var found = 0, tags = f.set.tags || {}
			for(var i = 0;(i < x.tags.length);i++)
				if(tags[x.tags[i]])
					if(f.set.eachTag)
						found++
					else
						return true

			return (found == f.tagsActive)
		}

		function address(x, f)
		{
			return !f.addressesActive || !!f.set.addresses[x.address]
		}

		function iio(o, p, x)
		{
			if(ZeT.iss(o))
				return ZeT.ii(o.toLocaleLowerCase(), p)

			return ZeT.iso(o) && ZeT.iss(p = o[p]) &&
			  ZeT.ii(p.toLocaleLowerCase(), x)
		}

		function text(o, f)
		{
			//?: {have no filter text}
			var x = ZeT.get(f, 'set', 'text')
			if(!x) return true

			//?: {uuid}
			if(iio(o, 'uuid', x)) return true

			//?: {title}
			if(iio(o, 'title', x)) return true

			//?: {name}
			if(iio(o, 'name', x)) return true

			//?: {tags}
			if(ZeT.isa(o.tags))
				for(var i = 0;(i < o.tags.length);i++)
					if(iio(globalDataMap[o.tags[i]], 'title', x))
						return true

			//?: {address}
			if(!ZeT.ises(o.address))
				if(iio($scope.getAddress(o.address), x))
					return true

			if(ZeT.isf(f.text))
				return f.text.apply(this, arguments)
		}

		//?: {user controls all the filters}
		var filters; if(opts.myfilter)
			filters = ZeT.assertf(opts.myfilter)
		else
		{
			filters = [ removed, tags, address, text ]

			if(ZeT.isf($scope.filter.filters))
				filters.push($scope.filter.filters)
			else if(ZeT.isa($scope.filter.filters))
				filters.push.apply(filters, $scope.filter.filters)

			//~: and-concatenate
			filters = ZeT.and.apply(ZeT, filters)
		}

		//~: main filter function
		$scope.doFilter = function(data)
		{
			var objs

			if(ZeT.iss(opts.objects))
			{
				objs = $scope[opts.objects]
				if(ZeT.isa(data)) $scope[opts.objects] = objs = data
			}
			else
			{
				ZeT.assertf(opts.objects)
				objs = opts.objects()
			}

			//~: select the target scope (may be a child)
			var sc = (this.$root == $scope.$root)?(this):($scope)
			sc.filtered = ZeT.isx(objs)?[]:filter(objs, filters)
		}

		//~: watch the filter text
		$scope.$watch('filter.set.text', function(x)
		{
			//?: {has filter text}
			if(!ZeT.ises(x = ZeTS.trim(x)))
				opts.filter.set.text = x.toLocaleLowerCase()
			else if(opts.filter.set)
				delete opts.filter.set.text
		})

		//~: apply the filter
		$scope.$on('filter-apply', function()
		{
			$scope.filter = opts.filter

			//~: check the tags active
			opts.filter.tagsActive = ZeT.keys(ZeT.get(
			  opts.filter, 'set', 'tags') || {}).length ||
			  ZeT.get(opts.filter, 'set', 'noTags')

			//~: check the addresses active
			opts.filter.addressesActive = !!ZeT.keys(ZeT.get(
			  opts.filter, 'set', 'addresses') || {}).length

			//ZeT.log('Final filter ', opts.filter)
			ZeT.timeout(100, function()
			{
				$scope.doFilter()
				$scope.$apply()
			})
		})

		//~: is filter active
		$scope.isFilterActive = function()
		{
			return opts.filter.tagsActive ||
			  opts.filter.addressesActive ||
			  ZeT.get(opts.filter, 'set', 'text')
		}

		//~: is tag filtered
		$scope.isTagFiltered = function(tag)
		{
			if(!opts.filter.tagsActive) return false
			if(ZeT.iso(tag)) tag = tag.uuid
			var ft = opts.filter.set.tags
			return !!(ft && ft[tag])
		}
	}

	function setupTagsSelector($scope, xopts)
	{
		//?: {not selecting the tags}
		if(ZeT.isu(xopts.tagsSel)) return
		ZeT.assertf(xopts.tagsSel)

		function selectedObjects()
		{
			var objs = []; ZeT.each($scope.selected,
			  function(v, k){ objs.push(k) })
			return (objs.length)?(objs):(null)
		}

		//~: select tags
		$scope.selectTags = function(o)
		{
			var objs, tags = {}

			//?: {multiple selection}
			if(ZeT.isu(o))
			{
				if(!$scope.view.select) {
					$scope.$broadcast('fog-close')
					$scope.$broadcast('toggle-view-select', true)
					return
				}

				objs = selectedObjects()
				if(!objs) return
			}
			else
			{
				ZeT.assert(o && !ZeT.ises(o.uuid))
				objs = [ o.uuid ]
			}

			//~: collect tags from all the devices
			ZeT.each(objs, function(x)
			{
				x = ZeT.assertn(globalDataMap[x])
				ZeT.each(x.tags, function(tag){ tags[tag] = true })
			})

			$scope.$broadcast('fog-close')
			$scope.$root.$broadcast('content-hide')
			$scope.$root.$broadcast('select-tags', {
			  $scope: $scope, event: 'tags-selected',
			  tags: tags, objs: objs
			})
		}

		//~: selected tags
		$scope.$on('tags-selected', function(e, opts)
		{
			//?: {did not selected}
			if(opts.cancelled === true)
				return xopts.tagsSel(false, opts)

			//~: collect the tags
			ZeT.assert(ZeT.iso(opts.selected))
			var tags = []; ZeT.each(opts.selected,
			  function(v, k){ if(v === true) tags.push(k) })

			//~: build the request object
			ZeT.asserta(opts.objs)
			ZeT.each(opts.objs, function(o, i) {
				opts.objs[i] = { uuid: o, tags: tags }
			})

			//!: invoke the callback
			xopts.tagsSel(opts.objs, opts)
		})
	}

	//~: load the data
	var globalData = {}, globalDataMap = {}
	function loadData(/* [reload], query, f || a */)
	{
		var a = arguments, r = a[0], q = a[1], f = a[2]
		if(!ZeT.isb(r)) { f = q; q = r; r = false }
		ZeT.assert(!ZeT.ises(q) && (ZeT.isf(f) || ZeT.isa(f)))

		function replaceData(data)
		{
			//~: previous version
			var x = globalData[q], ids = (x)?{}:(null)

			//~: assign the new
			globalData[q] = data

			//~: map the ids
			ZeT.each(data, function(o) {
				if(ids) ids[o.uuid] = true
				globalDataMap[o.uuid] = o
			})

			//~: remove obsolete mappings
			ZeT.each(x, function(o) {
				if(o.uuid && !ids[o.uuid])
					delete globalDataMap[o.uuid]
			})
		}

		//?: {has direct data}
		if(ZeT.isa(f))
			return replaceData(f)

		//?: {has data}
		var x = globalData[q]
		if(x && x.length)
			if(!r) //?: {immediate answer with current data}
				f.call(this, x)
			else   //!: delete obsolete data
				delete globalData[q]

		//~: (always) load the requested data
		AppData.get(q, function(data)
		{
			replaceData(data)

			//?: {reload | delayed answer}
			if(r || !x || !x.length)
				f.call(this, data)
		})
	}

	/**
	 * Generates a color based on UUID.
	 */
	function colorUUID(uuid)
	{
		ZeT.asserts(uuid)
		uuid = uuid.toLowerCase()

		for(var n = 1, i = 0;(i < uuid.length);i++)
		{
			var x, c = uuid[i]
			if(c >= '0' && c <= '9') x = c - '0'
			if(c >= 'a' && c <= 'f') x = 10 + (c - 'a')
			if(ZeT.isi(x)) n = (31 * n + x) % 2147483647
		}

		return $.Color({
			hue: (n % 31) * 10,
			saturation: 0.5,
			lightness: 0.4,
			alpha: 1
		})
	}

	//~: root controller
	screener.controller('rootCtrl', function($scope, $rootScope, $timeout)
	{
		$scope.$on('$includeContentError', function(e, page)
		{
			//?: {failed to load combined index page}
			if(page == 'items.html') $timeout(function(){
				$scope.loadIndividualPageItems = true
			})
		})

		function displayInitialPage(want, e, page)
		{
			var i = (page == 'items.html')
			var x = (page == ZeTS.cat('items/', want, '.html'))

			if(i || x) $timeout(function()
			{
				$rootScope.$broadcast('content-' + want)

				//~: save initial point in the history
				anger.History.replace('broadcast', $scope,
				  { events: 'content-hide content-' + want })
			})
		}

		//!: set the first displayed block
		$scope.$on('$includeContentLoaded', ZeT.fbindu(
		  displayInitialPage, 0, 'schedules'))

		//~: history back
		$rootScope.historyBack = function()
		{
			ZeT.assert(window.history.length > 0)
			window.history.back()
			$rootScope.$broadcast('fog-close')
		}

		//~: application sign out
		$rootScope.$on('app-sign-out', function()
		{
			AppLogin.logout(function()
			{
				window.location.replace('/static/login/index.html')
			})
		})
	})

	//~: filter dialog controller
	screener.controller('filterDialogCtrl', function($scope, $rootScope, $element)
	{
		setupDefaults($scope, $element)

		var onclose, onhide; function doclose(c, h)
		{
			$element.hide()
			if(ZeT.isf(onclose)) onclose()
			if(ZeT.isf(onhide)) onhide()
			onclose = c
			onhide = h
		}

		//~: display the filter dialog
		$scope.$on('show-filter-dialog', function(event, o)
		{
			ZeT.assert(ZeT.iso(o) && o.$scope && o.$element && ZeT.iso(o.opts))

			//~: filter options
			var f = $scope.filter = o.opts.filter
			if(!f) o.opts.filter = $scope.filter = f = {}
			ZeT.assert(ZeT.iso(f))

			function doClose(){ doclose() }

			//~: register temporary callback to hide
			doclose(o.$scope.$on('fog-close', doClose),
			  o.$scope.$on('content-hide', doClose))

			//~: scope-dependent close handler
			$scope.close = function()
			{
				doclose()
				delete $scope.filter
				o.$scope.$broadcast('fog-close')
				o.$scope.$broadcast('filter-apply', f)
			}

			//~: show the dialog
			$element.show()

			//~: align to the panel height
			ZeT.scope(function()
			{
				var panes = $element.find('.card-block.filter-dialog-pane')
				var prev  = panes.first().prev(':visible')
				panes.css('top', (prev.position().top + prev.outerHeight()) + 'px')
			})

			//?: {no default pane}
			if(!f.pane) {
				$scope.$broadcast('filter-pane-hide')
				$scope.$broadcast(f.pane = 'filter-pane-tags')
			}

			$scope.$apply()
		})

		//~: show the tags pane
		$scope.$on('filter-pane-tags', function()
		{
			var ptags = $element.find('.tags-panel')

			loadData('tags', function(tags)
			{
				$scope.tags = tags
				ptags.sortable({})
				ptags.sortable('disable')
				$scope.$apply()
			})
		})

		//~: show the addresses pane
		$scope.$on('filter-pane-addresses', function()
		{
			loadData('addresses', function(addresses)
			{
				$scope.addresses = addresses
				$scope.$apply()
			})
		})

		//~: reset the filter
		$scope.reset = function()
		{
			delete $scope.filter.set
			$scope.close()
		}

		function set(what)
		{
			if(!$scope.filter.set)
				$scope.filter.set = {}

			if(ZeT.iss(what)) {
				if(!$scope.filter.set[what])
					$scope.filter.set[what] = {}
				return $scope.filter.set[what]
			}

			return $scope.filter.set
		}

		//~: select a tag
		$scope.toggleTag = function(tag)
		{
			var x = !set('tags')[tag.uuid]
			if(x) set('tags')[tag.uuid] = true
			else delete set('tags')[tag.uuid]
		}

		//~: select an address
		$scope.onToggleAddress = function(adr)
		{
			var x = set('addresses')[adr.uuid]
			if(!x) delete set('addresses')[adr.uuid]
		}
	})

	//~: tags controller
	screener.controller('tagsCtrl', function($scope, $rootScope, $element, $timeout)
	{
		setupDefaults($scope, $element)

		var ptags = $element.find('.tags-panel')

		function takeTags(tags)
		{
			$scope.tags = tags

			ZeT.each(tags, function(tag, i)
			{
				tag.i = i
				tag.old = ZeT.deepClone(tag)
			})

			ptags.sortable(
			{
				update : function()
				{
					$scope.view.dragTime = new Date().getTime()
					$scope.$apply()
				}
			})

			//?: {enable or disable sort}
			ptags.sortable((!$scope.view.drag)?('disable'):('enable'))
		}

		//~: load the data
		$scope.$on('content-tags', function()
		{
			loadData('tags', function(tags)
			{
				takeTags(tags)
				$timeout(bindCardAbsBorderLayout($element))
			})
		})

		function tagNode(uuid)
		{
			return ptags.find('[data-uuid=' + uuid + ']')
		}

		$scope.$on('toggle-removed-tags', function()
		{
			$scope.view.removed = !$scope.view.removed
			$scope.$apply()
			ptags.sortable('refresh')
		})

		$scope.$on('toggle-drag-tags', function()
		{
			$scope.view.drag = !$scope.view.drag
			$scope.$apply()

			//?: {enable or disable sort}
			ptags.sortable((!$scope.view.drag)?('disable'):('enable'))
		})

		//~: tag edit form
		ZeT.scope(function()
		{
			$scope.addTag = function()
			{
				//~: temporary tag
				$scope.edit = { title: '', otitle: '' }

				//~: show the window
				$scope.$broadcast('error-fog-show', {})
				ZeT.timeout(100, function()
				{
					var cb = $element.find('>.card-block')
					var  w = $element.find('.tag-edit-window')

					w.show().position({ my: 'center', at: 'center', of: cb })
					w.find('input').focus()
				})
			}

			//~: dispose temporary state
			$scope.$on('content-hide', function()
			{
				delete $scope.selecting
				delete $scope.selected
			})

			//~: select tags
			$scope.$on('select-tags', function(e, opts)
			{
				$scope.selecting = opts
				$scope.selected = opts.tags || {}
				$scope.$broadcast('content-tags')
			})

			//~: composite click handler
			$scope.editTag = function(tag, force)
			{
				if(force !== true)
				{
					if($scope.view.dragTime + 100 > new Date().getTime())
						return

					if($scope.selecting) //<-- do toggle here!
					{
						$scope.selected[tag.uuid] = !$scope.selected[tag.uuid]
						if(tag.removed) $scope.selected[tag.uuid] = false
						if(!$scope.selected[tag.uuid]) delete $scope.selected[tag.uuid]
						return
					}
				}

				var n = tagNode(tag.uuid)
				var w = $element.find('.tag-edit-window')

				$scope.$broadcast('error-fog-show', { e: tagNode(tag.uuid) })

				//~: show the window
				ZeT.timeout(100, function()
				{
					w.show().position({ of: n, my: 'center top',
					  collision: 'none flip', at: 'center bottom+10'
					})

					var cb = $element.find('>.card-block')
					var x0 = cb.offset().left
					var x1 = x0 + cb.outerWidth()
					var  x = w.offset().left

					if(x < x0 + 4) w.offset({ left: x0 + 4 })
					if(x + w.outerWidth() > x1 - 4)
						w.offset({ left: x1 - w.outerWidth() - 4 })

					w.find('input').focus()
				})

				$scope.edit = { tag: tag, title: tag.title,
				  otitle: tag.title, node: n }
			}

			//~: do select tags
			function selectTags()
			{
				var opts = $scope.selecting

				opts.selected = $scope.selected
				$scope.selected = {}

				$rootScope.$broadcast('content-hide')
				opts.$scope.$broadcast(opts.event, opts)
			}

			//~: cancel select
			$scope.cancelSelect = function()
			{
				var opts = $scope.selecting

				$rootScope.$broadcast('content-hide')
				opts.cancelled = true
				opts.$scope.$broadcast(opts.event, opts)
			}

			$scope.removeTag = function(tag)
			{
				tag.removed = true
				$scope.doneEdit()
			}

			$scope.revertTag = function(tag)
			{
				tag.removed = false
				$scope.doneEdit()
			}

			$scope.keyPress = function(e)
			{
				if(e.which === 13)
					return $scope.doneEdit()
			}

			$scope.isTrueEdit = function()
			{
				return $scope.edit && ZeTS.trim($scope.edit.title).length &&
				  (ZeTS.trim($scope.edit.title) != ZeTS.trim($scope.edit.otitle))
			}

			$scope.doneEdit = function()
			{
				//?: {is creating tag}
				if(!$scope.edit.tag)
				{
					if(ZeTS.ises($scope.edit.title))
						return errorMsg('Error!', 'Name the tag!')

					$scope.tags.push($scope.edit.tag = { uuid: AppData.uuid() })
					ptags.sortable('refresh')
				}

				if(!ZeTS.ises($scope.edit.title))
					$scope.edit.tag.title = ZeTS.trim($scope.edit.title)

				delete $scope.edit
				$scope.$broadcast('error-fog-close')
			}

			$scope.isDirty = function()
			{
				var tasks = collectTasks()

				//ZeT.log('Dirty tasks: ', tasks)

				//?: {tasks | error (show button also)}
				return ZeT.iss(tasks) || (tasks.length > 0)
			}

			function collectTasks()
			{
				var error, tasks = [], titles = {}, uuids = {}

				function nextTag(uuid)
				{
					var n = tagNode(uuid).next()
					return n.data('uuid')
				}

				//~: find tag positions
				ZeT.each($scope.tags, function(t){ uuids[t.uuid] = t })
				ptags.find('.tag').each(function(i, n)
				{
					var uuid = $(n).data('uuid')
					if(!ZeT.ises(uuid) && uuids[uuid]) uuids[uuid].i = i
				})

				//~: validate the tags
				ZeT.each($scope.tags, function(tag)
				{
					//?: {title has spaces}
					if(ZeTS.trim(tag.title) != tag.title)
					{
						error = 'Tag name may not start or end ' +
						  'with a space! Tag: ' + tag.title
						return false
					}

					//?: {has this title}
					if(titles[tag.title])
					{
						error  = 'Tag with this name already exists! '
						error += (tag.removed)?('Tag: '):('Hidden tag: ')
						error += tag.title
						return false
					}

					titles[tag.title] = tag

					//?: {tag is new}
					if(!tag.old)
					{
						tasks.push({
							task: 'add',
							uuid: tag.uuid,
							title: tag.title,
							next: nextTag(tag.uuid)
						})

						return
					}

					//?: {tag was moved}
					if(tag.old.i != tag.i)
					{
						var n = nextTag(tag.uuid)

						if(n != tag.uuid) tasks.push({
							task: 'move',
							uuid: tag.uuid,
							next: n
						})
					}

					//?: {tag was updated}
					if(tag.old.title != tag.title ||
					   tag.old.removed != tag.removed
					  )
						tasks.push({
							task: 'update',
							uuid: tag.uuid,
							title: tag.title,
							removed: tag.removed
						})
				})

				return tasks
			}

			$scope.commitEdit = function()
			{
				var tasks = collectTasks()

				//?: {validation error}
				if(!ZeT.ises(tasks))
					return errorMsg('Validation error!', tasks)

				//ZeT.log('Send tasks: ', tasks)

				//?: {has no tasks when selecting}
				if($scope.selecting && !tasks.length)
					return selectTags()

				//?: {has no tasks when editing}
				ZeT.asserta(tasks)

				$scope.view.saving = true
				AppData.updateTags(tasks, function(res)
				{
					$scope.view.saving = false

					//~: update the tags
					ZeT.assert(ZeT.iso(res) && ZeT.isa(res.tags))
					loadData('tags', res.tags)
					takeTags(res.tags)

					if($scope.selecting)
					{
						//~: replace the server-replaced uuids
						if(ZeT.iso(res.ownids))
							ZeT.each(res.ownids, function(us, u)
							{
								if(!$scope.selected[u]) return
								delete $scope.selected[u]
								$scope.selected[us] = true
							})

						selectTags()
					}
				})
			}
		})
	})

	function assignIndices(a)
	{
		for(var j = 0, i = 0;(i < a.length);i++)
		{
			a[i].$i = i
			if(a[i].removed) continue
			a[i].$ir = j++
		}
	}

	function addressFirstLine(a)
	{
		return a && ZeTS.catsep(', ', a.index, a.province, a.settlement)
	}

	function addressSecondLine(a)
	{
		if(!a) return

		var o; if(!ZeT.ises(o = a.office))
		if(!ZeT.ii(o.toLocaleLowerCase(), 'office'))
			o = 'office ' + o

		return ZeTS.catsep(', ', a.street, a.building, o)
	}

	//~: addresses controller
	screener.controller('addressesCtrl', function($scope, $rootScope, $element, $timeout)
	{
		setupDefaults($scope, $element)
		$scope.view.edit = true

		ZeT.extend($scope, {
			firstLine   : addressFirstLine,
			secondLine  : addressSecondLine
		})

		function processAddresses(addresses)
		{
			$scope.addresses = addresses

			//~: sort the addresses
			addresses.sort(compare)

			//~: set the indices
			assignIndices(addresses)
		}

		//~: load the data
		$scope.$on('content-addresses', function(e, opts)
		{
			loadData('addresses', function(addresses)
			{
				processAddresses(addresses)
				$timeout(bindCardAbsBorderLayout($element))
			})
		})

		//~: dispose temporary state
		$scope.$on('content-hide', function()
		{
			delete $scope.selecting
			delete $scope.selected
		})

		//~: select an address
		$scope.$on('select-address', function(e, opts)
		{
			$scope.selecting = opts
			$scope.$broadcast('content-addresses')
		})

		//~: do select address
		$scope.selectAddress = function(adr)
		{
			var opts = $scope.selecting

			//~: select the address
			ZeT.assert(adr && !ZeT.ises(adr.uuid))
			$scope.selected = {}
			$scope.selected[adr.uuid] = true

			ZeT.timeout(250, function()
			{
				$rootScope.$broadcast('content-hide')
				opts.address = adr.uuid
				opts.$scope.$broadcast(opts.event, opts)
			})
		}

		//~: cancel select
		$scope.cancelSelect = function()
		{
			var opts = $scope.selecting

			$rootScope.$broadcast('content-hide')
			opts.cancelled = true
			opts.$scope.$broadcast(opts.event, opts)
		}

		//~: edit
		$scope.$on('edit', function(e, obj)
		{
			ZeT.assert(ZeT.iso(obj))

			$scope.editSource = obj
			$scope.edit = ZeT.deepClone(obj)
			$scope.$apply()
		})

		//~: edit
		$scope.$on('create', function(e)
		{
			$scope.editSource = $scope.edit = { create: true }
			$scope.$apply()
		})

		function updateEdit(adr)
		{
			ZeT.assert(ZeT.iso(adr))
			$scope.$broadcast('fog-close')

			//?: {created}
			if($scope.edit == $scope.editSource)
				loadData(true, 'addresses', function(addresses)
				{
					processAddresses(addresses)
					$scope.$apply()
				})
			//~: update the state
			else
			{
				ZeT.extend($scope.edit, adr)
				ZeT.extend($scope.editSource, adr)
				assignIndices($scope.addresses)
				$scope.$apply()
			}
		}

		//~: set removed or restored
		$scope.toggleRemoved = function()
		{
			var o = {
				uuid:    $scope.edit.uuid,
				removed: !$scope.edit.removed
			}

			//~: prevent repeated clicks from the user
			$scope.edit.removed = !$scope.edit.removed

			AppData.updateAddress(o, updateEdit)
		}

		//~: commit the edit
		$scope.commit = function()
		{
			if(ZeT.ises($scope.edit.settlement) && ZeT.ises($scope.edit.street))
				return errorMsg('Error!', 'Name at least settlement, or street!')

			AppData.updateAddress($scope.edit, updateEdit)
		}

		//~: is address modified
		$scope.isModified = function()
		{
			return ZeT.o2s($scope.editSource) != ZeT.o2s($scope.edit)
		}

		function compare(l, r)
		{
			for(var i = 0;(i < CMP.length);i++)
			{
				var x = xcmp(l[CMP[i]])
				var y = xcmp(r[CMP[i]])
				var z = x.localeCompare(y)
				if(z != 0) return z
			}

			return 0
		}

		var CMP = [ 'province', 'settlement', 'street' ]

		function xcmp(s)
		{
			//~: split string for the words
			s = ZeTS.trim(s).replace(/[^ a-z]/gi, '').split(' ')

			for(var i = 0;(i < s.length);i++)
			{
				var x = ZeTS.trim(s[i])

				//?: {is empty}
				if(!x.length) { s[i] = ''; continue }

				//?: {not starting with capital}
				if(ZeTS.first(x) == ZeTS.first(x).toLocaleLowerCase())
					s[i] = ''
			}

			return s.join('').toLocaleLowerCase()
		}
	})

	//~: devices controller
	screener.controller('devicesCtrl', function($rootScope, $scope, $element, $timeout)
	{
		setupDefaults($scope, $element, {
			to: $timeout, objects: 'devices',
			filter: { addresses: true },
			tagsSel: tagsSel
		})

		ZeT.extend($scope.view, {
			addToSelection : true,
			addresses      : true
		})

		//~: edit
		$scope.$on('edit', function(e, obj)
		{
			ZeT.assert(ZeT.iso(obj))

			$scope.edit = ZeT.deepClone(obj)
			$scope.editSource = obj

			$scope.$apply()
		})

		//~: display the password
		$scope.showPassword = function()
		{
			AppData.get('devpass', { uuid: $scope.edit.uuid }, function(d)
			{
				ZeT.assert(ZeT.iso(d) && ZeT.iss(d.secret))
				d.password = AppLogin.decodeNum(d.secret)

				$scope.edit.secret = d
				$scope.view.showPass = d.uuid
				$scope.$apply()
			})
		}

		//~: change device password
		$scope.changePassword = function()
		{
			if($scope.view.changingPass != $scope.edit.uuid)
				return $scope.view.changingPass = $scope.edit.uuid

			AppData.genDevPass($scope.edit.uuid, function(o)
			{
				delete $scope.view.changingPass

				if(ZeT.iso(o) && !ZeT.ises(o.secret))
				{
					o.password = AppLogin.decodeNum(o.secret)
					$scope.edit.secret = o
				}

				$scope.$apply()
			})
		}

		//~: load the data
		$scope.$on('content-devices', function()
		{
			$scope.devices = []

			loadData(true, 'devices', function(devices)
			{
				loadData('tags', function()
				{
					loadData('addresses', function()
					{
						$scope.devices = devices
						$scope.doFilter()

						$timeout(bindCardAbsBorderLayout($element))
					})
				})
			})
		})

		function updateDevice(dev)
		{
			if($scope.edit.uuid == dev.uuid)
				ZeT.extend($scope.editSource, $scope.edit)

			$scope.$broadcast('fog-close')
			$scope.$apply()
		}

		//~: remove-revert device
		$scope.toggleRemove = function(dev, removed)
		{
			dev.removed = !!removed
			AppData.updateDev({ uuid: dev.uuid, removed: dev.removed },
			  ZeT.fbind(updateDevice, this, dev))
		}

		//~: is device modified
		$scope.isModified = function()
		{
			var o = $scope.editSource
			var x = $scope.edit
			if(!x || !o) return

			return (ZeTS.trim(x.title) != ZeTS.trim(o.title))
		}

		//~: commit the edit
		$scope.submitEdit = function()
		{
			var dev = $scope.edit
			AppData.updateDev({ uuid: dev.uuid, title: dev.title },
			  ZeT.fbindu(updateDevice, 0, dev))
		}

		function selectedDevices()
		{
			if($scope.view.select) {
				var devs = []; ZeT.each($scope.selected, function(v, k){ devs.push(k) })
				return (devs.length >= 2)?(devs):(null)
			}

			$scope.$broadcast('fog-close')
			$scope.$broadcast('toggle-view-select')
		}

		//~: merge the designated schedules
		$scope.mergeSchedules = function()
		{
			var devs = selectedDevices()
			if(!devs) return

			$scope.$broadcast('fog-close')
			$rootScope.$broadcast('content-hide')
			$rootScope.$broadcast('content-merge-dev-schedules', {
			  $scope: $scope, event: 'merged-dev-schedules', devs: devs
			})
		}

		//~: display back on merge done
		$scope.$on('merged-dev-schedules', function()
		{
			$scope.$broadcast('toggle-view-select')
			$element.show()
		})

		//~: add devices
		$scope.addDevices = function(n)
		{
			AppData.addDevs(n, function(devs)
			{
				//?: {add devices to the selection}
				if($scope.view.addToSelection && ZeT.isa(devs))
					ZeT.each(devs, function(dev) {
						if(ZeT.iss(dev.uuid))
							$scope.selected[dev.uuid] = true
					})

				$scope.$broadcast('fog-close')
				$scope.$broadcast('content-devices')
			})
		}

		//~: merge the documents
		$scope.mergeDocuments = function()
		{
			var devs = selectedDevices()
			if(!devs) return

			$scope.$broadcast('fog-close')
			$rootScope.$broadcast('content-hide')
			$rootScope.$broadcast('content-merge-dev-docs', {
			  $scope: $scope, event: 'merged-dev-docs', devs: devs
			})
		}

		//~: display back on merge done
		$scope.$on('merged-dev-docs', function()
		{
			$scope.$broadcast('toggle-view-select')
			$element.show()
		})

		//~: select address
		$scope.selectAddress = function(dev)
		{
			//?: {multiple selection}
			var devs; if(ZeT.isu(dev))
			{
				devs = selectedDevices()
				if(!devs) return

				$scope.$broadcast('fog-close')
			}
			else
			{
				ZeT.assert(dev && !ZeT.ises(dev.uuid))
				devs = [ dev.uuid ]
			}

			$rootScope.$broadcast('content-hide')
			$rootScope.$broadcast('select-address', {
			  $scope: $scope, event: 'selected-devices-address', devs: devs
			})
		}

		//~: selected address
		$scope.$on('selected-devices-address', function(e, opts)
		{
			function done(reload)
			{
				$element.show()
				if(reload !== false)
					$scope.$broadcast('content-devices')
			}

			//?: {did not selected}
			if(opts.cancelled === true)
				return done(false)

			ZeT.asserts(opts.address)
			ZeT.asserta(opts.devs)

			ZeT.each(opts.devs, function(dev, i) {
				opts.devs[i] = { uuid: dev, address: opts.address }
			})

			AppData.updateDev(opts.devs, done)
		})

		function tagsSel(x, opts)
		{
			function done(reload)
			{
				$element.show()
				if(reload !== false)
					$scope.$broadcast('content-devices')
			}

			//?: {selected nothing}
			if(x === false)
				return done(false)

			//!: send update request
			AppData.updateDev(ZeT.asserta(x), done)
		}
	})

	function uploadFileBlock(url, $scope, $element, enableFileUpload, updateEdit)
	{
		function onSubmit()
		{
			enableFileUpload(false)
		}

		function onProgress(e, i)
		{
			$element.find('.uploading-list').show()
			$element.find('.uploading-list progress').val(i)
		}

		function onComplete(fn, fo)
		{
			enableFileUpload(true)
			if(ZeT.iss(fo)) fo = ZeT.s2o(fo)
			if(ZeT.iso(fo)) updateEdit(fo)
			$element.find('.uploading-list').hide()
		}

		function onError()
		{
			ZeT.log('Upload error! ', ZeT.a(arguments))
			onComplete()
		}

		AppData.uploadFile({
			uuid: ZeT.delay(function(){ return $scope.edit.uuid }),
			rename: ZeT.delay(function(){ return !!$scope.view.uploadRename }),
			url: url,
			input: $element.find('.btn-file input'),
			onSubmit: onSubmit,
			onProgress: onProgress,
			onComplete: onComplete,
			onError: onError
		})
	}

	//~: media controller
	screener.controller('mediaCtrl', function($rootScope, $scope, $element, $timeout)
	{
		setupDefaults($scope, $element, {
			to: $timeout, objects: 'media',
			filter: { text: fext },
			tagsSel: tagsSel
		})

		$scope.view.uploadRename = true

		function fext(o, f)
		{
			//?: {file extension fully equals}
			if(ZeT.iss(o.ext) && (o.ext.toLowerCase() == f.set.text))
				return true
		}

		//~: load the data
		$scope.$on('content-media', function()
		{
			$scope.media = []

			loadData('tags', function()
			{
				loadData(true, 'media', function(media)
				{
					$scope.media = media
					$scope.doFilter()

					$timeout(bindCardAbsBorderLayout($element))
				})
			})
		})

		//~: edit
		$scope.$on('edit', function(e, obj)
		{
			ZeT.assert(ZeT.iso(obj))

			$scope.editSource = obj
			$scope.edit = ZeT.deepClone(obj)
			enableFileUpload(true)
			$scope.$apply()
		})

		//~: handle file upload
		uploadFileBlock('/set/mediafile', $scope, $element, enableFileUpload, updateEdit)

		//~: upload enable callback
		function enableFileUpload(enable)
		{
			var b = $element.find('.btn-file')
			var f = b.find('input')

			b.toggleClass('disabled', !enable)
			f.prop('disabled', !enable)

			var AV = 'video/*,.mp4,.mkv,.avi,.m2v,.mpeg,.mpg,.webm'
			var AI = 'image/*,.jpeg,.jpg,.png,.gif,.bmp,.svg'
			var ac = ZeTS.cat(AV, ',', AI)

			if(ZeT.get($scope.edit, 'mime'))
			{
				var mt = $scope.mediaType($scope.edit)

				if(mt == 'video') ac = AV
				else if(mt == 'image') ac = AI
			}

			//~: set media files select
			f.attr('accept', ac)
		}

		function updateEdit(fo)
		{
			ZeT.assert(ZeT.iso(fo))
			ZeT.extend($scope.edit, fo)
			ZeT.extend($scope.editSource, fo)
			$scope.$apply()
			$scope.$broadcast('fog-close')
		}

		//~: set removed or restored
		$scope.toggleRemoved = function()
		{
			var o = {
				uuid:    $scope.edit.uuid,
				removed: !$scope.edit.removed
			}

			//~: prevent repeated clicks from the user
			$scope.edit.removed = !$scope.edit.removed

			AppData.updateFile(o, updateEdit)
		}

		//~: is file modified
		$scope.isModified = function()
		{
			var o = $scope.editSource
			var x = $scope.edit
			if(!x || !o) return

			return (ZeTS.trim(x.name) != ZeTS.trim(o.name))
		}

		//~: commit the edit (name)
		$scope.commit = function()
		{
			if(ZeT.ises($scope.edit.name))
				return

			var o = {
				uuid: $scope.edit.uuid,
				name: $scope.edit.name
			}

			AppData.updateFile(o, updateEdit)
		}

		//~: open add filed dialog
		$scope.addFiles = function()
		{
			$rootScope.$broadcast('content-hide')
			$rootScope.$broadcast('content-add-media', {
				$scope: $scope, event: 'content-media'
			})
		}

		//~: tags update callback
		function tagsSel(x, opts)
		{
			function done(reload)
			{
				$element.show()
				if(reload !== false)
					$scope.$broadcast('content-media')
			}

			//?: {selected nothing}
			if(x === false)
				return done(false)

			//!: send update requests
			var i = 0; function next()
			{
				if(i >= x.length) return done()
				AppData.updateFile(x[i++], next)
			}

			next() //<-- the first request of the chain
		}
	})

	//~: select media controller
	screener.controller('selectMediaCtrl', function($rootScope, $scope, $element, $timeout)
	{
		setupDefaults($scope, $element, { objects: 'media' })
		$scope.view.select = true

		//~: load the data
		$scope.$on('content-select-media', function(e, opts)
		{
			$scope.opts = opts || {}
			$scope.selected = {}

			loadData('tags', function()
			{
				loadData('media', function(media)
				{
					$scope.media = media
					$scope.doFilter()

					$timeout(bindCardAbsBorderLayout($element))
				})
			})
		})

		function clean()
		{
			$scope.opts = null
			delete $scope.selected
			delete $scope.tagsSel
			delete $scope.media
		}

		//~: cancel action
		$scope.cancel = function()
		{
			var opts = $scope.opts
			clean()

			$rootScope.$broadcast('content-hide')
			opts.cancelled = true
			opts.$scope.$broadcast(opts.event, opts)
		}

		//~: select action
		$scope.select = function(file)
		{
			var opts = $scope.opts
			if(opts.multiple === true) return
			clean()

			ZeT.timeout(250, function()
			{
				$rootScope.$broadcast('content-hide')
				opts.file = file.uuid
				$scope.selected = {}
				opts.$scope.$broadcast(opts.event, opts)
			})
		}

		//~: select multiple action
		$scope.selectMulti = function()
		{
			var sel = ZeT.keys($scope.selected)

			if(!sel.length) return errorMsg(
				'Error!', 'Select at least one file!')

			var opts = $scope.opts
			clean()

			$rootScope.$broadcast('content-hide')
			opts.file = sel
			$scope.selected = {}
			opts.$scope.$broadcast(opts.event, opts)
		}
	})

	//~: add media controller
	screener.controller('addMediaCtrl', function($rootScope, $scope, $element, $timeout)
	{
		setupDefaults($scope, $element)
		$scope.media = []

		//~: load the data
		$scope.$on('content-add-media', function(e, opts)
		{
			$scope.opts = opts || {}
			$timeout(bindCardAbsBorderLayout($element))
		})

		//~: close action
		$scope.close = function(sch)
		{
			var opts = $scope.opts
			delete $scope.opts

			$rootScope.$broadcast('content-hide')
			if(opts.$scope && ZeT.iss(opts.event))
				opts.$scope.$broadcast(opts.event, opts)
		}

		//~: handle file upload
		ZeT.scope(function()
		{
			var current, load = 0

			function onSubmit()
			{
				$scope.currentLoad = ++load
				enableFileUpload(false)
				$scope.$apply()
			}

			function onNext(e, fs)
			{
				ZeT.assert(fs && fs.length == 1)
				var f = fs[0], i, n = f.name, s = f.size, m = f.mime

				//~: file name
				ZeT.asserts(n)

				//~: file size
				ZeT.assert(!s || ZeT.isn(s))

				//~: file extension
				if((i = n.lastIndexOf('.')) > 0)
				{
					e = n.substring(i + 1)
					n = n.substring(0, i)

					ZeT.asserts(n)
					ZeT.asserts(e)
				}

				//~: mime type (if missing)
				if(ZeT.ises(m) && !ZeT.ises(e))
					m = Mime.ext2mime(e)

				//~: push the file
				$scope.media.unshift(current = {
					name: n, ext: e, mime: m, size: s, progress: 0, loadIndex: load
				})

				$scope.$apply()
			}

			function onProgress(e, i)
			{
				if(!current || !ZeT.isn(i)) return

				current.progress = Math.round(i)
				$scope.$apply()
			}

			function onComplete(fn, fo)
			{
				current = null
				enableFileUpload(true)
			}

			function onError()
			{
				if(current) current.error = true
				onComplete()
			}

			AppData.uploadFiles({
				url: '/add/mediafile',
				input: $element.find('.btn-file input'),
				onSubmit: onSubmit,
				onProgress: onProgress,
				onComplete: onComplete,
				onError: onError,
				onNext: onNext
			})
		})

		function enableFileUpload(enable)
		{
			var b = $element.find('.btn-file')
			var f = b.find('input')

			b.toggleClass('disabled', !enable)
			f.prop('disabled', !enable)
		}
	})

	//~: style of schedule tasks
	function scheduleTaskStyles()
	{
		function timeColor(time)
		{
			ZeT.assert(ZeT.isi(time))

			return $.Color({
				hue: (time % 31) * 10,
				saturation: 0.5,
				lightness: 0.4,
				alpha: 1
			})
		}

		function itask(task, sc)
		{
			ZeT.assert(ZeT.isi(task))
			return ZeT.assertn(sc.tasks[task])
		}

		function isBackTask(task, sc)
		{
			//?: {single task}
			if(sc.tasks.length < 2)
				return false

			//?: {is not a background task}
			if(task.duration || task.repeat)
				return false

			return true
		}

		function backTaskIndex(i, sc)
		{
			//~: go up for a back task
			for(var j = i;(j >= 0);j--)
				//?: {is back task}
				if(isBackTask(itask(j, sc), sc))
					break

			return j
		}

		return {

			taskBackLineStyle    : function(i, sc)
			{
				var j = backTaskIndex(i, sc)

				//?: {wrong tasks schedule | is background}
				if((j < 0) || (i == j)) return

				return { borderLeftStyle: 'dashed',
					borderLeftColor: timeColor(itask(j, sc).time).toHexString()
				}
			},

			taskActiveLineStyle  : function(task, sc)
			{
				//?: {is a regular task}
				return !isBackTask(task = itask(task, sc), sc)?(null):{
					borderLeftColor: timeColor(task.time).toHexString()
				}
			},

			taskHeaderStyle      : function(task, sc)
			{
				//?: {is a regular task}
				return !isBackTask(task = itask(task, sc), sc)?(null):{
					background: timeColor(task.time).toHexString(),
					borderColor: timeColor(task.time).toHexString()
				}
			},

			taskIsBackContinues  : function(i, sc)
			{
				return (sc.tasks.length > 1) &&
				  !isBackTask(itask(i, sc), sc) &&
				  (backTaskIndex(i, sc) >= 0)
			},

			taskCoHeaderStyle    : function(i, sc)
			{
				var j = backTaskIndex(i, sc)

				return (j < 0)?(null):{
					background: timeColor(itask(j, sc).time).toHexString()
				}
			},

			taskCoTimeStyle      : function(i, sc)
			{
				var j = backTaskIndex(i, sc)

				return (j < 0)?(null):{
					color: timeColor(itask(j, sc).time).toHexString()
				}
			},

			taskCoLinesStyle     : function(i, sc)
			{
				var j = backTaskIndex(i, sc)

				return (j < 0)?(null):{
					borderLeftColor: timeColor(itask(j, sc).time).toHexString()
				}
			},

			taskCoBackTime       : function(i, sc)
			{
				var j = backTaskIndex(i, sc)
				return (j < 0)?(null):(itask(j, sc).time)
			}
		}
	}

	//~: schedules controller
	screener.controller('schedulesCtrl', function($rootScope, $scope, $element, $timeout)
	{
		setupDefaults($scope, $element, { to: $timeout,
		  objects: 'schedules', tagsSel: tagsSel
		})

		//~: style of schedule tasks
		ZeT.extend($scope, scheduleTaskStyles())

		//~: load the data
		$scope.$on('content-schedules', function()
		{
			$scope.schedules = []

			loadData(true, 'schedules', function(schedules)
			{
				loadData('tags', function()
				{
					loadData('media', function()
					{
						$scope.schedules = schedules
						$scope.doFilter()

						$timeout(bindCardAbsBorderLayout($element))
					})
				})
			})
		})

		//~: edit
		$scope.$on('edit', function(e, obj)
		{
			ZeT.assert(ZeT.iso(obj))

			$scope.editSource = obj
			$scope.edit = ZeT.deepClone(obj)
			$scope.$apply()
		})

		//~: is file modified
		$scope.isModified = function()
		{
			var o = $scope.editSource
			var x = $scope.edit
			if(!x || !o) return

			return (ZeTS.trim(x.title) != ZeTS.trim(o.title))
		}

		//~: commit the edit (title)
		$scope.commit = function()
		{
			if(ZeT.ises($scope.edit.title))
				return

			var o = {
				uuid:  $scope.edit.uuid,
				title: $scope.edit.title
			}

			AppData.updateSch(o, updateSch)
		}

		//~: handles update of the edited schedule
		function updateSch()
		{
			ZeT.extend($scope.editSource, $scope.edit)
			$scope.$broadcast('fog-close')
			$scope.$apply()
		}

		//~: set removed or restored
		$scope.toggleRemoved = function()
		{
			var o = {
				uuid:    $scope.edit.uuid,
				removed: !$scope.edit.removed
			}

			//~: prevent repeated clicks from the user
			$scope.edit.removed = !$scope.edit.removed

			AppData.updateSch(o, updateSch)
		}

		//~: create new schedule
		$scope.createSchedule = function(src)
		{
			$rootScope.$broadcast('content-hide')
			$rootScope.$broadcast('content-create-schedule', {
				$scope: $scope, event: 'content-schedules', source: src
			})
		}

		//~: collapse all blocks
		$scope.collapseAll = function()
		{
			ZeT.each($scope.schedules, function(sc){ delete sc.expanded })
		}

		//~: tags update callback
		function tagsSel(x, opts)
		{
			function done(reload)
			{
				$element.show()
				if(reload !== false)
					$scope.$broadcast('content-schedules')
			}

			//?: {selected nothing}
			if(x === false)
				return done(false)

			//!: send update requests
			var i = 0; function next()
			{
				if(i >= x.length) return done()
				AppData.updateSch(x[i++], next)
			}

			next() //<-- the first request of the chain
		}
	})

	function keyNumbers(e)
	{
		var key = e.charCode || e.keyCode || 0
		return key == 8 || key == 9 ||  key == 13 || key == 46  ||
		  key == 110 || key == 190  || (key >= 35 && key <= 40) ||
		 (key >= 48 && key <= 57)   || (key >= 96 && key <= 105)
	}

	//~: create schedule controller
	screener.controller('createScheduleCtrl', function($rootScope, $scope, $element, $timeout)
	{
		setupDefaults($scope, $element)

		//~: style of schedule tasks
		ZeT.extend($scope, scheduleTaskStyles())

		//~: load the data
		$scope.$on('content-create-schedule', function(e, opts)
		{
			$scope.edit = { time: 0 }
			$scope.opts = opts || {}
			$scope.sc   = ZeT.deepClone(opts.source) || {}

			delete $scope.sc.uuid
			delete $scope.sc.title

			//~: create the default task
			if(!$scope.sc.tasks)
				$scope.sc.tasks = [{ time: 0, files: [ {} ]}]

			$timeout(bindCardAbsBorderLayout($element))
		})

		//~: display cancel confirmation dialog
		$scope.askCancel = function(event)
		{
			$scope.$broadcast('fog-show')

			$element.find('.ask-cancel').show().position({
				my: 'center top', at: 'center bottom',
				of: event.delegateTarget
			})
		}

		//~: cancel confirmed
		$scope.cancelConfirmed = function()
		{
			var opts = $scope.opts
			$scope.opts = null

			$scope.$broadcast('fog-close')
			$rootScope.$broadcast('content-hide')
			opts.cancelled = true
			opts.$scope.$broadcast(opts.event, opts)
		}

		function validate()
		{
			var sch = ZeT.assertn($scope.sc)

			if(ZeT.ises(sch.title)) return {
				e: '.media-edit-file-name input',
				m: 'Set schedule title!'
			}

			if(!ZeT.isa(sch.tasks) || !sch.tasks.length)
				return 'Schedule has no tasks!'

			function isb(task) //<-- is a back task
			{
				return ZeT.isu(task.repeat) && ZeT.isu(task.duration)
			}

			for(var i = 0;(i < sch.tasks.length);i++)
			{
				var t = sch.tasks[i], p = sch.tasks[i-1]
				var x = '.schedule-task-' + i

				ZeT.assert(ZeT.isi(t.time))
				if((i == 0) && (t.time !== 0)) return {
					m: 'The first task must start from 00:00:00!',
					e: x + ' .edit-time'
				}

				if((i == 0) && !ZeT.isu(t.repeat)) return {
					m: 'The first task must be background: unlimited repeat number ∞!',
					e: x + ' .schedule-task-repeat'
				}

				if((i == 0) && !ZeT.isu(t.duration)) return {
					m: 'The first task must be background: unlimited repeat number ∞' +
					   ' and without the duration set!',
					e: x + ' .schedule-task-duration'
				}

				if(!t.strict && !(t.threshold > 0)) return {
					m: 'Non strict task may not have zero the start threshold!',
					e: x + ' .schedule-task-threshold'
				}

				if(!ZeT.isu(t.repeat) && !ZeT.isu(t.duration)) return {
					m: 'Task may not have the duration and the repeat number simultaneously!',
					e: x + ' .schedule-task-repeat'
				}

				if(p && (t.time < p.time)) return {
					m: 'Time of a following task must be after the time of the previous!',
					e: x + ' .edit-time'
				}

				if(p && (t.time == p.time) && !(isb(p) && !isb(t))) return {
					m: 'Time of a following task may be the same as the time of the ' +
					   'previous one only if previous is background, and current is not!',
					e: x + ' .edit-time'
				}

				if(!ZeT.isa(t.files) || !t.files.length) return {
					e: x + '> header', m : 'The task has no files!'
				}

				for(var j = 0;(j < t.files.length);j++)
				{
					var f = t.files[j]
					var y = x + ' .schedule-file-' + j

					if(ZeT.ises(f.uuid)) return {
						e: y, m: 'Select a file!'
					}

					var fi = $scope.getFile(f.uuid)
					if(!fi) return { e: y, m: 'File is not found!' }

					var m = $scope.mediaType(fi)

					if(m == 'image' && !f.duration) return {
						e: y, m: 'Image must have the duration assigned!'
					}

					if(!ZeT.isu(f.repeat) && !ZeT.isu(f.duration)) return {
						e: y, m: 'File may not have the duration and ' +
						  'the repeat number simultaneously!'
					}
				}
			}
		}

		//~: submit action
		$scope.submit = function()
		{
			var error; if(error = validate())
				return $scope.$broadcast('error-fog-show', error)

			AppData.createSch($scope.sc, function(x)
			{
				var opts = $scope.opts
				$scope.opts = null

				$rootScope.$broadcast('content-hide')
				opts.schedule = x
				opts.$scope.$broadcast(opts.event, opts)
			})
		}

		function displayTimeEditor(e, cls)
		{
			var tte = $element.find('.time-triple-edit')

			$scope.$broadcast('fog-show')

			tte.removeClass().addClass('time-triple-edit')
			if(ZeT.iss(cls)) tte.addClass(cls)

			tte.show().position({ my: 'left top', at: 'left top',
			  of: $(e.delegateTarget).find('.time-triple')
			})

			tte.find('> div').hide()
		}

		//~: click to edit task time
		$scope.editTime = function(task, e)
		{
			$scope.edit = task
			$scope.edit.timeEdit = task.time
			$scope.edit.timeWhat = 'time'

			displayTimeEditor(e, 'task-time')
		}

		//~: on task strict flag updated
		$scope.strictChanged = function(task)
		{
			if(!task.strict && !task.threshold)
				task.threshold = 15 * 60 * 1000
		}

		//~: edit non-strict task threshold
		$scope.editThreshold = function(task, e)
		{
			$scope.edit = task
			$scope.edit.timeEdit = task.threshold || 0
			$scope.edit.timeWhat = 'threshold'

			displayTimeEditor(e, 'schedule-task-duration task-time')
		}

		//~: click to edit task duration
		$scope.editDuration = function(task, e)
		{
			$scope.edit = task
			$scope.edit.timeEdit = task.duration || 0
			$scope.edit.timeWhat = 'duration'

			displayTimeEditor(e, 'schedule-task-duration task-time')
		}

		//~: click to edit file duration
		$scope.editFileDuration = function(file, e)
		{
			$scope.edit = file
			$scope.edit.timeEdit = file.duration || 0
			$scope.edit.timeWhat = 'duration'

			displayTimeEditor(e, 'schedule-task-duration')
		}

		//~: done editing time
		$scope.$on('time-edited', function(e)
		{
			$scope.timeEdited = true

			if(($scope.edit.timeWhat == 'duration') && $scope.edit.timeEdit)
				delete $scope.edit.repeat
		})

		//~: close fog, every edit done
		$scope.$on('fog-close', function()
		{
			$element.find('.time-triple-edit, .repeat-edit').hide()

			if($scope.timeEdited === true)
			{
				var what = ZeT.asserts($scope.edit.timeWhat)
				$scope.edit[what] = $scope.edit.timeEdit

				delete $scope.timeEdited
				delete $scope.edit.timeWhat
				delete $scope.edit.timeEdit

				if(what == 'time')
					$scope.sc.tasks.sort(function(l, r)
					{
						return l.time - r.time
					})

				$scope.$apply()
			}

			if(!ZeT.isx(ZeT.get($scope.edit, 'repeatEdit')))
			{
				var v = $scope.edit.repeatEdit
				delete $scope.edit.repeatEdit

				if(v == '∞') {
					delete $scope.edit.repeat
					delete $scope.edit.duration
				}

				if(ZeT.iss(v) && v.match(/^\d+$/))
					v = parseInt(v)

				if(ZeT.isi(v))
				{
					if(v != ($scope.edit.repeat || 0))
						delete $scope.edit.duration

					if(v == 0) delete $scope.edit.repeat
					else $scope.edit.repeat = v
				}

				$scope.$apply()
			}
		})

		function displayRepeatEditor(e, cls)
		{
			var re = $element.find('.repeat-edit')

			$scope.$broadcast('fog-show')

			re.removeClass().addClass('repeat-edit')
			if(ZeT.iss(cls)) re.addClass(cls)

			re.show().position({ of: $(e.delegateTarget),
			  my: 'left top', at: 'left top-8'
			})

			re.find('> div').hide()
		}

		//~: react on repeat click
		$element.find('.repeat-edit').click(function(e)
		{
			var v, x = $(e.target)
			var t = x[0].tagName.toLowerCase()

			if(t == 'td')
				v = x.find('span').text()
			else if(t == 'span')
				v = x.text()

			if((v == '∞') || v && v.match(/^\d+$/))
			{
				$scope.edit.repeatEdit = (v == '∞')?('∞'):parseInt(v)
				$scope.$broadcast('fog-close')
			}
		})

		$element.find('.repeat-edit input').keydown(keyNumbers)

		//~: click to edit task repeat count
		$scope.editRepeat = function(task, e)
		{
			$scope.edit = task
			$scope.edit.repeatEdit = task.repeat

			displayRepeatEditor(e, 'task-repeat')
		}

		//~: click to edit file repeat count
		$scope.editFileRepeat = function(file, e)
		{
			$scope.edit = file
			$scope.edit.repeatEdit = file.repeat

			displayRepeatEditor(e, 'file-repeat')
		}

		//~: open select file dialog
		$scope.selectFile = function(task, slot, multiple)
		{
			$rootScope.$broadcast('content-hide')
			$rootScope.$broadcast('content-select-media', {
				$scope: $scope, event: 'file-selected',
				task: task, slot: slot, cancel: true,
				multiple: !!multiple
			})
		}

		//~: do select file in task slot
		$scope.$on('file-selected', function(e, msg)
		{
			$element.show()

			if(msg.cancelled == true)
			{
				if(!msg.slot.uuid)
					ZeTA.remove(msg.task.files, msg.slot)

				return
			}

			$timeout(function()
			{
				var files = msg.file
				var    ii = msg.task.files.indexOf(msg.slot)
				ZeT.assert(ii >= 0)

				if(ZeT.iss(files)) files = [ files ]
				ZeT.asserta(files)

				ZeT.each(files, function(f, i)
				{
					ZeT.asserts(f)

					if(i == 0)
						msg.slot.uuid = f
					else
						$scope.addTaskFile(msg.task, ii + i, f)
				})
			})
		})

		//~: add file to a task
		$scope.addTaskFile = function(task, index, uuid)
		{
			var file = {}

			if(!task.files) task.files = []
			if(index >= task.files.length)
				task.files.push(file)
			else
				task.files.splice(index, 0, file)

			if(uuid) file.uuid = uuid; else
				$scope.selectFile(task, file, true)
		}

		//~: delete file from a task
		$scope.delTaskFile = function(task, index)
		{
			ZeT.assert(index >= 0 && index < task.files.length)
			ZeT.assert(task.files.length > 1)

			task.files.splice(index, 1)
		}

		//~: move task file
		$scope.moveTaskFile = function(task, index, dir)
		{
			var i = index, j = index + dir

			ZeT.assert(dir == -1 || dir == +1)
			ZeT.assert(i >= 0 && i < task.files.length)
			ZeT.assert(j >= 0 && j < task.files.length)

			var x = task.files[i]
			task.files[i] = task.files[j]
			task.files[j] = x
		}

		//~: add task
		$scope.addTask = function(i)
		{
			var task = { time: 0, repeat: 1,
				threshold: 15 * 60 * 1000, files: [{}]
			}

			//?: {schedule has no tasks}
			if(!$scope.sc.tasks)
				$scope.sc.tasks = []

			//~: append or insert
			if(!ZeT.isi(i) || (i >= $scope.sc.tasks.length))
				$scope.sc.tasks.push(task)
			else
				$scope.sc.tasks.splice(i, 0, task)

			//?: {lone task}
			if($scope.sc.tasks.length == 1) return

			//~: select the middle time
			i = $scope.sc.tasks.indexOf(task)
			var b = (i == 0)?(0):($scope.sc.tasks[i - 1].time)
			var e = (i + 1 >= $scope.sc.tasks.length)?
			  (24 * 60 * 60 * 1000):($scope.sc.tasks[i + 1].time)

			task.time = b + 1000 * 60 *
			  Math.round(0.5 * (e - b) / (60 * 1000))
		}

		//~: delete task
		$scope.delTask = function(index, event)
		{
			var tasks = $scope.sc.tasks

			ZeT.assert(index >= 0 && index < tasks.length)
			ZeT.assert(tasks.length > 1)
			ZeT.assertn(event)

			$scope.deleteTaskIndex = index
			$scope.$broadcast('fog-show')

			$element.find('.ask-delete-task').show().position({
				my: 'left center', at: 'right+4 center',
				of: event.delegateTarget
			})
		}

		//~: delete task (confirmed)
		$scope.delTaskConfirmed = function()
		{
			var index = $scope.deleteTaskIndex
			delete $scope.deleteTaskIndex
			ZeT.assert(ZeT.isi(index))

			$scope.sc.tasks.splice(index, 1)
			$scope.$broadcast('fog-close')
		}
	})

	//~: select schedule controller
	screener.controller('selectScheduleCtrl', function($rootScope, $scope, $element, $timeout)
	{
		setupDefaults($scope, $element, { objects: 'schedules' })

		//~: load the data
		$scope.$on('content-select-schedule', function(e, opts)
		{
			$scope.opts = opts || {}

			loadData('schedules', function(schedules)
			{
				loadData('tags', function()
				{
					$scope.schedules = schedules
					$scope.doFilter()

					$timeout(bindCardAbsBorderLayout($element))
				})
			})
		})

		//~: cancel action
		$scope.cancel = function(sch)
		{
			var opts = $scope.opts
			$scope.opts = null

			$rootScope.$broadcast('content-hide')
			opts.cancelled = true
			$scope.selected = {}
			opts.$scope.$broadcast(opts.event, opts)
		}

		//~: select action
		$scope.select = function(sch)
		{
			var opts = $scope.opts
			$scope.opts = null

			ZeT.timeout(250, function()
			{
				$rootScope.$broadcast('content-hide')
				opts.schedule = sch
				$scope.selected = {}
				opts.$scope.$broadcast(opts.event, opts)
			})
		}
	})

	//~: device schedules controller
	screener.controller('deviceSchedulesCtrl', function($rootScope, $scope, $element, $timeout)
	{
		setupDefaults($scope, $element, { objects: 'schedules', filter: { filters: fdate }})

		ZeT.extend($scope.view, { list: true, removed: true })
		$scope.currentDate = jQuery.fullCalendar.moment()

		//~: style of schedule tasks
		ZeT.extend($scope, scheduleTaskStyles())

		//~: schedules date filter
		function fdate(o)
		{
			return $scope.currentDate.isSame(o.ts, 'month')
		}

		//~: request a device schedules
		$scope.$on('get-device-schedules', function(e, dev)
		{
			ZeT.asserts(dev && dev.uuid)

			$scope.dev = dev
			$scope.schedules = []
			$scope.view.updated = false

			//~: load the data
			loadData('schedules', function()
			{
				loadData('media', function()
				{
					AppData.get('devschs', { uuid: dev.uuid }, function(scs)
					{
						scs = scs || []

						for(var i = 0;(i < scs.length);i++)
						{
							ZeT.extend(scs[i], globalDataMap[scs[i].schedule])
							scs[i].olduuid = scs[i].uuid
						}

						//~: sort the schedules by the time ascending
						scs.sort(function(l, r){ return l.ts - r.ts })
						$scope.schedules = scs
						$scope.doFilter()

						$rootScope.$broadcast('content-device-schedules')
						$scope.$broadcast('display-calendar-events')

						$timeout(bindCardAbsBorderLayout($element))
					})
				})
			})
		})

		//~: initialize and access the calendar
		function initFullCalendar()
		{
			if($scope.view.calendar)
				return $scope.view.calendar

			var c = $scope.view.calendar =
			  $element.find('.full-calendar').
			  addClass('no-transition-all')

			c.fullCalendar({

				lang: 'ru',

				defaultDate: $scope.currentDate,
				defaultView: 'month',
				header: false,
				handleWindowResize: false,
				dayRender: initDayCell
			})

			//~: hook window resize
			$(window).on('resize', calendarResize)

			c.find('.fc-icon').removeClass('fc-icon')
			c.find('.fc-button-group').removeClass().
				addClass('btn-group btn-group-sm').
				find('button').removeClass().
					addClass('btn btn-default-outline')

			return c
		}

		//~: display the calendar
		$scope.$on('view-calendar', function()
		{
			//?: {already created the calendar}
			if($scope.view.calendar)
				//~: prepare the events
				$scope.$broadcast('display-calendar-events')
			//~: initialize the calendar
			else $timeout(function()
			{
				initFullCalendar()

				//~: prepare the events
				$scope.$broadcast('display-calendar-events')
			})

			//~: show the component
			$scope.view.list = false
			$scope.$apply()
		})

		function calendarResize()
		{
			var c = $scope.view.calendar
			if(!c || !c.is(':visible')) return

			var b = $element.find('.card-block')
			var h = b.children().first()

			c.fullCalendar('option', 'height', b.height() - h.outerHeight())
		}

		var prevSelection

		function initDayCell(mo, cell)
		{
			cell.append($('<div>'))
			cell.append($('<footer>'))

			fillDayCell.call(cell)
			initCellControls(mo, cell)
		}

		function initCellControls(mo, cell)
		{
			var div, del, sel, copy, paste

			if(cell.find('section.schedule-cell-controls').length) return
			cell.prepend(div = $('<section class = "schedule-cell-controls">'))

			div.append(del = $('<button class = "btn btn-sm btn-danger-outline" title = "Erase">'))
			del.append('<i class="fa fa-trash-o"/>')

			div.append(paste = $('<button class = "btn btn-sm btn-warning-outline" title = "Insert">'))
			paste.append('<i class="fa fa-paste"/>')

			div.append(sel = $('<button class = "btn btn-sm btn-success-outline" title = "Select">'))
			sel.append('<i class="fa fa-clock-o"/>')

			div.append(copy = $('<button class = "btn btn-sm btn-info-outline" title = "Copy">'))
			copy.append('<i class="fa fa-copy"/>')

			del.click(function()
			{
				replaceSchedule(mo, prevSelection = null)
			})

			paste.click(function()
			{
				if(prevSelection) replaceSchedule(mo, prevSelection)
			})

			sel.click(function()
			{
				$scope.$broadcast('content-hide')
				$rootScope.$broadcast('content-select-schedule', {
					$scope: $scope, event: 'set-device-schedule',
					day: mo, cancel: true
				})
			})

			cell.off('click').click(function(event)
			{
				var c = $scope.view.calendar
				var f = $(this).hasClass('focus')

				if(this != $(event.target).parent()[0]) return
				c.find('td.fc-day.fc-widget-content').removeClass('focus')
				$(this).toggleClass('focus', !f)
			})

			copy.click(function()
			{
				prevSelection = ZeT.deepClone(ZeT.assertn(dayScheduleClose(mo)))

				//~: clear the state
				ZeT.each([ 'at', 'ts', 'pruned', 'updated', 'olduuid'],
				  function(k){ delete prevSelection[k]})

				$scope.view.calendar. //<-- show paste button
					find('.schedule-cell-controls button:nth-child(2)').show()
			})
		}

		function fillDayCell()
		{
			var cell  = $(this)
			var c     = $scope.view.calendar
			var mo    = $.fullCalendar.moment(ZeT.asserts(cell.data('date')))
			var dts   = mo.toDate().setUTCHours(0, 0, 0, 0)
			var sch   = dayScheduleClose(mo)
			var div   = cell.children('div')
			var txt   = div.find('span')
			var day   = div.find('.fc-day-number')
			var cells = c.find('td[data-date="' + cell.data('date') + '"]')

			div.toggleClass('calendar-day-0X', mo.date() < 10)
			cells.removeClass('schedule-event schedule-prev-event')

			if(!day.length) div.append(day = $('<div class = "fc-day-number">'))
			if(!txt.length) div.append(txt = $('<span>'))
			day.text('' + mo.date())

			//?: {scheduler found is not exactly for this day}
			if(sch && (sch.ts == dts))
			{
				var col = colorUUID(sch.uuid)

				cells.addClass('schedule-event')
				txt.text('')
				div.css('height', '').css({
					backgroundColor: col.toHexString(),
					borderColor: col.invert().toHexString()
				})
				txt.text(sch.title)
			}
			else
			{
				txt.text('')
				div.css({ height: '', borderColor: '', backgroundColor: '' })

				//?: {effective previous schedule does not exist}
				if(!sch) return

				cells.addClass('schedule-prev-event')
				cells.find('footer').css('background-color',
				  colorUUID(sch.uuid).toHexString())

				//?: {this is the very first cell}
				var xc = c.find('td.fc-day.fc-widget-content').first()
				if(xc[0] == cells[0]) txt.text(sch.title)
			}
		}

		function fillDayCells()
		{
			var c = $scope.view.calendar

			c.find('td.fc-day, td.fc-day-number').
			  removeClass('schedule-event')

			c.find('td.fc-day.fc-widget-content').each(fillDayCell)
		}

		function daySchedule(mo, pruned)
		{
			var dts = mo.toDate().setUTCHours(0, 0, 0, 0)
			var sch = dayScheduleClose(mo)

			//?: {not exact day match}
			if(sch && (sch.ts != dts)) sch = null

			return (!pruned && sch && (sch.removed || sch.pruned))?(null):(sch)
		}

		/**
		 * Finds the schedule the most close to
		 * the day given and not after it.
		 */
		function dayScheduleClose(mo)
		{
			var sch = $scope.schedules
			if(!sch.length) return

			var dts = mo.toDate().setUTCHours(0, 0, 0, 0)
			var   i = Lo.sortedIndexBy($scope.schedules, { ts: dts },
			  function(x){ return x.ts })

			//?: {over the end}
			if(i >= sch.length) i = sch.length - 1

			//?: {has the day after}
			if(sch[i].ts > dts) i--

			//?: {not found}
			if(i < 0) return

			ZeT.assert(sch[i].ts <= dts)

			//?: {schedule is pruned} look before
			if(sch[i].pruned)
				return dayScheduleClose($.fullCalendar.moment(sch[i].ts - 1))

			return sch[i]
		}

		$scope.$on('display-calendar-events', function()
		{
			if(!$scope.view.calendar) return

			calendarResize()
			$scope.view.calendar.fullCalendar('gotoDate', $scope.currentDate)
			if($scope.schedules) fillDayCells()

			prevSelection = null //<-- hide paste button
			$scope.view.calendar.find('.schedule-cell-controls button:nth-child(2)').hide()
		})

		$scope.$on('set-device-schedule', function(e, sel)
		{
			$scope.$broadcast('content-device-schedules')

			if(!sel.cancelled) $timeout(function()
			{
				replaceSchedule(sel.day, sel.schedule)
			})
		})

		//~: replace the schedule
		function replaceSchedule(day, sch)
		{
			var old = daySchedule(ZeT.assertn(day), true)

			//?: {nothing happened}
			if(!old && !sch) return

			//?: {do replace}
			if(old && sch)
			{
				//?: {the schedule is not the same}
				if(old.uuid !== sch.uuid)
					ZeT.extend(old, sch)

				delete old.pruned
				old.updated = (old.olduuid != old.uuid)
			}
			//?: {do remove}
			else if(old && !sch)
			{
				//?: {removed freshly added record}
				if(old.olduuid == '')
					ZeTA.remove($scope.schedules, old)
				else
					old.pruned = old.updated = true
			}
			//?: {assign new record}
			else if(!old && sch)
			{
				var ts = (day = day.utc()).toDate().getTime()

				old = { ts: ts, at: day.format(), updated: true, olduuid: '' }
				sch = ZeT.extend(old, sch)

				ZeT.each($scope.schedules, function(s, i)
				{
					if(s.ts < ts) return
					$scope.schedules.splice(i, 0, sch)
					return false
				})

				if(sch && !ZeT.ii($scope.schedules, sch))
					$scope.schedules.push(sch)
			}

			$scope.view.updated = false
			ZeT.each($scope.schedules, function(s) {
				if(s.updated) { $scope.view.updated = true; return false }
			})

			if($scope.view.updated)
				pulseHelp('commit-updates')

			fillDayCells()
		}

		function pulseHelp(cls)
		{
			$element.find('.calendar-hints > span').hide()
			$element.find('.' + cls).show()

			if(cls != 'click-to-edit')
			{
				var ts = new Date().getTime()
				pulseHelp.ts = ts

				$element.find('.' + cls).velocity(
					{ backgroundColor: '#FFFF00' },
					{ duration: 1000, loop: 4, easing: 'easeOutQuart' }
				)

				ZeT.timeout(8000, function()
				{
					if(pulseHelp.ts != ts) return

					$element.find('.' + cls).hide()
					$element.find('.click-to-edit').show()
				})
			}
		}

		function collectChanges()
		{
			var r = { removed: [], assigned: [], replaced: [] }

			ZeT.each($scope.schedules, function(s)
			{
				if(!s.updated) return

				var o = { ts: s.ts, at: s.at }

				if(s.pruned)
				{
					o.uuid = ZeT.asserts(s.olduuid)
					r.removed.push(o)
				}
				else if(ZeT.ises(s.olduuid))
				{
					o.uuid = ZeT.asserts(s.uuid)
					r.assigned.push(o)
				}
				else
				{
					o.uuid = ZeT.asserts(s.uuid)
					o.olduuid = s.olduuid
					r.replaced.push(o)
				}
			})

			return r
		}

		//~: ask user whether commit is desired
		$scope.askCommit = function()
		{
			$scope.changes = collectChanges()
			$scope.$broadcast('fog-show')
			$scope.$broadcast('ask-commit')
		}

		//~: send the changes
		$scope.submitChanges = function()
		{
			pulseHelp('click-to-edit')

			var c = $scope.changes
			delete $scope.changes

			if(!c.assigned.length) delete c.assigned
			if(!c.removed.length)  delete c.removed
			if(!c.replaced.length) delete c.replaced

			//?: {has nothing to send}
			if(!c.assigned && !c.removed && !c.replaced)
				return done()

			function done()
			{
				$scope.$broadcast('fog-close')
				$scope.$broadcast('get-device-schedules', $scope.dev)
			}

			c.device = $scope.dev.uuid
			AppData.setDevSchs([ c ], done)
		}

		//~: move to the previous the or next month
		$scope.goPrevNext = function(next)
		{
			var c = $scope.view.calendar

			if(!c || !c.is(':visible'))
			{
				$scope.currentDate = $scope.currentDate.add(next?(+1):(-1), 'M')
				$scope.doFilter()
			}
			else
			{
				c.fullCalendar(next?('next'):('prev'))
				$scope.currentDate = c.fullCalendar('getDate')
				calendarResize()
			}
		}
	})

	//~: device documents controller
	screener.controller('deviceDocsCtrl', function($rootScope, $scope, $element, $timeout)
	{
		setupDefaults($scope, $element)
		$scope.view = { select: false }

		//~: request a device schedules
		$scope.$on('get-device-docs', function(e, dev)
		{
			ZeT.asserts(dev && dev.uuid)

			$scope.dev = dev
			$scope.docs = []

			//~: load the data
			loadData('tags', function()
			{
				loadData('docs', function()
				{
					AppData.get('devdocs', { uuid: dev.uuid }, function(docs)
					{
						for(var i = 0;(i < docs.length);i++)
							docs[i] = ZeT.assertn(globalDataMap[docs[i]])

						$scope.docs = docs

						$rootScope.$broadcast('content-device-docs')
						$timeout(bindCardAbsBorderLayout($element))
					})
				})
			})
		})

		$scope.$on('selected-device-docs', function(e, opts)
		{
			if(opts.cancelled)
				return $rootScope.$broadcast('content-device-docs')

			var res = [], sel = opts.selected
			ZeT.assert(ZeT.iso(sel))
			ZeT.each(sel, function(v, k)
			{
				if(v === true) res.push(k)
			})

			AppData.setDevDocs($scope.dev.uuid, res, function()
			{
				$rootScope.$broadcast('get-device-docs', $scope.dev)
			})
		})

		//~: open select documents dialog
		$scope.selectDocs = function()
		{
			AppData.get('devdocs', { uuid: $scope.dev.uuid }, function(docs)
			{
				var sel = {}; ZeT.each(docs, function(d){ sel[d] = true })

				$rootScope.$broadcast('content-hide')
				$rootScope.$broadcast('content-select-docs', {
					$scope: $scope, event: 'selected-device-docs', selected: sel
				})
			})
		}
	})

	//~: time triple edit
	screener.controller('timeTripleEditCtrl', function($scope, $element)
	{
		function clickNumber(e)
		{
			var x = $(e.target).text()
			if(!x.match(/^\d\d$/)) return
			x = parseInt(x)

			var t = $scope.edit.timeEdit

			if($scope.what == 'ss')
				t = new Date(t).setUTCSeconds(x, 0)
			else if($scope.what == 'mm')
				t = new Date(t).setUTCMinutes(x)
			else if($scope.what == 'HH')
				t = new Date(t).setUTCHours(x)

			$scope.edit.timeEdit = t
			$(e.delegateTarget).hide()
			$scope.$apply()
			$scope.$emit('time-edited')
		}

		var hh = $element.find('.time-triple-edit-hour')
		var ms = $element.find('.time-triple-edit-minsec')

		function appear(at, xx)
		{
			xx.show().position({my: 'left top', at: 'left bottom+10', of: at })
		}

		function clickTime(e)
		{
			$scope.what = $(e.target).data('time')
			if(ZeT.ises($scope.what)) return
			hh.add(ms).hide()
			appear($(e.target), ($scope.what == 'HH')?(hh):(ms))
		}

		hh.add(ms).click(clickNumber)
		$element.find('.time-triple').click(clickTime)
	})

	//~: documents controller
	screener.controller('docsCtrl', function($rootScope, $scope, $element, $timeout)
	{
		setupDefaults($scope, $element, { to: $timeout,
			objects: 'docs', tagsSel: tagsSel
		})

		$scope.view.uploadRename = true

		//~: load the data
		$scope.$on('content-docs', function()
		{
			$scope.docs = []

			loadData('tags', function()
			{
				loadData(true, 'docs', function(docs)
				{
					$scope.docs = docs
					$scope.doFilter()

					$timeout(bindCardAbsBorderLayout($element))
				})
			})
		})

		//~: edit
		$scope.$on('edit', function(e, obj)
		{
			ZeT.assert(ZeT.iso(obj))

			$scope.editSource = obj
			$scope.edit = ZeT.deepClone(obj)
			enableFileUpload(true)
			$scope.$apply()
		})

		//~: handle file upload
		uploadFileBlock('/set/docfile', $scope, $element, enableFileUpload, updateEdit)

		//~: upload enable callback
		function enableFileUpload(enable)
		{
			var b = $element.find('.btn-file')
			var f = b.find('input')

			b.toggleClass('disabled', !enable)
			f.prop('disabled', !enable)
		}

		function updateEdit(fo)
		{
			ZeT.assert(ZeT.iso(fo))
			ZeT.extend($scope.edit, fo)
			ZeT.extend($scope.editSource, fo)
			$scope.$apply()
			$scope.$broadcast('fog-close')
		}

		$scope.toggleRemoved = function()
		{
			var o = {
				uuid: $scope.edit.uuid,
				removed: !$scope.edit.removed
			}

			//~: prevent repeated clicks from the user
			$scope.edit.removed = !$scope.edit.removed

			AppData.updateDoc(o, updateEdit)
		}

		//~: is file modified
		$scope.isModified = function()
		{
			var o = $scope.editSource
			var x = $scope.edit
			if(!x || !o) return

			return !moment(x.date).isSame(o.date) ||
			  (ZeTS.trim(x.name) != ZeTS.trim(o.name))
		}

		//~: submit the edit form
		$scope.commit = function()
		{
			var name = $scope.edit.name
			if(ZeT.ises(name)) return

			var date = $scope.edit.date
			ZeT.assert(ZeT.iss(date) || ZeT.isx(date))
			if(ZeT.ises(date)) date = null

			var o = {
				uuid: $scope.edit.uuid,
				name: name,
				date: date
			}

			AppData.updateDoc(o, updateEdit)
		}

		//~: open add filed dialog
		$scope.uploadFiles = function()
		{
			$rootScope.$broadcast('content-hide')
			$rootScope.$broadcast('content-upload-docs', {
				$scope: $scope, event: 'content-docs'
			})
		}

		//~: tags update callback
		function tagsSel(x, opts)
		{
			function done(reload)
			{
				$element.show()
				if(reload !== false)
					$scope.$broadcast('content-docs')
			}

			//?: {selected nothing}
			if(x === false)
				return done(false)

			//!: send update requests
			var i = 0; function next()
			{
				if(i >= x.length) return done()
				AppData.updateDoc(x[i++], next)
			}

			next() //<-- the first request of the chain
		}
	})

	//~: upload documents controller
	screener.controller('uploadDocsCtrl', function($rootScope, $scope, $element, $timeout)
	{
		setupDefaults($scope, $element)
		$scope.docs = []

		//~: load the data
		$scope.$on('content-upload-docs', function(e, opts)
		{
			$scope.opts = opts || {}
			$timeout(bindCardAbsBorderLayout($element))
		})

		//~: close action
		$scope.close = function(sch)
		{
			var opts = $scope.opts
			delete $scope.opts

			$rootScope.$broadcast('content-hide')
			if(opts.$scope && ZeT.iss(opts.event))
				opts.$scope.$broadcast(opts.event, opts)
		}

		//~: handle file upload
		ZeT.scope(function()
		{
			var current, load = 0

			function onSubmit()
			{
				$scope.currentLoad = ++load
				enableFileUpload(false)
				$scope.$apply()
			}

			function onNext(e, fs)
			{
				ZeT.assert(fs && fs.length == 1)
				var f = fs[0], n = f.name, s = f.size

				//~: file name
				ZeT.asserts(n)

				//~: file size
				ZeT.assert(!s || ZeT.isn(s))

				//~: push the file
				$scope.docs.unshift(current = {
					name: n, size: s, progress: 0, loadIndex: load
				})

				$scope.$apply()
			}

			function onProgress(e, i)
			{
				if(!current || !ZeT.isn(i)) return

				current.progress = Math.round(i)
				$scope.$apply()
			}

			function onComplete(fn, fo)
			{
				current = null
				enableFileUpload(true)
			}

			function onError()
			{
				if(current) current.error = true
				onComplete()
			}

			AppData.uploadFiles({
				url: '/add/docfile',
				input: $element.find('.btn-file input'),
				onSubmit: onSubmit,
				onProgress: onProgress,
				onComplete: onComplete,
				onError: onError,
				onNext: onNext
			})
		})

		function enableFileUpload(enable)
		{
			var b = $element.find('.btn-file')
			var f = b.find('input')

			b.toggleClass('disabled', !enable)
			f.prop('disabled', !enable)
		}
	})

	//~: select documents controller
	screener.controller('selectDocsCtrl', function($rootScope, $scope, $element, $timeout)
	{
		setupDefaults($scope, $element, { objects: 'docs', filter: { removed: fremoved }})
		$scope.view.select = true

		function fremoved(o)
		{
			return $scope.xselected[o.uuid]
		}

		//~: load the data
		$scope.$on('content-select-docs', function(e, opts)
		{
			$scope.opts = opts || {}
			$scope.selected = opts.selected || {}
			$scope.xselected = ZeT.deepClone($scope.selected)
			ZeT.assert(ZeT.iso($scope.selected))

			loadData('tags', function()
			{
				loadData('docs', function(docs)
				{
					$scope.docs = docs
					$scope.doFilter()

					$timeout(bindCardAbsBorderLayout($element))

				})
			})
		})

		function clean()
		{
			$scope.opts = null
			delete $scope.selected
			delete $scope.tagsSel
			delete $scope.xselected
			delete $scope.docs
		}

		//~: cancel action
		$scope.cancel = function()
		{
			var opts = $scope.opts
			clean()

			$rootScope.$broadcast('content-hide')
			opts.cancelled = true
			opts.$scope.$broadcast(opts.event, opts)
		}

		//~: select action
		$scope.select = function(file)
		{
			var opts = $scope.opts

			$rootScope.$broadcast('content-hide')
			opts.selected = $scope.selected
			clean()
			opts.$scope.$broadcast(opts.event, opts)
		}
	})

	//~: merge designated schedules of the selected devices
	screener.controller('mergeDevSchedulesCtrl', function($rootScope, $scope, $element, $timeout)
	{
		setupDefaults($scope, $element)

		//~: load the data
		$scope.$on('content-merge-dev-schedules', function(e, opts)
		{
			ZeT.assert(ZeT.iso(opts))
			ZeT.asserta(opts.devs)

			cleanup()
			$scope.opts = opts

			loadData('schedules', function()
			{
				$scope.d2s = {}
				$scope.loaded = 0

				load(0)

				function load(di)
				{
					if(di >= opts.devs.length)
					{
						$timeout(bindCardAbsBorderLayout($element))
						return prepareMerge()
					}

					AppData.get('devschs', { uuid: opts.devs[di] }, function(scs)
					{
						$scope.d2s[opts.devs[di]] = scs || []
						for(var i = 0;(i < scs.length);i++)
							ZeT.extend(scs[i], globalDataMap[scs[i].schedule])

						$scope.loaded = di
						$scope.$apply()

						//!: invoke the next load
						load(di + 1)
					})
				}
			})
		})

		//~: load progress
		$scope.loadProgress = function()
		{
			if(!$scope.opts) return null

			var lo = $scope.loaded
			var to = $scope.opts.devs.length
			return (lo + 1 === to)?(100):Math.floor(100.0 * lo / to)
		}

		//~: cancel action
		$scope.cancel = function()
		{
			var opts = $scope.opts
			cleanup()

			$rootScope.$broadcast('content-hide')
			opts.cancelled = true
			opts.$scope.$broadcast(opts.event, opts)
		}

		//~: submit action
		$scope.submit = function()
		{
			$scope.submitting = true

			submitMerged(function()
			{
				var opts = $scope.opts

				cleanup()
				delete $scope.submitting

				$rootScope.$broadcast('content-hide')
				opts.$scope.$broadcast(opts.event, opts)
			})
		}

		function cleanup()
		{
			$scope.opts = null
			delete $scope.d2s
			delete $scope.direct
			delete $scope.conflict
			delete $scope.loaded
		}

		//~: prepare the merge
		function prepareMerge()
		{
			var devs = $scope.opts.devs
			var days = {}
			var  now = new Date().setUTCHours(0,0,0,0)
			$scope.now = moment.utc(now).format()

			//~: day -> (device -> schedule)
			ZeT.each(devs, function(dev)
			{
				ZeT.each($scope.d2s[dev], function(sch)
				{
					if(sch.removed || (sch.ts < now))
						return

					var day = days[sch.ts]
					if(!day) days[sch.ts] = day = []

					day.push(sch) //<-- sch contains device uuid
				})
			})

			//~: filter records without the conflicts
			$scope.direct = []; $scope.conflict = []
			ZeT.each(days, function(schs, day) {
				if(ZeT.asserta(schs).length == 1)
					$scope.direct.push(schs[0])
				//?: {a conflict found}
				else if(!allTheSame(schs))
					$scope.conflict.push(schs)
				//?: {not all the devices have it}
				else if(schs.length != devs.length)
					$scope.direct.push(schs[0])
			})

			function allTheSame(schs)
			{
				for(var i = 1;(i < schs.length);i++)
					if(schs[i].uuid != schs[0].uuid)
						return false
				return true
			}

			//~: pre-process the conflicts
			ZeT.each($scope.conflict, function(schs, i)
			{
				var co = { ts: schs[0].ts }
				$scope.conflict[i] = co

				var sm = {}; ZeT.each(schs, function(sch)
				{
					var e = sm[sch.uuid]
					if(e) e.devices.push(sch.device); else {
						sm[sch.uuid] = sch
						sch.devices = [ sch.device ]
						delete sch.device
					}
				})

				var sk = ZeT.keys(sm); sk.sort()
				co.items = []; ZeT.each(sk, function(k){ co.items.push(sm[k]) })

				//~: sort items by schedule title
				co.items.sort(function(l, r)
				{
					l = (l.title || '').toLocaleLowerCase()
					r = (r.title || '').toLocaleLowerCase()
					return l.localeCompare(r)
				})
			})

			//~: sort the conflicts by day ascending
			$scope.conflict.sort(function(l, r)
			{
				return l.ts - r.ts
			})

			//ZeT.log('Direct ', $scope.direct)
			//ZeT.log('Conflict ', $scope.conflict)
		}

		//~: number of resolved conflicts
		$scope.resolvedNumer = function()
		{
			if(!ZeT.isa($scope.conflict)) return null
			var n = 0; ZeT.each($scope.conflict, function(co){ co.resolved && n++ })
			return n
		}

		//~: submit direct and resolved records
		function submitMerged(f)
		{
			var devs = $scope.opts.devs

			//~: payload array of the devices
			var pl = {}; ZeT.each(devs, function(d){ pl[d] = { device: d }})

			function $xa(sch)
			{
				var xa = { ts: sch.ts, uuid: sch.schedule }

				xa.at = new Date(xa.ts)
				xa.at.setUTCHours(0,0,0,0)
				xa.at = xa.at.toISOString()

				return xa
			}

			//~: process direct records as assignments
			ZeT.each($scope.direct, function(da)
			{
				var xa = $xa(da)

				//~: take all the devices
				ZeT.each(devs, function(dev)
				{
					//?: {it is source device}
					if(da.device == dev) return

					//~: list of assigning actions
					var a = pl[dev].assigned
					if(!a) pl[dev].assigned = a = []

					//!: add the action
					a.push(xa)
				})
			})

			//~: process the resolved conflicts
			ZeT.each($scope.conflict, function(co)
			{
				//?: {conflict is not resolved}
				if(!ZeT.iso(co.resolved)) return

				//~: devices that are processed
				var d2r = {}

				//~: replace action
				var xa  = $xa(co.resolved)

				//~: for each schedule of conflict
				ZeT.each(co.items, function(coi)
				{
					//~: for each device
					ZeT.each(coi.devices, function(dev)
					{
						d2r[dev] = true //<-- mark as processed

						//?: {this schedule resolves}
						if(coi == co.resolved) return

						//~: list of replacing actions
						var a = pl[dev].replaced
						if(!a) pl[dev].replaced = a = []

						var ra = ZeT.deepClone(xa)
						ra.olduuid = coi.schedule

						//!: add the action
						a.push(ra)
					})
				})

				//~: assign to all the devices left
				ZeT.each(devs, function(dev)
				{
					//?: {processed} skip
					if(d2r[dev]) return

					//~: list of assigning actions
					var a = pl[dev].assigned
					if(!a) pl[dev].assigned = a = []

					//!: add the action
					a.push(xa)
				})
			})

			//~: move payload to array
			var payload = []; ZeT.each(pl, function(o){ payload.push(o) })

			//ZeT.log('Payload', payload)

			//!: post the payload
			AppData.setDevSchs(payload, f)
		}
	})

	//~: merge documents of the selected devices
	screener.controller('mergeDevDocsCtrl', function($rootScope, $scope, $element, $timeout)
	{
		setupDefaults($scope, $element, { objects: 'docs' })
		$scope.view.select = true

		//~: load the data
		$scope.$on('content-merge-dev-docs', function(e, opts)
		{
			ZeT.assert(ZeT.iso(opts))
			ZeT.asserta(opts.devs)

			cleanup()

			$scope.opts = opts
			$scope.d2ds = {}

			loadData('tags', function()
			{
				loadData('docs', function()
				{
					$scope.loaded = 0
					load(0)
				})
			})

			function load(di)
			{
				if(di >= opts.devs.length)
				{
					$timeout(bindCardAbsBorderLayout($element))
					return prepareMerge()
				}

				AppData.get('devdocs', { uuid: opts.devs[di] }, function(docs)
				{
					$scope.d2ds[opts.devs[di]] = docs || []
					for(var i = 0;(i < docs.length);i++)
						docs[i] = ZeT.assertn(globalDataMap[docs[i]])

					$scope.loaded = di
					$scope.$apply()

					//!: invoke the next load
					load(di + 1)
				})
			}
		})

		//~: load progress
		$scope.loadProgress = function()
		{
			if(!$scope.opts) return null

			var lo = $scope.loaded
			var to = $scope.opts.devs.length
			return (lo + 1 === to)?(100):Math.floor(100.0 * lo / to)
		}

		//~: cancel action
		$scope.cancel = function()
		{
			var opts = $scope.opts
			cleanup()

			$rootScope.$broadcast('content-hide')
			opts.cancelled = true
			opts.$scope.$broadcast(opts.event, opts)
		}

		//~: submit action
		$scope.submit = function()
		{
			$scope.submitting = true

			submitMerged(function()
			{
				var opts = $scope.opts

				cleanup()
				delete $scope.submitting

				$rootScope.$broadcast('content-hide')
				opts.$scope.$broadcast(opts.event, opts)
			})
		}

		function cleanup()
		{
			$scope.opts = null
			delete $scope.d2ds
			delete $scope.loaded
			delete $scope.docs

			$scope.selected = {}
			$scope.tagsSel = {}
		}

		//~: prepare the merge
		function prepareMerge()
		{
			//~: select unique documents, map devices
			var docs = {}; $scope.docs = []
			ZeT.each($scope.d2ds, function(ds, dev)
			{
				ZeT.each(ds, function(doc)
				{
					if(docs[doc.uuid])
						doc = docs[doc.uuid]
					else
					{
						docs[doc.uuid] = doc
						$scope.docs.push(doc)
					}

					//~: map current device
					if(!doc.devices) doc.devices = []
					doc.devices.push(dev)
				})
			})

			//~: sort documents by the name
			$scope.docs.sort(function(l, r)
			{
				l = (l.name || '').toLocaleLowerCase()
				r = (r.name || '').toLocaleLowerCase()
				return l.localeCompare(r)
			})

			//~: select all the documents by default
			ZeT.each($scope.docs, function(doc)
			{
				$scope.selected[doc.uuid] = true

				//~: select all the tags by default (to uncheck them)
				ZeT.each(doc.tags, function(tag){ $scope.tagsSel[tag] = true })
			})
		}

		//~: submit
		function submitMerged(f)
		{
			var devs = $scope.opts.devs, sel = []
			ZeT.each($scope.selected, function(x, doc){ x && sel.push(doc) })

			AppData.setDevDocs(devs, sel, f)
		}
	})

	//~: export some of the routines
	ZeT.extend(screener, {
		errorMsg: errorMsg,
		sharedScope: sharedScope,
		setupDefaults: setupDefaults,
		loadData: loadData,
		globalDataMap: globalDataMap,
		bindCardAbsBorderLayout: bindCardAbsBorderLayout
	})
})