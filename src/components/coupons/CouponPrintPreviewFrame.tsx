import { useEffect, useState } from "react";

type CouponPrintPreviewFrameProps = {
  html: string | null;
  loading?: boolean;
  title: string;
  className?: string;
};

const CouponPrintPreviewFrame = ({
  html,
  loading = false,
  title,
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
