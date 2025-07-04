import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css" // Ensure your global styles are imported
import { ThemeProvider } from "@/components/theme-provider" // Assuming you have a theme provider
import ServiceWorkerRegister from "@/components/service-worker-register"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Graph Paper", // Changed title
  description: "An online interactive graph paper application.", // Changed description
  icons: {
    icon: "/favicon.png", // Using the new SVG favicon
  },
  openGraph: {
    title: "Graph Paper",
    description: "An online interactive graph paper application.",
    type: "website",
    // You could add an og:image here if you have a preview image
    // images: [{ url: "/og-image.png" }],
  },
  twitter: {
    card: "summary",
    title: "Graph Paper",
    description: "An online interactive graph paper application.",
    // images: ["/twitter-image.png"], // Optional Twitter specific image
  },
  generator: "v0.dev",
}

async function getSession() {
  const supabase = createServerComponentClient({ cookies })
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error("Error:", error)
    return null
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegister />
        <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
