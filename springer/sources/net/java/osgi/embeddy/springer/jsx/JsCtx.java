package net.java.osgi.embeddy.springer.jsx;

/* Java */

import java.io.InputStream;
import java.io.OutputStream;
import java.io.Reader;
import java.io.Writer;
import java.util.HashMap;
import java.util.Map;

/* Java Scripting */

import javax.script.Bindings;
import javax.script.ScriptContext;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.support.Perks;


/**
 * Parameters and the results of
 * Script Execution.
 *
 * @author anton.baukin@gmail.com.
 */
public class JsCtx implements AutoCloseable
{
	public JsCtx(JsX jsX)
	{
		this.jsX = jsX;
	}

	public final JsX jsX;


	/* Initialization */

	/**
	 * Tells to create the context with discarding
	 * standard and error streams.
	 */
	public static final Object VOID = "void";

	/**
	 * Tells to create the context
	 * with discarding error stream.
	 */
	public static final Object XERR = "no-error";

	/**
	 * Creates context with empty input stream
	 * and buffers for error and standard streams.
	 *
	 * The perks supported are: VOID; XERR;
	 * byte[], or Input Stream, or Reader
	 * as the input; Output Stream, or
	 * Writer as the output; JsStreams.
	 *
	 * The encoding supposed is UTF-8.
	 */
	public JsCtx init(Object... perks)
	{
		Perks ps = new Perks(perks);

		//~: initialize the streams
		initStreams(ps);

		//~: initialize the variables
		initVars(ps);

		return this;
	}


	/* Variables */

	public JsCtx  put(String name, Object value)
	{
		vars.put(name, value);
		return this;
	}

	protected final Map<String, Object> vars =
	  new HashMap<>(3);

	public Object get(String name)
	{
		return vars.get(name);
	}

	public void   assign(Bindings b, Map<String, Object> old)
	{
		for(Map.Entry<String, Object> e : vars.entrySet())
		{
			if(old != null)
				old.put(e.getKey(), b.get(e.getKey()));
			b.put(e.getKey(), e.getValue());
		}
	}


	/* Streams & Closeable */

	public JsStreams getStreams()
	{
		return (streams != null)?(streams):
		  (streams = new JsStreams());
	}

	protected JsStreams streams;


	/* Closeable */

	/**
	 * Closes all the streams assigned
	 * to this context.
	 */
	public void close()
	{
		if(streams != null)
			streams.close();
	}

	public void flush()
	{
		if(streams != null)
			streams.flush();
	}


	/* Scripts Execution */

	@SuppressWarnings("unchecked")
	public void assign(ScriptContext ctx)
	{
		this.getStreams().assign(ctx);

		//~: set the variables
		for(Map.Entry<String, Object> e : this.vars.entrySet())
			ctx.setAttribute(e.getKey(), e.getValue(), ScriptContext.ENGINE_SCOPE);
	}


	/* protected: initialization */

	protected void initStreams(Perks ps)
	{
		ps.find(JsStreams.class, s -> streams = s);
		if(streams == null)
			streams = new JsStreams();

		//?: {void streams}
		if(ps.when(VOID))
		{
			streams.output((Writer) null).
			  error((Writer) null);
			return;
		}

		//?: {has no error stream}
		if(ps.when(XERR))
			streams.error((Writer) null);

		//~: bytes -> input reader
		ps.find(byte[].class, streams::input);

		//~: input stream -> input reader
		ps.find(InputStream.class, streams::input);

		//~: reader -> input reader
		ps.find(Reader.class, streams::input);

		//~: output stream -> output writer
		ps.find(OutputStream.class, streams::output);

		//~: writer -> output writer
		ps.find(Writer.class, streams::output);

		//~: default output
		streams.output();

		//~: default error
		streams.error();
	}

	@SuppressWarnings("unchecked")
	protected void initVars(Perks ps)
	{
		Map<?,?> vars = ps.find(Map.class);
		if(vars == null) return;

		for(Map.Entry<?,?> e : vars.entrySet())
			if(e.getKey() instanceof String)
				this.vars.put((String) e.getKey(), e.getValue());
	}
}