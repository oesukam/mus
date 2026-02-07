import { ApiProperty } from "@nestjs/swagger"

export class UserProfileDto {
  @ApiProperty({ example: 1, description: "User ID" })
  id: number

  @ApiProperty({ example: "user@example.com", description: "User email" })
  email: string

  @ApiProperty({ example: "John Doe", description: "User name" })
  name: string

  @ApiProperty({ example: ["customer"], description: "User roles", type: [String] })
  roles: string[]

  @ApiProperty({ example: "https://example.com/image.jpg", description: "User picture" })
  picture: string

  @ApiProperty({ example: "ACTIVE", description: "User status" })
  status: string

  @ApiProperty({ example: "2021-01-01", description: "User created at" })
  createdAt: Date

  @ApiProperty({ example: "2021-01-01", description: "User updated at" })
  updatedAt: Date
}

export class ProfileResponseDto {
  @ApiProperty({ type: UserProfileDto, description: "User profile information" })
  user: UserProfileDto
}
