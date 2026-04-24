import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BookingCheckoutBoundaryProps {
  children: ReactNode;
}

interface BookingCheckoutBoundaryState {
  hasError: boolean;
  autoRecovered: boolean;
}

// Errors triggered by Google Translate / browser extensions mutating the DOM
const isDomMutationError = (error: Error) => {
  const msg = `${error?.name || ""} ${error?.message || ""}`.toLowerCase();
  return (
    msg.includes("notfounderror") ||
    msg.includes("failed to execute 'removechild'") ||
    msg.includes("failed to execute 'insertbefore'") ||
    msg.includes("the node to be removed is not a child")
  );
};

export class BookingCheckoutBoundary extends Component<BookingCheckoutBoundaryProps, BookingCheckoutBoundaryState> {
  state: BookingCheckoutBoundaryState = {
    hasError: false,
    autoRecovered: false,
  };

  static getDerivedStateFromError(): BookingCheckoutBoundaryState {
    return { hasError: true, autoRecovered: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[BookingBoundary] caught:", error, errorInfo);

    // Auto-recover from translator-induced DOM mutation crashes (one-shot per session).
    if (isDomMutationError(error) && !this.state.autoRecovered) {
      console.warn("[BookingBoundary] DOM mutation error detected (translator?). Recovering automatically.");
      this.setState({ autoRecovered: true });
      // Short delay so React unmounts cleanly before remounting.
      setTimeout(() => {
        this.setState({ hasError: false });
      }, 50);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10" translate="no">
          <Card className="w-full max-w-md border-border bg-card shadow-lg">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-semibold text-foreground">Ops! Ocorreu um erro na sua tela</h1>
                <p className="text-sm text-muted-foreground">
                  Por favor, recarregue para continuar o agendamento. Dica: desative tradutores automáticos para evitar este erro.
                </p>
              </div>
              <Button className="w-full" onClick={this.handleReload}>
                Recarregar página
              </Button>
            </CardContent>
          </Card>
        </main>
      );
    }

    return this.props.children;
  }
}
