import { ProductIntelligenceDashboard } from "@/features/platform/product-intelligence/components/ProductIntelligenceDashboard";
import { ProductIntelligenceService } from "@/features/platform/product-intelligence/services/product-intelligence.service";
import { ContinuousLearningDashboard } from "@/features/platform/continuous-learning/components/ContinuousLearningDashboard";
import { ContinuousLearningService } from "@/features/platform/continuous-learning/services/continuous-learning.service";
export default async function Page() {
  const [snapshot, learning] = await Promise.all([
    new ProductIntelligenceService().snapshot(),
    new ContinuousLearningService().snapshot(),
  ]);
  return (
    <>
      <ProductIntelligenceDashboard snapshot={snapshot} />
      <ContinuousLearningDashboard snapshot={learning} />
    </>
  );
}
