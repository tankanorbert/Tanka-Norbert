import { useEffect, useRef } from "react";
import Quagga from "@ericblade/quagga2";

type Props = {
  isActive: boolean;
  onDetected: (code: string) => void;
  onClose: () => void;
};

export default function BarcodeScanner({ isActive, onDetected, onClose }: Props) {
  const boxRef = useRef<HTMLDivElement | null>(null);

  // háttér scroll tiltás, amíg aktív
  useEffect(() => {
    if (!isActive) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const el = boxRef.current;
    if (!el) return;

    let active = true;

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: el,
          constraints: { facingMode: "environment" },
        },
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader", "code_128_reader"],
        },
        locate: true,
      },
      (err) => {
        if (err) {
          console.error(err);
          return;
        }
        if (!active) return;
        Quagga.start();
      }
    );

    const handler = (res: any) => {
      const code = res?.codeResult?.code;
      if (!code) return;

      // 1 scan után stop, nehogy duplázzon
      try {
        Quagga.offDetected(handler);
        Quagga.stop();
      } catch {}

      onDetected(String(code));
    };

    Quagga.onDetected(handler);

    return () => {
      active = false;
      try {
        Quagga.offDetected(handler);
        Quagga.stop();
      } catch {}
    };
  }, [isActive, onDetected]);

  if (!isActive) return null;

  // INLINE + sticky (Food log panel tetején fog “ragadni” a CSS miatt)
  return (
    <div className="scanInline" role="dialog" aria-modal="true">
      <div className="scanTop">
        <strong>Scan barcode</strong>
        <button className="btnGhost" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="scanBox" ref={boxRef} />

      <div className="note" style={{ marginTop: 8 }}>
        Tartsd stabilan a kamerát a vonalkódon.
      </div>
    </div>
  );
}
