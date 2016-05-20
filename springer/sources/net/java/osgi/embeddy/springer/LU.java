package net.java.osgi.embeddy.springer;

/* Logging for Java */

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;


/**
 * Wrapper around logging framework.
 *
 * @author anton.baukin@gmail.com.
 */
public class LU
{
	public static Object logger(String name)
	{
		return LogManager.getLogger(name);
	}

	public static Object logger(Class cls)
	{
		return LogManager.getLogger(cls);
	}

	public static void   debug(Object logger, Object... msg)
	{
		((Logger) logger).debug(EX.cat(msg));
	}

	public static void   info(Object logger, Object... msg)
	{
		((Logger) logger).info(EX.cat(msg));
	}

	public static void   warn(Object logger, Object... msg)
	{
		((Logger) logger).warn(EX.cat(msg));
	}

	public static void   error(Object logger, Object... msg)
	{
		((Logger) logger).error(EX.cat(msg));
	}

	public static <E extends Throwable> E
	                     error(Object logger, E e, Object... msg)
	{
		((Logger) logger).error(EX.cat(msg), e);
		return e;
	}
}