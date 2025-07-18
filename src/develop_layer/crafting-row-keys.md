# Key Design: Tuples, Subspaces, and Directories

<!-- toc -->

In a key-value store, the way you structure your keys is one of the most important architectural decisions you will make. Your key schema determines how your data is organized, how efficiently you can query it, and how well your workload will scale. This chapter introduces FoundationDB's powerful, layered abstractions for key management.

## The Challenge: Hand-Crafting Keys

At the lowest level, a key is just a sequence of bytes. In many key-value systems, developers are forced to manually craft these byte arrays, a process that is both tedious and error-prone.

Consider storing user data. You might decide on a key structure like `(user_id, attribute_name)`. To implement this, you would need to write code that serializes the `user_id` (an integer) and the `attribute_name` (a string) into a single byte array, taking care to handle different data types, lengths, and ordering correctly. This is brittle; a small change in the format can break your application.

FoundationDB provides a much better way.

## Layer 1: The `Tuple`

The most fundamental building block for key design is the **Tuple**. A tuple is an ordered collection of elements of different types (like strings, integers, and UUIDs). The FoundationDB client libraries provide a `pack()` function that serializes a tuple into a byte string that correctly preserves type and ordering.

```python
import fdb.tuple

# A tuple containing a string and an integer
user_profile_tuple = ('user', 12345)

# Pack the tuple into a byte key
key = fdb.tuple.pack(user_profile_tuple)

# The result is a byte string suitable for use as a key
# b'\x02user\x00\x1509'
print(repr(key))

# You can unpack the bytes back into the original tuple
unpacked_tuple = fdb.tuple.unpack(key)
assert unpacked_tuple == user_profile_tuple
```

This simple abstraction solves the manual serialization problem. You can think in terms of structured data, and the tuple layer handles the byte-level representation for you. Because the packing format is standardized across all language bindings, a key packed in Python can be unpacked in Go, Java, or any other language.

## Layer 2: The `Subspace`

Building on tuples, the next layer of abstraction is the **Subspace**. A subspace is a way to create a dedicated namespace within the database for a particular category of data. It works by defining a prefix tuple that is automatically prepended to all keys packed within that subspace.

This is a powerful organizational tool. For example, you can create separate subspaces for user data, application settings, and logging events.

```python
import fdb.tuple

# Create a subspace for storing user profiles
user_subspace = fdb.Subspace(('users',))

# Now, keys created within this subspace will be prefixed
# with the packed representation of ('users',)
key1 = user_subspace.pack(('alice',))
key2 = user_subspace.pack(('bob',))

# key1 is now b'\x02users\x00\x02alice\x00'
# key2 is now b'\x02users\x00\x02bob\x00'
print(repr(key1))
print(repr(key2))

# You can also use the subspace to unpack a key,
# which strips the prefix automatically.
unpacked = user_subspace.unpack(key1)
assert unpacked == ('alice',)
```

Subspaces allow you to isolate data and perform range scans over a specific category of information without worrying about colliding with other parts of your keyspace.

## Layer 3: The `Directory`

The highest level of abstraction is the **Directory**. Directories are a tool for managing subspaces. While you can create subspaces with fixed prefixes (like `('users',)`), directories allow you to create and manage them dynamically.

> Directories are the recommended approach for organizing the keyspace of one or more applications.

A directory allows you to associate a human-readable path (like `('users', 'profiles')`) with a short, randomly generated integer prefix. This has two major benefits:

1.  **Shorter Keys:** The generated prefix is much shorter than the packed representation of the full path, saving space.
2.  **Schema Management:** You can list, move, and remove directories. Moving a directory is a fast metadata-only change; it doesn't require rewriting all the keys within it.

```python
import fdb
import fdb.directory

fdb.api_version(710)
db = fdb.open()

# Create or open a directory at a specific path
app_dir = fdb.directory.create_or_open(db, ('my-app',))

# Create subspaces within that directory
users_subspace = app_dir.create_or_open(db, ('users',))
logs_subspace = app_dir.create_or_open(db, ('logs',))

# The key for the 'users' subspace might be b'\x15\x01', a much
# shorter prefix than packing the full path.
print(repr(users_subspace.key()))

# You can now use this subspace as before
@fdb.transactional
def set_user(tr, name):
    tr[users_subspace.pack((name,))] = b'some_profile_data'

set_user(db, 'charlie')
```

By using these three layers—Tuples for serialization, Subspaces for namespacing, and Directories for management—you can build sophisticated and maintainable data models on top of the simple key-value interface.