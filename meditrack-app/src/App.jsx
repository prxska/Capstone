import { useMemo, useState } from 'react'
import './App.css'

const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const initialForm = {
  patient: 'Ana López',
  medication: 'Ibuprofeno',
  dose: '400 mg',
  frequency: 'Cada 8 horas',
  startDate: '2026-08-15',
  startTime: '08:00',
  duration: '7 días',
  notes: 'Tomar con agua y alimentos.',
}

const seedEvents = [
  { id: 1, title: 'Ibuprofeno', patient: 'Ana López', date: '2026-08-02', time: '08:00', color: 'blue', frequency: 'Cada 8 horas' },
  { id: 2, title: 'Vitamina D', patient: 'Ana López', date: '2026-08-03', time: '09:00', color: 'green', frequency: 'Diario' },
  { id: 3, title: 'Amoxicilina', patient: 'Ana López', date: '2026-08-05', time: '20:00', color: 'red', frequency: 'Cada 12 horas' },
  { id: 4, title: 'Omeprazol', patient: 'Ana López', date: '2026-08-07', time: '07:30', color: 'purple', frequency: 'Cada 24 horas' },
  { id: 5, title: 'Paracetamol', patient: 'Ana López', date: '2026-08-12', time: '15:00', color: 'orange', frequency: 'Cada 6 horas' },
  { id: 6, title: 'Ibuprofeno', patient: 'Ana López', date: '2026-08-15', time: '08:00', color: 'blue', frequency: 'Cada 8 horas' },
  { id: 7, title: 'Vitamina D', patient: 'Ana López', date: '2026-08-18', time: '09:00', color: 'green', frequency: 'Diario' },
  { id: 8, title: 'Amoxicilina', patient: 'Ana López', date: '2026-08-20', time: '20:00', color: 'red', frequency: 'Cada 12 horas' },
]

function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildCalendarDays(year, month) {
  const monthStart = new Date(year, month, 1)
  const startDay = new Date(monthStart)
  startDay.setDate(startDay.getDate() - startDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDay)
    date.setDate(startDay.getDate() + index)
    return date
  })
}

const initialUser = {
  name: 'Ana López',
  email: 'ana.lopez@email.com',
  password: '********',
}

const initialAlarmSettings = {
  enabled: true,
  leadTime: '15 min antes',
  repeat: 'Cada 10 min',
  sound: 'Sonido suave',
  vibrate: true,
}

