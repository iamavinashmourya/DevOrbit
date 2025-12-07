# DevOrbit 🚀

**DevOrbit** (formerly StudyTrack) is a futuristic, full-stack productivity tracker designed for developers. It helps you track your learning, DSA practice, projects, and even time-wasting habits, all wrapped in a stunning glassmorphic UI.

## ✨ Features

*   **📊 Dashboard**: Real-time stats, productivity score, and activity breakdown.
*   **🔥 Streak Tracking**: Track your daily coding streaks (YouTube Learning, DSA, Projects, GitHub).
*   **📅 Monthly Calendar**: Visual heatmap of your productivity intensity.
*   **🐙 GitHub Integration**: Sync your commits and activity directly from GitHub.
*   **⏱️ Browser Extension**: Automatically track time spent on YouTube and other sites.
*   **📈 Reports**: Detailed charts and insights into your habits.
*   **🎨 Futuristic UI**: Dark mode, glassmorphism, and neon accents.

## 🛠️ Tech Stack

*   **Frontend**: React, TypeScript, Tailwind CSS, Vite, Recharts, Framer Motion.
*   **Backend**: Node.js, Express, MongoDB, Mongoose, JWT.
*   **Extension**: Chrome Manifest V3.

## 🚀 Getting Started

### Prerequisites

*   Node.js
*   MongoDB

### Installation

1.  **Clone the repo**
    ```bash
    git clone https://github.com/iamavinashmourya/DevOrbit.git
    cd DevOrbit
    ```

2.  **Install Dependencies**
    ```bash
    # Backend
    cd backend
    npm install
    
    # Frontend
    cd ../frontend
    npm install
    ```

3.  **Environment Setup**
    *   Create `.env` in `backend/` with:
        ```env
        PORT=4000
        MONGO_URI=your_mongodb_uri
        JWT_SECRET=your_secret
        GITHUB_CLIENT_ID=your_github_id
        GITHUB_CLIENT_SECRET=your_github_secret
        ```

4.  **Run the App**
    ```bash
    # Terminal 1: Backend
    cd backend
    npm run dev

    # Terminal 2: Frontend
    cd frontend
    npm run dev
    ```

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

---
Built with ❤️ by Avinash
