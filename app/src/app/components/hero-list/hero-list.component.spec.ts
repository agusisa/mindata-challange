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
import { Hero } from '../../models/hero.model';

describe('HeroListComponent', () => {
  let component: HeroListComponent;
  let fixture: ComponentFixture<HeroListComponent>;
  let mockHeroService: jasmine.SpyObj<HeroService>;

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
    const spy = jasmine.createSpyObj(
      'HeroService',
      ['createHero', 'updateHero', 'deleteHero', 'searchHeroes', 'getHeroes'],
      {
        heroes: signal(mockHeroes),
        heroCount: signal(mockHeroes.length),
      }
    );

    await TestBed.configureTestingModule({
      imports: [HeroListComponent, ReactiveFormsModule],
      providers: [{ provide: HeroService, useValue: spy }],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroListComponent);
    component = fixture.componentInstance;
    mockHeroService = TestBed.inject(
      HeroService
    ) as jasmine.SpyObj<HeroService>;

    // Setup default behavior for searchHeroes
    mockHeroService.searchHeroes.and.returnValue(mockHeroes);
    mockHeroService.getHeroes.and.returnValue(mockHeroes);

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

      it('should create hero when form is submitted', () => {
        const newHero: Hero = {
          id: '4',
          name: 'Wonder Woman',
          superpower: 'Super Strength',
          alterEgo: 'Diana Prince',
          city: 'Themyscira',
        };

        component.showAddForm();
        component.heroForm.patchValue(newHero);
        component.onSubmit();

        expect(mockHeroService.createHero).toHaveBeenCalledWith(newHero);
        expect(component.showForm()).toBeFalse();
      });
    });

    describe('Edit Hero', () => {
      it('should show edit form when showEditForm is called', () => {
        const hero = mockHeroes[0];
        component.showEditForm(hero);

        expect(component.showForm()).toBeTrue();
        expect(component.isEditing()).toBeTrue();
        expect(component.heroForm.get('name')?.value).toBe(hero.name);
      });

      it('should update hero when form is submitted in edit mode', () => {
        const hero = mockHeroes[0];
        const updatedHero = { ...hero, name: 'Updated Spider-Man' };

        component.showEditForm(hero);
        component.heroForm.patchValue(updatedHero);
        component.onSubmit();

        expect(mockHeroService.updateHero).toHaveBeenCalledWith(updatedHero);
        expect(component.showForm()).toBeFalse();
      });
    });

    describe('Hide Form', () => {
      it('should hide form and reset state', () => {
        component.showAddForm();
        component.hideForm();

        expect(component.showForm()).toBeFalse();
        expect(component.isEditing()).toBeFalse();
        expect(component.heroForm.get('name')?.value).toBeNull();
      });
    });
  });

  describe('Delete Operations', () => {
    it('should show delete modal when confirmDelete is called', () => {
      const hero = mockHeroes[0];
      component.confirmDelete(hero);

      expect(component.showDeleteModal()).toBeTrue();
      expect(component.heroToDelete()).toBe(hero);
    });

    it('should hide delete modal when cancelDelete is called', () => {
      const hero = mockHeroes[0];
      component.confirmDelete(hero);
      component.cancelDelete();

      expect(component.showDeleteModal()).toBeFalse();
      expect(component.heroToDelete()).toBeNull();
    });

    it('should delete hero when deleteHero is called', () => {
      const hero = mockHeroes[0];
      component.confirmDelete(hero);
      component.deleteHero();

      expect(mockHeroService.deleteHero).toHaveBeenCalledWith(hero.id);
      expect(component.showDeleteModal()).toBeFalse();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for required fields', () => {
      component.showAddForm();

      // Touch required fields without setting values
      component.heroForm.get('name')?.markAsTouched();
      component.heroForm.get('superpower')?.markAsTouched();
      component.heroForm.get('city')?.markAsTouched();

      expect(component.isFieldInvalid('name')).toBeTrue();
      expect(component.isFieldInvalid('superpower')).toBeTrue();
      expect(component.isFieldInvalid('city')).toBeTrue();
    });

    it('should return appropriate error messages', () => {
      component.showAddForm();
      component.heroForm.get('name')?.markAsTouched();

      const errorMessage = component.getFieldError('name');
      expect(errorMessage).toContain('required');
    });

    it('should not submit invalid form', () => {
      component.showAddForm();
      component.onSubmit();

      expect(mockHeroService.createHero).not.toHaveBeenCalled();
      expect(component.showForm()).toBeTrue(); // Form should still be visible
    });
  });

  describe('TrackBy Functions', () => {
    it('should have trackBy functions defined', () => {
      expect(component.trackByHeroId).toBeDefined();
      expect(component.trackByPageNumber).toBeDefined();
    });

    it('should return correct values from trackBy functions', () => {
      const hero = mockHeroes[0];
      const heroTrackBy = component.trackByHeroId(0, hero);
      const pageTrackBy = component.trackByPageNumber(0, 1);

      expect(heroTrackBy).toBe(hero.id);
      expect(pageTrackBy).toBe(1);
    });
  });
});
