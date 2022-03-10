# Crafting row keys

<!-- toc -->

## Row key?

When you are using a key/value store, the design of the `row key` is extremely important, as this will define how well:

* your scans will be optimized,
* your puts will be spread,
* you will avoid `hot-spotting` a shard/region.

If you need more information on `row keys`, I recommend going through these links before moving on:

* ["Designing your schema" BigTable documentation](https://cloud.google.com/bigtable/docs/schema-design)
* ["Rowkey Design" HBase documentation](https://hbase.apache.org/book.html#rowkey.design)

## Hand-crafting row keys

Most of the time, you will need to craft the `row key` "by hand", like this for [an HBase's app](https://github.com/senx/warp10-platform/blob/879734d7f63791b487f3e535cd79ac4c23e99377/warp10/src/main/java/io/warp10/continuum/store/Store.java#L1215-L1222):

```java
// Prefix + classId + labelsId + timestamp
// 128 bits
byte[] rowkey = new byte[Constants.HBASE_RAW_DATA_KEY_PREFIX.length + 8 + 8 + 8];

System.arraycopy(Constants.HBASE_RAW_DATA_KEY_PREFIX, 0, rowkey, 0, Constants.HBASE_RAW_DATA_KEY_PREFIX.length);
// Copy classId/labelsId
System.arraycopy(Longs.toByteArray(msg.getClassId()), 0, rowkey, Constants.HBASE_RAW_DATA_KEY_PREFIX.length, 8);
System.arraycopy(Longs.toByteArray(msg.getLabelsId()), 0, rowkey, Constants.HBASE_RAW_DATA_KEY_PREFIX.length + 8, 8);
```

Or maybe you will wrap things in a function [like this in Go](https://github.com/pingcap/tidb/blob/ef57bdbbb04f60a8be744060a99207e08a37514a/tablecodec/tablecodec.go#L80-L86):

```go
// EncodeRowKey encodes the table id and record handle into a kv.Key
func EncodeRowKey(tableID int64, encodedHandle []byte) kv.Key {
	buf := make([]byte, 0, prefixLen+len(encodedHandle))
	buf = appendTableRecordPrefix(buf, tableID)
	buf = append(buf, encodedHandle...)
	return buf
}
```

Each time, you need to wrap the complexity of converting your objects to a row-key, by creating a buffer and write stuff in it.

In our Java example, there is an interesting comment:

```java
// Prefix + classId + labelsId + timestamp
```

If we are replacing some characters, we are not really far from:

```java
// (Prefix, classId, labelsId, timestamp)
```

Which looks like a `Tuple`(a collection of values of different types) and this is what FoundationDB is using as an abstraction to create keys 😍

## FDB's abstractions and helpers

### Tuple

Instead of crafting bytes by hand, we are `packing` a Tuple:

```rust
// create a Tuple<String, i64> with ("tenant-42", 1)
let tuple = (String::from("tenant-42"), 1);

// and compute a row-key from the Tuple
let row_key = foundationdb::tuple::pack::<(String, i64)>(&tuple);
```

The generated row-key will be readable from any bindings, as it's construction is standardized. Let's print it:

```rust
// and print-it in hexa
println!("{:#04X?}", row_key);
```

```log
// can be verified with https://www.utf8-chartable.de/unicode-utf8-table.pl
[
    0x02,
    0x74, // t
    0x65, // e 
    0x6E, // n
    0x61, // a
    0x6E, // n
    0x74, // t
    0x2D, // -
    0x31, // 1
    0x00, 
    0x15,
    0x2A, // 42
]
```

As you can see, `pack` added some extra-characters. There are used to recognized the next type, a bit like when you are encoding/decoding some wire protocols. You can find the relevant documentation [here](https://github.com/apple/foundationdb/blob/master/design/tuple.md).

Having this kind of standard means that we can easily decompose/`unpack` it:

```rust
// retrieve the user and the magic number In a Tuple (String, i64)
let from_row_key = foundationdb::tuple::unpack::<(String, i64)>(&row_key)?;

println!("user='{}', magic_number={}", from_row_key.0, from_row_key.1);
// user='tenant-42', magic_number=42
```

Now that we saw `Tuples`, let's dig in the next abstraction: `subspaces`

### Subspace

When you are working with key-values store, we are often playing with what we call `keyspaces`, by dedicating a portion of the key to an usage, like this for example:

```text
/users/tenant-1/...
/users/tenant-2/...
/users/tenant-3/...
```

Here, `/users/tenant-1/` can be view like a prefix where we will put all the relevant keys. Instead of passing a simple prefix, FoundationDB is offering a dedicated structure called a `Subspace`:

> A Subspace represents a well-defined region of keyspace in a FoundationDB database

> It provides a convenient way to use FoundationDB tuples to define namespaces for different categories of data. The namespace is specified by a prefix tuple which is prepended to all tuples packed by the subspace. When unpacking a key with the subspace, the prefix tuple will be removed from the result.

As you can see, the `Subspace` is heavily relying on FoundationDB's tuples, as we can `pack` and `unpack` it.

> As a best practice, API clients should use at least one subspace for application data.

Well, as we have now the tools to handle keyspaces easily, it is now futile to craft keys by hand 🙃 Let's create a subspace!

```rust

// create a subspace from the Tuple ("tenant-1", 42)
let subspace = Subspace::from((String::from("tenant-1"), 42));

// let's print the range
println!("start: {:#04X?}\n end: {:#04X?}", subspace.range().0, subspace.range().1);
```

We can see observe this:

```log
// can be verified with https://www.utf8-chartable.de/unicode-utf8-table.pl
start: [
    0x02,
    0x74, // t
    0x65, // e 
    0x6E, // n
    0x61, // a
    0x6E, // n
    0x74, // t
    0x2D, // -
    0x31, // 1
    0x00, 
    0x15,
    0x2A, // 42
    0x00,
    0x00, // smallest possible byte
]
end: [
    0x02,
    0x74, // t
    0x65, // e 
    0x6E, // n
    0x61, // a
    0x6E, // n
    0x74, // t
    0x2D, // -
    0x31, // 1
    0x00, 
    0x15,
    0x2A, // 42
    0x00,
    0xFF, // biggest possible byte
]
```

Which make sens, if we take `("tenant-1", 42)` as a prefix, then the range for this subspace will be between `("tenant-1", 42, 0x00)` and `("tenant-1", 42, 0xFF)`

### Directory

Now that we know our way around `Tuples` and `Subspaces`, we can now talk about what I'm working on, which is the `Directory`. Let's have a look at the relevant [documentation](https://apple.github.io/foundationdb/developer-guide.html#directories):

> FoundationDB provides directories (available in each language binding) as a tool for managing related subspaces.

> Directories are a recommended approach for administering applications. Each application should create or open at least one directory to manage its subspaces.

Okay, let's see the API in Go:

```go
subspace, err := directory.CreateOrOpen(db, []string{"application", "my-app", "tenant", "tenant-42"}, nil)
if err != nil {
	log.Fatal(err)
}

fmt.Printf("%+v\n", subspace.Bytes())
// [21 18]
```

We can see that we have a shorter subspace! The `directory` allows you to generate some integer that will be bind to a path, like here `"application", "my-app", "tenant", "tenant-42"`.

There are two advantages to this:

* shorter keys,
* cheap metadata operations like `List` or `Move`:

```go
// list all tenant in "application", "my-app":
tenants, err := directory.List(db, []string{"application", "my-app", "tenant"})
if err != nil {
	log.Fatal(err)
}
fmt.Printf("%+v\n", tenants)
// [tenant-42]

// renaming 'tenant-42' in 'tenant-142'
// This will NOT move the data, only the metadata is modified
directorySubspace, err = directory.Move(db, 
	[]string{"application", "my-app", "tenant", "tenant-42"},  // old path
	[]string{"application", "my-app", "tenant", "tenant-142"}) // new path
if err != nil {
	log.Fatal(err)
}
fmt.Printf("%+v\n", directorySubspace.Bytes())
// still [21 18]
```

The returned object is actually a `DirectorySubspace`, which implements both `Directory` and `Subspace`, which means that you can use it to recreate many directories and subspaces at will 👌

> If you are wondering about how this integer is generated, I recommend going through this awesome blogpost on [how high contention allocator works in FoundationDB.](https://activesphere.com/blog/2018/08/05/high-contention-allocator)