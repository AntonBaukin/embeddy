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

var Mime = ZeT.singleInstance('App:Db:Mime',
{
	MIME             : {

		'video/3gpp': ['3gp'],
		'video/3gpp2': ['3g2'],
		'video/h261': ['h261'],
		'video/h263': ['h263'],
		'video/h264': ['h264'],
		'video/jpeg': ['jpgv'],
		'video/jpm': ['jpm', 'jpgm'],
		'video/mj2': ['mj2', 'mjp2'],
		'video/mp4': ['mp4', 'mp4v', 'mpg4'],
		'video/mpeg': ['mpeg', 'mpg', 'mpe', 'm1v', 'm2v'],
		'video/ogg': ['ogv'],
		'video/quicktime': ['qt', 'mov'],
		'video/vnd.dece.hd': ['uvh', 'uvvh'],
		'video/vnd.dece.mobile': ['uvm', 'uvvm'],
		'video/vnd.dece.pd': ['uvp', 'uvvp'],
		'video/vnd.dece.sd': ['uvs', 'uvvs'],
		'video/vnd.dece.video': ['uvv', 'uvvv'],
		'video/vnd.dvb.file': ['dvb'],
		'video/vnd.fvt': ['fvt'],
		'video/vnd.mpegurl': ['mxu', 'm4u'],
		'video/vnd.ms-playready.media.pyv': ['pyv'],
		'video/vnd.uvvu.mp4': ['uvu', 'uvvu'],
		'video/vnd.vivo': ['viv'],
		'video/webm': ['webm'],
		'video/x-f4v': ['f4v'],
		'video/x-fli': ['fli'],
		'video/x-flv': ['flv'],
		'video/x-m4v': ['m4v'],
		'video/x-matroska': ['mkv', 'mk3d', 'mks'],
		'video/x-mng': ['mng'],
		'video/x-ms-asf': ['asf', 'asx'],
		'video/x-ms-vob': ['vob'],
		'video/x-ms-wm': ['wm'],
		'video/x-ms-wmv': ['wmv'],
		'video/x-ms-wmx': ['wmx'],
		'video/x-ms-wvx': ['wvx'],
		'video/x-msvideo': ['avi'],
		'video/x-sgi-movie': ['movie'],
		'video/x-smv': ['smv'],
		'image/bmp': ['bmp'],
		'image/cgm': ['cgm'],
		'image/g3fax': ['g3'],
		'image/gif': ['gif'],
		'image/ief': ['ief'],
		'image/jpeg': ['jpeg', 'jpg', 'jpe'],
		'image/ktx': ['ktx'],
		'image/png': ['png'],
		'image/prs.btif': ['btif'],
		'image/sgi': ['sgi'],
		'image/svg+xml': ['svg', 'svgz'],
		'image/tiff': ['tiff', 'tif'],
		'image/vnd.adobe.photoshop': ['psd'],
		'image/vnd.dece.graphic': ['uvi', 'uvvi', 'uvg', 'uvvg'],
		'image/vnd.djvu': ['djvu', 'djv'],
		'image/vnd.dvb.subtitle': ['sub'],
		'image/vnd.dwg': ['dwg'],
		'image/vnd.dxf': ['dxf'],
		'image/vnd.fastbidsheet': ['fbs'],
		'image/vnd.fpx': ['fpx'],
		'image/vnd.fst': ['fst'],
		'image/vnd.fujixerox.edmics-mmr': ['mmr'],
		'image/vnd.fujixerox.edmics-rlc': ['rlc'],
		'image/vnd.ms-modi': ['mdi'],
		'image/vnd.ms-photo': ['wdp'],
		'image/vnd.net-fpx': ['npx'],
		'image/vnd.wap.wbmp': ['wbmp'],
		'image/vnd.xiff': ['xif'],
		'image/webp': ['webp'],
		'image/x-3ds': ['3ds'],
		'image/x-cmu-raster': ['ras'],
		'image/x-cmx': ['cmx'],
		'image/x-freehand': ['fh', 'fhc', 'fh4', 'fh5', 'fh7'],
		'image/x-icon': ['ico'],
		'image/x-mrsid-image': ['sid'],
		'image/x-pcx': ['pcx'],
		'image/x-pict': ['pic', 'pct'],
		'image/x-portable-anymap': ['pnm'],
		'image/x-portable-bitmap': ['pbm'],
		'image/x-portable-graymap': ['pgm'],
		'image/x-portable-pixmap': ['ppm'],
		'image/x-rgb': ['rgb'],
		'image/x-tga': ['tga'],
		'image/x-xbitmap': ['xbm'],
		'image/x-xpixmap': ['xpm'],
		'image/x-xwindowdump': ['xwd']
	},

	EXTS             : {},

	init             : function()
	{
		var self = this

		ZeT.each(this.MIME, function(exts, mime)
		{
			ZeT.asserts(mime)
			ZeT.assert(ZeT.isa(exts))

			ZeT.each(exts, function(ext)
			{
				self.EXTS[ext] = mime
			})
		})
	},

	mime2ext         : function(mime)
	{
		ZeT.asserts(mime)
		var exts = this.MIME[mime]

		return !ZeT.isa(exts)?(exts):
		  (exts.length == 1)?(exts[0]):(exts)
	},

	ext2mime         : function(ext)
	{
		ext = ZeT.asserts(ext).toLowerCase()
		var mime = this.EXTS[ext]
		return ZeT.iss(mime)?(mime):(null)
	}
})

ZeT.extend(ZeT,
{
	timeoutClass     : function(to, node, cls)
	{
		ZeT.assert(ZeT.isn(to) && !ZeT.isx(node) && !ZeT.ises(cls))
		$(node).addClass(cls)
		ZeT.timeout(to, function(){ $(node).removeClass(cls) })
	}
})