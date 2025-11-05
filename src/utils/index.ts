import dayjs from 'dayjs';
import { SSF } from 'xlsx';
import { HourData, WorkingStatusEnum } from '../services/xlsx-parser';

function convertExcelDateToJsDate(xTime: number) {
  const { y, m, d, H, M } = SSF.parse_date_code(xTime);

  return dayjs(new Date(y, m - 1, d, H, M));
}

export function getBackgroundByStatus(dateData: HourData) {
  const base = 'linear-gradient';

  if (dateData.status === WorkingStatusEnum.PENDING) {
    return `${base}(to left, #fff)`;
  } else if (dateData.status === WorkingStatusEnum.WORKING) {
    return `${base}(to left, #ff000090 100%)`;
  } else if (dateData.status === WorkingStatusEnum.START) {
    const percent =
      (convertExcelDateToJsDate(dateData?.valueNum || 1).minute() * 100) / 60;
    const left = 100 - percent;
    return `${base}(to left, #ff000090 ${left}%, #fff ${left}%)`;
  } else if (dateData.status === WorkingStatusEnum.FINISH) {
    const percent =
      (convertExcelDateToJsDate(dateData?.valueNum || 1).minute() * 100) / 60;
    const left = 100 - percent;
    const right = 100 - left;
    return `${base}(to right, #ff000090 ${right}%, #fff ${right}%)`;
  }

  return 'none';
}
