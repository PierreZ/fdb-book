# Modeling on a Key-Value Store

<!-- toc -->

> "If FoundationDB is just a key-value store, how can it power complex applications?"

This is the crucial question. The answer lies in a powerful, common architectural pattern: building rich data models on top of a simple, ordered key-value core. By defining a specific way to encode data structures into keys and values, you can represent almost anything, from relational tables to complex documents and graphs.

This is not a new or niche idea. Many of the most successful and scalable modern databases are built using this exact layered architecture. Let's look at a few examples.

## The Pattern: A Tale of Two Layers

Most modern databases can be conceptually divided into two layers:

1.  **The Storage Layer:** A low-level engine, often a key-value store, responsible for the distributed storage, replication, and transactional integrity of data.
2.  **The Data Model Layer:** A higher-level component that exposes a rich data model (e.g., SQL, Document, Graph) and translates queries into operations on the underlying storage layer.

This separation of concerns allows each layer to do what it does best.

## Industry Examples

This layered pattern appears again and again in the architecture of leading databases.

### SQL on Key-Value: Google, CockroachDB, and TiDB

Several of the most prominent distributed SQL databases are built on a key-value core.

*   **Google's Spanner and F1:** Google's database journey shows a clear evolution. [Megastore](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/36971.pdf) provided ACID semantics on top of the Bigtable key-value store. This evolved into [Spanner](https://www.usenix.org/system/files/conference/osdi12/osdi12-final-16.pdf), which started as a key-value store and grew into a full-fledged [relational database](https://storage.googleapis.com/pub-tools-public-publication-data/pdf/acac3b090a577348a7106d09c051c493298ccb1d.pdf). The key insight is that the SQL data model is a layer on top of a scalable, transactional key-value foundation.

*   **CockroachDB:** As described in their architecture documentation, CockroachDB maps all [SQL table and index data](https://www.cockroachlabs.com/blog/sql-in-cockroachdb-mapping-table-data-to-key-value-storage/) directly into its underlying monolithic sorted key-value map.

*   **TiDB:** The TiDB ecosystem explicitly separates its components. [TiDB](https://www.vldb.org/pvldb/vol13/p3072-huang.pdf) is the SQL computation layer, while **TiKV** is the distributed, transactional key-value storage layer. Each SQL row is mapped to a key-value pair in TiKV.

### Advanced Indexing on Key-Value

The layered pattern extends beyond just mapping primary table data. Even sophisticated secondary indexing strategies, like those for semi-structured data (JSON) or full-text search, are implemented by modeling the index as a set of key-value pairs.

*   **CockroachDB's Inverted Indexes:** To allow efficient querying of JSON or array data types, CockroachDB implements [inverted indexes](https://raw.githubusercontent.com/cockroachdb/cockroach/refs/heads/master/docs/RFCS/20171020_inverted_indexes.md). Instead of storing a single key for the whole JSON document, it tokenizes the document and creates multiple key-value entries mapping individual values back to the primary key of the row. This allows for fast lookups based on the contents of the JSON object, a feat not possible with traditional secondary indexes.

*   **CouchDB's Map Indexes on FoundationDB:** The design for CouchDB's powerful [map-based views on FoundationDB](https://raw.githubusercontent.com/apache/couchdb/refs/heads/main/src/docs/rfcs/008-map-indexes.md) provides another clear example. A user-defined `map` function processes each document to `emit` key-value pairs, which are then stored in FoundationDB to create a secondary index. This entire indexing subsystem is a layer built on top of FDB's core key-value capabilities.

### Multi-Model Databases: Cosmos DB and YugabyteDB

Other databases use this pattern to support multiple data models on a single, unified backend.

*   **Azure Cosmos DB:** Microsoft's global-scale database projects multiple data models (Document, Graph, Key-Value) over a [minimalist core data model](http://muratbuffalo.blogspot.com/2018/08/azure-cosmos-db.html). The storage engine itself is agnostic to whether it's storing a document or a graph node.

*   **YugabyteDB:** Follows a similar [layered design](https://docs.yugabyte.com/latest/architecture/layered-architecture/), with a query layer that supports both SQL and Cassandra APIs on top of **DocDB**, its underlying distributed document store, which itself functions as a key-value store.

## The Unbundled Database: FoundationDB

All these examples point to a powerful conclusion: many modern databases are, internally, a specialized data model layer tightly bundled with a general-purpose key-value storage engine.

FoundationDB's philosophy is to **unbundle** these two layers. It provides *only* the core storage engine, but it makes that engine more powerful and generic than any of the bundled equivalents. It gives you:

*   An ordered key-value store.
*   Strictly serializable ACID transactions.
*   Exceptional performance and proven reliability.

This frees you, the developer, to build *any* data model layer you can imagine. You get the power of a world-class distributed storage engine without being locked into a specific, high-level data model. FoundationDB is the ultimate realization of the layered database architecture.
