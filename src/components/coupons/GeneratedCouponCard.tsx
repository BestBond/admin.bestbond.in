const QR_SIZE = 29;
const QR_DATA_CODEWORDS = 44;
const QR_EC_CODEWORDS = 26;
const QR_TOTAL_CODEWORDS = QR_DATA_CODEWORDS + QR_EC_CODEWORDS;

type GeneratedCouponCardProps = {
    couponId: string;
    couponCode: string;
    points: number;
};

type Matrix = Array<Array<boolean | null>>;

const GF_EXP = new Array<number>(512);
const GF_LOG = new Array<number>(256);

let gfReady = false;

const initGaloisField = () => {
    if (gfReady) return;
    let value = 1;
    for (let i = 0; i < 255; i += 1) {
        GF_EXP[i] = value;
        GF_LOG[value] = i;
        value <<= 1;
        if (value & 0x100) value ^= 0x11d;
    }
    for (let i = 255; i < 512; i += 1) {
        GF_EXP[i] = GF_EXP[i - 255];
    }
    gfReady = true;
};

const gfMultiply = (a: number, b: number) => {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
};

const reedSolomonGenerator = (degree: number) => {
    initGaloisField();
    let result = [1];
    for (let i = 0; i < degree; i += 1) {
        const next = new Array<number>(result.length + 1).fill(0);
        result.forEach((coefficient, index) => {
            next[index] ^= coefficient;
            next[index + 1] ^= gfMultiply(coefficient, GF_EXP[i]);
        });
        result = next;
    }
    return result;
};

const reedSolomonRemainder = (data: number[], degree: number) => {
    const generator = reedSolomonGenerator(degree);
    const result = new Array<number>(degree).fill(0);
    data.forEach((byte) => {
        const factor = byte ^ result.shift()!;
        result.push(0);
        generator.slice(1).forEach((coefficient, index) => {
            result[index] ^= gfMultiply(coefficient, factor);
        });
    });
    return result;
};

const appendBits = (bits: number[], value: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) {
        bits.push((value >>> i) & 1);
    }
};

const textToBytes = (text: string) => Array.from(new TextEncoder().encode(text));

const buildDataCodewords = (text: string) => {
    const bytes = textToBytes(text).slice(0, 42);
    const bits: number[] = [];

    appendBits(bits, 0b0100, 4);
    appendBits(bits, bytes.length, 8);
    bytes.forEach((byte) => appendBits(bits, byte, 8));

    const capacityBits = QR_DATA_CODEWORDS * 8;
    const terminatorLength = Math.min(4, capacityBits - bits.length);
    appendBits(bits, 0, terminatorLength);
    while (bits.length % 8 !== 0) bits.push(0);

    const data: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
        data.push(Number.parseInt(bits.slice(i, i + 8).join(""), 2));
    }

    let pad = 0xec;
    while (data.length < QR_DATA_CODEWORDS) {
        data.push(pad);
        pad = pad === 0xec ? 0x11 : 0xec;
    }
    return data;
};

const createMatrix = (): Matrix => (
    Array.from({ length: QR_SIZE }, () => Array.from({ length: QR_SIZE }, () => null))
);

const createReserved = () => (
    Array.from({ length: QR_SIZE }, () => Array.from({ length: QR_SIZE }, () => false))
);

const setModule = (matrix: Matrix, reserved: boolean[][], row: number, col: number, value: boolean) => {
    if (row < 0 || col < 0 || row >= QR_SIZE || col >= QR_SIZE) return;
    matrix[row][col] = value;
    reserved[row][col] = true;
};

const drawFinder = (matrix: Matrix, reserved: boolean[][], row: number, col: number) => {
    for (let r = -1; r <= 7; r += 1) {
        for (let c = -1; c <= 7; c += 1) {
            const rr = row + r;
            const cc = col + c;
            const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
            const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            const inRing = r === 0 || r === 6 || c === 0 || c === 6;
            setModule(matrix, reserved, rr, cc, inOuter && (inRing || inInner));
        }
    }
};

