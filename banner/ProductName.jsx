import React from 'react';
import { Typography, Box } from '@mui/material';

export default function ProductName() {
    return (
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
            <strong>Custom Product</strong>
        </Typography>
    );
}
