# Sprint 95.1 Semantic Constraint Normalization

> Superseded by Sprint 96. Additive constraint deployment now verifies identity only and performs no definition normalization.

## Root cause

Sprint 95 correctly extracted and compared the sorted allowed-value set, but then applied a second representation-sensitive predicate. The `= ANY` form had to be followed by exactly `(`, optional whitespace, `ARRAY`, and `[`. PostgreSQL may render an equivalent check with additional grouping or casts. The value-set comparison could therefore be true while this separate shape comparison was false.

The frozen production catalog deliberately retains only the definition hash (`d4aeb6915315b25d246cd4e8e9964f0f423e195ab441fead50b6ca7e9a5da634`), not the raw definition. Retrieving the exact live text would require executing a production query, which this sprint explicitly did not do. The production form supplied with the incident is represented as:

`CHECK ((status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'checked_in'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text, 'rescheduled'::text])))`

## Previous failing comparison

For the supplied production form:

- Extracted values: `{cancelled,checked_in,completed,confirmed,no_show,rescheduled,scheduled}`
- Expected values: `{cancelled,checked_in,completed,confirmed,no_show,rescheduled,scheduled}`
- Value comparison: `TRUE`
- Narrow textual shape comparison: `definition ~* '=\\s*any\\s*\\(\\s*array\\s*\\['`
- Failure mechanism: a PostgreSQL-added cast or grouping between `ANY` and the array makes that comparison `FALSE`

## Exact normalization fix

Both `IN (...)` and `= ANY (...)` now normalize to one representation independent of SQL rendering:

`status:cancelled|checked_in|completed|confirmed|no_show|rescheduled|scheduled`

The expected normalized string is exactly the same. The guard compares both these canonical strings and the underlying sorted arrays.

Safety remains fail closed through independent catalog and expression checks:

- the object must be a check constraint;
- `conkey` must reference exactly the expected `status` column;
- the expression must use positive `IN` or `= ANY` membership;
- compound `AND`, `OR`, or `NOT` logic is rejected;
- any added, removed, renamed, or case-changed allowed value is rejected.

Conflict diagnostics now include the raw definition, actual normalized value, expected normalized value, and each boolean comparison. Constraint definitions contain no secrets.

No SQL was executed, no deployment occurred, and production was not modified.
