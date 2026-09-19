/**
 * DataProductCostDashboard is a custom page component that demonstrates how to create a 
 * bespoke view integrating external data (cost CSV) with internal operational data (Data Products).
 * 
 * View Structure:
 * - A filtering header (Environment, Domain, Data Product Type)
 * - A KPI card for "Total Cost"
 * - Two pie charts: "Cost per Domain" and "Cost per Data Product"
 * - A sortable, paginated data table showing line-item costs
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress, RadioGroup, FormControlLabel, Radio, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, TableSortLabel, Alert } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import OperationalData from '../../services/OperationalData';
import DomainSelectorWidget from '../../components/base/DomainSelectorWidget';
import EnvironmentSelectorWidget from '../../components/base/EnvironmentSelectorWidget';
import DataProductTypeSelectorWidget, { formatType } from '../../components/base/DataProductTypeSelectorWidget';
import DataProductSearchWidget from '../../components/base/DataProductSearchWidget';
import { useThemeContext } from '../../ThemeContext';
import { resolveOdpsPath } from '../../utils/odpsPath';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

/**
 * Main Dashboard Component
 * Manages state for data fetching, filtering, sorting, and pagination.
 */
export default function DataProductCostDashboard() {
    const { mode } = useThemeContext();
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [costs, setCosts] = useState<Record<string, number>>({});
    const [environments, setEnvironments] = useState<string[]>([]);
    const [allDomains, setAllDomains] = useState<string[]>([]);
    const [allTypes, setAllTypes] = useState<string[]>([]);

    // Filters
    const [envFilter, setEnvFilter] = useState('All');
    const [selectedDomains, setSelectedDomains] = useState<string[]>(() => {
        try {
            const urlDomains = new URLSearchParams(location.search).get('domains');
            if (urlDomains !== null) {
                return (urlDomains && urlDomains !== '*') ? urlDomains.split(',') : [];
            }
            const stored = localStorage.getItem('dmesh-selected-domains');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });
    const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
        try {
            const urlTypes = new URLSearchParams(location.search).get('types');
            if (urlTypes !== null) {
                return (urlTypes && urlTypes !== '*') ? urlTypes.split(',') : [];
            }
            const stored = localStorage.getItem('dmesh-selected-types');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });
    const [searchText, setSearchText] = useState(() => {
        return new URLSearchParams(location.search).get('search') || '';
    });
    const [domainNameCustomisation, setDomainNameCustomisation] = useState<Record<string, string>>({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: string | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

    const formatDomain = React.useCallback((val: string) => {
        if (!val) return '';
        const normalized = String(val).toLowerCase().replace(/\s+/g, '');
        return domainNameCustomisation[normalized] || val;
    }, [domainNameCustomisation]);

    useEffect(() => {
        const load = async () => {
            try {
                // Fetch Operational Data
                const data = await OperationalData.DataProducts(null);
                setProducts(data.products);
                setAllDomains(data.domains);
                setAllTypes(data.types);
                setEnvironments(data.environments);
                setDomainNameCustomisation(data.config.domainNameCustomisation || {});

                // Initialize Environment from localStorage or default
                const defaultEnv = data.config['default-environment'] || data.environments[data.environments.length - 1];
                const storedEnv = localStorage.getItem('dmesh-selected-env');
                const envToSet = storedEnv && data.environments.includes(storedEnv) ? storedEnv : defaultEnv;
                setEnvFilter(envToSet);

                // Domain from localStorage is now handled in useState directly

                // Load Custom CSV Cost Data
                const csvRes = await fetch(`${import.meta.env.BASE_URL}sampleData/base/PetsDataProductCost.csv?t=${Date.now()}`);
                if (csvRes.ok) {
                    const text = await csvRes.text();
                    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                    const costMap: Record<string, number> = {};
                    // Skip header
                    for (let i = 1; i < lines.length; i++) {
                        const parts = lines[i].split(',');
                        if (parts.length >= 3) {
                            const env = parts[0].trim();
                            const name = parts[1].trim();
                            const cost = parseFloat(parts[2].trim());
                            if (!isNaN(cost)) costMap[`${env}|${name}`] = cost;
                        }
                    }
                    setCosts(costMap);
                }

                setIsLoading(false);
            } catch (err) {
                console.error("Error loading dashboard data", err);
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // Local Storage & URL Sync
    useEffect(() => {
        if (envFilter && envFilter !== 'All') {
            localStorage.setItem('dmesh-selected-env', envFilter);
        }
        if (selectedDomains.length > 0) {
            localStorage.setItem('dmesh-selected-domains', JSON.stringify(selectedDomains));
        } else if (allDomains.length > 0) {
            localStorage.removeItem('dmesh-selected-domains');
        }
        if (selectedTypes.length > 0) {
            localStorage.setItem('dmesh-selected-types', JSON.stringify(selectedTypes));
        } else if (allTypes.length > 0) {
            localStorage.removeItem('dmesh-selected-types');
        }
            
        const searchParams = new URLSearchParams(location.search);
        let paramsChanged = false;

        const currentEnv = searchParams.get('env');
        if (envFilter && envFilter !== 'All' && currentEnv !== envFilter) {
            searchParams.set('env', envFilter);
            paramsChanged = true;
        }

        const currentDomains = searchParams.get('domains') || '';
        const expectedDomains = (selectedDomains.length === 0 || (allDomains.length > 0 && selectedDomains.length === allDomains.length)) 
            ? '*' 
            : selectedDomains.join(',');

        if (currentDomains !== expectedDomains) {
            if (expectedDomains && expectedDomains !== '*') searchParams.set('domains', expectedDomains);
            else if (expectedDomains === '*') searchParams.set('domains', '*');
            else searchParams.delete('domains');
            paramsChanged = true;
        }

        const currentTypes = searchParams.get('types') || '';
        const expectedTypes = (selectedTypes.length === 0 || (allTypes.length > 0 && selectedTypes.length === allTypes.length)) 
            ? '*' 
            : selectedTypes.join(',');

        if (currentTypes !== expectedTypes) {
            if (expectedTypes && expectedTypes !== '*') searchParams.set('types', expectedTypes);
            else if (expectedTypes === '*') searchParams.set('types', '*');
            else searchParams.delete('types');
            paramsChanged = true;
        }

        const currentSearch = searchParams.get('search') || '';
        if (currentSearch !== searchText) {
            if (searchText) searchParams.set('search', searchText);
            else searchParams.delete('search');
            paramsChanged = true;
        }

        let searchStr = searchParams.toString();
        if (paramsChanged && searchStr) {
            const order: Record<string, number> = { env: 1, domains: 2, types: 3, search: 4 };
            const entries = Array.from(searchParams.entries());
            entries.sort((a, b) => (order[a[0]] || 99) - (order[b[0]] || 99));
            searchStr = new URLSearchParams(entries).toString();
        }

        if (paramsChanged) {
            navigate(`${location.pathname}?${searchStr}`, { replace: true });
        }
    }, [envFilter, selectedDomains, selectedTypes, searchText, allDomains, allTypes, location.pathname, location.search, navigate]);

    // Apply Filters
    const filteredProducts = useMemo(() => {
        return products.filter(prod => {
            if (envFilter !== 'All') {
                const hasEnv = Array.from(prod.envs).some(e => String(e).toLowerCase() === String(envFilter).toLowerCase());
                if (!hasEnv) return false;
            }
            if (selectedDomains.length > 0 && !selectedDomains.includes(prod.domain)) {
                return false;
            }
            if (selectedTypes.length > 0 && !selectedTypes.includes(prod.type)) {
                return false;
            }
            if (searchText) {
                const query = searchText.toLowerCase();
                const businessName = resolveOdpsPath(prod, '_customProperty("dataProductBusinessName")');
                const nameToSearch = businessName || prod.name || prod.id;
                const matchesName = nameToSearch && String(nameToSearch).toLowerCase().includes(query);
                const matchesDomain = prod.domain && prod.domain.toLowerCase().includes(query);
                const matchesType = prod.type && prod.type.toLowerCase().includes(query);
                if (!matchesName && !matchesDomain && !matchesType) {
                    return false;
                }
            }
            return true;
        });
    }, [products, envFilter, selectedDomains, selectedTypes, searchText]);

    /**
     * Compute Metrics:
     * This hook dynamically aggregates the filtered products to generate the data 
     * required by the UI components (Total KPI, Pie Charts, and Data Table).
     */
    const { totalCost, costByDomain, costByProduct, tableData } = useMemo(() => {
        let total = 0;
        const domainCost: Record<string, number> = {};
        const productCost: { name: string, value: number }[] = [];
        const table: any[] = [];

        filteredProducts.forEach(prod => {
            const rawName = prod.name || prod.id;
            const businessName = resolveOdpsPath(prod, '_customProperty("dataProductBusinessName")');
            const name = businessName || rawName;

            let cost = 0;

            if (envFilter !== 'All') {
                cost = costs[`${envFilter}|${name}`] || 0;
            } else {
                Array.from(prod.envs).forEach(env => {
                    cost += costs[`${String(env)}|${name}`] || 0;
                });
            }

            total += cost;

            if (!domainCost[prod.domain]) domainCost[prod.domain] = 0;
            domainCost[prod.domain] += cost;

            productCost.push({ name, value: cost });

            table.push({
                name,
                type: prod.type || '-',
                cost
            });
        });

        const domainCostArray = Object.keys(domainCost).map(domain => ({ name: formatDomain(domain), value: domainCost[domain] }));
        return { totalCost: total, costByDomain: domainCostArray, costByProduct: productCost, tableData: table };
    }, [filteredProducts, costs, formatDomain, envFilter]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedTableData = useMemo(() => {
        if (!sortConfig.key) return tableData;
        return [...tableData].sort((a, b) => {
            const aVal = a[sortConfig.key as keyof typeof a];
            const bVal = b[sortConfig.key as keyof typeof b];
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [tableData, sortConfig]);

    const paginatedTableData = useMemo(() => {
        return sortedTableData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [sortedTableData, page, rowsPerPage]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ pt: 1.5, pb: 4, px: 4, fontFamily: 'var(--font-family, inherit)', height: '100%', overflowY: 'auto', bgcolor: 'var(--m3-surface, #ffffff)', color: 'var(--m3-on-surface, #334155)' }}>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'inherit' }}>Cost Management Dashboard</Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                    <EnvironmentSelectorWidget environments={environments} envFilter={envFilter} setEnvFilter={setEnvFilter} mode={mode} />
                    <DomainSelectorWidget domains={allDomains} selectedDomains={selectedDomains} onChange={setSelectedDomains} formatDomain={formatDomain} />
                    {allTypes.length > 1 && (
                        <DataProductTypeSelectorWidget types={allTypes} selectedTypes={selectedTypes} onChange={setSelectedTypes} />
                    )}
                    <DataProductSearchWidget filterText={searchText} onFilterChange={setSearchText} />
                </Box>
            </Box>

            <Alert severity="warning" sx={{ mb: 3 }}>
                This page illustrates how custom components can be used
            </Alert>

            {/* Top Row: Total Cost */}
            <Paper sx={{ p: 3, mb: 4, textAlign: 'center', borderRadius: 2, bgcolor: 'background.paper', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" color="text.secondary">Total Cost</Typography>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                    ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Typography>
            </Paper>

            {/* Second Row: Pie Charts */}
            <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
                <Paper sx={{ flex: 1, p: 2, borderRadius: 2, minWidth: '300px' }}>
                    <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>Cost per Domain</Typography>
                    <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={costByDomain} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {costByDomain.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>
                <Paper sx={{ flex: 1, p: 2, borderRadius: 2, minWidth: '300px' }}>
                    <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>Cost per Data Product</Typography>
                    <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={costByProduct} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {costByProduct.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>
            </Box>

            {/* Third Row: Table */}
            <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
                <TableContainer>
                    <Table stickyHeader>
                        <TableHead sx={{ '& .MuiTableCell-root': { bgcolor: 'var(--m3-surface-variant, #f1f5f9)', fontWeight: 'bold' } }}>
                            <TableRow>
                                <TableCell>
                                    <TableSortLabel active={sortConfig.key === 'name'} direction={sortConfig.key === 'name' ? sortConfig.direction : 'asc'} onClick={() => handleSort('name')}>
                                        Data Product Name
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel active={sortConfig.key === 'type'} direction={sortConfig.key === 'type' ? sortConfig.direction : 'asc'} onClick={() => handleSort('type')}>
                                        Data Product Type
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel active={sortConfig.key === 'cost'} direction={sortConfig.key === 'cost' ? sortConfig.direction : 'asc'} onClick={() => handleSort('cost')}>
                                        Cost
                                    </TableSortLabel>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedTableData.map((row, i) => (
                                <TableRow key={i} hover>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>{formatType(row.type)}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>
                                        ${row.cost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {paginatedTableData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No data available for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={tableData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            </Paper>

        </Box>
    );
}
