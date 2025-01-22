import React from 'react';

const ExportButton = () => {
    const handleExportClick = () => {
        const exportOptions = [
            { label: 'JPEG', value: 'image/jpeg' },
            { label: 'PDF', value: 'application/pdf' },
            { label: 'SVG', value: 'image/svg+xml' },
        ];

        const popup = createPopup(exportOptions);
        popup.addEventListener('select', (e) => {
            const selectedFormat = e.detail.value;
            exportContent(selectedFormat);
        });
    };

    return (
        <button onClick={handleExportClick}>Export</button>
    );
};

export default ExportButton;

