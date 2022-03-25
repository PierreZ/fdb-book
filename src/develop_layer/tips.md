# Tips and tricks

<!-- toc -->

Here's a few tips and tricks that should help you develop a production-ready layer.

## About the `run` method

Most bindings are offering a `run` method, that is taking a closure, like this in [Java](https://apple.github.io/foundationdb/javadoc/com/apple/foundationdb/Database.html#run(java.util.function.Function)).

You should use the `run` method on your bindings, **BUT** you must add some transactionOptions to avoid blocking forever:

* **Timeout** Set a timeout in milliseconds which, when elapsed, will cause the transaction automatically to be cancelled.
* **RetryLimit** Set a maximum number of retries

it is safe and legal to set these options at the first line of your `run` closure.

## Transaction priority

There is 3 transaction priority in FDB:

* **Default**,
* **Batch** Specifies that this transaction should be treated as low priority and that default priority transactions will be processed first. Useful for doing batch work simultaneously with latency-sensitive work
* **SystemImmediate** Specifies that this transaction should be treated as highest priority and that lower priority transactions should block behind this one. Use is discouraged outside of low-level tools.

## Use transaction Tagging

> FoundationDB provides the ability to add arbitrary byte-string tags to transactions. The cluster can be configured to limit the rate of transactions with certain tags, either automatically in response to tags that are very busy, or manually using the throttle command in fdbcli.

More info can be found [here](https://apple.github.io/foundationdb/transaction-tagging.html).

## Traces logs

By default, clients do not generate trace logs. In order to enable traces from the clients, you must enable on the database-level:

* `TraceEnable` Enables trace output to a file in a directory of the clients choosing

You can also enable these optional options:

* `TraceFormat` Select the format of the log files. xml (the default) and json are supported.
* `TraceLogGroup` Sets the ‘LogGroup’ attribute with the specified value for all events in the trace output files. The default log group is ‘default’.

Then, on a Transaction-level, you can set these options:

* `DebugTransactionIdentifier` String identifier to be used when tracing or profiling this transaction. The identifier must not exceed 100 characters.
* `LogTransaction` Enables tracing for this transaction and logs results to the client trace logs. The DEBUG_TRANSACTION_IDENTIFIER option must be set before using this option, and client trace logging must be enabled to get log output.
* `TransactionLoggingMaxFieldLength` Sets the maximum escaped length of key and value fields to be logged to the trace file via the LOG_TRANSACTION option, after which the field will be truncated. A negative value disables truncation.

## The `metadataVersion`

The metadata version key `\xFF/metadataVersion` is a key intended to help layers deal with hot keys. The value of this key is sent to clients along with the read version from the proxy, so a client can read its value without communicating with a storage server.

It is useful to implement some caching-strategy on a layer. More info on how to use the metadataVersion key can be found [here](https://forums.foundationdb.org/t/sharing-the-metadataversionkey-for-multiple-tenants/1659).

⚠️ In a transaction, if you update the \xff/metadataVersion key, and then attempt to read it again, I get a “Read or wrote an unreadable key” error (1036) when trying to read again. Context can be found [here](https://forums.foundationdb.org/t/cannot-commit-transaction-that-reads-the-metadataversion-key-after-changing-it/1833)

## The TimeKeeper

`Cluster Controller` actor is keeping a map of read version to system clock time, updated every second. Can be accessible by scanning the `\xFF\x02/timeKeeper/map/`. More info [here](https://forums.foundationdb.org/t/approximating-a-global-clock-for-a-watchdog-timer-using-versionstamps-readversions-or-the-timekeeper/477)

## Special keys

> Keys starting with the bytes \xff\xff are called “special” keys, and they are materialized when read. \xff\xff/status/json is an example of a special key.

More info can be found [here](https://apple.github.io/foundationdb/special-keys.html)