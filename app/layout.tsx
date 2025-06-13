import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css" // Ensure your global styles are imported
import { ThemeProvider } from "@/components/theme-provider" // Assuming you have a theme provider

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
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystemTransition disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
