import { TestBed } from '@angular/core/testing';
import { HeroService } from './hero.service';
import { Hero } from '../models/hero.model';

describe('HeroService', () => {
  let service: HeroService;
  let initialHeroes: readonly Hero[];
  let initialHeroCount: number;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HeroService);
    initialHeroes = service.getHeroes();
    initialHeroCount = initialHeroes.length;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getHeroes', () => {
    it('should return initial heroes', () => {
      const heroes = service.getHeroes();
      expect(heroes).toHaveSize(initialHeroCount);
      expect(heroes[0].name).toBe('Spider-Man');
      expect(heroes[1].name).toBe('Superman');
      expect(heroes[2].name).toBe('Batman');
    });

    it('should return heroes as signal', () => {
      const heroes = service.heroes();
      expect(heroes).toHaveSize(initialHeroCount);
      expect(heroes[0].name).toBe('Spider-Man');
    });
  });

  describe('createHero', () => {
    it('should add a new hero to the list', () => {
      const newHero: Hero = {
        id: '4',
        name: 'Wonder Woman',
        superpower: 'Super Strength',
        alterEgo: 'Diana Prince',
        city: 'Themyscira',
      };

      service.createHero(newHero);
      const heroes = service.getHeroes();

      expect(heroes).toHaveSize(initialHeroCount + 1);
      expect(heroes[heroes.length - 1].name).toBe(newHero.name);
    });

    it('should generate an ID if hero does not have one', () => {
      const newHero: Hero = {
        id: '',
        name: 'Flash',
        superpower: 'Super Speed',
        alterEgo: 'Barry Allen',
        city: 'Central City',
      };

      service.createHero(newHero);
      const heroes = service.getHeroes();
      const addedHero = heroes[heroes.length - 1];

      expect(addedHero.id).toBeTruthy();
      expect(addedHero.id).not.toBe('');
      expect(addedHero.name).toBe('Flash');
    });

    it('should update heroes signal when adding new hero', () => {
      const newHero: Hero = {
        id: '100',
        name: 'Green Lantern',
        superpower: 'Ring Power',
        city: 'Coast City',
      };

      service.createHero(newHero);
      const heroes = service.heroes();

      expect(heroes).toHaveSize(initialHeroCount + 1);
      expect(heroes[heroes.length - 1].name).toBe('Green Lantern');
    });
  });

  describe('getHeroById', () => {
    it('should return hero when ID exists', () => {
      const hero = service.getHeroById('1');
      expect(hero).toBeTruthy();
      expect(hero?.name).toBe('Spider-Man');
      expect(hero?.id).toBe('1');
    });

    it('should return undefined when ID does not exist', () => {
      const hero = service.getHeroById('999');
      expect(hero).toBeUndefined();
    });
  });

  describe('searchHeroes', () => {
    it('should return all heroes when search term is empty', () => {
      const results = service.searchHeroes('');
      expect(results).toHaveSize(initialHeroCount);
      expect(results).toEqual(service.getHeroes());
    });

    it('should return all heroes when search term is only whitespace', () => {
      const results = service.searchHeroes('   ');
      expect(results).toHaveSize(initialHeroCount);
    });

    it('should search by hero name', () => {
      const results = service.searchHeroes('spider');
      expect(results).toHaveSize(1);
      expect(results[0].name).toBe('Spider-Man');
    });

    it('should search by superpower', () => {
      const results = service.searchHeroes('flight');
      expect(results).toHaveSize(1);
      expect(results[0].name).toBe('Superman');
    });

    it('should search by city', () => {
      const results = service.searchHeroes('gotham');
      expect(results).toHaveSize(1);
      expect(results[0].name).toBe('Batman');
    });

    it('should search by alter ego', () => {
      const results = service.searchHeroes('clark');
      expect(results).toHaveSize(1);
      expect(results[0].name).toBe('Superman');
    });

    it('should be case insensitive', () => {
      const results = service.searchHeroes('BATMAN');
      expect(results).toHaveSize(1);
      expect(results[0].name).toBe('Batman');
    });

    it('should return multiple matches', () => {
      const results = service.searchHeroes('man');
      expect(results.length).toBeGreaterThan(0); // Should find heroes with "man" in the name
    });

    it('should return empty array when no matches found', () => {
      const results = service.searchHeroes('aquaman');
      expect(results).toHaveSize(0);
    });
  });

  describe('updateHero', () => {
    it('should update existing hero', () => {
      const updatedHero: Hero = {
        id: '1',
        name: 'Amazing Spider-Man',
        superpower: 'Web-slinging and Spider Sense',
        alterEgo: 'Peter Benjamin Parker',
        city: 'New York City',
      };

      service.updateHero(updatedHero);
      const hero = service.getHeroById('1');

      expect(hero?.name).toBe('Amazing Spider-Man');
      expect(hero?.superpower).toBe('Web-slinging and Spider Sense');
      expect(hero?.alterEgo).toBe('Peter Benjamin Parker');
      expect(hero?.city).toBe('New York City');
    });

    it('should not affect other heroes when updating', () => {
      const originalSuperman = service.getHeroById('2');
      const updatedHero: Hero = {
        id: '1',
        name: 'Updated Spider-Man',
        superpower: 'Updated Power',
        city: 'Updated City',
      };

      service.updateHero(updatedHero);
      const superman = service.getHeroById('2');

      expect(superman).toEqual(originalSuperman);
    });

    it('should update heroes signal when updating hero', () => {
      const updatedHero: Hero = {
        id: '1',
        name: 'Updated Spider-Man',
        superpower: 'Updated Power',
        city: 'Updated City',
      };

      service.updateHero(updatedHero);
      const heroes = service.heroes();
      const hero = heroes.find((h: Hero) => h.id === '1');

      expect(hero?.name).toBe('Updated Spider-Man');
    });
  });

  describe('deleteHero', () => {
    it('should remove hero from the list', () => {
      service.deleteHero('1');
      const heroes = service.getHeroes();

      expect(heroes).toHaveSize(initialHeroCount - 1);
      expect(heroes.find((h: Hero) => h.id === '1')).toBeUndefined();
    });

    it('should not affect other heroes when deleting', () => {
      const originalSuperman = service.getHeroById('2');
      const originalBatman = service.getHeroById('3');

      service.deleteHero('1');

      const superman = service.getHeroById('2');
      const batman = service.getHeroById('3');

      expect(superman).toEqual(originalSuperman);
      expect(batman).toEqual(originalBatman);
    });

    it('should handle deleting non-existent hero gracefully', () => {
      const originalLength = service.getHeroes().length;
      service.deleteHero('999');
      const newLength = service.getHeroes().length;

      expect(newLength).toBe(originalLength);
    });

    it('should update heroes signal when deleting hero', () => {
      service.deleteHero('1');
      const heroes = service.heroes();

      expect(heroes).toHaveSize(initialHeroCount - 1);
      expect(heroes.find((h: Hero) => h.id === '1')).toBeUndefined();
    });
  });
});
