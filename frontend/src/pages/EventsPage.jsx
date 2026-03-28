import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { eventsAPI } from '../services/api'

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    eventsAPI.list({ status:'published' })
      .then(r => setEvents(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{padding:32,textAlign:'center'}}>Chargement des événements…</p>

  return (
    <div>
      <h1 style={{fontSize:28,fontWeight:700,marginBottom:24,color:'#111827'}}>🎵 Événements à venir</h1>
      {events.length === 0 && <p style={{color:'#6b7280',textAlign:'center',padding:60}}>Aucun événement disponible pour le moment.</p>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20}}>
        {events.map(ev => (
          <Link key={ev.id} to={`/events/${ev.id}`} style={{textDecoration:'none'}}>
            <div style={{background:'#fff',borderRadius:12,padding:20,boxShadow:'0 2px 8px rgba(0,0,0,.06)',cursor:'pointer',transition:'transform .15s',color:'inherit'}}>
              <span style={{background:'#f97316',color:'#fff',fontSize:11,padding:'2px 8px',borderRadius:20,fontWeight:600}}>
                {ev.status}
              </span>
              <h3 style={{fontSize:18,fontWeight:700,margin:'10px 0 4px',color:'#111827'}}>{ev.title}</h3>
              <p style={{fontSize:13,color:'#6b7280',marginBottom:3}}>📍 {ev.venue}, {ev.city}</p>
              <p style={{fontSize:13,color:'#6b7280',marginBottom:10}}>
                📅 {new Date(ev.date).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}
              </p>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:22,fontWeight:700,color:'#f97316'}}>{ev.price} €</span>
                <span style={{fontSize:12,color:'#9ca3af'}}>{ev.available_seats}/{ev.total_seats} places</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
