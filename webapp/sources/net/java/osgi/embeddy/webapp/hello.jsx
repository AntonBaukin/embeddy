/*===============================================================+
 |            Sample Servlet implemented in JavaScript           |
 |                                   / anton.baukin@gmail.com /  |
 +===============================================================*/

var ZeT = JsX.once('zet/app.js')

/**
 * Global variables are:
 *
 *  request
 *    Java Servlet HTTP Request;
 *
 *  response
 *    Java Servlet HTTP Response;
 *
 *  params
 *    map with all parameters of the request,
 *    both from the URL, or from URL-encoded
 *    body of POST content. Each parameter is
 *    a string, or array of strings;
 *
 *  stream
 *    Java Input Stream for requests not
 *    application/x-www-form-urlencoded,
 *    or text/*, or application/javascript,
 *    or application/json.
 *
 *    Warning: stream is defined only when
 *    Content-Type is!
 *
 *  contentType
 *    string with the content type of the request
 *    having all the parameters (such as the charset)
 *    removed from it.
 */
function get()
{
	response.setContentType('text/html;charset=UTF-8')

	print(<<Ω
<!DOCTYPE html>
<html lang = 'en'>
	<head>
		<title>Hello, World!</title>
	</head>
	<body>
		<h2>This is Hello, World!</h2>
	Ω)

	if(params.isEmpty())
		print("\t\t<h3>There are no parameters!</h3>")
	else
	{
		print(<<Ω
		<h2>Your parameters are:</h2>
		<table cellspacing = '0' cellpadding = '4' border = '1'>
		Ω)

		ZeT.each(ZeT.keys(params), function(p)
		{
			print('\t\t\t<tr><td>', JsX.html(p),
			  '</td><td>', JsX.html(params[p]), '</td></tr>'
			)
		})

		print('\t\t</table>')
	}

	print(<<Ω
	</body>
</html>
	Ω)
}