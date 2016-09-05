**This document is not complete: all the details on each Embeddy module would
be appended after the refactoring following the initial commit be completed.
Please, be in touch!**

## Embeddy JsX

This bundle is not ready yet. (Implementation of JsX is a part of my private
project.) JsX will be placed separately on GiHub and included in Embeddy and
ExtJSF projects. In short, JsX contains Zero-ZeT JavaScript library (see
ExtJSF with it's browser variant) and applies it to run in Oracle Nashorn
engine. It also has Servlet that invokes server-side scripts named '*.jsx'.
This is not a Node.js, but a very convenient tool to use alongside with
Java application if you want to natively work with JSONs and store them
in document-oriented backends.

JsX is written to be effective. It pre-compiles the scripts and reuses them
with support of re-loading after they changed. Execution of jsx-scripts has the
same speed as of JSP pages! Nashorn is as fast as ordinary Java application.

Regretfully, I was unable to debug Nashorn scripts under IntelliJ IDEA 14.