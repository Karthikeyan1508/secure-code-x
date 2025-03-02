# CyberISE - A 12-Hour CTF Challenge

## Overview

**CyberISE** is a web application designed to host Capture The Flag (CTF) challenges, providing an interactive platform for users to engage in cybersecurity exercises. The application is built using Node.js and Express.js, with Firebase integration for data storage and management.

## Features

- **User Authentication**: Secure user registration and login functionality.
- **Challenge Management**: Create, edit, and delete CTF challenges.
- **Leaderboard**: Real-time tracking of user scores and rankings.
- **Responsive Design**: Accessible on various devices with a responsive user interface.

## Technologies Used

- **Node.js**: JavaScript runtime for server-side development.
- **Express.js**: Web application framework for Node.js.
- **Firebase**: Backend platform for database and authentication services.
- **EJS (Embedded JavaScript)**: Templating engine for generating HTML markup.
- **CSS**: Styling of the user interface.

## Installation

To set up the project locally, follow these steps:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/oevxlmo/ctf-ise.git
   cd ctf-ise
   ```

2. **Install dependencies**:

   Ensure you have [Node.js](https://nodejs.org/) installed. Then, run:

   ```bash
   npm install
   ```

3. **Configure Firebase**:

   - Set up a Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Enable Firestore and Authentication services.
   - Obtain your Firebase configuration and update the Firebase initialization in the project accordingly.

4. **Run the application**:

   ```bash
   npm start
   ```

   The application should now be running at `http://localhost:3000`.

## Usage

- **Access the application**: Navigate to `http://localhost:3000` in your web browser.
- **Register/Login**: Create a new account or log in with existing credentials.
- **Explore Challenges**: Browse available CTF challenges and start solving them.
- **View Leaderboard**: Check your ranking and compare with other participants.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`.
3. Make your changes and commit them: `git commit -m 'Add new feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Submit a pull request detailing your changes.

Thank You.
