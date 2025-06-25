# Anatomy of a Cluster: Roles

<!-- toc -->

FoundationDB's architecture is built on a collection of specialized, stateless roles. This separation of concerns is a key reason for its high performance, scalability, and fault tolerance. A running `fdbserver` process can dynamically take on any of these roles as needed. Understanding them is the first step to understanding how FoundationDB works.

Here are the core roles in a FoundationDB cluster:

## The Coordinator

The **Coordinator** is the first process that any client or server connects to when joining the cluster. Its primary job is to manage the *cluster file*, a small, durable text file that contains the IP addresses and ports of the coordinators themselves. The coordinators elect a **Cluster Controller**, which serves as the singleton brain of the cluster.

## The Cluster Controller

The **Cluster Controller** is the authoritative monitor for the entire cluster. There is only one active Cluster Controller at any time. It is responsible for:

*   Monitoring the health of all other `fdbserver` processes.
*   Recruiting new processes to take on roles as needed (e.g., if a Log Server fails).
*   Orchestrating recovery when a process fails.

## The Proxy

The **Proxy** (specifically, the Commit Proxy) is the front door for all transactions. When a client commits a transaction, it sends its read and write sets to a Proxy. The Proxy is responsible for:

1.  Assigning a **Read Version** to incoming transactions.
2.  Sending the transaction to the Resolver to check for conflicts.
3.  If the transaction is valid, sending it to the Log Servers to be made durable.
4.  Reporting the final commit status back to the client.

Because proxies are stateless, you can add more of them to the cluster to increase transaction throughput.

## The Resolver

The **Resolver** is the component that enforces serializability. During the commit process, the Proxy sends the transaction's read set to the Resolver. The Resolver checks if any of the keys in the read set have been modified by another transaction that has committed since the current transaction's read version was assigned. If a conflict is found, the transaction is rejected, and the client must retry.

## The Log Server

The **Log Server** is the heart of FoundationDB's durability guarantee. It implements the transaction log. When a transaction is ready to be committed, its mutations are sent to the Log Servers, which write them to durable storage (typically an SSD) before the commit is acknowledged to the client. The Log Servers do not need to apply the changes to the main data store; they just need to record them.

## The Storage Server

The **Storage Server** is responsible for storing the data. Each Storage Server holds a set of key ranges (shards). It serves read requests from clients and receives committed mutations from the Log Servers, applying them to its in-memory B-tree and eventually writing them to disk. Storage Servers are the workhorses of the cluster, and you can add more of them to increase both storage capacity and I/O performance.

## The Data Distributor

The **Data Distributor** is a background role responsible for ensuring that data is evenly distributed and replicated across all of the Storage Servers. It monitors the size and workload of each shard and will automatically move data between servers to prevent hotspots and ensure fault tolerance. It is also responsible for initiating data replication and healing the cluster after a Storage Server fails.
