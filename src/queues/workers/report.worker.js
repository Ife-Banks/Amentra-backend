import { getReportQueue } from '../report.queue.js';
import ReportJob from '../../models/ReportJob.js';
import { generatePdfFromHtml } from '../../utils/generatePdf.js';
import cloudinary from '../../config/cloudinary.js';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';

const queue = getReportQueue();

queue.process(async (job) => {
  const { jobId, reportType, format, institutionId, requestedById, dateFrom, dateTo } = job.data;
  await ReportJob.findByIdAndUpdate(jobId, { status: 'processing' });
  try {
    const html = `<h1>Report: ${reportType}</h1><p>Generated at ${new Date().toISOString()}</p>`;
    let buffer;
    if (format === 'pdf') {
      buffer = await generatePdfFromHtml(html);
    } else {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Report');
      ws.addRow(['Report', reportType]);
      ws.addRow(['Generated', new Date().toISOString()]);
      buffer = await wb.xlsx.writeBuffer();
    }
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder: 'amentra-reports' },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      const readStream = Readable.from(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer));
      readStream.pipe(uploadStream);
    });
    await ReportJob.findByIdAndUpdate(jobId, { status: 'completed', fileUrl: result.secure_url, completedAt: new Date() });
  } catch (err) {
    await ReportJob.findByIdAndUpdate(jobId, { status: 'failed', completedAt: new Date() });
  }
});

export default queue;
