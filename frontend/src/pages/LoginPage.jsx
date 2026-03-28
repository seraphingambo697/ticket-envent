import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'

const S = {
  wrap:{ background:'#fff',borderRadius:12,padding:32,boxShadow:'0 2px 12px rgba(0,0,0,.08)',maxWidth:420,margin:'60px auto' },
  h2:{ fontSize:24,fontWeight:700,marginBottom:20,color:'#111827' },
  lbl:{ display:'block',marginBottom:4,fontSize:13,color:'#6b7280' },
  inp:{ width:'100%',padding:'9px 12px',border:'1px solid #e5e7eb',borderRadius:6,fontSize:14,marginBottom:14,outline:'none' },
  btn:{ width:'100%',padding:11,background:'#f97316',color:'#fff',border:'none',borderRadius:6,fontSize:15,cursor:'pointer',fontWeight:600 },
  err:{ color:'#ef4444',fontSize:13,marginBottom:10 },
  lk:{ color:'#f97316' },
}

export default function LoginPage() {
  const [form, setForm] = useState({ email:'', password:'' })
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const { data } = await authAPI.login(form)
      login(data.user, data.access, data.refresh)
      nav('/events')
    } catch(e) {
      setErr(e.response?.data?.error || 'Connexion échouée')
    } finally { setBusy(false) }
  }

  return (
    <div style={S.wrap}>
      <h2 style={S.h2}>Connexion</h2>
      {err && <p style={S.err}>{err}</p>}
      <form onSubmit={submit}>
        <label style={S.lbl}>Email</label>
        <input style={S.inp} type="email" required value={form.email}
          onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
        <label style={S.lbl}>Mot de passe</label>
        <input style={S.inp} type="password" required value={form.password}
          onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
        <button style={S.btn} disabled={busy}>{busy?'Connexion…':'Se connecter'}</button>
      </form>
      <p style={{marginTop:14,fontSize:13,textAlign:'center'}}>
        Pas de compte ? <Link to="/register" style={S.lk}>S'inscrire</Link>
      </p>
      <p style={{marginTop:8,fontSize:11,color:'#9ca3af',textAlign:'center'}}>
        Demo : admin@ticketapp.com / Admin1234!
      </p>
    </div>
  )
}
