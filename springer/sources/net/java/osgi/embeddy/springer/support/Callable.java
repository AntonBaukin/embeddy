package net.java.osgi.embeddy.springer.support;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;


/**
 * Runnable that throws an exception.
 *
 * @author anton.baukin@gmail.com.
 */
@FunctionalInterface
public interface Callable extends Runnable
{
	public void  call()
	  throws Throwable;

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
}
