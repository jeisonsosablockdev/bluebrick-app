{ pkgs }: {
  deps = [
    pkgs.nodejs-22_x
    pkgs.python311
    pkgs.git
    pkgs.ffmpeg
    pkgs.openssl
    pkgs.postgresql
    pkgs.pkg-config
    pkgs.jq
  ];

  env = {
    NODE_ENV = "development";
    AIRWALLEX_ENV = "demo";
    APP_BASE_URL = "http://localhost:3000";

    GCS_SIGNED_URL_TTL_SECONDS = "900";
    GCS_UPLOAD_BUCKET = "metaplex-nft-dev-admin-assets-1773651938";
    GCS_UPLOAD_CDN_BASE_URL = "https://storage.googleapis.com/metaplex-nft-dev-admin-assets-1773651938";

    NEXT_PUBLIC_PURCHASE_TRACE_UI = "true";
    NEXT_PUBLIC_WALLET_MODAL_AUTO_CLOSE = "false";
    NEXT_PUBLIC_SOLANA_RPC = "https://api.devnet.solana.com";

    ORPHAN_UPLOAD_ABANDONED_RETENTION_DAYS = "30";
    ORPHAN_UPLOAD_TEMP_RETENTION_DAYS = "7";

    PINATA_GATEWAY_BASE_URL = "https://gateway.pinata.cloud/ipfs";
    PURCHASE_TRACE_ENABLED = "true";
    PURCHASE_TRACE_ERRORS_ONLY = "false";

    QSTASH_BASE_URL = "https://qstash.upstash.io";

    SQUADS_FREEZE_AUTHORITY = "8jSXKgtHxEJnUgZ4jDauC1mu1Fh7LDKcX6UfbJ2g7yLN";
    SQUADS_TRANSFER_AUTHORITY = "8jSXKgtHxEJnUgZ4jDauC1mu1Fh7LDKcX6UfbJ2g7yLN";
  };
}
