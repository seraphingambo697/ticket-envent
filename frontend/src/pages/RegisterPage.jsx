import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'

const S = {
  wrap:{ background:'#fff',borderRadius:12,padding:32,boxShadow:'0 2px 12px rgba(0,0,0,.08)',maxWidth:420,margin:'60px auto' },
  h2:{ fontSize:24,fontWeight:700,marginBottom:20,color:'#111827' },
  lbl:{ display:'block',marginBottom:4,fontSize:13,color:'#6b7280' },
  inp:{ width:'100%',padding:'9px 12px',border:'1px solid #e5e7eb',borderRadius:6,fontSize:14,marginBottom:14 },
  btn:{ width:'100%',padding:11,background:'#f97316',color:'#fff',border:'none',borderRadius:6,fontSize:15,cursor:'pointer',fontWeight:600 },
  err:{ color:'#ef4444',fontSize:13,marginBottom:10 },
  lk:{ color:'#f97316' },
}

export default function RegisterPage() {
  const [form, setForm] = useState({ email:'',password:'',first_name:'',last_name:'' })
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const { data } = await authAPI.register(form)
      login(data.user, data.access, data.refresh)
      nav('/events')
    } catch(e) {
      const d = e.response?.data
      setErr(typeof d==='object' ? Object.values(d).flat().join(', ') : 'Inscription échouée')
    } finally { setBusy(false) }
  }

  const f = k => e => setForm(x=>({...x,[k]:e.target.value}))

  return (
    <div style={S.wrap}>
      <h2 style={S.h2}>Créer un compte</h2>
      {err && <p style={S.err}>{err}</p>}
      <form onSubmit={submit}>
        <label style={S.lbl}>Prénom</label>
        <input style={S.inp} value={form.first_name} onChange={f('first_name')}/>
        <label style={S.lbl}>Nom</label>
        <input style={S.inp} value={form.last_name} onChange={f('last_name')}/>
        <label style={S.lbl}>Email</label>
        <input style={S.inp} type="email" required value={form.email} onChange={f('email')}/>
        <label style={S.lbl}>Mot de passe (min 8 car.)</label>
        <input style={S.inp} type="password" required minLength={8} value={form.password} onChange={f('password')}/>
        <button style={S.btn} disabled={busy}>{busy?'Création…':'Créer mon compte'}</button>
      </form>
      <p style={{marginTop:14,fontSize:13,textAlign:'center'}}>
        Déjà inscrit ? <Link to="/login" style={S.lk}>Se connecter</Link>
      </p>
    </div>
  )
}
