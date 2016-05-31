package net.java.osgi.embeddy.springer.boot;

/* Java */

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.support.CallMe;
import net.java.osgi.embeddy.springer.support.OU;


/**
 * Denotes a bean that is aware of being
 * {@code @Autowire}d into some bean.
 *
 * @author anton.baukin@gmail.com.
 */
public interface AutoAwire
{
	/* Autowire Aware */

	/**
	 * Invoked before a {@code @PostConstruct}.
	 * Lists the general types of the field declaration.
	 */
	default void autowiredTypes(Class<?>[] types)
	{}

	/**
	 * Invoked for the injecting bean has @Autowired
	 * field (or set-method) with the given annotations.
	 *
	 * This method is always invoked if there are annotations
	 * other then @Autowire, and after auto-wiring the types,
	 * but before any @PostConstruct of the injecting bean.
	 */
	default void autowiredAnnotations(Object injector, Annotation[] ans)
	{
		this.callMe(injector, ans);
	}


	/* Autowire Aware (support) */

	default Object callMe(Object injector, Annotation[] ans)
	{
		for(Annotation a : ans)
			if(a instanceof CallMe)
				return this.callMe(injector, (CallMe) a);

		return null;
	}

	/**
	 * Invokes @CallMe named method with expected argument
	 * of this class, or one of it's super classes, or
	 * implemented interfaces up to (including) Object.
	 */
	@SuppressWarnings("unchecked")
	default Object callMe(Object injector, CallMe call)
	{
		EX.assertn(injector);
		EX.asserts(call.value(), "@CallMe method is not named!");

		try
		{
			final Method[] m = new Method[1];

			OU.up(this.getClass(), c ->
			{
				try
				{
					m[0] = injector.getClass().getMethod(call.value(), c);
					return true;
				}
				catch(NoSuchMethodException ignore)
				{
					try
					{
						m[0] = injector.getClass().getDeclaredMethod(call.value(), c);
						return true;
					}
					catch(NoSuchMethodException ignore2)
					{
						return false;
					}
				}
			});

			//?: {not found a candidate}
			if(m[0] == null)
				throw EX.ass("@CallMe method ", call.value(), "(",
				  this.getClass().getName(), " or it's super classes or interfaces)",
				  "is not found in ", injector.getClass().getName(), "!");

			m[0].setAccessible(true);
			return m[0].invoke(injector, this);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while invoking ", call.value(),
			  "() on injector ", injector.getClass().getName(), "!");
		}
	}
}