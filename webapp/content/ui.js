PNotify.prototype.options.styling = "bootstrap3"

$(document).ready(function()
{
	//~: scroll panels
	if(!("ontouchstart" in document.documentElement))
	{
		$(document).addClass('no-touch')
	}

	//~: side menus
	$('.side-menu-list li.with-sub').each(function()
	{
		var parent = $(this),
			clickLink = parent.find('>span'),
			subMenu = parent.find('ul')

		clickLink.click(function()
		{
			if(parent.hasClass('opened'))
			{
				parent.removeClass('opened')
				subMenu.slideUp()
			}
			else
			{
				$('.side-menu-list li.with-sub').not(this).removeClass('opened').find('ul').slideUp()
				parent.addClass('opened')
				subMenu.slideDown()
			}
		})
	})

	//~: dashboard
	ZeT.scope(function()
	{
		function dashboardBoxHeight()
		{
			$('.box-typical-dashboard').each(function()
			{
				var parent = $(this),
					header = parent.find('.box-typical-header'),
					body = parent.find('.box-typical-body')
				body.height(parent.outerHeight() - header.outerHeight())
			})
		}

		dashboardBoxHeight()

		$(window).resize(function()
		{
			dashboardBoxHeight()
		})

		$('.box-typical-dashboard').each(function()
		{
			var parent = $(this),
				btnCollapse = parent.find('.action-btn-collapse')

			btnCollapse.click(function()
			{
				if(parent.hasClass('box-typical-collapsed'))
				{
					parent.removeClass('box-typical-collapsed')
				}
				else
				{
					parent.addClass('box-typical-collapsed')
				}
			})
		})

		$('.box-typical-dashboard').each(function()
		{
			var parent = $(this),
				btnExpand = parent.find('.action-btn-expand'),
				classExpand = 'box-typical-full-screen'

			btnExpand.click(function()
			{
				if(parent.hasClass(classExpand))
				{
					parent.removeClass(classExpand)
					$('html').css('overflow', 'auto')
				}
				else
				{
					parent.addClass(classExpand)
					$('html').css('overflow', 'hidden')
				}

				dashboardBoxHeight()
			})
		})
	})
})

jQuery.Color.fn.invert = function()
{
	return new jQuery.Color(
	  255 - this._rgba[0],
	  255 - this._rgba[1],
	  255 - this._rgba[2]
	)
}