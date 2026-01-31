# AleoCal - Zero-Knowledge Calendar Scheduling

> Find the perfect meeting time without revealing your schedule

<img width="1584" height="396" alt="ALEOCAL-BANNER-modified" src="https://github.com/user-attachments/assets/fb89ac84-c1b5-49cb-ad7b-e573bb023eb5" />


[Project Overview](#1-project-overview) • [Demo Walkthrough](#3-demo-walkthrough) • [Technical Documentation](#4-technical-documentation) • [Installation & Setup](#5-installation--setup) • [Privacy & Security](#6-privacy--security) • [Limitations](#7-current-limitations) • [Roadmap](#8-roadmap)


## 1. Project Overview

### What is AleoCal?

AleoCal is a **zero-knowledge calendar scheduling application** built on the Aleo blockchain. It enables two parties to find common available meeting times without revealing their full calendars to each other.

### The Problem

Consider two parties who want to meet in the near future. The very first problem they face is simple but painful: **finding a common time when both are available.**

Traditional calendar scheduling tools like Calendly, Doodle, or Google Calendar require users to:

- Share their entire availability publicly
- Trust third-party servers with sensitive schedule data
- Reveal work patterns, busy times, and availability to strangers

**This is a privacy nightmare.** Your calendar reveals:

- When you're in meetings (busy/important)
- When you're free (potentially vulnerable)
- Work patterns and habits
- Personal appointments and commitments
- Lunch breaks and daily routines

The alternative is the classic hit-and-trial approach: "Are you free at 3?" "No." "How about 4?" "Still no." This process is frustrating, inefficient, and still leaks partial information about your schedule.

### Our Solution

AleoCal uses **Zero-Knowledge Proofs (ZKPs)** and Aleo's privacy-preserving computation tools to privately calculate the intersection of two calendars and find a common meeting time.

Technically, this operation is known as **Private Set Intersection (PSI)**.

```
Host Calendar:    [2, 0, 3, 0, 1, 0, 4, 0]  (preference scores 0-4)
Guest Calendar:   [1, 0, 2, 0, 3, 0, 2, 0]  (preference scores 0-4)
                          ↓
              ZK Computation (multiplication)
                          ↓
Intersection:     [2, 0, 6, 0, 3, 0, 8, 0]  (combined scores)
                          ↓
Result:           Best slot = 6 (4pm-5pm with score 8)
```

**Only the best meeting time is revealed** - not the underlying calendars!

### Why Privacy Matters

| Traditional Tools | AleoCal |
|------------------|----------|
| Full calendar visible to organizer | Only intersection revealed |
| Server stores all availability data | No central server sees calendars |
| Third parties can analyze patterns | Cryptographic privacy guarantees |
| Trust required in service provider | Trustless ZK verification |

### Target Users

1. **Enterprise Teams** - Sensitive internal meetings, M&A discussions
2. **Healthcare** - Doctor-patient scheduling without revealing other appointments
3. **Legal** - Attorney-client meetings with confidentiality requirements
4. **Executive Assistants** - Scheduling for C-level executives
5. **Privacy-Conscious Individuals** - Anyone who values schedule privacy

### Market Opportunity

- Calendar scheduling market: $500M+ annually
- Enterprise privacy software: $15B+ market
- Growing regulatory pressure (GDPR, CCPA) driving privacy adoption

---

## 2. How It Works

### Privacy-Preserving Intersection Algorithm

```
Input:  A = [a₀, a₁, ..., a₇]  (Host preferences, 0-4)
        B = [b₀, b₁, ..., b₇]  (Guest preferences, 0-4)

Compute: C[i] = A[i] × B[i]    (Element-wise multiplication)

Output:  best_slot = argmax(C)  (Index of maximum value)
         best_score = max(C)    (Maximum value)
         valid = (best_score > 0)
```

**Why multiplication?**

- If either party is unavailable (0), product is 0
- Higher preferences on both sides = higher score
- Only the final result (best slot) is revealed

### Data Flow

```
1. Host creates event
   └─> Generates unique event code (address:field)
   └─> Registers with ZK Server via WebSocket

2. Guest joins event
   └─> Connects to ZK Server with event code
   └─> Server links host and guest sockets

3. Both parties submit calendars
   └─> Local ZK proof generation (or simulation)
   └─> Calendar slots sent via encrypted channel

4. Host computes intersection
   └─> Multiplication of preference values
   └─> argmax to find best slot
   └─> Result sent to both parties

5. Result displayed
   └─> Only best time slot revealed
   └─> Full calendars remain private
```

---

## 3. Demo Walkthrough

### Prerequisites

- [Leo Wallet](https://leo.app) browser extension installed
- Connection to Aleo Testnet Beta
- Two browser profiles (for testing both host and guest)

### Host Flow

1. **Connect Wallet** - Click connect and approve the Leo Wallet popup
2. **Create Event** - Click "Create Event" button
3. **Select Availability** - Click on time slots to set preference (1-4 scale)
   - Higher number = more preferred
   - X = unavailable (0)
4. **Share Code** - Copy the generated private event code and share with the guest

### Guest Flow

1. **Connect Wallet** - Use a different Aleo account than the host
2. **Join Event** - Paste the private event code received from the host
3. **Select Availability** - Choose available time slots (same 1-4 preference scale)
4. **Submit** - Confirm your availability selection

### Finding Common Time

1. **Host Initiates** - Click "Find Common Time"
2. **ZK Computation** - AleoCal runs Private Set Intersection on Aleo
3. **Result Revealed** - Both parties see the mutually available time slot
4. **Calendar Integration** - Block the slot on your Google Calendar

**No manual coordination. No over-sharing. Just the final result.**

---

## 4. Technical Documentation

### Repository Structure

**Frontend:** https://github.com/Mayur7685/aleocal

**Backend/Server:** https://github.com/Mayur7685/aleo-zk-server

```
aleo-aleocal/
├── aleocal/                    # Frontend React application
│   ├── src/
│   │   ├── aleo/               # Aleo SDK integration
│   │   │   ├── aleoConfig.ts   # Network configuration
│   │   │   ├── testnetClient.ts # SDK wrapper
│   │   │   ├── createCalendar.ts # Calendar creation logic
│   │   │   ├── computeIntersection.ts # ZK intersection
│   │   │   └── mockAleoSDK.ts  # Development mock
│   │   ├── components/         # React components
│   │   │   ├── ConnectWallet.tsx
│   │   │   ├── AddParticipants.tsx
│   │   │   ├── Calender.tsx
│   │   │   └── Results.tsx
│   │   ├── signalling/         # WebSocket signaling
│   │   └── App.tsx             # Main application
│   ├── package.json
│   └── vite.config.ts          # Vite + WASM configuration
│
├── zk-server/                   # ZK Signaling Server
│   ├── server.js               # Express + Socket.io
│   └── package.json
│
├── aleo/                        # Leo Smart Contracts
│   └── aleocal/
│       ├── src/
│       │   └── main.leo        # Main contract
│       ├── program.json
│       └── README.md
│
└── README.md                    # This file
```

### Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐
│   Host Browser  │     │  Guest Browser  │
│  (Leo Wallet)   │     │  (Leo Wallet)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │    WebSocket/HTTP     │
         └───────────┬───────────┘
                     │
              ┌──────┴──────┐
              │  ZK Server  │
              │  (Socket.io)│
              └──────┬──────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────┴────┐           ┌─────┴─────┐
    │  Aleo   │           │   Aleo    │
    │  WASM   │           │  Testnet  │
    │  Local  │           │  (future) │
    └─────────┘           └───────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Blockchain | Aleo | Privacy-preserving smart contracts |
| Smart Contract | Leo | ZK program language |
| Frontend | React + TypeScript | User interface |
| Bundler | Vite | Fast development, WASM support |
| Wallet | Leo Wallet | Aleo account management |
| SDK | @provablehq/sdk | ZK proof generation |
| Signaling | Socket.io | Real-time calendar exchange |
| Styling | Chakra UI | Component library |

### Smart Contract

The Leo smart contract is designed for Aleo Testnet:

```leo
program aleocal.aleo {
    // Calendar record - encrypted on-chain
    record Calendar {
        owner: address,
        day: DaySlots,
        calendar_id: field,
    }

    // Meeting result - only reveals best slot
    record MeetingResult {
        owner: address,
        meeting_id: field,
        best_slot: u8,
        best_score: u8,
        valid: bool,
    }

    // Create encrypted calendar
    transition create_calendar(...) -> Calendar

    // Compute intersection privately
    transition compute_intersection_direct(...) -> (Calendar, MeetingResult)
}
```

---

## 5. Installation & Setup

### Prerequisites

- Node.js 18+
- Leo Wallet browser extension
- Aleo account (Testnet Beta)

### Installation

```bash
# Clone frontend repository
git clone https://github.com/Mayur7685/aleocal.git
cd aleocal
npm install

# Clone backend repository (in a separate directory)
git clone https://github.com/Mayur7685/aleo-zk-server.git
cd aleo-zk-server
npm install
```

### Running the Application

**Terminal 1 - ZK Server:**
```bash
cd aleo-zk-server
npm start
# Server runs on http://localhost:3030
```

**Terminal 2 - Frontend:**
```bash
cd aleocal
npm run dev
# App runs on http://localhost:3006
```

### Testing with Two Users

1. Open http://localhost:3006 in Chrome Profile 1
2. Open http://localhost:3006 in Chrome Profile 2
3. Both connect Leo Wallet with different accounts
4. Profile 1: Create Event → Copy code
5. Profile 2: Paste code → Join Event
6. Both: Select availability → Submit
7. Profile 1: Click "Find Common Time"
8. Both see the result!

---

## 6. Privacy & Security

### What is Private?

| Data | Private? | Notes |
|------|----------|-------|
| Individual time slot preferences | ✅ Yes | Never revealed |
| Full calendar availability | ✅ Yes | Never shared |
| Aleo wallet address | ⚠️ Pseudonymous | On-chain identity |
| Best meeting time | ❌ No | Intentionally revealed |
| Event participation | ⚠️ Partial | Parties know each other |

### Cryptographic Guarantees

1. **Zero-Knowledge Proofs**: Calendar intersection computed without revealing inputs
2. **Record Encryption**: Aleo records are encrypted to owner's view key
3. **Local Execution**: ZK proofs generated client-side (no server sees data)

### Security Considerations

1. **No Server Storage**: ZK server only forwards messages, never stores calendars
2. **Client-Side Proofs**: ZK proofs generated in browser WASM
3. **Wallet Authentication**: Leo Wallet provides cryptographic identity
4. **Event Codes**: Cryptographically random, hard to guess

---

## 7. Current Limitations

| Limitation | Description |
|------------|-------------|
| **Two participants only** | Frontend currently supports 2 users, though backend is designed for multi-party |
| **Single-day scheduling** | Meetings can only be scheduled one day in advance |
| **Computation limits** | Multi-day scheduling requires larger computations that currently exceed limits |
| **Manual event codes** | Users must manually copy/paste event codes |

---

## 8. Roadmap

- [ ] Replace manual event codes with shareable links (connect wallet and join instantly)
- [ ] Improved UX for availability selection
- [ ] Multi-day scheduling with optimized computation
- [ ] Multi-party scheduling (3+ participants)
- [ ] Calendar imports from existing providers (iCal, Google Calendar)
- [ ] Deploy to Aleo Mainnet
- [ ] Browser extensions
- [ ] Enterprise SSO integration

---

## 9. Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- Built for [Aleo Privacy Buildathon](https://app.akindo.io/wave-hacks/gXdXJvJXxTJKBELvo)
- Powered by [Leo Language](https://leo-lang.org)
- UI components from [Chakra UI](https://chakra-ui.com)

---

## Links

- **Frontend Repository:** https://github.com/Mayur7685/aleocal
- **Backend Repository:** https://github.com/Mayur7685/aleo-zk-server
- **Aleo Documentation:** https://developer.aleo.org
- **Leo Language:** https://leo-lang.org

---

**AleoCal** - *Zero-knowledge scheduling for the privacy era.*
