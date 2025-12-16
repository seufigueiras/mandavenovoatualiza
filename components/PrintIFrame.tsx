// components/ui/PrintIFrame.tsx
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

    // 1. Prepara o Documento do iFrame
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // 2. Monta o HTML Básico para Recibo 80mm COM LOGO
    const printHtml = `
      <html>
      <head>
        <title>Recibo #${Date.now()}</title>
        <style>
          @page { 
            size: 80mm auto; 
            margin: 0; 
          }
          body {
            margin: 0;
            padding: 5mm; 
            font-family: 'monospace', sans-serif; 
            font-size: 10pt;
            visibility: visible !important;
            width: auto !important;
          }
          
          /* 🖼️ ESTILOS DA LOGO */
          .logo-container {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #000;
          }
          .logo-container img {
            max-width: 60mm;
            height: auto;
            display: block;
            margin: 0 auto;
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
            src="/logo.png" 
            alt="Logo" 
            id="receiptLogo"
            onerror="this.style.display='none'"
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

    // 3. AGUARDA A LOGO CARREGAR ANTES DE IMPRIMIR
    const printWindow = iframe.contentWindow;
    
    const waitForImageAndPrint = () => {
      if (!printWindow) return;

      const logoImg = iframeDoc.getElementById('receiptLogo') as HTMLImageElement;
      
      if (logoImg) {
        // Se a imagem já carregou
        if (logoImg.complete && logoImg.naturalHeight !== 0) {
          console.log('✅ Logo carregada com sucesso!');
          printWindow.focus();
          printWindow.print();
          onFinished();
        } else {
          // Aguarda o carregamento da imagem
          logoImg.onload = () => {
            console.log('✅ Logo carregada após espera!');
            printWindow.focus();
            printWindow.print();
            onFinished();
          };
          
          // Se a imagem falhar, imprime sem ela
          logoImg.onerror = () => {
            console.warn('⚠️ Erro ao carregar logo, imprimindo sem ela...');
            printWindow.focus();
            printWindow.print();
            onFinished();
          };
          
          // Timeout de segurança (3 segundos)
          setTimeout(() => {
            console.log('⏱️ Timeout atingido, imprimindo...');
            printWindow.focus();
            printWindow.print();
            onFinished();
          }, 3000);
        }
      } else {
        // Se não encontrou a imagem, imprime normalmente
        printWindow.focus();
        printWindow.print();
        onFinished();
      }
    };

    // Aguarda o iframe carregar completamente
    iframe.onload = () => {
      setTimeout(waitForImageAndPrint, 500);
    };

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