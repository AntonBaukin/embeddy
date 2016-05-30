package net.java.osgi.embeddy.webapp;

/* Java Annotations */

import javax.annotation.PostConstruct;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.LU;


/**
 * Bean defined in XML.
 *
 * @author anton.baukin@gmail.com.
 */
public class FileConfigured
{
	public final Object LOG =
	  LU.logger(Tester.class);

	@PostConstruct
	public void create()
	{
		LU.info(LOG, "file configuration works!");
	}
}