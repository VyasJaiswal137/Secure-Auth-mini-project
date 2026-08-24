# 🔐 CredJourney

### Visual Authentication Pipeline — Watch your credentials travel securely in real-time.

[![Status](https://img.shields.io/badge/status-live-brightgreen)]()
[![Firebase](https://img.shields.io/badge/Firebase-Auth-orange)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

---

## 🚀 Overview

Unlike traditional login screens that hide all complexity behind a **"Sign In"** button, **CredJourney** provides a **real-time security pipeline**.

Users don't just log in — they visually ride alongside their credentials through TLS encryption, Scrypt hashing, and JWT issuance. This turns the traditionally hidden authentication process into an interactive security audit.

> ** *"Watch your password travel securely. Every step is shown in real-time."*

---

## ✨ Key Features

| Feature                              | Description                                                                                                                    |
| :----------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| 👤 **Email/Password Authentication** | Complete signup and login flows with real-time input validation.                                                               |
| 🛤️ **5-Step Interactive Journey**   | Live step-by-step animation showing **Capture Input → TLS 1.3 → Scrypt Hashing → JWT Issued → Access Granted**.                |
| ⚠️ **Pwned Passwords Check**         | Integrates with the **Have I Been Pwned?** API using k-anonymity to detect compromised passwords during signup.                |
| 🎫 **JWT Token Inspector**           | Decodes the Firebase session token on the dashboard and displays `uid`, `email`, `iat`, and `exp` with a live countdown timer. |
| 📧 **Email Verification**            | Detects unverified email addresses and provides a **Resend Verification** button.                                              |
| 🔑 **Password Reset**                | Sends a secure password-reset link using Firebase's `sendPasswordResetEmail`.                                                  |
| 🔵🐙 **Social Logins**               | Google and GitHub OAuth integration.                                                                                           |

---

## 🧠 How It Works

When a user submits their credentials, the right panel visually guides them through the authentication pipeline.

### 1. ✍️ Capture Input

The user enters their email and password.

Client-side validation checks:

* Email format
* Password length
* Required fields

### 2. 🔒 TLS 1.3 Encryption

The credentials are transmitted securely over an encrypted TLS connection.

### 3. ⚡ Scrypt Hashing + Salt

Firebase securely processes the password using server-side password hashing.

> **Note:** The hashing process is performed by Firebase's backend. CredJourney visualizes this stage as part of the authentication journey rather than performing the hashing itself in the browser.

### 4. 🎫 JWT Session Issued

After successful authentication, Firebase issues a signed session token.

The dashboard allows users to inspect information such as:

* `uid`
* `email`
* `iat`
* `exp`

A live countdown shows the token's remaining lifetime.

### 5. ✅ Access Granted

Once authentication succeeds, the user is taken to the dashboard.

If authentication fails or the password is detected as compromised, the journey stops and an appropriate error message is displayed.

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* JavaScript ES Modules

### Authentication

* Firebase Authentication

### APIs

* Have I Been Pwned — Pwned Passwords API

### Fonts

* Space Grotesk — headings
* Inter — body text

---

## 📦 Getting Started

Follow these steps to run CredJourney locally.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/credjourney.git
cd credjourney
```

Replace `your-username` with your GitHub username.

### 2. Set Up Firebase

Create a project in the [Firebase Console](https://console.firebase.google.com/).

Then:

1. Open **Authentication**.
2. Go to **Sign-in method**.
3. Enable **Email/Password** authentication.
4. Enable **Google** authentication.
5. Enable **GitHub** authentication.
6. Configure the required OAuth credentials for GitHub.
7. Copy your Firebase configuration object.

### 3. Add Your Firebase Configuration

Open:

```text
js/app.js
```

Find the `firebaseConfig` object and replace it with your project's Firebase configuration.

Example:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Run the Project Locally

Using `npx serve`:

```bash
npx serve
```

Alternatively, you can use the **Live Server** extension in Visual Studio Code.

### 5. Open CredJourney

Open the local URL provided by your development server, for example:

```text
http://localhost:3000
```

---

## 🔐 Firebase Configuration

Make sure your local and production domains are configured in Firebase.

Navigate to:

**Firebase Console → Authentication → Settings → Authorized domains**

Add:

* `localhost`
* Your deployed domain
* Any other domain from which the application will be served

---

## 🚧 Future Enhancements

* 🗑️ Account deletion with re-authentication
* 🌗 Dark/light theme toggle
* ⏳ Automatic logout when the session expires
* 📊 More detailed user analytics
* 🔍 More detailed authentication event inspection
* 📱 Improved mobile responsiveness

---

## 🤝 Contributing

Contributions are welcome!

### How to Contribute

1. Fork the repository.
2. Create a new branch:

```bash
git checkout -b feature/your-feature
```

3. Make your changes.
4. Commit your changes:

```bash
git commit -m "Add your feature"
```

5. Push your branch:

```bash
git push origin feature/your-feature
```

6. Open a Pull Request.

For major changes, please open an issue first to discuss the proposed changes.

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🙏 Acknowledgements

* [Firebase](https://firebase.google.com/) — Authentication infrastructure
* [Have I Been Pwned](https://haveibeenpwned.com/) — Compromised password detection
* [Google Fonts](https://fonts.google.com/) — Space Grotesk and Inter

---

## ❤️ Built With Purpose

**CredJourney** was built around one idea:

> Authentication shouldn't have to feel like a black box.

Instead of hiding what happens after a user clicks **Sign In**, CredJourney makes the authentication journey visible, interactive, and understandable.

**Built with ❤️ and a commitment to radical transparency.**
