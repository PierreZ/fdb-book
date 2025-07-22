# Data Distribution and Movement

FoundationDB automatically manages the distribution of data across the cluster. This process is crucial for ensuring fault tolerance, balancing load, and managing storage space efficiently.

## Reasons for Data Movement

FoundationDB will only move data for a few specific reasons:

*   **To restore replication after a failure:** If a storage server fails, the data it was responsible for becomes under-replicated. The data distribution system will create new copies of that data on other servers to restore the desired replication level.
*   **To manage shard size:** The system aims to keep data shards within an optimal size range (roughly 125MB to 500MB). It will split shards that grow too large and merge shards that become too small.
*   **To handle write hotspots:** If a particular shard experiences a high volume of writes, it may be split to distribute the write load.
*   **To balance storage load:** The system will move data to ensure that the total bytes stored are balanced evenly across all storage servers in the cluster.

Notably, data distribution **does not** balance the load based on high read traffic. When moving a shard, it only considers the total bytes stored, not the read or write traffic on that shard. This means it's possible for multiple high-traffic ranges to be assigned to the same storage server.

## Observing Data Movement

You can monitor data movement activity through the `fdbcli` status command. The output provides key metrics:

```
Data:
  Replication health   - Healthy
  Moving data          - 0.043 GB
  Sum of key-value sizes - 88 MB
  Disk space used      - 382 MB
```

The `Moving data` field shows how much data is currently in flight. There is no ETA published for data movement, and it's normal for it to be happening constantly, especially in a cluster with a high write workload.

## Adjusting Distribution Speeds

There are no simple controls for adjusting the speed of data distribution. While some configuration knobs exist (e.g., `DD_MOVE_KEYS_PARALLELISM`, `MOVE_KEYS_KRM_LIMIT`), changing them is strongly discouraged unless you have a specific need and understand the potential consequences. These settings must be applied at the startup of your `fdbserver` processes and should be handled with extreme caution.
