🚀 Rays Music Player

🎧 A modern AI-powered music streaming web app with Firebase integration, offline support, and playlists.

✨ Features
🔍 Search songs (JioSaavn API)
▶️ Play music instantly
❤️ Add to favourites (Firebase sync)
🎵 Create & manage playlists (cloud sync)
💾 Offline downloads (IndexedDB)
🔐 Google Login (Firebase Auth)
⚡ Fast UI with caching
🌐 Works even in low network
🛠 Tech Stack
Tech	Usage
HTML, CSS, JS	Frontend
Firebase Auth	Login system
Firestore DB	Favourites & Playlists
IndexedDB	Offline storage
JioSaavn API	Music data

⚙️ Setup Instructions
1️⃣ Clone repo
git clone https://github.com/code1v/rays-music-player.git
cd rays-music-player
2️⃣ Create config file

Create config.js

window.env = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
3️⃣ Run project

Just open:

index.html

Or use Live Server

🔐 Security
🔑 Firebase keys stored in config.js
🚫 config.js ignored via .gitignore
🔒 Firestore rules secured per user
🌍 API key restricted to localhost
📁 Project Structure
rays-music-player/
│
├── index.html
├── firebase.js
├── config.js (ignored)
├── sw.js
├── assets/
└── README.md
💡 Future Improvements
🔄 Real-time sync (onSnapshot)
🎧 Music recommendations (AI)
📱 Mobile app (React Native)
🌍 Deployment (Firebase Hosting)
🤝 Contributing

Pull requests are welcome!
If you find a bug, open an issue 🚀

📜 License

MIT License

👨‍💻 Developer

Made with ❤️ by Vanshika

⭐ Show some love

If you like this project:

👉 Star ⭐ the repo
👉 Share with friends
👉 Use it in your portfolio
