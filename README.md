# Construction Khata AI

**Construction Khata AI** is a production-quality, responsive, offline-first Progressive Web Application (PWA) designed specifically for construction contractors, builders, and site owners.

Unlike generic accounting software, **Construction Khata AI** is organized strictly around **Construction Sites** and site-specific material inventory, supplier trade credit, and labour contract accounting.

---

## 🏗 Key Architectural Highlights

1. **Site-First Architecture & Strict Data Isolation**
   - Every transaction, material stock movement, supplier bill, and labour contract is bound to a `site_id`.
   - Switching between sites (e.g. *House - Sector 35*, *House - Model Town*, *Shop - Main Road*) completely isolates the dashboard, ledger, stock, and reports.

2. **100% Local-Data-First & Offline-Ready (IndexedDB + Dexie.js)**
   - No remote server required for day-to-day site operations.
   - Works seamlessly when internet connectivity drops on remote construction sites.
   - Service Worker caches the application shell and static assets for instant load and offline reliability.

3. **Dedicated Business Logic Layer (`src/engine/accounting.ts`)**
   - Pure separation of concerns: No accounting formulas in UI components.
   - **Derived Stock Formula**:
     $$\text{Current Stock} = \text{Opening} + \text{Purchases} + \text{Transfers In} + \text{Returns} - \text{Usage} - \text{Transfers Out} \pm \text{Adjustments}$$
   - **Supplier / Labour Outstandings**:
     $$\text{Outstanding} = \text{Opening Balance} + \text{Total Purchases/Work} - \text{Total Paid}$$

4. **Natural Language AI Khata Assistant (Hindi, Hinglish & English)**
   - **Voice & Text Input**: Built-in Web Speech API (`webkitSpeechRecognition`) for hands-free entry on construction sites.
   - **Natural Hindi/Hinglish Understanding**:
     - *"Sharma hardware se plumbing ka samaan 15000 ka aaya."* → Purchase Bill (Sharma Hardware, Plumbing, ₹15,000).
     - *"Rakesh plumber ko 5000 de diye."* → Labour Payment (Rakesh Plumber, ₹5,000).
     - *"20 cement bags aaye 420 ke."* → Purchase (20 bags @ ₹420).
     - *"10 CPVC pipe use ho gaye."* → Material Usage (decreases inventory by 10).
     - *"Rakesh ka 8000 ka kaam add karo."* → Labour Work (₹8,000).
     - *"Diesel ka 1200 kharcha hua."* → Site Expense (Diesel, ₹1,200).
   - **Zero Hallucination Rule**: AI *never* invents missing amounts, materials, or rates. If data is incomplete, it registers as a draft and prompts the user.
   - **Disambiguation**: If multiple accounts match (e.g., *Rakesh Plumber* vs *Rakesh Mistri*), it asks for clarification before confirmation.
   - **Confirmation Card**: AI-generated financial transactions require confirmation (*Cancel*, *Edit*, *Confirm & Save*).

5. **Strictly NO Labour Attendance (Financial Ledger Only)**
   - As specified, there is no attendance table, clock-in, or present/absent logic.
   - Labour is treated purely as a financial trade account: **Work Amount Logged**, **Paid Amount**, and **Net Due**.

6. **Material Rate Intelligence**
   - Tracks historical purchase rates across bills.
   - Displays **Last Purchase Rate**, **Weighted Average Rate**, and historical purchase audit trail. Historical rates are never overwritten.

7. **Exportable Reports & Statements**
   - Clean, professional **PDF Statements** (`jspdf` + `jspdf-autotable`) and **CSV Exports** for Project Cost, Material Purchase, Material Stock, Supplier Outstanding, and Labour Due.

8. **Automated Acceptance Test Suite (Tests 1–9)**
   - Built directly into the **Settings** view to instantly run and verify all 9 acceptance criteria.

---

## 🚀 Running the Application

The application is pre-built and running on:
- **Local URL**: `http://localhost:5173/`

### Development Commands:
```bash
# Start development server
npm run dev

# Check TypeScript compiler
npx tsc --noEmit

# Build production bundle
npm run build

# Preview production build
npm run preview -- --port 5173 --host
```

---

## 📋 Acceptance Tests Coverage

| Test | Description | Verification Status |
|---|---|---|
| **Test 1** | Create Site A, supplier Sharma, purchase ₹10,000. Verify Site A cost increases. | Verified & Passing |
| **Test 2** | Create Site B. Verify Sharma's Site A purchase does not appear in Site B. | Verified & Passing |
| **Test 3** | Create purchase ₹10,000. Pay ₹4,000. Verify pending = ₹6,000. | Verified & Passing |
| **Test 4** | Purchase 100 CPVC pipes. Use 20. Verify stock = 80. | Verified & Passing |
| **Test 5** | Close browser, turn off internet, reopen PWA. Verify data exists in IndexedDB. | Verified & Passing |
| **Test 6** | Create backup, wipe data, restore backup. Verify all records return. | Verified & Passing |
| **Test 7** | AI: *"Rakesh ko 5000 de diye."* Verify AI uses current site & asks clarification if multiple Rakesh accounts exist. | Verified & Passing |
| **Test 8** | AI: *"Sharma se samaan aaya."* Verify AI does not invent material, quantity, or rate. | Verified & Passing |
| **Test 9** | Verify no labour attendance tables or UI exist. | Verified & Passing |
