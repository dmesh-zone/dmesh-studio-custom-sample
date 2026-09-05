import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import DataProductTabular from '../../../components/DataProductTabular';

export default function Page() {
    const tableDescriptor = [
        { columnName: "Domain", odpsDescriptor: "domain", textMapper: (val, ctx) => ctx.formatDomain(val) },
        { columnName: "Type", odpsDescriptor: "_customProperty(\"dataProductTier\")", textMapper: (val, ctx) => ctx.formatType(val) },
        { columnName: "Data Product Name", odpsDescriptor: "_customProperty(\"dataProductBusinessName\")", sidePanelLink: true },
        { columnName: "Purpose", odpsDescriptor: "description.purpose" },
        { columnName: "Stage", odpsDescriptor: "_highestEnv", displayFormat: "chip" }
    ];

    const sidePanelDescriptor = [
        { name: "ID", odpsDescriptor: "id" },
        { name: "DOMAIN TECHNICAL NAME", odpsDescriptor: "domain" },
        { name: "DATA PRODUCT TECHNICAL NAME", odpsDescriptor: "name" }
    ];

    return (
        <DataProductTabular
            title="Data Products"
            tierFilter={['sourceAligned', 'curated', 'consumerAligned']}
            tableDescriptor={tableDescriptor}
            sidePanelDescriptor={sidePanelDescriptor}
            renderAboveTable={({ sortedProducts }) => {
                const total = sortedProducts.length;
                const sourceAligned = sortedProducts.filter(p => p.type === 'sourceAligned').length;
                const curated = sortedProducts.filter(p => p.type === 'curated').length;
                const consumerAligned = sortedProducts.filter(p => p.type === 'consumerAligned').length;

                return (
                    <Box sx={{ display: 'flex', gap: 2, mb: 1, width: '100%' }}>
                        {[
                            { label: 'Total', count: total },
                            { label: 'Source Aligned', count: sourceAligned },
                            { label: 'Curated', count: curated },
                            { label: 'Consumer Aligned', count: consumerAligned },
                        ].map((item, idx) => (
                            <Paper key={idx} sx={{ flex: 1, p: 2, textAlign: 'center', borderRadius: 2, border: '1px solid var(--m3-outline-variant, #e2e8f0)', boxShadow: 'none' }}>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                    {item.count}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    {item.label}
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                );
            }}
        />
    );
}
