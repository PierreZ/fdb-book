# Upgrading FoundationDB

Upgrading a FoundationDB cluster can be a challenging process, but with the right procedure, it can be accomplished with zero downtime.

## Overview

The main challenge is that the internal wire protocol used for communication between server processes is not guaranteed to be stable across different minor versions. This means that during a minor version upgrade (e.g., from 6.1 to 6.2), all `fdbserver` processes must be restarted with the new binaries simultaneously.

Clients must also use a protocol-compatible library to connect. To avoid client outages, FoundationDB supports a multi-version client feature, allowing an application to load both old and new client libraries at the same time.

This guide outlines a safe, zero-downtime upgrade process, assuming you are running `fdbserver` through `fdbmonitor`.

## Server Upgrade Process

The high-level process is as follows:

1.  **Install New Binaries:** Install the new `fdbserver` binaries alongside the old ones. It's a good practice to place them in versioned directories, for example:
    *   Old: `/usr/bin/fdb/6.1.12/fdbserver`
    *   New: `/usr/bin/fdb/6.2.8/fdbserver`

2.  **Update Monitor Configuration:** Update the `fdbmonitor.conf` file to point to the new `fdbserver` binary path.

3.  **Restart the Cluster:** Using the **old** version of `fdbcli`, issue a coordinated restart of the cluster:
    ```bash
    fdbcli --exec 'kill; kill all; status'
    ```

4.  **Verify Health:** Using the **new** version of `fdbcli`, connect to the database and confirm that the cluster is healthy and running the new version.

To minimize the risk of processes restarting organically with the new binary before the coordinated `kill`, you should set `kill_on_configuration_change=false` in your `fdbmonitor.conf` and minimize the time between steps 2 and 3.

## Client Upgrade Process

To ensure clients remain connected during the server upgrade, you must prepare them ahead of time using the multi-version client feature.

1.  **Install New Client Library:** Install the new client library (`.so` or `.dylib`) into a dedicated directory. The filename should include the version (e.g., `/var/lib/fdb-multiversion/libfdbc_6.2.8.so`).

2.  **Configure Environment Variable:** Set the `FDB_NETWORK_OPTION_EXTERNAL_CLIENT_DIRECTORY` environment variable in your client application's environment to point to this directory (e.g., `/var/lib/fdb-multiversion`).

3.  **Restart Client Application:** Bounce your client application to make it load the new library in addition to the one it's already using.

4.  **Verify Client Compatibility:** Before upgrading the servers, you can check the database status JSON (`status json`) to confirm that all clients have loaded a compatible protocol version. The `cluster.clients.supported_versions` field will list all protocol versions supported by connected clients.

5.  **Perform Server Upgrade:** Once all clients are ready, proceed with the server upgrade steps described above.

6.  **Clean Up:** After the server upgrade is complete and stable, you can update your client applications to use the new library as their primary version and remove the old library files from the multi-version directory.

## Upgrading Other Binaries

Tools like `fdbbackup` and `fdbdr` must also be protocol-compatible. You should upgrade these binaries after the main cluster upgrade is complete. There will be a temporary lag in backup and disaster recovery operations until these components are also running the new version.
