POST /auth/login
↓
findByEmailForAuth()
↓
check user/passwordHash
↓
argon2.verify()
↓
check role exists
↓
Access Token
  ├─ sub
  ├─ email
  └─ role
↓
Refresh Token
  └─ sub
↓
hash + store refresh token
↓
load safe user
↓
return response