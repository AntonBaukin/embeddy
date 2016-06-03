package net.java.osgi.embeddy.boot;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.StringTokenizer;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Input-output helping functions.
 *
 * @author anton.baukin@gmail.com.
 */
public class IO
{
	/* Streaming */

	public static byte[] load(InputStream is)
	  throws IOException
	{
		ByteArrayOutputStream o = new ByteArrayOutputStream(256);

		try(InputStream i = is)
		{
			byte[] b = new byte[256];
			for(int s;((s = i.read(b)) > 0);)
				o.write(b, 0, s);

			o.close();
			return o.toByteArray();
		}
	}

	/**
	 * Extracts given ZIP archive with the time check.
	 */
	public static void   unzip(InputStream zip, File dir)
	  throws IOException
	{
		ZipEntry ze;
		byte[]   bf = new byte[4096];

		try(ZipInputStream zis = new ZipInputStream(zip))
		{
			while((ze = zis.getNextEntry()) != null) try
			{
				File f = new File(dir, ze.getName());

				//?: {is a directory}
				if(ze.isDirectory())
				{
					if(!f.exists()) f.mkdirs();
					EX.assertx(f.exists() && f.isDirectory(),
					  "Couldn't explode directory [", f, "]!");

					continue;
				}

				//?: {file exists}
				if(f.exists())
				{
					EX.assertx(f.isFile() && f.canRead(),
					  "Can't access prevopusly exploded file [", f, "]!");

					//?: {zip file is older}
					long zt = ze.getTime();
					long ft = f.lastModified();

					//?: {zip entry is not modified}
					if((zt > 0L) && (ft > 0L) && (zt <= ft))
						continue;
				}

				//~: create the parent directory
				File p = f.getParentFile();
				if(!p.exists()) p.mkdirs();
				EX.assertx(p.exists() && p.isDirectory(),
				  "Couldn't create intermediate directory [", p, "]!");

				//~: dump the file
				try(OutputStream os = new FileOutputStream(f))
				{
					for(int s;(s = zis.read(bf)) > 0;)
						os.write(bf, 0, s);
				}
			}
			finally
			{
				zis.closeEntry();
			}
		}
	}


	/* Reading Files */

	/**
	 * Returns file lines not starting with '#'.
	 * White-space empty strings are also omitted.
	 */
	public static String readCommented(byte[] file)
	{
		String s; try
		{
			s = new String(file, "UTF-8");
		}
		catch(Exception e)
		{
			throw EX.wrap(e);
		}

		StringBuilder   b = new StringBuilder(s.length());
		StringTokenizer t = new StringTokenizer(s, "\n");

		while(t.hasMoreTokens())
		{
			String x = t.nextToken().trim();
			if(!x.isEmpty() && (x.charAt(0) != '#'))
				b.append((b.length() == 0)?(""):("\n")).append(x);
		}

		return b.toString();
	}
}