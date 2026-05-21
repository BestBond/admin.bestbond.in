import { LEGAL_GIFT_SLABS } from '../../legal/legalGiftSlabs';

const LegalGiftSlabTable = () => (
  <div className="my-3 overflow-hidden rounded-lg border border-gray-300">
    <div className="flex bg-gray-100 border-b border-gray-300">
      <div className="w-[38%] border-r border-gray-200 px-3 py-2 text-sm font-bold text-text-primary">
        Required Points
      </div>
      <div className="flex-1 px-3 py-2 text-sm font-bold text-text-primary">Gift</div>
    </div>
    {LEGAL_GIFT_SLABS.map((row, i) => (
      <div
        key={`${row.points}-${row.gift}`}
        className={`flex border-b border-gray-200 last:border-b-0 ${
          i % 2 === 1 ? 'bg-gray-50' : 'bg-white'
        }`}
      >
        <div className="w-[38%] border-r border-gray-200 px-3 py-2 text-sm text-text-secondary">
          {row.points}
        </div>
        <div className="flex-1 px-3 py-2 text-sm text-text-secondary">{row.gift}</div>
      </div>
    ))}
  </div>
);

export default LegalGiftSlabTable;
