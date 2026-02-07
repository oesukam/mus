import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { ProductCategory, ProductType, isValidCategoryType } from '../enums/product-category.enum';

@ValidatorConstraint({ name: 'isCategoryTypeValid', async: false })
export class IsCategoryTypeValidConstraint implements ValidatorConstraintInterface {
  validate(type: ProductType, args: ValidationArguments): boolean {
    const object = args.object as any;
    const category = object.category as ProductCategory;

    // If no type is provided, it's valid (optional field)
    if (!type) {
      return true;
    }

    // If no category, can't validate (will fail category validation)
    if (!category) {
      return true;
    }

    // Validate that type belongs to category
    return isValidCategoryType(category, type);
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as any;
    const category = object.category as ProductCategory;
    return `Type "${args.value}" is not valid for category "${category}"`;
  }
}

export function IsCategoryTypeValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCategoryTypeValidConstraint,
    });
  };
}
