import { ContactForm } from "@/components/contact-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact - Elv Tech Lab",
  description: "Get in touch with Elv Tech Lab for web development services",
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#1a1a2e] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-center">Contact Us</h1>
          <p className="text-gray-400 text-center mb-12">
            Have a question or want to work together? Fill out the form below and we'll get back to you as soon as
            possible.
          </p>
          <ContactForm />
        </div>
      </div>
    </main>
  )
}
