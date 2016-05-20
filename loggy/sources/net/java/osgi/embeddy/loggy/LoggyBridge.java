package net.java.osgi.embeddy.loggy;

/* Java */

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/* OSGi */

import org.osgi.framework.ServiceReference;
import org.osgi.service.log.LogService;

/* Logging for Java */

import org.apache.logging.log4j.Level;
import org.apache.logging.log4j.Marker;
import org.apache.logging.log4j.ThreadContext;
import org.apache.logging.log4j.ThreadContext.ContextStack;
import org.apache.logging.log4j.core.LogEvent;
import org.apache.logging.log4j.core.config.Configuration;
import org.apache.logging.log4j.core.impl.ThrowableProxy;
import org.apache.logging.log4j.message.Message;
import org.apache.logging.log4j.message.SimpleMessage;


/**
 * Implementation of Log4j Event combined
 * with OSGi log request processing.
 *
 * @author anton.baukin@gmail.com.
 */
public final class LoggyBridge implements LogEvent
{
	public LoggyBridge(Configuration config)
	{
		this.config    = config;
		this.timestamp = System.currentTimeMillis();
	}

	public final Configuration config;


	/* Logging for Java Bridge */

	public LoggyBridge setLevel(int level)
	{
		switch(level)
		{
			case LogService.LOG_DEBUG:
				this.level = Level.DEBUG;
				break;

			case LogService.LOG_INFO:
				this.level = Level.INFO;
				break;

			case LogService.LOG_WARNING:
				this.level = Level.WARN;
				break;

			case LogService.LOG_ERROR:
				this.level = Level.ERROR;
				break;
		}

		return this;
	}

	protected Level level = Level.OFF;

	public LoggyBridge setMessage(String message)
	{
		if((message != null) && message.isEmpty())
			message = null;
		this.message = message;

		return this;
	}

	protected String message;

	public LoggyBridge setError(Throwable error)
	{
		this.error = error;
		return this;
	}

	protected Throwable error;

	/**
	 * When service is attached, the bridge
	 * takes additional initialization steps.
	 *
	 * It tries to get the service object and
	 * uses it's implementation class name
	 * as the source class.
	 *
	 * It also appends the following strings to
	 * the thread context mapping:
	 *  § ServiceClass  full name of service class;
	 *  § BundleName    bundle symbolic name;
	 *  § BundleVersion bundle version.
	 */
	public LoggyBridge setService(ServiceReference service)
	{
		this.service = service;
		return this;
	}

	protected ServiceReference service;

	public LoggyBridge init()
	{
		//~: mark the thread name
		this.threadName = Thread.currentThread().getName();

		//~: create proxy for the error
		if(error != null)
			errorProxy = new ThrowableProxy(error);

		//~: read service properties
		if(service != null)
			initService();

		return this;
	}

	public void        log()
	{
		//?: {logging system is detached}
		if(config == null)
			return;

		//~: send event to the logging framework
		config.getLoggerConfig(getLoggerFqcn()).log(this);
	}


	/* Log Event */

	public Level getLevel()
	{
		return level;
	}

	public String getLoggerFqcn()
	{
		return (logger == null)?(this.getClass().getName()):(logger);
	}

	protected String logger;

	public Map<String, String> getContextMap()
	{
		return (contextMap != null)?(contextMap):
		  (Collections.<String, String> emptyMap());
	}

	protected Map<String, String> contextMap =
	  new HashMap<String, String>();

	public ContextStack getContextStack()
	{
		return ThreadContext.EMPTY_STACK;
	}

	public String getLoggerName()
	{
		return getClass().getSimpleName();
	}

	public Marker getMarker()
	{
		return null;
	}

	public Message getMessage()
	{
		return (msg != null)?(msg):
		  (msg = new SimpleMessage(this.message));
	}

	protected Message msg;

	public long getTimeMillis()
	{
		return timestamp;
	}

	protected long timestamp;

	public StackTraceElement getSource()
	{
		return null;
	}

	public String getThreadName()
	{
		return threadName;
	}

	protected String threadName;

	public Throwable getThrown()
	{
		return error;
	}

	public ThrowableProxy getThrownProxy()
	{
		return errorProxy;
	}

	protected ThrowableProxy errorProxy;

	public boolean isEndOfBatch()
	{
		return endOfBatch;
	}

	private boolean endOfBatch;

	public void setEndOfBatch(boolean endOfBatch)
	{
		this.endOfBatch = endOfBatch;
	}

	public boolean isIncludeLocation()
	{
		return includeLocation;
	}

	private boolean includeLocation;

	public void setIncludeLocation(boolean includeLocation)
	{
		this.includeLocation = includeLocation;
	}


	/* protected: initialization details */

	protected void initService()
	{
		//~: access the service
		try
		{
			Object s = service.getBundle().getBundleContext().getService(service);

			if(s != null)
			{
				this.logger = s.getClass().getName();
				contextMap.put("ServiceClass", this.logger);
			}
		}
		catch(Throwable e)
		{
			//!:ignore any error
		}

		//~: bundle information
		contextMap.put("BundleName", service.getBundle().getSymbolicName());
		contextMap.put("BundleVersion", service.getBundle().getVersion().toString());
	}
}