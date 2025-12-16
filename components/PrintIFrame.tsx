// components/PrintIFrame.tsx

// ... (Restante das importações e interface)

const PrintIFrame: React.FC<PrintIFrameProps> = ({ htmlContent, onFinished }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // ============================================================
    // USANDO A URL COMPLETA. Esta é a mais robusta para IFRAMES.
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
          /* ... (Todos os estilos CSS estão aqui) ... */
          @page { 
            size: 80mm auto; 
            margin: 0; 
          }
          /* ... (o restante dos seus estilos CSS) ... */

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
                
                // *** REMOVEMOS: O código onerror para garantir que o elemento da imagem não seja escondido se falhar. ***
                
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