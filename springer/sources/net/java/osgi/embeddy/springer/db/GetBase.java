package net.java.osgi.embeddy.springer.db;

/* Java */

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.sql.Blob;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;
import javax.sql.DataSource;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.support.BytesStream;


/**
 * Implementation base of a data access strategy.
 * Warning! It does not set own transactional scopes.
 *
 * @author anton.baukin@gmail.com.
 */
public abstract class GetBase
{
	/* Connections & Statements */

	@Autowired
	protected DataSource dataSource;

	/**
	 * Provides connection only within
	 * {@code @Transactional} scopes.
	 *
	 * Warning! Do not close it!
	 */
	protected Connection        co()
	{
		//?: {has no data source wired}
		EX.assertn(dataSource, "DataSource is not @Autowired in [",
		  getClass().getName(), "] class bean!");

		//?: {not in transactional scopes}
		EX.assertx(TransactionSynchronizationManager.isSynchronizationActive(),
		  "Current thread is not nested in @Transactional scopes!");

		try
		{
			//~: get the connection
			Connection co = DataSourceUtils.
			  getConnection(dataSource);

			//?: {auto commit is set}
			EX.assertx(!co.getAutoCommit(),
			  "Connection has Auto Commit on!");

			return co;
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Can't obtain database connection!");
		}
	}

	protected PreparedStatement prepare(boolean update, String sql)
	{
		try
		{
			return (!update)?(co().prepareStatement(sql)):
			  co().prepareStatement(sql, ResultSet.TYPE_FORWARD_ONLY,
			    ResultSet.CONCUR_UPDATABLE);
		}
		catch(SQLException e)
		{
			throw EX.wrap(e);
		}
	}


	/* Queries Caching */

	/**
	 * Returns query from the cache related to this strategy.
	 */
	protected String  q(String id)
	{
		if(qCache == null)
			qCache = QueryCache.cache(this.getClass());

		return EX.asserts(qCache.q(id), "Not found query [",
		  id, "] in ", this.getClass().getSimpleName());
	}

	protected volatile QueryCache qCache;


	/* Parameters */

	/**
	 * Parameter value to set NULL
	 * of specific SQL type.
	 */
	public static class SetNull
	{
		public SetNull(int sqlType)
		{
			this.sqlType = sqlType;
		}

		public void set(PreparedStatement s, int i)
		  throws SQLException
		{
			s.setNull(i, sqlType);
		}

		private int sqlType;
	}

	protected void        clear(PreparedStatement s)
	{
		try
		{
			s.clearParameters();
		}
		catch(SQLException e)
		{
			throw EX.wrap(e);
		}
	}

	protected Object[] params(Object... ps)
	{
		return ps;
	}

	protected void        params(PreparedStatement s, Object... ps)
	{
		for(int i = 0;(i < ps.length);i++)
			param(s, i + 1, EX.assertn(ps[i]));
	}

	protected void        param(PreparedStatement s, int i, Object p)
	{
		try
		{
			Class cls = EX.assertn(p).getClass();

			//?: {set null}
			if(SetNull.class.isAssignableFrom(cls))
				((SetNull)p).set(s, i);
			//?: {date-time}
			else if(Date.class.isAssignableFrom(cls))
				s.setTimestamp(i, new Timestamp(((Date)p).getTime()));
			//?: {general string}
			else if(CharSequence.class.isAssignableFrom(cls))
				s.setString(i, p.toString());
			//?: {character}
			else if(Character.class.equals(cls))
				s.setString(i, p.toString());
			//~: {bytes stream}
			else if(BytesStream.class.isAssignableFrom(cls))
				s.setBinaryStream(i, ((BytesStream)p).inputStream(),
				  (int)((BytesStream)p).length());
			else
				s.setObject(i, p);
		}
		catch(Exception e)
		{
			throw EX.wrap(e);
		}
	}

	protected Object      xnull(Class cls, Object p)
	{
		return (p == null)?(xnull(cls)):(p);
	}

	protected SetNull     xnull(Class cls)
	{
		int type;

		//?: {string}
		if(CharSequence.class.isAssignableFrom(cls))
			type = Types.VARCHAR;
		//?: {byte array}
		else if(byte[].class.equals(cls))
			type = Types.VARBINARY;
		//?: {big decimal}
		else if(BigDecimal.class.equals(cls))
			type = Types.DECIMAL;
		//?: {long}
		else if(Long.class.equals(cls))
			type = Types.BIGINT;
		//?: {date}
		else if(Date.class.equals(cls))
			type = Types.TIMESTAMP;
		//?: {boolean}
		else if(Boolean.class.equals(cls))
			type = Types.BOOLEAN;
		//?: {character}
		else if(Character.class.equals(cls))
			type = Types.CHAR;
		else
			throw EX.ass("Unsupported type: ", cls.getName());

		return xnull(type);
	}

