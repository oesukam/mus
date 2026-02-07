import { UAParser } from "ua-parser-js"
import { CustomRequest } from "../types/custom-request"

export const enum UserAgentDeviceCategory {
  MOBILE = "mobile",
  OTHERS = "others",
}

export interface RequestUserAgent {
  deviceCategory: UserAgentDeviceCategory
  deviceType: string
  deviceVendor: string
  osName: string
  osVersion: string
  browserName: string
  browserVersion: string
}

export const detectUserAgent = (request: Partial<CustomRequest>): RequestUserAgent => {
  const userAgent = request.get("user-agent") || ""
  const parser = new UAParser(userAgent)
  const device = parser.getDevice()
  const os = parser.getOS()
  const browser = parser.getBrowser()

  const deviceCategory = ["wearable", "mobile"].includes(device.type)
    ? UserAgentDeviceCategory.MOBILE
    : UserAgentDeviceCategory.OTHERS

  return {
    deviceCategory,
    deviceType: device.type || "unknown",
    deviceVendor: device.vendor || "unknown",
    osName: os.name || "unknown",
    osVersion: os.version || "unknown",
    browserName: browser.name || "unknown",
    browserVersion: browser.version || "unknown",
  }
}
