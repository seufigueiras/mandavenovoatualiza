// components/PrintIFrame.tsx

import React, { useEffect, useRef } from 'react';

interface PrintIFrameProps {
  htmlContent: string; 
  onFinished: () => void;
}

// Retornando à sintaxe React.FC para máxima compatibilidade no deploy
const PrintIFrame: React.FC<PrintIFrameProps> = (props) => { 
  const { htmlContent, onFinished } = props; 

  const printAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    
    const printArea = printAreaRef.current;
    
    if (printArea) {
        
        // **INJEÇÃO HTML COM ESTILOS INLINE AGRESSIVOS PARA A LOGO**
        printArea.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px dashed #000;">
                <img 
                  src="/logo.png" 
                  alt="Logo Cantinho da Bere"
                  
                  style="
                    max-width: 180px !important; 
                    max-height: 100px !important; 
                    width: auto !important; 
                    height: auto !important; 
                    display: block !important; 
                    margin: 0 auto 8px auto !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    min-width: 50px !important; 
                    min-height: 50px !important;
                    -webkit-print-color-adjust: exact !important; 
                    print-color-adjust: exact !important;
                  "
                />
                <div style="font-size: 14pt; font-weight: bold;">CANTINHO DA BERE</div>
            </div>
            ${htmlContent}
            <div class="footer" style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #000; text-align: center; font-size: 9pt;">
                Obrigado pela preferência!
            </div>
        `;
        
        window.print();

        setTimeout(() => {
            printArea.innerHTML = '';
            onFinished();
        }, 500); 
    }
  }, [htmlContent, onFinished]);

  // Retorna a DIV escondida com o ref
  return (
    <div 
      ref={printAreaRef}
      id="print-area-content" 
      className="print-only" 
      style={{ 
        position: 'absolute', 
        top: '-9999px', 
        left: '-9999px',
        // O tamanho será ajustado pelo CSS externo (print.css)
        fontFamily: 'Courier New, monospace'
      }} 
    />
  );
};

export default PrintIFrame;