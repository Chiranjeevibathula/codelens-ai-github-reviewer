# 🚀 CodeLens AI

> AI-Powered GitHub Repository Engineering Auditor

CodeLens AI is an AI-powered web application that analyzes public GitHub repositories and generates detailed software engineering insights using **OpenAI GPT** and the **GitHub REST API**.

It evaluates repository architecture, security, performance, documentation, maintainability, and recruiter readiness through an interactive dashboard.

---

## ✨ Features

- 🤖 AI-powered GitHub repository analysis
- 📊 Overall engineering score
- 🏗️ Architecture review
- 🔒 Security analysis
- ⚡ Performance recommendations
- 🧹 Maintainability evaluation
- 📚 Documentation review
- 💼 Recruiter readiness score
- ✅ Engineering checklist detection
- 🔧 AI-generated fix suggestions
- ⚔️ Compare two GitHub repositories
- 📄 Download reports in TXT and PDF

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Axios
- CSS3

### Backend
- FastAPI
- Python

### AI
- OpenAI GPT-4o Mini

### APIs
- GitHub REST API

---

## 🏗️ Project Architecture

```text
GitHub Repository
        │
        ▼
 GitHub REST API
        │
        ▼
 Repository Analysis
        │
        ▼
 OpenAI Review Engine
        │
        ▼
 Interactive Dashboard
        │
        ├── TXT Report
        └── PDF Report
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/Chiranjeevibathula/codelens-ai-github-reviewer.git
cd codelens-ai-github-reviewer
```

### Backend

```bash
cd backend

python3 -m venv venv

source venv/bin/activate

pip install -r requirements.txt

uvicorn main:app --reload
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file inside the `backend` folder.

```env
OPENAI_API_KEY=your_openai_api_key
GITHUB_TOKEN=your_github_token
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Backend Health Check |
| POST | `/review` | Analyze Repository |
| POST | `/compare` | Compare Two Repositories |

---

## 🎯 Use Cases

- Improve GitHub projects
- Review portfolio repositories
- Compare repositories
- Learn software engineering best practices
- Prepare projects for interviews
- Audit open-source repositories

---

## 🚀 Future Improvements

- AI-generated architecture diagrams
- Pull request review
- Commit history analysis
- Code smell detection
- GitHub App integration
- CI/CD analysis

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Push the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Bathula Chiranjeevi**

AI Automation & GenAI Developer | Full-Stack Developer

- 🌐 Portfolio: https://chirubathula06.github.io/my-portfolio/
- 💼 LinkedIn: https://www.linkedin.com/in/bathula-chiranjeevi/
- 💻 GitHub: https://github.com/Chiranjeevibathula

---

⭐ **If you found this project useful, consider giving it a star!**
