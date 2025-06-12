import React, { useState, ChangeEvent } from 'react';
import { Button, Box, Typography, CircularProgress } from '@mui/material';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  return (
    <Box sx={{ my: 2 }}>
      <input
        accept="*/*"
        style={{ display: 'none' }}
        id="file-upload"
        type="file"
        onChange={handleFileChange}
      />
      <label htmlFor="file-upload">
        <Button variant="contained" component="span">
          Select File
        </Button>
      </label>
      {selectedFile && (
        <Typography sx={{ mt: 1 }}>
          Selected file: {selectedFile.name}
        </Typography>
      )}
      {loading && <CircularProgress sx={{ mt: 2 }} />}
    </Box>
  );
};

export default FileUpload;
