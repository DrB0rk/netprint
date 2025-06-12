import React, { useState, useEffect } from 'react';
import { Select, MenuItem, FormControl, InputLabel, Box, Button, CircularProgress, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Printer {
  name: string;
  uri: string;
}

interface PrinterSelectorProps {
  onPrinterSelect: (printer: Printer) => void;
}

const PrinterSelector: React.FC<PrinterSelectorProps> = ({ onPrinterSelect }) => {  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanNetwork = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const response = await fetch('https://printapi.borklab.com/api/printers');
      if (!response.ok) {
        throw new Error('Failed to scan for printers');
      }
      const foundPrinters = await response.json();
      setPrinters(foundPrinters);
      if (foundPrinters.length === 0) {
        setError('No printers found on the network');
      }
    } catch (err) {
      setError('Failed to scan network for printers');
      console.error('Error scanning for printers:', err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    scanNetwork();
  }, []);

  const handleChange = (event: { target: { value: string } }) => {
    const printer = printers.find(p => p.name === event.target.value);
    if (printer) {
      setSelectedPrinter(printer.name);
      onPrinterSelect(printer);
    }
  };
  return (
    <Box sx={{ my: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="printer-select-label">Select Printer</InputLabel>
          <Select
            labelId="printer-select-label"
            id="printer-select"
            value={selectedPrinter}
            label="Select Printer"
            onChange={handleChange}
            disabled={isScanning}
          >
            {printers.map((printer) => (
              <MenuItem key={printer.name} value={printer.name}>
                {printer.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          onClick={scanNetwork}
          disabled={isScanning}
          sx={{ ml: 1, minWidth: 'auto' }}
        >
          {isScanning ? (
            <CircularProgress size={24} />
          ) : (
            <RefreshIcon />
          )}
        </Button>
      </Box>
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default PrinterSelector;
