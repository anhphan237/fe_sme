export enum WarehouseStatus {
    NOT_PROCESSED = 0,     // Chưa xử lý
    PARTIALLY_PROCESSED = 1, // Xử lý một phần
    COMPLETED = 2,           // Hoàn thành
    CANCELED = 3,            // Đã huỷ
}


export enum WarehouseDocumentStatus {
    INCOMPLETE = 1, // Chưa hoàn thành
    COMPLETED = 2,  // Đã hoàn thành
}