package net.java.osgi.embeddy.springer.support;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;


/**
 * Runnable that throws an exception.
 *
 * @author anton.baukin@gmail.com.
 */
@FunctionalInterface
public interface Callable<T> extends Runnable
{
	/* Callable */

	public T call()
	  throws Throwable;


	/* Runnable */

	default void run()
	{
		try
		{
			this.call();
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
	}


	/* Support */

	static Callable<Object> wrap(Runnable task)
	{
		return () -> {
			task.run();
			return null;
		};
	}
}
