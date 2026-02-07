# Products Endpoint Unification

## Summary

The `/products` and `/products/search` endpoints have been unified to eliminate code duplication and provide a single, comprehensive API for querying products.

## What Changed

### Before (Duplicated Endpoints)

**GET `/api/v1/products`** - Basic listing
- Pagination (page, limit)
- Single category filter
- Single type filter

**GET `/api/v1/products/search`** - Advanced search
- Pagination
- Full-text search
- Multiple categories/types
- Featured/new arrivals filtering
- Price range
- Sorting

### After (Unified Endpoint)

**GET `/api/v1/products`** - Unified endpoint
- ✅ All features from basic listing
- ✅ All features from advanced search
- ✅ Backward compatible with both single and array filters
- ✅ Comprehensive filtering, search, and sorting

**GET `/api/v1/products/search`** - Deprecated
- Still works for backward compatibility
- Internally uses the unified `/products` endpoint
- Marked as deprecated in OpenAPI/Swagger docs

## API Usage

### Simple Listing
```http
GET /api/v1/products?page=1&limit=10
```

### Category Filter (Single)
```http
GET /api/v1/products?category=Electronics
```

### Category Filter (Multiple)
```http
GET /api/v1/products?categories=Electronics&categories=Books
```

### Full-Text Search
```http
GET /api/v1/products?query=laptop
```

### Advanced Filtering
```http
GET /api/v1/products?
  query=laptop&
  categories=Electronics&
  minPrice=500&
  maxPrice=2000&
  featured=true&
  sortBy=price-low
```

### Featured Products
```http
GET /api/v1/products?featured=true&limit=8
```

### New Arrivals
```http
GET /api/v1/products?newArrival=true&limit=8
```

## Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (default: 1) | `page=1` |
| `limit` | number | Results per page (default: 10) | `limit=20` |
| `query` | string | Full-text search query | `query=laptop` |
| `category` | enum | Single category filter | `category=Electronics` |
| `categories` | enum[] | Multiple categories (can repeat) | `categories=Electronics&categories=Books` |
| `type` | enum | Single product type filter | `type=Laptop` |
| `types` | enum[] | Multiple types (can repeat) | `types=Laptop&types=Phone` |
| `featured` | boolean | Filter featured products | `featured=true` |
| `newArrival` | boolean | Products from last 30 days | `newArrival=true` |
| `outOfStock` | boolean | Show/hide out of stock | `outOfStock=false` |
| `isActive` | boolean | Active products only (default: true) | `isActive=true` |
| `minPrice` | number | Minimum price filter | `minPrice=100` |
| `maxPrice` | number | Maximum price filter | `maxPrice=1000` |
| `sortBy` | enum | Sort order | `sortBy=price-low` |

### Sort Options

- `price-low` - Price: Low to High
- `price-high` - Price: High to Low
- `name-asc` - Name: A to Z
- `name-desc` - Name: Z to A
- `newest` - Newest First (default)
- `oldest` - Oldest First

## Response Format

```json
{
  "products": [
    {
      "id": 1,
      "slug": "laptop-pro",
      "name": "Laptop Pro",
      "description": "High-performance laptop",
      "price": "999.99",
      "currency": "USD",
      "category": "Electronics",
      "type": "Laptop",
      "stock": 15,
      "isFeatured": true,
      "coverImage": {
        "url": "https://...",
        "urlThumbnail": "https://...",
        "urlMedium": "https://...",
        "urlLarge": "https://..."
      }
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Implementation Details

### Backend Changes

1. **New DTO**: `ProductsQueryDto` combines all query parameters
2. **Updated Service**: `findAll()` method handles all filtering logic
3. **Controller Changes**:
   - `GET /products` uses `ProductsQueryDto`
   - `GET /products/search` marked deprecated, internally uses `findAll()`

### Frontend Changes

1. **Unified Function**: `fetchProducts()` handles all use cases
2. **Deprecated Function**: `searchProducts()` now calls `fetchProducts()`
3. **Helper Functions**: All use the unified `fetchProducts()`
   - `fetchFeaturedProducts()`
   - `fetchNewArrivals()`
   - `fetchProductsByCategory()`

## Migration Guide

### For API Consumers

#### Old Code (Still Works)
```javascript
// Basic listing
GET /api/v1/products?page=1&limit=10&category=Electronics

