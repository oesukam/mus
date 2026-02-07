export interface JwtPayload {
  sub: number
  email: string
  name: string
  roles: string[]
  picture: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface UserFromJwt {
  id: number
  email: string
  name: string
  roles: string[]
  picture: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface GoogleProfile {
  googleId: string
  email: string
  name: string
  picture: string
}

export interface UserResponse {
  id: number
  email: string
  name: string
  roles: string[]
  provider: string
  picture?: string
}

export interface AuthResponse {
  user: UserResponse
  accessToken: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  name: string
}
