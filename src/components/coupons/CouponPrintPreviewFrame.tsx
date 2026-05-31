import { useEffect, useState } from "react";

type CouponPrintPreviewFrameProps = {
  html: string | null;
  loading?: boolean;
  title: string;
  /** Coupon only — transparent, no dark wrapper (modal). */
  bare?: boolean;
  className?: string;
};

const COUPON_ASPECT = "101 / 38";

const CouponPrintPreviewFrame = ({
  html,
  loading = false,
  title,
  bare = false,
  className,
}: CouponPrintPreviewFrameProps) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!html) {
      setSrc((prev) => {
        if (prev) window.URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = window.URL.createObjectURL(
      new Blob([html], { type: "text/html;charset=utf-8" }),
    );
    setSrc((prev) => {
      if (prev) window.URL.revokeObjectURL(prev);
      return url;
    });
    return () => window.URL.revokeObjectURL(url);
  }, [html]);

  if (loading) {
    if (bare) {
      return (
        <div
          className="flex w-full items-center justify-center text-sm text-white/80"
          style={{ aspectRatio: COUPON_ASPECT }}
        >
          Loading…
        </div>
      );
    }
    return (
      <div
        className={
          className ??
          "flex min-h-[200px] items-center justify-center rounded-2xl bg-[#151515] text-sm text-gray-400"
        }
      >
        Loading preview…
      </div>
    );
  }

  if (!src) return null;

  if (bare) {
    return (
      <div className="relative w-full" style={{ aspectRatio: COUPON_ASPECT }}>
        <iframe
          title={title}
          src={src}
          className="absolute inset-0 h-full w-full border-0 bg-transparent"
        />
      </div>
    );
  }

  return (
    <iframe
      title={title}
      src={src}
      className={
        className ??
        "w-full min-h-[200px] border-0 bg-[#151515] rounded-2xl"
      }
    />
  );
};

export default CouponPrintPreviewFrame;
