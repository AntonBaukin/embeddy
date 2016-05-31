package net.java.osgi.embeddy.springer.servlet;

/* Java */

import java.io.IOException;

/* Java Servlet */

import javax.servlet.GenericServlet;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.support.ForbiddenException;
import net.java.osgi.embeddy.springer.support.HiddenError;


/**
 * Servlet that sequentially invokes the filters
 * configured on the initialization.
 * 
 * 
 * @author anton.baukin@gmail.com.
 */
public class FiltersServlet extends GenericServlet
{
	public FiltersServlet(FiltersPoint point)
	{
		this.point = EX.assertn(point);
	}

	public final FiltersPoint point;


	/* Constants */

	/**
	 * Constant that defines atribute of a Hidden
	 * Error ocurred during the processing of
	 * a nested request (forwarded, included)
	 * and reported to the outer level.
	 */
	public static final String HIDDEN_ERROR =
	  FiltersServlet.class.getName() + ": Hidden Error";


	/* Generic Servlet */

	public void service(ServletRequest req, ServletResponse res)
	  throws ServletException, IOException
	{
		Job job = createJob();

		//=: request
		EX.assertx(req instanceof HttpServletRequest);
		job.request  = (HttpServletRequest)req;

		//=: response
		EX.assertx(res instanceof HttpServletResponse);
		job.response = (HttpServletResponse)res;

		try
		{
			//~: create the filter task
			initTask(job);

			//~: and process it
			EX.assertn(job.task);
			processTask(job);

			//?: {has error}
			if(job.task.getError() != null)
				throw job.task.getError();
		}
		catch(Throwable e)
		{
			job.error = e;
			handleError(job);
		}
	}


	/* protected: filter processing */

	protected Job  createJob()
	{
		return new Job();
	}

	protected void processTask(Job job)
	{
		try
		{
			job.task.continueCycle();
		}
		catch(Throwable e)
		{
			job.task.setError(e);
		}
	}

	protected void initStage(Job job)
	{
		job.stage = FilterStage.valueOf(
		  job.request.getDispatcherType().toString());
	}

	protected void initFilters(Job job)
	{
		job.filters = point.getFilters(job.stage);
	}

	protected void initFilterCycle(Job job)
	{
		job.cycle = new FilterCycle(job.task, job.filters);
	}

	protected void initTask(Job job)
	{
		//~: get the filter stage
		initStage(job);
		if(job.stage == null)
			return;

		//~: get the filters
		initFilters(job);
		if(job.filters == null)
			return;

		//~: create the task
		job.task = new Task(job.stage);

		//=: request
		job.task.setRequest(job.request);

		//=: response
		job.task.setResponse(job.response);

		//~: create the cycle strategy
		initFilterCycle(job);
		job.task.setFilterCycle(job.cycle);
	}

	protected void handleError(Job job)
	  throws IOException, ServletException
	{
		//?: {hidden}
		if(EX.search(job.error, HiddenError.class) != null)
		{
			handleHiddenError(job);
			return;
		}

		//?: {forbidden}
		if(EX.search(job.error, ForbiddenException.class) != null)
		{
			handleForbiddenError(job);
			return;
		}

		//~: unwrap and throw
		fallbackError(job);
	}

	protected void handleHiddenError(Job job)
	  throws IOException, ServletException
	{
		//?: {has outer request}
		if(FilterStage.REQUEST.equals(job.stage))
			fallbackError(job);

		//~: save error to the request
		job.request.setAttribute(HIDDEN_ERROR,
		  EX.search(job.error, HiddenError.class));
	}

	protected void handleForbiddenError(Job job)
	  throws IOException, ServletException
	{
		ForbiddenException e = EX.search(job.error, ForbiddenException.class);

		//?: {committed the response}
		if(job.response.isCommitted() || (e == null))
			throw new ServletException(e);

		job.response.reset(); //<-- reset the buffer

		//~: send 403 HTTP error
		job.response.sendError(HttpServletResponse.SC_FORBIDDEN, e.getMessage());
	}

	protected void fallbackError(Job job)
	  throws IOException, ServletException
	{
		Throwable e = EX.xrt(job.error);

		if(e instanceof ServletException)
			throw (ServletException)e;
		else if(e instanceof IOException)
			throw (IOException)e;
		else if(e instanceof RuntimeException)
			throw (RuntimeException)e;
		else
			throw new ServletException(e);
	}


	/* Filter Job */

	/**
	 * Collection of request-related variables.
	 */
	protected static class Job
	{
		public HttpServletRequest  request;
		public HttpServletResponse response;
		public FilterStage         stage;
		public Task                task;
		public FilterCycle         cycle;
		public Filter[]            filters;
		public Throwable           error;
	}


	/* Filter Task */

	protected static class Task extends FilterTaskBase
	{
		/* public: constructor */

		public Task(FilterStage filterStage)
		{
			super(filterStage);
		}


		/* Filter Task */

		public void continueCycle()
		{
			cycle.continueCycle();
		}

		protected FilterCycle cycle;

		public void setFilterCycle(FilterCycle filterCycle)
		{
			EX.assertx(this.cycle == null);
			this.cycle = filterCycle;
		}
	}
}