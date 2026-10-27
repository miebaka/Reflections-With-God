import { validateEditorialManifest, type EditorialPackageManifest } from './manifest';
import { simulateCoverage, type CoverageConfiguration, type CoverageReport } from './coverage';
import { validateEditorialUnit, type EditorialUnit, type PrayerBlock } from './unit';

export type EditorialContentPackage = {
  manifest: EditorialPackageManifest;
  units: EditorialUnit[];
  prayerBlocks: PrayerBlock[];
};

export type PackageIssue = {
  code:
    | 'manifest-invalid' | 'unit-invalid' | 'package-content-missing'
    | 'duplicate-unit-id' | 'duplicate-unit-version' | 'duplicate-prayer-block-id'
    | 'canonical-passage-conflict';
  field?: string;
};

export type EditorialReadinessReport = {
  readyForCryptographicVerification: boolean;
  packageIssues: readonly PackageIssue[];
  coverage?: CoverageReport;
};

export function assessEditorialReadiness(
  contentPackage: EditorialContentPackage,
  coverageConfiguration: CoverageConfiguration,
  now: Date,
): EditorialReadinessReport {
  const packageIssues = validateEditorialPackage(contentPackage, now);
  if (packageIssues.length > 0) {
    return { readyForCryptographicVerification: false, packageIssues };
  }
  const coverage = simulateCoverage(contentPackage.units, coverageConfiguration);
  return {
    readyForCryptographicVerification: coverage.passed,
    packageIssues,
    coverage,
  };
}

export function validateEditorialPackage(
  contentPackage: EditorialContentPackage,
  now: Date,
): PackageIssue[] {
  const issues: PackageIssue[] = [];

  for (const issue of validateEditorialManifest(contentPackage.manifest, now)) {
    issues.push({
      code: 'manifest-invalid',
      field: issue.field ? `${issue.code}.${issue.field}` : issue.code,
    });
  }
  if (contentPackage.units.length === 0) {
    issues.push({ code: 'package-content-missing', field: 'units' });
  }
  if (contentPackage.prayerBlocks.length === 0) {
    issues.push({ code: 'package-content-missing', field: 'prayerBlocks' });
  }

  reportDuplicates(contentPackage.units.map(({ id }) => id), 'duplicate-unit-id', issues);
  reportDuplicates(
    contentPackage.units.map(({ id, version }) => `${id}@${version}`),
    'duplicate-unit-version',
    issues,
  );
  reportDuplicates(
    contentPackage.prayerBlocks.map(({ id }) => id),
    'duplicate-prayer-block-id',
    issues,
  );
  reportCanonicalConflicts(contentPackage.units, issues);

  const expectedTranslationId = contentPackage.manifest.translationRights.translationId;
  for (const unit of contentPackage.units) {
    for (const issue of validateEditorialUnit(unit, contentPackage.prayerBlocks, expectedTranslationId, now)) {
      const suffix = issue.field ? `.${issue.field}` : '';
      issues.push({ code: 'unit-invalid', field: `${unit.id}.${issue.code}${suffix}` });
    }
  }
  return issues;
}

function reportDuplicates(
  identities: readonly string[],
  code: Extract<PackageIssue['code'], 'duplicate-unit-id' | 'duplicate-unit-version' | 'duplicate-prayer-block-id'>,
  issues: PackageIssue[],
): void {
  const seen = new Set<string>();
  const reported = new Set<string>();
  for (const identity of identities) {
    if (seen.has(identity) && !reported.has(identity)) {
      issues.push({ code, field: identity });
      reported.add(identity);
    }
    seen.add(identity);
  }
}

function reportCanonicalConflicts(units: readonly EditorialUnit[], issues: PackageIssue[]): void {
  const canonical = new Map<string, Pick<EditorialUnit, 'translationId' | 'reference' | 'scriptureText'>>();
  const reported = new Set<string>();
  for (const unit of units) {
    const existing = canonical.get(unit.passageId);
    if (existing && !reported.has(unit.passageId)
      && (existing.translationId !== unit.translationId
        || existing.reference !== unit.reference
        || existing.scriptureText !== unit.scriptureText)) {
      issues.push({ code: 'canonical-passage-conflict', field: unit.passageId });
      reported.add(unit.passageId);
    } else if (!existing) {
      canonical.set(unit.passageId, {
        translationId: unit.translationId,
        reference: unit.reference,
        scriptureText: unit.scriptureText,
      });
    }
  }
}
