# Deterministic Finite Automaton (DFA) - Product Code Validator

A formal deterministic finite automaton simulator and inventory product validator recognizing the regular language:

$$L = \{ c_1 c_2 - y_1 y_2 y_3 y_4 - s_1 s_2 s_3 \mid c_i \in [A\text{-}Z], \, y_i, s_i \in [0\text{-}9] \}$$

---

## Table of Contents

* [Formal Automata Specification](#formal-automata-specification)
  * [Alphabet (Σ)](#alphabet)
  * [States (Q)](#states)
  * [Language & Regular Expression Equivalence](#language--regular-expression-equivalence)
* [DFA State Transition Table](#dfa-state-transition-table)
  * [Domain Prefix Mapping](#domain-prefix-mapping)
* [Architecture & Design Decisions](#architecture--design-decisions)
* [Project Directory Layout](#project-directory-layout)
* [Local Setup & Testing Instructions](#local-setup--testing-instructions)
  * [Prerequisites](#prerequisites)
  * [Repository Setup & IDE Initialization](#repository-setup--ide-initialization)
  * [Installation & Execution](#installation--execution)
* [Test Cases](#test-cases)

---

## Formal Automata Specification

The machine is defined as a 5-tuple Deterministic Finite Automaton:

$$M = (Q, \Sigma, \delta, q_0, F)$$

<a id="alphabet"></a>

### Alphabet (Σ)

$$\Sigma = \Sigma_{\text{alpha}} \cup \Sigma_{\text{digit}} \cup \Sigma_{\text{delim}}$$

* **Letters ($\Sigma_{\text{alpha}}$):** $\{ A, B, C, \dots, Z \}$ ($|\Sigma_{\text{alpha}}| = 26$)
* **Digits ($\Sigma_{\text{digit}}$):** $\{ 0, 1, 2, \dots, 9 \}$ ($|\Sigma_{\text{digit}}| = 10$)
* **Delimiter ($\Sigma_{\text{delim}}$):** $\{ - \}$ ($|\Sigma_{\text{delim}}| = 1$)
* **Total alphabet size:** $|\Sigma| = 26 + 10 + 1 = 37$

Any input character $c \notin \Sigma$ is an alphabet violation and diverts execution immediately to the trap state $q_{\text{trap}}$.

<a id="states"></a>

### States (Q)

$$Q = \{ q_0, q_1, q_2, q_3, q_4, q_5, q_6, q_7, q_8, q_9, q_{10}, q_{11}, q_{\text{trap}} \} \quad (|Q| = 13)$$

* **Start State ($q_0$):** Initial state prior to consuming any input symbol.
* **Accepting States ($F$):** $F = \{ q_{11} \}$. A string is accepted if and only if the machine halts in $q_{11}$ after consuming all 11 symbols.
* **Trap / Dead State ($q_{\text{trap}}$):** Non-accepting universal sink state. For all $\sigma \in \Sigma$, $\delta(q_{\text{trap}}, \sigma) = q_{\text{trap}}$.

### Language & Regular Expression Equivalence

* **Regular Expression:** `[A-Z]{2}-[0-9]{4}-[0-9]{3}`
* **Fixed Token Length:** $|w| = 11$ symbols.

---

## DFA State Transition Table

The transition function $\delta : Q \times \Sigma \to Q$ governs machine execution across three domains: Category Prefix, Production Year, and Serial Sequence. Any symbol that deviates from the domain transition condition diverts execution to `q_trap`.

| Current State | Domain | Valid Symbol (σ) | Next State | Failure Condition | Failure State |
| :---: | :--- | :---: | :---: | :--- | :---: |
| `q0` | Prefix (Char 1) | `[A-Z]` | `q1` | Symbol ∉ `[A-Z]` | `q_trap` |
| `q1` | Prefix (Char 2) | `[A-Z]` | `q2` | Symbol ∉ `[A-Z]` | `q_trap` |
| `q2` | Delimiter 1 | `'-'` | `q3` | Symbol ≠ `'-'` | `q_trap` |
| `q3` | Year (Digit 1) | `[0-9]` | `q4` | Symbol ∉ `[0-9]` | `q_trap` |
| `q4` | Year (Digit 2) | `[0-9]` | `q5` | Symbol ∉ `[0-9]` | `q_trap` |
| `q5` | Year (Digit 3) | `[0-9]` | `q6` | Symbol ∉ `[0-9]` | `q_trap` |
| `q6` | Year (Digit 4) | `[0-9]` | `q7` | Symbol ∉ `[0-9]` | `q_trap` |
| `q7` | Delimiter 2 | `'-'` | `q8` | Symbol ≠ `'-'` | `q_trap` |
| `q8` | Serial (Digit 1) | `[0-9]` | `q9` | Symbol ∉ `[0-9]` | `q_trap` |
| `q9` | Serial (Digit 2) | `[0-9]` | `q10` | Symbol ∉ `[0-9]` | `q_trap` |
| `q10` | Serial (Digit 3) | `[0-9]` | `q11` | Symbol ∉ `[0-9]` | `q_trap` |
| `q11` | Accepting / Halt | None (Complete) | — | Any character (Length overflow) | `q_trap` |
| `q_trap` | Dead / Sink State | None | — | Any input symbol | `q_trap` |

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
* **Formal Sequential Computation:** Input strings are evaluated sequentially symbol-by-symbol against the transition function $\delta(q_i, \sigma)$. Character checks (`^[A-Z]`, `^[0-9]`, `^-`) are strictly restricted to verifying character class membership for individual symbols at each state, preserving the formal step-by-step computational model without regex validation shortcuts.
* **Character Verification Tape Visualization:** A continuous, unified 11-cell horizontal read-tape dynamically renders machine transitions:
  * **Contiguous Cells:** 11 monospace character cells that display input symbols or dim placeholder dots (`·`).
  * **Sequential Sweep Animation:** A 45ms step-by-step sweep visually tracks the automaton scanning the tape.
  * **Instant Visual Halting:** Invalid symbols divert the cell to a prominent rose highlight halting at `q_trap` and graying out remaining cells.
  * **Aligned State & Domain Rows:** Resulting states (`q1` through `q11`) and domain spans (`PREFIX`, `YEAR`, `SERIAL`) align directly under their respective cells.
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

* Node.js >= 18.0.0
* npm >= 9.0.0
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

## Test Cases

The validation engine is verified with automated tests in `src/core/dfaEngine.test.js` (`npm run test`). Below are the primary representative cases:

| Input String (`w`) | Expected Verdict | Halting State | Classification / Case |
| :--- | :---: | :---: | :--- |
| `IT-2026-001` | **Accepted** | `q11` | Valid format (IT Equipment) |
| `EL-2025-104` | **Accepted** | `q11` | Valid format (Electronics category) |
| `it-2026-001` | **Rejected** | `q_trap` | Alphabet breach (lowercase `i` ∉ Σ) |
| `IT-202-001` | **Rejected** | `q_trap` | Year error (expected 4 digits, got 3) |
| `IT2026-001` | **Rejected** | `q_trap` | Delimiter error (missing hyphen `-`) |
| `PR-2026-` | **Rejected** | `q8` | Incomplete string (halts before accepting state `q11`) |
| `IT-2026-0001` | **Rejected** | `q_trap` | Length overflow (12 characters, exceeds 11) |
| `""` | **Rejected** | `q0` | Empty string (ε ∉ L, halts at start state `q0`) |
