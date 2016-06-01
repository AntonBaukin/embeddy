package net.java.osgi.embeddy.springer;

/* Java */

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;


/**
 * This annotation supports @Autowire declaration
 * of {@link ServiceBridge} fields and set-methods.
 * It binds the method of the declaring class to
 * connect or disconnect the OSGi service.
 *
 * @author anton.baukin@gmail.com.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.CONSTRUCTOR, ElementType.FIELD, ElementType.METHOD})
public @interface ServiceSwitch
{
	/**
	 * Defines the method name to invoke when the OSGi
	 * service is connected or disconnected. Defaults to
	 * {@code onServiceName} where ServiceName is the short
	 * name of the service interface (name). The method
	 * has no parameters: check the injected bridge.
	 */
	String on() default "";

	/**
	 * Opposite to {@link #off()}.
	 */
	String off() default "";
}