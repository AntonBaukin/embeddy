package net.java.osgi.embeddy.springer.support;

/**
 * Implementation based on 128-bit Murmur Hash 3
 * function introduced by Austin Appleby.
 *
 * @author anton.baukin@gmail.com.
 */
public final class Hash
{
	public Hash()
	{
		reset();
	}

	public Hash(Hash h)
	{
		assign(h);
	}


	/* Hashing */

	public Hash    update(int v)
	{
		long x = C + v, y = ~C + v;

		//~: mix v
		x *= X; y *= Y;
		x = Long.rotateLeft(x, 31);
		y = Long.rotateLeft(y, 33);
		x *= Y; y *= X;

		//~: mix x
		x = this.x ^ x;
		x = Long.rotateLeft(x, 27) + this.y;
		x = x*5 + 0x52DCE729;

		//~: mix y
		y = this.y ^ y;
		y = Long.rotateLeft(y, 31) + x;
		y = y*5 + 0x38495AB5;

		//~: results
		this.x = x; this.y = y;
		return this;
	}

	public Hash    update(CharSequence s)
	{
		int i, l1, l = s.length();
		for(i = 0, l1 = l - 1;(i < l1);i += 2)
		{
			int x = s.charAt(i);
			int y = s.charAt(i+1);

			update((y << 16) | x);
		}

		if(i < l)
			update(s.charAt(i));

		return this;
	}

	public Hash    update(byte[] bs, int o, int l)
	{
		for(;(l >= 4);o += 4, l -= 4)
		{
			int a = bs[o  ];
			int b = bs[o+1];
			int c = bs[o+2];
			int d = bs[o+3];

			update(a | (b << 8) | (c << 16) | (d << 24));
		}

		for(;(l > 0);o++, l--)
			update(bs[o]);

		return this;
	}

	public Hash    reset()
	{
		this.x =  S;
		this.y = ~S;
		return this;
	}

	public boolean equals(Hash h)
	{
		return (x == h.x) & (y == h.y);
	}

	public Hash    assign(Hash h)
	{
		this.x = h.x; this.y = h.y;
		return this;
	}


	/* Object */

	public boolean equals(Object o)
	{
		return (this == o) ||
		  !(o == null || getClass() != o.getClass()) &&
		  equals((Hash)o);
	}

	public int     hashCode()
	{
		int result = (int)(x ^ (x >>> 32));
		result = 31*result + (int)(y ^ (y >>> 32));
		return result;
	}

	public String  toString()
	{
		StringBuilder s = new StringBuilder(32);
		String        a = Long.toHexString(x).toUpperCase();
		String        b = Long.toHexString(y).toUpperCase();

		for(int i = a.length();(i < 16);i++)
			s.append('0');
		s.append(a);

		for(int i = b.length();(i < 16);i++)
			s.append('0');
		s.append(b);

		return s.toString();
	}


	/* private: constants */

	private static final long S = 0x7FFFFFFFFFFFFFE7L;
	private static final long X = 0x87C37B91114253D5L;
	private static final long Y = 0x4CF5AD432745937FL;
	private static final long C = 0x5555555555555555L;


	/* private: hash state */

	private long x, y;
}