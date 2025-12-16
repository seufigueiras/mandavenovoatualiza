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

    // LOGO EMBUTIDA EM BASE64 - SEMPRE VAI FUNCIONAR!
    const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAJYCAIAAAAxBA+LAAABhGlDQ1BJQ0MgcHJvZmlsZQAAeJx9kT1Iw1AUhU9TpSIVBzuIOGSoThZEozimikUsFEtLW+nqQupPk4YkxcVRcC04+LOYdXBx1tXBVRAE/0BcXJ0UXaTEe5OCRYwHl/s4757Dfe8BQqPMVLNrHFA1y0jFY0I2typsPSKAfoQQQkBipj4vCQn0HV/38PX1Ls6z+p/7c4SUvMkAn0g8y3TDIt4gntq0dM77xGFWkBTic+Jxgy5I/Mh12eU3zgWHBZ4ZNtLJeeIwsVhoY7mNWcFQiSeJI4qqUb6QdVnhvMVZrdRY6578haG8trLMdVojSMASYogggQyVVVCHBbRaKSakqT3m4R9y/CK5ZHJVwMixgAZUSI4f/A9+z9YsTo51kyIxoPPFtj9GgdZdoFm37e9j226eAP5n4Epr+6sNYO6T9Hpbix4BfdvAxXVbk/eAyx1g6EmXDMmR/DQFhQLwfkbflAMGboGeNXdurXOcPgAZ6tXyDXBwCIwUKHvN493B7t7+vdPu7wfK3HKaJJzCIgAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+gMEQAWCiVgVgUAACAASURBVHja7N13nBxnnf/xZ+Z3Zu/2vl3t6lZS7723AWMMBmzTbK";

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recibo</title>
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
          }
          
          .logo-container {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #000;
          }
          
          .logo-container img {
            width: 60mm;
            height: auto;
            display: block;
            margin: 0 auto;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
          }
          
          .center { text-align: center; }
          .right { text-align: right; }
          .total { font-size: 1.2em; font-weight: bold; }
          
          @media print {
            body, .logo-container, .logo-container img {
              display: block !important;
              visibility: visible !important;
            }
            img {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="logo-container">
          <img src="${logoBase64}" alt="Logo" />
        </div>
        ${htmlContent}
        <script>
          window.onload = function() {
            setTimeout(() => window.print(), 1000);
          };
        </script>
      </body>
      </html>
    `;

    iframeDoc.open();
    iframeDoc.write(printHtml);
    iframeDoc.close();

    const printWindow = iframe.contentWindow;
    if (printWindow) {
      printWindow.onafterprint = onFinished;
    }

  }, [htmlContent, onFinished]);

  return (
    <iframe
      ref={iframeRef}
      style={{ display: 'none', position: 'absolute', left: '-9999px' }}
      title="Print Area"
    />
  );
};

export default PrintIFrame;