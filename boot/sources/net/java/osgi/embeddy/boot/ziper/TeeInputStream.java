package net.java.osgi.embeddy.boot.ziper;

/* Java */

import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/* embeddy */

import net.java.osgi.embeddy.boot.EX;


/**
 * Tee-stream reads from input stream and
 * at the same time writes the bytes to
 * the output one.
 *
 * Note that skip requests still reads all
 * the bytes and writes them out.
 *
 *
 * @author anton.baukin@gmail.com.
 */
public final class TeeInputStream extends FilterInputStream
{
	public TeeInputStream(InputStream in, OutputStream ou)
	{
		super(in);
		this.ou = ou;
	}


	/* Input Stream */

	public int     read()
	  throws IOException
	{
		int x = super.read();

		if(x != -1)
		{
			ou.write(x);
			done++;
		}

		return x;
	}

	public int     read(byte[] b)
	  throws IOException
	{
		int x = in.read(b);

		if(x > 0)
		{
			ou.write(b, 0, x);
			done += x;
		}

		return x;
	}

	public int     read(byte[] b, int off, int len)
	  throws IOException
	{
		int x = in.read(b, off, len);

		if(x > 0)
		{
			ou.write(b, off, x);
			done += x;
		}

		return x;
	}

	public long    skip(long n)
	  throws IOException
	{
		if(n == 0L) return 0L;
		EX.assertx(n > 0L);

		if(bf == null)
			bf = new byte[512];

		long skipped = 0L;
		int  s, x;

		while(n != 0L)
		{
			s = (n > (long)bf.length)?(bf.length):((int) n);
			x = in.read(bf, 0, s);
			if(x <= 0) break;

			ou.write(bf, 0, x);
			n -= x; skipped += x; done += x;
		}

		return skipped;
	}

	public void    close()
	  throws IOException
	{
		try
		{
			in.close();
		}
		finally
		{
			ou.close();
		}
	}

	public void    mark(int readlimit)
	{
		throw new UnsupportedOperationException();
	}

	public void    reset()
	  throws IOException
	{
		throw new UnsupportedOperationException();
	}

	public boolean markSupported()
	{
		return false;
	}

	private final OutputStream ou;
	private byte[]             bf;
	private long               done;
}