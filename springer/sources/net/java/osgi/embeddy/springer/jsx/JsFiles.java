package net.java.osgi.embeddy.springer.jsx;

/* Java */

import java.net.URI;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import net.java.osgi.embeddy.springer.EX;

/* embeddy: springer */


/**
 * Container of script files.
 *
 * @author anton.baukin@gmail.com.
 */
public class JsFiles
{
	public JsFiles(String[] roots)
	{
		this.roots = roots;
	}

	public final String[] roots;


	/* Files Access */

	/**
	 * Caching wrapper over {@link #find(String)}.
	 */
	public JsFile cached(String path)
	{
		//~: normalize the path
		path = this.path(path);

		Cache cache = this.files.computeIfAbsent(
		  path, p -> new Cache(find(p))
		);

		//?: {found not}
		if(cache.file == null)
			//?: {searched 4-seconds before}
			if(cache.created + 4000 < System.currentTimeMillis())
				this.files.put(path, cache = new Cache(find(path)));

		return cache.file;
	}

	protected final Map<String, Cache> files =
	  new ConcurrentHashMap<>();

	/**
	 * Re-validates all the files cached.
	 */
	public void   revalidate()
	{
		for(Cache c : this.files.values())
			if(c.file != null)
				c.file.revalidate();
	}

	/**
	 * Searches for the script file having the name
	 * given related to some of the roots. All the
	 * roots are scanned to exclude duplicates.
	 * The path name uses URI's '/' separators.
	 */
	public JsFile find(String path)
	{
		//!: use global class loader to search for
		ClassLoader cl = Thread.currentThread().
		  getContextClassLoader();

		//~: normalize the path
		path = this.path(path);

		List<URL> us = new ArrayList<>(1);
		for(String r : this.roots) try
		{
			us.addAll(Collections.list(
			  cl.getResources(r + path)));
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Can't access resource [", r + path, "]!");
		}

		if(us.isEmpty())
			return null;

		EX.assertx(us.size() == 1, "More than one script resource was found ",
		  "for path [", path, "]: ", us);

		try
		{
			return new JsFile(us.get(0).toURI());
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
	}

	/**
	 * Path (script file name) normalization.
	 * If path is package-like, '.js' extension
	 * is always added to the file name.
	 */
	public String path(String path)
	{
		EX.asserts(path);
		if(!path.startsWith("/"))
			path = "/" + path;

		//?: {has no extension} add '.js'
		int x = path.lastIndexOf('/');
		int d = path.lastIndexOf('.');
		if(d <= x) path += ".js";

		return path;
	}

	/**
	 * Takes URI of this file and relates it with
	 * the path given. Tests whether the resource
	 * may be found by that URI and returns it.
	 */
	public JsFile relate(JsFile file, String path)
	{
		EX.asserts(path);

		//?: {has no extension} add '.js'
		int x = path.lastIndexOf('/');
		int d = path.lastIndexOf('.');
		if(d <= x) path += ".js";

		//~: resolve the URI
		URI   u = file.uri().resolve(path).normalize();

		//~: lookup in the cache
		Cache c = this.files.get(u.getPath());
		if(c != null)
			return c.file;

		//~: try create the file
		JsFile f = new JsFile(u);

		//?: {is not a file}
		if(f.file() == null) try
		{
			f.content(null);
		}
		catch(Throwable e)
		{
			f = null;
		}

		//~: cache the result
		this.files.put(u.getPath(), new Cache(f));
		return f;
	}

	/**
	 * Places the given file by it's absolute path.
	 * Used for placing related scripts.
	 */
	public void   put(JsFile file)
	{
		EX.assertn(file);
		this.files.put(file.uri().getPath(), new Cache(file));
	}


	/* Cache Entry */

	protected static class Cache
	{
		/**
		 * The file. Undefined when was not found.
		 * (We cache negative results too!)
		 */
		public final JsFile file;

		/**
		 * Timestamp when this entry was created.
		 */
		public final long   created;

		public Cache(JsFile file)
		{
			this.file    = file;
			this.created = System.currentTimeMillis();
		}
	}
}