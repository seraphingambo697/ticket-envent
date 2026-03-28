import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { eventsAPI, ticketsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const S = {
  card:{ background:'#fff',borderRadius:12,padding:32,boxShadow:'0 2px 12px rgba(0,0,0,.08)',maxWidth:640 },
  h1:{ fontSize:28,fontWeight:700,color:'#111827',marginBottom:8 },
  meta:{ fontSize:14,color:'#6b7280',marginBottom:6 },
  price:{ fontSize:32,fontWeight:700,color:'#f97316',margin:'16px 0' },
  lbl:{ display:'block',marginBottom:4,fontSize:13,color:'#6b7280' },
  inp:{ width:'100%',padding:'9px 12px',border:'1px solid #e5e7eb',borderRadius:6,fontSize:14,marginBottom:12 },
  btn:{ padding:'12px 28px',background:'#f97316',color:'#fff',border:'none',borderRadius:6,fontSize:15,cursor:'pointer',fontWeight:600 },
  err:{ color:'#ef4444',fontSize:13,marginBottom:12 },
  ok:{ background:'#d1fae5',color:'#065f46',padding:16,borderRadius:8,marginTop:16 },
  hr:{ border:'none',borderTop:'1px solid #f3f4f6',margin:'20px 0' },
}

export default function EventDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const [ev,      setEv]     = useState(null)
  const [form,    setForm]   = useState({ quantity:1, card_number:'', card_expiry:'', card_cvc:'' })
  const [loading, setLoading]= useState(false)
  const [err,     setErr]    = useState('')
  const [ok,      setOk]     = useState(null)

  useEffect(() => {
    eventsAPI.get(id).then(r=>setEv(r.data)).catch(()=>nav('/events'))
  }, [id])

  if (!ev) return <p style={{padding:32}}>Chargement…</p>

  const submit = async e => {
    e.preventDefault()
    if (!user) return nav('/login')
    setErr(''); setLoading(true)
    try {
      const { data } = await ticketsAPI.purchase({ event_id:id, ...form })
      setOk(data)
      setEv(v=>({...v, available_seats: v.available_seats - form.quantity}))
    } catch(e) {
      setErr(e.response?.data?.error || 'Achat échoué, réessayez')
    } finally { setLoading(false) }
  }

  const canEdit = user && (user.role === 'admin' || user.role === 'operator')

  return (
    <div style={S.card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <h1 style={S.h1}>{ev.title}</h1>
        {canEdit && <Link to={`/events/${id}/edit`} style={{background:'#f3f4f6',color:'#374151',padding:'6px 14px',borderRadius:6,fontSize:13}}>✏️ Modifier</Link>}
      </div>
      <p style={S.meta}>📍 {ev.venue}, {ev.city}</p>
      <p style={S.meta}>📅 {new Date(ev.date).toLocaleString('fr-FR')}</p>
      <p style={S.meta}>🎟 {ev.available_seats} / {ev.total_seats} places restantes</p>
      {ev.description && <p style={{marginTop:10,color:'#374151',lineHeight:1.6}}>{ev.description}</p>}
      <div style={S.price}>{ev.price} € / billet</div>

      {ok ? (
        <div style={S.ok}>
          <strong>🎉 Achat confirmé !</strong>
          {ok.map(t => <div key={t.id} style={{fontSize:13,marginTop:6}}>Billet : <strong style={{fontFamily:'monospace'}}>{t.ticket_number}</strong></div>)}
          <p style={{fontSize:12,marginTop:8,color:'#047857'}}>Un email de confirmation a été envoyé à {user?.email}</p>
          <Link to="/my-tickets" style={{fontSize:13,color:'#065f46',display:'inline-block',marginTop:8}}>Voir mes billets →</Link>
        </div>
      ) : ev.available_seats > 0 && ev.status === 'published' ? (
        <>
          <hr style={S.hr}/>
          <h3 style={{marginBottom:14,color:'#111827'}}>Acheter des billets</h3>
          {!user && <p style={{color:'#f97316',fontSize:14,marginBottom:12}}><Link to="/login" style={{color:'#f97316'}}>Connectez-vous</Link> pour acheter.</p>}
          {err && <p style={S.err}>⚠️ {err}</p>}
          <form onSubmit={submit}>
            <label style={S.lbl}>Quantité</label>
            <input style={{...S.inp,width:80}} type="number" min={1} max={Math.min(10,ev.available_seats)}
              value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:+e.target.value||1}))}/>
            <label style={S.lbl}>Numéro de carte</label>
            <input style={S.inp} placeholder="4111 1111 1111 1111" maxLength={16}
              value={form.card_number} onChange={e=>setForm(f=>({...f,card_number:e.target.value.replace(/s/g,'')}))}/>
            <div style={{display:'flex',gap:12}}>
              <div style={{flex:1}}>
                <label style={S.lbl}>Expiration (MM/AA)</label>
                <input style={S.inp} placeholder="12/28" maxLength={5}
                  value={form.card_expiry} onChange={e=>setForm(f=>({...f,card_expiry:e.target.value}))}/>
              </div>
              <div style={{width:90}}>
                <label style={S.lbl}>CVC</label>
                <input style={S.inp} placeholder="123" maxLength={4}
                  value={form.card_cvc} onChange={e=>setForm(f=>({...f,card_cvc:e.target.value}))}/>
              </div>
            </div>
            <p style={{fontSize:11,color:'#9ca3af',marginBottom:12}}>
              🧪 Test : 4111111111111111 = succès · 4000000000000002 = refusée
            </p>
            <button style={{...S.btn,opacity:!user?.id?.length?0.5:1}} disabled={loading||!user}>
              {loading ? 'Traitement…' : `Payer ${(parseFloat(ev.price)*form.quantity).toFixed(2)} €`}
            </button>
          </form>
        </>
      ) : (
        <p style={{color:'#ef4444',fontWeight:600,marginTop:16,fontSize:18}}>
          {ev.status !== 'published' ? `Événement ${ev.status}` : '🚫 Complet'}
        </p>
      )}
    </div>
  )
}
