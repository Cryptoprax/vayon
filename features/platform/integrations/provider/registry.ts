import type { IntegrationProvider } from "./contracts";
import { InactiveIntegrationProvider } from "./contracts";
import { ConfiguredIntegrationAdapter, GmailIntegrationAdapter, GoogleCalendarIntegrationAdapter, MapsIntegrationAdapter, OpenAIIntegrationAdapter, StorageIntegrationAdapter, StripeIntegrationAdapter, WhatsAppIntegrationAdapter } from "./adapters";
import { MicrosoftBusinessIntegrationAdapter, MicrosoftIdentityIntegrationAdapter } from "../microsoft/provider/adapter";
import { microsoftProviderRegistry } from "../microsoft/provider/registry";

class FutureAdapter extends InactiveIntegrationProvider { constructor(readonly code:string){ super() } }
export class IntegrationProviderRegistry {
  private factories=new Map<string,()=>IntegrationProvider>();
  constructor(){
    this.register("openai",()=>new OpenAIIntegrationAdapter());
    this.register("gmail",()=>new GmailIntegrationAdapter());
    this.register("google_calendar",()=>new GoogleCalendarIntegrationAdapter());
    this.register("whatsapp_business",()=>new WhatsAppIntegrationAdapter());
    this.register("stripe",()=>new StripeIntegrationAdapter());
    this.register("google_maps",()=>new MapsIntegrationAdapter());
    this.register("supabase_storage",()=>new StorageIntegrationAdapter());
    this.register("microsoft_identity",()=>new MicrosoftIdentityIntegrationAdapter());
    for(const descriptor of microsoftProviderRegistry.filter(item=>item.capability!=="identity"))this.register(descriptor.code,()=>new MicrosoftBusinessIntegrationAdapter(descriptor));
    const configured:[string,IntegrationProvider["authMethod"],string[]][]=[
      ["google_ads","oauth2",[]],["google_analytics_4","oauth2",[]],["google_search_console","oauth2",[]],["google_business_profile","oauth2",[]],["meta_ads","oauth2",[]],["linkedin_ads","oauth2",[]],["razorpay","api_key",["RAZORPAY_KEY_ID","RAZORPAY_KEY_SECRET"]],["microsoft_365","oauth2",[]],["microsoft_graph","oauth2",[]],["outlook_calendar","oauth2",[]],["twilio","api_key",["TWILIO_ACCOUNT_SID","TWILIO_AUTH_TOKEN"]],["resend","api_key",["RESEND_API_KEY"]],["sendgrid","api_key",["SENDGRID_API_KEY"]],["zoom","oauth2",[]],["microsoft_teams","oauth2",[]],["anthropic","api_key",["ANTHROPIC_API_KEY"]],
    ];
    for(const[code,auth,variables]of configured)this.register(code,()=>new ConfiguredIntegrationAdapter(code,auth,variables));
    for(const code of["gemini"])this.register(code,()=>new FutureAdapter(code));
  }
  register(code:string,factory:()=>IntegrationProvider){this.factories.set(code,factory)}
  resolve(code:string){const provider=this.factories.get(code);if(!provider)throw new Error(`Integration provider '${code}' is not registered.`);return provider()}
  codes(){return[...this.factories.keys()]}
}
