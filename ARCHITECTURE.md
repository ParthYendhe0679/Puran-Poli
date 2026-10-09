# Puran Poli — Architecture & Technical Specifications

> High-level engineering architecture, data flow pipelines, state machine models, and mathematical engines.

---

## 1. System Architecture Overview

The application is structured as a client-first, serverless architecture using Next.js 16 (App Router), React 19, and Tailwind CSS 4. All state management and computational engines execute deterministically within the browser environment.

```mermaid
graph TB
    subgraph Client["Client Application (Next.js 16 + React 19)"]
        UI["UI Layer (Tailwind CSS 4 + Motion + Phosphor Icons)"]
        AppShell["AppShell & Route Handlers"]
        UI --> AppShell
    end

    subgraph StoreLayer["State & Persistence Layer"]
        ZustandStore["Zustand Store (demo-store.ts)"]
        LocalStorage[("Browser LocalStorage")]
        AppShell --> ZustandStore
        ZustandStore <--> LocalStorage
    end

    subgraph EngineLayer["Mathematical & Business Engines (src/lib/calc/*)"]
        VotingEngine["Voting Engine (voting.ts)"]
        HeatmapEngine["Availability Engine (availability.ts)"]
        BudgetEngine["Budget Engine (budget.ts)"]
        PaymentEngine["Payment & Refund Engine (payments.ts)"]
        BillEngine["Bill Split Engine (bill.ts)"]
        DebtEngine["Debt Settlement Engine (settle.ts)"]
    end

    ZustandStore --> VotingEngine
    ZustandStore --> HeatmapEngine
    ZustandStore --> BudgetEngine
    ZustandStore --> PaymentEngine
    ZustandStore --> BillEngine
    ZustandStore --> DebtEngine

    subgraph IntegrationLayer["Integrations & Media Utilities (src/lib/*)"]
        ChatParser["WhatsApp Chat Parser (chat-parser.ts)"]
        SharingService["UPI, QR & Calendar Sharing (share.ts)"]
        VideoService["HTML5 Canvas + MediaRecorder (SummaryVideo.tsx)"]
    end

    AppShell --> ChatParser
    AppShell --> SharingService
    AppShell --> VideoService
```

---

## 2. End-to-End User Flow & Lifecycle

```mermaid
flowchart LR
    subgraph S1["1. Propose"]
        A["Chat Import / Manual Input"] --> B["Curate Ideas"]
    end

    subgraph S2["2. Decide"]
        B --> C["Availability Heatmap"]
        B --> D["Budget Bounds"]
        B --> E["Ranked Voting"]
        C & D & E --> F["Pick Winner (5% Tie-breaker)"]
    end

    subgraph S3["3. Commit"]
        F --> G["Dynamic Share Allocation"]
        G --> H["Advance Payment (UPI Simulation)"]
        H --> I["Auto-Confirm Quorum"]
    end

    subgraph S4["4. Event Day"]
        I --> J["Live Schedule & Check-in"]
        J --> K["Photo Capture"]
    end

    subgraph S5["5. Settle & Recap"]
        K --> L["Itemized Bill Split"]
        L --> M["Min-Flow Cash Settlement"]
        M --> N["Canvas Video Recap"]
    end
```

---

## 3. Plan State Lifecycle Machine

```mermaid
stateDiagram-v2
    [*] --> voting: Plan Initialization
    voting --> collecting: Winner Selected / Voting Finalized
    collecting --> confirmed: Advance Payment Quorum Reached
    collecting --> not_confirmed: Deadline Elapsed (No Quorum)
    confirmed --> event_day: Event Day Active
    event_day --> settling: Post-Event Bill Uploaded
    settling --> completed: All Transfers Completed
    completed --> [*]
    not_confirmed --> [*]
```

---

## 4. Computational Engines & Algorithms

### 4.1 Fair Voting Engine (`src/lib/calc/voting.ts`)
- **Blind Voting**: Ballots remain hidden until voter submission or voting deadline.
- **Scoring Weights**:
  - `Love it`: +2 points
  - `Okay`: +1 point
  - `No`: 0 points
  - `Veto`: Disqualifies the idea if threshold is reached.
- **5% Tie-Breaker**: If top two ideas are within 5% score margin, the tie-breaker checks budget satisfaction, required member consensus, and organizer weight.

### 4.2 Dynamic Share & Refund Calculus (`src/lib/calc/payments.ts`)
- Target total amount $T$ divided dynamically across $N$ committing members:
  $$\text{Share} = \lceil T / N \rceil$$
- As additional members commit ($N \to N+1$), the per-person share decreases:
  $$\text{Refund per existing member} = \text{Share}_N - \text{Share}_{N+1}$$
- Excess funds are automatically returned as credits.

### 4.3 Minimum Cash Flow Settlement (`src/lib/calc/settle.ts`)
- Computes net balance $B_i$ for each person $i$:
  $$B_i = \text{Total Paid}_i - \text{Total Consumed}_i$$
- Applies the greedy debt-simplification algorithm to settle all balances in at most $N-1$ transactions.
- Produces direct 1-click UPI links (`upi://pay?pa=...&am=...`) and instant QR codes.
