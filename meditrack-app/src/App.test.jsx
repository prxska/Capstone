import { fireEvent, render, screen } from '@testing-library/react'
import App from './App.jsx'

describe('App', () => {
  it('muestra el calendario y las próximas dosis', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Meditrack' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Próximas dosis' })).toBeInTheDocument()
    expect(screen.getAllByText('Ibuprofeno').length).toBeGreaterThan(0)
  })

  it('abre el formulario para crear una receta', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '+ Receta' }))

    expect(screen.getByRole('heading', { name: 'Nueva receta' })).toBeInTheDocument()
  })
})
