# 🌌 WorkTracker PWA

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=blue" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
</div>

<br />

> **WorkTracker** is a sleek, fast, and completely private Progressive Web App (PWA) designed to track work shifts, monitor time, and precisely calculate salary. Tailored specifically for Polish labor regulations (supporting both **Umowa o Pracę** and **Umowa Zlecenie**).

---

## 📑 Table of Contents
- [✨ Key Features](#-key-features)
- [📸 Screenshots](#-screenshots)
- [🛠 Tech Stack](#-tech-stack)
- [🚀 Installation and Setup](#-installation-and-setup)
- [📦 Build and Deploy](#-build-and-deploy)
- [📱 How to Install on Phone (PWA)](#-how-to-install-on-phone-pwa)
- [📂 Project Structure](#-project-structure)
- [🛡 Security & Privacy](#-security--privacy)
- [📄 License](#-license)

---

## ✨ Key Features
ф
* ⏱ **Smart Shift Timer:** A beautiful neon interface with smooth animations to track your current shift, breaks, and progress towards the daily goal.
* 💰 **Precise Net/Gross Calculation:** Accurate calculations based on contract type (Zlecenie / O Pracę) and tax statuses (Standard >26, PIT-0 <26, Student <26).
* 🌙 **Automated Allowances:** Automatically calculates night shift premiums, holiday double pay (x2), and overtime (x1.5 / x2) according to the selected contract.
* 📊 **History & Archives:** View your work history organized neatly by month, with expandable details for every single shift.
* 🖨 **PDF Generation:** Generate and download professional PDF salary reports for any given month with one click.
* 🔒 **Absolute Privacy:** Your database is stored exclusively on your device (using IndexedDB). No clouds, no accounts needed.
* 💾 **Backup & Restore:** Easily export all your history and settings to a `.json` file and restore them on another device.
* 📱 **PWA Ready:** Installable on any smartphone or desktop. Works offline.

---

## 📸 Screenshots

<details>
  <summary><b>Click to expand</b></summary>

  | ⏱ Dashboard | 📊 History | ⚙️ Settings |
  | :---: | :---: | :---: |
  | ![Dashboard](https://github.com/user-attachments/assets/b3e5dca9-caba-4472-9148-aa82a279b0e1) | ![History](https://github.com/user-attachments/assets/f5c36fcb-4915-48c9-aa20-1c89c99d7bba) | ![Settings](https://github.com/user-attachments/assets/6e1ad8c6-d2c6-402b-9fcc-a9e304bb7f9d) |

</details>

---

## 🛠 Tech Stack

* **Frontend Framework:** React.js
* **Styling:** Tailwind CSS + custom gradients and blur effects (Glassmorphism)
* **Animations:** Framer Motion (page transitions, spring physics, complex SVG path animations)
* **Icons:** Lucide React
* **Build Tool:** Vite
* **Storage:** IndexedDB (via services layer)

---

## 🚀 Installation and Setup

To run the project locally, you will need Node.js installed.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/OwenSide/work-tracker-pwa.git
   cd finanse-manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

*The application will be available at `http://localhost:5173`.*

---

## 📦 Build and Deploy

The project is configured for static deployment (perfect for GitHub Pages).

**Build the project:**
```bash
npm run build
```

**Deploy (automated script)::**
```bash
npm run deploy
```

*This command will build the project and push the `dist` folder to the `gh-pages` branch.*

---

## 📱 How to Install on Phone (PWA)

The app does not require downloading from the App Store or Google Play.

**🍏 iOS (iPhone/iPad)**
1. Open the [Demo Link](https://owenside.github.io/work-tracker-pwa/) in **Safari**.
2. Tap the **"Share"** button (square with an upward arrow at the bottom).
3. Select **"Add to Home Screen"**.
4. The app will now work like a native application (without the browser address bar).

**🤖 Android**
1. Open the [Demo Link](https://owenside.github.io/work-tracker-pwa/) in **Chrome**.
2. Tap the menu (three dots) or wait for the pop-up banner.
3. Select **"Install App"** or **"Add to Home screen"**.

---

## 📂 Project Structure

<details>
<summary><b>Click to view file structure</b></summary>

```text
work-tracker-pwa/
├── public/                 # PWA icons, meta tags, and public assets
├── src/                    # Application source code
│   ├── assets/             # Static assets (images, SVGs)
│   ├── components/         # Reusable UI components
│   │   ├── BottomNav.jsx   # Bottom navigation bar
│   │   └── ProgressCircle.jsx # Animated neon progress ring
│   ├── pages/              # App screens
│   │   ├── Dashboard.jsx   # Main screen with smart timer
│   │   ├── History.jsx     # Shifts history and archives
│   │   └── Settings.jsx    # App configuration and backups
│   ├── services/           # Data layer logic
│   │   └── db.js           # IndexedDB storage logic
│   ├── styles/             # Stylesheets
│   │   ├── App.css         # Component-specific styles
│   │   └── index.css       # Global styles & Tailwind imports
│   ├── utils/              # Business logic & helpers
│   │   ├── pdfGenerator.js # PDF report generation
│   │   ├── salary.js       # Salary & tax calculation engine
│   │   └── utils.js        # Helper functions
│   ├── App.jsx             # Root component & state management
│   └── main.jsx            # React entry point
├── index.html              # Main HTML entry point
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── package.json            # Dependencies and npm scripts

```
</details>

---

## 🛡 Security & Privacy

This application is built with a "Privacy First" mindset. There is no backend, no telemetry, and no hidden data collection. Your financial history and shift data never leave your browser.

---

## 📄 License

This project is licensed under the GPLv3 License.

---