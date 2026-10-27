export type SupportResourceKind = 'emergency' | 'clinical' | 'crisis-support' | 'pastoral-guidance';

export type SupportResource = {
  id: string;
  name: string;
  kind: SupportResourceKind;
  region: 'Nigeria' | `Nigeria:${string}`;
  contact: { method: 'call' | 'sms' | 'web'; value: string };
  availability: string;
  status: 'candidate' | 'verified' | 'retired';
  source: { publisher: string; url: string; checkedAt: string };
  verification?: {
    ownerId: string;
    method: 'phone-call' | 'provider-written-confirmation' | 'in-person';
    verifiedAt: string;
    expiresAt: string;
    result: 'reachable-and-correct';
    notes: string;
  };
};

export type SupportResourcePackage = {
  id: string;
  version: string;
  status: 'draft' | 'approved' | 'retired';
  resources: readonly SupportResource[];
  approvals: readonly {
    reviewerId: string;
    role: 'qualified-safety-adviser' | 'release-operator';
    approvedAt: string;
    packageVersion: string;
    reason: string;
  }[];
};

export function validateSupportResourcePackage(
  resourcePackage: SupportResourcePackage,
  now: Date,
): readonly string[] {
  if (Number.isNaN(now.getTime())) return ['clock-invalid'];
  const issues: string[] = [];
  if (!resourcePackage.id.trim() || !/^\d+\.\d+\.\d+$/.test(resourcePackage.version)) issues.push('identity-invalid');
  if (resourcePackage.status !== 'approved') issues.push('package-not-approved');
  if (resourcePackage.resources.length === 0) issues.push('resources-missing');
  const ids = new Set<string>();
  const contacts = new Set<string>();
  for (const resource of resourcePackage.resources) {
    if (ids.has(resource.id)) issues.push('resource-id-duplicate');
    ids.add(resource.id);
    const contactKey = `${resource.contact.method}:${resource.contact.value}`;
    if (contacts.has(contactKey)) issues.push('resource-contact-duplicate');
    contacts.add(contactKey);
    validateResource(resource, now, issues);
  }
  for (const role of ['qualified-safety-adviser', 'release-operator'] as const) {
    const approval = resourcePackage.approvals.find((item) => (
      item.role === role && item.packageVersion === resourcePackage.version
    ));
    if (!approval || !approval.reviewerId.trim() || !approval.reason.trim()
      || !isCanonicalAtOrBefore(approval.approvedAt, now)) issues.push(`approval-missing:${role}`);
  }
  return [...new Set(issues)];
}

export function publishableSupportResources(
  resourcePackage: SupportResourcePackage,
  now: Date,
): readonly SupportResource[] {
  if (validateSupportResourcePackage(resourcePackage, now).length > 0) return [];
  return resourcePackage.resources;
}

function validateResource(resource: SupportResource, now: Date, issues: string[]): void {
  if (!resource.id.trim() || !resource.name.trim() || !resource.availability.trim()) issues.push('resource-field-missing');
  if (resource.status !== 'verified') issues.push('resource-not-verified');
  if (!/^https:\/\//.test(resource.source.url) || !resource.source.publisher.trim()
    || !isCanonicalAtOrBefore(resource.source.checkedAt, now)) issues.push('resource-source-invalid');
  if (!resource.contact.value.trim()) issues.push('resource-contact-invalid');
  if (resource.contact.method === 'call' && !/^\+?[0-9]{3,15}$/.test(resource.contact.value)) {
    issues.push('resource-contact-invalid');
  }
  const verification = resource.verification;
  if (!verification || !verification.ownerId.trim() || !verification.notes.trim()
    || verification.result !== 'reachable-and-correct'
    || !isCanonicalAtOrBefore(verification.verifiedAt, now)
    || !isCanonicalAfter(verification.expiresAt, now)
    || new Date(verification.expiresAt) <= new Date(verification.verifiedAt)) {
    issues.push('resource-verification-invalid');
  }
}

function isCanonicalAtOrBefore(value: string, now: Date): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value && parsed <= now;
}

function isCanonicalAfter(value: string, now: Date): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value && parsed > now;
}

// Research candidates only. They remain unavailable to the app until manual verification and approval.
export const researchedNigeriaResourceCandidates: readonly SupportResource[] = [
  {
    id: 'ng-national-emergency-112', name: 'Nigeria national emergency number', kind: 'emergency',
    region: 'Nigeria', contact: { method: 'call', value: '112' }, availability: 'Reported as 24/7',
    status: 'candidate',
    source: {
      publisher: 'Nigerian Communications Commission',
      url: 'https://ncc.gov.ng/media-centre/press-releases/press-release-emergency-communications-centres-launch-ncc?page=58',
      checkedAt: '2026-10-27T00:00:00.000Z',
    },
  },
  {
    id: 'ng-emergency-medical-122', name: 'Federal emergency medical care', kind: 'clinical',
    region: 'Nigeria', contact: { method: 'call', value: '122' }, availability: 'Reported as 24/7',
    status: 'candidate',
    source: {
      publisher: 'Federal Ministry of Health and Social Welfare',
      url: 'https://health.gov.ng/', checkedAt: '2026-10-27T00:00:00.000Z',
    },
  },
  {
    id: 'ng-mani-1', name: 'Mentally Aware Nigeria Initiative', kind: 'crisis-support',
    region: 'Nigeria', contact: { method: 'call', value: '08091116264' }, availability: 'Provider-listed hotline',
    status: 'candidate',
    source: {
      publisher: 'Mentally Aware Nigeria Initiative',
      url: 'https://mentallyaware.org/resource-centre/', checkedAt: '2026-10-27T00:00:00.000Z',
    },
  },
];
