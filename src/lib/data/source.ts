import type { Article, ArticleSection, Business, Category, Country, District, Island, SearchFilters } from "@/lib/types";

/**
 * Everything the app reads goes through this interface. There are two
 * implementations: Supabase (production) and an in-memory demo source used
 * when no Supabase credentials are configured.
 */
export interface DataSource {
  mode: "supabase" | "demo";
  getCountries(): Promise<Country[]>;
  getIslands(country: string): Promise<Island[]>;
  getDistricts(country: string): Promise<District[]>;
  getCategories(country: string): Promise<Category[]>;
  searchBusinesses(country: string, filters: SearchFilters, limit?: number): Promise<Business[]>;
  /** How many businesses match, without loading them (cheap). */
  countBusinesses(country: string, filters: SearchFilters): Promise<number>;
  getBusiness(slug: string): Promise<Business | null>;
  getFeatured(country: string, limit: number): Promise<Business[]>;
  getRecent(country: string, limit: number): Promise<Business[]>;
  getArticles(country: string, section?: ArticleSection): Promise<Article[]>;
  getArticle(country: string, section: ArticleSection, slug: string): Promise<Article | null>;
}

/** Countries a business appears in: its locations plus the islands it serves. */
export function businessCountries(b: Business): string[] {
  return [...new Set([...b.locations.map((l) => l.countryCode), ...b.serviceAreas.map((a) => a.countryCode)])];
}
