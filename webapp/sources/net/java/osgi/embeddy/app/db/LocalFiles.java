package net.java.osgi.embeddy.app.db;

/* Java */

import java.io.File;
import java.io.FileOutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

/* Spring Framework */

import net.java.osgi.embeddy.app.Global;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.LU;
import net.java.osgi.embeddy.springer.db.TxBean;
import net.java.osgi.embeddy.springer.support.IO;

/* application */

import net.java.osgi.embeddy.app.secure.SecDigest;


/**
 * Stores the files in the local file system.
 *
 * @author anton.baukin@gmail.com.
 */
@Component
public class LocalFiles implements FilesStore
{
	/* Files Store */

	@SuppressWarnings("unchecked")
	public void     save(Map<String, Object> fo, SecDigest.Stream di)
	{
		String u = EX.asserts((String) fo.get("uuid"));

		//?: {do erase the file}
		if(di == null)
		{
			Map    obj  = (Map) EX.assertn(fo.get("object"));
			String sha1 = (String) obj.get("sha1");

			//?: {has digest, no length}
			if(sha1 == null)
				EX.assertx((obj.get("length") == null) ||
				  (((Number) obj.get("length")).longValue() == 0L));
			else
			{
				File x = new File(root, u + "." + sha1);

				if(x.exists())
					cleanFile(x, false);
			}

			return;
		}

		//!: create temporary file in the same storage
		File   f = new File(root, u + "." + System.currentTimeMillis());

		//~: pump the stream
		try(FileOutputStream o = new FileOutputStream(f))
		{
			IO.pump(di, o);

			//~: close the digest
			di.close();
		}
		catch(Throwable e)
		{
			//~: delete temporary file
			if(f.exists() && !f.delete())
				f.deleteOnExit();

			throw EX.wrap(e);
		}

		try //<-- post-process the file
		{
			//~: new file name
			File x = new File(root, u + "." + di.hex());

			//?: {the file does not exist}
			if(!x.exists())
				EX.assertx(f.renameTo(x));
			else
			{
				//~: restore the file
				cleanFile(x, true);

				//~: delete temporary file
				if(f.exists() && !f.delete())
					f.deleteOnExit();
			}

			//~: make the file read-only
			x.setReadOnly();
		}
		catch(Throwable e)
		{
			//~: delete temporary file
			if(f.exists() && !f.delete())
				f.deleteOnExit();

			throw EX.wrap(e);
		}
	}

	public FileDump dump(Map<String, Object> fo)
	{
		String     u = EX.asserts((String) fo.get("uuid"));
		String     d = EX.asserts((String) fo.get("sha1"));
		final File f = new File(root, u + "." + d);

		return new FileDump()
		{
			public File file()
			{
				return f;
			}

			public void close()
			{}
		};
	}

	public void     cleanup()
	{
		context.getBean(TxBean.class).invoke(this::cleanupTx);
	}


	/* Local Files Store */

	/**
	 * Uses the given path as the folder of the files.
	 */
	public void     init(String path)
	{
		root = new File(EX.asserts(path));

		LU.info(LOG, "using local storage for files [",
		  root.getAbsolutePath(), "]");

		//?: {not exists} create it
		if(!root.exists()) root.mkdirs();

		//?: {not a valid root}
		EX.assertx(root.exists() &&
		  root.isDirectory() && root.canWrite());
	}

	public static final String FILE_TYPES = "MediaFile Document";

	public void     cleanupTx()
	{
		EX.assertn(root);

		//~: uuid matching pattern
		Pattern ru = Pattern.compile("^[0-9a-f]{8}-" +
		  "[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$");

		//~: scan the file system
		for(File f : EX.assertn(root.listFiles()))
		{
			//~: file name as "uuid.sha1"
			String u = f.getName();
			if(!u.contains("."))
			{
				cleanFile(f, false);
				continue;
			}

			//~: digest
			String d = u.substring(u.indexOf('.') + 1);
			u = u.substring(0, u.length() - d.length() - 1);

			//?: {not a uuid | not a SHA-1 digest}
			if(!ru.matcher(u).matches() || d.length() != 40)
			{
				cleanFile(f, false);
				continue;
			}

			Map<String, Object> x = new HashMap<>();

			//~: load the file object
			global.jsX.apply("db/obj.js",
			  "get_in_map", u, FILE_TYPES, x);

			String sha1 = (String) x.get("sha1");

			//?: {nothing loaded | no SHA-1 | not the same}
			if(!d.equalsIgnoreCase(sha1))
				cleanFile(f, false);
		}
	}

	protected void  cleanFile(File f, boolean restore)
	{
		if(restore)
			f.setReadOnly();
		else //<-- mark for delete
			f.setWritable(true);
	}

	private File root;

	@Autowired
	protected GetObject getObject;

	@Autowired
	protected ApplicationContext context;

	@Autowired
	protected Global global;

	protected final Object LOG = LU.logger(this.getClass());
}