	protected SetNull     xnull(int sqlType)
	{
		return new SetNull(sqlType);
	}

	protected String      unzip(byte[] data)
	{
		return (data == null)?(null):unzip(new ByteArrayInputStream(data));
	}

	/**
	 * Reads Gun Zipped string (as JSON or XML) in UTF-8.
	 */
	protected String      unzip(InputStream is)
	{
		try
		(
		  BytesStream bs = new BytesStream();
		  GZIPInputStream gz = new GZIPInputStream(is)
		)
		{
			bs.write(gz);
			return new String(bs.bytes(), "UTF-8");
		}
		catch(Exception e)
		{
			throw EX.wrap(e);
		}
	}

	protected String      unzip(Object[] row, int i)
	{
		if((row == null) || (row[i] == null))
			return null;

		//?: {not a byte data}
		if(!(row[i] instanceof byte[]))
			throw EX.ass("Column at 0-index [",
			  i, "] is not a binary data!");

		return unzip((byte[]) row[i]);
	}

	/**
	 * Creates the bytes stream and fills it with
	 * UTF-8 encoded Gun Zipped string characters.
	 */
	protected Object      zip(String obj)
	{
		if(obj == null)
			return xnull(byte[].class);

		BytesStream os = new BytesStream().
		  setNotCloseNext(true);

		try(GZIPOutputStream gz = new GZIPOutputStream(os))
		{
			if(obj != null)
				gz.write(obj.getBytes("UTF-8"));
		}
		catch(Throwable e)
		{
			os.closeAlways();
			throw EX.wrap(e);
		}

		return os;
	}

	@SuppressWarnings("unchecked")
	protected <T> T       project(Class<T> cls, Object[] row, int i)
	{
		if((row == null) || (row[i] == null))
			return null;

		EX.assertx(cls.isAssignableFrom(row[i].getClass()),
		  "Selected record item [", i, "] has value of class [",
		  row[i].getClass().getName(), "] that is not a [", cls.getName(), "]!"
		);

		return (T) row[i];
	}


	/* Queries & Iteration */

	/**
	 * Callback on each next record
	 * of the result set.
	 */
	@FunctionalInterface
	public static interface TakeResult
	{
		public void take(ResultSet r)
		  throws Exception;
	}

	/**
	 * Exception-marker to break the
	 * result set iteration.
	 */
	public static class Break
	       extends      RuntimeException
	{}

	/**
	 * Iterates over the result set of the select query.
	 */
	protected void      select(
	  boolean close, PreparedStatement s, TakeResult v)
	{
		Throwable e = null;
		ResultSet r = null;

		try
		{
			r = s.executeQuery();

			while(r.next())
				v.take(r);
		}
		catch(Throwable x)
		{
			if(!(x instanceof Break))
				e = x;
		}
		finally
		{
			if(r != null) try
			{
				r.close();
			}
			catch(Throwable x)
			{
				if(e == null) e = x;
			}

			if(close) try
			{
				s.close();
			}
			catch(Throwable x)
			{
				if(e == null) e = x;
			}
		}

		if(e != null)
			throw EX.wrap(e);
	}

	/**
	 * General variant of executing prepared select statement.
	 */
	protected void      select(
	  boolean update, String sql, Object[] params, TakeResult v)
	{
		PreparedStatement s = prepare(update, sql);
		Throwable         e = null;

		//~: init the statement
		if(params != null) try
		{
			params(s, params);
		}
		catch(Throwable x)
		{
			e = x;
		}
		finally
		{
			if(e != null) try
			{
				s.close();
			}
			catch(Throwable ignore)
			{}
		}

		if(e != null)
			throw EX.wrap(e);

		//~: iterate over the result set
		select(true, s, v);
	}

	/**
	 * Read-only select iteration.
	 */
	protected void      select(
	  String sql, Object[] params, TakeResult v)
	{
		select(false, sql, params, v);
	}

	/**
	 * Simples rad-only select having no parameters.
	 */
	protected void      select(String sql, TakeResult v)
	{
		select(false, sql, null, v);
	}

	/**
	 * Returns the first record of the query.
	 */
	protected Object[]  first(String sql, Object... params)
	{
		final Result<Object[]> r = new Result<>();

		select(sql, params, i ->
		{
			//?: {this is a second call} do break
			if(r.result != null)
				throw new Break();

			ResultSetMetaData m = i.getMetaData();
			Object[]          x = r.result =
			  new Object[m.getColumnCount()];

			for(int j = 1;(j <= x.length);j++)
			{
				int t = m.getColumnType(j);

				//?: {this is a blob} dump into BytesStream
				if(t == Types.BLOB)
				{
					Blob        blob  = i.getBlob(j);
					BytesStream bytes = new BytesStream();

					try
					{
						bytes.write(blob.getBinaryStream());
					}
					finally
					{
						blob.free();
					}
				}
				//~: other types
				else
					x[j - 1] = i.getObject(j);
			}
		}
		);

		return r.result;
	}