// Advanced search
GET /api/v1/products/search?query=laptop&categories=Electronics&sortBy=price-low
```

#### New Code (Recommended)
```javascript
// Everything through /products endpoint
GET /api/v1/products?page=1&limit=10&category=Electronics

// Search with filters
GET /api/v1/products?query=laptop&categories=Electronics&sortBy=price-low
```

### For Frontend Developers

#### Old Code
```typescript
// Had to choose between two functions
const { products } = await fetchProducts({ category: 'Electronics' })
const { products } = await searchProducts({ query: 'laptop', categories: ['Electronics'] })
```

#### New Code
```typescript
// One function for everything
const { products } = await fetchProducts({ category: 'Electronics' })
const { products } = await fetchProducts({ query: 'laptop', categories: ['Electronics'] })
```

## Backward Compatibility

### `/products/search` Endpoint
- ✅ Still functional
- ✅ Same request/response format
- ⚠️ Marked as deprecated
- 📅 Will be removed in v2.0

### Platform Code
- ✅ `searchProducts()` function still works
- ⚠️ Shows deprecation warning in console
- ✅ Automatically uses unified endpoint internally

## Benefits

1. **Single Source of Truth**: One endpoint, one service method
2. **Less Code Duplication**: ~150 lines of duplicated code eliminated
3. **Easier Maintenance**: Changes only need to be made once
4. **Better Documentation**: Single endpoint to document
5. **Backward Compatible**: Existing code continues to work
6. **More Flexible**: Supports both single and array filters

## Performance

- ✅ No performance impact
- ✅ Same query execution as before
- ✅ Same caching behavior
- ✅ Full-text search still uses PostgreSQL tsvector

## Testing

### Test All Features
```bash
# Basic listing
curl "http://localhost:4000/api/v1/products?limit=5"

# Single category
curl "http://localhost:4000/api/v1/products?category=Electronics"

# Multiple categories
curl "http://localhost:4000/api/v1/products?categories=Electronics&categories=Books"

# Search with filters
curl "http://localhost:4000/api/v1/products?query=laptop&minPrice=500&maxPrice=2000&sortBy=price-low"

# Featured products
curl "http://localhost:4000/api/v1/products?featured=true&limit=8"

# Deprecated endpoint (still works)
curl "http://localhost:4000/api/v1/products/search?query=laptop"
```

## Future Plans

### Version 2.0 (Future Release)
- Remove `/products/search` endpoint entirely
- Remove `searchProducts()` function from platform
- Remove backward compatibility code

### Version 1.x (Current)
- Keep deprecated endpoint functional
- Show deprecation warnings
- Give developers time to migrate

## Questions?

**Q: Do I need to update my code immediately?**
A: No, the old `/products/search` endpoint still works. However, we recommend migrating to the unified endpoint when convenient.

**Q: Will my existing API calls break?**
A: No, all existing API calls will continue to work without changes.

**Q: What about performance?**
A: No performance impact. The unified endpoint uses the same optimized query logic.

**Q: Can I use both single and array filters?**
A: Yes! The endpoint intelligently combines both. You can use `category` OR `categories`, or both together.

**Q: When will the deprecated endpoint be removed?**
A: Not before v2.0, which hasn't been scheduled yet. You'll have plenty of time to migrate.

## Related Files

### Backend
- `apps/api/src/modules/products/dto/products-query.dto.ts` - Unified DTO
- `apps/api/src/modules/products/products.service.ts` - Updated service
- `apps/api/src/modules/products/products.controller.ts` - Updated controller

### Frontend
- `apps/platform/lib/products-api.ts` - Updated client functions
- `apps/platform/app/search/page.tsx` - Updated search page
