# Smart Companion Architecture Freeze

## Architecture Vision

Smart Companion is defined as a set of stable, implementation-independent contracts. Domain capabilities remain isolated behind narrow interfaces and are coordinated exclusively by the runtime layer.

## Core Principles

- Contracts define capabilities and data boundaries without implementation.
- Each interface has one responsibility.
- Dependencies point toward stable contracts.
- Domain layers do not coordinate other domain layers.
- Runtime owns cross-layer orchestration and lifecycle.
- Extensions preserve existing contract semantics.

## Layer Responsibilities

### Common

Defines framework-independent identity, time, and event contracts shared across layers.

### Conversation

Defines conversation messages, sessions, context, and conversation data boundaries.

### Brain

Defines reasoning requests, responses, and the reasoning capability.

### Memory

Defines memory records and separate contracts for loading, saving, updating, forgetting, summarizing, and compressing memory.

### Skills

Defines skill metadata, resolution, and execution boundaries.

### Actions

Defines action requests, results, authorization, and execution boundaries.

### Character

Defines character profiles, selection, and presentation boundaries.

### Avatar

Defines avatar frames, rendering, and lip-synchronization boundaries.

### Speech

Defines speech documents, composition, and playback boundaries.

### Runtime

Defines lifecycle, scheduling, state observation, and all cross-layer orchestration.

## Framework Boundaries

- Contracts must not depend on application frameworks, transport libraries, storage systems, rendering engines, or provider SDKs.
- Contracts may depend only on other contracts permitted by the dependency rules.
- Provider-specific and framework-specific types must remain outside the contract foundation.

## Dependency Rules

- Common depends on no other architecture layer.
- Conversation may depend on Common.
- Brain, Memory, Skills, Actions, Character, Avatar, and Speech may depend on Common and Conversation where their capability requires conversation context.
- Domain layers must not depend on Runtime.
- Runtime may depend on every contract layer for orchestration.
- Circular dependencies are prohibited.

## Frozen Interfaces

The interfaces under `/core/contracts` are the official Smart Companion v1.0 contract surface. Contract names, responsibilities, input meaning, and output meaning are frozen for v1.0. Additive extensions must follow the future extension rules.

Memory operation interfaces remain independently substitutable. `IMemoryManager` is an optional façade that exposes those interfaces through composition and does not define memory behavior itself.

Conversation contracts define conversation data only. Conversation processing and cross-capability coordination belong to Runtime.

## Runtime Responsibilities

Runtime alone may:

- coordinate multiple domain capabilities;
- sequence conversation processing;
- manage lifecycle transitions;
- schedule runtime tasks;
- expose runtime state.

Runtime contracts do not contain business rules or provider implementations.

## Future Extension Rules

- Prefer a new narrow interface over expanding an unrelated interface.
- Additions must preserve dependency direction and interface segregation.
- Existing contracts may not acquire implementation details.
- New orchestration contracts must be placed in Runtime.
- Breaking changes require a new architecture version and approval.

## Architecture Version

v1.0

## Approval Date

2026-07-30

## Status

Frozen
