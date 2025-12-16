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
        // 1. Injeta o HTML do comprovante (com a logo normal) no elemento escondido
        printArea.innerHTML = `
            <div class="logo-container" style="text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px dashed #000;">
                <img 
                  src="/logo.png" 
                  alt="Logo Cantinho da Bere"
                  style="max-width: 180px; max-height: 100px; display: block; margin: 0 auto 8px auto;"
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

  // Retorna a DIV escondida. O CSS de impressão irá mostrar esta DIV e esconder o resto da tela.
  // A classe 'print-only' deve ser configurada no seu CSS para ser mostrada apenas na impressão.
  return (
    <div 
      id="print-area-content" 
      className="print-only" 
      style={{ 
        position: 'absolute', 
        top: '-9999px', 
        left: '-9999px',
        width: '80mm', /* Adicionando a largura correta */
        fontFamily: 'Courier New, monospace'
      }} 
    />
  );
};

export default PrintIFrame;