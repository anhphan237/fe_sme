// /Users/david/workplace/EXPS/erp-management/src/Host/Ntech.Host.BackOffice/client-app/src/workers/exportWorker.js

self.onmessage = async function (event) {
    const { token, searchValue, range, filters, url } = event.data;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    const body = JSON.stringify({
        searchValue: searchValue || "",
        range: range,
        filters: filters || []
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        self.postMessage({ success: true, data });
    } catch (error) {
        self.postMessage({ success: false, error: error.message });
    }
};