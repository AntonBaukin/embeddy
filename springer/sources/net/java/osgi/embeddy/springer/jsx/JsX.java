package net.java.osgi.embeddy.springer.jsx;

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
public class JsX
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


	/* /* Java Scripting eXtended (configuration) */

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

		this.files   = new JsFiles(rs);
		this.engines = new JsEngines(this, this.files);
	}


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

	protected JsEngines engines;
}