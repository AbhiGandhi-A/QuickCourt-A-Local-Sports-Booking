import nodemailer from "nodemailer"

let transporter = null

function buildConfig() {
  const host = process.env.SMTP_HOST || (process.env.EMAIL_USER ? "smtp.gmail.com" : "")
  const secureFlag = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true"
  const port = Number(process.env.SMTP_PORT || (secureFlag ? 465 : 587))

  const user = process.env.SMTP_USER || process.env.EMAIL_USER
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS

  if (!host || !user || !pass) {
    console.warn("[mailer] SMTP not fully configured. Set SMTP_HOST, SMTP_USER/EMAIL_USER and SMTP_PASS/EMAIL_PASS.")
    return null
  }

  return {
    host,
    port,
    secure: secureFlag,
    auth: { user, pass }
  }
}

export function getTransporter() {
  if (transporter) return transporter
  const cfg = buildConfig()
  if (!cfg) return null
  transporter = nodemailer.createTransport(cfg)
  return transporter
}

export async function verifyMailer() {
  const t = getTransporter()
  if (!t) return { ok: false, message: "SMTP not configured" }
  try {
    await t.verify()
    return { ok: true, message: "SMTP ready" }
  } catch (e) {
    return { ok: false, message: e.message }
  }
}

export async function sendMail({ to, subject, text, html, from }) {
  const t = getTransporter()
  if (!t) throw new Error("SMTP not configured. Check your env variables.")
  const defaultFrom =
    process.env.SMTP_FROM ||
    `QuickCourt <${process.env.SMTP_USER || process.env.EMAIL_USER || "no-reply@quickcourt.local"}>`

  const info = await t.sendMail({
    from: from || defaultFrom,
    to,
    subject,
    text,
    html
  })
  return info
}

export async function sendOTPEmail(to, code) {
  const minutes = Number(process.env.OTP_EXP_MINUTES || 10)
  const subject = "Your QuickCourt OTP Code"
  const text = `Your OTP is ${code}. It expires in ${minutes} minutes.`
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial">
      <h2>QuickCourt Verification</h2>
      <p>Your OTP is:</p>
      <div style="font-size:24px;font-weight:bold;letter-spacing:3px">${code}</div>
      <p style="color:#6b7280">It expires in ${minutes} minutes.</p>
    </div>
  `
  try {
    const info = await sendMail({ to, subject, text, html })
    return { sent: true, info }
  } catch (e) {
    console.warn("[mailer] Failed to send OTP email:", e.message)
    return { sent: false, error: e.message }
  }
}