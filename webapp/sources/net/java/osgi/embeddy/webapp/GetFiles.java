package net.java.osgi.embeddy.webapp;

/* Java */

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.db.TxBean;

/* application */

import net.java.osgi.embeddy.app.db.FilesStore.FileDump;
import net.java.osgi.embeddy.app.db.FilesStore;
import net.java.osgi.embeddy.app.db.GetObject;


/**
 * Transactional component that stores files
 * from the database while client downloads them.
 * It loads blob bytes into a temporary file on
 * the disk and serves the client having no
 * open database connection. Also, the requests
 * are counted to share the same file.
 *
 * @author anton.baukin@gmail.com.
 */
@Component
public class GetFiles
{
	/* Get File */

	/**
	 * Range of the bytes [start, end),
	 * i.e., end is excluded, as always.
	 */
	public static class Range
	{
		public Range(long start, long end)
		{
			EX.assertx((start >= 0L) && (start < end));

			this.start = start;
			this.end = end;
		}

		public final long start;
		public final long end;

		/**
		 * Actual length of the data.
		 */
		public long       length;
	}

	/**
	 * Callback that strategy gives to the client.
	 */
	public interface Get
	{
		public String  name();

		public String  ext();

		public String  mime();

		public boolean exists();

		/**
		 * Actual length of the data.
		 * Undefined range means all.
		 */
		public long    length(Range r);

		/**
		 * Writes the file to the stream.
		 * The stream is not closed.
		 * Undefined range means all.
		 */
		public void    dump(OutputStream s, Range r);
	}

	/**
	 * Client callback.
	 */
	@FunctionalInterface
	public interface Take
	{
		public void take(Get g);
	}

	/**
	 * Works as {@link #get(String, String, Take)}, but
	 * not actually creates a temporary file,
	 * and dump() operation is unavailable.
	 */
	public void info(String uuid, String types, Take take)
	{
		//?: {not a valid uuid}
		EX.assertx(getObject.isUUID(uuid));
		EX.asserts(types);
		EX.assertn(take);

		//~: file object (fields)
		final Map<String, Object> x = new HashMap<>();

		//~: load the file object
		context.getBean(TxBean.class).invoke(() ->
			nested.jsX.apply("db/obj.js", "get_in_map", uuid, types, x));

		//?: {nothing loaded}
		x.put("exists", !x.isEmpty());
		x.put("uuid", uuid);

		//~: callback
		take.take(new GetBase(x));
	}

