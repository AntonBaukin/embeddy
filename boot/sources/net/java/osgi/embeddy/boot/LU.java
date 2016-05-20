package net.java.osgi.embeddy.boot;

/* Java */

import java.lang.reflect.Method;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


/**
 * Logging wrapper that solves class-loading
 * issues when dealing with Log4j.
 *
 * @author anton.baukin@gmail.com.
 */
public class LU
{
	/**
	 * Initializes Apache Logging with the given
	 * loader and return the destroy functor.
	 */
	public static Runnable init(final ClassLoader loader)
	{
		//~: install the class loader
		if(LU.loader != null) return null;
		LU.loader = EX.assertn(loader);
		EX.assertx(loader == Thread.currentThread().getContextClassLoader());

		//~: scan for the plugins
		try
		{
			Class<?> prc = loader.loadClass(
			  "org.apache.logging.log4j.core.config.plugins.util.PluginRegistry");

			//~: PluginRegistry.INSTANCE
			Object   pri = prc.getMethod("getInstance").invoke(null);

			//!: scan for the plugins
			prc.getMethod("loadFromMainClassLoader").invoke(pri);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while scanning for Log4j2 plugins!");
		}

		//~: access (build) the configuration
		try
		{
			//~: access the context
			Class<?> lm  = loader.loadClass("org.apache.logging.log4j.LogManager");
			Object   ctx = lm.getMethod("getContext", boolean.class).invoke(null, false);

			//~: build the configuration
			ctx.getClass().getMethod("getConfiguration").
			  invoke(ctx);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while building Log4j2 configuration!");
		}

		try
		{
			final String C = "net.java.osgi.embeddy.log.LogGlobalShutdown";
			return (Runnable) loader.loadClass(C).newInstance();
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
	}

	public static Object   logger(Class cls)
	{
		EX.assertn(cls);

		//~: lookup in the cache
		Object res = loggers.get(cls.getName());
		if(res != null) return res;

		//~: create logger instance
		try
		{
			if(logManager == null)
				logManager = loader.loadClass(
				  "org.apache.logging.log4j.LogManager");

			res = logManager.getMethod("getLogger", String.class).
			  invoke(null, cls.getName());

			EX.assertn(res);
			loggers.put(cls.getName(), res);

			return res;
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Can't create Log4j Logger instance!");
		}
	}

	public static void     info(Object logger, Object... msg)
	{
		try
		{
			if(infoMethod == null)
				infoMethod = logger.getClass().getMethod("info", String.class);
			infoMethod.invoke(logger, EX.cat(msg));
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
	}

	public static void     warn(Object logger, Object... msg)
	{
		try
		{
			if(warnMethod == null)
				warnMethod = logger.getClass().getMethod("warn", String.class);
			warnMethod.invoke(logger, EX.cat(msg));
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
	}

	public static void     error(Object logger, Object... msg)
	{
		error(logger, null, msg);
	}

	public static <E extends Throwable> E
	                       error(Object logger, E e, Object... msg)
	{
		try
		{
			if(errorMethod == null)
				errorMethod = logger.getClass().
				  getMethod("error", String.class, Throwable.class);

			errorMethod.invoke(logger, EX.cat(msg), e);
		}
		catch(Throwable x)
		{
			//!: ignore this exception
		}

		return e;
	}


	/* private static: utility state */

	private static ClassLoader          loader;
	private static Method               infoMethod;
	private static Method               warnMethod;
	private static Method               errorMethod;
	private static volatile Class<?>    logManager;
	private static Map<String, Object>  loggers =
	  new ConcurrentHashMap<String, Object>(17);
}