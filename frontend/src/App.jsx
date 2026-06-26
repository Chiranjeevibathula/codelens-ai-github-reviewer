import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";
import jsPDF from "jspdf";

const API_URL = "http://127.0.0.1:8000";

function ScoreCard({ title, score }) {
  const safeScore = Number(score || 0);

  return (
    <div className="score-card glass-hover">
      <div className="score-top">
        <p>{title}</p>
        <span>{safeScore >= 80 ? "Strong" : safeScore >= 60 ? "Good" : "Needs Work"}</span>
      </div>
      <h2>{safeScore}/100</h2>
      <div className="bar">
        <span style={{ width: `${safeScore}%` }}></span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <div className="metric-card glass-hover">
      <span>{icon}</span>
      <p>{label}</p>
      <b>{value}</b>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="orb"></div>
      <h2>Build a professional AI audit in seconds</h2>
      <p>
        Paste any public GitHub repository and CodeLens AI will analyze code quality,
        architecture, security, performance, technical debt, and recruiter readiness.
      </p>

      <div className="feature-strip">
        <span>GitHub API</span>
        <span>LLM Audit</span>
        <span>Repo Compare</span>
        <span>Engineering Checklist</span>
        <span>TXT Report</span>
      </div>
    </div>
  );
}

function LoadingCard({ seconds, mode }) {
  return (
    <div className="loading-card">
      <div className="loader-ring"></div>
      <h2>Analyzing Repository</h2>
      <h3>{seconds}s elapsed</h3>
      <p>
        {mode === "fast"
          ? "Fast mode usually takes 15–35 seconds."
          : "Deep mode analyzes more files and may take 40–90 seconds."}
      </p>

      <div className="steps">
        <p className={seconds >= 1 ? "active" : ""}>Fetching repository metadata</p>
        <p className={seconds >= 4 ? "active" : ""}>Reading important source files</p>
        <p className={seconds >= 8 ? "active" : ""}>Detecting tech stack and engineering checklist</p>
        <p className={seconds >= 14 ? "active" : ""}>Running AI architecture and security audit</p>
        <p className={seconds >= 24 ? "active" : ""}>Preparing dashboard and report</p>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("review");
  const [repoUrl, setRepoUrl] = useState("");
  const [repoA, setRepoA] = useState("");
  const [repoB, setRepoB] = useState("");
  const [mode, setMode] = useState("fast");

  const [data, setData] = useState(null);
  const [compareData, setCompareData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let timer;

    if (loading || compareLoading) {
      setSeconds(0);
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [loading, compareLoading]);

  const analyzeRepo = async () => {
    if (!repoUrl.trim()) return alert("Enter GitHub repo URL");

    setLoading(true);
    setData(null);
    setCompareData(null);

    try {
      const res = await axios.post(`${API_URL}/review`, {
        repo_url: repoUrl,
        mode,
      });

      setData(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Analysis failed. Check backend, API key, or GitHub URL.");
    } finally {
      setLoading(false);
    }
  };

  const compareRepos = async () => {
    if (!repoA.trim() || !repoB.trim()) {
      return alert("Enter both GitHub repository URLs");
    }

    setCompareLoading(true);
    setCompareData(null);
    setData(null);

    try {
      const res = await axios.post(`${API_URL}/compare`, {
        repo_url_a: repoA,
        repo_url_b: repoB,
      });

      setCompareData(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Comparison failed. Check backend or GitHub URLs.");
    } finally {
      setCompareLoading(false);
    }
  };
  const downloadPDFReport = () => {
  if (!data) return;

  const r = data.review;
  const repo = data.repo;

  const doc = new jsPDF();
  let y = 15;

  const addLine = (text, size = 11) => {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(String(text || ""), 180);
    lines.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 15;
      }
      doc.text(line, 15, y);
      y += 7;
    });
  };

  doc.setFontSize(18);
  doc.text("CodeLens AI - Repository Audit Report", 15, y);
  y += 12;

  addLine(`Repository: ${repo.full_name}`, 12);
  addLine(`Description: ${repo.description || "No description"}`);
  addLine(`URL: ${repo.url}`);
  y += 5;

  addLine("Scores", 14);
  addLine(`Overall: ${r.overall_score}/100`);
  addLine(`Architecture: ${r.architecture_score}/100`);
  addLine(`Security: ${r.security_score}/100`);
  addLine(`Performance: ${r.performance_score}/100`);
  addLine(`Maintainability: ${r.maintainability_score}/100`);
  addLine(`Documentation: ${r.documentation_score}/100`);
  addLine(`Recruiter Score: ${r.recruiter_score}/100`);
  y += 5;

  addLine("Executive Summary", 14);
  addLine(r.summary);
  y += 5;

  addLine("Architecture Review", 14);
  addLine(`${r.architecture?.pattern}: ${r.architecture?.explanation}`);
  y += 5;

  addLine("Issues Found", 14);
  (r.issues || []).forEach((issue, i) => {
    addLine(`${i + 1}. [${issue.severity}] ${issue.title}`);
    addLine(`File: ${issue.file}`);
    addLine(`Problem: ${issue.description}`);
    addLine(`Fix: ${issue.recommendation}`);
    y += 3;
  });

  addLine("AI Fix Suggestions", 14);
  (r.ai_fix_suggestions || []).forEach((fix, i) => {
    addLine(`${i + 1}. ${fix.problem}`);
    addLine(`File: ${fix.file}`);
    addLine(`Fix: ${fix.suggested_fix}`);
    y += 3;
  });

  addLine("Final Verdict", 14);
  addLine(r.final_verdict);

  doc.save("codelens-ai-report.pdf");
};

  const downloadReport = () => {
    if (!data) return;

    const r = data.review;
    const repo = data.repo;

    const report = `
CODELENS AI - GITHUB REPOSITORY REVIEW REPORT
============================================

Repository: ${repo.full_name}
Description: ${repo.description || "No description"}
URL: ${repo.url}

Repository Stats
----------------
Stars: ${repo.stars}
Forks: ${repo.forks}
Open Issues: ${repo.open_issues}
Total Files: ${repo.total_files}
Default Branch: ${repo.default_branch}

Executive Summary
-----------------
${r.summary}

Project Purpose
---------------
${r.purpose}

Repository Health
-----------------
${r.health_summary}
Technical Debt Level: ${r.technical_debt_level}

Scores
------
Overall Score: ${r.overall_score}/100
Architecture Score: ${r.architecture_score}/100
Security Score: ${r.security_score}/100
Performance Score: ${r.performance_score}/100
Maintainability Score: ${r.maintainability_score}/100
Documentation Score: ${r.documentation_score}/100
Recruiter Score: ${r.recruiter_score}/100

Tech Stack
----------
${(r.tech_stack || []).map((x) => "- " + x).join("\n")}

Engineering Checklist
---------------------
${Object.entries(repo.engineering_checklist || {}).map(([k, v]) => `${v ? "[PASS]" : "[MISSING]"} ${k}`).join("\n")}

Architecture
------------
Pattern: ${r.architecture?.pattern}

${r.architecture?.explanation}

Files Analyzed
--------------
${(repo.files_analyzed || []).map((x) => "- " + x).join("\n")}

Strengths
---------
${(r.strengths || []).map((x) => "- " + x).join("\n")}

Issues Found
------------
${(r.issues || []).map((x, i) => `
${i + 1}. [${x.severity}] ${x.title}
File: ${x.file}
Problem: ${x.description}
Recommendation: ${x.recommendation}
`).join("\n")}

AI Fix Suggestions
------------------
${(r.ai_fix_suggestions || []).map((x, i) => `
${i + 1}. ${x.problem}
File: ${x.file}
Fix: ${x.suggested_fix}
Example:
${x.example_code}
`).join("\n")}

Security Suggestions
--------------------
${(r.security_suggestions || []).map((x) => "- " + x).join("\n")}

Performance Suggestions
-----------------------
${(r.performance_suggestions || []).map((x) => "- " + x).join("\n")}

Refactoring Suggestions
-----------------------
${(r.refactoring_suggestions || []).map((x) => "- " + x).join("\n")}

Missing Features
----------------
${(r.missing_features || []).map((x) => "- " + x).join("\n")}

README Suggestions
------------------
${(r.readme_suggestions || []).map((x) => "- " + x).join("\n")}

Recruiter Feedback
------------------
${r.recruiter_feedback?.reason || ""}
${(r.recruiter_feedback?.improvements || []).map((x) => "- " + x).join("\n")}

Final Verdict
-------------
${r.final_verdict}
`;

    const blob = new Blob([report], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "codelens-ai-report.txt";
    link.click();
  };

  const downloadCompareReport = () => {
    if (!compareData) return;

    const c = compareData.result;

    const report = `
CODELENS AI - REPOSITORY COMPARISON REPORT
==========================================

Repository A: ${compareData.repo_a.name}
Repository B: ${compareData.repo_b.name}

Winner: ${c.winner}

Summary
-------
${c.summary}

Scores
------
Repo A Score: ${c.repo_a_score}/100
Repo B Score: ${c.repo_b_score}/100

Comparison
----------
${(c.comparison || []).map((item) => `
${item.category}
Repo A: ${item.repo_a}/100
Repo B: ${item.repo_b}/100
Winner: ${item.winner}
Reason: ${item.reason}
`).join("\n")}

Repository A Strengths
----------------------
${(c.repo_a_strengths || []).map((x) => "- " + x).join("\n")}

Repository B Strengths
----------------------
${(c.repo_b_strengths || []).map((x) => "- " + x).join("\n")}

Repository A Improvements
-------------------------
${(c.repo_a_improvements || []).map((x) => "- " + x).join("\n")}

Repository B Improvements
-------------------------
${(c.repo_b_improvements || []).map((x) => "- " + x).join("\n")}

Final Recommendation
--------------------
${c.final_recommendation}
`;

    const blob = new Blob([report], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "codelens-ai-comparison-report.txt";
    link.click();
  };

  const checklistCount = useMemo(() => {
    if (!data?.repo?.engineering_checklist) return 0;
    return Object.values(data.repo.engineering_checklist).filter(Boolean).length;
  }, [data]);

  return (
    <div className="app">
      <div className="noise"></div>
      <div className="aurora aurora-one"></div>
      <div className="aurora aurora-two"></div>

      <section className="hero">
        <div className="badge">AI Software Engineering Auditor</div>
        <h1>CodeLens AI</h1>
        <p>
          Analyze GitHub repositories with AI-powered architecture, security,
          performance, technical debt, and recruiter-readiness insights.
        </p>

        <div className="tab-switch">
          <button className={activeTab === "review" ? "active" : ""} onClick={() => setActiveTab("review")}>
            Single Repo Audit
          </button>
          <button className={activeTab === "compare" ? "active" : ""} onClick={() => setActiveTab("compare")}>
            Compare Repos
          </button>
        </div>

        {activeTab === "review" && (
          <>
            <div className="mode-toggle">
              <button className={mode === "fast" ? "active" : ""} onClick={() => setMode("fast")}>
                Fast Mode
              </button>
              <button className={mode === "deep" ? "active" : ""} onClick={() => setMode("deep")}>
                Deep Mode
              </button>
            </div>

            <div className="search-box">
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="Paste GitHub repository URL..."
              />
              <button onClick={analyzeRepo} disabled={loading}>
                {loading ? "Analyzing..." : "Analyze Repo"}
              </button>
            </div>
          </>
        )}

        {activeTab === "compare" && (
          <div className="compare-form">
            <input
              value={repoA}
              onChange={(e) => setRepoA(e.target.value)}
              placeholder="Repository A URL..."
            />
            <input
              value={repoB}
              onChange={(e) => setRepoB(e.target.value)}
              placeholder="Repository B URL..."
            />
            <button onClick={compareRepos} disabled={compareLoading}>
              {compareLoading ? "Comparing..." : "Compare Repositories"}
            </button>
          </div>
        )}

        {(loading || compareLoading) && <LoadingCard seconds={seconds} mode={mode} />}
      </section>

      {!data && !compareData && !loading && !compareLoading && <EmptyState />}

      {data && (
        <main className="dashboard">
          <div className="repo-card glass-hover">
            <div>
              <span className="section-kicker">Repository Audit</span>
              <h2>{data.repo.full_name}</h2>
              <p>{data.repo.description || "No description available"}</p>
            </div>
            <div className="download-actions">
  <button onClick={downloadReport}>Download TXT</button>
  <button onClick={downloadPDFReport}>Download PDF</button>
</div>
          </div>

          <div className="stats">
            <MetricCard icon="⭐" label="Stars" value={data.repo.stars} />
            <MetricCard icon="🍴" label="Forks" value={data.repo.forks} />
            <MetricCard icon="⚠️" label="Open Issues" value={data.repo.open_issues} />
            <MetricCard icon="📁" label="Files" value={data.repo.total_files} />
          </div>

          <section className="overall glass-hover">
            <div>
              <span className="section-kicker">Repository Health</span>
              <h2>Overall AI Score</h2>
              <p>{data.review.health_summary || data.review.summary}</p>
            </div>

            <div className="score-orbit">
              <div className="big-score">{data.review.overall_score}</div>
            </div>

            <div className="health-pills">
              <span>Debt: {data.review.technical_debt_level}</span>
              <span>{checklistCount}/8 checklist passed</span>
              <span>{data.review.recruiter_score}/100 recruiter score</span>
            </div>
          </section>

          <div className="score-grid">
            <ScoreCard title="Architecture" score={data.review.architecture_score} />
            <ScoreCard title="Security" score={data.review.security_score} />
            <ScoreCard title="Performance" score={data.review.performance_score} />
            <ScoreCard title="Maintainability" score={data.review.maintainability_score} />
            <ScoreCard title="Documentation" score={data.review.documentation_score} />
            <ScoreCard title="Recruiter Score" score={data.review.recruiter_score} />
          </div>

          <section className="panel glass-hover">
            <span className="section-kicker">Stack Intelligence</span>
            <h2>Detected Tech Stack</h2>
            <div className="chips">
              {(data.review.tech_stack || []).map((tech, i) => <span key={i}>{tech}</span>)}
            </div>
          </section>

          <section className="panel glass-hover">
            <span className="section-kicker">Objective Signals</span>
            <h2>Engineering Checklist</h2>
            <div className="checklist">
              {Object.entries(data.repo.engineering_checklist || {}).map(([key, value]) => (
                <div className={value ? "check pass" : "check fail"} key={key}>
                  <span>{value ? "✅" : "❌"}</span>
                  <p>{key}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel glass-hover">
            <span className="section-kicker">System Design</span>
            <h2>Architecture Review</h2>
            <h3>{data.review.architecture?.pattern}</h3>
            <p>{data.review.architecture?.explanation}</p>

            <div className="diagram">
              {(data.review.architecture?.diagram || []).map((item, i) => (
                <span key={i}>{item}</span>
              ))}
            </div>
          </section>

          <section className="panel glass-hover">
            <span className="section-kicker">Code Surface</span>
            <h2>Files Analyzed</h2>
            <div className="file-grid">
              {(data.repo.files_analyzed || []).map((file, i) => <span key={i}>{file}</span>)}
            </div>
          </section>

          <section className="panel glass-hover">
            <span className="section-kicker">Risk Radar</span>
            <h2>Critical Issues</h2>

            <div className="issues">
              {(data.review.issues || []).map((issue, i) => (
                <div className="issue" key={i}>
                  <span className={`severity ${String(issue.severity || "medium").toLowerCase()}`}>
                    {issue.severity}
                  </span>
                  <h3>{issue.title}</h3>
                  <small>{issue.file}</small>
                  <p>{issue.description}</p>
                  <b>Fix:</b> {issue.recommendation}
                </div>
              ))}
            </div>
          </section>

          <section className="panel glass-hover">
            <span className="section-kicker">Actionable AI Output</span>
            <h2>AI Fix Suggestions</h2>

            <div className="issues">
              {(data.review.ai_fix_suggestions || []).map((fix, i) => (
                <div className="issue fix-card" key={i}>
                  <h3>{fix.problem}</h3>
                  <small>{fix.file}</small>
                  <p>{fix.suggested_fix}</p>

                  {fix.example_code && (
                    <pre className="code-block">{fix.example_code}</pre>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="panel columns glass-hover">
            <div>
              <span className="section-kicker">Positive Signals</span>
              <h2>Strengths</h2>
              {(data.review.strengths || []).map((x, i) => <p key={i}>✅ {x}</p>)}
            </div>

            <div>
              <span className="section-kicker">Engineering Improvements</span>
              <h2>Refactoring</h2>
              {(data.review.refactoring_suggestions || []).map((x, i) => <p key={i}>🔧 {x}</p>)}
            </div>
          </section>

          <section className="panel columns glass-hover">
            <div>
              <span className="section-kicker">Protection</span>
              <h2>Security Suggestions</h2>
              {(data.review.security_suggestions || []).map((x, i) => <p key={i}>🛡 {x}</p>)}
            </div>

            <div>
              <span className="section-kicker">Speed</span>
              <h2>Performance Suggestions</h2>
              {(data.review.performance_suggestions || []).map((x, i) => <p key={i}>⚡ {x}</p>)}
            </div>
          </section>

          <section className="panel glass-hover">
            <span className="section-kicker">Hiring Lens</span>
            <h2>Recruiter Perspective</h2>
            <h3>
              {data.review.recruiter_feedback?.impresses_recruiters
                ? "✅ Recruiter Friendly Project"
                : "⚠️ Needs Improvement"}
            </h3>
            <p>{data.review.recruiter_feedback?.reason}</p>

            <div className="chips">
              {(data.review.recruiter_feedback?.improvements || []).map((item, i) => (
                <span key={i}>{item}</span>
              ))}
            </div>
          </section>

          <section className="final glass-hover">
            <span className="section-kicker">Conclusion</span>
            <h2>Final Verdict</h2>
            <p>{data.review.final_verdict}</p>
          </section>
        </main>
      )}

      {compareData && (
        <main className="dashboard">
          <div className="repo-card glass-hover">
            <div>
              <span className="section-kicker">Repository Comparison</span>
              <h2>{compareData.repo_a.name} vs {compareData.repo_b.name}</h2>
              <p>{compareData.result.summary}</p>
            </div>
            <button onClick={downloadCompareReport}>Download Compare Report</button>
          </div>

          <section className="compare-winner glass-hover">
            <span className="section-kicker">Winner</span>
            <h2>{compareData.result.winner}</h2>

            <div className="compare-score">
              <div>
                <p>{compareData.repo_a.name}</p>
                <b>{compareData.result.repo_a_score}/100</b>
              </div>
              <div>
                <p>{compareData.repo_b.name}</p>
                <b>{compareData.result.repo_b_score}/100</b>
              </div>
            </div>
          </section>

          <section className="panel glass-hover">
            <span className="section-kicker">Category Battle</span>
            <h2>Comparison Matrix</h2>

            <div className="comparison-list">
              {(compareData.result.comparison || []).map((item, i) => (
                <div className="comparison-row" key={i}>
                  <div>
                    <h3>{item.category}</h3>
                    <p>{item.reason}</p>
                  </div>

                  <div className="mini-scores">
                    <span>Repo A: {item.repo_a}</span>
                    <span>Repo B: {item.repo_b}</span>
                    <b>{item.winner}</b>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel columns glass-hover">
            <div>
              <h2>Repo A Strengths</h2>
              {(compareData.result.repo_a_strengths || []).map((x, i) => <p key={i}>✅ {x}</p>)}
            </div>

            <div>
              <h2>Repo B Strengths</h2>
              {(compareData.result.repo_b_strengths || []).map((x, i) => <p key={i}>✅ {x}</p>)}
            </div>
          </section>

          <section className="panel columns glass-hover">
            <div>
              <h2>Repo A Improvements</h2>
              {(compareData.result.repo_a_improvements || []).map((x, i) => <p key={i}>🔧 {x}</p>)}
            </div>

            <div>
              <h2>Repo B Improvements</h2>
              {(compareData.result.repo_b_improvements || []).map((x, i) => <p key={i}>🔧 {x}</p>)}
            </div>
          </section>

          <section className="final glass-hover">
            <span className="section-kicker">Final Recommendation</span>
            <h2>What should improve?</h2>
            <p>{compareData.result.final_recommendation}</p>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;