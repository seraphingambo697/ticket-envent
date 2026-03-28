import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import EventsPage    from './pages/EventsPage'
import EventDetail   from './pages/EventDetail'
import MyTickets     from './pages/MyTickets'
import CreateEvent   from './pages/CreateEvent'
import AdminPage     from './pages/AdminPage'

const S = {
  nav:{ background:'#111827', padding:'0 24px', display:'flex', alignItems:'center', height:56, gap:20 },
  logo:{ color:'#f97316', fontWeight:700, fontSize:20 },
  lnk:{ color:'#d1d5db', fontSize:14, transition:'color .15s' },
  btn:{ background:'#f97316', color:'#fff', border:'none', padding:'7px 16px', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600 },
  main:{ maxWidth:1100, margin:'0 auto', padding:'28px 16px' },
}

function Nav() {
  const { user, logout } = useAuth()
  return (
    <nav style={S.nav}>
      <Link to="/" style={S.logo}>🎟 TicketApp</Link>
      <Link to="/events"  style={S.lnk}>Événements</Link>
      {user && <Link to="/my-tickets" style={S.lnk}>Mes billets</Link>}
      {user?.role !== 'user' && <Link to="/create-event" style={S.lnk}>Créer event</Link>}
      {user?.role === 'admin' && <Link to="/admin" style={{...S.lnk, color:'#f97316'}}>Admin</Link>}
      <div style={{marginLeft:'auto', display:'flex', gap:12, alignItems:'center'}}>
        {user ? <>
          <span style={{color:'#9ca3af', fontSize:12}}>{user.email} ({user.role})</span>
          <button style={S.btn} onClick={logout}>Déconnexion</button>
        </> : <>
          <Link to="/login"    style={S.lnk}>Connexion</Link>
          <Link to="/register"><button style={S.btn}>S'inscrire</button></Link>
        </>}
      </div>
    </nav>
  )
}

function Guard({ children, roles }) {
  const { user, ready } = useAuth()
  if (!ready) return <div style={{padding:32}}>Chargement…</div>
  if (!user)  return <Navigate to="/login"/>
  if (roles && !roles.includes(user.role)) return <Navigate to="/"/>
  return children
}

export default function App() {
  return <>
    <Nav/>
    <main style={S.main}>
      <Routes>
        <Route path="/"             element={<Navigate to="/events"/>}/>
        <Route path="/login"        element={<LoginPage/>}/>
        <Route path="/register"     element={<RegisterPage/>}/>
        <Route path="/events"       element={<EventsPage/>}/>
        <Route path="/events/:id"   element={<EventDetail/>}/>
        <Route path="/my-tickets"   element={<Guard><MyTickets/></Guard>}/>
        <Route path="/create-event" element={<Guard roles={['admin','operator']}><CreateEvent/></Guard>}/>
        <Route path="/admin"        element={<Guard roles={['admin']}><AdminPage/></Guard>}/>
      </Routes>
    </main>
  </>
}
