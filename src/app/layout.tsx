import type { Metadata } from 'next'
import 'leaflet/dist/leaflet.css';
import './globals.css'

export const metadata: Metadata = {
  title: 'Shortest Path Finder',
  description: 'Solved by Dijkstra Algorithm',
}
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}