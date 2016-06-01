package net.java.osgi.embeddy.springer.support;

/**
 * Checks what is available in OSGi framework.
 *
 * @author anton.baukin@gmail.com.
 */
public class IS
{
	public static boolean web()
	{
		if(web != null)
			return web;

		//~: set springer bundle class loader
		ClassLoader cl = Thread.currentThread().getContextClassLoader();
		Thread.currentThread().setContextClassLoader(
		  IS.class.getClassLoader());

		try
		{
			synchronized(IS.class)
			{
				return web = ClassPresent.INSTANCE.test(
				  "javax.servlet.Servlet",
				  "org.osgi.service.http.HttpService"
				);
			}
		}
		finally
		{
			Thread.currentThread().setContextClassLoader(cl);
		}
	}

	private static volatile Boolean web;
}
