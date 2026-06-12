import { useEffect, useState } from 'react'
import logoDark from './assets/personawatch-logo.png'
import logoLight from './assets/personawatch-logo-black.png'
import monogramDark from './assets/pw-monogram.png'
import monogramLight from './assets/pw-monogram-black.png'
import './App.css'
import { generatePDFReport } from './utils/pdfGenerator'

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

const getInsightText = (score, mode = 'full') => {
  const riskLevel = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 30 ? 'moderate' : 'low';
  if (mode === 'email') return `This email shows a ${riskLevel} exposure level based on public breach intelligence and exposed data categories.`;
  if (mode === 'username') return `This username shows a ${riskLevel} exposure level based on public platform visibility and reuse patterns.`;
  return `This profile shows a ${riskLevel} digital exposure level based on breach history and username visibility.`;
}

const useAnimatedNumber = (endValue, duration = 1000) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setValue(Math.floor(ease * endValue));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [endValue, duration]);

  return value;
};

const ProgressBar = ({ label, score }) => {
  const animatedScore = useAnimatedNumber(score);
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setFill(score), 50);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div style={{ marginBottom: '20px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-h)' }}>
        <span>{label}</span>
        <span>{animatedScore}/100</span>
      </div>
      <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${fill}%`,
            background: 'var(--accent)',
            transition: 'width 1s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        />
      </div>
    </div>
  );
};

const RiskGauge = ({ score }) => {
  const animatedScore = useAnimatedNumber(score);
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setFill(score), 50);
    return () => clearTimeout(timer);
  }, [score]);

  let label = 'Minimal';
  let color = '#3b82f6';
  if (score >= 25 && score <= 49) { label = 'Low'; color = '#10b981'; }
  else if (score >= 50 && score <= 69) { label = 'Moderate'; color = '#f59e0b'; }
  else if (score >= 70 && score <= 84) { label = 'High'; color = '#ea580c'; }
  else if (score >= 85) { label = 'Critical'; color = '#dc2626'; }

  const radius = 40;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (fill / 100) * circumference;

  return (
    <div style={{ textAlign: 'center', margin: '32px 0 24px 0', position: 'relative' }}>
      <svg viewBox="0 0 100 50" style={{ width: '220px', height: '110px', overflow: 'visible', margin: '0 auto' }}>
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="var(--border)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.25, 1, 0.5, 1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', bottom: '-15px', left: '0', right: '0', textAlign: 'center' }}>
        <div style={{ fontSize: '42px', fontWeight: '800', color: 'var(--text-h)', lineHeight: '1' }}>
          {animatedScore}
        </div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: color, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>
          {label} Risk
        </div>
      </div>
    </div>
  );
};

const ScoreLegend = () => {
  const bands = [
    { label: 'Minimal Risk', color: '#3b82f6' },
    { label: 'Low Risk', color: '#10b981' },
    { label: 'Moderate Risk', color: '#f59e0b' },
    { label: 'High Risk', color: '#ea580c' },
    { label: 'Critical Risk', color: '#dc2626' }
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)', fontSize: '13px' }}>
      {bands.map(b => (
        <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: b.color }} />
          <span style={{ color: 'var(--text)', fontWeight: '600' }}>{b.label}</span>
        </div>
      ))}
    </div>
  );
};

function App() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [scanMode, setScanMode] = useState('full')
  const [scanAcknowledgement, setScanAcknowledgement] = useState(false)
  const [view, setView] = useState('home')
  const [analysisStatus, setAnalysisStatus] = useState({ state: 'idle' })
  const [formError, setFormError] = useState('')
  const [copyText, setCopyText] = useState('Copy summary')
  const [showAllSources, setShowAllSources] = useState(false)
  const [pdfError, setPdfError] = useState('')
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

  const handleDownloadReport = () => {
    try {
      setPdfError('')
      generatePDFReport(analysisStatus.data)
    } catch (err) {
      setPdfError(err.message || String(err))
      console.error('PDF export failed:', err)
      alert(`PDF export failed: ${err.message || String(err)}`)
    }
  }

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

    if (!scanAcknowledgement) {
      setFormError('Please confirm the acknowledgement before starting the scan.')
      return
    }

    const trimmedEmail = email.trim()
    const trimmedUsername = username.trim()

    if ((scanMode === 'full' || scanMode === 'email') && (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))) {
      setFormError('Please enter a valid email address.')
      return
    }
    if ((scanMode === 'full' || scanMode === 'username') && !trimmedUsername) {
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
        body: JSON.stringify({ email: trimmedEmail, username: trimmedUsername, mode: scanMode }),
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
    setScanMode('full')
    setScanAcknowledgement(false)
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
Scan Scope: ${data.mode === 'email' ? 'Email Exposure Scan' : data.mode === 'username' ? 'Username Exposure Scan' : 'Full Scan'}
${data.mode !== 'username' ? `Email: ${data.email}\n` : ''}${data.mode !== 'email' ? `Username: ${data.username}\n` : ''}Digital Exposure Score: ${summary.digitalExposureScore}
Risk Level: ${riskBadge.label}
${data.mode === 'email' ? 'Overall Exposure = Email Exposure Score\n' : data.mode === 'username' ? 'Overall Exposure = Username Exposure Score\n' : 'Overall Exposure = 55% Email + 45% Username\n'}${data.mode !== 'username' ? `Email Exposure Score: ${summary.emailExposureScore}\nEmail Breach Details: ${emailExpText}\n` : ''}${data.mode !== 'email' ? `Username Exposure Score: ${summary.usernameExposureScore}\nVerified Matches: ${summary.verifiedMatchCount}\nPublic Signals: ${summary.publicSignalMatchCount}\nOriginal Username Matches: ${originalMatchesText}` : ''}`.trim();

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
          </div>
          <button className="themeToggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
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
                <p className="stepDesc">Submit a username and email to initiate a metadata-only exposure scan across public endpoints.</p>
              </div>
              <div className="stepCard">
                <div className="stepNumber">2</div>
                <h3 className="stepTitle">Exposure Correlation</h3>
                <p className="stepDesc">The platform correlates identified breach records and verified social platform matches.</p>
              </div>
              <div className="stepCard">
                <div className="stepNumber">3</div>
                <h3 className="stepTitle">Risk Assessment</h3>
                <p className="stepDesc">A weighted algorithm calculates distinct Email and Username Exposure scores to formulate a final risk level.</p>
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
              <p className="subtitle" style={{ fontSize: '15px' }}>Select a scan mode to generate a real-time exposure summary.</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div 
                onClick={() => setScanMode('full')}
                style={{ padding: '16px', border: `2px solid ${scanMode === 'full' ? 'var(--accent)' : 'var(--card-border)'}`, borderRadius: '8px', cursor: 'pointer', background: 'var(--card-bg)' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-h)' }}>Full Scan</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text)' }}>Comprehensive exposure analysis.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div 
                  onClick={() => setScanMode('email')}
                  style={{ padding: '16px', border: `2px solid ${scanMode === 'email' ? 'var(--accent)' : 'var(--card-border)'}`, borderRadius: '8px', cursor: 'pointer', background: 'var(--card-bg)' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-h)' }}>Email Exposure</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text)' }}>Analyze known breach exposure.</p>
                </div>
                <div 
                  onClick={() => setScanMode('username')}
                  style={{ padding: '16px', border: `2px solid ${scanMode === 'username' ? 'var(--accent)' : 'var(--card-border)'}`, borderRadius: '8px', cursor: 'pointer', background: 'var(--card-bg)' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-h)' }}>Username Exposure</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text)' }}>Analyze public username reuse and visibility.</p>
                </div>
              </div>
            </div>

            <div className="card">
              <form className="form" onSubmit={onSubmit}>
                {scanMode !== 'username' && (
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
                )}

                {scanMode !== 'email' && (
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
                )}

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', margin: '20px 0', textAlign: 'left', cursor: 'pointer' }}>
                  <input type="checkbox" checked={scanAcknowledgement} onChange={(e) => setScanAcknowledgement(e.target.checked)} required style={{ marginTop: '4px' }} />
                  <span style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.4' }}>I understand that PersonaWatch performs a metadata-only exposure analysis and that I should only scan identifiers I own or am authorized to check.</span>
                </label>

                <button className="button" type="submit">
                  Submit
                </button>
                {formError && <p style={{ color: 'var(--color-error)', fontSize: '14px', marginTop: '12px', textAlign: 'center' }}>{formError}</p>}
                <p style={{ fontSize: '13px', opacity: 0.7, textAlign: 'center', marginTop: '16px', color: 'var(--text)' }}>PersonaWatch does not prove account ownership and should not be used for harassment, stalking, or unauthorized profiling.</p>
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
                <h3 className="title" style={{ fontSize: '20px' }}>
                  {scanMode === 'full' ? 'Scanning public exposure signals...' : scanMode === 'email' ? 'Scanning email breach exposure...' : 'Scanning username visibility...'}
                </h3>
                <div className="loadingSteps">
                  {scanMode === 'full' && (
                    <>
                      <div className="loadingStep"><span>🔍</span> Checking email exposure</div>
                      <div className="loadingStep"><span>👤</span> Analyzing username reuse</div>
                      <div className="loadingStep"><span>📊</span> Preparing recommendations</div>
                    </>
                  )}
                  {scanMode === 'email' && (
                    <>
                      <div className="loadingStep"><span>🔍</span> Checking breach exposure</div>
                      <div className="loadingStep"><span>📋</span> Evaluating exposed data fields</div>
                      <div className="loadingStep"><span>🛡️</span> Preparing email security recommendations</div>
                    </>
                  )}
                  {scanMode === 'username' && (
                    <>
                      <div className="loadingStep"><span>📡</span> Checking public platform signals</div>
                      <div className="loadingStep"><span>👤</span> Analyzing username variations</div>
                      <div className="loadingStep"><span>📊</span> Preparing visibility recommendations</div>
                    </>
                  )}
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
                        <span className="scanSummaryLabel">Scan Summary ({analysisStatus.data.mode === 'email' ? 'Email Exposure Scan' : analysisStatus.data.mode === 'username' ? 'Username Exposure Scan' : 'Full Scan'})</span>
                        <div className="scanSummaryValues">
                          {analysisStatus.data.mode !== 'username' && email}
                          {analysisStatus.data.mode === 'full' && <span style={{ opacity: 0.5, margin: '0 6px' }}>•</span>}
                          {analysisStatus.data.mode !== 'email' && username}
                        </div>
                      </div>
                      <div className="scanSummaryActions">
                        {pdfError && <span style={{ color: 'var(--alert-high-text)', fontSize: '12px' }}>Export Error</span>}
                        <button onClick={handleDownloadReport} className="btnNewScan downloadReportBtn" style={{ background: 'var(--bg-body)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                          Download Report
                        </button>
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
                              {getInsightText(analysisStatus.data.summary.digitalExposureScore, analysisStatus.data.mode)}
                            </p>
                          </>
                        )
                      })()}
                    </div>

                                <div className="dashboardStack" style={analysisStatus.data.mode !== 'full' ? { gridTemplateColumns: '1fr' } : {}}>
                        {analysisStatus.data.mode !== 'username' && (
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
                      )}

                      {analysisStatus.data.mode !== 'email' && (
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
                      )}

                      <div className="dashboardCard" style={{ gridColumn: '1 / -1', background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
                        <h4 className="sectionTitle">Why This Score?</h4>
                        <p style={{ fontSize: '14px', marginBottom: '24px', color: 'var(--text)' }}>
                          {analysisStatus.data.mode === 'full' 
                            ? 'The Digital Exposure Score mathematically blends your exposure levels across two key vectors.'
                            : analysisStatus.data.mode === 'email'
                              ? 'This scan uses only the Email Exposure Score because username analysis was not selected.'
                              : 'This scan uses only the Username Exposure Score because email analysis was not selected.'}
                        </p>
                        
                        <RiskGauge score={analysisStatus.data.summary.digitalExposureScore} />

                        {analysisStatus.data.mode !== 'full' && (
                          <p style={{ fontSize: '14px', fontWeight: '600', marginTop: '24px', textAlign: 'center', color: 'var(--text-h)' }}>
                            Overall Exposure = {analysisStatus.data.mode === 'email' ? 'Email Exposure Score' : 'Username Exposure Score'}
                          </p>
                        )}

                        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                          {analysisStatus.data.mode !== 'username' && <ProgressBar label={analysisStatus.data.mode === 'full' ? "Email Exposure (55%)" : "Email Exposure Score"} score={analysisStatus.data.summary.emailExposureScore} />}
                          {analysisStatus.data.mode !== 'email' && <ProgressBar label={analysisStatus.data.mode === 'full' ? "Username Exposure (45%)" : "Username Exposure Score"} score={analysisStatus.data.summary.usernameExposureScore} />}
                        </div>

                        <ScoreLegend />
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
                      {analysisStatus.data.mode !== 'username' && (
                        <>
                          <li className="checklistItem"><span className="checkIcon">✔</span> Change exposed passwords</li>
                          <li className="checklistItem"><span className="checkIcon">✔</span> Enable two-factor authentication (2FA)</li>
                          {analysisStatus.data.mode === 'email' && (
                            <>
                              <li className="checklistItem"><span className="checkIcon">✔</span> Review affected services</li>
                              <li className="checklistItem"><span className="checkIcon">✔</span> Monitor future breach exposure</li>
                            </>
                          )}
                        </>
                      )}
                      
                      {analysisStatus.data.mode !== 'email' && (
                        <>
                          <li className="checklistItem"><span className="checkIcon">✔</span> Review reused usernames across platforms</li>
                          {analysisStatus.data.mode === 'username' && (
                            <>
                              <li className="checklistItem"><span className="checkIcon">✔</span> Separate public and private account identifiers</li>
                              <li className="checklistItem"><span className="checkIcon">✔</span> Reduce public profile discoverability where appropriate</li>
                              <li className="checklistItem"><span className="checkIcon">✔</span> Monitor public platform visibility</li>
                            </>
                          )}
                        </>
                      )}

                      {analysisStatus.data.mode === 'full' && (
                        <li className="checklistItem"><span className="checkIcon">✔</span> Monitor future exposure</li>
                      )}
                    </ul>
                  </div>
                )}

                {analysisStatus.state === 'success' && analysisStatus.data?.originalUsernameAnalysis && analysisStatus.data.mode !== 'email' && (
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

                {analysisStatus.state === 'success' && analysisStatus.data.mode !== 'email' && (
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
                  <li><strong style={{ color: 'var(--text-h)' }}>Public Signals (0.4)</strong>: Heuristic public signal checks where HTTP redirects are used.</li>
                  <li><strong style={{ color: 'var(--text-h)' }}>Restricted Signals (0.25)</strong>: Platforms with anti-bot mechanisms where verification is highly uncertain.</li>
                </ul>
              </div>

              <div className="card" style={{ marginTop: '0', textAlign: 'left' }}>
                <h3 className="cardTitle">3. Candidate Dampening</h3>
                <p style={{ fontSize: '14px' }}>Generic or short username variations (e.g., 5 characters or less) are heavily mathematically dampened in the codebase. This ensures that extremely common names (like "admin" or "john") do not artificially inflate the risk score when they predictably match on highly populated public signals.</p>
              </div>

              <div className="card" style={{ marginTop: '0', textAlign: 'left' }}>
                <h3 className="cardTitle">4. Privacy Boundaries</h3>
                <p style={{ fontSize: '14px' }}>No user-authenticated OAuth flows are used to check signals. The methodology exclusively relies on checking public URL patterns and referencing historically public breach records without persisting the results.</p>
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

            <header style={{ marginBottom: '24px', marginTop: '48px', textAlign: 'center' }}>
              <h2 className="title" style={{ fontSize: '28px', marginBottom: '8px' }}>Privacy Notice</h2>
            </header>
            <div className="card" style={{ textAlign: 'left', lineHeight: '1.6', fontSize: '14px', color: 'var(--text)' }}>
              <p style={{ marginBottom: '12px' }}>PersonaWatch processes the submitted email and/or username only for generating the selected scan result.</p>
              <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
                <li style={{ marginBottom: '6px' }}>PersonaWatch does not collect passwords.</li>
                <li style={{ marginBottom: '6px' }}>PersonaWatch does not display leaked passwords.</li>
                <li style={{ marginBottom: '6px' }}>PersonaWatch does not store scan history.</li>
                <li style={{ marginBottom: '6px' }}>PersonaWatch does not create user accounts.</li>
              </ul>
              <p style={{ marginBottom: '12px' }}>Analysis is metadata-only. Third-party APIs and public endpoints may be queried to verify breach exposure and platform visibility. Results are generated strictly for awareness and academic research purposes.</p>
              <p>Users should only scan their own identifiers or identifiers they are authorized to check.</p>
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
            
            <div className="dashboardStack">
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
