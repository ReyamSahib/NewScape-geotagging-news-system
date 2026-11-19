import { useState } from 'react'

export default function UserPages({ page, setPage, user, setUser }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isRegistering = page === 'register'

  function navigate(next) {
    setError('')
    setPassword('')
    setConfirm('')
    setPage(next)
  }

  async function submit(event) {
    event.preventDefault()
    if (isSubmitting) return
    setError('')

    if (isRegistering && !name.trim()) {
      return setError('Please enter your name.')
    }
    if (isRegistering && password.length < 8) {
      return setError('Use at least 8 characters for your password.')
    }
    if (isRegistering && password !== confirm) {
      return setError('Passwords do not match.')
    }

    const body = { email: email.trim(), password }
    if (isRegistering) body.name = name.trim()

    setIsSubmitting(true)
    try {
      const endpoint = isRegistering ? 'register' : 'login'
      const response = await fetch(`http://127.0.0.1:8000/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        return setError(
          typeof data?.detail === 'string'
            ? data.detail
            : response.status >= 500
              ? 'The server could not complete your request. Please try again.'
              : 'Please check the information you entered.'
        )
      }

      if (isRegistering) {
        navigate('login')
      } else {
        if (!data?.access_token) {
          return setError('The server did not return a login token.')
        }
        setUser(data)
        navigate('profile')
      }
    } catch {
      setError('Could not connect to FastAPI. Check that the backend is running.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    marginTop: '6px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    font: 'inherit'
  }

  const buttonStyle = {
    padding: '12px 18px',
    border: 0,
    borderRadius: '8px',
    background: '#2478f2',
    color: 'white',
    cursor: 'pointer',
    font: 'inherit'
  }

  if (page === 'map') return null

  return (
    <section
      className="ns-auth-card"
      style={{
        maxWidth: '420px',
        margin: '40px auto',
        padding: '28px',
        background: 'white',
        border: '1px solid #dbeafe',
        borderRadius: '18px',
        color: '#17345c',
        boxShadow: '0 12px 35px #17345c12'
      }}
    >
      {page === 'profile' && user ? (
        <>
          <h2>My Profile</h2>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => {
              setUser(null)
              navigate('login')
            }}
          >
            Log Out
          </button>
        </>
      ) : (
        <>
          <h2>{isRegistering ? 'Create your account' : 'Welcome back'}</h2>
          <p>
            {isRegistering
              ? 'Register to start saving your favorite news.'
              : 'Log in to your NewScape account.'}
          </p>

          <form onSubmit={submit} style={{ display: 'grid', gap: '16px' }}>
            {isRegistering && (
              <label>
                Full name
                <input
                  style={inputStyle}
                  autoComplete="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </label>
            )}

            <label>
              Email
              <input
                style={inputStyle}
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </label>

            <label>
              Password
              <input
                style={inputStyle}
                type="password"
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </label>

            {isRegistering && (
              <label>
                Confirm password
                <input
                  style={inputStyle}
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
              </label>
            )}

            {error && (
              <p role="alert" style={{ color: '#b91c1c', margin: 0 }}>
                {error}
              </p>
            )}

            <button style={buttonStyle} type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait…' : isRegistering ? 'Register' : 'Log In'}
            </button>
          </form>

          <button
            type="button"
            disabled={isSubmitting}
            style={{
              ...buttonStyle,
              background: 'transparent',
              color: '#2478f2',
              marginTop: '12px'
            }}
            onClick={() => navigate(isRegistering ? 'login' : 'register')}
          >
            {isRegistering
              ? 'Already registered? Log in'
              : 'Need an account? Register'}
          </button>
        </>
      )}

      <div style={{ marginTop: '20px' }}>
        <button
          type="button"
          disabled={isSubmitting}
          style={{ ...buttonStyle, background: '#475569' }}
          onClick={() => navigate('map')}
        >
          Back to Map
        </button>
      </div>
    </section>
  )
}