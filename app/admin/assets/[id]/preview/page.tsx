import { AssetPreviewConsole } from "@/features/admin/presentation/asset-preview-console";

type AdminAssetPreviewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminAssetPreviewPage({ params }: AdminAssetPreviewPageProps) {
  const { id } = await params;

  return <AssetPreviewConsole assetId={id} />;
}
