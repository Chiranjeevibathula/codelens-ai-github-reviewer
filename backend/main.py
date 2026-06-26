from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import os
import requests
import json
import re
from urllib.parse import urlparse

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI(title="CodeLens AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ReviewRequest(BaseModel):
    repo_url: str
    mode: str = "fast"


class CompareRequest(BaseModel):
    repo_url_a: str
    repo_url_b: str


def extract_owner_repo(url: str):
    path = urlparse(url).path.strip("/")
    parts = path.split("/")

    if len(parts) < 2 or "github.com" not in url:
        raise HTTPException(status_code=400, detail="Invalid GitHub repository URL")

    return parts[0], parts[1].replace(".git", "")


def github_get(url: str):
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "CodeLens-AI",
    }

    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    return requests.get(url, headers=headers, timeout=15)


def detect_engineering_checklist(files):
    lower_files = [f.lower() for f in files]

    return {
        "README": any("readme" in f for f in lower_files),
        "LICENSE": any("license" in f for f in lower_files),
        "TESTS": any("test" in f or "spec" in f for f in lower_files),
        "GITHUB ACTIONS": any(".github/workflows" in f for f in lower_files),
        "DOCKER": any("dockerfile" in f or "docker-compose" in f for f in lower_files),
        "ESLINT": any("eslint" in f for f in lower_files),
        "PRETTIER": any("prettier" in f for f in lower_files),
        "ENV EXAMPLE": any(".env.example" in f for f in lower_files),
    }


def detect_tech_stack(files, languages):
    tech = set()
    text = " ".join(files).lower()

    for lang in languages.keys():
        tech.add(lang)

    if "package.json" in text:
        tech.add("Node.js")
    if "vite.config" in text:
        tech.add("Vite")
    if "next.config" in text:
        tech.add("Next.js")
    if "tailwind" in text:
        tech.add("Tailwind CSS")
    if "requirements.txt" in text or ".py" in text:
        tech.add("Python")
    if "dockerfile" in text:
        tech.add("Docker")
    if ".github/workflows" in text:
        tech.add("GitHub Actions")
    if "app.jsx" in text or "app.tsx" in text:
        tech.add("React")
    if "fastapi" in text:
        tech.add("FastAPI")

    return sorted(list(tech))


def calculate_real_score(files, checklist, languages, repo_data):
    score = 35

    if checklist.get("README"):
        score += 12
    if checklist.get("LICENSE"):
        score += 5
    if checklist.get("TESTS"):
        score += 12
    if checklist.get("GITHUB ACTIONS"):
        score += 10
    if checklist.get("DOCKER"):
        score += 8
    if checklist.get("ESLINT"):
        score += 5
    if checklist.get("PRETTIER"):
        score += 5
    if checklist.get("ENV EXAMPLE"):
        score += 5

    if len(files) >= 10:
        score += 4
    if len(files) >= 25:
        score += 5
    if len(files) >= 50:
        score += 5

    if len(languages.keys()) >= 2:
        score += 4
    if len(languages.keys()) >= 4:
        score += 3

    if repo_data.get("description"):
        score += 5

    if repo_data.get("stargazers_count", 0) > 0:
        score += 2

    return min(score, 100)


def category_score(category, files, checklist, languages, repo_data):
    category = category.lower()

    if "documentation" in category:
        return 85 if checklist.get("README") else 50

    if "security" in category:
        score = 60
        if checklist.get("ENV EXAMPLE"):
            score += 10
        if checklist.get("GITHUB ACTIONS"):
            score += 10
        if checklist.get("README"):
            score += 5
        return min(score, 100)

    if "performance" in category:
        score = 60
        if len(files) >= 10:
            score += 8
        if checklist.get("ESLINT"):
            score += 8
        if checklist.get("PRETTIER"):
            score += 6
        return min(score, 100)

    if "architecture" in category:
        score = 55
        if len(files) >= 10:
            score += 10
        if len(files) >= 25:
            score += 10
        if len(languages.keys()) >= 2:
            score += 8
        if checklist.get("DOCKER"):
            score += 7
        return min(score, 100)

    if "engineering" in category or "practice" in category:
        return calculate_real_score(files, checklist, languages, repo_data)

    return calculate_real_score(files, checklist, languages, repo_data)


