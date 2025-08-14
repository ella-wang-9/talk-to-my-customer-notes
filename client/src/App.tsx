import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CustomerNotesApp } from "./pages/CustomerNotesApp";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <CustomerNotesApp />
      </div>
    </QueryClientProvider>
  );
}

export default App;
