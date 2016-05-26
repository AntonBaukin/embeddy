Content of the 'explode' directory of Delegate Module
is copied by the boot procedure into the bundles storage
directory. So, by that path you find not only the bundles
installed, but also 'etc' directory.

This 'etc' directory is used to store files required by
the used frameworks (here, is Apache Karaf). The exact
locations of these files are given as OSGi configuration
or system properties.

Second, 'etc' directory is used to store configuration
properties (*.config) for individual services. These
files are read and handles by Apache Felix Config Admin.

Configuration file must be placed in nested directories
as Java packages. See FilePersistenceManager.encodePid().

Warning. Each configuration file must contain 'service.pid'
property with the PID value!

The values of conviguration properties are not directly
written as in a properties file. Read the details in
Apache Felix ConfigurationHandler class.