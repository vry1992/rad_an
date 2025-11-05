import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportTablesToPdf(className: string) {
  const tables = document.querySelectorAll(`.${className}`);
  if (!tables.length) return;

  const pdf = new jsPDF({
    orientation: 'l', // landscape
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i] as HTMLElement;

    const canvas = await html2canvas(table, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    debugger;
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // коефіцієнт масштабування, щоб вписати таблицю в межі сторінки
    const widthRatio = pdfWidth / imgWidth;
    const heightRatio = pdfHeight / imgHeight;
    const ratio = Math.min(widthRatio, heightRatio);

    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;

    // центровано по вертикалі
    const xOffset = (pdfWidth - finalWidth) / 4;
    const yOffset = (pdfHeight - finalHeight) / 4;

    if (i > 0) pdf.addPage();
    pdf.addImage(
      imgData,
      'JPEG',
      xOffset,
      yOffset,
      finalWidth,
      finalHeight,
      undefined,
      'FAST'
    );
  }

  pdf.save('Експорт РЛС за _____________ місяць.pdf');
}
