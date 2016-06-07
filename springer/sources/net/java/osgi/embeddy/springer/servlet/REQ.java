package net.java.osgi.embeddy.springer.servlet;

/* Java */

import java.io.Reader;
import java.net.URLDecoder;
import java.util.Map;

/* Java Servlet */

import javax.servlet.http.HttpServletResponse;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.SU;


/**
 * HTTP request and response handling support.
 *
 * @author anton.baukin@gmail.com.
 */
public class REQ
{
	public static void noCache(HttpServletResponse res)
	{
		res.addHeader("Cache-Control", "no-cache, max-age=0");
		res.addHeader("Expires", "0");
	}

	/**
	 * Decodes URL-encoded parameters of the request body.
	 */
	public static void decodeBodyParams(
	  Reader r, String enc, Map<String, Object> ps)
	  throws java.io.IOException
	{
		StringBuilder n = new StringBuilder(64);
		StringBuilder v = new StringBuilder(128);
		char[]        b = new char[8];
		int           s = 0; // 0 name, 1 value

		Runnable      x = () -> {

			String nx = SU.s2s(n.toString());
			n.delete(0, n.length());

			String vx = v.toString();
			v.delete(0, v.length());

			if(nx == null) return;
			try
			{
				nx = URLDecoder.decode(nx, enc);
				vx = URLDecoder.decode(vx, enc);
			}
			catch(Throwable e)
			{
				throw EX.wrap(e);
			}

			Object ss = ps.get(nx);
			if(ss == null)
				ps.put(nx, vx);
			else if(ss instanceof String)
			{
				String[] ss2 = new String[2];
				ss2[0] = (String) ss;
				ss2[1] = vx;
				ps.put(nx, ss2);
			}
			else if(ss instanceof String[])
			{
				String[] ss3 = (String[]) ss;
				String[] ss2 = new String[ss3.length + 1];
				System.arraycopy(ss3, 0, ss2, 0, ss3.length);
				ss2[ss2.length - 1] = vx;
				ps.put(nx, ss2);
			}
		};

		while(true)
		{
			//~: fill the buffer
			int bs = r.read(b);
			if(bs <= 0) break;

			for(int i = 0;(i < bs);i++)
			{
				char c = b[i];

				//?: {reading name}
				if(s == 0)
				{
					//?: {=} end name
					if(c == '=')
					{
						s = 1;
						continue;
					}

					//?: {&} abnormal end
					if(c == '&')
					{
						x.run();
						s = 0;
						continue;
					}

					//~: append name
					n.append(c);
				}

				//?: {reading value}
				if(s == 1)
				{
					//?: {&} end value
					if(c == '&')
					{
						x.run();
						s = 0;
						continue;
					}

					//~: append value
					v.append(c);
				}
			}
		}

		//?: {finish the last}
		if(s == 1)
			x.run();
	}
}