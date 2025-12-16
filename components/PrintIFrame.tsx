// components/PrintIFrame.tsx
import React, { useEffect, useRef } from 'react';

interface PrintIFrameProps {
  htmlContent: string;
  onFinished: () => void;
}

const PrintIFrame: React.FC<PrintIFrameProps> = ({ htmlContent, onFinished }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // HTML simplificado e direto
    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recibo</title>
        <style>
          @page { 
            size: 80mm auto; 
            margin: 0; 
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            width: 80mm;
            padding: 5mm;
            font-family: 'Courier New', monospace;
            font-size: 10pt;
            background: white;
            color: black;
          }
          
          .logo-container {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #000;
          }
          
          .logo-container img {
            width: 60mm;
            height: auto;
            display: block;
            margin: 0 auto;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
          }
          
          .center { text-align: center; }
          .right { text-align: right; }
          .total { font-size: 1.2em; font-weight: bold; }
          
          /* Força impressão de imagens */
          @media print {
            body, .logo-container, .logo-container img {
              display: block !important;
              visibility: visible !important;
            }
            img {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="logo-container">
          <img src="https://mandavenovoatualiza.vercel.app/logo.png" alt="Logo" />
        </div>
        ${htmlContent}
        <script>
          // Aguarda a logo carregar antes de imprimir
          window.onload = function() {
            const img = document.querySelector('img');
            if (img.complete) {
              setTimeout(() => window.print(), 500);
            } else {
              img.onload = () => setTimeout(() => window.print(), 500);
              img.onerror = () => setTimeout(() => window.print(), 500);
            }
          };
        </script>
      </body>
      </html>
    `;

    iframeDoc.open();
    iframeDoc.write(printHtml);
    iframeDoc.close();

    // Cleanup após impressão
    const printWindow = iframe.contentWindow;
    if (printWindow) {
      printWindow.onafterprint = onFinished;
    }

  }, [htmlContent, onFinished]);

  return (
    <iframe
      ref={iframeRef}
      style={{ display: 'none', position: 'absolute', left: '-9999px' }}
      title="Print Area"
    />
  );
};

export default PrintIFrame;