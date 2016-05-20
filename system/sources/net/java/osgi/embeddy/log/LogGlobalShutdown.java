package net.java.osgi.embeddy.log;

/* Java */

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/* Logging for Java */

import org.apache.logging.log4j.core.util.Cancellable;
import org.apache.logging.log4j.core.util.ShutdownCallbackRegistry;

/* embeddy */

import net.java.osgi.embeddy.EX;


/**
 * Singleton strategy to shutdown Log4j2 logging facility
 * at the time when no logging event is possible.
 *
 * Uses as value of 'system.log4j.shutdownCallbackRegistry'.
 * (See osgi.properties file.)
 *
 * @author anton.baukin@gmail.com.
 */
public class LogGlobalShutdown implements ShutdownCallbackRegistry, Runnable
{
	/* Runnable */

	public void run()
	{
		Entry[] es;

		//~: copy-cut the entries
		synchronized(entries)
		{
			es = new Entry[entries.size()];
			entries.toArray(es);
			entries.clear();
		}

		//c: invoke each of them
		for(Entry e : es) try
		{
			e.run();
		}
		catch(Throwable x)
		{
			//!: ignore this error
		}
	}


	/* Shutdown Callback Registry */

	public Cancellable addShutdownCallback(Runnable callback)
	{
		Entry e = new Entry(callback);

		synchronized(entries)
		{
			entries.add(e);
		}

		return e;
	}

	protected static final List<Entry> entries =
	  new ArrayList<>(8);


	/* Entry */

	public static class Entry implements Runnable, Cancellable
	{
		public Entry(Runnable task)
		{
			this.task = EX.assertn(task);
		}

		public final Runnable task;


		/* Runnable */

		public void run()
		{
			if(cancelled.compareAndSet(false, true))
				task.run();
		}

		protected final AtomicBoolean cancelled =
		  new AtomicBoolean();


		/* Cancellable */

		public void cancel()
		{
			cancelled.set(true);
		}
	}
}