import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PriceNoticeCard } from "@/components/PriceNoticeCard";
import { getPriceNoticeImageUrl } from "@/lib/priceNotice";

describe("Price notice on the booking success screen", () => {
  it("shows the notice image from the configured URL", () => {
    render(<PriceNoticeCard imageUrl="/images/aviso-reajuste.jpeg" onDismiss={() => {}} />);
    const img = screen.getByRole("img", { name: /reajuste/i });
    expect(img).toHaveAttribute("src", "/images/aviso-reajuste.jpeg");
    expect(img).toHaveClass("max-w-full", "h-auto", "rounded-xl");
  });

  it("falls back to the public image when the asset URL is unusable", () => {
    expect(getPriceNoticeImageUrl()).toBe("/__l5e/assets-v1/12fe0282-4168-46cd-808b-d333287f783f/aviso-reajuste.jpeg");
  });

  it("closes the notice without touching anything else", () => {
    const onDismiss = vi.fn();
    render(<PriceNoticeCard imageUrl="/images/aviso-reajuste.jpeg" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: /fechar aviso/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
