import { useEffect, useState } from 'react'
import logoDark from './assets/personawatch-logo.png'
import logoLight from './assets/personawatch-logo-black.png'
import monogramDark from './assets/pw-monogram.png'
import monogramLight from './assets/pw-monogram-black.png'
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
  const [copyText, setCopyText] = useState('Copy summary')
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

  const handleCopySummary = async () => {
    if (analysisStatus.state !== 'success' || !analysisStatus.data) return;
    try {
      const data = analysisStatus.data;
      const summary = data.summary;
      const originalAnalysis = data.originalUsernameAnalysis;
      const emailExp = data.emailExposure;

      const riskBadge = getRiskLevelBadge(summary.digitalExposureScore);
      const emailExpText = emailExp?.error ? 'Check unavailable' : emailExp?.found ? `${emailExp.breachCount} breaches found` : '0 breaches found';
      
      const originalPlatforms = (originalAnalysis?.platforms || [])
        .filter((p) => p.found === true && !p.error)
        .map((p) => p.signalType === 'public_signal' || p.signalType === 'restricted_public_signal' ? `${p.name} (public signal)` : `${p.name} (verified)`);
      const originalMatchesText = originalPlatforms.length > 0 ? originalPlatforms.join(', ') : 'None';

      const textBlob = `Digital Footprint Summary
-------------------------
Email: ${data.email}
Username: ${data.username}
Digital Exposure Score: ${summary.digitalExposureScore}
Risk Level: ${riskBadge.label}
Email Exposure Score: ${summary.emailExposureScore}
Username Exposure Score: ${summary.usernameExposureScore}
Email Breach Details: ${emailExpText}
Verified Matches: ${summary.verifiedMatchCount}
Public Signals: ${summary.publicSignalMatchCount}
Original Username Matches: ${originalMatchesText}`;

      await navigator.clipboard.writeText(textBlob);
      setCopyText('Copied');
      setTimeout(() => setCopyText('Copy summary'), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      setCopyText('Copy failed');
      setTimeout(() => setCopyText('Copy summary'), 2000);
    }
  };

  return (
    <>
      <nav className="topNav">
        <div className="navContainer">
          <a href="#home" className="navLogo" onClick={(e) => { e.preventDefault(); navigate('home') }}>
            <img src={theme === 'dark' ? logoDark : logoLight} alt="PersonaWatch" style={{ height: '38px', width: 'auto', objectFit: 'contain', display: 'block' }} />
          </a>
          <div className="navLinks">
            <a href="#home" className="navLink" onClick={(e) => { e.preventDefault(); navigate('home') }}>Home</a>
            <a href="#methodology" className="navLink" onClick={(e) => { e.preventDefault(); navigate('methodology') }}>Methodology</a>
            <a href="#privacy" className="navLink" onClick={(e) => { e.preventDefault(); navigate('privacy') }}>Privacy</a>
            <a href="#about" className="navLink" onClick={(e) => { e.preventDefault(); navigate('about') }}>About</a>
            <a href="#scan" className="navLink" onClick={(e) => { e.preventDefault(); navigate('scan') }} style={{ fontWeight: 600, color: 'var(--accent)' }}>New Scan</a>
            <button className="themeToggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>
      </nav>

      {view === 'home' && (
        <main className="container">
          <header id="home" className="heroContainer">
            <img src={theme === 'dark' ? monogramDark : monogramLight} alt="PersonaWatch Monogram" style={{ height: '64px', width: 'auto', marginBottom: '18px', display: 'block' }} />
            <h1 className="heroTitle">PersonaWatch</h1>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-h)', marginBottom: '16px', letterSpacing: '-0.5px' }}>Digital Exposure Intelligence Platform</h2>
            <p className="heroSubtitle" style={{ marginBottom: '40px' }}>Measure breach exposure, username reuse, and public account signals through a transparent scoring model.</p>
            <div className="heroButtons">
              <a href="#scan" className="heroButtonPrimary" onClick={(e) => { e.preventDefault(); navigate('scan') }}>Start scan</a>
              <a href="#methodology" className="heroButtonSecondary" onClick={(e) => { e.preventDefault(); navigate('methodology') }}>View methodology</a>
            </div>
            <div className="heroTrustRow">
              <span>Privacy-first</span>
              <span>Metadata-only</span>
              <span>No password collection</span>
            </div>
          </header>

          <section id="features" className="infoSection" style={{ marginBottom: '40px' }}>
            <h2 className="title" style={{ fontSize: '22px' }}>Platform Capabilities</h2>
            <div className="stepsGrid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="stepCard">
                <h3 className="stepTitle">Breach Intelligence</h3>
                <p className="stepDesc">Query known public breach databases to identify exposed email accounts and compromised fields.</p>
              </div>
              <div className="stepCard">
                <h3 className="stepTitle">Username Reuse</h3>
                <p className="stepDesc">Detect cross-platform username availability and map potential digital footprint overlap.</p>
              </div>
              <div className="stepCard">
                <h3 className="stepTitle">Public Signals</h3>
                <p className="stepDesc">Gather intelligence entirely from public endpoints without triggering authenticated security alerts.</p>
              </div>
              <div className="stepCard">
                <h3 className="stepTitle">Transparent Risk</h3>
                <p className="stepDesc">Analyze findings through a deterministic, math-driven scoring engine capped safely at 100.</p>
              </div>
            </div>
          </section>

          <section id="how-it-works" className="infoSection">
            <h2 className="title" style={{ fontSize: '22px' }}>How it works</h2>
            <div className="stepsGrid">
              <div className="stepCard">
                <div className="stepNumber">1</div>
                <h3 className="stepTitle">Identity Analysis</h3>
                <p className="stepDesc">Submit a username and email to initiate a silent footprinting scan across public endpoints.</p>
              </div>
              <div className="stepCard">
                <div className="stepNumber">2</div>
                <h3 className="stepTitle">Exposure Correlation</h3>
                <p className="stepDesc">The platform correlates identified breach records and verified social platform matches.</p>
              </div>
              <div className="stepCard">
                <div className="stepNumber">3</div>
                <h3 className="stepTitle">Risk Assessment</h3>
                <p className="stepDesc">A weighted algorithm calculates distinct Email and Username Exposure scores to formulate a final threat level.</p>
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
              <p className="faqAnswer">The Digital Exposure Score is calculated from two components: Email Exposure Score and Username Exposure Score. Email exposure contributes 55% of the final score, while username exposure contributes 45%. This helps separate direct breach history from cross-platform visibility and identity correlation.</p>
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
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleCopySummary} className="btnNewScan" style={{ background: 'var(--bg-body)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                          {copyText}
                        </button>
                        <button onClick={handleNewScan} className="btnNewScan">
                          Run new scan
                        </button>
                      </div>
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
                          <div className="kvRow">
                            <dt>Email Score</dt>
                            <dd>{analysisStatus.data.summary.emailExposureScore}/100</dd>
                          </div>
                          <div className="kvRow" style={{ gridTemplateColumns: '1fr', padding: 0 }}>
                            <dd>
                              {analysisStatus.data.emailExposure ? (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ marginBottom: '6px' }}>
                                    {analysisStatus.data.emailExposure.error ? (
                                      'Check unavailable'
                                    ) : analysisStatus.data.emailExposure.found ? (
                                      <span style={{ color: 'var(--color-error)' }}>{analysisStatus.data.emailExposure.breachCount} breaches found</span>
                                    ) : (
                                      <span style={{ color: 'var(--color-success)' }}>0 breaches found</span>
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
                            <dt>Username Score</dt>
                            <dd>{analysisStatus.data.summary.usernameExposureScore}/100</dd>
                          </div>
                          <div className="kvRow">
                            <dt>Verified Matches</dt>
                            <dd>{analysisStatus.data.summary.verifiedMatchCount}</dd>
                          </div>
                          <div className="kvRow">
                            <dt>Public Signals</dt>
                            <dd>{analysisStatus.data.summary.publicSignalMatchCount}</dd>
                          </div>
                          <div className="kvRow">
                            <dt>Variations</dt>
                            <dd style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              <span className="badge badge--high">{analysisStatus.data.summary.highRiskCount} Close</span>
                              <span className="badge badge--medium">{analysisStatus.data.summary.mediumRiskCount} Partial</span>
                              <span className="badge badge--low">{analysisStatus.data.summary.lowRiskCount} Weak</span>
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="dashboardCard" style={{ gridColumn: '1 / -1', background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
                        <h4 className="sectionTitle">Why This Score?</h4>
                        <p style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--color-secondary)' }}>The Digital Exposure Score mathematically blends your raw exposure levels across two key vectors.</p>
                        <dl className="kv" style={{ gridTemplateColumns: '1fr 1fr' }}>
                          <div className="kvRow" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <dt style={{ width: '100%' }}>Email Exposure (55%)</dt>
                            <dd style={{ width: '100%', fontSize: '20px', fontWeight: '700', marginTop: '4px' }}>{analysisStatus.data.summary.emailExposureScore} / 100</dd>
                          </div>
                          <div className="kvRow" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <dt style={{ width: '100%' }}>Username Exposure (45%)</dt>
                            <dd style={{ width: '100%', fontSize: '20px', fontWeight: '700', marginTop: '4px' }}>{analysisStatus.data.summary.usernameExposureScore} / 100</dd>
                          </div>
                        </dl>
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                          <span style={{ fontSize: '15px', fontWeight: '600' }}>Overall Exposure: {analysisStatus.data.summary.digitalExposureScore} / 100</span>
                        </div>
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
                          <li key={idx} style={{ padding: '16px', borderLeft: `4px solid var(--color-${rec.severity === 'high' ? 'error' : rec.severity === 'medium' ? 'warning' : 'primary'})`, background: 'var(--card-bg)', borderTop: '1px solid var(--card-border)', borderRight: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)', borderRadius: '8px' }}>
                            <div className="recommendationHeader" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <span className={`actionLabel actionLabel--${rec.severity}`}>{actionText}</span>
                              <strong style={{ fontSize: '15px' }}>{rec.title}</strong>
                            </div>
                            <p style={{ margin: 0, opacity: 0.85, fontSize: '14px', lineHeight: 1.5 }}>{shortDescription}</p>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                <div className="disclaimer" style={{ marginTop: '48px', marginBottom: '48px', padding: '20px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.6', margin: 0, textAlign: 'center', opacity: 0.85 }}>
                    PersonaWatch is an academic research prototype. Results indicate public exposure signals and do not prove definitive account ownership.
                  </p>
                </div>

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
                          if (p.signalType === 'public_signal' || p.signalType === 'restricted_public_signal') return `${p.name} (public signal)`;
                          return `${p.name} (verified)`;
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
                    <summary>
                      <span>Generated Username Variations</span>
                      <span className="badge badge--low" style={{ marginLeft: 'auto' }}>{analysisStatus.data?.results?.length || 0} variants</span>
                    </summary>
                    <div className="detailsContent">
                      <p style={{ fontSize: '13px', color: 'var(--text)', margin: '16px 0 12px 0', lineHeight: '1.5' }}>These are algorithmically generated username variants used to detect possible reuse patterns. Similarity labels describe closeness to the submitted username, not account ownership.</p>
                      <>
                        {analysisStatus.data?.results?.length ? (
                          <ul className="variationList" style={{ marginTop: '0' }}>
                            {analysisStatus.data.results.map((r, i) => {
                              const platforms = Array.isArray(r.platforms)
                                ? r.platforms.filter((p) => p && typeof p.name === 'string')
                                : [];

                              const matchedPlatforms = platforms
                                .filter((p) => p.found === true && !p.error)
                                .map((p) => {
                                  if (p.signalType === 'public_signal' || p.signalType === 'restricted_public_signal') return `${p.name} (public signal)`;
                                  return `${p.name} (verified)`;
                                });

                              const mapping = {
                                high: { label: 'Close match', cls: 'badge--high' },
                                medium: { label: 'Partial match', cls: 'badge--medium' },
                                low: { label: 'Weak match', cls: 'badge--low' }
                              };
                              const sim = mapping[r.risk] || mapping.low;

                              return (
                                <li key={r.username} className="compactResultItem" style={{ listStyle: 'none' }}>
                                  <div className="resultRow" style={{ gap: '8px', gridTemplateColumns: '1fr auto auto auto' }}>
                                    <code className="inlineCode" style={{ fontSize: '13px' }}>{r.username}</code>
                                    <span className={`badge ${sim.cls}`} style={{ padding: '2px 8px', fontSize: '11px' }}>
                                      {sim.label}
                                    </span>
                                    <span className="percent" style={{ fontSize: '13px' }}>
                                      {Math.round(r.similarity * 100)}%
                                    </span>
                                  </div>

                                  <div className="platformMatches" style={{ marginTop: '6px', fontSize: '13px' }}>
                                    {matchedPlatforms.length ? (
                                      <>
                                        <span className="platformLabel">Matches:</span> <span style={{ color: 'var(--text-h)' }}>{matchedPlatforms.join(', ')}</span>
                                      </>
                                    ) : (
                                      <span style={{ opacity: 0.6 }}>No platform matches</span>
                                    )}
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        ) : (
                          <p style={{ opacity: 0.8, marginTop: '16px' }}>No variations generated.</p>
                        )}
                      </>
                    </div>
                  </details>
                )}
              </div>
          </div>
        </main>
      )}
      {view === 'methodology' && (
        <main className="container" id="methodology">
          <section className="infoSection" style={{ borderTop: 'none', paddingTop: '0' }}>
            <header style={{ marginBottom: '32px', textAlign: 'center' }}>
              <h2 className="title" style={{ fontSize: '36px', marginBottom: '8px' }}>Methodology</h2>
              <p className="subtitle" style={{ fontSize: '16px' }}>How PersonaWatch calculates digital exposure.</p>
            </header>
            
            <div className="dashboardStack">
              <div className="card" style={{ marginTop: '0', textAlign: 'left' }}>
                <h3 className="cardTitle">1. Scoring Formula</h3>
                <p>The Digital Exposure Score is calculated using a weighted deterministic formula:</p>
                <div style={{ background: 'var(--code-bg)', padding: '16px', borderRadius: '8px', margin: '16px 0', fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--text-h)', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                  Digital Exposure Score =<br/>
                  (0.55 × Email Exposure Score) +<br/>
                  (0.45 × Username Exposure Score)
                </div>
                <p style={{ fontSize: '14px' }}>This ensures that email breaches (which carry inherently higher immediate risk) are prioritized slightly above username visibility.</p>
              </div>
              
              <div className="card" style={{ marginTop: '0', textAlign: 'left' }}>
                <h3 className="cardTitle">2. Provider Reliability Weights</h3>
                <p>Social platform matches are weighted by their technical reliability to prevent false positives from generic platform endpoints:</p>
                <ul style={{ paddingLeft: '24px', margin: '16px 0', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li><strong style={{ color: 'var(--text-h)' }}>Verified Providers (1.0)</strong>: Direct API integrations with definitive responses (e.g., GitHub, GitLab).</li>
                  <li><strong style={{ color: 'var(--text-h)' }}>Public Signals (0.4)</strong>: Heuristic scraping where HTTP redirects are used.</li>
                  <li><strong style={{ color: 'var(--text-h)' }}>Restricted Signals (0.25)</strong>: Platforms with anti-bot mechanisms where verification is highly uncertain.</li>
                </ul>
              </div>

              <div className="card" style={{ marginTop: '0', textAlign: 'left' }}>
                <h3 className="cardTitle">3. Candidate Dampening</h3>
                <p style={{ fontSize: '14px' }}>Generic or short username variations (e.g., 5 characters or less) are heavily mathematically dampened in the codebase. This ensures that extremely common names (like "admin" or "john") do not artificially inflate the risk score when they predictably match on highly populated public signals.</p>
              </div>

              <div className="card" style={{ marginTop: '0', textAlign: 'left' }}>
                <h3 className="cardTitle">4. Privacy Boundaries</h3>
                <p style={{ fontSize: '14px' }}>No user-authenticated OAuth flows are used to check signals. The methodology exclusively relies on scraping public URL patterns and referencing historically public breach records without persisting the results.</p>
              </div>
            </div>
          </section>
        </main>
      )}

      {view === 'privacy' && (
        <main className="container" id="privacy-page">
          <section className="infoSection" style={{ borderTop: 'none', paddingTop: '0' }}>
            <header style={{ marginBottom: '40px', textAlign: 'center' }}>
              <h2 className="title" style={{ fontSize: '36px', marginBottom: '12px' }}>Privacy-first by design</h2>
              <p className="subtitle" style={{ fontSize: '18px', maxWidth: '700px', margin: '0 auto', lineHeight: '1.5' }}>PersonaWatch analyzes exposure indicators without collecting passwords or storing scan history.</p>
            </header>
            
            <div className="dashboardStack">
              <div className="card" style={{ marginTop: '0', textAlign: 'left' }}>
                <h3 className="cardTitle">1. No password collection</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>We never ask for, retrieve, display, or store passwords.</p>
              </div>
              <div className="card" style={{ marginTop: '0', textAlign: 'left' }}>
                <h3 className="cardTitle">2. Metadata-only analysis</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>Results are limited to breach names, exposed field categories, match counts, and public signal indicators.</p>
              </div>
              <div className="card" style={{ marginTop: '0', textAlign: 'left' }}>
                <h3 className="cardTitle">3. No scan history stored</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>Scans are processed in memory and are not saved as user history.</p>
              </div>
              <div className="card" style={{ marginTop: '0', textAlign: 'left' }}>
                <h3 className="cardTitle">4. Third-party verification</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>External APIs may be queried to verify breach exposure and platform visibility.</p>
              </div>
            </div>
          </section>
        </main>
      )}

      {view === 'about' && (
        <main className="container" id="about">
          <section className="infoSection" style={{ borderTop: 'none', paddingTop: '0' }}>
            <header style={{ marginBottom: '40px', textAlign: 'center' }}>
              <h2 className="title" style={{ fontSize: '36px', marginBottom: '12px' }}>About PersonaWatch</h2>
              <p className="subtitle" style={{ fontSize: '18px', maxWidth: '700px', margin: '0 auto', lineHeight: '1.5' }}>A digital exposure intelligence platform developed as an academic research prototype.</p>
            </header>
            
            <div className="dashboardStack" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              <div className="card" style={{ marginTop: '0', textAlign: 'left' }}>
                <h3 className="cardTitle">Research purpose</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>PersonaWatch explores how breach intelligence and public account signals can be combined to measure digital exposure.</p>
              </div>
              <div className="card" style={{ marginTop: '0', textAlign: 'left' }}>
                <h3 className="cardTitle">Technical foundation</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>The system uses React, Node.js/Express, external APIs, and conservative public signal providers.</p>
              </div>
              <div className="card" style={{ marginTop: '0', textAlign: 'left' }}>
                <h3 className="cardTitle">Practical contribution</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>The platform translates scattered exposure indicators into understandable risk scores and actionable recommendations.</p>
              </div>
              <div className="card" style={{ marginTop: '0', textAlign: 'left' }}>
                <h3 className="cardTitle">Ethical boundary</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>PersonaWatch reports exposure indicators only and avoids storing or displaying sensitive personal content.</p>
              </div>
            </div>

            <div className="disclaimer" style={{ marginTop: '32px', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}>
              <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.5', margin: 0, textAlign: 'center', opacity: 0.8 }}>
                PersonaWatch is not a forensic identity verification system and does not prove account ownership.
              </p>
            </div>
          </section>
        </main>
      )}

      <footer className="footer">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px' }}>
          <img src={theme === 'dark' ? logoDark : logoLight} alt="PersonaWatch" style={{ height: '42px', width: 'auto', objectFit: 'contain', display: 'block' }} />
        </div>
        <p>Digital Exposure Intelligence Platform</p>
        <p>Academic Research Project &middot; Privacy-first design &middot; Metadata-only analysis</p>
      </footer>
    </>
  )
}

export default App
