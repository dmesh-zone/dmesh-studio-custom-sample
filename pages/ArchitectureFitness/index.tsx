import React from 'react';
import ArchitectureFitnessDashboard, { Rule, FitnessCategory } from '../../../components/base/ArchitectureFitnessDashboard';
import { dataProductRules, dataContractRules, categories, extendRules, RuleExtension } from '../../base/ArchitectureFitness';

// Extend DataProduct rules
const customDataProductRules = extendRules(
    dataProductRules,
    [
        {
            // New rule (id does not exist in base class)
            id: 'dataProductBusinessName-customProperty-exists',
            label: "All Data Products have a 'dataProductBusinessName' custom property",
            severity: 'warning',
            evaluate: (dp: any) => {
                const hasBusinessName = dp.customProperties?.some((p: any) => p.property === 'dataProductBusinessName' && p.value);
                if (!hasBusinessName) return { passed: false, reason: "Missing 'dataProductBusinessName' custom property" };
                return { passed: true };
            }
        },
        {
            // Suppressed rule
            id: 'name-convention-valid',
            suppressed: true
        }
    ]
);

// Extend DataContract rules
const customDataContractRules = extendRules(
    dataContractRules,
    [
        {
            // Overriding rule (id exists in base class)
            id: 'servers-valid',
            runBaseRulePrior: true, // If set to false will only run child rule
            label: "All Data Contracts have valid 'servers' property (must be databricks)",
            severity: 'error',
            evaluate: (dc: any) => {
                // The base validation ran successfully prior to this step!
                // Just run custom validation:
                for (let i = 0; i < dc.servers.length; i++) {
                    if (dc.servers[i].type !== 'databricks') {
                        return { passed: false, reason: `Server at index ${i} has type '${dc.servers[i].type}' instead of 'databricks'` };
                    }
                }
                return { passed: true };
            }
        },
        {
            // New rule (id does not exist in base class)
            id: 'slaProperties-exists',
            label: "All Data Contracts have an 'slaProperties' array",
            severity: 'warning',
            evaluate: (dc: any) => {
                if (!dc.slaProperties || !Array.isArray(dc.slaProperties) || dc.slaProperties.length === 0) {
                    return { passed: false, reason: "Missing or empty 'slaProperties' array" };
                }
                return { passed: true };
            }
        }
    ]
);

// Update the categories with the custom rules
const customCategories: FitnessCategory[] = categories.map(cat => {
    if (cat.id === 'data-product') {
        return { ...cat, rules: customDataProductRules };
    }
    if (cat.id === 'data-contract') {
        return { ...cat, rules: customDataContractRules };
    }
    return cat;
});

export default function ArchitectureFitness() {
    return <ArchitectureFitnessDashboard categories={customCategories} />;
}
