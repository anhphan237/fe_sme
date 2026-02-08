import axios from 'axios';

export const apiGetAllProvinces = () => axios.get('https://vn-public-apis.fpo.vn/provinces/getAll?limit=-1');

export const apiGetAllDistrictsInProvince = (provinceId: string) =>
    axios.get(`https://vn-public-apis.fpo.vn/districts/getByProvince?provinceCode=${provinceId}&limit=-1`);

export const apiGetAllWardsInDistrict = (districtId: string) =>
    axios.get(`https://vn-public-apis.fpo.vn/wards/getByDistrict?districtCode=${districtId}&limit=-1`);
