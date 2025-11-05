import { HourData, WorkingStatusEnum } from '../services/xlsx-parser';

export function getBackgroundByStatus(dateData: HourData) {
  const base = 'linear-gradient';

  if (dateData.status === WorkingStatusEnum.PENDING) {
    return `${base}(to left, #fff)`;
  } else if (dateData.status === WorkingStatusEnum.WORKING) {
    return `${base}(to left, #ff000090 100%)`;
  } else if (dateData.status === WorkingStatusEnum.START) {
    const percent = (dateData?.valueNum || 1) * 100;
    const left = 100 - percent;
    return `${base}(to left, #ff000090 ${left}%, #fff ${left}%)`;
  } else if (dateData.status === WorkingStatusEnum.FINISH) {
    const percent = (dateData?.valueNum || 1) * 100;
    const left = 100 - percent;
    const right = 100 - left;
    return `${base}(to right, #ff000090 ${right}%, #fff ${right}%)`;
  }

  return 'none';
}
