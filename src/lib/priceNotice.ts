import avisoReajuste from "@/assets/aviso-reajuste.jpeg.asset.json";

/**
 * Imagem exibida na tela de sucesso do agendamento (aviso de reajuste de preços).
 *
 * Para trocar o aviso: substitua o arquivo em public/images/aviso-reajuste.jpeg
 * ou troque a URL abaixo pela de outra imagem publicada.
 */
const AVISO_REAJUSTE_FALLBACK_URL = "/images/aviso-reajuste.jpeg";

export function getPriceNoticeImageUrl(): string {
  const url = (avisoReajuste as { url?: unknown })?.url;
  return typeof url === "string" && url.trim().length > 0 ? url : AVISO_REAJUSTE_FALLBACK_URL;
}
