# CodeLens AI

AI-powered GitHub repository analyzer that reviews code quality, architecture, security, performance, technical debt, and recruiter readiness.

## Features

- GitHub repository analysis
- Fast Mode and Deep Mode
- AI code review
- Engineering checklist
- Repository comparison
- Architecture review
- Security and performance suggestions
- AI fix suggestions
- TXT/PDF report download
- Modern React dashboard

## Tech Stack

- React
- FastAPI
- OpenAI API
- GitHub API
- Axios
- jsPDF

## Run Locally

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload