// components/PrintIFrame.tsx

import React, { useEffect } from 'react';

interface PrintIFrameProps {
  htmlContent: string; 
  onFinished: () => void;
}

const PrintIFrame: React.FC<PrintIFrameProps> = ({ htmlContent, onFinished }) => {
  
  useEffect(() => {
    
    const printArea = document.getElementById('print-area-content');
    
    // Se o componente for renderizado, injeta o HTML e imprime a página principal
    if (printArea) {
        
        // **ATENÇÃO: Código HTML injetado com estilos inline agressivos para a logo**
        printArea.innerHTML = `
            <div class="logo-container" style="text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px dashed #000;">
                <img 
                  src="/logo.png" 
                  alt="Logo Cantinho da Bere"
                  
                  /* ======================================================= */
                  /* ESTILOS INLINE AGRESSIVOS PARA FORÇAR A RENDERIZAÇÃO */
                  /* ======================================================= */
                  style="
                    max-width: 180px !important; 
                    max-height: 100px !important; 
                    width: auto !important; 
                    height: auto !important; 
                    display: block !important; 
                    margin: 0 auto 8px auto !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    min-width: 50px !important; /* Garante tamanho mínimo */
                    min-height: 50px !important;
                    /* Garante que a impressora renderize cores */
                    -webkit-print-color-adjust: exact !important; 
                    print-color-adjust: exact !important;
                  "
                  /* ======================================================= */
                />
                <div class="logo-text" style="font-size: 14pt; font-weight: bold;">CANTINHO DA BERE</div>
            </div>
            ${htmlContent}
            <div class="footer" style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #000; text-align: center; font-size: 9pt;">
                Obrigado pela preferência!
            </div>
        `;
        
        // 2. Chama a impressão da janela principal
        window.print();

        // 3. Limpa a área e finaliza
        // O timeout garante que a impressão seja iniciada antes de remover o conteúdo
        setTimeout(() => {
            printArea.innerHTML = '';
            onFinished();
        }, 500); 
    } else {
        console.error("Elemento #print-area-content não encontrado.");
        onFinished();
    }
  }, [htmlContent, onFinished]);

  // Retorna a DIV escondida que será mostrada apenas durante a impressão.
  return (
    <div 
      id="print-area-content" 
      className="print-only" 
      style={{ 
        position: 'absolute', 
        top: '-9999px', 
        left: '-9999px',
        width: '80mm', /* Define a largura para a impressão */
        fontFamily: 'Courier New, monospace'
      }} 
    />
  );
};

export default PrintIFrame;