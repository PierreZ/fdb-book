# Best Practices and Pitfalls

This chapter provides a collection of best practices, advanced techniques, and common pitfalls to help you build robust, production-ready layers on FoundationDB.

<!-- toc -->

## Transaction Management

### Use Timeouts and Retry Limits

Most language bindings provide a `run` or `transact` method that automatically handles the retry loop for you. However, to prevent transactions from running indefinitely, it is critical to configure two options:

*   **Timeout:** Set a timeout in milliseconds. If the transaction takes longer than this to commit, it will be automatically cancelled. This is a crucial backstop for preventing stuck application threads.
*   **Retry Limit:** Set a maximum number of retries. This prevents a transaction from retrying endlessly in the case of a persistent conflict or a live-lock scenario.

These options should be set on every transaction to ensure your application remains stable under load.

### Set Transaction Priority

FoundationDB supports transaction priorities to help manage workloads.

*   **Default:** The standard priority for most latency-sensitive, user-facing operations.
*   **Batch:** A lower priority for background work, such as data cleanup or analytics. Batch priority transactions will yield to default priority transactions, ensuring that they don't interfere with your main application workload.
*   **System Immediate:** The highest priority, which can block other transactions. Its use is discouraged outside of low-level administrative tools.

## Observability

### Tag Your Transactions

FoundationDB allows you to add a byte-string **tag** to any transaction. This is an invaluable tool for observability and performance management. You can use tags to identify different types of workloads (e.g., `user_signup`, `post_comment`). The `fdbcli` tool can then be used to monitor the rate of transactions with specific tags and even throttle them if they are causing excessive load.

See the official documentation on [Transaction Tagging](https://apple.github.io/foundationdb/transaction-tagging.html) for more details.

### Enable Client Trace Logs

By default, clients do not generate detailed trace logs. To debug performance issues, you can enable them by setting the `TraceEnable` database option. You can then add a `DebugTransactionIdentifier` to a specific transaction and set the `LogTransaction` option to get detailed, low-level logs about its execution, including all keys and values read and written.

## Advanced Techniques

### The `metadataVersion` Key

The special key `\xFF/metadataVersion` is a cluster-wide version counter that can be used to implement client-side caching. Its value is sent to clients with every read version, so reading it does not require a round-trip to a storage server. A layer can watch this key to know when to invalidate a local cache.

**Note:** If you write to the `metadataVersion` key, you cannot read it again in the same transaction.

### The `TimeKeeper`

The `Cluster Controller` maintains a map of recent read versions to wall-clock times. This can be accessed by scanning the key range beginning with `\xFF\x02/timeKeeper/map/`. This can be useful for approximating a global clock.

### Special Keys

Keys prefixed with `\xFF\xFF` are “special” keys that are materialized on-demand when read. The most common example is `\xFF\xFF/status/json`, which returns a JSON document containing the cluster's status.

See the official documentation on [Special Keys](https://apple.github.io/foundationdb/special-keys.html) for more details.

## Common Pitfalls: The Directory Layer

The Directory Layer is a powerful tool, but it has several sharp edges that developers must be aware of:

*   **Concurrent Mutations:** Modifying the same directory (e.g., creating two different subdirectories within it) in multiple, concurrent transactions is not safe and can lead to corruption.
*   **Metadata Hotspots:** Opening a directory with a long path requires one read per path element for every transaction. This can create a hotspot on the directory's internal metadata subspace.
*   **Multi-Cluster Deployments:** The directory prefix allocator is not safe for multi-cluster deployments and can allocate the same prefix in different clusters, leading to data corruption if the data is ever merged.
*   **Redwood and Prefix Compression:** The Redwood storage engine (new in 7.0) provides native key-prefix compression. This offers many of the same space-saving benefits as the Directory Layer without the associated complexity and caveats. For new projects, especially those using Redwood, consider whether you can use subspaces with descriptive prefixes directly instead of relying on the Directory Layer.
