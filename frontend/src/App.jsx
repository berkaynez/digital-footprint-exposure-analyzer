import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState({ state: 'idle' })
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [submitted, setSubmitted] = useState(null)
  const [analysisStatus, setAnalysisStatus] = useState({ state: 'idle' })

  useEffect(() => {
    let cancelled = false

    async function run() {
      setApiStatus({ state: 'loading' })

      try {
        const res = await fetch('/api/health')
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

    try {
      const res = await fetch('http://localhost:5053/api/analyze', {
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
                  <div className="summary" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <h3 className="resultTitle">Exposure Summary</h3>
                    <dl className="kv" style={{ marginTop: '0.5rem' }}>
                      <div className="kvRow">
                        <dt>Digital Exposure Score</dt>
                        <dd style={{ fontWeight: 'bold', color: 'var(--color-primary)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span>{analysisStatus.data.summary.digitalExposureScore}/100</span>
                          <span style={{ fontSize: '0.8em', opacity: 0.6, fontWeight: 'normal', marginTop: '4px', textAlign: 'right' }}>
                            Data sensitivity: {Math.round(analysisStatus.data.summary.dataSensitivityScore)}, Breach frequency: {Math.round(analysisStatus.data.summary.breachFrequencyScore)}, Username reuse: {Math.round(analysisStatus.data.summary.usernameReuseContribution)}
                          </span>
                        </dd>
                      </div>
                      <div className="kvRow">
                        <dt>Username Reuse Risk Score</dt>
                        <dd>{analysisStatus.data.summary.usernameReuseRiskScore}/100</dd>
                      </div>
                      <div className="kvRow">
                        <dt>Verified matches</dt>
                        <dd>{analysisStatus.data.summary.verifiedMatchCount}</dd>
                      </div>
                      <div className="kvRow">
                        <dt>Simulated matches</dt>
                        <dd>{analysisStatus.data.summary.simulatedMatchCount}</dd>
                      </div>
                      <div className="kvRow">
                        <dt>Risk variations</dt>
                        <dd>
                          <span className="badge badge--high" style={{marginRight: '4px'}}>{analysisStatus.data.summary.highRiskCount} High</span>
                          <span className="badge badge--medium" style={{marginRight: '4px'}}>{analysisStatus.data.summary.mediumRiskCount} Medium</span>
                          <span className="badge badge--low">{analysisStatus.data.summary.lowRiskCount} Low</span>
                        </dd>
                      </div>
                      <div className="kvRow">
                        <dt>Email Exposure Check</dt>
                        <dd>
                          {analysisStatus.data.emailExposure ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span>
                                {analysisStatus.data.emailExposure.error ? (
                                  'Email exposure check unavailable'
                                ) : analysisStatus.data.emailExposure.found ? (
                                  <span style={{ color: 'var(--color-error)' }}>{analysisStatus.data.emailExposure.breachCount} possible breaches found</span>
                                ) : (
                                  <span style={{ color: 'var(--color-success)' }}>No public breach exposure found</span>
                                )}
                              </span>
                              <span style={{ fontSize: '0.8em', opacity: 0.6 }}>
                                Provider: {analysisStatus.data.emailExposure.provider}
                              </span>
                              {analysisStatus.data.emailExposure.sources?.length > 0 && (
                                <span style={{ fontSize: '0.9em', marginTop: '4px' }}>
                                  Sources: {analysisStatus.data.emailExposure.sources.map(s => `${s.name} (${s.date || 'unknown'})`).join(', ')}
                                </span>
                              )}
                              {analysisStatus.data.emailExposure.exposedFields?.length > 0 && (
                                <span style={{ fontSize: '0.9em', marginTop: '4px' }}>
                                  Exposed data types: {analysisStatus.data.emailExposure.exposedFields.join(', ')}
                                </span>
                              )}
                            </div>
                          ) : 'Pending...'}
                        </dd>
                      </div>
                    </dl>
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
                            <li key={r.username} className="resultItem">
                              <div className="resultRow">
                                <code className="inlineCode">{r.username}</code>
                                <span className="percent">
                                  {toPercent(r.similarity)}
                                </span>
                                <span className={`badge badge--${r.risk}`}>
                                  {r.risk}
                                </span>
                              </div>

                              <div className="platformMatches">
                                {matchedPlatforms.length ? (
                                  <>
                                    <span className="platformLabel">
                                      Possible matches:
                                    </span>{' '}
                                    {matchedPlatforms.join(', ')}
                                  </>
                                ) : (
                                  'No possible platform matches'
                                )}
                              </div>

                              {githubUnavailable && (
                                <div className="platformNote">
                                  GitHub check unavailable
                                </div>
                              )}
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
