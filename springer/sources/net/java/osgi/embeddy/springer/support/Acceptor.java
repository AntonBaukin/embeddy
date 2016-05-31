package net.java.osgi.embeddy.springer.support;

/* Java */

import java.util.function.Consumer;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;


/**
 * Analogue of {@link Consumer}
 *
 * @author anton.baukin@gmail.com.
 */
@FunctionalInterface
public interface Acceptor<T> extends Consumer<T>
{
	public void  invoke(T t)
	  throws Throwable;

	default void accept(T t)
	{
		try
		{
			this.invoke(t);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
	}
}