/*
 * Copyright 2026 Joao Vicente
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Radio,
    RadioGroup,
    FormControlLabel,
    Typography,
    Chip,
    CircularProgress,
    OutlinedInput,
    Checkbox,
    ListItemText
} from '@mui/material';
import YAML from 'yaml';
import { useThemeContext } from '../../../ThemeContext';
import DomainSelector from '../../../DomainSelector';
import GlobalFilter from '../../../GlobalFilter';

const BASE_URL = import.meta.env.BASE_URL;

const normalizePath = (path) => {
    if (!path) return path;

    if (import.meta.env.DEV && path.startsWith('http://localhost:8000/dmesh')) {
        const relativePath = path.replace('http://localhost:8000/', '');
        return `${BASE_URL}${relativePath}`;
    }

    if (path.startsWith('http')) return path;

    if (path.startsWith(BASE_URL)) return path;

    if (path.startsWith('/')) {
        return `${BASE_URL}${path.slice(1)}`;
    }
    return path;
};

const formatType = (type) => {
    if (!type) return '';
    return type
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
};

const TypeSelector = ({ types, selectedTypes, onChange, configTiers }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }, []);

    const toggleType = (type) => {
        if (selectedTypes.includes(type)) {
            onChange(selectedTypes.filter(t => t !== type));
        } else {
            onChange([...selectedTypes, type]);
        }
    };

    const labelText = selectedTypes.length === 0
        ? 'All Types'
        : selectedTypes.length === types.length
            ? 'All Types'
            : selectedTypes.length === 1
                ? formatType(selectedTypes[0])
                : `${selectedTypes.length} Types`;

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <div
                className="input-container-style"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    minWidth: '150px',
                    userSelect: 'none'
                }}
            >
                <span style={{ fontSize: '13px', color: 'var(--m3-on-surface, #334155)', flex: 1 }}>{labelText}</span>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    zIndex: 20,
                    backgroundColor: 'var(--input-bg, #ffffff)',
                    padding: '10px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid var(--m3-outline-variant, #e2e8f0)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    minWidth: '200px',
                    maxHeight: '60vh',
                    overflowY: 'auto'
                }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--m3-outline, #64748b)', marginBottom: '4px' }}>Select Types</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {types.map(type => (
                            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', padding: '2px 0', color: 'var(--m3-on-surface, #334155)' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedTypes.includes(type)}
                                    onChange={() => toggleType(type)}
                                    style={{ cursor: 'pointer' }}
                                />
                                {formatType(type)}
                            </label>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '5px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--m3-surface-variant, #f1f5f9)' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => onChange(types)}
                            style={{ flex: 1, fontSize: '11px', padding: '4px 8px' }}
                        >
                            Select All
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => onChange([])}
                            style={{ flex: 1, fontSize: '11px', padding: '4px 8px' }}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

function DataProductsTable() {
    const { mode } = useThemeContext();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [productsList, setProductsList] = useState([]);

    // Filter states
    const [envFilter, setEnvFilter] = useState('');
    const [selectedDomains, setSelectedDomains] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [searchText, setSearchText] = useState('');

    // Available values for filters
    const [allDomains, setAllDomains] = useState([]);
    const [allTypes, setAllTypes] = useState([]);
    const [environments, setEnvironments] = useState(['Dev', 'QA', 'Prod']);
    const [configTiers, setConfigTiers] = useState({});
    const [domainNameCustomisation, setDomainNameCustomisation] = useState({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Fetch Config
                const configRes = await fetch(normalizePath(`/config/base/config.yaml?t=${Date.now()}`));
                if (!configRes.ok) throw new Error('Failed to load config/base/config.yaml');
                const configText = await configRes.text();
                let configData = YAML.parse(configText) || {};

                // Load customConfig if exists
                try {
                    const customRes = await fetch(normalizePath(`/config/custom/config.yaml?t=${Date.now()}`));
                    if (customRes.ok) {
                        const customText = await customRes.text();
                        const customData = YAML.parse(customText);
                        if (customData && typeof customData === 'object') {
                            configData = { ...configData, ...customData };
                        }
                    }
                } catch (e) {
                    console.log('No custom config found or error parsing it', e);
                }

                setConfigTiers(configData.tiers || {});
                setDomainNameCustomisation(configData.domainNameCustomisation || {});

                const envList = configData['multi-environment'] || ['Dev', 'QA', 'Prod'];
                setEnvironments(envList);
                const defaultEnv = configData['default-environment'] || envList[envList.length - 1];
                setEnvFilter(defaultEnv);

                // 2. Fetch Data Mesh Operations Data
                const dataMeshOperationsUrl = normalizePath(configData.defaultDataMeshOperationalDataUrl);
                const dataMeshOperationsRes = await fetch(dataMeshOperationsUrl);
                if (!dataMeshOperationsRes.ok) throw new Error(`Failed to load dataMeshOperations from ${dataMeshOperationsUrl}`);
                const dataMeshOperationsText = await dataMeshOperationsRes.text();
                const dataMeshOperationsData = YAML.parse(dataMeshOperationsText);

                if (!dataMeshOperationsData) {
                    setProductsList([]);
                    setIsLoading(false);
                    return;
                }

                // 3. Process Products
                const envsData = Array.isArray(dataMeshOperationsData) ? dataMeshOperationsData : [dataMeshOperationsData];

                // Collect all products and track their presence in environments
                const productsMap = new Map();
                const domainsSet = new Set();
                const typesSet = new Set();

                envsData.forEach(envObj => {
                    const envName = envObj.env;
                    const items = envObj.data || [];

                    items.forEach(item => {
                        if (item.kind === 'DataProduct') {
                            const id = item.id;
                            const domain = item.domain || 'unknown';
                            const name = item.name || '';
                            const purpose = item.description?.purpose || '';
                            const type = item.customProperties?.find(p => p.property === 'dataProductTier')?.value || 'dataSource';

                            if (type !== 'dataSource') {
                                return;
                            }

                            domainsSet.add(domain);
                            typesSet.add(type);

                            const key = `${domain}::${name}`;
                            if (!productsMap.has(key)) {
                                productsMap.set(key, {
                                    id,
                                    domain,
                                    name,
                                    purpose,
                                    type,
                                    envs: new Set()
                                });
                            }
                            productsMap.get(key).envs.add(envName);
                        }
                    });
                });

                setAllDomains(Array.from(domainsSet).sort());
                setAllTypes(Array.from(typesSet).sort());

                // Calculate highest environment for each product
                const processedProducts = Array.from(productsMap.values()).map(prod => {
                    let highestEnv = 'None';
                    for (let i = envList.length - 1; i >= 0; i--) {
                        const envName = envList[i];
                        const match = Array.from(prod.envs).find(e => String(e).toLowerCase() === String(envName).toLowerCase());
                        if (match) {
                            highestEnv = envName;
                            break;
                        }
                    }
                    return {
                        ...prod,
                        highestEnv
                    };
                });

                setProductsList(processedProducts);
                setIsLoading(false);
            } catch (err) {
                console.error(err);
                setError(err.message);
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // Filter Logic
    const filteredProducts = useMemo(() => {
        return productsList.filter(prod => {
            // 1. Environment Filter (Radio box)
            if (envFilter !== 'All') {
                const hasEnv = Array.from(prod.envs).some(e => String(e).toLowerCase() === String(envFilter).toLowerCase());
                if (!hasEnv) return false;
            }

            // 2. Domain Filter
            if (selectedDomains.length > 0 && !selectedDomains.includes(prod.domain)) {
                return false;
            }

            // 3. Type Filter
            if (selectedTypes.length > 0 && !selectedTypes.includes(prod.type)) {
                return false;
            }

            // 4. Search Filter (by Name or ID or Purpose)
            if (searchText) {
                const query = searchText.toLowerCase();
                const matchesName = prod.name.toLowerCase().includes(query);
                const matchesId = prod.id.toLowerCase().includes(query);
                const matchesPurpose = prod.purpose.toLowerCase().includes(query);
                const matchesDomain = prod.domain.toLowerCase().includes(query);
                if (!matchesName && !matchesId && !matchesPurpose && !matchesDomain) {
                    return false;
                }
            }

            return true;
        });
    }, [productsList, envFilter, selectedDomains, selectedTypes, searchText]);

    // Reset page to 0 when filters change
    useEffect(() => {
        setPage(0);
    }, [envFilter, selectedDomains, selectedTypes, searchText]);

    const sortedProducts = useMemo(() => {
        let sortableItems = [...filteredProducts];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = String(a[sortConfig.key]).toLowerCase();
                const bValue = String(b[sortConfig.key]).toLowerCase();
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredProducts, sortConfig]);

    const paginatedProducts = useMemo(() => {
        const start = page * rowsPerPage;
        return sortedProducts.slice(start, start + rowsPerPage);
    }, [sortedProducts, page, rowsPerPage]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Color mapper for environments
    const getEnvColor = (env) => {
        switch (String(env).toUpperCase()) {
            case 'PROD': return 'success';
            case 'QA': return 'warning';
            case 'DEV': return 'info';
            default: return 'default';
        }
    };

    const formatDomain = (d) => domainNameCustomisation[d] || d;

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4, color: 'error.main' }}>
                <Typography variant="h6">Error Loading Data Products</Typography>
                <Typography variant="body2">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ pt: 1.5, pb: 4, px: 4, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, bgcolor: 'var(--m3-surface, #ffffff)', color: 'var(--m3-on-surface, #334155)' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'inherit' }}>
                Data Sources
            </Typography>

            {/* Filter Panel */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', mb: 1 }}>
                {/* Environment Selector */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
                    px: 2,
                    py: '2px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    height: '32px'
                }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', mr: 0.5 }}>
                        Environment:
                    </Typography>
                    <RadioGroup
                        row
                        value={envFilter}
                        onChange={(e) => setEnvFilter(e.target.value)}
                        sx={{ gap: 0.5, flexWrap: 'nowrap' }}
                    >
                        {environments.map((env) => (
                            <FormControlLabel
                                key={env}
                                value={env}
                                control={
                                    <Radio
                                        size="small"
                                        icon={
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="12" cy="12" r="8" stroke="var(--radio-border, #64748b)" strokeWidth="2" />
                                            </svg>
                                        }
                                        checkedIcon={
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="12" cy="12" r="8" stroke="var(--radio-selected-border, #111111)" strokeWidth="2.5" />
                                                <circle cx="12" cy="12" r="4" fill="var(--radio-selected-dot, #111111)" />
                                            </svg>
                                        }
                                        sx={{
                                            padding: '2px',
                                            '&.Mui-focusVisible': {
                                                outline: '2px solid #ff5500',
                                                outlineOffset: '2px'
                                            }
                                        }}
                                    />
                                }
                                label={env}
                                sx={{
                                    margin: 0,
                                    '& .MuiFormControlLabel-label': {
                                        fontSize: '0.75rem',
                                        color: 'text.primary',
                                        pr: 0.5
                                    }
                                }}
                            />
                        ))}
                    </RadioGroup>
                </Box>

                {/* Domain Selector */}
                <DomainSelector
                    domains={allDomains}
                    selectedDomains={selectedDomains}
                    onChange={setSelectedDomains}
                    formatDomain={formatDomain}
                />

                {/* Type Selector 
                <TypeSelector
                    types={allTypes}
                    selectedTypes={selectedTypes}
                    onChange={setSelectedTypes}
                    configTiers={configTiers}
                />
                */}

                {/* Search / Global Filter */}
                <GlobalFilter
                    filterText={searchText}
                    onFilterChange={setSearchText}
                />
            </Box>

            {/* Table Container */}
            <TableContainer component={Paper} sx={{ bgcolor: 'var(--m3-surface, #ffffff)', border: '1px solid var(--m3-outline-variant, #e2e8f0)', backgroundImage: 'none', color: 'inherit', boxShadow: 'none', borderRadius: '8px', overflow: 'hidden' }}>
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('domain')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    Domain
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', opacity: sortConfig.key === 'domain' ? 1 : 0.4 }}>
                                        {sortConfig.key === 'domain' && sortConfig.direction === 'desc' ? (
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        ) : sortConfig.key === 'domain' && sortConfig.direction === 'asc' ? (
                                            <polyline points="18 15 12 9 6 15"></polyline>
                                        ) : (
                                            <>
                                                <polyline points="7 10 12 5 17 10"></polyline>
                                                <polyline points="7 14 12 19 17 14"></polyline>
                                            </>
                                        )}
                                    </svg>
                                </div>
                            </th>
                            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    Data Source Name
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', opacity: sortConfig.key === 'name' ? 1 : 0.4 }}>
                                        {sortConfig.key === 'name' && sortConfig.direction === 'desc' ? (
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        ) : sortConfig.key === 'name' && sortConfig.direction === 'asc' ? (
                                            <polyline points="18 15 12 9 6 15"></polyline>
                                        ) : (
                                            <>
                                                <polyline points="7 10 12 5 17 10"></polyline>
                                                <polyline points="7 14 12 19 17 14"></polyline>
                                            </>
                                        )}
                                    </svg>
                                </div>
                            </th>
                            <th>Purpose</th>
                            <th onClick={() => handleSort('type')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    Type
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', opacity: sortConfig.key === 'type' ? 1 : 0.4 }}>
                                        {sortConfig.key === 'type' && sortConfig.direction === 'desc' ? (
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        ) : sortConfig.key === 'type' && sortConfig.direction === 'asc' ? (
                                            <polyline points="18 15 12 9 6 15"></polyline>
                                        ) : (
                                            <>
                                                <polyline points="7 10 12 5 17 10"></polyline>
                                                <polyline points="7 14 12 19 17 14"></polyline>
                                            </>
                                        )}
                                    </svg>
                                </div>
                            </th>
                            <th>Stage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedProducts.map((prod) => (
                            <tr key={prod.id}>
                                <td>{formatDomain(prod.domain)}</td>
                                <td style={{ fontWeight: '500' }}>{prod.name}</td>
                                <td style={{ maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                    {prod.purpose}
                                </td>
                                <td>
                                    {formatType(prod.type)}
                                </td>
                                <td>
                                    <span className="custom-chip" style={{ fontSize: '11px', padding: '2px 8px', fontWeight: 'bold' }}>
                                        {prod.highestEnv}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {sortedProducts.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--m3-on-surface-variant, #6b7280)' }}>
                                    No data sources match the selected filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination Footer */}
                {sortedProducts.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderTop: '1px solid var(--m3-outline-variant, #e2e8f0)',
                        fontSize: '13px',
                        color: 'var(--m3-on-surface, #334155)',
                        backgroundColor: 'var(--table-row-bg, #ffffff)'
                    }}>
                        <div>
                            {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, sortedProducts.length)} of {sortedProducts.length}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>Rows per page</span>
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
                                    style={{
                                        padding: '4px 24px 4px 8px',
                                        borderRadius: '4px',
                                        border: '1px solid var(--m3-outline-variant, #e2e8f0)',
                                        backgroundColor: 'var(--input-bg, #ffffff)',
                                        color: 'inherit',
                                        fontSize: '13px',
                                        appearance: 'none',
                                        cursor: 'pointer',
                                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 4px center',
                                        backgroundSize: '16px'
                                    }}
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    onClick={() => setPage(0)}
                                    disabled={page === 0}
                                    style={{ background: 'none', border: 'none', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.3 : 1, color: 'inherit', display: 'flex', alignItems: 'center' }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
                                </button>
                                <button
                                    onClick={() => setPage(Math.max(0, page - 1))}
                                    disabled={page === 0}
                                    style={{ background: 'none', border: 'none', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.3 : 1, color: 'inherit', display: 'flex', alignItems: 'center' }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>
                                <button
                                    onClick={() => setPage(Math.min(Math.ceil(sortedProducts.length / rowsPerPage) - 1, page + 1))}
                                    disabled={page >= Math.ceil(sortedProducts.length / rowsPerPage) - 1}
                                    style={{ background: 'none', border: 'none', cursor: page >= Math.ceil(sortedProducts.length / rowsPerPage) - 1 ? 'default' : 'pointer', opacity: page >= Math.ceil(sortedProducts.length / rowsPerPage) - 1 ? 0.3 : 1, color: 'inherit', display: 'flex', alignItems: 'center' }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                                <button
                                    onClick={() => setPage(Math.ceil(sortedProducts.length / rowsPerPage) - 1)}
                                    disabled={page >= Math.ceil(sortedProducts.length / rowsPerPage) - 1}
                                    style={{ background: 'none', border: 'none', cursor: page >= Math.ceil(sortedProducts.length / rowsPerPage) - 1 ? 'default' : 'pointer', opacity: page >= Math.ceil(sortedProducts.length / rowsPerPage) - 1 ? 0.3 : 1, color: 'inherit', display: 'flex', alignItems: 'center' }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </TableContainer>
        </Box>
    );
}

export default DataProductsTable;
