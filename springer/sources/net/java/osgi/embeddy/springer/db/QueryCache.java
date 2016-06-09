package net.java.osgi.embeddy.springer.db;

/* Java */

import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/* SAX */

import org.xml.sax.Attributes;
import org.xml.sax.helpers.DefaultHandler;
import javax.xml.parsers.SAXParserFactory;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;


/**
 * Supports loading and storing database queries
 * from XML files names as the Get-strategies
 * with '.q.xml' suffix added.
 *
 * Cache supports hierarchy of Get-strategies
 * and look up in the parent when doesn't find
 * the query id requested.
 *
 *
 * @author anton.baukin@gmail.com.
 */
public class QueryCache
{
	/* Cache Registry */

	public static QueryCache cache(Class<?> get)
	{
		EX.assertn(get);

		//?: {query base class} has it no
		if(GetBase.class.equals(get))
			return null;

		//?: {object base class} has it no
		if(Object.class.equals(get))
			return null;

		//~: get with create on first demand
		return CACHES.computeIfAbsent(get, QueryCache::new);
	}

	private static final ConcurrentMap<Class<?>, QueryCache>
	  CACHES = new ConcurrentHashMap<>(17);

	protected QueryCache(Class<?> get)
	{
		this.parent = QueryCache.cache(get.getSuperclass());
		this.file   = getQueryFile(get);

		ReentrantReadWriteLock rwl = new ReentrantReadWriteLock();
		this.readLock  = rwl.readLock();
		this.writeLock = rwl.writeLock();
	}


	/* Query Cache */

	public String q(String id)
	{
		EX.asserts(id);
		readLock.lock();

		try
		{
			//?: {no loaded yet} do load
			if(queries == null)
			{
				readLock.unlock();
				writeLock.lock();

				try
				{
					if(queries == null)
						this.load();
				}
				finally
				{
					writeLock.unlock();
					readLock.lock();
				}
			}

			//~: lookup in the mapping
			String q = queries.get(id);
			return (q != null)?(q):(parent == null)?(null):parent.q(id);
		}
		finally
		{
			readLock.unlock();
		}
	}

	public void   load()
	{
		writeLock.lock();

		try
		{
			//?: {do reload}
			if(queries != null)
			{
				queries = null;

				if(parent != null)
					parent.load();
			}

			queries = new HashMap<>(17);

			//?: {has no file} do nothing
			if(file == null) return;

			//~: invoke the reader
			try
			{
				loadQueries(file, queries);
			}
			catch(Throwable e)
			{
				throw EX.wrap(e, "Error while processing ",
				  "queries file [", file, "]!");
			}
		}
		finally
		{
			writeLock.unlock();
		}
	}


	/* protected: loading the queries */

	protected URL  getQueryFile(Class<?> get)
	{
		return get.getResource(get.getSimpleName() + ".q.xml");
	}

	protected void loadQueries(URL file, Map<String, String> queries)
	  throws Throwable
	{
		synchronized(QueryCache.class)
		{
			if(parserFactory == null)
				parserFactory = SAXParserFactory.newInstance();
		}

		parserFactory.newSAXParser().parse(
		  file.toString(), new QueriesReader(queries));
	}

	protected static volatile SAXParserFactory parserFactory;


	/* Queries Reader */

	public static class QueriesReader extends DefaultHandler
	{
		public QueriesReader(Map<String, String> queries)
		{
			this.queries = EX.assertn(queries);
		}

		public final Map<String, String> queries;


		/* Content Handler */

		public void startElement(String u, String n, String q, Attributes a)
		{
			if("query".equals(q))
			{
				sb.delete(0, sb.length());

				id = EX.asserts(a.getValue("id"),
				  "Query id is undefined!");
			}
		}

		public void endElement(String u, String n, String q)
		{
			if("query".equals(q))
			{
				String qq = sb.toString().trim();
				sb.delete(0, sb.length());

				EX.assertn(id);
				EX.asserts(qq, "Query by id [", id, "] is empty!");

				queries.put(id, qq);
				id = null;
			}
		}

		public void characters(char[] ch, int start, int length)
		{
			if(id != null)
				sb.append(ch, start, length);
		}

		protected String        id;
		protected StringBuilder sb = new StringBuilder(128);
	}


	/* private: the state of the cache */

	private final QueryCache     parent;
	private final URL            file;
	private Map<String, String>  queries;
	private final Lock           readLock;
	private final Lock           writeLock;
}