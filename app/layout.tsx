import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";

export const metadata = { title: "Tender Intelligence", description: "Medical tender specification intelligence" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body><AppSidebar /><main className="ml-56 min-h-screen"><AppTopbar />{children}</main></body></html>;
}
