import {
  DocumentationRepository,
  openApiResources,
} from "../repositories/documentation.repository";
import type { DocumentationSearch } from "../contracts/documentation";
export class DocumentationService {
  constructor(private readonly repository = new DocumentationRepository()) {}
  home(query = "", category?: string) {
    const articles = this.repository.search({ query, category, limit: 30 });
    return {
      articles,
      categories: [
        ...new Set(this.repository.list().map((article) => article.category)),
      ],
      popular: this.repository.popular(),
      query,
      category,
      failed: query.length > 0 && articles.length === 0,
    };
  }
  article(slug: string) {
    const article = this.repository.find(slug);
    if (!article) return null;
    return {
      article,
      related: article.related
        .map((item) => this.repository.find(item))
        .filter(Boolean),
    };
  }
  search(input: DocumentationSearch) {
    return this.repository.search(input);
  }
  api() {
    return openApiResources;
  }
  all() {
    return this.repository.list();
  }
}
