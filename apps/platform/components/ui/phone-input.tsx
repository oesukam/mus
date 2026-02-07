"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { countryCodes, type CountryCode, getDefaultCountryCode } from "@/lib/country-codes"
import { cn } from "@/lib/utils"

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string
  onChange?: (value: string) => void
  defaultCountryCode?: string
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = "", onChange, defaultCountryCode, ...props }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [selectedCountry, setSelectedCountry] = React.useState<CountryCode>(
      defaultCountryCode
        ? countryCodes.find((cc) => cc.dialCode === defaultCountryCode) || getDefaultCountryCode()
        : getDefaultCountryCode()
    )
    const [phoneNumber, setPhoneNumber] = React.useState("")

    // Parse initial value
    React.useEffect(() => {
      if (value) {
        // Try to extract country code from value
        const matchedCountry = countryCodes.find((cc) => value.startsWith(cc.dialCode))
        if (matchedCountry) {
          setSelectedCountry(matchedCountry)
          setPhoneNumber(value.substring(matchedCountry.dialCode.length).trim())
        } else {
          setPhoneNumber(value)
        }
      }
    }, [value])

    const handleCountrySelect = (country: CountryCode) => {
      setSelectedCountry(country)
      setOpen(false)
      // Notify parent with new full phone number
      const fullNumber = phoneNumber ? `${country.dialCode} ${phoneNumber}` : ""
      onChange?.(fullNumber)
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newNumber = e.target.value
      setPhoneNumber(newNumber)
      // Notify parent with full phone number
      const fullNumber = newNumber ? `${selectedCountry.dialCode} ${newNumber}` : ""
      onChange?.(fullNumber)
    }

    return (
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[140px] justify-between"
            >
              <span className="flex items-center gap-2">
                <span>{selectedCountry.flag}</span>
                <span>{selectedCountry.dialCode}</span>
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search country..." />
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {countryCodes.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.country} ${country.dialCode}`}
                    onSelect={() => handleCountrySelect(country)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCountry.code === country.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="mr-2">{country.flag}</span>
                    <span className="flex-1">{country.country}</span>
                    <span className="text-muted-foreground">{country.dialCode}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        <Input
          ref={ref}
          type="tel"
          className={cn("flex-1", className)}
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder="712 345 678"
          {...props}
        />
      </div>
    )
  }
)

PhoneInput.displayName = "PhoneInput"
