import { Injectable, signal, computed } from '@angular/core';
import { Hero } from '../models/hero.model';

@Injectable({
  providedIn: 'root',
})
export class HeroService {
  private readonly _heroes = signal<Hero[]>(this.getInitialHeroes());

  // Public readonly signals
  readonly heroes = this._heroes.asReadonly();
  readonly heroCount = computed(() => this.heroes().length);

  createHero(hero: Omit<Hero, 'id'> | Hero): void {
    const newHero: Hero = {
      ...hero,
      id: 'id' in hero && hero.id ? hero.id : this.generateId(),
    };

    this._heroes.update((heroes) => [...heroes, newHero]);
  }

  getHeroes(): readonly Hero[] {
    return this._heroes();
  }

  getHeroById(id: string): Hero | undefined {
    return this._heroes().find((hero) => hero.id === id);
  }

  searchHeroes(term: string): readonly Hero[] {
    if (!term.trim()) {
      return this.getHeroes();
    }

    const searchTerm = term.toLowerCase().trim();
    return this._heroes().filter((hero) =>
      this.matchesSearchTerm(hero, searchTerm)
    );
  }

  updateHero(updatedHero: Hero): void {
    this._heroes.update((heroes) => {
      const index = heroes.findIndex((hero) => hero.id === updatedHero.id);
      if (index !== -1) {
        const updatedHeroes = [...heroes];
        updatedHeroes[index] = { ...updatedHero };
        return updatedHeroes;
      }
      return heroes;
    });
  }

  deleteHero(id: string): void {
    this._heroes.update((heroes) => heroes.filter((hero) => hero.id !== id));
  }

  private matchesSearchTerm(hero: Hero, searchTerm: string): boolean {
    const searchableFields = [
      hero.name,
      hero.superpower,
      hero.city,
      hero.alterEgo,
    ].filter(Boolean);

    return searchableFields.some((field) =>
      field!.toLowerCase().includes(searchTerm)
    );
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private getInitialHeroes(): Hero[] {
    return [
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
      {
        id: '4',
        name: 'Wonder Woman',
        superpower: 'Super strength',
        alterEgo: 'Diana Prince',
        city: 'Themyscira',
      },
      {
        id: '5',
        name: 'Iron Man',
        superpower: 'Technology',
        alterEgo: 'Tony Stark',
        city: 'New York',
      },
      {
        id: '6',
        name: 'Thor',
        superpower: 'Thunder',
        alterEgo: 'Thor Odinson',
        city: 'Asgard',
      },
      {
        id: '7',
        name: 'Captain America',
        superpower: 'Super strength',
        alterEgo: 'Steve Rogers',
        city: 'New York',
      },
      {
        id: '8',
        name: 'Hulk',
        superpower: 'Super strength',
        alterEgo: 'Bruce Banner',
        city: 'Dayton',
      },
      {
        id: '9',
        name: 'Black Widow',
        superpower: 'Intelligence',
        alterEgo: 'Natasha Romanoff',
        city: 'New York',
      },
      {
        id: '10',
        name: 'The Flash',
        superpower: 'Speed',
        alterEgo: 'Barry Allen',
        city: 'Central City',
      },
      {
        id: '11',
        name: 'The Green Lantern',
        superpower: 'Ring',
        alterEgo: 'Hal Jordan',
        city: 'Coast City',
      },
      {
        id: '12',
        name: 'The Green Lantern',
        superpower: 'Ring',
        alterEgo: 'Hal Jordan',
        city: 'Coast City',
      },
      {
        id: '13',
        name: 'The Green Lantern',
        superpower: 'Ring',
        alterEgo: 'Hal Jordan',
        city: 'Coast City',
      },
    ];
  }
}
