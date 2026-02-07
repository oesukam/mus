import { User } from "@/modules/users/entities/user.entity"
import { Request } from "express"

export interface CustomRequest extends Request {
  user: User
  signer: string
  requestId?: string
  clientRequestId?: string
  serviceRequestId?: string
}
