# Echo Development History

Echo Development History is the architectural and design memory of Echo Platform.

Its purpose is to preserve important development stages without duplicating
the entire application source code.

## Principles

- Git commits record small code changes.
- Git tags mark important stable development points.
- Echo History records approved design and architecture stages.
- PROJECT.md describes the current state of the project.
- Old versions are preserved as references, not used directly in production.

## Status

Each recorded stage can have one or more of these states:

- Draft
- Tested
- Approved
- Current
- Archived
- Restart Point

## Areas

- home
- companion
- products
- smart-forms
- participant
- admin
- engines
- decisions

## Version ID

History entries use stable IDs.

Examples:

EH-HOME-000
EH-HOME-001
EH-COMP-001
EH-PRODUCT-001
EH-ADMIN-001

The ID never changes after creation.

## Important Rule

Production code remains inside the application.

Echo Development History documents:

1. What existed.
2. What changed.
3. Why it changed.
4. What was tested.
5. What was approved.
6. Which Git commit/tag contains the complete code.
7. Whether the version can be used as a Restart Point.
