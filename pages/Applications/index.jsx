import React from 'react';
import DataProductTabular from '../../../components/DataProductTabular';

export default function Page() {
    const tableDescriptor = [
        { columnName: "Domain", odpsDescriptor: "domain", textMapper: (val, ctx) => ctx.formatDomain(val) },
        { columnName: "Application", odpsDescriptor: "_customProperty(\"dataProductBusinessName\")", sidePanelLink: true },
        { columnName: "Stage", odpsDescriptor: "_highestEnv", displayFormat: "chip" }
    ];

    const sidePanelDescriptor = [
        { name: "ID", odpsDescriptor: "id" },
        { name: "DOMAIN TECHNICAL NAME", odpsDescriptor: "domain" },
        { name: "DATA SOURCE TECHNICAL NAME", odpsDescriptor: "name" },
        { name: "TECHNOLOGY", odpsDescriptor: "_customProperty(\"technology\")" }
    ];

    return <DataProductTabular
        title="Applications"
        tierFilter={"application"}
        tableDescriptor={tableDescriptor}
        sidePanelDescriptor={sidePanelDescriptor}
    />;
}
