import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
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
      ['createHero', 'updateHero', 'deleteHero', 'searchHeroes'],
      {
        heroes$: of(mockHeroes),
        heroCount$: of(mockHeroes.length),
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

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(component.currentPage).toBe(1);
      expect(component.showForm).toBeFalse();
      expect(component.isEditing).toBeFalse();
      expect(component.showDeleteModal).toBeFalse();
    });

    it('should initialize forms', () => {
      expect(component.searchForm).toBeDefined();
      expect(component.heroForm).toBeDefined();
      expect(component.searchForm.get('searchTerm')?.value).toBe('');
    });

    it('should have reactive data streams', () => {
      expect(component.filteredHeroes$).toBeDefined();
      expect(component.paginatedHeroes$).toBeDefined();
      expect(component.componentState$).toBeDefined();
      expect(component.paginationState$).toBeDefined();
    });
  });

  describe('Search Functionality', () => {
    it('should call searchHeroes when search term changes', (done) => {
      const searchTerm = 'spider';
      mockHeroService.searchHeroes.and.returnValue([mockHeroes[0]]);

      component.searchForm.get('searchTerm')?.setValue(searchTerm);

      // Wait for debounce
      setTimeout(() => {
        expect(mockHeroService.searchHeroes).toHaveBeenCalledWith(searchTerm);
        done();
      }, 350);
    });

    it('should provide filtered heroes through observable', (done) => {
      const searchResults = [mockHeroes[0]];
      mockHeroService.searchHeroes.and.returnValue(searchResults);

      component.filteredHeroes$.subscribe((heroes) => {
        expect(heroes).toEqual(searchResults);
        done();
      });
    });
  });

  describe('Pagination', () => {
    it('should calculate pagination correctly', (done) => {
      // Setup more heroes to test pagination
      const manyHeroes = Array.from({ length: 12 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Hero ${i + 1}`,
        superpower: `Power ${i + 1}`,
        city: `City ${i + 1}`,
      }));

      mockHeroService.searchHeroes.and.returnValue(manyHeroes);
      component.searchForm.get('searchTerm')?.setValue('');

      // Wait for pagination to update
      setTimeout(() => {
        expect(component.totalPages).toBe(3); // 12 heroes / 5 per page = 3 pages
        done();
      }, 100);
    });

    it('should navigate to next page', () => {
      // Set total pages first
      component['_paginationState'].next({
        currentPage: 1,
        itemsPerPage: 5,
        totalItems: 10,
        totalPages: 2,
      });

      component.nextPage();
      expect(component.currentPage).toBe(2);
    });

    it('should navigate to previous page', () => {
      component['_paginationState'].next({
        currentPage: 2,
        itemsPerPage: 5,
        totalItems: 10,
        totalPages: 2,
      });

      component.previousPage();
      expect(component.currentPage).toBe(1);
    });

    it('should navigate to specific page', () => {
      component['_paginationState'].next({
        currentPage: 1,
        itemsPerPage: 5,
        totalItems: 15,
        totalPages: 3,
      });

      component.goToPage(3);
      expect(component.currentPage).toBe(3);
    });

    it('should not navigate beyond valid page range', () => {
      component['_paginationState'].next({
        currentPage: 1,
        itemsPerPage: 5,
        totalItems: 10,
        totalPages: 2,
      });

      component.goToPage(10);
      expect(component.currentPage).toBe(1); // Should stay on current page
    });

    it('should generate correct pagination array', () => {
      component['_paginationState'].next({
        currentPage: 1,
        itemsPerPage: 5,
        totalItems: 15,
        totalPages: 3,
      });

      const paginationArray = component.getPaginationArray();
      expect(paginationArray).toEqual([1, 2, 3]);
    });
  });

  describe('Form Operations', () => {
    describe('Add Hero', () => {
      it('should show add form when showAddForm is called', () => {
        component.showAddForm();

        expect(component.showForm).toBeTrue();
        expect(component.isEditing).toBeFalse();
        expect(component.editingHeroId).toBeNull();
      });

      it('should create hero when form is submitted with valid data', () => {
        component.showAddForm();

        const newHero = {
          id: '',
          name: 'Wonder Woman',
          superpower: 'Super Strength',
          alterEgo: 'Diana Prince',
          city: 'Themyscira',
        };

        component.heroForm.patchValue(newHero);
        component.onSubmit();

        expect(mockHeroService.createHero).toHaveBeenCalledWith(newHero);
        expect(component.showForm).toBeFalse();
      });
    });

    describe('Edit Hero', () => {
      it('should show edit form with hero data', () => {
        const heroToEdit = mockHeroes[0];

        component.showEditForm(heroToEdit);

        expect(component.showForm).toBeTrue();
        expect(component.isEditing).toBeTrue();
        expect(component.editingHeroId).toBe(heroToEdit.id);
        expect(component.heroForm.value).toEqual(
          jasmine.objectContaining({
            name: heroToEdit.name,
            superpower: heroToEdit.superpower,
            alterEgo: heroToEdit.alterEgo,
            city: heroToEdit.city,
          })
        );
      });

      it('should update hero when form is submitted with valid data', () => {
        const heroToEdit = mockHeroes[0];
        component.showEditForm(heroToEdit);

        const updatedHero = {
          ...heroToEdit,
          name: 'Amazing Spider-Man',
        };

        component.heroForm.patchValue(updatedHero);
        component.onSubmit();

        expect(mockHeroService.updateHero).toHaveBeenCalledWith(updatedHero);
        expect(component.showForm).toBeFalse();
      });
    });

    describe('Form Validation', () => {
      it('should not submit form when invalid', () => {
        component.showAddForm();
        component.heroForm.patchValue({
          name: '', // Required field empty
          superpower: 'Power',
          city: 'City',
        });

        component.onSubmit();

        expect(mockHeroService.createHero).not.toHaveBeenCalled();
        expect(component.showForm).toBeTrue();
      });

      it('should detect invalid fields', () => {
        component.showAddForm();
        const nameControl = component.heroForm.get('name');
        nameControl?.setValue('');
        nameControl?.markAsTouched();

        expect(component.isFieldInvalid('name')).toBeTrue();
      });

      it('should return correct error messages', () => {
        component.showAddForm();
        const nameControl = component.heroForm.get('name');
        nameControl?.setValue('');
        nameControl?.markAsTouched();

        const errorMessage = component.getFieldError('name');
        expect(errorMessage).toContain('required');
      });
    });

    it('should hide form when hideForm is called', () => {
      component.showAddForm();
      component.hideForm();

      expect(component.showForm).toBeFalse();
      expect(component.isEditing).toBeFalse();
      expect(component.editingHeroId).toBeNull();
    });
  });

  describe('Delete Operations', () => {
    it('should show delete modal when confirmDelete is called', () => {
      const heroToDelete = mockHeroes[0];

      component.confirmDelete(heroToDelete);

      expect(component.showDeleteModal).toBeTrue();
      expect(component.heroToDelete).toBe(heroToDelete);
    });

    it('should hide delete modal when cancelDelete is called', () => {
      component.confirmDelete(mockHeroes[0]);
      component.cancelDelete();

      expect(component.showDeleteModal).toBeFalse();
      expect(component.heroToDelete).toBeNull();
    });

    it('should delete hero and close modal when deleteHero is called', () => {
      const heroToDelete = mockHeroes[0];
      component.confirmDelete(heroToDelete);

      component.deleteHero();

      expect(mockHeroService.deleteHero).toHaveBeenCalledWith(heroToDelete.id);
      expect(component.showDeleteModal).toBeFalse();
      expect(component.heroToDelete).toBeNull();
    });
  });

  describe('Utility Methods', () => {
    it('should have trackBy functions for performance', () => {
      expect(component.trackByHeroId).toBeDefined();
      expect(component.trackByPageNumber).toBeDefined();
    });

    it('should track heroes by id', () => {
      const hero = mockHeroes[0];
      const result = component.trackByHeroId(0, hero);
      expect(result).toBe(hero.id);
    });

    it('should track pages by number', () => {
      const result = component.trackByPageNumber(0, 1);
      expect(result).toBe(1);
    });

    it('should capitalize first letter', () => {
      const result = component['capitalizeFirst']('name');
      expect(result).toBe('Name');
    });
  });

  describe('Template Integration', () => {
    it('should display search input', () => {
      const searchInput =
        fixture.debugElement.nativeElement.querySelector('.search-input');
      expect(searchInput).toBeTruthy();
    });

    it('should display add hero button', () => {
      const addButton =
        fixture.debugElement.nativeElement.querySelector('.add-hero-btn');
      expect(addButton).toBeTruthy();
      expect(addButton.textContent.trim()).toBe('Añadir Héroe');
    });

    it('should show form when showForm is true', () => {
      component.showAddForm();
      fixture.detectChanges();

      const formContainer = fixture.debugElement.nativeElement.querySelector(
        '.hero-form-container'
      );
      expect(formContainer).toBeTruthy();
    });

    it('should show delete modal when showDeleteModal is true', () => {
      component.confirmDelete(mockHeroes[0]);
      fixture.detectChanges();

      const modal =
        fixture.debugElement.nativeElement.querySelector('.modal-overlay');
      expect(modal).toBeTruthy();
    });
  });
});
