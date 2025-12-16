// components/PrintIFrame.tsx

import React, { useEffect, useRef } from 'react';

interface PrintIFrameProps {
  htmlContent: string; 
  onFinished: () => void;
}

const PrintIFrame: React.FC<PrintIFrameProps> = (props) => { 
  const { htmlContent, onFinished } = props; 

  const printAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    
    const printArea = printAreaRef.current;
    
    if (printArea) {
        
        // **INJEÇÃO HTML APENAS COM TEXTO**
        printArea.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px dashed #000;">
                
                <div style="font-size: 16pt; font-weight: bold; margin-bottom: 5px; text-transform: uppercase;">MANDAVE</div>
                <div style="font-size: 11pt;">Gestão de Restaurantes</div>

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
        fontFamily: 'Courier New, monospace'
      }} 
    />
  );
};

export default PrintIFrame;