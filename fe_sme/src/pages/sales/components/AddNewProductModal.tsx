import { apiCalculateProductSellingPrice } from '@/api/quotation';
import BaseModal from '@/core/components/Modal/BaseModal';
import { useLocale } from '@/i18n';
import { GiftOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Badge, Tabs } from 'antd';
import React, { forwardRef, useImperativeHandle, useState } from 'react';

import ProductCategory from '@/pages/Product';

import BaseButton from '@/components/button';
import { notify } from '@/components/toast-message';

import usePromiseHolder from '@/hooks/usePromiseHolder';

import { QUOTATION_CALCULATION_TYPE } from '@/constants/sales/quotation';

import { IProductData } from '@/interface/product';

interface Results {
    code: number;
    data?: any[];
    message?: string;
}
interface AddNewProductModalProps {
    useVerifyPrice?: boolean;
    showInventory?: boolean;
    showPromotionalTab?: boolean;
    showLastImportPrice?: boolean;
}

export type DataItem = Required<Pick<IProductData, 'id' | 'name'>> &
    Partial<Omit<IProductData, 'id' | 'name' | 'productType' | 'ProductGroup'>> & {
        productType?: Partial<IProductData['productType']>;
        weightTheoretical?: number; // Trọng lượng lý thuyết
        weightActual?: number; // Trọng lượng thực tế
        quantity?: number; // Số lượng
        sellingPrice?: number; // Giá bán
        quantityInStock?: number;
        calculateBy?: QUOTATION_CALCULATION_TYPE;
        supplierId?: string; // Mã nhà cung cấp
        supplierLocation?: string; // Vị trí nhà cung cấp
        supplierPrice?: number; // Giá nhà cung cấp
        lastImportPrice?: number; // Giá nhập lần cuối
        weight?: number; // Trọng lượng
        _isPromotional?: boolean; // Đánh dấu hàng khuyến mãi
        _promotionalPrice?: number; // Giá khuyến mãi
    };
