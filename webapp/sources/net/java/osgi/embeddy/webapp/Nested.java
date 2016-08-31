package net.java.osgi.embeddy.webapp;

/* Java */

import javax.sql.DataSource;

/* Java Annotations */

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.db.TxFilter;
import net.java.osgi.embeddy.springer.jsx.JsFilter;
import net.java.osgi.embeddy.springer.jsx.JsX;
import net.java.osgi.embeddy.springer.support.IS;

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
	public ApplicationContext applicationContext;

	@Autowired
	public DataSource dataSource;

	@Autowired
	public Global global;

	/**
	 * This scripting environment is used
	 * to execute HTTP requests in JS.
	 */
	@Autowired
	public JsX jsX;

	@Autowired
	public JsFilter jsFilter;

	@PostConstruct
	protected void setJsX()
	{
		//~: nested application context
		jsX.applicationContext = applicationContext;

		//~: springer class loader
		jsX.setLoader(getClass().getClassLoader());

		//~: set scripting roots
		jsX.setRoots(
		  "net.java.osgi.embeddy.springer.jsx " +
		  "net.java.osgi.embeddy.webapp " +
		  "net.java.osgi.embeddy.app"
		);

		if(IS.debug()) //~: scripts refresh
			jsX.setCheckIntreval(4000L);

		//~: set the engine
		jsFilter.setJsX(jsX);

		//~: connect to the proxy
		global.jsFilter.setFilter(jsFilter);
	}

	@Autowired
	public TxFilter txFilter;

	@PostConstruct
	protected void setTxFilter()
	{
		txFilter.setContexts(".jsx");

		//~: connect to the proxy
		global.txFilter.setFilter(txFilter);
	}

	@PreDestroy
	protected void close()
	{
		//~: disconnect from the proxies
		global.jsFilter.setFilter(null);
		global.txFilter.setFilter(null);
	}
}