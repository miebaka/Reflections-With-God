import type { CoverageConfiguration } from './coverage';
import type { LifecycleGate } from './lifecycle';
import { assessEditorialReadiness } from './package';
import { verifyEditorialPackageSignature, type TrustedSigningKey } from './signature';

export function createTrustedLifecycleGate(
  coverageConfiguration: CoverageConfiguration,
  trustedKeys: readonly TrustedSigningKey[],
): LifecycleGate {
  return {
    evaluate(contentPackage, now) {
      const readiness = assessEditorialReadiness(contentPackage, coverageConfiguration, now);
      if (!readiness.readyForCryptographicVerification) {
        return { accepted: false, code: 'package-not-ready' };
      }
      const signature = verifyEditorialPackageSignature(contentPackage, trustedKeys, now);
      return signature.verified
        ? { accepted: true, keyId: signature.keyId, algorithm: signature.algorithm }
        : { accepted: false, code: signature.code };
    },
  };
}
