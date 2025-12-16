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

    // Monta o HTML com a logo FORÇADA para impressão
    const printHtml = `
      <html>
      <head>
        <title>Recibo #${Date.now()}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @page { 
            size: 80mm auto; 
            margin: 0; 
          }
          
          body {
            margin: 0;
            padding: 5mm; 
            font-family: 'Courier New', monospace; 
            font-size: 10pt;
            width: 80mm;
            background: white;
          }
          
          /* 🖼️ ESTILOS DA LOGO - FORÇADOS PARA IMPRESSÃO */
          .logo-container {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #000;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .logo-container img {
            max-width: 60mm !important;
            width: 60mm !important;
            height: auto !important;
            display: block !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Garante que a logo apareça na impressão */
          @media print {
            .logo-container {
              display: block !important;
              visibility: visible !important;
            }
            .logo-container img {
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
            }
          }
          
          table {
            border-collapse: collapse;
            margin-top: 5px;
            width: 100%;
          }
          
          .center { text-align: center; }
          .right { text-align: right; }
          .total { font-size: 1.2em; font-weight: bold; }
        </style>
      </head>
      <body>
        <!-- 🖼️ LOGO NO TOPO -->
        <div class="logo-container">
          <img 
            src="https://mandavenovoatualiza.vercel.app/logo.png" 
            alt="Cantinho da Bere"
            crossorigin="anonymous"
          />
        </div>
        
        <!-- CONTEÚDO DO TICKET -->
        ${htmlContent}
      </body>
      </html>
    `;

    iframeDoc.open();
    iframeDoc.write(printHtml);
    iframeDoc.close();

    // Aguarda carregar e imprime
    const printWindow = iframe.contentWindow;
    
    const executePrint = () => {
      if (!printWindow) return;
      
      // Aguarda um pouco mais para garantir que a logo carregou
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        onFinished();
      }, 2000); // 2 segundos de espera
    };

    iframe.onload = executePrint;

  }, [htmlContent, onFinished]);

  return (
    <iframe
      ref={iframeRef}
      style={{ display: 'none', position: 'absolute' }}
      title="Print Area"
    />
  );
};

export default PrintIFrame;