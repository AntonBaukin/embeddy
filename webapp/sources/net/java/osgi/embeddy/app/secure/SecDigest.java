package net.java.osgi.embeddy.app.secure;

/* Java */

import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.ref.WeakReference;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;

/* Spring Framework */

import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.SU;
import net.java.osgi.embeddy.springer.support.BytesStream;


/**
 * Caches {@link MessageDigest} instances
 * and helps invoke them.
 *
 * @author anton.baukin@gmail.com
 */
@Component
public final class SecDigest
{
	/* public: AuthDigest interface */

	public SecDigest setPoolSize(int poolSize)
	{
		this.poolSize = poolSize;
		return this;
	}

	public byte[] sign(Object... values)
	{
		MessageDigest digest = digest();
		byte[] longs = null;
		byte[] result;

		try
		{
			for(Object v : values)
				if(v != null)
				{
					if(v instanceof Long)
					{
						if(longs == null)
							longs = new byte[8];

						long l = (Long)v;
						for(int i = 0; (i < 8); i++)
							longs[i] = (byte)((l >> 8*i) & 0xFF);

						digest.update(longs);
						continue;
					}

					if(v instanceof byte[])
					{
						digest.update((byte[])v);
						continue;
					}

					if(v instanceof char[])
					{
						digest.update(SU.h2b((char[])v));
						continue;
					}

					if(v instanceof CharSequence) try
					{
						digest.update(v.toString().getBytes("UTF-8"));
						continue;
					}
					catch(Exception e)
					{
						throw EX.wrap(e);
					}

					if(v instanceof BytesStream) try
					{
						((BytesStream)v).digest(digest);
						continue;
					}
					catch(Exception e)
					{
						throw EX.wrap(e);
					}

					throw EX.ass();
				}

			result = digest.digest();
		}
		finally
		{
			digest.reset();
			free(digest);
		}

		return result;
	}

	public String signHex(Object... values)
	{
		return SU.b2h(this.sign(values));
	}

	public Stream wrap(InputStream is)
	{
		EX.assertn(is);
		return new Stream(is);
	}


	/* protected: access secure generators */

	protected MessageDigest digest()
	{
		MessageDigest res = null;

		synchronized(this)
		{
			List<MessageDigest> list =
			  (pool == null)?(null):(pool.get());

			if((list != null) && !list.isEmpty())
				res = list.remove(list.size() - 1);
		}

		if(res != null)
		{
			res.reset();
			return res;
		}

		try
		{
			return MessageDigest.getInstance("SHA-1");
		}
		catch(Exception e)
		{
			throw EX.wrap(e);
		}
	}

	protected void free(MessageDigest gen)
	{
		synchronized(this)
		{
			List<MessageDigest> list;

			if((pool == null) || ((list = pool.get()) == null))
				pool = new WeakReference<>(
				  list = new ArrayList<>(poolSize)
				);

			if(list.size() < poolSize)
				list.add(gen);
		}
	}


	/* private: weak pool */

	private WeakReference<List<MessageDigest>> pool;
	private volatile int poolSize = 64;


	/* Digest Stream */

	public class Stream extends FilterInputStream
	{
		public Stream(InputStream in)
		{
			super(in);
		}


		/* Digest Stream */

		public byte[] bytes()
		{
			return this.digest;
		}

		public String hex()
		{
			return SU.b2h(this.digest);
		}


		/* public: stream filtering */

		public int  read()
		  throws IOException
		{
			int c = in.read();

			if(c != -1)
				md.update((byte)c);

			return c;
		}

		public int  read(byte[] b, int off, int len)
		  throws IOException
		{
			int s = in.read(b, off, len);

			if(s > 0)
				md.update(b, off, s);

			return s;
		}

		public void close()
		  throws IOException
		{
			try
			{
				if(digest == null)
					digest = md.digest();
			}
			finally
			{
				try
				{
					if(md != null)
						free(md);
				}
				finally
				{
					md = null;
					super.close();
				}
			}
		}

		protected MessageDigest md = digest();

		protected byte[] digest;
	}
}