import "./globals.css";

export const metadata = {
  title: "Omar microfinance",
};

export default function RootLayout({ children }) {
  return (
    <html >
      <body className="min-h-screen">
  {/* Header/nav */} 
        {children}
        
{/* Footer */}
{/* Third party scripts */}

      </body>
    </html>
  );
}