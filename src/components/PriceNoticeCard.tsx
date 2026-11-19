import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PriceNoticeCardProps {
  imageUrl: string;
  onDismiss: () => void;
}

export function PriceNoticeCard({ imageUrl, onDismiss }: PriceNoticeCardProps) {
  return (
    <div className="relative mb-6 rounded-xl border border-[#d1b122]/30 bg-card p-3 shadow-lg">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        aria-label="Fechar aviso de reajuste de preços"
        className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-black/70 text-foreground hover:bg-black/90"
      >
        <X className="h-4 w-4" />
      </Button>
      <img
        src={imageUrl}
        alt="Aviso: reajuste nos valores dos serviços a partir de 01 de dezembro"
        className="mx-auto block h-auto max-h-[420px] w-auto max-w-full rounded-xl object-contain"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
