package net.java.osgi.embeddy.app.db;

/* Java */

import java.io.File;
import java.io.FileOutputStream;
import java.util.Map;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;

/* application */

import net.java.osgi.embeddy.app.secure.SecDigest;


/**
 * Files Store strategy that saves files
 * in the database BLOBs.
 *
 * @author anton.baukin@gmail.com.
 */
@Component
public class DbFiles implements FilesStore
{
	/* Files Store */

	public void     save(Map<String, Object> fo, SecDigest.Stream di)
	{
		String uuid = EX.asserts((String) fo.get("uuid"));
		String type = EX.asserts((String) fo.get("type"));

		//!: update the file in the database
		EX.assertx(getObject.update(uuid, type, di) || (di == null));
	}

	/**
	 * TODO implement local cache of the database files not to copy them
	 */
	public FileDump dump(Map<String, Object> fo)
	{
		String u = EX.asserts((String) fo.get("uuid"));
		String t = EX.asserts((String) fo.get("type"));

		//~: load the content
		final File f; try
		{
			//~: create temporary file
			f = File.createTempFile(u, "");

			//~: load bytes into it
			try(FileOutputStream o = new FileOutputStream(f))
			{
				getObject.load(u, t, o);
			}
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}

		return new FileDump()
		{
			public File file()
			{
				return f;
			}

			public void close()
			{
				if(!f.delete() && f.exists())
					f.deleteOnExit();
			}
		};
	}

	/**
	 * TODO support database dialect related BLOBs de-fragmentation.
	 */
	public void     cleanup()
	{}

	@Autowired
	protected GetObject getObject;
}