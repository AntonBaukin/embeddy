package net.java.osgi.embeddy.springer.jsx;

/* Java */

import java.lang.ref.Reference;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

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
		this.files   = EX.assertn(files);
		this.factory = new NashornScriptEngineFactory();
	}

	public final JsX jsX;


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
		//~: first, check the files
		files.revalidate();

		//~: then, check the engines
		engines.values().forEach(Engines::check);
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
			//~: search for existing engine
			synchronized(this)
			{
				JsEngine             e  = null;
				LinkedList<JsEngine> es = (engines == null)?(null):(engines.get());

				if((es != null) && !es.isEmpty())
					e = es.removeFirst();

				if(e != null)
					return e;
			}

			return createEngine(this.file);
		}

		protected Reference<LinkedList<JsEngine>> engines;

		public void     free(JsEngine engine)
		{
			EX.assertn(engine);
			EX.assertx(engine.file.equals(this.file));

			//?: {engine missed the last check}
			if(engine.getCheckTime() < this.checkTime)
				engine.check();

			//~: return the engine back
			synchronized(this)
			{
				LinkedList<JsEngine> es =
				  (engines == null)?(null):(engines.get());

				if(es == null)
					engines = new WeakReference<>(
					  es = new LinkedList<>());

				es.addLast(engine);
			}
		}

		public void     check()
		{
			this.checkTime = System.currentTimeMillis();

			//~: take all existing engines
			ArrayList<JsEngine> all = null;
			synchronized(this)
			{
				LinkedList<JsEngine> es = (engines == null)?(null):(engines.get());
				if(es != null)
				{
					all = new ArrayList<>(es);
					es.clear();
				}
			}

			//?: {has nothing}
			if((all == null) || all.isEmpty())
				return;

			//~: check all them
			all.forEach(JsEngine::check);

			//~: return them back
			synchronized(this)
			{
				LinkedList<JsEngine> es =
				  (engines == null)?(null):(engines.get());

				if(es == null)
					engines = new WeakReference<>(
					  es = new LinkedList<>());

				es.addAll(all);
			}
		}

		protected long checkTime;
	}

	protected JsEngine createEngine(JsFile file)
	{
		return new JsEngine(jsX, factory, this.files, file);
	}

	protected final NashornScriptEngineFactory factory;

	protected final JsFiles files;
}