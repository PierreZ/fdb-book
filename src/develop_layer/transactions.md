# Core Concept: Transactions

<!-- toc -->

Transactions are the heart of FoundationDB. They are the mechanism that allows you to build complex, multi-key operations while guaranteeing the database remains consistent. FoundationDB provides some of the strongest transactional guarantees in the industry, and understanding how they work is the key to building reliable layers.

## Strictly Serializable ACID Transactions

FoundationDB offers fully **ACID** (Atomicity, Consistency, Isolation, Durability) transactions. But it goes a step further by providing the strongest isolation level: **strict serializability**. This means that transactions behave as if they were executed one at a time, in some sequential order. You are completely insulated from the complexities of concurrent operations; you can write your code as if you are the only person using the database.

## The Transactional Pattern: Read, Write, Commit

Working with a transaction in FoundationDB follows a simple but powerful pattern:

1.  **Create a transaction object.**
2.  **Read from the database.** You can read one or more keys. FoundationDB remembers which keys you've read (your *read set*).
3.  **Write to the database.** You can write one or more keys. These writes are buffered locally in the transaction object (your *write set*).
4.  **Commit the transaction.** The client sends the transaction (its read and write sets) to the cluster for validation.

This is an **optimistic** concurrency model. The database *optimistically* assumes that your transaction will not conflict with others. The check only happens at the very end, during the commit phase.

## Conflict Resolution: The Retry Loop

What happens if another transaction commits a change to a key you *read* before your own transaction commits? This is a **conflict**. When the cluster detects a conflict, it will reject your transaction with a retryable error.

This is not a failure; it's a core part of the design. Your application code is expected to catch this error and simply retry the entire transaction from the beginning. This is known as the **transactional retry loop**.

Here is a pseudo-code example of this fundamental pattern:

```python
# A simplified view of the FDB transaction pattern
def transfer_funds(db, from_acct, to_acct, amount):
    # The retry loop is handled for you by the @transactional decorator
    # in most language bindings.
    @fdb.transactional
    def _do_transfer(tr):
        # 1. Read the current balances
        from_balance = tr[from_acct].wait()
        to_balance = tr[to_acct].wait()

        # If we read a null value, the account doesn't exist
        if from_balance is None or to_balance is None:
            raise Exception("Account not found")

        from_balance = int.from_bytes(from_balance, 'big')
        to_balance = int.from_bytes(to_balance, 'big')

        # 2. Perform local logic
        if from_balance < amount:
            raise Exception("Insufficient funds")

        # 3. Write the new balances to the local transaction buffer
        tr[from_acct] = (from_balance - amount).to_bytes(8, 'big')
        tr[to_acct] = (to_balance + amount).to_bytes(8, 'big')

        # 4. The commit happens automatically when the function returns

    # Execute the transaction
    _do_transfer(db)
```

If another transaction modifies `from_acct` or `to_acct` after our transaction has read them but before it has committed, the commit will fail. The `@transactional` decorator will automatically catch the error and re-run the `_do_transfer` function from the beginning. This simple, powerful loop ensures that your logic always runs on a consistent snapshot of the database.

For a deeper dive into how to avoid conflicts and design your data models for high-contention workloads, this talk is an excellent resource:

<iframe width="560" height="315" src="https://www.youtube.com/embed/2HiIgbxtx0c" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>