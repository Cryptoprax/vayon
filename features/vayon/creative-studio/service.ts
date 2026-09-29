import "server-only";
import {InventoryService} from "@/features/vayon/property-platform/inventory/service";
import {PropertyService} from "@/features/vayon/property/services/property.service";
import {EnterpriseOrganizationService} from "@/features/platform/organization/services/organization.service";
import {creativeStudioAccess} from "./access.service";
import {SupabaseCreativeStudioRepository} from "./repository";
import {GovernedCreativeProvider} from "./providers";
import {templateCategories,type CampaignBrief,type CreativeBrandKit} from "./domain";
export class CreativeStudioService {
  private constructor(private repository:SupabaseCreativeStudioRepository,private source:"subscription"|"internal"){}
  static async production(){const access=await creativeStudioAccess();if(!access)return null;return new CreativeStudioService(new SupabaseCreativeStudioRepository(access.client,access.organizationId,access.workspaceId),access.source)}
  async snapshot(){const[campaigns,assets,brandKits]=await Promise.all([this.repository.campaigns(),this.repository.assets(),this.repository.brandKits()]);return{campaigns,assets,brandKits,templates:templateCategories.map((category,index)=>({id:`template-${index+1}`,category,name:`${category} campaign system`,editable:true as const})),analytics:[{label:"Drafts",value:String(campaigns.filter(x=>x.status==="draft").length),measured:true},{label:"Published",value:"0 · publishing disabled",measured:true},{label:"Templates",value:String(templateCategories.length),measured:true},{label:"Brand Kits",value:String(brandKits.length),measured:true},{label:"Creative Analytics",value:assets.length?`${assets.length} governed assets`:"Awaiting asset history",measured:Boolean(assets.length)}],access:{enabled:true as const,source:this.source},governance:{draftOnly:true as const,approvalRequired:true as const,livePublishing:false as const,externalRendering:false as const,tenantScoped:true as const}};}
  /** Phase C1: propertyId (Model A) is the required subject; the Model-B inventory snapshot stays available for the OPTIONAL propertyProjectId enrichment path -- properties/property_projects have no FK relationship, so both are fetched independently. */
  async projectContext(){const inventoryService=await InventoryService.production(),[inventory,organization,propertyPage]=await Promise.all([inventoryService.snapshot(),new EnterpriseOrganizationService().snapshot(),new PropertyService().list({page:1,pageSize:200,view:"table"})]);return{inventory,organization,properties:propertyPage.items.map(item=>({id:item.id,title:item.title}))};}
  /**
   * Part 11 decision: Option B (retain optional Model-B project enrichment,
   * never required). The selected public.properties row is ALWAYS the
   * baseline grounding (title/city/type/price/specification) -- generation
   * never blocks on a missing property-project link. When brief.
   * propertyProjectId IS also supplied, the existing Model-B unit/pricing/
   * gallery enrichment (unchanged logic) is layered on top for richer
   * content. No K4/K5 retrieval wiring in C1 (deferred, per Part 11).
   */
  async preview(brief:CampaignBrief){
    const{inventory,organization}=await this.projectContext(),
      property=await new PropertyService().detail(brief.propertyId);
    if(!property)throw new Error("Select a property.");
    const project=brief.propertyProjectId?inventory.projects.find(x=>x.id===brief.propertyProjectId):undefined,
      units=project?inventory.units.filter(x=>x.projectId===project.id&&x.status==="available"):[],
      prices=units.map(x=>x.offerPrice??x.price),
      brand:CreativeBrandKit=(await this.repository.brandKits())[0]??{id:"organization-brand",name:organization.profile.name,logoPath:organization.profile.logoPath??undefined,colors:[organization.profile.branding.primary,organization.profile.branding.accent].filter(Boolean)as string[],typography:[],fonts:[],icons:[],watermarks:[],phone:organization.profile.phone??undefined,address:Object.values(organization.profile.address).join(", "),website:organization.profile.website??undefined,socialLinks:{},tone:"Professional real estate",version:organization.profile.version},
      propertyPrice=property.salePrice??property.rentalPrice,
      generated=new GovernedCreativeProvider().generate({
        brief,
        projectName:project?.name??property.title,
        developer:project?.developer??organization.profile.name,
        location:project?`${project.city}, ${project.state}`:property.address.city,
        availableInventory:units.length,
        priceRange:prices.length?`${Math.min(...prices)}–${Math.max(...prices)} ${units[0]?.currency??organization.profile.currency}`:propertyPrice?`${propertyPrice.amount} ${propertyPrice.currency}`:"Pricing unavailable",
        brandKit:brand,
      });
    return{property,project,brand,generated,source:{inventory:units,pricing:project?inventory.prices.filter(x=>x.projectId===project.id):[],documents:project?inventory.documents.filter(x=>x.projectId===project.id):[],organization:organization.profile},draftOnly:true as const};
  }
  async saveDraft(brief:CampaignBrief,name:string){const preview=await this.preview(brief);return this.repository.saveDraft({brief,name,projectName:preview.project?.name??preview.property.title,developer:preview.project?.developer??"",payload:preview.generated});}
}
