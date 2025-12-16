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
        
        // 🛠️ MUDANÇA: Injeção da Logo Recriada com HTML/CSS Puro (Sem Imagem)
        const logoHtmlPuro = `
            <div style="text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px dashed #000; color: #000 !important;">
                
                <div style="
                    font-size: 12pt !important; 
                    font-weight: bold !important; 
                    text-transform: uppercase; 
                    line-height: 1 !important; 
                    margin-bottom: 2px;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                ">
                    Cantinho da
                </div>

                <div style="
                    font-family: 'Courier New', monospace; /* Fonte simples garantida */
                    font-size: 32pt !important; 
                    font-weight: 900 !important; /* Extra Bold */
                    line-height: 0.8 !important; /* Diminui a altura da linha para juntar as palavras */
                    text-transform: uppercase; 
                    margin-bottom: 5px;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                ">
                    BERE
                </div>

                <div style="font-size: 10pt; font-weight: normal;">Gestão de Restaurantes</div>
            </div>
        `;
        
        const footerHtml = `
            <div class="footer" style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #000; text-align: center; font-size: 9pt;">
                Obrigado pela preferência!
            </div>
        `;
        
        // Concatena todo o conteúdo
        printArea.innerHTML = logoHtmlPuro + htmlContent + footerHtml;
        
        window.print();

        setTimeout(() => {
            printArea.innerHTML = '';
            onFinished();
        }, 500); 
    }
  }, [htmlContent, onFinished]);

  // Retorno do componente (inalterado)
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