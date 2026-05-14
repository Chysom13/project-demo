# MTU One ID Portal — Project Walkthrough

## Project Overview

The **MTU One ID Portal** is a premium, self-service student identity platform built for Mountain Top University. It enables students to manage their official digital credentials, process replacement fees, and download print-ready ID cards through a sophisticated, high-performance interface.

---

## Authentication & Modern Interface

The application features a **professional dark-mode aesthetic** designed for high contrast and modern usability.

### Unified Auth Experience
- **Split-Screen Layout**: A symmetrical 50/50 design featuring institutional branding on the left and interactive forms on the right.
- **Dynamic Navigation**: A context-aware Navbar that adapts based on the user's state (Login/Signup vs. ID Management).
- **Smooth Transitions**: Integrated micro-animations for page entries and state changes.

---

## Student Workflow

### Step 1: Secure Access
Students log in using their matriculation number and unique password. The system verifies their status against the Supabase real-time database.

### Step 2: Payment Processing (Replacement/Fine Flow)
If a student requires an ID replacement or has outstanding fees:
- **Solo Payment Page**: A dedicated, full-screen payment interface handles the transaction simulation.
- **Automated Logging**: Successful transactions are immediately logged to the `id_replacements` table, unlocking the digital ID portal.
- **Instant Access**: Upon payment, students are automatically routed to their personalized dashboard.

### Step 3: ID & Receipt Management (`/card/:id`)
The student portal acts as a central hub for all credentials.
- **Digital ID View**: Features a high-fidelity **3D interactive card**. Students can click to flip between the front and back faces.
- **Receipt View**: Students can toggle between their Digital ID and their official Payment Receipt within the same workspace.

---

## The Digital ID Card Design

The ID card has been redesigned with a **Premium Institutional Aesthetic**:
- **Front Face**:
    - **Header**: Solid `#12bca2` primary color background for high visibility.
    - **Body**: Clean light-blue to white gradient with high-resolution student photo.
    - **Security**: Subtle holographic "AUTHENTIC" ribbon and watermark accents.
- **Back Face**:
    - **Design**: Clean white layout with a realistic magnetic stripe at the top.
    - **Centered QR Code**: Centrally aligned verification code for rapid scanning.
    - **Instructions**: Neatly organized return instructions and expiry details.

---

## Technical Highlights & Print Logic

The portal employs a sophisticated PDF generation system to ensure physical print accuracy.

| Feature | Implementation |
|---|---|
| **3D Engine** | Framer Motion & CSS `preserve-3d` for interactive card flipping. |
| **PDF Generation** | `react-to-pdf` with hardware-accurate CR80 (85.6mm x 54mm) scaling for cards. |
| **Dual Print Hooks** | Separate hooks for ID and Receipt generation to ensure perfect A4 (receipt) vs CR80 (ID) formatting. |
| **Verification** | `qrcode.react` generating deep-links to the institutional verification portal. |
| **Database** | Supabase PostgreSQL with real-time auth and storage. |

### PDF Accuracy
Because 3D CSS transforms do not translate directly to PDF, the system renders **invisible 2D templates** strictly for the printer. This ensures that the downloaded file is a flat, high-resolution replica of the digital card, ready for any PVC card printer.
