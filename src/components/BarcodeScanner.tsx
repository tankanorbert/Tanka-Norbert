import { useEffect, useRef } from "react"; import Quagga from "@ericblade/quagga2";

type Props = {
  isActive: boolean;
  onDetected: (code: string) => void;
  onClose: () => void;
};

export default function BarcodeScanner({ isActive, onDetected, onClose }: Props) {
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const el = boxRef.current;
    if (!el) return;

    // body scroll lock scanner alatt (mobil bugfix)
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

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
          console.error("Quagga init error:", err);
          return;
        }
        if (!active) return;
        Quagga.start();
      }
    );

    const handler = (res: any) => {
      const code = res?.codeResult?.code;
      if (!code) return;

      try {
        Quagga.offDetected(handler);
        Quagga.stop();
      } catch {}

      onDetected(String(code));
      // ne zárjuk itt automatikusan, a hívó dönti el
    };

    Quagga.onDetected(handler);

    return () => {
      active = false;
      document.body.style.overflow = prevOverflow;

      try {
        Quagga.offDetected(handler);
        Quagga.stop();
      } catch {}
    };
  }, [isActive, onDetected]);

  if (!isActive) return null;

  return (
    <div className="scanOverlay" role="dialog" aria-modal="true">
      <div className="scanCard">
        <div className="scanTop">
          <strong>Scan barcode</strong>
          <button className="btnGhost" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="scanBox scanInlineBox" ref={boxRef} />

        <div className="note" style={{ marginTop: 8 }}>
          Tartsd stabilan a kamerát a vonalkódon.
        </div>
      </div>
    </div>
  );
}
