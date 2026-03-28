import { useEffect, useState } from 'react'
import { ticketsAPI } from '../services/api'

const colors = { confirmed:'#059669', pending:'#d97706', cancelled:'#dc2626', refunded:'#6b7280' }

export default function MyTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ticketsAPI.list().then(r=>setTickets(r.data)).finally(()=>setLoading(false))
  }, [])

  if (loading) return <p style={{padding:32,textAlign:'center'}}>Chargement…</p>

  return (
    <div>
      <h1 style={{fontSize:28,fontWeight:700,marginBottom:24,color:'#111827'}}>🎟 Mes billets</h1>
      {tickets.length === 0 && (
        <p style={{color:'#6b7280',textAlign:'center',padding:60}}>
          Aucun billet. <a href="/events" style={{color:'#f97316'}}>Explorer les événements →</a>
        </p>
      )}
      {tickets.map(t => (
        <div key={t.id} style={{background:'#fff',borderRadius:12,padding:20,boxShadow:'0 2px 8px rgba(0,0,0,.06)',marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <span style={{fontFamily:'monospace',fontWeight:700,fontSize:18,color:'#111827'}}>{t.ticket_number}</span>
            <span style={{background:colors[t.status]||'#6b7280',color:'#fff',fontSize:11,padding:'2px 10px',borderRadius:20,fontWeight:600}}>{t.status}</span>
          </div>
          <p style={{fontSize:13,color:'#6b7280',marginTop:6}}>Événement : {t.event_id}</p>
          <p style={{fontSize:13,color:'#6b7280'}}>Montant : <strong>{t.amount_paid} €</strong></p>
          {t.purchased_at && <p style={{fontSize:13,color:'#6b7280'}}>Acheté le : {new Date(t.purchased_at).toLocaleString('fr-FR')}</p>}
          {t.payment_id && <p style={{fontSize:11,color:'#9ca3af',fontFamily:'monospace',marginTop:4}}>Paiement : {t.payment_id}</p>}
        </div>
      ))}
    </div>
  )
}
