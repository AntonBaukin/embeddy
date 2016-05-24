package net.java.osgi.embeddy.boot.ziper;

/* Java */

import java.io.BufferedOutputStream;
import java.io.Closeable;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.zip.ZipFile;

/* embeddy: zip file system */

import net.java.osgi.embeddy.boot.EX;


/**
 * Stores extracted archives
 * in Java temporary files.
 *
 * @author anton.baukin@gmail.com.
 */
public class ZiPTmpStore implements ZiPStorage
{
	/* ZiP Storage */

	public void         permanent(ZiPArchive za)
	  throws IOException
	{
		EX.assertx(null == refs.put(za,
		  new ZipRef(EX.assertn(za.file), false)
		));
	}

	public OutputStream temporary(ZiPArchive za)
	  throws IOException
	{
		return new BindStream(za, createTempFile(za));
	}

	public ZipFile      access(ZiPArchive za)
	{
		ZipRef ref = refs.get(za);
		return (ref == null)?(null):(ref.zip);
	}

	public File         file(ZiPArchive za)
	{
		ZipRef ref = refs.get(za);
		return (ref == null)?(null):(ref.file);
	}


	/* Closeable */

	public void         close()
	  throws IOException
	{
		Object[]  refs = this.refs.values().toArray();
		Throwable err  = null;

		for(Object r : refs) try
		{
			((Closeable)r).close();
		}
		catch(Throwable e)
		{
			if(err == null) err = e;
		}

		if(err instanceof IOException)
			throw (IOException) err;
		else if(err != null)
			throw EX.wrap(err);
	}

	protected final Map<ZiPArchive, ZipRef> refs =
	  new ConcurrentHashMap<>(11);


	/* protected: ZiP Reference */

	protected static class ZipRef implements Closeable
	{
		public final File    file;
		public final ZipFile zip;
		public final boolean temp;

		public ZipRef(File file, boolean temp)
		  throws IOException
		{
			this.file = file;
			this.zip  = new ZipFile(file);
			this.temp = temp;
		}


		/* Closeable */

		public void close()
		  throws IOException
		{
			try
			{
				zip.close();
			}
			finally
			{
				if(temp)
					if(!file.delete())
						file.deleteOnExit();
			}
		}
	}


	/* protected: Bind Stream */

	protected class BindStream extends FilterOutputStream
	{
		public BindStream(ZiPArchive za, File file)
		  throws IOException
		{
			super(new BufferedOutputStream(new FileOutputStream(file), 2048));

			this.file    = file;
			this.archive = za;
		}

		protected final File       file;
		protected final ZiPArchive archive;

		public void close()
		  throws IOException
		{
			super.close();

			try
			{
				EX.assertx(null == refs.put(archive,
				  new ZipRef(file, true)
				));
			}
			catch(Throwable err)
			{
				if(!file.delete())
					file.deleteOnExit();

				if(err instanceof IOException)
					throw (IOException) err;
				else
					throw EX.wrap(err);
			}
		}
	}

	protected File createTempFile(ZiPArchive za)
	  throws IOException
	{
		return File.createTempFile(getClass().getSimpleName(), ".jar");
	}
}