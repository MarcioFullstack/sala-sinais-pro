import jwt from 'jsonwebtoken'
export function auth(req,res,next){
  const hdr = req.headers.authorization||''
  const token = hdr.startsWith('Bearer ') ? hdr.substring(7) : null
  if(!token) return res.status(401).json({ error:'No token' })
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev')
    req.user = payload
    next()
  }catch(e){
    return res.status(401).json({ error:'Invalid token' })
  }
}
