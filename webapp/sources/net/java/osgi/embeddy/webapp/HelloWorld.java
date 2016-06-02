package net.java.osgi.embeddy.webapp;

/* Spring Framework */

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;


/**
 * Just a 'Hello, World' sample Spring controller.
 *
 * @author anton.baukin@gmail.com.
 */
@Controller
@RequestMapping(path = "/hello")
public class HelloWorld
{
	@ResponseBody
	@RequestMapping(method = RequestMethod.GET,
	  produces = "text/plain;charset=UTF-8")
	public String get()
	{
		return "Hello, World!";
	}

	@ResponseBody
	@RequestMapping(path = "/{name}", method = RequestMethod.GET,
	  produces = "text/plain;charset=UTF-8")
	public String get(@PathVariable String name)
	{
		return "Hello, " + name + "!";
	}
}