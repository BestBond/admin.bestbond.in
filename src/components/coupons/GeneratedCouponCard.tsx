import type { CSSProperties } from "react";
import { getCouponTierTheme } from "../../constants/couponTiers";
import { buildCouponQrUrl } from "../../utils/couponLink";

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

const GeneratedCouponCard = ({ couponId, couponCode, points }: GeneratedCouponCardProps) => {
    const idLabel = couponCode || couponId;
    const qrValue = buildCouponQrUrl(couponCode || couponId);
    const pointsFormatted = Number.isFinite(points) ? points.toLocaleString("en-US") : "0";
    const tier = getCouponTierTheme(points);

    const leftPanelStyle: CSSProperties = tier.leftGradient
        ? { background: tier.leftGradient, borderColor: tier.leftBorder }
        : { backgroundColor: tier.leftBg, borderColor: tier.leftBorder };

    const pillStyle: CSSProperties = tier.pillGradient
        ? { background: tier.pillGradient, borderColor: tier.pillBorder }
        : { backgroundColor: tier.pillBg, borderColor: tier.pillBorder };

    return (
        <div className="grid w-full max-w-full grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-2xl sm:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)] sm:rounded-3xl sm:min-h-[260px]">
            <div
                className="flex flex-col items-center justify-center border-b px-5 py-6 sm:border-b-0 sm:border-r sm:px-8 sm:py-10"
                style={{ ...leftPanelStyle, borderWidth: 1, borderStyle: "solid" }}
            >
                <img
                    src="/hand-with-qr.svg"
                    alt=""
                    className="mb-3 h-12 w-12 shrink-0 object-contain sm:mb-4 sm:h-14 sm:w-14"
                    aria-hidden
                />
                <QrCodeSvg
                    value={qrValue}
                    className="h-[136px] w-[136px] sm:h-[min(200px,22vw)] sm:w-[min(200px,22vw)] md:h-[220px] md:w-[220px]"
                />
                <p className="mt-3 text-center text-sm font-medium tracking-wide text-[#667085] sm:mt-4 sm:text-base">
                    ID: {idLabel}
                </p>
            </div>

            <div className="relative flex min-h-[200px] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#FF9F5A] via-[#F97316] to-[#EA580C] px-6 py-8 sm:min-h-[260px] sm:rounded-tr-3xl sm:px-12 sm:py-12">
                <div
                    className="pointer-events-none absolute inset-0 opacity-90"
                    style={{
                        background:
                            "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 42%, transparent 58%, rgba(0,0,0,0.06) 100%)",
                    }}
                />

                <img
                    src="/logo.svg"
                    alt="Best Bond"
                    className="absolute right-4 top-4 z-10 h-9 w-auto max-w-[120px] object-contain object-right sm:right-5 sm:top-5 sm:h-10 sm:max-w-[140px]"
                />

                <div className="relative z-10 mt-6 flex w-full max-w-[300px] flex-col items-center text-center sm:mt-2">
                    <div
                        className="rounded-full px-7 py-2.5 shadow-md sm:px-10 sm:py-3"
                        style={{ ...pillStyle, borderWidth: 2, borderStyle: "solid" }}
                    >
                        <span className="text-xl font-extrabold tracking-tight text-[#1F2937] sm:text-[26px] sm:leading-none">
                            {pointsFormatted} Points
                        </span>
                    </div>
                    <p className="mt-4 max-w-[280px] text-sm font-semibold leading-snug text-white drop-shadow-sm sm:mt-5 sm:text-base">
                        Scan in the Best Bond app to redeem
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GeneratedCouponCard;
