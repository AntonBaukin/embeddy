package net.java.osgi.embeddy.app.db;

/* Java */

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/* Spring Framework */

import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.db.GetBase;


/**
 * Data access strategy to process
 * 'Objects' database table.
 *
 * @author anton.baukin@gmail.com.
 */
@Component
public class GetObject extends GetBase
{
	/* UUID */

	public boolean isUUID(String uuid)
	{
		if(uuid == null)
			return false;

		try
		{
			UUID.fromString(uuid);
			return true;
		}
		catch(IllegalArgumentException e)
		{
			return false;
		}
	}

	public String  newUUID()
	{
		return UUID.randomUUID().toString();
	}


	/* Objects Search & Load */

	/**
	 * Tells whether object with the given UUID exists.
	 */
	public boolean exists(String uuid)
	{
		//?: {not a valid uuid}
		EX.assertx(isUUID(uuid));

		return (null != first(q("exists"), uuid));
	}

	public String  json(String uuid)
	{
		//?: {not a valid uuid}
		EX.assertx(isUUID(uuid));

		Object[] r = first(q("json"), uuid);
		return (r == null)?(null):unzip(r, 0);
	}

	public void    assign(Map<String, Object> o, Object[] r)
	{
		//~: set the fields
		o.put("uuid",  r[0]);
		o.put("owner", r[1]);
		o.put("ts",    ((Date)r[2]).getTime());
		o.put("type",  r[3]);
		o.put("text",  r[4]);
		o.put("json",  unzip(r, 5));
	}

	/**
	 * Loads into the map given all the fields
	 * of 'Objects' table excluding file BLOB.
	 * The timestamp is given as long integer.
	 * Returns false when not found.
	 * @see {@link #save(Map)}.
	 */
	public boolean load(String uuid, Map<String, Object> o)
	{
		//?: {not a valid uuid}
		EX.assertx(isUUID(uuid));

		//~: load the record
		Object[] r = first(q("load"), uuid);

		//?: {not found}
		if(r == null)
			return false;

		this.assign(o, r);
		return true;
	}

	/**
	 * Iterates over each object record having
	 * the type column of the value given.
	 * The results are ordered by time.
	 */
	public void    typed(String type, TakeObject x)
	{
		Map<String, Object> o = new LinkedHashMap<>();

		EX.asserts(type);
		EX.assertn(x);

		select(q("typed"), params(type), TakeRecord.result(r -> {
			assign(o, r);
			return x.take(o);
		}));
	}


	/* Objects Save & Update */

	/**
	 * Inserts new record into 'Objects' table.
	 * The map arguments looks like:
	 *
	 * · uuid   required UUID string;
	 * · owner  UUID string ow record owner;
	 * · type   string with the type of the record;
	 * · text   text value;
	 * · json   object payload (JSON document as a string).
	 */
	public void    save(Map<String, Object> o)
	{
		Object   ts = new java.sql.Timestamp(System.currentTimeMillis());
		String uuid = (String) o.get("uuid");

		//?: {not a valid uuid}
		EX.assertx(isUUID(uuid));

		//?: {not a valid uuid of the owner}
		if(o.containsKey("owner"))
			EX.assertx(isUUID((String) o.get("owner")));

		update(q("save"), uuid,
		  xnull(String.class, o.get("owner")), ts,
		  xnull(String.class, o.get("type")),
		  xnull(String.class, o.get("text")),
		  zip((String) o.get("json"))
		);
	}

	/**
	 * Update analog of {@link #save(Map)}.
	 */
	public void    update(Map<String, Object> o)
	{
		Object   ts = new java.sql.Timestamp(System.currentTimeMillis());
		String uuid = (String) o.get("uuid");

		//?: {not a valid uuid}
		EX.assertx(isUUID(uuid));

		//?: {not a valid uuid of the owner}
		if(o.containsKey("owner"))
			EX.assertx(isUUID((String) o.get("owner")));

		update(q("update"), xnull(String.class, o.get("owner")),
		  ts, xnull(String.class, o.get("type")),
		  xnull(String.class, o.get("text")),
		  zip((String) o.get("json")), uuid);
	}
}