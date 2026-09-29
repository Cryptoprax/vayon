import "server-only";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { PropertyPriceRevisionRepository } from "../repositories/property-price-revision.repository";
import { assertRevisionId, validatePriceRevisionInput, type CreatePriceRevisionInput } from "../domain/types";

/**
 * Human-entered price revisions only. Nothing here reads extracted document
 * text, parses numbers from a document, or calls an AI provider: every value
 * originates from a person's form input and is validated server-side.
 */
export class PropertyPriceRevisionService {
  constructor(private repository: PropertyPriceRevisionRepository) {}

  static async production() {
    const context = await operationsContext();
    return new PropertyPriceRevisionService(new PropertyPriceRevisionRepository(context.client, context.organizationId, context.workspaceId));
  }

  list(propertyId: string) {
    return this.repository.list(propertyId);
  }

  current(propertyId: string) {
    return this.repository.current(propertyId);
  }

  async create(input: CreatePriceRevisionInput) {
    return this.repository.create(validatePriceRevisionInput(input));
  }

  async approve(revisionId: string) {
    return this.repository.approve(assertRevisionId(revisionId));
  }

  async archive(revisionId: string) {
    return this.repository.archive(assertRevisionId(revisionId));
  }
}
