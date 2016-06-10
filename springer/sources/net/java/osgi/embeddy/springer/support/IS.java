package net.java.osgi.embeddy.springer.support;

/**
 * Checks what is available in OSGi framework.
 *
 * @author anton.baukin@gmail.com.
 */
public class IS
{
	public static boolean debug()
	{
		if(debug == null)
			debug = "true".equals(System.getProperty("debug"));

		return debug;
	}

	private static volatile Boolean debug;

	public static boolean web()
	{
		if(web != null)
			return web;

		return new SetLoader(IS.class).run(() ->
		{
			synchronized(IS.class)
			{
				return web = ClassPresent.INSTANCE.test(
				  "javax.servlet.Servlet",
				  "org.osgi.service.http.HttpService"
				);
			}
		});
	}

	private static volatile Boolean web;
}