const drawAlignment = (matrix: Matrix, reserved: boolean[][], centerRow: number, centerCol: number) => {
    for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) {
            const isDark = Math.max(Math.abs(r), Math.abs(c)) !== 1;
            setModule(matrix, reserved, centerRow + r, centerCol + c, isDark);
        }
    }
};

const drawFunctionPatterns = (matrix: Matrix, reserved: boolean[][]) => {
    drawFinder(matrix, reserved, 0, 0);
    drawFinder(matrix, reserved, 0, QR_SIZE - 7);
    drawFinder(matrix, reserved, QR_SIZE - 7, 0);
    drawAlignment(matrix, reserved, 22, 22);

    for (let i = 8; i < QR_SIZE - 8; i += 1) {
        setModule(matrix, reserved, 6, i, i % 2 === 0);
        setModule(matrix, reserved, i, 6, i % 2 === 0);
    }

    for (let i = 0; i < 9; i += 1) {
        if (i !== 6) {
            setModule(matrix, reserved, 8, i, false);
            setModule(matrix, reserved, i, 8, false);
        }
    }
    for (let i = QR_SIZE - 8; i < QR_SIZE; i += 1) {
        setModule(matrix, reserved, 8, i, false);
        setModule(matrix, reserved, i, 8, false);
    }
    setModule(matrix, reserved, QR_SIZE - 8, 8, true);
};

const shouldMask = (mask: number, row: number, col: number) => {
    switch (mask) {
        case 0: return (row + col) % 2 === 0;
        case 1: return row % 2 === 0;
        case 2: return col % 3 === 0;
        case 3: return (row + col) % 3 === 0;
        case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
        case 5: return ((row * col) % 2) + ((row * col) % 3) === 0;
        case 6: return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
        default: return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
    }
};

const placeData = (matrix: Matrix, reserved: boolean[][], codewords: number[], mask: number) => {
    const bits = codewords.flatMap((byte) => Array.from({ length: 8 }, (_, i) => (byte >>> (7 - i)) & 1));
    let bitIndex = 0;
    let upward = true;

    for (let col = QR_SIZE - 1; col > 0; col -= 2) {
        if (col === 6) col -= 1;
        for (let rowOffset = 0; rowOffset < QR_SIZE; rowOffset += 1) {
            const row = upward ? QR_SIZE - 1 - rowOffset : rowOffset;
            for (let c = 0; c < 2; c += 1) {
                const currentCol = col - c;
                if (reserved[row][currentCol]) continue;
                const bit = bitIndex < bits.length ? bits[bitIndex] === 1 : false;
                matrix[row][currentCol] = shouldMask(mask, row, currentCol) ? !bit : bit;
                bitIndex += 1;
            }
        }
        upward = !upward;
    }
};

const bchFormatBits = (errorCorrection: number, mask: number) => {
    const data = (errorCorrection << 3) | mask;
    let value = data << 10;
    const generator = 0b10100110111;
    for (let i = 14; i >= 10; i -= 1) {
        if (((value >>> i) & 1) !== 0) value ^= generator << (i - 10);
    }
    return ((data << 10) | value) ^ 0b101010000010010;
};

