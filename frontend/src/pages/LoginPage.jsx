import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function LoginPage() {
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    async function handleSubmit(e) {
      e.preventDefault()
      setError('')
      setLoading(true)
      try {
        await login(identifier, password)
        navigate('/')
      } catch (err) {
          setError(err.message)
      } finally {
          setLoading(false)
      }
}

    return (
    <div className="min-h-screen bg-[#14161A] text-[#ECEAE4] flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-[#2A2D33] shadow-2xl">
        <div className="bg-[#1D2025] p-10 flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="identifier" className="block text-sm text-[#B8BBC2] mb-1.5">
                Usuario o correo
              </label>
              <input
                id="identifier"
                type="text"
                placeholder="tucorreo@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-[#14161A] border border-[#2A2D33] rounded-lg px-3.5 py-2.5 text-sm placeholder-[#5A5D64] focus:border-[#C9A227] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-[#B8BBC2] mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#14161A] border border-[#2A2D33] rounded-lg px-3.5 py-2.5 text-sm placeholder-[#5A5D64] focus:border-[#C9A227] transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A227] hover:bg-[#DBB438] disabled:opacity-50 text-[#14161A] font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage