package net.java.osgi.embeddy.springer;

/* Java */

import java.lang.annotation.Annotation;


/**
 * Denotes a bean that is aware of being
 * {@code @Autowire}d into some bean.
 *
 * @author anton.baukin@gmail.com.
 */
public interface AutoAwire
{
	/* Autowire Aware */

	/**
	 * Invoked before a {@code @PostConstruct}
	 */
	public void autowiredTypes(Class<?>[] types);

	/**
	 * Invoked for the injecting bean has @Autowired
	 * field (or set-method) with the given annotations.
	 *
	 * This method is always invoked if there are annotations
	 * other then @Autowire, and after auto-wiring the types,
	 * but before any @PostConstruct of the injecting bean.
	 */
	public void autowiredAnnotations(Object injector, Annotation[] ans);
}