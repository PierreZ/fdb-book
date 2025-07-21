# Best practice for storing structured data

When storing structured data like JSON objects in FoundationDB, you have two primary approaches. Each has its own set of trade-offs.

## Store the object as a blob

If you decide to store the object as a single blob, you will need to pay the cost of reading the entire object back, even if you only need to access a single field. This approach can be efficient if you always read the entire document anyway (e.g., returning it as JSON via a REST API).

However, if you have a few fields that are updated frequently (like a `last_accessed_timestamp`), this option will incur a large serialization overhead. Furthermore, due to the value size limit in FDB, you may need to split a large object into multiple key-value pairs.

On the other hand, storing data as a single blob (or even more aggressively, batching multiple objects into one) provides an opportunity to compress the data on disk. FoundationDB does not provide built-in compression for key-value data, so this would need to be handled at the application layer.

## Store the object as separate key-value pairs

When an object is stored as separate key-value pairs, random access to a single field becomes much faster and more efficient. This approach makes implementing technologies like GraphQL more feasible.

For example, a JSON object like:

```json
{
  "id": 123,
  "name": "John Doe",
  "email": "john.doe@example.com"
}
```

Could be stored as:

```
(123, "name") = "John Doe"
(123, "email") = "john.doe@example.com"
```

However, this comes at a cost: increased disk space usage. There is little to no opportunity to compress the data on disk when using this method.

## Conclusion

If you’re building a generic document database, it’s challenging to pick one strategy that works best for all use cases. You might consider making the storage strategy configurable, or even adaptive based on the workload.

For example, the [FDB Document Layer](https://github.com/FoundationDB/fdb-document-layer) allows data to be stored fully expanded or packed into 4k blocks.

To learn more about compressing data in this context, you can read the discussion in [this forum post](https://forums.foundationdb.org/t/best-practice-of-storing-structs-should-i-pack-or-store-fields-separately/425/5?u=dongxineric).
