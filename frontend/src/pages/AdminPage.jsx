import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const TAB_STYLE = active => ({
  padding:'8px 20px', borderRadius:6, border:'none', cursor:'pointer', fontSize:14,
  background: active?'#fff':'transparent', fontWeight: active?600:400,
  color: active?'#111827':'#6b7280',
  boxShadow: active?'0 1px 4px rgba(0,0,0,.1)':'none',
})

const TH = { background:'#111827', color:'#fff', padding:'10px 14px', textAlign:'left', fontSize:13 }
const TD = { padding:'10px 14px', fontSize:13, borderBottom:'1px solid #f3f4f6', color:'#374151' }
const badge = c => ({ display:'inline-block', background:c, color:'#fff', fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:600 })
const DEL_BTN = { background:'#ef4444', color:'#fff', border:'none', padding:'3px 10px', borderRadius:4, cursor:'pointer', fontSize:12 }
const roleColors = { admin:'#7c3aed', operator:'#d97706', user:'#059669' }
const stColors = { confirmed:'#059669', pending:'#d97706', cancelled:'#dc2626', refunded:'#6b7280' }

export default function AdminPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [tab,     setTab]     = useState('events')
  const [events,  setEvents]  = useState([])
  const [users,   setUsers]   = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'admin') { nav('/'); return }
    setLoading(true)
    Promise.all([
      api.get('/events/'),
      api.get('/auth/users/'),
      api.get('/tickets/'),
    ]).then(([e,u,t]) => {
      setEvents(e.data); setUsers(u.data); setTickets(t.data)
    }).finally(() => setLoading(false))
  }, [user])

  const delEvent = async id => {
    if (!confirm('Supprimer cet événement ?')) return
    await api.delete(`/events/${id}/`); setEvents(ev=>ev.filter(e=>e.id!==id))
  }

  if (loading) return <p style={{padding:32,textAlign:'center'}}>Chargement admin…</p>

  return (
    <div>
      <h1 style={{fontSize:26,fontWeight:700,marginBottom:20,color:'#111827'}}>🔧 Administration</h1>
      <div style={{display:'flex',gap:2,background:'#f3f4f6',borderRadius:8,padding:4,width:'fit-content',marginBottom:20}}>
        {[['events','Événements',events.length],['users','Utilisateurs',users.length],['tickets','Billets',tickets.length]].map(([k,l,n])=>(
          <button key={k} style={TAB_STYLE(tab===k)} onClick={()=>setTab(k)}>
            {l} <span style={{background:'rgba(0,0,0,.1)',borderRadius:10,padding:'0 6px',fontSize:11,marginLeft:4}}>{n}</span>
          </button>
        ))}
      </div>

      {tab==='events' && (
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
            <thead><tr>{['Titre','Lieu','Date','Places','Prix','Statut','Action'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>{events.map(e=>(
              <tr key={e.id}>
                <td style={TD}>{e.title}</td>
                <td style={TD}>{e.venue}, {e.city}</td>
                <td style={TD}>{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                <td style={TD}>{e.available_seats}/{e.total_seats}</td>
                <td style={TD}>{e.price} €</td>
                <td style={TD}><span style={badge(e.status==='published'?'#059669':'#6b7280')}>{e.status}</span></td>
                <td style={TD}><button style={DEL_BTN} onClick={()=>delEvent(e.id)}>Suppr.</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab==='users' && (
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
            <thead><tr>{['Email','Nom','Rôle','Actif','Créé le'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>{users.map(u=>(
              <tr key={u.id}>
                <td style={TD}>{u.email}</td>
                <td style={TD}>{u.first_name} {u.last_name}</td>
                <td style={TD}><span style={badge(roleColors[u.role]||'#6b7280')}>{u.role}</span></td>
                <td style={TD}>{u.is_active?'✅':'❌'}</td>
                <td style={TD}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab==='tickets' && (
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
            <thead><tr>{['Billet N°','Email','Statut','Montant','Acheté le','Payment ID'].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>{tickets.map(t=>(
              <tr key={t.id}>
                <td style={{...TD,fontFamily:'monospace',fontWeight:700}}>{t.ticket_number}</td>
                <td style={TD}>{t.user_email}</td>
                <td style={TD}><span style={badge(stColors[t.status]||'#6b7280')}>{t.status}</span></td>
                <td style={TD}>{t.amount_paid} €</td>
                <td style={TD}>{t.purchased_at?new Date(t.purchased_at).toLocaleString('fr-FR'):'—'}</td>
                <td style={{...TD,fontFamily:'monospace',fontSize:11}}>{t.payment_id||'—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