	/**
	 * Create (on demand) the copy of the file
	 * from the database (returns false if it's
	 * not found) and invokes the callback.
	 * The file exists only in that call!
	 */
	public void get(String uuid, String types, Take take)
	{
		//?: {not a valid uuid}
		EX.assertx(getObject.isUUID(uuid));
		EX.asserts(types);
		EX.assertn(take);

		//~: load the file
		try(FileObject fo = loadFile(uuid, types))
		{
			take.take(fo);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
	}

	@Autowired
	protected Nested nested;

	@Autowired
	protected GetObject getObject;

	@Autowired
	protected FilesStore filesStore;

	@Autowired
	protected ApplicationContext context;


	/* File Object */

	protected static class GetBase implements Get
	{
		public GetBase(Map<String, Object> object)
		{
			this.object = object;
		}

		public final Map<String, Object> object;


		/* Get */

		public String  name()
		{
			return (String) object.get("name");
		}

		public String  ext()
		{
			return (String) object.get("ext");
		}

		public String  mime()
		{
			return (String) object.get("mime");
		}

		public boolean exists()
		{
			return Boolean.TRUE.equals(object.get("exists"));
		}

		public long    length(Range r)
		{
			if(r != null)
				throw EX.ass();

			return Long.parseLong((String) object.get("length"));
		}

		public void    dump(OutputStream s, Range r)
		{
			throw EX.ass();
		}
	}

	protected class FileObject extends GetBase implements AutoCloseable
	{
		public FileObject(Map<String, Object> object)
		{
			super(object);
		}


		/* Get */

		public long    length(Range r)
		{
			long l; try
			{
				l = file.file().length();
			}
			catch(Throwable e)
			{
				throw EX.wrap(e);
			}

			return (r == null)?(l):(r.start >= l)?(0L):
			  (Math.min(r.end, l) - r.start);
		}

		public void    dump(OutputStream s, Range r)
		{
			byte[] b = new byte[512];

			try(InputStream i = new FileInputStream(file.file()))
			{
				//?: {has the range} skip the bytes
				if((r != null) && (r.start > 0L))
					i.skip(r.start);

				//~: the number of bytes to write
				long z = (r == null)?(Long.MAX_VALUE):(r.end - r.start);

				for(int x;(z > 0L) && ((x = i.read(b)) > 0);z -= x)
					s.write(b, 0, x = (int)Math.min(x, z));
			}
			catch(Throwable e)
			{
				throw EX.wrap(e);
			}
		}


		/* File Object */

		public void    enter()
		{
			synchronized(this)
			{
				counter++;

				//?: {already loaded}
				if(this.file != null)
					return;

				//~: wait while loading
				try
				{
					this.wait();
				}
				catch(InterruptedException e)
				{
					throw EX.wrap(e);
				}
			}
		}

		public void    assign(FileDump file)
		{
			synchronized(this)
			{
				this.file = file;
				this.notifyAll();
			}
		}

		public void    close()
		{
			boolean delete = false;

			synchronized(files)
			{
				synchronized(this)
				{
					if(--counter <= 0)
					{
						String uuid = (String) object.get("uuid");

						//~: remove this key
						FileObject xo = files.remove(uuid);

						//?: {not this by mistake}
						if((xo != null) && (xo != this))
							files.put(uuid, xo);

						delete = true;
					}
				}
			}

			//?: {delete the temporary file}
			if(delete) try
			{
				file.close();
			}
			catch(Throwable e)
			{
				throw EX.wrap(e);
			}
			finally
			{
				file = null;
			}
		}

		protected FileDump file;

		/**
		 * Counter of the file sharing.
		 */
		protected int      counter = 1;
	}

	protected FileObject loadFile(String uuid, String types)
	{
		final FileObject fo;
		boolean          own;

		synchronized(files)
		{
			//~: lookup the file
			FileObject xo = files.get(uuid);
			own = (xo == null);

			if(own) //?: {found it not}
			{
				Map<String, Object> f = new HashMap<>();
				f.put("uuid", uuid);
				files.put(uuid, xo = new FileObject(f));
			}

			fo = xo;
		}

		//?: {not own} wait for the file
		if(!own)
			fo.enter();
		//~: load in a transaction
		else
		{
			TxBean tx = context.getBean(TxBean.class);
			tx.invoke(() -> loadFile(fo, types));
		}

		return fo;
	}

	protected void       loadFile(FileObject fo, String types)
	{
		String   u = (String) fo.object.get("uuid");
		FileDump f = null;

		try
		{
			Map<String, Object> x = new HashMap<>();

			//~: load the file object
			nested.jsX.apply("db/obj.js", "get_in_map", u, types, x);

			//?: {nothing loaded}
			if(x.isEmpty()) return;
			x.put("exists", true);
			fo.object.putAll(x);

			//~: type (required for dump)
			fo.object.put("type", types);

			//~: dump the file content
			f = filesStore.dump(fo.object);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
		finally
		{
			//!: dummy not allows to hang
			fo.assign((f != null)?(f):(new Dummy()));
		}
	}

	/**
	 * The files currently loaded.
	 */
	protected final Map<String, FileObject>
	  files = new HashMap<>();

	private static class Dummy implements FileDump
	{
		public Dummy()
		{
			try
			{
				this.f = File.createTempFile(
				  "" + System.currentTimeMillis(), ".dummy");
			}
			catch(Throwable e)
			{
				throw EX.wrap(e);
			}
		}

		private File f;

		public File file()
		{
			return null;
		}

		public void close()
		{
			if(!f.delete() && f.exists())
				f.deleteOnExit();
		}
	}
}