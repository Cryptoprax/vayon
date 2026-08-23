# Version 1 missing-object report

## Repaired object reference

| Referenced name | Classification | Evidence | Repair |
| --- | --- | --- | --- |
| `public.inventory_projects` | **C. Incorrect object name** | Never defined; Sprint 78 and the property repository establish `public.property_projects` as canonical | Staged schema/FK/function references normalized to `public.property_projects` |

It was not classified as a missing deployment object because repository evidence does not support creating a new business table. It was not classified as obsolete because Creative campaigns still require an authoritative project relationship. It was not a wrong schema or circular dependency.

## Remaining missing packaged objects

None detected by the static audit.

| Surface | Missing count |
| --- | ---: |
| Table/view targets | 0 |
| ALTER targets | 0 |
| Index targets | 0 |
| Function table dependencies | 0 |
| Packaged helper functions | 0 |
| Policy relations | 0 |
| Trigger relations | 0 |
| Trigger functions | 0 |
| Extensions | 0 |
| Sequences | 0 |
| Enums/domains | 0 |
| Buckets | 0 |

## Non-package obsolete references

The application layer still contains `inventory_projects`, `inventory_units`, and `inventory_documents` queries in Creative generation code and corresponding historical test expectations. These are outside the schema-only authorization of Sprint 93. They do not make staged SQL internally incomplete, but they prevent certifying Creative runtime behavior after deployment.

## Fail-closed rule

Any newly discovered reference absent from both the frozen production catalog and all earlier deployment stages blocks deployment. No placeholder table or compatibility object may be created without authoritative domain evidence.
