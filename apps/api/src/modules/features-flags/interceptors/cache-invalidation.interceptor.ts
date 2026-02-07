import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Interceptor to invalidate feature flag cache after mutations
 * Used on POST, PUT, PATCH, DELETE endpoints
 */
@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    return next.handle().pipe(
      tap(async () => {
        // Invalidate all feature flag related cache keys after mutation
        // This ensures users get fresh data after any create/update/delete operation
        const keys = await this.cacheManager.store.keys('feature_flag:*');
        if (keys && keys.length > 0) {
          await Promise.all(keys.map((key) => this.cacheManager.del(key)));
        }
      }),
    );
  }
}
