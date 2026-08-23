# Obsolete Schema Reference Inventory

## Classification

The required repository scan produced 332 candidate occurrences before repair.

| Class | Count | Treatment |
| --- | ---: | --- |
| A — Correct | 292 | Valid inventory domain language, authoritative `property_inventory_*` objects, and the package generator's documented normalization rule |
| B — Legacy alias | 8 | References inside three immutable historical migrations; retained because Sprint 94 forbids migration-history modification |
| C — Incorrect runtime reference | 7 | Four Creative runtime queries and three regression assertions; all repaired |
| D — Dead code | 25 | Historical Sprint 92/93 report prose describing the former blocker; non-executable and retained as release evidence |
| E — Unused | 0 | None established by repository evidence |

## Executable repairs

| Location | Before | After | Classification |
| --- | --- | --- | --- |
| Creative assistant project lookup | `inventory_projects` | `property_projects` | C |
| Creative worker project lookup | `inventory_projects` | `property_projects` | C |
| Creative worker unit lookup | `inventory_units` | `property_units` | C |
| Creative worker document lookup | `inventory_documents` | `property_documents` | C |
| Creative regression expectation | `inventory_projects` | `property_projects` | C |
| Creative regression expectation | `inventory_units` | `property_units` | C |
| Creative regression expectation | `inventory_documents` | `property_documents` | C |

## Intentionally retained occurrences

- Eight occurrences in the original Sprint 82, 82.5 and 82.6 migrations are historical aliases. Those files are migration history and were not rewritten.
- Two occurrences in `scripts/generate-sprint91-deployment-package.mjs` are an active, evidence-backed normalization rule and its explanation. The generated deployment stages contain no obsolete relation.
- Twenty-five occurrences in existing release reports describe the discovery and repair history. They are non-executable evidence, not runtime dependencies.
- Valid domain names such as `InventoryProject`, `InventoryUnit`, `InventoryDocument`, `inventory_imported`, inventory UI labels and `property_inventory_audit` remain unchanged.

## Final scan

`app/`, `features/`, `lib/`, and `tests/` contain zero occurrences of `inventory_projects`, `inventory_units`, or `inventory_documents`.

