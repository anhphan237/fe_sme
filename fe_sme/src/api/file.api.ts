import { ENV_CONFIG } from '@/constants';

import { RequestConfig, request } from './request';

export const apiUploadFile = (data: any, path: string, config?: RequestConfig & { override?: boolean }) =>
    request('post', `/File/${path}${config?.override ? '?override=true' : ''}`, data, config);

export const apiGetFileInfo = (url: string) => request('get', `${ENV_CONFIG.API}/Storage/${url}?getInfo=true`);

export const apiExport = (data: { path: string } & Record<string, any>, config?: RequestConfig) => {
    const { path, ...bodyData } = data;
    return request('post', `/Export/${path}`, bodyData, config);
};

export const apiGetFileFromPath = (path: string, config?: RequestConfig) => {
    return request('get', `/File/${path}`, {}, { ...config, responseType: 'blob', loading: false });
};

export const apiGetFileTemplate = (path: string, config?: RequestConfig) => {
    return request('post', `/Product/Template/${path}`, {}, { ...config, responseType: 'blob', loading: false });
};

type FileTemplateType = 'Products' | 'ProductGroup' | 'ProductType';
type ResultFileTemplate = { data: any; fileName: string };
export const apiGetFileTemplateByType = async (type: FileTemplateType, config?: RequestConfig): Promise<ResultFileTemplate> => {
    let path = '';
    let fileName = '';
    switch (type) {
        case 'Products':
            path = 'ImportDirectory/Products/product-template.xlsx';
            fileName = 'product-template.xlsx';
            break;
        case 'ProductGroup':
            path = 'ImportDirectory/Products/product-group-template.xlsx';
            fileName = 'product-group-template.xlsx';
            break;
        case 'ProductType':
            path = 'ImportDirectory/Products/product-type-template.xlsx';
            fileName = 'product-type-template.xlsx';
            break;
        default:
            break;
    }
    return {
        data: await apiGetFileTemplate(path, config),
        fileName,
    };
};
