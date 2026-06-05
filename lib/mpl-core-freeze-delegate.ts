type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as UnknownRecord;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

export function asPublicKeyString(value: unknown): string | null {
  const direct = asString(value);
  if (direct) {
    return direct;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    toBase58?: () => string;
    toString?: () => string;
  };

  if (typeof candidate.toBase58 === "function") {
    return asString(candidate.toBase58());
  }

  if (typeof candidate.toString === "function") {
    const normalized = asString(candidate.toString());
    return normalized && normalized !== "[object Object]" ? normalized : null;
  }

  return null;
}

function authorityKind(value: unknown): string | null {
  const record = asRecord(value);
  return asString(record.type) ?? asString(record.__kind);
}

export function hasOwnerFreezeDelegatePlugin(assetLike: unknown): boolean {
  const asset = asRecord(assetLike);
  const freezeDelegate = asRecord(asset.freezeDelegate);
  const authority = asRecord(freezeDelegate.authority);
  const kind = authorityKind(authority);

  if (kind === "Owner") {
    return true;
  }

  if (kind !== "Address") {
    return false;
  }

  const owner = getMplCoreAssetOwner(asset);
  const authorityAddress = asPublicKeyString(authority.address);

  return Boolean(owner && authorityAddress && owner === authorityAddress);
}

export function getMplCoreAssetOwner(assetLike: unknown): string | null {
  return asPublicKeyString(asRecord(assetLike).owner);
}

export function getMplCoreAssetCollection(assetLike: unknown): string | null {
  const updateAuthority = asRecord(asRecord(assetLike).updateAuthority);
  if (authorityKind(updateAuthority) !== "Collection") {
    return null;
  }

  const fields = Array.isArray(updateAuthority.fields) ? updateAuthority.fields : [];
  return asPublicKeyString(fields[0] ?? updateAuthority.address);
}
