package net.java.osgi.embeddy.springer.jsx;

/* Java */

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/* embeddy */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.LU;


/**
 * Collects statistics on scripts execution.
 *
 * @author anton.baukin@gmail.com.
 */
public class JsStat
{
	public JsStat()
	{
		try
		{
			XFILE  = new JsFile(new URI("file://unknown"), this);
			ENGINE = new JsFile(new URI("file://engine"), this);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
	}

	/**
	 * Phony file denoting a missing or unknown file.
	 */
	public final JsFile XFILE;

	/**
	 * Phony file denoting JsX Engine.
	 */
	public final JsFile ENGINE;


	/* JsX Statistics */

	/**
	 * General script file related statistics report
	 * on what aspect. The time is the beginning.
	 */
	public void add(JsFile file, String what, long tm)
	{
		final long t = (tm == 0L)?(0L):System.currentTimeMillis();
		Script     s = scripts.computeIfAbsent(file.uri(),
		  uri -> createEntry(file));

		//~: update the entry add
		s.update(what, t - tm);

		//~: try to report
		tryReport(s);
	}

	protected final Map<URI, Script> scripts =
	  new ConcurrentHashMap<>();


	/* Configuration */

	/**
	 * Number of milliseconds of report timeout.
	 * Default value is 5 minutes.
	 */
	public void setReportTimeout(long to)
	{
		EX.assertx(to > 0L);
		this.reportTimeout = to;
	}

	/**
	 * Report timeout for individual stat scripts.
	 * Defaults to 10 minutes.
	 */
	protected long reportTimeout = 10 * 60 * 1000L;

	/**
	 * Reporting logger name. Defaults to this class.
	 * The logging level is INFO.
	 */
	public void setLog(String log)
	{
		this.log = LU.logger(EX.asserts(log));
	}

	protected Object log =
	  LU.logger(JsStat.class.getName());


	/* Script Statistics Entry */

	protected static class What
	{
		public What(String what)
		{
			this.what = what;
		}

		public final String what;

		public final AtomicLong total =
		  new AtomicLong();

		/**
		 * Number of calls since the last report.
		 */
		public final AtomicInteger recent =
		  new AtomicInteger();

		/**
		 * Accumulated call times since the last report.
		 */
		public final AtomicLong time =
		  new AtomicLong();
	}

	protected static class Script
	{
		public Script(URI uri)
		{
			this.uri = uri;
		}

		public final URI uri;


		/* Statistics */

		public void    update(String what, long tm)
		{
			What w = whats.computeIfAbsent(what, this::createWhat);

			//~: ++ recent
			w.recent.incrementAndGet();

			//~: ++ total
			w.total.incrementAndGet();

			//~: add duration time
			w.time.addAndGet(tm);
		}

		/**
		 * Prints the report.
		 */
		public void    report(Appendable s)
		  throws IOException
		{
			boolean first = true;

			for(What w : whats.values())
			{
				final int n = w.recent.getAndSet(0);
				if(n == 0) continue;

				final long t = w.time.getAndSet(0);

				if(!first)
					s.append("; ");
				first = false;

				//~: what title
				s.append('§').append(w.what).append(' ');

				//~: recent number
				s.append(Integer.toString(n));

				//~: time delta
				if(t != 0)
					s.append(" Δ").append(Long.toString(t));

				//~: total number
				s.append(" of ").append(w.total.toString());
			}
		}

		protected What createWhat(String what)
		{
			return new What(what);
		}

		public volatile long reported;

		protected final Map<String, What> whats =
		  new ConcurrentHashMap<>();
	}


	/* protected: reporting */

	protected Script createEntry(JsFile file)
	{
		return new Script(file.uri());
	}

	protected void   tryReport(final Script s)
	{
		final long ts = System.currentTimeMillis();
		final long to = this.reportTimeout;

		//?: {report is actual}
		if(s.reported + to > ts)
			return;

		//~: update reported time
		synchronized(s)
		{
			//?: {report become actual}
			if(s.reported + to > ts)
				return;

			s.reported = ts;
		}

		//~: create the report
		StringBuilder b; try
		{
			b = new StringBuilder(64);
			s.report(b);
		}
		catch(Throwable ignore)
		{
			return;
		}

		//?: {nothing printed}
		if(b.length() == 0)
			return;

		//~: print the report
		printReport(s, b);
	}

	protected void   printReport(Script e, CharSequence s)
	{
		LU.info(log, "on [", nameEntry(e), "] ", s);
	}

	protected String nameEntry(Script e)
	{
		String p = e.uri.getPath();
		if(p == null || p.isEmpty())
			return e.uri.toString();

		//~: take 2 previous path
		int i = p.lastIndexOf('/');
		for(int x = 2;(i > 0) && (x != 0);x--)
			i = p.lastIndexOf('/', i - 1);

		//?: {tailing the name}
		return (i > 0 && i + 1 < p.length())?(p.substring(i + 1)):(p);
	}
}