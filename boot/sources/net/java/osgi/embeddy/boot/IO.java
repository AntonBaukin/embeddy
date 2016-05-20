package net.java.osgi.embeddy.boot;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.StringTokenizer;

/**
 * Input-output helping functions.
 *
 * @author anton.baukin@gmail.com.
 */
public class IO
{
	/* Streaming */

	public static byte[] load(InputStream i)
	  throws IOException
	{
		ByteArrayOutputStream o = new ByteArrayOutputStream(256);
		byte[] b = new byte[256];

		try
		{
			int s; while((s = i.read(b)) > 0)
				o.write(b, 0, s);

			o.close();
			return o.toByteArray();
		}
		finally
		{
			i.close();
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