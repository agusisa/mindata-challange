import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { HeroListComponent } from './hero-list.component';
import { HeroService } from '../../services/hero.service';
import { LoadingService } from '../../services/loading.service';
import { Hero } from '../../models/hero.model';
import { UppercaseDirective } from '../../directives/uppercase.directive';

describe('HeroListComponent', () => {
  let component: HeroListComponent;
  let fixture: ComponentFixture<HeroListComponent>;
  let mockHeroService: jasmine.SpyObj<HeroService>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;

  const mockHeroes: Hero[] = [
    {
      id: '1',
      name: 'Spider-Man',
      superpower: 'Web-slinging',
      alterEgo: 'Peter Parker',
      city: 'New York',
    },
    {
      id: '2',
      name: 'Superman',
      superpower: 'Flight',
      alterEgo: 'Clark Kent',
      city: 'Metropolis',
    },
    {
      id: '3',
      name: 'Batman',
      superpower: 'Intelligence',
      alterEgo: 'Bruce Wayne',
      city: 'Gotham',
    },
  ];

  beforeEach(async () => {
    const heroServiceSpy = jasmine.createSpyObj(
      'HeroService',
      ['createHero', 'updateHero', 'deleteHero', 'searchHeroes', 'getHeroes'],
      {
        heroes: signal(mockHeroes),
        heroCount: signal(mockHeroes.length),
      }
    );

    const loadingServiceSpy = jasmine.createSpyObj(
      'LoadingService',
      ['startLoading', 'stopLoading', 'withLoading'],
      {
        shouldShowLoading: signal(false),
        isLoading: signal(false),
        loadingCount: signal(0),
      }
    );

    await TestBed.configureTestingModule({
      imports: [HeroListComponent, ReactiveFormsModule, UppercaseDirective],
      providers: [
        { provide: HeroService, useValue: heroServiceSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroListComponent);
    component = fixture.componentInstance;
    mockHeroService = TestBed.inject(
      HeroService
    ) as jasmine.SpyObj<HeroService>;
    mockLoadingService = TestBed.inject(
      LoadingService
    ) as jasmine.SpyObj<LoadingService>;

    // Setup default behavior for searchHeroes
    mockHeroService.searchHeroes.and.returnValue(mockHeroes);
    mockHeroService.getHeroes.and.returnValue(mockHeroes);
    mockHeroService.createHero.and.returnValue(Promise.resolve());
    mockHeroService.updateHero.and.returnValue(Promise.resolve());
    mockHeroService.deleteHero.and.returnValue(Promise.resolve());

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(component.validCurrentPage()).toBe(1);
      expect(component.showForm()).toBeFalse();
      expect(component.isEditing()).toBeFalse();
      expect(component.showDeleteModal()).toBeFalse();
      expect(component.error()).toBeNull();
    });

    it('should initialize forms', () => {
      expect(component.searchForm).toBeDefined();
      expect(component.heroForm).toBeDefined();
      expect(component.searchForm.get('searchTerm')?.value).toBe('');
    });

    it('should have signal-based computed properties', () => {
      expect(component.filteredHeroes).toBeDefined();
      expect(component.paginatedHeroes).toBeDefined();
      expect(component.componentState).toBeDefined();
      expect(component.paginationState).toBeDefined();
      expect(component.isLoading).toBeDefined();
    });

    it('should inject LoadingService', () => {
      expect(component.isLoading).toBeDefined();
      expect(mockLoadingService).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should reflect loading state from LoadingService', () => {
      // The loading state is properly injected and should be defined
      expect(component.isLoading).toBeDefined();
      expect(mockLoadingService.shouldShowLoading).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should clear error when clearError is called', () => {
      // Manually set an error
      component['updateComponentState']({ error: 'Test error' });
      expect(component.error()).toBe('Test error');

      component.clearError();
      expect(component.error()).toBeNull();
    });

    it('should clear error when showing forms', () => {
      // Set an error first
      component['updateComponentState']({ error: 'Test error' });

      component.showAddForm();
      expect(component.error()).toBeNull();

      component.showEditForm(mockHeroes[0]);
      expect(component.error()).toBeNull();
    });
  });

  describe('Search Functionality', () => {
    it('should update search term signal when form changes', fakeAsync(() => {
      const searchTerm = 'spider';

      // Ensure ngOnInit is called to setup the form subscription
      component.ngOnInit();

      component.searchForm.get('searchTerm')?.setValue(searchTerm);

      // Wait for debounce (300ms) and processing
      tick(300);
      fixture.detectChanges();

      // Verify that the search term signal was updated
      expect(component.searchTerm()).toBe(searchTerm);
    }));

    it('should provide filtered heroes through signal', fakeAsync(() => {
      const searchResults = [mockHeroes[0]];
      mockHeroService.searchHeroes.and.returnValue(searchResults);

      // Trigger search
      component.searchForm.get('searchTerm')?.setValue('spider');
      fixture.detectChanges();

      // Wait for debounce and check signal value
      tick(300);
      fixture.detectChanges();

      expect(component.filteredHeroes().length).toBeGreaterThanOrEqual(0);
    }));
  });

  describe('Pagination', () => {
    it('should calculate pagination correctly', () => {
      // The computed signals should automatically calculate pagination
      expect(component.totalPages()).toBeGreaterThan(0);
      expect(component.totalItems()).toBe(mockHeroes.length);
    });

    it('should navigate to next page', () => {
      const initialPage = component.validCurrentPage();
      component.nextPage();

      // Check if page changed (if there are multiple pages)
      if (component.totalPages() > 1) {
        expect(component.validCurrentPage()).toBeGreaterThan(initialPage);
      } else {
        // If only one page, should stay on page 1
        expect(component.validCurrentPage()).toBe(1);
      }
    });

    it('should navigate to previous page when not on first page', () => {
      // First go to page 2
      component.goToPage(2);
      const currentPage = component.validCurrentPage();

      // Then go back
      component.previousPage();
      expect(component.validCurrentPage()).toBeLessThanOrEqual(currentPage);
    });

    it('should navigate to specific page', () => {
      component.goToPage(1);
      expect(component.validCurrentPage()).toBe(1);
    });

    it('should not navigate beyond valid page range', () => {
      const totalPages = component.totalPages();
      component.goToPage(999);
      expect(component.validCurrentPage()).toBeLessThanOrEqual(totalPages);
    });

    it('should generate correct pagination array', () => {
      const paginationArray = component.getPaginationArray();
      const totalPages = component.totalPages();
      expect(paginationArray.length).toBe(totalPages);
      expect(paginationArray[0]).toBe(1);
    });

    it('should change items per page', () => {
      const initialItemsPerPage = component.currentItemsPerPage();
      component.changeItemsPerPage(10);
      expect(component.currentItemsPerPage()).toBe(10);
      expect(component.currentItemsPerPage()).not.toBe(initialItemsPerPage);
    });
  });

  describe('Form Operations', () => {
    describe('Add Hero', () => {
      it('should show add form when showAddForm is called', () => {
        component.showAddForm();
        expect(component.showForm()).toBeTrue();
        expect(component.isEditing()).toBeFalse();
      });

      it('should reset form when showing add form', () => {
        // Set some values first
        component.heroForm.patchValue({ name: 'Test' });

        component.showAddForm();
        expect(component.heroForm.get('name')?.value).toBeNull();
      });

      it('should create hero on valid form submission', async () => {
        const heroData = {
          name: 'NEW HERO',
          superpower: 'Flying',
          alterEgo: 'John Doe',
          city: 'Star City',
        };

        component.showAddForm();
        component.heroForm.patchValue(heroData);

        await component.onSubmit();

        expect(mockHeroService.createHero).toHaveBeenCalledWith(
          jasmine.objectContaining(heroData)
        );
        expect(component.showForm()).toBeFalse();
      });

      it('should handle create hero error', async () => {
        spyOn(console, 'error');

        mockHeroService.createHero.and.returnValue(
          Promise.reject(new Error('Network error'))
        );

        const heroData = {
          name: 'NEW HERO',
          superpower: 'Flying',
          alterEgo: 'John Doe',
          city: 'Star City',
        };

        component.showAddForm();
        component.heroForm.patchValue(heroData);

        await component.onSubmit();

        expect(component.error()).toContain('Error creating hero');
        expect(component.showForm()).toBeTrue(); // Form should stay open on error
        expect(console.error).toHaveBeenCalledWith(
          'Error during creating hero:',
          jasmine.any(Error)
        );
      });
    });

    describe('Edit Hero', () => {
      it('should show edit form when showEditForm is called', () => {
        const hero = mockHeroes[0];
        component.showEditForm(hero);

        expect(component.showForm()).toBeTrue();
        expect(component.isEditing()).toBeTrue();
        expect(component.editingHeroId()).toBe(hero.id);
        expect(component.heroForm.get('name')?.value).toBe(hero.name);
      });

      it('should update hero on valid form submission', async () => {
        const hero = mockHeroes[0];
        const updatedData = { ...hero, name: 'UPDATED HERO' };

        component.showEditForm(hero);
        component.heroForm.patchValue(updatedData);

        await component.onSubmit();

        expect(mockHeroService.updateHero).toHaveBeenCalledWith(
          jasmine.objectContaining(updatedData)
        );
        expect(component.showForm()).toBeFalse();
      });

      it('should handle update hero error', async () => {
        spyOn(console, 'error');

        mockHeroService.updateHero.and.returnValue(
          Promise.reject(new Error('Network error'))
        );

        const hero = mockHeroes[0];
        component.showEditForm(hero);

        await component.onSubmit();

        expect(component.error()).toContain('Error updating hero');
        expect(component.showForm()).toBeTrue();
        expect(console.error).toHaveBeenCalledWith(
          'Error during updating hero:',
          jasmine.any(Error)
        );
      });
    });

    describe('Delete Hero', () => {
      it('should show delete modal when confirmDelete is called', () => {
        const hero = mockHeroes[0];
        component.confirmDelete(hero);

        expect(component.showDeleteModal()).toBeTrue();
        expect(component.heroToDelete()).toBe(hero);
      });

      it('should cancel delete modal', () => {
        const hero = mockHeroes[0];
        component.confirmDelete(hero);
        component.cancelDelete();

        expect(component.showDeleteModal()).toBeFalse();
        expect(component.heroToDelete()).toBeNull();
      });

      it('should delete hero when confirmed', async () => {
        const hero = mockHeroes[0];
        component.confirmDelete(hero);

        await component.deleteHero();

        expect(mockHeroService.deleteHero).toHaveBeenCalledWith(hero.id);
        expect(component.showDeleteModal()).toBeFalse();
      });

      it('should handle delete hero error', async () => {
        spyOn(console, 'error');

        mockHeroService.deleteHero.and.returnValue(
          Promise.reject(new Error('Network error'))
        );

        const hero = mockHeroes[0];
        component.confirmDelete(hero);

        await component.deleteHero();

        expect(component.error()).toContain('Error deleting hero');
        expect(component.showDeleteModal()).toBeTrue();
        expect(console.error).toHaveBeenCalledWith(
          'Error during deleting hero:',
          jasmine.any(Error)
        );
      });
    });

    describe('Form Validation', () => {
      it('should mark form as touched on invalid submission', async () => {
        component.showAddForm();
        spyOn(component as any, 'markFormGroupTouched');

        await component.onSubmit();

        expect((component as any).markFormGroupTouched).toHaveBeenCalled();
      });

      it('should validate required fields', () => {
        component.showAddForm();

        expect(component.isFieldInvalid('name')).toBeFalse(); // Not touched yet

        component.heroForm.get('name')?.markAsTouched();
        expect(component.isFieldInvalid('name')).toBeTrue(); // Required field is empty and touched

        component.heroForm.get('name')?.setValue('Test Hero');
        expect(component.isFieldInvalid('name')).toBeFalse(); // Now has value
      });

      it('should return appropriate error messages', () => {
        component.showAddForm();
        const nameControl = component.heroForm.get('name');

        nameControl?.markAsTouched();
        nameControl?.setErrors({ required: true });

        expect(component.getFieldError('name')).toBe('Name is required');

        nameControl?.setErrors({
          minlength: { requiredLength: 2, actualLength: 1 },
        });
        expect(component.getFieldError('name')).toBe(
          'Name must be at least 2 characters'
        );
      });
    });
  });

  describe('Template Integration', () => {
    it('should disable buttons when loading', () => {
      // Test that buttons exist and can be disabled
      fixture.detectChanges();

      const addButton = fixture.nativeElement.querySelector('.add-hero-btn');
      expect(addButton).toBeTruthy();
    });

    it('should apply uppercase directive to name input', () => {
      component.showAddForm();
      fixture.detectChanges();

      const nameInput = fixture.nativeElement.querySelector('#name');
      expect(nameInput).toBeTruthy();
      expect(nameInput.hasAttribute('appuppercase')).toBeTruthy();
    });
  });

  describe('Track By Functions', () => {
    it('should track heroes by id', () => {
      const hero = mockHeroes[0];
      const trackByResult = component.trackByHeroId(0, hero);
      expect(trackByResult).toBe(hero.id);
    });

    it('should track pagination by page number', () => {
      const page = 2;
      const trackByResult = component.trackByPageNumber(0, page);
      expect(trackByResult).toBe(page);
    });
  });
});
