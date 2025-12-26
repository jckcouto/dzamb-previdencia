import PDFDocument from 'pdfkit';

const COLORS = {
  primary: '#D4AF37',
  background: '#FFFFFF',
  text: '#0D0D0D',
  textLight: '#666666',
  border: '#E0E0E0',
  highlight: '#F5F5DC',
};

interface ResumoPDFData {
  clienteNome: string;
  clienteCpf: string;
  resumoExecutivo: string;
  dataGeracao: Date;
}

function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export async function gerarResumoPDF(data: ResumoPDFData): Promise<Buffer> {
  console.log('[pdf-generator] Iniciando geração de PDF para:', data.clienteNome);
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 60, bottom: 60, left: 50, right: 50 },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        console.log('[pdf-generator] PDF gerado com sucesso, tamanho:', pdfBuffer.length, 'bytes');
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 100;

      doc.rect(0, 0, pageWidth, 120).fill(COLORS.primary);
      
      doc.fillColor(COLORS.background);
      doc.fontSize(12).font('Helvetica');
      doc.text('Do Zero ao', 50, 35, { align: 'center', width: contentWidth });
      
      doc.fontSize(28).font('Helvetica-Bold');
      doc.text('Melhor Benefício', 50, 55, { align: 'center', width: contentWidth });
      
      doc.fontSize(10).font('Helvetica');
      doc.text('Planejamento Previdenciário', 50, 90, { align: 'center', width: contentWidth });

      doc.rect(40, 140, pageWidth - 80, 70).fill(COLORS.highlight);
      
      doc.fillColor(COLORS.text);
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('DADOS DO CLIENTE', 55, 150);
      
      doc.fontSize(11).font('Helvetica');
      doc.text(`Nome: ${data.clienteNome}`, 55, 175);
      doc.text(`CPF: ${formatCPF(data.clienteCpf)}`, 55, 192);

      doc.fillColor(COLORS.primary);
      doc.fontSize(16).font('Helvetica-Bold');
      doc.text('RESUMO EXECUTIVO', 50, 235);
      
      doc.moveTo(50, 255).lineTo(pageWidth - 50, 255).strokeColor(COLORS.primary).lineWidth(2).stroke();

      doc.fillColor(COLORS.text);
      doc.fontSize(11).font('Helvetica');
      
      const resumoContent = data.resumoExecutivo || 'Resumo não disponível';
      const lines = resumoContent.split('\n');
      let yPosition = 275;
      const lineHeight = 16;
      const maxY = doc.page.height - 100;

      const drawPageHeader = () => {
        doc.rect(0, 0, pageWidth, 50).fill(COLORS.primary);
        doc.fillColor(COLORS.background);
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text('DZAMB - Do Zero ao Melhor Benefício', 50, 18, { align: 'center', width: contentWidth });
        doc.fillColor(COLORS.text);
      };

      for (const line of lines) {
        if (yPosition > maxY) {
          doc.addPage();
          drawPageHeader();
          yPosition = 70;
        }

        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          doc.font('Helvetica-Bold');
          doc.text(trimmedLine.replace(/\*\*/g, ''), 50, yPosition, { width: contentWidth });
        } else if (trimmedLine.startsWith('• ') || trimmedLine.startsWith('- ')) {
          doc.font('Helvetica');
          const bulletText = trimmedLine.replace(/^[•\-]\s*/, '');
          doc.text(`  • ${bulletText}`, 50, yPosition, { width: contentWidth });
        } else if (trimmedLine.match(/^\d+\./)) {
          doc.font('Helvetica');
          doc.text(`  ${trimmedLine}`, 50, yPosition, { width: contentWidth });
        } else {
          doc.font('Helvetica');
          doc.text(trimmedLine || ' ', 50, yPosition, { width: contentWidth });
        }
        
        yPosition += lineHeight;
      }

      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        const footerY = doc.page.height - 40;
        
        doc.moveTo(50, footerY - 10).lineTo(pageWidth - 50, footerY - 10).strokeColor(COLORS.border).lineWidth(0.5).stroke();
        
        doc.fillColor(COLORS.textLight);
        doc.fontSize(9).font('Helvetica');
        doc.text(`Gerado em: ${formatDate(data.dataGeracao)}`, 50, footerY, { align: 'left' });
        doc.text(`Página ${i + 1} de ${pageCount}`, 50, footerY, { align: 'right', width: contentWidth });
        
        doc.fontSize(8);
        doc.text('DZAMB - Do Zero ao Melhor Benefício', 50, footerY + 12, { align: 'center', width: contentWidth });
      }

      doc.end();
    } catch (error) {
      console.error('[pdf-generator] Erro ao gerar PDF:', error);
      reject(error);
    }
  });
}
