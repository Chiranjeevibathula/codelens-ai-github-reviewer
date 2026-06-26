🚀 CodeLens AI – AI-Powered GitHub Repository Engineering Auditor
<div align="center">
Analyze • Compare • Improve GitHub Repositories with AI

AI-powered platform that reviews public GitHub repositories for architecture, security, performance, maintainability, documentation, engineering quality, and recruiter readiness using OpenAI and the GitHub API.

<br> <p> <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black"/> <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/> <img src="https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white"/> <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"/> <img src="https://img.shields.io/badge/GitHub-API-181717?style=for-the-badge&logo=github"/> <img src="https://img.shields.io/badge/License-MIT-success?style=for-the-badge"/> </p> </div>
📖 Overview

CodeLens AI is an AI-powered software engineering audit platform that analyzes public GitHub repositories and generates detailed engineering insights using Large Language Models (LLMs).

Instead of simply displaying repository statistics, CodeLens AI evaluates projects like an experienced software engineer by reviewing architecture, engineering practices, documentation quality, security considerations, technical debt, and overall project maturity.

It helps developers understand the strengths and weaknesses of a repository and provides practical recommendations for improvement.

✨ Features
🤖 AI Repository Analysis
Analyze any public GitHub repository
AI-generated executive summary
Project purpose detection
Automatic technology stack identification
📊 Engineering Review
Overall Engineering Score
Architecture Score
Security Score
Performance Score
Maintainability Score
Documentation Score
Recruiter Readiness Score
🏗 Software Architecture
Architecture pattern detection
Repository structure analysis
Architecture explanation
Engineering health summary
🔍 AI Code Review
Critical issue detection
AI-generated fix suggestions
Refactoring recommendations
Security recommendations
Performance improvements
README improvement suggestions
⚙ Engineering Checklist

Automatically detects:

✅ README
✅ License
✅ Tests
✅ GitHub Actions
✅ Docker
✅ ESLint
✅ Prettier
✅ Environment Example
⚔ Repository Comparison

Compare two repositories based on:

Architecture
Security
Performance
Documentation
Engineering Practices
Overall Quality
📄 Professional Reports

Generate downloadable:

TXT Report
PDF Report
🛠 Tech Stack
Category	Technologies
Frontend	React, Axios, CSS
Backend	FastAPI, Python
AI	OpenAI GPT
APIs	GitHub REST API
Reports	TXT, PDF
Deployment	Vercel + Render
🏛 Architecture
                GitHub Repository URL
                        │
                        ▼
               GitHub REST API
                        │
                        ▼
             Repository Metadata & Files
                        │
                        ▼
          Engineering Analysis Pipeline
                        │
                        ▼
                OpenAI Review Engine
                        │
                        ▼
          Structured Engineering Report
                        │
                        ▼
        Interactive React Dashboard
🚀 Getting Started
Clone Repository
git clone https://github.com/Chiranjeevibathula/codelens-ai-github-reviewer.git

cd codelens-ai-github-reviewer
Backend
cd backend

python3 -m venv venv

source venv/bin/activate

pip install -r requirements.txt

uvicorn main:app --reload
Frontend
cd frontend

npm install

npm run dev
Environment Variables

Create:

backend/.env

Add:

OPENAI_API_KEY=your_openai_api_key

GITHUB_TOKEN=your_github_token
📊 Analysis Workflow
GitHub Repository
        │
        ▼
 Repository Metadata
        │
        ▼
 Repository File Analysis
        │
        ▼
 Engineering Checklist
        │
        ▼
 OpenAI Engineering Review
        │
        ▼
 Interactive Dashboard
        │
        ├── TXT Report
        └── PDF Report
📡 API Endpoints
Method	Endpoint	Description
GET	/	Backend Health Check
POST	/review	Analyze Repository
POST	/compare	Compare Two Repositories
🎯 Use Cases
Portfolio Review
Open Source Repository Audit
Software Engineering Assessment
Interview Preparation
Student Projects
Resume Enhancement
GitHub Repository Benchmarking
Engineering Quality Evaluation
🚀 Roadmap
AI Architecture Diagrams
Dependency Graph Visualization
Commit History Analysis
Pull Request Review
Code Smell Detection
Repository Ranking
Team Dashboard
CI/CD Integration
🤝 Contributing

Contributions are welcome!

Fork the repository
Create a feature branch
Commit your changes
Push the branch
Open a Pull Request
📄 License

This project is licensed under the MIT License.

👨‍💻 Author
Bathula Chiranjeevi

AI Automation & GenAI Developer | Full-Stack Developer

🌐 Portfolio: https://chirubathula06.github.io/my-portfolio/
💼 LinkedIn: https://www.linkedin.com/in/bathula-chiranjeevi/
💻 GitHub: https://github.com/Chiranjeevibathula
<div align="center">
⭐ If you found this project helpful, please consider giving it a Star!

Built with ❤️ using React, FastAPI, OpenAI & GitHub API

</div>
