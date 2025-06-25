# What is the Record Layer?

The FoundationDB Record Layer is an open-source library that provides a record-oriented data store with semantics similar to a relational database, implemented on top of FoundationDB. Think of it as a "middle layer" that provides common database-like features, making it easier to build complex, scalable applications on FDB.

It was created to solve the common and difficult challenges that arise when building a structured data layer on top of a key-value store, such as schema management, indexing, and query execution, especially in a multi-tenant environment.

## Core Design Principles

The Record Layer is built around a few core principles:

*   **Structured, Schematized Data**: It stores structured records using Google's [Protocol Buffers](https://developers.google.com/protocol-buffers). This provides a robust way to define a schema and evolve it over time.

*   **Stateless Architecture**: The layer itself is completely stateless. All state is stored in FoundationDB or returned to the client (e.g., as a `continuation`). This simplifies scaling and operation, as any server can handle any request.

*   **Streaming Queries**: The Record Layer is designed for a streaming model. For example, it only supports ordered queries (like SQL's `ORDER BY`) if there is an index that can produce the data in the requested order. This avoids large, stateful in-memory operations and makes performance predictable, favoring fast OLTP workloads over analytical OLAP queries.

*   **Extensibility**: The layer is highly extensible. Clients can define their own custom index types, index maintainers, and query planner rules, allowing them to tailor the database's behavior to their specific needs.

## The "Record Store": A Logical Database

A key abstraction in the Record Layer is the **Record Store**. A Record Store is a logical, self-contained database that holds all of a tenant's records, indexes, and metadata. This entire logical database is stored within a single, contiguous key-space in FoundationDB, called a **subspace**.

This design is a perfect fit for multi-tenant applications. For example, Apple's CloudKit uses this model to provide a distinct logical database for every application on every user's device—billions of independent databases in total. Because a Record Store is just a range of keys, it can be easily moved between FDB clusters for load balancing.

## Key Technical Features

The Record Layer abstracts away several complex engineering problems by leveraging FoundationDB's core features.

### Key Expressions for Flexible Indexing

Indexes are defined using **key expressions**, which are functions that specify how to extract data from a record to form an index key. Key expressions can be simple (e.g., a single field's value) or complex. They can:

*   **Concatenate** multiple fields together.
*   **Fan out** by creating multiple index entries from a single record, such as indexing each element in a repeated field (a list).
*   **Nest** to index fields within a sub-record.

This provides a powerful and flexible way to create indexes on highly structured, nested data.

### Online Index Building

Building an index on a large, live dataset is a hard problem. The Record Layer's online indexer handles this gracefully. When a new index is added, it transitions through several states:

1.  **Write-only**: The index is maintained for all new and updated records, but it cannot yet be used for queries.
2.  **Building**: A background process scans all existing records in batches, adding their corresponding entries to the index. This process is transactional, fault-tolerant, and resumable.
3.  **Readable**: Once the background build is complete, the index is marked as readable and can be used by the query planner.

### Advanced Index Types

The Record Layer includes several powerful, built-in index types:

*   **VALUE**: A standard index that maps the value from a key expression to the record's primary key.
*   **ATOMIC**: An index that uses FoundationDB's atomic mutations to maintain aggregate statistics without transaction conflicts. This is used for `SUM`, `COUNT`, `MAX`, and `MIN` indexes.
*   **VERSION**: An index on the commit version of a record. This creates a conflict-free, totally-ordered change log, which is ideal for synchronization. The version is a unique 12-byte value: 10 bytes from the FDB commit version and 2 bytes from a transaction-local counter in the Record Layer.
*   **RANK**: An index that can answer questions like, "what is the Nth record in a given order?" or "what is the rank of this specific record?"
*   **TEXT**: A full-text index for searching for words or phrases within a text field.

### Query Continuations for Resource Control

To prevent any single request from consuming too many resources, all long-running operations are pausable. When a query hits a predefined limit (e.g., number of records scanned or time elapsed), it stops and returns the results it has found so far, along with an opaque **continuation**.

This continuation captures the exact state of the query. The client can pass it back in a new request to resume the query exactly where it left off. This makes the system highly scalable and resilient, as it allows for fine-grained control over resource usage.

## Further Reading

*   **Paper**: [FoundationDB Record Layer: A Multi-Tenant Structured Datastore](https://www.foundationdb.org/files/record-layer-paper.pdf) (SIGMOD '19)
*   **Video**: [FoundationDB Record Layer: Open Source Structured Storage on FoundationDB](https://www.youtube.com/watch?v=SvoUHHM9IKU) (FDB Summit 2018)
*   **Video**: [Using FoundationDB and the FDB Record Layer to Build CloudKit](https://www.youtube.com/watch?v=HLE8chgw6LI) (FDB Summit 2018)
