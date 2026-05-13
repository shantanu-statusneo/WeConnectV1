# Architecture Overview

## High-Level Overview

WeConnectV1 (WEC-Guardian POC) is a web-based platform that facilitates compliance verification and certificate issuance for companies, connecting buyers and assessors through AI-driven assessments, voice interactions, and blockchain anchoring. It leverages machine learning for document analysis, vision-based ID verification, and web search for company discovery, culminating in tamper-proof certificates stored on the blockchain. The system supports end-to-end workflows from company discovery to certificate verification, with admin tools for monitoring and revocation.

## Core Components

### Frontend (UI Layer)
- **Responsibilities:** Handles user interactions, displays progress through verification stages, and renders dynamic components like voice agents and file uploads.
- **Key Files:** `app/` directory with pages (e.g., `page.tsx`, `admin/page.tsx`, `buyer-portal/page.tsx`), components in `components/` (e.g., `VoiceConcierge.tsx`, `FileUpload.tsx`), and layout components in `components/layout/`.
- **Technologies:** Next.js App Router, React components, Tailwind CSS for styling.

### API Layer
- **Responsibilities:** Provides serverless endpoints for backend operations, processing requests from the frontend and orchestrating business logic.
- **Key Files:** `app/api/` subdirectories (e.g., `admin/`, `ai-assessment/`, `certificate/`, `compliance/`, `document-verify/`, `vision/`, `workflow/`), each containing route handlers.
- **Technologies:** Next.js API routes, handling HTTP requests and responses.

### Business Logic (Lib Layer)
- **Responsibilities:** Contains core domain logic, integrations with external services, and utility functions for AI processing, blockchain interactions, and data enrichment.
- **Key Files:** `lib/` directory with modules like `gemini.ts` (AI assessments), `blockchain.ts` (anchoring), `vision-gate.ts` (ID verification), `voice-agent/engine.ts` (voice interactions), `session-store.ts` (data persistence), and domain-specific logic in `lib/domains/` (e.g., `buyer-intelligence.ts`, `trust-report.ts`).
- **Technologies:** TypeScript modules, with integrations to Google Gemini, AWS Bedrock, and Viem for blockchain.

### Data Storage and Management
- **Responsibilities:** Manages session data, registry knowledge base, and certificate records; handles in-memory storage and external data fetching.
- **Key Files:** `lib/session-store.ts` (session management), `lib/registry-kb.json` (static company registry), `lib/store/` (domain stores like `buyer-catalog.ts`).
- **Technologies:** In-memory storage for sessions, JSON for registry data, with external web search and blockchain for dynamic data.

### External Services and Integrations
- **Responsibilities:** Interfaces with third-party APIs for AI, web search, and blockchain to enhance verification processes.
- **Key Integrations:** Google Gemini for AI-driven assessments and vision; AWS Bedrock for company discovery with web search; Base Sepolia blockchain for certificate anchoring via Viem.

## Data Flow

1. **User Initiation:** A user (buyer or assessor) accesses the frontend via pages like `/buyer-portal` or `/register`, initiating a session through UI interactions (e.g., voice input or file upload).
2. **Frontend Request:** The frontend sends HTTP requests to relevant API routes (e.g., `POST /api/ai-assessment/report` for generating assessment PDFs or `GET /api/certificate` for listing certificates).
3. **API Processing:** API routes parse requests, validate inputs, and invoke business logic functions from the `lib/` layer (e.g., calling `gemini.ts` for AI processing or `blockchain.ts` for anchoring).
4. **Business Logic Execution:** Core logic handles computations, external API calls (e.g., to Gemini for attestation or Bedrock for discovery), and data transformations. For blockchain anchoring, it prepares transactions and submits them based on configured modes (demo/auto/real).
5. **Data Persistence and Response:** Results are stored in the session store or external systems; API routes format responses and send them back to the frontend.
6. **UI Update and Completion:** Frontend receives data, updates the UI (e.g., progress steppers, certificate display), and guides the user through stages until completion. Public verification pages (e.g., `/verify/[certId]`) allow external checks of anchored certificates.

## Tech Stack

- **Programming Language:** TypeScript
- **Web Framework:** Next.js 16 (with React 19 for UI components)
- **Styling:** Tailwind CSS v4
- **AI and Machine Learning:** Google Generative AI (Gemini models for assessments, vision, and company extraction); AWS Bedrock (Claude for web-search enabled discovery)
- **Blockchain:** Viem library for Ethereum interactions on Base Sepolia testnet
- **PDF and Document Handling:** PDF-lib for generating assessment reports
- **Data Visualization:** Recharts for charts in admin analytics
- **Animations and UI Enhancements:** Framer Motion for smooth transitions; Lucide React for icons
- **Testing Framework:** Vitest for unit and integration tests
- **Deployment Platform:** Vercel (optimized for Next.js applications)
- **Other Libraries:** QRCode.react for QR code generation; clsx and tailwind-merge for conditional styling

## Design Decisions

- **Next.js App Router:** Selected for its built-in support for full-stack development, enabling seamless API routes for serverless backend functionality without separate server setup. This reduces complexity and improves performance for a monolithic web app.
- **Layered Architecture:** Adopted a clear separation of concerns with UI, API, and business logic layers to enhance maintainability, testability, and scalability. The `lib/` directory centralizes reusable logic, avoiding duplication across API routes.
- **AI Integration with Fallbacks:** Gemini is used for core AI tasks due to its flexibility and multimodal capabilities, with configurable fallbacks to handle quota limits and ensure reliability. Bedrock is integrated for company discovery to leverage web search, providing richer data than static registries alone.
- **Blockchain Anchoring Modes:** Implemented multiple modes (demo, auto, real) for anchoring certificates on Base Sepolia to support development workflows and gradual production rollout. Viem was chosen for its modern, type-safe Ethereum interactions, ensuring secure and verifiable certificate storage.
- **Component-Based UI with Tailwind:** React components promote reusability and modularity, while Tailwind CSS enables rapid, responsive design without extensive CSS files. This supports the dynamic, multi-stage user flows in the verification process.
- **Session-Based Workflow Management:** A stage-based session system (`SessionStage` enum) guides users through complex verification steps, improving user experience by providing clear progress indicators and handling retries for failed checks (e.g., vision ID).
- **In-Memory Data Storage:** Used for sessions and certificates in development/POC phase for simplicity, with plans for persistent storage (e.g., database) in production. External services handle dynamic data to keep the core app lightweight.</content>
<parameter name="filePath">/Users/shantanuaggarwal/WeConnectV1/ARCHITECTURE.md