package net.java.osgi.embeddy.springer.support;

/* Java */

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;


/**
 * Takes a character sequence, splits it in
 * multiple small buffers (on demand) and
 * provides them as input stream.
 *
 * Replaces String.getBytes("UTF-8") not
 * producing large byte buffers.
 *
 *
 * @author anton.baukin@gmail.com.
 */
public final class CharBytes extends InputStream
{
	public CharBytes(CharSequence string)
	{
		this(256, string);
	}

	public CharBytes(int buffer, CharSequence string)
	{
		this.buffer = buffer;
		this.string = EX.assertn(string);
		EX.assertx(buffer > 0);

		try
		{
			this.o = new OutputStreamWriter(w, "UTF-8");
		}
		catch(Exception e)
		{
			throw EX.wrap(e);
		}
	}

	public final CharSequence string;


	/* Input Stream */

	public int  read()
	  throws IOException
	{
		if((b == null) || (j == b.length))
		{
			b = next();

			if(b == null)
				return -1;
		}

		return b[j++] & 0xFF;
	}

	public int  read(byte[] buf, int o, int l)
	  throws IOException
	{
		int s = 0;

		while(l > 0)
		{
			if((b == null) || (j == b.length))
			{
				b = next();

				if(b == null)
					break;
			}

			//~: the remaining length
			int x = Math.min(l, b.length - j);

			System.arraycopy(b, j, buf, o, x);
			j += x; o += x; l -= x; s += x;
		}

		if(s > 0)
			return s;

		if((b == null) || (j == b.length))
			b = next();

		return (b == null)?(-1):(0);
	}

	public void close()
	{
		j = string.length();
		b = null;
	}


	/* private: local buffer */

	/**
	 * Converts the following sequence of characters
	 * with support for surrogate pairs.
	 */
	private byte[] next()
	  throws IOException
	{
		final int sl = string.length();

		//?: {no characters}
		if(i >= sl)
			return null;

		//~: length to copy
		int l = Math.min(buffer, sl - i);

		//~: substring of the interest
		String x = string.subSequence(i, i + l).toString();

		//~: write it
		o.write(x);
		i += l;
		o.flush();

		j = 0; //<-- start the new buffer
		return w.reset();
	}

	/**
	 * Current index in the string.
	 */
	private int i;

	/**
	 * Current index in the buffer.
	 */
	private int j;

	/**
	 * Current buffer.
	 */
	private byte[] b;

	/**
	 * Approximated sie of the bytes buffer.
	 * Used primary for the testing.
	 */
	private final int buffer;

	/**
	 * Wrapper of the encoding stream
	 */
	private final WrappingBytes w = new WrappingBytes();

	private final OutputStreamWriter o;


	/* Wrapping Bytes */

	private class WrappingBytes extends OutputStream
	{
		public void   write(int b)
		  throws IOException
		{
			bos.write(b);
			length++;
		}

		public void   write(byte[] b, int off, int len)
		  throws IOException
		{
			bos.write(b, off, len);
			length += len;
		}

		public byte[] reset()
		{
			byte[] a = bos.toByteArray();

			bos = new ByteArrayOutputStream(buffer * 2);
			length = 0;

			return a;
		}

		private ByteArrayOutputStream bos =
		  new ByteArrayOutputStream(buffer * 2);

		private int length;
	}
}