package net.java.osgi.embeddy.springer.support;

/* Java */

import java.util.concurrent.Callable;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;


/**
 * Invokes clause temporary scoping thread
 * context with the Class Loader given.
 *
 * @author anton.baukin@gmail.com.
 */
public class SetLoader
{
	public SetLoader(ClassLoader loader)
	{
		this.loader = loader;
	}

	public SetLoader(Class cls)
	{
		this.loader = cls.getClassLoader();
	}

	public SetLoader(Object obj)
	{
		this.loader = obj.getClass().getClassLoader();
	}

	public final ClassLoader loader;


	/* Runnable */

	public <T> T run(Callable<T> x)
	{
		ClassLoader loader = Thread.currentThread().
		  getContextClassLoader();

		//?: {assign given loader}
		if(loader != this.loader)
			Thread.currentThread().
			  setContextClassLoader(this.loader);

		try //!: invoke
		{
			return x.call();
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
		finally
		{
			//?: {assign loader back}
			if(loader != this.loader)
				Thread.currentThread().
				  setContextClassLoader(loader);
		}
	}
}