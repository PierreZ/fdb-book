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

More info about the `metadataVersion` can be found [here](https://youtu.be/2HiIgbxtx0c).

## The TimeKeeper

`Cluster Controller` actor is keeping a map of read version to system clock time, updated every second. Can be accessible by scanning the `\xFF\x02/timeKeeper/map/`. More info [here](https://forums.foundationdb.org/t/approximating-a-global-clock-for-a-watchdog-timer-using-versionstamps-readversions-or-the-timekeeper/477)

## Special keys

> Keys starting with the bytes \xff\xff are called “special” keys, and they are materialized when read. \xff\xff/status/json is an example of a special key.

More info can be found [here](https://apple.github.io/foundationdb/special-keys.html)

## Caveats when using directory

* [Mutating a directory multiple times simultaneously in the same transaction is unsafe](https://github.com/apple/foundationdb/issues/895)
* Opening a path with multiple items will generate many read on the metadata-subspace for every transaction. This can lead to hotspotting the [Directory Layer’s metadata subspace](https://forums.foundationdb.org/t/query-hotspotting-on-directory-layers-metadata-subspace/2487). Also, developing a directory that use the [metadataVersion's key](https://github.com/apple/foundationdb/pull/1213) is not that easy:
  * [Exhibit A](https://forums.foundationdb.org/t/how-to-safely-add-a-metadata-caching-layer-on-top-of-existing-layers/1809/2?u=pierrez),
  * [Exhibit B](https://github.com/apple/foundationdb/issues/1415).

* Because on how the prefix is generated, multi-cluster deployments can allocate the same [prefix multiple times](https://forums.foundationdb.org/t/redwood-engine-and-directory-layer/3084/8):

* Redwood Engine is a new storage engine released in FDB-7.0. It has some nice features, including native key-prefix compression. Prefix compression's performance is likely to be [similar to using the Directory](https://youtu.be/5iqKu1pVDvE?t=158). When using the Redwood storage engine the remaining benefit of the Directory becomes the ability to move/rename directories and having smaller keys in network messages (though some of these may eventually use prefix compression).

> I’ll also note that due to caching, the Record Layer can’t really make use of the directory layer’s renaming features (at least not without rethinking cache invalidation). I suspect that if we’d had Redwood and prefix compression when the Record Layer was being originally developed, we’d seriously have considered just relying on prefix compression instead of all of that because that would have significantly simplified cross-cluster data movement (and, if we’re honest, single cluster writes).
