package net.java.osgi.embeddy.springer.boot;

/* Java */

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;


/**
 * Marker annotation to tell that Springer Class
 * Loader must skip this class (is being in the
 * package to handle) to the default loader.
 *
 * Use this annotation on system singletones
 * that start before Spring.
 *
 *
 * @author anton.baukin@gmail.com.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface LoadDefault
{}