const drawFormatBits = (matrix: Matrix, mask: number) => {
    const bits = bchFormatBits(0, mask);
    const first = [
        [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
        [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
    ];
    const second = [
        [QR_SIZE - 1, 8], [QR_SIZE - 2, 8], [QR_SIZE - 3, 8], [QR_SIZE - 4, 8],
        [QR_SIZE - 5, 8], [QR_SIZE - 6, 8], [QR_SIZE - 7, 8], [8, QR_SIZE - 8],
        [8, QR_SIZE - 7], [8, QR_SIZE - 6], [8, QR_SIZE - 5], [8, QR_SIZE - 4],
        [8, QR_SIZE - 3], [8, QR_SIZE - 2], [8, QR_SIZE - 1],
    ];
    first.forEach(([row, col], index) => {
        matrix[row][col] = ((bits >>> index) & 1) === 1;
    });
    second.forEach(([row, col], index) => {
        matrix[row][col] = ((bits >>> index) & 1) === 1;
    });
};

const penaltyScore = (matrix: Matrix) => {
    let score = 0;
    const darkCount = matrix.flat().filter(Boolean).length;

    const runs = (cells: boolean[]) => {
        let runColor = cells[0];
        let runLength = 1;
        for (let i = 1; i < cells.length; i += 1) {
            if (cells[i] === runColor) {
                runLength += 1;
            } else {
                if (runLength >= 5) score += 3 + runLength - 5;
                runColor = cells[i];
                runLength = 1;
            }
        }
        if (runLength >= 5) score += 3 + runLength - 5;
    };

    for (let i = 0; i < QR_SIZE; i += 1) {
        runs(matrix[i].map(Boolean));
        runs(matrix.map((row) => Boolean(row[i])));
    }

    for (let row = 0; row < QR_SIZE - 1; row += 1) {
        for (let col = 0; col < QR_SIZE - 1; col += 1) {
            const color = matrix[row][col];
            if (
                color === matrix[row][col + 1] &&
                color === matrix[row + 1][col] &&
                color === matrix[row + 1][col + 1]
            ) {
                score += 3;
            }
        }
    }

    const ratioPenalty = Math.abs(Math.floor((darkCount * 100) / (QR_SIZE * QR_SIZE) / 5) - 10) * 10;
    return score + ratioPenalty;
};

const generateQrMatrix = (text: string) => {
    const data = buildDataCodewords(text);
    const codewords = [...data, ...reedSolomonRemainder(data, QR_EC_CODEWORDS)].slice(0, QR_TOTAL_CODEWORDS);
    let bestMatrix = createMatrix();
    let bestScore = Number.POSITIVE_INFINITY;

    for (let mask = 0; mask < 8; mask += 1) {
        const matrix = createMatrix();
        const reserved = createReserved();
        drawFunctionPatterns(matrix, reserved);
        placeData(matrix, reserved, codewords, mask);
        drawFormatBits(matrix, mask);
        const score = penaltyScore(matrix);
        if (score < bestScore) {
            bestScore = score;
            bestMatrix = matrix;
        }
    }

    return bestMatrix.map((row) => row.map(Boolean));
};

const QrCodeSvg = ({ value, className }: { value: string; className?: string }) => {
    const matrix = generateQrMatrix(value);
    const quietZone = 4;
    const size = QR_SIZE + quietZone * 2;

    return (
        <svg
            viewBox={`0 0 ${size} ${size}`}
            className={className}
            role="img"
            aria-label={`QR for ${value}`}
            shapeRendering="crispEdges"
        >
            <rect width={size} height={size} fill="#FFFFFF" />
            {matrix.map((row, rowIndex) => (
                row.map((isDark, colIndex) => (
                    isDark ? (
                        <rect
                            key={`${rowIndex}-${colIndex}`}
                            x={colIndex + quietZone}
                            y={rowIndex + quietZone}
                            width="1"
                            height="1"
                            fill="#1F2937"
                        />
                    ) : null
                ))
            ))}
        </svg>
    );
};

const StepIcon = ({ src, label }: { src: string; label: string }) => (
    <div className="flex flex-col items-center text-center text-white">
        <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white shadow-sm">
            <img src={src} alt={label} className="max-h-[42px] max-w-[42px] object-contain" />
        </div>
    </div>
);

const GeneratedCouponCard = ({ couponId, couponCode, points }: GeneratedCouponCardProps) => {
    const idLabel = couponCode || couponId;
    const qrValue = couponId || couponCode;

    return (
        <div className="grid aspect-[765/318] w-full max-w-[765px] grid-cols-[32.5%_67.5%] overflow-hidden rounded-[2px] bg-white shadow-2xl">
            <div className="flex flex-col items-center justify-center bg-white px-7 py-5">
                <img src="/hand-with-qr.svg" alt="Scan with phone" className="mb-4 h-[58px] w-[58px] object-contain" />
                <QrCodeSvg value={qrValue} className="h-[172px] w-[172px]" />
                <p className="mt-4 text-[16px] font-medium tracking-wide text-[#667085]">
                    ID: {idLabel}
                </p>
            </div>

            <div className="relative overflow-hidden bg-[#202938] px-8 pt-10 text-white">
                <div className="absolute left-0 top-0 h-full w-full opacity-[0.08]">
                    <div className="absolute -left-16 top-10 h-44 w-44 rounded-full border-[28px] border-white" />
                    <div className="absolute bottom-[-70px] right-20 h-52 w-52 rounded-full border-[34px] border-white" />
                </div>

                <img src="/logo.svg" alt="Best Bond" className="absolute right-5 top-4 h-[38px] w-[60px] object-contain brightness-0 invert" />

                <div className="absolute top-8 left-1/2 flex w-[210px] -translate-x-1/2 items-end justify-center">
                    <img src="/drill.svg" alt="" className="relative left-8 h-[76px] w-[64px] object-contain" />
                    <img src="/phone-left.svg" alt="" className="relative left-6 h-[76px] w-[64px] object-contain" />
                    <img src="/phone-center.svg" alt="" className="z-10 h-[92px] w-[72px] object-contain" />
                    <img src="/phone-right.svg" alt="" className="relative right-6 h-[76px] w-[64px] object-contain" />
                    <img src="/cutter.svg" alt="" className="relative right-8 h-[76px] w-[64px] object-contain" />
                </div>
                <div className="relative mx-auto mt-16 flex h-[54px] w-[260px] items-center justify-center rounded-full bg-[#FF7A1A] text-[30px] font-black leading-none tracking-normal">
                    <span>{points.toLocaleString("en-US")} Points</span>
                </div>

                <div className="relative mt-8 flex items-start justify-center gap-8">
                    <div className="flex w-[84px] flex-col items-center text-center">
                        <StepIcon src="/phone.svg" label="Download app" />
                        <p className="mt-2 text-[13px] font-black leading-none">Step 1</p>
                        <p className="mt-1 text-[8px] font-medium leading-[10px] text-white/80">Download the best bond app</p>
                    </div>
                    <div className="flex w-[92px] flex-col items-center text-center">
                        <StepIcon src="/scan-qr.svg" label="Download app" />
                        <p className="mt-2 text-[13px] font-black leading-none">Step 2</p>
                        <p className="mt-1 text-[8px] font-medium leading-[10px] text-white/80">Scan the unique QR on the coupon</p>
                    </div>
                    <div className="flex w-[92px] flex-col items-center text-center">
                        <StepIcon src="/earn.svg" label="Earn points" />
                        <p className="mt-2 text-[13px] font-black leading-none">Step 3</p>
                        <p className="mt-1 text-[8px] font-medium leading-[10px] text-white/80">Accumulate points and redeem gifts</p>
                    </div>
                </div>

                <div className="absolute right-0 top-[86px] flex h-[178px] w-[54px] flex-col items-center justify-between rounded-l-[12px] bg-white px-2 py-3">
                    <p className="rotate-90 whitespace-nowrap text-[10px] mt-10 font-normal text-[#5D6675]">
                        Download the app
                    </p>
                    <QrCodeSvg value="https://bestbond.app" className="h-[40px] w-[40px]" />
                </div>

                <svg className="absolute left-[162px] top-[182px] h-[34px] w-[64px]" viewBox="0 0 64 34" fill="none">
                    <path d="M2 31C18 2 38 2 52 20" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path d="M46 20H53V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <svg className="absolute left-[282px] top-[220px] h-[32px] w-[62px]" viewBox="0 0 62 32" fill="none">
                    <path d="M2 3C17 30 38 30 52 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path
                        d="M52 13H45V6"
                        stroke="white"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        transform="rotate(180 50 12)"
                    ></path>                </svg>
            </div>
        </div>
    );
};

export default GeneratedCouponCard;
