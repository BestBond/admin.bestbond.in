import { GIFT_SLAB_TABLE_MARKER } from '../../legal/legalGiftSlabs';
import LegalGiftSlabTable from './LegalGiftSlabTable';

const DEFINITION_TERM = /^•\s+(.+?)\s+refers to\s+(.*)$/;
const MAIN_SECTION = /^\d+\.\s+[A-Z][A-Z0-9 &'-]+$/;
const SUBSECTION = /^\d+\.\d+\s+\S/;
const NUMBERED_ITEM = /^\d+\.\s+[A-Za-z]/;
const CONTACT_LABEL =
  /^(Registered Office Address|Customer Support Number|Support Email|Website):$/;

function stripBullet(line: string): string {
  return line.replace(/^\s*•\s*/, '').trim();
}

function ParagraphWithBrandLink({ text }: { text: string }) {
  const parts = text.split(/(BestBond)/g);
  if (parts.length === 1) {
    return <p className="mb-2 text-[15px] leading-relaxed text-text-secondary">{text}</p>;
  }
  return (
    <p className="mb-2 text-[15px] leading-relaxed text-text-secondary">
      {parts.map((part, i) =>
        part === 'BestBond' ? (
          <a
            key={i}
            href="https://www.bestbond.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-orange font-semibold hover:underline"
          >
            BestBond
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

function renderLine(line: string, key: string) {
  const trimmed = line.trim();
  if (!trimmed) {
    return <div key={key} className="h-2" />;
  }
  if (trimmed === GIFT_SLAB_TABLE_MARKER) {
    return <LegalGiftSlabTable key={key} />;
  }
  if (MAIN_SECTION.test(trimmed)) {
    return (
      <h2 key={key} className="mt-5 mb-2 text-base font-bold text-text-primary">
        {trimmed}
      </h2>
    );
  }
  if (SUBSECTION.test(trimmed)) {
    return (
      <h3 key={key} className="mt-3 mb-1 text-[15px] font-bold text-text-primary">
        {trimmed}
      </h3>
    );
  }
  if (NUMBERED_ITEM.test(trimmed) && !MAIN_SECTION.test(trimmed)) {
    return (
      <p key={key} className="mb-1.5 pl-1 text-[15px] leading-relaxed text-text-secondary">
        {trimmed}
      </p>
    );
  }
  if (trimmed.startsWith('•')) {
    const def = trimmed.match(DEFINITION_TERM);
    if (def) {
      return (
        <p key={key} className="mb-1.5 pl-4 text-[15px] leading-relaxed text-text-secondary">
          {'• '}
          <span className="font-semibold text-text-primary">{def[1]}</span>
          {` refers to ${def[2]}`}
        </p>
      );
    }
    return (
      <p key={key} className="mb-1.5 pl-4 text-[15px] leading-relaxed text-text-secondary">
        • {stripBullet(trimmed)}
      </p>
    );
  }
  if (CONTACT_LABEL.test(trimmed)) {
    return (
      <p key={key} className="mt-2 mb-0.5 text-sm font-bold text-text-primary">
        {trimmed}
      </p>
    );
  }
  if (trimmed === 'www.bestbond.in') {
    return (
      <p key={key} className="mb-2">
        <a
          href="https://www.bestbond.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[15px] text-brand-orange font-semibold hover:underline"
        >
          www.bestbond.in
        </a>
      </p>
    );
  }
  if (trimmed.startsWith('+91') || trimmed.includes('@')) {
    return (
      <p key={key} className="mb-2 text-[15px] text-text-secondary">
        {trimmed}
      </p>
    );
  }
  return <ParagraphWithBrandLink key={key} text={trimmed} />;
}

type Props = {
  body: string;
};

const LegalFormattedBody = ({ body }: Props) => (
  <div className="pb-4">
    {body.split('\n').map((line, i) => renderLine(line, `l-${i}`))}
  </div>
);

export default LegalFormattedBody;
