import './globals.css'
import StyledComponentsRegistry from '@/lib/AntdRegistry'
import MuiRegistry from '@/lib/MuiRegistry'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <MuiRegistry>
            {children}
          </MuiRegistry>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}
