package net.java.osgi.embeddy.springer.jsx;

/* Java */

import java.io.Reader;
import java.io.Writer;
import java.util.HashMap;
import java.util.Map;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.SU;


/**
 * This Java object is available for all
 * JavaScripts by the name 'JsX'.
 *
 * The instance of JsX-global is private
 * for each engine. It is created with
 * the initial script execution and
 * never changed after it.
 *
 *
 * @author anton.baukin@gmail.com.
 */
public class JsGlobal
{
	/**
	 * By this name the global objects are mapped.
	 */
	public static final String NAME = "JsX";

	public JsGlobal(Nesting engine)
	{
		this.engine = engine;
	}

	protected final Nesting engine;


	/* Nesting */

	public static interface Nesting
	{
		/* Scripts Nesting */

		public JsFile resolve(String path);

		public Object nest(String script, Map<String, Object> vars);

		/**
		 * Returns current execution context.
		 */
		public JsCtx  ctx();
	}


	/* Streams Access */

	public Reader in()
	{
		return engine.ctx().getStreams().getInput();
	}

	public Writer out()
	{
		return engine.ctx().getStreams().getOutput();
	}

	public Writer err()
	{
		return engine.ctx().getStreams().getError();
	}


	/* Scripting Interface */

	/**
	 * The meaning of this method is the same
	 * as of Node.js require. Here the path uses
	 * URI's '/' separators. If the file name
	 * doesn't contain '.', '.js' suffix is added.
	 *
	 * If the path starts with './' it is assumed
	 * to be local and related to the script is
	 * being currently executed.
	 */
	public Object include(String script)
	{
		return engine.nest(script, null);
	}

	/**
	 * Includes the given script once.
	 * On the following calls returns
	 * the object created before.
	 */
	public Object once(String script)
	{
		//~: resolve the absolute script
		JsFile file = this.engine.resolve(script);

		//?: {invoked it before}
		if(this.onces.containsKey(file))
			return this.onces.get(file);

		//!: include the script
		Object res = this.include(script);
		this.onces.put(file, res);
		return res;
	}

	protected Map<JsFile, Object> onces =
	  new HashMap<>();

	/**
	 * The same as {@link #include(String)}, but allows
	 * to temporary set the variables while executing.
	 */
	public Object invoke(String script, Map<String, Object> vars)
	{
		return engine.nest(script, vars);
	}

	/**
	 * Creates on first request a global variable
	 * (an Map object), on following requests
	 * returns the same instance.
	 */
	@SuppressWarnings("unchecked")
	public Object global(String name)
	{
		return globals.computeIfAbsent(
		  name, n -> new JsPlain());
	}

	@SuppressWarnings("unchecked")
	public Object global(String name, boolean create)
	{
		return (!create)?(globals.get(name)):
		  globals.computeIfAbsent(name, n -> new JsPlain());
	}

	public Object debug(Object... args)
	{
		Object res = engine.ctx().jsX.debug(args);
		return (res == null)?(this):(res);
	}

	protected final Map<String, Object> globals =
	  new HashMap<>();


	/* String Utilities */

	public final String jss(String s)
	{
		return SU.jss(s);
	}

	public final String html(String s)
	{
		return SU.escapeXML(s);
	}


	/* Application Access */

	public final Object bean(String name)
	{
		return engine.ctx().jsX.applicationContext.getBean(name);
	}
}