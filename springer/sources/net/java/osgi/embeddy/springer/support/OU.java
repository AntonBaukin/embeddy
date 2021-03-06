package net.java.osgi.embeddy.springer.support;

/* Java */

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.ListIterator;
import java.util.Set;
import java.util.function.Predicate;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;


/**
 * Various utility functions for objects.
 *
 * @author anton.baukin@gmail.com
 */
public class OU
{
	/* Classes and Hierarchy */

	/**
	 * Invokes the consumer for each class and interface
	 * up by the levels of declaration starting with the
	 * class given. Return true to stop traversing.
	 */
	@SuppressWarnings("unchecked")
	public static void   up(Class<?> c, Predicate<Class<?>> f)
	{
		EX.assertn(c);
		EX.assertn(f);

		LinkedList<Class<?>> cs  = new LinkedList<>();
		HashSet<Class<?>>    ifs = new HashSet<>();

		//~: add classes up to Object (going the first)
		cs.addFirst(c);
		while(cs.getLast().getSuperclass() != null)
			cs.addLast(cs.getLast().getSuperclass());

		//~: add interfaces going from Object
		ListIterator<Class<?>> i =
		  cs.listIterator(cs.size());

		while(i.hasPrevious())
		{
			Class<?> x = i.previous();

			for(Class<?> ii : x.getInterfaces())
				if(ifs.add(ii))
				{
					i.next();
					i.add(ii);
					i.previous();
				}
		}

		//~: traverse the list
		for(Class<?> x : cs)
			if(f.test(x))
				return;
	}

	/**
	 * Returns public method, or private or protected
	 * making them accessible, or null.
	 */
	public static Method method(Class<?> c, String n, Class<?>... args)
	{
		EX.assertn(c);
		EX.asserts(n);

		try
		{
			return c.getMethod(n, args);
		}
		catch(NoSuchMethodException ignore)
		{
			while(c != null) try
			{
				Method x = c.getDeclaredMethod(n, args);
				x.setAccessible(true);
				return x;
			}
			catch(NoSuchMethodException ignore2)
			{
				c = c.getSuperclass();
			}
		}

		return null;
	}

	/**
	 * First, iterates over all public methods of the class.
	 * Then, goes over the protected ones including the inherited,
	 * but excluding overridden. Then, each private method (that
	 * is not made accessible) up to the superclasses.
	 *
	 * Stops iteration of predicate true and returns that method.
	 * If predicate returned false each time, return null.
	 */
	public static Method methods(Class<?> c, Predicate<Method> f)
	{
		//~: add all public methods
		List<Method> lst = new ArrayList<>(
		  Arrays.asList(c.getMethods()));

		//~: traverse the public list
		for(Method m : lst)
			if(f.test(m))
				return m;

		//~: protected and private
		Set<Sig> pro = new LinkedHashSet<>();
		lst.clear();

		//c: scan up by the super-classes
		while(c != null)
		{
			for(Method m : c.getDeclaredMethods())
				//?: {is private}
				if((m.getModifiers() & Modifier.PRIVATE) != 0)
					lst.add(m);
				//~: protected | package-visible
				else if((m.getModifiers() & Modifier.PUBLIC) == 0)
					pro.add(new Sig(m));

			//~: advance to the super-class
			c = c.getSuperclass();
		}

		//~: traverse the protected list
		for(Sig sm : pro)
			if(f.test(sm.m))
				return sm.m;

		//~: traverse the private list
		for(Method m : lst)
			if(f.test(m))
				return m;

		return null;
	}

	private static class Sig
	{
		public Sig(Method m)
		{
			this.m = m;
		}

		public final Method m;

		public int     hashCode()
		{
			int h = m.getName().hashCode();

			for(Class<?> c : m.getParameterTypes())
				h = 31*h + c.hashCode();

			return h;
		}

		public boolean equals(Object x)
		{
			if(x == this) return true;
			if(!(x instanceof Sig)) return false;

			Method xm = ((Sig)x).m;

			return m.getName().equals(xm.getName()) &&
			  Arrays.equals(m.getParameterTypes(), xm.getParameterTypes());
		}
	}
}