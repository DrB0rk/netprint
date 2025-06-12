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
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
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
  try {
    const printers = await discoverPrinters();
    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', 'http://print.borklab.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    
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
      // Create IPP client using the correct method
      const printer = new ipp.Printer(printerUri);
      
      // Send print job with proper attributes
      const result = await new Promise<IPPResponse>((resolve, reject) => {
        const msg = {
          "operation-attributes-tag": {
            "requesting-user-name": "netprint",
            "job-name": req.file?.originalname || "print job",
            "document-format": "application/octet-stream"
          },
          data: fileData
        };
        
        (printer.execute as any)("Print-Job", msg, (err: Error | null, res: IPPResponse) => {
          if (err) reject(err);
          else resolve(res);
        });
      });

      // Clean up the uploaded file
      await fs.unlink(filePath);

      res.json({ success: true, jobId: result?.['job-attributes-tag']?.['job-id'] });
    } catch (error) {
      console.error('Print error:', error);
      res.status(500).json({ error: 'Failed to print document' });
    }
  })().catch(next);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
