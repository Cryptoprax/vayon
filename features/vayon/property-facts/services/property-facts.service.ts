import "server-only";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { PropertyPriceRevisionRepository } from "../repositories/property-price-revision.repository";
import { getAuthoritativePropertyFacts } from "./authoritative-property-facts.service";

export class PropertyFactsService {
  constructor(
    private client: Awaited<ReturnType<typeof operationsContext>>["client"],
    private organizationId: string,
    private workspaceId: string,
  ) {}

  static async production() {
    const context = await operationsContext();
    return new PropertyFactsService(context.client, context.organizationId, context.workspaceId);
  }

  async load(propertyId: string) {
    const [facts, revisions] = await Promise.all([
      getAuthoritativePropertyFacts(this.client, { organizationId: this.organizationId, workspaceId: this.workspaceId, propertyId }),
      new PropertyPriceRevisionRepository(this.client, this.organizationId, this.workspaceId).list(propertyId),
    ]);
    return { facts, revisions };
  }
}
