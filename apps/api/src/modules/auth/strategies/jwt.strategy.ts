import { Injectable, UnauthorizedException } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { ConfigService } from "@nestjs/config"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { JwtPayload } from "../types/auth.types"
import { User } from "../../users/entities/user.entity"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET", "your-secret-key-change-in-production"),
    })
  }

  async validate(payload: JwtPayload): Promise<User> {
    // Fetch the user from database with roles and permissions
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
      relations: ["roles", "roles.permissions"],
    })

    if (!user) {
      throw new UnauthorizedException("User not found")
    }

    return user
  }
}
