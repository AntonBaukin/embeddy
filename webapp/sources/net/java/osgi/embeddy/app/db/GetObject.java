package net.java.osgi.embeddy.app.db;

/* Java */

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

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
	/* Objects Search & Load */

	/**
	 * Tells whether object with the given UUID exists.
	 * Concreete projection type is not defined here.
	 */
	public boolean exists(String uuid)
	{
		//?: {not a valid uuid}
		EX.assertx(isUUID(uuid));

		return (null != first(q("exists"), uuid));
	}

	/**
	 * Checks whether an object with the given UUID
	 * and concrete projection type exists.
	 *
	 * A list of types may be defined with ' ' separator.
	 * In this case any of listed types match.
	 */
	public boolean exists(String uuid, String type)
	{
		//?: {not a valid uuid}
		EX.assertx(isUUID(uuid));
		EX.asserts(type);

		String q = q("exists-type" +
		  (type.contains(" ")?("-multi"):(""))
		);

		return (null != first(q, uuid, type));
	}

	/**
	 * Returns UUID of entity of the type given
	 * if only one entity having this prefix exists.
	 */
	public String  guess(String type, String uuidPrefix)
	{
		EX.asserts(type);
		EX.asserts(uuidPrefix);

		final Result<String> r = new Result<>();

		select(q("guess-type+prefix"), params(type, uuidPrefix), rs ->
		{
			if(r.result != null)
			{
				r.result = null;
				return false;
			}

			r.result = rs.getString(1);
			return true;
		});

		return r.result;
	}

	/**
	 * Loads the payload of the object.
	 * The projection type must be defined.
	 *
	 * A list of types may be defined with ' ' separator.
	 * In this case the unpredicted type match returned
	 * if the object has several types.
	 */
	public String  json(String uuid, String type)
	{
		//?: {not a valid uuid}
		EX.assertx(isUUID(uuid));
		EX.asserts(type);

		String q = q("json" +
		  (type.contains(" ")?("-multi"):(""))
		);

		Object[] r = first(q, uuid, type);
		return (r == null)?(null):unzip(r, 0);
	}

	public void    assign(Map<String, Object> o, Object[] r)
	{
		o.put("uuid",  r[0]);

		if(r[1] != null)
			o.put("owner", r[1]);
		else
			o.remove("owner");

		o.put("ts",    ((Date)r[2]).getTime());
		o.put("type",  r[3]);

		if(r[4] != null)
			o.put("text",  r[4]);
		else
			o.remove("text");

		o.put("json",  unzip(r, 5));
	}

	/**
	 * Loads into the map given all the fields
	 * of 'Objects' table excluding file BLOB.
	 * The timestamp is given as long integer.
	 *
	 * Returns false when not found.
	 * @see {@link #save(Map)}.
	 *
	 * A list of types may be defined with
	 * ' ' separator. See exists().
	 */
	public boolean load(String uuid, String type, Map<String, Object> o)
	{
		//?: {not a valid uuid}
		EX.assertx(isUUID(uuid));
		EX.asserts(type);

		String q = q("load" +
		  (type.contains(" ")?("-multi"):(""))
		);

		//~: load the record
		Object[] r = first(q, uuid, type);

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
	public void    eachType(String type, TakeObject x)
	{
		EX.asserts(type);
		EX.assertn(x);

		select(q("each-type"), params(type), taker(x));
	}

	/**
	 * Iterates over each object record having
	 * the type column and the text of the values
	 * given. The results are ordered by time.
	 */
	public void    eachTypeText(String type, String text, TakeObject x)
	{
		EX.asserts(type);
		EX.asserts(text);
		EX.assertn(x);

		select(q("each-type+text"), params(type, text), taker(x));
	}

	public void    eachOwnerType(String owner, String type, TakeObject x)
	{
		EX.assertx(isUUID(owner));
		EX.asserts(type);
		EX.assertn(x);

		select(q("each-owner+type"), params(owner, type), taker(x));
	}


	/* Objects Save & Update */

	/**
	 * Inserts new record into 'Objects' table.
	 * The map arguments looks like:
	 *
	 * · uuid   required UUID string;
	 * · owner  UUID string of the record owner;
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

		//~: type given or the default
		String type = (String) o.get("type");
		if(type == null) type = "";

		//?: {not a valid uuid}
		EX.assertx(isUUID(uuid));

		//?: {not a valid uuid of the owner}
		if(o.containsKey("owner"))
			EX.assertx(isUUID((String) o.get("owner")));

		update(q("update"), xnull(String.class, o.get("owner")),
		  ts, type, xnull(String.class, o.get("text")),
		  zip((String) o.get("json")), uuid, type);
	}

	/**
	 * Updates the object (and the timestamp) only.
	 */
	public void    update(String uuid, String type, String json)
	{
		Object ts = new java.sql.Timestamp(System.currentTimeMillis());

		//?: {not a valid uuid}
		EX.assertx(isUUID(uuid));
		EX.asserts(type);

		update(q("update-json"), ts, zip(json), uuid, type);
	}

	public void    touch(String uuid)
	{
		Object ts = new java.sql.Timestamp(System.currentTimeMillis());

		//?: {not a valid uuid}
		EX.assertx(isUUID(uuid));

		update(q("touch"), ts, uuid);
	}


	/* File Objects */

	/**
	 * Loads the file given into the stream and
	 * returns true if anything was written
	 * (file object found).
	 */
	public boolean load(String uuid, String type, OutputStream s)
	{
		final Result<Boolean> r = new Result<>();

		//?: {not a valid uuid}
		EX.assertx(isUUID(uuid));
		EX.asserts(type);
		EX.assertn(s);

		String q = q("load-file" +
		  (type.contains(" ")?("-multi"):(""))
		);

		select(q, params(uuid, type), rs ->
		{
			r.result = (0L != read(dialect().result(rs, rs.getMetaData(), 1), s));
			return true;
		});

		return Boolean.TRUE.equals(r.result);
	}

	/**
	 * Updates the file BLOB of the object
	 * previously saved. Ths input stream
	 * is closed at the end of this operation.
	 * Returns true if the file was updated.
	 */
	public boolean update(String uuid, String type, InputStream s)
	{
		//?: {not a valid uuid}
		EX.assertx(isUUID(uuid));
		EX.asserts(type);

		return 1 == update(q("update-file"),
		  params(write(s), uuid, type));
	}

	public boolean update(String uuid, String type, byte[] bytes)
	{
		EX.assertn(bytes);
		return update(uuid, type, new ByteArrayInputStream(bytes));
	}


	/* Utilities */

	public TakeResult taker(TakeObject x)
	{
		final Map<String, Object> o = new LinkedHashMap<>();

		return result(r -> {
			assign(o, r);
			return x.take(o);
		});
	}
}