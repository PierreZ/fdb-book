# Learning from the Community: Open-Source Layers

One of the best ways to learn how to build on FoundationDB is to study existing, production-proven layers. A "layer" is simply a library or service that provides a higher-level data model on top of FoundationDB's ordered key-value store. By examining how these layers map their data models to keys and values, you can gain invaluable insights for your own projects.

Here are some of the most prominent open-source layers developed by the FoundationDB community.

<!-- toc -->

## The Record Layer

The Record Layer provides a structured, record-oriented data store on top of FoundationDB, similar to a traditional relational database. It is used in production at Apple to power CloudKit.

*   **GitHub Repo:** [foundationdb/fdb-record-layer](https://github.com/foundationdb/fdb-record-layer)
*   **Academic Paper:** [FoundationDB Record Layer](https://www.foundationdb.org/files/record-layer-paper.pdf)
*   **Key Videos:**
    *   [FoundationDB Record Layer: Open Source Structured Storage on FoundationDB](https://youtu.be/HLE8chgw6LI) (Nicholas Schiefer, Apple)
    *   [Using FoundationDB and the FDB Record Layer to Build CloudKit](https://youtu.be/SvoUHHM9IKU) (Scott Gray, Apple)

## The Document Layer

The Document Layer implements a MongoDB®-compatible API, allowing you to store and query JSON documents within FoundationDB.

*   **GitHub Repo:** [FoundationDB/fdb-document-layer](https://github.com/FoundationDB/fdb-document-layer)
*   **Key Video:**
    *   [FoundationDB Document Layer](https://youtu.be/KPqmB13zI9c) (Bhaskar Muppana, Apple)

## The ZooKeeper Layer

This layer implements the Apache ZooKeeper API, providing a distributed coordination service built on FoundationDB.

*   **GitHub Repo:** [pH14/fdb-zk](https://github.com/pH14/fdb-zk)
*   **Key Video:**
    *   [A ZooKeeper Layer for FoundationDB](https://youtu.be/3FYpf1QMPgQ) (Paul Hemberger, HubSpot)

## The Time-Series Layer

This is an experimental, high-performance layer written in Go, designed specifically for storing and querying time-series data with high compression.

*   **GitHub Repo:** [richardartoul/tsdb-layer](https://github.com/richardartoul/tsdb-layer)
*   **Key Video:**
    *   [Time Series and FoundationDB: Millions of Writes/s and 10x Compression in 2000 Lines of Go](https://www.youtube.com/watch?v=W6yQ9Pwgb1A)

## Warp 10

Warp 10 is a powerful platform for managing time-series data. While it was not originally built on FoundationDB, version 3.0 and later versions have adopted it to replace HBase. This change was motivated by a desire to simplify operations and eliminate the dependency on the Hadoop ecosystem.

*   **GitHub Repo:** [senx/warp10-platform](https://github.com/senx/warp10-platform)
*   **Key Blog Post:** [Introducing Warp 10 3.0!](https://blog.senx.io/introducing-warp-10-3-0/)