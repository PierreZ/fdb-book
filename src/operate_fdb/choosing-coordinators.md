# Guidelines for Choosing Coordinators

Unlike most roles in the cluster, which are assigned dynamically, coordinators must be configured statically. This requires careful consideration to ensure your cluster is both fault-tolerant and performant.

## Overview

Coordinators are responsible for three critical functions:

1.  **Electing the Cluster Controller:** The cluster controller is the leader of the cluster. This election is an iterative process, and having too many coordinators can increase the probability of failure in each round, slowing down the election process significantly.
2.  **Storing Global State:** During a recovery, this state is read, locked, and rewritten to all coordinators. The more coordinators you have, the longer this process takes, which can increase your recovery times.
3.  **Facilitating Client Connections:** Clients discover the cluster controller through the coordinators. While this path is optimized, in the worst case, a client may need to communicate with all coordinators, making new connections slower.

Losing a majority of your coordinators will cause the database to become unavailable. However, having more coordinators than necessary can harm performance and make operations more complex.

## Recommended Coordinator Counts

The goal is to have enough coordinators to meet your fault-tolerance goals without adding unnecessary overhead.

*   **Single Data Center:** For a single-DC configuration with a replication factor of `R`, the recommended number of coordinators is `2*R - 1`. This configuration can tolerate the failure of `R-1` coordinators while still maintaining a majority.

*   **Multi-Data Center:** For multi-DC deployments, you typically want to be resilient to the loss of at least one data center plus one additional machine failure. For these scenarios, we recommend **9 coordinators**, spread evenly across at least 3 DCs. This ensures that no single DC has more than 3 coordinators. If you lose one DC and one additional machine, you would lose at most 4 of your 9 coordinators, leaving a majority available.

*   **Two Data Centers:** If you are only storing data in two DCs, we recommend provisioning 3 processes in a third data center to serve exclusively as coordinators.

## Determining Which Processes to Use

When selecting which `fdbserver` processes will act as coordinators, follow two rules:

1.  **Unique Fault Domains:** Every coordinator should be on a different physical machine or fault domain (and thus have a different `zoneid`).
2.  **Even Distribution:** Coordinators should be spread as evenly as possible across data centers and racks.

Following these guidelines will help ensure your cluster achieves its desired level of fault tolerance.
