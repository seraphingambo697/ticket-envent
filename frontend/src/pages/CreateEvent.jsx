import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventsAPI } from '../services/api'

const S = {
  card: { background: '#fff', borderRadius: 12, padding: 32, maxWidth: 560, boxShadow: '0 2px 12px rgba(0,0,0,.08)' },
  h1: { fontSize: 24, fontWeight: 700, marginBottom: 20, color: '#111827' },
  lbl: { display: 'block', marginBottom: 4, fontSize: 13, color: '#6b7280' },
  inp: { width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 14, marginBottom: 14 },
  btn: { padding: '11px 28px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, cursor: 'pointer', fontWeight: 600 },
  err: { color: '#ef4444', fontSize: 13, marginBottom: 10 },
  sel: { width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 14, marginBottom: 14 },
}

export default function CreateEvent() {
  const [form, setForm] = useState({ title: '', description: '', venue: '', city: '', date: '', total_seats: '', price: '', status: 'published' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()

  const f = k => e => setForm(x => ({ ...x, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const { data } = await eventsAPI.create(form)
      nav(`/events/${data.id}`)
    } catch (e) {
      const d = e.response?.data
      setErr(typeof d === 'object' ? Object.values(d).flat().join(', ') : 'Erreur création')
    } finally { setBusy(false) }
  }

  return (
    <div style={S.card}>
      <h1 style={S.h1}>Créer un événement</h1>
      {err && <p style={S.err}>{err}</p>}
      <form onSubmit={submit}>
        <label style={S.lbl}>Titre *</label>
        <input style={S.inp} required value={form.title} onChange={f('title')} />
        <label style={S.lbl}>Description</label>
        <textarea style={{ ...S.inp, minHeight: 70, resize: 'vertical' }} value={form.description} onChange={f('description')} />
        <label style={S.lbl}>Lieu *</label>
        <input style={S.inp} required value={form.venue} onChange={f('venue')} />
        <label style={S.lbl}>Ville *</label>
        <input style={S.inp} required value={form.city} onChange={f('city')} />
        <label style={S.lbl}>Date et heure *</label>
        <input style={S.inp} type="datetime-local" required value={form.date} onChange={f('date')} />
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={S.lbl}>Nombre de places *</label>
            <input style={S.inp} type="number" min={1} required value={form.total_seats} onChange={f('total_seats')} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.lbl}>Prix (€) *</label>
            <input style={S.inp} type="number" step="0.01" min={0} required value={form.price} onChange={f('price')} />
          </div>
        </div>
        <label style={S.lbl}>Statut</label>
        <select style={S.sel} value={form.status} onChange={f('status')}>
          <option value="draft">Brouillon</option>
          <option value="published">Publié</option>
        </select>
        <button style={S.btn} disabled={busy}>{busy ? 'Création…' : "Créer l'événement"}</button>
      </form>
    </div>
  )
}
