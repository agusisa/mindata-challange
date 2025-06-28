import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Hero } from '../models/hero.model';

@Injectable({
  providedIn: 'root',
})
export class HeroService {
  private readonly _heroes = new BehaviorSubject<Hero[]>(
    this.getInitialHeroes()
  );

  readonly heroes$ = this._heroes.asObservable();
  readonly heroCount$ = this.heroes$.pipe(map((heroes) => heroes.length));

  createHero(hero: Omit<Hero, 'id'> | Hero): void {
    const newHero: Hero = {
      ...hero,
      id: 'id' in hero ? hero.id : this.generateId(),
    };

    this._heroes.next([...this._heroes.value, newHero]);
  }

  getHeroes(): readonly Hero[] {
    return this._heroes.value;
  }

  getHeroById(id: string): Hero | undefined {
    return this._heroes.value.find((hero) => hero.id === id);
  }

  searchHeroes(term: string): readonly Hero[] {
    if (!term.trim()) {
      return this.getHeroes();
    }

    const searchTerm = term.toLowerCase().trim();
    return this._heroes.value.filter((hero) =>
      this.matchesSearchTerm(hero, searchTerm)
    );
  }

  updateHero(updatedHero: Hero): void {
    const heroes = this._heroes.value;
    const index = heroes.findIndex((hero) => hero.id === updatedHero.id);

    if (index !== -1) {
      const updatedHeroes = [...heroes];
      updatedHeroes[index] = { ...updatedHero };
      this._heroes.next(updatedHeroes);
    }
  }

  deleteHero(id: string): void {
    const filteredHeroes = this._heroes.value.filter((hero) => hero.id !== id);
    this._heroes.next(filteredHeroes);
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
    ];
  }
}
