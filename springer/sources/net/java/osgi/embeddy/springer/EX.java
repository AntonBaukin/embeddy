package net.java.osgi.embeddy.springer;

/* Java */

import java.util.Collection;


/**
 * Exception and assertions handling support.
 *
 * @author anton.baukin@gmail.com.
 */
public class EX
{
	/* Assertions */

	public static void   assertx(boolean x, Object... msg)
	{
		if(x == false)
			throw ass(msg);
	}

	public static <T> T  assertn(T x, Object... msg)
	{
		if(x == null)
			throw ass(msg);
		return x;
	}

	@SuppressWarnings("unchecked")
	public static void   asserte(Collection c, Object... msg)
	{
		if((c == null) || c.isEmpty())
			throw ass(msg);
	}

	public static void   asserte(Object[] a, Object... msg)
	{
		if((a == null) || (a.length == 0))
			throw ass(msg);
	}

	public static String asserts(String s, Object... msg)
	{
		if((s == null) || (s.length() != s.trim().length()))
			throw ass(msg);
		return s;
	}


	/* Exceptions */

	public static AssertionError   ass(Object... msg)
	{
		StringBuilder sb = new StringBuilder(32);
		SU.cat(sb, msg);
		String        s  = sb.toString().trim();

		if(s.isEmpty())
			return new AssertionError();
		else
			return new AssertionError(s);
	}

	public static RuntimeException state(Object... msg)
	{
		StringBuilder sb = new StringBuilder(32);
		SU.cat(sb, msg);
		String        s  = sb.toString().trim();

		if(s.isEmpty())
			return new IllegalStateException();
		else
			return new IllegalStateException(s);
	}

	public static RuntimeException wrap(Throwable cause, Object... msg)
	{
		StringBuilder sb = new StringBuilder(32);
		SU.cat(sb, msg);
		String        s  = sb.toString().trim();

		//?: {has no own message}
		if(s.length() == 0)
			//?: {is runtime itself} do not wrap
			if(cause instanceof RuntimeException)
				return (RuntimeException) cause;
			//~: just take it's message
			else
				s = e2en(cause);

		return new RuntimeException(s, cause);
	}

	/**
	 * Finds the text of the exception. Useful
	 * when original exception is wrapped in
	 * exceptions without text.
	 */
	public static String           e2en(Throwable e)
	{
		String r = null;

		while((r == null) && (e != null))
		{
			r = e.getMessage();
			if((r != null) && (r = r.trim()).isEmpty()) r = null;
			if(r == null) e = e.getCause();
		}

		return r;
	}


	/* Unwrapping  */

	/**
	 * Removes the {@link RuntimeException} wrappers
	 * having no own message.
	 */
	public static Throwable xrt(Throwable e)
	{
		while((e != null) && RuntimeException.class.equals(e.getClass()))
			if(e.getCause() == null)
				return e;
			else
			{
				String  a = e.getMessage();
				String  b = e.getCause().getMessage();

				//?: {message is not set}
				boolean x = (a == null);

				//?: {not null -> messages are the same}
				if(!x)  x = EX.eq(a, b);

				//?: {not -> check as toString()}
				if(!x)  x = EX.eq(a, e.getCause().toString());

				//?: {remove wrapper}
				if(x) e = e.getCause();
				else  return e;
			}

		return e;
	}

	@SuppressWarnings("unchecked")
	public static <E> E     search(Throwable e, Class<E> eclass)
	{
		while(e != null)
			if(eclass.isAssignableFrom(e.getClass()))
				return (E)e;
			else
				e = e.getCause();

		return null;
	}


	/* Support */

	public static boolean eq(Object a, Object b)
	{
		return ((a == null) && (b == null)) ||
		  ((a != null) && a.equals(b));
	}
}