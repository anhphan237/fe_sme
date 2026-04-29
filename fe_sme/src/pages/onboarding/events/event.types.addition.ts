
export type CompanyEventAttendanceConfirmRequest = {
  eventInstanceId: string;
};

export type CompanyEventAttendanceConfirmResponse = {
  eventInstanceId: string;
  userId?: string;
  taskId?: string;
  attended: boolean;
  status?: string;
  confirmedAt?: string;
};
