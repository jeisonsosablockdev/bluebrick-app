export interface PackageInfo {
  name: string;
  version: string;
  license: string;
  vendor?: boolean;
}

export interface LicensePolicy {
  allowed: string[];
  warn: string[];
  disallowed: string[];
}

export interface EvaluationResult {
  passed: boolean;
  allowed: PackageInfo[];
  warnings: PackageInfo[];
  violations: PackageInfo[];
  unknown: PackageInfo[];
}

/**
 * Clean and normalize license identifier string.
 */

function normalizeLicense(rawLicense: any): string {
  if (!rawLicense) return 'UNKNOWN';
  if (typeof rawLicense === 'string') return rawLicense.trim();
  if (typeof rawLicense === 'object' && rawLicense.type) return String(rawLicense.type).trim();
  return String(rawLicense).trim();
}

/**
 * Check if a package license satisfies policy criteria.
 */
export function evaluateLicenses(packages: PackageInfo[], policy: LicensePolicy): EvaluationResult {
  const allowedSet = new Set(policy.allowed.map((l) => l.toUpperCase()));
  const warnSet = new Set(policy.warn.map((l) => l.toUpperCase()));
  const disallowedSet = new Set(policy.disallowed.map((l) => l.toUpperCase()));

  const result: EvaluationResult = {
    passed: true,
    allowed: [],
    warnings: [],
    violations: [],
    unknown: []
  };

  for (const pkg of packages) {
    const rawLic = normalizeLicense(pkg.license);
    const licUpper = rawLic.toUpperCase();

    const exactLic = licUpper.trim();

    // Handle dual licenses like (MIT OR GPL-3.0) where any allowed option is selectable
    if (exactLic.includes(' OR ')) {
      const options = exactLic.replace(/[()]/g, '').split(/\s+OR\s+/i).map((s) => s.trim());
      const hasAllowedOption = options.some((opt) =>
        Array.from(allowedSet).some((a) => opt === a || new RegExp(`\\b${a.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'i').test(opt))
      );
      if (hasAllowedOption) {
        result.allowed.push(pkg);
        continue;
      }
    }

    // Check for explicit disallowed matches (exact match or word boundary)
    const isDisallowed = Array.from(disallowedSet).some(
      (d) => exactLic === d || new RegExp(`\\b${d.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'i').test(exactLic)
    );

    if (isDisallowed) {
      result.violations.push(pkg);
      result.passed = false;
      continue;
    }

    // Check for warnings (weak copyleft)
    const isWarn = Array.from(warnSet).some(
      (w) => exactLic === w || new RegExp(`\\b${w.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'i').test(exactLic)
    );

    if (isWarn) {
      result.warnings.push(pkg);
      continue;
    }

    // Check for allowed licenses or multi-license expressions like (MIT OR Apache-2.0)
    const isAllowed = allowedSet.has(licUpper) || Array.from(allowedSet).some((a) => licUpper.includes(a));
    if (isAllowed) {
      result.allowed.push(pkg);
    } else {
      result.unknown.push(pkg);
    }
  }

  return result;
}

/**
 * Generates formatted Markdown report for knowledge/governance/licenses-report.md
 */
export function generateLicenseReportMarkdown(packages: PackageInfo[], policy: LicensePolicy): string {
  const evalResult = evaluateLicenses(packages, policy);
  const now = new Date().toISOString().split('T')[0];

  let md = `# Informe de Licencias y Cumplimiento Legal (Software Governance Report)

* **Fecha de generación:** \`${now}\`
* **Total de paquetes auditados:** \`${packages.length}\`
* **Estado de cumplimiento:** ${evalResult.passed ? '✅ **APROBADO (COMPLIANT)**' : '❌ **RECHAZADO (VIOLACIONES DETECTADAS)**'}

---

## 📊 Resumen Ejecutivo

| Categoría | Cantidad | Descripción |
| :--- | :---: | :--- |
| **Permitidas (Allowed)** | \`${evalResult.allowed.length}\` | Licencias permisivas compatibles con software comercial propietario (MIT, Apache 2.0, BSD, ISC, etc.). |
| **Advertencias (Warn)** | \`${evalResult.warnings.length}\` | Copyleft débil (LGPL, MPL). Permitidas para uso dinámico, requieren atención. |
| **Prohibidas (Disallowed)** | \`${evalResult.violations.length}\` | Copyleft fuerte (GPL, AGPL, SSPL). **Estrictamente prohibidas**. |
| **No identificadas (Unknown)** | \`${evalResult.unknown.length}\` | Licencias personalizadas o no estándar. |

---

## 🛡️ Política de Licencias Aplicada (\`knowledge/governance/license-policy.json\`)

- **Licencias Permitidas:** ${policy.allowed.map((l) => `\`${l}\``).join(', ')}
- **Licencias en Advertencia:** ${policy.warn.map((l) => `\`${l}\``).join(', ')}
- **Licencias Prohibidas:** ${policy.disallowed.map((l) => `\`${l}\``).join(', ')}

---

`;

  if (evalResult.violations.length > 0) {
    md += `## ❌ Librerías Prohibidas Detectadas

> [!CAUTION]
> Las siguientes librerías utilizan licencias Copyleft restrictivas y deben ser removidas inmediatamente del proyecto:

| Paquete | Versión | Licencia |
| :--- | :--- | :--- |
`;
    for (const pkg of evalResult.violations) {
      md += `| \`${pkg.name}\` | \`${pkg.version}\` | **\`${pkg.license}\`** |\n`;
    }
    md += `\n---\n\n`;
  }

  if (evalResult.warnings.length > 0) {
    md += `## ⚠️ Librerías con Advertencia (Copyleft Débil)

| Paquete | Versión | Licencia |
| :--- | :--- | :--- |
`;
    for (const pkg of evalResult.warnings) {
      md += `| \`${pkg.name}\` | \`${pkg.version}\` | \`${pkg.license}\` |\n`;
    }
    md += `\n---\n\n`;
  }

  md += `## 📋 Inventario Completo de Dependencias

| Paquete | Versión | Licencia | Estado |
| :--- | :--- | :--- | :---: |
`;

  const sortedPkgs = [...packages].sort((a, b) => a.name.localeCompare(b.name));
  for (const pkg of sortedPkgs) {
    let statusIcon = '✅';
    if (evalResult.violations.some((v) => v.name === pkg.name)) statusIcon = '❌';
    else if (evalResult.warnings.some((w) => w.name === pkg.name)) statusIcon = '⚠️';
    else if (evalResult.unknown.some((u) => u.name === pkg.name)) statusIcon = '❓';

    md += `| \`${pkg.name}\` | \`${pkg.version}\` | \`${pkg.license || 'UNKNOWN'}\` | ${statusIcon} |\n`;
  }

  return md;
}
