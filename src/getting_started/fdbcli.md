# The `fdbcli` Command-Line Interface

<!-- toc -->

`fdbcli` is the primary tool for administering and interacting with your FoundationDB cluster. This chapter will walk you through the basics of using it to create a database and perform fundamental key-value operations.

## Your First Cluster: A Local Sandbox

The easiest way to get started is to run a local FoundationDB server using Docker. This command will start a container with FoundationDB, publish its port, and name it `fdb` for easy access.

```shell
docker run --name fdb -d -p 4500:4500 --rm foundationdb/foundationdb:7.1.25
```

Now, you can connect to the running container and start the CLI:

```shell
docker exec -it fdb fdbcli
```

You'll be greeted with a welcome message and a warning:

```
Using cluster file '/var/fdb/fdb.cluster'.

The database is unavailable; type `status' for more information.

Welcome to the fdbcli. For help, type `help'.
fdb> 
```

## Creating the Database

The database is unavailable because we haven't configured it yet. The `status` command provides a detailed report on the cluster's health. Let's see what it says:

```shell
fdb> status

Using cluster file `/var/fdb/fdb.cluster'.

The coordinator(s) have no record of this database. Either the coordinator
addresses are incorrect, the coordination state on those machines is missing, or
no database has been created.

  172.17.0.2:4500  (reachable)

Unable to locate the data distributor worker.
```

The message is clear: "no database has been created." Let's fix that. The `configure` command sets up the database with a specific redundancy mode and storage engine. For a local sandbox, `single` redundancy and the `memory` storage engine are perfect.

```shell
fdb> configure new single memory
Database created
```

**Warning:** Running `configure new` on an existing cluster will destroy all of its data. It is only safe to use on a brand-new cluster.

Now, if we check the status again, we'll see a healthy, fully-operational cluster.

```shell
fdb> status

Configuration:
  Redundancy mode        - single
  Storage engine         - memory
  Coordinators           - 1

Cluster:
  FoundationDB processes - 1
  Machines               - 1

Data:
  Replication health     - Healthy
  Moving data            - 0.000 GB

...
```

## Reading and Writing Data

Now for the fun part. `fdbcli` allows you to perform transactional reads and writes directly from the command line. Let's try to `get` a key that doesn't exist yet.

```shell
fdb> get mykey
`mykey' not found
```

As expected, nothing is there. Let's `set` a value.

```shell
fdb> set mykey "hello world"
Committed.
```

Now, if we `get` it again, we see our value. Notice that we use quotes because our value contains a space.

```shell
fdb> get mykey
`mykey' is `hello world'
```

We can also store multiple keys and retrieve them with `getrange`.

```shell
fdb> set key1 value1
Committed.
fdb> set key2 value2
Committed.
fdb> set key3 value3
Committed.

fdb> getrange key1 key4

Range limited to 25 keys
`key1' is `value1'
`key2' is `value2'
`key3' is `value3'
```

Finally, we can remove a key using `clear`.

```shell
fdb> clear mykey
Committed.

fdb> get mykey
`mykey' not found
```

This is just a small sample of what `fdbcli` can do. You can use the `help` command to see a full list of commands or `help <command>` for details on a specific one.
