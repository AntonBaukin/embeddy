package net.java.osgi.embeddy.springer.test;

/* Spring Framework */

import javax.annotation.PostConstruct;

import net.java.osgi.embeddy.springer.LU;


/**
 * Bean defined in XML.
 *
 * @author anton.baukin@gmail.com.
 */
public class FileConfigured
{
	public final Object LOG =
	  LU.logger(FileConfigured.class);

	@PostConstruct
	public void create()
	{
		LU.info(LOG, "file configuration works!");
	}
}