package net.java.osgi.embeddy.webapp;

/* Java Annotations */

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

/* OSGi */

import org.osgi.service.log.LogService;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.LU;
import net.java.osgi.embeddy.springer.ServiceBridge;
import net.java.osgi.embeddy.springer.ServiceSwitch;


/**
 * Singleton, entry point for the tests.
 *
 * @author anton.baukin@gmail.com.
 */
@Component
public class Tester
{
	public final Object LOG =
	  LU.logger(Tester.class);

	@PostConstruct
	private void create()
	{
		LU.info(LOG, "created bean [", Tester.class.getSimpleName(), "]!");

		//?: {has no XML configuration}
		EX.assertn(fileConfigured, "FileConfigured is not defined!");
	}

	@Autowired
	protected FileConfigured fileConfigured;

	@PreDestroy
	private void destroy()
	{
		LU.info(LOG, "destroying bean [", Tester.class.getSimpleName(), "]...");
	}

	@Autowired @ServiceSwitch
	protected ServiceBridge<LogService> logService;

	protected void onLogService()
	{
		LU.info(LOG, "OSGi LogService is now bound!");
	}
}