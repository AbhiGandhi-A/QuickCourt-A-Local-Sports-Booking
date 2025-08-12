export function generateOTP() {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const minutes = Number(process.env.OTP_EXP_MINUTES || 10)
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000)
  return { code, expiresAt }
}