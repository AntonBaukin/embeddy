package net.java.osgi.embeddy.springer.support;

/* Java */

import java.util.Arrays;
import java.util.Collection;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;


/**
 * Support for perks: objective flags
 * or self-describing processing values.
 *
 * @author anton.baukin@gmail.com.
 */
public class Perks
{
	public Perks(Object... perks)
	{
		this.perks = Arrays.asList(perks);
	}

	public Perks(Collection<Object> perks)
	{
		this.perks = EX.assertn(perks);
	}

	protected final Collection<Object> perks;


	/* Perks Access */

	public boolean   when(Object perk)
	{
		return this.perks.contains(perk);
	}

	public Perks     when(Object perk, Callable task)
	{
		if(this.perks.contains(perk))
			task.run();

		return this;
	}

	@SuppressWarnings("unchecked")
	public <P> P     find(Class<P> perk)
	{
		EX.assertn(perk);

		for(Object p : perks)
			if((p != null) && perk.isAssignableFrom(p.getClass()))
				return (P)p;

		return null;
	}

	public <P> Perks find(Class<P> perk, Acceptor<P> take)
	{
		EX.assertn(take);

		P p = this.find(perk);
		if(p != null)
			take.accept(p);

		return this;
	}
}