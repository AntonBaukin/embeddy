package net.java.osgi.embeddy.springer.jsx;

/* Java */

import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;

/* Java Annotations */

import javax.annotation.PostConstruct;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.LU;
import net.java.osgi.embeddy.springer.SU;


/**
 * Entry point to JavaScript execution layer
 * based on Oracle Nashorn implementation.
 *
 * @author anton.baukin@gmail.com.
 */
@Component @Scope("prototype")
public class JsX implements AutoCloseable
{
	@Autowired
	public ApplicationContext applicationContext;


	/* Java Scripting eXtended */

	public Object invoke(String script, String function, Object... perks)
	{
		EX.asserts(script);
		EX.asserts(function);

		try(JsCtx ctx = new JsCtx(this).init(perks))
		{
			return execute(script, function, ctx);
		}
	}

	public Object apply(String script, String function, Object... args)
	{
		return apply(script, function, null, args);
	}

	public Object apply(String script, String function, JsCtx ctx, Object... args)
	{
		//~: create local context on demand
		JsCtx local = (ctx != null)?(null):(ctx = new JsCtx(this).init());

		try //!: run the script
		{
			return execute(script, function, ctx, args);
		}
		finally
		{
			if(local != null)
				local.close();
		}
	}

	public Object debug(Object... args)
	{
		return null;
	}


	/* Java Scripting eXtended (configuration) */

	protected final Object LOG = LU.logger(this);

	protected JsFiles files;

	/**
	 * Configures the root packages (directories)
	 * to search for JavaScript files from using
	 * the application Class Loader.
	 *
	 * The names may be presented in Java package
	 * dot-separator notation, or with URI's '/'.
	 */
	public void setRoots(String roots)
	{
		String[] rs = SU.a2a(SU.s2a(roots, ' ', '\n'));;
		EX.asserte(rs, "No JavaScript roots are given!");

		for(int i = 0;(i < rs.length);i++)
		{
			String r = rs[i];

			if(r.indexOf('/') == -1)
				r = r.replace('.', '/');
			if(r.startsWith("/"))
				r = r.substring(1);
			while(r.endsWith("/"))
				r = r.substring(0, r.length() - 1);

			rs[i] = EX.asserts(r);
		}

		LU.info(LOG, "using the following roots: ",
		  SU.scats(", ", (Object)rs));

		this.files   = new JsFiles(this, rs);
		this.engines = new JsEngines(this, this.files);
	}

	public ClassLoader getLoader()
	{
		return (loader != null)?(loader):
		  this.getClass().getClassLoader();
	}

	protected ClassLoader loader;

	public void setLoader(ClassLoader loader)
	{
		this.loader = loader;
	}

	/**
	 * If not zero, turns on the functionality to
	 * check whether the scripting files on the disk
	 * were updated with the defined perios in ms.
	 * As this check requires io-request to the
	 * file system, omit it in high load systems.
	 */
	public void setCheckIntreval(long ms)
	{
		EX.assertx(ms >= 0L);
		checkIntreval.set(ms);

		withCheck((ms != 0L), c ->
		{
			if(!checkIntreval.compareAndSet(ms, ms))
				return;

			if(ms == 0L)
				c.exit();
			else
				c.updated();
		});
	}

	protected final AtomicLong checkIntreval = new AtomicLong(0L);


	/* Scripts Execution */

	public boolean exists(String script)
	{
		EX.asserts(script);
		return (files.cached(script) != null);
	}

	/**
	 * Executes script by it's path related to
	 * one of the roots configured.
	 */
	public Object  execute(String script, String function, JsCtx ctx, Object... args)
	{
		EX.assertn(ctx);
		EX.asserts(function);

		//~: search for the scripting file
		JsFile file = files.cached(script);

		//?: {found it not}
		EX.assertn(file, "No script file is found by the path [", script, "]!");

		//~: allocate the engine
		JsEngine engine = this.engines.take(file);

		//~: execute the script
		try
		{
			return engine.invoke(function, ctx, args);
		}
		finally
		{
			//!: free the engine
			this.engines.free(engine);
		}
	}

	protected volatile JsEngines engines;

	@PostConstruct
	public void close()
	{
		withCheck(false, Check::exit);
	}


	/* protected: check interval */

	protected void withCheck(boolean required, Consumer<Check> f)
	{
		while(true)
		{
			final CheckSet c = check.get();

			if(c == null)
			{
				if(!required)
					break;

				//~: create new check thread
				final CheckSet x = new CheckSet();
				if(check.compareAndSet(null, x))
					x.run();

				continue;
			}

			f.accept(c.check);
			break;
		}
	}

	protected AtomicReference<CheckSet> check =
	  new AtomicReference<>();

	protected Check createCheck(CheckSet cs)
	{
		return new Check(cs);
	}

	protected void  doCheck()
	{
		final JsEngines engined = this.engines;

		if(engined != null) try
		{
			engines.check();
		}
		catch(Throwable ignore)
		{}
	}

	protected class CheckSet implements Runnable
	{
		public volatile Thread thread;

		public void run()
		{
			thread = new Thread(check);

			//~: check thread name
			thread.setName("JsX-CheckThread-" + Integer.toHexString(
			  Math.abs(System.identityHashCode(JsX.this))));

			//!: daemon thread
			thread.setDaemon(true);

			//~: start it
			thread.start();
		}

		public final Check check = createCheck(this);
	}

	protected class Check implements Runnable
	{
		public final CheckSet cs;

		public Check(CheckSet cs)
		{
			this.cs = cs;
		}


		/* Check Thread Task */

		public void run()
		{
			while(true)
			{
				synchronized(this)
				{
					if(exit) //?: {exit the threads}
					{
						check.compareAndSet(cs, null);
						return;
					}

					try //~: do wait the interval
					{
						final long to = checkIntreval.get();

						if(to > 0L)
							this.wait(to);
						else
							this.wait(); //<-- wait for update or exit
					}
					catch(InterruptedException e)
					{
						this.exit = true;
						continue;
					}
				}

				doCheck();
			}
		}

		public void exit()
		{
			synchronized(this)
			{
				this.exit = true;
				this.notifyAll();
			}
		}

		public void updated()
		{
			synchronized(this)
			{
				this.notifyAll();
			}
		}

		protected boolean exit;
	}
}