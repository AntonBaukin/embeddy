package net.java.osgi.embeddy.springer.support;

/* Java */

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Random;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;


/**
 * Tests various supports classes separately.
 *
 * @author anton.baukin@gmail.com
 */
public class TestStreams
{
	/* test entry points */

	@org.junit.Test
	public void testBytesStream()
	  throws Exception
	{
		Random gen = new Random();

		for(int i = 0;(i < 512);i++)
		{
			byte[] src = new byte[gen.nextInt(8193)];
			gen.nextBytes(src);

			BytesStream bs = new BytesStream();
			InputStream is = bs.inputStream();
			BytesStream xs = new BytesStream();
			int         po = 0;
			int         sz = src.length;

			while(sz > 0)
			{
				int s = gen.nextInt(sz + 1);

				if(gen.nextBoolean())
					bs.write(new ByteArrayInputStream(src, po, s));
				else
					bs.write(src, po, s);
				po += s; sz -= s;

				xs.write(is);
			}

			EX.assertx(Arrays.equals(src, bs.bytes()));

			ByteArrayOutputStream bos = new ByteArrayOutputStream(src.length);
			bs.copy(bos); bos.close(); bs.close();
			EX.assertx(Arrays.equals(src, bos.toByteArray()));

			bos = new ByteArrayOutputStream(src.length);
			xs.copy(bos); bos.close(); xs.close();
			EX.assertx(Arrays.equals(src, bos.toByteArray()));
		}
	}

	@org.junit.Test
	public void testCharBytes()
	  throws Exception
	{
		Random   gen = new Random();

		//~: strings with simple and complex characters.
		String[] CPs = new String[] {
		  "a", "ж", "\u0928\u093F\u4E9C", "\uD800\uDC83"
		};

		//~: random tests
		for(int i = 0;(i < 1024);i++)
		{
			int n = gen.nextInt(1024);

			StringBuilder s = new StringBuilder(n * 4);

			for(int j = 0;(j < n);j++)
				s.append(CPs[gen.nextInt(CPs.length)]);

			//~: canonical conversion
			byte[] tst = s.toString().getBytes("UTF-8");

			//~: convert via the stream
			CharBytes cb = new CharBytes(1 + gen.nextInt(16), s);
			ByteArrayOutputStream bos = new ByteArrayOutputStream(4096);
			IO.pump(cb, bos);

			//?: {are the results equal}
			EX.assertx(Arrays.equals(tst, bos.toByteArray()));
		}
	}
}