def fetch_repo(owner, repo, mode="fast"):
    repo_res = github_get(f"https://api.github.com/repos/{owner}/{repo}")

    if repo_res.status_code != 200:
        raise HTTPException(status_code=404, detail="Repository not found or GitHub API limit reached")

    repo_data = repo_res.json()
    branch = repo_data.get("default_branch", "main")

    lang_res = github_get(f"https://api.github.com/repos/{owner}/{repo}/languages")
    languages = lang_res.json() if lang_res.status_code == 200 else {}

    tree_res = github_get(
        f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
    )

    if tree_res.status_code != 200:
        raise HTTPException(status_code=500, detail="Unable to read repository files")

    tree = tree_res.json().get("tree", [])

    allowed = (
        ".js", ".jsx", ".ts", ".tsx", ".py", ".html", ".css",
        ".json", ".md", ".java", ".php", ".sql", ".yml", ".yaml"
    )

    files = []

    for item in tree:
        path = item.get("path", "")

        if item.get("type") != "blob":
            continue

        if not path.endswith(allowed):
            continue

        if any(skip in path.lower() for skip in [
            "node_modules", "dist", "build", "package-lock",
            "venv", ".next", ".cache", "coverage"
        ]):
            continue

        files.append(path)

    priority_keywords = [
        "README.md",
        "package.json",
        "requirements.txt",
        "Dockerfile",
        "docker-compose.yml",
        "vite.config",
        "next.config",
        "tailwind.config",
        "tsconfig",
        "src/App",
        "main.",
        "index.",
        ".env.example",
        ".github/workflows",
    ]

    priority_files = []
    normal_files = []

    for file in files:
        if any(key.lower() in file.lower() for key in priority_keywords):
            priority_files.append(file)
        else:
            normal_files.append(file)

    limit = 10 if mode == "fast" else 16
    char_limit = 1800 if mode == "fast" else 2600

    selected_files = (priority_files + normal_files)[:limit]
    code_bundle = ""

    for path in selected_files:
        raw = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
        r = github_get(raw)

        if r.status_code == 200:
            code_bundle += f"\n\n--- FILE: {path} ---\n{r.text[:char_limit]}"

    checklist = detect_engineering_checklist(files)
    tech_stack = detect_tech_stack(files, languages)

    return repo_data, languages, files, selected_files, code_bundle, checklist, tech_stack


def extract_json(text):
    cleaned = text.strip()
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()

    match = re.search(r"\{[\s\S]*\}", cleaned)

    if not match:
        raise ValueError("No JSON found in AI response")

    return json.loads(match.group(0))


def safe_review_fallback(repo_data, selected_files, checklist, tech_stack):
    checklist_score = sum(1 for v in checklist.values() if v)
    base = 55 + checklist_score * 4

    return {
        "project_name": repo_data.get("name", "Unknown Repository"),
        "summary": "The repository was analyzed using metadata, file structure, detected technologies, and engineering checklist signals.",
        "purpose": repo_data.get("description") or "Project purpose was inferred from repository structure and available files.",
        "overall_score": min(base, 90),
        "architecture_score": min(base + 3, 90),
        "security_score": min(base, 88),
        "performance_score": min(base + 2, 90),
        "maintainability_score": min(base + 4, 92),
        "documentation_score": 85 if checklist.get("README") else 45,
        "recruiter_score": min(base + 5, 92),
        "health_summary": "Repository health is based on structure, documentation, testing, CI/CD, and maintainability signals.",
        "technical_debt_level": "Medium",
        "tech_stack": tech_stack,
        "architecture": {
            "pattern": "Component / project-based architecture",
            "explanation": "The project appears organized around source files and configuration files. More modularization may improve long-term maintainability.",
            "diagram": ["GitHub Repo", "Source Files", "Application Logic", "UI/API Layer", "Deployment"]
        },
        "strengths": [
            "Repository has a clear project structure.",
            "Important source/configuration files were detected.",
            "The project is suitable for further AI-assisted improvement."
        ],
        "issues": [
            {
                "severity": "Medium",
                "file": "Repository structure",
                "title": "Engineering maturity can be improved",
                "description": "Some professional engineering practices may be missing, such as tests, CI/CD, Docker, or formatting tools.",
                "recommendation": "Add tests, GitHub Actions, linting, formatting, and setup documentation."
            }
        ],
        "performance_suggestions": [
            "Optimize large assets and bundle size.",
            "Use lazy loading where applicable.",
            "Avoid unnecessary re-renders in frontend components."
        ],
        "security_suggestions": [
            "Do not expose API keys or secrets.",
            "Use environment variables for configuration.",
            "Add dependency vulnerability checks."
        ],
        "refactoring_suggestions": [
            "Split large files into reusable modules/components.",
            "Create shared utilities for repeated logic.",
            "Improve folder structure for scalability."
        ],
        "missing_features": [
            "Automated tests",
            "CI/CD workflow",
            "Contribution guide",
            "Production deployment instructions"
        ],
        "readme_suggestions": [
            "Add project overview, features, tech stack, screenshots, setup steps, and deployment instructions."
        ],
        "ai_fix_suggestions": [
            {
                "file": selected_files[0] if selected_files else "README.md",
                "problem": "Project documentation can be stronger",
                "suggested_fix": "Add a professional README with setup, features, architecture, and screenshots.",
                "example_code": "## Features\n- AI-powered analysis\n- GitHub integration\n- Professional dashboard\n\n## Setup\nnpm install\nnpm run dev"
            }
        ],
        "recruiter_feedback": {
            "impresses_recruiters": True,
            "reason": "The project can impress recruiters if it clearly shows real-world problem solving, clean UI, and professional engineering practices.",
            "improvements": ["Add tests", "Add CI/CD", "Improve README", "Add deployment link"]
        },
        "final_verdict": "This repository has good potential. Strengthening documentation, tests, and engineering workflow will make it more professional and recruiter-ready."
    }


