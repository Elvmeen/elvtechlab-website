"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MessageSquare, Loader2, CheckCircle, AlertCircle } from "lucide-react"

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      setStatus("success")
      setFormData({ name: "", email: "", phone: "", message: "" })
    } catch (error) {
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  if (status === "success") {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-green-400 mb-2">Message Sent Successfully!</h3>
        <p className="text-gray-400 mb-4">Thank you for reaching out. We'll get back to you soon.</p>
        <Button
          variant="outline"
          onClick={() => setStatus("idle")}
          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
        >
          Send Another Message
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status === "error" && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-gray-300">
          Full Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="Your full name"
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-300">
          Email Address <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-gray-300">
          Phone
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+234 XXX XXX XXXX"
          pattern="[0-9()#&+*\-=.]+"
          title="Only numbers and phone characters (#, -, *, etc) are accepted."
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-gray-300">
          Message <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="message"
          name="message"
          required
          rows={5}
          value={formData.message}
          onChange={handleChange}
          placeholder="Hey, I have a question..."
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500 resize-none"
        />
      </div>

      <Button type="submit" disabled={status === "loading"} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        {status === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <MessageSquare className="w-4 h-4 mr-2" />
            Let's Talk
          </>
        )}
      </Button>
    </form>
  )
}
