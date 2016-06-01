package net.java.osgi.embeddy.springer.support;

/* Java */

import java.util.HashSet;

/* Java Annotations */

import javax.annotation.PreDestroy;

/* Spring Framework */

import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.LU;


/**
 * Collects prototype beans.
 * Supports @PreDestroy them.
 *
 * @author anton.baukin@gmail.com.
 */
@Component
public class BeanTracker
{
	/* Bean Tracker */

	public boolean add(Object bean)
	{
		synchronized(beans)
		{
			return beans.add(new Entry(bean));
		}
	}

	public boolean remove(Object bean)
	{
		synchronized(beans)
		{
			return beans.remove(new Entry(bean));
		}
	}


	/* protected: destruction */

	@PreDestroy
	protected void destroy()
	{
		HashSet<Entry> ds = null;

		while(true)
		{
			synchronized(beans)
			{
				if(ds == null)
					ds = new HashSet<>(beans);
				else
				{
					ds.clear();
					ds.addAll(beans);
				}

				beans.clear();

				//?: {nothing added}
				if(ds.isEmpty())
					return;
			}

			for(Entry e : ds) try
			{
				OU.methods(e.bean.getClass(), m ->
				{
					if(m.isAnnotationPresent(PreDestroy.class))
						try
						{
							m.invoke(e.bean);
						}
						catch(Throwable x)
						{
							throw EX.wrap(x);
						}

					return false;
				});
			}
			catch(Throwable x)
			{
				LU.error(LOG, x, "Error destroying bean ", LU.sig(e.bean));
			}
		}
	}

	protected final HashSet<Entry> beans = new HashSet<>(101);

	private final Object LOG = LU.logger(this.getClass());


	/* Entry */

	public static class Entry
	{
		public Entry(Object bean)
		{
			this.bean = bean;
		}

		public final Object bean;

		public int     hashCode()
		{
			return System.identityHashCode(bean);
		}

		public boolean equals(Object x)
		{
			return (x == this) ||
			  (x instanceof Entry) && (((Entry)x).bean == bean);
		}
	}
}