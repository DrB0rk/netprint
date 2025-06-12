import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import ipp from 'ipp';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { discoverPrinters } from './printer-discovery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });

// Enable CORS for development
const allowedOrigins = ['http://print.borklab.com', 'https://print.borklab.com'];

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Ensure uploads directory exists
const uploadsDir = join(__dirname, 'uploads');
await fs.mkdir(uploadsDir, { recursive: true });

// Endpoint to discover network printers
app.get('/api/printers', async (req, res) => {
  try {    const printers = await discoverPrinters();
    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    
    // Ensure valid JSON response
    res.json({
      printers: printers || [],
      success: true
    });
  } catch (error) {
    console.error('Error discovering printers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to discover printers',
      printers: [] 
    });
  }
});

// Add type interface for IPP response
interface IPPResponse {
  'job-attributes-tag'?: {
    'job-id'?: number
  }
}

app.post('/api/print', upload.single('file'), (req, res, next) => {
  (async () => {
    try {
      if (!req.file || !req.body.printerUri) {
        return res.status(400).json({ error: 'Missing file or printer URI' });
      }
      const { path: filePath } = req.file;
      const { printerUri } = req.body;
      
      // Read the file
      const fileData = await fs.readFile(filePath);
      
      // Create IPP client
      const printer = new ipp.Printer(printerUri);
      
      // Try to determine document format based on file extension
      const fileExt = req.file.originalname.split('.').pop()?.toLowerCase() || '';
      let documentFormat = 'application/octet-stream';
      
      // Map common file extensions to MIME types
      const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'jpeg': 'image/jpeg',
        'jpg': 'image/jpeg',
        'png': 'image/png'
      };
      
      if (fileExt in mimeTypes) {
        documentFormat = mimeTypes[fileExt];
      }
      
      console.log('Printing file:', {
        filename: req.file.originalname,
        size: fileData.length,
        printerUri,
        documentFormat
      });
      
      // Send print job with proper attributes
      const result = await new Promise<IPPResponse>((resolve, reject) => {
        const msg = {
          "operation-attributes-tag": {
            "requesting-user-name": "netprint",
            "job-name": req.file?.originalname || "print job",
            "document-format": documentFormat
          },
          data: fileData
        };
        
        (printer.execute as any)("Print-Job", msg, (err: Error | null, res: IPPResponse) => {
          if (err) {
            console.error('IPP error:', err);
            reject(err);
          } else {
            console.log('Print job response:', res);
            resolve(res);
          }
        });
      });

      // Clean up the uploaded file
      await fs.unlink(filePath);

      res.json({ 
        success: true, 
        jobId: result?.['job-attributes-tag']?.['job-id'],
        message: 'Print job sent successfully'
      });
    } catch (error) {
      console.error('Print error:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to print document' 
      });
    }
  })().catch(next);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
