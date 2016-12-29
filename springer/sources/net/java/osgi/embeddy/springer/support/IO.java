package net.java.osgi.embeddy.springer.support;

/* Java */

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;


/**
 * Input-output helping functions.
 *
 * @author anton.baukin@gmail.com.
 */
public class IO
{
	/* Sink */

	@FunctionalInterface
	public static interface Sink
	{
		public void  write(byte[] b, int o, int l)
			throws IOException;
	}


	/* Streaming */

	public static long pump(InputStream i, OutputStream o)
	  throws IOException
	{
		return pump(i, o::write);
	}

	public static long pump(InputStream i, Sink o)
	  throws IOException
	{
		byte[] b = ByteBuffers.INSTANCE.get();
		long   s = 0L;

		try
		{
			for(int x;((x = i.read(b)) > 0);s += x)
				o.write(b, 0, x);

			return s;
		}
		finally
		{
			ByteBuffers.INSTANCE.free(b);
		}
	}
}