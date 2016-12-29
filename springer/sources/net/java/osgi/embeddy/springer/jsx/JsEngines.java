package net.java.osgi.embeddy.springer.jsx;

/* Java */

import java.lang.ref.SoftReference;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicReference;

/* Nashorn Engine */

import jdk.nashorn.api.scripting.NashornScriptEngineFactory;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;


/**
 * Collections of Engines related to the
 * scripts defined by their files.
 *
 * @author anton.baukin@gmail.com.
 */
public class JsEngines
{
	public JsEngines(JsX jsX, JsFiles files)
	{
		this.jsX     = EX.assertn(jsX);
		this.stat    = EX.assertn(jsX.stat);
		this.files   = EX.assertn(files);
		this.factory = new NashornScriptEngineFactory();
	}

	public final JsX jsX;

	public final JsStat stat;


	/* Engines Collection */

	public JsEngine take(JsFile file)
	{
		Engines es = this.engines.computeIfAbsent(
		  EX.assertn(file), Engines::new);

		return es.take();
	}

	public void     free(JsEngine engine)
	{
		JsFile  file = EX.assertn(engine).file;
		Engines es   = this.engines.computeIfAbsent(
		  file, Engines::new);

		es.free(engine);
	}

	protected final Map<JsFile, Engines> engines =
	  new ConcurrentHashMap<>();

	/**
	 * Checks and invalidates all the engines.
	 */
	public void     check()
	{
		final long ts = System.currentTimeMillis();

		//~: first, check the files
		files.revalidate();
		stat.add(stat.ENGINE, "check-files", ts);

		//~: then, check the engines
		engines.values().forEach(Engines::check);
		stat.add(stat.ENGINE, "check-all", ts);
	}


	/* Engines */

	protected class Engines
	{
		public Engines(JsFile file)
		{
			this.file = file;
		}

		public final JsFile file;


		/* Engines Access */

		public JsEngine take()
		{
			final long ts = System.currentTimeMillis();
			AtomicReference<SoftReference<JsEngine>> r;

			while(true)
			{
				//~: poll the engines queue
				r = engines.poll();

				//?: {queue was empty}
				if(r == null)
					break;

				//~: take the reference
				SoftReference<JsEngine> s = r.getAndSet(null);

				//?: {was occupied}
				if(s == null)
				{
					//!: put reference back
					engines.offer(r);
					continue;
				}

				JsEngine e = s.get();

				//?: {engine lives}
				if(e != null)
				{
					stat.add(stat.ENGINE, "taken", ts);
					return e;
				}
			}

			stat.add(stat.ENGINE, "take-miss", ts);
			return createEngine(this.file);
		}

		public void     free(JsEngine engine)
		{
			EX.assertn(engine);
			EX.assertx(engine.file.equals(this.file));

			//?: {engine missed the last check}
			if(engine.getCheckTime() < this.checkTime)
				engine.check();

			//~: add to the queue
			engines.offer(new AtomicReference<>(
			  new SoftReference<>(engine)));
		}

		@SuppressWarnings("unchecked")
		public void     check()
		{
			final long ts = this.checkTime =
			  System.currentTimeMillis();

			//~: copy the engines
			Object[] engines = this.engines.toArray();
			AtomicReference<SoftReference<JsEngine>> r;

			//c: cycle the queue
			for(Object x : engines)
			{
				//~: temporary occupy the entry
				r = (AtomicReference<SoftReference<JsEngine>>)x;
				SoftReference<JsEngine> s = r.getAndSet(null);

				//?: {entry is occupied}
				if(s == null) continue;

				try
				{
					//?: {is engine live} check
					EX.assertn(s.get()).check();
				}
				catch(Throwable ignore)
				{
					//~: assume engine as broken
					this.engines.remove(r);
				}
				finally
				{
					//~: put the reference back
					r.compareAndSet(null, s);
				}
			}

			stat.add(stat.ENGINE, "check-same", ts);
		}

		protected volatile long checkTime;

		/**
		 * We refer individual engines via a soft reference
		 * as creating engine is a consuming request.
		 */
		protected final Queue<AtomicReference<SoftReference<JsEngine>>>
			engines = new ConcurrentLinkedQueue<>();
	}

	protected JsEngine createEngine(JsFile file)
	{
		final long ts = System.currentTimeMillis();
		JsEngine    e = new JsEngine(factory, jsX, this.files, file);

		stat.add(stat.ENGINE, "create", ts);
		return e;

	}

	protected final NashornScriptEngineFactory factory;

	protected final JsFiles files;
}