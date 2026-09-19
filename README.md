# Deterministic Finite Automaton (DFA) - Product Code Validator

A formal deterministic finite automaton simulator and inventory asset validator recognizing the regular language $L = \{ c_1 c_2 - y_1 y_2 y_3 y_4 - s_1 s_2 s_3 \mid c_i \in [A\text{-}Z], y_i, s_i \in [0\text{-}9] \}$.

---

## Table of Contents

* [Formal Automata Specification](#formal-automata-specification)
  * [Alphabet ($\Sigma$)](#alphabet-\sigma)
  * [States ($Q$)](#states-q)
  * [Language & Regular Expression Equivalence](#language--regular-expression-equivalence)
* [DFA State Transition Table](#dfa-state-transition-table)
  * [Domain Prefix Mapping](#domain-prefix-mapping)
* [Architecture & Design Decisions](#architecture--design-decisions)
* [Project Directory Layout](#project-directory-layout)
* [Local Setup & Testing Instructions](#local-setup--testing-instructions)
  * [Prerequisites](#prerequisites)
  * [Repository Setup & IDE Initialization](#repository-setup--ide-initialization)
  * [Installation & Execution](#installation--execution)
* [Test Cases (20 Formal Vectors)](#test-cases-20-formal-vectors)

---

## Formal Automata Specification

The machine is defined as a 5-tuple Deterministic Finite Automaton:

$$M = (Q, \Sigma, \delta, q_0, F)$$

### Alphabet ($\Sigma$)

$$\Sigma = \Sigma_{\text{alpha}} \cup \Sigma_{\text{digit}} \cup \Sigma_{\text{delim}}$$

* $\Sigma_{\text{alpha}} = \{ A, B, C, \dots, Z \}$ ($|\Sigma_{\text{alpha}}| = 26$)
* $\Sigma_{\text{digit}} = \{ 0, 1, 2, \dots, 9 \}$ ($|\Sigma_{\text{digit}}| = 10$)
* $\Sigma_{\text{delim}} = \{ - \}$ ($|\Sigma_{\text{delim}}| = 1$)
* Total alphabet size: $|\Sigma| = 26 + 10 + 1 = 37$

Any input character $c \notin \Sigma$ is an alphabet violation and diverts immediately to the dead state $q_{\text{trap}}$.

### States ($Q$)

$$Q = \{ q_0, q_1, q_2, q_3, q_4, q_5, q_6, q_7, q_8, q_9, q_{10}, q_{11}, q_{\text{trap}} \} \quad (|Q| = 13)$$

* **Start State ($q_0$):** Initial state prior to consuming any input symbol.
* **Accepting States ($F$):** $F = \{ q_{11} \}$. A string is accepted if and only if the machine halts in $q_{11}$ after consuming all symbols in $w$.
* **Trap / Dead State ($q_{\text{trap}}$):** Non-accepting universal sink state. For all $\sigma \in \Sigma$, $\delta(q_{\text{trap}}, \sigma) = q_{\text{trap}}$.

### Language & Regular Expression Equivalence

* **Regular Expression:** `[A-Z]{2}-[0-9]{4}-[0-9]{3}`
* **Fixed Token Length:** $|w| = 11$ symbols.

---

## DFA State Transition Table

The transition function $\delta : Q \times \Sigma \to Q$ governs machine execution across three domains: Category Prefix, Production Year, and Serial Sequence. Any symbol that deviates from the domain transition condition diverts execution to $q_{\text{trap}}$.

| Current State ($q$) | Domain | Valid Symbol ($\sigma$) | Next State ($\delta(q, \sigma)$) | Failure Condition ($\sigma_{\text{invalid}}$) | Next State ($\delta(q, \sigma_{\text{invalid}})$) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $q_0$ | Prefix (Char 1) | $[A\text{-}Z]$ | $q_1$ | $\sigma \notin [A\text{-}Z]$ | $q_{\text{trap}}$ |
| $q_1$ | Prefix (Char 2) | $[A\text{-}Z]$ | $q_2$ | $\sigma \notin [A\text{-}Z]$ | $q_{\text{trap}}$ |
| $q_2$ | Delimiter 1 | `'-'` | $q_3$ | $\sigma \ne \text{'-'}$ | $q_{\text{trap}}$ |
| $q_3$ | Year (Digit 1) | $[0\text{-}9]$ | $q_4$ | $\sigma \notin [0\text{-}9]$ | $q_{\text{trap}}$ |
| $q_4$ | Year (Digit 2) | $[0\text{-}9]$ | $q_5$ | $\sigma \notin [0\text{-}9]$ | $q_{\text{trap}}$ |
| $q_5$ | Year (Digit 3) | $[0\text{-}9]$ | $q_6$ | $\sigma \notin [0\text{-}9]$ | $q_{\text{trap}}$ |
| $q_6$ | Year (Digit 4) | $[0\text{-}9]$ | $q_7$ | $\sigma \notin [0\text{-}9]$ | $q_{\text{trap}}$ |
| $q_7$ | Delimiter 2 | `'-'` | $q_8$ | $\sigma \ne \text{'-'}$ | $q_{\text{trap}}$ |
| $q_8$ | Serial (Digit 1) | $[0\text{-}9]$ | $q_9$ | $\sigma \notin [0\text{-}9]$ | $q_{\text{trap}}$ |
| $q_9$ | Serial (Digit 2) | $[0\text{-}9]$ | $q_{10}$ | $\sigma \notin [0\text{-}9]$ | $q_{\text{trap}}$ |
| $q_{10}$ | Serial (Digit 3) | $[0\text{-}9]$ | $q_{11}$ | $\sigma \notin [0\text{-}9]$ | $q_{\text{trap}}$ |
| $q_{11}$ | Accepting / Halt | None (Input Complete) | - | Any character (Length overflow) | $q_{\text{trap}}$ |
| $q_{\text{trap}}$ | Dead / Sink State | None | - | $\forall \sigma \in \Sigma$ | $q_{\text{trap}}$ |

### Domain Prefix Mapping

| Prefix | Domain Category | Description |
| :---: | :--- | :--- |
| `IT` | IT Equipment | Enterprise workstations, rack servers, laptops |
| `EL` | Electronics | Power supplies, circuit boards, microcontrollers |
| `PR` | Peripherals | Displays, human interface devices, mechanical inputs |
| `NW` | Networking | Switches, routers, transceivers |
| `OF` | Office Hardware | Infrastructure assets, ergonomic workstations |

---

## Architecture & Design Decisions

* **Pure Client-Side Static Architecture:** Built using React 18, Vite, and Tailwind CSS without runtime backend or daemon dependencies.
* **Formal Sequential Computation:** Input strings are evaluated sequentially symbol-by-symbol against the transition function $\delta(q_i, \sigma)$. Regular expression literals (`/^[A-Z]$/`, `/^[0-9]$/`, `/^-$/`) are restricted to verifying character class membership for individual symbols at each state, preserving the formal step-by-step computational model.
* **Character Verification Tape Visualization:** A continuous, unified 11-cell horizontal read-tape dynamically renders machine transitions:
  * **Contiguous Cells:** 11 monospace character cells that display input symbols or dim placeholder dots (`·`).
  * **Sequential Sweep Animation:** A 45ms step-by-step read-head sweep visually tracks the automaton scanning the tape.
  * **Instant Visual Halting:** Invalid symbols divert the cell to a prominent rose highlight halting at $q_{\text{trap}}$ and graying out remaining cells.
  * **Aligned State & Domain Rows:** Resulting states ($q_1 \dots q_{11}$) and domain spans (`PREFIX`, `YEAR`, `SERIAL`) align directly under their respective cells.
* **Interactive Features & Persistence:**
  * **Audit History & Replay:** Logs validation attempts with timestamp, halting state, and verdict, allowing one-click replay.
  * **Inventory Catalog:** Product registration with automatic sample generation and synchronous `localStorage` persistence.
  * **Dark / Light Mode:** Built-in theme switcher with client-side preference caching.

---

## Project Directory Layout

```text
Product-Validator-2/
├── src/
│   ├── core/
│   │   ├── dfaEngine.js         # Formal 13-state DFA transition logic
│   │   └── dfaEngine.test.js    # Vitest suite (20 formal test vectors)
│   ├── services/
│   │   ├── storage.js           # Synchronous localStorage manager
│   │   └── storage.test.js      # LocalStorage CRUD test suite
│   ├── App.jsx                  # Main simulator UI, tape, and tables
│   ├── main.jsx                 # Vite React entry point
│   └── index.css                # Tailwind base & custom scrollbar styles
├── package.json
├── tailwind.config.js           # Custom monospace fonts and dimension tokens
├── vite.config.js
└── README.md
```

---

## Local Setup & Testing Instructions

### Prerequisites

* Node.js $\ge$ 18.0.0
* npm $\ge$ 9.0.0
* Git

### Repository Setup & IDE Initialization

```bash
# 1. Clone repository from GitHub
git clone https://github.com/uno-jerome/Product-Validator-2.git

# 2. Enter project directory
cd Product-Validator-2

```

### Installation & Execution

```bash
# Install dependencies
npm install

# Run local dev server
npm run dev

# Run formal test suite (20 vectors)
npm run test

# Build production static bundle
npm run build
```

---

## Test Cases (20 Formal Vectors)

The validation engine is verified against 20 formal test vectors defined in `src/core/dfaEngine.test.js`.

| Vector # | Input String ($w$) | Expected Verdict | Halting State | Classification / Failure Reason |
| :---: | :--- | :---: | :---: | :--- |
| 1 | `IT-2026-001` | Accepted | $q_{11}$ | Valid format (IT Equipment) |
| 2 | `IT-2024-892` | Accepted | $q_{11}$ | Valid format (IT Equipment) |
| 3 | `EL-2025-104` | Accepted | $q_{11}$ | Valid format (Electronics) |
| 4 | `EL-1999-000` | Accepted | $q_{11}$ | Valid format (Electronics) |
| 5 | `PR-2023-551` | Accepted | $q_{11}$ | Valid format (Peripherals) |
| 6 | `PR-2026-999` | Accepted | $q_{11}$ | Valid format (Peripherals) |
| 7 | `NW-2021-042` | Accepted | $q_{11}$ | Valid format (Networking) |
| 8 | `NW-2026-118` | Accepted | $q_{11}$ | Valid format (Networking) |
| 9 | `OF-2022-303` | Accepted | $q_{11}$ | Valid format (Office Hardware) |
| 10 | `OF-2026-015` | Accepted | $q_{11}$ | Valid format (Office Hardware) |
| 11 | `it-2026-001` | Rejected | $q_{\text{trap}}$ | Alphabet breach (`i` $\notin \Sigma$, lowercase) |
| 12 | `IT-202-0001` | Rejected | $q_{\text{trap}}$ | Premature delimiter (expected digit at $q_6$, encountered `-`) |
| 13 | `IT-2026001` | Rejected | $q_{\text{trap}}$ | Missing delimiter (expected delimiter at $q_7$, encountered `0`) |
| 14 | `I-2026-0001` | Rejected | $q_{\text{trap}}$ | Truncated prefix (expected letter at $q_1$, encountered `-`) |
| 15 | `ITT-2026-01` | Rejected | $q_{\text{trap}}$ | Prefix overflow (expected delimiter at $q_2$, encountered `T`) |
| 16 | `IT-2026-00A` | Rejected | $q_{\text{trap}}$ | Character class mismatch (expected digit at $q_{10}$, encountered `A`) |
| 17 | `NW_2026_001` | Rejected | $q_{\text{trap}}$ | Alphabet breach (`_` $\notin \Sigma$, invalid delimiter) |
| 18 | `PR-2026-` | Rejected | $q_8$ | Incomplete string ($ | w | = 8 < 11$, halts prior to $F$) |
| 19 | `IT-2026-0001` | Rejected | $q_{\text{trap}}$ | Length overflow ($ | w | = 12 > 11$, transition beyond $q_{11}$) |
| 20 | `""` | Rejected | $q_0$ | Empty string ($\epsilon \notin L$, halts at start state) |