@app.get("/")
def home():
    return {"message": "CodeLens AI Backend Running"}


@app.post("/review")
def review_repo(data: ReviewRequest):
    owner, repo = extract_owner_repo(data.repo_url)

    repo_data, languages, all_files, selected_files, code_bundle, checklist, detected_stack = fetch_repo(
        owner, repo, data.mode
    )

    prompt = f"""
You are CodeLens AI, a senior software architect, security reviewer, and recruiter-focused engineering auditor.

Analyze this real GitHub repository.

Repository metadata:
Name: {repo_data.get("name")}
Description: {repo_data.get("description")}
Stars: {repo_data.get("stargazers_count")}
Forks: {repo_data.get("forks_count")}
Open Issues: {repo_data.get("open_issues_count")}
Default Branch: {repo_data.get("default_branch")}
Languages: {languages}
Detected Tech Stack: {detected_stack}
Engineering Checklist: {checklist}
Total files found: {len(all_files)}
Files analyzed: {selected_files}

Code sample:
{code_bundle}

Return ONLY valid JSON. No markdown. No explanation outside JSON.

Use this exact JSON structure:

{{
  "project_name": "",
  "summary": "",
  "purpose": "",
  "overall_score": 0,
  "architecture_score": 0,
  "security_score": 0,
  "performance_score": 0,
  "maintainability_score": 0,
  "documentation_score": 0,
  "recruiter_score": 0,
  "health_summary": "",
  "technical_debt_level": "Low | Medium | High",
  "tech_stack": [],
  "architecture": {{
    "pattern": "",
    "explanation": "",
    "diagram": []
  }},
  "strengths": [],
  "issues": [
    {{
      "severity": "Critical | High | Medium | Low",
      "file": "",
      "title": "",
      "description": "",
      "recommendation": ""
    }}
  ],
  "performance_suggestions": [],
  "security_suggestions": [],
  "refactoring_suggestions": [],
  "missing_features": [],
  "readme_suggestions": [],
  "ai_fix_suggestions": [
    {{
      "file": "",
      "problem": "",
      "suggested_fix": "",
      "example_code": ""
    }}
  ],
  "recruiter_feedback": {{
    "impresses_recruiters": true,
    "reason": "",
    "improvements": []
  }},
  "final_verdict": ""
}}

Rules:
- Be specific.
- Mention real files when possible.
- Give realistic scores from 60 to 95.
- If repo is small, say it is small but promising.
- Do not say you cannot access GitHub.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Return only valid JSON. You are an expert software engineering auditor."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )

        review_json = extract_json(response.choices[0].message.content)

    except Exception:
        review_json = safe_review_fallback(repo_data, selected_files, checklist, detected_stack)

    return {
        "repo": {
            "name": repo_data.get("name"),
            "full_name": repo_data.get("full_name"),
            "description": repo_data.get("description"),
            "stars": repo_data.get("stargazers_count"),
            "forks": repo_data.get("forks_count"),
            "open_issues": repo_data.get("open_issues_count"),
            "default_branch": repo_data.get("default_branch"),
            "url": repo_data.get("html_url"),
            "languages": languages,
            "total_files": len(all_files),
            "files_analyzed": selected_files,
            "engineering_checklist": checklist,
        },
        "review": review_json
    }


@app.post("/compare")
def compare_repos(data: CompareRequest):
    owner_a, repo_a = extract_owner_repo(data.repo_url_a)
    owner_b, repo_b = extract_owner_repo(data.repo_url_b)

    repo_data_a, languages_a, files_a, selected_a, code_a, checklist_a, stack_a = fetch_repo(owner_a, repo_a, "fast")
    repo_data_b, languages_b, files_b, selected_b, code_b, checklist_b, stack_b = fetch_repo(owner_b, repo_b, "fast")

    real_score_a = calculate_real_score(files_a, checklist_a, languages_a, repo_data_a)
    real_score_b = calculate_real_score(files_b, checklist_b, languages_b, repo_data_b)

    if real_score_a > real_score_b:
        real_winner = "Repo A"
    elif real_score_b > real_score_a:
        real_winner = "Repo B"
    else:
        real_winner = "Tie"

    prompt = f"""
