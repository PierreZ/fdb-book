# Installing FoundationDB

<!-- toc -->

The official documentation has plenty of docs on how to install FoundationDB:

* [Getting Started on Linux](https://apple.github.io/foundationdb/getting-started-linux.html)
* [Getting Started on macOS](https://apple.github.io/foundationdb/getting-started-mac.html)

## Client or server?

In the [Downloads page](https://apple.github.io/foundationdb/downloads.html), you will find reference to two archives:

* clients
* server

### Clients

The clients package is required by all bindings(i.e. programming libraries). These are needed files for all bindings:

* `/usr/lib/libfdb_c.so`
* `/usr/include/foundationdb/fdb_c.h`
* `/usr/include/foundationdb/fdb_c_options.g.h`

You will also find different binaries:

* dr_agent
* fdbbackup
* fdbcli
* fdbdr
* fdbrestore

### Server 

The server package is holding FDB's binaries:

* fdbmonitor
* fdbserver

And a default configuration file for `fdbmonitor` located at `/etc/foundationdb/foundationdb.conf`. `fdbserver` is the main binary, and `fdbmonitor` is simply a wrapper on top of `fdbserver`.

## The cluster file

Both packages will install a default [cluster file](https://apple.github.io/foundationdb/administration.html#cluster-files):

> FoundationDB servers and clients use a cluster file (usually named ``fdb.cluster``) to connect to a cluster. The contents of the cluster file are the same for all processes that connect to the cluster. An ``fdb.cluster`` file is created automatically when you install a FoundationDB server and updated automatically when you [change coordination servers](https://apple.github.io/foundationdb/configuration.html#configuration-choosing-coordination-servers). To connect to a cluster from a client machine, you will need access to a copy of the cluster file used by the servers in the cluster.

## ⚠️ Wire protocol

FoundationDB's wire protocol is not compatible between minors releases, i.e. client version 6.2 will **not** be able to communicate with 6.3.X, 6.1.X, and all versions different from 6.3.X.

On the bindings-side, the client will be [stalling](https://forums.foundationdb.org/t/detecting-a-version-mismatch/3055/2). On the server's logs,  you would see events like `ConnectionRejected` with a reason `IncompatibleProtocolVersion`.