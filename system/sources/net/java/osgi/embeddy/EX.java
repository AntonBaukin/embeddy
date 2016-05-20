package net.java.osgi.embeddy;

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
		cat(sb, msg);
		String        s  = sb.toString().trim();

		if(s.isEmpty())
			return new AssertionError();
		else
			return new AssertionError(s);
	}

	public static RuntimeException state(Object... msg)
	{
		StringBuilder sb = new StringBuilder(32);
		cat(sb, msg);
		String        s  = sb.toString().trim();

		if(s.isEmpty())
			return new IllegalStateException();
		else
			return new IllegalStateException(s);
	}

	public static RuntimeException wrap(Throwable cause, Object... msg)
	{
		StringBuilder sb = new StringBuilder(32);
		cat(sb, msg);
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


	/* Support */

	public static String cat(Object... objs)
	{
		StringBuilder s = new StringBuilder(64);

		cat(s, objs);
		return s.toString();
	}

	@SuppressWarnings("unchecked")
	private static void  cat(StringBuilder s, Collection objs)
	{
		for(Object o : objs)
			if(o instanceof Collection)
				cat(s, (Collection) o);
			else if(o instanceof Object[])
				cat(s, (Object[]) o);
			else if(o != null)
				s.append(o);
	}

	private static void  cat(StringBuilder s, Object[] objs)
	{
		for(Object o : objs)
			if(o instanceof Collection)
				cat(s, (Collection)o);
			else if(o instanceof Object[])
				cat(s, (Object[]) o);
			else if(o != null)
				s.append(o);
	}
}