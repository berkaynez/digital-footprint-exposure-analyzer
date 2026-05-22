import { useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5053'

const getRiskLevelBadge = (score) => {
  if (score <= 30) return { label: 'Low', cls: 'badge--low' }
  if (score <= 60) return { label: 'Medium', cls: 'badge--medium' }
  if (score <= 80) return { label: 'High', cls: 'badge--high' }
  return { label: 'Critical', cls: 'badge--critical' }
}

const getBannerInfo = (score) => {
  if (score <= 30) return { label: '✅ Low risk footprint', cls: 'alertBanner--low' }
  if (score <= 60) return { label: '⚠️ Moderate risk detected', cls: 'alertBanner--medium' }
  return { label: '⚠️ Immediate action recommended', cls: 'alertBanner--high' }
}

const getInsightText = (score) => {
  if (score >= 80) return "This profile shows a critical digital exposure level. Email breach history combined with username reuse may increase account correlation and targeted attack risk.";
  if (score >= 60) return "This profile shows a high digital exposure level. Review exposed accounts and reduce username reuse across platforms.";
  if (score >= 30) return "This profile shows a moderate exposure level. Some public signals were detected, but immediate critical exposure is limited.";
  return "This profile shows a low exposure level based on available public signals.";
}

function App() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [view, setView] = useState('home')
  const [analysisStatus, setAnalysisStatus] = useState({ state: 'idle' })
  const [formError, setFormError] = useState('')
  const [showAllSources, setShowAllSources] = useState(false)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    // Fire-and-forget health check to wake up the backend (e.g. Render free tier)
    fetch(`${API_BASE_URL}/api/health`).catch(() => {})
  }, [])

  const toPercent = (score) => `${Math.round(Number(score) * 100)}%`

  const navigate = (newView, hashId) => {
    setView(newView)
    if (hashId) {
      setTimeout(() => {
        document.getElementById(hashId)?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    } else {
      window.scrollTo(0, 0)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setFormError('')

    const trimmedEmail = email.trim()
    const trimmedUsername = username.trim()

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.')
      return
    }
    if (!trimmedUsername) {
      setFormError('Please enter a username.')
      return
    }

    navigate('results')
    setAnalysisStatus({ state: 'loading' })
    setShowAllSources(false)

    try {
      const res = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, username: trimmedUsername }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setAnalysisStatus({ state: 'success', data: json })
    } catch (err) {
      setAnalysisStatus({
        state: 'error',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const handleNewScan = () => {
    setEmail('')
    setUsername('')
    setFormError('')
    setAnalysisStatus({ state: 'idle' })
    navigate('scan')
  }

  return (
    <>
      <nav className="topNav">
        <div className="navContainer">
          <a href="#home" className="navLogo" onClick={(e) => { e.preventDefault(); navigate('home') }}>FootprintGuard</a>
          <div className="navLinks">
            <a href="#scan" className="navLink" onClick={(e) => { e.preventDefault(); navigate('scan') }}>Scan</a>
            <a href="#how-it-works" className="navLink" onClick={(e) => { e.preventDefault(); navigate('home', 'how-it-works') }}>How it works</a>
            <a href="#faq" className="navLink" onClick={(e) => { e.preventDefault(); navigate('home', 'faq') }}>FAQ</a>
            <a href="#privacy" className="navLink" onClick={(e) => { e.preventDefault(); document.getElementById('privacy')?.scrollIntoView({ behavior: 'smooth' }) }}>Privacy</a>
            {analysisStatus.state !== 'idle' && <button onClick={handleNewScan} className="navLink" style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: 'var(--accent)' }}>New scan</button>}
            <button className="themeToggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>
      </nav>

      {view === 'home' && (
        <main className="container">
          <header id="home" className="heroContainer">
            <h1 className="heroTitle">Understand your public digital exposure</h1>
            <p className="heroSubtitle">Check email breach signals and username reuse patterns without displaying leaked passwords.</p>
            <div className="heroActions">
              <a href="#scan" className="heroButtonPrimary" onClick={(e) => { e.preventDefault(); navigate('scan') }}>Start scan</a>
              <a href="#how-it-works" className="heroButtonSecondary" onClick={(e) => { e.preventDefault(); navigate('home', 'how-it-works') }}>How it works</a>
            </div>
            <div className="heroTrustRow">
              <span>Private by default</span>
              <span>Real-time analysis</span>
              <span>Metadata only</span>
            </div>
          </header>

          <section id="how-it-works" className="infoSection">
            <h2 className="title" style={{ fontSize: '22px' }}>How it works</h2>
            <p className="subtitle">Three simple steps to understand your exposure.</p>
            <div className="stepsGrid">
              <div className="stepCard">
                <div className="stepNumber">1</div>
                <h3 className="stepTitle">Enter your details</h3>
                <p className="stepDesc">Provide an email and username. We only use these to query public breach databases and social metadata.</p>
              </div>
              <div className="stepCard">
                <div className="stepNumber">2</div>
                <h3 className="stepTitle">We check public signals</h3>
                <p className="stepDesc">Our engine cross-references your details against known data breaches and checks username availability across platforms.</p>
              </div>
              <div className="stepCard">
                <div className="stepNumber">3</div>
                <h3 className="stepTitle">Get your risk score</h3>
                <p className="stepDesc">Receive a comprehensive digital exposure score and actionable recommendations to secure your online presence.</p>
              </div>
            </div>
          </section>

          <section id="faq" className="faqSection">
            <h2 className="title" style={{ fontSize: '22px', marginBottom: '24px' }}>Frequently Asked Questions</h2>
            <div className="faqItem">
              <h3 className="faqQuestion">Do you store my scan results?</h3>
              <p className="faqAnswer">No. This prototype is private by default. We do not save or log your email, username, or scan history.</p>
            </div>
            <div className="faqItem">
              <h3 className="faqQuestion">Do you show leaked passwords?</h3>
              <p className="faqAnswer">Absolutely not. We only indicate if your email was involved in a known breach to help you assess your risk, but we never display or request sensitive passwords.</p>
            </div>
            <div className="faqItem">
              <h3 className="faqQuestion">What does the score mean?</h3>
              <p className="faqAnswer">The score is a relative indicator based on public data signals, such as known breaches and username availability across platforms. It helps you understand how easily your online presence can be correlated.</p>
            </div>
          </section>
        </main>
      )}

      {view === 'scan' && (
        <main className="container" id="scan">
          <section className="scanFormWrapper">
            <header className="header" style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 className="title" style={{ fontSize: '24px' }}>Run a footprint scan</h2>
              <p className="subtitle" style={{ fontSize: '15px' }}>Enter an email and username to generate a real-time exposure summary.</p>
            </header>

            <div className="card">
              <form className="form" onSubmit={onSubmit}>
                <label className="field">
                  <span className="labelText">Email</span>
                  <input
                    className="input"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>

                <label className="field">
                  <span className="labelText">Username</span>
                  <input
                    className="input"
                    type="text"
                    autoComplete="username"
                    placeholder="your_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </label>

                <button className="button" type="submit">
                  Submit
                </button>
                {formError && <p style={{ color: 'var(--color-error)', fontSize: '14px', marginTop: '12px', textAlign: 'center' }}>{formError}</p>}
                <p style={{ fontSize: '13px', opacity: 0.7, textAlign: 'center', marginTop: '16px', color: 'var(--text)' }}>We do not display leaked passwords. Results are based on public metadata.</p>
              </form>

              <div className="trustBadges">
                <span className="trustBadge">🔒 Private by default</span>
                <span className="trustBadge">⚡️ Real-time analysis</span>
                <span className="trustBadge">🛡️ Metadata only</span>
              </div>
            </div>
          </section>
        </main>
      )}

      {view === 'results' && (
        <main className="container">
          <div className="result">
            {analysisStatus.state === 'loading' && (
              <div className="loadingCard">
                <div className="spinner"></div>
                <h3 className="title" style={{ fontSize: '20px' }}>Scanning public exposure signals...</h3>
                <div className="loadingSteps">
                  <div className="loadingStep"><span>🔍</span> Checking email exposure</div>
                  <div className="loadingStep"><span>👤</span> Analyzing username reuse</div>
                  <div className="loadingStep"><span>📊</span> Preparing recommendations</div>
                </div>
              </div>
            )}

            {analysisStatus.state === 'error' && (
              <div className="dashboardCard" style={{ textAlign: 'center', borderColor: 'var(--alert-high-border)', background: 'var(--alert-high-bg)', marginTop: '16px' }}>
                <h3 style={{ color: 'var(--alert-high-text)', marginBottom: '8px' }}>⚠️ Analysis Failed</h3>
                <p style={{ opacity: 0.9 }}>{analysisStatus.error || 'An unexpected error occurred while communicating with the server.'}</p>
                <button onClick={handleNewScan} className="button" style={{ marginTop: '16px', maxWidth: '200px' }}>Try again</button>
              </div>
            )}

            <div className="variations">
                {analysisStatus.data?.summary && (
                  <>
                    <div className="scanSummaryCard">
                      <div className="scanSummaryInfo">
                        <span className="scanSummaryLabel">Scan Summary</span>
                        <div className="scanSummaryValues">
                          {email} <span style={{ opacity: 0.5, margin: '0 6px' }}>•</span> {username}
                        </div>
                      </div>
                      <button onClick={handleNewScan} className="btnNewScan">
                        Run new scan
                      </button>
                    </div>

                    {(() => {
                      const banner = getBannerInfo(analysisStatus.data.summary.digitalExposureScore);
                      return (
                        <div className={`alertBanner ${banner.cls}`}>
                          {banner.label}
                        </div>
                      )
                    })()}
                    
                    <div className="dashboardCard" style={{ textAlign: 'center', padding: '32px 20px', marginBottom: '24px', background: 'var(--hero-gradient)' }}>
                      <h4 className="sectionTitle" style={{ borderBottom: 'none', marginBottom: '8px' }}>Overall Digital Exposure</h4>
                      {(() => {
                        const riskBadge = getRiskLevelBadge(analysisStatus.data.summary.digitalExposureScore);
                        const progressColor = riskBadge.label === 'Critical' || riskBadge.label === 'High' ? 'rgba(248, 113, 113, 0.8)' : riskBadge.label === 'Medium' ? 'rgba(251, 191, 36, 0.8)' : 'rgba(148, 163, 184, 0.8)';
                        return (
                          <>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                              <span className="heroScoreText" style={{ fontSize: '56px' }}>{analysisStatus.data.summary.digitalExposureScore}</span>
                              <span className={`badge ${riskBadge.cls}`} style={{ fontSize: '14px', padding: '6px 14px' }}>{riskBadge.label} Risk</span>
                            </div>
                            <div className="progressBarContainer" style={{ maxWidth: '300px', margin: '20px auto' }}>
                              <div className="progressBarFill" style={{ width: `${analysisStatus.data.summary.digitalExposureScore}%`, background: progressColor }}></div>
                            </div>
                            <p style={{ margin: '16px auto 0', maxWidth: '400px', fontSize: '0.95em', lineHeight: 1.5, opacity: 0.85 }}>
                              {getInsightText(analysisStatus.data.summary.digitalExposureScore)}
                            </p>
                          </>
                        )
                      })()}
                    </div>

                    <div className="dashboardStack">

                      <div className="dashboardCard">
                        <h4 className="sectionTitle">Email Exposure</h4>
                        <dl className="kv">
                          <div className="kvRow" style={{ gridTemplateColumns: '1fr', padding: 0 }}>
                            <dd>
                              {analysisStatus.data.emailExposure ? (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ marginBottom: '6px' }}>
                                    {analysisStatus.data.emailExposure.error ? (
                                      'Check unavailable'
                                    ) : analysisStatus.data.emailExposure.found ? (
                                      <span style={{ color: 'var(--color-error)' }}>{analysisStatus.data.emailExposure.breachCount} possible breaches found</span>
                                    ) : (
                                      <span style={{ color: 'var(--color-success)' }}>No public breach exposure found</span>
                                    )}
                                  </span>
                                  {analysisStatus.data.emailExposure.sources?.length > 0 && (
                                    <span style={{ fontSize: '0.9em', marginTop: '4px' }}>
                                      Sources:{' '}
                                      {(() => {
                                        const sources = analysisStatus.data.emailExposure.sources;
                                        const visibleSources = showAllSources ? sources : sources.slice(0, 5);
                                        const hiddenCount = sources.length - 5;
                                        return (
                                          <>
                                            {visibleSources.map(s => `${s.name} (${s.date || 'unknown'})`).join(', ')}
                                            {hiddenCount > 0 && (
                                              <button 
                                                type="button"
                                                onClick={() => setShowAllSources(!showAllSources)}
                                                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0, marginLeft: '4px', textDecoration: 'underline', fontSize: 'inherit' }}
                                              >
                                                {showAllSources ? 'Show less' : `Show ${hiddenCount} more`}
                                              </button>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </span>
                                  )}
                                  {analysisStatus.data.emailExposure.exposedFields?.length > 0 && (
                                    <span style={{ fontSize: '0.9em', marginTop: '6px' }}>
                                      Exposed data: {analysisStatus.data.emailExposure.exposedFields.map(f => f.toLowerCase() === 'password' ? 'credentials' : f).join(', ')}
                                    </span>
                                  )}
                                </div>
                              ) : 'Pending...'}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="dashboardCard">
                        <h4 className="sectionTitle">Username Intelligence</h4>
                        <dl className="kv">
                          <div className="kvRow">
                            <dt>Reuse Risk</dt>
                            <dd>{analysisStatus.data.summary.usernameReuseRiskScore}/100</dd>
                          </div>
                          <div className="kvRow">
                            <dt>Matches</dt>
                            <dd>{analysisStatus.data.summary.verifiedMatchCount} Ver., {analysisStatus.data.summary.simulatedMatchCount} Sim.</dd>
                          </div>
                          <div className="kvRow">
                            <dt>Variations</dt>
                            <dd style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              <span className="badge badge--high">{analysisStatus.data.summary.highRiskCount} H</span>
                              <span className="badge badge--medium">{analysisStatus.data.summary.mediumRiskCount} M</span>
                              <span className="badge badge--low">{analysisStatus.data.summary.lowRiskCount} L</span>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </>
                )}

                {analysisStatus.data?.recommendations?.length > 0 && (
                  <div className="recommendations" style={{ marginBottom: '1.5rem' }}>
                    <h3 className="resultTitle">Recommendations</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {analysisStatus.data.recommendations.map((rec, idx) => {
                        const actionText = rec.severity === 'high' ? 'Fix Now' : rec.severity === 'medium' ? 'Improve Security' : 'Optional';
                        const shortDescription = rec.description.split('.')[0] + '.';
                        return (
                          <li key={idx} style={{ padding: '0.75rem', borderLeft: `3px solid var(--color-${rec.severity === 'high' ? 'error' : rec.severity === 'medium' ? 'warning' : 'primary'})`, background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                            <div className="recommendationHeader">
                              <span className={`actionLabel actionLabel--${rec.severity}`}>{actionText}</span>
                              <strong style={{ fontSize: '0.95em' }}>{rec.title}</strong>
                            </div>
                            <p style={{ margin: 0, opacity: 0.75, fontSize: '0.85em', lineHeight: 1.4 }}>{shortDescription}</p>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {analysisStatus.state === 'success' && (
                  <div className="dashboardCard" id="next-steps" style={{ marginBottom: '1.5rem' }}>
                    <h4 className="sectionTitle" style={{ borderBottom: 'none', marginBottom: '8px' }}>Security Journey</h4>
                    <p style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '12px' }}>Next steps to improve your digital security:</p>
                    <ul className="checklist">
                      <li className="checklistItem"><span className="checkIcon">✔</span> Change exposed passwords</li>
                      <li className="checklistItem"><span className="checkIcon">✔</span> Enable two-factor authentication (2FA)</li>
                      <li className="checklistItem"><span className="checkIcon">✔</span> Review reused usernames across platforms</li>
                      <li className="checklistItem"><span className="checkIcon">✔</span> Monitor future exposure</li>
                    </ul>
                  </div>
                )}

                {analysisStatus.state === 'success' && analysisStatus.data?.originalUsernameAnalysis && (
                  <div className="dashboardCard" style={{ marginBottom: '1.5rem' }}>
                    <h4 className="sectionTitle" style={{ borderBottom: 'none', marginBottom: '12px' }}>Original Username</h4>
                    {(() => {
                      const analysis = analysisStatus.data.originalUsernameAnalysis;
                      const platforms = Array.isArray(analysis.platforms) ? analysis.platforms.filter((p) => p && typeof p.name === 'string') : [];
                      const matchedPlatforms = platforms
                        .filter((p) => p.found === true && !p.error)
                        .map((p) => {
                          if (p.verified) return `${p.name} (verified)`;
                          return `${p.name} (simulated)`;
                        });
                      
                      return (
                        <div className="compactResultItem" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <div className="resultRow" style={{ gap: '8px' }}>
                            <code className="inlineCode" style={{ fontSize: '14px', fontWeight: 'bold' }}>{analysis.username}</code>
                          </div>
                          <div className="platformMatches" style={{ marginTop: '8px', fontSize: '13px' }}>
                            {matchedPlatforms.length ? (
                              <>
                                <span className="platformLabel">Matches:</span> <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{matchedPlatforms.join(', ')}</span>
                              </>
                            ) : (
                              <span style={{ opacity: 0.7 }}>No platform matches found for the original username.</span>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {analysisStatus.state === 'success' && (
                  <details className="variationsDetails">
                    <summary>Similar Username Variations</summary>
                    <div className="detailsContent">
                      <>
                        {analysisStatus.data?.results?.length ? (
                          <ul className="variationList" style={{ marginTop: '16px' }}>
                            {analysisStatus.data.results.map((r) => {
                              const platforms = Array.isArray(r.platforms)
                                ? r.platforms.filter(
                                    (p) => p && typeof p.name === 'string',
                                  )
                                : []

                              const matchedPlatforms = platforms
                                .filter((p) => p.found === true && !p.error)
                                .map((p) => {
                                  if (p.verified) return `${p.name} (verified)`
                                  return `${p.name} (simulated)`
                                })

                              return (
                                <li key={r.username} className="compactResultItem">
                                  <div className="resultRow" style={{ gap: '8px' }}>
                                    <code className="inlineCode" style={{ fontSize: '12px' }}>{r.username}</code>
                                    <span className="percent" style={{ fontSize: '12px' }}>
                                      {toPercent(r.similarity)}
                                    </span>
                                    <span className={`badge badge--${r.risk}`} style={{ padding: '2px 6px', fontSize: '10px' }}>
                                      {r.risk}
                                    </span>
                                  </div>

                                  <div className="platformMatches" style={{ marginTop: '4px', fontSize: '12px' }}>
                                    {matchedPlatforms.length ? (
                                      <>
                                        <span className="platformLabel">Matches:</span> {matchedPlatforms.join(', ')}
                                      </>
                                    ) : (
                                      'No matches'
                                    )}
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        ) : (
                          <p style={{ opacity: 0.8, marginTop: '16px' }}>No results.</p>
                        )}
                      </>
                    </div>
                  </details>
                )}
              </div>
          </div>
        </main>
      )}
      <footer id="privacy" className="footer">
        <p><strong>FootprintGuard Beta</strong></p>
        <p>Privacy-first prototype &middot; Academic research &middot; Product development</p>
        <p style={{ opacity: 0.7, marginTop: '8px' }}>No passwords displayed &middot; Metadata-only analysis</p>
      </footer>
    </>
  )
}

export default App
