let currentRequest = null; // Keep track of the current request

self.onmessage = async function (e) {
    const { file, uploadUrl, token, type, supplierId, productGroupId, productTypeId, mode } = e.data;

    if (type === 'cancel') {
        if (currentRequest) {
            currentRequest.abort();
            self.postMessage({ type: 'cancelled', message: `Bỏ qua kết quả ${file.name}`, originFile: file });
        }
        return;
    }

    const formData = new FormData();
    formData.append('body', file);

    if (mode === 'productType') {
        formData.append('type', type);
        formData.append('productGroupId', productGroupId);
    } else if (mode === 'productGroup') {
        formData.append('type', type);
    } else {
        // Default: product mode
        formData.append('productTypeId', productTypeId);
        formData.append('supplierId', supplierId);
    }
    try {
        const xhr = new XMLHttpRequest();
        currentRequest = xhr; // Store the current request

        // Track upload progress
        xhr.upload.onprogress = function (event) {
            if (event.lengthComputable) {
                const percentCompleted = Math.round((event.loaded * 100) / event.total);
                self.postMessage({ type: 'progress', percent: percentCompleted, originFile: file });
            }
        };

        // Handle successful upload
        xhr.onload = function () {
            try {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const response = JSON.parse(xhr.responseText);
                    const { succeeded, message, errors } = response;
                    if (!succeeded) {
                        self.postMessage({ type: 'error', message, errors, originFile: file });
                        return;
                    }
                    self.postMessage({ type: 'success', message: `Tải lên ${file.name} thành công`, data: response, originFile: file });
                } else {
                    self.postMessage({ type: 'error', message: `Upload failed with status: ${xhr.status}`, originFile: file });
                }
            } catch (error) {
                self.postMessage({ type: 'error', message: `Lỗi khi phân tích phản hồi từ web worker`, originFile: file });
            }
        };

        // Handle errors
        xhr.onerror = function () {
            console.log(xhr.responseText, 'check err');
            self.postMessage({ type: 'error', message: 'Có lỗi xảy ra trong quá trình tải lên', originFile: file });
        };

        // Open and send the request
        xhr.open('POST', uploadUrl, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
    } catch (error) {
        // Notify error
        self.postMessage({ type: 'error', message: `Tải lên ${file.name} không thành công`, error, originFile: file });
    } finally {
        currentRequest = null; // Clear the current request after completion
    }
};
