# Playing with fdbcli

<!-- toc -->

## Setting up FoundationDB with Docker

```shell
docker run --name fdb -d -p 4500:4500 --rm foundationdb/foundationdb:6.3.23
```

## `fdbcli`?

`fdbcli` is a command-line interface that can be used to administrate your FDB cluster.

## Start the shell

```shell
docker exec -ti fdb fdbcli

docker exec -ti fdb fdbcli                                                 
Using cluster file `/var/fdb/fdb.cluster'.

The database is unavailable; type `status' for more information.

Welcome to the fdbcli. For help, type `help'.
```

## Useful commands

### Status

`status` is one of the most useful command. It will display a human-readable report:

```shell
fdb> status

Using cluster file `/var/fdb/fdb.cluster'.

The coordinator(s) have no record of this database. Either the coordinator
addresses are incorrect, the coordination state on those machines is missing, or
no database has been created.

  172.17.0.2:4500  (reachable)

Unable to locate the data distributor worker.

Unable to locate the ratekeeper worker.
```


### Create a new database

As our container is brand-new, we need to create a database.

```shell
fdb> configure new single memory
Database created
```

A few elements to notes:

* running this will nuke your database,
* `single` is the [redundancy mode](https://apple.github.io/foundationdb/configuration.html#choosing-a-redundancy-mode),
* `memory` is the [storage subsystem](https://apple.github.io/foundationdb/configuration.html#configuring-the-storage-subsystem).

Then we can run the `status` command:

```shell
fdb> help status

status [minimal|details|json]

Get the status of a FoundationDB cluster.

If the cluster is down, this command will print a diagnostic which may be useful
in figuring out what is wrong. If the cluster is running, this command will
print cluster statistics.

Specifying `minimal' will provide a minimal description of the status of your
database.

Specifying `details' will provide load information for individual workers.

Specifying `json' will provide status information in a machine readable JSON
format.
```

```shell
fdb> status

Using cluster file `/var/fdb/fdb.cluster'.

Configuration:
  Redundancy mode        - single
  Storage engine         - memory-2
  Coordinators           - 1
  Usable Regions         - 1

Cluster:
  FoundationDB processes - 1
  Zones                  - 1
  Machines               - 1
  Memory availability    - 8.0 GB per process on machine with least available
  Fault Tolerance        - 0 machines
  Server time            - 02/10/22 12:57:50

Data:
  Replication health     - Healthy
  Moving data            - 0.000 GB
  Sum of key-value sizes - 0 MB
  Disk space used        - 105 MB

Operating space:
  Storage server         - 1.0 GB free on most full server
  Log server             - 1555.9 GB free on most full server

Workload:
  Read rate              - 7 Hz
  Write rate             - 0 Hz
  Transactions started   - 3 Hz
  Transactions committed - 0 Hz
  Conflict rate          - 0 Hz

Backup and DR:
  Running backups        - 0
  Running DRs            - 0

Client time: 02/10/22 12:57:50
```

### Insert keys

```shell
fdb> help writemode 

writemode <on|off>

Enables or disables sets and clears.

Setting or clearing keys from the CLI is not recommended.
```

```shell
fdb> help set

set <KEY> <VALUE>

Set a value for a given key.

If KEY is not already present in the database, it will be created.

For information on escaping keys and values, type `help escaping'.
```

```shell
# we first need to set writemode

fdb> writemode on
fdb> set hello world
Committed (1442988082)
```

`1442988082` is the commitVersion or versionStamp.

### scan keys

```shell
fdb> help getrange

getrange <BEGINKEY> [ENDKEY] [LIMIT]

Fetch key/value pairs in a range of keys.

Displays up to LIMIT keys and values for keys between BEGINKEY (inclusive) and
ENDKEY (exclusive). If ENDKEY is omitted, then the range will include all keys
starting with BEGINKEY. LIMIT defaults to 25 if omitted.

For information on escaping keys, type `help escaping'
```

```shell
fdb> getrange \x00 \xfe 10

Range limited to 10 keys
`hello' is `world'
```

### Help

```shell
fdb> help

List of commands:

 advanceversion:
      Force the cluster to recover at the specified version
 begin:
      begin a new transaction
 clear:
      clear a key from the database
 clearrange:
      clear a range of keys from the database
 commit:
      commit the current transaction
 configure:
      change the database configuration
 consistencycheck:
      permits or prevents consistency checking
 coordinators:
      change cluster coordinators or description
 exclude:
      exclude servers from the database
 exit:
      exit the CLI
 fileconfigure:
      change the database configuration from a file
 force_recovery_with_data_loss:
      Force the database to recover into DCID
 get:
      fetch the value for a given key
 getrange:
      fetch key/value pairs in a range of keys
 getrangekeys:
      fetch keys in a range of keys
 getversion:
      Fetch the current read version
 help:
      get help about a topic or command
 include:
      permit previously-excluded servers to rejoin the database
 kill:
      attempts to kill one or more processes in the cluster
 lock:
      lock the database with a randomly generated lockUID
 maintenance:
      mark a zone for maintenance
 option:
      enables or disables an option
 profile:
      namespace for all the profiling-related commands.
 reset:
      reset the current transaction
 rollback:
      rolls back the current transaction
 set:
      set a value for a given key
 setclass:
      change the class of a process
 sleep:
      sleep for a period of time
 status:
      get the status of a FoundationDB cluster
 suspend:
      attempts to suspend one or more processes in the cluster
 throttle:
      view and control throttled tags
 triggerddteaminfolog:
      trigger the data distributor teams logging
 unlock:
      unlock the database with the provided lockUID
 writemode:
      enables or disables sets and clears

For information on a specific command, type `help <command>'.
For information on escaping keys and values, type `help escaping'.
For information on available options, type `help options'.
```
