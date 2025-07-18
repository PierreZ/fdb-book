# Installation

<!-- toc -->

This chapter guides you through setting up FoundationDB. While the official documentation provides detailed, platform-specific instructions, this guide will help you understand the components and make the right choices for your setup.

*   [Official Docs: Getting Started on Linux](https://apple.github.io/foundationdb/getting-started-linux.html)
*   [Official Docs: Getting Started on macOS](https://apple.github.io/foundationdb/getting-started-mac.html)

## Do I Need the Client or the Server?

The first step is to decide which package you need from the [Downloads page](https://apple.github.io/foundationdb/downloads.html).

### The Server Package

Install the **server** package if you want to run a FoundationDB database cluster on a machine. This is for you if you are:

*   Setting up a new development environment on your local machine.
*   Provisioning a server to be part of a production cluster.

This package contains the core `fdbserver` binary, which runs the database, and `fdbmonitor`, which manages the server process.

### The Client Package

Install the **client** package if a machine only needs to connect to an *existing* FoundationDB cluster. This is for you if you are:

*   Building an application that uses a FoundationDB binding (e.g., in Python, Go, or Java).
*   Using command-line tools like `fdbcli` to administer a remote cluster.

This package provides the necessary C libraries (`libfdb_c.so`) that all language bindings depend on, as well as several administrative tools.

## The Cluster File: Your Key to the Cluster

Whether you install the client or the server, you will get a **cluster file** (e.g., `/etc/foundationdb/fdb.cluster`). This small text file is critically important:

> The cluster file contains the IP addresses and ports of the coordination servers. It's how any client or server finds and connects to the database.

To connect to a cluster, your client machine must have a copy of that cluster's `fdb.cluster` file. When you set up a new server, one is created for you. When you set up a client to talk to an existing cluster, you must copy the file from the cluster to your client machine.

## ⚠️ A Critical Note on Versioning

FoundationDB enforces strict compatibility between the client library and server processes. This is a common source of confusion for new users.

**The Rule:** The installed client library (`libfdb_c`) and the server binaries (`fdbserver`) **must** have the same major and minor version numbers. For example, a client with version `7.1.x` can only talk to a server with version `7.1.y`. It **cannot** talk to a server running `7.2.z` or `6.3.w`.

However, you can connect to a cluster with an older version by specifying the API version in your client code. For example, if your client machine has the `7.4.x` libraries installed, you can still connect to a `7.3.z` cluster by calling `fdb.select_api_version(730)` before connecting. This mechanism is particularly useful for facilitating rolling upgrades, allowing clients to be upgraded before the servers.

If you mix incompatible versions without selecting a compatible API version, your application will likely fail to connect, often by hanging indefinitely. The server logs may show `ConnectionRejected` errors with the reason `IncompatibleProtocolVersion`. It's crucial to ensure your client machines and server cluster are running compatible versions, or that you are using `select_api_version` correctly during an upgrade.