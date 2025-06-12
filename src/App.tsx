import { useState } from 'react';
import { Container, Paper, Typography, Button, Box, Alert } from '@mui/material';
import FileUpload from './components/FileUpload';
import PrinterSelector from './components/PrinterSelector';

interface Printer {
  name: string;
  uri: string;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePrint = async () => {
    if (!selectedFile || !selectedPrinter) {
      setError('Please select both a file and a printer');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('printerUri', selectedPrinter.uri);

      const response = await fetch('/api/print', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Printing failed');
      }

      setSuccess('Document sent to printer successfully!');
      setError(null);
    } catch (err) {
      setError('Failed to send document to printer. Please try again.');
      setSuccess(null);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Network Printer
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <FileUpload onFileSelect={(file) => setSelectedFile(file)} />
        <PrinterSelector onPrinterSelect={(printer) => setSelectedPrinter(printer)} />

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handlePrint}
            disabled={!selectedFile || !selectedPrinter}
          >
            Print Document
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default App;