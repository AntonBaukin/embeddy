package net.java.osgi.embeddy.springer.jsx;

/* Java */

import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/* Java Servlets */

import javax.servlet.ServletException;

/* Spring Framework */

import net.java.osgi.embeddy.springer.support.SetLoader;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

/* embeddy: springer + jsx */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.SU;
import net.java.osgi.embeddy.springer.servlet.FilterTask;
import net.java.osgi.embeddy.springer.servlet.PickedFilter;
import net.java.osgi.embeddy.springer.servlet.REQ;
import net.java.osgi.embeddy.springer.support.BytesStream;


/**
 * This servlet forwards the processing to
 * JavaScript file having '.jsx' extension.
 *
 * It prepares the execution context and invokes
 * {@link JsX#apply(String, String, JsCtx, Object...)}
 * having the first argument the script requested,
 * second argument the name of the HTTP method
 * in the lower case (get, post, put, and else),
 * and the call arguments are Servlet request
 * and response objects.
 *
 * Servlet input stream is wrapped with Reader
 * in the encoding of the body request. Do
 * not call it in the case of binary stream.
 * To access the input Reader in the script
 * call {@code JsX.in()}.
 *
 * Response may be written directly from the
 * Servlet response object, or via wrapped Writer.
 * To access it call {@code JsX.out()}.
 *
 * Any error text written to error Writer via
 * {@code JsX.err()} has priority over the
 * ordinary output text and responded with
 * server internal error 500 status.
 *
 *
 * @author anton.baukin@gmail.com.
 */
@Component @Scope("prototype")
public class JsFilter extends PickedFilter
{
	/* Filter */

	public void openFilter(FilterTask task)
	{
		//?: {is not a JsX task} skip
		if(!isJsXTask(task)) return;

		//~: resolve the page requested
		String script = resolveScript(task);
		if(script == null) try
		{
			task.getResponse().sendError(404);
			return;
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}

		JsCtx ctx = null; try
		{
			//~: create the context
			ctx = createContext(task);

			//?: {cold not create it} skip
			if(ctx == null) return;

			//!: invoke the script
			callScript(script, ctx, task);
		}
		catch(Throwable e)
		{
			//~: print the error to the proper stream
			if(ctx != null) try
			{
				PrintWriter w = new PrintWriter(ctx.getStreams().getError());
				e.printStackTrace(w);
				w.flush();
			}
			catch(Throwable e2)
			{
				throw EX.wrap(new ServletException(e2));
			}
			finally
			{
				ctx.close();
			}
		}

		//~: deliver the results
		if(ctx != null) try
		{
			//~: flush the streams
			ctx.getStreams().flush();

			//?: {have error text} send error
			BytesStream err = ctx.getStreams().getErrorBytes();
			if((err != null) && (err.length() != 0L))
			{
				//~: stratus, type, length
				task.getResponse().setStatus(500);
				task.getResponse().setContentType("text/plain;charset=UTF-8");
				task.getResponse().setContentLength((int)err.length());

				//!: write the bytes
				err.copy(task.getResponse().getOutputStream());
				return;
			}

			//TODO support GZIP in JsFilter

			//?: {have output text}
			BytesStream out = ctx.getStreams().getOutputBytes();
			if((out != null) && (out.length() != 0L))
			{
				//~: content length
				task.getResponse().setContentLength((int)out.length());

				//!: write the bytes
				out.copy(task.getResponse().getOutputStream());
			}
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
		finally
		{
			//~: close the context
			ctx.close();
		}
	}


	/* JsX Filter (configuration) */

	public void setJsX(JsX jsX)
	{
		this.jsX = jsX;
	}

	protected volatile JsX jsX;


	/* protected: servlet internals */

	protected boolean isJsXTask(FilterTask task)
	{
		return task.getRequest().getRequestURI().endsWith(".jsx");
	}

	protected boolean isTextContent(String ct)
	{
		return ct.startsWith("text/")          ||
		  "application/javascript".equals(ct)  ||
		  "application/json".equals(ct);
	}

	protected void    callScript(String script, JsCtx ctx, FilterTask task)
	  throws Throwable
	{
		final String f = task.getRequest().getMethod().toLowerCase();

		new SetLoader(jsX.getLoader()).run(() ->
			ctx.jsX.apply(script, f, ctx));
	}

	protected String  resolveScript(FilterTask task)
	{
		String uri = task.getRequest().getRequestURI();

		//?: {has context path}
		String cp = task.getRequest().getContextPath();
		if(uri.startsWith(cp))
			uri = uri.substring(cp.length());

		//?: {script is not found}
		final JsX jsX = this.jsX;
		if((jsX == null) || !jsX.exists(uri))
			return null;

		return uri;
	}

	protected JsCtx   createContext(FilterTask task)
	  throws java.io.IOException, ServletException
	{
		final JsX   jsX = this.jsX;
		if(jsX == null) return null;

		final JsCtx ctx = new JsCtx(jsX);

		//~: set the parameters
		contextParams(task, ctx);

		//~: assign the streams
		assignInputStream(ctx, task);

		//~: default output and error streams
		ctx.getStreams().output().error();

		//=: request variable
		ctx.put("request", task.getRequest());

		//=: response variable
		ctx.put("response", task.getResponse());

		return ctx;
	}

	protected void    contextParams(FilterTask task, JsCtx ctx)
	{
		//~: copy the request parameters into variable
		Map<String, Object> params = new HashMap<>();
		params.putAll(task.getRequest().getParameterMap());
		ctx.put("params", params);

		//~: replace string arrays
		for(Map.Entry<String, Object> e : params.entrySet())
			if(e.getValue() instanceof String[])
				if(((String[])e.getValue()).length == 1)
					e.setValue(((String[])e.getValue())[0]);
				else
					e.setValue(Arrays.asList((String[])e.getValue()));
	}

	@SuppressWarnings("unchecked")
	protected void    assignInputStream(JsCtx ctx, FilterTask task)
	  throws java.io.IOException, ServletException
	{
		String ct = task.getRequest().getHeader("Content-Type");
		String en = null;

		//?: {has no content type} assume empty
		if(ct == null)
			return; //<-- the default is empty stream
		else
			ct = ct.toLowerCase();

		//?: {content type has parameters}
		if(ct.indexOf(';') != -1)
		{
			String[] xct = SU.s2a(ct, ';');
			EX.asserte(xct);

			//[0]: content type
			ct = EX.asserts(SU.s2s(xct[0]));

			//~: search for the charset
			for(int i = 1;(i < xct.length);i++)
			{
				String s = SU.s2s(xct[0]);
				if(s == null) continue;

				final String CS = "chartset=";
				if(s.startsWith(CS))
					en = SU.s2s(s.substring(CS.length()));
			}
		}

		//?: {no encoding defined} assume UTF-8
		if(en == null)
			en = "UTF-8";
		else
			en = en.toUpperCase();

		//=: content type variable
		ctx.put("contentType", ct);

		//?: {input stream is text}
		if(isTextContent(ct))
		{
			//~: use the request input stream
			ctx.getStreams().input(new InputStreamReader(
			  task.getRequest().getInputStream(), en));

			return;
		}

		//?: {decode body parameters}
		if("application/x-www-form-urlencoded".equals(ct))
		{
			REQ.decodeBodyParams(new InputStreamReader(
			  task.getRequest().getInputStream(), en),
			  en, (Map<String, Object>) ctx.get("params")
			);

			return;
		}

		//~: assign input stream variable
		ctx.put("stream", task.getRequest().getInputStream());
	}
}