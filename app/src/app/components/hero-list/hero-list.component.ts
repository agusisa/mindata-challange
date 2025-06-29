import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  Subject,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
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

  private readonly _componentState = signal<ComponentState>({
    showForm: false,
    isEditing: false,
    editingHeroId: null,
    showDeleteModal: false,
    heroToDelete: null,
  });

  private readonly _paginationState = signal<PaginationState>({
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: 0,
    totalPages: 0,
  });

  private readonly _searchTerm = signal<string>('');

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

  // Computed signals for derived state
  readonly componentState = this._componentState.asReadonly();
  readonly paginationState = this._paginationState.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();

  // Computed derived values
  readonly filteredHeroes = computed(() => {
    const heroes = this.heroService.heroes();
    const term = this._searchTerm();
    return term ? this.heroService.searchHeroes(term) : heroes;
  });

  readonly paginatedHeroes = computed(() => {
    const heroes = this.filteredHeroes();
    const itemsPerPage = this._paginationState().itemsPerPage;
    const currentPage = this.validCurrentPage();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return heroes.slice(startIndex, endIndex);
  });

  // Computed getter methods using signals
  readonly showForm = computed(() => this._componentState().showForm);
  readonly isEditing = computed(() => this._componentState().isEditing);
  readonly editingHeroId = computed(() => this._componentState().editingHeroId);
  readonly showDeleteModal = computed(
    () => this._componentState().showDeleteModal
  );
  readonly heroToDelete = computed(() => this._componentState().heroToDelete);
  readonly currentPage = computed(() => this._paginationState().currentPage);

  // Computed pagination values - calculated directly from filtered heroes
  readonly totalItems = computed(() => this.filteredHeroes().length);
  readonly totalPages = computed(() => {
    const itemsPerPage = this._paginationState().itemsPerPage;
    const totalItems = this.totalItems();
    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
  });

  // Ensure current page is within bounds
  readonly validCurrentPage = computed(() => {
    const currentPage = this._paginationState().currentPage;
    const totalPages = this.totalPages();
    return Math.min(Math.max(1, currentPage), totalPages);
  });

  ngOnInit(): void {
    this.setupSearchForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchForm(): void {
    this.searchForm
      .get('searchTerm')!
      .valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        map((term) => term || ''),
        takeUntil(this.destroy$)
      )
      .subscribe((term) => {
        this._searchTerm.set(term);
      });
  }

  private updateComponentState(updates: Partial<ComponentState>): void {
    this._componentState.update((current) => ({
      ...current,
      ...updates,
    }));
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this._paginationState.update((current) => ({
        ...current,
        currentPage: page,
      }));
    }
  }

  previousPage(): void {
    this.goToPage(this.validCurrentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.validCurrentPage() + 1);
  }

  changeItemsPerPage(itemsPerPage: number): void {
    this._paginationState.update((current) => ({
      ...current,
      itemsPerPage,
      currentPage: 1,
    }));
  }

  onItemsPerPageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const itemsPerPage = parseInt(target.value, 10);
    this.changeItemsPerPage(itemsPerPage);
  }

  getPaginationArray(): readonly number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  readonly itemsPerPageOptions = [5, 10, 20, 50] as const;
  readonly currentItemsPerPage = computed(
    () => this._paginationState().itemsPerPage
  );

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

      if (this.isEditing()) {
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
    const hero = this.heroToDelete();
    if (hero) {
      this.heroService.deleteHero(hero.id);
      this.cancelDelete();
    }
  }

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

  trackByHeroId = (index: number, hero: Hero): string => hero.id;
  trackByPageNumber = (index: number, page: number): number => page;
}
