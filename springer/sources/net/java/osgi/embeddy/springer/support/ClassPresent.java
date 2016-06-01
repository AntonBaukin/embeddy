package net.java.osgi.embeddy.springer.support;

/* Java */

import java.util.function.Predicate;


/**
 * Strategy that tests whether a class may be loaded
 * with the class loader of the current thread context.
 *
 * @author anton.baukin@gmail.com.
 */
public class ClassPresent implements Predicate<String>
{
	public static final ClassPresent
	  INSTANCE = new ClassPresent();


	/* Class Present */

	public boolean test(String cls)
	{
		try
		{
			Thread.currentThread().
			  getContextClassLoader().loadClass(cls);

			return true;
		}
		catch(Throwable ignore)
		{
			return false;
		}
	}

	public boolean test(String... cls)
	{
		try
		{
			ClassLoader cl = Thread.currentThread().
			  getContextClassLoader();

			for(String c : cls)
				cl.loadClass(c);

			return true;
		}
		catch(Throwable ignore)
		{
			return false;
		}
	}
}