package net.java.osgi.embeddy.springer;

/* Java */

import java.lang.annotation.Annotation;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

/* Spring Framework */

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.DependencyDescriptor;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;


/**
 * Spring Bean Factory that enhances Autowire
 * abilities with fields of generic types.
 *
 * @author anton.baukin@gmail.com.
 */
public class SpringerBeanFactory extends DefaultListableBeanFactory
{
	public SpringerBeanFactory()
	{}

	public SpringerBeanFactory(BeanFactory parentBeanFactory)
	{
		super(parentBeanFactory);
	}


	/* Default Bean Factory */

	public Object applyBeanPostProcessorsBeforeInitialization(Object bean, String beanName)
	  throws BeansException
	{
		initBean(bean, beanName);
		return super.applyBeanPostProcessorsBeforeInitialization(bean, beanName);
	}

	protected <T> T doGetBean(String name, Class<T> requiredType,
	  Object[] args, boolean typeCheckOnly)
	  throws BeansException
	{
		//~: ensure get-list
		LinkedList<GetBean> gets = this.gets.get();
		if(gets == null) this.gets.set(
		  gets = new LinkedList<GetBean>());

		//~: create get-record
		GetBean get = new GetBean();
		gets.addFirst(get); //<-- push it
		get.beanName = name;
		get.requiredType = requiredType;

		try
		{
			return super.doGetBean(name, requiredType, args, typeCheckOnly);
		}
		finally
		{
			EX.assertx(!gets.isEmpty());
			GetBean x = gets.removeFirst();
			EX.assertx(get == x);

			if(gets.isEmpty())
				this.gets.remove();
		}
	}

	protected Map<String, Object> findAutowireCandidates(
	  String beanName, Class<?> requiredType, DependencyDescriptor descriptor)
	{
		GetBean get = EX.assertn(this.gets.get()).getFirst();
		DependencyDescriptor oldDepDescr = get.depDescr;
		get.depDescr = descriptor;

		try
		{
			return super.findAutowireCandidates(
			  beanName, requiredType, descriptor);
		}
		finally
		{
			get.depDescr = oldDepDescr;
		}
	}

	protected final ThreadLocal<LinkedList<GetBean>> gets =
	  new ThreadLocal<LinkedList<GetBean>>();


	/* protected: specials */

	protected static final Object LOG =
	  LU.logger(SpringerBeanFactory.class);

	protected void initBean(Object bean, String beanName)
	{
		GetBean get = EX.assertn(this.gets.get()).getFirst();
		String  oldAutoAwireName = null;

		if(bean instanceof AutoAwire) try
		{
			oldAutoAwireName  = get.autoAwireName;
			get.autoAwireName = beanName;

			initAutoAwire((AutoAwire)bean);
		}
		finally
		{
			get.autoAwireName = oldAutoAwireName;
		}

		//?: {has requests for annotations}
		if(get.initAnses != null)
			initAnnses(bean, get.initAnses);
	}

	protected void initAnnses(Object bean, List<InitAns> anses)
	{
		for(InitAns ans : anses)
			ans.bean.autowiredAnnotations(bean, ans.ans);
	}

	@SuppressWarnings("unchecked")
	protected void initAutoAwire(AutoAwire bean)
	{
		LinkedList<GetBean> gets = this.gets.get();

		//?: {has no enough items}
		if(gets.size() == 1)
		{
			LU.warn(LOG, "initAutoAwire(): bean of class [",
			  bean.getClass().getName(), "] is top-accessed! ",
			  "Is it not injected as @Autowire?");

			return;
		}

		//~: the previous get
		GetBean get = gets.get(1); //<-- hint: stack
		if(get.depDescr == null)
		{
			LU.warn(LOG, "initAutoAwire(): bean of class [",
			  bean.getClass().getName(), "] is not injected as @Autowire?");

			return;
		}

		Type         gt  = null;
		Class<?>     tc  = null;
		Annotation[] ans = null;

		//?: {has field}
		if(get.depDescr.getField() != null)
		{
			gt  = get.depDescr.getField().getGenericType();
			tc  = get.depDescr.getField().getType();
			ans = get.depDescr.getField().getAnnotations();
		}

		//?: {has method | constructor}
		else if(get.depDescr.getMethodParameter() != null)
		{
			gt  = get.depDescr.getMethodParameter().getGenericParameterType();
			tc  = get.depDescr.getMethodParameter().getParameterType();

			//~: collect both annotation groups
			Annotation[] x = get.depDescr.getMethodParameter().getMethodAnnotations();
			Annotation[] y = get.depDescr.getMethodParameter().getParameterAnnotations();
			ans = new Annotation[x.length + y.length];
			System.arraycopy(x, 0, ans, 0, x.length);
			System.arraycopy(y, 0, ans, x.length, y.length);
		}

		//!: double check the type of the bean
		EX.assertx(EX.assertn(tc).isAssignableFrom(bean.getClass()));

		if(!(gt instanceof ParameterizedType))
		{
			LU.warn(LOG, "initAutoAwire(): bean of class [",
			  bean.getClass().getName(), "] injected with @Autowire ",
			  "having declaration without a parameterized type!");

			return;
		}

		Type[]  gs = ((ParameterizedType) gt).getActualTypeArguments();
		if((gs == null) || (gs.length == 0))
			return;

		Class[] cs = new Class[gs.length];
		for(int i = 0;(i < gs.length);i++)
			if(gs[i] instanceof Class)
				cs[i] = (Class) gs[i];
			else
				return;

		//!: invoke the bean
		bean.autowiredTypes(cs);

		//~: remove @Autowired (as redundant)
		List<Annotation> xans = new ArrayList<Annotation>(Arrays.asList(ans));
		for(Iterator<Annotation> i = xans.iterator();(i.hasNext());)
			if(i.next() instanceof Autowired)
				i.remove();

		//?: {has any left}
		if(!xans.isEmpty())
		{
			InitAns ia = new InitAns();
			ia.bean = bean;
			ia.ans  = xans.toArray(new Annotation[xans.size()]);

			if(get.initAnses == null)
				get.initAnses = new ArrayList<InitAns>(2);
			get.initAnses.add(ia);
		}
	}

	protected static class GetBean
	{
		public String   beanName;
		public Class<?> requiredType;

		/**
		 * DependencyDescriptor of pending AutoAwire request.
		 * Hint: this descriptor is not of the bean is being
		 * created (it's @Autowire annotations are processed).
		 * It is descriptor of the field of that bean.
		 */
		public DependencyDescriptor depDescr;
		public String               autoAwireName;

		/**
		 * Collection of requests to init the
		 * annotations of injected beans.
		 */
		public List<InitAns>        initAnses;
	}

	protected static class InitAns
	{
		public AutoAwire    bean;
		public Annotation[] ans;
	}
}