# SecureCodeX Platform

SecureCodeX is a cybersecurity learning platform that consists of two main components:

1. CTF Builder - A Content Management System (CMS) built with EJS for creating and managing CTF events
2. Treasure Hunt - An interactive browser game built with Phaser 3

## CTF Builder

A full-featured CTF (Capture The Flag) platform built with Node.js, Express, and EJS templating engine.

### Features

- User Authentication (Organizer/Hacker roles)
- Event Management
- Challenge Creation and Management
- Real-time Leaderboard
- Dynamic Scoring System
- File Upload/Download Support
- Responsive Design

### Tech Stack

- Frontend: EJS, CSS
- Backend: Node.js, Express
- Database: Firebase Firestore
- Authentication: Firebase Auth
- Sessions: express-session
- Security: bcryptjs

### Installation

1. Clone the repository:

```sh
git clone https://github.com/Karthikeyan1508/secure-code-x
```

2. Install dependencies:

```sh
npm install
```

3. Start the development server:

```sh
npm run dev
```

4. Build for production:

```sh
npm run build
```

## Treasure Hunt - Cybersecurity Awareness Game

A browser-based educational game built with Phaser 3 that teaches cybersecurity awareness through interactive gameplay.
Treasure Hunt is an interactive game where players explore different locations while learning important cybersecurity concepts like:

- Password security
- Public WiFi risks
- Safe online payment practices
- Personal information protection

### Game Features

- Multiple interactive locations:
  - Home
  - Cafe
  - Bank
- Time-based gameplay (10-minute limit)
- Point-based scoring system
- Interactive dialogues
- Real-world cybersecurity scenarios

### Tech Stack

- [Phaser 3](https://phaser.io/phaser3) - HTML5 Game Framework
- JavaScript (ES6+)
- Vite - Build tool and development server
- HTML5 & CSS3

### Installation

1. Clone the repository:

```sh
git clone https://github.com/Sunil-Hegde/TreasureHunt
```

2. Install dependencies:

```sh
npm install
```

3. Start the development server:

```sh
npm run dev
```

4. Build for production:

```sh
npm run build
```

### Game controls

- Arrow keys: Move character
- ENTER: Interact/Confirm
- ESC: Exit buildings/Cancel
- R: Restart game (when game over)
