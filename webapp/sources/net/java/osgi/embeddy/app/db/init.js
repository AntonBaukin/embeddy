/*===============================================================+
 |            Sample Database Initialization Script              |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT = JsX.once('zet/app.js')
var Dbo = JsX.once('db/obj.js')
var LOG = ZeT.LU.logger('app.db.init')

/**
 * Populates the database with sample data.
 */
function init()
{
	ZeT.LU.info(LOG, 'Initializing the database...')

	//~: startup log entry
	logStartup()

	//~: create the system user
	systemUser()
}

function systemUser()
{
	var suid = 'de9467fe-2e38-11e6-b67b-9e71128cae77'

	//?: {exists}
	if(Dbo.exists(suid))
	{
		ZeT.LU.info(LOG, 'Found System login ', suid)
		return
	}

	ZeT.LU.warn(LOG, 'Creating System login ', suid,
	  'having the default password is: [password].')

	Dbo.save({ uuid: suid, type: 'LoginAccount', text: 'System', object: {
	  title: 'System Administrator', type: 'person', system: true,
	  access: [ 'su' ], password: '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8'
	}})
}

function logStartup()
{
	Dbo.save({ type: 'Log', object: {
	  message: 'System started', type: 'start', time: new Date()
	}})
}