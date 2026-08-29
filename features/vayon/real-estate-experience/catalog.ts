export const executiveKpis = ["New Leads", "Active Buyers", "Active Sellers", "Active Listings", "Properties Sold", "Properties Rented", "Pending Offers", "Today's Site Visits", "Today's Meetings", "Expected Revenue", "Commission Earned", "Monthly Closings", "Lead Conversion", "Agent Productivity", "Average Closing Time", "Customer Satisfaction"] as const;

export const assistantQuickActions = ["Find matching properties", "Find matching buyers", "Generate luxury property description", "Generate WhatsApp follow-up", "Generate email follow-up", "Generate listing headline", "Schedule site visit", "Estimate property valuation", "Recommend next action", "Create property marketing campaign", "Generate social media content", "Generate brochure", "Summarize client conversation", "Draft offer letter", "Generate agreement draft"] as const;

export const salesCopilotActions = ["Recommend Property", "Generate WhatsApp Reply", "Generate Email", "Summarize Meeting", "Prepare Brochure", "Create Social Post", "Create Listing Description", "Schedule Viewing", "Estimate Valuation", "Generate Offer Letter", "Generate Agreement", "Recommend Next Action", "Summarize customer"] as const;
export const smartNotificationTypes = ["New Buyer Lead", "Hot Buyer Identified", "Offer Received", "Price Reduction Suggested", "Viewing Confirmed", "Registration Scheduled", "Commission Released", "Property Expiring", "Listing Needs Attention"] as const;
export const transactionSignals = ["Transaction Progress", "Buyer", "Seller", "Assigned Agent", "Commission", "Expected Closing", "Pending Documents", "Loan Status", "Registration Status", "Approvals", "Risk Level", "AI Recommendations", "Timeline"] as const;
export const globalSearchGroups = ["Properties", "Clients", "Leads", "Agents", "Builders", "Developers", "Communities", "Transactions", "Documents"] as const;

export const propertySignals = ["AI Listing Score", "Demand Score", "Pricing Competitiveness", "Buyer Match Count", "Matching Leads", "Suggested Improvements", "Marketing Status", "Social Reach", "Lead Interest Timeline", "Nearby Market Trends", "Average Time On Market", "Price Comparison", "Recommended Price"] as const;

export const leadProfileFields = ["Buyer/Seller type", "Budget", "Preferred locations", "Preferred communities", "Preferred builders", "Property type", "Investment purpose", "Family size", "Timeline to purchase", "Mortgage required", "AI Buying Intent", "Recommended Properties", "Recommended Actions", "Interaction Timeline"] as const;

export const transactionStages = ["Lead", "Qualified", "Viewing Scheduled", "Viewed", "Negotiation", "Offer Submitted", "Offer Accepted", "Loan Processing", "Legal Verification", "Registration", "Closed", "Completed", "Cancelled"] as const;
export const calendarCategories = ["Site Visit", "Property Inspection", "Buyer Meeting", "Seller Meeting", "Registration", "Handover", "Open House", "Mortgage Meeting", "Virtual Tour", "Follow-up Call"] as const;
export const propertyMarketingTools = ["Luxury Brochure", "Flyer Generator", "Property Reel", "Instagram Post", "Facebook Campaign", "Google Ads", "WhatsApp Campaign", "Email Campaign", "QR Flyer", "Open House Invitation", "Virtual Tour Landing Page"] as const;
export const buyerIntelligenceWidgets = ["Budget Distribution", "Location Demand", "Bedroom Demand", "Property Type Demand", "Investment Buyers", "Luxury Buyers", "Returning Buyers", "High Intent Buyers", "Buyer Activity Heatmap", "Conversion Funnel"] as const;
export const sellerIntelligenceWidgets = ["Seller Pipeline", "Valuation Requests", "Listing Pipeline", "Listing Performance", "Listing Quality", "Average Selling Time", "Price Reduction Alerts", "High Potential Sellers"] as const;
export const propertyAnalyticsWidgets = ["Most Viewed Properties", "Least Viewed Properties", "Trending Listings", "Inactive Listings", "Most Shared Listings", "Highest Converting Listings", "Price Changes", "Buyer Interest", "Viewing Requests", "Offer Rate"] as const;
export const realEstateReports = ["Sales Report", "Commission Report", "Agent Performance", "Property Performance", "Buyer Report", "Seller Report", "Marketing ROI", "Revenue Report", "Listing Performance", "Lead Conversion", "Viewing Analytics", "Closing Analytics"] as const;

export const recommendations = {
  property: ["Improve cover photo", "Review pricing", "Schedule Open House", "Create Instagram campaign", "Notify matching buyers", "Generate brochure"],
  lead: ["Call today", "Send WhatsApp", "Recommend Property", "Book Site Visit", "Request Mortgage Info"],
  transaction: ["Schedule Registration", "Generate Agreement", "Notify Buyer", "Notify Seller"],
} as const;