	/**
	 * Select for update.
	 */
	protected void      update(
	  String sql, Object[] params, TakeResult v)
	{
		select(true, sql, params, v);
	}

	/**
	 * Select for update without parameters.
	 */
	protected void      update(String sql, TakeResult v)
	{
		select(true, sql, null, v);
	}

	/**
	 * Executes update on the prepared statement.
	 */
	protected int       update(boolean close, PreparedStatement s)
	{
		Throwable e = null;
		int       r = 0;

		try
		{
			r = s.executeUpdate();
		}
		catch(Throwable x)
		{
			if(!(x instanceof Break))
				e = x;
		}
		finally
		{
			//~: handle close
			if(close) try
			{
				s.close();
			}
			catch(Throwable x)
			{
				if(e == null) e = x;
			}
		}

		if(e != null)
			throw EX.wrap(e);

		return r;
	}

	protected int       update(String sql, Object... params)
	{
		PreparedStatement s = prepare(false, sql);
		Throwable         e = null;

		//~: init the statement
		if(params != null) try
		{
			params(s, params);
		}
		catch(Throwable x)
		{
			e = x;
		}
		finally
		{
			if(e != null) try
			{
				s.close();
			}
			catch(Throwable ignore)
			{}
		}

		if(e != null)
			throw EX.wrap(e);

		//~: issue update
		int result = 0; try
		{
			result = update(true, s);
		}
		catch(Throwable x)
		{
			e = x;
		}
		finally
		{
			//~: close all input streams
			Throwable x = closeStreams(params);
			if((x != null) & (e == null)) e = x;
		}

		if(e != null)
			throw EX.wrap(e);

		return result;
	}


	/* Batch Updates */

	/**
	 * Callback interface for batch
	 * insert-update operation.
	 */
	@FunctionalInterface
	public static interface Batch
	{
		/**
		 * Assigns the parameters in the given array
		 * (is fixed during the query processing).
		 *
		 * Returns false to break the batch instead
		 * of executing the next update.
		 */
		public boolean next(Object[] params);
	}

	/**
	 * Executes the prepared statement with batch updates.
	 * The size of a batch is told by {@param size}.
	 */
	protected void      batch(String sql, int size, Batch batch)
	{
		batch(true, size, prepare(false, sql), batch);
	}

	protected void      batch
	  (boolean close, int size, PreparedStatement s, Batch batch)
	{
		Throwable    e = null;
		List<Object> w = new ArrayList<>(); //<-- the streams collected

		EX.assertn(batch);
		EX.assertx(size > 0);

		try
		{
			boolean  invoke = false;
			Object[] params = new Object[
			  s.getParameterMetaData().getParameterCount()];

			while(true)
			{
				//c: fill the batch up to the size
				for(int i = 0;(i < size);i++)
				{
					//~: invoke the batch
					if(!batch.next(params))
						break;

					//~: assign the parameters
					try
					{
						s.clearParameters();
						params(s, params);

						//~: add the batch
						s.addBatch();
						invoke = true;
					}
					finally
					{
						//~: close all input streams
						collectStreams(params, w);
					}
				}

				//?: {noting to batch} exit
				if(!invoke) break;

				invoke = false;
				s.executeBatch();

				//~: close the streams
				Throwable x = closeStreams(w);
				w.clear(); //<-- clear as they are closed
				if(x != null) throw x;
			}
		}
		catch(Throwable x)
		{
			e = x;
		}
		finally
		{
			//~: handle close
			if(close) try
			{
				s.close();
			}
			catch(Throwable x)
			{
				if(e == null) e = x;
			}
		}

		if(e != null)
			throw EX.wrap(e);
	}


	/* Utilities */

	/**
	 * Result to assign from closures.
	 */
	public static class Result<T>
	{
		public T result;
	}

	/**
	 * Closes each stream within the parameters.
	 * Returns the last close error (if was).
	 */
	protected Throwable closeStreams(Object[] params)
	{
		return closeStreams(Arrays.asList(params));
	}

	protected Throwable closeStreams(List<?> w)
	{
		Throwable error = null;

		for(Object p : w) try
		{
			if(p instanceof InputStream)
				((InputStream)p).close();
			else if(p instanceof BytesStream)
				((BytesStream)p).close();
		}
		catch(Throwable e)
		{
			error = e;
		}

		return error;
	}

	protected void      collectStreams(
	  Object[] params, List<Object> streams)
	{
		for(Object p : params)
			if(p instanceof InputStream)
				streams.add(p);
			else if(p instanceof BytesStream)
				streams.add(p);
	}
}