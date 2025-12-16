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

    // ============================================================
    // USANDO A URL COMPLETA (Confirmado que funciona no servidor)
    // ============================================================
    const logoUrl = `${window.location.origin}/logo.png`;
    // ============================================================

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comprovante - Cantinho da Bere</title>
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
            line-height: 1.4;
          }
          
          /* O logo-container foi removido do topo */
          
          .logo-footer { /* NOVO ESTILO */
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px dashed #000;
          }
          
          .logo-footer img { /* NOVO ESTILO */
            max-width: 180px;
            max-height: 100px;
            width: auto;
            height: auto;
            display: block;
            margin: 0 auto 8px auto;
            object-fit: contain;
          }
          
          .logo-text {
            font-size: 14pt;
            font-weight: bold;
            margin: 5px 0;
            letter-spacing: 1px;
            color: #000;
          }
          
          .content {
            margin-top: 10px;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0; 
          }
          
          td, th {
            padding: 4px 2px;
            text-align: left;
          }
          
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          
          .total-line {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #000;
          }
          
          .total { 
            font-size: 1.2em; 
            font-weight: bold; 
          }
          
          .footer {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px dashed #000;
            text-align: center;
            font-size: 9pt;
          }
          
          @media print {
            body { 
              margin: 0;
              padding: 5mm;
            }
            
            .logo-footer img {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        
        <div class="content">
          ${htmlContent}
        </div>
        
        <div class="logo-footer">
          <img 
            id="logo" 
            src="${logoUrl}" 
            alt="Logo Cantinho da Bere"
          />
          <div class="logo-text">CANTINHO DA BERE</div>
        </div>
        
        <script>
          // O script de onload e triggerPrint foi simplificado, pois o problema de carregamento já foi resolvido.
          (function() {
            setTimeout(() => {
              try {
                window.print();
              } catch (e) {
                console.error('Erro ao imprimir:', e);
              }
            }, 800); // Dá um tempo para o navegador renderizar
          })();
        </script>
      </body>
      </html>
    `;

    iframeDoc.open();
    iframeDoc.write(printHtml);
    iframeDoc.close();

  }, [htmlContent, onFinished]);

  return (
    <iframe
      ref={iframeRef}
      style={{ 
        display: 'none', 
        position: 'absolute', 
        left: '-9999px',
        top: '-9999px',
        width: '80mm',
        height: '100%',
        border: 'none'
      }}
      title="Print Area"
    />
  );
};

export default PrintIFrame;