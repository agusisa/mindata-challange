import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly _isLoading = signal<boolean>(false);
  private readonly _loadingCount = signal<number>(0);

  readonly isLoading = this._isLoading.asReadonly();
  readonly loadingCount = this._loadingCount.asReadonly();

  readonly shouldShowLoading = computed(() => this._loadingCount() > 0);

  startLoading(): void {
    this._loadingCount.update((count) => count + 1);
    this._isLoading.set(true);
  }

  stopLoading(): void {
    this._loadingCount.update((count) => {
      const newCount = Math.max(0, count - 1);
      if (newCount === 0) {
        this._isLoading.set(false);
      }
      return newCount;
    });
  }

  stopAllLoading(): void {
    this._loadingCount.set(0);
    this._isLoading.set(false);
  }

  async withLoading<T>(operation: () => Promise<T>): Promise<T> {
    this.startLoading();
    try {
      return await operation();
    } finally {
      this.stopLoading();
    }
  }
}
