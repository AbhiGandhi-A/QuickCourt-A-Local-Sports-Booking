import jwt from "jsonwebtoken"

export function authRequired(req, res, next) {
  try {
    const token = req.cookies?.token
    if (!token) return res.status(401).json({ error: "Unauthorized" })
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.id, role: payload.role }
    next()
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized" })
  }
}