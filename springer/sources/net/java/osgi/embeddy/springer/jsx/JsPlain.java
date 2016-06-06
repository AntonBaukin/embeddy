package net.java.osgi.embeddy.springer.jsx;

/* Java */

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;

/* Nashorn Engine */

import jdk.nashorn.api.scripting.AbstractJSObject;


/**
 * This is a simple map-object required
 * just to store properties.
 *
 * @author anton.baukin@gmail.com.
 */
public final class JsPlain extends AbstractJSObject
{
	/* JavaScript Object */

	public Object  getMember(String name)
	{
		return pm.get(name);
	}

	public boolean hasMember(String name)
	{
		return pm.containsKey(name);
	}

	public void    setMember(String name, Object value)
	{
		pm.put(name, value);
	}

	public void    removeMember(String name)
	{
		pm.remove(name);
	}

	public Object  getSlot(int index)
	{
		return sl.get(index);
	}

	public boolean hasSlot(int slot)
	{
		return sl.containsKey(slot);
	}

	public void    setSlot(int index, Object value)
	{
		if(value == null)
			sl.remove(index);
		else
			sl.put(index, value);
	}


	/* Object */

	public boolean equals(Object o)
	{
		return (this == o) || !(o == null || getClass() != o.getClass()) &&
		  pm.equals(((JsPlain)o).pm) && sl.equals(((JsPlain)o).sl);
	}

	public int     hashCode()
	{
		return 31 * pm.hashCode() + sl.hashCode();
	}


	/* private: object content */

	/**
	 * The properties (members).
	 */
	private final Map<String, Object>  pm =
	  new LinkedHashMap<>();

	/**
	 * Items of sparse array.
	 */
	private final Map<Integer, Object> sl =
	  new TreeMap<>();
}