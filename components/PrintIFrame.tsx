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
    // VOLTANDO PARA A URL COMPLETA. É MAIS SEGURO DENTRO DE IFRAMES.
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
          
          .logo-container {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px dashed #000;
          }
          
          .logo-container img {
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
            
            .logo-container img {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="logo-container">
          <img 
            id="logo" 
            src="${logoUrl}" 
            alt="Logo Cantinho da Bere"
          />
          <div class="logo-text">CANTINHO DA BERE</div>
        </div>
        
        <div class="content">
          ${htmlContent}
        </div>
        
        <script>
          (function() {
            const logoImg = document.getElementById('logo');
            let printAttempted = false;
            
            function triggerPrint() {
              if (printAttempted) return;
              printAttempted = true;
              
              setTimeout(() => {
                try {
                  window.print();
                } catch (e) {
                  console.error('Erro ao imprimir:', e);
                }
              }, 800);
            }
            
            if (logoImg) {
              console.log('Tentando carregar logo de:', logoImg.src);
              
              // Verifica se a imagem já está carregada (do cache)
              if (logoImg.complete && logoImg.naturalHeight !== 0) {
                console.log('Logo já estava carregada (cache)');
                triggerPrint();
              } else {
                // Aguarda carregar
                logoImg.onload = function() {
                  console.log('Logo carregada com sucesso!');
                  triggerPrint();
                };
                
                // *** REMOVIDO: Comentado o bloco de erro para não esconder a logo se falhar. ***
                // logoImg.onerror = function(e) {
                //   console.error('Erro ao carregar logo:', e);
                //   console.error('URL tentada:', logoImg.src);
                //   logoImg.style.display = 'none'; 
                //   triggerPrint();
                // };
                
                // Timeout de segurança
                setTimeout(() => {
                  if (!printAttempted) {
                    console.warn('Timeout: imprimindo mesmo sem confirmar logo');
                    triggerPrint();
                  }
                }, 2500);
              }
            } else {
              console.error('Elemento de logo não encontrado');
              triggerPrint();
            }
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