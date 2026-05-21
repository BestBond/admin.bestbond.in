import { Link } from 'react-router-dom';
import LegalFormattedBody from '../components/legal/LegalFormattedBody';
import {
  LEGAL_DOC_SUBTITLE,
  LEGAL_UPDATED_ON,
  PRIVACY_POLICY_BODY,
  PRIVACY_POLICY_TITLE,
  TERMS_AND_CONDITIONS_BODY,
  TERMS_AND_CONDITIONS_TITLE,
} from '../legal/legalCopy';
import {
  stripPrivacyPreamble,
  stripTermsPreamble,
} from '../legal/stripLegalPreamble';

type LegalDocKind = 'terms' | 'privacy';

type Props = {
  kind: LegalDocKind;
};

const LegalDocument = ({ kind }: Props) => {
  const isTerms = kind === 'terms';
  const pageTitle = isTerms ? TERMS_AND_CONDITIONS_TITLE : PRIVACY_POLICY_TITLE;
  const docHeading = isTerms ? 'TERMS & CONDITIONS' : 'PRIVACY POLICY';
  const body = isTerms
    ? stripTermsPreamble(TERMS_AND_CONDITIONS_BODY)
    : stripPrivacyPreamble(PRIVACY_POLICY_BODY);

  return (
    <div className="min-h-screen bg-bg-offwhite">
      <header className="sticky top-0 z-10 border-b border-border bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Link
            to="/login"
            className="text-sm font-bold text-brand-orange hover:underline"
          >
            ← Back to login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 pb-16">
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo.svg" alt="BestBond" className="h-10 w-auto" />
        </div>

        <p className="text-sm font-semibold text-text-secondary">{pageTitle}</p>
        <h1 className="mt-1 text-2xl font-bold font-bricolage text-text-primary">
          {docHeading}
        </h1>
        <p className="mt-2 text-[15px] text-text-secondary">{LEGAL_DOC_SUBTITLE}</p>
        <p className="mt-1 text-sm font-medium text-text-secondary">
          Last Updated: {LEGAL_UPDATED_ON}
        </p>

        <article className="mt-8 rounded-2xl border border-border bg-white px-5 py-6 shadow-sm sm:px-8">
          <LegalFormattedBody body={body.trim()} />
        </article>
      </main>
    </div>
  );
};

export default LegalDocument;