You are CodeLens AI. Compare two GitHub repositories.

IMPORTANT:
- Do NOT invent scores.
- Use the provided real scores.
- Explain why the real scores differ.
- Return ONLY valid JSON.

Repository A:
Name: {repo_data_a.get("full_name")}
Description: {repo_data_a.get("description")}
Real Score: {real_score_a}/100
Languages: {languages_a}
Checklist: {checklist_a}
Total files: {len(files_a)}
Files analyzed: {selected_a}

Repository B:
Name: {repo_data_b.get("full_name")}
Description: {repo_data_b.get("description")}
Real Score: {real_score_b}/100
Languages: {languages_b}
Checklist: {checklist_b}
Total files: {len(files_b)}
Files analyzed: {selected_b}

Return JSON:
{{
  "winner": "{real_winner}",
  "summary": "",
  "repo_a_score": {real_score_a},
  "repo_b_score": {real_score_b},
  "comparison": [
    {{
      "category": "Architecture",
      "repo_a": 0,
      "repo_b": 0,
      "winner": "",
      "reason": ""
    }},
    {{
      "category": "Documentation",
      "repo_a": 0,
      "repo_b": 0,
      "winner": "",
      "reason": ""
    }},
    {{
      "category": "Security",
      "repo_a": 0,
      "repo_b": 0,
      "winner": "",
      "reason": ""
    }},
    {{
      "category": "Performance",
      "repo_a": 0,
      "repo_b": 0,
      "winner": "",
      "reason": ""
    }},
    {{
      "category": "Engineering Practices",
      "repo_a": 0,
      "repo_b": 0,
      "winner": "",
      "reason": ""
    }}
  ],
  "repo_a_strengths": [],
  "repo_b_strengths": [],
  "repo_a_improvements": [],
  "repo_b_improvements": [],
  "final_recommendation": ""
}}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Return only valid JSON. Do not invent scores."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )

        result = extract_json(response.choices[0].message.content)

    except Exception:
        result = {
            "winner": real_winner,
            "summary": "Repositories were compared using real metadata, language usage, file count, and engineering checklist signals.",
            "repo_a_score": real_score_a,
            "repo_b_score": real_score_b,
            "comparison": [],
            "repo_a_strengths": ["Detected stack and repository structure are available for review."],
            "repo_b_strengths": ["Detected stack and repository structure are available for review."],
            "repo_a_improvements": ["Improve README, tests, CI/CD, Docker, and formatting where missing."],
            "repo_b_improvements": ["Improve README, tests, CI/CD, Docker, and formatting where missing."],
            "final_recommendation": "Improve the lower-scoring repository by adding missing engineering practices and clearer documentation."
        }

    result["winner"] = real_winner
    result["repo_a_score"] = real_score_a
    result["repo_b_score"] = real_score_b

    categories = ["Architecture", "Documentation", "Security", "Performance", "Engineering Practices"]
    final_comparison = []

    existing = {item.get("category", ""): item for item in result.get("comparison", [])}

    for category in categories:
        item = existing.get(category, {})
        score_a = category_score(category, files_a, checklist_a, languages_a, repo_data_a)
        score_b = category_score(category, files_b, checklist_b, languages_b, repo_data_b)

        if score_a > score_b:
            winner = "Repo A"
        elif score_b > score_a:
            winner = "Repo B"
        else:
            winner = "Tie"

        final_comparison.append({
            "category": category,
            "repo_a": score_a,
            "repo_b": score_b,
            "winner": winner,
            "reason": item.get("reason") or f"{category} score is based on repository structure, checklist signals, language diversity, and metadata."
        })

    result["comparison"] = final_comparison

    return {
        "repo_a": {
            "name": repo_data_a.get("full_name"),
            "description": repo_data_a.get("description"),
            "stars": repo_data_a.get("stargazers_count"),
            "forks": repo_data_a.get("forks_count"),
            "files": len(files_a),
            "checklist": checklist_a,
            "tech_stack": stack_a,
        },
        "repo_b": {
            "name": repo_data_b.get("full_name"),
            "description": repo_data_b.get("description"),
            "stars": repo_data_b.get("stargazers_count"),
            "forks": repo_data_b.get("forks_count"),
            "files": len(files_b),
            "checklist": checklist_b,
            "tech_stack": stack_b,
        },
        "result": result
    }