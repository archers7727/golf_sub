import type { AppProps } from 'next/app'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/lib/providers/query-provider'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryProvider>
      <Component {...pageProps} />
      <Toaster position="top-right" richColors />
    </QueryProvider>
  )
}
