package net.java.osgi.embeddy.webapp;

/* Java Annotations */

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.jsx.JsFilter;
import net.java.osgi.embeddy.springer.jsx.JsX;

/* application: global */

import net.java.osgi.embeddy.app.Global;


/**
 * Nested application context of
 * Spring dispatching servlet.
 *
 * @author anton.baukin@gmail.com.
 */
@Component
public class Nested
{
	@Autowired
	public Global global;

	@Autowired
	public JsX jsX;

	@Autowired
	public JsFilter jsFilter;

	@PostConstruct
	protected void setJsX()
	{
		jsX.setLoader(getClass().getClassLoader());

		//~: set scripting roots
		jsX.setRoots(
		  "net.java.osgi.embeddy.springer.jsx " +
		  "net.java.osgi.embeddy.webapp"
		);

		//~: set the engine
		jsFilter.setJsX(jsX);

		//~: connect to the proxy
		global.jsFilter.setFilter(jsFilter);
	}

	@PreDestroy
	protected void close()
	{
		//~: disconnect from the proxy
		global.jsFilter.setFilter(jsFilter);
	}
}