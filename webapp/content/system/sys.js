/*===============================================================+
 |                Application System Level Script                |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

ZeT.scope(angular.module('screener-sys', [ 'anger', 'screener' ]), function(sys)
{
	var anger = angular.module('anger')
	var screener = angular.module('screener')

	//~: system root controller
	screener.controller('rootSysCtrl', function($scope, $element, $timeout)
	{
		ZeT.extend($scope, screener.sharedScope)

		//~: initialize the controls
		screener.setupDefaults($scope, $element, {
			to: $timeout, objects: 'objects',
			myfilter: globalFilters
		})

		//~: link this scope to the view
		$scope.view.$root = $scope

		function firstActivate(refresh)
		{
			var at = firstActivate.activateTime
			var tx = new Date().getTime()

			//?: {done}
			if(at === null) return

			//?: {not planned}
			if(ZeT.isu(at))
				return planActivate()

			if(at > tx) //?: {not now}
				return refresh?(planActivate()):(null)

			firstActivate.activateTime = null

			//~: show the domains page
			$scope.$broadcast('system-pane-hide')
			$scope.$broadcast('system-pane-domains')
			$scope.$apply()

			//~: make each absolute dialog global
			$element.find('.dialog-over.abs-dialog').
			  detach().appendTo(document.body)
		}

		function planActivate()
		{
			firstActivate.activateTime = new Date().getTime() + 100
			ZeT.timeout(150, firstActivate)
		}

		//~: delay activation
		$scope.$on('$includeContentLoaded', planActivate)

		//~: initial activation
		$timeout(planActivate)

		//~: content layout
		$scope.bindCardAbsBorderLayout = function()
		{
			$timeout(screener.bindCardAbsBorderLayout(
			  $element, ' > .system-card > .card-block'))
		}

		function globalFilters()
		{
			var cfs = $scope.view.filters
			if(!ZeT.isa(cfs)) return true

			for(var i = 0;(i < cfs.length);i++)
				if(cfs[i].apply(this, arguments) === false)
					return false
			return true
		}

		//~: filters disabled objects
		$scope.filterDisabled = function(o)
		{
			return !!$scope.view.disabled || (o.disabled !== true)
		}

		//~: filters enabled objects
		$scope.filterEnabled = function(o)
		{
			return !!$scope.view.enabled || (o.disabled === true)
		}

		//~: general is-modified check
		$scope.isModified = function()
		{
			return ZeT.o2s(this.editSource) != ZeT.o2s(this.edit)
		}

		//~: application sign out
		$scope.$on('app-sign-out', function()
		{
			AppLogin.logout(function()
			{
				window.location.replace('/static/login/index.html')
			})
		})

		//~: start edit dialog
		$scope.startEditDialog = function(obj, dialog)
		{
			ZeT.assert(ZeT.iso(obj))
			this.edit = ZeT.deepClone(obj)
			this.editSource = obj
			this.view.$root.$broadcast('fog-show')
			this.$broadcast(dialog)
		}

		//~: update edited object
		$scope.updateEdit = function(event, obj)
		{
			ZeT.assert(ZeT.iso(obj))
			this.view.$root.$broadcast('fog-close')

			if(!this.editSource.uuid)
				return this.$broadcast(event)

			ZeT.extend(this.editSource, obj)
			this.$apply()
		}
	})

	//~: domains controller
	screener.controller('domainsSysCtrl', function($rootScope, $scope)
	{
		//~: load the data
		$scope.$on('system-pane-domains', function()
		{
			$scope.domains = []
			screener.loadData(true, 'sys-domains', function(domains)
			{
				$scope.domains = domains

				$scope.view.filters = [
					$scope.filterDisabled,
					$scope.filterEnabled,
					textFilter
				]

				$scope.doFilter(domains)
				$scope.bindCardAbsBorderLayout()
			})
		})

		function textFilter()
		{
			return !!$scope.filter.$text(
			  arguments[0], $scope.view.$root.filter)
		}

		//~: disable-enable the domain
		$scope.disableDomain = function()
		{
			var e; ZeT.assert(ZeT.iso(e = $scope.edit))
			AppData.updateDomain({ uuid: e.uuid, disabled: e.disabled},
			  ZeT.fbind($scope.updateEdit, $scope, 'system-pane-domains'))
		}

		//~: ask domain disable
		$scope.askDomainDisable = function(dom)
		{
			$scope.startEditDialog.call($scope, dom, 'ask-domain-disable')
		}

		//~: start edit domain
		$scope.showDomainEdit = function(dom)
		{
			$scope.startEditDialog.call($scope, dom, 'domain-edit')
		}

		//~: start add domain
		$scope.$on('show-domain-add', function()
		{
			$scope.startEditDialog.call($scope, {}, 'domain-edit')
			$scope.$apply()
		})

		//~: submit the edit
		$scope.submitEdit = function()
		{
			ZeT.assert(ZeT.iso($scope.edit))
			delete $scope.edit.disabled

			AppData.updateDomain($scope.edit,
			  ZeT.fbind($scope.updateEdit, $scope, 'system-pane-domains'))
		}
	})

	//~: users controller
	screener.controller('usersSysCtrl', function($rootScope, $scope)
	{
		//~: load the data
		$scope.$on('system-pane-users', function()
		{
			$scope.domains = []
			screener.loadData(true, 'sys-domains', function(domains)
			{
				$scope.domains = domains
				var ds = {}; ZeT.each(domains, function(d){ds[d.uuid] = d})

				screener.loadData(true, 'sys-users', function(users)
				{
					ZeT.each(users, function(u)
					{
						ZeT.asserts(u.domain)
						var d = ZeT.assertn(ds[u.domain])
						if(!d.users) d.users = []
						d.users.push(u)
					})

					$scope.view.filters = [
						$scope.filterDisabled,
						$scope.filterEnabled
					]

					$scope.doFilter(domains)
					$scope.bindCardAbsBorderLayout()
				})
			})
		})

		//~: users filter
		$scope.ifUser = function(user)
		{
			var v = $scope.view

			if(!v.disabledUsers && !!user.disabled)
				return false

			if(!v.enabledUsers && !user.disabled)
				return false

			if(!v.personUsers && !!user.person)
				return false

			if(!v.deviceUsers && !user.person)
				return false

			var text = ZeT.get(v.$root.filter, 'set', 'text')
			var iio  = $scope.filter.$iio

			if(!ZeT.ises(text) && !(
				iio(user, 'title', text) ||
				iio(user, 'login', text) ||
				iio(user, 'uuid', text)
			))
				return false

			return true
		}

		//~: disable-enable the user
		$scope.disableUser = function()
		{
			var e; ZeT.assert(ZeT.iso(e = $scope.edit))
			AppData.updateUser({ uuid: e.uuid, disabled: e.disabled},
			  ZeT.fbind($scope.updateEdit, $scope, 'system-pane-users'))
		}

		//~: ask user disable
		$scope.askUserDisable = function(user)
		{
			$scope.startEditDialog.call($scope, user, 'ask-user-disable')
		}

		//~: display the fowm to change password
		$scope.userPasswordChange = function(user)
		{
			$scope.startEditDialog.call($scope, user, 'user-password-change')
		}

		//~: commit the password change
		$scope.doChangePassword = function()
		{
			var e; ZeT.assert(ZeT.iso(e = $scope.edit))
			ZeT.assert(!ZeT.ises(e.passX) && e.passX == e.passY)

			var p = AppLogin.encodePass(e.passX)

			AppData.updateUser({ uuid: e.uuid, passhash: p },
			  ZeT.fbind($scope.updateEdit, $scope, 'fog-close'))
		}

		//~: start edit user-person
		$scope.showUserEdit = function(user)
		{
			$scope.startEditDialog.call($scope, user, 'user-edit')
		}

		//~: start add user-person
		$scope.showUserAdd = function(dom)
		{
			ZeT.assert(ZeT.iso(dom) && !ZeT.ises(dom.uuid))

			$scope.startEditDialog.call($scope,
				{ domain: dom.uuid }, 'user-edit')
		}

		//~: react on the person edit
		function updatePerson()
		{
			if(arguments[1].status === 409)
				return screener.errorMsg('Error!',
				  'User with the same login already exists!')

			$scope.updateEdit.apply(this, arguments)
		}

		//~: submit the edit
		$scope.submitEdit = function()
		{
			var e = $scope.edit
			ZeT.assert(ZeT.iso(e))
			delete e.disabled

			var pass = e.passX
			if(!ZeT.ises(pass) && (pass == e.passY))
				e.passhash = AppLogin.encodePass(pass)

			delete e.passX
			delete e.passY

			AppData.updateUser($scope.edit,
			  ZeT.fbind(updatePerson, $scope, 'system-pane-users'))
		}
	})

	//~: change system password dialog
	screener.controller('passwordSysCtrl', function($rootScope, $scope)
	{
		//~: display password change dialog
		$scope.$on('change-own-password', function()
		{
			$scope.edit = {}
			$rootScope.$broadcast('fog-show')
			$scope.$apply()
		})

		//~: commit the password change
		$scope.doChangePassword = function()
		{
			var e; ZeT.assert(ZeT.iso(e = $scope.edit))
			ZeT.assert(!ZeT.ises(e.passX) && e.passX == e.passY)

			var u = ZeT.asserts(ZeT.get(AppLogin.token, 'init', 'uuid'))
			var p = AppLogin.encodePass(e.passX)

			AppData.updateUser({ uuid: u, passhash: p }, function()
			{
				$rootScope.$broadcast('fog-close')
			})
		}
	})
})