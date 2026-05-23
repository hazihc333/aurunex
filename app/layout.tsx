import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Joyería — Calculador de Precios',
  description: 'Sistema de cálculo automático de precios para piezas de oro',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="app-shell">
          <header className="header">
            <div className="header-inner">
              <div className="logo">
                <div className="logo-icon">💍</div>
                <div>
                  <div className="logo-text">Aurunex</div>
                 <div className="logo-sub">Calculador de Joyas</div>
                </div>
              </div>
            </div>
          </header>
          <main className="main">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