export interface AddNewProductModalRef {
    open: (defaultSelected?: DataItem[]) => Promise<Results>;
}
const AddNewProductModal = (
    { useVerifyPrice = false, showInventory = true, showPromotionalTab = true, showLastImportPrice = false }: AddNewProductModalProps,
    ref: React.Ref<AddNewProductModalRef>,
) => {
    const { t } = useLocale();
    const [selectedRows, setSelectedRows] = useState<DataItem[]>([]); // Sản phẩm mua bình thường
    const [promotionalItems, setPromotionalItems] = useState<Array<DataItem & { _uniqueId: string }>>([]); // Hàng khuyến mãi
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'normal' | 'promotional'>('normal');
    const { execute, resolve, reject } = usePromiseHolder<Results>({});
    const [loading, setLoading] = useState(false);

    const handleOpen = async (defaultSelected?: DataItem[]) => {
        if (defaultSelected) {
            if (showLastImportPrice) {
                defaultSelected = defaultSelected.map(item => ({
                    ...item,
                    lastImportPrice: item.sellingPrice || item.lastImportPrice || 0,
                }));
            }
            const detectPromotionalItems = (items: DataItem[]) => {
                return items.map(item => {
                    const price = showLastImportPrice ? (item.lastImportPrice ?? 0) : (item.sellingPrice ?? (item as any).price ?? 0);
                    if (price === 0) {
                        return { ...item, _isPromotional: true };
                    }
                    return { ...item, _isPromotional: false };
                });
            };
            const detectedItems = detectPromotionalItems(defaultSelected);
            const normalProducts = detectedItems.filter(item => !item._isPromotional);
            const promoProducts = detectedItems
                .filter(item => item._isPromotional)
                .map(item => ({ ...item, _uniqueId: `${item.id}-${Date.now()}-${Math.random()}` }));

            setSelectedRows(normalProducts);
            setPromotionalItems(promoProducts);
        }
        setActiveTab('normal');
        setOpen(true);
        return execute();
    };

    useImperativeHandle(ref, () => ({
        open: handleOpen,
    }));

    const rowSelection = {
        selectedRowKeys: selectedRows.map(item => item.id),
        onSelectAll: (selected: boolean, newSelected: DataItem[], changeRows: DataItem[]) => {
            if (selected) {
                const newSelectedRows = changeRows.filter(({ id }) => !selectedRows.find(x => x.id === id));
                setSelectedRows(prev => [
                    ...prev,
                    ...newSelectedRows.map(item => ({
                        ...item,
                        quantity: item.quantity ?? 1,
                        calculateBy: item.calculateBy ?? QUOTATION_CALCULATION_TYPE.BY_ITEM,
                    })),
                ]);
            } else {
                setSelectedRows(prev => prev.filter((item: any) => !changeRows.find((row: any) => row.id === item.id)));
            }
        },
        onSelect: (record: any) => {
            const selected = selectedRows.find(item => item.id === record.id);
            if (selected) {
                setSelectedRows(prev => prev.filter(item => item.id !== record.id));
            } else {
                setSelectedRows(prev => [
                    ...prev,
                    {
                        ...record,
                        quantity: record.quantity ?? 1,
                        calculateBy: record.calculateBy ?? QUOTATION_CALCULATION_TYPE.BY_ITEM,
                    } as any,
                ]);
            }
        },
        getCheckboxProps: (record: any) => ({
            name: record.name,
        }),
    };

    const promotionalRowSelection = {
        selectedRowKeys: [...new Set(promotionalItems.map(item => item.id))],
        onSelectAll: (selected: boolean, newSelected: DataItem[], changeRows: DataItem[]) => {
            if (selected) {
                const newPromoItems = changeRows.map(item => ({
                    ...item,
                    _isPromotional: true,
                    _promotionalPrice: 0,
                    _uniqueId: `${item.id}-${Date.now()}-${Math.random()}`,
                }));
                setPromotionalItems(prev => [...prev, ...newPromoItems]);
            } else {
                const idsToRemove = changeRows.map(row => row.id);
                setPromotionalItems(prev => prev.filter(item => !idsToRemove.includes(item.id)));
            }
        },
        onSelect: (record: any) => {
            const hasThisProduct = promotionalItems.some(item => item.id === record.id);
            if (hasThisProduct) {
                setPromotionalItems(prev => prev.filter(item => item.id !== record.id));
            } else {
                const newPromoItem = {
                    ...record,
                    _isPromotional: true,
                    _promotionalPrice: 0,
                    _uniqueId: `${record.id}-${Date.now()}-${Math.random()}`,
                };
                setPromotionalItems(prev => [...prev, newPromoItem]);
            }
        },
        getCheckboxProps: (record: any) => ({
            name: record.name,
        }),
    };

    const saveWithVerifyPrice = async () => {
        setLoading(true);
        try {
            const sellingPriceInfo = await apiCalculateProductSellingPrice({
                products: selectedRows.map(item => ({ productId: item.id, quantity: item.quantity ?? 1 })),
            });
            if (!sellingPriceInfo?.detail) {
                throw new Error('error');
            }
            const details = sellingPriceInfo?.detail ?? [];
            const newSelectedRows = selectedRows.map(item => {
                const matchedDetail = details.find(d => d.productId === item.id);
                if (!matchedDetail) return item;
                const calculateBy = matchedDetail.calculateBy;
                const data = {
                    ...item,
                    amount: item?.amount ?? matchedDetail.amount ?? 0,
                    weightTheoretical: matchedDetail?.barem?.[0]?.weight || 0,
                    weightActual: matchedDetail?.actual?.[0]?.weight || 0,
                    quantity: item.quantity ?? 1,
                    calculateBy: matchedDetail.calculateBy,
                };
                if (calculateBy === QUOTATION_CALCULATION_TYPE.BY_ITEM) {
                    data.sellingPrice = matchedDetail?.item?.[0]?.sellingPrice || 0;
                } else if (calculateBy === QUOTATION_CALCULATION_TYPE.BY_ACTUAL_WEIGHT) {
                    data.sellingPrice = matchedDetail?.actual?.[0]?.sellingPrice || 0;
                } else if (calculateBy === QUOTATION_CALCULATION_TYPE.BY_THEORETICAL_WEIGHT) {
                    data.sellingPrice = matchedDetail?.barem?.[0]?.sellingPrice || 0;
                }
                return data as DataItem;
            });
            setOpen(false);
            setSelectedRows([]);
            resolve({ code: 200, data: newSelectedRows });
        } catch (error) {
            notify.error('global.message.error_occurs');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveWithoutVerify = () => {
        const normalProducts = selectedRows.map(item => {
            const quantity = item?.quantity ?? 1;
            const weightTheoretical = (item?.inputConvert || 0) * (item?.outputConvert || 0) * quantity;

            const priceValue = showLastImportPrice ? (item.lastImportPrice ?? 0) : item.price || item.sellingPrice || 0;
            return {
                ...item,
                weightTheoretical: weightTheoretical,
                weightActual: item?.weightActual ?? weightTheoretical,
                quantity: quantity,
                sellingPrice: priceValue,
            };
        });

        const allProducts = [...normalProducts, ...promotionalItems];

        setOpen(false);
        setSelectedRows([]);
        setPromotionalItems([]);
        resolve({ code: 200, data: allProducts });
    };

    const handleSave = async () => {
        return useVerifyPrice ? saveWithVerifyPrice() : handleSaveWithoutVerify();
    };

    const onClose = () => {
        setOpen(false);
        setSelectedRows([]);
        setPromotionalItems([]);
        reject({ code: -1, message: 'cancel' });
    };

    const handleRefetchData = (data: any[]) => {
        setSelectedRows(prev => {
            const newSelectedRows = [...prev];
            newSelectedRows.forEach(item => {
                const matched = data?.find(d => d.id === item.id);
                if (!matched) return;
                item.nameView = matched.nameView;
                item.productType = matched.productType;
                item.unit = matched.unit;
                item.outputConvert = matched.outputConvert;
            });
            return newSelectedRows;
        });
    };

    return (
        <BaseModal
            styles={{
                wrapper: { width: '100%', maxHeight: 'calc(100vh_-_228px)' },
                content: { padding: 16, width: '100%', maxHeight: '100%' },
            }}
            width="calc(100vw - 128px)"
            open={open}
            title={t('order.list.choose_product')}
            onCancel={onClose}
            footer={false}
        >
            <Tabs
                activeKey={activeTab}
                onChange={key => setActiveTab(key as 'normal' | 'promotional')}
                items={[
                    {
                        key: 'normal',
                        label: (
                            <span>
                                <ShoppingCartOutlined /> {t('sales.normal_products')}
                                <Badge count={new Set(selectedRows.map(item => item.id)).size} className="ml-2" showZero={true} />
                            </span>
                        ),
                        children: (
                            <ProductCategory
                                onRefetchData={handleRefetchData}
                                filterActiveOnly={true}
                                editable={false}
                                showLastImportPrice={showLastImportPrice}
                                tableProps={{ rowSelection, scroll: { x: 'max-content', y: 'calc(100vh - 400px)' } }}
                            />
                        ),
                    },
                    ...(showPromotionalTab
                        ? [
                              {
                                  key: 'promotional',
                                  label: (
                                      <span className="text-orange-600">
                                          <GiftOutlined /> {t('sales.promotional_items')}
                                          <Badge
                                              count={new Set(promotionalItems.map(item => item.id)).size}
                                              className="ml-2"
                                              showZero={true}
                                              color="orange"
                                          />
                                      </span>
                                  ),
                                  children: (
                                      <ProductCategory
                                          onRefetchData={handleRefetchData}
                                          editable={false}
                                          filterActiveOnly={true}
                                          showLastImportPrice={showLastImportPrice}
                                          tableProps={{
                                              rowSelection: promotionalRowSelection,
                                              scroll: { x: 'max-content', y: 'calc(100vh - 400px)' },
                                          }}
                                      />
                                  ),
                              },
                          ]
                        : []),
                ]}
            />

            <div className="flex justify-end items-center gap-2 ">
                <BaseButton label={t('global.popup.reject')} onClick={onClose} />
                <BaseButton loading={loading} label={t('global.select')} type="primary" onClick={handleSave} />
            </div>
        </BaseModal>
    );
};

export default forwardRef(AddNewProductModal);
