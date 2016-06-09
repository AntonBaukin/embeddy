package net.java.osgi.embeddy.springer.db;

/* Spring Framework */

import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.support.Callable;


/**
 * Wraps execution into transaction scopes.
 *
 * @author anton.baukin@gmail.com.
 */
@Component @Scope("prototype")
public class TxBean
{
	/* Transactional Bean */

	public void   invoke(Callable task)
	{
		try
		{
			if(newTx)
				invokeNewTx(task);
			else
				invokeTx(task);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
	}

	public TxBean setNew(boolean newTx)
	{
		this.newTx = newTx;
		return this;
	}

	protected boolean newTx;


	/* protected: execution variants */

	@Transactional(rollbackFor = Throwable.class,
	  propagation = Propagation.REQUIRED)
	protected void invokeTx(Callable task)
	  throws Throwable
	{
		runTask(task);
	}

	@Transactional(rollbackFor = Throwable.class,
	  propagation = Propagation.REQUIRES_NEW)
	protected void invokeNewTx(Callable task)
	  throws Throwable
	{
		runTask(task);
	}

	protected void runTask(Callable task)
	  throws Throwable
	{
		task.run();
	}
}