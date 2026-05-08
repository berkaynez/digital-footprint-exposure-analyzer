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
  const [apiStatus, setApiStatus] = useState({ state: 'idle' })
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [submitted, setSubmitted] = useState(null)
  const [analysisStatus, setAnalysisStatus] = useState({ state: 'idle' })
  const [showAllSources, setShowAllSources] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setApiStatus({ state: 'loading' })

      try {
        const res = await fetch(`${API_BASE_URL}/api/health`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (cancelled) return
        setApiStatus({ state: 'success', data: json })
      } catch (err) {
        if (cancelled) return
        setApiStatus({
          state: 'error',
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  const toPercent = (score) => `${Math.round(Number(score) * 100)}%`

  async function onSubmit(e) {
    e.preventDefault()
    const trimmedEmail = email.trim()
    const trimmedUsername = username.trim()

    setSubmitted({ email: trimmedEmail, username: trimmedUsername })
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

  return (
    <>
      <main className="container">
        <header className="header">
          <h1 className="title">Digital Footprint Exposure Analyzer</h1>
          <p className="subtitle">Frontend ↔ backend connection check</p>
        </header>

        <section className="card">
          <h2 className="cardTitle">API status</h2>

          {apiStatus.state === 'loading' && <p>Loading…</p>}
          {apiStatus.state === 'error' && (
            <p className="errorText">Error: {apiStatus.error}</p>
          )}
          {apiStatus.state === 'success' && (
            <pre className="codeBlock">{JSON.stringify(apiStatus.data, null, 2)}</pre>
          )}
        </section>

        <section className="card">
          <h2 className="cardTitle">Input</h2>

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
          </form>

          {submitted && (
            <div className="result">
              <h3 className="resultTitle">Submitted values</h3>
              <dl className="kv">
                <div className="kvRow">
                  <dt>Email</dt>
                  <dd>{submitted.email || '—'}</dd>
                </div>
                <div className="kvRow">
                  <dt>Username</dt>
                  <dd>{submitted.username || '—'}</dd>
                </div>
              </dl>

              <div className="variations">
                {analysisStatus.data?.summary && (
                  <>
                    {(() => {
                      const banner = getBannerInfo(analysisStatus.data.summary.digitalExposureScore);
                      return (
                        <div className={`alertBanner ${banner.cls}`}>
                          {banner.label}
                        </div>
                      )
                    })()}
                    <div className="dashboardGrid">
                      <div className="dashboardCard">
                        <h4 className="sectionTitle">Overall Risk</h4>
                        {(() => {
                          const riskBadge = getRiskLevelBadge(analysisStatus.data.summary.digitalExposureScore);
                          const progressColor = riskBadge.label === 'Critical' || riskBadge.label === 'High' ? 'rgba(248, 113, 113, 0.8)' : riskBadge.label === 'Medium' ? 'rgba(251, 191, 36, 0.8)' : 'rgba(148, 163, 184, 0.8)';
                          return (
                            <>
                              <div className="heroScoreContainer" style={{ marginBottom: '4px' }}>
                                <span className="heroScoreText">{analysisStatus.data.summary.digitalExposureScore}</span>
                                <span className={`badge ${riskBadge.cls}`}>{riskBadge.label}</span>
                              </div>
                              <div className="progressBarContainer">
                                <div className="progressBarFill" style={{ width: `${analysisStatus.data.summary.digitalExposureScore}%`, background: progressColor }}></div>
                              </div>
                              <div style={{ fontSize: '0.85em', opacity: 0.7, marginTop: '12px', lineHeight: 1.5 }}>
                                Data sensitivity: {Math.round(analysisStatus.data.summary.dataSensitivityScore)}<br/>
                                Breach frequency: {Math.round(analysisStatus.data.summary.breachFrequencyScore)}<br/>
                                Username reuse: {Math.round(analysisStatus.data.summary.usernameReuseContribution)}
                              </div>
                            </>
                          )
                        })()}
                      </div>

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
                    
                    <div className="dashboardCard" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ marginRight: '8px', fontSize: '16px' }}>💡</span>
                        <h4 className="sectionTitle" style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Insight</h4>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.95em', lineHeight: 1.5, opacity: 0.85 }}>
                        {getInsightText(analysisStatus.data.summary.digitalExposureScore)}
                      </p>
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
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
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

                <h3 className="resultTitle">Analysis results</h3>

                {analysisStatus.state === 'loading' && <p>Analyzing…</p>}
                {analysisStatus.state === 'error' && (
                  <p className="errorText">Error: {analysisStatus.error}</p>
                )}
                {analysisStatus.state === 'success' && (
                  <>
                    {analysisStatus.data?.results?.length ? (
                      <ul className="variationList">
                        {analysisStatus.data.results.map((r) => {
                          const platforms = Array.isArray(r.platforms)
                            ? r.platforms.filter(
                                (p) => p && typeof p.name === 'string',
                              )
                            : []

                          const github = platforms.find((p) => p.name === 'GitHub')
                          const githubUnavailable = github?.error === true

                          const matchedPlatforms = platforms
                            .filter((p) => p.found === true)
                            .map((p) => {
                              if (p.name === 'GitHub') return 'GitHub (verified)'
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
                      <p style={{ opacity: 0.8 }}>No results.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  )
}

export default App
