// ============================================================================
// PRODUCT ENUMS AND TYPES
// ============================================================================

export enum ProductCategory {
  BAGS = 'Bags',
  BOOKS = 'Books',
  ELECTRONICS = 'Electronics',
  CLOTHING = 'Clothing',
  ACCESSORIES = 'Accessories',
  HOME = 'Home',
  SPORTS = 'Sports',
  TOYS = 'Toys',
}

export enum ProductType {
  // Bags
  BACKPACK = 'Backpack',
  HANDBAG = 'Handbag',
  TOTE_BAG = 'Tote Bag',
  LAPTOP_BAG = 'Laptop Bag',
  MESSENGER_BAG = 'Messenger Bag',
  TRAVEL_BAG = 'Travel Bag',

  // Books
  NOVEL = 'Novel',
  TEXTBOOK = 'Textbook',
  MAGAZINE = 'Magazine',
  COMIC_BOOK = 'Comic Book',
  EBOOK = 'eBook',
  AUDIOBOOK = 'Audiobook',

  // Electronics
  LAPTOP = 'Laptop',
  SMARTPHONE = 'Smartphone',
  TABLET = 'Tablet',
  HEADPHONE = 'Headphone',
  SPEAKER = 'Speaker',
  CAMERA = 'Camera',
  SMARTWATCH = 'Smartwatch',
  KEYBOARD = 'Keyboard',
  MOUSE = 'Mouse',
  MONITOR = 'Monitor',

  // Clothing
  SHIRT = 'Shirt',
  PANTS = 'Pants',
  DRESS = 'Dress',
  JACKET = 'Jacket',
  SHOES = 'Shoes',
  HAT = 'Hat',
  SOCKS = 'Socks',

  // Accessories
  WATCH = 'Watch',
  SUNGLASSES = 'Sunglasses',
  BELT = 'Belt',
  WALLET = 'Wallet',
  JEWELRY = 'Jewelry',
  SCARF = 'Scarf',

  // Home
  FURNITURE = 'Furniture',
  DECOR = 'Decor',
  KITCHEN = 'Kitchen',
  BEDDING = 'Bedding',
  LIGHTING = 'Lighting',

  // Sports
  EQUIPMENT = 'Equipment',
  APPAREL = 'Apparel',
  FOOTWEAR = 'Footwear',
  ACCESSORIES_SPORTS = 'Sports Accessories',

  // Toys
  ACTION_FIGURE = 'Action Figure',
  BOARD_GAME = 'Board Game',
  PUZZLE = 'Puzzle',
  DOLL = 'Doll',
  EDUCATIONAL_TOY = 'Educational Toy',
}

export enum ProductStockStatus {
  IN_STOCK = 'IN_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  NEW = 'NEW',
  DISCONTINUED = 'DISCONTINUED',
}

// Mapping of categories to their valid types
export const CATEGORY_TYPE_MAP: Record<ProductCategory, ProductType[]> = {
  [ProductCategory.BAGS]: [
    ProductType.BACKPACK,
    ProductType.HANDBAG,
    ProductType.TOTE_BAG,
    ProductType.LAPTOP_BAG,
    ProductType.MESSENGER_BAG,
    ProductType.TRAVEL_BAG,
  ],
  [ProductCategory.BOOKS]: [
    ProductType.NOVEL,
    ProductType.TEXTBOOK,
    ProductType.MAGAZINE,
    ProductType.COMIC_BOOK,
    ProductType.EBOOK,
    ProductType.AUDIOBOOK,
  ],
  [ProductCategory.ELECTRONICS]: [
    ProductType.LAPTOP,
    ProductType.SMARTPHONE,
    ProductType.TABLET,
    ProductType.HEADPHONE,
    ProductType.SPEAKER,
    ProductType.CAMERA,
    ProductType.SMARTWATCH,
    ProductType.KEYBOARD,
    ProductType.MOUSE,
    ProductType.MONITOR,
  ],
  [ProductCategory.CLOTHING]: [
    ProductType.SHIRT,
    ProductType.PANTS,
    ProductType.DRESS,
    ProductType.JACKET,
    ProductType.SHOES,
    ProductType.HAT,
    ProductType.SOCKS,
  ],
  [ProductCategory.ACCESSORIES]: [
    ProductType.WATCH,
    ProductType.SUNGLASSES,
    ProductType.BELT,
    ProductType.WALLET,
    ProductType.JEWELRY,
    ProductType.SCARF,
  ],
  [ProductCategory.HOME]: [
    ProductType.FURNITURE,
    ProductType.DECOR,
    ProductType.KITCHEN,
    ProductType.BEDDING,
    ProductType.LIGHTING,
  ],
  [ProductCategory.SPORTS]: [
    ProductType.EQUIPMENT,
    ProductType.APPAREL,
    ProductType.FOOTWEAR,
    ProductType.ACCESSORIES_SPORTS,
  ],
  [ProductCategory.TOYS]: [
    ProductType.ACTION_FIGURE,
    ProductType.BOARD_GAME,
    ProductType.PUZZLE,
    ProductType.DOLL,
    ProductType.EDUCATIONAL_TOY,
  ],
};

// ============================================================================
// PRODUCT HELPER FUNCTIONS
// ============================================================================

export function isValidCategoryType(category: ProductCategory, type: ProductType): boolean {
  return CATEGORY_TYPE_MAP[category]?.includes(type) ?? false;
}

export function getTypesForCategory(category: ProductCategory): ProductType[] {
  return CATEGORY_TYPE_MAP[category] || [];
}
