import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""
    let name: string, email: string, phone: string, message: string

    if (contentType.includes("application/json")) {
      const body = await request.json()
      name = body.name || body["form_fields[name]"]
      email = body.email || body["form_fields[email]"]
      phone = body.phone || body["form_fields[field_6046966]"] || ""
      message = body.message || body["form_fields[message]"]
    } else {
      // Parse form data (application/x-www-form-urlencoded or multipart/form-data)
      const formData = await request.formData()
      name = (formData.get("form_fields[name]") || formData.get("name") || "") as string
      email = (formData.get("form_fields[email]") || formData.get("email") || "") as string
      phone = (formData.get("form_fields[field_6046966]") || formData.get("phone") || "") as string
      message = (formData.get("form_fields[message]") || formData.get("message") || "") as string
    }

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400, headers: corsHeaders },
      )
    }

    // Create transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    // Email content
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #37AED2; padding-bottom: 10px;">
            New Contact Form Submission - Elv Tech Lab
          </h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>Phone:</strong> ${phone || "Not provided"}</p>
          </div>
          <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Message:</h3>
            <p style="color: #555; line-height: 1.6;">${message.replace(/\n/g, "<br>")}</p>
          </div>
          <p style="color: #888; font-size: 12px; margin-top: 20px;">
            This email was sent from the Elv Tech Lab contact form.
          </p>
        </div>
      `,
      text: `
New Contact Form Submission - Elv Tech Lab

Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}

Message:
${message}
      `,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json(
      { success: true, message: "Email sent successfully" },
      { status: 200, headers: corsHeaders },
    )
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500, headers: corsHeaders })
  }
}
