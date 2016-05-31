package net.java.osgi.embeddy.springer.support;

/* Java */

import java.util.HashSet;
import java.util.LinkedList;
import java.util.ListIterator;
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
	public static void up(Class<?> c, Predicate<Class<?>> f)
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
}