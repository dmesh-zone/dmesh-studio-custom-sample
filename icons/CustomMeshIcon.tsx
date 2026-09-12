import React from 'react';
import { SvgIcon } from '@mui/material';

// This custom icon is mapped in config.yaml under the navigation sections.
// Note: It is referenced simply as `icon: "CustomMesh"` in the config. 
// The custom icon resolver automatically appends the "Icon" suffix to match this file name.
export default function CustomMeshIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </SvgIcon>
  );
}