function App() {
  const [formData, setFormData] = useState(initialForm)
  const [events, setEvents] = useState(seedEvents)
  const [selectedMonth, setSelectedMonth] = useState(new Date(2026, 7, 1))
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(true)
  const [authMode, setAuthMode] = useState('account')
  const [user, setUser] = useState(initialUser)
  const [alarmSettings, setAlarmSettings] = useState(initialAlarmSettings)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  const monthLabel = selectedMonth.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })

  const calendarDays = useMemo(
    () => buildCalendarDays(selectedMonth.getFullYear(), selectedMonth.getMonth()),
    [selectedMonth],
  )

  const upcomingEvents = [...events].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}:00`)
    const dateB = new Date(`${b.date}T${b.time}:00`)
    return dateA - dateB
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const newEvent = {
      id: Date.now(),
      title: formData.medication,
      patient: formData.patient,
      date: formData.startDate,
      time: formData.startTime,
      color: 'blue',
      frequency: formData.frequency,
    }

    setEvents((prev) => [newEvent, ...prev])
    setFormData({ ...initialForm, patient: formData.patient })
  }

  const handleQuickAdd = () => {
    setAuthMode('recipe')
    setIsFormOpen(true)
  }

  const handleLogin = (event) => {
    event.preventDefault()
    setIsLoggedIn(true)
    setAuthMode('account')
    setUser((prev) => ({
      ...prev,
      email: loginForm.email || prev.email,
    }))
    setLoginForm({ email: '', password: '' })
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setAuthMode('login')
    setLoginForm({ email: '', password: '' })
  }

  const handleAccountChange = (event) => {
    const { name, value } = event.target
    setUser((prev) => ({ ...prev, [name]: value }))
  }

  const handleAlarmSettingChange = (event) => {
    const { name, value, type, checked } = event.target
    setAlarmSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const openAccountPanel = () => {
    setAuthMode('account')
    setIsFormOpen(true)
  }

  const openLoginPanel = () => {
    setAuthMode('login')
    setIsFormOpen(true)
  }

  const changeMonth = (direction) => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + direction, 1),
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar panel">
        <div className="brand-wrap">
          <div className="brand-mark">M</div>
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>Meditrack</h1>
          </div>
        </div>

        <div className="topbar-actions">
          <button type="button" className="primary-button" onClick={handleQuickAdd}>
            + Receta
          </button>
          <button type="button" className="ghost-button account-button" onClick={isLoggedIn ? openAccountPanel : openLoginPanel}>
            {isLoggedIn ? 'Cuenta' : 'Iniciar sesión'}
          </button>
        </div>
      </header>

      <div className="app-layout">
        <main className="main-column panel">
          <div className="calendar-header">
            <div className="calendar-nav">
              <button type="button" onClick={() => changeMonth(-1)} aria-label="Mes anterior">
                ‹
              </button>
              <h2>{monthLabel}</h2>
              <button type="button" onClick={() => changeMonth(1)} aria-label="Mes siguiente">
                ›
              </button>
            </div>

            <div className="calendar-actions">
              <button type="button" className="ghost-button small">
                Mes
              </button>
              <button type="button" className="ghost-button small">
                Semana
              </button>
              <button type="button" className="ghost-button small" onClick={() => setSelectedMonth(new Date())}>
                Hoy
              </button>
            </div>
          </div>

          <div className="calendar-grid">
            {weekDays.map((day) => (
              <div key={day} className="weekday-cell">
                {day}
              </div>
            ))}

            {calendarDays.map((date) => {
              const dateKey = formatDateKey(date)
              const isCurrentMonth = date.getMonth() === selectedMonth.getMonth()
              const isToday = dateKey === formatDateKey(new Date())
              const dayEvents = events.filter((event) => event.date === dateKey)

              return (
                <div
                  key={dateKey}
                  className={`day-cell ${isCurrentMonth ? '' : 'muted'} ${isToday ? 'today' : ''}`}
                >
                  <div className="day-number">{date.getDate()}</div>

                  <div className="event-stack">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className={`event-pill event-${event.color}`}>
                        <span>{event.title}</span>
                        <small>{event.time}</small>
                      </div>
                    ))}

                    {dayEvents.length > 3 && (
                      <div className="more-events">+{dayEvents.length - 3} más</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </main>

        <aside className="right-column">
          <section className="panel agenda-panel">
            <div className="section-header">
              <span className="dot purple"></span>
              <h2>Próximas dosis</h2>
            </div>

            <div className="agenda-list">
              {upcomingEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="agenda-item">
                  <div className={`agenda-bullet event-${event.color}`}></div>
                  <div className="agenda-info">
                    <strong>{event.title}</strong>
                    <span>{event.time}</span>
                  </div>
                  <small>{event.date}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="panel reminder-panel">
            <div className="section-header">
              <span className="dot red"></span>
              <h2>Recordatorios</h2>
            </div>

            <ul className="reminder-list">
              <li>
                <strong>08:00</strong>
                <span>Ibuprofeno</span>
              </li>
              <li>
                <strong>12:00</strong>
                <span>Agua + descanso</span>
              </li>
              <li>
                <strong>20:00</strong>
                <span>Amoxicilina</span>
              </li>
            </ul>
          </section>
        </aside>
      </div>

      {isFormOpen && (
        <div className="modal-backdrop" onClick={() => setIsFormOpen(false)}>
          <div className="recipe-modal panel" onClick={(event) => event.stopPropagation()}>
            {authMode === 'login' && (
              <>
                <div className="modal-header">
                  <div className="section-header">
                    <span className="dot blue"></span>
                    <h2>Iniciar sesión</h2>
                  </div>
                  <button type="button" className="close-modal-button" onClick={() => setIsFormOpen(false)}>
                    ×
                  </button>
                </div>

                <form className="auth-form" onSubmit={handleLogin}>
                  <label>
                    Correo electrónico
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="tu@email.com"
                    />
                  </label>

                  <label>
                    Contraseña
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                      placeholder="********"
                    />
                  </label>

                  <button type="submit" className="submit-button">
                    Entrar
                  </button>
                </form>
              </>
            )}

            {authMode === 'account' && (
              <>
                <div className="modal-header">
                  <div className="section-header">
                    <span className="dot green"></span>
                    <h2>Mi cuenta</h2>
                  </div>
                  <button type="button" className="close-modal-button" onClick={() => setIsFormOpen(false)}>
                    ×
                  </button>
                </div>

                <div className="account-card">
                  <div className="account-avatar">{user.name.charAt(0).toUpperCase()}</div>
                  <div className="account-meta">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                </div>

                <form
                  className="auth-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    setIsFormOpen(false)
                  }}
                >
                  <label>
                    Nombre
                    <input
                      type="text"
                      name="name"
                      value={user.name}
                      onChange={handleAccountChange}
                    />
                  </label>

                  <label>
                    Correo electrónico
                    <input
                      type="email"
                      name="email"
                      value={user.email}
                      onChange={handleAccountChange}
                    />
                  </label>

                  <label>
                    Contraseña
                    <input
                      type="password"
                      name="password"
                      value={user.password}
                      onChange={handleAccountChange}
                    />
                  </label>

                  <div className="settings-block">
                    <div className="settings-header">
                      <h3>Ajustes de alarmas</h3>
                      <span className="settings-tag">Medicamentos</span>
                    </div>

                    <label className="switch-row">
                      <span>Alarmas activadas</span>
                      <input
                        type="checkbox"
                        name="enabled"
                        checked={alarmSettings.enabled}
                        onChange={handleAlarmSettingChange}
                      />
                    </label>

                    <div className="settings-grid">
                      <label>
                        Recordatorio
                        <select
                          name="leadTime"
                          value={alarmSettings.leadTime}
                          onChange={handleAlarmSettingChange}
                        >
                          <option value="5 min antes">5 min antes</option>
                          <option value="15 min antes">15 min antes</option>
                          <option value="30 min antes">30 min antes</option>
                          <option value="1 hora antes">1 hora antes</option>
                        </select>
                      </label>

                      <label>
                        Repetición
                        <select
                          name="repeat"
                          value={alarmSettings.repeat}
                          onChange={handleAlarmSettingChange}
                        >
                          <option value="Cada 10 min">Cada 10 min</option>
                          <option value="Cada 15 min">Cada 15 min</option>
                          <option value="Cada 30 min">Cada 30 min</option>
                          <option value="Solo una vez">Solo una vez</option>
                        </select>
                      </label>
                    </div>

                    <div className="settings-grid">
                      <label>
                        Sonido
                        <select
                          name="sound"
                          value={alarmSettings.sound}
                          onChange={handleAlarmSettingChange}
                        >
                          <option value="Sonido suave">Sonido suave</option>
                          <option value="Vibración">Vibración</option>
                          <option value="Con tono fuerte">Con tono fuerte</option>
                        </select>
                      </label>

                      <label className="switch-row compact-switch">
                        <span>Vibrar</span>
                        <input
                          type="checkbox"
                          name="vibrate"
                          checked={alarmSettings.vibrate}
                          onChange={handleAlarmSettingChange}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="ghost-button" onClick={handleLogout}>
                      Cerrar sesión
                    </button>
                    <button type="submit" className="submit-button">
                      Guardar
                    </button>
                  </div>
                </form>
              </>
            )}

            {authMode === 'recipe' && (
              <>
                <div className="modal-header">
                  <div className="section-header">
                    <span className="dot green"></span>
                    <h2>Nueva receta</h2>
                  </div>
                  <button type="button" className="close-modal-button" onClick={() => setIsFormOpen(false)}>
                    ×
                  </button>
                </div>

                <form
                  id="medication-form"
                  className="medication-form"
                  onSubmit={(event) => {
                    handleSubmit(event)
                    setIsFormOpen(false)
                  }}
                >
                  <label>
                    Paciente
                    <input
                      type="text"
                      name="patient"
                      value={formData.patient}
                      onChange={handleChange}
                    />
                  </label>

                  <label>
                    Medicamento
                    <input
                      type="text"
                      name="medication"
                      value={formData.medication}
                      onChange={handleChange}
                    />
                  </label>

                  <div className="double-field">
                    <label>
                      Dosis
                      <input
                        type="text"
                        name="dose"
                        value={formData.dose}
                        onChange={handleChange}
                      />
                    </label>

                    <label>
                      Frecuencia
                      <select name="frequency" value={formData.frequency} onChange={handleChange}>
                        <option value="Cada 6 horas">Cada 6 horas</option>
                        <option value="Cada 8 horas">Cada 8 horas</option>
                        <option value="Cada 12 horas">Cada 12 horas</option>
                        <option value="Cada 24 horas">Cada 24 horas</option>
                        <option value="Diario">Diario</option>
                      </select>
                    </label>
                  </div>

                  <div className="double-field">
                    <label>
                      Fecha inicio
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                      />
                    </label>

                    <label>
                      Hora
                      <input
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                      />
                    </label>
                  </div>

                  <label>
                    Duración
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                    />
                  </label>

                  <label>
                    Notas
                    <textarea
                      name="notes"
                      rows="3"
                      value={formData.notes}
                      onChange={handleChange}
                    />
                  </label>

                  <div className="modal-actions">
                    <button type="button" className="ghost-button" onClick={() => setIsFormOpen(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="submit-button">
                      Guardar receta
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default App
