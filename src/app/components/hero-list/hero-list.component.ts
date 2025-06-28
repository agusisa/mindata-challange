import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  Subject,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  combineLatest,
  BehaviorSubject,
} from 'rxjs';
import { HeroService } from '../../services/hero.service';
import { Hero } from '../../models/hero.model';

interface PaginationState {
  readonly currentPage: number;
  readonly itemsPerPage: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

interface ComponentState {
  readonly showForm: boolean;
  readonly isEditing: boolean;
  readonly editingHeroId: string | null;
  readonly showDeleteModal: boolean;
  readonly heroToDelete: Hero | null;
}

@Component({
  selector: 'app-hero-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './hero-list.component.html',
  styleUrls: ['./hero-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroListComponent implements OnInit, OnDestroy {
  private readonly heroService = inject(HeroService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // State management using BehaviorSubject (simulating signals)
  private readonly _componentState = new BehaviorSubject<ComponentState>({
    showForm: false,
    isEditing: false,
    editingHeroId: null,
    showDeleteModal: false,
    heroToDelete: null,
  });

  private readonly _paginationState = new BehaviorSubject<PaginationState>({
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: 0,
    totalPages: 0,
  });

  // Forms
  readonly searchForm = this.fb.group({
    searchTerm: [''],
  });

  readonly heroForm = this.fb.group({
    id: [''],
    name: ['', [Validators.required, Validators.minLength(2)]],
    superpower: ['', [Validators.required, Validators.minLength(3)]],
    alterEgo: [''],
    city: ['', [Validators.required]],
  });

  // Computed properties (observable streams)
  readonly componentState$ = this._componentState.asObservable();
  readonly paginationState$ = this._paginationState.asObservable();

  // Reactive data streams
  private readonly searchTerm$ = this.searchForm
    .get('searchTerm')!
    .valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map((term) => term || '')
    );

  readonly filteredHeroes$ = combineLatest([
    this.heroService.heroes$,
    this.searchTerm$,
  ]).pipe(
    map(([heroes, searchTerm]) => this.heroService.searchHeroes(searchTerm))
  );

  readonly paginatedHeroes$ = combineLatest([
    this.filteredHeroes$,
    this._paginationState.asObservable(),
  ]).pipe(
    map(([heroes, pagination]) => {
      const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const endIndex = startIndex + pagination.itemsPerPage;
      return heroes.slice(startIndex, endIndex);
    })
  );

  ngOnInit(): void {
    this.setupPaginationUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._componentState.complete();
    this._paginationState.complete();
  }

  // Computed getter methods (getting current values from BehaviorSubject)
  get showForm(): boolean {
    return this._componentState.value.showForm;
  }

  get isEditing(): boolean {
    return this._componentState.value.isEditing;
  }

  get editingHeroId(): string | null {
    return this._componentState.value.editingHeroId;
  }

  get showDeleteModal(): boolean {
    return this._componentState.value.showDeleteModal;
  }

  get heroToDelete(): Hero | null {
    return this._componentState.value.heroToDelete;
  }

  get currentPage(): number {
    return this._paginationState.value.currentPage;
  }

  get totalPages(): number {
    return this._paginationState.value.totalPages;
  }

  private setupPaginationUpdates(): void {
    this.filteredHeroes$.pipe(takeUntil(this.destroy$)).subscribe((heroes) => {
      this.updatePagination(heroes.length);
    });
  }

  private updatePagination(totalItems: number): void {
    const currentState = this._paginationState.value;
    const totalPages = Math.ceil(totalItems / currentState.itemsPerPage);
    const currentPage = Math.min(
      currentState.currentPage,
      Math.max(1, totalPages)
    );

    this._paginationState.next({
      ...currentState,
      totalItems,
      totalPages,
      currentPage,
    });
  }

  private updateComponentState(updates: Partial<ComponentState>): void {
    this._componentState.next({
      ...this._componentState.value,
      ...updates,
    });
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this._paginationState.next({
        ...this._paginationState.value,
        currentPage: page,
      });
    }
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  getPaginationArray(): readonly number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // CRUD operations
  showAddForm(): void {
    this.updateComponentState({
      showForm: true,
      isEditing: false,
      editingHeroId: null,
    });
    this.heroForm.reset();
  }

  showEditForm(hero: Hero): void {
    this.updateComponentState({
      showForm: true,
      isEditing: true,
      editingHeroId: hero.id,
    });
    this.heroForm.patchValue(hero);
  }

  hideForm(): void {
    this.updateComponentState({
      showForm: false,
      isEditing: false,
      editingHeroId: null,
    });
    this.heroForm.reset();
  }

  onSubmit(): void {
    if (this.heroForm.valid) {
      const heroData = this.heroForm.value as Hero;

      if (this.isEditing) {
        this.heroService.updateHero(heroData);
      } else {
        this.heroService.createHero(heroData);
      }

      this.hideForm();
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.heroForm.controls).forEach((key) => {
      this.heroForm.get(key)?.markAsTouched();
    });
  }

  confirmDelete(hero: Hero): void {
    this.updateComponentState({
      heroToDelete: hero,
      showDeleteModal: true,
    });
  }

  cancelDelete(): void {
    this.updateComponentState({
      heroToDelete: null,
      showDeleteModal: false,
    });
  }

  deleteHero(): void {
    const hero = this.heroToDelete;
    if (hero) {
      this.heroService.deleteHero(hero.id);
      this.cancelDelete();
    }
  }

  // Utility methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.heroForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.heroForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.capitalizeFirst(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.capitalizeFirst(
          fieldName
        )} must be at least ${requiredLength} characters`;
      }
    }
    return '';
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // TrackBy functions for better performance
  trackByHeroId = (index: number, hero: Hero): string => hero.id;
  trackByPageNumber = (index: number, page: number): number => page;
}
