package net.java.osgi.embeddy.springer.jsx;

/* Java */

import java.io.File;
import java.io.InputStream;
import java.lang.ref.Reference;
import java.lang.ref.SoftReference;
import java.net.URI;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.support.BytesStream;
import net.java.osgi.embeddy.springer.support.Hash;


/**
 * Denotes JavaScript thread-safe file
 * stored somewhere.
 *
 * @author anton.baukin@gmail.com.
 */
public class JsFile implements AutoCloseable
{
	public JsFile(URI uri, JsStat stat)
	{
		this.uri  = EX.assertn(uri).normalize();
		this.stat = EX.assertn(stat);
		this.file = asFile(uri);

		ReentrantReadWriteLock rwl = new ReentrantReadWriteLock();
		this.contentRead  = rwl.readLock();
		this.contentWrite = rwl.writeLock();
	}

	protected final URI uri;

	protected final JsStat stat;


	/* JavaScript File */

	public URI     uri()
	{
		return this.uri;
	}

	/**
	 * Returns file if script is located
	 * explicitly in the file system.
	 */
	public File    file()
	{
		return this.file;
	}

	protected final File file;

	/**
	 * Loads the file on the first demand
	 * (also, after each clean request).
	 */
	public String  content(Hash hash)
	{
		//~: access cached content
		contentRead.lock();
		try
		{
			String res = (content == null)?(null):(content.get());
			if(res != null)
			{
				stat.add(this, "content-hit", 0L);
				if(hash != null)
					hash.assign(this.hash);
				return res;
			}
		}
		finally
		{
			contentRead.unlock();
		}

		//~: load the content
		contentWrite.lock();
		try
		{
			//?: {loaded it while lock access}
			String res = (content == null)?(null):(content.get());
			if(res != null)
			{
				stat.add(this, "content-hit", 0L);
				if(hash != null)
					hash.assign(this.hash);
				return res;
			}

			final long ts = System.currentTimeMillis();

			try
			(
			  InputStream is = this.uri.toURL().openStream();
			  BytesStream bs = new BytesStream()
			)
			{
				//~: load the content bytes
				EX.assertn(is, "Resource file does not exist!");
				bs.write(is);

				//~: raw bytes of the content
				byte[] raw = bs.bytes();

				//~: calculate the hash
				this.hash.reset().update(raw, 0, raw.length);
				if(hash != null)
					hash.assign(this.hash);

				//~: make the content string
				res = new String(raw, "UTF-8");
				stat.add(this, "content-load", ts);
				content = new SoftReference<>(res);
				this.ts = ts;

				return res;
			}
			catch(Throwable e)
			{
				throw EX.wrap(e, "Can't read JsFile [", this.uri, "]!");
			}
		}
		finally
		{
			contentWrite.unlock();
		}
	}

	protected Reference<String> content;
	protected final Hash        hash = new Hash();
	protected final Lock        contentRead;
	protected final Lock        contentWrite;

	/**
	 * Just frees the bytes buffer.
	 */
	public void    close()
	{
		stat.add(this, "close", 0L);
		contentWrite.lock();
		try
		{
			this.content = null;
			this.hash.reset();
		}
		finally
		{
			contentWrite.unlock();
		}
	}

	/**
	 * For local files, checks that the file
	 * was modified (by the timestamp) and,
	 * if so, cleans the buffer to reload
	 * the file further.
	 *
	 * Bundle resources that are not files
	 * may not be updated. Explode them!
	 */
	public void    revalidate()
	{
		stat.add(this, "revalidate", 0L);

		//?: {is a normal file}
		if(file != null) try
		{
			if(file.lastModified() > this.ts)
				this.close();
		}
		catch(Throwable ignore)
		{}
	}

	protected volatile long ts;

	public Hash    hash()
	{
		return this.hash;
	}


	/* Object */

	public boolean equals(Object o)
	{
		return (this == o) ||
		  !(o == null || getClass() != o.getClass()) &&
		  uri.equals(((JsFile)o).uri);
	}

	public int hashCode()
	{
		return uri.hashCode();
	}


	/* Helpers */

	public static File asFile(URI uri)
	{
		File f = null;

		try
		{
			f = new File(uri);
		}
		catch(Throwable ignore)
		{
			try
			{
				f = new File(uri.getPath());
			}
			catch(Throwable ignore2)
			{}
		}
		finally
		{
			if(f != null) try
			{
				if(!f.isFile() || !f.canRead() || (f.length() == 0L))
					f = null;
			}
			catch(Throwable e)
			{
				f = null;
			}
		}

		return f;
	}
}