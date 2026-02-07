import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Country, isValidCountryCode } from '../../modules/products/enums/country.enum';

/**
 * Custom decorator to extract country from request headers
 * Looks for 'x-country' header
 * Returns undefined if header is missing or invalid
 */
export const CountryHeader = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Country | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const countryCode = request.headers['x-country'];

    if (!countryCode) {
      return undefined;
    }

    const upperCode = countryCode.toUpperCase();

    if (isValidCountryCode(upperCode)) {
      return upperCode as Country;
    }

    return undefined;
  },
);
