# A Culture of Correctness

<!-- toc -->

Distributed systems are notoriously difficult to build correctly. The number of possible states, race conditions, and failure modes is astronomical. While tools like [Jepsen](http://jepsen.io/) have become an industry standard for validating the claims of distributed databases, FoundationDB's approach to correctness goes much deeper. It is built on a philosophy of **simulation-driven development** that is unmatched in the industry.

This chapter explores the layers of this testing strategy, which has allowed FoundationDB to achieve its legendary stability.

## The Foundation: Flow

The story of FoundationDB's correctness begins with its programming language: **Flow**. Developed in the first weeks of the project, Flow is a C++ extension that brings actor-based concurrency to the language. As the engineering team explains:

> We’d need efficient asynchronous communicating processes like in Erlang... but we’d also need the raw speed, I/O efficiency, and control of C++. To meet these challenges, we developed... Flow, a new programming language that brings actor-based concurrency to C++11.

Flow isn't just a convenience; it's the critical enabler for the entire testing strategy. By controlling the scheduling of actors and abstracting away I/O, Flow makes it possible to run a deterministic simulation of an entire FoundationDB cluster in a single thread.

## The Engine: Deterministic Simulation

This leads to the crown jewel of the testing suite: the simulation framework. For the first 18 months of its development, FoundationDB never sent a single packet over a real network. It was built and tested entirely in simulation.

How does it work?

*   **Single-Threaded Execution:** The entire cluster—every logical process, client, and server—runs as a set of actors within a single OS thread.
*   **Simulated Interfaces:** All external communication, including network, disk, and time, is replaced with a deterministic, in-memory simulation. The network is not reliable; it can be partitioned, delayed, and reordered by the simulator.
*   **Perfect Reproducibility:** Because the simulation is single-threaded and the inputs are controlled by a random seed, any test run is perfectly deterministic. If a test fails with a specific seed, a developer can reproduce the *exact* sequence of events that led to the failure, down to the scheduling of individual actors.

This allows for a level of testing that is impossible with traditional methods. The team has run the equivalent of a **trillion CPU-hours** of simulated stress testing, exploring state spaces that would be impossible to cover in the real world.

<iframe width="560" height="315" src="https://www.youtube.com/embed/4fFDFbi3toc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## The Fuel: Generative Testing and Buggify

Deterministic simulation is necessary, but not sufficient. As one engineer put it:

> The reason why people write tests is because human beings are astonishingly bad at thinking through all the possible branches of control flow... that very fact means that we're unable to write tests to cover all the things that we actually need to cover.

Instead of trying to write specific tests for every scenario, the FoundationDB team built a system for **generating new and interesting tests**. A test in FoundationDB is not a simple unit test; it's a combination of a **workload** (the goal) and a set of **chaos agents** (things trying to break the goal).

For example, a test might specify a workload of 5,000 transactions per second while simultaneously:

*   **Clogging the network:** Randomly stopping and reordering network packets.
*   **Killing machines:** Randomly rebooting virtual servers.
*   **Changing the configuration:** Forcing the cluster to re-elect its coordinators.

To make this even more powerful, developers use a macro called `BUGGIFY`. This macro allows them to explicitly cooperate with the simulator by instrumenting the code with potential failure points. For example, a developer can wrap a piece of code in `BUGGIFY` to tell the simulator, "This is an interesting place to inject a 10-second delay, but only 1% of the time."

This allows the simulation to explore not just external failures (like network partitions) but also internal, heisenbug-like conditions in a controlled and deterministic way.

## The Result: Confidence at Scale

The implications of this approach are profound:

*   **CI as a Brute-Force Weapon:** Every pull request is subjected to hundreds of thousands of simulation tests, running on hundreds of cores for hours, before a human even begins a code review.
*   **Focus on Invention, Not Regression:** Developers can focus on building new features, confident that the CI system will relentlessly probe their code for correctness against a chaotic world of failures.

As the original team said, "It seems unlikely that we would have been able to build FoundationDB without this technology." It is this deep, foundational commitment to correctness that makes FoundationDB one of the most robust and trustworthy databases in the world.

