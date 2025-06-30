import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with loading state false', () => {
    expect(service.isLoading()).toBeFalsy();
    expect(service.loadingCount()).toBe(0);
    expect(service.shouldShowLoading()).toBeFalsy();
  });

  it('should start loading', () => {
    service.startLoading();

    expect(service.isLoading()).toBeTruthy();
    expect(service.loadingCount()).toBe(1);
    expect(service.shouldShowLoading()).toBeTruthy();
  });

  it('should stop loading', () => {
    service.startLoading();
    service.stopLoading();

    expect(service.isLoading()).toBeFalsy();
    expect(service.loadingCount()).toBe(0);
    expect(service.shouldShowLoading()).toBeFalsy();
  });

  it('should handle multiple loading operations', () => {
    service.startLoading();
    service.startLoading();

    expect(service.loadingCount()).toBe(2);
    expect(service.shouldShowLoading()).toBeTruthy();

    service.stopLoading();

    expect(service.loadingCount()).toBe(1);
    expect(service.shouldShowLoading()).toBeTruthy();

    service.stopLoading();

    expect(service.loadingCount()).toBe(0);
    expect(service.shouldShowLoading()).toBeFalsy();
  });

  it('should stop all loading operations', () => {
    service.startLoading();
    service.startLoading();
    service.startLoading();

    service.stopAllLoading();

    expect(service.loadingCount()).toBe(0);
    expect(service.shouldShowLoading()).toBeFalsy();
  });

  it('should execute operation with loading', async () => {
    const mockOperation = jasmine
      .createSpy('mockOperation')
      .and.returnValue(Promise.resolve('result'));

    const result = await service.withLoading(mockOperation);

    expect(mockOperation).toHaveBeenCalled();
    expect(result).toBe('result');
  });
});
