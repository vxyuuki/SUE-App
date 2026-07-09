<h1 align="center">
  <img src="icon.ico" width="24" alt="SUE Logo">
  SUE (Show Up Everyday)
</h1>

<p align="center">
  <strong>An all-in-one offline productivity desktop application built with Electron.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="Vanilla JS" />
  <img src="https://img.shields.io/badge/GitHub_Primer-24292F?style=for-the-badge&logo=github&logoColor=white" alt="Primer CSS" />
</p>

## ✨ About The Project

**SUE (Show Up Everyday)** is a minimalist, privacy-first desktop application designed to help you stay focused and organize your knowledge. It combines a Pomodoro timer, a Notion-style block editor, and a Spaced-Repetition flashcard system into one seamless, GitHub-styled dark mode interface.

All data is stored **100% locally** on your machine. No internet connection required (except for fetching daily motivational quotes).

## 🚀 Features

- ⏱️ **Focus Timer (Pomodoro)**
  - Customizable focus sessions.
  - Auto-start timer mode for seamless flow between Focus and Break sessions.
  - Interactive "GitHub Contribution" style heatmap to track your daily focus streaks.
- 📝 **Notion-Style Notes Editor**
  - Block-based text editing (text, checkboxes, image embeds).
  - Customizable header covers and tags.
- 🗂️ **Spaced Repetition Flashcards**
  - Organize your learning materials into custom Folders (Decks).
  - Tinder-like swipe mechanics (Left for "Forgot", Right for "Remembered") for studying.
- 🎨 **Aesthetics & Motivation**
  - GitHub-inspired UI with toggleable Dark and Light mode themes.
  - Built-in library of 2000+ local offline motivational quotes.

## 🛠️ Installation & Setup

To run SUE locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vxyuuki/SUE-App.git
   cd SUE-App
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   # (And in another terminal window)
   npm run desktop:dev
   ```

4. **Build the Desktop Application (.exe):**
   ```bash
   npm run desktop:build-pack
   ```
   *The compiled `.exe` file will be available in the `dist-electron/SUE-win32-x64` folder.*

## 📂 Tech Stack

- **Framework:** Electron & Vite
- **UI & Styling:** Vanilla HTML/CSS, GitHub Primer CSS
- **Data Storage:** Local JSON Storage (`userData` directory)

---
<div align="center">
  Made with ❤️ by <a href="https://github.com/vxyuuki">Kiki (vxyuuki)</a>
</div>
